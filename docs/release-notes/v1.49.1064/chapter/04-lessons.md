# Lessons — v1.49.1064

14 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **A sustain keeps the predecessor's axis vocabulary and replaces only the predecessor-specific content.**
   Mars Odyssey shares the Mars-exploration vocabulary with the MGS predecessor (Mars, the red planet, the surface, the subsurface, water ice, the atmosphere, dust, in situ, planetary exploration, crust, topography, mineralogy) — that vocabulary is shared and correct. The rewrite removed only the MGS-specific content (the Mars Global Surveyor name, the recovery of the 1993 Mars Observer loss, MOLA and the first global topographic map, the crustal magnetism / ancient dynamo / MAG/ER, the TES first global thermal-IR mineral survey, the Meridiani-hematite framing as MGS's, MOC and the gullies, M. Acuña, the 7 November 1996 launch and 12 September 1997 orbit insertion, and the Ferruginous Hawk + Moss Campion pairing) and replaced it with Mars Odyssey content.
   _⚙ Status: `investigate` · lesson #12358_

2. **A sustain has no axis rotation to frame — and 1.246 was itself a sustain, so there is no rotation framing to remove.**
   The Mars axis opened at 1.238 (Viking, substrate-axis rotation #36); 1.239 through 1.247 are all SUSTAINS, so the clone source carries no rotation narrative, and at most a single distant note records that the Mars axis itself opened at 1.238 by rotating from the X-ray-astronomy axis (rotation #35, held complete at obs#15).
   _⚙ Status: `investigate` · lesson #12359_

3. **The water-ice first is the first global DETECTION FROM ORBIT — Phoenix TOUCHED it first.**
   Odyssey's GRS/neutron suite detected abundant hydrogen in the shallow subsurface in 2002, interpreted as vast deposits of water ice poleward of ~±60°; the catalog scopes this as the first global detection / mapping of near-surface hydrogen → water ice from orbit (gamma-ray/neutron remote sensing), frames it as "evidence of / interpreted as" water ice, notes that Phoenix (2008) was the first to physically TOUCH it in situ (Odyssey's detection guided Phoenix's landing site), and never writes "first water on Mars."
   _⚙ Status: `investigate` · lesson #12360_

4. **THEMIS is a visible + thermal-IR imager — not a re-stamp of MGS's TES first.**
   THEMIS (PI Philip Christensen, the same PI as MGS's TES) imaged the surface at higher spatial resolution, mapping temperature, mineralogy, and morphology; the catalog describes THEMIS as imaging and mapping and never re-claims MGS's TES "first global thermal-IR mineral survey" (obs#9). THEMIS is not anchored.
   _⚙ Status: `investigate` · lesson #12361_

5. **The radiation first is the first dedicated characterization en route to and at Mars — not "first radiation measurement in space.**
   MARIE made the first dedicated measurements of the energetic-particle radiation environment during the cruise to Mars and in orbit at Mars; the catalog scopes this as the first dedicated radiation-environment characterization en route to and at Mars for human-mission planning, notes that deep-space radiation detectors existed earlier, and keeps the claim scoped. MARIE collected data through 2003 until a large solar particle event ended it.
   _⚙ Status: `investigate` · lesson #12362_

6. **The longevity is "longest-operating spacecraft AT MARS," present tense, still active.**
   Odyssey is the longest-operating spacecraft at Mars, in continuous operation since 2001 (about 25 years and more than 105,000 orbits as of 2026); it took the record on 15 December 2010, surpassing MGS's 3,340-day record; the catalog scopes the record "at Mars / at any planet beyond Earth" (the Voyagers operate longer in deep space), uses present tense, and never describes Odyssey as ended.
   _⚙ Status: `investigate` · lesson #12363_

7. **Odyssey is an ORBITER and the enduring telecom relay — never a lander.**
   Odyssey did not land or traverse; it has kept its watch over Mars from a Sun-synchronous polar orbit and is the enduring telecom relay for the surface missions (Spirit, Opportunity, Phoenix, Curiosity, Perseverance); the catalog never describes Odyssey landing or roving and never re-claims any surface first.
   _⚙ Status: `investigate` · lesson #12364_

8. **The mission is framed positively and in the present tense — Odyssey is still active.**
   Odyssey has operated for about 25 years and is still active as of 2026; the catalog frames the mission positively as a long, continuing watch over Mars and never describes it as ended or past-tense. MARIE's end in 2003 is noted once at low density as a single instrument ending, not the mission ending.
   _⚙ Status: `investigate` · lesson #12365_

9. **A sustain references its predecessor exactly once, deliberately.**
   The only correct predecessor reference is a single nav-prev lineage note to v1.246 Mars Global Surveyor (Mars obs#9), plus lineage references to MAVEN (1.245, obs#8), InSight (1.244, obs#7), Perseverance (1.243, obs#6), Curiosity (1.242, obs#5), the Mars Exploration Rovers (1.241, obs#4), Mars Pathfinder (1.240, obs#3), Mariner 9 (1.239, obs#2), Viking (1.238, obs#1), and Mariner 4 (1.36, the first Mars flyby). The predecessors' anchors stay with them — 0 re-stamps.
   _⚙ Status: `investigate` · lesson #12366_

10. **Clone source is MGS (a NASA mapping orbiter, JPL / Lockheed Martin, 1996–2006); Odyssey is a NASA long-watch orbiter (JPL / Lockheed Martin, 2001–present).**
   The most structural replacement in the rewrite is removing ALL MGS-specific content — "Mars Global Surveyor," "MGS," the recovery of the 1993 Mars Observer loss, "MOLA" and the first global topographic map, the crustal magnetism / ancient dynamo / "MAG/ER," the "TES" first global thermal-IR mineral survey, the Meridiani-hematite framing as MGS's, "MOC" and the gullies, "M. Acuña," the 7 November 1996 launch, the 12 September 1997 orbit insertion, and the Ferruginous Hawk + Moss Campion pairing — and replacing it with 2001 Mars Odyssey, the name from Arthur C. Clarke's "2001: A Space Odyssey," the Delta II 7925 launch from Cape Canaveral SLC-17A (7 April 2001), the 24 October 2001 Mars orbit insertion, the aerobraking into the Sun-synchronous polar mapping orbit, the instruments THEMIS,…
   _⚙ Status: `investigate` · lesson #12367_

11. **The shader renders procedural geometry rather than archived mission imagery.**
   The Odyssey shader uses analytic curves and procedural noise rather than loading actual mission data or THEMIS imagery. A future revision could render a real THEMIS mosaic or a GRS/neutron hydrogen-abundance map (publicly available from the Planetary Data System) for a higher-fidelity view.
   _⚙ Status: `investigate` · lesson #12368_

12. **The Odyssey diorama is a forthcoming artifact.**
   The 3D-printable diorama STL files are referenced as forthcoming rather than provided; a future ship could include the actual STL geometry of the orbiter with its high-gain antenna, its solar array, and the THEMIS / GRS / MARIE instrument deck.
   _⚙ Status: `investigate` · lesson #12369_

13. **The hydrogen-beneath mode is depicted rather than driven by real neutron data.**
   The buried-ice signature in the third mode is depicted but not rendered from the archived GRS/neutron hydrogen-abundance grid; a future ship could drive the mode from the real gridded near-surface hydrogen map for a quantitatively faithful reading of the high-latitude enhancement poleward of ~±60°.
   _⚙ Status: `investigate` · lesson #12370_

14. **The radiation mode is depicted rather than computed.**
   The MARIE radiation streams in the fourth mode are depicted rather than rendered from the published cruise-and-orbit particle-flux data; a future ship could drive the mode from the real measured dose record for a quantitatively faithful view.
   _⚙ Status: `investigate` · lesson #12371_
