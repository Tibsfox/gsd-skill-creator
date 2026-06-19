# Lessons — v1.49.1053

14 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **A CCD-imaging-spectroscopy observatory is a distinct observable form from a largest-effective-area focusing observatory.**
   XMM-Newton (obs#13) carried the largest pointed effective area of any focusing X-ray observatory. ASCA (obs#14) advances the focusing-imaging branch to the first union of imaging optics with X-ray CCDs for broadband imaging spectroscopy — a focused image plus a CCD-grade spectrum of the same source together — a distinct partition the focusing-imaging branch must keep.
   _⚙ Status: `investigate` · lesson #12199_

2. **The Chandra/Einstein/XMM partition must be stated in every imaging or spectroscopy claim.**
   "Sub-arcsecond imaging" and "first high-resolution X-ray spectroscopy" belong to Chandra (obs#1); "first imaging X-ray telescope / focusing-imaging origin" belongs to Einstein (obs#8); "largest pointed effective area," "first reflection gratings," and "first co-aligned optical/UV monitor" belong to XMM-Newton (obs#13). The correct scope for ASCA is "first X-ray CCD imaging spectroscopy," "first thin-foil mirrors on a satellite," and "first resolved relativistic iron line" — ASCA is ~2.9 arcmin coarse and MODERATE resolution.
   _⚙ Status: `investigate` · lesson #12200_

3. **ISAS-mission framing is an accuracy requirement, not a qualifier.**
   ASCA is an ISAS mission of Japan (Japan's 4th X-ray satellite, NEC bus, Mu-3SII launch from Uchinoura), not a NASA mission; the NASA/US contribution is confined to the GSFC-LED XRT foil optics (GSFC + Nagoya + ISAS, "designed and led" not "built"), the MIT-led SIS CCDs (MIT + Osaka + ISAS, not GSFC), and the GOF at GSFC. Every identification of ASCA states the ISAS framing before naming the GSFC / MIT / GOF contribution.
   _⚙ Status: `investigate` · lesson #12201_

4. **The CCD / imaging-spectroscopy first requires scoping at every occurrence.**
   "First CCDs flown on an X-ray observatory in orbit" and "first broadband X-ray imaging spectroscopy WITH CCDs" (BBXRT did broadband focused Si(Li) spectroscopy in 1990; CCDs were used in X-ray lab/rocket and optical-space contexts earlier); never "first X-ray CCD ever," "first broadband X-ray spectroscopy absolute," "first high-resolution X-ray spectroscopy" (Chandra / XRISM), or "first CCD survey" (eROSITA). SIS resolution is MODERATE (~120 eV).
   _⚙ Status: `investigate` · lesson #12202_

5. **The foil-telescope first is scoped to a free-flying satellite.**
   BBXRT flew the same Serlemitsos foil concept on Space Shuttle ASTRO-1 in December 1990 (with Si(Li) detectors, NOT CCDs) and a 1988 sounding rocket flew foil optics earlier; ASCA is NOT first-ever foil mirrors. The ~2.9 arcmin foil resolution is COARSE — Chandra owns sub-arcsecond, Einstein owns the focusing-imaging origin.
   _⚙ Status: `investigate` · lesson #12203_

6. **The iron-line first is "first clear/resolved relativistic profile.**
   MCG−6−30−15 (Tanaka 1995) is the first resolved relativistic Fe Kα profile, NOT the first iron K-alpha line (Mushotzky 1978, OSO-8), NOT the first broad iron line (Ginga, unresolved). The profile was PREDICTED by Fabian et al. 1989 — ASCA gave the first observational confirmation; XMM/NuSTAR/Suzaku only refined it.
   _⚙ Status: `investigate` · lesson #12204_

7. **Firsts that are NOT ASCA's belong to their owners.**
   The largest effective area + reflection gratings + co-aligned optical/UV monitor (XMM-Newton, obs#13); sub-arcsecond + first high-res grating spectroscopy + NASA Great Observatory (Chandra, obs#1); the focusing-imaging telescope ORIGIN (Einstein, obs#8); the largest catalog + first CCD all-sky survey (eROSITA, obs#12); non-dispersive microcalorimeter high-res spectroscopy (XRISM, obs#7). None are re-stamped.
   _⚙ Status: `investigate` · lesson #12205_

8. **A continuation keeps predecessors' shared vocabulary and references them by name.**
   The X-ray-astronomy vocabulary (Wolter Type I, grazing-incidence, focusing optics, soft X-ray, effective area, CCD, source catalog, intracluster medium, galaxy cluster, X-ray binary, neutron star, black hole, AGN, accretion disk, supernova remnant, Seyfert galaxy, iron K-alpha line, keV, Giacconi and the 1962 founding) is correct and kept. Chandra through XMM-Newton are referenced as the form complements. Only predecessor-specific hardware and anchors stay with their missions.
   _⚙ Status: `investigate` · lesson #12206_

9. **The Koyama SN 1006 citation is Nature 378, 255 (NOT PASJ).**
   The SN 1006 synchrotron result (Koyama, Petre, Gotthelf et al. 1995) appeared in Nature, not PASJ; the iron-line paper (Tanaka et al. 1995) is Nature 375, 659. The ASCA mission paper (Tanaka, Inoue & Holt 1994) is PASJ 46, L37; the XRT paper (Serlemitsos et al. 1995) is PASJ 47, 105; the GIS paper (Ohashi et al. 1996) is PASJ 48, 157.
   _⚙ Status: `investigate` · lesson #12207_

10. **Clone source is XMM-Newton (largest-effective-area ESA observatory, Ariane, eccentric orbit); ASCA is CCD-imaging-spectroscopy (ISAS/Japan, Mu-3SII, low Earth orbit).**
   The most structural replacement in the rewrite is removing ALL "X-ray Multi-Mirror Mission," "European Space Agency / second Cornerstone of Horizon 2000," "Dornier Satellitensysteme / Astrium," "Ariane 5 G flight 504 / Kourou / 10 December 1999," "highly eccentric ~48-hour orbit / perigee ~7,000 km / apogee ~114,000 km," "three Wolter Type I telescopes of 58 gold-coated nickel shells each," "Media Lario flight shells / Carl Zeiss mandrels," "EPIC cameras (MOS + pn)," "two RGS reflection-grating spectrometers," "30-cm Optical Monitor," "largest pointed effective area ~4,500 cm²," "cluster cooling-flow refutation," "8,486 refereed papers," "5XMM serendipitous catalog," "Newton suffix named 9 February 2000," "US RGS gratings from Columbia/LLNL/Kahn," and "COSPAR 1999-066A" language and…
   _⚙ Status: `investigate` · lesson #12208_

11. **The shader renders procedural geometry rather than archived observation data.**
   The CCD-imaging-spectroscopy shader uses analytic curves and procedural noise rather than loading an actual ASCA SIS spectrum or the MCG−6−30−15 iron-line profile. A future revision could render the real relativistic iron-line profile (publicly available from the ASCA archive at HEASARC) or an archived SIS imaging-spectroscopy frame for a higher-fidelity view.
   _⚙ Status: `investigate` · lesson #12209_

12. **The ASCA diorama is a forthcoming artifact.**
   The 3D-printable diorama STL files are referenced as forthcoming rather than provided; a future ship could include the actual STL geometry of the spacecraft with the four co-aligned thin-foil XRT telescopes, the SIS and GIS focal-plane assemblies, and the solar arrays.
   _⚙ Status: `investigate` · lesson #12210_

13. **The relativistic iron line is described but not computed.**
   The skewed, broadened iron K-alpha profile (gravitational-redshift red wing + Doppler-beaming blue peak) is described but not rendered as a computed disk-line model; a future ship could integrate a published relativistic disk-line model (e.g., the Fabian et al. 1989 / Laor profile) into the shader's iron-line mode for a historically accurate view.
   _⚙ Status: `investigate` · lesson #12211_

14. **The CCD-imaging-spectroscopy advance is described rather than demonstrated.**
   The first union of a focused image with a CCD-resolved spectrum is cited but not demonstrated as an interactive image-plus-spectrum figure; a future ship could render the SIS pixel array reading both the position and the energy of each photon as a shader or interactive plot.
   _⚙ Status: `investigate` · lesson #12212_
