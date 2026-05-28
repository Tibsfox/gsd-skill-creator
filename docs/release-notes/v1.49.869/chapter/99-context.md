# v1.49.869 — Context

## Provenance

Second ship of the operator-directed v868-v882 follow-on campaign. Deterministic-gate half of the v868 codify-then-gate pair: v868 codified the continuous-verification mode (refinement of Lesson #10443); v869 wires the gate in pre-tag-gate.sh.

The cross-audit tool (`tools/security/check-stale-known-unwired.mjs`) was authored at v857, hardened at v867 (regex line-anchor fix), and codified at v868 (operational discipline). This ship completes the productionization by promoting the manual chip-ship workflow ("after `npm run build`, run the tool; if clean, proceed to T14") to a deterministic pre-tag-gate step (step 18/18, BLOCKER by default).

Operator-directed campaign sequence at v868 open: codify → pre-tag-gate integration (this ship) → Process chips ×6 → Egress chips ×6 → verify-overdue scan. Block sequencing (Process all first, then Egress all). Batch size: singletons. Cadence: full autonomous.

## Predecessor

- **v1.49.868** — Codification Ship: Promote #10444 (Size-Ascending Chip-Pick Reveals Wire-Shape Diversity) + Refine #10443 (Continuous-Verification Mode). Doc-only ship; promotes #10444 + refines #10443 with the operational discipline that v869 now operationalizes as a gate.
- **v1.49.867** — EgressContext singleton chip: `src/alternative-discoverer/fork-finder.ts` (Track 3 close + campaign close). Two-site hoisted-check + cross-audit tool regex bug fix (the tool's first real-world bug, fixed in same ship).
- **v1.49.866 and earlier** — see prior release-notes.

## Disciplines this ship updates

- **KNOWN_UNWIRED allowlists as migration-debt ledger** (`docs/known-unwired-ledger-discipline.md`) — operationalizes the v868-codified continuous-verification mode. No manifest entry changes; the discipline doc already names the pre-tag-gate integration as the next step in its "How to apply" subsection (point 3).
- **`tools/pre-tag-gate.sh`** — step 18/18 added between current step 17/17 (PROJECT.md drift check) and the final summary message. Final summary count updated from "all 17 checks PASS" to "all 18 checks PASS".
- **`tests/integration/v1-49-869-meta-test.test.ts`** — NEW. Verifies the gate is wired + summary count updated + step ordering preserved.

## Cross-references to related disciplines

- KNOWN_UNWIRED ledger discipline: Lesson #10443 (parent) + continuous-verification mode (v868 refinement, operationalized this ship).
- Ship pipeline discipline: Lesson #10184 (apply-to-self enforcement), #10185 (CI-gate override rationale), #10197 (T14 step ordering). The new step 18 follows these pre-existing pipeline-discipline patterns (BLOCKER-by-default with documented override env var; documented exit code; documented diagnose command).
- Failure-mode contracts: Lesson #10427 (load-bearing surfaces fail loudly). The new step is load-bearing (ship blocker), so its FAIL path is explicit (exit 20) and its message points operators at the diagnose command.

## Forward path

Next ship: **v1.49.870** — First Process singleton chip (`src/learning/version-manager.ts`, 177 LOC, size-ascending smallest first). Each chip from v870 onward will exercise the new gate as part of its pre-tag-gate run — automatic continuous-verification instead of operator-invoked.

Remaining v868-v882 campaign:
- v1.49.870-875 — Process singleton chips ×6.
- v1.49.876-881 — Egress singleton chips ×6.
- v1.49.882 — Verify-overdue forecast scan tool.
