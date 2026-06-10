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
    it('runtime array enumerates exactly the 8 union members in order', () => {
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
        'amiga.min_sequence_count',
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

  // --- v1.49.956: lift the v1.49.955 depth caps to a FULL inter-procedural
  // call-graph (N-hop wrapper chains) + N-level const/let binding chains. Each
  // case was a documented FALSE-negative of the v955 detector (cap), and a
  // false-negative of the regex too — so the AST verdict (..., ts) is paired with
  // the regex verdict (..., null) to make the lift load-bearing.
  describe('detectThresholdWire (AST) — full inter-procedural call-graph + N-level binding (v1.49.956)', () => {
    const T = 'observation.retention_days';
    const X = 'token_budget.max_percent';
    const SUB = `import { runFoo } from '../../src/foo/foo-substrate.js';`;

    it('FOLLOWS a depth-2 wrapper chain (outer -> inner -> reader) — v955 cap lifted', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function inner(t: string) { return loadObservationsForThreshold(t, {}); }\n` +
        `function outer(t: string) { return inner(t); }\n` +
        `await outer('${T}');`;
      // AST: the fixpoint propagates inner's reader-reaching param through outer.
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      // Regex: the only reader call has a non-literal arg `t` -> missed.
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('FOLLOWS a depth-3 wrapper chain (c -> b -> a -> reader)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function a(t: string) { return loadObservationsForThreshold(t, {}); }\n` +
        `function b(t: string) { return a(t); }\n` +
        `function c(t: string) { return b(t); }\n` +
        `await c('${T}');`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('FOLLOWS a hop that forwards a NON-zero param index to a reader-reaching wrapper', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const inner = (p: string, t: string) => loadObservationsForThreshold(t, { p });\n` +
        `const outer = (p: string, t: string) => inner(p, t);\n` +
        `await outer('/tmp/x', '${T}');`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('RESOLVES a 2-level const alias chain (const b = a; const a = lit) — v955 cap lifted', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const a = '${T}';\n` +
        `const b = a;\n` +
        `await loadObservationsForThreshold(b, {});`;
      // AST: the alias chain b -> a -> literal resolves.
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      // Regex: the call arg is an identifier, not a quoted literal -> missed.
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('RESOLVES a 3-level const alias chain (c -> b -> a -> lit)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const a = '${T}';\nconst b = a;\nconst c = b;\n` +
        `await loadObservationsForThreshold(c, {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('RESOLVES a combined N-hop + N-level case (outer(b) where b -> a -> lit)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const a = '${T}';\nconst b = a;\n` +
        `function inner(t: string) { return loadObservationsForThreshold(t, {}); }\n` +
        `function outer(t: string) { return inner(t); }\n` +
        `await outer(b);`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('resolves the CORRECT threshold only under deep resolution (no cross-wire)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const a = '${X}';\nconst b = a;\n` +
        `function inner(t: string) { return loadObservationsForThreshold(t, {}); }\n` +
        `function outer(t: string) { return inner(t); }\n` +
        `await outer(b);`;
      expect(detectThresholdWireWith(X, content, ts)).toBe(true);
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    it('TERMINATES on a wrapper mutual-recursion cycle with no reader call (not wired)', () => {
      // f -> g -> f, neither calls the reader: the fixpoint converges to empty
      // reaches-sets, so no infinite loop and the threshold is NOT wired.
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function f(t: string): unknown { return g(t); }\n` +
        `function g(t: string): unknown { return f(t); }\n` +
        `await f('${T}');`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    it('TERMINATES on a binding reference cycle (const a = b; const b = a) (not wired)', () => {
      // The visited-set in resolveIdentifier breaks the a <-> b cycle; resolution
      // yields no literal -> not wired (and does not hang).
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const a = b;\nconst b = a;\n` +
        `await loadObservationsForThreshold(b, {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    it('a deep wrapper that REACHES the reader but is only called with a param does NOT over-report', () => {
      // `mid` reaches the reader (mid -> inner -> reader), but the outermost call
      // `top(t)` is inside `wrap`, forwarding wrap's PARAM — never a literal. With
      // no literal entering the chain, nothing is wired. Guards against the
      // fixpoint resolving a param against the flat binding map (cf. isParamInScope).
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const t = '${X}';\n` +
        `function inner(t: string) { return loadObservationsForThreshold(t, {}); }\n` +
        `function mid(t: string) { return inner(t); }\n` +
        `function wrap(t: string) { return mid(t); }\n` +
        `void t;`;
      // wrap/mid/inner all reach the reader, but no call site passes a literal.
      expect(detectThresholdWireWith(X, content, ts)).toBe(false);
    });

    it('an alias chain that ends at a PARAMETER is not resolved against the flat const map', () => {
      // Inside `w`, `const c = t` aliases the PARAM t; the module-level `const a`
      // shares no name, so nothing leaks. w is never called with a literal -> the
      // reader call (via c -> param t) resolves to nothing -> not wired.
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function w(t: string) { const c = t; return loadObservationsForThreshold(c, {}); }\n` +
        `void w;`;
      expect(detectThresholdWireWith(X, content, ts)).toBe(false);
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    it('the public (memoized, lazy AST) detectThresholdWire resolves a combined N-hop + N-level wire', () => {
      // The combined case is resolvable ONLY by the lifted AST path; proves the
      // lift is on the live path the verify axis actually uses (not just the seam).
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const a = '${T}';\nconst b = a;\n` +
        `function inner(t: string) { return loadObservationsForThreshold(t, {}); }\n` +
        `function outer(t: string) { return inner(t); }\n` +
        `await outer(b);`;
      expect(detectThresholdWire(T, content)).toBe(true);
    });
  });

  // --- v1.49.956 over-report guards (closing the two adversarial-review findings
  // on the lifted detector). Both shapes are contrived (no real e2e file has
  // them) and the lift's over-report direction is conservative for an advisory
  // gate, but a precision detector should not over-report at all — these pin the
  // guards. The regex fallback is ALSO conservative on these inputs (the reader
  // arg is a bare identifier, not a quoted literal), so AST == regex == false.
  describe('detectThresholdWire (AST) — over-report guards (v1.49.956 review findings)', () => {
    const T = 'observation.retention_days';
    const X = 'token_budget.max_percent';
    const SUB = `import { runFoo } from '../../src/foo/foo-substrate.js';`;

    it('does NOT over-report when a nested callback param shadows the outer wrapper param (finding #1)', () => {
      // `collectFn` must attribute the reader call's `t` to the NESTED arrow's own
      // param, not to `outer`'s same-named param — so `outer` is NOT a wrapper and
      // `outer('${T}')` does not wire. `eachOwnNode` (no descent into nested
      // function bodies) is what makes this hold.
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function outer(t: string) { return [1].map((t) => loadObservationsForThreshold(t, {})); }\n` +
        `await outer('${T}');`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('does NOT over-report a .forEach callback param shadow (common idiom, finding #1)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function f(t: string) { ['a'].forEach((t) => { loadObservationsForThreshold(t, {}); }); }\n` +
        `await f('${T}');`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('does NOT over-report when a function-local const shadows a module const of the same name (finding #2)', () => {
      // The flat binding map cannot distinguish module `const c` from the function
      // -local `const c`; the name is declared twice -> dropped as ambiguous ->
      // the reader call's `c` resolves to nothing -> not wired (the reader is
      // never actually called with the '${X}' literal).
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const c = '${X}';\n` +
        `function w(p: unknown) { const c = '${T}'; return loadObservationsForThreshold(c, {}); }\n` +
        `void w;`;
      expect(detectThresholdWireWith(X, content, ts)).toBe(false);
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
      expect(detectThresholdWireWith(X, content, null)).toBe(false);
    });

    it('does NOT over-report a pure-alias const-name collision across scopes (finding #2)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const lit = '${X}';\nconst c = lit;\n` +
        `function w(p: string) { const c = p; return loadObservationsForThreshold(c, {}); }\n` +
        `void w;`;
      expect(detectThresholdWireWith(X, content, ts)).toBe(false);
      expect(detectThresholdWireWith(X, content, null)).toBe(false);
    });

    it('a name declared ONCE still resolves — the ambiguity drop is not over-broad (boundary)', () => {
      // Single-declaration `a`/`b` resolve (pins that the count>1 drop only fires
      // on genuine redeclaration, not on every binding).
      const once = `${SUB}\n${READER_IMPORT}\nconst a = '${T}';\nconst b = a;\nawait loadObservationsForThreshold(b, {});`;
      expect(detectThresholdWireWith(T, once, ts)).toBe(true);
      // The SAME name `a` redeclared (module + a second decl) -> ambiguous -> dropped.
      const twice =
        `${SUB}\n${READER_IMPORT}\n` +
        `const a = '${T}';\nfunction w(p: unknown) { const a = '${T}'; return loadObservationsForThreshold(a, {}); }\n` +
        `void w;\nawait loadObservationsForThreshold(a, {});`;
      expect(detectThresholdWireWith(T, twice, ts)).toBe(false);
    });
  });

  // --- v1.49.957: return-value dataflow. Closes the bound v1.49.956 documented
  // ("a reader call taking a function's return value is not resolved"). A call to
  // a LOCAL function that returns a string literal now resolves to that literal,
  // both as a direct reader/wrapper argument and through a `const = call()`
  // binding. Each case was a documented false-negative of the v955/v956 detector
  // and of the regex — so the AST verdict (..., ts) is paired with the regex
  // verdict (..., null) to make the lift load-bearing.
  describe('detectThresholdWire (AST) — return-value dataflow (v1.49.957)', () => {
    const T = 'observation.retention_days';
    const X = 'token_budget.max_percent';
    const SUB = `import { runFoo } from '../../src/foo/foo-substrate.js';`;

    it('RESOLVES a reader call taking a literal-returning function (load(getThreshold())) — v956 bound closed', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function getThreshold() { return '${T}'; }\n` +
        `await loadObservationsForThreshold(getThreshold(), {});`;
      // AST: getThreshold()'s single literal return resolves.
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      // Regex: the reader arg is a call expression, not a quoted literal -> missed.
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('RESOLVES an arrow-const that returns a literal (const getT = () => lit)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const getT = () => '${T}';\n` +
        `await loadObservationsForThreshold(getT(), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it("RESOLVES a returned 'x' as const", () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function getT() { return '${T}' as const; }\n` +
        `await loadObservationsForThreshold(getT(), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('RESOLVES a function that returns a function-local const (return-of-binding)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function getT() { const v = '${T}'; return v; }\n` +
        `await loadObservationsForThreshold(getT(), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('RESOLVES a const bound to a call return (const t = getThreshold(); load(t))', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function getThreshold() { return '${T}'; }\n` +
        `const t = getThreshold();\n` +
        `await loadObservationsForThreshold(t, {});`;
      // AST: callBindings(t) -> getThreshold() return -> literal.
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('RESOLVES a wrapper called with a literal-returning function (outer(getThreshold()))', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function getT() { return '${T}'; }\n` +
        `function outer(t: string) { return loadObservationsForThreshold(t, {}); }\n` +
        `await outer(getT());`;
      // Composes return-value resolution with the wrapper fixpoint.
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('FOLLOWS an N-level return chain (a returns b(); b returns lit)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function inner() { return '${T}'; }\n` +
        `function outer() { return inner(); }\n` +
        `await loadObservationsForThreshold(outer(), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('resolves the CORRECT threshold only through a return value (no cross-wire)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function getT() { return '${X}'; }\n` +
        `await loadObservationsForThreshold(getT(), {});`;
      expect(detectThresholdWireWith(X, content, ts)).toBe(true);
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    it('RESOLVES a function that returns one of its PARAMETERS via the call-site arg (v957 bound closed at v959)', () => {
      // `id` returns its param `t`; v1.49.959 resolves it by substituting the
      // matching argument at the call site — `id('${T}')` -> '${T}'. (Was the
      // documented forward bound; full param-return-through coverage lives in the
      // dedicated v959 describe block below.)
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function id(t: string) { return t; }\n` +
        `await loadObservationsForThreshold(id('${T}'), {});`;
      // AST: param-return-through substitutes the call-site arg.
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      // Regex: the reader arg is a call expression, not a quoted literal -> missed.
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('does NOT resolve when return paths DIVERGE to different literals (ambiguous)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function pick(f: boolean) { if (f) { return '${T}'; } return '${X}'; }\n` +
        `await loadObservationsForThreshold(pick(true), {});`;
      // Two distinct literal returns -> ambiguous -> not wired (neither literal).
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
      expect(detectThresholdWireWith(X, content, ts)).toBe(false);
    });

    it('does NOT resolve when a param-return path DIVERGES from a literal return path', () => {
      // `maybe` returns its param `t` on one path and the literal '${T}' on
      // another. v1.49.959 resolves the param path to the call-site arg ('x'),
      // which DIVERGES from '${T}' -> ambiguous -> not wired (the unified
      // divergence guard spans literal AND param-substituted returns).
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function maybe(t: string, f: boolean) { if (f) { return t; } return '${T}'; }\n` +
        `await loadObservationsForThreshold(maybe('x', false), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    it('does NOT over-report a redeclared function name (return-value ambiguity drop)', () => {
      // `getT` is declared twice (module + a nested decl); the flat returnExprs map
      // cannot tell the scopes apart, so the name is dropped as ambiguous and the
      // module-level call resolves to nothing — even though both bodies return the
      // SAME literal (mirrors the v956 binding ambiguity drop).
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function getT() { return '${T}'; }\n` +
        `function w() { function getT() { return '${T}'; } void getT; }\n` +
        `void w;\n` +
        `await loadObservationsForThreshold(getT(), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    it('a function name declared ONCE still resolves — the ambiguity drop is not over-broad (boundary)', () => {
      const once =
        `${SUB}\n${READER_IMPORT}\n` +
        `function getT() { return '${T}'; }\n` +
        `await loadObservationsForThreshold(getT(), {});`;
      expect(detectThresholdWireWith(T, once, ts)).toBe(true);
    });

    it('TERMINATES on a return cycle (a returns b(); b returns a()) (not wired)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function a(): string { return b(); }\n` +
        `function b(): string { return a(); }\n` +
        `await loadObservationsForThreshold(a(), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    it('does NOT follow a METHOD call return (o.m()) — only the local function-name form', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const o = { m: () => '${T}' };\n` +
        `await loadObservationsForThreshold(o.m(), {});`;
      // The callee is a property access, not a bare identifier -> not resolved.
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    it('the public (memoized, lazy AST) detectThresholdWire resolves a return-value wire', () => {
      // Return-value resolution is reachable ONLY by the AST path; proves the lift
      // is on the live path the verify axis uses, not just the test seam.
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function getThreshold() { return '${T}'; }\n` +
        `await loadObservationsForThreshold(getThreshold(), {});`;
      expect(detectThresholdWire(T, content)).toBe(true);
    });
  });

  // --- v1.49.957 over-report guards (closing the two adversarial-review findings
  // on the return-value lift). Both are contrived (no real e2e file has them) and
  // conservative-direction, but a precision detector must not over-report — these
  // pin the fixes. AST == regex == false on these inputs (the reader arg is a call
  // or a bare identifier, never a quoted literal), so both verdicts read false.
  describe('detectThresholdWire (AST) — v957 review-fix over-report guards', () => {
    const T = 'observation.retention_days';
    const X = 'token_budget.max_percent';
    const SUB = `import { runFoo } from '../../src/foo/foo-substrate.js';`;

    // Finding #1 — a DESTRUCTURED parameter is locally bound and must not resolve
    // against a module const that merely shares the inner name (isParamInScope now
    // recurses binding patterns). Each returns its destructured param, whose value
    // is the call site's, not the module const.
    it('does NOT over-report an object-destructured param return ({ t }) (finding #1)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const t = '${X}';\n` +
        `function readOpt({ t }: { t: string }) { return t; }\n` +
        `await loadObservationsForThreshold(readOpt({ t: 'runtime' }), {});`;
      expect(detectThresholdWireWith(X, content, ts)).toBe(false);
      expect(detectThresholdWireWith(X, content, null)).toBe(false);
    });

    it('does NOT over-report a RENAMED destructured param return ({ a: t }) (finding #1)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const t = '${X}';\n` +
        `function readOpt({ a: t }: { a: string }) { return t; }\n` +
        `await loadObservationsForThreshold(readOpt({ a: 'runtime' }), {});`;
      expect(detectThresholdWireWith(X, content, ts)).toBe(false);
    });

    it('does NOT over-report an ARRAY-destructured param return ([t]) (finding #1)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const t = '${X}';\n` +
        `function readOpt([t]: string[]) { return t; }\n` +
        `await loadObservationsForThreshold(readOpt(['runtime']), {});`;
      expect(detectThresholdWireWith(X, content, ts)).toBe(false);
    });

    it('does NOT over-report a NESTED destructured param return ({ a: { t } }) (finding #1)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const t = '${X}';\n` +
        `function readOpt({ a: { t } }: { a: { t: string } }) { return t; }\n` +
        `await loadObservationsForThreshold(readOpt({ a: { t: 'runtime' } }), {});`;
      expect(detectThresholdWireWith(X, content, ts)).toBe(false);
    });

    it('does NOT over-report a destructured param on the DIRECT reader call (latent v956 hole closed)', () => {
      // The reader call inside `w` forwards the destructured param `t`; `w` is
      // never called with a literal. Before the isParamInScope binding-pattern
      // fix, `t` resolved against the module const and over-reported (this was a
      // pre-existing v956 wrapper/direct-path bug the v957 review surfaced).
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const t = '${X}';\n` +
        `function w({ t }: { t: string }) { return loadObservationsForThreshold(t, {}); }\n` +
        `void w;`;
      expect(detectThresholdWireWith(X, content, ts)).toBe(false);
    });

    it('still WIRES a legit identifier-return helper (binding-pattern fix is not over-broad)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function getThreshold() { return '${T}'; }\n` +
        `await loadObservationsForThreshold(getThreshold(), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    // Finding #2 — an implicit `undefined` fall-through or a bare `return;` is a
    // completion path that does NOT return the literal, so the function must not
    // resolve (collectFn now requires an unconditional expression return).
    it('does NOT over-report an implicit-undefined fall-through (if without else/trailing return) (finding #2)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function getT(c: boolean) { if (c) { return '${T}'; } }\n` +
        `await loadObservationsForThreshold(getT(true), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('does NOT over-report a bare `return;` before a literal return (finding #2)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function getT(c: boolean) { if (c) { return; } return '${T}'; }\n` +
        `await loadObservationsForThreshold(getT(false), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    it('does NOT over-report an arrow-BLOCK with an implicit fall-through (finding #2)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const getT = (c: boolean) => { if (c) { return '${T}'; } };\n` +
        `await loadObservationsForThreshold(getT(true), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    it('still WIRES an unconditional multi-statement body (fall-through fix is not over-broad)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function getT() { const v = '${T}'; return v; }\n` +
        `await loadObservationsForThreshold(getT(), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('drops a name declared as BOTH a binding and a function across scopes (merged ambiguity counter)', () => {
      // `getT` is a module-level string const AND a nested function — the shared
      // declaration counter makes the name ambiguous, so neither the value read
      // nor the call resolves.
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const getT = '${X}';\n` +
        `function w() { function getT() { return '${T}'; } void getT; }\n` +
        `void w;\n` +
        `await loadObservationsForThreshold(getT(), {});`;
      // The call form would resolve the nested function's return (T) under
      // separate counters; the shared counter drops returnExprs[getT] (count 2).
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
      expect(detectThresholdWireWith(X, content, ts)).toBe(false);
    });
  });

  // --- v1.49.959 detector lifts: param-return-through (a fn returning one of its
  // OWN params resolves via the call-site argument) + parenthesized-literal/call
  // unwrap. Both are robustness-only (absent from every real e2e file; the live-
  // repo invariant test confirms the verify verdict is byte-identical). Each
  // positive is paired against the regex (which sees neither shape -> false).
  describe('detectThresholdWire (AST) — param-return-through + parenthesized literal (v1.49.959)', () => {
    const T = 'observation.retention_days';
    const X = 'token_budget.max_percent';
    const SUB = `import { runFoo } from '../../src/foo/foo-substrate.js';`;

    // --- param-return-through (BOUND 1) ---
    it('RESOLVES a NON-ZERO param index returned (pick(a, t) => t)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function pick(a: string, t: string) { return t; }\n` +
        `await loadObservationsForThreshold(pick('ignored', '${T}'), {});`;
      // The arg at the RETURNED param's index ('${T}') is substituted, not arg 0.
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('RESOLVES a concise-arrow param identity (const id = (t) => t)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const id = (t: string) => t;\n` +
        `await loadObservationsForThreshold(id('${T}'), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('RESOLVES a param-return whose call-site arg is itself a const (id(lit))', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const lit = '${T}';\n` +
        `function id(t: string) { return t; }\n` +
        `await loadObservationsForThreshold(id(lit), {});`;
      // The substituted arg `lit` resolves through the binding map first.
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('COMPOSES param-return-through into a wrapper (outer(id(lit)))', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function id(t: string) { return t; }\n` +
        `function outer(t: string) { return loadObservationsForThreshold(t, {}); }\n` +
        `await outer(id('${T}'));`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('does NOT over-report a param-return called with a NON-literal arg (guard)', () => {
      // The substituted arg is an unresolvable identifier -> undefined -> not wired.
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function id(t: string) { return t; }\n` +
        `await loadObservationsForThreshold(id(unknownVar), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('drops a param-returning function declared TWICE (ambiguity drop covers returnParams)', () => {
      // Shared declaration counter drops returnParams[id]; mutation guard for the
      // `returnParams.delete(name)` line in the ambiguity loop.
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function id(t: string) { return t; }\n` +
        `function w() { function id(t: string) { return t; } void id; }\n` +
        `void w;\n` +
        `await loadObservationsForThreshold(id('${T}'), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    it('RESOLVES a nested self-call id(id(x)) (v1.49.963 — v959 bound closed)', () => {
      // The argument path in resolveCallReturn now resolves under `seen` minus the
      // current name, so the inner id() is no longer mistaken for the body cycle.
      // Full coverage + termination guards live in the v1.49.963 block below.
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function id(t: string) { return t; }\n` +
        `await loadObservationsForThreshold(id(id('${T}')), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('resolves the CORRECT threshold only through a param-return (no cross-wire)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function id(t: string) { return t; }\n` +
        `await loadObservationsForThreshold(id('${X}'), {});`;
      expect(detectThresholdWireWith(X, content, ts)).toBe(true);
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    it('does NOT over-report a param-return with an implicit-undefined fall-through (storage-gate guard)', () => {
      // `maybe` returns its param `t` only when `c`; the !c path falls through to
      // implicit undefined, so the literal is NOT guaranteed to reach the reader.
      // The returnParams storage gate requires unconditionalExprReturn, so `maybe`
      // is never stored -> not wired. Pins the `&& unconditionalExprReturn`
      // conjunct for the PARAM path (mirrors the v957 finding-#2 guard, which only
      // covered LITERAL returns; this is the asymmetric-unsafe over-report case).
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function maybe(c: boolean, t: string) { if (c) { return t; } }\n` +
        `await loadObservationsForThreshold(maybe(true, '${T}'), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('does NOT over-report a param-return preceded by a bare `return;` (storage-gate guard)', () => {
      // A bare `return;` is an undefined completion path -> unconditionalExprReturn
      // false -> returnParams not stored even though the last statement returns the
      // param. Second pin for the storage-gate conjunct on the param path.
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function maybe(c: boolean, t: string) { if (c) { return; } return t; }\n` +
        `await loadObservationsForThreshold(maybe(false, '${T}'), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    // --- parenthesized literal / call (BOUND 2) ---
    // Branch-coverage note (v959 review): the literalOf paren branch and the
    // resolveExpr paren branch are each UNIQUELY killed by one test — literalOf by
    // 'const t = (lit)' (decl-init reads literalOf directly) and resolveExpr by
    // '(getT())' (a parenthesized CALL literalOf cannot see). The reader-arg paren
    // tests below route through resolveExpr's unwrap, so they are end-to-end
    // confirmations rather than independent literalOf-branch coverage.
    it('RESOLVES a parenthesized literal reader arg (load((lit)))', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `await loadObservationsForThreshold(('${T}'), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('RESOLVES a DOUBLE-parenthesized literal (load(((lit))))', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `await loadObservationsForThreshold((('${T}')), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('RESOLVES a parenthesized as-const literal (load((lit as const)))', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `await loadObservationsForThreshold(('${T}' as const), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('RESOLVES a const bound to a parenthesized literal (const t = (lit); load(t))', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const t = ('${T}');\n` +
        `await loadObservationsForThreshold(t, {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('RESOLVES an arrow returning a parenthesized literal (() => (lit))', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const getT = () => ('${T}');\n` +
        `await loadObservationsForThreshold(getT(), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('RESOLVES a return of a parenthesized literal (return (lit))', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function getT() { return ('${T}'); }\n` +
        `await loadObservationsForThreshold(getT(), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('RESOLVES a parenthesized CALL reader arg (load((getT()))) — resolveExpr unwrap', () => {
      // literalOf cannot see a call; resolveExpr must unwrap the paren to reach
      // resolveCallReturn (dedicated mutation guard for the resolveExpr branch).
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function getT() { return '${T}'; }\n` +
        `await loadObservationsForThreshold((getT()), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('does NOT over-report a parenthesized unresolvable arg (load((unknownVar)))', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `await loadObservationsForThreshold((unknownVar), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    it('the public (memoized, lazy AST) detectThresholdWire resolves a param-return wire', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function id(t: string) { return t; }\n` +
        `await loadObservationsForThreshold(id('${T}'), {});`;
      expect(detectThresholdWire(T, content)).toBe(true);
    });
  });

  // --- v1.49.963 detector lifts: parenthesized-PARAM forwarding (the collect-side
  // analogue of v959's paren unwrap — collectFn now strips grouping parens before
  // its param-forwarding `ts.isIdentifier` checks) + nested-self-call resolution
  // (the argument path in resolveCallReturn resolves under `seen` minus the current
  // name). Both close bounds v1.49.959 documented. Robustness-only: every shape is
  // absent from every real e2e file (the live-repo invariant test confirms the
  // verify verdict is byte-identical), and each positive is paired against the
  // regex (which sees neither shape -> false).
  describe('detectThresholdWire (AST) — parenthesized-param forwarding + nested self-call (v1.49.963)', () => {
    const T = 'observation.retention_days';
    const X = 'token_budget.max_percent';
    const SUB = `import { runFoo } from '../../src/foo/foo-substrate.js';`;

    // --- parenthesized-param forwarding: all FOUR collect sites (v959 only
    // unwrapped on the RESOLUTION side; these are the ATTRIBUTION sites). ---
    it('FOLLOWS a wrapper forwarding a PARENTHESIZED param to the reader (load((t)))', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function readFor(t: string) { return loadObservationsForThreshold((t), {}); }\n` +
        `await readFor('${T}');`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('FOLLOWS a DOUBLE-parenthesized param forward (load(((t)))) — recursion', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function readFor(t: string) { return loadObservationsForThreshold(((t)), {}); }\n` +
        `await readFor('${T}');`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('FOLLOWS a parenthesized param across an inter-fn EDGE (inner((t)))', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function inner(t: string) { return loadObservationsForThreshold(t, {}); }\n` +
        `function outer(t: string) { return inner((t)); }\n` +
        `await outer('${T}');`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('RESOLVES a parenthesized param-RETURN (function id(t){ return (t); })', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function id(t: string) { return (t); }\n` +
        `await loadObservationsForThreshold(id('${T}'), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('RESOLVES a parenthesized concise-arrow param identity ((t) => (t))', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const id = (t: string) => (t);\n` +
        `await loadObservationsForThreshold(id('${T}'), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('does NOT over-report a paren wrapper-param that SHARES a module-const name (scope-accuracy)', () => {
      // `(t)` inside `w` is the PARAMETER, not the module const `t`; isParamInScope
      // must still keep it from resolving against the flat const map after unwrap.
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const t = '${X}';\n` +
        `function w(t: string) { return loadObservationsForThreshold((t), {}); }\n` +
        `void t;\n` +
        `await w('runtime');`;
      expect(detectThresholdWireWith(X, content, ts)).toBe(false);
      expect(detectThresholdWireWith(X, content, null)).toBe(false);
    });

    it('does NOT over-unwrap — a parenthesized CALL arg stays a call, not a forwarded param', () => {
      // `(getX())` unwraps to a CallExpression, NOT an identifier, so it is not
      // mis-attributed as a param-forward; it resolves only via the return-value
      // path (getX returns X, queried as T -> false).
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function getX(): string { return '${X}'; }\n` +
        `function w(t: string) { return loadObservationsForThreshold((getX()), {}); }\n` +
        `await w('${T}');`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    // --- nested self-call resolution + termination guards ---
    it('RESOLVES a nested self-call id(id(lit))', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function id(t: string) { return t; }\n` +
        `await loadObservationsForThreshold(id(id('${T}')), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('RESOLVES a TRIPLE-nested self-call id(id(id(lit)))', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function id(t: string) { return t; }\n` +
        `await loadObservationsForThreshold(id(id(id('${T}'))), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
    });

    it('does NOT over-report a nested self-call with a NON-literal innermost arg', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function id(t: string) { return t; }\n` +
        `await loadObservationsForThreshold(id(id(unknownVar)), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('a nested self-call resolves the queried threshold only (no cross-wire)', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function id(t: string) { return t; }\n` +
        `await loadObservationsForThreshold(id(id('${X}')), {});`;
      expect(detectThresholdWireWith(X, content, ts)).toBe(true);
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    it('TERMINATES + under-reports a genuine self body-cycle (self(){ return self(); })', () => {
      // The BODY-return loop keeps the full `seen`, so a true cycle still bails.
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function self(): any { return self(); }\n` +
        `await loadObservationsForThreshold(self(), {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    it('astWireFacts TERMINATES (no stack overflow) on a cycle re-entering through an ARGUMENT', () => {
      // Load-bearing termination case: a(t){return t} b(){return a(b())}. Resolving
      // a's argument b() removes only 'a' from the guard, so the nested b() still
      // trips the RETAINED 'b' guard and terminates. A FRESH set (instead of
      // `new Set(seen)`) recurses unboundedly -> RangeError; computeWireFacts would
      // MASK that via its regex fallback, so assert on astWireFacts DIRECTLY (the
      // un-wrapped AST path) to pin the `new Set(seen)` choice. The call completes,
      // never throws, and under-reports (b() is unresolvable).
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function a(t: any): any { return t; }\n` +
        `function b(): any { return a(b()); }\n` +
        `await loadObservationsForThreshold(a(b()), {});`;
      // Explicit no-throw makes the fresh-`new Set()` mutant detection visible
      // (the mutant throws RangeError here; the implicit form would also fail).
      expect(() => astWireFacts(content, ts)).not.toThrow();
      const facts = astWireFacts(content, ts);
      expect(facts.callsReaderWith.has(T)).toBe(false);
    });

    // --- parenthesized binding initializers (alias + call-binding sites), the
    // collect-side analogue completing the v1.49.963 paren-unwrap symmetry. ---
    it('RESOLVES a parenthesized ALIAS binding initializer (const a = (b))', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const b = '${T}';\n` +
        `const a = (b);\n` +
        `await loadObservationsForThreshold(a, {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('RESOLVES a parenthesized CALL binding initializer (const a = (getT()))', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function getT() { return '${T}'; }\n` +
        `const a = (getT());\n` +
        `await loadObservationsForThreshold(a, {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(true);
      expect(detectThresholdWireWith(T, content, null)).toBe(false);
    });

    it('does NOT over-report a parenthesized binding initializer to an unresolvable name', () => {
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const a = (unknownVar);\n` +
        `await loadObservationsForThreshold(a, {});`;
      expect(detectThresholdWireWith(T, content, ts)).toBe(false);
    });

    it('the public (memoized, lazy AST) detectThresholdWire resolves a nested self-call', () => {
      // Proves the lift is on the live path the verify axis uses, not just the seam.
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `function id(t: string) { return t; }\n` +
        `await loadObservationsForThreshold(id(id('${T}')), {});`;
      expect(detectThresholdWire(T, content)).toBe(true);
    });

    it('a function-local block shadowing a same-named param never leaks the module const (#1a investigated-benign)', () => {
      // #1(a): a block redeclares the param name `t` (= module const X), but the
      // function still returns the PARAM `t` (the inner const is block-scoped). The
      // param-return resolves to the call-site arg ('T') — CORRECT — and the module
      // const X is NEVER leaked into the wire (param-returns resolve via call-site
      // args, never the flat binding maps). No code changed for #1(a) at v963; this
      // pins that the shape the handoff feared is already conservative.
      const content =
        `${SUB}\n${READER_IMPORT}\n` +
        `const t = '${X}';\n` +
        `function id(t: string) { { const t = '${X}'; void t; } return t; }\n` +
        `void t;\n` +
        `await loadObservationsForThreshold(id('${T}'), {});`;
      expect(detectThresholdWireWith(X, content, ts)).toBe(false); // no leak of the module const
      expect(detectThresholdWireWith(T, content, ts)).toBe(true); // param resolves to the call-site arg
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
