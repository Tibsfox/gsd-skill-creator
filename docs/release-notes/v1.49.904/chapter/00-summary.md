# v1.49.904 — Tenth LoaderContext Chip: `events/skill-event-store.ts`

**Released:** 2026-05-29

## Why this ship

Continues the multi-chip LoaderContext campaign opened from the v902 handoff. Per #10444 size-ascending, with `keystore.ts` (179 LOC) chipped at v903, `skill-event-store.ts` (222 LOC) is the next unique-smallest entry. The file is a class with multiple read-side AND write-side methods — a case-study for #10457 (LoaderContext gates reads; writes out-of-scope) at multi-method scale.

## What's in this ship

- **`src/events/skill-event-store.ts`** UPDATED:
  - `ctx?: LoaderContext` added as optional 2nd constructor parameter on `SkillEventStore(patternsDir, ctx?)`. Stored as `private readonly ctx?: LoaderContext` instance field (per #10455 convention).
  - `LOADER_SOURCE = 'events/skill-event-store'` constant.
  - `ensureAllowed(this.ctx, LOADER_SOURCE, 'read-file', this.filePath)` hoisted at top of THREE read-side methods: `readAll`, `consume`, `markExpired`. Each hoist is ABOVE its own readFile try/catch ENOENT swallow (per #10442). `consume` and `markExpired` hoist BEFORE the writeQueue lock acquisition.
  - `getPending` is not gated directly — it calls `readAll` transitively and inherits the gate (1 audit per `getPending` call via `readAll`).
  - `emit` is NOT gated — write-side, intentionally out-of-scope per #10457. Tests verify zero audit emission from `emit`.
- **`src/events/skill-event-store.test.ts`** UPDATED:
  - New `LoaderContext chokepoint integration (v1.49.904)` describe block with 7 tests:
    - `readAll` emits exactly one audit record per call.
    - Throws `LoaderContextDenied` when ctx rejects filePath on `readAll`.
    - `consume` gates the read-side independently (1 audit; writeFile out-of-scope).
    - `markExpired` gates the read-side independently (1 audit; writeFile out-of-scope).
    - `emit` does NOT gate (write-side, 0 audits per #10457).
    - Legacy permissive mode preserves prior behavior.
    - 5th #10456 variant: 4 audits under {readAll + getPending + consume + markExpired} = exact N read-side count.
- **`src/security/loader-context-audit.test.ts`** UPDATED:
  - `KNOWN_UNWIRED` set: `'src/events/skill-event-store.ts'` removed (6 → 5 entries).
  - Chip-down note added with v1.49.904 + class-instance-multi-method-read-side identifier.

## Wire shape

**Class-instance multi-method read-side.** Extension of #10455 (class-stored hoist-at-top for the N=1 fs-op-method case) to N=3 read-side methods on the same class. Each read method hoists its own `ensureAllowed` against `this.filePath`; all share `this.ctx`. The write-only method (`emit`) is intentionally not gated per #10457.

**Discriminator from prior class wires:**

| Ship | Wire shape | Method count | Notes |
|---|---|---|---|
| v890 calibration-adjustment-store | #10455 N=1 | 1 read-side (`load`) | ESTABLISHED at v899 |
| v896 workflow-run-store | #10455 N=1 | 1 read-side (`readAll`) | ESTABLISHED at v899 |
| v897 scan-state-store | #10455 N=1 | 1 read-side (`load`) | ESTABLISHED at v899 |
| v902 state-reader | class-multi-method consolidated-gate | 1 public + N internal | 1-instance candidate |
| v904 skill-event-store | class-instance multi-method read-side | 3 read-side, 1 write-side | NEW (this ship) |

The discriminator from v902: v902's class has a SINGLE public entry point that orchestrates N internal fs-ops; v904's class has N parallel public methods each with its own fs-op. v902 gates at the orchestrator entry; v904 gates at each method.

**Audit emission shape:** 5th #10456 variant — 1 record per read-side call. Read-method sequence {readAll, getPending, consume, markExpired} = 4 audits (getPending counts as 1 via readAll transitive). emit adds 0 audits.

**#10457 read-side-only invariant:** All three read-side methods gate. The `emit` write-only method does NOT gate. The `consume` and `markExpired` methods read THEN write — the read-side hoist gates the read; the write at the end is implicitly out-of-scope.

## What this ship is

- A forward-cadence security-chokepoint chip per #10432 ratchet-ledger discipline.
- A 5th #10456 audit-record-count variant data point.
- A new instance of #10457 (read-side-only at write-bearing class) — strengthens the discipline at multi-method scale (prior instances v890+v896+v897 were N=1 read-side; v904 is N=3 read-side with 1 write-side).
- A 1-instance candidate for "class-instance multi-method read-side" as a NEW #10448 sub-variant.
- KNOWN_UNWIRED Loader 6 → 5.

## What this ship is not

- Not a counter-cadence ship (engine state UNCHANGED except KNOWN_UNWIRED).
- Not a substrate auto-emit or new threshold wire.
- Not a NASA degree advance (still 1.178; 122 consecutive ships at margin record).

## Engine state

- NASA degree: **1.178** (122 consecutive ships).
- Counter-cadence count: **10** (UNCHANGED).
- Manifest entries: **23** (UNCHANGED).
- Lessons in manifest: **99** (UNCHANGED).
- KNOWN_UNWIRED Process: **0** (UNCHANGED).
- KNOWN_UNWIRED Egress: **0** (UNCHANGED).
- **KNOWN_UNWIRED Loader: 6 → 5** (-1).
- Wired calibratable thresholds: **7 of 7** (UNCHANGED).
- Pre-tag-gate step count: **18** (UNCHANGED).
- Operational axes: **4** (UNCHANGED).
