# 03 — Retrospective: v1.49.785 PROJECT.md Normalizer

## What went well

**Audit-to-ship continuity.** The session began with a multi-agent parallel audit (5 era agents covering ~120 CORE milestones across 5 thematic eras). The audit deliverable named Tier 1 strengthening levers with concrete recommended ships. v1.49.785 executed the smallest Tier 1 item (T1.4 + S5) directly from the audit recommendations, without re-deriving the wedge. Audit → ship in the same context window is a viable pattern when the audit deliverable is sized for handoff.

**Pattern mirroring kept the wedge small.** `tools/state-md-normalizer.mjs` (v1.49.783) was the immediate template. The new normalizer reuses the same CLI shape (`--check` / exit 0/1/2), the same test harness pattern (temp dir + `spawnSync`), and the same pre-tag-gate WARN-only step shape (matching story-drift and discipline-coverage from v1.49.653). Total normalizer code: 271 lines vs state-md-normalizer's 568 — half the size because PROJECT.md is prose-heavy and we deliberately scoped out auto-rewrite.

**Lesson #10416 (tolerant generators / \\Z-pitfall) was applied prophylactically.** When drafting the GAP-table section parser, the first attempt used `(?=^## |\\Z)/m` — the exact JS-regex \\Z-as-literal-Z bug that v1.49.783 fixed in state-md-normalizer. Caught it in the first run before any test fixtures were authored. Replaced with a `stripSection()` helper that walks lines until next H2 or EOF. T10 in the test suite locks in the fix.

**Test harness bug surfaced fast.** First test run showed 3 failures — all on assertions of stderr content. Root cause: the test helper hardcoded `stderr: ''` on exit 0 (mirroring state-md-normalizer's helper, which only catches stderr on the failure path). Fix: switched from `execSync` to `spawnSync` which surfaces both streams regardless of exit code. ~3 min lost. The state-md-normalizer test suite would benefit from the same fix but isn't currently testing exit-0-with-WARN-output cases.

## What surprised us

**The "Latest shipped release" semantics were not what the first-cut normalizer assumed.** Initial check: `docVersion === packageVersion`. Wrong — during T14 ship sequencing, package.json is bumped to N BEFORE pre-tag-gate runs, and PROJECT.md correctly references (N-1) as the last actually-shipped version. Fix: accept either `docVersion === packageVersion` (steady-state, no in-flight ship) OR `docVersion === packageVersion - 1` (mid-T14). T3b + T3c test cases lock in both states.

**The GAP-status enum needed permissiveness.** Initial enum: {CLOSED, IN PROGRESS, Open, N/A}. PROJECT.md actually uses "ADDRESSED" (GAP-1 historical) and "Intentional design" (GAP-3, an explanation rather than a status). Adding them to the enum was cheaper than normalizing PROJECT.md prose. The normalizer's role is to surface typos and unrecognized states, not enforce uniform vocabulary.

## What we'd do differently

**Bundle the gate-name vocabulary update with the step addition.** The pre-tag-gate's `step-name vocabulary:` comment list, the `step names:` log line, and the `exit codes` enum each got separate edits. A `--list-steps` self-documentation subcommand on `tools/pre-tag-gate.sh` would let future step additions edit one source-of-truth declaration.

**The "/N" denominator in step display text is inconsistent across the file.** Step 12 says "step 12/15", step 16 says "step 16/16", new step 17 says "step 17/17". Each step was added at a different "current total" point. A pass to normalize all to the current total is a tiny ship-fragment for a future codification milestone.

## Forward lessons / candidates

- **#10417 candidate (L785-1)** — When mirroring a previous pattern's test harness, audit the helper's stderr-capture semantics before reusing it. `execSync` catches stderr only on failure path; `spawnSync` captures both regardless. The bug compounds when the script under test emits WARN messages on exit 0 — a class of behavior that's increasingly common in WARN-only gates.

## What this ship validates

- **The audit-driven counter-cadence ship pattern.** A multi-agent audit produces a tiered backlog; the smallest item is executed in the same session. The audit deliverable is gitignored (working-tree only); the ship deliverable is the tool + tests + gate integration. Both artifacts persist; the audit informs the ship without being a dependency of it.
- **The "convert prose-drift social rule to deterministic gate" discipline (v585 → v784) extends to PROJECT.md.** STATE.md was first (v783), PROJECT.md is second. Pattern is now applicable to any structured-prose artifact that must mirror ground truth.

## What this ship escalates

- **NASA forward-cadence engine-state advance.** Now 9 consecutive ships at NASA 1.177 (v777-v785). The plateau accumulates audit + counter-cadence + architecture work; each non-advance is justifiable in isolation, but the aggregate is visibly overdue. Next ship recommendation: NASA 1.178 IBEX (per handoff Path A) before continuing Tier 1.
