# v1.49.887 — First LoaderContext Chip

**Released:** 2026-05-28

## Why this ship

First chip against the v885 LoaderContext KNOWN_UNWIRED ledger (15 entries opened). v885's release-notes forward path explicitly named `src/console/reader.ts` (109 LOC, smallest entry) as the likely first chip — v887 executes that prediction. First demonstration that the v868-v882 wire-shape catalog (#10444 / #10445 / #10447 / #10448) is reusable on the third chokepoint cluster.

## What's in this ship

- **`src/console/reader.ts` wired.** `MessageReader` constructor now accepts `ctx?: LoaderContext`. The `readPending()` method calls `ensureAllowed(this.ctx, 'console/reader', 'read-dir', this.basePath)` once at top-of-method, hoisted OUTSIDE the per-file try/catch so `LoaderContextDenied` propagates per #10442.
- **Wire shape: hoist-at-top (#10448 sub-variant 1).** N=1 spawn site (single `readPending()` method); all four fs ops (`mkdir` ackDir, `readdir` pendingDir, `readFile` srcPath, `rename` srcPath→destPath) confined under `basePath` via `path.join`. One ensureAllowed at method-top covers the entire scope — one audit record per `readPending()` call. Mirrors `src/interpreter/loader.ts` hoist-at-top pattern (v782 original LoaderContext caller).
- **Op tag: `read-dir`.** The semantic is directory-scan-and-process; readdir drives the rest. `target` is `basePath` (the operator's authorized root); the allow-list operator can use prefix-pattern (`basePath + '/'`) or exact-match.
- **`src/console/reader.test.ts` extended.** 5 new tests in a `LoaderContext chokepoint integration (v1.49.887)` block:
  - Exactly one audit record per readPending call when ctx is provided.
  - One audit record regardless of file count (confirms hoist-at-top single-gate behavior).
  - `LoaderContextDenied` thrown when basePath not in allowList.
  - Legacy permissive mode (no ctx) returns array without denial.
  - Admits basePath via prefix-pattern (trailing slash) in allowList.
- **`src/security/loader-context-audit.test.ts` KNOWN_UNWIRED reduced 15 → 14.** `src/console/reader.ts` removed from allowlist + chip-down note added inline.

## What this ship is

- A forward-cadence chip ship per v883 forward-path option 2 + v885 forward-path "v887+: First LoaderContext chip".
- N=1 hoist-at-top wire on the smallest-LOC entry.
- Reuses the established wire-shape catalog with zero new patterns.
- First validation that LoaderContext's ratchet-ledger behaves identically to Process/Egress at chip time.

## What this ship is not

- Not a NASA degree advance (still 1.178; 105 consecutive ships at margin record).
- Not a counter-cadence ship (count unchanged at 7).
- Not a Process/Egress change (both still at KNOWN_UNWIRED 0).
- Not a new pattern discovery — applies existing catalog (#10448 sub-variant 1).

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — **105 consecutive ships** at this degree; pressure-margin record extended by 1).
Counter-cadence count UNCHANGED at 7.
Manifest entries 23 (UNCHANGED).
Lessons in manifest 92 (UNCHANGED — chip applies existing catalog; nothing promoted).
KNOWN_UNWIRED Process UNCHANGED at 0.
KNOWN_UNWIRED Egress UNCHANGED at 0.
**KNOWN_UNWIRED Loader: 15 → 14** (-1 via `src/console/reader.ts` chip).
Wired calibratable thresholds: 5 of 7 (UNCHANGED).
Pre-tag-gate step count: 18 (UNCHANGED).

## Files touched

- `src/console/reader.ts` (UPDATED — LoaderContext threaded through constructor + `ensureAllowed` at `readPending` top)
- `src/console/reader.test.ts` (UPDATED — 5 new LoaderContext integration tests)
- `src/security/loader-context-audit.test.ts` (UPDATED — KNOWN_UNWIRED 15 → 14 + chip-down note)
- `docs/release-notes/v1.49.887/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — chapter count + v887 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.886 → 1.49.887)
