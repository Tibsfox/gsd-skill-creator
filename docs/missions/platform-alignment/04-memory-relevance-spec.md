# Memory Relevance Scoring + Loader — Component Specification

**Date:** 2026-04-15
**Milestone:** Platform Alignment
**Model Assignment:** Opus (scorer + loader) + Sonnet (wiring + tests)
**Dependencies:** Wave 0.3 (`src/memory/tag-types.ts`)
**Target Files:**
- `src/memory/relevance-scorer.ts` (new)
- `src/memory/memory-loader.ts` (new)
- `.claude/hooks/gsd-restore-work-state.js` (wiring, behind flag)
- `MEMORY.md` (token-count annotations only)
- Per-entry memory files under `memory/*.md` (tag frontmatter)

**Priority:** P1

---

## Problem

Our MEMORY.md HOT section loads ~4,000 tokens on every session start regardless of the current task. OOPS doc 03 §5 quantifies the waste: trust system (~400), NASA (~500), Seattle 360 (~400), subsystems inventory (~600), Fox Companies (~300), standing rules (~400), muse team (~300), other (~1,100). For a hook-implementation task perhaps 800 tokens are genuinely relevant (standing rules, tech stack, key subsystems); the remaining ~3,200 are waste — loaded into context, compacted, reloaded, compacted again.

Compounding cost over a 3-hour session with 2 compactions: ~12,000 tokens reloaded, ~$0.18 at Opus pricing per session, and context budget permanently unavailable for task-relevant information. Across 50 sessions: ~$9 and several hundred thousand tokens that could have held actual working context.

Claude Code's binary references `memory_survey` — suggesting the platform scores memory relevance before loading. We want the same primitive.

## Current State

- `MEMORY.md` is loaded passively by `.claude/hooks/gsd-restore-work-state.js` at session start — entire HOT section injected into context unconditionally.
- Per-entry memory files under `memory/*.md` exist (the MEMORY.md index points to them) but the loader does not read them individually — only the index.
- No relevance scoring. No token budgeting. No task-context awareness.

## Solution

A two-stage pipeline:

1. **Relevance scorer** (`src/memory/relevance-scorer.ts`) — pure function, no I/O. Given a list of memory entries and a task context, returns `[0, 1]` scores per entry.
2. **Memory loader** (`src/memory/memory-loader.ts`) — applies the scorer against a threshold and token budget, returns the subset that fits.

The loader is wired into `gsd-restore-work-state.js` behind a feature flag (env var `GSD_MEMORY_RELEVANCE=1` or config toggle) — fallback to passive load when disabled, so nothing breaks during rollout.

### Scorer: `src/memory/relevance-scorer.ts`

```typescript
interface MemoryEntry {
  id: string;                     // e.g., "trust-system", "nasa-missions"
  section: 'hot' | 'warm' | 'cold';
  keywords: string[];             // from tag frontmatter
  content: string;
  tokenCount: number;
}

interface TaskContext {
  files: string[];                // absolute or project-relative paths from recent tool calls
  topics: string[];               // extracted from user prompts (simple noun phrases)
  commands: string[];             // recent Bash commands
}

interface RelevanceScore {
  entryId: string;
  score: number;                  // 0.0 .. 1.0
  reason: string;                 // debug trace
}

function scoreMemoryRelevance(
  entries: MemoryEntry[],
  ctx: TaskContext
): RelevanceScore[];
```

**Scoring rules** (OOPS doc 03 §5, adapted):

| Rule | Contribution |
|------|-------------|
| Keyword overlap with task context | up to `+0.3` (scaled by `min(overlap / 3, 1)`) |
| HOT-section base boost | `+0.2` |
| Standing-rules entry (id match) | force `1.0` |
| Explicit always-load tags (`tag: standing-rule`) | force `1.0` |

Context-word corpus is built by splitting filenames on `/`, `-`, `_`, `.`, then lowercasing. Topics and commands are similarly tokenized. Scores are clamped to `[0, 1]`.

**Determinism required** — same inputs must yield same outputs (no timestamps, no randomness). Tested by T-MEM-08.

### Loader: `src/memory/memory-loader.ts`

```typescript
interface LoadOptions {
  threshold?: number;     // default 0.3
  tokenBudget?: number;   // default 2000
}

function loadRelevantMemories(
  entries: MemoryEntry[],
  ctx: TaskContext,
  opts?: LoadOptions
): MemoryEntry[];
```

**Behavior:**

1. Score every entry via `scoreMemoryRelevance`.
2. Filter to `score >= threshold`.
3. Sort descending by score.
4. Greedy-fill into token budget — add entries in score order until the next one would overflow, then stop. Do **not** pack-optimize (keep it simple; the highest-relevance entries win).
5. Always-load entries bypass the budget check (they're load-critical; a standing rule cannot be dropped for space).

### MEMORY.md + memory/*.md changes

**MEMORY.md:** Keep human-readable index intact. Add `(tokens: ~N)` annotation to each one-line entry so the loader can estimate cost without opening each file. Example:

```markdown
- [Trust system](trust-system.md) — build plan approved (tokens: ~400)
```

**memory/*.md:** Extend existing frontmatter with per-entry tags + token count:

```yaml
---
name: trust-system
type: project
tags: [trust, identity, gastown, keys]
token_count: 412
---
```

The tag vocabulary is freeform — no controlled list. Tags are matched against `ctx.topics` and filename-derived context words.

### Loader wiring in `.claude/hooks/gsd-restore-work-state.js`

Add a feature flag branch:

```javascript
if (process.env.GSD_MEMORY_RELEVANCE === '1') {
  try {
    const { loadRelevantMemories } = require('../../src/memory/memory-loader.js');
    const loaded = loadRelevantMemories(entries, taskContext, { tokenBudget: 2000 });
    // emit loaded entries
  } catch (e) {
    // fall through to passive load
    loadPassive();
  }
} else {
  loadPassive();
}
```

Passive load is the current behavior — keep it untouched as the fallback.

## Acceptance Criteria

1. `scoreMemoryRelevance()` returns scores in `[0, 1]` for every input entry (T-MEM-01).
2. Standing-rules entry always scores `1.0` regardless of task context (T-MEM-02).
3. HOT entries receive a `+0.2` base boost (T-MEM-03).
4. Keyword overlap contributes proportionally, capped at `+0.3` (T-MEM-04).
5. `loadRelevantMemories()` respects `tokenBudget` — total loaded tokens ≤ budget (T-MEM-05).
6. Loaded entries are sorted by score descending (T-MEM-06).
7. For a cartridge-work task context, NASA-mission entries score below the default threshold and are excluded (T-MEM-07).
8. Scorer is deterministic: same `(entries, ctx)` → identical `RelevanceScore[]` (T-MEM-08).
9. Integration test T-INT-03: loader with `budget=2000` loads **fewer** tokens than passive load on a cartridge-work context; the delta is measurable and reported in Wave 3.4.
10. Feature flag defaults to **off** — passive load remains the default behavior until T-INT-03 proves the loader works in practice.
11. All 44 existing MEMORY.md entries remain readable; no narrative restructuring of the index.

## Technical Notes

- Token counts in frontmatter are estimates. Use a simple character-based approximation (`Math.ceil(content.length / 4)`) during the Wave 2A.3 Haiku backfill; exact tokenizer-based counts can come later.
- The scorer is a pure TypeScript function — no Node builtins, no I/O. Import-safe from both src/ and tests/.
- The loader uses Node `fs` to read memory files. Wrap all reads in try/catch; a missing file is skipped silently, not fatal.
- The threshold default of `0.3` is tuned from OOPS doc 03 §5. If T-MEM-07 fails (NASA still scores above threshold on cartridge context), raise the threshold rather than re-weighting the scoring rules — re-weighting invalidates T-MEM-03 and T-MEM-04.
- MEMORY.md currently has ~277 lines per the session-start reminder. This exceeds the 200-line load limit. The relevance loader should reduce effective load substantially even without further index pruning; a manual trim is a follow-up, not part of this mission.
- The greedy fill is deliberately simple. Knapsack-optimal fill is out of scope — if it becomes necessary, it's a follow-up.
- Do **not** change the HOT/WARM/COLD section markers in MEMORY.md. The scorer reads them as `section: 'hot' | 'warm' | 'cold'` and their position drives the `+0.2` boost.

---

*Component spec for Platform Alignment milestone, track 2A. Source: OOPS doc 03 §5 at commit `254b50553`. Opus is assigned for the scorer because the heuristic weighting requires judgment that holds across task types — this is the genuinely-hard decision in the mission.*
