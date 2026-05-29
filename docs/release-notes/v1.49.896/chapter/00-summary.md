# v1.49.896 — Fifth LoaderContext Chip: `skill-workflows/workflow-run-store.ts`

**Released:** 2026-05-29

## Why this ship

KNOWN_UNWIRED Loader ledger has 11 entries after v887/v889/v890/v892. Per #10444 size-ascending discipline, the smallest is `src/skill-workflows/workflow-run-store.ts` at 138 LOC — smaller than the v892 handoff's named candidate (`scan-state-store.ts` at 176 LOC) because the v885 inline LOC catalog accidentally omitted the smallest entry from its ordering. Class-based store with N=1 read site (single `readFile` in `readAll()`) mirrors the v890 calibration-adjustment-store wire shape: constructor accepts `ctx?: LoaderContext`, stores `this.ctx`, hoists `ensureAllowed` at the top of `readAll()` outside the ENOENT-tolerating try/catch.

## What's in this ship

- **`src/skill-workflows/workflow-run-store.ts`** UPDATED:
  - `private readonly ctx?: LoaderContext` field added.
  - Constructor signature: `constructor(patternsDir: string, ctx?: LoaderContext)`. Non-breaking — existing single-arg callers (3 production sites in `cli/commands/workflow.ts` + 3 test sites) continue to work as legacy-permissive.
  - `LOADER_SOURCE = 'skill-workflows/workflow-run-store'` constant.
  - `ensureAllowed(this.ctx, LOADER_SOURCE, 'read-file', this.filePath)` hoisted at top of `readAll()` BEFORE the try/catch that swallows ENOENT (per #10442 — `LoaderContextDenied` must propagate, not be masked by the missing-file tolerance).
  - `append()` intentionally NOT gated — LoaderContext is a read-side chokepoint by design.
- **`src/skill-workflows/workflow-run-store.test.ts`** UPDATED:
  - New `LoaderContext chokepoint integration (v1.49.896)` describe block with 6 tests:
    - Emits exactly one audit record on `readAll()` when ctx is provided.
    - Throws `LoaderContextDenied` when filePath is not in allowList — denial propagates ABOVE the ENOENT swallow (the #10442 invariant test).
    - Legacy permissive mode when ctx is undefined.
    - Admits filePath via prefix-pattern (trailing slash) in allowList.
    - `append()` is not gated (write-side out of scope).
    - Derived methods (`getRunEntries` / `getLatestRun` / `getCompletedSteps`) each transitively call `readAll()` and emit one audit record per call (total 3 records under 3 derived-method invocations).
- **`src/security/loader-context-audit.test.ts`** UPDATED:
  - `KNOWN_UNWIRED` set: `'src/skill-workflows/workflow-run-store.ts'` removed (11 → 10 entries).
  - Chip-down note added with v1.49.896 + hoist-at-top class-stored sub-variant identifier.

## Wire shape

**Hoist-at-top, class-stored** (#10448 hoist-at-top variant, second class-stored instance after v890). The ctx flows through the constructor rather than per-call — this is the ergonomic for class-based stores where a single fs-op method (`readAll`) handles all reads. Pairs with v890 to surface "class-stored hoist-at-top" as a documentable 2-instance ergonomic distinct from module-function hoist-at-top (v887/v889).

**N=1 spawn site.** Matches v887/v889/v890. Per #10445, N drives wire shape; N=1 forces single hoist-at-top regardless of LOC band.

**Derived-method ripple.** `getRunEntries` / `getLatestRun` / `getCompletedSteps` all call `readAll()` internally. Each call emits one audit record. Test asserts exactly 3 records under 3 derived-method invocations — load-bearing regression detector for any future refactor that caches `readAll()` results.

## What this ship is

- A forward-cadence security-chokepoint chip per #10432 ratchet-ledger discipline.
- Second class-stored hoist-at-top instance — paired with v890; promotion-eligible at 3rd instance.
- KNOWN_UNWIRED Loader 11 → 10.

## What this ship is not

- Not a counter-cadence ship (engine state UNCHANGED except KNOWN_UNWIRED).
- Not a substrate auto-emit (PENDING-TEST `token_budget.max_percent` remains within #10428 budget through v903).
- Not a NASA degree advance (still 1.178; 114 consecutive ships at margin record).

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — **114 consecutive ships** at this degree; pressure-margin record extended by 1).
Counter-cadence count UNCHANGED at 8.
Manifest entries 23 (UNCHANGED).
Lessons in manifest 95 (UNCHANGED — applies established patterns; no new lesson promotion).
KNOWN_UNWIRED Process UNCHANGED at 0.
KNOWN_UNWIRED Egress UNCHANGED at 0.
**KNOWN_UNWIRED Loader 11 → 10** (-1 via this chip).
Wired calibratable thresholds 7 of 7 (UNCHANGED); verify-axis 6 COVERED + 1 PENDING-TEST (UNCHANGED).
Pre-tag-gate step count: 18 (UNCHANGED).

## Files touched

- `src/skill-workflows/workflow-run-store.ts` (UPDATED)
- `src/skill-workflows/workflow-run-store.test.ts` (UPDATED — 6 new tests in `LoaderContext chokepoint integration (v1.49.896)` block)
- `src/security/loader-context-audit.test.ts` (UPDATED — KNOWN_UNWIRED 11 → 10 + chip-down note)
- `docs/release-notes/v1.49.896/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — chapter count + v896 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.895 → 1.49.896)
