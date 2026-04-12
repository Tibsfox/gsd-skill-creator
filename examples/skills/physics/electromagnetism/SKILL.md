---
name: electromagnetism
description: Electromagnetism from Coulomb's law through Maxwell's equations and optics. Covers electric fields, Gauss's law, electric potential, capacitance, DC circuits (Ohm's law, Kirchhoff's laws), magnetic fields and forces, Biot-Savart law, Ampere's law, Faraday's law of induction, Lenz's law, Maxwell's equations in integral and differential forms, electromagnetic waves, the speed of light derivation, and optics (reflection, refraction, lenses, interference, diffraction). Use when analyzing electric or magnetic phenomena, circuit design, wave propagation, or optical systems.
type: skill
category: physics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/skills/physics/electromagnetism/SKILL.md
superseded_by: null
---
# Electromagnetism

Electromagnetism unifies electric and magnetic phenomena into a single theoretical framework, culminating in Maxwell's equations (1865). It explains everything from static charge interactions to light itself. The history runs from Coulomb's torsion balance (1785) through Faraday's field concept (1830s) to Maxwell's synthesis and Hertz's experimental confirmation of electromagnetic waves (1887). This skill covers electrostatics, magnetostatics, circuits, electromagnetic induction, Maxwell's equations, electromagnetic waves, and optics.

**Agent affinity:** maxwell (electromagnetism, Sonnet)

**Concept IDs:** phys-electric-charge-force, phys-ohms-law-circuits, phys-magnetic-fields, phys-electromagnetic-induction, phys-optics, phys-electromagnetic-spectrum

## Electromagnetism at a Glance

| # | Topic | Key equations | Core idea |
|---|---|---|---|
| 1 | Coulomb's law & electric fields | F = kq_1 q_2/r^2, E = F/q | Charges create and respond to fields |
| 2 | Gauss's law | Phi_E = Q_enc / epsilon_0 | Flux through closed surface = enclosed charge |
| 3 | Electric potential | V = kq/r, E = -dV/dx | Potential energy per unit charge |
| 4 | Capacitance | C = Q/V, C = epsilon_0 A/d | Stores charge and energy in fields |
| 5 | DC circuits | V = IR, Kirchhoff's laws | Current, voltage, resistance relationships |
| 6 | Magnetic fields & forces | F = qv x B, F = IL x B | Moving charges create and feel magnetic forces |
| 7 | Biot-Savart & Ampere | dB = (mu_0/4pi)(I dL x r-hat)/r^2 | Current-carrying wires create B fields |
| 8 | Faraday's law | EMF = -d(Phi_B)/dt | Changing flux induces voltage |
| 9 | Maxwell's equations | Four equations unify all of E&M | Complete classical field theory |
| 10 | EM waves | c = 1/sqrt(mu_0 epsilon_0) | Self-propagating E and B oscillations |
| 11 | Optics | n_1 sin(theta_1) = n_2 sin(theta_2) | Light as electromagnetic wave |

## Topic 1 — Coulomb's Law and Electric Fields

**Coulomb's law:** F = k |q_1 q_2| / r^2, where k = 1/(4 pi epsilon_0) = 8.99 * 10^9 N m^2/C^2. The force is along the line joining the charges: repulsive for like charges, attractive for unlike.

**Electric field:** E = F/q_test. The field at a point is the force per unit positive test charge. For a point charge Q: E = kQ/r^2, directed radially outward (positive Q) or inward (negative Q).

**Superposition.** The total electric field is the vector sum of fields from all individual charges. This principle underlies all electrostatics calculations.

**Worked example.** *Two charges, q_1 = +3 muC at the origin and q_2 = -5 muC at x = 0.4 m. Find the electric field at x = 0.2 m.*

**Solution.** At x = 0.2 m, the distance to q_1 is 0.2 m and to q_2 is 0.2 m.

E_1 = k|q_1|/r_1^2 = (8.99e9)(3e-6)/(0.04) = 6.74 * 10^5 N/C, pointing in the +x direction (away from positive charge).

E_2 = k|q_2|/r_2^2 = (8.99e9)(5e-6)/(0.04) = 1.124 * 10^6 N/C, pointing in the +x direction (toward negative charge).

E_total = E_1 + E_2 = 1.80 * 10^6 N/C in the +x direction.

## Topic 2 — Gauss's Law

**Statement:** The electric flux through any closed surface equals the enclosed charge divided by epsilon_0:

Phi_E = integral of (E dot dA) over closed surface = Q_enc / epsilon_0

**Power of Gauss's law.** When the charge distribution has sufficient symmetry (spherical, cylindrical, or planar), Gauss's law reduces the field calculation to algebra.

**Worked example.** *Find the electric field outside a uniformly charged sphere of total charge Q and radius R, at distance r > R from the center.*

**Solution.** By spherical symmetry, E is radial and has the same magnitude at every point on a concentric Gaussian sphere of radius r. Gauss's law: E(4 pi r^2) = Q / epsilon_0. Therefore E = Q / (4 pi epsilon_0 r^2) = kQ/r^2.

This is identical to the field of a point charge Q at the center — the shell theorem for electrostatics.

**When Gauss's law is not the right tool.** When the charge distribution lacks high symmetry (e.g., a finite charged rod at a point off-axis), Gauss's law still holds but does not simplify. Use direct integration of Coulomb's law instead.

## Topic 3 — Electric Potential and Voltage

**Electric potential:** V = U/q = kQ/r for a point charge. The potential is a scalar — no vector addition needed. The electric field is the negative gradient of potential: E = -grad(V).

**Potential difference (voltage):** Delta V = V_B - V_A = -integral from A to B of (E dot dL). This is what voltmeters measure.

**Equipotential surfaces.** Surfaces of constant V. The electric field is always perpendicular to equipotential surfaces. No work is done moving a charge along an equipotential.

**Worked example.** *An electron (charge -e = -1.6 * 10^-19 C, mass 9.11 * 10^-31 kg) is accelerated from rest through a potential difference of 500 V. Find its final speed.*

**Solution.** Energy conservation: q Delta V = (1/2)mv^2. Here q = e (magnitude of electron charge, since it gains energy moving from low to high potential).

v = sqrt(2e Delta V / m) = sqrt(2 * 1.6e-19 * 500 / 9.11e-31) = sqrt(1.758e14) = 1.326 * 10^7 m/s.

**Check:** v/c = 0.044, so non-relativistic treatment is justified (barely).

## Topic 4 — Capacitance

**Definition:** C = Q/V. A capacitor stores charge Q when voltage V is applied. Unit: Farad (F) = C/V.

**Parallel plate capacitor:** C = epsilon_0 A / d, where A is plate area and d is plate separation.

**Energy stored:** U = (1/2)CV^2 = (1/2)Q^2/C = (1/2)QV.

**Dielectrics.** Inserting a dielectric material (dielectric constant kappa) between the plates increases capacitance: C = kappa epsilon_0 A / d. The dielectric reduces the effective electric field.

**Series and parallel combinations:**
- Parallel: C_total = C_1 + C_2 + ... (voltages equal, charges add)
- Series: 1/C_total = 1/C_1 + 1/C_2 + ... (charges equal, voltages add)

Note: This is the opposite pattern from resistors.

## Topic 5 — DC Circuits

**Ohm's law:** V = IR. Resistance R = rho L / A, where rho is resistivity, L is length, A is cross-sectional area.

**Power:** P = IV = I^2 R = V^2/R.

**Kirchhoff's laws:**
1. **Junction rule (KCL):** Sum of currents into a junction equals sum of currents out. (Conservation of charge.)
2. **Loop rule (KVL):** Sum of voltage changes around any closed loop is zero. (Conservation of energy.)

**Resistors in series:** R_total = R_1 + R_2 + ... (currents equal, voltages add).
**Resistors in parallel:** 1/R_total = 1/R_1 + 1/R_2 + ... (voltages equal, currents add).

**Worked example.** *A circuit has a 12 V battery connected to three resistors: R_1 = 4 ohm and R_2 = 6 ohm in parallel, and that combination in series with R_3 = 5 ohm. Find the current from the battery.*

**Solution.** Parallel combination: 1/R_12 = 1/4 + 1/6 = 3/12 + 2/12 = 5/12, so R_12 = 2.4 ohm. Total resistance: R_total = R_12 + R_3 = 2.4 + 5 = 7.4 ohm. Current: I = V/R_total = 12/7.4 = 1.62 A.

**Worked example — Kirchhoff's laws.** *Two batteries (E_1 = 10 V with internal resistance r_1 = 1 ohm, and E_2 = 6 V with r_2 = 2 ohm) are connected in a loop with an external resistor R = 5 ohm. Find the current.*

**Solution.** Apply KVL around the loop (assume current I flows clockwise from E_1): E_1 - I r_1 - IR - E_2 - I r_2 = 0. So 10 - I - 5I - 6 - 2I = 0. Thus 4 = 8I, giving I = 0.5 A.

## Topic 6 — Magnetic Fields and Forces

**Magnetic force on a moving charge:** F = qv x B. The force is perpendicular to both v and B. It does no work (it changes direction, not speed).

**Magnetic force on a current-carrying wire:** F = IL x B, where L is the length vector along the wire in the direction of current.

**Cyclotron motion.** A charged particle in a uniform magnetic field moves in a circle: r = mv/(qB), period T = 2 pi m/(qB). The period is independent of speed (non-relativistic).

**Worked example.** *A proton (m = 1.67 * 10^-27 kg, q = 1.6 * 10^-19 C) enters a 0.5 T magnetic field at 3 * 10^6 m/s perpendicular to the field. Find the radius of its circular path.*

**Solution.** r = mv/(qB) = (1.67e-27)(3e6)/((1.6e-19)(0.5)) = 5.01e-21 / 8e-20 = 0.0626 m = 6.26 cm.

## Topic 7 — Biot-Savart Law and Ampere's Law

**Biot-Savart law:** dB = (mu_0 / 4 pi) (I dL x r-hat) / r^2. This is the magnetic analog of Coulomb's law — it gives the field from any current distribution via integration.

**Ampere's law:** integral of (B dot dL) around a closed loop = mu_0 I_enc. Like Gauss's law, it is powerful when symmetry allows: long straight wires, solenoids, toroids.

**Key results:**
- Long straight wire: B = mu_0 I / (2 pi r)
- Center of circular loop: B = mu_0 I / (2R)
- Inside a solenoid: B = mu_0 n I (n = turns per unit length)

**Worked example.** *A solenoid has 1000 turns, length 0.5 m, and carries 2 A. Find the magnetic field inside.*

**Solution.** n = N/L = 1000/0.5 = 2000 turns/m. B = mu_0 n I = (4 pi * 10^-7)(2000)(2) = 5.03 * 10^-3 T = 5.03 mT.

## Topic 8 — Faraday's Law and Electromagnetic Induction

**Faraday's law:** EMF = -d(Phi_B)/dt, where Phi_B = integral of (B dot dA) is the magnetic flux through the circuit.

**Lenz's law:** The induced current flows in the direction that opposes the change in flux that caused it. This is the physical content of the minus sign.

**Three ways to change flux:**
1. Change the magnetic field strength (dB/dt)
2. Change the area of the loop (dA/dt)
3. Change the angle between B and the loop normal (d theta/dt)

**Worked example.** *A rectangular loop (0.2 m by 0.3 m) is in a magnetic field that increases uniformly from 0 to 0.5 T in 0.1 s. The field is perpendicular to the loop. Find the induced EMF.*

**Solution.** Phi_B = BA = B(0.06). dPhi_B/dt = (dB/dt)A = (0.5/0.1)(0.06) = 0.3 V. EMF = 0.3 V.

**Motional EMF.** A conductor of length L moving at velocity v perpendicular to a magnetic field B develops EMF = BLv. This is Faraday's law applied to a changing area.

**Mutual and self-inductance.** A changing current in one coil induces EMF in a nearby coil (mutual inductance M). A changing current in a coil induces EMF in itself (self-inductance L): EMF = -L dI/dt. Energy stored in an inductor: U = (1/2)LI^2.

## Topic 9 — Maxwell's Equations

Maxwell's four equations, in integral form, are the complete classical theory of electromagnetism:

1. **Gauss's law (electric):** integral of (E dot dA) = Q_enc / epsilon_0. Electric charges are sources of E fields.

2. **Gauss's law (magnetic):** integral of (B dot dA) = 0. No magnetic monopoles; B field lines always close.

3. **Faraday's law:** integral of (E dot dL) = -d(Phi_B)/dt. Changing magnetic flux induces electric fields.

4. **Ampere-Maxwell law:** integral of (B dot dL) = mu_0 I_enc + mu_0 epsilon_0 d(Phi_E)/dt. Currents and changing electric flux create magnetic fields.

**In differential form:**
1. div E = rho / epsilon_0
2. div B = 0
3. curl E = -dB/dt
4. curl B = mu_0 J + mu_0 epsilon_0 dE/dt

**Maxwell's key insight.** The displacement current term (mu_0 epsilon_0 dPhi_E/dt in equation 4) was Maxwell's original contribution. Without it, Ampere's law is inconsistent for time-varying fields (it violates conservation of charge). With it, the equations predict electromagnetic waves.

## Topic 10 — Electromagnetic Waves

**Derivation of wave equation.** From Maxwell's equations in free space (no charges, no currents), take the curl of Faraday's law and substitute Ampere-Maxwell:

d^2 E/dx^2 = mu_0 epsilon_0 d^2 E/dt^2

This is a wave equation with speed c = 1/sqrt(mu_0 epsilon_0).

**The speed of light.** Substituting mu_0 = 4 pi * 10^-7 and epsilon_0 = 8.854 * 10^-12: c = 1/sqrt((4 pi * 10^-7)(8.854 * 10^-12)) = 2.998 * 10^8 m/s. Maxwell recognized this as the speed of light and concluded that light is an electromagnetic wave.

**Properties of EM waves:**
- E and B are perpendicular to each other and to the direction of propagation (transverse wave)
- E/B = c at all times
- They carry energy: Poynting vector S = (1/mu_0)(E x B), intensity I = S_avg
- They carry momentum: radiation pressure P = I/c (absorption) or P = 2I/c (reflection)

**The electromagnetic spectrum.** From lowest to highest frequency: radio, microwave, infrared, visible, ultraviolet, X-ray, gamma ray. All travel at c in vacuum; they differ only in frequency/wavelength.

## Topic 11 — Optics

### Geometric Optics

**Reflection:** Angle of incidence equals angle of reflection. Both measured from the normal.

**Refraction (Snell's law):** n_1 sin(theta_1) = n_2 sin(theta_2), where n is the index of refraction (n = c/v).

**Total internal reflection.** When light passes from a denser to a less dense medium, there exists a critical angle theta_c = arcsin(n_2/n_1) beyond which all light is reflected. This is the basis of fiber optics.

**Thin lens equation:** 1/f = 1/d_o + 1/d_i, where f is focal length, d_o is object distance, d_i is image distance. Magnification: M = -d_i/d_o.

**Worked example.** *A converging lens has focal length 20 cm. An object is placed 30 cm from the lens. Find the image location and magnification.*

**Solution.** 1/d_i = 1/f - 1/d_o = 1/20 - 1/30 = 3/60 - 2/60 = 1/60. So d_i = 60 cm (real image, on far side). M = -60/30 = -2 (inverted, twice the size).

### Wave Optics

**Interference (Young's double slit).** Two coherent slits separated by d produce bright fringes at angles where d sin(theta) = m lambda (m = 0, 1, 2, ...) and dark fringes at d sin(theta) = (m + 1/2) lambda.

**Single-slit diffraction.** A slit of width a produces dark fringes at a sin(theta) = m lambda (m = 1, 2, 3, ...).

**Worked example.** *Light of wavelength 600 nm passes through two slits separated by 0.1 mm. Find the spacing between bright fringes on a screen 2 m away.*

**Solution.** For small angles, fringe spacing Delta y = lambda L / d = (600e-9)(2)/(1e-4) = 0.012 m = 1.2 cm.

## When to Use This Skill

- Any problem involving electric charges, fields, or potentials
- Circuit analysis (DC or simple AC)
- Magnetic fields from currents, forces on charged particles in fields
- Electromagnetic induction, generators, transformers
- Electromagnetic wave properties, antenna problems
- Optical systems: lenses, mirrors, interference, diffraction

## When NOT to Use This Skill

- **Quantum effects on light:** Photoelectric effect, photon energy, Compton scattering — use the quantum-mechanics skill.
- **Relativistic electrodynamics:** Use the relativity-astrophysics skill for how E and B fields transform between reference frames.
- **Purely mechanical systems:** Use the classical-mechanics skill unless electromagnetic forces are involved.
- **Thermal radiation:** Use the thermodynamics skill for blackbody radiation; use quantum-mechanics for Planck's law.

## Common Mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| Adding potentials as vectors | Potential is a scalar, not a vector | Add V values algebraically; only E adds as vectors |
| Confusing series/parallel rules for R vs. C | They follow opposite patterns | Resistors: series adds, parallel uses reciprocal. Capacitors: the reverse. |
| Forgetting Lenz's law direction | Induced current must oppose the change | Ask: "which direction of current would create flux to fight the change?" |
| Using right-hand rule incorrectly | Cross product F = qv x B requires careful vector setup | Point fingers along v, curl toward B; thumb gives F for positive charge |
| Mixing up refraction toward/away from normal | Depends on relative n values | Higher n = slower light = bends toward normal |
| Applying thin lens equation with wrong signs | Sign conventions vary by textbook | Stick to one convention consistently; real images have positive d_i for converging lenses |

## Cross-References

- **maxwell agent:** Primary agent for all E&M problems. Sonnet-class, broad electromagnetic coverage.
- **faraday agent:** Pedagogy specialist — excels at intuitive explanations of induction and field concepts.
- **curie agent:** Department chair, can coordinate E&M problems that cross into other physics domains.
- **classical-mechanics skill:** For the mechanical aspects of charged particle motion (once the electromagnetic force is determined, the trajectory is a mechanics problem).
- **quantum-mechanics skill:** For the quantum nature of light and matter-light interactions.
- **experimental-methods skill:** For designing and analyzing electromagnetic experiments (Millikan, Michelson-Morley).

## References

- Griffiths, D. J. (2017). *Introduction to Electrodynamics*. 4th edition. Cambridge University Press.
- Purcell, E. M., & Morin, D. J. (2013). *Electricity and Magnetism*. 3rd edition. Cambridge University Press.
- Jackson, J. D. (1998). *Classical Electrodynamics*. 3rd edition. Wiley.
- Hecht, E. (2017). *Optics*. 5th edition. Pearson.
- Feynman, R. P., Leighton, R. B., & Sands, M. (1964). *The Feynman Lectures on Physics*, Vol. II. Addison-Wesley.
- Maxwell, J. C. (1865). "A Dynamical Theory of the Electromagnetic Field." *Phil. Trans. Royal Soc.* 155: 459-512.
