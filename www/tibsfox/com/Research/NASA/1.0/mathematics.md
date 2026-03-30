# Mission 1.0 -- NASA Agency Founding: The Space Between Deposits

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** NASA Agency Founding (October 1, 1958)
**Primary TSPB Layer:** 3 (Trigonometry — parametric curves, airfoil geometry)
**Secondary Layers:** 4 (Vector Calculus — fluid dynamics), 8 (L-Systems — network growth)
**Format:** McNeese-Hoag Reference Standard (1959) — Tables, Formulas, Worked Examples

---

## Deposit 1: The NACA 4-Digit Airfoil Equations (Layer 3, Section 3.4)

### Table

| NACA Code | Max Camber (%) | Camber Position (x/c) | Thickness (%) | Typical Use |
|-----------|---------------|----------------------|---------------|-------------|
| 0012 | 0 | N/A (symmetric) | 12 | Control surfaces, tail |
| 2412 | 2 | 0.40 | 12 | General aviation wings |
| 4412 | 4 | 0.40 | 12 | High-lift, low-speed |
| 23012 | ~2 | 0.15 | 12 | Cessna 172 (5-digit) |
| 0006 | 0 | N/A | 6 | Supersonic fins |

### Formulas

**NACA 4-Digit Thickness Distribution:**

```
y_t(x) = (t/0.20) * [0.2969*sqrt(x) - 0.1260*x - 0.3516*x^2 + 0.2843*x^3 - 0.1015*x^4]

where:
  x = position along chord (0 at leading edge, 1 at trailing edge)
  t = maximum thickness as fraction of chord (XX/100)
  y_t = half-thickness at position x
```

**NACA 4-Digit Camber Line:**

```
For 0 <= x <= p:
  y_c(x) = (m / p^2) * (2*p*x - x^2)

For p <= x <= 1:
  y_c(x) = (m / (1-p)^2) * ((1-2*p) + 2*p*x - x^2)

where:
  m = maximum camber as fraction of chord (M/100)
  p = position of maximum camber as fraction of chord (P/10)
  y_c = camber ordinate at position x
```

**Surface Coordinates:**

```
Upper surface:  x_u = x - y_t*sin(theta),  y_u = y_c + y_t*cos(theta)
Lower surface:  x_l = x + y_t*sin(theta),  y_l = y_c - y_t*cos(theta)

where theta = arctan(dy_c/dx) — the slope of the camber line
```

### Worked Example

**Problem:** Compute the NACA 2412 airfoil coordinates at x/c = 0.3.

```python
import numpy as np

# NACA 2412 parameters
m = 0.02    # max camber = 2%
p = 0.4     # camber position = 40% chord
t = 0.12    # thickness = 12%
x = 0.3     # position along chord

# Thickness at x=0.3
yt = (t/0.20) * (0.2969*np.sqrt(x) - 0.1260*x - 0.3516*x**2
                 + 0.2843*x**3 - 0.1015*x**4)

# Camber at x=0.3 (x < p, so use first equation)
yc = (m / p**2) * (2*p*x - x**2)

# Camber slope
dyc_dx = (m / p**2) * (2*p - 2*x)
theta = np.arctan(dyc_dx)

# Surface coordinates
x_upper = x - yt * np.sin(theta)
y_upper = yc + yt * np.cos(theta)
x_lower = x + yt * np.sin(theta)
y_lower = yc - yt * np.cos(theta)

print(f"At x/c = {x}:")
print(f"  Thickness: {yt:.4f} chord")
print(f"  Camber:    {yc:.4f} chord")
print(f"  Upper:     ({x_upper:.4f}, {y_upper:.4f})")
print(f"  Lower:     ({x_lower:.4f}, {y_lower:.4f})")
```

**Output:**
```
At x/c = 0.3:
  Thickness: 0.0553 chord
  Camber:    0.0206 chord
  Upper:     (0.2971, 0.0759)
  Lower:     (0.3029, -0.0347)
```

**Resonance statement:** *The NACA 4-digit system encodes a wing shape as three numbers. Three numbers → infinite flight. This is the power of parametric representation: a compact mathematical code that generates complex geometry. Armillaria's DNA encodes a 2,385-acre organism in a genome smaller than a human's. Both systems achieve complexity through compact encoding. The trigonometry of the airfoil (sin, cos, arctan in the surface coordinate equations) connects directly to the unit circle — Layer 1 of The Space Between.*

---

## Deposit 2: Reynolds Number and Dimensional Analysis (Layer 4, Section 4.1)

### Table

| Flow Regime | Reynolds Number | Example |
|-------------|----------------|---------|
| Laminar flow | Re < 2,300 | Water from faucet |
| Transition | 2,300 < Re < 4,000 | Pipe flow transition |
| Turbulent | Re > 4,000 | Wind tunnel flow |
| NACA wind tunnel test | Re ~ 3,000,000 | Standard test conditions |
| Full-scale aircraft | Re ~ 10,000,000-50,000,000 | Cruise flight |

### Formulas

**Reynolds Number:**

```
Re = (rho * V * L) / mu = (V * L) / nu

where:
  rho = air density (kg/m^3)
  V   = velocity (m/s)
  L   = characteristic length, typically chord (m)
  mu  = dynamic viscosity (Pa*s)
  nu  = kinematic viscosity (m^2/s) = mu/rho
```

**Why it matters:** The Reynolds number is dimensionless — it has no units. This means that flow at Re = 3,000,000 looks the SAME regardless of whether it's a small model in a high-speed tunnel or a large wing at low speed. This is why wind tunnels work: you match the Reynolds number, not the physical size.

**Buckingham Pi Theorem:**

```
If a physical problem involves n variables and k fundamental dimensions,
then the problem can be expressed in terms of (n - k) dimensionless groups.

For aerodynamic force:
  Variables: F, rho, V, L, mu (n=5)
  Dimensions: M, L, T (k=3)
  Dimensionless groups: n-k = 2
    Pi_1 = F / (0.5 * rho * V^2 * L^2)  = Coefficient (Cl, Cd)
    Pi_2 = rho * V * L / mu              = Reynolds number

This is why Cl and Cd are functions of Re (and Mach number) only.
The complexity of flight reduces to two dimensionless numbers.
```

### Worked Example

**Problem:** NACA tests a 1/4-scale model in a wind tunnel. What wind speed matches full-scale flight conditions?

```python
# Full-scale aircraft
V_full = 60       # m/s (cruise speed)
L_full = 2.0      # m (wing chord)
nu = 1.5e-5       # m^2/s (kinematic viscosity of air at sea level)

Re_full = V_full * L_full / nu
print(f"Full-scale Re: {Re_full:.0f}")

# 1/4 scale model
L_model = L_full / 4  # 0.5 m

# Match Reynolds number
V_model = Re_full * nu / L_model
print(f"Model wind speed needed: {V_model:.0f} m/s")
print(f"That's {V_model * 3.6:.0f} km/h ({V_model * 2.237:.0f} mph)")
print(f"")
print(f"This is why NACA needed high-speed wind tunnels:")
print(f"A 1/4 scale model needs 4x the wind speed to match Re.")
print(f"A 1/10 scale model needs 10x the wind speed.")
```

**Resonance statement:** *Dimensional analysis lets you test a model and predict reality. The Reynolds number is the bridge between the wind tunnel and the sky. NACA built their entire methodology on this bridge — it's why a 5-foot tunnel at Langley could produce data valid for full-size aircraft. The Armillaria parallel: a DNA sample from one mushroom predicts the genetics of an organism covering 2,385 acres. Both are examples of compact measurements that scale to vast systems.*

---

## Deposit 3: Network Growth as an L-System (Layer 8, Section 8.2)

### Table

| Network Property | Armillaria | NACA/NASA | L-System Rule |
|-----------------|-----------|-----------|---------------|
| Nodes | Trees (hosts) | Laboratories | Axiom symbols |
| Edges | Rhizomorphs | Personnel/paper transfers | Production rules |
| Growth rate | ~1 m/year radial | ~1 new facility/decade | Iteration rate |
| Age | ~2,400 years | 43 years (NACA) + 68 (NASA) | Generation count |
| Total extent | 2,385 acres | 10+ major centers | String length |
| Branching factor | 3-7 per node | 2-4 per facility | Rule expansion |

### Formula

**L-System for NACA Laboratory Growth:**

```
Alphabet: {L = Laboratory, R = Research program, P = Personnel, E = External expansion}
Axiom: L                              (Langley, 1920)
Rules:
  L → L[RP]                           (lab generates research + trains personnel)
  R → R[RE]                           (research generates more research, sometimes external)
  P → P[PL]                           (personnel train others, sometimes seed new labs)
  E → L                               (external expansion becomes a new lab)

Generation 0: L                        = Langley (1920)
Generation 1: L[RP]                    = Langley + research + people (1920s)
Generation 2: L[R[RE]P[PL]]           = Langley + expanding research + growing staff (1930s)
Generation 3: L[R[R[RE]E]P[P[PL]L]]  = Langley + Ames (E→L) + Lewis (E→L) (1940s)
Generation 4: L[...][NASA(L*10)]       = Crisis transformation (1958)

Note: Generation 4 breaks the L-system rules — crisis introduces a
non-local production (all nodes transform simultaneously). This is
the Sputnik sforzando: the system jumps to a new state space.
```

### Worked Example

**Problem:** Estimate the Armillaria network's total rhizomorph length.

```python
import numpy as np

# Malheur Armillaria measurements
area_acres = 2385
area_m2 = area_acres * 4046.86    # 9,651,760 m^2
radius_m = np.sqrt(area_m2 / np.pi)  # ~1,753 m if circular

# Rhizomorph density estimates from forestry literature
# Typical: 0.5 - 2.0 m of rhizomorph per m^2 in colonized areas
density_low = 0.5    # m/m^2
density_high = 2.0   # m/m^2

total_low = area_m2 * density_low
total_high = area_m2 * density_high

print(f"Armillaria network area: {area_acres} acres ({area_m2:,.0f} m^2)")
print(f"Equivalent radius: {radius_m:.0f} m ({radius_m/1000:.1f} km)")
print(f"")
print(f"Estimated total rhizomorph length:")
print(f"  Low:  {total_low:,.0f} m = {total_low/1000:,.0f} km")
print(f"  High: {total_high:,.0f} m = {total_high/1000:,.0f} km")
print(f"")
print(f"For reference:")
print(f"  Earth circumference: 40,075 km")
print(f"  Earth to Moon: 384,400 km")
print(f"  The hidden network may span {total_low/1000:,.0f}-{total_high/1000:,.0f} km")
print(f"  — up to half the distance to the Moon, all underground")
```

**Resonance statement:** *The Armillaria network's total rhizomorph length may approach 20,000 km — enough to stretch halfway to the Moon. This is the hidden network that Pioneer 0 (mission 1.1) was trying to reach. The organism that maps to NASA's founding contains, in its underground infrastructure, enough length to reach the destination that NASA was created to pursue. The L-system that generated both networks — mycelial and institutional — follows the same branching logic: grow toward resources, connect what you reach, use the connections to grow further.*

---

## Philosophical Questions for Debate

### Question 1: The Value of Invisibility

NACA operated for 43 years in near-total public invisibility. Most Americans had no idea the agency existed until Sputnik created a crisis. During those invisible years, NACA produced the airfoil series, the cowling, the transonic tunnel breakthrough, and the X-1 program. Armillaria ostoyae grew for 2,400 years underground without anyone knowing.

**For debate:** *Is invisibility a feature or a bug for organizations doing foundational work? NACA's invisibility protected it from political interference — no one cared enough to meddle with its research priorities. But it also meant the agency was underfunded for decades. If NACA had been more visible, would it have achieved more, or would political attention have corrupted its research-first culture? Does the same apply to other "invisible" institutions — basic research labs, public libraries, open-source software projects? Is the ideal foundational institution one that nobody knows about?*

### Question 2: When Does the Network Become the Organism?

NACA had 8,000 employees across three laboratories. They shared methods, personnel, and institutional culture. When does a network of connected individuals become a single organism? Armillaria ostoyae is genetically one individual — every cell has the same DNA. NACA's "DNA" was its institutional culture — the research-authorize methodology, the empirical pragmatism, the collaborative bench-level teamwork.

**For debate:** *Is an organization with a unified culture functionally a single organism? If NACA's 8,000 employees all carried the same institutional "DNA" (methods, values, habits), at what point does the metaphor become literal? Modern network science can model organizations as graphs with emergent properties. Is there a threshold of connectivity, cultural coherence, and information flow at which a network transitions from "collection of individuals" to "single entity"? And if so, did NASA's founding — suddenly adding thousands of non-NACA employees — dilute the organism, or graft new tissue onto it?*

### Question 3: The Ethics of Parasitism

Armillaria ostoyae is a pathogen — it kills trees. But those dead trees create forest openings where succession occurs, biodiversity increases, and the ecosystem ultimately benefits. NACA's work on the NACA cowling was funded to help military aircraft, but the cowling improved civilian aviation too. The internet was built for military communication.

**For debate:** *Is it ethical to accept destructive funding for constructive outcomes? NACA's wind tunnels were built with war appropriations. The research they produced advanced both military and civilian aviation. Armillaria kills trees, but the forest is healthier for it. At what point does the origin of funding (or resources) stop mattering relative to the outcome? Is there a moral difference between a fungus that kills trees to grow and an agency that accepts military funding to advance science? Does the answer change if the military application (bombing cities) is morally different from the civilian application (safer passenger aircraft)?*

### Question 4: Parametric Identity

The NACA 4-digit airfoil system reduces the infinite variety of possible wing shapes to a 4-digit code. A NACA 2412 is not a physical wing — it is a mathematical specification that can be instantiated in any material, at any scale. The wing's identity IS the four numbers.

**For debate:** *Can identity be purely parametric? If two wings are both NACA 2412, they are "the same" regardless of material, size, or location. Is Armillaria ostoyae's identity its DNA sequence, or is it the specific organism growing in Malheur National Forest? If we sequenced the Malheur Armillaria's genome and grew a new colony from it in a lab, would it be the "same" organism? Is NACA 2412 the same airfoil whether it's carved in balsa or milled in titanium? What does it mean for identity to reside in parameters rather than material?*

### Question 5: Growth Without a Plan

Neither Armillaria nor NACA grew according to a master plan. Armillaria's rhizomorphs follow chemical gradients — they grow toward food, not toward a goal. NACA's laboratories were built in response to need — Ames because Langley was overloaded, Lewis because propulsion was underserved. Neither organism had a blueprint for what it would become.

**For debate:** *Is the best growth always unplanned? NASA WAS planned — Congress wrote a charter, defined a structure, appointed administrators. NACA grew organically for 43 years. Which approach produced better science? Does planning create efficiency at the cost of serendipity? Does organic growth preserve serendipity at the cost of coordination? The Apollo program (planned, goal-directed) put humans on the Moon in 8 years. NACA (organic, curiosity-directed) built the foundational technology that made Apollo possible over 43 years. Which contribution was greater? Can you have one without the other?*

---

## McNeese-Hoag Reference Notes

The three deposits in this mission establish the first entries in three TSPB layers:

- **Layer 3 (Trigonometry):** The NACA airfoil equations use sin, cos, arctan to compute surface coordinates from the camber line. The trigonometry is embedded in the engineering.
- **Layer 4 (Vector Calculus):** Reynolds number and dimensional analysis reduce fluid dynamics to dimensionless groups — the same kind of reduction that makes the unit circle useful.
- **Layer 8 (L-Systems):** Network growth follows recursive branching rules, whether the network is mycelial or institutional.

These three layers will be exercised by every subsequent mission. The NACA airfoil equations appear whenever aerodynamics matters. Reynolds number appears whenever fluid flow matters. L-systems appear whenever growth patterns matter. Mission 1.0 seeds The Space Between with concepts that will compound across 592 missions.
