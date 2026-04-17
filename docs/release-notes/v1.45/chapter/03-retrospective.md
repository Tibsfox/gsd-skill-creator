# Retrospective — v1.45

## What Worked

- **Dual-audience architecture: human-readable HTML + AI-navigable discovery layers.** The same content serves both humans (HTML with CSS design system, dark/light/print modes) and AI agents (llms.txt, llms-full.txt, AGENTS.md, Schema.org JSON-LD, markdown mirror). This is forward-thinking -- sites will increasingly be consumed by both audiences.
- **Client-side search under 3KB JavaScript.** Keeping the search system small means no server dependencies, no API calls, and instant load. The index builder runs at build time; the client just reads the index.
- **7 page variants with shared partials (header, nav, footer).** The Mustache-style template engine with variables, sections, and partials avoids duplication while supporting different page layouts. This is the right abstraction for a static site with diverse content types.
- **WordPress integration via MCP for content sync.** Push/pull content sync means the static site and the WordPress site stay in sync without manual copy-paste. The comment widget bridges the gap between static content and dynamic interaction.

## What Could Be Better

- **243 tests across 87 files for a full static site generator is spread thin.** The pipeline spans markdown processing, template rendering, CSS generation, search indexing, citation resolution, agent discovery, WordPress sync, and FTP deployment. Each subsystem needs its own test depth.
- **FTP/rsync deployment is functional but fragile.** Dry-run and verification help, but deployment without a staging environment means the first real deployment is also the first production deployment.

## Lessons Learned

1. **Agent discovery layers (llms.txt, AGENTS.md, JSON-LD) are the sitemap.xml of the AI era.** Just as search engines need structured metadata to index sites, AI agents need structured discovery documents to navigate them. Building these into the static site generator makes them automatic, not afterthoughts.
2. **A custom static site generator is justified when the output requirements are non-standard.** Citation syntax, agent discovery layers, WordPress content sync, and progressive disclosure templates are not features available in off-the-shelf SSGs. The custom build cost is offset by exact-fit output.
3. **Quality audit (link checking, HTML validation, size checks, agent file consistency) at build time catches problems before deployment.** Running the audit as part of the build pipeline means broken links and invalid HTML never reach production.
4. **The site architecture documents the project's public face.** The 5-phase incremental migration plan from v1.34 now has a concrete implementation. The static site generator is the execution of that plan.
