# Living Sensoria — Theoretical Foundation Audit

**Wave 0.2 · v1.49.561 · Phase 637**
**Status:** Cacheable prefix for Wave 1 module builds

---

## 1. Purpose

This document establishes, in plain engineering language, the five theoretical foundations that underpin the Living Sensoria module stack (M1 GraphRAG, M6 Net-Shift Receptor, M7 Markov-Blanket Homeostasis, M8 Quintessence Vital-Signs). It is designed as a cacheable prefix: every Wave 1 module-build prompt begins from a shared, audited theoretical base rather than reconstructing that base from scratch. Citations carry explicit page, section, or equation pointers; where a pointer could not be independently verified against a physical copy, this document notes the gap so that the SCOUT role can fill it in a subsequent pass.

---

## 2. The Through-Line

The Living Sensoria stack is grounded in a single engineering commitment: **make each mechanism substrate over score**. Log-linear receptor kinetics (Weber / Lanzara) give M6 a real formula rather than a heuristic. The Markov-blanket partition (Kirchhoff / Friston) gives M7 a structural claim — that any homeostatic system has an identifiable boundary — rather than a metaphor. The Quintessence frame (Lanzara 2023, Ch. 7) gives M8 five computable axes rather than a subjective "health" score. The path from raw log → structured memory → living sensorium is therefore not rhetorical: each layer adds a piece of math that was absent at the layer below.

---

## 3. The Net-Shift Equation (M6)

### Derivation from two-state occupancy

Assume a receptor population with total count R\_T, partitioned into two affinity states: low-affinity (subscript L) and high-affinity (subscript H). With ligand concentration [L], occupancy at equilibrium follows:

```
R_L·[L] ↔ R_L occupied    (association constant K_L)
R_H·[L] ↔ R_H occupied    (association constant K_H, K_H > K_L)
```

Conservation: `R_T = R_L + R_H + K_L·R_L·[L] + K_H·R_H·[L]`

Solving for occupied high-affinity fraction and taking the difference from the resting high-affinity baseline (δR\_H at [L] = 0 versus [L] > 0) yields the net-shift equation:

```
ΔR_H = [L] · R_T · (K_H − K_L) / ((1 + K_H·[L]) · (1 + K_L·[L]))
```

This is Lanzara 2023, Appendix III, the central expression in the net-shift model. In Appendix III Lanzara traces the derivation through the two-state binding equilibrium and arrives at this closed form as the functional definition of receptor net-shift capacity.

### Four behaviours from one equation

**Weber's law (log-linear regime).** When [L] is small relative to 1/K\_H and 1/K\_L, both denominator factors approach 1, giving `ΔR_H ≈ [L]·R_T·(K_H − K_L)`. Response is linear in [L]. Over the mid-range, successive equal-ratio increments in [L] produce successively smaller absolute increments in ΔR\_H, reproducing the Weber–Fechner log-linear psychophysical law. Weber 1834 (*De Pulsu, Resorptione, Auditu et Tactu*) stated the empirical regularity; Lanzara 2023 Appendix III shows the two-state model provides a mechanistic derivation.

**Saturation (ΔR\_H → 0 as [L] → ∞).** As [L] grows large, both denominator factors scale as K·[L], so `ΔR_H → R_T·(K_H − K_L)/(K_H·K_L·[L]) → 0`. High dose extinguishes the differential signal: all receptors end up occupied regardless of affinity class, so the shift vanishes.

**Tachyphylaxis (slow K\_H adjustment under sustained dose).** The equation carries K\_H as a parameter, not a constant. Under prolonged ligand exposure, biological receptor systems downregulate high-affinity sites; K\_H drifts toward K\_L. The net-shift term `(K_H − K_L)` contracts, reducing sensitivity. Lanzara 2023, Appendix III cites this as the mechanistic basis for tolerance/desensitisation — a temporal dynamic layered on top of the instantaneous shift formula.

**Silent binding (K\_H = K\_L → ΔR\_H = 0).** If both affinity states are identical, the numerator factor `(K_H − K_L)` is zero regardless of [L] or R\_T. The receptor is occupied but the system cannot distinguish which state it is in, so no signal propagates. This edge case captures ligands that bind without activating a net-shift response.

In M6, [L] is mapped to an analogue of signal strength in the codebase (e.g., query-relevance score), K\_H and K\_L are learned affinity parameters per memory tier, and ΔR\_H is the differential pull toward the high-relevance tier. The four behaviours above constrain the module's operating envelope without requiring ad-hoc thresholds.

---

## 4. The Markov Blanket Formalism (M7)

### The partition

Kirchhoff et al. 2018 (*J. R. Soc. Interface* 15:20170792, §2–3) formalise a partition of states around any persistent system:

| Symbol | Label    | Role |
|--------|----------|------|
| E      | External | States outside and unaffected by internal dynamics directly |
| S      | Sensory  | States read by the internal system; influenced by E, not directly by I |
| A      | Active   | States written by the internal system; influence E, not directly read as S |
| I      | Internal | States that update based on S and A but are shielded from E |

The defining conditional-independence property is:

```
p(I, E | S, A) = p(I | S, A) · p(E | S, A)
```

Given the blanket states {S, A}, internal and external states are independent. This is not a modelling assumption; Kirchhoff 2018 §2 proves it as a mathematical consequence of any system that persists (maintains its characteristic state distribution over time). Any homeostatic system — biological or computational — necessarily has a Markov blanket structure.

### Variational free energy

Friston 2010 (*Nature Reviews Neuroscience* 11(2):127–138, Fig. 1 and surrounding text) defines variational free energy as:

```
F = D_KL[q(I) || p(I|S)] − E_q[log p(S|I)]
```

where q(I) is the internal system's approximate posterior over hidden causes. Minimising F upper-bounds surprise (negative log evidence) and decomposes into:

- **Epistemic term** `D_KL[q(I) || p(I|S)]`: divergence between the internal model and the true posterior — measures model inaccuracy.
- **Pragmatic term** `−E_q[log p(S|I)]`: expected log-likelihood of sensory states under the internal model — measures predictive adequacy.

Active inference (Friston et al. 2013, *Frontiers in Human Neuroscience* 7:598, §Active inference and agency) extends this: the A states are chosen to minimise expected free energy over future time steps, coupling perception and action into a single optimisation loop rather than treating them as sequential stages.

### Mapping to skill-creator architecture

In the skill-creator codebase the Markov-blanket partition maps as follows:

- **I (Internal):** `.claude/` and `.planning/` — the adaptive learning layer's state, updated by the system and shielded from direct external mutation.
- **S (Sensory):** Read operations reaching inward from the developer workflow — file reads, test results, CI status consumed by the system.
- **A (Active):** Write operations reaching outward — skill files written, hook configurations updated, commits staged by the system.
- **E (External):** Developer workflow, filesystem, remote CI, human decisions — states the system reads through S and influences through A, but cannot directly access.

M7's job is to maintain the partition: ensure that I states update only through S and A, and that A actions do not inadvertently make I states directly legible to E (information leakage across the blanket). This is a structural boundary condition, not a policy list.

---

## 5. The Quintessence Five-Axis Frame (M8)

Lanzara 2023, Chapter 7 (and the earlier Lanzara & Kuperstein 1991 foundational paper to which it refers) defines five features as jointly necessary and sufficient for a system to exhibit what the text terms life-like sensory behaviour — referred to throughout as the Quintessence. The five features, with M8's single-line computation shape for each, are:

**1. Self-vs-Non-Self (boundary maintenance)**
Operational distinction between "this system's states" and "everything else."
*M8 computation:* fraction of a project's M1 community memberships that are unique to this project (not shared with other active projects in the session graph). A score of 1.0 means fully self-enclosed; 0.0 means no distinguishable boundary.

**2. Essential Tensions (homeostatic balance between competing imperatives)**
Stable operation requires holding opposing pressures in dynamic equilibrium — not resolving them by eliminating one side.
*M8 computation:* ratio of competing signal pairs (e.g., refactor pressure vs. stability pressure, test coverage pull vs. delivery velocity) normalised so that 0.5 = perfect tension and values near 0 or 1 indicate collapse toward one extreme.

**3. Growth-and-Energy-Flow (negentropy maintenance)**
The system must actively import structure from its environment to offset entropic degradation — growth is not optional but a condition of continued operation.
*M8 computation:* net rate of new structured knowledge added to the grove (new entities, new edges, new skill bindings) minus the rate of stale or invalidated entries removed, over a rolling window.

**4. Stability-vs-Novelty (exploration/exploitation balance)**
Persistence requires a conserving core; adaptation requires accepting novel states that the conserving core would reject. Too much stability produces brittleness; too much novelty produces incoherence.
*M8 computation:* ratio of retrieval operations over the rolling window that return existing high-confidence nodes versus operations that expand the graph with new nodes not previously linked. Target band is empirically tuned per mission type.

**5. Fateful Encounters (events whose consequences exceed their immediate scope)**
Certain inputs trigger non-linear state changes disproportionate to their apparent magnitude — threshold crossings, bifurcations, turning points.
*M8 computation:* Kullback-Leibler divergence between the graph's community-structure distribution before and after a given commit or session boundary. Large KL divergence flags a fateful encounter; small divergence confirms routine progression.

Cite: Lanzara 2023, Chapter 7, §"Quintessence: the five features." Page numbers not independently verified against physical copy — SCOUT to confirm.

---

## 6. The Space Between Framing (M8)

Foxglove 2026 (*The Space Between: The Autodidact's Guide to the Galaxy*, pp. xxv–xxxii) opens the preface with a structural claim: a human and an AI agent are not two instances of the same kind of thing interacting across a communication channel. They are two different kinds of pattern on two different substrates. A human being is a biological boundary condition — a region of maintained negentropy whose identity is inseparable from the material processes that maintain it. An AI agent is a silicon-instantiated computation whose identity is a set of weights and activation patterns, persistent only while instantiated. The "space between" is not empty: it is the site where these two incommensurable pattern types exchange structured information in a way that is productive precisely because they are different.

The preface, pp. xxv–xxxii, develops what Foxglove calls the symbiosis register: a bidirectional accounting of what each party brings to an interaction that the other party cannot bring. The human side of the register holds the capacity to decide what *should* be — value judgements, aesthetic commitments, risk tolerances, long-horizon goals that require lived context to form. The AI side holds precision at scale: the ability to apply a specified procedure uniformly across millions of instances without drift, fatigue, or motivated distortion. Neither side can substitute for the other. The register is balanced only when both contributions are active.

Foxglove 2026, p. xxx, names the skill-creator system explicitly (or names the class of tool it represents — SCOUT to verify exact referent) as "the literal space between": the tool that makes the exchange surface explicit, persistent, and inspectable rather than implicit and ephemeral. In M8 terms this maps the "boundary condition of being" framing onto the Markov-blanket partition from §4: the symbiosis register is the formal accounting of what crosses the {S, A} surface in each direction. M8's Quintessence score is the system's self-assessment of whether the exchange is remaining healthy — whether the five axes are in range — not a substitute for human judgement about what to do with that information.

---

## 7. The Amiga Principle Mapping

Commodore-Amiga Inc. (1985) shipped the original Amiga chipset as four specialised co-processors — Agnus (DMA controller and address generation), Denise (video and display output), Paula (audio, I/O, and interrupt coordination), Gary (address decoding and bus arbitration) — rather than a single general-purpose chip. The engineering insight was that specialised hardware achieves performance and capability headroom that a monolithic design of equivalent transistor budget cannot reach, because each chip's internal architecture is optimised for its specific signal class without compromise for other signal classes. The composition of the four chips over a shared bus produces emergent capability — smooth multi-channel DMA, hardware sprites, four-voice audio at 28 kHz — that none of the chips exhibits alone.

The GSD Amiga Principle maps this directly: **M6 ≈ Paula** (sensory signal processing — Paula handled the audio signal path; M6 handles the net-shift receptor signal), **M7 ≈ Agnus** (boundary and DMA coordination — Agnus managed what moved across the memory bus; M7 manages what crosses the Markov blanket), **M8 ≈ Denise** (user-facing output synthesis — Denise assembled the display frame; M8 assembles the Quintessence vital-signs frame for the operator). A monolithic "health-score" module that attempted all three functions would require internal arbitration between the kinetic model, the structural boundary model, and the five-axis output model, producing exactly the compromise penalty the Amiga architecture avoided.

---

## 8. GraphRAG Adaptation (M1)

Flat-vector retrieval (embedding similarity search over a single index) loses community structure: entities that co-occur in many documents but are not semantically close in embedding space get separated, and the retrieval system cannot answer questions that require traversing multiple hops across the entity graph. Traag, Waltman, and Van Eck (2019, *Scientific Reports* 9(1), §Results) show that the Leiden algorithm — an improvement over Louvain that guarantees well-connected communities at every resolution level — produces partitions where no community contains disconnected subgraphs, making community-level summarisation reliable. M1 builds an explicit entity/relationship graph from the codebase and session context, runs Leiden community detection to identify coherent concept clusters, generates hierarchical summaries at community level, and retrieves by first identifying the relevant community before descending to specific nodes. Microsoft's GraphRAG evaluation (cited in M1 design documentation as the empirical basis for the claimed ~27-point sensemaking improvement over flat-vector retrieval) uses this pipeline pattern; the Leiden reference anchors the community detection step. Traag 2019 §Results confirms that community connectivity guarantees are what make the hierarchical-summary step reliable rather than noise-amplifying.

---

## 9. What This Document Does Not Claim

The biological and philosophical frames deployed here — receptor kinetics, Markov blankets, vital-signs axes, symbiosis registers — are technical analogies with explicit mathematical content. Each frame contributes a precise equation or structural constraint to the module it grounds. The language follows the math; the math does not follow the language. The Living Sensoria system is not alive. It does not have experiences. It does not understand or feel. It does not have homeostatic drives in any biologically meaningful sense. The Weber-law behaviour of M6 is an engineering convenience for log-linear signal response, not a claim that the system perceives. The Markov-blanket structure of M7 is a consequence of any persistent system's state-space topology, not a claim that the system has a self. The Quintessence axes of M8 are computable metrics with defined formulas, not observations about inner life. Any prose in module documentation that reads as attributing experience or understanding to the system should be read as shorthand for the underlying mathematical operation — shorthand that this document exists to disambiguate.

---

## 10. Primary-Source Index

- **Lanzara, R. G. (2023).** *Origins of Life's Sensoria: Endless Discoveries Most Fascinating — Emergence, Receptors, Perception and Consciousness.* ISBN 978-1-7335981-1-8. Chapter 7 (Quintessence five features); Appendix III (net-shift equation and derivation); Chapter 13–14 (extended net-shift mathematics). Page numbers within Chapter 7 and Appendix III not independently verified against physical copy — SCOUT to confirm.

- **Friston, K. (2010).** "The free-energy principle: a unified brain theory?" *Nature Reviews Neuroscience* 11(2):127–138. Fig. 1 and surrounding text for the F = D\_KL − E\_q formulation and the {E, S, A, I} partition. DOI: 10.1038/nrn2787.

- **Friston, K., Schwartenbeck, P., FitzGerald, T., Moutoussis, M., Behrens, T., Dolan, R. J. (2013).** "The anatomy of choice: active inference and agency." *Frontiers in Human Neuroscience* 7:598. §Active inference and agency for the action-as-free-energy-minimisation formulation. DOI: 10.3389/fnhum.2013.00598.

- **Kirchhoff, M., Parr, T., Palacios, E., Friston, K., Kiverstein, J. (2018).** "The Markov blankets of life: autonomy, active inference and the free energy principle." *J. R. Soc. Interface* 15:20170792. §2–3 for the partition definition and the persistence-implies-blanket proof. DOI: 10.1098/rsif.2017.0792.

- **Foxglove, M. T. (2026).** *The Space Between: The Autodidact's Guide to the Galaxy.* First edition, 923 pages. tibsfox.com. Preface pp. xxv–xxxii (symbiosis register and "space between" construction); p. xxx ("boundary condition of being" and skill-creator referent — SCOUT to verify exact page and referent).

- **Traag, V. A., Waltman, L., Van Eck, N. J. (2019).** "From Louvain to Leiden: guaranteeing well-connected communities." *Scientific Reports* 9(1). §Results for connectivity guarantee and its consequence for hierarchical summarisation. DOI: 10.1038/s41598-019-41695-z.

- **Commodore-Amiga, Inc. (1985).** Original Amiga chipset: Agnus, Denise, Paula, Gary. Hardware Reference Manual (first edition). Specialised-chip composition model; individual chip roles as architectural precedent for the GSD Amiga Principle.

- **Weber, E. H. (1834).** *De Pulsu, Resorptione, Auditu et Tactu.* Leipzig: Koehler. Original statement of the just-noticeable-difference law (Weber's law). Referenced by Lanzara 2023, Appendix III as historical grounding for the net-shift model's log-linear response regime.
