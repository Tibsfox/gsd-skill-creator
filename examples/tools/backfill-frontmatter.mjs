#!/usr/bin/env node
// examples/tools/backfill-frontmatter.mjs
//
// Idempotently ADDS missing fields from the 9-field frontmatter convention
// to every artifact in examples/. Existing frontmatter is preserved verbatim
// — we do NOT re-parse and re-serialize (which would lose arrays and nested
// structures). We just append any missing fields before the closing `---`.
//
// Defaults:
//   origin: tibsfox
//   modified: false
//   status: stable
//   first_seen: 2026-04-10 (Stage 2 date)
//   first_path: examples/<type>/<name>
//
// Known overrides (see CHANGELOG.md 2026-02-07 Taches entry):
//   decision-framework, context-handoff, hook-recipes, security-reviewer, doc-linter
//     → origin: taches-cc-resources, modified: true
//
// For teams and chipsets (which do not have YAML frontmatter in their primary
// file), this script writes or updates a README.md sidecar with frontmatter.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { argv, exit } from 'node:process';

const STAGE_2_DATE = '2026-04-10';

const TACHES_OVERRIDES = new Set([
  'decision-framework', 'context-handoff', 'hook-recipes',
  'security-reviewer', 'doc-linter',
]);

const SKILL_CATEGORIES = new Set([
  'gsd', 'research', 'media', 'dev', 'ops',
  'workflow', 'patterns', 'orchestration', 'state', 'deprecated',
]);
const AGENT_CATEGORIES = new Set([
  'gsd', 'research', 'media', 'dev', 'ops', 'ui', 'audit', 'deprecated',
]);
const TEAM_CATEGORIES = new Set(['code', 'ops', 'infra', 'migration', 'deprecated']);

// ─── Frontmatter surgery ────────────────────────────────────────────────────
// We treat the frontmatter block as text. No full YAML parsing. We detect
// whether each required key exists by looking for a line that starts with
// `<key>:` at column 0 of the frontmatter block. If missing, we append.

function splitFrontmatter(content) {
  if (!content.startsWith('---\n')) {
    return { hadFm: false, block: '', body: content };
  }
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return { hadFm: false, block: '', body: content };
  return {
    hadFm: true,
    block: content.slice(4, end),           // between --- and ---
    body: content.slice(end + 5),            // after closing ---
  };
}

function hasKey(block, key) {
  // Match `<key>:` at start of a line within the frontmatter block
  const re = new RegExp(`^${key}\\s*:`, 'm');
  return re.test(block);
}

function formatScalar(v) {
  if (v === null) return 'null';
  if (v === true) return 'true';
  if (v === false) return 'false';
  if (typeof v === 'number') return String(v);
  const s = String(v);
  if (/[:#&*!|>{}\[\]\n"'%@`]/.test(s) || s.includes(': ')) {
    return `"${s.replace(/"/g, '\\"')}"`;
  }
  return s;
}

function buildAppendBlock(missing) {
  // Order: name, type, category, status, origin, modified, first_seen, first_path, description, superseded_by
  const order = [
    'name', 'type', 'category', 'status',
    'origin', 'modified',
    'first_seen', 'first_path',
    'description', 'superseded_by',
  ];
  const lines = [];
  for (const k of order) {
    if (k in missing) lines.push(`${k}: ${formatScalar(missing[k])}`);
  }
  return lines.join('\n');
}

function appendMissingFields(content, defaults) {
  const { hadFm, block, body } = splitFrontmatter(content);
  const missing = {};
  for (const [k, v] of Object.entries(defaults)) {
    if (hadFm && hasKey(block, k)) continue;
    missing[k] = v;
  }
  if (Object.keys(missing).length === 0) {
    return { action: 'no-change', content };
  }
  const appendText = buildAppendBlock(missing);

  let newContent;
  if (!hadFm) {
    // File has no frontmatter at all — create one from the defaults
    newContent = `---\n${appendText}\n---\n${content}`;
    return { action: 'added-frontmatter', content: newContent };
  }

  // Append missing fields at the end of the existing block, preserving everything
  const trimmed = block.replace(/\n+$/, '');
  newContent = `---\n${trimmed}\n${appendText}\n---\n${body.replace(/^\n/, '')}`;
  return { action: 'appended-fields', content: newContent };
}

// ─── Defaults computation ───────────────────────────────────────────────────

function computeDefaults(name, type, category) {
  const defaults = {
    name,
    type: type.replace(/s$/, ''),
    category,
    status: 'stable',
    origin: 'tibsfox',
    modified: false,
    first_seen: STAGE_2_DATE,
    first_path: `examples/${type}/${name}`,
    description: null,
    superseded_by: null,
  };
  if (TACHES_OVERRIDES.has(name)) {
    defaults.origin = 'taches-cc-resources';
    defaults.modified = true;
  }
  if (category === 'deprecated') {
    defaults.status = 'deprecated';
  }
  return defaults;
}

// ─── File handlers ──────────────────────────────────────────────────────────

async function backfillMdFile(path, name, type, category, dryRun) {
  const content = await readFile(path, 'utf8');
  const defaults = computeDefaults(name, type, category);
  const result = appendMissingFields(content, defaults);
  if (result.action !== 'no-change' && !dryRun) {
    await writeFile(path, result.content);
  }
  return { action: result.action, path };
}

async function ensureReadmeForDir(dirPath, name, type, category, dryRun) {
  const readmePath = join(dirPath, 'README.md');
  const defaults = computeDefaults(name, type, category);

  let content;
  let exists = false;
  if (existsSync(readmePath)) {
    content = await readFile(readmePath, 'utf8');
    exists = true;
  } else {
    const metaFile = type === 'chipsets' ? 'chipset.yaml' : 'config.json';
    content = `\n# ${name}\n\nSee \`${metaFile}\` for the definition.\n`;
  }

  const result = appendMissingFields(content, defaults);
  if (result.action !== 'no-change' && !dryRun) {
    await writeFile(readmePath, result.content);
  }

  if (result.action === 'no-change') return { action: 'no-change', path: readmePath };
  if (!exists) return { action: 'created-sidecar', path: readmePath };
  return { action: 'updated-sidecar', path: readmePath };
}

// ─── Walker ─────────────────────────────────────────────────────────────────

async function walkAndBackfill(root, dryRun) {
  const results = [];

  // skills
  const skillsDir = join(root, 'skills');
  if (existsSync(skillsDir)) {
    for (const catEnt of await readdir(skillsDir, { withFileTypes: true })) {
      if (!catEnt.isDirectory() || !SKILL_CATEGORIES.has(catEnt.name)) continue;
      const catDir = join(skillsDir, catEnt.name);
      for (const e of await readdir(catDir, { withFileTypes: true })) {
        if (e.name.startsWith('.') || e.name === 'README.md') continue;
        if (!e.isDirectory()) continue;
        const md = join(catDir, e.name, 'SKILL.md');
        if (!existsSync(md)) continue;
        results.push(await backfillMdFile(md, e.name, 'skills', catEnt.name, dryRun));
      }
    }
  }

  // agents
  const agentsDir = join(root, 'agents');
  if (existsSync(agentsDir)) {
    for (const catEnt of await readdir(agentsDir, { withFileTypes: true })) {
      if (!catEnt.isDirectory() || !AGENT_CATEGORIES.has(catEnt.name)) continue;
      const catDir = join(agentsDir, catEnt.name);
      for (const e of await readdir(catDir, { withFileTypes: true })) {
        if (e.name.startsWith('.') || e.name === 'README.md') continue;
        if (!e.isDirectory()) continue;
        const md = join(catDir, e.name, 'AGENT.md');
        if (!existsSync(md)) continue;
        results.push(await backfillMdFile(md, e.name, 'agents', catEnt.name, dryRun));
      }
    }
  }

  // teams (sidecar)
  const teamsDir = join(root, 'teams');
  if (existsSync(teamsDir)) {
    for (const catEnt of await readdir(teamsDir, { withFileTypes: true })) {
      if (!catEnt.isDirectory() || !TEAM_CATEGORIES.has(catEnt.name)) continue;
      const catDir = join(teamsDir, catEnt.name);
      for (const e of await readdir(catDir, { withFileTypes: true })) {
        if (e.name.startsWith('.') || e.name === 'README.md') continue;
        if (!e.isDirectory()) continue;
        results.push(await ensureReadmeForDir(join(catDir, e.name), e.name, 'teams', catEnt.name, dryRun));
      }
    }
  }

  // chipsets (sidecar, flat — no category subfolder except deprecated)
  const chipsetsDir = join(root, 'chipsets');
  if (existsSync(chipsetsDir)) {
    for (const e of await readdir(chipsetsDir, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name === 'README.md' || e.name === 'deprecated') continue;
      if (!e.isDirectory()) continue;
      const chipsetDir = join(chipsetsDir, e.name);
      const chipsetYaml = join(chipsetDir, 'chipset.yaml');
      if (!existsSync(chipsetYaml)) continue;
      results.push(await ensureReadmeForDir(chipsetDir, e.name, 'chipsets', 'chipset', dryRun));
    }
  }

  return results;
}

async function main() {
  const dryRun = argv.includes('--dry-run');
  const scriptDir = dirname(new URL(import.meta.url).pathname);
  const examplesRoot = dirname(scriptDir);

  console.log(`Backfilling frontmatter in ${examplesRoot}${dryRun ? ' (dry run)' : ''}...`);
  const results = await walkAndBackfill(examplesRoot, dryRun);

  const counts = {};
  for (const r of results) counts[r.action] = (counts[r.action] || 0) + 1;

  console.log(`\nTotal: ${results.length} artifact(s)`);
  for (const [action, n] of Object.entries(counts)) {
    console.log(`  ${action}: ${n}`);
  }
  if (dryRun) console.log('\n(dry run — no files written)');
}

main().catch(e => { console.error(e); exit(1); });
