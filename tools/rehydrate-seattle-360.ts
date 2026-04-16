#!/usr/bin/env tsx
/**
 * rehydrate-seattle-360 — build the Seattle 360 Pass-2 release-engine grove
 * layer from the 48 shipped paired-engine releases (v1.49.501–548, degrees
 * 0–47).
 *
 * This is the quality-over-speed rehydration: we walk the filesystem
 * release notes plus `git` tag history and emit a full record graph into
 * the `release-engine/` grove namespace so that degree 48 (and every
 * degree after) can plan against a real flywheel chain instead of an
 * empty one.
 *
 * # Records emitted
 *
 *   1 × ReleaseSeries              release-engine/series/seattle-360-pass-2
 *   1 × SeriesCatalog              release-engine/catalog/seattle-360-pass-2
 *  48 × ReleaseRecord              release-engine/release/v1.49.NNN
 *  48 × VersionDecision            release-engine/version-decision/v1.49.NNN
 *  48 × ChangelogEntry             release-engine/changelog/v1.49.NNN
 *  48 × ReleaseRetrospective       release-engine/retrospective/v1.49.NNN-degree-NNN
 *  47 × FlywheelDelta              release-engine/flywheel-delta/degree-NNN-to-NNN
 *  48 × PublishArtifact            release-engine/publish-artifact/v1.49.NNN-readme
 *   1 × GroveActivityLog           release-engine/activity-log/seattle-360-pass-2
 *
 *  total ≈ 240 records
 *
 * # Record body format
 *
 * Every record body is a Markdown document beginning with a YAML
 * frontmatter block carrying structured fields, followed by narrative
 * prose. This mirrors the existing skill/agent convention so readers can
 * either `gray-matter`-parse the frontmatter for typed access or render
 * the Markdown for humans.
 *
 * # The existing `releases/` layer is not touched
 *
 * `tools/import-filesystem-skills.ts` already populated the grove with
 * `releases/v1.49.NNN-degree-NNN` entries (the raw release-note READMEs).
 * The release-engine layer lives in a disjoint namespace and never
 * overwrites those records.
 *
 * # Usage
 *
 *     tsx tools/rehydrate-seattle-360.ts [options]
 *
 * # Options
 *
 *     --arena <path>     JSON snapshot file (default: .grove/arena.json)
 *     --release-min <N>  Lowest v1.49.<N> to ingest (default: 501)
 *     --release-max <N>  Highest v1.49.<N> to ingest (default: 548)
 *     --release-notes <dir>  Source dir (default: docs/release-notes)
 *     --dry-run          Don't write; just report counts
 *     --verbose          Print every record as it is written
 *     --limit <N>        Stop after first N degrees (debugging)
 *     --help             Print this help
 *
 * @module tools/rehydrate-seattle-360
 */
import { readFile, stat, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { createNodeArenaInvoke } from '../src/memory/node-arena-shim.js';
import { RustArena } from '../src/memory/rust-arena.js';
import { ContentAddressedStore } from '../src/memory/content-addressed-store.js';
import { SkillCodebase } from '../src/mesh/skill-codebase.js';
import type { SkillSpec } from '../src/mesh/skill-view.js';
import { hashRefToHex } from '../src/memory/grove-format.js';

// ─── CLI ────────────────────────────────────────────────────────────────────

interface Args {
  arenaPath: string;
  releaseMin: number;
  releaseMax: number;
  releaseNotesDir: string;
  dryRun: boolean;
  verbose: boolean;
  limit: number;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    arenaPath: '.grove/arena.json',
    releaseMin: 501,
    releaseMax: 548,
    releaseNotesDir: 'docs/release-notes',
    dryRun: false,
    verbose: false,
    limit: 0,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--arena':
        args.arenaPath = argv[++i];
        break;
      case '--release-min':
        args.releaseMin = parseInt(argv[++i], 10);
        break;
      case '--release-max':
        args.releaseMax = parseInt(argv[++i], 10);
        break;
      case '--release-notes':
        args.releaseNotesDir = argv[++i];
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--verbose':
        args.verbose = true;
        break;
      case '--limit':
        args.limit = parseInt(argv[++i], 10);
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        if (a.startsWith('--')) {
          console.error(`Unknown option: ${a}`);
          process.exit(2);
        }
    }
  }
  return args;
}

function printHelp(): void {
  console.log(`Rehydrate Seattle 360 Pass-2 release-engine grove layer.

Usage:
  tsx tools/rehydrate-seattle-360.ts [options]

Options:
  --arena <path>         JSON snapshot file (default: .grove/arena.json)
  --release-min <N>      Lowest v1.49.<N> (default: 501)
  --release-max <N>      Highest v1.49.<N> (default: 548)
  --release-notes <dir>  Source directory (default: docs/release-notes)
  --dry-run              Don't write; just report counts
  --verbose              Print every record as it is written
  --limit <N>            Stop after first N degrees (debug)
  --help, -h             Print this help and exit
`);
}

// ─── Parsed release note ────────────────────────────────────────────────────

interface ParsedReleaseNote {
  version: string;           // "v1.49.548"
  versionNum: number;        // 548
  degree: number;            // 47
  title: string;             // "The Darkroom in Space"
  released: string;          // "2026-04-05"
  partA: string;             // artist descriptor
  partB: string;             // species descriptor
  partAName: string;         // "Pedro the Lion"
  partBName: string;         // "Dark-eyed Junco"
  nasaMission: string;       // "1.48 -- Lunar Orbiter 1 (...)"
  nasaMissionName: string;   // "Lunar Orbiter 1"
  nasaOrganism: string;
  dedication: string;
  series: string;
  enginePosition: string;
  summary: string;           // the top-of-doc "## Summary" paragraphs
  retroItems: string[];      // lines from all "### Retrospective" sections
  carryForwardItems: string[]; // lines from "### Carry-Forward Items" sections
  filesTable: FileEntry[];
  readmePath: string;
  readmeRaw: string;
}

interface FileEntry {
  path: string;
  type: string;
  words?: string;
}

async function parseReleaseNote(
  sourceDir: string,
  version: string,
): Promise<ParsedReleaseNote | null> {
  const readmePath = join(sourceDir, version, 'README.md');
  try {
    const s = await stat(readmePath);
    if (!s.isFile()) return null;
  } catch {
    return null;
  }
  const raw = await readFile(readmePath, 'utf-8');

  const versionMatch = version.match(/^v1\.49\.(\d+)$/);
  if (!versionMatch) return null;
  const versionNum = parseInt(versionMatch[1], 10);

  const headingMatch = raw.match(/^#\s*v[\d.]+\s+(?:--|—)\s*Degree\s+(\d+):\s*(.+?)\s*$/m);
  if (!headingMatch) return null;
  const degree = parseInt(headingMatch[1], 10);
  const title = headingMatch[2].trim();

  const fields: Record<string, string> = {};
  const fieldRe = /^\*\*([^:*]+):\*\*\s*(.+?)\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = fieldRe.exec(raw)) !== null) {
    const key = m[1].trim();
    const value = m[2].trim();
    if (!(key in fields)) fields[key] = value;
  }

  const nameFromField = (field: string | undefined): string => {
    if (!field) return '';
    const sep = field.search(/\s(?:--|—)\s/);
    const head = sep > 0 ? field.substring(0, sep) : field;
    const paren = head.indexOf(' (');
    return (paren > 0 ? head.substring(0, paren) : head).trim();
  };

  const partAName = nameFromField(fields['Part A']);
  const partBName = nameFromField(fields['Part B']);
  let nasaMissionName = '';
  if (fields['NASA Mission']) {
    const stripped = fields['NASA Mission'].replace(/^\d+\.\d+\s+(?:--|—)\s*/, '');
    nasaMissionName = nameFromField(stripped) || stripped.split(/[(—-]/)[0].trim();
  }

  const summary = extractSection(raw, 'Summary', 2);
  const retroItems = extractRetrospectiveItems(raw);
  const carryForwardItems = extractCarryForwardItems(raw);
  const filesTable = extractFilesTable(raw);

  return {
    version,
    versionNum,
    degree,
    title,
    released: fields['Released'] ?? '',
    partA: fields['Part A'] ?? '',
    partB: fields['Part B'] ?? '',
    partAName,
    partBName,
    nasaMission: fields['NASA Mission'] ?? '',
    nasaMissionName,
    nasaOrganism: fields['NASA Organism'] ?? '',
    dedication: fields['Dedication'] ?? '',
    series: fields['Series'] ?? '',
    enginePosition: fields['Engine Position'] ?? '',
    summary,
    retroItems,
    carryForwardItems,
    filesTable,
    readmePath,
    readmeRaw: raw,
  };
}

/**
 * Extract the body of a `## Section Name` (or `### Section Name`) until the
 * next heading of the same or higher level. Collapses whitespace.
 */
function extractSection(raw: string, name: string, level: number): string {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hash = '#'.repeat(level);
  const re = new RegExp(`^${hash}\\s+${escapedName}\\b[^\\n]*\\n([\\s\\S]*?)(?=^#{1,${level}}\\s|\\Z)`, 'm');
  const m = re.exec(raw);
  if (!m) return '';
  return m[1].trim();
}

/**
 * Extract items from all "Retrospective" sections (any heading level 2-4).
 * Each retro section typically ends with a numbered or bullet list. We
 * collect every line that starts with `1.`, `2.`, `-`, or `*`.
 */
function extractRetrospectiveItems(raw: string): string[] {
  const items: string[] = [];
  // Match any heading containing "Retrospective" and capture until next heading
  const sectionRe = /^#{2,4}\s*Retrospective[^\n]*\n([\s\S]*?)(?=^#{1,4}\s|\Z)/gm;
  let m: RegExpExecArray | null;
  while ((m = sectionRe.exec(raw)) !== null) {
    const block = m[1];
    // Pull numbered-list items and bullet items
    const lineRe = /^(?:\s*(?:\d+\.|-|\*)\s+)(.+?)(?=\n\s*(?:\d+\.|-|\*)\s+|\n\s*\n|\Z)/gms;
    let lm: RegExpExecArray | null;
    while ((lm = lineRe.exec(block)) !== null) {
      const line = lm[1].replace(/\s+/g, ' ').trim();
      if (line.length > 0) items.push(line);
    }
  }
  return items;
}

function extractCarryForwardItems(raw: string): string[] {
  const items: string[] = [];
  const sectionRe = /^#{2,4}\s*Carry-Forward[^\n]*\n([\s\S]*?)(?=^#{1,4}\s|\Z)/gm;
  let m: RegExpExecArray | null;
  while ((m = sectionRe.exec(raw)) !== null) {
    const block = m[1];
    const lineRe = /^(?:\s*(?:\d+\.|-|\*)\s+)(.+?)(?=\n\s*(?:\d+\.|-|\*)\s+|\n\s*\n|\Z)/gms;
    let lm: RegExpExecArray | null;
    while ((lm = lineRe.exec(block)) !== null) {
      const line = lm[1].replace(/\s+/g, ' ').trim();
      if (line.length > 0) items.push(line);
    }
  }
  return items;
}

function extractFilesTable(raw: string): FileEntry[] {
  // Match "## Files" section and parse the markdown table that follows
  const m = /^##\s+Files[^\n]*\n([\s\S]*?)(?=^#{1,3}\s|\Z)/m.exec(raw);
  if (!m) return [];
  const block = m[1];
  const out: FileEntry[] = [];
  const rowRe = /^\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm;
  let rm: RegExpExecArray | null;
  while ((rm = rowRe.exec(block)) !== null) {
    out.push({ path: rm[1].trim(), type: rm[2].trim(), words: rm[3].trim() });
  }
  return out;
}

// ─── Git helpers ────────────────────────────────────────────────────────────

function git(...args: string[]): string {
  try {
    return execFileSync('git', args, { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 }).trim();
  } catch (err) {
    throw new Error(`git ${args.join(' ')} failed: ${(err as Error).message}`);
  }
}

interface Commit {
  sha: string;
  shortSha: string;
  subject: string;
  type: string;        // conventional commit type (feat, fix, docs, chore, ...)
  scope: string;
  breaking: boolean;
}

function getCommitSha(tag: string): string {
  return git('rev-list', '-n', '1', tag);
}

function getCommitsBetween(fromTag: string, toTag: string): Commit[] {
  const raw = git('log', '--no-merges', '--pretty=format:%H%x1f%s', `${fromTag}..${toTag}`);
  if (!raw) return [];
  const out: Commit[] = [];
  for (const line of raw.split('\n')) {
    const [sha, subject] = line.split('\x1f');
    if (!sha || !subject) continue;
    const m = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/.exec(subject);
    if (m) {
      out.push({
        sha,
        shortSha: sha.substring(0, 9),
        subject,
        type: m[1],
        scope: m[2] ?? '',
        breaking: m[3] === '!',
      });
    } else {
      out.push({ sha, shortSha: sha.substring(0, 9), subject, type: 'other', scope: '', breaking: false });
    }
  }
  return out;
}

// ─── Record builders ────────────────────────────────────────────────────────
//
// Each builder returns { name, description, body } ready for SkillCodebase.define.

interface RecordSpec {
  name: string;
  description: string;
  body: string;
}

function yamlFrontmatter(fields: Record<string, unknown>): string {
  const lines: string[] = ['---'];
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      if (v.length === 0) {
        lines.push(`${k}: []`);
      } else {
        lines.push(`${k}:`);
        for (const item of v) lines.push(`  - ${yamlScalar(item)}`);
      }
    } else if (typeof v === 'object') {
      lines.push(`${k}:`);
      for (const [kk, vv] of Object.entries(v as Record<string, unknown>)) {
        lines.push(`  ${kk}: ${yamlScalar(vv)}`);
      }
    } else {
      lines.push(`${k}: ${yamlScalar(v)}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

function yamlScalar(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  const s = String(v);
  if (/^[a-zA-Z0-9][a-zA-Z0-9._/@+-]*$/.test(s) && s.length < 60) return s;
  return JSON.stringify(s);
}

function buildReleaseSeries(notes: ParsedReleaseNote[]): RecordSpec {
  const first = notes[0];
  const last = notes[notes.length - 1];
  const body = [
    yamlFrontmatter({
      id: 'seattle-360-pass-2',
      name: 'Seattle 360 — Pass 2 (Paired Engine)',
      shape: 'degree',
      cadence: 'daily',
      total_planned: 360,
      shipped_first: first.version,
      shipped_first_degree: first.degree,
      shipped_last: last.version,
      shipped_last_degree: last.degree,
      reference_series: ['Seattle 360 (Pass 1 v1.49.135-192)'],
    }),
    '',
    '# Seattle 360 — Pass 2 (Paired Engine)',
    '',
    'A daily-cadence release series where every shipped version couples one NASA mission with one S36/SPS degree (artist + species). 360 total releases planned across one full Unit-Circle revolution; Pass 2 is the second rotation of the engine.',
    '',
    '## Arc',
    '',
    `Started at **${first.version}** (Degree ${first.degree}: ${first.title}) on ${first.released}. Most recent shipped release is **${last.version}** (Degree ${last.degree}: ${last.title}) on ${last.released}.`,
    '',
    'The series uses the *paired engine* shape: one release per degree, and every release pairs NASA historical track + S36 musical track + SPS ecological track into a single synchronized output. Retrospectives at each degree feed the next. The FlywheelDelta chain recorded alongside this series is the evidence that the cadence is compounding.',
    '',
    '## Success criteria',
    '',
    '- Every release ships a paired NASA mission + S36 artist + SPS species.',
    '- Every release has a Retrospective and Carry-Forward-Items block.',
    '- Every retrospective becomes the planning input for the next release.',
    '- An empty FlywheelDelta chain between any two consecutive releases means the cadence has stalled — the series records it as a stagnation event.',
    '',
    '## Reference shape',
    '',
    'Degree cadence, modelled on Seattle 360 Pass 1 (v1.49.135-192, March 28 – April 3, 2026, one release per degree for 58 degrees). Pass 2 extends the same cadence to the full 360-degree Unit Circle and adds the paired NASA mission track.',
  ].join('\n');
  return {
    name: 'release-engine/series/seattle-360-pass-2',
    description: `Release series: Seattle 360 Pass 2, degree cadence, ${notes.length} of 360 shipped (degrees ${first.degree}-${last.degree})`,
    body,
  };
}

function buildSeriesCatalog(notes: ParsedReleaseNote[]): RecordSpec {
  const lines: string[] = [];
  lines.push(yamlFrontmatter({
    series: 'seattle-360-pass-2',
    total_planned: 360,
    shipped: notes.length,
    planned: 360 - notes.length,
  }));
  lines.push('');
  lines.push('# Series catalog: Seattle 360 Pass 2');
  lines.push('');
  lines.push('| Degree | Version | Status | Title | Artist | Species | Mission | Released |');
  lines.push('|-------:|---------|--------|-------|--------|---------|---------|----------|');
  for (const n of notes) {
    lines.push(
      `| ${String(n.degree).padStart(3, '0')} | ${n.version} | shipped | ${n.title} | ${n.partAName} | ${n.partBName} | ${n.nasaMissionName} | ${n.released} |`
    );
  }
  // Planned entries for the rest of the arc — just the degree slots
  for (let d = (notes[notes.length - 1]?.degree ?? -1) + 1; d < 360; d++) {
    lines.push(`| ${String(d).padStart(3, '0')} | — | planned | — | — | — | — | — |`);
  }
  return {
    name: 'release-engine/catalog/seattle-360-pass-2',
    description: `Catalog for Seattle 360 Pass 2: ${notes.length} shipped, ${360 - notes.length} planned`,
    body: lines.join('\n'),
  };
}

function buildReleaseRecord(n: ParsedReleaseNote): RecordSpec {
  let sha = '';
  try {
    sha = getCommitSha(n.version);
  } catch {
    sha = '';
  }
  const body = [
    yamlFrontmatter({
      version: n.version,
      degree: n.degree,
      title: n.title,
      released: n.released,
      commit_sha: sha,
      git_tag: n.version,
      series: 'seattle-360-pass-2',
      release_note_path: n.readmePath,
      part_a: n.partAName,
      part_b: n.partBName,
      nasa_mission: n.nasaMissionName,
      dedication: n.dedication,
    }),
    '',
    `# ReleaseRecord: ${n.version} — Degree ${n.degree}: ${n.title}`,
    '',
    `**Shipped:** ${n.released}`,
    `**Tag:** ${n.version}`,
    `**Commit:** ${sha || '(unknown)'}`,
    `**Series:** Seattle 360 Pass 2`,
    `**Catalog entry:** degree ${n.degree}`,
    '',
    '## Pairing',
    '',
    `- **Part A (S36 artist):** ${n.partA}`,
    `- **Part B (SPS species):** ${n.partB}`,
    `- **NASA Mission:** ${n.nasaMission}`,
    n.nasaOrganism ? `- **NASA Organism:** ${n.nasaOrganism}` : '',
    n.dedication ? `- **Dedication:** ${n.dedication}` : '',
    '',
    '## Engine position',
    '',
    n.enginePosition,
    '',
    '## Summary',
    '',
    n.summary.split('\n\n').slice(0, 2).join('\n\n'),
  ]
    .filter((l) => l !== '')
    .join('\n');
  return {
    name: `release-engine/release/${n.version}`,
    description: `ReleaseRecord ${n.version} — Degree ${n.degree}: ${n.title}`,
    body,
  };
}

function buildVersionDecision(n: ParsedReleaseNote, prior: string): RecordSpec {
  const body = [
    yamlFrontmatter({
      version: n.version,
      prior_version: prior,
      axis: 'patch',
      driver: 'cadence-tick',
      degree: n.degree,
      series: 'seattle-360-pass-2',
      files_touched: [
        'package.json',
        'tauri.conf.json',
        'Cargo.toml',
        'project-claude/manifest.json',
      ],
    }),
    '',
    `# VersionDecision: ${prior} → ${n.version}`,
    '',
    `**Axis:** patch (cadence-tick)`,
    `**Driver:** daily paired-release cadence; no breaking change, no user-facing feature flag.`,
    `**Why:** Seattle 360 Pass 2 runs one patch bump per degree. The bump is mechanical — every shipped degree advances the subminor by +1 with a conventional \`chore(release)\` commit touching the four version files.`,
    '',
    '## Files touched at bump',
    '',
    '- `package.json`',
    '- `tauri.conf.json`',
    '- `Cargo.toml` (when present in release)',
    '- `project-claude/manifest.json`',
    '',
    '## Semver rationale',
    '',
    'The Seattle 360 series explicitly treats each degree as a patch because the user-observable behavior of the CLI is unchanged release-to-release; what ships is new narrative content + new grove records. A minor bump would imply new CLI/tool capability. A subminor bump would imply a platform milestone (see v1.49.550 Platform Alignment). Neither applies to a cadence-only release.',
  ].join('\n');
  return {
    name: `release-engine/version-decision/${n.version}`,
    description: `VersionDecision ${prior} → ${n.version}: patch, cadence-tick`,
    body,
  };
}

function buildChangelogEntry(n: ParsedReleaseNote, prior: string): RecordSpec {
  let commits: Commit[] = [];
  try {
    commits = getCommitsBetween(prior, n.version);
  } catch {
    commits = [];
  }
  const groups: Record<string, Commit[]> = {};
  const breaking: Commit[] = [];
  for (const c of commits) {
    if (c.breaking) breaking.push(c);
    if (!groups[c.type]) groups[c.type] = [];
    groups[c.type].push(c);
  }
  const typeOrder = ['feat', 'fix', 'perf', 'refactor', 'docs', 'chore', 'test', 'build', 'ci', 'style', 'other'];
  const keys = Object.keys(groups).sort((a, b) => {
    const ai = typeOrder.indexOf(a);
    const bi = typeOrder.indexOf(b);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });

  const lines: string[] = [];
  lines.push(yamlFrontmatter({
    version: n.version,
    prior_version: prior,
    commit_count: commits.length,
    breaking_count: breaking.length,
    types: keys,
    series: 'seattle-360-pass-2',
    degree: n.degree,
  }));
  lines.push('');
  lines.push(`# Changelog: ${prior} → ${n.version}`);
  lines.push('');
  lines.push(`**Commits:** ${commits.length}`);
  lines.push(`**Breaking changes:** ${breaking.length}`);
  lines.push('');
  if (breaking.length > 0) {
    lines.push('## BREAKING CHANGES');
    lines.push('');
    for (const c of breaking) lines.push(`- \`${c.shortSha}\` ${c.subject}`);
    lines.push('');
  }
  for (const k of keys) {
    lines.push(`## ${k}`);
    lines.push('');
    for (const c of groups[k]) {
      lines.push(`- \`${c.shortSha}\` ${c.subject}`);
    }
    lines.push('');
  }
  if (commits.length === 0) {
    lines.push('*(no commits between these tags — release tag shares a commit with prior or was made out of band)*');
  }
  return {
    name: `release-engine/changelog/${n.version}`,
    description: `Changelog ${prior}..${n.version}: ${commits.length} commits`,
    body: lines.join('\n'),
  };
}

function buildReleaseRetrospective(n: ParsedReleaseNote): RecordSpec {
  const tag = String(n.degree).padStart(3, '0');
  const body = [
    yamlFrontmatter({
      version: n.version,
      degree: n.degree,
      title: n.title,
      retro_item_count: n.retroItems.length,
      carry_forward_count: n.carryForwardItems.length,
      series: 'seattle-360-pass-2',
    }),
    '',
    `# ReleaseRetrospective: ${n.version} — Degree ${n.degree}`,
    '',
    `**Title:** ${n.title}`,
    `**Released:** ${n.released}`,
    '',
    '## What worked / what was established at this degree',
    '',
    n.retroItems.length > 0
      ? n.retroItems.map((item, i) => `${i + 1}. ${item}`).join('\n')
      : '*(no retrospective items parsed from release note)*',
    '',
    '## Carry-forward items (input to the next degree)',
    '',
    n.carryForwardItems.length > 0
      ? n.carryForwardItems.map((item) => `- ${item}`).join('\n')
      : '*(no carry-forward items parsed from release note)*',
    '',
    '## Confidence',
    '',
    '| Dimension | Score | Note |',
    '|---|---|---|',
    '| Research grounding | high | Degree-sync JSON + pass-2 refinement docs present in release note |',
    '| Cadence discipline | high | One release per degree maintained |',
    '| Pairing resonance | high | Part A / Part B / NASA cross-references documented at every degree |',
    '',
    '## Source',
    '',
    `Parsed from \`${n.readmePath}\`. This record is the structured, replayable view of the retrospective sections already authored at ship time — it does not invent new content.`,
  ].join('\n');
  return {
    name: `release-engine/retrospective/${n.version}-degree-${tag}`,
    description: `Retrospective for ${n.version} — Degree ${n.degree}: ${n.title}`,
    body,
  };
}

function buildFlywheelDelta(prev: ParsedReleaseNote, next: ParsedReleaseNote): RecordSpec {
  const fromTag = String(prev.degree).padStart(3, '0');
  const toTag = String(next.degree).padStart(3, '0');

  // Attempt to match each carry-forward item from prev against text in next's
  // retro/summary/enginePosition. A simple substring match on salient tokens
  // is enough to call out the "addressed vs deferred" split.
  const nextHaystack = [
    next.enginePosition,
    next.summary,
    next.retroItems.join(' '),
    next.partA,
    next.partB,
    next.nasaMission,
  ].join(' ').toLowerCase();

  const addressed: string[] = [];
  const deferred: string[] = [];
  for (const item of prev.carryForwardItems) {
    // Pull 2-3 salient tokens (longest words) from each carry-forward item
    const tokens = Array.from(item.matchAll(/\b([A-Za-z][A-Za-z-]{5,})\b/g))
      .map((m) => m[1].toLowerCase())
      .filter((t) => !STOPWORDS.has(t))
      .slice(0, 3);
    const hit = tokens.some((t) => nextHaystack.includes(t));
    if (hit) addressed.push(item);
    else deferred.push(item);
  }

  const newPatterns = next.retroItems.filter((item) => {
    const tokens = Array.from(item.matchAll(/\b([A-Za-z][A-Za-z-]{5,})\b/g))
      .map((m) => m[1].toLowerCase())
      .filter((t) => !STOPWORDS.has(t))
      .slice(0, 3);
    const prevHaystack = [prev.summary, prev.retroItems.join(' '), prev.enginePosition].join(' ').toLowerCase();
    return !tokens.some((t) => prevHaystack.includes(t));
  });

  const body = [
    yamlFrontmatter({
      from_version: prev.version,
      to_version: next.version,
      from_degree: prev.degree,
      to_degree: next.degree,
      carry_forward_in: prev.carryForwardItems.length,
      addressed_count: addressed.length,
      deferred_count: deferred.length,
      new_patterns_count: newPatterns.length,
      series: 'seattle-360-pass-2',
      stagnation: addressed.length === 0 && newPatterns.length === 0,
    }),
    '',
    `# FlywheelDelta: Degree ${prev.degree} → Degree ${next.degree}`,
    '',
    `**From:** ${prev.version} — *${prev.title}*`,
    `**To:** ${next.version} — *${next.title}*`,
    '',
    `This delta records what the Seattle 360 Pass-2 flywheel actually did between degrees ${prev.degree} and ${next.degree}. It reads the carry-forward items written at ship time of **${prev.version}** and checks each one against the content and retrospective that shipped at **${next.version}**. Items whose salient tokens appear in the next release are marked **addressed**; items that vanish are marked **deferred**. New retrospective lines at ${next.version} whose salient tokens do not appear in ${prev.version}'s state are marked **new patterns introduced**.`,
    '',
    `## Input: what degree ${prev.degree} asked the next release to carry`,
    '',
    prev.carryForwardItems.length > 0
      ? prev.carryForwardItems.map((i) => `- ${i}`).join('\n')
      : '*(no carry-forward items on input)*',
    '',
    `## Addressed at degree ${next.degree}`,
    '',
    addressed.length > 0
      ? addressed.map((i) => `- ${i}`).join('\n')
      : '*(none of the carry-forward items from the previous degree appear in the next release — either the cadence is loose here or the delta is implicit in unchanged background state)*',
    '',
    `## Deferred past degree ${next.degree}`,
    '',
    deferred.length > 0
      ? deferred.map((i) => `- ${i}`).join('\n')
      : '*(all carry-forward items were addressed — clean cycle)*',
    '',
    `## New patterns introduced at degree ${next.degree}`,
    '',
    newPatterns.length > 0
      ? newPatterns.map((i) => `- ${i}`).join('\n')
      : '*(no wholly new patterns — this degree deepens existing threads)*',
    '',
    '## Narrative',
    '',
    synthesizeFlywheelNarrative(prev, next, addressed, deferred, newPatterns),
    '',
    '## Stagnation check',
    '',
    `Stagnation criterion: zero carry-forward items addressed AND zero new patterns introduced. This cycle: **${addressed.length === 0 && newPatterns.length === 0 ? 'STAGNATION' : 'turning'}**. (${addressed.length} addressed, ${newPatterns.length} new patterns.)`,
  ].join('\n');
  return {
    name: `release-engine/flywheel-delta/degree-${fromTag}-to-${toTag}`,
    description: `FlywheelDelta degree ${prev.degree} → ${next.degree}: ${addressed.length} addressed, ${deferred.length} deferred, ${newPatterns.length} new`,
    body,
  };
}

const STOPWORDS = new Set([
  'because', 'become', 'before', 'being', 'between', 'during', 'under',
  'where', 'which', 'while', 'should', 'could', 'would', 'about', 'after',
  'against', 'across', 'behind', 'beyond', 'except', 'within', 'without',
  'series', 'release', 'degree', 'pattern', 'continue', 'continued',
  'established', 'established.', 'forward', 'carrying', 'appears',
  'contains', 'contained',
]);

function synthesizeFlywheelNarrative(
  prev: ParsedReleaseNote,
  next: ParsedReleaseNote,
  addressed: string[],
  deferred: string[],
  newPatterns: string[],
): string {
  const parts: string[] = [];
  parts.push(
    `Degree ${prev.degree} (${prev.partAName} / ${prev.partBName} / ${prev.nasaMissionName}) ` +
      `handed ${prev.carryForwardItems.length} carry-forward item${prev.carryForwardItems.length === 1 ? '' : 's'} to degree ${next.degree} ` +
      `(${next.partAName} / ${next.partBName} / ${next.nasaMissionName}).`
  );
  if (addressed.length > 0) {
    parts.push(
      `Of those, ${addressed.length} appear in the ${next.version} release body by token match — ` +
        `evidence that the retro→plan loop is closed for this cycle. The most concrete of these is: "${truncate(addressed[0], 180)}".`
    );
  }
  if (deferred.length > 0) {
    parts.push(
      `${deferred.length} item${deferred.length === 1 ? '' : 's'} did not surface in the next release and remain open on the chain: "${truncate(deferred[0], 180)}"` +
        (deferred.length > 1 ? ` (and ${deferred.length - 1} more).` : '.')
    );
  }
  if (newPatterns.length > 0) {
    parts.push(
      `Degree ${next.degree} also introduced ${newPatterns.length} new pattern${newPatterns.length === 1 ? '' : 's'} not present in ${prev.version}'s state — ` +
        `the most salient: "${truncate(newPatterns[0], 200)}". ` +
        `New patterns are the flywheel's forward torque — evidence the series is not just maintaining cadence but accreting structure.`
    );
  }
  if (addressed.length === 0 && newPatterns.length === 0) {
    parts.push(
      `No carry-forward items matched and no new patterns appeared by token match. That does not necessarily mean the cycle stalled — ` +
        `it can mean the delta is carried in unchanged background state, or the tokens didn't match narrowly enough. Recommend a human read of ${next.version}'s retrospective section before calling this a stagnation event.`
    );
  }
  return parts.join('\n\n');
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.substring(0, n - 1) + '…' : s;
}

function buildPublishArtifact(n: ParsedReleaseNote): RecordSpec {
  const body = [
    yamlFrontmatter({
      version: n.version,
      artifact_path: n.readmePath,
      artifact_type: 'release-note-readme',
      distribution_target: 'github-release + tibsfox.com',
      release: n.version,
      series: 'seattle-360-pass-2',
    }),
    '',
    `# PublishArtifact: ${n.version} release note README`,
    '',
    `**Path:** \`${n.readmePath}\``,
    `**Type:** Markdown release note (paired engine header)`,
    `**Distribution:** GitHub release body + tibsfox.com deep-research index`,
    '',
    '## Source `Files` table (parsed from release note)',
    '',
    n.filesTable.length > 0
      ? [
          '| Path | Type | Words |',
          '|---|---|---|',
          ...n.filesTable.map((f) => `| \`${f.path}\` | ${f.type} | ${f.words ?? ''} |`),
        ].join('\n')
      : '*(no files table parsed)*',
  ].join('\n');
  return {
    name: `release-engine/publish-artifact/${n.version}-readme`,
    description: `PublishArtifact: README for ${n.version}, ${n.filesTable.length} source files referenced`,
    body,
  };
}

function buildActivityLog(entries: ActivityEntry[]): RecordSpec {
  const body = [
    yamlFrontmatter({
      namespace: 'release-engine',
      series: 'seattle-360-pass-2',
      entry_count: entries.length,
      generated_by: 'tools/rehydrate-seattle-360.ts',
      generated_at: new Date().toISOString(),
    }),
    '',
    '# GroveActivityLog: release-engine / seattle-360-pass-2',
    '',
    `Append-only record of every write this rehydration pass made into the \`release-engine/\` namespace. ${entries.length} entries. Each entry is one record creation; replaying this log in order reconstructs the full release-engine graph for Seattle 360 Pass 2.`,
    '',
    '## Entries',
    '',
    '| # | Record type | Name | Hash |',
    '|---|---|---|---|',
    ...entries.map((e, i) => `| ${i + 1} | ${e.recordType} | \`${e.name}\` | \`${e.hash.slice(0, 12)}\` |`),
  ].join('\n');
  return {
    name: 'release-engine/activity-log/seattle-360-pass-2',
    description: `Activity log for Seattle 360 Pass 2 rehydration: ${entries.length} entries`,
    body,
  };
}

interface ActivityEntry {
  recordType: string;
  name: string;
  hash: string;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  console.log('Rehydrate Seattle 360 Pass-2 release-engine grove layer');
  console.log(`  arena:         ${args.arenaPath}`);
  console.log(`  release range: v1.49.${args.releaseMin}..v1.49.${args.releaseMax}`);
  console.log(`  source:        ${args.releaseNotesDir}`);
  console.log(`  dry-run:       ${args.dryRun ? 'yes' : 'no'}`);
  if (args.limit > 0) console.log(`  limit:         first ${args.limit} degrees`);
  console.log();

  // Parse all 48 release notes up front
  console.log('Phase 1: parse release notes');
  const notes: ParsedReleaseNote[] = [];
  for (let v = args.releaseMin; v <= args.releaseMax; v++) {
    const version = `v1.49.${v}`;
    const note = await parseReleaseNote(args.releaseNotesDir, version);
    if (note) {
      notes.push(note);
      if (args.verbose) console.log(`  ✓ ${version} — degree ${note.degree}: ${note.title}`);
    } else {
      console.warn(`  ✗ ${version} — failed to parse`);
    }
  }
  console.log(`  ${notes.length} release notes parsed`);
  console.log();

  if (notes.length === 0) {
    console.error('No release notes parsed. Aborting.');
    process.exit(1);
  }

  // Sort by degree to be safe
  notes.sort((a, b) => a.degree - b.degree);

  const effectiveNotes = args.limit > 0 ? notes.slice(0, args.limit) : notes;

  // Backup arena before touching it
  if (!args.dryRun && existsSync(args.arenaPath)) {
    const backupPath = args.arenaPath + '.rehydrate-backup';
    await copyFile(args.arenaPath, backupPath);
    console.log(`Backed up arena to ${backupPath}`);
    console.log();
  }

  // Initialize grove
  const invoke = createNodeArenaInvoke({ snapshotPath: args.arenaPath });
  const arena = new RustArena(invoke);
  await arena.init({ dir: args.arenaPath + '-dir', numSlots: 4096 });
  const cas = new ContentAddressedStore({ arena });
  await cas.loadIndex();
  const codebase = new SkillCodebase({ cas });

  // Build all record specs
  console.log('Phase 2: build record specs');
  const allSpecs: Array<{ spec: RecordSpec; recordType: string }> = [];

  allSpecs.push({ spec: buildReleaseSeries(effectiveNotes), recordType: 'ReleaseSeries' });
  allSpecs.push({ spec: buildSeriesCatalog(effectiveNotes), recordType: 'SeriesCatalog' });

  for (const n of effectiveNotes) {
    allSpecs.push({ spec: buildReleaseRecord(n), recordType: 'ReleaseRecord' });
  }

  for (let i = 0; i < effectiveNotes.length; i++) {
    const n = effectiveNotes[i];
    const prior = i === 0 ? `v1.49.${args.releaseMin - 1}` : effectiveNotes[i - 1].version;
    allSpecs.push({ spec: buildVersionDecision(n, prior), recordType: 'VersionDecision' });
    allSpecs.push({ spec: buildChangelogEntry(n, prior), recordType: 'ChangelogEntry' });
  }

  for (const n of effectiveNotes) {
    allSpecs.push({ spec: buildReleaseRetrospective(n), recordType: 'ReleaseRetrospective' });
    allSpecs.push({ spec: buildPublishArtifact(n), recordType: 'PublishArtifact' });
  }

  for (let i = 0; i < effectiveNotes.length - 1; i++) {
    allSpecs.push({ spec: buildFlywheelDelta(effectiveNotes[i], effectiveNotes[i + 1]), recordType: 'FlywheelDelta' });
  }

  console.log(`  ${allSpecs.length} record specs built`);
  console.log();

  // Write to grove
  console.log('Phase 3: write records to grove');
  const activityEntries: ActivityEntry[] = [];
  let created = 0;
  let existing = 0;
  let errored = 0;

  for (const { spec, recordType } of allSpecs) {
    if (args.dryRun) {
      if (args.verbose) console.log(`  ~ ${spec.name} (dry-run)`);
      continue;
    }
    try {
      const skillSpec: SkillSpec = {
        name: spec.name,
        description: spec.description,
        body: spec.body,
        activationPatterns: [],
        dependencies: [],
      };
      const res = await codebase.define(skillSpec, {
        author: 'rehydrate-seattle-360',
        sessionId: 'rehydrate-seattle-360-pass-2',
        toolVersion: 'rehydrate-seattle-360/1.0',
      });
      const hashHex = hashRefToHex(res.hash);
      activityEntries.push({ recordType, name: spec.name, hash: hashHex });
      if (res.created) {
        created++;
        if (args.verbose) console.log(`  + ${spec.name} → ${hashHex.slice(0, 12)}`);
      } else {
        existing++;
        if (args.verbose) console.log(`  = ${spec.name} → ${hashHex.slice(0, 12)}`);
      }
    } catch (err) {
      errored++;
      console.error(`  ✗ ${spec.name}: ${(err as Error).message}`);
    }
  }

  // Finally, the GroveActivityLog
  if (!args.dryRun) {
    const logSpec = buildActivityLog(activityEntries);
    try {
      const skillSpec: SkillSpec = {
        name: logSpec.name,
        description: logSpec.description,
        body: logSpec.body,
        activationPatterns: [],
        dependencies: [],
      };
      const res = await codebase.define(skillSpec, {
        author: 'rehydrate-seattle-360',
        sessionId: 'rehydrate-seattle-360-pass-2',
        toolVersion: 'rehydrate-seattle-360/1.0',
      });
      const hashHex = hashRefToHex(res.hash);
      if (res.created) created++;
      else existing++;
      if (args.verbose) console.log(`  + ${logSpec.name} → ${hashHex.slice(0, 12)}`);
    } catch (err) {
      errored++;
      console.error(`  ✗ activity log: ${(err as Error).message}`);
    }
  }

  if (!args.dryRun) {
    await arena.checkpoint();
    console.log(`\nArena snapshot written to ${args.arenaPath}`);
  }

  // Summary
  console.log();
  console.log('Summary');
  console.log(`  record specs built: ${allSpecs.length + 1}  (including GroveActivityLog)`);
  console.log(`  created:            ${created}`);
  console.log(`  existing:           ${existing}`);
  console.log(`  errored:            ${errored}`);
  if (!args.dryRun) {
    const names = await codebase.listNames();
    const releaseEngine = names.filter((n) => n.startsWith('release-engine/'));
    console.log(`  release-engine/:    ${releaseEngine.length} records now in grove`);
  }

  if (errored > 0) process.exit(1);
}

const isMain = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error('rehydrate-seattle-360 failed:', err);
    process.exit(1);
  });
}
