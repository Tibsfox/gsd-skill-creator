---
name: wrap:verify
description: Load verification skills before GSD verify-work, then capture verification observations
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Task
---

# /wrap:verify -- Skill-enhanced GSD verify-work

<objective>
Wrap GSD verify-work with automatic skill loading before verification and observation capture after completion. The user runs `/wrap:verify N` where N is the phase number. This command:

1. Reads integration config to check if wrappers are enabled
2. Loads verification-relevant skills, biased toward testing and validation patterns
3. Delegates to the real GSD verify-work command (never reimplements GSD logic)
4. Captures verification observations to sessions.jsonl including outcome data
5. Displays a transparency summary of what was loaded and captured

If skill loading or observation capture fails at any point, the GSD command still runs normally. The wrapper enhances but never blocks.
</objective>

<process>

## Step 0: Parse Arguments

Extract the phase number N from the user's input.

- If the user provided a number (e.g., `/wrap:verify 5`), use that as N.
- If no phase number was provided, read `.planning/STATE.md` using the Read tool and extract the current phase number from the `Phase:` line under `## Current Position`.
- If STATE.md does not exist and no phase number was given, ask the user to specify one: "No phase number provided and STATE.md not found. Please run `/wrap:verify N` with a phase number."

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
Run `/gsd:verify-work N` directly, or enable wrappers by setting
`integration.wrapper_commands` to `true` in the config.
```
Do not proceed to further steps.

**If parsing fails** (malformed JSON, unexpected structure), log the error and proceed with defaults.

---

## Step 2: Load Verification-Relevant Skills (WRAP-06 graceful degradation)

**This entire step is wrapped in error handling.** If ANY part of skill loading fails -- file read errors, glob failures, parsing problems -- log the failure and proceed directly to Step 3. Skill loading must never block GSD verification.

**If `integration.auto_load_skills` is `false`**, skip this step and display:
```
Skill loading disabled in config. Proceeding with base GSD verification.
```

**If enabled (default):**

### 2a. Extract phase domain with verification bias

Read `.planning/ROADMAP.md` using the Read tool. Find the entry for Phase N and extract:
- The phase name/title
- The phase goal or description text
- Any requirement IDs or domain keywords

Determine the phase topic/domain from the goal text. Look for domain keywords such as: "auth", "authentication", "UI", "interface", "API", "endpoint", "test", "testing", "config", "configuration", "database", "schema", "security", "monitoring", "deploy", "CI", "hook", "git", "skill", "pattern", "observation", "wrapper", "command", "install", "validate".

**Verification bias:** In addition to the phase domain keywords, also match skills containing any of the following verification-related terms in their name or description: "test", "verify", "check", "validate", "QA", "lint", "audit", "assert", "spec", "coverage". This ensures testing and verification skills are always considered during verify-work.

### 2b. Scan for matching skills

1. Use the Glob tool to find `*.md` files in `.claude/commands/`
2. Use the Glob tool to find `*/SKILL.md` files in `.claude/skills/`
3. For each skill file found, read its first 10 lines to extract frontmatter (name, description)
4. Match skills whose description or name contains keywords from the phase domain OR verification-related terms
5. Always include skills tagged as always-applicable (e.g., `beautiful-commits`) regardless of domain match

### 2c. Display loaded skills (WRAP-07 transparency)

Display which skills were loaded:
```
### Skills Loaded
- beautiful-commits (always-applicable)
- tdd-workflow (matches verification topic: "test")
Loaded 2 skills for Phase N verification.
```

If no skills match, display:
```
### Skills Loaded
No phase-specific skills found. Proceeding with base GSD verification.
```

If skill scanning encounters an error at any point, display:
```
### Skills Loaded
Skill loading encountered an error. Proceeding without skill enhancement.
```

---

## Step 3: Delegate to GSD verify-work

This is the core step. The wrapper invokes the real GSD command -- it does NOT reimplement any GSD logic.

1. Read the file `.claude/commands/gsd/verify-work.md` using the Read tool
2. **If the file exists:** Follow its instructions with phase number N as the argument. Execute the full GSD verify-work process as documented in that command file.
3. **If the file does NOT exist** (GSD commands stored elsewhere): Use the Task tool to invoke: "Follow the /gsd:verify-work process for phase N. Read the GSD verify-work command from `.claude/get-shit-done/` or wherever GSD stores its commands, and verify phase N."

**CRITICAL:** Do NOT reimplement any GSD logic. The wrapper's sole job at this step is to invoke the real GSD command. All verification checks, requirement validation, truth testing, and report generation are handled by GSD itself.

Wait for the GSD verification to complete before proceeding to Step 4.

---

## Step 4: Capture Verification Observations (WRAP-06 graceful degradation)

**This entire step is wrapped in error handling.** If ANY part of observation capture fails -- command errors, file write failures, JSON formatting issues -- log the failure and skip to Step 5. Observation capture must never block the overall workflow.

**If `integration.observe_sessions` is `false`**, skip this step.

### 4a. Gather verification outcome data

After GSD verify-work completes, gather outcome data:

- Check if a VERIFICATION.md or verification output was produced by the GSD command
- If available, extract:
  - **verification_outcome**: "pass" (all checks passed), "fail" (critical checks failed), or "partial" (some passed, some failed)
  - **truths_checked**: the number of truth/requirement checks that were evaluated
  - **gaps_found**: the number of gaps, failures, or missing items identified
- If verification output is not available or cannot be parsed, use reasonable defaults:
  - `verification_outcome`: "unknown"
  - `truths_checked`: 0
  - `gaps_found`: 0

Also read `.planning/STATE.md` to check the updated phase status after verification.

### 4b. Construct observation entry

Build a JSON observation entry:
```json
{
  "type": "wrapper_verification",
  "timestamp": "[ISO 8601 timestamp]",
  "source": "wrapper",
  "phase": N,
  "wrapper": "verify",
  "skills_loaded": ["skill1", "skill2"],
  "verification_outcome": "pass|fail|partial",
  "truths_checked": M,
  "gaps_found": K
}
```

### 4c. Append to sessions.jsonl

Create the directory if it does not exist:
```bash
mkdir -p .planning/patterns
```

Append the observation as a single compact JSON line:
```bash
echo '{"type":"wrapper_verification","timestamp":"...","source":"wrapper","phase":N,"wrapper":"verify","skills_loaded":[...],"verification_outcome":"...","truths_checked":M,"gaps_found":K}' >> .planning/patterns/sessions.jsonl
```

**If any part of observation capture fails**, display:
```
Observation capture encountered an error. Verification completed normally.
```
And continue to Step 5.

---

## Step 4.5: Run Monitoring Scan (MON-03)

After verification completes and observations are captured, run a monitoring scan.

If `integration.phase_transition_hooks` is `true`:

1. Read `.planning/patterns/scan-state.json` for previous state
2. Check STATE.md for transitions (verification may mark phase as verified)
3. Check ROADMAP.md for status changes
4. Run plan-vs-summary diff for the verified phase if SUMMARY exists
5. Write scan observations to sessions.jsonl with `"source": "scan"`
6. Update scan-state.json

If the scan encounters errors, proceed to Step 5 without blocking.

---

## Step 5: Transparency Summary (WRAP-07)

Display a summary of everything the wrapper did:

```
---
### Wrapper Summary
- **Skills loaded:** 2 (beautiful-commits, tdd-workflow)
- **GSD command:** /gsd:verify-work N
- **Observation captured:** Yes (wrapper_verification entry appended to sessions.jsonl)
- **Monitoring scan:** [N observations detected] or [no changes] or [skipped]
- **Verification outcome:** pass (M truths checked, K gaps found)
- **Phase status:** [current status from STATE.md]
```

If skills were not loaded (disabled or error), show "Skills loaded: 0 (disabled)" or "Skills loaded: 0 (error during loading)".

If observation was not captured (disabled or error), show "Observation captured: No (disabled)" or "Observation captured: No (error during capture)".

If verification outcome is unknown, show "Verification outcome: unknown (could not parse GSD output)".

</process>

<success_criteria>
- Verification-relevant skills are loaded before GSD verify-work runs, with bias toward test/verify/check/validate/QA skills
- GSD verify-work is invoked via the real command file (not reimplemented)
- Verification observations are captured to sessions.jsonl with "source": "wrapper" and "type": "wrapper_verification"
- Observation includes verification_outcome, truths_checked, and gaps_found when available
- Integration config is read from skill-creator.json and the wrapper_commands toggle is respected
- The auto_load_skills toggle controls skill loading behavior
- The observe_sessions toggle controls observation capture behavior
- Skill loading failures do not block GSD verification (WRAP-06)
- Observation capture failures do not block the overall workflow (WRAP-06)
- Missing config file defaults to all features enabled (opt-out model)
- Transparency summary shows what skills were loaded, verification outcome, and what observations were captured (WRAP-07)
- Phase number can be auto-detected from STATE.md when not provided
</success_criteria>
