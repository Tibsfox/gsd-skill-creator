# 02 — Walkthrough: v1.49.638 Housekeeping Cluster #5

Per-component walkthrough with code paths, commit anchors, and
invariants.

## C1 — Atlas LRU per-project API (W1A.T1)

**Closes:** v1.49.637 CL5-CF-1 (`lru_access_promotes_keeps_entry_alive_under_eviction`).

**Operator W0 choice:** option (a) per-project API.

**Files touched:**

- `src-tauri/src/atlas.rs` — new `get_or_open_for_project(project_id)` method preserving LRU isolation across project boundaries
- `src-tauri/src/atlas.rs` (tests module) — 3 new tests

**Commit anchors:** `7a9a2c5cb` (API + tests) + `b78097bb9` (LRU
isolation invariant test).

**Load-bearing invariant:** opening a connection in project A
does NOT promote project B's LRU entries. The previously
`#[ignore]`'d test from v1.49.637 C4 — which asserted LRU promote
keeps entries alive under eviction — is now active and passing
because it operates against the per-project API rather than the
shared `get_all_project_conns()` batch-load path.

**Test delta:** +3 Rust tests. All passing under `cargo test
--lib`.

**Why option (a) over (b):** documented in chapter 01 (operator-
private roadmap context — scoped-Tauri-commands work in Cluster
#6+ wants this API surface to exist before it ships).

---

## C2 — STORY-gate ordering (W1A.T2 + W1A.T3)

**Closes:** v1.49.637 W3.T2 mid-T14 review finding (STORY append
position ambiguity).

**Operator W0 choice:** option (i) doc + invariant.

**Files touched:**

- `docs/T14-SHIP-SEQUENCE.md` — NEW canonical T14 sequence reference. Documents the 13-step T14 sequence with STORY append at step 12 (after tag push at step 5, after main FF push at step 8)
- `scripts/pre-tag-gate.sh` — removed misplaced step 10 STORY append; pre-tag-gate is now 9 steps
- `tests/integration/c2-story-gate-ordering.test.ts` — NEW invariant test asserting:
  - `pre-tag-gate.sh` does NOT call `append-story-entry.mjs`
  - `docs/T14-SHIP-SEQUENCE.md` exists and lists STORY append AFTER tag-push step
- `tests/integration/v1-49-637-meta-test.test.ts` — C4 assertion inverted via W1A.T3 to match new ordering (was: "step 10 must exist"; now: "step 10 must NOT exist; ordering lives in T14 doc")

**Commit anchors:** `961e36943` (T14 doc + invariant test) +
`a5ad270fb` (pre-tag-gate step-10 removal) + `04dbfdc7c` (v1.49.637
meta-test C4 inversion) + `1e9d64dfc` (W1A.T3 polish).

**Load-bearing invariant:** the STORY append occurs **after the
tag is pushed**. This is semantically correct (the STORY entry
references the tag); previously the pre-tag-gate misplacement
caused an append-then-fail recovery dance during mid-T14 review.

**Test delta:** +6 TS tests (3 new ordering assertions + 3
inversions of v1.49.637 meta-test).

**Why not option (ii) refactor or option (iii) procedural:** (ii)
left the ordering implicit (would resurface in future cycles);
(iii) had no automation (would resurface as forgetfulness debt).
Option (i) creates a tracked document that future ships can
reference + a test that fails loudly if ordering regresses.

---

## C3 — Substrate-probe discipline codification (W1B.T1)

**Closes:** v1.49.637 Lesson #10192 forward-note.

**Files touched:**

- `docs/SUBSTRATE-PROBE-DISCIPLINE.md` — NEW canonical reference (relocated from `.planning/test-discipline/SUBSTRATE-PROBE-DISCIPLINE.md` which was gitignored)

**Commit anchor:** `a8a50b21d`.

**Content:** the doc codifies the Stage-1 substrate enumeration
practice (grep the actual file shape; read the actual package
export surface; count the actual fixture sites) plus a new
extension surfaced at v1.49.638 W1B.T2: **runtime-environment
substrate** (env vars, $PATH, file permissions, working directory
at hook fire time) is just as susceptible to spec/reality
divergence as code substrate.

**Why relocation matters:** `.planning/` is gitignored at this
repo. A discipline that lives only in gitignored notes cannot be
referenced by future mission-package authors or sub-agent dispatch
briefs. The `docs/` location makes it normatively citable.

**Test delta:** 0 (doc-only).

---

## Dashboard skip-guard fix (cherry-picked from C4-v2)

**Closes:** dashboard false-positive (`HAS_LIVE_PLANNING` triggers
on bare `.planning/` dir without `REQUIREMENTS.md`).

**Files touched:**

- `dashboard/index.html` — skip-guard heuristic tightened to require `.planning/REQUIREMENTS.md` rather than just `.planning/`

**Commit anchor:** `06a0da610`.

**Origin:** this fix was discovered during C4-v2 investigation —
the C4-v2 install branch had a bare `.planning/` from
project-claude scaffolding that triggered the dashboard's "live
planning detected, skip mock data" path falsely. Independent of
the C4 CI install issue, so the fix was cherry-picked forward as
a standalone commit when C4-v2 was partial-merged.

**Test delta:** 0 (manual dashboard test).

---

## C5 — Pre-emptive flake audit (W1C)

**Closes:** no carry-forward (proactive); preempts CI flake risk
ahead of v1.49.639.

**Files touched:**

- `docs/test-discipline/flake-audit-2026-05-11.md` — NEW audit
  document with 3 stages: Stage 1 enumeration, Stage 2 prioritization, Stage 3 closure
- `src/kb/store/__tests__/list-meetings.test.ts` — `ORDER BY rowid` tiebreaker added (fix `97a5ce3cf`)
- `src/kb/store/__tests__/list-findings.test.ts` — `ORDER BY rowid` tiebreaker added (fix `deff7f9cd`)
- `src/kb/store/__tests__/projects.test.ts` — hookTimeout protection (fix `6d1282c64`)
- `src/kb/store/__tests__/findings.test.ts` — hookTimeout protection (fix `6d1282c64`)

**Commit anchors:** `97a5ce3cf` + `deff7f9cd` + `6d1282c64` +
`074ff9d44` (Stage 3 closure doc).

**Stage 3 closure includes honest disclosures:**

1. **2 Stage 2 false positives** — the Stage 2 grep
   (`grep -L hookTimeout`) only caught the `vi.setConfig` form,
   missing the inline `}, 30000);` 2nd-arg form. Two files
   flagged as "missing hookTimeout protection" already had it via
   the inline form. Cross-check method correction: pair the
   `grep -L` with a `grep '}, \d{4,6}\);'` adjacency check. This
   is Lesson #10198 forward.
2. **1 MED-tier escalation deferred** — `kb/store.ts` lines
   301/866/911 surfaced as MED-tier in Stage 2 but require deeper
   refactor than W1C scope allows. Deferred to v1.49.639 retro
   re-evaluation.

**Test delta:** 0 new tests (4 existing tests stabilized).

---

## W3.T1 — Integration meta-test (W3 stage 1)

**Closes:** mission-package W3 stage 1 deliverable.

**Files touched:**

- `tests/integration/v1-49-638-meta-test.test.ts` — NEW with 10 assertions:
  - C1: 2 assertions (per-project API exists; LRU isolation invariant test exists)
  - C2: 3 assertions (T14 doc exists; pre-tag-gate does NOT have step 10; ordering invariant test exists)
  - C3: 1 assertion (`docs/SUBSTRATE-PROBE-DISCIPLINE.md` exists)
  - C5: 3 assertions (flake audit doc exists; ORDER BY rowid present in list-meetings + list-findings tests)
  - C4 deferral: 1 explicit assertion (Cluster #6 carry-forward note present; no install step regression)

**Commit anchor:** `d49a6c381`.

**Apply-to-self status:** test file is verified clean under
`scripts/apply-to-self.mjs` (no perf-assertion false positives, no
known-pattern hits).

---

## C4 — Self-mod-guard CI install gap (DEFERRED)

**Status:** NOT shipped. Deferred to Cluster #6 with diagnostic
substrate enumerated.

**Attempts:**

- **v1** — branch `feat/v1-49-638-c4-ci-install`. Added install
  step to `.github/workflows/ci.yml` invoking `node
  project-claude/install.cjs --local --quiet` before test run.
  PR #34. CI failed. Reverted at `33f4af237` per Lesson #10199.
- **v2** — branch `feat/v1-49-638-c4-ci-install-v2`. Added
  verbose-logged install step + explicit invariant check (`test -f
  .claude/hooks/self-mod-guard.js`). PR open. CI failed
  again — but with diagnostic substrate enumerated.

**Diagnostic substrate (carry-forward to Cluster #6):**

| Probe | Result | Implication |
|---|---|---|
| `install.cjs --local` verbose run in CI | EXITS 0, writes files | Install step itself is correct |
| Invariant check `test -f .claude/hooks/self-mod-guard.js` | PASSES in CI | Hook file is present after install |
| `vitest` overall result | 2/30,275 FAIL | 2 failures, both on hook fire path |
| Hook process exit code in CI | status=1 | **This is the real bug** |
| Same hook fired locally | status=0 | Local-vs-CI runtime divergence |

**Cluster #6 narrow target:** WHY does `self-mod-guard.js` exit
status=1 in the CI runner when the same hook with the same input
exits status=0 locally? Candidate causes: env var divergence,
$PATH divergence (no `git` on $PATH at hook fire time?), file
permissions (hook not +x in CI), working directory at hook fire
time.

**Why partial-merge instead of full revert:** the dashboard
skip-guard fix is independent of the install issue. Partial-merge
preserved the bug fix as `06a0da610` and reverted only the install
step.
