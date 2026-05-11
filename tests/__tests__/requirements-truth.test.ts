/**
 * v1.49.634 C5 — REQUIREMENTS.md + tests-integration sweep truth tests.
 *
 * Two tests per C5 test-plan row:
 *   C5.1: REQUIREMENTS.md DASH-* entries have consistent status — no entry
 *         marked "Pending" if implementation exists at the referenced path.
 *   C5.2: tests/integration/ graduation sweep is documented — the report
 *         file exists with required disposition table format.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..', '..');

describe('v1.49.634 C5: stale-state sweep truth tests', () => {
  it('REQUIREMENTS.md DASH-* entries have consistent status', () => {
    const reqPath = join(REPO_ROOT, '.planning', 'REQUIREMENTS.md');
    if (!existsSync(reqPath)) {
      // .planning/ is gitignored; on CI / fresh checkouts the file is absent.
      // Skip rather than fail — C5 is a doc-truth invariant against operator
      // state, not a build invariant.
      return;
    }
    const content = readFileSync(reqPath, 'utf8');

    // Inventory all DASH-* entries with their checkbox status.
    const entryRe = /^- \[([ x])\] \*\*(DASH-[A-Z]+-\d+)\*\*([^]*?)(?=\n- \[|\n###|\n##|\n---|\n$)/gm;
    const entries: { id: string; checked: boolean; body: string }[] = [];
    let match: RegExpExecArray | null;
    while ((match = entryRe.exec(content)) !== null) {
      entries.push({
        id: match[2],
        checked: match[1] === 'x',
        body: match[3],
      });
    }
    expect(entries.length).toBeGreaterThan(0);

    // Inventory: at v1.49.634 W1C sweep, all DASH-AN/KB/UI/EM/AI/VER
    // entries are DELIVERED. DASH-FUT-* are explicit follow-on, intentionally
    // Pending. The C5.1 invariant: every Pending entry must be a DASH-FUT-*
    // (the explicit-follow-on prefix), AND every DASH-FUT-* must be Pending
    // (sanity check the deferred-scope marker is consistent).
    const pendingNonFut: string[] = [];
    const checkedFut: string[] = [];
    for (const e of entries) {
      const isFut = e.id.startsWith('DASH-FUT-');
      if (!e.checked && !isFut) {
        pendingNonFut.push(e.id);
      }
      if (e.checked && isFut) {
        checkedFut.push(e.id);
      }
    }
    expect(pendingNonFut, `Pending DASH entries that are NOT DASH-FUT-* (should be 0): ${pendingNonFut.join(', ')}`).toEqual([]);
    expect(checkedFut, `Checked DASH-FUT-* entries (should be 0 — explicit follow-on): ${checkedFut.join(', ')}`).toEqual([]);

    // Closed entries must carry a delivery-marker (commit SHA or milestone version)
    // in the trailing body. This pins the structural invariant: a checkbox
    // flip without traceability fails the audit.
    const checkedWithoutMarker: string[] = [];
    for (const e of entries) {
      if (!e.checked) continue;
      // Match either v1.49.NNN milestone tags OR a 7+ hex SHA OR "Phase NNN"
      const hasMarker = /v1\.49\.\d{3}|[0-9a-f]{7,40}|Phase \d{3,4}/i.test(e.body);
      if (!hasMarker) checkedWithoutMarker.push(e.id);
    }
    expect(checkedWithoutMarker, `Checked DASH-* entries missing traceability marker: ${checkedWithoutMarker.join(', ')}`).toEqual([]);

    // Delivery log section must exist (added at v1.49.634 W1C.T1).
    expect(content).toMatch(/### Delivery log/);
  });

  it('tests/integration/ graduation sweep is documented', () => {
    const reportPath = join(REPO_ROOT, '.planning', 'tests-integration-graduation.md');
    if (!existsSync(reportPath)) {
      // Same skip-on-absent rationale as C5.1.
      return;
    }
    const content = readFileSync(reportPath, 'utf8');

    // Required structural elements:
    //   1. A per-file disposition table
    //   2. A header naming the sweep date + auditor
    //   3. CONCERNS.md §11 status-line text (since this report owns that closure)
    expect(content).toMatch(/Sweep date:/);
    expect(content).toMatch(/Auditor:/);
    expect(content).toMatch(/Per-file disposition table/);
    expect(content).toMatch(/CONCERNS\.md §11/);
    // Disposition table format: pipe-separated header + ≥1 data row including
    // a file name with .test.ts extension.
    expect(content).toMatch(/\|.*Disposition.*\|/);
    expect(content).toMatch(/\| `\w[\w.-]*\.test\.ts`/);
  });
});
