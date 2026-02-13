---
name: sc:suggest
description: Review pending skill suggestions interactively -- accept, dismiss, or defer
allowed-tools:
  - Read
  - Write
  - Bash
---

# /sc:suggest -- Review pending skill suggestions interactively

<objective>
Present pending skill suggestions one at a time in an interactive review loop. For each suggestion, the user chooses to accept (create a skill), dismiss (reject the pattern), defer (revisit later), or stop reviewing. Updates are written atomically to suggestions.json after each decision.
</objective>

<process>

## Step 1: Read integration config

Read `.planning/skill-creator.json` using the Read tool. Extract `suggestions.min_occurrences` (default: 3) and `integration.suggest_on_session_start` (informational only).

If the config file is missing, use defaults:
```json
{
  "suggestions": { "min_occurrences": 3 },
  "integration": { "suggest_on_session_start": true }
}
```

Note: This command runs regardless of the `suggest_on_session_start` toggle since the user explicitly invoked it. The toggle only controls whether suggestions are surfaced automatically during `/sc:start`.

## Step 2: Load suggestions

Read `.planning/patterns/suggestions.json` using the Read tool.

**If the file does not exist or is empty**, display the following and stop:

```
No pending suggestions.

Patterns will be detected as you work and commit. The post-commit hook captures
observations to `.planning/patterns/sessions.jsonl`, and the pattern detection
pipeline proposes skills when recurring patterns reach the configured threshold.
```

**If the file exists**, parse it as a JSON array of suggestion objects.

## Step 3: Filter for pending suggestions

From the loaded suggestions array, filter entries where `state === "pending"`.

**If no suggestions are pending**, display a summary and stop:

```
All suggestions have been reviewed.

Total suggestions: N
- Accepted: X
- Dismissed: Y
- Deferred: Z
```

## Step 4: Present suggestions one at a time

Sort pending suggestions by `candidate.occurrences` descending (most-observed patterns first).

For each pending suggestion, display:

```
---

## Suggestion: [candidate.description or candidate.id]

**Pattern:** [candidate.pattern or candidate.description]
**Occurrences:** N times (first seen: [candidate.firstSeen], last seen: [candidate.lastSeen])
**Confidence:** [high if occurrences >= 2 * min_occurrences, medium if >= min_occurrences, low otherwise]
**Proposed skill:** [candidate.proposedSkill or brief description of what skill would do]

Source files: [candidate.sourceFiles if available, or "various"]
```

Then ask the user to choose one of:

- **accept** -- Mark this suggestion as accepted and guide the user to create the skill
- **dismiss** -- Reject this pattern; it won't be suggested again
- **defer** -- Skip for now; will reappear in a future session
- **stop** -- Stop reviewing; remaining suggestions stay pending

## Step 5: Handle user choice

### On accept:

1. Read `.planning/patterns/suggestions.json`
2. Find the entry matching the current suggestion's `candidate.id`
3. Update: set `state` to `"accepted"`, set `decidedAt` to current ISO timestamp
4. Write the updated array back to `.planning/patterns/suggestions.json`
5. Display:
   ```
   Suggestion accepted. To create the skill, run:

     npx skill-creator create "[suggested skill name]"

   Or describe the skill you want and I'll help draft it.
   ```

### On dismiss:

1. Read `.planning/patterns/suggestions.json`
2. Find the entry matching the current suggestion's `candidate.id`
3. Update: set `state` to `"dismissed"`, set `decidedAt` to current ISO timestamp, optionally set `dismissReason` if the user provides one
4. Write the updated array back to `.planning/patterns/suggestions.json`
5. Display: "Suggestion dismissed."

### On defer:

1. Read `.planning/patterns/suggestions.json`
2. Find the entry matching the current suggestion's `candidate.id`
3. Update: set `deferredAt` to current ISO timestamp (keep `state` as `"pending"` but record deferral so it is not shown again this session)
4. Write the updated array back to `.planning/patterns/suggestions.json`
5. Display: "Suggestion deferred. It will reappear in a future session."

### On stop:

1. Display: "Review stopped. N remaining suggestions are still pending."
2. Exit the review loop.

**Important:** After each decision (accept/dismiss/defer), immediately read-modify-write `suggestions.json` to persist the change. This atomic update prevents data loss if the session ends unexpectedly.

## Step 6: Display review summary

After all pending suggestions have been reviewed (or the user chose stop), display:

```
---

## Review Complete

Reviewed: N suggestions this session
- Accepted: A
- Dismissed: D
- Deferred: F
- Remaining: R (still pending)

Run `/sc:status` to see updated budget. Run `/sc:suggest` again to review remaining.
```

</process>

<success_criteria>
- Pending suggestions are loaded from .planning/patterns/suggestions.json
- Each suggestion is presented individually with pattern details and occurrence count
- User can accept, dismiss, defer, or stop for each suggestion
- suggestions.json is updated atomically after each decision (read-modify-write)
- Gracefully handles missing suggestions.json file
- Gracefully handles empty suggestions or no pending suggestions
- Review summary shows counts of each action taken
- Accepted suggestions include guidance to create the skill
</success_criteria>
