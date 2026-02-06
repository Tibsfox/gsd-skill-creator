# Getting Started

Dynamic Skill Creator helps you build a personalized knowledge base for Claude Code. It observes your usage patterns, suggests skills when workflows repeat, and manages skills throughout their lifecycle. This guide covers installation, a quickstart tutorial, and navigation to deeper tutorials.

**New in v1.4:** Agent Teams support -- create, validate, and deploy multi-agent teams with leader-worker, pipeline, or swarm topologies. See the [Team Creation Tutorial](tutorials/team-creation.md) and [GSD Teams Guide](GSD-TEAMS.md).

For a complete feature overview, see the [README](../README.md).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quickstart](#quickstart)
- [Next Steps](#next-steps)
- [Getting Help](#getting-help)

---

## Prerequisites

Before using skill-creator, ensure you have the required software installed.

**Required:**

| Software | Minimum Version | Check Command |
|----------|-----------------|---------------|
| Node.js | 18.x | `node --version` |
| npm | 8.x | `npm --version` |
| Git | Any recent | `git --version` |

**Verify your system:**

```bash
node --version   # Expected: v18.0.0 or higher
npm --version    # Expected: 8.0.0 or higher
git --version    # Expected: git version 2.x.x
```

**Installation:** See [Installation Guide](../INSTALL.md) for detailed setup instructions, including platform-specific prerequisites and troubleshooting.

---

## Quickstart

Create, validate, and test your first skill in 5 commands.

### 1. Install skill-creator

Clone the repository and build the CLI:

```bash
git clone <repository-url> gsd-skill-creator
cd gsd-skill-creator
npm install && npm run build && npm link
```

> **Checkpoint:** After installation, verify the CLI is available:
> ```
> skill-creator --version
> ```
> You should see the version number (e.g., `1.2.0`).

### 2. Create your first skill

Run the interactive skill creation wizard:

```bash
skill-creator create
```

Follow the prompts:
1. **Name:** Enter `my-first-skill` (lowercase, hyphens only)
2. **Description:** Enter `Use when learning about skill-creator. Activate when user mentions tutorial, getting started, or first skill.`
3. **Content:** Enter instructions or knowledge for the skill

> **Checkpoint:** After creation, you should see:
> ```
> Skill created: my-first-skill
> Location: ~/.claude/skills/my-first-skill/SKILL.md
> ```
>
> Verify with: `skill-creator list`
> Your new skill should appear in the list.

### 3. Validate the skill

Check that the skill follows the official Claude Code format:

```bash
skill-creator validate my-first-skill
```

> **Checkpoint:** You should see:
> ```
> Validating skill: my-first-skill
>
> [PASS] Name format valid
> [PASS] Directory structure valid
> [PASS] Metadata schema valid
> [PASS] Directory/name match
>
> Validation passed
> ```
>
> If any checks fail, the output explains what needs fixing.

### 4. Generate test cases

Create automated test cases to verify activation behavior:

```bash
skill-creator test generate my-first-skill
```

This generates test cases based on your skill description. Review each generated test and approve, edit, or skip.

> **Checkpoint:** After generation, you should see:
> ```
> Generated 10 test cases for my-first-skill
>
> Positive tests: 5
> Negative tests: 5
>
> Tests saved to: ~/.claude/skills/my-first-skill/tests.json
> ```
>
> Verify with: `skill-creator test list my-first-skill`

### 5. Run tests

Execute the test suite to verify activation accuracy:

```bash
skill-creator test run my-first-skill
```

> **Checkpoint:** You should see results like:
> ```
> Running tests for: my-first-skill
>
> [PASS] "tell me about getting started" (positive, 87.2%)
> [PASS] "tutorial for skill-creator" (positive, 91.5%)
> [PASS] "delete all files" (negative, 12.3%)
> ...
>
> Results: 9/10 passed (90% accuracy)
> False positives: 0
> False negatives: 1
> ```
>
> Accuracy above 80% indicates a well-configured skill. See [Troubleshooting](./TROUBLESHOOTING.md) if tests fail unexpectedly.

---

## Next Steps

After completing the quickstart, explore these tutorials for deeper learning.

### Tutorials

| Tutorial | Time | What You Learn |
|----------|------|----------------|
| [Skill Creation](tutorials/skill-creation.md) | 15 min | Create, validate, and test skills end-to-end |
| [Conflict Detection](tutorials/conflict-detection.md) | 10 min | Find and resolve semantic conflicts between skills |
| [Calibration](tutorials/calibration.md) | 10 min | Optimize activation thresholds for better accuracy |
| [CI Integration](tutorials/ci-integration.md) | 10 min | Add skill validation to CI/CD pipelines |
| [Team Creation](tutorials/team-creation.md) | 20 min | Create and deploy multi-agent teams |

### Reference Documentation

| Document | Description |
|----------|-------------|
| [CLI Reference](CLI.md) | Full command reference for all 24+ commands |
| [API Reference](API.md) | Programmatic API for library consumers |
| [Official Format](OFFICIAL-FORMAT.md) | Claude Code skill format specification |
| [Extensions](EXTENSIONS.md) | Extended frontmatter fields for advanced features |
| [Architecture](architecture/README.md) | System architecture and data flows |
| [GSD Teams Guide](GSD-TEAMS.md) | When to use teams vs subagents in GSD workflows |

### Common Workflows

| Workflow | Commands |
|----------|----------|
| Check skill quality | `validate` -> `detect-conflicts` -> `score-activation` |
| Test activation | `test generate` -> `test run` -> `simulate` |
| Optimize thresholds | `calibrate --preview` -> `calibrate` -> `benchmark` |

See [Workflows](WORKFLOWS.md) for detailed workflow documentation.

---

## Getting Help

### Troubleshooting

For common issues and solutions, see [Troubleshooting](TROUBLESHOOTING.md).

Common issues covered:
- Command not found after installation
- Skill not activating as expected
- Validation failures
- Test generation problems

### Reporting Issues

If you encounter a bug or have a feature request:

1. Check [existing issues](https://github.com/anthropics/skill-creator/issues) first
2. Include the following in your report:
   - skill-creator version (`skill-creator --version`)
   - Node.js version (`node --version`)
   - Operating system
   - Full error message
   - Steps to reproduce

### Getting Support

- **Documentation:** Start with this guide and linked tutorials
- **CLI Help:** Run `skill-creator help` or `skill-creator <command> --help`
- **Examples:** See `examples/` directory for working skill examples

---

*Getting Started Guide for Dynamic Skill Creator*
