# 04 — Lessons: v1.49.638 Housekeeping Cluster #5

Forward lessons emitted by this milestone. Numbering continues
from the v1.49.637 set (last forward-emitted: #10196 — Cluster
close forward-notes are load-bearing decisions).

---

### Lesson #10197 — Substrate-probe discipline extends to runtime-environment substrate

**Type:** Mission-package authoring + sub-agent dispatch discipline
**Surfaced at:** W1B.T2 C4 v1+v2 attempts (install works in CI; meta-test correct; hook execution fails in CI)
**Closes at:** v1.49.638 W1B (codified in `docs/SUBSTRATE-PROBE-DISCIPLINE.md`)
**Generalizes:** v1.49.637 Lesson #10192 (substrate-probe before component-spec finalization)

#### Pattern

Substrate-probe discipline was originally framed around **code
substrate**: grep the actual file shape, count the actual fixture
sites, read the actual package export surface. v1.49.638 W1B.T2
demonstrated a new substrate class — **runtime-environment
substrate** — that is just as susceptible to spec/reality
divergence as code.

The C4 v1+v2 attempts had: correct hook code (byte-identical
local vs CI), working install step (verbose run passes; invariant
check passes), correct meta-test assertion. Yet CI failed with
`self-mod-guard.js` exiting status=1. The bug was in the
**runtime environment at hook fire time**: env vars, $PATH, file
permissions, working directory — substrate that doesn't exist
until the hook runs.

#### Concrete instance at v1.49.638

C4 v2 probe trail:

1. `install.cjs --local` verbose run → EXITS 0, writes hook file
2. `test -f .claude/hooks/self-mod-guard.js` → PASSES
3. Vitest overall → 2/30,275 FAIL, both on hook fire path
4. Hook process exit code in CI → status=1
5. Same hook fired locally → status=0

The code-substrate probes (#1, #2) gave green. The runtime-
substrate probe (#4) gave red. The discipline gap: pre-merge
probe protocol enumerated #1, #2, and the meta-test (which is a
code substrate probe), but did NOT enumerate #4. Adding "does
the hook execute successfully under the same harness as the test
will fire it from?" to the probe checklist would have caught the
divergence pre-merge.

#### How to apply

For future mission packages and sub-agent dispatch briefs:

- Code-substrate probes remain primary (grep shape, read export,
  count sites) — they catch 80% of spec/reality divergence
- ADD a runtime-substrate probe when the component touches:
  - Hooks (PreToolUse, PostToolUse, etc.)
  - CI workflow steps
  - Anything that fires under a different environment than the
    test that asserts it
- The runtime-substrate probe is: **execute the actual code path
  under the actual target environment** (not just the test
  asserting it). For hooks: fire the hook directly. For CI
  steps: dry-run on a feature branch with verbose logging.
- If the actual target environment is unreachable (e.g., remote
  CI runner not available for local probe), the spec MUST note
  this as a risk and the dispatch brief MUST include a re-attempt
  budget.

---

### Lesson #10198 — Audit-method false positives surface late when grep methods don't cover all syntactic forms

**Type:** Audit-discipline + tooling correction
**Surfaced at:** W1C C5 flake audit Stage 2 (2 false positives in 6 flagged files — 33% rate)
**Closes at:** v1.49.638 W1C Stage 3 (method correction documented in `docs/test-discipline/flake-audit-2026-05-11.md`)
**Generalizes:** v1.49.635 Meta-Lesson #10180 (audit underestimates fixture scope)

#### Pattern

When an audit uses a `grep` invocation as its enumeration step, the
invocation captures only the syntactic forms the grep pattern
matches. If the underlying concept (here: "test file has hook
timeout protection") has **multiple valid syntactic forms**, a
single grep can miss valid implementations and flag them as
violations.

The cost of this is **late-surfacing false positives**: the
Stage 2 audit produces a list of flagged files; Stage 3 closure
inspects them and discovers some were already compliant under a
different syntactic form. The false-positive rate is wasted
audit cycles + risk of "fix" that breaks already-correct code.

#### Concrete instance at v1.49.638

C5 Stage 2 grep: `grep -L hookTimeout src/**/__tests__/*.test.ts`
— returns files where the literal token `hookTimeout` does not
appear.

This catches the `vi.setConfig({ hookTimeout: 30000 })` form. It
**misses** the inline 2nd-arg form:

```ts
beforeEach(async () => {
  // setup
}, 30000);
```

This form sets a 30-second timeout for the `beforeEach` hook but
contains no literal `hookTimeout` token. Two files in the Stage 2
flagged list used this form and were already protected.

#### Method correction

Pair the negation grep with an **adjacency check**:

```
grep -L hookTimeout <files>           # finds candidates
grep -l '}, \d{4,6}\);' <candidates>  # excludes inline-form
```

Files that appear in (1) but not (2) are true positives. Files in
both are false positives.

#### How to apply

For future audits:

- When the audited concept has multiple syntactic forms, list ALL
  forms in the audit doc Stage 1 enumeration
- Use multi-method enumeration (negation grep + adjacency grep +
  AST query if available) rather than a single grep
- Stage 2 should produce TRUE-POSITIVE rate estimate, not just
  raw count — if FP rate >10%, escalate method-correction
- Document the method correction inline in the audit doc, not in
  a separate retrospective (the next audit author needs to see it
  before authoring their grep)

---

### Lesson #10199 — Failed-CI iteration produces more reliable substrate than first-try success

**Type:** Component disposition + re-attempt discipline
**Surfaced at:** W1B.T2 C4 v1+v2 attempts (failures enumerated runtime substrate that successful merge would have skipped)
**Closes at:** v1.49.638 W1B (component deferred to Cluster #6 with diagnostic substrate)

#### Pattern

When a feature-merge fails CI in a way that cannot be reproduced
locally, the natural inclination is **rollback + replan**. This
preserves a green main but discards the diagnostic substrate the
failure produced.

The **alternative disposition** is **hardening + diagnostic +
revert**: keep the merge attempt as a working branch, add verbose
logging + explicit invariant checks, re-run CI to enumerate which
substrate slice fails, THEN revert with the enumerated substrate
attached to the carry-forward.

This produces a **narrower target** for the next attempt than a
rollback-and-replan would. v1.49.638 C4 v1+v2 enumerated 5
probes; only the 5th (hook exit code in CI) failed. Cluster #6
inherits "fix probe #5" rather than "diagnose C4 from scratch."

#### Concrete instance at v1.49.638

C4 v1 disposition:
- v1 PR #34 created on `feat/v1-49-638-c4-ci-install`
- CI failed
- Reverted at `33f4af237`
- **Substrate enumerated from v1**: install step alone is not sufficient (some other gap exists)

C4 v2 disposition:
- v2 created on `feat/v1-49-638-c4-ci-install-v2`
- Added verbose logging + invariant check
- CI failed again
- **Substrate enumerated from v2**: install step works; invariant passes; hook execution itself fails
- Partial-merge: skip-guard fix cherry-picked forward; install step reverted
- Component deferred to Cluster #6 with 5-probe diagnostic table

A rollback-after-v1 disposition would have ended with "C4 is
hard; re-attempt with different approach in #5." Cluster #6 now
has "instrument self-mod-guard.js for CI-vs-local divergence" as
its target — far more actionable.

#### How to apply

For future component dispositions:

- When a feature-merge fails CI in a non-local-reproducible way:
  - DO NOT immediately rollback to "fresh start" disposition
  - DO add verbose logging + invariant checks to the failing
    branch; re-run CI
  - DO enumerate WHICH substrate slice failed (build, install,
    invariant, runtime, assertion)
  - THEN either fix-forward (if substrate is now actionable
    in-budget) or revert-with-diagnostic-substrate (if not)
- Pre-plan a **re-attempt budget** (e.g., 90 minutes for v2
  attempt) so the disposition decision is bounded
- Document the diagnostic substrate in the carry-forward note,
  NOT in a separate retrospective document — the next attempter
  needs to see it as part of the brief

---

### Lesson #10200 — Sub-agent dispatches with self-correction stages need ≥2 internal commit boundaries

**Type:** Sub-agent dispatch template + token-ceiling discipline
**Surfaced at:** W1C flake-audit sub-agent terminated near token ceiling mid-Stage-3 self-correction
**Closes at:** v1.49.638 W1C (team-lead picked up working-tree; no work lost; recovery required team-lead attention)
**Generalizes:** v1.49.637 Lesson #10194 (commit-between-deliverables preserves work)

#### Pattern

v1.49.637 Lesson #10194 established commit-between-deliverables
as the mitigation for the ~60-70 tool-use sub-agent token
ceiling. That lesson framed deliverables as **distinct
artifacts** (meta-test + release-notes + handoff = 3 commit
boundaries).

v1.49.638 W1C surfaced a refinement: when a sub-agent dispatch
includes **multi-stage self-correction** (audit Stage 1 →
Stage 2 → Stage 3 with each stage potentially revising the prior),
the **stages themselves should be commit boundaries**, not just
the artifacts they produce.

The W1C flake-audit dispatch had:
- Stage 1: enumeration (commit point)
- Stage 2: prioritization (no commit; embedded in agent state)
- Stage 3: closure with self-correction (where ceiling hit)

When the ceiling hit mid-Stage-3, Stage 2 results existed only in
the agent's transcript. Team-lead reconstructed them from the
audit doc working-tree state and the partial Stage 3 commits.
Recovery worked but cost team-lead attention.

#### Concrete instance at v1.49.638

W1C dispatch could have been pre-planned with:
- Stage 1 → COMMIT (audit doc with enumeration)
- Stage 2 → COMMIT (audit doc with prioritization + flagged-file list)
- Stage 3 → COMMIT (audit doc closure + fixes applied)

That would give 3 internal commit boundaries inside one dispatch.
A ceiling hit at any point preserves work-so-far with full state
reconstructible from the commit log + working tree.

#### How to apply

For future sub-agent dispatch templates:

- When a dispatch includes self-correction or iterative stages,
  pre-plan ≥2 commit boundaries inside the dispatch (not just
  start/end)
- The commit subjects should encode the stage: `audit(stage-1):
  ...`, `audit(stage-2): ...`, `audit(stage-3): ...`
- The dispatch brief should include the "ceiling-hit recovery"
  pattern explicitly: "if you hit the ceiling, work-so-far is
  preserved in commits; team-lead can redispatch from the last
  commit"
- Estimate per-stage tool-use budget; if any single stage > 30
  tool uses, sub-divide it into commit-boundaried sub-stages

---

## Forward-tracker entries (for `.planning/RETROSPECTIVE-TRACKER.md`)

| Lesson | Status | Next-Action-When |
|---|---|---|
| #10197 — Substrate-probe extends to runtime-environment substrate | OPEN | mission spec template + dispatch brief template update |
| #10198 — Audit-method grep false positives | OPEN | `docs/test-discipline/audit-method-corrections.md` authoring at v1.49.639 |
| #10199 — Failed-CI iteration produces substrate | OPEN | component disposition template update (re-attempt budget field) |
| #10200 — Sub-agent dispatches need ≥2 internal commit boundaries | OPEN | sub-agent dispatch template update at v1.49.639 |
