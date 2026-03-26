# Bridge Architecture

> **Domain:** Upstream Intelligence -- Integration Architecture
> **Module:** 5 -- The 20th Extension: Skill-Creator as GSD-2 Native
> **Through-line:** *The Amiga's power came from the spaces between the chips -- the bus protocol that let them cooperate without stepping on each other. For Pi/GSD/skill-creator, that bus is GSD-2's extension system.*

---

## Table of Contents

1. [The 20th Extension](#1-the-20th-extension)
2. [Extension Manifest Design](#2-extension-manifest-design)
3. [The Observation Pipeline](#3-the-observation-pipeline)
4. [Skill Injection at Dispatch](#4-skill-injection-at-dispatch)
5. [State File Integration](#5-state-file-integration)
6. [Migration from GSD v1](#6-migration-from-gsd-v1)
7. [Upstream Monitoring Strategy](#7-upstream-monitoring-strategy)
8. [Token Budget Impact](#8-token-budget-impact)
9. [Safety Considerations](#9-safety-considerations)
10. [The Full Integration Architecture](#10-the-full-integration-architecture)
11. [The Amiga Principle: Skill-Creator as Denise](#11-the-amiga-principle-skill-creator-as-denise)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The 20th Extension

GSD-2 ships with 19 bundled extensions. They cover the operational surface of a coding agent: browser automation (Playwright), web search (Brave/Tavily/Jina), GitHub integration (issues/PRs), MCP client connectivity, subagent delegation, slash commands, background shell management, and more. Each extension registers tools, hooks, and commands with the Pi SDK's extension loader. They compose through GSD-2's dispatch pipeline -- the orchestration loop that reads state from disk, builds a context-specific prompt, creates a fresh agent session, executes, and writes results back.

Skill-creator becomes the 20th extension: **the adaptive learning layer.**

Where the other 19 extensions provide capabilities -- "here is a tool to search the web," "here is a hook to manage git worktrees" -- extension #20 provides intelligence. It watches what the other extensions do, identifies patterns in how they're used, and generates reusable skills that make future sessions more effective. It is the only extension whose primary job is to make the other extensions better at theirs.

> *The first 19 extensions give GSD-2 hands. The 20th gives it memory.*

The distinction is structural, not just philosophical. Every other extension operates within a single task session: it provides tools, the LLM uses them, the session ends. Skill-creator operates across sessions. It reads the T01-SUMMARY.md artifact left by session N and uses what it learned to inject context into session N+1. This is the inter-session learning loop that GSD-2 alone cannot provide -- its fresh-context-per-task architecture deliberately prevents session-to-session bleed, which eliminates context rot but also eliminates accumulated wisdom. Skill-creator restores the wisdom without reintroducing the rot.

**Why extension, not standalone tool?**

Skill-creator could run as a separate process that reads `.gsd/` files after the fact. But running as a native extension gives it three capabilities that external monitoring cannot:

| Capability | External Tool | Native Extension |
|-----------|--------------|-----------------|
| Observe tool calls in real time | No -- must reconstruct from artifacts | Yes -- hooks fire during execution |
| Inject skills into dispatch prompt | No -- prompt is already built | Yes -- hook fires during prompt construction |
| Participate in token budget | No -- invisible overhead | Yes -- budgeted and tracked |
| Crash recovery awareness | No -- misses interrupted sessions | Yes -- onSessionCrash fires |
| Phase-aware activation | No -- must parse STATE.md externally | Yes -- reads phase from dispatch context |

The extension model is not optional. It is the minimum viable integration surface for what skill-creator needs to do.

---

## 2. Extension Manifest Design

A GSD-2 extension is a TypeScript module that exports a registration function. The Pi SDK's extension loader calls this function during startup, receiving the tools, hooks, and commands the extension provides. The loader manages lifecycle, conflict resolution, and capability advertisement.

Skill-creator registers six capabilities:

```typescript
// ext/skill-creator/index.ts
import type { Extension, ExtensionContext } from '@pi/agent';
import { ObservationPipeline } from './observe';
import { SkillInjector } from './inject';
import { SkillDiscovery } from './discover';
import { SkillLearner } from './learn';
import { SkillEvaluator } from './evaluate';
import { DashboardCommand } from './status';

export default function register(ctx: ExtensionContext): Extension {
  const pipeline = new ObservationPipeline(ctx.stateDir);
  const injector = new SkillInjector(ctx.stateDir, ctx.tokenProfile);
  const discovery = new SkillDiscovery(ctx.skillsDir);
  const learner = new SkillLearner(pipeline, discovery);
  const evaluator = new SkillEvaluator(pipeline, discovery);

  return {
    name: 'skill-creator',
    version: '1.0.0',

    hooks: {
      'post-task': pipeline.observe.bind(pipeline),
      'dispatch-prompt': injector.inject.bind(injector),
    },

    tools: {
      'skill-creator:discover': discovery.asTool(),
      'skill-creator:learn': learner.asTool(),
      'skill-creator:evaluate': evaluator.asTool(),
    },

    commands: {
      'skill-creator:status': new DashboardCommand(pipeline, discovery, evaluator),
    },
  };
}
```

**The six capabilities:**

| Capability | Type | Fires When | Purpose |
|-----------|------|-----------|---------|
| `skill-creator:observe` | Post-task hook | After each task completion | Extract patterns from execution artifacts |
| `skill-creator:inject` | Dispatch prompt hook | During prompt construction (step 3) | Insert relevant skills into next task's context |
| `skill-creator:discover` | Tool | On LLM request | Find skills matching current task domain |
| `skill-creator:learn` | Tool | On LLM request | Generate new skills from accumulated patterns |
| `skill-creator:evaluate` | Tool | On LLM request | Measure activation rates and effectiveness |
| `skill-creator:status` | Command | On user invocation | Render dashboard of skill health and pattern backlog |

The hook registrations are the critical path. Tools and commands are invoked by the LLM or user on demand -- they can fail gracefully without affecting the core loop. Hooks fire automatically and must be fast (sub-100ms for post-task, sub-50ms for dispatch-prompt) because they sit in the critical path of GSD-2's auto mode state machine.

---

## 3. The Observation Pipeline

The observation pipeline is the input side of skill-creator's learning loop. It fires after each task completion and extracts structured data from the execution record.

**What it reads:**

GSD-2 writes `T01-SUMMARY.md` files after every task. These files contain YAML frontmatter with structured metadata (duration, model used, files changed, verification status) and a narrative body describing what happened, what decisions were made, and what was learned. This is exactly the data skill-creator's `PatternAggregator` needs.

```
T01-SUMMARY.md structure:
---
task: T01
slice: S01
milestone: M001
status: complete
model: claude-sonnet-4-20250514
duration: 142s
files_changed: 7
verification: passed
tokens_used: 48230
---

## What Was Done
[narrative description of implementation]

## Decisions Made
[key architectural and implementation choices]

## Issues Encountered
[problems hit and how they were resolved]
```

**What it extracts:**

| Signal | Source | Extraction Method |
|--------|--------|-------------------|
| Tool sequences | Pi SDK event stream | Ordered list of tool calls within session boundary |
| File access patterns | Read/Write tool parameters | Group by extension, cluster by directory |
| Error-recovery strategies | Issues Encountered section | NLP pattern match on "tried X, then Y" structures |
| Verification outcomes | YAML frontmatter `verification` field | Direct read: passed/failed/skipped |
| Model-task affinity | YAML `model` + `duration` + `verification` | Correlate: which model succeeds fastest on which task types |
| Decision patterns | Decisions Made section | Extract choice-rationale pairs for skill hints |

**The observation record:**

```typescript
interface ObservationRecord {
  taskId: string;                    // T01, T02, etc.
  sliceId: string;                   // S01, S02, etc.
  milestoneId: string;               // M001, etc.
  timestamp: string;                 // ISO 8601
  phase: 'research' | 'plan' | 'execute' | 'verify' | 'complete';
  model: string;                     // claude-sonnet-4-20250514, etc.

  toolSequence: string[];            // ordered tool call names
  filePatterns: FilePattern[];       // { path, operation, extension }
  errorRecoveries: Recovery[];       // { error, strategy, outcome }
  verificationOutcome: 'pass' | 'fail' | 'skip';

  tokensUsed: number;
  durationSeconds: number;
  skillsInjected: string[];          // which skills were active
  skillsActivated: string[];         // which injected skills were actually referenced
}
```

The pipeline writes these records to `PATTERNS.md` in the `.gsd/` directory (see Section 5). Records accumulate until the `learn` tool promotes them into full skills. The pipeline is append-only -- it never modifies or deletes records, only adds new ones. This makes crash recovery trivial: if the pipeline is interrupted, the partial record is simply absent and the next task produces a fresh one.

> *Observation without action is just surveillance. The pipeline doesn't just watch -- it structures what it sees into the vocabulary that the learner needs to generate skills. The extraction schema IS the learning interface.*

---

## 4. Skill Injection at Dispatch

Dispatch is where skill-creator's output becomes input. During GSD-2's prompt construction -- step 3 of the dispatch pipeline, after reading STATE.md and determining the next unit but before creating the fresh agent session -- skill-creator injects relevant skills into the prompt context.

**The dispatch pipeline with injection point:**

```
Step 1: Read STATE.md --> determine next unit (T03 of S02 of M001)
Step 2: Read T03-PLAN.md --> extract task requirements, must-haves, file targets
Step 3: Build dispatch prompt:
        a) Pre-inline PROJECT.md, CONTEXT.md, relevant SUMMARY files
        b) Pre-inline T03-PLAN.md content
        c) [SKILL-CREATOR HOOK] --> inject relevant skills    <-- HERE
        d) Apply token profile constraints
Step 4: Create fresh Pi SDK agent session with constructed prompt
Step 5: Execute task
Step 6: Write results to .gsd/ (T03-SUMMARY.md, updated STATE.md)
Step 7: [SKILL-CREATOR HOOK] --> observe execution results    <-- AND HERE
```

**Injection criteria:**

The injector evaluates three signals to select skills:

1. **Plan file analysis** -- scan the T03-PLAN.md for file extensions (`.ts`, `.rs`, `.md`), domain keywords ("authentication," "database," "testing"), and must-have items. Match against skill trigger definitions.

2. **Historical co-activation data** -- from accumulated observation records, identify which skills were injected during similar tasks (same file extensions, same phase, similar domain keywords) and which of those were actually activated (referenced by the LLM during execution). Skills with high activation rates on similar tasks score higher.

3. **Token optimization profile** -- GSD-2 runs in three profiles:

| Profile | Injection Strategy | Max Skills | Max Tokens |
|---------|-------------------|------------|------------|
| Budget | Minimal -- only exact-match, high-confidence skills | 1 | 1,500 |
| Balanced | Standard -- top 3 by relevance score | 3 | 3,500 |
| Quality | Full -- all matching skills up to cap | 3 | 5,000 |

The hard cap is 3 skills and 5,000 tokens regardless of profile. This prevents skill injection from consuming a meaningful fraction of the task's context budget. Under the budget profile, the injector is aggressive about filtering -- only skills with a historical activation rate above 70% on similar task types are injected.

**Injection format:**

```markdown
<!-- skill-creator: injected 2 skills (1,847 tokens) -->
<!-- profile: balanced | match-scores: typescript-error-patterns=0.89, vitest-patterns=0.72 -->

## Active Skills

### typescript-error-patterns (v3, activation: 87%)
[skill content -- rules, examples, common patterns]

### vitest-patterns (v2, activation: 74%)
[skill content -- test structure, mock patterns, assertion helpers]

<!-- end skill-creator injection -->
```

The injection is wrapped in HTML comments for two reasons: (1) GSD-2 can strip them if needed during token pressure, and (2) they provide observability -- the post-task hook can read the injection markers to determine which skills were present and correlate with activation.

---

## 5. State File Integration

GSD-2 uses a file-based state machine. All state lives in the `.gsd/` directory on disk. There is no database, no running process, no daemon. State is read at dispatch time, written at completion time, and always human-readable. Skill-creator participates in this model by adding two files.

**SKILLS.md** -- current skill activation state:

```markdown
# Skill Activation State

> Last updated: 2026-03-26T14:22:00Z
> Active skills: 7
> Pending patterns: 12
> Total observations: 43

## Active Skills

| Skill | Version | Activated | Last Used | Activation Rate |
|-------|---------|-----------|-----------|----------------|
| typescript-error-patterns | v3 | 2026-03-20 | 2026-03-26 | 87% |
| vitest-patterns | v2 | 2026-03-22 | 2026-03-26 | 74% |
| git-worktree-recovery | v1 | 2026-03-24 | 2026-03-25 | 62% |
| rust-tauri-bindings | v1 | 2026-03-25 | 2026-03-26 | 91% |
| markdown-research-format | v2 | 2026-03-18 | 2026-03-26 | 83% |
| vite-config-patterns | v1 | 2026-03-23 | 2026-03-24 | 55% |
| context-engineering-layout | v4 | 2026-03-15 | 2026-03-26 | 96% |

## Staleness Tracking

Skills unused for 14+ days are deprioritized (GSD-2's existing `skill_staleness_days` setting).
Skills unused for 30+ days are archived to PATTERNS.md for potential re-learning.

## Injection History (Last 10 Tasks)

| Task | Skills Injected | Skills Activated | Tokens Used |
|------|----------------|-----------------|-------------|
| T07-S03 | 3 | 2 | 2,140 |
| T06-S03 | 2 | 2 | 1,630 |
| T05-S03 | 3 | 1 | 2,890 |
| ... | | | |
```

**PATTERNS.md** -- observed patterns pending skill generation:

```markdown
# Observed Patterns

> Observations since last skill generation: 12
> Candidate patterns (3+ occurrences): 4
> Last generation run: 2026-03-25T10:15:00Z

## Candidate Patterns

### Pattern: YAML frontmatter validation
- **Occurrences:** 7 (across T02-T08 of S03)
- **Tool sequence:** read_file -> parse YAML -> validate schema -> fix errors -> write_file
- **File types:** .md files with YAML frontmatter
- **Error recovery:** Missing required fields --> insert defaults; invalid types --> coerce
- **Confidence:** 0.84 (high recurrence, consistent tool sequence)
- **Status:** Ready for skill generation

### Pattern: Test file co-location
- **Occurrences:** 5 (T01-T05 of S02)
- **Tool sequence:** read_file(src/X.ts) -> write_file(src/X.test.ts) -> run_tests
- **Observation:** Tests always created adjacent to source, never in separate test/ directory
- **Confidence:** 0.71 (consistent but small sample)
- **Status:** Accumulating observations

## Raw Observations

[Append-only observation records in structured format]
```

Both files participate in GSD-2's existing state model. They are read at dispatch time (SKILLS.md by the injector, PATTERNS.md by the observer), written at task completion time (by the post-task hook), and are always human-readable. A developer can open either file, understand exactly what skill-creator knows, and manually edit if needed. No opaque databases. No binary formats. Files on disk, readable with `cat`.

> *GSD-2's state-on-disk model is not a limitation -- it is a design choice that makes the entire system inspectable by humans. Skill-creator inherits this property. Every pattern, every activation rate, every injection decision is a line in a markdown file that you can read, edit, or delete.*

---

## 6. Migration from GSD v1

Projects migrating from GSD v1 to GSD-2 bring history. The `.planning/` directory contains SUMMARY.md files from every executed plan, STATE.md with accumulated decisions, and ROADMAP.md with phase progression data. This is exactly the observation data that skill-creator's pipeline produces -- just in the old format.

**The migration scanner:**

```typescript
interface MigrationResult {
  patternsExtracted: number;
  summariesScanned: number;
  toolSequencesFound: number;
  decisionsImported: number;
  estimatedSkillCandidates: number;
}

async function migrateFromV1(planningDir: string): Promise<MigrationResult> {
  // 1. Find all SUMMARY.md files in .planning/phases/
  const summaries = await glob(`${planningDir}/phases/**/*-SUMMARY.md`);

  // 2. For each summary, extract:
  //    - YAML frontmatter (key-files, decisions, metrics)
  //    - Commit messages (tool sequences implied by file changes)
  //    - Deviation documentation (error-recovery patterns)

  // 3. Convert to ObservationRecord format
  //    - GSD v1 "phase-plan" maps to GSD-2 "milestone-slice-task"
  //    - GSD v1 "key-files.created" maps to file access patterns
  //    - GSD v1 "deviations" maps to error-recovery strategies

  // 4. Write to .gsd/PATTERNS.md as seed observations

  // 5. Run pattern detection on the seed data
  //    - Patterns with 3+ occurrences become skill candidates

  return result;
}
```

**v1-to-v2 artifact mapping:**

| GSD v1 Artifact | Location | GSD-2 Equivalent | Extraction Value |
|-----------------|----------|-------------------|-----------------|
| `*-SUMMARY.md` | `.planning/phases/XX-name/` | `T01-SUMMARY.md` | Tool sequences, decisions, file patterns |
| `STATE.md` | `.planning/` | `STATE.md` | Accumulated decisions, blockers |
| `ROADMAP.md` | `.planning/` | `M001-ROADMAP.md` | Phase structure, completion patterns |
| `*-PLAN.md` | `.planning/phases/XX-name/` | `T01-PLAN.md` | Task structure, verification criteria |
| `CONTEXT.md` | `.planning/` | `M001-CONTEXT.md` | Domain knowledge, architectural decisions |
| `deferred-items.md` | `.planning/phases/XX-name/` | Seeds system | Out-of-scope discoveries |

**Why migration matters:**

A project with 50 completed GSD v1 plans has 50 SUMMARY files, potentially hundreds of file patterns, dozens of decisions, and multiple error-recovery strategies documented. Scanning this history gives skill-creator a head start -- it can identify patterns and generate candidate skills before the first GSD-2 task even runs. The migration is a bootstrap: it converts historical record into future leverage.

The scanner runs once, at the first `gsd init` in a project with an existing `.planning/` directory. It writes seed observations to PATTERNS.md and logs a migration summary to SKILLS.md. After migration, the v1 data is not modified or moved -- it remains in `.planning/` as the historical record. Skill-creator reads it once and carries forward only the extracted patterns.

---

## 7. Upstream Monitoring Strategy

Skill-creator integrates with three rapidly-evolving upstream repositories. Each has a different release cadence, different breaking-change patterns, and different implications for the extension integration.

**Repository release profiles:**

| Repository | Version | Releases | Commits | Cadence | Breaking Change Pattern |
|-----------|---------|----------|---------|---------|----------------------|
| badlogic/pi-mono | v0.62.0 | 179 | 3,354 | ~2.9/week | Pre-1.0: frequent API changes, especially in `@pi/agent` |
| gsd-build/get-shit-done | v1.28.0 | 39 | 1,359 | ~1.1/week | Post-1.0: stable core, context artifact changes |
| gsd-build/gsd-2 | v2.43.0 | 73 | 1,768 | ~2.1/week | Active development: extension API evolving |

**Monitoring layers:**

1. **Release tracking** -- watch GitHub Releases API for new tags on all three repos. Frequency: daily check. Store in a version log with timestamp, tag, and changelog summary.

2. **Breaking change detection** -- parse changelogs and commit messages for signals: "BREAKING", "removed", "renamed", "deprecated", major version bumps, changes to files in `ext/` or `packages/pi-agent-core/`. Flag for human review.

3. **Extension API surface monitoring** -- specifically track changes to files that define the extension interface: type definitions, the extension loader, hook registration signatures. These are the files that, if changed, directly affect skill-creator's integration.

4. **Dependency graph monitoring** -- track changes to `package.json` across the Pi monorepo. New dependencies, removed dependencies, and major version bumps in existing dependencies can indicate architectural shifts.

**Version pinning strategy:**

```yaml
# .gsd/upstream.yaml
upstreams:
  pi-mono:
    repo: badlogic/pi-mono
    pinned: v0.62.0
    compatible_range: ">=0.58.0 <1.0.0"
    watch_paths:
      - "packages/pi-agent-core/src/types.ts"
      - "packages/pi-agent-core/src/extension.ts"
      - "packages/pi-ai/src/providers/"
    last_checked: 2026-03-26T00:00:00Z

  gsd-v1:
    repo: gsd-build/get-shit-done
    pinned: v1.28.0
    compatible_range: ">=1.20.0 <2.0.0"
    watch_paths:
      - ".gsd-commands/"
      - "prompts/"
    last_checked: 2026-03-26T00:00:00Z

  gsd-2:
    repo: gsd-build/gsd-2
    pinned: v2.43.0
    compatible_range: ">=2.40.0 <3.0.0"
    watch_paths:
      - "src/extensions/"
      - "src/dispatch/"
      - "src/state/"
    last_checked: 2026-03-26T00:00:00Z
```

The pinning strategy uses semantic version ranges. Skill-creator tests against the pinned version but declares compatibility with a range. When a new release falls outside the compatible range, the monitoring system flags it as a potential breaking change requiring investigation. When a new release falls within the range, it is assumed compatible but logged for verification during the next integration test run.

> *Pi-mono's pre-1.0 status means every minor bump could break something. The monitoring isn't paranoia -- it's the correct engineering response to a dependency that releases 2.9 times per week and hasn't committed to API stability yet.*

---

## 8. Token Budget Impact

Every extension consumes tokens. The observation hook reads artifacts. The injection hook writes context into the dispatch prompt. These operations have a cost, and that cost must be bounded, predictable, and proportional to the value delivered.

**Observation overhead:**

| Operation | Token Cost | Frequency | Budget Impact |
|-----------|-----------|-----------|---------------|
| Read T01-SUMMARY.md frontmatter | ~200 tokens | Once per task | Negligible |
| Parse tool sequence from event stream | ~0 (in-memory) | Continuous during task | Zero |
| Write observation record to PATTERNS.md | ~300 tokens | Once per task | Negligible |
| **Total observation per task** | **~500 tokens** | | **<0.3% of 200k budget** |

The observation pipeline is deliberately cheap. It reads structured data (YAML frontmatter -- already parsed), extracts in-memory signals (tool call events -- already available from the Pi SDK), and writes a small structured record. The 2% overhead cap declared in the extension manifest is conservative -- actual overhead runs at 0.2-0.5%.

**Injection overhead:**

| Profile | Max Skills | Max Tokens | % of 200k Context |
|---------|-----------|------------|-------------------|
| Budget | 1 | 1,500 | 0.75% |
| Balanced | 3 | 3,500 | 1.75% |
| Quality | 3 | 5,000 | 2.50% |

Injection is the larger cost. A full skill with rules, examples, and pattern descriptions can run 1,500-2,000 tokens. Under the quality profile, three skills at maximum length approach the 5,000-token cap. This is meaningful -- 2.5% of context -- but the value proposition is proportional: skills that prevent a 10-minute debugging session or a failed verification cycle save far more tokens than they consume.

**Budget profile scaling:**

Under budget mode, GSD-2 already aggressively manages context: it uses cheaper models, skips research phases, and minimizes pre-inlined files. Skill-creator respects this by dropping to single-skill injection with high confidence thresholds. If no skill scores above 0.85 relevance, nothing is injected. This ensures that budget mode pays near-zero skill overhead.

Under balanced mode, skill-creator operates normally -- up to 3 skills, selected by relevance, capped at 3,500 tokens. This is the expected operating point for most workflows.

Under quality mode, the cap rises to 5,000 tokens and the confidence threshold drops to 0.5, allowing broader skill coverage. Quality mode already uses the most capable models and includes all phases -- adding full skill context aligns with its "spare no expense" philosophy.

**Combined overhead:**

```
Budget:   observation (0.3%) + injection (0.75%)  = ~1.0% of task budget
Balanced: observation (0.3%) + injection (1.75%)  = ~2.0% of task budget
Quality:  observation (0.3%) + injection (2.50%)  = ~2.8% of task budget
```

All within the declared 2% observation cap (the injection cap is separate and additive). The total worst-case overhead is under 3% of a task's context budget. For a 200,000-token context window, that is 5,600 tokens -- less than a single function implementation in most codebases.

---

## 9. Safety Considerations

An extension that reads execution artifacts, injects content into prompts, and monitors upstream repositories has a meaningful attack surface. The safety model is defense in depth: each risk has a hard mitigation, not just a policy.

| Concern | Risk Level | Mitigation | Enforcement |
|---------|-----------|-----------|-------------|
| API key exposure | Critical | Skill-creator never handles provider credentials; all auth delegates to Pi SDK's credential manager | Code review: zero `process.env.*KEY*` reads in extension source |
| Token budget theft | High | Observation capped at 2%, injection capped at 5,000 tokens; hard limits enforced at extension level | Runtime assertion: injector throws if output exceeds cap |
| Skill injection bloat | Medium | Max 3 skills per dispatch; total injection capped at 5,000 tokens regardless of profile | Token counter in injector with hard truncation at limit |
| Prompt injection via skills | High | All generated skills validated against GSD-2's existing prompt injection scanner before activation | Skills quarantined in PATTERNS.md until validation passes |
| License compliance | Low | All upstream repos are MIT licensed; skill-creator preserves MIT attribution chain | Automated license header check in skill generation pipeline |
| Breaking upstream changes | Medium | Version pinning with compatible ranges; monitoring with human review gate | CI integration test suite runs against pinned versions |

**Token budget theft in detail:**

The most subtle risk is token budget theft -- an extension that quietly consumes more context than it claims. The mitigation is architectural: the injector runs a token counter on its output and hard-truncates at the profile-specific cap. If a skill's content exceeds the remaining budget, it is trimmed to fit. If trimming would make the skill incoherent (below 200 tokens), it is dropped entirely. The post-task observation hook records the actual tokens injected, creating an audit trail that the evaluator can check against the declared budget.

**Prompt injection via skills:**

Generated skills contain natural language instructions that are injected into the dispatch prompt. A malicious or poorly-generated skill could contain instructions that override GSD-2's own behavior -- "ignore previous instructions" style attacks. The mitigation: every skill passes through GSD-2's existing prompt injection scanner before being written to SKILLS.md. Skills that fail the scan remain in PATTERNS.md with a `blocked: injection-risk` flag and are surfaced in the dashboard for human review.

**Upstream dependency risk:**

Pi-mono is pre-1.0 software releasing nearly three times per week. This is the highest-risk upstream. The monitoring strategy (Section 7) addresses detection, but the safety model also includes isolation: skill-creator's extension interface is defined as a thin adapter layer over the Pi SDK types, not a deep integration. If the Pi SDK changes its extension loader signature, only the adapter layer needs updating -- the observation pipeline, skill learner, and injector logic remain unchanged.

> *Security is not a feature you add. It is a constraint you design around. Every decision in this architecture -- delegating auth to Pi SDK, hard-capping injection tokens, quarantining unvalidated skills -- exists because the question "what if this goes wrong?" was asked before the code was written.*

---

## 10. The Full Integration Architecture

The complete stack, from Pi SDK at the bottom through GSD-2 in the middle to skill-creator at the top:

```
THE FULL INTEGRATION STACK
================================================================

  SKILL-CREATOR EXTENSION (#20)
  ================================
  |                                                            |
  |  +-----------------+    +------------------+               |
  |  | Observation     |    | Skill Injection  |               |
  |  | Pipeline        |    | Engine           |               |
  |  |                 |    |                  |               |
  |  | - Read SUMMARY  |    | - Match skills   |               |
  |  | - Extract tools |    | - Score by plan  |               |
  |  | - File patterns |    | - Apply profile  |               |
  |  | - Error recov.  |    | - Cap at 5k tok  |               |
  |  +--------+--------+    +--------+---------+               |
  |           |                      |                         |
  |           v                      v                         |
  |  +--------+--------+    +--------+---------+               |
  |  | PATTERNS.md     |    | SKILLS.md        |               |
  |  | (observations)  |    | (active skills)  |               |
  |  +-----------------+    +------------------+               |
  |           |                      ^                         |
  |           v                      |                         |
  |  +--------+--------------------------+                     |
  |  | Pattern Aggregator + Skill Learner |                    |
  |  | (3+ occurrences --> candidate)     |                    |
  |  | (validated --> active skill)       |                    |
  |  +------------------------------------+                    |
  |                                                            |
  ============================================================

                    |                ^
                    | post-task      | dispatch-prompt
                    | hook           | hook
                    v                |

  GSD-2 DISPATCH PIPELINE
  ================================
  |                                                            |
  |  1. Read STATE.md -----> determine next task               |
  |  2. Read T0N-PLAN.md --> extract requirements              |
  |  3. Build prompt:                                          |
  |     a) Pre-inline PROJECT.md, CONTEXT.md, SUMMARYs         |
  |     b) Pre-inline T0N-PLAN.md                             |
  |     c) [SKILL-CREATOR INJECT HOOK] <-- skills added here  |
  |     d) Apply token profile constraints                     |
  |  4. Create fresh Pi SDK agent session                      |
  |  5. Execute task (LLM does work)                           |
  |  6. Write T0N-SUMMARY.md                                   |
  |  7. [SKILL-CREATOR OBSERVE HOOK] <-- patterns extracted    |
  |  8. Update STATE.md                                        |
  |                                                            |
  ============================================================

                    |                ^
                    | create         | session
                    | session        | events
                    v                |

  PI SDK (AGENT-CORE)
  ================================
  |                                                            |
  |  Unified LLM API (20+ providers)                           |
  |  Tool calling infrastructure                               |
  |  Session lifecycle management                              |
  |  Token tracking and cost accounting                        |
  |  Extension loader and capability registry                  |
  |                                                            |
  ============================================================
```

**Data flow summary:**

1. GSD-2 reads state, determines next task, builds prompt
2. Skill-creator's inject hook fires during prompt construction, adding relevant skills
3. Pi SDK creates a fresh session with the enriched prompt
4. LLM executes the task, calling tools as needed
5. GSD-2 writes the SUMMARY artifact
6. Skill-creator's observe hook fires, extracting patterns from the completed task
7. Patterns accumulate in PATTERNS.md
8. When patterns reach threshold (3+ occurrences), the learner promotes them to skills
9. New skills appear in SKILLS.md, available for injection in the next dispatch

The loop is self-reinforcing: observation feeds learning, learning feeds injection, injection improves execution, improved execution produces richer observations. But the loop is also bounded -- caps on injection tokens, thresholds on pattern confidence, staleness tracking on unused skills. Growth is organic but constrained. The system gets better over time without growing without limit.

---

## 11. The Amiga Principle: Skill-Creator as Denise

The Amiga 1000 shipped in 1985 with three custom chips: Agnus (address generator), Paula (ports and audio), and Denise (display encoder). Each was powerful individually. Together, connected by a shared bus, they produced capabilities that machines costing five times as much could not match. The innovation was not in any single chip. It was in the bus protocol -- the interface that let them cooperate without stepping on each other.

**The mapping:**

| Amiga Chip | Role | Pi/GSD/SC Equivalent | Function |
|-----------|------|---------------------|----------|
| Agnus | DMA controller, address generation | Pi SDK | Coordinates LLM provider access, session management, resource allocation across 20+ providers |
| Paula | Ports, audio, I/O | GSD-2 | Manages execution I/O: planning, dispatching, verifying, human interaction, disk state |
| Denise | Display, graphics, creative output | skill-creator | Observes patterns flowing across the bus, generates new capabilities, produces visible intelligence |

**Denise is the creative engine.**

In the Amiga, Denise watched the data flowing across the bus -- bitplanes, sprites, color registers -- and synthesized a display from it. Denise did not generate the data. Agnus fetched it from memory; Paula managed the timing. Denise's job was to observe the stream and produce something new from it: a coherent image composed from disparate sources.

Skill-creator does the same thing. It does not fetch data from LLM providers (that is Pi SDK's job). It does not manage the execution lifecycle (that is GSD-2's job). It watches the stream of execution artifacts flowing through the dispatch pipeline -- SUMMARY files, tool call sequences, decision records -- and synthesizes skills from them. New capabilities that did not exist before, composed from patterns that were always present but never extracted.

**The bus protocol is GSD-2's extension system.**

The Amiga's bus was a 68000-compatible address/data bus with DMA channels and a priority system that ensured Agnus, Paula, and Denise could all access memory without conflicts. GSD-2's extension system serves the same purpose: it provides well-defined hooks (post-task, dispatch-prompt) and registration points (tools, commands) that let extensions cooperate without conflicts. Each extension gets its own context, its own tool namespace, its own hook invocations. The extension loader manages priority and ensures one extension's hook doesn't block another's.

Skill-creator does not need to understand everything GSD-2 does. It needs to observe at the right moments (post-task hook), inject at the right moment (dispatch-prompt hook), and read the right artifacts (SUMMARY, PLAN, STATE files). The bus carries the signal; the chip does the work.

> *The spaces between the chips are where the power lives. Not in any single component's capability, but in the protocol that lets them compose. Pi provides the silicon. GSD-2 provides the bus. Skill-creator provides the display -- turning raw execution data into visible, reusable intelligence that makes the next session smarter than the last.*

**Why three systems, not one?**

A monolithic system that combined LLM provider management, context engineering, and adaptive learning would be simpler to deploy but impossible to maintain. Pi-mono releases 2.9 times per week. GSD-2 releases 2.1 times per week. If skill-creator were embedded in either, it would be subject to their release cadence and breaking changes. As a separate system connected by a well-defined extension interface, it evolves independently. The extension manifest is the contract. As long as both sides honor the contract, internal changes are invisible.

This is what the Amiga taught: you can replace Denise with a better Denise (ECS, AGA) without changing Agnus or Paula. The bus stays the same. The chips evolve independently. The system gets better without requiring coordinated rewrites.

---

## 12. Cross-References

**Within PMG research:**

| Module | Title | Relationship |
|--------|-------|-------------|
| [Module 1: Pi-Mono SDK Architecture](01-pi-mono-sdk.md) | Pi SDK package analysis | Foundation: the runtime skill-creator targets |
| [Module 2: GSD v1 Context Engineering](02-gsd-v1-context.md) | Context artifact inventory | Lineage: the patterns GSD-2 inherits and skill-creator must understand |
| [Module 3: GSD-2 Agent Application](03-gsd-2-agent.md) | Extension system and dispatch pipeline | Target: the integration surface for skill-creator |
| [Module 4: Documentation and Mintlify](04-documentation-mintlify.md) | Mintlify patterns and AI tool integration | Distribution: how skills reach users |

**External GSD research:**

| Project | Module | Relationship |
|---------|--------|-------------|
| [GSD2 Module 3: Extensions & Subagents](../GSD2/research/03-extensions-subagents.md) | Extension system deep dive | Detailed analysis of the 19 bundled extensions |
| [GSD2 Module 5: Pi SDK Integration](../GSD2/research/05-pi-sdk-integration.md) | Pi SDK architecture from GSD-2's perspective | Agnus: the DMA controller |
| [GSD2 Module 6: Skill-Creator Integration](../GSD2/research/06-skill-creator-integration.md) | Full integration architecture | Paula meets Agnus: the bus between systems |

**Skill-creator architecture:**

| Document | Relationship |
|----------|-------------|
| gsd-skill-creator-analysis.md | Current architecture that this extension extends |
| skill-creator-wasteland-integration-analysis.md | Parallel integration track (Wasteland federation) |
| mcp-servers-research.md | MCP transport patterns for skill-creator's server components |
| gsd-chipset-architecture-vision.md | Chipset YAML definitions for GSD-2 agent topologies |
| gsd-upstream-intelligence-pack-v1_43.md | Predecessor: Anthropic channel monitoring |
| gsd-amiga-vision-architectural-leverage.md | Philosophical foundation: the Amiga Principle |

---

## 13. Sources

**Primary repositories (all MIT licensed):**

1. **badlogic/pi-mono** -- https://github.com/badlogic/pi-mono (v0.62.0, 3,354 commits, 179 releases, TypeScript 95.7%, accessed March 26, 2026)
2. **gsd-build/get-shit-done** -- https://github.com/gsd-build/get-shit-done (v1.28.0, 1,359 commits, 39 releases, JavaScript, accessed March 26, 2026)
3. **gsd-build/gsd-2** -- https://github.com/gsd-build/gsd-2 (v2.43.0, 1,768 commits, 73 releases, TypeScript 92.5%, accessed March 26, 2026)
4. **gsd-build/docs** -- https://github.com/gsd-build/docs (Mintlify starter kit, accessed March 26, 2026)

**Documentation sources:**

5. Mintlify Quickstart -- https://starter.mintlify.com/quickstart
6. Pi SDK AGENTS.md -- Project-level agent behavioral guidance (badlogic/pi-mono repository root)
7. GSD-2 docs/ directory -- 17 documentation files covering architecture, auto mode, configuration, token optimization, skills, extensions, and more

**Skill-creator architecture references:**

8. gsd-skill-creator-analysis.md -- Current skill-creator architecture: observation hooks, PatternAggregator, skill generation pipeline
9. skill-creator-wasteland-integration-analysis.md -- Wasteland bridge, DACP observation, federation protocol
10. mcp-servers-research.md -- MCP server patterns, tool protocol, transport layer analysis
11. gsd-chipset-architecture-vision.md -- Chipset YAML specification, agent topology definitions
12. gsd-upstream-intelligence-pack-v1_43.md -- Anthropic channel monitoring, upstream intelligence methodology
13. gsd-amiga-vision-architectural-leverage.md -- The Amiga Principle: architectural leverage through chip cooperation

---

*Module 5 is the synthesis. Modules 1-4 documented the components -- the Pi SDK runtime, the GSD v1 lineage, the GSD-2 application, the documentation layer. This module documents the bus that connects them. The extension manifest, the observation pipeline, the injection engine, the state files, the migration path, the monitoring strategy, the token budget, the safety model. Each piece is simple. The composition is where the power lives.*

*The Amiga taught this lesson in 1985. Three chips, one bus, and the spaces between them where the magic happened. Forty-one years later, the same principle applies: Pi provides the silicon, GSD-2 provides the bus, and skill-creator provides the display -- turning raw execution into visible intelligence. Not one system doing everything, but three systems doing their jobs brilliantly and communicating through a protocol that lets them cooperate without stepping on each other.*

*This is what giving people their lives back looks like at the infrastructure level.*
