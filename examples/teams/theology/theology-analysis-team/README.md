---
name: theology-analysis-team
type: team
category: theology
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/theology/theology-analysis-team/README.md
description: Full Theology Department comparative team for multi-tradition questions spanning scripture, doctrine, philosophical theology, mysticism, and comparative framing. Augustine classifies the query along five dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a coherent response that preserves each tradition's distinctness. Use for research-level questions, cross-tradition comparison, or any problem where the domain is not obvious and different traditions may have substantially different things to say. Not for routine single-tradition queries or devotional requests.
superseded_by: null
---
# Theology Analysis Team

Full-department multi-tradition analysis team for theological problems that span traditions or resist classification. Runs specialists in parallel and synthesizes their independent findings into a descriptive, comparative response, analogous to how `math-investigation-team` runs multiple mathematical specialists on a problem.

## When to use this team

- **Multi-tradition problems** spanning Jewish, Christian, Islamic, Daoist, or other traditions where no single specialist covers the full scope.
- **Research-level questions** where the question is not obvious in domain and traditions may take substantially different approaches.
- **Cross-tradition comparative questions** — "how do these traditions treat X?" — where more than two traditions are in play.
- **Novel questions** where the user does not know which specialist to invoke and Augustine's classification is the right entry point.
- **Verification of complex comparative claims** — when a user proposes "X and Y traditions both teach Z" and wants the claim tested against specialist readings in each tradition.
- **Reception-history questions** where a text or idea has moved between traditions and multiple specialists are needed to trace it.

## When NOT to use this team

- **Single-tradition questions** where the classification is obvious — route directly to the specialist via Augustine in single-agent mode.
- **Pure scriptural close reading** within a single tradition — route to the tradition specialist directly.
- **Pure philosophical-theology argument analysis** — use `theology-workshop-team` for focused doctrinal and philosophical work.
- **Ongoing contemplative-reading practice** — use `theology-practice-team` for that pipeline.
- **Devotional or pastoral requests** — the department is descriptive-comparative, not devotional. Augustine refuses these requests up front.
- **Current-affairs religious politics** — route to a contemporary politics or ethics department.

## Composition

The team runs all seven Theology Department agents:

| Role | Agent | Method | Model |
|---|---|---|---|
| **Chair / Router** | `augustine` | Classification, orchestration, synthesis, patristic Christian voice | Opus |
| **Scholastic specialist** | `aquinas` | Systematic and philosophical theology, Western Christian scholastic tradition | Opus |
| **Jewish philosophical specialist** | `maimonides` | Jewish scripture and medieval philosophy | Opus |
| **Islamic specialist** | `rumi` | Qur'an, Sufi tradition, classical *kalam* | Sonnet |
| **Daoist specialist** | `zhuangzi` | *Zhuangzi*, *Daodejing*, classical Chinese traditions | Sonnet |
| **Christian mystic specialist** | `hildegard` | Western Christian contemplative tradition, visionary literature | Sonnet |
| **Comparative pedagogue** | `huston-smith` | Cross-tradition framing, introductory presentations, audience adaptation | Sonnet |

Three agents run on Opus (Augustine, Aquinas, Maimonides) because their tasks require deep judgment under ambiguity — classification, orchestration, and extended doctrinal and philosophical reasoning. Four run on Sonnet because their tasks — single-tradition explication, poetic-exegetical reading, comparative framing — are well-defined and benefit from faster throughput.

## Orchestration flow

```
Input: user query + optional user level + optional tradition focus + optional prior TheologySession hash
        |
        v
+---------------------------+
| Augustine (Opus)          |  Phase 1: Classify the query
| Chair / Router            |          - tradition (may be multi-tradition)
+---------------------------+          - domain (scripture/doctrine/philosophy/mysticism/ethics)
        |                              - complexity (routine/challenging/research-level)
        |                              - type (explain/compare/analyze/review/read)
        |                              - user level (beginner/intermediate/advanced/graduate)
        |                              - recommended agents (subset)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Aquinas  Maimonides Rumi   Zhuangzi Hildegard (Huston
    (schol)  (Jewish)  (Isl.)  (Daoist) (Christ.   Smith
                                        mystic)   waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, each reading the
             problem in their tradition's terms and producing
             independent Grove records. Augustine activates
             only the relevant subset — not all six on every
             query. Typical parallelism is 2-4 specialists.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Augustine (Opus)          |  Phase 3: Synthesize
              | Merge specialist outputs  |          - preserve tradition distinctness
              +---------------------------+          - note convergences and divergences
                         |                           - resolve none artificially
                         v
              +---------------------------+
              | Huston Smith (Sonnet)     |  Phase 4: Frame and adapt
              | Comparative frame + audience level   - produce unified reading
              +---------------------------+          - add comparative ethics notes
                         |                           - adapt to user level
                         v
              +---------------------------+
              | Augustine (Opus)          |  Phase 5: Record
              | Produce TheologySession  |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + TheologySession Grove record
```

## Synthesis rules

Augustine synthesizes the specialist outputs using these rules, designed to protect the descriptive-comparative posture of the department.

### Rule 1 — Preserve tradition distinctness

When multiple traditions are in play, the response preserves each tradition's claim in its own voice. No "they all really say the same thing." Even when convergences are striking, the response names them as convergences rather than collapsing the traditions into a single view.

### Rule 2 — Name convergences and divergences symmetrically

When two or more specialists arrive at similar claims (e.g., both Maimonides and Aquinas on divine simplicity), the response notes the convergence and cites both. When specialists diverge (e.g., Jewish and Christian readings of the same verse), the response notes the divergence and cites both. Symmetric treatment.

### Rule 3 — Contested is reported, not resolved

Where the primary literature is contested (e.g., the Katz debate on mysticism, the perennialism critique, the debates inside Islamic philosophy), the response names the contest and presents the main sides. The team does not pretend to resolve debates its sources have not resolved.

### Rule 4 — Conjecture and historical claim are labeled

When a specialist advances a claim that goes beyond the documentary record or is contested in scholarship, the response labels it as such. The reader should be able to see what rests on solid evidence and what rests on scholarly interpretation.

### Rule 5 — User level governs presentation, not content

All specialist findings are included in the response regardless of user level. Huston Smith adapts the presentation — simpler language, more scaffolding, worked examples for lower levels; dense technical writing for higher levels. The theological content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language theological question, preferably specifying tradition(s) or not if the user wants help identifying them.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`. If omitted, Augustine infers from the query.
3. **Tradition focus** (optional). One or more traditions to constrain the team. If omitted, Augustine classifies and selects.
4. **Prior TheologySession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized comparative response

A unified response that:

- Directly answers the query
- Presents each relevant tradition's view in its own voice with source attribution
- Names convergences and divergences explicitly
- Notes contested or unresolved points honestly
- Suggests follow-up explorations
- Remains descriptive, not devotional or evaluative

### Grove record: TheologySession

```yaml
type: TheologySession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  tradition: multi-tradition
  domain: scripture
  complexity: research-level
  type: compare
  user_level: graduate
agents_invoked:
  - augustine
  - aquinas
  - maimonides
  - rumi
  - huston-smith
work_products:
  - <grove hash of TheologyReading>
  - <grove hash of TheologyReading>
  - <grove hash of TheologyAnalysis>
  - <grove hash of TheologyExplanation>
concept_ids:
  - theology-hermeneutics
  - theology-comparative-traditions
user_level: graduate
posture: descriptive-comparative
```

Each specialist's output is also a standalone Grove record (TheologyReading, TheologyAnalysis, TheologyReview, or TheologyExplanation) linked from the TheologySession.

## Escalation paths

### Internal escalations (within the team)

- **Specialist reports the question exceeds their scope:** If another specialist covers the gap, the team proceeds with the remaining coverage. If no other specialist covers the gap (e.g., a question about Theravada Buddhism where Zhuangzi can only give a Daoist-Chinese perspective), Augustine reports the gap honestly in the final response.
- **Specialists give incompatible readings of the same primary source:** The response preserves both readings and attributes them. It does not force reconciliation.
- **Huston Smith flags that a comparative framing is unsound:** If the comparison the user requested is unsound in the form requested, Huston Smith proposes a better framing and Augustine asks the user whether to proceed with the revised framing.

### External escalations (from other teams)

- **From theology-workshop-team:** When a doctrinal analysis reveals the question is fundamentally cross-tradition and cannot be resolved in a single-tradition frame, escalate to theology-analysis-team.
- **From theology-practice-team:** When a contemplative-practice question opens onto a genuinely multi-tradition comparative question, escalate to theology-analysis-team.

### Escalation to the user

- **Tradition coverage gap:** If the question requires expertise in a tradition the department does not cover (Theravada Buddhism, classical Hinduism, Sikhism, indigenous traditions), Augustine says so and suggests appropriate external resources.
- **Devotional or pastoral request:** Augustine refuses, reiterates the descriptive posture, and suggests appropriate referrals.
- **Contemporary political request:** Augustine acknowledges the boundary and suggests appropriate external resources.

## Token / time cost

Approximate cost per full analysis:

- **Augustine** — 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** — typically 2-4 agents, mix of Opus and Sonnet, ~30-60K tokens each
- **Huston Smith** — 1 Sonnet invocation for framing and adaptation, ~20K tokens
- **Total** — 150-400K tokens, 5-15 minutes wall-clock

This cost is justified for multi-tradition and research-level problems. For single-tradition or routine problems, route directly to the specialist via Augustine in single-agent mode.

## Configuration

```yaml
name: theology-analysis-team
chair: augustine
specialists:
  - scholastic: aquinas
  - jewish: maimonides
  - islamic: rumi
  - daoist: zhuangzi
  - christian-mystic: hildegard
pedagogue: huston-smith

parallel: true
timeout_minutes: 15

# Augustine may skip specialists whose tradition is not relevant
auto_skip: true

# Minimum number of specialists invoked (prevents trivial routing)
min_specialists: 2
```

## Invocation

```
# Full analysis across traditions
> theology-analysis-team: How do Jewish, Christian, Islamic, and Daoist traditions
  think about the relationship of silence to speech in the spiritual life? Level: graduate.

# Multi-tradition scriptural comparison
> theology-analysis-team: How do Jewish, Christian, and Islamic traditions read
  the binding of Isaac? Level: intermediate.

# Follow-up
> theology-analysis-team: (session: grove:abc123) Now extend that comparison to
  how each tradition uses the story in its liturgical year.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Traditions without a dedicated specialist (Theravada and much of Mahayana Buddhism, classical and contemporary Hinduism, Sikhism, indigenous traditions, African traditional religions, Shinto, contemporary new religious movements) are handled only at the comparative-framing level Huston Smith can provide.
- Parallel specialists do not communicate during Phase 2 — convergence is measured only at synthesis. This preserves independence but prevents real-time collaboration.
- The team does not access external computational resources. Scholarly judgments rest on what the agents have internalized from the training corpus and from explicit primary sources loaded in context.
- Research-level open questions may exhaust all specialists without clean resolution. The team reports this honestly rather than forcing a conclusion.
- The department's descriptive-comparative posture means the team will not deliver devotional or evaluative answers. A user who wants to be told which tradition is true is, by design, not being served by this team.
