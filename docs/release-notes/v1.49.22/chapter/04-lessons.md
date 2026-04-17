# Lessons — v1.49.22

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Static HTML + client-side markdown is the right architecture for research browsers.**
   No build step, no dependencies, works offline, loads instantly. The pattern scales across topics without engineering overhead.
   _🤖 Status: `applied` (applied in `v1.49.36`) · lesson #362 · needs review_
   > LLM reasoning: AWF Living Systems research browser reuses the static HTML + client-side markdown pattern at a new scale.

2. **GPU math needs CPU parity.**
   Building the CPU fallback first, then adding GPU acceleration on top, ensures correctness testing isn't blocked by hardware availability. The fallback also serves as the oracle for GPU result verification.
   _🤖 Status: `investigate` · lesson #363 · needs review_
   > LLM reasoning: Math Co-Processor completion is named but snippet doesn't explicitly confirm CPU-parity-first discipline.

3. **5-chip separation is the right granularity.**
   Each chip maps to a distinct mathematical domain with different GPU library backends (cuBLAS, cuFFT, cuSOLVER, cuRAND, NVRTC). Finer would fragment; coarser would create a monolith.
   _⚙ Status: `investigate` · lesson #364_

4. **3 research agents + direct writing is a reliable pattern.**
   When individual research agents fail (as cas-611 and cas-613-fauna did in the CAS run), writing the document directly is always available as a fallback. Agent failures shouldn't block content delivery.
   _🤖 Status: `investigate` · lesson #365 · needs review_
   > LLM reasoning: AWF release snippet doesn't confirm the 3-agent + direct-writing fallback was used.

5. **Research content is large**
   Individual research files (flora at 1,221 lines, aquatic at 802 lines) are substantial. A search/filter mechanism within browsers would help navigation.
   _🤖 Status: `investigate` · lesson #366 · needs review_
   > LLM reasoning: Candidate adds more research content but snippet doesn't mention an in-browser search/filter mechanism.

6. **No automated research verification**
   Verification documents are manually authored. Automated cross-reference checking would catch errors.
   _🤖 Status: `investigate` · lesson #367 · needs review_
   > LLM reasoning: AWF Living Systems Research snippet doesn't indicate automated verification was added.
