# v1.45 — Agent-Ready Static Site

**Shipped:** 2026-02-26 | **Phases:** 8 (408-415) | **Plans:** 22 | **Commits:** 41 | **Tests:** 243

## Overview

Built a custom static site generator for tibsfox.com that transforms markdown documentation into static HTML with parallel agent-discovery layers (llms.txt, llms-full.txt, AGENTS.md, Schema.org JSON-LD), making the site both human-readable and AI-navigable.

## Key Features

- **Markdown Processor**: Heading IDs, citation syntax, external link handling, table of contents extraction
- **Template Engine**: Mustache-style templates with variables, sections, partials for 7 page variants
- **Build Orchestrator**: File discovery, processing pipeline, output writer, CLI interface
- **Agent Discovery**: llms.txt + llms-full.txt generators for AI agent consumption, AGENTS.md generator, Schema.org JSON-LD structured data, markdown mirror for machine reading
- **CSS Design System**: Custom properties, typography, dark/light/print modes, responsive layout
- **HTML Templates**: 7 page variants with shared partials (header, nav, footer)
- **Search System**: Client-side search with index builder (< 3KB JavaScript)
- **Citation Integration**: Citation resolver and bibliography page generator
- **WordPress Integration**: Comment widget, content sync push/pull via MCP
- **Deployment Tools**: FTP/rsync deployment with dry-run and verification
- **Content Pipeline**: Sample content generation, site.yaml configuration, navigation.yaml
- **Quality Audit**: Link checking, HTML validation, size checks, agent file consistency
- **Generator Documentation**: README with deployment guide and API reference

## Architecture

```
markdown files → frontmatter parser → markdown processor → template engine → HTML output
                                                                    ↓
                                        llms.txt + llms-full.txt + AGENTS.md + JSON-LD
```

## Wave Execution

| Wave | Phases | Description |
|------|--------|-------------|
| 0 | 408 | Foundation — shared types, utilities |
| 1A | 409 | Generator core — markdown, templates, build |
| 1B | 410 | Agent discovery — llms.txt, AGENTS.md, JSON-LD |
| 1C | 411 | Design system — CSS, HTML templates |
| 2A | 412 | Search + citations |
| 2B | 413 | WordPress + feed + deploy |
| 3 | 414 | Content + assembly |
| 4 | 415 | Integration + verification |

## Stats

87 files changed, 9,247 insertions, 243 tests

## Retrospective

### What Worked
- **Dual-audience architecture: human-readable HTML + AI-navigable discovery layers.** The same content serves both humans (HTML with CSS design system, dark/light/print modes) and AI agents (llms.txt, llms-full.txt, AGENTS.md, Schema.org JSON-LD, markdown mirror). This is forward-thinking -- sites will increasingly be consumed by both audiences.
- **Client-side search under 3KB JavaScript.** Keeping the search system small means no server dependencies, no API calls, and instant load. The index builder runs at build time; the client just reads the index.
- **7 page variants with shared partials (header, nav, footer).** The Mustache-style template engine with variables, sections, and partials avoids duplication while supporting different page layouts. This is the right abstraction for a static site with diverse content types.
- **WordPress integration via MCP for content sync.** Push/pull content sync means the static site and the WordPress site stay in sync without manual copy-paste. The comment widget bridges the gap between static content and dynamic interaction.

### What Could Be Better
- **243 tests across 87 files for a full static site generator is spread thin.** The pipeline spans markdown processing, template rendering, CSS generation, search indexing, citation resolution, agent discovery, WordPress sync, and FTP deployment. Each subsystem needs its own test depth.
- **FTP/rsync deployment is functional but fragile.** Dry-run and verification help, but deployment without a staging environment means the first real deployment is also the first production deployment.

## Lessons Learned

1. **Agent discovery layers (llms.txt, AGENTS.md, JSON-LD) are the sitemap.xml of the AI era.** Just as search engines need structured metadata to index sites, AI agents need structured discovery documents to navigate them. Building these into the static site generator makes them automatic, not afterthoughts.
2. **A custom static site generator is justified when the output requirements are non-standard.** Citation syntax, agent discovery layers, WordPress content sync, and progressive disclosure templates are not features available in off-the-shelf SSGs. The custom build cost is offset by exact-fit output.
3. **Quality audit (link checking, HTML validation, size checks, agent file consistency) at build time catches problems before deployment.** Running the audit as part of the build pipeline means broken links and invalid HTML never reach production.
4. **The site architecture documents the project's public face.** The 5-phase incremental migration plan from v1.34 now has a concrete implementation. The static site generator is the execution of that plan.
