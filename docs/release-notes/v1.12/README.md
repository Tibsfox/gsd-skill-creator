# v1.12 — GSD Planning Docs Dashboard

**Shipped:** 2026-02-12
**Phases:** 88-93 (6 phases) | **Plans:** 7 | **Requirements:** 30

A living documentation system that mirrors `.planning/` artifacts into browsable, machine-readable HTML -- hot during sessions, static at rest.

### Key Features

**Generator Core:**
- Markdown parser reads `.planning/` artifacts (PROJECT, REQUIREMENTS, ROADMAP, STATE, MILESTONES)
- HTML renderer with embedded CSS (no external dependencies, works from `file://`)
- Dark theme with consistent layout across all pages

**Dashboard Pages:**
- **Index:** Aggregated project health, milestone progress, build log
- **Requirements:** REQ-ID badges, status indicators, cross-navigation
- **Roadmap:** Phase status visualization (pending/active/complete)
- **Milestones:** Rich timeline with expandable details
- **State:** Current position, blockers, session continuity info

**Structured Data & SEO:**
- JSON-LD (Schema.org SoftwareSourceCode, ItemList) on all pages
- Open Graph meta tags (`og:title`, `og:description`, `og:type`)
- Semantic HTML5 throughout

**Incremental Builds & Live Mode:**
- SHA-256 content hashing with `.dashboard-manifest.json` build manifest
- Auto-refresh with scroll position preservation via sessionStorage
- Visual refresh indicator, configurable interval (default 3s)

**GSD Integration:**
- Slash command (`/gsd-dashboard`) with generate/watch/clean subcommands
- Auto-generates on phase transitions when integration config enables it

### Test Coverage

- 239 tests across 11 test files, 81% branch coverage
- Integration test validates full pipeline with fixture data

---
