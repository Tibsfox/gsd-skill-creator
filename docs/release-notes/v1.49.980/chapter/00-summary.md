# v1.49.980 — Summary

## The ship

Ship 5.1 (D4 loop-capability) wires the co-activation consumer — the first forward motion on the strategic learning loop after ~120 flat ships. The mechanism (co-activation vs calibration vs cost-aware-routing) was selected by a read-only multi-agent **design pass**, not pre-committed: co-activation won 6.85 vs 5.85 vs 2.00 across three lenses. It then turns the dead detector into a working loop: fix the reader bug that silently killed `agents suggest` (5.1a), and add default-OFF transcript skill-mining to un-starve `activeSkills` at the source (5.1b).

## What shipped

- **5.1a (envelope unwrap):** `loadSessions` (agent-suggestion-manager) and the dashboard `session-collector` unwrap the PatternStore `{timestamp, category, data, _checksum}` envelope — verify `_checksum` on read, skip tampered/malformed lines, legacy bare records still parse. Resurrects 123 on-disk session records and the dashboard session metrics.
- **5.1b (skill-mining, default OFF):** `TranscriptParser.extractActiveSkills` mines distinct sorted skill names from `Skill` tool_use blocks nested in `message.content[]` (sidechain-excluded). Mined in `SessionObserver.onSessionEnd` from already-parsed entries (no second parse), gated by `observation.mine_active_skills` (default false → byte-identical write path). Flag added to schema/types + gsd-init/install.cjs templates.
- **F4 debt tracked:** `docs/retention-substrate-outcome-driven-debt.md` — the degenerate retention-signal fix as the Ship 5.2 pre-req.

## Verification

- `npm run build` clean; full `npx vitest run` **35738 passed, 0 failures**.
- New `agent-suggestion-manager.test.ts` is the negative-test fixture (old bare-parse code → 0 suggestions on enveloped data). Empty/whitespace skill-name mutation guard added.
- Tests in existing `src/` suites + one new file → **pre-tag-gate stays at 20 steps**.
- Adversarial ship review: 1 MINOR confirmed (fixed), 3 rejected.

## Engine state

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — all unchanged.
