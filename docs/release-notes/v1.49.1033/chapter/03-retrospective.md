# v1.49.1033 — Retrospective

## Carryover lessons applied

- **Ultracode review-before-refine.** The 23-agent review workflow (doc
  auditors + live checkers + adversarial verify + completeness critic) ran
  BEFORE any edit; the completeness critic caught two angles all ten
  primary agents missed (committed release notes still claiming 12 files
  live; the 45-file fabricated-gate-claim cohort) and one
  resolution-critical inter-auditor contradiction.
- **Adversarial verification earns its cost.** Two MAJOR findings were
  severity-adjusted and one BLOCKER was refuted outright (the dashboard
  404s were a deliberate takedown, not drift) — a redeploy "fix" would have
  re-published leaked content. The refuted finding's residual (stale
  committed claims) was still real and shipped as errata.
- **git-add-blocker discipline** (add + commit in one call) held; one
  near-miss where `git add docs/release-notes/` swept 3 pre-existing
  untracked stragglers into the errata commit — caught immediately,
  commit split before push.
- **No Co-Authored-By trailers** (v1.49.621 policy, enforced by hook) —
  all 7 commits clean.

## New lessons captured

1. **Enrichment tools must not fabricate measured results.** The scorer
   rewarded bold-bullet density; the injector satisfied it by asserting a
   specific composite result it never measured, replicated across 25
   versions. Honest process statements satisfy the same scorer (verified:
   A/95 unchanged post-sweep). Audit other enrichment surfaces for the
   same class.
2. **First execution of gated tests is itself a test.** Both
   never-executed paths that involved spawning external tools had defects
   invisible to every mock-based suite (netlistsvg's no-zero-exit CLI;
   vitest-VM dynamic-import). Authored-but-never-run = unverified.
3. **A drift-guard that can silently soft-skip is not a guard.** The C10
   smoke suite skip-guard keyed on the full 12-file manifest; when 4 files
   were deliberately removed, the guard went silent everywhere, forever,
   while still being cited as C10 evidence. Skip-guards should distinguish
   "environment lacks artifacts" from "manifest changed".
4. **WASM toolchain shims unlock no-root evidence runs.** YoWASP yosys
   0.64 behind a 50-line argv shim (`.yosys-shim/`) was enough to run the
   full netlist pipeline without system installs; the fast-path trick for
   version probes (prober timeout 5s < WASM cold-start) is the one
   non-obvious part.
5. **Record the honest negative.** GPU layout loses to CPU at 1K nodes
   (17.8 vs 19.8 FPS) — recording this prevents the next session from
   re-claiming 1K-scale GPU superiority the evidence does not support.
