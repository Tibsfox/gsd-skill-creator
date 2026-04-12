---
name: economics-department
type: chipset
category: economics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/economics-department/README.md
description: >
  Coordinated economics department -- seven named agents, six knowledge
  skills, three teams. Tenth instantiation of the department template pattern.
  Routes queries through Smith (CAPCOM), preserves genuine school-of-thought
  disagreements rather than forcing false consensus.
superseded_by: null
---

# Economics Department

## 1. What is the Economics Department?

The Economics Department chipset is a coordinated set of reasoning agents, domain
skills, and pre-composed teams that together provide structured economics support
across microeconomics, macroeconomics, international trade, public policy,
behavioral economics, and development economics. It is the tenth instantiation
of the "department template pattern" in gsd-skill-creator. Incoming requests are
classified by a router agent (Smith), dispatched to the appropriate specialist,
and all work products are persisted as Grove records linked to the college concept
graph.

Unlike the mathematics department, where disagreements are typically resolvable
(one proof is correct, the other is not), the economics department deals with
genuine schools of thought that have incompatible premises. The department is
designed to preserve these disagreements rather than force false consensus. When
Keynes and Hayek reach different conclusions about fiscal policy, both conclusions
are presented with their reasoning and the empirical evidence that bears on the
dispute. The user evaluates the arguments.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/economics-department .claude/chipsets/economics-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Smith (the router agent) classifies the query domain and dispatches
to the appropriate specialist agent. No explicit activation command is needed --
the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/economics-department/chipset.yaml', 'utf8')).name)"
# Expected output: economics-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring deep
reasoning across frameworks), four on Sonnet (for well-scoped domain analysis
and pedagogy).

| Name       | Historical Figure          | Role                                          | Model  | Tools                        |
|------------|----------------------------|-----------------------------------------------|--------|------------------------------|
| smith      | Adam Smith                 | Department chair -- classification, routing, synthesis, market coordination | opus   | Read, Glob, Grep, Bash, Write |
| keynes     | John Maynard Keynes        | Macroeconomist -- aggregate demand, fiscal policy, business cycle | opus   | Read, Grep, Bash             |
| ostrom     | Elinor Ostrom              | Institutionalist -- commons governance, polycentric systems, collective action | opus   | Read, Grep, Bash             |
| sen        | Amartya Sen                | Development economist -- capability approach, poverty, inequality, welfare | sonnet | Read, Grep, Bash             |
| robinson   | Joan Robinson              | Competition analyst -- imperfect competition, monopsony, market power | sonnet | Read, Grep, Bash             |
| hayek      | Friedrich Hayek            | Policy critic -- knowledge problem, spontaneous order, limits of intervention | sonnet | Read, Grep, Bash             |
| varian     | Hal Varian                 | Pedagogy guide -- applied micro, technology markets, mechanism design | sonnet | Read, Write                  |

Smith is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Smith.

### Why these seven

The roster is designed to cover the major schools of thought and analytical
perspectives in economics:

- **Smith** represents the classical tradition: markets coordinate through prices,
  trade creates gains, and the invisible hand is a powerful (but not universal)
  mechanism.
- **Keynes** represents the macroeconomic revolution: aggregate demand matters,
  recessions are real failures (not efficient adjustments), and government has a
  role in stabilization.
- **Ostrom** represents the institutional school: governance is not binary
  (state vs. market), communities can and do self-govern, and institutional
  design matters more than ideology.
- **Sen** represents the development and welfare tradition: income is a means
  not an end, capabilities are what matter, and distribution cannot be ignored.
- **Robinson** represents industrial organization: real markets are imperfectly
  competitive, market power is pervasive, and monopsony is as important as
  monopoly.
- **Hayek** represents the Austrian tradition: knowledge is dispersed, prices
  are information, unintended consequences are ubiquitous, and humility about
  what planners can know is essential.
- **Varian** represents the applied and pedagogical tradition: economics is
  practical, models are tools, and clarity of exposition matters.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                   | Domain     | Trigger Patterns                                               | Agent Affinity           |
|-------------------------|------------|----------------------------------------------------------------|--------------------------|
| microeconomics          | economics  | supply and demand, elasticity, market structure, game theory, Nash equilibrium, consumer surplus, monopoly, oligopoly | robinson, smith, varian  |
| macroeconomics          | economics  | GDP, inflation, unemployment, monetary policy, fiscal policy, recession, business cycle, aggregate demand | keynes, hayek            |
| international-trade     | economics  | comparative advantage, tariff, trade, exchange rate, globalization, balance of payments, import, export | smith, sen, hayek        |
| public-policy           | economics  | tax, regulation, externality, public good, market failure, government intervention, carbon tax, subsidy | ostrom, hayek, keynes, varian |
| behavioral-economics    | economics  | bias, heuristic, nudge, prospect theory, loss aversion, behavioral, bounded rationality, framing effect | varian, sen              |
| development-economics   | economics  | poverty, development, inequality, institutions, capability, foreign aid, growth model, HDI | sen, ostrom, keynes      |

Agent affinity means the skill's content is preferentially loaded into the
listed agent's context. Multiple affinities mean the skill is relevant to
more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                      | Agents                                        | Use When                                              |
|---------------------------|-----------------------------------------------|-------------------------------------------------------|
| economics-analysis-team   | smith, keynes, ostrom, sen, robinson, hayek, varian | Multi-domain, research-level, or full-analysis requests |
| policy-team               | keynes, hayek, ostrom, varian                 | Policy evaluation, regulatory design, tax analysis     |
| markets-team              | robinson, smith, sen, varian                  | Industry analysis, competition assessment, market design |

**economics-analysis-team** is the full department. Use it for problems that
span multiple economic domains or require the broadest possible expertise. It is
the most expensive team in token cost but provides the most complete analysis.

**policy-team** pairs the fiscal analyst (Keynes) with the policy critic (Hayek),
the institutional designer (Ostrom), and the expositor (Varian). Use it when the
primary question is "should the government intervene?" -- the team provides the
strongest case for, strongest case against, and institutional alternatives.

**markets-team** pairs the competition analyst (Robinson) with the market
coordinator (Smith), the welfare analyst (Sen), and the applied micro specialist
(Varian). Use it when the primary question is "how does this market work?" --
the team provides structural diagnosis, coordination analysis, distributional
effects, and practical implications.

## 6. Grove Record Types

All department work products are persisted as Grove records under the
`economics-department` namespace. Five record types are defined:

| Record Type          | Produced By                    | Key Fields                                           |
|----------------------|--------------------------------|------------------------------------------------------|
| EconomicAnalysis     | keynes, hayek, ostrom, robinson | question, framework(s) applied, findings, school-of-thought attribution, evidence |
| EconomicModel        | keynes, robinson, varian       | model name, assumptions, mechanism, predictions, limitations |
| PolicyBrief          | keynes, hayek, ostrom          | policy question, for/against/alternative positions, distributional effects, evidence |
| EconomicExplanation  | varian, sen                    | topic, target level, explanation body, real-world examples, prerequisites |
| EconomicsSession     | smith                          | session ID, queries, dispatches, work product links, timestamps |

Records are content-addressed and immutable once written. EconomicsSession records
link all work products from a single interaction, providing an audit trail from
query to result.

## 7. College Integration

The chipset connects to the college economics department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and
  write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When an EconomicExplanation is produced, the chipset
  can automatically generate a Try Session (interactive practice) based on the
  explanation content and the learner's current position in the concept graph.
- **Learning pathway updates**: Completed analyses, policy briefs, and explanations
  update the learner's progress along college-defined pathways.
- **Five wings** map to the college economics department structure:
  1. Scarcity & Choice
  2. Markets & Exchange
  3. Money & Banking
  4. Personal Finance
  5. Economic Systems

Each skill and Grove record type aligns to one or more wings, so work products
are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The economics department follows the department template pattern. To create a
department for another domain, follow the same six steps described in the
math-department README:

1. Copy the chipset directory
2. Rename agents (choose historical figures appropriate to the new domain)
3. Replace skills with domain-appropriate content
4. Define new Grove record types
5. Map to the target college department
6. Update evaluation gates

### Economics-specific customization notes

- **Adding schools of thought:** The current roster covers classical, Keynesian,
  Austrian, institutional, development, industrial organization, and applied
  perspectives. To add others (post-Keynesian, MMT, Marxian, feminist economics),
  add agents with appropriate names and framework specifications.
- **Adjusting the Keynes-Hayek balance:** The current design gives equal weight
  to both perspectives. If a particular use case favors one school (e.g., a
  central bank training program might weight Keynes more heavily), adjust the
  routing priorities in Smith's classification rules.
- **Regional focus:** The current skills are globally oriented. For a regional
  economics department (e.g., EU economics, development economics of sub-Saharan
  Africa), replace trigger patterns and skill content to emphasize regional topics.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Smith) as the entry point for all
queries. This is especially important for economics because:

1. **Classification requires breadth.** A question about housing prices may touch
   micro, macro, behavioral, and policy domains. Smith understands all six domains
   well enough to classify correctly.
2. **Ideological balance.** Without a neutral router, queries would be answered
   by whichever specialist happens to match first, producing systematically biased
   responses. Smith ensures that policy questions get both Keynesian and Hayekian
   perspectives.
3. **CAPCOM boundary.** The user interacts with exactly one agent, which maintains
   a consistent communication style and prevents contradictory framing across
   specialists.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (smith, keynes, ostrom): Smith requires the deepest reasoning
  because routing and synthesis span all six domains and must handle school-of-thought
  diversity. Keynes requires deep reasoning because macroeconomic analysis involves
  multi-step causal chains and model selection. Ostrom requires deep reasoning
  because institutional analysis draws on extensive empirical knowledge and the
  IAD framework is complex.
- **Sonnet agents** (sen, robinson, hayek, varian): These roles are well-scoped
  within their domains. Sen's capability analysis, Robinson's market structure
  diagnosis, Hayek's knowledge-problem critique, and Varian's pedagogical
  exposition all benefit from fast turnaround. Sonnet's speed matters more than
  its depth ceiling for these tasks.

This 3/4 split keeps the token budget practical while preserving quality where
it matters most.

### Why this team structure

The three teams cover the three most common query shapes:

- **Full investigation**: needs every perspective (all 7 agents)
- **Policy-focused**: needs the for/against/alternative pipeline (4 agents)
- **Market-focused**: needs the structure/coordination/distribution pipeline (4 agents)

Teams are not exclusive. Smith can assemble ad-hoc groups for queries that do not
fit any pre-composed team.

### Handling ideological diversity

The economics department's distinctive design challenge is ideological diversity.
Mathematics has one answer; economics often has several, each internally consistent
but based on different assumptions about how the world works.

The department handles this through:

1. **Multi-perspective synthesis.** Smith presents each school's conclusions with
   attribution rather than blending them into a false consensus.
2. **Pivotal assumption identification.** For Keynes-Hayek disagreements, Smith
   identifies the specific factual assumption that drives the divergence.
3. **Evidence grounding.** Where empirical evidence bears on the disputed
   assumption, it is presented. Where evidence is ambiguous, this is stated
   honestly.
4. **User agency.** The user evaluates the arguments. The department informs;
   it does not adjudicate between schools.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Smith speaks to the user.
Other agents communicate through Smith via internal dispatch. This is enforced by
the `is_capcom: true` flag -- only one agent in the chipset may carry this flag.

## 10. Relationship to Other Departments

The economics department connects to other departments in the college:

- **Mathematics department:** Provides the mathematical tools (optimization,
  game theory, statistics, econometrics) that economics uses. Economics agents
  may reference math skills for formal derivations.
- **History department:** Provides historical context for economic events and
  institutions. Economic history bridges both departments.
- **Philosophy department:** Provides the ethical frameworks (utilitarianism,
  Rawlsian justice, libertarianism) that underpin normative economics. Sen's
  capability approach bridges economics and philosophy.
- **Psychology department:** Provides the cognitive science foundations for
  behavioral economics. Kahneman and Tversky's work bridges both departments.

These connections are informational, not structural -- agents reference other
departments' concepts but do not invoke their agents directly. Cross-department
queries are handled by the college routing layer, not by individual departments.
