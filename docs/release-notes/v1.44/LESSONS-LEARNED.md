# v1.44 Lessons Learned — SC Learn PyDMD Dogfood

## LLIS-44-01: Dogfood-Driven Development

**Category:** Quality
**Impact:** High

Running sc:learn against a real scientific library (PyDMD) exposed extraction, mapping, and verification gaps that synthetic testing couldn't reach. The dogfood report became a roadmap for pipeline improvements.

**Recommendation:** Dogfood new capabilities against real-world data early and often. The gap report is more valuable than the feature itself.

## LLIS-44-02: Mathematical Content Extraction

**Category:** Technical
**Impact:** Medium

Scientific computing documentation mixes prose, LaTeX equations, code examples, and API references. A single extraction strategy fails — multi-format parsing with context-aware chunking is required.

**Recommendation:** Build format-specific extractors (prose, math, code, API) that feed into a unified knowledge graph.
