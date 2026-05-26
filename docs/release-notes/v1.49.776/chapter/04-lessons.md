# Lessons — v1.49.776

7 lesson candidates from the script-bug discovery + cleanup. Concrete lesson IDs assigned by the in-cycle retrospective tracker.

1. **Cleanup-completeness verification must include orthogonal damage signatures.** "Primary pattern gone" is insufficient as a success gate for a bulk transform. The v1.49.775 strip claimed success because the `substrate substrate` collapse-pattern was eliminated; it did not check post-state for orphan-tail damage shapes or broken CSS-selector syntax. A bulk-transform's verification step must grep for orthogonal damage signatures *different from the primary pattern* before claiming completeness.

2. **High-rate-of-reduction metrics on bulk transforms are red flags, not green ones.** A 70-85% substrate-token reduction in the v775 ship was reported as a success metric; on inspection it was the destruction count. Conservation-framed metrics ("X target patterns removed; Y legitimate-vocabulary identifiers unchanged") catch destruction; reduction-framed metrics hide it.

3. **Bulk-transform sub-agents should not author their own verification.** The v775 strip script, the cleanup execution, the success metric, and the chapter retrospective were all in the same sub-agent context. A verification gate sharing the transform's context shares its blind spots. Future bulk-transform ships should require an out-of-context verification (WebFetch, fresh-session re-grep, sibling sub-agent audit) before claiming completeness.

4. **Targeted-then-tightened is the wrong design for destructive transforms.** The v775 strip's Pass 1 (collapse adjacent runs) was sufficient and safe. Passes 2 (per-paragraph cap) and 3 (whitespace tightening) were "while we're at it" optimizations that destroyed substrate-axis vocabulary and CSS-selector syntax. Bulk-transform tools should do one targeted thing per script; secondary tidying belongs in a separate tool with separate verification.

5. **Production WebFetch is the cheapest cross-context verification available.** A single WebFetch against the live page surfaced live damage instantly, independent of local files or sub-agent claims. Adding "WebFetch the freshest page; grep for orphan-tails + broken combinators" as a T14 ship step would have caught the v775 bug at ship time.

6. **Reverse-direction repair tools need explicit allow-lists.** A generic ` -anything` regex would have introduced new damage on the heal pass (treating CSS vendor prefixes `-apple-system`, `-webkit-`, `-moz-` as substrate-vocab roots). `tools/heal-orphan-tails.py` uses an explicit 18-root allow-list, sorted longest-first to handle compound roots (`rich-and-dense`, `cohort-pair`) correctly. The allow-list is the safety boundary.

7. **Counter-cadence cadence trigger is broader than accumulated social-rule debt.** Lesson #10168 framed counter-cadence as productive every ~30 forward milestones, triggered by accumulated social-rule debt. v1.49.776's trigger is different: a single script-bug cascade with public-site impact. Counter-cadence as a cadence concept extends to bug-fix + repair + tool-author + broader-cleanup, not just social-rule conversion. The pattern repeats: convert the underlying rule into a deterministic gate (here: T14 step "WebFetch verify"), not vigilance.

## Anti-patterns surfaced

- **Self-authored success metric.** A sub-agent reporting "70-85% reduction" on its own bulk transform should be treated as a request for cross-context audit, not as a completion claim.
- **Three-pass strip with each pass tightening the previous.** Each subsequent pass operates on the prior pass's *output*, so its blast radius is broader than the original input would suggest. The Pass-2 cap was authored to "also tighten remaining density"; without the Pass-1 baseline it would not have had `substrate-anchor` patterns to misclassify.
- **`(?<= )-X\b` as a heal target without an allow-list.** That regex matches CSS vendor prefixes (`-apple-system`, `-webkit-X`) too. An unbounded heal regex is as destructive as an unbounded strip regex.

## Forward gates (codified)

| Gate | Mechanism | Triggered at |
|------|-----------|--------------|
| Live-page orphan-tail check | T14 step: WebFetch + grep | Each ship that updates Research/NASA/ |
| Pre-dispatch contamination audit | `grep -c "substrate substrate"` on required-reading files | Before any Path A dispatch on heliophysics axis |
| Backup-before-bulk-transform | `tar -czf /tmp/<milestone>-backup.tar.gz -T <filelist>` | Before any multi-file scripted edit |
| Orthogonal verification | Independent grep on post-state for damage shapes different from transform pattern | After any bulk transform claims completion |

These gates close the v1.49.775 self-blind-spot at ship time.
