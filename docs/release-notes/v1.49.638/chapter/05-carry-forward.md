# 05 — Carry-forward: v1.49.638 Housekeeping Cluster #5 → Cluster #6

This chapter inventories all carry-forwards from v1.49.638 to
v1.49.639 (Cluster #6).

## Summary

**6 carry-forward items** routed from v1.49.638 to Cluster #6:

| ID | Type | Source | Priority |
|---|---|---|---|
| CF-1 | Diagnostic target | C4 v1+v2 substrate enumeration | HIGH |
| CF-2 | Tooling | CF-1 instrumentation | HIGH (paired with CF-1) |
| CF-3 | Meta-lesson candidate | Lesson #10197 elaboration | MED |
| CF-4 | Audit-method correction | Lesson #10198 elaboration | MED |
| CF-5 | Operational cleanup | pr-review-gate retirement | LOW |
| CF-6 | Audit doc deferred sites | v1.49.638 W1C MED-tier escalation | MED |

## CF-1: v1.49.634 C4 self-mod-guard CI install gap — 5th carry-forward

**Type:** Diagnostic target (narrow)

**Origin:** v1.49.638 C4 v1+v2 attempts (PR #34 + feat/v1-49-638-c4-ci-install-v2 branch). Diagnostic substrate enumerated; component deferred.

**Lineage:** This is the **5th cluster** carrying forward the
"self-mod-guard not reachable in CI" problem in some form:

| Cluster | Form | Disposition |
|---|---|---|
| v1.49.634 (Cluster #2) | "Hooks not installed in CI" | Deferred |
| v1.49.635 (Cluster #3) | Audit-tool gap | Partial — surfaced |
| v1.49.636 (Cluster #3-followup) | Named carry-forward | Deferred |
| v1.49.637 (Cluster #4) | Named carry-forward | Deferred |
| **v1.49.638 (Cluster #5)** | **CI install attempted; runtime divergence enumerated** | **DEFERRED with narrow target** |
| v1.49.639 (Cluster #6) | Inherit narrow target below | TBD |

**Narrow target:** WHY does `self-mod-guard.js` exit status=1 in
the GitHub Actions CI runner when the byte-identical hook exits
status=0 locally?

**Diagnostic substrate (from v1.49.638):**

| Probe | Local | CI |
|---|---|---|
| `install.cjs --local --quiet` exit code | 0 | 0 |
| `install.cjs --local` verbose exit code | 0 | 0 |
| `test -f .claude/hooks/self-mod-guard.js` | PASS | PASS |
| Hook file byte-identical to source | YES | YES |
| `vitest` overall result | 30,275/30,275 PASS | 30,273/30,275 PASS |
| Failing test count | 0 | 2 |
| Failing test domain | n/a | hook fire path |
| Hook process exit code | 0 | 1 |

**Candidate causes to probe at Cluster #6:**

- Env var divergence: does CI lack `HOME`, `XDG_CONFIG_HOME`,
  `GIT_AUTHOR_*`, etc. that the hook reads?
- $PATH divergence: is `git` on $PATH at hook fire time? `node`?
  Is the hook invoking a subprocess that's not findable?
- File permissions: is the hook file `+x` after `install.cjs`
  writes it? Does the harness require executable bit?
- Working directory at hook fire time: does the hook assume cwd
  is repo root? Is it actually `/tmp/...` in CI?
- stdin/stdout/stderr: does the hook assume a TTY? Read from
  stdin?

**Expected Cluster #6 work:** instrument `self-mod-guard.js` with
CI-gated verbose tracing (env dump + cwd dump + $PATH dump + arg
dump) at entry; trigger on a CI run; read the diff vs local;
patch.

## CF-2: Diagnostic substrate for self-mod-guard.js CI-vs-local divergence

**Type:** Tooling (paired with CF-1)

**Origin:** v1.49.638 W1B.T2 retro — CF-1 cannot be diagnosed
without instrumentation; the instrumentation itself is a Cluster
#6 deliverable.

**Two implementation paths:**

- **Path A (in-hook tracing):** add CI-gated `if
  (process.env.GITHUB_ACTIONS) { console.error('TRACE: ...'); }`
  blocks to `self-mod-guard.js` at entry, exit, and each
  decision branch. Read traces from CI logs.
- **Path B (standalone diagnostic test):** add a CI-only test that
  fires `self-mod-guard.js` directly (not via the Claude
  PreToolUse mechanism) and asserts exit code 0. Failure
  produces the same divergence signal in a dedicated test rather
  than embedded in 30,275-test vitest output.

**Recommendation for Cluster #6:** Path A first (cheapest;
produces actionable trace data). Path B as a fallback if Path A
traces don't isolate the divergence.

## CF-3: Meta-lesson candidate — extend substrate-probe discipline to runtime-environment divergences

**Type:** Meta-lesson candidate

**Origin:** Lesson #10197 surfaced "runtime-environment substrate"
as a distinct substrate class. The lesson body codifies this for
hooks + CI workflow steps, but a generalized treatment is
warranted.

**Cluster #6 expected action:** if Cluster #6 resolves CF-1 (and
the resolution validates the runtime-environment-substrate
hypothesis), promote Lesson #10197 to **Meta-Lesson** status
analogous to v1.49.635 Meta-Lesson #10180.

**Meta-Lesson candidate framing (to be revised based on Cluster
#6 outcome):**

> Substrate is N-dimensional: code substrate (file shape, export
> surface), test substrate (fixture sites, assertion shapes),
> runtime-environment substrate (env vars, $PATH, cwd, perms),
> and possibly **harness substrate** (how the test framework
> invokes the code under test). Each dimension is independently
> susceptible to spec/reality divergence. Pre-merge probe
> protocols must enumerate ALL dimensions relevant to the
> component being merged, not just the dimension the component
> code touches.

## CF-4: Audit-method correction — substrate-probe discipline v2

**Type:** Audit-method correction

**Origin:** v1.49.638 W1C Stage 2 false-positives (Lesson #10198).
The substrate-probe discipline doc at
`docs/SUBSTRATE-PROBE-DISCIPLINE.md` codifies code-substrate +
runtime-substrate probes. It does NOT yet codify the
**adjacency-check requirement** for grep-based enumeration.

**Expected Cluster #6 action:** revise
`docs/SUBSTRATE-PROBE-DISCIPLINE.md` to add a
"grep adjacency check" sub-section under the audit-method portion:

- Negation grep alone is not sufficient (`grep -L pattern files`
  has false-positive risk)
- Pair with **adjacency check** that catches alternate syntactic
  forms (`grep '}, \d{4,6}\);'` for hookTimeout inline-form,
  similar for other multi-form concepts)
- Document the rate-of-false-positives observation from
  v1.49.638 W1C (33% in 6 flagged files)

**Companion artifact:** create
`docs/test-discipline/audit-method-corrections.md` as the central
inventory of known-multi-form concepts and the adjacency checks
that cover them.

## CF-5: pr-review-gate hook retirement

**Type:** Operational cleanup

**Origin:** v1.49.638 W1B.T2 surfaced that the `pr-review-gate.sh`
Claude PreToolUse hook (experimental from artemis-ii era) is
still active and blocks any feature-branch push without a
`/tmp/.pr-reviewed-<branch>` sentinel.

The hook served its purpose during the artemis-ii experiment
(2026-04-09 → 2026-04-14) and was scheduled to retire when
artemis-ii ended. Retirement did not happen as part of the
artemis-ii merge cleanup; it has been quietly active across
v1.49.585 → v1.49.638.

**Impact:** every v1.49.638 feature-branch push (C4 v1 → PR #34
+ C4 v2 → branch) required either a sentinel touch or explicit
operator authorization. This is friction without value (the
artemis-ii experiment is complete; the hook is vestigial).

**Expected Cluster #6 action:** retire `pr-review-gate.sh` from
the Claude hooks installation. Options:

- (a) Delete the hook file + remove from project-claude/install
  manifest
- (b) Move to `experimental/retired/` with a note for historical
  reference
- (c) Leave file but unregister from PreToolUse (silent
  deactivation)

**Recommendation:** (a) clean delete; the artemis-ii substrate
that motivated the hook is no longer extant.

## CF-6: v1.49.638 W1C audit doc deferred sites

**Type:** Audit doc deferred sites

**Origin:** v1.49.638 W1C flake audit `docs/test-discipline/flake-audit-2026-05-11.md` Stage 3 closure included deferrals to v1.49.639 retro re-evaluation:

- `src/kb/store.ts:301` — MED-tier ORDER-BY-without-tiebreaker site (read path; lower flake risk than the test-side hits)
- `src/kb/store.ts:866` — same shape
- `src/kb/store.ts:911` — same shape
- 4 MED-tier hookTimeout files (full list in audit doc Stage 2
  table, MED bucket)

**Why deferred:** the source-side fixes require deeper refactor
than W1C scope allowed. Test-side fixes (the 4 commits in C5)
preempt the highest-flake-risk surface; source-side is lower-
priority.

**Expected Cluster #6 action:** at v1.49.639 retro, re-evaluate
whether to:

- (a) Land the source-side fixes as a small batch in v1.49.639
- (b) Defer further if v1.49.638's test-side fixes proved
  sufficient (no new flakes observed during v1.49.639 NASA
  degree ship)
- (c) Promote source-side fixes to a dedicated Cluster #7
  flake-hardening component

## Carry-forward priority routing

For Cluster #6 mission-package authoring:

- **PRIORITY 1 (must close):** CF-1 + CF-2 (paired) — self-mod-guard CI divergence
- **PRIORITY 2 (recommended close):** CF-4 — audit-method correction codification (cheap, ~30 min)
- **PRIORITY 3 (cleanup):** CF-5 — pr-review-gate retirement (~15 min)
- **PRIORITY 4 (decide):** CF-3 + CF-6 — promote-to-meta-lesson decisions; depend on Cluster #6 outcomes

## Forward-note RECOMMENDATION (per Lesson #10196 discipline)

**RECOMMENDATION:** If Cluster #6 closes CF-1 and the resolution
validates the runtime-environment-substrate hypothesis, promote
Lesson #10197 to Meta-Lesson status. If CF-1 resolution shows
the divergence is **code-substrate** in disguise (e.g., the hook
reads a file that exists locally but not in CI), then Lesson
#10197 stays a regular lesson and the runtime-substrate
generalization is unwarranted.

**RE-EVALUATION CRITERION (when should this be reopened?):**
Cluster #6 has CF-1 closure as a P1 deliverable. If CF-1 is
NOT closed at Cluster #6 (e.g., 6th defer), forward-note must
escalate the cluster-chain status — 6 consecutive clusters on
the same target indicates the target needs broader scope (full
hooks-CI architectural review) rather than another iteration.

**DECISION-TREE CUMULATIVE STATE:** 5 consecutive clusters
carrying the self-mod-guard CI gap. Each prior cluster
identified the gap; v1.49.638 enumerated diagnostic substrate.
Cluster #6 inherits a narrow target. If a 6th defer occurs,
re-scope.
