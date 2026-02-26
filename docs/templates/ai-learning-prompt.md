---
title: "AI Learning Prompt Template"
layer: templates
path: "templates/ai-learning-prompt.md"
summary: "Three copy-paste-ready prompt patterns for AI-assisted learning: structured roadmap, Socratic tutor, and hands-on project design."
cross_references:
  - path: "templates/index.md"
    relationship: "builds-on"
    description: "Part of template library"
  - path: "applications/power-efficiency.md"
    relationship: "extracted-from"
    description: "Template extracted from Power Efficiency Rankings AI Tool Tips"
  - path: "templates/career-pathway.md"
    relationship: "parallel"
    description: "AI prompts complement career pathway learning sections"
  - path: "templates/educational-pack.md"
    relationship: "parallel"
    description: "AI prompts used within educational pack AI Tool Tips"
reading_levels:
  glance: "Three prompt patterns for AI-assisted learning: structured roadmap, Socratic tutor, and project design."
  scan:
    - "Pattern 1: Structured Learning Roadmap (career mentor persona)"
    - "Pattern 2: Socratic Tutor (question-based discovery)"
    - "Pattern 3: Hands-On Project Design (portfolio project generator)"
    - "All prompts are copy-paste ready with [bracket] customization markers"
    - "Extracted from Power Efficiency Rankings AI Tool Tips"
created_by_phase: "v1.34-330"
last_verified: "2026-02-25"
---

# AI Learning Prompt Template

This template provides three prompt patterns for integrating AI-assisted learning into
educational content. Each pattern serves a different learning goal: planning a structured
path, discovering concepts through guided questioning, or designing a hands-on project.

The patterns were extracted from the AI Tool Tips embedded throughout the Global Power
Efficiency Rankings page (tibsfox.com/Global-Power-Efficiency-Rankings.html). The original
tips are domain-specific to energy efficiency, but the underlying prompt structures work
for any domain where AI can meaningfully accelerate learning.

Every prompt in this template is copy-paste ready. A learner should be able to substitute
their details in the [bracket] markers, paste the result into an AI assistant, and
receive immediately useful output. If a prompt requires significant editing beyond the
marked customization points, it fails the quality check.


## When to Use

Use these prompt patterns in any of these contexts:

**Within educational packs** -- each topic section includes an AI Tool Tip that uses one
of these patterns. The tip is embedded in the topic, not separated into an appendix, so
the learner encounters it at the point of maximum relevance.

**Within career pathways** -- each career transition pathway includes an AI Learning
Prompt that helps the learner create a personalized study plan. Pattern 1 (Structured
Learning Roadmap) is the default choice for career pathways.

**Standalone learning resources** -- these patterns can anchor a page or section dedicated
to AI-assisted learning techniques, independent of a specific educational pack.

Choose the pattern based on the learner's situation:

| Situation | Best Pattern | Why |
|-----------|-------------|-----|
| Career transition with clear target role | Pattern 1: Structured Roadmap | Produces a concrete plan with timeline |
| Exploring a new domain from adjacent expertise | Pattern 2: Socratic Tutor | Draws out existing knowledge and builds on it |
| Need to demonstrate competence with a portfolio | Pattern 3: Project Design | Generates a specific, buildable project |
| General AI Tool Tip within a topic section | Any pattern | Match to the topic's learning goal |


## How to Use

Each pattern below has three parts: the pattern description (explaining what it does and
when it works best), the prompt template (the actual text to copy and customize), and
usage notes (tips for getting better results).

To use a pattern, copy the prompt template and replace every [bracket] marker with the
learner's specific information. The markers are intentionally descriptive -- [your current
role] tells you exactly what to substitute.

When embedding a prompt in educational content, introduce it with a brief context sentence
explaining what the learner will get from using it. Do not drop a prompt into a page
without explanation.


## Pattern 1: Structured Learning Roadmap

The Structured Learning Roadmap prompt asks AI to act as a career mentor and produce a
time-boxed plan with specific milestones. It works best when the learner has a defined
target role and wants a week-by-week or month-by-month breakdown of what to study, practice,
and build.

This pattern is the default for career pathway AI prompts because it produces the most
actionable output for someone committed to a specific transition.

### Prompt Template

```text
Act as a career mentor who has helped [professionals in your current field] transition
into [target role]. I am a [current role] with [X years] of experience in [list 2-3
specific skills or domains you work in]. Create a [N-month] learning roadmap to become
job-ready as a [target role].

The plan should:
(1) Build on my existing skills in [list skills that transfer to the new role],
(2) Address gaps in [list 2-4 specific skills or knowledge areas you need],
(3) Include [N] portfolio projects using [relevant tools, datasets, or technologies].

Format as a [weekly | monthly] breakdown with specific tasks, resources (prioritize
free options), and deliverables for each period.
```

### Usage Notes

The quality of the output depends heavily on the specificity of the input. "I have
experience in management" produces generic advice. "I have 6 years managing a 15-person
retail team with responsibility for inventory forecasting and vendor negotiations" produces
advice that builds on actual transferable skills.

The `[N-month]` parameter should be realistic. For most career transitions, 6-18 months
is appropriate. Asking for a 2-month roadmap to a role that genuinely requires a year of
preparation produces an unrealistic plan.

Specifying "prioritize free options" in the resources clause helps learners who cannot
invest in paid courses upfront. Remove this clause if the learner has a training budget.

### Example (Filled In)

```text
Act as a career mentor who has helped mechanical engineers transition into renewable
energy project management. I am a mechanical engineer with 8 years of experience in
HVAC system design and building energy modeling. Create a 12-month learning roadmap
to become job-ready as a renewable energy project manager.

The plan should:
(1) Build on my existing skills in thermal systems, energy calculations, and
    vendor coordination,
(2) Address gaps in solar PV system design, project finance, and PMP certification,
(3) Include 3 portfolio projects using real energy production datasets.

Format as a monthly breakdown with specific tasks, resources (prioritize free options),
and deliverables for each month.
```


## Pattern 2: Socratic Tutor

The Socratic Tutor prompt asks AI to teach through questions rather than answers. Instead
of explaining a concept directly, the AI guides the learner to discover it by asking
progressively deeper questions that connect new material to what the learner already knows.

This pattern works best when the learner has adjacent domain knowledge. A mechanical
engineer learning about electrical grid design already understands energy transfer,
efficiency, and systems thinking -- the Socratic approach helps them connect those
concepts to the new domain rather than starting from scratch.

### Prompt Template

```text
You are a Socratic tutor helping me understand [domain or topic area]. Do not give
direct answers -- guide me through questions that help me discover concepts myself.

Start by asking what I already know about [specific topic] from my background in
[your field or domain]. Then ask probing questions about:
(1) [Foundational concept the learner needs to grasp],
(2) [Connection between their prior knowledge and the new domain],
(3) [Practical application they could reason through].

Ask one question at a time. Wait for my response before continuing. Build on my
answers to go deeper, and correct misconceptions gently by asking questions that
expose the gap rather than stating the correction directly.
```

### Usage Notes

The Socratic pattern requires an interactive session -- it does not produce a static
document. This makes it ideal for individual learning but less suitable for
pre-generated content in an educational pack. When embedding this pattern in
educational content, frame it as a learning activity: "Open a conversation with your
AI assistant and try this prompt."

The three numbered topics should progress from foundational to applied. If (1) is too
advanced, the learner will not have enough footing to engage with the questions.

The instruction "ask one question at a time" is critical. Without it, AI assistants
tend to produce long lists of questions that defeat the Socratic purpose.

### Example (Filled In)

```text
You are a Socratic tutor helping me understand residential solar energy systems.
Do not give direct answers -- guide me through questions that help me discover
concepts myself.

Start by asking what I already know about energy production from my background in
electrical engineering. Then ask probing questions about:
(1) How photovoltaic cells convert sunlight to electricity (I understand
    semiconductor physics, so connect to that),
(2) How residential solar system sizing relates to load calculations (I do
    commercial load calcs regularly),
(3) How net metering and grid interconnection work from both technical and
    regulatory perspectives.

Ask one question at a time. Wait for my response before continuing. Build on my
answers to go deeper, and correct misconceptions gently by asking questions that
expose the gap rather than stating the correction directly.
```


## Pattern 3: Hands-On Project Design

The Hands-On Project Design prompt asks AI to generate a specific, buildable project
that develops target skills while producing a portfolio piece. It is the most concrete
of the three patterns -- the output is a project plan with milestones, tools, and
deliverables.

This pattern works best when the learner needs to demonstrate competence to an employer
or client. The resulting project should be something they can show in an interview, link
on a resume, or use as a work sample.

### Prompt Template

```text
Design a hands-on project that helps someone with a background in [your field or
experience] develop [list 2-3 target skills]. The project should:

(1) Use [free | accessible | specific] tools: [list preferred tools, or say
    "suggest appropriate free tools"],
(2) Take approximately [N weeks] at [hours per week],
(3) Result in a portfolio piece demonstrating [specific capabilities the project
    should showcase].

Include clear milestones broken into phases:
- Phase 1: [Setup and data gathering]
- Phase 2: [Core implementation]
- Phase 3: [Analysis and presentation]

Provide step-by-step instructions suitable for someone with [experience level]
technical skills but no prior experience in [target domain]. Include specific
datasets, APIs, or resources to use (not just "find a dataset").
```

### Usage Notes

The key differentiator of this pattern is the instruction to provide specific resources.
Without it, AI assistants tend to suggest "find a publicly available dataset" without
naming one. The prompt explicitly asks for named datasets, APIs, or resources to
eliminate the research barrier.

The milestone structure (setup, implementation, analysis) maps to natural project
phases. Adjust the phase names to match the domain -- for hardware projects, they might
be "design, build, test." For research projects, "literature review, methodology, findings."

Specify the experience level carefully. "Someone with intermediate Python skills" and
"someone who has never written code" produce very different project designs.

### Example (Filled In)

```text
Design a hands-on project that helps someone with a background in accounting
develop data visualization and financial modeling skills. The project should:

(1) Use free tools: Python (pandas, matplotlib), Jupyter notebooks, and a
    public financial dataset,
(2) Take approximately 4 weeks at 8 hours per week,
(3) Result in a portfolio piece demonstrating the ability to clean financial
    data, build interactive visualizations, and present insights to
    non-technical stakeholders.

Include clear milestones broken into phases:
- Phase 1: Environment setup and data acquisition (SEC EDGAR public filings)
- Phase 2: Data cleaning, analysis, and visualization development
- Phase 3: Executive summary report with interactive charts

Provide step-by-step instructions suitable for someone with basic Excel skills
but no prior Python experience. Include specific datasets from SEC EDGAR or
Yahoo Finance API to use.
```


## Embedding Prompts in Educational Content

When using these patterns within an educational pack's AI Tool Tip section, follow this
format to provide context around the prompt:

```markdown
#### AI Tool Tip: [Descriptive Title Related to Topic]

**Use case:** [One sentence -- what learning problem this solves]

**How to do it:** [1-2 sentences -- which pattern to use and why]

> "[The complete prompt, customized for this topic, with [bracket]
> markers for the learner's personal details.]"

**Real-world example:** [One sentence citing a study or case that
validates AI-assisted learning in this area, with impact metric.]
```

The prompt itself goes in a blockquote so it is visually distinct from surrounding text.
The use case and real-world example frame the prompt so the learner understands both why
to use it and that the approach has evidence behind it.


## Quality Checks

Every AI learning prompt must pass these checks.

- [ ] Prompt is complete enough to paste directly into an AI assistant and get useful output
- [ ] All customization points use [bracket] markers with descriptive text
- [ ] No domain-specific jargon appears outside of [bracket] markers (template is reusable)
- [ ] Prompt specifies the AI's role or persona explicitly
- [ ] Prompt includes output format instructions (roadmap, questions, project plan)
- [ ] Example (filled in) demonstrates a realistic use case
- [ ] Socratic pattern includes "ask one question at a time" instruction
- [ ] Project design pattern requests specific named resources, not generic suggestions
- [ ] Roadmap pattern includes timeline and deliverable expectations
- [ ] When embedded in educational content, the prompt has surrounding context (use case, real-world example)


## Source Exemplar

These prompt patterns were extracted from the AI Tool Tips in the Global Power Efficiency
Rankings page (tibsfox.com/Global-Power-Efficiency-Rankings.html). The original page
embeds AI Tool Tips within each topic section, using variations of these three patterns
to help learners apply energy efficiency concepts through AI-assisted practice. The
patterns have been generalized to work for any domain.
