# Lessons — v1.36

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Citation management is infrastructure, not bookkeeping.**
   The 6-adapter cascade, JSONL store with SHA-256 IDs, and provenance chain tracker add up to a system that can answer "where did this knowledge come from?" at any point in the pipeline. That question becomes critical when sc:learn ingests external content.
   _🤖 Status: `investigate` · lesson #192 · needs review_
   > LLM reasoning: Gource visualization is unrelated to citation management infrastructure.

2. **Attribution categories (cited/common/novel/original/unattributed) make the invisible visible.**
   Most knowledge systems treat all content as equally sourced. Classifying claims into 5 categories forces explicit acknowledgment of what is novel vs. what is borrowed.
   _⚙ Status: `investigate` · lesson #193_

3. **Rate limiting and TTL caching on external resolution adapters prevent operational embarrassment.**
   6 adapters hitting external APIs without token bucket rate limiting and 30-day TTL caching would create reliability issues and potential API bans.
---
   _🤖 Status: `investigate` · lesson #194 · needs review_
   > LLM reasoning: v1.42 git workflow skill does not address rate limiting or TTL caching on resolution adapters.

4. **10 curated references for The Space Between is a small bibliography.**
   Given the 451 primitives across 10 domains in v1.35, the attribution surface is much larger than 10 sources. This is a proof-of-concept bibliography, not a complete one.
   _🤖 Status: `investigate` · lesson #195 · needs review_
   > LLM reasoning: Candidate snippet is truncated and provides no evidence of bibliography expansion.

5. **Levenshtein title similarity for deduplication has known failure modes.**
   Titles with minor formatting differences (capitalization, subtitle punctuation) can defeat string-distance dedup. Semantic similarity would be more robust but harder to implement.
   _🤖 Status: `investigate` · lesson #196 · needs review_
   > LLM reasoning: v1.45 static site work does not touch Levenshtein deduplication logic.
