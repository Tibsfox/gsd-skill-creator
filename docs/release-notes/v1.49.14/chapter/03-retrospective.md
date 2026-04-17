# Retrospective — v1.49.14

## What Worked

- **Six-module pipeline with clear blast radius control.** Auditor -> Diagnostician -> Discoverer -> Resolver -> Absorber -> Integration, with one dependency per resolution invocation and backup-before-every-change. The pipeline design means each module can fail independently without corrupting state.
- **Code Absorber criteria gate is appropriately conservative.** <=500 LOC, stable API, pure functions, <=20% of package's API surface, hard block on crypto/parsers/protocols/compression. The `natural` package replacement from v1.49.6 (~250 LOC of TF-IDF + Naive Bayes) would pass these criteria; most npm packages would not. That's the right selectivity.
- **5 package ecosystem coverage (npm, PyPI, conda, crates.io, RubyGems).** The multi-ecosystem manifest parsing matches the project's actual dependency landscape (TypeScript + Rust + Python for ML).
- **Oracle testing with 10K+ generated cases before absorption.** High confidence that internalized code behaves identically to the original. This is the formal verification approach applied to dependency replacement.

## What Could Be Better

- **353 new tests for 10,680 LOC across 86 files.** The test-to-source ratio (~3.3%) is lower than v1.49.8's coverage. The Absorber module in particular handles complex state transitions that would benefit from more edge case coverage.
- **Cross-project pattern learning requires 5+ projects to trigger.** For a single-project setup (which is the current default), this feature is dormant. The threshold makes sense for a multi-project ecosystem but provides no value until that ecosystem exists.

## Lessons Learned

1. **One dependency per resolution invocation is the correct blast radius.** When something breaks, you know exactly which change caused it. Batch dependency updates are a false efficiency.
2. **Code absorption has a hard ceiling of applicability.** The criteria gate (<=500 LOC, pure functions, no crypto/parsers) correctly identifies the narrow band where internalization is safer than dependency management. Most packages are too large, too stateful, or too security-sensitive.
3. **Append-only health logs with mandatory provenance create an auditable supply chain record.** Timestamp + packageVersion + decisionRationale in every entry means the "why" of every dependency decision is preserved.
4. **The <=20% tranche replacement pattern prevents big-bang breakage during absorption.** Gradual call-site migration with the old and new implementations running in parallel is the safe path.
