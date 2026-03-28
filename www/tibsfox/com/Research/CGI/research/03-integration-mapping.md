# Integration Mapping

> **Domain:** Cross-System Architecture
> **Module:** 3 -- Port Taxonomy, Adapted Patterns, GSD-Native Enhancements
> **Through-line:** *Integration is not merger. Two specialized systems connected at well-defined interfaces produce more value than one general-purpose system that does both jobs poorly.* The Amiga didn't try to make one chip do everything -- Agnus handled DMA, Denise handled display, Paula handled audio. Each excelled at its job. The whole was greater than the sum because the interfaces between chips were clean, typed, and deterministic.

---

## Table of Contents

1. [Integration Philosophy](#1-integration-philosophy)
2. [Port Taxonomy: Three Tiers](#2-port-taxonomy-three-tiers)
3. [Tier 1: Direct Ports](#3-tier-1-direct-ports)
4. [Scoring Rubric Port](#4-scoring-rubric-port)
5. [Score History JSONL Port](#5-score-history-jsonl-port)
6. [Score Regression Guard Port](#6-score-regression-guard-port)
7. [Structured Fix Data Port](#7-structured-fix-data-port)
8. [CALIBER_LEARNINGS Taxonomy Port](#8-caliber-learnings-taxonomy-port)
9. [Compare Flag Port](#9-compare-flag-port)
10. [Tier 2: Adapted Patterns](#10-tier-2-adapted-patterns)
11. [Drift Detection Adaptation](#11-drift-detection-adaptation)
12. [Two-Tier Model Adaptation](#12-two-tier-model-adaptation)
13. [Multi-Platform Agent Flag](#13-multi-platform-agent-flag)
14. [Backup and Undo System](#14-backup-and-undo-system)
15. [Rate Limiting Adaptation](#15-rate-limiting-adaptation)
16. [Tier 3: GSD-Native Enhancements](#16-tier-3-gsd-native-enhancements)
17. [Caliber TODOS Roadmap Analysis](#17-caliber-todos-roadmap-analysis)
18. [Implementation Priority Matrix](#18-implementation-priority-matrix)
19. [Cross-References](#19-cross-references)
20. [Sources](#20-sources)

---

## 1. Integration Philosophy

The integration between Caliber and gsd-skill-creator follows three principles derived from decades of systems integration experience and validated in the GSD ecosystem's own development [1]:

**Bridge, don't merge.** The two CLIs have different deployment models, different user bases, and different philosophical approaches to the same problem space. Merging them would force compromises that weaken both. Bridging them lets each specialize while sharing validated patterns [2].

**Port the logic, not the code.** Caliber's scoring engine works because of its *design* -- deterministic, LLM-free, filesystem-grounded -- not because of its specific TypeScript implementation. Porting the design into gsd-skill-creator's architecture produces a native-feeling implementation that respects existing conventions rather than a foreign transplant [3].

**The Amiga Principle.** Jay Miner's team at Commodore-Amiga designed specialized silicon because no general-purpose chip could handle video, audio, and DMA simultaneously at the required performance level. The specialization was not a limitation -- it was the architectural decision that made the system work. Caliber specializes in measurement. gsd-skill-creator specializes in learning. Integration connects the outputs, not the internals [4].

```
INTEGRATION vs MERGER -- ARCHITECTURAL DECISION
================================================================

  MERGER (rejected):
    caliber + gsd-skill-creator = one tool
    + Single install, single config
    - Scoring code coupled to learning code
    - Model dependency conflicts (LLM-free scoring vs LLM generation)
    - Two deployment stories forced into one
    - Breaking changes in one system propagate to both

  BRIDGE (chosen):
    caliber ←→ gsd-skill-creator via typed interfaces
    + Each tool evolves independently
    + Clean separation of concerns
    + Caliber can update scoring rubric without affecting learning
    + gsd-skill-creator can add new lifecycle phases without affecting scoring
    - Requires maintaining interface contracts
    - Two installs (mitigated by skill-creator bundling the scoring logic)

  The interface cost is lower than the coupling cost. Always.
```

> **Related:** [Caliber Architecture](01-caliber-architecture-analysis.md) for the scoring system being ported, [GSD Architecture](02-gsd-skill-creator-architecture.md) for the receiving system

---

## 2. Port Taxonomy: Three Tiers

The integration mapping organizes all identified opportunities into three confidence tiers based on architectural compatibility, implementation complexity, and risk [5]:

| Tier | Count | Confidence | Approach |
|------|-------|-----------|----------|
| Tier 1: Direct Ports | 6 | Highest | Core logic extracted and re-skinned |
| Tier 2: Adapted Patterns | 5 | Medium | Architectural adaptation required |
| Tier 3: GSD-Native | 3 | New ground | Informed by comparison, no Caliber equivalent |

The tier assignment is based on a simple test: can the Caliber feature's core logic be extracted as a pure function and called from gsd-skill-creator's existing module structure? If yes, it's Tier 1. If the logic needs structural adaptation to fit gsd-skill-creator's architecture, it's Tier 2. If no Caliber equivalent exists but the comparative analysis revealed a gap, it's Tier 3 [5].

---

## 3. Tier 1: Direct Ports

These six features can be ported with minimal adaptation. The core logic is extracted from Caliber and implemented in the gsd-skill-creator domain:

| Caliber Feature | gsd-skill-creator Port | Implementation File |
|----------------|----------------------|---------------------|
| 100-point scoring rubric | `skill-creator score` | `src/scoring/score-engine.ts` |
| Score history JSONL | `skill-metrics.jsonl` | `src/storage/pattern-store.ts` |
| Score regression guard | Refinement engine gate | `src/learning/refinement-engine.ts` |
| Structured fix data | Skill generation prompt | `src/detection/skill-generator.ts` |
| CALIBER_LEARNINGS taxonomy | `FeedbackCategory` enum | `src/learning/feedback-store.ts` |
| `--compare <ref>` flag | `skill-creator score --compare` | `src/commands/score.ts` |

Each port is detailed in the following sections with specific implementation specifications, test requirements, and risk considerations [5].

---

## 4. Scoring Rubric Port

**Source:** Caliber's `src/scoring/` module (LLM-free, 100-point, 5-category rubric)

**Target:** `src/scoring/score-engine.ts` (new file)

The rubric categories map from Caliber's CLAUDE.md-focused checks to gsd-skill-creator's SKILL.md-focused checks:

| Category | Caliber Checks | gsd-skill-creator Checks |
|----------|---------------|------------------------|
| Existence (25) | CLAUDE.md, MCP configs | SKILL.md, frontmatter, triggers |
| Quality (25) | Code blocks, headings, conciseness | Description effectiveness, trigger precision |
| Grounding (20) | Directory references on disk | Trigger file patterns match via git ls-files |
| Accuracy (15) | Referenced paths exist, fresh | Trigger targets current, not renamed/deleted |
| Freshness (10) | Updated recently, no secrets | Updated recently, no secrets in skill content |
| Bonus (5) | AGENTS.md, auto-refresh | Extends chain valid, chipset YAML present |

The key adaptation is the Grounding check. Caliber grounds against directory references in prose. gsd-skill-creator grounds against file pattern triggers in YAML frontmatter. The file pattern check is more precise -- it uses glob matching against `git ls-files` rather than substring matching against directory names [6].

```
SCORING RUBRIC PORT -- CATEGORY MAPPING
================================================================

  CALIBER                           GSD-SKILL-CREATOR
  =======                           =================

  Existence:                        Existence:
    CLAUDE.md present (10)            SKILL.md present (10)
    Skills directory (5)              Frontmatter complete (5)
    MCP configs (5)                   Triggers defined (5)
    Platforms (5)                     Description present (5)

  Quality:                          Quality:
    Code blocks (5)                   Description has "Use when" (5)
    Token budget < 2K (5)             Content < 500 lines (5)
    Structured headings (5)           Has examples (5)
    Action verbs (5)                  Trigger specificity (5)
    Description context (5)           Grounding references (5)

  Grounding:                        Grounding:
    Dir refs on disk (8)              File patterns match files (8)
    File pattern match (7)            Import paths resolve (7)
    Import paths (5)                  Extends target exists (5)

  Accuracy:                         Accuracy:
    Path freshness (8)                Trigger target freshness (8)
    No stale refs (4)                 No stale trigger paths (4)
    Git alignment (3)                 Git history alignment (3)

  Freshness:                        Freshness:
    Recently updated (4)              Recently updated (4)
    No secrets (4)                    No secrets in skill (4)
    Permissions (2)                   Version field present (2)
```

> **Related:** [Caliber Architecture](01-caliber-architecture-analysis.md) Sections 4-8 for detailed category specifications

---

## 5. Score History JSONL Port

**Source:** `.caliber/score-history.jsonl`

**Target:** `.planning/skill-metrics.jsonl`

The gsd-skill-creator port extends Caliber's score-only history with three additional dimensions:

| Field | Caliber | gsd-skill-creator |
|-------|---------|-------------------|
| timestamp | Yes | Yes |
| total_score | Yes | Yes |
| categories | Yes | Yes |
| trigger | Yes | Yes (init/refresh/score/manual) |
| git_ref | Yes | Yes |
| activation_rate | No | **Yes** -- sessions skill activated / total sessions |
| correction_rate | No | **Yes** -- corrections / activations |
| token_roi | No | **Yes** -- tokens saved / tokens consumed |

The three new dimensions capture operational quality that scoring alone cannot measure. A skill might score 95/100 (perfect structure, grounded, fresh) but have a 2% activation rate (never triggers) or a 40% correction rate (triggers but gives wrong advice). The metrics JSONL captures both structural quality (score) and operational quality (activation, correction, ROI) [7].

```
SKILL METRICS JSONL -- ENTRY FORMAT
================================================================

  {
    "timestamp": "2026-03-27T14:30:00Z",
    "skill": "typescript-patterns",
    "score": {
      "total": 82,
      "grade": "B",
      "existence": 25,
      "quality": 20,
      "grounding": 18,
      "accuracy": 12,
      "freshness": 7
    },
    "operational": {
      "activation_rate": 0.73,
      "correction_rate": 0.08,
      "token_roi": 3.2
    },
    "trigger": "session_end",
    "git_ref": "abc1234"
  }
```

Retention follows the same constraints as all JSONL stores: 90-day maximum age, 1000-entry maximum count. The PatternStore retention manager handles both existing feedback.jsonl and the new skill-metrics.jsonl [7].

---

## 6. Score Regression Guard Port

**Source:** Caliber's `refresh.ts` pre/post score comparison

**Target:** `src/learning/refinement-engine.ts` (modification)

The guard integrates into the existing bounded refinement pipeline as a fourth gate, checked after the three structural constraints:

```
REFINEMENT PIPELINE -- WITH SCORE GATE
================================================================

  Correction recorded (n >= 3)
       |
       v
  GATE 1: corrections >= 3?
       | YES
       v
  GATE 2: change_percent <= 20%?
       | YES
       v
  GATE 3: cooldown_elapsed (7 days)?
       | YES
       v
  NEW → GATE 4: score regression check
       |  ┌─────────────────────────────────────────────┐
       |  │ pre_score = score(existing_skill)            │
       |  │ proposed = generate_refinement(corrections)  │
       |  │ post_score = score(proposed)                 │
       |  │                                              │
       |  │ if post_score < pre_score:                   │
       |  │   REJECT refinement                          │
       |  │   LOG: "Score regression: {pre} -> {post}"   │
       |  │   RETURN (no user prompt)                    │
       |  │                                              │
       |  │ if post_score >= pre_score:                  │
       |  │   CONTINUE to user prompt                    │
       |  │   SHOW: "Score: {pre} -> {post} (+{delta})" │
       |  └─────────────────────────────────────────────┘
       | PASS
       v
  Present to user with pre/post score delta
       | USER CONFIRMS
       v
  Apply refinement
  Write skill-backups/ snapshot
  Record in skill-metrics.jsonl
```

The key design decision: score regression causes automatic rejection without user prompt. This is deliberate -- if the refinement makes the skill worse by objective measurement, there's no reason to ask the user to evaluate it. The user sees only refinements that pass all four gates [8].

---

## 7. Structured Fix Data Port

**Source:** Caliber's `src/scoring/fix-data.ts`

**Target:** `src/detection/skill-generator.ts` (modification)

When the scoring engine identifies failing checks during skill generation, the structured fix data is injected into the generation prompt:

```
STRUCTURED FIX DATA -- GENERATION INJECTION
================================================================

  WITHOUT fix data (current):
    "Generate a skill for TypeScript pattern management"
    → LLM generates skill with plausible but unverified paths

  WITH fix data (post-integration):
    "Generate a skill for TypeScript pattern management.
     GROUNDING CHECK RESULTS:
     - src/components/ does NOT exist
     - src/features/ contains 23 .tsx files
     - src/shared/components/ contains 8 .tsx files
     FIX: Use 'src/features/**/*.tsx' or 'src/shared/components/**/*.tsx'
          as trigger patterns instead of 'src/components/**/*.tsx'"
    → LLM generates skill with verified paths
```

This transforms the generator from a best-guess system to a grounded system. The fix data constrains the LLM's output to paths that actually exist, eliminating the most common failure mode in skill generation [9].

---

## 8. CALIBER_LEARNINGS Taxonomy Port

**Source:** CALIBER_LEARNINGS.md six-category taxonomy

**Target:** `src/types/learning.ts` + `src/learning/feedback-store.ts`

```
FEEDBACKCATEGORY ENUM -- PORT SPECIFICATION
================================================================

  // src/types/learning.ts (new file)
  export enum FeedbackCategory {
    CORRECTION = 'correction',  // Wrong advice, user override
    GOTCHA     = 'gotcha',      // Environment quirk, non-obvious
    FIX        = 'fix',         // Specific code fix for recurring bug
    PATTERN    = 'pattern',     // Recurring successful solution
    ENV        = 'env',         // Environment setup, configuration
    CONVENTION = 'convention'   // Team/project style standard
  }

  // Updated FeedbackEntry in feedback-store.ts
  interface FeedbackEntry {
    skillName:  string;
    content:    string;
    timestamp:  string;
    category:   FeedbackCategory;  // <-- NEW field
  }
```

The category field is additive -- existing FeedbackEntry records without a category field remain valid (category defaults to `CORRECTION` for backward compatibility). This ensures the 202 existing tests continue to pass without modification [10].

The category drives downstream behavior:

| Category | Refinement Impact |
|----------|------------------|
| `correction` | Counts toward 3-correction minimum, triggers refinement |
| `gotcha` | Stored but excluded from correction count (env-specific) |
| `fix` | Counts toward corrections, tagged for error-matching |
| `pattern` | Stored for pattern detection, not correction count |
| `env` | Excluded from correction count (environment-specific) |
| `convention` | Injected into generation prompts as style constraints |

---

## 9. Compare Flag Port

**Source:** `caliber score --compare <ref>`

**Target:** `skill-creator score --compare <ref>`

The compare flag creates a temporary worktree at the specified git ref, scores the skills in that worktree, and displays per-skill score deltas:

```
SCORE COMPARE -- OUTPUT FORMAT
================================================================

  $ skill-creator score --compare HEAD~3

  Skill                   HEAD~3    HEAD      Delta
  ─────────────────────────────────────────────────
  typescript-patterns     68 (C)    82 (B)    +14 ↑
  react-components        75 (B)    73 (B)     -2 ↓
  jest-testing            90 (A)    90 (A)      0 →
  git-workflow            45 (C)    78 (B)    +33 ↑
  ─────────────────────────────────────────────────
  Average                 69.5      80.75    +11.25

  Skills improved: 2  |  Degraded: 1  |  Stable: 1
```

The temporary worktree is cleaned up after scoring. This is a direct port of Caliber's implementation with the category weights adapted for skill-specific checks [11].

---

## 10. Tier 2: Adapted Patterns

These five features require architectural adaptation to fit gsd-skill-creator's context:

| Caliber Feature | Adaptation | Key Difference |
|----------------|-----------|----------------|
| `caliber refresh` | `skill-creator refresh` | Focus on trigger staleness, not config regeneration |
| Two-tier model | Relevance scorer demotion | Haiku for scoring; Sonnet for generation |
| `--agent` flag | `skill-creator create --agent` | Strip extension fields for non-GSD targets |
| Backup/undo | `skill-backups/` pre-refinement | Less complex (no branching configs) |
| 30s rate limit | Session hook cooldown | Adapt for hook model |

---

## 11. Drift Detection Adaptation

Caliber's `refresh` regenerates configuration files when drift is detected. gsd-skill-creator's `refresh` takes a lighter approach: it *reports* stale skills and *suggests* updates but does not automatically regenerate. This matches gsd-skill-creator's philosophy of human-supervised changes [12].

The three-layer git diff analysis is ported directly. The response to detected drift is adapted:

| Caliber Response | gsd-skill-creator Response |
|-----------------|--------------------------|
| Regenerate config file | Report stale skills |
| Auto-update references | Suggest trigger updates |
| Score regression guard | Score regression guard (same) |

---

## 12. Two-Tier Model Adaptation

Caliber's automatic model tier selection maps onto gsd-skill-creator's chipset YAML:

| Caliber Tier | Chipset Equivalent | Operations |
|-------------|-------------------|-----------|
| Fast (classification) | Paula (Haiku) | Relevance scoring, pattern matching |
| Heavy (generation) | Denise (Sonnet) | Skill generation, refinement |
| - | Agnus (Opus) | Architecture decisions (GSD-specific) |

The adaptation adds a third tier (Opus) that Caliber doesn't have, reflecting gsd-skill-creator's more complex orchestration requirements [13].

---

## 13. Multi-Platform Agent Flag

`skill-creator create --agent cursor,codex` generates skills with extension fields stripped for non-GSD targets:

| Field | Claude (kept) | Cursor (stripped) | Codex (stripped) |
|-------|:---:|:---:|:---:|
| `name` | Yes | Yes | Yes |
| `description` | Yes | Yes | Yes |
| `triggers` | Yes | No | No |
| `extends` | Yes | No | No |
| `version` | Yes | No | No |
| `enabled` | Yes | No | No |

Platform-specific output directories follow Caliber's convention: `.cursor/skills/` for Cursor, `.agents/skills/` for Codex [14].

---

## 14. Backup and Undo System

Pre-refinement snapshots are written to `skill-backups/` before any refinement is applied:

```
BACKUP SYSTEM -- DIRECTORY STRUCTURE
================================================================

  .claude/
    skill-backups/
      typescript-patterns/
        2026-03-27T14-30-00Z.md    ← pre-refinement snapshot
        2026-03-20T09-15-00Z.md    ← previous snapshot
      react-components/
        2026-03-25T11-00-00Z.md    ← pre-refinement snapshot
```

The backup enables manual undo if a refinement that passed all four gates (including score regression) still proves problematic in practice. Backups follow the same 90-day retention as other JSONL stores [15].

---

## 15. Rate Limiting Adaptation

Caliber's 30-second cooldown between refresh operations is adapted for gsd-skill-creator's hook model. In gsd-skill-creator, hooks fire on specific events (pre-commit, session start, session end) rather than on a polling interval. The adaptation adds event deduplication rather than time-based cooldown [16]:

| Caliber Pattern | gsd-skill-creator Adaptation |
|----------------|----------------------------|
| 30s wall-clock cooldown | Event deduplication (same event type within 30s ignored) |
| Polling-triggered | Hook-triggered |
| Runs in CI loops | Runs on specific git events |

---

## 16. Tier 3: GSD-Native Enhancements

Three features have no Caliber equivalent but are informed by the comparative analysis:

**DACP score payload.** Skill quality scores embedded in DACP bundles as `skillScorePayload`. This gives every downstream agent quality awareness without re-scoring -- zero-cost quality propagation through the agent communication graph [17].

**Activation precision scoring.** Run skill triggers against the last 10 sessions and measure true/false positive rates. A skill that triggers in 8/10 sessions where it was useful and 0/10 sessions where it wasn't has 100% precision and 80% recall. This metric informs refinement priorities -- skills with low precision need better triggers; skills with low recall need broader triggers [17].

**Lock file cleanup in retention manager.** Prevent silent finalize failures by checking lock file PID validity before acquiring. This directly addresses Caliber's known gotcha about stale lock files from crashed sessions [17].

---

## 17. Caliber TODOS Roadmap Analysis

Caliber's TODOS.md reveals three roadmap items that inform gsd-skill-creator's strategy:

**Org-level context directory (`~/.caliber/org/`).** Caliber is planning a team-wide standards directory. gsd-skill-creator should ship `~/.gsd/skills/` (cross-project skill registry) before Caliber ships org-level context, establishing a compatible pattern. This feeds directly into the Wasteland/DoltHub federation vision [18].

**Bidirectional source awareness.** Caliber wants cross-repo constraint propagation. This is architecturally similar to gsd-skill-creator's `extends:` inheritance. The skill inheritance cycle detection (Kahn's algorithm) is a direct solution to the circular dependency problem Caliber is trying to solve [18].

**Remote URL source type.** Caliber wants to fetch standards from Notion/Confluence. gsd-skill-creator's `skill-creator install` (planned) should support URL-based skill sources from the start, avoiding the retrofit problem Caliber is now facing [18].

---

## 18. Implementation Priority Matrix

| Feature | Impact | Risk | Priority |
|---------|--------|------|----------|
| Score-engine.ts (LLM-free) | Very High | Low | Wave 0 |
| FeedbackCategory enum | High | Low | Wave 0 |
| Score regression guard | Very High | Medium | Wave 1B |
| skill-creator score command | High | Low | Wave 1A |
| skill-creator refresh | High | Medium | Wave 2 |
| DACP score payload | High | Medium | Wave 2 |
| --agent multi-platform | Medium | Low | Wave 3 |
| skill-creator insights | Medium | Low | Wave 2 |
| Lock file cleanup | Medium | Low | Wave 0 |
| Activation precision | Medium | Medium | Future |

---

## 19. Cross-References

> **Related:** [Caliber Architecture](01-caliber-architecture-analysis.md) -- source system for Tier 1 and Tier 2 ports
> **Related:** [GSD Architecture](02-gsd-skill-creator-architecture.md) -- receiving system architecture
> **Related:** [Calibration Loops](04-calibration-loops-quality-metrics.md) -- how ports integrate into the quality lifecycle
> **Related:** [Risk & Bridge](05-risk-compatibility-bridge.md) -- risk analysis for each port

Cross-project references:

| Project | Connection |
|---------|-----------|
| GSD2 | Orchestration layer consumes ported scoring and DACP payloads |
| ACE | Compute Engine runtime for score-engine.ts |
| PMG | Lightweight deployment context validates scoring performance |
| GSA | Alignment framework governs port priority decisions |
| CMH | Mesh networking extends DACP payload propagation |
| MCF | Multi-cluster federation uses cross-project skill registry |
| K8S | Container model for isolated platform-specific skill output |
| MGU | Module governance consumes score-based promotion gates |

---

## 20. Sources

1. Parnas, D.L. "On the Criteria To Be Used in Decomposing Systems into Modules." *Communications of the ACM*, vol. 15, no. 12, 1972.
2. Conway, M. "How Do Committees Invent?" *Datamation*, vol. 14, no. 4, 1968.
3. Fowler, M. *Refactoring: Improving the Design of Existing Code.* Addison-Wesley, 2018. Ch. 2.
4. Commodore-Amiga. *Amiga Hardware Reference Manual.* 3rd Edition. Addison-Wesley, 1991.
5. caliber-ai-org. "ai-setup: Source Analysis." GitHub, v1.29.4, 2026.
6. caliber-ai-org. "src/scoring/: Category Implementations." GitHub, 2026.
7. Tibsfox. "src/storage/pattern-store.ts: JSONL Schema." gsd-skill-creator, 2026.
8. caliber-ai-org. "src/commands/refresh.ts: Score Regression Guard." GitHub, 2026.
9. caliber-ai-org. "src/scoring/fix-data.ts: Structured Fix Generation." GitHub, 2026.
10. caliber-ai-org. "CALIBER_LEARNINGS.md: Taxonomy Categories." GitHub, 2026.
11. caliber-ai-org. "src/commands/score.ts: Compare Flag." GitHub, 2026.
12. caliber-ai-org. "src/commands/refresh.ts: Three-Layer Diff." GitHub, 2026.
13. Tibsfox. "gsd-chipset-architecture-vision.md: Model Tiers." 2026.
14. caliber-ai-org. "TODOS.md: Multi-Platform Output." GitHub, 2026.
15. Tibsfox. "src/learning/version-manager.ts: Backup System." gsd-skill-creator, 2026.
16. caliber-ai-org. "src/commands/refresh.ts: Rate Limiting." GitHub, 2026.
17. Tibsfox. "Caliber x GSD Integration Vision." Internal document, 2026.
18. caliber-ai-org. "TODOS.md: Roadmap Items." GitHub, 2026.
