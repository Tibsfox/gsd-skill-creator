# Summary — v1.49.916

Counter-cadence **codify + tool-robustness** ship (counter-cadence #17) — operator-selected (via AskUserQuestion) two workstreams from the v1.49.915 handoff: **codify #10461** (handoff option 1, the bar reached at v915) and **fix the quality-drift-check/refresh "PG-credential bug"** (handoff option 3). Investigating option 3 corrected its root cause and un-masked a third, benign finding (AC7) that was then fixed under the same "tool robustness" theme.

## 1. Codify #10461 — gate-enforce every runnable surface, paired with a drift-guard

The v913 + v914 + v915 cluster reached the 3-instance bar for #10461: *"a test/observability/policy surface that runs nowhere enforced silently rots; gate-enforce it AND pair the gate with a drift-guard so the enforced set / its reference data cannot silently drift."* This ship codifies it:

- **`docs/known-unwired-ledger-discipline.md`** — new section with the two-layer shape (Layer 1 enforce + Layer 2 drift-guard) and the **three-form drift catalog**: omission-drift (include-list vs disk, v913), silent-addition-drift (exact-set `toEqual`, v914), reference-data-staleness (allowlist vs disk, v915 atlas-deps-audit).
- **`tools/render-claude-md/disciplines.json`** — `#10461` appended to the "KNOWN_UNWIRED allowlists as migration-debt ledger" domain's `key_lessons`, summary, trigger, and `codified_at_milestone`; `npm run render:claude-md` regenerated the (gitignored) CLAUDE.md.
- Manifest **lessons 147 → 148**; COVERED / PARTIAL / UNCODIFIED unchanged (0/0); ceilings 5/5.

## 2. Release-history PG / refresh robustness (handoff option 3 — root cause corrected)

The handoff's "PG-credential bug makes `run-with-pg refresh` exit 1 every ship" was a **misattribution**. Empirically (reproduced three ways):

- Via `run-with-pg`, `quality-drift-check.mjs` gets `RH_POSTGRES_URL` and **does not SASL** — it exits 1 because it **legitimately detects drift** (`status: drifting`, exit 1 *by design*).
- The opaque `SASL: client password must be a string` (exit **2**) only occurs on **direct, un-wrapped invocation** (no `RH_POSTGRES_URL` in env).
- `scripts/release-history-refresh.sh` already documents "exit 1 = drift warned, advisory, not a blocker" — but **`refresh.mjs` did not**: it treated drift's by-design exit-1 as a pipeline failure, aborted, and **skipped the final `audit` step on every ship**.

Two fixes, both in the "tool robustness" theme:

- **`refresh.mjs`** — `isAdvisoryExit(step, status)` makes `drift-check` exit-1 (and the pre-existing `scan` exit-2) advisory: the pipeline continues to `audit` and reports `PASS (with advisories)`. `drift-check` exit-2 (a real crash) stays fatal. Plus an **entrypoint guard** (`main()` runs only as CLI, never on import) — the same hardening v915 applied to `chapter.mjs`, here also making `isAdvisoryExit` unit-testable.
- **`db.mjs`** — `resolvePgCredentials()` throws a **loud, actionable error** ("run via `run-with-pg.mjs`, or export `RH_POSTGRES_URL`…") when no connection coordinate is resolvable, *before* `pg` ever emits its opaque SASL string. The passwordless-auth edge (host set, no password → trust/peer/`.pgpass`) is preserved. An opaque error message is a misdiagnosis generator — this one literally caused the handoff's wrong root cause.

## 3. AC7 leak-scan false-positive allowlist (un-masked by fix #2)

Making `drift-check` advisory let the previously-skipped `audit` step run — and it surfaced a **benign, pre-existing audit FAIL** hidden for ~330 ships: **AC7 (publish dry-run) blocked 1 file**. The block is a **self-referential false positive** — `v1.49.588/03-retrospective.md` documents the AC7/AC10 leak-scan hardening and quotes the `\.planning/(?:fox-companies|agent-memory)/` regex it describes, so the bare `fox-companies` leak pattern (a gitignored local override) matches its own documentation. No real private-path leak.

- **`publish.mjs`** — a narrow, dependency-injectable `leak_scan_allowlist`: a violation is excused only on an **exact `version`+`file`+`pattern` match**, each entry carrying a `reason`. A real leak in any other file, a new pattern in the same file, or the same pattern in another release still BLOCKS.
- **`release-history.config.json`** — the one committed, auditable allowlist entry for the v588 self-reference.
- Result: publish dry-run **1 → 0 blocked**; audit **FAIL → PASS (10/10)**; `run-with-pg refresh` now exits 0 with `audit` running.

## Engine state

- NASA degree **1.178** (UNCHANGED — **134 consecutive ships**).
- Counter-cadence **16 → 17**.
- Manifest entries **24** (UNCHANGED); lessons in manifest **147 → 148** (#10461 codified).
- UNCODIFIED **0** / PARTIAL **0** (UNCHANGED); ceilings 5/5.
- KNOWN_UNWIRED Process / Egress / Loader **0 / 0 / 0** (UNCHANGED).
- Tools suite **664 → 691** (+27 across 3 new test files). Main suite **35,562** (UNCHANGED — no `src/` change).
- Pre-tag-gate executable steps **20** (UNCHANGED — new tests ride the gate+CI tools vitest suite, not a new gate step).
