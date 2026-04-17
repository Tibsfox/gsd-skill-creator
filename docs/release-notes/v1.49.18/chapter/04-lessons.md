# Lessons — v1.49.18

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Mathematics education should start with wonder, not notation.**
   The 8 wonder stories with zero mathematical notation, followed by nature simulations, followed by formal content -- this progression respects how people actually build mathematical intuition.
   _⚙ Status: `investigate` · lesson #346_

2. **Standalone sub-projects with integration bridges are the right architecture for engines.**
   The Space Between Engine doesn't need skill-creator's build system to function, but it can bridge back when running inside the ecosystem. This is the cartridge composition pattern at the application level.
   _🤖 Status: `investigate` · lesson #347 · needs review_
   > LLM reasoning: Gastown Chipset Integration hints at bridge pattern but snippet too thin to confirm standalone+bridge architecture applied.

3. **Interactive visualizations turn abstract mathematics into tangible experience.**
   The Canvas RAF loop with FPS tracking and pointer normalization is reusable infrastructure. Any future interactive educational content should build on this foundation rather than reimplementing rendering.
   _⚙ Status: `investigate` · lesson #348_

4. **Foundation registry with full metadata (1,489 lines, 8 foundations, 6 phases each) is the engine's source of truth.**
   Centralizing all progression logic in one registry makes the system auditable and prevents scattered state.
   _⚙ Status: `applied` (applied in `v1.49.35`) · lesson #349_

5. **~24,536 LOC is the largest code addition in the entire v1.49.x series.**
   The engine is comprehensive (8 wings, 5 simulations, garden workshop, narrative layer, integration layer) but the maintenance surface is substantial. The Vite+React sub-project adds a second frontend framework to the overall project.
   _🤖 Status: `investigate` · lesson #350 · needs review_
   > LLM reasoning: PNW Research Series snippet doesn't address maintenance surface or dual-frontend concern.

6. **Garden creative workshop (art canvas, music studio, L-system editor, journal) is ambitious scope.**
   Tone.js integration for a music studio and L-system editors are features that each could be their own milestone. Whether they're all production-quality or proof-of-concept tier is unclear from the release notes.
   _⚙ Status: `investigate` · lesson #351_
