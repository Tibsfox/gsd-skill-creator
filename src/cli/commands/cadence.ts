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
