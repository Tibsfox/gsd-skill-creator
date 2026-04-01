# Memory System Analysis -- What Claude Code Knows, What We've Built, and Where the Gaps Are

**Date:** 2026-03-31
**Context:** Deep analysis of gsd-skill-creator's memory system (70 files, 250KB+) against Claude Code's internal memory lifecycle signals

## The Current State of Our Memory

The gsd-skill-creator project maintains one of the most extensive memory systems of any Claude Code project. The raw numbers tell the story:

- **70 memory files** in the project memory directory
- **250,000+ bytes** total across all files
- **132-line MEMORY.md** index file (the HOT/WARM manifest)
- **Multiple memory types**: user (12), project (18), feedback (13), reference (3), research (6), fox-companies (4), NASA (18+), plus cultural/legacy files

This is not a trivial memory system. It is a hand-curated knowledge base that has been built across months of intensive development, covering everything from trust system design decisions to hosting credentials to artistic style preferences to NASA mission architecture to Fox Infrastructure Companies vision documents.

### What Works Well

**1. The HOT/WARM tier structure is effective.** MEMORY.md splits into "HOT -- Current State (always in context)" and "WARM -- Reference (session start)." This is a manual implementation of relevance scoring: the HOT section contains what every session needs (current projects, standing rules, key subsystems), while WARM contains reference material (completed milestones, chain scores, key patterns). The user has organically arrived at a two-tier cache hierarchy.

**2. Individual memory files are well-scoped.** Each file covers a single topic with clear boundaries. `center-camp.md` is about the project's cultural foundation. `seattle-360-engine.md` is about the release engine state. `trust-system.md` is the complete trust design. The files don't bleed into each other. This is good information architecture.

**3. The frontmatter convention works.** Files with YAML frontmatter (`name`, `description`, `type`) are machine-parseable. The `type` field enables categorization. The `description` field (typically one sentence) provides enough context for relevance scoring without reading the full file. This convention, when followed, is exactly what a memory survey system would need.

**4. Handoff documents bridge sessions.** Files like `seattle-360-engine.md` and `avi-mam-mission-handoff.md` explicitly capture "where I stopped and what comes next." These are the most operationally valuable memories -- they turn session boundaries from knowledge cliffs into smooth transitions.

**5. Domain-specific clustering emerged naturally.** The NASA memories (18+ files) form a natural cluster that is only relevant during NASA branch work. The Fox Companies memories (4 files) cluster around business vision. The research open-questions memories (6 files) cluster around academic inquiry. This clustering is implicit -- no formal grouping exists -- but it matches how the memories are actually used.

### What Doesn't Work

**1. Everything loads every time.** MEMORY.md is injected as a system reminder into every conversation. All 132 lines. When working on the 360 engine, the NASA architecture details are irrelevant noise. When working on the trust system, the Rosetta cluster list wastes tokens. There is no conditional loading -- the entire index enters context regardless of task.

**2. The untyped files are invisible to automation.** Files without YAML frontmatter lack the metadata that would allow a survey system to assess their relevance without reading them. These include some of the largest and most important files: `MUSES.md` (6.7KB), `muse-ecosystem-preplan.md` (14.3KB), `muse-cartridges.md` (15.4KB), `campfire-gathering-2026-03-07.md` (10.7KB), `muse-architecture.md` (11.4KB), `trust-system.md` (10.5KB), `wasteland-journey.md` (9.0KB). These seven files alone total 78KB -- more than a third of the entire memory corpus. They are effectively dark memory: present on disk but unindexable.

**3. Stale project state accumulates.** Memory files are point-in-time snapshots. The `seattle-360-engine.md` says "57/360 degrees complete" but this number changes with every session. The `v1-49-89-mega-batch.md` describes a session from March 27. These project-type memories have a natural decay rate that nothing manages. The system-reminder warning ("this memory is N days old") helps, but it's a band-aid on a structural problem.

**4. The MEMORY.md index is manually maintained.** Every time the project state changes, someone has to update both the relevant memory file AND the MEMORY.md index. If they update one but not the other, the index lies. There is no mechanism to detect index drift.

**5. No retirement path.** The `handoff-v1.49.20.1.md` file describes a handoff from an old version (v1.49.20.1; we are now at v1.49.192). The `wasteland-journey.md` covers the wasteland branch which has been superseded. The `v1-49-39-weird-al.md` documents a single-session event. There is no mechanism to archive or retire memories that have become purely historical. They persist indefinitely, consuming storage and creating false relevance signals.

## Token Budget Analysis

Understanding the token cost of memory is essential for evaluating whether the system is worth its overhead.

### Current Token Consumption

MEMORY.md is approximately 132 lines and 8,277 bytes. At Claude's tokenization rate of roughly 4 characters per token, this is approximately **2,070 tokens** for the index alone.

But MEMORY.md is not the full cost. Claude Code's system prompt includes additional context:

| Component | Estimated Tokens | Frequency |
|-----------|-----------------|-----------|
| MEMORY.md (full HOT+WARM) | ~2,070 | Every turn (system prompt) |
| CLAUDE.md (project instructions) | ~550 | Every turn (system prompt) |
| Individual memory files loaded on demand | ~500-3,000 each | When referenced |
| Auto-memory context preamble | ~100 | Every turn |

**Baseline per-turn memory cost: ~2,720 tokens** (MEMORY.md + CLAUDE.md + preamble).

For a 200K context window, this is 1.36% of the total budget -- seemingly small. But context windows are not uniformly valuable. The first 10% of context (the system prompt region) has disproportionate influence on model behavior. Memory files in this region compete with instructions, conversation history, and tool outputs for the model's attention.

### The Relevance Waste Problem

If approximately half of MEMORY.md's content is irrelevant to any given session (a conservative estimate based on the domain clustering observed above), the waste calculation looks like this:

**Per-turn waste:** ~1,035 tokens of irrelevant memory
**Per-50-turn session:** ~51,750 tokens of irrelevant memory processed
**Per-session at $15/MTok (Opus input pricing):** ~$0.78 wasted on irrelevant memory

For a project that runs 5-10 sessions per day during active development:
**Daily waste:** $3.90-$7.80 in unnecessary token processing
**Monthly waste:** $117-$234

This is not catastrophic, but it is not negligible either. More importantly, the cost is not just financial -- irrelevant memory dilutes the model's attention in the system prompt region, potentially degrading response quality for every turn of every session.

### What Relevance Scoring Would Save

With a scoring system that loads only relevant memories per session:

| Session Type | Current Load | Scored Load | Savings |
|-------------|-------------|-------------|---------|
| 360 Engine work | All 132 lines (~2,070 tokens) | ~40 lines (~630 tokens) | 70% |
| NASA branch work | All 132 lines (~2,070 tokens) | ~55 lines (~860 tokens) | 58% |
| Trust system work | All 132 lines (~2,070 tokens) | ~45 lines (~710 tokens) | 66% |
| General maintenance | All 132 lines (~2,070 tokens) | ~60 lines (~940 tokens) | 55% |

**Average savings: ~62% of memory token cost**, or approximately 1,280 tokens per turn.

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
CREATE:  memory-command --> memory_files_started --> [write] --> memory_files_completed --> memory_saved
READ:    memory_survey --> [score all memories] --> memory-select --> [load selected]
UPDATE:  memory-command --> memory_files_started --> [overwrite] --> memory_files_completed --> memory_saved
RETIRE:  (not visible -- possibly manual deletion, or age-based pruning)
```

The CREATE/READ/UPDATE paths are clearly instrumented. The RETIRE path is the gap -- and it is the same gap in our system.

## Memory Relevance Scoring -- How It Should Work

Our MEMORY.md's HOT/WARM split is a manual approximation of what should be an automated process. Here is how a proper relevance scoring system would work for our 70-file memory set.

### Signal Sources for Scoring

**1. Keyword overlap.** Compare the memory's `description` field against the current conversation's first few messages. A session about "trust system" should highly rank `trust-system.md`, `trust-and-safety.md`, and `center-camp.md`. A session about "release v1.49.193" should rank `seattle-360-engine.md` and `ftp-sync-setup.md`.

**2. File path proximity.** If the current task involves files in `www/PNW/`, memories tagged as `project` with PNW-related descriptions should rank higher. If the task is in `src-tauri/`, the NASA memories are irrelevant.

**3. Recency.** A memory modified 2 days ago is more likely relevant than one modified 25 days ago. Not always -- `center-camp.md` is foundational regardless of age -- but recency is a useful signal for project-type memories.

**4. Type-based priors.** Some types have higher base relevance:
- `user` type: Always somewhat relevant (these are about the person driving the project)
- `feedback` type: Relevant when working on the domain they cover
- `project` type: Relevant when working on that specific project area
- `reference` type: Relevant when the specific resource is needed
- `cultural` type: Relevant during creative/planning work, less so during pure coding

**5. Explicit pinning.** Some memories should always load. The "Standing Rules" section of MEMORY.md contains hard rules ("NEVER git add/commit/push .planning files"). These are not optional. They should be pinned, not scored.

**6. Session history.** If a memory was loaded in the previous session and the current session appears to be a continuation (same branch, similar files), boost that memory's score. This enables session continuity without explicit handoff documents.

### Proposed Scoring Algorithm

```
FUNCTION score_memory(memory, context):
    // Inputs:
    //   memory.description: string (from frontmatter)
    //   memory.type: string (user|feedback|project|reference|cultural|handoff)
    //   memory.last_modified: timestamp
    //   memory.pinned: boolean
    //   context.keywords: string[] (extracted from user's first message)
    //   context.active_files: string[] (files in current git diff or task)
    //   context.branch: string (current git branch)
    //   context.previous_session_memories: string[] (memory IDs loaded last session)

    IF memory.pinned:
        RETURN 1.0  // Always load pinned memories

    // Keyword overlap: TF-IDF simplified to term frequency
    keyword_score = 0.0
    description_words = lowercase(tokenize(memory.description))
    FOR EACH keyword IN context.keywords:
        IF keyword IN description_words:
            keyword_score += 1.0 / len(context.keywords)
    keyword_score = MIN(keyword_score, 1.0)

    // Path proximity: shared path segments
    path_score = 0.0
    IF memory.type == "project" AND memory.related_paths:
        FOR EACH active_file IN context.active_files:
            shared = count_shared_path_segments(memory.related_paths, active_file)
            path_score = MAX(path_score, shared / MAX_PATH_DEPTH)

    // Branch relevance: NASA memories boost on nasa branch, etc.
    branch_score = 0.0
    IF memory.description contains context.branch:
        branch_score = 0.5
    IF memory.tags AND context.branch IN memory.tags:
        branch_score = 0.8

    // Recency: exponential decay, half-life of 7 days for project, 30 days for user
    days_old = (NOW - memory.last_modified) / DAYS
    IF memory.type IN ["project", "handoff"]:
        recency_score = exp(-0.099 * days_old)  // half-life ~7 days
    ELSE:
        recency_score = exp(-0.023 * days_old)  // half-life ~30 days

    // Type prior
    type_priors = {
        "user": 0.30,
        "feedback": 0.20,
        "project": 0.15,
        "cultural": 0.15,
        "handoff": 0.25,
        "reference": 0.10,
        "research": 0.10
    }
    type_score = type_priors[memory.type] OR 0.10

    // Session continuity bonus
    continuity_score = 0.0
    IF memory.id IN context.previous_session_memories:
        continuity_score = 0.3

    // Weighted combination
    relevance = (keyword_score * 0.30)
              + (path_score * 0.15)
              + (branch_score * 0.10)
              + (recency_score * 0.15)
              + (type_score * 0.15)
              + (continuity_score * 0.15)

    RETURN CLAMP(relevance, 0.0, 1.0)

// Load threshold: 0.25 for detailed content, 0.15 for description-only
FUNCTION select_memories(all_memories, context):
    scored = []
    FOR EACH memory IN all_memories:
        score = score_memory(memory, context)
        scored.append((memory, score))

    scored.sort(BY score DESCENDING)

    selected = []
    token_budget = 1500  // Target: 1500 tokens for scored memories
    tokens_used = 0

    FOR EACH (memory, score) IN scored:
        IF score >= 0.25 AND tokens_used < token_budget:
            selected.append(memory)
            tokens_used += estimate_tokens(memory)
        ELSE IF score >= 0.15 AND tokens_used < token_budget:
            // Load description only, not full content
            selected.append(memory.summary_only())
            tokens_used += estimate_tokens(memory.description)

    RETURN selected
```

### Worked Example: 360 Engine Session

User opens a session and says: "Continue the 360 engine -- next is degree 57."

**Context extraction:**
- keywords: ["360", "engine", "degree", "57"]
- branch: "dev"
- active_files: ["www/tibsfox/com/Research/SPS/"]

**Top-scoring memories:**

| Memory | Keyword | Path | Branch | Recency | Type | Continuity | Total |
|--------|---------|------|--------|---------|------|------------|-------|
| seattle-360-engine.md | 0.75 | 0.8 | 0.0 | 0.85 | 0.15 | 0.3 | **0.49** |
| ftp-sync-setup.md | 0.25 | 0.4 | 0.0 | 0.70 | 0.15 | 0.3 | **0.30** |
| line-art-seeds.md | 0.50 | 0.4 | 0.0 | 0.60 | 0.20 | 0.0 | **0.29** |
| Standing Rules (pinned) | -- | -- | -- | -- | -- | -- | **1.00** |
| trust-system.md | 0.00 | 0.0 | 0.0 | 0.40 | 0.15 | 0.0 | **0.09** |
| nasa-6-track-architecture.md | 0.00 | 0.0 | 0.0 | 0.55 | 0.15 | 0.0 | **0.10** |

**Result:** The system loads Standing Rules (pinned), seattle-360-engine.md, ftp-sync-setup.md, and line-art-seeds.md. The trust system and NASA memories score below threshold and are not loaded. This matches exactly what a human would hand-select for a 360 engine session.

## Specific Files That Should Be Retired or Merged

Based on the analysis of all 70 memory files, the following actions would improve the system:

### Candidates for Retirement (move to archive/)

| File | Size | Last Modified | Reason |
|------|------|---------------|--------|
| `handoff-v1.49.20.1.md` | 3.2KB | Mar 6 | We are at v1.49.192. This handoff is 172 versions stale. Its architectural decisions are preserved in other memories. |
| `v1-49-39-weird-al.md` | 1.5KB | Mar 25 | Documents a single session's cultural event. The pattern it demonstrates (session personality) is not referenced. |
| `v1-49-89-mega-batch.md` | 2.0KB | Mar 27 | Documents a past session. The convoy pattern it proved is already captured in MEMORY.md's "Key Patterns" section. |
| `inserted-mission-pause.md` | 0.8KB | Mar 29 | Temporary pause marker. The pause has been resolved. |

### Candidates for Merger (combine into fewer files)

| Source Files | Merge Into | Rationale |
|-------------|-----------|-----------|
| `nasa-6-track-architecture.md`, `nasa-philosophy-and-tracks.md`, `nasa-philosophy-and-dedications.md`, `nasa-mission-philosophy-deep.md` | `nasa-core-design.md` | Four files covering overlapping aspects of NASA mission philosophy. Combined, they are 12KB; a merged document would be ~6KB with deduplication. |
| `fox-companies-grand-vision.md`, `fox-companies-legal-status.md`, `fox-companies-strategy.md` | `fox-companies.md` | Three files (7KB total) about Fox Companies that could be one structured document (~4KB). |
| `nasa-data-architecture.md`, `nasa-batteries-included.md`, `nasa-document-formats.md` | `nasa-infrastructure.md` | Technical infrastructure details that overlap. |
| `foxy-art-style.md`, `foxy-html-style.md` | `foxy-style-guide.md` | Two style preference files that are closely related. |

### Candidates for Frontmatter Addition (11 untyped files)

| File | Suggested Type | Suggested Description |
|------|---------------|----------------------|
| `MUSES.md` | cultural | Muse team roster and role definitions |
| `muse-architecture.md` | cultural | Muse system architecture and interaction model |
| `muse-cartridges.md` | cultural | Muse personality cartridge specifications |
| `muse-ecosystem-preplan.md` | cultural | Pre-planning for muse ecosystem integration |
| `campfire-gathering-2026-03-07.md` | cultural | Campfire session transcript and decisions |
| `trust-system.md` | project | Trust relationship system design (12 decisions, build plan) |
| `trust-and-safety.md` | feedback | Trust and safety principles for AI interaction |
| `wasteland-journey.md` | project:archived | Wasteland branch exploration and outcomes |
| `centercamp-epistemology.md` | cultural | Center Camp philosophical framework |

**Estimated effort:** Retirements: 15 minutes. Mergers: 2 hours (requires careful deduplication). Frontmatter: 30 minutes (scriptable).

## Cross-Session Learning Examples from Actual Work

The 360 engine is our best case study for cross-session learning because it has run across 57+ sessions, each producing a single degree of the 360-degree series. Here are concrete examples of memory enabling (or failing to enable) cross-session learning.

### Example 1: The Line Art Seed Discovery (Successful Learning)

**Session N (around degree 30):** The user decided that each degree should have a unique line-art SVG seed -- a minimalist illustration derived from the research subject. This was captured in `line-art-seeds.md` with the specific rules: SVG format, CSS-only animation, no JavaScript, brand-aligned color palette.

**Session N+1 through N+27:** Every subsequent 360 engine session loaded this memory and generated line-art seeds correctly. The memory prevented re-discovery of the format (which would have cost 5-10 minutes per session) and ensured consistency across all 27 subsequent degrees.

**Compounding value:** 27 sessions x 7 minutes saved = approximately 3 hours of cumulative time savings from one memory file. Plus consistency that would have been impossible without the documented convention.

### Example 2: The FTP Sync Workflow (Successful Learning)

**Session N (around degree 40):** FTP sync to tibsfox.com was set up and the process was documented in `ftp-sync-setup.md` -- server details, path mapping, the correct order of operations (commit, tag, build, sync).

**Subsequent sessions:** Every release session since then has been able to sync to the live server without re-discovering the process. The `ftp-path-mapping.md` companion file maps local paths to remote paths, preventing the common error of uploading to the wrong directory.

**Compounding value:** This is a standing-rule type memory disguised as a project memory. It prevents a class of errors (wrong upload path) that would be costly to diagnose and fix after the fact.

### Example 3: The Degree Counter Drift (Failed Learning)

**Session N:** Memory says "57/360 degrees complete."
**Session N+1:** Memory still says "57/360 degrees complete" -- but degree 58 has actually been produced. The agent reads the stale count, may repeat work or make incorrect progress calculations.

**Why it failed:** The degree count is a numerical value that changes every session, stored as a static string in a memory file. No one updated the memory after degree 58 shipped. The memory became a lie that persisted until someone noticed.

**The fix:** Dynamic derivation. Instead of storing the count, compute it:

```bash
# Count published degrees from the filesystem
DEGREE_COUNT=$(ls -d www/tibsfox/com/Research/SPS/degrees/*/index.html 2>/dev/null | wc -l)
```

This eliminates drift entirely by deriving state from the source of truth (the filesystem) rather than from a cached snapshot (the memory file).

### Example 4: The Git Branch Rule (Successful Learning -- Critical)

**Early session:** An agent accidentally committed to `main` instead of `dev`. This caused a merge conflict that took 30 minutes to resolve.

**Response:** The "BRANCH RULE: Work on dev, NOT main" was added to MEMORY.md's Standing Rules section and pinned.

**Every subsequent session:** The rule loads in the system prompt. No agent has committed to `main` since. This is the canonical example of a memory that prevents error recurrence -- one incident, one rule, infinite prevention.

### Example 5: The Gastown Convoy Pattern (Successful but Fading)

**Session N (v1.49.89 mega-batch):** The Gastown convoy model was proven at scale -- 50+ research projects produced in a single session using parallel agents.

**Memory created:** `v1-49-89-mega-batch.md` documented the session.

**Subsequent sessions:** The pattern itself was incorporated into the workflow tools and no longer needs to be re-discovered each session. The memory file now serves no operational purpose -- its value has been absorbed into the codebase.

**Lesson:** When a memory's insights are incorporated into code or configuration, the memory should be retired. It has served its purpose. Keeping it creates noise without value.

## Memory Categories Analysis

### Current Distribution

| Type | Count | % | Avg Size | Total Size | Purpose |
|------|-------|---|----------|------------|---------|
| NASA-related | 18 | 26% | 2.5 KB | 45 KB | NASA mission architecture, philosophy, data |
| project | 18 | 26% | 2.4 KB | 43 KB | Active project state, architecture, pipeline |
| feedback | 13 | 19% | 2.1 KB | 27 KB | User preferences, style decisions, design direction |
| user | 12 | 17% | 2.4 KB | 29 KB | Personal background, places, ethics, art |
| (untyped/cultural) | 7 | 10% | 8.5 KB | 60 KB | Muse system, campfire sessions, philosophy |
| reference | 3 | 4% | 1.4 KB | 4 KB | External service details, tool references |
| research | 6 | 9% | 2.2 KB | 13 KB | Open questions, academic inquiry |
| fox-companies | 4 | 6% | 2.5 KB | 10 KB | Business vision, strategy |

(Note: Some files span categories; percentages exceed 100% due to overlap.)

### Are Four Types Optimal?

The four original types (user, feedback, project, reference) do not adequately cover the memory corpus. The data demands refinements:

**Split `project` into `project:active` and `project:archived`.** The v1-49-89-mega-batch session is historical -- it documents a past achievement. The seattle-360-engine is active state. These have fundamentally different relevance profiles. Active project memories should score higher by default; archived ones should only surface when explicitly relevant.

**Add `cultural` type.** The 7 untyped files include MUSES.md, campfire-gathering, muse-architecture, muse-cartridges, muse-ecosystem-preplan, wasteland-journey, centercamp-epistemology. These are cultural memory -- they define the project's identity, philosophy, and emotional landscape. They are neither user preferences nor project state. They are the project's soul. A `cultural` type would give them proper status and relevance scoring.

**Add `handoff` type.** Handoff documents (handoff-v1.49.20.1.md, avi-mam-mission-handoff.md) serve a unique function: session-to-session continuity. They are the most operationally important memories during their active window, then become purely archival. A `handoff` type with automatic recency boosting would serve this pattern.

**Add `research` type.** The six `research_open-questions-*.md` files are academic in nature. They should only surface when the conversation is about research topics.

### Proposed Taxonomy

| Type | Purpose | Relevance Profile | Count |
|------|---------|-------------------|-------|
| `user` | About the human (background, ethics, art, places) | Always somewhat relevant | 12 |
| `feedback` | Design decisions, style preferences, approved directions | Relevant when touching that domain | 13 |
| `project:active` | Current project state, pipeline, next steps | High relevance when working on that project | ~10 |
| `project:archived` | Completed milestones, past sessions, historical decisions | Low base relevance, keyword-activated | ~8 |
| `cultural` | Muse system, philosophy, campfire sessions, identity | Medium relevance, higher during creative/planning work | 7 |
| `reference` | External services, credentials (paths only), tool details | Low base relevance, keyword-activated | 3 |
| `handoff` | Session continuity, "where I stopped" documents | Very high relevance for first 1-2 sessions, then auto-archive | 2 |
| `research` | Open questions, academic inquiry, theoretical exploration | Low base relevance, keyword-activated | 6 |
| `vision` | Fox Companies, long-term business strategy | Medium when surfaced, standing instruction to keep in mind | 4 |

## Cross-Session Learning

Memory is the mechanism by which an AI assistant improves across sessions. Without memory, every session starts from zero. With memory, sessions compound. The question is what compounds and what merely accumulates.

### What Compounds (Valuable)

**Design decisions compound.** The 12 trust system decisions (trust-system.md) prevent re-debating settled architecture. Each session that references these decisions builds on them rather than reconsidering them. This is the highest-value memory pattern.

**Style preferences compound.** The landing-page-layout feedback prevents the "centered hero" mistake from recurring. The art-style and html-style preferences ensure consistency across hundreds of generated pages. Each correction recorded as feedback is a mistake that never happens again.

**Standing rules compound.** "NEVER git add/commit/push .planning files" eliminates an entire class of errors across every future session. "Work on dev, NOT main" prevents merge disasters. One memory, infinite prevention.

**Workflow patterns compound.** The convoy model, the mission pack pipeline, the wave-based parallel execution -- these are not just memories, they are executable knowledge. Once documented, they become the default approach for all similar future work.

### What Merely Accumulates (Lower Value)

**Session chronicles accumulate.** The v1-49-89-mega-batch memory documents an impressive session. But its operational value decreases with time. The pattern it proved (Gastown convoy model) is already captured in MEMORY.md's "Key Patterns" section. The session-specific details are historical.

**Numerical state accumulates.** "57/360 degrees complete" is stale the moment the next degree ships. Every project-state number is a ticking clock toward inaccuracy. These should be derived from source-of-truth files (git tags, file counts), not stored as static memories.

**Temporary coordination state accumulates.** Pause markers, branch strategy documents for specific sprints, inserted-mission-pause -- these serve their purpose and then linger.

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
  4. Prune memories whose value has been absorbed into code
```

This loop works for decisions, preferences, and rules. It fails for state (which drifts) and chronicles (which lose relevance). The system should optimize for learning-loop memories and manage accumulation-pattern memories more aggressively.

### The Memory Half-Life Model

Not all memories decay at the same rate. A useful mental model:

| Memory Type | Half-Life | Example | Action at 2x Half-Life |
|-------------|-----------|---------|----------------------|
| Standing rules | Infinite | "Never push to main" | Never retire |
| Design decisions | 6 months | Trust system architecture | Verify still valid |
| Style preferences | 3 months | Art style, HTML conventions | Refresh examples |
| Project:active state | 1 week | "57/360 degrees" | Derive dynamically |
| Handoff documents | 2 sessions | "Resume from degree 57" | Auto-archive |
| Session chronicles | 1 week | v1.49.89 mega-batch | Archive after pattern extracted |
| Temporary coordination | 3 days | Inserted-mission-pause | Delete when resolved |

A memory management system could use these half-lives to automatically flag memories for review, archive, or retirement without human intervention.

## Specific Improvements

### 1. Add Frontmatter to All Untyped Files

The untyped files are invisible to any automated system. These include some of the project's most important cultural documents (MUSES.md, campfire-gathering, trust-system.md). Adding frontmatter is a one-time cost that enables all downstream automation.

**Implementation:** Script that reads each file, infers type from content, generates frontmatter, prepends it. Human review for type assignment.

**Effort:** 30 minutes (scriptable for the mechanical parts, human review for type assignment).

### 2. Implement Memory Freshness Tracking

Add a `last_verified` field to frontmatter. When a memory is accessed during a session and its content is confirmed still accurate, update this field. When `last_verified` is more than 14 days old for a `project` type memory, flag it for review. When more than 30 days old, auto-demote to `project:archived`.

**Implementation:** A SessionEnd or PostCompact hook that writes `last_verified` timestamps to recently-accessed memory files.

**Effort:** 2 hours.

### 3. Build a Memory Survey Skill

Create a `.claude/skills/memory-survey/` skill that runs at session start. It:
- Reads all memory file frontmatter (not full content)
- Scores each against the conversation's initial context using the algorithm above
- Produces a ranked list of memories to load
- Injects only relevant memories into the system prompt

This is the `memory_survey` pattern from the binary, implemented in our skill system.

**Implementation:** SKILL.md with `when: session_start` trigger. TypeScript scoring function. Integration with session-awareness skill for context extraction.

**Effort:** 4-6 hours for the core implementation. 2 hours for integration testing.

### 4. Create a Memory Retirement Pipeline

Memories that haven't been accessed in 60+ days and score below 0.1 on relevance for the last 10 sessions should be offered for archival. Archived memories move to a `memory/archive/` subdirectory. They are not deleted -- they are just excluded from the survey by default.

**Implementation:** Monthly maintenance command that analyzes access patterns and proposes retirements. Human approves.

**Effort:** 2 hours.

### 5. Separate Pinned Rules from Scored Content

The Standing Rules in MEMORY.md are not optional context -- they are hard constraints. They should not be subject to relevance scoring. Extract them into a dedicated `memory/RULES.md` file that always loads, separate from the scored index.

Current Standing Rules that should be pinned:
- HARD RULE: NEVER git add/commit/push .planning files
- No Co-Authored-By line
- Session startup: Ask user what's going on FIRST
- UNANSWERED QUESTIONS: Track and resurface
- User prefs: Lowest verbosity, autonomous execution
- DOCS ARE THE STORY: Full verbosity in documentation
- RELEASE NOTES CHECKLIST
- BRANCH RULE: Work on dev, NOT main

**Implementation:** Split MEMORY.md into `RULES.md` (always loaded, ~20 lines, ~300 tokens) and `INDEX.md` (scored, ~110 lines).

**Effort:** 1 hour.

### 6. Derive State from Source of Truth

Instead of storing "57/360 degrees complete" as a static memory, compute it at session start:

```bash
ls www/tibsfox/com/Research/SPS/degrees/ | wc -l
```

Dynamic state should be computed, not remembered. This eliminates drift entirely.

**Implementation:** Memory files for project state should include a `verify_command` field in frontmatter. At load time, run the command and update the memory's numerical claims.

```yaml
---
name: seattle-360-engine
type: project:active
description: Seattle 360 Engine autonomous release pipeline state
verify_command: "ls www/tibsfox/com/Research/SPS/degrees/ 2>/dev/null | wc -l"
verify_field: "degrees_complete"
---
```

**Effort:** 2 hours (frontmatter convention + survey skill integration).

### 7. Memory Deduplication

MEMORY.md's HOT section summarizes content that exists in full in individual files. The trust system summary in MEMORY.md duplicates content from `trust-system.md`. The 360 engine summary duplicates `seattle-360-engine.md`. If the survey system loads the full file when relevant, the MEMORY.md summary becomes redundant.

**Implementation:** After implementing the survey skill, audit MEMORY.md for entries that are pure summaries of individual files. Replace with pointers: "See memory/trust-system.md" rather than inline summaries.

**Effort:** 1 hour.

## Implementation Roadmap

### Phase 1: Foundation (1 day)

1. Add frontmatter to all 11 untyped files (30 min)
2. Retire the 4 stale files to `archive/` (15 min)
3. Extract Standing Rules to `RULES.md` (1 hour)
4. Add `verify_command` to project:active memories (1 hour)

**Outcome:** All files are indexable. Rules are separated from scored content. Dynamic state is derivable.

### Phase 2: Scoring Engine (2-3 days)

1. Implement the relevance scoring function in TypeScript (4 hours)
2. Build the memory survey skill with SessionStart integration (4 hours)
3. Add session history tracking for continuity scoring (2 hours)
4. Test against 5 different session types (360 engine, NASA, trust, maintenance, general) (2 hours)

**Outcome:** Sessions load only relevant memories. Token savings of ~60%. Relevance improves measurably.

### Phase 3: Lifecycle Automation (1-2 days)

1. Implement freshness tracking via SessionEnd hook (2 hours)
2. Build the retirement pipeline with human approval step (2 hours)
3. Implement the merge recommendations for overlapping files (2 hours)
4. Add memory access logging for analytics (1 hour)

**Outcome:** Memories have verifiable freshness. Stale memories are flagged. Overlapping memories are consolidated.

### Phase 4: Integration (ongoing)

1. Connect scoring engine to PostCompact hook for dynamic re-scoring (2 hours)
2. Build memory health dashboard (access patterns, staleness, coverage gaps) (4 hours)
3. A/B test scored loading versus current all-load approach (2 hours)
4. Iterate scoring weights based on user feedback (ongoing)

**Outcome:** Memory system is self-managing. Health is visible. Scoring improves over time.

## The Honest Assessment

Our memory system is better than most Claude Code projects will ever build. 70 files, multiple types, YAML frontmatter conventions, a HOT/WARM tiered index, handoff documents for session continuity, domain-specific clustering -- this is serious information architecture. It works because the user has been disciplined about curating it.

But it is a manual system operating at a scale that demands automation. 70 files with 250KB+ of content cannot be efficiently managed by hand. The lack of relevance scoring means every session pays the full token cost for all memories. The lack of freshness tracking means stale state persists indefinitely. The lack of retirement means the system only grows, never prunes.

The Claude Code binary signals tell us the platform is moving toward exactly the automation we need: survey-based relevance scoring, lifecycle tracking (started/completed/saved), and selection mechanisms. Whether we build this ourselves or wait for the platform to ship it, the direction is clear.

The most impactful single change would be implementing the memory survey skill (Phase 2 above). It would immediately reduce token waste by 50-60%, improve session relevance, and create the foundation for all other improvements. Everything else -- frontmatter cleanup, freshness tracking, retirement, deduplication -- builds on having a working survey in place.

The second most impactful change is separating pinned rules from scored content (Phase 1, item 3). This is the simplest change with the clearest benefit: rules that must always load should not depend on a scoring algorithm. They should load unconditionally, separately, and first.

The memory system is the project's institutional knowledge. Right now it is a well-organized library with no librarian. The library's collection keeps growing, its catalog cards are inconsistent, and no one is weeding the stacks. It needs a librarian -- and the first step is giving that librarian a catalog system that actually covers every book in the collection.
