# Adversarial ship review (pre-push)

**Status:** Canonical reference for the T14 adversarial review step.
**Codified:** v1.49.968 (Ship 1.1 of the 2026-06-03 audit plan).
**Promoted:** v1.49.1029 — step P is now REQUIRED (gate-enforced via attestation; see
"Promotion" below). Previously ADVISORY (staged #10463).
**Authority:** Required step in the operator-driven T14 sequence (see
[`docs/T14-SHIP-SEQUENCE.md`](T14-SHIP-SEQUENCE.md)).

---

## What this is

Before pushing a ship's code to `origin/dev`, run a multi-agent **adversarial
review of the diff**: parallel read-only reviewers each examine the change through
one lens, produce structured findings, and every non-trivial finding is then
**adversarially verified** by an independent skeptic that tries to refute it. Only
findings that survive refutation are "confirmed" — the orchestrator fixes each
confirmed REAL finding **in code** before push, then re-runs the gate.

This makes the project's empirically-best QA mechanism load-bearing instead of
ad-hoc. It is not a replacement for `tools/pre-tag-gate.sh` (deterministic checks)
or the test suite — it is the **judgment** layer that catches defects a
deterministic gate cannot express.

### Why — the evidence

The ad-hoc form of this review has repeatedly caught real defects that the gate and
tests passed clean:

| Ship | What it caught | Disposition |
|---|---|---|
| v1.49.965 (Ship 0.1) | 3 REAL BLOCKERs (cross-line false-FRESH; exit-22 collision hidden by `grep \| tail`; missing T14 step) | fixed pre-commit |
| v1.49.966 (Ship 0.2) | 1 REAL MAJOR (whitespace-fragile `exit (\d+)` regex in a new drift-guard) | fixed in code pre-push; 1 finding correctly rejected |
| F4 campaign | a real defect in 11 of 35 ships | fixed before push |

A clean review is also a valid result — most lenses on most ships return nothing,
and that is the signal that the diff is sound.

---

## The five lenses

Each reviewer is blind to the others; perspective diversity catches failure modes
that redundancy cannot. The lenses are encoded in
[`tools/ship-review/adversarial-ship-review.mjs`](../tools/ship-review/adversarial-ship-review.mjs):

1. **correctness** (`correctness`) — logic errors, edge cases, regressions, broken
   data flow.
2. **scope & convention** (`scope`) — in-scope-only; conventional commit; no
   `Co-Authored-By: Claude` trailer; no unjustified protected-path staging; file
   placement; no stray debug/placeholder code.
3. **guard / test soundness** (`guard-soundness`) — does each new test/gate pin the
   RIGHT thing and is it mutation-proof (not vacuously true)? whitespace/shape-fragile
   parsers? `at-least-1` where exact-N is required? missing negative fixtures? *(This
   lens caught the v966 MAJOR.)*
4. **doc / release-note accuracy** (`doc-accuracy`) — every factual claim (counts,
   versions, paths, dates, engine-state numbers) cross-checked against the actual
   source; self-referential leak-scan traps (#10462).
5. **security / leak / self-mod** (`security`) — secrets, leak literals in published
   prose, chokepoint bypasses (Loader/Egress/ProcessContext), self-mod-guard
   regressions.

---

## Isolation discipline (load-bearing)

Reviewers run as the read-only **`Explore`** agent type — its toolkit excludes
`Edit`/`Write`/`NotebookEdit`, so a reviewer **cannot** mutate the source under
review. This is the primary defense against the
[`feedback_workflow-agents-invalidate-file-read-state`] gotcha (a non-isolated
mutate-and-"revert" agent that leaves its edit in the working tree, surfaced at
v1.49.963).

- **Do NOT use `isolation: 'worktree'` for these reviewers.** A fresh worktree lacks
  `node_modules`, so `tsx`/`vitest` probes fail there. Worktree isolation is for
  agents that *mutate files in parallel*, which review agents must not do.
- **If a reviewer must probe runtime behavior, it must be additive-only**: write a
  throwaway `probe-*.mts` in the repo root (where `node_modules` resolves), never
  edit the source under review.
- **After the workflow returns, the orchestrator `git status` the tree** and
  `git checkout`/restores anything unexpected before trusting it. With `Explore`
  reviewers this is belt-and-suspenders, but it is mandatory because a future
  `agentType` override could reintroduce the leak.
- **Re-`Read` before `Edit`** any file the review touched: a mutation-probe review
  invalidates the harness's file-read-state, so the first post-review `Edit`/`Write`
  otherwise fails with "File has not been read yet".

---

## Disposition of findings

- **Confirmed REAL → fix in code, not in prose.** A confirmed finding is fixed by
  changing the code/test/doc, never by re-wording the release notes to "explain it
  away". (v966: the fragile regex was widened to `exit\s+`, not documented around.)
- **Refuted → record why.** A rejected finding is noted with the evidence that
  refuted it, so the same false positive isn't re-raised next ship.
- After fixes, **re-run pre-tag-gate and the touched tests**; the ship's
  verification section should state the review's confirmed/rejected counts.

---

## Scale the review to the blast radius

The review depth must match the risk — running a full five-lens panel on a 14-line
mechanical metadata edit is disproportionate, and skipping it on a logic change is
negligent.

- **Trivial, deterministically-checked, mechanical edits** (e.g. a validator-checked
  frontmatter backfill — v1.49.967 Ship 0.3): direct multi-angle verification (run
  the validator, isolate any incidental drift, cross-check values) is sufficient;
  state in the retrospective that the panel was scaled down and why.
- **Logic, gate, process, or security changes**: run the full panel; this is where
  the mechanism earns its cost.

---

## How to run it

At T14, after the code commit and **before** `git push origin dev`:

```
Workflow({
  scriptPath: 'tools/ship-review/adversarial-ship-review.mjs',
  args: {
    base: 'HEAD~1',                       // or the ship's first code commit
    intent: '<one paragraph: what this ship is supposed to do>',
    // dimensions: ['correctness','guard-soundness']   // optional subset
  }
})
```

The workflow returns `{ confirmedCount, bySeverity, confirmed[], rejected[] }`. Fix
each `confirmed` finding in code, then proceed with push → CI → pre-tag-gate.

---

## Promotion (executed v1.49.1029)

This step was initially **advisory** (staged #10463, v1.49.968 Ship 1.1). The
gate-enforcement rung was promoted at v1.49.1029 after meeting the K=30 evidence bar
(one full `SC_ADOPTION_BASELINE_MAX_DRIFT` window of consecutive reviewed ships).

**Evidence for promotion:**
- **51 distinct release versions** since v968 have the adversarial review documented in
  their release notes (across ~116 ships in range; NASA ships run the content-review variant).
- **Caught-defect ledger** kept growing: v965 (3 BLOCKERs: cross-line false-FRESH,
  exit-22 collision, missing T14 step), v966 (1 MAJOR: whitespace-fragile regex),
  v982, 11/35 F4 ships, v1027 (1 BLOCKER + 1 MAJOR), v1028 (1 MAJOR).

**Attestation contract:**

After the adversarial review, write the attestation artifact:
```
node tools/ship-review/write-attestation.mjs \
  --mode full \
  --base <first-code-commit>^ \
  --confirmed N \
  [--fixed N] [--workflow-run <id>] [--notes "<text>"]
```

Modes: `full` (default five-lens panel), `scaled` (deliberate scale-down; requires `--notes`),
`content` (NASA content-review variant).

The attestation file is `.planning/ship-review/last-attestation.json` (local working-tree only;
gitignored via `.planning/`). It carries:
- `reviewedHead` — the git SHA at write time
- `mode` — the review mode enum
- `writtenAt` — ISO-8601 UTC timestamp

**Gate enforcement (step 22):** Pre-tag-gate step 22 (ship-review-attestation, exit 26) runs
`tools/ship-review/write-attestation.mjs --check` which validates three conditions:
1. File exists, parses, has `reviewedHead`, `mode` ∈ {full, scaled, content}, `writtenAt`.
2. `git merge-base --is-ancestor <reviewedHead> HEAD` — the reviewed commits are in this history.
3. `<reviewedHead>` is NOT an ancestor of the newest tag — freshness: a stale attestation from
   the previous ship BLOCKs (run step P again for THIS ship). Skipped when no tag exists.

Exit 26 if missing/stale/invalid. Bypass token: `ship-review-attestation` (emergency only).

**Revert instructions:** To revert to ADVISORY: delete gate step 22 from
`tools/pre-tag-gate.sh`, update the summary line + denominator from 22 back to 21,
restore `docs/T14-SHIP-SEQUENCE.md` step P header to "ADVISORY", update
`tests/integration/pre-tag-gate-self-consistency.test.ts` to expect denominator `[21]`
and anchors `step 0.5/21:` + `step 21/21:` (remove the `/22` anchors and
`not.toMatch(/step [0-9.]+\/21:/)` guard).

---

## Related

- [`docs/T14-SHIP-SEQUENCE.md`](T14-SHIP-SEQUENCE.md) — the step that triggers this.
- [`tools/ship-review/adversarial-ship-review.mjs`](../tools/ship-review/adversarial-ship-review.mjs) — the reusable workflow.
- [`tests/integration/adversarial-ship-review-discipline.test.ts`](../tests/integration/adversarial-ship-review-discipline.test.ts) — the drift-guard (#10461 Layer-2).
- The `adversarial-pr-review` skill — a **complementary** GitHub-PR-flavored review
  (cross-references a PR diff against its linked-issue spec). This doc covers the
  **local pre-push diff** review run inside the T14 ship sequence.
- `feedback_workflow-agents-invalidate-file-read-state` (auto-memory) — the isolation
  gotcha this discipline encodes.
