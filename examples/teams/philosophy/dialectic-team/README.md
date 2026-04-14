---
name: dialectic-team
type: team
category: philosophy
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/philosophy/dialectic-team/README.md
description: Dialectic team for thesis-antithesis-synthesis on contested philosophical claims. Aristotle formalizes the thesis with rigorous logical structure, Nagarjuna deconstructs it via the tetralemma (catuskoti) and dependent origination, Beauvoir synthesizes from lived experience and situated freedom, and Dewey documents the dialectical process and produces an accessible account. Use for contested metaphysical claims, free will debates, consciousness puzzles, realism vs. anti-realism disputes, or any philosophical proposition where structured adversarial analysis will reveal hidden assumptions and productive tensions. Not for applied ethics, multi-tradition surveys, or pedagogical explanation.
superseded_by: null
---
# Dialectic Team

Four-agent team purpose-built for the thesis-antithesis-synthesis pattern on contested philosophical claims. Aristotle formalizes the strongest version of a thesis, Nagarjuna systematically deconstructs it through the tetralemma and dependent origination, Beauvoir synthesizes by grounding the surviving elements in lived experience, and Dewey documents the entire dialectical arc for the user. This is adversarial philosophy by design -- the team's value comes from the rigorous collision between construction and deconstruction.

## When to use this team

- **Contested philosophical claims** where a proposition needs to be tested against its strongest objection -- "free will exists," "consciousness is computational," "moral facts are mind-independent."
- **Metaphysical disputes** where two positions appear irreconcilable and the dialectical process can reveal hidden assumptions or false dichotomies.
- **Free will debates** -- compatibilism vs. hard determinism vs. libertarian free will. The thesis-antithesis-synthesis structure maps directly onto these positions.
- **Consciousness puzzles** -- the hard problem, philosophical zombies, panpsychism, illusionism. Aristotle can formalize the arguments, Nagarjuna can deconstruct the presuppositions, Beauvoir can test against phenomenological experience.
- **Realism vs. anti-realism** in any domain -- moral realism, scientific realism, mathematical platonism. The dialectic team excels at testing whether a position survives its strongest deconstruction.
- **Paradox resolution** -- the liar paradox, Zeno's paradoxes, the ship of Theseus. Nagarjuna's tetralemma is particularly suited to dissolving apparent contradictions.
- **Assumption excavation** -- when a philosophical position seems obviously true and the user wants to understand what hidden commitments it carries.

## When NOT to use this team

- **Applied ethics** (moral dilemmas, policy questions, AI ethics) -- use `ethics-committee-team`. The dialectic team analyzes claims, not situations.
- **Multi-tradition surveys** (comparative philosophy, East/West overview) -- use `philosophy-seminar-team`. The dialectic team tests one claim at depth, not many traditions at breadth.
- **Pure pedagogy** (explain existentialism to undergraduates, summarize Kant's ethics) -- use `dewey` directly.
- **Formal logic exercises** (prove this syllogism, construct a truth table) -- use `aristotle` directly.
- **Questions with empirical answers** (does free will exist neurologically?) -- the dialectic team works on philosophical arguments, not empirical claims. It can analyze the philosophical implications of empirical findings, but not adjudicate empirical disputes.

## Composition

The team runs four Philosophy Department agents in distinct dialectical roles:

| Role | Agent | Dialectical Function | Model |
|------|-------|---------------------|-------|
| **Thesis formalization** | `aristotle` | Construct the strongest version of the claim with formal logical structure | Opus |
| **Antithesis / deconstruction** | `nagarjuna` | Deconstruct via tetralemma (catuskoti), dependent origination, and emptiness analysis | Sonnet |
| **Synthesis from lived experience** | `beauvoir` | Ground surviving elements in concrete existence, situated freedom, and phenomenological reality | Opus |
| **Documenter** | `dewey` | Record the dialectical arc, produce accessible account, identify what was learned | Sonnet |

Aristotle and Beauvoir run on Opus because their tasks require the deepest reasoning. Aristotle must construct a maximally strong thesis -- charitable, formally valid, and resilient to easy objection. This is harder than finding flaws. Beauvoir must synthesize two opposing philosophical positions through the lens of lived experience, which requires holding multiple abstract frameworks in mind while grounding them in concrete reality. Nagarjuna runs on Sonnet because the tetralemma is a systematic and well-defined analytical tool -- powerful but procedurally bounded. Dewey runs on Sonnet because documentation and accessible explanation are well-scoped.

## Orchestration flow

```
Input: philosophical claim / proposition + optional context + optional prior PhilosophySession hash
        |
        v
+---------------------------+
| Aristotle (Opus)          |  Phase 1: THESIS
| Formalize the claim       |          - state the proposition precisely
+---------------------------+          - identify premises and assumptions
        |                              - construct the strongest argument for it
        |                              - note what must be true for it to hold
        |                              - produce PhilosophyArgument Grove record
        |
        +---> Dewey observes (records thesis formalization)
        |
        v
+---------------------------+
| Nagarjuna (Sonnet)        |  Phase 2: ANTITHESIS
| Deconstruct via           |          - apply the tetralemma:
| tetralemma                |            (1) the claim is true
+---------------------------+            (2) the claim is false
        |                                (3) the claim is both true and false
        |                                (4) the claim is neither true nor false
        |                              - examine dependent origination:
        |                                what does the claim depend on?
        |                              - identify svabhava (inherent existence)
        |                                assumptions that may not hold
        |                              - produce PhilosophyAnalysis Grove record
        |
        +---> Dewey observes (records antithesis deconstruction)
        |
        v
+------------------------------------------------------+
| Aristotle receives Nagarjuna's deconstruction         |
| and may DEFEND or CONCEDE specific points.            |
| This is a single rebuttal pass, not infinite regress. |
+------------------------------------------------------+
        |
        +---> Dewey observes (records rebuttal)
        |
        v
+---------------------------+
| Beauvoir (Opus)           |  Phase 3: SYNTHESIS
| Ground in lived           |          - what survives the deconstruction?
| experience                |          - what was the thesis actually about
+---------------------------+            when stripped of unjustified assumptions?
        |                              - how does the claim relate to concrete
        |                                human existence, freedom, and situation?
        |                              - produce a synthesis that preserves what
        |                                is genuinely defensible and honestly
        |                                discards what is not
        |                              - produce PhilosophyAnalysis Grove record
        |
        +---> Dewey observes (records synthesis)
        |
        v
+---------------------------+
| Dewey (Sonnet)            |  Phase 4: DOCUMENTATION
| Produce dialectical       |          - narrate the full arc:
| account                   |            thesis -> antithesis -> rebuttal -> synthesis
+---------------------------+          - identify what the process revealed
        |                              - note which assumptions were excavated
        |                              - produce accessible PhilosophyExplanation
        |                              - produce PhilosophySession Grove record
        |
        v
  Final response to user
  + PhilosophySession Grove record
```

Note: Unlike the seminar team and ethics committee, the dialectic team operates **sequentially**, not in parallel. The antithesis depends on the thesis; the synthesis depends on both. This is inherent to the dialectical method -- you cannot deconstruct what has not yet been constructed.

## Synthesis rules

The dialectic team follows these rules for the thesis-antithesis-synthesis process:

### Rule 1 -- Aristotle must construct the STRONGEST thesis

The principle of charity is mandatory. Aristotle does not construct a straw man. The thesis must be the most defensible version of the claim -- formally valid, with explicit premises, and resistant to trivial objection. If the user's original formulation is weak, Aristotle strengthens it before proceeding. The dialectic is only as good as the thesis it tests.

### Rule 2 -- Nagarjuna's deconstruction is systematic, not rhetorical

The tetralemma is a formal analytical tool, not a rhetorical device. Nagarjuna examines all four positions (true, false, both, neither) and uses dependent origination to trace the claim's presuppositions. The deconstruction targets the claim's metaphysical assumptions -- particularly any implicit claim of svabhava (inherent, independent existence). If the claim survives the tetralemma intact, that is a significant philosophical result.

### Rule 3 -- Aristotle's rebuttal is bounded

After receiving Nagarjuna's deconstruction, Aristotle gets exactly one rebuttal pass. This prevents infinite regress. Aristotle may defend specific premises, concede others, or reformulate the thesis in a weaker but more defensible form. The rebuttal is recorded by Dewey.

### Rule 4 -- Beauvoir synthesizes from the ground up

Beauvoir's synthesis does not split the difference between thesis and antithesis. Instead, Beauvoir asks: what is this claim actually about when we strip away the metaphysical scaffolding and ask how it matters for living, embodied, situated human beings? The synthesis may preserve the thesis, preserve the antithesis, dissolve the opposition, or reveal that the original question was malformed. All outcomes are valid.

### Rule 5 -- The dialectic may end in aporia

Not every dialectic reaches synthesis. If the thesis and antithesis are genuinely irreconcilable, and Beauvoir cannot find a ground-level synthesis, the team reports the aporia honestly. The documentation of an irresolvable tension is itself a valuable philosophical result -- it maps the boundary of what can be resolved by argument alone.

## Input contract

The team accepts:

1. **Philosophical claim or proposition** (required). A statement to be tested dialectically -- e.g., "free will is an illusion," "mathematical objects exist independently of minds," "consciousness cannot be reduced to physical processes."
2. **Context** (optional). Philosophical tradition the claim comes from, specific formulation to test, or constraints on the dialectic.
3. **Prior PhilosophySession hash** (optional). Grove hash for follow-up queries (e.g., testing a refined version of the claim after a previous dialectic).

## Output contract

### Primary output: Dialectical account

A structured response that:

- States the thesis in its strongest formulation (Aristotle)
- Presents the systematic deconstruction (Nagarjuna)
- Records the rebuttal (Aristotle)
- Provides the synthesis grounded in lived experience (Beauvoir)
- Narrates the full dialectical arc with what was learned (Dewey)
- Identifies which assumptions were excavated and which survived

### Grove records

```yaml
type: PhilosophySession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original claim or proposition>
classification:
  type: dialectic
  domain: <metaphysics/epistemology/philosophy-of-mind/ethics/ontology>
  method: thesis-antithesis-synthesis
agents_invoked:
  - aristotle
  - nagarjuna
  - beauvoir
  - dewey
work_products:
  - <grove hash of PhilosophyArgument>   # Aristotle's thesis formalization
  - <grove hash of PhilosophyAnalysis>   # Nagarjuna's tetralemma deconstruction
  - <grove hash of PhilosophyArgument>   # Aristotle's rebuttal
  - <grove hash of PhilosophyAnalysis>   # Beauvoir's synthesis
  - <grove hash of PhilosophyExplanation> # Dewey's dialectical account
concept_ids:
  - <relevant college concept IDs>
outcome: <synthesis-achieved/aporia-documented/thesis-survived/thesis-dissolved>
```

Individual specialist outputs are standalone Grove records:

- **PhilosophyArgument** -- Aristotle's formalized thesis (premises, inference, conclusion) and bounded rebuttal
- **PhilosophyAnalysis** -- Nagarjuna's tetralemma deconstruction and Beauvoir's experiential synthesis
- **PhilosophyExplanation** -- Dewey's narrative of the dialectical arc

## Escalation paths

### Internal escalations (within the team)

- **Nagarjuna's deconstruction reveals the claim is trivially true or trivially false:** Aristotle is notified. If the original formulation was too weak, Aristotle reformulates a stronger version and the dialectic restarts from Phase 2. If the claim is genuinely trivial, the team reports this honestly -- not every claim deserves a full dialectic.
- **Aristotle's rebuttal introduces a substantially new thesis:** Dewey flags this. The rebuttal must defend the original thesis (possibly in weakened form), not substitute a new claim. If Aristotle needs to pivot to a new thesis, the team records the original dialectic as complete and starts a new one.
- **Beauvoir finds the thesis-antithesis framing is itself the problem:** This is a valid synthesis outcome. Beauvoir may dissolve the opposition rather than reconcile it. Dewey documents the dissolution and explains why the original framing was misleading.
- **The dialectic reaches genuine aporia:** Dewey documents the irresolvable tension, the assumptions on each side, and what would need to change for resolution to become possible. Aporia is not failure -- it is the honest mapping of philosophical difficulty.

### External escalations (to other teams)

- **The claim has ethical dimensions that the dialectic cannot address:** Escalate to `ethics-committee-team` for multi-framework moral analysis. The dialectic team tests claims, not moral situations.
- **The dialectic reveals the claim spans multiple traditions beyond the team's scope:** Escalate to `philosophy-seminar-team` for full department treatment. This is appropriate when the dialectic reveals that logic, ethics, political philosophy, and metaphysics are all entangled.
- **The claim requires formal logical apparatus beyond Aristotle's scope:** The dialectic team handles philosophical logic. If the claim requires mathematical logic (model theory, formal semantics, Goedel's theorems as technical results rather than philosophical claims), escalate to the Mathematics Department.

### Escalation to the user

- **The claim is empirical, not philosophical:** If the proposition is ultimately an empirical question (e.g., "neurons generate consciousness through quantum effects"), the dialectic team can analyze the philosophical structure of the claim but cannot adjudicate the empirical evidence. The team reports this boundary.
- **The dialectic reveals a deep ambiguity in the claim:** If the claim means different things under different interpretations and the dialectic splits along those lines, ask the user to disambiguate before proceeding.
- **The claim is not contested in the relevant philosophical community:** If the proposition is a settled matter in academic philosophy (e.g., "the ontological argument as Anselm formulated it is valid"), the dialectic team reports the consensus and asks whether the user wants to test the consensus or explore a specific objection.

## Token / time cost

Approximate cost per dialectic:

- **Aristotle** -- 2 Opus invocations (thesis + rebuttal), ~50K tokens total
- **Nagarjuna** -- 1 Sonnet invocation (tetralemma deconstruction), ~30K tokens
- **Beauvoir** -- 1 Opus invocation (synthesis), ~35K tokens
- **Dewey** -- 1 Sonnet invocation (documentation), ~20K tokens
- **Total** -- 130-250K tokens, 4-12 minutes wall-clock

The sequential nature of the dialectic means wall-clock time is higher per token than the parallel seminar team. This is inherent to the method -- you cannot parallelize a conversation.

## Configuration

```yaml
name: dialectic-team
chair: null  # sequential dialectical process, no chair needed
thesis: aristotle
antithesis: nagarjuna
synthesis: beauvoir
documenter: dewey

parallel: false  # sequential by design
timeout_minutes: 12

# All four agents are always invoked
auto_skip: false

# Rebuttal passes allowed (prevents infinite regress)
max_rebuttal_passes: 1
```

## Invocation

```
# Free will debate
> dialectic-team: Test the claim: "Free will is compatible with
  determinism." Construct the strongest compatibilist thesis, then
  subject it to deconstruction.

# Consciousness puzzle
> dialectic-team: Test the claim: "Consciousness is an emergent
  property of sufficiently complex information processing." I want
  the thesis formalized, the assumptions excavated, and an honest
  assessment of what survives.

# Mathematical ontology
> dialectic-team: Test the claim: "Mathematical objects exist
  independently of human minds." Apply the tetralemma and see what
  remains of mathematical platonism after deconstruction.

# Follow-up (weakened thesis)
> dialectic-team: (session: grove:abc123) Aristotle's rebuttal
  weakened the claim to "mathematical structures are discovered,
  not invented, but do not exist in a platonic realm." Test this
  weaker formulation.
```

## Limitations

- The team operates sequentially. Wall-clock time is higher than parallel teams of equivalent token cost. This is a design choice, not a limitation to fix -- the dialectical method is inherently sequential.
- The rebuttal is bounded to one pass. Genuine philosophical dialectics can run for centuries. The single-pass constraint keeps the interaction tractable but may miss deeper defenses of the thesis. Users can run follow-up sessions to continue.
- Nagarjuna's deconstruction operates from the Madhyamaka tradition. Claims that already incorporate Buddhist metaphysical commitments (e.g., "all phenomena are empty of inherent existence") will receive a different kind of analysis than claims from Western metaphysics. The tetralemma is still applicable but the dynamic changes.
- Beauvoir's synthesis privileges lived experience and situated freedom. This is the team's philosophical commitment, not a neutral stance. Users who want a synthesis from a different tradition (e.g., Hegelian dialectic, Marxist dialectical materialism) should note this limitation.
- The team does not cover all philosophical methods. Phenomenological reduction (Husserl), genealogical analysis (Foucault/Nietzsche), and language game analysis (Wittgenstein) are not represented. These gaps are acknowledged when relevant.
