# v1.49.48 — "Secret Masters of Fandom"

**Shipped:** 2026-03-26
**Commits:** 1 (`2aab1ec7`)
**Files:** 19 | **Lines:** +3,447 / -2 (net +3,445)
**Branch:** dev → main
**Tag:** v1.49.48

> "The people who run conventions don't do it for money, recognition, or power. They do it because someone has to, and they know how."

---

## Summary

The 46th Research project — SMF (SMOFcon), the convention for convention runners. "Secret Masters of Fandom" is the self-deprecating title for the volunteers who organize SF conventions. SMOFcon is their annual gathering — typically 50-150 attendees, entirely focused on how to run conventions: budgets, hotel contracts, safety, accessibility, and the oral tradition of institutional knowledge that keeps fandom's infrastructure alive.

SMF completes the **conventions sub-cluster**: NWC (Norwescon, the convention — 48 years, fixed venue) + WCN (Westercon, the traveling convention — 77 years, different city each year) + SMF (SMOFcon, the meta-layer — since 1984, the convention about conventions). Three layers: infrastructure, network, and observability. The same architecture pattern that runs through the entire Research series.

**Research series: 46 complete projects, 430 research modules, ~197,000 lines.**

---

## Retrospective

### What Worked

1. **The three-layer conventions stack is architecturally elegant.** NWC = the server (fixed, persistent, one location). WCN = the packet (traveling, distributed, adapts to each host). SMF = the control plane (meta-layer, governance, knowledge transfer). The mapping to infrastructure patterns (SYS, CMH) is genuine, not forced.

2. **Module 04 "The Oral Tradition" surfaces a universal problem.** Convention knowledge lives in people's heads. When volunteers burn out, the knowledge is lost. This is the same problem every organization faces — and it's the core problem this entire project exists to solve through documentation.

### Lessons Learned

1. **The meta-layer completes the stack.** You need three things: the thing (NWC), the network of things (WCN), and the system that maintains the network (SMF). Missing any one makes the whole fragile. The Research series has the same structure: individual projects, the hub that connects them, and the Rosetta Stone framework that maintains coherence across them.

---

> *The "secret" is that there's nothing secret about it — just unglamorous work done by people who care.*
