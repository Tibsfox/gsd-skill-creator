# Trade Studies & Decision Analysis

**Module:** SYE-08
**Series:** Systems Engineering (SYE)
**Focus:** Rigorous selection among alternatives under uncertainty, NASA SE Handbook conformance

---

## 1. Why Trade Studies Exist

A trade study is the structured answer to a question every engineering program must eventually face: *given more than one technically feasible way to accomplish an objective, which do we pick, and can we defend the choice?* The NASA Systems Engineering Handbook (NASA/SP-2016-6105 Rev 2) places trade studies at the heart of the Decision Analysis process, because nearly every other technical process — requirements, architecture, design, verification — eventually produces a branch point that requires choosing. Trade studies exist because unaided human judgment is demonstrably bad at comparing more than a handful of attributes simultaneously, bad at holding priorities constant across meetings, and bad at distinguishing "I like this one" from "this one wins on the metrics we agreed to before we started."

The key word is *agreed*. The value of a trade study is not that it produces an objectively correct answer — most interesting decisions do not have one — but that it forces a team to declare, in writing and before seeing the outcome, what criteria matter and how much. The study then executes those rules mechanically. If the result is surprising, the surprise is itself information: either the rules were wrong, or the intuition was wrong, and the team must now decide which. This is why a well-documented trade study is more valuable for what it forces people to say out loud than for the number at the bottom of the matrix.

Apollo, Shuttle, and Artemis all hinge on trade studies whose outcomes shaped decades of spaceflight. The Apollo lunar mode decision (direct ascent vs. Earth orbit rendezvous vs. lunar orbit rendezvous) is the archetype, and John Houbolt's successful campaign to elevate LOR into the formal trade space is the archetype of a trade study correcting an organizational preference. The Shuttle Solid Rocket Booster selection is the cautionary counter-example: a trade study whose criteria, weights, and sensitivity to cost assumptions reshaped crewed spaceflight and, decades later, contributed to the Challenger loss. Trade studies are not neutral math — they are institutional commitments, and their rigor determines whether the commitment survives contact with reality.

## 2. The Trade Study Process (NASA SE Handbook Conformant)

The NASA SE Handbook prescribes an eight-step decision analysis process, articulated across Section 6.8 (Decision Analysis) and reinforced in Section 4.5 (Technical Planning) and Section 7 (Cross-cutting Technical Management). The eight steps, in order:

1. **Define the problem.** State the decision, the decision authority, the timing, and the scope. What are we choosing among? Why now? Who signs? What is out of scope? The most common failure at Step 1 is framing the question too narrowly, which silently excludes promising alternatives before analysis begins.

2. **Identify alternatives.** Generate the candidate set. Include a "do nothing" or "continue current approach" baseline whenever meaningful. Include at least one alternative you expect to lose — a study with only winners looks pre-decided. Include one wildcard. The alternative set should span the design space, not cluster around the team's preferred solution.

3. **Define criteria.** Enumerate the attributes on which alternatives will be judged. Criteria must be measurable (or at least repeatably rankable), mutually relevant, and non-overlapping. Criteria should map to stakeholder requirements — if a criterion is in the matrix but traces to no requirement, ask why it is there. A typical spaceflight trade has 6 to 12 criteria; fewer than 4 and the study lacks resolution, more than 15 and you are gaming weights.

4. **Weight criteria.** Assign relative importance. This is where most studies cheat. Weights must be set *before* scoring and must be defensible to the decision authority. Techniques range from direct assignment ("Mass is 30%, cost is 25%") to swing-weighting to Analytic Hierarchy Process pairwise comparison. Whatever method, weights are elicited from stakeholders, not made up by the analyst.

5. **Score alternatives.** For each alternative, score each criterion. Scores may be absolute (measured values), relative (ranked), or utility-mapped (raw values passed through a value function). Independent scorers reduce bias. Double-blind scoring — where scorers do not know which alternative is which — is the gold standard and is rarely done because it is slow.

6. **Calculate and analyze.** Compute the weighted sum (or more sophisticated aggregation). Identify the winner, the margin of victory, and the criteria that drove the outcome. A margin under 5 percent should be treated as a tie pending sensitivity analysis.

7. **Sensitivity analysis.** Vary weights, vary scores, and see whether the winner changes. If the winner is stable across plausible perturbations, the decision is robust. If small changes flip the outcome, the study has not actually decided anything — it has identified two alternatives that require further discrimination.

8. **Document and decide.** Produce the artifact: problem statement, alternatives, criteria, weights, scores, calculations, sensitivity results, recommendation, and the dissenting opinions. The NASA SE Handbook requires that trade studies be preserved for the life of the program, because future anomalies often send investigators back to ask "why did we pick this?" The answer must be reproducible.

The eight-step process is deliberately general. It accommodates Pugh matrices for early concept selection, AHP for complex multi-stakeholder decisions, MAUT for decisions with significant uncertainty, and cost-effectiveness analysis for budget-constrained choices. The method should match the maturity and consequence of the decision.

## 3. Pugh Concept Selection

Stuart Pugh introduced controlled convergence in his 1990 book *Total Design*, and the method remains the cleanest early-phase trade study tool available. Pugh's central insight: at the concept stage, precise scoring is a lie. Teams cannot meaningfully say "alternative A is 7.3 and alternative B is 6.1" when neither alternative has been analyzed beyond a sketch. What teams *can* do is compare each alternative against a reference and say "better," "worse," or "same."

### The Pugh Matrix

A Pugh matrix has one column per alternative, one row per criterion, and a designated "datum" — a reference concept against which all others are compared. Often the datum is the current design, the incumbent solution, or simply the team's initial favorite. Each cell gets a mark:

- **+** (plus): this alternative is better than the datum on this criterion
- **−** (minus): this alternative is worse than the datum
- **S** (same): no meaningful difference

At the bottom of each alternative column, tally the pluses, the minuses, and the sames. A concept with many more pluses than minuses is a candidate to replace the datum in the next round.

### Controlled Convergence

The Pugh process is iterative. After the first pass:

1. Drop clearly dominated concepts (many minuses, few pluses)
2. Identify the strongest concept (most net pluses) and promote it to the new datum
3. Generate *new* concepts that address the weaknesses of surviving concepts
4. Run the matrix again against the new datum

This is "controlled convergence" — successive rounds narrow the field while generating new options that hybridize strengths. Pugh's warning: do not eliminate concepts with strong individual pluses even if their net score is negative, because those pluses may seed the next generation. The method is divergent as well as convergent.

### Example: Notional Lunar Lander Concept Selection (Pugh)

Suppose early Artemis architecture wants to pick among five crew-capable lunar landers. Criteria: mass to surface, propulsion complexity, surface duration, development risk, commonality with Gateway, cost.

| Criterion | Datum (Current) | Concept A: Storable bipropellant | Concept B: Cryogenic LOX/LH2 | Concept C: Hybrid | Concept D: Methalox |
|---|---|---|---|---|---|
| Mass to surface | D | + | + | S | + |
| Propulsion complexity | D | S | − | − | S |
| Surface duration | D | − | + | S | + |
| Development risk | D | + | − | − | S |
| Gateway commonality | D | − | S | S | + |
| Cost | D | S | − | − | − |
| **Sum +** | — | 2 | 2 | 0 | 3 |
| **Sum −** | — | 2 | 3 | 3 | 1 |
| **Net** | — | 0 | −1 | −3 | +2 |

Concept D (methalox) emerges with net +2. Concept C is dominated and drops. The next round would re-datum to D and invite new concepts that hybridize D's strengths with A and B's pluses (storable reliability, LH2 energy density). Note that Pugh does not assert methalox is objectively best — only that, against this datum on these criteria, it is the strongest survivor of round one. The method is humble by design.

### Pugh Caveats

Pugh matrices should never be used to make a final decision on a billion-dollar program — the resolution is too low. They are *concept selection* tools, appropriate at Pre-Phase A and Phase A, before sufficient fidelity exists for weighted numerical methods. Teams that use Pugh matrices for PDR-stage decisions are either saving time dishonestly or hiding the fact that they cannot yet quantify their own requirements.

## 4. Weighted Decision Matrix (Kepner-Tregoe)

Charles Kepner and Benjamin Tregoe developed their decision analysis method at RAND in the late 1950s and published *The Rational Manager* in 1965. The Kepner-Tregoe (K-T) method gave business and engineering the weighted decision matrix we now see in every systems engineering textbook.

### Structure

1. Separate criteria into **MUSTs** and **WANTs**. MUSTs are mandatory — any alternative failing a MUST is eliminated before scoring begins. WANTs are desirable and weighted.
2. Assign weights to WANTs, typically 1 to 10, where 10 is the most important WANT.
3. Score each surviving alternative against each WANT on a fixed scale (typically 1 to 10).
4. Compute weighted score: sum over criteria of (weight × score) for each alternative.
5. Identify the highest-scoring alternative as the nominal recommendation.
6. Assess **adverse consequences** separately — what could go wrong with the top choices, and how likely and severe?
7. Choose the alternative with the best weighted score adjusted for adverse consequences.

### The MUST/WANT Split Matters

The MUST list is the hidden strength of K-T. A study that skips MUSTs ends up with weighted averages that mask fatal flaws. Example: a launch vehicle that scores 9/10 on cost but 0/10 on "meets payload mass" should not be in the matrix at all — mass is a MUST, and failing it eliminates the vehicle. The weighted sum would otherwise average the zero against a high cost score and produce a meaningless number. K-T's discipline of killing MUST failures before scoring prevents this class of error.

### Adverse Consequence Analysis

The adverse consequences step is the second discipline K-T adds beyond the raw weighted sum. For each top-ranked alternative, identify potential negative outcomes, rate their probability (1-10) and severity (1-10), and compute a threat score. A high weighted score combined with a high threat score should drop the alternative below a lower-scored but safer option. This is how K-T handles risk without demanding the sophistication of full Monte Carlo or utility theory.

### When K-T Fits

K-T shines when criteria are independent, stakeholders roughly agree on weights, and scoring is reasonably objective. It struggles when criteria interact (cost depends on schedule, schedule depends on risk), when weights are contested (the program office wants cost; the science team wants capability), or when uncertainty is so large that point scores misrepresent what is known. For those cases, AHP, MAUT, or stochastic methods do more work.

## 5. Analytic Hierarchy Process (AHP)

Thomas Saaty introduced the Analytic Hierarchy Process in 1977 (published in the *Journal of Mathematical Psychology*) and developed it across the 1980 book *The Analytic Hierarchy Process*. AHP addresses a problem that K-T sidesteps: how do you elicit weights honestly when stakeholders cannot give you a number?

### Pairwise Comparison

AHP's core trick is that humans are bad at absolute weights but decent at relative comparisons. Given two criteria A and B, people can usually say "A is moderately more important than B" with more confidence than "A is 0.37." AHP formalizes this with Saaty's 1-to-9 scale:

| Value | Meaning |
|---|---|
| 1 | A and B equally important |
| 3 | A weakly more important |
| 5 | A strongly more important |
| 7 | A very strongly more important |
| 9 | A absolutely more important |
| 2, 4, 6, 8 | Intermediate values |
| Reciprocals | B more important than A |

For *n* criteria, the analyst builds an *n × n* pairwise comparison matrix where entry (i,j) is the comparison of criterion i against criterion j. The matrix is reciprocal by construction: if (i,j) = 5, then (j,i) = 1/5.

### Deriving Weights

The weights are extracted as the principal (largest) eigenvector of the comparison matrix, normalized to sum to 1. A simple approximation for hand calculation: compute the geometric mean of each row, then normalize. The eigenvector method gives the exact answer and tolerates small inconsistencies in the judgments.

### Consistency Ratio

The seminal contribution of AHP is the **Consistency Ratio (CR)**, which measures whether the pairwise judgments are internally coherent. Humans rarely give perfectly consistent judgments — if A is twice as important as B, and B is three times as important as C, strict consistency demands A is six times as important as C, but a stakeholder might say five or seven. Saaty defined a consistency index:

CI = (λ_max − n) / (n − 1)

where λ_max is the principal eigenvalue and n is the matrix size. The Consistency Ratio is CI divided by a Random Index (RI) that Saaty tabulated for random reciprocal matrices:

CR = CI / RI

**A CR below 0.10 is considered acceptable.** Above that, the stakeholder should revisit their comparisons — some judgments are self-contradictory and must be reconciled before weights can be trusted. This is the closest any decision method comes to automatically catching human irrationality.

### Hierarchical Decomposition

AHP also handles criterion hierarchies. If you have top-level criteria (Cost, Performance, Risk) and sub-criteria (under Performance: mass, duration, reliability), you do pairwise comparisons within each level and combine weights multiplicatively down the tree. This scales to large problems without forcing stakeholders to directly compare dozens of low-level attributes against each other.

### AHP Example

A simplified Artemis descent vehicle trade, three criteria: Cost, Schedule, Technical Risk. Pairwise comparison matrix (as elicited from a program manager):

|  | Cost | Schedule | Risk |
|---|---|---|---|
| Cost | 1 | 3 | 1/2 |
| Schedule | 1/3 | 1 | 1/4 |
| Risk | 2 | 4 | 1 |

Row geometric means: Cost = (1 × 3 × 0.5)^(1/3) = 1.145; Schedule = (0.333 × 1 × 0.25)^(1/3) = 0.437; Risk = (2 × 4 × 1)^(1/3) = 2.0. Normalize by sum (3.582): weights ≈ Cost 0.320, Schedule 0.122, Risk 0.558. Risk dominates. The PM's implicit priority — which they could not have stated directly — is now explicit and auditable.

CR computation (done in practice with software): CI around 0.02, RI for n=3 is 0.58, CR ≈ 0.03. Well under 0.10, so the judgments are consistent enough to use.

### AHP Caveats

AHP has been criticized for **rank reversal**: adding a new alternative can change the relative ranking of existing alternatives, which is counterintuitive (a new option should not make B beat A if A was already beating B). Saaty addressed this with variants (Ideal Mode AHP), but rank reversal remains the standard AHP critique. For spaceflight work, use AHP for criterion weighting but pair with a straightforward weighted sum or MAUT for alternative scoring.

## 6. Multi-Attribute Utility Theory (MAUT)

MAUT emerged from decision theory in the 1970s, with Ralph Keeney and Howard Raiffa's 1976 book *Decisions with Multiple Objectives* as the foundational text. MAUT is the rigorous treatment of decisions under uncertainty with multiple attributes, and it is what NASA uses when consequences are severe enough that approximations are unsafe.

### Value Functions

In a raw weighted sum, the score on a criterion is assumed to be linear — doubling the mass margin doubles the benefit. This is usually wrong. Mass margin below 5 percent is panic; above 30 percent it is wasted capability. Cost savings below some threshold are noise; above a cliff they blow the budget. **Value functions** map raw attribute values to a 0-to-1 utility that captures the actual stakeholder preference curve. Value functions can be linear, exponential, S-shaped, or piecewise — whatever reflects the real relationship between the attribute and its benefit.

### Utility vs. Value

Technically, MAUT distinguishes **value functions** (preferences under certainty) from **utility functions** (preferences under uncertainty, incorporating risk aversion). A risk-averse stakeholder has a concave utility function: a certain outcome of 5 is preferred to a 50/50 gamble between 0 and 10, even though both have expected value 5. For spaceflight, risk aversion is typically assumed (loss of crew is not linearly worse than loss of science), and utility functions are used rather than simple value functions.

### Independence Assumptions

MAUT's aggregation form depends on **preferential independence** and **utility independence** among attributes. If these hold (a stakeholder's preference over cost is independent of their preference over mass), the multi-attribute utility can be written as an additive or multiplicative combination of single-attribute utilities. The additive form:

U(x1, x2, ..., xn) = Σ wi · ui(xi)

where wi are scaling constants (weights) and ui are single-attribute utility functions. The multiplicative form is more general but harder to elicit. Independence should be tested, not assumed — teams often find that, say, mass and propulsion type are *not* independent (preferences over mass depend on what propellant is in the vehicle), and the simple additive form is inadmissible.

### Elicitation

Building single-attribute utility functions requires the **certainty equivalent method**: for a given attribute range, ask the stakeholder to identify the certain value they would accept in lieu of a 50/50 gamble between the worst and best values. This point defines the midpoint of the utility function. Iterate to build the full curve. This is slow, stakeholder-intensive, and honest — which is why it is used for major decisions like mission architecture and not for routine parts selection.

### MAUT in Practice

MAUT appears in NASA trade studies when uncertainty is large and consequences are severe. The Mars Science Laboratory entry, descent, and landing architecture used utility-based methods to compare rocket-slowed landing, airbag landing, and sky-crane alternatives. The Europa Clipper trajectory selection incorporated MAUT-style analysis to weigh radiation dose against science return and propellant cost. Whenever a trade study must honestly represent "this is much worse than it looks because the downside is catastrophic," MAUT is the right tool.

## 7. TOPSIS

The Technique for Order of Preference by Similarity to Ideal Solution (TOPSIS) was proposed by Hwang and Yoon in 1981. TOPSIS asks a geometric question: in the multi-dimensional space of criteria, which alternative is closest to the ideal and farthest from the anti-ideal?

### Procedure

1. Build the decision matrix: alternatives as rows, criteria as columns, cells as raw scores.
2. Normalize the matrix. Common choice: vector normalization, dividing each column by the square root of the sum of squares of that column.
3. Apply weights to the normalized matrix by multiplying each column by its weight.
4. Identify the **positive ideal solution (PIS)** — for each criterion, the best value across alternatives. Identify the **negative ideal solution (NIS)** — the worst value across alternatives.
5. For each alternative, compute the Euclidean distance to PIS (D+) and to NIS (D−).
6. Compute the **closeness coefficient**: C = D− / (D+ + D−). Higher is better; C is bounded between 0 and 1.
7. Rank alternatives by C.

### Strengths and Weaknesses

TOPSIS is intuitive, computationally trivial, and handles arbitrary numbers of criteria gracefully. It is resistant to rank reversal relative to AHP. It is also agnostic about how weights were elicited, so it pairs well with AHP-derived weights or direct assignment. Its weakness is that it assumes linear value functions and does not explicitly handle uncertainty. For decisions where raw scores are known and weights are agreed, TOPSIS gives clean rankings with little fuss. For decisions where scores are uncertain or value functions are non-linear, TOPSIS quietly misleads.

## 8. Cost-Effectiveness vs Cost-Benefit Analysis

**Cost-Benefit Analysis (CBA)** converts everything to a common currency — usually dollars — and compares alternatives on net benefit. If you can monetize reliability, schedule slip, and science return, CBA gives the cleanest answer: pick the alternative with the highest net present value. CBA is standard in civil infrastructure and appears in NASA when alternatives differ in cost and the benefits can be credibly monetized (e.g., operational cost savings from a new ground system).

**Cost-Effectiveness Analysis (CEA)** is used when benefits cannot honestly be monetized. Instead of dollars per dollar, CEA computes cost per unit of non-monetary outcome: cost per kilogram to orbit, cost per astronaut-hour on the surface, cost per terabit of science data returned. CEA is the right tool for most spaceflight decisions because most spaceflight benefits resist monetization without political contamination. NASA is not optimizing profit; it is optimizing mission capability per taxpayer dollar.

The distinction matters. A CBA that converts "one astronaut life" to a dollar value invites the program to make an explicit tradeoff that the public would reject if stated aloud. A CEA that reports "cost per unit of crew safety margin" is more honest because it keeps the crew safety as a denominator rather than burying it in a dollar aggregate.

## 9. Sensitivity Analysis

A trade study whose winner depends on a weight set to exactly 0.25 rather than 0.24 has not made a decision — it has made a coin flip dressed as arithmetic. Sensitivity analysis is the test of whether the recommendation is **robust**, and it is the step that separates trustworthy studies from rationalizations.

### One-at-a-Time (OAT)

The simplest sensitivity analysis: vary one weight by ±10, ±20, ±50 percent while holding others constant (after renormalization), and recompute the ranking. If the top alternative changes with small perturbations, the decision is fragile. Identify which weights and which criteria are pivotal, and focus elicitation effort there.

### Score Uncertainty

Scores are estimates, not measurements. Vary each score by its credible range (mass estimates at CDR might be ±10 percent, cost estimates ±30 percent, TRL-constrained reliability estimates ±50 percent). If the winner is stable, the study is robust to estimation error. If not, the study is recommending a preference rather than a discovery.

### Tornado Diagrams

A tornado diagram is the standard graphical representation of OAT sensitivity: a horizontal bar chart with criteria or inputs on the y-axis, ordered by the magnitude of their effect on the output, with each bar showing the output range as that input varies across its credible range. The widest bars at the top are the decision drivers. Tornado diagrams make it immediately obvious which inputs deserve further effort and which can be estimated loosely.

### Monte Carlo Sensitivity

When criterion interactions matter, OAT misses correlations. Monte Carlo sensitivity samples all inputs from their distributions simultaneously, reruns the trade study thousands of times, and reports the distribution of outcomes and the probability that each alternative is the winner. This is the gold standard for high-consequence decisions and is standard practice at NASA for architecture-level trades. If alternative A wins 60 percent of Monte Carlo runs and alternative B wins 35 percent, the study should recommend A with an explicit caveat rather than reporting A as the unconditional winner.

## 10. Pareto Analysis and Pareto Fronts

Some trades do not have a winner because the criteria genuinely conflict and the stakeholder cannot commit to weights. In such cases, the useful output is a **Pareto front**: the set of alternatives that are not dominated by any other alternative.

An alternative is **dominated** if another alternative is at least as good on every criterion and strictly better on at least one. Dominated alternatives can be eliminated — no rational stakeholder would pick them. The non-dominated alternatives form the Pareto front and represent the efficient frontier of the trade space: any improvement in one criterion requires a sacrifice in another.

The value of Pareto analysis is that it separates the objective elimination of bad options from the subjective choice among good ones. A program can reduce a field of twenty alternatives to the three or four on the Pareto front and then have an informed argument about which tradeoff the program is actually willing to accept. For early-phase trades with large alternative sets, Pareto analysis is often more useful than weighted ranking because it preserves the tension in the decision rather than collapsing it to a single number.

## 11. Monte Carlo Methods for Decision Analysis

Monte Carlo simulation handles two sources of uncertainty in trade studies: uncertain inputs (what will the mass actually be?) and uncertain preferences (what weight will the new administrator assign to cost?). The procedure:

1. Specify probability distributions for each uncertain input. Use triangular, normal, beta, or lognormal distributions as appropriate. Elicit distributions from subject matter experts; do not guess.
2. Draw random samples from each distribution. Common sample size: 10,000 runs.
3. For each sample, execute the trade study computation and record the winner and the winning margin.
4. Aggregate: report the probability that each alternative wins, the distribution of margins, and the correlations between inputs and outcomes.

Monte Carlo decision analysis changes the conversation from "A wins" to "A wins 73 percent of the time, B wins 24 percent, and C wins 3 percent; when B wins, it is usually because cost estimates came in low; when C wins, it is because mass estimates were pessimistic." This level of detail lets the decision authority make an informed call rather than rubber-stamping a point estimate.

## 12. Common Trade Study Pitfalls

**Criterion bias.** Including criteria that favor a preferred alternative while excluding criteria that disfavor it. Detection: every criterion should trace to a stakeholder requirement. If a criterion has no upstream justification, it is probably a thumb on the scale.

**Score inflation.** Scoring the preferred alternative generously and competitors stingily. Detection: double-blind scoring, independent scorers, or at minimum a peer review of raw scores before weights are applied.

**Weight gaming.** Adjusting weights after seeing the scores to produce the desired winner. Detection: weights must be set and signed off *before* scoring begins. Any post-hoc adjustment requires explicit justification and a re-review.

**Reverse-engineering to pre-decided answers.** The most insidious failure mode: the team knows what they want, runs the trade study as ritual, and adjusts criteria, weights, or scores until the ritual produces the predetermined answer. Detection is hard because the documentation looks correct. Prevention: independent analysts, public pre-registration of the decision framework, and a culture that tolerates surprising results.

**False precision.** Reporting weighted sums to three decimal places when inputs are uncertain to ±30 percent. Detection: compare output precision to input precision; when they disagree, the analysis is lying. A winning margin of 0.02 on a 10-point scale is not a result — it is noise.

**Criterion overload.** Using 25 criteria to hide that no single criterion clearly distinguishes alternatives. Detection: criteria count above 12 should be challenged. If criteria are not truly independent, consolidate them.

**Ignoring MUST failures.** Allowing alternatives that fail a hard requirement to remain in the weighted matrix. Their failure gets averaged against their strengths and disappears. Prevention: K-T's MUST/WANT split, applied rigorously.

**Missing the wildcard.** Trade studies that only compare incremental variations of the team's preferred approach miss transformative alternatives. Detection: if all alternatives share the same basic architecture, the study has failed to span the design space.

## 13. Documentation and Audit

A trade study is a program artifact. The NASA SE Handbook requires documentation sufficient for an independent review years later to reproduce the analysis. Minimum contents:

1. **Problem statement** — decision, authority, date, constraints.
2. **Alternatives considered** — including ones eliminated and why.
3. **Criteria** — with traceability to stakeholder requirements.
4. **Weights** — values, elicitation method, signoff.
5. **Scores** — raw scores, scoring method, scorer identity, any normalization.
6. **Calculations** — aggregation method (weighted sum, AHP eigenvector, MAUT utility function, TOPSIS closeness coefficient), intermediate values.
7. **Sensitivity analysis** — OAT results, Monte Carlo results if applicable, identification of decision drivers.
8. **Recommendation** — the winning alternative, the margin, the confidence.
9. **Dissenting opinions** — recorded explicitly, not buried.
10. **Decision** — what was actually chosen, by whom, when, and any deviation from the recommendation with justification.

Trade study artifacts live in the program configuration management system and are pulled during anomaly investigations, program replans, and independent reviews. The Columbia Accident Investigation Board revisited foam-strike decisions made years earlier and needed the original trade rationale to understand how the risk assessment had evolved. A trade study without an audit trail is a decision that cannot be defended when it matters most.

## 14. Historical Trade Studies

### Apollo CM Heat Shield Material

The Apollo Command Module heat shield faced a material trade: ablative (phenolic resin impregnated with silica fibers, which chars and sheds to carry heat away) versus reusable ceramic or metallic systems. The trade was run in the early 1960s under intense schedule pressure. Criteria included peak heating capability, mass, manufacturability, reusability, and cost. Ablative materials were selected based on demonstrated performance in nuclear weapon re-entry tests, manufacturing readiness, and the recognition that the CM did not need to be reusable — a single mission was enough. The Avcoat ablator used on Apollo remains the heritage for the Orion heat shield today, and the Artemis I test flight in November 2022 demonstrated Avcoat still performs in lunar return conditions. This is a textbook example of a trade study where "reusability is not a requirement for this mission" dropped an entire criterion and simplified the decision.

### Shuttle Solid Rocket Booster Selection

The Space Shuttle SRB trade is the cautionary example. The trade space included solid-propellant boosters, liquid-propellant pressure-fed boosters, and liquid-propellant pump-fed boosters. Criteria included development cost, production cost, operational cost, reliability, performance, and political acceptability. The final selection — segmented solid boosters manufactured by Morton Thiokol in Utah — was driven heavily by development cost (solids were cheaper to develop than liquids) and by distributed contractor base requirements. Reliability was scored optimistically, and the specific failure mode of O-ring seal erosion at segment joints in cold weather was not adequately weighted in the risk criterion. The Challenger loss in January 1986 exposed the gap between scored reliability and actual reliability, and the subsequent Rogers Commission report documented how the trade had been influenced by non-technical factors that were never made explicit in the decision matrix. The post-Challenger lesson was not that trade studies should be abandoned but that their non-technical drivers must be surfaced, not hidden, and that reliability scores based on untested assumptions are worse than honest "TBD" entries.

### Apollo Lunar Mode Decision

The lunar mission mode decision — Direct Ascent vs Earth Orbit Rendezvous (EOR) vs Lunar Orbit Rendezvous (LOR) — was run between 1960 and 1962 and is one of the most studied trade decisions in aerospace history. Direct Ascent used a single giant rocket (Nova-class) to land the entire spacecraft on the Moon and return it. EOR assembled a lunar-bound spacecraft in Earth orbit from two Saturn launches. LOR used a single Saturn V launch but split the vehicle in lunar orbit, with only a lightweight lander descending to the surface while the command module waited in orbit.

John Houbolt's advocacy of LOR in 1961-62, against strong initial preference for Direct Ascent and EOR from Wernher von Braun and the Marshall team, is an object lesson in trade study integrity. Houbolt's analysis showed LOR required significantly less total mass (smaller rocket, smaller lander, no Earth-orbit assembly infrastructure) and could meet the 1969 deadline. The initial resistance was partly technical (docking two vehicles in lunar orbit was unprecedented and unforgiving) and partly cultural (splitting the vehicle felt unsafe). Houbolt forced the criterion of "total mass to lunar surface" to be properly weighted and forced the criterion of "development risk" to honestly compare LOR's docking risk against Nova's development risk. The trade, properly executed, picked LOR, and the Apollo architecture followed. Without Houbolt's willingness to escalate over his chain of command to make the trade honest, Apollo might have attempted Direct Ascent with a rocket that never flew and a schedule that never closed.

### Artemis Human Landing System

The Artemis HLS selection in April 2021 chose SpaceX's Starship HLS over proposals from Blue Origin's National Team and Dynetics. The NASA source selection statement (a public document under Federal Acquisition Regulation rules) is a published trade study at program scale. The criteria included technical approach, management approach, and price. Scoring rated SpaceX technically "acceptable" with "outstanding" management and notably lower price; Blue Origin was rated "acceptable" on technical with "very good" management; Dynetics was rated "marginal" on technical. Price was the decisive differentiator under a budget-constrained NASA, and the source selection statement explicitly addresses the weight of price in the decision. A subsequent GAO protest and court case tested the rigor of the trade and ultimately upheld NASA's process. The Artemis HLS selection is a contemporary example of a trade study that survived adversarial legal review because it was documented properly.

### Lunar Lander Architecture (Contemporary)

Beyond HLS selection, the underlying architecture trade — direct ascent from the surface back to Earth, single-stage lander returning to lunar orbit, or two-stage lander with a descent stage left behind — is a trade that Apollo solved one way and Artemis may solve differently. Starship HLS is single-stage-to-orbit within the Earth-Moon system, enabled by orbital refueling. Blue Origin's Blue Moon lander is two-stage. The trade drivers are different from Apollo's because on-orbit propellant transfer was fiction in 1962 and near-operational in 2026. When the underlying technology changes, old trade studies must be re-run from scratch — a reminder that trade studies are snapshots of current capability, not permanent truths.

## 15. Trade Study Template

The following template is compatible with the NASA SE Handbook and can be adapted for any program. Fields marked * are mandatory per the SE Handbook decision analysis process.

```
TRADE STUDY REPORT

*1. Identification
   Title:
   Study ID:
   Date:
   Author(s):
   Decision Authority:

*2. Problem Statement
   Decision to be made:
   Scope (what is in and out):
   Constraints:
   Timing / deadline:
   Stakeholders:

*3. Alternatives
   A1: [description]
   A2: [description]
   ...
   (Include baseline / do-nothing if applicable.
    Include at least one wildcard.
    Note alternatives considered and rejected before scoring.)

*4. Criteria
   MUSTs (any failure eliminates the alternative):
     M1: [requirement trace]
     M2: ...
   WANTs (weighted):
     W1: [description, measurement method, requirement trace]
     W2: ...

*5. Weighting
   Method: [Direct / Swing / AHP / other]
   Weights:
     W1: [value] rationale
     W2: [value] rationale
   Signed off by: [stakeholders, date]
   (For AHP: include pairwise matrix and consistency ratio)

*6. Scoring
   Scoring scale: [1-10, relative, utility-mapped, etc.]
   Scorer(s): [independent? double-blind?]
   Raw scores table (alternatives x criteria)
   Notes on uncertain scores and their ranges

*7. Calculation
   Aggregation method: [weighted sum / AHP eigenvector / MAUT additive / TOPSIS / other]
   Calculation table
   Winning alternative and margin

*8. Sensitivity Analysis
   Method: [OAT / tornado / Monte Carlo]
   Pivotal criteria and weights
   Robustness of winner
   Conditions under which winner changes

*9. Risk / Adverse Consequences
   For top alternatives: what could go wrong, probability, severity, mitigation

*10. Recommendation
    Recommended alternative:
    Confidence:
    Caveats and conditions:

*11. Dissenting Opinions
    [Record explicitly, with authors]

*12. Decision
    Chosen alternative:
    Decision authority, date, signature:
    Deviation from recommendation (if any) and justification:

13. References
    Requirements documents
    Supporting analysis
    Prior trade studies
```

## 16. Synthesis

Trade studies are the honest bureaucracy of engineering decision-making. They do not replace judgment — they discipline it. Pugh matrices work at concept phase. Kepner-Tregoe works when criteria are independent and stakeholders agree. AHP works when stakeholders need help surfacing their own priorities. MAUT works when uncertainty and risk aversion dominate. TOPSIS works when geometric intuition is useful. Cost-effectiveness analysis works when monetization is dishonest. Pareto analysis works when the decision cannot yet be reduced to a single number. Monte Carlo works when uncertainty must be represented honestly. Each tool has a domain; the skill is matching tool to decision.

The NASA SE Handbook provides the scaffolding — the eight-step process — because the scaffolding is what survives personnel changes, administration changes, and program replans. A trade study executed with discipline produces an artifact that can be defended at a design review, at an anomaly board, and in court. A trade study executed as ritual produces paperwork that falls apart the first time anyone asks hard questions. The difference is not the method chosen but the honesty of execution: are the criteria really the criteria, are the weights really the weights, and is the recommendation really where the numbers point?

Apollo's LOR decision survived scrutiny because Houbolt forced the trade to be run honestly. Shuttle's SRB decision failed scrutiny because non-technical drivers were hidden inside technical scores. Artemis HLS survived scrutiny because the selection statement documented the trade openly enough to withstand a GAO protest. The pattern across sixty years of spaceflight decision-making is consistent: trade studies are as trustworthy as the teams running them, and the procedural machinery exists to make honest execution easier and dishonest execution harder. When the machinery is respected, trade studies are one of the most powerful tools systems engineering has. When it is not, they are decorative.

---

**Module length:** ~5,000 words
**Key references:** NASA/SP-2016-6105 Rev 2 (NASA Systems Engineering Handbook), Pugh 1990 (*Total Design*), Saaty 1980 (*The Analytic Hierarchy Process*), Keeney & Raiffa 1976 (*Decisions with Multiple Objectives*), Kepner & Tregoe 1965 (*The Rational Manager*), Hwang & Yoon 1981 (*Multiple Attribute Decision Making*), Houbolt 1961-62 internal NASA memos on LOR, Rogers Commission Report 1986, NASA Artemis HLS Source Selection Statement April 2021.
