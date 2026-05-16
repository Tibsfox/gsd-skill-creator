#!/usr/bin/env node
/**
 * Skill-audit runner — v0.1
 *
 * Reads the probe bank under `.planning/patterns/skill-audits/probes/<skill>/probes.md`
 * and the skill body under `.claude/skills/<skill>/SKILL.md`, then emits a
 * "dispatch plan" markdown document listing the paired Agent prompts to
 * dispatch for each probe (with-skill and without-skill).
 *
 * v0.1 SCOPE:
 *   - `plan` subcommand only.
 *   - Does NOT actually dispatch sub-agents (that requires a Claude
 *     session with the Agent tool — the plan is meant to be read and
 *     executed by such a session).
 *
 * FUTURE (v0.2):
 *   - `collect` subcommand: reads per-probe trace files dropped under
 *     `.planning/patterns/skill-audits/traces/<date>/<probe-id>-{A,B}.md`
 *     and aggregates them into the per-skill audit report.
 *
 * USAGE:
 *   node tools/skill-audit/run.mjs plan                       # all skills
 *   node tools/skill-audit/run.mjs plan --skill intent-router # one skill
 *   node tools/skill-audit/run.mjs plan --out audit-plan.md   # write to file
 *   node tools/skill-audit/run.mjs list                       # list available skills + probe counts
 *
 * Reads:  .planning/patterns/skill-audits/probes/<skill>/probes.md
 *         .claude/skills/<skill>/SKILL.md
 * Writes: stdout (or --out path) — single markdown document
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const PROBES_DIR = join(REPO_ROOT, '.planning', 'patterns', 'skill-audits', 'probes');
const SKILLS_DIR = join(REPO_ROOT, '.claude', 'skills');

// ─── Argument parsing ──────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const subcommand = argv[0];

function getFlag(name, defaultValue = null) {
  const idx = argv.indexOf(name);
  if (idx === -1) return defaultValue;
  if (idx + 1 >= argv.length || argv[idx + 1].startsWith('--')) return true;
  return argv[idx + 1];
}

// ─── Probe-bank parsing ────────────────────────────────────────────────────

/**
 * Parse a probes.md file into structured probe records.
 *
 * Format (per the bank README): each probe is a markdown section starting
 * with `### <ID> — <title>`. Fields are picked up by header pattern:
 *   - **Category:** <text>
 *   - **Domain:** <text>
 *   - **Goal:** followed by a blockquote `> <multi-line text>`
 *
 * The Goal blockquote is the verbatim prompt passed to both with-skill and
 * without-skill agents.
 */
function parseProbes(content) {
  const probes = [];
  // Skip the document frontmatter and intro; split on `### ` headings.
  const sections = content.split(/\n(?=### )/g);
  for (const section of sections) {
    if (!section.startsWith('### ')) continue;
    const titleMatch = section.match(/^### ([\w-]+) — (.+?)$/m);
    if (!titleMatch) continue;
    const id = titleMatch[1];
    const title = titleMatch[2].trim();

    const categoryMatch = section.match(/\*\*Category:\*\*\s*(.+?)\s*\n/);
    const domainMatch = section.match(/\*\*Domain:\*\*\s*(.+?)\s*\n/);

    // Goal blockquote: a contiguous block of `> ` prefixed lines after
    // the **Goal** marker.
    const goalMatch = section.match(/\*\*Goal[^*]*?:\*\*[\s\S]*?\n((?:>.*\n?)+)/);
    let goal = null;
    if (goalMatch) {
      goal = goalMatch[1]
        .split('\n')
        .filter((l) => l.trim().startsWith('>'))
        .map((l) => l.replace(/^>\s?/, ''))
        .join('\n')
        .trim();
    }

    probes.push({
      id,
      title,
      category: categoryMatch ? categoryMatch[1].trim() : 'unknown',
      domain: domainMatch ? domainMatch[1].trim() : 'unknown',
      goal,
    });
  }
  return probes;
}

// ─── Skill-body extraction ─────────────────────────────────────────────────

/**
 * Read a SKILL.md and return its policy body, stripped of YAML
 * frontmatter. The body is what we inline into with-skill agent prompts.
 */
function readSkillBody(skillName) {
  const path = join(SKILLS_DIR, skillName, 'SKILL.md');
  if (!existsSync(path)) {
    throw new Error(`SKILL.md not found for ${skillName} at ${path}`);
  }
  const raw = readFileSync(path, 'utf8');
  // Strip frontmatter (between leading `---` and the next `---`).
  const stripped = raw.replace(/^---\n[\s\S]*?\n---\n/, '');
  return stripped.trim();
}

// ─── Skill discovery ───────────────────────────────────────────────────────

function listAuditableSkills() {
  if (!existsSync(PROBES_DIR)) return [];
  return readdirSync(PROBES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => {
      const probesPath = join(PROBES_DIR, name, 'probes.md');
      return existsSync(probesPath);
    });
}

function loadSkillBundle(skillName) {
  const probesPath = join(PROBES_DIR, skillName, 'probes.md');
  const probesContent = readFileSync(probesPath, 'utf8');
  const probes = parseProbes(probesContent);
  // Distinguish deferred banks (probe_count = 0 in frontmatter)
  const probeCountMatch = probesContent.match(/probe_count:\s*(\d+)/);
  const declaredProbeCount = probeCountMatch ? parseInt(probeCountMatch[1], 10) : null;
  const skillBody = declaredProbeCount === 0 ? null : readSkillBody(skillName);
  return { skill: skillName, probes, skillBody, declaredProbeCount };
}

// ─── Dispatch-plan emission ────────────────────────────────────────────────

function dispatchPlanFor(skillName) {
  const { probes, skillBody, declaredProbeCount } = loadSkillBundle(skillName);
  const lines = [];

  lines.push(`## ${skillName}`);
  lines.push('');
  if (declaredProbeCount === 0) {
    lines.push(
      `**Status:** deferred bank — no probes to dispatch. See ` +
        `\`.planning/patterns/skill-audits/probes/${skillName}/probes.md\` for the defer rationale.`,
    );
    lines.push('');
    return lines.join('\n');
  }
  lines.push(`**Probes to dispatch:** ${probes.length} × 2 = ${probes.length * 2} sub-agents`);
  lines.push('');

  for (const probe of probes) {
    if (probe.goal === null) {
      lines.push(`### ${probe.id} — ${probe.title} (SKIPPED: no Goal blockquote found)`);
      lines.push('');
      continue;
    }
    lines.push(`### ${probe.id} — ${probe.title}`);
    lines.push('');
    lines.push(`- Category: \`${probe.category}\``);
    lines.push(`- Domain: \`${probe.domain}\``);
    lines.push('');

    // With-skill brief
    lines.push(`#### Dispatch A (with skill)`);
    lines.push('');
    lines.push('```');
    lines.push(renderPrompt(skillName, probe, /* withSkill */ true, skillBody));
    lines.push('```');
    lines.push('');

    // Without-skill brief
    lines.push(`#### Dispatch B (without skill)`);
    lines.push('');
    lines.push('```');
    lines.push(renderPrompt(skillName, probe, /* withSkill */ false, skillBody));
    lines.push('```');
    lines.push('');
  }
  return lines.join('\n');
}

function renderPrompt(skillName, probe, withSkill, skillBody) {
  const header =
    `You are in a counterfactual-trace audit. Your trace is being compared against a ` +
    `paired ${withSkill ? 'no-skill' : 'with-skill'} agent. Behave naturally; report your trace honestly.\n\n` +
    `**Working directory:** ${REPO_ROOT}\n`;
  const policy = withSkill
    ? `\n**Policy (skill under audit — ${skillName}):**\n\n${skillBody}\n`
    : `\n**No special skill is loaded.** Approach the task as you normally would.\n`;
  const task = `\n**The probe task:**\n\n${probe.goal}\n`;
  const footer =
    `\n**Report format:**\n` +
    `\`\`\`\n` +
    `## TRACE\n[Each tool call, 1-line tagged]\n\n` +
    `## PHASES\n[2-6 named phases]\n\n` +
    `## FINAL ANSWER\n[Verbatim answer to the probe]\n` +
    `\`\`\`\n\n` +
    `Don't expand scope beyond the probe.`;
  return header + policy + task + footer;
}

// ─── Subcommands ───────────────────────────────────────────────────────────

function cmdPlan() {
  const single = getFlag('--skill');
  const outPath = getFlag('--out');
  const skills = single ? [single] : listAuditableSkills();
  if (skills.length === 0) {
    console.error('No skills with probe banks found at', PROBES_DIR);
    process.exit(1);
  }

  const header =
    `# Skill-audit dispatch plan\n\n` +
    `**Generated:** ${new Date().toISOString()}\n` +
    `**Source:** \`tools/skill-audit/run.mjs plan${single ? ` --skill ${single}` : ''}\`\n\n` +
    `## How to use this plan\n\n` +
    `1. Each \`### <PROBE-ID> — <title>\` section below contains two prompts (Dispatch A, Dispatch B).\n` +
    `2. From a Claude session, dispatch both prompts as parallel Agent calls (\`subagent_type: general-purpose\`, \`run_in_background: true\`).\n` +
    `3. Collect each completed sub-agent's TRACE / PHASES / FINAL ANSWER block.\n` +
    `4. (Future v0.2) Save each trace as \`.planning/patterns/skill-audits/traces/<date>/<probe-id>-{A,B}.md\` and run \`run.mjs collect <date>\` to aggregate.\n\n` +
    `Total: ${skills.reduce((acc, s) => {
      try {
        const { probes, declaredProbeCount } = loadSkillBundle(s);
        return acc + (declaredProbeCount === 0 ? 0 : probes.length * 2);
      } catch {
        return acc;
      }
    }, 0)} sub-agent dispatches across ${skills.length} skill(s).\n\n` +
    `---\n`;

  const body = skills.map((s) => {
    try {
      return dispatchPlanFor(s);
    } catch (err) {
      return `## ${s}\n\nERROR: ${err.message}\n`;
    }
  }).join('\n---\n\n');

  const output = header + '\n' + body;

  if (outPath) {
    writeFileSync(outPath, output);
    console.error(`Wrote dispatch plan to ${outPath} (${output.length} bytes)`);
  } else {
    process.stdout.write(output);
  }
}

function cmdList() {
  const skills = listAuditableSkills();
  if (skills.length === 0) {
    console.log('No probe banks found.');
    return;
  }
  console.log('Auditable skills:');
  for (const skill of skills) {
    try {
      const { probes, declaredProbeCount } = loadSkillBundle(skill);
      const status = declaredProbeCount === 0 ? 'DEFERRED' : `${probes.length} probes`;
      console.log(`  ${skill.padEnd(36)} ${status}`);
    } catch (err) {
      console.log(`  ${skill.padEnd(36)} ERROR: ${err.message}`);
    }
  }
}

function cmdHelp() {
  console.log(`Skill-audit runner v0.1

USAGE:
  node tools/skill-audit/run.mjs <subcommand> [options]

SUBCOMMANDS:
  list                     List auditable skills + probe counts
  plan                     Emit dispatch plan (paired prompts per probe)
    --skill <name>         Only emit plan for one skill
    --out <path>           Write to file instead of stdout
  help                     Show this help

PROBE BANK LOCATION:
  ${PROBES_DIR}

SKILL BODY LOCATION:
  ${SKILLS_DIR}

EXAMPLES:
  node tools/skill-audit/run.mjs list
  node tools/skill-audit/run.mjs plan --skill intent-router
  node tools/skill-audit/run.mjs plan --out /tmp/audit-plan.md
`);
}

// ─── Entry ─────────────────────────────────────────────────────────────────

switch (subcommand) {
  case 'plan':
    cmdPlan();
    break;
  case 'list':
    cmdList();
    break;
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    cmdHelp();
    break;
  default:
    console.error(`Unknown subcommand: ${subcommand}`);
    cmdHelp();
    process.exit(1);
}
