# Lessons — v1.49.583

14 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Single Write tool calls >50 KB exceed the 600s watchdog with high probability.**
   Fleet build agents writing index.html-class files (~86–97 KB) need to use a copy+edit strategy to break the work into many smaller tool calls. Build prompt template needs this as a default.
   _⚙ Status: `investigate` · lesson #10142_

2. **Recovery agents should grep-verify before reporting completion.**
   A copy+edit pass that swaps some references but leaves others creates a partial-state file that fails subsequent QA. Recovery prompts should include `grep -cE '<bad-pattern>' file && exit-if-nonzero` as part of the contract.
   _⚙ Status: `investigate` · lesson #10143_

3. **Domain coverage JSONs are easy-to-forget.**
   Both MUS + ELC domain-coverage.json files were stale at v1.582 close (didn't catch v1.64 closures); v1.65 had to catch up two milestones of drift. Add domain-coverage-update to the standard Phase C checklist; consider auto-update via populate script.
   _⚙ Status: `investigate` · lesson #10144_

4. **PERSISTENT-CONSTELLATION-LISTENER as a §6.6 thread origin opens with strong watchlist candidates.**
   Pioneer 9 + ISEE-3 + ACE + Voyager 1+2 are all strong 2nd/3rd exemplar candidates; the variant has a clearer path-to-stabilization than ALL-UP COMMITMENT did at v1.64 origin.
   _⚙ Status: `investigate` · lesson #10145_

5. **Cross-track artistic-engineering analog primitive: sustained-signal as identity is substrate-independent.**
   The v1.65 trans-domain isomorphism (Earth drone-tone + Sandhill Crane bugle + Pioneer 8 1 Hz beat) is a clean demonstration that committal-by-persistence is a substrate-independent design pattern. Future degrees should explicitly look for this primitive shape in cross-track triads.
   _⚙ Status: `investigate` · lesson #10146_

6. **First multi-decade-mission entry opens a new mission-design category.**
   Pioneer 8's 28y8m operational lifetime introduces a category of mission-design that prior degrees did not address. Future degrees in the multi-decade category (Voyager, ACE, ISEE-3, Mars rovers) should reference v1.65 as the category opener.
   _⚙ Status: `investigate` · lesson #10147_

7. **Sandhill Crane tracheal-coil error in the original brief is a useful cautionary tale.**
   The 5 m vs ~1.0–1.2 m fact-check error came from a mis-attribution of trumpeter swan comparative-anatomy figure to a sandhill crane context. Spec authors caught the error and propagated correction. Process anchor: spec authors should always cross-check anatomical/physical claims against authoritative comparative-anatomy sources (Fitch 1999 J. Zool. is the canonical reference for tracheal elongation in birds).
   _⚙ Status: `investigate` · lesson #10148_

8. **Carry-forward drift in domain coverage is an early warning.**
   When two milestones in a row leave a JSON file out of date, that's a signal that the file should be auto-generated from the source-of-truth catalog rather than manually maintained.
   _⚙ Status: `investigate` · lesson #10149_

9. **Two-phase Write strategy (skeleton + Edit-fill) is a useful general pattern.**
   Beyond the index.html case, any file authored via subagent that is >50 KB should consider this strategy. Variant: structured-skeleton placeholder + multiple targeted Edits for content sections.
   _⚙ Status: `investigate` · lesson #10150_

10. **Cross-track 1 Hz beat as identity-signature is a teachable demonstration of the substrate-independent pattern.**
   The Pioneer 8 spin-modulation signature is a literal engineering instantiation of the sustained-pitch primitive — it is the kind of cross-domain isomorphism that the gsd-skill-creator engine is designed to surface and that pedagogical content should center.
   _⚙ Status: `investigate` · lesson #10151_

11. **Two fleet agent stalls writing the index.html (~86–97 KB single-Write).**
   The MUS fleet build agent and the NASA fleet build agent both stalled at 600s when attempting to Write the full index.html in a single tool call. Recovery required re-dispatch with explicit copy+edit strategy (cp v1.64 → v1.65, then targeted Edits) to avoid the single-large-Write watchdog. Future fleet build prompts should include the copy+edit strategy for any file >50 KB by default.
   _⚙ Status: `investigate` · lesson #10152_

12. **Recovery agents did partial substitutions.**
   The first round of copy+edit recovery agents swapped some v1.64 references but left artifact filenames + cross-track card hrefs + some narrative content in the original v1.64 form. A second cleanup-pass round was required to scrub residuals. Future copy+edit prompts should include an explicit residual-scan step + grep-verify gate before reporting completion.
   _⚙ Status: `investigate` · lesson #10153_

13. **simulation.html aggregator template still pending.**
   NASA 1.65 references `artifacts/sims/*.html` directly per the v1.63+ pattern; the proposed `simulation.html` per-degree aggregator page is not yet shipped. Decision-pending: aggregator template OR rewrite Track 5 card to point at `artifacts/`.
   _⚙ Status: `investigate` · lesson #10154_

14. **flight-hardware-mapping.csv has no row for v1.65.**
   ELC scorer reports "no year for degree in mapping" → 4/5 era anchoring (benign warning). The CSV should be updated with a Pioneer 8 / 1967-12-13 / si-discrete row in next maintenance pass.
   _⚙ Status: `investigate` · lesson #10155_
