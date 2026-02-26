---
title: "Filesystem Contracts"
layer: meta
path: "meta/filesystem-contracts.md"
summary: "Machine-readable YAML mapping every directory and key file to creator phase, consumers, and purpose."
cross_references:
  - path: "meta/index.md"
    relationship: "builds-on"
    description: "Part of meta-documentation"
  - path: "meta/style-guide.md"
    relationship: "parallel"
    description: "Style guide that all content must follow"
  - path: "meta/content-map.md"
    relationship: "parallel"
    description: "Content inventory that complements these contracts"
reading_levels:
  glance: "File ownership contracts — who creates what, who consumes it, and what each file is for."
  scan:
    - "Every directory and key file mapped to a creator phase"
    - "Consumer phases listed for dependency tracking"
    - "Machine-readable YAML format for automated validation"
    - "Covers all 8 top-level directories and their contents"
created_by_phase: "v1.34-326"
last_verified: "2026-02-25"
---

# Filesystem Contracts

This document defines ownership contracts for every directory and key file in docs/. Each
entry specifies which phase creates the content, which phases consume it, and what purpose
the file serves. The contracts are expressed as YAML to enable automated validation during
the verification phase (Phase 333).

Consuming phases depend on the creator phase completing first. The wave execution plan in
the milestone specification enforces this ordering.


## How to Read These Contracts

Each entry follows this structure:

```yaml
path: "relative/path/from/docs/"
creator: "v1.34-NNN"
consumers:
  - "v1.34-NNN"
purpose: "What this file or directory is for"
```

The **creator** field identifies the phase responsible for producing the content. The
**consumers** field lists phases that read, reference, or depend on this content. The
**purpose** field describes the file's role in the documentation ecosystem.

Directories are listed first, then individual key files within each directory.


## Directory Contracts

```yaml
contracts:

  # ─── Root ───────────────────────────────────────────────────

  - path: "docs/"
    creator: "v1.34-326"
    consumers: ["all-phases"]
    purpose: "Root directory — canonical source for all documentation"

  - path: "docs/index.md"
    creator: "v1.34-327"
    consumers: ["v1.34-328", "v1.34-329", "v1.34-333"]
    purpose: "Narrative spine — entry point mapping the five-layer educational journey"

  - path: "docs/about.md"
    creator: "v1.34-329"
    consumers: ["v1.34-333"]
    purpose: "About page — tibsfox, GSD, and skill-creator background"

  # ─── Foundations (Layer 1) ──────────────────────────────────

  - path: "docs/foundations/"
    creator: "v1.34-326"
    consumers: ["v1.34-328", "v1.34-333"]
    purpose: "Layer 1 — mathematical foundations directory"

  - path: "docs/foundations/index.md"
    creator: "v1.34-328"
    consumers: ["v1.34-327", "v1.34-333"]
    purpose: "Foundations layer overview with links to all gateway documents"

  - path: "docs/foundations/mathematical-foundations.md"
    creator: "v1.34-328"
    consumers: ["v1.34-327", "v1.34-333"]
    purpose: "Gateway to The Space Between — mathematical framework entry point"

  - path: "docs/foundations/complex-plane.md"
    creator: "v1.34-328"
    consumers: ["v1.34-327", "v1.34-333"]
    purpose: "Complex Plane of Experience — growth as complex coordinates"

  - path: "docs/foundations/eight-layer-progression.md"
    creator: "v1.34-328"
    consumers: ["v1.34-327", "v1.34-333"]
    purpose: "Eight-layer progression from unit circle to L-systems"

  # ─── Principles (Layer 2) ──────────────────────────────────

  - path: "docs/principles/"
    creator: "v1.34-326"
    consumers: ["v1.34-328", "v1.34-333"]
    purpose: "Layer 2 — design principles directory"

  - path: "docs/principles/index.md"
    creator: "v1.34-328"
    consumers: ["v1.34-327", "v1.34-333"]
    purpose: "Principles layer overview with links to all gateway documents"

  - path: "docs/principles/agentic-programming.md"
    creator: "v1.34-328"
    consumers: ["v1.34-327", "v1.34-333"]
    purpose: "Gateway to skills-and-agents composable programming model"

  - path: "docs/principles/amiga-principle.md"
    creator: "v1.34-328"
    consumers: ["v1.34-327", "v1.34-333"]
    purpose: "Architectural leverage from constrained building blocks"

  - path: "docs/principles/progressive-disclosure.md"
    creator: "v1.34-328"
    consumers: ["v1.34-327", "v1.34-326", "v1.34-333"]
    purpose: "Three reading speeds — glance, scan, read"

  - path: "docs/principles/humane-flow.md"
    creator: "v1.34-328"
    consumers: ["v1.34-327", "v1.34-333"]
    purpose: "Systems that support human capability without creating shame"

  # ─── Framework (Layer 3) ───────────────────────────────────

  - path: "docs/framework/"
    creator: "v1.34-326"
    consumers: ["v1.34-329", "v1.34-331", "v1.34-333"]
    purpose: "Layer 3 — framework documentation directory"

  - path: "docs/framework/index.md"
    creator: "v1.34-329"
    consumers: ["v1.34-327", "v1.34-333"]
    purpose: "Framework layer overview with links to guides, tutorials, and reference"

  - path: "docs/framework/getting-started.md"
    creator: "v1.34-329"
    consumers: ["v1.34-327", "v1.34-331", "v1.34-333"]
    purpose: "Quick start guide — migrated from WordPress"

  - path: "docs/framework/core-concepts.md"
    creator: "v1.34-329"
    consumers: ["v1.34-327", "v1.34-331", "v1.34-333"]
    purpose: "Skills, agents, teams, patterns — migrated from WordPress"

  - path: "docs/framework/features.md"
    creator: "v1.34-329"
    consumers: ["v1.34-327", "v1.34-331", "v1.34-333"]
    purpose: "Features and capabilities — migrated from WordPress"

  - path: "docs/framework/architecture/"
    creator: "v1.34-326"
    consumers: ["v1.34-329", "v1.34-333"]
    purpose: "Architecture documentation subdirectory"

  - path: "docs/framework/architecture/index.md"
    creator: "v1.34-329"
    consumers: ["v1.34-327", "v1.34-333"]
    purpose: "Architecture overview — migrated from WordPress"

  - path: "docs/framework/architecture/core-learning.md"
    creator: "v1.34-329"
    consumers: ["v1.34-327", "v1.34-333"]
    purpose: "Core learning domain (CAP-001 through CAP-006) — migrated from WordPress"

  - path: "docs/framework/user-guides/"
    creator: "v1.34-326"
    consumers: ["future-phase"]
    purpose: "User guides subdirectory — placeholder for future migration"

  - path: "docs/framework/tutorials/"
    creator: "v1.34-326"
    consumers: ["future-phase"]
    purpose: "Tutorials subdirectory — placeholder for future migration"

  - path: "docs/framework/reference/"
    creator: "v1.34-326"
    consumers: ["future-phase"]
    purpose: "API and CLI reference subdirectory — placeholder for future migration"

  - path: "docs/framework/developer-guide/"
    creator: "v1.34-326"
    consumers: ["future-phase"]
    purpose: "Developer guide subdirectory — placeholder for future migration"

  # ─── Applications (Layer 4) ────────────────────────────────

  - path: "docs/applications/"
    creator: "v1.34-326"
    consumers: ["v1.34-329", "v1.34-330", "v1.34-333"]
    purpose: "Layer 4 — real-world applications directory"

  - path: "docs/applications/index.md"
    creator: "v1.34-329"
    consumers: ["v1.34-327", "v1.34-333"]
    purpose: "Applications layer overview with links to packs and case studies"

  - path: "docs/applications/power-efficiency.md"
    creator: "v1.34-329"
    consumers: ["v1.34-327", "v1.34-330", "v1.34-333"]
    purpose: "Gateway to Power Efficiency Rankings page on tibsfox.com"

  - path: "docs/applications/educational-packs.md"
    creator: "v1.34-328"
    consumers: ["v1.34-327", "v1.34-329", "v1.34-333"]
    purpose: "Index of all educational packs with status and cross-references"

  - path: "docs/applications/case-studies/"
    creator: "v1.34-326"
    consumers: ["v1.34-329", "v1.34-333"]
    purpose: "Case studies subdirectory"

  - path: "docs/applications/case-studies/index.md"
    creator: "v1.34-329"
    consumers: ["v1.34-327", "v1.34-333"]
    purpose: "Case studies index with links to individual studies"

  - path: "docs/applications/case-studies/openstack-cloud.md"
    creator: "v1.34-329"
    consumers: ["v1.34-327", "v1.34-330", "v1.34-333"]
    purpose: "v1.33 OpenStack Cloud mission as detailed case study"

  - path: "docs/applications/openstack-cloud/"
    creator: "v1.34-326"
    consumers: ["future-phase"]
    purpose: "OpenStack cloud documentation hub — placeholder for future content"

  # ─── Community (Layer 5) ───────────────────────────────────

  - path: "docs/community/"
    creator: "v1.34-326"
    consumers: ["v1.34-332", "v1.34-333"]
    purpose: "Layer 5 — community participation directory"

  - path: "docs/community/index.md"
    creator: "v1.34-332"
    consumers: ["v1.34-327", "v1.34-333"]
    purpose: "Community layer overview with links to contributing and exchange"

  - path: "docs/community/contributing.md"
    creator: "v1.34-332"
    consumers: ["v1.34-333"]
    purpose: "Contribution guide — types, process, quality standards"

  - path: "docs/community/skill-exchange.md"
    creator: "v1.34-332"
    consumers: ["v1.34-333"]
    purpose: "Shareware-style skill sharing concept — future platform"

  - path: "docs/community/code-of-conduct.md"
    creator: "v1.34-332"
    consumers: ["v1.34-333"]
    purpose: "Community standards and expectations"

  # ─── Templates ─────────────────────────────────────────────

  - path: "docs/templates/"
    creator: "v1.34-326"
    consumers: ["v1.34-330", "v1.34-332", "v1.34-333"]
    purpose: "Reusable templates extracted from exemplar artifacts"

  - path: "docs/templates/index.md"
    creator: "v1.34-330"
    consumers: ["v1.34-327", "v1.34-332", "v1.34-333"]
    purpose: "Template library overview with links to individual templates"

  - path: "docs/templates/educational-pack.md"
    creator: "v1.34-330"
    consumers: ["v1.34-332", "v1.34-333", "future-missions"]
    purpose: "Educational pack template — structure for domain-specific learning resources"

  - path: "docs/templates/career-pathway.md"
    creator: "v1.34-330"
    consumers: ["v1.34-332", "v1.34-333", "future-missions"]
    purpose: "Career pathway template — domain-agnostic career transition structure"

  - path: "docs/templates/ai-learning-prompt.md"
    creator: "v1.34-330"
    consumers: ["v1.34-332", "v1.34-333", "future-missions"]
    purpose: "AI learning prompt template — AI tool integration patterns"

  - path: "docs/templates/mission-retrospective.md"
    creator: "v1.34-330"
    consumers: ["v1.34-332", "v1.34-333", "future-missions"]
    purpose: "Mission retrospective template — LLIS lessons-learned format"

  # ─── Meta ──────────────────────────────────────────────────

  - path: "docs/meta/"
    creator: "v1.34-326"
    consumers: ["all-phases"]
    purpose: "Documentation about the documentation — standards, contracts, processes"

  - path: "docs/meta/index.md"
    creator: "v1.34-326"
    consumers: ["all-phases"]
    purpose: "Meta-documentation overview with links to all governance documents"

  - path: "docs/meta/style-guide.md"
    creator: "v1.34-326"
    consumers: ["all-content-phases"]
    purpose: "Writing standards — voice, tone, formatting, frontmatter schema"

  - path: "docs/meta/filesystem-contracts.md"
    creator: "v1.34-326"
    consumers: ["all-phases", "v1.34-333"]
    purpose: "File ownership mapping — creator, consumers, purpose"

  - path: "docs/meta/content-map.md"
    creator: "v1.34-327"
    consumers: ["v1.34-329", "v1.34-333"]
    purpose: "Complete content inventory with layer assignments and status"

  - path: "docs/meta/site-architecture.md"
    creator: "v1.34-331"
    consumers: ["v1.34-332", "v1.34-333", "future-build-mission"]
    purpose: "Custom www/ structure, URL mapping, redirect map, SSG evaluation"

  - path: "docs/meta/content-pipeline.md"
    creator: "v1.34-331"
    consumers: ["v1.34-332", "v1.34-333", "future-build-mission"]
    purpose: "docs/ to www/ transformation — build process, link resolution, automation"

  - path: "docs/meta/improvement-cycle.md"
    creator: "v1.34-332"
    consumers: ["v1.34-333", "skill-creator-observation"]
    purpose: "Iterative feedback loop — 5 loops connecting observation to quality improvement"
```


## Contract Validation

During the verification phase (Phase 333), the contracts above will be validated against the
actual filesystem. The checks are:

Every `path` entry must correspond to a file or directory that exists. Every `creator` phase
must have produced the content — placeholder scaffolding from Phase 326 does not count as
"created" for content phases. Every document's frontmatter `created_by_phase` field must match
the `creator` field in this contract.

Consumer phases that reference a file must include it in their cross-references or use it as
input during their execution. The `all-phases` and `all-content-phases` consumer values are
wildcard entries that exempt those files from specific consumer validation.

The `future-phase` and `future-missions` consumer values indicate content that exists as
scaffolding for work outside the current milestone. These entries will not be validated for
consumer presence.
