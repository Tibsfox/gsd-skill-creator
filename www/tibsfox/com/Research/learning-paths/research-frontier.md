# The Research Frontier

A post-doctoral level learning path that derives testable hypotheses from the cross-domain connections discovered across 200+ research projects. This is not a survey — it is a research program.

**Projects:** OPEN (19 problems), SAA, ELE, NASA, forest sim, all Rosetta clusters
**Modules:** 10
**Estimated time:** 500+ hours (open-ended research)
**Difficulty:** Post-doctoral / cutting-edge
**College departments:** Mathematics, Physics, Computer Science, Ecology, Philosophy
**Best for:** Anyone ready to derive new truths from established connections

---

## The Core Method

Every hypothesis below follows the same derivation:

1. **Observation:** Two domains exhibit the same mathematical structure
2. **Formalization:** Write the isomorphism explicitly (functorial mapping)
3. **Prediction:** A known result in Domain A should have an analog in Domain B
4. **Experiment:** Test the prediction computationally or empirically
5. **Publication:** If confirmed, the cross-domain result is novel

---

## Module 1: Hypothesis — Kuramoto Synchronization Predicts Agent Convoy Performance

**Derived from:** Strogatz lecture + Gastown convoy model + Rosenthal potential games

**The connection:** Kuramoto coupled oscillators synchronize when coupling K exceeds critical threshold Kc. The Rosenthal potential for congestion games has the same structure. Agent convoys ARE coupled oscillators.

**Testable prediction:** Convoy performance (measured by completion time and quality) should exhibit a phase transition as agent communication frequency increases. Below Kc: agents work independently, crosstalk degrades quality. Above Kc: agents spontaneously coordinate, quality jumps.

**Experiment:**
1. Run 10 identical GSD convoys with 4 polecats each
2. Vary communication frequency (nudge interval) from 0 to continuous
3. Measure: completion time, test pass rate, rework count
4. Plot performance vs communication frequency
5. Look for the phase transition — the Kc of agent orchestration

**If confirmed:** This gives a principled answer to "how much should agents communicate?" — not "as much as possible" but "above Kc and not much more."

---

## Module 2: Hypothesis — Context Rot Follows Kolmogorov Turbulence Scaling

**Derived from:** Chroma context rot research + Navier-Stokes (P15) + Kolmogorov K41 theory

**The connection:** Turbulence has a universal energy spectrum: E(k) ~ k^(-5/3). Information degrades in LLM context windows as irrelevant content accumulates. Both are dissipative cascades.

**Testable prediction:** Context quality (measured by MRCR accuracy) as a function of context fill percentage should follow a power-law decay with exponent near -5/3, not a linear or exponential decay.

**Experiment:**
1. Use the Chroma evaluation framework (LongMemEval)
2. Measure accuracy at 10%, 20%, 30%, ..., 100% context fill
3. Fit power law: quality ~ (fill%)^α
4. Compare α to -5/3 (Kolmogorov) vs -1 (linear) vs exponential
5. If α ≈ -5/3, context degradation IS an information turbulence cascade

**If confirmed:** This would be the first formal connection between fluid dynamics theory and LLM context management. It would predict the optimal compaction schedule from first principles.

---

## Module 3: Hypothesis — Mycorrhizal Network Topology Optimizes Trust-Weighted Routing

**Derived from:** Forest fungi research + trust-relationship.ts + network theory

**The connection:** Mycorrhizal networks transfer carbon between trees using kin-selected, distance-weighted routing through fungal intermediaries. Our trust system routes work through agents using earned trust scores. Both are resource-transfer networks with trust-weighted edges.

**Testable prediction:** The topology of a mature Douglas fir mycorrhizal network (measured by ¹³C isotope tracing data) should match the optimal topology for our agent communication network (computed by minimum-cost flow algorithms).

**Experiment:**
1. Obtain mycorrhizal network topology data from published ¹³C tracing studies
2. Extract the adjacency matrix and edge weights (carbon transfer rates)
3. Compute the minimum-cost flow for the same demand pattern on a random graph
4. Compare: does the biological network match the computed optimum?
5. If yes, evolution found the same solution our algorithms find

**If confirmed:** Biological networks as reference architectures for agent communication — not metaphor, but optimality proof.

---

## Module 4: Hypothesis — The Permanent/Determinant Gap Predicts Agent Verification Complexity

**Derived from:** Wigderson GCT2022 + Toda's theorem + witness-observer architecture

**The connection:** The permanent (counting problem, #P-hard) and determinant (linear algebra, P) differ by one sign. Our verification architecture has the same structure: executing work (the "permanent" — explores all paths) vs verifying work (the "determinant" — checks one path).

**Testable prediction:** The computational cost of verifying agent work should be polynomially related to the cost of executing it, with the gap governed by the same algebraic structure as perm/det.

**Experiment:**
1. Measure execution time and verification time for 100 GSD work items
2. Plot verification_time vs execution_time
3. Fit the relationship: is it linear? polynomial? exponential?
4. Compare the exponent to the perm/det complexity gap predictions
5. Does IP = PSPACE predict that interactive verification is polynomially cheaper than re-execution?

**If confirmed:** Formal complexity theory gives exact bounds on how much cheaper verification can be vs execution — directly informing witness-observer architecture design.

---

## Module 5: Hypothesis — Conservation Easement Mechanics Predict Optimal Trust Decay Rates

**Derived from:** Conservation law research + trust-relationship.ts + control theory

**The connection:** Conservation easements protect land in perpetuity through: annual monitoring, violation detection, graduated enforcement, and restoration requirements. Trust-relationship.ts implements: periodic verification, trust decay on inactivity, violation response, and trust restoration paths.

**Testable prediction:** The optimal trust decay rate in our system should match the empirically calibrated monitoring frequency of successful land trusts (~annual for low-risk, ~quarterly for high-risk).

**Experiment:**
1. Survey published land trust monitoring data (violation rates vs monitoring frequency)
2. Extract the optimal monitoring curve (diminishing returns)
3. Run trust-relationship.ts with varying decay rates
4. Measure: false positive rate (trust decayed too fast) vs false negative rate (violations missed)
5. Compare the optimal decay rate to the land trust empirical optimum

**If confirmed:** 4,000 years of conservation practice has already calibrated the optimal trust verification frequency.

---

## Module 6: Hypothesis — Wright's Law Applies to Agent Skill Accumulation

**Derived from:** Battery/solar cost curves + perovskite research + skill-creator architecture

**The connection:** Wright's Law says cost drops 18-20% per doubling of cumulative production. Our agents accumulate skills over sessions. Each skill makes future work cheaper/faster.

**Testable prediction:** Agent task completion time should follow Wright's Law — 18-20% faster per doubling of completed tasks of the same type.

**Experiment:**
1. Log task completion times across 100+ GSD phase executions
2. Group by task type (plan, execute, verify, research)
3. Plot completion time vs cumulative tasks completed
4. Fit Wright's Law: T(n) = T₁ × n^(log₂(LR))
5. Extract the learning rate LR for each task type

**If confirmed:** Predictive scheduling becomes possible — forecast how long future phases will take based on cumulative experience.

---

## Module 7: Hypothesis — BFT Bounds Determine Minimum Convoy Size

**Derived from:** Byzantine Fault Tolerance + trust system + adversarial agent research

**The connection:** BFT requires 3m+1 nodes to tolerate m Byzantine faults. Our convoys can contain adversarial agents (compromised, hallucinating, or misaligned).

**Testable prediction:** Convoy quality should degrade catastrophically when the number of unreliable agents exceeds ⌊(N-1)/3⌋, matching the BFT impossibility bound.

**Experiment:**
1. Run convoys of size N = 4, 7, 10
2. Inject m = 1, 2, 3 "adversarial" agents (random output, delayed responses)
3. Measure: does quality collapse at m = ⌊(N-1)/3⌋?
4. Does the witness-observer catch the adversarial agents before collapse?

**If confirmed:** The 50-year-old BFT bound from distributed systems directly constrains multi-agent AI orchestration.

---

## Module 8: Hypothesis — Shannon Channel Capacity Bounds Context Quality

**Derived from:** Information theory + context engineering + compaction research

**The connection:** Shannon proved C = 1 - H(p) for a binary symmetric channel. The context window is a "channel" from past information to present understanding, with "noise" from irrelevant content.

**Testable prediction:** Maximum useful context quality should follow Shannon's formula, where p = fraction of irrelevant tokens. At p = 0.5 (half irrelevant), capacity should be near zero.

**Experiment:**
1. Create test contexts with controlled irrelevance ratios (0%, 10%, 25%, 50%, 75%)
2. Measure task accuracy at each ratio
3. Fit: accuracy ~ C(p) = 1 - H(p)
4. Does the Shannon bound predict the empirical accuracy curve?

**If confirmed:** Context engineering IS communication engineering. Every result from 75 years of information theory applies directly.

---

## Module 9: Hypothesis — Structural Stability Theory Predicts Harness Failure Modes

**Derived from:** Euler buckling + slender columns + harness-integrity.ts

**The connection:** A slender column fails catastrophically when axial load exceeds Pcr = π²EI/L². The harness fails when a safety invariant is bypassed and load (agent autonomy) exceeds the structural capacity of the remaining invariants.

**Testable prediction:** Removing harness invariants should produce a sharp failure threshold (not gradual degradation), analogous to Euler buckling — the system is fine until it suddenly isn't.

**Experiment:**
1. Start with all 24 harness invariants active
2. Disable invariants one at a time (most to least critical)
3. Run adversarial test suite after each removal
4. Measure: failure rate vs number of active invariants
5. Look for the "buckling point" — the critical number below which failures cascade

**If confirmed:** Structural engineering's stability theory gives exact design rules for how many invariants are "enough."

---

## Module 10: Derive Your Own

**The method is now yours.**

1. Pick any two domains from the 200+ research projects
2. Find a mathematical structure they share
3. Write the isomorphism explicitly
4. Identify a known result in one domain
5. Predict the analog in the other domain
6. Design an experiment to test it
7. Run the experiment
8. If confirmed: write it up. If not: understand why. Both outcomes are knowledge.

**The research frontier is not a place. It is a method.**

*"Every unsolved problem is a boundary between what we know and what we pretend to know."*
