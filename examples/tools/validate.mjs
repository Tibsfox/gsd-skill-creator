#!/usr/bin/env node
// examples/tools/validate.mjs
//
// Check frontmatter + structure across examples/.
// Zero dependencies.
//
// Usage:
//   node examples/tools/validate.mjs             (all artifacts, summary)
//   node examples/tools/validate.mjs --strict    (fail on any issue)
//   node examples/tools/validate.mjs --name X    (validate one artifact)

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { argv, exit } from 'node:process';

const REQUIRED_FIELDS = [
  'name', 'type', 'category', 'status',
  'origin', 'modified', 'first_seen', 'first_path',
  'description',
];
const VALID_TYPES = new Set(['skill', 'agent', 'team', 'chipset']);
const VALID_STATUS = new Set(['stable', 'experimental', 'deprecated']);
const VALID_ORIGIN = new Set(['tibsfox', 'gsd', 'taches-cc-resources', 'community']);

const SKILL_CATEGORIES = new Set([
  'gsd', 'research', 'media', 'dev', 'ops',
  'workflow', 'patterns', 'orchestration', 'state', 'deprecated',
]);
const AGENT_CATEGORIES = new Set([
  'gsd', 'research', 'media', 'dev', 'ops',
  'ui', 'audit', 'deprecated',
]);
const TEAM_CATEGORIES = new Set([
  'code', 'ops', 'infra', 'migration', 'deprecated',
]);
const CHIPSET_CATEGORIES = new Set(['chipset', 'deprecated']); // chipsets use 'chipset' as the flat category

function parseArgs(args) {
  const parsed = { strict: false, name: null, help: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--strict') parsed.strict = true;
    else if (a === '--name') parsed.name = args[++i];
    else if (a === '--help' || a === '-h') parsed.help = true;
  }
  return parsed;
}

async function parseFrontmatter(content) {
  if (!content.startsWith('---\n')) return null;
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return null;
  const block = content.slice(4, end);
  const fm = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (v === 'true') v = true;
    else if (v === 'false') v = false;
    else if (v === 'null' || v === '') v = null;
    else if (/^\d+$/.test(v)) v = Number(v);
    fm[m[1]] = v;
  }
  return fm;
}

// Pick the metadata file for a given type — where the 9-field frontmatter lives.
// Skills:   SKILL.md
// Agents:   AGENT.md
// Teams:    README.md sidecar (alongside config.json)
// Chipsets: README.md sidecar (alongside chipset.yaml)
function metadataFileFor(type, artifactDir) {
  switch (type) {
    case 'skills':   return join(artifactDir, 'SKILL.md');
    case 'agents':   return join(artifactDir, 'AGENT.md');
    case 'teams':    return join(artifactDir, 'README.md');
    case 'chipsets': return join(artifactDir, 'README.md');
    default:         return null;
  }
}

async function walkArtifacts(root) {
  const results = [];
  const types = [
    ['skills', SKILL_CATEGORIES],
    ['agents', AGENT_CATEGORIES],
    ['teams', TEAM_CATEGORIES],
  ];

  // Skills, agents, teams: category subfolders
  for (const [type, catSet] of types) {
    const typeDir = join(root, type);
    if (!existsSync(typeDir)) continue;

    const topEntries = await readdir(typeDir, { withFileTypes: true });
    for (const ent of topEntries) {
      if (ent.name.startsWith('.') || ent.name === 'README.md') continue;
      if (!ent.isDirectory()) continue;

      const subPath = join(typeDir, ent.name);
      if (catSet.has(ent.name)) {
        const inner = await readdir(subPath, { withFileTypes: true });
        for (const e of inner) {
          if (e.name.startsWith('.') || e.name === 'README.md') continue;
          if (!e.isDirectory()) continue;
          await collect(type, ent.name, e.name, join(subPath, e.name), results);
        }
      } else {
        // Pre-Stage-2 unclassified
        await collect(type, '(unclassified)', ent.name, subPath, results);
      }
    }
  }

  // Chipsets: flat — chipsets/<name>/chipset.yaml + README.md
  // Exception: chipsets/deprecated/<name>/ for deprecated ones
  const chipsetsDir = join(root, 'chipsets');
  if (existsSync(chipsetsDir)) {
    const entries = await readdir(chipsetsDir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.name.startsWith('.') || ent.name === 'README.md') continue;
      if (!ent.isDirectory()) continue;
      if (ent.name === 'deprecated') {
        // Recurse into deprecated/
        const depEntries = await readdir(join(chipsetsDir, ent.name), { withFileTypes: true });
        for (const e of depEntries) {
          if (e.name.startsWith('.') || e.name === 'README.md') continue;
          if (!e.isDirectory()) continue;
          await collect('chipsets', 'deprecated', e.name, join(chipsetsDir, ent.name, e.name), results);
        }
      } else {
        // Top-level chipset: use 'chipset' as category (not subcategorized)
        await collect('chipsets', 'chipset', ent.name, join(chipsetsDir, ent.name), results);
      }
    }
  }
  return results;
}

async function collect(type, category, name, artifactDir, results) {
  const metaPath = metadataFileFor(type, artifactDir);
  if (!metaPath || !existsSync(metaPath)) {
    results.push({
      type, category, name, path: artifactDir, metaPath: null,
      frontmatter: null, preStage2: category === '(unclassified)',
    });
    return;
  }
  const content = await readFile(metaPath, 'utf8');
  const fm = await parseFrontmatter(content);
  results.push({
    type, category, name, path: artifactDir, metaPath,
    frontmatter: fm, preStage2: category === '(unclassified)',
  });
}

function validate(art) {
  const issues = [];
  const fm = art.frontmatter;

  if (art.preStage2) {
    issues.push({ severity: 'info', msg: `Pre-Stage-2 (unclassified) — will be moved in Stage 2` });
    return issues;
  }

  if (!fm) {
    issues.push({ severity: 'error', msg: 'No frontmatter' });
    return issues;
  }

  for (const f of REQUIRED_FIELDS) {
    if (fm[f] === undefined) {
      issues.push({ severity: 'error', msg: `Missing required field: ${f}` });
    }
  }

  if (fm.name && fm.name !== art.name) {
    issues.push({ severity: 'error', msg: `Frontmatter name "${fm.name}" != directory/file name "${art.name}"` });
  }
  if (fm.type) {
    const expected = art.type.replace(/s$/, '');
    if (fm.type !== expected) {
      issues.push({ severity: 'error', msg: `Frontmatter type "${fm.type}" != expected "${expected}"` });
    }
    if (!VALID_TYPES.has(fm.type)) {
      issues.push({ severity: 'error', msg: `Invalid type "${fm.type}"` });
    }
  }
  if (fm.status && !VALID_STATUS.has(fm.status)) {
    issues.push({ severity: 'error', msg: `Invalid status "${fm.status}"` });
  }
  if (fm.origin && !VALID_ORIGIN.has(fm.origin)) {
    issues.push({ severity: 'error', msg: `Invalid origin "${fm.origin}"` });
  }
  if (fm.status === 'deprecated') {
    if (!fm.superseded_by) {
      issues.push({ severity: 'warn', msg: `Deprecated but no superseded_by` });
    }
    if (art.category !== 'deprecated' && !art.preStage2) {
      issues.push({ severity: 'warn', msg: `Deprecated but not in deprecated/ subfolder` });
    }
  }
  if (art.category === 'deprecated' && fm.status !== 'deprecated') {
    issues.push({ severity: 'error', msg: `In deprecated/ but status is "${fm.status}"` });
  }

  // Name sanity: no scaffolding leftovers
  // Note: "chipset" is NOT in this list — it's a legitimate baseline chipset,
  // not a template. Only flag names that are clearly scaffolding.
  if (['new-skill', 'test-skill', 'nonexistent-skill'].includes(art.name)) {
    issues.push({ severity: 'error', msg: `Scaffolding leftover: ${art.name}` });
  }

  return issues;
}

async function main() {
  const args = parseArgs(argv.slice(2));
  if (args.help) {
    console.log('Usage: node validate.mjs [--strict] [--name X]');
    return;
  }

  const scriptDir = dirname(new URL(import.meta.url).pathname);
  const examplesRoot = dirname(scriptDir);

  console.log(`Validating ${examplesRoot} ...`);
  const all = await walkArtifacts(examplesRoot);
  const target = args.name ? all.filter(a => a.name === args.name) : all;

  let errors = 0, warnings = 0, info = 0, clean = 0;
  const report = [];

  for (const art of target) {
    const issues = validate(art);
    if (!issues.length) { clean++; continue; }
    report.push({ art, issues });
    for (const i of issues) {
      if (i.severity === 'error') errors++;
      else if (i.severity === 'warn') warnings++;
      else info++;
    }
  }

  if (report.length) {
    console.log('\nIssues:\n');
    for (const { art, issues } of report) {
      const loc = `${art.type}/${art.category}/${art.name}`;
      for (const i of issues) {
        console.log(`  [${i.severity.toUpperCase().padEnd(5)}] ${loc}  — ${i.msg}`);
      }
    }
  }

  console.log(`\nTotal: ${target.length} checked, ${clean} clean, ${errors} error(s), ${warnings} warning(s), ${info} info.`);
  if (errors > 0 || (args.strict && (warnings > 0))) exit(1);
}

main().catch(e => { console.error(e); exit(1); });
