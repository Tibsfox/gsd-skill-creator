# Refraction, Reflection, and Compression Waves

> **Physics Domain:** Acoustic
> **Module:** 1 — Acoustic Physics
> **Through-line:** *The physics does not change* — Snell's law governs light passing through a glass lens and sound passing through a dolphin's melon with identical mathematics. The impedance mismatch that makes a mirror reflective is the same physics that makes a fish swim bladder echo. Compression waves propagate through ocean water and through the Earth's mantle by the same longitudinal mechanism.

---

## Table of Contents

1. [Acoustic Refraction — Snell's Law for Sound](#1-acoustic-refraction--snells-law-for-sound)
2. [The Dolphin Melon — A Biological Acoustic Lens](#2-the-dolphin-melon--a-biological-acoustic-lens)
3. [Acoustic Impedance](#3-acoustic-impedance)
4. [Reflection at Boundaries](#4-reflection-at-boundaries)
5. [The Fish Swim Bladder — Nature's Acoustic Mirror](#5-the-fish-swim-bladder--natures-acoustic-mirror)
6. [Orca Prey Discrimination by Acoustic Signature](#6-orca-prey-discrimination-by-acoustic-signature)
7. [Compression Waves — Longitudinal Propagation](#7-compression-waves--longitudinal-propagation)
8. [Shear Waves and Why They Don't Propagate in Fluids](#8-shear-waves-and-why-they-dont-propagate-in-fluids)
9. [Infrasound Communication — Elephants and Whales](#9-infrasound-communication--elephants-and-whales)
10. [Ocean Acoustic Waveguides — The SOFAR Channel](#10-ocean-acoustic-waveguides--the-sofar-channel)
11. [PNW Cross-Reference](#11-pnw-cross-reference)
12. [Interrelationships](#12-interrelationships)
13. [Sources](#13-sources)

---

## 1. Acoustic Refraction — Snell's Law for Sound

### 1.1 The Governing Equation

When a wave passes from one medium to another (or through a medium where the wave speed varies continuously), its direction changes. This is refraction, governed by Snell's law:

```
sin(theta_1) / c_1 = sin(theta_2) / c_2
```

where:

| Symbol | Name | Definition | Units |
|--------|------|------------|-------|
| theta_1 | Angle of incidence | Angle between the incoming wave and the normal to the boundary | degrees or radians |
| theta_2 | Angle of refraction | Angle between the refracted wave and the normal | degrees or radians |
| c_1 | Sound speed in medium 1 | Speed of sound in the incident medium | m/s |
| c_2 | Sound speed in medium 2 | Speed of sound in the refracting medium | m/s |

Snell's law is a direct consequence of wave phase-matching at a boundary: the wavefronts on both sides of the boundary must connect continuously, which forces the direction change when c differs between media.

### 1.2 Refraction Toward Lower Sound Speed

The critical rule: **sound bends toward regions of lower sound speed**. This follows directly from Snell's law:

```
If c_2 < c_1:
  sin(theta_2) = sin(theta_1) * c_2 / c_1
  sin(theta_2) < sin(theta_1)
  theta_2 < theta_1
  => Wave bends toward the normal (toward slower region)
```

This is identical to the behavior of light entering a denser medium (glass, water) from air — the refractive index n is inversely proportional to wave speed. For sound:

```
Acoustic refractive index: n = c_reference / c_local
```

Higher n (lower c) means stronger refraction toward that region. This relationship governs everything from ocean acoustic propagation to the beam-forming function of the dolphin melon.

### 1.3 Continuous Refraction — The Ray-Tracing Equation

In a medium where sound speed varies continuously (like the ocean, or the interior of a dolphin's melon), there is no discrete boundary. Instead, sound bends continuously along curved ray paths. The ray equation for a horizontally stratified medium (c varies with depth z) is:

```
cos(theta(z)) / c(z) = constant = cos(theta_0) / c_0
```

This is the continuous form of Snell's law. It means that a sound ray launched at angle theta_0 in a region with sound speed c_0 will curve as c(z) changes. In the ocean:

- **Sound speed decreases with depth** (due to cooling) in the upper water column: rays bend downward.
- **Sound speed increases with depth** (due to pressure) in the deep water column: rays bend upward.
- At the minimum sound speed (the "sound channel axis"), rays are trapped and propagate horizontally for enormous distances — this is the SOFAR channel (see Section 10).

### 1.4 Total Internal Reflection

When c_2 > c_1 (sound passes from a slower to a faster medium), there exists a critical angle beyond which refraction is impossible and all energy is reflected:

```
theta_critical = arcsin(c_1 / c_2)
```

For angles of incidence greater than theta_critical, total internal reflection occurs. No energy crosses the boundary. This is exploited in optical fibers (total internal reflection of light) and has a direct acoustic analogue in the dolphin melon's waveguide behavior: the graded velocity profile creates continuous total internal reflection that traps and focuses the acoustic beam.

---

## 2. The Dolphin Melon — A Biological Acoustic Lens

### 2.1 Structure

The melon is a large, ovoid fatty structure in the forehead of odontocete cetaceans (dolphins, porpoises, toothed whales). It sits between the skull (which acts as a posterior acoustic reflector) and the skin of the forehead. Its primary function is to shape and focus the outgoing echolocation beam [P2].

CT scan and dissection studies reveal that the melon is not homogeneous — it has a precisely structured internal architecture:

| Region | Lipid Composition | Sound Speed | Acoustic Role |
|--------|------------------|-------------|---------------|
| Core (midline) | High wax ester content | ~1350 m/s | Lowest sound speed — central axis of the "lens" |
| Intermediate | Mixed wax esters and triglycerides | ~1380-1420 m/s | Gradient zone |
| Periphery | Higher triglyceride content | ~1420-1450 m/s | Highest sound speed within melon |
| Surrounding tissue | Connective tissue, muscle | ~1500-1540 m/s | Approaches water speed |
| Seawater | — | ~1500 m/s | External medium |

### 2.2 Graded-Index Refraction

The sound speed profile within the melon creates a gradient — lowest at the center, increasing outward. By Snell's law, sound refracts toward the low-velocity core. This causes initially divergent sound rays from the phonic lips to converge as they pass through the melon, producing a focused, directional beam.

This is exactly the physics of a graded-index (GRIN) lens in optics:

```
Optical GRIN lens:
  n(r) = n_0 * (1 - alpha * r^2 / 2)     (parabolic index profile)
  n highest at center, decreasing outward
  Light bends toward center (high n = slow phase velocity)

Dolphin melon acoustic "GRIN lens":
  c(r) = c_0 * (1 + beta * r^2 / 2)      (parabolic velocity profile, approximately)
  c lowest at center, increasing outward
  Sound bends toward center (low c = Snell's law refraction toward center)
```

In optics, high refractive index means slow phase velocity (light slows down in dense glass). In acoustics, low sound speed means the equivalent of high refractive index (sound slows down in the lipid core). The geometry is inverted — optical GRIN lenses have highest n at center; acoustic GRIN lenses have lowest c at center — but the physics is identical. Both produce beam convergence through graded refraction [P2].

### 2.3 CT Scan Evidence

Au and Simmons (Physics Today, 2007) cite CT scan data confirming the graded velocity structure:

> "CT scans reveal a graded sound velocity profile: low velocity near the midline, increasing outward. Sound refracts toward the low-velocity core, focusing the outgoing beam — exactly as light is focused by a graded-index optical lens." [P2]

The CT scans measure tissue density, from which sound speed is inferred using the relationship c = sqrt(K/rho). The density gradient corresponds to the lipid composition gradient: wax esters (lower density, lower sound speed) concentrated at the core, with increasing triglyceride content (higher density, higher sound speed) toward the periphery.

### 2.4 Beam-Forming Performance

The melon produces a directional beam with characteristics that match GRIN lens theory:

| Parameter | Measured Value | GRIN Lens Prediction | Agreement |
|-----------|---------------|---------------------|-----------|
| Beam width (-3 dB) | ~10 degrees | ~8-12 degrees (for 15 cm aperture at 100 kHz) | Good |
| Beam symmetry | Slightly wider vertically | Consistent with elliptical melon shape | Good |
| Side lobes | -15 to -20 dB | Consistent with Gaussian-like aperture illumination | Good |
| Frequency dependence | Narrower beam at higher frequencies | lambda/D scaling (diffraction limit) | Exact |

The frequency-dependent beam width follows the universal diffraction relationship:

```
theta_3dB ≈ lambda / D = c / (f * D)
```

At 50 kHz (lambda = 3 cm in water) with D = 15 cm melon: theta ≈ 0.2 rad ≈ 11 degrees.
At 100 kHz (lambda = 1.5 cm): theta ≈ 0.1 rad ≈ 6 degrees.

The melon is a true acoustic lens, and its beam-forming performance follows the same physics as any aperture antenna or optical lens system. The dolphin controls the effective aperture and possibly the gradient profile through muscular contraction of the melon surface — actively adjusting its "lens" for different sonar modes [P2].

### 2.5 Comparison to Engineered Acoustic Lenses

| Feature | Dolphin Melon | Engineered GRIN Lens | Phased Array |
|---------|---------------|---------------------|--------------|
| Mechanism | Graded lipid composition | Graded material density/composition | Electronic phase delays |
| Frequency range | 10-150 kHz | Narrowband (typically designed for one frequency) | Wideband (digitally adjustable) |
| Beam steering | Mechanical (head movement + possible muscle deformation) | Mechanical | Electronic (no moving parts) |
| Size | ~15 cm diameter | Variable | 0.3-10 m (application-dependent) |
| Bandwidth | Extremely wideband (decade+ bandwidth) | Narrowband | Wideband |
| Power requirement | Metabolic | None (passive lens) | Electrical (active electronics) |

The dolphin melon is notable for its extreme bandwidth — it functions as a focusing lens across more than a decade of frequency (10-150 kHz). Engineering GRIN lenses are typically optimized for a narrow frequency band. The secret is the gradual, smooth gradient: abrupt boundaries create frequency-dependent reflection (chromatic aberration in optics; frequency-dependent impedance mismatch in acoustics), but smooth gradients refract all frequencies similarly.

---

## 3. Acoustic Impedance

### 3.1 Definition

Acoustic impedance (Z) is the resistance of a medium to acoustic wave propagation. For a plane wave in a fluid:

```
Z = rho * c
```

where:

| Symbol | Name | Definition | Units |
|--------|------|------------|-------|
| Z | Acoustic impedance | Characteristic impedance of the medium | Pa*s/m (also called "Rayl") |
| rho | Density | Mass density of the medium | kg/m^3 |
| c | Sound speed | Speed of sound in the medium | m/s |

Impedance determines how much acoustic energy is transmitted vs. reflected at a boundary. It is the acoustic equivalent of electrical impedance — and the analogy is exact: acoustic pressure corresponds to voltage, acoustic particle velocity corresponds to current, and acoustic impedance corresponds to electrical impedance (Z = V/I in electronics, Z = p/u in acoustics).

### 3.2 Impedance Values for Biologically Relevant Materials

| Material | Density rho (kg/m^3) | Sound Speed c (m/s) | Impedance Z (MRayl) |
|----------|---------------------|--------------------|--------------------|
| Air (20 C, sea level) | 1.21 | 343 | 0.000415 |
| Fresh water (20 C) | 998 | 1480 | 1.48 |
| Seawater (15 C, 35 ppt) | 1025 | 1500 | 1.54 |
| Fish muscle tissue | ~1050 | ~1570 | ~1.65 |
| Dolphin melon (core) | ~950 | ~1350 | ~1.28 |
| Dolphin melon (periphery) | ~1000 | ~1440 | ~1.44 |
| Fish swim bladder (gas) | ~1.2 | ~340 | 0.000408 |
| Bone (cortical) | ~1900 | ~3500 | ~6.65 |
| Skull (whale) | ~2000 | ~3800 | ~7.60 |
| Steel (hull, submarine) | 7800 | 5960 | 46.5 |

The dramatic impedance contrast between seawater (1.54 MRayl) and swim bladder gas (0.000408 MRayl) — a ratio of nearly 3,800:1 — is the physical basis for fish detection by sonar, both biological and engineered.

### 3.3 The Impedance Matching Problem

When sound passes from one medium to another, the fraction of energy reflected depends on the impedance contrast. Maximum energy transfer occurs when impedances are matched (Z_1 = Z_2); maximum reflection occurs when the impedance mismatch is extreme.

This creates an engineering problem — and a biological one. Sound generated inside a dolphin's body must couple efficiently into the water. Sound arriving at the dolphin's lower mandible must couple efficiently into the inner ear. In both cases, the biological solution is impedance matching through graded transitions — the subject of [Signal Processing and Engineering Analogues](05-signal-processing-analogues.md).

---

## 4. Reflection at Boundaries

### 4.1 The Reflection Coefficient

At a planar boundary between two media with impedances Z_1 and Z_2, the pressure reflection coefficient is:

```
R = (Z_2 - Z_1) / (Z_2 + Z_1)
```

and the pressure transmission coefficient is:

```
T = 2 * Z_2 / (Z_2 + Z_1)
```

The intensity (power) reflection coefficient is:

```
R_I = |R|^2 = [(Z_2 - Z_1) / (Z_2 + Z_1)]^2
```

and the intensity transmission coefficient is:

```
T_I = 1 - R_I = 4 * Z_1 * Z_2 / (Z_1 + Z_2)^2
```

### 4.2 Reflection Coefficient Examples

| Boundary | Z_1 | Z_2 | R (pressure) | R_I (intensity) | Energy Reflected |
|----------|-----|-----|-------|------|-----------------|
| Water → Fish muscle | 1.54 | 1.65 | +0.034 | 0.0012 | 0.12% |
| Water → Swim bladder (gas) | 1.54 | 0.000408 | -0.9995 | 0.999 | 99.9% |
| Water → Bone | 1.54 | 6.65 | +0.624 | 0.389 | 38.9% |
| Air → Water | 0.000415 | 1.54 | +0.9995 | 0.999 | 99.9% |
| Melon core → Melon periphery | 1.28 | 1.44 | +0.059 | 0.0035 | 0.35% |

These numbers reveal the acoustic world as experienced by an echolocating dolphin or orca:

- **Fish muscle is nearly acoustically invisible** — only 0.12% of incident energy reflects. A fish without a swim bladder (like a shark or flatfish) would be extremely difficult to detect by echolocation.
- **The swim bladder is a near-perfect reflector** — 99.9% of incident energy reflects. It is acoustically equivalent to a mirror. This is why the swim bladder dominates the acoustic signature of bony fish.
- **The melon's internal boundaries are barely reflective** — only 0.35% reflection at internal interfaces. The smooth gradient minimizes internal reflections, preventing echo artifacts within the melon itself.
- **The air-water boundary is a near-perfect reflector** — this is why underwater sound does not propagate into air and vice versa. It also explains why the mammalian middle ear (an air-filled cavity) requires impedance-matching bones (ossicles) to couple sound from air into the fluid-filled cochlea — see [Signal Processing and Engineering Analogues](05-signal-processing-analogues.md).

### 4.3 Angle-Dependent Reflection

At oblique incidence, the reflection coefficient depends on angle. For a fluid-fluid boundary, the angle-dependent reflection coefficient is:

```
R(theta) = (Z_2 * cos(theta_1) - Z_1 * cos(theta_2)) / (Z_2 * cos(theta_1) + Z_1 * cos(theta_2))
```

where theta_1 and theta_2 are related by Snell's law. This means that the acoustic signature of a target (like a fish) changes with aspect angle — the echo is different when the fish is broadside vs. head-on vs. tail-on. Echolocating animals exploit this: by scanning a target from multiple angles (as orcas do during their approach maneuvers [P9]), they can build a more complete acoustic image.

---

## 5. The Fish Swim Bladder — Nature's Acoustic Mirror

### 5.1 Structure and Function

The swim bladder (also called gas bladder or air bladder) is a gas-filled organ found in most bony fish (Osteichthyes). Its primary biological function is buoyancy regulation — by adjusting gas volume, the fish maintains neutral buoyancy without constant swimming effort.

However, the swim bladder's acoustic properties are a by-product of this buoyancy function, and they dominate the fish's acoustic signature:

| Property | Swim Bladder | Surrounding Tissue/Water |
|----------|-------------|------------------------|
| Density | ~1.2 kg/m^3 (gas) | ~1050 kg/m^3 (tissue) |
| Sound speed | ~340 m/s (gas) | ~1570 m/s (tissue) |
| Impedance | ~408 Pa*s/m | ~1.65 * 10^6 Pa*s/m |
| Impedance ratio | — | ~4,000:1 |

### 5.2 Resonance Physics

The swim bladder resonates at a frequency determined by its size, the ambient pressure, and the properties of the surrounding tissue. For a free gas bubble in water, the resonant frequency is given by the Minnaert formula:

```
f_res = (1 / (2*pi*a)) * sqrt(3 * gamma * P_0 / rho_water)
```

where:

| Symbol | Name | Definition | Units |
|--------|------|------------|-------|
| a | Equivalent radius | Radius of a sphere with the same volume as the swim bladder | m |
| gamma | Adiabatic index | Ratio of specific heats (1.4 for air) | dimensionless |
| P_0 | Ambient pressure | Hydrostatic pressure at fish depth | Pa |
| rho_water | Water density | Density of surrounding water | kg/m^3 |

For a Chinook salmon swim bladder (volume ~100 cm^3, equivalent radius ~2.9 cm) at 10 m depth:

```
P_0 = P_atm + rho*g*h = 101325 + 1025*9.81*10 = 201,900 Pa

f_res = (1 / (2*pi*0.029)) * sqrt(3 * 1.4 * 201900 / 1025)
f_res = 5.49 * sqrt(827)
f_res = 5.49 * 28.8
f_res = 158 Hz
```

This resonant frequency is well below the echolocation band of orcas (10,000-100,000 Hz). At echolocation frequencies, the swim bladder is many wavelengths in size and acts as a geometric reflector rather than a resonant scatterer. The echo at these frequencies carries information about the physical size and shape of the bladder — which differs between salmon species.

### 5.3 Target Strength of Salmon Species

Different salmon species have different body sizes and swim bladder morphologies, producing different target strengths:

| Species | Typical Length | Swim Bladder Volume | TS (dorsal, 38 kHz) | Relative Reflectivity |
|---------|--------------|--------------------|--------------------|---------------------|
| Chinook (*O. tshawytscha*) | 60-100 cm | 80-150 cm^3 | -28 to -22 dB | Strongest — largest bladder |
| Coho (*O. kisutch*) | 45-65 cm | 40-80 cm^3 | -33 to -27 dB | Moderate |
| Sockeye (*O. nerka*) | 40-60 cm | 30-60 cm^3 | -36 to -30 dB | Moderate |
| Pink (*O. gorbuscha*) | 35-55 cm | 25-50 cm^3 | -38 to -32 dB | Smaller |
| Chum (*O. keta*) | 50-70 cm | 50-100 cm^3 | -32 to -26 dB | Moderate-large |

The Chinook salmon, being the largest Pacific salmon species, has the largest swim bladder and the highest target strength. This physical fact — a simple consequence of body size, swim bladder volume, and impedance mismatch physics — is the reason that Chinook produce a distinctive acoustic signature detectable by orca echolocation.

---

## 6. Orca Prey Discrimination by Acoustic Signature

### 6.1 NOAA NWFSC Evidence

NOAA Northwest Fisheries Science Center research confirms that Southern Resident orcas identify Chinook salmon specifically by the acoustic signature of the swim bladder [G1]:

> "The air pocket creates a distinctive echo that distinguishes Chinook from other salmon species."

This finding has profound implications for understanding orca foraging ecology: the orcas are not simply detecting "fish" — they are discriminating between salmon species based on the spectral and temporal characteristics of the swim bladder echo.

### 6.2 Physical Basis for Species Discrimination

The echo from a swim bladder carries multiple pieces of information:

| Echo Feature | Physical Origin | Species Information |
|-------------|----------------|-------------------|
| Echo amplitude | Swim bladder cross-sectional area | Body size indicator |
| Echo duration | Bladder length in the beam direction | Body length indicator |
| Spectral content | Bladder shape and internal reflections | Species-specific morphology |
| Aspect dependence | Bladder orientation relative to beam | Swimming direction and species body shape |
| Resonance harmonics | Bladder natural frequencies | Volume and tissue stiffness (species-dependent) |

### 6.3 Why Chinook Are Preferred

From the sonar equation perspective (see [Sonar and Echo-Delay Ranging](01-sonar-echo-delay.md)):

```
SE = SL - 2TL + TS - NL
```

Chinook salmon have the highest TS of any Pacific salmon species due to their larger swim bladders. Higher TS means higher SE, which means:

1. **Detectable at greater range** — the orca can find Chinook from farther away
2. **Detectable in higher noise** — the larger echo margin tolerates more ambient noise
3. **Higher energetic reward** — larger fish contain more caloric energy, and higher TS enables detection at lower metabolic cost (fewer clicks needed)

The orca's preference for Chinook is not arbitrary — it is physically optimal. The largest prey species produces the strongest echo and the highest caloric return per detection event. The physics of impedance mismatch drives the foraging ecology.

---

## 7. Compression Waves — Longitudinal Propagation

### 7.1 Definition

A compression wave (also called a longitudinal wave or P-wave) is a mechanical wave in which the oscillation of particles is parallel to the direction of wave propagation. The wave consists of alternating regions of compression (high pressure, high density) and rarefaction (low pressure, low density):

```
Direction of propagation --->

Compression  Rarefaction  Compression  Rarefaction
  ||||||||     |  |  |     ||||||||     |  |  |
  High P       Low P       High P       Low P
  High rho     Low rho     High rho     Low rho
```

### 7.2 Sound as a Compression Wave

All sound in fluids (air, water) is compression wave propagation. This includes:

- Every dolphin click, orca call, bat chirp, and whale song
- Every sonar ping, echosounder pulse, and ADCP signal
- Every word spoken in air, every note played underwater
- Seismic P-waves through the Earth

The governing equation for acoustic pressure in a compression wave is the wave equation:

```
d^2p/dt^2 = c^2 * nabla^2(p)
```

where p is the acoustic pressure perturbation (deviation from ambient), c is the sound speed, and nabla^2 is the Laplacian operator. For a plane wave propagating in the x-direction:

```
p(x, t) = P_0 * cos(k*x - omega*t)
```

where P_0 is the pressure amplitude, k = 2*pi/lambda is the wavenumber, and omega = 2*pi*f is the angular frequency. The relationship between these parameters:

```
c = omega / k = f * lambda
```

This is the dispersion relation for compression waves in a homogeneous fluid — phase velocity equals frequency times wavelength. In non-dispersive media (like water and air at audio/ultrasonic frequencies), c is independent of frequency, meaning all frequency components travel at the same speed and pulse shapes are preserved.

### 7.3 Compression Wave Parameters in Biological Contexts

| Parameter | Dolphin Click | Orca Call | Bat FM Sweep | Blue Whale Call |
|-----------|--------------|----------|-------------|----------------|
| Medium | Seawater | Seawater | Air | Seawater |
| c | 1500 m/s | 1500 m/s | 343 m/s | 1500 m/s |
| Frequency | 10-150 kHz | 0.5-100 kHz | 20-80 kHz | 10-40 Hz |
| Wavelength | 10-150 mm | 15 mm - 3 m | 4-17 mm | 37-150 m |
| Pressure amplitude | Up to 100 kPa (229 dB) | Up to 10 kPa (200 dB) | Up to 1 Pa (134 dB, in air) | Up to 1 kPa (180 dB) |
| Particle velocity | up to 67 mm/s | up to 6.7 mm/s | up to 2.4 mm/s | up to 0.67 mm/s |

The relationship between pressure amplitude and particle velocity in a plane wave is:

```
u = p / Z = p / (rho * c)
```

High impedance media (water: Z = 1.54 MRayl) require much higher pressure to produce the same particle velocity as low impedance media (air: Z = 415 Rayl). This is why underwater sounds have much higher pressure levels in dB than comparable sounds in air — the reference units are the same (1 uPa), but the physical intensities are different.

---

## 8. Shear Waves and Why They Don't Propagate in Fluids

### 8.1 Shear Wave Definition

A shear wave (also called a transverse wave or S-wave) is a mechanical wave in which particle oscillation is perpendicular to the direction of propagation:

```
Direction of propagation --->

    ^     ^     ^     ^
   /     /     /     /
  /     /     /     /        Particle motion is
 v     v     v     v         perpendicular to
                              propagation direction
```

### 8.2 Why Fluids Don't Support Shear Waves

Shear wave propagation requires a shear restoring force — the medium must resist deformation perpendicular to the wave direction. The shear wave speed is:

```
c_shear = sqrt(G / rho)
```

where G is the shear modulus (resistance to shear deformation). For fluids (liquids and gases), G = 0 by definition — a fluid deforms freely under shear stress without restoring force. Therefore:

```
c_shear = sqrt(0 / rho) = 0
```

Shear waves cannot propagate in fluids. Only compression waves propagate in water and air. This is why:

1. **All underwater acoustics** (dolphin sonar, orca echolocation, Navy sonar, whale communication) involves exclusively compression waves.
2. **All airborne acoustics** (bat echolocation, bird calls, human speech) involves exclusively compression waves.
3. **Seismic waves** in the solid Earth include both P-waves (compression) and S-waves (shear), but S-waves are blocked by the liquid outer core — this is how geophysicists determined the outer core is liquid.

### 8.3 Implications for Biological Acoustics

The absence of shear waves in water simplifies the acoustic physics of marine biosonar: only one wave mode exists, and it propagates at a single speed c determined by density and bulk modulus. There is no mode conversion (compression to shear or vice versa) at soft-tissue boundaries in the marine environment — mode conversion only occurs at hard boundaries like bone.

At the skull of an orca or dolphin, mode conversion does occur: incoming compression waves in water/tissue can excite shear waves in bone. This is one reason the tympanic-periotic complex (the ear bones) is acoustically isolated from the skull by air-filled sinuses — to prevent bone-conducted shear waves from reaching the cochlea and interfering with the received sonar signal.

### 8.4 Interface Waves — Scholte and Rayleigh Waves

At fluid-solid interfaces (like the ocean bottom), a special type of wave can propagate: the Scholte wave (the underwater equivalent of a Rayleigh surface wave). These waves have both compression and shear components and propagate along the interface, decaying exponentially with distance from the boundary.

In the shallow waters of Puget Sound (30-300 m), Scholte waves at the seabed can contribute to low-frequency ambient noise. However, at the high frequencies used by orca echolocation (10-100 kHz), these interface effects are negligible — the echolocation signal is firmly in the compression-wave-only regime.

---

## 9. Infrasound Communication — Elephants and Whales

### 9.1 Infrasound Defined

Infrasound is acoustic energy at frequencies below the nominal human hearing threshold of 20 Hz. These are compression waves — identical in physics to audible sound — but at wavelengths so long that they propagate with very low absorption and can travel enormous distances.

```
At f = 20 Hz:
  In air:    lambda = 343 / 20 = 17.2 m
  In water:  lambda = 1500 / 20 = 75 m

At f = 5 Hz:
  In air:    lambda = 343 / 5 = 68.6 m
  In water:  lambda = 1500 / 5 = 300 m
```

### 9.2 Elephant Infrasound

African and Asian elephants produce infrasonic calls (rumbles) in the 5-30 Hz range, with fundamental frequencies as low as 5 Hz. These calls propagate through both air and ground (seismic):

| Channel | Speed | Absorption | Range |
|---------|-------|-----------|-------|
| Airborne | 343 m/s | Extremely low at <30 Hz | 5-10 km under favorable conditions |
| Ground (Rayleigh wave) | 200-400 m/s (surface) | Very low | 2-5 km (detected via feet, trunk) |

The elephant detects ground-borne infrasound through vibration-sensitive cells in the feet and possibly the trunk tip — a seismic sensor that complements the auditory system. This is multi-modal sensor fusion (acoustic + seismic), with the same compression wave physics operating in two different media simultaneously.

### 9.3 Whale Infrasound

Blue whales (*Balaenoptera musculus*) and fin whales (*B. physalus*) produce some of the most powerful infrasonic signals in the biological world:

| Species | Frequency | Source Level | Propagation Range |
|---------|-----------|-------------|-------------------|
| Blue whale | 10-40 Hz | ~188 dB re 1 uPa @ 1m | Hundreds of kilometers (SOFAR channel) |
| Fin whale | 15-30 Hz | ~186 dB re 1 uPa @ 1m | Hundreds of kilometers |
| Humpback whale | 20 Hz - 4 kHz | ~170-190 dB | Tens of kilometers |

At these frequencies, absorption in seawater is essentially zero (alpha < 0.001 dB/km). Transmission loss is dominated entirely by geometric spreading. In the SOFAR channel (see Section 10), even geometric spreading is reduced because the sound is trapped in a waveguide, and spreading becomes cylindrical rather than spherical.

The result: blue whale calls can potentially be detected at distances exceeding 1,000 km under favorable conditions. The physics — low frequency, low absorption, waveguide propagation — enables a communication range that spans ocean basins.

### 9.4 PNW Whale Infrasound

In the Pacific Northwest, several whale species produce infrasonic or near-infrasonic calls:

| Species | PNW Presence | Frequency Range | Communication Range |
|---------|-------------|----------------|-------------------|
| Blue whale | Seasonal (summer/fall) off WA/OR coast | 10-40 Hz | Hundreds of km |
| Fin whale | Year-round, deep water | 15-30 Hz | Hundreds of km |
| Gray whale | Seasonal migration along coast | 20 Hz - 2 kHz | Tens of km |
| Humpback whale | Seasonal in inland waters | 20 Hz - 4 kHz | Tens of km |
| Southern Resident orca | Year-round in Salish Sea | 500 Hz - 100 kHz | 1-10 km |

Orcas do not use infrasound — their communication calls are in the 500 Hz - 10 kHz range, and their echolocation clicks are in the 10-100 kHz range. Their communication range in the Salish Sea is limited to a few kilometers, which is appropriate for pod-level coordination in confined inland waters [G1, O2].

---

## 10. Ocean Acoustic Waveguides — The SOFAR Channel

### 10.1 The Sound Speed Profile

In the open ocean, sound speed varies with depth in a characteristic pattern:

```
Depth (m)    c (m/s)    Mechanism
0            1520       Warm surface, moderate pressure
100          1500       Cooling with depth (thermocline)
500          1485       Continued cooling
1000         1480       Near-minimum c (sound channel axis)
2000         1490       Pressure effect begins to dominate
3000         1510       Pressure increase overcomes cooling
4000         1535       Continued pressure increase
```

The minimum sound speed occurs at the "sound channel axis" — typically at 700-1200 m depth in temperate oceans. Above this axis, c decreases with depth (temperature effect). Below, c increases with depth (pressure effect).

### 10.2 Waveguide Trapping

By Snell's law, sound bends toward regions of lower c. Sound rays launched near the sound channel axis are refracted back toward the axis from both above and below:

- Rays heading upward encounter increasing c → refract back downward
- Rays heading downward encounter increasing c → refract back upward

The result is a natural acoustic waveguide — the SOFAR (Sound Fixing and Ranging) channel — that traps sound energy and prevents it from spreading spherically. Transmission loss in the SOFAR channel follows cylindrical spreading:

```
TL_SOFAR = 10 * log10(r)    (vs. 20 * log10(r) for spherical spreading)
```

At 1000 km range:
- Spherical spreading: TL = 20 * log10(10^6) = 120 dB
- Cylindrical spreading (SOFAR): TL = 10 * log10(10^6) = 60 dB

The SOFAR channel provides a 60 dB advantage — the signal is one million times stronger than it would be with spherical spreading. This is how blue whale calls propagate across ocean basins, and how the U.S. Navy's SOSUS (Sound Surveillance System) detected submarine movements during the Cold War.

### 10.3 Salish Sea Acoustics — Shallow Water

The Salish Sea does not have a SOFAR channel — the water is too shallow (30-300 m in most of Puget Sound) for the deep sound speed minimum to develop. Instead, Salish Sea acoustics are characterized by:

- **Surface and bottom reflections** — sound bounces between the surface and the seabed, creating a multipath environment
- **Strong tidal mixing** — temperature and salinity gradients are disrupted by tidal currents, reducing stable refraction patterns
- **Fraser River plume** — the freshwater outflow from the Fraser River creates a low-salinity surface layer that affects sound speed in the northern Salish Sea

These shallow-water effects create a complex acoustic environment for orca echolocation — multipath echoes, bottom reflections, and variable sound speed all complicate the sonar equation. The orca's neural processing must extract target information from echoes corrupted by these environmental effects [G1, G3].

---

## 11. PNW Cross-Reference

### 11.1 Salish Sea Acoustic Environment

The refraction, reflection, and compression wave physics described in this document are realized daily in the Salish Sea:

| Physics Concept | Salish Sea Realization |
|----------------|----------------------|
| Refraction (Snell's law) | Sound speed variations from Fraser River freshwater plume, tidal mixing, seasonal thermocline |
| Dolphin melon (GRIN lens) | Resident and transient orca echolocation beam-forming |
| Impedance mismatch reflection | Chinook swim bladder echo — primary target detection mechanism for SRKW [G1] |
| Compression wave propagation | All acoustic signals — echolocation, communication, ambient noise |
| Shallow-water multipath | Surface/bottom reflections in Puget Sound create complex echo environments |

### 11.2 Species-Specific Connections

| Species | Refraction/Reflection Physics | PNW Context |
|---------|-------------------------------|-------------|
| Southern Resident orca | Melon beam-forming; mandible reception; swim bladder target detection | Salish Sea, San Juan Islands [G1, G5] |
| Chinook salmon | Swim bladder as acoustic reflector; species-specific TS | Columbia River, Puget Sound tributaries [G1] |
| Pacific salmon (all species) | Swim bladder size correlates with body size and TS | PNW river systems, Salish Sea [G1] |
| Harbor porpoise | Narrowband high-frequency clicks; melon beam-forming | Puget Sound, Strait of Juan de Fuca |
| PNW bats (E. fuscus, M. lucifugus) | Mouth/nostril beam-forming (no melon, but nasal structures shape beam) | PNW forests and urban areas |

### 11.3 Conservation Acoustics

Understanding reflection and impedance physics is directly relevant to SRKW conservation:

- **Echosounder interference:** Vessel echosounders (12-200 kHz) produce reflections from the same swim bladders the orcas are trying to detect. This creates "false targets" and increases the effective noise in the echolocation band [G1].
- **Bubble screens:** Proposed noise mitigation using bubble curtains (air bubbles in water) exploits the extreme impedance mismatch between gas and water to reflect and scatter anthropogenic noise before it reaches orca habitat.
- **Hydrophone calibration:** Understanding impedance matching at hydrophone transducers is essential for accurate measurement of ambient noise levels in SRKW habitat [O2].

---

## 12. Interrelationships

| Related Document | Connection |
|-----------------|------------|
| [Sonar and Echo-Delay Ranging](01-sonar-echo-delay.md) | TL, TS, and the sonar equation depend on the refraction, reflection, and impedance physics detailed here |
| [Doppler Effect](02-doppler-effect.md) | Doppler shift magnitude depends on c, which varies with medium properties that also control refraction |
| [Phase Separation, Comb Filtering, and Binaural Localization](04-phase-comb-filter.md) | Binaural processing depends on sound arriving at the mandible reception apparatus — impedance matching governs coupling efficiency |
| [Signal Processing and Engineering Analogues](05-signal-processing-analogues.md) | Impedance matching (ossicles, mandible fat pads) is the primary signal processing analogue for this chapter; cochlear tonotopy is the filter that analyzes reflected signals |

---

## 13. Sources

### Government and Agency

| ID | Source | Relevance |
|----|--------|-----------|
| G1 | NOAA Northwest Fisheries Science Center | Orca prey discrimination by acoustic signature, swim bladder echo identification, echosounder interference |
| G3 | Puget Sound Institute / Encyclopedia of Puget Sound | Salish Sea acoustic environment, shallow-water propagation conditions |
| G5 | NOAA Vital Signs — Orcas | SRKW conservation measures, vessel buffer regulations |

### Peer-Reviewed Research

| ID | Citation | Relevance |
|----|----------|-----------|
| P2 | Au, W.W.L. and Simmons, J.A. (2007). Echolocation in dolphins and bats. Physics Today. | Melon as GRIN lens, CT scan evidence, beam-forming physics |
| P3 | Mulsow, J. et al. (2020). Anatomy and neural physiology of dolphin biosonar. FASEB Journal. | Dolphin mandible reception anatomy, tympanic-periotic isolation |
| P9 | Holt, M. / Tennessen, J. — NOAA NWFSC. Biologging tag studies on Southern Resident orcas. | Multi-angle target scanning during approach, foraging behavior |

### Professional Organizations

| ID | Source | Relevance |
|----|--------|-----------|
| O1 | dolphins.org | Dolphin melon structure and function |
| O2 | Orca Behavior Institute | Salish Sea hydrophone monitoring, orca acoustic behavior |
| O4 | Acoustics Today / ASA | Echolocation physics review, SOFAR channel physics |

---

*The physics does not change. A graded-index optical lens and a dolphin's melon focus waves by the same Snell's law refraction. A bathroom mirror and a fish swim bladder reflect waves by the same impedance mismatch physics. A seismic P-wave through granite and a dolphin click through seawater propagate by the same compression mechanism. The materials differ. The frequencies differ. The equations are identical.*
