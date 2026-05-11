# 99 — Context: v1.49.634

Engine-state tables at v1.49.634 close. All forward-cadence rows UNCHANGED from v1.49.633.

## Engine forward-cadence state

| Track | Degree at v1.49.633 close | Δ at v1.49.634 | Degree at v1.49.634 close |
|---|---|---|---|
| NASA | 1.108 — STS-6 Challenger (first Challenger / first Shuttle EVA / TDRS-1) | — | 1.108 (UNCHANGED) |
| MUS | 1.108 — Bowie *Let's Dance* (LANDING-ANCHOR-ONLY INSIDE +5d) | — | 1.108 (UNCHANGED) |
| ELC | 1.108 — Harold Washington Chicago mayor (1983-04-12) | — | 1.108 (UNCHANGED) |
| SPS | #105 — Pileated Woodpecker (first Picidae / first Piciformes) | — | #105 (UNCHANGED) |
| TRS M1 W2 | pack-30 information theory K_30 = 392 edges | — | pack-30 (UNCHANGED) |

## Operational-gate layer at v1.49.634 close

| Gate | Step | Exit | Override | Authored at |
|---|---|---|---|---|
| `self-mod-guard.js` (Write/Edit/Bash to `.claude/skills\|agents\|hooks/`) | PreToolUse hook | hook always exits 0; decision in stdout JSON | `SC_SELF_MOD=1` / `SC_INSTALL_CALLER=project-claude` | v1.49.585 C01 |
| `git-add-blocker.js` (`.planning/` / `.claude/` / `.archive/` / `artifacts/` adds) | PreToolUse hook | hook always exits 0; decision in stdout JSON | `SC_FORCE_ADD=1` | v1.49.585 C02 |
| `pre-push` (5-file release-notes structure + 200-byte minimum) | git hook | non-zero on missing file | `SC_SKIP_PREPUSH=1` | v1.49.585 C05 |
| `pre-tag-gate.sh` step 7 (CLAUDE.md auto-render drift) | composite step | exit 7 on drift | `SC_SKIP_CLAUDE_MD_GATE=1` | v1.49.596+ |
| `pre-tag-gate.sh` step 8 (catalog-index drift) | composite step | exit 8 on drift | `SC_SKIP_CATALOG_INDEX_GATE=1` | v1.49.601 |
| **`pre-tag-gate.sh` step 9 (Tauri-boundary)** | **composite step** | **exit 9 on violation** | **`SC_SKIP_TAURI_BOUNDARY_GATE=1`** | **v1.49.634 C02 (NEW)** |

Standalone `tools/tauri-boundary-audit.mjs --check` returns exit 10 directly (composite remaps to exit 9).

## Production cfg gates at v1.49.634 close

| Feature flag | Default | Purpose | Authored at |
|---|---|---|---|
| `insecure-plaintext-keystore` (`src-tauri/Cargo.toml`) | OFF in release; ON in debug | Gates plaintext credential-file fallback in `src-tauri/src/security/keystore.rs`. Release builds reject the fallback path. | v1.49.634 C3 Stage 2B (NEW) |

## Observability surface at v1.49.634 close

| Subsystem | Surface | API |
|---|---|---|
| **Math coprocessor watchdog** | `src/coprocessor/watchdog.ts` | `CoprocessorWatchdog` class; `registerWatchdog()` / `getCoprocessorStatus()` / `setSupervisorPolicy()` / `clearWatchdog()` module helpers; `describeWatchdogError()` formatter; `WatchdogStatus` discriminated union (`alive` / `degraded` / `dead` / `unknown`) | v1.49.634 C1 (NEW) |

## CONCERNS.md transitions

| Section | Status at v1.49.633 | Status at v1.49.634 |
|---|---|---|
| §11 Wave-1 integration tests — `tests/legacy/` graduation status uncertain | UNDECIDED | SWEPT — REQUIREMENTS.md DASH-* entries reconciled; `tests/integration/` index documented; 2 truth tests pin the invariant |
| §14 Math coprocessor MCP server lifecycle — no watchdog | OPEN | GATED at v1.49.634 (commit `54481a55b`); observe-only default; opt-in auto-restart |
| §15 Tauri v2 boundary leakage risk — well-defended but prose-only | OPEN (prose-rule) | GATED at v1.49.634 (commit `66490ac1a`); pre-tag-gate step 9 |
| §18 TODO/FIXME/HACK markers — clustered by subsystem (keystore plaintext branch) | OPEN | GATED at v1.49.634 (commit `244482e97`); release-build-gated via `insecure-plaintext-keystore` feature; follow-on stub for encryption-rotation at `.planning/missions/v1-49-6XX-keystore-encryption-stub.md` |

## v1.49.585 §4 deferred-batch closure (consumed by C4)

| Sub-item | Status at v1.49.633 | Status at v1.49.634 |
|---|---|---|
| §4.1 self-mod-guard.js proximity-aware Bash detection | LANDED at v1.49.586 (production); MISSING regression test | TEST LANDED at v1.49.634 C4 |
| §4.2 score-completeness `--cleanup` rubric variant | LANDED at v1.49.586 (production); MISSING regression test | TEST LANDED at v1.49.634 C4 |
| §4.5 MEMORY.md `pg_credentials_location.md` path correction | OPEN | CLOSED at v1.49.634 C4 |
| §4.7 `.gitignore` entries for `.logs/` + `test-results/` | OPEN | CLOSED at v1.49.634 C4 |
| §4.3 citation-debt cleanup sprint | DEFERRED | DEFERRED (separate mission scope) |
| §4.4 counter-cadence cleanup #2 | DEFERRED | THIS MILESTONE — closes itself on ship |

## Test counts at v1.49.634 close

| Source | Delta | Notes |
|---|---|---|
| `src/coprocessor/__tests__/watchdog.test.ts` | +6 | C1 in-process hermetic with injected ping/restart/clock/scheduler |
| `tools/__tests__/tauri-boundary-audit.test.mjs` (vitest forward-ready) | +4 | C2 audit-tool invariants |
| `src-tauri/src/security/__tests__/keystore_*.rs` | +2 (Rust) | C3 cfg-gate proof tests |
| `src/dead-zone/__tests__/citation-invariants.test.ts` (v585 §4 batch) | +4 | C4 regression pins for proximity / cleanup rubric / PG-creds path / .gitignore |
| `tests/legacy/requirements-dash-truth.test.ts` (C5) | +2 | DASH-* mapping invariant |
| `tests/integration/v1-49-634-meta-test.test.ts` (this milestone, W3 stage 1) | +6 | Integration meta-test asserting gates BLOCK on synthetic violations |

**Net new tests at v1.49.634 close: +24 (18 from W0-W1C + 6 from W3 stage 1).** All passing.

## Predecessor / successor pointers

- **Predecessor:** v1.49.633 — STS-6 Challenger / Bowie *Let's Dance* / Harold Washington / Pileated Woodpecker / pack-30. Closed sha at v1.49.633 tag.
- **Successor candidate:** v1.49.635 — STS-7 Challenger 1983-06-18 = NASA 1.109 (first American woman in space Sally K. Ride; Anik C-2 + Palapa B-1 deployments; first RMS-grappled satellite deploy/retrieve SPAS-01). Engine resumes immediate forward-cadence on the next ship.
- **Counter-cadence cleanup #3 target window:** ~v1.49.664 (30 forward-cadence milestones after v1.49.634).
