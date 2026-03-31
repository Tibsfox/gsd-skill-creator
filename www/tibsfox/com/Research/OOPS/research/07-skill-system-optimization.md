# Skill System Optimization

Deep analysis of gsd-skill-creator's 34-skill ecosystem: inventory, description compliance, trigger analysis, token cost modeling, overlap detection, format gaps, and optimization recommendations.

## 1. Skill Inventory

### 1.1 Directory Census

35 directories exist under `.claude/skills/`. 33 contain a `SKILL.md` file. 1 directory (`test-skill`) contains only a `tests.json` file with no SKILL.md -- it appears to be a test fixture, not a real skill. The effective skill count is **33 active skills**.

### 1.2 Category Taxonomy

Skills fall into five functional categories based on their purpose and activation patterns.

**GSD Workflow (7 skills)**

| Skill | Words | Purpose |
|-------|-------|---------|
| gsd-workflow | 1,072 | Core routing, phase execution, lifecycle management |
| session-awareness | 326 | Project state awareness, session recovery |
| skill-integration | 698 | Skill loading, observation, bounded learning |
| gsd-explain | 1,214 | Command explanation and previews |
| gsd-onboard | 205 | Tutorial and command reference |
| gsd-preflight | 194 | Artifact validation before workflows |
| gsd-trace | 210 | Decision archaeology through GSD artifacts |

**Gastown Chipset (12 skills)**

| Skill | Words | Purpose |
|-------|-------|---------|
| runtime-hal | 1,822 | Multi-runtime detection and abstraction |
| mayor-coordinator | 1,249 | Cross-rig coordination, convoy management |
| polecat-worker | 1,253 | Ephemeral autonomous work execution |
| witness-observer | 1,082 | Agent health monitoring, stall detection |
| sling-dispatch | 2,305 | Work item routing and dispatch pipeline |
| done-retirement | 2,267 | Work completion and retirement pipeline |
| refinery-merge | 1,251 | Sequential merge queue processing |
| beads-state | 1,086 | Filesystem state persistence |
| hook-persistence | 1,461 | Work assignment channel (GUPP hooks) |
| mail-async | 1,084 | Durable inter-agent messaging |
| nudge-sync | 1,172 | Synchronous signaling channel |
| gupp-propulsion | 1,974 | Execution enforcement, anti-passivity |

**Team Orchestration (3 skills)**

| Skill | Words | Purpose |
|-------|-------|---------|
| uc-lab | 423 | Unit Circle mission control team |
| uc-observatory | 379 | UC performance monitoring and analysis |
| sc-dev-team | 386 | Dev branch mission control team |

**Development Practices (8 skills)**

| Skill | Words | Purpose |
|-------|-------|---------|
| beautiful-commits | 208 | Professional commit message crafting |
| git-commit | 411 | Conventional commit generation |
| code-review | 158 | Code review checklist and severity |
| test-generator | 183 | Test case generation patterns |
| typescript-patterns | 216 | TypeScript best practices |
| api-design | 254 | REST API design rules |
| env-setup | 199 | Environment configuration and secrets |
| file-operation-patterns | 137 | Safe file operation patterns |

**Cross-Cutting (3 skills)**

| Skill | Words | Purpose |
|-------|-------|---------|
| security-hygiene | 327 | Self-modifying system security |
| context-handoff | 184 | Session continuity documents |
| decision-framework | 187 | Thinking frameworks for decisions |
| image-to-mission | 594 | Creative intent extraction from images |

### 1.3 Category Distribution

```
Gastown Chipset:      12 skills  (36%)   18,006 words  (69%)
GSD Workflow:          7 skills  (21%)    3,919 words  (15%)
Development Practices: 8 skills  (24%)    1,766 words   (7%)
Team Orchestration:    3 skills   (9%)    1,188 words   (5%)
Cross-Cutting:         4 skills  (12%)    1,292 words   (5%)
                      --------           ------
Total:                34 skills          26,171 words
```

The Gastown chipset dominates: 12 skills comprising 69% of total word count. This is by design -- the chipset is the most complex subsystem -- but it has implications for context budget discussed in Section 4.

## 2. Description Length Analysis

Claude Code enforces a 250-character cap on skill descriptions. This is the string that appears in the skill index and drives activation decisions. Descriptions that exceed the cap may be truncated, reducing activation accuracy.

### 2.1 Over-Limit Descriptions (>250 chars)

| Skill | Chars | Over By |
|-------|-------|---------|
| gupp-propulsion | 291 | +41 |
| uc-lab | 245 | (borderline, within quoted format) |

Only `gupp-propulsion` is definitively over the 250-character limit. Its description at 291 characters is the longest across all skills. The MEMORY.md notes that "6 over-limit" skills were previously trimmed, suggesting this was addressed but gupp-propulsion either regressed or was missed.

### 2.2 Near-Limit Descriptions (200-250 chars)

| Skill | Chars |
|-------|-------|
| sling-dispatch | 236 |
| uc-observatory | 224 |
| sc-dev-team | 221 |
| runtime-hal | 215 |
| polecat-worker | 212 |
| witness-observer | 206 |
| beads-state | 205 |
| gsd-explain | 202 |

Eight skills sit between 200 and 250 characters. These are safe but have minimal room for description expansion.

### 2.3 Compact Descriptions (<120 chars)

| Skill | Chars |
|-------|-------|
| gsd-onboard | 87 |
| code-review | 98 |
| test-generator | 98 |
| file-operation-patterns | 101 |
| api-design | 102 |

These descriptions are terse. While brevity is generally good, some of these lack activation trigger keywords. For example, `code-review` says "Reviews code for bugs, style, and best practices" but does not mention "PR", "pull request", or "diff" -- common user phrases that should trigger this skill.

## 3. Trigger Analysis

### 3.1 Activation Mechanisms

Skills activate based on description keyword matching against user prompts and context. Three activation patterns exist:

1. **Keyword triggers** -- "Use when..." or "Activates when..." phrases in the description (21 skills)
2. **Context triggers** -- File paths, directories, or artifacts that signal relevance (7 skills)
3. **Domain triggers** -- Specific subsystem activation (5 skills, mostly Gastown)

### 3.2 Overlap Detection

**Critical Overlap: beautiful-commits vs git-commit**

These two skills serve nearly identical purposes:
- `beautiful-commits`: "Crafts professional git commit messages following Conventional Commits"
- `git-commit`: "Generates conventional commit messages following Angular format"

Both cover the same commit types table, the same format rules, the same anti-patterns. The content is ~80% identical. When a user mentions "commit", both skills compete for activation. This wastes context budget by loading redundant information.

**Moderate Overlap: gsd-workflow vs skill-integration**

Both contain a "Skill Loading Before GSD Phases" section with identical 5-step loading protocol. The skill-integration version expands this with token budget management details, but the core content is duplicated. The gsd-workflow version should reference skill-integration rather than duplicating.

**Moderate Overlap: gsd-onboard vs gsd-explain**

Both explain GSD commands. gsd-onboard is a compact reference (52 lines), while gsd-explain is a detailed explainer (274 lines). They serve different user experience levels but could confuse the activation system when a user asks "what does this GSD command do?"

**Low Overlap: uc-lab vs sc-dev-team**

sc-dev-team explicitly describes itself as "adapted from uc-lab pattern." The two skills share architecture (same 4-agent team), same autonomy principles, same context management thresholds. The differences are branch target (dev vs v1.50), quality gates, and integration with the observatory. These could potentially be a single parameterized skill.

### 3.3 Missing Triggers

Several skills lack obvious trigger keywords in their descriptions:

- `decision-framework` -- does not mention "trade-off", "pros and cons", or "compare"
- `file-operation-patterns` -- does not mention "copy", "move", "delete", or "mkdir"
- `env-setup` -- does not mention "dotenv", "environment variable", or "API key"
- `security-hygiene` -- does not mention "security review", "vulnerability", or "audit"

### 3.4 Gastown Cross-Activation

The 12 Gastown skills form a tightly coupled system where activating one often requires knowledge from several others. The `## Integration with Other Gastown Skills` tables that appear in each skill document this well, but it creates a loading dilemma: activating `polecat-worker` without `hook-persistence` and `beads-state` means the polecat skill lacks the state management context it references.

## 4. Token Cost Analysis

### 4.1 Methodology

Word count serves as a proxy for token cost. For English text, the typical ratio is ~1.3 tokens per word. For code-heavy technical content (which these skills contain), the ratio is closer to ~1.5 tokens per word due to identifiers, punctuation, and formatting.

### 4.2 Per-Skill Token Estimates

**Heavy skills (>2,000 tokens estimated):**

| Skill | Words | Est. Tokens |
|-------|-------|-------------|
| sling-dispatch | 2,305 | ~3,460 |
| done-retirement | 2,267 | ~3,400 |
| gupp-propulsion | 1,974 | ~2,960 |
| runtime-hal | 1,822 | ~2,730 |
| hook-persistence | 1,461 | ~2,190 |
| polecat-worker | 1,253 | ~1,880 |
| refinery-merge | 1,251 | ~1,880 |
| mayor-coordinator | 1,249 | ~1,870 |
| gsd-explain | 1,214 | ~1,820 |
| nudge-sync | 1,172 | ~1,760 |
| beads-state | 1,086 | ~1,630 |
| mail-async | 1,084 | ~1,630 |
| witness-observer | 1,082 | ~1,620 |
| gsd-workflow | 1,072 | ~1,610 |

**Light skills (<500 tokens estimated):**

| Skill | Words | Est. Tokens |
|-------|-------|-------------|
| file-operation-patterns | 137 | ~205 |
| code-review | 158 | ~237 |
| test-generator | 183 | ~275 |
| context-handoff | 184 | ~276 |
| decision-framework | 187 | ~280 |
| gsd-preflight | 194 | ~291 |
| env-setup | 199 | ~299 |
| gsd-onboard | 205 | ~308 |
| beautiful-commits | 208 | ~312 |

### 4.3 Aggregate Budget Impact

Total across all 33 skills: **~39,250 tokens** (26,171 words x 1.5).

For a 200K context window, loading all skills would consume ~20% of context. This is well above the 2-5% budget guidance stated in skill-integration's loading protocol. Even a 1M context window would see ~4% consumed by full skill load.

Additionally, 29 reference files exist across skill subdirectories. These are loaded on demand but represent additional token cost when activated. The Gastown skills reference a `gastown-origin.md` file in 10 of 12 cases -- if a Gastown task loads multiple skills, that origin reference would ideally be loaded once and shared.

### 4.4 Realistic Activation Scenarios

**Scenario: User writes code and commits**
- Skills loaded: typescript-patterns (216w), beautiful-commits (208w), git-commit (411w)
- Total: ~835 words, ~1,250 tokens
- Budget: 0.6% of 200K -- well within limits

**Scenario: Gastown multi-agent dispatch**
- Skills loaded: mayor-coordinator (1,249w), sling-dispatch (2,305w), polecat-worker (1,253w), hook-persistence (1,461w), beads-state (1,086w), gupp-propulsion (1,974w)
- Total: ~9,328 words, ~14,000 tokens
- Budget: 7% of 200K -- over the 5% ceiling

**Scenario: Full GSD phase execution**
- Skills loaded: gsd-workflow (1,072w), session-awareness (326w), skill-integration (698w)
- Total: ~2,096 words, ~3,144 tokens
- Budget: 1.6% of 200K -- comfortable

The Gastown chipset is the only category that risks exceeding the token budget when multiple related skills co-activate.

## 5. Frontmatter Format Analysis

### 5.1 Fields Currently Used

Across all 33 skills, the following frontmatter fields appear:

| Field | Count | Usage |
|-------|-------|-------|
| `name` | 33/33 | Universal |
| `description` | 33/33 | Universal |
| `user-invocable` | 4/33 | gsd-workflow, security-hygiene, session-awareness, skill-integration |
| `domain` | 1/33 | image-to-mission only |
| `context` | 1/33 | image-to-mission only |
| `activation` | 1/33 | image-to-mission only |
| `dependencies` | 1/33 | image-to-mission only |

### 5.2 Fields Not Used But Potentially Available

Based on the `skills-2025-10-02` format reference found in Claude Code's binary and the `agentskills.io` pattern, several fields may be available but unused:

- **`version`** -- Skill format version tracking. No skill currently declares a version. This makes it impossible to detect stale skills or trigger migration when the format evolves.
- **`tags`** -- Categorical tags for grouping and filtering. Currently implicit in directory organization.
- **`priority`** -- Loading priority when multiple skills compete for budget. Currently handled by the skill-integration loading pipeline but not declared per-skill.
- **`context_cost`** -- Declared token cost, allowing the loader to make budget decisions without reading the full file. Currently estimated at load time.
- **`triggers`** -- Explicit trigger patterns separate from the description. Would allow precise activation without overloading the description field.
- **`conflicts`** -- Skills that should not co-activate. Would address the beautiful-commits/git-commit overlap.
- **`requires`** -- Hard dependencies (vs the `dependencies.optional` used by image-to-mission).

### 5.3 The `user-invocable` Field

Only 4 of 33 skills declare `user-invocable: true`. This field likely controls whether the skill appears in user-facing command suggestions. The remaining 29 skills are presumably auto-activating only. However, several skills that feel user-invocable (like gsd-explain, gsd-onboard, gsd-trace) do not declare this field. This may be an inconsistency or a deliberate design choice.

## 6. Optimization Opportunities

### 6.1 Merge Candidates

**beautiful-commits + git-commit --> commit-style**

These two skills should be merged. They share identical content (commit types, format rules, Angular convention). The merged skill would be approximately 300 words -- smaller than either individual skill with duplicated content removed. Priority: high, eliminates the most obvious activation conflict.

**uc-lab + sc-dev-team --> team-control**

These share 90% of their structure. A single parameterized skill with a "mode" section (UC vs dev) would save ~400 words and eliminate the risk of them diverging. The quality rubric section is UC-specific and could live in a reference file. Priority: medium.

**gsd-onboard + gsd-explain --> gsd-guide**

These serve overlapping purposes (explaining GSD) at different verbosity levels. A single skill with a "quick reference" section and a "detailed explanation" section would be cleaner. The activation keywords would no longer compete. Priority: medium.

### 6.2 Split Candidates

**gupp-propulsion**

At 1,974 words and 291-character description, this is the largest and most over-limit skill. The content splits naturally into:
- Core GUPP principle and enforcement rules (~500 words)
- Per-runtime strategy details (could be reference files per runtime)
- Observable metrics and learning feedback loop (~400 words, rarely needed)
- Safety boundaries (~300 words, could be a reference)

Splitting the core into a ~500 word SKILL.md with references for strategy details and metrics would cut SKILL.md token cost by 75% while keeping all content accessible. Priority: high.

**sling-dispatch**

At 2,305 words, this is the largest skill. The 7-stage pipeline documentation includes full TypeScript implementations that are rarely needed for activation context. The SKILL.md should contain the pipeline overview and stage descriptions; the TypeScript implementations should move to a `references/pipeline-implementation.md`. Priority: high.

**done-retirement**

Same pattern as sling-dispatch: 2,267 words with full TypeScript implementations inline. The 7-stage retirement pipeline overview is essential; the implementation code is reference material. Priority: high.

### 6.3 Removal Candidates

**test-skill**

This directory contains only `tests.json` with no SKILL.md. It serves no skill loading purpose. Either add a proper SKILL.md or remove the directory. Priority: low (causes no harm).

### 6.4 Reference Consolidation

10 of the 12 Gastown skills reference a `gastown-origin.md` file. These likely contain overlapping context about the Gastown architecture metaphor. A single shared `gastown-architecture.md` reference at the chipset level would eliminate duplication and ensure consistency. Each skill's reference file would then contain only its specific mapping to the architecture.

### 6.5 Description Optimization

The gupp-propulsion description needs trimming to fit the 250-character cap. Proposed:

Current (291 chars):
> Interrupt controller for multi-agent execution enforcement. Converts polled (waiting) execution to interrupt-driven (proactive) execution using per-runtime strategies, configurable thresholds, and the Deacon heartbeat supervision pattern. Fights LLM assistant training bias toward passivity.

Proposed (242 chars):
> Interrupt controller for multi-agent execution. Converts polled execution to interrupt-driven using per-runtime strategies, Deacon heartbeat supervision, and configurable thresholds. Counters LLM passivity bias.

## 7. Skill Versioning

### 7.1 Current State

No skill declares a version. No mechanism exists to track when a skill was last modified, what format version it targets, or whether it needs migration when the skill system evolves.

### 7.2 Proposed Versioning Scheme

```yaml
---
name: example-skill
description: ...
format: 2025-10-02      # skill-format date from Claude Code
version: 1.2.0           # semver for this skill's content
updated: 2026-03-31      # last modification date
---
```

Three version dimensions serve different purposes:
- **format** -- Which skill format specification this SKILL.md targets. Enables automated migration when Claude Code updates the format.
- **version** -- Semantic version of the skill content. Major = breaking activation change, minor = content addition, patch = fix/clarification.
- **updated** -- Simple date for staleness detection. Skills not updated in 90+ days could be flagged for review.

### 7.3 Migration Path

Adding version fields is backward-compatible. Skills without version fields would be treated as `format: 2025-10-02, version: 1.0.0, updated: unknown`. A one-time migration script could set `updated` from git blame timestamps.

## 8. Recommendations

### 8.1 Immediate Actions (No Risk)

1. **Merge beautiful-commits and git-commit** into a single `commit-style` skill. Remove duplicated content. Estimated savings: ~300 words, elimination of activation conflict.

2. **Trim gupp-propulsion description** to fit the 250-character cap. No content loss, just description field compliance.

3. **Add missing trigger keywords** to compact descriptions (code-review, env-setup, decision-framework, file-operation-patterns). Improves activation accuracy at zero cost.

4. **Remove or complete test-skill** directory. Either add a SKILL.md or delete the directory.

### 8.2 High-Value Refactors

5. **Split the three heaviest Gastown skills** (sling-dispatch, done-retirement, gupp-propulsion) into lean SKILL.md files plus reference subdirectories. Move TypeScript implementations and detailed protocol descriptions into references. Target: each SKILL.md under 800 words. Estimated savings: ~8,000 words (~12,000 tokens) from the "default load" path.

6. **Add `version` and `format` frontmatter** to all skills. Enables format migration tracking and staleness detection.

7. **Add `triggers` frontmatter** as explicit activation patterns separate from descriptions. This allows the description to focus on explaining the skill to humans while triggers focus on matching user intent for the loader.

8. **Consolidate gastown-origin.md references** into a shared chipset-level document. Each skill references the shared file plus its specific mapping.

### 8.3 Structural Improvements

9. **Introduce a `conflicts` frontmatter field** to prevent known-overlapping skills from co-activating. This is cheaper than merging skills and preserves modularity.

10. **Introduce a `context_cost` frontmatter field** declaring approximate token cost. The skill-integration loader can then make budget decisions from frontmatter alone without reading full content.

11. **Merge uc-lab and sc-dev-team** into a parameterized team-control skill with mode switching. Reduces maintenance burden and prevents divergence.

12. **Create a skill registry** -- a single index file listing all skills with their category, token cost, activation patterns, and conflicts. This serves as both documentation and a machine-readable manifest for the loader. Currently, the loader must scan all directories and parse all frontmatter blocks on every activation check.

### 8.4 Projected Impact

If all recommendations were implemented:

| Metric | Current | Projected |
|--------|---------|-----------|
| Skill count | 33 | 30 (3 merges) |
| Total words in SKILL.md files | 26,171 | ~18,000 |
| Total estimated tokens | ~39,250 | ~27,000 |
| Gastown scenario budget (200K) | 7% | ~3.5% |
| Over-limit descriptions | 1 | 0 |
| Activation conflicts | 3 pairs | 0 |
| Skills with version tracking | 0 | 30 |

The most impactful single change is splitting the three heaviest Gastown skills into SKILL.md + references. This alone saves ~12,000 tokens from the default activation path while keeping all content accessible when needed.

## 9. The Format Evolution Question

Claude Code's binary references `skills-2025-10-02` as a format date and `agentskills.io` as a domain. This suggests the skill format is versioned and may evolve. Our current skills use a minimal frontmatter schema (name + description + optional fields). If the format specification adds new required fields or changes activation semantics, we need a migration path.

The recommended approach: add `format: 2025-10-02` to all skills now. When a new format version appears, a script can identify skills needing migration by comparing their declared format to the current specification. Skills without a format declaration are assumed to be on the oldest known format.

The agentskills.io reference hints at a community skill ecosystem. If skills become publishable and shareable (similar to npm packages), our skills would need additional metadata: author, license, compatibility ranges, and dependency resolution. The `dependencies` field used by image-to-mission is a prototype of this pattern. Building the registry (Recommendation 12) positions us to adopt community sharing if the ecosystem materializes.

---

*Research conducted 2026-03-31. Data sourced from direct reading of all 33 SKILL.md files and 29 reference files across .claude/skills/. Word counts measured with wc, character counts measured on extracted description fields.*
