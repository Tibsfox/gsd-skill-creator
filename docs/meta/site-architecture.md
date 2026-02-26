---
title: "Site Architecture"
layer: meta
path: "meta/site-architecture.md"
summary: "Custom www/ site structure replacing WordPress — URL scheme, docs/ mapping rules, redirect map, design requirements, and SSG evaluation."
cross_references:
  - path: "meta/index.md"
    relationship: "builds-on"
    description: "Part of meta-documentation"
  - path: "meta/content-pipeline.md"
    relationship: "parallel"
    description: "Content transformation pipeline that targets this architecture"
  - path: "meta/content-map.md"
    relationship: "builds-on"
    description: "Content inventory that informs URL structure"
  - path: "meta/filesystem-contracts.md"
    relationship: "builds-on"
    description: "File ownership contracts that govern docs/ source paths"
reading_levels:
  glance: "Specification for the custom www/ site structure replacing WordPress."
  scan:
    - "URL structure covering all existing tibsfox.com content areas"
    - "docs/ directory to URL mapping rules with internal-only exclusions"
    - "Redirect map for every existing WordPress and standalone URL"
    - "Design requirements: mobile-first, WCAG 2.1 AA, no tracking cookies"
    - "SSG evaluation recommending Astro with 11ty as alternative"
created_by_phase: "v1.34-331"
last_verified: "2026-02-26"
---

# Site Architecture

This document specifies the custom www/ site architecture that will replace the current WordPress
installation at tibsfox.com. It defines the URL structure, explains how docs/ paths map to
rendered URLs, provides a redirect map for all existing pages, sets design requirements, and
evaluates static site generator options. This is a blueprint. The actual build is a future
mission.

The architecture serves two audiences. Visitors get a coherent learning journey from
mathematical foundations through practical application. The build system gets clear, mechanical
rules for transforming docs/ markdown into static HTML.


## URL Structure

The site organizes content into five top-level sections. Each section corresponds to a
distinct purpose and audience need.

```text
tibsfox.com/                              Landing page
tibsfox.com/learn/                        Learning paths hub
tibsfox.com/learn/foundations/            Layer 1 — mathematical foundations
tibsfox.com/learn/principles/             Layer 2 — design principles
tibsfox.com/learn/framework/              Layer 3 — skill-creator framework
tibsfox.com/learn/applications/           Layer 4 — real-world applications
tibsfox.com/resources/                    Standalone resources hub
tibsfox.com/resources/the-space-between/  Book landing page
tibsfox.com/resources/skills-and-agents/  Skills-and-Agents report
tibsfox.com/resources/power-efficiency/   Global Power Efficiency Rankings
tibsfox.com/community/                    Community hub
tibsfox.com/about/                        About page
tibsfox.com/blog/                         Release chronicle
```

### Section Descriptions

**Landing page** (`/`) is the entry point for all visitors. It presents three paths into the
content — learn, build, and understand — corresponding to the narrative spine's three entry
points. The landing page is a custom template, not generated from docs/ markdown.

**Learn** (`/learn/`) is the primary content area, organized into four layers that follow the
educational progression from theory to practice. Each layer has an index page and a set of
content pages. The layer structure mirrors the docs/ directory hierarchy.

**Resources** (`/resources/`) houses standalone published artifacts that predate the docs/
ecosystem. These are the major works — The Space Between, the Skills-and-Agents Report, and
the Power Efficiency Rankings. Each gets a landing page that provides context and reading
guidance. The resources themselves are served directly (PDF for the book, HTML for the
interactive pages).

**Community** (`/community/`) covers contribution pathways, the skill exchange concept, and
community standards. This section will be populated during Phase 332 of the current milestone.

**About** (`/about/`) provides background on tibsfox, GSD, and skill-creator. It consolidates
the "who" and "why" into a single page.

**Blog** (`/blog/`) replaces the WordPress blog. Posts are markdown files organized by date.
The blog serves as a release chronicle documenting milestone completions and ecosystem
evolution.


## docs/ to URL Mapping Rules

These rules define how files in the docs/ directory map to URLs on the rendered site. The
mapping is mechanical — the build system applies these rules without human judgment.

### Standard Mappings

```yaml
mappings:
  - source: "docs/index.md"
    url: "/learn/"
    note: "Narrative spine becomes the learning hub"

  - source: "docs/foundations/*.md"
    url: "/learn/foundations/*"
    note: "Layer 1 content"

  - source: "docs/principles/*.md"
    url: "/learn/principles/*"
    note: "Layer 2 content"

  - source: "docs/framework/*.md"
    url: "/learn/framework/*"
    note: "Layer 3 top-level content"

  - source: "docs/framework/architecture/*.md"
    url: "/learn/framework/architecture/*"
    note: "Architecture subdirectory preserves nesting"

  - source: "docs/framework/getting-started.md"
    url: "/learn/framework/getting-started/"
    note: "Quick start guide"

  - source: "docs/framework/user-guides/*.md"
    url: "/learn/framework/user-guides/*"
    note: "User guide content"

  - source: "docs/framework/tutorials/*.md"
    url: "/learn/framework/tutorials/*"
    note: "Tutorial content"

  - source: "docs/framework/reference/*.md"
    url: "/learn/framework/reference/*"
    note: "API and CLI reference"

  - source: "docs/framework/developer-guide/*.md"
    url: "/learn/framework/developer-guide/*"
    note: "Developer guide content"

  - source: "docs/applications/*.md"
    url: "/learn/applications/*"
    note: "Layer 4 top-level content"

  - source: "docs/applications/case-studies/*.md"
    url: "/learn/applications/case-studies/*"
    note: "Case study content"

  - source: "docs/community/*.md"
    url: "/community/*"
    note: "Community content maps directly (no /learn/ prefix)"

  - source: "docs/about.md"
    url: "/about/"
    note: "About page maps directly"

  - source: "docs/templates/*.md"
    url: "/learn/framework/templates/*"
    note: "Templates rendered as reference under framework"
```

### Filename to URL Conversion

Source filenames convert to URL segments by these rules. The file extension is stripped.
`index.md` files become the directory index (trailing slash). Hyphens in filenames become
hyphens in URLs. All URLs use lowercase. Every rendered URL ends with a trailing slash for
consistency (except direct file serves like PDFs).

For example, `docs/foundations/mathematical-foundations.md` becomes
`/learn/foundations/mathematical-foundations/`.

### Internal-Only Exclusions

Some docs/ paths are never rendered to the public site. These are internal governance
documents that serve the documentation system itself.

```yaml
excluded:
  - pattern: "docs/meta/*.md"
    reason: "Internal meta-documentation — style guide, contracts, this architecture spec"

  - pattern: "docs/meta/**/*.md"
    reason: "All meta subdirectories are internal"
```

The `meta/` directory contains the style guide, filesystem contracts, content map, this site
architecture specification, the content pipeline specification, and the improvement cycle. These
documents govern how docs/ is written and maintained. They are not visitor-facing content.

### OpenStack and Specialized Content

The OpenStack curriculum and other specialized content produced by prior missions has its own
mapping considerations.

```yaml
specialized:
  - source: "docs/sysadmin-guide/*.md"
    url: "/learn/applications/openstack-cloud/sysadmin-guide/*"
    note: "OpenStack sysadmin guide nested under applications"

  - source: "docs/operations-manual/*.md"
    url: "/learn/applications/openstack-cloud/operations-manual/*"
    note: "OpenStack operations manual"

  - source: "docs/runbooks/*.md"
    url: "/learn/applications/openstack-cloud/runbooks/*"
    note: "OpenStack operational runbooks"

  - source: "docs/reference/nasa-se-mapping.md"
    url: "/learn/applications/openstack-cloud/reference/nasa-se-mapping/"
    note: "NASA SE mapping reference"

  - source: "docs/reference/openstack-cross-cloud.md"
    url: "/learn/applications/openstack-cloud/reference/cross-cloud/"
    note: "Cross-cloud reference"

  - source: "docs/reference/quick-reference-card.md"
    url: "/learn/applications/openstack-cloud/reference/quick-reference/"
    note: "Quick reference card"

  - source: "docs/vv/*.md"
    url: "/learn/applications/openstack-cloud/verification/*"
    note: "V&V procedures"
```


## Redirect Map

Every existing URL on tibsfox.com must continue to work after migration. This redirect map
covers all known pages. Redirects use HTTP 301 (permanent) to preserve search engine rankings
and prevent broken bookmarks.

### WordPress Skill-Creator Pages

```yaml
redirects:
  # Main skill-creator site
  - from: "/Tibsfox/gsd-skill-creator/"
    to: "/learn/framework/"
    type: 301

  - from: "/Tibsfox/gsd-skill-creator/docs/*"
    to: "/learn/framework/*"
    type: 301

  - from: "/Tibsfox/gsd-skill-creator/quick-start/"
    to: "/learn/framework/getting-started/"
    type: 301

  - from: "/Tibsfox/gsd-skill-creator/about/"
    to: "/about/"
    type: 301

  - from: "/Tibsfox/gsd-skill-creator/blog/"
    to: "/blog/"
    type: 301

  - from: "/Tibsfox/gsd-skill-creator/blog/*"
    to: "/blog/*"
    type: 301

  - from: "/Tibsfox/gsd-skill-creator/core-learning/"
    to: "/learn/framework/architecture/core-learning/"
    type: 301

  - from: "/Tibsfox/gsd-skill-creator/features/"
    to: "/learn/framework/features/"
    type: 301

  - from: "/Tibsfox/gsd-skill-creator/architecture/"
    to: "/learn/framework/architecture/"
    type: 301

  - from: "/Tibsfox/gsd-skill-creator/getting-started/"
    to: "/learn/framework/getting-started/"
    type: 301

  - from: "/Tibsfox/gsd-skill-creator/core-concepts/"
    to: "/learn/framework/core-concepts/"
    type: 301
```

### WordPress OpenStack Pages

```yaml
  # OpenStack curriculum subsite
  - from: "/Tibsfox/gsd-skill-creator/docs/specialized-systems/openstack-cloud/"
    to: "/learn/applications/openstack-cloud/"
    type: 301

  - from: "/Tibsfox/gsd-skill-creator/docs/specialized-systems/openstack-cloud/*"
    to: "/learn/applications/openstack-cloud/*"
    type: 301
```

### Standalone Resources

```yaml
  # Published resources at domain root
  - from: "/Skills-and-Agents/"
    to: "/resources/skills-and-agents/"
    type: 301

  - from: "/Skills-and-Agents"
    to: "/resources/skills-and-agents/"
    type: 301

  - from: "/Global-Power-Efficiency-Rankings.html"
    to: "/resources/power-efficiency/"
    type: 301

  - from: "/media/The_Space_Between.pdf"
    to: "/resources/the-space-between/pdf"
    type: 301
    note: "Direct PDF serve — no HTML wrapper"
```

### WordPress Infrastructure

```yaml
  # WordPress infrastructure pages that should redirect or return 410
  - from: "/wp-admin/*"
    to: null
    type: 410
    note: "Gone — WordPress admin no longer exists"

  - from: "/wp-content/*"
    to: null
    type: 410
    note: "Gone — WordPress content directory removed"

  - from: "/wp-login.php"
    to: null
    type: 410
    note: "Gone — no login page on static site"

  - from: "/feed/"
    to: "/blog/"
    type: 301
    note: "RSS feed redirects to blog; future: generate RSS from blog posts"

  - from: "/xmlrpc.php"
    to: null
    type: 410
    note: "Gone — XML-RPC endpoint removed"

  - from: "/wp-json/*"
    to: null
    type: 410
    note: "Gone — WordPress REST API removed"
```

### Catch-All

```yaml
  # Catch-all for unmatched WordPress paths
  - from: "/Tibsfox/gsd-skill-creator/**"
    to: "/learn/framework/"
    type: 301
    note: "Any unmatched subpage redirects to framework index"
```


## Design Requirements

The site design must meet these requirements. They are non-negotiable constraints, not
aspirational goals.

### Responsive Layout

The site uses a mobile-first design approach. Content is readable on screens from 320 pixels
wide to ultrawide monitors. The layout uses a single-column reading pane for content pages with
a collapsible side navigation. On screens wider than 1024 pixels, the side navigation is
visible by default. On narrower screens, it collapses behind a menu toggle.

The maximum content width is 72 characters for prose and 90 characters for code blocks.
Line length within this range is optimal for reading comprehension. Content does not stretch
to fill the viewport on wide screens.

### Accessibility

The site meets WCAG 2.1 AA compliance as a minimum. This includes:

- **Color contrast:** All text meets 4.5:1 contrast ratio against its background (3:1 for
  large text). Both the default theme and the Amiga Workbench palette meet these ratios.
- **Keyboard navigation:** All interactive elements are reachable and operable via keyboard.
  Focus indicators are visible and follow a logical tab order.
- **Screen reader support:** Semantic HTML5 elements (`nav`, `main`, `article`, `aside`,
  `header`, `footer`). All images have alt text. ARIA labels where semantic HTML is
  insufficient.
- **Motion:** No auto-playing animations. Respects `prefers-reduced-motion` media query.
- **Text sizing:** Content remains readable when browser text size is increased to 200%.

### Performance

Content pages are static HTML. No client-side JavaScript is required to read documentation.
JavaScript is permitted only for interactive features (search, navigation toggles, theme
switching) and loads as progressive enhancement — the page is readable before JavaScript
executes.

Target performance budgets:

- **First Contentful Paint:** under 1.5 seconds on 3G connection
- **Total page weight:** under 100 KB for a content page (excluding images)
- **Time to Interactive:** under 3 seconds on 3G connection

### Visual Identity

The site has two theme modes and the user chooses between them.

**Default theme** is clean, modern, and typographically focused. A neutral color palette with
a single accent color for links and interactive elements. The typeface is a system font stack
for performance: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`. Code
blocks use a monospace system font stack.

**Amiga Workbench theme** draws from the GSD-OS aesthetic. It uses the Workbench 1.x color
palette: blue (#0055AA), white (#FFFFFF), black (#000000), and orange (#FF8800). Window
chrome, beveled edges, and the distinct Workbench look. This theme is an homage, not a
gimmick — it applies the palette and visual language while maintaining readability and
accessibility standards.

Both themes support a dark mode variant. The theme and mode preferences persist via
`localStorage` (not cookies).

### Privacy

The site uses no tracking cookies. No third-party analytics scripts load by default. If
analytics are added in the future, they must be opt-in with a clear, non-intrusive prompt.
The site does not set any cookies for content browsing. The only `localStorage` usage is for
theme preference (theme name and light/dark mode).


## Static Site Generator Evaluation

Three options were evaluated for the docs/ to www/ build pipeline. The evaluation considers
alignment with the docs/ structure, developer experience, ecosystem maturity, and long-term
maintenance burden.

### Astro (Recommended)

Astro is a content-focused web framework that treats markdown as a first-class content source.
It generates static HTML by default and supports component islands for interactive features
that need client-side JavaScript.

**Alignment with docs/:** Astro's content collections map directly to the docs/ directory
structure. Frontmatter is extracted and typed automatically. Markdown rendering uses remark and
rehype plugins, which provide the cross-reference link resolution and navigation generation
described in the [Content Pipeline](meta/content-pipeline.md).

**Strengths:**

- Markdown-first architecture matches docs/ perfectly
- Content collections provide typed frontmatter validation at build time
- Component islands allow interactive features (search, theme toggle) without shipping
  JavaScript to static content pages
- Built-in image optimization
- Active ecosystem with maintained plugins for sitemaps, RSS, and search

**Concerns:**

- Younger ecosystem than 11ty (Astro 1.0 shipped in 2022)
- Some plugin churn between major versions

**Verdict:** Preferred choice. The content collections feature alone makes it the strongest
fit for a docs/-driven site.

### 11ty / Eleventy (Strong Alternative)

Eleventy is a simpler, more flexible static site generator. It supports multiple template
languages and gives the developer maximum control over the output.

**Alignment with docs/:** Eleventy can consume markdown with frontmatter and generate the
required URL structure. It requires more manual configuration than Astro for things like
content type validation and navigation generation.

**Strengths:**

- Extremely fast build times
- Zero client-side JavaScript by default
- Mature ecosystem (v1.0 shipped in 2018, v3.0 stable)
- Maximum flexibility in template and output structure

**Concerns:**

- Less opinionated means more manual work for content collections, navigation, and
  cross-reference resolution
- Template language fragmentation (Nunjucks, Liquid, JavaScript) can be confusing

**Verdict:** Strong alternative. Choose 11ty if Astro's ecosystem proves unstable or if the
project needs finer-grained control over the HTML output.

### Custom (Tauri-Based, Future Consideration)

A custom static site generator built on the existing Tauri and TypeScript infrastructure.
Full control, full alignment with the GSD-OS tech stack.

**Alignment with docs/:** Perfect by definition — built specifically for this content
structure.

**Strengths:**

- Complete control over every aspect of the build
- Aligns with the project's existing TypeScript and Rust tooling
- Could integrate directly with skill-creator's observation pipeline

**Concerns:**

- Significant development and maintenance burden
- Reinvents solved problems (markdown rendering, asset pipeline, dev server)
- Diverts effort from content to infrastructure

**Verdict:** Future consideration only. Building a custom SSG is justified only if the
project's needs diverge significantly from what Astro or 11ty provide. The custom option
becomes more attractive if the site needs deep integration with the GSD-OS desktop
application or skill-creator's runtime.

### Recommendation

Start with Astro. Its content collections, island architecture, and markdown-first approach
align directly with the docs/ structure and the progressive enhancement requirements. If
Astro proves problematic during the build mission, fall back to 11ty. Reserve the custom
option for a future milestone when (or if) deep GSD-OS integration becomes a requirement.
