# Lessons — v1.49.1050

14 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **An imaging all-sky survey is a distinct observable form from a pointed imaging telescope.**
   Einstein/HEAO-2 (obs#8) was the first imaging X-ray telescope — it observed ~5,000 pointed targets with arcsecond-class optics. ROSAT (obs#11) added the survey dimension: scanning the whole sky with those same Wolter Type I optics. The two firsts are complementary and must never be conflated.
   _⚙ Status: `investigate` · lesson #12157_

2. **The three-way partition (Uhuru/Einstein/ROSAT) must be stated explicitly in every survey-first claim.**
   Stating "first all-sky survey" (without "with imaging optics") incorrectly re-stamps Uhuru's first. Stating "first imaging telescope" incorrectly re-stamps Einstein's first. The correct scope for ROSAT is always "first all-sky survey WITH imaging optics."
   _⚙ Status: `investigate` · lesson #12158_

3. **German-led framing is an accuracy requirement, not a qualifier.**
   ROSAT is not a NASA-with-German-instruments mission; it is a German-led mission with specific NASA and UK contributions. Every identification of ROSAT must open with "German-led (DLR/MPE)" before naming the contributors.
   _⚙ Status: `investigate` · lesson #12159_

4. **PSF values require the electrostatic-shield-halo context.**
   The "~2 arcsec" figure circulates in the literature as a mirror-core specification; the ~5 arcsec effective PSF is the flight value. Cite ~5 arcsec for any in-flight imaging performance claim.
   _⚙ Status: `investigate` · lesson #12160_

5. **EUV catalog version disambiguation prevents a recurring error.**
   383 (1993 BSC) and 479 (1995 2RE) are two distinct catalog editions of the same WFC survey. Citing "479 sources" alone loses the original-survey publication. Cite both with dates at every occurrence.
   _⚙ Status: `investigate` · lesson #12161_

6. **XDINS anchor scope must encode radio-quiet.**
   "Isolated neutron stars in X-rays" pre-dates ROSAT by a decade (Einstein radio-loud pulsars). The correct scope is "thermally-emitting, radio-quiet isolated neutron stars (XDINS / Magnificent Seven)."
   _⚙ Status: `investigate` · lesson #12162_

7. **Soft-CXB and hard-CXB resolution belong to different missions.**
   ROSAT resolved ~70–80% of the soft (0.5–2 keV) CXB. Chandra resolved the hard CXB. Einstein holds the first-instance for CXB source resolution. Conflating the three is a recurring error class.
   _⚙ Status: `investigate` · lesson #12163_

8. **A continuation keeps predecessors' shared vocabulary and references them by name.**
   The X-ray-astronomy vocabulary (Wolter optics, Scorpius X-1, Giacconi and Rossi, neutron star, AGN, galaxy cluster, SNR, intracluster medium, keV, effective area, etc.) is correct and kept. Chandra through HEAO-1 are referenced as the form complements. Only predecessor-specific hardware and anchors stay with their missions.
   _⚙ Status: `investigate` · lesson #12164_

9. **Ops-end / reentry separation is load-bearing for ROSAT.**
   Science closed February 1999; reentry occurred 23 October 2011 — a 12-year gap. The two events must never be collapsed into one.
   _⚙ Status: `investigate` · lesson #12165_

10. **Clone source is HEAO-1 (non-imaging); ROSAT is imaging.**
   The most structural replacement in the rewrite is removing ALL "non-imaging," "collimated counters," "spin-stabilized," "TRW," "MSFC," "Atlas-Centaur/LC-36B," "A-1/A-2/A-3/A-4 instruments," and "842 sources" language and replacing with ROSAT's imaging Wolter optics, 3-axis stabilization, Dornier/DLR/MPE, Delta II/SLC-17A, PSPC/HRI/WFC instruments, and 1RXS ~124,730 sources.
   _⚙ Status: `investigate` · lesson #12166_

11. **The shader renders procedural geometry rather than archived survey data.**
   The imaging-survey shader uses analytic curves and procedural noise rather than loading actual 1RXS catalog source positions on the celestial sphere. A future revision could render the real ~124,730-source RASS positions (publicly available from HEASARC) for a higher-fidelity view of the imaged sky.
   _⚙ Status: `investigate` · lesson #12167_

12. **The ROSAT diorama is a forthcoming artifact.**
   The 3D-printable diorama STL files are referenced as forthcoming rather than provided; a future ship could include the actual STL geometry of the 3-axis stabilized spacecraft with the XRT baffle tube, solar panels, and star-tracker assembly.
   _⚙ Status: `investigate` · lesson #12168_

13. **The WFC EUV survey is described but not computed.**
   The S1 / S2 EUV band configuration, the transmission curves, and the survey strategy are described but not rendered as a computed sky map; a future ship could integrate the published ROSAT WFC BSC positions into the EUV shader mode for a historically accurate EUV sky view.
   _⚙ Status: `investigate` · lesson #12169_

14. **The soft CXB resolved fraction is described rather than demonstrated.**
   The ~70–80% soft-band CXB resolution is cited (Hasinger et al. 1998) but not demonstrated as a model; a future ship could render the unresolved-to-resolved CXB fraction as a shader animation.
   _⚙ Status: `investigate` · lesson #12170_
