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
