#!/usr/bin/env node
/**
 * agent-adoption-scan.mjs — static analysis: which installed agents have real
 * dispatch sites?
 *
 * Added v1.49.975 (Ship 2.3 of the 2026-06-03 core-functions audit plan —
 * "agent adoption scan + retire dormant agents"). The audit found that src/
 * modules have adoption telemetry (tools/adoption-scan.mjs) but the AGENT tier
 * had no equivalent: the project could not distinguish a living, dispatched
 * agent from vestigial shelfware. This is the agent-tier sibling of
 * tools/adoption-scan.mjs.
 *
 * THE KEY DIFFERENCE FROM THE src/ SCANNER (and from the audit's premise):
 *   On Claude Code, agents are dispatched two ways:
 *     1. SCRIPTED — a workflow/command/skill/team file names the agent
 *        (subagent_type="gsd-executor", an Agent-definitions table, a team
 *        config.json agentType). These are the "dispatch sites" this scanner
 *        greps — the agent analog of a non-test import.
 *     2. DESCRIPTION-DISPATCHED — the model invokes the agent by matching its
 *        `description` frontmatter ("Invoke when unsure which GSD command to
 *        run"). These agents have NO scripted site by design.
 *   A scan can only see (1). So a zero-site result is NOT proof of dormancy —
 *   description-dispatched agents (gsd-orchestrator, the generic-infra review
 *   agents) read "dormant" here but are load-bearing. That is exactly what the
 *   ALLOWLIST is for (mirroring how the src/ scanner allowlists modules consumed
 *   via dynamic require / shell CLI that its static import-graph can't see).
 *   See docs/AGENT-ADOPTION-VERDICTS.md for the per-agent disposition.
 *
 * What this scans:
 *   Units of adoption = the agent ids (filename stems) under the agents dir
 *   (default: project-claude/agents/ — the source-of-truth — falling back to
 *   .claude/agents/ when running inside an installed project). For each agent
 *   id, every file in the dispatch corpus is checked for a whole-token mention
 *   of the id, classified by the corpus class the file belongs to:
 *     - workflow  : .claude/get-shit-done/workflows/*
 *     - template  : .claude/get-shit-done/templates/*
 *     - command   : .claude/commands/* and project-claude/commands/*
 *     - skill     : .claude/skills/<x>/SKILL.md and project-claude/skills/*
 *     - team      : .claude/teams/<x>/config.json and project-claude/teams/*
 *     - test      : a *.test.* / __tests__/ corpus file (fixture reference)
 *   Agent-definition files themselves (any path with an /agents/ segment) are
 *   excluded from the corpus — an agent defining itself is not a dispatch.
 *
 * Per-agent status verdicts (mirrors adoption-scan.mjs finalizeRecord):
 *   - living     : >=1 real dispatch site (workflow|template|command|skill|team)
 *   - test-only  : sites exist BUT all are test/fixture files
 *   - dormant    : zero dispatch sites anywhere (the agent analog of "isolated")
 *
 * Output:
 *   - default       : markdown report, dormant candidates surfaced first
 *   - --json        : machine-readable JSON array of AgentAdoptionRecord
 *   - --dormant-threshold N : flag non-allowlisted agents with refCount < N
 *
 * Exit codes:
 *   0   scan succeeded (no dormant-threshold violations OR threshold not set)
 *   1   --dormant-threshold N triggered (non-allowlisted agent below threshold)
 *   2   fatal error (agents dir missing)
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative, sep, basename } from 'node:path';

const args = process.argv.slice(2);
const JSON_OUTPUT = args.includes('--json');
const thresholdIdx = args.indexOf('--dormant-threshold');
const DORMANT_THRESHOLD = thresholdIdx >= 0 ? Number(args[thresholdIdx + 1]) : null;
const ROOT_IDX = args.indexOf('--root');
const ROOT = resolve(ROOT_IDX >= 0 ? args[ROOT_IDX + 1] : process.cwd());
const agentsDirIdx = args.indexOf('--agents-dir');
const allowlistIdx = args.indexOf('--allowlist');
const ALLOWLIST_PATH = allowlistIdx >= 0
  ? resolve(args[allowlistIdx + 1])
  : join(ROOT, 'tools', 'agent-adoption-scan.allowlist.json');
const NO_ALLOWLIST = args.includes('--no-allowlist');

// ─── Agents-dir resolution ──────────────────────────────────────────────────
// Default to the source-of-truth (project-claude/agents/) so the scan is
// meaningful against tracked sources; fall back to the installed set
// (.claude/agents/) when run inside an installed project where only that exists.
function resolveAgentsDir() {
  if (agentsDirIdx >= 0) return resolve(args[agentsDirIdx + 1]);
  const sot = join(ROOT, 'project-claude', 'agents');
  if (existsSync(sot)) return sot;
  return join(ROOT, '.claude', 'agents');
}
const AGENTS_DIR = resolveAgentsDir();

if (!existsSync(AGENTS_DIR)) {
  console.error(`[agent-adoption-scan] FATAL: agents dir not found at ${AGENTS_DIR}`);
  process.exit(2);
}

// ─── Dispatch corpus ──────────────────────────────────────────────────────────
// Directories that may contain agent dispatch sites. Each entry maps a path
// (relative to ROOT) to its reference class. Directories absent on disk are
// silently skipped — so the scan degrades gracefully where only part of the
// installed surface is present.
const CORPUS_DIRS = [
  { rel: '.claude/get-shit-done/workflows', cls: 'workflow' },
  { rel: '.claude/get-shit-done/templates', cls: 'template' },
  { rel: '.claude/commands', cls: 'command' },
  { rel: 'project-claude/commands', cls: 'command' },
  { rel: '.claude/skills', cls: 'skill' },
  { rel: 'project-claude/skills', cls: 'skill' },
  { rel: '.claude/teams', cls: 'team' },
  { rel: 'project-claude/teams', cls: 'team' },
];

// ─── Allowlist loading (mirrors adoption-scan.mjs) ────────────────────────────
/**
 * Load operator-curated exemptions. Returns Map<agent, reason>. Allowlist
 * entries do NOT change an agent's status — they only prevent the
 * --dormant-threshold flag from triggering on the agent. Every record still
 * reports `allowlisted` + `allowlistReason` so the report surfaces the
 * exemption transparently.
 */
function loadAllowlist() {
  if (NO_ALLOWLIST) return new Map();
  if (!existsSync(ALLOWLIST_PATH)) return new Map();
  try {
    const raw = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'));
    const map = new Map();
    for (const e of raw.entries ?? []) {
      // `agent` is the agent-tier field name; accept `module` as a fallback so
      // the schema stays recognisable next to the src/ allowlist.
      const key = e.agent ?? e.module;
      if (!key) continue;
      map.set(key, e.reason ?? '(no reason given)');
    }
    return map;
  } catch (err) {
    console.error(`[agent-adoption-scan] WARN: cannot parse allowlist at ${ALLOWLIST_PATH}: ${err.message}`);
    return new Map();
  }
}

// ─── Enumeration ──────────────────────────────────────────────────────────────
function listAgents() {
  return readdirSync(AGENTS_DIR, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md') && e.name !== 'README.md')
    .map((e) => basename(e.name, '.md'))
    .sort();
}

function* walkCorpusFiles(dir) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules') continue;
      // Agent-definition files never count as a dispatch site.
      if (ent.name === 'agents') continue;
      yield* walkCorpusFiles(p);
    } else if (ent.isFile() && /\.(?:md|json)$/.test(p)) {
      yield p;
    }
  }
}

function isTestPath(absPath) {
  return absPath.includes(`${sep}__tests__${sep}`) || /\.test\.[mc]?[tj]sx?$/.test(absPath);
}

// A whole-token match: the id is bounded by a non-(word|hyphen) char on each
// side, so `doc-linter` does not match inside `doc-linter-x` and `gsd-doc`
// does not match inside `gsd-doc-writer`.
function tokenRegex(id) {
  const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\w-])${esc}([^\\w-]|$)`);
}

// ─── Scan ────────────────────────────────────────────────────────────────────
function scan() {
  const allowlist = loadAllowlist();
  const agents = listAgents();
  const matchers = agents.map((a) => ({ agent: a, re: tokenRegex(a) }));
  const records = new Map();
  for (const a of agents) {
    records.set(a, {
      agent: a,
      workflowRefs: new Set(),
      templateRefs: new Set(),
      commandRefs: new Set(),
      skillRefs: new Set(),
      teamRefs: new Set(),
      testRefs: new Set(),
    });
  }

  const corpusFiles = [];
  for (const { rel, cls } of CORPUS_DIRS) {
    const abs = join(ROOT, rel);
    if (!existsSync(abs)) continue;
    for (const file of walkCorpusFiles(abs)) corpusFiles.push({ file, cls });
  }

  for (const { file, cls } of corpusFiles) {
    const content = readFileSync(file, 'utf8');
    const relForReport = relative(ROOT, file);
    const effClass = isTestPath(file) ? 'test' : cls;
    for (const { agent, re } of matchers) {
      if (!re.test(content)) continue;
      const rec = records.get(agent);
      if (effClass === 'workflow') rec.workflowRefs.add(relForReport);
      else if (effClass === 'template') rec.templateRefs.add(relForReport);
      else if (effClass === 'command') rec.commandRefs.add(relForReport);
      else if (effClass === 'skill') rec.skillRefs.add(relForReport);
      else if (effClass === 'team') rec.teamRefs.add(relForReport);
      else if (effClass === 'test') rec.testRefs.add(relForReport);
    }
  }

  return agents.map((a) => finalizeRecord(records.get(a), allowlist));
}

function finalizeRecord(raw, allowlist) {
  const realRefCount =
    raw.workflowRefs.size + raw.templateRefs.size + raw.commandRefs.size +
    raw.skillRefs.size + raw.teamRefs.size;
  const testRefCount = raw.testRefs.size;
  let status;
  if (realRefCount > 0) status = 'living';
  else if (testRefCount > 0) status = 'test-only';
  else status = 'dormant';
  const allowlisted = allowlist.has(raw.agent);
  return {
    agent: raw.agent,
    workflowRefs: [...raw.workflowRefs].sort(),
    templateRefs: [...raw.templateRefs].sort(),
    commandRefs: [...raw.commandRefs].sort(),
    skillRefs: [...raw.skillRefs].sort(),
    teamRefs: [...raw.teamRefs].sort(),
    testRefs: [...raw.testRefs].sort(),
    realRefCount,
    testRefCount,
    status,
    allowlisted,
    allowlistReason: allowlisted ? allowlist.get(raw.agent) : null,
  };
}

// ─── Output formatting ───────────────────────────────────────────────────────
function topSites(r) {
  const all = [...r.workflowRefs, ...r.commandRefs, ...r.skillRefs, ...r.teamRefs, ...r.templateRefs];
  if (all.length === 0) return '—';
  return all.slice(0, 4).map((s) => `\`${s}\``).join(', ') + (all.length > 4 ? ` (+${all.length - 4})` : '');
}

function formatMarkdown(records) {
  const lines = [];
  lines.push('# Agent Adoption Scan Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Root: \`${relative(process.cwd(), ROOT) || '.'}\``);
  lines.push(`Agents dir: \`${relative(ROOT, AGENTS_DIR) || '.'}\``);
  lines.push('');

  const dormant = records.filter((r) => r.status === 'dormant');
  const testOnly = records.filter((r) => r.status === 'test-only');
  const living = records.filter((r) => r.status === 'living');

  lines.push(`**Summary:** ${records.length} agents — ${living.length} living · ${testOnly.length} test-only · ${dormant.length} dormant.`);
  lines.push('');
  lines.push('**What this measures:** scripted-dispatch-site adoption. An agent is "living" if >=1 workflow, command, skill, or team file names it. Agents invoked by Claude Code DESCRIPTION-MATCH (not a scripted `subagent_type=`) have no site to find and will read "dormant" here even when load-bearing — that is what the allowlist is for. See `docs/AGENT-ADOPTION-VERDICTS.md`.');
  lines.push('');

  if (dormant.length > 0) {
    const cand = dormant.filter((r) => !r.allowlisted);
    const allow = dormant.filter((r) => r.allowlisted);
    lines.push('## Dormant agents (no scripted dispatch site)');
    lines.push('');
    if (cand.length > 0) {
      lines.push('### Retire candidates (not allowlisted)');
      lines.push('');
      lines.push('| Agent | test refs |');
      lines.push('|-------|----------:|');
      for (const r of cand) lines.push(`| \`${r.agent}\` | ${r.testRefCount} |`);
      lines.push('');
    }
    if (allow.length > 0) {
      lines.push('### Allowlisted (description-dispatched, parked, or script-twin)');
      lines.push('');
      lines.push('| Agent | reason |');
      lines.push('|-------|--------|');
      for (const r of allow) lines.push(`| \`${r.agent}\` | ${r.allowlistReason} |`);
      lines.push('');
    }
  }

  if (testOnly.length > 0) {
    lines.push('## Test-only agents (referenced only from fixtures)');
    lines.push('');
    lines.push('| Agent | test refs |');
    lines.push('|-------|----------:|');
    for (const r of testOnly.sort((a, b) => a.agent.localeCompare(b.agent))) {
      lines.push(`| \`${r.agent}\` | ${r.testRefCount} |`);
    }
    lines.push('');
  }

  lines.push('## Living agents (>=1 dispatch site)');
  lines.push('');
  lines.push('| Agent | sites | test refs | dispatch sites |');
  lines.push('|-------|------:|----------:|----------------|');
  for (const r of living.sort((a, b) => a.realRefCount - b.realRefCount)) {
    lines.push(`| \`${r.agent}\` | ${r.realRefCount} | ${r.testRefCount} | ${topSites(r)} |`);
  }
  lines.push('');
  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────
function exitWhenDrained(code) {
  // Avoid truncating buffered stdout/stderr past the OS pipe buffer (~64KB).
  // See Lesson #10420 (adoption-scan.mjs).
  if (process.stdout.writableLength === 0 && process.stderr.writableLength === 0) {
    process.exit(code);
    return;
  }
  let waiting = 2;
  const maybeExit = () => { if (--waiting === 0) process.exit(code); };
  if (process.stdout.writableLength === 0) waiting -= 1;
  else process.stdout.once('drain', maybeExit);
  if (process.stderr.writableLength === 0) waiting -= 1;
  else process.stderr.once('drain', maybeExit);
  if (waiting === 0) process.exit(code);
}

function main() {
  const records = scan();
  if (JSON_OUTPUT) {
    process.stdout.write(JSON.stringify(records, null, 2) + '\n');
  } else {
    process.stdout.write(formatMarkdown(records));
  }
  if (DORMANT_THRESHOLD !== null && !Number.isNaN(DORMANT_THRESHOLD)) {
    const dormant = records.filter(
      (r) => r.realRefCount < DORMANT_THRESHOLD && !r.allowlisted,
    );
    if (dormant.length > 0) {
      console.error(`[agent-adoption-scan] THRESHOLD: ${dormant.length} non-allowlisted agent(s) below realRefCount<${DORMANT_THRESHOLD}`);
      for (const r of dormant) {
        console.error(`  - ${r.agent} (status=${r.status}, sites=${r.realRefCount}, testRefs=${r.testRefCount})`);
      }
      exitWhenDrained(1);
      return;
    }
  }
  exitWhenDrained(0);
}

main();
