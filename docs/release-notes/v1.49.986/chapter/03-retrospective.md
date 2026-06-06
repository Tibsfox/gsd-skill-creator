# v1.49.986 — Retrospective

## What went right

- **Root-cause clustering over symptom-chasing.** The 34 windows failures collapsed into 4 reusable bug classes (path separators, ESM import specifiers, shell-quoting, unix-only spawns). Fixing by class — and deciding tool-fix vs test-fix by whether the path is a *logical* repo-relative one (normalize the tool to POSIX) or a *native* FS path used by a real API like `uploadFrom` (fix the test) — kept the diff principled.
- **The `update-state-md-on-ship` find.** The tool was silently no-op'ing on Windows because `execSync("git tag -l 'v*.*.*'")` runs through cmd.exe, which keeps the literal single quotes — exactly the latent cross-platform bug the windows leg exists to surface. `execFileSync` argv removes the entire shell-quoting class.
- **The flip gate held.** Rung 3 could not be a one-line edit: `windows-flip-readiness.mjs` required 3 consecutive organic-churn green pushes. That was satisfied honestly — by auditing for the *same* bug classes and finding real latent bugs (a sibling `new URL().pathname` main-guard with no direct-CLI test; `which`/`grep` spawns) — not by fabricating churn.

## What went well in process

- **Pipeline the work against CI latency.** Rung-2 cluster A was pushed for an early windows read while clusters B/C were diagnosed in parallel; rung-3 accrual commits were pushed sequentially (each windows-green confirmed before the next, since CI runs only on a push tip and the streak needs consecutive greens).
- **A fix without a test is how it rots.** Every rung-2 fix had a failing test that caught it; the latent `state-md-normalizer-prose` bug had *no* direct-CLI test, which is why it hid — so the fix shipped with the missing regression test.
- **Crash-resilient bookkeeping.** This arc began from a crashed session; durable memory + the session-retro log carried the thread across the reset, and the milestone bundles the whole rung-2/rung-3 history.

## What to watch

- **All three OS legs are now ship-blocking.** A future Windows-only regression (a new unix-ism in a tool the suite exercises) will now block a ship, not warn. That is the intended end state, but it raises the bar on cross-platform discipline for new tool code.
- **Loose pre-existing tree noise** (`dashboard/index.html` regen, `graphify-out/`, `.learn-staging/`, stray v1.49.560/89 chapter reformats) is unrelated to this ship and left untouched.
- **Phase 4 windows arc is closed; the broader cross-platform surface is not exhaustively audited** — only the bug classes the windows test leg actually exercises were swept. New tool code should still apply the portability idioms codified in this ship's lessons.
