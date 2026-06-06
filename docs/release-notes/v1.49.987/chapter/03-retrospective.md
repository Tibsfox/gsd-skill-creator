# v1.49.987 — Retrospective

## What went right

- **Reachability reasoned before edited.** A pre-implementation investigation ran the real adoption scanner against a fixture and established that wiring the command (static or dynamic-string-literal import) flips `amiga` to `reachableFromProduction:true`. That turned a vague "refresh the allowlist reason" item into the correct, convention-aligned action: remove the entry entirely and move the module to the wired set — mirroring the git/skill and Ship-3.3 precedents.
- **One source of truth.** Rather than duplicating transcript-reading and pipeline logic between the runner and the new command, the logic was extracted into `src/amiga/spike/` libs that both consume. The runner became a 6-line shim.
- **Real-data validation at scale.** The `--corpus` mode ran cleanly over 195 sessions / 37,778 tool-uses with zero CE-1 errors, producing 21 aggregated candidates — proving the dormant substrate end-to-end on the whole corpus, not just one transcript.
- **Zero edits to existing `src/amiga`.** The revive remained additive; the substrate's code paths are exercised, not modified.

## What went well in process

- The adversarial pre-push ship review caught a real doc-accuracy MAJOR (the CLI.md `--json` schema row under-listed actual output fields) before push; it was fixed and the commit amended while still local.
- The load-bearing windows CI leg was kept in mind during test authoring: an exact-path assertion that would have failed under `path.win32.join` normalization was rewritten to be separator-agnostic before push, avoiding a red cross-platform cycle.

## What to watch

- **Generic tool-cycle candidates are noise.** The corpus surfaces universal coding transitions (`read-to-edit-cycle`, etc.) at high occurrence counts. These are left **pending** for human curation via `sc:suggest`; none are auto-promoted. A future refinement could rank or filter them by skill-worthiness before they reach the queue.
- **`defaultProjectsDir` slug derivation assumes POSIX-style cwd.** It only matters for the default transcript source; operators on other layouts pass `--projects-dir`. Worth generalizing if the command is run outside the cwd's own project.
- The `.planning/patterns/suggestions.json` sink is gitignored (working-tree only) — the 21 corpus candidates are local state, not shipped.
