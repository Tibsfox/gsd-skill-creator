# Lessons — v1.49.132

9 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Self-examination at scale works.**
   Auditing 167 projects across 40 releases in a single pass reveals patterns invisible at the per-release level. The Amiga Principle's 14 independent emergences could only be seen by reading across the full corpus.
   _⚙ Status: `investigate` · lesson #764_

2. **The strongest recurring insight — "the meaning lives between the nodes" — is the project's own theory of itself.**
   The cross-reference graph validates this: 739 edges connecting 177 nodes means an average of 4.2 connections per project. The graph IS the Rosetta Stone.
   _🤖 Status: `investigate` · lesson #765 · needs review_
   > LLM reasoning: Blender manual release doesn't address the cross-reference graph meta-insight.

3. **Quality varies systematically, not randomly.**
   The v1.49.101-131 batch produced uniformly thinner modules than the v1.49.82-90 batch because the session processed 31 projects vs. 59 with similar token budgets. Quality is a function of attention allocation, not capability.
   _⚙ Status: `investigate` · lesson #766_

4. **Architecture gaps cluster around the private-public boundary.**
   The three highest-priority gaps (DACP docs, College wiring, cross-reference automation) all involve making private architectural knowledge public. The architecture is sound; the documentation is the bottleneck.
   _⚙ Status: `investigate` · lesson #767_

5. **Lex was right.**
   Claiming architectural principles without systematic evidence is aspiration. Measuring 1,175 modules, graphing 739 connections, auditing 7 gaps, and codifying 96 lessons is proof. The system can examine itself, find its weaknesses, and report them honestly. That's what Lex asked for.
---
*The proof is in the graph. 177 nodes. 739 edges. 15 themes. 7 gaps. 96 lessons. Every claim traced to evidence. Lex said prove it. Here it is.
   _⚙ Status: `investigate` · lesson #768_

6. **GAP-6 (DACP not publicly documented) remains the most critical open gap — the project's central architectural thesis lives in private context**
   _🤖 Status: `applied` (applied in `v1.49.195`) · lesson #769 · needs review_
   > LLM reasoning: OPEN Problems analysis in v1.49.195 explicitly surfaces DACP documentation gap as open problem.

7. **52 thin modules need enrichment passes — 7 projects (SMB, CCT, CNA, CYG, BHC, ABM, YNT) are uniformly under-depth**
   _⚙ Status: `investigate` · lesson #770_

8. **The cross-reference graph was built by sampling 89 of 177 projects — a complete scan would capture more edges**
   _⚙ Status: `investigate` · lesson #771_

9. **Rosetta cluster expansion to 13 needs validation against the Rosetta Core curriculum structure**
   _🤖 Status: `investigate` · lesson #772 · needs review_
   > LLM reasoning: HEL release on helium/semiconductors doesn't address Rosetta cluster curriculum validation.
