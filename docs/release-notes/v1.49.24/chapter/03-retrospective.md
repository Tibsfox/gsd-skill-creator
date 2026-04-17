# Retrospective — v1.49.24

## What Worked

- **Research browser architecture continues to scale.** BCM and SHE dropped in with zero engineering changes -- same static HTML + client-side markdown pattern as COL/CAS/ECO/GDN. Six projects now, same architecture.
- **Cross-reference matrix tells the integration story.** The new rows (Materials, Seismic, Building Codes, Electronics, IoT) show how BCM and SHE connect to the ecological research. Douglas fir appears in COL as a tree species and in BCM as a structural lumber grade. Climate sensors in SHE measure what the ECO project documents.
- **Mission pack pipeline is reliable.** LaTeX source → PDF → static browser → research modules → verification. Both BCM and SHE followed the proven pattern without deviation.
- **Safety-first research modules.** Both projects lead with safety: 119 callouts in BCM (building codes demand it), 56 in SHE (mains voltage demands it). The verification reports confirm all safety-critical content.

## What Could Be Better

- **BCM research is dense.** Content templates alone run 1,814 lines, parameter schemas 716 lines. These are reference-grade documents but would benefit from a table of contents or section navigation within the browser.
- **SHE source index is thin.** At 105 lines, it's the shortest source index in the series. The component catalog and project templates compensate, but the source attribution could be deeper.

## Lessons Learned

1. **The PNW series has natural expansion axes.** COL/CAS/ECO/GDN documented the living system. BCM documents the built environment within it. SHE documents the electronics that connect them. Each new project fills a gap without overlapping existing coverage.
2. **Dual-state code mapping is essential for PNW building content.** Oregon and Washington share a bioregion but diverge on building codes, licensing, and inspection requirements. Mapping both states side-by-side prevents the content from being Oregon-only or Washington-only.
3. **Electronics research benefits from tiered project structure.** The 6-tier progression (beginner → capstone) gives the SHE collection pedagogical structure that pure reference material lacks. The 36 projects serve as both learning path and component reference.
4. **Cross-reference matrices grow combinatorially.** Going from 4 to 6 projects added 5 new topic rows and 12 new cells. At 8+ projects, the matrix may need grouping or filtering to stay navigable.
