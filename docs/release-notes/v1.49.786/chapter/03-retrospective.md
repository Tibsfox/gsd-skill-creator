# 03 — Retrospective: v1.49.786 Adoption Telemetry Scanner

## What went well

**The static-analysis approach is the right scope for ship 1.** The audit suggested "extend `src/intrinsic-telemetry/`" to emit reports, but on inspection that module is a pure-math Spearman correlation library — extending it would have meant adding runtime tracking infrastructure (which requires instrumenting module entry points). A standalone `tools/adoption-scan.mjs` static-analysis tool ships in one wedge, runs in 200ms, and produces immediately-actionable signal. The runtime-tracking side is the natural ship 2 of 2-3 extension.

**The scope expansion mid-implementation paid off immediately.** First run scanned only `src/` for importers; surfaced 64 test-only-or-isolated modules. But `scribe` showed as test-only — known false negative because scribe is invoked from `tools/ftp-sync.mjs`, not via TS import. Adding `tools/`, `scripts/`, `src-tauri/`, `desktop/` as additional importer roots moved 2 modules from test-only to living (89→91), and surfaced a meaningful limitation to document: the scan measures TS-import-surface adoption, not runtime invocation. The header of the markdown output explicitly states this so consumers don't over-interpret.

**The committed baseline is more valuable than a one-shot scan.** Initial design considered emitting to stdout only. Committing the baseline as `docs/ADOPTION-BASELINE-v1.49.786.md` means future ships can diff: "Module X moved from test-only to living between v786 and v789 — first real caller landed in the cli-extraction work" is a kind of forward-progress observation that ephemeral stdout can't produce.

**Test isolation via spawnSync + tmpdir was already proven at v785.** Mirroring the PROJECT.md normalizer test pattern saved ~15min of harness-design work. The Lesson #10417 candidate from v785 (test-harness stderr-capture semantics) was applied prophylactically here — `spawnSync` from the start, no execSync stderr-loss bug.

## What surprised us

**The Era D substrate adoption gap is bigger than the audit estimated.** The audit's Era D synthesis said "6-ship gap between substrate ship and first non-test caller is the norm." Reality: 20 of 33 Era D modules are still test-only at v786. The Math Foundations Refresh (v1.49.572) substrate is 6/6 test-only — every one of `coherent-functors`, `semantic-channel`, `koopman-memory`, `hourglass-persistence`, `wasserstein-hebbian`, `tonnetz` has zero real callers. That's not a 6-ship gap; it's 214 ships (v572 → v786) with no production wiring. This data does not condemn the substrate (much of it ships default-off intentionally) but it does suggest the "first real caller" gap is more like an order of magnitude larger than the synthesis claimed.

**The scanner detected itself as test-only.** `intrinsic-telemetry` is the natural anchor for adoption telemetry per the audit. It shows up in the report as test-only — its TS API has 2 test importers and 0 real callers. The first non-test consumer of `intrinsic-telemetry`'s sibling substrate could literally be the ship-2-of-2-3 dashboard widget that wires its correlation primitives to the adoption scanner's output. Recursive self-application.

**`upstream` and `upstream-intelligence` are both isolated.** Two distinct top-level modules with related names, neither imported by anyone. `upstream` has 14 self-files / 29 self-importers; `upstream-intelligence` has 7 self-files / 0 self-importers. Possibly a rename-in-flight or duplicate-by-typo. The scanner doesn't resolve it but surfaces it for operator triage.

## What we'd do differently

**The shelfware-threshold flag should accept a JSON config for per-module exemptions.** Some modules (e.g., `dogfood` — clearly a test/smoke-test fixture, 66 self-files but no external use) are correctly isolated. A `tools/adoption-scan.allowlist.json` with explanatory entries (module → "intentionally isolated because X") would let the threshold gate go BLOCK without triggering on known-OK isolates. Defer to ship 2 of 2-3 along with dashboard wiring.

**Type-only imports are conflated with runtime imports.** Test T10 explicitly locks in this behavior ("counted as real callers"). The rationale: type-only consumption still indicates the module's API surface is in use. But for true adoption signal, distinguishing `import type {Foo}` from `import {foo}` would surface modules whose only runtime contribution is type information (i.e., dead-code at runtime). A future ship can split the metric into `realCallerCount` (current) + `runtimeCallerCount` (subset). For ship 1, the conservative count is right.

**No git-log integration for first-caller-date.** The audit explicitly called out the "6-ship gap" finding — measuring that quantitatively requires running git log per file to find the first commit where a non-test importer of a module exists. Out of scope for ship 1 (would add ~100 lines + per-file shell calls). Ship 2 of 2-3 can add this for the dashboard's "newly-adopted modules in last 30 days" widget.

## Forward lessons / candidates

- **#10418 candidate (L786-1)** — Static analyzers must scan multiple importer roots (not just the target tree) to avoid false-negatives from out-of-tree call sites. A module's adoption is measured by who imports it; if importers live in `tools/` or `scripts/` and the scanner only walks `src/`, the report misclassifies modules. Apply: every cross-module-adoption analyzer must enumerate importer-root directories explicitly, not assume target-tree-only.
- **#10419 candidate (L786-2)** — Static-analysis tools should commit a baseline so future runs can diff. A scanner that only emits to stdout produces one-shot reports; a scanner that commits its output to `docs/<TOOL>-BASELINE-vN.md` produces a comparison surface. Apply: every metric-emitting static analyzer should ship with a baseline-commit discipline (overwrite on re-run; the commit history is the diff).

## What this ship validates

- **The audit-to-ship-with-evidence pattern works.** v785 closed the PROJECT.md prose-drift social rule; v786 closed the substrate-adoption observability gap. Each ship took the audit's recommended wedge, sized it for one milestone, and shipped concrete code + tests + integration. The audit's Tier 1 sizing (T1.2 = 2-3 ships) survives contact with reality so far — this is ship 1 of 2-3.
- **The "convert observability gap to deterministic gate" pattern (v585 → v784 gate-not-vigilance) extends to substrate metadata.** PROJECT.md drift was the gate-not-vigilance subject at v785; adoption status is the subject here. Both are converted from social rule ("watch for drift / shelfware") to deterministic check (`npm run adoption-report` + future BLOCK threshold).
- **Same-session audit-then-execute is sustainable.** v785 + v786 both shipped in the same session as the audit was completed. Three substantive deliverables in one wall-clock day (audit + normalizer + adoption scanner). The audit deliverable persists as `.planning/AUDIT-2026-05-26-core-functions-retrospective.md`; ships persist as committed code.

## What this ship escalates

- **NASA forward-cadence engine-state advance is now overdue by 10 ships.** Each Tier 1 ship pushes the plateau wider. Strongly recommend NASA 1.178 IBEX before the next Tier 1 ship.
- **`upstream` vs `upstream-intelligence` divergence** needs triage. Both isolated; possibly a rename-in-flight or a duplicate. Ship 2 of 2-3 should include investigation + cleanup.
- **22 Era D test-only modules awaiting their first real caller.** Even if some are intentionally dormant, this is a candidate "first remediation verdict" pool for ship 3 of 2-3.
