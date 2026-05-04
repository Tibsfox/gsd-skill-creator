# v1.49.603 — Summary

## Structural firsts

1. **Third counter-cadence operational-debt milestone** (after v1.49.585 Concerns Cleanup and v1.49.601 Catalog-Index Auto-Derive). Three instances reproducibly stable across three distinct structural-canonical drift classes. The counter-cadence-on-post-ship-discovery pattern reaches **observation #3** at v603 — the standard 3-instance promotion threshold. Lesson #10244 PROMOTES to ESTABLISHED at G3.
2. **First counter-cadence ship triggered by 6-consecutive-milestone drift accumulation.** The previous counter-cadences (v585 + v601) were triggered by drift classes that spanned 4 milestones (v582–v585) and 3 milestones (v598–v600) respectively. v603 is triggered by drift across 6 consecutive milestones (1.76 Apollo 12 / 1.77 Apollo 13 / 1.78 Apollo 14 / 1.79 Mariner 8 / 1.80 Mariner 9 / 1.81 Apollo 15 — all six post-v596 NASA degrees). The longer-soak signal demonstrates that prose discipline alone does not arrest drift accumulation; only a deterministic gate does.
3. **First sub-check extension under an existing pre-tag-gate step rather than a new step number.** v585 introduced the gate (4 steps); v587 added two new steps (CI-on-dev + www-bundles); v591 added one new step (depth-audit BLOCKER); v596 added one new step (CLAUDE.md drift); v601 added one new step (catalog-index drift, step 8). v603 extends step 6's sub-check count from 1 to 3 without adding a new step. The composite step count stays at 8; the depth-audit's internal scope grows. This composition pattern is structurally distinct from the prior counter-cadences and validates that the gate stack can grow horizontally (more checks per step) as well as vertically (more steps).
4. **First milestone where the new sub-check fixtures are calibrated against on-disk pre-hot-fix evidence.** The v603 hermetic test fixtures explicitly mirror the pre-hot-fix state of v1.76 (4 cards + 0 nav-card → BLOCKER), v1.77 (0 cards → BLOCKER), and v1.78/1.80/1.81 (6 cards → WARN). The fixtures are not synthetic; they are what the live site looked like before the operator hot-fix. This grounds the threshold ladder (8/8 PASS / 6-7 WARN / <6 BLOCKER) in observed drift evidence rather than theoretical reasoning.
5. **First milestone where retroactive sweep surfaces pre-gate-existence drift at earlier degrees.** Running the new gate against the full repo (1.0 through 1.81) surfaces 4 historical drifts at 1.34 / 1.36 / 1.57 / 1.75 that pre-date the gate's existence. These are documented as known-historical without ship-blocking — the gate runs against `--current` only by design. The historical drift becomes carry-forward for v604+ operator decision (retroactive cleanup vs. accept-as-is).
6. **First milestone to ratify a forward-lesson candidate at G3 alongside the work that produces the third instance.** The #10244 candidate was emitted at v601 close; observation #2 noted at v601; observation #3 reached at v603 ship. The G3 lab-director gate's quality-bar evaluation includes the ratification check; the operator authorization includes the promotion ratification. This couples lesson-promotion to ship-gate atomically — no separate "lessons-roundup" milestone is required.

## Engine state at close

- **NASA degree:** 1.81 (Apollo 15; carries forward from v602)
- **MUS degree:** 1.81 (*Who's Next* / The Who; carries forward)
- **ELC degree:** 1.81 (Earthwatch Institute founding; carries forward)
- **SPS species:** #78 (American Pika; carries forward)
- **§6.6 register:** 23 LOCKED (5 carryforward watchlist + 4 new 1.81-substrate candidates — all carry forward unchanged)
- **TRS substrate:** M1 W2 pack-12 binding pass complete (carries forward; next-pack binding deferred to v604+ W0)
- **vitest:** ~29,504 tests (~29,494 baseline from v602-stable + ~10 new depth-audit hermetic cases)
- **Pre-tag-gate:** 8 steps; step 6 sub-check count grows from 1 to 3
- **Operational env vars:** + `SC_SKIP_TRACK_CARDS_GATE` (emergency-only)
- **Lesson #10244:** PROMOTED to ESTABLISHED (CANDIDATE → ESTABLISHED at observation #3)

## Phase summary

4 phases (W0 open + scaffold · W1 gate authoring · W2 template + docs update · W3 verification · W4 ship). 14 deliverable items, all PASS at G3. Total wall-time ~2.5h end-to-end (substantially smaller than NASA-degree milestones because no engine-state work; comparable in shape to v1.49.601's ~1.5h). The slight envelope expansion vs. v601 reflects two added work surfaces — the W2 template HARD RULE section and the retroactive sweep — that v601 did not exercise.

## Files changed

| Path | Change | Approx. lines |
|---|---|---|
| `tools/depth-audit.mjs` | extended NASA pillar with track-card-coverage + nav-card-presence sub-checks | ~150 line delta |
| `tools/__tests__/depth-audit.test.mjs` | new test cases (10) + fixture authoring | ~250 line delta |
| `.planning/missions/template-files/W2-build-agent-prompt.md` | new HARD RULE section enumerating canonical 8 Track cards + nav-card | ~40 line delta |
| `tools/render-claude-md/env-vars.json` | add `SC_SKIP_TRACK_CARDS_GATE` | 1 entry |
| `vitest.tools.config.mjs` | confirm test file inclusion | 0–1 line |
| `CLAUDE.md` | gates table + env vars table + step 6 sub-check enumeration | ~30 line delta |
| `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` | atomic version bump 1.49.602 → 1.49.603 | 5 version slots |
| `docs/release-notes/v1.49.603/{README,chapter/00,chapter/03,chapter/04,chapter/99}.md` | new release-notes 5-file structure | ~5 files |

NASA per-degree `index.html` files are NOT modified at v603 — the operator hot-fix at v602+1 is already ground truth and has been verified by the new gate's first invocation. No www/ uploads required at v603 ship; no FTP sync needed; the catalog-index files (v601's gate surface) are also unaffected.

## Drift inventory (the six-degree before/after table)

The following table records the structural-canonical drift state across NASA degrees 1.76 through 1.81 immediately post-v602 (before operator hot-fix) and post-hot-fix (the state the v603 gate validates against). The before-state is the BLOCKER/WARN-fixture calibration target; the after-state is the PASS-fixture calibration target.

| Degree | Mission | Track cards (before / after) | Nav-card (before / after) | Hot-fix scope |
|---|---|---|---|---|
| 1.76 | Apollo 12 Pinpoint Landing (v1.49.595) | 4 / 8 | absent / present | card-grid expansion + nav-card insertion |
| 1.77 | Apollo 13 Successful Failure (v1.49.596) | 0 / 8 | absent / present | full scaffolding insertion |
| 1.78 | Apollo 14 Fra Mauro (v1.49.598) | 6 / 8 | absent / present | cross-track binding cards (6/7) + nav-card |
| 1.79 | Mariner 8 Centaur Failure (v1.49.599) | 0 / 8 | absent / present | substantive rebuild + full scaffolding |
| 1.80 | Mariner 9 First Planet Orbit (v1.49.600) | 6 / 8 | absent / present | cross-track binding cards + nav-card |
| 1.81 | Apollo 15 First Lunar Rover (v1.49.602) | 6 / 8 | absent / present | cross-track binding cards + nav-card |

The non-uniformity of the drift pattern (4 / 0 / 6 / 0 / 6 / 6 cards before hot-fix) is itself diagnostic — this is not one author's typo or one milestone's oversight but a class of structural drift that emerges naturally when prose discipline lacks deterministic enforcement. The new gate eliminates the class.

## Historical-drift sweep at gate introduction

Running the new gate against the full repo (NASA degrees 1.0 through 1.81) surfaces 4 pre-existing historical drifts at degrees that pre-date the gate's existence:

| Degree | Track cards | Nav-card | Disposition |
|---|---|---|---|
| 1.34 | (count) | (presence) | known-historical; carry-forward to v604+ operator decision |
| 1.36 | (count) | (presence) | known-historical; carry-forward |
| 1.57 | (count) | (presence) | known-historical; carry-forward |
| 1.75 | (count) | (presence) | known-historical; carry-forward |

These are NOT hot-fixed at v603. The gate runs against `--current` semantics; pre-gate drift is documented but does not block the v603 ship. The new candidate **#10245** (historical-drift-sweep-at-gate-introduction) captures the pattern: when introducing a new gate, the retroactive sweep is a transparency measure, not a remediation pass; the appropriate counter-cadence response is to surface findings and let the operator schedule cleanup at a separate counter-cadence rather than expanding the gate-introduction milestone scope.
