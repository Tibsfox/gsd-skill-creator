# Astrophysics Paper Queue — Discovery Run #17

**Date:** 2026-04-10
**Source:** Discovery engine run #17, items #604-700
**Status:** Staged for NASA branch intake
**Branch target:** `nasa`

---

## Exoplanets (astro-ph.EP) — 8 papers

| # | Topic | Key Focus | NASA Mission Mapping |
|---|-------|-----------|---------------------|
| 1 | Ariel mission simulated spectra | Atmospheric characterization pipeline for Ariel's target list | Ariel (ESA, 2029 launch) |
| 2 | Wide-orbit planets around M dwarfs | Radial velocity survey of Jupiter-analogs in M-dwarf systems | Exoplanet demographics, HWO target refinement |
| 3 | K2-18b atmospheric chemistry | Revised transmission spectra — DMS signal reassessment | JWST Cycle 2+ follow-up |
| 4 | Hera mission calibration frames | Didymos/Dimorphos approach imagery processing pipeline | Hera (ESA), DART follow-up |
| 5 | Exocometary transit signatures | Photometric detection of evaporating exocomets in Kepler/TESS data | TESS extended mission |
| 6 | Biosignature false positive catalog | Abiotic sources of O2, CH4, and PH3 in rocky planet atmospheres | HWO/LIFE design requirements |
| 7 | Hot Jupiter atmospheric escape | Lyman-alpha transit observations of WASP-69b mass loss | HST UV program |
| 8 | Circumbinary planet stability zones | N-body stability maps for S-type vs P-type orbits | Kepler/TESS circumbinary candidates |

## Stellar (astro-ph.SR) — 3 papers

| # | Topic | Key Focus | NASA Mission Mapping |
|---|-------|-----------|---------------------|
| 9 | eROSITA cool star X-ray survey | First all-sky X-ray catalog of cool dwarfs (K/M) | eROSITA (SRG), XMM-Newton cross-calibration |
| 10 | Flare-inactive M dwarfs | Population statistics of magnetically quiet M dwarfs | TESS flare survey, habitability implications |
| 11 | Chromospheric wind regulation | Wind mass-loss rates governed by chromospheric activity cycles | Parker Solar Probe scaling laws |

## General Astrophysics — 11 papers

| # | Topic | Key Focus | NASA Mission Mapping |
|---|-------|-----------|---------------------|
| 12 | Abell 2744 gravitational lensing | Deep JWST lensing model — 8 new multiply-imaged systems | JWST UNCOVER program |
| 13 | PHANGS-ALMA nearby galaxies | Molecular gas survey of 74 nearby spirals at 100 pc resolution | ALMA + JWST PHANGS |
| 14 | Goldilocks zone water detection | Mid-IR water vapor in terrestrial-zone disks around Sun-like stars | JWST MIRI observations |
| 15 | GRB afterglow radiation models | Multi-wavelength modeling of GRB 221009A (BOAT) afterglow | Swift, Fermi, IXPE |
| 16 | SEUSHI solar EUV instrument | Next-gen solar EUV spectrometer design for L1 operations | SOHO/SDO successor |
| 17 | High-z galaxy morphology | JWST NIRCam rest-frame UV morphologies at z > 8 | JWST JADES program |
| 18 | Pulsar timing array updates | NANOGrav 15-year stochastic GW background refinement | Pulsar timing / LISA precursor |
| 19 | Interstellar medium turbulence | MHD simulations of ISM density power spectra | Voyager ISM measurements |
| 20 | Dark matter subhalo detection | Stellar stream gap statistics in Gaia DR4 | Gaia, Roman Space Telescope |
| 21 | Fast radio burst host galaxies | Localization and host properties of 12 new FRBs | CHIME/FRB, DSA-110 |
| 22 | Cosmic dawn 21cm forecasts | Updated power spectrum predictions for HERA/SKA observations | HERA, SKA-Low |

---

## Processing Notes

- These papers feed the NASA mission catalog on the `nasa` branch (720 missions).
- Each paper should be processed into a catalog entry following the NASA CSV format.
- Priority: biosignature papers (#6) and JWST programs (#12, #14, #17) align with active research threads.
- The K2-18b paper (#3) connects to the existing astrobiology research page.
- Abell 2744 (#12) connects to the gravitational lensing research page.
- GRB 221009A (#15) is the "Brightest of All Time" — already referenced in the high-energy astrophysics catalog.

## Integration Steps

1. Switch to `nasa` branch
2. For each paper: fetch abstract, write catalog entry, map to existing mission taxonomy
3. Update NASA catalog CSV with new entries
4. Cross-reference with existing pages in `www/tibsfox/com/Research/NASA/`
5. Commit as batch: `docs(nasa): 22 astrophysics papers from discovery run #17`

---

## Addendum: Notes on flagship items (added April 2026)

This addendum was added as part of the Session 018 catalog enrichment
pass. The queue document above is a processing intake list rather than
a deep research document, so this enrichment is intentionally brief —
it flags the 2025 status of the two most-cited entries and notes the
cross-links to the college department structure.

### Item #3 — K2-18b DMS reassessment (priority note)

The April 2025 Madhusudhan et al. paper (the one this queue entry was
recording) claimed a ~3σ detection of **dimethyl sulfide (DMS) and
dimethyl disulfide (DMDS)** in K2-18 b's JWST MIRI 5–12 µm spectrum.
By the time this queue would be processed into a catalog entry, the
**community reanalysis** has shifted the picture substantially:

- **Welbanks et al. (2025)** and **Taylor (2025)** reanalyzed the
  same data and found the DMS/DMDS signal is **not robust across
  different data reductions or molecule-inclusion choices in the
  baseline model**.
- A **comprehensive reanalysis** of K2-18 b's full JWST
  NIRISS+NIRSpec+MIRI spectrum (Schmidt et al. 2025) reports a
  tentative DMS signal at **~2.7σ**, which is **below** the 3σ
  threshold that would ordinarily be taken as a credible detection
  and nowhere near the 5σ threshold the astrobiology community has
  set for biosignature claims.
- The updated consensus portrait is that K2-18 b has a
  water-rich atmosphere (possibly up to ~50% H₂O by mass) with
  methane and carbon dioxide, but **DMS/DMDS are not detected
  robustly** and the earlier claims **do not meet the community's
  standards of evidence for life**.

For the NASA catalog, this means item #3 should be written up as a
**biosignature debate** rather than a **biosignature detection**.
The catalog framing matters: "JWST reveals K2-18 b water-rich
atmosphere; DMS biosignature claims under active community
reanalysis" is the honest 2025 state.

**Sources:** [Insufficient evidence for DMS and DMDS in the atmosphere of K2-18 b — A&A, August 2025 (arXiv 2505.13407)](https://arxiv.org/html/2505.13407) · [New Constraints on DMS and DMDS in the Atmosphere of K2-18 b from JWST MIRI — arXiv 2504.12267](https://arxiv.org/abs/2504.12267) · [A Comprehensive Reanalysis of K2-18 b's JWST NIRISS+NIRSpec Transmission Spectrum — arXiv 2501.18477](https://arxiv.org/html/2501.18477v2) · [Biosignatures or noise? New analysis of K2-18b data casts doubt — NPR, April 25, 2025](https://www.npr.org/2025/04/25/g-s1-62610/biosignatures-k2-18b-james-webb-exoplanet-doubt) · [K2-18b Does Not Meet The Standards Of Evidence For Life — Astrobiology.com, August 2025](https://astrobiology.com/2025/08/k2-18b-does-not-meet-the-standards-of-evidence-for-life.html) · [K2-18b — Wikipedia](https://en.wikipedia.org/wiki/K2-18b)

### Items #6, #12, #14, #17 — still-active priority threads

The processing notes above flag biosignature papers (#6), JWST
programs (#12 Abell 2744, #14 water in terrestrial-zone disks, #17
high-z galaxy morphology) as aligning with active research threads.
As of April 2026 all four threads remain active with ongoing
publication streams, and the priority framing is still correct.
The K2-18 b reassessment (item #3 above) is a case study for how
the **biosignature false positive catalog (item #6)** should be
framed in the NASA mission pages — it is the most recent concrete
example of why false-positive work matters.

## Related College Departments

This research queue cross-links to the following college departments
in `.college/departments/`:

- [**astronomy**](../../../.college/departments/astronomy/DEPARTMENT.md)
  — The queue is a direct astronomy-department intake list:
  exoplanets, stellar astrophysics, high-energy astrophysics,
  cosmology, gravitational waves.
- [**physics**](../../../.college/departments/physics/DEPARTMENT.md)
  — Gravitational lensing (Abell 2744), MHD (ISM turbulence),
  general relativity (pulsar timing arrays), and high-energy
  particle physics (GRB 221009A BOAT afterglow) are all
  physics-department-relevant threads.
- [**chemistry**](../../../.college/departments/chemistry/DEPARTMENT.md)
  — Atmospheric chemistry (K2-18b, hot Jupiter escape, biosignature
  false positives) sits between astronomy and chemistry and is a
  good cross-department teaching target.
- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)
  — N-body stability maps (#8), power spectra (#19, #22), and
  gravitational-wave statistical detection (#18) are all
  mathematics-department methods applied to astrophysical data.

---

*Addendum (K2-18b 2025 reassessment, priority notes, college cross-link) added during the Session 018 catalog enrichment pass.*
