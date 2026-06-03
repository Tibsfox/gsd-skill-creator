/**
 * `skill-creator cadence` — deterministic meta-cadence overdue-check.
 *
 * The four operational axes (codify / consume / calibrate / verify) each have a
 * prose "overdue" trigger in `docs/meta-cadence-discipline.md`. That prose check
 * was MISAPPLIED twice during the v1.49.944 session: the calibrate trigger's
 * conjunct (`>=20 observations AND >=10 ships`) was read as met when the
 * most-populated threshold had only 12 observations, and the consume trigger's
 * `wired:false` was string-matched against the DEFENSIVE catch-all branches in
 * `observation-sources.ts` (which fire only for non-existent threshold classes),
 * producing a false positive. Both errors are trigger-READING errors, not
 * judgement errors.
 *
 * This command surfaces the machine-readable signal for each axis so those
 * specific reading errors cannot recur:
 *
 *   - calibrate: enumerates `ALL_CALIBRATABLE_THRESHOLDS`, reads the ACTUAL
 *     observation count for each wired threshold, and reports whether any has
 *     reached the `>=20` first conjunct. (max=12 < 20 -> definitively not the
 *     first conjunct.)
 *   - consume: enumerates the REAL `CalibratableThreshold` union members and
 *     reports how many are genuinely `wired:false` — the defensive catch-alls
 *     never appear because we iterate real members, not the registry source.
 *
 * The second conjunct of each trigger — "`>=N` ships since the last X" — is
 * machine-tracked (v1.49.950) via the `cadence_advances: [axis, ...]` frontmatter
 * marker on release-notes READMEs: the most recent ship tagging an axis anchors
 * its ships-since count. When a first conjunct is met AND
 * `>=CADENCE_SHIPS_SINCE_CONJUNCT` ships have shipped since the last advance, the
 * verdict is `overdue` (the gate fires). When the first conjunct is met but the
 * anchor is unknown (no marker yet) or ships-since is below the threshold, the
 * verdict stays `candidate` — never a false `overdue`. The codify axis has no
 * cleanly machine-readable first-conjunct signal (no structured ESTABLISHED-
 * candidate backlog), so it reports `manual` with the manifest lesson count for
 * context. The verify axis checks the DEDICATED
 * `*-end-to-end.integration.test.ts` files (the #10453 substrate->calibration
 * closing-move convention): a wired threshold is "covered" iff one of those
 * dedicated end-to-end tests STRUCTURALLY WIRES it. Structural wiring requires
 * the test to exercise BOTH ends of the wire — pass the threshold to a real
 * `loadObservationsForThreshold` call (the calibration read / caller end) AND
 * import a substrate/events module (the write end). v1.49.953 replaced the
 * v1.49.947/950 string-presence heuristic (which an incidental comment mention
 * satisfied) with a regex; v1.49.955 replaced that regex with a TypeScript-AST
 * parse + intra-file dataflow + depth-1 call-graph; v1.49.956 lifted the depth
 * caps to a full inter-procedural call-graph + N-level binding chains (see
 * {@link astWireFacts}): comments/JSDoc/string occurrences no longer match, the
 * callee must resolve to the IMPORTED reader binding (aliases and namespace
 * imports followed), and the threshold argument is resolved through N-level
 * variable and N-hop wrapper indirection. The regex survives as a graceful
 * fallback when the compiler cannot be loaded. The v1.49.949 restriction to
 * dedicated end-to-end files still applies.
 *
 * Exit codes (with `--check`) — a TRUE gate, fires only on definitive overdue:
 *   0  no checked axis is `overdue` (not-overdue / candidate / manual)
 *   1  at least one checked axis is `overdue` (BOTH conjuncts machine-met)
 *   2  invalid --axis
 *   (`candidate` is advisory — printed, but does not fire the gate.)
 *
 * Usage:
 *   skill-creator cadence                 human-readable report (all axes)
 *   skill-creator cadence --json          structured JSON (all axes)
 *   skill-creator cadence --check         exit 0/1 across all axes
 *   skill-creator cadence --axis calibrate [--check] [--json]
 *
 * Forward-shadow realized from `docs/meta-cadence-discipline.md` (the prose
 * check was misapplication-prone; this is the discipline-as-code / gate-not-
 * vigilance follow-up).
 *
 * @module cli/commands/cadence
 */

import { join } from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';

import type * as TS from 'typescript';

import { ALL_CALIBRATABLE_THRESHOLDS } from '../../bounded-learning/types.js';
import type { CalibratableThreshold } from '../../bounded-learning/types.js';
import {
  observationSourceFor,
  loadObservationsForThreshold,
} from '../../bounded-learning/observation-sources.js';

export const CADENCE_AXES = ['codify', 'consume', 'calibrate', 'verify'] as const;
export type CadenceAxis = (typeof CADENCE_AXES)[number];

/**
 * - `not-overdue` — the machine-readable first conjunct is definitively NOT met.
 * - `candidate`   — the first conjunct IS met, but the `>=N ships since last X`
 *   second conjunct is unknown or not yet reached (no `cadence_advances` marker,
 *   or fewer than the threshold ships since the last one).
 * - `overdue`     — BOTH conjuncts are machine-determined met: the first conjunct
 *   is met AND `>=CADENCE_SHIPS_SINCE_CONJUNCT` ships have shipped since the axis
 *   last advanced (per release-notes `cadence_advances` frontmatter). The gate
 *   (`--check`) fires on this.
 * - `manual`      — the axis has no cleanly machine-readable signal; the prose
 *   check stands.
 */
export type CadenceStatus = 'not-overdue' | 'candidate' | 'overdue' | 'manual';

export interface AxisReport {
  axis: CadenceAxis;
  status: CadenceStatus;
  /** True when `status` is fully machine-determined (not-overdue or candidate). */
  machineReadable: boolean;
  /** One-line human summary of the verdict + the numbers behind it. */
  detail: string;
  /** Axis-specific machine-readable data (counts, per-threshold breakdown). */
  data: Record<string, unknown>;
}

/** The calibrate first-conjunct observation threshold (per the discipline doc). */
export const CALIBRATE_OBSERVATION_CONJUNCT = 20;

const DEFAULT_SUGGESTIONS_PATH = join(process.cwd(), '.planning', 'patterns', 'suggestions.json');
const DISCIPLINES_PATH = join(process.cwd(), 'tools', 'render-claude-md', 'disciplines.json');
const INTEGRATION_DIR = join(process.cwd(), 'tests', 'integration');
const RELEASE_NOTES_DIR = join(process.cwd(), 'docs', 'release-notes');

/**
 * The #10453 dedicated substrate->calibration end-to-end test naming
 * convention. The verify axis only counts coverage from files matching this —
 * an incidental threshold-string mention in any other integration test does
 * NOT count.
 */
export const END_TO_END_TEST_RE = /-end-to-end\.integration\.test\.ts$/;

/** Count release-notes version directories as a coarse total-ships signal. */
function countShips(): number {
  try {
    return readdirSync(RELEASE_NOTES_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory() && /^v\d+\.\d+\.\d+$/.test(e.name)).length;
  } catch {
    return 0;
  }
}

/** Count unique manifest lessons (mirrors the disciplines.json key_lessons set). */
function countManifestLessons(): number | null {
  try {
    const raw = JSON.parse(readFileSync(DISCIPLINES_PATH, 'utf8'));
    const arr = Array.isArray(raw) ? raw : (raw.disciplines ?? []);
    const set = new Set<string>();
    for (const entry of arr) {
      for (const lesson of entry.key_lessons ?? []) set.add(lesson);
    }
    return set.size;
  } catch {
    return null;
  }
}

/** The second-conjunct threshold: `>=N` ships since the axis last advanced. */
export const CADENCE_SHIPS_SINCE_CONJUNCT = 10;

/**
 * Frontmatter field a release-notes README uses to declare which meta-cadence
 * axes its ship advanced, e.g. `cadence_advances: [consume, calibrate]`. The
 * most recent ship tagging an axis anchors that axis's ships-since count.
 */
const CADENCE_ADVANCES_RE = /^cadence_advances:\s*\[([^\]]*)\]\s*$/m;

export interface AxisAdvance {
  /** The version of the most recent ship that advanced this axis. */
  lastVersion: string;
  /** Ships shipped AFTER that ship (0 = it is the latest ship). */
  shipsSince: number;
}

/** Semver compare for `vX.Y.Z` release-notes directory names. */
function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}

/**
 * Read the machine-readable SECOND conjunct: scan release-notes READMEs for the
 * `cadence_advances: [axis, ...]` frontmatter marker and compute, per axis, the
 * version that last advanced it and how many ships have shipped since. Axes
 * never tagged are absent from the map (ships-since unknown -> stays candidate).
 *
 * This is the per-axis last-ship marker the v1.49.947 tool deliberately left
 * operator-tracked. A ship records the axes it advanced in its README
 * frontmatter; the most recent such ship per axis anchors the count.
 */
export function readAxisAdvances(releaseNotesDir: string): Partial<Record<CadenceAxis, AxisAdvance>> {
  let versions: string[];
  try {
    versions = readdirSync(releaseNotesDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && /^v\d+\.\d+\.\d+$/.test(e.name))
      .map((e) => e.name)
      .sort(compareVersions);
  } catch {
    return {};
  }

  const lastIdx: Partial<Record<CadenceAxis, number>> = {};
  const lastVer: Partial<Record<CadenceAxis, string>> = {};
  versions.forEach((v, i) => {
    let fm = '';
    try {
      fm = readFileSync(join(releaseNotesDir, v, 'README.md'), 'utf8');
    } catch {
      return;
    }
    const m = CADENCE_ADVANCES_RE.exec(fm);
    if (!m) return;
    const axes = m[1]
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
    for (const a of axes) {
      if ((CADENCE_AXES as readonly string[]).includes(a)) {
        lastIdx[a as CadenceAxis] = i;
        lastVer[a as CadenceAxis] = v;
      }
    }
  });

  const out: Partial<Record<CadenceAxis, AxisAdvance>> = {};
  const total = versions.length;
  for (const a of CADENCE_AXES) {
    const idx = lastIdx[a];
    if (idx !== undefined) {
      out[a] = { lastVersion: lastVer[a]!, shipsSince: total - 1 - idx };
    }
  }
  return out;
}

/**
 * Upgrade a first-conjunct `candidate` to a definitive `overdue` when the
 * second conjunct (`>=CADENCE_SHIPS_SINCE_CONJUNCT` ships since the axis last
 * advanced) is also machine-determined met. A `candidate` with unknown or
 * insufficient ships-since stays `candidate` — never a false `overdue`.
 * Non-candidate statuses are returned unchanged.
 */
export function shipsSinceUpgrade(
  status: CadenceStatus,
  shipsSince: number | undefined,
): CadenceStatus {
  if (status !== 'candidate') return status;
  if (shipsSince !== undefined && shipsSince >= CADENCE_SHIPS_SINCE_CONJUNCT) return 'overdue';
  return status;
}

/** `--check` exit code: 1 (gate fires) iff any axis is definitively `overdue`. */
export function cadenceCheckExitCode(reports: AxisReport[]): number {
  return reports.some((r) => r.status === 'overdue') ? 1 : 0;
}

export interface ThresholdObservationCount {
  threshold: CalibratableThreshold;
  wired: boolean;
  observations: number;
}

/**
 * Pure calibrate-axis verdict: a wired threshold reaching the `>=20`
 * observation first conjunct is a `candidate`; otherwise `not-overdue`.
 *
 * Extracted as a pure function so the conjunct logic — the exact thing the
 * v1.49.944 session mis-read (12 observations treated as `>=20`) — is testable
 * with synthetic data, independent of any on-disk event files.
 */
export function calibrateVerdict(perThreshold: ThresholdObservationCount[]): {
  status: CadenceStatus;
  candidates: ThresholdObservationCount[];
  maxObservations: number;
  detail: string;
} {
  const maxObservations = perThreshold.reduce((m, p) => Math.max(m, p.observations), 0);
  const candidates = perThreshold.filter(
    (p) => p.wired && p.observations >= CALIBRATE_OBSERVATION_CONJUNCT,
  );
  const status: CadenceStatus = candidates.length > 0 ? 'candidate' : 'not-overdue';
  const detail =
    status === 'candidate'
      ? `${candidates.length} wired threshold(s) at >=${CALIBRATE_OBSERVATION_CONJUNCT} observations ` +
        `(${candidates.map((c) => `${c.threshold}=${c.observations}`).join(', ')}); ` +
        `CANDIDATE — confirm >=10 ships since the loop last ran on it (operator-tracked) before declaring overdue.`
      : `max observations across wired thresholds = ${maxObservations} ` +
        `(< ${CALIBRATE_OBSERVATION_CONJUNCT}); first conjunct NOT met -> not overdue.`;
  return { status, candidates, maxObservations, detail };
}

/** CALIBRATE: enumerate thresholds, read real observation counts, check `>=20`. */
async function checkCalibrate(suggestionsPath: string): Promise<AxisReport> {
  const perThreshold: ThresholdObservationCount[] = await Promise.all(
    ALL_CALIBRATABLE_THRESHOLDS.map(async (threshold) => {
      const source = observationSourceFor(threshold);
      if (!source.wired) return { threshold, wired: false, observations: 0 };
      let observations = 0;
      try {
        const obs = await loadObservationsForThreshold(threshold, { suggestionsPath });
        observations = obs.length;
      } catch {
        observations = 0;
      }
      return { threshold, wired: true, observations };
    }),
  );

  const verdict = calibrateVerdict(perThreshold);
  return {
    axis: 'calibrate',
    status: verdict.status,
    machineReadable: true,
    detail: verdict.detail,
    data: { perThreshold, maxObservations: verdict.maxObservations, conjunct: CALIBRATE_OBSERVATION_CONJUNCT },
  };
}

/** CONSUME: enumerate REAL union members; count genuinely-unwired (catch-all-proof). */
function checkConsume(): AxisReport {
  const perThreshold = ALL_CALIBRATABLE_THRESHOLDS.map((threshold) => ({
    threshold,
    wired: observationSourceFor(threshold).wired,
  }));
  const unwired = perThreshold.filter((p) => !p.wired);

  const status: CadenceStatus = unwired.length > 0 ? 'candidate' : 'not-overdue';
  const detail =
    status === 'candidate'
      ? `${unwired.length} genuinely-unwired threshold(s): ${unwired.map((u) => u.threshold).join(', ')}; ` +
        `CANDIDATE — confirm >=10 ships since the substrate shipped (operator-tracked) before declaring overdue.`
      : `all ${perThreshold.length} calibratable thresholds are wired; 0 genuinely-unwired ` +
        `(the wired:false catch-all branches in observation-sources.ts are defensive — they fire only ` +
        `for non-existent threshold classes, NOT real members); first conjunct NOT met -> not overdue.`;

  return {
    axis: 'consume',
    status,
    machineReadable: true,
    detail,
    data: { perThreshold, genuinelyUnwired: unwired.map((u) => u.threshold) },
  };
}

/** CODIFY: no cleanly machine-readable backlog; report manifest count + manual. */
function checkCodify(): AxisReport {
  const manifestLessons = countManifestLessons();
  const ships = countShips();
  return {
    axis: 'codify',
    status: 'manual',
    machineReadable: false,
    detail:
      `manifest has ${manifestLessons ?? 'unknown'} lessons across ${ships} shipped milestones; ` +
      `the ">=5 ESTABLISHED lesson candidates" backlog and ">=10 ships since last codify" conjuncts ` +
      `are operator-tracked (no structured candidate backlog) -> manual check (prose discipline stands).`,
    data: { manifestLessons, ships },
  };
}

export interface ThresholdCoverage {
  threshold: CalibratableThreshold;
  covered: boolean;
  /** Dedicated end-to-end test file(s) that wire this threshold. */
  coveringTests: string[];
}

/**
 * The calibration read-side entry point — the "caller" that consumes
 * substrate-emitted observations. A dedicated end-to-end test wires a threshold
 * by passing it as a string-literal argument to a real call of this function.
 */
export const CALIBRATION_READER = 'loadObservationsForThreshold';

/**
 * Import-path fragments that identify a substrate (write-side) module — the
 * other end of the wire. All five dedicated end-to-end tests import their
 * substrate from a path matching one of these (`*-substrate`, `*-events`, or the
 * `suggestion-store`). A new substrate with a different naming scheme that fails
 * this must extend the pattern; the live-tree drift guard test forces that.
 */
export const SUBSTRATE_MODULE_RE = /from\s+['"][^'"]*(?:-substrate|-events|suggestion-store)[^'"]*['"]/;

/**
 * Minimal structural type for the lazily-required TypeScript compiler module.
 * Declared via `typeof import('typescript')` so it is ERASED at runtime — the
 * compiler is never statically imported (it would load on EVERY CLI dispatch,
 * since `dispatch.ts` imports this module eagerly). It is required lazily inside
 * {@link loadTypeScript}, only when the verify axis actually parses a test file.
 */
type TsModule = typeof import('typescript');

/** Import-specifier fragments that mark a SUBSTRATE (write-side) module. */
export const SUBSTRATE_SPECIFIER_RE = /(?:-substrate|-events|suggestion-store)/;

/**
 * Module-specifier fragment identifying the calibration-reader module. Used to
 * qualify an `import * as ns from '...'` namespace import before treating
 * `ns.loadObservationsForThreshold(...)` as a real reader call.
 */
export const READER_MODULE_RE = /observation-sources/;

/**
 * Global form of the v1.49.953 caller regex: captures EVERY threshold literal
 * passed to a `loadObservationsForThreshold(` call. The `(?<![A-Za-z0-9_])`
 * lookbehind anchors a real identifier boundary (a name merely ENDING with the
 * reader's name does not match). Used by the regex fallback only.
 */
const READER_CALL_GLOBAL_RE = new RegExp(
  `(?<![A-Za-z0-9_])${CALIBRATION_READER}\\(\\s*['"]([^'"]+)['"]`,
  'g',
);

/**
 * The two facts that decide whether a test wires a threshold, extracted ONCE per
 * file (independent of any specific threshold):
 *   - `importsSubstrate` — the file imports a substrate/events module (write end).
 *   - `callsReaderWith`  — the set of threshold string-literals actually passed to
 *     a real `loadObservationsForThreshold` call (caller end).
 *
 * A threshold is wired iff `importsSubstrate && callsReaderWith.has(threshold)`.
 */
export interface WireFacts {
  importsSubstrate: boolean;
  callsReaderWith: ReadonlySet<string>;
}

/**
 * Regex fallback — the v1.49.953 detector, generalized to emit every threshold a
 * file's reader calls reference. Used when the TypeScript compiler cannot be
 * loaded (e.g. a production CLI installed without devDependencies) or when AST
 * parsing throws. Sound for the common direct-literal call style, but blind to
 * comments/strings, import aliases, namespace imports, and variable/wrapper
 * indirection — the exact gaps {@link astWireFacts} closes.
 */
export function regexWireFacts(content: string): WireFacts {
  const callsReaderWith = new Set<string>();
  for (const m of content.matchAll(READER_CALL_GLOBAL_RE)) callsReaderWith.add(m[1]);
  return { importsSubstrate: SUBSTRATE_MODULE_RE.test(content), callsReaderWith };
}

/**
 * AST + intra-file dataflow + inter-procedural call-graph wire detection
 * (v1.49.955 introduced the AST path; v1.49.956 lifted the depth caps to full
 * inter-procedural resolution; v1.49.957 added return-value dataflow). Parses the
 * test source with the TypeScript compiler and resolves the wire STRUCTURALLY
 * rather than by raw-text regex:
 *
 *   - CALLER end is a real `CallExpression` — comments, JSDoc examples, and
 *     string literals that merely CONTAIN the call text are ignored (they are not
 *     call nodes). The callee must resolve to the IMPORTED reader binding (a
 *     locally defined function that happens to share the name does NOT match);
 *     import ALIASES (`loadObservationsForThreshold as load`) and namespace
 *     imports (`import * as os from '...observation-sources...'` -> `os.load…`)
 *     are followed.
 *   - The threshold ARGUMENT is resolved through intra-file dataflow: a direct
 *     string literal, a no-substitution template, `'x' as const`, an identifier
 *     bound to a string literal through an N-LEVEL `const`/`let` alias chain
 *     (`const b = a; const a = 'x'`), OR a call to a local function that RETURNS
 *     a string literal (`loadObservationsForThreshold(getThreshold())`, or a
 *     `const t = getThreshold()` binding read at the call) — the v1.49.957
 *     return-value dataflow. Chains are cycle-guarded (a visited set, shared
 *     across the alias and return-cycle guards) and param-guarded at EVERY hop
 *     (an alias that resolves to a function parameter is not followed — the
 *     threshold flows in at the call site). A function that returns one of its
 *     own parameters IS resolved by substituting the argument at the call site
 *     (`function id(t){ return t; } ... id('x')` -> 'x'), and a parenthesized
 *     literal/identifier/call is unwrapped (`load(('x'))`, `load((getT()))`) —
 *     the two bounds v1.49.957 documented, both closed at v1.49.959.
 *   - An N-HOP CALL GRAPH is followed: a monotone fixpoint computes which
 *     `(local function, parameter index)` pairs transitively forward to the
 *     reader's threshold argument — directly (`function w(t){ return load(t) }`)
 *     or through any chain of intermediate local wrappers
 *     (`function inner(t){ return load(t) }; function outer(t){ return inner(t) };
 *     outer('x')`). The threshold argument at each wrapper call site is then
 *     resolved by the same dataflow as a direct reader call. The fixpoint is over
 *     a finite (function × param-index) domain, so it terminates even on mutual
 *     recursion (`f -> g -> f` with no reader call resolves to nothing).
 *   - SUBSTRATE end is a real `ImportDeclaration` whose specifier matches
 *     {@link SUBSTRATE_SPECIFIER_RE} (an import line inside a comment does not
 *     count).
 *
 * The depth caps the v1.49.955 detector documented (one wrapper hop, one binding
 * level) are lifted, the v1.49.956-documented return-value bound is closed by
 * v1.49.957, the v1.49.957-documented param-return-through and
 * parenthesized-literal bounds are closed by v1.49.959, and the parenthesized-
 * PARAM-forwarding bound (a wrapper forwarding `(t)` to the reader, a
 * `return (t)` / `(t) => (t)` param identity, or a `const a = (b)` / `(getT())`
 * binding initializer) plus the nested-self-call bound (`load(id(id('x')))`)
 * are closed by v1.49.963; the regex fallback still
 * covers none of these. Wrapper and return
 * detection span free `function` declarations and `const`-bound arrow/function
 * expressions (the forms every test uses) — methods on classes remain out of
 * scope (no real e2e test is class-based).
 *
 * Resolution is name-based, not fully lexically-scoped, so four guards keep it
 * from over-reporting a wire when a name means different things in different
 * scopes (all err toward NOT wiring — the conservative direction for a coverage
 * gate): (1) `collectFn` attributes call arguments to a function's parameters via
 * `eachOwnNode`, which does NOT descend into nested function bodies, so a nested
 * callback's same-named param is never mistaken for the outer function's; (2) a
 * binding NAME declared more than once in the file (`const x` at two scopes) is
 * dropped as AMBIGUOUS rather than resolved against an arbitrary one; (3) a
 * function NAME with a body declared more than once is likewise dropped before
 * return-value resolution; (4) `isParamInScope` stops every binding-resolution
 * hop from following a name that is actually a parameter in scope. The residual
 * after these (a single name declared once but read across genuinely distinct
 * lexical scopes) is a contrived shape absent from every real test and no worse
 * than the regex. (A function-local block that shadows a same-named param was
 * investigated at v1.49.963 and is already conservative — a param-return resolves
 * via the call-site arg, never the flat binding maps, and a block shadow whose
 * function does not unconditionally return an expression is dropped by the
 * storage gate; the nested-self-call `id(id('x'))` bound was closed the same
 * milestone via the argument-path cycle-guard relaxation in resolveCallReturn.)
 */
export function astWireFacts(content: string, ts: TsModule): WireFacts {
  const sf = ts.createSourceFile('e2e.ts', content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  let importsSubstrate = false;
  const readerLocals = new Set<string>(); // local names bound to the imported reader
  const readerNamespaces = new Set<string>(); // `import * as ns` from the reader module
  const stringBindings = new Map<string, string>(); // const/let NAME = '<literal>'
  const aliasBindings = new Map<string, TS.Identifier>(); // const/let NAME = <otherIdentifier>
  const callBindings = new Map<string, TS.CallExpression>(); // const/let NAME = someFn(...)
  const bindingDeclCount = new Map<string, number>(); // declarations per binding name

  // Pass 1 — imports: substrate flag + reader binding names (named + alias + namespace).
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    const spec = stmt.moduleSpecifier.text;
    if (SUBSTRATE_SPECIFIER_RE.test(spec)) importsSubstrate = true;
    const nb = stmt.importClause?.namedBindings;
    if (nb && ts.isNamedImports(nb)) {
      for (const el of nb.elements) {
        const imported = (el.propertyName ?? el.name).text;
        if (imported === CALIBRATION_READER) readerLocals.add(el.name.text);
      }
    } else if (nb && ts.isNamespaceImport(nb) && READER_MODULE_RE.test(spec)) {
      readerNamespaces.add(nb.name.text);
    }
  }

  const eachNode = (node: TS.Node, cb: (n: TS.Node) => void): void => {
    cb(node);
    node.forEachChild((c) => eachNode(c, cb));
  };

  const isFunctionLike = (n: TS.Node): boolean =>
    ts.isFunctionDeclaration(n) ||
    ts.isFunctionExpression(n) ||
    ts.isArrowFunction(n) ||
    ts.isMethodDeclaration(n);

  // Like `eachNode` but does NOT descend into nested function/arrow/method
  // bodies, so a walk rooted at one function visits only that function's OWN
  // code. `collectFn` uses this to attribute call arguments to the correct
  // function's parameters: an identifier inside a nested callback refers to the
  // nested function's scope (its own param, or a closure), NOT the outer
  // function's same-named param — descending would mis-attribute it and falsely
  // mark the outer a reader-reaching wrapper (review finding, v1.49.956).
  const eachOwnNode = (node: TS.Node, cb: (n: TS.Node) => void): void => {
    cb(node);
    node.forEachChild((c) => {
      if (!isFunctionLike(c)) eachOwnNode(c, cb);
    });
  };

  const calleeIsReader = (call: TS.CallExpression): boolean => {
    const c = call.expression;
    if (ts.isIdentifier(c)) return readerLocals.has(c.text);
    if (ts.isPropertyAccessExpression(c) && ts.isIdentifier(c.expression)) {
      return readerNamespaces.has(c.expression.text) && c.name.text === CALIBRATION_READER;
    }
    return false;
  };

  // Unwrap an N-level parenthesized grouping `((expr))` to its inner expression.
  // ParenthesizedExpression is the ONLY node kind unwrapped (never `as`, a call,
  // or any other kind), so this never changes WHICH expression kind collectFn
  // attributes — it only strips redundant grouping before the `ts.isIdentifier`
  // param-forwarding checks below, the collect-side analogue of the
  // resolveExpr/literalOf paren unwraps on the resolution side (v1.49.963).
  const unwrapParens = (expr: TS.Expression): TS.Expression =>
    ts.isParenthesizedExpression(expr) ? unwrapParens(expr.expression) : expr;

  // A string-literal-ish initializer/argument resolved WITHOUT following identifiers.
  const literalOf = (expr: TS.Expression): string | undefined => {
    if (ts.isStringLiteralLike(expr)) return expr.text;
    if (ts.isAsExpression(expr)) return literalOf(expr.expression);
    // Unwrap a parenthesized literal — `('x')`, `(('x'))`, `('x' as const)`
    // (v1.49.959). literalOf is the single literal chokepoint, so this resolves
    // every parenthesized-literal consumer (decl init, arg, return, arrow body).
    if (ts.isParenthesizedExpression(expr)) return literalOf(expr.expression);
    return undefined;
  };

  // The call-graph facts collected for one local function: its parameter names
  // (by index), the param indices it forwards DIRECTLY to the reader's threshold
  // arg (base case), and its outgoing calls to other local functions with the
  // map of {arg position -> this fn's param index} for each identifier argument
  // that is one of this fn's params (the forwarding edges the fixpoint walks).
  interface FnInfo {
    params: string[];
    readerParamArgs: number[];
    edges: Array<{ callee: string; argMap: Array<[argPos: number, paramIdx: number]> }>;
  }
  const fns = new Map<string, FnInfo>();

  // Per local function: the expressions it can RETURN (its OWN scope only —
  // nested function returns belong to the nested function). Used to resolve a
  // reader/wrapper call whose threshold ARGUMENT is a call to a local function
  // returning a string literal — `loadObservationsForThreshold(getThreshold())`
  // (v1.49.957 return-value dataflow). Kept separate from FnInfo (which models
  // PARAM forwarding) because a literal return is param-independent: it resolves
  // from the function body alone, never from the call site's arguments.
  const returnExprs = new Map<string, TS.Expression[]>();

  // Per local function: the OWN param INDICES it returns DIRECTLY (`return t`
  // where `t` is a parameter; or a concise arrow body that IS a param). Resolved
  // at the CALL SITE by substituting the matching argument — `function id(t){
  // return t; }` then `loadObservationsForThreshold(id('x'))` resolves to 'x'
  // (v1.49.959 param-return-through, the bound v1.49.957 left open). Kept
  // separate from `returnExprs` because the value is param-DEPENDENT: it comes
  // from the call's arguments, not the body. A function returning a DESTRUCTURED
  // param has `params[i] === ''` (only identifier params are indexed), so its
  // return falls to `returnExprs` and is correctly dropped by `isParamInScope`
  // (the call-site value is unknowable through a pattern) — never over-reported.
  const returnParams = new Map<string, number[]>();

  // Pass 2a — collect, for each local function, the forwarding facts above.
  const collectFn = (
    name: string,
    fn: TS.FunctionDeclaration | TS.ArrowFunction | TS.FunctionExpression,
  ): void => {
    if (!fn.body) return;
    const params = fn.parameters.map((p) => (ts.isIdentifier(p.name) ? p.name.text : ''));
    const paramIndexOf = (id: TS.Identifier): number => params.indexOf(id.text);
    const readerParamArgs: number[] = [];
    const edges: FnInfo['edges'] = [];
    const rets: TS.Expression[] = [];
    const retParamIdx: number[] = []; // own param indices returned directly (v1.49.959)
    // True only while every completion path is known to return an EXPRESSION.
    // A bare `return;` or an implicit fall-through is a path that yields
    // `undefined` at runtime, so the literal is not guaranteed to reach the
    // reader — such a function must NOT resolve to its literal returns (review
    // finding #2, v1.49.957; the divergence guard in resolveCallReturn drops it).
    let unconditionalExprReturn = true;
    eachOwnNode(fn.body, (n) => {
      if (ts.isReturnStatement(n)) {
        if (n.expression) {
          // `return t` where `t` is one of THIS fn's identifier params is a
          // param-return: record the index (resolved per call site) instead of
          // pushing the identifier to `rets`, where `isParamInScope` would drop
          // it to undefined and the divergence guard would mask the param path
          // (v1.49.959).
          const retExpr = unwrapParens(n.expression);
          const pi = ts.isIdentifier(retExpr) ? paramIndexOf(retExpr) : -1;
          if (pi >= 0) retParamIdx.push(pi);
          else rets.push(n.expression);
        } else unconditionalExprReturn = false; // bare `return;` -> undefined path
        return;
      }
      if (!ts.isCallExpression(n)) return;
      if (calleeIsReader(n)) {
        const a0 = n.arguments[0] && unwrapParens(n.arguments[0]);
        if (a0 && ts.isIdentifier(a0)) {
          const pi = paramIndexOf(a0);
          if (pi >= 0 && !readerParamArgs.includes(pi)) readerParamArgs.push(pi);
        }
        return;
      }
      const c = n.expression;
      if (ts.isIdentifier(c)) {
        const argMap: Array<[number, number]> = [];
        n.arguments.forEach((rawArg, ap) => {
          const arg = unwrapParens(rawArg);
          if (ts.isIdentifier(arg)) {
            const pi = paramIndexOf(arg);
            if (pi >= 0) argMap.push([ap, pi]);
          }
        });
        if (argMap.length > 0) edges.push({ callee: c.text, argMap });
      }
    });
    if (ts.isBlock(fn.body)) {
      // A block can complete via an implicit `return undefined` unless its LAST
      // statement is a return-with-expression. Conservatively treat anything else
      // (a trailing if/loop/expression statement, an empty body) as a possible
      // undefined completion path so the literal returns do not resolve.
      const last = fn.body.statements[fn.body.statements.length - 1];
      if (!last || !(ts.isReturnStatement(last) && last.expression)) unconditionalExprReturn = false;
    } else {
      // arrow concise body: the body IS the (only) return value — classify a
      // bare param identity (`(t) => t`) as a param-return too (v1.49.959).
      const bodyExpr = unwrapParens(fn.body);
      const pi = ts.isIdentifier(bodyExpr) ? paramIndexOf(bodyExpr) : -1;
      if (pi >= 0) retParamIdx.push(pi);
      else rets.push(fn.body);
    }
    if (readerParamArgs.length > 0 || edges.length > 0) {
      fns.set(name, { params, readerParamArgs, edges });
    }
    if (rets.length > 0 && unconditionalExprReturn) {
      returnExprs.set(name, (returnExprs.get(name) ?? []).concat(rets));
    }
    if (retParamIdx.length > 0 && unconditionalExprReturn) {
      returnParams.set(name, (returnParams.get(name) ?? []).concat(retParamIdx));
    }
    // One shared declaration counter (v1.49.957): every binding AND every bodied
    // function increments it, so a name that is ambiguous in ANY way — declared
    // twice as a binding, twice as a function, or once as each — is dropped from
    // every resolution map below (extends the v1.49.956 binding ambiguity drop).
    bindingDeclCount.set(name, (bindingDeclCount.get(name) ?? 0) + 1);
  };
  eachNode(sf, (n) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) {
      // Unwrap grouping parens on the initializer so `const a = (b)` (alias) and
      // `const a = (getT())` (call-binding) register symmetrically with the
      // literal branch (literalOf already unwraps) and the four collectFn
      // attribution sites — the binding-init analogue of the v1.49.963 unwrap.
      const init = unwrapParens(n.initializer);
      const v = literalOf(init);
      if (v !== undefined) {
        stringBindings.set(n.name.text, v);
        bindingDeclCount.set(n.name.text, (bindingDeclCount.get(n.name.text) ?? 0) + 1);
      } else if (ts.isIdentifier(init)) {
        aliasBindings.set(n.name.text, init);
        bindingDeclCount.set(n.name.text, (bindingDeclCount.get(n.name.text) ?? 0) + 1);
      } else if (ts.isCallExpression(init)) {
        // const NAME = getThreshold() — a binding whose value is a call's return
        // (v1.49.957). Resolved later via the same return-value dataflow.
        callBindings.set(n.name.text, init);
        bindingDeclCount.set(n.name.text, (bindingDeclCount.get(n.name.text) ?? 0) + 1);
      } else if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
        collectFn(n.name.text, init);
      }
    } else if (ts.isFunctionDeclaration(n) && n.name) {
      collectFn(n.name.text, n);
    }
  });
  // Flat (non-lexical) binding maps cannot tell a function-local `const x` from a
  // module-level `const x` of the same name. A name declared as a literal/alias
  // binding more than once in the file is therefore AMBIGUOUS — resolving it
  // could pick the wrong scope's value and over-report a wire. Drop such names so
  // resolution stays conservative (an unresolved arg is simply not wired),
  // matching the regex fallback's behavior (review finding, v1.49.956).
  // A name declared more than once (across bindings AND bodied functions) is
  // ambiguous under the flat maps — a fn-local `const x`/`function x` shadowing a
  // module-level one of the same name. Drop it from EVERY resolution map so the
  // call/identifier resolves to nothing rather than against an arbitrary scope
  // (v1.49.957 extends the v1.49.956 binding ambiguity drop to functions and
  // call-bindings via the shared counter).
  for (const [name, count] of bindingDeclCount) {
    if (count > 1) {
      stringBindings.delete(name);
      aliasBindings.delete(name);
      callBindings.delete(name);
      returnExprs.delete(name);
      returnParams.delete(name);
    }
  }

  // Pass 2b — monotone fixpoint: `reaches[fn]` = the set of `fn`'s param indices
  // that transitively forward to the reader's threshold arg. Seed with each
  // function's direct (base-case) forwards, then propagate across call edges
  // until no set grows. A call `F(...)` forwarding F's param `pi` into callee G's
  // arg position `ap` adds `pi` to `reaches[F]` when `ap ∈ reaches[G]`. The
  // domain (functions × param indices) is finite, so this terminates regardless
  // of recursion (mutual recursion with no reader call converges to empty sets).
  const reaches = new Map<string, Set<number>>();
  for (const [name, info] of fns) reaches.set(name, new Set(info.readerParamArgs));
  let changed = true;
  while (changed) {
    changed = false;
    for (const [name, info] of fns) {
      const set = reaches.get(name)!;
      for (const edge of info.edges) {
        const calleeReaches = reaches.get(edge.callee);
        if (!calleeReaches) continue;
        for (const [argPos, paramIdx] of edge.argMap) {
          if (calleeReaches.has(argPos) && !set.has(paramIdx)) {
            set.add(paramIdx);
            changed = true;
          }
        }
      }
    }
  }
  // A local function "wraps" the reader iff at least one of its param indices
  // reaches the threshold arg; that set indexes which call-site args to resolve.
  const wrappers = new Map<string, Set<number>>();
  for (const [name, set] of reaches) if (set.size > 0) wrappers.set(name, set);

  // True iff `id` is bound as a PARAMETER of a lexically-enclosing function. Such
  // an identifier is locally bound (the threshold flows in at the wrapper's call
  // site, resolved separately) and must NOT be resolved against the flat
  // module-level binding maps — otherwise a `const t = '<threshold>'` that merely
  // shares a wrapper param's name would falsely mark the threshold wired even
  // when the wrapper is never called with that literal. Uses the parent pointers
  // enabled by `createSourceFile(..., setParentNodes=true)`.
  //
  // A parameter's binding name can be an identifier OR a destructuring pattern
  // (`{ t }`, `[t]`, `{ a: t }`, `{ t } = {}`, `{ a: { t } }`); each binds its
  // INNER identifier names locally, so they too flow in at the call site and must
  // not resolve against the flat module maps (review finding #1, v1.49.957 — a
  // destructured param defeated the prior identifier-only check and over-reported;
  // this also closed the same latent hole on the v1.49.956 wrapper/direct path).
  const bindingNameBinds = (name: TS.BindingName, target: string): boolean => {
    if (ts.isIdentifier(name)) return name.text === target;
    for (const el of name.elements) {
      if (ts.isOmittedExpression(el)) continue;
      if (bindingNameBinds(el.name, target)) return true;
    }
    return false;
  };
  const isParamInScope = (id: TS.Identifier): boolean => {
    for (let p: TS.Node | undefined = id.parent; p; p = p.parent) {
      if (
        (ts.isFunctionDeclaration(p) ||
          ts.isFunctionExpression(p) ||
          ts.isArrowFunction(p) ||
          ts.isMethodDeclaration(p)) &&
        p.parameters.some((par) => bindingNameBinds(par.name, id.text))
      ) {
        return true;
      }
    }
    return false;
  };

  // Resolve an identifier to a string literal through an N-LEVEL `const`/`let`
  // alias chain (`const b = a; const a = 'x'`). Guards at EVERY hop: a binding
  // that points at a function parameter is not followed (the threshold flows in
  // at the call site), and a `seen` set breaks reference cycles (`const a = b;
  // const b = a`) so resolution always terminates.
  const resolveIdentifier = (id: TS.Identifier, seen: Set<string>): string | undefined => {
    if (isParamInScope(id)) return undefined;
    const name = id.text;
    if (seen.has(name)) return undefined;
    seen.add(name);
    const lit = stringBindings.get(name);
    if (lit !== undefined) return lit;
    const next = aliasBindings.get(name);
    if (next) return resolveIdentifier(next, seen);
    const call = callBindings.get(name);
    if (call) return resolveCallReturn(call, seen);
    return undefined;
  };

  // Resolve a call to a LOCAL function to the single string literal it RETURNS,
  // when that literal is the same on every completion path — the v1.49.957
  // return-value dataflow that closes the v1.49.956-documented bound
  // (`loadObservationsForThreshold(getThreshold())`), extended at v1.49.959 to
  // PARAM-RETURN-THROUGH: a function returning one of its own params resolves by
  // substituting the matching ARGUMENT at this call site (`function id(t){ return
  // t; } ... load(id('x'))` -> 'x'). Only the function-name form `f(...)` is
  // followed (a method call `o.m()` is not a local function).
  //
  // Two return kinds are unified under ONE divergence guard: every param-
  // INDEPENDENT literal return (from `returnExprs`) AND every param-DEPENDENT
  // return (each `returnParams` index resolved against `call.arguments[idx]`)
  // must resolve to the SAME literal, else the call is not wired. A function only
  // enters either map when it UNCONDITIONALLY returns an expression on every path
  // (collectFn drops it on a bare `return;` or an implicit `undefined`
  // fall-through). If any collected return is unresolvable, or two paths resolve
  // to different literals, the call resolves to `undefined` (not wired).
  //
  // The shared `seen` set breaks return cycles (`a(){ return b() } b(){ return
  // a() }`): the BODY-return loop below threads it unchanged. The PARAM-argument
  // loop instead resolves under `seen` minus the current name, because a call's
  // arguments are finite caller-scope sub-nodes (never the cyclic recursion the
  // guard protects) — so a nested self-call (`load(id(id('x')))`) RESOLVES
  // (v1.49.963), while a genuine cycle that re-enters through an argument still
  // terminates because every OTHER in-progress name stays in the set.
  const resolveCallReturn = (call: TS.CallExpression, seen: Set<string>): string | undefined => {
    const callee = call.expression;
    if (!ts.isIdentifier(callee)) return undefined;
    const name = callee.text;
    if (seen.has(name)) return undefined;
    const rets = returnExprs.get(name);
    const paramIdxs = returnParams.get(name);
    const hasRets = rets !== undefined && rets.length > 0;
    const hasParams = paramIdxs !== undefined && paramIdxs.length > 0;
    if (!hasRets && !hasParams) return undefined;
    seen.add(name);
    let resolved: string | undefined;
    // Fold one resolved value into the result; returns false (caller bails to
    // `undefined`) on an unresolvable path OR a literal that diverges from a
    // prior one — the same conservative guard across both return kinds.
    const merge = (v: string | undefined): boolean => {
      if (v === undefined) return false;
      if (resolved === undefined) {
        resolved = v;
        return true;
      }
      return resolved === v;
    };
    if (hasRets) {
      for (const r of rets!) if (!merge(resolveExpr(r, seen))) return undefined;
    }
    if (hasParams) {
      // The substituted argument lives at THIS call site (caller scope) and is a
      // strict sub-node of `call`, so a same-named call nested in the argument
      // (`load(id(id('x')))`) is finite, NOT the body-recursion cycle the `seen`
      // guard exists to break. Resolve it under `seen` MINUS this name so the
      // nested self-call resolves instead of tripping the `seen.has(name)` bail;
      // every OTHER in-progress name stays guarded, so a genuine cycle that
      // re-enters through an argument (`a(t){return t} b(){return a(b())}`) still
      // terminates as an under-report (v1.49.963 — the bound v1.49.959 left open).
      // Cloning `seen` (not a fresh set) is load-bearing for that termination.
      const argSeen = new Set(seen);
      argSeen.delete(name);
      for (const pi of paramIdxs!) if (!merge(resolveExpr(call.arguments[pi], argSeen))) return undefined;
    }
    return resolved;
  };

  // Resolve any threshold-bearing expression to a string literal: a direct
  // literal, an identifier (through the binding/alias/call-binding chains), or a
  // call to a literal-returning local function. One `seen` set is threaded
  // across all three so every guard sees the same in-progress name set.
  const resolveExpr = (expr: TS.Expression | undefined, seen: Set<string>): string | undefined => {
    if (!expr) return undefined;
    const lit = literalOf(expr);
    if (lit !== undefined) return lit;
    // Unwrap a parenthesized identifier/call so `(t)`, `(getThreshold())`, and
    // `((...))` reach the resolution branches below (v1.49.959; literalOf above
    // already handled a parenthesized string literal).
    if (ts.isParenthesizedExpression(expr)) return resolveExpr(expr.expression, seen);
    if (ts.isIdentifier(expr)) return resolveIdentifier(expr, seen);
    if (ts.isCallExpression(expr)) return resolveCallReturn(expr, seen);
    return undefined;
  };

  // Pass 3 — resolve threshold args at every reader call AND every wrapper call
  // (at each param index the fixpoint proved forwards to the reader).
  const resolveArg = (expr: TS.Expression | undefined): string | undefined =>
    resolveExpr(expr, new Set());
  const callsReaderWith = new Set<string>();
  eachNode(sf, (n) => {
    if (!ts.isCallExpression(n)) return;
    if (calleeIsReader(n)) {
      const s = resolveArg(n.arguments[0]);
      if (s !== undefined) callsReaderWith.add(s);
      return;
    }
    const c = n.expression;
    if (ts.isIdentifier(c) && wrappers.has(c.text)) {
      for (const idx of wrappers.get(c.text)!) {
        const s = resolveArg(n.arguments[idx]);
        if (s !== undefined) callsReaderWith.add(s);
      }
    }
  });

  return { importsSubstrate, callsReaderWith };
}

/**
 * Lazily require the TypeScript compiler (memoized for the process). Returns
 * `null` if it cannot be loaded — the detector then degrades to
 * {@link regexWireFacts}. typescript is a devDependency; a production CLI
 * installed without devDeps lacks it, but the cadence command is a repo-meta
 * tool that only runs from inside the repo (where it is present), so the AST path
 * is the live one and the fallback is a safety net.
 */
let tsLoadAttempted = false;
let tsModuleCache: TsModule | null = null;
function loadTypeScript(): TsModule | null {
  if (tsLoadAttempted) return tsModuleCache;
  tsLoadAttempted = true;
  try {
    tsModuleCache = createRequire(import.meta.url)('typescript') as TsModule;
  } catch {
    tsModuleCache = null;
  }
  return tsModuleCache;
}

/**
 * Compute {@link WireFacts}: AST when `ts` is available, regex fallback otherwise
 * (compiler not installed) or if the parse throws. Pure given `ts`.
 *
 * FAIL-SOFT contract (failure-mode-contracts #10427): this degrades SILENTLY to
 * the weaker regex on both compiler-missing and parse-throw. That is the correct
 * direction here precisely BECAUSE the verify axis is an ADVISORY gate — its
 * worst silent failure is a missed cadence nudge, never a broken ship or a
 * spurious `overdue` (the divergences all err toward over-reporting coverage,
 * the conservative direction for a coverage gate; `cadence` is wired into no hook
 * and not into pre-tag-gate/CI). The general static-analysis-tool rule (#10450)
 * prefers fail-LOUD; this is a documented, test-paired exception for an advisory
 * surface. The throw-then-regex path is exercised by a dedicated test.
 */
function computeWireFacts(content: string, ts: TsModule | null): WireFacts {
  if (ts) {
    try {
      return astWireFacts(content, ts);
    } catch {
      // fail-soft (#10427): advisory gate — degrade to regex rather than throw.
      return regexWireFacts(content);
    }
  }
  return regexWireFacts(content);
}

const wireFactsCache = new Map<string, WireFacts>();

/**
 * Structural substrate-to-caller wire detection (v1.49.955, AST). A dedicated
 * end-to-end test "wires" a threshold iff it imports a substrate module (write
 * end) AND passes the threshold to a real `loadObservationsForThreshold` call
 * (caller end) — see {@link astWireFacts} for everything the AST path resolves
 * that the v1.49.953 regex could not (comments/strings, aliases, namespaces,
 * N-level variable + N-hop wrapper + return-value indirection). Facts are memoized per file content so
 * {@link verifyVerdict}'s per-(threshold, file) calls parse each file once.
 */
export function detectThresholdWire(threshold: string, content: string): boolean {
  let facts = wireFactsCache.get(content);
  if (!facts) {
    facts = computeWireFacts(content, loadTypeScript());
    if (wireFactsCache.size > 256) wireFactsCache.clear();
    wireFactsCache.set(content, facts);
  }
  return facts.importsSubstrate && facts.callsReaderWith.has(threshold);
}

/**
 * Deterministic-seam variant of {@link detectThresholdWire} for tests: force the
 * AST path by passing a real `ts` module, or the regex fallback by passing
 * `null`. Not memoized (each call recomputes), so both paths can be exercised
 * independently within one process.
 */
export function detectThresholdWireWith(
  threshold: string,
  content: string,
  ts: TsModule | null,
): boolean {
  const facts = computeWireFacts(content, ts);
  return facts.importsSubstrate && facts.callsReaderWith.has(threshold);
}

/**
 * Pure verify-axis verdict: a wired threshold is "covered" iff at least one of
 * the supplied DEDICATED end-to-end tests STRUCTURALLY WIRES it (see
 * {@link detectThresholdWire}). A threshold with no wiring end-to-end test is a
 * `candidate` (integration-coverage gap).
 *
 * Extracted as a pure function (mirrors {@link calibrateVerdict}) so the
 * coverage logic is testable with synthetic test-file entries, independent of
 * the on-disk `tests/integration/` directory. The caller is responsible for
 * passing only dedicated end-to-end files (see {@link END_TO_END_TEST_RE}) —
 * that restriction is the v1.49.949 hardening over the v1.49.947 global-substring
 * scan; v1.49.953 added structural wire detection (a dedicated file that only
 * MENTIONS the threshold no longer counts), v1.49.955 upgraded it from regex to a
 * TypeScript-AST + depth-1 call-graph parse, and v1.49.956 lifted that to a full
 * inter-procedural call-graph + N-level binding chains (see {@link detectThresholdWire}).
 */
export function verifyVerdict(
  wired: readonly CalibratableThreshold[],
  endToEndTests: ReadonlyArray<{ file: string; content: string }>,
): {
  status: CadenceStatus;
  perThreshold: ThresholdCoverage[];
  uncovered: CalibratableThreshold[];
  detail: string;
} {
  const perThreshold: ThresholdCoverage[] = wired.map((threshold) => {
    const coveringTests = endToEndTests
      .filter((t) => detectThresholdWire(threshold, t.content))
      .map((t) => t.file);
    return { threshold, covered: coveringTests.length > 0, coveringTests };
  });
  const uncovered = perThreshold.filter((p) => !p.covered).map((p) => p.threshold);
  const status: CadenceStatus = uncovered.length > 0 ? 'candidate' : 'not-overdue';
  const detail =
    status === 'candidate'
      ? `${uncovered.length} wired threshold(s) with NO dedicated *-end-to-end integration test that ` +
        `structurally wires substrate -> calibration: ${uncovered.join(', ')}; CANDIDATE — confirm a ` +
        `substrate-to-caller end-to-end test exists and >=10 ships since the first non-test caller (operator-tracked).`
      : `all ${wired.length} wired thresholds are structurally wired by a dedicated *-end-to-end integration ` +
        `test (${endToEndTests.length} such file(s)); no integration-coverage gap detected -> not overdue.`;
  return { status, perThreshold, uncovered, detail };
}

/** VERIFY: does a DEDICATED *-end-to-end integration test reference each wired threshold? */
function checkVerify(integrationDir: string): AxisReport {
  const wired = ALL_CALIBRATABLE_THRESHOLDS.filter((t) => observationSourceFor(t).wired);

  let endToEndTests: { file: string; content: string }[] = [];
  let totalIntegrationFiles = 0;
  let readable = true;
  try {
    const files = readdirSync(integrationDir);
    totalIntegrationFiles = files.length;
    endToEndTests = files
      .filter((f) => END_TO_END_TEST_RE.test(f))
      .map((f) => {
        try {
          return { file: f, content: readFileSync(join(integrationDir, f), 'utf8') };
        } catch {
          return { file: f, content: '' };
        }
      });
  } catch {
    readable = false;
  }

  // When the integration dir is unreadable we cannot judge -> manual.
  if (!readable) {
    return {
      axis: 'verify',
      status: 'manual',
      machineReadable: false,
      detail: `tests/integration/ unreadable; cannot heuristically check integration coverage -> manual.`,
      data: { totalIntegrationFiles: 0, endToEndTests: [], wired: wired.length, uncovered: [] },
    };
  }

  const verdict = verifyVerdict(wired, endToEndTests);
  return {
    axis: 'verify',
    status: verdict.status,
    machineReadable: true,
    detail: verdict.detail,
    data: {
      totalIntegrationFiles,
      endToEndTests: endToEndTests.map((t) => t.file),
      wired: wired.length,
      perThreshold: verdict.perThreshold,
      uncovered: verdict.uncovered,
    },
  };
}

export interface CadenceReportOptions {
  /** Override the suggestions.json path the calibrate axis reads (tests). */
  suggestionsPath?: string;
  /** Override the tests/integration/ directory the verify axis reads (tests). */
  integrationDir?: string;
  /** Override the docs/release-notes/ directory the ships-since reader scans (tests). */
  releaseNotesDir?: string;
}

/**
 * Apply the machine-readable second conjunct: a `candidate` whose axis has
 * `>=CADENCE_SHIPS_SINCE_CONJUNCT` ships since its last `cadence_advances`
 * marker becomes `overdue`. Annotates `detail` with the ships-since basis and
 * records `shipsSince` / `lastAdvanceVersion` in `data` either way.
 */
function applyShipsSince(
  report: AxisReport,
  advances: Partial<Record<CadenceAxis, AxisAdvance>>,
): AxisReport {
  const adv = advances[report.axis];
  const shipsSince = adv?.shipsSince;
  const data = { ...report.data, shipsSince: shipsSince ?? null, lastAdvanceVersion: adv?.lastVersion ?? null };
  const upgraded = shipsSinceUpgrade(report.status, shipsSince);

  if (upgraded === 'overdue') {
    return {
      ...report,
      status: 'overdue',
      data,
      detail:
        `OVERDUE — first conjunct met AND ${shipsSince} ships since the last ${report.axis} advance ` +
        `(${adv!.lastVersion}) >= ${CADENCE_SHIPS_SINCE_CONJUNCT}. ` + report.detail,
    };
  }

  if (report.status === 'candidate') {
    const note =
      shipsSince === undefined
        ? ` [ships-since: unknown — no ${report.axis} advance tagged; add cadence_advances: [${report.axis}] ` +
          `to a release-notes README to enable overdue detection]`
        : ` [ships-since: ${shipsSince} (< ${CADENCE_SHIPS_SINCE_CONJUNCT}) since ${adv!.lastVersion}]`;
    return { ...report, data, detail: report.detail + note };
  }

  return { ...report, data };
}

/** Run the requested axis check(s). */
export async function buildCadenceReport(
  axis?: CadenceAxis,
  opts: CadenceReportOptions = {},
): Promise<AxisReport[]> {
  const reports: AxisReport[] = [];
  const want = (a: CadenceAxis) => axis === undefined || axis === a;
  if (want('codify')) reports.push(checkCodify());
  if (want('consume')) reports.push(checkConsume());
  if (want('calibrate')) {
    reports.push(await checkCalibrate(opts.suggestionsPath ?? DEFAULT_SUGGESTIONS_PATH));
  }
  if (want('verify')) reports.push(checkVerify(opts.integrationDir ?? INTEGRATION_DIR));

  // Apply the machine-readable second conjunct (ships-since) to every report.
  const advances = readAxisAdvances(opts.releaseNotesDir ?? RELEASE_NOTES_DIR);
  return reports.map((r) => applyShipsSince(r, advances));
}

function parseAxis(args: string[]): CadenceAxis | undefined | 'invalid' {
  const flag = args.find((a) => a === '--axis' || a.startsWith('--axis='));
  if (!flag) return undefined;
  let value: string | undefined;
  if (flag.includes('=')) value = flag.split('=')[1];
  else value = args[args.indexOf(flag) + 1];
  if (value && (CADENCE_AXES as readonly string[]).includes(value)) return value as CadenceAxis;
  return 'invalid';
}

/**
 * CLI entry point for `skill-creator cadence`.
 *
 * @returns process exit code.
 */
export async function cadenceCommand(args: string[] = []): Promise<number> {
  const json = args.includes('--json');
  const check = args.includes('--check');
  const axis = parseAxis(args);

  if (axis === 'invalid') {
    const msg = { error: 'invalid-axis', supported: CADENCE_AXES };
    console.log(json ? JSON.stringify(msg) : `Invalid --axis. Supported: ${CADENCE_AXES.join(', ')}`);
    return 2;
  }

  const reports = await buildCadenceReport(axis);
  const overdue = reports.filter((r) => r.status === 'overdue');
  const candidates = reports.filter((r) => r.status === 'candidate');

  if (json) {
    console.log(
      JSON.stringify(
        {
          axis: axis ?? 'all',
          overdueCount: overdue.length,
          candidateCount: candidates.length,
          reports,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`Meta-cadence overdue-check${axis ? ` (axis: ${axis})` : ''}`);
    console.log('='.repeat(60));
    for (const r of reports) {
      const tag =
        r.status === 'overdue'
          ? '[OVERDUE]  '
          : r.status === 'candidate'
            ? '[CANDIDATE]'
            : r.status === 'manual'
              ? '[MANUAL]   '
              : '[ok]       ';
      console.log(`${tag} ${r.axis}: ${r.detail}`);
    }
    console.log('='.repeat(60));
    if (check) {
      const parts: string[] = [];
      if (overdue.length > 0) {
        parts.push(`${overdue.length} axis(es) OVERDUE (both conjuncts met) — gate fires (exit 1).`);
      }
      if (candidates.length > 0) {
        parts.push(
          `${candidates.length} axis(es) CANDIDATE (first conjunct met; ships-since unconfirmed or < ${CADENCE_SHIPS_SINCE_CONJUNCT}) — advisory, does not fire the gate.`,
        );
      }
      console.log(
        parts.length > 0
          ? parts.join(' ')
          : `No axis machine-determinably overdue. (Manual axes still warrant the prose check.)`,
      );
    }
  }

  // --check is a true gate: fires (exit 1) only on a definitive `overdue`
  // (both conjuncts machine-determined). `candidate` is advisory (exit 0).
  if (check) return cadenceCheckExitCode(reports);
  return 0;
}
