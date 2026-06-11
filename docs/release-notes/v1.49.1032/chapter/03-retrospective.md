# v1.49.1032 — Retrospective

## What went right

- **Count reconciliation before design.** The audit's "44 sites / 15
  modules" was stale in two directions: v1030's module deletions removed ~12
  sites, and 5 of the remaining 32 grep hits were comment-only (the
  atlas.rs/server.rs zero-spawn invariants documenting themselves). Direct
  verification settled true scope at 27 + 1 portable-pty site before any
  code was written, and the comment-only discovery directly shaped the
  drift-guard (comment-stripping is load-bearing, not cosmetic).
- **Evidence fleet caught the surface grep misses.** The portable-pty
  `spawn_command` path in `commands/pty.rs` matches no `Command::new` grep;
  the fleet's spawn-surface sweep found it, and the drift-guard now matches
  `CommandBuilder::new` so future pty-like surfaces are caught.
- **End-state wiring in one ship.** All 28 sites gated in the introducing
  ship — no `KNOWN_UNWIRED` grandfather list to chip down over ~70 ships as
  the TS surface required. The per-site error-channel classification from
  the fleet made the 13-file wiring mechanical.
- **Step P caught a real latent defect and rejected a wrong fix.** The
  drift-guard's naive comment stripper would silently undercount spawn sites
  on lines where `//` appears inside a string literal. The finding was real
  (verified by probe); the judge's *suggested* fix was itself Rust-incorrect
  (a `'[^']*'` char-literal regex breaks on lifetimes like `&'static str`)
  — the verify-before-applying discipline (v1029) earned its keep on the
  suggestion, not just the finding. Fixed with a string-aware scanner +
  self-test.

## What went well in process

- The deadline item (Node-24 actions) committed and pushed FIRST, so every
  subsequent push validated the bumped workflow — verification came free
  with the ship's own CI traffic, and the deprecation annotations
  disappearing was a crisp binary signal.
- Fleet-claim verification: the gate-evidence agent asserted bump-version
  syncs Cargo.lock; a 10-second direct read refuted it and the manual sync
  rider stayed in T14. Treat fleet claims that contradict two ships of
  direct observation as guilty until proven.
- One commit-hygiene slip (an `--amend` landed on the test commit instead
  of the wiring commit because HEAD had moved) was fixed by rebuilding both
  unpushed commits with a mixed reset — cheap because nothing was pushed.

## What to watch

1. **No policy is installed at runtime.** The chokepoint is in
   audit-ready permissive mode end-to-end; enforcement starts only when a
   startup hook calls `install_process_policy`. Wiring a default policy
   (tmux/git/node/kill/bash/sh + ALLOWED_SHELLS) is a candidate S-ship once
   a desktop session has run against the 98-command ACL (v1030 watch item).
2. **Drift-guard roster is exact-count pinned.** Any spawn-site addition or
   removal in the 13 rostered files fails the default vitest project until
   both the gate and the roster are updated — that is the design, but the
   first contributor to hit it will need the error message to carry them;
   it names file, counts, and the discipline doc.
3. **The graph-perf timing flake** (633ms vs 500ms under vitest+cargo
   concurrent load, green in isolation) is the third distinct perf test to
   flake under external load this band — the class is known (m2-short-term,
   token-budget-warn); if a fourth distinct test joins, consider a
   load-aware skip or a perf-project isolation ship.
