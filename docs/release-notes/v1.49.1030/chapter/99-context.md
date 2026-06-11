---
title: "Context"
chapter: 99-context
version: v1.49.1030
date: 2026-06-10
summary: "Where v1.49.1030 sits in the larger arc."
tags: [context, tauri, acl]
---

# v1.49.1030 — Context

## Milestone metadata

- **Version:** v1.49.1030
- **Type:** `feat(tauri)` — Rust ACL Reconciliation: 98-Command Manifest, Service Unification, Drift-Guard
- **Predecessor:** v1.49.1029 (WARN→BLOCK promotions, 22-step gate, ship-review v2, readiness reporter) at `95d416fde`
- **NASA degree:** 1.217 (unchanged — no content ship)
- **Counter-cadence count:** 29 (unchanged)

## Where this sits

Audit-2026-06-09 execution arc, ship 4 of 5: v1.49.1027 (loop-outcome, first
applied threshold move) → v1.49.1028 (deploy-layer fix + install parity) →
v1.49.1029 (QA promotions + ship-review v2) → **this ship (Rust ACL
reconciliation)** → ship 5 next (tools/workflows/ library + NASA
authoring-discipline doc refresh). This is the first ship to discharge an
audit finding in the Rust/Tauri layer (§3.3 — the audit's first independent
Rust deep dive), and the first to run under the fully-promoted 22-step gate
end-to-end, including the now-REQUIRED step P attestation as a born-BLOCK
prerequisite. The separately re-carried Rust item (no ProcessContext
analogue for the 44 ungated Command::new sites) remains open and was
deliberately NOT folded in — §10 ship 4 scope is ACL only.

## Files changed

Rust: `src-tauri/build.rs` (23→98 manifest), `src-tauri/src/lib.rs`
(registrations −18, service block renamed), `src-tauri/src/commands/mod.rs`,
`src-tauri/src/commands/services.rs` (unified surface),
`src-tauri/src/commands/ipc.rs` (api-key pair + 3 stubs deleted, stop_service
honest comment), `src-tauri/src/commands/memory_arena.rs` (cgroup IPC section
removed), deleted `src-tauri/src/commands/{staging,sandbox,proxy}.rs`,
`src-tauri/src/security/tests/proxy_server_tests.rs` (compile-existence test
removed), `src-tauri/capabilities/default.json` (98 allow),
`src-tauri/Cargo.lock` (stale version sync rider).
Desktop: `desktop/src/ipc/commands.ts` (5 wire-key fixes),
`desktop/src/pipeline/bootstrap-flow.ts` (claude_code id + keystore TODO).
Tests: `src/security/acl-reconciliation-audit.test.ts` (new drift-guard),
`tests/integration/bootstrap-flow.test.ts` (fixtures aligned).
Docs: `docs/release-notes/v1.49.1030/` (this set),
`.planning/SHIP-v1.49.1030-DESIGN.md` (untracked working doc).

## Step P review results

Adversarial ship-review v2 run on the full diff from base `95d416fde`
(workflow `wf_59981aa8-3f7`, 9 agents, 5 lenses: correctness, scope,
guard-soundness, doc-accuracy, security). **Clean review:** 4 findings
raised, all 4 REFUTED at the adversarial-verification stage, 0 confirmed,
judge skipped per the clean-review fast path. All four refutations were
reviewer counting errors — three used a digit-less `"[a-z_]+"` regex that
missed `keystore_migrate_v1_to_v2` (yielding 97/115 instead of 98/116), and
the fourth conflated per-commit deletion counts with the ship's net-18
arithmetic (15 + 7 − 4 = 18). The refutation stage doing its job on
plausible-but-wrong number claims is itself evidence the v1029 panel design
works. Attestation: `write-attestation.mjs --mode full --base 95d416fde
--confirmed 0`, reviewedHead `b139cda5b` (gate step 22 verified).

## Suite evidence

- cargo test exit 0 (full crate suite, build-script revalidated the
  98-command manifest + capability resolution).
- Full vitest 35,912 passed / 0 failed after `b139cda5b` (2 bootstrap-flow
  integration fixtures caught by the first full-suite run, fixed in-ship);
  desktop project 1089/1089; new drift-guard 6/6.

## Engine state at close

NASA degree 1.217, counter-cadence 29, manifest 152, thresholds 8,
cadence_advances [consume, verify]. Package 1.49.1030.
