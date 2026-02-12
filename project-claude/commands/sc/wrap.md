---
name: sc:wrap
description: List available wrapper commands and explain integration level choices
allowed-tools:
  - Read
  - Glob
---

# /sc:wrap -- List available wrapper commands and integration level choices

<objective>
Display documentation for the four wrapper commands that enhance GSD phase operations with skill loading and observation capture. Show the current integration level based on config toggles and explain how to change it.
</objective>

<process>

## Step 1: Read integration config

Read `.planning/skill-creator.json` using the Read tool.

If the file is missing, use defaults:
```json
{
  "integration": {
    "auto_load_skills": true,
    "observe_sessions": true,
    "phase_transition_hooks": true,
    "suggest_on_session_start": true,
    "install_git_hooks": true,
    "wrapper_commands": true
  }
}
```

Check `integration.wrapper_commands` toggle. If it is `false`, display:

```
Wrapper commands are disabled in your integration config.

To enable them, set `wrapper_commands: true` in `.planning/skill-creator.json`:

  {
    "integration": {
      "wrapper_commands": true
    }
  }

Or run: npx skill-creator config set integration.wrapper_commands true
```

Then stop -- do not display the wrapper command listing.

## Step 2: List available wrapper commands

Display the four wrapper commands with descriptions:

```
## Available Wrapper Commands

Wrapper commands extend GSD phase operations with automatic skill loading
and observation capture. Use them in place of the standard `/gsd:*` equivalents.

| Command | Wraps | What It Adds |
|---------|-------|--------------|
| `/wrap:execute N` | `/gsd:execute-phase N` | Loads relevant skills before execution, captures observations after |
| `/wrap:verify N` | `/gsd:verify-work N` | Loads testing skills before verification, records verification observations |
| `/wrap:plan N` | `/gsd:plan-phase N` | Loads planning skills before plan creation |
| `/wrap:phase N` | Auto-detects | Smart router: detects if phase needs planning, execution, or verification |
```

### Command details

For each wrapper, provide a brief explanation:

**`/wrap:execute N`** -- Before running `/gsd:execute-phase N`, loads skills relevant
to the phase's domain (e.g., testing skills for test-heavy phases, framework skills
for UI phases). After execution completes, captures phase outcome observations to
`.planning/patterns/sessions.jsonl`.

**`/wrap:verify N`** -- Before running `/gsd:verify-work N`, loads verification and
testing skills. After verification, records pass/fail observations and any patterns
noticed during the verification process.

**`/wrap:plan N`** -- Before running `/gsd:plan-phase N`, loads planning-related skills
and scans prior phase summaries for relevant context. This helps produce more informed
plans that leverage learned patterns.

**`/wrap:phase N`** -- Smart router that detects the current state of phase N and
delegates to the appropriate wrapper. If the phase has no plans, routes to
`/wrap:plan`. If plans exist but are not executed, routes to `/wrap:execute`.
If execution is complete, routes to `/wrap:verify`.

## Step 3: Explain integration levels

Display a comparison of the three integration levels:

```
## Integration Levels

### Level 1: Slash Commands Only (default)

Use `/sc:start`, `/sc:status`, `/sc:suggest`, `/sc:digest`, `/sc:observe`.
GSD commands (`/gsd:*`) work normally without modification.
skill-creator observes passively via the post-commit git hook.

**Best for:** Users who want skill management without changing their GSD workflow.

### Level 2: Slash Commands + Wrappers

Use `/wrap:execute`, `/wrap:verify`, `/wrap:plan`, `/wrap:phase` instead of
`/gsd:execute-phase`, `/gsd:verify-work`, `/gsd:plan-phase`.
Skills are automatically loaded before phases. Observations are captured after phases.

**Best for:** Users who want deeper integration with automatic skill loading.

### Level 3: Full Integration

All features enabled: slash commands, wrappers, passive monitoring, phase
transition hooks, and automatic session-start suggestions.
`/sc:start` runs comprehensive checks. Post-commit hooks capture observations.
Pattern detection proposes skills automatically.

**Best for:** Power users who want maximum learning and automation.
```

## Step 4: Show current integration level

Determine the current level based on config toggles:

- Read `integration.auto_load_skills`, `integration.wrapper_commands`, `integration.observe_sessions`, `integration.phase_transition_hooks` from the config.

Level determination logic:
- **Level 3** if `auto_load_skills` AND `wrapper_commands` AND `observe_sessions` AND `phase_transition_hooks` are all `true`
- **Level 2** if `wrapper_commands` is `true` (regardless of other toggles)
- **Level 1** otherwise (wrapper_commands is false or missing)

Display:

```
## Your Current Level

**Level [N]: [Level Name]**

Active toggles:
- auto_load_skills: [enabled/disabled]
- wrapper_commands: [enabled/disabled]
- observe_sessions: [enabled/disabled]
- phase_transition_hooks: [enabled/disabled]
- suggest_on_session_start: [enabled/disabled]
- install_git_hooks: [enabled/disabled]
```

## Step 5: Show how to change

```
## Changing Your Integration Level

Edit `.planning/skill-creator.json` to toggle features on or off.

To validate your config after changes:

  npx skill-creator config validate

To view current config:

  npx skill-creator config show

To set individual values:

  npx skill-creator config set integration.wrapper_commands true
  npx skill-creator config set integration.observe_sessions false
```

</process>

<success_criteria>
- All four wrapper commands (wrap:execute, wrap:verify, wrap:plan, wrap:phase) are listed with descriptions
- Three integration levels are clearly explained with use-case guidance
- Current integration level is detected from skill-creator.json config
- Active toggle states are displayed for transparency
- Gracefully handles disabled wrapper_commands toggle (shows enable instructions)
- Gracefully handles missing config file (uses defaults)
- Instructions for changing integration level are provided
</success_criteria>
