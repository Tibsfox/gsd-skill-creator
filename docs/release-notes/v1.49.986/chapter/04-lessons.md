# v1.49.986 — Lessons

No manifest lesson is promoted this ship (manifest count holds at **152**). This is forward Phase-4 CI infrastructure that completes the windows arc and applies existing disciplines.

## Applied (existing lessons)

- **#10463 — staged CI-lane promotion.** The windows leg flipped from staged (`continue-on-error`) to load-bearing only on the deterministic `windows-flip-readiness.mjs` READY 3/3 verdict across organic churn — never on greens from the promotion ship itself. The three accrual greens were diverse real fixes, not fabricated churn.
- **#10461 — drift-guard pairing / gate-enforce-every-runnable-surface.** The matrix edit (delete the gated `continue-on-error`) and the `ci-matrix-parity.test.ts` invariant flip (STAGED-WINDOWS → LOAD-BEARING ZERO-COE) shipped in one commit, so a silent re-stage fails the guard.
- **#10427 — no stale guidance.** Post-flip, `windows-flip-readiness.mjs` reads `ci.yml` and switches its advice to "already load-bearing; here is how to REVERT" rather than continuing to say "delete the line."
- **#10184 — single-step main fast-forward;** **#10197 — STORY-gate runs post-bump-version;** **#10221 — zero dev/main drift.** Applied through the canonical T14 ship sequence.

## Process notes

- **cmd.exe is Node's Windows child shell regardless of the workflow `shell: bash`.** `defaults.run.shell: bash` governs `run:` steps, not `execSync`/`spawnSync`/`import()` inside Node — so single-quoted shell globs (`'v*.*.*'`) survive into the program and match nothing. Prefer `execFileSync(argv)` (no shell) for any program call with glob/quote-sensitive arguments.
- **Native paths are not ESM specifiers and not URL pathnames.** `await import()` needs `pathToFileURL().href` (a raw `D:\…` throws `ERR_UNSUPPORTED_ESM_URL_SCHEME`); a main-guard needs `fileURLToPath(import.meta.url)`, never `new URL(import.meta.url).pathname` (which yields `/D:/…` on Windows and never equals native `argv[1]`).
- **Tool-fix vs test-fix is decided by path intent.** A *logical* repo-relative path that a tool emits/compares should be POSIX-normalized in the tool; a *native* filesystem path a real API consumes (e.g. `basic-ftp`'s `uploadFrom`) must stay native, so the *test's* assertions are made separator-agnostic instead.
- **Unix-only binaries have portable replacements.** `ln -s` → `fs.symlinkSync(target, link, 'junction')`; `which` → `where` on win32; `grep -rl` → a Node-native recursive search.
