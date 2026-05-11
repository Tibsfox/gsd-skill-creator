# 00 — Summary: v1.49.634 Concerns Cleanup #2

**Released:** 2026-05-11
**Type:** counter-cadence operational-debt milestone (NOT a NASA degree)
**Closes:** four CONCERNS.md categories (§11 stale-state, §14 coprocessor watchdog, §15 Tauri-boundary, §18 keystore plaintext) + four v1.49.585 §4 deferred-batch items
**Opens:** pre-tag-gate step 9 (Tauri-boundary BLOCKER); `insecure-plaintext-keystore` release-profile Cargo feature; reachability-audit-as-artifact pattern
**Engine forward-state:** UNCHANGED — NASA 1.108 / MUS 1.108 / ELC 1.108 / SPS #105 / TRS pack-30 (v1.49.633 close)

## Structural firsts

- **Second counter-cadence cleanup milestone in engine history.** First was v1.49.585 (registered Lesson #10168). The cadence target was ~30 forward-cadence milestones; the trigger fired at v1.49.615 and the milestone shipped at v1.49.634 — 19 milestones late. The lateness motivates Lesson #10168-followup: gate the cadence itself with a deterministic check that scans STATE.md / HANDOFF history and surfaces overdue cleanup triggers.
- **First production cfg gate landed via release-profile Cargo feature flag.** `insecure-plaintext-keystore` defaults OFF in release builds; the plaintext-credential-file fallback in `src-tauri/src/security/keystore.rs` is now gated out of shipped binaries. Debug builds retain the fallback for local-development convenience. This is also the first formal *reachability audit* artifact in `.planning/missions/`; the template at C0 shared-types makes it reusable for future security-critical TODO resolutions.
- **First two-phase gate landing.** C1 watchdog landed observer-first (default `observe-only` policy, surfaces status without spawning/restarting) with `auto-restart` available as an opt-in setting. This de-risks runtime-touching gates by letting the observability layer soak before authority is granted. Recommended as a template for future runtime gates.
- **First upstream-alignment spot-check after a content-touching upstream release.** v1.41.2 release notes flagged `record-metric` / `add-decision` / `add-blocker` data-loss fixes; the spot-check confirmed these are SDK-binary changes (PR #3291), not slash-command markdown drift. The 66 markdown commands match upstream by name and content (61/66 IDENTICAL after install-time path-strip; 4 cosmetic `~` vs `$HOME` deltas + 1 cosmetic argument-hint addition + 1 BEHAVIORAL `gsd-review` → `gsd-quality` rename deferred for upstream propagation).
- **First milestone where the system meta-tests itself against the NEW gate at ship time.** The W3 stage-1 integration meta-test creates a synthetic `import { invoke } from '@tauri-apps/api'` violation in `src/__synthetic_v634__/violation.ts`, runs the tauri-boundary audit in a subprocess, asserts non-zero exit + the synthetic file appears in the violation list, then tears down. The same pattern in the same test file fires the self-mod-guard hook on adjacent + non-adjacent inputs and verifies BLOCK vs ALLOW.

## Engine state at close

| Metric | Value at v1.49.634 close |
|---|---|
| NASA degree | 1.108 (UNCHANGED — STS-6 Challenger; no forward-cadence content this milestone) |
| MUS degree | 1.108 (UNCHANGED — Bowie *Let's Dance*) |
| ELC degree | 1.108 (UNCHANGED — Harold Washington Chicago mayor) |
| SPS species count | #105 (UNCHANGED — Pileated Woodpecker) |
| TRS M1 W2 pack | pack-30 information theory K_30 = 392 edges (UNCHANGED) |
| Operational-gate layer | 6 gates (was 5 at v1.49.585; tauri-boundary added at step 9) |
| Carryforward V-flags | 9 deferred (UNCHANGED — citation-debt ledger persists at `.planning/citation-debt.json`) |

| Operational-debt category | Items closed | Gate installed |
|---|---|---|
| Math coprocessor MCP server lifecycle (§14) | 1 (no-watchdog → deterministic dead-server detection) | `src/coprocessor/watchdog.ts` + module-level `getCoprocessorStatus()` / `setSupervisorPolicy()` |
| Tauri v2 boundary leakage risk (§15) | 1 (prose-rule → pre-tag-gate step 9) | `tools/tauri-boundary-audit.mjs --check`; exit 10 standalone / exit 9 in composite; override `SC_SKIP_TAURI_BOUNDARY_GATE=1` |
| Keystore plaintext fallback (§18) | 1 (always-compiled → release-build-gated) | `insecure-plaintext-keystore` Cargo feature in `src-tauri/Cargo.toml`; debug-only in default profile |
| Stale-state in REQUIREMENTS.md + `tests/integration/` index (§11) | 1 (DASH-* entries reconciled; legacy graduation status documented) | 2 truth tests in `tests/legacy/` proving REQUIREMENTS DASH-* mapping invariant |
| v1.49.585 §4 deferred-batch | 4 (self-mod-guard proximity-regression test, score-completeness `--cleanup` rubric, MEMORY.md PG-creds path, `.gitignore` entries) | 4 vitest tests pinning the new invariants |

## Threads closed / opened / extended

- **OPENED:** deterministic Tauri-boundary gate at pre-tag-gate step 9 (exit code 9; override `SC_SKIP_TAURI_BOUNDARY_GATE=1`); allowlist at `tools/tauri-boundary-audit.allowlist.json` for the architectural-exemption runtime-only Tauri IPC bridge.
- **OPENED:** coprocessor liveness observability surface (`CoprocessorWatchdog` class + singleton helpers; `WatchdogStatus` discriminated union with `alive | degraded | dead | unknown` states; deterministic dead-after-N-missed-probes transition).
- **OPENED:** release-profile Cargo feature gate pattern (`insecure-plaintext-keystore`); reachability-audit artifact template usable for future security-critical TODO resolutions.
- **OPENED:** follow-on mission stubs `v1-49-6XX-keystore-encryption-stub.md` (encryption-rotation + key-derivation) and `v1-49-6XX-cartridge-finalization-stub.md` (48 LEGACY chipset.yaml → cartridge.yaml migration). Both placeholder `v1-49-6XX` versions pending operator-pin.
- **EXTENDED:** operational-gate layer (5 → 6 gates); CLAUDE.md "Environment Variables" + "Operational Gates" tables.
- **CARRY-FORWARD:** all v1.49.633 thread states UNCHANGED.

## Component delivery summary

| Phase | Components | Status |
|---|---|---|
| W0 — Shared types | watchdog enum, tauri-boundary violation record, keystore reachability template, CONCERNS status format, v585 §4 batch tracking | 1/1 G0-locked |
| W1A — Runtime gates | C1 watchdog + C2 tauri-boundary audit + pre-tag-gate step 9 wiring | 2/2 PASS (W1A-GGATE.md) |
| W1B — Security + closures | C3 keystore reachability + Stage 2B release-feature gate + C4 v585 §4 deferred-batch | 2/2 PASS (W1B-GGATE.md) |
| W1C — Stale-state + cartridge audit | C5 REQUIREMENTS DASH sweep + C6 cartridge-forge audit (48 LEGACY found → follow-on) | 2/2 PASS (audit-only on C6) |
| W2 — Upstream alignment | C7 spot-check 66/66 commands; 61 IDENTICAL + 4 cosmetic-path + 1 cosmetic-hint + 1 BEHAVIORAL-deferred | 1/1 PASS |
| W3 stage 1 — Integration meta-test + 5-file release-notes + CONCERNS status appends | C8 stage 1 (this file's parent) | IN PROGRESS at chapter-author time |
| W3 stage 2 (T12) — G3 ship pipeline | bump-version + tag + gh-release + ship-sync + RH refresh | OPERATOR-GATED |

**Total: 8 components landed across W0-W2 + W3 stage 1; +18 tests in W0-W1C (all passing); +6 integration meta-tests in W3 stage 1; +0 new tests in W2 (audit-only).**

## Watchlist for forward milestones

- **Pre-existing test fragilities flagged for follow-on housekeeping** (NOT v1.49.634 regressions; out of scope this milestone): `browser-tab-parity`, `connection-caching`, `public-deployment-smoke`. Recommend a small housekeeping mission (~v1.49.640-650 range) to stabilize or quarantine.
- **`v1-49-6XX` placeholder resolution.** Two follow-on mission stubs use the placeholder. Operator-pin needed before either ships.
- **Counter-cadence cleanup-mission #3** target window ~v1.49.664 (30 forward-cadence milestones after v1.49.634). The cadence-overdue gate (Lesson #10168-followup proposed below) would have surfaced the v1.49.615 trigger at the right moment; with it in place the next cycle should land on time.
- **Upstream-alignment audit at next v1.42.x release** — verify `gsd-review` → `gsd-quality` rename has propagated through upstream `workflows/` + `references/` before absorbing.
