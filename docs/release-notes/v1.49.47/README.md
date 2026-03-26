# v1.49.47 — "West of the Rockies"

**Shipped:** 2026-03-26
**Commits:** 1 (`3f66997c`)
**Files:** 19 | **Lines:** +3,239 / -2 (net +3,237)
**Branch:** dev → main
**Tag:** v1.49.47
**Dedicated to:** every bid committee that ever stood up in a hotel ballroom and said "we'll host it next" — and then spent two years making good on it

> "Not everything that was great needs to continue. Sometimes the most dignified act is knowing when to stop — and ensuring the legacy is documented before it does."

---

## Summary

The 45th Research project and the second entry in the conventions sub-cluster. WCN (Westercon) maps 77 years of the West Coast Science Fantasy Conference — the oldest continuously-running regional SF convention in the western United States, traveling to a different city every year since 1948. Seven modules trace the full arc: LASFS founding, the traveling model and its costs, governance-by-bylaws, the conventions Westercon spawned, the current decline and retirement debate, the distributed architecture that made it work, and the site selection ballot as democratic process.

Westercon is a traveling signal. Where Norwescon is a fixed node (same hotel, same weekend, 48 years), Westercon is a packet — carrying fandom culture from Los Angeles to Seattle to Phoenix to San Jose, adapting to each host city, maintaining protocol across decades through bylaws rather than venue. That architectural choice is both its greatest strength (every city gets a turn, local fandoms learn by hosting) and its fatal weakness (institutional memory resets with every new committee, no permanent staff, no permanent anything except the rules).

WCN pairs with NWC to tell the complete West Coast convention story. Together they document both models of community infrastructure: centralized and distributed, permanent and itinerant, server and packet. The pair maps directly to distributed systems concepts from CMH and SYS — and the question of which model survives longer is answered by the data: the fixed node is thriving at 48, the traveling signal is debating retirement at 77.

Named "West of the Rockies" — the geographic boundary that has defined Westercon's territory and identity since its founding in 1948.

---

## Key Features

### WCN Research Project

**Location:** `www/tibsfox/com/Research/WCN/`
**Files:** 15 | **Research lines:** 1,305 | **Sources:** 14 | **Cross-links:** 17
**Theme:** Terracotta (#BF360C) with horizon gold (#FFB300)

| # | Title | Lines | Through-Line |
|---|-------|-------|-------------|
| 01 | Since 1948 | 154 | *The oldest continuously-running regional SF convention.* |
| 02 | A Different City Every Year | 184 | *Adaptation has a cost — institutional memory resets.* |
| 03 | The Rules of the Road | 208 | *Bylaws are the only constant.* |
| 04 | The Conventions It Built | 188 | *Taught the West Coast how to run them.* |
| 05 | The Question of When to Stop | 213 | *The most dignified act is knowing when to stop.* |
| 06 | The Convention That Traveled | 193 | *Norwescon is the server, Westercon is the packet.* |
| 07 | The Site Selection Ballot | 165 | *Verification, 14 sources, 17 cross-links.* |

### Module Highlights

- **Module 02 "A Different City Every Year"** (184 lines) documents the cost of adaptation. Every new host city means a new hotel, new local committee, new relationships with venues and vendors. The traveling model distributes opportunity — any city can bid — but it also distributes institutional memory loss. Each committee reinvents solutions that the previous committee already solved.
- **Module 03 "The Rules of the Road"** (208 lines) maps governance-by-bylaws. When everything else changes — city, hotel, committee, attendees — the bylaws are the only constant. Westercon's constitution is its institutional memory, the one artifact that survives every reset. The parallel to protocol design (RFC as the only constant in a distributed system) is structural.
- **Module 04 "The Conventions It Built"** (188 lines) traces Westercon's legacy as teacher. Westercon taught the West Coast how to run conventions — the people who hosted a Westercon took that experience home and started their own local conventions. Norwescon, BayCon, ConJose, LosCon — the lineage traces back to Westercon's traveling classroom. The student conventions now outlive the teacher.
- **Module 05 "The Question of When to Stop"** is the largest module (213 lines) and the most honest in the conventions sub-cluster. Documenting an institution's potential retirement requires respect for the people who built it and candor about the challenges it faces. Attendance declining, bid committees harder to recruit, competing events multiplying — the module presents the data without advocating either continuation or retirement. Institutions that document their own lifecycle honestly leave a more useful record than institutions that pretend decline is not happening.
- **Module 06 "The Convention That Traveled"** makes the NWC+WCN architectural comparison explicit. Fixed node vs. traveling packet. Centralized vs. distributed. The analysis draws on the same infrastructure patterns documented in SYS and CMH — distributed systems that lack persistent state face the same challenges whether they carry convention culture or network traffic.

### Cross-Reference Density

WCN references NWC throughout as its architectural counterpart — the pair is designed to be read together. Additional connections: BRC (temporary community infrastructure, bidding as radical self-reliance), CMH/SYS (distributed vs. centralized systems), SMF (the meta-layer that maintains convention knowledge), and GRV/PJM (West Coast creative community geography).

### File Inventory

15 research files, 1,305 lines of research content. Scaffold (index.html, styles, hub card) adds 4 files. Total: 19 files, +3,237 net lines. Hub page updated with WCN card in terracotta.

**Research series: 45 complete projects, 423 research modules, ~196,000 lines.**

---

## Retrospective

### What Worked

1. **The NWC-WCN pair is architecturally clean.** Fixed node (Norwescon, 48 years at the DoubleTree) and traveling signal (Westercon, different city each year since 1948). Two conventions, two models, one community. Writing NWC first meant WCN could reference the fixed-node baseline and define itself by contrast — the pair reads as a single argument delivered across two projects.

2. **Module 05 handles decline with respect.** The convention community is real, the people who built Westercon are still alive, and documenting potential retirement is not the same as declaring failure. The module presents attendance data, bid committee challenges, and the structural weaknesses of the traveling model without editorializing. The Research series documents what IS, including what might be ending.

3. **The terracotta-and-gold palette works.** Desert tones for a convention that traveled from LA to Phoenix to Boise — the American West, not the Pacific Northwest specifically. The visual identity distinguishes WCN from NWC's convention purple immediately.

### Lessons Learned

1. **Institutional lifecycles are research subjects.** WCN's 77-year arc — founding, growth, maturity, decline, retirement debate — is the same lifecycle every long-running project faces. Documenting both the thriving case (NWC) and the declining case (WCN) in the same sub-cluster makes the comparison inevitable and instructive. Longevity is not the same as health.

2. **Distributed systems without persistent state are fragile.** Westercon's traveling model means every new committee starts from near-zero institutional knowledge. Bylaws carry the rules but not the wisdom. The oral tradition fills the gap — but oral traditions break when volunteers burn out. This is the same problem SMF (SMOFcon) exists to solve, which makes it the natural third entry in the stack.

---

> *Seventy-seven years. A different city every year. The convention that taught the West Coast how to imagine — and is honest enough to ask whether the teaching is done.*
