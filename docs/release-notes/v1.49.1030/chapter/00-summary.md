# v1.49.1030 — Summary

## The ship

Rust/Tauri capability-ACL reconciliation (audit 2026-06-09 §3.3 / §10 ship
4). build.rs manifested 23 of 116 registered commands; the other 93 were
ACL-orphaned and runtime-unreachable, including the keystore, MCP,
intelligence, atlas, arena, and chat surfaces the desktop actively invokes.
Two evidence agent-fleets triaged every orphan (permit-or-delete) and audited
every to-be-permitted call site for Tauri v2 camelCase wire-key correctness —
a permit is only meaningful if the call deserializes.

## What shipped

- 18 dead commands DELETEd with provenance (staging trio; sandbox/proxy
  prototype surfaces superseded by the Phase 374 security barrel; legacy
  api-key pair superseded by the unified keystore; webview-reachable cgroup
  mutation trio; 3 no-op service stubs). Library code kept in every case.
- Service surface unified onto the real Phase 380-01 ServiceLauncher
  implementations (LL-BOOT-007 debt paid): svc_* renamed over the deleted
  stub names, wire keys and response shapes fixed to the desktop contract.
- build.rs AppManifest 23 → 98; capabilities/default.json permits all 98 on
  the main window.
- 5 desktop snake_case → camelCase invoke-key fixes (one HARD_FAIL, one
  silent conversation-threading loss) + bootstrap-flow `claude` →
  `claude_code` service id.
- New 3-way drift-guard: lib.rs == build.rs == default capability
  (src/security/acl-reconciliation-audit.test.ts, default vitest project →
  gate step 1 + all CI legs).

## Verification

cargo test exit 0; build-script regenerates acl-manifests at 98 allow/98
deny and resolves the capability; full vitest 35,912 passed (the full-suite
run caught 2 stale bootstrap-flow integration fixtures — fixed in-ship);
desktop suite 1089/1089; drift-guard 6/6; step P adversarial review v2 +
attestation; pre-tag-gate 22/22.

## Engine state

NASA degree 1.217 (unchanged), counter-cadence 29, manifest 152, thresholds
8, cadence_advances [consume, verify]. Package 1.49.1030.
