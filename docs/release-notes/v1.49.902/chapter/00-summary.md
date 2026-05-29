# v1.49.902 — Eighth LoaderContext Chip: `orchestrator/state/state-reader.ts`

**Released:** 2026-05-29

## Why this ship

KNOWN_UNWIRED Loader ledger had 8 entries post-v901 (v901 was a counter-cadence codify ship, no chip-down). Per #10444 size-ascending discipline, the unique-smallest entry was `keystore.ts` at 179 LOC — but it is already ProcessContext-wired at v861 and the LoaderContext-wire targets sync `existsSync` sites, a wire shape worth deferring as a separate concern. Second-smallest is `state-reader.ts` at 190 LOC. The v900 lessons carry-forward explicitly previewed two sub-variant candidates for this file:

1. **Consolidated public-entry gate** — one `ensureAllowed` hoist at the public `read()` method, gating all transitive private fs-op methods through one audit record per public call.
2. **Multi-site** — `ensureAllowed` at each fs-op method (one per access/readFile/readdir site), producing 6 audits per `read()` call.

v902 picks option 1 (consolidated gate). The chokepoint's role is to ENFORCE access policy on a logical operation, not to audit each disk syscall. Per-public-invocation granularity is the right model when the class's scope is "wraps a directory" — and `ProjectStateReader` wraps `this.planningDir`, with all internal fs ops scoped under it.

## What's in this ship

- **`src/orchestrator/state/state-reader.ts`** UPDATED:
  - `ctx?: LoaderContext` added as optional 2nd constructor parameter on `ProjectStateReader(planningDir, ctx?)`. Stored as `private readonly ctx?: LoaderContext` instance field. Non-breaking — all 5 production callers (`cli/commands/session.ts:146` + `cli/commands/session.ts:198` + `cli/commands/orchestrator.ts:268` + `cli/commands/orchestrator.ts:351` + `cli/commands/orchestrator.ts:418`) and all 12 test sites construct with the single-arg form and continue to work as legacy-permissive.
  - `LOADER_SOURCE = 'orchestrator/state/state-reader'` constant.
  - `ensureAllowed(this.ctx, LOADER_SOURCE, 'read-dir', this.planningDir)` hoisted at top of public `read()` method BEFORE any disk operation — specifically ABOVE the `directoryExists` call whose try/catch swallows ENOENT (per #10442). Private methods (`directoryExists`, `resolvePhaseDirectories`) and the 4 `readFileSafe` calls inline in `read()` inherit the gate through transitive call from the public entry.
- **`src/orchestrator/state/state-reader.test.ts`** UPDATED:
  - New `LoaderContext chokepoint integration (v1.49.902)` describe block with 5 tests:
    - Emits exactly one audit record per `read()` call when ctx is provided.
    - Throws `LoaderContextDenied` when `planningDir` is not in allowList — denial propagates ABOVE the `directoryExists` ENOENT swallow (#10442 invariant test).
    - Legacy permissive mode when ctx is undefined preserves prior behavior.
    - Admits `planningDir` via prefix-pattern (trailing slash) in allowList.
    - Audit-record-count: emits exactly N records under N public `read()` invocations (#10456 4th variant — class-multi-method consolidated-gate, distinct from v892 two-site outer-loop, v896 derived-method ripple, v897 mixed read/write derived methods, and v900 module-function direct-call).
- **`src/security/loader-context-audit.test.ts`** UPDATED:
  - `KNOWN_UNWIRED` set: `'src/orchestrator/state/state-reader.ts'` removed (8 → 7 entries).
  - Chip-down note added with v1.49.902 + class-multi-method-consolidated-gate identifier.

## Wire shape

**Class-multi-method consolidated public-entry gate.** NEW 1-instance sub-variant candidate for #10448. Distinct from #10455 (class-stored hoist-at-top), which is the established N=1 fs-op-method class form (v890 calibration-adjustment-store + v896 workflow-run-store + v897 scan-state-store). v902 surfaces the corresponding N>1 case: when the class wraps a directory and has multiple internal fs-op surfaces all scoped under that directory, a single hoist at the public-method entry covers them all through transitive call.

**Field structure:** `private readonly ctx?: LoaderContext` (matches #10455 instance-field convention).

**Constructor signature:** `constructor(private planningDir: string, ctx?: LoaderContext)` — non-breaking via optional 2nd param.

**Scope:** `this.planningDir`. All internal fs ops read paths under it: `access(this.planningDir)`, `readFileSafe(join(this.planningDir, 'ROADMAP.md'))` (×4 with different filenames), `readdir(join(this.planningDir, 'phases'))`.

**Audit emission:** 1 record per public `read()` call. The 4th audit-record-count variant for #10456 — the simplest reduction beyond v900's module-function form: same 1-audit-per-call shape, but on a class with multi-method internals instead of a single function.

**#10442 hoist-above-ENOENT-swallow.** The `directoryExists` private method has its own `try { await access(...) } catch { return false }` ENOENT swallow. The `ensureAllowed` hoist sits in the public `read()` method ABOVE the `directoryExists` call, so `LoaderContextDenied` propagates instead of being silently absorbed and returning `uninitializedState()`. Exercised directly by the "denial propagates ABOVE directoryExists ENOENT swallow" test.

## What this ship is

- A forward-cadence security-chokepoint chip per #10432 ratchet-ledger discipline.
- The first instance of a class-multi-method consolidated-gate wire shape — 1-instance candidate that will ripen to 3-instance if two more LoaderContext class-multi-method chips follow.
- A 4th audit-record-count variant data point for #10456 (already ESTABLISHED at v899).
- KNOWN_UNWIRED Loader 8 → 7.

## What this ship is not

- Not a counter-cadence ship (engine state UNCHANGED except KNOWN_UNWIRED).
- Not a substrate auto-emit or new threshold wire (verify-axis remains 7 of 7 COVERED + 0 PENDING-TEST from v898).
- Not a NASA degree advance (still 1.178; 120 consecutive ships at margin record).
- Not a promotion of a new sub-variant — v902 is the first instance; promotion requires 2 more class-multi-method consolidated-gate instances at v903+.

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — **120 consecutive ships** at this degree; pressure-margin record extended by 1).
Counter-cadence count UNCHANGED at 10.
Manifest entries 23 (UNCHANGED).
Lessons in manifest 99 (UNCHANGED).
KNOWN_UNWIRED Process UNCHANGED at 0.
KNOWN_UNWIRED Egress UNCHANGED at 0.
**KNOWN_UNWIRED Loader 8 → 7** (-1 via this chip).
Wired calibratable thresholds 7 of 7 (UNCHANGED); verify-axis 7 COVERED + 0 PENDING-TEST (UNCHANGED from v898).
Pre-tag-gate step count: 18 (UNCHANGED).

## Files touched

- `src/orchestrator/state/state-reader.ts` (UPDATED)
- `src/orchestrator/state/state-reader.test.ts` (UPDATED — 5 new tests in `LoaderContext chokepoint integration (v1.49.902)` block)
- `src/security/loader-context-audit.test.ts` (UPDATED — KNOWN_UNWIRED 8 → 7 + chip-down note)
- `docs/release-notes/v1.49.902/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — v902 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.901 → 1.49.902)
