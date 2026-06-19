# Lessons — v1.49.1061

14 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **A sustain keeps the predecessor's axis vocabulary and replaces only the predecessor-specific content.**
   InSight shares the Mars-exploration vocabulary with the Perseverance predecessor (Mars, the red planet, the surface, regolith, the atmosphere, dust, in situ, planetary exploration, crust, mantle, core) — that vocabulary is shared and correct. The rewrite removed only the Mars 2020 / Perseverance-specific content (the Mars 2020 and Perseverance names, Alexander Mather, Jezero Crater, "Octavia E. Butler Landing," the sky crane, Terrain-Relative Navigation, Mastcam-Z, SuperCam, PIXL, SHERLOC, WATSON, MEDA, RIMFAX, MOXIE, Ingenuity, the Sampling and Caching System, "Montdenier," "Three Forks," the caching / powered-flight / in-situ-resource anchors, and the Canada Jay + Bitterroot pairing) and replaced it with InSight content.
   _⚙ Status: `investigate` · lesson #12316_

2. **A sustain has no axis rotation to frame — and 1.243 was itself a sustain, so there is no rotation framing to remove.**
   The Mars axis opened at 1.238 (Viking, substrate-axis rotation #36); 1.239 through 1.244 are all SUSTAINS, so the clone source carries no rotation narrative, and at most a single distant note records that the Mars axis itself opened at 1.238 by rotating from the X-ray-astronomy axis (rotation #35, held complete at obs#15). The X-ray-axis vocabulary does not appear.
   _⚙ Status: `investigate` · lesson #12317_

3. **InSight is a STATIONARY lander, not a rover — it did not drive or traverse.**
   The deep-interior science needs a fixed, quiet station, so InSight stayed in one place at Elysium Planitia; a ~1.8 m robotic arm placed SEIS and the HP3 mole, but the catalog never describes InSight roving and never re-claims any rover first.
   _⚙ Status: `investigate` · lesson #12318_

4. **The seismometer first is scoped to recording marsquakes on another PLANET — not "first seismometer on Mars" and not "first planetary seismology ever.**
   Viking 2's deck seismometer (1976) was dominated by wind and never confirmed a marsquake, and the Viking 1 seismometer never uncaged; the Apollo seismometers recorded moonquakes on the Moon, a satellite. The catalog scopes InSight's first as the first seismometer to RECORD marsquakes, the first successful seismology on another planet.
   _⚙ Status: `investigate` · lesson #12319_

5. **The interior-structure first is the first for a PLANET beyond Earth — the Moon is a satellite.**
   Earth's interior is read by terrestrial seismology and the Moon's by the Apollo seismometers; the catalog scopes InSight's first as the first seismic determination of the deep interior of a planet beyond Earth (the crust, mantle, and large liquid core ~1,830 km, the core confirmed 2021).
   _⚙ Status: `investigate` · lesson #12320_

6. **The HP3 mole did not reach depth — there is NO heat-flow first.**
   The HP3 "mole" could not get sufficient friction in the unexpected duricrust soil and could not burrow to depth, so the heat-flow measurement was not achieved. The catalog states this factually but frames the mission positively around the seismology and interior structure — the heart of the science — and never claims a heat-flow first.
   _⚙ Status: `investigate` · lesson #12321_

7. **The West-Coast launch first is INTERPLANETARY.**
   InSight's Atlas V 401 launch from Vandenberg was the first interplanetary launch from the US West Coast; the catalog keeps the precise word INTERPLANETARY (to another planet) because Vandenberg routinely launches Earth-orbiting payloads and the Clementine mission (1994) launched lunar/deep-space from Vandenberg earlier — so it never writes "first deep-space launch" or "first launch to leave Earth orbit" from the West Coast.
   _⚙ Status: `investigate` · lesson #12322_

8. **NASA-led-with-international-instruments framing is an accuracy requirement here.**
   InSight was a NASA Discovery Program mission managed by the Jet Propulsion Laboratory, with the lander built by Lockheed Martin (Phoenix-derived); SEIS was led by CNES (France) and HP3 by DLR (Germany), and RISE was a JPL radio-science experiment — a wholly NASA-led mission with major international partners.
   _⚙ Status: `investigate` · lesson #12323_

9. **A sustain references its predecessor exactly once, deliberately.**
   The only correct predecessor reference is a single nav-prev lineage note to v1.243 Perseverance (Mars obs#6), plus lineage references to Curiosity (1.242, obs#5), the Mars Exploration Rovers (1.241, obs#4), Mars Pathfinder (1.240, obs#3), Mariner 9 (1.239, obs#2), Viking (1.238, obs#1), and Mariner 4 (1.36, the first Mars flyby). The predecessors' anchors stay with them — 0 re-stamps.
   _⚙ Status: `investigate` · lesson #12324_

10. **Clone source is Perseverance (a NASA nuclear caching-and-capability rover, Mars 2020, 2020–present); InSight is a NASA stationary solar-powered geophysics lander (Discovery, 2018–2022).**
   The most structural replacement in the rewrite is removing ALL Mars 2020 / Perseverance-specific content — "Mars 2020," "Perseverance," "Alexander Mather," "Jezero Crater," "Octavia E. Butler Landing," "the sky crane," "Terrain-Relative Navigation," "Mastcam-Z," "SuperCam," "PIXL," "SHERLOC," "WATSON," "MEDA," "RIMFAX," "MOXIE," "Ingenuity," "the Sampling and Caching System," "Montdenier," "Three Forks," "the caching / powered-flight / in-situ-resource anchors," and "the Canada Jay + Bitterroot pairing" — and replacing with InSight and the Discovery Program, the SEIS / HP3 / RISE instruments and the CNES/DLR partners, the Atlas V 401 launch from Vandenberg SLC-3E (5 May 2018) and the first-interplanetary-launch-from-the-West-Coast note, Elysium Planitia and the 26 November 2018 propulsive…
   _⚙ Status: `investigate` · lesson #12325_

11. **The shader renders procedural geometry rather than archived mission imagery.**
   The InSight shader uses analytic curves and procedural noise rather than loading actual lander camera frames or a seismogram. A future revision could render a real InSight Instrument Deployment Camera image of SEIS on the ground (publicly available from the Planetary Data System) for a higher-fidelity view.
   _⚙ Status: `investigate` · lesson #12326_

12. **The InSight diorama is a forthcoming artifact.**
   The 3D-printable diorama STL files are referenced as forthcoming rather than provided; a future ship could include the actual STL geometry of the lander with its solar panels, the robotic arm, the dome-shaped SEIS seismometer under its shield, and the HP3 mole.
   _⚙ Status: `investigate` · lesson #12327_

13. **The marsquake mode is depicted rather than driven by real seismograms.**
   The concentric seismic waves in the listening-to-marsquakes mode are depicted but not rendered from an archived SEIS seismogram of a real marsquake; a future ship could drive the mode from the recorded ground-motion trace of a catalogued event for a quantitatively faithful reading.
   _⚙ Status: `investigate` · lesson #12328_

14. **The interior cutaway is depicted rather than computed.**
   The crust/mantle/core layering in the reading-the-interior mode is depicted rather than rendered from the published interior model (the seismic velocity profile and the core radius from the InSight inversions); a future ship could drive the cutaway from the real interior model for a quantitatively faithful view.
   _⚙ Status: `investigate` · lesson #12329_
