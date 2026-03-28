# Multi-Messenger Astronomy

> **Domain:** Gravitational Wave Astrophysics
> **Module:** 4 -- Neutron Star Mergers, Electromagnetic Counterparts, and the New Astronomy
> **Through-line:** *On August 17, 2017, the universe sent the same message through two different channels simultaneously. LIGO and Virgo heard a 100-second gravitational wave chirp from two neutron stars spiraling together 130 million light-years away. 1.7 seconds later, the Fermi satellite saw a gamma-ray burst from the same location. Within hours, 70 observatories across every wavelength of light were watching a kilonova bloom -- the radioactive afterglow of freshly forged heavy elements. Gold, platinum, uranium: created in the collision and glowing in the infrared as they decayed. Multi-messenger astronomy was born.*

---

## Table of Contents

1. [GW170817: The Event](#1-gw170817-the-event)
2. [The Gravitational Wave Signal](#2-the-gravitational-wave-signal)
3. [The Gamma-Ray Burst: GRB 170817A](#3-the-gamma-ray-burst-grb-170817a)
4. [The Kilonova: AT 2017gfo](#4-the-kilonova-at-2017gfo)
5. [r-Process Nucleosynthesis](#5-r-process-nucleosynthesis)
6. [The 70-Observatory Campaign](#6-the-70-observatory-campaign)
7. [GraceDB and the Alert System](#7-gracedb-and-the-alert-system)
8. [Sky Localization](#8-sky-localization)
9. [O4 Multi-Messenger Results](#9-o4-multi-messenger-results)
10. [Neutron Star Physics](#10-neutron-star-physics)
11. [Cosmology: The Hubble Constant](#11-cosmology-the-hubble-constant)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. GW170817: The Event

GW170817 was a binary neutron star (BNS) merger observed on August 17, 2017, at 12:41:04 UTC. It was detected by both LIGO detectors and Virgo (which had joined the network just two weeks earlier). The source was located in the galaxy NGC 4993, at a distance of approximately 40 Mpc (130 million light-years) -- making it the closest gravitational wave source and the loudest signal (by strain amplitude at Earth) observed to date [1].

### Source Parameters

| Parameter | Value |
|-----------|-------|
| Primary mass | 1.36-1.60 solar masses |
| Secondary mass | 1.17-1.36 solar masses |
| Total mass | 2.73 (+0.04/-0.01) solar masses |
| Chirp mass | 1.186 (+0.001/-0.001) solar masses |
| Luminosity distance | 40 (+8/-14) Mpc |
| Host galaxy | NGC 4993 (elliptical, z = 0.0098) |
| Sky area (90% credible) | 28 deg^2 |
| Network SNR | 32.4 |
| Inspiral duration in band | ~100 seconds (from 24 Hz) |
| GW frequency at merger | ~1600 Hz (estimated) |

GW170817 was the first BNS merger detected in gravitational waves, the first gravitational wave event with an identified electromagnetic counterpart, and the first joint GW+EM multi-messenger observation. It produced more scientific papers (over 100 in the first year) than any other single astrophysical event in history [2].

---

## 2. The Gravitational Wave Signal

The GW170817 gravitational wave signal lasted approximately 100 seconds in the LIGO sensitive band, entering at approximately 24 Hz and sweeping upward through the frequency band until it disappeared above the detector's sensitive range at approximately 1600 Hz (estimated, as the merger itself was at the edge of LIGO's bandwidth).

```
GW170817 vs GW150914: SIGNAL COMPARISON
================================================================

  Property              GW170817 (BNS)       GW150914 (BBH)
  ------------------------------------------------------------------
  Duration in band      ~100 seconds          ~0.2 seconds
  Entry frequency       24 Hz                 35 Hz
  Merger frequency      ~1600 Hz              ~150 Hz
  Network SNR           32.4                  24.4
  Chirp mass            1.186 M_sun           28.6 M_sun
  Distance              40 Mpc                410 Mpc
  Sky localization      28 deg^2              600 deg^2
  EM counterpart        Yes (GRB + kilonova)  No

  Note: BNS signals are MUCH longer than BBH signals because
  lower-mass systems spend more time at lower frequencies.
  The signal duration scales as M_chirp^(-5/3).
```

The signal was so long that it provided exquisite measurement of the chirp mass (0.1% precision) and tight constraints on the tidal deformability of the neutron stars -- a parameter that encodes information about the neutron star equation of state [3].

### The Livingston Glitch

A loud noise glitch occurred at LIGO Livingston 1.1 seconds before the merger. The glitch overlapped with the final seconds of the inspiral signal. It was removed by subtracting a wavelet-based model of the glitch morphology, and the analysis was repeated both with and without the Livingston data to confirm that the glitch subtraction did not bias the results. The source parameters were consistent regardless of whether Livingston data was included [4].

---

## 3. The Gamma-Ray Burst: GRB 170817A

The Fermi Gamma-ray Burst Monitor (GBM) detected a short gamma-ray burst, GRB 170817A, at 12:41:06 UTC -- 1.7 seconds after the estimated gravitational wave merger time. The INTEGRAL satellite independently confirmed the burst. This 1.7-second delay between GW and gamma-ray arrival was consistent with theoretical predictions for the time required to form a jet after the merger [5].

### Properties of GRB 170817A

| Property | Value |
|----------|-------|
| Duration (T90) | 2.0 (+0.5/-0.5) seconds |
| Delay after GW merger | 1.74 (+0.05/-0.05) seconds |
| Fluence (10-1000 keV) | 2.8 x 10^-7 erg/cm^2 |
| Peak luminosity | 1.6 x 10^47 erg/s |
| Isotropic-equivalent energy | 3.1 x 10^46 erg |

GRB 170817A was approximately 1000 times less luminous than typical short gamma-ray bursts (sGRBs). This was consistent with a "structured jet" model: the jet was observed off-axis (approximately 20-30 degrees from the jet axis), so Earth received only the dim edge of the gamma-ray emission rather than the bright core [6].

### The Speed of Gravity

The 1.7-second delay between the gravitational wave signal (traveling at the speed of gravity, c_gw) and the gamma-ray signal (traveling at the speed of light, c_em) over a distance of 130 million light-years placed a direct constraint on the speed of gravity:

```
|c_gw - c_em| / c_em < 3 x 10^-15
```

This extraordinary constraint ruled out a wide class of alternative gravity theories that predicted different speeds for gravitational and electromagnetic waves. Einstein's prediction that gravitational waves travel at exactly the speed of light was confirmed to 15 decimal places [7].

> **SAFETY WARNING:** The gamma-ray burst from a BNS merger at 40 Mpc poses no radiation hazard to Earth. The integrated fluence at Earth's distance was many orders of magnitude below harmful levels. Short gamma-ray bursts become dangerous only within approximately 1 kpc (3,260 light-years) [8].

---

## 4. The Kilonova: AT 2017gfo

Approximately 11 hours after the merger, an optical transient was discovered in NGC 4993 by the Swope 1-m telescope at Las Campanas Observatory in Chile. Designated AT 2017gfo (also SSS17a), this was the first kilonova ever observed with a known gravitational wave counterpart [9].

### Kilonova Evolution

A kilonova is the thermal emission from material ejected during and after a neutron star merger. The ejecta is rich in heavy r-process elements whose radioactive decay powers the optical and infrared emission:

```
KILONOVA LIGHT CURVE (AT 2017gfo)
================================================================

  Time After Merger    Wavelength    Brightness    Interpretation
  ------------------------------------------------------------------
  11 hours             Blue/UV       Peak          "Blue" kilonova:
                                                   light r-process
                                                   (lanthanide-free)

  1-2 days             Optical       Fading blue   Blue component fades
                       Near-IR       Rising        Red component rises

  3-7 days             Near-IR       Peak          "Red" kilonova:
                                                   heavy r-process
                                                   (lanthanide-rich)

  2-4 weeks            Mid-IR        Fading        Decay of actinides

  > 1 month            Radio/X-ray   Rising        Off-axis jet afterglow
```

The two-component structure (blue early, red late) was a critical observation. The blue component comes from relatively light r-process elements (strontium through silver) in the polar ejecta, which is lanthanide-free and therefore optically transparent. The red component comes from heavy r-process elements (lanthanides and actinides) in the equatorial ejecta, whose high opacity produces emission shifted to the infrared [10].

### Total Ejecta Mass

Modeling of the kilonova light curve estimated approximately 0.04-0.06 solar masses of ejected material:
- Blue component: ~0.01-0.02 solar masses, velocity ~0.2-0.3c
- Red component: ~0.03-0.04 solar masses, velocity ~0.1-0.2c

For comparison, 0.05 solar masses of ejected material containing r-process elements is equivalent to approximately 10 Earth masses of gold and 30 Earth masses of platinum [11].

---

## 5. r-Process Nucleosynthesis

The rapid neutron-capture process (r-process) is the mechanism by which elements heavier than iron are synthesized. In the extreme neutron-rich environment of a neutron star merger, nuclei capture neutrons faster than they can beta-decay, building up to very heavy (and initially very unstable) isotopes that subsequently decay toward the valley of stability [12].

### The Origin of Heavy Elements

Before GW170817, the astrophysical site of the r-process was debated. Two candidates:

1. **Core-collapse supernovae:** The classic proposed site, but detailed simulations showed that the conditions (neutron richness, entropy) in the neutrino-driven wind were not extreme enough for the heaviest r-process elements (third peak, A > 195).

2. **Neutron star mergers:** The extreme neutron richness of tidally disrupted neutron star material naturally produces the full range of r-process elements, including the third peak (gold, platinum, uranium). The main uncertainty was whether mergers occurred frequently enough to account for the observed galactic r-process abundance.

GW170817 provided the first direct evidence connecting neutron star mergers to r-process nucleosynthesis. Spectroscopic analysis of AT 2017gfo identified absorption features consistent with strontium (Z=38) in the early blue kilonova spectrum -- the first spectroscopic identification of a specific r-process element in merger ejecta [13].

### Contribution to Galactic Chemical Evolution

The estimated merger rate from LIGO/Virgo observations (100-4000 per Gpc^3 per year) combined with the ejecta mass per event (~0.05 solar masses) is consistent with neutron star mergers being the dominant source of r-process elements in the Milky Way. A single merger produces roughly 10^-5 solar masses of gold -- integrated over the galaxy's history, this is enough to account for all the gold on Earth [14].

```
r-PROCESS NUCLEOSYNTHESIS: KEY ELEMENTS
================================================================

  Element    Z    A      Source           Everyday Form
  -------------------------------------------------------
  Strontium  38   88     1st peak         Fireworks (red)
  Silver     47   107    Between peaks    Jewelry, electronics
  Tellurium  52   128    2nd peak         Thermoelectric devices
  Europium   63   152    Lanthanide       Fluorescent lighting
  Gold       79   197    3rd peak         Jewelry, electronics
  Platinum   78   195    3rd peak         Catalytic converters
  Uranium    92   238    Actinide         Nuclear fuel
  Thorium    90   232    Actinide         Geological dating

  Total r-process ejecta per merger: ~0.04-0.06 M_sun
  Merger rate: ~100-4000 per Gpc^3 per year
  Sufficient for all heavy elements in the Milky Way
```

---

## 6. The 70-Observatory Campaign

GW170817 triggered the largest coordinated astronomical observation campaign in history. Over 70 observatories across all wavelengths participated in follow-up observations [15]:

### Timeline of Observations

| Time After Merger | Band | Observatory | Discovery |
|-------------------|------|-------------|-----------|
| +1.7 seconds | Gamma-ray | Fermi GBM, INTEGRAL | GRB 170817A |
| +11 hours | Optical | Swope 1m (Las Campanas) | AT 2017gfo in NGC 4993 |
| +11 hours | Optical | 6 other teams | Independent discoveries |
| +15 hours | UV | Swift UVOT | UV emission (blue kilonova) |
| +1 day | Near-IR | VLT, Gemini, HST | Red kilonova emerging |
| +9 days | X-ray | Chandra | Off-axis jet afterglow |
| +16 days | Radio | VLA | Radio afterglow |
| +110 days | X-ray | Chandra | Rising afterglow (structured jet) |
| +230 days | Radio | VLA | Peak afterglow |

The UV/optical/IR observations were possible because the three-detector network (H1+L1+V1) localized the source to just 28 square degrees -- small enough for wide-field telescopes to survey efficiently. The host galaxy identification (NGC 4993 in the Hydra constellation) was straightforward because the localization region contained relatively few bright galaxies at the estimated distance [16].

### Publication Record

The multi-messenger observations of GW170817 produced:
- 1 joint GW+EM discovery paper with ~3,500 authors (all LIGO/Virgo/Fermi/INTEGRAL collaboration members)
- Over 100 papers in the first year
- The most-cited paper in all of physics in 2017
- A dedicated issue of *Astrophysical Journal Letters* with 31 companion papers [17]

---

## 7. GraceDB and the Alert System

GraceDB (Gravitational-Wave Candidate Event Database) is the LIGO-Virgo-KAGRA collaboration's real-time event database. It serves as the central hub for distributing gravitational wave alerts to the astronomical community [18].

### Alert Types

| Alert Type | Timing | Content | Action |
|-----------|--------|---------|--------|
| EARLYWARNING | Pre-merger (seconds) | BNS/NSBH prediction | Pre-position telescopes |
| PRELIMINARY | 1-10 minutes | Automated trigger | Sky map, classification |
| INITIAL | 4-24 hours | Human-vetted | Refined sky map, parameters |
| UPDATE | Days-weeks | Refined analysis | Updated parameters, classification |
| RETRACTION | Variable | Event withdrawn | Cancel follow-up |

### Alert Content

Each alert contains:
- **Superevent ID:** e.g., S230518h
- **Event time:** GPS seconds
- **False alarm rate (FAR):** Events per year
- **Significant flag:** Boolean (FAR < 1/year)
- **Classification probabilities:** BBH, BNS, NSBH, MassGap, Terrestrial
- **Sky map:** HEALPix FITS file with probability per pixel
- **Distance estimate:** Mean and standard deviation in Mpc

### Distribution Channels

- **NASA GCN (General Coordinates Network):** Traditional GRB alert system, extended to GW alerts
- **SCiMMA Hopskotch:** Kafka-based streaming alert platform
- **igwn-alert Python package:** Client library for subscribing to alert topics

```
ALERT PIPELINE
================================================================

  Detector data (real-time)
       |
  [Low-latency pipelines]
  PyCBC Live | GstLAL | MBTA
       |
  [Trigger coincidence + ranking]
       |
  [Superevent creation in GraceDB]
       |
  [Human on-call review] (for SIGNIFICANT events)
       |
  [Alert distribution]
  +----------+-----------+
  |          |           |
  GCN     Kafka      igwn-alert
  |          |           |
  v          v           v
  Telescopes, satellites, neutrino detectors
```

During O4, LIGO issued approximately 100 public alerts (events with FAR < 2/year). Of these, approximately 80 were later confirmed as likely astrophysical, with the remainder being retracted or reclassified as noise [19].

> **Related:** [Visualization & Sonification](05-visualization-and-sonification.md) | [BPS Project](../BPS/)

---

## 8. Sky Localization

Sky localization is the process of determining where on the sky a gravitational wave source is located. The precision depends on the number of detectors and their geometry [20]:

### Two Detectors (H1+L1)

With only two detectors, the source is localized to an annulus on the sky determined by the time delay between the detectors. The annulus width depends on the SNR and frequency content:

```
Sky area (90%) ~ 600 deg^2 (typical for BBH)
                 ~ 300 deg^2 (typical for BNS, longer signal)
```

### Three Detectors (H1+L1+V1)

Adding Virgo as a third detector breaks the annulus degeneracy through a second time delay measurement, reducing the localization area dramatically:

```
Sky area (90%) ~ 30-100 deg^2 (typical)
                 ~ 28 deg^2 (GW170817 -- best case)
```

### Four+ Detectors (H1+L1+V1+K1+I1)

With KAGRA and eventually LIGO-India, localization improves further:

```
Sky area (90%) ~ 10-30 deg^2 (expected with 5 detectors)
```

### HEALPix Sky Maps

Sky localization is distributed as a HEALPix FITS file containing the posterior probability density on the sky. The standard resolution is NSIDE=1024 (approximately 12 million pixels, each ~12 square arcminutes). The `ligo.skymap` Python package provides tools for reading, plotting, and querying these sky maps [21].

---

## 9. O4 Multi-Messenger Results

O4 (May 2023 - November 2025) produced approximately 250 candidate events, with a detection rate of approximately one merger every 2-3 days. However, no electromagnetic counterpart was confirmed for any O4 event -- a surprise given the detection rate [22].

### Why No EM Counterparts in O4?

Several factors explain the absence:

1. **Most events were BBH mergers.** BBH mergers are not expected to produce electromagnetic emission because there is no matter involved.
2. **BNS events were distant.** The few BNS candidates in O4 were at greater distances than GW170817, making any kilonova too faint for current follow-up capabilities.
3. **Sky localization was often large.** Many O4 events had sky areas of 100+ square degrees, making targeted follow-up challenging.
4. **KAGRA's limited sensitivity.** KAGRA operated at lower sensitivity than hoped, reducing the network's localization ability.

### O4 Highlights

| Event | Type | Significance |
|-------|------|-------------|
| GW231123 | BBH | Highest-mass merger observed (>200 M_sun total) |
| GW250114 | BBH | Three gravitational wave harmonics (GR test) |
| Multiple NSBH candidates | NSBH | Mass gap population studies |
| S230518h | BNS candidate | Extensive EM follow-up campaign |

The O4 results expanded the gravitational wave source catalog from approximately 90 to over 300 events, enabling population-level studies of black hole and neutron star mass distributions, spin distributions, and merger rates [23].

---

## 10. Neutron Star Physics

Gravitational waves from BNS mergers encode information about the internal structure of neutron stars through the tidal deformability parameter. During inspiral, each neutron star is deformed by the tidal field of its companion. The amount of deformation depends on the equation of state (EOS) of ultra-dense matter [24].

### Tidal Deformability

The dimensionless tidal deformability Lambda is defined as:

```
Lambda = (2/3) * k_2 * (R / (G*M/c^2))^5
```

Where `k_2` is the Love number and `R` is the neutron star radius. A stiff EOS (large radius, easily deformed NS) gives large Lambda; a soft EOS (small radius, compact NS) gives small Lambda. The tidal effect appears in the gravitational wave phase at 5th post-Newtonian order and is measurable in the late inspiral [25].

### GW170817 Constraints

From GW170817, the combined tidal deformability was measured as:

```
Lambda_tilde = 300 (+420/-230) (90% credible interval)
```

This ruled out the stiffest equations of state (which predicted Lambda_tilde > 1000) and placed an upper limit on the neutron star radius of approximately 13 km for a 1.4 solar mass neutron star. The result was consistent with nuclear physics models that include repulsive three-body forces at high density [26].

### The Neutron Star Maximum Mass

The remnant of GW170817 collapsed to a black hole (inferred from the lack of a long-duration post-merger gravitational wave signal). Combined with the measured total mass (2.73 solar masses), this constrains the maximum mass of a non-rotating neutron star to less than approximately 2.3 solar masses. The heaviest observed pulsars (PSR J0740+6620 at 2.14 solar masses, PSR J0952-0607 at 2.35 solar masses) provide lower limits [27].

---

## 11. Cosmology: The Hubble Constant

GW170817 provided the first "standard siren" measurement of the Hubble constant. Gravitational waves directly measure the luminosity distance to the source (from the signal amplitude). The host galaxy identification gives the recession velocity (redshift). Together, these yield H0 independently of the traditional distance ladder [28].

### The Measurement

```
H0 = 70 (+12/-8) km/s/Mpc (68% credible interval)
```

This value is consistent with both the Planck CMB measurement (67.4 km/s/Mpc) and the SH0ES distance ladder measurement (73.0 km/s/Mpc). The uncertainty is too large to resolve the "Hubble tension" between these two methods, but the measurement is completely independent of both [29].

### Future Prospects

With approximately 50 BNS events with identified host galaxies, the standard siren method could measure H0 to 2% precision -- sufficient to arbitrate the Hubble tension. Alternatively, a statistical "dark siren" method uses the galaxy catalog to assign probabilities to potential host galaxies for BBH events (which lack EM counterparts). With ~200 well-localized BBH events, H0 can be measured to ~5% precision. O4 data is expected to contribute to the dark siren measurement [30].

```
HUBBLE CONSTANT MEASUREMENT METHODS
================================================================

  Method              H0 (km/s/Mpc)    Precision   Status
  -----------------------------------------------------------
  Planck CMB          67.4 +/- 0.5     0.7%        Final
  SH0ES (Cepheids)   73.0 +/- 1.0     1.4%        Ongoing
  GW170817 (siren)   70 +/- 10        14%          Single event
  GW dark sirens      TBD              ~5%          Accumulating
  50 BNS + host       TBD              ~2%          Future

  "Hubble tension": 4.4-sigma discrepancy between Planck and SH0ES
  Standard sirens are the independent tiebreaker
```

---

## 12. Cross-References

- **[LIGO Hanford & Interferometry](01-ligo-hanford-interferometry.md)** -- Detector network that enables sky localization
- **[GW150914 Discovery](02-first-detection-gw150914.md)** -- Comparison of BBH vs BNS signals
- **[Chirp Signal Analysis](03-chirp-signal-analysis.md)** -- Matched filtering, Q-transform of 100-second BNS signals
- **[Visualization & Sonification](05-visualization-and-sonification.md)** -- GW170817 spectrogram rendering
- **BHK (Black Hole Kinematics)** -- Black hole formation, Kerr metric, merger remnants
- **PSS** -- Astronomical observation, multi-wavelength astronomy
- **BPS (Bioacoustic & Physical Sensors)** -- Sensor networks, distributed detection systems
- **GRD (Gradient Methods)** -- Bayesian parameter estimation for tidal deformability
- **FQC (Foundations of Quantum Computing)** -- Quantum states of matter at neutron star densities

---

## 13. Sources

1. Abbott, B.P. et al. (2017). "GW170817: Observation of Gravitational Waves from a Binary Neutron Star Inspiral." *Physical Review Letters*, 119, 161101.
2. Abbott, B.P. et al. (2017). "Multi-messenger Observations of a Binary Neutron Star Merger." *Astrophysical Journal Letters*, 848, L12.
3. Abbott, B.P. et al. (2019). "Properties of the Binary Neutron Star Merger GW170817." *Physical Review X*, 9, 011001.
4. Abbott, B.P. et al. (2017). "GW170817: Observation of Gravitational Waves from a Binary Neutron Star Inspiral." *PRL*, 119, 161101. Supplemental Material.
5. Abbott, B.P. et al. (2017). "Gravitational Waves and Gamma-Rays from a Binary Neutron Star Merger: GW170817 and GRB 170817A." *Astrophysical Journal Letters*, 848, L13.
6. Mooley, K.P. et al. (2018). "Superluminal motion of a relativistic jet in the neutron star merger GW170817." *Nature*, 561, 355-359.
7. Abbott, B.P. et al. (2017). "Gravitational Waves and Gamma-Rays from a Binary Neutron Star Merger: GW170817 and GRB 170817A." *ApJL*, 848, L13. Section 5.
8. Melott, A.L. and Thomas, B.C. (2011). "Astrophysical ionizing radiation and Earth: a brief review and census of intermittent intense sources." *Astrobiology*, 11, 343-361.
9. Coulter, D.A. et al. (2017). "Swope Supernova Survey 2017a (SSS17a), the Optical Counterpart to a Gravitational Wave Source." *Science*, 358, 1556-1558.
10. Metzger, B.D. (2017). "Kilonovae." *Living Reviews in Relativity*, 20, 3.
11. Cowperthwaite, P.S. et al. (2017). "The Electromagnetic Counterpart of the Binary Neutron Star Merger LIGO/Virgo GW170817." *Astrophysical Journal Letters*, 848, L17.
12. Burbidge, E.M., Burbidge, G.R., Fowler, W.A., and Hoyle, F. (1957). "Synthesis of the Elements in Stars." *Reviews of Modern Physics*, 29, 547.
13. Watson, D. et al. (2019). "Identification of strontium in the merger of two neutron stars." *Nature*, 574, 497-500.
14. Hotokezaka, K. et al. (2018). "A neutron star merger model for GW170817/GRB 170817A/SSS17a." *Nature Astronomy*, 2, 980-988.
15. Abbott, B.P. et al. (2017). "Multi-messenger Observations of a Binary Neutron Star Merger." *ApJL*, 848, L12.
16. Soares-Santos, M. et al. (2017). "The Electromagnetic Counterpart of the Binary Neutron Star Merger LIGO/Virgo GW170817." *Astrophysical Journal Letters*, 848, L16.
17. Kasliwal, M.M. (2020). "The Landscape of Multi-Messenger Astrophysics." *Proceedings of the National Academy of Sciences*, 117, 18298-18302.
18. GraceDB. "Gravitational-Wave Candidate Event Database." gracedb.ligo.org
19. LVK Collaboration. (2024). "Low-latency gravitational wave alert products and their performance at the time of the fourth LIGO-Virgo-KAGRA observing run." *PNAS*, 10.1073/pnas.2316474121.
20. Singer, L.P. and Price, L.R. (2016). "Rapid Bayesian position reconstruction for gravitational-wave transients." *Physical Review D*, 93, 024013.
21. Singer, L.P. et al. (2016). "ligo.skymap." lscsoft.docs.ligo.org/ligo.skymap
22. LVK Collaboration. (2025). "Open Data from LIGO, Virgo, and KAGRA through the First Part of the Fourth Observing Run." arXiv:2508.18079.
23. Abbott, R. et al. (2023). "Population of Merging Compact Binaries Inferred Using Gravitational Waves through GWTC-3." *Physical Review X*, 13, 011048.
24. Hinderer, T. (2008). "Tidal Love numbers of neutron stars." *Astrophysical Journal*, 677, 1216-1220.
25. Flanagan, E.E. and Hinderer, T. (2008). "Constraining neutron-star tidal Love numbers with gravitational-wave detectors." *Physical Review D*, 77, 021502.
26. Abbott, B.P. et al. (2018). "GW170817: Measurements of Neutron Star Radii and Equation of State." *Physical Review Letters*, 121, 161101.
27. Margalit, B. and Metzger, B.D. (2017). "Constraining the Maximum Mass of Neutron Stars from Multi-Messenger Observations of GW170817." *Astrophysical Journal Letters*, 850, L19.
28. Schutz, B.F. (1986). "Determining the Hubble constant from gravitational wave observations." *Nature*, 323, 310-311.
29. Abbott, B.P. et al. (2017). "A gravitational-wave standard siren measurement of the Hubble constant." *Nature*, 551, 85-88.
30. Chen, H.-Y. et al. (2018). "A two per cent Hubble constant measurement from standard sirens within five years." *Nature*, 562, 545-547.
