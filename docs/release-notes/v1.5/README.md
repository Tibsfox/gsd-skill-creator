# v1.5 — Pattern Discovery

**Shipped:** 2026-02-07
**Phases:** 24-29 (6 phases) | **Plans:** 20 | **Requirements:** 27

Automated scanning of session logs to discover recurring workflows and generate draft skills.

### Key Features

- Session log scanning with incremental watermarks (only processes new entries)
- Tool sequence n-gram extraction (bigrams through 5-grams)
- DBSCAN clustering for grouping similar patterns without predefined cluster count
- File co-occurrence analysis for detecting related file access patterns
- Draft skill generation from discovered patterns with confidence scoring
- CLI commands: `skill-creator scan`, `skill-creator patterns`

## Retrospective

### What Worked
- **DBSCAN clustering is the right algorithm for pattern discovery.** No predefined cluster count means the system discovers how many patterns exist rather than forcing data into a fixed number of buckets. This is essential when you don't know the domain shape in advance.
- **Incremental watermarks for session log scanning avoid re-processing.** Only scanning new entries means the cost of discovery stays proportional to new work, not total history. This scales.
- **N-gram extraction (bigrams through 5-grams) captures tool sequences at multiple granularities.** A 2-gram catches simple pairs; a 5-gram catches complex workflows. The range lets the system find patterns at the right abstraction level.

### What Could Be Better
- **Confidence scoring on draft skills needs validation against real acceptance rates.** Without feedback on whether generated drafts are actually useful, the confidence scores are uncalibrated -- they measure internal consistency, not external value.
- **20 plans across 27 requirements is heavy for a discovery system.** The discovery pipeline itself is now complex enough to need its own testing -- and it will need its own test cases from v1.2's infrastructure.

## Lessons Learned

1. **File co-occurrence analysis detects implicit relationships.** Files that are always modified together reveal structural coupling that isn't visible in import graphs or dependency declarations.
2. **Draft skill generation closes the loop from observation to action.** Without it, pattern discovery produces interesting data but no executable output. The draft is the bridge from "we noticed this" to "here's what to do about it."
3. **CLI commands (`scan`, `patterns`) make discovery an on-demand operation.** The user decides when to look for patterns, which keeps the system predictable rather than surprising.

---
