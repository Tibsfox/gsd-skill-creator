# v1.49.889 — Second LoaderContext Chip

**Released:** 2026-05-28

## Why this ship

Second chip of the LoaderContext KNOWN_UNWIRED ledger opened at v885 (15 entries). v887 chipped the smallest entry (`src/console/reader.ts` 109 LOC); v889 continues size-ascending traversal per #10444 with the next-smallest at 120 LOC. Confirms the size-ascending rule's claim that small-LOC + low-N selects the simplest wire shape.

## What's in this ship

- **`src/intelligence/atlas-indexer/file-walker.ts` wired.** `WalkOptions` interface gains `ctx?: LoaderContext`. The `walkProjectFiles` function calls `ensureAllowed(opts.ctx, 'atlas-indexer/file-walker', 'read-dir', root)` once at top-of-function, hoisted OUTSIDE the realpath try/catch so `LoaderContextDenied` propagates per #10442.
- **Wire shape: hoist-at-top (#10448 sub-variant 1).** N=1 spawn site (single `walkProjectFiles` entry point holds all four fs ops — outer realpath, inner walk's realpath, readdir, stat); all paths confined under `root` via path.join + symlink-loop guard. Same shape as v887 console/reader.ts.
- **Why opts.ctx (vs separate parameter).** `WalkOptions` is already an options bag; adding ctx as a property keeps the public signature stable for the one production caller (`src/intelligence/atlas-indexer/runner.ts`). The runner doesn't pass ctx today; a future ship can thread it without re-shaping the signature.
- **Test additions.** `src/intelligence/atlas-indexer/__tests__/file-walker.test.ts` gains 6 new tests in a `LoaderContext chokepoint integration (v1.49.889)` block:
  - Exactly one audit record per call when ctx is provided.
  - One audit record regardless of file/directory tree size.
  - `LoaderContextDenied` thrown when root not in allowList.
  - Legacy permissive mode (no ctx) returns walked files without denial.
  - Prefix-pattern admission via trailing-slash allowList entry.
  - Denial fires BEFORE realpath (denied paths may not exist).
- **`src/security/loader-context-audit.test.ts` KNOWN_UNWIRED reduced 14 → 13.** `file-walker.ts` removed + chip-down note added inline.

## What this ship is

- A forward-cadence chip ship per v883/v885 forward-path option 2 + v887 follow-on.
- N=1 hoist-at-top wire on the second-smallest LOC entry.
- Reuses the established wire-shape catalog with zero new patterns.
- Mirrors v887's wire shape exactly — first confirmation that the catalog's sub-variant 1 generalizes cleanly across distinct call shapes (class-method vs free function).

## What this ship is not

- Not a NASA degree advance (still 1.178; 107 consecutive ships at margin record).
- Not a counter-cadence ship (count unchanged at 7).
- Not a Process/Egress change (both still at KNOWN_UNWIRED 0).
- Not a new pattern discovery — applies existing catalog (#10448 sub-variant 1).

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — **107 consecutive ships** at this degree; pressure-margin record extended by 1).
Counter-cadence count UNCHANGED at 7.
Manifest entries 23 (UNCHANGED).
Lessons in manifest 92 (UNCHANGED — chip applies existing catalog).
KNOWN_UNWIRED Process UNCHANGED at 0.
KNOWN_UNWIRED Egress UNCHANGED at 0.
**KNOWN_UNWIRED Loader: 14 → 13** (-1 via `file-walker.ts` chip).
Wired calibratable thresholds: 6 of 7 (UNCHANGED after v888 flip).
Pre-tag-gate step count: 18 (UNCHANGED).

## Files touched

- `src/intelligence/atlas-indexer/file-walker.ts` (UPDATED — `WalkOptions.ctx?: LoaderContext` + `ensureAllowed` at top)
- `src/intelligence/atlas-indexer/__tests__/file-walker.test.ts` (UPDATED — 6 new LoaderContext integration tests)
- `src/security/loader-context-audit.test.ts` (UPDATED — KNOWN_UNWIRED 14 → 13 + chip-down note)
- `docs/release-notes/v1.49.889/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — chapter count + v889 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.888 → 1.49.889)
