# Lessons — v1.30

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Vision document archetypes (Educational/Infrastructure/Organizational/Creative) enable automated processing decisions.**
   The archetype classifier drives downstream choices -- an Educational vision generates different milestone structures than an Infrastructure vision. This avoids treating all visions identically.
   _⚙ Status: `applied` (applied in `v1.43`) · lesson #157_

2. **Cache optimization with shared load detection and schema reuse analysis reduces token costs.**
   The gpt-tokenizer-based token savings estimation quantifies the benefit of caching, making budget conversations concrete rather than speculative.
   _⚙ Status: `applied` (applied in `v1.42`) · lesson #158_

3. **Risk factor analysis (cache TTL, interface mismatch, model capacity) should happen at planning time, not execution time.**
   Identifying risks during wave planning means mitigation strategies can be built into the plan structure before any agent starts executing.
---
   _⚙ Status: `applied` (applied in `v1.42`) · lesson #159_

4. **Template system uses Mustache-style {{name}} rendering.**
   Simple and effective, but the 7-template registry is static. As the system grows, a template discovery mechanism or directory-based registration would scale better.
   _⚙ Status: `applied` (applied in `v1.44`) · lesson #160_

5. **679 tests across 26 plans for 14 phases is adequate but the pipeline orchestrator (Phases 288-292) is the most critical component.**
   Error classification into recoverable/unrecoverable is good, but the recovery paths for recoverable errors aren't detailed in the release notes.
   _⚙ Status: `applied` (applied in `v1.45`) · lesson #161_
