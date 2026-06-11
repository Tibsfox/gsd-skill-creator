# v1.49.1032 — Summary

## The ship

Strategic-tail ship pairing the deadline item with the headline carry: the
GitHub Actions Node-24 bump (checkout/setup-node v4→v5, forced 2026-06-16)
landed and verified first, then the audit 2026-06-09 §3.3 re-carry closed —
a Rust analogue of the TypeScript Tier-E ProcessContext chokepoint, with
every child-process spawn site in `src-tauri` (28 sites / 13 files,
including the portable-pty surface) gated 1:1 in the introducing ship. The
Rust surface starts at the end-state the TS `KNOWN_UNWIRED` list took ~70
ships to chip down to: there is no grandfather list.

## What shipped

- `src-tauri/src/security/process_context.rs` — allow-list + audit-sink
  chokepoint, pure `evaluate()` core, `ensure_process_allowed()` over a
  one-shot `OnceLock` policy; uninstalled = legacy permissive (the TS
  optional-`ctx` rollout semantics); thiserror `ProcessContextDenied`;
  7 cargo unit tests.
- 28 spawn sites wired with hoisted gates: Result-channel sites propagate
  denial, detector-shaped sites fail closed with the audit record carrying
  the denial (documented Rust variant of #10427).
- `src/security/process-context-rust-audit.test.ts` — Rust-source
  drift-guard in the default vitest project: pinned 13-file roster with
  exact spawn counts, gate ≥ spawn per file, stale-entry inverse check,
  string-aware comment stripping.
- `docs/security-chokepoints.md` Rust-analogue section (fourth sibling row +
  three forced divergences).
- ci.yml + skill-review.yml: all 9 action pins to v5 majors; deprecation
  annotations gone, all legs green.

## Verification

Evidence fleet (5 read-only agents) before any edit; cargo 854/0; desktop
1089/1089; full vitest 36,070 passed (1 known-class graph-perf flake green
in isolation); step P adversarial review 0 fix-now / 1 confirmed MINOR fixed
in code + self-tested pre-push; attestation mode full; pre-tag-gate 22/22;
both CI cycles green.

## Engine state

NASA degree 1.217 (unchanged — core ship); counter-cadence 29; manifest
lessons 152; thresholds 8. Predecessor v1.49.1031 (`761b95b4f`).
