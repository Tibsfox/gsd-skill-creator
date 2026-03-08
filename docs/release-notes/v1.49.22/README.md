# v1.49.22 — PNW Research Series

**Shipped:** 2026-03-07
**Commits:** 9
**Files:** 107 changed | **New Code:** ~41,300 LOC
**Tests:** 125 (math-coprocessor) + 333 (dashboard) + 16 (math panel)

## Summary

Launches the PNW Research Series -- a collection of static research browsers covering Pacific Northwest biodiversity -- alongside the foundational GPU-accelerated math co-processor. Ships three complete research browsers (Columbia Valley Rainforest, Cascade Range, PNW Living Systems), a gardening research browser, the PNW series master index, the math co-processor with 5 computational chips, and the Minecraft SocketEdit skill.

## Key Features

### PNW Research Browsers
- **Columbia Valley Rainforest** (`www/PNW/COL/`) -- Temperate rainforest biodiversity with flora, fauna, fungi, aquatic, synthesis, schemas, publication, and verification research documents
- **Cascade Range** (`www/PNW/CAS/`) -- Mountain ecosystem biodiversity across 10 elevation zones with flora (1,221 lines), fungi (614 lines), aquatic (802 lines), fauna, threats, networks, sources, publication, and verification documents
- **PNW Living Systems** (`www/PNW/ECO/`) -- Living systems taxonomy browser with dual mission packs (ecosystem + fungi taxonomy), LaTeX source documents
- **PNW Gardening** (`www/PNW/GDN/`) -- Regional gardening research browser
- **Series Master Index** (`www/PNW/index.html`) -- Deep cross-linking across all PNW research browsers with unified navigation

### Math Co-Processor Foundation
- **5 computational chips:** Algebrus (linear algebra), Fourier (FFT/spectral), Statos (statistics), Symbex (symbolic), Vectora (vector calculus)
- **GPU acceleration:** CUDA-backed via cuBLAS with CPU fallback for all operations
- **MCP server:** 18 tools exposed via Model Context Protocol with config-driven chip activation
- **Integration layer:** Dashboard math panel, benchmarks, VRAM monitoring, CUDA stream management
- **Chipset definition:** `data/chipset/math-coprocessor.yaml`
- **125 tests** across correctness, edge cases, integration, performance, and safety

### Minecraft SocketEdit Skill
- Complete pipeline documentation for Minecraft world editing via socket protocol

## Retrospective

### What Worked
- **Research browser architecture is proven** -- The COL/CAS/ECO/GDN browsers all use the same client-side markdown rendering pattern. Adding a new research topic is now a matter of content, not engineering.
- **Master index creates discoverability** -- Deep cross-linking between browsers makes the collection navigable as a whole rather than isolated silos.
- **Math co-processor CPU fallback** -- Every GPU operation has a NumPy CPU fallback, so the system works on any machine. GPU acceleration is a performance bonus, not a requirement.
- **Config-driven chip activation** -- Chips can be enabled/disabled via configuration, avoiding loading unnecessary GPU contexts.

### What Could Be Better
- **Research content is large** -- Individual research files (flora at 1,221 lines, aquatic at 802 lines) are substantial. A search/filter mechanism within browsers would help navigation.
- **No automated research verification** -- Verification documents are manually authored. Automated cross-reference checking would catch errors.

## Lessons Learned

1. **Static HTML + client-side markdown is the right architecture for research browsers.** No build step, no dependencies, works offline, loads instantly. The pattern scales across topics without engineering overhead.
2. **GPU math needs CPU parity.** Building the CPU fallback first, then adding GPU acceleration on top, ensures correctness testing isn't blocked by hardware availability. The fallback also serves as the oracle for GPU result verification.
3. **5-chip separation is the right granularity.** Each chip maps to a distinct mathematical domain with different GPU library backends (cuBLAS, cuFFT, cuSOLVER, cuRAND, NVRTC). Finer would fragment; coarser would create a monolith.
4. **3 research agents + direct writing is a reliable pattern.** When individual research agents fail (as cas-611 and cas-613-fauna did in the CAS run), writing the document directly is always available as a fallback. Agent failures shouldn't block content delivery.
