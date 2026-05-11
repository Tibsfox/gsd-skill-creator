# 99 — Context: v1.49.637 Housekeeping Cluster #4

## Engine state

UNCHANGED from predecessor v1.49.636. No NASA / MUS / ELC / SPS /
TRS forward-cadence content shipped in this milestone.

| Slot | v1.49.636 | v1.49.637 | Δ |
|---|---|---|---|
| NASA degree | 108 | 108 | 0 |
| MUS pack | 108 | 108 | 0 |
| ELC degree | 108 | 108 | 0 |
| SPS pack | #105 | #105 | 0 |
| TRS pack | 30 | 30 | 0 |
| Counter-cadence flag | true | true | (preserved) |
| No-engine-state-advance flag | true | true | (preserved) |

The next degree-advancing milestone is v1.49.638 (candidate:
STS-7 Sally Ride / Challenger).

## Predecessor lineage

| Milestone | Tag | Date | Type |
|---|---|---|---|
| v1.49.634 | `v1.49.634` | 2026-05-11 | Counter-cadence (cluster #2) |
| v1.49.635 | `v1.49.635` | 2026-05-11 | Counter-cadence (cluster #3) |
| v1.49.636 | `v1.49.636` | 2026-05-11 | Counter-cadence (cluster #3-followup) |
| **v1.49.637** | `v1.49.637` (pending T14) | **2026-05-11** | **Counter-cadence (cluster #4)** |

Predecessor merge commit on `main`: `bf16220c8` (v1.49.636 merge).

## Carry-forward inventory (post-W3)

### Confirmed Cluster #5 carry-forwards

| ID | Source | Description | Estimated cost |
|---|---|---|---|
| CL5-CF-1 | W1B C4 | Atlas `lru_access_promotes_keeps_entry_alive_under_eviction` architectural fix — test currently `#[ignore]`'d with full diagnostic; disposition invariant test asserts continued `#[ignore]` state until Cluster #5 closes it | 2-4h |

### T14 disposition pending

| ID | Source | Description |
|---|---|---|
| T14-CF-1 | W1A G-gate (CF-Nit 3) | Working-tree `dashboard/index.html` modification — disposition (commit / stash / discard) deferred to T14 operator authorization |

### Audit-tool catalog gaps closed (3 of 3)

- ✓ Perf-assertion-audit regex (post-multiplier additive + pre-multiplier) — closed at C7 Sub-1a
- ✓ STORY.md sustained-update gate — closed at C5
- ✓ STATE.md prose-body milestone-drift validator — closed at C6

### Named carry-forwards from v1.49.636 close (5 of 6 closed)

- ✓ R14 passphrase quality enforcement — closed at C3
- ✓ Atlas `per_project_clear_with_unknown_project_id_falls_back_to_full_clear` — closed at C4 (fixed-inline)
- ⏸ Atlas `lru_access_promotes_keeps_entry_alive_under_eviction` — DEFERRED to Cluster #5 (CL5-CF-1)
- ✓ Legacy-plaintext-keystore cargo feature retirement — closed at C1
- ✓ M3-deferred stub user-visible surface (`migrate --to-keyring`) — closed at C2
- ✓ C7 Sub-2 upstream rename absorb — RETIRED to tracking-only at W1B (Lesson #10196)

## Forward lessons emitted (5)

| # | Title | Tracker status |
|---|---|---|
| #10192 | Substrate-probe before component-spec finalization | OPEN |
| #10193 | Sub-agent toolkit lacks SendMessage; iterative-dispatch is the architecture | INFORMATIONAL |
| #10194 | Token-ceiling pattern: ~60-70 tool uses; commit-between-deliverables preserves work | OPEN |
| #10195 | Dual-disposition: one component can have multiple test outcomes | OPEN |
| #10196 | Cluster close forward-notes are load-bearing decisions | OPEN |

See `04-lessons.md` for full lesson bodies + Apply patterns.

## Commit manifest (pre-T14)

| SHA | Subject | Wave |
|---|---|---|
| `ee012ffef` | refactor(keystore): retire legacy-plaintext-keystore cargo feature | W1A.T1 |
| `b817d39a2` | docs(keystore): polish migrate --to-keyring stub + add M3 design doc | W1A.T2 |
| `4baf23089` | feat(keystore): integrate @zxcvbn-ts/core for R14 passphrase quality enforcement | W1A.T3 |
| `c94de08e5` | fix(atlas): C4 fix per-project-clear contract + cluster-5 defer lru-promote | W1B.T1 |
| `aba7618e0` | feat(audit): broaden perf-assertion regex + extend apply-to-self KNOWN_PATTERNS | W1B.T2 |
| `7c0075ddd` | feat(release-notes): per-ship STORY.md sustained-update gate | W1C.T1 |
| `83b7f879f` | feat(state-md): extend normalizer to flag prose-body milestone drift | W1C.T2 |
| `2ce35f954` | test(integration): v1.49.637 meta-test exercises each new gate (C1-C7) | W3 stage 1 |
| `(this commit)` | docs(release-notes): v1.49.637 housekeeping cluster #4 | W3 stage 1 |

## T14 ship sequence (operator-only authorization)

Per Lesson #10191, the T14 ship sequence is atomic — it executes
against the directive state at G3 authorization time. Any mid-T14
revision goes forward to Cluster #5.

Per Lesson #10184, the dev → main fast-forward uses
`git update-ref refs/heads/main HEAD` (single-step) rather than
`git checkout main && git merge dev`.

Expected sequence (operator-only):
1. Pre-tag-gate composite (10 steps including new step 10 STORY-gate)
2. bump-version 1.49.637 (5 manifest slots)
3. `chore(release): v1.49.637 housekeeping cluster #4` commit
4. `git tag v1.49.637`
5. `git push origin v1.49.637`
6. `git push origin dev`
7. `git update-ref refs/heads/main HEAD` (single-step main FF)
8. `git push origin main`
9. RH refresh (`tools/release-history/run-with-pg.mjs refresh --fast --quiet`)
10. GH release publish (`npm run gh-release-publish 1.49.637`)
11. STATE.md normalize (with C6 prose validator)
12. Ground-truth STORY.md authoring + step-10 STORY-gate run
13. HANDOFF doc finalization

## See also

- `.planning/HANDOFF-v1.49.637-COMPLETE.md` — flight-ops ship-state handoff
- `.planning/atlas-test-disposition.md` — C4 dispositions
- `.planning/path-2-to-path-1-migration.md` — M3 design (C2)
- `.planning/state-md-normalizer-conventions.md` — C6 convention doc
- `.planning/ship-pipeline-discipline.md` — extended C7 Sub-1 patterns
- `.planning/UPSTREAM-ALIGNMENT.md` — C7 Sub-2 tracking-only retirement note
