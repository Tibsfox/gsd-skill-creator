# Lessons — v1.49.1051

14 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **A CCD-detector all-sky survey is a distinct observable form from an imaging gas-proportional-counter survey.**
   ROSAT (obs#11) performed the first imaging all-sky survey with a Wolter telescope feeding a position-sensitive proportional counter (~41% energy resolution at 1 keV). eROSITA (obs#12) advanced the survey/catalog branch to back-illuminated frame-store pn-CCD focal planes (~6% at 1.5 keV) and extended it to 8 keV — a generation advance the four-way partition must keep distinct.
   _⚙ Status: `investigate` · lesson #12171_

2. **The four-way partition (Uhuru / Einstein / ROSAT / eROSITA) must be stated explicitly in every survey-first claim.**
   "First all-sky survey" re-stamps Uhuru; "first imaging telescope" re-stamps Einstein; "first imaging all-sky survey" re-stamps ROSAT. The correct scope for eROSITA is always "first purpose-designed all-sky survey with CCD detectors" and "the largest all-sky X-ray source catalog to date."
   _⚙ Status: `investigate` · lesson #12172_

3. **German-Russian framing is an accuracy requirement, not a qualifier.**
   eROSITA is a German MPE instrument aboard the Russian Spektr-RG spacecraft, not a NASA mission; NASA's hardware contribution is confined to the ART-XC mirror modules (reimbursable agreement). Every identification of eROSITA must open with "German MPE instrument aboard the Russian Spektr-RG" before naming the NASA ART-XC contribution.
   _⚙ Status: `investigate` · lesson #12173_

4. **High-priority numeric and hardware errors recur in secondary sources.**
   Blok DM-03 (not Briz-M); Media Lario (not Carl Zeiss); pn-CCD (not proportional counter); CdTe DSSD for ART-XC (not silicon, not CCD); ~16–18″ HEW (not ~5–6″ pointed); 6 rev/day (4-hour period, not 4 rev/day); ~930,000 (not ~927,000). Each was stated correctly at every occurrence.
   _⚙ Status: `investigate` · lesson #12174_

5. **Sensitivity and sky-coverage discipline prevents a recurring overclaim.**
   eRASS1 is ~2.5–4× deeper than ROSAT; the ~25× factor is the full eRASS:8 design. The ~930,000-source catalog is the WESTERN HALF-SKY count (eastern hemisphere belongs to IKI / Russia, unreleased). Both qualifiers are carried at every occurrence.
   _⚙ Status: `investigate` · lesson #12175_

6. **The eROSITA Bubbles anchor must encode "complete bilateral system," not "first X-ray detection.**
   The North Polar Spur / Loop I was in ROSAT data; Sofue 2000 proposed a Galactic-center bipolar interpretation from ROSAT data. eROSITA's first is the unified bilateral hourglass system (the southern counterpart bubble + the unified morphology), and the eROSITA and Fermi Bubbles are co-origin but physically distinct.
   _⚙ Status: `investigate` · lesson #12176_

7. **Boundary firsts belong to other missions.**
   The first X-ray detection of cosmic-web filaments belongs to ROSAT/Tanimura 2020 (eROSITA = highest significance only); the first cluster-cosmology constraints predate eROSITA (eROSITA = tightest to date); the CXB was discovered by the 1962 AS&E rocket and Einstein owns CXB source-resolution. None are re-stamped.
   _⚙ Status: `investigate` · lesson #12177_

8. **A continuation keeps predecessors' shared vocabulary and references them by name.**
   The X-ray-astronomy vocabulary (Wolter Type I, grazing-incidence, focusing optics, soft X-ray, all-sky survey, source catalog, cosmic X-ray background, intracluster medium, galaxy cluster, AGN, neutron star, Scorpius X-1, Giacconi and Rossi, the 1962 founding) is correct and kept. Chandra through ROSAT are referenced as the form complements. Only predecessor-specific hardware and anchors stay with their missions.
   _⚙ Status: `investigate` · lesson #12178_

9. **The suspension is operational, not terminal.**
   German operations were placed in safe mode on 26 February 2022; the hardware remains physically aboard and is not permanently powered off, and the companion ART-XC continued operating independently. The safe-mode event is stated as a suspension of German operations, never as a loss of the instrument.
   _⚙ Status: `investigate` · lesson #12179_

10. **Clone source is ROSAT (gas proportional counter, LEO); eROSITA is CCD at L2.**
   The most structural replacement in the rewrite is removing ALL "Röntgensatellit," "Delta II / SLC-17A," "Carl Zeiss," "four Wolter shells," "PSPC / HRI / WFC," "RASS / 1RXS ~124,735," "EUV / WFC," "Hyakutake," "XDINS / Magnificent Seven," "Trümper," "1990 / LEO / spin-or-3-axis-LEO," and "tri-national German/NASA/UK" language and replacing with eROSITA's CCD detectors, seven 54-shell Media Lario mirror assemblies, Proton-M / Blok DM-03 / Baikonur, L2 halo orbit, eRASS1–eRASS4, ~930,000-source catalog, eROSITA Bubbles, ART-XC companion, and the German-Russian (NASA-ART-XC-mirrors-only) architecture.
   _⚙ Status: `investigate` · lesson #12180_

11. **The shader renders procedural geometry rather than archived survey data.**
   The CCD-survey shader uses analytic curves and procedural noise rather than loading actual eRASS1 catalog source positions on the celestial sphere. A future revision could render the real ~930,000-source eRASS1 positions (publicly available from HEASARC for the western sky) for a higher-fidelity view of the imaged sky.
   _⚙ Status: `investigate` · lesson #12181_

12. **The eROSITA diorama is a forthcoming artifact.**
   The 3D-printable diorama STL files are referenced as forthcoming rather than provided; a future ship could include the actual STL geometry of the Spektr-RG spacecraft with the seven hexagonally-packed Wolter mirror assemblies, the ART-XC concentrators, and the solar panels.
   _⚙ Status: `investigate` · lesson #12182_

13. **The eROSITA Bubbles are described but not computed.**
   The two ~14 kpc cavities, the ~0.3 keV thermal forward shock, and the bilateral hourglass morphology are described but not rendered as a computed all-sky map; a future ship could integrate a published bubble model into the shader's Bubbles mode for a historically accurate view.
   _⚙ Status: `investigate` · lesson #12183_

14. **The galaxy-cluster cosmology result is described rather than demonstrated.**
   The 5,259-cluster cosmology subsample and the tightest-to-date constraints (Ghirardini et al. 2024) are cited but not demonstrated as a model; a future ship could render the cluster-abundance constraint as a shader or interactive figure.
   _⚙ Status: `investigate` · lesson #12184_
