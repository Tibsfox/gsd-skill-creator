# v1.49.603 — Engine State Context

## Engine state delta (counter-cadence — no advance)

| Track | v1.49.602 close | v1.49.603 close | Delta |
|---|---|---|---|
| NASA degree | 1.81 (Apollo 15) | 1.81 (Apollo 15) | unchanged |
| MUS degree | 1.81 (*Who's Next* / The Who) | 1.81 (*Who's Next* / The Who) | unchanged |
| ELC degree | 1.81 (Earthwatch Institute founding) | 1.81 (Earthwatch Institute founding) | unchanged |
| SPS species | #78 (American Pika) | #78 (American Pika) | unchanged |
| §6.6 register | 23 LOCKED (5 carryforward + 4 new 1.81 watchlist) | 23 LOCKED (same 5+4 watchlist) | unchanged |
| TRS substrate | M1 W2 pack-12 (category theory) binding pass complete | (same) | unchanged |
| vitest tests | ~29,494 (v601 baseline; v602 stable) | ~29,504 | +10 (new depth-audit hermetic cases) |
| pre-tag-gate steps | 8 | 8 | unchanged |
| pre-tag-gate step 6 sub-checks | 1 (per-file depth-vs-predecessor) | **3 (existing + track-card-coverage + nav-card-presence)** | **+2** |
| `tools/depth-audit.mjs` NASA pillar checks | 1 sub-check + content-coverage | **3 sub-checks** + content-coverage | **+2** |
| Operational env vars | 8 (incl. `SC_SKIP_DEPTH_AUDIT` / `SC_SKIP_CATALOG_INDEX_GATE` / `SC_SKIP_CLAUDE_MD_GATE`) | **9** | **+1 (`SC_SKIP_TRACK_CARDS_GATE`)** |

## Pre-tag-gate evolution timeline

The composite gate's step count + sub-check count is a long-soak record of operational-debt counter-cadence work:

| Milestone | Steps | Sub-checks under step 6 | Step or sub-check added |
|---|---|---|---|
| v1.49.585 | 4 | n/a (no depth-audit yet) | gate created (steps 1=build / 2=vitest / 3=completeness) |
| v1.49.587 | 5 | n/a | step 4=CI-on-dev added; step 5=www-bundles added (counted as 5 here, sometimes shown as 5 since both landed at v587) |
| v1.49.591 | 6 | 1 (per-file depth-vs-predecessor) | step 6=depth-audit BLOCKER (hardened from WARN soak) |
| v1.49.596 | 7 | 1 | step 7=CLAUDE.md drift |
| v1.49.601 | 8 | 1 | step 8=catalog-index drift BLOCKER |
| **v1.49.603** | **8** | **3** | **step 6 sub-check count grows from 1 to 3 (track-card-coverage + nav-card-presence)** |

Step count growth rate: ~1 step per ~5 milestones. v603 deviates from that pattern by extending an existing step rather than adding a new step — the first counter-cadence to grow the gate horizontally rather than vertically. The horizontal-vs-vertical choice is structurally meaningful: when the new check is conceptually a depth-audit-extension, compose under step 6; when the new check is a new dimension entirely, add a new step.

## Counter-cadence ship table

The chronological listing of counter-cadence operational-debt milestones since v585:

| Ship | Date | Trigger | Scope | New gate / surface | New tests | New env-var | Lessons promoted |
|---|---|---|---|---|---|---|---|
| **v1.49.585** | 2026-04-28 | post-v584 codebase mapping at `.planning/codebase/CONCERNS.md` surfaced 5 categories of operational debt | self-mod-guard.js + git-add-blocker.js + chapter-idempotent + pre-push completeness gate + dead-zone citation-invariants test + ELC scorer regex unify + MUS Phase C concept-registry template + artemis-ii env-var override + .gitattributes + 16-branch prune + agent reconciliation + citation-debt ledger | PreToolUse hooks (self-mod-guard / git-add-blocker) + vitest test (citation-invariants) + pre-push hook (completeness) + idempotent chapter writer | 64 new tests across 16 components | `SC_SELF_MOD` / `SC_FORCE_ADD` / `SC_SKIP_PREPUSH` / `RH_ENV_FILE` / `PRE_TAG_GATE_QUIET` | foundational |
| **v1.49.601** | 2026-05-04 | post-v600 operator browsed live site; spotted catalog-index files at `www/tibsfox/com/Research/{NASA,MUS,ELC}/index.html` had not been updated for 1.78/1.79/1.80 | new tool `tools/update-catalog-indexes.mjs` (461 lines) + 15 hermetic tests + pre-tag-gate step 8 + ftp-sync `--include-catalog-index` precondition | pre-tag-gate composite (step 8 added) + ftp-sync precondition | 15 hermetic tests | `SC_SKIP_CATALOG_INDEX_GATE` | #10244 emitted |
| **v1.49.603** | 2026-05-04 | post-v602 operator browsed live site; spotted Research-Track-card grid + nav-card drift across 6 consecutive degrees (1.76-1.81) | extended `tools/depth-audit.mjs` NASA pillar with track-card-coverage + nav-card-presence sub-checks + 10 hermetic tests + W2 build-agent-prompt template HARD RULE | depth-audit sub-check surface (composed under existing step 6) + W2 build-agent-prompt template | 10 hermetic tests | `SC_SKIP_TRACK_CARDS_GATE` | **#10244 PROMOTED to ESTABLISHED at obs-3; #10245 emitted as candidate** |

Cadence: 3 counter-cadence ships in 18 milestones since v585 (v585 → v601 = 16 milestones; v601 → v603 = 2 milestones). The v601 → v603 interval is the tightest yet — operator pattern-recognition is sharpening as the gate stack matures and the discipline becomes more visible.

## Lessons evolution at v1.49.603

| Lesson | v599 | v600 | v601 | v602 | v603 |
|---|---|---|---|---|---|
| #10221 dev/main sync | ESTABLISHED (3-ex) | applied | applied (2x at ship) | applied (2x at ship) | applied (2x at ship) |
| #10231 graceful-thinness | PROMOTED ESTABLISHED | applied (nominal) | n/a (counter-cadence) | applied (4th obs reaffirmed) | n/a (counter-cadence) |
| #10232 INSIDE-window MUS | PROMOTED ESTABLISHED | applied | n/a (no MUS) | reaffirmed (5th obs) | n/a (no MUS) |
| #10233 Tier-2 inline-Opus W2 | observation #2 | PROMOTED ESTABLISHED | applied (tool build path) | reaffirmed (4th obs post-promo) | applied (sub-check build path) |
| #10236 substrate-emergent | observation #2 | PROMOTED ESTABLISHED | n/a (no substrate work) | reaffirmed (4th obs post-promo) | n/a (no substrate work) |
| #10237 §6.6 watchlist-not-pre-decision | applied | PROMOTED ESTABLISHED | n/a (no §6.6 work) | reaffirmed (4th obs post-promo) | n/a (no §6.6 work) |
| #10238 depth-audit gold-standard ext | DEFERRED | DEFERRED | DEFERRED | DEFERRED | **STILL DEFERRED to v604+** |
| #10239 lab-director G3-boundary | PATCHED pre-spawn | applied (operator G3) | applied (operator G3) | applied (operator G3) | applied (operator G3) |
| #10240 depth-audit gate refinement | — | candidate emitted; DEFERRED | DEFERRED | DEFERRED | **STILL DEFERRED to v604+** |
| #10241 MISSION-PROGRAM-REDUNDANCY-RESILIENCE | candidate (lookback) | carryforward | carryforward | carryforward | **carryforward (Viking 1+2 lookback)** |
| #10242 cross-track substrate convergence | — | observation #1 | n/a | **PROMOTED ESTABLISHED at obs-3** | n/a (no substrate work) |
| #10243 W2 prompt-template patch | — | candidate emitted | carryforward | **RESOLVED at v602** | continuing soak (no W2 substrate at v603) |
| **#10244 counter-cadence-on-post-ship-discovery** | — | — | **candidate emitted** | passive watch (v602 was engine-cadence) | **PROMOTED to ESTABLISHED at obs-3** |
| **#10245 historical-drift-sweep-at-gate-introduction** | — | — | — | — | **candidate emitted (v603)** |

Substrate-side lessons (#10231 / #10232 / #10233 / #10236 / #10237 / #10242) accumulate observations only at engine-cadence milestones. Counter-cadence milestones (v585 / v601 / v603) accumulate observations on operational-discipline lessons (#10239 / #10243 / #10244 / #10245).

## ESTABLISHED lessons table (post-v603)

The cumulative ESTABLISHED lesson set after v603 ratification:

| Lesson | Promoted at | Topic | Domain |
|---|---|---|---|
| #10221 | v596 | dev/main FF sync after each main-merge | operational |
| #10231 | v599 | iconic-mission depth-recovery soak — graceful thinness | substrate / depth-audit |
| #10232 | v599 | INSIDE-window MUS-pick discipline | substrate / cross-track |
| #10233 | v600 | Tier-2 inline-Opus W2 build path | operational / Tier-2 |
| #10236 | v600 | substrate-emergent cross-track epistemology | substrate / cross-track |
| #10237 | v600 | §6.6 watchlist-not-pre-decision | substrate / §6.6 |
| #10239 | v599 (patch); applied through v603 | lab-director G3 boundary discipline | operational / G3 |
| #10242 | v602 | cross-track substrate convergence as opportunistic finding type | substrate / cross-track |
| #10243 | v602 (RESOLVED) | W2 cross-sibling-read MANDATORY before authoring cross-track sections | operational / W2 template |
| **#10244** | **v603** | **counter-cadence-on-post-ship-discovery pattern** | **operational / gate-stack growth** |

10 ESTABLISHED lessons total. The split: 5 operational (operational discipline at G3 / dispatch / sync) + 4 substrate (cross-track + §6.6 + depth-audit) + 1 cross-domain (#10242 spans substrate-finding-type but is also a discipline). #10244's promotion at v603 makes the operational-discipline column 5 entries; the gate-stack-growth pattern is now first-class alongside dispatch / sync / G3 / template / depth-audit disciplines.

## Pre-tag-gate exit-code allocation (unchanged from v601)

| Exit | Step | Class |
|---|---|---|
| 0 | all PASS | success |
| 1 | step 1 | npm build failure |
| 2 | step 2 | vitest failure |
| 3 | step 3 | release-notes completeness |
| 4 | step 4 | CI-on-dev red/pending |
| 5 | step 5 | www-bundles esbuild failure |
| 6 | step 6 | depth-audit FAIL (BLOCKER; **now any of 3 sub-checks: per-file depth-vs-predecessor + track-card-coverage + nav-card-presence**) |
| 7 | step 7 | CLAUDE.md drift |
| 8 | step 8 | catalog-index drift |

Step 6 internal sub-check granularity is preserved in the depth-audit JSON output even though all 3 sub-checks share exit code 6. The text output enumerates per-degree disposition; operator can read which sub-check fired.

## Override env vars (post-v603 set)

| Var | Default | Override | Introduced |
|---|---|---|---|
| `SC_SELF_MOD` | unset → BLOCK | `=1` allow self-mod writes | v585 |
| `SC_FORCE_ADD` | unset → BLOCK | `=1` allow protected-path adds | v585 |
| `SC_SKIP_PREPUSH` | unset → run | `=1` skip pre-push completeness | v585 |
| `SC_SKIP_CI_GATE` | unset → run | `=1` skip CI-on-dev verification | v587 |
| `SC_SKIP_DEPTH_AUDIT` | unset → run | `=1` skip depth-audit BLOCKER | v591 |
| `SC_SKIP_CLAUDE_MD_GATE` | unset → run | `=1` skip CLAUDE.md drift | v596 |
| `SC_SKIP_CATALOG_INDEX_GATE` | unset → run | `=1` skip catalog-index drift | v601 |
| **`SC_SKIP_TRACK_CARDS_GATE`** | **unset → run** | **`=1` skip track-card-coverage + nav-card-presence sub-checks** | **v603 (NEW)** |

All overrides are emergency-only by convention; the deterministic gate is preferred. Each override exists because skipping the gate is sometimes the right operational call (ship-now > fix-now), but the gate addition is always the right structural call.

## Historical-drift sweep findings (v603 retroactive)

The v603 W3.3 retroactive sweep ran the new track-card-coverage + nav-card-presence sub-checks across all 81 NASA degrees on disk (1.0 through 1.81). Result: 1.76 through 1.81 PASS post-hot-fix; 4 historical pre-existing drifts surfaced at degrees that pre-date the gate's existence:

| Degree | Mission (era) | Track cards | Nav-card | Disposition |
|---|---|---|---|---|
| 1.34 | (early-degree mission) | partial-grid | absent or partial | known-historical; v603 does not hot-fix |
| 1.36 | (early-degree mission) | partial-grid | absent or partial | known-historical; v603 does not hot-fix |
| 1.57 | (mid-degree mission) | partial-grid | absent or partial | known-historical; v603 does not hot-fix |
| 1.75 | (immediately pre-1.76 mission) | partial-grid | absent or partial | known-historical; v603 does not hot-fix |

Disposition rationale: the gate runs against `--current` semantics by design; it validates the most-recent ship pipeline, not the historical archive. Forcing remediation in the gate-introduction milestone would conflate gate-authoring with retroactive cleanup; both are legitimate scopes but they belong in separate counter-cadences. The 4 findings carry forward to v604+ for operator decision (schedule retroactive cleanup as a v604 counter-cadence vs. accept-as-is).

This disposition is the substrate for #10245 candidate (historical-drift-sweep-at-gate-introduction pattern). Soak through v604+; ESTABLISHED at 3rd consecutive gate-introduction where the discipline holds.

## TRS M1 Wave 2 progression table

The TRS substrate's pack-binding pace across recent milestones:

| Milestone | Pack | Status |
|---|---|---|
| v1.49.599 | pack-13 | binding pass complete |
| v1.49.600 | pack-11 | binding pass complete |
| v1.49.601 | (no advance — counter-cadence) | n/a |
| v1.49.602 | pack-12 (category theory) | binding pass complete |
| **v1.49.603** | **(no advance — counter-cadence)** | **n/a** |
| v1.49.604 (projected) | next-pack TBD | pending fresh fetch-chain status review at v604 W0 |

The chronological-order traversal of pre-fetched packs (pack-13 → pack-11 → pack-12) is complete at v602 close; v603 preserves the position; v604+ pack selection requires fresh fetch-chain status review.

## v603 ship metrics

- Wall-time: ~2.5h end-to-end (open → spec → gate-extension → template + docs update → verification → release-notes → operator G3 → ship)
- Token budget: ~80–100K tokens for gate-extension + tests (W1 sub-agent) + ~30K for W2 template + CLAUDE.md updates (inline) + ~40K for release-notes (inline) + orchestration overhead = ~150–200K total milestone budget
- vitest delta: +10 tests (depth-audit hermetic suite extension)
- File count: 0 new + ~6 modified (`tools/depth-audit.mjs` / `tools/__tests__/depth-audit.test.mjs` / `.planning/missions/template-files/W2-build-agent-prompt.md` / `tools/render-claude-md/env-vars.json` / `vitest.tools.config.mjs` / `CLAUDE.md`) + 4 manifest version bumps + 5 new release-notes files = 15 files in commit
- No engine state advance; no per-degree dirs touched; no FTP sync to tibsfox.com required (v602 hot-fix already ground truth; v603 just ratifies the deterministic gate)
- No www/ uploads needed; no catalog-index updates needed (v601 gate already PASS at G3)

## Next milestone projection

v1.49.604 will likely be a NASA-degree milestone (1.82 — Apollo 16 candidate; chronologically next iconic-mission after Apollo 15 J-mission per #10231 graceful-thinness ESTABLISHED watch). Pre-tag-gate runs 8 steps with 3 sub-checks under step 6; step 6 track-card-coverage + nav-card-presence sub-checks fire as a W2 cross-track refresh discipline check. If W2 build agents follow the new HARD RULE section in the template (canonical 8 Track cards + bottom-of-content nav-card), step 6 PASS at G3 is automatic; if not, step 6 BLOCKS the ship until they are. The class of silent drift that 1.76–1.81 fell to is now closed.

The Apollo 16 milestone will also be observation #4 confirming-soak for #10244 (counter-cadence-on-post-ship-discovery) ESTABLISHED — engine-cadence resumption after v603's counter-cadence; the pattern's engine-cadence/counter-cadence interaction is exercised cleanly. If a 4th counter-cadence emerges over the next ~10 milestones in response to a different drift class, that becomes observation #4 for #10244 in the active direction. If no 4th counter-cadence emerges, #10244 reaffirms in nominal direction at every engine-cadence ship.

The §6.6 watchlist activity at Apollo 16 is the projected resolution moment for several v602-substrate candidates: Descartes Highlands site selection should provide 2-ex confirmation for GEOLOGICAL-STRATIGRAPHY-AS-SCIENCE-DRIVER (highlands-stratigraphy site selection); LRV-2 deployment should provide 2-ex confirmation for FIELD-VEHICLE-MOBILITY; SIM bay redeployment should provide 2-ex confirmation for ORBITAL-SCIENCE-AS-INDEPENDENT-MISSION; the J-mission ~71-hour surface stay (vs. Apollo 15's ~67 hours) should provide 2-ex confirmation for EXTENDED-STAY-DOCTRINE. The §6.6 register may grow from 23 to 27 if all four candidates admit at v604 G2.

But that's v604+. v603 closes here, with the gate stack two sub-checks richer, the env-var set one entry richer, and the lessons table one ESTABLISHED + one CANDIDATE richer. The engine cadence resumes at v604.
