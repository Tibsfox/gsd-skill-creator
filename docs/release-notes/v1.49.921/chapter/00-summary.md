# v1.49.921 — Summary

**The macOS lane proved its worth on day one.** v1.49.920 stood up the decoupled macOS vitest lane; its very first dispatched run failed — surfacing **6 real, pre-existing cross-platform bugs** across 3 test files that Linux CI had never been able to see. This milestone fixes them. The lane is now a *working* cross-platform signal, not just a shipped one. No NASA degree advance (1.178); audit-driven forward work, so counter-cadence holds at 18.

## One root cause: the macOS tmpdir symlink

All 6 failures (`src/cli/entrypoint-guard.test.ts` ×2, `src/intelligence/atlas-indexer/__tests__/file-walker.test.ts` ×3, `runner.test.ts` ×1) are the same class. The tests create a scratch directory with `mkdtempSync(join(tmpdir(), …))` and compare against paths derived from that un-resolved string. But the **code under test returns realpath-normalized paths**:

- `isCliEntrypoint` compares `fileURLToPath(import.meta.url)` against `realpathSync(argv[1])` (by design — the docstring is explicit: symlinked invocations must still match).
- `walkProjectFiles` returns realpath-normalized absolute paths.

On Linux, `tmpdir()` is `/tmp` (not a symlink), so the un-resolved and realpath'd forms are identical and the tests pass. On macOS, `tmpdir()` lives under `/var/folders/…`, and `/var` is a symlink to `/private/var` — so the two forms diverge by the `/private` prefix. The atlas-indexer assertions show it plainly: `expected [ '-BdNfIX/src/a.ts' ] to deeply equal [ 'src/a.ts' ]` — the test's `p.slice(root.length + 1)` under-counts by the `/private` length because `walkProjectFiles` realpath'd the root and the test's `root` did not.

## The fix: realpath the temp root in test setup

Source code is **unchanged** — `isCliEntrypoint` and `walkProjectFiles` are correct (realpath-normalizing is the right behavior). The fix is test-only: wrap each `mkdtempSync(tmpdir())` in `realpathSync(…)` so the test's scratch root matches the code's normalized output. Four sites across the 3 files. On Linux this is a no-op (realpath of a non-symlinked path is itself); on macOS it resolves the `/var`→`/private/var` divergence.

## Verification

- The 3 fixed files run green on Linux: **31 tests pass**, full `npm run build` (tsc) clean, zero source changes.
- macOS proof: the macOS lane is re-dispatched post-ship to confirm the 6 failures are resolved (the green the v920 lane could not yet show).

## The meta-point

This is the "run the path" lesson realized one layer up. v920's caveat was that a CI workflow can't be proven green until it runs on GitHub. It ran — and immediately earned its keep by catching latent cross-platform bugs that had been invisible for the life of those tests. The decoupled design meant the red first run blocked nothing; this ship turns the signal green.
