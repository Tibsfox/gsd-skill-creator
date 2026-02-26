# v1.36 Retrospective — Citation Management & Source Attribution

**Shipped:** 2026-02-26
**Phases:** 8 (351-358) | **Plans:** 16 | **Commits:** 17 | **Sessions:** 1
**Tests:** 280 | **Source LOC:** ~14.2K | **Requirements:** 71/71

### What Was Built
- Multi-format citation extractor: 8 regex patterns (APA, narrative, numbered, DOI, ISBN, URL, bibliography section, informal prose), DOI detector with normalization, URL resolver with domain classification, bibliography parser with cross-reference boost and author+year dedup
- JSONL-backed citation store with 3-tier deduplication (DOI, ISBN, title similarity via Levenshtein >0.92), SHA-256 deterministic IDs, field indexes, provenance chain tracker with dual-index JSONL and bidirectional queries
- 6-adapter source resolution cascade: CrossRef, OpenAlex, NASA NTRS, GitHub (CITATION.cff), Internet Archive, generic web — all with injectable fetch, 30-day TTL caching, token bucket rate limiting, and graceful timeout handling. Confidence cascade: stop at ≥0.70, continue at 0.50-0.69, unresolved below 0.50
- Bibliography generation in 5 formats (BibTeX, APA 7th, Chicago 17th, MLA 9th, custom Mustache templates), attribution report classifying claims into 5 categories, integrity auditor with completeness scoring
- Learn pipeline integration with SAFE-06 fault isolation: pre-hook extracts and resolves citations (<5% overhead), post-hook links skills to provenance asynchronously, non-destructive [CITE:id] annotation injection
- Discovery CLI (6 commands), citation graph walker with cycle detection, dashboard citation panel with provenance tree viewer and green/yellow/red integrity badges
- "The Space Between" bibliography: 10 curated references with BibTeX + APA7 output and attribution report
- Citation management chipset: 6 skills, 4 agents (LIBRARIAN, ARCHIVIST, SCRIBE, AUDITOR), 2 communication loops

### What Worked
- **4-wave execution with max 3 parallel tracks**: 16 plans completed in ~48 min active execution time; best throughput yet at ~3 min/plan average
- **Pre-built VTM mission package**: 15-document mission consumed directly by new-milestone — zero research phase needed, immediate wave planning
- **1:1 commit-to-plan ratio**: 16 commits for 16 plans gave excellent atomic rollback granularity
- **Injectable function patterns (ExtractFn, FormatterFn, AuditFn)**: Port interfaces decoupled all modules for maximum parallel track independence
- **7 auto-fixed deviations, zero manual intervention**: All bugs caught and fixed by executor agents during plan execution — Zod v4 compat, DOI trailing periods, gitignore anchor patterns
- **Single-session execution**: Entire milestone completed in one context window, no session boundary overhead

### What Was Inefficient
- **gsd-tools milestone complete bugs still persist**: Same issues as v1.35 — wrong phase/plan counts, wrong accomplishments, wrong insertion order. Manual fixup again required
- **Roadmap plan-count tracking stale**: Phases 353, 354, 358 show partial counts ("1/2", "1/3") in archived roadmap despite all plans being complete — the ROADMAP wasn't fully updated before archival
- **Gitignore collision**: Phase 357-02 was blocked by an anchored `/dashboard/` pattern in .gitignore that matched `src/citations/dashboard/`. Auto-fixed but avoidable with more specific gitignore patterns from the start
- **No v1.36 retrospective written before archival**: v1.36 shipped and archived without updating RETROSPECTIVE.md, requiring retroactive reconstruction from commit history and phase summaries

### Patterns Established
- **Confidence cascade with early stopping**: Resolution pipeline stops at ≥0.70 confidence match, reducing API calls by ~40% vs exhaustive search
- **3-tier deduplication (DOI → ISBN → title similarity)**: Layered dedup catches exact matches fast and falls back to fuzzy matching only when needed
- **Non-destructive annotation injection**: [CITE:id] markers placed near extraction points using 500-char text proximity windows — reversible without content loss
- **Provenance dual-index pattern**: Separate source→artifacts and artifact→sources JSONL files enable O(1) bidirectional lookups with consistency verification
- **Format registry for pluggable renderers**: BibliographyFormatter uses format-keyed registry for extensible output without modifying core generation logic

### Key Lessons
1. **Port interfaces are the parallelism multiplier**: CitationStorePort, FormatterFn, AuditFn, ExtractFn — every cross-module dependency expressed as an interface enabled Wave 1 and Wave 2 to run with 3 parallel tracks each
2. **Levenshtein title dedup at 0.92 threshold balances precision/recall**: Lower thresholds merged distinct works; higher thresholds missed reformatted titles. 0.92 caught "Introduction to..." vs "An Introduction to..." while keeping distinct works separate
3. **Fault isolation (SAFE-06) should be a standard pattern**: Citation failure never blocking skill generation proved the principle — all optional pipeline stages should use try/catch wrappers with fallback to no-op
4. **Write the retrospective BEFORE archival**: Reconstructing execution data from git history and phase summaries works but wastes time — future milestones should update RETROSPECTIVE.md as the final pre-archival step
5. **Single-session milestones are achievable up to ~16 plans**: v1.36 (16 plans, 1 session) vs v1.35 (50 plans, 2 sessions) — the boundary is roughly 16-20 plans per context window

### Cost Observations
- Model mix: ~30% Opus (learn hooks, integration), ~65% Sonnet (types, extractor, store, resolver, generator, CLI, dashboard), ~5% Haiku (scaffolding)
- Sessions: 1 (entire milestone in single context window)
- Notable: 8 phases in ~48 min active = ~6 min/phase average; fastest per-phase velocity yet

---
