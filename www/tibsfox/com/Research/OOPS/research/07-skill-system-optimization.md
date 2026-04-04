# Skill System Optimization

Deep analysis of gsd-skill-creator's skill ecosystem: complete inventory, description compliance, trigger analysis, token cost modeling, overlap detection, format audit against the agentskills.io specification, new skill assessment, lifecycle management, and optimization recommendations.

## 1. Complete Skill Inventory

### 1.1 Directory Census

41 directories exist under `.claude/skills/`. 39 contain a `SKILL.md` file. 1 directory (`test-skill`) contains only a `tests.json` file with no SKILL.md -- it appears to be a test fixture, not a real skill. The effective skill count is **39 active skills**, up from 33 at the start of this research session. 6 new skills were created during this session as part of the OOPS research effort itself.

### 1.2 Complete Inventory Table

The following table lists every skill with all measurable fields. Description length is the character count of the `description` frontmatter field. Line count and word count are for the full SKILL.md file. Category is assigned by functional analysis. Trigger type indicates the activation mechanism. Token estimate uses a 1.5x multiplier on word count for code-heavy technical content.

| # | Skill | Desc Chars | Lines | Words | Est. Tokens | Category | Has Version | User-Invocable | Ref Files | Trigger Type |
|---|-------|-----------|-------|-------|-------------|----------|-------------|----------------|-----------|-------------|
| 1 | api-design | 102 | 53 | 254 | ~381 | Dev Practices | No | No | 0 | Keyword |
| 2 | beads-state | 205 | 219 | 1,086 | ~1,630 | Gastown | No | No | 1 | Domain |
| 3 | beautiful-commits | 127 | 51 | 208 | ~312 | Dev Practices | No | No | 0 | Keyword |
| 4 | code-review | 98 | 42 | 158 | ~237 | Dev Practices | No | No | 0 | Keyword |
| 5 | context-handoff | 121 | 54 | 184 | ~276 | Cross-Cutting | No | No | 0 | Keyword |
| 6 | data-fidelity | 160 | 53 | 267 | ~401 | Research Ops | Yes (1.0.0) | No | 0 | Keyword |
| 7 | decision-framework | 114 | 32 | 187 | ~280 | Cross-Cutting | No | No | 0 | Keyword |
| 8 | done-retirement | 187 | 377 | 2,267 | ~3,400 | Gastown | No | No | 1 | Domain |
| 9 | ecosystem-alignment | 155 | 61 | 280 | ~420 | Research Ops | Yes (1.0.0) | No | 0 | Keyword |
| 10 | env-setup | 128 | 43 | 199 | ~299 | Dev Practices | No | No | 0 | Keyword |
| 11 | file-operation-patterns | 101 | 36 | 137 | ~205 | Dev Practices | No | No | 0 | Keyword |
| 12 | fleet-mission | 153 | 60 | 336 | ~504 | Research Ops | Yes (1.0.0) | No | 0 | Keyword |
| 13 | git-commit | 192 | 106 | 411 | ~617 | Dev Practices | No | No | 0 | Keyword |
| 14 | gsd-explain | 202 | 274 | 1,214 | ~1,820 | GSD Workflow | No | No | 0 | Keyword |
| 15 | gsd-onboard | 87 | 52 | 205 | ~308 | GSD Workflow | No | No | 0 | Keyword |
| 16 | gsd-preflight | 122 | 37 | 194 | ~291 | GSD Workflow | No | No | 0 | Keyword |
| 17 | gsd-trace | 145 | 40 | 210 | ~315 | GSD Workflow | No | No | 0 | Keyword |
| 18 | gsd-workflow | 187 | 184 | 1,072 | ~1,610 | GSD Workflow | No | Yes | 3 | Context |
| 19 | gupp-propulsion | 174 | 263 | 1,961 | ~2,940 | Gastown | No | No | 2 | Domain |
| 20 | hook-persistence | 186 | 295 | 1,461 | ~2,190 | Gastown | No | No | 1 | Domain |
| 21 | image-to-mission | 170 | 105 | 594 | ~891 | Cross-Cutting | No | No | 0 | Keyword + Context |
| 22 | issue-triage-pr-review | 161 | 137 | 836 | ~1,254 | Research Ops | Yes (1.0.0) | Yes | 0 | Keyword |
| 23 | mail-async | 168 | 219 | 1,084 | ~1,630 | Gastown | No | No | 1 | Domain |
| 24 | mayor-coordinator | 181 | 250 | 1,249 | ~1,870 | Gastown | No | No | 3 | Domain |
| 25 | nudge-sync | 173 | 254 | 1,172 | ~1,760 | Gastown | No | No | 1 | Domain |
| 26 | polecat-worker | 212 | 266 | 1,253 | ~1,880 | Gastown | No | No | 3 | Domain |
| 27 | publish-pipeline | 153 | 58 | 212 | ~318 | Research Ops | Yes (1.0.0) | No | 0 | Keyword |
| 28 | refinery-merge | 182 | 273 | 1,251 | ~1,880 | Gastown | No | No | 2 | Domain |
| 29 | research-engine | 153 | 62 | 279 | ~419 | Research Ops | Yes (1.0.0) | No | 0 | Keyword |
| 30 | runtime-hal | 215 | 250 | 1,822 | ~2,730 | Gastown | No | No | 1 | Domain |
| 31 | sc-dev-team | 223 | 72 | 386 | ~579 | Team Orchestration | No | No | 0 | Keyword |
| 32 | security-hygiene | 186 | 34 | 327 | ~491 | Cross-Cutting | No | Yes | 0 | Context |
| 33 | session-awareness | 168 | 65 | 326 | ~489 | GSD Workflow | No | Yes | 0 | Context |
| 34 | skill-integration | 190 | 104 | 698 | ~1,047 | GSD Workflow | No | Yes | 3 | Context |
| 35 | sling-dispatch | 236 | 494 | 2,305 | ~3,460 | Gastown | No | No | 1 | Domain |
| 36 | test-generator | 98 | 46 | 183 | ~275 | Dev Practices | No | No | 0 | Keyword |
| 37 | typescript-patterns | 114 | 53 | 216 | ~324 | Dev Practices | No | No | 0 | Keyword |
| 38 | uc-lab | 247 | 81 | 423 | ~635 | Team Orchestration | No | No | 0 | Context |
| 39 | uc-observatory | 226 | 84 | 379 | ~569 | Team Orchestration | No | No | 0 | Context |
| 40 | witness-observer | 206 | 225 | 1,082 | ~1,620 | Gastown | No | No | 2 | Domain |

**Note:** `test-skill` (directory 41) is excluded -- it contains no SKILL.md.

### 1.3 Category Taxonomy

Skills fall into seven functional categories based on their purpose and activation patterns.

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
| gupp-propulsion | 1,961 | Execution enforcement, anti-passivity |

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

**Research Operations (6 skills) -- NEW**

| Skill | Words | Purpose |
|-------|-------|---------|
| research-engine | 279 | Autonomous topic-to-document pipeline |
| fleet-mission | 336 | Parallel agent dispatch and aggregation |
| publish-pipeline | 212 | Markdown to HTML/PDF build and FTP deploy |
| data-fidelity | 267 | Fact-checking and source verification |
| ecosystem-alignment | 280 | Upstream version and spec compliance audit |
| issue-triage-pr-review | 836 | Issue triage, bug fixes, adversarial PR review |

**Cross-Cutting (4 skills)**

| Skill | Words | Purpose |
|-------|-------|---------|
| security-hygiene | 327 | Self-modifying system security |
| context-handoff | 184 | Session continuity documents |
| decision-framework | 187 | Thinking frameworks for decisions |
| image-to-mission | 594 | Creative intent extraction from images |

### 1.4 Category Distribution

```
Gastown Chipset:      12 skills  (31%)   17,993 words  (56%)
GSD Workflow:          7 skills  (18%)    3,919 words  (12%)
Development Practices: 8 skills  (21%)    1,766 words   (6%)
Research Operations:   6 skills  (15%)    2,210 words   (7%)
Cross-Cutting:         4 skills  (10%)    1,292 words   (4%)
Team Orchestration:    3 skills   (8%)    1,188 words   (4%)
                      --------           ------
Total:                40 skills          28,368 words
```

The Gastown chipset still dominates at 56% of total word count, though the addition of the Research Operations category has diluted its proportional share from 69% to 56%. The Research Operations skills are notable for their efficiency: 6 skills at an average of 368 words each, compared to Gastown's average of 1,499 words. This reflects a design lesson learned -- the newer skills are leaner, delegating detail to runtime context rather than embedding it in the SKILL.md.

## 2. Description Length Analysis

Claude Code enforces a 250-character cap on skill descriptions. This is the string that appears in the skill index and drives activation decisions. Descriptions that exceed the cap may be truncated, reducing activation accuracy.

### 2.1 Over-Limit Descriptions (>250 chars)

| Skill | Chars | Over By |
|-------|-------|---------|
| uc-lab | 247 | -3 (borderline, within quoted format that may add chars) |

After the gupp-propulsion description was trimmed during this session (from 291 to 174 characters), no skill definitively exceeds the 250-character limit. The uc-lab description at 247 characters is the closest to the boundary. However, the uc-lab and sc-dev-team descriptions use YAML quoted format (double-quoted strings), which may interact with the parser differently than unquoted descriptions.

### 2.2 Near-Limit Descriptions (200-250 chars)

| Skill | Chars |
|-------|-------|
| sling-dispatch | 236 |
| uc-observatory | 226 |
| sc-dev-team | 223 |
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
| typescript-patterns | 114 |
| decision-framework | 114 |

These descriptions are terse. While brevity is generally good, some of these lack activation trigger keywords. For example, `code-review` says "Reviews code for bugs, style, and best practices" but does not mention "PR", "pull request", or "diff" -- common user phrases that should trigger this skill.

## 3. Trigger Analysis

### 3.1 Activation Mechanisms

Skills activate based on description keyword matching against user prompts and context. Three activation patterns exist:

1. **Keyword triggers** -- "Use when..." or "Activates when..." phrases in the description (25 skills)
2. **Context triggers** -- File paths, directories, or artifacts that signal relevance (8 skills)
3. **Domain triggers** -- Specific subsystem activation (7 skills, mostly Gastown)

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

**Moderate Overlap: research-engine vs fleet-mission**

Both describe parallel agent dispatch patterns. research-engine includes a pipeline that incorporates fleet dispatch as one of its stages. fleet-mission is the generalized version of that dispatch pattern. When a research task is requested, both could activate, providing overlapping context about how to launch parallel agents. The distinction (research-engine is the full pipeline, fleet-mission is the dispatch pattern alone) is clear to a human reader but may not be to the keyword matcher.

**Low Overlap: uc-lab vs sc-dev-team**

sc-dev-team explicitly describes itself as "adapted from uc-lab pattern." The two skills share architecture (same 4-agent team), same autonomy principles, same context management thresholds. The differences are branch target (dev vs v1.50), quality gates, and integration with the observatory. These could potentially be a single parameterized skill.

### 3.3 Missing Triggers

Several skills lack obvious trigger keywords in their descriptions:

- `decision-framework` -- does not mention "trade-off", "pros and cons", or "compare"
- `file-operation-patterns` -- does not mention "copy", "move", "delete", or "mkdir"
- `env-setup` -- does not mention "dotenv", "environment variable", or "API key"
- `security-hygiene` -- does not mention "security review", "vulnerability", or "audit"
- `data-fidelity` -- does not mention "accuracy", "verify", "validate" (uses "fact-checking" which is good, but misses related terms)
- `publish-pipeline` -- does not mention "deploy", "release", or "website" (uses "FTP sync" which is specific)

### 3.4 Gastown Cross-Activation

The 12 Gastown skills form a tightly coupled system where activating one often requires knowledge from several others. The `## Integration with Other Gastown Skills` tables that appear in each skill document this well, but it creates a loading dilemma: activating `polecat-worker` without `hook-persistence` and `beads-state` means the polecat skill lacks the state management context it references.

## 4. Token Cost Analysis

### 4.1 Methodology

Word count serves as a proxy for token cost. For English text, the typical ratio is ~1.3 tokens per word. For code-heavy technical content (which these skills contain), the ratio is closer to ~1.5 tokens per word due to identifiers, punctuation, and formatting.

### 4.2 Per-Category Token Budget

| Category | Skills | Words | Est. Tokens | % of Total |
|----------|--------|-------|-------------|------------|
| Gastown Chipset | 12 | 17,993 | ~27,000 | 63% |
| GSD Workflow | 7 | 3,919 | ~5,880 | 14% |
| Research Operations | 6 | 2,210 | ~3,315 | 8% |
| Development Practices | 8 | 1,766 | ~2,650 | 6% |
| Cross-Cutting | 4 | 1,292 | ~1,940 | 5% |
| Team Orchestration | 3 | 1,188 | ~1,780 | 4% |
| **Total** | **40** | **28,368** | **~42,550** | **100%** |

### 4.3 Per-Skill Token Ranking

**Heavy skills (>2,000 tokens estimated):**

| Skill | Words | Est. Tokens | Category |
|-------|-------|-------------|----------|
| sling-dispatch | 2,305 | ~3,460 | Gastown |
| done-retirement | 2,267 | ~3,400 | Gastown |
| gupp-propulsion | 1,961 | ~2,940 | Gastown |
| runtime-hal | 1,822 | ~2,730 | Gastown |
| hook-persistence | 1,461 | ~2,190 | Gastown |

**Medium skills (1,000-2,000 tokens):**

| Skill | Words | Est. Tokens | Category |
|-------|-------|-------------|----------|
| polecat-worker | 1,253 | ~1,880 | Gastown |
| refinery-merge | 1,251 | ~1,880 | Gastown |
| mayor-coordinator | 1,249 | ~1,870 | Gastown |
| gsd-explain | 1,214 | ~1,820 | GSD |
| nudge-sync | 1,172 | ~1,760 | Gastown |
| beads-state | 1,086 | ~1,630 | Gastown |
| mail-async | 1,084 | ~1,630 | Gastown |
| witness-observer | 1,082 | ~1,620 | Gastown |
| gsd-workflow | 1,072 | ~1,610 | GSD |
| skill-integration | 698 | ~1,047 | GSD |
| issue-triage-pr-review | 836 | ~1,254 | Research Ops |

**Light skills (<500 tokens estimated):**

| Skill | Words | Est. Tokens | Category |
|-------|-------|-------------|----------|
| file-operation-patterns | 137 | ~205 | Dev Practices |
| code-review | 158 | ~237 | Dev Practices |
| test-generator | 183 | ~275 | Dev Practices |
| context-handoff | 184 | ~276 | Cross-Cutting |
| decision-framework | 187 | ~280 | Cross-Cutting |
| gsd-preflight | 194 | ~291 | GSD |
| env-setup | 199 | ~299 | Dev Practices |
| gsd-onboard | 205 | ~308 | GSD |
| beautiful-commits | 208 | ~312 | Dev Practices |
| gsd-trace | 210 | ~315 | GSD |
| publish-pipeline | 212 | ~318 | Research Ops |
| typescript-patterns | 216 | ~324 | Dev Practices |
| api-design | 254 | ~381 | Dev Practices |
| data-fidelity | 267 | ~401 | Research Ops |
| research-engine | 279 | ~419 | Research Ops |
| ecosystem-alignment | 280 | ~420 | Research Ops |
| security-hygiene | 327 | ~491 | Cross-Cutting |
| fleet-mission | 336 | ~504 | Research Ops |
| session-awareness | 326 | ~489 | GSD |
| sc-dev-team | 386 | ~579 | Team |
| uc-observatory | 379 | ~569 | Team |
| git-commit | 411 | ~617 | Dev Practices |
| uc-lab | 423 | ~635 | Team |

### 4.4 Aggregate Budget Impact

Total across all 40 skills: **~42,550 tokens** (28,368 words x 1.5).

Additionally, 24 reference files exist across skill subdirectories. These are loaded on demand but represent additional token cost when activated. The Gastown skills share a `gastown-origin.md` reference pattern -- if a Gastown task loads multiple skills, that origin reference would ideally be loaded once and shared.

For a 200K context window, loading all skills would consume ~21% of context. This is well above the 2-5% budget guidance stated in skill-integration's loading protocol. Even a 1M context window would see ~4.3% consumed by full skill load.

### 4.5 Realistic Activation Scenarios

**Scenario: User writes code and commits**
- Skills loaded: typescript-patterns (216w), beautiful-commits (208w), git-commit (411w)
- Total: ~835 words, ~1,250 tokens
- Budget: 0.6% of 200K -- well within limits

**Scenario: Gastown multi-agent dispatch**
- Skills loaded: mayor-coordinator (1,249w), sling-dispatch (2,305w), polecat-worker (1,253w), hook-persistence (1,461w), beads-state (1,086w), gupp-propulsion (1,961w)
- Total: ~9,315 words, ~14,000 tokens
- Budget: 7% of 200K -- over the 5% ceiling

**Scenario: Full GSD phase execution**
- Skills loaded: gsd-workflow (1,072w), session-awareness (326w), skill-integration (698w)
- Total: ~2,096 words, ~3,144 tokens
- Budget: 1.6% of 200K -- comfortable

**Scenario: Research project launch (NEW)**
- Skills loaded: research-engine (279w), fleet-mission (336w), publish-pipeline (212w), data-fidelity (267w)
- Total: ~1,094 words, ~1,641 tokens
- Budget: 0.8% of 200K -- excellent efficiency

**Scenario: Issue triage and PR review (NEW)**
- Skills loaded: issue-triage-pr-review (836w), git-commit (411w), code-review (158w)
- Total: ~1,405 words, ~2,108 tokens
- Budget: 1.1% of 200K -- comfortable

The Gastown chipset is the only category that risks exceeding the token budget when multiple related skills co-activate. The new Research Operations skills demonstrate the benefit of lean design: an entire research pipeline (4 skills) loads in fewer tokens than a single Gastown dispatch skill.

## 5. agentskills.io Format Audit

### 5.1 The Skills API Surface

Analysis of the Claude Code binary (v2.1.88) reveals a structured Skills API accessible under the `skills-2025-10-02` beta flag. The API provides CRUD operations on skills:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/skills` | POST | Create a new skill |
| `/v1/skills` | GET (list) | List all skills |
| `/v1/skills/{id}` | GET | Retrieve a specific skill |
| `/v1/skills/{id}` | DELETE | Delete a skill |
| `/v1/skills/{id}/versions` | POST | Create a new version |
| `/v1/skills/{id}/versions` | GET (list) | List versions |
| `/v1/skills/{id}/versions/{vid}` | GET | Retrieve specific version |
| `/v1/skills/{id}/versions/{vid}` | DELETE | Delete specific version |

This is a full lifecycle API with versioned skill management. The version endpoints confirm that Anthropic considers skills to be versioned artifacts, not static files.

### 5.2 Spec Fields: Used vs Not Used

Based on the API surface, binary string analysis, and the local SKILL.md format, we can identify fields that the specification likely supports versus what we actually use.

| Field | Spec Status | Our Usage | Count Used | Notes |
|-------|-------------|-----------|------------|-------|
| `name` | Required | Universal | 40/40 | Matches directory name |
| `description` | Required | Universal | 40/40 | 250-char cap enforced |
| `version` | Supported (API has versioning) | Partial | 6/40 | Only new skills use it |
| `user-invocable` | Supported | Sparse | 5/40 | Controls UI surfacing |
| `domain` | Supported | Rare | 1/40 | Only image-to-mission |
| `context` | Supported | Rare | 1/40 | Only image-to-mission |
| `activation` | Supported | Rare | 1/40 | Only image-to-mission |
| `dependencies` | Supported | Rare | 1/40 | Only image-to-mission |
| `tags` | Likely supported | Not used | 0/40 | Would enable category filtering |
| `priority` | Likely supported | Not used | 0/40 | Would enable budget-aware loading |
| `context_cost` | Not confirmed | Not used | 0/40 | Would enable pre-load budget decisions |
| `triggers` | Not confirmed | Not used | 0/40 | Would separate activation from description |
| `conflicts` | Not confirmed | Not used | 0/40 | Would prevent co-activation |
| `requires` | Not confirmed | Not used | 0/40 | Hard dependencies |
| `format` | Implied by API versioning | Not used | 0/40 | Would enable migration |

### 5.3 Gap Assessment

**Critical gaps:**

1. **No `version` on 34 of 40 skills.** The API supports skill versioning (with a full CRUD version lifecycle), yet 85% of our skills have no version field. This means we cannot track when a skill was last updated, detect stale content, or coordinate migrations.

2. **No `format` field on any skill.** The `skills-2025-10-02` beta flag in the API strongly suggests the format has a version date. If the spec evolves to `skills-2026-XX-XX`, we will have no way to identify which skills need migration without reading and manually inspecting all 40.

3. **No `triggers` field.** The description field serves double duty: explaining the skill to humans AND providing activation keywords to the loader. These are different audiences. A dedicated `triggers` field would allow the description to be human-readable while triggers are machine-optimized.

**Moderate gaps:**

4. **`user-invocable` inconsistency.** Only 5 of 40 skills declare this field. Several skills that feel user-invocable (gsd-explain, gsd-onboard, gsd-trace, context-handoff, ecosystem-alignment) do not declare it. Without consistent use, the field provides no reliable signal.

5. **`domain` underuse.** Only image-to-mission uses this field. If the loader supports domain-based filtering (only load skills matching the current domain context), we are missing an optimization opportunity.

6. **`dependencies` underuse.** Only image-to-mission declares dependencies. The Gastown chipset has extensive implicit dependencies documented in "Integration with Other Gastown Skills" tables, but none of these are machine-readable.

### 5.4 The `image-to-mission` Anomaly

The `image-to-mission` skill uses more frontmatter fields than any other skill: `name`, `description`, `domain`, `context`, `activation`, `dependencies`. It appears to have been authored against a fuller understanding of the spec than the other 39 skills. Examining its frontmatter as a reference implementation:

```yaml
---
name: image-to-mission
description: Extract creative intent from images into executable build specs...
domain: creative
context:
  - file_patterns: ["*.png", "*.jpg", "*.svg", "*.webp"]
  - project_types: ["web", "desktop", "creative"]
activation:
  keywords: ["image", "i2m", "visual", "screenshot", "mockup"]
  contexts: ["when user shares an image with build intent"]
dependencies:
  optional: ["publish-pipeline"]
---
```

This skill demonstrates what a fully-specified skill frontmatter looks like. If all 40 skills were specified to this level, the loader would have much richer signals for activation decisions, conflict detection, and budget management.

## 6. New Skill Assessment

### 6.1 The Six New Skills

During this research session, 6 skills were created to codify patterns discovered through empirical use. These skills form the Research Operations category. Here is a critical assessment of each.

**research-engine (279 words, v1.0.0)**

*Codifies:* The 6-stage research pipeline (decompose, parallel research, aggregate, structure, build, publish) proven across HEL (28 docs, 91K words) and OOPS (9 docs, 20K words).

*Strengths:* Clear pipeline stages. Quality standards are explicit (1,500 word minimum, evidence for claims, three output formats). Project code system is documented.

*Weaknesses:* Overlaps with fleet-mission on the parallel dispatch stage. Does not specify how to handle research that produces fewer than 4 tracks (the minimum in "4-12 investigation tracks" may be too high for focused research). No failure recovery guidance.

*Token cost:* 419 tokens. Lean and efficient.

**fleet-mission (336 words, v1.0.0)**

*Codifies:* Parallel agent dispatch proven at 3-7 agent scale across HEL expansion, OOPS fleet, and HEL refinement runs.

*Strengths:* Fleet sizing table is actionable. Rules section captures hard-won lessons (5-6 agent max, complete briefs, worktree isolation). Proven scale section provides confidence calibration.

*Weaknesses:* Overlaps with mayor-coordinator on coordination and sling-dispatch on dispatch mechanics. The distinction (fleet-mission is for research/document fleets; Gastown is for codebase work) is implicit, not explicit. A user asking to "dispatch agents" could trigger either system.

*Token cost:* 504 tokens. Good value for the specificity it provides.

**publish-pipeline (212 words, v1.0.0)**

*Codifies:* The pandoc + xelatex build chain and FTP sync to tibsfox.com, proven on 29 HEL documents.

*Strengths:* Critical FTP path mapping documented ("web server maps /Research/X/ to FTP root /X/"). Prerequisites are explicit. Build command is copy-pasteable.

*Weaknesses:* Highly specific to one deployment target (tibsfox.com). If the project ever deploys elsewhere, this skill would need significant revision. The template setup section assumes templates already exist -- no guidance for creating them from scratch.

*Token cost:* 318 tokens. Minimal impact.

**data-fidelity (267 words, v1.0.0)**

*Codifies:* The fact-checking and data refresh workflow proven during HEL data fidelity passes.

*Strengths:* Severity categories (ERROR, QUESTIONABLE, INCONSISTENCY) provide clear triage criteria. Quality standards are specific (statute numbers, current company names, no "recently"). The rebuild step acknowledges downstream artifacts.

*Weaknesses:* Phase structure assumes 24+ documents (agent splitting by "docs 01-12, 13-24"). Smaller projects would need different splits. No guidance on what to do when a fact cannot be verified.

*Token cost:* 401 tokens. Efficient.

**ecosystem-alignment (280 words, v1.0.0)**

*Codifies:* The upstream version checking and spec compliance audit performed at the start of this research session.

*Strengths:* Actionable checklist with shell commands. Binary string analysis technique is documented. Feature gap analysis structure (using vs not using vs extending beyond) is clear.

*Weaknesses:* The `strings $(which claude)` technique is fragile -- it depends on the binary being unstripped and the installation path being in PATH. The checklist assumes CJS syntax issues (specific to a point-in-time concern). No guidance on what to do when a breaking spec change is detected.

*Token cost:* 420 tokens. Appropriate for a checklist skill.

**issue-triage-pr-review (836 words, v1.0.0)**

*Codifies:* The full issue triage, bug fix, and adversarial PR review workflow.

*Strengths:* By far the most comprehensive new skill. Spam detection with confidence scoring. Prompt injection guards. Test-first bug workflow. Duplicate handling with smoke tests. PR conflict resolution. Communication policy (no hedging language). The `user-invocable: true` field is correctly set.

*Weaknesses:* At 836 words, it is the heaviest Research Operations skill -- 2.4x the category average. The 10-parallel-agent spawn for issue triage could overwhelm smaller projects. No priority ordering (all issues processed equally). The adversarial review section could be a separate skill to allow independent activation.

*Token cost:* 1,254 tokens. Highest in the Research Ops category but justified by the workflow complexity.

### 6.2 Collective Assessment

The 6 new skills share several positive design patterns:

1. **Version field present.** All 6 declare `version: 1.0.0`. This is the right starting point.
2. **Lean design.** Average 368 words, compared to Gastown's 1,499 average. Detail lives in runtime context, not SKILL.md.
3. **Empirical grounding.** Every skill cites specific production use (HEL, OOPS, scale numbers). No speculative features.
4. **Clear activation.** All use "Activates when..." or "Use when..." phrasing in their descriptions.

Design concerns:

1. **No `triggers`, `domain`, or `dependencies` fields.** The image-to-mission skill demonstrated these work. The new skills should use them.
2. **No `conflicts` awareness.** research-engine and fleet-mission have overlap that should be declared.
3. **Specificity risk.** publish-pipeline and data-fidelity encode patterns specific to the HEL/OOPS research workflow. They will need generalization before they serve other project types.

## 7. Merge/Split Recommendations with Before/After Examples

### 7.1 Merge: beautiful-commits + git-commit --> commit-style

**Before:** Two skills with ~80% identical content.

```
beautiful-commits/SKILL.md (51 lines, 208 words)
  Sections: Format, Types Table, Anti-patterns, Message Structure

git-commit/SKILL.md (106 lines, 411 words)
  Sections: Format, Types Table, Angular Convention, Examples, Scope Rules, Anti-patterns
```

**After:** One skill with deduplicated content.

```
commit-style/SKILL.md (~70 lines, ~300 words)
  Sections: Format, Types Table, Scope Rules, Examples, Anti-patterns
  (Removes: duplicate format rules, duplicate types table, "Angular Convention"
   that duplicates the format section)
```

**Savings:** ~319 words (~479 tokens). Eliminates activation conflict on "commit".

### 7.2 Merge: uc-lab + sc-dev-team --> team-control

**Before:** Two skills with 90% shared structure.

```
uc-lab/SKILL.md (81 lines, 423 words)
  Sections: Agents, Autonomy, Context, Quality Rubric, Pipeline
  Branch: v1.50

sc-dev-team/SKILL.md (72 lines, 386 words)
  Sections: Agents, Autonomy, Context, Integration, Pipeline
  Branch: dev
```

**After:** One parameterized skill.

```
team-control/SKILL.md (~100 lines, ~500 words)
  Sections: Agents, Autonomy, Context, Pipeline
  Subsections: UC Mode (branch=v1.50, quality rubric, observatory integration)
               Dev Mode (branch=dev, integration with main)
```

**Savings:** ~309 words (~464 tokens). Prevents divergence.

### 7.3 Merge: gsd-onboard + gsd-explain --> gsd-guide

**Before:**

```
gsd-onboard/SKILL.md (52 lines, 205 words) -- compact command reference
gsd-explain/SKILL.md (274 lines, 1,214 words) -- detailed explainer
```

**After:**

```
gsd-guide/SKILL.md (~280 lines, ~1,100 words)
  Section 1: Quick Reference (from gsd-onboard, ~50 lines)
  Section 2: Detailed Explanations (from gsd-explain, ~230 lines)
  (Removes: duplicated command lists, overlapping "what does this do" content)
```

**Savings:** ~319 words (~479 tokens). Eliminates activation confusion.

### 7.4 Split: sling-dispatch

**Before:**

```
sling-dispatch/SKILL.md (494 lines, 2,305 words)
  Contains: Pipeline overview, 7-stage descriptions, full TypeScript implementations,
  error handling code, batch mode code, formula expansion code
```

**After:**

```
sling-dispatch/SKILL.md (~120 lines, ~600 words)
  Contains: Pipeline overview, 7-stage descriptions (prose only),
  integration table, activation context

sling-dispatch/references/pipeline-implementation.md (~374 lines, ~1,705 words)
  Contains: Full TypeScript implementations, error handling code,
  batch mode code, formula expansion code
```

**Savings from default load:** ~1,705 words (~2,558 tokens). Reference loaded on demand.

### 7.5 Split: done-retirement

**Before:**

```
done-retirement/SKILL.md (377 lines, 2,267 words)
  Contains: Pipeline overview, 7-stage descriptions, full TypeScript implementations,
  irreversibility guarantees, cleanup sequences
```

**After:**

```
done-retirement/SKILL.md (~100 lines, ~550 words)
  Contains: Pipeline overview, 7-stage descriptions (prose only),
  irreversibility rules, integration table

done-retirement/references/retirement-implementation.md (~277 lines, ~1,717 words)
  Contains: Full TypeScript implementations, cleanup sequences
```

**Savings from default load:** ~1,717 words (~2,576 tokens).

### 7.6 Split: gupp-propulsion

**Before:**

```
gupp-propulsion/SKILL.md (263 lines, 1,961 words)
  Contains: Core GUPP principle, per-runtime strategies, observable metrics,
  learning feedback loop, safety boundaries, enforcement rules
```

**After:**

```
gupp-propulsion/SKILL.md (~80 lines, ~500 words)
  Contains: Core GUPP principle, enforcement rules, safety boundaries

gupp-propulsion/references/runtime-strategies.md (~100 lines, ~700 words)
  Contains: Per-runtime strategy details (Claude Code, Codex, Gemini, Cursor)

gupp-propulsion/references/metrics-and-learning.md (~83 lines, ~761 words)
  Contains: Observable metrics, learning feedback loop
```

**Savings from default load:** ~1,461 words (~2,192 tokens).

### 7.7 Projected Savings Summary

| Change | Type | Token Savings (default load) |
|--------|------|----------------------------|
| beautiful-commits + git-commit merge | Merge | ~479 |
| uc-lab + sc-dev-team merge | Merge | ~464 |
| gsd-onboard + gsd-explain merge | Merge | ~479 |
| sling-dispatch split | Split | ~2,558 |
| done-retirement split | Split | ~2,576 |
| gupp-propulsion split | Split | ~2,192 |
| **Total** | | **~8,748 tokens** |

That is a 21% reduction in default-load token cost. The splits alone account for 84% of the savings.

## 8. Skill Lifecycle Proposal

### 8.1 Current State

No skill declares a version (except the 6 new ones). No mechanism exists to track when a skill was last modified, what format version it targets, or whether it needs migration when the skill system evolves. Skills are created and then edited ad hoc with no formal lifecycle.

### 8.2 Proposed Lifecycle Stages

```
DRAFT --> ACTIVE --> DEPRECATED --> RETIRED --> ARCHIVED
```

**DRAFT.** Skill is under development. Not loaded by the activation system. Indicated by a `status: draft` frontmatter field or by placing the skill in a `skills-draft/` subdirectory.

**ACTIVE.** Skill is in production. Loaded by the activation system based on triggers and budget. This is the current implicit state of all existing skills.

**DEPRECATED.** Skill still loads but emits a warning when activated. The deprecation notice includes a migration path (which skill replaces it, what changes are needed). Useful for gradual transitions when merging skills. Indicated by `status: deprecated` and `deprecated-by: replacement-skill-name`.

**RETIRED.** Skill no longer loads. SKILL.md remains in the directory for historical reference but the loader skips it. Indicated by `status: retired` and `retired-date: YYYY-MM-DD`.

**ARCHIVED.** Skill directory is moved to `.claude/skills-archive/`. Complete removal from the active tree. Only done after retirement has been stable for 30+ days.

### 8.3 Proposed Versioning Scheme

```yaml
---
name: example-skill
description: ...
format: 2025-10-02      # skill-format date from Claude Code
version: 1.2.0           # semver for this skill's content
status: active           # lifecycle stage
updated: 2026-03-31      # last modification date
---
```

Four version-related fields serve different purposes:
- **format** -- Which skill format specification this SKILL.md targets. Enables automated migration when Claude Code updates the format.
- **version** -- Semantic version of the skill content. Major = breaking activation change, minor = content addition, patch = fix/clarification.
- **status** -- Lifecycle stage. Controls loader behavior.
- **updated** -- Simple date for staleness detection. Skills not updated in 90+ days could be flagged for review.

### 8.4 Version Bump Rules

| Change | Version Impact | Example |
|--------|---------------|---------|
| Fix typo in content | Patch (1.0.0 -> 1.0.1) | Correct a command example |
| Add new section | Minor (1.0.0 -> 1.1.0) | Add "Edge Cases" section |
| Change activation triggers | Minor (1.0.0 -> 1.1.0) | Add keywords to description |
| Restructure content | Minor (1.0.0 -> 1.1.0) | Move sections, reorder |
| Change skill purpose/scope | Major (1.0.0 -> 2.0.0) | Expand from "commits" to "all git ops" |
| Merge with another skill | Major (new skill starts at 1.0.0) | beautiful-commits + git-commit |

### 8.5 Staleness Detection

A periodic check (run during `/sc:digest` or session start) compares `updated` dates against the current date. Skills with `updated` older than 90 days are flagged as "stale" in the digest output. The maintainer then decides: update the skill, confirm it is still current (bump `updated` only), or deprecate it.

### 8.6 Migration Path

Adding version fields is backward-compatible. Skills without version fields would be treated as `format: 2025-10-02, version: 1.0.0, status: active, updated: unknown`. A one-time migration script could set `updated` from git blame timestamps:

```bash
for d in .claude/skills/*/; do
  if [ -f "$d/SKILL.md" ]; then
    last_mod=$(git log -1 --format='%ai' -- "$d/SKILL.md" 2>/dev/null | cut -d' ' -f1)
    echo "$d -> $last_mod"
  fi
done
```

## 9. Frontmatter Format Analysis

### 9.1 Fields Currently Used

Across all 40 skills, the following frontmatter fields appear:

| Field | Count | Usage |
|-------|-------|-------|
| `name` | 40/40 | Universal |
| `description` | 40/40 | Universal |
| `version` | 6/40 | New skills only (1.0.0) |
| `user-invocable` | 5/40 | gsd-workflow, security-hygiene, session-awareness, skill-integration, issue-triage-pr-review |
| `domain` | 1/40 | image-to-mission only |
| `context` | 1/40 | image-to-mission only |
| `activation` | 1/40 | image-to-mission only |
| `dependencies` | 1/40 | image-to-mission only |

### 9.2 The `user-invocable` Field

Only 5 of 40 skills declare `user-invocable: true`. This field likely controls whether the skill appears in user-facing command suggestions. The remaining 35 skills are presumably auto-activating only. However, several skills that feel user-invocable (like gsd-explain, gsd-onboard, gsd-trace, context-handoff) do not declare this field. This may be an inconsistency or a deliberate design choice.

### 9.3 Reference File Distribution

| Ref Count | Skills | Examples |
|-----------|--------|---------|
| 0 refs | 24 skills | All Dev Practices, all Research Ops, most Cross-Cutting |
| 1 ref | 7 skills | beads-state, done-retirement, runtime-hal, sling-dispatch |
| 2 refs | 4 skills | gupp-propulsion, refinery-merge, witness-observer |
| 3 refs | 5 skills | gsd-workflow, mayor-coordinator, polecat-worker, skill-integration |

Skills with 0 reference files are self-contained. Skills with 3 reference files are the most modular, with detail factored out of the main SKILL.md. The 5 Gastown skills with 0 refs (beads-state, hook-persistence, mail-async, nudge-sync, and the origin references) could benefit from the same factoring pattern used by their heavier siblings.

## 10. Recommendations

### 10.1 Immediate Actions (No Risk)

1. **Merge beautiful-commits and git-commit** into a single `commit-style` skill. Remove duplicated content. Estimated savings: ~479 tokens, elimination of activation conflict.

2. **Add missing trigger keywords** to compact descriptions (code-review, env-setup, decision-framework, file-operation-patterns, data-fidelity, publish-pipeline). Improves activation accuracy at zero cost.

3. **Remove or complete test-skill** directory. Either add a proper SKILL.md or delete the directory.

4. **Add `version: 1.0.0` and `format: 2025-10-02`** to all 34 skills that lack version fields. A one-time migration with no behavioral change.

### 10.2 High-Value Refactors

5. **Split the three heaviest Gastown skills** (sling-dispatch, done-retirement, gupp-propulsion) into lean SKILL.md files plus reference subdirectories. Move TypeScript implementations and detailed protocol descriptions into references. Target: each SKILL.md under 800 words. Estimated savings: ~7,326 tokens from the default load path.

6. **Add `triggers` frontmatter** as explicit activation patterns separate from descriptions. This allows the description to focus on explaining the skill to humans while triggers focus on matching user intent for the loader.

7. **Consolidate gastown-origin.md references** into a shared chipset-level document. Each skill references the shared file plus its specific mapping.

8. **Add `domain`, `activation`, and `dependencies` fields** to all skills, following the image-to-mission pattern. This gives the loader richer signals for activation decisions.

### 10.3 Structural Improvements

9. **Introduce a `conflicts` frontmatter field** to prevent known-overlapping skills from co-activating. This is cheaper than merging skills and preserves modularity.

10. **Introduce a `context_cost` frontmatter field** declaring approximate token cost. The skill-integration loader can then make budget decisions from frontmatter alone without reading full content.

11. **Merge uc-lab and sc-dev-team** into a parameterized team-control skill with mode switching. Reduces maintenance burden and prevents divergence.

12. **Merge gsd-onboard and gsd-explain** into a unified gsd-guide skill with quick-reference and detailed sections.

13. **Create a skill registry** -- a single index file listing all skills with their category, token cost, activation patterns, and conflicts. This serves as both documentation and a machine-readable manifest for the loader.

14. **Implement the lifecycle system** (draft/active/deprecated/retired/archived) with status field and staleness detection.

### 10.4 Projected Impact

If all recommendations were implemented:

| Metric | Current | Projected |
|--------|---------|-----------|
| Skill count | 40 | 37 (3 merges) |
| Total words in SKILL.md files | 28,368 | ~19,000 |
| Total estimated tokens (default load) | ~42,550 | ~28,500 |
| Gastown scenario budget (200K) | 7% | ~3.5% |
| Over-limit descriptions | 0 | 0 |
| Activation conflicts | 4 pairs | 0 |
| Skills with version tracking | 6 | 37 |
| Skills with lifecycle status | 0 | 37 |
| Skills with explicit triggers | 0 | 37 |

The most impactful single change is splitting the three heaviest Gastown skills into SKILL.md + references. This alone saves ~7,326 tokens from the default activation path while keeping all content accessible when needed.

## 11. The Format Evolution Question

Claude Code's binary references `skills-2025-10-02` as a format date and `agentskills.io` as a domain. This suggests the skill format is versioned and may evolve. Our current skills use a minimal frontmatter schema (name + description + optional fields). If the format specification adds new required fields or changes activation semantics, we need a migration path.

The binary analysis reveals a full CRUD API for skills with versioned endpoints:

```
POST   /v1/skills                  -- create
GET    /v1/skills                  -- list
GET    /v1/skills/{id}             -- retrieve
DELETE /v1/skills/{id}             -- delete
POST   /v1/skills/{id}/versions    -- create version
GET    /v1/skills/{id}/versions    -- list versions
GET    /v1/skills/{id}/versions/{vid} -- retrieve version
DELETE /v1/skills/{id}/versions/{vid} -- delete version
```

This API is gated behind the `skills-2025-10-02` beta header. The existence of version CRUD endpoints means the platform anticipates skills evolving over time, with multiple versions coexisting. This aligns with our lifecycle proposal (Section 8) and validates the decision to add version fields now.

The recommended approach: add `format: 2025-10-02` to all skills now. When a new format version appears, a script can identify skills needing migration by comparing their declared format to the current specification. Skills without a format declaration are assumed to be on the oldest known format.

The agentskills.io reference hints at a community skill ecosystem. If skills become publishable and shareable (similar to npm packages), our skills would need additional metadata: author, license, compatibility ranges, and dependency resolution. The `dependencies` field used by image-to-mission is a prototype of this pattern. Building the registry (Recommendation 13) positions us to adopt community sharing if the ecosystem materializes.

The fact that the API already supports skill versioning means the platform is ahead of where most users are. Our 40-skill inventory, with 6 already versioned and a lifecycle proposal ready, puts us at the leading edge of skill system maturity. The gap between where we are and where the platform is heading is smaller than it appears -- we need to add fields and metadata, not redesign the system.

---

*Research conducted 2026-03-31. Data sourced from direct reading of all 40 SKILL.md files and 24 reference files across .claude/skills/. Word counts measured with wc, character counts measured on extracted description fields. Binary analysis performed on Claude Code v2.1.88 installed at $(which claude). Skills API surface identified through string extraction of the compiled binary.*
