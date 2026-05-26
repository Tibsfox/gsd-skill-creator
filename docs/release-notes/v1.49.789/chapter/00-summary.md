> Following v1.49.788 — _IBEX NASA 1.178 Interstellar Boundary Explorer_, v1.49.789 ships as Shelfware Verdict 1 — WIRE `semantic-channel` via `dacp drift-check`.

# v1.49.789 — Shelfware Verdict 1: WIRE `semantic-channel` via `dacp drift-check`

**Shipped:** 2026-05-26

A one-ship completion of the AUDIT-2026-05-26 T1.2 trilogy. Wires the
`src/semantic-channel/` module — the GAP-6 closure artifact's runtime
— into a real, operator-visible call site by exposing its read-only
adapter, channel-capacity bound, and advisory drift checker through a
new `skill-creator dacp drift-check` CLI subcommand.

## What shipped

- **`src/cli/commands/dacp-drift-check.ts`** (240 lines) — new
  `dacp drift-check`/`dc` subcommand. Three-tier output (text/quiet/
  JSON). `--bundle <path>` (required) reads a DACP bundle, computes
  the channel state + capacity bound, reports per-component fidelity
  and total-bits. `--baseline <path>` (optional) runs the advisory
  drift check against a prior bundle. `--threshold N` overrides the
  drift threshold. `--max-bits N` reports whether the capacity bound
  fits a caller-supplied budget. Exit code is always 0 on advisory
  paths (the CAPCOM handoff retains full enforcement authority).
- **`src/cli/commands/dacp-drift-check.test.ts`** — 22 tests covering
  argument handling, capacity-only output, drift comparison, flag-off
  skip, advisory-only exit-code invariant, JSON/quiet/text format
  contracts.
- **`src/cli/commands/dacp.ts`** + **`src/cli/help.ts`** — `dacp`
  dispatcher gains the new subcommand routing + help-text entry.
- **`docs/SHELFWARE-VERDICTS.md`** — new doc establishing the verdict
  format (WIRED / RETIRED / ALLOWLISTED), the first verdict entry
  (`semantic-channel` WIRED), and the open-candidate roster for the
  remaining Math Foundations Refresh modules.
- **`.planning/PROJECT.md`** — GAP-6 row notes the runtime wire;
  Active milestone + Latest shipped release + Last updated frontmatter
  advanced.

## Through-line

The v786 + v787 ships built the adoption telemetry surface (scanner +
dashboard + allowlist) — the *observability* of shelfware. v789 emits
the surface's first deterministic *decision*: pick a candidate module
and either wire it into a real call site or formally retire it.

`semantic-channel` is the most operationally-useful first choice. The
v572 ship explicitly identified it as the runtime backing of the GAP-6
closure artifact (`docs/substrate/semantic-channel.md`); the module
already ships a read-only adapter (HARD-preservation invariant), a
size-based channel-capacity bound, and an advisory-only drift checker
designed to be wired into CAPCOM-adjacent surfaces without perturbing
DACP. The wire is therefore additive: a new CLI surface that exposes
the existing computation; no `src/dacp/` modification; no change to
the byte-identical DACP wire format guaranteed by the v572 G7 gate.

## Adoption diff vs v787 baseline

The first non-trivial diff that the v787 baseline.json snapshot has
enabled:

```
[adoption-refresh] 1 change(s) since prior baseline:
  status changes (1):
    ↑ semantic-channel: test-only → living
```

Per the v787 lesson-candidate "warm-up period" (#10421), this is the
expected outcome for the first refresh-with-baseline ship after v787.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED from v788). Counter-cadence
count UNCHANGED at 5. v789 is forward-cadence audit-driven.

## Audit roadmap progress

| Item | Status |
|---|---|
| T1.4 — PROJECT.md GAP table refresh | Delivered at v785 |
| S5 — PROJECT.md normalizer | Delivered at v785 |
| T1.2 ship 1 — Module-usage scanner | Delivered at v786 |
| T1.2 ship 2 — Dashboard + automation + allowlist | Delivered at v787 |
| **T1.2 ship 3 — First shelfware verdict** | **Delivered at v789 (this ship)** |
| Path A — NASA 1.178 IBEX | Delivered at v788 |
| T1.1 — Bounded-learning calibration loop | OPEN — 4-6 ships |
| T1.3 — College of Knowledge consumer engine | OPEN — 3-5 ships |
| S3 — Codify the meta-cadence | OPEN |
| S4 — Public surface separation | OPEN |
| S6 — Self-evidence loop for security disciplines | OPEN |
| S7 — Counter-cadence cadence | OPEN |

## Next forward candidates

- **Codification ship** — 5 lesson candidates ripe (#10417-#10421) +
  potentially 1-2 new from v789 (verdict-pattern + warm-up-period
  validation). Historical codification threshold met.
- **T1.2 ship-by-ship continuation** — five remaining Math Foundations
  Refresh modules with verdicts pending (`coherent-functors`,
  `hourglass-persistence`, `koopman-memory`, `tonnetz`,
  `wasserstein-hebbian`). Each is one ship-unit.
- **NASA 1.179** — INTERSTELLAR-BOUNDARY axis obs#3 continuation
  candidates in `www/tibsfox/com/Research/NASA/1.178/to-1.179.md`
  (Wind, Voyager extensions, Pioneer 10/11, Cassini INCA, New
  Horizons, FAST, DE-1).
- **T1.1** — bounded-learning calibration loop (most ambitious Tier 1
  remaining).

---
**Prev:** [v1.49.788](../v1.49.788/00-summary.md) · _(current tip)_
