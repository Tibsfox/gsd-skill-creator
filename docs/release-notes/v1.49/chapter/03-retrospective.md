# Retrospective — v1.49

## What Worked

- **Three-part bundle design (intent + data + code) is the right abstraction.** Separating human-readable intent from structured data and executable scripts means each part can be validated independently. The 8-stage interpreter pipeline validates each layer without crossing concerns.
- **Adaptive fidelity model eliminates over-engineering.** Level 0 prose for simple handoffs, Level 3 full bundles for safety-critical ones — the system doesn't force heavyweight scaffolding on lightweight tasks. 95% accuracy across 20 test scenarios validates the decision model.
- **Safety architecture is structural, not advisory.** Object.freeze on script references (SAFE-01), mandatory provenance (SAFE-03), bounded fidelity changes (SAFE-02), and cooldown enforcement (SAFE-05) are enforced in code, not policy. 8/8 safety-critical tests passing.
- **Backward compatibility by design.** The .msg fallback (SAFE-08) means DACP bundles degrade to plain messages for systems that don't understand bundles. Migration is incremental, not a flag day.

## What Could Be Better

- **3 CLI field name mismatches shipped as accepted tech debt.** The `pattern` vs `handoff_type` mismatch across dacp-status, dacp-history, and dacp-analyze is presentation-only but creates confusion when reading code. Should have been caught in Phase 455 before verification.
- **22.7K LOC across 11 phases is dense for a communication protocol.** The scope grew from bundle format to include dashboard, CLI, templates, and bus integration. A tighter scope would have shipped the core protocol faster and added extensions incrementally.

## Lessons Learned

1. **Communication protocols need drift measurement built in from day one.** The retrospective analyzer (Phase 450) with weighted drift scores and pattern detection is what makes DACP self-correcting. Without it, fidelity levels would be static guesses.
2. **Cooldown enforcement prevents oscillation.** 7-day promote and 14-day demote cooldowns (SAFE-05) prevent the fidelity model from flip-flopping between levels. The asymmetric window — slower to demote than promote — builds trust in the system's stability.
3. **Wave planning pays off at 11-phase scale.** 5 waves with 3 parallel pairs kept the build on schedule. Sequential Wave 0 (types → format) was the right foundation order; parallel Wave 2 (analyzer+library | templates+bus) had zero merge conflicts.
4. **Append-only JSONL persistence is the right default for observability data.** Drift history, pattern records, and assembly rationale all use JSONL. No schema migrations, natural audit trail, trivial to query with grep.
