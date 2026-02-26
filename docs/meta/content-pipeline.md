---
title: "Content Pipeline"
layer: meta
path: "meta/content-pipeline.md"
summary: "Specification for transforming docs/ markdown into rendered www/ pages — build process, link resolution, navigation generation, frontmatter consumption, and migration phases."
cross_references:
  - path: "meta/index.md"
    relationship: "builds-on"
    description: "Part of meta-documentation"
  - path: "meta/site-architecture.md"
    relationship: "parallel"
    description: "Site structure that this pipeline targets"
  - path: "meta/style-guide.md"
    relationship: "builds-on"
    description: "Frontmatter schema and writing standards consumed by this pipeline"
  - path: "meta/filesystem-contracts.md"
    relationship: "builds-on"
    description: "File ownership contracts that validate source integrity"
reading_levels:
  glance: "Specification for transforming docs/ markdown into the www/ presentation layer."
  scan:
    - "Six-stage build process from markdown to deployed static HTML"
    - "Cross-reference link resolution with broken link detection at build time"
    - "Navigation generation from directory structure — top nav, side nav, breadcrumbs"
    - "Frontmatter field consumption mapping each field to rendered output"
    - "Five-phase WordPress migration with no downtime"
created_by_phase: "v1.34-331"
last_verified: "2026-02-26"
---

# Content Pipeline

This document specifies how docs/ markdown is transformed into the rendered www/ presentation
layer. It covers the build process stages, cross-reference link resolution, navigation
generation, frontmatter consumption, and the incremental migration from WordPress. Every rule
here is mechanical — the build system applies them without human judgment.

The pipeline takes version-controlled markdown as input and produces static HTML as output. The
transformation is deterministic: the same docs/ state always produces the same site. This
property makes the build reproducible, testable, and auditable.


## Build Process

The pipeline has six stages. Each stage takes the output of the previous stage as input. A
failure at any stage halts the build and reports the error. No partial builds are deployed.

### Stage 1: Source Collection

The build system reads all markdown files from docs/ and classifies them using the mapping
rules defined in the [Site Architecture](meta/site-architecture.md). Files matching the
`excluded` patterns (the `meta/` directory) are skipped. All other files are collected into
a source manifest with their target URLs.

```text
Input:  docs/**/*.md
Output: Source manifest (file path, target URL, frontmatter)
Errors: Missing files referenced in filesystem contracts
```

### Stage 2: Frontmatter Extraction

Each collected file's YAML frontmatter is parsed and validated against the schema defined in
the [Style Guide](meta/style-guide.md). Required fields (`title`, `layer`, `path`, `summary`,
`created_by_phase`, `last_verified`) must be present and non-empty. The `path` field must match
the file's actual path relative to docs/. The `layer` field must be one of the valid values.

```text
Input:  Source manifest with raw file contents
Output: Structured metadata per file (typed frontmatter objects)
Errors: Missing required fields, invalid layer values, path mismatch
```

Validation failures produce clear error messages identifying the file, the field, and the
expected value. The build fails on any validation error — malformed frontmatter is never
silently accepted.

### Stage 3: Markdown Rendering

Markdown content (everything after the frontmatter fence) is rendered to HTML. The renderer
uses remark for markdown parsing and rehype for HTML transformation. This stage applies the
cross-reference link resolution described in the next section.

```text
Input:  Structured metadata + markdown content
Output: HTML content fragments (not full pages)
Errors: Broken internal links, invalid markdown syntax
```

The renderer supports all standard markdown features plus:

- Fenced code blocks with language identifiers (syntax highlighting applied via CSS classes)
- Tables with alignment
- Footnotes
- Definition lists
- Custom containers for admonitions (note, warning, tip)

### Stage 4: Navigation Generation

The navigation structure is computed from the source manifest and directory hierarchy. This
stage produces the data structures that templates consume for rendering top navigation, side
navigation, breadcrumbs, and related-content sections. The details are specified in the
Navigation Generation section below.

```text
Input:  Source manifest with metadata
Output: Navigation data structures (top nav, side nav tree, breadcrumbs, related links)
Errors: Orphaned pages (no navigation path to reach them)
```

### Stage 5: Template Application

Each HTML content fragment is inserted into a page template. Templates are selected by section
and content type. The template receives the content fragment, frontmatter metadata, and
navigation data structures.

```text
Input:  HTML content, metadata, navigation data
Output: Complete HTML pages
Errors: Missing template for content type
```

Template selection follows these rules:

```yaml
templates:
  - match: "/"
    template: "landing.html"
    note: "Custom landing page — not from docs/"

  - match: "/learn/**"
    template: "content.html"
    note: "Standard content page with side navigation"

  - match: "/learn/*/index"
    template: "layer-hub.html"
    note: "Layer index pages with card layout"

  - match: "/resources/**"
    template: "resource.html"
    note: "Resource landing page"

  - match: "/community/**"
    template: "content.html"
    note: "Same layout as learn content"

  - match: "/about/"
    template: "page.html"
    note: "Standalone page without side navigation"

  - match: "/blog/**"
    template: "blog-post.html"
    note: "Blog post with date and navigation"

  - match: "/blog/"
    template: "blog-index.html"
    note: "Reverse-chronological post listing"
```

### Stage 6: Output and Deployment

Complete HTML pages are written to `www/build/` along with static assets (CSS, JavaScript,
images, fonts). The output directory structure mirrors the URL structure — every URL becomes a
directory containing an `index.html` file. Static assets are fingerprinted (content hash in
filename) for cache busting.

```text
Input:  Complete HTML pages + static assets
Output: www/build/ directory ready for deployment
Errors: Write failures, asset reference mismatches
```

Deployment copies `www/build/` to the hosting provider. The deployment mechanism depends on
the hosting choice (static file hosting, CDN, or server). The pipeline does not prescribe a
specific hosting provider — it produces a directory of static files that any web server can
serve.


## Cross-Reference Link Resolution

Internal links in docs/ use relative paths from the docs/ root directory, as defined in the
[Style Guide](meta/style-guide.md#cross-references). The build pipeline resolves these paths
to rendered site URLs during Stage 3 (Markdown Rendering).

### Resolution Rules

The resolver transforms internal markdown links by applying the docs/ to URL mapping rules
from the [Site Architecture](meta/site-architecture.md).

```text
[Display Text](foundations/mathematical-foundations.md)
  resolves to:
<a href="/learn/foundations/mathematical-foundations/">Display Text</a>
```

Section anchors are preserved through resolution:

```text
[Frontmatter Schema](meta/style-guide.md#frontmatter-schema)
  resolves to:
Link removed — meta/ documents are excluded from rendering
  → Build warning: link to internal-only document
```

Links to excluded paths (such as `meta/` documents) are handled according to context. In
rendered content, they are removed and replaced with the display text (no link). The build
emits a warning so authors can decide whether the cross-reference should be rewritten to
point to rendered content instead.

### External Link Handling

Links to external URLs (starting with `http://` or `https://`) are preserved as-is. Links to
tibsfox.com URLs are checked against the redirect map — if a link points to a URL that will
be redirected, the build emits a warning suggesting the link be updated to the new URL.

### Broken Link Detection

The build fails on broken internal links. A link is broken if:

- The target path does not exist in the source manifest
- The target path exists but is excluded from rendering and the link appears in rendered content
- The target section anchor does not exist in the resolved document

Broken link errors identify the source file, line number, target path, and the nature of the
failure. This detection runs during Stage 3 and prevents deploying a site with dead links.

### Cross-Reference Bidirectionality

The frontmatter `cross_references` field creates machine-readable relationships between
documents. The pipeline uses these to generate "Related" sections at the bottom of rendered
pages. Relationships are treated as bidirectional for navigation purposes — if document A
lists document B as a cross-reference, document B's rendered page includes a link back to
document A in its "Related" section, even if B does not explicitly list A in its frontmatter.

The build system computes these bidirectional links during Stage 4 (Navigation Generation)
by scanning all frontmatter cross-references and building an adjacency map.


## Navigation Generation

Navigation is computed from the source manifest and frontmatter metadata. The pipeline
generates four navigation structures, each serving a different orientation need.

### Top Navigation

The top-level navigation bar appears on every page. It contains five fixed entries:

```text
Learn | Resources | Community | About | Blog
```

These entries correspond to the top-level URL sections. The current section is highlighted
based on the page's URL prefix. The top navigation does not change based on content — it is
static structure.

### Side Navigation

The side navigation appears on content pages within the `/learn/` and `/community/` sections.
It displays the directory tree for the current section, with the current page highlighted and
its siblings visible.

The side navigation tree is generated from the directory structure:

```text
/learn/framework/
  Getting Started
  Core Concepts
  Features
  Architecture/
    Overview
    Core Learning
  User Guides/
  Tutorials/
  Reference/
  Developer Guide/
  Templates/
    Educational Pack
    Career Pathway
    AI Learning Prompt
    Mission Retrospective
```

Entries use the `title` field from each document's frontmatter as the display label. Directory
order follows alphabetical sorting by filename unless a future `sort_order` frontmatter field
is added. Index files (`index.md`) represent their parent directory and are not listed
separately — clicking the directory name navigates to the index.

Placeholder documents (those with only the italic "Content will be added" line) are included
in the navigation but styled distinctly (muted text, no link) to indicate upcoming content
without creating dead links.

### Breadcrumbs

Breadcrumbs appear at the top of every content page. They trace the path from the site root
to the current page.

```text
Home > Learn > Framework > Architecture > Core Learning
```

Each segment is a link to the corresponding index page. The final segment (current page) is
not a link. Breadcrumb labels use the same `title` frontmatter field as the side navigation.

### Related Sections

At the bottom of each content page, a "Related" section lists documents that are connected
to the current page. The connections come from two sources:

**Frontmatter cross-references:** Documents explicitly listed in the `cross_references`
field, plus documents that reference the current page (bidirectional links from the adjacency
map).

**Layer siblings:** Other documents in the same directory, excluding the current page.
These are listed under a "See also in this section" subheading.

Each related entry displays the document title, its `reading_levels.glance` text (if
available), and the relationship type for frontmatter cross-references.


## Frontmatter Consumption

Each frontmatter field defined in the [Style Guide](meta/style-guide.md#frontmatter-schema)
maps to one or more rendered outputs. This section specifies those mappings.

### Required Fields

**`title`** renders in four locations: the HTML `<title>` element (suffixed with
" | tibsfox.com"), the `<h1>` heading on the page, the side navigation label, and Open Graph
/ social card metadata.

**`layer`** determines the visual accent color applied to the page. Each layer has a distinct
accent:

```yaml
layer_accents:
  foundations: "#2E86AB"    # Blue — mathematical depth
  principles: "#A23B72"    # Purple — design thinking
  framework: "#F18F01"     # Orange — practical building
  applications: "#C73E1D"  # Red — real-world impact
  community: "#3B7A57"     # Green — growth and contribution
  templates: "#666666"     # Gray — structural scaffolding
```

The accent color appears in the side navigation highlight, the breadcrumb separator, heading
underlines, and link hover states. In the Amiga Workbench theme, layer accents are mapped to
the nearest Workbench palette color.

**`summary`** renders as the HTML meta description tag and as the card preview text when the
page appears in search results, social media shares, or the site's own navigation cards.

**`path`** is consumed by the link resolver and breadcrumb generator. It is not rendered
directly but enables the build system to validate file locations and compute navigation paths.

**`created_by_phase`** is rendered in a small footer note on each page: "Created in Phase
v1.34-NNN". This provides traceability without cluttering the reading experience.

**`last_verified`** is rendered alongside the phase reference: "Last verified: 26 February
2026". Stale documents (where `last_verified` is more than 180 days old) display a subtle
banner: "This page has not been reviewed recently. Some information may be outdated."

### Optional Fields

**`cross_references`** drives the "Related" section at the bottom of each page, as described
in the Navigation Generation section.

**`reading_levels.glance`** provides the card preview text used in hub pages and "Related"
sections. If not present, the `summary` field is used instead.

**`reading_levels.scan`** is not rendered directly on content pages. It is used by hub pages
(`layer-hub.html` template) to display key points beneath the card title, giving visitors a
quick overview before clicking through.


## Migration Phases

The migration from WordPress to the custom static site proceeds in five phases. Each phase
is self-contained — the site works correctly at the end of each phase. At no point does
tibsfox.com go dark.

### Phase M1: Parallel Build

Build the custom static site alongside the existing WordPress installation. Deploy it to a
separate domain or subdomain (such as `next.tibsfox.com`) for testing and review.

**Prerequisites:** SSG selected (Astro recommended), templates built, docs/ content complete
for layers 1-4.

**Deliverables:**

- Astro project in `www/` directory with content collections consuming docs/
- All templates (landing, content, layer-hub, resource, blog-post, blog-index, page)
- CSS with both default and Amiga Workbench themes
- Build script producing `www/build/`
- Deployment to test domain

**Verification:** All docs/ pages render correctly. Navigation works. Links resolve. Both
themes pass WCAG 2.1 AA color contrast checks. Performance budgets met.

**Duration estimate:** One mission (one milestone).

### Phase M2: Migrate Landing and /learn/

Point the main tibsfox.com domain to the custom site for the landing page and all `/learn/`
paths. WordPress continues to serve `/Tibsfox/`, `/Skills-and-Agents/`, and other existing
paths.

**Prerequisites:** M1 complete and verified. DNS supports path-based routing (or reverse
proxy configured).

**Deliverables:**

- DNS or reverse proxy configuration routing `/` and `/learn/*` to the static site
- WordPress configured to not serve conflicting paths
- Redirect rules for `/Tibsfox/gsd-skill-creator/*` pointing to `/learn/framework/*`

**Verification:** Landing page and all learn paths serve from the static site. WordPress paths
still work. Redirects return 301 responses. No mixed-content warnings.

### Phase M3: Migrate /resources/

Move the standalone resource pages (The Space Between, Skills-and-Agents Report, Power
Efficiency Rankings) to the new site. The existing HTML for interactive pages is preserved
or enhanced — not rewritten.

**Prerequisites:** M2 stable for at least two weeks.

**Deliverables:**

- Resource landing pages (`/resources/the-space-between/`, `/resources/skills-and-agents/`,
  `/resources/power-efficiency/`)
- PDF serve at `/resources/the-space-between/pdf`
- Existing interactive HTML integrated into the new site's template and navigation
- Redirects from old URLs (`/Skills-and-Agents/`, `/Global-Power-Efficiency-Rankings.html`,
  `/media/The_Space_Between.pdf`)

**Verification:** All resource pages accessible at new URLs. Old URLs redirect correctly.
Interactive features on Power Efficiency Rankings and Skills-and-Agents Report function
without regression.

### Phase M4: Migrate /blog/

Move the WordPress blog to the static site. Blog posts are converted to markdown files in a
`blog/` directory. The blog index displays posts in reverse chronological order.

**Prerequisites:** M3 stable.

**Deliverables:**

- Blog posts as markdown in `blog/` directory
- Blog index page with reverse-chronological listing
- RSS feed at `/blog/feed.xml` (generated from blog post frontmatter)
- Redirects from WordPress blog URLs to new paths

**Verification:** All blog posts accessible. RSS feed validates. Old blog URLs redirect.

### Phase M5: Decommission WordPress

Remove WordPress entirely. All remaining redirects are configured at the web server or CDN
level. DNS points exclusively to the static site hosting.

**Prerequisites:** M4 stable for at least two weeks. All redirects verified. Search engine
re-indexing confirmed (old URLs no longer appear in search results, or redirect correctly
when clicked).

**Deliverables:**

- WordPress installation archived (database dump, file backup) and taken offline
- All redirect rules consolidated into web server configuration
- WordPress infrastructure (PHP, MySQL) decommissioned
- DNS simplified to point to static hosting only

**Verification:** Every URL from the redirect map returns the expected response (301 to new
location, 410 for removed WordPress infrastructure, 200 for new pages). No 404 errors for
any previously valid URL. Site performance meets all budgets without the WordPress backend.

### Migration Timeline

The five phases are designed to be executed across multiple milestones. Each phase is a
natural milestone boundary. The pace depends on content readiness and comfort with the new
system.

```text
M1 (Build)       → One milestone, no user-facing changes
M2 (Learn)       → One milestone, first visible migration
M3 (Resources)   → Can be combined with M2 if confident
M4 (Blog)        → One milestone, lowest risk
M5 (Decommission)→ Final milestone, cleanup
```

The total timeline is estimated at three to five milestones from the start of M1. The
conservative path runs each phase as its own milestone with a stabilization period between
phases. The aggressive path combines M2 and M3, bringing the total to three milestones.
