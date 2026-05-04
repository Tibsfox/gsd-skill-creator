# v1.49.603 — Forward Lessons Emitted

## #10244 — PROMOTED to ESTABLISHED at observation #3

**Title:** Counter-cadence-on-post-ship-discovery pattern.

**Status:** PROMOTED to ESTABLISHED at v1.49.603 G3 close. Was CANDIDATE at v601; observation #2 noted at v601; observation #3 reached at v603 ship.

**Pattern:**
1. Operator browses live site post-ship; spots drift no gate caught.
2. Diagnosis surfaces the *class* of failure, not just the instance.
3. Prevention spec proposed: tool-or-gate extension + retroactive verification + override env-var convention.
4. Operator authorizes prevention.
5. Counter-cadence milestone opens; gate-extension + (sometimes) retroactive backfill ship in one envelope; engine state is preserved exactly.
6. Pre-tag-gate gains a step OR an existing step gains sub-checks; the gate validates itself in the same ship that creates it.
7. The next engine-cadence ship validates the gate against real engine-state work.

**Three-instance ratification:**

| Instance | Milestone | Drift class | Gate surface | New env-var | Lessons promoted |
|---|---|---|---|---|---|
| 1 | v1.49.585 | self-mod / git-add / citation-invariants / chapter-idempotent / pre-push completeness | PreToolUse hook + vitest test + pre-push hook | `SC_SELF_MOD` / `SC_FORCE_ADD` / `SC_SKIP_PREPUSH` | foundational |
| 2 | v1.49.601 | catalog-index NASA/MUS/ELC degree-list drift | pre-tag-gate composite (step 8 added) + ftp-sync precondition | `SC_SKIP_CATALOG_INDEX_GATE` | #10244 emitted |
| 3 | **v1.49.603** | **Research-Track-cards + nav-card structural-canonical** | **depth-audit sub-checks composed under step 6 + W2 build-agent-prompt template** | **`SC_SKIP_TRACK_CARDS_GATE`** | **#10244 PROMOTED** |

The interface-agnostic structural property the three instances share: each converts a prose-only discipline into deterministic enforcement; each extends an existing gate surface area rather than introducing a parallel new gate; each ships as a counter-cadence milestone with no engine-state advance because the work is gate-authoring, not substrate-authoring.

**ESTABLISHED disposition:** future post-ship operator-discovered silent-drift classes follow the counter-cadence pattern as standing operational practice. The discipline is most strict at the boundary: counter-cadence milestones MUST preserve engine state exactly (no NASA / MUS / ELC / SPS / §6.6 / TRS advance); engine-cadence milestones MUST NOT include gate-authoring as a hidden side-scope (gate-authoring is a counter-cadence milestone's first-class deliverable). When a post-ship discovery surfaces a drift class that recurs across multiple recent milestones AND the root cause is the absence of a deterministic gate, the appropriate response is a counter-cadence ship pausing the engine cadence to add the gate — NOT a frame-imposed fold-into-next-milestone scope expansion that would conflate gate-authoring with substrate-authoring.

**Anti-pattern (what NOT to do):**
- Fix the drift inline + continue with next NASA-degree milestone. The gate addition gets stashed; future drift accumulates again.
- Open a "tooling backlog" issue and defer indefinitely. Loses the operator-discovery context that informed the spec.
- Ship the gate without exercising it. v603 exercises the new gate as part of v603's own pre-tag-gate (step 6 sub-checks PASS at G3) — the gate validates itself in the same ship that creates it.
- Expand a counter-cadence ship to include engine-state advance. Mixes gate-authoring with substrate-authoring; risks both quality dimensions.

**Watch conditions for ESTABLISHED reversal:**
- If 2 consecutive post-ship operator discoveries opt for hot-fix-without-gate (treat the drift as one-off rather than a class), revisit whether the counter-cadence threshold is being applied too broadly.
- If 2 consecutive counter-cadence ships introduce engine-state side-scope, revisit the boundary discipline (engine-state preservation HARD RULE).
- If 3 consecutive post-ship discoveries find drift that the existing 8-step pre-tag-gate composite already catches (false-positive operator alarm), revisit whether the discovery-pattern is converging on noise.

**Forward action:** continued soak across v604+ counter-cadences (if any). Each future counter-cadence is observation #4+ confirming-soak data. The pattern is now a documented standing operational practice; future ESTABLISHED reaffirmations track in nominal direction unless watch-condition events trigger.

## #10245 — CANDIDATE emitted (historical-drift-sweep-at-gate-introduction pattern)

**Title:** Historical-drift retroactive sweep at gate introduction is a transparency measure, not a remediation requirement.

**Status:** CANDIDATE at v1.49.603 close. Soak through v604+ for ratification.

**Pattern:** when introducing a new deterministic gate, run it once across all existing artifacts (the retroactive sweep). Document any pre-gate drift surfaced as known-historical. Do NOT remediate the historical drift in the gate-introduction milestone — keep counter-cadence boundary compact. Operator decision at a later counter-cadence (or accepts as-is) on whether to schedule retroactive cleanup.

**Anchoring observation at v603:**

The new track-card-coverage + nav-card-presence sub-checks were authored at W1; W3.3 ran the gate across all 81 NASA degrees (1.0 through 1.81). The sweep surfaced 4 pre-existing historical drifts at degrees 1.34 / 1.36 / 1.57 / 1.75. These pre-date the gate; they would not have been caught by any prior gate; they are not symptoms of v603's specific drift class.

The right disposition was documentation-only — the gate runs against `--current` semantics by design (per `tools/depth-audit.mjs` semantics inherited from the original depth-audit construction); the v603 ship validates against the post-hot-fix 1.76-1.81 state; the retroactive findings become carry-forward for operator decision at v604+.

**Why this is worth a forward-lesson:**
- Without the discipline, gate-introduction milestones risk scope creep — a retroactive cleanup that catches "all the historical drift this gate would have caught" easily expands a 2.5-hour counter-cadence ship into a multi-day rework.
- With the discipline, the counter-cadence boundary stays clean: the gate-introduction milestone is exclusively about authoring the gate + validating it on the most-recent drift evidence; historical cleanup is a separate counter-cadence with its own scope.
- The transparency aspect is preserved: the sweep findings are documented (not hidden) so that operator + future readers know the historical drift exists and can plan its remediation independently.

**Anti-pattern (what NOT to do):**
- Remediate all historical drift in the gate-introduction milestone. Mixes two scopes; risks both quality dimensions; expands a tight counter-cadence into a sprawling rework.
- Hide the retroactive sweep findings (don't run the sweep, or run it but don't document). Loses transparency; future readers cannot reason about the gate's effective historical coverage.
- Make the gate run against `--all` rather than `--current` semantics by default. Forces every ship pipeline to re-validate every historical artifact; introduces ship-blocking churn for no incremental benefit.

**Forward action:** soak through v604+ counter-cadence introductions (if any). Each future gate introduction's retroactive sweep is observation #2+ confirming-soak data. ESTABLISHED at 3rd consecutive counter-cadence where this discipline holds. If 2 consecutive gate introductions opt for in-milestone retroactive remediation, revisit the boundary.

**Watch conditions for promotion:**
- Future counter-cadence introduces a new gate; the retroactive sweep surfaces pre-gate drift; the operator authorizes documentation-only disposition; the milestone ships within counter-cadence boundary.
- Reaffirms 3 times across distinct gate-introduction patterns → PROMOTE to ESTABLISHED.

## Carry-forward unchanged from v602

### #10243 — RESOLVED at v602; continuing soak

**Status:** RESOLVED at v1.49.602 G3 (template patched + first MANDATORY application succeeded). Continuing soak through v603+ for the watch condition (if 2 consecutive milestones show systemic cross-track fabrication AFTER patch → revisit Tier-2 path-quality classification). v603 does NOT exercise W2 substrate authoring; soak data point at v603 is "no W2 fabrication observed because no W2 substrate authoring run." Soak continues at v604+ engine-cadence ship.

### #10238 — STILL DEFERRED to v604+

**Title:** Depth-audit gold-standard-comparison extension.

**Status:** STILL DEFERRED to v604+ (carryforward from v598 / v599 / v600 / v601 / v602 deferrals). The threshold for meaningful comparison (3+ Tier-2 inline-Opus builds) has been exceeded. Operator decision continues to defer pending operator-chosen implementation window. v603 was a counter-cadence (no W2 build); no v603 substrate to validate refinement against.

**Forward action:** evaluate at v604 W3 alongside #10240 re-evaluation candidate; either implementation at v604+ (if operator chooses) or explicit retirement as non-actionable.

### #10240 — STILL DEFERRED to v604+

**Title:** Depth-audit gate refinement to honor #10231 ESTABLISHED graceful-thinness dispositions automatically.

**Status:** STILL DEFERRED to v604+ per v600 G2 + v601 / v602 / v603 carryforward. Rationale unchanged: v603 depth-audit gate produced graceful dispositions in nominal-direction; the existing operator override (`SC_SKIP_DEPTH_AUDIT=1`) + #10231 ESTABLISHED disposition adequately handle the case. Adding the new track-card-coverage + nav-card-presence sub-checks to the depth-audit at v603 does NOT change the per-file depth-vs-predecessor refinement question — the new sub-checks are scaffolding-presence checks (orthogonal to depth-vs-predecessor); they do not interact with #10240's refinement scope.

**Forward action:** track depth-audit gate behavior across v604+ ships; re-evaluate at v604 G2 or first thin-substrate ship.

### #10241 — Carryforward (MISSION-PROGRAM-REDUNDANCY-RESILIENCE §6.6 lookback admit)

**Status:** Carryforward from v599; remains reminder. v603 is counter-cadence with no NASA-degree advance. Remains a reminder for the next paired-mission ship (Viking 1+2 evaluation milestone, ~v92+v93).

## §6.6 watchlist (carry-forward unchanged from v602)

All 5 carryforward + 4 new 1.81-substrate candidates from v602 carry forward unchanged at v603 because v603 is counter-cadence (no §6.6 work, no engine-state substrate advance). The candidates remain at 1-ex; admit/promote evaluation continues at v604+ engine-cadence.

### Carryforward (5 candidates)

1. **LAUNCH-VEHICLE-FAILURE** (1-ex; Mariner 8 v599)
2. **NWO (NONVIOLENT-WITNESS-OPPOSITION)** (1-ex; Greenpeace founding voyage v599)
3. **DUST-STORM-WAITING-PROTOCOL** (1-ex; Mariner 9 v600)
4. **PAIRED-REDUNDANT-PROGRAM-DESIGN-VINDICATION** (1-ex; Mars '71 v600)
5. **PFFA (Planetary-Framework-For-First-Arrival)** (1-ex; Stockholm + UNEP v600)

### New 1.81-substrate (4 candidates from v602)

6. **GEOLOGICAL-STRATIGRAPHY-AS-SCIENCE-DRIVER** (1-ex; Apollo 15 v602)
7. **EXTENDED-STAY-DOCTRINE** (1-ex; Apollo 15 v602)
8. **FIELD-VEHICLE-MOBILITY** (1-ex; LRV v602)
9. **ORBITAL-SCIENCE-AS-INDEPENDENT-MISSION** (1-ex; SIM bay + Worden v602)

## What does NOT change at v603

- §6.6 register stays at 23 LOCKED.
- No §6.6 candidate admits.
- No new ESTABLISHED promotions on substrate-side lessons (#10231 / #10232 / #10233 / #10236 / #10237 / #10242 — all carry forward unchanged; they accumulate observations only at engine-cadence milestones).
- No new TRS M1 Wave 2 packs bound (next-pack binding waits for v604 W0).
- No SPS species advance, no MUS degree advance, no ELC degree advance, no NASA degree advance.

## Carry-forward queue at v603 close (for v604 W0)

1. **TRS M1 W2 generation continues** — v604 advances to next pack (TBD pending fresh fetch-chain status review at v604 W0).
2. **5 + 4 §6.6 watchlist candidates carry forward** unchanged — track through v604+ for 2-ex confirmation.
3. **#10238 + #10240** depth-audit refinement candidates — STILL DEFERRED to v604+; re-evaluate at v604 G2.
4. **#10241** lookback admit — evaluate at first paired-mission ship (Viking 1+2 likely candidate at ~v92+v93).
5. **#10244 ESTABLISHED at v603** — future counter-cadence ships are observation #4+ confirming-soak; pattern reaffirms in nominal direction unless watch-condition events trigger.
6. **#10245 candidate** — historical-drift-sweep-at-gate-introduction; soak through v604+ for ratification at 3rd consecutive counter-cadence application.
7. **4 historical track-card drifts** (1.34 / 1.36 / 1.57 / 1.75) — operator decision at v604+ on whether to schedule retroactive cleanup pass.
8. **#10243 RESOLVED at v602** — no carryforward action needed; continuing soak through v604+ for the watch condition; v603 is no-op for soak (no W2 substrate authoring at v603).
9. **Sonnet sub-agent dispatch availability** — passive monitor; if returns at v604+, Sonnet path becomes preferred default per #10233 ESTABLISHED watch condition.

The lessons-emitted file at v603 is intentionally focused on the two pattern-level lessons (#10244 PROMOTED, #10245 emitted). Counter-cadence milestones produce few new substrate-level lessons because they don't exercise engine-state substrate; they exercise operational-discipline substrate. The two pattern-level lessons are the substrate-of-the-substrate — they document how the gate stack itself grows over time.
