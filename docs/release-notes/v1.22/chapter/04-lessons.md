# Lessons — v1.22

7 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Golden image lifecycle with sub-5-minute rebuild time changes operational confidence.**
   When you can rebuild from clone in under 5 minutes and from scratch in under 20, infrastructure becomes disposable. Fear of breaking things drops to near zero.
   _🤖 Status: `investigate` · lesson #113 · needs review_
   > LLM reasoning: v1.49.21 Image to Mission Pipeline is unrelated to golden image rebuild lifecycle.

2. **Operational runbooks are as important as the infrastructure itself.**
   Server maintenance, backup/restore, monitoring, and incident response runbooks mean knowledge isn't trapped in the builder's head. This is the difference between a project and a product.
   _🤖 Status: `applied` (applied in `v1.48`) · lesson #114 · needs review_
   > LLM reasoning: v1.48 Physical Infrastructure Engineering Pack directly formalizes operational runbook knowledge.

3. **Inter-team ICD specifications formalize what was previously tribal knowledge.**
   Structured communication contracts between teams prevent the "I thought you were sending field X" class of integration bugs.
   _🤖 Status: `applied` (applied in `v1.27`) · lesson #115 · needs review_
   > LLM reasoning: v1.27 Foundational Knowledge Packs codify shared specs that replace tribal knowledge between teams.

4. **Distribution abstraction layers (dnf/apt/pacman) are tedious but necessary.**
   Platform portability requires abstracting package management. The unified interface over 3 package managers is unsexy work that enables everything above it.
---
   _⚙ Status: `investigate` · lesson #116_

5. **No test count reported.**
   This is the only release in the v1.16-v1.32 range without explicit test coverage numbers. For a release that includes PXE boot automation, firewall zone management, and VM lifecycle operations, testing is critical.
   _🤖 Status: `applied` (applied in `v1.42`) · lesson #117 · needs review_
   > LLM reasoning: v1.42 added @vitest/coverage-v8 for explicit coverage reporting, directly addressing the missing test metrics concern.

6. **Minecraft server dependency on Fabric mod loader adds external fragility.**
   Fabric, Syncmatica, and Litematica are third-party projects with their own release cycles. Version pinning and update strategy should be documented.
   _🤖 Status: `investigate` · lesson #118 · needs review_
   > LLM reasoning: v1.44 PyDMD work is unrelated to Minecraft Fabric/Syncmatica dependency pinning; no evidence of addressing third-party mod version strategy.

7. **Themed district layout is underspecified.**
   The 4 districts (Computing History, Networking, Architecture, Creative Workshop) and 10 schematic templates are mentioned but their educational mapping to the curriculum is only sketched.
   _🤖 Status: `investigate` · lesson #119 · needs review_
   > LLM reasoning: v1.45 static site generator is unrelated to mapping 4 districts and 10 schematics to curriculum learning objectives.
