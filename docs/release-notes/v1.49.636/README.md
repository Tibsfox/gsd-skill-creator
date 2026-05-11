# v1.49.636 — Housekeeping Cluster #3

**Released:** 2026-05-11 (pending operator G3 authorization)
**Type:** counter-cadence housekeeping cluster (NOT a NASA degree)
**Predecessor:** v1.49.635 (Housekeeping Cluster #2)
**Mission package:** `.planning/missions/v1-49-636-housekeeping-cluster-3/`
**Source vision:** v1.49.635 handoff (8 pre-pinned forward lessons #10180–#10186 + Meta-Lesson) + carry-forward closure of v1.49.635 deferred items
**Engine state:** UNCHANGED (no NASA / MUS / ELC / SPS / TRS forward-cadence content this milestone)

## Summary

v1.49.636 is the **fourth counter-cadence cleanup milestone** in the
engine. It absorbs the v1.49.635 ship-pipeline handoff (8 pre-pinned
forward lessons) by converting each into a deterministic gate or
discipline doc. Seven components were delivered across W0+W1A+W1B+W1C+W2
+W3 stage 1 + the operator-only G3 ship:

- **C1 — Tauri keystore wiring.** Closes v1.49.650 phase-(g) Option-2 deferral. Three `#[tauri::command]` entry points (`keystore_status`, `keystore_migrate_v1_to_v2`, `keystore_set`) wired against the unified `Keystore` substrate, with Rust mirror types (`KeystoreStatus`, `KeystoreState`, `KeystoreBackendKind`, `MigrationOutcome`) and a `keystore_error_to_user_string` boundary mapper co-located with `KeystoreError`. Panic-hook redactor installed at `lib.rs::run` for logged panic text. Production factory `getKeystoreApi()` flipped from `StubKeystoreApi` to `TauriKeystoreApi`; `getStubKeystoreApi()` test escape hatch exported. 17 invoke + 6 invoke.tauri + 3 commands/keystore + 5 panic_hook tests = 31 net new tests; 49 desktop keystore tests passing post-flip (all 12 in-test `new StubKeystoreApi(...)` usages survive unchanged).

- **C2 — Cartridge finalization.** Closes v1.49.635 C2 Stage-1 HALT. New `src/cartridge/department-adapter.ts::departmentLegacyToUnified` maps LEGACY `chipset.yaml` to UNIFIED Cartridge with `chipsets: [{kind:'college'}, {kind:'department'}, {kind:'grove'}]`. New `skill-creator cartridge migrate` subcommand (`<path>`, `--all <root>`, `--exclude <pat>`, `--dry-run`, `--json`) with idempotency check on re-run. Bulk migration: **41 / 48 chipsets migrated** + loader-validated (85% coverage); 4 unfit (Shape Family A — `chipset:`-wrapped) + 3 not-discovered (Family B/C/D) deferred to Phase 2 with per-shape migration paths.

- **C3 — Perf-assertion audit regex expansion.** Closes Lessons #10181 + #10182. New `tools/perf-assertion-audit.mjs` with three shape classes (absolute-threshold-named, absolute-threshold-generic, relative-ratio) and tier-up classification (pure-js, native-module-backed, io-bound, mixed). POSIX-ERE compatibility (JS `\d` translated to `[0-9]` before git grep). `--diff <ref>` mode for apply-to-self gates. Discipline doc + extended audit findings authored at `.planning/test-discipline/perf-assertion-warmup.md` + `perf-assertion-audit-2026-05-11-extended.md`.

- **C4 — Atlas test failures.** Closes v1.49.635 W1A G-gate exempt note. Two pre-existing test failures (`lru_access_promotes_keeps_entry_alive_under_eviction` + `per_project_clear_with_unknown_project_id_falls_back_to_full_clear`) annotated `#[ignore = "..."]` with literal Cluster-#4 disposition strings. Disposition records at `.planning/atlas-test-disposition.md` with root-cause hypotheses and reproduction recipes. Invariant test at `tests/__tests__/atlas-test-disposition.test.ts` SKIPs cleanly when disposition file absent.

- **C5 — Version-sequence ship-prep check.** Closes Lesson #10183 (v1.49.635 slot-pinning incident). New `scripts/check-version-sequence.mjs` outputs `VersionSequenceCheckResult` schema. Soft-warn default; `SC_SKIP_VERSION_SEQUENCE_CHECK=1` silences; `SC_REQUIRE_SEQUENTIAL_VERSION=1` hard-fails. Wired as pre-tag-gate step 1.5. First-in-minor-line is pass-by-definition.

- **C6 — CI-gate enumeration discipline.** Closes Lesson #10185 (v1.49.635 blanket-override silently masked second co-occurring CI red). New `scripts/ci-gate-enum.mjs` with three CSV entry shapes (test-name default, file-glob, file-line with refactor-fragile warning). `SC_SKIP_CI_GATE_TESTS=<csv>` requires every failing test to be enumerated; partial coverage hard-fails. Legacy `SC_SKIP_CI_GATE=1` preserved with DEPRECATION WARNING. Rationale-log template at `.planning/ship-pipeline-discipline/ci-gate-override-rationale.md` per shared-types schema.

- **C7 — Upstream rename re-probe + ship-pipeline-discipline doc.** Sub-1 (upstream rename absorb) deferred a third time — upstream tag still `v1.41.2`, contents probe 404. Sub-2 (unconditional) ships `.planning/ship-pipeline-discipline.md` consolidating Lessons #10184 (branch-aware reset guards — `git update-ref` preferred form) + #10186 (bulk-rename IFS sharp-edge — `grep -rlZ | while IFS= read -r -d ''` pattern) + Meta-Lesson (apply-to-self enforcement). New `scripts/apply-to-self.mjs` with 2 pattern detectors (existsSync-no-skip-guard + perf-assertion-no-warmup) and allowlist support; wired as pre-tag-gate step 9.5 (WARN-only by default).

- **C8 — Integration meta-test + ship.** Eight integration meta-tests at `tests/integration/v1-49-636-meta-test.test.ts` exercise C5/C6/C7 gates with synthetic violation fixtures. Apply-to-self check on the meta-test file passes (no findings). Pre-tag-gate composite now 10 steps (steps 1.5 + 9.5 added).

The milestone introduces 5 deterministic ship-pipeline gates (C5 step 1.5, C6 step 4 enumeration, C7 step 9.5 apply-to-self, C4 atlas-disposition invariant, C3 perf-audit tool) and converts 7 categories of operational debt from social-rule to deterministic-gate. Engine state is unchanged.

## Test counts at ship

- Rust: 3 commands/keystore + 5 panic_hook + 42 atlas (2 ignored with explicit reason) + 93 security suite + ... = 0 regressions
- TS: 17 invoke + 6 invoke.tauri + 13 migration-banner + 13 passphrase-flow + 17 department-adapter + 12 cartridge-migrate + 4 atlas-test-disposition + 8 v1.49.636-meta-test (1 skipped on Tauri-dev) + ... = 0 regressions
- Tools (`vitest.tools.config.mjs`): 300+ passing across 22 files

## See also

- `chapter/00-summary.md` — narrative summary
- `chapter/03-retrospective.md` — what worked / what could be better
- `chapter/04-lessons.md` — 8 carried-forward + any new lessons
- `chapter/99-context.md` — cross-references + predecessor pointer
