# Tutorial: Creating and Using Agent Teams

[Back to Getting Started](../GETTING-STARTED.md) | [Previous: CI Integration](ci-integration.md)

**Time:** 10 minutes
**Prerequisites:** skill-creator installed ([Installation Guide](../../INSTALL.md))

---

## What You Will Learn

By the end of this tutorial, you will be able to:

- Choose the right team pattern for your use case
- Create a team using the interactive wizard or CLI flags
- Validate team configuration for correctness
- Check team spawn readiness (agent file resolution)
- Review team details and validation status

## What You Will Build

A working leader-worker team with 3 members, validated and ready to use with Claude Code.

---

## Step 1: Choose a Team Pattern

Agent teams use one of three coordination patterns. Choose based on your workflow.

| Pattern | Structure | Best For |
|---------|-----------|----------|
| leader-worker | One lead delegates to workers | Task distribution, code reviews |
| pipeline | Stages execute in sequence | Data processing, build pipelines |
| swarm | Peers coordinate as equals | Research, brainstorming, exploration |

For this tutorial, we use **leader-worker** -- the most common pattern, where a lead agent assigns tasks to specialized workers.

> **Checkpoint:** Decide which pattern fits your use case. If unsure, start with leader-worker.

---

## Step 2: Create the Team

### Option A: Interactive Wizard

Run the creation wizard:

```bash
skill-creator team create
```

The wizard prompts for:

1. **Pattern** -- Select leader-worker, pipeline, or swarm
2. **Name** -- Lowercase with hyphens (e.g., `code-review-team`)
3. **Description** -- What the team does
4. **Number of workers** -- How many worker agents (default: 3)
5. **Scope** -- project (default) or user

### Option B: CLI Flags (Non-Interactive)

Create directly with flags:

```bash
skill-creator team create --pattern=leader-worker --name=code-review-team --members=3
```

The shorthand alias also works:

```bash
skill-creator tm c --pattern=leader-worker --name=code-review-team
```

After creation, you see:

```
Team created: code-review-team
Location: .claude/teams/code-review-team/
```

> **Checkpoint:** Verify the team exists by listing all teams:
>
> ```bash
> skill-creator team list
> ```
>
> You should see your new team in the output table with its pattern and member count.

---

## Step 3: Validate the Team

Validation checks that your team configuration is structurally correct -- valid schema, consistent lead agent, no duplicate IDs, and proper topology.

Run validation:

```bash
skill-creator team validate code-review-team
```

### Interpreting Results

**All checks pass:**

```
PASS code-review-team
```

**Errors found:**

```
FAIL code-review-team
  ERROR: leadAgentId "missing-agent" does not match any member agentId
  Did you mean: lead, worker-alpha?
```

### Common Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| leadAgentId mismatch | Lead agent ID not in members list | Update leadAgentId to match a member's agentId |
| Duplicate agentIds | Two members share the same agentId | Give each member a unique agentId |
| Schema validation | Missing required fields | Ensure name, members, and leadAgentId are present |

To validate all teams at once:

```bash
skill-creator team validate --all
```

> **Checkpoint:** Validation should pass with no errors.
>
> ```
> PASS code-review-team
> ```
>
> If validation fails, fix the reported issues before continuing.

---

## Step 4: Check Spawn Readiness

Spawn readiness verifies that each team member's agent file exists on disk. Even a valid configuration needs agent files to work.

```bash
skill-creator team spawn code-review-team
```

### All Agents Resolved

```
Team 'code-review-team' is ready. 4 members resolved: lead, worker-alpha, worker-beta, worker-gamma
```

### Missing Agents

If agents are missing, the command shows which files are needed and offers to generate them:

```
3 agent(s) resolved:
  + lead .claude/agents/lead.md

1 agent(s) not found:
  x Agent 'worker-delta' not found.
    Did you mean: worker-alpha, worker-beta?

? Generate missing agent file for 'worker-delta'? (Y/n)
```

> **Checkpoint:** All members should resolve. If any are missing, accept the interactive generation prompt or create the agent files manually.

---

## Step 5: Review Team Status

The status command provides a comprehensive view of your team -- configuration details, member table, and validation summary in one output.

```bash
skill-creator team status code-review-team
```

### Example Output

```
  Team: code-review-team
  Pattern: leader-worker
  Lead Agent: lead
  Created: 2026-02-06

  Members (4):
    Agent ID          Name                Type            Model
    lead              Lead Coordinator    coordinator     opus
    worker-alpha      Worker Alpha        worker          sonnet
    worker-beta       Worker Beta         worker          sonnet
    worker-gamma      Worker Gamma        worker          sonnet

  Validation: PASS (0 errors, 0 warnings)
```

For machine-readable output, use `--json` or `--quiet`:

```bash
skill-creator team status code-review-team --json
skill-creator tm s code-review-team -q
```

> **Checkpoint:** Status shows all members, correct pattern, and validation passing with 0 errors.

---

## Step 6: Use the Team with Claude Code

With a validated, spawn-ready team, you can reference it in your Claude Code workflows.

### Reference in Agent Instructions

Point your orchestrator agent to the team configuration:

```markdown
## Team: code-review-team

Use the code-review-team for distributed code review tasks.
Delegate security review to worker-alpha, performance review to worker-beta,
and style review to worker-gamma.
```

### The Complete Workflow

```
Choose pattern --> Create team --> Validate --> Spawn check --> Status --> Use
```

Each step catches a different class of issues:

| Step | What It Catches |
|------|-----------------|
| Validate | Schema errors, topology problems, duplicate IDs |
| Spawn | Missing agent files, unresolvable references |
| Status | Overview of full configuration and health |

> **Checkpoint:** You have a validated, spawn-ready team. Integrate it into your Claude Code agent workflows.

---

## Summary

### What You Accomplished

- Chose a team pattern based on your coordination needs
- Created a team with the interactive wizard or CLI flags
- Validated the team configuration for structural correctness
- Verified all agent files exist with spawn readiness
- Reviewed the full team status and details

### Key Takeaways

| Principle | Why It Matters |
|-----------|----------------|
| Choose the right pattern | leader-worker, pipeline, and swarm solve different coordination problems |
| Validate before using | Catches schema errors, ID mismatches, and topology issues early |
| Check spawn readiness | A valid config still needs agent files on disk to work |
| Use status for overview | Single command shows config, members, and health at a glance |

### Command Reference

| Task | Command |
|------|---------|
| Create team | `skill-creator team create` |
| List teams | `skill-creator team list` |
| Validate team | `skill-creator team validate <name>` |
| Check readiness | `skill-creator team spawn <name>` |
| View details | `skill-creator team status <name>` |

### Next Steps

- [CLI Reference](../CLI.md) -- Full command documentation for all team commands
- [API Reference](../API.md) -- Programmatic access to team creation and validation
- [GSD Teams Guide](../GSD-TEAMS.md) -- When to use teams vs subagents in GSD workflows

---

[Back to Getting Started](../GETTING-STARTED.md) | [Previous: CI Integration](ci-integration.md)
