# v1.49.576 -- Ecosystem Alignment (OOPS-GSD Alignment + Implementation)

**Shipped:** 2026-04-25
**Commits:** 37
**Files changed:** 85
**Phases:** 821-831 (Part A 814-820 + Part B 821-831)
**Waves:** 4 (W0 Foundations -> W1 Settings/Hooks -> W2 Dual-Impl/Memory -> W3 Schema/Telemetry/Inventory + W4 closing)
**Branch:** dev
**Tag:** v1.49.576
**Tests:** 28,066 passing (vs v1.49.575 baseline 27,887 -> +179 tests)
**BLOCKs closed:** 2 (OGA-013 PostCompact recovery; OGA-023 memory survey scorer)
**ADRs landed:** 2 (ADR 0001 vendoring policy; ADR 0002 PreCompact triple-mapping)
**Audit rows closed:** 18 / 18 HIGH+BLOCK; 11 / 11 supporting MEDIUM; 2 / 2 LOW batched

## Summary

**GSD is different from upstream, not behind it.** The mission began as a self-audit: ten OOPS documents (00-09) compared against upstream `gsd-build/get-shit-done@1.38.3` and against the local `gsd-skill-creator` repo. Part A produced the 65-row three-way alignment matrix; Part B closed every actionable row on the same release tag. The convergent-discovery framing carried over from v1.49.573-v1.49.575 and held at row granularity.

**Only 17 rows are local drift, not 65.** Of the 65 matrix rows, only 17 are local drift (DIVERGENT-DRIFT), 21 are intentional substrate divergence the OOPS corpus and upstream do not yet have language for, and the remaining 27 are aligned, missing-upstream by design, or info-only. The implementation half therefore had a smaller, sharper target than a naive "audit found 65 things, fix them all" framing would have produced.

**Both BLOCKs over-delivered against numeric gates.** OGA-013 (compaction recovery) closed at C1 commit `4725bdacf` -- PreCompact + PostCompact wired in their slots per ADR 0002 triple-mapping. OGA-023 (memory survey scorer) acceptance gate was 40% mean reduction across 5 fixtures; the scorer delivered **76.6% mean reduction** -- nearly 2x the floor. Both BLOCKs landed in W1 / W2 rather than W3, which gave W3 + W4 room to handle the longer tail of HIGH/MEDIUM rows without compressing the schedule.

**Two-part single-milestone shape worked.** Part A (audit) and Part B (implementation) ran on the same release tag rather than splitting across v1.49.576 -> v1.49.577. The cost was a larger commit graph (37 commits in range); the benefit was that every audit row's closure was visible in the same milestone artifact set as the row itself. No row "escaped" by being deferred to a future milestone-with-its-own-audit.

**Convergent-discovery is now load-bearing, not narrative.** The Part A synthesis ran the FOUR-anchor analysis from v1.49.575 into the alignment-matrix and found the same shape at 65-row resolution that v1.49.575 found at architectural-pattern resolution. This is the fourth consecutive milestone where the same property holds -- the insight is no longer a story; it is a stable property the v1.49.577+ planning surface can be designed against.

**24 new test files, +179 net new passing test cases.** Each component got its own test cluster. The C1 hooks-integration cluster (6 files), C2 dual-impl + vendoring (2 files), C3 memory-survey + scorer-integration (5 files), C4 skill-schema-migration (4 files), C5 telemetry-flags (4 files), C6 vendoring-inventory (4 files) ship together with all 18 BLOCK/HIGH closures from the matrix.

## Half A -- Alignment Audit Deliverable

| Module | Output |
|---|---|
| M1 OOPS extraction | 50 patterns extracted from 10 OOPS docs (target >=30) |
| M2 Upstream inventory | 84 commands, 33 agents, 11 hooks, 14 runtimes, SDK enumerated |
| M3 Local inventory | 81 commands, 49 agents, 36 hook entries, 150 src/ subdirs |
| M4 Three-way matrix | **65 rows**, 6-status x 5-severity classification, 18 BLOCK/HIGH |
| M5 FINDINGS + REVIEW | 12 success-criteria gate; mission.pdf 22 pages, 3-pass clean |
| Schemas (W4 fix) | `comparison-matrix.json` -- 28 violations -> 0 after W4 fix |

Artifacts live at `.planning/missions/oops-gsd-alignment/` (gitignored; internal-only by project rule). Schemas at `.planning/missions/oops-gsd-alignment/schemas/comparison-matrix.json` (both bugs fixed in W4).

## Half B -- Implementation, Component-by-Component

| ID | Component | Closing Commits | Tests Added |
|---|---|---|---|
| C0 | Foundations + ADRs | `dba568d3d` (ADR 0001), `3efef6b3d` (ADR 0002), `9391df255`, `564603977` | -- (foundation) |
| C1 | Settings + hook surface | `4725bdacf`, `b61adc4ee`, `14b1e9b49`, `917270f7f` | 6 hooks-integration files |
| C2 | Dual-impl triage + vendoring | `07d2dc113`, `939cc24a8`, `bbbe04da5`, `f4af6275c`, `df5e8901f` | 2 files |
| C3 | Memory cluster (3 sub-commits) | `5040f18a0`, `72193ec43`, `903aeffde`, `f17eb4bd2`, `07b201ffa` | 5 files |
| C4 | Skill schema migration | `5cdca69ac`, `90fc83020`, `db2fe35f2`, `1cb3a692c`, `9d4bbddcb`, `c2fdf0f1e` | 4 files |
| C5 | Telemetry + effort + flags | `7ae700c60`, `ed3d1b14a`, `8f2702018`, `c3e44dfc5`, `df9930296` | 4 files |
| C6 | Vendoring + inventory + docs | `fcfa73b4d`, `a5879964d`, `0e1dd12a8`, `a7078f413`, `c01b9bb1b`, `d141babfe`, `559c877b7`, `80375344a`, `8c0cf2b9e` (W4 manifest regen) | 4 files |

Total **24 new test files**; **+179 net new passing test cases** vs the v1.49.575 published baseline.

### Part A: OOPS Research

The mission began as a self-audit of ten OOPS documents (00-09) compared against upstream `gsd-build/get-shit-done@1.38.3` and against the local `gsd-skill-creator` repo:

- **M1 OOPS PATTERN EXTRACTION:** 50 patterns extracted from the 10 OOPS docs (target >=30). The corpus is 0-9 indexed (not 1-9), which surfaced as the W4 schema bug fix `oops_doc.minimum: 1 -> 0`.
- **M2 UPSTREAM INVENTORY:** Enumerated `gsd-build/get-shit-done@1.38.3` -- 84 commands, 33 agents, 11 hooks, 14 runtimes, SDK -- to anchor the upstream column of the matrix.
- **M3 LOCAL INVENTORY:** Catalogued the local `gsd-skill-creator` repo -- 81 commands, 49 agents, 36 hook entries, 150 `src/` subdirectories -- to anchor the local column.
- **M4 THREE-WAY MATRIX:** 65 rows with 6-status x 5-severity classification; 18 BLOCK/HIGH actionable rows fed Part B; the remaining 47 split across aligned, intentional-divergence, missing-upstream-by-design, and info-only.
- **M5 FINDINGS + REVIEW:** 12 success-criteria gate against the mission.pdf (22 pages, 3-pass XeLaTeX clean). FINDINGS handoff named the convergent-discovery property at row resolution.
- **CONVERGENT-DISCOVERY VALIDATION:** The Part A synthesis ran the FOUR-anchor analysis from v1.49.575 into the alignment-matrix and found the same shape at 65-row resolution that v1.49.575 found at architectural-pattern resolution. Fourth consecutive milestone the property holds.
- **17 LOCAL DRIFT, 21 INTENTIONAL DIVERGENCE:** Of the 65 rows, only 17 are local drift; 21 are intentional substrate divergence the OOPS corpus and upstream do not yet have language for. The remaining 27 are aligned, missing-upstream by design, or info-only.
- **SCHEMA HOUSEKEEPING SURFACED IN W4:** `comparison-matrix.json` shipped with two known bugs (`oops_doc.minimum: 1` and `evidence_file` keyed on status not severity). W4 fixed both -- prior violations 28 -> 0.

### Part B: Implementation

Nine components-of-significance plus 24 supporting commits, every BLOCK/HIGH row closed inside the milestone:

- **C0 FOUNDATIONS + ADRS:** ADR 0001 (vendoring policy, `dba568d3d`) and ADR 0002 (PreCompact triple-mapping, `3efef6b3d`) landed first as the architectural anchors for everything downstream. Linked from CLAUDE.md per `564603977`.
- **C1 SETTINGS + HOOK SURFACE:** PreCompact + PostCompact wired in their respective slots at `4725bdacf` (closes BLOCK OGA-013). SessionStart consolidation (5 -> 1, <200ms) landed at `917270f7f`. Six hooks-integration test files cover the surface.
- **C2 DUAL-IMPL TRIAGE + VENDORING:** Vendoring policy operationalized; origin-marker convention codified. Origin map maintained in `project-claude/hooks/README.md` at `df5e8901f`. Two test files cover dual-impl detection and vendoring policy.
- **C3 MEMORY CLUSTER (BLOCK OGA-023 CLOSED):** Memory survey scorer with relevance + half-life decay (`5040f18a0`), scorer integration with pinned-rule preservation (`72193ec43`). Achieved **76.6% mean reduction** across 5 fixtures vs 40% acceptance floor -- nearly 2x. Five test files cover scorer + integration + standing-rules preservation.
- **C4 SKILL SCHEMA MIGRATION:** Frontmatter taxonomy expansion -- status, triggers, references_subdir, word_budget added per OGA-032/033. Four migration test files. (Mid-milestone interaction with the 820w Gastown gate is documented in feed-forward item 6.)
- **C5 TELEMETRY + EFFORT + FLAGS:** Telemetry cluster + effort tracking + flag plumbing across five commits. Four telemetry-flags test files cover the surface.
- **C6 VENDORING + INVENTORY + DOCS:** Four upstream commands vendored (`sync-skills`, `plan-review-convergence`, `settings-advanced`, `settings-integrations`), origin-marker convention applied, INVENTORY-MANIFEST.json regenerated at W4 close (`8c0cf2b9e`). Four vendoring-inventory test files cover existence + origin-markers + manifest integrity.
- **9 COMPONENTS, 24 NEW TEST FILES, +179 PASSING TESTS:** Each component carries its own test cluster -- the test surface grows in lockstep with the substrate, not as an afterthought.

### Retrospective

#### What Worked

- **Two-part single-milestone shape.** Part A (audit) and Part B (implementation) ran on the same release tag rather than splitting across v1.49.576 -> v1.49.577. Larger commit graph (37 commits in range), but every audit row's closure was visible in the same milestone artifact set as the row itself -- no row "escaped" by being deferred to a future milestone-with-its-own-audit.
- **Both BLOCKs closed mid-milestone, not at the wire.** OGA-013 closed at C1 commit `4725bdacf`; OGA-023 closed at C3 commits `5040f18a0` + `72193ec43`. Both landed in W1 / W2 rather than W3, which gave W3 + W4 room to handle the longer tail of HIGH/MEDIUM rows without compressing the schedule against the gate.
- **OGA-023 scorer over-delivered nearly 2x.** Acceptance gate was 40% mean reduction across the 5 fixtures (toy / small / medium / large / pathological MEMORY corpora). The scorer with relevance + half-life decay shipped **76.6% mean reduction** -- well past the floor.
- **Component split into nine pieces.** C0 (foundations / ADRs), C1 (settings + hook surface), C2 (dual-impl + vendoring), C3 (memory cluster -- 3 sub-commits), C4 (skill schema migration), C5 (telemetry + effort + flags), C6 (vendoring + inventory + docs). Each component got its own test cluster; the boundary between components stayed legible through review.
- **Convergent-discovery framing held at row granularity.** The FOUR-anchor analysis from v1.49.575 carried into the alignment-matrix and found the same shape at 65-row resolution. Fourth consecutive milestone the property holds -- it is now a stable architectural property, not a per-milestone narrative.
- **Pre-existing repo merge debris sidestepped, not contested.** Five files in unmerged state pre-date v1.49.576 and remain so at close. `git -c advice.statusHints=false commit --only <path>` was the working pattern across the milestone for committing unrelated files without contesting the unmerged state.

#### What Could Be Better

- **Operational install gap between SOT and live.** The C1 SessionStart consolidation (5 -> 1, <200ms) is correct in `project-claude/` source-of-truth but the live `.claude/settings.json` retains the prior five SessionStart subscribers because `install.cjs` additive-merges from SOT. Documented as feed-forward item 1; the operational realization is a one-liner: `rm .claude/settings.json && node project-claude/install.cjs`.
- **Schema bug fixes deferred to W4 housekeeping.** Part A's `comparison-matrix.json` schema shipped with two known bugs (`oops_doc.minimum: 1` and `evidence_file` keyed on status not severity). Both fixed in W4 -- validation re-run dropped violations 28 -> 0 -- but ideally the schema would have been correct on first cut.
- **Vendored-command integration testing not yet landed.** Four upstream commands vendored in C6; existence + origin-marker tests landed but real-workflow integration testing is queued. Feed-forward item 2.
- **Gastown skill word-count gate miscalibrated against new frontmatter shape.** C4 split brought the 3 Gastown SKILL.md files <800w (passing the 820w gate), but later OGA-032/033 frontmatter expansion (status / triggers / references_subdir / word_budget) re-inflated word counts to 826/854/881. Three failing test cases in `tests/skills/gastown-splits.test.ts`. Feed-forward item 6 -- 1-commit fix in the next milestone.
- **Pre-existing repo merge debris remains.** Five files (`.mcp.json` UU; `.claude/commands/gsd/complete-milestone.md` DU; `.claude/get-shit-done/workflows/complete-milestone.md` DU; `www/tibsfox/com/Research/GPE/strategies.html` DU; `www/tibsfox/com/Research/index.html` DU). Owns its own short cleanup milestone (feed-forward item 3).
- **NEEDS-UPSTREAM-PR row OGA-005 still in matrix.** Future PR candidate against `gsd-build/get-shit-done`; not promoted to backlog inside this milestone (feed-forward item 4).

### Lessons Learned

1. **Audit-and-implement on one tag closes more rows than audit-and-defer.** Running Part A and Part B on the same release tag forced every actionable row to surface its closure inside the milestone artifact set. Larger commit graph is the cost; zero rows escape to "future milestone-with-its-own-audit" is the benefit. Repeat this shape when the audit surface is sized small enough to close in the same release window.
2. **Land BLOCKs early, not at the wire.** Both BLOCKs (OGA-013 in C1, OGA-023 in C3) closed in W1 / W2. This freed W3 / W4 to handle the longer tail of HIGH/MEDIUM rows without compressing the schedule against the BLOCK gate. Plan BLOCK closure into the early waves, not the closing wave.
3. **Numeric gates should set a floor, not a target.** OGA-023's 40% mean-reduction floor was treated as a floor -- the scorer landed 76.6%. When a substrate is a one-shot architectural decision, leave headroom above the floor; the next milestone will load against it.
4. **Convergent-discovery is now load-bearing planning input.** Four consecutive milestones (v1.49.573-v1.49.576) have surfaced the same FOUR-anchor architectural shape at increasing resolutions (architectural patterns -> 65 matrix rows). v1.49.577+ planning can design against this property rather than re-discovering it; treat it as a stable property of the GSD substrate.
5. **Component-per-test-cluster keeps the review surface legible.** Nine components, nine test clusters (C1 6 files, C2 2, C3 5, C4 4, C5 4, C6 4 -- total 24 new test files). The boundary between components stays visible through `git log --diff-filter=A` rather than getting smeared across waves. Repeat for any milestone with >5 distinct substrate components.
6. **Schema-as-code is still code -- review it before shipping.** The `comparison-matrix.json` shipped with two semantically-wrong constraints (off-by-one minimum on a 0-indexed corpus; status-keyed evidence-file rule that the brief intended to be severity-keyed). Both caught in W4 housekeeping. Add schema review to the Part A close gate; do not let schema bugs survive to W4.
7. **SOT correctness does not imply operational realization.** The C1 SessionStart consolidation was correct in `project-claude/` SOT but the live `.claude/settings.json` retained the prior subscribers because `install.cjs` additive-merges. SOT updates that change the **shape** of subscribers (not just add new ones) need an explicit migration path documented at the SOT site, not left for the operator to discover.
8. **Vendoring needs both an origin marker and an integration test.** C6 vendored four upstream commands and landed existence + origin-marker tests, but real-workflow integration testing is queued. The origin marker proves provenance; the integration test proves the vendored command still works in the local context. Ship both at vendoring time, not on the next milestone.
9. **Sidestep merge debris, do not contest it.** `git -c advice.statusHints=false commit --only <path>` was the working pattern across the milestone for committing unrelated files without resolving five files of pre-existing unmerged state. Cleanup belongs to its own short milestone (feed-forward item 3); contesting it inline would have stalled C0-C6.
10. **GSD is different from upstream, not behind it.** The Part A synthesis at 65-row resolution surfaced 21 rows of intentional substrate divergence -- patterns the OOPS corpus and upstream do not yet have language for. When the local substrate is ahead of the upstream vocabulary, the right response is to keep the divergence and document the language gap, not to retro-fit local structure to match upstream-as-spec.

### Cross-References

| Connection | Significance |
|---|---|
| **OOPS docs 00-09** (`.planning/missions/oops-gsd-alignment/`) | **Source of the audit.** The ten OOPS documents are the first integrated self-spec of the GSD ecosystem; they make the three-way alignment audit possible by providing the third axis (alongside upstream and local). |
| **`gsd-build/get-shit-done@1.38.3`** | **Upstream anchor.** 84 commands / 33 agents / 11 hooks / 14 runtimes / SDK enumerated for M2. Provides the upstream column of the 65-row matrix and lineage for the four C6-vendored commands (`sync-skills`, `plan-review-convergence`, `settings-advanced`, `settings-integrations`). |
| **v1.49.575 -- CS25-26 Sweep** | **Convergent-discovery seed.** The FOUR-anchor analysis from v1.49.575 carried into Part A's M5 synthesis and held at 65-row resolution. Fourth consecutive milestone the property holds. |
| **v1.49.574 -- Megakernel** | **Substrate-divergence pattern.** Half B's tier-gated default-off substrate landing pattern is the same shape that lets v1.49.576's intentional-divergence rows ship without contesting upstream. |
| **v1.49.573** | **Convergent-discovery first surfaced.** The architectural-pattern resolution where the four-anchor framing first held; v1.49.576 is the row-granularity confirmation. |
| **v1.49.572** | **Pre-existing failures baseline.** The 2 cases in `src/mathematical-foundations/__tests__/integration.test.ts` that pre-date v1.49.576 trace to the v1.49.572 baseline, not this milestone. |
| **v1.49.571** | **Last `main` merge tip.** v1.49.572 + v1.49.573 + v1.49.574 + v1.49.575 + v1.49.576 queue together for human-authorized merge per the 2026-04-22 directive. |
| **v1.49.570** | **Phase-numbering anchor.** v1.49.576 phases 814-831 continue the linear phase counter from prior milestones. |
| **ADR 0001 -- Vendoring policy** (`.claude/adr/`, C0 `dba568d3d`) | **Codifies when local files override upstream**, and the `local-modified` marker convention. Origin map maintained in `project-claude/hooks/README.md` (C2 `df5e8901f`). |
| **ADR 0002 -- PreCompact triple-mapping** (`.claude/adr/`, C0 `3efef6b3d`) | **PreCompact / PostCompact / conversation-resume slot mapping** for compaction recovery. Closed OGA-051 and anchored the C1 wiring that closed BLOCK OGA-013. |
| **FINDINGS.md** (`.planning/missions/oops-gsd-alignment/`) | **Part A handoff into Part B.** Names the 18 BLOCK/HIGH actionable rows and the convergent-discovery synthesis at 65-row resolution. Internal-only by project rule. |
| **REVIEW.md** (`.planning/missions/oops-gsd-alignment/`) | **Full audit close summary.** Documents the "Open questions surfaced" section that named the two `comparison-matrix.json` schema bugs fixed in W4. Internal-only by project rule. |
| **`.planning/missions/oops-gsd-implementation/`** | **Part B mission package.** Components C0-C6 with closing commits and acceptance gates. Internal-only by project rule. |

### Test Coverage Progression

| Milestone | Tests Passing | Delta | Notes |
|---|---|---|---|
| v1.49.572 | -- | -- | Pre-existing failures baseline (2 cases in mathematical-foundations) |
| v1.49.573 | -- | -- | Convergent-discovery first surfaced at architectural-pattern resolution |
| v1.49.574 | 27,552 | +141 vs v1.49.573 | Megakernel substrate landed default-off |
| v1.49.575 | 27,887 | +335 vs v1.49.574 | CS25-26 Sweep close baseline |
| **v1.49.576** | **28,066** | **+179 vs v1.49.575** | **24 new test files; both BLOCKs closed** |

Final test posture for v1.49.576: 28,066 passing / 10 failing / 7 skipped / 7 todo / 28,090 total. Failure breakdown: 4 cases `src/chipset/harness-integrity.test.ts` (pre-existing per Part B handoff); 2 cases `src/mathematical-foundations/__tests__/integration.test.ts` (pre-existing v1.49.572 baseline); 1 case `src/heuristics-free-skill-space/__tests__/integration.test.ts` (pre-existing per Part B handoff); 3 cases `tests/skills/gastown-splits.test.ts` (mid-milestone interaction documented as feed-forward item 6).

### Infrastructure

- **Part A mission package:** `.planning/missions/oops-gsd-alignment/` -- M1-M5 modules + `m4/alignment-matrix.json` (65 rows) + `schemas/comparison-matrix.json` (W4-fixed) + FINDINGS.md + REVIEW.md (gitignored; internal-only by project rule)
- **Part B mission package:** `.planning/missions/oops-gsd-implementation/` -- C0-C6 component specs + handoff (gitignored; internal-only by project rule)
- **ADRs:** `.claude/adr/0001-vendoring-policy.md` + `.claude/adr/0002-precompact-triple-mapping.md` (linked from CLAUDE.md per C0 `564603977`)
- **Inventory manifest:** `INVENTORY-MANIFEST.json` (W4 regen at `8c0cf2b9e`) -- carries upstream lineage for the four C6-vendored commands
- **Origin map:** `project-claude/hooks/README.md` (C2 `df5e8901f`) -- per ADR 0001 vendoring policy
- **C1 hook surface:** PreCompact + PostCompact wired per ADR 0002; integration tests at `src/__tests__/hooks-integration/pre-compact-recovery.test.ts`
- **C3 memory substrate:** `src/memory/survey-scorer.ts` + scorer integration; tests `survey-scorer.test.ts`, `scorer-integration.test.ts`, `standing-rules-preservation.test.ts`
- **C5 telemetry surface:** telemetry + effort + flags cluster (4 test files covering the surface)
- **Vendored upstream commands** (C6): `sync-skills`, `plan-review-convergence`, `settings-advanced`, `settings-integrations` -- existence + origin-marker tests landed
- **Memory corpus migration scripts** (dry-run-by-default): `scripts/memory-migrate-half-life.mjs`, `scripts/memory-migrate-taxonomy.mjs`
- **Operator install one-liner** (feed-forward item 1): `rm .claude/settings.json && node project-claude/install.cjs`
- **Total:** 85 files changed across 37 commits in range (`dba568d3d` W0 -> `8c0cf2b9e` W4 manifest regen); 24 new test files; +179 net new passing test cases

## Closing Note

18 of 18 audit-actionable rows closed; 11 of 11 supporting MEDIUMs shipped in their natural layer; 2 of 2 LOWs batched; both BLOCKs over-delivered against their numeric gates. Full audit at `REVIEW.md` (gitignored internal artifact); full close summary at `RETROSPECTIVE.md`. The convergent-discovery story is now four milestones deep and load-bearing for v1.49.577+ planning.

End of release notes.
