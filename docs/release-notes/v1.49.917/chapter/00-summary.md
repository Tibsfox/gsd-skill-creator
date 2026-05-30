# v1.49.917 — Summary

**Counter-cadence ship #18.** Codify + audit-step semantics cleanup. No NASA degree advance (holds at 1.178, 135 consecutive ships). Both deliverables close forward-path items the v1.49.916 handoff named.

## The two deliverables

### 1. Audit-step semantics cleanup (refresh.mjs)

The release-history `refresh.mjs` pipeline loop carried an inert dead branch — `if (step.name === 'audit') break;` guarded by a comment claiming audit failure was "informational, keep going elsewhere." Both facts were false: `audit` is the last step (nothing runs "elsewhere"), `failed` was already set before the branch, and `audit` failure was in fact fatal. The v1.49.916 fix that made `audit` reachable on every refresh turned this latent smell into something worth resolving.

Decision: `audit` is a **load-bearing verification gate** — it runs the AC checks including the leak-scan — so its failure stays **fatal and loud** (failure-mode-contracts #10427), exactly like every other required step. The dead branch and false comment were removed, the decision documented inline, and a STEPS-array invariant comment added (`audit` must remain last, because the loop breaks on the first non-advisory failure). The change is behavior-preserving; the existing `refresh-advisory-exit` test already asserts `audit` is never advisory.

### 2. Codified lesson #10462 — describe the pattern, never quote the literal

The release-history publisher runs a hard leak-scan over published chapters; its effective patterns combine committed base patterns with operator-private patterns from a gitignored local file, so the scan is operator-machine-specific. Documenting leak-scan work has two recurring failure modes: a doc that quotes a scan *pattern* verbatim re-trips the scanner (a self-referential false-positive), and documenting the *fix* by enumerating the private *values* the scanner guards embeds a genuine leak. The v1.49.916 retrospective hit the second.

The rule: **describe the pattern, never quote the literal.** Paired with an allowlist-vs-scrub decision rule — a doc that legitimately quotes a *pattern* earns a narrow allowlist entry (keyed on the exact version + file + pattern, with a reason); content that embeds a private *value* must be **scrubbed**, never allowlisted. Codified in the security-hygiene skill, cross-referenced from the failure-mode-contracts discipline, and registered as #10462 in the manifest.

## Result

Tools suite 691 green (unchanged); render-claude-md no-drift; manifest lessons 148 → 149. Option 4 (private-pattern narrowing) deferred by operator decision.
