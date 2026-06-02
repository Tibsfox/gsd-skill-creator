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
 * The second conjunct of each trigger — "N ships since the last X" — is NOT
 * machine-tracked (there is no per-axis last-ship marker), so when a first
 * conjunct is met the verdict is `candidate` (flag for the operator to confirm
 * the ships-since conjunct), never a silent definitive "overdue". The codify
 * axis has no cleanly machine-readable signal (no structured ESTABLISHED-
 * candidate backlog), so it reports `manual` with the manifest lesson count for
 * context. The verify axis uses a heuristic restricted to the DEDICATED
 * `*-end-to-end.integration.test.ts` files (the #10453 substrate->calibration
 * closing-move convention): a wired threshold is "covered" iff one of those
 * dedicated end-to-end tests references its string. Restricting to dedicated
 * end-to-end files — rather than every integration file (the v1.49.947
 * global-substring heuristic) — means an incidental mention of a threshold
 * string in an unrelated integration test no longer counts as coverage. It is
 * still a heuristic (filename-convention + string-presence, not import/call-
 * graph wire detection); a true substrate-to-caller wire detector is future
 * work.
 *
 * Exit codes (with `--check`):
 *   0  no checked axis is a candidate (not-overdue / manual)
 *   1  at least one checked axis is a candidate (first conjunct met)
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
 * - `candidate`   — the first conjunct IS met; the operator must confirm the
 *   `>=N ships since last X` conjunct before declaring the axis overdue.
 * - `manual`      — the axis has no cleanly machine-readable signal; the prose
 *   check stands.
 */
export type CadenceStatus = 'not-overdue' | 'candidate' | 'manual';

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
  /** Dedicated end-to-end test file(s) that reference this threshold. */
  coveringTests: string[];
}

/**
 * Pure verify-axis verdict: a wired threshold is "covered" iff at least one of
 * the supplied DEDICATED end-to-end tests references its string. A threshold
 * with no covering end-to-end test is a `candidate` (integration-coverage gap).
 *
 * Extracted as a pure function (mirrors {@link calibrateVerdict}) so the
 * coverage logic is testable with synthetic test-file entries, independent of
 * the on-disk `tests/integration/` directory. The caller is responsible for
 * passing only dedicated end-to-end files (see {@link END_TO_END_TEST_RE}) —
 * that restriction is the hardening over the v1.49.947 global-substring scan.
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
      .filter((t) => t.content.includes(threshold))
      .map((t) => t.file);
    return { threshold, covered: coveringTests.length > 0, coveringTests };
  });
  const uncovered = perThreshold.filter((p) => !p.covered).map((p) => p.threshold);
  const status: CadenceStatus = uncovered.length > 0 ? 'candidate' : 'not-overdue';
  const detail =
    status === 'candidate'
      ? `${uncovered.length} wired threshold(s) with NO dedicated *-end-to-end integration test: ` +
        `${uncovered.join(', ')}; CANDIDATE (heuristic: dedicated-end-to-end-file reference) — confirm a ` +
        `substrate-to-caller end-to-end test exists and >=10 ships since the first non-test caller (operator-tracked).`
      : `all ${wired.length} wired thresholds are referenced by a dedicated *-end-to-end integration test ` +
        `(${endToEndTests.length} such file(s)); no integration-coverage gap detected -> not overdue.`;
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
  return reports;
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
  const candidates = reports.filter((r) => r.status === 'candidate');

  if (json) {
    console.log(
      JSON.stringify(
        {
          axis: axis ?? 'all',
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
        r.status === 'candidate' ? '[CANDIDATE]' : r.status === 'manual' ? '[MANUAL]   ' : '[ok]       ';
      console.log(`${tag} ${r.axis}: ${r.detail}`);
    }
    console.log('='.repeat(60));
    if (check) {
      console.log(
        candidates.length > 0
          ? `${candidates.length} axis(es) flagged as CANDIDATE — confirm the ships-since conjunct, then scope the next counter-cadence.`
          : `No axis machine-determinably overdue. (Manual axes still warrant the prose check.)`,
      );
    }
  }

  // --check exit semantics: 1 if any axis is a machine-readable candidate.
  if (check) return candidates.length > 0 ? 1 : 0;
  return 0;
}
