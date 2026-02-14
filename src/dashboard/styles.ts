/**
 * Embedded CSS for the GSD Planning Docs Dashboard.
 *
 * Dark theme inspired by GitHub dark mode.  All styles are returned
 * as a template-literal string — no external dependencies, no imports.
 * Pages work when opened directly via file:// protocol.
 */

import { renderDesignSystem } from './design-system.js';

/**
 * Return the full CSS stylesheet as a string.
 */
export function renderStyles(): string {
  return `${renderDesignSystem()}
/* -----------------------------------------------------------------------
   CSS Custom Properties — Dark Theme
   ----------------------------------------------------------------------- */

:root {
  /* Backgrounds */
  --bg: #0d1117;
  --surface: #161b22;
  --surface-raised: #1c2128;

  /* Borders */
  --border: #30363d;
  --border-muted: #21262d;

  /* Text */
  --text: #e6edf3;
  --text-muted: #8b949e;
  --text-dim: #484f58;

  /* Accent colors */
  --accent: #58a6ff;
  --accent-muted: #388bfd26;
  --green: #3fb950;
  --green-muted: #23863626;
  --yellow: #d29922;
  --yellow-muted: #bb800926;
  --red: #f85149;
  --red-muted: #f8514926;
  --purple: #bc8cff;

  /* Typography */
  --font-sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;

  /* Borders & Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;

  /* Layout */
  --max-width: 1200px;
  --sidebar-width: 220px;
}

/* -----------------------------------------------------------------------
   Reset & Base
   ----------------------------------------------------------------------- */

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* -----------------------------------------------------------------------
   Layout
   ----------------------------------------------------------------------- */

header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: var(--space-md) var(--space-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  text-decoration: none;
}

.header-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-left: var(--space-sm);
}

.page-wrapper {
  display: flex;
  flex: 1;
  max-width: var(--max-width);
  margin: 0 auto;
  width: 100%;
  padding: var(--space-xl);
  gap: var(--space-xl);
}

main {
  flex: 1;
  min-width: 0;
}

footer {
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: var(--space-md) var(--space-xl);
  text-align: center;
  color: var(--text-muted);
  font-size: 0.8rem;
  margin-top: auto;
}

/* -----------------------------------------------------------------------
   Navigation
   ----------------------------------------------------------------------- */

nav {
  min-width: var(--sidebar-width);
}

.nav-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  position: sticky;
  top: 80px;
}

.nav-link {
  display: block;
  padding: var(--space-sm) var(--space-md);
  color: var(--text-muted);
  text-decoration: none;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  transition: background 0.15s, color 0.15s;
}

.nav-link:hover {
  background: var(--surface);
  color: var(--text);
}

.nav-link.active {
  background: var(--accent-muted);
  color: var(--accent);
  font-weight: 600;
}

/* -----------------------------------------------------------------------
   Stats Grid
   ----------------------------------------------------------------------- */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: var(--space-xs);
}

/* -----------------------------------------------------------------------
   Cards
   ----------------------------------------------------------------------- */

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-md);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
}

.card-body {
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.7;
}

/* -----------------------------------------------------------------------
   Tables
   ----------------------------------------------------------------------- */

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: var(--space-lg);
  font-size: 0.9rem;
}

th {
  text-align: left;
  padding: var(--space-sm) var(--space-md);
  border-bottom: 2px solid var(--border);
  color: var(--text);
  font-weight: 600;
  white-space: nowrap;
}

td {
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border-muted);
  color: var(--text-muted);
}

tr:hover td {
  background: var(--surface-raised);
}

/* -----------------------------------------------------------------------
   Status Badges
   ----------------------------------------------------------------------- */

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.badge-active {
  background: var(--green-muted);
  color: var(--green);
}

.badge-pending {
  background: var(--yellow-muted);
  color: var(--yellow);
}

.badge-complete {
  background: var(--accent-muted);
  color: var(--accent);
}

.badge-blocked {
  background: var(--red-muted);
  color: var(--red);
}

/* -----------------------------------------------------------------------
   Timeline
   ----------------------------------------------------------------------- */

.timeline {
  position: relative;
  padding-left: var(--space-xl);
}

.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--border);
}

.timeline-item {
  position: relative;
  margin-bottom: var(--space-lg);
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: calc(-1 * var(--space-xl) + 4px);
  top: 6px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--border);
  border: 2px solid var(--bg);
}

.timeline-item.active::before {
  background: var(--green);
}

.timeline-item.complete::before {
  background: var(--accent);
}

.timeline-title {
  font-weight: 600;
  color: var(--text);
  margin-bottom: var(--space-xs);
}

.timeline-meta {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.timeline-body {
  margin-top: var(--space-sm);
  font-size: 0.9rem;
  color: var(--text-muted);
}

/* -----------------------------------------------------------------------
   Progress Bar
   ----------------------------------------------------------------------- */

.progress-bar {
  background: var(--border-muted);
  border-radius: var(--radius-sm);
  height: 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-sm);
  background: var(--accent);
  transition: width 0.3s ease;
}

.progress-fill.success {
  background: var(--green);
}

/* -----------------------------------------------------------------------
   Code Blocks
   ----------------------------------------------------------------------- */

pre {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  overflow-x: auto;
  font-size: 0.85rem;
  line-height: 1.5;
  margin-bottom: var(--space-md);
}

code {
  font-family: var(--font-mono);
  font-size: 0.85em;
}

:not(pre) > code {
  background: var(--surface-raised);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  color: var(--accent);
}

/* -----------------------------------------------------------------------
   Lists
   ----------------------------------------------------------------------- */

.list-styled {
  list-style: none;
  padding: 0;
}

.list-styled li {
  position: relative;
  padding: var(--space-sm) 0 var(--space-sm) var(--space-lg);
  border-bottom: 1px solid var(--border-muted);
  color: var(--text-muted);
  font-size: 0.9rem;
}

.list-styled li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

/* -----------------------------------------------------------------------
   Page Title
   ----------------------------------------------------------------------- */

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: var(--space-md);
  margin-top: var(--space-xl);
}

/* -----------------------------------------------------------------------
   Build Log
   ----------------------------------------------------------------------- */

.build-log {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.6;
  max-height: 400px;
  overflow-y: auto;
}

.build-log-entry {
  padding: 2px 0;
}

.build-log-time {
  color: var(--text-dim);
  margin-right: var(--space-sm);
}

.build-log-success {
  color: var(--green);
}

.build-log-error {
  color: var(--red);
}

.build-log-warn {
  color: var(--yellow);
}

/* -----------------------------------------------------------------------
   Responsive Design
   ----------------------------------------------------------------------- */

@media (max-width: 768px) {
  .page-wrapper {
    flex-direction: column;
    padding: var(--space-md);
    gap: var(--space-md);
  }

  nav {
    min-width: auto;
  }

  .nav-list {
    flex-direction: row;
    flex-wrap: wrap;
    position: static;
    gap: var(--space-xs);
  }

  .nav-link {
    padding: var(--space-xs) var(--space-sm);
    font-size: 0.8rem;
  }

  header {
    padding: var(--space-sm) var(--space-md);
    flex-direction: column;
    gap: var(--space-xs);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .page-title {
    font-size: 1.35rem;
  }

  table {
    font-size: 0.8rem;
  }

  th, td {
    padding: var(--space-xs) var(--space-sm);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .header-subtitle {
    display: none;
  }
}
`;
}
