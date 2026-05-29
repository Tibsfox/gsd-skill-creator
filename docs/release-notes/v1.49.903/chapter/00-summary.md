# v1.49.903 — Ninth LoaderContext Chip: `cli/commands/keystore.ts`

**Released:** 2026-05-29

## Why this ship

The v902 carry-forward observation flagged `keystore.ts` (179 LOC) as the unique-smallest KNOWN_UNWIRED Loader entry and explicitly named the deferral reason: the file was already ProcessContext-wired at v861, and the LoaderContext-wire targets sync `existsSync` sites — a NEW wire shape distinct from all prior async-readdir/readFile chips. v903 instantiates that deferral. Per #10444 size-ascending discipline, with the v902 second-smallest already chipped, `keystore.ts` is now the natural next pick.

## What's in this ship

- **`src/cli/commands/keystore.ts`** UPDATED:
  - `loaderCtx?: LoaderContext` added as optional parameter on `resolveKeystoreBin(loaderCtx?)`.
  - `loaderCtx?: LoaderContext` added as optional 4th parameter on `keystoreCommand(args, io, ctx?, loaderCtx?)` and threaded into `resolveKeystoreBin`. Non-breaking: single-arg + 2-arg + 3-arg call patterns continue to work (one production caller at `cli/dispatch.ts:162` uses the single-arg form).
  - `LOADER_SOURCE = 'cli/commands/keystore'` constant.
  - `ensureAllowed(loaderCtx, LOADER_SOURCE, 'exists-check', envOverride)` hoisted inside the `if (envOverride)` branch BEFORE the existsSync call (site 1).
  - `ensureAllowed(loaderCtx, LOADER_SOURCE, 'exists-check', candidate)` hoisted inside the for-loop body BEFORE the existsSync call (site 2).
- **`src/cli/commands/keystore.test.ts`** UPDATED:
  - New `keystoreCommand LoaderContext chokepoint integration (v1.49.903)` describe block with 5 tests:
    - Emits 2 audit records (one per candidate-loop site) when KEYSTORE_BIN is unset.
    - Emits 1 audit record (site-1 only, early return) when KEYSTORE_BIN is set to an existing file.
    - Throws `LoaderContextDenied` when ctx denies the KEYSTORE_BIN override path.
    - Legacy permissive mode (no `loaderCtx`) preserves prior behavior.
    - Threading test: `keystoreCommand(['--help'], ..., loaderCtx)` returns 0 without audit records (help-path early return precedes `resolveKeystoreBin`).
- **`src/security/loader-context-audit.test.ts`** UPDATED:
  - `KNOWN_UNWIRED` set: `'src/cli/commands/keystore.ts'` removed (7 → 6 entries).
  - Chip-down note added with v1.49.903 + NEW sync-existsSync wire-shape identifier.

## Wire shape

**Sync two-site hoisted-check.** NEW sync sub-variant of #10448 — sibling of v892 `dacp/bus/scanner.ts` async two-site hoisted-check. Two distinct `existsSync` sites in `resolveKeystoreBin`:

| Site | Location | Audit op | When it fires |
|---|---|---|---|
| Site 1 | `if (envOverride)` branch | `exists-check` | When `KEYSTORE_BIN` env var is set |
| Site 2 | candidate-loop body | `exists-check` | Per iteration through repo-relative paths |

**Why sync, not async:** `keystore.ts` uses Node `existsSync` deliberately — `resolveKeystoreBin` is called synchronously from `keystoreCommand`'s prologue and the cost of an async existsSync (via `access`) is not worth the added complexity for a short fixed list of paths. The LoaderContext interface admits both sync and async ops via the `'exists-check'` LoaderOp tag; no API change was needed.

**Audit emission shape:** Variable per call (1 or 2 records, depending on whether site 1 returns early). Distinct from prior `#10456` audit-record-count variants which were all fixed-count-per-call.

**Sibling-chokepoint independence:** `keystore.ts` carries both a `ProcessContext` (for child-process spawn at v861) and now a `LoaderContext` (for fs existsSync at v903). Per #10449, the contexts thread separately — `keystoreCommand(args, io, ctx?: ProcessContext, loaderCtx?: LoaderContext)`. Callers wanting both gates pass both; either is independently optional.

## What this ship is

- A forward-cadence security-chokepoint chip per #10432 ratchet-ledger discipline.
- The first instance of a sync-existsSync sub-variant of #10448 (sync two-site hoisted-check). 1-instance candidate that will ripen if more sync-existsSync wires follow.
- A new reinforcement of #10449 (sibling chokepoints stay separate — both ProcessContext and LoaderContext now on one file via independent param threading).
- KNOWN_UNWIRED Loader 7 → 6.

## What this ship is not

- Not a counter-cadence ship (engine state UNCHANGED except KNOWN_UNWIRED).
- Not a substrate auto-emit or new threshold wire (verify-axis remains 7 of 7 COVERED + 0 PENDING-TEST from v898).
- Not a NASA degree advance (still 1.178; 121 consecutive ships at margin record).
- Not a promotion of a new sub-variant — v903 is the first sync-existsSync instance; promotion requires 2 more sync-existsSync chips.

## Engine state

- NASA degree: **1.178** (121 consecutive ships at this degree; pressure-margin record extended by 1).
- Counter-cadence count: **10** (UNCHANGED).
- Manifest entries: **23** (UNCHANGED).
- Lessons in manifest: **99** (UNCHANGED).
- KNOWN_UNWIRED Process: **0** (UNCHANGED).
- KNOWN_UNWIRED Egress: **0** (UNCHANGED).
- **KNOWN_UNWIRED Loader: 7 → 6** (-1 via v903 chip).
- Wired calibratable thresholds: **7 of 7** (UNCHANGED); verify-axis 7 COVERED + 0 PENDING-TEST.
- Pre-tag-gate step count: **18** (UNCHANGED).
- Operational axes: **4** (UNCHANGED).
