# Lessons — v1.49.28

7 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Retrospectives are a backlog source.**
   "What Could Be Better" sections are deferred work items. Mining them systematically produces higher-signal work than ad-hoc feature requests.
   _🤖 Status: `investigate` · lesson #401 · needs review_
   > LLM reasoning: Data Source Registry and inventory work loosely overlaps but doesn't clearly show retrospective-mining as a systematic practice.

2. **Self-contained specs enable parallel agents.**
   When each agent gets a complete spec with no cross-references, coordination overhead drops to zero. The vision-to-mission pattern enforces this.
   _⚙ Status: `investigate` · lesson #402_

3. **Hook logic needs flow analysis.**
   Sequential guard clauses with early exits can skip later checks. When adding new checks to an existing hook, trace all exit paths.
   _⚙ Status: `investigate` · lesson #403_

4. **Browser architecture divergence accumulates.**
   BCM/SHE's different template means every browser enhancement requires an exception list. Worth unifying eventually.
   _⚙ Status: `investigate` · lesson #404_

5. **Matrix filtering and kernel cache landed in the same commit**
   (`7f99124d`). Two independent tracks — different domains, different agents — got combined by commit timing. Ideally these would be separate commits for cleaner history.
   _⚙ Status: `investigate` · lesson #405_

6. **BCM and SHE have no page.html**
   they use a different browser architecture (static index.html linking directly to raw .md files). The TOC enhancement doesn't apply to them. This asymmetry should be documented or the architecture unified in a future pass.
   _⚙ Status: `investigate` · lesson #406_

7. **The PNW index warning in the hook has a subtle flow issue**
   that was caught during verification — the original staged-TS guard used `exit 0` which bypassed the PNW check. Fixed by restructuring to use a flag variable instead of early exit.
   _⚙ Status: `investigate` · lesson #407_
