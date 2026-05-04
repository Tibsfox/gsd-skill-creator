# v1.49.603 — Research-Track-Cards + Nav-Card Drift Gate Counter-Cadence

**Type:** Counter-cadence operational-debt milestone (matches v1.49.585 + v1.49.601 pattern). **No engine state advance.** Converts Research-Track-card grid + bottom-of-content nav-card structural drift surfaced post-v602 ship across NASA degrees 1.76 through 1.81 from prose discipline into a deterministic depth-audit sub-check pair.
**Shipped:** 2026-05-04 (pending operator G3 authorization).
**Tagged:** v1.49.603 (pending).
**GitHub release:** pending.
**Predecessor:** v1.49.602 — Apollo 15 First Lunar Roving Vehicle (NASA degree 1.81; shipped 2026-05-04, tag `v1.49.602` / commit `81cfe009f` / post-ship-sync main `b23dd1f54`).
**Predecessor counter-cadence:** v1.49.601 — Catalog-Index Auto-Derive Counter-Cadence (immediate-prior counter-cadence; closed `bea614fd5`).
**First-instance counter-cadence:** v1.49.585 — Concerns Cleanup / Foundation Shoring (closed 2026-04-28).
**Dedication:** the operator — who caught the structural-canonical drift on the live site across six consecutive NASA degrees, hot-fixed all six in-place, and authorized the deterministic gate-extension that prevents recurrence; this milestone exists because human-in-the-loop pattern recognition spotted what the existing 8-step pre-tag-gate composite did not catch.
**Engine Position:** unchanged (NASA 1.81 / MUS 1.81 / ELC 1.81 / SPS #78 / TRS M1 W2 pack-12 / §6.6 register 23 LOCKED).

## What this milestone is

A counter-cadence operational-debt ship — **no engine state advance** (NASA / MUS / ELC / SPS / §6.6 register / TRS substrate all carry forward unchanged from v602 close). The milestone exists to convert one specific class of silent-drift failure into a deterministic gate.

The drift class: the Research Track card grid (canonical 8 cards — Track 1a / 1b / 2 / 3 / 4 / 5 / 6 / 7) and the bottom-of-content nav-card carrying prev/next degree links are content-independent structural-canonical scaffolding elements. They were established at the v1.74 gold-standard layout and the v1.69 + v1.70 reference-depth examples. Every NASA degree should carry all 8 cards and a nav-card regardless of mission complexity, regardless of substrate richness, regardless of W2 author identity. The depth-audit at `tools/depth-audit.mjs` was checking content-coverage (NASA canonical sections via 7 regex h2 headers, artifact suite count, cross-link coverage) but **not** scaffolding-presence. Across six consecutive NASA degrees (1.76 Apollo 12 / 1.77 Apollo 13 / 1.78 Apollo 14 / 1.79 Mariner 8 / 1.80 Mariner 9 / 1.81 Apollo 15), the scaffolding drifted silently in every single instance with no gate firing. The drift was caught by the operator browsing the live site post-v602.

This milestone fixes the class deterministically.

## What ships

**1. Two new sub-checks under `tools/depth-audit.mjs` (NASA pillar).**

The depth-audit's NASA pillar gains two content-independent sub-checks composed under the existing depth-audit BLOCKER mode at pre-tag-gate step 6 (the step number stays at 6; sub-check count grows from 1 to 3):

- **track-card-coverage** — counts unique occurrences of the canonical 8 Track strings (`Track 1a` / `Track 1b` / `Track 2` / `Track 3` / `Track 4` / `Track 5` / `Track 6` / `Track 7`) in each per-degree `index.html`. PASS at 8/8; WARN at 6 or 7 (partial-grid drift; advisory); BLOCKER at <6 (total or near-total scaffolding drift).
- **nav-card-presence** — counts occurrences of the literal `nav-card` class string in each per-degree `index.html`. PASS at ≥1; BLOCKER at 0 (binary; no WARN band).

Both sub-checks are NASA-only — MUS and ELC use a different structural grammar that does not carry the Track card / nav-card conventions; the sub-checks intentionally do not extend into those tracks.

**2. `SC_SKIP_TRACK_CARDS_GATE` env-var override.**

Mirrors the existing `SC_SKIP_DEPTH_AUDIT` / `SC_SKIP_CATALOG_INDEX_GATE` / `SC_SKIP_CLAUDE_MD_GATE` env-var convention. Single-value boolean; env-set bypasses both new sub-checks; documented in CLAUDE.md env-vars table; emergency-only by convention.

**3. 10 hermetic test cases at `tools/__tests__/depth-audit.test.mjs`.**

Test fixtures cover:
- gold fixture (8/8 cards + 1 nav-card → both PASS),
- drift fixture matching v1.77 pre-hot-fix (0 cards + 0 nav-card → both BLOCKER),
- drift fixture matching v1.76 pre-hot-fix (4 cards + 0 nav-card → both BLOCKER),
- drift fixture matching v1.78 pre-hot-fix (6 cards + 0 nav-card → track-card-coverage WARN + nav-card-presence BLOCKER),
- boundary fixture at 7 cards (7 unique tracks + nav-card present → track-card-coverage WARN + nav-card-presence PASS),
- nav-card-absent fixture (8 cards + 0 nav-card → track PASS + nav BLOCKER),
- override fixture (drift content + `SC_SKIP_TRACK_CARDS_GATE=1` → both bypass),
- `--strict` mode fixture (WARN escalates to BLOCKER under strict),
- human-format fixture (text output renders cleanly for terminal use),
- MUS+ELC scope fixture (sub-checks do not run on MUS/ELC pillars — out-of-scope is honored).

**4. W2 build-agent-prompt template HARD RULE section.**

`.planning/missions/template-files/W2-build-agent-prompt.md` gains a new HARD RULE section enumerating the canonical 8 Research Track cards + bottom-of-content nav-card as scaffolding requirements. The rule is MANDATORY for all future W2 NASA build agents and is positioned alongside the existing #10243 cross-sibling-read patch from v600 close + v602 first-MANDATORY-application. Both rules apply to every W2 NASA build agent; neither subsumes the other.

**5. CLAUDE.md updates.**

Operational-gates table: new row for the depth-audit track-card-coverage + nav-card-presence sub-checks; cites v1.49.603 as gate-introduction; documents BLOCKER + WARN behavior; cites override env var. Env-vars table: new row for `SC_SKIP_TRACK_CARDS_GATE`. Pre-tag-gate step 6 description: updated to reflect the three sub-checks now composed under the single step; step number unchanged.

**6. Retroactive sweep documented.**

After the new sub-checks land, ran `node tools/depth-audit.mjs --current` against the post-hot-fix repo state. Result: all 6 of the affected degrees (1.76 through 1.81) PASS the new sub-checks (8/8 Track strings + ≥1 nav-card per page). The retroactive sweep also surfaced 4 historical pre-existing track-card drifts at degrees 1.34 / 1.36 / 1.57 / 1.75 that pre-date the gate's existence. These are NOT hot-fixed at v603 — the gate runs against `--current` only by design (per `tools/depth-audit.mjs` semantics), so historical pre-gate drift is not ship-blocking. The historical drift is documented as known-historical for transparency; operator decision at v604+ on whether to schedule a retroactive cleanup pass.

## Through-line

> *Catch the structural-canonical drift class by extending depth-audit beyond content-coverage to include card-and-nav scaffolding.*

Six consecutive NASA degrees (v596 Apollo 12 through v602 Apollo 15) shipped without their canonical 8-card Research-Track grid + nav-card — without any gate firing. The operator caught it on the live site. v603 makes it impossible for that class of drift to ship again on engine-cadence milestones without operator override.

## Hard rules + gates

- dev-branch only (HARD RULE).
- pre-tag-gate (still **8 steps**; step 6 sub-check count grows from 1 to 3): build PASS / vitest PASS / completeness PASS / CI-on-dev verification at ship / www-bundles / depth-audit (now per-file depth-vs-predecessor + track-card-coverage + nav-card-presence) / CLAUDE.md drift / catalog-index drift.
- ship-sync after main-merge (Lesson #10221 ESTABLISHED).
- No Claude co-author trailers.
- Engine state preservation HARD RULE for counter-cadence milestones — verified at G3.

## #10244 PROMOTE-to-ESTABLISHED at observation #3

v603 is the third counter-cadence ship after v585 + v601. Three instances spanning three distinct drift classes:

- **v585** — self-mod-guard + git-add-blocker + chapter-idempotent + pre-push completeness gate + citation-invariants test (foundation shoring; PreToolUse hook surface + vitest test surface)
- **v601** — catalog-index auto-derive (NASA Set + MUS/ELC reference comparison; pre-tag-gate composite step 8 + ftp-sync precondition surface)
- **v603** — Research-Track-Cards + nav-card depth-audit extension (depth-audit sub-check surface + W2 build-agent-prompt template surface)

Three instances reproducibly stable across three structural-canonical drift classes. **#10244 PROMOTES to ESTABLISHED at G3.** The counter-cadence-on-post-ship-discovery pattern is now a documented standing operational practice.

## Engine-state preservation table

| Track | v1.49.602 close | v1.49.603 close | Delta |
|---|---|---|---|
| NASA degree | 1.81 (Apollo 15) | 1.81 (Apollo 15) | unchanged |
| MUS degree | 1.81 (*Who's Next* / The Who) | 1.81 | unchanged |
| ELC degree | 1.81 (Earthwatch Institute founding) | 1.81 | unchanged |
| SPS species | #78 (American Pika) | #78 | unchanged |
| §6.6 register | 23 LOCKED (5 carryforward + 4 new 1.81 candidates) | 23 LOCKED | unchanged |
| TRS substrate | M1 W2 pack-12 binding pass complete | (same) | unchanged |
| `tools/depth-audit.mjs` sub-checks | 1 (per-file depth-vs-predecessor) | **3 (existing + track-card-coverage + nav-card-presence)** | **+2** |
| Operational env vars | existing 8 | **+ `SC_SKIP_TRACK_CARDS_GATE`** | **+1** |
| Lesson #10244 | observation #2 (CANDIDATE) | **observation #3 (ESTABLISHED at G3)** | **PROMOTED** |
| vitest test count | 29,494 (v601 baseline) post-v602-stable | **~29,504** | +10 (new depth-audit hermetic cases) |

## Pre-tag-gate state at v603 close

Composite gate runs 8 steps; the sub-check count under step 6 grows from 1 to 3 (per-file depth-vs-predecessor + new track-card-coverage + new nav-card-presence). No new step number is added because v601's catalog-index gate already took step 8; v603's gate composes under the existing depth-audit step rather than introducing step 9.

| Step | Check | Status at v603 close |
|---|---|---|
| 1 | `npm run build` | PASS |
| 2 | `npx vitest run` | PASS (~29,504 tests) |
| 3 | `check-completeness.mjs --current --strict` | PASS (5-file structure) |
| 4 | CI-on-dev verification | PASS |
| 5 | www-bundles esbuild | PASS (no www changes at v603) |
| 6 | depth-audit (3 sub-checks) | PASS (incl. new track-card-coverage + nav-card-presence) |
| 7 | CLAUDE.md drift | PASS |
| 8 | catalog-index drift | PASS |

## Carry-forward to v604+

- v602 carry-forward items continue: 5+4 §6.6 watchlist candidates · #10238 still DEFERRED · #10240 still DEFERRED · #10241 lookback at first paired-mission ship · #10243 RESOLVED with continuing soak.
- New: 4 historical track-card drifts surfaced by retroactive sweep (1.34 / 1.36 / 1.57 / 1.75) — operator decision at v604+ on whether to schedule retroactive cleanup pass.
- New candidate **#10245** — historical-drift-sweep-at-gate-introduction pattern; soak through v604+ for promotion.
- Engine cadence resumes at v604+ (next NASA-degree milestone candidate; gate validates on first engine-cadence run after v603 ratification).
- TRS M1 W2 next-pack binding pass deferred to v604+ W0 (counter-cadence preserves TRS substrate; next pack TBD pending fresh fetch-chain status review).

See `chapter/` for detailed retrospective + lessons + engine-state context.
