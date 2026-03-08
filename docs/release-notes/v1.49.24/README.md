# v1.49.24 — Building Construction & Smart Home Electronics

**Shipped:** 2026-03-08
**Commits:** 1
**Files:** 34 changed | **New Code:** ~19,750 LOC
**Tests:** 48 (BCM verification) + 33 (SHE verification)

## Summary

Adds two new research collections to the PNW Research Series: Building Construction Mastery (BCM) covering six trade disciplines across Oregon and Washington building codes, and Smart Home & DIY Electronics (SHE) covering a complete electronics curriculum from blinking LEDs to full home automation hubs. Updates the PNW master index from 4 to 6 projects with expanded cross-reference matrix.

## Key Features

### Building Construction Mastery (`www/PNW/BCM/`)
- **6 trade disciplines** at 5 audience levels: structural systems, electrical systems, plumbing & mechanical, building envelope, codes & standards, educational frameworks
- **Dual-state code mapping:** Oregon and Washington building codes side by side
- **Seismic design:** ASCE 7-22 Cascadia Subduction Zone considerations
- **Code coverage:** NEC 2023 (electrical), UPC 2021 (plumbing), IBC/IRC (structural)
- **119 safety callouts** across all modules
- **ABET alignment** in educational frameworks
- **12 research files**, 11,583 lines, 680 KB
- **48/48 verification tests** passing

### Smart Home & DIY Electronics (`www/PNW/SHE/`)
- **36 hands-on projects** across 6 tiers (beginner to capstone)
- **22 sensors, 14 actuators** cataloged with specifications
- **10 communication protocols:** MQTT, Zigbee, Z-Wave, Thread, Matter, Wi-Fi, BLE, LoRa, I2C, SPI
- **Platform coverage:** Home Assistant, ESPHome, ESP32, Raspberry Pi
- **NEC safety integration** for mains-voltage projects
- **56 safety callouts** across all modules
- **12 research files**, 4,721 lines, 532 KB
- **33/33 verification tests** passing

### PNW Master Index Update
- **4 → 6 projects** with BCM and SHE cards added
- **Cross-reference matrix expanded:** 5 new topic rows (Materials, Seismic, Building Codes, Electronics, IoT/Smart Home)
- **Stats refreshed:** 66 research files, 3.8 MB total, 124 sources cited, 6 mission PDFs
- **Tag colors:** BCM (indigo/steel), SHE (teal/orange)
- **Footer updated:** "The wiring is the nervous system."

## Retrospective

### What Worked
- **Research browser architecture continues to scale.** BCM and SHE dropped in with zero engineering changes -- same static HTML + client-side markdown pattern as COL/CAS/ECO/GDN. Six projects now, same architecture.
- **Cross-reference matrix tells the integration story.** The new rows (Materials, Seismic, Building Codes, Electronics, IoT) show how BCM and SHE connect to the ecological research. Douglas fir appears in COL as a tree species and in BCM as a structural lumber grade. Climate sensors in SHE measure what the ECO project documents.
- **Mission pack pipeline is reliable.** LaTeX source → PDF → static browser → research modules → verification. Both BCM and SHE followed the proven pattern without deviation.
- **Safety-first research modules.** Both projects lead with safety: 119 callouts in BCM (building codes demand it), 56 in SHE (mains voltage demands it). The verification reports confirm all safety-critical content.

### What Could Be Better
- **BCM research is dense.** Content templates alone run 1,814 lines, parameter schemas 716 lines. These are reference-grade documents but would benefit from a table of contents or section navigation within the browser.
- **SHE source index is thin.** At 105 lines, it's the shortest source index in the series. The component catalog and project templates compensate, but the source attribution could be deeper.

## Lessons Learned

1. **The PNW series has natural expansion axes.** COL/CAS/ECO/GDN documented the living system. BCM documents the built environment within it. SHE documents the electronics that connect them. Each new project fills a gap without overlapping existing coverage.
2. **Dual-state code mapping is essential for PNW building content.** Oregon and Washington share a bioregion but diverge on building codes, licensing, and inspection requirements. Mapping both states side-by-side prevents the content from being Oregon-only or Washington-only.
3. **Electronics research benefits from tiered project structure.** The 6-tier progression (beginner → capstone) gives the SHE collection pedagogical structure that pure reference material lacks. The 36 projects serve as both learning path and component reference.
4. **Cross-reference matrices grow combinatorially.** Going from 4 to 6 projects added 5 new topic rows and 12 new cells. At 8+ projects, the matrix may need grouping or filtering to stay navigable.
