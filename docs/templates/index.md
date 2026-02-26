---
title: "Template Library"
layer: templates
path: "templates/index.md"
summary: "Library of reusable templates extracted from exemplar artifacts, with guidance on the template-to-skill promotion pipeline."
cross_references:
  - path: "templates/educational-pack.md"
    relationship: "gateway-to"
    description: "Educational pack template for domain-specific learning resources"
  - path: "templates/career-pathway.md"
    relationship: "gateway-to"
    description: "Career pathway template for career transition documentation"
  - path: "templates/ai-learning-prompt.md"
    relationship: "gateway-to"
    description: "AI learning prompt template with three prompt patterns"
  - path: "templates/mission-retrospective.md"
    relationship: "gateway-to"
    description: "Mission retrospective template using NASA LLIS format"
  - path: "meta/style-guide.md"
    relationship: "builds-on"
    description: "All templates follow the documentation style guide"
reading_levels:
  glance: "Library of reusable templates extracted from exemplar artifacts for consistent content creation."
  scan:
    - "Four templates: educational pack, career pathway, AI learning prompt, mission retrospective"
    - "Templates are extracted patterns from the best artifacts in the ecosystem"
    - "Template-to-skill promotion pipeline turns templates into executable GSD skills"
    - "All templates include when-to-use criteria, how-to-use guidance, and quality checks"
    - "Customization markers in [brackets] for domain-specific adaptation"
created_by_phase: "v1.34-330"
last_verified: "2026-02-25"
---

# Template Library

Templates are reusable structures extracted from the best artifacts in the tibsfox.com
documentation ecosystem. Where the [style guide](meta/style-guide.md) governs how to write,
templates govern what to write -- they provide the structural skeleton for specific types of
content so that each new instance starts from a proven pattern rather than a blank page.

Every template in this library was extracted from an exemplar artifact: a real document that
demonstrated the pattern effectively. Templates are not theoretical designs. They are
codified versions of structures that already worked.


## What Templates Are

A template is a documented content structure with three parts:

**Structure** defines the sections, their order, and what each section must contain. It
answers "what goes where" for someone creating a new instance of the content type.

**Guidance** explains when to use the template, how to fill it in, and common pitfalls.
It answers "how do I use this well" for someone who has the structure but needs judgment
about applying it.

**Quality checks** provide a verification checklist that every instance must pass before
publication. They answer "did I do this right" for someone who has filled in the template
and needs to validate their work.

Templates use customization markers in [brackets] to indicate where domain-specific content
replaces the placeholder. A marker like [your current role] tells the author exactly what
to substitute. Markers must be descriptive enough that someone unfamiliar with the exemplar
can fill them in correctly.


## Template Catalog

The library currently contains four templates, extracted from two exemplar artifacts.

### From the Power Efficiency Rankings Exemplar

The Global Power Efficiency Rankings page (tibsfox.com/Global-Power-Efficiency-Rankings.html)
is the most comprehensive educational artifact in the ecosystem. Three templates were
extracted from its structure.

**[Educational Pack Template](templates/educational-pack.md)** -- the master structure for
educational content packs. Covers domain overviews with data-driven insights, topic sections
with evidence-based content and AI tool tips, career transition pathways, DIY projects, and
cross-cutting themes. Use this template when creating any comprehensive educational resource.

**[Career Pathway Template](templates/career-pathway.md)** -- the structure for a single
career transition pathway. Maps the journey from a current role to a target role with
skills, salary, resources, timeline, an AI learning prompt, and portfolio projects at
three levels (beginner, intermediate, proficient). Use this template within educational
packs or standalone for career guidance content.

**[AI Learning Prompt Template](templates/ai-learning-prompt.md)** -- three copy-paste-ready
prompt patterns for AI-assisted learning. Includes the Structured Learning Roadmap (career
mentor persona), the Socratic Tutor (question-based discovery), and the Hands-On Project
Design (portfolio project generator). Use these patterns within AI Tool Tips in educational
content or as standalone learning resources.

### From the v1.33 Mission Retrospective Exemplar

The v1.33 OpenStack Cloud Platform lessons-learned document applied the NASA Lessons Learned
Information System (LLIS) format to a GSD mission.

**[Mission Retrospective Template](templates/mission-retrospective.md)** -- the structure for
post-mission analysis. Uses the LLIS entry format with 8 structured fields per lesson,
organized into four categories (what worked well, what could improve, risks realized,
process observations). Includes a priority matrix for recommendations, a mission phase
assessment with a 5-point scale, and NASA SE phase mapping. Use this template after any
GSD mission with 5 or more phases.


## How Templates Relate to Skills

Templates and skills serve different purposes in the GSD ecosystem, but they are connected
through a promotion pipeline.

**Templates** are passive structures. They tell a human or agent what to produce but do not
execute anything. A template is a recipe. It requires a cook.

**Skills** are active instructions. They tell Claude Code how to perform a specific task,
including when to activate, what context to load, and what output to produce. A skill is a
sous chef who knows the recipe and can execute it.

The connection between them is the **template-to-skill promotion pipeline**:

1. A template is created by extracting a pattern from an exemplar artifact (this library).
2. The template is used manually by humans or agents to create new content instances.
3. skill-creator observes repeated use of the template (3+ instances).
4. skill-creator proposes a skill that automates the template application.
5. A human reviews and approves the skill (bounded learning guardrail).
6. The skill becomes an active tool that agents can invoke during GSD phases.

Not every template should become a skill. Templates that require significant human judgment
in their application (like the mission retrospective) may remain templates permanently.
Templates with more mechanical application (like consistent frontmatter generation) are
strong candidates for skill promotion.

The decision to promote a template to a skill belongs to the human operator. skill-creator
can suggest promotion based on usage patterns, but it never auto-promotes. This is a core
safety principle of the bounded learning system.


## Creating New Templates

New templates follow the same extraction process that produced this library.

Identify an exemplar artifact -- a document or content piece that demonstrates an effective
structure. Extract the structural pattern by generalizing domain-specific content into
customization markers. Write the three required parts (structure, guidance, quality checks).
Add the template to this catalog with a reference to its source exemplar.

All templates must follow the [Documentation Style Guide](meta/style-guide.md) and include
the standard frontmatter with `layer: templates` and a `created_by_phase` field that
traces back to the GSD phase that produced them.

Quality criteria for new templates:

- The source exemplar must be a real artifact, not a theoretical design
- The template must be domain-agnostic (usable beyond the exemplar's subject matter)
- Customization markers must be descriptive enough for someone unfamiliar with the exemplar
- Quality checks must be verifiable (not subjective assessments like "is it good enough")
- The template must cite its source exemplar
