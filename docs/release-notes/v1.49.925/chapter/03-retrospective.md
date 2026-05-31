# v1.49.925 — Retrospective

## What went well

- **The live run caught a predicate bug that reasoning had missed (#10427 in action).** The checker's churn predicate looked correct on paper, and the unit tests (which used hand-picked `changedFiles`) passed. Then the first *live* run against real `ci.yml` history reported a spurious READY 3/3. Inspecting the actual commits with `git show` revealed the cause: `package.json`/`package-lock.json` were organic, and every `chore(release)` version-bump touches both. Verifying against ground truth — not against the test fixtures I wrote — is exactly the discipline #10463 itself cross-references. The bug is now pinned by a regression test built from the real v924 commit shapes.
- **The adversarial review earned its keep on the safety invariant.** A 4-lens review (correctness / predicate / robustness / doc) returned 2 OK + 2 ISSUES, 0 blockers. The highest-value find: the CLI entry guard `import.meta.url === file://${argv[1]}` silently no-ops under symlink invocation or a path with spaces → empty output + exit 0, which (because exit 0 = READY) *inverts* the tool's documented "misclassification defers, never advances" bias. Fixed with a realpath comparison and a symlink test. Every other find was warn/nit and all were resolved.
- **Operationalize-don't-flip kept the discipline honest.** The operator chose to build the readiness instrument rather than flip the leg. The flip stays deferred (the gate is genuinely not met), and #10463's own anti-pattern — promoting an unproven lane — is respected even while draining its carry-forward.

## What was tricky

- **The misclassification bias direction had to hold at every branch.** A false "organic" advances the flip on weak evidence (dangerous); a false "inert" only defers it (safe). The predicate, the streak walk's unknown-conclusion handling, the `--limit` window under-count, and the dedup-by-sha masking were each checked to fall on the safe side — the package*.json fix and the GH-conclusion vocabulary (only a real `success` advances) both enforce it.
- **A premature version stamp is its own drift class.** The first doc draft hard-coded "v1.49.925" in three places while the repo was at 1.49.924 and the work was unshipped — a stamp that silently goes wrong if the ship lands under a different version. Softened to version-agnostic prose in the discipline doc; the release notes carry the exact version.

## Forward

- **Carry-forward #1 — the load-bearing flip — stays open, now instrumented.** Run `node tools/ci/macos-flip-readiness.mjs` to read the streak. When it reports READY (≥ N organic-churn green macOS runs across genuine development churn, not release/docs ships), the flip deletes `continue-on-error` from `ci.yml` AND updates the `STAGED` assertions in `ci-matrix-parity.test.ts` — the drift-guard makes that pairing mandatory.
- **The staging gotcha is unchanged.** This ship stages only its own surface (the new tool + tests + config registration + the #10463 doc/manifest extension + the v925 notes); it does not sweep the long-standing RH/dashboard working-tree drift. Stage explicitly per file.
