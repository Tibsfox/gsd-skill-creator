# v1.36 — Citation Management & Source Attribution

**Shipped:** 2026-02-26
**Phases:** 351-358 (8 phases) | **Plans:** 16 | **Commits:** 17 | **Requirements:** 71 | **Tests:** 280 | **LOC:** ~14.2K

Citation tracking, source attribution, and bibliography generation system integrated into skill-creator's sc:learn pathway, maintaining provenance chains from original author through derived works with formatted bibliography output including a publication-ready bibliography for "The Space Between."

### Key Features

**Multi-Format Citation Extractor (Phase 351):**
- 8 regex patterns (APA, narrative, numbered, DOI, ISBN, URL, bibliography section, informal prose)
- DOI detector with normalization, URL resolver with domain classification
- Bibliography parser with cross-reference boost and author+year dedup
- 63 extraction tests

**Citation Store (Phase 352):**
- JSONL-backed store with 3-tier deduplication (DOI, ISBN, title similarity via Levenshtein)
- SHA-256 deterministic IDs, field indexes (DOI/ISBN/title/author/tag)
- Provenance chain tracker with dual-index JSONL
- Bidirectional queries (source to artifacts, artifact to sources)
- Chain traversal with depth limit and circular detection

**6-Adapter Resolution Cascade (Phase 353):**
- CrossRef, OpenAlex, NASA NTRS, GitHub (with CITATION.cff), Internet Archive, generic web fallback
- Injectable fetch, 30-day TTL caching, token bucket rate limiting, graceful timeout/error handling
- Confidence cascade: stop at >=0.70, continue at 0.50-0.69, unresolved below 0.50

**Bibliography Generator (Phase 354):**
- 5 formats: BibTeX (LaTeX escaping, key dedup), APA 7th (1/2/3-20/21+ author rules), Chicago 17th (notes-bibliography), MLA 9th (containers model), custom Mustache templates
- Attribution report classifying claims into 5 categories (cited/common/novel/original/unattributed)
- Integrity auditor with completeness scoring and broken reference detection

**Learn Pipeline Integration (Phase 355):**
- SAFE-06 fault isolation: pre-hook extracts and resolves citations (<5% overhead)
- Post-hook links skills to provenance asynchronously
- Non-destructive [CITE:id] annotation injection
- Knowledge tier linker (summary/active/reference priority)

**Discovery CLI & Dashboard (Phase 356):**
- 6 commands: search, trace, verify, export, enrich, status
- Citation graph walker with cycle detection
- Dashboard citation panel with provenance tree viewer
- Green/yellow/red integrity badges

**"The Space Between" Bibliography (Phase 357):**
- 10 curated references (Sagan, Shannon, Lindenmayer, Euclid, Pythagoras, Clausius, Heisenberg, Mac Lane, Gibbs, Fourier)
- BibTeX + APA7 output
- Attribution report distinguishing philosophical originals from cited foundations

**Citation Chipset (Phase 358):**
- 6 skills, 4 agents (LIBRARIAN, ARCHIVIST, SCRIBE, AUDITOR)
- 2 communication loops
- Pre/post-deploy evaluation gates

## Retrospective

### What Worked
- **6-adapter resolution cascade with confidence thresholds.** CrossRef, OpenAlex, NASA NTRS, GitHub, Internet Archive, and web fallback -- each adapter tries in order, stopping at >=0.70 confidence. This avoids both false positives (low threshold) and wasted API calls (always running all adapters).
- **5 bibliography output formats cover the real use cases.** BibTeX, APA 7th, Chicago 17th, MLA 9th, and custom Mustache templates handle academic, professional, and project-specific citation needs. The Mustache escape hatch avoids format proliferation.
- **Provenance chain with bidirectional queries.** Being able to trace from source to artifacts AND from artifact back to sources makes the citation store an audit tool, not just a database. Chain traversal with depth limits and circular detection handles real-world citation graphs.
- **Non-destructive [CITE:id] annotation injection.** Integrating citations into the learn pipeline without modifying source content means citations are additive metadata, not destructive edits.

### What Could Be Better
- **10 curated references for The Space Between is a small bibliography.** Given the 451 primitives across 10 domains in v1.35, the attribution surface is much larger than 10 sources. This is a proof-of-concept bibliography, not a complete one.
- **Levenshtein title similarity for deduplication has known failure modes.** Titles with minor formatting differences (capitalization, subtitle punctuation) can defeat string-distance dedup. Semantic similarity would be more robust but harder to implement.

## Lessons Learned

1. **Citation management is infrastructure, not bookkeeping.** The 6-adapter cascade, JSONL store with SHA-256 IDs, and provenance chain tracker add up to a system that can answer "where did this knowledge come from?" at any point in the pipeline. That question becomes critical when sc:learn ingests external content.
2. **Attribution categories (cited/common/novel/original/unattributed) make the invisible visible.** Most knowledge systems treat all content as equally sourced. Classifying claims into 5 categories forces explicit acknowledgment of what is novel vs. what is borrowed.
3. **Rate limiting and TTL caching on external resolution adapters prevent operational embarrassment.** 6 adapters hitting external APIs without token bucket rate limiting and 30-day TTL caching would create reliability issues and potential API bans.

---
