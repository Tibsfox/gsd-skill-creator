# v1.49.659 — Phase-2 Build-Out: Manifests, Spectra, Retrieval, Audit

**Released:** 2026-05-16
**Type:** counter-cadence infrastructure milestone (NOT a NASA degree-advance)
**Predecessor:** v1.49.658 MUS + ELC Catalog-Card Template Codification (shipped 2026-05-16T12:43:39Z)
**Source vision:** May 2026 arxiv synthesis (`.planning/research/arxiv-may-2026-synthesis.md`) section 2.4 "Code-level changes — Phase 2" + Counterfactual Trace Audit methodology (arxiv `2605.11946v1`)
**Engine state:** UNCHANGED (NASA 1.117 / MUS 1.117 / ELC 1.117 / SPS #114 / TRS pack-39). Successor FA-659-1 STS-51-D Discovery (NASA 1.117→1.118) queued for next degree-advancing milestone.

## Summary

<!-- SHORT-FINDINGS-PREPENDED v1 -->

**Forward-cadence NASA degree advance.** v1.49.659 advances the engine from N.NNN to N.NNN with substrate-anchors NEW LOCKED at this ship.

**Per-mission canonical-sibling rebuild.** Phase-2 Build-Out: Manifests, Spectra, Retrieval, Audit ships as the per-mission canonical deliverable set.

**Engine-state quietness for non-NASA tracks.** MUS / ELC / SPS / TRS scaffolding remains SCAFFOLD-PENDING across this ship.

**Carryover discipline sustained.** Lesson #10168 + Lesson #10401 + W3.5 chapter-gen bake-in all apply identically.

**Per-pipeline dispatch path:** Path A sub-agent first-pass clean, Path B salvage, or Path C hand-author.

**Substrate-axis state.** Each forward ship continues INTRA-AXIS or opens a NEW INSTANCE within its substrate-axis class.

v1.49.659 ships four typed-surface deliverables called out in the May 2026 arxiv synthesis section 2.4 ("Code-level changes — Phase 2, not in this commit") plus a complete counterfactual-trace audit machinery bootstrap. Both lineages collapse the "skills as prose with implicit semantics" pattern into "skills as typed manifests with machine-checkable behavioural audit."

This is the **seventh counter-cadence cleanup milestone** in 2026 (v1.49.585 → v1.49.653 → v1.49.654 → v1.49.655 → v1.49.656 → v1.49.658 → v1.49.659), but distinct from its six predecessors: those were operational debt; this one is research-driven build-out from the 60-paper May 2026 arxiv synthesis.

## Numbers

- **28 commits** on `dev` ahead of v1.49.658 (this session contributed 6)
- **70+ new tests** all green; full src typecheck clean
- **25/25 concept slots** filled in the `agent-systems` college department (5 wings × 5 concepts)
- **3 new src/ subsystems / extensions**:
  - `src/mesh/skill-view.ts` — TypedSkillSpec V2 type alongside existing SkillSpec
  - `src/learn/generators/team-generator.ts` — 7-value TopologyType + (ρ, Δ, κ) spectral signature
  - `src/memory/strategies/` — new directory; RetrievalStrategy interface + BM25 lexical channel
- **17-probe audit bank** at `.planning/patterns/skill-audits/probes/` across 4 skills (3 active + 1 deferred)
- **1 new tool**: `tools/skill-audit/run.mjs` (audit runner v0.1 — `plan` subcommand)
- **3 skill version bumps** driven by audit findings
- **2 audit-session reports** (v1 single-probe + v2 broader-bank with 24 paired probes)
- **1 apply-to-self blocker resolved** (2 scan-arxiv false-positive fixes)

## Source

Two upstream sources drove this milestone:

1. **May 2026 arxiv synthesis** (`.planning/research/arxiv-may-2026-synthesis.md`) — 60 papers across 4 anchors (skill-design, agent-orchestration, code-gen, memory-retrieval), 4 per-domain syntheses (~3,000 words each) + master synthesis (~1,500 words). Section 2.4 explicitly enumerated 8 code-level Phase-2 changes; this milestone ships 4 of them.

2. **CTA paired-trace audit methodology** (arxiv `2605.11946v1`) — the canonical pass-rate-blind audit method. The CTA finding is that a single skill can produce 522 measurable behavioural changes across 49 tasks while pass-rate moves only +0.3%. This milestone bootstraps the machinery to detect those changes.

## What shipped

| Deliverable | Path | Tests | Source |
|---|---|---|---|
| 20 agent-systems concept stubs | `.college/departments/agent-systems/concepts/` | n/a | 60-paper synthesis |
| TypedSkillSpec V2 + tests | `src/mesh/skill-view.ts`, `src/mesh/typed-skill-view.test.ts` | 14 | SkCC `2605.03353v2`, FORTIS `2605.09163v2`, CTA `2605.11946v1` |
| 7-value TopologyType + spectral signature | `src/learn/generators/team-generator.{ts,test.ts}` | 14 added (13→27) | Parks & Alharthi `2605.11453` |
| RetrievalStrategy + BM25 channel | `src/memory/strategies/{types,lexical,index}.ts` + test | 21 | `2605.14503v1` |
| CTA audit reports + 4 probe banks + runner | `.planning/patterns/skill-audits/`, `tools/skill-audit/run.mjs` | n/a | `2605.11946v1` |
| intent-router v1.0.0 → v1.0.2 | `.claude/skills/intent-router/SKILL.md` | n/a | audit findings |
| spectral-topology-preflight v1.0.0 → v1.0.1 | `.claude/skills/spectral-topology-preflight/SKILL.md` | n/a | audit findings |
| scan-arxiv test apply-to-self fixes | `src/scan-arxiv/{bridge,fetcher.live}.test.ts` | n/a | apply-to-self blocker |

## Audit verdicts

After two audit cycles (1-probe v1, 4-probe v2 with 24 paired sub-agents):

| Skill | v1 verdict | v2 verdict | Why |
|---|---|---|---|
| `intent-router` | refine | **keep** ⬆ | v1.0.2 skip rule + confidence-tiered output fixed the IR-01 ceremony issue; multi-hop and verification probes show real recovery |
| `execution-grounded-selection` | keep | **keep** ✓ | both skip rules fire correctly; recovery probes surface measurable behavioural evidence |
| `spectral-topology-preflight` | keep | **keep + supplement** | quantitative signature confirmed; v1.0.1 supplement adds platform-constraint check |
| `skill-counterfactual-audit` | deferred | **deferred** | recursion case excluded by its own skip rule |

**Skip-rule firing rate: 4/4** — every skip-path probe correctly deferred.

## Engine state delta

None. Counter-cadence; no NASA / MUS / ELC / SPS / TRS forward-cadence content this milestone. NASA degree remains 117. Successor v1.49.660 carries FA-659-1 (STS-51-D Discovery) as the next degree-advancing target.

See `chapter/00-summary.md` for the headline numbers, `chapter/03-retrospective.md` for what worked and what didn't, `chapter/04-lessons.md` for the lessons codified, and `chapter/99-context.md` for the cross-references and provenance.
