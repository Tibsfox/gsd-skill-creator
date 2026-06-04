# v1.49.972 — Retrospective

## What went right

- **The 8-module roster was derived, not assumed.** Recon ran `adoption-scan` and traced the real import graph: of the 11 MA/MB/MD-family modules, exactly 3 are production-reachable (`stochastic` ← orchestration/branches, `embeddings` ← 12 callers, `representation-audit` ← CLI dispatch) and the other 8 are reachable only within the island (or `ace`'s default-off orchestration edge). That produced the precise 8 the settled D3 named, and surfaced that `lyapunov`/`projection` read `living` only via intra-island imports — the reachability-v2 case the allowlist `reason` now records.
- **Park, not wire, not retire — for the right reasons.** The settled D3 had already refuted the audit's "wire ace → selector" (ace is the SINK). Parking exempts the island from the shelfware threshold without deleting latent tested capability, and the dated 2027-06-04 review gate keeps it from calcifying the way `upstream`/`upstream-intelligence` did (allowlisted v787, still pending). persistent-shelfware dropped 44 → 39 as the 8 left the watch.
- **The retire was bigger than the audit's framing — caught by reading the code.** The audit called `intrinsic-telemetry` a "single dormant importer." In fact it is a registered Half-B module of `heuristics-free-skill-space` (string-keyed in the config union + module registry, so the import-graph scanner reported zero internal importers). Retiring it meant un-registering from `settings.ts` + `index.ts` + the integration test, not a bare `rm -rf`. Reading the real wiring before deleting avoided a broken build.

## What went well in process

- **The adversarial review came back clean (0 findings)** on a delete-heavy diff — the proactive cleanup of all 3 dangling prose references (a dangling ref to a deleted module is exactly what the doc-accuracy lens flagged on the D2 ship) meant there was nothing left to find.
- **CI caught the one thing the local targeted tests didn't.** The handoff order (push → CI → pre-tag-gate) surfaced an `INVENTORY-MANIFEST.json` drift failure on both ubuntu and macos — deterministic, because deleting a `src/` subsystem changes the committed inventory. Fixed by regenerating the manifest, folding it into the commit (amend + force-with-lease on the working branch, before any main FF), and re-running. main never saw the broken state.

## What to watch

- **`lyapunov`/`projection` will keep reading `living`** under the current import-surface scanner until the reachability-aware scanner v2 (audit Ship 3.1) lands; the allowlist `reason` documents this so the "living" status is not mistaken for production reachability.
- **The dated review gate (2027-06-04)** must actually be honored — if no learning-loop runtime consumes the substrate by then, decide retire-vs-extend rather than letting the 8 entries become permanent.
- **`upstream` / `upstream-intelligence`** remain the genuine open shelfware triage (allowlisted v787, ~180 ships) — out of scope for D3, still pending a RETIRE-vs-rename-merge decision.
- **Run the manifest-drift / full pre-tag-gate locally before pushing** when a ship deletes a `src/` subsystem — the targeted suite won't catch the inventory drift.
