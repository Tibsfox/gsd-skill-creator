---
name: wrap:plan
description: Load planning-relevant skills before GSD plan-phase for more informed phase plans
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Task
---

# /wrap:plan -- Skill-enhanced GSD plan-phase

<objective>
Wrap GSD plan-phase with automatic skill loading before planning begins. The user runs
`/wrap:plan N` where N is the phase number. This loads planning-relevant skills and prior
phase context that inform the planning process, then delegates to the real GSD plan-phase
command. If skill loading fails at any point, the GSD command still runs normally.
</objective>

<process>

## Step 0: Parse Arguments

Extract the phase number **N** from the user's input (e.g., `/wrap:plan 3` means N = 3).

If no phase number is provided:
1. Read `.planning/STATE.md` using the Read tool
2. Look for the `Next action:` line in the Session Continuity section
3. If the next action references `plan-phase N`, use that N
4. If no phase can be determined, ask the user: "Which phase should I plan? Provide a phase number."

---

## Step 1: Read Integration Config (WRAP-05)

Read `.planning/skill-creator.json` using the Read tool.

- **If the file does not exist:** Proceed with defaults (all features enabled per opt-out model).
- **If the file exists:** Parse JSON and extract:
  - `integration.wrapper_commands` — master toggle for wrapper behavior
  - `integration.auto_load_skills` — whether to scan and load skills
  - `integration.observe_sessions` — whether to capture observation entries

**If `integration.wrapper_commands` is `false`:**
Display:
```
Wrapper commands are disabled in skill-creator.json.
Run `/gsd:plan-phase N` directly instead.
```
Then stop — do not continue to further steps.

**If parsing fails:** Log the error and proceed with all defaults (enabled).

---

## Step 2: Load Planning-Relevant Skills (WRAP-06 Graceful Degradation)

This entire step is wrapped in error handling. If ANY part of this step fails or encounters
an error, log the issue and proceed directly to Step 3. Skill loading failure must never
block GSD planning.

### 2a: Extract Phase Context from ROADMAP

Read `.planning/ROADMAP.md` using the Read tool. Find the section for Phase N and extract:
- Phase name and description
- Phase goal
- Associated requirements

Determine the phase domain from goal keywords (e.g., "security", "testing", "config",
"monitoring", "commands", "integration").

### 2b: Scan for Planning-Relevant Skills

If `auto_load_skills` is `true` (default):

1. Use Glob to find `.claude/commands/*.md` and `.claude/skills/*/SKILL.md`
2. Read each skill's YAML frontmatter (the content between `---` markers)
3. Match skills that are relevant to planning by checking for:
   - Domain keywords matching the phase goal
   - Planning-specific keywords: "plan", "architecture", "design", "structure", "requirements"
   - Always-applicable skills (e.g., commit conventions, code style)
4. Build a list of matched skill names

If no skills match: Note "No phase-specific skills found."
If scanning fails: Note "Skill scanning encountered an error."

### 2c: Scan Prior Phase SUMMARYs

Load context from completed phases that share the same subsystem or domain:

1. Use Glob to find `.planning/phases/*/**-SUMMARY.md`
2. For each SUMMARY found, read its frontmatter to check `subsystem` and `tags` fields
3. Match SUMMARYs whose subsystem or tags overlap with the Phase N domain
4. Select the 2-3 most relevant SUMMARYs (prioritize same subsystem, then overlapping tags)

### 2d: Display Loaded Context (WRAP-07 Transparency)

Display what was loaded:
```
### Planning Context Loaded
- **Skills:** beautiful-commits, architecture-patterns (N skills)
- **Prior phases:** Phase 82 (config), Phase 85 (slash commands) -- relevant SUMMARYs found
Loaded N skills and M prior phase contexts for planning.
```

If no skills matched:
```
No phase-specific skills found. Proceeding with base GSD planning.
```

If scanning encountered an error:
```
Context loading encountered an error. Proceeding without skill enhancement.
```

---

## Step 3: Delegate to GSD plan-phase

This is the core delegation step. Do NOT reimplement GSD planning logic.

1. Read `.claude/commands/gsd/plan-phase.md` using the Read tool
2. If the file exists, follow its instructions with phase number N
3. If the file does not exist, use the Task tool:
   ```
   Follow the /gsd:plan-phase process for phase N.
   ```

Pass along any phase context gathered in Step 2 (loaded skills, prior SUMMARY insights) as
additional context for the planning process.

---

## Step 4: Post-Planning Observation (Minimal)

After GSD plan-phase completes, capture a brief observation if enabled.

Check `integration.observe_sessions` from the config (default: `true`).

If enabled, append an observation entry to `.planning/patterns/sessions.jsonl`:

```json
{
  "type": "wrapper_planning",
  "timestamp": "[ISO 8601 timestamp]",
  "source": "wrapper",
  "phase": N,
  "wrapper": "plan",
  "skills_loaded": ["skill1", "skill2"],
  "plans_created": M
}
```

- Create the `.planning/patterns/` directory if it does not exist
- Append one JSON line to `sessions.jsonl` (create the file if it does not exist)
- If observation capture fails, display a note and continue without error

### Monitoring Scan (MON-03)

After capturing the planning observation, run a monitoring scan:

If `integration.phase_transition_hooks` is `true`:
1. Check STATE.md for transitions since last scan
2. Check ROADMAP.md for structural changes (plan-phase may have updated it)
3. Write any scan observations to sessions.jsonl with `"source": "scan"`
4. Update scan-state.json

This captures ROADMAP.md changes that occur during planning (new plans added, phase structure updated).

---

## Step 5: Transparency Summary (WRAP-07)

Display a final summary of what the wrapper did:

```
---
### Wrapper Summary
- **Skills loaded:** N (list of names)
- **Prior context:** M relevant phase SUMMARYs
- **GSD command:** /gsd:plan-phase N
- **Observation captured:** Yes/No
```

</process>

<success_criteria>
- Planning-relevant skills are loaded before GSD plan-phase runs
- Prior phase SUMMARYs are scanned for relevant context
- GSD plan-phase is invoked (not reimplemented)
- Integration config (skill-creator.json) is read and the wrapper_commands toggle is respected
- Skill loading failures do not block planning -- graceful degradation throughout
- Transparency summary shows what was loaded and what GSD command was run
- Observation entry is captured to sessions.jsonl when enabled
</success_criteria>
