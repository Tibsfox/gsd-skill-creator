---
name: markets-team
type: team
category: economics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/economics/markets-team/README.md
description: Focused market analysis team for understanding how specific markets work, why they succeed or fail, and who benefits or is harmed. Pairs Robinson (imperfect competition, monopsony, market power) with Smith (comparative advantage, price coordination, gains from trade), adds Sen (distributional and welfare analysis, capability effects) and Varian (applied micro pedagogy, technology markets, mechanism design). Use for industry analysis, competition assessment, market design, trade analysis, or any question centered on how a specific market functions. Not for macro policy, institutional governance, or behavioral analysis.
superseded_by: null
---
# Markets Team

Focused market analysis team for understanding the structure, conduct, and performance of specific markets. Built around Robinson's expertise in imperfect competition and Smith's understanding of market coordination, enriched by Sen's distributional lens and Varian's applied micro pedagogy.

## When to use this team

- **Industry analysis** -- "How does the pharmaceutical / airline / tech / agriculture industry work?" requires market structure diagnosis (Robinson), price mechanism analysis (Smith), welfare assessment (Sen), and clear exposition (Varian).
- **Competition assessment** -- "Is this merger anticompetitive?" requires Robinson's market power analysis, Smith's efficiency perspective, and Sen's distributional analysis.
- **Market design** -- "How should this market be structured?" requires Varian's mechanism design expertise, Robinson's understanding of market power, and Smith's coordination analysis.
- **Trade analysis** -- "Who wins and who loses from this trade agreement?" requires Smith's comparative advantage analysis, Robinson's analysis of industry-level effects, and Sen's capability and distributional assessment.
- **Technology markets** -- "Why does Google dominate search?" requires Varian's platform economics, Robinson's market power analysis, and Smith's network coordination perspective.
- **Labor markets** -- "Why are wages stagnant in sector X?" requires Robinson's monopsony analysis, Sen's capability assessment, and Smith's supply-demand framework.

## When NOT to use this team

- **Macro policy** -- fiscal and monetary policy questions go to policy-team or economics-analysis-team.
- **Institutional governance** -- commons management and institutional design go to policy-team (Ostrom).
- **Behavioral analysis** -- cognitive biases and nudges go to economics-analysis-team (Varian handles the behavioral connection but the full behavioral skill requires the broader team).
- **Pure policy debate** -- "Should the government do X?" goes to policy-team.

## Composition

| Role | Agent | Domain | Model |
|------|-------|--------|-------|
| **Competition analyst** | `robinson` | Market structures, monopsony, imperfect competition | Sonnet |
| **Market coordinator** | `smith` | Price mechanism, comparative advantage, gains from trade | Opus |
| **Welfare analyst** | `sen` | Distributional effects, capability assessment | Sonnet |
| **Applied micro / Expositor** | `varian` | Technology markets, mechanism design, pedagogy | Sonnet |

Smith serves double duty as both a team member (market coordination analysis) and the department chair who orchestrates and synthesizes. This is appropriate because trade and market coordination are Smith's direct domain expertise -- he is not just routing but contributing.

### Why these four

Market analysis requires understanding structure (Robinson), coordination (Smith), distribution (Sen), and application (Varian). This covers the pipeline from "what kind of market is this?" to "how does it coordinate?" to "who wins and who loses?" to "what does this mean in practice?"

Robinson-Smith pairing: Robinson analyzes where markets fail (market power, monopsony, barriers to entry); Smith analyzes where they succeed (price signals, comparative advantage, gains from trade). The tension between them is productive -- most real markets have elements of both.

Sen ensures distributional effects are never ignored. A market that is efficient but concentrates gains among the wealthy and losses among the poor is not fully analyzed until Sen's perspective is included.

Varian bridges theory and practice, especially for technology markets where platform effects, network externalities, and information goods create dynamics that traditional models do not fully capture.

## Orchestration flow

```
Input: market question + optional user level
        |
        v
+---------------------------+
| Smith (Opus)              |  Phase 1: Classify and contribute
| Chair + market analyst    |          - identify market structure
+---------------------------+          - analyze coordination mechanism
        |
        +--------+--------+
        |        |        |
        v        v        v
   Robinson    Sen     (Varian
   (structure) (dist)   waits)
        |        |
    Phase 2: Parallel specialist analysis
             Robinson: market power, barriers, conduct
             Sen: distributional effects, capability impact
        |        |
        +--------+
             |
             v
  +---------------------------+
  | Smith (Opus)              |  Phase 3: Synthesize
  | Merge structure +         |          - market diagnosis
  | coordination + dist.      |          - welfare assessment
  +---------------------------+          - policy implications
             |
             v
  +---------------------------+
  | Varian (Sonnet)           |  Phase 4: Applied wrap
  | Real-world examples       |          - technology market parallels
  +---------------------------+          - mechanism design options
             |
             v
      Final response to user
```

## Synthesis rules

### Rule 1 -- Start with market structure

Robinson's structural diagnosis frames the entire analysis. Is this a competitive market, an oligopoly, a monopoly, or a monopsony? The structure determines which models apply and what outcomes to expect. All subsequent analysis builds on this foundation.

### Rule 2 -- Efficiency and distribution are both reported

Smith provides the efficiency analysis (are gains from trade realized? is the price mechanism functioning?). Sen provides the distributional analysis (who captures the gains? who bears the costs? are capabilities expanded or contracted?). Neither is sufficient alone.

### Rule 3 -- Market failure is specific, not generic

When market failure is identified, specify exactly which type: market power (Robinson), externality (Smith/Varian), information asymmetry (Varian), or public goods (Varian). "Market failure" as a generic label is not useful -- the policy response depends entirely on the specific failure.

### Rule 4 -- Technology markets get special treatment

Platform markets, network goods, and information goods have distinctive economics (near-zero marginal cost, network effects, two-sided markets, lock-in). Varian's technology economics framework is applied whenever the market involves digital goods, platforms, or data.

## Configuration

```yaml
name: markets-team
chair: smith  # orchestrator and market coordination analyst
members:
  - competition: robinson
  - welfare: sen
  - applied: varian

parallel: true
timeout_minutes: 10

min_specialists: 2
```

## Invocation

```
# Industry analysis
> markets-team: Analyze the competitive structure of the US airline industry.
  Why are fares high despite multiple carriers?

# Competition assessment
> markets-team: Would a merger between the two largest grocery chains in the
  Pacific Northwest harm consumers?

# Technology market
> markets-team: Why does Amazon dominate e-commerce? Is its market position
  durable?

# Labor market
> markets-team: Why have real wages for warehouse workers stagnated despite
  low unemployment?

# Trade analysis
> markets-team: Who wins and who loses from US tariffs on Chinese steel?
```

## Limitations

- The team does not include Keynes (macro) or Hayek (policy critique) or Ostrom (institutional governance). For problems requiring those perspectives, escalate to economics-analysis-team or policy-team.
- Labor market analysis is covered through Robinson's monopsony framework but the team does not have a dedicated labor economist. Complex labor market questions may need the full team.
- The team assumes markets exist and asks how they function. For questions about whether markets should exist at all (public goods, commons), use policy-team.
