---
title: "Core Learning Domain"
layer: framework
path: "framework/architecture/core-learning.md"
summary: "The six core capabilities that define skill-creator's learning domain: observe, detect, generate, validate, compose, and budget."
cross_references:
  - path: "framework/architecture/index.md"
    relationship: "builds-on"
    description: "Part of architecture section"
  - path: "framework/core-concepts.md"
    relationship: "parallel"
    description: "Conceptual overview of the same abstractions"
  - path: "framework/features.md"
    relationship: "parallel"
    description: "Feature-level view of these capabilities"
  - path: "principles/progressive-disclosure.md"
    relationship: "parallel"
    description: "The progressive disclosure principle applied to learning depth"
reading_levels:
  glance: "The six core capabilities that define skill-creator's learning domain: observe, detect, generate, validate, compose, and budget."
  scan:
    - "CAP-001: Session observation with bounded, append-only JSONL storage"
    - "CAP-002: Pattern detection using DBSCAN clustering and n-gram extraction"
    - "CAP-003: Skill generation with format validation and content pre-fill"
    - "CAP-004: Skill validation against official Claude Code format"
    - "CAP-005: Agent composition from co-activation clusters"
    - "CAP-006: Token budget management with six-stage pipeline and per-profile budgets"
created_by_phase: "v1.34-329"
last_verified: "2026-02-25"
---

# Core Learning Domain

The core learning domain defines six capabilities that together form skill-creator's adaptive
learning system. These capabilities (designated CAP-001 through CAP-006) cover the complete
lifecycle from observing sessions to loading the right skills into the right context. Each
capability is bounded by safety constraints that prevent drift, over-fitting, and unintended
changes.

This document specifies each capability at the technical level. For the conceptual overview,
see [Core Concepts](framework/core-concepts.md). For how these capabilities fit into the
broader architecture, see the
[Architecture Overview](framework/architecture/index.md).


## CAP-001: Session Observation

Session observation is the foundation of the learning system. It captures structured
summaries of Claude Code sessions and stores them for pattern analysis.

### What Is Observed

The observation system records four categories of data from each session.

**Commands executed** includes build commands, test invocations, deployment operations, and git
workflows. Command sequences are the primary input for pattern detection.

**Files touched** captures file paths, types, and access patterns. Which files are consistently
opened together, which directories are frequently visited, and which file types appear in
recurring workflows.

**Decisions made** records choices, preferences, and corrections. When a user overrides a
suggestion, changes a default, or corrects an output, that decision is captured as feedback
signal.

**Skills activated** tracks which skills loaded and when. This data feeds co-activation
tracking for agent composition (CAP-005).

### Storage Format

Observations are stored in `.planning/patterns/sessions.jsonl` using the JSONL format (one
JSON object per line). Each entry contains the session data, a timestamp, and a SHA-256
checksum for integrity verification.

The JSONL format was chosen for three properties. **Append-only writes** prevent corruption
when multiple GSD agents write simultaneously. **Stream parsing** enables processing of large
files (23 MB or more) without loading everything into memory. **Line-level integrity** means a
corrupted entry does not invalidate the rest of the file.

### Bounds

Observation is constrained by three mechanisms.

**Retention limits** default to 90 days or 1000 sessions, whichever comes first. Old
observations are compacted and eventually purged.

**Rate limiting** prevents observation flooding. If sessions are spawned faster than the
observation system can process them, excess events are dropped rather than queued, preventing
unbounded memory growth.

**Anomaly detection** flags unusual patterns that might indicate data poisoning. Observations
with suspiciously high event counts or improbable sequences are quarantined for review.


## CAP-002: Pattern Detection

Pattern detection transforms raw observations into structured candidates for skill creation.
It operates in three stages.

### Extraction

The extractor identifies recurring sequences from observation data.

**Command n-grams** capture sequences of tool invocations. If a developer consistently runs
`Read -> Edit -> Bash(test) -> Read` when fixing bugs, that four-gram appears as a pattern.
N-gram lengths of two through five are typically useful.

**File access patterns** capture which files are consistently touched together. If
`tsconfig.json` and `package.json` are always modified in the same session, that co-access
pattern is recorded.

**Workflow structures** capture higher-level task patterns. A create-PR, review, merge cycle
that repeats across projects is a workflow pattern.

### Clustering

Similar patterns are grouped using DBSCAN (Density-Based Spatial Clustering of Applications
with Noise) with automatic epsilon tuning. DBSCAN was chosen because it does not require
specifying the number of clusters in advance and naturally identifies noise (non-repeating
patterns that do not belong to any cluster).

Clustering serves two purposes. It groups variations of the same pattern (like `npm test` and
`npm run test:watch` being variants of a testing pattern). And it separates genuine patterns
from coincidental co-occurrences.

### Ranking

Candidates are scored on four dimensions.

**Frequency** measures how often the pattern appears. More frequent patterns score higher.

**Cross-project occurrence** measures whether the pattern appears across multiple projects.
Patterns that repeat in diverse contexts are more likely to be genuinely useful skills.

**Recency** weights recent patterns higher than old ones. A pattern that appeared last week is
more likely to be relevant than one from six months ago.

**Consistency** measures how stable the pattern is over time. A pattern that appears in bursts
and then disappears scores lower than one that appears steadily.

### Thresholds

A pattern becomes a candidate when it reaches three occurrences by default. This threshold is
configurable but should not be set below two (a single occurrence is anecdotal, not a pattern).
Framework patterns that appear in 15 or more projects are filtered as noise using a dual
threshold mechanism, since these likely represent universal behaviors rather than learnable
skills.


## CAP-003: Skill Generation

Skill generation transforms accepted candidates into properly formatted skill files.

### Generation Process

When a user accepts a candidate from `skill-creator suggest`, the generator produces a
complete skill file. The **name** is derived from the pattern's primary action, formatted as
lowercase with hyphens. The **description** is synthesized from the pattern evidence, phrased
as activation instructions. The **content** is pre-filled with workflow steps extracted from the
observed command sequences and file patterns. The **triggers** are set based on the contexts
where the pattern was observed.

### Format Compliance

Generated skills must conform to the official Claude Code skill format. The generator validates
the output against the format specification before writing the file. Validation checks include
name format (lowercase, hyphens, no spaces), directory structure (skill directory containing
SKILL.md), metadata schema (all required frontmatter fields present), and structural
consistency (directory name matches skill name).

### Progressive Disclosure

Large skills (those exceeding the per-skill character limit) are automatically decomposed
into a progressive disclosure structure. The main `SKILL.md` contains the most essential
content. A `reference/` directory contains supplementary material. A `scripts/` directory
contains automation scripts. This decomposition happens at generation time, ensuring that the
skill fits within token budgets while preserving access to the full knowledge.


## CAP-004: Skill Validation

Skill validation ensures that skills conform to the official Claude Code format and that
changes to skills are bounded and safe.

### Format Validation

The validator checks four aspects of every skill. **Name format** must be lowercase with
hyphens, no spaces or special characters. **Directory structure** must contain a SKILL.md file
at the expected path. **Metadata schema** must include all required frontmatter fields with
valid values. **Structural consistency** requires the directory name to match the skill name
in the metadata.

### Conflict Detection

The semantic conflict detector identifies skills with overlapping activation triggers. If two
skills both claim to activate for "TypeScript testing" contexts, the conflict detector flags
them for resolution. Conflicts are scored by overlap degree, and resolution strategies include
merging, prioritizing one skill over the other, or adding disambiguation triggers.

### Activation Scoring

The activation simulator predicts how likely a skill is to activate for a given input. It
uses local embeddings (via HuggingFace) to compute similarity between the input and the
skill's triggers. This enables testing activation behavior without running a full Claude Code
session.

### Bounded Learning

Skill refinement operates under strict guardrails that constitute the bounded learning system.

| Parameter             | Value  | Purpose                                             |
|-----------------------|--------|-----------------------------------------------------|
| Minimum corrections   | 3      | Require consistent feedback before proposing changes |
| Maximum change        | 20%    | Prevent drastic alterations in a single refinement   |
| Cooldown              | 7 days | Allow observation of changes before next refinement  |
| User confirmation     | Always | Human in the loop for every change                   |
| Cumulative drift      | 60%    | Halt auto-refinements when skill has drifted too far |
| Contradiction check   | Auto   | Flag contradictory feedback before applying          |

These parameters are architectural constraints, not user-configurable options. They exist
because unbounded learning systems inevitably drift beyond recognition. The 20% per-refinement
limit ensures no single change is too large to understand. The seven-day cooldown ensures
changes are observed in practice before more changes are proposed. The 60% cumulative drift
threshold ensures that a skill that has been refined many times still bears meaningful
resemblance to its original version.

When a skill reaches the 60% drift threshold, automatic refinement halts and the skill is
flagged for manual review. The user can reset the drift counter, rewrite the skill from
scratch, or leave it as-is. This prevents the system from iteratively transforming a skill
into something entirely different from what the user originally created.


## CAP-005: Agent Composition

Agent composition detects stable co-activation patterns and generates composite agents from
frequently paired skills.

### Co-Activation Tracking

Every time skills are loaded together in the same session, the co-activation tracker records
the pair. Over time, this builds a frequency matrix of skill pairs. A co-activation event
requires that both skills were actually used (loaded and contributed to the session), not just
installed.

### Cluster Detection

When a skill pair reaches five co-activations, it enters the candidate pool. The cluster
detector groups related pairs into clusters of two to five skills. Clusters must be stable,
meaning the co-activation pattern persists over seven or more days. This temporal requirement
prevents transient bursts of activity from creating premature agents.

### Agent Generation

For stable clusters that meet both the co-activation and temporal thresholds, the system
generates an agent definition. The generated agent specifies included skills, a name derived
from the cluster's primary activities, a model preference based on the complexity of the
combined skills, and tool permissions aggregated from the constituent skills.

Generated agents follow Claude Code's agent format with skill-creator metadata namespaced
under `metadata.extensions.gsd-skill-creator`. This namespacing ensures zero collision with
upstream Claude Code changes.

### Manual Override

Automatic composition is a convenience, not a mandate. Users can create agents manually,
modify generated agents, or dismiss composition suggestions. The system never creates agents
without user confirmation.


## CAP-006: Token Budget Management

Token budget management ensures that skill loading maximizes value within the tight constraints
of AI context windows.

### Budget Allocation

The default budget is 2-5% of the context window, expressed as a character limit. The default
single-skill limit is 15,000 characters. The default cumulative limit is 15,500 characters.
Both limits are configurable, and different agent profiles can have different budgets.

```json
{
  "token_budget": {
    "cumulative_char_budget": 15500,
    "profile_budgets": {
      "executor": 20000,
      "planner": 12000,
      "researcher": 8000
    }
  }
}
```

The priority chain for budget resolution is: config `profile_budgets` for the active profile,
then config `cumulative_char_budget`, then environment variable
`SLASH_COMMAND_TOOL_CHAR_BUDGET`, then the default of 15,500 characters.

### Loading Projection

The budget system distinguishes between two dimensions.

**Installed total** is the sum of all skill files on disk. This represents everything
available.

**Loadable total** is the sum of skills that will actually load after the six-stage pipeline
filters, scores, orders, and budgets them. This is what the model actually sees.

The `LoadingProjection` simulates what the BudgetStage would select for a given profile,
allowing the user to preview which skills will load before a session starts. The
`skill-creator status` command displays both dimensions.

### Budget History

Budget snapshots track installed and loaded totals over time. The `getDualTrend()` function
computes deltas for trend analysis. Skills that cost more tokens than they save are flagged
for review. Old snapshots without dual-dimension fields are automatically migrated.

### Cache Optimization

Cache-aware ordering assigns each skill a cacheTier value from 0 to 9. Skills with lower
tier values load first. Because Claude Code maintains a five-minute prompt cache, consistent
ordering across rapid sequential agent spawns means the stable prefix of the prompt remains
cached. A skill at cacheTier 0 appears at the same position in every spawn, maximizing cache
hit probability.

The cache optimizer calculates token savings from cache hits and recommends tier assignments
based on skill stability (how often the skill's content changes) and priority (how critical
the skill is for typical sessions). Stable, high-priority skills should have low cache tiers.
Volatile or optional skills should have high cache tiers so they appear after the stable
prefix.
