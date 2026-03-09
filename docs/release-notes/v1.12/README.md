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

## Retrospective

### What Worked
- **Static HTML with embedded CSS and no external dependencies works from `file://` protocol.** No server needed, no CDN, no build step for viewing. This constraint (which becomes the PNW browser architecture pattern) ensures the dashboard works anywhere.
- **JSON-LD and Open Graph meta tags on planning documents is forward-thinking.** Schema.org SoftwareSourceCode metadata makes the project machine-readable before there's a public website to serve it from.
- **Incremental builds via SHA-256 content hashing avoid regenerating unchanged pages.** The `.dashboard-manifest.json` build manifest tracks what needs rebuilding, keeping generation fast as the number of pages grows.

### What Could Be Better
- **Auto-refresh with 3-second default interval could be expensive for large `.planning/` directories.** Polling every 3 seconds recalculates hashes even when nothing has changed. File system watch events would be more efficient but harder to implement portably.
- **239 tests across 11 test files and 81% branch coverage leaves 19% uncovered.** For a dashboard that renders HTML from planning artifacts, the uncovered branches likely include edge cases in markdown parsing that could produce broken output.

## Lessons Learned

1. **The `file://` protocol constraint forces good architecture.** No runtime dependencies, no CORS, no server -- just HTML/CSS/JS that opens in any browser. This becomes the foundation for all subsequent browser-based tools.
2. **Mirroring `.planning/` artifacts into browsable HTML creates a read-only view of project state.** The planning files remain the source of truth; the dashboard is a derived view. This separation means the dashboard can never corrupt planning data.
3. **Dark theme with consistent layout across all pages establishes a visual identity early.** The dashboard pages look like they belong together, which matters when they'll be extended in v1.12.1, v1.15, and beyond.

---
