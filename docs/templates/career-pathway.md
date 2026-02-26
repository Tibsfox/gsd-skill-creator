---
title: "Career Pathway Template"
layer: templates
path: "templates/career-pathway.md"
summary: "Domain-agnostic template for mapping career transitions with skills, salary, resources, timeline, AI prompt, and portfolio projects at three levels."
cross_references:
  - path: "templates/index.md"
    relationship: "builds-on"
    description: "Part of template library"
  - path: "applications/power-efficiency.md"
    relationship: "extracted-from"
    description: "Template extracted from Power Efficiency Rankings career transition sections"
  - path: "templates/educational-pack.md"
    relationship: "parallel"
    description: "Used within educational pack topic sections"
  - path: "templates/ai-learning-prompt.md"
    relationship: "parallel"
    description: "AI prompt patterns complement career pathway learning"
reading_levels:
  glance: "Reusable template for mapping career transitions with skills, milestones, and learning paths."
  scan:
    - "Domain-agnostic structure for any career transition"
    - "Covers background, skills, salary, resources, timeline, AI prompt, portfolio"
    - "Three portfolio project levels: beginner, intermediate, proficient"
    - "Customization markers in [brackets] for field-specific adaptation"
    - "Extracted from Power Efficiency Rankings career sections"
created_by_phase: "v1.34-330"
last_verified: "2026-02-25"
---

# Career Pathway Template

This template defines the structure for a single career transition pathway. It maps the
journey from a current role to a target role within any professional domain, providing the
specific details a person needs to evaluate whether the transition is viable and how to
execute it.

The template was extracted from the career transition sections in the Global Power
Efficiency Rankings page (tibsfox.com/Global-Power-Efficiency-Rankings.html), where it
appears 2-6 times per topic area. The original context is energy efficiency, but the
structure is deliberately domain-agnostic. It works for any field where career transitions
involve acquiring new skills, building a portfolio, and demonstrating competence at
progressive levels.


## When to Use

Use this template when documenting career transitions that meet these criteria:

- A clear "from" role and "to" role exist (not vague career exploration)
- The transition requires identifiable skills that can be learned and demonstrated
- Portfolio projects can meaningfully show competence progression
- Salary data and learning resources are available for the target role

The template is designed to be embedded within larger educational content (see
[Educational Pack Template](educational-pack.md)) or used standalone for career
guidance pages.

This template is not appropriate for lateral moves within the same role family (e.g.,
"Senior Developer to Staff Developer") where the transition is about scope and judgment
rather than new technical skills. It works best when the person needs to cross a skill
boundary.


## How to Use

Fill in each section top-down. The background section frames who this pathway is for. The
skills section identifies the gap. The salary and resources sections establish the
destination and the path. The AI prompt gives the reader a head start on self-directed
learning. The portfolio projects prove they can do the work.

The hardest part is writing realistic portfolio projects at three levels. Each project must
have a concrete deliverable -- not "learn about [topic]" but "build a [thing] that
demonstrates [capability]." The hour estimates should reflect actual effort for someone
at that level, not aspirational minimums.

For the AI prompt, use one of the patterns from the
[AI Learning Prompt Template](ai-learning-prompt.md). The Structured Learning Roadmap
pattern works well for most career transitions. The Socratic Tutor pattern works better
when the person has adjacent domain knowledge that AI can draw out.


## Template

### Pathway Header

```markdown
### [Current Role] to [Target Role]
```

Use specific role titles, not generic labels. "HVAC Technician to Building Energy Analyst"
is good. "Worker to Professional" is not.

### Background

```markdown
**Background:** [1-2 sentences describing what this person currently does, what they
know, and what transferable skills they bring. Be specific about the starting point.]
```

The background should make the reader immediately recognize whether this pathway applies
to them. Name concrete skills and experience, not personality traits.

### Skills to Add

```markdown
**Skills to add:**
- [Specific named skill 1] -- [why this skill matters for the target role]
- [Specific named skill 2] -- [why this skill matters]
- [Specific named skill 3] -- [why this skill matters]
- [Specific named skill 4] -- [optional, if needed]
```

List 3-5 specific, named skills. "Data analysis" is too vague. "Statistical analysis
using Python (pandas, scipy)" is specific enough to act on. Each skill should include
a brief note on why the target role requires it.

### Salary Range

```markdown
**Salary range:** $[low]-$[high] ([country], varies by [relevant factors])
```

Always include geographic context and caveats. Salary data ages quickly, so note the
source year when possible. If the range spans a wide band, explain what drives the
variation (experience, certification, industry sector, location).

### Learning Resources

```markdown
**Learning resources:**
1. [Resource name] -- [free | paid ($amount)] -- [URL]
2. [Resource name] -- [free | paid ($amount)] -- [URL]
3. [Resource name] -- [free | paid ($amount)] -- [URL]
4. [Resource name] -- [free | paid ($amount)] -- [URL]
5. [Resource name] -- [free | paid ($amount)] -- [URL]
```

Include 3-5 resources. Mix free and paid options. Prioritize resources that are
well-maintained and widely recognized. Include the URL so readers can evaluate the
resource immediately. Note whether a resource leads to a certification.

### Timeline

```markdown
**Timeline:** [Duration] with [hours per week] of study
```

Be realistic. Most career transitions take 6-18 months of consistent effort. If a
pathway genuinely requires 2+ years, say so. Underestimating the timeline sets
people up for discouragement.

Include the expected weekly time commitment. "12 months" means different things at
5 hours per week versus 20 hours per week.

### AI Learning Prompt

```markdown
**AI Learning Prompt:**

> "[Complete, copy-paste-ready prompt using one of the patterns from
> the AI Learning Prompt Template. Include customization markers in
> [brackets] where the user substitutes their own details:
> [your current role], [X years of experience], [specific skills
> you want to build on], [your target timeline].]"
```

The prompt must produce useful output when pasted directly into an AI assistant. It
should reference the specific transition (current role, target role) and leverage the
person's existing background. See the
[AI Learning Prompt Template](ai-learning-prompt.md) for the three standard patterns.

### Portfolio Projects

```markdown
**Portfolio Projects:**

| Level | Project | Hours | Deliverable |
|-------|---------|-------|-------------|
| Beginner | [Project description] | [8-15] | [Concrete output] |
| Intermediate | [Project description] | [25-40] | [Professional-quality output] |
| Proficient | [Project description] | [50-80] | [Job-ready output] |
```

**Beginner projects** (8-15 hours) demonstrate that the person understands the
fundamentals. The deliverable should be something they can show in a conversation:
a simple analysis, a prototype, a documented experiment.

**Intermediate projects** (25-40 hours) demonstrate professional competence. The
deliverable should be something they could present to a hiring manager: a complete
analysis with recommendations, a working tool, a case study with real data.

**Proficient projects** (50-80 hours) demonstrate job readiness. The deliverable should
be indistinguishable from professional work: a comprehensive study, a production-quality
tool, or a multi-part project that shows both depth and breadth.

Every project must have a specific deliverable. "Study [topic]" is not a deliverable.
"Write a 10-page analysis of [topic] using [data source] with visualizations and
recommendations" is a deliverable.


## Complete Example (Skeleton)

This skeleton shows all sections assembled for a single pathway.

```markdown
### Retail Manager to Supply Chain Analyst

**Background:** Currently manages a retail store with experience in inventory management,
vendor relationships, and sales forecasting. Understands demand patterns intuitively but
lacks formal analytical tools.

**Skills to add:**
- SQL and database querying -- supply chain data lives in relational databases
- Statistical forecasting (Python or R) -- replacing intuition with quantitative models
- Supply chain management principles (APICS CSCP) -- industry-standard framework
- Data visualization (Tableau or Power BI) -- communicating findings to stakeholders

**Salary range:** $55,000-$85,000 (US, varies by industry and metro area)

**Learning resources:**
1. Khan Academy SQL Course -- free -- https://www.khanacademy.org/computing/computer-programming/sql
2. Google Data Analytics Certificate -- paid ($49/month) -- https://grow.google/certificates/data-analytics
3. APICS CSCP Certification -- paid ($1,500-$2,500) -- https://www.ascm.org/cscp
4. Python for Data Analysis (O'Reilly) -- paid ($50) -- https://www.oreilly.com
5. Kaggle Supply Chain Datasets -- free -- https://www.kaggle.com/datasets

**Timeline:** 9-15 months with 8-10 hours/week of study

**AI Learning Prompt:**

> "Act as a career mentor who has helped retail managers transition into supply chain
> analytics. I am a retail store manager with [X years] of experience managing inventory,
> vendor orders, and staff scheduling. Create a 12-month learning roadmap to become
> job-ready as a supply chain analyst. The plan should: (1) Build on my existing skills
> in inventory management and demand intuition, (2) Address gaps in SQL, statistical
> forecasting, and formal supply chain frameworks, (3) Include 3 portfolio projects using
> real supply chain datasets. Format as a monthly breakdown with specific tasks, resources,
> and deliverables."

**Portfolio Projects:**

| Level | Project | Hours | Deliverable |
|-------|---------|-------|-------------|
| Beginner | Analyze a public retail dataset to identify seasonal demand patterns | 12 | Written report with 3 visualizations and trend summary |
| Intermediate | Build a demand forecasting model for a product category using historical sales data | 35 | Python notebook with model, accuracy metrics, and executive summary |
| Proficient | Design an end-to-end supply chain optimization study for a multi-location retailer | 60 | 20-page report with data pipeline, forecasting model, cost analysis, and recommendations |
```


## Quality Checks

Every career pathway must pass these checks.

- [ ] Current and target roles use specific job titles, not generic labels
- [ ] Background description names concrete skills and experience
- [ ] Skills to add are specific enough to search for courses (not "data skills")
- [ ] Salary range includes geographic context and source year
- [ ] Learning resources include both free and paid options with working URLs
- [ ] Timeline includes weekly hour commitment, not just total months
- [ ] AI prompt is complete and copy-paste ready with [bracket] customization markers
- [ ] Portfolio projects have concrete deliverables at all three levels
- [ ] Hour estimates are realistic for someone at each level
- [ ] Proficient project produces something indistinguishable from professional work


## Source Exemplar

This template was extracted from the career transition pathways in the Global Power
Efficiency Rankings page (tibsfox.com/Global-Power-Efficiency-Rankings.html). The original
page includes 2-6 career pathways per topic area, each following this structure for roles
spanning HVAC technicians, building managers, electrical engineers, policy analysts, and
software developers transitioning into energy efficiency specializations.
