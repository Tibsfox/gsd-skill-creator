---
title: "v1.49.979 — sc-learn + scan-arxiv CLI dispatch wire"
version: v1.49.979
date: 2026-06-05
summary: >
  Ship 3.3 closes the WIRE cluster Ship 3.2 deferred: the authored-but-unwired
  sc-learn + scan-arxiv CLI surface is registered into the npm-bin dispatch
  registry, flipping the `commands`, `learn`, and `scan-arxiv` modules from
  living-but-unreachable to reachable from production. scan-arxiv ships with a
  cost-safe default and an arxiv-scoped egress guard.
tags: [phase-3, adoption, shelfware, wire, reachability, cli]
---

# v1.49.979 — sc-learn + scan-arxiv CLI dispatch wire

**Shipped:** 2026-06-05

The three reachability-only modules Ship 3.2 allowlisted as a named WIRE follow-up are now wired: `skill-creator learn` and `skill-creator arxiv` join the CLI, and the `commands → learn → scan-arxiv` chain reads reachable from production.

## Why this ship

Ship 3.2 (v1.49.978) disposed 16 reachability-only shelfware modules but explicitly deferred one cluster: `commands` + `scan-arxiv` were allowlisted (and `learn` with them) because their authored CLI surface — `scLearn()` and `scan-arxiv`'s `main()` — was never registered in `src/cli/dispatch.ts`. Ship 3.3 closes that follow-up by registering the surface, the lightest-wire CLI-subcommand pattern proven across the v789–793 cluster and Ship 3.2's git/skill wires. An 8-agent recon + adversarial-verify workflow traced the reachability closure and corrected a crux: the chain is **directional** (`scan-arxiv.ts → bridge.ts → sc-learn.ts → learn/*`), so registering scan-arxiv over-determines all three module flips. Two operator decisions (AskUserQuestion) set the scope (wire scan-arxiv + author `learn`) and scan-arxiv's safety posture (cost-safe default + egress guard).

## What shipped

- **WIRE `learn`** — `src/commands/sc-learn.ts` gains a `main(argv)` arg-parser + `isCliEntrypoint` guard (positional `<source>` + `--domain`/`--depth`/`--scope`/`--dry-run`/`--yes`), registered as `skill-creator learn`. `scLearn()` stays a pure library orchestrator. `--yes` injects an auto-approve-with-warnings prompt; without it the human-in-the-loop gate stays interactive and never auto-approves STRANGER-trust content (the Three Laws hold). The new entrypoint also repairs a previously-dead `bridge.ts` ingestion line that had invoked the file as a no-op.
- **WIRE `scan-arxiv`** — new `src/cli/commands/arxiv.ts` safe-default router over `commands/scan-arxiv.ts` `main()`, registered as `skill-creator arxiv`/`scan-arxiv`. No-flag invocation forces `--judge-backend embedding-only` (local Xenova rank — no LLM billing, no `claude -p` subprocess); `--rank` opts into the cost-bearing `auto` backend; an explicit `--judge-backend` always wins.
- **EGRESS-GUARD** — an arxiv-host-scoped `EgressContext` is threaded through `src/scan-arxiv/fetcher.ts` (`ensureEgressAllowed` hoisted before the network fetch in `fetchPage`), built in `scan-arxiv.ts` `main()` and passed to `createFetcher` — matching the install-remote chokepoint standard.
- **Disposition bookkeeping** — `commands`/`learn`/`scan-arxiv` removed from `tools/adoption-scan.allowlist.json` (32 → 29); `docs/SHELFWARE-VERDICTS.md` moves 3 rows ALLOWLISTED → WIRED with a Ship 3.3 CLOSED note; a `SHIP33_WIRED` drift-guard block in the existing `tests/integration/learning-substrate-parked.test.ts` pins reachable + de-allowlisted.
- **Tests** — `src/cli/commands/arxiv.test.ts` (safe-default contract: embedding-only default / `--rank`→auto / explicit-backend-respected) + `src/commands/sc-learn-cli.test.ts` (CLI arg contract: help / missing-source / bad-depth / unknown-flag exit codes).

## Verification

- `npm run build` (tsc) clean; 9 affected suites **2,124 pass**; `test:integration` **217 pass**; `render:claude-md:check` up-to-date.
- Pre-tag-gate **all 20 PASS** (the drift-guard lands in an existing suite, so the denominator stays 20).
- CLI smoke: `learn --help`, `arxiv --help`, and top-level help all resolve.
- Live `adoption-scan`: `commands`/`learn`/`scan-arxiv` now `reachableFromProduction:true`, `allowlisted:false`; the non-allowlisted living-but-unreachable set stays `[]`.
- origin/dev CI **green** (sha-matched `fd213bd36`).
- Step-P adversarial review (5 dimensions — correctness/scope/guard-soundness/doc-accuracy/security): **0 confirmed findings**.

## Engine state

NASA degree **1.178** (frozen) · counter-cadence **29** · manifest lessons **152** — all unchanged (forward audit-plan ship, no new lesson promoted). No `cadence_advances`.
