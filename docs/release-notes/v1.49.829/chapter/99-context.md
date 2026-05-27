# v1.49.829 — Context

## Provenance

This ship was selected as the third ship of the v827-833 chain based on operator selection from the v824-826 handoff's "Highest-ROI next ship candidates" list (item 4: "T1.3 application-boundary wire").

The handoff said: "Pick up where v823 + v826 left off: instantiate ObservationBridge at the application boundary (src-tauri/, dashboard renderer, or integration test fixture); pass it to translateSessionEvent calls. Completes the runtime side of v823's wire pattern."

Recon revealed:
- Zero src/ production callers of `translateSessionEvent` (only test callers).
- src-tauri/ wire would be cross-language (Rust → TS) — too complex for a single ship.
- Dashboard renderer is HTML-only at build time; events flow browser-side via inline scripts (no natural TS module wire location).
- **Integration test fixture is the cleanest application-boundary wire location** — has visibility into both rootdirs per vitest project config.

## What this ship adds

A single NEW integration test file:

```
tests/integration/college-observation-bridge-wire.integration.test.ts
```

The test file is `.integration.test.ts` (matches vitest's `integration` project include pattern) and lives outside both rootdirs (src/ + .college/), allowing it to import from both.

## Recon trail (per #10422 ledger-driven work discipline)

1. **Verify substrate exists**: `SkillActivationObserver` interface in `src/dashboard/activity-tab-toggle.ts:76` (v823); `ObservationBridge.onSkillActivate` in `.college/integration/observation-bridge.ts:170` (v823).
2. **Verify no production caller of translateSessionEvent**: grep found only `src/dashboard/activity-tab-toggle.ts` definition + test files. Zero production callers.
3. **Identify boundary location**: Check vitest project configs. `integration` project includes `tests/**/*.integration.test.ts`. Confirmed visibility into both rootdirs by inspecting vitest.config.
4. **Author integration test**: 5 tests covering compile-time check, happy-path routing, negative coverage, batch conversion, listener observability.
5. **Verify test passes**: `npx vitest run --project integration tests/integration/college-observation-bridge-wire.integration.test.ts` → 5 PASS.

## Discipline-extension vs new-domain choice

This ship doesn't introduce a new discipline. It exercises an EXISTING pattern (cross-rootdir wire via duck-typed interface) for the 2nd time, bringing it to the #10426 codification threshold. The next codify ship (v833) can promote this pattern.

## What was deferred

- **src/ production caller of `translateSessionEvent`** — no natural location identified. Future ship if dashboard event-stream wiring becomes necessary.
- **src-tauri/ cross-language wire** — out of scope for this chain.
- **Bridge listener observability beyond unit test** — out of scope (verifiable via existing tests).

## Verification trail

| Step | Result |
|---|---|
| `npm run build` | PASS |
| `npx vitest run --project integration tests/integration/college-observation-bridge-wire.integration.test.ts` | 5 tests PASS |
| Pre-tag-gate (full) | expected 17/17 PASS (step 13 within-ceiling) |

## Forward path

- **v830-832** — T1.3 Option C (RosettaEngine confidence-bound fallback; 2-3 ships).
- **v833** — Codify ship for onPredictions wire pattern + cross-rootdir wire pattern.

After the chain closes, NASA 1.179 remains the strong-default per v826 handoff (now **47 consecutive ships at 1.178**).

## References

- Predecessor: v1.49.828 (`docs/release-notes/v1.49.828/`)
- v824-826 chain handoff: `.planning/HANDOFF-2026-05-27-v1.49.824-826-chain-3-ships-shipped.md`
- T1.3 recon: `.planning/T1.3-RECON-2026-05-27.md`
- First-instance of cross-rootdir wire pattern: v1.49.823 (`docs/release-notes/v1.49.823/`)
- Substrate-consumer wire pattern (Option A): v1.49.810 (copper) + v1.49.826 (selector)
- ObservationBridge implementation: `.college/integration/observation-bridge.ts`
- SkillActivationObserver interface: `src/dashboard/activity-tab-toggle.ts:76`
