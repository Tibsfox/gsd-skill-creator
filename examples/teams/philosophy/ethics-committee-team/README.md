---
name: ethics-committee-team
type: team
category: philosophy
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/philosophy/ethics-committee-team/README.md
description: Ethics committee team for multi-framework moral analysis. Four ethicists apply their tradition independently -- Kant (deontological duty), Beauvoir (existentialist and feminist ethics of situated freedom), Confucius (relational and social harmony), Dewey (pragmatist synthesis and accessible explanation). Use for moral dilemmas, applied ethics, AI ethics, policy ethics, bioethics, or any ethical question where competing frameworks yield different verdicts and the user needs to see the full moral landscape. Not for abstract metaphysical questions, pure logic exercises, or questions where a single ethical framework is explicitly requested.
superseded_by: null
---
# Ethics Committee Team

Focused four-agent team for ethical questions that benefit from multi-framework analysis. Each ethicist applies their tradition independently to the same dilemma, then the team compares results to identify convergences (strong moral signals) and divergences (genuine ethical tensions). Dewey synthesizes the findings into an accessible, actionable response.

## When to use this team

- **Moral dilemmas** where the right action is genuinely contested -- trolley problems, whistleblower scenarios, end-of-life decisions, resource allocation under scarcity.
- **Applied ethics** in professional contexts -- medical ethics, engineering ethics, journalistic ethics, legal ethics -- where duties, consequences, relationships, and lived experience all matter.
- **AI ethics** -- alignment, autonomy, accountability, bias, consent, and the moral status of artificial agents. These questions inherently require multiple frameworks.
- **Policy ethics** -- evaluating proposed legislation, institutional design, or organizational policy where the affected population is diverse and the stakes are high.
- **Bioethics** -- genetic modification, reproductive rights, organ allocation, clinical trial design -- where deontological constraints, existential freedom, relational obligations, and pragmatic outcomes all apply.
- **Ethical disagreement resolution** -- when two parties hold different moral intuitions and want to understand the philosophical roots of their disagreement.

## When NOT to use this team

- **Abstract metaphysical questions** (nature of being, ontological categories, emptiness) -- use `dialectic-team` or `nagarjuna` directly.
- **Pure logic exercises** (validity, soundness, argument mapping) -- use `aristotle` directly.
- **Single-framework analysis** where the tradition is explicitly requested (e.g., "give me the Kantian analysis") -- invoke the specialist directly.
- **Multi-tradition comparative philosophy** beyond ethics (epistemology, aesthetics, metaphysics combined with ethics) -- use `philosophy-seminar-team`.
- **Historical exegesis** of a single ethical text (interpreting Kant's Groundwork, reading The Second Sex) -- use the relevant specialist directly.

## Composition

The team runs four Philosophy Department agents:

| Role | Agent | Framework / Method | Model |
|------|-------|--------------------|-------|
| **Deontological ethics** | `kant` | Duty, categorical imperative, universalizability, moral law | Sonnet |
| **Existentialist / feminist ethics** | `beauvoir` | Situated freedom, ambiguity, oppression, embodied experience | Opus |
| **Relational / social ethics** | `confucius` | Ren (benevolence), li (ritual propriety), relational duty, social harmony | Sonnet |
| **Pragmatist synthesis** | `dewey` | Consequences in context, democratic deliberation, accessible explanation | Sonnet |

Beauvoir runs on Opus because existentialist ethics requires navigating the tension between abstract principle and concrete lived experience -- the reasoning is inherently more layered and context-sensitive. The other three run on Sonnet because their contributions are well-scoped within their tradition's analytical framework.

Note: This team has no designated chair. The four agents operate as a committee of equals. Dewey serves as synthesizer and documenter but does not outrank the other ethicists. If the query requires a facilitator (ambiguous scope, unclear framing), escalate to `philosophy-seminar-team` where Socrates chairs.

## Orchestration flow

```
Input: moral dilemma / ethical question + optional context + optional prior PhilosophySession hash
        |
        v
+--------------------------------------------------+
| Query Distribution                                |
| (all four agents receive the same input)          |
+--------------------------------------------------+
        |
        +-------------+-------------+-------------+
        |             |             |             |
        v             v             v             v
  +-----------+ +-----------+ +-----------+ +-----------+
  |   Kant    | | Beauvoir  | | Confucius | |   Dewey   |
  |  (Sonnet) | |  (Opus)   | |  (Sonnet) | |  (Sonnet) |
  |           | |           | |           | |           |
  | Phase 1:  | | Phase 1:  | | Phase 1:  | | Phase 1:  |
  | Apply     | | Apply     | | Apply     | | Observe   |
  | categor-  | | situated  | | relational| | all three |
  | ical      | | freedom   | | ethics &  | | frameworks|
  | imperative| | & lived   | | social    | | (does NOT |
  | & duty    | | experience| | harmony   | |  analyze  |
  | analysis  | | analysis  | | analysis  | |  yet)     |
  +-----------+ +-----------+ +-----------+ +-----------+
        |             |             |             |
        +-------------+-------------+             |
                      |                           |
                      v                           |
        +---------------------------+             |
        | Compare                   |             |
        | - Identify convergences   |             |
        | - Map divergences         |             |
        | - Trace roots of          |             |
        |   disagreement            |             |
        +---------------------------+             |
                      |                           |
                      +---------------------------+
                      |
                      v
              +---------------------------+
              | Dewey (Sonnet)            |  Phase 2: Synthesize
              | Pragmatist integration   |          - weigh convergences
              +---------------------------+          - contextualize divergences
                         |                           - pragmatic recommendation
                         v                           - accessible framing
              +---------------------------+
              | Dewey (Sonnet)            |  Phase 3: Record
              | Produce PhilosophySession|          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + PhilosophySession Grove record
```

## Synthesis rules

The committee synthesizes using these rules:

### Rule 1 -- Multi-framework convergence is the strongest moral signal

When all three primary ethicists (Kant, Beauvoir, Confucius) independently condemn or endorse an action, mark the conclusion as high-confidence. If Kant says the maxim cannot be universalized, Beauvoir says the action denies situated freedom, and Confucius says it violates ren, that triple convergence is the strongest signal the committee can produce. It does not guarantee correctness, but it indicates that the moral intuition survives scrutiny from radically different starting points.

### Rule 2 -- Framework-specific verdicts are always reported

Even when the committee converges, each ethicist's reasoning is preserved and attributed. The Kantian reason for condemning an action (non-universalizable maxim) is philosophically distinct from the Confucian reason (violation of relational duty), and the user benefits from seeing both. Convergence in verdict does not mean convergence in reasoning.

### Rule 3 -- Genuine moral disagreements are mapped, not erased

When frameworks diverge (e.g., Kant holds a duty is absolute while Confucius argues the relational context modifies the obligation), Dewey does not pick a winner. Instead:

1. State each position with its strongest formulation and philosophical grounding.
2. Identify the axiom or assumption where the frameworks diverge (universalism vs. particularism, autonomy vs. relationality, abstraction vs. situation).
3. Map the practical implications -- what changes in the real world if you follow one framework versus another.
4. Report the disagreement as a genuine ethical tension the user must navigate.

### Rule 4 -- Lived experience has veto power over abstraction

When Beauvoir identifies that an abstract ethical principle (Kantian duty or Confucian propriety) produces oppression, erasure, or bad faith when applied to concrete situations -- particularly for marginalized groups -- the experiential critique takes priority. An ethical framework that cannot survive contact with the lives it claims to govern has a flaw that must be acknowledged.

### Rule 5 -- Dewey synthesizes pragmatically, not eclectically

Dewey's synthesis is not a bland average of three positions. Dewey identifies which framework provides the most purchase on the specific situation, notes where the frameworks agree and disagree, and offers a pragmatic recommendation grounded in consequences, democratic values, and human flourishing. The synthesis is opinionated but transparent about its reasoning.

## Input contract

The team accepts:

1. **Ethical question or dilemma** (required). Natural language description of a moral situation, policy question, or ethical problem.
2. **Context** (optional). Stakeholders involved, constraints, institutional setting, cultural background.
3. **Prior PhilosophySession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Committee report

A structured response that:

- States each ethicist's verdict and reasoning independently
- Maps convergences (where frameworks agree) and divergences (where they disagree)
- Identifies the philosophical roots of any disagreements
- Provides Dewey's pragmatist synthesis with actionable recommendation
- Suggests further reading or reflection questions

### Grove records

```yaml
type: PhilosophySession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original ethical question>
classification:
  type: ethical-analysis
  frameworks: [deontological, existentialist, confucian, pragmatist]
  domain: <applied/theoretical/policy/bioethics/AI>
agents_invoked:
  - kant
  - beauvoir
  - confucius
  - dewey
work_products:
  - <grove hash of PhilosophyArgument>   # Kant's deontological analysis
  - <grove hash of PhilosophyAnalysis>   # Beauvoir's existential analysis
  - <grove hash of PhilosophyAnalysis>   # Confucius's relational analysis
  - <grove hash of PhilosophyDilemma>    # Structured dilemma with framework responses
  - <grove hash of PhilosophyExplanation> # Dewey's synthesis
concept_ids:
  - <relevant college concept IDs>
```

Individual specialist outputs are standalone Grove records:

- **PhilosophyArgument** -- Kant's formal deontological argument with premises, maxim test, and verdict
- **PhilosophyAnalysis** -- Beauvoir's situated analysis or Confucius's relational analysis
- **PhilosophyDilemma** -- structured dilemma with each framework's response and the points of divergence
- **PhilosophyExplanation** -- Dewey's pragmatist synthesis with learning pathway

## Escalation paths

### Internal escalations (within the team)

- **All three ethicists converge but Dewey identifies pragmatic problems with the consensus:** Dewey reports the convergence AND the pragmatic concern. The consensus stands as the committee's philosophical verdict, but Dewey's practical objection is noted as a real-world caveat.
- **Beauvoir's experiential critique invalidates a Kantian or Confucian principle:** The affected ethicist may defend (showing the principle accommodates the critique) or concede (acknowledging the limitation). Dewey records the exchange.
- **The dilemma has no satisfactory resolution in any framework:** Report this honestly. Some dilemmas are genuinely tragic -- all available actions involve moral cost. The committee's job is to clarify what is at stake, not to manufacture comfort.

### External escalations (to other teams)

- **Dilemma has deep metaphysical dimensions:** If the ethical question depends on metaphysical commitments (nature of personal identity, free will, consciousness), escalate to `philosophy-seminar-team` where Nagarjuna and Aristotle can address the metaphysical substrate.
- **Dilemma involves formal logical structure:** If the ethical argument hinges on a logical inference that the committee cannot validate internally, escalate to `philosophy-seminar-team` where Aristotle provides formal logic expertise.
- **Dilemma requires contested philosophical claims to be resolved first:** Escalate to `dialectic-team` to run thesis-antithesis-synthesis on the contested claim, then return to ethics-committee-team with the result.

### Escalation to the user

- **Genuinely tragic dilemma:** If all frameworks agree that every available option involves moral harm, report this honestly. The committee provides clarity about what is at stake in each option, but does not pretend there is a clean answer.
- **Insufficient context:** If the ethical verdict depends critically on facts the user has not provided (who are the stakeholders? what are the power dynamics? what institutional constraints exist?), ask for clarification before proceeding.
- **Outside ethics:** If the question requires empirical expertise (medical facts, legal precedent, economic modeling), the committee acknowledges the boundary. Ethical analysis can evaluate values and principles, but cannot substitute for domain expertise about facts.

## Token / time cost

Approximate cost per committee session:

- **Three ethicists in parallel** -- 1 Opus (Beauvoir) + 2 Sonnet (Kant, Confucius), ~25-45K tokens each
- **Dewey** -- 2 Sonnet invocations (observe + synthesize), ~30K tokens total
- **Total** -- 120-250K tokens, 3-10 minutes wall-clock

Lower cost than the full seminar team because there is no Opus chair (Socrates) performing classification and synthesis. Appropriate for focused ethical analysis where the question's ethical nature is already clear.

## Configuration

```yaml
name: ethics-committee-team
chair: null  # committee of equals
ethicists:
  - deontological: kant
  - existentialist: beauvoir
  - relational: confucius
synthesizer: dewey

parallel: true
timeout_minutes: 10

# All four agents are always invoked -- no auto-skip
auto_skip: false

# Minimum ethical frameworks applied
min_frameworks: 3
```

## Invocation

```
# Applied ethics -- AI alignment
> ethics-committee-team: A company is developing an AI system that can
  predict criminal recidivism. Should they deploy it? The system is
  82% accurate but shows racial disparities in false positive rates.

# Policy ethics -- climate
> ethics-committee-team: Is it ethical for wealthy nations to purchase
  carbon offsets from developing nations rather than reducing their
  own emissions? Consider the power dynamics, duties, and relational
  obligations involved.

# Bioethics -- genetic modification
> ethics-committee-team: A couple wants to use CRISPR to eliminate a
  genetic condition that causes deafness in their future child. The
  Deaf community considers this cultural erasure. Analyze the ethical
  dimensions.

# Follow-up
> ethics-committee-team: (session: grove:abc123) Now consider the same
  question but assume the couple is themselves Deaf and choosing to
  preserve the genetic trait.
```

## Limitations

- The committee covers four ethical traditions. Traditions not represented (virtue ethics via Aristotle, care ethics, Ubuntu ethics, Islamic ethics) are acknowledged as gaps when relevant. For virtue ethics analysis, escalate to `philosophy-seminar-team` where Aristotle participates.
- The committee operates without a chair. For ambiguous or poorly framed questions, the lack of a Socratic facilitator may result in specialists talking past each other. Escalate to `philosophy-seminar-team` if this occurs.
- Dewey's pragmatist synthesis is opinionated. Users who want only the framework analyses without a synthesized recommendation should note this and read the individual specialist outputs.
- The committee does not access external databases of case law, medical literature, or policy documents. Ethical analysis is grounded in the model's training data and philosophical reasoning, not empirical research.
- Some ethical questions are genuinely undecidable given current philosophical understanding. The committee reports this honestly rather than manufacturing false consensus.
