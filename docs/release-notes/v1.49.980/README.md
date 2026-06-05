---
title: "v1.49.980 — Co-activation consumer wire"
version: v1.49.980
date: 2026-06-05
summary: >
  Ship 5.1 (D4 loop-capability): turns the dead co-activation detector into a
  real learning loop. Fixes the PatternStore-envelope read bug that silently
  killed `agents suggest` (5.1a) and adds default-OFF transcript skill-mining
  to un-starve activeSkills at the source (5.1b). The first forward motion on
  the strategic learning loop after ~120 flat ships, taken via a design pass.
tags: [release, observation, learning-loop, phase-5]
---

# v1.49.980 — Co-activation consumer wire

**Shipped:** 2026-06-05

One-line: a design pass picked co-activation over calibration and cost-routing, then wired it — the `agents suggest` loop now reads real session data and can mine real skill signal (behind a default-OFF flag).

## Why this ship

Phase 5 (the strategic learning loop) had been flat for ~120 ships. Per the D4 decision-gate resolution, the mechanism was chosen by a **design pass** (read-only multi-agent panel) rather than pre-committed: co-activation scored 6.85 vs calibration 5.85 vs cost-aware-routing 2.00, winning 2-of-3 lenses. The pass corrected the audit's premise — co-activation is *already* CLI-reachable; it produced nothing only because (a) a reader bug dropped every record and (b) its source was starved. Calibration, the runner-up, was blocked by a degenerate retention signal whose fix is now tracked as debt; cost-routing is a dead island with no feedback loop.

## What shipped

- **5.1a — envelope unwrap:** `agent-suggestion-manager.loadSessions` and the dashboard `session-collector` now unwrap the PatternStore `{timestamp, category, data, _checksum}` envelope (verify `_checksum` on read, skip tampered/malformed lines, legacy bare records still parse). Before this, `startTime`/`activeSkills` were `undefined`, every record failed the co-activation recency filter, and `agents suggest` was silently dead. Resurrects the 123 on-disk records and the dashboard session metrics.
- **5.1b — transcript skill-mining (default OFF):** new `TranscriptParser.extractActiveSkills` mines distinct, sorted skill names from `Skill` tool_use blocks nested in `message.content[]` (sidechain entries excluded by `parse()`). `SessionObserver.onSessionEnd` mines from the already-parsed entries (no second parse), gated by the new `observation.mine_active_skills` flag. Flag OFF ⇒ session-end write path is byte-identical (`activeSkills: []`). Flag added to the config schema/types and the gsd-init + install.cjs templates.
- **F4 debt tracked:** `docs/retention-substrate-outcome-driven-debt.md` records the degenerate retention-signal fix as the Ship 5.2 pre-req, so it is never "closed" by ticking the degenerate signal.

## Verification

- `npm run build` clean; full `npx vitest run` **35738 passed, 0 failures**.
- New regression test (`agent-suggestion-manager.test.ts`) fails against the old bare-parse code (0 suggestions from enveloped data) — the negative-test fixture. Mutation-guard test added for the empty/whitespace skill-name filter.
- Tests live in existing `src/` suites + one new file, all covered by `npx vitest run` → **pre-tag-gate stays at 20 steps**.
- Adversarial ship review (5 lenses → adversarial verify): 1 MINOR confirmed (fixed in code), 3 rejected with sound reasoning.

## Engine state

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — all unchanged (forward Phase-5 feat; no new lesson promoted).
