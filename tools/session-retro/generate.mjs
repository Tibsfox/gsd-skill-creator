#!/usr/bin/env node
// session-retro generate — produce SESSION-RETRO.md for a completed mission.
//
// Combines three data sources:
//   1. Git commits since --since (or since the session's starting commit)
//   2. Pipeline report JSONs under .planning/release-cache/
//   3. Session observation log (.planning/sessions/current.jsonl or archive)
//
// Output goes to <mission-dir>/SESSION-RETRO.md.
//
// Usage:
//   node tools/session-retro/generate.mjs \
//     --mission-dir .planning/missions/release-history-tracking \
//     --since <sha>               # optional; defaults to observe.mjs meta
//     --observations <path>       # optional; defaults to current.jsonl
//     --title "Release History Feature"

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const SESSIONS_DIR = join(REPO_ROOT, '.planning', 'sessions');
const CACHE_DIR = join(REPO_ROOT, '.planning', 'release-cache');

function arg(name, fallback = null) {
  const args = process.argv.slice(2);
  const i = args.indexOf(name);
  if (i >= 0) return args[i + 1];
  const eq = args.find(a => a.startsWith(name + '='));
  return eq ? eq.slice(name.length + 1) : fallback;
}

function git(cmd) {
  try { return execSync(`git ${cmd}`, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).trim(); }
  catch { return ''; }
}

function loadObservations(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
}

function groupBy(items, keyFn) {
  const out = {};
  for (const it of items) {
    const k = keyFn(it);
    (out[k] ??= []).push(it);
  }
  return out;
}

function classifyCommit(subject) {
  const m = /^(\w+)(?:\([^)]+\))?:/.exec(subject);
  return m ? m[1] : 'other';
}

function loadPipelineReports() {
  if (!existsSync(CACHE_DIR)) return {};
  const files = readdirSync(CACHE_DIR).filter(f => f.endsWith('.json'));
  const out = {};
  for (const f of files) {
    try {
      out[f.replace(/^_/, '').replace(/\.json$/, '')] =
        JSON.parse(readFileSync(join(CACHE_DIR, f), 'utf8'));
    } catch {}
  }
  return out;
}

function main() {
  const missionDir = arg('--mission-dir');
  if (!missionDir) {
    console.error('Usage: generate.mjs --mission-dir <path> [--since <sha>] [--observations <path>] [--title <str>]');
    process.exit(1);
  }
  const missionDirAbs = resolve(REPO_ROOT, missionDir);
  const outFile = join(missionDirAbs, 'SESSION-RETRO.md');

  // Resolve session meta if available
  let meta = null;
  const metaPath = join(SESSIONS_DIR, 'current.meta.json');
  if (existsSync(metaPath)) meta = JSON.parse(readFileSync(metaPath, 'utf8'));

  const since = arg('--since') || meta?.started_commit || null;
  const obsPath = arg('--observations') || join(SESSIONS_DIR, 'current.jsonl');
  const title = arg('--title') || meta?.mission || 'Session Retrospective';

  // Commits since starting point (or fall back to recent N)
  const commitRange = since ? `${since}..HEAD` : 'HEAD~40..HEAD';
  const rawLog = git(`log --pretty=format:%H%x09%ci%x09%s ${commitRange}`);
  const commits = rawLog.split('\n').filter(Boolean).map(line => {
    const [sha, date, ...subjectParts] = line.split('\t');
    return { sha, date, subject: subjectParts.join('\t'), type: classifyCommit(subjectParts.join('\t')) };
  });

  const byType = groupBy(commits, c => c.type);
  const observations = loadObservations(obsPath);
  const byKind = groupBy(observations, o => o.kind || 'event');

  const reports = loadPipelineReports();

  const diffStat = since ? git(`diff --shortstat ${commitRange}`) : '';

  // ------ Render ------

  const lines = [];
  lines.push(`# Session Retrospective — ${title}`);
  lines.push('');
  lines.push(`_Generated ${new Date().toISOString()} from git history + pipeline reports + session observations._`);
  lines.push('');

  if (meta) {
    lines.push('## Session');
    lines.push('');
    lines.push(`- **Mission:** ${meta.mission || '—'}`);
    lines.push(`- **Started at:** ${meta.started_at || '—'}`);
    if (meta.ended_at) lines.push(`- **Ended at:** ${meta.ended_at}`);
    if (meta.started_commit) lines.push(`- **Started at commit:** \`${meta.started_commit.slice(0, 9)}\``);
    lines.push(`- **Current commit:** \`${git('rev-parse HEAD').slice(0, 9)}\``);
    lines.push('');
  }

  // ----- Work summary -----
  lines.push('## Work Summary');
  lines.push('');
  lines.push(`**${commits.length} commits** since ${since ? `\`${since.slice(0, 9)}\`` : 'recent history'}.`);
  if (diffStat) lines.push(`**Diff:** ${diffStat}`);
  lines.push('');
  lines.push('| Type | Count |');
  lines.push('|------|-------|');
  for (const [type, list] of Object.entries(byType).sort((a, b) => b[1].length - a[1].length)) {
    lines.push(`| \`${type}\` | ${list.length} |`);
  }
  lines.push('');
  lines.push('### Commits');
  lines.push('');
  for (const c of commits) {
    lines.push(`- \`${c.sha.slice(0, 9)}\` ${c.subject}`);
  }
  lines.push('');

  // ----- System summary / pipeline reports -----
  if (Object.keys(reports).length > 0) {
    lines.push('## Pipeline Metrics');
    lines.push('');
    for (const [name, data] of Object.entries(reports).sort()) {
      const relevantKeys = Object.keys(data).filter(k =>
        typeof data[k] === 'number' || typeof data[k] === 'string' || typeof data[k] === 'boolean'
      );
      if (relevantKeys.length === 0) continue;
      lines.push(`### ${name}`);
      lines.push('');
      for (const k of relevantKeys.slice(0, 20)) {
        const v = data[k];
        if (typeof v === 'string' && v.length > 200) continue;
        lines.push(`- **${k}**: ${v}`);
      }
      lines.push('');
    }
  }

  // ----- Observations -----
  if (observations.length > 0) {
    lines.push('## Observations');
    lines.push('');
    lines.push(`${observations.length} events logged during the session.`);
    lines.push('');
    lines.push('| Kind | Count |');
    lines.push('|------|-------|');
    for (const [kind, list] of Object.entries(byKind).sort((a, b) => b[1].length - a[1].length)) {
      lines.push(`| \`${kind}\` | ${list.length} |`);
    }
    lines.push('');
    for (const [kind, list] of Object.entries(byKind).sort()) {
      lines.push(`### ${kind} (${list.length})`);
      lines.push('');
      for (const e of list) {
        const payload = e.payload ? ` — \`${JSON.stringify(e.payload).slice(0, 100)}\`` : '';
        lines.push(`- \`${e.t?.slice(11, 19) || '—'}\` **${e.label}**${payload}`);
      }
      lines.push('');
    }
  } else {
    lines.push('## Observations');
    lines.push('');
    lines.push('_No observation log was captured for this session. Use `tools/session-retro/observe.mjs` to record live events on the next run._');
    lines.push('');
  }

  // ----- Placeholders for human additions -----
  lines.push('## What Worked (human-authored)');
  lines.push('');
  lines.push('_Fill in the wins from this session — specific moments, decisions, or techniques that paid off. Examples: clean commit grouping, idempotent pipeline, background monitor pattern._');
  lines.push('');
  lines.push('## What Could Be Better (human-authored)');
  lines.push('');
  lines.push('_Fill in the friction — hook fires, redundant edits, ambiguous authorizations, missing skills. Examples in this repo: 35+ read-before-edit hook fires, no batch-rewrite tool for 11-script cascades._');
  lines.push('');
  lines.push('## Recommendations for gsd-skill-creator');
  lines.push('');
  lines.push('_New skills, agents, chipsets, or process improvements suggested by this session. Link to the relevant observations above as evidence._');
  lines.push('');
  lines.push('## Open Items');
  lines.push('');
  lines.push('_Carry-forward work items discovered during the session but not addressed. Will surface in the next mission\'s planning._');
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push(`_Source: git log \`${commitRange}\`, \`.planning/release-cache/*.json\`, \`${obsPath.replace(REPO_ROOT + '/', '')}\`._`);
  lines.push(`_Regenerate any time: \`node tools/session-retro/generate.mjs --mission-dir ${missionDir}\`._`);

  writeFileSync(outFile, lines.join('\n'));
  console.error(`[session-retro] wrote ${outFile}`);
  console.log(JSON.stringify({
    output: outFile.replace(REPO_ROOT + '/', ''),
    commits: commits.length,
    observations: observations.length,
    pipeline_reports: Object.keys(reports).length,
    commit_types: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, v.length])),
  }, null, 2));
}

main();
