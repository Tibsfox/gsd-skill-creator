/**
 * SC_PRE_TAG_GATE_BYPASS vocabulary — parity + drift-guard
 * (counter-cadence #29, milestone v1.49.962).
 *
 * The pre-tag-gate honors a set of bypass tokens at RUNTIME via `gate_bypassed
 * "<token>"` calls in tools/pre-tag-gate.sh. That honored set is the GROUND
 * TRUTH — it is the actual behaviour. The same vocabulary is DOCUMENTED in two
 * operator-facing surfaces that had drifted from reality (the v961 review NIT):
 *
 *   1. tools/render-claude-md/env-vars.json — the SC_PRE_TAG_GATE_BYPASS row
 *      that renders into CLAUDE.md (the operator's reference table).
 *   2. tools/pre-tag-gate.sh's runtime "(step names: a|b|c)" help log — printed
 *      when an operator sets a bypass, so they can see the accepted tokens.
 *
 * Pre-v962 drift (TWO-WAY): the docs ADVERTISED five tokens the gate never
 * honored — build, version-sequence, vitest, completeness, www-bundles (the
 * irreducible core steps, run unconditionally with no `gate_bypassed` wrapper) —
 * and OMITTED two tokens the gate DOES honor — card-template-length, integration.
 * v962 reconciled the docs to the gate's actual honored set and this guard pins
 * the parity so the three surfaces can never silently diverge again.
 *
 * This is the #10461 "gate-enforce-every-runnable-surface + drift-guard pairing"
 * applied to the vocab surface (the Layer-2 named in the post-v961 handoff):
 *   - Layer 1 (enforcement): this file is tests/integration/*.test.ts (NOT
 *     *.integration.test.ts), so the `root` vitest project runs it on every bare
 *     `npx vitest run` — pre-tag-gate step 2 + CI's test job — every ship.
 *   - Layer 2 (drift-guard): the assertions below pin the documented vocab to the
 *     gate's runtime-honored set. Adding/removing a `gate_bypassed` token without
 *     updating both doc surfaces (or vice versa) fails here.
 *
 * Design note (reconciliation direction): the docs were corrected to match the
 * gate, NOT the reverse. Wiring build/vitest/completeness/version-sequence/
 * www-bundles into the SC_PRE_TAG_GATE_BYPASS CSV would be a safety regression —
 * those are the core build, full test suite, release-notes completeness,
 * version-sequence sanity, and www-bundle freshness steps. They are intentionally
 * NOT CSV-bypassable (build/vitest/completeness/www-bundles run unconditionally;
 * version-sequence keeps its own dedicated SC_SKIP_VERSION_SEQUENCE_CHECK). Wiring
 * one into the CSV later is a DELIBERATE act that must also update the BOUNDARY pins
 * below (the same discipline ci-matrix-parity.test.ts applies to the macOS flip).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const GATE_PATH = join(REPO_ROOT, 'tools/pre-tag-gate.sh');
const ENV_VARS_PATH = join(REPO_ROOT, 'tools/render-claude-md/env-vars.json');

const gate = readFileSync(GATE_PATH, 'utf8');

// ---- GROUND TRUTH: the gate's runtime-honored `gate_bypassed "<token>"` set ----
// Filter out comment lines (first non-whitespace char is `#`) so the header-comment
// token lists — and any future comment that quotes the pattern — cannot inflate the
// honored set. The function DEFINITION (`gate_bypassed() {`) has no quoted arg, so it
// never matches. (#10450: a structural parser must ignore comment-shape variants.)
function extractGateHonored(src: string): Set<string> {
  const honored = new Set<string>();
  for (const line of src.split('\n')) {
    if (line.trimStart().startsWith('#')) continue;
    // Capture ANY quoted literal (not just [a-z0-9-]). The runtime gate_bypassed
    // (pre-tag-gate.sh) compares the token verbatim with NO charset restriction, so a
    // restricted regex here would SILENTLY drop a future underscore/uppercase token from
    // `honored` — it would be honored at runtime yet invisible to parity, defeating the
    // guard. The CONVENTION test below then flags any out-of-convention token LOUDLY.
    // The `gate_bypassed() {` definition never matches (its arg is `$1`, not a "literal").
    for (const m of line.matchAll(/gate_bypassed "([^"]+)"/g)) {
      honored.add(m[1]);
    }
  }
  return honored;
}

// ---- DOCUMENTED surface 1: env-vars.json SC_PRE_TAG_GATE_BYPASS vocabulary ----
function extractEnvVarsVocab(): Set<string> {
  const rows = JSON.parse(readFileSync(ENV_VARS_PATH, 'utf8')) as Array<{
    name: string;
    override_behavior: string;
  }>;
  const row = rows.find((r) => r.name === 'SC_PRE_TAG_GATE_BYPASS');
  if (!row) throw new Error('SC_PRE_TAG_GATE_BYPASS row missing from env-vars.json');
  // The vocab is the comma-list after "vocabulary:". Capture greedily to the FINAL
  // ')' at end-of-string (not the first ')'), so an inner parenthetical anywhere in
  // the prose is captured rather than silently truncating the parse. Contract: the
  // vocab must be a flat comma-separated token list; a paren INSIDE it yields a
  // malformed token that fails parity LOUDLY (the size floor also catches truncation).
  // Prose before "vocabulary:" (incl. the named non-CSV-bypassable core steps) is
  // deliberately excluded.
  const m = row.override_behavior.match(/vocabulary:\s*(.+)\)\s*$/);
  if (!m) throw new Error('vocabulary list not found in SC_PRE_TAG_GATE_BYPASS row');
  return new Set(m[1].split(',').map((s) => s.trim()).filter(Boolean));
}

// ---- DOCUMENTED surface 2: the runtime "(step names: a|b|c)" help log ----
function extractHelpLogVocab(src: string): Set<string> {
  const m = src.match(/\(step names: ([^)]+)\)/);
  if (!m) throw new Error('runtime "(step names: ...)" help log not found in pre-tag-gate.sh');
  return new Set(m[1].split('|').map((s) => s.trim()).filter(Boolean));
}

const sorted = (s: Set<string>): string[] => [...s].sort();

const honored = extractGateHonored(gate);
const envVocab = extractEnvVarsVocab();
const helpVocab = extractHelpLogVocab(gate);

// The five core steps intentionally NOT honored by the SC_PRE_TAG_GATE_BYPASS CSV.
// build/vitest/completeness/www-bundles run unconditionally (no skip at all);
// version-sequence has its OWN dedicated SC_SKIP_VERSION_SEQUENCE_CHECK env var but is
// deliberately NOT wired into the CSV. The property pinned below is "absent from the CSV
// vocab + not a gate_bypassed token" — i.e. `SC_PRE_TAG_GATE_BYPASS=<token>` is a no-op
// for each. Wiring one into the CSV is a deliberate act that updates this list.
const NON_BYPASSABLE_CORE = ['build', 'version-sequence', 'vitest', 'completeness', 'www-bundles'];
// The token v962 added to the docs (the gate already honored it). `integration`
// was reconciled here too, but retired 2026-07-12 with the redundant step 2.8.
const V962_RECONCILED_IN = ['card-template-length'];

describe('SC_PRE_TAG_GATE_BYPASS vocabulary — parity + drift-guard (cc#29)', () => {
  it('ANTI-VACUOUS — all three parsers found a substantial, structurally-correct set', () => {
    // Guards against a silent parser break (renamed helper, regex rot, or an
    // env-vars/help-log truncation) producing an empty/tiny set that would make the
    // parity assertions vacuously true. The floor is deliberately LOOSE (well below the
    // live count of 21) so legitimately retiring a few bypass tokens does not trip it —
    // its only job is to catch a break-to-empty. Parity-equality + the named anchors
    // carry the real correctness weight.
    expect(honored.size).toBeGreaterThanOrEqual(15);
    expect(envVocab.size).toBeGreaterThanOrEqual(15);
    expect(helpVocab.size).toBeGreaterThanOrEqual(15);
    for (const anchor of [
      'ci-gate',
      'state-backups',
      'card-template-length',
      'stale-known-unwired',
    ]) {
      expect(honored.has(anchor)).toBe(true);
    }
  });

  it('CONVENTION — every gate-honored token is lowercase-dash (keeps the wide parser sound)', () => {
    // The honored parser captures ANY quoted literal; this pins the naming convention
    // separately and LOUDLY, so a future underscore/uppercase token is caught here (and
    // via parity) instead of being silently dropped by a charset-restricted parser.
    for (const tok of honored) {
      expect(tok).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('PARITY — env-vars.json vocabulary equals the gate-honored set', () => {
    expect(sorted(envVocab)).toEqual(sorted(honored));
  });

  it('PARITY — the runtime help-log vocabulary equals the gate-honored set', () => {
    expect(sorted(helpVocab)).toEqual(sorted(honored));
  });

  it('PARITY — both documented surfaces agree with each other', () => {
    expect(sorted(envVocab)).toEqual(sorted(helpVocab));
  });

  it('BOUNDARY — the five core steps are absent from the bypass CSV on every surface', () => {
    for (const core of NON_BYPASSABLE_CORE) {
      expect(honored.has(core)).toBe(false); // gate does not honor it via the CSV
      expect(envVocab.has(core)).toBe(false); // docs no longer advertise it
      expect(helpVocab.has(core)).toBe(false);
    }
  });

  it('BOUNDARY — the v962-reconciled tokens are present on every surface', () => {
    for (const tok of V962_RECONCILED_IN) {
      expect(honored.has(tok)).toBe(true);
      expect(envVocab.has(tok)).toBe(true);
      expect(helpVocab.has(tok)).toBe(true);
    }
  });
});
