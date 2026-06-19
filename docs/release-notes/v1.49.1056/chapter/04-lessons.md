# Lessons — v1.49.1056

14 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **A sustain keeps the predecessor's axis vocabulary and replaces only the predecessor-specific content.**
   Mariner 9 shares the Mars-exploration vocabulary with the Viking predecessor (Mars, the red planet, orbiter, the surface, regolith, the atmosphere, the dust storm, in situ, planetary exploration) — that vocabulary is shared and correct. The rewrite removed only the Viking-specific content (the two orbiter–lander spacecraft, the landers, Chryse/Utopia Planitia, the biology package GEX/LR/PR, the GCMS, the X-Ray Fluorescence Spectrometer, the surface-sampler arm, the RTG-powered landers, the Titan IIIE–Centaur, NASA Langley/Martin Marietta) and replaced it with Mariner 9 content.
   _⚙ Status: `investigate` · lesson #12241_

2. **A sustain has no axis rotation to frame — the 1.238 rotation framing is removed.**
   The 1.238 page opened the Mars axis by rotating from the X-ray-astronomy axis (the Suzaku comparison); 1.239 is a SUSTAIN, so that rotation narrative is removed, with at most a single distant note that the Mars axis itself opened at 1.238 by rotating from the X-ray axis. The X-ray-axis vocabulary (Suzaku, XIS/HXD/XRS, the micro-calorimeter, keV bands, the Vermilion Bird, JAXA) does not appear.
   _⚙ Status: `investigate` · lesson #12242_

3. **The "first to orbit another planet" first carries the qualifier.**
   Mars 2 (27 November 1971) and Mars 3 (~2 December 1971) reached Mars orbit AFTER Mariner 9, despite Mars 2 launching earlier — Mariner 9 was first to ARRIVE and orbit. The catalog uses 14 November 1971 UTC, not the "13 November" Pasadena local-evening date.
   _⚙ Status: `investigate` · lesson #12243_

4. **The global map is ~85%, scoped — never "100%.**
   Mariner 9 systematically imaged about 85% of the surface (7,329 images), exceeding the ~70% objective; the first is scoped as "first global map of Mars / first planet-wide imaging survey of another planet," never "complete coverage."
   _⚙ Status: `investigate` · lesson #12244_

5. **Olympus Mons and Valles Marineris were revealed, not discovered.**
   The large features were telescopically known albedo markings (Nix Olympica since Schiaparelli 1877; Mariner 7 first imaged Nix Olympica in 1969); Mariner 9 revealed/recognized their volcanic and tectonic nature. Use "largest known volcano," and Valles Marineris was named after Mariner 9.
   _⚙ Status: `investigate` · lesson #12245_

6. **Mariner 9 is an orbiter, not a lander.**
   It is NOT the first soft landing (Mars 3, 1971; Viking, 1976) and NOT a lander; it is an orbiter only — distinct from Viking's first fully successful orbiter+lander system and from Mariner 4 (1.36, the first Mars flyby).
   _⚙ Status: `investigate` · lesson #12246_

7. **NASA / U.S.-mission framing is an accuracy requirement here.**
   Mariner 9 was a wholly NASA / United States program (JPL) with no foreign partner — attaching a foreign-partner caveat would be an error.
   _⚙ Status: `investigate` · lesson #12247_

8. **The dust storm is part of the achievement, not an obstacle to apologize for.**
   Mariner 9 arrived during a planet-encircling dust storm and held orbital station, patiently waiting about two months for the dust to settle before the systematic survey — the orbital-reconnaissance platform's ability to wait for its target to clear is part of why the first global map was possible.
   _⚙ Status: `investigate` · lesson #12248_

9. **A sustain references its predecessor exactly once, deliberately.**
   The only correct predecessor reference is a single nav-prev lineage note to v1.238 Viking (Mars obs#1), plus a lineage reference to Mariner 4 (1.36, the first Mars flyby). Viking's anchors stay with Viking — 0 re-stamps.
   _⚙ Status: `investigate` · lesson #12249_

10. **Clone source is Viking (a NASA Mars landing program, two orbiter–lander spacecraft, Titan IIIE–Centaur, 1975–1976); Mariner 9 is a NASA Mars orbital-reconnaissance mission (one surviving spacecraft of Mariner Mars '71, Atlas SLV-3C/Centaur, 1971–1972).**
   The most structural replacement in the rewrite is removing ALL Viking-specific content — "Viking 1 & 2," "the orbiter–lander pairs," "the landers," "Chryse/Utopia Planitia," "the biology package (GEX/LR/PR)," "the GCMS," "the X-Ray Fluorescence Spectrometer," "the surface-sampler arm," "the RTG-powered landers," "the Titan IIIE–Centaur," "NASA Langley/Martin Marietta," "the first-landing / first-surface-images / in-situ-life-search / orbiter+lander-system anchors," and "the Gray-crowned Rosy-Finch + Rock Tripe pairing" — and replacing with Mariner 9's surviving Mariner Mars '71 spacecraft, the twin Mariner 8 lost at launch, the Atlas SLV-3C/Centaur from LC-36B, the 14 November 1971 orbit insertion, the planet-encircling dust storm and the ~2-month wait, the global mapping (7,329 images,…
   _⚙ Status: `investigate` · lesson #12250_

11. **The shader renders procedural geometry rather than archived mission imagery.**
   The Mariner 9 shader uses analytic curves and procedural noise rather than loading an actual Mariner 9 global mosaic or a Valles Marineris/Olympus Mons frame. A future revision could render a real Mariner 9 mosaic or a Phobos/Deimos close-up (publicly available from the Planetary Data System) for a higher-fidelity view.
   _⚙ Status: `investigate` · lesson #12251_

12. **The Mariner 9 diorama is a forthcoming artifact.**
   The 3D-printable diorama STL files are referenced as forthcoming rather than provided; a future ship could include the actual STL geometry of the octagonal Mariner bus with its four solar panels, the scan platform carrying the two TV cameras and the spectrometers, and the high-gain antenna.
   _⚙ Status: `investigate` · lesson #12252_

13. **The dust-storm-and-wait sequence is depicted rather than computed.**
   The two-month settling of the planet-encircling dust storm is depicted in the shader but not driven from the archived IRIS/imaging opacity time series; a future ship could animate the dust clearing from the real measured atmospheric-opacity curve.
   _⚙ Status: `investigate` · lesson #12253_

14. **The global mapping survey is depicted rather than driven by the real orbit track.**
   The orbit-after-orbit tiling of the surface is depicted in the shader but not rendered from the real ~12-hour mapping-orbit ground track; a future ship could drive the mapping mode from the archived Mariner 9 orbit ephemeris for a quantitatively faithful coverage build-up.
   _⚙ Status: `investigate` · lesson #12254_
