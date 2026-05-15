# 04 — Lessons Learned: v1.49.655 Forward Lessons

## 3 forward lessons emitted (#10267–#10269)

These lessons are added to the cumulative lessons-learned database for application by future milestones.

### Sub-agent dispatch lessons (apply to W2 wave authoring)

**Lesson #10267 — Reference-template-plus-subject-data dispatch reliably produces near-reference depth at scale.**
Severity: HIGH. 16 parallel W2 sub-agent dispatches authoring substrate-tracked MUS+ELC index pages at v1.108-cohort depth landed within ±15% of target depth (mean MUS 558 lines vs 552 reference; mean ELC 557 lines vs 598 reference). The prompt pattern — target path + retro-summary subject data + reference template path + explicit depth target + forbidden-attribution constraint — produced consistently authored pages at scale without per-page hand-holding. Apply: future content-backfill milestones (≥4 pages requiring substrate-tracked authoring) can use this dispatch pattern at 4-parallel-per-wave with high confidence. Sub-agents do their own web research as needed; retro summary provides the substrate-axis ground truth.

**Lesson #10268 — Transient API errors mid-W2 dispatch are recoverable via identical-prompt retry.**
Severity: MEDIUM. 2 of 16 W2 dispatches at v1.49.655 Wave 2 hit "API Error: socket connection closed unexpectedly" before writing the target file. Identical-prompt retries (same prompt, same target path) both completed successfully on first attempt. Validates Lesson #10215 at obs#2 (first observation: v1.49.593 W3 dispatch transient API errors). Apply: when sub-agent dispatch reports API error before final Write, retry with unchanged prompt as first-resort recovery. Modify only if same prompt fails twice.

### Cross-track content discipline lessons

**Lesson #10269 — Forbidden-substring policy must accommodate meta-statements about the policy itself.**
Severity: LOW. One W2 dispatch (MUS 1.116) included a methodology-card list-item explicitly negating the forbidden patterns: `<li>No AI-coauthor markers, no "Claude" attribution, no Co-Authored-By trailers in any output content</li>`. The substring `"Claude"` appears inside the negating-statement, triggering the grep-based forbidden-substring audit as a false positive. The negating sentence is not an attribution; it's a meta-statement about the policy. Fixed by removal during catalog audit. Apply: future sub-agent prompts should explicitly forbid meta-statements about the forbidden-attribution policy itself ("don't mention that you don't use X" rather than just "don't use X"). Alternatively, the audit could allow substrings inside HTML comments or specific class names. Lesson #10219 (HARD-BLOCK forbidden-substring at W2 verification) extends to obs#5 here.

## Lessons-learned database state

- **Total lessons emitted to date:** 10269 (cumulative since corpus inception)
- **Lessons emitted this milestone:** 3 (#10267, #10268, #10269)
- **Lessons applied at v1.49.655 (from prior milestones):**
  - **#10193** (sub-agent token ceiling + iterative dispatch) — applied: all 18 dispatches landed in 5-15 tool uses, well under the 60-70 ceiling.
  - **#10204** (apply-to-self discipline) — applied at obs#4: the content-backfill milestone used the v1.49.654 scaffold tool indirectly (its scaffold-pending pattern informed each W2 dispatch's depth target).
  - **#10215** (transient API errors recover via identical-prompt retry) — applied at obs#2: 2 retries succeeded on first identical-prompt attempt.
  - **#10219** (HARD-BLOCK forbidden-substring at W2 verification) — applied at obs#5: grep audit caught one meta-statement false positive in MUS 1.116.
  - **#10220** (apply-to-self at obs#3 — discipline applied recursively) — applied at obs#4: 16-page authoring milestone uses the sub-agent-dispatch discipline (v1.49.654 codification) as its own dispatch protocol.
  - **#10244** (7-parallel-agent W3 dispatch reproducibility) — applied at obs#4: 4-parallel-W2-per-wave × 4 waves = 16 dispatches successful. Reinforces 4-parallel-per-wave as conservative baseline below the 7-parallel ceiling.
  - **#10265** (cross-track scaffold-then-fill two-milestone pattern) — applied at obs#1: v1.49.654 infrastructure → v1.49.655 content split followed this pattern exactly.
  - **#10266** (granular bypass token) — applied: this milestone ships clean MUS/ELC depth-audit without needing `depth-audit-mus-elc` bypass.
- **Open lessons watchlist:**
  - **#10267** (reference-template + subject-data dispatch pattern) — apply at next content-backfill milestone of ≥4 pages.
  - **#10268** (transient API retry policy) — apply at any future W2/W3 dispatch wave.
  - **#10269** (forbidden-substring meta-statement gap) — apply at next W2 sub-agent prompt authoring; consider extending the audit to allow specific HTML-class-or-comment exceptions.
