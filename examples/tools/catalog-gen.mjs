#!/usr/bin/env node
// examples/tools/catalog-gen.mjs
//
// Walks examples/ and produces:
//   1. .planning/artifact-catalog.csv  (private, gitignored)
//   2. examples/.count-badge.md        (committed, included by README)
//
// Zero dependencies.

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { argv, exit } from 'node:process';

const CSV_HEADER = 'name,type,location,project_scope,is_unique,superseded_by,first_seen_path,first_seen_date,notes';

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

  // Chipsets: flat chipsets/<name>/, with chipsets/deprecated/<name>/ for deprecated
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

function escapeCsv(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function artifactToRow(art, projectRoot) {
  const fm = art.frontmatter || {};
  const relPath = art.path.replace(projectRoot + '/', '');
  return [
    art.name,
    art.type.replace(/s$/, ''),
    'examples',
    'gsd-skill-creator',
    '',  // is_unique — filled in by a separate dedup pass if needed
    fm.superseded_by || '',
    fm.first_path || relPath,
    fm.first_seen || 'unknown',
    art.category === '(unclassified)' ? 'pre-Stage-2' : '',
  ].map(escapeCsv).join(',');
}

async function writeCatalog(artifacts, planningPath, projectRoot) {
  const rows = artifacts
    .slice()
    .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
    .map(a => artifactToRow(a, projectRoot));
  const csv = [CSV_HEADER, ...rows].join('\n') + '\n';
  await mkdir(dirname(planningPath), { recursive: true });
  await writeFile(planningPath, csv);
  return rows.length;
}

async function writeBadge(artifacts, badgePath) {
  const counts = { skills: 0, agents: 0, teams: 0, chipsets: 0 };
  for (const a of artifacts) counts[a.type] = (counts[a.type] || 0) + 1;
  const now = new Date().toISOString().slice(0, 10);
  const md = `<!-- Auto-generated by tools/catalog-gen.mjs. Do not edit by hand. -->

| Skills | Agents | Teams | Chipsets |
|--------|--------|-------|----------|
| ${counts.skills.toString().padEnd(6)} | ${counts.agents.toString().padEnd(6)} | ${counts.teams.toString().padEnd(5)} | ${counts.chipsets.toString().padEnd(8)} |

_Last updated: ${now}_
`;
  await writeFile(badgePath, md);
  return counts;
}

async function main() {
  const scriptDir = dirname(new URL(import.meta.url).pathname);
  const examplesRoot = dirname(scriptDir);
  const projectRoot = dirname(examplesRoot);
  const planningPath = join(projectRoot, '.planning', 'artifact-catalog.csv');
  const badgePath = join(examplesRoot, '.count-badge.md');

  console.log(`Walking ${examplesRoot} ...`);
  const artifacts = await walkArtifacts(examplesRoot);
  console.log(`Found ${artifacts.length} artifact(s).`);

  if (argv.includes('--check')) {
    console.log('\nSummary:');
    const byType = {};
    for (const a of artifacts) byType[a.type] = (byType[a.type] || 0) + 1;
    for (const [t, n] of Object.entries(byType)) console.log(`  ${t}: ${n}`);
    return;
  }

  const rowCount = await writeCatalog(artifacts, planningPath, projectRoot);
  console.log(`Wrote ${rowCount} rows to ${planningPath}`);

  const counts = await writeBadge(artifacts, badgePath);
  console.log(`Wrote count badge: skills=${counts.skills} agents=${counts.agents} teams=${counts.teams} chipsets=${counts.chipsets}`);
}

main().catch(e => { console.error(e); exit(1); });
