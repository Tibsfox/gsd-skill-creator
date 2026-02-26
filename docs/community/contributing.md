---
title: "Contributing Guide"
layer: community
path: "community/contributing.md"
summary: "How to contribute to the tibsfox.com documentation ecosystem — content types, submission process, quality standards, and review criteria."
cross_references:
  - path: "community/index.md"
    relationship: "builds-on"
    description: "Part of community layer"
  - path: "meta/style-guide.md"
    relationship: "parallel"
    description: "Writing standards all contributions must follow"
  - path: "meta/improvement-cycle.md"
    relationship: "parallel"
    description: "How contributions feed the improvement cycle (Loop 4)"
  - path: "templates/index.md"
    relationship: "parallel"
    description: "Template library for structured content contributions"
  - path: "community/skill-exchange.md"
    relationship: "parallel"
    description: "Skill sharing that complements documentation contributions"
reading_levels:
  glance: "How to contribute content corrections, gateway documents, templates, educational packs, career pathways, and AI prompt patterns."
  scan:
    - "Seven contribution types from simple corrections to educational pack content"
    - "Fork, create, verify, submit — the standard contribution workflow"
    - "Quality bar: style guide compliance, three-speed reading, source verification"
    - "Two-stage review: automated checks then human content review"
    - "Shareware-style model: contribute concrete artifacts, not requests"
created_by_phase: "v1.34-332"
last_verified: "2026-02-25"
---

# Contributing Guide

This guide describes how to contribute to the tibsfox.com documentation ecosystem. Every
contribution -- from a single-word correction to a complete educational pack -- follows the
same process and meets the same quality standards. The process is designed to be lightweight
for small fixes and structured enough for substantial additions.

The ecosystem improves through concrete contributions, not feature requests. If you see
something that could be better, the most valuable thing you can do is make it better and
submit the result.


## What to Contribute

The ecosystem accepts seven types of contributions. Each type has a different scope, but all
follow the same submission process.

**Content corrections** fix typos, factual errors, outdated information, broken
cross-references, or misleading explanations in existing documents. These are the simplest
contributions and the fastest to review. If you spot an error, fix it. Do not open an issue
asking someone else to fix it.

**New gateway documents** create entry points for resources not yet covered in the ecosystem.
A gateway document introduces a topic, explains why it matters, connects it to the narrative
spine, and provides cross-references to both internal documentation and external resources.
Consult the existing gateway documents in `docs/foundations/` and `docs/principles/` for the
expected structure.

**Template improvements** refine existing templates in the [template library](templates/index.md)
based on experience using them. If you used a template and found that a section was
unnecessary, a section was missing, or the guidance was unclear, propose a revision. Template
revisions must include the rationale for the change and evidence from at least one concrete
use case.

**Educational pack content** creates domain-specific learning resources using the
[educational pack template](templates/educational-pack.md). Educational packs are substantial
contributions -- they include domain overviews with data-driven insights, topic sections with
evidence-based content and AI tool tips, career transition pathways, DIY projects, and
cross-cutting themes. If you have domain expertise and want to create a complete educational
resource, the template provides the structural skeleton.

**Career pathway additions** document specific career transitions for domains not yet covered.
Each pathway uses the [career pathway template](templates/career-pathway.md) and maps the
journey from a current role to a target role with skills, salary ranges, resources, timelines,
and portfolio projects at three levels. Career pathways require realistic data -- salary
ranges from professional organizations, not guesswork.

**AI learning prompt patterns** create copy-paste-ready prompts for AI-assisted learning in
new use cases. Each prompt pattern uses the [AI learning prompt template](templates/ai-learning-prompt.md)
and must be tested with at least one AI model to verify it produces useful, accurate output.
Untested prompts are not accepted.

**Translations** will be accepted in a future phase when the localization infrastructure is
in place. If you want to translate existing content, note your interest in a pull request
description so the team can coordinate when the infrastructure is ready.


## How to Contribute

The contribution workflow has four steps. Every contribution, regardless of type, follows
this process.

### Step 1: Fork and Branch

Fork the repository and create a branch for your contribution. Use a descriptive branch name
that communicates what the contribution does: `fix/style-guide-typo`,
`add/gateway-renewable-energy`, `improve/career-pathway-template`.

### Step 2: Create or Modify Content

All documentation lives in the `docs/` directory. Create new files in the correct
subdirectory according to the content's layer:

| Layer | Directory | Content Types |
|-------|-----------|---------------|
| Foundations | `docs/foundations/` | Mathematical and theoretical gateway documents |
| Principles | `docs/principles/` | Design and methodology gateway documents |
| Framework | `docs/framework/` | Tool and workflow documentation |
| Applications | `docs/applications/` | Domain-specific educational content |
| Community | `docs/community/` | Community guides and contribution resources |
| Templates | `docs/templates/` | Reusable content templates |
| Meta | `docs/meta/` | Documentation about the documentation |

Every file must include complete YAML frontmatter. The required fields are `title`, `layer`,
`path`, `summary`, `created_by_phase`, and `last_verified`. See the
[style guide frontmatter section](meta/style-guide.md#frontmatter-schema) for the full
schema. For community contributions, use `community` as the `created_by_phase` value.

Write the content following the [Documentation Style Guide](meta/style-guide.md). The most
important conventions to follow are: progressive disclosure (glance/scan/read levels), no
heading level jumps, language identifiers on all code blocks, and relative paths for
cross-references.

### Step 3: Verify Your Work

Before submitting, verify these items yourself:

- Frontmatter is complete and all required fields have substantive values (not placeholders)
- The `path` field matches the file's actual location relative to `docs/`
- All cross-references point to files that exist
- Code blocks have language identifiers
- The document makes sense at all three reading levels -- title and first paragraph for
  glance, headers and opening sentences for scan, full content for read
- If you added a new file, at least one existing file references it (no orphaned documents)

### Step 4: Submit a Pull Request

Submit a pull request against the repository with a description that explains what you
changed and why. For new content, include the motivation: why does the ecosystem need this
document? For corrections, include what was wrong and what the fix is. For template
revisions, include the use case that revealed the need for the change.


## Quality Standards

Every contribution must meet these standards. They are not aspirational guidelines -- they
are hard requirements. Pull requests that do not meet them will be returned for revision.

### Style Guide Compliance

All content follows the [Documentation Style Guide](meta/style-guide.md). This means:
warm, direct, technically precise voice. No hedging, no throat-clearing, no apologetic tone.
Sentence case for titles. ISO 8601 dates in frontmatter. Relative paths for cross-references.
Bold for first introduction of key terms. Prose over lists except when items are genuinely
parallel.

### Three-Speed Reading Test

Every document must work at three reading speeds. A reader who spends three seconds on the
title and first paragraph knows what the document is about and whether they need it. A reader
who spends 30 seconds scanning headers gets the structural shape. A reader who reads
everything gets complete understanding. If any level fails, the document is not ready.

### Cross-Reference Integrity

Every internal link must resolve to an existing file. Every new document must be referenced
by at least one existing document. Orphaned documents -- files that no other document links
to -- indicate integration failure. Cross-references use relative paths from the `docs/`
root, not from the referring document.

### Source Standards

**Professional sources.** Career salary data comes from professional organizations, industry
reports, or government labor statistics. Not from entertainment media, anonymous forums, or
single company postings. Every factual claim should be verifiable.

**Realistic career data.** Salary ranges, timelines, and skill requirements reflect actual
industry conditions. Optimistic projections must be identified as optimistic. Conservative
estimates are preferred over aspirational ones.

**Tested AI prompts.** Every AI learning prompt pattern must be tested with at least one AI
model before submission. The pull request description must include the model used and a brief
assessment of output quality. Prompts that produce inaccurate, harmful, or useless output
are not accepted.


## Review Process

Every pull request goes through two review stages. Both must pass before merge.

### Stage 1: Automated Checks

Automated checks run when the pull request is submitted. They verify structural correctness
without human intervention.

**Style linting** checks for common style guide violations: missing frontmatter fields,
heading level jumps, code blocks without language identifiers, absolute URLs where relative
paths should be used, and line length violations.

**Cross-reference validation** verifies that all internal links point to files that exist in
the repository. A single broken link fails the check.

**Frontmatter schema check** validates that all required frontmatter fields are present, that
the `layer` value is one of the seven valid options, that the `path` field matches the file's
actual location, and that dates are in ISO 8601 format.

If any automated check fails, the pull request cannot proceed to human review. Fix the
identified issues and push updated commits.

### Stage 2: Human Review

A human reviewer evaluates what automated checks cannot.

**Content accuracy.** Is the information correct? For technical content, does it accurately
represent the tools, processes, or concepts described? For career content, are the salary
ranges, timelines, and skill requirements realistic?

**Educational value.** Does the contribution make it easier for someone to learn something
or do something? Content that is technically correct but pedagogically useless does not meet
the bar.

**Ecosystem alignment.** Does the contribution fit the narrative spine? Does it connect to
existing content through cross-references? Does it follow the ecosystem's progressive
disclosure principle? A standalone document that ignores the rest of the ecosystem is less
valuable than one that strengthens the network.

### Merge Criteria

A pull request is merged when it passes all automated checks and receives one human approval.
There is no committee, no voting, no waiting period for simple corrections. Substantial
additions (new educational packs, new templates) may receive more detailed review, but the
merge criteria remain the same: automated checks pass, one human approves.


## For Template Contributors

Template contributions have additional requirements beyond standard content.

**Source exemplar required.** Every new template must cite the real artifact it was extracted
from. Templates are not theoretical designs -- they are codified versions of structures that
already worked. If you cannot point to a concrete exemplar, the pattern is not ready to be a
template.

**Extraction rationale.** The pull request must explain why this pattern is worth templating.
What makes it reusable across domains? What would someone in a different field gain by using
this structure?

**Three-part structure.** Every template must include the three required parts: structure
(what goes where), guidance (how to use it well), and quality checks (how to verify the
result). See the [template library](templates/index.md) for the expected format.

**Customization markers.** All domain-specific content must be replaced with descriptive
customization markers in [brackets]. A marker like [target salary range from BLS data] tells
the author exactly what to substitute. Markers that say [insert content here] are not
descriptive enough.


## The Shareware-Style Vision

This contribution model draws from the Amiga demoscene tradition. In the Amiga scene, people
shared concrete artifacts -- demos, tracker modules, ASCII art, tools, libraries. They did
not share wishes or complaints. Every shared artifact made the next person's work easier. A
shared tracker module could be studied, remixed, and built upon. A shared demo routine could
be adapted for different hardware. The community grew because contribution was the price of
admission and the reward for participation.

The tibsfox.com ecosystem follows the same principle. Contributors share documentation,
templates, educational content, career pathways, AI prompt patterns, and skill definitions.
Each contribution is a concrete artifact that someone else can use, study, adapt, or build
upon. The ecosystem does not have a feature request queue. It has a contribution process.

When you contribute, your work enters the [improvement cycle](meta/improvement-cycle.md).
The observation pipeline monitors which contributions cluster around similar topics -- three
or more contributions about the same domain signal community demand for a new educational
pack. Your individual contribution becomes a data point that shapes the ecosystem's
priorities. The system gets smarter because you participated, and your participation gets
easier because the system is smarter.

That is the loop. That is what makes it work.
