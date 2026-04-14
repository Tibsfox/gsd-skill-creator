#!/usr/bin/env node
// examples/tools/generate-category-readmes.mjs
//
// Walks examples/ and generates a README.md for each category subfolder
// containing a description of the category and a table of the artifacts in
// it. Reads artifact metadata from the frontmatter that Stage 2 back-filled.
//
// This tool is idempotent — run it any time you add or remove artifacts
// and the category READMEs will refresh. The tool deliberately does NOT
// preserve hand-edits — the README is a generated artifact. If you need to
// hand-edit, add the description to the CATEGORY_DESCRIPTIONS map below.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { argv, exit } from 'node:process';

const CATEGORY_DESCRIPTIONS = {
  skills: {
    gsd: 'Get-Shit-Done workflow skills — migration, onboarding, preflight, and decision tracing.',
    research: 'Research pipelines and data fidelity — research engine, mission generators, fact-checking.',
    media: 'Media production — audio engineering, AV studio, ffmpeg workflows, LaTeX authoring, publishing.',
    dev: 'Developer productivity — commit craft, code review, test generation, language patterns, decision frameworks.',
    ops: 'Operations and reliability — chaos engineering, incident response, monitoring, release, SRE.',
    workflow: 'Workflow meta-skills — context handoff, ecosystem alignment, issue triage, merge refinery.',
    patterns: 'Pattern catalogs — SQL, API design, Docker, accessibility, CI/CD, infrastructure, Kubernetes, and more.',
    orchestration: 'Agent orchestration — fleet mission, mayor coordinator, sling dispatch, propulsion, runtime HAL, witness observer.',
    state: 'State and persistence — beads state, hook persistence, inter-agent channels (mail, nudge), token budgets, retirement pipelines.',
    deprecated: 'Superseded skills. Preserved for reference and archaeological lineage; not installed by default.',
  },
  agents: {
    gsd: 'GSD workflow agents — planner, executor, verifier, debugger, researcher, reviewer, roadmapper, and the full GSD suite.',
    research: 'Research agents — project researcher, fact checker, market researcher, document builder, fleet commander.',
    media: 'Media production agents — audio engineer, video editor, podcast producer, stream producer, ffmpeg processor, music analyzer.',
    dev: 'Developer-facing agents — test orchestrator, security reviewer, issue fixer, changelog generator.',
    ops: 'Operations agents — incident analyzer, deployment validator, SLO monitor, capacity planner, drift detector, runbook executor, release risk scorer.',
    ui: 'UI-facing agents — UI researcher, UI checker, UI auditor for GSD frontend phases.',
    audit: 'Audit and analysis agents — compliance, infrastructure, pipeline, performance, dependency health, documentation linting, vulnerability triage, codebase navigation, cost optimization.',
    deprecated: 'Superseded agents. Preserved for reference and archaeological lineage; not installed by default.',
  },
  teams: {
    code: 'Code review and security audit teams — multi-perspective review topologies.',
    ops: 'Operations teams — DevOps pipeline, SRE operations, incident response.',
    infra: 'Infrastructure teams — infrastructure review, release management, platform onboarding.',
    migration: 'Migration and documentation generation teams — coordinated multi-agent migrations and doc authoring.',
    deprecated: 'Superseded teams. Preserved for reference and archaeological lineage; not installed by default.',
  },
};

const SKILL_CATEGORIES = Object.keys(CATEGORY_DESCRIPTIONS.skills);
const AGENT_CATEGORIES = Object.keys(CATEGORY_DESCRIPTIONS.agents);
const TEAM_CATEGORIES = Object.keys(CATEGORY_DESCRIPTIONS.teams);

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
    // Strip surrounding quotes
    if (typeof v === 'string' && /^".*"$/.test(v)) v = v.slice(1, -1);
    fm[m[1]] = v;
  }
  return fm;
}

function truncate(s, n = 120) {
  if (!s) return '';
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + '…';
}

function formatOriginBadge(fm) {
  const origin = fm.origin || 'unknown';
  const modified = fm.modified;
  if (origin === 'tibsfox') return 'tibsfox';
  if (modified === false) return `${origin} (unchanged)`;
  if (modified === true) return `${origin} (modified)`;
  return origin;
}

function formatStatusBadge(fm) {
  return fm.status || 'stable';
}

function extractFirstParagraph(content) {
  // Strip frontmatter
  let body = content;
  if (body.startsWith('---\n')) {
    const end = body.indexOf('\n---\n', 4);
    if (end !== -1) body = body.slice(end + 5);
  }
  // Skip H1 if present
  body = body.trim();
  if (body.startsWith('# ')) {
    const nlIdx = body.indexOf('\n');
    if (nlIdx !== -1) body = body.slice(nlIdx + 1).trimStart();
  }
  // First paragraph = text up to the first blank line or H2
  const match = body.match(/^([^\n]+(?:\n[^\n]+)*)/);
  if (!match) return null;
  const para = match[1].trim();
  if (para.startsWith('#')) return null; // it's a header, not a paragraph
  return para.replace(/\n/g, ' ').replace(/\s+/g, ' ');
}

async function artifactsInCategory(root, type, category) {
  const catDir = join(root, type, category);
  if (!existsSync(catDir)) return [];
  const entries = await readdir(catDir, { withFileTypes: true });
  const results = [];
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'README.md') continue;
    if (!e.isDirectory()) continue;
    const artifactDir = join(catDir, e.name);
    const metaPath = metadataFileFor(type, artifactDir);
    if (!metaPath || !existsSync(metaPath)) continue;
    const content = await readFile(metaPath, 'utf8');
    const fm = await parseFrontmatter(content) || {};
    // Fallback: if description is null/missing, extract first paragraph from body
    if (!fm.description) {
      const firstPara = extractFirstParagraph(content);
      if (firstPara) fm.description = firstPara;
    }
    results.push({ name: e.name, fm });
  }
  results.sort((a, b) => a.name.localeCompare(b.name));
  return results;
}

function renderCategoryReadme(type, category, artifacts) {
  const description = CATEGORY_DESCRIPTIONS[type]?.[category] || '(no description)';
  const label = `examples/${type}/${category}/`;
  const header = `# ${label}\n\n${description}\n`;

  let body;
  if (artifacts.length === 0) {
    body = `\n_No artifacts in this category yet._\n`;
  } else {
    const rows = artifacts.map(a => {
      const linkTarget = `${a.name}/`;
      const desc = truncate(a.fm.description, 100);
      const origin = formatOriginBadge(a.fm);
      const status = formatStatusBadge(a.fm);
      return `| [${a.name}](${linkTarget}) | ${desc || '—'} | ${origin} | ${status} |`;
    });
    body = `\n## Artifacts (${artifacts.length})\n\n| Artifact | Description | Origin | Status |\n|---|---|---|---|\n${rows.join('\n')}\n`;
  }

  const footer = `
---

_This README is auto-generated by \`tools/generate-category-readmes.mjs\`. To edit the description, update \`CATEGORY_DESCRIPTIONS\` in the script. To edit artifact listings, edit the frontmatter of the individual artifact and re-run the generator._

See [\`../../CATEGORIES.md\`](../../CATEGORIES.md) for the full taxonomy.
See [\`../../CHANGELOG.md\`](../../CHANGELOG.md) for the library's evolution history.
`;

  return header + body + footer;
}

async function main() {
  const dryRun = argv.includes('--dry-run');
  const scriptDir = dirname(new URL(import.meta.url).pathname);
  const examplesRoot = dirname(scriptDir);

  console.log(`Generating category READMEs in ${examplesRoot}${dryRun ? ' (dry run)' : ''}...`);

  const toGenerate = [
    ['skills', SKILL_CATEGORIES],
    ['agents', AGENT_CATEGORIES],
    ['teams', TEAM_CATEGORIES],
  ];

  let created = 0, updated = 0, unchanged = 0;

  for (const [type, categories] of toGenerate) {
    for (const category of categories) {
      const catDir = join(examplesRoot, type, category);
      if (!existsSync(catDir)) continue;
      const artifacts = await artifactsInCategory(examplesRoot, type, category);
      const content = renderCategoryReadme(type, category, artifacts);
      const readmePath = join(catDir, 'README.md');

      const existed = existsSync(readmePath);
      const current = existed ? await readFile(readmePath, 'utf8') : null;

      if (current === content) {
        unchanged++;
        continue;
      }

      if (!dryRun) await writeFile(readmePath, content);
      if (existed) updated++;
      else created++;

      console.log(`  ${existed ? 'updated' : 'created'}  ${type}/${category}/ (${artifacts.length} artifacts)`);
    }
  }

  console.log(`\nTotal: ${created} created, ${updated} updated, ${unchanged} unchanged`);
  if (dryRun) console.log('(dry run — no files written)');
}

main().catch(e => { console.error(e); exit(1); });
