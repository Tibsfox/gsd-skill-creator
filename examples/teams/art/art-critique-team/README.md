---
name: art-critique-team
type: team
category: art
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/art/art-critique-team/README.md
description: Full Art Department critique team for multi-domain analysis of artworks spanning observation, color, composition, expression, historical context, contemporary practice, and pedagogy. Leonardo classifies the query and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with a learning pathway from Lowenfeld. Use for comprehensive artwork analysis, research-level art-historical questions, cross-domain critique, or any art problem where multiple specialist perspectives are needed. Not for single-domain questions, routine technique instruction, or basic skill exercises.
superseded_by: null
---
# Art Critique Team

Full-department multi-perspective critique team for artworks and art problems that span domains or require the broadest expertise. Runs specialists in parallel and synthesizes their independent findings into a coherent response, providing the viewer with observation, color, composition, expression, historical, contemporary, and pedagogical perspectives simultaneously.

## When to use this team

- **Comprehensive artwork analysis** spanning formal analysis (composition, color), contextual analysis (history, culture, politics), and expressive analysis (symbolism, identity, intent) -- where no single specialist covers the full scope.
- **Research-level art-historical questions** where the problem may yield different insights from different critical perspectives.
- **Cross-domain critique** of student work that needs feedback on observation, color, composition, expression, and process simultaneously.
- **Exhibition planning and curatorial analysis** where understanding an artwork from every angle informs display and interpretation.
- **Novel or unfamiliar artworks** where the viewer does not know which critical lens to apply, and Leonardo's classification is the right entry point.

## When NOT to use this team

- **Single-domain questions** where the classification is obvious -- route to the specialist via Leonardo in single-agent mode. "What colors is Vermeer using?" goes to Albers directly.
- **Routine technique instruction** -- use the appropriate specialist (O'Keeffe for observation exercises, Albers for color experiments).
- **Basic skill exercises** -- use Lowenfeld directly for pedagogical scaffolding.
- **Beginner-level teaching** with no critical analysis component -- use Lowenfeld directly.

## Composition

The team runs all seven Art Department agents:

| Role | Agent | Domain | Model |
|------|-------|--------|-------|
| **Chair / Router** | `leonardo` | Classification, orchestration, synthesis | Opus |
| **Expression specialist** | `kahlo` | Identity, symbolism, cultural context | Opus |
| **Observation specialist** | `okeefe` | Observation, abstraction, nature-to-art | Opus |
| **Composition specialist** | `hokusai` | Spatial organization, design principles, printmaking | Sonnet |
| **Color specialist** | `albers` | Color relationships, design, systematic investigation | Sonnet |
| **Contemporary specialist** | `ai-weiwei` | Conceptual art, installation, social practice | Sonnet |
| **Pedagogy specialist** | `lowenfeld` | Developmental stages, critique facilitation, learning pathways | Sonnet |

Three agents run on Opus (Leonardo, Kahlo, O'Keeffe) because their tasks require deep interpretive reasoning. Four run on Sonnet because their tasks are well-defined and analytically bounded.

## Orchestration flow

```
Input: artwork or query + optional user level + optional prior ArtSession hash
        |
        v
+---------------------------+
| Leonardo (Opus)           |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - complexity (introductory/intermediate/studio-level)
        |                              - type (analyze/create/explain/critique/explore)
        |                              - user level (beginner/intermediate/advanced/professional)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
     Kahlo    O'Keeffe  Hokusai  Albers  Ai Weiwei (Lowenfeld
    (express) (observe)  (comp)  (color) (contemp)   waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             artwork but producing independent findings in
             their own critical framework. Each produces a
             Grove record. Leonardo activates only the
             relevant subset -- not all 5 are invoked on
             every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Leonardo (Opus)           |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile or present
              +---------------------------+          - rank findings by relevance
                         |                           - produce unified response
                         v
              +---------------------------+
              | Lowenfeld (Sonnet)        |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - suggest follow-up activities
                         v
              +---------------------------+
              | Leonardo (Opus)           |  Phase 5: Record
              | Produce ArtSession       |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + ArtSession Grove record
```

## Synthesis rules

Leonardo synthesizes the specialist outputs using these rules:

### Rule 1 -- Multiple valid readings are preserved

In art criticism, multiple interpretations of the same artwork are not contradictions -- they are enrichments. When Kahlo reads a painting as personal expression and Ai Weiwei reads it as political statement, both readings are presented with attribution. This is fundamentally different from mathematical synthesis where contradictions indicate error.

### Rule 2 -- Formal analysis grounds interpretation

When Hokusai identifies a compositional structure and Albers identifies a color strategy, these formal observations provide the evidence base for Kahlo's expressive interpretation and Ai Weiwei's contextual reading. Formal analysis comes first in the synthesis; interpretation builds on it.

### Rule 3 -- Historical context calibrates interpretation

When Kahlo or Ai Weiwei provides art-historical context that explains a formal choice (e.g., "the flat composition reflects the Japanese print influence on Impressionism"), the contextual explanation is integrated with the formal analysis rather than presented separately.

### Rule 4 -- Observation grounds everything

O'Keeffe's close-looking analysis provides the perceptual foundation. Before any interpretation, the viewer must accurately see what is in front of them. O'Keeffe's contribution ensures that the team's analysis is rooted in what the artwork actually presents, not what the analysts assume.

### Rule 5 -- User level governs presentation, not content

All specialist findings are included regardless of user level. Lowenfeld adapts the presentation -- simpler language, more scaffolding, studio exercises for lower levels; concise critical writing for higher levels. The art-critical content does not change, only the framing.

## Input contract

The team accepts:

1. **Artwork or query** (required). An artwork to analyze, a question about art, or student work for critique.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `professional`. If omitted, Leonardo infers from the query.
3. **Prior ArtSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly addresses the query
- Provides formal analysis (composition, color) as the evidentiary base
- Layers expressive, historical, and contextual interpretations on the formal analysis
- Credits the specialists involved
- Notes where interpretations diverge and why both readings are valid
- Suggests follow-up explorations and studio activities

### Grove record: ArtSession

```yaml
type: ArtSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  complexity: studio-level
  type: analyze
  user_level: advanced
agents_invoked:
  - leonardo
  - kahlo
  - okeefe
  - hokusai
  - albers
  - ai-weiwei
  - lowenfeld
work_products:
  - <grove hash of ArtComposition>
  - <grove hash of ArtAnalysis from kahlo>
  - <grove hash of ArtAnalysis from okeefe>
  - <grove hash of ArtAnalysis from albers>
  - <grove hash of ArtExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: advanced
```

## Escalation paths

### Internal escalations (within the team)

- **Formal analysis contradicts interpretation:** If Hokusai's compositional analysis suggests calm balance but Kahlo reads emotional turbulence, Leonardo presents both and notes the tension -- it may be intentional on the artist's part (using calm form to contain violent content).
- **Contemporary context changes the reading:** If Ai Weiwei identifies a political dimension that reframes the entire artwork, Leonardo re-routes the revised reading to other specialists for comment.

### External escalations (from other teams)

- **From studio-team:** When a studio project raises questions that span beyond making into critical analysis.
- **From exhibition-team:** When exhibition planning requires comprehensive artwork analysis.

### Escalation to the user

- **Outside art:** If the query requires expertise outside art (scientific analysis of materials, legal questions about copyright), Leonardo acknowledges the boundary.
- **Insufficient information:** If the artwork cannot be adequately analyzed from the available description or image, Leonardo requests additional context.

## Token / time cost

Approximate cost per full critique:

- **Leonardo** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (Kahlo, O'Keeffe) + 3 Sonnet (Hokusai, Albers, Ai Weiwei), ~20-50K tokens each
- **Lowenfeld** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 150-350K tokens, 5-15 minutes wall-clock

## Configuration

```yaml
name: art-critique-team
chair: leonardo
specialists:
  - expression: kahlo
  - observation: okeefe
  - composition: hokusai
  - color: albers
  - contemporary: ai-weiwei
pedagogy: lowenfeld

parallel: true
timeout_minutes: 15

auto_skip: true
min_specialists: 2
```

## Invocation

```
# Full critique
> art-critique-team: Analyze Frida Kahlo's The Two Fridas (1939) from every
  critical perspective available. Level: advanced.

# Multi-domain analysis
> art-critique-team: Why does Hokusai's Great Wave work so well? I want the
  composition, the color, the historical context, and the cultural meaning.
  Level: intermediate.

# Student work critique
> art-critique-team: Critique this student's mixed-media self-portrait. I want
  feedback on observation, color, composition, and conceptual depth.
  Level: intermediate.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Highly specialized sub-disciplines (conservation science, materials analysis, art law) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 -- each produces an independent reading. Convergence is measured only at synthesis.
- The team does not access external databases or image analysis tools beyond what each agent's tools provide.
- Some artworks resist verbal analysis. The team reports this honestly rather than overinterpreting.
