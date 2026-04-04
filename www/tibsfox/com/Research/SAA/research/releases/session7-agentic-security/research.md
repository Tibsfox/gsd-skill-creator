# SAA Session 7: Agentic Security, Context Engineering & Ecological Translation

**Catalog:** SAA-S7 | **Cluster:** AI & Computation
**Date:** 2026-04-04 | **Mission:** Artemis II Day 5
**Sources:** 12 videos, 10 GitHub repos, 1 NASA briefing, 31 channel scans

---

## Abstract

Session 7 conducted the largest single-session research intake in the Artemis II mission: 6 parallel analysis agents processed 12 YouTube talks from OWASP Global and the AgenticAI Foundation, while 3 parallel scanners evaluated 10 GitHub repositories spanning MCP security, multi-agent orchestration, and context management. The research produced 16 prioritized gaps in the Gastown chipset, 46 college department topic mappings, 5 Rosetta translation templates with 50+ cross-domain structural analogies, 4 study guides, and 4 DIY try sessions.

The central finding: the security, orchestration, and context management domains are converging on the same structural patterns — trust boundaries, energy budgets, coupled oscillators, and identity verification — instantiated in different substrates. The Rosetta translation templates formalize these isomorphisms.

## Key Findings

### 1. MCP Security Is the Active Frontier

The OWASP and AgenticAI Foundation channels produced the highest-density actionable findings:
- **Tool poisoning has a 70% success rate** against real MCP servers (OWASP MCP Deception)
- **The Lethal Trifecta** (untrusted content + private data + external comm) is the necessary-and-sufficient condition for MCP data exfiltration
- **Agent Identity Protocol (AIP)** is emerging as the standard: implicit deny, explicit allow, per-tool policy enforcement
- **MCPS** proposes cryptographic envelope signing for all MCP messages (IETF Internet-Draft)
- **Anthropic's own engineer** (Adam Jones) measured 100K tokens consumed by MCP tool definitions alone

### 2. Context Engineering Has Rigorous Research Behind It

The token-optimizer, AI Agent Handbook, and context-mode projects provided empirical data:
- Context quality degrades at **25% fill**, not 100% (Chroma Research, 18 models)
- Progressive 3-tier skill loading saves **94% of token overhead**
- Tool selection accuracy drops from **43% to 14%** with bloated toolsets
- Compaction loses **60-70% per event**, **88-95% cumulative** after 2-3 events

### 3. The Orchestration Ecosystem Is Fragmenting Productively

Three distinct architectural patterns have emerged:
- **Message-passing** (Overstory, our Gastown): agents communicate via typed messages
- **PR-as-coordination** (Composio): no messaging, git state is the coordination medium
- **Shared-database** (Metaswarm): BEADS database as coordination backbone

Each excels in different contexts. Our Gastown is best for internal workflow stages; Composio is best for issue-to-PR workflows; Metaswarm is best for quality-gated sequential processes.

### 4. Ecological Translation Templates Are Not Metaphors

The cross-domain mappings reveal genuine structural isomorphisms:
- Zero Trust architecture = ecological awareness zones (same mathematics)
- Token budget enforcement = metabolic energy budgets (same optimization problem)
- Kuramoto synchronization = firefly coupling = distributed consensus (same differential equation)
- SPIFFE identity rotation = mRNA half-life = ephemeral session tokens (same lifecycle pattern)

## Artifacts Produced

| Artifact | Location | Content |
|----------|----------|---------|
| Research Synthesis | artifacts/session7-research-synthesis.md | 16 gaps, priority tiers |
| College Mappings | SAA/research/session7-college-mappings.md | 46 topics across 14 departments |
| Rosetta Templates | SAA/research/session7-rosetta-templates.md | 5 templates, 50+ cross-domain mappings |
| Study Guides | SAA/research/session7-study-guides.md | 4 guides + 4 DIY try sessions |
| Enhanced Kuramoto | forest/api/kuramoto-enhanced.js | Adaptive coupling, order parameter, clusters |
| FD3 Briefing Data | DB: artemis.mission_timeline | 6 entries, 38 total |

## Infrastructure Built This Session

| Module | Tests | Purpose |
|--------|-------|---------|
| transcript-compactor.ts | 38 | Progressive compaction (snapshot → light → moderate → full) |
| event-log.ts | 27 | Append-only unified event log, 8 categories |
| harness-integrity.ts | 37 | 24 invariants including response DLP, tool allowlist, env path safety |

## Retrospective

The parallel research agent architecture proved its value: 6 agents processing 12 videos + 10 repos simultaneously, with synthesis happening in real-time as results returned. The progressive compaction trigger (20%/35%/50%/60%) is the single highest-impact technical finding — it changes when we start protecting context quality, not just reacting to exhaustion.

The Rosetta translation templates are the most surprising output. What started as a pedagogical exercise — "how do we explain zero trust to an ecology student?" — revealed that the mathematical structures are literally identical across domains. This has implications for the college curriculum: a student who understands Kuramoto synchronization in fireflies has already learned distributed consensus in multi-agent systems.

## Lessons Learned

1. **Research-first, then build.** The 6 analysis agents identified exactly which gaps to fill before we wrote a line of code.
2. **Progressive thresholds beat binary triggers.** Applies to compaction, trust, and skill loading.
3. **Decoy tools are the cheapest security investment.** Zero false positives by construction.
4. **Cross-domain translation is research, not decoration.** The isomorphisms are load-bearing.
