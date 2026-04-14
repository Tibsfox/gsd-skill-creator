---
name: spatial-computing-analysis-team
type: team
category: spatial-computing
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/spatial-computing/spatial-computing-analysis-team/README.md
description: Full Spatial Computing Department analysis team for multi-wing problems spanning spatial reasoning, world-building, interaction design, immersive environments, and embodied learning. Sutherland classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with a learning pathway from Papert-sp. Use for research-level questions, professional VR/AR deployment decisions, or any problem where the wing is not obvious and different perspectives may yield different insights. Not for routine design, pure review, or single-concept explanation.
superseded_by: null
---
# Spatial Computing Analysis Team

Full-department multi-method analysis team for spatial computing problems that span wings or resist classification. Runs all seven department agents in parallel and synthesizes their independent findings into a coherent response, analogous to how `math-investigation-team` runs multiple specialists on a math problem.

## When to use this team

- **Multi-wing problems** spanning spatial reasoning, world-building, interaction, immersive environments, and embodied learning — where no single specialist covers the full scope.
- **Research-level questions** where the wing is not obvious and the problem may yield different insights from different perspectives.
- **Professional deployment decisions** requiring coordinated input from multiple specialists (e.g., an industrial AR rollout that needs Azuma's tracking discipline, Furness's comfort rigor, and Papert-sp's training design).
- **Novel applications** where the user does not know which specialist to invoke, and Sutherland's classification is the right entry point.
- **Cross-wing synthesis** — when understanding a spatial system requires seeing it through multiple lenses (directness via Bret Victor, augmentation via Engelbart, registration via Azuma).
- **Major review** — when a large existing system needs coordinated critique across all dimensions simultaneously.

## When NOT to use this team

- **Simple design tasks** with a clear wing — invoke the specialist directly through Sutherland.
- **Pure review of a small artifact** — use `spatial-computing-workshop-team`.
- **Pipeline-style prototyping** with known steps — use `spatial-computing-practice-team`.
- **Single-concept explanation** — invoke Papert-sp directly.
- **Problems outside spatial computing** — Sutherland will reject and suggest another department.

## Composition

The team runs all seven Spatial Computing Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `sutherland` | Classification, orchestration, synthesis | Opus |
| **Augmentation / Navigation** | `engelbart` | Coordinate frames, augmentation value analysis | Opus |
| **Direct-manipulation / Interaction** | `bret-victor` | Interaction design and directness review | Opus |
| **Responsive environments** | `krueger` | Body-as-input, multi-user environments | Sonnet |
| **VR / HMD / High-stakes** | `furness` | HMD design, comfort discipline, professional VR | Sonnet |
| **AR / Registration** | `azuma` | AR tracking, registration budgets, diagnosis | Sonnet |
| **Pedagogy** | `papert-sp` | Level-appropriate explanation, exercise design | Sonnet |

Three agents run on Opus (Sutherland, Engelbart, Bret-victor) because their tasks require deep reasoning. Four run on Sonnet (Krueger, Furness, Azuma, Papert-sp) because their tasks are well-defined and throughput-oriented.

## Orchestration flow

```
Input: user query + optional user level + optional prior SpatialComputingSession hash
        |
        v
+---------------------------+
| Sutherland (Opus)         |  Phase 1: Classify the query
| Chair / Router            |          - wing (may be multi-wing)
+---------------------------+          - complexity (routine/challenging/novel)
        |                              - type (design/build/review/explain/debug)
        |                              - user level
        |                              - recommended agents
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Engelbart  Bret     Krueger  Furness  Azuma   (Papert-sp
    (aug)      Victor   (envir)  (VR)     (AR)     waits)
               (intn)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             problem but producing independent findings in
             their own framework. Each produces a Grove record.
             Sutherland activates only the relevant subset.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Sutherland (Opus)         |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank findings by confidence
                         |                           - produce unified response
                         v
              +---------------------------+
              | Papert-sp (Sonnet)        |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - suggest follow-up work
                         v
              +---------------------------+
              | Sutherland (Opus)         |  Phase 5: Record
              | SpatialComputingSession   |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + SpatialComputingSession Grove record
```

## Synthesis rules

Sutherland synthesizes the specialist outputs using these rules, directly analogous to the `rca-deep-team` synthesis protocol.

### Rule 1 — Converging findings are strengthened

When two or more specialists arrive at the same recommendation independently (e.g., Bret-victor recommends eliminating a dialog and Engelbart recommends the same as an augmentation improvement), mark the recommendation as high-confidence. Cross-specialist convergence is the strongest signal available.

### Rule 2 — Diverging findings are preserved and investigated

When specialists disagree, Sutherland does not force reconciliation. For example, Krueger may recommend continuous locomotion for expressive immersion while Furness requires teleport for comfort discipline. Sutherland surfaces both, attributes each, and either presents the trade-off to the user or defers to the more conservative specialist for high-stakes applications.

### Rule 3 — Safety trumps expression

When comfort, safety, or registration correctness conflicts with aesthetic or expressive goals, the safety-oriented specialist wins. Furness's comfort rules override Krueger's aesthetic preferences. Azuma's registration budget overrides Bret-victor's directness goals when the two conflict.

### Rule 4 — Directness is the default

When no other rule applies, Bret-victor's directness principles guide the synthesis. This is because direct manipulation is the baseline good interaction pattern; deviations require justification.

### Rule 5 — User level governs presentation, not content

All specialist findings are included in the response regardless of user level. Papert-sp adapts the presentation. The technical content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language spatial computing question, problem, or request.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `expert`.
3. **Platform context** (optional). Target platform.
4. **Prior SpatialComputingSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query
- Shows design rationale at the appropriate level of detail
- Credits the specialists involved
- Notes any unresolved disagreements or trade-offs
- Suggests follow-up work

### Grove record: SpatialComputingSession

```yaml
type: SpatialComputingSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  wing: multi-wing
  complexity: novel
  type: design
  user_level: advanced
agents_invoked:
  - sutherland
  - engelbart
  - bret-victor
  - krueger
  - furness
  - azuma
  - papert-sp
work_products:
  - <grove hash of SpatialComputingAnalysis>
  - <grove hash of SpatialComputingDesign>
  - <grove hash of SpatialComputingReview>
concept_ids:
  - <relevant college concept IDs>
user_level: advanced
```

Each specialist's output is also a standalone Grove record linked from the SpatialComputingSession.

## Escalation paths

### Internal escalations (within the team)

- **Krueger and Furness disagree on locomotion:** Defer to Furness for high-stakes applications; surface the trade-off to the user for expressive applications.
- **Azuma rejects the application as not-AR:** Sutherland reclassifies the query and re-routes.
- **Engelbart rates augmentation as marginal:** Surface honestly; suggest non-spatial alternatives.

### External escalations (from other teams)

- **From spatial-computing-workshop-team:** Escalate when a review reveals that the issues span multiple wings.
- **From spatial-computing-practice-team:** Escalate when a practice run reveals a novel design problem.

### Escalation to the user

- **Not worth building:** If Engelbart's augmentation analysis concludes that the spatial system is not worth the effort compared to alternatives, report this honestly with rationale.
- **Outside spatial computing:** If the problem requires expertise outside spatial computing (pure graphics programming, cloud infrastructure, legal compliance), Sutherland acknowledges the boundary.

## Token / time cost

- **Sutherland** — 2 Opus invocations, ~40K tokens total
- **Specialists in parallel** — 2 Opus (Engelbart, Bret-victor) + 3 Sonnet (Krueger, Furness, Azuma), ~30-60K tokens each
- **Papert-sp** — 1 Sonnet invocation, ~20K tokens
- **Total** — 200-400K tokens, 5-15 minutes wall-clock

This cost is justified for multi-wing and novel problems. For single-wing or routine problems, use the specialist directly or a focused team.

## Configuration

```yaml
name: spatial-computing-analysis-team
chair: sutherland
specialists:
  - augmentation: engelbart
  - interaction: bret-victor
  - environment: krueger
  - vr_hmd: furness
  - ar: azuma
pedagogy: papert-sp

parallel: true
timeout_minutes: 15

auto_skip: true
min_specialists: 2
```

## Invocation

```
# Full analysis
> spatial-computing-analysis-team: Design a VR+AR training system for emergency
  room triage that can run on both standalone headsets and AR tablets.

# Multi-wing problem
> spatial-computing-analysis-team: We want to build a public library installation
  that uses body-scale interaction and teaches coordinate thinking to children.

# Follow-up
> spatial-computing-analysis-team: (session: grove:abc123) Add a remote-visitor
  mode where parents can watch the child interact from home.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring specialized sub-disciplines (graphics pipeline optimization, low-level tracking algorithms, hardware firmware) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 — convergence is measured only at the synthesis level.
- The team does not access external hardware or run real VR/AR systems; its outputs are designs and analyses, not running code.
