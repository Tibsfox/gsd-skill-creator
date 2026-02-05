# Changelog

All notable changes to gsd-skill-creator are documented in this file.

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

## [0.1.0] - 2026-01-30

### Added

- Initial release with core skill creation and management
- Session observation and pattern detection
- Skill suggestion based on recurring patterns
- Token budget management
- Feedback-driven skill refinement
- Agent composition from skill clusters
