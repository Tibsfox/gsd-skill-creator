# 99 — Context: v1.49.636 Housekeeping Cluster #3

## Predecessor + successor

- **Predecessor:** [v1.49.635](../../v1.49.635/) — Housekeeping Cluster
  (8 components shipped + 8 pre-pinned forward lessons + Meta-Lesson)
- **Successor:** v1.49.637+ (no specific successor pinned; carry-forward
  items in `04-lessons.md` enumerate Cluster #4 candidates)

## Mission package (gitignored)

`.planning/missions/v1-49-636-housekeeping-cluster-3/` — 14 files
(5 top-level + 9 components). NOT committed to git (per the standing
`.planning/` gitignore convention + Lesson #10187 closure). Mission
package lives in the working tree; audit trail lands here in
`docs/release-notes/v1.49.636/`.

## Dependencies

- Substrate from v1.49.650 phase-(a) through phase-(g):
  `src-tauri/src/security/keystore.rs`, `encryption.rs`, `migration.rs`,
  `keyring_backend.rs`. C1 wires these to Tauri commands.
- Substrate from v1.49.585 C02: `.claude/hooks/git-add-blocker.js`.
  Defines the protected-path convention that Lesson #10187 references.
- Substrate from v1.49.585 C00: hook-conventions + env-var registry
  (`SC_FORCE_ADD`, etc.). v1.49.636 introduces 5 new env vars in the
  same family:
  - `SC_SKIP_VERSION_SEQUENCE_CHECK` + `SC_REQUIRE_SEQUENTIAL_VERSION` (C5)
  - `SC_SKIP_CI_GATE_TESTS` (C6 — replaces `SC_SKIP_CI_GATE` which is
    preserved with DEPRECATION WARNING)
  - `SC_SKIP_APPLY_TO_SELF` + `SC_REQUIRE_APPLY_TO_SELF` (C7)
  - `SC_CI_GATE_FAILING` (C6 — test-only bypass for `gh` invocation)

## Cross-references

### Discipline docs (in `.planning/`)

- `ship-pipeline-discipline.md` — C7 (Lessons #10184 + #10186 +
  Meta-Lesson + apply-to-self enforcement section)
- `ship-pipeline-discipline/apply-to-self-allowlist.md` — initially
  empty operator-allowlist
- `ship-pipeline-discipline/ci-gate-override-rationale.md` — C6
  rationale-log template + v1.49.636 placeholder entry
- `test-discipline/perf-assertion-warmup.md` — extended at C3 with
  Lessons #10181 + #10182 sections
- `test-discipline/perf-assertion-audit-2026-05-11-extended.md` — C3
  full audit findings with retroactive tier-up classification
- `atlas-test-disposition.md` — C4 per-test root-cause hypotheses +
  reproduction recipes
- `cartridge-migration-2026-05-11.md` — C2 aggregate report
- `cartridge-migration-phase2.md` — C2 4-shape-family deferral doc

### Pre-tag-gate composite (`tools/pre-tag-gate.sh`)

| Step | Origin | What it checks |
|---|---|---|
| 1 | v1.49.585 | npm run build |
| 1.5 | **v1.49.636 C5** | version-sequence sanity check |
| 2 | v1.49.585 | npx vitest run (full suite) |
| 3 | v1.49.585 | release-notes completeness |
| 4 | v1.49.587 + **v1.49.636 C6** | CI-on-dev verification (with CSV-enumerated override) |
| 5 | v1.49.587 | SPICE renderer bundle freshness |
| 6 | v1.49.591 | depth audit |
| 7 | (date TBD) | CLAUDE.md auto-render check |
| 8 | v1.49.601 | catalog-index drift check |
| 9 | v1.49.634 | tauri-boundary audit |
| 9.5 | **v1.49.636 C7** | apply-to-self enforcement |

Two new gates at v1.49.636 (step 1.5 + step 9.5). Step 4 extended with
the enumeration discipline. 10 gates total at ship.

### New tools (`scripts/` + `tools/`)

- `scripts/check-version-sequence.mjs` — C5
- `scripts/ci-gate-enum.mjs` — C6
- `scripts/apply-to-self.mjs` — C7
- `tools/perf-assertion-audit.mjs` — C3

### New tests

- `tools/__tests__/perf-assertion-audit.test.mjs` (13 tests) — C3
- `tools/__tests__/check-version-sequence.test.mjs` (14 tests) — C5
- `scripts/__tests__/ci-gate-enum.test.mjs` (18 tests) — C6
- `scripts/__tests__/apply-to-self.test.mjs` (13 tests) — C7
- `tests/__tests__/atlas-test-disposition.test.ts` (4 tests) — C4
- `tests/integration/v1-49-636-meta-test.test.ts` (8 tests, 1 skipped) — C8
- `src-tauri/src/commands/keystore.rs` (3 tests) — C1
- `src-tauri/src/security/panic_hook.rs` (5 tests) — C1
- `desktop/src/keystore/invoke.tauri.test.ts` (6 tests) — C1
- `src/cartridge/__tests__/department-adapter.test.ts` (17 tests) — C2
- `src/cli/commands/cartridge-migrate.test.ts` (12 tests) — C2

**Total net new tests this milestone: 113**.

## Engine state

UNCHANGED. The PNW + NASA + MUS + ELC + SPS + TRS catalogs are identical
to v1.49.635's. This milestone introduces NO forward-cadence content;
it converts operational debt into deterministic gates.

## Commit timeline (v1.49.636 chain)

In commit order on `dev`:

1. `f36a3d072` feat(tauri): wire keystore commands + flip getKeystoreApi to TauriKeystoreApi
2. `4aaec5699` feat(cartridge): wire department-adapter + migrate subcommand
3. `8f9a4b867` test(perf): extend audit regex set with relative-ratio + tier-up classification
4. `c7ceb0067` fix(atlas): exempt 2 pre-existing test failures with disposition record
5. `c8cba56f3` feat(scripts): check-version-sequence + pre-tag-gate step 1.5
6. `61be1dc3f` feat(scripts): SC_SKIP_CI_GATE_TESTS CSV enumeration discipline
7. `4330fdc32` docs(planning): ship-pipeline-discipline + apply-to-self enforcement
8. (C8 meta-test + release-notes + version bump — committed at W3 stage 1 prior to G3)
9. (release: v1.49.636 housekeeping cluster #3 — OPERATOR-AUTHORIZED at G3)

The final commits land in the W3 stage 1 → G3 hand-off window.
