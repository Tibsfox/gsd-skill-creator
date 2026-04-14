---
name: nutrition-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/nutrition-department/README.md
description: >
  Coordinated nutrition department — seven named agents, six knowledge
  skills, three teams. Forked from the department template pattern
  first instantiated by math-department. Enforces evidence-tier
  labeling and applies historical-transparency treatment to popular-
  nutrition writing, including the documented harm case involving
  Adelle Davis's published protocols.
superseded_by: null
---

# Nutrition Department

## 1. What is the Nutrition Department?

The Nutrition Department chipset is a coordinated set of reasoning agents, domain skills, and pre-composed teams that together provide structured nutrition support across biochemistry, dietary assessment, food policy, food systems, popular-nutrition history, and feeding pedagogy. It is an instantiation of the department template pattern established by the math department: a router-topology architecture in which a single chair agent classifies incoming queries and dispatches them to named specialists whose work products are persisted as Grove records linked to the college concept graph.

Where the math department's specialists are named after historical mathematicians whose work maps to their roles, the nutrition department is named after historical figures whose work maps to the nutrition specialist roles: James Lind as the chair (because the 1747 scurvy trial is the first controlled clinical trial in history and the founding methodological gesture of the field), Ancel Keys for cardiovascular and dietary-pattern research, Marion Nestle for policy and industry-influence analysis, Wilbur Atwater for macronutrient accounting and reference intakes, Adelle Davis for popular-nutrition writing with historical-transparency treatment, Michael Pollan for food-system and food-culture framing, and Ellyn Satter for feeding pedagogy.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
cp -r examples/chipsets/nutrition-department .claude/chipsets/nutrition-department
```

The chipset activates when any of the six skill trigger patterns match an incoming query. Lind (the router) classifies the query along four dimensions — domain, evidence strength, type, learner level — and dispatches to the appropriate specialist. No explicit activation command is required.

To verify the chipset parses:

```bash
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/nutrition-department/chipset.yaml', 'utf8')).name)"
# Expected output: nutrition-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (tasks requiring judgment under ambiguity), four on Sonnet (framework-driven analysis and pedagogy).

| Name          | Historical Figure    | Role                                                             | Model  | Tools                         |
|---------------|----------------------|------------------------------------------------------------------|--------|-------------------------------|
| lind          | James Lind           | Department chair — classification, routing, synthesis, tier labels | opus   | Read, Glob, Grep, Bash, Write |
| ancel-keys    | Ancel Keys           | Cardiovascular specialist — lipid metabolism, dietary-pattern cohorts | opus   | Read, Grep, Bash              |
| marion-nestle | Marion Nestle        | Policy specialist — DGA, industry influence, funding disclosure  | opus   | Read, Grep, Write             |
| atwater       | Wilbur Atwater       | Macronutrient specialist — energy balance, reference intakes, food composition | sonnet | Read, Grep, Bash              |
| adelle-davis  | Adelle Davis         | Historical specialist — popular-nutrition writing, replication failures, transparency | sonnet | Read, Grep                    |
| pollan        | Michael Pollan       | Food-system specialist — supply chain, ingredient reading, cultural framing | sonnet | Read, Grep                    |
| satter        | Ellyn Satter         | Pedagogy specialist — Division of Responsibility, feeding relationships | sonnet | Read, Write                   |

Lind is the CAPCOM (single point of contact for the user). All other agents receive dispatched subtasks and return results through Lind.

Three notes on the roster. **First**, Marion Nestle lives in the Nutrition Department rather than the Home Economics Department. Her academic work is nutrition policy and food-industry analysis at NYU, not domestic science. Home-economics uses a different figure (Gilbreth) for its domestic-management role. **Second**, Adelle Davis is included with historical-transparency treatment — see section 10 of this document and the adelle-davis AGENT.md for details. **Third**, the chair (Lind) is the oldest figure on the roster by nearly two centuries; this is intentional. The department's identity rests on controlled-trial method, and Lind's 1747 experiment is the earliest clean instance of that method.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                            | Domain    | Trigger Patterns                                                         | Agent Affinity                 |
|----------------------------------|-----------|--------------------------------------------------------------------------|--------------------------------|
| nutrition-science-foundations    | nutrition | calorie, macronutrient, energy, reference intake, RDA, DRI, composition  | atwater, lind                  |
| dietary-assessment               | nutrition | dietary recall, FFQ, diet diary, biomarker, controlled feeding, measurement error | lind, ancel-keys               |
| nutrient-metabolism              | nutrition | metabolism, lipoprotein, LDL, HDL, insulin, iron, folate, biochemistry   | atwater, ancel-keys            |
| food-policy-and-politics         | nutrition | dietary guidelines, DGA, food policy, SNAP, WIC, food labeling, industry funding | marion-nestle, pollan          |
| contested-claims-in-nutrition    | nutrition | contested, saturated fat, red meat, ultra-processed, cholesterol, replication | ancel-keys, marion-nestle, adelle-davis |
| feeding-pedagogy                 | nutrition | child feeding, picky eater, Division of Responsibility, sDOR, curriculum | satter, marion-nestle          |

Agent affinity means the skill's content is preferentially loaded into the listed agent's context. Multiple affinities mean the skill is relevant to more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                       | Agents                                                            | Use When                                                                |
|----------------------------|-------------------------------------------------------------------|-------------------------------------------------------------------------|
| nutrition-analysis-team    | lind, ancel-keys, marion-nestle, atwater, adelle-davis, pollan, satter | Multi-domain, contested-claim, or full-analysis requests                 |
| nutrition-workshop-team    | lind, ancel-keys, marion-nestle, adelle-davis                     | Study critique, contested-claim deep dives, popular-nutrition book review |
| nutrition-practice-team    | lind, atwater, pollan, satter                                     | Family feeding, grocery store translation, meal planning, ongoing practice |

**nutrition-analysis-team** is the full department. Use it for multi-domain problems and for questions where the strength of evidence itself is the question.

**nutrition-workshop-team** pairs the chair with the evidence, policy, and historical specialists. Use it for deep-dive critique of a single study or claim, where the response needs tier labels and funding context.

**nutrition-practice-team** is the practice-oriented team. Use it for everyday food and feeding questions where the user needs actionable guidance that respects both the evidence base and the real-world food environment.

## 6. Grove Record Types

All department work products are persisted as Grove records under the `nutrition-department` namespace. Exactly five record types are defined:

| Record Type            | Produced By                      | Key Fields                                                              |
|------------------------|----------------------------------|-------------------------------------------------------------------------|
| NutritionAnalysis      | ancel-keys, atwater, marion-nestle, pollan | Food composition, mechanism analysis, dietary-pattern analysis, claim diagnosis |
| NutritionAssessment    | atwater                          | Individual or population intake assessment against reference intakes   |
| NutritionReview        | marion-nestle, ancel-keys, adelle-davis | Study critique, guideline analysis, popular-nutrition claim review     |
| NutritionExplanation   | atwater, pollan, satter, ancel-keys | Level-appropriate teaching, food-system translation, pedagogy framing  |
| NutritionSession       | lind                             | Session log, classification, tier labels, funding flags, historical-transparency annotations |

Records are content-addressed and immutable once written. NutritionSession records link all work products from a single interaction, providing an audit trail from query to result.

## 7. College Integration

The chipset connects to the college nutrition department concept graph:

- **Concept graph read/write**: agents read existing concept definitions and write new ones for uncovered topics.
- **Try Session generation**: a NutritionExplanation can trigger interactive practice generation.
- **Learning pathway updates**: completed analyses, assessments, and explanations update the learner's progress along college-defined pathways.
- **Five wings** map to the college nutrition department structure:
  1. Nutrition Science Foundations
  2. Dietary Assessment and Research Methods
  3. Food Policy and Public Health Nutrition
  4. Food Systems and Food Culture
  5. Feeding Relationships and Nutrition Pedagogy

## 8. Customization Guide

The nutrition department is one instantiation of the department template pattern. To create a department for another applied domain, follow these steps.

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/nutrition-department examples/chipsets/newdomain-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure references. Select figures whose contributions map to the specialist roles and whose work teaches domain history.

### Step 3: Replace skills with domain-appropriate content

Swap the six nutrition skills for domain equivalents. Each skill needs a domain value, description, triggers, and agent affinity mapping.

### Step 4: Define new Grove record types

Replace the five `NutritionX` record types with domain-appropriate types. The minimum is diagnostic, assessment, review, explanation, and session.

### Step 5: Map to the target college department

Update the `college` section — department, wings, read/write permissions.

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. Default gates are generic enough for most departments. Update `benchmark.domains_covered`.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Lind) as the entry point for all queries. Three benefits:

1. **Classification and tier labeling.** Lind determines which specialists are relevant and assigns strength-of-evidence tiers. Tier discipline is the department's distinctive commitment.
2. **Method framing.** Lind is specifically chosen as the chair because the 1747 scurvy trial is the paradigm of controlled comparison, and most nutrition questions benefit from starting with method rather than rushing to answer.
3. **CAPCOM boundary.** The user interacts with exactly one agent, reducing cognitive load and providing consistent communication style.

### Why 3 Opus / 4 Sonnet

Model assignment follows reasoning depth:

- **Opus agents** (lind, ancel-keys, marion-nestle): judgment under ambiguity. Classification and synthesis with tier enforcement, contested-evidence interpretation, and policy-industry pattern analysis all involve multi-step reasoning where errors compound.
- **Sonnet agents** (atwater, adelle-davis, pollan, satter): framework-driven analysis. Macronutrient accounting, historical replication lookup, food-system translation, and feeding-relationship framing benefit from fast turnaround with clear protocols.

This split matches the math and business department ratios — the reference points.

### Team structure

The three teams cover the three most common nutrition query shapes: multi-domain full analysis, focused study or claim critique, and real-world practice translation. Teams are not exclusive; Lind can assemble ad-hoc groups.

## 10. Posture on Contested Claims and Historical Transparency

Nutrition is a domain with active scientific contention. The department's commitment is that contested questions are presented as contested, settled questions as settled, and replication failures as replication failures — with explicit tier labels on every substantive claim. The strength-of-evidence tiers used across the department are:

- **Settled** — multiple independent study designs including controlled trials converge. Example: citrus cures scurvy; folic acid fortification reduces neural tube defects.
- **Strong** — supported by multiple lines of evidence with some methodological limitations. Example: saturated fat raises LDL-C in controlled feeding.
- **Contested but plausible** — supported by some lines, challenged by others, active debate ongoing. Example: the clinical cardiovascular outcome from saturated-fat reduction in free-living populations over decades.
- **Weak** — mainly mechanistic or observational with limited confirmation. Example: most specific polyphenol-disease claims.
- **Not replicated / disproven** — previously believed, subsequent evidence did not support. Example: vitamin E supplementation for primary CVD prevention; dietary cholesterol in isolation raising serum cholesterol for most people; several Davis-era specific dose claims.

Lind enforces these labels. A response that cannot carry a label is flagged "assessment pending" rather than delivered without one.

### Historical transparency — Adelle Davis

Adelle Davis (1904–1974) is on the department roster because her mid-twentieth-century popular-nutrition writing remains a reference point for the whole-food advocacy tradition and because users routinely arrive with claims traceable to her books. The department carries her record transparently, matching the Business Department's treatment of Henry Ford.

**What Davis contributed.** Whole-food advocacy ahead of its time. Skepticism of the post-war explosion of ultra-processed products. Integration of cooking and nutrition as a single subject. Making nutrition accessible to lay readers. Influence on the organic and natural-food movements that followed. These contributions are real and are not dismissed.

**What did not survive replication.** Davis made strong, specific dose-response claims for individual vitamins and minerals that went beyond the evidence base of her time. Her vitamin A, D, and E megadose recommendations were criticized during her lifetime by the AMA and the American Dietetic Association and were subsequently contradicted by controlled-trial evidence. Many of her specific claims sit in the "not replicated" or "disproven" tier.

**Documented harm.** The historical record of Davis's writings includes at least one documented case of fatal hypernatremia in a child whose caregiver followed a salt-administration protocol described in one of her books. This case is part of the legal and public record and is cited in histories of American nutrition. The department acknowledges this case when reviewing Davis substantively, rather than sanitizing the historical record. Popular-nutrition writing whose claims outrun the evidence can harm readers who follow it; this is not hypothetical.

**How the department handles Davis-era claims.** The adelle-davis agent distinguishes three layers in any Davis-era claim: the dietary-pattern advice (which usually held up), the nutrient-identification advice (which usually holds up with adjustment), and the specific dose or pharmacological claim (which is where the replication failures cluster). The agent labels each layer with its current tier. The tone is neutral and factual — not prosecutorial, not defensive.

## 11. Relationship to Other Departments

The nutrition department complements several other departments:

- **Medical department** handles clinical nutrition questions, feeding-tube decisions, enteral and parenteral nutrition, and the treatment of eating disorders. Nutrition hands off to medical for clinical care.
- **Home economics department** handles domestic practice — cooking, food safety, household food management. Home economics uses Gilbreth for its household-management role; Marion Nestle stays in nutrition because her work is policy, not domestic practice.
- **Statistics department** handles quantitative methods that nutrition epidemiology draws on — cohort analysis, measurement-error modeling, meta-analysis.
- **Public health department** handles population-level intervention design and program evaluation. Nutrition supplies the content for public health nutrition programs.
- **Agriculture department** handles food production and the supply chain. Pollan draws on agriculture-department content for food-system questions.

Future integration could formalize cross-department referrals via a dispatch protocol, so that a nutrition-analysis-team could call out to a statistics specialist for a measurement-error question without leaving the nutrition department's session context.
