# v1.49.597 — Engine-State Context

## Forward-cadence engine state at v1.49.597 close

| Surface | Value | Source / Reference |
|---|---|---|
| **NASA degree** | 1.77 | Apollo 13 SUCCESSFUL FAILURE + LM-AS-LIFEBOAT (v1.49.596 close) |
| **MUS Domain register** | 14 | Solo-Debut-After-Group-Dissolution (McCartney solo, v1.49.596) |
| **ELC degree** | 1.77 | LM Aquarius lifeboat + CO2 mailbox (IHAP subsumed; v1.49.596) |
| **SPS series** | #74 | Northern Spotted Owl (first RAPTOR exemplar; v1.49.596) |
| **§6.6 register** | 21 exemplars | Path D BOTH dual origination at v1.49.596 (SUCCESSFUL-FAILURE + LM-AS-LIFEBOAT) |
| **TRS substrate** | M0 CLOSED at v1.49.596; M1 deferred | (counter-cadence position; M1 W0-1 begins at next forward-cadence milestone) |
| **Three-track cadence** | ESTABLISHED 10th instance at v1.49.596 | (this milestone is counter-cadence) |
| **Dev/main sync (Lesson #10221)** | ESTABLISHED at v1.49.596 | `npm run ship-sync` is canonical post-merge step |
| **Pre-tag-gate** | 7-step composite | build + vitest + completeness --strict + CI-on-dev + www-bundles + depth-audit + CLAUDE.md auto-render |
| **Cross-link STRICT mode** | ACTIVE since v1.49.595 | NASA W2 13/13 100% coverage held at v1.49.596 |

## Intelligence-dashboard state at v1.49.597 close (NEW surface)

| Surface | Value | Source |
|---|---|---|
| **Three transports against one KB** | Tauri shell IPC + browser-tab HTTP + vitest/Node strict-reject | Phase 824 / C07 + Phase 826.5 + Phase 827 |
| **Command surface** | 18 commands (9 read + 6 write + 3 console-relay) | `src/intelligence/dashboard-bridge.ts` COMMANDS table |
| **SSE event types** | 5 (status_update, briefing_ready, findings_updated, meeting_record_updated, bundle_completed) | `src/intelligence/events/types.ts` |
| **Server-side event bus** | `IntelligenceEventBus` singleton | Phase 827 / C02 (`src/intelligence/events/bus.ts`) |
| **SSE broadcast wiring** | dashboard server subscribes once at startup; re-broadcasts to all `/api/events` SSE clients | Phase 827 / C02 (`scripts/serve-dashboard.mjs`) |
| **KB persistence** | SQLite WAL at `~/.gsd/intelligence/registry.db` (root) + per-project `intelligence.db` | Phase 821 / C00 + Phase 823 / C04 |
| **Static-mode banner condition** | (no Tauri AND bridge unreachable) — NOT "no Tauri alone" | Phase 826.5 update (`dashboard/intelligence.html` probe) |
| **Bundle dependency chunks** | copied to `dashboard/assets/` during `intelligence:build` | Phase 828 (closes 826.5 carryover) |
| **Bundle auto-mount** | tries `#intelligence-planning` first, falls back to `#planning-root` | Phase 828 (closes C14 migration ID gap) |

## Phase shape

| Phase | Wave | Component(s) | Commit | Tests added |
|---|---|---|---|---|
| 821 | W0 Foundation | C00 shared types + SQLite migration + JSON schemas + KB stub | `c6df1170e` | +36 |
| 822 | W1 Track A | C01 analyzer core + C02 8 tree-sitter languages + C03 7 finding detectors | `dd59e8544 → 3fbc28968` | +132 |
| 823 | W1 Track B | C04 IntelligenceKBStore + C05 SnapshotManager + C06 MeetingStore | `e5e7b2cab → b704d645a` | +111 |
| 824 | W1 Track C | C07 Tauri server + C08 planning UI + C09 live work UI | `dd7bb221f → e670762a8` | +178 (+24 Rust) |
| 825 | W2 Integration | C10 mission emitter + C11 meeting-record generator + C12 AI investigator skill (G1) | `3ad4c4278 → 8829f08b0` | +147 |
| 826 | W3 Verification | C13 integration tests (38S + 60I + 26E + 8P) + C14 dashboard migration (G2) | `88a5f27d2 → efb0dbe23` | +132 |
| 826.5 | intra-826 | IPC-to-HTTP bridge (15 of 18 commands) + nav-shim renderer + npm scripts + banner copy | `79c311281 → 240b15d0b` | (refactors) |
| 827 | folded-in W0-W3 | C00 shared event types + C01 KBStore.editDecision/withdraw/preview + C02 IntelligenceEventBus + C03 bridge wiring + C04 browser-tab parity integration suite | `cd6bb84d7 → a0da77480` | +36 |
| 828 | ship-pipeline fold-in | build asset copy + auto-mount ID fallback + 3 dashboard parser updates | `ee8a30f8a → 331f45cc3` | (53/53 parser tests still pass) |

## Test totals at v1.49.597 close

| Suite | v1.49.596 close | v1.49.597 close | Delta |
|---|---|---|---|
| **vitest (full)** | 28,767 | ≥29,500 | ~+770 |
| **vitest src/intelligence/** | 0 (didn't exist) | 595 | +595 (NEW surface) |
| **vitest src/dashboard/parser.test.ts** | 53 | 53 | 0 (legacy fixtures still pass) |
| **Rust cargo (src-tauri)** | 681 | 681+ | 0+ |

## Build artifacts

- **130 source files added/modified** across 9 phases
- **Languages parsed by analyzer**: TypeScript, Rust, Python, Bash, GLSL (primary 5) + 3 supporting via tree-sitter
- **Finding detectors**: 7 (dead code, hot-spots, coupling, drift, schema mismatch, test gaps, doc gaps)
- **SQLite migrations**: 1 (v1 → v2 with WAL + 5 tables)
- **JSON schemas**: 3 (vision-seed, console-request, bundle-manifest)
- **Auto-activating skills**: 1 new (`intelligence-investigator`) at `.claude/skills/`

## Carryover threads to v1.49.598+

- **TRS M1 Foundation Wave 0-1** — schemas + page templates + pairing-map skeleton (deferred from v1.49.597 per counter-cadence design).
- **Pack-11/12/13 Wave-1.5 fetches** (carry-forward from v1.49.596 close; topology / linear-algebra / measure-theory).
- **NASA degree 1.78 candidate** per Path Y CSV (Apollo 14 likely; alternate per Path Y spec).
- **Lesson #10222 closure** — Playwright real-browser smoke for `intelligence.html` (catches 826.5-style carryover gaps before tag).
- **Lesson #10223 closure** — dashboard generator output non-empty test (catches parser-drift gaps before tag).
- **Lesson #10224 second instance** — intra-milestone Phase fold-in pattern; promotion to ESTABLISHED at next confirming instance.
- **Optional → required cleanup** — promote `IntelligenceKB.editDecision` / `withdrawDecision` / `previewBundle` from optional `?:` to required signatures (concrete impls now exist on KBStore + IntelligenceKBStub).
- **#10225 trailing-median refinement** (open from v1.49.596 — composite-pass third-soak observation).
- **#10215+#10223+#10228 three-tier recovery hierarchy** — documented in W2-build-agent-prompt template at v1.49.596; not exercised this milestone (no W2-quota failures).

## v1.49.597 → v1.49.596 dev/main sync

Pre-ship: 38+ commits ahead of `origin/dev` (10 from v1.49.596 ship-pipeline tooling + 28 from this session's Phase 821-827 + Phase 828 + ship-pipeline preparation).

Post-ship target (after `git push origin dev` + dev→main merge `--no-ff` + `npm run ship-sync`):
- `dev` and `main` both at v1.49.597 tag
- 0-commit drift between dev and main (Lesson #10221 ESTABLISHED soak fourth-instance)
- Tag `v1.49.597` lives on the merge commit
- GitHub release published via `npm run gh-release-publish -- 1.49.597`
- RH refresh: `node tools/release-history/run-with-pg.mjs refresh --fast --quiet`

## Operator hold-points

- **Session-start HARD RULE:** "stay on dev no push to main" — held throughout build phases.
- **Ship-pipeline operator authorization:** lifted at the explicit "lets wrap up v1.49.597 and commit and ship" signal; pause for explicit operator sign-off before `git tag` / `git push origin dev` / dev→main merge.
- **Post-ship:** dashboard regenerates against tagged content; RELEASE-HISTORY.md gets v1.49.597 entry; `git log dev..origin/main` returns 0 commits.
