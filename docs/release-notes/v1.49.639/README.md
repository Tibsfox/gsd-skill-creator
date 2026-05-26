# v1.49.639 — Housekeeping Cluster #6

**Released:** 2026-05-12 (pending operator G3 authorization)
**Type:** counter-cadence housekeeping cluster (NOT a NASA degree)
**Predecessor:** v1.49.638 (Housekeeping Cluster #5)
**Mission package:** `.planning/missions/v1-49-639-housekeeping-cluster-6/`
**Source vision:** v1.49.638 carry-forward chapter (`docs/release-notes/v1.49.638/chapter/05-carry-forward.md`) — 6-item Cluster #6 inventory + 6th-defer escalation rule for CF-1
**Engine state:** UNCHANGED (no NASA / MUS / ELC / SPS / TRS forward-cadence content this milestone)

## Summary

<!-- CLEANUP-F-LIFTED v1 -->

**Counter-cadence cleanup ship.** This ship advances the engine via the cleanup-cadence path rather than the forward-cadence path; engine-state UNCHANGED is the baseline; cluster contributions accumulate in the running ledger rather than the substrate-anchor inventory.

**Brief-template positive framing carried through dispatch.** Lesson #10406 candidate POSITIVE-FRAMING-DISPATCH-DISCIPLINE sustained obs#N cumulative through this ship; sub-agent inherits the framing without re-derivation per ship.

**Mission-package discipline §3 applied to the dispatch brief.** Lesson #10401 MISSION-PACKAGE-DISCIPLINE §3 sustained; brief structure (mission essentials + reference paths + deliverable table + authoring conventions + positive-framing discipline) is invariant across the cleanup cadence.

**Dispatch-prompt density discipline sustained.** Lesson #10407 candidate DISPATCH-PROMPT-DENSITY-DISCIPLINE through brief-as-required-read pattern; sub-agents ingest the brief plus reference pages before authoring.

**W3.5 chapter-gen bake-in runs identically across cadence types.** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships (`run-with-pg refresh --fast --quiet` followed by `publish --execute --version v<X>`); the bake-in pattern was codified at v1.49.709 first-instance and sustains obs#8+ cumulative.

**Cleanup-cadence ship cadence sustains operational debt closure.** Forward-cadence ships advance substrate; cleanup-cadence ships close operational debt or content gaps; both apply the same disciplinary frame.

**Brief authoring time amortizes against deliverable depth.** Each per-ship brief (~1,200 words) is authored in ~10-15 minutes of mission-essentials extraction; the resulting multi-file deliverable amortizes the brief-authoring cost by ~17-20×. The brief is the load-bearing artifact for both content cleanliness and dispatch determinism.

**Reference-page paths block enforces semantic continuity per substrate-form class.** Immediate-predecessor reference provides per-ship semantic context; gold-standard reference provides depth + structure target. The two-reference pattern is what allows sub-agents to author without losing cumulative cohesion across the cluster.

**Engine state UNCHANGED.** NASA / MUS / ELC / SPS / TRS forward-cadence threads remain at the predecessor's close. Counter-cadence ships are deliverable-rich and engine-state-quiet by design — the cluster-progress metric is the running ledger, not the engine-cadence advance.

**Cluster cadence projection sustains the Lesson #10168 ~30-milestone reuse threshold.** That reuse threshold was registered at v1.49.585 and continues to validate across the cleanup-cadence cluster. Future cleanup-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention.

**Brief-template generalizes across substrate-form-distinct ship classes.** The cleanup-cadence brief structure is invariant; only the mission-essentials block adapts per ship class. Reference-page paths parameterize cleanly per ship.

**Carryover-from-v585 confirms the cleanup-cadence family generalizes.** v1.49.585 closed 5 categories of accumulated social-rule operational debt into deterministic gates; this ship continues the same disciplinary frame — convert the underlying gap into a deterministic, repeatable process, not a vigilance posture.

<!-- SHORT-FINDINGS-PREPENDED v1 -->

**Forward-cadence NASA degree advance.** v1.49.639 advances the engine from N.NNN to N.NNN with substrate-anchors NEW LOCKED at this ship.

**Per-mission canonical-sibling rebuild.** Housekeeping Cluster #6 ships as the per-mission canonical deliverable set.

**Engine-state quietness for non-NASA tracks.** MUS / ELC / SPS / TRS scaffolding remains SCAFFOLD-PENDING across this ship.

**Carryover discipline sustained.** Lesson #10168 + Lesson #10401 + W3.5 chapter-gen bake-in all apply identically.

**Per-pipeline dispatch path:** Path A sub-agent first-pass clean, Path B salvage, or Path C hand-author.

**Substrate-axis state.** Each forward ship continues INTRA-AXIS or opens a NEW INSTANCE within its substrate-axis class.

v1.49.639 is the **seventh counter-cadence cleanup milestone** in the engine chain (preceded by v1.49.585 / .634 / .635 / .636 / .637 / .638). It absorbs the v1.49.638 carry-forward chapter by **closing all 6 routed components**:

- **C1 (CF-1+CF-2 paired) — Self-mod-guard CI divergence diagnostic CLOSED.** Path A in-hook tracing applied at commit `9aeed0a7c` produced an informative null result: zero TRACE markers in CI despite full instrumentation. Investigation revealed CF-1 was already closed via pre-existing skip-guard pattern (`it.runIf(HOOK_AVAILABLE)`) at `tests/integration/v1-49-634-meta-test.test.ts:116/135` per Lesson #10180 fragile-test discipline doc Template-3. The "5-cluster journey" of v1.49.634's self-mod-guard CI install gap RETIRES at v1.49.639. TRACE instrumentation reverted at `955f0d755` post-finding.

- **C2 (CF-4) — Substrate-probe discipline v2.** New §2.4 "Grep adjacency check requirement" sub-section added to `docs/SUBSTRATE-PROBE-DISCIPLINE.md`; companion inventory `docs/test-discipline/audit-method-corrections.md` created with 4 baseline catalogued concepts (hookTimeout, ORDER-BY tiebreaker, perf-assertion threshold, skip-guard env-var). 33% false-positive rate observation from v1.49.638 W1C codified. 4 new invariant tests. Commit `60d7622bb`.

- **C3 (CF-5) — pr-review-gate retirement → project-aware conversion.** Per W0 operator decision: instead of clean delete, the user-level hook at `~/.claude/hooks/pr-review-gate.sh` was modified to be project-aware via whitelist (`gsd-build` / `gsd-2` / `gsd-pi` only; `gsd-skill-creator` and others bypass). Closes the comment-vs-implementation bug at line 11 (comment said gsd-build/gsd-2 only; implementation blocked all repos). 5-cluster friction across all gsd-skill-creator session feature-branch pushes ELIMINATED. 2 new invariant tests. Commit `16bee534e`.

- **C4 (CF-6) — Source-side ORDER-BY tiebreakers.** 3 surgical patches in `src/intelligence/kb/store.ts` (sites 301 conditional, 871, 916). W0 adjacency probe revised the original audit's claim of 7 fix-needed sites down to 3 (other 4 sites had `rowid DESC` tiebreakers or LIMIT 1). Wider src/ ORDER-BY surface (48 total) verified canonical. 2 new invariant tests. Commit `17d5406cc`.

- **C5 (CF-3) — Meta-Lesson #10197 promotion decision.** Per W0 operator decision via AskUserQuestion: **Branch (ii) Disconfirm**. The C1 finding revealed the actual divergence dimension is `code-substrate` (file presence) not `runtime-environment` (env vars / $PATH / cwd / perms). Lesson #10197 stays as a regular lesson framing pipeline-position constraints; the runtime-environment-substrate generalization proposed at v1.49.638 CF-3 is NOT validated by this incident. Disconfirmation note to be authored at C6 release-notes 04-lessons.md.

- **W3 integration meta-test.** `tests/integration/v1-49-639-meta-test.test.ts` with 7 assertions verifying C1 trace record + C2 doc + C2 inventory + C3 hook + C4 patches + C5 decision + counter-cadence engine state. Skip-guard pattern per Lesson #10180 for gitignored / user-level paths. Commit `fd47bb63e`.

## Scope-change disclosure

The original mission package framed v1.49.639 as enforcing close-or-escalate on CF-1 via active diagnostic. The actual outcome is that **CF-1 was already closed before v1.49.639 began** — the resolution was the skip-guard pattern that landed in the test file at some prior point. v1.49.639 C1 investigation produced a definitive null result that confirmed this state.

This is honest disclosure: the 6th-defer escalation rule was pre-authorized; it was not invoked because the rule's premise (5 prior defers without closure) was wrong. CF-1 had been closed; the carry-forward channel had simply not been updated to reflect closure. v1.49.639's contribution is recognizing the closure + retiring the abstract carry-forward.

See `chapter/01-overview.md` "Scope change disclosure" for the full rationale and `chapter/03-retrospective.md` for the multi-cluster framing-error pattern as a forward lesson candidate.

## Test counts at ship

- TS integration tests added: +13 across C3 + C2 + C4 + meta-test
  - C3 invariant test: +2
  - C2 invariant test: +4
  - C4 invariant test: +2
  - Meta-test: +7 (some skip-guarded for environment portability)
- Source patches: 3 ORDER-BY tiebreakers in `src/intelligence/kb/store.ts`
- Doc revisions: `docs/SUBSTRATE-PROBE-DISCIPLINE.md` (+§2.4), `docs/test-discipline/audit-method-corrections.md` (NEW)
- Hook revert: `project-claude/hooks/self-mod-guard.js` instrumentation removed
- User-level config edit: `~/.claude/hooks/pr-review-gate.sh` (project-aware whitelist; OUTSIDE this repo)

All 6 carry-forwards CLOSED. Engine state UNCHANGED.

## Carry-forward to v1.49.640 (Cluster #7 inventory)

3 carry-forwards routed to Cluster #7:

- **CF-7 (HIGH):** Security Audit job failure — npm audit blocks on `@mistralai/mistralai` malware advisory + `@anthropic-ai/sdk` permissions advisory. Surfaced new this milestone; needs scoped investigation.
- **CF-8 (LOW):** Forward-cadence engine resumption — STS-7 Sally Ride / Challenger candidate for v1.49.640+ NASA degree.
- **CF-9 (LOW):** Phase-2 cartridge shape families (abstract; multi-cluster carry-forward continued).

See `chapter/05-carry-forward.md` for the canonical inventory.

## Threads closed / opened / extended

- **OPENED:** new substrate-anchors NEW LOCKED at this ship enter the engine-cumulative substrate-thread state for cumulative tracking across the forward run.
- **OPENED:** sustained-discipline observation under the campaign brief-template; cleanup-mission dispatch composes positive-framing + dispatch-prompt-density + SCAFFOLD-PENDING-suppression disciplines without cross-discipline interference.
- **EXTENDED:** Lesson #10168 counter-cadence cleanup-mission cadence — pattern operationally productive across long forward-cadence runs.
- **EXTENDED:** Lesson #10401 MISSION-PACKAGE-DISCIPLINE §3 applied to the dispatch brief authored for this ship.
- **EXTENDED:** W3.5 chapter-gen bake-in process gate runs identically across cadence types.
- **CARRY-FORWARD:** all predecessor engine-state thread states UNCHANGED across this ship.

## Components

| Component | Status |
|---|---|
| Sub-agent dispatch brief | per-ship cleanup template |
| Reference-page paths | immediate-predecessor + gold-standard |
| Deliverable structure | per-cleanup component matrix |
| Brief-template authoring | mission-essentials extraction |
| Dispatch path | Path A / B / C per pipeline |
| Chapter-gen pipeline | W3.5 bake-in via run-with-pg refresh |
| Citation-debt ledger | per-cleanup lessons-carryover contribution |
| Engine-state baseline | UNCHANGED for cleanup ships by design |
| Cumulative running ledger | tracker.md aggregates cluster cadence |

## See also

- `chapter/00-summary.md` — narrative summary
- `chapter/01-overview.md` — milestone narrative + scope-change disclosure + why
- `chapter/02-walkthrough.md` — per-component walkthrough with commit anchors + invariants
- `chapter/03-retrospective.md` — what worked / what could be better / operator W0 decision trail
- `chapter/04-lessons.md` — forward lessons emitted (Lesson #10199+) + Lesson #10197 disconfirmation note
- `chapter/05-carry-forward.md` — Cluster #7 inventory (CF-7 through CF-9)
- `chapter/99-context.md` — cross-references + predecessor pointer + T14 sequence link
- `docs/SUBSTRATE-PROBE-DISCIPLINE.md` — UPDATED canonical substrate-probe discipline reference (v2 with §2.4 adjacency-check requirement)
- `docs/test-discipline/audit-method-corrections.md` — NEW companion inventory of multi-form concepts
