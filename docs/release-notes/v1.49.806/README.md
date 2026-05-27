> Following v1.49.805 — _Codification Ship S3 + S4 + S7_, v1.49.806 closes S6: extends the v782 LoaderContext chokepoint pattern (#10414) to two more high-risk surfaces — network egress and child-process spawn — and codifies the cross-surface discipline.

# v1.49.806 — S6 Chokepoint Extension: EgressContext + ProcessContext

**Shipped:** 2026-05-27

Closes the last open codify-class lever from the 2026-05-26 core-functions audit retrospective. Extends the Tier-E security chokepoint pattern from the v782 LoaderContext to two new sibling surfaces, with audit-test enforcement and 1 representative wired consumer per surface.

## What shipped

- **NEW** `src/security/egress-context.ts` — `EgressContext` chokepoint type (URL allow-list, audit sink, `EgressContextDenied` error, `ensureEgressAllowed()` helper).
- **NEW** `src/security/process-context.ts` — `ProcessContext` chokepoint type (command allow-list, argv-aware audit sink, `ProcessContextDenied` error, `ensureProcessAllowed()` helper).
- **NEW** `src/security/egress-context.test.ts` — 20 unit tests.
- **NEW** `src/security/process-context.test.ts` — 21 unit tests.
- **NEW** `src/security/egress-context-audit.test.ts` — vitest enforcement harness mirroring v782's loader-context-audit pattern. Greps src/ for `fetch(` and enforces chokepoint shape or grandfathered allowlist entry. Catches future unwired callers at CI time.
- **NEW** `src/security/process-context-audit.test.ts` — vitest enforcement harness greps src/ for `node:child_process` imports (static, lazy `require()`, dynamic `await import()`).
- **NEW** `docs/security-chokepoints.md` — cross-surface catalog of all three chokepoints (loader / egress / process); migration policy; anti-patterns; reference counts.
- **MODIFIED** `src/security/index.ts` — exports both new contexts.
- **MODIFIED** `src/security/loader-context.ts` — docstring forward-reference fixed (pointed at the missing `tools/security/audit-loader-context.mjs`; now correctly cites `src/security/loader-context-audit.test.ts`). Closes Lesson #10415 escalated wedge from v782 (~24 ships ago).
- **WIRED** `src/dependency-auditor/osv-client.ts` — first EgressContext consumer.
- **WIRED** `src/dependency-auditor/dry-run-gate.ts` — first ProcessContext consumer.
- **MODIFIED** `tools/render-claude-md/disciplines.json` — +1 entry (Security chokepoints).
- **REGENERATED** `CLAUDE.md` — Operative Disciplines section now shows 20 entries (was 19).

## Test impact

| Surface              | Tests | Notes |
|----------------------|-------|-------|
| Egress unit tests    | +20   | URL pattern, sink, ensure helper, error propagation |
| Process unit tests   | +21   | Command pattern, argv-aware records, sink, error propagation |
| Egress audit harness | +~2047 | One it.each test per src/.ts file; enforces chokepoint or allowlist |
| Process audit harness | +~2046 | Same shape for child_process imports |
| **Total added**      | **+4,134** | 31,038 → 35,172 in the full suite |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 23 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 5.

Manifest entries: 19 → **20** (+1: Security chokepoints).
Manifest lessons cross-referenced: 71 → **74** (+3: #10414 + #10426 + #10427 now cross-referenced under the new domain; no new lesson IDs promoted this ship).

## Lever closure

Closes the last of the 2026-05-26 audit retrospective levers that are codify-class. After this ship:

| Lever | Status |
|---|---|
| S1 (calibration ledger) | Promoted at v790 (#10417) |
| S2 (adoption telemetry) | Tooling-class; pending |
| S3 (meta-cadence) | Promoted at v805 (#10428) |
| S4 (substrate opt-in paths) | Promoted at v805 (#10429) |
| S5 (PROJECT.md normalizer) | Tooling-class; pending |
| **S6 (chokepoint extension)** | **Closed this ship (this README)** |
| S7 (finer counter-cadence) | Promoted at v805 (#10430) |

Open codify-class levers from this audit: 0. Open tooling-class levers: S2 + S5.

## Forward path

- **NASA 1.179 forward-cadence** — INTERSTELLAR-BOUNDARY axis obs#3. Engine state has been at NASA 1.178 for 23 consecutive ships.
- **KNOWN_UNWIRED migration** — 16 egress callers + 38 process callers grandfathered at v806. Operators chip these down one file per ship as opportunities arise.
- **S2 + S5 tooling-class levers** — adoption telemetry weekly report; PROJECT.md normalizer. Each is its own ship.

---
**Prev:** [v1.49.805](../v1.49.805/00-summary.md)
