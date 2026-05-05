# Atlas User Guide

**Atlas** is the code-structure visualisation layer inside the gsd-skill-creator Intelligence Dashboard.
It gives you a four-pane interactive view of your codebase's symbol topology, file-to-file dependencies,
and mission-by-mission change history — all driven by the Intelligence KB built during each project
session.  Open it from the **Atlas** tab in the dashboard nav (requires the Tauri desktop shell).

---

## Overview — the four panes

| Pane | What it does |
|---|---|
| **System Map** | Circle-pack or force-directed graph of all source modules.  Node area encodes file size; edge weight encodes coupling strength.  Click a module to focus it across all panes. |
| **Symbol Graph** | Call-graph and type-relation graph for the currently focused module or symbol.  Edges are labelled `calls`, `implements`, `extends`, `uses`.  Orphan nodes are highlighted in orange. |
| **Mission Archeology** | Sankey diagram of symbols changed per mission (commit range).  Width of each flow encodes line-change volume.  The centerpiece GSD superpower — pick a mission and instantly see which symbols moved. |
| **Code View** | Syntax-highlighted source for the focused file.  Token categories (keyword, identifier, literal, operator, comment) are coloured consistently with the Symbol Graph.  Read-only; no editing. |

The search palette (Cmd-K / Ctrl-K) floats above all four panes and provides sub-millisecond
cross-corpus search (symbols, files, missions, KB notes) via a trigram index.

---

## Getting Started

1. Launch gsd-skill-creator in the Tauri desktop shell (`npm run tauri dev` or the release binary).
2. Click the **Atlas** tab in the left nav (between Intelligence and the dashboard tabs).
3. On first load the atlas indexes the current Intelligence KB snapshot.  Progress is shown in the
   System Map pane.  For a typical project (< 500 source files) indexing completes in under 3 seconds.
4. Once indexed, all four panes populate simultaneously.

> **Browser-only mode:** opening `atlas.html` directly in a browser (without Tauri) shows a static
> banner explaining that Tauri IPC is required.  This is expected — symbol indexing and live snapshot
> diffs require IPC access to the Intelligence KB.

---

## Setup: registering your project

Atlas reads symbol and provenance data from the same Intelligence KB that powers the
**Intelligence** tab (introduced in v1.49.597).  Two SQLite files are involved:

| File | Role |
|---|---|
| `~/.gsd/intelligence/registry.db` | Index of all registered GSD projects.  One row per project: `(id, path)`. |
| `<project>/.gsd/intelligence/intelligence.db` | Per-project KB (migrations 001 + 002 + 003).  The atlas reads migration-003 tables from this file. |

The registry path is overridable via the `GSD_INTELLIGENCE_REGISTRY` environment variable —
the same convention used by `RealKbDelegate` (v1.49.597) and `SqliteAtlasKbDelegate` (E4).

### Pre-existing GSD project (Intelligence tab already working)

No extra setup needed.  If your project already appears in the **Intelligence** tab it is
registered in `registry.db` and Atlas will read it immediately.  Open the Atlas tab and the
four panes will populate on first load.

### New or unregistered project

Register the project through the same mechanism you used for the Intelligence tab — either
the `gsd intelligence register` CLI command or the "Register project" button in the
Intelligence tab settings panel.  Once registered, Atlas reads the project automatically.

> If you do not yet have Intelligence tab documentation to hand, the short path is:
> `gsd intelligence register <path/to/project>` from the project root.  This creates the
> registry row and initialises `<project>/.gsd/intelligence/intelligence.db` with all three
> migrations.  Then open the Atlas tab.

### Cold-start UX

Opening the Atlas tab before any project is registered (fresh install, no registry yet) shows
**empty panes, not errors**.  The SQLite delegate returns `Ok([])` for all queries when the
registry file does not exist — the desktop tab stays calm.  Once a project is registered and
the Intelligence analyzer has run at least one session, the panes populate automatically on
the next Atlas tab load.

> **Tauri only:** the Atlas tab requires the Tauri desktop shell.  Opening `atlas.html`
> directly in a browser (without Tauri IPC) shows the static fallback banner.  This is
> expected — symbol and provenance data require IPC access to the Intelligence KB.

---

## Cross-pane Selection

Clicking any node in any pane propagates a **Focus** event to the other three panes:

- Click a module in **System Map** → Symbol Graph zooms to that module's exported symbols; Code View
  loads the first source file; Archeology highlights the module in the Sankey flows.
- Click a symbol in **Symbol Graph** → Code View scrolls to the declaration line; System Map dims
  all other modules; Archeology filters to missions where that symbol changed.
- Click a mission bar in **Archeology** → System Map overlays the change heatmap for that mission;
  Symbol Graph filters to symbols touched in that mission's diff.
- Click a token in **Code View** → if the token resolves to a known symbol, Symbol Graph zooms to it.

The coordinator (`desktop/intelligence/atlas/coordinator.ts`) is the single source of truth for the
shared focus state.  All four panes subscribe to it; none write directly to another pane.

---

## URL-Hash Persistence

The current focus state is serialised into the URL hash each time it changes:

```
atlas.html#sym=MyClass&file=src/graph/index.ts&mission=v1.49.597
```

- **Reload survives** — opening the same URL reloads with the same pane focus.
- **Shareable links** — paste the URL into a chat or issue to share an exact view.
- **Back-button works** — the browser history stack mirrors the focus history.

Hash parsing and serialisation live in `desktop/intelligence/atlas/focus-state.ts`.
The coordinator calls `attachHashRouting()` once at startup to wire the browser history API.

---

## Cmd-K Palette

Press **Cmd-K** (macOS) or **Ctrl-K** (Linux/Windows) to open the search palette.

- **Type immediately** — results appear within one frame (trigram index is pre-built at load time).
- **Result types:** symbols (function, class, type, constant), files, missions, KB notes.
- **Keyboard navigation:** Up/Down to move, Enter to select, Escape to dismiss.
- **Result → focus:** selecting a result fires a focus event identical to clicking a node — all
  four panes update.

The trigram index (`src/atlas/search/`) is rebuilt from the Intelligence KB snapshot on each load.
Search latency is < 1 ms for corpora up to ~50,000 symbols on commodity hardware.

---

## Mission Archeology — the Centerpiece

Mission Archeology answers: *which parts of the codebase changed during mission X?*

1. Open the Archeology pane (it is the right-side pane in the default layout).
2. The mission timeline shows all missions in the Intelligence KB as horizontal bars, ordered
   by commit date.
3. Click a mission card to select it.  The Sankey diagram renders within 200 ms.
4. **Reading the Sankey:** left column = source files; right column = symbol categories
   (function, class, type, constant, other); flow width = number of changed lines.
5. Hover a flow to see the exact symbol list and line-change count in a tooltip.
6. Click a flow → focus propagates to System Map and Symbol Graph.

Archeology data is sourced from the `atlas_symbols` snapshot table
(`src-tauri/migrations/003_atlas_symbols.sql`) which records per-symbol provenance (file, line,
commit range) from the Intelligence KB symbol indexer.

---

## Performance Budgets

The atlas is designed around 16 success criteria.  Key performance expectations:

| Metric | Target |
|---|---|
| Initial index (< 500 files) | < 3 s |
| Pane repaint on focus change | < 16 ms (one frame at 60 fps) |
| Sankey render on mission select | < 200 ms |
| Cmd-K keystroke → results | < 1 ms |
| System Map layout (< 500 nodes) | < 100 ms |
| Symbol Graph render (< 200 edges) | < 50 ms |

These targets are validated in the atlas test suite (`desktop/intelligence/atlas/__tests__/`).
Regression from a target triggers a Vitest failure; the CI gate will catch it.

---

## Limitations

Atlas is a **read-only** viewer.  No code editing, no file writes.

**LSP integration is deferred to v2.** The current symbol resolver is KB-driven (provenance from
the Intelligence snapshot), not a live language-server query.  Call-edge resolution is
best-effort: edges to external packages are shown as orphan exits, not cross-package graphs.

**Clean-room primitives** — the graph renderer, pack layout, Sankey, syntax highlighter, and
trigram index are all implemented from published algorithms without third-party library deps
(ADR 0003 clean-room policy).  This means:
- The Sankey does not support complex cycle-breaking heuristics (deferred).
- The force-directed layout uses Fruchterman–Reingold, not the D3 variant's velocity verlet.
- Syntax highlighting is a state-machine tokeniser, not a full language-server grammar.

**Static-browser mode** shows the fallback banner.  Tauri IPC is required for live KB access.

**Symbol resolution granularity:** the indexer operates at the declaration level (function,
class, interface, enum, type alias).  Intra-function analysis (local variables, expression-level
types) is not indexed.

---

## Troubleshooting

**Atlas tab not visible:** clear browser cache or hard-reload the page.  The nav-shim injects
the Atlas tab on DOMContentLoaded; if it ran before the DOM was ready in a very slow environment
it may have been skipped.  Reload resolves it.

**Static-mode banner in Tauri shell:** verify Tauri IPC is reachable
(`typeof window.__TAURI_IPC__ !== 'undefined'`).  If using a dev-mode Tauri build, the IPC
bridge is only available after the Rust backend finishes initialising — typically < 1 s.

**System Map shows no nodes:** the Intelligence KB may not have a snapshot yet.  Run
`npm run intelligence:serve` and trigger at least one analyzer scan before opening Atlas.

**Archeology pane is empty:** no missions are indexed.  Missions appear once the Intelligence
KB contains at least one commit-range diff record.  Running a session with the GSD workflow
active populates missions automatically.

**Search returns no results:** the trigram index builds asynchronously.  Wait for the System Map
initial-load indicator to clear, then retry Cmd-K.

**Performance regression (slow repaint):** check browser DevTools for heavy paint events.
The Symbol Graph WebGL canvas is the most likely bottleneck at > 500 nodes.  Reduce the visible
node count via the filter pipeline controls in the Symbol Graph toolbar.

---

*Atlas — v1.49.607 (GSD Code Atlas milestone, post-E4)*
