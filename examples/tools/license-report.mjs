#!/usr/bin/env node
// examples/tools/license-report.mjs
//
// Walks examples/, reads origin + modified from each artifact's frontmatter,
// and emits a per-artifact BSL-vs-exempt classification report to
// .planning/license-audit.csv (private).
//
// Rule:
//   origin == tibsfox           → BSL 1.1
//   modified == true            → BSL 1.1
//   origin != tibsfox AND       → BSL-EXEMPT (upstream license applies)
//     modified == false

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { argv, exit } from 'node:process';

const SKILL_CATEGORIES = new Set([
  'gsd', 'research', 'media', 'dev', 'ops',
  'workflow', 'patterns', 'orchestration', 'state', 'deprecated',
]);
const AGENT_CATEGORIES = new Set([
  'gsd', 'research', 'media', 'dev', 'ops', 'ui', 'audit', 'deprecated',
]);
const TEAM_CATEGORIES = new Set(['code', 'ops', 'infra', 'migration', 'deprecated']);
const CHIPSET_CATEGORIES = new Set(['chipset', 'deprecated']);

function metadataFileFor(type, artifactDir) {
  switch (type) {
    case 'skills':   return join(artifactDir, 'SKILL.md');
    case 'agents':   return join(artifactDir, 'AGENT.md');
    case 'teams':    return join(artifactDir, 'README.md');
    case 'chipsets': return join(artifactDir, 'README.md');
    default:         return null;
  }
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
    fm[m[1]] = v;
  }
  return fm;
}

async function walkArtifacts(root) {
  const results = [];
  const typesWithCategories = [
    ['skills', SKILL_CATEGORIES],
    ['agents', AGENT_CATEGORIES],
    ['teams', TEAM_CATEGORIES],
  ];

  for (const [type, catSet] of typesWithCategories) {
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
        await collect(type, '(unclassified)', ent.name, subPath, results);
      }
    }
  }

  const chipsetsDir = join(root, 'chipsets');
  if (existsSync(chipsetsDir)) {
    const entries = await readdir(chipsetsDir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.name.startsWith('.') || ent.name === 'README.md') continue;
      if (!ent.isDirectory()) continue;
      if (ent.name === 'deprecated') {
        const depEntries = await readdir(join(chipsetsDir, ent.name), { withFileTypes: true });
        for (const e of depEntries) {
          if (e.name.startsWith('.') || e.name === 'README.md') continue;
          if (!e.isDirectory()) continue;
          await collect('chipsets', 'deprecated', e.name, join(chipsetsDir, ent.name, e.name), results);
        }
      } else {
        await collect('chipsets', 'chipset', ent.name, join(chipsetsDir, ent.name), results);
      }
    }
  }
  return results;
}

async function collect(type, category, name, artifactDir, results) {
  const metaPath = metadataFileFor(type, artifactDir);
  if (!metaPath || !existsSync(metaPath)) return;
  const fm = await parseFrontmatter(await readFile(metaPath, 'utf8'));
  results.push({ type, category, name, path: artifactDir, frontmatter: fm });
}

function classify(art) {
  const fm = art.frontmatter;
  if (!fm) return { verdict: 'UNKNOWN', reason: 'no frontmatter (pre-Stage-2?)' };

  const origin = fm.origin;
  const modified = fm.modified;

  if (origin === undefined) {
    return { verdict: 'ERROR', reason: 'missing origin field' };
  }
  if (modified === undefined) {
    return { verdict: 'ERROR', reason: 'missing modified field' };
  }

  if (origin === 'tibsfox') {
    return { verdict: 'BSL-1.1', reason: 'origin=tibsfox' };
  }
  if (modified === true) {
    return { verdict: 'BSL-1.1', reason: `origin=${origin}, modified=true` };
  }
  return { verdict: 'BSL-EXEMPT', reason: `origin=${origin}, modified=false (upstream license governs)` };
}

function escapeCsv(v) {
  const s = v == null ? '' : String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function main() {
  const scriptDir = dirname(new URL(import.meta.url).pathname);
  const examplesRoot = dirname(scriptDir);
  const projectRoot = dirname(examplesRoot);
  const outPath = join(projectRoot, '.planning', 'license-audit.csv');

  console.log(`Auditing ${examplesRoot} ...`);
  const artifacts = await walkArtifacts(examplesRoot);

  const rows = [
    'name,type,category,verdict,reason,origin,modified,path',
  ];

  let bsl = 0, exempt = 0, errors = 0, unknown = 0;

  for (const art of artifacts) {
    const cls = classify(art);
    if (cls.verdict === 'BSL-1.1') bsl++;
    else if (cls.verdict === 'BSL-EXEMPT') exempt++;
    else if (cls.verdict === 'ERROR') errors++;
    else unknown++;

    const fm = art.frontmatter || {};
    rows.push([
      art.name, art.type.replace(/s$/, ''), art.category,
      cls.verdict, cls.reason, fm.origin ?? '', fm.modified ?? '',
      art.path.replace(projectRoot + '/', ''),
    ].map(escapeCsv).join(','));
  }

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, rows.join('\n') + '\n');

  console.log(`\nResults:`);
  console.log(`  BSL-1.1:    ${bsl}`);
  console.log(`  BSL-EXEMPT: ${exempt}`);
  console.log(`  ERROR:      ${errors}`);
  console.log(`  UNKNOWN:    ${unknown} (pre-Stage-2 artifacts without frontmatter)`);
  console.log(`\nReport: ${outPath}`);

  if (errors > 0) exit(1);
}

main().catch(e => { console.error(e); exit(1); });
