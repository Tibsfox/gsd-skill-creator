# FileChanged External-Change Tracker — Component Specification

**Date:** 2026-04-15
**Milestone:** Platform Alignment
**Model Assignment:** Sonnet
**Dependencies:** Wave 0.2 (`hook-output.cjs` helper)
**Target Files:** `.claude/hooks/external-change-tracker.cjs`, `.claude/settings.json`
**Priority:** P0

---

## Problem

Our skills have zero awareness of files modified outside the current conversation. The `FileChanged` hook fires when files change by any non-conversation path — linters, formatters, the user editing in another window, `git checkout`/`merge`/`rebase`, or build tool outputs. OOPS doc 03 §2 catalogs the resulting silent-bug class:

- User edits a file in VS Code → Claude's in-memory version is stale → next Edit clobbers the user's work.
- Linter reformats a file Claude just wrote → Claude's next Edit fights the formatter.
- `git checkout` changes branches → every file assumption is invalidated.
- Another session modifies `.planning/STATE.md` → GSD workflow decisions are based on stale state.
- Project `CLAUDE.md` is edited → directive changes go unnoticed until a behavior drift becomes obvious.

Estimated frequency per OOPS: 1-3 stale-state incidents per extended session involving external edits.

## Current State

- No `FileChanged` entry in `.claude/settings.json`.
- No handler under `.claude/hooks/` consumes this event.
- Stale-state detection is manual — the agent notices only when an Edit fails or a Read returns unexpected content.

## Solution

A single `external-change-tracker.cjs` handler that inspects the changed path and emits targeted guidance based on which subsystem was touched. Five cases are handled explicitly; anything not matching is ignored (no output = no context cost).

### Handler: `external-change-tracker.cjs`

Reads stdin JSON, extracts `file_path` (checking both `data.file_path` and `data.tool_input?.file_path`), and emits a message for each matching case:

| Case | Path pattern | Guidance emitted |
|------|-------------|-----------------|
| 1 | `.claude/skills/*/SKILL.md` | "Skill `<name>` was modified outside this session. If relevant to current work, re-read its SKILL.md." |
| 2 | `.planning/*` | "GSD state file `<name>` was modified outside this session. Cached knowledge may be outdated — re-read before workflow decisions." |
| 3 | `.claude/settings.json` | "Hook configuration changed. New hooks may be active or existing hooks removed." |
| 4 | project-root `CLAUDE.md` | "Project instructions (CLAUDE.md) were modified. Re-read for updated directives." |
| 5 | `src/**` or `desktop/**` | "Source file `<rel>` was modified outside this session. If you were editing it, re-read before further changes to avoid conflicts." |

Messages concatenate with `\n\n` separators. If any match produces output, emit via hook-output helper:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "FileChanged",
    "additionalContext": "<joined messages>"
  }
}
```

Silent exit 0 on any error. Source: OOPS doc 03 §2 provides a complete ~55-line skeleton — adapt verbatim, convert `require()` to project `.cjs` form, route output through Wave 0.2 helper.

### settings.json

```json
{
  "FileChanged": [
    { "hooks": [{ "type": "command", "command": "node .claude/hooks/external-change-tracker.cjs" }] }
  ]
}
```

## Acceptance Criteria

1. `external-change-tracker.cjs` exists and handles the 5 path cases above.
2. `.claude/settings.json` contains the `FileChanged` entry, validated by existing commit-gate.
3. Handler exits 0 with empty stdout on malformed JSON stdin or missing `file_path` field (T-SAFE-03).
4. Functional tests T-FC-01..04 from `09-test-plan.md` pass — one per case 1/2/4/5 (case 3 covered by T-FC pattern variant).
5. Handler is **idempotent** — firing twice for the same path produces two identical messages (no state persisted between invocations).
6. No external deps beyond Node built-ins.
7. Zero regression against baseline suite.

## Technical Notes

- The hook may fire repeatedly during burst edits (format-on-save, linter passes). Not our problem to debounce — the handler is cheap (<5ms) and the agent can ignore noise.
- Case 5 uses absolute-path prefix matching (`path.join(cwd, 'src/')`). Must use `path.join` not string concat — Windows path separators will differ if this ever runs on WSL without forward-slash normalization.
- Case 1 extracts the skill name via `path.basename(path.dirname(filePath))`. Symlinks inside `.claude/skills/` are not supported by this simple extraction — acceptable, the tree has none today.
- Notification messages are plain prose, not JSON — the `additionalContext` field is a string consumed directly by the agent's next turn.
- Pass 2 work (treating burst edits, deduping repeat events, integrating with the journal file) is explicitly out of scope for this mission.

---

*Component spec for Platform Alignment milestone, track 1B. Source: OOPS doc 03 §2 (`03-improvements-from-analysis.md` at commit `254b50553`).*
