# v1.49.909 — Fifteenth LoaderContext Chip: `intelligence/kb/store.ts` (VERDICT — CLOSES KNOWN_UNWIRED Loader to 0)

**Released:** 2026-05-29

## Why this ship

Final entry in the post-v902 multi-chip LoaderContext campaign. v903-v908 chipped 6 files via wire-up; v909 closes the ledger via VERDICT on `intelligence/kb/store.ts` (1399 LOC). The file's structure is fundamentally different from every other KNOWN_UNWIRED entry: it's a SQLite-DB-backed store using better-sqlite3 native binding, not a filesystem-bytes loader. The only `node:fs` usage is `mkdirSync` to create the parent directory required for SQLite to open its DB file — a write-side operation, intentionally out-of-scope of LoaderContext per #10457.

The audit-test admits three escape hatches:
1. Call `ensureAllowed(...)` (the wire-up route).
2. Add `Role: NOT a disk loader` header doc (the verdict route).
3. Stay in `KNOWN_UNWIRED` (the grandfather route).

For `kb/store.ts`, option 2 is the correct verdict — the file IS intentionally outside the chokepoint because SQLite-DB stores are categorically not LoaderContext targets.

## What's in this ship

- **`src/intelligence/kb/store.ts`** UPDATED:
  - Added `Role: NOT a disk loader` header doc comment explaining the SQLite-DB-backed nature + mkdirSync-only fs usage + #10457 reference.
  - No code changes; no wire-up. Verdict-only.
- **`src/security/loader-context-audit.test.ts`** UPDATED:
  - `KNOWN_UNWIRED` set: `'src/intelligence/kb/store.ts'` removed (1 → 0 entries).
  - **The set is now EMPTY.** LoaderContext ratchet ledger closes to 0.
  - Chip-down note documents the verdict-instead-of-wire approach.

## Wire shape

**Not a wire — a verdict.** First instance of the `Role: NOT a disk loader` header marker applied as a closing-move on a multi-chip campaign. The pattern is distinct from:

- Wire-up (v903-v908): thread `ctx?: LoaderContext` through the surface + add `ensureAllowed` gates.
- KNOWN_UNWIRED grandfathering (the v885 default): defer the wire to a future chip ship.
- **Verdict (v909, NEW)**: declare the file structurally out-of-scope via the header marker.

**When the verdict is appropriate:** the file's `node:fs` usage is exclusively write-side OR its disk access goes through a non-`node:fs` binding (native, FFI, child-process). Per #10457, LoaderContext is a READ-side chokepoint; write-only and non-`node:fs` reads are out-of-scope.

**Verdict criteria checklist** (for future kindred files):
1. Does the file have ANY read-side `node:fs` op (readFile, readdir, access, existsSync without intent-to-read)? → If yes, WIRE-UP.
2. Does the file's disk-read happen through `node:fs` at the JS layer? → If yes, WIRE-UP.
3. Is the only `node:fs` import write-side (mkdir, writeFile, unlink, etc.) or sync-status-check that's used to gate a write? → VERDICT.
4. Does the file's data access route through a native binding (sqlite, native ffi, etc.) that doesn't surface `node:fs`? → VERDICT.

`kb/store.ts` satisfies criteria 3 + 4. Verdict applied.

## Ledger-closure milestone

**KNOWN_UNWIRED Loader: 1 → 0.** With v909, the LoaderContext ratchet ledger empties. All three Tier-E chokepoints are now at 0:

| Chokepoint | Closed at | Path |
|---|---|---|
| ProcessContext | v875 (closure) | spawn / exec / execFile |
| EgressContext | v881 (closure) | fetch / http(s) / network |
| **LoaderContext** | **v909 (this ship)** | readFile / readdir / access / etc. |

This is the second whole-ratchet closure of 2026-05 (after v881 closed EgressContext). The Loader ratchet was the largest at v885 (16 grandfathered entries); it took 24 ships (v885 → v909) to fully chip down.

## Audit emission shape

No new wire = no new audit emissions for kb/store.ts. The file remains structurally out-of-scope. The audit-test's "rejects files that simultaneously claim to be a loader and a non-loader" check (line 172) passes because we added the Role marker BUT didn't add `ensureAllowed` — clean half-truth, not contradiction.

## What this ship is

- A forward-cadence verdict-application ship per #10432 ratchet-ledger discipline.
- The closing-move on the post-v902 multi-chip LoaderContext campaign (7 chips, v903-v909).
- A NEW shape of chip-down action: VERDICT (not wire-up).
- **The whole-ratchet closure of LoaderContext (KNOWN_UNWIRED = 0).**
- KNOWN_UNWIRED Loader 1 → 0.

## Engine state

- NASA degree: **1.178** (127 consecutive ships).
- Counter-cadence count: **10** (UNCHANGED).
- Manifest entries: **23** (UNCHANGED).
- Lessons in manifest: **99** (UNCHANGED — verdict-application is not a new lesson; #10432 ratchet-ledger discipline ALREADY admits this case via the header-marker escape hatch).
- KNOWN_UNWIRED Process: **0** (UNCHANGED).
- KNOWN_UNWIRED Egress: **0** (UNCHANGED).
- **KNOWN_UNWIRED Loader: 1 → 0** (-1; LEDGER NOW CLOSED at 0).
- Wired calibratable thresholds: **7 of 7** (UNCHANGED).
- Pre-tag-gate step count: **18** (UNCHANGED).
- Operational axes: **4** (UNCHANGED).
