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
import { CATEGORIZED_TYPES, metadataFileFor, discoverCategories } from './catalog-core.mjs';

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
    'gsd-meta': 'GSD meta-skills for the skill-creator workflow itself — batch rewrites, checkpoint/resume, portable schema generation, session observation, and decision-framework invocation.',
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
    'gsd-meta': 'GSD meta-agents for the release-history pipeline itself — pipeline reconciliation (DB-vs-disk drift) and quality-drift watching across release archives.',
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

// Domain-level descriptions for the college/department categories. These are
// shared across skills/agents/teams — descriptionFor() composes the final
// category description as "<Title> <skills|agents|teams> — <blurb>". A curated
// entry in CATEGORY_DESCRIPTIONS (above) always wins over a domain blurb.
const DOMAIN_DESCRIPTIONS = {
  art: 'drawing and observation, color theory, the creative process, art history and movements, sculpture, and digital art',
  astronomy: 'naked-eye and instrumental observation, celestial coordinates, orbital mechanics, stellar spectroscopy, the cosmic distance ladder, and cosmology',
  business: 'organizational strategy, entrepreneurship and innovation, corporate finance, operations and lean, business law, and ethics and governance',
  chemistry: 'atomic structure, chemical bonding, organic chemistry, reactions and stoichiometry, analytical methods, and materials chemistry',
  'cloud-systems': 'service architecture, distributed storage and consensus, cloud identity and auth, networking, and cloud reliability engineering',
  coding: 'programming fundamentals, algorithms and data structures, software design, computational thinking, debugging and testing, and systems programming',
  communication: 'public speaking, persuasion and rhetoric, active listening, interpersonal communication, conflict resolution, and media literacy',
  'critical-thinking': 'logical reasoning, argument evaluation, evidence assessment, cognitive biases, decision-making, and creative thinking',
  'data-science': 'data wrangling and visualization, statistical modeling, machine-learning foundations, experimental design, and ethics and governance',
  'digital-literacy': 'information evaluation, digital citizenship, data privacy, media creation, computational literacy, and algorithmic awareness',
  economics: 'micro- and macroeconomics, behavioral and development economics, international trade, and public policy',
  electronics: 'DC/AC circuit analysis, digital logic design, semiconductor device physics, microcontroller firmware, signal processing, and test and measurement',
  engineering: 'the design process, systems engineering, structural analysis, prototyping and fabrication, technical communication, and engineering ethics',
  environmental: 'climate science, ecosystem dynamics, biogeochemical cycles, human-impact assessment, sustainability design, and environmental justice',
  geography: 'physical and human geography, cartography and GIS, geopolitics, fieldwork methods, and environmental geography',
  history: 'source analysis, historiography, causation and consequence, continuity and change, oral history, and historical perspective-taking',
  'home-economics': 'meal planning and food technique, household budgeting, household systems design, time-and-motion, and sustainable-household pedagogy',
  languages: 'grammar and syntax, phonetics and phonology, pragmatics, vocabulary acquisition, translation and interpretation, and learning strategies',
  learning: 'the science of learning — deliberate practice, mastery and Bloom\'s taxonomy, scaffolding and the ZPD, constructivism, mindset and motivation, and prepared environments',
  logic: 'propositional, predicate, and modal logic, mathematical proof, informal fallacies, and critical argumentation',
  materials: 'iron, steel, and nonferrous processes, materials characterization and selection, structural failure analysis, and nanomaterials',
  math: 'proof technique, algebraic reasoning, geometric intuition, numerical analysis, pattern recognition, and mathematical modeling',
  'mind-body': 'yoga and alignment, breath and meditation, somatic movement, internal arts (tai chi, qigong), martial discipline, and contemplative traditions',
  music: 'harmony, counterpoint, rhythm and meter, form analysis, orchestration, and ear training',
  'nature-studies': 'field identification, nature journaling, ecosystem mapping, bird and species observation, and taxonomic classification',
  nutrition: 'nutrition-science foundations, nutrient metabolism, dietary assessment, feeding pedagogy, food policy, and contested claims',
  philosophy: 'formal logic, epistemology, metaphysics, ethics, political philosophy, and critical thinking',
  'physical-education': 'movement fundamentals, cardiovascular fitness, strength and conditioning, coaching pedagogy, sport education, and inclusive PE',
  physics: 'classical mechanics, electromagnetism, thermodynamics, quantum mechanics, relativity and astrophysics, and experimental methods',
  'problem-solving': 'problem comprehension, strategy selection, metacognitive monitoring, design thinking, mathematical problem-solving, and collaboration',
  'project-management': 'agile methods, estimation and planning, risk management, stakeholder communication, quality assurance, and retrospective learning',
  psychology: 'cognitive, developmental, social, and clinical foundations, behavioral neuroscience, and research methods',
  rca: 'classical methods, causal inference, systems-theoretic analysis (STAMP/STPA), distributed-systems failure, human factors, and blameless postmortems',
  reading: 'phonics and decoding, reading comprehension, literary and critical analysis, vocabulary development, and information literacy',
  science: 'the scientific method, experimental design, data analysis, earth and life systems, history and philosophy of science, and science communication',
  'spatial-computing': 'spatial reasoning, 3D interaction design, immersive environment and world building, embodied computing, and augmented-reality tracking',
  statistics: 'descriptive and inferential statistics, probability theory, regression modeling, Bayesian methods, and statistical computing',
  technology: 'digital systems, human-computer interaction, emerging tech, cybersecurity, responsible innovation, and design thinking',
  theology: 'scripture and interpretation, systematic and philosophical theology, comparative religion, ethics and practice, and mysticism',
  trades: 'workshop practice, tool and machine use, measurement and tolerance, materials and fit, craft methodology, and apprenticeship pedagogy',
  writing: 'narrative craft, expository and research writing, poetry, voice and style, and revision and editing',
};

// Title-case a category slug for the generated heading/lead-in
// (e.g. 'home-economics' -> 'Home Economics', 'gsd-meta' -> 'GSD Meta',
// 'rca' -> 'RCA'). Known acronyms are upper-cased rather than title-cased.
const ACRONYMS = { gsd: 'GSD', rca: 'RCA', ui: 'UI', ai: 'AI' };
function titleCaseCategory(category) {
  return category.split('-')
    .map(w => ACRONYMS[w] || (w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

const TYPE_NOUN = { skills: 'skills', agents: 'agents', teams: 'teams' };

// Resolve a category's description. Curated per-(type, category) text in
// CATEGORY_DESCRIPTIONS wins; otherwise compose a domain-level description from
// DOMAIN_DESCRIPTIONS (shared across skills/agents/teams for college/department
// domains); otherwise a neutral placeholder.
function descriptionFor(type, category) {
  const curated = CATEGORY_DESCRIPTIONS[type]?.[category];
  if (curated) return curated;
  const domain = DOMAIN_DESCRIPTIONS[category];
  if (domain) return `${titleCaseCategory(category)} ${TYPE_NOUN[type] || type} — ${domain}`;
  return '(no description)';
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
  const description = descriptionFor(type, category);
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

  let created = 0, updated = 0, unchanged = 0;

  for (const type of CATEGORIZED_TYPES) {
    // Categories discovered structurally from disk (catalog-core.mjs), NOT a
    // hardcoded list — so every category gets a README.
    const categories = await discoverCategories(examplesRoot, type);
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
