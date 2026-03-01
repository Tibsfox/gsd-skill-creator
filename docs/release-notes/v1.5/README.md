# v1.5 — Pattern Discovery

**Shipped:** 2026-02-07
**Phases:** 24-29 (6 phases) | **Plans:** 20 | **Requirements:** 27

Automated scanning of session logs to discover recurring workflows and generate draft skills.

### Key Features

- Session log scanning with incremental watermarks (only processes new entries)
- Tool sequence n-gram extraction (bigrams and trigrams)
- DBSCAN clustering for grouping similar patterns without predefined cluster count
- File co-occurrence analysis for detecting related file access patterns
- Draft skill generation from discovered patterns with confidence scoring
- CLI commands: `skill-creator scan`, `skill-creator patterns`

---
