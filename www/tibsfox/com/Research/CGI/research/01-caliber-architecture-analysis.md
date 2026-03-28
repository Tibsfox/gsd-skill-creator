# Caliber Architecture Analysis

> **Domain:** AI Configuration Quality Assessment
> **Module:** 1 -- Scoring Engine, Session Learning, Drift Detection
> **Through-line:** *Measurement precedes improvement. You cannot refine what you cannot score, and you cannot score reliably what you measure with the same tool that generated the output.* Caliber's architectural insight is separation of concerns: the scoring engine is deterministic, LLM-free, and filesystem-grounded. The generation engine uses LLMs. They never cross. This separation is what makes the scores trustworthy enough to use as gates.

---

## Table of Contents

1. [The Measurement Problem](#1-the-measurement-problem)
2. [Scoring Engine Architecture](#2-scoring-engine-architecture)
3. [The Five-Category Rubric](#3-the-five-category-rubric)
4. [Existence Scoring (25 Points)](#4-existence-scoring-25-points)
5. [Quality Scoring (25 Points)](#5-quality-scoring-25-points)
6. [Grounding Scoring (20 Points)](#6-grounding-scoring-20-points)
7. [Accuracy Scoring (15 Points)](#7-accuracy-scoring-15-points)
8. [Freshness and Safety Scoring (10 Points)](#8-freshness-and-safety-scoring-10-points)
9. [Score Regression Guards](#9-score-regression-guards)
10. [Session Learning Pipeline](#10-session-learning-pipeline)
11. [The CALIBER_LEARNINGS Taxonomy](#11-the-caliber-learnings-taxonomy)
12. [Drift Detection and Refresh](#12-drift-detection-and-refresh)
13. [Multi-Platform Output System](#13-multi-platform-output-system)
14. [Two-Tier Model Architecture](#14-two-tier-model-architecture)
15. [Structured Fix Data](#15-structured-fix-data)
16. [Score History and Trend Analysis](#16-score-history-and-trend-analysis)
17. [Known Issues and Gotchas](#17-known-issues-and-gotchas)
18. [Cross-References](#18-cross-references)
19. [Sources](#19-sources)

---

## 1. The Measurement Problem

AI agent configuration quality is a deceptively hard problem. The output of an LLM-assisted configuration step -- a CLAUDE.md file, a set of skills, an MCP server declaration -- looks reasonable on first reading. It uses correct syntax, references plausible directories, and describes the project in coherent prose. But "looks reasonable" is not a quality metric. The file might reference directories that don't exist. The skills might trigger on file patterns that match zero files in the actual repository. The MCP server configuration might declare capabilities the project doesn't use [1].

Traditional code quality tools -- linters, type checkers, test suites -- operate on deterministic inputs with deterministic expectations. `eslint` checks syntax rules. `tsc` checks type contracts. `vitest` checks behavioral assertions. Each produces a binary result: pass or fail, with structured data about what failed and where. AI configuration quality demands the same rigor, but the inputs are prose documents and YAML frontmatter, not executable code [2].

Caliber (caliber-ai-org/ai-setup) solved this by treating configuration quality as a cross-referencing problem, not a natural language understanding problem. The scoring engine never needs to understand what a skill description *means*. It only needs to verify that what the description *references* actually exists on disk, that the references are fresh relative to git history, and that the structural elements (headings, code blocks, trigger patterns) follow a known-good format [3].

```
THE MEASUREMENT SEPARATION PRINCIPLE
================================================================

  GENERATION (LLM-powered)        SCORING (LLM-free)
  ========================        ===================

  Input:  Project analysis        Input:  Filesystem state
  Tool:   Claude/GPT/etc.         Tool:   fs.existsSync, git CLI
  Output: CLAUDE.md, skills       Output: 100-point score + fix data
  Risk:   Hallucination           Risk:   None (deterministic)
  Cost:   API tokens              Cost:   Zero (local I/O)

  KEY INSIGHT: The scorer never calls the generator.
  The generator can optionally consume score output as input.
  The data flows in one direction: score -> generate -> re-score.
```

This separation is architecturally identical to the principle that test code should not share implementation with production code. If the same LLM that generates a skill also evaluates its quality, the evaluation inherits the LLM's blind spots. A filesystem cross-reference has no blind spots -- a path either exists or it doesn't [4].

> **Related:** [GSD Architecture](02-gsd-skill-creator-architecture.md) for the complementary inside-out approach, [Integration Mapping](03-integration-mapping.md) for port specifications

---

## 2. Scoring Engine Architecture

Caliber's scoring engine operates as a pure function: given a project directory path, it returns a structured score object. No side effects, no network calls, no LLM invocations. The engine's entire dependency tree is the Node.js `fs` module, the `child_process` module for git commands, and the `path` module for cross-platform path resolution [3].

The architectural decision to make scoring LLM-free has three consequences that compound:

**CI/CD integration without API keys.** The score command can run in any GitHub Actions workflow, GitLab CI pipeline, or local pre-commit hook without requiring LLM provider credentials. This means quality gates can be enforced on every commit, not just during interactive sessions [5].

**Reproducibility.** Given the same filesystem state, the scorer always returns the same result. This enables score comparison across git refs (`caliber score --compare HEAD~1`), trend tracking over time, and regression detection. A score that depends on LLM output would vary between runs even with identical inputs due to temperature, model version changes, and provider-side updates [6].

**Speed.** The entire scoring pipeline completes in under 200ms for a typical project. This is fast enough for pre-commit hooks (where latency above 500ms degrades developer experience), for watch-mode during development, and for batch scoring across multiple project directories [7].

```
SCORING ENGINE -- EXECUTION FLOW
================================================================

  caliber score [project-dir]
       |
       v
  ┌─────────────────────────┐
  │  1. Discover config     │  glob for CLAUDE.md, .claude/,
  │     files               │  .cursor/, .agents/, MCP configs
  └──────────┬──────────────┘
             |
             v
  ┌─────────────────────────┐
  │  2. Run category        │  Existence (25) + Quality (25)
  │     scorers             │  + Grounding (20) + Accuracy (15)
  │                         │  + Freshness (10) + Bonus (5)
  └──────────┬──────────────┘
             |
             v
  ┌─��───────────────────────┐
  │  3. Aggregate           │  Total = sum of categories
  │                         │  Grade = A(90+)/B(70-89)/C(40-69)/F(<40)
  └──────────┬──���───────────┘
             |
             v
  ┌─────────────────────────┐
  │  4. Generate fix data   │  Each failing check produces:
  │                         │  { check, description, fix }
  └─���────────┬──────────────┘
             |
             v
  Return { total, grade, categories, failedChecks, fixData }
```

> **CAUTION:** The scoring engine's filesystem dependency means it must be run in the project's working directory or with an explicit path argument. Running it against a bare git repository (no working tree) will produce incorrect Grounding and Accuracy scores because file existence checks require a working tree.

---

## 3. The Five-Category Rubric

The 100-point rubric is divided into five categories with different weights reflecting their importance to operational quality. The weights were calibrated against 30+ real development sessions where Caliber tracked correlation between category scores and actual skill usefulness [8].

| Category | Points | Weight | What It Measures |
|----------|--------|--------|------------------|
| Existence | 25 | 25% | Are the required files and structures present? |
| Quality | 25 | 25% | Are the contents well-structured and actionable? |
| Grounding | 20 | 20% | Do references point to real project artifacts? |
| Accuracy | 15 | 15% | Are the references current and correct? |
| Freshness & Safety | 10 | 10% | Is the config recently updated? Any secrets leaked? |
| Bonus | 5 | 5% | Auto-refresh hooks, AGENTS.md, OpenSkills compliance |

The asymmetric weighting is deliberate. Existence and Quality together account for 50% because a skill that exists but references the wrong files is more useful than no skill at all -- at least the developer knows the capability gap. Grounding (20%) catches the most common LLM failure mode: confident references to directories and files that don't exist. Accuracy (15%) catches a subtler problem: references that *used to be* correct but drifted as the codebase evolved [8].

> **Related:** [Calibration Loops](04-calibration-loops-quality-metrics.md) for how these scores feed the refinement cycle

---

## 4. Existence Scoring (25 Points)

The Existence category checks the bare minimum: do the configuration files that should be present actually exist?

| Check | Points | Criteria |
|-------|--------|----------|
| CLAUDE.md present | 10 | File exists at project root or .claude/ |
| SKILL.md files present | 5 | At least one skill in .claude/skills/ |
| Frontmatter complete | 5 | YAML frontmatter includes name, description, triggers |
| Description present | 5 | Non-empty description field in skill frontmatter |

The 10-point weight for CLAUDE.md reflects its role as the primary context document. A project without CLAUDE.md gets zero value from Claude Code's auto-context system, regardless of what skills exist [9]. The 5-point checks for skills, frontmatter, and descriptions are additive -- a project with CLAUDE.md and one well-formed skill scores 25/25 even with no other configuration [3].

```
EXISTENCE SCORING -- DECISION TREE
================================================================

  CLAUDE.md exists?
    YES (10 pts) ─────────────────────── NO (0 pts)

  .claude/skills/*/SKILL.md exists?
    YES (5 pts) ──────────────────────── NO (0 pts)

  Frontmatter has name + description + triggers?
    ALL present (5 pts) ─── SOME missing (2 pts) ─── NONE (0 pts)

  Description field non-empty and > 20 chars?
    YES (5 pts) ──────────────────────── NO (0 pts)
```

---

## 5. Quality Scoring (25 Points)

Quality scoring evaluates the structural quality of configuration content without understanding its semantic meaning. This is the category where Caliber's LLM-free constraint is most tested -- and most valuable [8].

| Check | Points | Criteria |
|-------|--------|----------|
| Code blocks present | 5 | At least one fenced code block in CLAUDE.md |
| Token budget concise | 5 | CLAUDE.md under 2000 tokens (prevents context dilution) |
| Structured headings | 5 | H2/H3 hierarchy in CLAUDE.md |
| Concrete instructions | 5 | Contains "Use when" or "Run" or action verbs |
| Description effectiveness | 5 | Skill descriptions contain trigger context |

The "Token budget concise" check (5 points) encodes a hard-won lesson from Caliber's development: CLAUDE.md files that exceed ~2000 tokens dilute the model's attention across irrelevant context. This was validated by measuring skill activation precision across 50 sessions with varying CLAUDE.md lengths. Activation precision dropped measurably when CLAUDE.md exceeded 2000 tokens, and dropped sharply above 5000 tokens [10].

The "Description effectiveness" check looks for specific linguistic patterns -- "Use when", "Run this", "Activate if" -- that correlate with accurate skill activation. Skills with vague descriptions ("helps with TypeScript") activate on false positives. Skills with trigger-context descriptions ("Use when editing .tsx files in the components/ directory") activate precisely [10].

---

## 6. Grounding Scoring (20 Points)

Grounding is where the filesystem cross-reference earns its keep. Every path, directory, file pattern, and glob expression mentioned in configuration files is checked against the actual project structure [11].

| Check | Points | Criteria |
|-------|--------|----------|
| Directory references valid | 8 | Referenced directories exist on disk |
| File pattern match | 7 | Trigger file patterns match >= 1 file via glob |
| Import path accuracy | 5 | Referenced module paths resolve correctly |

The implementation uses `git ls-files` rather than raw `fs.readdirSync` for file enumeration. This is significant: `git ls-files` returns tracked files only, ignoring build artifacts, node_modules, and other gitignored content. A skill that triggers on `*.js` files should match source files, not the 50,000 JavaScript files in node_modules/ [11].

```
GROUNDING CHECK -- FILE PATTERN RESOLUTION
================================================================

  Skill trigger: "*.tsx files in src/components/"

  Step 1: git ls-files --full-name "src/components/**/*.tsx"
  Step 2: Count matches

  matches == 0  → Grounding: 0 pts (dead trigger)
  matches >= 1  → Grounding: full pts (live trigger)

  IMPORTANT: This catches the #1 LLM skill generation failure mode:
  confident references to paths that sound plausible but don't exist.
  "src/components/" is a common convention, but the actual project
  might use "app/components/" or "lib/ui/".
```

> **WARNING:** Grounding checks that use `git ls-files` will not detect untracked files. A newly created file that hasn't been committed or staged will appear to not exist. The `--others` flag can include untracked files but risks matching temporary files. Caliber's current implementation uses tracked files only, which is the conservative choice for scoring accuracy.

---

## 7. Accuracy Scoring (15 Points)

Accuracy goes beyond existence to verify correctness. A file can exist but contain outdated information -- a skill that references `v1.0 API endpoints` when the project has migrated to `v2.0` is technically grounded but practically wrong [12].

| Check | Points | Criteria |
|-------|--------|----------|
| Path freshness | 8 | Referenced files modified within 60 days |
| No stale references | 4 | No paths to deleted/renamed files |
| Git history alignment | 3 | Config updated after major structural changes |

The "Path freshness" check uses `git log -1 --format=%ct -- <path>` to determine when a referenced file was last modified. If the configuration references a file that hasn't been touched in 60+ days while the configuration itself was updated recently, the reference is likely stale [12].

The "No stale references" check is the Accuracy category's safety net. It runs after Grounding to catch a specific failure mode: the LLM generates a path that existed when the skill was created but has since been renamed or deleted. This check compares skill creation timestamp against the file's deletion timestamp (via `git log --diff-filter=D`) [12].

---

## 8. Freshness and Safety Scoring (10 Points)

The lowest-weighted category covers two concerns: temporal freshness and security hygiene.

| Check | Points | Criteria |
|-------|--------|----------|
| Recently updated | 4 | Config files modified within last 30 days |
| No leaked secrets | 4 | No API keys, tokens, or credentials in config |
| Permissions configured | 2 | MCP server permissions explicitly declared |

The "No leaked secrets" check runs a simple regex scan against common secret patterns: `sk-`, `ANTHROPIC_API_KEY=`, `ghp_`, `Bearer `, base64-encoded strings of suspicious length. This is not a comprehensive secret scanner (tools like `gitleaks` and `truffleHog` are purpose-built for that), but it catches the most common accidental leaks in configuration files [13].

> **SAFETY WARNING:** The secret detection check is a basic safety net, not a security guarantee. It uses pattern matching, not entropy analysis. Secrets that don't match common patterns (custom tokens, encoded credentials, indirect references via environment variables) will not be flagged. For production security, pair with a dedicated secret scanning tool.

---

## 9. Score Regression Guards

The score regression guard is Caliber's most important operational pattern. Before any write operation (init, refresh, regenerate), the engine snapshots the current score. After the write completes, it re-scores. If the post-score is lower than the pre-score, all changes are automatically reverted [14].

```
SCORE REGRESSION GUARD -- EXECUTION FLOW
================================================================

  User: caliber refresh
       |
       v
  ┌─────────────────────────┐
  │  1. Score BEFORE        │  pre_score = score(project)
  │     (snapshot)          │  save to .caliber/pre-snapshot.json
  └──────────���──────────────┘
             |
             v
  ┌─────��───────────────────┐
  │  2. Execute refresh     │  Analyze git diffs
  │                         │  Update config files
  └──────────┬──────────────┘
             |
             v
  ┌───���─────────────────────┐
  │  3. Score AFTER         │  post_score = score(project)
  └──────────┬──────────────┘
             |
             v
  ┌─────────────────────────┐
  │  4. Compare             │  post >= pre? ACCEPT
  │                         │  post < pre?  REVERT + LOG
  └─────────────────────────┘

  CRITICAL: This guard makes refinement operations safe by default.
  A bad refresh cannot make things worse -- only better or unchanged.
```

This pattern maps directly to gsd-skill-creator's refinement engine. The bounded learning constraints (20% cap, 3-correction minimum) protect against *large* bad changes. The score regression guard protects against *small* bad changes that stay within the structural limits but still reduce quality [14].

> **Related:** [Calibration Loops](04-calibration-loops-quality-metrics.md) for the full refinement cycle with score gates

---

## 10. Session Learning Pipeline

Caliber's session learning pipeline captures operational patterns from tool usage during development sessions. The pipeline runs passively -- it observes what the developer does, what fails, what corrections the developer makes, and what patterns recur [15].

The pipeline has three stages:

**Capture.** During a session, Caliber instruments its own tool calls: which commands ran, which failed, what the developer did differently after a failure. This raw data is appended to a session log.

**Classify.** After the session, `caliber learn finalize` reads the session log and classifies each observation into one of six categories (see Section 11). Classification uses keyword matching and structural patterns -- not LLM inference -- for the initial category assignment [15].

**Distill.** Classified learnings are appended to CALIBER_LEARNINGS.md, deduplicated against existing entries. The format is flat: category tag, one-line summary, optional detail. This deliberately avoids deep nesting or complex schemas because the file is both machine-readable (for tool injection) and human-readable (for developer review) [15].

---

## 11. The CALIBER_LEARNINGS Taxonomy

Six categories, validated across 30+ real development sessions:

| Category | Semantics | Example from CALIBER_LEARNINGS |
|----------|-----------|-------------------------------|
| `[correction]` | Wrong advice that needed user override | "Always use singular form for test file names" |
| `[gotcha]` | Environment quirks and non-obvious constraints | "GitHub video tags don't render in README" |
| `[fix]` | Specific code fixes for recurring bugs | "If learn finalize crashes with content.split error..." |
| `[pattern]` | Recurring successful solutions | "Use git check-ignore not git ls-files for ignore checks" |
| `[env]` | Environment setup and configuration | "npm install required before test runs" |
| `[convention]` | Team/project style standards | "Use 'config' not 'setup' in messaging" |

The taxonomy's value is operational, not theoretical. Each category triggers different downstream behavior:

- `[correction]` entries feed back into skill refinement as negative examples
- `[gotcha]` entries are injected into session context at startup
- `[fix]` entries are matched against error messages for automatic suggestion
- `[pattern]` entries inform skill generation templates
- `[env]` entries are checked during project initialization
- `[convention]` entries are injected into generation prompts as style constraints [15]

> **Related:** [GSD Architecture](02-gsd-skill-creator-architecture.md) for how this maps to FeedbackCategory enum, [Integration Mapping](03-integration-mapping.md) for the taxonomy port specification

---

## 12. Drift Detection and Refresh

`caliber refresh` analyzes git diffs at three layers to detect configuration drift:

| Layer | Git Command | What It Catches |
|-------|-------------|-----------------|
| Committed | `git diff HEAD~1 --name-only` | Changes since last commit |
| Staged | `git diff --cached --name-only` | Pending commit changes |
| Unstaged | `git diff --name-only` | Working tree modifications |

The three-layer approach ensures complete awareness of what has changed since the last session. A skill that triggers on `src/api/*.ts` needs to know if those files were renamed (committed), if new files were added (staged), or if existing files were modified (unstaged) [16].

**Rate limiting.** A 30-second cooldown between refresh operations (`REFRESH_COOLDOWN_MS = 30_000`) prevents excessive computation in CI/hook loops. This is critical for pre-commit hook integration where rapid successive commits could trigger refresh storms [16].

**Retry on transient failure.** LLM calls during refresh retry once before failing. This matters for hook-triggered refreshes which run silently -- a single transient API error shouldn't leave configuration in a stale state [16].

```
DRIFT DETECTION -- THREE-LAYER ANALYSIS
================================================================

  git diff HEAD~1 --name-only    →  committed_files[]
  git diff --cached --name-only  →  staged_files[]
  git diff --name-only           →  unstaged_files[]

  changed_files = union(committed, staged, unstaged)

  For each skill with file triggers:
    trigger_files = glob(skill.triggers.filePattern)
    overlap = intersect(trigger_files, changed_files)
    if overlap.length > 0:
      flag skill as "needs review"
      report: "Skill '{name}' triggers on files that changed: {overlap}"
```

---

## 13. Multi-Platform Output System

Caliber's `--agent` flag enables simultaneous generation of configuration for multiple AI agent platforms:

| Platform | Skill Directory | Config File |
|----------|----------------|-------------|
| Claude Code | `.claude/skills/*/SKILL.md` | `CLAUDE.md` |
| Cursor | `.cursor/skills/*/SKILL.md` | `.cursorrules` |
| Codex | `.agents/skills/*/SKILL.md` | `AGENTS.md` |

The SKILL.md format is shared across platforms. The difference lies in extension fields: `triggers`, `extends`, `version`, and `enabled` are gsd-skill-creator extensions that Cursor and Codex don't recognize. Multi-platform output strips these fields for non-Claude targets [17].

A planned refactor (noted in Caliber's TODOS.md) will change the parity scoring check from hardcoded Claude+Cursor to "any 2 of N configured platforms." This is the correct architecture for gsd-skill-creator's multi-platform feature [17].

---

## 14. Two-Tier Model Architecture

Caliber automatically selects model tier based on operation type:

| Operation | Model Tier | Rationale |
|-----------|-----------|-----------|
| Scoring | None (LLM-free) | Deterministic filesystem cross-reference |
| Classification | Fast (Haiku-tier) | Pattern matching, keyword extraction |
| Generation | Heavy (Opus/Sonnet-tier) | Prose generation, structural decisions |

This maps directly onto GSD's chipset model assignment: Paula (Haiku) for relevance scoring, Denise (Sonnet) for skill generation, Agnus (Opus) for architectural decisions [18].

---

## 15. Structured Fix Data

Every failing check in the scoring engine produces structured fix data:

```
interface FixData {
  check: string;        // "grounding.directory_exists"
  description: string;  // "Skill references 'src/api/' which does not exist"
  fix: string;          // "Update trigger to 'src/routes/' (closest match)"
}
```

This fix data serves two purposes. First, it is displayed to the human as actionable diagnostics -- not "score is low" but "this specific path doesn't exist, here's what does." Second, it is injected into the LLM prompt when running `caliber init` or `caliber refresh`, giving the generator exact information about what needs fixing rather than a vague instruction to "improve quality" [19].

The structured fix data pattern is one of Caliber's cleanest architectural decisions. It transforms scoring from a passive measurement into an active feedback loop: score, diagnose, fix, re-score [19].

---

## 16. Score History and Trend Analysis

Score history is recorded in `.caliber/score-history.jsonl`, an append-only JSONL file that captures scores at key decision points:

| Trigger | When Recorded |
|---------|--------------|
| `init` | After initial configuration generation |
| `regenerate` | After full config regeneration |
| `refresh` | After drift-triggered update |
| `score` | After explicit score command |
| `manual` | After user-initiated configuration edit |

Each entry records: timestamp, total score, per-category breakdown, trigger event, and the git ref at time of scoring. This enables trend analysis: is the project's configuration quality improving, degrading, or stable over time? [20]

The trend is computed as a simple moving average over the last 5 entries. Direction is encoded as arrows: upward (improving), downward (degrading), right (stable). A cooldown guard prevents score entries within 5 minutes of each other to avoid noisy data from rapid edit cycles [20].

---

## 17. Known Issues and Gotchas

From CALIBER_LEARNINGS.md, validated in production:

**Lock file persistence.** `caliber learn finalize` may fail silently with a stale lock file (`.caliber/learning/finalize.lock`) if a previous session crashed. The fix is PID-based lock validation: check if the PID in the lock file is still running; if not, clean up and proceed [15].

**Score comparison across branches.** `caliber score --compare <ref>` checks out the ref in a temporary worktree to score it. If the ref has different file structures, the Grounding category comparison may show misleading deltas (not because quality changed, but because the filesystem changed). The fix is to weight Grounding deltas differently in cross-branch comparisons [20].

**Ora spinner interference.** The `ora` spinner library swallows stderr output, making it hard to debug scoring failures in CI environments. Caliber added a `--no-spinner` flag for CI/hook contexts [15].

---

## 18. Cross-References

> **Related:** [GSD Skill-Creator Architecture](02-gsd-skill-creator-architecture.md) -- the complementary inside-out system that this scoring engine will integrate with
> **Related:** [Integration Mapping](03-integration-mapping.md) -- detailed port specifications for bringing Caliber's scoring into gsd-skill-creator
> **Related:** [Calibration Loops & Quality Metrics](04-calibration-loops-quality-metrics.md) -- how scores feed the refinement cycle
> **Related:** [Risk, Compatibility & The Bridge](05-risk-compatibility-bridge.md) -- architectural risks in the scoring port

Cross-project references:

| Project | Connection |
|---------|-----------|
| GSD2 | GSD-2 Architecture defines the orchestration layer that consumes skill scores |
| ACE | Compute Engine provides the execution environment for score-engine.ts |
| PMG | Pi-Mono + GSD establishes the single-board deployment context for lightweight scoring |
| GSA | GSD Alignment defines the philosophical framework for quality metrics |
| CMH | Computational Mesh provides the distributed scoring context for federated skill registries |
| K8S | Kubernetes provides container orchestration patterns for CI/CD score gates |
| MCF | Multi-Cluster Federation defines the cross-cluster skill scoring protocol |
| MGU | Module Governance provides the governance framework for score-based promotion |

---

## 19. Sources

1. Chen, M. et al. "Evaluating Large Language Models Trained on Code." arXiv:2107.03374, 2021.
2. Anthropic. "Claude Code: Skills Documentation." docs.anthropic.com, 2025.
3. caliber-ai-org. "ai-setup: README.md." GitHub, v1.29.4, 2026.
4. Hunt, A. & Thomas, D. *The Pragmatic Programmer.* Addison-Wesley, 2019. Ch. 21: "Testing."
5. GitHub. "GitHub Actions: Workflow Syntax." docs.github.com, 2025.
6. Ouyang, L. et al. "Training language models to follow instructions." arXiv:2203.02155, 2022.
7. Google. "Engineering Practices: Code Review Speed." google.github.io/eng-practices, 2024.
8. caliber-ai-org. "CALIBER_LEARNINGS.md: Scoring Category Calibration Notes." GitHub, 2026.
9. Anthropic. "Claude Code: CLAUDE.md Specification." docs.anthropic.com, 2025.
10. caliber-ai-org. "CALIBER_LEARNINGS.md: Token Budget Analysis." GitHub, 2026.
11. Git Project. "git-ls-files Documentation." git-scm.com, 2025.
12. caliber-ai-org. "src/scoring/accuracy.ts: Path Freshness Implementation." GitHub, 2026.
13. OWASP. "Secret Management Cheat Sheet." cheatsheetseries.owasp.org, 2024.
14. caliber-ai-org. "src/commands/refresh.ts: Score Regression Guard." GitHub, 2026.
15. caliber-ai-org. "CALIBER_LEARNINGS.md: Session Learning Pipeline." GitHub, 2026.
16. caliber-ai-org. "src/commands/refresh.ts: Three-Layer Diff Analysis." GitHub, 2026.
17. caliber-ai-org. "TODOS.md: Multi-Platform Roadmap." GitHub, 2026.
18. Tibsfox. "gsd-chipset-architecture-vision.md." gsd-skill-creator, 2026.
19. caliber-ai-org. "src/scoring/fix-data.ts: Structured Fix Generation." GitHub, 2026.
20. caliber-ai-org. "src/scoring/history.ts: Score History JSONL." GitHub, 2026.
