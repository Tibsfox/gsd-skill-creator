# Summary — v1.49.659

**Mission:** Phase-2 Build-Out: Manifests, Spectra, Retrieval, Audit (counter-cadence)
**Released:** 2026-05-16
**Engine state:** UNCHANGED (NASA 1.117 / MUS 1.117 / ELC 1.117 / SPS #114 / TRS pack-39 K_39=519)
**Seventh counter-cadence cleanup milestone** in 2026

## Headline

May 2026 arxiv synthesis section 2.4 — four out of eight enumerated code-level Phase-2 changes shipped. Plus full counterfactual-trace audit machinery bootstrap (probe banks + reports + runner + skill version bumps driven by audit findings).

## Numbers

- **28 commits** on dev ahead of v1.49.658
- **70+ new tests** all green; full src typecheck clean
- **25/25** concept slots filled in `agent-systems` college department
- **17 probes** authored across 4 skills in `.planning/patterns/skill-audits/probes/`
- **24 paired sub-agents** dispatched in the v2 broader-bank audit cycle (~5 min wall, ~1.3M tokens)
- **3 skill version bumps**: intent-router v1.0.0 → v1.0.1 → v1.0.2, spectral-topology-preflight v1.0.0 → v1.0.1
- **2 audit-session reports** (v1 + v2)
- **4/4 skip-path probes** correctly deferred (skill calibration verified)
- **0 findings** from `scripts/apply-to-self.mjs --range v1.49.658..HEAD` after the 2-test false-positive fix

## What shipped (compact)

1. **agent-systems department** — 20 new RosettaConcept stubs across 5 wings completing 25/25 slots
2. **TypedSkillSpec** — V2 type alongside SkillSpec; capabilities + manifest deps + behavioural audit + compilation targets; new `TYPED_SKILL_SPEC_TYPE_HASH`; 14 tests
3. **7-value TopologyType + (ρ, Δ, κ) coordination signature** — pipeline / leader-worker / mesh / ring / tree / bipartite / critique-route; closed-form analytic spectra per Parks & Alharthi `2605.11453` Appendix A; emitted into TEAM.md frontmatter
4. **`src/memory/strategies/`** — RetrievalStrategy interface + BM25Strategy lexical channel; idempotent indexing; custom-tokeniser hook; 21 tests
5. **CTA machinery bootstrap** — 17-probe bank + 2 audit reports + `tools/skill-audit/run.mjs` v0.1 + 3 skill version bumps

## Engine state at v659 open and close

| Track | At v659 open | At v659 close | Delta |
|---|---|---|---|
| NASA | 1.117 | 1.117 | 0 (STS-51-D queued for next degree-advancing milestone) |
| MUS | 1.117 | 1.117 | 0 |
| ELC | 1.117 | 1.117 | 0 |
| SPS | #114 | #114 | 0 |
| TRS | pack-39 K_39=519 | pack-39 K_39=519 | 0 |

## Counter-cadence position

v1.49.659 is the seventh counter-cadence cleanup in 2026 (after v1.49.585, .653, .654, .655, .656, .658). Two back-to-back counter-cadence (v658 + v659) is unusual but defensible: v658 was MUS/ELC operational-debt; v659 is research-driven build-out from the arxiv synthesis. The counter-cadence-discipline doc predicted productive cadence every ~30 milestones; we're running closer to every-other right now, but the v659 work is engine-substrate (typed manifests, audit machinery) that future degree-advancing milestones can consume.

## Lessons codified (full list in 04-lessons.md)

- **#10335** — counter-cadence milestones can be research-driven, not just operational-debt
- **#10336** — pass-rate-blind audit (CTA) machinery requires probe banks + runner + skill versioning together; partial implementations don't surface SIP deltas
- **#10337** — platform-constraint check is load-bearing for any recommendation-emitting skill (spectral-topology-preflight v1.0.1 supplement)
- **#10338** — skip-rule calibration is measurable via skip-path probes; 4/4 firing rate this audit cycle
- **#10339** — false-positive apply-to-self findings are best resolved in-place (fix the test) not via allowlist (the allowlist is for true bypasses)

## Carry-forward to v1.49.660

- **FA-658-1, FA-658-2, FA-658-3** — unchanged from v658 (this milestone didn't touch MUS/SPS/NASA-title)
- **FA-659-1** — STS-51-D Discovery (NASA 1.117 → 1.118), original v659 scope deferred
- **FA-659-2** — Skill-audit runner v0.2 (`collect` subcommand for trace aggregation)
- **FA-659-3** — Stateful audit harness for spectral-topology-preflight's second skip clause
- **FA-659-4** — June 2026 arxiv scan (mechanical, ~21 min)
