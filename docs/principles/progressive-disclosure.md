---
title: "Progressive Disclosure — Three Reading Speeds"
layer: principles
path: "principles/progressive-disclosure.md"
summary: "Three reading speeds as a design principle — how every document and the five-layer model itself implement progressive disclosure."
cross_references:
  - path: "index.md"
    relationship: "builds-on"
    description: "Referenced from the narrative spine"
  - path: "principles/index.md"
    relationship: "builds-on"
    description: "Part of the principles layer"
  - path: "meta/style-guide.md"
    relationship: "parallel"
    description: "The style guide implements this principle as formatting rules"
  - path: "principles/amiga-principle.md"
    relationship: "parallel"
    description: "Progressive disclosure is the AMIGA Principle applied to information"
  - path: "foundations/eight-layer-progression.md"
    relationship: "parallel"
    description: "The eight-layer progression demonstrates progressive disclosure in mathematics"
reading_levels:
  glance: "Every document supports three reading speeds, and the entire ecosystem is structured as progressive disclosure."
  scan:
    - "Glance (3 seconds): title and first paragraph communicate purpose"
    - "Scan (30 seconds): headers and key points provide structural overview"
    - "Read (3-30 minutes): full content delivers depth and nuance"
    - "The five-layer documentation model is progressive disclosure at the ecosystem level"
    - "Rooted in information theory: match content density to available bandwidth"
created_by_phase: "v1.34-328"
last_verified: "2026-02-25"
---

# Progressive Disclosure — Three Reading Speeds

Every document in this ecosystem is useful at three different reading speeds. A reader
who spends three seconds gets the purpose. A reader who spends 30 seconds gets the
structure. A reader who spends 30 minutes gets the depth. This is not a formatting
convention; it is a design principle that shapes how every piece of content is created,
from a single document to the five-layer educational model itself.


## What This Is

Progressive disclosure is the practice of organizing information so that each level of
engagement delivers value proportional to the time invested. The reader is never forced
to consume more than they need, and they are never punished for stopping early. Every
stopping point is a valid stopping point.

The principle applies at three scales in this ecosystem.

**At the document level,** every piece of content supports three reading speeds. The
*glance* level (three seconds) is the title and first paragraph, which together
communicate what the document is about and who it is for. The *scan* level (30 seconds)
is the section headers and opening sentences, which provide a structural overview of the
content. The *read* level (3 to 30 minutes) is the full content, including nuance,
examples, edge cases, and cross-references. A document that fails at the glance level
wastes the time of readers who do not need it. A document that has nothing beyond the
read level fails readers who need depth.

**At the layer level,** the five-layer documentation model is progressive disclosure
applied to an entire educational ecosystem. Layer 1 (foundations) discloses the
mathematical structures that everything rests on. Layer 2 (principles) discloses the
design philosophy that shapes how the tools work. Layer 3 (framework) discloses the
tools themselves. Layer 4 (applications) discloses how the tools produce real-world
results. Layer 5 (community) discloses how to participate and contribute. A visitor
can stop at any layer and have a coherent understanding proportional to how deep they
went.

**At the frontmatter level,** every document carries machine-readable metadata that
captures the glance and scan levels explicitly. The `summary` field is the glance. The
`reading_levels.scan` field is a list of key points. Automated systems (navigation
generators, content pipeline transformations, agent context loading) use these fields
to present documents at the appropriate disclosure level without requiring a human to
read and summarize them.


## What You Will Learn

**How to apply the three speeds to your own writing.** The discipline of progressive
disclosure is a writing skill. It requires writing the glance level first (what is this
document about and who is it for?), then the scan level (what does each section cover?),
and then the read level (what are the details?). This order forces clarity. If you
cannot state the document's purpose in one paragraph, the document's purpose is not
yet clear. The [style guide](meta/style-guide.md) provides the specific formatting
conventions that implement this principle.

**Why three speeds and not two or five.** Three speeds correspond to three common reading
contexts. Glance serves the reader who is navigating: scanning a list of documents,
evaluating search results, deciding whether to open this file. Scan serves the reader
who is orienting: they opened the document and want to know what it covers before
committing to reading it fully. Read serves the reader who is learning: they are here
for the content and want completeness. Each speed has a distinct purpose and a distinct
time budget. Fewer speeds collapse distinct needs together. More speeds create
distinctions without meaningful differences.

**How progressive disclosure connects to information theory.** At the foundations layer,
Layer 7 of the [eight-layer progression](foundations/eight-layer-progression.md) covers
information theory: entropy, compression, and channel capacity. Progressive disclosure
is an information-theoretic design pattern. Each reading speed corresponds to a channel
with different bandwidth. The glance channel has low bandwidth (a few seconds of
attention) and must carry high-signal content with minimal noise. The read channel has
high bandwidth (minutes of sustained attention) and can carry nuance, qualification,
and detail. Designing a document for three speeds is designing content for three
channels, each with its own capacity constraints.

**How the five-layer model IS progressive disclosure at the ecosystem level.** The
layers are not arbitrary categories. They are disclosure levels. A visitor who reads
only the narrative spine (the entry point) has a glance-level understanding of the
entire ecosystem. A visitor who reads the spine and the principles layer has a scan-level
understanding. A visitor who reads the spine, principles, and framework has a read-level
understanding of the tools. Each layer adds depth without requiring the next. This
structure is the same pattern as the three reading speeds, applied at a larger scale.


## How to Approach It

Start by reading any document in docs/ with the three speeds in mind. Read only the
title and first paragraph. Do you know what the document is about? Read only the section
headers. Do you know what it covers? Now read the full content. Is the depth
proportional to the setup? If any of these levels feels missing or incomplete, that is
a quality issue worth noting.

Then look at the ecosystem from the same perspective. Read the narrative spine
(`docs/index.md`). Does it orient you at the glance level? Browse the layer index pages.
Do they orient you at the scan level? Enter a specific gateway document. Does it deliver
depth at the read level? The five-layer model succeeds when this experience feels
natural and each level prepares you for the next.

For the implementation rules that make progressive disclosure concrete in this project,
read the [Documentation Style Guide](meta/style-guide.md). The style guide translates
this principle into specific conventions: frontmatter schema, section structure, line
length, and cross-reference patterns that ensure every document follows the three-speed
pattern.


## How It Connects

Progressive disclosure connects to every other principle in the ecosystem because it is
the communication pattern that makes the other principles accessible.

The [AMIGA Principle](principles/amiga-principle.md) creates systems from specialized,
composable components. Progressive disclosure is how those systems communicate what they
are and what they do. Without progressive disclosure, a well-composed system is opaque:
it works, but no one outside the builder understands why. With progressive disclosure,
each level of the system reveals itself at the appropriate depth.

[Agentic programming](principles/agentic-programming.md) uses progressive disclosure
in the loading pipeline. When skill-creator evaluates which skills to load, it reads
skill metadata (glance level) before loading full skill content (read level). The
six-stage pipeline is itself a progressive disclosure of information about each skill:
score first, then resolve conflicts, then filter by model, then order for cache, then
check budget, then load.

[Humane flow](principles/humane-flow.md) depends on progressive disclosure to avoid
overwhelming the reader. A system that dumps everything at once, regardless of what
the reader needs, is not humane. A system that reveals information at the pace the
reader can absorb it is.

At the foundations layer, the
[eight-layer progression](foundations/eight-layer-progression.md) is progressive
disclosure applied to mathematics. Each layer discloses exactly the concepts the next
layer requires, creating a reading experience where complexity builds gradually rather
than arriving all at once.


## Go Deeper

For the formatting rules that implement this principle:
[Documentation Style Guide](meta/style-guide.md).

For the mathematical connection to information theory:
[Eight-Layer Progression, Layer 7: Information Theory](foundations/eight-layer-progression.md).

For how progressive disclosure shapes tool design:
[Humane Flow](principles/humane-flow.md).
