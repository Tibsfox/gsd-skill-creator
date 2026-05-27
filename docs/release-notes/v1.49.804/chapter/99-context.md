# v1.49.804 — Context

## What this ship is

v1.49.804 adds a read-side surface for the three append-only JSONL logs accumulated since v795:

- NEW `--query` mode in `src/cli/commands/bounded-learning.ts` — `--log audit|events` (default audit) + `--last N` + `--since <ISO>` + `--threshold <key>` (audit only) + `--kind <responsive|ignored>` (events only).
- +16 tests in `bounded-learning.test.ts` covering log selection, every filter, every error path, malformed-line tolerance, and CSV reason-comma sanitization.
- 173/173 PASS in the bounded-learning + CLI scope (was 157 at v803 close; +16 this ship).

5 of 6 calibratable thresholds remain wired (UNCHANGED from v803).

## What this ship is not

- Not a NASA degree advance. NASA sustains at 1.178.
- Not a counter-cadence ship.
- Not a new top-level CLI subcommand — `--query` is the 5th mode flag inside `bounded-learning` (alongside `--summary`, `--watch`, `--record-event`, default tick).
- Not a write surface — read-only consumer.
- Not a new module — every primitive (`readAuditLog`, `readTokenBudgetEvents`, `getFlagValue`, `parsePositiveFloat`, `parseThresholdKey`) existed and was reused as-is.
- Not a pagination surface — `--last N` is the only size-limit primitive.

## Predecessors (chained-session pickup)

- v1.49.803 — Real Token-Budget Observation Source (wired token-budget events log).
- v1.49.802 — Codification ship (promote #10425 + #10426 + #10427).
- v1.49.801 — T1.1 ship 7: /sc:status integration (T1.1 ARC CLOSED).
- v1.49.799 — T1.1 ship 5: audit log primitive (the first writable surface that v804 now reads).

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + #10184 + #10197 + #10424. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:

- The v794-installed `checkOverwriteGuard` fires again. Eleventh consecutive ship under the gate.
- Step 2.6 (citation-debt auto-update) is N/A (no V-flag emit/close/state blocks).
- Adoption-baseline diff: expected no namespace status changes (bounded-learning already `living`; v804 only adds a mode flag inside the existing CLI command).
- **Chained-session note:** v804 is the first ship in the operator's "audit-log query + strengthening levers" two-ship choice. Total session wall-clock estimate: v804 (~25-30 min) + v805 codification (~30-45 min) ≈ 55-75 min.

## Audit-2026-05-26+ streak status

v804 is the 20th ship in the AUDIT-2026-05-26+ series. Cadence sub-bifurcation (unchanged at v804):

- New-vertical / new-module ships: 30-90 min.
- Same-class extensions: 15-30 min.
- Cross-class extensions: 45-60 min.
- New-module consuming established abstractions: 30-50 min.
- Long-running-mode + refactor: 40-50 min.
- Consumer surface integrations (no new module): 25-40 min. **← v804 lands here.**
- Codification ships: 30-45 min.
- NASA degree advances: 60-90 min (separate cadence pattern).

Net delivery across audit streak (v785-v804, 20 ships):

- 1 normalizer.
- 3 adoption-telemetry surfaces.
- 6 shelfware verdicts.
- 1 NASA degree advance.
- 19 ESTABLISHED lessons promoted in the audit streak (8 at v784 + 1 at v794 + 7 at v790 + 3 at v802).
- 4 tentative observations carried forward (watch-loop tear-down race; chained-session architectural-tax break-even; registry-abstraction cross-chain payoff; **NEW v804 6th-mode-flag refactor trigger**).
- 1 deterministic gate.
- 1 new T1.1 vertical + 6 T1.1 extensions + 1 codification + 2 follow-on consumer surfaces.

## Forward path (post-v804)

- **v805 — Strengthening Levers S3 + S4 + S7 codification ship** — next ship in this chain.
- **NASA 1.179 forward-cadence** — INTERSTELLAR-BOUNDARY axis obs#3.
- **T1.3 — College of Knowledge consumer engine** (3-5 ships).

## Why this ship matters

The three append-only JSONL logs accumulated over v795-v803 were write-only. The operator could not introspect what the calibration loop had done across runs, nor enumerate the operator-response telemetry feeding the token-budget threshold. v804 closes that gap with the lightest possible wire: a flag inside the existing CLI, reusing existing read primitives, with three filter axes that compose linearly.

The architectural payoff from v798 (registry extraction) now reaches 5 consumer ships across two chained-session boundaries. The lifetime value of the abstraction is bounded only by how often the surface is touched.
