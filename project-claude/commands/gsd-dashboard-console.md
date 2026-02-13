---
name: gsd-dashboard-console
description: Checks dashboard console inbox at GSD lifecycle boundaries and handles milestone-submit, config-update, and question-response messages. Use when running GSD workflows with the dashboard active.
---

# GSD Dashboard Console

## Overview

This skill integrates the dashboard console message bridge into GSD workflows. At key lifecycle checkpoints, Claude checks for incoming messages from the dashboard and processes them. Claude can also emit questions and status updates back to the dashboard.

The console uses a filesystem-based message bus at `.planning/console/` with inbox, outbox, config, and uploads directories. Messages are JSON envelopes with id, type, timestamp, source, and payload fields.

## Lifecycle Checkpoints

At these GSD lifecycle boundaries, run `bash scripts/console/check-inbox.sh` to check for pending messages:

1. **Session start** -- Before any GSD work begins, check if the dashboard has queued messages (milestone submissions, config changes, question responses). This ensures nothing submitted while Claude was offline gets missed.

2. **Phase boundary** -- After completing a phase (plan execution, verification), check inbox before starting the next phase. This is the natural pause point where dashboard input is most actionable.

3. **Post-verification** -- After `/gsd:verify-work` completes, check for any dashboard responses or config updates. Verification often triggers user feedback via the dashboard.

If `check-inbox.sh` exits 0, parse the JSON output and process each message by type (see Message Type Handling below). If exit 1, no messages are pending -- continue normal workflow.

Example check:
```bash
bash scripts/console/check-inbox.sh
```

The output (on exit 0) is JSON: `{ "count": N, "messages": [{ "id": "...", "type": "...", "filename": "..." }, ...] }`

## Message Type Handling

### milestone-submit

A user submitted a new milestone from the dashboard. Steps:

1. Run `bash scripts/console/validate-config.sh` to validate the config at `.planning/console/config/milestone-config.json`
2. If valid: read the config and use it to initialize a new milestone via `/gsd:new-milestone`
3. If invalid: emit a question back asking the user to fix the config (use `scripts/console/write-question.sh`)
4. Check `.planning/console/uploads/` for any attached vision documents
5. If vision documents exist, incorporate them into the milestone initialization as project context

### config-update

The dashboard sent updated configuration settings. Steps:

1. Read the payload to identify which settings changed
2. For hot-configurable settings (mode, parallelization): apply immediately to current session by updating `.planning/config.json`
3. For cold settings (depth, model_preference): note the change and inform user it takes effect next phase
4. Update `.planning/console/outbox/status/current.json` via `bash scripts/console/write-status.sh` to confirm the update was processed

### question-response

The user answered a question from the dashboard. Steps:

1. Match the response to the original question by `question_id` in the payload
2. Apply the answer to the pending decision in the current workflow
3. Continue the blocked workflow if the question was blocking progress

## Outbound Communication

### Emitting Questions

When Claude needs user input during a GSD workflow:

```bash
bash scripts/console/write-question.sh "<question_id>" "<question_text>" "<type>" "<options_json>"
```

Types: `binary`, `choice`, `multi-select`, `text`, `confirmation`

Use questions when a decision is needed that cannot be made autonomously. Always provide a clear question_id so the response can be matched back.

### Updating Status

After every state change (phase start, plan completion, error):

```bash
bash scripts/console/write-status.sh "<phase>" "<plan>" "<status>" "<progress_pct>"
```

This updates `.planning/console/outbox/status/current.json` so the dashboard reflects live session state. Status values: `planning`, `executing`, `verifying`, `blocked`, `complete`, `error`.

### Validating Config

Before processing a milestone-submit:

```bash
bash scripts/console/validate-config.sh [base_path]
```

Exits 0 if valid, exit 1 with error details on stdout if invalid. Always validate before acting on milestone submissions to prevent malformed configs from entering the GSD pipeline.

## Important Notes

- Never block on inbox check -- if `scripts/console/check-inbox.sh` fails or takes longer than 5 seconds, continue normal workflow
- Messages are moved to `acknowledged/` after reading -- they will not appear again
- The skill works alongside existing GSD commands, not replacing them
- All filesystem paths are relative to project root under `.planning/console/`
- The message envelope format follows the schema in `src/console/schema.ts`
