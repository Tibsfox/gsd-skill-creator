# v1.49.597 — Structural Firsts + Engine State

## Structural firsts at v1.49.597 close

1. **First user-facing browser-tab feature with live-data parity** — the GSD Intelligence Dashboard at `http://localhost:3030/intelligence.html` reaches feature equivalence with the Tauri shell. All 18 KB commands dispatch via HTTP through the IPC-to-HTTP bridge; all 5 SSE event types broadcast from server to browser-tab subscribers within the 250ms target. Closes the v1.49.597 spec promise "same UI bundle in Tauri shell AND browser tab".
2. **First mission-package-as-MILESTONE-CONTEXT cycle** — `.planning/staging/inbox/intelligence-dashboard/` (5 docs + 15 component specs from a 2026-05-02 vision-to-mission conversation) served as the entire milestone context. PROJECT.md + STATE.md were populated from the package without a `/gsd-discuss-milestone` cycle. Pattern OPENED at v1.49.597; promotes to ESTABLISHED at second instance.
3. **First three-transport-against-one-KB architecture** — Tauri shell IPC + browser-tab HTTP bridge + vitest/Node strict-reject. Same 18-command surface; same SQLite WAL; same in-process IntelligenceEventBus singleton broadcasting to whichever transport currently has subscribers. Architectural anchor for any future dual-mode (Tauri ↔ browser-tab) work in the codebase.
4. **First milestone with three intra-milestone Phase fold-ins** — Phase 826.5 (IPC-to-HTTP bridge, added during 826 execution), Phase 827 (browser-tab parity completion, folded in 2026-05-03 from a candidate-v1.49.598 staging package), Phase 828 (operational-debt cleanup, added during ship-pipeline manual smoke). All shipped as part of v1.49.597 rather than spinning up separate stranded-predecessor milestones. Pattern registered as Lesson #10224.
5. **First load-bearing integration of all M1-M8 KB primitives** — the intelligence dashboard exercises the full Memory Arena stack (M1 Semantic Memory Graph indirectly via project KB, M3 Decision-Trace Ledger via the meeting-record format, M4 Branch-Context via per-meeting state machines, M5 multi-turn retrieval indirectly via the AI investigator skill's load-kb-context tool). v1.49.597 is the first milestone where the user-facing surface has full end-to-end visibility into the substrate built across v1.49.500–v1.49.596.
6. **Tree-sitter analyzer pipeline with 8 languages + 7 cross-file finding detectors** — TS/Rust/Python/Bash/GLSL via tree-sitter, plus 3 supporting languages. 7 detector modules: dead code, hot-spots (churn × complexity), coupling, drift, schema mismatch, test gaps, doc gaps. <5-min first-pass scan target met for <100K-LOC repos.

## Engine state at v1.49.597 close

| Surface | Value | Change from v1.49.596 |
|---|---|---|
| NASA degree | 1.77 (Apollo 13) | unchanged |
| MUS Domain register | 14 (Solo-Debut-After-Group-Dissolution) | unchanged |
| ELC degree | 1.77 (LM Aquarius lifeboat) | unchanged |
| SPS series | #74 (Northern Spotted Owl) | unchanged |
| §6.6 register | 21 exemplars | unchanged |
| TRS substrate | M0 CLOSED at v1.49.596; M1 Foundation **deferred** to v1.49.598+ | (counter-cadence position) |
| Three-track cadence | ESTABLISHED 10th instance at v1.49.596; this milestone is counter-cadence | (no advance) |
| Intelligence dashboard | **NEW** — three transports, 18 commands, 5 SSE event types | (first user-facing surface) |
| Lesson #10221 (dev/main sync) | ESTABLISHED at v1.49.596; held cleanly | (canonical now) |
| Pre-tag-gate | 7-step composite still active (build + vitest + completeness --strict + CI-on-dev + www-bundles + depth-audit + CLAUDE.md auto-render) | unchanged |
| Vitest count | ≥29,500 pass (was 28,767 at v1.49.596 close) | +~770 |
| Rust cargo count | 681+ | unchanged from v1.49.596 |

## Build artifacts shipped

- **130 source files added/modified across 9 phases** spanning `src/intelligence/` (analyzer + KB + events + bridge), `src-tauri/src/intelligence/` (Tauri commands + file watchers), `desktop/intelligence/` (planning UI + live-work UI bundles), `dashboard/` (intelligence.html + intelligence/*.bundle.js + intelligence/*.css), `scripts/serve-dashboard.mjs` (IPC-to-HTTP bridge wiring + IntelligenceEventBus subscription), `package.json` (intelligence:build + intelligence:serve scripts).
- **5 new SQLite tables** in `src/intelligence/db/migrations/001_initial.sql` — projects, snapshots, findings, meetings, decisions (with developer_modifications JSON column for editDecision).
- **3 new JSON schemas** in `src/intelligence/schemas/` — vision-seed, console-request, bundle-manifest. All validate against existing `.planning/staging/` and `.planning/console/` examples.
- **1 new auto-activating skill** at `.claude/skills/intelligence-investigator/` (Phase 825 / C12) — generates briefings + triages findings + writes meeting records when invoked from the dashboard's "investigate" action.

## Next milestone scope

v1.49.598+ candidates (not committed; presented for triage):

- **TRS M1 Foundation Wave 0-1** — schema work + page templates + pairing-map skeleton (deferred from v1.49.597 per counter-cadence design).
- **Pack-11/12/13 Wave-1.5 fetches** (carry-forward from v1.49.596 close).
- **NASA degree 1.78 candidate** per Path Y CSV (Apollo 14 likely).
- **Real-browser Playwright smoke test** for the intelligence dashboard (closes Lesson #10222).
- **Dashboard generator output assertion test** (closes Lesson #10223 — fail loudly when parser drift hides data).
- **Promote 3 IntelligenceKB methods from optional to required** (cleanup task: edit/withdraw/preview decision are concretely implemented on KBStore + IntelligenceKBStub now; the optional `?` markers from C00 can be lifted).
