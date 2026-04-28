# Lessons — v1.49.581

16 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Three-track forward-cadence is reproducible when CSV alignment exists.**
   When the NASA, MUS, and ELC CSV catalogs all yield Domain-N subjects derivable from the same triad, ship coordinated three-track in a single version bump with bidirectional cross-track links. When only one or neither track is available, ship NASA-only as before.
   _⚙ Status: `investigate` · lesson #10108_

2. **§6.6 variant-origin discipline.**
   Future §6.6 variant openings should declare the variant name and structural definition at origin time, explicitly mark single-exemplar status, register plausible candidate 2nd and 3rd exemplars, set an archive threshold ~17 future degrees out, and ensure CHAIN-CONVENTIONS does NOT bump at variant origin. The v1.63 LIFT-AND-RESET origin is the reference template.
   _⚙ Status: `investigate` · lesson #10109_

3. **SUCCESS-AFTER-FAILURE thread closure.**
   With the SUCCESS-AFTER-FAILURE thread now at 2-exemplar threshold (v1.62 + v1.63), include it as a formalized §6.4 sub-form 2b complement to FAILURE-MODE sub-form 2a when CHAIN-CONVENTIONS v1.5 is cut.
   _⚙ Status: `investigate` · lesson #10110_

4. **retro-slot:1.59 backward-citation pass recommended.**
   Schedule the retro-backfill sprint between v1.63 and v1.64 OR immediately after v1.63 ships, as a single coordinated backward-citation pass covering retro:1.11 American Dipper + retro:1.51 Surveyor 2 + retro:1.59 Surveyor 4 SUCCESS-AFTER-FAILURE.
   _⚙ Status: `investigate` · lesson #10111_

5. **Verification-result documentation format.**
   Document V-flag resolutions at four places: `degree-sync.json` `dedication_candidates` and threads field-level descriptions, `forest-module/*.js` header docblock, `retrospective/lessons-carryover.json` `v_audit_summary` field, and release-notes `chapter/00-summary.md` and `chapter/03-retrospective.md`.
   _⚙ Status: `investigate` · lesson #10112_

6. **Subjects without PNW geographic origin require explicit tagging.**
   Future SPS subjects with non-PNW geographic origin should be tagged as such in `degree-sync.json` and corpus-deltas, with the LIFT-AND-RESET §6.6 variant considered as the candidate alignment. Extensible to S36 artists who relocated to the PNW from non-PNW origins.
   _⚙ Status: `investigate` · lesson #10113_

7. **Process-variant vs substantive-point §6.6 variants.**
   When opening a new §6.6 variant, explicitly identify whether it is a process variant (one structural arc instantiated three times with the same temporal shape) or a substantive-point variant (a single point of convergence reached three ways); the two sub-classes have different reproducibility criteria. v1.63 LIFT-AND-RESET is the first PROCESS-variant.
   _⚙ Status: `investigate` · lesson #10114_

8. **Spine information density continues to rise.**
   v1.63 spine ~44 KB; the 80-100 KB target band is the working envelope. Spines approaching 100 KB should be considered for compression via cross-references to retrospective files rather than inline expansion.
   _⚙ Status: `investigate` · lesson #10115_

9. **simulation.js block-shape pattern is reproducibly stable.**
   Two consecutive forward-cadence degrees (v1.62 + v1.63) have shipped blocks following the canonical init/tick/event/nasaState block-shape pattern; promote to a normative §2.5 SIMULATION-CUMULATIVE-LAYER block-shape spec at CHAIN-CONVENTIONS v1.5.
   _⚙ Status: `investigate` · lesson #10116_

10. **Sentinel-authorization pattern for tag + release.**
   Continue the sentinel-authorization gate; never auto-tag or auto-release without explicit human authorization. Stage release notes to `~/tmp-release/` before `gh release create --notes-file`. FTP sync runs as a mandatory ship step (not user-initiated) per the gsd-skill-creator HARD RULE.
   _⚙ Status: `investigate` · lesson #10117_

11. **V-4 Surveyor 6 hop trajectory specific page reference within TM-X-1740 carries forward as needs-citation; pending NTRS retrieval at https://ntrs.nasa.gov/citations/19690001050.**
   _⚙ Status: `investigate` · lesson #10118_

12. **Original release-notes shipped at abbreviated form (45 lines) at ship time; augmented to v1.49.165 gold-standard depth at v1.49.582 drift remediation pass on 2026-04-27.**
   _⚙ Status: `investigate` · lesson #10119_

13. **Spine grew to ~44 KB (up from ~36 KB at v1.62); the 80-100 KB target band remains the working envelope but spines approaching 100 KB should be considered for compression via cross-references rather th**
   Spine grew to ~44 KB (up from ~36 KB at v1.62); the 80-100 KB target band remains the working envelope but spines approaching 100 KB should be considered for compression via cross-references rather than inline expansion.
   _⚙ Status: `investigate` · lesson #10120_

14. **FTP sync at close of session was still propagating for MUS 1.63 and NASA 1.63 (ELC 1.63 verified live); curl -sI HEAD checks recommended as follow-up.**
   _⚙ Status: `investigate` · lesson #10121_

15. **The retro-backfill sprint covering retro:1.11 + retro:1.51 + retro:1.59 should run as a single coordinated three-slot batch rather than three separate passes.**
   _⚙ Status: `investigate` · lesson #10122_

16. **The §6.6 LIFT-AND-RESET variant origin documentation is single-degree; future degrees should formalize the variant-origin documentation template so subsequent variant-openings follow the same shape au**
   The §6.6 LIFT-AND-RESET variant origin documentation is single-degree; future degrees should formalize the variant-origin documentation template so subsequent variant-openings follow the same shape automatically.
   _⚙ Status: `investigate` · lesson #10123_
