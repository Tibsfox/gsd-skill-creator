---
name: trades-workshop-team
type: team
category: trades
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/trades/trades-workshop-team/README.md
description: Focused trades workshop team for a single shop design, layout, or improvement question. Pairs Vitruvius with Edison and Nasmyth to cover the workshop-environment and machine-shop foundations, with Crawford available for the philosophical framing of a redesign's educational implications. Smaller and faster than the full trades-analysis-team. Use for single-shop questions, layout proposals, tool-room reorganization, and invention-environment design. Not for multi-trade curriculum design, materials-and-fit diagnosis, or pure pedagogy questions.
superseded_by: null
---
# Trades Workshop Team

Focused workshop team for a single shop-design or shop-improvement question. Smaller and faster than the full analysis team, but still deep enough to handle the interplay between workshop environment, machine-shop foundation, and the philosophical framing that shop redesigns carry.

## When to use this team

- **Designing a new shop** from an intent brief, when the layout, tooling investment, and culture all have to be considered together
- **Reorganizing an existing shop** whose layout, flow, or tool-room organization is producing silent productivity loss
- **Evaluating a shop against the Menlo Park principles** or the machine-shop foundation principles, and producing a prioritized list of improvements
- **Planning a tooling investment** for a shop, where the question is not just which machine to buy but how the machine fits into the shop's larger system
- **Redesigning an invention environment** where fast iteration, cross-specialty collaboration, and sustained attention are all important
- **Any shop question where the triad firmitas/utilitas/venustas gives useful organization to the answer**

## When NOT to use this team

- **Pure curriculum design** — use `trades-practice-team` or Rose and Crawford directly
- **Materials-and-fit diagnosis** without a shop component — use `trades-analysis-team` or the specialists directly
- **Pure time-study questions** — use `taylor` directly, with appropriate framing
- **Quick tool selection** (a single-question lookup) — use `nasmyth` directly
- **Historical research** on the trades — use `brunel-tr` or `trades-analysis-team`

## Composition

The team is four agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| Chair / Router | `vitruvius` | Triad framing, classification, synthesis | opus |
| Workshop specialist | `edison` | Shop layout, flow, tool-room, invention environments | opus |
| Machine-shop specialist | `nasmyth` | Precision power, machine tool selection, tooling investment | opus |
| Philosophy framing | `crawford` | Educational and human-development implications of shop design | sonnet |

The three Opus agents ensure the design decisions are made with full reasoning depth. Crawford on Sonnet provides the philosophical wrap when the shop design has educational consequences that need to be named.

## Orchestration flow

1. **Vitruvius classifies** the shop question along the five dimensions and tags the triad emphasis
2. **Edison and Nasmyth work in parallel** — Edison on the workshop-environment view (layout, flow, culture), Nasmyth on the machine-shop-foundation view (precision, tooling, tolerance discipline)
3. **Crawford is consulted** for the philosophical framing if the redesign affects apprentices, educational context, or the nature of the work the shop will do
4. **Vitruvius synthesizes** the outputs into a coherent shop-design proposal, applying the triad and resolving conflicts between the environment view and the precision view
5. **Vitruvius produces a TradesSession** record linking the inputs and outputs

## Why this team

A shop is simultaneously an invention environment (Edison's domain) and a precision-production environment (Nasmyth's domain), and these two lenses can pull the design in different directions. A shop optimized purely for invention may have too much flexibility and not enough precision; a shop optimized purely for precision may have too much rigidity and not enough room for iteration. The workshop team's specific value is that it runs both lenses in parallel and lets Vitruvius synthesize them into a balanced design rather than defaulting to one or the other.

Crawford's role is to ensure that the philosophical dimension is not missing. A shop that works technically but undermines the people who work in it is a design failure; Crawford names that failure mode when it is present and advises on how to avoid it.

## Input contract

The team accepts:

1. **Shop description** (required) — what the shop does, its trades, its size, its current state if any
2. **Design goal or problem** (required) — what the user wants from the redesign or diagnosis
3. **Constraints** (optional) — budget, space, existing equipment, regulatory context
4. **User role** (optional) — owner, foreman, apprentice, teacher — affects the framing of the answer

## Output contract

### Primary output

A shop design or improvement proposal that:

- States the classification and the triad emphasis
- Provides the Edison view (environment, layout, flow, culture)
- Provides the Nasmyth view (precision, tooling, tolerance discipline)
- Notes any conflicts between the two views and the chosen resolution
- Includes the Crawford framing if relevant to the user's context
- Organizes recommendations by priority and cost

### Grove record

A TradesSession record linking:

- A TradesAnalysis from Edison (current-state diagnosis if applicable)
- A TradesConstruct from Nasmyth (tooling and precision plan)
- A TradesExplanation from Crawford (philosophical framing if invoked)
- The synthesized recommendation and its prioritization

## Example outputs

```yaml
# Primary synthesis sketch
classification:
  domain: multi-domain
  complexity: challenging
  type: construct
  user_level: journeyman
  triad_emphasis: [utilitas, firmitas]

edison_view:
  recommendation: "Relocate daily-use hand tools within arm's reach of the main bench; establish a shop jig library; separate finishing from dust-producing stations"
  rationale: "Walking time and setup time are currently the dominant cycle-time components; fixing layout is cheaper than fixing machinery"

nasmyth_view:
  recommendation: "Hold off on the CNC mill purchase until the shop has stabilized its tolerance discipline; invest first in master gauges and a calibration cadence"
  rationale: "The current tolerance budget is not allocated — the shop is relying on luck rather than discipline. A CNC mill before the discipline arrives will produce expensive wrong parts"

crawford_view:
  framing: "The proposed layout preserves the sightline between senior and apprentice benches, which is the condition under which the senior's experience transmits to the apprentice. A purely efficiency-driven layout would separate them and lose this transmission."

vitruvius_synthesis:
  priority_1: "Layout change (Edison recommendation)"
  priority_2: "Measurement discipline (Nasmyth recommendation)"
  priority_3: "Preserve senior-apprentice sightline (Crawford framing)"
  deferred: "CNC mill purchase — revisit after priorities 1 and 2 are stable"
```

## Invocation patterns

```
# Shop redesign
> trades-workshop-team: I'm rebuilding my cabinet shop after a move. I have
  1500 sq ft, a mix of hand and power tools, one apprentice, and a commitment
  to training. Design the layout.

# Tooling investment decision
> trades-workshop-team: Should I buy a CNC mill for my general-purpose shop?
  Consider the layout, culture, and training implications, not just the
  machine itself.

# Diagnosis
> trades-workshop-team: My shop is losing time on setup and my apprentice is
  not learning quickly. What's going on and what should I change?

# Invention environment
> trades-workshop-team: I'm setting up a prototype shop for a small hardware
  startup. Apply the Menlo Park principles and tell me what to build first.
```

## Token and time cost

- **Vitruvius:** 2 Opus invocations (~30K tokens)
- **Edison:** 1 Opus invocation (~40K tokens)
- **Nasmyth:** 1 Opus invocation (~40K tokens)
- **Crawford:** 1 Sonnet invocation, conditional (~20K tokens)
- **Total:** 100–170K tokens, 3–8 minutes wall-clock

Faster and cheaper than the full analysis team, and the right size for single-shop questions.

## Limitations

- The team does not cover apprenticeship pedagogy in depth beyond the triad-level framing. For deep pedagogy questions, use `trades-practice-team` or route to Rose directly.
- The team's Nasmyth output is grounded in the machine-shop tradition; shops whose dominant trade is not metalwork (e.g., pure cabinetmaking, textile, leather) will see Nasmyth's output adapted but at the cost of some specificity. In these cases, consider adding Brunel-TR for the mechanization-history view.
- Emergency safety questions should not go through this team; they should go to Vitruvius directly for immediate action.
