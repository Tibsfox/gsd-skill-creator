# Changelog

All notable changes to gsd-skill-creator are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

(No unreleased changes)

---

## [1.6.1] - 2026-02-07

### Added

- 34 DevOps/SRE/Platform examples from Skills-and-Agents repository
- 13 new skills: agent-orchestration, chaos-engineering, compliance-governance, file-operation-patterns, finops-patterns, gitops-patterns, incident-response, infrastructure-as-code, kubernetes-patterns, monitoring-observability, platform-engineering, release-management, sre-patterns
- 14 new agents: capacity-planner, compliance-auditor, cost-optimizer, dependency-health-checker, deployment-validator, drift-detector, incident-analyzer, infrastructure-auditor, pipeline-analyzer, release-risk-scorer, runbook-executor, slo-monitor, test-orchestrator, vulnerability-triager
- 7 new teams: devops-pipeline-team, incident-response-team, infrastructure-review-team, platform-onboarding-team, release-management-team, security-audit-team, sre-operations-team
- Local installation of all new examples as usable `.claude/` skills, agents, and teams
- Total examples now 65 across 35+ domains (up from 34 across 26 domains)

---

## [1.6.0] - 2026-02-07

### Added

- 34 cross-domain examples: 20 skills, 8 agents, 3 teams spanning 26 domains
- beautiful-commits skill for professional Conventional Commits with semantic structure
- GSD-complementary examples: gsd-explain, gsd-preflight, gsd-onboard, gsd-migrate, gsd-trace (skills); gsd-health-checker, gsd-plan-optimizer, gsd-milestone-advisor (agents)
- General-purpose skills: api-design, docker-patterns, sql-patterns, ci-cd-patterns, hook-recipes, accessibility-patterns, dependency-audit, env-setup, context-handoff, decision-framework
- General-purpose agents: codebase-navigator, security-reviewer, performance-profiler, changelog-generator, doc-linter
- General-purpose teams: code-review-team (5 parallel reviewers), doc-generation-team (4 writers), migration-team (5 mixed-access members)
- Local installation of all examples as usable `.claude/` skills, agents, and teams
- Taches-CC-Resources integration: decision-framework, context-handoff, hook-recipes, security-reviewer, doc-linter

### Fixed

- Audit findings from GSD adversarial debugging team
- Documentation updates for v1.5 pattern discovery

---

## [1.5.0] - 2026-02-07

### Added

- Pattern discovery pipeline: scan Claude Code session logs for recurring interaction patterns
- Streaming JSONL parser handling all 7 entry types (user, assistant, progress, file-history-snapshot, system, summary, queue-operation)
- Session enumerator from sessions-index.json across all projects under `~/.claude/projects/`
- User prompt classifier with 4-layer noise filtering (97% of user entries are tool results/meta)
- Incremental corpus scanner with watermark-based change detection
- Scan state persistence with atomic writes (write-tmp-then-rename) and Zod validation
- Tool sequence n-gram extraction (bigrams, trigrams like Read→Edit→Bash)
- Bash command pattern classification across 8 categories (git, build, test, install, search, file-ops, docker, other)
- Pattern aggregator with dual-threshold noise filtering (15+ projects AND 80%+ occurrence)
- Subagent session discovery and inclusion in analysis
- Multi-factor pattern scoring (frequency, cross-project occurrence, recency, consistency)
- Candidate ranking with evidence assembly and Jaccard keyword deduplication against existing skills
- Interactive candidate selection UI with multiselect
- Draft SKILL.md generation with pre-filled workflow steps (tool patterns) or guidelines (Bash patterns)
- DBSCAN clustering algorithm with cosine distance for user prompt grouping
- Epsilon auto-tuning via k-NN knee detection method
- Per-project clustering with cross-project greedy merge
- Prompt embedding cache with content-hash keying
- Cluster-specific 4-factor scoring (size, cross-project, coherence, recency)
- Activation-focused cluster draft generation
- `discover` command (`disc` alias) for full pipeline: scan → extract → cluster → rank → select → draft
- `--exclude <project>` flag for project exclusion during scanning
- `--rescan` flag to force full rescan ignoring stored watermarks
- Inline progress output during scanning (project count, session count, patterns found)

### Technical Details

- 36 public exports from discovery barrel (src/discovery/index.ts)
- Scan state stored at ~/.gsd-skill-creator/discovery/scan-state.json
- Composite keys (projectSlug:sessionId) for cross-project uniqueness
- Log2 frequency scaling capped at 1.0, 14-day half-life for recency decay
- Default scoring weights: frequency 0.25, cross-project 0.30, recency 0.25, consistency 0.20
- Cluster scoring weights: size 0.20, cross-project 0.30, coherence 0.30, recency 0.20

---

## [1.4.0] - 2026-02-05

### Added

- Agent Teams: multi-agent coordination with leader-worker, pipeline, swarm, and custom topologies
- TeamConfig, TeamMember, TeamTask, InboxMessage types with Zod schemas and `.passthrough()` forward compatibility
- TeamStore for team config CRUD in `.claude/teams/`
- Three pattern template generators (leader-worker, pipeline, swarm) with agent file scaffolding
- 7-validator team validation pipeline:
  - Schema validation via Zod with early-return on failure
  - Semantic validation (duplicate IDs, missing lead agent)
  - Topology rules (leader-worker requires exactly one leader)
  - Agent resolution (verify referenced agents exist on disk)
  - Dependency cycle detection (Kahn's algorithm)
  - Tool overlap detection (write tools across members)
  - Skill conflicts + role coherence (description matches role)
- Team CLI commands: `team create`, `team list`, `team validate`, `team spawn`, `team status` (with `tm` alias)
- Interactive and non-interactive team creation modes
- Pre-built GSD workflow templates: parallel research (5 members) and adversarial debugging (4 members)
- Skills vs Agents vs Teams comparison guide (docs/COMPARISON.md)
- GSD Teams guide for teams vs subagents decision framework (docs/GSD-TEAMS.md)
- Team creation tutorial (docs/tutorials/team-creation.md)

### Technical Details

- Errors are blocking (invalid schema, topology violations, cycles); warnings are informational (tool overlap, skill conflicts)
- Tools on TeamMember use index signature cast for forward compatibility
- Pipeline lead role is 'orchestrator', others are 'coordinator'
- Levenshtein distance for fuzzy agent name suggestions on resolution failure

---

## [1.3.0] - 2026-02-05

### Added

- Complete CLI reference documentation with 31 commands, 45 examples, and CI exit codes (docs/CLI.md)
- Comprehensive API reference for 31+ public exports with 79 TypeScript examples (docs/API.md)
- Architecture documentation with 18-layer module breakdown and Mermaid diagrams (docs/architecture/)
- Getting started hub with 5-command quickstart and 4 tutorials (docs/GETTING-STARTED.md)
- 4 example skills demonstrating best practices (git-commit, code-review, test-generator, typescript-patterns)
- Skill creation tutorial: end-to-end walkthrough (docs/tutorials/skill-creation.md)
- Conflict detection tutorial: detecting and resolving overlaps (docs/tutorials/conflict-detection.md)
- Calibration tutorial: optimizing activation thresholds (docs/tutorials/calibration.md)
- CI integration tutorial: GitHub Actions with exit codes (docs/tutorials/ci-integration.md)
- Hub-and-spoke documentation navigation with cross-references
- Centralized troubleshooting guide (docs/TROUBLESHOOTING.md)
- Common workflows documentation (docs/WORKFLOWS.md)

---

## [1.2.0] - 2026-02-05

### Added

- Test case CRUD: `test add`, `test list`, `test edit`, `test delete` commands
- Test execution via `test run` command with accuracy and false positive rate metrics
- Auto-generated test cases via `test generate` command
  - Heuristic generation using NLP phrase extraction
  - Cross-skill negative tests from competing skills
  - Optional LLM-enhanced generation with API key
- Activation simulation via `simulate` command
  - Confidence levels: high (85%+), medium (70-84%), low (50-69%), none (<50%)
  - Challenger detection with too-close-to-call warnings
  - Batch processing with progress bar (`--batch` flag)
- Calibration data collection via `calibrate` command
  - F1 score optimization via grid search
  - ThresholdHistory with rollback support
- Benchmark reporting via `benchmark` command
  - MCC (Matthews Correlation Coefficient) correlation metric
  - Recommendation thresholds for FPR, recall, and F1
- ResultStore for historical test result tracking
- TestStore with Zod validation and atomic writes

### Changed

- Default activation threshold from 0.50 to 0.75 (conservative before calibration)
- Too-close-to-call margin set to <2%

### Fixed

- Cross-device link error in atomic writes (temp file now in same directory)

### Technical Details

- Minimum 75 samples required for calibration statistical significance
- Recommendation thresholds: FPR > 10%, recall < 70%, F1 < 70%, data < 100
- Global calibration storage at ~/.gsd-skill/calibration/events.jsonl
- Outcome types: continued/corrected/unknown for behavior inference

---

## [1.1.0] - 2026-02-05

### Added

- Semantic conflict detection between skills with configurable threshold (default 0.85)
- Activation likelihood scoring (0-100) with 5-factor heuristic analysis
- LLM-based deep activation analysis via `--llm` flag
- Local embeddings via @huggingface/transformers for zero API cost
- Embedding cache with content-hash invalidation
- Cache invalidation when embedding model version changes
- `detect-conflicts` CLI command with `--threshold` and `--quiet` options
- `score-activation` CLI command with `--all`, `--verbose`, and `--llm` options
- `reload-embeddings` CLI command for model retry

### Changed

- Graceful degradation to heuristics when embedding model unavailable

### Technical Details

- Cosine similarity calculation for semantic matching
- 5-factor scoring weights: specificity (0.35), pattern (0.25), length (0.20), verb (0.10), penalty (0.10)
- Activation labels: Reliable (90+), Likely (70-89), Uncertain (50-69), Unlikely (<50)
- Dynamic import for SDK dependencies to reduce bundle size
- Never-throw API pattern for graceful degradation

---

## [1.0.0] - 2026-01-31

### Changed

- **Extension fields moved from root level to `metadata.extensions.gsd-skill-creator`**
  - *Rationale:* Keeps official Claude Code namespace clean
  - *Migration:* Auto-migrated on skill update, or run `skill-creator migrate`

- **Skills now use subdirectory format: `.claude/skills/{name}/SKILL.md`**
  - *Rationale:* Allows reference files and scripts alongside skill definition
  - *Migration:* Run `skill-creator migrate` to convert flat-file skills

- **Agent `tools` field now uses comma-separated string format**
  - *Rationale:* Matches official Claude Code agent specification
  - *Migration:* Run `skill-creator migrate-agent` to convert array format

### Added

- Reserved name validation prevents conflicts with built-in commands
- Character budget validation with warnings at 80% and 100%
- Description quality validation for better auto-activation
- User-level and project-level skill scopes
- Agent format validation with auto-correction

### Migration

Run these commands to migrate existing skills and agents:

```bash
# Migrate skill directory structure
skill-creator migrate

# Migrate agent tools field to string format
skill-creator migrate-agent
```

Metadata format auto-migrates on skill save (no command needed).

See [docs/EXTENSIONS.md](docs/EXTENSIONS.md) for detailed migration guide.

---

## [0.1.0] - 2026-01-30

### Added

- Initial release with core skill creation and management
- Session observation and pattern detection
- Skill suggestion based on recurring patterns
- Token budget management
- Feedback-driven skill refinement
- Agent composition from skill clusters

---

[Unreleased]: https://github.com/Tibsfox/gsd-skill-creator/compare/v1.6.1...HEAD
[1.6.1]: https://github.com/Tibsfox/gsd-skill-creator/compare/v1.6...v1.6.1
[1.6.0]: https://github.com/Tibsfox/gsd-skill-creator/compare/v1.5...v1.6
[1.5.0]: https://github.com/Tibsfox/gsd-skill-creator/compare/v1.4...v1.5
[1.4.0]: https://github.com/Tibsfox/gsd-skill-creator/compare/v1.3...v1.4
[1.3.0]: https://github.com/Tibsfox/gsd-skill-creator/compare/v1.2...v1.3
[1.2.0]: https://github.com/Tibsfox/gsd-skill-creator/compare/v1.1...v1.2
[1.1.0]: https://github.com/Tibsfox/gsd-skill-creator/compare/v1.0...v1.1
[1.0.0]: https://github.com/Tibsfox/gsd-skill-creator/compare/v0.1.0...v1.0
[0.1.0]: https://github.com/Tibsfox/gsd-skill-creator/releases/tag/v0.1.0
