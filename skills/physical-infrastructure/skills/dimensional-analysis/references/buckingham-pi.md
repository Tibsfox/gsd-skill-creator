# Buckingham Pi Theorem -- Deep Reference

*Dimensional Analysis Skill -- Theorem derivation, dimensional matrix method, five worked examples*

---

## Theorem Statement and Proof Sketch

**Vaschy-Buckingham Theorem (1914):** If a physically complete equation relates n dimensional variables, and those variables involve k independent fundamental dimensions, then the equation can be rewritten as a relationship among (n - k) independent dimensionless groups (pi groups).

**Proof concept:** Construct the dimensional matrix D with n columns (variables) and k rows (base dimensions). Each entry D[i][j] is the exponent of dimension i in variable j. The rank of D equals k (the number of independent dimensions). The null space of D has dimension (n - k). Each vector in the null space defines a dimensionless product of the original variables -- a pi group.

**Physical implication:** The universe is dimensionally self-consistent. Any true physical law must be invariant under changes of unit system. Dimensional analysis exploits this invariance to reduce the number of independent variables in a problem. This is not an approximation -- it is exact.

**Historical note:** Edgar Buckingham published the theorem in 1914 (Physical Review, Vol. 4, No. 4, pp. 345-376), but the result was independently discovered by Aime Vaschy in 1892. The matrix formalization came later with Bridgman (1922) and Langhaar (1951).

---

## Dimensional Matrix Method

The systematic approach using matrix algebra, avoiding the informal "choose repeating variables" approach.

### Step-by-Step Procedure

**Step 1:** List all n variables. Write each variable as a column vector of base unit exponents.

**Step 2:** Construct the dimensional matrix D (k rows x n columns).

**Step 3:** Compute the rank r of D. Usually r = k, but if some dimensions are not independent in the specific problem, r < k.

**Step 4:** Select r linearly independent columns as repeating variables. The remaining (n - r) variables form the pi groups.

**Step 5:** For each non-repeating variable, find exponents a, b, c, ... such that the product (non-repeating variable) * (repeating_1)^a * (repeating_2)^b * ... is dimensionless. This gives one pi group.

### Formalized Reynolds Number Derivation

Variables: delta_P, rho, v, D, mu, L

Dimensional matrix (rows = {M, L, T}; columns = variables):

```
           dP    rho    v     D     mu    L
    M  [   1      1     0     0     1     0  ]
    L  [  -1     -3     1     1    -1     1  ]
    T  [  -2      0    -1     0    -1     0  ]
```

Rank = 3 (full row rank).

Repeating variables: rho (col 2), v (col 3), D (col 4) -- these span all three dimensions.

For delta_P (col 1): find a, b, c such that dP * rho^a * v^b * D^c is dimensionless:
- M: 1 + a = 0 --> a = -1
- L: -1 - 3a + b + c = 0 --> -1 + 3 + b + c = 0 --> b + c = -2
- T: -2 - b = 0 --> b = -2 --> c = 0

pi_1 = dP / (rho * v^2) -- the Euler number (pressure coefficient)

For mu (col 5): find a, b, c such that mu * rho^a * v^b * D^c is dimensionless:
- M: 1 + a = 0 --> a = -1
- L: -1 - 3a + b + c = 0 --> -1 + 3 + b + c = 0 --> b + c = -2
- T: -1 - b = 0 --> b = -1 --> c = -1

pi_2 = mu / (rho * v * D) = 1 / Re -- inverse Reynolds number (conventionally inverted)

For L (col 6): find a, b, c such that L * rho^a * v^b * D^c is dimensionless:
- M: a = 0
- L: 1 - 3(0) + b + c = 0 --> b + c = -1
- T: -b = 0 --> b = 0 --> c = -1

pi_3 = L / D -- length-to-diameter ratio

**Result:** pi_1 = f(pi_2, pi_3) --> Euler = f(Re, L/D)

This is the Darcy-Weisbach structure: dP = f(Re) * (L/D) * (rho * v^2 / 2)

---

## Worked Example 1: Natural Convection

**Problem:** What dimensionless groups govern natural convection from a heated vertical surface?

**Variables (n = 7):**

| Variable | Symbol | Dimensions {M, L, T, Theta} |
|----------|--------|------------------------------|
| Heat transfer coefficient | h | M^1 * T^-3 * Theta^-1 |
| Characteristic length | L | L^1 |
| Temperature difference | dT | Theta^1 |
| Gravitational acceleration | g | L^1 * T^-2 |
| Thermal expansion coefficient | beta | Theta^-1 |
| Kinematic viscosity | nu | L^2 * T^-1 |
| Thermal diffusivity | alpha | L^2 * T^-1 |

k = 4 independent dimensions {M, L, T, Theta}

**Repeating variables:** h, L, nu, dT (span all four dimensions)

**n - k = 3 dimensionless groups:**

| Group | Result | Standard Name |
|-------|--------|---------------|
| pi_1 | h * L / k_thermal | Nusselt number (Nu) |
| pi_2 | g * beta * dT * L^3 / nu^2 | Grashof number (Gr) |
| pi_3 | nu / alpha | Prandtl number (Pr) |

Note: k_thermal (thermal conductivity) enters through the relationship h = Nu * k / L.

**Physical law:** Nu = f(Gr, Pr)

Standard correlations: Nu = C * (Gr * Pr)^n where C and n depend on geometry and flow regime. For vertical plates: Nu = 0.59 * (Gr * Pr)^0.25 for laminar (10^4 < Gr*Pr < 10^9).

**Infrastructure application:** Natural convection cooling of electrical panels, UPS units, and unventilated cable trays. Determines whether passive cooling is sufficient or forced ventilation is required.

---

## Worked Example 2: Pump Power

**Problem:** What dimensionless groups govern centrifugal pump performance?

**Variables (n = 6):**

| Variable | Symbol | Dimensions {M, L, T} |
|----------|--------|-----------------------|
| Shaft power | P | M^1 * L^2 * T^-3 |
| Fluid density | rho | M^1 * L^-3 |
| Rotational speed | N | T^-1 |
| Impeller diameter | D | L^1 |
| Volume flow rate | Q | L^3 * T^-1 |
| Dynamic viscosity | mu | M^1 * L^-1 * T^-1 |

k = 3 independent dimensions

**Repeating variables:** rho, N, D

**n - k = 3 dimensionless groups:**

| Group | Combination | Standard Name |
|-------|-------------|---------------|
| pi_1 | P / (rho * N^3 * D^5) | Power coefficient (Cp) |
| pi_2 | Q / (N * D^3) | Flow coefficient (Cq or phi) |
| pi_3 | rho * N * D^2 / mu | Pump Reynolds number |

**Physical law:** Cp = f(Cq, Re_pump)

**Infrastructure application:** These are the pump affinity laws. For geometrically similar pumps at high Re (turbulent flow, Re_pump > 10^5), the Re dependence drops out:
- Q ~ N * D^3 (flow scales with speed and cube of diameter)
- H ~ N^2 * D^2 (head scales with speed squared)
- P ~ N^3 * D^5 (power scales with speed cubed)

These laws allow scaling from test data to field conditions: if pump speed changes from N1 to N2, flow changes by N2/N1, head by (N2/N1)^2, power by (N2/N1)^3.

---

## Worked Example 3: Heat Exchanger Size

**Problem:** What governs the size of a heat exchanger?

**Variables (n = 4):**

| Variable | Symbol | Dimensions {M, L, T, Theta} |
|----------|--------|------------------------------|
| Heat transferred | Q_dot | M^1 * L^2 * T^-3 |
| Overall HT coefficient | U | M^1 * T^-3 * Theta^-1 |
| Surface area | A | L^2 |
| Log-mean temp difference | dT_lm | Theta^1 |

k = 4, but rank of dimensional matrix = 3 (M, L, T, Theta -- but Q_dot/(U*A*dT_lm) reveals only 3 independent dimensions in this set).

**n - k_effective = 1 dimensionless group:**

pi_1 = Q_dot / (U * A * dT_lm) = constant = 1

**Physical law:** Q_dot = U * A * dT_lm

This IS the LMTD equation -- dimensional analysis recovers it exactly, showing there is only one possible functional relationship among these four variables. No empirical correlation is needed; the equation is determined by dimensions alone (up to a numerical constant, which in this case is exactly 1).

**Infrastructure application:** For heat exchanger sizing, once U is determined from materials and flow conditions (via Nu correlations), the required surface area A = Q_dot / (U * dT_lm). The only design freedom is geometry: how to pack that area into the available space (shell-and-tube, plate, air-cooled).

---

## Worked Example 4: Pressure Drop in Packed Beds

**Problem:** What governs pressure drop through a packed bed (such as a media filter, gravel drain field, or packed tower)?

**Variables (n = 7):**

| Variable | Symbol | Dimensions {M, L, T} | Notes |
|----------|--------|-----------------------|-------|
| Pressure gradient | dP/L | M^1 * L^-2 * T^-2 | Dependent variable |
| Particle diameter | d_p | L^1 | |
| Void fraction | epsilon | dimensionless | Already a pi group |
| Dynamic viscosity | mu | M^1 * L^-1 * T^-1 | |
| Fluid density | rho | M^1 * L^-3 | |
| Superficial velocity | v_s | L^1 * T^-1 | Flow rate / total area |
| Bed height | L_bed | L^1 | (contained in dP/L) |

k = 3 independent dimensions

**Handling the dimensionless variable:** epsilon (void fraction) is already dimensionless. It enters as its own pi group or as a parameter in the functional relationship. We work with the remaining 6 dimensional variables: n_eff = 6, n_eff - k = 3 groups.

**Repeating variables:** rho, v_s, d_p

**Dimensionless groups:**

| Group | Result | Interpretation |
|-------|--------|----------------|
| pi_1 | (dP/L) * d_p / (rho * v_s^2) | Modified friction factor |
| pi_2 | rho * v_s * d_p / mu | Particle Reynolds number |
| pi_3 | epsilon | Void fraction (already dimensionless) |

**Physical law:** pi_1 = f(pi_2, epsilon)

This is the Ergun equation structure: dP/L = (150 * mu * v_s / d_p^2) * ((1-epsilon)^2 / epsilon^3) + (1.75 * rho * v_s^2 / d_p) * ((1-epsilon) / epsilon^3)

The first term dominates at low Re (viscous/Blake-Kozeny), the second at high Re (inertial/Burke-Plummer). Dimensional analysis reveals the two-regime structure.

**Infrastructure application:** Sizing of cooling tower fill, media filters in water treatment, and gravel drainage fields. The void fraction epsilon is a design parameter controlled by packing selection.

---

## Worked Example 5: Vibration of Pipes

**Problem:** What governs the natural frequency of a piping span?

**Variables (n = 6):**

| Variable | Symbol | Dimensions {M, L, T} |
|----------|--------|-----------------------|
| Natural frequency | f | T^-1 |
| Pipe length (span) | L | L^1 |
| Pipe outer diameter | D | L^1 |
| Wall thickness | t | L^1 |
| Material density | rho_m | M^1 * L^-3 |
| Young's modulus | E | M^1 * L^-1 * T^-2 |

k = 3 independent dimensions

**Repeating variables:** L, rho_m, E

**n - k = 3 dimensionless groups:**

| Group | Result | Physical Meaning |
|-------|--------|------------------|
| pi_1 | f * L * sqrt(rho_m / E) | Frequency parameter (Strouhal-like) |
| pi_2 | D / L | Diameter-to-length ratio |
| pi_3 | t / D | Wall thickness ratio |

**Physical law:** pi_1 = f(D/L, t/D)

For a circular hollow beam, beam theory gives: f = C_n * sqrt(E * I / (rho_m * A * L^4)) where I is the moment of inertia and A is the cross-section area. Both I and A are functions of D and t, confirming the pi analysis.

**Infrastructure application:** Piping vibration is a critical concern in data centers (pump-induced pulsation), industrial plants (flow-induced vibration from vortex shedding at Strouhal number St = f*D/v ~ 0.2), and HVAC systems (duct resonance). If the natural frequency matches pump rotational frequency or vortex shedding frequency, resonance causes fatigue failure.

**Design check:** Calculate f_natural from pi groups, compare to pump frequency f_pump = RPM/60 and vortex shedding f_vortex = 0.2 * v / D. If f_natural is within 20% of either excitation frequency, add supports to shorten span L and increase f_natural.

---

## Scaling Application

The most powerful use of dimensional analysis is **similitude** -- the principle that physical systems with identical dimensionless groups exhibit identical behavior regardless of scale.

### Scaling Protocol

1. Identify the governing pi groups for the problem (use examples above)
2. Match all pi groups between model and prototype
3. Conduct experiments on the model
4. Scale results to prototype using pi group relationships

### Example: CDU Manifold Model Test

**Goal:** Predict pressure distribution in a full-size CDU manifold (2" NPS headers, 24 ports) using a 1/10 scale model.

**Matching Reynolds number:**
- Prototype: Re_p = rho * v_p * D_p / mu
- Model: Re_m = rho * v_m * D_m / mu

For same fluid (water) at same temperature (same rho and mu):
- D_m = D_p / 10
- v_m = v_p * (D_p / D_m) = 10 * v_p

The model must run at 10x the prototype velocity to match Re. If prototype velocity is 2.4 m/s, model velocity is 24 m/s.

**Scaling results back:**
- Pressure coefficient is the same: dP_p / (rho * v_p^2) = dP_m / (rho * v_m^2)
- Therefore: dP_p = dP_m * (v_p / v_m)^2 = dP_m / 100

If the model measures dP_m = 50 kPa, the prototype will see dP_p = 0.5 kPa.

**Limitations:** Matching Re may require impractically high velocities (as above). In practice, ensure Re is in the same flow regime (both turbulent, Re > 10,000) for approximate similarity. Many engineering correlations are Re-insensitive above a threshold.

### Cost Saving

Full-scale testing of infrastructure systems is expensive ($100K-$1M+). Scale models with matched dimensionless groups cost 1-10% as much and provide equivalent engineering data. Dimensional analysis makes this substitution rigorous, not approximate.

---

*Buckingham Pi Theorem Deep Reference v1.0.0 -- Physical Infrastructure Engineering Pack*
*Sources: Buckingham (1914), Bridgman "Dimensional Analysis" (1922), Langhaar "Dimensional Analysis and Theory of Models" (1951), Munson et al. "Fundamentals of Fluid Mechanics" (8th ed.)*
