# v1.49.897 — Sixth LoaderContext Chip: `discovery/scan-state-store.ts`

**Released:** 2026-05-29

## Why this ship

KNOWN_UNWIRED Loader ledger had 10 entries post-v896. Per #10444 size-ascending discipline + #10445 N-driven wire shape, the smallest LOC class-based entries (`scan-state-store.ts` and `artifact-scanner.ts` both 176 LOC) were candidates. Live inspection chose `scan-state-store.ts` because its structural shape (class + single `readFile` site in `load()` + ENOENT-tolerant try/catch) is byte-shape-identical to v890 (`calibration-adjustment-store.ts`) and v896 (`workflow-run-store.ts`), making it the natural **3rd instance** of class-stored hoist-at-top. The 3rd instance promotes the sub-variant from 2-instance carry-forward to ESTABLISHED.

## What's in this ship

- **`src/discovery/scan-state-store.ts`** UPDATED:
  - `private readonly ctx?: LoaderContext` field added.
  - Constructor signature: `constructor(statePath?: string, ctx?: LoaderContext)`. Non-breaking — single production caller (`corpus-scanner.ts:97`) and 14 test sites continue to work as legacy-permissive.
  - `LOADER_SOURCE = 'discovery/scan-state-store'` constant.
  - `ensureAllowed(this.ctx, LOADER_SOURCE, 'read-file', this.statePath)` hoisted at top of `load()` BEFORE the try/catch that swallows ENOENT (per #10442 — `LoaderContextDenied` must propagate, not be masked by the missing-file tolerance).
  - `save()` intentionally NOT gated — LoaderContext is a read-side chokepoint by design.
- **`src/discovery/scan-state-store.test.ts`** UPDATED:
  - New `LoaderContext chokepoint integration (v1.49.897)` describe block with 6 tests:
    - Emits exactly one audit record on `load()` when ctx is provided.
    - Throws `LoaderContextDenied` when statePath is not in allowList — denial propagates ABOVE the ENOENT swallow (the #10442 invariant test).
    - Legacy permissive mode when ctx is undefined.
    - Admits statePath via prefix-pattern (trailing slash) in allowList.
    - `save()` is not gated (write-side out of scope).
    - Derived methods (`addExclude` / `removeExclude`) each transitively call `load()` once and emit one audit record per call (total 2 records under 2 derived-method invocations; the explicit `save()` between them emits zero).
- **`src/security/loader-context-audit.test.ts`** UPDATED:
  - `KNOWN_UNWIRED` set: `'src/discovery/scan-state-store.ts'` removed (10 → 9 entries).
  - Chip-down note added with v1.49.897 + third-instance-promotion identifier.

## Wire shape

**Hoist-at-top, class-stored — THIRD instance.** v890 (calibration-adjustment-store) + v896 (workflow-run-store) + v897 (scan-state-store) = 3 instances applying the same byte-shape: `private readonly ctx?: LoaderContext` field, accepted in constructor, consumed via `this.ctx` at the single fs-op method. The 3-instance threshold promotes class-stored hoist-at-top from 2-instance carry-forward to ESTABLISHED. The next codify ship (v899) absorbs this as a documented #10448 sub-variant.

**N=1 spawn site.** Matches v890/v896. Per #10445, N drives wire shape; N=1 forces single hoist-at-top regardless of LOC band.

**Derived-method ripple — 2-instance now.** v896 surfaced the pattern with `getRunEntries` / `getLatestRun` / `getCompletedSteps` (3 derived methods, 3 audit records). v897 surfaces it with `addExclude` / `removeExclude` (2 derived methods, 2 audit records; `save()` between them emits 0). Both are instances of "audit-record-count assertion as load-bearing regression detector against silent fidelity reductions" — the second instance strengthens the codify candidate.

## What this ship is

- A forward-cadence security-chokepoint chip per #10432 ratchet-ledger discipline.
- **Third class-stored hoist-at-top instance — promotes sub-variant to ESTABLISHED.**
- KNOWN_UNWIRED Loader 10 → 9.

## What this ship is not

- Not a counter-cadence ship (engine state UNCHANGED except KNOWN_UNWIRED — v899 will be the codify ship that absorbs the promotion).
- Not a substrate auto-emit (PENDING-TEST `token_budget.max_percent` remains within #10428 budget; v898 will close it).
- Not a NASA degree advance (still 1.178; 115 consecutive ships at margin record).

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — **115 consecutive ships** at this degree; pressure-margin record extended by 1).
Counter-cadence count UNCHANGED at 8.
Manifest entries 23 (UNCHANGED).
Lessons in manifest 95 (UNCHANGED — promotion deferred to v899 codify ship).
KNOWN_UNWIRED Process UNCHANGED at 0.
KNOWN_UNWIRED Egress UNCHANGED at 0.
**KNOWN_UNWIRED Loader 10 → 9** (-1 via this chip).
Wired calibratable thresholds 7 of 7 (UNCHANGED); verify-axis 6 COVERED + 1 PENDING-TEST (UNCHANGED).
Pre-tag-gate step count: 18 (UNCHANGED).

## Files touched

- `src/discovery/scan-state-store.ts` (UPDATED)
- `src/discovery/scan-state-store.test.ts` (UPDATED — 6 new tests in `LoaderContext chokepoint integration (v1.49.897)` block)
- `src/security/loader-context-audit.test.ts` (UPDATED — KNOWN_UNWIRED 10 → 9 + chip-down note)
- `docs/release-notes/v1.49.897/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — chapter count + v897 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.896 → 1.49.897)
