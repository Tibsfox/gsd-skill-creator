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
const CHIPSET_CATEGORIES = new Set(['deprecated']);

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

      if (ent.isDirectory() && catSet.has(ent.name)) {
        // Category dir
        const inner = await readdir(join(typeDir, ent.name), { withFileTypes: true });
        for (const e of inner) {
          if (e.name.startsWith('.') || e.name === 'README.md') continue;
          await collect(type, ent.name, e, join(typeDir, ent.name), results);
        }
      } else if (ent.isDirectory()) {
        // Top-level (pre-Stage-2 unclassified)
        await collect(type, '(unclassified)', ent, typeDir, results);
      } else if (ent.isFile() && type === 'chipsets' && ent.name.endsWith('.yaml')) {
        results.push({
          type, category: '(unclassified)',
          name: ent.name.replace(/\.yaml$/, ''),
          path: join(typeDir, ent.name),
          frontmatter: null,
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
    const fm = metaPath.endsWith('.md')
      ? await parseFrontmatter(await readFile(metaPath, 'utf8'))
      : null;
    results.push({ type, category, name: ent.name, path: fullPath, frontmatter: fm });
  } else if (ent.isFile() && ent.name.endsWith('.md')) {
    const fm = await parseFrontmatter(await readFile(fullPath, 'utf8'));
    results.push({
      type, category, name: ent.name.replace(/\.md$/, ''),
      path: fullPath, frontmatter: fm,
    });
  }
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
