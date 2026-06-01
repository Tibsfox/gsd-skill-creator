# v1.49.941 — Retrospective

## What went right

- **The gate caught a fresh critical advisory before it could redden CI.** The npm-audit probe (`closure-verify-cf.mjs npm-audit` at `--audit-level=high`) failed the pre-tag-gate the moment the vitest-UI advisory went live. Because CI runs the same `npx vitest run`, the alternative — pushing without the local gate — would have turned `main` red on the next commit. The probe (#10208) is exactly the gate-not-vigilance instrument that turns "remember to run npm audit" into a deterministic blocker.

- **The blocker was diagnosed to the exact advisory, not guessed.** Rather than reaching for a bypass, the failure was traced: `npm audit` → two advisories; `npm audit --audit-level=high` → only the critical vitest one trips the high threshold (qs is moderate); `npm ls vitest` → the installed version and the peer relationships. That pinned the fix to "raise vitest past 4.1.0" and revealed the secondary `@vitest/coverage-v8` peer mismatch before it became a surprise.

- **The upgrade was validated, not assumed safe.** `npm audit fix` pulled a vitest minor (4.0.18 → 4.1.8) AND an `es-module-lexer` **major** (1 → 2). A major bump in a parser used across the vite/vitest toolchain is a real risk, so the full suite was run before authoring anything: **35663 passed, 0 failed**. Only then did the ship proceed.

- **The fix was made durable, not just lockfile-deep.** `npm audit fix` resolves the *lockfile* but leaves `package.json` ranges (`^4.0.18`) admitting the vulnerable version, and it left `@vitest/coverage-v8` at 4.0.18 (an `invalid peer` against the new vitest). Raising both ranges to `^4.1.8` excludes the vulnerable range at the manifest level and re-aligns the vitest family, so the advisory cannot silently reappear and `npm ls` is clean.

- **Scope discipline held under interruption.** The advisory surfaced mid-flight on a different ship (the counter-cadence macOS sweep). Rather than fold a security/dependency upgrade into a test-hardening milestone, the in-flight work was cleanly unwound (nothing was pushed) and the security fix was given its own ship; the macOS sweep follows as v1.49.942.

## What went well in process

- **`npm ci`-vs-`npm install` reasoning kept the urgency calibrated.** CI was green only because it had not pushed since the advisory went live (CI uses the lockfile via `npm ci`, and the lockfile still pinned 4.0.18). That framed the fix as "do it before the next push," not "CI is already broken" — accurate, and it set the priority correctly.

## What to watch

- **`npm audit fix` does not raise manifest floors or align peers — verify both.** After any `npm audit fix`, check that (a) the affected `package.json` ranges actually exclude the vulnerable versions and (b) `npm ls` reports no `invalid` peers introduced by a partial family bump. The lockfile being clean is necessary but not sufficient. Recorded as a carried-forward candidate (lessons).

- **The npm-audit probe is environment- and time-dependent.** It queries the live advisory database, so a green gate today can go red tomorrow with no code change. That is a feature (it catches fresh advisories), but it means a previously-passing ship can be blocked by an advisory unrelated to its content — treat such a block as a real security signal to resolve, never as flake to bypass.
