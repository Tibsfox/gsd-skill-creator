# Helium-3 -- The Rare Isotope

## He-3 vs He-4: A Single Neutron Changes Everything

Helium exists in two stable isotopes: Helium-4 (two protons, two neutrons, mass 4.0026 u) and Helium-3 (two protons, one neutron, mass 3.0160 u). The difference is a single neutron. The consequences of that difference span quantum mechanics, nuclear physics, and geopolitics.

**Spin statistics.** He-4, with an even number of nucleons, is a boson (nuclear spin 0). It obeys Bose-Einstein statistics. He-3, with an odd number of nucleons, is a fermion (nuclear spin 1/2). It obeys Fermi-Dirac statistics. This distinction -- which sounds abstract at room temperature -- produces fundamentally different behavior at cryogenic temperatures and is the basis for He-3's most important applications.

**Superfluidity.** He-4 undergoes a phase transition to a superfluid state at 2.17 K (the lambda point), driven by Bose-Einstein condensation. He-3 does not condense into a superfluid until approximately 2.5 millikelvin -- nearly a thousand times colder -- and only through a mechanism analogous to Cooper pairing in superconductors. The He-3 superfluid phases (A-phase and B-phase) were discovered by Douglas Osheroff, Robert Richardson, and David Lee at Cornell University in 1972 (Nobel Prize in Physics, 1996). The B-phase is one of the most precisely understood quantum states in nature and serves as a testbed for theories of exotic quantum matter.

**Neutron absorption.** He-3 has a thermal neutron absorption cross-section of 5,333 barns -- the largest of any stable nuclide. For comparison, Boron-10, the next most efficient neutron absorber, has a cross-section of 3,835 barns (28% less). The He-3 neutron capture reaction (n + He-3 -> p + H-3 + 764 keV) produces charged particles that are trivially detected by a proportional counter. This makes He-3 the ideal neutron detection medium, a fact with profound national security implications.

**Terrestrial abundance.** The atmospheric He-3/He-4 ratio is approximately 1.4 x 10^-6 (1.4 parts per million of total helium, which is itself only 5.2 ppm of the atmosphere). In practical terms, there is effectively zero He-3 available from the atmosphere. The Earth's crustal He-3/He-4 ratio is even lower, approximately 10^-8, because crustal helium is dominated by radiogenic He-4 from uranium and thorium decay. He-3 on Earth is overwhelmingly a product of one process: tritium decay.

## Applications -- Each One Critical

### Quantum Computing: Dilution Refrigerators

Every superconducting quantum computer -- from IBM (Heron processors, 1,121+ qubits), Google (Sycamore, Willow), Rigetti (Ankaa-2), and others -- operates inside a dilution refrigerator. The operating principle exploits a unique quantum mechanical property of He-3/He-4 mixtures: below approximately 870 mK, the mixture spontaneously phase-separates into a He-3-rich concentrated phase (nearly pure He-3) and a He-3-dilute phase (approximately 6.6% He-3 in He-4). The 6.6% concentration is a quantum mechanical minimum -- it persists even at absolute zero.

The cooling mechanism works by driving He-3 from the concentrated phase across the phase boundary into the dilute phase. This crossing is thermodynamically analogous to evaporation: He-3 "dissolving" into the He-4-rich phase absorbs heat, just as a liquid evaporating into a gas absorbs heat. Because the dilute phase always maintains at least 6.6% He-3, there is always a concentration gradient driving more He-3 across the boundary, enabling continuous cooling. Base temperatures of 7-15 millikelvin are routinely achieved.

A single dilution refrigerator contains 20-40 liters of He-3/He-4 mixture, with the He-3 fraction typically at 20-33% by volume. The He-3 charge per unit is thus approximately 4-13 liters. At current He-3 prices of $2,000-$3,500 per liter (STP), the He-3 alone costs $8,000-$45,500 per refrigerator. This is a small fraction of the total refrigerator cost ($500,000-$2,000,000 depending on configuration) but a large fraction of the recurring supply constraint.

**Bluefors** (Helsinki, Finland) is the dominant manufacturer of dilution refrigerators for quantum computing, supplying IBM, Google, and most academic quantum labs. Bluefors ships hundreds of units per year and has expanded manufacturing capacity multiple times since 2020. **Oxford Instruments** (Abingdon, UK) and **Leiden Cryogenics** (Netherlands) are the other major manufacturers.

The scaling constraint: as quantum computers grow from hundreds to thousands to millions of physical qubits, they require either larger dilution refrigerators (more He-3 per unit) or more refrigerators in parallel (more units). IBM's roadmap targets 100,000+ qubit systems by 2033. If each such system requires 5-10 dilution refrigerators, and 50+ companies pursue similar scale, aggregate He-3 demand reaches tens of thousands of liters per year -- a meaningful fraction of total global supply. The He-3 supply constraint is not hypothetical; it is already influencing quantum computing architecture decisions. Some teams are investigating whether dilution refrigerator designs can reduce He-3 charge without sacrificing cooling power. Others (notably IonQ's trapped-ion approach) sidestep the constraint entirely by not requiring millikelvin temperatures.

**PNW connection:** Microsoft Quantum in Redmond, Washington operates dilution refrigerators for its topological qubit research program. The University of Washington's physics department operates low-temperature labs with He-3 systems. These facilities source He-3 through national distributors at prices set by the DOE Isotope Program allocation. A regional capability for He-3 handling and distribution would not change the fundamental supply constraint (production is tied to tritium decay) but would reduce logistical friction for PNW-based quantum computing operations.

### Nuclear Security: Neutron Detection

The September 11, 2001 attacks created an urgent national security requirement: the ability to detect special nuclear materials (plutonium-239, uranium-235, and uranium-233) at ports of entry, border crossings, and critical infrastructure. He-3 proportional counters were -- and remain -- the gold standard for this mission.

The detection physics: when a neutron enters a He-3-filled tube, the capture reaction (n + He-3 -> p + H-3 + 764 keV) produces a proton and a triton traveling in opposite directions. These charged particles ionize the He-3 fill gas, producing an electrical pulse that is detected by the tube's central wire. The pulse height is proportional to the neutron energy, enabling both detection and spectroscopy.

Following 9/11, the Department of Homeland Security deployed thousands of Radiation Portal Monitors (RPMs) at ports and border crossings under the Megaports Initiative and the Domestic Nuclear Detection Office (DNDO, now the Countering Weapons of Mass Destruction Office, CWMD). Each RPM contains multiple He-3 proportional tubes. The total US deployment consumed approximately 50,000-80,000 liters of He-3 between 2003 and 2010, drawing down a national stockpile that had peaked at approximately 235,000 liters (accumulated from decades of nuclear weapons tritium decay).

By 2008, the stockpile had fallen to critical levels. A 2010 interagency task force (DOE, DHS, DOD) identified the He-3 shortage as a national security concern and recommended He-3 conservation, alternative detector development, and enhanced allocation management. The DOE Isotope Program at Oak Ridge National Laboratory became the sole allocator of US He-3 supplies, implementing a priority system that placed national security and medical applications above commercial and research use.

**PNNL's role:** Pacific Northwest National Laboratory in Richland, Washington has been at the forefront of developing alternative neutron detection technologies specifically to reduce He-3 dependence. PNNL researchers pioneered boron-lined proportional tubes (using Boron-10 thin films) and lithium-loaded scintillators (Li-6 glass and Li-6/ZnS composites) as He-3 alternatives. These alternatives are less sensitive per unit than He-3 tubes (Boron-10 has 28% lower neutron capture cross-section) but can be manufactured in larger quantities without the supply constraint.

PNNL's work has enabled a partial transition: new RPM deployments can use boron-based detectors, reducing incremental He-3 demand. But the existing installed base of He-3 detectors remains in service, requiring periodic He-3 refills as tubes age and develop leaks. The total US annual He-3 requirement for neutron detection maintenance alone is estimated at 5,000-10,000 liters.

### Medical Imaging: Hyperpolarized Lung MRI

Hyperpolarized He-3 MRI is a technique for directly imaging lung airspace ventilation. Standard proton MRI cannot image lungs well because the lung parenchyma is mostly air (low proton density). He-3 gas, when hyperpolarized via spin-exchange optical pumping (SEOP) to 40-70% nuclear spin polarization (versus the ~0.0003% thermal equilibrium polarization of proton MRI), produces an MRI signal strong enough to visualize airspace morphology at high resolution.

The technique was developed in the 1990s and has proven valuable for diagnosing and monitoring COPD, asthma, cystic fibrosis, and radiation-induced lung injury. Clinical trials have demonstrated that He-3 MRI can detect ventilation defects years before they appear on standard pulmonary function tests.

However, the technique has been partially displaced by Xenon-129 hyperpolarized MRI, which uses a gas that is cheaper and more readily available than He-3 (though Xe-129 has lower polarization and produces a weaker signal). The shift from He-3 to Xe-129 for clinical lung MRI reduces He-3 demand from this application but does not eliminate it entirely -- He-3 remains preferred for high-resolution research imaging and certain pediatric applications where signal strength is critical.

### Fusion Energy: The Aneutronic Promise

The deuterium-He-3 fusion reaction (D + He-3 -> He-4 + p + 18.3 MeV) is uniquely attractive because it is aneutronic in its primary channel. The reaction products are a helium-4 nucleus and a proton -- both charged particles that can be directly converted to electricity using magnetic or electrostatic confinement, without the need for a thermal cycle (steam turbine). No neutrons means minimal radioactive activation of reactor structures, minimal radioactive waste, and no need for tritium breeding blankets.

The catch is temperature. D-He-3 fusion requires plasma temperatures of approximately 600 million Kelvin (approximately 50 keV ion temperature) -- six times higher than D-T (deuterium-tritium) fusion, which itself has not yet achieved sustained ignition in a commercial reactor. No facility has demonstrated net energy from D-He-3, and the physics community generally regards it as a second-generation fusion fuel -- something to pursue after D-T fusion is mastered.

The terrestrial He-3 supply situation makes large-scale D-He-3 fusion essentially impossible with current resources. A single GW-class D-He-3 reactor would consume approximately 100-150 kg of He-3 per year. At an atmospheric concentration of 7 ppt and no practical extraction method, terrestrial atmospheric He-3 is not a viable source. The approximately 40,000-60,000 liters (~7-10 kg) produced annually from tritium decay could fuel a fraction of one reactor.

This supply constraint is the motivation for lunar He-3 extraction proposals (see Interlune below). The lunar regolith contains He-3 implanted by the solar wind at concentrations of approximately 10-50 parts per billion by mass. While this sounds trace, the total lunar He-3 inventory is estimated at 1 million tonnes -- enough to power human civilization for thousands of years at current energy consumption rates. The question is whether mining and processing hundreds of millions of tonnes of lunar regolith is economically viable. Current estimates suggest approximately 150 tonnes of regolith must be heated to 700 degrees Celsius to extract one gram of He-3.

## Global Supply -- The Tritium Constraint

Essentially all usable He-3 on Earth comes from one source: the beta decay of tritium (H-3). Tritium has a half-life of 12.32 years, decaying to He-3 via:

H-3 -> He-3 + e- + anti-neutrino (18.6 keV)

The United States and Russia maintain tritium inventories for nuclear weapons (tritium is a component of boosted fission weapons and thermonuclear warheads). As tritium decays, He-3 accumulates in the storage containers. Periodically, the He-3 is extracted and purified.

| Source | Location | Estimated Annual He-3 Supply | Status |
|--------|----------|-----------------------------| -------|
| DOE Savannah River Site | Aiken, SC | 8,000-15,000 liters/year | Primary US source; allocation managed by ORNL Isotope Program |
| Russian nuclear weapons complex | Various | Comparable to US (~10,000-20,000 L/year estimated) | Severely restricted market access since February 2022 |
| Ontario Power Generation | Darlington, ON | 2,000-5,000 liters/year | CANDU reactor tritium removal; available commercially |
| SHINE Technologies | Janesville, WI | Small but growing | Accelerator-based tritium production (medical isotope primary product, He-3 as byproduct) |
| Northstar Medical Radioisotopes | Beloit, WI | Small | Similar accelerator approach |

**Total estimated global supply: 25,000-60,000 liters per year from all sources.**

The wide range in estimates reflects the classification of US and Russian weapons tritium inventories. The DOE Isotope Program does not publish exact allocation figures. What is known is that the 2010 interagency review identified a structural deficit: demand (driven by post-9/11 neutron detector deployment) had been exceeding supply, drawing down the accumulated stockpile.

The stockpile trajectory tells the story. The US He-3 stockpile peaked at approximately 235,000 liters in the early 2000s (accumulated over decades from weapons tritium decay). By 2010, it had been drawn down to approximately 50,000 liters. The DOE implemented allocation controls and a price increase (from approximately $100/liter to $2,000+/liter at DOE auction) to ration remaining supply and incentivize conservation and alternatives.

### Pricing History

| Period | He-3 Price (per liter STP) | Context |
|--------|---------------------------|---------|
| Pre-2001 | $100-$200 | Abundant stockpile, limited demand |
| 2001-2008 | $200-$500 | Post-9/11 detector deployment drawing down stockpile |
| 2008-2010 | $500-$1,000 | Shortage recognition, DOE rationing begins |
| 2010-2012 | $2,000-$2,750 | DOE auction pricing; interagency task force |
| 2013-2023 | $1,500-$2,500 | Stabilized rationing; alternative detector adoption |
| 2024-2026 | $2,000-$3,500 | Quantum computing demand growth; Russian supply cutoff |

For reference, He-4 (standard helium) prices even at March 2026 crisis levels are $50-$100 per liter of liquid. He-3 is 200-500 times more expensive than He-4 on a per-liter basis. This price differential reflects the fundamental supply constraint: He-4 can be extracted from natural gas reservoirs containing billions of cubic feet; He-3 can only be harvested from decaying tritium at thousands of liters per year.

## Companies and Research

### Interlune (Seattle, WA)

Founded in 2022 by Rob Meyerson (former president of Blue Origin) and Gary Lai (former New Shepard chief architect). Mission: extraction of He-3 from lunar regolith for sale to terrestrial customers. The company raised $18 million in Series A funding (reported 2024) and has outlined a phased approach: initial robotic prospecting missions, followed by demonstration extraction, then scaled production.

The lunar extraction concept: solar wind implants He-3 into the top few meters of lunar regolith at concentrations of approximately 10-50 ppb by mass. Extraction requires heating regolith to approximately 700 degrees Celsius, at which point the He-3 (along with other implanted volatiles) outgasses and can be collected. The engineering challenges are formidable: operating mining and heating equipment on the lunar surface, in vacuum, with no atmosphere, minimal gravity (1/6 Earth), and a two-week day/night cycle. Energy for heating must come from solar arrays or small reactors.

Interlune's bet is that the terrestrial He-3 price ($2,000-$3,500/liter) is high enough to justify the extraordinary cost of lunar operations. The economic viability depends critically on transportation costs (currently $50,000-$100,000 per kg to the lunar surface using SpaceX Starship-class vehicles, projected to decrease), extraction efficiency, and the total addressable market. If quantum computing scales as projected and D-He-3 fusion becomes a realistic prospect, the total addressable market could grow by orders of magnitude, potentially justifying the investment.

Interlune is headquartered in Seattle -- placing it squarely within the PNW ecosystem described throughout this research series. The company's workforce requirements (cryogenic engineers, space systems engineers, mining engineers) overlap with the PNW's existing talent base at Blue Origin (Kent, WA), SpaceX (Redmond satellite office), and the University of Washington.

### DOE Isotope Program (Oak Ridge National Laboratory)

The DOE Isotope Program is the primary allocator of US He-3. It manages the national inventory, sets allocation priorities (national security > medical > research > commercial), and conducts periodic auctions for available supply. The program also funds research into alternative isotope production methods, including accelerator-based tritium production.

Contact for allocation inquiries: isotopes@ornl.gov. Applications for He-3 allocation require documentation of intended use, quantity needed, and technical justification. Processing time is typically 4-8 weeks.

### SHINE Technologies (Janesville, WI) and Northstar Medical Radioisotopes (Beloit, WI)

Both companies use accelerator-driven neutron sources to produce medical isotopes (primarily Molybdenum-99 for Technetium-99m medical imaging). The neutron production process generates tritium as a byproduct, which decays to He-3. While the He-3 quantities are small relative to weapons-derived supply, these companies represent a new production pathway that is not dependent on nuclear weapons programs.

SHINE's approach is particularly notable because it uses deuterium-tritium fusion in a subcritical assembly -- effectively a controlled fusion reactor -- as its neutron source. The tritium consumed and produced in this process creates a closed loop with He-3 as a natural byproduct. As SHINE scales its medical isotope production, He-3 output will grow proportionally.

## PNW Connections

The Pacific Northwest has a unique and somewhat paradoxical concentration of He-3-relevant organizations. It is simultaneously a center of He-3 demand (quantum computing), He-3 alternative development (PNNL), and He-3 future supply (Interlune).

| Organization | Location | He-3 Connection | Scale |
|-------------|----------|-----------------|-------|
| Interlune | Seattle, WA | Lunar He-3 extraction development (HQ) | Series A funded, pre-revenue |
| Microsoft Quantum | Redmond, WA | Dilution refrigerators for topological qubit R&D | 10+ refrigerators estimated |
| PNNL | Richland, WA | He-3 alternative neutron detector development | National laboratory scale |
| University of Washington | Seattle, WA | CENPA neutron physics, low-temperature physics | Research scale |
| Blue Origin | Kent, WA | Launch vehicle for potential lunar He-3 transport | New Glenn vehicle operational |
| IonQ (partial presence) | Various | Trapped-ion quantum computing (no He-3 needed) | Public company, reference point |
| Intel (Hillsboro, OR) | See Document 13 | He-4 consumer, but quantum computing R&D growing | See Document 13 |

PNNL's dual role is particularly significant. The laboratory is a world leader in both He-3-dependent research (neutron scattering instruments at the Spallation Neutron Source -- PNNL provides detector systems) and He-3 independence research (boron-lined tube alternatives). This positions the PNW as a hub for understanding both sides of the He-3 equation: where it is irreplaceable and where it can be substituted.

## The Scaling Constraint

The fundamental He-3 challenge is that production cannot be increased by investment alone. He-3 supply is determined by the rate of tritium decay, which is determined by the size of tritium inventories, which are determined by nuclear weapons programs and CANDU reactor operations. No amount of money can make tritium decay faster.

Global He-3 production of approximately 25,000-60,000 liters per year is a hard ceiling under current conditions. The only ways to increase it are:

1. **Increase tritium production** -- which means either building more tritium-producing nuclear reactors (CANDU type), expanding weapons tritium production (politically constrained), or scaling accelerator-based production (SHINE model, but small volumes).

2. **Extract He-3 from natural gas** -- He-3 is present at approximately 1.4 ppm in natural gas helium, but no commercial-scale separation process exists. The isotope separation would require either cryogenic distillation or diffusion cascade, both prohibitively expensive at current scales.

3. **Lunar extraction** -- Interlune's approach. Potentially large-scale but decades from significant production.

4. **Reduce demand** -- which means deploying He-3 alternatives for neutron detection (PNNL's work), reducing He-3 charge in dilution refrigerators, and shifting medical imaging from He-3 to Xe-129.

The most likely near-term trajectory is a combination of options 1 (modest increase from accelerator byproducts) and 4 (demand reduction through alternatives and efficiency). This will not eliminate the constraint; it will moderate it. He-3 will remain one of the most supply-constrained materials in the technology stack for the foreseeable future.

For the PNW -- home to both major quantum computing operations and the only lunar He-3 extraction company -- this constraint is not abstract. It shapes workforce planning, equipment procurement, research priorities, and the long-term competitive position of the region's technology sector. Anyone briefing a senator on PNW technology infrastructure should include He-3 supply in the conversation, alongside broadband, housing, and transportation. It is that fundamental.
