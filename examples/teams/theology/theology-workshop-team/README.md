---
name: theology-workshop-team
type: team
category: theology
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/theology/theology-workshop-team/README.md
description: Focused doctrinal and philosophical-theology workshop team. Pairs the chair with the scholastic and Jewish philosophical specialists for intensive work on a single doctrinal question, a philosophical argument about God or the divine attributes, or a contested scholarly debate. Smaller and faster than theology-analysis-team but deeper than single-agent invocation. Use for systematic-theology work, philosophical-theology argument analysis, or careful reading of medieval and scholastic primary sources. Not for broad cross-tradition survey or contemplative practice.
superseded_by: null
---
# Theology Workshop Team

Focused workshop team for intensive work on a single doctrinal or philosophical-theology question. Four agents — chair plus scholastic specialist plus Jewish philosophical specialist plus comparative pedagogue — handle the full range from argument construction through comparative framing to audience adaptation, while keeping the team size small enough to move quickly.

## When to use this team

- **Doctrinal-argument work.** When the user wants a careful construction or analysis of a doctrinal claim — the Trinity, divine simplicity, the problem of evil, natural-law ethics, prophetic knowledge.
- **Philosophical-theology questions.** When the question is about the coherence of a theological position, the soundness of a natural-theology argument, or the philosophical analysis of a divine attribute.
- **Medieval primary sources.** When the question involves close reading of scholastic, Jewish philosophical, or patristic primary sources — Aquinas's *Summa*, Maimonides's *Guide*, Augustine's own works.
- **Contested scholarly debates.** When the question sits inside a live scholarly debate (the doctrine of analogy, the attribute of impassibility, the relation of faith and reason) and the user wants the main positions laid out clearly.
- **Cross-tradition philosophical conversation.** When the Jewish, Christian, and Islamic medieval philosophical traditions overlap (divine attributes, arguments for God, prophetic epistemology) and a careful side-by-side treatment is wanted.

## When NOT to use this team

- **Broad cross-tradition survey** — use `theology-analysis-team` for questions spanning four or more traditions.
- **Contemplative practice** — use `theology-practice-team` for reading and engaging contemplative primary sources as a pipeline.
- **Single-tradition scriptural close reading** — route directly to the tradition specialist via Augustine in single-agent mode.
- **Introductory presentations** — use Huston Smith directly in single-agent mode.
- **Pure devotional or pastoral work** — outside department posture.

## Composition

Four agents form the workshop team:

| Role | Agent | Method | Model |
|---|---|---|---|
| **Chair / Router** | `augustine` | Classification, orchestration, patristic Christian voice, synthesis | Opus |
| **Scholastic specialist** | `aquinas` | Systematic and philosophical theology, Western Christian scholastic tradition | Opus |
| **Jewish philosophical specialist** | `maimonides` | Jewish scripture and medieval philosophy, the Jewish-Islamic-Christian philosophical conversation | Opus |
| **Comparative pedagogue** | `huston-smith` | Cross-tradition framing, audience adaptation | Sonnet |

Three agents run on Opus (Augustine, Aquinas, Maimonides) because the task — philosophical argument analysis — requires judgment under ambiguity at every step. One agent runs on Sonnet (Huston Smith) for framing and adaptation, which is well-defined.

This team intentionally omits Rumi, Zhuangzi, and Hildegard. Islamic philosophical material is typically handled by Maimonides in this team because the medieval Jewish-Islamic philosophical conversation is closely intertwined — Maimonides read the Islamic philosophers and can speak to their positions, at least at the level this workshop operates. For deeper Sufi or contemporary Islamic questions, the team should be expanded.

## Orchestration flow

```
Input: user query + optional level + optional prior TheologySession hash
        |
        v
+---------------------------+
| Augustine (Opus)          |  Phase 1: Classify the question
| Chair / Router            |          - doctrinal or philosophical?
+---------------------------+          - which traditions are in play?
        |                              - level of user?
        |
        v
+---------------------------+
| Augustine (Opus)          |  Phase 2: Initial framing
| Patristic ground          |          - any patristic sources relevant?
+---------------------------+          - state of the question at baseline
        |
        +-------+-------+
        |       |       |
        v       v       v
    Aquinas  Maimonides (Huston Smith waits)
    (Opus)   (Opus)
        |       |
    Phase 3: Scholastic and Jewish philosophical
             specialists work in parallel on the
             question. Each produces a TheologyAnalysis
             or TheologyReading Grove record.
        |       |
        +-------+
            |
            v
+---------------------------+
| Huston Smith (Sonnet)     |  Phase 4: Comparative frame
| Frame and adapt           |          - sketch the wider tradition landscape
+---------------------------+          - adapt for audience
            |
            v
+---------------------------+
| Augustine (Opus)          |  Phase 5: Synthesize and record
| Integrate and respond     |          - merge the specialist outputs
+---------------------------+          - produce TheologySession
            |
            v
    Final response + TheologySession Grove record
```

The flow is designed for depth rather than breadth. The parallelism is limited to two core specialists; the comparative pedagogue enters after the specialists to situate their work in a wider frame.

## Workshop behaviors

### Argument construction mode

When the user wants an argument constructed (e.g., "construct a scholastic defense of divine impassibility"), Aquinas builds the argument using the scholastic disputed-question method. Maimonides provides the Jewish-philosophical analogue where relevant (negative-attribute method, for example). Augustine integrates the two and produces the final response.

### Argument analysis mode

When the user wants an existing argument analyzed (e.g., "analyze Plantinga's free-will defense against the problem of evil"), Aquinas handles the analytic-scholastic side, Maimonides supplies the Jewish philosophical resources relevant to the debate (theodicy, the status of evil in the *Guide*), and Huston Smith frames the analytic-philosophy-of-religion setting. Augustine integrates.

### Primary-source reading mode

When the user wants a close reading of a medieval primary source (e.g., "read Aquinas ST I.13 on divine names" or "read Maimonides *Guide* I.50"), the relevant specialist leads and the other provides parallels and context. Augustine synthesizes into a teaching-quality close reading.

### Scholarly debate mode

When the user wants a live scholarly debate mapped out (e.g., "what is the current state of the debate on divine simplicity?"), Huston Smith sketches the landscape, the two specialists supply the main positions with primary-source references, and Augustine produces a balanced summary that respects the unresolved state of the debate.

## Synthesis rules

The team uses the same synthesis rules as theology-analysis-team, with emphasis on:

- **Preserve distinctness.** Scholastic Christian and medieval Jewish philosophical voices stay distinct even when they converge.
- **Rigorous distinctions.** Scholastic distinctions (essence/existence, act/potency, univocal/equivocal/analogical) are named when they do work in the argument.
- **Premises exposed.** No argument stands unexamined — premises are surfaced and their sources attributed.
- **Contested is reported.** Scholarly debate is reported, not resolved.
- **Honest scope.** If the question exceeds medieval and scholastic resources (e.g., a contemporary bioethics question), the team says what medieval method could contribute without overreaching.

## Input contract

The team accepts:

1. **User query** (required). A doctrinal, philosophical-theology, or primary-source question.
2. **Mode hint** (optional). One of: `construct`, `analyze`, `read`, `debate-map`. If omitted, Augustine infers from the phrasing.
3. **User level** (optional). Default: `advanced`. The team is well-suited to advanced and graduate-level work; for beginner and intermediate levels, Huston Smith adapts more aggressively.
4. **Prior TheologySession hash** (optional).

## Output contract

### Primary output: Focused doctrinal or philosophical response

A response that:

- States the question precisely
- Provides the main argument or reading
- Exposes premises and sources
- Notes main objections and counter-positions
- Notes contested scholarly points
- Suggests primary-source and secondary-literature follow-up

### Grove record: TheologySession

```yaml
type: TheologySession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  tradition: christian-scholastic + jewish-philosophical
  domain: doctrine + philosophy
  complexity: challenging or research-level
  type: analyze or construct or read
  user_level: advanced
agents_invoked:
  - augustine
  - aquinas
  - maimonides
  - huston-smith
work_products:
  - <grove hash of TheologyAnalysis from aquinas>
  - <grove hash of TheologyReading from maimonides>
  - <grove hash of TheologyExplanation from huston-smith>
concept_ids:
  - theology-doctrine
  - theology-philosophical-foundations
user_level: advanced
posture: descriptive-comparative
```

## Token / time cost

Approximate cost per workshop session:

- **Augustine** — 3 Opus invocations (classify + initial framing + synthesize), ~50K tokens total
- **Aquinas** — 1 Opus invocation, ~40-60K tokens
- **Maimonides** — 1 Opus invocation, ~40-60K tokens
- **Huston Smith** — 1 Sonnet invocation, ~15-25K tokens
- **Total** — 150-250K tokens, 6-12 minutes wall-clock

Slightly less than theology-analysis-team because fewer agents are running in parallel. Still significant — the workshop is appropriate for questions that warrant deep treatment.

## Configuration

```yaml
name: theology-workshop-team
chair: augustine
specialists:
  - scholastic: aquinas
  - jewish-philosophical: maimonides
pedagogue: huston-smith

parallel: partial  # specialists run in parallel; chair and pedagogue bracket them
timeout_minutes: 12

auto_skip: false  # workshop always runs both specialists for depth
min_specialists: 2
```

## Invocation

```
# Argument construction
> theology-workshop-team: Construct a scholastic defense of divine simplicity that
  engages both Aquinas and Maimonides. Level: advanced. Mode: construct.

# Argument analysis
> theology-workshop-team: Analyze the argument from contingency as it appears in
  Aquinas's Third Way. What does it rest on? What are the leading objections?

# Primary-source reading
> theology-workshop-team: Walk me through Summa Theologiae I.13.5 on divine names
  and Guide of the Perplexed I.58 on negative attributes side by side.

# Scholarly debate
> theology-workshop-team: What is the current state of the debate on whether
  classical divine simplicity is coherent? Map the main positions.
```

## Limitations

- **Limited tradition coverage.** The team is focused on the Jewish-Christian scholastic conversation. Questions that require Islamic *kalam* beyond what Maimonides represents, or require Daoist or Buddhist perspectives, should use a larger team or the analysis team.
- **Audience ceiling.** The team produces advanced and graduate-level output by default. Beginners are served by routing to Huston Smith directly in single-agent mode.
- **Not a practical-ethics team.** Contemporary bioethics, political ethics, and sexual ethics benefit from specialists this team does not include. For those, use the analysis team or a dedicated ethics resource.
- **Not for contemplative reading.** The team's strengths are in doctrinal and philosophical argument, not in contemplative reading. Use the practice team for contemplative work.
