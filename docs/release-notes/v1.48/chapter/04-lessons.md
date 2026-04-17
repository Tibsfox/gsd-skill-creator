# Lessons — v1.48

7 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Engineering skill packs need safety architecture before domain features.**
   The Safety Warden was Phase 434 (Wave 0) -- the first thing built. Every subsequent phase inherits its constraints. Building safety last would have required retrofitting 11 phases of existing code.
   _🤖 Status: `investigate` · lesson #253 · needs review_
   > LLM reasoning: Candidate snippet is the same Heritage pack and doesn't show a new safety-first architecture being applied to a different engineering pack.

2. **E2E integration pipelines (cooling, power, combined) validate that domain modules compose correctly.**
   Individual modules can pass all their tests while failing at the handoff boundary. The E2E pipelines specifically test the boundaries: IT load -> thermal calc -> fluid sizing -> P&ID -> BOM.
   _🤖 Status: `investigate` · lesson #254 · needs review_
   > LLM reasoning: Muse Integration & MCP Pipeline snippet is unrelated to cooling/power/BOM domain handoff testing.

3. **3 team topologies (domain-specialist, cross-domain, full-build) right-size the agent deployment.**
   A simple pipe sizing question doesn't need 5 agents. A full data center design does. Topologies let the system match agent count to problem complexity.
   _🤖 Status: `investigate` · lesson #255 · needs review_
   > LLM reasoning: Deterministic Agent Communication Protocol addresses agent coordination but not topology sizing specifically.

4. **The educational bridge (Minecraft, Factorio, The Space Between) makes engineering concepts accessible without dumbing them down.**
   Mapping electrical distribution to redstone circuits isn't simplification -- it's translation to a domain the learner already understands. The mathematical connections are preserved.
   _🤖 Status: `applied` (applied in `v1.49.17`) · lesson #256 · needs review_
   > LLM reasoning: The Space Between release directly delivers the educational bridge concept from the lesson.

5. **12 phases and 30 plans is the largest release since v1.33 (14 phases).**
   The scope spans fluid, power, thermal, blueprint, dimensional analysis, simulation, construction docs, and creative pipeline -- essentially 8 engineering disciplines in one release. Any one of these could be a standalone release.
   _🤖 Status: `investigate` · lesson #257 · needs review_
   > LLM reasoning: Release Integrity & Agent Heartbeat is unrelated to scope sizing observations.

6. **80 ISA-5.1 + IEEE C2-2023 symbols in SVG are a maintenance commitment.**
   Symbol libraries need updates when standards revise. 80 symbols is a meaningful surface area to maintain for standard compliance.
   _⚙ Status: `investigate` · lesson #258_

7. **Minecraft redstone and Factorio blueprints as educational bridges are creative but untested against actual game versions.**
   Game updates can change redstone mechanics or blueprint formats. These outputs need version-pinning or validation against specific game versions.
   _🤖 Status: `investigate` · lesson #259 · needs review_
   > LLM reasoning: Heritage Skills Educational Pack snippet doesn't clearly indicate game version pinning or validation.
