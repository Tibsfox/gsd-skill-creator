---
name: pie-dimensional-analysis
version: 1.0.0
description: "Mathematical verification for physical calculations: unit tracking algebra (exponent maps), PhysicalQuantity pattern for compound units, SI/Imperial mixed-unit handling, Buckingham pi theorem for dimensionless groups, and common engineering dimensionless numbers. Activates for unit verification, dimensional consistency checks, scaling analysis, and calculation validation across all infrastructure domains."
user-invocable: true
allowed-tools: Read Grep Glob Bash
metadata:
  extensions:
    gsd-skill-creator:
      version: 1
      createdAt: "2026-02-26"
      triggers:
        intents:
          - "unit conversion"
          - "unit tracking"
          - "dimensional analysis"
          - "dimensionless"
          - "Reynolds number"
          - "Nusselt number"
          - "Buckingham pi"
          - "scaling"
          - "unit check"
          - "SI"
          - "imperial"
          - "unit mismatch"
          - "physical quantity"
        contexts:
          - "calculation verification"
          - "infrastructure engineering"
          - "unit algebra"
          - "dimensional homogeneity"
applies_to:
  - skills/physical-infrastructure/**
  - lib/units.ts
---

# Dimensional Analysis Skill

## At a Glance

Dimensional analysis is the mathematical verification layer that ensures physical calculations are dimensionally consistent -- catching unit errors before they become calculation errors.

**When to activate:**
- Verify multi-step calculations for unit consistency
- Mix SI and Imperial units in the same calculation
- Scale experimental data to new conditions via dimensionless groups
- Identify governing parameters of a physical system
- Validate Calculator agent outputs before committing to CalculationRecord

**Key capabilities:**
- Unit tracking via exponent maps (PhysicalQuantity pattern)
- Compound unit algebra: multiply, divide, power, dimensional homogeneity
- Dimensional mismatch detection at every arithmetic step
- SI to Imperial conversion for all infrastructure engineering domains
- Buckingham pi theorem for deriving dimensionless groups
- Infrastructure dimensionless numbers: Reynolds, Nusselt, Prandtl, Grashof, Froude, Strouhal

**Integration:** Cross-cutting skill -- applies to outputs from fluid-systems, power-systems, and thermal-engineering. Acts as verification layer before Calculator agent commits to CalculationRecord.

> **NOTE:** Dimensional analysis verifies mathematical self-consistency only. It does not replace engineering judgment or safety verification. Dimensionally correct equations can still be physically wrong if incorrect constants or assumptions are used.

**Quick routing:**
- Unit conversions only --> @references/unit-algebra.md for full tables
- Pi theorem derivation --> @references/buckingham-pi.md for worked examples
- Tolerance stack-up --> see Tolerance Stack-Up Analysis section below
- Spatial fit checking --> see Spatial Constraint Verification section below

---

## Unit Tracking Algebra

### The Seven SI Base Units

| Symbol | Quantity | Notes |
|--------|----------|-------|
| m | length | meter |
| kg | mass | kilogram (only SI base unit with a prefix) |
| s | time | second |
| A | electric current | ampere |
| K | temperature | kelvin (absolute; not degrees Celsius) |
| mol | amount of substance | mole |
| cd | luminous intensity | candela (rarely used in infrastructure) |

### Compound Units as Exponent Maps

Every physical quantity carries its unit as a map of base unit exponents. This representation makes unit algebra mechanical -- multiply means add exponents, divide means subtract.

Examples:
- Velocity: 2.4 m/s --> `{ value: 2.4, units: { m: 1, s: -1 } }`
- Pressure: 101325 Pa --> `{ value: 101325, units: { kg: 1, m: -1, s: -2 } }`
- Power: 1000 W --> `{ value: 1000, units: { kg: 1, m: 2, s: -3 } }`
- Thermal conductivity: 385 W/(m*K) --> `{ value: 385, units: { kg: 1, m: 1, s: -3, K: -1 } }`

### Common Infrastructure Units -- Exponent Map Reference

| Quantity | SI Unit | Symbol | Exponent Map |
|----------|---------|--------|-------------|
| Force | Newton | N | { kg:1, m:1, s:-2 } |
| Pressure | Pascal | Pa | { kg:1, m:-1, s:-2 } |
| Energy | Joule | J | { kg:1, m:2, s:-2 } |
| Power | Watt | W | { kg:1, m:2, s:-3 } |
| Dynamic viscosity | -- | Pa*s | { kg:1, m:-1, s:-1 } |
| Heat transfer coeff | -- | W/(m^2*K) | { kg:1, s:-3, K:-1 } |
| Thermal conductivity | -- | W/(m*K) | { kg:1, m:1, s:-3, K:-1 } |

### The PhysicalQuantity Interface

The Calculator agent implements unit-safe arithmetic using this TypeScript pattern. The SKILL documents the knowledge; `lib/units.ts` provides the implementation.

```typescript
interface PhysicalQuantity {
  value: number;
  units: { [baseUnit: string]: number }; // exponent map
}

function multiply(a: PhysicalQuantity, b: PhysicalQuantity): PhysicalQuantity {
  const result: PhysicalQuantity = { value: a.value * b.value, units: { ...a.units } };
  for (const [unit, exp] of Object.entries(b.units)) {
    result.units[unit] = (result.units[unit] || 0) + exp;
  }
  // Remove zero exponents
  for (const unit of Object.keys(result.units)) {
    if (result.units[unit] === 0) delete result.units[unit];
  }
  return result;
}

function divide(a: PhysicalQuantity, b: PhysicalQuantity): PhysicalQuantity {
  const negated = { value: 1 / b.value, units: Object.fromEntries(
    Object.entries(b.units).map(([k, v]) => [k, -v])
  )};
  return multiply(a, negated);
}

function assertSameUnits(a: PhysicalQuantity, b: PhysicalQuantity): void {
  const aKeys = Object.keys(a.units).sort().join(',');
  const bKeys = Object.keys(b.units).sort().join(',');
  if (aKeys !== bKeys || !Object.entries(a.units).every(([k, v]) => b.units[k] === v)) {
    throw new Error(`Unit mismatch: [${aKeys}] vs [${bKeys}] — cannot add/subtract`);
  }
}
```

### Unit Algebra Rules

| Operation | Exponent Rule | Example |
|-----------|---------------|---------|
| Multiply | Exponents ADD | (m/s) * (m/s) = m^2/s^2 |
| Divide | Exponents SUBTRACT | J / m^3 = Pa (energy density = pressure) |
| Power n | Exponents MULTIPLY by n | (m^2)^0.5 = m |
| Add/Subtract | Units must be IDENTICAL | m + m = m; m + s = ERROR |
| Dimensionless | All exponents = 0 | `units: {}` (empty map) |

The dimensional homogeneity rule is absolute: you cannot add quantities with different units. If `assertSameUnits()` throws, the calculation has a structural error that must be fixed before proceeding.

---

## Mixed Unit Systems

Infrastructure engineering inherently mixes SI and Imperial units. This is not optional -- it is driven by standards bodies, building codes, and equipment manufacturers.

**Common mixed-unit scenarios:**
- Pipe sizes: NPS in inches (ASME B36.10 standard)
- Flow rates: GPM (US practice) or L/s (SI practice)
- Pressure: PSI (US safety codes, ASME BPVC) or kPa (SI engineering)
- Temperature: degrees F (US weather/safety) or degrees C (SI engineering)
- Power: BTU/hr (US HVAC industry) or kW (SI)
- Conductors: AWG (US NEC) or mm^2 (EU/IEC)

### Strategy: Convert Immediately, Work in SI, Convert Output

1. **Receive** mixed-unit inputs (e.g., pipe diameter in inches, flow in GPM)
2. **Convert** ALL inputs to SI at the boundary -- `lib/units.ts` handles this
3. **Calculate** entirely in SI using PhysicalQuantity arithmetic
4. **Convert** final outputs to user-preferred units for display

This eliminates mixed-unit errors in the calculation core. Conversion errors are isolated to the boundary layer where they are easy to audit.

### Common Conversions -- Quick Reference

| From | To | Factor |
|------|----|--------|
| inches | meters | x 0.0254 |
| feet | meters | x 0.3048 |
| PSI | kPa | x 6.8948 |
| GPM | L/s | x 0.06309 |
| BTU/hr | W | x 0.29307 |
| degrees F | degrees C | (F - 32) / 1.8 |
| degrees C | K | + 273.15 |
| ft/s | m/s | x 0.3048 |
| lb/ft^3 | kg/m^3 | x 16.018 |

Full conversion table for all infrastructure engineering domains --> @references/unit-algebra.md

---

## Buckingham Pi Theorem

### The Theorem

For a physical equation relating **n** dimensional variables that involve **k** independent base dimensions, the equation can be rewritten using **(n - k)** independent dimensionless groups.

This means: if you have 6 variables and 3 base dimensions, you need only 3 dimensionless groups to describe the physics -- regardless of what unit system you use. The universe is dimensionally self-consistent.

### Procedure (5 Steps)

1. **List variables** -- identify every physical quantity that could influence the outcome. Include the dependent variable.
2. **Write dimensions** -- express each variable in base units (m, kg, s, A, K).
3. **Count k** -- number of independent base dimensions appearing. Usually 2-4 for engineering problems.
4. **Choose k repeating variables** -- variables that together span all k dimensions. Avoid the dependent variable. Common choices: (rho, v, L) for fluid flows; (k, L, h) for heat transfer.
5. **Form pi groups** -- multiply each remaining variable with the repeating variables raised to unknown powers; solve exponents so that the result is dimensionless.

### Worked Example: Pipe Flow Pressure Drop

**Variables:** delta_P (pressure drop), L (pipe length), D (pipe diameter), rho (fluid density), mu (dynamic viscosity), v (flow velocity)

n = 6 variables, k = 3 base dimensions {kg, m, s}

**Repeating variables:** rho, v, D (together they contain all three dimensions: rho has kg and m, v has m and s, D has m)

**Form n - k = 3 dimensionless groups:**

| Group | Combination | Result | Name |
|-------|-------------|--------|------|
| pi_1 | delta_P * D / (rho * v^2) | dimensionless | Euler number (pressure coefficient) |
| pi_2 | rho * v * D / mu | dimensionless | Reynolds number |
| pi_3 | L / D | dimensionless | Length ratio |

**Physical law recovered:** Euler = f(Re, L/D)

This is exactly the structure of the Darcy-Weisbach equation: delta_P = f * (L/D) * (rho * v^2 / 2). Dimensional analysis recovers the equation form without any physics -- only dimensional reasoning.

For full theorem derivation, dimensional matrix method, and five infrastructure worked examples --> @references/buckingham-pi.md

### Common Infrastructure Dimensionless Groups

| Group | Formula | Physical Meaning | Activation Threshold |
|-------|---------|-----------------|---------------------|
| Reynolds | Re = rho*v*L / mu | Inertia / viscous force | Re > 4000 = turbulent flow |
| Nusselt | Nu = h*L / k | Convection / conduction | Heat transfer coefficient |
| Prandtl | Pr = mu*Cp / k | Momentum / thermal diffusivity | Nu correlation parameter |
| Grashof | Gr = g*beta*dT*L^3 / nu^2 | Buoyancy / viscous force | Natural convection indicator |
| Froude | Fr = v / sqrt(g*L) | Inertia / gravity | Open channel flow regime |
| Strouhal | St = f*L / v | Vortex shedding frequency | Pipe vibration analysis |

**Why these matter for infrastructure:**
- **Re** determines whether pipe flow is laminar or turbulent -- which selects the friction factor equation (Moody chart vs 64/Re)
- **Nu** determines convective heat transfer coefficient -- drives heat exchanger sizing
- **Pr** groups fluid thermal properties -- used in every forced convection correlation
- Dimensional analysis reveals which parameters dominate -- enables experimental scale-up (same Re = same physics at any size)

---

## Calculation Verification Workflow

The Calculator agent applies this skill as a verification pass on all numerical outputs. Every multi-step calculation follows this protocol:

### Step 1: Convert Inputs
All inputs converted to SI via `lib/units.ts`. Record each as a PhysicalQuantity with explicit exponent map.

### Step 2: Track Through Calculation
Each arithmetic step propagates units via multiply/divide rules. Intermediate results carry their units.

### Step 3: Check Dimensional Homogeneity
At each addition or subtraction, verify units match via `assertSameUnits()`. If mismatch: stop, flag error, do not proceed.

### Step 4: Verify Result Units
Final result should have expected unit exponents:
- Pipe sizing result should have units `{ m: 1 }` (a length/diameter)
- Pressure drop should have units `{ kg: 1, m: -1, s: -2 }` (Pascal)
- Flow rate should have units `{ m: 3, s: -1 }` (cubic meters per second)

If result has wrong units, something was inverted or an exponent was applied incorrectly. Flag the error.

### Step 5: Check Reasonableness
Dimensionless numbers should be in expected ranges:
- Re < 2300: laminar (unusual for data center cooling loops -- flag if unexpected)
- Re > 4000: turbulent (normal for infrastructure piping)
- Nu > 100: high convective transfer (expected for turbulent water flow; flag if < 10)
- Pr ~ 7 for water at room temperature; flag if wildly different

### Worked Multi-Step Example: Pipe Sizing Verification

**Input:** Heat load Q = 40 kW, temperature difference dT = 10 K, max velocity v_max = 2.4 m/s

**Step 1 -- Flow rate:**
```
m_dot = Q / (rho * Cp * dT)
Units: W / (kg/m^3 * J/(kg*K) * K)
     = kg*m^2/s^3 / (kg/m^3 * kg*m^2/(s^2*kg*K) * K)
     = kg*m^2/s^3 / (m^3/s^2 * 1/m^3)
     ... simplifies to m^3/s  [PASS]
```

**Step 2 -- Minimum cross-sectional area:**
```
A_min = V_dot / v_max
Units: (m^3/s) / (m/s) = m^2  [PASS]
```

**Step 3 -- Minimum diameter:**
```
D_min = sqrt(4 * A_min / pi)
Units: sqrt(m^2) = m  [PASS]
```

**Step 4 -- Pressure drop (Darcy-Weisbach):**
```
dP = f * (L/D) * (rho * v^2 / 2)
Units: dimensionless * (m/m) * (kg/m^3 * m^2/s^2) = kg/(m*s^2) = Pa  [PASS]
```

Each step is dimensionally verified before proceeding. If any step produces wrong units, the error is caught before it propagates through the rest of the calculation chain.

---

## Reference Documents

| Reference | When to Read | Coverage |
|-----------|-------------|----------|
| @references/unit-algebra.md | Full SI/Imperial conversion tables, all infrastructure domains | Complete unit reference |
| @references/buckingham-pi.md | Full theorem derivation, dimensional matrix, five worked examples | Deep pi theorem guide |

---
*Dimensional Analysis Skill v1.0.0 -- Physical Infrastructure Engineering Pack*
*Phase 437-01 | References: BIPM SI Brochure (9th ed.), Buckingham (1914), Bridgman (1922)*
*Dimensional verification is a mathematical check -- not a substitute for engineering judgment.*
