# Tutorial: CI/CD Integration

[Back to Getting Started](../GETTING-STARTED.md) | [Previous: Calibration](calibration.md)

**Time:** 10 minutes
**Prerequisites:** Skills validated and tested locally

---

## Introduction

Integrating skill-creator into your CI/CD pipeline catches quality issues before they reach production. Automated validation ensures skills follow the official format, detects conflicts early, and verifies activation accuracy.

### What You Will Learn

1. Understand CI capabilities and exit codes
2. Use JSON output mode for machine-readable results
3. Create a basic GitHub Actions workflow
4. Add quality gates for activation accuracy
5. Set up a complete skill quality pipeline

This tutorial focuses on GitHub Actions but the concepts apply to other CI platforms.

---

## Step 1: Understand CI Capabilities

skill-creator provides several commands designed for CI integration:

| Command | CI Use Case | Exit Code Behavior |
|---------|-------------|-------------------|
| `validate` | Check skill format | Exit 1 if invalid |
| `detect-conflicts` | Find semantic overlap | Exit 1 if HIGH severity |
| `test run` | Verify activation | Exit 1 if failures or thresholds exceeded |
| `benchmark` | Measure accuracy | Exit 1 if correlation < 85% |

### Exit Codes for CI

All commands return meaningful exit codes:

| Code | Meaning |
|------|---------|
| 0 | Success - all checks passed |
| 1 | Failure - issues detected |

This enables CI pipelines to fail on skill quality issues:

```bash
skill-creator validate --all || exit 1
```

> **Checkpoint:** Review the exit codes section in [CLI: Exit Codes](../CLI.md#exit-codes). Understand which exit code each command returns and when.

---

## Step 2: JSON Output Mode

CI pipelines require machine-readable output. skill-creator supports JSON output for all CI-relevant commands.

### Enabling JSON Output

**Explicit flag:**
```bash
skill-creator detect-conflicts --json
skill-creator test run --all --json
```

**Environment variable:**
```bash
export CI=true
skill-creator test run --all
# Automatically outputs JSON
```

When `CI=true` is detected, commands automatically switch to JSON output.

### Example JSON Outputs

**detect-conflicts --json:**
```json
{
  "conflicts": [
    {
      "skill1": "commit-helper",
      "skill2": "git-workflow",
      "similarity": 0.92,
      "severity": "high"
    }
  ],
  "threshold": 0.85,
  "scanned": 5
}
```

**test run --json:**
```json
{
  "skill": "my-skill",
  "metrics": {
    "total": 10,
    "passed": 8,
    "failed": 2,
    "accuracy": 80.0,
    "falsePositiveRate": 10.0
  },
  "results": [...]
}
```

> **Checkpoint:** Run `skill-creator validate --all --json` locally. Verify that the output is valid JSON and contains the expected fields.

---

## Step 3: Create Basic Workflow

Create a GitHub Actions workflow that validates skills on every push and pull request.

### File: `.github/workflows/skill-quality.yml`

This annotated example explains each line:

```yaml
# .github/workflows/skill-quality.yml
# Purpose: Validate skills on every PR to catch quality issues early

name: Skill Quality                    # Name shown in GitHub Actions UI

on:
  push:
    branches: [main]                   # Run on pushes to main
  pull_request:
    branches: [main]                   # Run on PRs targeting main

jobs:
  validate:
    runs-on: ubuntu-latest             # GitHub-hosted runner
    steps:
      - uses: actions/checkout@v4      # Check out repository

      - name: Setup Node.js            # skill-creator requires Node 18+
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install skill-creator    # Install globally
        run: npm install -g skill-creator

      - name: Validate skills          # Exit 1 if invalid
        run: skill-creator validate --all
```

**Key annotations:**

| Line | Purpose |
|------|---------|
| `on: push/pull_request` | Trigger on code changes |
| `runs-on: ubuntu-latest` | Use GitHub's Linux runners |
| `node-version: '20'` | Node.js 18+ required |
| `validate --all` | Check all skills, exit 1 on failure |

> **Checkpoint:** Create this file in your repository at `.github/workflows/skill-quality.yml`.

---

## Step 4: Add Quality Gates

Extend the workflow with conflict detection and activation tests:

```yaml
      - name: Check conflicts          # Exit 1 if high-severity
        run: skill-creator detect-conflicts --json

      - name: Run activation tests     # Quality gates
        run: skill-creator test run --all --min-accuracy=90 --max-false-positive=5
```

### Quality Gate Flags

The `test run` command supports threshold flags:

| Flag | Purpose | Example |
|------|---------|---------|
| `--min-accuracy=N` | Require minimum N% accuracy | `--min-accuracy=90` |
| `--max-false-positive=N` | Allow maximum N% false positives | `--max-false-positive=5` |

When thresholds are exceeded, the command exits with code 1, failing the CI pipeline.

### Choosing Threshold Values

| Quality Level | Accuracy | False Positive | Use Case |
|--------------|----------|----------------|----------|
| Strict | 95% | 2% | Production-critical skills |
| Standard | 90% | 5% | Most projects |
| Permissive | 80% | 10% | Early development |

> **Checkpoint:** Add the quality gate steps to your workflow. Set thresholds appropriate for your project (standard: 90% accuracy, 5% false positive).

---

## Step 5: Complete Working Example

Here is a complete GitHub Actions workflow with all quality checks:

```yaml
# .github/workflows/skill-quality.yml
# Complete workflow for skill quality validation
#
# Checks:
# - Skill format validation
# - Semantic conflict detection
# - Activation test accuracy
# - Optional: Benchmark correlation

name: Skill Quality

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      # Check out repository code
      - uses: actions/checkout@v4

      # Set up Node.js runtime
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      # Install project dependencies
      - name: Install dependencies
        run: npm ci

      # Install skill-creator globally
      - name: Install skill-creator
        run: npm install -g skill-creator

      # Validate all skills against official format
      # Exits 1 if any skill has invalid structure or metadata
      - name: Validate skills
        run: skill-creator validate --all

      # Check for semantic conflicts between skills
      # Exits 1 if HIGH severity conflicts detected (>90% similarity)
      - name: Check conflicts
        run: skill-creator detect-conflicts --json

      # Run activation tests with quality gates
      # Exits 1 if accuracy < 90% OR false positive rate > 5%
      - name: Run activation tests
        run: skill-creator test run --all --min-accuracy=90 --max-false-positive=5

      # Optional: Benchmark simulator accuracy
      # May fail if insufficient calibration data
      - name: Benchmark (optional)
        run: skill-creator benchmark
        continue-on-error: true  # Don't fail pipeline on missing data
```

### Workflow Explanation

| Step | Purpose | Failure Condition |
|------|---------|-------------------|
| Validate skills | Format compliance | Invalid YAML, wrong structure |
| Check conflicts | Semantic uniqueness | HIGH severity conflicts |
| Run tests | Activation accuracy | Below quality gates |
| Benchmark | Calibration health | Correlation < 85% (optional) |

> **Checkpoint:** Commit the complete workflow file and push to your repository. The workflow should trigger and run on GitHub Actions.

---

## Step 6: Interpret CI Results

When the workflow runs, GitHub shows the status in the Actions tab.

### Reading GitHub Actions Output

**Green checkmark:** All checks passed

**Red X:** One or more checks failed. Click the job to see details.

### Common Failure Reasons

| Failure | Likely Cause | Fix |
|---------|--------------|-----|
| Validate skills | Invalid skill format | Fix YAML frontmatter, correct name format |
| Check conflicts | Semantic overlap | Differentiate skill descriptions |
| Run tests | Accuracy below threshold | Improve descriptions, add test cases |
| Benchmark | Low correlation | Recalibrate thresholds |

### Debugging Failures

1. Click the failed job in GitHub Actions
2. Expand the failing step to see output
3. Look for specific error messages

For detailed troubleshooting, see [Troubleshooting](../TROUBLESHOOTING.md).

> **Checkpoint:** Verify that your workflow passes on your repository. If it fails, use the debugging steps above to identify and fix issues.

---

## Step 7: Advanced Options

### Selective Validation

Validate only specific skills or paths:

```yaml
- name: Validate project skills only
  run: skill-creator validate --all --project
```

### Caching Node Modules

Speed up workflows by caching dependencies:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
```

### Parallel Jobs for Large Skill Sets

Split validation across multiple jobs:

```yaml
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install -g skill-creator
      - run: skill-creator validate --all

  test:
    runs-on: ubuntu-latest
    needs: validate  # Run after validate passes
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install -g skill-creator
      - run: skill-creator test run --all --min-accuracy=90
```

### Other CI Platforms

The commands work on any CI platform:

**GitLab CI:**
```yaml
skill-quality:
  image: node:20
  script:
    - npm install -g skill-creator
    - skill-creator validate --all
    - skill-creator detect-conflicts --json
    - skill-creator test run --all --min-accuracy=90
```

**Jenkins:**
```groovy
pipeline {
    agent { docker { image 'node:20' } }
    stages {
        stage('Quality') {
            steps {
                sh 'npm install -g skill-creator'
                sh 'skill-creator validate --all'
                sh 'skill-creator detect-conflicts --json'
                sh 'skill-creator test run --all --min-accuracy=90'
            }
        }
    }
}
```

---

## Summary

In this tutorial, you learned to:

1. **Understand CI capabilities** - Commands designed for automation with meaningful exit codes
2. **Use JSON output** - Machine-readable output for CI pipelines
3. **Create basic workflow** - GitHub Actions to validate skills on every PR
4. **Add quality gates** - Threshold flags for accuracy and false positive rate
5. **Complete pipeline** - Full workflow with validation, conflict detection, tests, and benchmarking

### Key Takeaways

- **Fail fast:** Catch quality issues in CI before they affect production
- **Quality gates:** Set accuracy thresholds appropriate for your project
- **Exit codes:** All commands return 0/1 for CI integration
- **JSON output:** Auto-enabled with `CI=true` environment variable

### Next Steps

- [Architecture Documentation](../architecture/README.md) - Understand system internals
- [API Reference](../API.md) - Build custom integrations programmatically

---

[Back to Getting Started](../GETTING-STARTED.md) | [Previous: Calibration](calibration.md)
