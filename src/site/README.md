# tibsfox.com Static Site Generator

A custom static site generator built for tibsfox.com. Produces pure HTML/CSS/JS output with built-in AI agent discovery, WordPress coexistence, and quality verification.

## Architecture

The generator follows a linear pipeline:

```
Content (Markdown)
  -> Frontmatter extraction (YAML)
  -> Citation pre-processing
  -> Markdown rendering (marked)
  -> Template merging (custom engine)
  -> Agent layer generation
  -> Search index
  -> Feed + Sitemap
  -> Static output
```

### Core Modules

| Module | File | Purpose |
|--------|------|---------|
| Build orchestrator | `build.ts` | Pipeline controller, wires all modules |
| Markdown processor | `markdown.ts` | Custom marked renderer with citation syntax, heading IDs |
| Template engine | `templates.ts` | Mustache-like engine with partials, sections, interpolation |
| Frontmatter parser | `utils/frontmatter.ts` | YAML frontmatter extraction |
| Slug utilities | `utils/slug.ts` | Clean URL generation from file paths |
| File walker | `utils/files.ts` | Directory traversal with injectable I/O |
| TOC extractor | `utils/toc.ts` | Table of contents from rendered HTML headings |

### Agent Discovery Layer

| Generator | File | Output |
|-----------|------|--------|
| llms.txt | `agents/llms-txt.ts` | Curated index for AI agents |
| llms-full.txt | `agents/llms-full.ts` | Complete site content for AI ingestion |
| AGENTS.md | `agents/agents-md.ts` | Agent guide with content inventory |
| Schema.org | `agents/schema-org.ts` | JSON-LD structured data per page |
| Markdown mirror | `agents/markdown-mirror.ts` | Raw markdown at `/docs/` paths |

### Content Modules

| Module | File | Purpose |
|--------|------|---------|
| Search | `search.ts` | Client-side search index generation |
| Citations | `citations.ts` | Citation resolution and bibliography |
| Feed | `feed.ts` | Atom 1.0 feed generation |
| Sitemap | `sitemap.ts` | XML sitemap, robots.txt, .htaccess |
| Audit | `audit.ts` | Quality verification runner |

### WordPress Integration

| Module | File | Purpose |
|--------|------|---------|
| Comments | `wordpress/comments.ts` | Vanilla JS comment widget |
| Content sync | `wordpress/wp-sync.ts` | Pull/push content from/to WordPress |
| HTML converter | `wordpress/html-to-md.ts` | WordPress HTML to markdown |

### Deployment

| Module | File | Purpose |
|--------|------|---------|
| Deploy | `deploy.ts` | FTP/rsync adapter-based deployment |

## Quick Start

```bash
# Install dependencies
npm install

# Build the site
npx tsx src/site/build.ts

# Or run via npm script
npm run site:build
```

The build reads content from `src/site/content/`, templates from `src/site/templates/`, configuration from `src/site/config/`, and writes output to `src/site/build/` (gitignored).

## Project Structure

```
src/site/
  build.ts          # Build orchestrator
  markdown.ts       # Markdown processor
  templates.ts      # Template engine
  search.ts         # Search index builder
  citations.ts      # Citation resolver
  feed.ts           # Atom feed generator
  sitemap.ts        # Sitemap/robots/htaccess
  deploy.ts         # Deployment adapter
  audit.ts          # Quality audit
  types.ts          # Shared TypeScript types
  index.ts          # Barrel export
  agents/           # Agent discovery generators
  utils/            # Utility modules
  wordpress/        # WordPress integration
  config/           # Site configuration files
    site.yaml       # Main site config
    navigation.yaml # Navigation structure
    citations.json  # Citation database
  content/          # Markdown content files
  templates/        # HTML templates
  static/           # Static assets (CSS, JS)
```

## Content Authoring

### Frontmatter Fields

Every content page begins with YAML frontmatter:

```yaml
---
title: "Page Title"           # Required
description: "Page summary"   # For meta tags and search
template: page                # Template name (default: page)
date: "2026-01-15"           # Publication date
updated: "2026-01-20"        # Last update
author: TibsFox              # Overrides site author
tags:                         # For search index
  - tag-one
  - tag-two
agent_visible: true           # Include in agent layer (default: true)
agent_priority: high          # high | medium | low
schema_type: Article          # Schema.org type
nav_section: essays           # Navigation section ID
nav_order: 0                  # Sort order within section
draft: true                   # Exclude from build
comments: true                # Enable WordPress comments
wp_post_id: 123               # WordPress post ID for comments
wp_sync: true                 # Sync to/from WordPress
---
```

### Templates Available

- `page` -- Standard content page with sidebar TOC (default)
- `home` -- Home page layout without TOC
- Custom templates placed in `templates/` are auto-discovered

### Citation Syntax

Single citation reference:

```markdown
This was demonstrated by [@knuth1997].
```

Multiple citations:

```markdown
Several authors agree [@knuth1997; @ritchie1974].
```

Citations are resolved against `config/citations.json` and rendered as superscript links to the bibliography.

### Internal Links

Use relative URLs for internal links:

```markdown
See the [About](/about/) page.
```

The build pipeline and audit runner verify all internal links resolve.

## Agent Discovery

The generator produces multiple discovery files for AI agents and LLMs:

### llms.txt

A curated index at `/llms.txt` following the emerging standard. Pages grouped by navigation section, sorted by priority.

### llms-full.txt

Complete site content at `/llms-full.txt` for full-corpus ingestion. Includes raw markdown for every agent-visible page. Size warning at 500KB.

### AGENTS.md

An agent guide at `/AGENTS.md` with usage instructions, content sections, key resources, and citation guidance.

### Schema.org JSON-LD

Every page includes structured data in `<script type="application/ld+json">` tags. Types mapped from `schema_type` frontmatter: Article, TechArticle, Book, Course, WebSite, WebPage. Breadcrumb lists generated from URL structure.

### Markdown Mirror

Raw markdown accessible at `/docs/{path}.md` for direct content access without HTML parsing.

## WordPress Integration

The generator coexists with a WordPress installation at `/wp/`. Three integration points:

### Comments

Pages with `comments: true` and `wp_post_id` get a vanilla JS comment widget (< 4KB). Comments load from the WordPress REST API with load-more pagination. No dependencies, works without JavaScript via noscript fallback link.

### Content Sync

Push markdown content to WordPress as posts:

```typescript
import { pushContent } from './wordpress';
await pushContent(pages, wpAdapter);
```

Pull WordPress content to markdown:

```typescript
import { pullContent } from './wordpress';
await pullContent(options, wpAdapter);
```

### HTML Conversion

WordPress HTML is converted to clean markdown via a hand-rolled converter (no library dependency). Handles paragraphs, headings, lists, links, images, code blocks, emphasis, blockquotes, and horizontal rules.

## Deployment

Two deployment methods via injectable adapter pattern:

### FTP

Configure in `site.yaml`:

```yaml
deploy:
  method: ftp
  host: ftp.example.com
  user: "${DEPLOY_USER}"
  path: /public_html
  exclude:
    - "*.map"
    - ".DS_Store"
```

### Rsync

```yaml
deploy:
  method: rsync
  host: example.com
  user: deploy
  path: /var/www/html
```

### Dry Run

Preview what would be uploaded without transferring files:

```typescript
import { dryRun } from './deploy';
const result = await dryRun(buildDir, config);
console.log(result.files); // List of files that would be uploaded
```

### Post-Deploy Verification

After deployment, verify key files are accessible:

```typescript
import { verifyDeployment } from './deploy';
const result = await verifyDeployment('https://example.com');
// result.indexOk, result.llmsTxtOk
```

## Configuration

### site.yaml

Main site configuration:

```yaml
title: tibsfox.com
description: "Educational resources and open knowledge"
url: https://tibsfox.com
author: TibsFox
language: en

agent:
  llms_txt: true        # Generate /llms.txt
  llms_full: true       # Generate /llms-full.txt
  agents_md: true       # Generate /AGENTS.md
  schema_org: true      # Generate JSON-LD per page
  markdown_mirror: true # Generate /docs/*.md mirror

wordpress:
  url: https://tibsfox.com/wp
  api: https://tibsfox.com/wp/wp-json/wp/v2
  comments_enabled: true
  comments_moderation: true

deploy:
  method: ftp
  host: ftp.tibsfox.com
  user: "${DEPLOY_USER}"
  path: /public_html
  exclude:
    - "*.map"
```

### navigation.yaml

Defines the site navigation structure:

```yaml
sections:
  - id: home
    label: Home
    items:
      - label: Home
        url: /
      - label: About
        url: /about/
  - id: essays
    label: Essays
    items:
      - label: The Space Between
        url: /essays/the-space-between/
```

Navigation sections are used for grouping pages in llms.txt and for template navigation rendering.

### citations.json

Citation database keyed by citation key:

```json
{
  "knuth1997": {
    "type": "book",
    "authors": ["Donald E. Knuth"],
    "title": "The Art of Computer Programming",
    "year": 1997,
    "publisher": "Addison-Wesley"
  }
}
```

Supported types: `book`, `article`, `web`. Fields: `authors`, `title`, `year`, `publisher`, `journal`, `volume`, `pages`, `doi`, `isbn`, `url`, `edition`.

## Design System

The site uses a minimal CSS design system with no framework dependency.

### CSS Custom Properties

```css
:root {
  --color-bg: #1a1a2e;
  --color-text: #e0e0e0;
  --color-accent: #00d4ff;
  --color-link: #64b5f6;
  --font-body: system-ui, sans-serif;
  --font-mono: 'Fira Code', monospace;
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 2rem;
}
```

### CSS Architecture

Four cascading layers:
1. **Reset** -- Normalize browser defaults
2. **Base** -- Typography, colors, spacing
3. **Components** -- BEM-named blocks (`.card`, `.nav`, `.toc`)
4. **Utilities** -- Helper classes (`.visually-hidden`, `.no-print`)

Dark mode is the default. Light mode via `prefers-color-scheme: light`.

### Templates

Templates use a custom Mustache-like engine supporting:

- **Interpolation**: `{{variable}}` (escaped), `{{{variable}}}` (raw)
- **Sections**: `{{#section}}...{{/section}}` for conditionals and iteration
- **Partials**: `{{>partial_name}}` for template composition
- **Dot notation**: `{{page.frontmatter.title}}`

The base template (`base.html`) provides the root HTML structure. Page variants (`page.html`, `home.html`) extend it by providing content slots.

## Quality Audit

Run the audit after building to verify quality constraints:

```typescript
import { runAudit } from './audit';

const result = await runAudit('build', { readFile, walkDir });
if (!result.passed) {
  for (const check of result.checks.filter(c => !c.passed)) {
    console.error(`FAIL: ${check.name} -- ${check.details}`);
  }
}
```

### Checks Performed

| Check | Threshold | Purpose |
|-------|-----------|---------|
| CSS size | < 15KB | Minimal stylesheet footprint |
| JS size | < 5KB total | No heavy client-side code |
| Link integrity | 0 broken | All internal links resolve |
| Schema validity | Valid JSON | Schema.org JSON-LD well-formed |
| Agent consistency | URLs match | llms.txt URLs in sitemap |
| Deterministic | Stable output | Same input produces same files |

## Testing

All modules use injectable I/O functions for complete testability without filesystem access:

```typescript
const options: BuildOptions = {
  contentDir: 'content',
  templateDir: 'templates',
  dataDir: 'data',
  staticDir: 'static',
  outputDir: 'build',
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  walkDir: mockWalkDir,
  ensureDir: mockEnsureDir,
  copyDir: mockCopyDir,
};
```

Run tests with vitest:

```bash
npx vitest run test/site/
```
