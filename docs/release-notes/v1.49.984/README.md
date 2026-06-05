---
title: "v1.49.984 — skill-mining config migrator (integration migrate)"
version: v1.49.984
date: 2026-06-05
summary: >
  Adds `skill-creator integration migrate` — an operator-invoked, dry-run-by-default
  config migrator that deletes an explicit `observation.mine_active_skills: false`
  from a pre-5.1c install so it re-inherits the 5.1c default (true). Closes the
  v980/5.1c follow-on for explicit-false 5.1b installs that the default flip missed.
tags: [phase-5, cli, integration-config, migration]
---

# v1.49.984 — skill-mining config migrator (integration migrate)

**Shipped:** 2026-06-05

A new `integration migrate` subcommand self-heals pre-5.1c configs that explicitly pinned `mine_active_skills: false`, so skill-mining turns on for them too.

## Why this ship

Ship 5.1c (v1.49.981) flipped `observation.mine_active_skills` default false→true. Configs where the key is **absent** auto-inherit the new default — but installs that wrote an **explicit `false`** (5.1b-era, when the field shipped dark-behind-flag default-false) stay false and never get the new behavior. This was the operator's item-4 follow-on from the v982 deferred list; sequenced after Ship 5.3, with the operator choosing the **delete-key** resolution (remove the key rather than flip it to `true`, so the config self-heals on any future default change and matches a fresh install).

## What shipped

- **`skill-creator integration migrate`** — a new subcommand on the existing `integration` command. Detects an **explicit** `observation.mine_active_skills: false` (key present AND `=== false`; absent or `true` → no-op) and **deletes the key**.
- **Dry-run by default.** Reports the action and exits 0 without writing; `--apply` performs the write after backing the original up to `<path>.bak.<timestamp>`.
- **Allowlist guard.** The only mutation permitted is removing `observation.mine_active_skills`; a structural deep-equal check aborts the write if anything else would change (protects sibling keys like `observation.retention_days` — the Ship 5.2 discipline). Idempotent.
- **Operator-invoked only.** NOT wired into `install.cjs` auto-run — preserving the installer's "never touch an existing user config" contract.

## Verification

- `npm run build` clean; full `npx vitest run` green (**35,785+ tests**, 0 failures).
- 27 `integration-config` unit tests (mocked fs) + a real unmocked end-to-end smoke test (dry-run → no change; `--apply` → key removed, siblings preserved, `.bak` created; re-run → idempotent no-op).
- Adversarial 3-lens review (scaled to blast radius): **0 real BLOCKER/MAJOR**. Three MINORs fixed/triaged: dropped an over-strict whole-config re-validate that blocked migrating configs with *unrelated* drift (the cleanup's whole purpose); added `migrate` to the top-level CLI help; deferred the pre-existing docs/CLI.md `integration` gap.

## Engine state

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — all unchanged (forward Phase-5 follow-on; no lesson promoted). No `cadence_advances`.
