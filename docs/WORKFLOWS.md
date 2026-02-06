# Common Workflows

This guide documents common workflows for the skill lifecycle: creation, validation, testing, and deployment. For command details, see [CLI Reference](CLI.md).

**Navigation:** [Getting Started](GETTING-STARTED.md) | [CLI Reference](CLI.md) | [Troubleshooting](TROUBLESHOOTING.md)

---

## Table of Contents

- [Skill Creation Workflow](#skill-creation-workflow)
- [Quality Assurance Workflow](#quality-assurance-workflow)
- [Testing Workflow](#testing-workflow)
- [Calibration Workflow](#calibration-workflow)
- [Team Management Workflow](#team-management-workflow)
- [Configuration Options](#configuration-options)
- [CI/CD Workflow](#cicd-workflow)

---

## Skill Creation Workflow

The standard flow for creating and deploying a skill.

### Overview

```
Create -> Validate -> Test -> Deploy
```

### Step 1: Create the Skill

Run the interactive wizard:

```bash
skill-creator create
```

For project-specific skills:

```bash
skill-creator create --project
```

**Key considerations:**
- Use descriptive names (lowercase, hyphens): `git-commit-helper`, `react-patterns`
- Write activation-friendly descriptions: "Use when..." or "Activate when..."
- Include specific keywords users might mention

See [CLI: create](CLI.md#create) for all options.

### Step 2: Validate Structure

Ensure the skill follows the official format:

```bash
skill-creator validate my-skill
```

Validation checks:
1. Name format (lowercase, hyphens, no reserved names)
2. Directory structure (`skill-name/SKILL.md`)
3. Metadata schema (valid YAML frontmatter)
4. Directory/name match

See [CLI: validate](CLI.md#validate) for details.

### Step 3: Generate and Run Tests

Create test cases automatically:

```bash
skill-creator test generate my-skill
```

Run the test suite:

```bash
skill-creator test run my-skill
```

Target 80%+ accuracy before deployment.

See [CLI: test](CLI.md#test) for test management.

### Step 4: Deploy

Skills are active immediately after creation. Verify activation behavior:

```bash
skill-creator simulate "your test prompt"
```

Check which skill would activate for a given prompt.

---

## Quality Assurance Workflow

Ensure skill quality before and after deployment.

### Overview

```
Validate -> Detect Conflicts -> Score Activation
```

### Validation

Check all skills at once:

```bash
skill-creator validate --all
```

For project-level skills:

```bash
skill-creator validate --all --project
```

### Conflict Detection

Find skills with overlapping descriptions that may cause activation confusion:

```bash
skill-creator detect-conflicts
```

**Interpreting results:**

| Severity | Similarity | Action |
|----------|------------|--------|
| HIGH | >90% | Review immediately - likely activation conflict |
| MEDIUM | 85-90% | Worth reviewing - possible overlap |

The command suggests description rewrites to differentiate conflicting skills.

**Adjust sensitivity:**

```bash
# Stricter threshold (fewer false positives)
skill-creator detect-conflicts --threshold=0.90

# Looser threshold (catch more potential conflicts)
skill-creator detect-conflicts --threshold=0.80
```

See [CLI: detect-conflicts](CLI.md#detect-conflicts) for options.

### Activation Scoring

Predict how reliably a skill will activate:

```bash
skill-creator score-activation my-skill
```

**Score interpretation:**

| Label | Score | Meaning |
|-------|-------|---------|
| Reliable | 90+ | Very likely to auto-activate correctly |
| Likely | 70-89 | Good chance of correct activation |
| Uncertain | 50-69 | May need description improvement |
| Unlikely | <50 | Needs significant improvement |

**Get detailed breakdown:**

```bash
skill-creator score-activation my-skill --verbose
```

Shows factors affecting the score: specificity, trigger phrases, length, imperative verbs.

See [CLI: score-activation](CLI.md#score-activation) for details.

---

## Testing Workflow

Verify skill activation behavior with automated tests.

### Overview

```
Generate -> Run -> Analyze
```

### Test Generation

Generate test cases from skill descriptions:

```bash
skill-creator test generate my-skill
```

Options:
- `--count=N`: Generate N tests per type (default: 5)
- `--no-review`: Save all without interactive review
- `--no-llm`: Use heuristic generation only

### Test Execution

Run tests for a single skill:

```bash
skill-creator test run my-skill
```

Run tests for all skills:

```bash
skill-creator test run --all
```

**Verbose output with confidence scores:**

```bash
skill-creator test run my-skill --verbose
```

### Quality Gates

Enforce minimum accuracy standards:

```bash
skill-creator test run --all --min-accuracy=90 --max-false-positive=5
```

Exit code 1 if thresholds are not met.

### Result Interpretation

| Metric | Meaning | Target |
|--------|---------|--------|
| Accuracy | Percentage of correct predictions | >80% |
| False Positives | Skill activated when it shouldn't | <10% |
| False Negatives | Skill didn't activate when it should | <15% |

### Manual Simulation

Test specific prompts interactively:

```bash
skill-creator simulate "commit my changes"
skill-creator simulate "run database migrations" --verbose
```

See [CLI: simulate](CLI.md#simulate) for batch simulation.

---

## Calibration Workflow

Optimize activation thresholds based on real usage data.

### When to Calibrate

Calibration is useful when:
- Test accuracy is below 80%
- Skills activate too aggressively (false positives)
- Skills don't activate when expected (false negatives)
- You have accumulated 75+ calibration events

### Overview

```
Use Skills -> Accumulate Data -> Calibrate -> Benchmark
```

### Step 1: Accumulate Calibration Data

Calibration events are recorded automatically during normal skill usage. The system tracks:
- Which skill activated
- Whether you continued (correct) or corrected (wrong)
- Similarity scores for all skills

Check your calibration data:

```bash
skill-creator benchmark
```

Requires at least 75 events with known outcomes.

### Step 2: Preview Calibration

See proposed threshold changes without applying:

```bash
skill-creator calibrate --preview
```

Shows current vs optimal threshold with expected improvement.

### Step 3: Apply Calibration

Apply the optimized threshold:

```bash
skill-creator calibrate
```

Confirm when prompted, or use `--force` to skip confirmation.

### Step 4: Verify Improvement

Measure real-world accuracy:

```bash
skill-creator benchmark --verbose
```

Shows correlation, precision, recall, and per-skill breakdown.

### Rollback

If calibration makes things worse:

```bash
skill-creator calibrate rollback
```

View threshold history:

```bash
skill-creator calibrate history
```

For advanced threshold tuning, see [Architecture: Extending](architecture/extending.md#threshold-tuning).

---

## Team Management Workflow

Create, validate, and deploy multi-agent teams for parallel coordination tasks.

### Overview

```
Create -> Validate -> Check Spawn Readiness -> Deploy
```

### Step 1: Create Team

Use the interactive wizard or non-interactive mode to define a team.

**Interactive (wizard):**

```bash
skill-creator team create
```

Follow the prompts to choose a name, topology (leader-worker, pipeline, swarm), and configure team members.

**Non-interactive (scripted):**

```bash
skill-creator team create --name=research-team --pattern=leader-worker
```

**Key considerations:**
- Team names follow the same lowercase-hyphen format as skills
- Choose topology based on coordination needs (see [GSD Teams Guide](GSD-TEAMS.md) for guidance)
- Each team requires at least one leader/coordinator and one worker member

See [CLI: team create](CLI.md#teams-multi-agent-coordination) for all options.

### Step 2: Validate Configuration

Check that the team configuration is correct and complete:

```bash
skill-creator team validate my-team
```

Validation checks:
1. Schema validity (required fields, types)
2. Lead agent ID references a valid member
3. No duplicate agent IDs
4. Topology rules satisfied (correct agent types for pattern)
5. No circular dependencies in pipeline topologies
6. Tool overlap warnings (multiple members writing to same files)
7. Skill conflict detection across members
8. Role coherence (members have distinct responsibilities)

**Validate all teams:**

```bash
skill-creator team validate --all
```

See [CLI: team validate](CLI.md#teams-multi-agent-coordination) for output format and options.

### Step 3: Check Spawn Readiness

Verify that all agent files exist and are ready to deploy:

```bash
skill-creator team spawn my-team
```

Spawn readiness checks:
- All member agent files exist on disk
- Agent file content matches team configuration
- Lead agent has coordination tools configured

**If not ready:** The command reports which files are missing and offers to regenerate them.

Returns exit code 0 when ready, exit code 1 when issues found.

### Step 4: Review and Deploy

Review team status and deploy:

```bash
# Check team status and configuration summary
skill-creator team status my-team

# List all configured teams
skill-creator team list
```

Teams are active once agent files are in place. The lead agent coordinates member agents during execution.

**Verify team is operational:**

```bash
skill-creator team status my-team
```

Shows member count, topology, validation status, and spawn readiness.

---

## Configuration Options

Key configuration settings for skill behavior.

### Scope Configuration

Skills can exist at user or project level.

| Scope | Location | Flag |
|-------|----------|------|
| User | `~/.claude/skills/` | (default) |
| Project | `.claude/skills/` | `--project` or `-p` |

**Create at project level:**

```bash
skill-creator create --project
```

**List by scope:**

```bash
skill-creator list --scope=user
skill-creator list --scope=project
skill-creator list --scope=all  # default
```

### Threshold Configuration

Default thresholds:

| Setting | Default | Description |
|---------|---------|-------------|
| Activation threshold | 0.75 | Minimum similarity for skill activation |
| Conflict threshold | 0.85 | Minimum similarity to flag as conflict |

**Override for specific commands:**

```bash
skill-creator test run --threshold=0.80
skill-creator detect-conflicts --threshold=0.90
```

Thresholds are stored in `~/.gsd-skill/calibration/threshold.json` after calibration.

### JSON Output Mode

Enable JSON output for scripting and CI:

```bash
skill-creator detect-conflicts --json
skill-creator score-activation --all --json
skill-creator test run --all --json
```

JSON output is auto-enabled in CI environments (`CI=true`).

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Enables LLM-powered features (conflict suggestions, test generation) |
| `CI` | Auto-enables JSON output for test run |

---

## CI/CD Workflow

Integrate skill validation into your CI/CD pipeline.

### Overview

Add skill quality checks to pull requests:
1. Validate all skills
2. Check for conflicts
3. Run activation tests
4. Benchmark accuracy (optional)

### GitHub Actions Example

For a complete working example, see [CLI: CI Integration](CLI.md#ci-integration).

**Key commands for CI:**

```bash
# Exit 1 if any skill invalid
skill-creator validate --all

# Exit 1 if HIGH severity conflicts
skill-creator detect-conflicts --json

# Exit 1 if accuracy below threshold
skill-creator test run --all --min-accuracy=90 --max-false-positive=5

# Exit 1 if correlation below 85%
skill-creator benchmark
```

### Exit Codes

| Command | Exit 0 | Exit 1 |
|---------|--------|--------|
| validate | All pass | Any failure |
| detect-conflicts | No HIGH severity | HIGH severity found |
| test run | Pass + thresholds met | Failures or thresholds exceeded |
| benchmark | Correlation >= 85% | Correlation < 85% |

See [CLI: Exit Codes](CLI.md#exit-codes) for complete reference.

### Detailed Tutorial

For step-by-step CI setup with annotated examples, see [CI Integration Tutorial](tutorials/ci-integration.md).

---

## See Also

- [CLI Reference](CLI.md) - Complete command documentation
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions
- [Getting Started](GETTING-STARTED.md) - Installation and quickstart

---

*Workflows Reference for Dynamic Skill Creator*
