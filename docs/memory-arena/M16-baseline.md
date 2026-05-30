# M16 Baseline — Live Migration + Adoption Proof (corpus-absent skip-guard)

**Date:** 2026-05-30
**Branch:** dev
**Predecessor:** M15 (cgroup ceiling)

## Overview

M16 is the campaign's **verify-axis** closure. The session-014 roadmap's
entry 2 — "run `migrateJsonToArenaSet()` against the live `.grove/arena.json`
and verify all unique names resolve" — turned out to be **already implemented
and passing**: `src/memory/__tests__/grove-migration-live.test.ts` migrates the
real corpus into a headless in-memory `arena_set_*` store and asserts lossless
migration + end-to-end name resolution. So M16's genuine work was not to build
the proof but to (a) confirm it still holds on the **grown** corpus, and
(b) close a robustness gap so the proof degrades gracefully when the corpus is
absent.

## Adoption proof — verified against the live 107 MB corpus

`npx vitest run src/memory/__tests__/grove-migration-live.test.ts` → **17/17
pass (4.2 s)** against the real `.grove/arena.json` (107,080,451 bytes — 14× the
7.3 MB it was when the test was written). Highlights from real data:

- **Lossless migration:** every chunk migrates, `failedChunks == 0`, tier
  distribution sane (blob > warm, as expected for skill code + research).
- **End-to-end name resolution** through `ContentAddressedSetStore` +
  `GroveNamespace`: **752 namespace bindings** resolve (47 agents, 313 skills,
  12/12 teams verified), multi-hop `name → hash → bytes` works, keyword search
  and **abstention** (nonexistent names → `null`) both correct.

This proves the tier-aware `ArenaSet` (M9–M13) as a working production Grove
backing store over the real corpus — closing audit gap GAP-2-adjacent / S2.

## The hardening — corpus-absent skip-guard

`.grove/arena.json` is a **gitignored runtime artifact** (generated in CI by
`tools/import-filesystem-skills.ts`; present locally from real usage). The test
is in the gated `root` vitest project (`src/**/*.test.ts`), but its first
`describe` block **hard-asserted** the file's existence with no guard — so a
fresh checkout / local `vitest run` without the generation step would **fail**
the block rather than skip it. Its own *second* block and both sibling corpus
tests (`multi-hop-retrieval`, `memory-eval-suite`) already guarded; this block
was the lone outlier.

Fix: a module-scope `liveCorpusExists = existsSync('.grove/arena.json')` gate +
`describe.skipIf(!liveCorpusExists)(...)` on both blocks — the robust idiom,
mirroring the `wwwHarnessAvailable` guard in `vitest.config.ts` (which handles
the gitignored `www/` tree the same way) and the #10182 "skip-guard against
gitignored runtime artifacts" discipline.

**Verified both directions** (corpus temporarily moved aside, then restored
byte-exact):
- corpus present → **17 passed** (4.2 s)
- corpus absent → **17 skipped**, 0 failed (0.35 s)

No production code changed — this is a test-robustness slice.

## Follow-on (noted, not silently dropped)

The sibling corpus tests `multi-hop-retrieval.test.ts` and
`memory-eval-suite.test.ts` use the weaker `if (!existsSync(...)) return` guard
inside `beforeAll` (prevents the expensive setup but leaves the suite state
undefined, so the `it`s would still fail rather than skip if the corpus were
ever absent in a run). They never trip today (CI always generates the fixture;
local always has the corpus), but converting them to the same
`describe.skipIf` idiom would close the class uniformly — a small, safe
follow-on left out of M16 to keep this slice scoped to the migration proof.

## Re-run

```bash
npx vitest run src/memory/__tests__/grove-migration-live.test.ts   # runs where .grove/arena.json exists, skips otherwise
```
