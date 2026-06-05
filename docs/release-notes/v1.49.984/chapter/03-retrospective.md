# v1.49.984 — Retrospective

## What went right

- **Small surface, fully verified.** The migrator is one subcommand on an already-wired command, so it shipped with no dispatch changes and no new drift-guards to update. It was covered by 27 unit tests (mocked fs) *and* a real unmocked end-to-end smoke test — the smoke test caught nothing new but confirmed the backup-first ordering and idempotency in practice.
- **The delete-key choice paid off.** Deleting the explicit key (rather than flipping to `true`) means the config self-heals on any future default change and ends up byte-shaped like a fresh install. The allowlist guard makes the single-key mutation provable.
- **Adversarial review caught a real usability bug.** The correctness lens found that the original whole-config re-validate coupled the migrate to *unrelated* field validity — a config with any pre-existing drift (e.g. a hand-left out-of-range `retention_days`) became un-migratable, defeating the cleanup's purpose. Dropping the broad re-validate (the guard already proves safety; deleting a defaulted key never invalidates) fixed it; a new test pins that migrate now succeeds on a drifted-sibling config while preserving the drift untouched.

## What went well in process

- **Scaled the review to blast radius** per the ship-review discipline: 3 lenses (correctness / data-integrity / convention) instead of the full 5, appropriate for a small, deterministic, fully-tested CLI surface that nonetheless writes a file.
- Two ships in one session (5.3 then this) reused the same understand → build → review → ship rhythm; the v982 recon's item-4 design was directly executable.

## What to watch

- **`--apply` reformats the whole config** (JSON.stringify re-serialization) — lossless and the original is preserved in the `.bak`, but byte-diffs touch sections beyond the one key. Acceptable; noted.
- **docs/CLI.md doc-debt:** the entire `integration` command (validate/show/migrate) is absent from the canonical CLI reference — a pre-existing gap this ship did not introduce and deliberately did not expand into. The in-binary help (`integration --help` + top-level help) is complete. A small docs task could add an `integration` section later.
- Adoption of the migrator is operator-driven and per-project; there is no telemetry on how many explicit-false 5.1b installs exist in the wild.
