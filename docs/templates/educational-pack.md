---
title: "Educational Pack Template"
layer: templates
path: "templates/educational-pack.md"
summary: "Reusable template for creating educational packs with evidence-based content, AI tool tips, career pathways, and hands-on projects."
cross_references:
  - path: "templates/index.md"
    relationship: "builds-on"
    description: "Part of template library"
  - path: "applications/power-efficiency.md"
    relationship: "extracted-from"
    description: "Template extracted from Power Efficiency Rankings exemplar"
  - path: "templates/career-pathway.md"
    relationship: "parallel"
    description: "Career pathway detail template used within topic sections"
  - path: "templates/ai-learning-prompt.md"
    relationship: "parallel"
    description: "AI prompt patterns used within AI Tool Tips"
reading_levels:
  glance: "Reusable template for creating educational packs with evidence, AI tips, career pathways, and labs."
  scan:
    - "Extracted from Power Efficiency Rankings exemplar (tibsfox.com)"
    - "Three-part structure: domain overview, topic sections, cross-cutting themes"
    - "Topic sections include evidence, AI tips, case studies, DIY projects, career pathways"
    - "Includes quality checks and when-to-use guidance"
    - "Customization markers in [brackets] for domain-specific adaptation"
created_by_phase: "v1.34-330"
last_verified: "2026-02-25"
---

# Educational Pack Template

This template defines the structure for educational packs -- comprehensive learning resources
that combine evidence-based content, AI-assisted learning, career transition guidance, and
hands-on projects. It was extracted from the Global Power Efficiency Rankings page
(tibsfox.com/Global-Power-Efficiency-Rankings.html), the most fully realized educational
artifact in the tibsfox.com ecosystem.

The template is domain-agnostic. It works for energy, computing, health, finance, or any
subject where the goal is to teach through a combination of reference material and guided
practice. Every section below includes customization markers in [brackets] where
domain-specific content replaces the placeholder.


## When to Use

Use this template when creating educational content that needs to serve multiple purposes
simultaneously: reference lookup for experienced practitioners, learning journeys for
newcomers, and career guidance for people considering a field transition.

The template is appropriate when the content meets these conditions:

- The domain has quantifiable data and verifiable sources (not opinion-based content)
- Multiple career pathways exist within the domain (not a single-track profession)
- Hands-on projects can bridge theory to practice with accessible tools
- AI assistants can meaningfully accelerate learning in the domain

If the content is purely theoretical with no practical application, or if the domain lacks
quantifiable evidence, a simpler article or guide format may be more appropriate.


## How to Use

Start by choosing your domain and identifying 4-8 topics within it. Each topic becomes a
repeating section in the template. Then work through the structure top-down: domain overview
first (to establish scope and credibility), topic sections next (the bulk of the content),
and cross-cutting themes last (to synthesize patterns across topics).

For each topic section, the most time-intensive parts are the career pathways and case
studies. Gather these before writing -- they require research into real organizations,
salary data, and learning resources. The AI Tool Tips and DIY Projects can be drafted once
the evidence-based content is solid.

The quality checks at the end are not optional. Every educational pack should pass all
checks before publication.


## Structure

### 1. Domain Overview Section

The domain overview establishes what the pack covers and why it matters. It provides the
data-driven foundation that gives the rest of the content authority.

#### Key Findings

Present 3-4 data-driven insights that frame the entire domain. Each finding should cite
a specific source and include a concrete number.

```markdown
### Key Findings

- **[Finding 1]:** [Statistic or metric] according to [Source, Year].
  [One sentence explaining significance.]
- **[Finding 2]:** [Statistic or metric] from [Source, Year].
  [One sentence explaining significance.]
- **[Finding 3]:** [Statistic or metric] per [Source, Year].
  [One sentence explaining significance.]
- **[Finding 4]:** [Statistic or metric] based on [Source, Year].
  [One sentence explaining significance.]
```

#### Metrics Dashboard

A table of 4-6 key numbers that give the reader a quantitative snapshot of the domain.
Every metric must have a source.

```markdown
### [Domain] at a Glance

| Metric | Value | Source |
|--------|-------|--------|
| [Metric name] | [Value with units] | [Source, Year] |
| [Metric name] | [Value with units] | [Source, Year] |
| [Metric name] | [Value with units] | [Source, Year] |
| [Metric name] | [Value with units] | [Source, Year] |
| [Metric name] | [Value with units] | [Source, Year] |
```

#### Trend Analysis

Two to three paragraphs covering what is changing in the domain, what trajectory the data
suggests, and what matters most for practitioners and learners. This section connects the
static metrics above to a dynamic story about where the field is heading.

```markdown
### Trends and Outlook

[2-3 paragraphs on current trends, emerging developments, and
implications for practitioners. Include inline citations.]
```

#### Data Sources

A numbered reference list of all sources cited in the overview. Use consistent formatting
with organization name, publication title, year, and URL where available.

```markdown
### Data Sources

1. [Organization]. *[Publication Title]*. [Year]. [URL]
2. [Organization]. *[Publication Title]*. [Year]. [URL]
3. [Organization]. *[Publication Title]*. [Year]. [URL]
```


### 2. Topic Sections (Repeat per Topic)

Each topic in the educational pack follows the same internal structure. This consistency
lets readers know exactly where to find what they need within any topic, regardless of
subject matter.

A pack typically contains 4-8 topics. Fewer than four suggests the domain is too narrow
for a pack format. More than eight suggests the domain should be split into multiple packs.

```markdown
## [Topic Name]

[Opening paragraph: what this topic covers, why it matters within the domain,
and how it connects to adjacent topics.]
```

#### Evidence-Based Content

The core informational content for the topic. Every claim must be backed by a citation.

**Impact classification** labels each topic by its relative importance within the domain:

```markdown
**Impact Level:** [Highest Impact | High Impact | Moderate Impact | Emerging]
```

**Key statistic** -- a single bold number that captures the topic's significance:

```markdown
> **[Percentage or dollar figure]** -- [one sentence explaining what this number means].
> *Source: [Citation]*
```

**Body content** -- 3-4 paragraphs of factual content with inline source citations.
Each paragraph should make a specific claim, support it with evidence, and connect it
to the reader's interests.

**Actionable checklist** -- concrete steps the reader can implement:

```markdown
#### Quick Wins

- [ ] [Action item with specific, measurable outcome]
- [ ] [Action item with specific, measurable outcome]
- [ ] [Action item with specific, measurable outcome]
- [ ] [Action item with specific, measurable outcome]
```

**Data table** -- topic-specific metrics with sourced data:

```markdown
#### [Topic] by the Numbers

| [Dimension] | [Metric 1] | [Metric 2] | Source |
|-------------|-----------|-----------|--------|
| [Row label] | [Value]   | [Value]   | [Ref]  |
| [Row label] | [Value]   | [Value]   | [Ref]  |
| [Row label] | [Value]   | [Value]   | [Ref]  |
```

#### AI Tool Tip (Embedded in Topic)

Each topic includes one AI Tool Tip that demonstrates how an AI assistant can accelerate
learning or practice in that specific area. The tip is embedded within the topic section,
not separated into an appendix.

```markdown
#### AI Tool Tip: [Descriptive Title]

**Use case:** [One sentence describing what problem this solves]

**How to do it:** [1-2 sentences with practical instructions]

> "[Complete, copy-paste-ready prompt. Include customization markers
> in [brackets] where the user should substitute their own details,
> such as [your current role], [your experience level], or
> [specific metric from your situation].]"

**Real-world example:** [One sentence citing a study or case that
validates this approach, with approximate impact metric.]
```

The prompt must be complete enough to produce useful output when pasted directly into
an AI assistant. Vague prompts like "ask AI about [topic]" fail the quality check.

#### Real-World Case Studies (2-3 per Topic)

Case studies ground the topic in actual outcomes. Each case study names a real
organization, cites a specific metric, and briefly explains the approach.

```markdown
#### Case Studies

**[Organization Name]** -- [Context: industry, size, location]
Achieved **[specific metric]** by [brief explanation of approach].
[1-2 additional sentences on methodology or timeline.]
*Source: [Citation with reference number]*

**[Organization Name]** -- [Context]
Achieved **[specific metric]** through [approach].
[Additional detail.]
*Source: [Citation]*
```

Use two to three case studies per topic. They should represent different scales or
contexts to demonstrate that the topic applies broadly.

#### DIY Project Ideas (2 per Topic)

Hands-on projects bridge the gap between understanding a topic and applying it. Each
topic includes two DIY projects for individual learners and one or two commercial
concepts for entrepreneurial readers.

```markdown
#### DIY Projects

**[Project Title]**
[2-3 sentence description of what to build and what the learner gains.]
- **Estimated cost:** [Dollar range or "free"]
- **Difficulty:** [Beginner | Intermediate | Advanced]
- **Skills required:** [Specific skills, tools, or prerequisites]
- **Time estimate:** [Hours or days]

**[Project Title]**
[2-3 sentence description.]
- **Estimated cost:** [Dollar range]
- **Difficulty:** [Level]
- **Skills required:** [Skills]
- **Time estimate:** [Hours or days]
```

```markdown
#### Commercial Concepts

**[Business Concept Name]**
- **Target market:** [Who buys this]
- **Revenue model:** [How it makes money]
- **Value proposition:** [2-3 sentences on why customers would pay for this]
```

#### Career Transition Pathways (2-6 per Topic)

Career pathways are the most research-intensive part of the template. Each pathway maps
a transition from a current role to a target role within the topic area. The structure
ensures that every pathway is actionable, not aspirational.

Include 2-6 pathways per topic. Pathways should span different entry-level backgrounds,
not just technical roles. A topic about data analysis, for example, should include pathways
from teaching, administration, and trades -- not just from software engineering.

For the detailed single-pathway structure, see the
[Career Pathway Template](career-pathway.md).

```markdown
#### Career Pathways

##### [Current Role] to [Target Role]

**Background:** [What the person currently does and knows]

**Skills to add:**
- [Specific named skill 1]
- [Specific named skill 2]
- [Specific named skill 3]

**Salary range:** [USD range with geographic caveat, e.g., "$65,000-$95,000 (US, varies by region)"]

**Learning resources:**
1. [Resource name] -- [free/paid] -- [URL]
2. [Resource name] -- [free/paid] -- [URL]
3. [Resource name] -- [free/paid] -- [URL]

**Timeline:** [Realistic estimate, e.g., "6-12 months with 10 hours/week"]

**AI Learning Prompt:**

> "[Complete Socratic or structured learning prompt with customization
> markers in [brackets]. See AI Learning Prompt Template for patterns.]"

**Portfolio Projects:**

| Level | Project | Hours | Deliverable |
|-------|---------|-------|-------------|
| Beginner | [Project description] | 8-15 | [Clear deliverable] |
| Intermediate | [Project description] | 25-40 | [Professional deliverable] |
| Proficient | [Project description] | 50-80 | [Job-ready deliverable] |
```


### 3. Cross-Cutting Themes Section

After all topic sections, a cross-cutting themes section synthesizes patterns that span
multiple topics. This section helps readers see the forest, not just the trees.

Include 3-4 theme boxes, each summarizing a pattern observed across the topics covered
in the pack.

```markdown
## Cross-Cutting Themes

### [Theme Name]

[2-3 paragraphs connecting this theme across multiple topics.
Reference specific topics by name. Explain why this pattern
matters and what it implies for practitioners.]

### [Theme Name]

[2-3 paragraphs on the next cross-cutting theme.]

### [Theme Name]

[2-3 paragraphs on the next cross-cutting theme.]
```

These themes should emerge naturally from the topic content. If a theme requires
significant new research beyond what the topics already cover, it may belong in its
own topic section instead.


## Quality Checks

Every educational pack must pass these checks before publication.

- [ ] Every statistic has a cited source (no unsourced claims)
- [ ] Every AI prompt is copy-paste ready with customization markers in [brackets]
- [ ] Career pathways span multiple entry-level backgrounds (not just technical roles)
- [ ] DIY projects have realistic cost and time estimates
- [ ] Portfolio projects have clear deliverables, not vague goals
- [ ] Content serves both reference lookup and sequential reading
- [ ] Impact classification is assigned to every topic
- [ ] Case studies name real organizations with verifiable metrics
- [ ] Learning resources include a mix of free and paid options
- [ ] Cross-cutting themes reference specific topics by name
- [ ] Data tables include source columns
- [ ] The domain overview cites at least 4 distinct data sources


## Source Exemplar

This template was extracted from the Global Power Efficiency Rankings page
(tibsfox.com/Global-Power-Efficiency-Rankings.html), the most comprehensive
educational artifact in the tibsfox.com ecosystem. The original page demonstrates
every section in this template applied to the energy efficiency domain.
