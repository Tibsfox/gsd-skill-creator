# Lessons — v1.47

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Educational packs that connect back to the host system create reinforcing understanding.**
   HD-08's mapping of skill-creator operations to dynamical systems theory means learning the math also deepens understanding of the tool. The educational content isn't separate from the product -- it explains the product's architecture.
   _🤖 Status: `investigate` · lesson #247 · needs review_
   > LLM reasoning: Filesystem Management Strategy doesn't visibly connect educational content to host system architecture.

2. **DMD variants exist because real data violates basic DMD assumptions.**
   Control inputs, multi-scale dynamics, physics constraints, and noisy measurements each require a specific algorithmic adaptation. Teaching the variants alongside the core algorithm prevents the learner from applying basic DMD to problems that need a variant.
   _🤖 Status: `investigate` · lesson #248 · needs review_
   > LLM reasoning: Voxel/Cedar/Data Source Registry snippet doesn't directly teach DMD variants alongside core algorithm.

3. **Try-session.ts files as interactive TypeScript demos lower the barrier to mathematical concepts.**
   Reading about eigenvalues is abstract. Running code that computes eigenvalues and plots them on the unit circle is concrete. Each module's try-session turns theory into hands-on experimentation.
   _🤖 Status: `investigate` · lesson #249 · needs review_
   > LLM reasoning: GSD-OS Indicator/TypeScript patch doesn't clearly add try-session.ts interactive demos for math concepts.

4. **The Feigenbaum constant (HD-05) and Meyerson inscribed polygons (HD-06) connect to active mathematical research.**
   The curriculum doesn't stop at classical results -- it reaches into contemporary mathematics, which keeps the content relevant and shows that the field is alive.
   _🤖 Status: `investigate` · lesson #250 · needs review_
   > LLM reasoning: Candidate snippet 'PNW Research Series' is too vague to confirm it extends Feigenbaum/Meyerson contemporary-math threads.

5. **209 tests for ~5.0K LOC is adequate but the educational modules (HD-01 through HD-10) don't have visible per-module test counts.**
   Each module has content.md and try-session.ts. Whether the try sessions are tested or just example code is unclear from the release notes.
   _🤖 Status: `investigate` · lesson #251 · needs review_
   > LLM reasoning: Candidate is the same Heritage pack referenced by the lesson; no evidence per-module test counts were added.

6. **Educational SVD (power iteration with deflation) is correct but slow.**
   The implementation choice prioritizes pedagogical clarity over performance. For the educational pack this is fine, but if DMD is ever used on real data, the SVD implementation would need replacement.
   _🤖 Status: `deferred` · lesson #252 · needs review_
   > LLM reasoning: No later release indicates the educational SVD was replaced with a performant implementation.
