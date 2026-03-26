# v1.49.48 — "Secret Masters of Fandom"

**Shipped:** 2026-03-26
**Commits:** 1 (`2aab1ec7`)
**Files:** 19 | **Lines:** +3,447 / -2 (net +3,445)
**Branch:** dev → main
**Tag:** v1.49.48
**Dedicated to:** every convention volunteer who learned the job by doing it, taught the next person by showing them, and never got thanked enough

> "The people who run conventions don't do it for money, recognition, or power. They do it because someone has to, and they know how."

---

## Summary

The 46th Research project and the third entry that completes the conventions sub-cluster. SMF (SMOFcon) maps the convention for convention runners — "Secret Masters of Fandom" being the self-deprecating title adopted by the volunteers who build and operate SF conventions. Since 1984, SMOFcon has gathered 50-150 attendees annually in a single conference room to solve the hardest problem in volunteer organizations: how to transfer institutional knowledge from the people who have it to the people who need it.

SMF completes a three-layer stack. NWC (Norwescon) is the server — fixed, persistent, one location for 48 years. WCN (Westercon) is the packet — traveling, distributed, adapting to each host city for 77 years. SMF is the control plane — the meta-layer that maintains the network, transfers knowledge between nodes, and keeps the whole system coherent. Three conventions, three architectural patterns, one community. The same layered architecture that appears in SYS (infrastructure), CMH (communications), and the Research series itself (projects, hub, Rosetta Stone framework).

The core problem SMOFcon exists to solve is knowledge transfer. Convention-running knowledge lives in people's heads. When volunteers burn out or age out, the knowledge goes with them. SMOFcon is the annual attempt to externalize that oral tradition — to get the people who know how hotel contracts work, how safety teams operate, how budgets survive, to teach the people who will need to know next year. It is documentation performed as conversation, and it is fighting the same entropy that every knowledge system faces.

Named "Secret Masters of Fandom" — the community's own joke about itself. The "secret" is that there is nothing secret about it, just unglamorous work done by people who care.

---

## Key Features

### SMF Research Project

**Location:** `www/tibsfox/com/Research/SMF/`
**Files:** 15 | **Research lines:** 1,219 | **Sources:** 16 | **Cross-links:** 17
**Theme:** Teal (#004D40) with smoky amber (#795548)

| # | Title | Lines | Through-Line |
|---|-------|-------|-------------|
| 01 | The Secret Masters | 130 | *The people who run conventions don't do it for money.* |
| 02 | Since 1984 | 155 | *A convention that fits in one conference room.* |
| 03 | How to Run a Convention | 203 | *Systems engineering performed by volunteers.* |
| 04 | The Oral Tradition | 210 | *The hardest knowledge to preserve lives in people's heads.* |
| 05 | Where Bids Are Made | 178 | *Every democratic process has a pre-game.* |
| 06 | The Convention About Conventions | 190 | *Three layers: convention, network, meta-layer.* |
| 07 | The Con Chair's Checklist | 153 | *Verification, 16 sources, 17 cross-links.* |

### Module Highlights

- **Module 01 "The Secret Masters"** (130 lines) introduces the people behind the acronym. "SMOF" started as a joke — fans who noticed that the same small group of volunteers kept showing up behind the scenes at every convention. The joke became a badge, the badge became an identity, and the identity became a community of practice. The module documents who these people are, why they do it, and what happens when they stop.
- **Module 03 "How to Run a Convention"** (203 lines) maps convention operations as systems engineering. Budgets, hotel blocks, programming grids, safety teams, accessibility, registration, art shows, dealer rooms — coordinated by volunteers with no formal training, no salary, and no guarantee they will be back next year. The parallel to open-source project management is exact.
- **Module 04 "The Oral Tradition"** (210 lines) surfaces the universal problem at the heart of SMOFcon. Convention knowledge is tacit — it lives in stories, muscle memory, and relationships, not in documents. Hotel contract negotiation, safety incident response, volunteer scheduling under pressure — these skills transfer through apprenticeship, not manuals. When the experienced volunteers leave, the knowledge leaves with them. This is the same problem every organization faces, and it is the core problem the entire Research series exists to solve through documentation.
- **Module 05 "Where Bids Are Made"** (178 lines) maps the pre-game. Site selection for Worldcon and Westercon is a formal democratic process — but the lobbying, coalition-building, and deal-making happen at SMOFcon. Every democratic process has a hallway conversation that precedes the vote. The module documents both the official process and the informal one.
- **Module 06 "The Convention About Conventions"** (190 lines) makes the three-layer stack explicit. NWC is the thing. WCN is the network of things. SMF is the system that maintains the network. Missing any one makes the whole fragile. The Research series mirrors this structure: individual projects (the thing), the hub (the network), and the Rosetta Stone framework (the meta-layer that maintains coherence).

### Conventions Sub-Cluster Complete

SMF closes the three-project stack: NWC (v1.49.46, 1,577 lines) + WCN (v1.49.47, 1,305 lines) + SMF (v1.49.48, 1,219 lines) = 4,101 lines of convention research across 46 research files. Three layers, three architectural patterns, one community documented from infrastructure through network through control plane.

### File Inventory

15 research files, 1,219 lines of research content. Scaffold (index.html, styles, hub card) adds 4 files. Total: 19 files, +3,445 net lines. Hub page updated with SMF card in teal.

**Research series: 46 complete projects, 430 research modules, ~197,000 lines.**

---

## Retrospective

### What Worked

1. **The three-layer conventions stack is architecturally elegant.** NWC (server) + WCN (packet) + SMF (control plane). The mapping to infrastructure patterns is genuine, not forced — these conventions literally perform the roles their architectural labels describe. SMOFcon IS a control plane: it coordinates, transfers state, and maintains the health of the network. Writing the three as a deliberate sequence meant each one could build on the previous, and the stack reveals itself naturally by the third entry.

2. **Module 04 "The Oral Tradition" connects to the project's reason for existing.** The entire Research series is an attempt to externalize tacit knowledge — to document what people know but have not written down. SMOFcon faces the same challenge at human scale: get the knowledge out of people's heads before they leave. The parallel is the strongest meta-connection in the series because it is not an analogy. It IS the same problem.

3. **50-150 attendees is the right size for a research subject.** SMOFcon is small enough to document completely — the entire social graph fits in one room. No sampling needed, no approximation. The constraint that makes SMOFcon intimate also makes it researchable.

### Lessons Learned

1. **The meta-layer completes the stack.** You need three things: the thing (NWC), the network of things (WCN), and the system that maintains the network (SMF). This pattern recurs everywhere — infrastructure, conventions, the Research series itself. Recognizing the pattern across domains is what the Rosetta Stone framework is for. The conventions sub-cluster is the clearest example yet because all three layers are the same kind of thing (conventions) operating at different scales.

2. **Knowledge transfer is the hardest problem in volunteer organizations.** SMOFcon has been working on this since 1984 — 42 years of attempting to solve institutional knowledge loss through annual gatherings. The fact that the problem persists after four decades of dedicated effort tells you how hard it is. Documentation helps. Apprenticeship helps. Neither is sufficient. The combination, performed consistently over time, is the best anyone has found. That is also the Research series strategy.

---

> *The "secret" is that there's nothing secret about it — just unglamorous work done by people who care, documented here so the next generation doesn't have to learn it all from scratch.*
