# Platform Alignment — Milestone Specification

**Date:** 2026-04-15
**Vision Document:** (derived from OOPS research series, 2026-03-31, 9 docs under `www/tibsfox/com/Research/OOPS/research/`)
**Research Reference:** OOPS doc 03 (12 concrete improvements) + OOPS doc 07 (skill system optimization)
**Estimated Execution:** ~6-10 context windows across 3-5 sessions

---

## Mission Objective

Adopt the 12 platform-alignment improvements identified in OOPS's source-code analysis of Claude Code v2.1.88. Done means:

1. **Hook system** — PreCompact/PostCompact/FileChanged/PermissionDenied/Notification/Worktree hooks wired and firing on real events
2. **Memory system** — MEMORY.md loads are relevance-scored against task context, reducing per-session load from ~4K tokens to ~1-2K
3. **Skill system** — 3 heaviest Gastown skills split into SKILL.md + references (~7,326 token savings per default load), 3 overlap pairs merged, all 44 skills carry version + format + lifecycle metadata

"Done" is measurable: specific token-cost deltas (memory load reduced, skill load reduced), specific hook-event coverage (6 new event types wired), specific test counts (23,645 today → 23,645+Δ).

Time is flexible. No release date gates this work.

## Architecture Overview

Five domains, 12 improvements, structured for independent-then-integrating development:

```
Hook System (.claude/hooks/ + .claude/settings.json)
│
├── P0 Compaction Recovery Pair ──────────────── 01-compaction-hooks-spec.md
│   ├── pre-compact-snapshot.cjs (snapshot git/GSD state before compact)
│   └── post-compact-recovery.cjs (inject snapshot back after compact)
│
├── P0 External Change Tracker ──────────────── 02-filechanged-hook-spec.md
│   └── external-change-tracker.cjs
│
└── P3 Event Handlers ──────────────────────── 03-p3-hooks-spec.md
    ├── permission-recovery.cjs (retry-loop guard)
    ├── notification-logger.cjs (discovery phase)
    └── worktree-init.cjs + worktree-cleanup.sh

Memory System (MEMORY.md + src/memory/)
│
└── P1 Relevance Scoring ────────────────────── 04-memory-relevance-spec.md
    ├── src/memory/relevance-scorer.ts (new)
    ├── src/memory/memory-loader.ts (new, replaces passive load)
    └── MEMORY.md restructure: per-entry tags + token-count metadata

Skill System (.claude/skills/)
│
├── P1 Gastown Splits ──────────────────────── 05-gastown-splits-spec.md
│   ├── sling-dispatch: SKILL.md (600w) + references/pipeline-impl.md (1,705w)
│   ├── done-retirement: SKILL.md (550w) + references/retirement-impl.md (1,717w)
│   └── gupp-propulsion: SKILL.md (500w) + references/runtime-strategies.md + metrics-and-learning.md
│
├── P2 Skill Merges ──────────────────────── 06-skill-merges-spec.md
│   ├── beautiful-commits + git-commit → commit-style (single SKILL.md)
│   ├── gsd-onboard + gsd-explain → gsd-guide (quick ref + detailed sections)
│   └── uc-lab + sc-dev-team → team-control (parameterized with mode switch)
│
└── P2/P3 Lifecycle + Versioning ────────── 07-skill-lifecycle-spec.md
    ├── version: 1.0.0 backfill on 37 skills
    ├── format: 2025-10-02 declaration on all 44 skills
    ├── status: active | deprecated | retired field + loader behavior
    ├── updated: YYYY-MM-DD field from git log
    └── staleness detection + skill inventory command
```

Each domain can be worked independently; integration happens at Wave 3.

## Deliverables

1. **Six new hook handlers** under `.claude/hooks/`:
   - `pre-compact-snapshot.cjs`
   - `post-compact-recovery.cjs`
   - `external-change-tracker.cjs`
   - `permission-recovery.cjs`
   - `notification-logger.cjs`
   - `worktree-init.cjs`
2. **One shell script** `.claude/hooks/worktree-cleanup.sh` for periodic zombie cleanup
3. **Extended `.claude/settings.json`** with 6 new event-type entries (PreCompact, PostCompact, FileChanged, PermissionDenied, Notification, WorktreeCreate or equivalent)
4. **Memory relevance scorer** in `src/memory/relevance-scorer.ts` with scoring heuristics (keyword overlap + section boost + always-load rules)
5. **Memory loader** in `src/memory/memory-loader.ts` that replaces passive MEMORY.md load with relevance-gated load, honoring a configurable token budget (default: 2000)
6. **MEMORY.md restructure** — per-entry tag frontmatter, token-count annotations, HOT/WARM/COLD section boundaries preserved
7. **Three Gastown skill splits** — each SKILL.md trimmed to ≤800 words, each `references/*.md` carrying the extracted implementation detail, zero behavioral change
8. **Three skill-merge operations** — 6 source skills removed, 3 merged skills created, activation tests prove equivalent coverage
9. **Version + format + updated + status frontmatter** on all 44 skills — one-time backfill from git log, mechanical change, no content edits
10. **Lifecycle loader behavior** — `status: active` loads normally, `status: deprecated` loads with warning, `status: retired` does not load at all
11. **Skill inventory command** — `skill-creator skill-inventory` reports count by status, stale (>90 days) skills flagged, deprecated skills with migration path shown
12. **Test coverage** — ≥1 test per new hook handler, ≥1 test per merged skill for activation equivalence, ≥1 test for memory relevance scorer, ≥1 test for lifecycle loader. Full suite remains green (23,645+ tests → 23,645+Δ).

## Component Breakdown

| # | Component | Spec | Deps | Model | Priority |
|---|-----------|------|------|-------|----------|
| 1 | Compaction hooks pair | `01-compaction-hooks-spec.md` | None | Sonnet | P0 |
| 2 | FileChanged tracker | `02-filechanged-hook-spec.md` | None | Sonnet | P0 |
| 3 | P3 hooks (permission/notification/worktree) | `03-p3-hooks-spec.md` | None | Sonnet + Haiku | P3 |
| 4 | Memory relevance scorer + loader | `04-memory-relevance-spec.md` | None | Opus | P1 |
| 5 | Gastown skill splits (×3) | `05-gastown-splits-spec.md` | None | Sonnet | P1 |
| 6 | Skill merges (×3) | `06-skill-merges-spec.md` | #10 (shared frontmatter types) | Opus | P2 |
| 7 | Skill lifecycle + versioning | `07-skill-lifecycle-spec.md` | None | Haiku + Sonnet | P2/P3 |

## Model Assignment Rationale

- **Opus for #4 (memory scorer) and #6 (merges)** — both involve genuine judgment. The scorer needs heuristic design for relevance that holds across task types; the merges need content-deduplication decisions that must preserve information without losing triggers. These are the hard calls.
- **Sonnet for #1, #2, #3, #5** — all four are structural implementation. OOPS doc 03 provided working code skeletons for #1-3 that Sonnet can adapt cleanly. The Gastown splits (#5) are mechanical refactors: move implementation prose from SKILL.md to `references/*.md`, preserve all content.
- **Haiku for #7** — frontmatter backfill is pure scaffolding. Insert 4 YAML fields into 37 files. No judgment.

Target split: ~20% Opus, ~60% Sonnet, ~20% Haiku. This respects the 60/40 principle from vision-to-mission (most work is structural).

## Cross-Component Interfaces

**Shared frontmatter schema** (consumed by #6 and #7):

```yaml
---
name: <string>
description: <string, ≤250 chars>
format: 2025-10-02          # new — skill format date
version: <semver>           # new — skill content version
status: active | deprecated | retired | draft   # new
updated: <YYYY-MM-DD>       # new — from git log
deprecated_by: <skill-name | null>   # new, when status=deprecated
---
```

This schema must be defined in Wave 0 before #6 and #7 start. It lives in `src/skill/frontmatter-types.ts` (new file).

**Shared hook output format** (consumed by #1, #2, #3):

```json
{
  "hookSpecificOutput": {
    "hookEventName": "<event>",
    "additionalContext": "<text or structured payload>"
  }
}
```

All hook handlers write to stdout in this format. Errors exit 0 with empty stdout (silent failure — never crash the session).

**Memory tag schema** (consumed by #4):

```markdown
---
name: <string>
type: user | project | reference | feedback
tags: [tag1, tag2, tag3]
token_count: <int>
---

<body>
```

Each memory file under `memory/*.md` extends this schema. The existing MEMORY.md index remains unchanged except for token-count annotations added to each entry.

## Safety & Boundary Conditions

- **No hook may crash the session.** All hooks exit 0 on any error, writing nothing to stdout. This is enforced by wrapping the entire handler body in a try/catch.
- **Memory loader must be backward compatible.** If `src/memory/memory-loader.ts` is not present or errors, the session-state.cjs hook falls back to loading MEMORY.md passively (current behavior). No hard dependency on the new path.
- **Skill merges must preserve activation coverage.** Every trigger keyword from the source skills must appear in the merged skill's description. A test must prove that every user prompt that activated either source would still activate the merged skill.
- **Lifecycle loader must default-allow.** A skill with no `status` field is treated as `status: active` for backward compatibility. The `deprecated`/`retired` behaviors only apply to skills that explicitly declare those states.
- **Version backfill must not edit content.** The Haiku pass writes frontmatter fields only. No SKILL.md body changes are permitted in that wave. If content needs editing, it's a separate commit.
- **Cartridge-forge invariants must hold.** The harness-integrity test suite that cartridge-forge protected (schema freeze, chipset kinds, cartridge count) must continue to pass. This mission does not touch `data/chipset/` or `examples/cartridges/`.
- **MEMORY.md structure must remain human-readable.** The relevance scorer operates on per-entry files under `memory/`; MEMORY.md stays a human-maintained index. Adding `token_count` annotations is allowed; restructuring the narrative is not.

## Success Criteria

1. All 6 new hook event types appear in `.claude/settings.json` and fire on real events
2. PreCompact writes a snapshot file in `/tmp/claude-precompact-*.json` when invoked
3. PostCompact stdout contains recovery context after a compaction event
4. FileChanged stdout contains the changed-file path when an external edit occurs
5. PermissionDenied detects a 2nd denial of the same tool/input and injects retry-loop warning
6. Notification logger writes to `/tmp/claude-notifications-*.jsonl` (used for discovery pass 2)
7. Worktree init registers new worktrees in `/tmp/claude-worktrees-*.json`; `worktree-cleanup.sh` removes stale worktrees >24h old with no uncommitted changes
8. Memory relevance scorer returns scores in [0, 1] for every memory entry given task context
9. Memory loader with default budget=2000 loads <50% of current HOT section volume for typical task contexts
10. All 3 Gastown skill SKILL.md files are ≤800 words after split; token cost of default-load scenario "Gastown multi-agent dispatch" drops below the 5% budget ceiling
11. All 3 skill-merge operations pass activation-equivalence tests
12. All 44 skills carry `version`, `format`, `status`, `updated` frontmatter fields
13. `skill-creator skill-inventory` command exists and reports lifecycle state for each skill
14. Full test suite passes (23,645 baseline → 23,645+Δ), zero regressions
15. Harness-integrity invariants from cartridge-forge continue to pass

## Relationship to Other Vision Documents

| Document | Relationship |
|----------|-------------|
| OOPS doc 03 `03-improvements-from-analysis.md` | Primary source; items 1-9 map to OOPS items 1, 2, 5, 6, 7, 9, 10, 11 |
| OOPS doc 07 `07-skill-system-optimization.md` | Primary source; items 4-9 map to OOPS recommendations §7.1-7.6 + §10 |
| OOPS doc 04 `04-hook-system-deep-dive.md` | Context on the 14 hook event types we're targeting |
| OOPS doc 05 `05-memory-system-analysis.md` | Evidence base for memory relevance scoring design |
| `cartridge-forge` milestone (closed 2026-04-14) | Establishes version+schema discipline; this mission extends same discipline to skills |
| `retro-driven-improvements` milestone (2026-03-09) | Template for mission-package structure |

## The Through-Line

The OOPS research was the direct output of a moment when Claude Code's source code briefly leaked, letting us see the patterns our own architecture was independently evolving toward. The 12 improvements in this mission are not speculative enhancements — they are a one-time chance to align with the platform while the alignment is still cheap. Memory, skills, hooks, and lifecycle are the four seams where our system and Claude Code's system meet; this mission stitches them together.

The cartridge-forge milestone gave us version discipline for cartridges. This mission extends that same discipline to the rest of the `.claude/` tree. When it's done, the whole project speaks one versioning language — cartridges, skills, agents, teams, and hooks — and the platform's lifecycle APIs (skill CRUD, version endpoints) will find our artifacts already shaped for them when we're ready to adopt them.

---

*Master specification for Platform Alignment milestone. Component specs 01-07 are stubbed for fill-in; wave execution plan (08) and test plan (09) are the executable frame.*
