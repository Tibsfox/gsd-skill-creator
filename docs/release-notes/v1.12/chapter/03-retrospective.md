# Retrospective — v1.12

## What Worked

- **Static HTML with embedded CSS and no external dependencies works from `file://` protocol.** No server needed, no CDN, no build step for viewing. This constraint (which becomes the PNW browser architecture pattern) ensures the dashboard works anywhere.
- **JSON-LD and Open Graph meta tags on planning documents is forward-thinking.** Schema.org SoftwareSourceCode metadata makes the project machine-readable before there's a public website to serve it from.
- **Incremental builds via SHA-256 content hashing avoid regenerating unchanged pages.** The `.dashboard-manifest.json` build manifest tracks what needs rebuilding, keeping generation fast as the number of pages grows.

## What Could Be Better

- **Auto-refresh with 3-second default interval could be expensive for large `.planning/` directories.** Polling every 3 seconds recalculates hashes even when nothing has changed. File system watch events would be more efficient but harder to implement portably.
- **239 tests across 11 test files and 81% branch coverage leaves 19% uncovered.** For a dashboard that renders HTML from planning artifacts, the uncovered branches likely include edge cases in markdown parsing that could produce broken output.

## Lessons Learned

1. **The `file://` protocol constraint forces good architecture.** No runtime dependencies, no CORS, no server -- just HTML/CSS/JS that opens in any browser. This becomes the foundation for all subsequent browser-based tools.
2. **Mirroring `.planning/` artifacts into browsable HTML creates a read-only view of project state.** The planning files remain the source of truth; the dashboard is a derived view. This separation means the dashboard can never corrupt planning data.
3. **Dark theme with consistent layout across all pages establishes a visual identity early.** The dashboard pages look like they belong together, which matters when they'll be extended in v1.12.1, v1.15, and beyond.

---
