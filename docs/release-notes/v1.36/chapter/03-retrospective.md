# Retrospective — v1.36

## What Worked

- **6-adapter resolution cascade with confidence thresholds.** CrossRef, OpenAlex, NASA NTRS, GitHub, Internet Archive, and web fallback -- each adapter tries in order, stopping at >=0.70 confidence. This avoids both false positives (low threshold) and wasted API calls (always running all adapters).
- **5 bibliography output formats cover the real use cases.** BibTeX, APA 7th, Chicago 17th, MLA 9th, and custom Mustache templates handle academic, professional, and project-specific citation needs. The Mustache escape hatch avoids format proliferation.
- **Provenance chain with bidirectional queries.** Being able to trace from source to artifacts AND from artifact back to sources makes the citation store an audit tool, not just a database. Chain traversal with depth limits and circular detection handles real-world citation graphs.
- **Non-destructive [CITE:id] annotation injection.** Integrating citations into the learn pipeline without modifying source content means citations are additive metadata, not destructive edits.

## What Could Be Better

- **10 curated references for The Space Between is a small bibliography.** Given the 451 primitives across 10 domains in v1.35, the attribution surface is much larger than 10 sources. This is a proof-of-concept bibliography, not a complete one.
- **Levenshtein title similarity for deduplication has known failure modes.** Titles with minor formatting differences (capitalization, subtitle punctuation) can defeat string-distance dedup. Semantic similarity would be more robust but harder to implement.

## Lessons Learned

1. **Citation management is infrastructure, not bookkeeping.** The 6-adapter cascade, JSONL store with SHA-256 IDs, and provenance chain tracker add up to a system that can answer "where did this knowledge come from?" at any point in the pipeline. That question becomes critical when sc:learn ingests external content.
2. **Attribution categories (cited/common/novel/original/unattributed) make the invisible visible.** Most knowledge systems treat all content as equally sourced. Classifying claims into 5 categories forces explicit acknowledgment of what is novel vs. what is borrowed.
3. **Rate limiting and TTL caching on external resolution adapters prevent operational embarrassment.** 6 adapters hitting external APIs without token bucket rate limiting and 30-day TTL caching would create reliability issues and potential API bans.

---
