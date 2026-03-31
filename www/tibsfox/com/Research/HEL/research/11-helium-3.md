# Helium-3 — The Rare Isotope

## He-3 vs He-4

Helium-3 and Helium-4 are stable isotopes with fundamentally different nuclear properties. He-3 has 2 protons and 1 neutron; He-4 has 2 protons and 2 neutrons. This single-neutron difference produces divergent quantum behavior:

- **Spin:** He-3 is a fermion (nuclear spin 1/2). He-4 is a boson (spin 0). They obey entirely different statistics at low temperatures — Fermi-Dirac vs. Bose-Einstein.
- **Superfluid transition:** He-4 becomes superfluid at 2.17 K. He-3 becomes superfluid only below ~2.5 millikelvin — requiring Cooper pairing analogous to superconductivity. The He-3 superfluid phases (A and B) were discovered by Lee, Osheroff, and Richardson (1972 Nobel Prize in Physics, awarded 1996).
- **Neutron absorption:** He-3 has an extremely large thermal neutron absorption cross-section of 5,333 barns — the most efficient neutron detection gas known. For comparison, boron-10 (the next best candidate) has 3,835 barns.

## Applications

### Quantum Computing: Dilution Refrigerators

Every superconducting quantum computer — from IBM, Google, and Rigetti — operates inside a dilution refrigerator that exploits the phase separation of He-3/He-4 mixtures below ~870 mK. The dilute phase maintains a minimum He-3 concentration of 6.6% even at absolute zero (a quantum mechanical requirement), so "evaporating" He-3 from the concentrated phase into the dilute phase continuously absorbs heat, reaching temperatures of ~10 millikelvin.

A single dilution refrigerator requires 20–40 liters of He-3/He-4 mixture. As quantum computers scale from hundreds to thousands to millions of qubits, refrigerators get larger and more He-3 is needed per unit. Bluefors (Helsinki), the dominant manufacturer, ships hundreds of units per year. If 50+ quantum computing companies each operate 5–20 dilution refrigerators, aggregate demand reaches thousands of liters annually — a meaningful fraction of global supply.

**The He-3 supply constraint is a recognized bottleneck in quantum computing infrastructure scaling.**

### Nuclear Security: Neutron Detection

He-3 proportional counters are the gold standard for detecting special nuclear materials (plutonium, uranium). After 9/11, the U.S. Department of Homeland Security deployed thousands of radiation portal monitors at ports and border crossings, consuming a large fraction of the U.S. He-3 stockpile. The detection reaction (n + He-3 → H-3 + p + 764 keV) produces charged particles easily detected electrically.

### Medical Imaging: Hyperpolarized Lung MRI

Hyperpolarized He-3 MRI enables direct imaging of lung airspace ventilation. The gas is polarized via spin-exchange optical pumping to ~40–70% polarization (vs. ~0.0003% for thermal proton polarization), then inhaled by the patient. This produces high-resolution images useful for diagnosing COPD, asthma, and cystic fibrosis. Xenon-129 has partially displaced He-3 in this role due to cost.

### Fusion Energy

The D-He-3 reaction (deuterium + He-3 → He-4 + proton + 18.3 MeV) is aneutronic — no neutrons in the primary reaction, meaning far less radioactive activation of reactor structures. Theoretically cleaner than D-T fusion, but requires temperatures approximately 6 times higher (~600 million K). No facility has achieved net energy from D-He-3.

## Global Supply

He-3 is exceptionally rare on Earth. The atmosphere contains only ~7.2 parts per trillion relative to He-4. Essentially all usable He-3 comes from one source: **tritium decay**. Tritium (H-3) has a half-life of 12.3 years and decays via beta emission to He-3. The United States and Russia maintain tritium for nuclear weapons; as it decays, He-3 is periodically harvested.

| Source | Status |
|--------|--------|
| DOE Savannah River Site (South Carolina) | Primary US allocator, ~8,000–15,000 L/year from weapons tritium |
| Russia | Comparable quantities, limited market access post-2022 |
| Ontario Power Generation (Canada) | Small amounts from CANDU reactor tritium |
| Natural gas extraction | Trace He-3 present but not commercially extracted at scale |

**Total estimated global supply: ~40,000–60,000 liters per year from all sources.**

By the mid-2000s, the US stockpile had been drawn down from ~235,000 liters to critically low levels due to post-9/11 neutron detector deployments. A 2010 interagency task force identified the He-3 shortage as a national security concern.

## Pricing

| Period | Price per Liter (STP) |
|--------|----------------------|
| Pre-2003 | $100–$200 |
| 2010–2012 (shortage) | $2,000–$2,750 (DOE auction) |
| 2024–2025 | $2,000–$3,500 (research grade) |
| He-4 for comparison | $5–$15 |

He-3 is approximately **200–500 times more expensive** than He-4.

## Companies and Research

### Interlune (Seattle, WA)
Founded 2022 by Rob Meyerson (former Blue Origin president) and Gary Lai. Mission: extraction of He-3 from lunar regolith, where it is implanted by solar wind at concentrations of ~10–50 ppb by mass. Raised $18 million in Series A funding (reported 2024). The lunar approach requires mining and heating enormous quantities of material — estimated 150 tons of regolith per gram of He-3.

### Other Entities
- **Linde and Air Liquide** distribute He-3 commercially but do not produce it
- **DOE Isotope Program (Oak Ridge National Laboratory)** — primary US allocator
- **Northstar Medical Radioisotopes** (Wisconsin) and **SHINE Technologies** (Janesville, WI) — accelerator-based tritium/He-3 production as medical isotope byproduct

## PNW Connections

The Pacific Northwest has a unique concentration of He-3-relevant organizations:

| Organization | Location | He-3 Connection |
|-------------|----------|----------------|
| **Interlune** | Seattle, WA | He-3 lunar extraction development (headquarters) |
| **Microsoft Quantum** | Redmond, WA | Dilution refrigerators for topological qubit research |
| **PNNL** | Richland, WA | Neutron detection research, He-3 alternative development |
| **University of Washington** | Seattle, WA | CENPA neutron detection, low-temperature physics labs |
| **IonQ** (partial presence) | — | Trapped-ion approach sidesteps He-3 constraint (reference point) |

PNNL has been a leader in developing **alternative neutron detectors** (boron-lined tubes, Li-6 systems) specifically to reduce He-3 dependence — making the PNW simultaneously a center of He-3 demand (quantum computing) and He-3 independence research (alternative detection).

## The Scaling Constraint

As quantum computing scales, He-3 demand grows with it. This is not a distant future problem — it is a present constraint. The entire global supply of He-3 (~40,000–60,000 liters/year) comes from nuclear weapons tritium decay. There is no way to "mine more" on Earth. This makes He-3 one of the most supply-constrained materials in the technology stack, and the PNW — home to both major quantum computing operations and the only lunar He-3 extraction company — sits at the center of this constraint.
