# Lessons — v1.49.89

15 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Front-loaded planning scales mega-waves that ad-hoc planning cannot reach.**
   **Front-loaded planning scales mega-waves that ad-hoc planning cannot reach.**
   _⚙ Status: `investigate` · lesson #3931_

2. **Cluster restructuring is the structural payoff of a large Research wave.**
   **Cluster restructuring is the structural payoff of a large Research wave.**
   _⚙ Status: `investigate` · lesson #3932_

3. **Extensions are a legitimate mega-wave slot type alongside new projects.**
   **Extensions are a legitimate mega-wave slot type alongside new projects.**
   _⚙ Status: `investigate` · lesson #3933_

4. **Append-only-at-module-level is the right edit discipline for deepening existing work.**
   **Append-only-at-module-level is the right edit discipline for deepening existing work.**
   _⚙ Status: `investigate` · lesson #3934_

5. **Content filters are a recoverable failure mode, not a session-killer.**
   **Content filters are a recoverable failure mode, not a session-killer.**
   _⚙ Status: `investigate` · lesson #3935_

6. **Parser degradation under release-complexity growth is systematic, not incidental, and warrants a parser refactor.**
   **Parser degradation under release-complexity growth is systematic, not incidental, and warrants a parser refactor.**
   _⚙ Status: `investigate` · lesson #3936_

7. **The Mayor-Polecat convoy model is now a proven pattern at two scales and should be captured as a reusable orchestration template.**
   **The Mayor-Polecat convoy model is now a proven pattern at two scales and should be captured as a reusable orchestration template.**
   _⚙ Status: `investigate` · lesson #3937_

8. **Music earning a 22-member dedicated cluster is a structural signal that some domains exceed their initial taxonomic slot.**
   **Music earning a 22-member dedicated cluster is a structural signal that some domains exceed their initial taxonomic slot.**
   _⚙ Status: `investigate` · lesson #3938_

9. **Release-notes length should scale with session magnitude.**
   **Release-notes length should scale with session magnitude.**
   _⚙ Status: `investigate` · lesson #3939_

10. **Three-commit-capstone choreography is the right pattern for session-terminus releases.**
   **Three-commit-capstone choreography is the right pattern for session-terminus releases.**
   _⚙ Status: `investigate` · lesson #3940_

11. **The parser-generated chapter files landed at confidence 0.35 rather than the typical 0.90+.**
   The parser's heuristics were designed for single-topic feature releases and did not handle the Mega Batch's multi-cluster-multi-extension-multi-Rosetta shape. The low confidence did not block publication but it flagged the README as parser-unfriendly and triggered this manual uplift pass. A parser revision that detects mega-wave release shapes and dispatches to a different strategy (or skips auto-generation entirely) would eliminate the round-trip.
   _⚙ Status: `investigate` · lesson #3941_

12. **The release-notes stub at 81 lines under-represented a 204K-line session.**
   The original v1.49.89 README was a concise statistics-and-bulleted-clusters summary that served as a release-notes stub but not as a readable artifact for a reader entering the Mega Batch cold. The ratio of session-magnitude (49 projects + 6 extensions + 3 new clusters) to release-notes-length (81 lines) was off by roughly two orders of magnitude. This uplift corrects that by expanding the README to A-grade depth while preserving the stub's statistics intact.
   _⚙ Status: `investigate` · lesson #3942_

13. **Six extensions landing in one commit lost per-extension bisect granularity.**
   The bisect-intent preservation argument above is sound, but a reader trying to isolate "which extension landed which text" has to diff within the commit rather than across commits. A future mega-wave-extensions pattern could use wave-commit markers (the CLAUDE.md convention) to annotate each extension's boundaries within the single combined commit, preserving both session-atomicity and per-extension locatability.
   _⚙ Status: `investigate` · lesson #3943_

14. **The Rosetta Stone restructure changed existing cluster membership but the change log is implicit.**
   Music members that were previously in Creative & Cultural are now in Music; broadcasting members that were previously scattered are now in Broadcasting & Spectrum. The `ROSETTA.md` diff shows the new structure but does not declare which projects moved between clusters. A "Cluster Membership Changes" section at the top of the Rosetta commit would make the reassignment explicit for readers following the cross-domain index over time.
   _⚙ Status: `investigate` · lesson #3944_

15. **No explicit Mega Batch playbook was captured alongside the session.**
   The Mega Batch is reproducible in principle (the Mayor-Polecat convoy, five-pass planning, wave sequencing) but the specific command sequences, agent configuration, and recovery protocols are in session logs rather than a captured playbook. A future Mega Batch attempt would benefit from `.planning/missions/mega-batch/PLAYBOOK.md` capturing the exact orchestration steps.
   _⚙ Status: `investigate` · lesson #3945_
