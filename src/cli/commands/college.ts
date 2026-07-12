/**
 * College CLI command.
 *
 * Front door to the `.college/` department cluster, which until now was only
 * reachable programmatically. Exposes the College tree to operators via:
 *
 * - list                        all discovered departments + coverage counts
 * - explore <dept[/wing[/id]]>  resolve a path through the department hierarchy
 * - translate <conceptId>       (deferred) Rosetta cross-panel translation
 * - try <dept> [session]        run / list a department's try-sessions
 *
 * The `.college/` tree lives outside the `src/` rootDir, so its classes cannot
 * be statically imported. They are pulled in at runtime through computed
 * dynamic `import()` specifiers, preferring the `.ts` sources (dev / vitest /
 * tsx) and falling back to `.js` (post-build). Every later college verb
 * (doctor, scaffold, calibrate, xref, gen-trysession) attaches to this
 * dispatcher.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as p from '@clack/prompts';
import pc from 'picocolors';

// ─── Structural handles on the .college/ surface ────────────────────────────
// Declared locally because the concrete types live outside src/ rootDir.

interface DepartmentSummaryLike {
  id: string;
  name: string;
  description: string;
  wings: Array<{ id: string; name: string; description: string; conceptCount: number }>;
  entryPoint: string;
  trySessions: Array<{ id: string; name: string; estimatedDuration: string }>;
  tokenCost: number;
}

interface ConceptLike {
  id: string;
  name?: string;
  description?: string;
}

interface WingContentLike {
  concepts: ConceptLike[];
}

interface CollegeLoaderLike {
  listDepartments(): string[];
  loadSummary(id: string): Promise<DepartmentSummaryLike>;
  loadWing(dept: string, wing: string): Promise<WingContentLike>;
}

interface ConceptRegistryLike {
  register(concept: ConceptLike): void;
}

interface ExplorationResultLike {
  path: string;
  concept: ConceptLike;
  wing: { id: string; name: string };
  departmentId: string;
  pedagogicalContext: string;
  relatedPaths: string[];
}

interface DepartmentExplorerLike {
  explore(path: string): Promise<ExplorationResultLike>;
}

interface TryStepLike {
  instruction: string;
  expectedOutcome: string;
  hint?: string;
}

interface TrySessionRunnerLike {
  getState(): { title: string; totalSteps: number };
  getProgress(): { currentStep: number; totalSteps: number; percentComplete: number };
  getCurrentStep(): TryStepLike;
  getPrerequisites(): string[];
}

interface CollegeBarrel {
  CollegeLoader: new (basePath?: string) => CollegeLoaderLike;
  DepartmentExplorer: new (
    loader: CollegeLoaderLike,
    registry: ConceptRegistryLike,
  ) => DepartmentExplorerLike;
  TrySessionRunner: {
    loadSession(
      loader: CollegeLoaderLike,
      departmentId: string,
      sessionId: string,
    ): Promise<TrySessionRunnerLike>;
  };
}

interface RosettaCoreBarrel {
  ConceptRegistry: new () => ConceptRegistryLike;
}

// ─── Argument parsing (pure, tested) ────────────────────────────────────────

export interface ParsedCollegeArgs {
  subcommand: string | undefined;
  positional: string[];
  to?: string;
  topic?: string;
  wings?: string;
  help: boolean;
}

/**
 * Parse the argument slice after `college`. Recognises `--to <panel>`,
 * `--topic <t>`, `--wings <a,b,c>` (and their `--flag=value` forms) plus
 * `--help`/`-h`; all other dashed tokens are ignored.
 */
export function parseCollegeArgs(args: string[]): ParsedCollegeArgs {
  const positional: string[] = [];
  let to: string | undefined;
  let topic: string | undefined;
  let wings: string | undefined;
  let help = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '--help' || a === '-h') {
      help = true;
    } else if (a === '--to') {
      to = args[++i];
    } else if (a.startsWith('--to=')) {
      to = a.slice('--to='.length);
    } else if (a === '--topic') {
      topic = args[++i];
    } else if (a.startsWith('--topic=')) {
      topic = a.slice('--topic='.length);
    } else if (a === '--wings') {
      wings = args[++i];
    } else if (a.startsWith('--wings=')) {
      wings = a.slice('--wings='.length);
    } else if (!a.startsWith('-')) {
      positional.push(a);
    }
  }
  return { subcommand: positional[0], positional: positional.slice(1), to, topic, wings, help };
}

// ─── Formatting (pure, tested) ──────────────────────────────────────────────

export interface DepartmentRow {
  id: string;
  name: string;
  wingCount: number;
  conceptCount: number;
  sessionCount: number;
}

export function formatDepartmentList(rows: DepartmentRow[]): string {
  if (rows.length === 0) return 'No departments found under .college/departments.';
  const lines = rows.map(
    (r) =>
      `  ${r.id} — ${r.name} (${r.wingCount} wings, ${r.conceptCount} concepts, ${r.sessionCount} sessions)`,
  );
  return `Departments (${rows.length}):\n${lines.join('\n')}`;
}

// ─── .college/ runtime resolution ───────────────────────────────────────────

function collegeRoot(): string {
  const envRoot = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
  return envRoot && envRoot.length > 0 ? envRoot : process.cwd();
}

function departmentsPath(): string {
  return join(collegeRoot(), '.college', 'departments');
}

function moduleUrl(...relSegments: string[]): string {
  const base = join(collegeRoot(), ...relSegments);
  const tsPath = `${base}.ts`;
  const jsPath = `${base}.js`;
  return pathToFileURL(existsSync(tsPath) ? tsPath : jsPath).href;
}

async function loadCollegeBarrel(): Promise<CollegeBarrel> {
  return (await import(moduleUrl('.college', 'college', 'index'))) as unknown as CollegeBarrel;
}

async function loadRosettaCore(): Promise<RosettaCoreBarrel> {
  return (await import(
    moduleUrl('.college', 'rosetta-core', 'concept-registry')
  )) as unknown as RosettaCoreBarrel;
}

// ─── Subcommand handlers ────────────────────────────────────────────────────

async function handleList(): Promise<number> {
  try {
    const { CollegeLoader } = await loadCollegeBarrel();
    const loader = new CollegeLoader(departmentsPath());
    const ids = loader.listDepartments();
    const rows: DepartmentRow[] = [];
    for (const id of ids) {
      const s = await loader.loadSummary(id);
      rows.push({
        id: s.id,
        name: s.name,
        wingCount: s.wings.length,
        conceptCount: s.wings.reduce((acc, w) => acc + w.conceptCount, 0),
        sessionCount: s.trySessions.length,
      });
    }
    console.log(formatDepartmentList(rows));
    return 0;
  } catch (err) {
    p.log.error(`Failed to list departments: ${(err as Error).message}`);
    return 1;
  }
}

async function handleExplore(pathArg: string | undefined): Promise<number> {
  if (!pathArg) {
    p.log.error('Usage: skill-creator college explore <dept[/wing[/conceptId]]>');
    return 1;
  }
  try {
    const { CollegeLoader, DepartmentExplorer } = await loadCollegeBarrel();
    const { ConceptRegistry } = await loadRosettaCore();
    const loader = new CollegeLoader(departmentsPath());
    const registry = new ConceptRegistry();

    // Populate the registry from the target department's wings. loadWing
    // parses concept files directly (no dynamic eval), so this is a light
    // inline populator sufficient for exploration until the dedicated
    // loader->registry populator lands.
    const deptId = pathArg.split('/').filter(Boolean)[0]!;
    const summary = await loader.loadSummary(deptId);
    for (const wing of summary.wings) {
      try {
        const wc = await loader.loadWing(deptId, wing.id);
        for (const concept of wc.concepts) registry.register(concept);
      } catch {
        // Skip wings whose concepts fail to parse.
      }
    }

    const explorer = new DepartmentExplorer(loader, registry);
    const result = await explorer.explore(pathArg);

    p.log.message(pc.bold(`${result.path}`));
    p.log.message(`  concept: ${result.concept.name ?? result.concept.id} (${result.concept.id})`);
    p.log.message(`  wing:    ${result.wing.name} (${result.wing.id})`);
    if (result.concept.description) {
      p.log.message(`  ${pc.dim(result.concept.description)}`);
    }
    if (result.relatedPaths.length > 0) {
      p.log.message(`  related: ${result.relatedPaths.join(', ')}`);
    }
    return 0;
  } catch (err) {
    p.log.error(`Exploration failed: ${(err as Error).message}`);
    return 1;
  }
}

function handleTranslate(conceptId: string | undefined, to: string | undefined): number {
  // Deferred: a real translation needs a fully wired RosettaCore (concept
  // registry + panel router + expression renderer + panel instances) and a
  // TranslationContext. Those cross-subsystem seams are a follow-up; the verb
  // is registered here so the front door stays complete and stable.
  const target = to ? ` --to ${to}` : '';
  const subject = conceptId ?? '<conceptId>';
  p.log.warn('college translate is not yet wired.');
  p.log.message(
    `Requested: translate ${subject}${target}. Cross-panel translation requires the` +
      ' Rosetta panel/renderer stack and a populated concept registry (follow-up).',
  );
  return 0;
}

async function handleTry(
  dept: string | undefined,
  session: string | undefined,
): Promise<number> {
  if (!dept) {
    p.log.error('Usage: skill-creator college try <dept> [session]');
    return 1;
  }
  try {
    const { CollegeLoader, TrySessionRunner } = await loadCollegeBarrel();
    const loader = new CollegeLoader(departmentsPath());

    if (!session) {
      const summary = await loader.loadSummary(dept);
      if (summary.trySessions.length === 0) {
        p.log.info(`No try-sessions found in department '${dept}'.`);
        return 0;
      }
      p.log.message(pc.bold(`Try-sessions in ${dept}:`));
      for (const s of summary.trySessions) {
        p.log.message(`  ${s.id} — ${s.name} (${s.estimatedDuration})`);
      }
      return 0;
    }

    const runner = await TrySessionRunner.loadSession(loader, dept, session);
    const state = runner.getState();
    const progress = runner.getProgress();
    const step = runner.getCurrentStep();
    const prereqs = runner.getPrerequisites();

    p.log.message(
      pc.bold(
        `${state.title} — step ${progress.currentStep + 1}/${progress.totalSteps} (${progress.percentComplete}% complete)`,
      ),
    );
    if (prereqs.length > 0) {
      p.log.message(`  prerequisites: ${prereqs.join(', ')}`);
    }
    p.log.message(`  instruction: ${step.instruction}`);
    if (step.hint) p.log.message(`  hint: ${step.hint}`);
    p.log.message(`  expected: ${step.expectedOutcome}`);
    return 0;
  } catch (err) {
    p.log.error(`Try-session failed: ${(err as Error).message}`);
    return 1;
  }
}

async function handleScaffoldDepartment(
  slug: string | undefined,
  topic: string | undefined,
  wingsCsv: string | undefined,
): Promise<number> {
  if (!slug || !topic || !wingsCsv) {
    p.log.error(
      'Usage: skill-creator college scaffold-department <slug> --topic <t> --wings a,b,c',
    );
    return 1;
  }
  const wings = wingsCsv
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean);
  if (wings.length === 0) {
    p.log.error('At least one wing is required (--wings a,b,c).');
    return 1;
  }
  try {
    const { scaffoldDepartment } = await import('../../college/scaffold-department.js');
    const result = scaffoldDepartment({
      slug,
      topic,
      wings,
      targetRoot: departmentsPath(),
    });
    p.log.success(`Scaffolded department '${result.slug}' at ${result.departmentDir}`);
    p.log.message(pc.bold(`  ${result.wings.length} wing(s):`));
    for (const w of result.wings) {
      p.log.message(`    ${w.id} — ${w.name} (${w.conceptId})`);
    }
    p.log.message(pc.dim(`  ${result.filesWritten.length} files written.`));
    p.log.message('  Run: skill-creator college list');
    return 0;
  } catch (err) {
    p.log.error(`Scaffold failed: ${(err as Error).message}`);
    return 1;
  }
}

// ─── Help ───────────────────────────────────────────────────────────────────

function printCollegeHelp(): void {
  p.log.message('');
  p.log.message(pc.bold('College — front door to the .college/ department cluster'));
  p.log.message('');
  p.log.message('  Subcommands:');
  p.log.message(`    ${pc.cyan('college list')}                        List all departments and coverage`);
  p.log.message(`    ${pc.cyan('college explore <dept[/wing[/id]]>')}  Resolve a path in the hierarchy`);
  p.log.message(`    ${pc.cyan('college translate <conceptId>')}       Cross-panel translation (deferred)`);
  p.log.message(`    ${pc.cyan('college try <dept> [session]')}        Run or list try-sessions`);
  p.log.message(
    `    ${pc.cyan('college scaffold-department <slug>')}   Mint a discoverable .college tree (--topic, --wings)`,
  );
  p.log.message('');
  p.log.message('  Examples:');
  p.log.message('    skill-creator college list');
  p.log.message('    skill-creator college explore mathematics/algebra');
  p.log.message('    skill-creator college translate exponential-decay --to graph');
  p.log.message('    skill-creator college try chemistry first-reaction');
}

// ─── Entry point ────────────────────────────────────────────────────────────

/**
 * College CLI command entry point.
 *
 * @param args - argument slice after `college`
 * @returns exit code (0 success, non-zero failure)
 */
export async function collegeCommand(args: string[]): Promise<number> {
  const parsed = parseCollegeArgs(args);

  if (!parsed.subcommand || parsed.subcommand === 'help' || (parsed.help && !parsed.subcommand)) {
    printCollegeHelp();
    return 0;
  }

  switch (parsed.subcommand) {
    case 'list':
    case 'ls':
      return handleList();
    case 'explore':
    case 'ex':
      return handleExplore(parsed.positional[0]);
    case 'translate':
    case 'tr':
      return handleTranslate(parsed.positional[0], parsed.to);
    case 'try':
      return handleTry(parsed.positional[0], parsed.positional[1]);
    case 'scaffold-department':
    case 'scaffold-dept':
      return handleScaffoldDepartment(parsed.positional[0], parsed.topic, parsed.wings);
    default:
      p.log.error(`Unknown college subcommand: ${parsed.subcommand}`);
      printCollegeHelp();
      return 1;
  }
}
