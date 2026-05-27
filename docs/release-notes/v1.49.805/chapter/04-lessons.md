# 04 — Lessons Learned: v1.49.805

## 0 lessons emitted; 3 promoted to ESTABLISHED; 1 tentative observation

v805 is a codification ship. Promotes 3 strengthening levers from the 2026-05-26 audit retrospective.

## Lessons promoted to ESTABLISHED

### #10428 — Meta-cadence (codify → consume → calibrate)

**Provenance:** 2026-05-26 core-functions audit retrospective §5.S3.
**Severity:** MEDIUM.
**Apply:** Planning a counter-cadence cleanup-mission; deciding which operational debt to spend a non-degree-advancing ship on.
**Rule:** Name the axis (codify / consume / calibrate) that a counter-cadence ship invests in. The naming is load-bearing; the operator's choice is bounded. Cadence-overdue triggers per axis are prose-only and informational.
**Anchor:** `docs/meta-cadence-discipline.md` (NEW this ship).

### #10429 — Substrate opt-in paths public surface

**Provenance:** 2026-05-26 core-functions audit retrospective §5.S4.
**Severity:** MEDIUM.
**Apply:** Authoring docs that surface opt-in flags to operators; reviewing whether a new substrate ship needs a public-surface entry.
**Rule:** Per-substrate four-field shape — what-it-unlocks / what-it-costs / opt-in-mechanic / when-to-defer. `docs/SUBSTRATE-OPT-IN-PATHS.md` is the WHY-truth source; `docs/MODULE-DEFAULTS.md` remains the flag-truth source. Cross-link; don't duplicate.
**Anchor:** `docs/SUBSTRATE-OPT-IN-PATHS.md` (NEW this ship).

### #10430 — Finer-grained counter-cadence alternation

**Provenance:** 2026-05-26 core-functions audit retrospective §5.S7.
**Severity:** LOW.
**Apply:** Counter-cadence cadence-shape decisions (batched 30-ship cleanup vs alternating ~5-1-1).
**Rule:** Alternating ~5 forward + 1 codification + 1 calibration is the steady-state maintenance complement to the historical 30-ship batched cleanup. The two cadences are complements, not alternatives. The finer cadence is the gate-not-vigilance analog for cadence itself.
**Anchor:** `docs/counter-cadence-discipline.md` (APPEND this ship; existing doc gains a new "## Lesson #10430" section).

## Disciplines reinforced (no new IDs from this ship's body of work)

- **#10412 (Recon-first as default)** — 18th consecutive forward application.
- **#10422 (Verdict-pattern surface separation)** — 15th forward application.
- **#10423 (Lightest wire that satisfies the verdict)** — 15th forward application.
- **#10424 (ESTABLISHED v794) — Adoption-refresh AFTER bump** — applied.

## Lessons-learned database state

- **Total lessons emitted to date:** 10430 (cumulative; +3 this milestone).
- **Lessons promoted this milestone:** **3** (#10428 + #10429 + #10430).
- **Lesson candidates closed:** 0 (the three promoted came from the audit retrospective lever list, not the candidate backlog).
- **Open lesson candidate backlog:** 0 (UNCHANGED).
- **Manifest entries in `tools/render-claude-md/disciplines.json`:** **17 → 19** (+2: Meta-cadence, Substrate opt-in paths; Counter-cadence-cadence updated).
- **Manifest lessons:** **68 → 71** (+3 promoted).
- **Tentative observations carried forward:** 5 (was 4; +1 from this ship — see below).

## Tentative observation: codification ship pattern at 4 instances

v784 (8 lessons), v790 (7 lessons), v802 (3 lessons), v805 (3 lessons) = 4 instances. The shape:

1. Recon: cluster lesson candidates by domain.
2. Author / extend canonical docs (NEW for wholly new domains, APPEND for refinements).
3. Update `disciplines.json` — +1 per NEW domain, append per refinement.
4. Regenerate CLAUDE.md via `npm run render:claude-md`.
5. Write 5-file chapter set.
6. T14 ship.

At 4 instances the pattern is past Lesson #10426's "extract at the SECOND class instance" trigger; promotion at the 5th instance would meet the "net-positive at the THIRD consumer" rule applied at a meta level.

Carry forward as a tentative observation; do NOT promote yet.

## Cross-discipline observation: this ship is the codify-axis investment

Per the newly-promoted #10428, every counter-cadence ship invests in one of three axes. v805 is the codify-axis investment for this chain. v804 was the consume-axis investment (read-side surface for write-only substrate). A future calibrate-axis ship would close the three-axis pattern.

This is the first ship to operate UNDER #10428's discipline — the retrospective explicitly NAMES the axis. The pattern transfers immediately: every future counter-cadence ship's retrospective should NAME its axis. The chapter set's 03-retrospective.md "Verdict on scope" section is the canonical surface for this naming.

## Lessons applied at v1.49.805 (from v1.49.802-804 and earlier)

- **#10412** (recon-first) — applied. 18th consecutive.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — applied 15th time.
- **#10424** (Adoption-refresh AFTER bump) — applied at T14 step 11.

## Open lessons watchlist (apply at next opportunity)

- **#10412** (recon-first) — apply at every session start.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — apply at every extension.
- **#10424** (Adoption-refresh AFTER bump) — gate is active.
- **#10425** — apply at every new bounded-learning math choice.
- **#10426** — apply at every SECOND class instance + every wired-vs-unwired split.
- **#10427** — apply at every accessory-vs-load-bearing surface choice.
- **#10428 (newly ESTABLISHED v805)** — apply at every counter-cadence scope discussion.
- **#10429 (newly ESTABLISHED v805)** — apply at every new operator-facing substrate.
- **#10430 (newly ESTABLISHED v805)** — apply at every counter-cadence cadence-shape decision.
- **(tentative) watch-loop tear-down race** — carry forward.
- **(tentative) chained-session architectural-tax break-even** — carry forward.
- **(tentative) registry-abstraction cross-chain payoff** — carry forward (supporting #10426).
- **(tentative) 6th-mode-flag refactor trigger** — carry forward.
- **(tentative NEW v805) codification-ship pattern at 4 instances** — carry forward; promotion at 5th instance.

## Forward backlog (post-v805)

| ID | Severity | Apply | Source | Status |
|---|---|---|---|---|
| (tentative) watch-loop tear-down race | NOTE | Long-running primitives MUST await in-flight callbacks during teardown. | v800 implementation | carry forward (1 instance) |
| (tentative) chained-session architectural-tax break-even | NOTE | Architectural-tax ship in multi-ship chain breaks even at 2nd consumer, net positive at 3rd. | v798→v799-801 observation | carry forward (1 chain) |
| (tentative) registry-abstraction cross-chain payoff | NOTE | Per-class registry abstraction's payoff window extends past the immediate post-extraction chain. | v798→v804 observation across 2 chains | carry forward (supporting #10426) |
| (tentative) 6th-mode-flag refactor trigger | NOTE | When a CLI accumulates 6 mode flags, evaluate lifting to subcommand form. | v800-v804 trajectory | carry forward (1 trajectory) |
| (tentative NEW v805) codification-ship pattern at 4 instances | NOTE | Recon → cluster → author → manifest → regen → chapter set → T14. | v784/v790/v802/v805 trajectory | carry forward (4 instances; promote at 5th) |

Open lesson-candidate backlog: **0** (UNCHANGED — the three promoted this ship came from the audit retrospective lever list, not the candidate backlog).
