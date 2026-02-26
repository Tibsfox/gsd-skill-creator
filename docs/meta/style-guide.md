---
title: "Documentation Style Guide"
layer: meta
path: "meta/style-guide.md"
summary: "Writing standards for all docs/ content — voice, tone, structure, formatting, and frontmatter schema."
cross_references:
  - path: "meta/index.md"
    relationship: "builds-on"
    description: "Part of meta-documentation"
  - path: "principles/progressive-disclosure.md"
    relationship: "parallel"
    description: "Progressive disclosure principle this guide implements"
  - path: "meta/filesystem-contracts.md"
    relationship: "parallel"
    description: "File ownership that complements this guide"
reading_levels:
  glance: "Writing standards governing voice, tone, structure, and formatting for all documentation."
  scan:
    - "Voice: warm, direct, technically precise"
    - "Structure: progressive disclosure at glance/scan/read levels"
    - "Frontmatter: required YAML schema for every document"
    - "Cross-references: relative paths, explicit relationships"
    - "Code blocks: always specify language"
created_by_phase: "v1.34-326"
last_verified: "2026-02-25"
---

# Documentation Style Guide

This guide defines writing standards for every document in docs/. It governs voice, tone,
structure, formatting, cross-references, and frontmatter. All contributors and automated agents
producing documentation must follow these conventions.

The guide itself follows the conventions it describes. If you find a contradiction between this
guide and its own content, the content of the guide wins and the contradiction should be filed
as a bug.


## Voice and Tone

Write like you are explaining something you find genuinely interesting to someone you respect.
That single sentence captures the voice. Here is what it means in practice.

**Voice** is warm, direct, and technically precise. Warmth means the reader feels welcomed, not
lectured. Directness means sentences say what they mean without hedging. Technical precision means
terms are used correctly and consistently, never approximated for the sake of simplicity.

**Tone** is confident but not arrogant. Confidence means stating facts and recommendations without
excessive qualification. Not-arrogant means acknowledging complexity, alternative approaches, and
the limits of current knowledge. When something is uncertain, say so plainly rather than hiding
behind vague language.

### Voice Examples

Good:

> The token budget manager prevents skills from consuming more than 5% of the context window.
> This hard limit exists because exceeding it degrades model performance in ways that are
> difficult to diagnose after the fact.

The sentence states the fact, then explains why it matters. No hedging, no apology, no fluff.

Bad:

> It should be noted that the token budget manager is designed to help prevent skills from
> potentially consuming too much of the context window, which could possibly lead to issues.

Every word in that sentence works against clarity. "It should be noted" is throat-clearing.
"Designed to help prevent" is four words doing the work of one. "Potentially" and "possibly"
and "could" stack uncertainty until the sentence says nothing.

### Tone Examples

Good:

> This approach works well for projects under 50 skills. Larger projects may need the tiered
> loading strategy described in the architecture guide.

Acknowledges a boundary condition without apologizing for it.

Bad:

> Obviously, anyone serious about skill management would use the tiered loading strategy.

Dismissive of the reader. The word "obviously" is almost always wrong in documentation.

Also bad:

> We're really sorry, but this approach might not work perfectly for larger projects. We hope
> the tiered loading strategy helps!

Overly apologetic. Documentation should inform, not perform emotions.


## Document Structure

Every document follows progressive disclosure. This means the document is useful at three
different reading speeds, and a reader can stop at any point having gotten value proportional
to the time they spent.

### The Three Reading Levels

**Glance** (3 seconds): The title and first paragraph communicate the document's purpose and who
it is for. A reader who stops here knows whether they need this document. The frontmatter
`reading_levels.glance` field captures this in one line.

**Scan** (30 seconds): The headers, opening sentences of each section, and any summary lists
provide a structural overview. A reader who scans the headers gets the shape of the content.
The frontmatter `reading_levels.scan` field captures key points as a bullet list.

**Read** (3-30 minutes): The full content delivers depth. A reader who reads everything gets
complete understanding. This is where nuance, examples, edge cases, and cross-references live.

### Structural Rules

The title is an `h1` (`#`) and appears exactly once, as the first heading after the frontmatter.
It matches the frontmatter `title` field.

Top-level sections use `h2` (`##`). Subsections use `h3` (`###`). Use `h4` (`####`) sparingly
and only when a subsection genuinely needs subdivision. Never skip heading levels. A document
should never jump from `##` to `####`.

The first paragraph after `h1` orients the reader. It answers: what is this document about, and
why does it exist? This paragraph is the "glance" level — it must stand alone as a summary.

Every `h2` section opens with a sentence or short paragraph that tells the reader what the
section covers. Do not start a section with a code block, list, or table. Orient the reader
first.


## Frontmatter Schema

Every document in docs/ begins with YAML frontmatter. The schema has required and optional fields.

### Required Fields

```yaml
---
title: "Human-Readable Document Title"
layer: foundations | principles | framework | applications | community | meta | templates
path: "relative/path/from/docs/root.md"
summary: "One sentence — the 'glance' reading level"
created_by_phase: "v1.34-NNN"
last_verified: "YYYY-MM-DD"
---
```

**title** is the human-readable document title. It appears in search results, navigation, and
cross-reference displays. Use sentence case. Match the `h1` heading in the document body.

**layer** identifies which educational layer the document belongs to. The valid values are
`foundations`, `principles`, `framework`, `applications`, `community`, `meta`, and `templates`.
Every document belongs to exactly one layer.

**path** is the relative path from the docs/ root to this file. It enables automated
cross-reference validation. The path must match the file's actual location.

**summary** is a single sentence that captures the document's purpose at the glance reading
level. It should be substantive, not generic. "Getting started guide" is bad. "Quick path from
installation to creating your first skill" is good.

**created_by_phase** records which GSD phase created the document. Format is `v{milestone}-{phase}`,
for example `v1.34-326`. This enables traceability from requirement to implementation.

**last_verified** is the date when the document was last confirmed to be accurate and current.
Format is ISO 8601 date: `YYYY-MM-DD`. Update this field whenever the document is reviewed,
even if no changes were needed.

### Optional Fields

```yaml
cross_references:
  - path: "other/doc.md"
    relationship: "builds-on | parallel | gateway-to | extracted-from"
    description: "Brief explanation of relationship"
reading_levels:
  glance: "One-line summary for title + first paragraph"
  scan:
    - "Key point 1"
    - "Key point 2"
    - "Key point 3"
```

**cross_references** is a list of related documents. Each entry has three fields.

The `path` field is the relative path from docs/ root to the referenced document. The
`relationship` field describes how the documents relate. Use `builds-on` when this document
extends or depends on the referenced one. Use `parallel` when both documents address the same
topic from different angles. Use `gateway-to` when this document serves as an entry point to
the referenced one. Use `extracted-from` when this document was derived from the referenced
source material. The `description` field briefly explains the relationship in human-readable
terms.

**reading_levels** provides structured metadata for the three progressive disclosure levels.
The `glance` field is a single string. The `scan` field is a list of 3-5 key points that a
header-skimming reader would want to know. These fields support automated navigation generation
and content pipeline transformations.


## Formatting Conventions

### Line Length

Lines should not exceed 120 characters, except for URLs and code blocks where breaking the line
would reduce readability. Paragraphs are wrapped at natural sentence boundaries within this limit.

### Prose vs. Lists

Prefer prose over bullet lists. Lists are appropriate when items are truly parallel and
independent — when each item has the same grammatical structure and no item depends on reading
the others. If items need explanation, context, or sequence, use prose paragraphs with bold
lead-in phrases instead.

Good use of a list:

> The frontmatter requires these fields:
>
> - `title` — human-readable document title
> - `layer` — educational layer assignment
> - `path` — relative path from docs/ root
> - `summary` — one-sentence glance-level description

Bad use of a list:

> To create a new document:
>
> - First you need to decide which layer it belongs to
> - Then you should create the file in the correct directory
> - After that, add the frontmatter with all required fields
> - Finally, write the content following this style guide

That second list is a procedure. Write it as prose, or if the steps are truly mechanical, use a
numbered list with context.

### Code Blocks

Always specify the language identifier. Use `yaml`, `typescript`, `bash`, `markdown`, `json`,
`rust`, `glsl`, or other appropriate identifiers. Never use bare triple backticks without a
language.

Good:

````markdown
```yaml
title: "Example Document"
layer: framework
```
````

Bad:

````markdown
```
title: "Example Document"
layer: framework
```
````

The language identifier enables syntax highlighting, improves accessibility, and tells readers
what they are looking at before they read the content.

### Emphasis

Use **bold** for key terms when they are first introduced or when drawing attention to an
important phrase. Use *italics* for titles of published works, for emphasis within a sentence
when bold would be too strong, and for placeholder text in templates.

Do not use bold or italics for entire paragraphs. If everything is emphasized, nothing is.

### Tables

Use tables for data that is genuinely tabular — where rows and columns have consistent meaning.
Do not use tables to lay out content that would be better served by prose or definition lists.

Align table columns for readability in the source markdown. Every table needs a header row.


## Cross-References

Internal cross-references use relative paths from the docs/ root directory. The format is
standard markdown links: `[Display Text](relative/path.md)`.

### Rules

Always use relative paths. Never use absolute URLs for internal documentation. A document at
`docs/framework/getting-started.md` that references the style guide uses:
`[style guide](meta/style-guide.md)`. Paths are relative to docs/, not relative to the
referring document.

Display text should be meaningful. Use the document's title or a descriptive phrase, not the
filename or "click here" or "this document."

Good: `[Documentation Style Guide](meta/style-guide.md)`

Bad: `[click here](meta/style-guide.md)` or `[style-guide.md](meta/style-guide.md)`

When referencing a specific section within a document, use anchor links:
`[Frontmatter Schema](meta/style-guide.md#frontmatter-schema)`.

### Cross-Reference Relationships in Frontmatter

The frontmatter `cross_references` field captures machine-readable relationships between
documents. The four relationship types serve different purposes.

**builds-on** means this document depends on or extends the referenced document. A reader who
has not read the referenced document may miss context. Example: `complex-plane.md` builds on
`mathematical-foundations.md`.

**parallel** means both documents address overlapping concerns from different angles. Neither
depends on the other, but reading both gives a more complete picture. Example:
`style-guide.md` is parallel to `progressive-disclosure.md`.

**gateway-to** means this document serves as an entry point or navigation hub that directs
readers to the referenced document. Example: `foundations/index.md` is a gateway to
`mathematical-foundations.md`.

**extracted-from** means this document was derived from the referenced source material. The
relationship is informational — it records provenance. Example: `educational-pack.md` was
extracted from Power Efficiency Rankings content.


## Content Conventions

### Technical Terms

Use technical terms correctly and consistently. The first time a term appears in a document,
provide a brief definition or enough context for the reader to understand it. Do not define
the same term in every document — cross-reference the canonical definition.

Key terms for this project (use these spellings consistently):

- **GSD** (always uppercase, no periods) — the Get Shit Done workflow system
- **skill-creator** (lowercase, hyphenated) — the adaptive learning layer
- **Claude Code** (both words capitalized) — the Anthropic CLI tool
- **frontmatter** (one word, no hyphen) — the YAML metadata block
- **cross-reference** (hyphenated as noun and adjective) — links between documents
- **docs/** (with trailing slash) — the documentation root directory
- **www/** (with trailing slash) — the website presentation layer

### Numbers and Units

Spell out numbers under ten in prose. Use digits for 10 and above, for all measurements, and
in technical contexts. Use consistent units: "5 minutes" not "five min." Include units with
all measurements: "120 characters" not "120."

### Dates

Use ISO 8601 format in frontmatter: `2026-02-25`. In prose, use the unambiguous format:
"25 February 2026" or "February 2026" when the day is not relevant.

### File Paths

Render file paths in code font: `docs/meta/style-guide.md`. Use forward slashes regardless
of platform. Include the trailing slash for directories: `docs/framework/`.

### Placeholders

When a document is a placeholder for future content, use this standard format:

```markdown
# [Title]

*Content will be added in Phase NNN — [Phase Name].*
```

Do not add lorem ipsum, filler paragraphs, or "TODO" markers. The italic sentence communicates
that the document exists intentionally as scaffolding and identifies when the content will arrive.


## Writing Process

When creating a new document, follow this sequence.

Determine the correct directory by consulting the filesystem contracts. Create the file with
complete frontmatter — do not leave frontmatter fields empty or use placeholder values for
required fields. The `summary` field must be substantive even for placeholder documents.

Write the first paragraph to satisfy the glance reading level. Write section headers to
satisfy the scan reading level. Then fill in content to satisfy the read level. This order
ensures the document is useful at every stage of completion.

After writing, verify that the document follows its own layer's conventions, that all
cross-references point to existing files, and that the frontmatter `path` field matches the
actual file location.

### Self-Compliance Check

This style guide follows its own rules. It uses `##` for top sections and `###` for subsections
without skipping levels. It specifies languages on all code blocks. It prefers prose over lists
except where items are genuinely parallel. It uses bold for first introduction of key terms. Its
frontmatter contains all required fields with substantive values.

If you notice this guide violating its own conventions, that is a bug. File it or fix it.
