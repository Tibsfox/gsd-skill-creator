# Artemis II — Wall-Clock Papers

Papers found during the mission window, connected to mission themes.
Each paper gets a plain-language summary, key insight, TSPB layer deposit, and teaching notes.
The papers build the textbook. Every pass deepens the explanation.

---

## 2026-03-31 04:01 PDT (T-18h) — Sweep v1.0.1

### 1. Solar Superflare Risk

**"Artemis 2 moon mission shouldn't launch until late 2026, new analysis of solar superflares suggests"**
Source: Space.com / Journal of Geophysical Research: Space Physics, Feb 13, 2026
URL: https://www.space.com/space-exploration/artemis/artemis-2-moon-mission-shouldnt-launch-until-late-2026-new-analysis-of-solar-superflares-suggests

**What the paper says:** Solar Cycle 25 is near its peak. During solar maximum, the probability of a superflare — a massive solar particle event (SPE) — increases significantly. The paper argues that launching a crewed mission beyond the Van Allen belts during solar max exposes the crew to unacceptable risk from a low-probability but high-consequence event.

**Why it matters:** Artemis II crew will spend ~8 days outside the Van Allen belts with no magnetospheric protection. The Orion spacecraft provides some shielding, but a major SPE could deliver a radiation dose exceeding career limits in hours. The paper was published *during the countdown* — it's a Challenger Rule moment: a safety concern raised in real time.

**The science, simply:** The Sun goes through an 11-year activity cycle. At solar minimum, the surface is quiet. At solar maximum (where we are now), sunspots cluster, magnetic field lines tangle, and occasionally the Sun releases a coronal mass ejection (CME) — billions of tons of magnetized plasma traveling at 1,000-3,000 km/s. If that plasma hits a spacecraft outside Earth's magnetic shield, the crew absorbs high-energy protons. The question is: what's the probability of a superflare during a 10-day window?

**TSPB Layer 1 (Unit Circle) deposit:**
Solar activity is periodic — the 11-year Schwabe cycle. Flare probability is a function of where you are in the cycle, just like sin(θ) is a function of angle. At θ=0 (solar minimum), probability is low. At θ=π/2 (solar maximum), probability peaks. The cycle isn't perfectly sinusoidal — it's asymmetric, with a faster rise than decline — but the unit circle gives the first approximation. The probability of a superflare during any 10-day window is:

```
P(flare in window) = 1 - (1 - p_daily)^10

where p_daily varies with solar cycle phase:
  solar min: p_daily ≈ 0.001 (1 in 1,000 days)
  solar max: p_daily ≈ 0.01-0.05 (1 in 20-100 days)

At current solar max with p_daily = 0.02:
  P(10-day) = 1 - (1 - 0.02)^10 = 1 - 0.98^10 = 1 - 0.817 = 0.183 (18.3%)
```

That's not the probability of a *superflare* — that's the probability of *any* significant SPE. Superflares are orders of magnitude rarer. But the paper's point is that even rare events demand attention when the consequence is crew exposure beyond shielding capacity.

**What we learned:** Risk is probability × consequence. Low probability doesn't mean safe — it means the analysis has to account for what happens when the rare event occurs. This is the Challenger Rule in mathematical form.

---

### 2. AVATAR Organ-on-Chip

**"Modeling the Effects of Protracted Cosmic Radiation in a Human Organ-on-Chip Platform"**
Source: Tavakol et al., Advanced Science, 2024
URL: https://advanced.onlinelibrary.wiley.com/doi/10.1002/advs.202401415

**What the paper says:** Researchers built a multi-organ microfluidic chip containing engineered human tissue models of bone marrow, heart muscle, and liver, connected by circulating flow through endothelial barriers. They exposed this system to protracted neutron radiation (simulating galactic cosmic rays) and compared the damage to the same total dose delivered all at once.

**Key finding:** Protracted radiation — the slow, continuous exposure astronauts get in deep space — caused *greater* tissue damage than the same cumulative dose delivered acutely. The body's repair mechanisms can't keep up with continuous low-level bombardment the way they can recover from a single acute exposure.

**Why it matters:** This is the exact technology flying on Artemis II tomorrow as the AVATAR payload. The chips contain tissue analogs matched to each crew member's biology. For the first time, these organ chips will travel beyond the Van Allen belts into the actual deep space radiation environment — not a lab simulation, but the real thing.

**The science, simply:** Imagine you have a wall and someone throws 100 tennis balls at it. If they throw all 100 at once, the wall cracks in a few places and then you can patch it. If they throw 1 ball per minute for 100 minutes, the wall never gets a break — each new impact hits before the last repair is done. The damage accumulates differently. That's the difference between acute and protracted radiation. Your DNA repair enzymes are the repair crew. Continuous radiation means the repair crew never finishes a job before the next damage arrives.

**TSPB Layer 8 (L-Systems) deposit:**
The organ-on-chip is a branching microfluidic network — channels that split and reconnect, carrying nutrients to tissue chambers. This is an L-system in physical form. The channel network can be described by production rules:

```
F → F[+F][-F]F    (main channel branches left and right, continues)

where F = channel segment, + = branch left, - = branch right
Each generation adds another branching level.
The endothelial barriers at branch points are the selective membranes.
```

The vascular network on the chip mirrors the vascular network in the body. The L-system grammar that generates our simulation plants is the same grammar that describes the microfluidic channels that model human organs. Biology reuses the same branching pattern at every scale — from capillaries to bronchi to tree roots to rivers.

**What we learned:** Dose rate matters as much as total dose. The same amount of radiation delivered differently produces different outcomes. Time is a variable in the damage function, not just a container for the dose.

---

### 3. Deep Space Radiation Measurements — Artemis Program

**"Deep Space Radiation Measurements and Crew Radiation Protection for the NASA Artemis Program"**
Source: NASA NTRS, 2025 (report 20250002757)
URL: https://ntrs.nasa.gov/citations/20250002757

**What the paper says:** Reports radiation measurements from Artemis I (uncrewed) and the Biosentinel CubeSat (now 60+ million km from Earth). These instruments measured the actual radiation environment along the lunar trajectory and in deep space — the same path Artemis II crew will fly tomorrow.

**Why it matters:** This is ground truth. Not models, not estimates — actual measurements from the trajectory Orion will follow. The data informs crew protection strategies: when to shelter, how much shielding helps, what the dose rate actually is at different points in the trajectory.

**The science, simply:** Space radiation comes from two sources. Galactic cosmic rays (GCR) are high-energy particles from exploding stars — they arrive continuously from every direction, like rain. Solar particle events (SPE) are bursts from the Sun — like someone turning a fire hose on you. Earth's magnetic field deflects most of both. Once you leave the magnetosphere (above ~60,000 km altitude), you're exposed to the full flux. The Van Allen belts are regions where Earth's magnetic field traps particles — they're *more* dangerous than open space for short transits, but the magnetic field itself is what protects you from GCR and SPE below the belts.

**TSPB Layer 4 (Vector Calculus) deposit:**
Radiation flux follows the inverse-square law in the case of solar particle events (point source at the Sun), but GCR is isotropic (equal from all directions). The shielding effectiveness of a material depends on the integral of stopping power along the particle's path through the material:

```
Dose = ∫ Φ(E) × S(E) / ρ × dE

where:
  Φ(E) = particle flux as function of energy (particles/cm²/s/MeV)
  S(E) = linear energy transfer (keV/μm)
  ρ = material density

For Orion's aluminum hull (~4 g/cm² average):
  GCR reduction: ~20-30% (high-energy particles penetrate)
  SPE reduction: ~80-95% (lower-energy protons stopped)
```

The vector calculus is in the flux integral — it's a surface integral over the spacecraft's cross-section, weighted by the directional distribution of incoming particles. For GCR (isotropic), the integral simplifies. For SPE (directional), the spacecraft's orientation relative to the Sun determines the dose distribution across different crew positions.

**What we learned:** The measurements from Artemis I are the calibration data for Artemis II crew protection. You model the physics, then you verify with measurement. The measurement corrects the model. The corrected model predicts the next mission. This is how science works — prediction, measurement, correction, repeat.

---

### 4. Free-Space Laser Communications

**"Free-Space Laser Communications XXXVIII" (SPIE Volume 13885)**
Source: SPIE Proceedings, 2026
URL: https://spie.org/Publications/Proceedings/Volume/13885

**What the paper says:** Multiple papers in this volume report results from NASA's Deep Space Optical Communications (DSOC) experiment on the Psyche spacecraft, which demonstrated high-bandwidth laser data links from over 3 AU (450 million km) using GPU-based receivers. Also includes ground terminal designs and field trials.

**Why it matters:** Artemis II carries the O2O (Orion-to-ground) optical communications system — a 100mm telescope with a laser transmitter that can send data at 260 Mbps from the Moon. This is 130× faster than the S-band radio link. The SPIE papers show the technology works at 3 AU; Artemis II tests it at 0.0026 AU (lunar distance). If it works, every future deep space mission gets broadband.

**The science, simply:** Radio waves spread out as they travel. A radio antenna at the Moon sends a signal that, by the time it reaches Earth, has spread over thousands of square kilometers — most of the energy misses the receiver. A laser beam stays tight. A 100mm telescope sending infrared light (1550 nm wavelength) produces a beam that at lunar distance has spread to only ~7 km diameter. Almost all the photons hit the ground station. Same energy, vastly more concentrated = higher data rate.

The key equation is the diffraction limit:

```
θ = 1.22 × λ / D

where θ = beam divergence (radians), λ = wavelength, D = aperture diameter

For O2O: θ = 1.22 × 1550e-9 / 0.1 = 18.9 μrad
Beam footprint at Moon: 384,400 km × 18.9e-6 = 7.27 km

For S-band radio (2.2 GHz, 3m dish):
θ = 1.22 × 0.136 / 3.0 = 0.055 rad
Beam footprint at Moon: 384,400 × 0.055 = 21,142 km

Optical beam is 2,900× tighter. That concentration is the bandwidth.
```

**TSPB Layer 7 (Information Theory) deposit:**
Shannon's channel capacity theorem: C = B × log₂(1 + SNR). The laser link achieves higher SNR at the receiver because the beam is tighter — more photons per square meter at the ground station. Higher SNR → higher capacity → 260 Mbps. The radio link spreads the same power over a much larger area, so the SNR is lower, and the capacity is ~2 Mbps. Shannon's theorem doesn't care whether the carrier is light or radio — it only cares about the signal-to-noise ratio at the receiver. The physics of diffraction determines the SNR. The information theory determines the capacity. Two layers of the same truth.

**What we learned:** Bandwidth isn't about the transmitter's power — it's about how much of that power reaches the receiver. Concentration beats raw strength. A flashlight at the Moon outperforms a radio tower because the beam stays together.

---

### 5. Heat Shield Concerns

**"Heat shield safety concerns raise stakes for NASA's Artemis II moon mission"**
Source: phys.org / The Conversation, March 2026
URL: https://phys.org/news/2026-03-shield-safety-stakes-nasa-artemis.html

**What the paper says:** During Artemis I reentry, the AVCOAT ablative heat shield lost material unevenly. Investigation found that gas generated inside the ablative material became trapped during the skip reentry profile — when heating rates decreased between atmospheric dips, thermal energy accumulated inside the AVCOAT, building internal pressure that cracked and shed material unpredictably. NASA's fix: change from skip reentry to a steeper direct entry that keeps heating rates more consistent, and modify the AVCOAT billet loading to increase permeability for future missions.

**Why it matters:** The heat shield is what stands between four humans and a 2,760°C plasma stream at Mach 32. The decision to fly the same heat shield design with a modified trajectory (instead of building a new shield) is the most consequential engineering judgment of the mission.

**The science, simply:** AVCOAT is a honeycomb of fiberglass cells filled with silica-fiber ablative material and resin. As the spacecraft hits the atmosphere at 40,000 km/h, the air in front compresses to thousands of degrees. The AVCOAT absorbs that heat by charring — the resin decomposes, the silica fibers hold the char in place, and the hot gas flows away. It's designed to erode. That's how it works.

The problem: during skip reentry, the spacecraft dips into the atmosphere, heats up, then bounces back into space briefly. During the bounce, the surface cools but the interior is still hot. Gas generated by the decomposing resin gets trapped inside because the exterior has re-solidified. Pressure builds. On the next atmospheric dip, the weakened material cracks and breaks off in chunks instead of ablating smoothly.

The fix: don't bounce. A direct entry keeps the heating rate more consistent — the AVCOAT ablates continuously without the pressure buildup cycle. Less total heating time, but more predictable ablation.

**TSPB Layer 4 (Vector Calculus) deposit:**
The thermal flux on the heat shield is an integral over the entry trajectory:

```
Q_total = ∫₀ᵗ q̇(t) dt

where q̇(t) = convective + radiative heat flux (W/m²)

q̇ scales approximately as:
  q̇_conv ∝ ρ^0.5 × V^3.15    (Chapman's formula)
  
where ρ = atmospheric density (increases with depth)
      V = velocity (decreases with deceleration)

Skip entry: two peaks in q̇(t) with a valley between
Direct entry: one continuous peak, higher max but shorter duration

The integral Q_total may be similar, but the TIME DERIVATIVE of internal
temperature — dT_internal/dt — behaves differently. The valley in skip
entry allows internal heat to accumulate without surface ablation relief.
That's where the gas gets trapped.
```

**What we learned:** The same total energy, delivered differently, produces different outcomes. This is the same lesson as the radiation paper (protracted vs acute dose). The pattern repeats: it's not just how much, it's how the delivery is distributed in time. Rate matters. Sophie Germain studied how elastic surfaces vibrate — the distribution of stress across the surface determines where it fails. The heat shield is an elasticity problem at 2,760°C.

---

### 6. Safety Critique

**"Artemis II Is Not Safe to Fly"**
Source: Idle Words, March 2026
URL: https://idlewords.com/2026/03/artemis_ii_is_not_safe_to_fly.htm

**What the paper says:** An independent analysis arguing that the decision to fly Artemis II with the same heat shield design (modified trajectory, not modified hardware) does not adequately address the root cause of the Artemis I char loss. The critique applies the Columbia Accident Investigation Board's framework: organizational pressure to maintain schedule can override engineering judgment about unresolved anomalies.

**Why it matters:** This is the Challenger Rule in real time. The rule says: any agent reporting a safety concern gets automatic escalation. No one can override another's safety call. The critique may be wrong — but the fact that it exists, published during the countdown, is exactly the kind of signal the rule is designed to detect.

**TSPB Layer 5 (Set Theory) deposit:**
GO/NO-GO is a binary partition of a continuous risk space. The decision boundary is a threshold function:

```
decision = GO if risk_score < threshold, else NO-GO

But risk_score is a function of multiple variables:
  risk = f(heat_shield_confidence, trajectory_margin, crew_exposure, 
           schedule_pressure, political_pressure, public_expectation)

The Challenger lesson: schedule_pressure and political_pressure are NOT
valid inputs to the risk function. They bias the threshold, not the score.
The Columbia lesson: "probably okay" is not an engineering assessment.
Independent verification must be available on request.
```

**What we learned:** Every safety system is a classification problem. The question is where you draw the boundary between GO and NO-GO, and whether the inputs to that decision are all legitimate engineering data or whether some are organizational noise.

---

## 2026-03-31 (T-37h) — Sweep v1.0.0

### 7. Radiation Risk Primer

**"Radiation risk mitigation in human space exploration: a primer, a vision, and the state of the art"**
Source: European Physical Journal Plus, 2025
URL: https://link.springer.com/article/10.1140/epjp/s13360-025-07199-8

**What the paper says:** Comprehensive review of space radiation hazards, biological effects, and mitigation strategies. Covers GCR composition, SPE characteristics, shielding physics, and biological endpoints including cancer, cardiovascular disease, and CNS impairment.

**TSPB Layer 4 deposit:** Particle flux attenuation through shielding materials — exponential decay with material thickness, modified by secondary particle production (spallation). Not a simple inverse-square problem because high-energy particles *create* new particles when they hit shielding atoms.

---

### 8. Artemis II Crew Health Experiments

**"The astronaut health experiments of Artemis II"**
Source: The Planetary Society, Planetary Radio, 2026
URL: https://www.planetary.org/planetary-radio/2026-astronaut-health-experiments-artemis-ii

**What the paper says:** Details the five crew health investigations: AVATAR (organ chips), ARCHAR (movement/sleep monitors + saliva biomarkers), and three additional studies on radiation, circadian disruption, and immune function.

**TSPB Layer 3 (Trigonometry) deposit:** Circadian disruption in deep space — the crew's biological clock (approximately sinusoidal, ~24.2 hour period) loses its external zeitgeber (the sunrise/sunset cycle visible from LEO). In deep space, the Sun doesn't rise or set — it's always there. The crew must maintain an artificial light cycle. The circadian rhythm becomes a free-running oscillator: sin(2πt/24.2) drifting against the mission clock sin(2πt/24.0). The beat frequency between these two periods is the circadian desynchronization rate.

---

### 9. Laser Comms for Mars

**"Advancing Laser Communication for Mars Orbital Missions"**
Source: AIAA, 2025
URL: https://arc.aiaa.org/doi/pdf/10.2514/6.2025-99519

**What the paper says:** Extends the DSOC architecture to Mars orbital distances (0.5-2.5 AU). Addresses beam pointing challenges, atmospheric turbulence compensation, and multi-hop relay architectures.

**TSPB Layer 2 (Pythagorean Theorem) deposit:** The inverse-square law governs how photon flux decreases with distance. At Mars (1.5 AU average), the received power is (0.0026/1.5)² = 3×10⁻⁶ of the lunar distance power. Every factor of 10 in distance reduces received power by factor of 100. This is why Mars comms need either much larger apertures, much higher transmit power, or relay satellites — the Pythagorean geometry of the distance ladder.

---

### 10. Neural Network Trajectory Optimization

**"High-fidelity lunar free-return trajectory optimization via neural networks"**
Source: Journal of Physics, Oct 2025

**What the paper says:** Uses trained neural networks to rapidly compute optimal free-return trajectories, replacing iterative numerical integration with forward passes through a network. Achieves near-optimal solutions in milliseconds vs minutes for traditional methods.

**TSPB Layer 6 (Category Theory) deposit:** The neural network learns a *functor* — a structure-preserving map from the space of initial conditions (TLI burn parameters) to the space of trajectories (10-day paths through the Earth-Moon system). The functor preserves the topological relationship: nearby initial conditions map to nearby trajectories. Training the network is learning the functor. Using the network is applying it. This is what category theory calls a "natural transformation" — a systematic way to translate between two mathematical worlds while preserving their structure.

---

*Each sweep deepens these explanations. The papers build the textbook.*
