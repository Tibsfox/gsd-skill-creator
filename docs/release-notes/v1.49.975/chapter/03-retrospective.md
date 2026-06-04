# v1.49.975 — Retrospective

## What went right

- **Recon-before-build refuted the relocation premise — the same pattern that refuted D1/D3.** The audit plan named four agents to relocate as "frozen/vestigial." A 5-agent recon plus a ground-truth dispatch-site probe found all four are **description-dispatched** (model-invoked by their `description`, not a scripted `subagent_type=`) and load-bearing — relocating would have broken `render-claude-md` classifyAgents (pre-tag-gate step 7), drifted `INVENTORY-MANIFEST`, and made `install.cjs` exit 1. The "retire dormant agents" half of the ship dissolved on inspection; the valuable half (the telemetry) stayed.
- **The scanner mirrors the proven src/ tool instead of reinventing.** `tools/agent-adoption-scan.mjs` copies `adoption-scan.mjs`'s shape (allowlist semantics, `--json`/`--dormant-threshold`, `exitWhenDrained`, the living/test-only/dormant verdict rule) — so it inherits a year of hardening (e.g. the #10420 flush-before-exit guard) and reads as a sibling, not a stranger.
- **Honest classification beat a binary verdict.** The 7 zero-site agents are not one bucket: 4 description-dispatched (KEEP), 2 script-twins (`pipeline-reconciler`/`quality-drift-watcher`, whose work runs as `tools/release-history/*.mjs`), and 1 genuine orphan (`gsd-intel-updater`, parked with a dated gate). The allowlist carries the *why* for each, so the report never reads "all clear" by hiding a real orphan.

## What went well in process

- **CI on dev caught a security-chokepoint regression before main.** The new CLI wrapper imports `child_process`, which trips `src/security/process-context-audit.test.ts` — every `child_process` caller must route through `ensureProcessAllowed()`. The fix threads the chokepoint exactly as `keystore.ts`/`terminal.ts` do (ctx is undefined at the dispatch boundary today, a structural no-op). Amended before the commit reached main.
- **The drift-guard is gate-enforced for free and mutation-meaningful.** Named `*.test.ts` (root vitest project), it runs every ship with no new shell step / denominator (#10461). Its core invariant — every `dormant` agent in the committed baseline is allowlisted — means a future agent that goes dormant fails the build until it is triaged. The baseline↔source agent-set check forces a baseline refresh when agents are added or removed.
- **Adversarial review came back clean (0 confirmed)** on a 9-file diff; the lone refuted finding (the forward-dated v975 reference) was correctly identified as standard pre-ship practice.

## What to watch

- **`gsd-intel-updater`'s dated gate (2027-06-04)** is the forcing function so its allowlist exemption does not become permanent shelfware like the src/ `upstream` entry. If still unwired by then, relocate to `examples/agents/deprecated/`.
- **The live full-fleet scan needs the gitignored `.claude/` tree, so it runs locally** (observability), exactly like the src/ adoption-refresh. CI pins the committed artifacts (allowlist + baseline + verdicts) and the scan *logic* on synthetic fixtures — not a live re-scan. If a maintainer adds an agent without refreshing the baseline, the parity test fails.
- **Description-dispatch is invisible to a static scan.** The allowlist is the seam between "no scripted site" and "not dormant." If Claude Code ever exposes description-dispatch telemetry, the four description-dispatched entries could become living-by-evidence and drop off the allowlist.
