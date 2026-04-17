# Lessons — v1.45

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Agent discovery layers (llms.txt, AGENTS.md, JSON-LD) are the sitemap.xml of the AI era.**
   Just as search engines need structured metadata to index sites, AI agents need structured discovery documents to navigate them. Building these into the static site generator makes them automatic, not afterthoughts.
   _🤖 Status: `investigate` · lesson #236 · needs review_
   > LLM reasoning: v1.46 Upstream Intelligence Pack concerns change monitoring, not llms.txt/AGENTS.md discovery layers.

2. **A custom static site generator is justified when the output requirements are non-standard.**
   Citation syntax, agent discovery layers, WordPress content sync, and progressive disclosure templates are not features available in off-the-shelf SSGs. The custom build cost is offset by exact-fit output.
   _⚙ Status: `investigate` · lesson #237_

3. **Quality audit (link checking, HTML validation, size checks, agent file consistency) at build time catches problems before deployment.**
   Running the audit as part of the build pipeline means broken links and invalid HTML never reach production.
   _🤖 Status: `investigate` · lesson #238 · needs review_
   > LLM reasoning: Candidate v1.46 Upstream Intelligence Pack is unrelated to build-time quality audits for links/HTML.

4. **The site architecture documents the project's public face.**
   The 5-phase incremental migration plan from v1.34 now has a concrete implementation. The static site generator is the execution of that plan.
   _🤖 Status: `investigate` · lesson #239 · needs review_
   > LLM reasoning: Filesystem reorganization snippet is too vague to confirm it documents public site architecture.

5. **243 tests across 87 files for a full static site generator is spread thin.**
   The pipeline spans markdown processing, template rendering, CSS generation, search indexing, citation resolution, agent discovery, WordPress sync, and FTP deployment. Each subsystem needs its own test depth.
   _🤖 Status: `investigate` · lesson #240 · needs review_
   > LLM reasoning: Upstream Intelligence Pack adds new subsystem rather than deepening existing test coverage for static site generator.

6. **FTP/rsync deployment is functional but fragile.**
   Dry-run and verification help, but deployment without a staging environment means the first real deployment is also the first production deployment.
   _⚙ Status: `investigate` · lesson #241_
