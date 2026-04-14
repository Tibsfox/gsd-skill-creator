#!/usr/bin/env tsx
/**
 * import-filesystem-skills — walk filesystem resource directories and
 * import each skill, agent, team, and chipset as a Grove record.
 *
 * Despite the name, this imports more than just skills. It handles
 * the full gsd-skill-creator library:
 *
 *   Skills    — dir/SKILL.md   from .claude/skills/ and ~/.claude/skills/
 *   Agents    — file.md        from .claude/agents/ and ~/.claude/agents/
 *                               (flat .md files with YAML frontmatter)
 *                also          dir/AGENT.md in examples-style directories
 *   Teams     — dir/config.json + dir/README.md  from ~/.claude/teams/
 *   Chipsets  — *.yaml in data/chipset/ (one file per chipset)
 *
 * Each resource becomes a Grove record stored via SkillCodebase. To
 * keep all four kinds in a single namespace without collisions, the
 * Grove name is prefixed with a kind tag:
 *
 *     skills/vision-to-mission
 *     agents/audio-engineer
 *     teams/code-review-team
 *     chipsets/math-coprocessor
 *
 * The full raw content (frontmatter + body) is preserved in the
 * record's `body` field. Callers that want typed access to kind-
 * specific fields can parse the body themselves or add dedicated
 * view modules later without touching this script.
 *
 * # Wasteland exclusion
 *
 * The `wasteland` branch holds muse-team content that must not be
 * imported under any circumstances. This script:
 *
 *   1. Skips any path segment matching `wasteland` (defensive)
 *   2. Skips the `muses/` directory in data/chipset (the known
 *      wasteland landing zone for chipset-shaped muse content)
 *   3. Skips anything passed via `--exclude` on the command line
 *
 * # Usage
 *
 *     tsx tools/import-filesystem-skills.ts [options]
 *
 * # Options
 *
 *     --arena <path>        JSON snapshot file (default: .grove/arena.json)
 *     --skills <dir>        Skill source (repeatable; default: project + global)
 *     --agents <dir>        Agent source (repeatable; default: project + global)
 *     --teams <dir>         Team source (repeatable; default: ~/.claude/teams)
 *     --chipsets <dir>      Chipset source (repeatable; default: data/chipset)
 *     --exclude <pattern>   Skip paths containing this substring (repeatable)
 *     --dry-run             Don't write to the arena; just report
 *     --verbose             Print every resource as it's processed
 *     --help                Print this help and exit
 *
 * @module tools/import-filesystem-skills
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, extname, basename } from 'node:path';
import { homedir } from 'node:os';
import matter from 'gray-matter';

// ─── Robust frontmatter parsing ─────────────────────────────────────────────
//
// Background: a data-repair commit (`11306b268`) fixed 259 AGENT.md files
// whose frontmatter looked like
//
//     ---
//     name: some-agent
//     description: Does X. Model: sonnet. Tools: Read, Grep.
//     ---
//
// YAML parses the unquoted scalar `Does X. Model: sonnet. Tools: ...` as a
// key-value separator on the `": "` sequences and blows up. gray-matter
// surfaces this as "incomplete explicit mapping pair; a key node is missed."
//
// Rather than rely on an out-of-band repair script that isn't checked in,
// bake the repair into the importer: if the first parse fails, quote-escape
// the description value in-memory and retry. The source file on disk is left
// alone — we just log the path so operators know which files need permanent
// repair.
//
// This is intentionally narrow: it only fixes the unquoted-description case.
// Other frontmatter failure modes (structural errors, bad indentation, mixed
// tabs/spaces) still fail loudly.

interface RobustParseResult {
  parsed: matter.GrayMatterFile<string>;
  repaired: boolean;
}

function safeParseFrontmatter(raw: string): RobustParseResult | null {
  try {
    return { parsed: matter(raw), repaired: false };
  } catch {
    // fall through to repair
  }
  const repaired = repairUnquotedDescription(raw);
  if (repaired === null) return null;
  try {
    return { parsed: matter(repaired), repaired: true };
  } catch {
    return null;
  }
}

/**
 * Quote-escape the `description:` line in the first YAML frontmatter block
 * when its value is an unquoted scalar containing `": "`. Returns the
 * repaired raw string, or null if no repair was attempted (no frontmatter,
 * no description line, or value already quoted / a block scalar).
 */
function repairUnquotedDescription(raw: string): string | null {
  // Must begin with a frontmatter block
  if (!(raw.startsWith('---\n') || raw.startsWith('---\r\n'))) return null;
  const bodyStart = raw.indexOf('\n') + 1;
  // Find the closing --- marker (on its own line)
  const closeRe = /\n---(?:\r?\n|$)/;
  closeRe.lastIndex = bodyStart;
  const closeMatch = closeRe.exec(raw.substring(bodyStart));
  if (!closeMatch) return null;
  const fmBlockEnd = bodyStart + closeMatch.index; // offset of '\n' before closing ---
  const fmBlock = raw.substring(bodyStart, fmBlockEnd + 1); // includes trailing \n

  // Find the first `description:` line in the frontmatter block
  const descRe = /^([ \t]*description:[ \t]*)(.*?)([ \t]*)$/m;
  const dm = descRe.exec(fmBlock);
  if (!dm) return null;
  const prefix = dm[1];
  const value = dm[2];
  const trailingWs = dm[3];

  // Skip if empty, already quoted, or a YAML block scalar (| or >)
  if (value === '' || /^["'|>]/.test(value)) return null;

  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const newLine = `${prefix}"${escaped}"${trailingWs}`;

  const before = fmBlock.substring(0, dm.index);
  const after = fmBlock.substring(dm.index + dm[0].length);
  const newFmBlock = before + newLine + after;

  return raw.substring(0, bodyStart) + newFmBlock + raw.substring(fmBlockEnd + 1);
}

// Exported for direct testing.
export { safeParseFrontmatter, repairUnquotedDescription };

// Module-level tracker for paths where in-memory repair was applied.
// Populated by parseSkill / parseAgent; printed by main() at the end so
// operators can decide whether to write the fix back to disk.
const repairedSourcePaths: string[] = [];

import { createNodeArenaInvoke } from '../src/memory/node-arena-shim.js';
import { RustArena } from '../src/memory/rust-arena.js';
import { ContentAddressedStore } from '../src/memory/content-addressed-store.js';
import { SkillCodebase } from '../src/mesh/skill-codebase.js';
import type { SkillSpec } from '../src/mesh/skill-view.js';
import { hashRefToHex } from '../src/memory/grove-format.js';

// ─── CLI parsing ────────────────────────────────────────────────────────────

interface Args {
  arenaPath: string;
  skillSources: string[];
  agentSources: string[];
  teamSources: string[];
  chipsetSources: string[];
  excludes: string[];
  dryRun: boolean;
  verbose: boolean;
}

const DEFAULT_EXCLUDES = ['wasteland', 'data/chipset/muses'];

function parseArgs(argv: string[]): Args {
  const args: Args = {
    arenaPath: '.grove/arena.json',
    skillSources: [],
    agentSources: [],
    teamSources: [],
    chipsetSources: [],
    excludes: [...DEFAULT_EXCLUDES],
    dryRun: false,
    verbose: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--arena':
        args.arenaPath = argv[++i];
        break;
      case '--skills':
        args.skillSources.push(argv[++i]);
        break;
      case '--agents':
        args.agentSources.push(argv[++i]);
        break;
      case '--teams':
        args.teamSources.push(argv[++i]);
        break;
      case '--chipsets':
        args.chipsetSources.push(argv[++i]);
        break;
      case '--exclude':
        args.excludes.push(argv[++i]);
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--verbose':
        args.verbose = true;
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

  // Defaults.
  const cwd = process.cwd();
  if (args.skillSources.length === 0) {
    const defaults = [join(cwd, '.claude/skills'), join(homedir(), '.claude/skills')];
    args.skillSources = defaults.filter((p) => existsSync(p));
  }
  if (args.agentSources.length === 0) {
    const defaults = [join(cwd, '.claude/agents'), join(homedir(), '.claude/agents')];
    args.agentSources = defaults.filter((p) => existsSync(p));
  }
  if (args.teamSources.length === 0) {
    const defaults = [join(homedir(), '.claude/teams'), join(cwd, '.claude/teams')];
    args.teamSources = defaults.filter((p) => existsSync(p));
  }
  if (args.chipsetSources.length === 0) {
    const defaults = [join(cwd, 'data/chipset')];
    args.chipsetSources = defaults.filter((p) => existsSync(p));
  }
  return args;
}

function printHelp(): void {
  console.log(`Import filesystem skills, agents, teams, and chipsets into Grove.

Usage:
  tsx tools/import-filesystem-skills.ts [options]

Options:
  --arena <path>        JSON snapshot file (default: .grove/arena.json)
  --skills <dir>        Skill source (repeatable)
  --agents <dir>        Agent source (repeatable)
  --teams <dir>         Team source (repeatable)
  --chipsets <dir>      Chipset source (repeatable)
  --exclude <pattern>   Skip paths containing this substring (repeatable)
  --dry-run             Don't write to the arena; just report
  --verbose             Print every resource as it's processed
  --help, -h            Print this help and exit

Defaults for sources:
  skills:   .claude/skills, ~/.claude/skills
  agents:   .claude/agents, ~/.claude/agents
  teams:    ~/.claude/teams, .claude/teams
  chipsets: data/chipset

Default excludes:
  ${DEFAULT_EXCLUDES.join(', ')}
`);
}

// ─── Resource kinds ─────────────────────────────────────────────────────────

type ResourceKind = 'skills' | 'agents' | 'teams' | 'chipsets';

interface ParsedResource {
  kind: ResourceKind;
  rawName: string;      // original name on disk
  name: string;         // kind-prefixed Grove name, e.g. "agents/audio-engineer"
  description: string;
  body: string;         // full raw content (frontmatter + body as read from disk)
  sourcePath: string;
  activationPatterns: string[];
}

// ─── Exclusion check ────────────────────────────────────────────────────────

function isExcluded(path: string, excludes: string[]): boolean {
  for (const pattern of excludes) {
    if (path.includes(pattern)) return true;
  }
  return false;
}

// ─── Parsers per kind ───────────────────────────────────────────────────────

/**
 * Skill: directory containing SKILL.md with YAML frontmatter.
 */
async function parseSkill(sourceDir: string, dirName: string): Promise<ParsedResource | null> {
  const skillPath = join(sourceDir, dirName, 'SKILL.md');
  try {
    const s = await stat(skillPath);
    if (!s.isFile()) return null;
  } catch {
    return null;
  }
  const raw = await readFile(skillPath, 'utf-8');
  const result = safeParseFrontmatter(raw);
  if (result === null) return null;
  if (result.repaired) {
    repairedSourcePaths.push(skillPath);
  }
  const data = (result.parsed.data ?? {}) as Record<string, unknown>;
  const name = typeof data.name === 'string' ? data.name : dirName;
  const description = typeof data.description === 'string' ? data.description : '';
  return {
    kind: 'skills',
    rawName: dirName,
    name: `skills/${name}`,
    description,
    body: raw,
    sourcePath: skillPath,
    activationPatterns: extractActivationPatterns(data),
  };
}

/**
 * Agent: either a flat .md file (AGENT.md-format content) OR a directory
 * containing AGENT.md. Both are supported.
 */
async function parseAgent(sourceDir: string, entry: string): Promise<ParsedResource | null> {
  const entryPath = join(sourceDir, entry);
  let s;
  try {
    s = await stat(entryPath);
  } catch {
    return null;
  }

  let agentPath: string;
  let rawName: string;
  if (s.isFile() && extname(entry) === '.md') {
    agentPath = entryPath;
    rawName = basename(entry, '.md');
  } else if (s.isDirectory()) {
    const candidate = join(entryPath, 'AGENT.md');
    try {
      const ss = await stat(candidate);
      if (!ss.isFile()) return null;
    } catch {
      return null;
    }
    agentPath = candidate;
    rawName = entry;
  } else {
    return null;
  }

  const raw = await readFile(agentPath, 'utf-8');
  const result = safeParseFrontmatter(raw);
  if (result === null) return null;
  if (result.repaired) {
    repairedSourcePaths.push(agentPath);
  }
  const data = (result.parsed.data ?? {}) as Record<string, unknown>;
  const name = typeof data.name === 'string' ? data.name : rawName;
  const description = typeof data.description === 'string' ? data.description : '';
  return {
    kind: 'agents',
    rawName,
    name: `agents/${name}`,
    description,
    body: raw,
    sourcePath: agentPath,
    activationPatterns: [],
  };
}

/**
 * Team: directory containing config.json (and usually README.md).
 * We serialize both into a combined body so the full definition is
 * recoverable from the Grove record.
 */
async function parseTeam(sourceDir: string, dirName: string): Promise<ParsedResource | null> {
  const teamDir = join(sourceDir, dirName);
  try {
    const s = await stat(teamDir);
    if (!s.isDirectory()) return null;
  } catch {
    return null;
  }

  const configPath = join(teamDir, 'config.json');
  if (!existsSync(configPath)) return null;

  const configRaw = await readFile(configPath, 'utf-8');
  let description = '';
  try {
    const config = JSON.parse(configRaw) as Record<string, unknown>;
    if (typeof config.description === 'string') description = config.description;
    else if (typeof config.name === 'string') description = `Team: ${config.name}`;
  } catch {
    description = `Team: ${dirName}`;
  }

  // Optional README.
  let readme = '';
  const readmePath = join(teamDir, 'README.md');
  if (existsSync(readmePath)) {
    readme = await readFile(readmePath, 'utf-8');
  }

  // Body combines both files with a simple separator so a reader can
  // reconstruct both.
  const body = [
    '## config.json',
    '```json',
    configRaw.trim(),
    '```',
    '',
    '## README.md',
    readme.trim() || '(no README)',
  ].join('\n');

  return {
    kind: 'teams',
    rawName: dirName,
    name: `teams/${dirName}`,
    description,
    body,
    sourcePath: configPath,
    activationPatterns: [],
  };
}

/**
 * Chipset: a .yaml file in a chipset source directory. Subdirectories
 * that contain a matching <name>/<name>.yaml are also supported
 * (e.g. `gastown-orchestration/gastown-orchestration.yaml`).
 */
async function parseChipset(sourceDir: string, entry: string): Promise<ParsedResource | null> {
  const entryPath = join(sourceDir, entry);
  let s;
  try {
    s = await stat(entryPath);
  } catch {
    return null;
  }

  let yamlPath: string;
  let rawName: string;
  if (s.isFile() && (entry.endsWith('.yaml') || entry.endsWith('.yml'))) {
    yamlPath = entryPath;
    rawName = basename(entry, extname(entry));
  } else if (s.isDirectory()) {
    // Look for <dir>/<dir>.yaml.
    const candidate = join(entryPath, `${entry}.yaml`);
    if (existsSync(candidate)) {
      yamlPath = candidate;
      rawName = entry;
    } else {
      return null;
    }
  } else {
    return null;
  }

  // Skip obvious non-chipset files (schema directories, etc.).
  if (rawName === 'schema') return null;

  const raw = await readFile(yamlPath, 'utf-8');
  // Best-effort name + description extraction from YAML. We don't
  // pull in a YAML parser — the content is small and these two
  // fields follow a predictable convention.
  const nameMatch = raw.match(/^name:\s*["']?([^"'\n]+)["']?\s*$/m);
  const descMatch = raw.match(/^description:\s*["']?([^"'\n]+)["']?\s*$/m);
  const name = nameMatch ? nameMatch[1].trim() : rawName;
  const description = descMatch ? descMatch[1].trim() : '';

  return {
    kind: 'chipsets',
    rawName,
    name: `chipsets/${rawName}`,
    description,
    body: raw,
    sourcePath: yamlPath,
    activationPatterns: [],
  };
}

function extractActivationPatterns(frontmatter: Record<string, unknown>): string[] {
  if (Array.isArray(frontmatter.activationPatterns)) {
    return frontmatter.activationPatterns.map(String);
  }
  if (Array.isArray(frontmatter.activation_patterns)) {
    return frontmatter.activation_patterns.map(String);
  }
  const activation = frontmatter.activation as Record<string, unknown> | undefined;
  if (activation && Array.isArray(activation.patterns)) {
    return (activation.patterns as unknown[]).map(String);
  }
  if (typeof frontmatter.trigger === 'string') {
    return frontmatter.trigger
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }
  return [];
}

// ─── Walk a source directory by kind ────────────────────────────────────────

async function walkSource(
  sourceDir: string,
  kind: ResourceKind,
  excludes: string[],
  depth = 0,
): Promise<ParsedResource[]> {
  if (isExcluded(sourceDir, excludes)) return [];
  const out: ParsedResource[] = [];
  let entries: string[];
  try {
    entries = await readdir(sourceDir);
  } catch {
    return out;
  }
  for (const entry of entries.sort()) {
    if (entry.startsWith('.')) continue;
    const entryPath = join(sourceDir, entry);
    if (isExcluded(entryPath, excludes)) continue;
    let parsed: ParsedResource | null = null;
    switch (kind) {
      case 'skills':
        parsed = await parseSkill(sourceDir, entry);
        break;
      case 'agents':
        parsed = await parseAgent(sourceDir, entry);
        break;
      case 'teams':
        parsed = await parseTeam(sourceDir, entry);
        break;
      case 'chipsets':
        parsed = await parseChipset(sourceDir, entry);
        break;
    }
    if (parsed) {
      out.push(parsed);
      continue;
    }
    // Nested-category support: when the entry didn't resolve to a resource
    // but is a directory, descend one level. This handles layouts like
    // examples/skills/psychology/social-psychology/SKILL.md without
    // requiring every category to be passed as a separate source. We cap
    // the recursion at depth 1 to keep behavior predictable.
    if (depth >= 1) continue;
    let isDir = false;
    try {
      isDir = (await stat(entryPath)).isDirectory();
    } catch {
      continue;
    }
    if (!isDir) continue;
    const nested = await walkSource(entryPath, kind, excludes, depth + 1);
    out.push(...nested);
  }
  return out;
}

// ─── Import loop ────────────────────────────────────────────────────────────

interface ImportResult {
  source: string;
  kind: ResourceKind;
  name: string;
  action: 'imported' | 'skipped' | 'error';
  hash?: string;
  reason?: string;
}

async function importResources(
  codebase: SkillCodebase,
  resources: ParsedResource[],
  dryRun: boolean,
  verbose: boolean,
): Promise<ImportResult[]> {
  const results: ImportResult[] = [];
  for (const r of resources) {
    if (dryRun) {
      results.push({ source: r.sourcePath, kind: r.kind, name: r.name, action: 'imported' });
      if (verbose) console.log(`  ~ ${r.name} (dry-run)`);
      continue;
    }
    try {
      const spec: SkillSpec = {
        name: r.name,
        description: r.description,
        body: r.body,
        activationPatterns: r.activationPatterns,
        dependencies: [],
      };
      const defineResult = await codebase.define(spec, {
        author: 'filesystem-import',
        sessionId: 'import-filesystem-skills',
        toolVersion: 'import-filesystem-skills/1.1',
      });
      const hashHex = hashRefToHex(defineResult.hash);
      results.push({
        source: r.sourcePath,
        kind: r.kind,
        name: r.name,
        action: defineResult.created ? 'imported' : 'skipped',
        hash: hashHex,
      });
      if (verbose) {
        const marker = defineResult.created ? '+' : '=';
        console.log(`  ${marker} ${r.name} → ${hashHex.slice(0, 12)}`);
      }
    } catch (err) {
      results.push({
        source: r.sourcePath,
        kind: r.kind,
        name: r.name,
        action: 'error',
        reason: (err as Error).message,
      });
      console.error(`  ✗ ${r.name}: ${(err as Error).message}`);
    }
  }
  return results;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  console.log('Grove filesystem-library import');
  console.log(`  arena:      ${args.arenaPath}`);
  console.log(`  dry-run:    ${args.dryRun ? 'yes' : 'no'}`);
  console.log(`  excludes:   ${args.excludes.join(', ')}`);
  console.log(`  skills:     ${args.skillSources.length} source(s)`);
  for (const s of args.skillSources) console.log(`              ${s}`);
  console.log(`  agents:     ${args.agentSources.length} source(s)`);
  for (const s of args.agentSources) console.log(`              ${s}`);
  console.log(`  teams:      ${args.teamSources.length} source(s)`);
  for (const s of args.teamSources) console.log(`              ${s}`);
  console.log(`  chipsets:   ${args.chipsetSources.length} source(s)`);
  for (const s of args.chipsetSources) console.log(`              ${s}`);
  console.log();

  const invoke = createNodeArenaInvoke({ snapshotPath: args.arenaPath });
  const arena = new RustArena(invoke);
  await arena.init({ dir: args.arenaPath + '-dir', numSlots: 4096 });
  const cas = new ContentAddressedStore({ arena });
  await cas.loadIndex();
  const codebase = new SkillCodebase({ cas });

  // Gather all resources grouped by kind.
  const all: ParsedResource[] = [];
  for (const src of args.skillSources) {
    const found = await walkSource(src, 'skills', args.excludes);
    all.push(...found);
    console.log(`Skills    (${src}): ${found.length}`);
  }
  for (const src of args.agentSources) {
    const found = await walkSource(src, 'agents', args.excludes);
    all.push(...found);
    console.log(`Agents    (${src}): ${found.length}`);
  }
  for (const src of args.teamSources) {
    const found = await walkSource(src, 'teams', args.excludes);
    all.push(...found);
    console.log(`Teams     (${src}): ${found.length}`);
  }
  for (const src of args.chipsetSources) {
    const found = await walkSource(src, 'chipsets', args.excludes);
    all.push(...found);
    console.log(`Chipsets  (${src}): ${found.length}`);
  }
  console.log();

  // Import.
  const results = await importResources(codebase, all, args.dryRun, args.verbose);

  if (!args.dryRun) {
    await arena.checkpoint();
    console.log(`\nArena snapshot written to ${args.arenaPath}`);
  }

  // Summary.
  const byKind: Record<ResourceKind, { imported: number; skipped: number; errors: number }> = {
    skills: { imported: 0, skipped: 0, errors: 0 },
    agents: { imported: 0, skipped: 0, errors: 0 },
    teams: { imported: 0, skipped: 0, errors: 0 },
    chipsets: { imported: 0, skipped: 0, errors: 0 },
  };
  for (const r of results) {
    if (r.action === 'imported') byKind[r.kind].imported++;
    else if (r.action === 'skipped') byKind[r.kind].skipped++;
    else byKind[r.kind].errors++;
  }

  console.log();
  console.log('Summary');
  console.log('  kind      imported  skipped  errors');
  console.log('  --------  --------  -------  ------');
  for (const kind of Object.keys(byKind) as ResourceKind[]) {
    const b = byKind[kind];
    console.log(
      `  ${kind.padEnd(8)}  ${String(b.imported).padStart(8)}  ${String(b.skipped).padStart(7)}  ${String(b.errors).padStart(6)}`,
    );
  }
  const totalImported = Object.values(byKind).reduce((s, v) => s + v.imported, 0);
  const totalSkipped = Object.values(byKind).reduce((s, v) => s + v.skipped, 0);
  const totalErrors = Object.values(byKind).reduce((s, v) => s + v.errors, 0);
  console.log('  --------  --------  -------  ------');
  console.log(
    `  ${'total'.padEnd(8)}  ${String(totalImported).padStart(8)}  ${String(totalSkipped).padStart(7)}  ${String(totalErrors).padStart(6)}`,
  );

  if (!args.dryRun) {
    const names = await codebase.listNames();
    console.log();
    console.log(`${names.length} resources bound in Grove namespace.`);
  }

  // Surface in-memory frontmatter repairs so operators know which source
  // files need permanent fixes. The importer only repairs in-memory — the
  // files on disk still have unquoted descriptions and will continue to
  // trip any other tool that runs gray-matter on them directly.
  if (repairedSourcePaths.length > 0) {
    console.log();
    console.log(
      `⚠ ${repairedSourcePaths.length} source file(s) had unquoted description ` +
        `lines containing ": " — repaired in-memory only:`,
    );
    for (const p of repairedSourcePaths) console.log(`    ${p}`);
    console.log(
      `  To permanently fix, edit each file and wrap the description value in "".`,
    );
  }

  if (totalErrors > 0) process.exit(1);
}

// Only run as a script when invoked directly (not when imported from a
// test for access to safeParseFrontmatter / repairUnquotedDescription).
import { fileURLToPath } from 'node:url';
const isMain = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error('import-filesystem-skills failed:', err);
    process.exit(1);
  });
}
