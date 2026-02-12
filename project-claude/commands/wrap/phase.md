---
name: wrap:phase
description: Smart router that detects phase state and delegates to the appropriate wrapper (plan, execute, or verify)
allowed-tools:
  - Read
  - Bash
  - Glob
  - Task
---

# /wrap:phase -- Smart phase router

<objective>
Detect the current state of phase N and route to the appropriate wrapper command. If
the phase has no plans, route to `/wrap:plan`. If plans exist but execution is incomplete,
route to `/wrap:execute`. If execution is complete, route to `/wrap:verify`. This eliminates
the need for users to remember which GSD phase lifecycle stage they are in.

The user runs `/wrap:phase N` where N is the phase number, and the router automatically
determines what needs to happen next.
</objective>

<process>

## Step 0: Parse Arguments

Extract the phase number **N** from the user's input (e.g., `/wrap:phase 5` means N = 5).

If no phase number is provided:
1. Read `.planning/STATE.md` using the Read tool
2. Extract the current phase number from the `Phase:` line under `## Current Position`
3. If no phase can be determined, ask the user: "Which phase? Provide a phase number."

---

## Step 1: Read Integration Config (WRAP-05)

Read `.planning/skill-creator.json` using the Read tool.

- **If the file does not exist:** Proceed with defaults (all features enabled per opt-out model).
- **If the file exists:** Parse JSON and extract:
  - `integration.wrapper_commands` — master toggle for wrapper behavior

**If `integration.wrapper_commands` is `false`:**
Display:
```
Wrapper commands are disabled in skill-creator.json.
Use GSD commands directly:
- /gsd:plan-phase N -- Create plans
- /gsd:execute-phase N -- Execute plans
- /gsd:verify-work N -- Verify completed work
```
Then stop -- do not continue to further steps.

**If parsing fails:** Log the error and proceed with defaults (enabled).

---

## Step 2: Detect Phase State

This is the core router logic. Read multiple artifacts to determine where phase N sits
in the GSD lifecycle.

### 2a: Read ROADMAP.md

Read `.planning/ROADMAP.md` using the Read tool. Find the section for Phase N and extract:
- Phase name and goal
- Status markers: look for "Complete", "In Progress", "Pending" indicators
- Plan count: look for a `Plans:` section with `- [ ]` (pending) and `- [x]` (done) items

### 2b: Check for PLAN Files

Use Glob to find `.planning/phases/{N}-*/{N}-*-PLAN.md` (substituting the actual phase
number for N). Count how many PLAN.md files exist.

### 2c: Check for SUMMARY Files

Use Glob to find `.planning/phases/{N}-*/{N}-*-SUMMARY.md`. Count how many SUMMARY.md
files exist. Each SUMMARY represents a completed plan execution.

### 2d: Check for VERIFICATION File

Use Glob to find `.planning/phases/{N}-*/{N}-*-VERIFICATION.md`. Check whether a
verification file exists. Its presence means the phase has been through user acceptance.

### 2e: Read STATE.md

Read `.planning/STATE.md` using the Read tool. Check:
- `Status:` line — current overall status
- `Plan:` line — current plan progress (e.g., "02 of 5 complete")
- Session Continuity section — any next action hints

---

## Step 3: Route Decision

Apply this decision tree based on the state detected in Step 2:

```
if ROADMAP shows phase as "Complete":
  -> Inform user: "Phase N is already complete."
  -> Suggest: /wrap:verify N (for re-verification)

elif no PLAN files found:
  -> Route to: /wrap:plan N
  -> Reason: "Phase N has no plans yet. Routing to /wrap:plan."

elif SUMMARY count < PLAN count:
  -> Route to: /wrap:execute N
  -> Reason: "Phase N has M plans, K executed. Routing to /wrap:execute."

elif SUMMARY count == PLAN count AND no VERIFICATION file:
  -> Route to: /wrap:verify N
  -> Reason: "Phase N execution complete. Routing to /wrap:verify."

elif VERIFICATION file exists:
  -> Inform user: "Phase N appears fully done (plans executed and verified)."
  -> Suggest: /wrap:verify N (for re-verification) or move to next phase
```

**Graceful fallback (WRAP-06):** If state detection fails -- for example, ROADMAP.md cannot
be read, Glob returns errors, or the file structure is unexpected -- fall back to asking the
user which operation they want:

```
Could not determine phase N state. Please choose:
- /wrap:plan N -- Create plans
- /wrap:execute N -- Execute plans
- /wrap:verify N -- Verify completed work
```

---

## Step 4: Display Routing Decision (WRAP-07 Transparency)

Before delegating, show the user what was detected and why:

```
### Phase N State Detection

| Check          | Result                    |
|----------------|---------------------------|
| Phase          | N -- [phase name]         |
| PLAN files     | M found                   |
| SUMMARY files  | K found                   |
| VERIFICATION   | [exists / not found]      |
| ROADMAP status | [Complete / In Progress / Pending] |

**Decision:** Routing to `/wrap:[plan|execute|verify] N`
**Reason:** [human-readable explanation of why this route was chosen]
```

---

## Step 5: Delegate to Chosen Wrapper

Invoke the appropriate wrapper command based on the routing decision from Step 3.

Use the Task tool to delegate:
- If routing to plan: `Run /wrap:plan N`
- If routing to execute: `Run /wrap:execute N`
- If routing to verify: `Run /wrap:verify N`

If the Task tool is not available, instruct directly:
"Now follow the `/wrap:[chosen] N` command process."

The delegated wrapper will handle its own skill loading, GSD delegation, and observation
capture -- the phase router's job is only detection and routing.

**Note:** Monitoring scans (MON-03) are handled by the delegated wrapper command (wrap:plan, wrap:execute, or wrap:verify). The phase router does not run its own scan.

</process>

<success_criteria>
- Phase state is correctly detected from ROADMAP.md, PLAN files, SUMMARY files, and VERIFICATION files
- Routing decision is displayed transparently with a state detection table
- Correct wrapper (wrap:plan, wrap:execute, or wrap:verify) is invoked based on lifecycle state
- Graceful fallback when state detection fails -- user is offered manual choice
- Integration config (skill-creator.json) is read and the wrapper_commands toggle is respected
- STATE.md is consulted for current position when no phase number is provided
- Already-complete phases are handled with appropriate suggestions
</success_criteria>
