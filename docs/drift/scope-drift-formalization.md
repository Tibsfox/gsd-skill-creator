# Scope Drift: Knowledge Drift Applied to Derived Content

**Version:** 1.0.0
**Phase:** 693 (DRIFT-21)
**Milestone:** v1.49.569 — Drift in LLM Systems
**Half:** B (Alignment-Drift Defenses, W5)

## 1. Definition

**Scope drift** is the condition in which a derived artifact (a generated or adapted
skill, agent, or document) claims coverage over a domain larger than what its source
observations or training data actually support.

Formally: given a skill S with declared scope D(S) and a set of observed interactions
O(S), scope drift occurs when D(S) ⊄ O(S) — the skill's stated scope includes items
that the observational evidence does not warrant.

This is precisely **knowledge drift applied to derived-from-source-material content**:
the same two-phase belief-shift dynamic described by Fastowski et al. 2024
(`fastowski2024knowledge`, arXiv:2409.07085) — first a correct-locus phase, then an
unsupported generalization phase — appears at the skill-derivation layer. Instead of
an LLM drifting away from source facts during generation, a skill derivation pipeline
drifts away from its observation basis during the derivation step.

## 2. Why Scope Drift IS Knowledge Drift

Fastowski et al. 2024 characterize knowledge drift as a **two-phase belief-shift
dynamic**:

1. **Phase 1 (Correct locus):** The model stays near source-supported claims,
   producing accurate outputs with high reference-agreement.
2. **Phase 2 (Unsupported generalization):** The model drifts beyond the evidence
   boundary, producing plausible but ungrounded claims.

The same structure appears in the GSD staging layer:

| Knowledge drift (LLM generation) | Scope drift (skill derivation)     |
|-----------------------------------|------------------------------------|
| Source document = ground truth    | Session observations = ground truth|
| Generated text = derived content  | Skill description/triggers = derived content |
| Drift point = claim index         | Drift point = unsupported scope item count |
| SD score (Spataru 2024)           | Drift ratio (unsupported / total)  |

Spataru et al. 2024 (`spataru2024sd`, arXiv:2404.05411) show that truncation at the
drift point (the "oracle early-stop") recovers substantial factual accuracy (FActScore
44.6% → 81.7%). The analogous mitigation in the staging layer is **scope narrowing**:
trimming skill declarations back to the intersection of declared scope and observed
scope.

## 3. GSD Staging-Layer Mechanics

The `src/staging/derived/scope-drift.ts` module implements scope-drift detection
for the GSD staging layer. It operates as a **post-derivation checker** that runs
after a skill has been generated from session observations:

```
Session observations
       ↓
[Skill Derivation Pipeline]
       ↓
  Derived Skill (description + triggers + body)
       ↓
[scope-drift.ts: detectScopeDrift]
       ↓
  ScopeDriftFinding[] (empty = no drift)
```

### Key functions

- `extractSkillScope(description, triggerIntents, triggerFiles, bodyHeadings)` —
  tokenises all text surfaces of the derived skill into a normalised keyword set D(S).

- `extractObservedScope(sessions[])` — aggregates top-commands, top-files, and
  top-tools from session observation records into a normalised keyword set O(S).

- `detectScopeDrift(skillScope, observedScope)` — computes the drift ratio
  `|D(S) \ O(S)| / |D(S)|` and classifies severity:
  - `> 0.50` → **critical** (more than half of scope is unsupported)
  - `> 0.30` → **warning**
  - `≤ 0.30` → **info**

The drift ratio mirrors the SD-score axis from Spataru 2024: both quantify the
fraction of derived content that has lost anchor in the source material.

## 4. Cross-Reference: Half-A Research

This formalization extends the findings documented in the Half-A research document:

- **Module A** (`fastowski2024knowledge`, `spataru2024sd`): establishes the
  two-phase belief-shift dynamic and the SD-score metric for measuring drift in
  long-form LLM outputs. The present document applies those concepts one layer up
  the derivation stack.

- **Module D §GSD mapping** (in `.planning/missions/drift-in-llm-systems/work/`):
  maps the research taxonomy onto gsd-skill-creator subsystems. Scope drift sits in
  the `knowledge` surface column of the taxonomy (phenomenon: over-generalisation,
  surface: derived-content generation, metric: drift-ratio).

The Half-A final PDF (`.planning/missions/drift-in-llm-systems/work/drift-mission-final.pdf`)
contains the full citations, numeric benchmarks, and editorial-review annotations
(Phase 684.1) referenced above.

## 5. Mitigation Strategies

Following the mitigation analysis from Spataru 2024 and Fastowski 2024:

| Mitigation        | Implementation                                  | Recovery |
|-------------------|-------------------------------------------------|----------|
| Scope narrowing   | Remove unsupported items from D(S) → D(S) ∩ O(S) | Eliminates drift |
| Observation widening | Add missing session data before derivation   | Raises O(S) baseline |
| Severity gate     | Block skill publication when drift ratio > 0.5  | Prevents critical drift from shipping |
| Incremental derivation | Derive skill in smaller observation batches | Reduces Phase-2 drift risk |

The `detectScopeDrift` function returns structured `ScopeDriftFinding` records that
downstream publishers (e.g., `src/staging/hygiene/`) can consume to enforce the
severity gate.

## 6. Integration

The scope-drift detector integrates with the staging pipeline at two points:

1. **Derivation checker** (`src/staging/derived/checker.ts`): calls `detectScopeDrift`
   as one of the checks in the derived-content validation suite.

2. **Publication gate**: a `critical` severity finding blocks skill publication until
   the drift is resolved (scope narrowing or observation widening).

Integration tests live at `src/drift/__tests__/scope-drift-integration.test.ts` and
exercise the derivation path end-to-end with synthetic skill + session fixtures.

## 7. References

- `fastowski2024knowledge` — Fastowski et al. (2024), arXiv:2409.07085.
  *Knowledge drift in LLMs: misinformation, ±56.6% / −52.8% uncertainty swing,
  two-phase belief-shift dynamic.*

- `spataru2024sd` — Spataru et al. (2024), arXiv:2404.05411.
  *SD score 0.77–0.79 across major LLMs; oracle early-stop raises FActScore
  44.6% → 81.7%; 37% of paragraphs drift within first 10% of facts.*

---

*Formalized in Phase 693 (DRIFT-21) of v1.49.569 Drift in LLM Systems milestone.*
