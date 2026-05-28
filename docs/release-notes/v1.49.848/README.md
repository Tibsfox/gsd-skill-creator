> Following v1.49.847 — _Codification Ship: Promote #10438 + #10439 + #10440 + #10441 + #10442 (Five-Lesson Backlog Clear)_, v1.49.848 is the **first ship of the v848-v856 nine-ship campaign** (operator-directed: help text expansion → 5 ProcessContext singleton chips → mesh-family verify → quality-drift scorer refinement → auto-emit verification). This ship is the **warm-up**: a documentation-discoverability ship that closes the help-text-coverage gap accumulated between v1.49.797 and v1.49.847 — **20 dispatched commands were missing from `printHelp()` output**, including the v845 `predict-next` flagged in the v847 handoff. No new functionality; pure user-facing surface clarity.

# v1.49.848 — Help text expansion: 20 missing commands surfaced in `printHelp()`

**Shipped:** 2026-05-28

First ship of the nine-ship v848-v856 campaign. The help text in `src/cli/help.ts` had drifted from `src/cli/dispatch.ts` over the v797-v847 cluster as new commands were registered without help-line updates. Audit at session start: dispatch.ts registers **84 command aliases**; help.ts listed **62**. The 20-command gap included substrate-era commands (`predict-next`, `plane-status`, `output-structure`, `tractability`, `representation-audit`, `model-affinity`, `migrate-plane`), advisory/eval commands (`critique`, `eval`, `ab`, `test-triggering`, `sensoria`), symbiosis subsystem (`teach`, `co-evolution`, `quintessence`), the manage-group commands (`cartridge`, `chip`, `keystore`, `coprocessor`), and the `skill` namespace wrapper.

## What shipped

- **MODIFIED** `src/cli/help.ts` — added 20 one-line entries to the `Commands:` block, grouped topically:
  - Activation/audit cluster: `tractability, tract`; `model-affinity, aff`; `representation-audit, rep-audit`; `output-structure, os` (added after `score-activation, sa`).
  - Migration cluster: `migrate-plane, mp` (added after `migrate-agent, ma`).
  - Test cluster: `test-triggering`; `skill` (added after `test, t`).
  - Activation cluster: `predict-next, pn` (added after `simulate, sim`).
  - Symbiosis cluster: `teach`; `co-evolution, coevo`; `quintessence, quint` (added after `feedback, fb`).
  - Audit cluster: `critique, crit` (added after `audit, au`).
  - Sensoria: `sensoria` (added after `bounded-learning, bl`).
  - Eval cluster: `eval`; `ab, ab-test` (added after `benchmark, bench`).
  - Coprocessor: `coprocessor, cp` (added after `mcp-server`).
  - Manage cluster: `cartridge`; `chip`; `keystore` (added after `bundle, bd`).
  - Plane-status: `plane-status, ps` (added after `dashboard, db`).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| (no new tests) | 0 | help.ts is a pure-output module; no test asserts help substring content; build clean confirms compilation |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **66 consecutive ships at 1.178**, new widest pressure margin record).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23** (UNCHANGED — no discipline changes).
Lessons in manifest (unique): **83** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).
Wired calibratable thresholds: **5 of 7** (UNCHANGED).
KNOWN_UNWIRED Process: **16** (UNCHANGED — chip ships v849-v853 will drive this down).
KNOWN_UNWIRED Egress: **11** (UNCHANGED).
Operational axes: **4** (UNCHANGED).

## Surface delta

- 1 file modified (`src/cli/help.ts`)
- +20 commands documented in `printHelp()` output
- 0 source-code-behavior changes
- 0 manifest changes
- 0 new tests
- 0 new dependencies

## Campaign context

This ship opens a 9-ship campaign. Subsequent ships:

- **v1.49.849-853** (5 ships) — ProcessContext singleton chips, 1 singleton per ship; consumes 5 of the 16 KNOWN_UNWIRED entries via the DI-executor + tokenized-argv wire shape codified at v847 (#10441).
- **v1.49.854** — Verify ship for the v843 mesh family (one ship past the verify-overdue threshold at v853 from v843, established by v847's #10438 promotion).
- **v1.49.855** — Quality-drift scorer refinement (add `task` sub-type for T-prefix/S-prefix work).
- **v1.49.856** — Auto-emit verification ship (potentially exploratory; may need synthetic event stream).
