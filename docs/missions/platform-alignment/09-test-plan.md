# Platform Alignment — Test Plan

**Date:** 2026-04-15
**Milestone Spec:** `00-milestone-spec.md`
**Wave Plan:** `08-wave-execution-plan.md`

---

## Test Categories

| Category | Count | Priority |
|----------|-------|----------|
| Safety-critical (silent-failure guards on hooks) | 6 | Mandatory pass |
| Hook handler functional | 14 | Required |
| Memory relevance scoring | 8 | Required |
| Gastown skill split integrity | 9 | Required |
| Skill merge activation equivalence | 12 | Required |
| Skill lifecycle behavior | 7 | Required |
| Integration (cross-wave) | 6 | Required |
| Regression (baseline suite) | 23,645+ | Required |
| **Total new tests** | **62** | |

## Safety-Critical Tests (Mandatory Pass — BLOCK on failure)

These tests guarantee that the hook handlers never crash a session. Any failure here blocks the release.

| Test ID | Target | Verifies | Failure Action |
|---------|--------|----------|----------------|
| T-SAFE-01 | `pre-compact-snapshot.cjs` | Handler exits 0 on malformed JSON stdin | BLOCK |
| T-SAFE-02 | `post-compact-recovery.cjs` | Handler exits 0 when snapshot file missing | BLOCK |
| T-SAFE-03 | `external-change-tracker.cjs` | Handler exits 0 on missing file_path field | BLOCK |
| T-SAFE-04 | `permission-recovery.cjs` | Handler exits 0 on unreadable denial registry | BLOCK |
| T-SAFE-05 | `notification-logger.cjs` | Handler exits 0 on unwritable tmpdir | BLOCK |
| T-SAFE-06 | `worktree-init.cjs` | Handler exits 0 on missing session_id | BLOCK |

**Common pattern:** each handler wraps its body in try/catch. On ANY exception, the handler writes nothing to stdout and exits 0. The safety tests feed pathological inputs and assert `exitCode === 0 && stdout === ''`.

## Hook Handler Functional Tests

### Compaction pair (Track 1A — 4 tests)

| Test ID | Verifies |
|---------|----------|
| T-COMPACT-01 | `pre-compact-snapshot.cjs` writes snapshot file with git branch, status head, STATE.md head |
| T-COMPACT-02 | `pre-compact-snapshot.cjs` increments compaction_count on subsequent invocations |
| T-COMPACT-03 | `post-compact-recovery.cjs` reads snapshot and emits structured `additionalContext` in stdout |
| T-COMPACT-04 | `post-compact-recovery.cjs` combines snapshot data with live git state (branch may have changed) |

### FileChanged (Track 1B — 4 tests)

| Test ID | Verifies |
|---------|----------|
| T-FC-01 | Emits guidance when a `.claude/skills/*/SKILL.md` is modified externally |
| T-FC-02 | Emits guidance when a `.planning/*.md` is modified externally |
| T-FC-03 | Emits guidance when project root `CLAUDE.md` is modified externally |
| T-FC-04 | Emits guidance when a `src/**/*.ts` file is modified externally |

### Permission + Notification + Worktree (Tracks 1C/1D/1E — 6 tests)

| Test ID | Verifies |
|---------|----------|
| T-P-01 | `permission-recovery.cjs` tracks first denial silently |
| T-P-02 | `permission-recovery.cjs` emits retry-loop warning on second denial of same (tool, input) |
| T-P-03 | `permission-recovery.cjs` emits tool-specific guidance for Bash/Write/Edit/Agent |
| T-N-01 | `notification-logger.cjs` appends JSONL entry with ts, type, data fields |
| T-W-01 | `worktree-init.cjs` registers new worktree in registry file |
| T-W-02 | `worktree-cleanup.sh` preserves worktrees with uncommitted changes |

## Memory Relevance Scoring (Track 2A — 8 tests)

| Test ID | Verifies |
|---------|----------|
| T-MEM-01 | `scoreMemoryRelevance()` returns scores in [0, 1] |
| T-MEM-02 | Standing-rules entry always scores 1.0 regardless of task context |
| T-MEM-03 | HOT section entries receive base boost of 0.2 |
| T-MEM-04 | Keyword overlap contributes proportionally up to 0.3 |
| T-MEM-05 | `loadRelevantMemories()` respects token budget (no overflow) |
| T-MEM-06 | Relevant entries are loaded in descending score order |
| T-MEM-07 | For a cartridge-work task context, NASA-mission entries score below threshold |
| T-MEM-08 | Scorer is deterministic (same input → same output) |

## Gastown Skill Split Integrity (Track 2B — 9 tests)

Three skills × three checks each: word count, activation, reference loading.

| Test ID | Verifies |
|---------|----------|
| T-SPLIT-SL-01 | `sling-dispatch/SKILL.md` is ≤800 words after split |
| T-SPLIT-SL-02 | `sling-dispatch` activation triggers fire on same keyword set as pre-split |
| T-SPLIT-SL-03 | `sling-dispatch/references/pipeline-implementation.md` exists and contains the removed implementation prose |
| T-SPLIT-DR-01 | `done-retirement/SKILL.md` is ≤800 words after split |
| T-SPLIT-DR-02 | `done-retirement` activation parity |
| T-SPLIT-DR-03 | `done-retirement/references/retirement-implementation.md` exists and complete |
| T-SPLIT-GP-01 | `gupp-propulsion/SKILL.md` is ≤800 words after split |
| T-SPLIT-GP-02 | `gupp-propulsion` activation parity |
| T-SPLIT-GP-03 | `gupp-propulsion/references/runtime-strategies.md` + `metrics-and-learning.md` both exist |

## Skill Merge Activation Equivalence (Track 2C — 12 tests)

Three merges × four checks each: creation, triggers preserved, source deleted, manifest updated.

| Test ID | Verifies |
|---------|----------|
| T-MERGE-CS-01 | `commit-style` skill exists with merged content |
| T-MERGE-CS-02 | All trigger keywords from `beautiful-commits` appear in `commit-style` description |
| T-MERGE-CS-03 | All trigger keywords from `git-commit` appear in `commit-style` description |
| T-MERGE-CS-04 | Source skills `beautiful-commits` and `git-commit` are deleted |
| T-MERGE-GG-01 | `gsd-guide` skill exists with quick-reference + detailed sections |
| T-MERGE-GG-02 | All `gsd-onboard` triggers preserved |
| T-MERGE-GG-03 | All `gsd-explain` triggers preserved |
| T-MERGE-GG-04 | Source skills deleted |
| T-MERGE-TC-01 | `team-control` skill exists with UC/Dev mode parameters |
| T-MERGE-TC-02 | All `uc-lab` triggers preserved |
| T-MERGE-TC-03 | All `sc-dev-team` triggers preserved |
| T-MERGE-TC-04 | Source skills deleted + `project-claude/manifest.json` updated |

**Activation equivalence harness:** `src/skill/__tests__/activation-equivalence.test.ts` (produced in Wave 0.4) accepts a list of (pre-merge skill set, post-merge skill set) pairs and runs a fixed corpus of 50 sample prompts against each, asserting that every prompt that matched a pre-merge skill still matches the post-merge skill. Corpus lives under `src/skill/__tests__/fixtures/activation-prompts.json`.

## Skill Lifecycle Behavior (Track 2D — 7 tests)

| Test ID | Verifies |
|---------|----------|
| T-LC-01 | Skill with `status: active` loads normally |
| T-LC-02 | Skill with no `status` field defaults to active (backward compat) |
| T-LC-03 | Skill with `status: deprecated` loads but emits warning to stderr |
| T-LC-04 | Skill with `status: retired` does not load at all |
| T-LC-05 | `skill-inventory` CLI reports 44 active, 0 deprecated, 0 retired after backfill |
| T-LC-06 | `skill-inventory` flags skills with `updated` >90 days ago as stale |
| T-LC-07 | Version-backfill script preserves existing frontmatter fields (no overwrites) |

## Integration Tests (Wave 3 — 6 tests)

| Test ID | Verifies |
|---------|----------|
| T-INT-01 | PreCompact → PostCompact round-trip: snapshot written, recovery reads it, context appears in stdout |
| T-INT-02 | FileChanged + PermissionDenied co-fire: both handlers run independently, no interference |
| T-INT-03 | Memory loader with budget=2000 loads fewer tokens than passive load on a cartridge-work context (measurable Δ) |
| T-INT-04 | Gastown "multi-agent dispatch" scenario loads <5% of 200K context (down from 7%) |
| T-INT-05 | Full harness-integrity suite from cartridge-forge still passes after all changes |
| T-INT-06 | `npm test` reports zero regressions (baseline 23,645 → 23,645+Δ new tests) |

## Verification Matrix

Every success criterion from `00-milestone-spec.md` maps to at least one test.

| Success Criterion | Test ID(s) |
|-------------------|-----------|
| #1: All 6 hook event types wired | T-COMPACT-01..04, T-FC-01..04, T-P-01..03, T-N-01, T-W-01..02 |
| #2: PreCompact writes snapshot | T-COMPACT-01 |
| #3: PostCompact emits recovery context | T-COMPACT-03, T-INT-01 |
| #4: FileChanged emits changed-file guidance | T-FC-01..04 |
| #5: PermissionDenied detects retry loop | T-P-02 |
| #6: Notification logger writes JSONL | T-N-01 |
| #7: Worktree init + cleanup work correctly | T-W-01, T-W-02 |
| #8: Memory scorer returns [0,1] | T-MEM-01 |
| #9: Memory loader reduces tokens | T-MEM-05, T-INT-03 |
| #10: Gastown SKILL.md ≤800 words, <5% budget | T-SPLIT-* (all 9), T-INT-04 |
| #11: Skill merges pass activation equivalence | T-MERGE-* (all 12) |
| #12: All 44 skills have version/format/status/updated | T-LC-05 |
| #13: `skill-inventory` command exists and reports state | T-LC-05, T-LC-06 |
| #14: Full test suite passes, zero regressions | T-INT-06 |
| #15: Harness-integrity invariants still pass | T-INT-05 |

---

*Test plan for Platform Alignment milestone. All 62 new tests are scoped to the wave plan tasks; the baseline 23,645-test suite must remain green throughout.*
