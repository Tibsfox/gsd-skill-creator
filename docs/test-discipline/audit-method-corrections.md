# Audit Method Corrections — Multi-Form Concept Inventory

**Created:** 2026-05-12
**Component:** v1.49.639 C2 — Substrate-Probe Discipline v2 (CF-4 close)
**Companion to:** `docs/SUBSTRATE-PROBE-DISCIPLINE.md` §2.4 (grep adjacency check requirement)
**Source incident:** v1.49.638 W1C flake audit `docs/test-discipline/flake-audit-2026-05-11.md` produced **33% false-positive rate** (2 of 6 flagged files) when single-form grep was used to audit for canonical-form compliance.

---

## 1. Purpose

This document inventories concepts that have multiple syntactic forms in the codebase. Each entry includes:
- Primary form (the form most audits look for)
- Alternate forms (syntactic variants the grep may miss)
- Recommended adjacency-check regex (combines all forms)
- False-positive examples (real cases where single-form grep misclassified)

When authoring a discipline-check or audit-tool, look up the concept here first. If the concept isn't catalogued, add it before shipping the audit (so future runs avoid the same false-positive class).

## 2. Concept inventory

### 2.1 hookTimeout (Vitest)

Vitest accepts test/hook timeout as either a numeric tail-arg or an object option. Both are valid; both produce identical runtime behavior.

| Form | Example | Notes |
|---|---|---|
| inline numeric | `}, 4000);` | Numeric tail-arg passed as positional `timeout` parameter |
| object form (canonical) | `}, { timeout: 4000 });` | Explicit option object; preferred for readability |
| inline + retry | `}, 4000, 2);` | Numeric timeout + numeric retry count |
| object + multiple opts | `}, { timeout: 4000, retry: 2 });` | Multi-option form |

**Adjacency-check regex:** `}, (\d+(\s*,\s*\d+)?\)|{ timeout:|{[^}]*timeout:)`

**Audit usage:** when auditing for `}, { timeout:` presence as the canonical form, ALSO accept inline numeric forms `}, \d+\);` and `}, \d+, \d+\);` as compliant. False-positive risk: audit grep for `{ timeout:` alone misses tests already using inline numeric form.

**False-positive example (v1.49.638 W1C):** test files flagged for "missing hookTimeout canonical form" actually had the inline numeric form `}, 4000);` — fix was to canonicalize, NOT add a missing timeout.

### 2.2 ORDER-BY tiebreaker

SQL `ORDER BY` clauses without tiebreaker columns produce non-deterministic row order when ties exist. Discipline requires tiebreaker (typically primary key or rowid).

| Form | Example | Tiebreaker present? |
|---|---|---|
| single column (bare) | `ORDER BY x` | NO |
| single column + direction | `ORDER BY x DESC` | NO |
| with tiebreaker | `ORDER BY x, id DESC` | YES |
| with tiebreaker (alt direction) | `ORDER BY x DESC, id ASC` | YES |
| three columns | `ORDER BY a DESC, b ASC, id ASC` | YES |
| LIMIT 1 (deterministic) | `ORDER BY x DESC LIMIT 1` | N/A — single-row result is deterministic |
| dynamic variable | `ORDER BY ${orderBy}` | DEPENDS — must inspect what `${orderBy}` resolves to |

**Adjacency-check regex:** `ORDER BY [^,\n]+(\s+(ASC|DESC))?(,|\s+LIMIT\s+1)`

**Audit usage:** when auditing for tiebreaker presence:
- Accept `ORDER BY ... , <col>` (comma-separated multi-column form)
- Accept `ORDER BY ... LIMIT 1` (single-row deterministic)
- Flag `ORDER BY <col>` alone (no comma, no LIMIT 1) as needing tiebreaker
- For dynamic forms (`${var}`), inspect the variable's possible values

**False-positive example (v1.49.638 W1C):** sites at `src/intelligence/kb/store.ts:362/563/948` flagged for "missing tiebreaker" actually had `ORDER BY ... DESC, rowid DESC` form. Audit grep matched `ORDER BY` but didn't check for the comma-tiebreaker.

### 2.3 perf-assertion threshold

Performance test assertions use `toBeLessThan` with a numeric or computed threshold. The threshold can be absolute, relative, or relative+additive.

| Form | Example | Notes |
|---|---|---|
| absolute | `expect(t).toBeLessThan(100)` | Plain numeric threshold |
| relative | `expect(t).toBeLessThan(3 * baseline)` | Multiplier of a baseline |
| relative + additive | `expect(t).toBeLessThan(3 * baseline + 5)` | Multiplier + additive constant (Lesson #10181 pattern) |
| relative + multi-additive | `expect(t).toBeLessThan(3 * baseline + 5 + warmupOverhead)` | Multiple additive constants |
| relative range | `expect(t).toBeWithin(0, 3 * baseline)` | Alternative API (less common) |

**Adjacency-check regex:** `toBeLessThan\(\s*(\d+(\.\d+)?|\d+(\.\d+)?\s*\*\s*\w+(\s*[+\-]\s*\d+(\.\d+)?)*)\s*\)`

**Audit usage:** Lesson #10181 surfaced that the additive form `3 * baseline + 5` was missed by initial regex `\* \d+\)` (stopped at the multiplier). Broaden to include `+`/`-` constants after multiplier.

**False-positive example (v1.49.636 ship-time stabilization):** site `src/plane/activation.integration.test.ts` `expect(geoAvg).toBeLessThan(3 * baselineAvg + 5)` not caught by relative-ratio regex (additive constant `+5` after multiplier). Surfaced as audit-tool coverage gap.

### 2.4 skip-guard env-var

Skip-guards conditionally skip tests based on environment-variable presence/value. The condition can be positive (skip if set) or negative (skip if unset).

| Form | Example | Semantics |
|---|---|---|
| positive (skip if set) | `if (process.env.SC_SKIP_X)` | Test skipped when `SC_SKIP_X` is set to any truthy value |
| negative (skip if unset) | `if (!process.env.X_AVAILABLE)` | Test skipped when `X_AVAILABLE` is unset/empty |
| compound positive | `if (process.env.SC_SKIP_X || process.env.SC_SKIP_ALL)` | Multiple positive triggers |
| compound negative | `if (!process.env.A \|\| process.env.B === '0')` | Negative + value-check |
| `it.skipIf` (Vitest) | `it.skipIf(!process.env.X_AVAILABLE)('...', ...)` | Built-in conditional skip |
| `it.runIf` (Vitest) | `it.runIf(existsSync(path))('...', ...)` | Inverse: run only if condition met |

**Adjacency-check regex:** `(if\s*\([!\s]*process\.env\.\w+|it\.(skipIf|runIf)\(|describe\.(skipIf|runIf)\()`

**Audit usage:** when auditing for skip-guard presence on environment-dependent tests, accept BOTH positive (`SC_SKIP_*`) and negative (`*_AVAILABLE` or similar) forms, plus Vitest `skipIf`/`runIf` API. False-positive risk: audit grep for `SC_SKIP_` alone misses tests using `runIf` for the same logical purpose.

**False-positive example (v1.49.635 Meta-Lesson #10180 generalization):** tests using `it.runIf(existsSync(...))` pattern flagged as missing skip-guard. The pattern IS a skip-guard via inverse condition; audit needs to accept `it.runIf` as canonical equivalent.

## 3. Adjacency-check pipeline

When authoring a discipline check or audit-tool that uses grep:

1. **Identify the concept** being audited (e.g., "tiebreaker presence on ORDER-BY clauses")
2. **Look up the concept** in this inventory
3. **If not catalogued**, run the audit conservatively (high false-positive tolerance) AND add the concept to this inventory before merging
4. **If catalogued**, use the `Adjacency-check regex` to combine all known forms in the negation grep
5. **Document the adjacency-check** in the audit-tool source as a comment, e.g.:

```js
// Adjacency-check per docs/test-discipline/audit-method-corrections.md §2.2:
// accept "ORDER BY ... , <col>" (multi-column) AND "ORDER BY ... LIMIT 1" (single-row)
const ORDERBY_VIOLATION_RE = /ORDER BY [^,\n]+(\s+(ASC|DESC))?(?!,)(?!\s+LIMIT\s+1)/;
```

This makes the audit's coverage measurable + auditable.

## 4. Maintenance

When a future audit produces false positives:
1. Identify the alternate syntactic form that was missed
2. Add to the relevant section above (or create a new section if a new concept)
3. Update the `Adjacency-check regex` to cover the new form
4. Cite the source incident (cluster + audit doc reference)

When a NEW concept emerges in the codebase that needs auditing:
1. Add a new §2.X section
2. Enumerate primary + alternate forms
3. Author adjacency-check regex
4. Reference any source-incident that motivated the audit

## 5. Cross-references

- **Source discipline:** `docs/SUBSTRATE-PROBE-DISCIPLINE.md` §2.4 (grep adjacency check requirement)
- **Source incident:** `docs/test-discipline/flake-audit-2026-05-11.md` (33% false-positive rate observation, v1.49.638 W1C)
- **Related lesson (additive constants):** v1.49.636 Lesson #10181 (perf-assertion-audit regex coverage gap)
- **Related Meta-Lesson:** v1.49.635 Meta-Lesson #10180 (audit underestimates fixture scope) — generalizes to "audit underestimates form coverage"
- **Sibling discipline doc:** `.planning/test-discipline/perf-assertion-warmup.md` (perf-test cold-start failure pattern)

## Lesson coverage (codified v1.49.654 C08+C09)

Appended for discipline-coverage audit completeness. Each lesson is
documented in its first-emit retrospective at
`docs/release-notes/<version>/chapter/04-lessons.md`.

- **Lesson #10173** — hook self-tests must use `env -i` for full
  sterility (not just `env -u VAR`)
- **Lesson #10175** — plain-bullet lesson format is a valid and
  recognized entry form (alongside the `**Lesson #NNNN —**` heading
  variant); lesson-discovery tooling must accept both
- **Lesson #10182** — per-site tier-up classification audit-regex
  pattern; audit-regex negative-tests verify the pattern catches
  drift across all targeted sites
