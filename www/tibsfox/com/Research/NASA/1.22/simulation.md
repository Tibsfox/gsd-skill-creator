# Mission 1.22 -- Simulation Specifications

## Simulations: Aurora 7

**Mission:** Mercury-Atlas 7 / Aurora 7 (v1.22)
**Platforms:** Python, SPICE, Web (HTML/JS/Canvas), GLSL, FAUST, Minecraft, Blender, Arduino, GMAT

---

## A. Simulations -- What to Build Locally

### A1. Python: Retrofire Dispersion Analysis

**What it is:** A Python simulation that maps the relationship between retrofire execution errors and landing point displacement for Aurora 7 -- the mission where Scott Carpenter overshot the planned splashdown point by 402 kilometers because his retrorockets fired 3 seconds late and at a 25-degree yaw error from the planned retrograde attitude. The simulation takes the actual orbital parameters of MA-7 (161 x 267 km, 32.5-degree inclination), the planned retrograde delta-V of 152 m/s, and sweeps through a matrix of yaw errors (0 to 30 degrees) and timing errors (0 to 10 seconds). For each combination, it calculates the effective retrograde delta-V component, propagates the resulting deorbit trajectory to atmospheric interface, and computes the landing point error relative to the planned recovery zone. The output is a 2D dispersion plot: a heat map with yaw error on one axis, timing error on the other, and landing displacement in kilometers as the color field. Carpenter's actual parameters -- 25 degrees of yaw, 3 seconds late -- are highlighted on the plot, and the student can see exactly where his point falls on the dispersion surface.

**Why it matters:** Aurora 7 is the mission that taught NASA the cost of attitude errors at retrofire. The Mercury retrorockets each produced about 50.7 m/s of delta-V, firing sequentially over 10 seconds to deliver a total of approximately 152 m/s of retrograde velocity reduction. But delta-V is a vector, not a scalar. If the capsule is yawed 25 degrees away from the retrograde direction when the rockets fire, the effective retrograde component drops to 152 * cos(25 degrees) = 137.8 m/s -- a loss of 14.2 m/s of retrograde braking. That 14.2 m/s deficit means the capsule stays in a higher, longer-period orbit for a fractionally longer time before atmospheric drag captures it, and the accumulated along-track error over the descent translates to a 402 km overshoot. The simulation makes this chain of causality visible. The student adjusts the yaw error slider and watches the landing point migrate downrange. They see that small yaw errors produce small overshoots, but the relationship is nonlinear -- cosine losses accelerate as yaw angle increases. At 30 degrees of yaw error, the overshoot exceeds 500 km. At zero yaw error, the landing point error is dominated by the timing error alone, which contributes roughly 28 km per second of late firing. Carpenter's 3-second timing error added approximately 84 km to his overshoot; the yaw error added the remaining 318 km. The dispersion plot makes it viscerally clear that attitude control at retrofire is not optional -- it is the single most critical maneuver in the entire mission.

**Specification:**

```python
# retrofire-dispersion.py
# Aurora 7 retrofire dispersion analysis
#
# Process:
#   1. Define MA-7 orbital elements at retrofire point
#   2. For each (yaw_error, timing_error) pair:
#      a. Compute effective retrograde ΔV = 152 * cos(yaw_error)
#      b. Compute cross-track ΔV = 152 * sin(yaw_error)
#      c. Adjust retrofire epoch by timing_error seconds
#      d. Propagate deorbit trajectory to 80 km altitude
#      e. Calculate landing point displacement from target
#   3. Build 2D dispersion map
#   4. Mark Carpenter's actual point (25° yaw, 3s late)
#
# Orbital Elements (MA-7 at retrofire, orbit 3):
#   altitude_perigee_km: 161
#   altitude_apogee_km: 267
#   semi_major_axis_km: 6585 (mean altitude 214 km)
#   eccentricity: 0.0079
#   inclination_deg: 32.5
#   orbital_velocity_at_retrofire_km_s: 7.79
#   orbital_period_s: 5318 (88.6 minutes)
#
# Retrofire Parameters:
#   planned_delta_v_m_s: 152 (total from 3 retrorockets)
#   retro_1_delta_v: 50.7 m/s, fires at T+0
#   retro_2_delta_v: 50.7 m/s, fires at T+5s
#   retro_3_delta_v: 50.7 m/s, fires at T+10s
#   total_burn_duration_s: 10
#   planned_retrofire_time: 04:32:40 GET
#   actual_retrofire_time: 04:32:43 GET (3s late)
#
# Sweep Parameters:
#   yaw_error_range_deg: 0 to 30 (step 1)
#   timing_error_range_s: 0 to 10 (step 0.5)
#   grid_size: 31 x 21 = 651 trajectory calculations
#
# Dispersion Model:
#   For a capsule in a ~90-minute orbit at ~7.79 km/s:
#     Along-track sensitivity to ΔV deficit:
#       1 m/s retrograde deficit ≈ 22 km overshoot
#       (derived from orbital mechanics: the deficit
#       keeps the capsule in a marginally higher orbit
#       for marginally longer, accumulating downrange error)
#     Along-track sensitivity to timing error:
#       1 s late ≈ 28 km overshoot
#       (the capsule travels 7.79 km/s, so each second of
#       late firing shifts the reentry point by ~7.79 km,
#       amplified by the longer descent trajectory to ~28 km
#       surface displacement)
#     Cross-track displacement from yaw error:
#       Lateral ΔV = 152 * sin(yaw_error) m/s
#       Cross-track landing error ≈ lateral_ΔV * 6 km/(m/s)
#
# Visualization:
#   - Main plot: 2D heat map (pcolormesh)
#     X-axis: yaw error (degrees), 0-30
#     Y-axis: timing error (seconds), 0-10
#     Color: total landing displacement (km), 0-600
#     Colormap: coolwarm (blue=on-target, red=large miss)
#     Contour lines at 100, 200, 300, 400, 500 km
#     Carpenter's actual point: gold star at (25, 3)
#       with annotation "Carpenter actual: 402 km overshoot"
#     Planned point: green star at (0, 0)
#       with annotation "Nominal: 0 km error"
#
#   - Inset plot: 1D yaw sensitivity (timing=0)
#     X-axis: yaw error (degrees)
#     Y-axis: overshoot (km)
#     Shows the cosine-driven nonlinearity
#
#   - Inset plot: 1D timing sensitivity (yaw=0)
#     X-axis: timing error (seconds)
#     Y-axis: overshoot (km)
#     Shows the linear timing relationship
#
# Libraries: numpy, matplotlib
# Difficulty: Intermediate
# Duration: 2-3 hours
```

**Key learning moments:**
1. The dispersion plot reveals that attitude control and timing are not independent failure modes -- they compound. Carpenter's 402 km overshoot was not caused by either the yaw error or the timing error alone; it was the sum of both. The heat map shows a saddle-shaped surface where the worst outcomes cluster in the upper-right corner (high yaw + late timing), and the student sees that mission planners must set tolerances on both parameters simultaneously.
2. The cosine relationship between yaw error and effective delta-V is not intuitive until plotted. At 10 degrees of yaw, you lose only 2.3% of your braking -- barely noticeable. At 25 degrees, you lose 9.4%. The curve bends slowly at first, then accelerates. This is why Carpenter's 25-degree error was so costly: he was past the knee of the cosine curve.

---

### A2. Python: GFP Fluorescence Spectrum

**What it is:** A Python simulation that models the excitation and emission spectra of Green Fluorescent Protein (GFP), the bioluminescent molecule that makes the crystal jellyfish *Aequorea victoria* glow green -- and the molecule that would eventually revolutionize biology when Osamu Shimomura, Martin Chalfie, and Roger Tsien shared the 2008 Nobel Prize in Chemistry for its discovery and development. The simulation fits Gaussian curves to the known spectral data for wild-type GFP: the dual excitation peaks at 395 nm (major) and 475 nm (minor), the single emission peak at 509 nm, and the Stokes shift of 34 nm between the 475 nm excitation peak and the 509 nm emission. The student adjusts excitation wavelength and watches the emission intensity respond according to the excitation spectrum profile, building intuition for how fluorescence works as a wavelength-converting process.

**Why it matters:** Scott Carpenter reported seeing luminous particles outside Aurora 7 during orbital dawn -- the same "fireflies" that John Glenn had reported during Friendship 7. Carpenter, more scientifically inclined than the mission demanded, spent significant time observing and experimenting with these particles, tapping the capsule hull to dislodge more of them, confirming they were ice crystals from the capsule's life support system rather than organisms. But the bioluminescence connection runs deeper than fireflies. *Aequorea victoria*, the crystal jellyfish of the Pacific Northwest, carries a two-stage bioluminescence system: the protein aequorin produces blue light (469 nm) when triggered by calcium ions, and GFP absorbs that blue light and re-emits it as green (509 nm) through fluorescence. This blue-to-green energy transfer is one of the most elegant optical systems in nature, and GFP's spectral properties -- the dual excitation peaks, the Stokes shift, the high quantum yield of 0.79 -- are now among the most precisely characterized of any protein. The simulation lets the student explore these properties quantitatively: plotting absorption and emission spectra, calculating energy conversion efficiency from wavelength ratios, and understanding why the Stokes shift exists (the emitted photon always has less energy than the absorbed photon, because some energy is lost to vibrational relaxation in the protein matrix).

**Specification:**

```python
# gfp-spectrum.py
# GFP fluorescence spectrum simulation
#
# Process:
#   1. Define GFP spectral parameters from literature
#   2. Build excitation spectrum as sum of two Gaussians
#   3. Build emission spectrum as single Gaussian
#   4. Calculate quantum yield and energy efficiency
#   5. Plot overlaid spectra with Stokes shift annotation
#
# GFP Spectral Parameters (wild-type):
#   Excitation peak 1 (major): 395 nm, FWHM ~30 nm
#     (protonated chromophore, neutral form)
#   Excitation peak 2 (minor): 475 nm, FWHM ~25 nm
#     (anionic chromophore, charged form)
#   Peak ratio: 395 nm peak is ~3x intensity of 475 nm peak
#   Emission peak: 509 nm, FWHM ~35 nm
#     (same emission regardless of excitation wavelength)
#   Stokes shift: 34 nm (from 475 nm excitation to 509 nm emission)
#   Quantum yield: 0.79 (79% of absorbed photons re-emitted)
#   Molar extinction coefficient: 21,000 M⁻¹cm⁻¹ (at 395 nm)
#
# Gaussian Model:
#   Each spectral band modeled as:
#     I(λ) = A * exp(-0.5 * ((λ - λ_center) / σ)²)
#   where σ = FWHM / (2 * sqrt(2 * ln(2))) ≈ FWHM / 2.355
#
#   Excitation spectrum:
#     I_ex(λ) = 1.0 * G(λ, 395, 30) + 0.33 * G(λ, 475, 25)
#   Emission spectrum:
#     I_em(λ) = 0.79 * G(λ, 509, 35)
#     (scaled by quantum yield)
#
# Energy Calculations:
#   Photon energy: E = hc/λ
#     h = 6.626e-34 J·s (Planck's constant)
#     c = 3.0e8 m/s (speed of light)
#   Energy at 475 nm: E_ex = 4.18e-19 J (2.61 eV)
#   Energy at 509 nm: E_em = 3.90e-19 J (2.44 eV)
#   Energy efficiency: η = (E_em / E_ex) * quantum_yield
#     = (509/475)⁻¹ * 0.79
#     = 0.933 * 0.79
#     = 0.737 (73.7% energy conversion)
#   Stokes loss: 6.7% per photon (vibrational relaxation)
#   Quantum loss: 21% of photons not re-emitted
#     (non-radiative decay pathways)
#
# Visualization:
#   - Plot 1: Overlaid spectra
#     X-axis: wavelength (300-650 nm)
#     Y-axis: relative intensity (0-1)
#     Excitation spectrum: blue fill (α=0.3) with blue line
#     Emission spectrum: green fill (α=0.3) with green line
#     Stokes shift annotated: double-headed arrow from
#       475 to 509 nm with "Stokes shift: 34 nm" label
#     Vertical dashed lines at 395, 475, 509 nm
#     Background color gradient: UV violet (300 nm) through
#       visible spectrum to red (650 nm), very faint (α=0.1)
#
#   - Plot 2: Energy level diagram
#     Jablonski-style diagram showing:
#       S₀ (ground state) at bottom
#       S₁ (excited state) at top
#       Absorption arrow (blue, upward) labeled "395 or 475 nm"
#       Vibrational relaxation (wavy red arrow, downward)
#         labeled "heat loss"
#       Fluorescence arrow (green, downward) labeled "509 nm"
#       Non-radiative decay (dashed arrow) labeled "21% loss"
#
#   - Plot 3: Excitation efficiency curve
#     X-axis: excitation wavelength (300-550 nm)
#     Y-axis: relative emission intensity at 509 nm
#     Shows that emission intensity tracks the excitation
#       spectrum -- illuminate at 395 nm for maximum
#       fluorescence, 475 nm for moderate, and the minimum
#       between the peaks (~430 nm) gives very little emission
#
# Libraries: numpy, matplotlib, scipy (for curve fitting)
# Difficulty: Intermediate
# Duration: 2-3 hours
```

**Key learning moments:**
1. The dual excitation peaks reveal that GFP's chromophore exists in two forms: protonated (395 nm) and anionic (475 nm). Both forms emit at 509 nm because the excited protonated form undergoes excited-state proton transfer (ESPT) to reach the same emitting state. The student sees that two different inputs produce the same output -- a biological multiplexer.
2. The Stokes shift is thermodynamics made visible. The emitted photon is always redder (lower energy) than the absorbed photon because some energy is dissipated as heat during vibrational relaxation. The protein matrix acts as a thermal sink, absorbing the energy difference. This is why fluorescent materials glow at a different color than the light that excites them -- the second law of thermodynamics written in wavelengths.

---

## B. SPICE Netlists -- What to Simulate in a Circuit Simulator

### B1. S-Meter Circuit (Progressive Radio Series #22)

**What it is:** A SPICE netlist for a signal strength meter circuit -- the S-meter that sits on the front panel of every communications receiver and tells the operator how strong the incoming signal is. This is progressive radio series #22, building on the BFO (beat frequency oscillator) from v1.21 by adding a metering circuit that reads the AGC (Automatic Gain Control) voltage from the IF amplifier stage. The AGC voltage is a DC level that varies inversely with signal strength: strong signals produce a large negative AGC voltage (which reduces IF gain to prevent overload), and weak signals produce a small AGC voltage (which allows maximum gain). The S-meter circuit takes this AGC voltage, processes it through a DC amplifier with logarithmic compression, and drives a microammeter movement whose needle deflection corresponds to the signal strength on the standard S-unit scale.

**Why it matters:** Aurora 7 maintained voice communication with the Mercury tracking network through a Collins-designed UHF transceiver operating at 296.9 and 259.7 MHz. Signal strength monitoring was critical for maintaining contact as the capsule passed over each ground station -- the signal rose as the capsule approached, peaked at closest approach, and faded as it receded. The S-meter quantifies this process. But the S-meter also teaches logarithmic scaling: each S-unit represents a 6 dB increase in signal voltage, which means a factor of 2 in voltage or a factor of 4 in power. The full scale from S1 to S9 spans a voltage range of 256:1 (2^8), or a power range of 65,536:1 (4^8). No linear meter could span that range. The logarithmic compression built into the S-meter circuit is the same mathematical transformation that the human ear uses to perceive loudness -- and the same transformation that decibels express. The student who builds this circuit learns that nature and engineering converge on logarithmic scaling whenever the dynamic range of a phenomenon exceeds what linear perception can handle.

**Specification:**

```spice
* s-meter-circuit.cir
* Progressive radio series #22: signal strength meter
* Builds on v1.21 BFO -- reads AGC voltage from IF amplifier
*
* Circuit topology:
*   1. AGC voltage input (0 to -8V DC, from IF amplifier)
*   2. Voltage follower (Q1, BC547) -- high-impedance buffer
*   3. Logarithmic amplifier (Q2, BC547) -- exploits V_BE
*      logarithmic relationship with collector current
*   4. Meter driver (Q3, BC547) -- current amplifier
*   5. Meter movement: 100 μA full-scale deflection
*      (modeled as 1.2 kΩ resistor + ammeter)
*
* S-Meter Scale (IARU standard):
*   S1 = 0.2 μV at antenna (-119 dBm at 50Ω)
*   S2 = 0.4 μV (-113 dBm)
*   S3 = 0.8 μV (-107 dBm)
*   S4 = 1.6 μV (-101 dBm)
*   S5 = 3.2 μV (-95 dBm)
*   S6 = 6.3 μV (-89 dBm)
*   S7 = 12.6 μV (-83 dBm)
*   S8 = 25 μV (-77 dBm)
*   S9 = 50 μV (-71 dBm)
*   Each S-unit = 6 dB voltage (factor of 2)
*
* AGC Voltage Mapping:
*   The IF amplifier's AGC loop produces a DC voltage
*   that is approximately logarithmic with signal level:
*   S1 → -0.5V AGC
*   S5 → -2.5V AGC
*   S9 → -5.0V AGC
*   S9+20 → -7.0V AGC
*   S9+40 → -8.0V AGC
*   (This mapping comes from the previous IF amplifier
*    circuit in the progressive series -- the AGC voltage
*    is already partially logarithmic)
*
* The logarithmic amplifier exploits the Ebers-Moll
* equation: I_C = I_S * exp(V_BE / V_T), which means
* V_BE = V_T * ln(I_C / I_S). By forcing a current
* proportional to the AGC voltage through Q2's collector,
* the base-emitter voltage becomes logarithmic with that
* current, giving us the compression we need for the
* S-meter scale.
*
* Supply: +12V
* Components: 3x BC547, 8 resistors, 2 capacitors
*   (filter caps on AGC input and meter output)

.title S-Meter Circuit -- Progressive Radio #22

* Power supply
VCC VCC 0 DC 12

* AGC voltage input (swept for characterization)
VAGC AGC_IN 0 DC -2.5

* Input buffer -- voltage follower
R1 VCC Q1C 4.7k
R2 Q1B AGC_IN 100k
R3 Q1E 0 2.2k
C1 AGC_IN Q1B 1u
Q1 Q1C Q1B Q1E BC547

* Logarithmic amplifier
R4 Q1E Q2C 10k
R5 VCC Q2C 22k
R6 Q2E 0 470
Q2 Q2C Q2B Q2E BC547
R7 Q2B VCC 47k
R8 Q2B 0 10k

* Meter driver
Q3 Q3C Q2C Q3E BC547
R9 Q3E 0 100
RMETER Q3C VCC 1.2k

* Meter filter capacitor
C2 Q3C VCC 10u

* Transistor model
.model BC547 NPN(IS=1.8e-14 BF=400 VAF=100 RB=20
+  RC=0.1 RE=0.1 CJE=12p CJC=5p TF=0.5n)

* DC sweep to characterize S-meter response
.dc VAGC -8 0 0.1

* Measure meter current vs AGC voltage
.print DC I(RMETER)
.control
run
plot -I(RMETER)
.endc

.end
```

---

### B2. Fluorescence Detector Circuit

**What it is:** A SPICE netlist for a transimpedance amplifier circuit that detects fluorescent light -- the electronic equivalent of watching a jellyfish glow. The circuit drives a UV LED at 395 nm (the major excitation wavelength of GFP), illuminating a fluorescent sample. A photodiode positioned at 90 degrees to the excitation beam detects the emitted fluorescent light at 509 nm. Between the excitation source and the detector sits the core electronic challenge: the emitted fluorescence is orders of magnitude weaker than the excitation light, so the circuit must reject scattered excitation light while amplifying the tiny photocurrent produced by the fluorescent emission. A transimpedance amplifier converts the photodiode's photocurrent (nanoamps to microamps) into a measurable voltage, and a bandpass filter centered on the emission wavelength rejects out-of-band signals.

**Why it matters:** This circuit bridges the gap between Shimomura's biochemistry and modern instrumentation. Every fluorescence microscope, every flow cytometer, every plate reader used in modern biology contains a version of this circuit: a light source, an excitation filter, a sample, an emission filter, and a photodetector feeding a transimpedance amplifier. The student who builds this circuit in SPICE understands that fluorescence detection is not photography -- it is current measurement. The photodiode does not "see" the green glow; it generates a photocurrent proportional to the optical power incident on its junction, and the transimpedance amplifier converts that current to a voltage with a gain set by a single feedback resistor. The challenge is noise: at nanoamp signal levels, the amplifier's input noise current, the photodiode's dark current, and the shot noise of the photocurrent itself all compete with the signal. The student learns that fluorescence detection is ultimately a signal-to-noise problem, and that the optical filters (which reject excitation light) matter more than the amplifier gain.

**Specification:**

```spice
* fluorescence-detector.cir
* Transimpedance amplifier for fluorescent light detection
* UV excitation (395 nm) → GFP emission (509 nm) detection
*
* Circuit topology:
*   1. UV LED driver (395 nm, pulsed for lock-in detection)
*   2. Photodiode (sensitivity peak near 509 nm)
*   3. Transimpedance amplifier (OPA380 model)
*   4. Bandpass filter (centered ~509 nm equivalent signal)
*   5. Output stage with gain adjustment
*
* The photodiode is modeled as a current source in
* parallel with a junction capacitance and shunt
* resistance. The photocurrent is proportional to the
* incident optical power:
*   I_photo = R_λ * P_optical
*   where R_λ = responsivity at wavelength λ (A/W)
*   Typical silicon photodiode at 509 nm: R ≈ 0.25 A/W
*
* For a fluorescent sample with:
*   Excitation power: 1 mW (UV LED at 395 nm)
*   Sample absorption: 10% (thin sample, low concentration)
*   Quantum yield: 0.79
*   Collection efficiency: 1% (solid angle of detector)
*   Optical filter transmission: 80%
#   Detected power: 1e-3 * 0.1 * 0.79 * 0.01 * 0.8
#     = 6.32e-7 W = 632 nW
*   Photocurrent: 632e-9 * 0.25 = 158 nA
*
* Transimpedance gain:
*   R_feedback = 1 MΩ → V_out = I_photo * R_f
*   V_out = 158e-9 * 1e6 = 158 mV (easily measurable)
*   Bandwidth limited by C_feedback = 1 pF
*     f_3dB = 1 / (2π * R_f * C_f) = 159 kHz
*
* Supply: ±5V (dual supply for op-amp)
* Components: OPA380 (or equivalent), 1 photodiode model,
*   1 UV LED model, 10 resistors, 5 capacitors

.title Fluorescence Detector -- GFP Emission

* Power supplies
VCC VCC 0 DC 5
VEE VEE 0 DC -5

* UV LED driver (395 nm, pulsed at 1 kHz for lock-in)
VLED_DRIVE LED_CTRL 0 PULSE(0 3.3 0 1u 1u 0.5m 1m)
R_LED VCC LED_A 100
D_UV LED_A LED_CTRL UVLED
.model UVLED D(IS=1e-20 N=2.5 RS=5 BV=5)

* Photodiode model (reverse biased for speed)
* Modeled as voltage-controlled current source
* driven by LED state (simplified optical coupling)
VBIAS BIAS_P 0 DC 2
I_DARK PD_A 0 DC 0.5n
I_PHOTO PD_A 0 DC 158n
C_PD PD_A 0 15p
R_SHUNT PD_A 0 100MEG

* Transimpedance amplifier (OPA380 simplified model)
* Non-inverting input to ground (virtual ground)
* Inverting input receives photodiode current
.subckt OPA380 INP INM OUT VCC VEE
E1 INT 0 INP INM 200000
R_OUT INT OUT 50
C_COMP INT 0 5p
.ends

X_TIA 0 PD_A TIA_OUT VCC VEE OPA380
R_FEEDBACK PD_A TIA_OUT 1MEG
C_FEEDBACK PD_A TIA_OUT 1p

* Output bandpass filter (10 Hz - 10 kHz)
* Removes DC offset and high-frequency noise
* Two-stage RC filter
R_HP TIA_OUT FILT1 15.9k
C_HP FILT1 0 1u
R_LP FILT1 FILT2 15.9k
C_LP FILT2 0 1n

* Output buffer and gain stage
R_GAIN1 FILT2 AMP_IN 10k
R_GAIN2 AMP_IN AMP_OUT 100k
.subckt BUFFER INP INM OUT VCC VEE
E1 INT 0 INP INM 100000
R_OUT INT OUT 50
.ends
X_BUF 0 AMP_IN AMP_OUT VCC VEE BUFFER

* Transient analysis (2 full LED pulses)
.tran 1u 2m

.control
run
plot V(TIA_OUT) V(AMP_OUT) V(LED_CTRL)
.endc

.end
```

---

## C. Web Interactive -- What to Experience in a Browser

### C1. Aurora 7 Fuel Monitor

**What it is:** An HTML5 Canvas application that simulates the fuel consumption timeline of Scott Carpenter's Aurora 7 flight in real-time. The display shows a fuel gauge -- or rather two fuel gauges, one for manual and one for automatic attitude control propellant -- that drain across three orbits as Carpenter performs scheduled attitude maneuvers, scientific observations, and the unscheduled thruster activations that ultimately depleted his reserves to a dangerously low level by retrofire. The user interface presents the flight timeline as a horizontal strip along the bottom of the screen, with the current mission elapsed time advancing automatically or under user control. Above the timeline, two vertical bar gauges show manual and automatic fuel remaining as percentages. Each maneuver appears as a labeled event on the timeline, and when the playback reaches that event, the fuel gauge drops by the appropriate amount. The user can click on the timeline to add or remove hypothetical maneuvers, watching the fuel margin at retrofire change in response.

**Why it matters:** Aurora 7 is the Mercury mission that proved fuel management could be a life-or-death issue. Carpenter used attitude control propellant at a rate far exceeding the flight plan, partly for legitimate scientific observations (turning the capsule to photograph orbital dawn, experimenting with the "fireflies," aligning for the dim-light photography experiment) and partly due to a malfunctioning autopilot pitch horizon scanner that caused continuous thruster corrections. By the time retrofire approached, Carpenter had consumed so much propellant that his manual fuel was at 20% and his automatic fuel was below 5%. He had to manually control the capsule's attitude during retrofire with dangerously low fuel margins, contributing to the 25-degree yaw error that caused the 402 km overshoot. The interactive fuel monitor lets the student replay this scenario and ask "what if?" questions: what if Carpenter had skipped the dim-light photography? What if the pitch horizon scanner had worked correctly? What if he had switched to fly-by-wire earlier, conserving automatic fuel? Each hypothetical scenario changes the fuel curve, and the student can see exactly where the margin disappears.

**Specification:**

```
aurora7-fuel.html

Display: 960 x 640 canvas (responsive, scales to viewport)
Aesthetic: period-authentic Mission Control display
  Background: dark green (#0A1A0A)
  Text: bright green phosphor (#33FF33), monospace font
  Grid lines: dim green (#1A3A1A)
  Fuel bars: green when >50%, amber when 20-50%, red when <20%
  Timeline: horizontal bar along bottom, 120px height
  Scanlines: subtle horizontal lines (2px spacing, α=0.03)
    to simulate CRT phosphor display

Layout:
  Top section (400px): dual fuel gauges
    Left gauge: "MANUAL" fuel (0-100%)
    Right gauge: "AUTO" fuel (0-100%)
    Each gauge: vertical bar, 80px wide, with tick marks
      every 10%, numeric readout at top
    Between gauges: mission clock (HH:MM:SS GET)
    Below gauges: current fuel rate (lb/min) and status text

  Bottom section (240px): mission timeline
    Horizontal axis: 0 to 4:56:00 GET (full mission)
    Vertical axis: fuel level (0-100%, both overlaid)
    Manual fuel curve: solid green line
    Auto fuel curve: dashed amber line
    Event markers: vertical lines at each maneuver
    Red zone: shaded region below 15% fuel
    Current time: bright vertical cursor line

Mission Events (historical timeline):
  T+00:00:00  Launch (manual: 100%, auto: 100%)
  T+00:05:12  Orbit insertion, ASCS engaged
  T+00:10:00  Capsule turnaround maneuver (-2% auto)
  T+00:15:00  Systems check attitude maneuvers (-1% manual)
  T+00:25:00  First yaw scan (scientific observation) (-3% manual)
  T+00:45:00  Orbital dawn photography (-4% manual)
  T+01:00:00  Pitch horizon scanner malfunction begins
                (continuous auto fuel drain: -0.5%/min)
  T+01:15:00  "Firefly" experiments (tapping hull) (-2% manual)
  T+01:28:00  End of orbit 1 (manual: ~78%, auto: ~72%)
  T+01:33:00  Dim-light photography experiment (-5% manual)
  T+01:50:00  Balloon deploy attempt (-3% manual)
  T+02:15:00  More firefly observations (-2% manual)
  T+02:30:00  Carpenter switches to manual control more
                (reducing auto drain, increasing manual)
  T+02:56:00  End of orbit 2 (manual: ~45%, auto: ~42%)
  T+03:10:00  Continued attitude experiments (-4% manual)
  T+03:30:00  Pre-retrofire checklist begins
  T+04:00:00  Fuel warning from mission control
  T+04:20:00  Retrofire attitude setup (-5% manual)
  T+04:32:43  RETROFIRE (manual: ~20%, auto: ~5%)
  T+04:56:00  Splashdown

User Interaction:
  - Click on timeline to add custom maneuver (dialog: name,
    fuel cost in %, which system)
  - Right-click on existing event to remove it
  - Playback controls: play/pause, speed (1x, 10x, 60x)
  - Reset button to restore historical timeline
  - "What-if" presets:
    "No firefly experiments": removes firefly events
    "Working pitch scanner": removes continuous auto drain
    "Conservative pilot": halves all manual maneuver costs
    "Historical (actual)": restores actual timeline

Technologies: HTML5 Canvas, vanilla JavaScript
No external dependencies
```

---

### C2. Bioluminescence Simulator

**What it is:** An HTML5 Canvas application that simulates the bioluminescence of *Aequorea victoria*, the crystal jellyfish of the Pacific Northwest. The jellyfish floats in dark water, pulsing its bell in a slow rhythmic contraction. When the user clicks or taps on the jellyfish's body, a calcium wave triggers the aequorin protein, which produces a blue flash (469 nm) that cascades through the bell margin. The blue light is immediately absorbed by GFP molecules embedded in the same photocytes, and the green fluorescent emission (509 nm) blooms outward from the trigger point in a radial wave. The entire sequence -- calcium trigger, blue aequorin flash, green GFP re-emission -- plays out over approximately 500 milliseconds, mimicking the actual photophysics at a timescale the eye can follow. After the flash fades, the jellyfish continues pulsing, waiting for the next trigger.

**Why it matters:** *Aequorea victoria* lives in the cold waters of the Pacific Northwest, from Puget Sound to the coast of British Columbia. Its bioluminescence system is a two-protein cascade that separates light production from light emission: aequorin is the chemiluminescent trigger (converting chemical energy to blue photons), and GFP is the fluorescent converter (absorbing blue photons and re-emitting green ones). This separation is the key insight that made GFP useful for biology: GFP does not need aequorin, calcium, or any cofactor to fluoresce. It is a standalone fluorescent label that can be genetically attached to any protein in any organism. But in the jellyfish, the two-protein system exists for a reason: the blue-to-green conversion shifts the emission to a wavelength that propagates better through seawater, making the jellyfish more visible to predators and prey at distance. Evolution optimized the spectral output for the medium. The simulation makes this two-stage process visible by separating the blue flash from the green emission, showing the student that bioluminescence is not a single event but a cascade.

**Specification:**

```
bioluminescence.html

Display: fullscreen canvas (responsive, fills viewport)
Aesthetic: deep ocean at night

Background:
  Gradient: dark navy (#010108) at top to black (#000000) at bottom
  Subtle caustic light patterns on upper portion (animated,
    very dim -- simulating moonlight filtering through surface)
  Particle system: 50-80 small particles drifting upward
    (marine snow / plankton), white, α=0.1-0.3, 1-3px diameter,
    drift speed 0.1-0.5 px/frame, random horizontal wobble

Jellyfish Model:
  Bell: semi-transparent dome, radius ~120px
    Fill: radial gradient from rgba(180,200,220,0.08) center
      to rgba(100,140,180,0.03) edge
    Stroke: rgba(150,180,210,0.15), 1px
    Bell pulsation: sinusoidal radius change (±15px)
      at 0.3 Hz (one pulse every ~3.3 seconds)
    During contraction: bell flattens slightly (aspect ratio
      shifts from 1.0 to 0.85)

  Tentacles: 12-16 trailing curves, each 200-400px long
    Bezier curves with 3 control points
    Each tentacle has independent sinusoidal sway
      (frequency 0.1-0.2 Hz, amplitude 20-60px)
    Fill: none
    Stroke: rgba(150,180,210,0.06), 1px
    Tentacle bases follow bell margin during pulsation

  Bell margin ring: thin ring at the bell's outer edge
    This is where the photocytes (light-producing cells) live
    Rendered as a series of 24-32 small dots around the
      bell perimeter, rgba(100,140,160,0.1), 2-3px

Bioluminescence Trigger (on click/tap):
  Phase 1 -- Calcium wave (0-100ms):
    A ring of brightening spreads outward from the click
      point along the bell margin
    Color: white-blue (#8888FF → #4444CC)
    Speed: traverses the full bell margin in 100ms
    Individual photocyte dots along the margin brighten
      sequentially as the wave passes

  Phase 2 -- Aequorin blue flash (100-250ms):
    The activated photocytes emit a blue glow
    Color: bright blue (#3366FF), mimicking 469 nm
    Intensity: rises to peak over 50ms, holds for 50ms
    Glow radius: 8-12px per photocyte, overlapping to form
      a continuous ring of blue light
    Additive blending (globalCompositeOperation = "lighter")

  Phase 3 -- GFP green emission (200-500ms):
    Beginning while the blue flash is still fading, green
      fluorescence blooms from each photocyte
    Color: vivid green (#33FF66), mimicking 509 nm
    The green glow is brighter and longer-lasting than the
      blue flash (higher quantum yield, longer lifetime)
    Glow radius: 15-25px per photocyte
    Fades over 300ms following an exponential decay
      (τ ≈ 100ms, matching GFP fluorescence lifetime of ~3 ns
       scaled to visual timescale)

  Phase 4 -- Afterglow (500-1000ms):
    Residual dim green glow on the bell margin
    Color: dark green (#115522), α fading from 0.2 to 0
    The surrounding water briefly shows green-tinted
      scattered light particles (5-10 particles, green,
      drifting outward)

  The jellyfish continues pulsing throughout the flash
    sequence -- bioluminescence does not interrupt locomotion

  Multiple rapid clicks should stack flashes (each trigger
    starts its own 1-second animation cycle)

  On mobile: tap anywhere on the jellyfish bell to trigger

Information overlay (toggle with 'i' key):
  Top-left: "Aequorea victoria — Crystal Jellyfish"
  Below: "Click/tap the bell to trigger bioluminescence"
  During flash sequence:
    "Ca²⁺ → Aequorin → Blue (469 nm) → GFP → Green (509 nm)"
  Small spectral diagram showing the wavelength conversion

Technologies: HTML5 Canvas, vanilla JavaScript, requestAnimationFrame
No external dependencies
```

---

## D. GLSL Shader -- Four-Mode Screensaver

**What it is:** A single GLSL fragment shader file with four visual modes, cycled automatically or toggled manually, each drawing from the Aurora 7 mission's themes: orbital dawn, bioluminescence, reentry, and the aurora borealis. The shader runs in a fullscreen quad and receives `uniform float u_time` and `uniform vec2 u_resolution` as inputs. Each mode runs for 30 seconds before crossfading to the next over 3 seconds.

### Mode 1: Orbital Dawn

The moment when Aurora 7 crossed from the night side to the day side of Earth and sunlight hit the capsule hull. Ice crystals sublimating from the capsule's skin caught the first light and became Glenn's "fireflies" -- tiny points of light drifting away from the capsule against the black of space. The shader renders a horizon line across the lower third of the screen: below the line, the dark limb of Earth with a faint blue atmospheric glow at the edge. Above the line, the black of space transitioning to a brilliant orange-gold sunrise band along the horizon. The firefly particles emerge from random points across the screen, drifting slowly upward and away from the viewer (scaling down), each one a small bright point with a warm glow halo. The particles catch the sunlight directionally -- those on the sun side glow gold, those in shadow are dim blue. As the mode progresses, the sunrise band widens and intensifies, flooding the scene with warm light.

```
Mode 1 parameters:
  horizon_y: 0.3 (30% from bottom)
  earth_color: vec3(0.01, 0.02, 0.04) -- near black
  atmosphere_glow: vec3(0.1, 0.3, 0.8) -- thin blue arc
  sunrise_band: gradient from vec3(1.0, 0.3, 0.05) at horizon
    to vec3(1.0, 0.8, 0.4) above, width expanding with time
  space_color: vec3(0.0, 0.0, 0.02) -- almost pure black
  particle_count: 40-60 (procedural, hash-based positions)
  particle_drift: upward at 0.01 units/second, slight random lateral
  particle_glow_radius: 0.003-0.008 (varies per particle)
  particle_color: mix between gold vec3(1.0, 0.85, 0.4) and
    blue vec3(0.3, 0.5, 0.8) based on sun angle
```

### Mode 2: Bioluminescence

An underwater scene viewed from above, looking down into dark water. Jellyfish drift slowly across the field, each one a translucent dome trailing tentacles. Periodically, a jellyfish flashes -- first a brief blue pulse at its bell margin, then a longer green glow that radiates outward through the water. The flashes are staggered so that at any moment, one or two jellyfish are at different stages of their bioluminescence cycle. The water itself carries a faint blue-green ambient glow from scattered bioluminescent plankton, rendered as a slowly evolving noise field with occasional bright point flickers. The overall effect is a dark field punctuated by organic, rhythmic green pulses -- the deep ocean rendered in photons.

```
Mode 2 parameters:
  water_background: vec3(0.0, 0.02, 0.04) -- deep dark blue-black
  plankton_noise: fractal Brownian motion, 4 octaves,
    amplitude vec3(0.0, 0.03, 0.05), slowly evolving
  jellyfish_count: 5-8 (procedural placement)
  jellyfish_bell_radius: 0.04-0.08 screen units
  jellyfish_transparency: 0.05-0.15
  jellyfish_drift: 0.005-0.02 units/second, random directions
  flash_cycle: 8-15 seconds per jellyfish (randomized)
  flash_blue: vec3(0.2, 0.3, 1.0), duration 0.2s, radius 1.2x bell
  flash_green: vec3(0.1, 1.0, 0.3), duration 0.8s, radius 2.5x bell
  tentacle_count: 6-10 per jellyfish, sine wave perturbation
```

### Mode 3: Reentry

Aurora 7 reentering the atmosphere with the retropack still attached. The capsule is a dark silhouette at the center of the screen, surrounded by the growing fireball of reentry plasma. The retropack straps glow, then burn through and the pack separates -- fragments trailing away behind the capsule, each one burning individually. The plasma sheath grows from a faint orange glow to a blinding white-hot envelope as the capsule descends. Chunks of ablative heat shield material flake away, glowing briefly before being swept into the wake. The color progression follows the actual heating curve: dull red at first contact with the atmosphere, through orange and yellow to white at peak heating, then gradually cooling back through orange to darkness as the capsule decelerates. Plasma streaks trail behind the capsule like a comet tail.

```
Mode 3 parameters:
  capsule_silhouette: dark shape at screen center (0.5, 0.5),
    conical-trapezoidal outline, radius 0.05
  plasma_color_start: vec3(0.6, 0.15, 0.0) -- dull red
  plasma_color_peak: vec3(1.0, 0.95, 0.8) -- white-hot
  plasma_color_cool: vec3(0.8, 0.3, 0.0) -- cooling orange
  plasma_radius: grows from 0.08 to 0.25 over 10s, then shrinks
  shock_layer: bright leading edge, 2px, white
  wake_trail: conical expansion behind capsule, 60° half-angle
  ablation_particles: 10-20, emitted randomly from capsule surface
    each glowing orange, decelerating and fading over 2s
  retropack_separation: at t=5s into mode, 3 fragments separate
    backward at 0.03 units/second, each with own fire trail
  background: black, with faint star field above the capsule
    stars disappear behind the plasma glow
  heating_cycle: 0-5s ramp up, 5-15s peak, 15-25s cool down
```

### Mode 4: Aurora Borealis

The northern lights -- the phenomenon that gave the capsule its name. Carpenter named his capsule "Aurora 7" for the dawn and the northern lights, both of which he saw from orbit. The shader renders curtains of light rippling across a dark sky, the classic green-dominant aurora with occasional red upper borders and blue-violet lower edges. The curtains are vertical sheets of light that undulate horizontally, each one semi-transparent and layered behind the others. The movement is slow and organic, with occasional rapid brightening events ("auroral breakups") where a section of the curtain suddenly intensifies and fragments into rapid ray structures. Below the aurora, a dark landscape silhouette (mountains or horizon line) grounds the scene. Stars are visible through the thinner parts of the auroral curtains.

```
Mode 4 parameters:
  sky_background: vec3(0.0, 0.0, 0.02) -- near black
  curtain_count: 3-5 overlapping sheets
  curtain_color_core: vec3(0.1, 0.9, 0.3) -- dominant green (557.7 nm)
  curtain_color_upper: vec3(0.7, 0.1, 0.15) -- red upper border (630 nm)
  curtain_color_lower: vec3(0.2, 0.1, 0.5) -- blue-violet lower edge
  curtain_y_range: 0.3 to 0.85 (occupies upper portion of screen)
  curtain_motion: horizontal sine waves, 3-5 harmonics superimposed
    primary period: 8-12 seconds
    secondary period: 2-4 seconds (faster ripples)
  curtain_transparency: 0.1-0.6 (varies along height and time)
  ray_structures: vertical bright lines within curtains
    appear during breakup events (every 15-20s)
    density increases from 5 to 30 rays over 2 seconds
    each ray is a vertical gradient, brightest at center
  mountain_silhouette: jagged horizon line at y=0.15
    color: vec3(0.01, 0.01, 0.02) -- near black
    generated from layered sine waves (3 frequencies)
  star_field: 100-200 points, dimmed where aurora is bright
  breakup_event: every 15-20s, random section of one curtain
    brightens 3x for 3 seconds, then gradually fades back
```

---

## E. FAUST Synths -- What to Hear

### E1. Aurora 7 Orbital Sonification

**What it is:** A FAUST digital synthesizer that maps Aurora 7 mission telemetry to audio synthesis parameters, turning three orbits of spaceflight data into a continuous evolving soundscape. Fuel level controls the filter cutoff frequency: full tanks produce a bright, open sound, and as fuel depletes, the sound closes down and darkens, becoming increasingly muffled and constrained -- the audible equivalent of running out of options. Altitude modulates pitch: the capsule oscillates between 161 km perigee and 267 km apogee every 88.6 minutes, producing a slow, deep pitch oscillation that the listener perceives as a breathing rhythm. Heart rate data drives the rhythmic pulse of the synthesis: Carpenter's heart rate rose from a resting 60 bpm during calm orbital segments to 120+ bpm during retrofire, and the synth's rhythmic density tracks this escalation.

**Specification:**

```
aurora7-orbital-sonification.dsp

Architecture: 3 synthesis layers + master filter + effects

Layer 1: Orbital Drone (altitude → pitch)
  Oscillator: sawtooth wave, detuned pair (±2 cents)
  Base frequency: 55 Hz (A1)
  Pitch modulation: altitude mapped 161-267 km → 0-12 semitones
    (perigee = A1 = 55 Hz, apogee = A2 = 110 Hz)
  Modulation rate: 1 cycle per 5318 seconds (one orbit)
    Scaled to 1 cycle per 30 seconds for real-time playback
  Waveshaping: soft saturation (tanh) for warmth
  Output level: -12 dB

Layer 2: Heartbeat Pulse (heart rate → rhythm)
  Source: filtered impulse train
  Rate: maps to BPM parameter (60-160 range)
  Impulse → resonant bandpass filter at 80 Hz (thud)
  Envelope: exponential decay, τ = 0.05s (fast decay, percussive)
  Double-pulse pattern: lub-dub with 0.15s gap
  Output level: -18 dB
  At low heart rates: sparse, calm
  At high heart rates: dense, urgent, anxious

Layer 3: Thruster Noise (fuel events → transients)
  Source: white noise burst
  Triggered at each fuel consumption event
  Envelope: attack 2ms, sustain 50ms, decay 200ms
  Bandpass filter: 2-8 kHz (hiss character)
  Stereo placement: random L/R per event
  Intensity scales with fuel cost of maneuver
  Output level: -15 dB

Master Filter (fuel level → brightness):
  Type: 4th-order resonant lowpass (Moog-style ladder)
  Cutoff frequency: fuel_level mapped 0-100% → 200-8000 Hz
    Full fuel (100%): cutoff at 8 kHz (bright, full spectrum)
    Half fuel (50%): cutoff at 2 kHz (muffled, filtered)
    Empty (0%): cutoff at 200 Hz (dark, closed, suffocating)
  Resonance: 0.3 (moderate, adds character without self-oscillation)

Effects:
  Reverb: large hall (decay 4s, damping 0.5, mix 0.3)
    Simulates the emptiness of orbital space
  Delay: ping-pong, 0.4s, feedback 0.3, mix 0.15
    Simulates radio communication echoes

Parameters (FAUST UI sliders):
  altitude_km: 161-267 (default 214)
  fuel_percent: 0-100 (default 100)
  heart_rate_bpm: 40-180 (default 72)
  thruster_trigger: button (fires a thruster transient)
  playback_speed: 0.1-10.0 (default 1.0)
  master_volume: -60 to 0 dB (default -6)
```

---

### E2. Crystal Jellyfish Bioluminescence

**What it is:** A FAUST synthesizer that translates the photophysics of jellyfish bioluminescence into sound. The calcium trigger is a sharp transient -- a click or pop that represents the sudden influx of Ca2+ ions into the photocyte. This trigger initiates a blue-register tone (high frequency, cold timbre) representing the aequorin chemiluminescent flash, which immediately sweeps downward in frequency toward a green-register tone (lower, warmer) as the energy transfers from aequorin to GFP. The bell pulsation of the jellyfish drives a slow LFO that modulates amplitude and filter position, giving the entire sound a breathing, organic character. The result is a meditative ambient synthesizer: slow pulses of tone that bloom from bright clicks into warm drones, mimicking the visual rhythm of bioluminescence in sound.

**Specification:**

```
crystal-jellyfish-bioluminescence.dsp

Architecture: trigger → spectral sweep → LFO modulation → output

Trigger (calcium flash):
  Input: button or MIDI note-on
  Sound: filtered click (white noise burst, 1ms duration)
  Bandpass filter: 4 kHz center, Q=10 (sharp, crystalline click)
  Represents: Ca²⁺ binding to aequorin coelenterazine

Spectral Sweep (blue → green energy transfer):
  Oscillator: sine wave with 4 harmonics (additive synthesis)
  Start frequency: 1760 Hz (A6, "blue" register)
  End frequency: 659 Hz (E5, "green" register)
    Frequency ratio: 1760/659 = 2.67
    Wavelength ratio: 509/469 = 1.085
    (Exaggerated musically -- actual wavelength shift is subtle,
     but the musical mapping uses a wider interval to make the
     blue-to-green transition audible)
  Sweep duration: 500ms (matching visual flash duration)
  Sweep curve: exponential decay (fast initial drop, slow tail)
  Timbre shift: bright harmonics (3rd, 5th) fade during sweep
    (the "green" tone is purer, more sinusoidal than the "blue")

Envelope:
  Attack: 5ms (near-instantaneous, triggered by calcium click)
  Decay: 200ms (to sustained level)
  Sustain: 0.4 (-8 dB below peak)
  Release: 800ms (long fluorescence tail)
  Total event duration: ~1.5 seconds

Bell Pulsation LFO:
  Shape: rounded triangle wave (sinusoidal-ish, organic)
  Rate: 0.3 Hz (one pulse every 3.3 seconds, matching
    Aequorea victoria's natural bell contraction rate)
  Amplitude modulation depth: 6 dB (noticeable but gentle)
  Filter modulation: ±200 Hz on the main oscillator's
    lowpass filter cutoff
  The LFO runs continuously, independent of triggers
  Represents: the rhythmic contraction of the jellyfish bell

Water Ambience (background layer):
  Source: filtered noise (pink spectrum)
  Bandpass: 100-400 Hz, very low level (-30 dB)
  Slow random modulation of filter center (0.05 Hz drift)
  Simulates: deep ocean ambient sound
  Always present, beneath everything else

Output Processing:
  Lowpass filter: 2nd-order, cutoff 3 kHz (warmth)
  Reverb: medium hall (decay 2.5s, damping 0.6, mix 0.4)
    Simulates: underwater acoustic environment
    (sound travels ~4.5x faster in water, longer reverb tails)
  Stereo width: 0.7 (moderately wide)

Parameters (FAUST UI):
  trigger: button (fires one bioluminescence event)
  auto_trigger: checkbox (fires automatically every 5-8 seconds,
    randomized interval)
  bell_rate_hz: 0.1-1.0 (default 0.3)
  sweep_time_ms: 100-2000 (default 500)
  blue_frequency_hz: 880-3520 (default 1760)
  green_frequency_hz: 220-1320 (default 659)
  water_level_db: -60 to -12 (default -30)
  reverb_mix: 0-1.0 (default 0.4)
  master_volume: -60 to 0 dB (default -6)
```

---

## F. Other Platforms -- Specifications Only

### F1. Minecraft: Aurora 7 Capsule with Bioluminescence

Build the Aurora 7 capsule at 4:1 scale (the actual capsule was 2.9m long x 1.9m diameter, so the build is approximately 12 blocks long x 8 blocks diameter). The capsule sits on a platform over a dark ocean biome. Interior detail includes the instrument panel (buttons and levers), the periscope viewport (glass pane), the contour couch (wool blocks shaped to the astronaut position), and the hand controller. The heat shield at the base is made of netherite blocks (darkest, toughest material -- appropriate for ablative shielding). The exterior has the "Aurora 7" name painted in white concrete powder letters. Below the platform, underwater, build a jellyfish field using sea lanterns and green stained glass to create bioluminescent jellyfish shapes -- each jellyfish is a dome of green stained glass (5-7 blocks across) with a sea lantern core and glass pane tentacles extending downward. Place 8-12 jellyfish at varying depths, connected by waterlogged glass panes. Use daylight detectors to make the jellyfish glow only at night, linking to redstone lamps behind the sea lanterns.

### F2. Blender: Jellyfish Volumetric Bioluminescence

Model an *Aequorea victoria* jellyfish with anatomically accurate bell geometry (oblate hemisphere, 10-20 cm diameter), oral arms, and marginal tentacles. The bell material uses a Principled BSDF with subsurface scattering (scale 0.05, blue-tinted) and high transmission (0.95). The bioluminescence effect is achieved through an emission shader mixed into the bell margin region, keyframed to pulse: blue emission (hex #3366FF, strength 2.0) for 6 frames, crossfading to green emission (hex #33FF66, strength 5.0) for 18 frames, then fading to zero over 12 frames. The environment is an underwater scene with volumetric absorption (blue-green, density 0.02) and a plane of caustic light patterns projected from above using a noise texture on a spotlight. Particle system generates marine snow (small icospheres, 1-3mm, white, α=0.1, turbulence=0.5, gravity=-0.01). Render at 1920x1080, 30fps, Cycles engine with volumetric sampling.

### F3. Arduino: UV Fluorescence Detector

Hardware implementation of the SPICE fluorescence detector circuit (B2). Components: Arduino Uno, UV LED (395 nm, 20mA), current-limiting resistor (150 ohm for 5V supply), silicon photodiode (BPW34 or similar, good sensitivity at 509 nm), transimpedance amplifier (OPA380 breakout or equivalent using LM358 with 1M feedback resistor), emission filter (green theatrical gel or 500nm longpass filter to block UV). The Arduino reads the transimpedance amplifier output through an analog pin (A0), samples at 100 Hz, applies a moving average filter (window=10), and outputs the fluorescence intensity to the serial monitor and an OLED display (128x64, SSD1306). The UV LED pulses at 10 Hz (50ms on, 50ms off) using a digital pin, and the Arduino performs synchronous detection: it reads the photodiode voltage during LED-on and LED-off periods, subtracting the dark reading from the illuminated reading to reject ambient light. Display shows: real-time fluorescence intensity bar graph, peak hold value, and a scrolling time-series plot of the last 30 seconds.

### F4. GMAT: MA-7 Orbit Propagation with Retrofire Analysis

Propagate the Mercury-Atlas 7 orbit using NASA's General Mission Analysis Tool (GMAT). Initial state: epoch 1962-05-24T12:45:16 UTC, Keplerian elements (a=6585 km, e=0.0079, i=32.5 deg, RAAN from epoch, AOP and TA from insertion state vector). Propagate using the JGM-2 gravity model (8x8), MSISE-90 drag model (Cd=2.2, area=2.81 m^2, mass=1355 kg), and solar radiation pressure. At the planned retrofire point (orbit 3, over the Pacific), apply an impulsive burn: planned scenario (152 m/s retrograde, on-time, on-attitude) versus actual scenario (137.8 m/s effective retrograde due to 25-deg yaw error, 3s late). Propagate both post-retrofire trajectories to 80 km altitude and compare landing points. Report the planned vs actual splashdown coordinates, the overshoot distance, and the trajectory difference in altitude, velocity, and ground track. Generate plots: altitude vs time for both trajectories, ground track comparison on Mercator projection, and velocity vs time showing the divergence point at retrofire.
