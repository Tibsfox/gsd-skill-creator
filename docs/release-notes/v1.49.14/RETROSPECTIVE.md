# v1.49.14 Retrospective — Dependency Health Monitor & Progressive Internalization Engine

**Shipped:** 2026-03-03
**Phases:** 6 (44-49) | **Plans:** 26 | **Commits:** 21 | **Tests:** 353 new

## What Was Built
- Dependency auditor with 5-ecosystem manifest parsing and OSV.dev vulnerability scanning
- Health diagnostician with 6-class classification and ecosystem-aware thresholds
- Alternative discoverer with 4 search strategies (successor, fork, equivalent, internalization candidate)
- Dependency resolver with backup/dry-run/HITL/rollback safety chain
- Code absorber with criteria gate, oracle testing (10K+ cases), and gradual call-site replacement
- Integration layer with append-only health.jsonl, staging gate, and cross-project pattern learning

## What Worked
- **Six-module pipeline**: Clean separation (audit->diagnose->discover->resolve->absorb->integrate) made each module independently testable and deployable
- **Multi-ecosystem adapters**: Uniform interface across npm/PyPI/conda/crates.io/RubyGems meant adding a new ecosystem is mechanical
- **Oracle testing for absorption**: 10K+ generated test cases caught behavioral differences that unit tests would have missed
- **One-dep-per-resolution**: Blast radius control worked exactly as intended — every resolution is traceable to a single dependency change
- **Append-only health log**: Consistent with v1.49.13 telemetry pattern — proven, auditable, no migration risk
- **Rate limiter**: Shared <=30 req/60s aggregate across all registry adapters prevented rate limiting issues during testing

## What Was Inefficient
- **Criteria gate tuning**: The <=500 LOC / <=20% API surface thresholds for code absorption were conservative — some packages that could have been safely absorbed were excluded
- **Hard block list maintenance**: The crypto/parsers/protocols/compression block list is correct but maintaining it as new categories emerge requires manual review
- **Evidence scoring calibration**: Confidence scores for alternative discovery needed multiple iterations to produce reliable rankings

## Patterns Established
- **Supply chain immune system**: Six-module pipeline from manifest scanning to human-approved remediation
- **Criteria gate for absorption**: Size, stability, purity, and API surface as objective go/no-go criteria
- **Hard block categories**: Crypto, parsers, protocols, compression — never automate absorption for security-sensitive code
- **Cross-project pattern learning**: After 5+ projects flag the same dependency, generate pre-emptive warnings

## Key Lessons
- Supply chain security is a pipeline problem, not a point solution — each module handles exactly one concern
- Human-in-the-loop gates are essential for dependency changes — even with dry-run verification, silent changes are unacceptable
- Oracle testing is the gold standard for behavioral equivalence — unit tests check known cases, oracles discover unknown ones
- Code absorption must be gradual (<=20% per cycle) — big-bang replacement introduces too much risk
- Pattern learning across projects is where the real value emerges — individual project scanning is necessary but insufficient
