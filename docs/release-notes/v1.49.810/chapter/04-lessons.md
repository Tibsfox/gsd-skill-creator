# v1.49.810 — Lessons

## New lesson candidates (0)

No new candidates this ship. Backlog: 0 candidates + 8 tentative observations (UNCHANGED from v809).

## Lessons applied (existing)

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read `src/chipset/copper/activation.ts` end-to-end, `src/predictive-skill-loader/index.ts` for the public-API contract, and `gnn-predictor.ts` for the underlying primitive BEFORE writing the wire. Recon caught: (a) the T1.3-RECON doc said `predictSkills(...)` but the actual wrapper is `predictNextSkills`; (b) the Gate G12 hard preservation invariant requires the wire to live outside `src/orchestration/`; (c) the subscriber-gated hook approach is structurally cleaner than the result-field approach. |
| #10414 | Chokepoint retrofit, optional ctx? pattern | The `onPredictions` hook is an optional `?` field on the existing `ActivationContext` interface — zero call-site churn for callers that don't subscribe. Mirrors v782 LoaderContext's optional ctx? pattern. |
| #10416 | Tolerant-generator / lightest wire | Resisted: adding `predictions?: SkillPrediction[]` to `ActivationResult` (pollutes every result for every caller); wiring all three Options A+B+C in one ship; building a per-activation prediction-cache; moving the emit helper up to `dispatchByTarget`. Chose: 1 optional context field + 1 emit helper + 2 tests. |
| #10422 | Verdict-pattern surface separation | The wire enforcement is implicit (the helper only runs when the hook is set); no audit-test added because the existing G12 byte-identical test already covers the "wire is correctly default-off" claim transitively. Observability surface (the hook) is separate from decision surface (when/whether to wire in production). |
| #10427 | Failure-mode contracts | The `emitPredictions` helper is observability-only (documented in the docstring); the catch-and-swallow at its boundary is the correct failure mode (consistent with the existing async-mode pattern in the file). Documented explicitly so future readers don't tighten it incorrectly. |

## Tentative observations carried forward (8 — UNCHANGED from v809)

No changes this ship. The v810 wire ship is pure mechanical application of established patterns.

## New observations flagged this ship (not promoted; not in count)

**Recon doc name-drift across ~1 day.** The T1.3-RECON-2026-05-27 doc was written ~7 hours before this ship and referenced `predictSkills(...)` as the function to wire. The actual function is `predictNextSkills(...)`. A trivial name-drift, but it's the second observation this chain that a recon doc named a symbol that didn't exist exactly as named (v809 had `record.url` vs the actual `record.target`). Tentative; not a candidate. Worth flagging as forward observation: recon docs that name specific functions/fields should be verified against the actual source before being relied upon as ship-input.

**Two-layer default-off contract is structurally cleaner than one-layer.** The wire has TWO ways to be no-op: (1) hook unset, (2) flag off. Either layer alone is sufficient; both together make each layer separately testable. This is a generalization of the "belt-and-suspenders" pattern that's worth naming if a second instance lands (e.g., a future T1.3 Option B with a similar two-layer shape). Tentative observation; not a candidate yet (1 instance).

## Cross-references

- #10412 + Gate G12 → recon-first caught the byte-identical invariant before it could be broken (would have failed pre-tag-gate)
- #10414 + #10416 → optional `?:` field is the lightest-wire shape for adding observability subscribers to existing contexts
- #10427 + async-mode pattern → fire-and-forget observability has a documented swallow at its boundary; same pattern as existing async-mode handler

## What this ship illustrates about T1.3 closure cadence

GAP-2 closes at the audit's minimum credible threshold with one wire ship. Future T1.3 ships (Option B = ObservationBridge wire; Option C = confidence-bounded fallback) are now independent of this one — the substrate is reachable from `src/`, so any further wires are downstream extensions, not preconditions.

The T1.3 recon doc projected:
- Option A only: 1 ship → **shipped at v810**
- Option A + Option B: 2-3 ships → 1-2 more if pursued
- Option A + Option B + Option C: 4-6 ships → 3-5 more if pursued

The operator's discretion governs whether to pursue Options B and C; this ship satisfies the audit-retrospective's GAP-2 "consumer engine wired" claim independently.
