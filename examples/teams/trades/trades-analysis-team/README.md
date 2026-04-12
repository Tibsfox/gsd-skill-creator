---
name: trades-analysis-team
type: team
category: trades
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/trades/trades-analysis-team/README.md
description: Full Trades Department investigation team for multi-domain craft problems spanning methodology, workshop practice, tools and machines, materials, pedagogy, and measurement. Vitruvius classifies the query along five dimensions (domain, complexity, type, user level, firmitas/utilitas/venustas emphasis) and activates the relevant specialists in parallel, then synthesizes their independent findings into a coherent level-appropriate response. Use for complex craft problems where multiple specialist perspectives are required, including problems that cross methodology, materials, and pedagogy in a single question. Not for routine tool selection, pure shop layout, or single-specialist questions.
superseded_by: null
---
# Trades Analysis Team

Full-department investigation team for trades problems that span multiple domains or resist classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response, analogous to how the math investigation team runs multiple methods on a single mathematical problem.

## When to use this team

- **Multi-domain craft problems** spanning methodology, workshop practice, tools, materials, pedagogy, and measurement — where no single specialist covers the full scope
- **Complex diagnostic problems** where a failed fit, a stalled apprentice, or a struggling shop could have causes in any of several domains and the diagnosis needs to rule them in or out
- **Shop redesign projects** where the layout, the tooling, the training program, and the measurement discipline all have to be considered together
- **Trade-school curriculum design** that needs both the philosophical framing from Crawford and Rose and the technical content from Nasmyth, Edison, and Brunel-TR
- **Historical research on the trades** where the answer depends on piecing together evidence from multiple specialists' domains
- **Multi-trade projects** where several crafts have to work together and the coordination between them is itself the difficulty

## When NOT to use this team

- **Routine tool selection** — use `nasmyth` directly
- **Pure shop layout** — use `edison` directly
- **Pure pedagogy** — use `rose` or `crawford` directly
- **Single-material questions** (e.g., "what's the moisture-content target for this oak") — use the relevant specialist with the materials-and-fit skill
- **Emergencies** — Vitruvius handles these directly without the team synthesis overhead

## Composition

The team runs all seven Trades Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| Chair / Router | `vitruvius` | Classification, orchestration, synthesis, triad framing | opus |
| Workshop specialist | `edison` | Shop layout, invention environments, tool-room organization | opus |
| Precision-power specialist | `nasmyth` | Machine tools, tolerances, metallurgy, machine-shop design | opus |
| Mechanization-history specialist | `brunel-tr` | Dedicated tooling, mass-production origin, interchangeable parts | sonnet |
| Work-measurement specialist | `taylor` | Time study, task decomposition, with labor-relations framing | sonnet |
| Cognition / pedagogy specialist | `rose` | Cognitive content of manual work, apprenticeship, teaching | sonnet |
| Philosophy specialist | `crawford` | Philosophical argument, craft-education defense, soulcraft framing | sonnet |

Three agents run on Opus (Vitruvius, Edison, Nasmyth) because their tasks require judgment under ambiguity and classification or design decisions with broad consequences. Four run on Sonnet because their tasks are more framework-driven or more clearly scoped.

## Orchestration flow

1. **Vitruvius classifies** the incoming query along five dimensions: domain, complexity, type, user level, and triad emphasis.
2. **Vitruvius dispatches** to the relevant specialists in parallel. Not every specialist is invoked on every query — Vitruvius selects the subset that can contribute to the answer.
3. **Specialists work in parallel**, each producing an independent finding in their own framework. Each produces a Grove record of the appropriate type (TradesAnalysis, TradesConstruct, TradesReview, TradesExplanation).
4. **Vitruvius synthesizes** the specialist outputs, applying the firmitas/utilitas/venustas triad to organize the response and resolve conflicts.
5. **Vitruvius produces a TradesSession** Grove record linking all work products and recording the classification.

## Synthesis rules

### Rule 1 — Converging findings are strengthened

When two or more specialists reach the same finding independently (for example, Nasmyth says the tolerance stack is tight and Taylor's task decomposition shows why it's tight in practice), the finding is reported as high-confidence.

### Rule 2 — Diverging findings are preserved and attributed

When specialists disagree, Vitruvius preserves the disagreement with attribution rather than forcing a reconciliation. "Crawford argues the shop needs the master present in view of apprentices; Edison argues the shop needs a dedicated quiet space for seniors to concentrate. Both are defensible; the choice depends on which is the dominant problem in this shop."

### Rule 3 — Triad framing organizes the response

Every synthesized response has a firmitas/utilitas/venustas organization. The synthesis lead with the most-emphasized term and treats the others as supporting considerations.

### Rule 4 — Historical transparency on Taylor is mandatory

When Taylor is invoked, the synthesis includes the labor-relations framing as a core element, not an optional postscript. The framing is produced by Taylor itself and surfaced unchanged by Vitruvius.

### Rule 5 — Pedagogy wraps the response at beginner and apprentice levels

At beginner or apprentice user levels, Rose or Crawford (depending on whether the framing is ethnographic or philosophical) produces a closing wrap that connects the specific answer to the broader craft tradition. At journeyman or master levels, the wrap is omitted and the answer is left in its technical form.

## Input contract

The team accepts:

1. **User query** (required) — the natural-language trades question
2. **User level** (optional) — beginner, apprentice, journeyman, or master
3. **Prior TradesSession hash** (optional) — for follow-up queries
4. **Context** (optional) — material, trade, regulatory jurisdiction

## Output contract

### Primary output

A synthesized response that:

- Directly answers the query
- Shows specialist reasoning at the appropriate level of detail
- Applies the firmitas/utilitas/venustas triad explicitly
- Credits each specialist's contribution
- Notes any unresolved disagreements
- Includes the historical-transparency framing if Taylor was invoked

### Grove record

A TradesSession record linking:

- Each specialist's work product (TradesAnalysis, TradesConstruct, TradesReview, TradesExplanation)
- The classification metadata
- The concept IDs touched by the response
- A summary of the synthesized answer

## Invocation patterns

```
# Full investigation
> trades-analysis-team: I'm running a small cabinet shop. Setup dominates my
  cycle time, my apprentice keeps making the same mistakes, and I'm not sure
  whether to buy a CNC or hire another hand. Walk me through the whole picture.

# Historical and practical together
> trades-analysis-team: What does the Portsmouth block mills story teach me
  about deciding whether to mechanize my current shop's repeat operations?

# Curriculum design
> trades-analysis-team: Help me design a first-year carpentry curriculum for
  a community college that takes the cognitive content of the craft seriously.

# Shop redesign
> trades-analysis-team: My machine shop needs a redesign. Layout, tooling
  investment, training program, and measurement discipline are all in scope.
```

## Token and time cost

Approximate cost per investigation:

- **Vitruvius** — 2 Opus invocations (classify + synthesize), ~30K tokens
- **Specialists in parallel** — 2 Opus (Edison, Nasmyth) + 3–4 Sonnet (Brunel-TR, Taylor, Rose, Crawford) at roughly 20–40K tokens each
- **Total** — 150–300K tokens, 5–15 minutes wall-clock

This cost is justified for multi-domain and complex problems. For single-domain questions, route to the specialist directly.

## Limitations

- The team covers the seven agents' combined expertise. Very specific sub-disciplines (e.g., structural welding qualification, high-voltage electrical code) are handled at the closest available level of generality; Vitruvius will name the boundary and recommend an external reference when appropriate.
- Parallel specialists do not communicate during the specialist phase. Convergence and divergence are measured only at the synthesis level.
- The team's historical framing is grounded in Western trades traditions; non-Western craft traditions are treated respectfully but with less depth, and users should expect Vitruvius to flag this limitation when relevant.
- Emergency situations (safety, active failure) should go to the relevant specialist or to Vitruvius directly, not through this team, because the synthesis overhead delays the answer.
