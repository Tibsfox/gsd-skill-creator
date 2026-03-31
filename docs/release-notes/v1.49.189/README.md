# v1.49.189 — Constellation Map: Metrics, Centrality & Fidelity Upgrade

**Branch:** `nasa`
**Released:** 2026-03-30

## Summary

Complete rewrite of the Research constellation map (`constellation.html`) from a simple cluster visualization to a metrics-rich, interactive graph intelligence tool. Every project node now carries filesystem metrics (files, lines, size), graph metrics (betweenness centrality, bridge score, in/out degree), and series membership — all computed from live data and baked directly into the visualization.

## Key Features

### Per-Project Metrics (186 projects analyzed)
- **Filesystem stats:** File count, line count, byte size computed by walking every project directory
- **Graph centrality:** Betweenness centrality computed via exact BFS for all 160 connected nodes
- **Bridge scoring:** Cross-cluster edge ratio identifies projects that connect disparate knowledge domains
- **Series membership:** PNW, S36, SPS series badges on applicable nodes

### Rich Tooltip (replaces minimal 3-line tooltip)
- Project ID, name, and cluster with connection count
- Series membership badge (PNW, S36, SPS) in gold
- 4-metric grid: Files, Lines, Size, Centrality percentage
- Hub node indicator for high-centrality nodes (>30%)
- Bridge node indicator for cross-cluster connectors (>80%)
- Edge direction breakdown: In vs Out degree

### Node Sizing Modes (4 toggleable modes)
- **Degree** — connection count (original behavior)
- **Lines** — source code / content volume
- **Files** — file count per project
- **Centrality** — betweenness centrality (graph importance)

### Hub Glow System
- Nodes with betweenness centrality >20% get expanded, pulsing glow proportional to their centrality score
- Top 3 hubs: DAA (Deep Audio, BC=1.0), SGL (Signal & Light, BC=0.92), SYS (Systems Admin, BC=0.86)
- Labels always visible for high-centrality nodes

### Bridge Ring Visualization
- Gold ring around nodes with >70% cross-cluster edges and 3+ connections
- Identifies projects that bridge knowledge domains: ECO, MST, CDS, BRC, WPH
- Distinct from hub glow (hub = most-traversed, bridge = most-spanning)

### Edge Visualization Modes
- **Blend** — edge color blended from source/target cluster colors (default)
- **Typed** — edge color by relationship type: blue=cites, green=extends, gold=references
- Hovered node's edges highlighted at higher opacity with thicker stroke

### Series Badge Rings
- Green inner ring for PNW series projects (19 nodes)
- Blue inner ring for S36/SPS series

### Aggregate Stats Bar
- Shows: project count, connection count, cluster count, total lines, total files
- Updates: 186 projects, 745 connections, 13 clusters, 1.1M lines, 3,480 files

## Graph Intelligence Findings

### Top 5 Hub Nodes (Betweenness Centrality)
| Rank | ID | Name | BC | Degree | Bridge |
|------|----|------|----|--------|--------|
| 1 | DAA | Deep Audio | 1.00 | 29 | 41% |
| 2 | SGL | Signal & Light | 0.92 | 32 | 84% |
| 3 | SYS | Systems Admin | 0.86 | 32 | 72% |
| 4 | ECO | Living Systems | 0.56 | 16 | 100% |
| 5 | FCC | FCC Catalog | 0.52 | 19 | 74% |

### Top Cross-Cluster Bridges
- ECO (Ecology) — 100% cross-cluster, bridges ecology to infrastructure, music, business
- MST (Mesh Telescope) — 100% cross-cluster, bridges science to infrastructure, ecology, AI
- CDS (Central District) — 100% cross-cluster, bridges business to music, ecology

### Network Statistics
- 160 connected nodes, 26 orphans (0 connections)
- 745 edges (708 cites, 5 extends, 2 references)
- Mean degree: 4.66 per connected node
- Most-connected: SYS (32), SGL (32), DAA (29), K8S (26)

## Technical Details
- Single-file HTML with embedded data — no external dependencies
- Canvas 2D renderer with pointer/touch/wheel interaction
- Force-directed layout with cluster grouping
- All metrics pre-computed and baked in as JS objects
- 569 lines (up from 437)

## Retrospective

### What Worked
- Python metric computation pipeline: filesystem walk + BFS centrality + bridge scoring in <5 seconds
- Embedding metrics directly in HTML avoids fetch() complexity and works offline
- Four sizing modes reveal completely different aspects of the same graph
- Hub glow makes the true knowledge bridges immediately visible

### What Could Be Better
- Orphan nodes (26 projects) still scatter in periphery — could group them in a visible shelf
- Edge type data is mostly "cites" (708/745) — the extends/references edges need more coverage
- The 3D sphere view doesn't have these upgrades yet (separate file)

## Lessons Learned
- Betweenness centrality reveals non-obvious hubs: DAA (Deep Audio) is the #1 hub despite not being the most connected — it's the most-traversed bridge in shortest paths
- Bridge score (cross-cluster %) and betweenness centrality measure different things: high bridge + low BC = edge connector, high BC + low bridge = cluster backbone
- Pre-computing metrics and baking them in is the right pattern for static sites — no runtime cost, works offline, deploys as a single file
