---
title: "v1.49.1030 — Rust ACL Reconciliation: 98-Command Manifest, Service Unification, Drift-Guard"
version: v1.49.1030
date: 2026-06-10
summary: >
  Closes the audit 2026-06-09 §3.3 defect (§10 ship 4): build.rs AppManifest
  listed only 23 of 116 commands registered in lib.rs, leaving 93 ACL-orphaned
  and runtime-unreachable — including everything the desktop actively invokes
  (keystore, MCP, intelligence, atlas, arena, chat). Evidence-fleet triage
  deleted 18 dead commands, permitted the remaining 98 end-to-end, unified the
  service surface onto the real ServiceLauncher implementations (LL-BOOT-007
  debt paid), fixed 5 latent camelCase wire-key defects in the desktop
  wrappers, and pinned a 3-way drift-guard so the lists cannot diverge again.
tags: [tauri, acl, security, rust, desktop, drift-guard]
---

# v1.49.1030 — Rust ACL Reconciliation: 98-Command Manifest, Service Unification, Drift-Guard

**Shipped:** 2026-06-10

One-line: every Tauri command the app registers is now manifested, permitted,
and wire-key-correct — 23/116 ACL coverage became 98/98 with 18 dead commands
deleted and a three-way reconciliation test standing guard.

## Why this ship

The 2026-06-09 audit's Rust/Tauri deep dive (§3.3) found one real defect:
`src-tauri/build.rs` passed only 23 commands to `tauri_build::AppManifest`
while `lib.rs` registered 116 via `generate_handler!`. The other 93 were
ACL-orphaned — runtime `invoke()` fails "not allowed by ACL" — and the broken
set included commands the desktop and src/ actively call (keystore_*, mcp_*,
intelligence_* ×18, atlas_* ×14, arena_*/arena_set_* ×16, send_chat_message).
Nothing reconciled the lists, so they drifted for ~140 milestones. §10 ship 4
prescribed permit-or-delete triage plus a superset reconciliation test.

## What shipped

- **Permit-or-delete triage of all 93 orphans** (5-family evidence fleet,
  per-command file:line + git provenance): 18 DELETE / 75 PERMIT.
- **Deleted (18):** the Phase 381 staging trio (panel never built,
  caller-less since birth); the Phase 368/369 sandbox + proxy prototype
  surfaces (superseded same-milestone by the Phase 374 security barrel; the
  proxy handlers were canned stubs); legacy has_api_key/store_api_key
  (store_api_key only set a process env var — superseded by the v1.49.636
  unified keystore); the cgroup IPC trio (would let the webview clamp the
  real process cgroup to 8 GiB with the enforcer never attached to ArenaSet;
  M15 routes enforcement through ArenaSet::alloc); and the 3 no-op Phase 380
  service stubs. Library code kept in every case.
- **Service surface unified (LL-BOOT-007 / v1.39 Tech Debt Register, never
  paid):** desktop invoked the no-op stubs while the real Phase 380-01
  ServiceLauncher implementations sat uncalled behind a `svc_` prefix. The
  real fns were renamed over the stub names; params renamed `id` →
  `service_id` (camelCase wire key `serviceId`); response contracts fixed to
  what the desktop reads (`{ok: true}`; `{service_id, status, led_color}`
  with serde-safe status flattening — `Failed(String)` externally tags).
  `stop_service` stays an honest stub (no per-service stop exists; recorded
  residue).
- **build.rs AppManifest 23 → 98** (every registered command, grouped by
  family) and **capabilities/default.json 23 → 98 allow entries** on the
  main window. restricted.json (ACL-denial test capability) unchanged.
- **5 desktop wire-key fixes** (Tauri v2 expects camelCase keys; pinned
  empirically by the working pty caller): `{service_id}` → `{serviceId}` ×3,
  `conversation_id` → `conversationId` ×2 — get_conversation_history was a
  HARD_FAIL ("missing required key"), send_chat_message silently minted a
  fresh conversation per call. Plus bootstrap-flow service id `claude` →
  `claude_code` (the Rust parser knows only `claude_code`).
- **Drift-guard:** `src/security/acl-reconciliation-audit.test.ts` pins
  lib.rs == build.rs == default-capability (3-way, kebab-case mapping,
  duplicate + parse-plausibility checks). Runs in the default vitest project
  → gate step 1 + every CI leg.

## Verification

- cargo test exit 0 (full crate suite); cargo build-script run regenerates
  `gen/schemas/acl-manifests.json` with 98 allow / 98 deny and resolves the
  capability file.
- Full vitest: 35,912 passed after the final commit — the full-suite run
  caught the root-level bootstrap-flow integration fixtures still using the
  old `claude` id (2 failures, fixed in `b139cda5b`), which the targeted
  desktop runs could not see.
- Desktop suite 1089/1089; new drift-guard 6/6.
- Step P adversarial ship-review v2 run on the full diff before push;
  results in chapter/99-context.md; attestation written (gate step 22).

## Engine state

NASA degree 1.217 (unchanged — no content ship), counter-cadence 29,
manifest 152, thresholds 8, cadence_advances [consume, verify]. Package
1.49.1030.
