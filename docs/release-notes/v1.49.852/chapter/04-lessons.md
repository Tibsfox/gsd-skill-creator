# v1.49.852 — Lessons

## Codification-ready observations

### Stale-entry detection inverse-audit tool

**Instances: 2 (v834 + v852)**

**Observation:** The ProcessContext audit-test's runtime check is unidirectional — it catches new child-process callers without wires, but does NOT catch stale KNOWN_UNWIRED entries. Two variants of stale-entry have now surfaced:

| Variant | Source | Shape |
|---|---|---|
| (a) wired-but-still-in-allowlist | v1.49.834 | `intelligence/analyzer/git.ts` already called `ensureProcessAllowed` since v1.49.806 but stayed in KNOWN_UNWIRED |
| (b) imports-without-using | v1.49.852 | `scan-arxiv/bridge.ts` imported `execFileSync` but never called it |

The forward-observation at v1.49.806 explicitly flagged audit-unidirectionality. The v834 commit closed shape (a) one-shot; v852 confirms shape (b) is also reachable. The 2-instance threshold per #10426 is now met.

**Promotion target:** Refinement of #10432 KNOWN_UNWIRED ratchet-ledger discipline. Codify in `docs/known-unwired-ledger-discipline.md` as a new section "## Inverse-audit: stale-entry detection."

**Tool sketch:** `tools/security/check-stale-known-unwired.mjs` — scans KNOWN_UNWIRED list per audit-test file; for each entry:
- Check (a): grep for `ensureProcessAllowed(` in entry's source → flag if found
- Check (b): grep for `node:child_process|child_process` import pattern → flag if absent
Emit JSONL report; could plug into pre-tag-gate as a new step (BLOCK or INFO depending on cadence stage).

**Why below current threshold for THIS ship:** Campaign focus is chip-execution, not codification. Not codifying in v852 itself; explicit forward-flag for the next codify ship (likely v853-v860 per #10428 codify cadence).

**Classification cross-reference:** Sub-pattern of #10421 (metric-emitting tools commit baseline files) AND refinement of #10432 (KNOWN_UNWIRED as migration-debt ledger). Both parent disciplines apply; the tool itself emits a metric (stale-entry count) AND the inverse check completes the KNOWN_UNWIRED ledger's bidirectional enforcement.

## No promotions this ship

This ship is chip-execution scope, not codification scope.

## Carried-forward observations UNCHANGED

The other 12+ 1-instance observations from v836-v851 unchanged.
