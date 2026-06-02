import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ALL_CALIBRATABLE_THRESHOLDS } from '../../bounded-learning/types.js';
import type { CalibratableThreshold } from '../../bounded-learning/types.js';
import {
  calibrateVerdict,
  verifyVerdict,
  buildCadenceReport,
  cadenceCommand,
  CADENCE_AXES,
  CALIBRATE_OBSERVATION_CONJUNCT,
  END_TO_END_TEST_RE,
  type ThresholdObservationCount,
} from './cadence.js';

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
    it('flags suggestions.* as lacking a dedicated end-to-end test; the other 4 are covered', async () => {
      const [verify] = await buildCadenceReport('verify');
      expect(verify.axis).toBe('verify');
      expect(verify.status).toBe('candidate');
      const uncovered = verify.data.uncovered as string[];
      // The 3 suggestions.* thresholds have no dedicated *-end-to-end test.
      expect(uncovered).toEqual(
        expect.arrayContaining([
          'suggestions.min_occurrences',
          'suggestions.cooldown_days',
          'suggestions.auto_dismiss_after_days',
        ]),
      );
      // The 4 thresholds with dedicated end-to-end tests are covered (stable).
      const per = verify.data.perThreshold as Array<{ threshold: string; covered: boolean }>;
      for (const t of [
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
