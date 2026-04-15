# Platform Alignment — Wave Execution Plan

**Date:** 2026-04-15
**Milestone Spec:** `00-milestone-spec.md`
**Estimated Execution:** ~6-10 context windows, 3-5 sessions

---

## Wave 0: Foundation (Sequential, tight)

Shared contracts that downstream waves depend on. Must complete first; must be small enough to cache for Wave 1 consumers within the 5-minute TTL.

**Tasks:**

- [ ] 0.1: Define shared frontmatter schema in `src/skill/frontmatter-types.ts` (name, description, format, version, status, updated, deprecated_by) | Model: Sonnet | Est: 2K tokens | Consumed by: 2C, 2D
- [ ] 0.2: Define shared hook-output helper in `.claude/hooks/lib/hook-output.cjs` (stdout writer, error wrapper) | Model: Sonnet | Est: 2K tokens | Consumed by: 1A, 1B, 1C
- [ ] 0.3: Define shared memory-tag schema in `src/memory/tag-types.ts` (name, type, tags, token_count) | Model: Sonnet | Est: 1K tokens | Consumed by: 2A
- [ ] 0.4: Write activation-equivalence test harness in `src/skill/__tests__/activation-equivalence.test.ts` (compare trigger coverage before/after merge) | Model: Sonnet | Est: 3K tokens | Consumed by: 2C

**Produces:** 4 shared types/helpers, all imported-not-copied by subsequent waves.
**Cache contract:** Wave 0 must complete in a single inline pass (~8K tokens). Wave 1 and Wave 2 start immediately afterward to stay within cache TTL.

---

## Wave 1: Hook Cluster (Parallel Tracks)

Five independent hook handlers. All consume the Wave 0 hook-output helper. No inter-track dependencies.

### Track 1A: Compaction Recovery Pair (P0)

**Spec:** `01-compaction-hooks-spec.md`
**Targets:** `.claude/hooks/pre-compact-snapshot.cjs`, `.claude/hooks/post-compact-recovery.cjs`, `.claude/settings.json`

- [ ] 1A.1: Write `pre-compact-snapshot.cjs` — captures session_id, cwd, git branch/status/log, GSD STATE.md head, file journal tail, compaction_count | Model: Sonnet | Est: 4K tokens
- [ ] 1A.2: Write `post-compact-recovery.cjs` — loads snapshot, formats recovery context, emits via hook-output helper | Model: Sonnet | Est: 4K tokens
- [ ] 1A.3: Add PreCompact + PostCompact entries to `.claude/settings.json` | Model: Haiku | Est: 1K tokens
- [ ] 1A.4: Write tests in `.claude/hooks/tests/compaction-hooks.test.ts` — snapshot creation, recovery format, error silence | Model: Sonnet | Est: 3K tokens

### Track 1B: External Change Tracker (P0)

**Spec:** `02-filechanged-hook-spec.md`
**Targets:** `.claude/hooks/external-change-tracker.cjs`, `.claude/settings.json`

- [ ] 1B.1: Write `external-change-tracker.cjs` — detects SKILL.md/CLAUDE.md/.planning/settings.json/src changes, emits targeted guidance | Model: Sonnet | Est: 4K tokens
- [ ] 1B.2: Add FileChanged entry to `.claude/settings.json` | Model: Haiku | Est: 1K tokens
- [ ] 1B.3: Write tests covering each change case | Model: Sonnet | Est: 3K tokens

### Track 1C: Permission Recovery (P3)

**Spec:** `03-p3-hooks-spec.md` §1
**Targets:** `.claude/hooks/permission-recovery.cjs`, `.claude/settings.json`

- [ ] 1C.1: Write `permission-recovery.cjs` — tracks denial count per (tool, input_prefix), injects retry-loop warning on ≥2, adds tool-specific guidance | Model: Sonnet | Est: 3K tokens
- [ ] 1C.2: Add PermissionDenied entry to `.claude/settings.json` | Model: Haiku | Est: 1K tokens
- [ ] 1C.3: Tests | Model: Sonnet | Est: 2K tokens

### Track 1D: Notification Discovery (P3)

**Spec:** `03-p3-hooks-spec.md` §2
**Targets:** `.claude/hooks/notification-logger.cjs`, `.claude/settings.json`

- [ ] 1D.1: Write `notification-logger.cjs` — appends every notification event to `/tmp/claude-notifications-$SESSION.jsonl` with ts + type + data | Model: Haiku | Est: 1K tokens
- [ ] 1D.2: Add Notification entry to `.claude/settings.json` | Model: Haiku | Est: 1K tokens

### Track 1E: Worktree Lifecycle (P3)

**Spec:** `03-p3-hooks-spec.md` §3
**Targets:** `.claude/hooks/worktree-init.cjs`, `.claude/hooks/worktree-cleanup.sh`, `.claude/settings.json`

- [ ] 1E.1: Write `worktree-init.cjs` — registers new worktree in `/tmp/claude-worktrees-$SESSION.json` | Model: Sonnet | Est: 2K tokens
- [ ] 1E.2: Write `worktree-cleanup.sh` — periodic cleanup of worktrees >24h old with no uncommitted changes | Model: Sonnet | Est: 2K tokens
- [ ] 1E.3: Add WorktreeCreate (or equivalent) entry to `.claude/settings.json` | Model: Haiku | Est: 1K tokens
- [ ] 1E.4: Tests — worktree registry creation, cleanup preservation of dirty trees | Model: Sonnet | Est: 2K tokens

**Parallel boundary:** Tracks 1A-1E share only the hook-output helper from Wave 0. Each writes different files; no conflict possible.

**Commit strategy:**
- 1A: `feat(hooks): add PreCompact/PostCompact recovery pair`
- 1B: `feat(hooks): add FileChanged external-change tracker`
- 1C: `feat(hooks): add PermissionDenied retry-loop guard`
- 1D: `feat(hooks): add Notification discovery logger`
- 1E: `feat(hooks): add Worktree lifecycle init and cleanup`

---

## Wave 2: Memory + Skill Cluster (Parallel Tracks)

Runs concurrently with Wave 1. Four independent work streams, each producing self-contained artifacts.

### Track 2A: Memory Relevance Scoring (P1)

**Spec:** `04-memory-relevance-spec.md`
**Targets:** `src/memory/relevance-scorer.ts`, `src/memory/memory-loader.ts`, MEMORY.md restructure

- [ ] 2A.1: Write `relevance-scorer.ts` — score entries [0,1] based on keyword overlap + section boost + always-load rules (standing-rules → 1.0) | Model: Opus | Est: 6K tokens
- [ ] 2A.2: Write `memory-loader.ts` — load memory entries gated by scorer with configurable token budget | Model: Opus | Est: 4K tokens
- [ ] 2A.3: Add per-entry token_count annotations to MEMORY.md index entries | Model: Haiku | Est: 2K tokens
- [ ] 2A.4: Wire loader into `.claude/hooks/gsd-restore-work-state.js` behind feature flag (fallback to passive load) | Model: Sonnet | Est: 2K tokens
- [ ] 2A.5: Tests — scorer determinism, loader budget enforcement, always-load rules | Model: Sonnet | Est: 4K tokens

### Track 2B: Gastown Skill Splits (P1)

**Spec:** `05-gastown-splits-spec.md`
**Targets:** `.claude/skills/sling-dispatch/`, `.claude/skills/done-retirement/`, `.claude/skills/gupp-propulsion/`

- [ ] 2B.1: Split `sling-dispatch/SKILL.md` (2,305 words → ~600) + write `references/pipeline-implementation.md` (1,705 words) | Model: Sonnet | Est: 6K tokens
- [ ] 2B.2: Split `done-retirement/SKILL.md` (2,267 words → ~550) + write `references/retirement-implementation.md` (1,717 words) | Model: Sonnet | Est: 6K tokens
- [ ] 2B.3: Split `gupp-propulsion/SKILL.md` (1,961 words → ~500) + write `references/runtime-strategies.md` (700 words) + `references/metrics-and-learning.md` (761 words) | Model: Sonnet | Est: 7K tokens
- [ ] 2B.4: Tests — activation still fires on same keywords, references load on demand | Model: Sonnet | Est: 3K tokens

### Track 2C: Skill Merges (P2)

**Spec:** `06-skill-merges-spec.md`
**Dependencies:** 2D.1 (shared frontmatter schema must land first)
**Targets:** `.claude/skills/commit-style/` (new), `.claude/skills/gsd-guide/` (new), `.claude/skills/team-control/` (new); source skills deleted

- [ ] 2C.1: Merge `beautiful-commits` + `git-commit` → `commit-style` (dedup content, preserve all triggers) | Model: Opus | Est: 4K tokens
- [ ] 2C.2: Merge `gsd-onboard` + `gsd-explain` → `gsd-guide` (quick-reference + detailed sections) | Model: Opus | Est: 4K tokens
- [ ] 2C.3: Merge `uc-lab` + `sc-dev-team` → `team-control` (parameterized mode: UC | Dev) | Model: Opus | Est: 4K tokens
- [ ] 2C.4: Delete 6 source skill directories | Model: Haiku | Est: 1K tokens
- [ ] 2C.5: Run activation-equivalence test harness from Wave 0 — prove trigger coverage preserved | Model: Sonnet | Est: 2K tokens
- [ ] 2C.6: Update `project-claude/manifest.json` and install script to reflect merged skills | Model: Sonnet | Est: 2K tokens

### Track 2D: Skill Versioning + Lifecycle (P2/P3)

**Spec:** `07-skill-lifecycle-spec.md`
**Targets:** All 44 `.claude/skills/*/SKILL.md` files, `src/skill/lifecycle-loader.ts` (new), `src/cli/commands/skill-inventory.ts` (new)

- [ ] 2D.1: Write version-backfill script — reads git log for each SKILL.md, inserts `version: 1.0.0`, `format: 2025-10-02`, `status: active`, `updated: <git-date>` | Model: Sonnet | Est: 3K tokens
- [ ] 2D.2: Run backfill script against 37 unversioned skills, review diffs | Model: Haiku | Est: 2K tokens
- [ ] 2D.3: Write `lifecycle-loader.ts` — respects status field (active loads, deprecated loads with warning, retired skips) | Model: Sonnet | Est: 3K tokens
- [ ] 2D.4: Write `skill-inventory` CLI command — reports count by status, stale (>90 days), deprecated with migration path | Model: Sonnet | Est: 3K tokens
- [ ] 2D.5: Staleness detection tests + lifecycle loader tests | Model: Sonnet | Est: 3K tokens

**Parallel boundary:** 2A (memory/*), 2B (.claude/skills/sling-dispatch + done-retirement + gupp-propulsion), 2C (.claude/skills/new-merged + 6-deleted-sources), 2D (.claude/skills/**/SKILL.md frontmatter). Conflict surface: 2D touches the frontmatter of ALL skills, including the 3 Gastown skills that 2B is splitting and the 6 skills that 2C is merging away. Resolution: run 2D LAST within Wave 2, so 2B's new files and 2C's new merged skills already exist when backfill runs. 2A is independent.

**Commit strategy:**
- 2A: `feat(memory): relevance-scored loading with token budget`
- 2B: `refactor(skills): split sling-dispatch/done-retirement/gupp-propulsion into SKILL.md + references`
- 2C: `refactor(skills): merge commit/onboard/team skill pairs to eliminate activation conflicts`
- 2D: `feat(skills): version/format/status/updated frontmatter backfill + lifecycle loader`

---

## Wave 3: Integration + Verification (Sequential)

Final pass. All hooks wired, all skills restructured, all memory scored. Verify the whole system.

- [ ] 3.1: Run `npm test` — full Vitest suite, must show 23,645+ tests passing, zero regressions | Model: Sonnet | Est: 2K tokens
- [ ] 3.2: Run `npx tsc --noEmit` — type check clean | Model: Sonnet | Est: 1K tokens
- [ ] 3.3: Manual compaction smoke — force-compact a session, verify PostCompact recovery context appears | Model: Sonnet | Est: 2K tokens
- [ ] 3.4: Memory load measurement — before/after token count on a canonical task context (cartridge work, hook work, doc work) | Model: Sonnet | Est: 2K tokens
- [ ] 3.5: Skill load measurement — token cost of "Gastown multi-agent dispatch" scenario before/after Gastown splits | Model: Sonnet | Est: 2K tokens
- [ ] 3.6: Activation regression scan — sample 20 recent user prompts from session logs, confirm each still triggers an equivalent skill set | Model: Sonnet | Est: 3K tokens
- [ ] 3.7: Harness-integrity invariants check — run the cartridge-forge test suite against its protected invariants, confirm still green | Model: Sonnet | Est: 2K tokens
- [ ] 3.8: `skill-creator skill-inventory` smoke — reports 44 active, 0 deprecated, 0 retired, lists any stale skills | Model: Haiku | Est: 1K tokens
- [ ] 3.9: Write release notes entry summarizing the 12 improvements, the token-cost deltas, and the test count delta | Model: Sonnet | Est: 3K tokens

---

## Dependency Graph

```
Wave 0 (foundation)                                 ← tight, ~8K tokens
  ├── 0.1 frontmatter-types.ts    ────── consumed by 2C, 2D
  ├── 0.2 hook-output.cjs         ────── consumed by 1A, 1B, 1C
  ├── 0.3 tag-types.ts            ────── consumed by 2A
  └── 0.4 activation-equiv harness ───── consumed by 2C

Wave 1 (hook cluster) ──── can start immediately after Wave 0
  ├── 1A compaction pair (P0)
  ├── 1B filechanged (P0)
  ├── 1C permission (P3)
  ├── 1D notification (P3)
  └── 1E worktree (P3)

Wave 2 (memory + skill cluster) ─── runs in parallel with Wave 1
  ├── 2A memory scorer + loader (P1)
  ├── 2B Gastown splits (P1)
  ├── 2C skill merges (P2)  ─ deps: 2D.1 (schema)
  └── 2D versioning + lifecycle (P2/P3) ─ deps: 2B, 2C (run last in Wave 2)

Wave 3 (verification) ─── requires Waves 1 + 2 complete
  └── full suite + smoke + measurement + release notes
```

**Critical path:** 0.1 → 2D.1 → 2C.1..3 → 2D.2 → 3.1. All other work parallelizes around this spine.

## Cache Optimization Strategy

### Shared Context
- Wave 0 is tiny and cached — all Wave 1 and Wave 2 tracks consume 0.1/0.2/0.3 from cache
- Wave 1A/1B/1C all use the hook-output helper from 0.2 — one load, five consumers
- Wave 2B/2C/2D all touch `.claude/skills/` — the skill directory listing is cached once per session

### Producer → Consumer Timing
- 0.1 (frontmatter types) produces at T+0, consumed by 2C at T+~15 min (within TTL)
- 0.4 (test harness) produces at T+0, consumed by 2C.5 at T+~30 min (outside TTL — this is fine, the test file is small and re-loadable)

### Token Budget Estimate

| Wave | Estimated Tokens | Context Windows | Notes |
|------|-----------------|-----------------|-------|
| 0 | ~8K | Inline | Tight foundation |
| 1A | ~12K | 1 | Compaction pair + tests |
| 1B | ~8K | Inline or 1 | FileChanged + tests |
| 1C | ~6K | Inline | Permission handler |
| 1D | ~2K | Inline | Notification logger (trivial) |
| 1E | ~7K | 1 | Worktree + cleanup + tests |
| 2A | ~18K | 1 | Memory scorer (Opus work) |
| 2B | ~22K | 1-2 | Three Gastown splits |
| 2C | ~17K | 1 | Three skill merges (Opus) |
| 2D | ~14K | 1 | Versioning + lifecycle loader |
| 3 | ~18K | 1 | Full verification |
| **Total** | **~132K** | **6-10** | **3-5 sessions** |

---

*Wave execution plan for Platform Alignment milestone. Assumes component specs 01-07 are filled in before Wave 1/2 execution begins; the wave plan itself is executable without them if a fresh session reads 00-milestone-spec.md first.*
