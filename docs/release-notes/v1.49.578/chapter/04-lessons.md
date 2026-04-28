# v1.49.578 -- Forward Lessons (Emitted to v1.49.579+)

## Lessons Forward

### 1. Substantiation milestones immediately following research-heavy milestones are a useful pattern

v1.49.577 was the substantive JULIA-PARAMETER milestone -- 40/40 candidate absorptions, 20 phases, six convergent-discovery clusters, four CLAUDE.md anchor papers. It closed with five "open items / follow-ups" -- four of which were "ready for X but not actually X" gaps and one of which was an info-blocked DEFER.

v1.49.578 closed four of the five gaps in a one-day Solo-profile pass. The substantiation pattern: a small, focused milestone whose only job is to dispose of the prior milestone's footnotes -- no new src/ subsystem, no new research, no new CLAUDE.md anchor.

**Forward operational rule:** after any large research-and-implement milestone (Fleet profile, multiple modules, >=10 phases), schedule a Solo-profile substantiation milestone within ~1 week to dispose of the open-items section. Do NOT carry the open items into the next substantive milestone -- they will calcify or get re-relitigated as scope creep.

### 2. DEFER with read-of-source evidence is a first-class outcome

v1.49.578 ran W2 with three components (selector / draft-verify-router / mesh-degree-monitor). One wired (draft-verify-router); two DEFER with structural reasoning (selector + mesh-degree-monitor). Both DEFERs are grounded in read-of-source evidence: selector is one-shot batch with no streaming-decision shape; mesh-degree-monitor is event-driven + hard-rule + one-shot escalation, no streaming-decision shape.

The alternative -- forcing the wire-up to close the line item -- would have produced silent inert code that the next milestone would have to audit and likely undo.

**Forward operational rule:** DEFERs are acceptable outcomes when grounded in a concrete structural reason that's documented in the mission spec or the commit body. The reason must be precisely-framed (e.g. "no streaming-decision shape -- the call site is one-shot batch") rather than a vibes assessment. Mission packages should have explicit space for DEFER-evidence -- the W2a + W2c component specs in `.planning/missions/v1-49-578-jp-substantiation/` are a reusable template.

### 3. Run end-to-end, even when the spec accepts a DEFER

W4 originally planned to ship `tools/verify-mathlib-pin.sh` and accept the actual `lake build` execution as a DEFER (user opting to install Lean was a separate decision). Running it end-to-end on Lean 4.15.0 / Mathlib4@`6955cd00` cost ~30 minutes of session time but produced a real PASS rather than "PASS pending user install."

**Forward operational rule:** when a verification script ships, attempt the end-to-end run as part of the same wave even if the spec accepts a DEFER. The dependency installation is usually the cost; the actual run is short. The "pending user install" framing should be a fallback, not a default.

### 4. The "long-term home is the X branch" footnote should be revisited every milestone

v1.49.577 said JP-040 NASA citations belonged on the `nasa` branch. Per user direction 2026-04-26, `nasa` had been merged back into dev some time ago and was no longer active. v1.49.578 caught the staleness and relocated to `docs/research/nasa-citations.md` on-tree.

**Forward operational rule:** any "long-term home is the X branch" footnote in a handoff should be revisited at the next milestone's open. If X has merged or been retired, the off-tree justification has evaporated and the content should move on-tree. Do NOT carry a stale branch-pointing footnote across multiple milestones.

### 5. Pre-staged carryforward should be acknowledged as W0/W1, not re-done

Four commits already on `origin/dev` at v1.49.578 milestone-open (`fd3d40b74` test-fix + `b75d675df` JP-001 SHA pin + `e71f488b5` JP-010a runAB Round 1 + `e9be25f72` JP-002 retrieve() Round 1). v1.49.578 counted them as W0/W1 and built W2-W6 on top.

**Forward operational rule:** when a milestone opens with pre-existing dev commits relevant to its scope, acknowledge them as the milestone's W0/W1 explicitly in the mission spec. Do NOT re-do the work to make the wave plan look prettier. Future readers should be able to find every commit in the milestone range, including pre-stage commits.

### 6. Solo profile is right for substantiation; Fleet profile is right for substantive

v1.49.577 was Fleet (8 modules, 19 named roles). v1.49.578 was Solo (one Opus session). The shape fit each milestone's work: substantive needs parallelism for breadth coverage; substantiation needs focus for honest gap-filling.

**Forward operational rule:** profile selection should track milestone archetype:
- Research / multi-module / breadth-coverage -> Fleet
- Substantiation / closure / depth-on-narrow-scope -> Solo
- Single-feature / single-component -> Solo
- Multi-feature / cross-cutting -> Fleet

Do NOT default to Fleet for everything. Do NOT default to Solo for everything. Match the profile to the work.

### 7. Test delta target overshoot is positive signal when it comes from script surface area

W4 was speced for >=1 test (script existence + exec bit + parses SHA). Landed +6 because the script grew enough surface area (SHA parse, exit codes, --no-build smoke, lake-build PASS reporting) to deserve more coverage. The overshoot is a signal that the implementation grew genuinely richer than the spec, not that the test floor was too lenient.

**Forward operational rule:** when a wave's test delta substantially exceeds the spec floor, write a one-line note in the retrospective explaining where the extras came from (here: script's exit-code surface). Do NOT silently absorb the overshoot -- documenting the overshoot helps future spec-floor calibration.

### 8. Author release-notes at W6 close, not as a follow-on

v1.49.578 did not author release-notes when it shipped on 2026-04-26. The user flagged the drift on 2026-04-27 and a backfill produced the release-notes a day after release. The 1-day delay is small but represents a regression in ship-discipline.

The likely cause: the Solo-profile substantiation milestone's small shape didn't trigger the release-notes authoring step that a Fleet-profile milestone routinely produces. The fix is structural, not procedural: the release-notes step belongs in W6's deliverable list explicitly, regardless of profile.

**Forward operational rule:** every W6 closing wave must include "author release-notes (5 files) at `docs/release-notes/v1.49.NNN/`" as an explicit deliverable. Profile (Solo vs Fleet) is irrelevant -- the discipline is the same. The closing checklist should not consider W6 done until the 5 release-notes files exist.

### 9. Info-blocked DEFERs should NOT be force-closed by substantiation milestones

v1.49.578 carried `wasserstein-boed.ts` IPM-BOED replacement forward as DEFER. The reason is concrete: a real IPM-BOED implementation needs a concrete `p(y | d, theta)` data-generating model, and no such model exists yet for skill-promotion experiments.

The substantiation-milestone instinct could have been "force-close: invent a synthetic data-generating model so the line item closes." That would have been worse than honestly carrying the gap -- the synthetic model would have driven implementation choices that would later have to be undone when a real BOED experimental design surfaces.

**Forward operational rule:** distinguish info-blocked DEFERs from procedural-gap DEFERs. Substantiation milestones close procedural-gap DEFERs (we have everything we need; we just haven't written the script / restored the test / wired the second site). They explicitly do NOT close info-blocked DEFERs. The info-block must resolve externally before the work can proceed.

### 10. Mission packages serve as substantiation-milestone scaffolding even at Solo profile

The `.planning/missions/v1-49-578-jp-substantiation/` package (README + 01-vision-doc + 03-milestone-spec + 04-wave-execution-plan + 05-test-plan + components/00-07) gave a clean wave plan even though the work was Solo. The component specs also served as DEFER-evidence carriers (W2a + W2c specs document the structural mismatch in the mission package itself).

**Forward operational rule:** even Solo-profile milestones should produce a mission package. The package is not just for fleet coordination -- it's also the canonical place to document DEFER reasoning, carry-forward provenance, and wave-by-wave outcome. The cost is small (~12K tokens) and the payoff is that future readers can reconstruct the milestone's reasoning without re-deriving it from commit messages.

---

*v1.49.578 forward lessons. Emitted to v1.49.579+ as carryover.*
