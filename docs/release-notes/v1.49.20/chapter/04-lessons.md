# Lessons — v1.49.20

13 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Keep up is cheaper than catch up.**
   Seven releases of documentation drift cost a full release to close. A 30-line doc update during each of v1.49.13 through v1.49.19 would have cost roughly the same lines but spread across seven smaller commits that stayed close to the code that motivated them. This is the general principle behind every pre-release-checklist item the project has ever adopted.
   _⚙ Status: `investigate` · lesson #3127_

2. **Ledger integrity goes first in a documentation-consolidation release.**
   Phase 2 filled phase and plan counts in `docs/RELEASE-HISTORY.md` before any other phase landed. Starting with ledger repair means every subsequent phase can reference accurate totals, and the release history itself is the audit trail the rest of the consolidation edits against.
   _⚙ Status: `applied` (applied in `v1.49.32`) · lesson #3128_

3. **Two-part narrative structure scales when a document covers two distinct audiences.**
   HOW-IT-WORKS has two audiences — skill authors who need the lifecycle and orchestration operators who need the engine. The Part 1 / Part 2 split serves both without forcing either to read material that does not apply. This pattern is reusable for any canonical document whose surface has grown beyond a single pedagogical thread.
   _⚙ Status: `investigate` · lesson #3129_

4. **Concept catalogs should cross-reference, not just enumerate.**
   The new CORE-CONCEPTS section ends with a cross-references block that links every new concept to related concepts. This is what turns a list into a graph, and the graph is what a reader navigates when they are trying to understand how pieces fit. Cross-references are the load-bearing part of the refresh.
   _⚙ Status: `investigate` · lesson #3130_

5. **Documentation-only releases warrant a separate release vector.**
   Mixing documentation consolidation with feature work destroys the readability of the diff. v1.49.20's deliberate documentation-only scope (plus one surgical Ajv fix) is the right shape for this class of release, and subsequent consolidations should adopt the same constraint.
   _⚙ Status: `investigate` · lesson #3131_

6. **Back-fill in one commit rather than back-dating edits.**
   Three release READMEs (v1.49.17, v1.49.18, v1.49.19) and thirty-one FEATURES entries landed as three single-purpose commits (`1e0ef5a70`, `714d2bd15`, `5128e192b`) rather than as edits to earlier releases' history. This is the honest record — the notes were authored after the fact, and the commit history preserves that.
   _⚙ Status: `investigate` · lesson #3132_

7. **Sub-project lock files belong in gitignore from day one.**
   The 4,094-line `the-space-between-engine/package-lock.json` had been committing noise into the main repo's diffs since v1.49.18. Ignoring sub-project lock files is the right default for any nested npm project, and `.gitignore` should pick them up before the first install runs.
   _⚙ Status: `investigate` · lesson #3133_

8. **Five-phase ordering is a reusable pattern for documentation consolidation.**
   Ledger → entry-point → engine → catalog → surface is an ordering that holds for any canonical-document refresh. Future documentation releases can adopt the same sequence and inherit the reviewable-diff shape.
   _⚙ Status: `investigate` · lesson #3134_

9. **Renaming work compounds with documentation work.**
   The `dynamic-skill-creator` → `gsd-skill-creator` rename (v1.49.17) left a stale GitHub URL in `docs/GETTING-STARTED.md` that was only caught during this release's README refresh. Identity changes generate downstream documentation edits that surface in later releases; a rename checklist should include a sweep of linked URLs.
   _⚙ Status: `investigate` · lesson #3135_

10. **Seven releases of documentation drift accumulated before the catch-up shipped.**
   v1.49.13 through v1.49.19 each added major architecture that should have updated the canonical docs inline. The four-month backlog is the negative space around v1.49.20 — catching up was the right move, but catching up is more expensive than keeping up, and this release is the bill for that choice.
   _⚙ Status: `investigate` · lesson #3136_

11. **No documentation-update acceptance criterion on feature releases yet.**
   There is no automated check that forces CORE-CONCEPTS or HOW-IT-WORKS to move when a new concept ships. A future release should add such a check (or a pre-release checklist item) so a v1.49.13–v1.49.19-sized backlog cannot form again.
   _⚙ Status: `investigate` · lesson #3137_

12. **Gastown guide is thorough but lacks worked examples.**
   The 10 documents describe the chipset's architecture, trust model, and communication channels authoritatively, but a reader who wants to run the chipset still needs to piece together the setup flow from setup.md, topology.md, and channels.md. A worked example (one mission, end to end) would make the guide usable for a first-time reader without cross-referencing.
   _⚙ Status: `investigate` · lesson #3138_

13. **FEATURES.md is now 213 entries long with no cross-index.**
   The surface-capability catalog has grown large enough that sorting by version is no longer sufficient — a concept-index or category-index would let a reader find "all telemetry-related capabilities" without scrolling through the timeline. v1.49.20 adds the entries but does not add the index.
   _⚙ Status: `investigate` · lesson #3139_
