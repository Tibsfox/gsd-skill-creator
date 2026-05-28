> Following v1.49.846 — _Auto-emit-from-substrate: predict-low-confidence event JSONL wired into both production emit-prediction call sites_, v1.49.847 is the **next codify ship per #10428 meta-cadence** (7 ships past last codify at v840). Promotes **5 tentative observations to ESTABLISHED lessons**: **#10438** (verify axis as a first-class numbered lesson) + **#10439** (CLI manual + substrate auto-emit duality as the calibrate-axis completeness criterion) + **#10440** (production-caller scope-reduction via path-narrowing) + **#10441** (DI-executor + tokenized-argv wire shape for ProcessContext) + **#10442** (re-throw ProcessContextDenied from CLI swallow-catch). Extends 4 existing disciplines (Meta-cadence × 2, Architecture-retrofit patterns × 1, Security chokepoints × 1, Failure-mode contracts × 1); no new manifest domains.

# v1.49.847 — Codification Ship: Promote #10438 + #10439 + #10440 + #10441 + #10442

**Shipped:** 2026-05-28

First codify ship after the v841–846 operational-debt + substrate-wire cluster. Codification ship per #10428 meta-cadence — 7 ships past last codify (v840), within the 7-10 ship floor. Promotes the full eligible backlog (5 candidates that reached threshold per #10426 cross-class registry extraction rule), extending 4 existing disciplines rather than introducing new domains.

## What shipped

- **MODIFIED** `docs/meta-cadence-discipline.md` — adds two new top-level sections before the Cross-references list:
  - `## Lesson #10438 — Verify axis: prove-the-wire-works as a first-class axis` with v829 + v832 evidence base, two-instance promotion rationale, how-to-apply recipe, anti-patterns, and cross-references to #10428 / #10435 / #10422.
  - `## Lesson #10439 — CLI manual + substrate auto-emit duality (calibrate-axis completeness rule)` with the v803 token-budget + v845/v846 predict-low-confidence two-instance evidence table, three-ship-per-threshold plan, default-polarity-mirror rule, anti-patterns, and cross-references to #10428 / #10437 / #10427.
- **MODIFIED** `docs/architecture-retrofit-patterns.md` — adds a new `### Production-caller scope-reduction via path-narrowing (Lesson #10440)` subsection under "## Discipline patterns" with v845 + v846 evidence, recognition-smell guidance, anti-pattern, and cross-references. Appends #10440 to the Lesson references list.
- **MODIFIED** `docs/security-chokepoints.md` — adds a new `## DI-executor + tokenized-argv wire shape (Lesson #10441)` section after the existing #10433 internal-helper section, with the 5-structural-properties shape, v825 + v843 three-instance evidence table, when-to-use-which guidance, anti-patterns, and cross-references. Appends #10441 to the cross-references list.
- **MODIFIED** `docs/failure-mode-contracts.md` — adds a new `## Re-throw ProcessContextDenied from CLI swallow-catch (Lesson #10442)` section after the existing #10437 section, with code template, v820 + v842 two-instance evidence, hoist-or-re-throw recipe, anti-patterns, and cross-references. Appends #10442 to the Lesson reference list.
- **MODIFIED** `tools/render-claude-md/disciplines.json`:
  - **Meta-cadence** entry: append `#10438`, `#10439` to key_lessons (`#10428` → `#10428, #10438, #10439`); extend summary with both new lessons; append v1.49.847 codification record to codified_at_milestone.
  - **Architecture-retrofit patterns** entry: append `#10440` to key_lessons; extend summary with the path-narrowing rule; append v1.49.847 codification record.
  - **Security chokepoints** entry: append `#10441` to key_lessons; extend summary with the DI-executor + tokenized-argv shape; append v1.49.847 codification record.
  - **Failure-mode contracts** entry: append `#10442` to key_lessons; extend summary with the ProcessContextDenied re-throw rule; append v1.49.847 codification record.
- **MODIFIED** `CLAUDE.md` — regenerated via `npm run render:claude-md`. Operative-disciplines section now references all 5 new lesson IDs in their respective domain entries.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| (no new tests) | 0 | Documentation + manifest + regenerated section only |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **65 consecutive ships at 1.178**; was 64 entering this ship — new widest pressure margin record).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23 → 23** (UNCHANGED — extensions to 4 existing entries, not new domains).
Total lessons referenced in manifest: **78 → 83** (+5: #10438, #10439, #10440, #10441, #10442; unique count per `tools/check-discipline-coverage.mjs` manifestIndex).
Open lesson candidate backlog: **5 → 0** (full eligible backlog cleared).
Tentative observations carried forward: ~7-9 (was ~12-14 at v846; 5 promoted).
Wired calibratable thresholds: **5 of 7** (UNCHANGED).
KNOWN_UNWIRED Process: **16** (UNCHANGED). Egress: **11** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED — new lessons emit here for the first time this ship; UNCODIFIED tracking requires 2+ retrospective emissions).

## Promotions in detail

### #10438 — Verify axis: prove-the-wire-works as a first-class axis

**Evidence (2 instances; both cross-rootdir integration tests):**

- **v1.49.829** — `tests/integration/college-observation-bridge-wire.integration.test.ts`. Exercises the cross-rootdir ObservationBridge ↔ translateSessionEvent wire end-to-end.
- **v1.49.832** — `tests/integration/copper-rosetta-fallback-wire.integration.test.ts`. Exercises the ConceptFallbackProvider selector wire from src/ → .college/.

Both are cross-rootdir wires of different shapes (observation-bridge vs fallback-provider). The contrast across two unrelated wires was the load-bearing evidence: this isn't "integration tests for cross-rootdir code" but "a distinct ship-shape that adds proof, not new substrate."

**Codification target:** future substrate ships whose retrospectives flag "no integration test yet" as a known gap. The verify ship is the named follow-up at the `≥10 ships since first non-test caller` trigger.

**Cross-references:** #10428 (parent — meta-cadence axes; verify is the fourth), #10435 (the test-coverage gap that v829 + v832 closed), #10422 (shelfware verdict patterns — production-side validation complement).

### #10439 — CLI manual + substrate auto-emit duality (calibrate-axis completeness rule)

**Evidence (2 instances; full 3-ship pattern per threshold):**

| Threshold | Read-side wire | CLI manual recorder | Substrate auto-recorder |
|---|---|---|---|
| `token_budget.warn_at_percent` | v1.49.798 + v801 | v1.49.803 | v1.49.803 (`/sc:status` Step 4.6) |
| `predictive.low_confidence_threshold` | v1.49.837 | v1.49.845 | v1.49.846 |

The calibrate axis (#10428) defines "wired threshold" but did NOT specify what "complete wire" means at the write-caller side. v803 instantiated the answer implicitly (CLI + auto-recorder both shipped in the same milestone); v845/v846 made the 3-ship pattern explicit (observation source → CLI → substrate auto-emit). #10439 codifies the answer as a discipline.

**Codification target:** any future calibratable-threshold ship that registers a read-side observation source. Within 6 ships (per #10428 consume-axis cadence), both write callers SHOULD have shipped.

**Cross-references:** #10428 (parent — calibrate axis completeness), #10437 (subscriber-gated hook shape used by v846's auto-emit), #10427 (both write callers are accessory surfaces).

### #10440 — Production-caller scope-reduction via path-narrowing

**Evidence (2 instances):**

- **v1.49.845** — CLI calls `predictNextSkillsWithMeta + appendPredictiveLowConfidenceEvent` directly. The v837 forward-flag had named `ActivationSelector` + `PipelineActivationDispatch` as wire targets; the CLI bypassed both wrapper classes.
- **v1.49.846** — Substrate auto-emit lives inside the existing `emitPredictions` chain at the call site, calling `appendPredictiveLowConfidenceEvent` directly. No new wrapper class introduced.

Both ships demonstrate that the wrapper class named in a forward-flag is an integration concern, not a path concern. When the path is directly callable, the simpler scope is to call the path. The smell is a PR diff dominated by mock executors, lifecycle context constructors, or DI plumbing for a one-or-two-line path call.

**Codification target:** future "production caller" tasks where the forward-flag named a wrapper but the underlying path is directly callable.

**Cross-references:** #10422 (shelfware verdict — lightest-wire discipline at the caller surface), #10423 (lightest wire that satisfies the verdict — production-caller specialization), #10412 (recon-first — the path-vs-wrapper question is the recon question).

### #10441 — DI-executor + tokenized-argv wire shape for ProcessContext

**Evidence (3 instances):**

- **v1.49.825** — `src/git/core/repo-manager.ts`. First instance; established the shape.
- **v1.49.843** — `src/mesh/mesh-worktree.ts`. Second instance; mesh family.
- **v1.49.843** — `src/mesh/proxy-committer.ts`. Third instance; mesh family.

The DI-executor shape is a sub-class of #10433's internal-helper pattern. When a module exposes a factory with an optional injected executor for testability, the default executor IS the internal helper — `ctx?` closes over it once, the cmd string is tokenized to extract executable + argv, and `ensureProcessAllowed` runs before delegating. Injected executors are NOT wrapped (caller responsibility).

**Codification target:** future ProcessContext chips on files exposing a `*Executor` injection point. Examples in current KNOWN_UNWIRED: candidates with factory-and-executor structure.

**Cross-references:** #10433 (parent — internal-helper pattern), #10414 (optional `ctx?` parameter at the factory boundary), #10427 (failure-mode contracts — `ensureProcessAllowed` at the function root of the default executor).

### #10442 — Re-throw ProcessContextDenied from CLI swallow-catch

**Evidence (2 instances):**

- **v1.49.820** — `src/git/branch-manager.ts`. First CLI surface to apply the pattern.
- **v1.49.842** — `src/cli/commands/terminal.ts`. CLI catch absorbing for UX.

The #10427 rule requires load-bearing failures to propagate; a CLI catch that serializes ALL errors into JSON output defeats the rule for security denials. The minimum-cost fix is `if (err instanceof ProcessContextDenied) throw err;` as the first line of the catch block. Hoisting `ensureProcessAllowed` OUTSIDE the try block is preferred when structurally possible; the re-throw is for cases where the catch block wraps user-input → spawn-command translation.

**Codification target:** future CLI commands with a swallowing try/catch around a spawn that needs to propagate authorization-class failures.

**Cross-references:** #10427 (parent — load-bearing-fails-loudly rule), #10437 (sibling shape — different surface class, same parent contract), security-chokepoints (the `ensureProcessAllowed` placement guidance).

## Tentative observations carried forward (post-v847)

The eligible backlog cleared at v847 (5 of 5 promoted). Carried-forward observations now consist entirely of below-threshold candidates:

| Observation | Source | Instances | Notes |
|---|---|---|---|
| Fire-and-forget over awaited for observability writes | v846 | 1 | Caught by integration-test flake. Likely #10437 refinement when 2nd surfaces. |
| Canonical-doc-decision ship pattern | v844 | 1 | Wait for 2nd. |
| Recent-vs-baseline-recent comparison pattern | v841 | 1 | Wait for 2nd. |
| Drift-check noise as scoring-system feedback loop | v841 | 1 | Wait for 2nd. |
| Codify-ship-as-recon-consolidator pattern | v840 | 1 | Wait for 2nd. |
| Deferral-by-classification-ambiguity | v840 | 1 | Wait for 2nd. |
| Auto-run-on-import as bootstrap-time tax | v836 | 1 | Wait for 2nd. |
| Polarity convention for inverted-mechanic thresholds | v837 | 1 | Wait for 2nd. |
| Bidirectional enforcement completeness | v838 + v836 | 1-2 (ambiguous) | DEFERRED v840 per classification ambiguity; UNCHANGED v847. |

NEW this ship (1 below-threshold observation):

| Observation | Source | Notes |
|---|---|---|
| Full-backlog-clear codify ship | v847 (THIS SHIP) | 1 instance. When the eligible backlog has 5 candidates and the operator decides to promote all 5 in one ship — vs the typical 2-3 — the ship is larger but the post-ship cognitive surface is smaller. Wait for 2nd instance to disambiguate from "this was just the right time" vs "a recurring shape under specific conditions." |

## Sustained ESTABLISHED (instance-count refinements only)

- **#10433 LOC-band-by-callsite-count refinement** — still 7+ instances (UNCHANGED; v847 is a doc-only ship).
- **#10437 subscriber-gated observability** — REINFORCED by the v846 PAIR co-location instance; doc text unchanged.

## What this ship is not

- Not a NASA degree advance (still 1.178; now 65 consecutive ships at 1.178).
- Not a chokepoint chip (KNOWN_UNWIRED Process + Egress unchanged).
- Not a new discipline domain (manifest stays at 23 entries — extensions to existing entries only).
- Not a runtime test of any promoted lesson (they're already EXERCISED in their source ships; the codification is the post-hoc framing).

## Verification

- `python3 -c "import json; json.load(open('tools/render-claude-md/disciplines.json'))"` → JSON OK.
- `npm run render:claude-md` → CLAUDE.md updated cleanly; all 5 new lessons render in their respective domain entries.
- `node tools/check-discipline-coverage.mjs` → 23 manifest entries / 83 lessons.
- Pre-tag-gate (full): expected 17/17 PASS (step 13 within-ceiling 39 ≤ 41 PASS).

## Forward path post-v847

1. **NASA 1.179 forward-cadence** — STRONG-DEFAULT (65 consecutive ships at 1.178 after this ship; widest pressure margin record). The codify cadence is now reset; next codify ship expected at ~v854-857.
2. **Continued ProcessContext singleton chips** — ~14 remaining singletons.
3. **Help text expansion in `src/cli/help.ts`** — add `predict-next` + other recent commands.
4. **Verify ship for v843 mesh family** — becomes verify-overdue at ~v853 per #10438's trigger.
5. **T2.1 v1.50 unblock-or-archive decision** (operator-bounded).
