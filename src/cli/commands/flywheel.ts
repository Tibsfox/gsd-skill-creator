/**
 * Flywheel CLI command — capstone observability over the full adaptive-learning
 * flywheel. Assembles a single navigable lineage chain
 *
 *   source → department concept → skill → activations → corrections
 *
 * by joining four otherwise-siloed subsystems on the normalized skill name:
 *
 *   - the unified source ledger        (src/source-ledger)
 *   - the .college department concepts (loaded via dynamic import, like college)
 *   - usage telemetry + correction magnets (src/telemetry usage-pattern-detector)
 *
 * The cross-subsystem join key is documented and only PARTIALLY solved — see
 * src/flywheel/lineage.ts. Upstream (source/concept → skill) links are inferred
 * and tagged with their confidence; the downstream telemetry join is exact.
 *
 * Concept join: EXPLICIT for concepts named in the checked-in
 * `.college/mappings/concept-skills.json` back-link (rendered WITHOUT a flag);
 * HEURISTIC (token overlap) for the unmapped remainder, suppressed unless the
 * caller passes `--allow-heuristic` (assembleFlywheelChain's allowHeuristic).
 * The mapping is partial by design — expanding it (or auto-populating it
 * semantically) grows the explicit coverage without touching this code.
 *
 *   flywheel status              Overview: skills with telemetry + coverage
 *   flywheel status <skill>      Full lineage chain for one skill
 *   flywheel status <skill> --json   Machine-readable chain
 *   flywheel status <skill> --html <path>  Emit a self-contained Sankey render
 *
 * The `.college/` tree lives outside src/ rootDir, so its concept registry is
 * pulled in through a computed dynamic import() (mirrors college.ts).
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { SourceLedger, type SourceLedgerEntry } from '../../source-ledger/source-ledger.js';
import { TelemetryEventStore } from '../../telemetry/telemetry-event-store.js';
import { UsagePatternDetector } from '../../telemetry/usage-pattern-detector.js';
import type { SkillPatternEntry } from '../../telemetry/types.js';
import { sankeyLayout } from '../../atlas/sankey/layout.js';
import { sankeyToSvg } from '../../atlas/sankey/renderer-svg.js';
import {
  assembleFlywheelChain,
  formatFlywheelChain,
  flywheelToSankey,
  type ConceptLike,
  type FlywheelChain,
} from '../../flywheel/lineage.js';

const DEFAULT_TELEMETRY_PATH = '.planning/patterns/telemetry-events.jsonl';

// ─── Argument parsing (pure, tested) ─────────────────────────────────────────

export interface ParsedFlywheelArgs {
  subcommand: string | undefined;
  skill?: string;
  path?: string;
  telemetry?: string;
  html?: string;
  json: boolean;
  help: boolean;
  /**
   * Opt into the heuristic (token-overlap) tier of the upstream join. OFF by
   * default: the `.college` concept model carries no concept→skill back-link, so
   * without this flag the concept stage renders empty (only explicit-confidence
   * links survive). A real back-link is the durable fix; this flag makes the
   * heuristic tier reachable in the meantime.
   */
  allowHeuristic: boolean;
}

/** Parse the argument slice after `flywheel`. */
export function parseFlywheelArgs(args: string[]): ParsedFlywheelArgs {
  const positional: string[] = [];
  let path: string | undefined;
  let telemetry: string | undefined;
  let html: string | undefined;
  let json = false;
  let help = false;
  let allowHeuristic = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '--help' || a === '-h') help = true;
    else if (a === '--json') json = true;
    else if (a === '--allow-heuristic') allowHeuristic = true;
    else if (a === '--path') path = args[++i];
    else if (a.startsWith('--path=')) path = a.slice('--path='.length);
    else if (a === '--telemetry') telemetry = args[++i];
    else if (a.startsWith('--telemetry=')) telemetry = a.slice('--telemetry='.length);
    else if (a === '--html') html = args[++i];
    else if (a.startsWith('--html=')) html = a.slice('--html='.length);
    else if (!a.startsWith('-')) positional.push(a);
  }
  return { subcommand: positional[0], skill: positional[1], path, telemetry, html, json, help, allowHeuristic };
}

// ─── .college/ runtime resolution (mirrors college.ts) ───────────────────────

interface ConceptEvidenceLike {
  id: string;
  domain: string;
  name?: string;
}
interface ConceptRegistryLike {
  getAll(): ConceptEvidenceLike[];
}
interface CollegeLoaderLike {
  populateRegistry(registry: ConceptRegistryLike): number;
}
interface CollegeBarrel {
  CollegeLoader: new (basePath?: string) => CollegeLoaderLike;
}
interface RosettaCoreBarrel {
  ConceptRegistry: new () => ConceptRegistryLike;
}

function collegeRoot(): string {
  const envRoot = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
  return envRoot && envRoot.length > 0 ? envRoot : process.cwd();
}

function moduleUrl(...relSegments: string[]): string {
  const base = join(collegeRoot(), ...relSegments);
  const tsPath = `${base}.ts`;
  const jsPath = `${base}.js`;
  return pathToFileURL(existsSync(tsPath) ? tsPath : jsPath).href;
}

/**
 * Load the .college concept registry. Returns [] when the tree is absent or
 * fails to parse, so the flywheel still renders its other stages.
 */
/**
 * Invert a skill-keyed concept→skill mapping into concept→skills[]. Pure.
 * (Exported for tests.)
 */
export function buildConceptSkillMap(
  raw: { mappings?: Array<{ skill?: string; concepts?: string[] }> } | null | undefined,
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const m of raw?.mappings ?? []) {
    if (!m || typeof m.skill !== 'string') continue;
    for (const conceptId of m.concepts ?? []) {
      if (typeof conceptId !== 'string') continue;
      const arr = map.get(conceptId) ?? [];
      if (!arr.includes(m.skill)) arr.push(m.skill);
      map.set(conceptId, arr);
    }
  }
  return map;
}

/**
 * Read the checked-in `.college/mappings/concept-skills.json` back-link, tolerant
 * of absence/corruption (→ empty map). This is the DURABLE, explicit concept→skill
 * join: mapped concepts render as explicit links without `--allow-heuristic`; the
 * unmapped remainder stays heuristic-only (opt-in).
 */
function loadConceptSkillMap(): Map<string, string[]> {
  try {
    const path = join(collegeRoot(), '.college', 'mappings', 'concept-skills.json');
    if (!existsSync(path)) return new Map();
    return buildConceptSkillMap(JSON.parse(readFileSync(path, 'utf8')));
  } catch {
    return new Map();
  }
}

async function loadConcepts(): Promise<ConceptLike[]> {
  try {
    const { CollegeLoader } = (await import(
      moduleUrl('.college', 'college', 'index')
    )) as unknown as CollegeBarrel;
    const { ConceptRegistry } = (await import(
      moduleUrl('.college', 'rosetta-core', 'concept-registry')
    )) as unknown as RosettaCoreBarrel;
    const loader = new CollegeLoader(join(collegeRoot(), '.college', 'departments'));
    const registry = new ConceptRegistry();
    loader.populateRegistry(registry);
    const skillMap = loadConceptSkillMap();
    return registry
      .getAll()
      .map((c) => ({ id: c.id, domain: c.domain, name: c.name, skills: skillMap.get(c.id) }));
  } catch {
    return [];
  }
}

// ─── Telemetry loading ───────────────────────────────────────────────────────

interface TelemetrySlice {
  entry: SkillPatternEntry | undefined;
  correctionMagnet: boolean;
  correctionCount: number;
  allSkills: SkillPatternEntry[];
  totalSessions: number;
  available: boolean;
}

/**
 * Read the telemetry event store, run the usage-pattern detector, and slice out
 * one skill's entry plus its raw correction count. Tolerant of a missing store.
 */
async function loadTelemetry(telemetryPath: string, skill: string): Promise<TelemetrySlice> {
  const store = new TelemetryEventStore({ filePath: telemetryPath });
  const events = await store.read();
  const correctionCount = events.filter(
    (e) => e.type === 'skill-correction' && e.skillName === skill,
  ).length;

  const detector = new UsagePatternDetector(store);
  const report = await detector.analyze();
  if (report.type !== 'report') {
    return {
      entry: undefined,
      correctionMagnet: false,
      correctionCount,
      allSkills: [],
      totalSessions: report.sessionCount,
      available: false,
    };
  }
  return {
    entry: report.analyzedSkills.find((s) => s.skillName === skill),
    correctionMagnet: report.correctionMagnets.includes(skill),
    correctionCount,
    allSkills: report.analyzedSkills,
    totalSessions: report.totalSessions,
    available: true,
  };
}

// ─── HTML render (atlas Sankey drop-in) ──────────────────────────────────────

const STAGE_COLORS: Record<string, string> = {
  source: '#6b8e6b',
  concept: '#4a90d9',
  skill: '#d98a4a',
  activation: '#8a6bd9',
  correction: '#d94a6b',
};

function renderFlywheelHtml(chain: FlywheelChain): string {
  const { nodes, links } = flywheelToSankey(chain);
  const stageOf = new Map(chain.nodes.map((n) => [n.id, n.stage]));
  const layout = sankeyLayout(nodes, links, { width: 900, height: 420 });
  const g = sankeyToSvg(layout, {
    nodeColor: (n) => STAGE_COLORS[stageOf.get(n.id) ?? 'skill'] ?? '#888',
  });
  const esc = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Flywheel lineage — ${esc(chain.skill)}</title>
<style>body{font:14px/1.5 system-ui,sans-serif;margin:2rem;color:#222}
h1{font-size:1.2rem}pre{background:#f6f6f6;padding:1rem;border-radius:6px;overflow:auto}
.legend span{display:inline-block;margin-right:1rem}.sw{display:inline-block;width:12px;height:12px;border-radius:2px;vertical-align:middle;margin-right:4px}</style>
</head><body>
<h1>Flywheel lineage — ${esc(chain.skill)}</h1>
<p class="legend">${Object.entries(STAGE_COLORS)
    .map(([k, v]) => `<span><i class="sw" style="background:${v}"></i>${k}</span>`)
    .join('')}</p>
<svg width="900" height="420" viewBox="0 0 900 420">${g}</svg>
<pre>${esc(formatFlywheelChain(chain))}</pre>
</body></html>`;
}

// ─── Overview (bare `status`) ────────────────────────────────────────────────

function formatOverview(slice: TelemetrySlice, sourceCount: number, conceptCount: number): string {
  const lines: string[] = [];
  lines.push(pc.bold('Flywheel overview'));
  lines.push(`  ledger sources: ${sourceCount}   college concepts: ${conceptCount}`);
  if (!slice.available) {
    lines.push(
      `  telemetry: insufficient (${slice.totalSessions} session(s)) — run with more usage data`,
    );
    lines.push('  Pass a skill name for a single-skill lineage: flywheel status <skill>');
    return lines.join('\n');
  }
  lines.push(`  telemetry: ${slice.totalSessions} session(s), ${slice.allSkills.length} skill(s)`);
  const ranked = [...slice.allSkills]
    .sort((a, b) => b.loadRate * b.avgScore - a.loadRate * a.avgScore)
    .slice(0, 15);
  for (const s of ranked) {
    lines.push(
      `    ${s.skillName} — ${s.loadCount} load(s), avg ${s.avgScore.toFixed(2)}, rate ${Math.round(s.loadRate * 100)}%`,
    );
  }
  lines.push('  Pass a skill name for its full lineage: flywheel status <skill>');
  return lines.join('\n');
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleStatus(parsed: ParsedFlywheelArgs): Promise<number> {
  const ledgerPath = parsed.path;
  const telemetryPath = parsed.telemetry ?? DEFAULT_TELEMETRY_PATH;

  const ledger = new SourceLedger(ledgerPath);
  let sources: SourceLedgerEntry[];
  try {
    sources = await ledger.list();
  } catch {
    sources = [];
  }

  // Bare `status`: subsystem overview.
  if (!parsed.skill) {
    const concepts = await loadConcepts();
    const slice = await loadTelemetry(telemetryPath, '');
    if (parsed.json) {
      console.log(
        JSON.stringify(
          {
            sourceCount: sources.length,
            conceptCount: concepts.length,
            telemetryAvailable: slice.available,
            totalSessions: slice.totalSessions,
            skills: slice.allSkills,
          },
          null,
          2,
        ),
      );
    } else {
      console.log(formatOverview(slice, sources.length, concepts.length));
    }
    return 0;
  }

  const skill = parsed.skill;
  const [concepts, slice] = await Promise.all([loadConcepts(), loadTelemetry(telemetryPath, skill)]);

  const chain = assembleFlywheelChain({
    skill,
    sources,
    concepts,
    telemetry: slice.entry,
    correctionMagnet: slice.correctionMagnet,
    correctionCount: slice.correctionCount,
    allowHeuristic: parsed.allowHeuristic,
  });

  if (parsed.html) {
    try {
      mkdirSync(dirname(parsed.html), { recursive: true });
      writeFileSync(parsed.html, renderFlywheelHtml(chain), 'utf8');
      p.log.success(`Wrote flywheel lineage render to ${parsed.html}`);
      p.log.message(pc.dim(`  ${chain.nodes.length} node(s), ${chain.links.length} link(s).`));
      return 0;
    } catch (err) {
      p.log.error(`Failed to write --html ${parsed.html}: ${(err as Error).message}`);
      return 1;
    }
  }

  if (parsed.json) {
    console.log(JSON.stringify(chain, null, 2));
  } else {
    console.log(formatFlywheelChain(chain));
    if (!slice.available) {
      console.log(
        pc.dim(
          `  (telemetry insufficient: ${slice.totalSessions} session(s) at ${telemetryPath})`,
        ),
      );
    }
  }
  return 0;
}

// ─── Help ────────────────────────────────────────────────────────────────────

function printFlywheelHelp(): void {
  p.log.message('');
  p.log.message(pc.bold('Flywheel — navigable lineage across the learning flywheel'));
  p.log.message('');
  p.log.message('  Chain: source -> department concept -> skill -> activations -> corrections');
  p.log.message('');
  p.log.message('  Subcommands:');
  p.log.message(`    ${pc.cyan('flywheel status')}                 Subsystem overview + telemetry-ranked skills`);
  p.log.message(`    ${pc.cyan('flywheel status <skill>')}         Full lineage chain for one skill`);
  p.log.message('');
  p.log.message('  Flags:');
  p.log.message('    --json             Machine-readable output');
  p.log.message('    --html <path>      Emit a self-contained Sankey render (atlas)');
  p.log.message('    --path <ledger>    Override the source-ledger path');
  p.log.message('    --telemetry <p>    Override the telemetry event-store path');
  p.log.message('    --allow-heuristic  Include token-overlap (heuristic) upstream links.');
  p.log.message('                       OFF by default; the concept stage is empty without it');
  p.log.message('                       until a real concept->skill back-link exists.');
  p.log.message('');
  p.log.message('  Examples:');
  p.log.message('    skill-creator flywheel status');
  p.log.message('    skill-creator flywheel status commit-style');
  p.log.message('    skill-creator flywheel status commit-style --allow-heuristic');
  p.log.message('    skill-creator flywheel status commit-style --html out/flywheel.html');
}

// ─── Entry point ─────────────────────────────────────────────────────────────

/**
 * Flywheel CLI command entry point.
 *
 * @param args - argument slice after `flywheel`
 * @returns exit code (0 success, non-zero failure)
 */
export async function flywheelCommand(args: string[]): Promise<number> {
  const parsed = parseFlywheelArgs(args);

  if (!parsed.subcommand || parsed.subcommand === 'help' || (parsed.help && !parsed.subcommand)) {
    printFlywheelHelp();
    return 0;
  }

  switch (parsed.subcommand) {
    case 'status':
    case 'st':
      return handleStatus(parsed);
    default:
      p.log.error(`Unknown flywheel subcommand: ${parsed.subcommand}`);
      printFlywheelHelp();
      return 1;
  }
}
