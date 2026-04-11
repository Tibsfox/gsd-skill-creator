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
const CHIPSET_CATEGORIES = new Set(['deprecated']); // chipsets are not subcategorized; live at top

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

async function walkArtifacts(root) {
  const results = [];
  const types = [
    ['skills', SKILL_CATEGORIES],
    ['agents', AGENT_CATEGORIES],
    ['teams', TEAM_CATEGORIES],
    ['chipsets', CHIPSET_CATEGORIES],
  ];

  for (const [type, catSet] of types) {
    const typeDir = join(root, type);
    if (!existsSync(typeDir)) continue;

    const topEntries = await readdir(typeDir, { withFileTypes: true });
    for (const ent of topEntries) {
      if (ent.name.startsWith('.') || ent.name === 'README.md') continue;

      if (ent.isDirectory()) {
        const subPath = join(typeDir, ent.name);
        if (catSet.has(ent.name)) {
          // Category dir: walk its contents
          const inner = await readdir(subPath, { withFileTypes: true });
          for (const e of inner) {
            if (e.name.startsWith('.') || e.name === 'README.md') continue;
            await collect(type, ent.name, e, subPath, results);
          }
        } else {
          // Top-level artifact still living flat (pre-Stage-2) — allow with warning
          await collect(type, '(unclassified)', ent, typeDir, results);
        }
      } else if (ent.isFile() && type === 'chipsets' && ent.name.endsWith('.yaml')) {
        // Flat chipset yaml (pre-Stage-2)
        results.push({
          type, category: '(unclassified)',
          name: ent.name.replace(/\.yaml$/, ''),
          path: join(typeDir, ent.name),
          isDir: false,
          metaPath: join(typeDir, ent.name),
          frontmatter: null,
          preStage2: true,
        });
      }
    }
  }
  return results;
}

async function collect(type, category, ent, parentDir, results) {
  const fullPath = join(parentDir, ent.name);
  if (ent.isDirectory()) {
    const skillMd = join(fullPath, 'SKILL.md');
    const agentMd = join(fullPath, 'AGENT.md');
    const chipsetYaml = join(fullPath, 'chipset.yaml');
    const teamCfg = join(fullPath, 'config.json');
    let metaPath = null;
    if (existsSync(skillMd)) metaPath = skillMd;
    else if (existsSync(agentMd)) metaPath = agentMd;
    else if (existsSync(chipsetYaml)) metaPath = chipsetYaml;
    else if (existsSync(teamCfg)) metaPath = teamCfg;
    if (!metaPath) return;
    const content = metaPath.endsWith('.md') ? await readFile(metaPath, 'utf8') : '';
    const fm = metaPath.endsWith('.md') ? await parseFrontmatter(content) : null;
    results.push({
      type, category, name: ent.name, path: fullPath, isDir: true,
      metaPath, frontmatter: fm, preStage2: category === '(unclassified)',
    });
  } else if (ent.isFile() && ent.name.endsWith('.md')) {
    const content = await readFile(fullPath, 'utf8');
    const fm = await parseFrontmatter(content);
    results.push({
      type, category, name: ent.name.replace(/\.md$/, ''),
      path: fullPath, isDir: false, metaPath: fullPath,
      frontmatter: fm, preStage2: category === '(unclassified)',
    });
  }
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
  if (['new-skill', 'test-skill', 'nonexistent-skill', 'chipset'].includes(art.name)) {
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
