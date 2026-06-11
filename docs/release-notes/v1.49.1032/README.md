---
title: "v1.49.1032 — Rust Process-Context Chokepoint: 28-Site Spawn Gate, Drift-Guard, Node-24 Actions Bump"
version: v1.49.1032
date: 2026-06-10
summary: >
  Strategic-tail ship: the audit 2026-06-09 §3.3 re-carry closes with a Rust
  analogue of the TypeScript Tier-E ProcessContext chokepoint — a new
  src-tauri security/process_context.rs module (allow-list + audit sink +
  one-shot process-wide policy, permissive until installed), all 28
  child-process spawn sites in src-tauri wired 1:1 with gates hoisted before
  the spawn, 7 cargo unit tests, and a vitest Rust-source drift-guard pinning
  the 13-file spawner roster. Rides along: the GitHub Actions Node-24
  deadline item (checkout/setup-node v4→v5, forced 2026-06-16) verified by
  the deprecation annotations disappearing.
tags: [tauri, security, process-context, drift-guard, ci]
---

# v1.49.1032 — Rust Process-Context Chokepoint: 28-Site Spawn Gate, Drift-Guard, Node-24 Actions Bump

**Shipped:** 2026-06-10

One-line: the last unguarded process-spawn surface in the repo — the Tauri
backend — gets the fourth sibling of the Tier-E chokepoint family, wired to
end-state in one ship with no grandfather list.

## Why this ship

AUDIT-2026-06-09 §3.3 re-carried "no Rust analogue of the
ProcessContext/LoaderContext chokepoints (44 ungated `Command::new` sites
across 15 modules)" and v1030 (Rust ACL) deliberately did not fold it in.
With the §10 queue complete at v1031, the operator selected the strategic
tail; within it, the GitHub Node-24 forcing (2026-06-16, six days out) set
the opening move and the chokepoint was the headline. Count reconciliation
during scoping: v1030's deletion of the dead staging/sandbox/proxy command
modules had already shrunk the audit's 44/15 to 32 grep hits, of which 5 are
comment-only (the `intelligence/atlas.rs` + `intelligence/server.rs`
zero-spawn invariants documenting themselves) — true scope was 27
`Command::new` sites across 12 files, plus the portable-pty `spawn_command`
surface in `commands/pty.rs` the evidence fleet surfaced: **28 sites / 13
files**.

## What shipped

- **`src-tauri/src/security/process_context.rs`** (commit `a10d765a2`) —
  mirror of `src/security/process-context.ts` semantics: `CommandPattern`
  allow-list (Exact/Prefix/Any) matched against the executable, pluggable
  `ProcessAuditSink` emitting one record per gated attempt, thiserror
  `ProcessContextDenied`, pure `evaluate()` core + `ensure_process_allowed()`
  wrapper over a one-shot `OnceLock` policy. **No policy installed = legacy
  permissive**, the Rust analogue of the TS optional-`ctx` rollout mode.
  7 unit tests in `security/tests/process_context_tests.rs`.
- **All 28 spawn sites wired 1:1** (commit `edcefb19c`) — gates hoisted
  before each spawn across claude/session+monitor, tmux/session+detector,
  security/sandbox+agent_isolation, services/shutdown, mcp_host/connection
  (dynamic stdio command), lib.rs setup autodetect, intelligence/
  atlas_sidecar, commands/{security,dashboard,pty}. Result-channel sites
  propagate denial; detector-shaped sites fail closed with the audit record
  carrying the denial (the documented Rust variant of #10427). argv is built
  once where needed so the gate audits exactly what spawns.
- **Drift-guard** `src/security/process-context-rust-audit.test.ts` (commit
  `032a6e605`) — default vitest project (pre-tag-gate + every CI leg; the
  cargo lane is CI-only): pinned 13-file `SPAWNER_ROSTER` with exact per-file
  spawn counts, gate-count ≥ spawn-count, stale-entry inverse check,
  role-boundary escape, string-aware comment stripping (step P finding,
  fixed + self-tested), and explicit zero-spawn pins for atlas.rs/server.rs.
- **docs/security-chokepoints.md** — Rust-analogue section: fourth sibling
  table row + the three forced divergences (OnceLock vs threaded `ctx?`,
  detector fail-closed, roster-starts-at-end-state).
- **ci: checkout + setup-node v4→v5** (commit `377f48a01`, pushed first) —
  all 9 pins across ci.yml + skill-review.yml; verified by the Node-20
  deprecation annotations disappearing on the post-bump run while all legs
  stayed green. `tesslio/skill-review@main` is third-party (not bumped);
  the windows-2025-vs2026 redirect is server-side automatic.

## Verification

- Evidence fleet wf_a2b89e44 (5 read-only Explore agents, ~313K tokens)
  BEFORE any edit: per-site classification of all spawn sites (error
  channels, argv sources, swallow risks), module/test conventions, exact CI
  bump plan, gate/T14 rider confirmation. It also corrected the roster
  (comment-only hits) and found the portable-pty surface; one fleet claim
  (bump-version syncs Cargo.lock) was refuted by direct read and the manual
  sync rider retained.
- cargo suite 854 passed / 0 failed (`--no-default-features`, was 847 + 7
  new); desktop 1089/1089; full vitest 36,070 passed with 1 graph-perf
  timing flake (633ms vs 500ms under vitest+cargo concurrent load) confirmed
  green in isolation 10/10 — the known flake class, file untouched by this
  ship.
- Step P (adversarial-ship-review v2, wf_c85fcd98, 5 dimensions): 0 fix-now,
  1 confirmed MINOR — the drift-guard's comment stripper truncated lines at
  `//` inside string literals (latent undercount). Fixed in code with a
  string-aware scanner + 4-case self-test; the judge's suggested regex fix
  was itself rejected as Rust-incorrect (a `'[^']*'` char-literal pattern
  breaks on lifetimes). Attestation `--mode full`, reviewedHead `032a6e605`,
  confirmed 1.
- Pre-tag-gate 22/22; CI green on all legs both cycles.

## Engine state

NASA degree **1.217** (unchanged — core ship, no degree advance);
counter-cadence count **29** (manifest), cadence unchanged; manifest lesson
count **152**; thresholds **8**. Predecessor v1.49.1031 (`761b95b4f`).
