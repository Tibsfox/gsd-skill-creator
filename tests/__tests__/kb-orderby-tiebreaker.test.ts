/**
 * C4 — kb store ORDER-BY tiebreaker invariant (v1.49.639)
 *
 * Asserts that all SQL ORDER-BY clauses in src/intelligence/kb/store.ts
 * either have an explicit tiebreaker column (comma-separated) OR are
 * deterministic via LIMIT 1.
 *
 * Background: v1.49.638 W1C flake audit deferred 3 sites
 * (src/intelligence/kb/store.ts:301/871/916 — line numbers updated
 * for v1.49.639) where ORDER-BY clauses had no tiebreaker. Bare-column
 * ORDER-BY produces non-deterministic row order on ties, which causes
 * test flake on the read paths.
 *
 * v1.49.639 C4 patched all 3 sites:
 *   - line 301: ORDER BY ${orderBy} where orderBy resolves to
 *     'priority ASC, last_activity_at DESC, id ASC' OR
 *     'last_activity_at DESC, id ASC' (both with id tiebreaker)
 *   - line 871: ORDER BY b.emitted_at DESC, b.id DESC
 *   - line 916: ORDER BY recorded_at ASC, id ASC
 *
 * Adjacency-check applied per docs/test-discipline/audit-method-corrections.md
 * §2.2 (ORDER-BY tiebreaker inventory).
 *
 * Skip-guard: file-existence check; if store.ts moves, test skips
 * cleanly rather than false-failing.
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = process.cwd();
const STORE_TS = resolve(REPO_ROOT, 'src/intelligence/kb/store.ts');

// Adjacency-check regex per docs/test-discipline/audit-method-corrections.md §2.2:
// Match the start of an ORDER-BY clause and capture what follows the first
// column. Compliant forms have either a comma (multi-column tiebreaker),
// LIMIT 1 (deterministic single-row), or use a dynamic variable like
// ${orderBy} which we can't statically validate (caller must inspect the
// variable's possible values).
const ORDERBY_LINE_RE = /ORDER BY\s+([^\n`)]+?)(?:`|$|\))/g;

interface OrderByOccurrence {
  lineNumber: number;
  fullMatch: string;
  clauseBody: string; // text after "ORDER BY "
}

function findOrderByClauses(source: string): OrderByOccurrence[] {
  const lines = source.split('\n');
  const out: OrderByOccurrence[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;
    const re = new RegExp(ORDERBY_LINE_RE.source, 'g');
    while ((m = re.exec(line)) !== null) {
      out.push({
        lineNumber: i + 1,
        fullMatch: m[0],
        clauseBody: m[1].trim(),
      });
    }
  }
  return out;
}

function isCompliant(clauseBody: string): boolean {
  // 1. Dynamic variable form: ${orderBy} — caller must inspect; treat as
  //    compliant if the variable name is well-known (orderBy, order_by,
  //    sortColumn). Don't false-fail on dynamic forms.
  if (/^\$\{[a-zA-Z_][a-zA-Z0-9_]*\}$/.test(clauseBody)) {
    return true;
  }

  // 2. Comma-separated multi-column form (tiebreaker present)
  if (/,/.test(clauseBody)) {
    return true;
  }

  // 3. LIMIT 1 (deterministic single-row result)
  if (/\bLIMIT\s+1\b/.test(clauseBody)) {
    return true;
  }

  // Otherwise: bare single-column ORDER-BY — non-deterministic on ties
  return false;
}

describe('C4 — kb store ORDER-BY tiebreaker invariant', () => {
  it.runIf(existsSync(STORE_TS))(
    'all ORDER-BY clauses in src/intelligence/kb/store.ts have tiebreaker or LIMIT 1',
    () => {
      const source = readFileSync(STORE_TS, 'utf-8');
      const occurrences = findOrderByClauses(source);

      expect(
        occurrences.length,
        'expected ORDER-BY clauses to exist (file may have moved)',
      ).toBeGreaterThan(0);

      const violations = occurrences.filter(
        (o) => !isCompliant(o.clauseBody),
      );

      const violationReport = violations
        .map(
          (v) =>
            `  line ${v.lineNumber}: ORDER BY ${v.clauseBody} (no tiebreaker, no LIMIT 1, no dynamic-var)`,
        )
        .join('\n');

      expect(
        violations.length,
        violations.length > 0
          ? `${violations.length} violation(s):\n${violationReport}\n\n` +
              `Per docs/test-discipline/audit-method-corrections.md §2.2, ORDER-BY ` +
              `clauses must have either a comma-tiebreaker, LIMIT 1, or be a ` +
              `dynamic variable.`
          : '',
      ).toBe(0);
    },
  );

  it.runIf(existsSync(STORE_TS))(
    'all 7 expected ORDER-BY sites still present (regression guard)',
    () => {
      const source = readFileSync(STORE_TS, 'utf-8');
      const occurrences = findOrderByClauses(source);
      // v1.49.639 baseline: 7 ORDER-BY clauses in store.ts.
      // If a future cluster adds more, that's fine — bump expectation.
      // If count drops, investigate (refactor may have moved queries).
      expect(occurrences.length, 'baseline ORDER-BY count from v1.49.639 C4').toBeGreaterThanOrEqual(7);
    },
  );
});
