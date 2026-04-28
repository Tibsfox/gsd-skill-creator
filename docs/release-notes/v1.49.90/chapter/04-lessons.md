# Lessons — v1.49.90

15 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **A stable pipeline beats a clever one.**
   The research-mission-generator, the vision-to-mission skill, and the publish-pipeline had all stabilized by v1.49.89. v1.49.90 did not invent new tooling; it used what was there. Sustained throughput came from boring infrastructure faithfully applied.
   _⚙ Status: `investigate` · lesson #2878_

2. **Completion signals should be measurable, not subjective.**
   The intake queue had a count. When the count hit zero, the phase transitioned. No meeting, no vibe check, no debate. Build systems where completion is a state, not a judgment call.
   _⚙ Status: `investigate` · lesson #2879_

3. **Cross-references earn their keep when planned during outline.**
   Adding `see also: ICS` to a COK module during authoring costs seconds; adding it after publication costs a full re-read. The v1.49.90 batch planned cross-links up-front and every later pass was cheaper for it.
   _⚙ Status: `investigate` · lesson #2880_

4. **Non-technical subjects stress-test architectural claims.**
   If the College of Knowledge architecture can host Cooking with Claude and Kung Fu alongside OpenStack and Module Governance, the architecture's claim-to-universality has been tested. If it could only host software, the claim was false advertising. CWC and KFU are the test cases, not the exceptions.
   _⚙ Status: `investigate` · lesson #2881_

5. **One commit per project is a throughput feature, not a pedantry tax.**
   Clean bisect history means review can happen per-project. Review-per-project means review can actually happen at 10-project-per-session velocity. Review-at-velocity is the unlock that keeps the backlog drainable.
   _⚙ Status: `investigate` · lesson #2882_

6. **The architecture cluster should be the first thing shipped, not the last.**
   COK/FEG/CDL/ICS/MGU/GSA/M05 form a self-referential stack in this batch because the architecture had solidified enough to describe itself. If the architecture had been shipped earlier in the v1.49 arc, later research projects could have referenced it instead of being retrofitted to it. Next time, ship the architecture first.
   _⚙ Status: `investigate` · lesson #2883_

7. **NASA systems-engineering language generalizes farther than expected.**
   OPS lifts V&V matrices, configuration management, and requirements traceability from NASA SE handbooks and applies them to private-cloud ops. MGU reuses the same vocabulary for knowledge-pack governance. CWC (HACCP as CI/CD) reaches for similar ideas. NASA SE is an unusually portable framework because it was designed for domains where mistakes are irreversible, and irreversibility is a common feature across infrastructure, curricula, and food safety.
   _⚙ Status: `investigate` · lesson #2884_

8. **Draining to zero is a mental-health feature, not just a planning milestone.**
   A non-empty pack queue is cognitive load; an empty one is rest. v1.49.90's delivery ended a three-week period where the queue had been heavy. The freedom that came after the tag was not just schedule freedom — it was the difference between reactive processing and proactive planning for what came next.
   _⚙ Status: `investigate` · lesson #2885_

9. **Batch size correlates with pipeline maturity, not ambition.**
   The v1.49.89 mega-batch (49 projects) was only possible because the pipeline could sustain it; v1.49.90 (10 projects) was a natural closing step, not a capability test. Earlier in the arc a 10-project batch would have been the ambition ceiling. Measure pipeline maturity by how boring the batch becomes.
   _⚙ Status: `investigate` · lesson #2886_

10. **Domain diversity in a single release is an investment in future cross-pollination.**
   When COK (education architecture), OPS (cloud infrastructure), CWC (cooking pedagogy), and KFU (martial-arts cultivation) all ship in the same release, readers browsing the site encounter cross-domain proximity automatically. The next pass will have more diverse raw material to draw metaphors from, which makes later research richer by default.
   _⚙ Status: `investigate` · lesson #2887_

11. **The research-line counts in the table above are approximate, not audited.**
   Each project's modules have their own line count; the 2,022 for COK and 2,802 for M05 are from the per-project directory tallies, but I did not re-run a canonical `wc -l` across every `research/*.md` file to verify. A tool that emits per-release line statistics from the canonical source would make future release notes more defensible.
   _⚙ Status: `investigate` · lesson #2888_

12. **Cross-references in the published site are still manual link maintenance.**
   The `series.js` entry for each project lists related projects, but there's no automated check that a link from COK to ICS corresponds to a link from ICS to COK. A future pass should build a symmetry-checker: if project A references project B, then project B's cross-reference list should reflect that.
   _⚙ Status: `investigate` · lesson #2889_

13. **The mission-pack PDFs are not bibliographically complete for every project.**
   Some mission-packs (COK, GSA, ICS) have rich citation chains in their LaTeX source; others (CWC, KFU) lean more on synthesis than citation. The batch shipped before every mission-pack was brought to the same citation standard. A follow-up pass should audit which mission-packs need citation-backfill before they serve as teaching artifacts in the college.
   _⚙ Status: `investigate` · lesson #2890_

14. **No TRL (Technology Readiness Level) framing on the infrastructure claims in OPS.**
   Module 02's NASA SE Cloud Ops module lifts language from the NASA Software Engineering Handbook, but the claims about private-cloud self-hosting economics are presented as reasoned analysis rather than TRL-tagged. Readers deciding whether to attempt OPS-scale self-hosting would benefit from explicit "this is TRL 9 (deployed reality at scale, e.g., CERN, national labs)" vs "this is TRL 5 (prototype operational at a lab in a simulated environment)" markers.
   _⚙ Status: `investigate` · lesson #2891_

15. **The Rosetta Stone cluster framework was not itself updated in this release.**
   Ten projects landed in existing clusters; none extended the cluster framework. That's arguably correct — v1.49.89 had already expanded clusters 7→10 — but it's worth flagging that v1.49.90 accumulates into the framework rather than reshaping it. The next framework revision is pending.
   _⚙ Status: `investigate` · lesson #2892_
