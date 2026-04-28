# Retrospective — v1.49.581

## What Worked

- Three-track forward-cadence first ship reproducible: NASA + MUS + ELC bundled in v1.49.581 with bidirectional cross-track links across all three index pages; cross-track artifact pairings worked structurally (audio Faust cross-NASA/MUS, SPICE circuit cross-NASA/ELC).
- §6.6 variant origin discipline applied: explicit name, structural definition, single-exemplar mark, candidate exemplars registered at origin time (Apollo translunar trajectories, Sea Otter PNW reintroduction, S36 reunion-tour patterns), archive threshold at ~v1.80.
- Three V-flag verifications resolved cleanly in parallel: V-1 Phil Ek NEGATIVE, V-2 Gibbard birth date RESOLVED, V-3 Green Frog naturalization RESOLVED, V-5 Sub Pop NEGATIVE; the discipline of letting verifications resolve as NEGATIVE rather than papering over with speculation continues to function.
- SUCCESS-AFTER-FAILURE thread closed to 2-exemplar threshold via S5+S6 consecutive successes after the v1.59 S4 loss; retro-slot:1.59 backward-citation pass becomes the recommended scheduled action.
- simulation.js block #65 followed the canonical init/tick/event/nasaState block-shape pattern from block #64; node --check passes; the pattern is now reproducibly demonstrated across two consecutive forward-cadence degrees.
- MUS 1.63 scored 100/100; ELC 1.63 scored 98/100; both pass the canonical scorer gate.
- 60-degree backfill on MUS (64/64 PASS) and ELC (64/64 PASS) shipped alongside the v1.63 forward-cadence triple as a single coordinated multi-track release.
- Manifests bumped cleanly: package.json + package-lock.json + Cargo.toml + tauri.conf.json all to 1.49.581.
- Sentinel-authorization gate before tag and GitHub release operated correctly; FTP sync ran as mandatory ship step.

## What Could Be Better

- V-4 Surveyor 6 hop trajectory specific page reference within TM-X-1740 carries forward as needs-citation; pending NTRS retrieval at https://ntrs.nasa.gov/citations/19690001050.
- Original release-notes shipped at abbreviated form (45 lines) at ship time; augmented to v1.49.165 gold-standard depth at v1.49.582 drift remediation pass on 2026-04-27.
- Spine grew to ~44 KB (up from ~36 KB at v1.62); the 80-100 KB target band remains the working envelope but spines approaching 100 KB should be considered for compression via cross-references rather than inline expansion.
- FTP sync at close of session was still propagating for MUS 1.63 and NASA 1.63 (ELC 1.63 verified live); curl -sI HEAD checks recommended as follow-up.
- The retro-backfill sprint covering retro:1.11 + retro:1.51 + retro:1.59 should run as a single coordinated three-slot batch rather than three separate passes.
- The §6.6 LIFT-AND-RESET variant origin documentation is single-degree; future degrees should formalize the variant-origin documentation template so subsequent variant-openings follow the same shape automatically.

## Lessons Learned

1. **Three-track forward-cadence is reproducible when CSV alignment exists.** When the NASA, MUS, and ELC CSV catalogs all yield Domain-N subjects derivable from the same triad, ship coordinated three-track in a single version bump with bidirectional cross-track links. When only one or neither track is available, ship NASA-only as before.
2. **§6.6 variant-origin discipline.** Future §6.6 variant openings should declare the variant name and structural definition at origin time, explicitly mark single-exemplar status, register plausible candidate 2nd and 3rd exemplars, set an archive threshold ~17 future degrees out, and ensure CHAIN-CONVENTIONS does NOT bump at variant origin. The v1.63 LIFT-AND-RESET origin is the reference template.
3. **SUCCESS-AFTER-FAILURE thread closure.** With the SUCCESS-AFTER-FAILURE thread now at 2-exemplar threshold (v1.62 + v1.63), include it as a formalized §6.4 sub-form 2b complement to FAILURE-MODE sub-form 2a when CHAIN-CONVENTIONS v1.5 is cut.
4. **retro-slot:1.59 backward-citation pass recommended.** Schedule the retro-backfill sprint between v1.63 and v1.64 OR immediately after v1.63 ships, as a single coordinated backward-citation pass covering retro:1.11 American Dipper + retro:1.51 Surveyor 2 + retro:1.59 Surveyor 4 SUCCESS-AFTER-FAILURE.
5. **Verification-result documentation format.** Document V-flag resolutions at four places: `degree-sync.json` `dedication_candidates` and threads field-level descriptions, `forest-module/*.js` header docblock, `retrospective/lessons-carryover.json` `v_audit_summary` field, and release-notes `chapter/00-summary.md` and `chapter/03-retrospective.md`.
6. **Subjects without PNW geographic origin require explicit tagging.** Future SPS subjects with non-PNW geographic origin should be tagged as such in `degree-sync.json` and corpus-deltas, with the LIFT-AND-RESET §6.6 variant considered as the candidate alignment. Extensible to S36 artists who relocated to the PNW from non-PNW origins.
7. **Process-variant vs substantive-point §6.6 variants.** When opening a new §6.6 variant, explicitly identify whether it is a process variant (one structural arc instantiated three times with the same temporal shape) or a substantive-point variant (a single point of convergence reached three ways); the two sub-classes have different reproducibility criteria. v1.63 LIFT-AND-RESET is the first PROCESS-variant.
8. **Spine information density continues to rise.** v1.63 spine ~44 KB; the 80-100 KB target band is the working envelope. Spines approaching 100 KB should be considered for compression via cross-references to retrospective files rather than inline expansion.
9. **simulation.js block-shape pattern is reproducibly stable.** Two consecutive forward-cadence degrees (v1.62 + v1.63) have shipped blocks following the canonical init/tick/event/nasaState block-shape pattern; promote to a normative §2.5 SIMULATION-CUMULATIVE-LAYER block-shape spec at CHAIN-CONVENTIONS v1.5.
10. **Sentinel-authorization pattern for tag + release.** Continue the sentinel-authorization gate; never auto-tag or auto-release without explicit human authorization. Stage release notes to `~/tmp-release/` before `gh release create --notes-file`. FTP sync runs as a mandatory ship step (not user-initiated) per the gsd-skill-creator HARD RULE.
