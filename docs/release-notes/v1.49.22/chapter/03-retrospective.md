# Retrospective — v1.49.22

## What Worked

- **Research browser architecture is proven** -- The COL/CAS/ECO/GDN browsers all use the same client-side markdown rendering pattern. Adding a new research topic is now a matter of content, not engineering.
- **Master index creates discoverability** -- Deep cross-linking between browsers makes the collection navigable as a whole rather than isolated silos.
- **Math co-processor CPU fallback** -- Every GPU operation has a NumPy CPU fallback, so the system works on any machine. GPU acceleration is a performance bonus, not a requirement.
- **Config-driven chip activation** -- Chips can be enabled/disabled via configuration, avoiding loading unnecessary GPU contexts.

## What Could Be Better

- **Research content is large** -- Individual research files (flora at 1,221 lines, aquatic at 802 lines) are substantial. A search/filter mechanism within browsers would help navigation.
- **No automated research verification** -- Verification documents are manually authored. Automated cross-reference checking would catch errors.

## Lessons Learned

1. **Static HTML + client-side markdown is the right architecture for research browsers.** No build step, no dependencies, works offline, loads instantly. The pattern scales across topics without engineering overhead.
2. **GPU math needs CPU parity.** Building the CPU fallback first, then adding GPU acceleration on top, ensures correctness testing isn't blocked by hardware availability. The fallback also serves as the oracle for GPU result verification.
3. **5-chip separation is the right granularity.** Each chip maps to a distinct mathematical domain with different GPU library backends (cuBLAS, cuFFT, cuSOLVER, cuRAND, NVRTC). Finer would fragment; coarser would create a monolith.
4. **3 research agents + direct writing is a reliable pattern.** When individual research agents fail (as cas-611 and cas-613-fauna did in the CAS run), writing the document directly is always available as a fallback. Agent failures shouldn't block content delivery.
