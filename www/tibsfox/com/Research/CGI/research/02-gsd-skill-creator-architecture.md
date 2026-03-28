# GSD Skill-Creator Architecture

> **Domain:** Adaptive Skill Lifecycle Management
> **Module:** 2 -- DACP Protocol, Bounded Learning, Agent Composition
> **Through-line:** *The inside-out approach: observe what a developer actually does, not what a scorer thinks they should do.* Where Caliber measures configuration quality from the outside -- filesystem cross-references, structural checks, path validation -- gsd-skill-creator watches the developer work and crystallizes recurring patterns into reusable skills. The observer is inside the process. The patterns emerge from practice, not prescription.

---

## Table of Contents

1. [The Inside-Out Problem](#1-the-inside-out-problem)
2. [DACP Protocol Architecture](#2-dacp-protocol-architecture)
3. [Three-Part Bundle Structure](#3-three-part-bundle-structure)
4. [Skill Lifecycle Overview](#4-skill-lifecycle-overview)
5. [Detection: Pattern Recognition](#5-detection-pattern-recognition)
6. [Generation: Skill Synthesis](#6-generation-skill-synthesis)
7. [Application: Relevance Scoring](#7-application-relevance-scoring)
8. [Observation: Session Monitoring](#8-observation-session-monitoring)
9. [Learning: Bounded Refinement](#9-learning-bounded-refinement)
10. [The 20% Content Change Cap](#10-the-20-content-change-cap)
11. [The 7-Day Cooldown](#11-the-7-day-cooldown)
12. [The 3-Correction Minimum](#12-the-3-correction-minimum)
13. [Module Map and Integration Touch Points](#13-module-map-and-integration-touch-points)
14. [Co-Activation Tracking](#14-co-activation-tracking)
15. [Agent Emergence from Skill Clusters](#15-agent-emergence-from-skill-clusters)
16. [Kahn's Algorithm: Cycle Detection](#16-kahns-algorithm-cycle-detection)
17. [The Planning Layer](#17-the-planning-layer)
18. [Chipset YAML Model Assignment](#18-chipset-yaml-model-assignment)
19. [Cross-References](#19-cross-references)
20. [Sources](#20-sources)

---

## 1. The Inside-Out Problem

Most AI configuration tools work outside-in: examine a codebase, infer what skills would be useful, generate them. This approach produces reasonable initial configurations but struggles with two problems that only manifest over time [1].

**Pattern blindness.** An outside-in scanner sees file types, directory structures, and dependency manifests. It cannot see that the developer always runs `npm run lint -- --fix` before committing TypeScript changes, or that they always check `git log --oneline -5` after a rebase. These are behavioral patterns -- workflow habits that would make excellent skills but leave no structural trace in the codebase [2].

**Drift accumulation.** An outside-in configuration is a snapshot. The moment it's generated, it begins drifting from reality. New files appear, old files are renamed, the developer's workflow evolves. Without continuous observation, the configuration becomes a historical artifact rather than a living tool [3].

gsd-skill-creator solves both problems by operating inside-out: it observes the developer's actual behavior during sessions, identifies recurring patterns, and proposes skills based on what the developer demonstrably does rather than what the codebase suggests they might do [4].

```
OUTSIDE-IN vs INSIDE-OUT
================================================================

  OUTSIDE-IN (Caliber)               INSIDE-OUT (gsd-skill-creator)
  ====================               ============================

  Input:  Codebase structure          Input:  Developer behavior
  Method: Static analysis             Method: Session observation
  Output: Configuration snapshot      Output: Evolving skill set
  Strength: Immediate, complete       Strength: Accurate, adaptive
  Weakness: Drift-prone               Weakness: Cold start
  Update:  Manual refresh             Update:  Continuous learning

  INTEGRATION INSIGHT: Outside-in for the initial scaffold.
  Inside-out for ongoing evolution. Score the scaffold. Refine
  through observation. Re-score to verify improvement.
```

The cold start problem is real: gsd-skill-creator needs sessions of observed behavior before it can propose skills. This is exactly where Caliber integration helps -- use Caliber's outside-in scoring to establish a quality baseline, then let gsd-skill-creator's inside-out observation refine it upward [4].

> **Related:** [Caliber Architecture](01-caliber-architecture-analysis.md) for the complementary outside-in approach, [Integration Mapping](03-integration-mapping.md) for the convergence plan

---

## 2. DACP Protocol Architecture

The Deterministic Agent Communication Protocol is gsd-skill-creator's most architecturally significant subsystem. DACP defines how agents communicate structured intent -- not by passing natural language messages (which are non-deterministic) but by passing typed bundles that carry intent, data, and executable actions [5].

The philosophical foundation: **Markdown is non-deterministic; code is deterministic.** An instruction written in natural language ("update the skill to handle TypeScript files") can be interpreted multiple ways. An instruction written as executable code (`skill.triggers.filePatterns.push('*.ts')`) has exactly one meaning [5].

DACP bundles are the primary vehicle for inter-agent communication in the GSD ecosystem. Every skill suggestion, refinement proposal, quality report, and orchestration command travels as a DACP bundle. The protocol ensures that downstream agents receive unambiguous instructions regardless of which model generated the upstream output [6].

---

## 3. Three-Part Bundle Structure

Every DACP bundle has exactly three parts:

| Part | Type | Purpose |
|------|------|---------|
| Intent | Human-readable string | What this bundle wants to accomplish |
| Data | Structured JSON | Machine-readable payload |
| Action | Executable code | Deterministic operation to perform |

```
DACP BUNDLE -- EXAMPLE: SKILL REFINEMENT PROPOSAL
================================================================

  {
    intent: "Refine typescript-patterns skill based on 4 corrections",

    data: {
      skillName: "typescript-patterns",
      correctionCount: 4,
      proposedChanges: {
        description: "updated trigger context",
        diffLines: 12,
        changePercent: 8.3
      },
      // INTEGRATION: skillScorePayload added here
      skillScorePayload: {
        preScore: 73,
        categories: {
          existence: 25, quality: 20, grounding: 15,
          accuracy: 10, freshness: 3
        },
        failedChecks: ["grounding.file_pattern_match"]
      }
    },

    action: "refinement-engine.applyRefinement('typescript-patterns', patch)"
  }
```

The `skillScorePayload` field is the integration point. By carrying quality score data inside DACP bundles, every downstream agent in the pipeline can see the skill's current quality metrics without re-running the scorer. This is zero-cost quality awareness: the score was computed once (by the deterministic engine) and propagated as structured data [5].

> **Related:** [Risk & Bridge](05-risk-compatibility-bridge.md) for DACP payload integrity concerns (SC-04)

---

## 4. Skill Lifecycle Overview

A skill in gsd-skill-creator passes through five phases:

```
SKILL LIFECYCLE -- FIVE PHASES
================================================================

  1. DETECTION                    2. GENERATION
  ┌─────────────────┐             ┌─────────────────┐
  │ Pattern observed │ ────────>  │ SKILL.md created │
  │ 3+ occurrences  │             │ with frontmatter │
  │ in session logs  │             │ triggers, desc.  │
  └─────────────────┘             └────────┬────────┘
                                           │
  5. RETIREMENT                   3. APPLICATION
  ┌─────────────────┐             ┌─────────────────┐
  │ Token ROI < 0   │  <────────  │ Relevance scored │
  │ or replaced by  │             │ Context injected │
  │ better skill    │             │ when triggers    │
  └─────────────────┘             │ match session    │
        ^                         └────────┬────────┘
        |                                  │
        |                         4. LEARNING
        |                         ┌─────────────────┐
        +─────────────────────────│ Feedback captured│
                                  │ Corrections      │
                                  │ counted, bounded │
                                  │ refinement       │
                                  └─────────────────┘
```

Each phase has distinct computational requirements, which is why the chipset model assignment matters: detection and application use lightweight models (Haiku tier), while generation and learning use heavier models (Sonnet/Opus tier) [7].

---

## 5. Detection: Pattern Recognition

The pattern analyzer (`src/detection/pattern-analyzer.ts`) watches session logs for recurring behavioral patterns. A pattern becomes a skill candidate when it meets three criteria [8]:

1. **Frequency.** The pattern appears in at least 3 sessions within a 30-day window
2. **Consistency.** The pattern's execution steps are similar across occurrences (>70% structural overlap)
3. **Utility.** The pattern involves at least 2 distinct tool calls or file operations

Detection is deliberately conservative. A false positive in detection -- proposing a skill for a one-off workflow -- wastes the developer's time reviewing and declining the proposal. A false negative -- missing a genuine pattern -- means the developer continues doing the work manually, which is the status quo and not actively harmful [8].

```
PATTERN DETECTION -- THRESHOLD TUNING
================================================================

  High threshold (strict):
    + Fewer false positives (developer rarely declines)
    - More missed patterns (slower skill acquisition)

  Low threshold (permissive):
    + Faster skill acquisition
    - More false positives (developer annoyed by bad suggestions)

  gsd-skill-creator default: 3 occurrences, 70% overlap, 2+ tools
  This was tuned empirically across 50+ sessions. Lower thresholds
  produced >30% decline rates. Higher thresholds missed ~40% of
  patterns that developers manually confirmed as useful.
```

---

## 6. Generation: Skill Synthesis

Once a pattern is promoted to a skill candidate, the skill generator (`src/detection/skill-generator.ts`) produces a SKILL.md file. The generator receives three inputs [9]:

1. The raw pattern data (session log excerpts)
2. The project's structural context (file tree, dependency manifest)
3. **Integration point:** Grounding check results from the scoring engine

The grounding check is where Caliber integration adds immediate value. Before the generator writes a trigger pattern like `*.tsx in src/components/`, the scoring engine verifies that `src/components/` actually exists and contains `.tsx` files. This prevents the most common generation failure mode: plausible but incorrect path references [9].

---

## 7. Application: Relevance Scoring

When a developer starts a session, the relevance scorer (`src/application/relevance-scorer.ts`) evaluates which skills should be activated. This is a classification problem: given the current session context (open files, recent commands, project state), which skills are likely to be useful? [10]

The relevance scorer currently uses the configured model tier for classification. The integration proposal demotes this to Haiku tier, matching Caliber's two-tier model strategy. Relevance scoring is a fast pattern match, not a deep reasoning task -- it should use the cheapest model that produces acceptable accuracy [10].

| Current | Proposed | Rationale |
|---------|----------|-----------|
| Sonnet-tier | Haiku-tier | Classification task, not generation |
| ~500ms latency | ~100ms latency | 5x faster session startup |
| ~200 tokens/call | ~50 tokens/call | 4x cheaper per activation |

---

## 8. Observation: Session Monitoring

The session observer (`src/observation/session-observer.ts`) runs continuously during a development session. It captures:

- Tool calls and their arguments
- File operations (read, write, create, delete)
- Command executions and their exit codes
- User corrections (when the developer overrides or redoes an agent's work)
- Timing data (how long each operation takes)

This observation data feeds both the pattern detector (for new skill discovery) and the feedback store (for existing skill refinement). The observer is passive -- it never modifies the session or interrupts the developer [11].

**Retention management.** The retention manager (`src/observation/retention-manager.ts`) enforces bounds on observation data: 90-day maximum age, 1000-session maximum count. Data beyond these bounds is archived, not deleted -- the archive serves as a historical record but is not actively queried for pattern detection [11].

> **WARNING:** The retention manager currently has no lock file cleanup for stale locks from crashed sessions. This is a known issue from Caliber's experience with the same pattern (CALIBER_LEARNINGS: "caliber learn finalize may fail silently with a stale lock file"). The integration adds lock-manager.ts to address this.

---

## 9. Learning: Bounded Refinement

The refinement engine (`src/learning/refinement-engine.ts`) is the most safety-critical component. It modifies existing skills based on accumulated feedback -- and modification of working skills carries inherent risk. A bad refinement can break a skill that was previously useful [12].

gsd-skill-creator addresses this with three structural constraints that cannot be overridden by configuration or model behavior. They are enforced in code, not policy:

---

## 10. The 20% Content Change Cap

No single refinement operation can modify more than 20% of a skill's content by diff line count. This prevents runaway LLM changes where a model "helpfully" rewrites the entire skill based on a single correction [12].

```
20% CAP -- ENFORCEMENT
================================================================

  skill_lines = countLines(existing_skill)
  proposed_diff = generateDiff(existing, proposed)
  changed_lines = proposed_diff.additions + proposed_diff.deletions

  change_percent = (changed_lines / skill_lines) * 100

  if change_percent > 20:
    REJECT refinement
    LOG: "Proposed refinement changes {change_percent}% of skill
          (cap: 20%). Reduce scope or split into multiple iterations."
```

The 20% cap also serves as an implicit architectural constraint: it forces refinements to be incremental. A skill that needs more than 20% change probably needs to be regenerated from scratch rather than refined, which routes through the generation pipeline with its full validation suite [12].

---

## 11. The 7-Day Cooldown

After a refinement is applied to a skill, that skill enters a 7-day cooldown period during which no further refinements can be applied. This prevents feedback oscillation -- the pattern where correction A triggers refinement X, which causes correction B, which triggers refinement Y, which causes correction A again [12].

The cooldown period also provides time for the developer to evaluate the refinement in real-world usage. A skill refined on Monday may look correct in isolation but interact poorly with other skills or the developer's workflow. Seven days of natural usage reveals these interactions [13].

---

## 12. The 3-Correction Minimum

A refinement is not proposed until at least 3 corrections have been recorded against a skill. A single correction might be a one-off edge case. Two corrections might be coincidence. Three corrections signal a genuine skill deficiency [12].

```
BOUNDED REFINEMENT -- THREE CONSTRAINTS
================================================================

  GATE 1: corrections >= 3
    "Not yet -- only 2 corrections recorded. Need 1 more."

  GATE 2: change_percent <= 20
    "Too large -- proposed change is 34%. Split or regenerate."

  GATE 3: cooldown_elapsed (7 days since last refinement)
    "Too soon -- last refined 3 days ago. Wait 4 more days."

  All three gates must pass simultaneously.
  Then: present to user for confirmation.
  Then: apply refinement.

  POST-INTEGRATION ADDITION:
  GATE 4: post_score >= pre_score
    "Score regression -- refinement reverted automatically."
```

The integration adds a fourth gate: score regression. Even if a refinement passes all three structural constraints, it must also produce equal or better quality as measured by the deterministic scorer. This closes the gap between "structurally safe" (within bounds) and "actually better" (improved quality) [14].

> **Related:** [Caliber Architecture](01-caliber-architecture-analysis.md) Section 9 for score regression guard details

---

## 13. Module Map and Integration Touch Points

gsd-skill-creator's `src/` directory is organized into six domain groups:

| Directory | Key Files | Integration Touch Points |
|-----------|-----------|--------------------------|
| `src/storage/` | skill-store.ts, pattern-store.ts, skill-index.ts | Add score cache to SkillIndex; add metrics to PatternStore |
| `src/learning/` | feedback-store.ts, refinement-engine.ts, version-manager.ts | Add FeedbackCategory enum; add pre/post score gate |
| `src/detection/` | pattern-analyzer.ts, skill-generator.ts | Add grounding check during generation |
| `src/observation/` | session-observer.ts, retention-manager.ts | Add lock file cleanup; add category tagging at capture |
| `src/application/` | relevance-scorer.ts | Downgrade to Haiku tier (two-tier model) |
| `src/cli.ts` | CLI entry point | Add score, refresh, insights commands |

The integration touches 7 existing files and adds 8 new files. The modification footprint is deliberately small: most integration work adds new capabilities without changing existing behavior [15].

---

## 14. Co-Activation Tracking

When multiple skills activate in the same session, gsd-skill-creator records the co-activation event. Over time, skills that consistently co-activate form clusters that suggest a higher-level abstraction: an agent [16].

```
CO-ACTIVATION -- CLUSTER DETECTION
================================================================

  Session 1: [typescript-patterns, react-components, jest-testing]
  Session 2: [typescript-patterns, react-components, storybook]
  Session 3: [typescript-patterns, react-components, jest-testing]

  Co-activation matrix:
    ts-patterns + react-components: 3/3 (100%)
    ts-patterns + jest-testing:     2/3 (67%)
    react-components + jest-testing: 2/3 (67%)

  Cluster detected: {typescript-patterns, react-components}
  Agent candidate: "React Development Agent"
  Skills: typescript-patterns + react-components + jest-testing
```

---

## 15. Agent Emergence from Skill Clusters

Agent emergence is one of gsd-skill-creator's most distinctive features. Rather than manually defining agents (which requires predicting what skill combinations will be useful), agents emerge organically from observed co-activation patterns [16].

The emergence threshold is deliberately high: a skill cluster must co-activate in at least 5 sessions with at least 80% overlap before an agent is proposed. This prevents premature agent creation from coincidental skill usage [16].

---

## 16. Kahn's Algorithm: Cycle Detection

Skills can extend other skills via the `extends:` field in SKILL.md frontmatter. This creates an inheritance graph that must be acyclic -- a skill that extends itself (directly or indirectly) creates an infinite resolution loop [17].

gsd-skill-creator uses Kahn's topological sort algorithm to detect cycles in the skill inheritance graph. Kahn's algorithm is preferred over DFS-based cycle detection because it naturally produces a valid resolution order as a byproduct: the topological sort output is the order in which skills should be resolved [17].

```
KAHN'S ALGORITHM -- CYCLE DETECTION
================================================================

  Input: skills with extends: fields
  Build adjacency list from extends relationships

  Step 1: Compute in-degree for each skill
  Step 2: Queue all skills with in-degree 0
  Step 3: While queue not empty:
    - Dequeue skill S
    - Add S to resolved order
    - For each skill T that extends S:
      - Decrement T's in-degree
      - If T's in-degree == 0, enqueue T
  Step 4: If resolved order length < total skills:
    CYCLE DETECTED -- report unresolved skills

  This is O(V+E) where V=skills, E=extends relationships.
  For typical projects (10-50 skills), this completes in <1ms.
```

> **Related:** [Risk & Bridge](05-risk-compatibility-bridge.md) for how cycle detection relates to Caliber's bidirectional source awareness roadmap

---

## 17. The Planning Layer

The `.planning/` directory serves as gsd-skill-creator's staging layer -- a local-only workspace for mission preparation, project state tracking, and configuration that should never be committed. This is architecturally significant: `.planning/` is always gitignored, ensuring that operational artifacts (mission files, state snapshots, configuration drafts) stay local [18].

The `deposit_mission` MCP tool writes structured mission data into `.planning/`, where it can be reviewed, refined, and eventually executed. The planning layer is the bridge between the human's intent and the machine's execution -- a structured staging area that ensures nothing executes without review [18].

---

## 18. Chipset YAML Model Assignment

gsd-skill-creator uses the Amiga chipset metaphor for model assignment:

| Chip | Role | Default Model | Integration Change |
|------|------|--------------|-------------------|
| Agnus | Orchestration / DMA | Opus | Cross-module integration decisions |
| Denise | Display / output | Sonnet | Port implementations, generation |
| Paula | Audio / I/O | Haiku | Score computation, classification |
| M68000 | CPU / glue logic | Sonnet | Planning, verification, code review |

The chipset model is configured in YAML and loaded at session start. Each operation's model tier is determined by which chip handles it, not by the operation's difficulty. This enforces cost discipline: Paula (Haiku) handles high-volume low-complexity operations; Agnus (Opus) handles low-volume high-stakes decisions [19].

---

## 19. Cross-References

> **Related:** [Caliber Architecture](01-caliber-architecture-analysis.md) -- the outside-in system that provides scoring infrastructure
> **Related:** [Integration Mapping](03-integration-mapping.md) -- how the two architectures converge
> **Related:** [Calibration Loops](04-calibration-loops-quality-metrics.md) -- the feedback cycle that connects scoring to refinement
> **Related:** [Risk & Bridge](05-risk-compatibility-bridge.md) -- DACP integrity, lock file risks, PR #28 conflict

Cross-project references:

| Project | Connection |
|---------|-----------|
| GSD2 | GSD-2 Architecture defines the full orchestration layer built on DACP |
| GSA | GSD Alignment provides the philosophical framework for bounded learning |
| CMH | Computational Mesh extends DACP bundles for distributed agent communication |
| MCF | Multi-Cluster Federation uses DACP for cross-cluster skill propagation |
| MGU | Module Governance defines promotion gates that consume skill scores |
| ACE | Compute Engine hosts the runtime for score-engine.ts and relevance-scorer.ts |
| K8S | Kubernetes provides the container model for isolated skill execution |
| PMG | Pi-Mono + GSD establishes lightweight deployment patterns for edge scoring |

---

## 20. Sources

1. Brooks, F. *The Mythical Man-Month.* Addison-Wesley, 1975. Ch. 1: "The Tar Pit."
2. Gamma, E. et al. *Design Patterns.* Addison-Wesley, 1994. Ch. 1: "Introduction."
3. Lehman, M. "Programs, Life Cycles, and Laws of Software Evolution." *Proc. IEEE*, vol. 68, no. 9, 1980.
4. Tibsfox. "gsd-skill-creator: README.md." GitHub, 2026.
5. Tibsfox. "DACP Protocol Specification." gsd-skill-creator dev branch, 2026.
6. Tibsfox. "gsd-skill-creator-analysis.md: DACP Architecture." Internal vision document, 2026.
7. Tibsfox. "gsd-chipset-architecture-vision.md." Internal vision document, 2026.
8. Tibsfox. "src/detection/pattern-analyzer.ts." gsd-skill-creator, 2026.
9. Tibsfox. "src/detection/skill-generator.ts." gsd-skill-creator, 2026.
10. Tibsfox. "src/application/relevance-scorer.ts." gsd-skill-creator, 2026.
11. Tibsfox. "src/observation/session-observer.ts." gsd-skill-creator, 2026.
12. Tibsfox. "src/learning/refinement-engine.ts: Bounded Learning Constraints." gsd-skill-creator, 2026.
13. Norman, D. *The Design of Everyday Things.* Basic Books, 2013. Ch. 5: "Human Error? No, Bad Design."
14. caliber-ai-org. "src/commands/refresh.ts: Score Regression Guard." GitHub, 2026.
15. Tibsfox. "gsd-skill-creator: src/ Module Map." GitHub, 2026.
16. Tibsfox. "src/detection/co-activation-tracker.ts." gsd-skill-creator, 2026.
17. Kahn, A.B. "Topological sorting of large networks." *Communications of the ACM*, vol. 5, no. 11, 1962.
18. Tibsfox. "gsd-planning-docs-vision.md." Internal vision document, 2026.
19. Tibsfox. "gsd-chipset-architecture-vision.md: Model Assignment." Internal vision document, 2026.
