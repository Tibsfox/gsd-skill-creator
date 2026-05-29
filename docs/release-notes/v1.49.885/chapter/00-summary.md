# v1.49.885 — LoaderContext Chip-Down Opener

**Released:** 2026-05-28

## Why this ship

Second of the v884-v886 "alternatives" sub-campaign — operator order Bounded → LoaderCtx → Counter, scope confirmed at v885 entry as "Minimal pattern-extend (recommended)" via 4-option AskUserQuestion.

LoaderContext was the third Tier-E chokepoint surface introduced at v782, but unlike Process+Egress (v806) had no KNOWN_UNWIRED ledger — its audit-test enforced name-glob `*loader*.ts` exclusively, leaving fs-using files matching nearby semantic patterns (`*reader*`, `*scanner*`, `*walker*`, `*store*`) outside audit scope. v885 extends the glob, identifies 15 grandfathered files, and opens the ratchet-ledger so future chips can chew it down ship-by-ship — first test of the v868-v882 wire-shape catalog (#10444 / #10445 / #10447 / #10448) on a third chokepoint cluster.

## What's in this ship

- **Extended audit pattern.** `src/security/loader-context-audit.test.ts` rewritten:
  - Name glob extended from `*loader*` to `(?:loader|reader|scanner|walker|store)` via `NAME_PATTERN_REGEX`.
  - KNOWN_UNWIRED initial allowlist of 15 entries (alphabetical-by-path with LOC band inline per #10444).
  - Stale-entry detector tests mirroring v806 process+egress shape:
    - "KNOWN_UNWIRED entries actually exist and import node:fs" — Shape A inverse: file removed or import dropped invalidates the entry.
    - "KNOWN_UNWIRED entries do NOT call ensureAllowed" — Shape A inverse-check per #10443.
  - 70 parameterized tests pass (`it.each` over discovered files + 3 sanity/integrity tests).
- **Cross-audit integration.** `tools/security/check-stale-known-unwired.mjs` AUDITS array gains LoaderContext entry. Tool now reports clean across 3 chokepoints. v885 fix to Shape B detector unrelated to LoaderContext but surfaced through it.
- **Tool bug fix (2nd instance).** `check-stale-known-unwired.mjs` Shape B detector was stripping `as <alias>` from named imports, then searching for the original name in the body. For `import { promises as fs } from 'node:fs'` (active idiom in `src/eval/calibration-adjustment-store.ts`), the file uses `fs.readFile(...)` but never `promises`, so the original-name search produced a false-positive Shape B report. Fix: when import is aliased, use the alias (local binding) as the search name; otherwise use the original. 2nd instance of "tool itself fails silently" class after v867 regex-hardening — promotion-eligible at #10443 forward-cadence (per v883 carry-forward enumeration).
- **Test surface update.** `tests/security/check-stale-known-unwired.test.ts`:
  - "emits structured JSON" test asserts `reports.length === 3` (was 2) + adds a LoaderContext-report check.
  - Fixture tests append `loader-context-audit.test.ts` stub to each fabricated temp tree so the tool can scan all 3 audits without ENOENT.

## What this ship is

- A LoaderContext chip-down OPENER per option 2 of v883 forward-path.
- Audit-test infrastructure + allowlist establishment; NO actual chips this ship.
- First demonstration that the v868-v882 wire-shape catalog is reusable on a new chokepoint cluster.
- Includes one accessory fix (Shape B alias-handling) that the LoaderContext rollout surfaced.

## What this ship is not

- Not a chip ship — KNOWN_UNWIRED entryCount opens at 15; chips begin in v887+.
- Not a NASA degree advance (still 1.178; 103 consecutive ships at margin record).
- Not a Process/Egress change (both still at KNOWN_UNWIRED 0).
- Not a counter-cadence ship (count unchanged at 6).

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — **103 consecutive ships** at this degree; pressure-margin record extended by 1).
Counter-cadence count UNCHANGED at 6.
Manifest entries 23 (UNCHANGED).
Lessons in manifest 90 (UNCHANGED — 2nd-instance of "tool itself fails silently" observed but not yet promoted).
KNOWN_UNWIRED Process UNCHANGED at 0.
KNOWN_UNWIRED Egress UNCHANGED at 0.
**KNOWN_UNWIRED Loader: opens at 15** (NEW ratchet-ledger).
Wired calibratable thresholds: 5 of 7 (UNCHANGED).
UNCODIFIED count: UNCHANGED.
Pre-tag-gate step count: 18 (UNCHANGED).

## Files touched

- `src/security/loader-context-audit.test.ts` (REWRITTEN — extended pattern + KNOWN_UNWIRED + stale-entry detectors)
- `tools/security/check-stale-known-unwired.mjs` (UPDATED — LoaderContext entry + Shape B alias-fix)
- `tests/security/check-stale-known-unwired.test.ts` (UPDATED — 3-audit assertion + fixture loader-context stub)
- `docs/release-notes/v1.49.885/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — chapter count + v885 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.884 → 1.49.885)
