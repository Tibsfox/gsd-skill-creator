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

---
