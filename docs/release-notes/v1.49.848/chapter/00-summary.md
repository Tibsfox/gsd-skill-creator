# v1.49.848 — Help text expansion: 20 missing commands surfaced in `printHelp()`

**Released:** 2026-05-28

## Why this ship

First ship of the operator-directed v848-v856 nine-ship campaign. The v847 handoff named "help text expansion in `src/cli/help.ts`" as a 15-30 min candidate, citing `predict-next` as an explicit example of a command added in a recent ship (v845) but never surfaced in `printHelp()`. Audit at session start confirmed a larger gap: dispatch.ts registers 84 command aliases; help.ts listed only 62. The 20-command difference accumulated across the v797-v847 cluster as new commands were registered without help-line edits.

This is the **warm-up** ship of the campaign — smallest scope, lowest risk, fastest cadence. The campaign continues with five chip ships (one ProcessContext singleton per ship), a mesh-family verify ship, a quality-drift scorer refinement, and an auto-emit verification ship.

## The 20 commands added

Topical grouping (each entry is a one-liner under `Commands:` in `printHelp()`):

- **Activation/audit** (4): `tractability, tract`; `model-affinity, aff`; `representation-audit, rep-audit`; `output-structure, os`
- **Migration** (1): `migrate-plane, mp`
- **Test** (2): `test-triggering`; `skill`
- **Activation** (1): `predict-next, pn` (the v845 handoff callout)
- **Symbiosis** (3): `teach`; `co-evolution, coevo`; `quintessence, quint`
- **Audit** (1): `critique, crit`
- **Sensoria** (1): `sensoria`
- **Eval** (2): `eval`; `ab, ab-test`
- **Coprocessor** (1): `coprocessor, cp`
- **Manage** (3): `cartridge`; `chip`; `keystore`
- **Plane-status** (1): `plane-status, ps`

Each entry follows the existing one-line format (canonical name + alias, two-space indent, description) and is placed in topical proximity to related commands.

## Surface delta

- 1 file modified (`src/cli/help.ts`); +20 lines added to the `Commands:` block
- 0 source-code-behavior changes
- 0 manifest changes
- 0 new tests
- 0 new dependencies
- Help-coverage ratio: 62/84 (74%) → 82/84 (98%); remaining 2 are help variants (`help, -h, --help`) already documented as a single line

## Manifest state

| Field | Before | After |
|---|---|---|
| Manifest entries (discipline domains) | 23 | 23 |
| Lessons in manifest (unique) | 83 | 83 |
| UNCODIFIED | 39 | 39 |
| Wired calibratable thresholds | 5 of 7 | 5 of 7 |
| KNOWN_UNWIRED Process | 16 | 16 |
| KNOWN_UNWIRED Egress | 11 | 11 |

## Engine state

NASA degree at **1.178** (UNCHANGED — **66 consecutive ships at 1.178**, new widest pressure margin record by 1 over v847's 65).
Counter-cadence count UNCHANGED at 6.
Operational axes UNCHANGED at 4.
