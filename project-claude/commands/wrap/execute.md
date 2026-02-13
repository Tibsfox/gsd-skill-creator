---
name: wrap:execute
description: Load phase-relevant skills before GSD execute-phase, then capture execution observations
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Task
---

# /wrap:execute -- Skill-enhanced GSD execute-phase

<objective>
Wrap GSD execute-phase with automatic skill loading before execution and observation capture after completion. The user runs `/wrap:execute N` where N is the phase number. This command:

1. Reads integration config to check if wrappers are enabled
2. Loads phase-relevant skills based on the phase domain/topic
3. Delegates to the real GSD execute-phase command (never reimplements GSD logic)
4. Captures execution observations to sessions.jsonl for pattern detection
5. Displays a transparency summary of what was loaded and captured

If skill loading or observation capture fails at any point, the GSD command still runs normally. The wrapper enhances but never blocks.
</objective>

<process>

## Step 0: Parse Arguments

Extract the phase number N from the user's input.

- If the user provided a number (e.g., `/wrap:execute 5`), use that as N.
- If no phase number was provided, read `.planning/STATE.md` using the Read tool and extract the current phase number from the `Phase:` line under `## Current Position`.
- If STATE.md does not exist and no phase number was given, ask the user to specify one: "No phase number provided and STATE.md not found. Please run `/wrap:execute N` with a phase number."

Store N for use in all subsequent steps.

---

## Step 1: Read Integration Config (WRAP-05)

Read `.planning/skill-creator.json` using the Read tool.

**If the file does not exist:**
Proceed with all features enabled. This follows the opt-out model: everything defaults to `true`.
- `wrapper_commands`: true (default)
- `auto_load_skills`: true (default)
- `observe_sessions`: true (default)

**If the file exists, parse it and extract:**
- `integration.wrapper_commands` -- the master toggle for all wrapper commands
- `integration.auto_load_skills` -- controls whether skills are loaded in Step 2
- `integration.observe_sessions` -- controls whether observations are captured in Step 4

**If `integration.wrapper_commands` is explicitly `false`:**
Display the following message and stop:
```
Wrapper commands are disabled in `.planning/skill-creator.json`.
Run `/gsd:execute-phase N` directly, or enable wrappers by setting
`integration.wrapper_commands` to `true` in the config.
```
Do not proceed to further steps.

**If parsing fails** (malformed JSON, unexpected structure), log the error and proceed with defaults.

---

## Step 2: Load Phase-Relevant Skills (WRAP-06 graceful degradation)

**This entire step is wrapped in error handling.** If ANY part of skill loading fails -- file read errors, glob failures, parsing problems -- log the failure and proceed directly to Step 3. Skill loading must never block GSD execution.

**If `integration.auto_load_skills` is `false`**, skip this step and display:
```
Skill loading disabled in config. Proceeding with base GSD execution.
```

**If enabled (default):**

### 2a. Extract phase domain

Read `.planning/ROADMAP.md` using the Read tool. Find the entry for Phase N and extract:
- The phase name/title
- The phase goal or description text
- Any requirement IDs or domain keywords

Determine the phase topic/domain from the goal text. Look for keywords such as: "auth", "authentication", "UI", "interface", "API", "endpoint", "test", "testing", "config", "configuration", "database", "schema", "security", "monitoring", "deploy", "CI", "hook", "git", "skill", "pattern", "observation", "wrapper", "command", "install", "validate".

### 2b. Scan for matching skills

1. Use the Glob tool to find `*.md` files in `.claude/commands/`
2. Use the Glob tool to find `*/SKILL.md` files in `.claude/skills/`
3. For each skill file found, read its first 10 lines to extract frontmatter (name, description)
4. Match skills whose description or name contains keywords from the phase domain
5. Always include skills tagged as always-applicable (e.g., `beautiful-commits`) regardless of domain match

### 2c. Display loaded skills (WRAP-07 transparency)

Display which skills were loaded:
```
### Skills Loaded
- beautiful-commits (always-applicable)
- tdd-workflow (matches phase topic: "testing")
Loaded 2 skills for Phase N execution.
```

If no skills match the phase domain, display:
```
### Skills Loaded
No phase-specific skills found. Proceeding with base GSD execution.
```

If skill scanning encounters an error at any point, display:
```
### Skills Loaded
Skill loading encountered an error. Proceeding without skill enhancement.
```

---

## Step 3: Delegate to GSD execute-phase

This is the core step. The wrapper invokes the real GSD command -- it does NOT reimplement any GSD logic.

1. Read the file `.claude/commands/gsd/execute-phase.md` using the Read tool
2. **If the file exists:** Follow its instructions with phase number N as the argument. Execute the full GSD execute-phase process as documented in that command file.
3. **If the file does NOT exist** (GSD commands stored elsewhere): Use the Task tool to invoke: "Follow the /gsd:execute-phase process for phase N. Read the GSD execute-phase command from `.claude/get-shit-done/` or wherever GSD stores its commands, and execute phase N."

**CRITICAL:** Do NOT reimplement any GSD logic. The wrapper's sole job at this step is to invoke the real GSD command. All planning, execution, commits, state updates, and verification are handled by GSD itself.

Wait for the GSD execution to complete before proceeding to Step 4.

---

## Step 4: Capture Execution Observations (WRAP-06 graceful degradation)

**This entire step is wrapped in error handling.** If ANY part of observation capture fails -- command errors, file write failures, JSON formatting issues -- log the failure and skip to Step 5. Observation capture must never block the overall workflow.

**If `integration.observe_sessions` is `false`**, skip this step.

### 4a. Gather execution outcome data

Run the following commands using the Bash tool:

```bash
git log --oneline -20 --since="2 hours ago"
```
Count the number of commits produced during execution.

```bash
git diff --stat HEAD~5..HEAD 2>/dev/null
```
Count the number of files changed.

Read `.planning/STATE.md` to check the updated phase status after execution.

### 4b. Construct observation entry

Build a JSON observation entry:
```json
{
  "type": "wrapper_execution",
  "timestamp": "[ISO 8601 timestamp]",
  "source": "wrapper",
  "phase": N,
  "wrapper": "execute",
  "skills_loaded": ["skill1", "skill2"],
  "commits_during": M,
  "files_changed": K,
  "phase_status": "in_progress|complete"
}
```

### 4c. Append to sessions.jsonl

Create the directory if it does not exist:
```bash
mkdir -p .planning/patterns
```

Append the observation as a single compact JSON line:
```bash
echo '{"type":"wrapper_execution","timestamp":"...","source":"wrapper","phase":N,"wrapper":"execute","skills_loaded":[...],"commits_during":M,"files_changed":K,"phase_status":"..."}' >> .planning/patterns/sessions.jsonl
```

**If any part of observation capture fails**, display:
```
Observation capture encountered an error. Execution completed normally.
```
And continue to Step 5.

---

## Step 4.5: Run Monitoring Scan (MON-03)

After execution completes and observations are captured, run a monitoring scan to detect what changed during execution.

If `integration.phase_transition_hooks` is `true` (from Step 1 config):

1. Read `.planning/patterns/scan-state.json` for previous state
2. Check STATE.md for phase transitions (did the phase complete during execution?)
3. Check ROADMAP.md for structural changes
4. If the phase just completed and PLAN/SUMMARY files exist, run plan-vs-summary diff
5. Write any scan observations to sessions.jsonl with `"source": "scan"`
6. Update scan-state.json

This scan captures the execution's impact on GSD planning artifacts. The observations complement the wrapper_execution entry from Step 4.

If the scan encounters errors, proceed to Step 5 without blocking.

---

## Step 5: Transparency Summary (WRAP-07)

Display a summary of everything the wrapper did:

```
---
### Wrapper Summary
- **Skills loaded:** 2 (beautiful-commits, tdd-workflow)
- **GSD command:** /gsd:execute-phase N
- **Observation captured:** Yes (wrapper_execution entry appended to sessions.jsonl)
- **Monitoring scan:** [N observations detected] or [no changes] or [skipped]
- **Phase status:** [current status from STATE.md]
```

If skills were not loaded (disabled or error), show "Skills loaded: 0 (disabled)" or "Skills loaded: 0 (error during loading)".

If observation was not captured (disabled or error), show "Observation captured: No (disabled)" or "Observation captured: No (error during capture)".

</process>

<success_criteria>
- Phase-relevant skills are loaded before GSD execute-phase runs
- GSD execute-phase is invoked via the real command file (not reimplemented)
- Execution observations are captured to sessions.jsonl with "source": "wrapper" and "type": "wrapper_execution"
- Integration config is read from skill-creator.json and the wrapper_commands toggle is respected
- The auto_load_skills toggle controls skill loading behavior
- The observe_sessions toggle controls observation capture behavior
- Skill loading failures do not block GSD execution (WRAP-06)
- Observation capture failures do not block the overall workflow (WRAP-06)
- Missing config file defaults to all features enabled (opt-out model)
- Transparency summary shows what skills were loaded and what observations were captured (WRAP-07)
- Phase number can be auto-detected from STATE.md when not provided
</success_criteria>
