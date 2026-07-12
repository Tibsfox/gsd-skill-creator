/**
 * College CLI command.
 *
 * Front door to the `.college/` department cluster, which until now was only
 * reachable programmatically. Exposes the College tree to operators via:
 *
 * - list                        all discovered departments + coverage counts
 * - explore <dept[/wing[/id]]>  resolve a path through the department hierarchy
 * - translate <conceptId>       render a concept through a Rosetta language panel
 * - try <dept> [session]        run / list a department's try-sessions
 *
 * The `.college/` tree lives outside the `src/` rootDir, so its classes cannot
 * be statically imported. They are pulled in at runtime through computed
 * dynamic `import()` specifiers, preferring the `.ts` sources (dev / vitest /
 * tsx) and falling back to `.js` (post-build). Every later college verb
 * (doctor, scaffold, calibrate, xref, gen-trysession) attaches to this
 * dispatcher.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
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
  relationships?: ReadonlyArray<{ type: string; targetId: string; description?: string }>;
}

interface WingContentLike {
  concepts: ConceptLike[];
}

interface CollegeLoaderLike {
  listDepartments(): string[];
  loadSummary(id: string): Promise<DepartmentSummaryLike>;
  loadWing(dept: string, wing: string): Promise<WingContentLike>;
  getDepartmentPath(id: string): string;
  populateRegistry(registry: ConceptRegistryLike): number;
}

interface DoctorReportLike {
  flaggedCount: number;
  departments: unknown[];
  proposals: unknown[];
}

interface ConceptEvidenceLike {
  id: string;
  domain: string;
  relationships: ReadonlyArray<{ type: string; targetId: string; description?: string }>;
  complexPlanePosition?: { real: number; imaginary: number };
}

interface ConceptRegistryLike {
  register(concept: ConceptLike): void;
  getAll(): ConceptEvidenceLike[];
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
  runDepartmentDoctor(loader: CollegeLoaderLike): Promise<DoctorReportLike>;
  formatDoctorReport(report: DoctorReportLike): string;
}

interface RosettaCoreBarrel {
  ConceptRegistry: new () => ConceptRegistryLike;
}

interface XRefEdgesBarrel {
  ALL_XREF_EDGES: ReadonlyArray<{ from: string; to: string }>;
}

type TranslatePanelId =
  | 'python'
  | 'cpp'
  | 'java'
  | 'lisp'
  | 'pascal'
  | 'fortran'
  | 'perl'
  | 'algol'
  | 'unison'
  | 'natural';

interface PanelInstanceLike {
  readonly panelId: TranslatePanelId;
}

interface RenderedExpressionLike {
  content: string;
  panelId: string;
  tokenCost: number;
  crossReferences?: string[];
}

interface TranslationLike {
  id: string;
  primary: RenderedExpressionLike;
  secondary?: RenderedExpressionLike[];
  concept: { id: string; name?: string };
  panels: { primary: string; secondary?: string[]; rationale: string };
  dependenciesLoaded: Array<{ id: string; name?: string }>;
}

interface TranslationContextLike {
  userExpertise: string;
  requestedFormat?: string;
  currentDomain: string;
  recentPanels: string[];
  taskType: string;
}

interface RosettaCoreLike {
  translate(conceptId: string, context: TranslationContextLike): Promise<TranslationLike>;
}

interface PanelRouterLike {
  registerPanel(panel: PanelInstanceLike): void;
}

interface TranslateStackBarrel {
  ConceptRegistry: new () => ConceptRegistryLike;
  ConceptNotFoundError: new (...args: unknown[]) => Error;
  RosettaCore: new (opts: {
    registry: ConceptRegistryLike;
    router: PanelRouterLike;
    renderer: unknown;
    panelInstances: Map<string, PanelInstanceLike>;
  }) => RosettaCoreLike;
  PanelRouter: new () => PanelRouterLike;
  ExpressionRenderer: new () => unknown;
  panels: PanelInstanceLike[];
}

// ─── Argument parsing (pure, tested) ────────────────────────────────────────

export interface ParsedCollegeArgs {
  subcommand: string | undefined;
  positional: string[];
  to?: string;
  topic?: string;
  wings?: string;
  wing?: string;
  dept?: string;
  out?: string;
  task?: string;
  level?: string;
  json: boolean;
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
  let wing: string | undefined;
  let dept: string | undefined;
  let out: string | undefined;
  let task: string | undefined;
  let level: string | undefined;
  let json = false;
  let help = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '--help' || a === '-h') {
      help = true;
    } else if (a === '--json') {
      json = true;
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
    } else if (a === '--wing') {
      wing = args[++i];
    } else if (a.startsWith('--wing=')) {
      wing = a.slice('--wing='.length);
    } else if (a === '--out') {
      out = args[++i];
    } else if (a.startsWith('--out=')) {
      out = a.slice('--out='.length);
    } else if (a === '--dept') {
      dept = args[++i];
    } else if (a.startsWith('--dept=')) {
      dept = a.slice('--dept='.length);
    } else if (a === '--task') {
      task = args[++i];
    } else if (a.startsWith('--task=')) {
      task = a.slice('--task='.length);
    } else if (a === '--level') {
      level = args[++i];
    } else if (a.startsWith('--level=')) {
      level = a.slice('--level='.length);
    } else if (!a.startsWith('-')) {
      positional.push(a);
    }
  }
  return {
    subcommand: positional[0],
    positional: positional.slice(1),
    to,
    topic,
    wings,
    wing,
    dept,
    out,
    task,
    level,
    json,
    help,
  };
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

async function loadXRefEdges(): Promise<XRefEdgesBarrel> {
  return (await import(
    moduleUrl('.college', 'cross-references', 'dependency-graph-xrefs')
  )) as unknown as XRefEdgesBarrel;
}

/** The nine language panels the Rosetta stack can render into. */
const PANEL_MODULES: ReadonlyArray<readonly [string, string]> = [
  ['python-panel', 'PythonPanel'],
  ['cpp-panel', 'CppPanel'],
  ['java-panel', 'JavaPanel'],
  ['lisp-panel', 'LispPanel'],
  ['pascal-panel', 'PascalPanel'],
  ['fortran-panel', 'FortranPanel'],
  ['perl-panel', 'PerlPanel'],
  ['algol-panel', 'AlgolPanel'],
  ['unison-panel', 'UnisonPanel'],
];

/**
 * Assemble the full Rosetta translation stack (registry + engine + router +
 * renderer + the nine panel instances) via computed dynamic imports, since the
 * concrete classes live outside src/ rootDir.
 */
async function loadTranslateStack(): Promise<TranslateStackBarrel> {
  const [reg, eng, rtr, rnd] = await Promise.all([
    import(moduleUrl('.college', 'rosetta-core', 'concept-registry')),
    import(moduleUrl('.college', 'rosetta-core', 'engine')),
    import(moduleUrl('.college', 'rosetta-core', 'panel-router')),
    import(moduleUrl('.college', 'rosetta-core', 'expression-renderer')),
  ]);
  const panels: PanelInstanceLike[] = [];
  for (const [mod, cls] of PANEL_MODULES) {
    const m = (await import(moduleUrl('.college', 'panels', mod))) as Record<
      string,
      new () => PanelInstanceLike
    >;
    panels.push(new m[cls]!());
  }
  return {
    ConceptRegistry: reg.ConceptRegistry,
    ConceptNotFoundError: reg.ConceptNotFoundError,
    RosettaCore: eng.RosettaCore,
    PanelRouter: rtr.PanelRouter,
    ExpressionRenderer: rnd.ExpressionRenderer,
    panels,
  } as TranslateStackBarrel;
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

const VALID_TRANSLATE_PANELS: readonly string[] = [
  'python',
  'cpp',
  'java',
  'lisp',
  'pascal',
  'fortran',
  'perl',
  'algol',
  'unison',
  'natural',
];

async function handleTranslate(
  conceptId: string | undefined,
  to: string | undefined,
  taskType: string | undefined,
  expertise: string | undefined,
  json: boolean,
): Promise<number> {
  if (!conceptId) {
    p.log.error(
      'Usage: skill-creator college translate <conceptId> [--to <panel>] [--task <type>] [--level <expertise>] [--json]',
    );
    return 1;
  }
  if (to && !VALID_TRANSLATE_PANELS.includes(to)) {
    p.log.error(`Unknown panel '${to}'. Valid panels: ${VALID_TRANSLATE_PANELS.join(', ')}.`);
    return 1;
  }
  try {
    const { CollegeLoader } = await loadCollegeBarrel();
    const stack = await loadTranslateStack();
    const loader = new CollegeLoader(departmentsPath());
    const registry = new stack.ConceptRegistry();
    loader.populateRegistry(registry);

    const router = new stack.PanelRouter();
    const panelInstances = new Map<string, PanelInstanceLike>();
    for (const panel of stack.panels) {
      router.registerPanel(panel);
      panelInstances.set(panel.panelId, panel);
    }
    const renderer = new stack.ExpressionRenderer();
    const core = new stack.RosettaCore({ registry, router, renderer, panelInstances });

    const context: TranslationContextLike = {
      userExpertise: expertise ?? 'intermediate',
      requestedFormat: to,
      currentDomain: 'general',
      recentPanels: [],
      taskType: taskType ?? 'explain',
    };

    let translation: TranslationLike;
    try {
      translation = await core.translate(conceptId, context);
    } catch (err) {
      if (err instanceof stack.ConceptNotFoundError || /not found/i.test((err as Error).message)) {
        p.log.error(
          `No concept '${conceptId}' in the College registry. ` +
            'Run `skill-creator college list` or `college explore <dept>` to find concept ids.',
        );
        return 1;
      }
      throw err;
    }

    if (json) {
      console.log(JSON.stringify(translation, null, 2));
      return 0;
    }

    p.log.message('');
    p.log.message(
      pc.bold(`${translation.concept.name ?? translation.concept.id} (${translation.concept.id})`),
    );
    p.log.message(pc.dim(`  panel: ${translation.panels.primary} — ${translation.panels.rationale}`));
    p.log.message('');
    console.log(translation.primary.content);
    p.log.message('');
    p.log.message(pc.dim(`  ~${translation.primary.tokenCost} tokens`));
    if (translation.panels.secondary && translation.panels.secondary.length > 0) {
      p.log.message(pc.dim(`  also available: ${translation.panels.secondary.join(', ')}`));
    }
    if (translation.dependenciesLoaded.length > 0) {
      p.log.message(
        pc.dim(`  depends on: ${translation.dependenciesLoaded.map((d) => d.id).join(', ')}`),
      );
    }
    return 0;
  } catch (err) {
    p.log.error(`Translation failed: ${(err as Error).message}`);
    return 1;
  }
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

async function handleDoctor(json: boolean): Promise<number> {
  try {
    const { CollegeLoader, runDepartmentDoctor, formatDoctorReport } = await loadCollegeBarrel();
    const loader = new CollegeLoader(departmentsPath());
    const report = await runDepartmentDoctor(loader);
    if (json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(formatDoctorReport(report));
    }
    return 0;
  } catch (err) {
    p.log.error(`Department doctor failed: ${(err as Error).message}`);
    return 1;
  }
}

async function handleXrefSuggest(dept: string | undefined, json: boolean): Promise<number> {
  try {
    const { CollegeLoader } = await loadCollegeBarrel();
    const { ConceptRegistry } = await loadRosettaCore();
    const { ALL_XREF_EDGES } = await loadXRefEdges();
    const { suggestXrefEdges, formatXrefCandidates } = await import(
      '../../college/xref-suggester.js'
    );

    const loader = new CollegeLoader(departmentsPath());
    const registry = new ConceptRegistry();
    loader.populateRegistry(registry);

    const concepts = registry.getAll().map((c) => ({
      id: c.id,
      domain: c.domain,
      relationships: c.relationships ?? [],
      complexPlanePosition: c.complexPlanePosition,
    }));

    const candidates = suggestXrefEdges(
      concepts,
      ALL_XREF_EDGES.map((e) => ({ from: e.from, to: e.to })),
      { dept },
    );

    if (json) {
      console.log(JSON.stringify(candidates, null, 2));
    } else {
      console.log(formatXrefCandidates(candidates));
    }
    return 0;
  } catch (err) {
    p.log.error(`Xref suggest failed: ${(err as Error).message}`);
    return 1;
  }
}

async function handleGenTrysession(
  dept: string | undefined,
  wing: string | undefined,
  out: string | undefined,
  json: boolean,
): Promise<number> {
  if (!dept) {
    p.log.error('Usage: skill-creator college gen-trysession <dept> [--wing <id>] [--out <path>]');
    return 1;
  }
  try {
    const { CollegeLoader } = await loadCollegeBarrel();
    const { generateTrySession, serializeTrySession, validateGeneratedSession } = await import(
      '../../college/try-session-generator.js'
    );
    const loader = new CollegeLoader(departmentsPath());
    const summary = await loader.loadSummary(dept);

    const targetWings = wing ? summary.wings.filter((w) => w.id === wing) : summary.wings;
    if (wing && targetWings.length === 0) {
      p.log.error(
        `Wing '${wing}' not found in department '${dept}'. ` +
          `Available: ${summary.wings.map((w) => w.id).join(', ') || '(none)'}.`,
      );
      return 1;
    }

    const concepts: Array<{
      id: string;
      name?: string;
      description?: string;
      relationships?: ReadonlyArray<{ type: string; targetId: string; description?: string }>;
    }> = [];
    for (const w of targetWings) {
      try {
        const wc = await loader.loadWing(dept, w.id);
        for (const c of wc.concepts) {
          concepts.push({
            id: c.id,
            name: c.name,
            description: c.description,
            relationships: c.relationships,
          });
        }
      } catch {
        // Skip wings whose concepts fail to parse.
      }
    }

    if (concepts.length === 0) {
      p.log.info(
        `No parseable concepts found in department '${dept}'${wing ? ` wing '${wing}'` : ''}.`,
      );
      return 0;
    }

    const session = generateTrySession(concepts, { departmentId: dept, wingId: wing });
    const check = validateGeneratedSession(session);
    if (!check.valid) {
      p.log.error(`Generated session failed the structural quality bar: ${check.errors.join('; ')}`);
      return 1;
    }

    if (json) {
      console.log(JSON.stringify(session, null, 2));
      return 0;
    }

    if (out) {
      const source = serializeTrySession(session);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, source, 'utf8');
      p.log.success(`Wrote draft try-session '${session.id}' to ${out}`);
      p.log.message(pc.dim(`  ${session.steps.length} step(s). Review the DRAFT prompts before publishing.`));
      return 0;
    }

    p.log.message(pc.bold(`${session.title}`));
    p.log.message(`  id: ${session.id}`);
    p.log.message(`  steps: ${session.steps.length} (~${session.estimatedMinutes} min)`);
    if (session.prerequisites.length > 0) {
      p.log.message(`  prerequisites: ${session.prerequisites.join(', ')}`);
    }
    p.log.message(pc.bold('  ordered concepts:'));
    session.steps.forEach((s, i) => {
      p.log.message(`    ${i + 1}. ${s.conceptsExplored[0]}`);
    });
    p.log.message(pc.dim('  DRAFT scaffold — pass --out <path> to write, --json for the full definition.'));
    return 0;
  } catch (err) {
    p.log.error(`Try-session generation failed: ${(err as Error).message}`);
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
  p.log.message(
    `    ${pc.cyan('college translate <conceptId>')}       Render a concept through a Rosetta panel (--to, --task, --level, --json)`,
  );
  p.log.message(`    ${pc.cyan('college try <dept> [session]')}        Run or list try-sessions`);
  p.log.message(
    `    ${pc.cyan('college scaffold-department <slug>')}   Mint a discoverable .college tree (--topic, --wings)`,
  );
  p.log.message(
    `    ${pc.cyan('college doctor [--json]')}             Audit thin/stale department coverage`,
  );
  p.log.message(
    `    ${pc.cyan('college xref suggest [--dept] [--json]')} Propose new cross-dept prerequisite edges`,
  );
  p.log.message(
    `    ${pc.cyan('college gen-trysession <dept>')}          Generate a DRAFT try-session (--wing, --out, --json)`,
  );
  p.log.message('');
  p.log.message('  Examples:');
  p.log.message('    skill-creator college list');
  p.log.message('    skill-creator college explore mathematics/algebra');
  p.log.message('    skill-creator college translate math-complex-numbers --to python');
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
      return handleTranslate(parsed.positional[0], parsed.to, parsed.task, parsed.level, parsed.json);
    case 'try':
      return handleTry(parsed.positional[0], parsed.positional[1]);
    case 'scaffold-department':
    case 'scaffold-dept':
      return handleScaffoldDepartment(parsed.positional[0], parsed.topic, parsed.wings);
    case 'doctor':
    case 'dr':
      return handleDoctor(parsed.json);
    case 'xref':
    case 'xr': {
      const verb = parsed.positional[0];
      if (verb && verb !== 'suggest') {
        p.log.error(`Unknown college xref verb: ${verb} (expected 'suggest').`);
        return 1;
      }
      return handleXrefSuggest(parsed.dept, parsed.json);
    }
    case 'gen-trysession':
    case 'gen-try':
      return handleGenTrysession(parsed.positional[0], parsed.wing, parsed.out, parsed.json);
    default:
      p.log.error(`Unknown college subcommand: ${parsed.subcommand}`);
      printCollegeHelp();
      return 1;
  }
}
