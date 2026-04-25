# `.claude/hooks/` — hook surface README

This directory holds the deterministic hooks the Claude Code harness fires at lifecycle events. The files are installed into `$REPO/.claude/hooks/` by `node project-claude/install.cjs`; the source-of-truth lives here under `project-claude/hooks/` (the `.claude/` directory itself is gitignored — never edit `.claude/hooks/X` and expect the change to survive an `install.cjs` run; edit `project-claude/hooks/X` instead).

This README is the entry point for: lifecycle reference, edit policy (per ADR 0001), origin map (vendored vs locally authored), and the small defensive-hook catalogue.

## 1. Hook lifecycle reference

The Claude Code harness exposes ~26 lifecycle events. The ones this repository subscribes to (or has scripts authored for, even if not yet wired) are:

| Event | When it fires | Subscribed in `settings.json`? |
|-------|---------------|--------------------------------|
| `SessionStart` | New session opens; before any user prompt is processed | yes (5 hooks today) |
| `SessionEnd` | Session closes; before the harness exits | yes (2 hooks today) |
| `PreToolUse` | Just before the harness invokes a tool (Bash, Write, Edit, Read, etc.); a non-zero exit blocks the tool call | yes (6 hooks today; matchers gate which tools each hook fires for) |
| `PostToolUse` | Just after a tool call returns | yes (6 hooks today) |
| `PreCompact` | Just before the harness compacts the context window | NO — `pre-compact-snapshot.cjs` exists on disk but is unregistered (per OGA-013, OGA-051; ADR 0002 wires it up) |
| `PostCompact` | Just after compaction completes | NO — `post-compact-recovery.cjs` exists on disk but is unregistered (same tickets) |
| `Notification` | Harness emits a notification | NO — `notification-logger.cjs` exists on disk but is unregistered |
| `Stop` | User or harness halts a running tool sequence | NO — `task-completed-gate.sh` and `teammate-idle-gate.sh` exist on disk but are unregistered |
| `SubagentStop` | A subagent finishes | NO |
| `UserPromptSubmit` | User submits a prompt before any tool runs | NO |
| `PermissionDenied` | Permission check fails for a tool call | NO — `permission-recovery.cjs` exists on disk but is unregistered |
| `FileChanged` | A file in the workspace changes outside the harness's own tool calls | NO — `external-change-tracker.cjs` exists on disk but is unregistered |

The 22-of-26 unwired event slots are tracked by OGA-017. Wave 1 of milestone v1.49.576 (Phase 822) brings several of them online.

### Matchers

`PreToolUse` and `PostToolUse` registrations may carry a `matcher` field — a pipe-delimited list of tool names that gates which tool calls trigger the hook. Examples in current use: `"Bash"`, `"Write|Edit"`, `"Write|Edit|MultiEdit"`, `"Bash|Edit|Write|MultiEdit|Agent|Task"`, `"Read"`. Absence of `matcher` means "fire on every tool call for this event."

### Schema fragment

```jsonc
{
  "hooks": {
    "<EventName>": [
      {
        "matcher": "<ToolName>|<ToolName>",   // optional
        "hooks": [
          { "type": "command",
            "command": "<shell-string>",
            "timeout": <integer-seconds>      // optional
          }
        ]
      }
    ]
  }
}
```

## 2. Edit policy (per ADR 0001)

Every file in this directory is in one of three states. The state is recorded in the file's header comment block.

### State A — upstream-unmodified vendor copy

```
# gsd-hook-version: 1.38.3
# local-modified: false
```

The file came from upstream `gsd-build/get-shit-done@1.38.3` and has not been edited since. `gsd update` may overwrite it without warning.

### State B — locally-forked vendor copy

```
# gsd-hook-version: 1.38.3
# local-modified: true
# local-modified-since: gsd-skill-creator/v1.49.x
```

The file came from upstream but has been locally edited. `gsd update` must refuse to overwrite without `--force`. The first edit must atomically flip `local-modified: false` → `true` and add the `local-modified-since` line in the same commit as the substantive change.

### State C — locally authored

```
# gsd-skill-creator-hook-version: v1.49.x
```

The file was written here, never came from upstream. Different stamp name (`gsd-skill-creator-hook-version` rather than `gsd-hook-version`) so a stamp-grep can distinguish vendored from locally-authored in O(1). `gsd update` must never touch this file.

### Editing protocol summary

1. Editing a state-A file: flip the boolean to `true` and add `local-modified-since` in the same commit. The file moves to state B.
2. Editing a state-B file: bump `local-modified-since` to the current version.
3. Authoring a new file: stamp it with `gsd-skill-creator-hook-version` immediately. Never use `gsd-hook-version` for a file that did not actually come from upstream.
4. Re-vendoring (intentional re-sync that abandons the local fork): replace the file wholesale with the new upstream copy and reset the marker to state A. Document the decision in the commit body.

See `docs/adr/0001-vendoring-policy.md` for the full policy rationale.

## 3. Origin map

The hook surface contains roughly three kinds of file. The classification below is the C0 first-pass; C2 will refine it as part of the dual-impl triage and will stamp each file accordingly. Until C2 lands, treat the existing `gsd-hook-version: 1.38.3` stamps as authoritative for vendored origin and treat unstamped files as state-C-pending-confirmation.

### Vendored from upstream `gsd-build/get-shit-done@1.38.3` (probable state A or B)

These carry the existing `gsd-hook-version: 1.38.3` stamp:

- `gsd-statusline.js`
- `gsd-validate-commit.sh` (ADR 0002 retires from settings.json; stays on disk in state A)
- `gsd-phase-boundary.sh` (ADR 0002 retires from settings.json; stays on disk in state A)
- `gsd-session-state.sh` (ADR 0002 retires from settings.json; stays on disk in state A)

Several other `gsd-`-prefixed scripts in this directory likely came from the same vendor source but the M3 inventory only flagged the four above as carrying the explicit version stamp. C2 should grep every `gsd-`-prefixed file for the stamp and triage.

### Locally authored (probable state C)

These have no `gsd-hook-version` stamp and were written for this project:

- `validate-commit.cjs` (ADR 0002 keeps as authoritative validate-commit)
- `phase-boundary-check.cjs` (ADR 0002 keeps as authoritative phase-boundary)
- `session-state.cjs` (ADR 0002 keeps as authoritative session-state)
- `pre-compact-snapshot.cjs` (ADR 0002 wires to PreCompact)
- `post-compact-recovery.cjs` (ADR 0002 wires to PostCompact)
- `observe-tool-trace.cjs`
- `external-change-tracker.cjs`
- `notification-logger.cjs`
- `permission-recovery.cjs`
- `task-completed-gate.sh`
- `teammate-idle-gate.sh`
- `worktree-init.cjs`
- `worktree-cleanup.sh`
- `lib/hook-output.cjs`

C2 should stamp each of these with `gsd-skill-creator-hook-version: v1.49.x` per ADR 0001 to make the origin explicit.

### Companion test files (no runtime hook surface)

- `gsd-inject-snapshot.test.ts`
- `gsd-restore-work-state.test.ts`
- `gsd-save-work-state.test.ts`
- `gsd-snapshot-session.test.ts`
- `tests/validate-commit.bats`

These are vitest / bats tests that ride alongside the hook scripts. They are not registered in `settings.json` and do not need an ADR 0001 stamp.

## 4. Defensive hooks (catalogue, by name only)

A small subset of hooks are explicitly defensive — they run security or integrity checks against tool input or output. **The contents of these hooks are intentionally not described in this README** (per the SC-SEC requirement of the security-hygiene skill). A reader who needs to understand what a defensive hook does should read its source directly; documenting the rules here would advertise the rules to any prompt-injection vector that reads documentation.

The five defensive hooks present in this directory are:

- `gsd-prompt-guard.js`
- `gsd-read-injection-scanner.js`
- `gsd-read-guard.js`
- `gsd-response-scan.cjs`
- `gsd-config-guard.js`

All five are listed in this README only so that contributors know they exist and know which event slots they currently occupy in `settings.json`. The mapping between hook and event slot is visible in `settings.json` itself; the rules each hook enforces are not documented here.

## 5. References

- `docs/adr/0001-vendoring-policy.md` — three-state vendoring marker policy
- `docs/adr/0002-dual-impl-decision-record.md` — per-pair authority decisions for OGA-048 / 049 / 050 / 051
- `.claude/skills/security-hygiene/SKILL.md` — SC-SEC requirement: defensive hook contents are not documented
- `.planning/missions/oops-gsd-alignment/m3/local-inventory.json` — full hook inventory with categories and probable triggers (gitignored)
- `.planning/missions/oops-gsd-alignment/m4/REPORT.md` — Part A findings including the dual-implementation pattern (gitignored)
