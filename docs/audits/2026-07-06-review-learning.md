# Code Review — Adaptive-Learning Pipeline (Dimension A: learning)

Date: 2026-07-06
Reviewer: senior code reviewer (read-only pass)
Scope: `src/learn/`, `src/bounded-learning/`, `src/skill-promotion/`, `src/detection/`,
`src/activation/`, `src/observation/`, `src/eligibility/` — the observe→detect→suggest→promote
loop, dedup/merge, HITL gating, sanitizer, bounded-learning guardrails.

This review covers CODE and SYSTEM behavior. Content-level findings (skill/agent/team/cartridge
authoring) were already handled in `docs/audits/2026-07-06-artifact-ecosystem-review.md` and are
not repeated here.

## Summary

The learning surface splits into two largely independent subsystems that the assignment lumps
together:

1. **`sc:learn` (MFE knowledge ingestion)** — `src/learn/*` + `src/commands/sc-learn.ts` +
   `src/scan-arxiv/*`. Acquire → sanitize → HITL → analyze → extract → wire → dedup → merge →
   generate → report, operating on `MathematicalPrimitive`s.
2. **Skill-suggestion + promotion loop** — `src/observation/*` (session capture) →
   `src/detection/*` (pattern → candidate → suggestion) → `sc:suggest` accept path.
   `src/bounded-learning/*` and `src/skill-promotion/*` supply the *intended* guardrails.

The individual modules are well-structured, defensively coded, and heavily unit-tested. The
health problem is **wiring, not correctness-in-the-small**: several of the most safety-relevant
and value-relevant components are built and tested but never invoked from any production
entrypoint. Specifically — dedup is inert in the two primary `sc:learn` entrypoints; generated
artifacts and changesets are never persisted by those entrypoints; the STRANGER auto-approve path
waves critical hygiene findings through; and the Two-Gate guardrail, the ROI promotion gate, and
the entire observation→deterministic-script promotion loop have **zero production callers**. The
headline risks below are all "the guardrail exists and is documented as load-bearing, but nothing
calls it."

## Findings

### LEARN-1 (HIGH, gap) — Dedup/merge is inert in both primary `sc:learn` entrypoints

**Location:** `src/commands/sc-learn.ts:84` (`existingPrimitives = options.existingPrimitives ?? []`),
consumed at `:231-254`; `src/scan-arxiv/bridge.ts:261` (`ingestQueue` → `scLearn` with no registry).

**Problem:** `scLearn()` only dedups against `options.existingPrimitives`. The CLI `main()`
(`sc-learn.ts:391-497`) builds its options purely from argv and **never loads the existing
primitive registry**, so `existingPrimitives` is always `[]`. The arxiv auto-ingestion path
(`ingestQueue`, `bridge.ts:261`) likewise passes no registry. With an empty registry the
pre-filter always returns `flagged=false`, the semantic comparator never runs, and `merge()` is
called with `(candidate, null, null)` → everything is classified `add-new`. The entire
dedup/merge/semantic-comparator stack (dedup-prefilter, semantic-comparator, merge-engine) is
dead code on these two paths; only the manual harness `tools/ingest-aggregate.mts:116` wires a
real accumulator — and even that seeds an empty in-memory accumulator per run (no cross-run load
of the persisted `primitives.json`), so re-ingesting the same source re-adds everything.

**Recommendation:** Load the persisted registry (the `primitives.json` that `ingest-aggregate`
writes, or `src/utils/validate-registry.ts`'s source) into `existingPrimitives` at the top of
`scLearn()` when the caller doesn't supply one, and have `ingest-aggregate` warm the accumulator
from the last persisted set. Alternatively, if `sc:learn` CLI is intentionally stateless, document
that only `ingest-aggregate` performs real dedup and make the CLI print a "dedup disabled (no
registry loaded)" notice so the reported "primitives added" count isn't misleading.

**Effort:** M **Verify:** `skill-creator learn <same-source>` twice with a shared registry file
should report `primitivesSkipped > 0` on the second run; today both runs report all-added.

### LEARN-2 (HIGH, gap) — `scLearn`/`ingestQueue` never persist generated artifacts or the changeset

**Location:** `src/commands/sc-learn.ts:264-358` (generate + return), `:348-351` (changeset only
returned, never applied); `src/scan-arxiv/bridge.ts:268-276` (`result.changeset` discarded).

**Problem:** Stage 7 calls `generateLearnedSkill/generateAgent/generateTeam`, which return
in-memory `{ fileName, content }` objects (`src/learn/generators/skill-generator.ts:276` — no
`writeFile` anywhere in the generators). `scLearn` reports `skillsGenerated`/`agentsGenerated`/
`teamsGenerated` counts but **writes nothing to disk**. The `Changeset` (the record that would be
applied to the registry) is returned and then dropped by every production caller: `main()` prints
counts and ignores `result.changeset`; `ingestQueue` records only `result.sessionId` into
seen-ids and discards the changeset. So `skill-creator learn` and `scan-arxiv --auto` are, in
effect, dry-run reporters — the log line "skills generated: 3" corresponds to zero files and zero
registry mutation. Only `tools/ingest-aggregate.mts:122,159-190` harvests, persists primitives,
and runs the generators to disk.

**Recommendation:** Either (a) apply the changeset + write generated artifacts inside a non-dry-run
`scLearn`, or (b) if application is deliberately deferred, add an explicit `apply-changeset`
step/command and make the CLI summary say "changeset staged (not applied)" rather than
"primitives added: N". At minimum `ingestQueue` should persist or forward `result.changeset`.

**Effort:** M **Verify:** After `skill-creator learn <src>` (non-dry-run), grep the output dir /
registry — today no new SKILL.md/primitive is written despite non-zero reported counts.

### LEARN-3 (MEDIUM, security) — Non-interactive approval waves through CRITICAL STRANGER findings; `report.passed` is dead

**Location:** `src/commands/sc-learn.ts:467-473` (`--yes` promptFn always returns
`approved-with-warnings`); `tools/ingest-batch.mts:49`, `tools/ingest-aggregate.mts:79`,
`tools/ingest-one.mts:57-59` (same); `src/learn/sanitizer.ts:429` (`passed = !hasCritical`, never
read); `src/learn/hitl-gate.ts:35-93` (gate never consults `report.passed`).

**Problem:** The sanitizer classifies prompt-injection, `<script>`, path-traversal, absolute
paths, null bytes, and directional-override chars as `critical`, and sets `report.passed=false`
when any critical is present. But `report.passed` is **never consulted anywhere** (grep confirms
zero readers). The only enforcement is the human HITL prompt — and every non-interactive caller
stubs the prompt to return `'approved-with-warnings'` unconditionally, regardless of severity.
`hitlGate` then sets `proceed = response !== 'rejected'`, so `skill-creator learn <url> --yes`
(and the entire arxiv auto-ingestion path) proceeds past critical hygiene findings. This
contradicts the module's own documented Three Laws ("STRANGER content NEVER auto-approved";
"critical → review required"). Blast radius is currently contained because downstream extraction
is text-only and skill generation is separately scanned by `generation-safety`, but the documented
STRANGER safety invariant is defeated by design.

**Recommendation:** Make the auto-approve promptFns severity-aware: return `'rejected'` (or a new
`'blocked'`) when `report` contains any `critical` finding, and only auto-approve when the worst
severity is `warning`. Better: gate on `report.passed` in `hitlGate` before prompting — a STRANGER
report with criticals should hard-fail unless an explicit `--force-critical` flag is set. Rename
the flag semantics so "with warnings" doesn't silently mean "with criticals too."

**Effort:** S **Verify:** Feed a fixture containing `ignore all previous instructions` /
`<script>` from a STRANGER source with `--yes`; today it proceeds, after the fix it should reject.

### LEARN-4 (MEDIUM, gap) — Two-Gate guardrail has zero production callers; the accept path applies no bounded-learning gate

**Location:** `src/bounded-learning/two-gate/gate.ts:42` (`evaluateTwoGate`); consumers: none
outside `two-gate/__tests__`. Accept path: `src/detection/suggestion-manager.ts:90-111`.

**Problem:** `evaluateTwoGate` is the mathematically-grounded capacity/tau gate that
`gsdCapRealization()` (`gate.ts:111`) explicitly maps to "the 20% content-change cap, 3-correction
minimum, 7-day cooldown" — i.e. the documented core learning guardrail. It is a pure, default-off
function with **no non-test caller**. The actual skill-accept path (`SuggestionManager.accept`)
generates the skill and transitions state with no capacity check, no correction-count check, and
no cooldown — none of the guardrails the docs claim bound the self-modifying loop. The guardrail
is real, tested, and inert.

**Recommendation:** Wire `evaluateTwoGate` into `SuggestionManager.accept` (or the layer above it)
so acceptance is gated on the capacity cap and validation-gap tau, and persist the
`TwoGateLogRecord` for audit. If the gate is intentionally advisory-only for now, say so in
`bounded-learning/index.ts` and in the security-hygiene skill so reviewers don't assume it runs.

**Effort:** M **Verify:** Accept a candidate whose `proposedCapacity` exceeds `K[m]`; today it
succeeds unconditionally.

### LEARN-5 (MEDIUM, gap) — skill-promotion ROI gate (`shouldInstall`/`computeROI`) has no production callsite

**Location:** `src/skill-promotion/promotion-roi.ts` (`computeROI`, `shouldInstall`); only caller
is `src/ab-harness/bo-autotune.ts:252` (a tuning harness). `src/skill-promotion/index.ts:8-12`
comments claim "JP-005 (Wave 2 / phase 835) wires the real ROI comparator and the first callsite."

**Problem:** The promised first callsite never landed. `shouldInstall` — the ROI(skill)>0 install
decision — is invoked only by the Bayesian auto-tuner, not by any real promotion/accept decision.
The self-documented intent (ROI-gated installation) is unrealized.

**Recommendation:** Either wire `shouldInstall` into the accept/promotion decision (natural pairing
with LEARN-4's Two-Gate) or update the index docstring to reflect that the ROI gate remains
harness-only.

**Effort:** M **Verify:** Grep for `shouldInstall(` — only the harness matches today.

### LEARN-6 (MEDIUM, gap) — observation→deterministic-script promotion loop is fully unwired

**Location:** `src/observation/promotion-detector.ts`, `script-generator.ts`,
`promotion-gatekeeper.ts`, `drift-monitor.ts`; exported from `src/observation/index.ts:14-19` but
imported by nothing outside `observation/` and its tests. Session hooks
(`src/hooks/session-end.ts:111`, `session-start.ts:85`) only construct `SessionObserver`.

**Problem:** A substantial, tested pipeline — detect a repeated deterministic tool sequence →
generate a script → gatekeeper approval → drift monitoring/demotion — has no driver. No CLI
command and no hook invokes `PromotionDetector`/`PromotionGatekeeper`/`DriftMonitor`, so the
observe→promote-to-script capability is unreachable in production. This is the most valuable
"automation from observed behavior" feature in the codebase and it is dark.

**Recommendation:** Add a `promote`/`observe promote` CLI (or fold it into `session-end`) that
runs detector → gatekeeper on the accumulated executions and surfaces candidate scripts for HITL,
or explicitly mark the module dormant with a resume trigger (mirroring the D2/D3 dormant-team
pattern already used in this repo).

**Effort:** L **Verify:** `grep -rn "new PromotionGatekeeper\|new PromotionDetector" src --include=*.ts | grep -v test`
returns nothing today.

### LEARN-7 (MEDIUM, correctness) — Overlapping-distinct candidates are silently dropped; conflict-resolution HITL is never invoked

**Location:** `src/commands/sc-learn.ts:236-262` (merge loop); `src/learn/merge-engine.ts:214-242`
(`conflict` action → empty `modifications`, pushes to `pendingConflicts`); `getPendingConflicts()`
/ `resolveConflict()` never called by `scLearn`; `src/learn/report-generator.ts:64` counts it.

**Problem:** When the comparator classifies a pair `overlapping-distinct`, `merge()` returns
`action: 'conflict'` with **no modifications** and registers a pending conflict for user decision
(the module's documented "NEVER auto-merge; present conflict"). But `scLearn` only iterates
`mergeResult.modifications` (empty for conflicts) and **never calls `getPendingConflicts()` or
`resolveConflict()`**. So the candidate is neither added, skipped-with-record, nor resolved — it is
silently discarded, while the report still shows `conflictsPresented > 0`. The interactive
conflict-resolution path (`resolveConflict`, fully implemented) is dead in the CLI. A user reading
"Conflicts: 2" has no way to act on them and has silently lost 2 primitives.

**Recommendation:** After the merge loop, drain `mergeEngine.getPendingConflicts()` and either
prompt (interactive) or apply a documented default (e.g. `keep-both` when `--yes`) via
`resolveConflict`, then record the resulting modifications to the changeset. At minimum, surface
the pending conflicts in the report with their IDs so they aren't a silent drop.

**Effort:** M **Verify:** Ingest two overlapping-distinct primitives against a seeded registry;
today they vanish with only a count bump and no changeset entry.

### LEARN-8 (LOW-MEDIUM, bug) — `findCoOccurringTools` ignores the command and returns global tools

**Location:** `src/detection/pattern-analyzer.ts:249-257`.

**Problem:** `findCoOccurringTools(cmd, freq)` never uses `cmd`; it returns the first 5 non-common
tools seen *anywhere* in the corpus. The real command↔file co-occurrence is tracked in
`freq.coOccurrences` (`:116-121`) but tool co-occurrence is not, and this function doesn't consult
it. As a result `evidence.coOccurringTools` on every command candidate is the same misleading
global list, not tools that actually accompanied that command. This weakens the evidence that a
reviewer uses to accept/dismiss a suggestion.

**Recommendation:** Track per-command tool co-occurrence (extend `coOccurrences` to hold tools, or
add a parallel map) and have `findCoOccurringTools` read it; or drop `coOccurringTools` from the
evidence if it can't be computed truthfully.

**Effort:** S **Verify:** Two commands with disjoint tool usage currently report identical
`coOccurringTools`.

### LEARN-9 (LOW, gap) — Pattern analyzer never extracts file or workflow/sequence candidates

**Location:** `src/detection/pattern-analyzer.ts:174-201` (`extractCandidates` iterates only
`freq.commands` and `freq.tools`).

**Problem:** The `SkillCandidate` type and `freq.files` support `file` and `workflow` types, and
co-occurrence data is collected, but `extractCandidates` only ever emits `command` and `tool`
candidates. Multi-step workflow/sequence detection — arguably the highest-value skill class and
the thing that justifies collecting co-occurrences — is not implemented. The loop's
`coOccurringFiles` is the only downstream use of all that co-occurrence bookkeeping.

**Recommendation:** Add sequence/co-occurrence candidate extraction (e.g. frequent command+tool or
command+file clusters above threshold → `workflow` candidate). If out of scope, prune the unused
co-occurrence bookkeeping to reduce dead machinery.

**Effort:** M **Verify:** A corpus with a strong repeated 3-tool sequence produces no `workflow`
candidate today.

### LEARN-10 (LOW, correctness) — Dedup pre-filter AND-logic can silently miss true duplicates

**Location:** `src/learn/dedup-prefilter.ts:75-101` (`distance <= maxDistance` **AND**
`sharedKeywords >= minSharedKeywords`, defaults 0.2 / 2).

**Problem:** A genuine duplicate whose plane position drifted >0.2 or that shares fewer than 2
keywords (paraphrased keywords, synonyms) is dropped by the pre-filter, never reaches the semantic
comparator, and is added as new. High precision, but the recall gap is silent — there is no
secondary check and the resulting duplicate is indistinguishable from a legitimately-new
primitive. This compounds LEARN-1 in the aggregate path where dedup *does* run.

**Recommendation:** Make the two conditions OR-with-tighter-thresholds, or add a cheap
formal-statement-similarity fallback for near-miss pairs; log pre-filter rejections at a debug
tier so recall can be audited on real corpora.

**Effort:** M **Verify:** Two keyword-disjoint paraphrases of the same theorem are both added.

### LEARN-11 (LOW, correctness) — Candidate id truncation can collide distinct patterns

**Location:** `src/detection/pattern-analyzer.ts:235` (`id = ${type.slice(0,3)}-${slugify(pattern)}`)
+ `:332-338` (`slugify` truncates to 30 chars).

**Problem:** Two distinct patterns sharing a 30-char slug prefix produce the same candidate id.
Downstream dedup in `SuggestionStore.addCandidates`/`isAddressed` keys on `candidate.id`, so one
of the two is silently dropped or wrongly treated as already-addressed. Low probability, but a
correctness hazard with no guard.

**Recommendation:** Include a short content hash suffix in the id, or don't truncate the slug used
for identity (truncate only the display name).

**Effort:** S **Verify:** Two 40-char patterns identical in the first 30 chars collapse to one
suggestion.

## New-function / capability opportunities

- **Registry-backed dedup for the CLI (fixes LEARN-1/2).** A single `loadRegistry()` +
  `applyChangeset()` pair would turn `sc:learn` from a reporter into a real ingest and light up the
  already-built dedup/merge stack on the primary path.
- **Severity-aware auto-approval (fixes LEARN-3).** A tiny `worstSeverity(report)` helper shared by
  all auto-approve promptFns, plus honoring `report.passed`, restores the STRANGER invariant with
  ~10 lines.
- **Unify the three guardrails at the accept/promote boundary.** LEARN-4 (Two-Gate), LEARN-5 (ROI),
  and LEARN-6 (script promotion) all want the same missing hook: a single `evaluatePromotion(candidate)`
  chokepoint that runs Two-Gate → ROI → gatekeeper and records an audit log. This is the biggest
  coherence win available and would make the "bounded self-modifying system" claim true in code, not
  just in docs.
- **Workflow-sequence detection (LEARN-9).** The observation data already contains tool sequences
  (`ExecutionCapture`, `PromotionDetector`), and the pattern-analyzer already collects
  co-occurrences — bridging them would surface the highest-value skill class.
- **`src/eligibility/` is unwired.** `decay-kernels`, `replay`, `traces`, `api` have no production
  importer (grep confirms). It appears intended as the decay/replay substrate feeding promotion
  eligibility. Either wire it into the promotion decision or mark it dormant; as-is it is a fourth
  built-but-dark learning module.

## Notes

- **Well-built parts worth preserving:** `merge-engine` correctly enforces its documented safety
  invariant (only `resolveConflict` can produce `replace`; `merge` never does) and its provenance
  chain is clean. `changeset-manager` reverts in reverse order with a real graph-integrity check
  before removal. `SuggestionStore` uses same-dir atomic temp+rename with EXDEV-aware placement and
  best-effort cleanup. `SkillGenerator.createFromCandidate` *does* run `scanForDangerousCommands` +
  `sanitizeGeneratedContent` (`src/detection/skill-generator.ts:51-52`) before writing — the
  generation-safety guard is correctly wired even though the bounded-learning guards are not.
- **`sc:suggest` loop is genuinely wired** (`src/cli/commands/suggest.ts` → `SuggestionManager`;
  session capture via `src/hooks/session-end.ts`). The suggest half of the loop works; the
  *guardrail* and *promotion* halves are the gaps.
- Scope note: I did not deep-review the research/math surface (koopman, ricci, langevin, etc.).
  The one adjacent observation is `src/eligibility/` being unwired (above).
- Findings are static-analysis + grep-substantiated against source at the paths/lines cited; no
  tests were run in this pass.
