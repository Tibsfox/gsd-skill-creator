# v1.49.945 — Lessons

No new manifest lesson is promoted this ship (manifest stays **151**). This is a `fix` ship that **applies** the deferred-maintenance discipline (#10415) and carries forward one test-discipline candidate for a future codify ship.

## Applied (existing lessons)

- **#10415 — deferred-maintenance escalation.** "An open red test in a load-bearing lane is closed within 1-2 milestones; the cost of deferral is silent test drift plus workaround-debt, not the eventual fix." The cargo lane went load-bearing at v1.49.939 with a named accepted-risk; the flake materialized at v1.49.944; this is the closing ship at the +1 milestone. The alarm (a load-bearing lane's silent acceptance of a re-runnable red) was honored rather than absorbed into a standing `gh run rerun` workaround.
- **#10463 / #10427 — load-bearing surfaces fail loudly.** The cargo lane was deliberately promoted to load-bearing so a Rust regression *would* block a ship. The cost of that loudness is that a flaky test now blocks too — which is the correct trade only if the flake is fixed promptly. This ship pays that cost down so the lane's loudness stays meaningful (a cargo red means a real problem).
- **ADR 0001 — dependency-minimalism.** `serial_test` was the idiomatic option and was rejected in favor of a zero-dependency `static Mutex<()>`, avoiding a per-run compile and supply-chain surface in the cargo lane for a five-test need.

## Carried-forward candidate (observed, not promoted)

- **Adding a test that mutates a process-global must trigger a whole-suite audit of every other mutator/reader of that global, serialized by a shared guard in their common ancestor module — a per-file guard is insufficient.** The project's existing "Test authoring" discipline covers vitest (JS) tests; it has no Rust-test entry, and it does not name the process-global-state race class. The specific insight here is the *scope* failure mode: the handoff (and the original test author) treated the race as file-local when it spanned two sibling files, so the correct guard lives in the parent module, not the test file. **One instance** (this ship: `ANTHROPIC_API_KEY` across `keystore_tests.rs` + `client_tests.rs`). Promote to a manifest lesson (a Rust-test-discipline or process-global-state sub-discipline) on a **second** instance — e.g. a future `GSD_REPO_ROOT` race in `intelligence/atlas*.rs`, which is the most likely next candidate. Until then it is a candidate, not a codification.

## Process note

- **A test-only fix still runs the full ship discipline.** Recon-first per #10409 (which surfaced the second racer file the handoff missed); load-bearing counterfactual instead of a mutation test (the concurrency analog); a `fix` code commit then a separate `chore(release)`; five chapters; STORY two-step; bump; full 18-step pre-tag-gate; tag; dual-push with `ls-remote` verification; RH refresh/publish; STATE with `--predecessor-counter-cadence` (v1.49.944 was counter-cadence; this ship is not); CI verified per-job on macOS + cargo + Security-Audit for both commits.
