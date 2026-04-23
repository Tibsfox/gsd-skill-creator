// Unit tests for extractPhasesPlans — the regex suite that parses
// "**Phases:** ..." and "**Plans:** ..." lines from release READMEs.
//
// Historical bug: a bare phase NUMBER like "**Phases:** 684" was recorded
// as if it were a COUNT of 684 phases. The fix caps the single-integer
// fallback at <100 and prefers "(N phases)" parenthesized counts and
// ranges like "684–700".

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'ingest.mjs'), 'utf8');

// Extract the extractPhasesPlans function body via eval — the function is
// pure and has no imports, so this is safe.
const match = /function extractPhasesPlans\(text\) \{([\s\S]*?)\n\}/m.exec(src);
if (!match) throw new Error('could not find extractPhasesPlans in ingest.mjs');
// eslint-disable-next-line no-new-func
const extractPhasesPlans = new Function('text', match[1] + '\n');

test('v1.49.568 paren-count "(5 phases, 4 waves)" → 5', () => {
  const r = extractPhasesPlans('**Phases:** 679 → 683 (5 phases, 4 waves).');
  assert.equal(r?.phases, 5);
});

test('v1.49.569 paren-count "(18 phases, two execution halves)" → 18', () => {
  const r = extractPhasesPlans('**Phases:** 684, 684.1, 685–700 (18 phases, two execution halves).');
  assert.equal(r?.phases, 18);
});

test('bare range en-dash "636–660" → 25', () => {
  const r = extractPhasesPlans('**Phases:** 636–660');
  assert.equal(r?.phases, 25);
});

test('bare range hyphen "1-5" → 5', () => {
  const r = extractPhasesPlans('**Phases:** 1-5');
  assert.equal(r?.phases, 5);
});

test('arrow-range "679 → 683" → 5 (no paren count)', () => {
  const r = extractPhasesPlans('**Phases:** 679 → 683');
  assert.equal(r?.phases, 5);
});

test('comma-list "684, 684.1, 685–700" without paren count → 18', () => {
  const r = extractPhasesPlans('**Phases:** 684, 684.1, 685–700');
  assert.equal(r?.phases, 18);
});

test('small bare count "5" → 5 (under cap-99)', () => {
  const r = extractPhasesPlans('**Phases:** 5');
  assert.equal(r?.phases, 5);
});

test('bare phase NUMBER "684" → null (over cap-99, ambiguous)', () => {
  const r = extractPhasesPlans('**Phases:** 684');
  // Either null or no phases key — caller uses `?.phases ?? "—"` to render dash.
  assert.equal(r?.phases ?? null, null);
});

test('bare number "99" accepted (boundary)', () => {
  const r = extractPhasesPlans('**Phases:** 99');
  assert.equal(r?.phases, 99);
});

test('bare number "100" rejected (at cap)', () => {
  const r = extractPhasesPlans('**Phases:** 100');
  assert.equal(r?.phases ?? null, null);
});

test('Plans extraction works on normal counts', () => {
  const r = extractPhasesPlans('**Phases:** 1-5\n**Plans:** 12');
  assert.equal(r?.plans, 12);
});

test('returns null when neither pattern matches', () => {
  const r = extractPhasesPlans('no phase or plan info here');
  assert.equal(r, null);
});

test('paren-count tolerates trailing content inside parens', () => {
  // Historical failure mode: regex required `phases?\)` with no trailing
  // content, so "(5 phases, 4 waves)" fell through to strategy 2/4.
  const r = extractPhasesPlans('**Phases:** 1-5 (5 phases, 4 waves, 2 sessions).');
  assert.equal(r?.phases, 5);
});
