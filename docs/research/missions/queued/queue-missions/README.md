# Queue Missions — Processing 281 DISCOVERED Items

## Triage Summary (Apr 8, 2026)

Of 281 DISCOVERED items, ~90 are genuinely relevant, ~120 are false positive arXiv captures from broad keyword queries, and ~70 are already covered by existing projects.

### Discovery Engine Issue

The arXiv search queries are too broad. Examples of false positives:
- "vertical farming energy" matched "Spectral Properties of Zero-Divisor Graphs of Truncated Polynomial Rings"
- "code generation agents" matched "A scalable infrastructure for strontium optical clocks"
- "process maturity CMMI" matched "Nelson's Stochastic Mechanics"
- "biological nitrogen fixation" matched "High-dimensional Many-to-many-to-many Mediation Analysis"
- "green ammonia electrolysis" matched "On Picard's Problem via Nevanlinna Theory II"

**TODO:** Tighten arXiv queries in discovery_engine.py to use abstract search rather than full-text, and add relevance filtering.

### Missions Staged

| # | Code | Mission | Genuine Items | Source |
|---|------|---------|---------------|--------|
| 1 | — | Agent Orchestration Papers | ~8-10 of 25 | cs.AI arXiv |
| 2 | — | MCP & Cybersecurity Papers | ~8-10 of 23 | cs.CR arXiv |
| 3 | — | Multimodal AI Evaluation | ~10-12 of 21 | cs.CV arXiv |
| 4 | — | LLM Hallucination & Code Agents | ~10 of 27 | cs.CL + cs.SE arXiv |
| 5 | — | Green Chemistry & Agriculture | ~5-8 of 68 | q-bio + physics arXiv |
| 6 | — | Hacker News Intelligence | 7 | HN front page |
| 7 | — | YouTube Video Processing | ~35 | OWASP + IoT + NRC + CMU + CppCon etc. |

### Items Already Covered (skip)
- 9 NASA/Artemis II → already tracked in NASA project
- 5 Agent architecture → covered in AGT
- 5 SE for AI/ML (CMU) → covered in AGT
- 6 C++ / Systems → covered in AGT
- 3 Product lifecycle → covered in AGT
- 3 Tech/hardware → covered in AGT
- 2 Network security → covered in SYA

### Items to Skip (false positives)
- ~21 citation tracking (Suryanto/Cordell/Holt-Lunstad/MIRAGE auto-captures, mostly irrelevant)
- ~12 malformed parsing artifacts
- ~80+ arXiv papers that don't match their assigned domains (discovery engine keyword drift)
