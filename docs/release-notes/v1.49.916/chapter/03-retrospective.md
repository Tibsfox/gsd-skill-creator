# Retrospective — v1.49.916

## What worked

- **Reproduce before believing the handoff.** The handoff's option-3 root cause ("PG-credential bug makes refresh exit 1") was stated confidently, but a 3-way empirical reproduction (`run-with-pg quality-drift-check`; direct un-wrapped invocation; reading the shell wrapper's documented exit-code contract) showed it was a misattribution. The exit-1 was *legitimate drift detection*; the SASL was a *separate* opaque-error wart on the un-wrapped path. Fixing the misdiagnosed bug (the SASL) would NOT have met the operator's "stop exiting 1" goal. Correcting the root cause first is what produced the right fix (`refresh.mjs` advisory handling). Ironically, this ship corrected a misattribution exactly like the one v915 itself corrected (the atlas-deps-audit "flake").
- **A fix that un-masks is doing its job.** Making `drift-check` advisory let the `audit` step run for the first time in ~330 ships (it had been skipped behind the drift-abort every ship). It immediately surfaced AC7's hidden FAIL. The change didn't *cause* the failure — it *revealed* it. Treating the un-masking as a feature (not a regression) is what turned a "my change broke audit" reflex into a real defect closure.
- **Adversarial review before ship.** A 4-dimension review workflow (PG fix / refresh+guard / codification accuracy / scope+convention), each finding independently verified, returned **0 confirmed blocker/major defects** and 2 actionable minors — both closed (db.mjs passwordless-edge preservation + accurate docstring; the refresh dead-branch nit was left as inert + tied to the AC7 audit-fatal design question).
- **Lightest-wire enforcement.** The AC7 fix is a narrow, exact-match, per-file `leak_scan_allowlist` — it never relaxes the security gate globally. The leakScan gate was made dependency-injectable so its logic is unit-testable without config coupling, and a real-config regression test pins the specific v588 false positive.
- **Codification grounded in evidence.** The #10461 three-instance table (v913/v914/v915) was lifted directly from the v915 04-lessons evidence; the review's fact-check dimension confirmed it matches exactly (versions, drift-forms, artifact names).

## What didn't (and how it was handled)

- **The handoff's stated bug was wrong.** See above — corrected by reproduction. Lesson: an opaque error message (`SASL: client password must be a string`) is a *misdiagnosis generator*; the db.mjs loud-error fix is as much about preventing the *next* wrong root cause as about the immediate UX.
- **AC7 was orthogonal scope.** It is a third concern (security leak-scanner + www publishing) the operator did not originally authorize. Rather than auto-fix a security gate unilaterally, it was characterized fully (self-referential FP, one pattern, one file) and surfaced via AskUserQuestion; the operator chose the narrow-allowlist fix, which was then implemented.
- **A pre-existing inert smell carried through.** `refresh.mjs`'s `if (step.name === 'audit') break;` followed by an unconditional `break;` (with a misleading "keep going elsewhere" comment) is dead because `audit` is the last step. It was preserved verbatim into the new `main()` rather than "cleaned up," because changing audit's fatal-ness is a design decision entangled with AC7 — out of scope for a mechanical refactor.

## Surprises

- The effective leak patterns live in the **gitignored** `release-history.local.json` (private: `fox-companies`, `maple@tibsfox`, `PGPASSWORD`), which *replaces* the base config's 2 patterns. So the AC7 block is operator-machine-specific (a fresh CI checkout has only the base patterns). The committed allowlist entry references a local-only pattern and is harmlessly inert where that pattern is absent.
- `gh run watch --exit-status` unreliability (noted at v915) is a sibling of this ship's theme: trust the authoritative status (`gh run view` / a direct re-run), not a convenience wrapper's exit code.
