# Lessons — v1.49.402

11 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Duration can substitute for peak amplitude in documentation weight.**
   The degree 261 paired release demonstrates that the engine's documentation vocabulary can track sustained signals (eleven-year catalog, continuous volcanic tremor) at equivalent structural resolution to high-peak-amplitude events, and that duration carries real documentation weight independently of any single peak measurement. Future releases should consider sustained-signal framing as a first-class documentation mode alongside peak-amplitude framing.
   _⚙ Status: `investigate` · lesson #8643_

2. **Arc-opening entries deserve explicit "arc opens" marker registers.**
   The Geophysics Arc (261-267) benefits from explicit register-level annotation of its opening at 261 rather than implicit continuity-through-subsequent-degrees annotation. The "GEOPHYSICS ARC OPENS" designation in the header and the engine-position ledger gives readers a navigational anchor that subsequent arc-internal degrees can reference without restating the arc's full scope.
   _⚙ Status: `investigate` · lesson #8644_

3. **First-entry extensions of documented territory should be flagged as first-entry registers.**
   The "ELLENSBURG ENTERS" and "FIRST INFRASONIC SPS ENTRY" designations at degree 261 are structurally important beyond the specific degree: they document the engine's vocabulary expansion and they create navigational precedents that subsequent degrees can reference. First-entry events are not only about the specific first entry but about the register-level expansion they mark.
   _⚙ Status: `investigate` · lesson #8645_

4. **Adjacent-to-visible-without-belonging is a reusable structural framing.**
   The Screaming Trees' position adjacent to Sub Pop grunge without belonging to it and Mount Rainier's tremor adjacent to the more-visible volcanic and seismic hazards without attracting the same public-attention register are structurally parallel framings that the engine can apply elsewhere. Adjacent-to-visible artists and adjacent-to-visible geophysical signals both deserve documentation at equivalent structural resolution to the more-visible comparands.
   _⚙ Status: `investigate` · lesson #8646_

5. **The engine's regional coverage is incomplete without east-of-Cascades documentation.**
   The eighty-degree gap before the first east-Cascades S36 entry at degree 261 reflects the Puget Sound basin's cultural density but also a documentation bias that deserves acknowledgement. Quadrant IV should use the degree 261 Ellensburg precedent to consider additional east-of-Cascades, Columbia Plateau, and Cascade-east-slope artists where the catalog supports inclusion.
   _⚙ Status: `applied` (applied in `v1.49.472`) · lesson #8647_

6. **Infrasound is real acoustic territory and deserves SPS representation.**
   The degree 261 volcanic tremor is the engine's first explicitly-infrasonic SPS entry after eighty earlier degrees of predominantly-audible SPS events. The below-20-Hz range is a real and continuously-present part of the Pacific Northwest acoustic landscape, and the Geophysics Arc's opening at infrasound acknowledges that the engine's acoustic documentation is incomplete without the sub-audible register. The subsequent arc entries (lahar, earthquake P-wave, submarine canyon flow) extend this recognition across further infrasonic and subsonic mechanisms.
   _⚙ Status: `investigate` · lesson #8648_

7. **Collapsed-tag-to-commit mappings should be stabilized before batch uplift runs.**
   The observation that tags v1.49.402 through v1.49.409 all point to the same commit `e54f12633` while the README content inside each version directory describes a distinct degree is a release-tag hygiene issue that propagates into uplift friction. Future release operations should either retag commits to match their content or maintain an explicit tag-to-content alignment note when the mismatch is deliberate.
   _⚙ Status: `investigate` · lesson #8649_

8. **Mark Lanegan's full three-decade career arc deserves documentation through the Screaming Trees entry rather than through a duplicate solo-Lanegan entry.**
   The decision to document Lanegan's voice through the Screaming Trees at degree 261 — the place where his voice first appeared on record — rather than through a separate solo-Lanegan entry reflects the engine's structural choice that artists are documented at their catalog-origin moment and that subsequent solo or collaborative work extends the origin-entry rather than generating duplicate entries. The decision preserves the engine's structural parsimony while acknowledging the full three-decade vocal arc in the degree 261 documentation.
   _⚙ Status: `applied` (applied in `v1.49.443`) · lesson #8650_

9. **The tag/content mapping is ambiguous.**
   The git tag `v1.49.402` points to commit `e54f12633` whose feat commit message references degree 268, but the README and chapter files inside `docs/release-notes/v1.49.402/` describe degree 261 (Screaming Trees + Volcanic Tremor Rainier). Nine separate tags (v1.49.402 through v1.49.409) all point to the same commit. This uplift follows the chapter-file content as ground truth but the tag-to-content alignment should be audited and stabilized before the next uplift batch.
   _⚙ Status: `investigate` · lesson #8651_

10. **The commits field cannot cleanly report a distinct commit range.**
   Because nine tags collapse onto one commit, the `Commits:` header field reports a single-commit range without the usual degree-shipping commit isolation. The broader release-tag hygiene problem upstream of this uplift would be worth a dedicated cleanup pass — retagging the nine collapsed tags onto their intended distinct commits would produce cleaner git-history-to-release-notes alignment going forward.
   _⚙ Status: `investigate` · lesson #8652_

11. **The Ellensburg first-entry precedent deserves follow-up documentation before Quadrant IV.**
   Degree 261 establishes the east-of-Cascades entry precedent, but the engine's documented east-Cascades music register is still thin. Quadrant IV (271-360) should consider additional east-of-Cascades artists where the catalog supports them, and the degree 261 documentation should be referenced as the precedent-setting entry when subsequent east-Cascades artists arrive.
   _⚙ Status: `investigate` · lesson #8653_
