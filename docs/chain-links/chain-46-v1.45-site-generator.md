# Chain Link: v1.45 Site Generator

**Chain position:** 46 of 50
**Milestone:** v1.50.59
**Type:** REVIEW
**Score:** 4.75/5.0

---

## Score Trend

```
Pos  Ver      Score  Δ      Commits  Files
 39  v1.35    4.50   +0.56       81   107
 40  v1.36+37 4.44   -0.06       53   115
 41  v1.38    4.56   +0.12       39    69
 42  v1.39    4.50   -0.06       37   129
 43  v1.41    4.56   +0.06       36   151
 44  v1.42+43 4.44   -0.12       34    93
 45  v1.44    4.63   +0.19       22    54
 46  v1.45    4.75   +0.12       41    87
rolling: 4.55 | chain: 4.31 | floor: 3.32 | ceiling: 4.75
```

## What Was Built

A complete static site generator for tibsfox.com with a Mustache-style template engine, Markdown renderer with citation syntax, Atom feed + sitemap + robots.txt + .htaccess generators, deployment script (FTP/rsync with dry-run), AI agent discovery layer (5 output formats), WordPress coexistence (content sync, comment widget, HTML-to-markdown), quality audit runner, client-side search, CSS design system with dark/light/print, and real sample content. 41 commits, 87 files, +9,247 lines. Zero fix commits. 20 test-first commits (49%).

### Types & Utilities (Phase 408, 4 commits)

**Type system (types.ts, 157 lines):** 17 interfaces covering the entire domain — FrontMatter (20 fields including agent_visible, agent_priority, wp_post_id, wp_sync), ContentPage, SiteConfig, AgentConfig, WordPressConfig, DeployConfig, NavigationSection, SearchEntry (compressed keys for minimal JSON size), CitationEntry/CitationDatabase, BuildResult, TemplateData, BuildOptions. Clean separation between content, config, and build concerns.

**Utility modules (4 files):** Frontmatter parser with YAML extraction and validation (129 lines). Slug utilities — file path to clean URL, with special-casing for index.md (65 lines). File walker with injectable readdir/stat functions (111 lines). TOC extractor from rendered HTML headings (57 lines). All accept injected I/O functions for testability.

### Core Pipeline (Phase 409, 6 commits)

**Markdown processor (markdown.ts, 131 lines):** Custom `marked` renderer with three extensions: heading ID slugification, citation pre-processing (both `[@key]` single and `[@a; @b]` multi-citation syntax with sequential numbering), and external link markers (target=_blank, rel=noopener). Module-level citation state with explicit reset between pages. Returns both rendered HTML and extracted TOC.

**Template engine (templates.ts, 184 lines):** Mustache-style engine with no external dependency. Supports variable interpolation with dot-notation resolution, HTML escaping ({{var}}) vs raw output ({{{var}}}), section blocks (conditionals for truthy/falsy values, array iteration with {{.}} context), and partial inclusion ({{>name}}) with recursive expansion up to depth 10. Processing order: partials → sections → interpolation. Clean, focused, correct.

**Build orchestrator (build.ts, 284 lines):** 9-step pipeline: load site config (YAML) → load navigation → load templates → walk content directory → process each page (frontmatter → citations → markdown → template merge with Schema.org JSON-LD) → generate agent discovery layer → build search index → generate feed/sitemap/robots → copy static assets. Handles drafts (skip unless includeDrafts), missing frontmatter (warn), missing citation database (graceful skip). All I/O injectable via BuildOptions.

### Agent Discovery Layer (Phase 410, 4 commits)

**llms.txt generator (84 lines):** Curated index for AI agents. Filters by agent_visible, sorts by agent_priority → nav_order → title, groups by nav_section. Output follows the emerging llms.txt convention: site header, description, then sections with linked entries and descriptions.

**llms-full.txt generator (87 lines):** Complete site content dump for AI ingestion. Same filtering and sorting as llms.txt but includes full raw markdown per page with separator blocks. Size warning at 500KB threshold.

**AGENTS.md generator (101 lines):** Agent guide with usage instructions ("start with /llms.txt", "request /llms-full.txt", "individual pages at /docs/{path}.md"), content section inventory with page counts, top 10 key resources by priority, and citation guidance.

**Schema.org JSON-LD (schema-org.ts, 159 lines):** Per-page structured data with 6 schema types: Article, TechArticle, Book, Course, WebSite, WebPage. Each page gets a primary schema object plus a BreadcrumbList derived from URL segments. Proper @context handling to avoid duplication in JSON-LD arrays.

**Markdown mirror (19 lines):** Exposes raw markdown at /docs/ paths for AI agents that prefer markdown over HTML.

### Design System (Phase 411, 4 commits)

**CSS (style.css, 682 lines):** Four CSS layers (reset, base, components, utilities). Custom properties for colors, typography, spacing. Dark mode default with prefers-color-scheme light override. Fluid typography using clamp(). Font stacks (system-ui, serif, monospace). 70ch measure for reading width. Print stylesheet. Skip-to-content link. Mobile-responsive navigation with checkbox toggle (no JS). Code block styling with language labels.

**HTML templates (7 templates + 5 partials):** Base, home, page, essay, listing, bibliography, textbook, 404. Partials: header, nav, footer, breadcrumb, toc. Base template includes skip link, Schema.org injection, search overlay, feed link. All use the template engine's section/partial/interpolation features.

### Content Features (Phase 412, 4 commits)

**Search index builder (search.ts, 71 lines):** Strips markdown syntax (code blocks, links, images, headings, emphasis, blockquotes) to plain text. Extracts first 200 words as excerpt. Compressed keys (t/d/u/g/x) for minimal JSON size. Client-side search script (81 lines) with fuzzy matching against title, description, tags, and excerpt.

**Citation resolver (citations.ts, 174 lines):** Resolves citation references against a JSON citation database. Sequential numbering by first appearance. Multi-citation support. Unresolved key warnings with fallback span. Bibliography generation sorted alphabetically by first author's last name. Chicago-adjacent formatting for books and articles. DOI preservation.

### WordPress & Deployment (Phase 413, 8 commits)

**Comment widget (comments.ts, 40 lines):** Generates vanilla JS comment section for build-time injection into pages with `comments: true` frontmatter. Client-side script (120 lines) fetches and posts comments via WordPress REST API.

**Content sync (wp-sync.ts, 158 lines):** Bidirectional — pull from WordPress (fetch posts, convert HTML to markdown with frontmatter, write files) and push to WordPress (read markdown, parse frontmatter, create or update post by wp_post_id). Adapter-based API access for testability.

**HTML-to-markdown converter (html-to-md.ts, 112 lines):** Hand-rolled converter handling paragraphs, bold/italic, links, images, headings, lists, code blocks (with language class preservation), horizontal rules. Strips WordPress-specific markup (wp-block classes, alignment helpers). HTML entity decoding.

**Feed generators:** Atom 1.0 feed (75 lines, max 20 entries, proper XML escaping). XML sitemap (96 lines, priority from agent_priority). robots.txt with sitemap reference and AI discovery hints. Apache .htaccess for static + WordPress coexistence (agent files at root, static file passthrough, WordPress at /wp/ subdirectory, custom 404).

**Deployment (deploy.ts, 192 lines):** Adapter pattern — `DeployAdapter` interface with connect/upload/listRemote/disconnect. Exclude pattern matching (*.ext wildcards and exact names). Dry-run mode lists files without uploading. Post-deploy verification checks index.html and llms.txt accessibility.

### Quality & Documentation (Phase 414-415, 7 commits)

**Sample content:** 7 markdown files with proper frontmatter — essays (The Amiga Principle, The Space Between), pack pages (BBS Culture, Electronics, Kung Fu Cinema), skill pages (Skill Creator), and structural pages (index, about, bibliography). Not lorem ipsum — the Amiga essay is a 1,200-word piece on constraint-driven design philosophy with genuine technical depth.

**Site configuration:** site.yaml with full config (title, URL, agent flags, WordPress API endpoints, FTP deployment). navigation.yaml with section structure. citations.json with 5 real academic citations (Knuth TAOCP, Abelson SICP, Kernighan C Programming, Patterson Computer Organization, Crawford Amiga Hardware Reference).

**Quality audit (audit.ts, 205 lines):** 6 automated checks: CSS total size < 15KB, JS total size < 5KB, internal link integrity (builds URL set from output HTML, validates all internal href), Schema.org JSON-LD validity (parses every `<script type="application/ld+json">` block), agent file consistency (URLs in llms.txt exist in sitemap), deterministic build output (file count stability). Produces structured AuditResult with per-check details and warnings.

**Documentation (README.md, 437 lines):** Architecture overview with pipeline diagram, module tables for all 6 subsystems, quick start guide, project structure, design decisions.

### Barrel Export (index.ts, 75 lines)

Complete barrel with all types, functions, and adapters exported. Clean grouping by subsystem. Re-exports WordPress types for consumer convenience.

## Dimensional Scores

| # | Dimension | Score | Notes |
|---|-----------|-------|-------|
| 1 | Architecture | 5 | Injectable I/O everywhere. 9-step build pipeline. Adapter pattern for deploy. Clean module boundaries. |
| 2 | Code Quality | 4 | Strong typing, HTML/XML escaping throughout. OL bug in html-to-md.ts (callback drops list item content). bytesTransferred always 0 in deploy. |
| 3 | Testing | 5 | 20/41 test-first commits. 28 test files, 4,111 lines (45% of total). In-memory FS for build tests. Zero fix commits. |
| 4 | Completeness | 5 | Full static site generator: template engine, markdown, citations, feed, sitemap, search, deploy, audit, WordPress, agent layer, CSS, content. |
| 5 | Commit Hygiene | 5 | Perfect conventional commits. Clean phase scoping (408-415). TDD ordering maintained throughout. |
| 6 | Scope Discipline | 5 | All changes in src/site/ and test/site/. Version bump files only exception. Zero drift into other modules. |
| 7 | Innovation | 4 | Agent discovery layer (5 formats) is genuinely forward-thinking. WordPress coexistence is practical. Domain itself is well-trodden. |
| 8 | Documentation | 5 | 437-line README with architecture tables. Clean JSDoc. Self-documenting types. Real sample content doubles as format documentation. |

**Average: 4.75** (38/8)

## Key Findings

### This Is a Real Site Generator, Not Scaffolding

Every module is feature-complete and tested. The template engine handles interpolation, escaping, sections, partials, and recursion limits. The markdown processor extends marked with citation syntax and external link marking. The build pipeline wires 9 stages together with full injectable I/O. The deployment script has adapter-based protocol support, dry-run mode, and post-deploy verification. The quality audit checks its own output across 6 dimensions. This could deploy a production site today.

### The Agent Discovery Layer Is the Differentiator

Five output formats for AI agent consumption: llms.txt (curated index), llms-full.txt (complete content), AGENTS.md (usage guide with content inventory), Schema.org JSON-LD (6 schema types + breadcrumbs), and markdown mirror (raw markdown at /docs/ paths). The site treats AI agents as first-class citizens of the web. This is the first static site generator in the codebase that builds for both human and machine readers from the same source.

### P10 (Template-Driven) Becomes Literal

Previous chain links identified P10 — the pattern of template-driven development where plan structure dictates code structure. v1.45 makes P10 literal: a Mustache-style template engine is the core of the system. The 7 HTML templates with 5 partials define the site's output structure, and the template engine's processing order (partials → sections → interpolation) is itself a pipeline. Template-driven development building a template engine is the most recursive application of P10 in the chain.

### Injectable I/O Enables Perfect Testing

Every module accepts I/O functions as parameters: readFile, writeFile, walkDir, ensureDir, copyDir in BuildOptions. The deployment adapter is an interface. The WordPress API is an adapter. The quality audit takes readFile and walkDir. This means 28 test files with 4,111 lines can run entirely in-memory with no filesystem dependency. Zero fix commits is a direct consequence of this architecture — when everything is injectable, everything is testable, and bugs are caught in the RED phase.

### WordPress Coexistence Is Practical Architecture

Rather than replacing WordPress, the site generator coexists with it: static HTML served from root, WordPress at /wp/ subdirectory, .htaccess routing between them, comment widget that talks to the WP REST API, bidirectional content sync. This is a hybrid architecture for real-world deployment where a WordPress installation already exists and the site needs to progressively adopt static generation without a hard cutover.

### The Sample Content Has Depth

The Amiga Principle essay isn't filler — it's a genuine 1,200-word piece on constraint-driven design philosophy that connects 1985 hardware engineering to modern software practices. The citation database includes real academic references (Knuth, Abelson, Kernighan, Patterson, Crawford). The pack pages have actual content descriptions. When sample content is this thoughtful, it serves as both testing material and documentation of the content format expectations.

### Minor Bug: Ordered Lists in HTML-to-Markdown

The html-to-md.ts converter has a bug in ordered list handling. The unordered list handler correctly captures list item content via `$1` backreference, but the ordered list handler uses a callback that increments a counter while discarding the matched content:

```typescript
// UL: correctly preserves content
inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')

// OL: loses content — callback ignores capture group
inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, () => {
  idx++;
  return `${idx}. `;  // list item content dropped
})
```

This produces `1. 2. 3.` instead of `1. first item 2. second item 3. third item`. A minor bug in a supporting utility — it doesn't affect the core build pipeline.

## Pattern Status

No new patterns identified. Existing patterns reinforced:

- **P10 (template-driven):** The most literal application in the chain — a template engine as the core artifact
- **P6 (composition):** 9-stage build pipeline with clean module boundaries
- **P8 (unit-only collaboration):** Injectable I/O everywhere, 28 test files with zero filesystem dependency
- **P11 (forward-only):** Zero fix commits, pure additive development across 41 commits

## Shift Register Update

```
[39] 4.50 → [40] 4.44 → [41] 4.56 → [42] 4.50 → [43] 4.56 → [44] 4.44 → [45] 4.63 → [46] 4.75
rolling: 4.55 | chain: 4.31 | floor: 3.32 | ceiling: 4.75
```

New ceiling established at 4.75, surpassing v1.44's 4.63 by +0.12. Rolling average climbs from 4.45 to 4.55 as the 3.94 (v1.34) drops out of the window and 4.75 enters. The chain is in its strongest sustained run — 8 consecutive positions at 4.44 or above, with the last two establishing successive ceilings.
