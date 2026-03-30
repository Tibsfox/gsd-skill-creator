# Mission 1.12 -- Explorer 7: The Mathematics of Balance

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Explorer 7 (October 13, 1959)
**Primary TSPB Layer:** 6 (Category Theory -- Energy Balance, Conservation Laws, Thermodynamic Equilibrium)
**Secondary Layers:** 2 (Pythagorean Theorem -- Inverse-Square Law for Solar Irradiance), 4 (Vector Calculus -- Radiative Transfer, Solid Angle Integration), 1 (Unit Circle -- Orbital Period, Seasonal Variation)
**Format:** McNeese-Hoag Reference Standard (1959)

---

## Deposit 1: Earth's Radiation Budget (Layer 6, Section 6.4)

### Table

| Parameter | Symbol | Units | Explorer 7 Value |
|-----------|--------|-------|-----------------|
| Launch date | -- | -- | October 13, 1959, 15:30 UTC |
| Launch vehicle | -- | -- | Juno II (modified Jupiter IRBM + Sergeant upper stages) |
| Operating agency | -- | -- | NASA / Goddard Space Flight Center |
| Spacecraft mass | m_sc | kg | 41.5 |
| Spacecraft shape | -- | -- | Hemisphere-cone-cylinder (truncated sphere on top) |
| Primary instruments | -- | -- | Suomi-Parent flat-plate bolometers (2 pairs) |
| Secondary instruments | -- | -- | Micrometeorite detector, heavy cosmic ray counter, Lyman-alpha detector |
| Orbit perigee | r_p | km | 573 (altitude) / 6,944 (geocentric) |
| Orbit apogee | r_a | km | 1,073 (altitude) / 7,444 (geocentric) |
| Orbital period | T | min | ~101.2 |
| Orbital inclination | i | deg | 50.3 |
| Mission duration | -- | -- | ~2 years (transmitter operated until February 1961) |
| Solar irradiance (measured) | S | W/m^2 | ~1360 (Suomi's early estimate) |
| Earth albedo (measured) | alpha | -- | ~0.30 (hemispheric average) |
| Effective radiating temperature | T_eff | K | ~255 (derived from outgoing longwave) |

### Formulas

**The Balance Equation -- Why Earth Has the Temperature It Does:**

Explorer 7 was the first satellite to measure both sides of Earth's energy budget: the incoming solar radiation and the outgoing thermal radiation. Verner Suomi and Robert Parent at the University of Wisconsin designed the flat-plate bolometers that made this measurement possible. The mathematics is a single equation -- but the consequences of that equation dominate climate science, atmospheric physics, and the habitability of every planet in the solar system.

```
THE ENERGY BALANCE OF A PLANET:

A planet in thermal equilibrium radiates as much energy as
it absorbs. If it absorbs more than it radiates, it warms.
If it radiates more than it absorbs, it cools. The balance
equation determines the planet's temperature.

ENERGY IN (absorbed solar radiation):

  P_in = S * pi * R^2 * (1 - alpha)

  where:
    S = solar irradiance at Earth's distance (W/m^2)
        (the "solar constant" -- ~1361 W/m^2 at 1 AU)
    R = Earth's radius (6.371 × 10^6 m)
    pi * R^2 = cross-sectional area intercepting sunlight
    alpha = planetary albedo (fraction reflected back to space)
    (1 - alpha) = fraction absorbed

  The cross-section is pi*R^2, not 4*pi*R^2, because only
  the disk facing the Sun intercepts sunlight. The Earth
  is a sphere, but to the Sun it presents a circle.

  Numerical values:
    S = 1361 W/m^2
    R = 6.371 × 10^6 m
    pi * R^2 = 1.275 × 10^14 m^2
    alpha = 0.30 (30% of sunlight reflected)

  P_in = 1361 * 1.275e14 * (1 - 0.30)
       = 1361 * 1.275e14 * 0.70
       = 1.214 × 10^17 W
       = 121.4 petawatts

ENERGY OUT (thermal radiation to space):

  P_out = epsilon * sigma * T^4 * 4 * pi * R^2

  where:
    epsilon = emissivity (~1 for a planet viewed from space)
    sigma = Stefan-Boltzmann constant (5.670 × 10^-8 W/m^2/K^4)
    T = effective radiating temperature (K)
    4 * pi * R^2 = total surface area of the sphere

  The emitting area is 4*pi*R^2 because the entire sphere
  radiates thermally in all directions, not just the sunlit side.

  This asymmetry -- absorbing over pi*R^2, emitting over
  4*pi*R^2 -- is the key geometric fact of planetary energy
  balance. The factor of 4 between them determines everything.

EQUILIBRIUM (P_in = P_out):

  S * pi * R^2 * (1 - alpha) = sigma * T_eff^4 * 4 * pi * R^2

  The R^2 and pi cancel:

  S * (1 - alpha) = 4 * sigma * T_eff^4

  Solving for T_eff:

  T_eff = [ S * (1 - alpha) / (4 * sigma) ]^(1/4)

  Numerical:
  T_eff = [ 1361 * 0.70 / (4 * 5.670e-8) ]^(1/4)
        = [ 952.7 / 2.268e-7 ]^(1/4)
        = [ 4.202 × 10^9 ]^(1/4)
        = 254.6 K
        = -18.5 C

THIS IS THE CRITICAL RESULT:

  Earth's effective radiating temperature is 255 K (-18 C).
  Earth's actual surface temperature is ~288 K (+15 C).
  The difference: 33 K.

  That 33 K difference is the greenhouse effect.
  The atmosphere absorbs some of the outgoing thermal
  radiation and re-emits it back toward the surface,
  warming the surface above the effective radiating
  temperature. Without the greenhouse effect, Earth
  would be frozen. With too much greenhouse effect,
  Earth would overheat.

  Explorer 7 measured both S*(1-alpha) and the outgoing
  thermal emission. Suomi's bolometers provided the first
  space-based data for both sides of this equation.
  The imbalance -- the difference between P_in and P_out --
  determines whether Earth is warming or cooling. If
  P_in > P_out by even 1 W/m^2 averaged over the globe,
  the planet accumulates heat. That 1 W/m^2 is the signal
  that climate science has been trying to measure precisely
  ever since Explorer 7 demonstrated it could be done.
```

### Worked Example

**Problem:** Calculate Earth's effective radiating temperature using Explorer 7's measured values, and determine the energy imbalance implied by different albedo and emissivity assumptions.

```python
import numpy as np

print("EXPLORER 7: EARTH'S RADIATION BUDGET")
print("=" * 60)

# Constants
sigma = 5.670e-8       # Stefan-Boltzmann constant (W/m^2/K^4)
S = 1361.0             # Solar irradiance at 1 AU (W/m^2)
R_earth = 6.371e6      # Earth's radius (m)

# Suomi's measured values (approximate from Explorer 7 era)
albedo = 0.30          # planetary albedo

# Cross-sectional area (sunlight interception)
A_cross = np.pi * R_earth**2
# Total surface area (thermal emission)
A_sphere = 4 * np.pi * R_earth**2

print(f"\nConstants:")
print(f"  Solar irradiance S = {S} W/m^2")
print(f"  Stefan-Boltzmann sigma = {sigma} W/m^2/K^4")
print(f"  Earth radius R = {R_earth/1e6:.3f} x 10^6 m")
print(f"  Cross-section area = {A_cross:.3e} m^2")
print(f"  Total surface area = {A_sphere:.3e} m^2")
print(f"  Ratio (sphere/cross) = {A_sphere/A_cross:.1f}")

print(f"\n{'='*60}")
print(f"EQUILIBRIUM TEMPERATURE vs ALBEDO")
print(f"{'='*60}")
print(f"\n{'Albedo':>8} | {'T_eff (K)':>10} | {'T_eff (C)':>10} | {'P_in (PW)':>10}")
print(f"{'-'*48}")

for alpha in [0.00, 0.10, 0.20, 0.30, 0.35, 0.40, 0.50]:
    P_in = S * A_cross * (1 - alpha)
    T_eff = (S * (1 - alpha) / (4 * sigma))**0.25
    print(f"{alpha:>8.2f} | {T_eff:>10.1f} | {T_eff - 273.15:>10.1f} | {P_in/1e15:>10.1f}")

print(f"\nExplorer 7 measured albedo ~ 0.30:")
T_measured = (S * (1 - albedo) / (4 * sigma))**0.25
print(f"  T_eff = {T_measured:.1f} K = {T_measured - 273.15:.1f} C")
print(f"  Actual surface T ~ 288 K = 15 C")
print(f"  Greenhouse warming = {288 - T_measured:.1f} K")

print(f"\n{'='*60}")
print(f"ENERGY IMBALANCE: THE SIGNAL SUOMI SOUGHT")
print(f"{'='*60}")

# If Earth is warming, P_in > P_out
# Current best estimate of imbalance: ~1.0 W/m^2
# This is averaged over the entire sphere

print(f"\nGlobal energy imbalance sensitivity:")
print(f"\n{'Imbalance (W/m^2)':>20} | {'Total (TW)':>12} | {'Ocean warming (C/decade)':>25}")
print(f"{'-'*62}")

for imbalance in [0.0, 0.5, 1.0, 1.5, 2.0, 3.0]:
    total_W = imbalance * A_sphere
    # Ocean absorbs ~90% of excess heat
    # Ocean mass ~ 1.335e21 kg, specific heat 3993 J/(kg*K)
    ocean_mass = 1.335e21
    ocean_Cp = 3993.0
    # Energy per decade = imbalance * area * seconds_per_decade * 0.9
    seconds_per_decade = 10 * 365.25 * 24 * 3600
    ocean_dT = (imbalance * A_sphere * seconds_per_decade * 0.90) / (ocean_mass * ocean_Cp)
    print(f"{imbalance:>20.1f} | {total_W/1e12:>12.1f} | {ocean_dT:>25.4f}")

print(f"\n  1 W/m^2 imbalance = {1.0 * A_sphere / 1e12:.0f} TW of excess heat")
print(f"  For comparison: total human energy consumption ~ 18 TW")
print(f"  The imbalance is {1.0 * A_sphere / 1e12 / 18:.0f}x human energy use")
print(f"\n  Explorer 7 could not measure the imbalance to 1 W/m^2")
print(f"  precision -- Suomi's bolometers had uncertainties of")
print(f"  ~5-10 W/m^2. But the measurement CONCEPT was proven.")
print(f"  The precision would come later: Nimbus, ERBE, CERES.")
print(f"  Suomi built the first instrument. The equation told")
print(f"  him what to measure. Explorer 7 proved it could be")
print(f"  measured from orbit.")
```

**Debate Question 1:** The balance equation T_eff = [S(1-alpha)/(4*sigma)]^(1/4) contains three measurable quantities: S, alpha, and T_eff. Suomi's bolometers measured all three from Explorer 7's orbit. But the equation assumes equilibrium -- P_in = P_out exactly. If Earth is warming (as it is now, at approximately 1 W/m^2 imbalance), P_in exceeds P_out by about 0.3%. Detecting a 0.3% difference between two large numbers (121 PW in, ~120.5 PW out) requires extraordinary measurement precision. Suomi knew in 1959 that his bolometers could not achieve this precision. He flew them anyway, because the first measurement need not be the precise one -- it needs to be the conceptual one. The concept was: measure both sides of the equation from orbit, derive the imbalance. Explorer 7 proved the concept. CERES, sixty years later, achieved the precision. The lesson for mathematics: sometimes the important equation is the one you cannot yet solve to sufficient accuracy. You solve it approximately, demonstrate the method, and trust that the precision will come when the instruments improve.

---

## Deposit 2: Bolometer Physics (Layer 2, Section 2.9)

### Table

| Parameter | Symbol | Units | Value |
|-----------|--------|-------|-------|
| Suomi bolometer type | -- | -- | Flat-plate hemispheric (paired black/white) |
| Black bolometer absorptivity | alpha_b | -- | ~0.95 (absorbs nearly all wavelengths) |
| White bolometer absorptivity (solar) | alpha_w_solar | -- | ~0.15 (reflects most visible/near-IR) |
| White bolometer absorptivity (thermal) | alpha_w_thermal | -- | ~0.90 (absorbs most thermal IR) |
| Bolometer plate area | A | cm^2 | ~10 |
| Temperature sensor | -- | -- | Thermistor bonded to plate |
| Temperature resolution | -- | K | ~0.1 |
| Number of bolometer pairs | -- | -- | 2 (one pair on each side of spacecraft) |

### Formulas

**The Two-Equation, Two-Unknown Problem:**

Suomi's insight was simple and elegant: by placing two bolometers side by side -- one painted black (absorbs all radiation) and one painted white (reflects solar but absorbs thermal) -- you can separate the incoming radiation into its two components: reflected sunlight and thermal emission from Earth. This is a system of two equations in two unknowns.

```
THE SUOMI-PARENT BOLOMETER PAIR:

A bolometer is a device that absorbs radiation and measures
its own temperature. The temperature rise is proportional to
the absorbed power. By knowing the thermal properties of the
bolometer (mass, heat capacity, thermal coupling to the
spacecraft), you can calculate the incident radiation flux
from the measured temperature.

The problem: a bolometer in orbit is illuminated by TWO
sources simultaneously:
  1. Solar radiation (reflected by Earth + direct sunlight)
     -- shortwave, peaked at ~0.5 microns (visible)
  2. Thermal radiation (emitted by Earth's surface and atmosphere)
     -- longwave, peaked at ~10 microns (infrared)

A single bolometer measures the TOTAL absorbed power -- the
sum of both sources. It cannot separate them.

Suomi's solution: TWO bolometers with different spectral
responses.

BLACK BOLOMETER:
  Absorbs both shortwave (solar) and longwave (thermal).
  Temperature determined by:

  P_black = alpha_b_solar * F_solar + alpha_b_thermal * F_thermal

  Since alpha_b ~ 0.95 for both:
  P_black ~ 0.95 * (F_solar + F_thermal)

WHITE BOLOMETER:
  Reflects most shortwave (solar), absorbs most longwave (thermal).
  Temperature determined by:

  P_white = alpha_w_solar * F_solar + alpha_w_thermal * F_thermal

  Since alpha_w_solar ~ 0.15, alpha_w_thermal ~ 0.90:
  P_white ~ 0.15 * F_solar + 0.90 * F_thermal

TWO EQUATIONS, TWO UNKNOWNS:

  P_black = 0.95 * F_solar + 0.95 * F_thermal    ... (1)
  P_white = 0.15 * F_solar + 0.90 * F_thermal    ... (2)

  P_black and P_white are measured (from bolometer temperatures).
  F_solar and F_thermal are the unknowns.

  From (1): F_solar + F_thermal = P_black / 0.95
  From (2): 0.15 * F_solar + 0.90 * F_thermal = P_white

  Substituting F_solar = (P_black/0.95) - F_thermal into (2):

  0.15 * [(P_black/0.95) - F_thermal] + 0.90 * F_thermal = P_white
  0.1579 * P_black - 0.15 * F_thermal + 0.90 * F_thermal = P_white
  0.1579 * P_black + 0.75 * F_thermal = P_white

  F_thermal = (P_white - 0.1579 * P_black) / 0.75
  F_solar = (P_black / 0.95) - F_thermal

THIS IS LINEAR ALGEBRA AT ITS MOST USEFUL:

  | 0.95  0.95 | | F_solar   |   | P_black |
  | 0.15  0.90 | | F_thermal | = | P_white |

  The system is solvable because the coefficient matrix has
  a non-zero determinant:

  det = 0.95 * 0.90 - 0.95 * 0.15
      = 0.855 - 0.1425
      = 0.7125

  The determinant is large (0.71), meaning the two equations
  are well-conditioned -- small errors in the measured
  temperatures do not produce large errors in the derived
  fluxes. This is not an accident. Suomi chose his paint
  colors specifically to maximize the determinant -- to make
  the solar and thermal absorptivities as different as possible
  for the white bolometer while keeping them nearly equal for
  the black bolometer.

  A poorly chosen paint (e.g., alpha_w_solar = 0.80 instead
  of 0.15) would give det = 0.95*0.90 - 0.95*0.80 = 0.1425,
  making the system ill-conditioned: a 1% temperature error
  would produce a ~5% flux error instead of ~1%.

  Suomi's paint selection was a mathematical decision
  disguised as a materials engineering choice.
```

**Debate Question 2:** The Suomi bolometer pair assumes that the absorptivity coefficients (alpha_b, alpha_w) are known precisely. In practice, the paint properties change in space: solar UV degrades white paint (increasing alpha_w_solar over time), atomic oxygen in low Earth orbit erodes coatings, and contamination from spacecraft outgassing changes surface properties. Explorer 7 operated for two years -- long enough for these degradation effects to change the calibration. Suomi understood this and designed periodic calibration checks by comparing bolometer readings during eclipse (no solar input, thermal only) with readings in sunlight (both inputs). The eclipse readings provide a one-equation check on F_thermal, which constrains the drift in the thermal absorptivity. This in-flight calibration strategy became standard for every subsequent Earth radiation budget instrument. The mathematics of the two-equation system remains simple. The engineering of keeping the coefficients stable -- or at least trackable -- is where the decades of improvement went.

---

## Deposit 3: Solid Angle and Hemispheric Integration (Layer 4, Section 4.10)

### Formulas

**The Bolometer Sees a Hemisphere:**

A flat-plate bolometer on a satellite does not see a point source. It sees an entire hemisphere of space -- the hemisphere on the side of the plate facing outward. The radiation arriving at the plate comes from all directions within that hemisphere, and the plate's response to off-axis radiation is reduced by the cosine of the angle from the plate normal. This is Lambert's cosine law.

```
SOLID ANGLE INTEGRATION:

The power absorbed by a flat plate from an extended source:

  P = A * integral over hemisphere of
      L(theta, phi) * cos(theta) * sin(theta) * d(theta) * d(phi)

  where:
    A = plate area
    L(theta, phi) = radiance from direction (theta, phi)
    theta = polar angle from plate normal (0 = straight ahead)
    phi = azimuthal angle (0 to 2*pi)
    cos(theta) = Lambert's law (reduced sensitivity off-axis)
    sin(theta) * d(theta) * d(phi) = solid angle element

  For a uniform radiation field (L = constant everywhere):

  P = A * L * integral_0^{2*pi} d(phi) * integral_0^{pi/2}
      cos(theta) * sin(theta) * d(theta)

    = A * L * 2*pi * integral_0^{pi/2} cos(theta) * sin(theta) d(theta)

    = A * L * 2*pi * [sin^2(theta)/2]_0^{pi/2}

    = A * L * 2*pi * 1/2

    = A * L * pi

  So: P = pi * A * L

  The factor of pi converts radiance (W/m^2/sr) to irradiance
  (W/m^2) for a flat plate viewing a uniform hemisphere.

WHY THIS MATTERS FOR EXPLORER 7:

  Suomi's bolometers were flat plates. They saw Earth as an
  extended source filling most of the hemisphere below the
  satellite. The radiation from directly below (theta = 0)
  contributed fully. The radiation from the limb (theta ~ 70-80
  degrees as seen from 573 km altitude) was attenuated by
  cos(theta).

  This means the bolometer overweights the radiation from
  directly below and underweights the radiation from the
  limbs. The measurement is a cosine-weighted average of
  the scene below, not a simple average.

  For a planet with uniform radiation, this does not matter --
  the pi factor accounts for the geometry exactly. But Earth
  is NOT uniform: clouds reflect more solar radiation (higher
  albedo) than clear ocean (lower albedo), and the tropics
  emit more thermal radiation than the poles. The cosine
  weighting means the bolometer's reading depends on WHAT is
  directly below the satellite at each moment.

  Suomi handled this by accumulating data over many orbits.
  Explorer 7's 50.3-degree inclination carried it over
  latitudes from 50 N to 50 S, and the orbit precessed
  slowly, eventually sampling all local times. After weeks
  of data accumulation, the cosine-weighted average converged
  to a reasonable estimate of the hemispheric mean.

  The mathematics of the solid angle integral is exact.
  The sampling problem -- how many orbits and how much time
  must pass before the satellite has seen enough of the
  planet to compute a global average -- is statistical.
  Suomi needed both: the integral to interpret each
  measurement, and the statistics to combine measurements
  into a global budget.
```

```python
import numpy as np

print("SOLID ANGLE INTEGRATION: FLAT-PLATE BOLOMETER")
print("=" * 55)

# Demonstrate Lambert's law numerically
print(f"\nCosine-weighted sensitivity of a flat plate:")
print(f"\n{'Angle (deg)':>12} | {'cos(theta)':>11} | {'Relative contribution':>22}")
print(f"{'-'*50}")

for angle_deg in [0, 10, 20, 30, 40, 50, 60, 70, 80, 89]:
    theta = np.radians(angle_deg)
    cos_theta = np.cos(theta)
    # Contribution to total irradiance from an annular ring at this angle
    # is proportional to cos(theta) * sin(theta) * d(theta)
    contrib = cos_theta * np.sin(theta)
    print(f"{angle_deg:>12} | {cos_theta:>11.4f} | {contrib:>22.4f}")

print(f"\n  At theta=0 (directly below): full contribution")
print(f"  At theta=60: cos(60) = 0.50, half contribution")
print(f"  At theta=80: cos(80) = 0.17, barely contributes")
print(f"\n  The bolometer 'sees' mostly what is directly below it.")
print(f"  Earth's limb contributes very little to the measurement.")
print(f"  This is geometry, not a limitation of the instrument --")
print(f"  a flat plate MUST respond this way. Suomi designed the")
print(f"  measurement to work with this geometry, not against it.")

# Numerical integration verification
N = 1000
theta_arr = np.linspace(0, np.pi/2, N)
dtheta = theta_arr[1] - theta_arr[0]
integral = np.sum(np.cos(theta_arr) * np.sin(theta_arr) * dtheta)
integral *= 2 * np.pi  # azimuthal integration

print(f"\n{'='*55}")
print(f"NUMERICAL VERIFICATION:")
print(f"  Integral of cos(theta)*sin(theta) over hemisphere")
print(f"  times 2*pi = {integral:.6f}")
print(f"  Analytical answer: pi = {np.pi:.6f}")
print(f"  Agreement: {abs(integral - np.pi)/np.pi * 100:.4f}%")
```

---

*"Verner Suomi grew up on a farm in Eveleth, Minnesota, the son of Finnish immigrants who worked the iron mines of the Mesabi Range. He built crystal radio sets as a boy, studied education at Winona State Teachers College, taught high school physics and math in small Minnesota towns during the Depression, then completed his PhD in meteorology at the University of Chicago in 1953 at the age of 37 -- late by academic standards, old enough to know what mattered. What mattered to Suomi was the atmosphere as a physical system: energy in, energy out, the balance between them determining the weather and the climate. He had taught high school students the Stefan-Boltzmann law and the inverse-square law. He knew the equations. What he lacked was the data -- no one had measured both sides of Earth's energy budget from a vantage point where the entire planet could be observed. When the International Geophysical Year satellite program opened the opportunity, Suomi designed the simplest possible instrument: two flat plates with different paint. Black absorbs everything. White reflects the short wavelengths, absorbs the long ones. Two thermistors, two equations, two unknowns. The mathematics is high school algebra. The physics is the Stefan-Boltzmann law. The insight -- that you can separate two radiation fields by measuring with two different spectral responses -- is the fundamental technique of remote sensing, and Suomi invented it for Explorer 7 in a laboratory at the University of Wisconsin with budget that would not cover a modern graduate student's tuition. Rudolf Virchow, born on October 13, 1821, the date Explorer 7 launched 138 years later, understood balance at a different scale: the balance of the human body in health and disease, the balance of public health against political neglect. Virchow said that medicine is a social science, and politics is nothing but medicine on a large scale. Suomi might have said the same about meteorology: the atmosphere is a physical system, and climate policy is nothing but atmospheric physics on a political scale. Both men measured imbalances -- Virchow in cells and populations, Suomi in watts and kelvins -- and both understood that the measurement itself is an act with consequences. To know the imbalance is to know that action is required. Explorer 7, a 41.5 kg satellite carrying painted metal plates and thermistors, delivered the first measurement of a planetary imbalance that the next century would spend trying to correct."*
