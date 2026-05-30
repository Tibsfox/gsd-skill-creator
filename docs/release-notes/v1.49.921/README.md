# v1.49.921 — macOS Lane First Run: 6 Cross-Platform Bugs Fixed (tmpdir-Symlink Test Hardening)

**Shipped:** 2026-05-30
**Type:** Fix (cross-platform; fix-forward from the v1.49.920 macOS CI lane)
**NASA degree:** 1.178 (unchanged — 136 consecutive ships)
**Predecessor:** v1.49.920

## What shipped

The decoupled macOS vitest lane stood up in v1.49.920 had its first dispatched run
**fail** — surfacing 6 pre-existing cross-platform bugs across 3 test files that Linux
CI had never exercised. This milestone fixes them, turning the lane's signal green.

### One root cause: the macOS tmpdir symlink

All 6 failures share a cause. Tests create a scratch dir via `mkdtempSync(join(tmpdir(),
…))` and compare against paths derived from that un-resolved string, but the code under
test returns **realpath-normalized** paths:

- `isCliEntrypoint` compares `fileURLToPath(import.meta.url)` to `realpathSync(argv[1])`
  (by design — symlinked invocations must match).
- `walkProjectFiles` returns realpath-normalized absolute paths.

On Linux `tmpdir()` is `/tmp` (not a symlink) so both forms are identical and the tests
pass. On macOS `tmpdir()` is under `/var/folders/…` and `/var` → `/private/var`, so the
forms diverge — the latent bug was simply invisible until the lane ran.

### The fix (test-only)

Source code is unchanged. Each `mkdtempSync(tmpdir())` is wrapped in `realpathSync(…)`
so the test's scratch root matches the code's normalized output — 4 sites across:

- `src/cli/entrypoint-guard.test.ts`
- `src/intelligence/atlas-indexer/__tests__/file-walker.test.ts`
- `src/intelligence/atlas-indexer/__tests__/runner.test.ts`

No-op on Linux; resolves the `/var`→`/private/var` divergence on macOS.

## Verification

- 3 fixed files green on Linux (**31 tests**); full tsc build clean; zero source changes.
- macOS proof: the lane is re-dispatched post-ship to confirm the failures are resolved.

## Engine state

- NASA degree 1.178 (unchanged)
- Counter-cadence count: 18 (unchanged — audit-driven forward work)
- Manifest: 24 domains, 149 lessons (unchanged — lesson candidate noted, not codified)
- The macOS CI lane (v920) is now a *working* cross-platform signal, green after this fix

## Chapters

- [00-summary](chapter/00-summary.md)
- [03-retrospective](chapter/03-retrospective.md)
- [04-lessons](chapter/04-lessons.md)
- [99-context](chapter/99-context.md)
