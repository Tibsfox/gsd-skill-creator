import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as ts from 'typescript';

import { ALL_CALIBRATABLE_THRESHOLDS } from '../../bounded-learning/types.js';
import type { CalibratableThreshold } from '../../bounded-learning/types.js';
import {
  calibrateVerdict,
  verifyVerdict,
  detectThresholdWire,
  detectThresholdWireWith,
  regexWireFacts,
  astWireFacts,
  buildCadenceReport,
  cadenceCommand,
  readAxisAdvances,
  shipsSinceUpgrade,
  cadenceCheckExitCode,
  CADENCE_AXES,
  CALIBRATE_OBSERVATION_CONJUNCT,
  CADENCE_SHIPS_SINCE_CONJUNCT,
  END_TO_END_TEST_RE,
  SUBSTRATE_SPECIFIER_RE,
  READER_MODULE_RE,
  type AxisReport,
  type CadenceStatus,
  type ThresholdObservationCount,
} from './cadence.js';

/** A realistic reader import line — every real end-to-end test has one. */
const READER_IMPORT = `import { loadObservationsForThreshold } from '../../src/bounded-learning/observation-sources.js';`;

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

/**
 * Synthetic dedicated-end-to-end content that STRUCTURALLY WIRES a threshold
 * (v1.49.953): a substrate/events import (write end) + a real
 * loadObservationsForThreshold(threshold-literal) call (caller end).
 */
function wiredContent(threshold: string): string {
  return [
    `import { runFoo } from '../../src/foo/foo-substrate.js';`,
    `import { loadObservationsForThreshold } from '../../src/bounded-learning/observation-sources.js';`,
    `const obs = await loadObservationsForThreshold('${threshold}', { path });`,
  ].join('\n');
}

/** Synthetic dedicated-end-to-end content that only MENTIONS a threshold (no wire). */
function mentionContent(threshold: string): string {
  return `// this file mentions ${threshold} in a comment but never wires it\n`;
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

  describe('detectThresholdWire (pure) — structural substrate-to-caller detection (v1.49.953)', () => {
    const T = 'observation.retention_days';

    it('wires iff a substrate import AND a loadObservationsForThreshold(threshold-literal) call', () => {
      expect(detectThresholdWire(T, wiredContent(T))).toBe(true);
    });

    it('a comment-only MENTION does not wire (the key hardening over string-presence)', () => {
      expect(detectThresholdWire(T, mentionContent(T))).toBe(false);
      // Even the bare threshold string somewhere in the file is not enough.
      expect(detectThresholdWire(T, `const x = '${T}'; // not passed to the reader`)).toBe(false);
    });

    it('a calibration-reader call WITHOUT a substrate import does not wire', () => {
      // Reader imported + a real call, but NO substrate import -> isolates the
      // substrate-end conjunct.
      const content = `${READER_IMPORT}\nawait loadObservationsForThreshold('${T}', { path });`;
      expect(detectThresholdWire(T, content)).toBe(false);
    });

    it('a substrate import WITHOUT a reader call does not wire', () => {
      const content = `import { runFoo } from '../../src/foo/foo-substrate.js';\n// mentions ${T}`;
      expect(detectThresholdWire(T, content)).toBe(false);
    });

    it('detects a multi-line reader call (the call style every real test uses)', () => {
      const content =
        `import { appendEvt } from '../../src/x-events.js';\n${READER_IMPORT}\n` +
        `const obs = await loadObservationsForThreshold(\n  '${T}',\n  { eventsPath },\n);`;
      expect(detectThresholdWire(T, content)).toBe(true);
    });

    it('does not wire a DIFFERENT threshold passed to the reader', () => {
      const content = wiredContent('token_budget.max_percent');
      expect(detectThresholdWire(T, content)).toBe(false);
    });

    it('does not match an identifier that merely ENDS with the reader name (boundary guard)', () => {
      const content =
        `import { runFoo } from '../../src/foo/foo-substrate.js';\n` +
        `await myloadObservationsForThreshold('${T}', { path });`;
      expect(detectThresholdWire(T, content)).toBe(false);
    });

    it('accepts suggestion-store and -events substrate module specifiers', () => {
      const sug =
        `import { SuggestionStore } from '../../src/detection/suggestion-store.js';\n${READER_IMPORT}\n` +
        `await loadObservationsForThreshold('${T}', { p });`;
      const evt =
        `import { appendEvt } from '../../src/bounded-learning/x-events.js';\n${READER_IMPORT}\n` +
        `await loadObservationsForThreshold('${T}', { p });`;
      expect(detectThresholdWire(T, sug)).toBe(true);
      expect(detectThresholdWire(T, evt)).toBe(true);
    });
  });

  // --- v1.49.955: AST + dataflow + depth-1 call-graph precision the regex lacked.
  // Each case pairs the AST verdict (detectThresholdWireWith(..., ts)) against the
  // regex fallback verdict (..., null) to MAKE the difference load-bearing: the
  // AST path is correct, and the regex path is shown to be wrong in the same test.
  describe('detectThresholdWire (AST) — precision over the v1.49.953 regex', () => {
    const T = 'observation.retention_days';
    const SUB = `import { runFoo } from '../../src/foo/foo-substrate.js';`;

    it('IGNORES the reader call when it appears only in a JSDoc/comment (regex false-positives)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `/** example: loadObservationsForThreshold('${T}', opts) */\n` +
        `// also loadObservationsForThreshold('${T}', opts)\n` +
        `const noop = 1;`;
      // AST: the call text lives in comments -> no CallExpression -> not wired.
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
      // Regex: raw-text match in the comment -> WRONGLY wired. The AST fixes this.
      expect(detectThresholdWireWith(T, content, null)).toBe(true);
    });

    it('IGNORES the reader call when it appears only inside a string literal', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const sql = "loadObservationsForThreshold('${T}', x)";`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
      expect(detectThresholdWireWith(T, content, null)).toBe(true);
    });

    it('IGNORES a substrate "import" that is only in a comment (regex false-positives)', () => {
      const content =
        `${READER_IMPORT}\n` +
        `// import { appendEvt } from '../../src/foo-events.js';\n` +
        `await loadObservationsForThreshold('${T}', { p });`;
      // AST: the only -events reference is a comment, not a real ImportDeclaration.
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
      // Regex: SUBSTRATE_MODULE_RE matches the commented `from '...-events.js'`.
      expect(detectThresholdWireWith(T, content, null)).toBe(true);
    });

    it('RESOLVES a threshold passed via a string-literal const (regex false-negatives)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const T = '${T}';\n` +
        `await loadObservationsForThreshold(T, { p });`;
      // AST: dataflow resolves T -> literal.
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      // Regex: the call arg is an identifier, not a quoted literal -> missed.
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it("RESOLVES a 'x' as const binding", () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const T = '${T}' as const;\n` +
        `await loadObservationsForThreshold(T, { p });`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('FOLLOWS an import alias (regex false-negatives)', () => {
      const content =
        `${SUB}\n` +
        `import { loadObservationsForThreshold as load } from '../../src/bounded-learning/observation-sources.js';\n` +
        `await load('${T}', { p });`;
      // AST: the alias binding resolves to the imported reader.
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      // Regex: looks for the literal `loadObservationsForThreshold(` -> missed.
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('FOLLOWS a namespace import (os.loadObservationsForThreshold)', () => {
      const content =
        `${SUB}\n` +
        `import * as os from '../../src/bounded-learning/observation-sources.js';\n` +
        `await os.loadObservationsForThreshold('${T}', { p });`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      // The regex ALSO matches here — but only because its lookbehind cannot tell
      // `os.` apart from a bare call; that blindness is WRONG in the next case.
      expect(detectThresholdWireWith(T, content, null)).toBe(true);
    });

    it('does NOT follow a namespace import from a non-reader module (binding-accuracy)', () => {
      const content =
        `${SUB}\n` +
        `import * as other from '../../src/some/other-module.js';\n` +
        `await other.loadObservationsForThreshold('${T}', { p });`;
      // AST: the namespace is not from observation-sources -> not a reader call.
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
      // Regex: blindly matches `other.loadObservationsForThreshold('...')` -> WRONGLY wired.
      expect(detectThresholdWireWith(T, content, null)).toBe(true);
    });

    it('FOLLOWS a depth-1 wrapper that forwards a parameter to the reader', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function readFor(t: string) { return loadObservationsForThreshold(t, { p }); }\n` +
        `await readFor('${T}');`;
      // AST: the wrapper forwards its 1st param -> resolve the call-site literal.
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      // Regex: `readFor('...')` is not a reader call; `loadObservationsForThreshold(t` has no literal.
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('FOLLOWS an arrow-const wrapper forwarding a non-zero param index', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const readFor = (path: string, t: string) => loadObservationsForThreshold(t, { path });\n` +
        `await readFor('/tmp/x', '${T}');`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('does NOT match a LOCAL function that merely shares the reader name (binding-accuracy)', () => {
      const content =
        `${SUB}\n` +
        `function loadObservationsForThreshold(_t: string, _o: unknown) { return []; }\n` +
        `loadObservationsForThreshold('${T}', {});`;
      // AST: the callee resolves to a LOCAL decl, not an imported binding -> not wired.
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
      // Regex: raw-text match -> WRONGLY wired.
      expect(detectThresholdWireWith(T, content, null)).toBe(true);
    });

    it('does NOT cross-wire a different threshold under dataflow resolution', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const T = 'token_budget.max_percent';\n` +
        `await loadObservationsForThreshold(T, { p });`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
      expect(detectThresholdWireWith('token_budget.max_percent', content, ts)).toBe(true);
    });

    it('a wrapper param shadowing a same-named threshold const does NOT over-report (scope-accuracy)', () => {
      // The reader call inside `w` forwards the PARAMETER `t`; the module-level
      // `const t` merely shares the name. Because `w` is never called with a
      // literal, the threshold is NOT wired — `isParamInScope` keeps the param
      // from resolving against the flat const map (review finding #3).
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const t = 'token_budget.max_percent';\n` +
        `function w(t: string) { return loadObservationsForThreshold(t, {}); }\n` +
        `void t;`;
      expect(detectThresholdWireWith('token_budget.max_percent', content, ts)).toBe(false);
    });

    it('but the SAME wrapper IS wired when actually called with the literal (fix keeps the feature)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const t = 'token_budget.max_percent';\n` +
        `function w(t: string) { return loadObservationsForThreshold(t, {}); }\n` +
        `await w('token_budget.max_percent');`;
      expect(detectThresholdWireWith('token_budget.max_percent', content, ts)).toBe(true);
    });

    it('the public (lazy-loaded, memoized) detectThresholdWire uses the AST path', () => {
      // Variable indirection is resolvable ONLY by the AST path; if the public
      // entry point silently fell back to regex (compiler failed to load), this
      // would be false. So it doubles as proof loadTypeScript() works in-process.
      const content = `${SUB}\n${READER_IMPORT}\nconst T = '${T}';\nawait loadObservationsForThreshold(T, {});`;
      expect(detectThresholdWire(T, content)).toBe(true);
    });
  });

  describe('WireFacts primitives — astWireFacts / regexWireFacts / specifier REs', () => {
    const T = 'observation.retention_days';

    it('astWireFacts extracts both conjuncts from a realistic wired file', () => {
      const f = astWireFacts(wiredContent(T), ts);
      expect(f.importsSubstrate).toBe(true);
      expect([...f.callsReaderWith]).toContain(T);
    });

    it('astWireFacts reports importsSubstrate=false when no substrate import', () => {
      const f = astWireFacts(`${READER_IMPORT}\nawait loadObservationsForThreshold('${T}', {});`, ts);
      expect(f.importsSubstrate).toBe(false);
      expect([...f.callsReaderWith]).toEqual([T]); // caller end still detected
    });

    it('regexWireFacts collects every literal passed to the reader (fallback shape)', () => {
      const content =
        `import { x } from '../foo-events.js';\n` +
        `loadObservationsForThreshold('a', {}); loadObservationsForThreshold('b', {});`;
      const f = regexWireFacts(content);
      expect(f.importsSubstrate).toBe(true);
      expect([...f.callsReaderWith].sort()).toEqual(['a', 'b']);
    });

    it('SUBSTRATE_SPECIFIER_RE matches the three substrate naming schemes only', () => {
      expect(SUBSTRATE_SPECIFIER_RE.test('../x/foo-substrate.js')).toBe(true);
      expect(SUBSTRATE_SPECIFIER_RE.test('../x/foo-events.js')).toBe(true);
      expect(SUBSTRATE_SPECIFIER_RE.test('../detection/suggestion-store.js')).toBe(true);
      expect(SUBSTRATE_SPECIFIER_RE.test('../x/observation-sources.js')).toBe(false);
    });

    it('READER_MODULE_RE matches the observation-sources module', () => {
      expect(READER_MODULE_RE.test('../../src/bounded-learning/observation-sources.js')).toBe(true);
      expect(READER_MODULE_RE.test('../../src/some/other-module.js')).toBe(false);
    });

    it('FAIL-SOFT (#10427): a throwing compiler degrades to the regex fallback', () => {
      // Force the AST branch to throw, then assert computeWireFacts caught it and
      // returned the regex verdict (wiredContent is a direct-literal file the
      // regex handles). Exercises the silent catch path that the `..., null`
      // cases bypass (they never enter astWireFacts at all).
      const boom = {
        createSourceFile() {
          throw new Error('synthetic compiler failure');
        },
      } as unknown as typeof ts;
      const T = 'observation.retention_days';
      expect(detectThresholdWireWith(T, wiredContent(T), boom)).toBe(true);
      // And a non-wired file still reads false through the fallback.
      expect(detectThresholdWireWith(T, mentionContent(T), boom)).toBe(false);
    });
  });

  describe('verifyVerdict (pure) — structural-wire coverage', () => {
    it('a threshold structurally wired by a dedicated end-to-end test is covered', () => {
      const v = verifyVerdict(['observation.retention_days'], [
        { file: 'r-end-to-end.integration.test.ts', content: wiredContent('observation.retention_days') },
      ]);
      expect(v.status).toBe('not-overdue');
      expect(v.uncovered).toEqual([]);
      expect(v.perThreshold[0].covered).toBe(true);
      expect(v.perThreshold[0].coveringTests).toEqual(['r-end-to-end.integration.test.ts']);
    });

    it('a dedicated file that only MENTIONS the threshold is a candidate (not covered)', () => {
      const v = verifyVerdict(['observation.retention_days'], [
        { file: 'r-end-to-end.integration.test.ts', content: mentionContent('observation.retention_days') },
      ]);
      expect(v.status).toBe('candidate');
      expect(v.uncovered).toEqual(['observation.retention_days']);
    });

    it('a threshold wired by NO end-to-end test is a candidate', () => {
      const v = verifyVerdict(['token_budget.max_percent'], [
        { file: 'other-end-to-end.integration.test.ts', content: 'unrelated content' },
      ]);
      expect(v.status).toBe('candidate');
      expect(v.uncovered).toEqual(['token_budget.max_percent']);
    });

    it('mixed input names only the uncovered threshold', () => {
      const v = verifyVerdict(['observation.retention_days', 'token_budget.max_percent'], [
        { file: 'r-end-to-end.integration.test.ts', content: wiredContent('observation.retention_days') },
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
      const v = verifyVerdict([], [
        { file: 'x-end-to-end.integration.test.ts', content: wiredContent('observation.retention_days') },
      ]);
      expect(v.status).toBe('not-overdue');
    });
  });

  describe('verify axis — restricts coverage to dedicated end-to-end files', () => {
    it('an incidental mention in a NON-end-to-end integration test does NOT count as coverage', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'cadence-verify-'));
      try {
        // A DEDICATED end-to-end test that STRUCTURALLY WIRES one real threshold.
        writeFileSync(
          join(dir, 'retention-end-to-end.integration.test.ts'),
          wiredContent('observation.retention_days'),
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
