# Documentation and Mintlify Ecosystem

> **Domain:** Upstream Intelligence -- Documentation Patterns
> **Module:** 4 -- The Documentation Layer: Mintlify, MDX, and AI-Assisted Writing
> **Through-line:** *Documentation is not an afterthought. It is the interface between the system and the people who use it. Mintlify's skill distribution pattern is a template for how skill-creator delivers intelligence.*

---

## Table of Contents

1. [The Documentation Layer](#1-the-documentation-layer)
2. [Mintlify Configuration](#2-mintlify-configuration)
3. [AI Tool Integration](#3-ai-tool-integration)
4. [GSD-2 Internal Documentation](#4-gsd-2-internal-documentation)
5. [Documentation Patterns for Skill-Creator](#5-documentation-patterns-for-skill-creator)
6. [Cross-References](#6-cross-references)
7. [Sources](#7-sources)

---

## 1. The Documentation Layer

The GSD ecosystem's documentation layer lives in a dedicated repository: `gsd-build/docs`. It is generated from Mintlify's starter template and represents the public-facing documentation for GSD-2 and its surrounding tools.

This is not a wiki or a README collection. It is a structured documentation site built on MDX -- Markdown with embedded JSX components -- that compiles into a hosted, searchable, and AI-readable documentation portal.

### Repository Structure

```
gsd-build/docs/
  |
  +-- docs.json              Configuration file (site name, logo, colors, navigation)
  |
  +-- index.mdx              Landing page with project overview and quickstart links
  +-- quickstart.mdx          Step-by-step getting started guide
  +-- development.mdx         Developer contribution guide
  |
  +-- sections/
  |     +-- getting-started/   Installation, first project, core concepts
  |     +-- customization/     Themes, layouts, component overrides
  |     +-- writing-content/   MDX syntax, component reference, formatting
  |     +-- ai-tools/          Setup guides for Cursor, Claude Code, Windsurf
  |
  +-- images/                 Logo files, screenshots, diagrams
  +-- package.json            Mintlify CLI dependency
```

### Content Architecture

The docs repository organizes content into four primary sections, each targeting a different user journey:

| Section | Audience | Content |
|---------|----------|---------|
| **Getting Started** | New users | Installation, first project setup, core concepts (milestone, slice, task), first auto mode run |
| **Customization** | Power users | Theme configuration, layout overrides, custom component definitions, branding |
| **Writing Content** | Contributors | MDX syntax reference, available components, formatting conventions, image handling |
| **AI Tools** | AI-assisted developers | Setup guides for Cursor, Claude Code, and Windsurf integration with GSD documentation |

### MDX Content Files

The three root-level MDX files serve as entry points:

**`index.mdx`** -- The landing page. Introduces GSD-2, positions it within the Pi ecosystem, and provides navigation to the four sections. Uses Mintlify's built-in `CardGroup` and `Card` components for visual navigation.

**`quickstart.mdx`** -- Step-by-step guide from installation through first auto mode run. Uses `Steps`, `Step`, `CodeGroup`, and `Tabs` components for structured instruction. This is the single most important page -- it converts visitors into users.

**`development.mdx`** -- Contributor guide covering the monorepo setup, build process, test execution, and PR conventions. Targets developers who want to contribute to GSD-2 itself, not just use it.

> *The three-file entry point pattern is deliberate. Every documentation site answers three questions: "What is this?" (index), "How do I start?" (quickstart), "How do I contribute?" (development). If the answers to these three questions are not on the first three pages a visitor sees, the documentation has failed.*

---

## 2. Mintlify Configuration

Mintlify uses a single configuration file -- `docs.json` -- to define the entire documentation site. This is the configuration-as-code documentation pattern: the site structure, navigation, theming, and integrations are all declared in one JSON file.

### Configuration Schema

```json
{
  "name": "GSD",
  "logo": {
    "dark": "/images/logo-dark.svg",
    "light": "/images/logo-light.svg"
  },
  "colors": {
    "primary": "#0D9373",
    "light": "#07C983",
    "dark": "#0D9373",
    "anchors": { "from": "#0D9373", "to": "#07C983" }
  },
  "navigation": [
    {
      "group": "Getting Started",
      "pages": ["index", "quickstart", "development"]
    },
    {
      "group": "Customization",
      "pages": ["customization/themes", "customization/layouts"]
    },
    {
      "group": "Writing Content",
      "pages": ["writing-content/mdx-syntax", "writing-content/components"]
    },
    {
      "group": "AI Tools",
      "pages": ["ai-tools/cursor", "ai-tools/claude-code", "ai-tools/windsurf"]
    }
  ],
  "footer": {
    "socials": {
      "github": "https://github.com/gsd-build",
      "x": "https://x.com/gsd_build"
    }
  },
  "api": {
    "baseUrl": "https://api.gsd.build"
  }
}
```

### Key Configuration Properties

| Property | Purpose | Skill-Creator Relevance |
|----------|---------|------------------------|
| `name` | Site title, used in header and metadata | Brand identity pattern |
| `logo` | Dark/light logo variants for theme switching | Asset management pattern |
| `colors` | Primary, light, dark, and anchor gradient colors | Theming system |
| `navigation` | Hierarchical page groups with ordered page arrays | Content organization model |
| `footer.socials` | Social media links rendered in site footer | Community connection |
| `api.baseUrl` | Base URL for API reference generation | Integration endpoint |

### The Configuration-as-Code Pattern

The significance of `docs.json` is not the file itself but the pattern it represents: **a single declarative file defines the entire documentation structure.** Navigation order, theming, branding, API integration -- all in one place, version-controlled alongside the content.

This pattern has specific advantages for AI-assisted documentation:

1. **Parseable structure.** An LLM can read `docs.json` and understand the site's entire organization without crawling pages.
2. **Predictable modification.** Adding a new page means adding one entry to the navigation array. No hidden side effects.
3. **Diffable changes.** Documentation structure changes are visible in git diffs as JSON modifications.
4. **Templatable.** New documentation sites can be scaffolded by modifying a starter `docs.json` -- which is exactly how `gsd-build/docs` was created.

> *Configuration-as-code documentation is not a Mintlify invention. But Mintlify made it the default, and that matters. When the default is a parseable, diffable, AI-readable configuration file, documentation stops being a human-only artifact and becomes machine-readable infrastructure.*

---

## 3. AI Tool Integration

The `gsd-build/docs` repository includes setup guides for three AI coding tools: Cursor, Claude Code, and Windsurf. These guides are not generic "how to use AI" tutorials. They are specific integration instructions for using AI tools to write and maintain GSD documentation.

### The `npx skills add` Pattern

The most significant pattern in these guides is the skill distribution mechanism:

```bash
npx skills add https://mintlify.com/docs
```

This command installs Mintlify's documentation writing skills into the AI tool's context. After installation, the AI tool has access to:

- Mintlify's MDX component reference (available components, their props, usage examples)
- Writing standards (tone, structure, formatting conventions)
- Configuration schema (how to modify `docs.json` correctly)
- Content patterns (how to structure a quickstart, a tutorial, an API reference)

### Per-Tool Setup

| Tool | Integration Method | Skill Delivery |
|------|-------------------|----------------|
| **Cursor** | `.cursor/rules/` directory with Mintlify-specific rules | Rules files auto-loaded on project open |
| **Claude Code** | `.claude/skills/` directory or CLAUDE.md instructions | Skills loaded per session via skill discovery |
| **Windsurf** | `.windsurf/rules/` directory with documentation conventions | Rules injected into Cascade context |

### Why This Pattern Matters for Skill-Creator

The `npx skills add` command is a distribution model. It solves the problem: "How do I get specialized knowledge into an AI tool's context without the user having to write it themselves?"

The current state of skill distribution:

```
Skill Author
     |
     v
Publish skill to URL (hosted documentation, npm package, or GitHub repo)
     |
     v
User runs: npx skills add <url>
     |
     v
Skills installed to local project directory
     |
     v
AI tool discovers and loads skills on next session
```

This is precisely the distribution pipeline that skill-creator needs. Today, skill-creator generates skills and stores them locally. With a `skills add`-style distribution mechanism, generated skills could be:

1. **Published** to a registry (npm, GitHub, or a dedicated skill registry)
2. **Discovered** by other users and projects via search or recommendation
3. **Installed** with a single command into any project's AI tool context
4. **Updated** when the source skill evolves (version pinning, update notifications)
5. **Composed** with other skills (dependency declarations, skill stacking)

> *Mintlify did not set out to build a skill distribution platform. But `npx skills add` is exactly that -- a mechanism for distributing specialized AI knowledge to development environments. Skill-creator should adopt this pattern, not reinvent it.*

### The Three-Tool Reality

The AI tool integration guides acknowledge a practical reality: developers use different AI coding tools. GSD-2's documentation must work with Cursor, Claude Code, and Windsurf -- not just one of them. This multi-tool awareness has implications for skill-creator:

- Skills must be tool-agnostic at the content level (markdown/MDX, not tool-specific configuration)
- Skills must support tool-specific delivery mechanisms (`.cursor/rules/`, `.claude/skills/`, `.windsurf/rules/`)
- The skill format should be the lowest common denominator that all tools can consume

This is the same constraint that GSD-2's extension system already handles. Extensions are behavioral knowledge in markdown format -- tool-agnostic content that is injected into whatever agent runtime is being used. Skill-creator can follow the same approach.

---

## 4. GSD-2 Internal Documentation

Separate from the `gsd-build/docs` Mintlify site, GSD-2 maintains its own internal documentation in a `docs/` directory within the main repository. This internal documentation is developer-facing -- it targets people who are using, configuring, or extending GSD-2, not casual visitors.

### Documentation Inventory

GSD-2's `docs/` directory contains 17 documentation files:

| # | File | Topic | Audience |
|---|------|-------|----------|
| 1 | Getting Started | Installation, first run, basic configuration | New users |
| 2 | Auto Mode | Autonomous execution loop, phase descriptions, control flow | All users |
| 3 | Configuration | All configuration options with defaults and examples | Power users |
| 4 | Custom Models | Adding providers, model aliases, endpoint configuration | Power users |
| 5 | Token Optimization | Budget/balanced/quality profiles, complexity routing | Cost-conscious users |
| 6 | Cost Management | Budget ceilings, per-model pricing, cost tracking | Project managers |
| 7 | Git Strategy | Worktree isolation, branch naming, squash merge, conflict resolution | Developers |
| 8 | Parallel Orchestration | Multi-worker task execution, subagent dispatch, resource contention | Advanced users |
| 9 | Teams | Multi-developer configuration, shared state, role-based access | Team leads |
| 10 | Skills | Skill discovery modes, `always_use_skills`, `skill_rules`, staleness | Skill authors |
| 11 | Commands | Command reference with examples and option descriptions | All users |
| 12 | Architecture | System design, component relationships, extension loading | Contributors |
| 13 | Troubleshooting | Common issues, diagnostic commands, log analysis | Support |
| 14 | CI/CD | Headless mode, GitHub Actions integration, automated pipelines | DevOps |
| 15 | VS Code Extension | Installation, configuration, editor integration features | VS Code users |
| 16 | Visualizer | Execution timeline visualization, cost breakdowns, progress tracking | All users |
| 17 | Dynamic Model Routing | Runtime model selection, fallback chains, provider failover | Advanced users |

### The Mintlify Migration

Within the GSD-2 repository, a `mintlify-docs/` directory contains a migration-in-progress from the internal `docs/` format to the Mintlify MDX format used by `gsd-build/docs`. This migration is notable because it represents a pattern transition:

```
Before migration:
  docs/             Plain markdown, developer-facing, in-repo

After migration:
  gsd-build/docs/   MDX content, public-facing, separate repo
  mintlify-docs/    Migration staging area (in main repo)
```

The migration is not just a format change. It is a audience expansion -- moving documentation from "developers who read source repos" to "anyone who visits the documentation site." The content must be restructured: technical details preserved for power users, but quick-start paths added for newcomers.

### Two Documentation Layers

The result is two documentation layers serving different audiences:

| Layer | Location | Format | Audience | Update Cadence |
|-------|----------|--------|----------|---------------|
| **Internal** | `gsd-2/docs/` | Markdown | Contributors, power users | Every release |
| **Public** | `gsd-build/docs/` | MDX (Mintlify) | All users, newcomers | Continuous |

This two-layer pattern is common in successful open source projects. The internal docs are complete and technical. The public docs are accessible and structured for discovery. Both are necessary. Neither is sufficient alone.

---

## 5. Documentation Patterns for Skill-Creator

The GSD documentation ecosystem -- both the Mintlify public site and GSD-2's internal docs -- provides several patterns that skill-creator can adopt.

### Pattern 1: Configuration-as-Code Documentation

Mintlify's `docs.json` pattern translates directly to skill documentation:

```yaml
# Hypothetical skill-creator docs.yaml
name: "skill-creator-docs"
skills:
  - name: "pattern-observation"
    pages: ["overview", "tool-sequences", "file-patterns", "error-recovery"]
  - name: "skill-generation"
    pages: ["pipeline", "templates", "validation", "publishing"]
  - name: "bridge-architecture"
    pages: ["extension-manifest", "dispatch-hooks", "observation-pipeline"]
```

A single declarative file defines the entire skill documentation structure. AI tools can parse it, navigate it, and use it to answer questions about specific skill capabilities.

### Pattern 2: MDX Component Vocabulary

Mintlify's MDX components provide structured content within documentation:

| Component | Purpose | Skill-Creator Application |
|-----------|---------|--------------------------|
| `CodeGroup` | Multiple code examples with language tabs | Show skill in different formats (YAML, JSON, TypeScript) |
| `Steps` / `Step` | Sequential instruction walkthrough | Skill installation and activation guides |
| `Tabs` / `Tab` | Content alternatives (e.g., by platform) | Tool-specific skill delivery instructions |
| `CardGroup` / `Card` | Visual navigation tiles | Skill catalog browsing |
| `Accordion` | Collapsible content sections | Detailed configuration options |
| `Callout` | Warning, info, tip annotations | Compatibility notes, version requirements |
| `ResponseField` | API response documentation | Skill output schema documentation |

These components are not just formatting -- they are semantic markers. A `Steps` component signals sequential instruction. A `Tabs` component signals platform-specific alternatives. AI tools can parse these semantics to understand content structure, not just content text.

### Pattern 3: AI Skill Distribution via `npx skills add`

This is the most directly applicable pattern. Skill-creator already generates skills. The missing piece is distribution. The `npx skills add` mechanism provides a blueprint:

```
Generation Pipeline (skill-creator)
     |
     v
Skill Package (markdown + metadata)
     |
     v
Registry (npm, GitHub, or dedicated)
     |
     v
Installation Command (npx skills add <source>)
     |
     v
Local Project Directory (.claude/skills/, .cursor/rules/, etc.)
     |
     v
AI Tool Discovery and Loading
```

The key insight from Mintlify's approach: **the skill package format should be tool-agnostic.** The content is markdown. The metadata is structured (YAML frontmatter or a manifest file). The delivery mechanism adapts to the target tool. This separation of content from delivery is what makes `npx skills add` work across Cursor, Claude Code, and Windsurf simultaneously.

### Pattern 4: Two-Layer Documentation

GSD-2's internal docs + public Mintlify site pattern maps to skill-creator's needs:

| Layer | Skill-Creator Equivalent | Content |
|-------|-------------------------|---------|
| **Internal** (`docs/` in repo) | Skill YAML, source code comments, architecture notes | Technical details for contributors |
| **Public** (Mintlify/hosted site) | Skill catalog, usage guides, integration tutorials | Accessible documentation for users |

The internal layer is complete and technical. The public layer is structured for discovery and first-time use. Both exist. Both are maintained. Neither replaces the other.

### Pattern 5: Living Documentation

GSD-2's `mintlify-docs/` migration directory reveals a pattern: documentation evolves alongside the system. The migration is not a one-time conversion but an ongoing process where internal documentation is continuously refined into public-facing content.

For skill-creator, this means generated skills should include documentation from day one -- not as an afterthought, but as a first-class artifact. When a skill is generated from observed patterns, the generation pipeline should produce:

1. The skill itself (YAML/markdown behavioral instructions)
2. A usage guide (when to activate, expected inputs/outputs)
3. An effectiveness report (how well the skill performed during validation)
4. Integration notes (which extensions it interacts with, which profiles it supports)

Documentation generated alongside the skill is accurate documentation. Documentation written afterward is aspirational.

> *The best documentation is the documentation that was never manually written. It was generated from the same process that produced the artifact it describes. Mintlify made documentation sites easy to create. Skill-creator should make skill documentation automatic.*

---

## 6. Cross-References

| Module | Relevance to This Module |
|--------|------------------------|
| [Module 03: GSD-2 Agent Application](03-gsd-2-agent-application.md) | GSD-2's 17 internal documentation files and the `mintlify-docs/` migration directory are described in detail in Module 03. The extension system that delivers behavioral knowledge to agent sessions is the same pattern that delivers documentation skills to AI tools. |
| [Module 05: Bridge Architecture](05-bridge-architecture.md) | The bridge specification includes a documentation component: how skill-creator's generated skills are documented, published, and distributed. The Mintlify `npx skills add` pattern directly informs the bridge's skill distribution design. |
| [tibsfox.com Documentation Pipeline](../../GSD2/research/06-skill-creator-integration.md) | Skill-creator's own documentation is served through the tibsfox.com pipeline -- a static HTML + client-side markdown rendering system. The Mintlify patterns documented here could complement or replace portions of that pipeline. |

---

## 7. Sources

### Primary Repository

- **gsd-build/docs** -- [github.com/gsd-build/docs](https://github.com/gsd-build/docs)
  - Generated from: Mintlify starter template
  - Commits: 1
  - License: MIT
  - Content: MDX files with Mintlify component syntax

### Documentation Platform

- **Mintlify Quickstart** -- [starter.mintlify.com/quickstart](https://starter.mintlify.com/quickstart)
  - Documentation platform with MDX support, AI tool integration, and `npx skills add` distribution
  - Configuration via `docs.json` (site structure, theming, navigation, API integration)
  - Component library: CardGroup, Steps, Tabs, CodeGroup, Accordion, Callout, ResponseField

### GSD-2 Internal Documentation

- **gsd-2/docs/** -- 17 documentation files covering all GSD-2 subsystems
  - Topics: auto mode, configuration, custom models, token optimization, cost management, git strategy, parallel orchestration, teams, skills, commands, architecture, troubleshooting, CI/CD, VS Code extension, visualizer, remote questions, dynamic model routing
- **gsd-2/mintlify-docs/** -- Migration staging directory for moving internal docs to Mintlify format

### AI Tool Integration

- **Cursor** -- `.cursor/rules/` directory convention for AI context rules
- **Claude Code** -- `.claude/skills/` directory convention for skill discovery and loading
- **Windsurf** -- `.windsurf/rules/` directory convention for Cascade context injection
- **Skill installation** -- `npx skills add <url>` pattern for distributing AI-readable documentation as skills

### Tibsfox Ecosystem

- gsd-skill-creator-analysis.md -- current skill-creator architecture, including documentation generation capabilities
- tibsfox.com docs pipeline -- static HTML + client-side markdown rendering for research publication

---

*Module 4 of the Pi-Mono + GSD Ecosystem Upstream Intelligence Pack. This module documents the documentation layer surrounding GSD-2 -- from Mintlify's configuration-as-code pattern to the AI skill distribution mechanism that skill-creator should adopt. Documentation is not a byproduct of the system. It is the interface.*
