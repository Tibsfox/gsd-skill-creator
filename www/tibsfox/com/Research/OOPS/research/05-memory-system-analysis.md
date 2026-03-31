# Memory System Analysis — What Claude Code Knows, What We've Built, and Where the Gaps Are

**Date:** 2026-03-31
**Context:** Deep analysis of gsd-skill-creator's memory system (58 files, 211KB) against Claude Code's internal memory lifecycle signals

## The Current State of Our Memory

The gsd-skill-creator project maintains one of the most extensive memory systems of any Claude Code project. The raw numbers tell the story:

- **58 memory files** in the project memory directory
- **211,650 bytes** total across all files
- **132-line MEMORY.md** index file (the HOT/WARM manifest)
- **4 memory types**: user (12), project (18), feedback (13), reference (3), plus 11 untyped legacy files

This is not a trivial memory system. It is a hand-curated knowledge base that has been built across months of intensive development, covering everything from trust system design decisions to hosting credentials to artistic style preferences to NASA mission architecture.

### What Works Well

**1. The HOT/WARM tier structure is effective.** MEMORY.md splits into "HOT -- Current State (always in context)" and "WARM -- Reference (session start)." This is a manual implementation of relevance scoring: the HOT section contains what every session needs (current projects, standing rules, key subsystems), while WARM contains reference material (completed milestones, chain scores, key patterns). The user has organically arrived at a two-tier cache hierarchy.

**2. Individual memory files are well-scoped.** Each file covers a single topic with clear boundaries. `center-camp.md` is about the project's cultural foundation. `seattle-360-engine.md` is about the release engine state. `trust-system.md` is the complete trust design. The files don't bleed into each other. This is good information architecture.

**3. The frontmatter convention works.** Files with YAML frontmatter (`name`, `description`, `type`) are machine-parseable. The `type` field enables categorization. The `description` field (typically one sentence) provides enough context for relevance scoring without reading the full file. This convention, when followed, is exactly what a memory survey system would need.

**4. Handoff documents bridge sessions.** Files like `seattle-360-engine.md` and `avi-mam-mission-handoff.md` explicitly capture "where I stopped and what comes next." These are the most operationally valuable memories -- they turn session boundaries from knowledge cliffs into smooth transitions.

### What Doesn't Work

**1. Everything loads every time.** MEMORY.md is injected as a system reminder into every conversation. All 132 lines. When working on the 360 engine, the NASA architecture details are irrelevant noise. When working on the trust system, the Rosetta cluster list wastes tokens. There is no conditional loading -- the entire index enters context regardless of task.

**2. The untyped files are invisible to automation.** 11 files (MUSES.md, campfire-gathering, trust-system.md, wasteland-journey.md, and others) lack the YAML frontmatter that would allow a survey system to assess their relevance without reading them. These are some of the largest files (muse-ecosystem-preplan.md at 221 lines, campfire-gathering at 213 lines). They are effectively dark memory -- present on disk but unindexable.

**3. Stale project state accumulates.** Memory files are point-in-time snapshots. The `seattle-360-engine.md` says "57/360 degrees complete" but this number changes with every session. The `v1-49-89-mega-batch.md` describes a session from March 27. These project-type memories have a natural decay rate that nothing manages. The system-reminder warning ("this memory is N days old") helps, but it's a band-aid on a structural problem.

**4. The MEMORY.md index is manually maintained.** Every time the project state changes, someone has to update both the relevant memory file AND the MEMORY.md index. If they update one but not the other, the index lies. There is no mechanism to detect index drift.

**5. No retirement path.** The `handoff-v1.49.20.1.md` file describes a handoff from an old version. The `wasteland-journey.md` covers a branch that may or may not still be active. There is no mechanism to archive or retire memories that have become purely historical. They persist indefinitely, consuming storage and creating false relevance signals.

## What the Binary Tells Us About Memory Lifecycle

The Claude Code binary contains several memory-related strings that, taken together, reveal the shape of an active memory management system:

### `memory-command`

This likely corresponds to the `/memory` command that users can invoke to create, edit, or manage memories. It is the entry point -- the human-initiated write path into the memory system. When a user says "remember this," the memory-command pathway handles parsing the instruction, determining scope (user-level vs. project-level), and routing to storage.

### `memory-select`

This suggests a selection mechanism -- choosing which memories to load for a given context. If the system has many memory files (as ours does), it cannot load all of them into every conversation. `memory-select` likely implements the query: "given the current conversation context, which memories are relevant?" This is the read-side counterpart to memory-command's write-side.

### `memory_survey`

A survey is a sweep across all available memories to assess them. This is not about loading content -- it is about metadata inspection. A memory survey likely reads frontmatter (name, description, type) from all memory files, scores them against the current context, and produces a ranked list. The survey determines what `memory-select` will actually load. This is the relevance scoring layer.

### `memory_files_started` / `memory_files_completed`

These track the lifecycle of memory file operations. When a memory is being created or updated, `memory_files_started` marks the operation as in-progress. `memory_files_completed` marks it as done. This prevents race conditions in multi-agent scenarios (two agents trying to write the same memory) and enables recovery (if a session crashes mid-write, the started-but-not-completed memory can be detected and cleaned up).

### `memory_saved`

The confirmation signal. A memory has been persisted to disk. This likely triggers any post-save hooks -- updating indexes, notifying the survey cache that a new memory exists, or logging the save for audit purposes.

### The Implied Lifecycle

Taken together, these strings describe a lifecycle:

```
CREATE:  memory-command → memory_files_started → [write] → memory_files_completed → memory_saved
READ:    memory_survey → [score all memories] → memory-select → [load selected]
UPDATE:  memory-command → memory_files_started → [overwrite] → memory_files_completed → memory_saved
RETIRE:  (not visible — possibly manual deletion, or age-based pruning)
```

The CREATE/READ/UPDATE paths are clearly instrumented. The RETIRE path is the gap -- and it is the same gap in our system.

## Memory Relevance Scoring -- How It Should Work

Our MEMORY.md's HOT/WARM split is a manual approximation of what should be an automated process. Here is how a proper relevance scoring system would work for our 58-file memory set:

### Signal Sources for Scoring

**1. Keyword overlap.** Compare the memory's `description` field against the current conversation's first few messages. A session about "trust system" should highly rank `trust-system.md`, `trust-and-safety.md`, and `center-camp.md`. A session about "release v1.49.193" should rank `seattle-360-engine.md` and `ftp-sync-setup.md`.

**2. File path proximity.** If the current task involves files in `www/PNW/`, memories tagged as `project` with PNW-related descriptions should rank higher. If the task is in `src-tauri/`, the NASA memories are irrelevant.

**3. Recency.** A memory modified 2 days ago is more likely relevant than one modified 25 days ago. Not always -- `center-camp.md` is foundational regardless of age -- but recency is a useful signal for project-type memories.

**4. Type-based priors.** Some types have higher base relevance:
- `user` type: Always somewhat relevant (these are about Foxy -- the person driving the project)
- `feedback` type: Relevant when working on the domain they cover
- `project` type: Relevant when working on that specific project area
- `reference` type: Relevant when the specific resource is needed

**5. Explicit pinning.** Some memories should always load. The "Standing Rules" section of MEMORY.md contains hard rules ("NEVER git add/commit/push .planning files"). These are not optional. They should be pinned, not scored.

### Proposed Scoring Formula

```
relevance = (keyword_overlap * 0.4) + (path_proximity * 0.2) + (recency * 0.15) + (type_prior * 0.15) + (pin_bonus * 0.1)
```

Where:
- `keyword_overlap`: 0-1, TF-IDF or simple term matching against conversation context
- `path_proximity`: 0-1, based on shared path segments with active files
- `recency`: 0-1, exponential decay from last-modified date
- `type_prior`: 0.3 for user, 0.2 for feedback, 0.15 for project, 0.1 for reference
- `pin_bonus`: 1.0 for pinned memories (Standing Rules, Branch Rules), 0 otherwise

Load threshold: memories scoring above 0.3 get loaded. Always load pinned memories regardless of score.

### Token Budget

At 132 lines (approximately 4,000 tokens), MEMORY.md is not excessive for a 200K context window. But it IS excessive relative to its utility per session. If half the content is irrelevant to any given session, that is approximately 2,000 wasted tokens per conversation turn where the system prompt is re-injected. Over a 50-turn session, that is 100,000 wasted tokens of irrelevant memory.

With relevance scoring, a typical session might load:
- Pinned rules: ~400 tokens (Standing Rules, Branch Rules, Commit Convention)
- Relevant project state: ~600 tokens (whichever engine/project is active)
- Relevant user context: ~400 tokens (2-3 user memories)
- Relevant feedback: ~200 tokens (1-2 feedback memories)
- **Total: ~1,600 tokens** instead of ~4,000

That is a 60% reduction in memory overhead with zero loss of relevant information.

## Memory Categories Analysis

### Current Distribution

| Type | Count | % | Avg Size | Purpose |
|------|-------|---|----------|---------|
| project | 18 | 31% | 2.4 KB | Active project state, architecture, pipeline |
| feedback | 13 | 22% | 2.1 KB | User preferences, style decisions, design direction |
| user | 12 | 21% | 2.4 KB | Personal background, places, ethics, art |
| (untyped) | 11 | 19% | 8.5 KB | Legacy files, muse system, campfire sessions |
| reference | 3 | 5% | 1.4 KB | External service details, tool references |

### Are Four Types Optimal?

The four types (user, feedback, project, reference) cover the main dimensions, but the data suggests refinements:

**Split `project` into `project:active` and `project:archived`.** The v1-49-89-mega-batch session is historical -- it documents a past achievement. The seattle-360-engine is active state. These have fundamentally different relevance profiles. Active project memories should score higher by default; archived ones should only surface when explicitly relevant.

**Add `cultural` type.** The 11 untyped files include MUSES.md, campfire-gathering, muse-architecture, muse-cartridges, muse-ecosystem-preplan, wasteland-journey, trust-and-safety, trust-system, centercamp-epistemology, handoff-v1.49.20.1. These are cultural memory -- they define the project's identity, philosophy, and emotional landscape. They are neither user preferences nor project state. They are the project's soul. A `cultural` type would give them proper status and relevance scoring.

**Add `handoff` type.** Handoff documents (handoff-v1.49.20.1.md, avi-mam-mission-handoff.md) serve a unique function: session-to-session continuity. They are the most operationally important memories during their active window, then become purely archival. A `handoff` type with automatic recency boosting would serve this pattern.

### Proposed Taxonomy

| Type | Purpose | Relevance Profile |
|------|---------|-------------------|
| `user` | About the human (background, ethics, art, places) | Always somewhat relevant |
| `feedback` | Design decisions, style preferences, approved directions | Relevant when touching that domain |
| `project:active` | Current project state, pipeline, next steps | High relevance when working on that project |
| `project:archived` | Completed milestones, past sessions, historical decisions | Low base relevance, keyword-activated |
| `cultural` | Muse system, philosophy, campfire sessions, identity | Medium relevance, higher during creative/planning work |
| `reference` | External services, credentials (paths only), tool details | Low base relevance, keyword-activated |
| `handoff` | Session continuity, "where I stopped" documents | Very high relevance for first 1-2 sessions, then archive |

## Cross-Session Learning

Memory is the mechanism by which an AI assistant improves across sessions. Without memory, every session starts from zero. With memory, sessions compound. The question is what compounds and what merely accumulates.

### What Compounds (Valuable)

**Design decisions compound.** The 12 trust system decisions (trust-system.md) prevent re-debating settled architecture. Each session that references these decisions builds on them rather than reconsidering them. This is the highest-value memory pattern.

**Style preferences compound.** The landing-page-layout feedback prevents the "centered hero" mistake from recurring. Each correction recorded as feedback is a mistake that never happens again.

**Standing rules compound.** "NEVER git add/commit/push .planning files" eliminates an entire class of errors across every future session. One memory, infinite prevention.

### What Merely Accumulates (Lower Value)

**Session chronicles accumulate.** The v1-49-89-mega-batch memory documents an impressive session. But its operational value decreases with time. The pattern it proved (Gastown convoy model) is already captured in MEMORY.md's "Key Patterns" section. The session-specific details are historical.

**Numerical state accumulates.** "57/360 degrees complete" is stale the moment the next degree ships. Every project-state number is a ticking clock toward inaccuracy. These should be derived from source-of-truth files (git tags, file counts), not stored as static memories.

### The Learning Loop

The ideal cross-session learning loop:

```
Session N:
  1. Load relevant memories (survey + select)
  2. Execute work
  3. Discover new pattern / preference / decision
  4. Create or update memory
  5. Update handoff doc if session boundary

Session N+1:
  1. Load relevant memories (now includes N's contributions)
  2. Benefit from N's learning without re-discovery
  3. Execute better/faster because of accumulated knowledge
```

This loop works for decisions, preferences, and rules. It fails for state (which drifts) and chronicles (which lose relevance). The system should optimize for learning-loop memories and manage accumulation-pattern memories more aggressively.

## Specific Improvements

### 1. Add Frontmatter to All 11 Untyped Files

The 11 files without YAML frontmatter are invisible to any automated system. These include some of the project's most important cultural documents (MUSES.md, campfire-gathering, trust-system.md). Adding frontmatter is a one-time cost that enables all downstream automation.

**Implementation:** Script that reads each file, infers type from content, generates frontmatter, prepends it. Human review for type assignment.

### 2. Implement Memory Freshness Tracking

Add a `last_verified` field to frontmatter. When a memory is accessed during a session and its content is confirmed still accurate, update this field. When `last_verified` is more than 14 days old for a `project` type memory, flag it for review. When more than 30 days old, auto-demote to `project:archived`.

**Implementation:** A PostCompact or session-end hook that writes `last_verified` timestamps to recently-accessed memory files.

### 3. Build a Memory Survey Skill

Create a `.claude/skills/memory-survey/` skill that runs at session start. It:
- Reads all memory file frontmatter (not full content)
- Scores each against the conversation's initial context
- Produces a ranked list of memories to load
- Injects only relevant memories into the system prompt

This is the `memory_survey` pattern from the binary, implemented in our skill system.

**Implementation:** SKILL.md with `when: session_start` trigger. TypeScript scoring function. Integration with session-awareness skill for context extraction.

### 4. Create a Memory Retirement Pipeline

Memories that haven't been accessed in 60+ days and score below 0.1 on relevance for the last 10 sessions should be offered for archival. Archived memories move to a `memory/archive/` subdirectory. They are not deleted -- they are just excluded from the survey by default.

**Implementation:** Monthly maintenance command that analyzes access patterns and proposes retirements. Human approves.

### 5. Separate Pinned Rules from Scored Content

The Standing Rules in MEMORY.md are not optional context -- they are hard constraints. They should not be subject to relevance scoring. Extract them into a dedicated `memory/RULES.md` file that always loads, separate from the scored index.

**Implementation:** Split MEMORY.md into `RULES.md` (always loaded, ~20 lines) and `INDEX.md` (scored, ~110 lines).

### 6. Derive State from Source of Truth

Instead of storing "57/360 degrees complete" as a static memory, compute it at session start:
```bash
ls www/tibsfox/com/Research/SPS/degrees/ | wc -l
```

Dynamic state should be computed, not remembered. This eliminates drift entirely.

**Implementation:** Memory files for project state should include a `verify_command` field in frontmatter. At load time, run the command and update the memory's numerical claims.

### 7. Memory Deduplication

MEMORY.md's HOT section summarizes content that exists in full in individual files. The trust system summary in MEMORY.md duplicates content from `trust-system.md`. The 360 engine summary duplicates `seattle-360-engine.md`. If the survey system loads the full file when relevant, the MEMORY.md summary becomes redundant.

**Implementation:** After implementing the survey skill, audit MEMORY.md for entries that are pure summaries of individual files. Replace with pointers: "See memory/trust-system.md" rather than inline summaries.

## The Honest Assessment

Our memory system is better than most Claude Code projects will ever build. 58 files, 4 types, YAML frontmatter, a HOT/WARM tiered index, handoff documents for session continuity -- this is serious information architecture. It works because Foxy has been disciplined about curating it.

But it is a manual system operating at a scale that demands automation. 58 files with 211KB of content cannot be efficiently managed by hand. The lack of relevance scoring means every session pays the full token cost for all memories. The lack of freshness tracking means stale state persists indefinitely. The lack of retirement means the system only grows, never prunes.

The Claude Code binary signals tell us the platform is moving toward exactly the automation we need: survey-based relevance scoring, lifecycle tracking (started/completed/saved), and selection mechanisms. Whether we build this ourselves or wait for the platform to ship it, the direction is clear.

The most impactful single change would be implementing the memory survey skill (#3 above). It would immediately reduce token waste by 50-60%, improve session relevance, and create the foundation for all other improvements. Everything else -- frontmatter cleanup, freshness tracking, retirement, deduplication -- builds on having a working survey in place.

The memory system is the project's institutional knowledge. Right now it is a well-organized library with no librarian. It needs one.
