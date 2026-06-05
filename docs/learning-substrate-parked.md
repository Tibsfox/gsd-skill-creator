# Learning Substrate — Parked: the MA/MB/MD control-theory island (D3)

**Status:** parked (latent, tested, flag-gated default-OFF), pending a learning-loop runtime consumer.
**Decided:** 2026-06-03 (audit decision-gate **D3**), executed v1.49.972 (2026-06-04).
**Source:** `.planning/IMPLEMENTATION-PLAN-2026-06-03.md` § "Decision-gate resolutions" → D3.

## What this is

The adaptive-learning substrate accumulated a cluster of control-theory modules
(the MA "actor-critic / eligibility", MB "Lyapunov / projection / dead-zone", and
MD "noise / temperature / learnable-K_H" families). They form a self-contained
**import island**: `ace` (MA-2) is the downstream **sink** — it imports none of the
others; the others import `ace`. The island is real, tested capability, but it is
**not reachable from any production entry point** on the dev line, and it ships
**flag-gated default-OFF** (flipping all flags off is byte-identical to the
pre-substrate behavior; pinned by
`src/integration/__tests__/continuation/flag-off-byte-identical.test.ts`).

D3 **parks** the island rather than wiring or retiring it:
- **Not wired:** the audit's original "wire `ace` → M5 selector" recommendation was
  refuted — `ace` is the SINK, so wiring it advances only 1 of 8 modules and would
  license a false "island wired" claim. There is no learning-loop runtime that
  consumes the island today.
- **Not retired:** the island is latent, tested, flag-off-byte-identical capability;
  deleting it is destructive and irreversible. Parking keeps it preserved.

## The 8 parked modules

| Module | Code | Role | adoption-scan status | Reachable from production? |
|--------|------|------|----------------------|----------------------------|
| `src/ace/` | MA-2 | ACE actor-critic (import sink) | living | scanner: **true** — static value-edge from the default-OFF M5 orchestration-selector |
| `src/eligibility/` | MA-1 | TD(λ) eligibility traces | test-only | scanner: false |
| `src/lyapunov/` | MB-1 | Lyapunov-stable K_H adaptation | living* | scanner: **false** — only island importers (learnable-k_h, projection) |
| `src/projection/` | MB-2 | smooth projection operators | living* | scanner: **false** — only island importer (langevin) |
| `src/dead-zone/` | MB-5 | dead-zone bounded learning | test-only | scanner: false |
| `src/langevin/` | MD-3 | Langevin noise injection | test-only | scanner: false (imports projection) |
| `src/temperature/` | MD-4 | annealed temperature schedule | test-only | scanner: false |
| `src/learnable-k_h/` | MD-5 | per-(skill, task-type) learnable K_H heads | test-only | scanner: false (imports ace + lyapunov) |

`*` `lyapunov` and `projection` read **`living`** by the import-surface scanner only
because other *island* modules import them — they have **zero** production importers.
The reachability-aware scanner v2 (audit **Ship 3.1**) **landed at v1.49.977** and now
reclassifies exactly this case: both report **`reachableFromProduction:false`**. The
`ace` row is the one exception — see the note below the table.

**Reachability-v2 verdict (v1.49.977):** the file-level reachability walk
(`tools/adoption-scan.mjs`, from the npm `bin`/`main` roots + hooks + the shipped
desktop/Tauri frontier; dev tooling excluded) reports **7 of 8** island modules as
`reachableFromProduction:false`. `ace` (the sink) reports **`true`** because its sole
non-island edge — the static **value**-import of `applyActorSignalToScore` from the
production M5 selector `src/orchestration/selector.ts` — is statically reachable. The
flag-off byte-identical guarantee is **runtime** (the `aceSignal !== null` guard in
`selector.ts`), not static, so a static scanner correctly reports `ace` reachable.
This vindicates the D3 framing ("`ace` is the sink with one flag-gated production
edge → wiring it advances only 1/8") and is pinned by the
`tests/integration/learning-substrate-parked.test.ts` reachability drift-guard.

## What is NOT in the island

Three MA/MB/MD-family modules are **genuinely production-reachable** and are
deliberately excluded from the park (they are living, not shelfware):
- `src/stochastic/` (MA-3 / MD-2) — real callers in `orchestration` + `branches`.
- `src/embeddings/` (MD-1) — 12 production callers (application, orchestrator, retrieval, …).
- `src/representation-audit/` (MD-6) — wired to the `skill-creator` CLI dispatch.

## Enforcement

The park is recorded as 8 `tools/adoption-scan.allowlist.json` entries (each
`addedBy: "v972 D3 control-theory island park"`), which exempt the modules from the
persistent-shelfware threshold and carry the resume condition + review date in the
`reason`. `docs/SHELFWARE-VERDICTS.md` carries the consolidated ALLOWLISTED verdict
row. The drift-guard `tests/integration/learning-substrate-parked.test.ts` pins that
all 8 are allowlisted with the parked provenance and that this doc lists them.

## Resume condition (generic — not version-pinned)

Revisit this park when **a future learning-loop milestone wires a production
(non-test, non-island) consumer of the control-theory substrate** — e.g. a runtime
that drives the M5 selector or K_H adaptation from real reinforcement signal, at
which point the island stops being latent. The trigger is deliberately
**capability-based, not v1.50-specific** (a learning loop could land on the dev line
independently of the parked v1.50 fork — and tying the resume to v1.50 would
contradict the D1 resolution).

## Review gate

**Retire-or-resume review by 2027-06-04** (≈1 year). If no production consumer has
landed by then, decide between retiring the island (delete the modules + tests) and
extending the park with a fresh rationale. This dated gate exists so the 8 entries
do not silently calcify the way `upstream` / `upstream-intelligence` did (allowlisted
v1.49.787, still pending ~180 ships later).

## Related: `intrinsic-telemetry` retired (same ship, separate decision)

D3 also **retired** `src/intrinsic-telemetry/` (a registered Half-B module of
`heuristics-free-skill-space`, LEJEPA-18 / Phase 733) — genuine shelfware superseded
by the static `tools/adoption-scan.mjs` (a deterministic import-surface scanner that
shipped and is gated, vs. the never-consumed runtime-telemetry approach). It had zero
production importers; removal un-registered it from `heuristics-free-skill-space`
(`settings.ts`, `index.ts`, the integration test). See `docs/SHELFWARE-VERDICTS.md`.
The retire is distinct from the island park: `intrinsic-telemetry` is not an island
module and is not coming back, so it is deleted, not allowlisted.
