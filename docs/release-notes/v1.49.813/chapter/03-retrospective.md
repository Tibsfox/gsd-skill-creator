# v1.49.813 — Retrospective

**Wall-clock:** ~35-45 min from session-start to tag-push. Fourth ship of the v810-814 chain. Counter-cadence ship.

## What worked

**Gate-not-vigilance discipline applied at the right rung.** The v807 ship added a post-write check at pre-tag-gate step 0.5 — that's a DETECTION gate (catches drift after it lands). v813 adds an atomic-writer tool — that's a PREVENTION gate (eliminates the drift window). Both gates ship together as a complete closure. The pattern matches the counter-cadence-discipline doc's "gate-not-vigilance" rule: convert offending process rules into deterministic gates.

**Inline content template beats schema-driven generator.** Initial sketch was to factor out a `state-md-template.json` and have the tool fill placeholders. Rejected per #10416: the template is ~30 lines of literal markdown; a schema would add ~50 lines for the schema definition + parser + interpolation engine, and the literal template is more readable. The decision shape: when N=1 template, just write the template inline.

**Spawn-based belt-and-suspenders for the normalize confirmation.** The tool's atomic write emits content from a template that should be canonical by construction. But the normalizer is the source-of-truth for canonical form, and the template could drift from the normalizer over time (e.g., if the normalizer adds a new section). Belt-and-suspenders: spawn the normalizer post-write, fail loudly if it would change anything. The cost is one extra spawn per call (~50ms); the benefit is structural guarantee that the tool's output is whatever the normalizer accepts.

**Test design mirrors the prior tool patterns.** Recon found 4 sibling tools with similar shapes (state-md-normalizer, project-md-normalizer, append-story-entry, scaffolders). The new tool's test follows the same pattern: pure unit tests for the content builder + CLI arg-validation via spawnSync exit-code assertions + end-to-end via tmpdir + symlinked node_modules. No new test scaffolding; mirror the existing.

**Counter-cadence sized to ~35 min wall-clock.** The mini-cadence on this chain so far:
- v810 (substrate-consumer wire): ~35 min
- v811 (batch chip 4 adapters): ~25 min
- v812 (first chip in new family): ~30 min
- v813 (this ship, counter-cadence tool): ~35-45 min

Counter-cadence tooling ships are in the same wall-clock band as substrate-consumer or first-chip ships. This validates the v805 codification-ship pattern: when the wedge is small and well-framed, counter-cadence is a single ship not a multi-ship effort.

## What surprised

**The normalizer is already single-pass-idempotent post-v783.** I expected the v807 retro to suggest "the normalizer isn't idempotent so we need 2× --write." Reading v807 confirmed that's already fixed (v783 closure). The remaining wedge is purely the hand-edit window, not normalizer pathology. The atomic-writer tool inherits the normalizer's idempotency; no edge case to work around.

**The end-to-end test needed `node_modules` symlinked into the tmpdir.** The normalizer's `require('js-yaml')` resolution fails without `node_modules` reachable from the tmpdir cwd. Used `ln -s` to symlink the real node_modules into the tmp directory. Alternative would have been spawning the normalizer with the tool's NODE_PATH explicitly set, but the symlink is simpler. This is a generally-useful pattern for tmpdir-isolated CLI tests in this codebase.

**The tool's spawn-of-normalizer breaks the "no spawn at boundary" rule for tests but is correct in production.** During testing, the spawn-the-normalizer step is an integration concern (covered by the end-to-end test); unit tests don't need to spawn. So the unit tests cover the content-builder and arg-validation; the e2e test covers the spawn. Clean test-shape separation.

**No false-positives in audit-tests this ship.** Unlike v809 where a docstring tripped the egress audit-test, the new tool uses `node:child_process` for spawn but the file is in `tools/` (excluded from the `src/` audit scope). Clean ship.

## What to watch

- **`tools/state-md-set-shipped.mjs` is the THIRD instance of "tool that spawns the normalizer for post-write confirmation"** (pre-tag-gate step 0.5 was the first; state-md-set-shipped is the second per-call instance; future per-milestone bump tooling could be the third). Per #10426, cross-class registry extraction triggers at 2nd-3rd instance. If a future shared `verifyStateMdCanonical()` helper is justified, it would extract the spawn-and-check pattern. For now, the 6-line pattern is below the abstraction threshold per #10416.

- **The T14 doc step 11.5 ordering is sequential after step 11.** Step 11 is "STATE.md normalize (with prose validator)" which assumes a STATE.md already exists in some hand-authored form. Step 11.5 is "STATE.md shipped-state reset" using the new tool. If an operator runs only step 11.5 (skipping step 11), the tool's internal normalize-check covers correctness. If they run only step 11 (skipping 11.5), the existing flow works. Backward-compatible: legacy procedure (hand-edit + normalize) still works; new tool is optional but recommended.

- **The atomic-writer doesn't yet integrate with `scripts/bump-version.mjs`.** A future ship could integrate: after bump-version updates package.json + tauri.conf.json + Cargo.toml to v<X>, automatically invoke state-md-set-shipped with the milestone name read from release-notes/v<X>/00-summary.md. Would close the entire post-ship state pipeline. Out of scope per #10416; flagged for v814 or later.

- **The auto-normalize on STATE.md write means user backups accumulate.** The normalizer writes a timestamped backup file before each write (`STATE.md.backup-before-normalize-2026-...`). When this tool is used, each ship writes 1 backup. Over a year of ships at 1-3 ships/day, ~300-1000 backup files accumulate in `.planning/`. Gitignored, so no commit cost — but disk footprint grows. Future hygiene: prune backups older than 30 days. Out of scope for v813.

## Verdict on scope

Counter-cadence closure landed at the smallest viable shape: 1 CLI tool (~220 LOC) + 7 tests + 1 T14 doc step + 5 release-notes files. Resisted: schema-driven template generator; interactive prompter; integrating into bump-version; integrating into pre-tag-gate; backfilling past STATE.md files via the tool.

The drift class is now closed in two layers (source eliminator + detector); the gate-not-vigilance discipline is applied at the right rung; the tool is testable in isolation and inherits the normalizer's idempotency.

After v813, the v810-814 chain stands at 4 of 5. Final ship: v814 = codification audit + tentative observation promotion. Should be ~30-60 min depending on how many of the 8 tentative observations meet promotion criteria.

The chain wall-clock pattern at 4 of 5 ships: ~125-150 min total wall-clock. Predicted total for 5 ships: ~155-210 min. Falls within the "single-session" bound for context preservation; matches the v807-808-809 chain's 100-120 min for 3 ships (chain efficiency holds at larger size).
