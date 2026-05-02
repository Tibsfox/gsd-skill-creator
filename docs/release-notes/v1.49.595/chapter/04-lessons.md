# v1.49.595 — Forward Lessons

## Numbered lessons (carry-forward from v1.49.594)

### #10221 — Dev/main sync discipline second-instance soak PASS

The dev/main sync discipline (3-line `git checkout dev && git merge --ff-only main && git push origin dev` after each main-merge) was applied at both main-merge boundaries during v1.49.595 ship pipeline:

- **Boundary 1 (after initial dev→main ship merge):** ff-only safe; drift = 0 commits.
- **Boundary 2 (after post-ship RH refresh main merge):** ff-only safe; drift = 0 commits.

Verdict: PASS. Lesson #10221 second-instance test holds (cf. v1.49.594 first-instance PASS). Promote to ESTABLISHED at v1.49.597 if third-instance test (v1.49.596) also maintains zero-drift.

### #10222 — Cross-link enforcement BLOCKER cutover

`--cross-link-strict` flag added to `tools/pre-tag-gate.sh` step 6 invocation (commit `2912121a7`, v1.49.595 W0.2). v1.49.595+ now enforces FAIL mode for NASA index.html cross-link coverage <50%; WARN mode for 50-79%; PASS at ≥80%. v1.49.594 first-soak was clean (NASA 13/13 at first run); v1.49.595 cutover hardens the gate. Closes Lesson #10222 candidate hardening cycle.

NASA 1.76 hit 13/13 cross-link coverage at first run under strict mode — gate held cleanly without any inline-recovery edits required. The W2-build-agent-prompt template's verbatim cross-link enumeration mandate (added v1.49.594 W0) is doing the load-bearing work.

## New candidates emitted at v1.49.595

### #10227 candidate — Composite-pass second-soak observation deferred to per-quota observation cycle

v1.49.594 first-soak found composite-pass helps density-variance cases (NASA at 99% lines / 80% bytes → PASS) but doesn't help below-95%-lines cases (MUS+ELC stayed WARN). v1.49.595 ship pipeline encountered insufficient main-context quota margin to run the deliberate without-composite-pass observation pass; deferred to v1.49.596 with specific procedure documented in CLAUDE.md ship-pipeline section.

Recommendation: at v1.49.596, run `node tools/depth-audit.mjs --current` (without --composite-pass) and `--composite-pass --json` in parallel. Record findings. If pattern matches v1.49.594 (NASA helps; MUS+ELC stay WARN), either flip default at v1.49.596 OR refine via trailing-median (#10225 candidate from v1.49.594).

### #10228 candidate — Inline-recovery via incremental-Edit augmentation works for 50KB-class files

v1.49.595 W2 stage hit Sonnet quota-out at ~3:10am PDT during the W2-NASA continuation. Main-context Opus inline recovery authored MUS 1.76 (467 lines / 61KB) and ELC 1.76 (367 lines / 37KB) using a Write-of-skeleton + 5-12 Edit-augmentations pattern.

Pattern observation:
- Initial Write produces a skeleton at ~50% predecessor depth
- Each Edit augmentation adds ~10-15% depth via substantive content blocks (~150-300 word paragraphs)
- 4-6 augmentation rounds typically clear the WARN threshold (≥80% predecessor depth)
- Total wall-clock: ~15-20 min per file

Pattern complements #10215 (mid-build 401 continuation-dispatch) + #10223 (rate-limit recovery via main-context dispatch). Three-tier recovery hierarchy:

1. First-tier: continuation-dispatch (when 401/429 hit; new Sonnet agent picks up where prior left off; ~30-40% time savings)
2. Second-tier: main-context inline-recovery via dedicated incremental-Edit pattern (when Sonnet quota fully exhausted; Opus authors ship-quality content; ~78-89% predecessor depth typical)
3. Third-tier: ScheduleWakeup deferred ship (when both above paths blocked; resume in next quota cycle; canonical fallback for ship deadlines that allow >1 hour delay)

Promote pattern to ESTABLISHED if 2-3 future milestones reproduce the recovery.

### #10229 candidate — TRS Wave 2c contradicts #10224 fork-managed terseness hypothesis

v1.49.594 W1bc Wave 2b ran 30% terser than target (~31K words for 8 packs vs ~44K target). #10224 candidate emitted: fork-managed dispatch produces terser synthesis than direct dispatch.

v1.49.595 W1bc Wave 2c results contradict this:

| Pack | Words | Target | % of target |
|---|---|---|---|
| 17 string-theory | 5,212 | 4,500-5,500 | 95% |
| 18 chaos-dynamical-systems | 5,465 main + 409 notes | 4,500-5,500 | 99% |
| 19 l-systems | 6,148 (5,465 prose + 683 ref-table) | 4,500-5,500 | 99% prose / over-target with table |
| 20 complexity-theory | 6,811 | 5,000-5,500 | 124% |
| 21 machine-learning | 8,120 | 5,500-6,000 | 135% |
| 22 graphics-rendering | 6,842 | 5,500-6,500 | 105% |
| **Total** | **38,798** | **29,500-32,000** | **121%** |

All 6 packs hit or exceeded target band; 3 packs significantly over (pack-20, pack-21, pack-22). Hypothesis retraction warranted.

Possible explanation: v1.49.594 Wave 2b synthesis was constrained by inferred-pack fallback when pack-08 had zero pack-tagged records (forced terse synthesis). v1.49.595 Wave 2c packs all had ≥5 pack-tagged records (pack-22 had 13). Word count correlates with available source-record citation density, not with fork-managed vs main-context dispatch.

Recommendation: withdraw #10224 candidate; replace with #10229 candidate "Wave-N synthesis word count correlates with source-record citation density per pack." Future Wave-1.5 fetches close gap packs (pack-09 done at v1.49.595; pack-10/11/12/13 remaining) and should improve subsequent Wave-N synthesis depth.

## Pattern observations (forward citations)

- Three-tier recovery hierarchy (#10228 candidate) augments operational resilience playbook
- Composite-pass second-soak (#10227) and trailing-median refinement (#10225 from v1.49.594) remain held-for-soak
- META-SOPHOMORE-REFINEMENT cross-substrate pattern (single-instance at v1.76) tracked for v1.49.605+ 2-ex confirmation
- Domain 12 → Domain 13 transition pattern (single-instance at v1.75 → v1.76) tracked for retro-confirmation if Sgt. Pepper → Strange Days or White Album → Wheels of Fire transitions hold the same structural complement
