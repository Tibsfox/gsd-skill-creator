# v1.49.868 — Context

## Provenance

First ship of an operator-directed v868-v882 follow-on campaign after the v857-v867 eleven-ship campaign closed clean. Codify ship per #10428 meta-cadence (11 ships past last codify at v857 — slightly past the 7-10 ship upper bound, but the v858-v867 chip cluster accumulated two promotion-eligible candidates that are ripe for codify now rather than later). Promotes 1 new ESTABLISHED lesson (#10444 — size-ascending chip-pick reveals wire-shape diversity) AND refines #10443 with the operational continuous-verification mode that the v858-v867 campaign validated. Extends two existing discipline manifest entries (`Architecture-retrofit patterns` adds #10444; `KNOWN_UNWIRED allowlists as migration-debt ledger` refines #10443).

Operator chose order at session start: codify (this ship) → pre-tag-gate integration (v869) → Process chips ×6 (v870-875) → Egress chips ×6 (v876-881) → verify-overdue forecast scan (v882). Block sequencing (Process all first, then Egress all). Batch size: singletons. Cadence: full autonomous, only stop on blockers.

## Predecessor

- **v1.49.867** — EgressContext singleton chip: `src/alternative-discoverer/fork-finder.ts` (Track 3 close + campaign close). Eleventh and final ship of v857-v867 campaign. Two-site hoisted-check variant + cross-audit tool regex bug fix (v857 tool's first real-world bug — surfaced and fixed in-flight). KNOWN_UNWIRED Egress 7→6. Engine state UNCHANGED.
- **v1.49.866** — EgressContext singleton chip: `src/site/deploy.ts`. Fourth Egress chip; DI-fetch-wrapper variant (Egress analog of #10441).
- **v1.49.865** — EgressContext singleton chip: `src/aminet/index-freshness.ts`. Third Egress chip; hoist-before-fetch (strict-fail surface).
- **v1.49.864** — EgressContext singleton chip: `src/alternative-discoverer/equivalent-searcher.ts`. Second Egress chip; hoist-at-top + non-npm bypass.
- **v1.49.863** — EgressContext singleton chip: `src/terminal/health.ts`. First Egress chip of Track 3 (campaign opening Egress cluster).
- **v1.49.862** — ProcessContext singleton chip: `src/scan-arxiv/ranker.ts`. Fifth + Track 2 close; closure-capture wire shape.
- **v1.49.861** — ProcessContext singleton chip: `src/cli/commands/keystore.ts`. Fourth Process chip; hoist-outside-Promise (no cleanup).
- **v1.49.860** — ProcessContext singleton chip: `src/intelligence/provenance/linker.ts`. Third Process chip; internal-helper (#10433 application).
- **v1.49.859** — ProcessContext singleton chip: `src/chipset/blitter/executor.ts`. Second Process chip; hoist-outside-Promise + sync temp-dir cleanup.
- **v1.49.858** — ProcessContext singleton chip: `src/drift/cli.ts`. First Process chip of Track 2.
- **v1.49.857** — Codification ship: Promote #10443 (Inverse-audit Stale-Entry Detection). Doc + tool implementation; first codify since v847.
- **v1.49.847 and earlier** — see prior release-notes.

## Disciplines this ship updates

- **Architecture-retrofit patterns** (`docs/architecture-retrofit-patterns.md`) — new ESTABLISHED lesson #10444. Manifest entry summary + key_lessons + codified_at_milestone all updated.
- **KNOWN_UNWIRED allowlists as migration-debt ledger** (`docs/known-unwired-ledger-discipline.md`) — refinement of existing #10443 with the continuous-verification mode operational discipline. Manifest entry summary + codified_at_milestone updated; key_lessons unchanged.
- **CLAUDE.md** — regenerated via `npm run render:claude-md`. Both updated entries render the new content.

## Cross-references to related disciplines

- Architecture-retrofit patterns: Lesson #10414 (parent `ctx?` pattern) + #10416 (tolerant generators) + #10426 (cross-class registry extraction) + #10440 (production-caller path-narrowing) + new #10444 (size-ascending chip-pick)
- KNOWN_UNWIRED ledger discipline: Lesson #10432 (parent) + #10434 (generalization beyond chokepoints) + #10443 (inverse-audit stale-entry detection — refined this ship with continuous-verification mode)
- Failure-mode contracts: Lesson #10427 (silent-vs-loud asymmetry that the continuous-verification mode operationalizes; sibling "tools-detecting-silent-failures-must-fail-loudly" carried as below-threshold observation)
- Static-analysis tool authoring: Lesson #10421 (spawnSync, JSON output, exit-code-as-signal conventions; the v867 tool fix added a sanity-check fixture line per #10421)
- Meta-cadence: Lesson #10428 (codify cadence 7-10 ships; v868 is 11 ships past v857 — accepted flex for active chip-cluster-driven candidate accumulation)

## Forward path

Next ship: **v1.49.869** — Pre-tag-gate integration of the cross-audit tool. Promotes the continuous-verification mode codified this ship from operator-invoked to a deterministic pre-tag-gate step. Approximately 1-2 step additions to `tools/pre-tag-gate.sh` between current step 12 (STORY.md drift) and step 13 (discipline-coverage ceiling). Likely 1 new test surface for the integration.

Remaining v868-v882 campaign (after v869):
- v1.49.870-875 — Process singleton chips ×6 (size-ascending: version-manager → workflows/contribute → pic2html → gates/pre-flight → learn/acquirer → harness-integrity).
- v1.49.876-881 — Egress singleton chips ×6 (size-ascending: package-fetcher → index-fetcher → anthropic-chip → http-client → skill-installer → ipc).
- v1.49.882 — Verify-overdue forecast scan tool.
