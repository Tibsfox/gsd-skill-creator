# Architecture

**Analysis Date:** 2026-01-30

## Pattern Overview

**Overall:** Layered modular architecture with specialized domains for skill lifecycle management

**Key Characteristics:**
- **Domain separation**: Observable patterns → Detection → Storage → Application → Composition → Learning
- **Unidirectional data flow**: Sessions → Patterns → Candidates → Skills → Active sessions
- **Plugin-based skill system**: Skills as composable units with metadata, triggers, and versioning
- **Bounded learning loops**: Feedback collection → Eligibility checks → Refinement suggestions → User confirmation
- **Agent composition**: Skill co-activation tracking → Cluster detection → Agent generation

## Layers

**Observation Layer:**
- Purpose: Capture Claude Code usage patterns and sessions
- Location: `src/observation/`
- Contains: Session tracking, transcript parsing, pattern summarization, retention management
- Depends on: File system (sessions.jsonl)
- Used by: Detection layer for pattern analysis

**Detection Layer:**
- Purpose: Identify recurring patterns and suggest new skills
- Location: `src/detection/`
- Contains: Pattern analyzer, skill candidates, suggestion store and manager
- Depends on: Observation data, Storage (to check addressed patterns)
- Used by: CLI suggestion workflows, automatic suggestion management

**Storage Layer:**
- Purpose: Persist skills, patterns, and metadata
- Location: `src/storage/`
- Contains: SkillStore (SKILL.md files), PatternStore (patterns.jsonl), SkillIndex (searchable index)
- Depends on: File system (.claude/skills/, .planning/patterns/)
- Used by: All layers requiring read/write operations

**Validation Layer:**
- Purpose: Ensure data integrity for skills and input
- Location: `src/validation/`
- Contains: Zod schemas for skill names, triggers, metadata
- Depends on: Type system (zod library)
- Used by: Workflows, Application layer before persistence

**Application Layer:**
- Purpose: Execute skill loading and active session management
- Location: `src/application/`
- Contains: TokenCounter, RelevanceScorer, ConflictResolver, SkillSession, SkillApplicator
- Depends on: Storage layer, validation
- Used by: CLI invoke/status commands, external systems needing skill injection

**Composition Layer:**
- Purpose: Resolve skill dependencies and compose agents
- Location: `src/composition/`
- Contains: DependencyGraph (skill relationships), SkillResolver (resolve dependencies)
- Depends on: Storage layer (skill metadata)
- Used by: Application layer for conflict detection, agents module for clustering

**Learning Layer:**
- Purpose: Improve skills through feedback and versioning
- Location: `src/learning/`
- Contains: FeedbackStore (capture corrections), FeedbackDetector (analyze patterns), RefinementEngine (generate suggestions), VersionManager (track git history)
- Depends on: Storage layer, git (for version history)
- Used by: CLI refinement/history/rollback workflows

**Agents Module:**
- Purpose: Suggest and create composite agents from co-activations
- Location: `src/agents/`
- Contains: CoActivationTracker (score co-usage), ClusterDetector (find stable patterns), AgentGenerator (create agent files), AgentSuggestionManager
- Depends on: Learning layer (for co-activation scoring), Storage layer
- Used by: CLI agents command

**Workflows Layer:**
- Purpose: Orchestrate multi-step user interactions
- Location: `src/workflows/`
- Contains: createSkillWorkflow, listSkillsWorkflow, searchSkillsWorkflow
- Depends on: Storage, Validation, Application
- Used by: CLI commands

**CLI Layer:**
- Purpose: User interface for all operations
- Location: `src/cli.ts`
- Contains: Command routing, interactive prompts, output formatting
- Depends on: All layers
- Used by: Direct user invocation

## Data Flow

**Skill Creation Flow:**

1. User invokes `skill-creator create` → `createSkillWorkflow`
2. Collect name, description, triggers via interactive prompts
3. Validate against `SkillInputSchema` (Zod schemas)
4. Store to `.claude/skills/{name}/SKILL.md` via `SkillStore`
5. Index in `SkillIndex` for searchability
6. Return success message with file path

**Pattern Detection and Suggestion Flow:**

1. Claude Code sessions logged to `.planning/patterns/sessions.jsonl`
2. User runs `skill-creator suggest` → `SuggestionManager.runDetection()`
3. `PatternAnalyzer` streams sessions file, counts command/decision frequency
4. Extract candidates where frequency ≥ 3 and not already addressed
5. Store new candidates in `SuggestionStore` as pending suggestions
6. Interactive review: Accept (create skill) → `SkillGenerator` → Store | Defer | Dismiss
7. Update suggestion state in `.planning/patterns/suggestions.json`

**Skill Loading and Application Flow:**

1. User runs `skill-creator invoke {name}` or system needs skills auto-applied
2. `SkillApplicator.invoke()` → Load skill via `SkillStore.read()`
3. `TokenCounter` estimates content tokens using gpt-tokenizer
4. `SkillSession.load()` checks budget and max-skills constraints
5. On success: Add to `activeSkills` Map, track tokens, return remaining budget
6. On failure: Return reason (budget_exceeded, max_skills_reached, already_active)
7. Display active skills via `SkillSession.getReport()`

**Feedback and Learning Flow:**

1. User provides correction to skill-generated content
2. `FeedbackDetector` captures correction as SkillCorrection event
3. `FeedbackStore` appends to `.planning/patterns/feedback.jsonl`
4. User runs `skill-creator refine {name}`
5. `RefinementEngine` checks eligibility: ≥3 corrections, not in cooldown (7 days), not recently refined
6. `FeedbackDetector` analyzes patterns across corrections
7. `RefinementEngine.generateSuggestion()` creates bounded change proposal (max 20%)
8. User confirms refinement
9. Apply: `VersionManager` commits current state to git, update skill version, store new version
10. Track via `SkillVersion` entries with git hash, commit message

**Agent Composition Flow:**

1. Skills are applied and tracked in `SkillSession.activeSkills`
2. `CoActivationTracker` observes which skills activate together, scores stability
3. User runs `skill-creator agents suggest`
4. `AgentSuggestionManager.analyze()` → `ClusterDetector.detectClusters()`
5. Find stable clusters (co-activation score ≥ threshold, stable for ≥ days)
6. Interactive review: Accept → `AgentGenerator` → Create `.claude/agents/{name}.md`
7. Store agent metadata in `.planning/patterns/agent-suggestions.json`

**State Management:**

- **Session state**: `SessionState` in memory during `SkillSession` lifetime
  - `activeSkills: Map<name, ActiveSkill>` - loaded skills with timestamps, tokens
  - `totalTokens: number` - sum of all active skill tokens
  - `budgetLimit: number` - max tokens allowed
  - `budgetPercent: number` - config percentage of context window

- **Suggestion state**: Persisted in `suggestions.json` with state machine
  - pending → accepted | deferred | dismissed
  - deferred → resurfaced after 7 days
  - dismissed → filtered from future listings

- **Feedback state**: Streaming append-only in `feedback.jsonl`
  - Event: SkillCorrection with timestamp, original, corrected, context

## Key Abstractions

**Skill:**
- Purpose: Represents a reusable Claude Code instruction package
- Files: `src/types/skill.ts`, `src/storage/skill-store.ts`
- Pattern: Markdown with YAML frontmatter (metadata + body)
- Structure: Name + Description + Optional triggers + Optional learning metadata
- Stored at: `.claude/skills/{name}/SKILL.md`

**SkillCandidate:**
- Purpose: Proposed skill from pattern analysis (before creation)
- Files: `src/types/detection.ts`
- Pattern: Contains extracted pattern, confidence score, evidence (first/last seen, co-occurring files)
- Used for: Interactive suggestion review with preview generation

**SkillSession:**
- Purpose: Represents active skill context during a work session
- Files: `src/application/skill-session.ts`
- Pattern: Maintains state machine of loaded skills, token tracking, budget enforcement
- Responsibilities: Load (with validation), track tokens, report state

**SuggestionStore & SuggestionManager:**
- Purpose: Manage skill suggestion lifecycle and user decisions
- Files: `src/detection/suggestion-store.ts`, `src/detection/suggestion-manager.ts`
- Pattern: Suggestion state machine + decision handling
- Responsibilities: Track pending, defer, accept, dismiss; generate previews; create skills

**PatternAnalyzer:**
- Purpose: Extract skill candidates from session observation streams
- Files: `src/detection/pattern-analyzer.ts`
- Pattern: Memory-efficient streaming parser of JSONL sessions
- Algorithm: Count command/decision frequency → filter by threshold → extract with evidence

**RelevanceScorer:**
- Purpose: Score skills against user intent/context
- Files: `src/application/relevance-scorer.ts`
- Pattern: Naive cosine similarity or keyword matching against skill descriptions
- Used for: Ranking matched skills for loading

**TokenCounter:**
- Purpose: Estimate tokens for skill content
- Files: `src/application/token-counter.ts`
- Pattern: Uses gpt-tokenizer library to count tokens, calculates budget from context window
- Responsibilities: Count tokens, calculate budget, check constraints

**ConflictResolver:**
- Purpose: Detect and resolve skill conflicts
- Files: `src/application/conflict-resolver.ts`
- Pattern: Check for overlapping trigger conditions, resolve by priority/score
- Used for: Preventing duplicate or contradictory skill activations

**RefinementEngine:**
- Purpose: Propose bounded improvements to skills
- Files: `src/learning/refinement-engine.ts`
- Pattern: Eligibility checking (cooldown, correction count) → suggestion generation → application with versioning
- Constraints: Max 20% content change, requires user confirmation, 7-day cooldown

**AgentGenerator:**
- Purpose: Create composite agent files from skill clusters
- Files: `src/agents/agent-generator.ts`
- Pattern: Generate markdown content including all constituent skill bodies
- Stored at: `.claude/agents/{name}.md`

## Entry Points

**CLI Entry:**
- Location: `src/cli.ts`
- Triggers: Direct user invocation via `skill-creator` command
- Responsibilities: Route commands, manage interactive prompts, format output
- Commands: create, list, search, invoke, status, suggest, feedback, refine, history, rollback, agents

**Index/Module Entry:**
- Location: `src/index.ts`
- Triggers: Direct module import
- Responsibilities: Factory functions (`createStores`, `createApplicationContext`), type exports
- Used by: External packages, tools that embed skill system

**Application Workflows:**
- Locations: `src/workflows/*.ts`
- Triggers: CLI commands, or programmatic calls
- Responsibilities: Multi-step orchestration with user feedback

## Error Handling

**Strategy:** Try-catch with descriptive error messages; validation before operations

**Patterns:**

- **File operations**: Wrapped in try-catch, return empty defaults on ENOENT
  - Example: `PatternAnalyzer.analyze()` returns empty candidates if sessions.jsonl missing
  - Example: `SkillStore.list()` returns [] if directory doesn't exist

- **Validation errors**: Throw with detailed path info for debugging
  - Example: `validateSkillMetadata()` returns array of error strings
  - Example: Zod schema failures show path.field: message format

- **Skill loading errors**: Return typed result objects with reason codes
  - `SkillLoadResult` includes: success, reason (budget_exceeded|already_active|max_skills_reached), remaining budget
  - Caller can decide action based on reason

- **Pattern detection**: Gracefully skip corrupted JSONL lines, continue processing
  - Example: PatternAnalyzer catches JSON.parse errors per line, logs implicitly

## Cross-Cutting Concerns

**Logging:** Console output via `@clack/prompts` (p.log.* methods) and picocolors for formatting
- Info messages: `p.log.message()`
- Success: `p.log.success()`
- Warnings: `p.log.warn()`
- Errors: `p.log.error()`

**Validation:** Zod schemas for structured input validation
- Applied at: Skill creation (SkillInputSchema), updates (SkillUpdateSchema), trigger patterns (TriggerPatternsSchema)
- Custom validators: validateSkillName, validateSkillMetadata for semantic rules

**Token Counting:** Anthropic gpt-tokenizer library
- Used in: SkillSession (check budget), SkillApplicator (score skills), TokenCounter (estimate)
- Config: Anthropic API key can be provided via ApplicationConfig

**Timestamps:** ISO 8601 format stored in metadata and learning records
- SkillMetadata: createdAt, updatedAt
- SkillCorrection: timestamp
- Evidence: firstSeen, lastSeen (unix ms)
- SkillVersion: date, commitDate

**Persistence Locations:**
- Skills: `.claude/skills/{name}/SKILL.md` (git-tracked)
- Patterns/Sessions: `.planning/patterns/sessions.jsonl` (append-only)
- Suggestions: `.planning/patterns/suggestions.json` (state machine store)
- Feedback: `.planning/patterns/feedback.jsonl` (append-only)
- Agents: `.claude/agents/{name}.md` (git-tracked)

---

*Architecture analysis: 2026-01-30*
