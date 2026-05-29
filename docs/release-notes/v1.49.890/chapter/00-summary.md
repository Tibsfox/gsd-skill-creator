# v1.49.890 — Third LoaderContext Chip

**Released:** 2026-05-28

## Why this ship

Third chip of the LoaderContext KNOWN_UNWIRED ledger. v887 (109 LOC class) + v889 (120 LOC free function) both chipped via N=1 hoist-at-top. v890 picks the next-smallest entry (129 LOC class) per #10444 size-ascending traversal — and surfaces the first read-vs-write asymmetry in the chip campaign.

## What's in this ship

- **`src/eval/calibration-adjustment-store.ts` wired.** `CalibrationAdjustmentStore` constructor now accepts `ctx?: LoaderContext`. The `load()` method calls `ensureAllowed(this.ctx, 'eval/calibration-adjustment-store', 'read-file', p)` once at top-of-method, hoisted OUTSIDE the try/catch that swallows ENOENT so `LoaderContextDenied` propagates per #10442.
- **Wire shape: hoist-at-method-top (sub-variant of #10448 sub-variant 1).** N=1 gated method (`load()`); `save()` is intentionally NOT gated.
- **Read-only chokepoint discipline explicit.** LoaderContext's docstring frames the surface as "for loaders that READ bytes from the filesystem." `save()` writes; it falls outside the contract. The audit-test enforces "imports node:fs MUST call ensureAllowed" — a single call in `load()` satisfies that invariant. The save path is left explicitly unaudited with an inline docstring comment + a dedicated test asserting `save()` is NOT gated.
- **Test additions.** `src/eval/calibration-adjustment-store.test.ts` gains 6 new tests in a `LoaderContext chokepoint integration (v1.49.890)` block:
  - Exactly one audit record per `load()` call when ctx is provided.
  - `LoaderContextDenied` thrown when filePath not in allowList.
  - Legacy permissive mode (no ctx).
  - Prefix-pattern admission.
  - Override path admitted via audit when `load(overridePath)` is called.
  - **`save()` is NOT gated** — explicit assertion that the chokepoint is read-side only.
- **`src/security/loader-context-audit.test.ts` KNOWN_UNWIRED reduced 13 → 12.** `calibration-adjustment-store.ts` removed + chip-down note added inline (with the read-side/write-side asymmetry noted).

## What this ship is

- A forward-cadence chip ship per v883/v885/v887/v889 chain.
- N=1 hoist-at-method-top wire on the third-smallest LOC entry.
- First chip surfacing the read-vs-write asymmetry of LoaderContext.
- Establishes the precedent: gate the read paths only; leave write paths to a future WriterContext or scope expansion of LoaderOp.

## What this ship is not

- Not a NASA degree advance (still 1.178; 108 consecutive ships at margin record).
- Not a counter-cadence ship (count unchanged at 7).
- Not a new pattern discovery in the strict sense — applies #10448 sub-variant 1 with a clarification that the gate is per-method when methods have distinct semantics (read vs write).
- Not extending LoaderOp to add 'write-file' (deferred; would be a scope expansion).

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — **108 consecutive ships** at this degree; pressure-margin record extended by 1).
Counter-cadence count UNCHANGED at 7.
Manifest entries 23 (UNCHANGED).
Lessons in manifest 92 (UNCHANGED — chip applies existing catalog with read-side-only refinement).
KNOWN_UNWIRED Process UNCHANGED at 0.
KNOWN_UNWIRED Egress UNCHANGED at 0.
**KNOWN_UNWIRED Loader: 13 → 12** (-1 via `calibration-adjustment-store.ts` chip).
Wired calibratable thresholds: 6 of 7 (UNCHANGED).
Pre-tag-gate step count: 18 (UNCHANGED).

## Files touched

- `src/eval/calibration-adjustment-store.ts` (UPDATED — ctx?: LoaderContext + ensureAllowed in load())
- `src/eval/calibration-adjustment-store.test.ts` (UPDATED — 6 new LoaderContext integration tests including read-vs-write asymmetry assertion)
- `src/security/loader-context-audit.test.ts` (UPDATED — KNOWN_UNWIRED 13 → 12 + chip-down note)
- `docs/release-notes/v1.49.890/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — chapter count + v890 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.889 → 1.49.890)
