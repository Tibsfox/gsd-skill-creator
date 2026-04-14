---
name: nutrition-workshop-team
type: team
category: nutrition
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/nutrition/nutrition-workshop-team/README.md
description: Focused workshop team for deep-dive critique of a single nutrition claim or study. Pairs Lind (methodology and synthesis) with Ancel Keys (cardiovascular and cohort methodology), Marion Nestle (policy and funding context), and Adelle Davis (historical-transparency treatment) to produce a tier-labeled evidence review. Smaller than the full analysis team and cheaper. Use for study-critique, contested-claim deep-dives, and popular-nutrition reviews that need scientific and historical context together.
superseded_by: null
---
# Nutrition Workshop Team

Focused workshop team for in-depth treatment of a single nutrition claim, cited study, or contested-evidence question. Runs the department's methodology, evidence, policy, and historical-transparency specialists together to produce a tier-labeled review.

## When to use this team

- **Study critique.** A user has a specific study — often a headline-making one — and wants to know how much to trust it. Workshop team reads the study through the methodology (Lind), evidence (Keys), funding (Nestle), and historical (Davis) lenses.
- **Contested-claim deep dive.** A user wants the full debate on a single contested question — saturated fat, red meat, cholesterol, sodium, ultra-processed foods — rather than a short answer.
- **Popular-nutrition book review.** A user has a popular book or an online source and wants the department's assessment of its specific claims, with historical-transparency treatment for any Davis-era content.
- **Guideline-versus-evidence gap analysis.** A user wants to understand why a specific guideline recommendation differs from (or matches) the current evidence base.

## When NOT to use this team

- **Routine computation or reference intake questions** — use atwater directly.
- **Multi-domain questions** requiring the food-system frame or pedagogy expertise — use the analysis team.
- **Child feeding questions** — use the practice team or satter directly.
- **Questions that need only a single specialist** — use Lind's direct routing rather than the workshop.
- **Food-system and cultural framing questions** — use pollan via the analysis or practice team.

## Composition

The workshop team runs four agents.

| Role | Agent | Focus | Model |
|------|-------|-------|-------|
| **Chair / Synthesis** | `lind` | Methodology, classification, tier-label enforcement, synthesis | Opus |
| **Evidence specialist** | `ancel-keys` | Cohort and trial methodology, lipid and cardiovascular evidence | Opus |
| **Policy and funding specialist** | `marion-nestle` | Industry-influence pattern, funding disclosure, guideline-process context | Opus |
| **Historical specialist** | `adelle-davis` | Replication status of popular-nutrition claims, historical-transparency treatment | Sonnet |

Three Opus agents for the deep reasoning, one Sonnet for the structured historical lookup. The workshop trades breadth (no food-system or pedagogy specialist) for depth on the evidence question.

## Orchestration flow

```
Input: specific study or claim + user framing + optional learner level
        |
        v
+---------------------------+
| Lind (Opus)               |  Phase 1: Frame the workshop
| Scope + methodology       |          - restate the claim precisely
+---------------------------+          - identify the primary evidence
        |                              - classify the question type
        |
        +---------------+---------------+
        |               |               |
        v               v               v
      Keys           Nestle          Davis
     (evidence)     (policy)        (history)
        |               |               |
    Phase 2: Each specialist produces an independent critique:
             - Keys: methodology, effect size, replication, cohort limits
             - Nestle: funding, disclosure, industry-influence pattern
             - Davis: historical antecedents, replication pattern, transparency
        |               |               |
        +---------------+---------------+
                        |
                        v
              +---------------------------+
              | Lind (Opus)               |  Phase 3: Synthesize
              | Tier labels + reconcile   |          - apply tier labels
              +---------------------------+          - preserve disagreement
                        |                            - produce unified review
                        v
                  Final workshop output
                  + NutritionReview Grove record
```

## Synthesis rules

### Rule 1 — Tier labels are mandatory

Every substantive claim in the workshop output carries a tier: settled, strong, contested, weak, or not replicated. The workshop is specifically designed to produce tier-labeled reviews, not narrative responses.

### Rule 2 — Funding context is always included for cited studies

If a study is cited, its funding is checked and reported. This is a standing procedure, not an occasional note.

### Rule 3 — Historical context is included when a claim has an antecedent

If the claim is a modern version of a Davis-era claim, or otherwise has a popular-nutrition antecedent, the historical context is included via Davis's historical-transparency protocol.

### Rule 4 — Keys and Lind handle disagreements collaboratively

When Keys's evidence reading and Lind's methodological reading point in different directions, both perspectives are preserved and the response names the methodological basis for each.

## Input contract

The team accepts:

1. **Specific claim or study** (required). A study citation, a specific numerical claim, a quoted statement, or a popular-book passage.
2. **User framing** (optional). Why the user is asking — they saw it in the news, they are deciding whether to change their diet, they are teaching a class, they are writing a paper.
3. **Learner level** (optional). One of: `beginner`, `intermediate`, `advanced`, `professional`.

## Output contract

### Primary output: Workshop review

A structured review that:

- Restates the claim precisely
- Identifies the primary evidence base
- Labels each sub-claim with a tier
- Reports funding context for cited studies
- Includes historical-transparency treatment when applicable
- Reports unresolved disagreements honestly
- Provides a recommendation with appropriate confidence

### Grove record: NutritionReview

```yaml
type: NutritionReview
subject: <precise restatement of the claim>
primary_evidence:
  - <key studies, with citations>
funding_context:
  - <per-study funding disclosures>
keys_assessment:
  tier: <settled | strong | contested | weak | not-replicated>
  rationale: <Keys's evidence reading>
nestle_assessment:
  funding_concerns: <industry-influence pattern observations>
  policy_context: <relevant guideline-process context>
davis_assessment:
  historical_antecedent: <if applicable>
  replication_pattern: <if applicable>
  transparency_note: <if applicable>
lind_synthesis:
  overall_tier: <tier label for the claim>
  disagreements_preserved: [<list>]
  recommendation: <user-facing advice with confidence>
agents:
  - lind
  - ancel-keys
  - marion-nestle
  - adelle-davis
```

## Escalation paths

### Internal

- **Keys and Nestle disagree on interpretation of an industry-funded study.** Both perspectives are preserved in the review. The user is told the study has methodological defense but also funding context.
- **Davis identifies a historical antecedent that Keys is not aware of.** Keys revises in light of the historical context.
- **Lind's methodology reading rejects a finding Keys defends.** Both are preserved. Lind's methodological critique is the primary finding; Keys's evidence reading is the counter-position.

### External

- **Clinical nutrition emergency:** Escalate to a medical provider.
- **The claim requires food-system or pedagogy treatment:** Escalate to the analysis team or to the appropriate specialist directly.

## Token / time cost

- **Lind** — 2 Opus invocations, ~40K tokens
- **Keys** — 1 Opus invocation, ~50K tokens
- **Nestle** — 1 Opus invocation, ~40K tokens
- **Davis** — 1 Sonnet invocation, ~25K tokens
- **Total** — 150-200K tokens, 3-8 minutes wall-clock

Cheaper than the full analysis team, with greater depth on the evidence question.

## Invocation

```
# Study critique
> nutrition-workshop-team: Can you walk me through this 2016 paper on
  saturated fat re-analysis? I want to know how much weight to put on it.

# Contested-claim deep dive
> nutrition-workshop-team: What does the evidence actually say about red
  meat and cancer? I keep seeing different headlines.

# Popular book review
> nutrition-workshop-team: I'm reading an old copy of Let's Get Well by
  Adelle Davis. Which of her chapter on cardiovascular health has held up?

# Guideline-versus-evidence gap
> nutrition-workshop-team: Why did the 2015 Dietary Guidelines drop the
  dietary cholesterol limit? What was the actual evidence?
```

## Limitations

- The workshop team does not include Pollan (food-system) or Satter (pedagogy). Use the analysis team if those dimensions are required.
- Depth on the evidence question costs time. Routine questions should be routed through Lind's direct router instead.
- Historical-transparency treatment uses Davis as the representative agent, but the pattern applies across popular-nutrition writing generally — Pauling's vitamin C, the Shute brothers' vitamin E, Rodale's supplements. Davis is the primary but not only reference.
