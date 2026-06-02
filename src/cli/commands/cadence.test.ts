import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ALL_CALIBRATABLE_THRESHOLDS } from '../../bounded-learning/types.js';
import type { CalibratableThreshold } from '../../bounded-learning/types.js';
import {
  calibrateVerdict,
  verifyVerdict,
  buildCadenceReport,
  cadenceCommand,
  readAxisAdvances,
  shipsSinceUpgrade,
  cadenceCheckExitCode,
  CADENCE_AXES,
  CALIBRATE_OBSERVATION_CONJUNCT,
  CADENCE_SHIPS_SINCE_CONJUNCT,
  END_TO_END_TEST_RE,
  type AxisReport,
  type CadenceStatus,
  type ThresholdObservationCount,
} from './cadence.js';

/** Build a synthetic docs/release-notes/ dir with per-version cadence_advances frontmatter. */
function makeReleaseNotes(versions: Array<{ v: string; advances?: string[] }>): string {
  const dir = mkdtempSync(join(tmpdir(), 'cadence-rn-'));
  for (const { v, advances } of versions) {
    mkdirSync(join(dir, v), { recursive: true });
    const fm = advances ? `cadence_advances: [${advances.join(', ')}]\n` : '';
    writeFileSync(join(dir, v, 'README.md'), `---\nversion: ${v}\n${fm}---\n# ${v}\n`);
  }
  return dir;
}

describe('cadence command', () => {
  describe('ALL_CALIBRATABLE_THRESHOLDS drift guard (#10461)', () => {
    it('runtime array enumerates exactly the 7 union members in order', () => {
      // Pins the runtime array to disk reality; the compile-time `satisfies` +
      // _AllThresholdsCovered guard in types.ts pin the type<->array directions.
      expect([...ALL_CALIBRATABLE_THRESHOLDS]).toEqual([
        'suggestions.min_occurrences',
        'suggestions.cooldown_days',
        'suggestions.auto_dismiss_after_days',
        'token_budget.warn_at_percent',
        'token_budget.max_percent',
        'observation.retention_days',
        'predictive.low_confidence_threshold',
      ]);
    });
  });

  describe('calibrateVerdict — the v944 conjunct misread (>=20 observations)', () => {
    const wired = (threshold: CalibratableThreshold, observations: number): ThresholdObservationCount => ({
      threshold,
      wired: true,
      observations,
    });

    it('all wired thresholds at 12 observations -> NOT overdue (the exact session scenario)', () => {
      // v1.49.944: the prose check was read as ">=20 met" when the max was 12.
      const verdict = calibrateVerdict([...ALL_CALIBRATABLE_THRESHOLDS].map((t) => wired(t, 12)));
      expect(verdict.status).toBe('not-overdue');
      expect(verdict.maxObservations).toBe(12);
      expect(verdict.candidates).toHaveLength(0);
    });

    it('a threshold at exactly 20 -> candidate (pins the >= boundary)', () => {
      const verdict = calibrateVerdict([wired('observation.retention_days', 20)]);
      expect(verdict.status).toBe('candidate');
      expect(verdict.candidates).toHaveLength(1);
    });

    it('a threshold at 19 -> NOT overdue (the <20 side of the boundary)', () => {
      const verdict = calibrateVerdict([wired('observation.retention_days', 19)]);
      expect(verdict.status).toBe('not-overdue');
    });

    it('one threshold at 25 among 5s -> candidate names only the 25 one', () => {
      const verdict = calibrateVerdict([
        wired('suggestions.min_occurrences', 5),
        wired('token_budget.max_percent', 25),
        wired('predictive.low_confidence_threshold', 5),
      ]);
      expect(verdict.status).toBe('candidate');
      expect(verdict.candidates.map((c) => c.threshold)).toEqual(['token_budget.max_percent']);
    });

    it('an UNWIRED threshold never counts, even at high observations', () => {
      const verdict = calibrateVerdict([
        { threshold: 'observation.retention_days', wired: false, observations: 100 },
      ]);
      expect(verdict.status).toBe('not-overdue');
      expect(verdict.candidates).toHaveLength(0);
    });

    it('empty input -> not overdue (max 0)', () => {
      const verdict = calibrateVerdict([]);
      expect(verdict.status).toBe('not-overdue');
      expect(verdict.maxObservations).toBe(0);
    });

    it('the first-conjunct threshold is 20', () => {
      expect(CALIBRATE_OBSERVATION_CONJUNCT).toBe(20);
    });
  });

  describe('END_TO_END_TEST_RE — dedicated-end-to-end naming convention (#10453)', () => {
    it('matches only *-end-to-end.integration.test.ts files', () => {
      expect(END_TO_END_TEST_RE.test('observation-retention-end-to-end.integration.test.ts')).toBe(true);
      expect(END_TO_END_TEST_RE.test('token-budget-max-end-to-end.integration.test.ts')).toBe(true);
      // A plain integration test is NOT a dedicated end-to-end test.
      expect(END_TO_END_TEST_RE.test('college-observation-bridge-wire.integration.test.ts')).toBe(false);
      expect(END_TO_END_TEST_RE.test('foo.test.ts')).toBe(false);
      // Needs the full `.integration.test.ts` suffix, not just `end-to-end`.
      expect(END_TO_END_TEST_RE.test('something-end-to-end.test.ts')).toBe(false);
    });
  });

  describe('verifyVerdict (pure) — dedicated-end-to-end coverage', () => {
    it('a threshold referenced by a dedicated end-to-end test is covered', () => {
      const v = verifyVerdict(['observation.retention_days'], [
        { file: 'r-end-to-end.integration.test.ts', content: 'exercises observation.retention_days' },
      ]);
      expect(v.status).toBe('not-overdue');
      expect(v.uncovered).toEqual([]);
      expect(v.perThreshold[0].covered).toBe(true);
      expect(v.perThreshold[0].coveringTests).toEqual(['r-end-to-end.integration.test.ts']);
    });

    it('a threshold referenced by NO end-to-end test is a candidate', () => {
      const v = verifyVerdict(['token_budget.max_percent'], [
        { file: 'other-end-to-end.integration.test.ts', content: 'unrelated content' },
      ]);
      expect(v.status).toBe('candidate');
      expect(v.uncovered).toEqual(['token_budget.max_percent']);
    });

    it('mixed input names only the uncovered threshold', () => {
      const v = verifyVerdict(['observation.retention_days', 'token_budget.max_percent'], [
        { file: 'r-end-to-end.integration.test.ts', content: 'observation.retention_days here' },
      ]);
      expect(v.status).toBe('candidate');
      expect(v.uncovered).toEqual(['token_budget.max_percent']);
    });

    it('no end-to-end tests -> every wired threshold is uncovered', () => {
      const v = verifyVerdict(['observation.retention_days'], []);
      expect(v.status).toBe('candidate');
      expect(v.uncovered).toEqual(['observation.retention_days']);
    });

    it('no wired thresholds -> not overdue', () => {
      const v = verifyVerdict([], [{ file: 'x-end-to-end.integration.test.ts', content: 'whatever' }]);
      expect(v.status).toBe('not-overdue');
    });
  });

  describe('verify axis — restricts coverage to dedicated end-to-end files', () => {
    it('an incidental mention in a NON-end-to-end integration test does NOT count as coverage', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'cadence-verify-'));
      try {
        // A DEDICATED end-to-end test referencing one real threshold.
        writeFileSync(
          join(dir, 'retention-end-to-end.integration.test.ts'),
          '// exercises observation.retention_days substrate -> calibration end-to-end\n',
        );
        // A NON-dedicated integration test that merely MENTIONS another threshold.
        // The pre-v1.49.948 global-substring heuristic would have counted this as coverage.
        writeFileSync(
          join(dir, 'unrelated.integration.test.ts'),
          '// incidental: token_budget.max_percent appears here, not an end-to-end calibration test\n',
        );

        const [verify] = await buildCadenceReport('verify', { integrationDir: dir });
        const per = verify.data.perThreshold as Array<{
          threshold: string;
          covered: boolean;
          coveringTests: string[];
        }>;
        const retention = per.find((p) => p.threshold === 'observation.retention_days')!;
        const maxPct = per.find((p) => p.threshold === 'token_budget.max_percent')!;

        // The dedicated end-to-end file covers retention.
        expect(retention.covered).toBe(true);
        expect(retention.coveringTests).toEqual(['retention-end-to-end.integration.test.ts']);
        // The incidental mention in a NON-end-to-end file does NOT cover max_percent.
        expect(maxPct.covered).toBe(false);
        // Only the dedicated end-to-end file is considered.
        expect(verify.data.endToEndTests).toEqual(['retention-end-to-end.integration.test.ts']);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it('an unreadable integration dir -> manual (cannot judge)', async () => {
      const [verify] = await buildCadenceReport('verify', {
        integrationDir: join(tmpdir(), 'cadence-verify-does-not-exist-' + process.pid),
      });
      expect(verify.status).toBe('manual');
      expect(verify.machineReadable).toBe(false);
    });
  });

  describe('verify axis (live repo)', () => {
    // v1.49.951 closed the last verify gap: the three suggestions.* thresholds
    // now have a dedicated end-to-end test, so the live verify axis is
    // not-overdue with nothing uncovered. This is the live-tree drift guard that
    // the bounded-learning verify coverage holds (#10461): if any wired
    // threshold loses (or gains without coverage) its dedicated *-end-to-end
    // test, this fails.
    it('all wired thresholds have a dedicated end-to-end test (not-overdue)', async () => {
      const [verify] = await buildCadenceReport('verify');
      expect(verify.axis).toBe('verify');
      expect(verify.status).toBe('not-overdue');
      expect(verify.data.uncovered).toEqual([]);
      // Every wired threshold — including the three suggestions.* closed at
      // v1.49.951 — is covered.
      const per = verify.data.perThreshold as Array<{ threshold: string; covered: boolean }>;
      for (const t of [
        'suggestions.min_occurrences',
        'suggestions.cooldown_days',
        'suggestions.auto_dismiss_after_days',
        'token_budget.warn_at_percent',
        'token_budget.max_percent',
        'observation.retention_days',
        'predictive.low_confidence_threshold',
      ]) {
        expect(per.find((p) => p.threshold === t)!.covered).toBe(true);
      }
    });
  });

  describe('consume axis (catch-all-proof)', () => {
    it('reports 0 genuinely-unwired thresholds — defensive catch-alls do not count', async () => {
      // v1.49.944: consume was false-positived by string-matching wired:false on
      // the defensive catch-all branches in observation-sources.ts. Enumerating
      // the REAL union members instead yields 0 genuinely-unwired.
      const reports = await buildCadenceReport('consume');
      expect(reports).toHaveLength(1);
      const consume = reports[0];
      expect(consume.axis).toBe('consume');
      expect(consume.status).toBe('not-overdue');
      expect(consume.machineReadable).toBe(true);
      expect(consume.data.genuinelyUnwired as string[]).toEqual([]);
    });
  });

  describe('ships-since second conjunct (#10428 — candidate -> overdue upgrade)', () => {
    it('CADENCE_SHIPS_SINCE_CONJUNCT is 10', () => {
      expect(CADENCE_SHIPS_SINCE_CONJUNCT).toBe(10);
    });

    describe('shipsSinceUpgrade (pure)', () => {
      it('candidate + >=10 ships -> overdue (pins the >= boundary)', () => {
        expect(shipsSinceUpgrade('candidate', 10)).toBe('overdue');
        expect(shipsSinceUpgrade('candidate', 15)).toBe('overdue');
      });
      it('candidate + <10 ships -> candidate', () => {
        expect(shipsSinceUpgrade('candidate', 9)).toBe('candidate');
        expect(shipsSinceUpgrade('candidate', 0)).toBe('candidate');
      });
      it('candidate + unknown ships -> candidate (never a false overdue)', () => {
        expect(shipsSinceUpgrade('candidate', undefined)).toBe('candidate');
      });
      it('non-candidate statuses are never upgraded', () => {
        expect(shipsSinceUpgrade('not-overdue', 100)).toBe('not-overdue');
        expect(shipsSinceUpgrade('manual', 100)).toBe('manual');
      });
    });

    describe('readAxisAdvances', () => {
      it('computes ships-since from the most recent cadence_advances marker', () => {
        const dir = makeReleaseNotes([
          { v: 'v1.0.0', advances: ['consume'] },
          { v: 'v1.0.1' },
          { v: 'v1.0.2', advances: ['consume', 'verify'] },
          { v: 'v1.0.3' },
          { v: 'v1.0.4' },
        ]);
        try {
          const adv = readAxisAdvances(dir);
          // consume last advanced at v1.0.2 (idx 2 of 5) -> shipsSince = 5-1-2 = 2.
          expect(adv.consume).toEqual({ lastVersion: 'v1.0.2', shipsSince: 2 });
          expect(adv.verify).toEqual({ lastVersion: 'v1.0.2', shipsSince: 2 });
          // calibrate never tagged -> absent (ships-since unknown).
          expect(adv.calibrate).toBeUndefined();
        } finally {
          rmSync(dir, { recursive: true, force: true });
        }
      });

      it('sorts by semver, not lexicographically (v1.0.10 is newer than v1.0.9)', () => {
        const versions: Array<{ v: string; advances?: string[] }> = [{ v: 'v1.0.0', advances: ['consume'] }];
        for (let i = 1; i <= 10; i++) versions.push({ v: `v1.0.${i}` });
        const dir = makeReleaseNotes(versions);
        try {
          // 11 dirs; consume at idx 0 -> shipsSince = 11-1-0 = 10.
          expect(readAxisAdvances(dir).consume).toEqual({ lastVersion: 'v1.0.0', shipsSince: 10 });
        } finally {
          rmSync(dir, { recursive: true, force: true });
        }
      });

      it('returns {} for an unreadable dir', () => {
        expect(readAxisAdvances(join(tmpdir(), 'cadence-rn-nope-' + process.pid))).toEqual({});
      });
    });

    describe('cadenceCheckExitCode (pure)', () => {
      const r = (status: CadenceStatus): AxisReport => ({
        axis: 'verify',
        status,
        machineReadable: true,
        detail: '',
        data: {},
      });
      it('returns 1 iff any report is overdue (the true gate)', () => {
        expect(cadenceCheckExitCode([r('overdue')])).toBe(1);
        expect(cadenceCheckExitCode([r('candidate'), r('not-overdue')])).toBe(0);
        expect(cadenceCheckExitCode([r('manual')])).toBe(0);
      });
    });

    describe('end-to-end: ships-since upgrades a live candidate axis', () => {
      it('verify flips to overdue when its advance is >=10 ships back', async () => {
        // v1.0.0 tags verify, then 10 more ships -> shipsSince(verify) = 10.
        const versions: Array<{ v: string; advances?: string[] }> = [{ v: 'v1.0.0', advances: ['verify'] }];
        for (let i = 1; i <= 10; i++) versions.push({ v: `v1.0.${i}` });
        const rnDir = makeReleaseNotes(versions);
        // Empty integration dir -> every wired threshold uncovered -> verify is a
        // candidate, independent of the live repo's coverage (which became
        // not-overdue at v1.49.951). Isolates the ships-since upgrade logic.
        const intDir = mkdtempSync(join(tmpdir(), 'cadence-int-empty-'));
        try {
          const [verify] = await buildCadenceReport('verify', {
            releaseNotesDir: rnDir,
            integrationDir: intDir,
          });
          // candidate + >=10 ships since the verify advance -> overdue.
          expect(verify.status).toBe('overdue');
          expect(verify.data.shipsSince).toBe(10);
          expect(verify.data.lastAdvanceVersion).toBe('v1.0.0');
          expect(cadenceCheckExitCode([verify])).toBe(1);
        } finally {
          rmSync(rnDir, { recursive: true, force: true });
          rmSync(intDir, { recursive: true, force: true });
        }
      });

      it('verify stays candidate when its advance is <10 ships back', async () => {
        const versions: Array<{ v: string; advances?: string[] }> = [{ v: 'v1.0.0', advances: ['verify'] }];
        for (let i = 1; i <= 5; i++) versions.push({ v: `v1.0.${i}` }); // shipsSince = 5
        const rnDir = makeReleaseNotes(versions);
        const intDir = mkdtempSync(join(tmpdir(), 'cadence-int-empty-'));
        try {
          const [verify] = await buildCadenceReport('verify', {
            releaseNotesDir: rnDir,
            integrationDir: intDir,
          });
          expect(verify.status).toBe('candidate');
          expect(verify.data.shipsSince).toBe(5);
          expect(cadenceCheckExitCode([verify])).toBe(0);
        } finally {
          rmSync(rnDir, { recursive: true, force: true });
          rmSync(intDir, { recursive: true, force: true });
        }
      });

      it('verify stays candidate when no verify advance is tagged (unknown anchor)', async () => {
        const rnDir = makeReleaseNotes([{ v: 'v1.0.0', advances: ['consume'] }, { v: 'v1.0.1' }]);
        const intDir = mkdtempSync(join(tmpdir(), 'cadence-int-empty-'));
        try {
          const [verify] = await buildCadenceReport('verify', {
            releaseNotesDir: rnDir,
            integrationDir: intDir,
          });
          expect(verify.status).toBe('candidate');
          expect(verify.data.shipsSince).toBeNull();
        } finally {
          rmSync(rnDir, { recursive: true, force: true });
          rmSync(intDir, { recursive: true, force: true });
        }
      });
    });
  });

  describe('report structure + command surface', () => {
    it('buildCadenceReport() returns one report per axis', async () => {
      const reports = await buildCadenceReport();
      expect(reports.map((r) => r.axis).sort()).toEqual([...CADENCE_AXES].sort());
    });

    it('codify axis is always manual (no machine-readable backlog)', async () => {
      const [codify] = await buildCadenceReport('codify');
      expect(codify.status).toBe('manual');
      expect(codify.machineReadable).toBe(false);
    });

    it('cadenceCommand --axis bogus exits 2', async () => {
      const code = await cadenceCommand(['cadence', '--axis', 'bogus']);
      expect(code).toBe(2);
    });

    it('cadenceCommand --check --axis consume exits 0 (consume not overdue)', async () => {
      const code = await cadenceCommand(['cadence', '--check', '--axis', 'consume']);
      expect(code).toBe(0);
    });

    it('cadenceCommand without --check exits 0 even when an axis is a candidate', async () => {
      const code = await cadenceCommand(['cadence']);
      expect(code).toBe(0);
    });
  });
});
