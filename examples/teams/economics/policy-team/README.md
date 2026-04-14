---
name: policy-team
type: team
category: economics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/economics/policy-team/README.md
description: Focused policy analysis team for evaluating government interventions, regulatory proposals, tax design, and public goods provision. Pairs Keynes (fiscal policy, demand management) with Hayek (knowledge problem, unintended consequences) for balanced debate, adds Ostrom (institutional design, polycentric alternatives) for governance options beyond state-vs-market, and Varian (mechanism design, clear exposition) for pedagogical synthesis. Use for policy evaluation, regulatory design, tax analysis, commons governance, or any question where "should the government intervene?" is the central issue. Not for pure market analysis, development economics, or macro forecasting.
superseded_by: null
---
# Policy Team

Focused policy analysis team for evaluating government interventions, designing regulations, analyzing tax proposals, and assessing governance alternatives. Built around the productive tension between Keynesian activism and Hayekian restraint, enriched by Ostrom's institutional alternatives and Varian's expository clarity.

## When to use this team

- **Policy evaluation** -- "Should the government do X?" requires hearing the case for and against, plus institutional alternatives.
- **Regulatory design** -- "How should this market be regulated?" requires Hayek's unintended-consequence analysis, Ostrom's polycentric alternatives, and Keynes's welfare justification.
- **Tax analysis** -- "What are the effects of this tax?" requires Keynes's macro impact, Hayek's distortion analysis, and Varian's incidence exposition.
- **Commons governance** -- "How should this shared resource be managed?" is Ostrom's primary domain, with Hayek and Keynes providing market and government perspectives.
- **Public goods provision** -- "Should the government provide this?" requires welfare analysis (Keynes), knowledge-problem critique (Hayek), and mechanism design (Varian).

## When NOT to use this team

- **Market structure analysis** -- use markets-team (Robinson, Smith, Sen, Varian).
- **Development economics** -- use economics-analysis-team for the full department.
- **Macro forecasting** -- use Keynes directly for demand analysis or the full team for multi-perspective macro.
- **Beginner-level explanation** -- use Varian directly.
- **Pure theoretical debate** -- use economics-analysis-team for the broadest perspective.

## Composition

| Role | Agent | Perspective | Model |
|------|-------|-------------|-------|
| **Fiscal analyst** | `keynes` | Government intervention as demand management and welfare improvement | Opus |
| **Policy critic** | `hayek` | Knowledge problem, unintended consequences, limits of planning | Sonnet |
| **Institutional designer** | `ostrom` | Polycentric governance, community-based alternatives, design principles | Opus |
| **Expositor** | `varian` | Mechanism design, clear exposition, applied micro | Sonnet |

Smith (the department chair) routes to this team and synthesizes the output. He is not listed as a team member but orchestrates the workflow.

### Why these four

Policy analysis requires three things: a case for intervention (Keynes), a case for restraint (Hayek), and alternatives beyond the binary (Ostrom). Varian provides the pedagogical wrapper and mechanism design expertise.

The Keynes-Hayek pairing is deliberate. The most productive policy analysis comes from hearing the strongest version of both sides. Keynes provides the welfare-economics justification for government action. Hayek provides the information-theoretic critique. Neither has a monopoly on truth -- which side is more persuasive depends on the specific context (how severe is the market failure? how capable is the government? what institutional alternatives exist?).

Ostrom breaks the binary. "Privatize or regulate" is a false dilemma for many problems. Community governance, polycentric systems, and institutional design principles offer a third path that is often overlooked in standard policy debates.

## Orchestration flow

```
Input: policy question + optional user level
        |
        v
+---------------------------+
| Smith (Opus)              |  Classify and dispatch
| (external orchestrator)   |
+---------------------------+
        |
        +--------+--------+--------+
        |        |        |        |
        v        v        v        v
    Keynes    Hayek    Ostrom   (Varian
    (for)     (against) (alt)    waits)
        |        |        |
    Phase 1: Independent analysis
             Each produces a PolicyBrief
             or EconomicAnalysis Grove record
        |        |        |
        +--------+--------+
                 |
                 v
      +---------------------------+
      | Smith (Opus)              |  Phase 2: Synthesis
      | Preserve disagreements   |          - present for/against/alternative
      +---------------------------+          - identify pivotal assumptions
                 |
                 v
      +---------------------------+
      | Varian (Sonnet)           |  Phase 3: Pedagogy
      | Level-appropriate output  |          - real-world examples
      +---------------------------+          - mechanism design options
                 |
                 v
          Final response to user
```

## Synthesis rules

### Rule 1 -- Present the strongest version of each position

Keynes's case for intervention should be the strongest Keynesian argument, not a straw man. Hayek's critique should be the strongest Austrian argument, not a caricature. Ostrom's alternative should be grounded in real institutional examples, not theoretical hand-waving.

### Rule 2 -- Identify the pivotal assumption

Most Keynes-Hayek disagreements hinge on a specific factual assumption: Is the market failure severe enough to justify the government failure risk? Does the government have the information needed to intervene effectively? Is the economy at the zero lower bound? Smith identifies this assumption and presents the evidence for and against.

### Rule 3 -- Ostrom's alternative gets equal standing

The "third way" is not a compromise between Keynes and Hayek but an independently grounded alternative. Community governance, polycentric systems, and institutional design deserve the same analytical respect as market-based and government-based solutions.

### Rule 4 -- Distribution is always reported

Who wins and who loses from the policy? Efficiency analysis without distributional analysis is incomplete. This applies to all three perspectives -- Keynesian stimulus has distributional effects, Hayekian deregulation has distributional effects, and Ostromian community governance has distributional effects.

## Configuration

```yaml
name: policy-team
chair: smith  # external orchestrator
members:
  - fiscal: keynes
  - critic: hayek
  - institutional: ostrom
  - pedagogy: varian

parallel: true
timeout_minutes: 10

min_specialists: 2
```

## Invocation

```
# Policy evaluation
> policy-team: Should the US adopt a carbon tax? What rate, and what should
  be done with the revenue?

# Regulatory design
> policy-team: How should gig economy platforms like Uber and DoorDash be
  regulated to protect workers without destroying flexibility?

# Commons governance
> policy-team: How should water rights be allocated in the Colorado River
  basin as climate change reduces supply?

# Tax analysis
> policy-team: What are the economic effects of a wealth tax on net worth
  above $50 million?
```

## Limitations

- The team does not include Robinson (market structure) or Sen (development/capability). For problems requiring those perspectives, escalate to economics-analysis-team.
- The Keynes-Hayek debate is a simplification of the policy landscape. Real policy debates involve more positions (MMT, post-Keynesian, new institutional, public choice). The team covers the most productive tension but not the full spectrum.
- Empirical evidence on policy effects is often contested. The team presents the best available evidence but cannot resolve genuinely ambiguous empirical questions.
