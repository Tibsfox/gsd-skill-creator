# Architecture Connections — Resolution to GSD Component

**Pack:** Philosophy Dissolved
**Purpose:** Cross-reference showing how each paradox resolution maps to a specific GSD ecosystem component.

---

## Coverage Summary

11 of 14 resolutions connect to specific GSD components (exceeds the 8-minimum requirement).

| GSD Component | Paradox(es) | Connection Type |
|--------------|-------------|-----------------|
| Observation Engine / PromotionEvaluator | Hempel's Raven | Structural |
| PatternAnalyzer / n-gram scoring | Goodman's Grue | Structural |
| Test Infrastructure / test-generator | Duhem-Quine | Structural |
| Skill Versioning | Ship of Theseus | Structural |
| Trust Tier Escalation | Sorites | Structural |
| Skill Migration | Teletransportation | Structural |
| Phase Execution / wave decomposition | Zeno's Dichotomy | Analogical |
| Route Optimizer / dijkstra | Zeno's Achilles | Structural |
| Safety Gates / generatePreGate | Thomson's Lamp, Surprise Examination | Structural |
| Trust Model / trust escalation | Newcomb's Problem | Structural |
| EphemeralStore / getSessionCounts | Sleeping Beauty | Structural |
| Self-Modifying Skill System / security-hygiene | Liar's Paradox | Structural |
| Muse Architecture | Chinese Room | Structural |
| Observation vs Documentation / educational packs | Mary's Room | Structural |

---

## Detailed Connections

### Room 1: Evidence & Confirmation

**Hempel's Raven -> Observation Engine**
The PromotionEvaluator scores specific observations against specific criteria — sampling the relevant population (tool calls, file activity, user engagement) rather than cataloguing everything that ISN'T a pattern. The Raven Paradox proves this is epistemologically correct: specialized sampling outperforms generalized retrieval by a factor proportional to |P_total|/|P_relevant|. This is the Amiga Principle made architectural.

**Goodman's Grue -> PatternAnalyzer**
The PatternAnalyzer's n-gram scoring naturally favors simpler patterns because patterns with temporal boundaries (grue-like) decompose into simpler components that score higher individually. Minimum Description Length is implicit in the scoring — shorter pattern descriptions dominate. The system doesn't argue about which patterns are "real"; it measures complexity and lets shorter descriptions win.

**Duhem-Quine -> Test Infrastructure**
A failing test has Duhem-Quine structure: the failure could be in the code, the test, the mock, the environment, or the assumptions. The test-generator designs tests that maximize diagnostic power by targeting code paths that participate in the most behaviors — the morphisms that appear in the most commutative diagrams. Maximum-entropy experimental design, operationalized.

### Room 2: Identity & Persistence

**Ship of Theseus -> Skill Versioning**
A skill at v1.0 and v3.0 may share zero lines of code, but if the behavioral signature (capability, interface contract, test outputs) is preserved through continuous evolution, it's the same skill. Identity tracked through pattern preservation, not substrate persistence. The skill-creator's versioning system IS the Ship of Theseus resolved.

**Sorites -> Trust Tier Escalation**
Trust levels 0-3 look like sharp boundaries, but the underlying evaluation (`evaluateRig()`) computes continuous scores across multiple criteria. The tier boundaries are practical cutpoints on a continuous gradient — administrative conveniences, not ontological claims. Fuzzy membership made operational.

**Teletransportation -> Skill Migration**
When a skill migrates across environments, identity is verified by information fidelity: same inputs, same outputs. The behavioral signature IS the identity. The migration is "lossless" if mutual information is preserved. The system doesn't ask "is it the same skill?" — it measures fidelity and reports a number.

### Room 3: Infinity & Motion

**Zeno's Dichotomy -> Phase Execution**
A GSD milestone decomposes into phases, plans, and commits. Each finer subdivision adds diminishing marginal work. The milestone completes in finite time because remaining work converges to zero — a geometric series, not because decomposition ends, but because the terms shrink.

**Zeno's Achilles -> Route Optimizer**
The route optimizer's `dijkstra()` solves the graph globally rather than recursively chasing moving targets. Choosing the right reference frame (global graph vs local pursuit) is the difference between an obvious solution and an apparent paradox.

**Thomson's Lamp -> Safety Gates**
A safety gate evaluates at the boundary with explicit criteria — it specifies the boundary condition directly rather than deriving it from an infinite sequence of incremental checks. `generatePreGate()` and `generatePostGate()` define what must be true at the boundary, full stop.

### Room 4: Decision & Prediction

**Newcomb's Problem -> Trust Model**
Trust levels encode mutual information between declared intent and observed behavior. A high-trust rig is one where I(declared; observed) is high. You earn trust by having high mutual information between commitments and actions — not by arguing about causation.

**Surprise Examination -> Safety Gates**
`evaluateTrustGate()` checks requirements at the moment of the operation, not through backward reasoning about hypothetical future states. Evaluate at the boundary. Don't reason backward from what might happen later.

**Sleeping Beauty -> EphemeralStore**
The observation system tracks both distinct pattern keys (world-states) AND observation counts per session (experience-moments) via `getSessionCounts()`. Both numbers are correct for different questions. The system doesn't pick a side — it provides both measurements.

### Room 5: Self-Reference & Emergence

**Liar's Paradox -> Self-Modifying Skill System**
The skill-creator uses Tarski's stratified hierarchy: Level 0 domain skills, Level 1 governance skills (security-hygiene), Level 2 hypervisor. No skill modifies itself directly. Self-reference is managed through level separation, exactly as Tarski's theorem prescribes.

**Chinese Room -> Muse Architecture**
No individual muse "understands" the project. But the composite system — Lex + Sam + Cedar + Willow + Hemlock + Foxy + Hawk + Owl + Raven — instantiates a functor from individual perspectives to collective understanding that none possesses alone. The muse architecture is the Chinese Room resolved in practice.

**Mary's Room -> Observation vs Documentation**
The observation engine (experiential channel) exists because documentation alone (propositional channel) doesn't carry the information that execution carries. Educational packs include both RESOURCES (reading) and PHASES with checkpoints (doing). Mary's Room proves this design is epistemologically necessary.

---

## Connection Types

- **Structural:** The GSD component's architecture directly embodies the paradox's resolution. The design decision IS the mathematical principle, operationalized.
- **Analogical:** The connection illuminates the design but the component wasn't built to implement the resolution explicitly.

13 of 14 connections are structural. The architecture didn't adopt these resolutions consciously — it discovered them independently. The paradoxes provide the vocabulary to explain WHY the architecture works.
