# Unit Algebra -- Deep Reference

*Dimensional Analysis Skill -- Complete SI/Imperial conversion tables for infrastructure engineering*

---

## Complete SI Base Unit Definitions

The 2019 SI revision fixed all base units to exact physical constants:

| Unit | Symbol | Defining Constant | Value |
|------|--------|-------------------|-------|
| meter | m | speed of light c | 299,792,458 m/s (exact) |
| kilogram | kg | Planck constant h | 6.62607015 x 10^-34 J*s (exact) |
| second | s | Cs-133 hyperfine frequency | 9,192,631,770 Hz (exact) |
| ampere | A | elementary charge e | 1.602176634 x 10^-19 C (exact) |
| kelvin | K | Boltzmann constant k_B | 1.380649 x 10^-23 J/K (exact) |
| mole | mol | Avogadro constant N_A | 6.02214076 x 10^23 mol^-1 (exact) |
| candela | cd | luminous efficacy K_cd | 683 lm/W (exact) |

All derived units (Newton, Pascal, Watt, etc.) are defined through these seven base units. No other standards are needed.

---

## SI Prefixes Reference Table

| Prefix | Symbol | Factor | Common Use |
|--------|--------|--------|------------|
| yotta | Y | 10^24 | -- |
| zetta | Z | 10^21 | -- |
| exa | E | 10^18 | -- |
| peta | P | 10^15 | -- |
| tera | T | 10^12 | TW (global power scale) |
| giga | G | 10^9 | GW (power plant scale), GHz |
| mega | M | 10^6 | MW (data center power), MPa |
| kilo | k | 10^3 | kW, kPa, km |
| hecto | h | 10^2 | -- |
| deca | da | 10^1 | -- |
| -- | -- | 10^0 | base unit |
| deci | d | 10^-1 | -- |
| centi | c | 10^-2 | cm |
| milli | m | 10^-3 | mm, mA |
| micro | mu | 10^-6 | micrometer |
| nano | n | 10^-9 | nm (wavelength) |
| pico | p | 10^-12 | pF (capacitance) |
| femto | f | 10^-15 | -- |
| atto | a | 10^-18 | -- |
| zepto | z | 10^-21 | -- |
| yocto | y | 10^-24 | -- |

**Engineering prefixes** (highlighted): G, M, k, m, mu, n -- these are the prefixes used in 99% of infrastructure calculations.

**Note:** The kilogram is the only SI base unit that already contains a prefix (kilo-). When applying prefixes to mass, apply them to the gram: milligram (mg), microgram (ug), not millikilogram.

---

## Comprehensive Infrastructure Conversion Table

### Length

| From | To | Factor | Notes |
|------|----|--------|-------|
| inch (in) | meter (m) | x 0.0254 | Exact definition |
| foot (ft) | meter (m) | x 0.3048 | Exact (12 inches) |
| yard (yd) | meter (m) | x 0.9144 | Exact (3 feet) |
| mile | meter (m) | x 1609.344 | Exact (5280 feet) |
| mil | meter (m) | x 2.54 x 10^-5 | 1/1000 inch; wire coating thickness |

### Area

| From | To | Factor |
|------|----|--------|
| in^2 | m^2 | x 6.4516 x 10^-4 |
| ft^2 | m^2 | x 0.09290 |
| acre | m^2 | x 4046.86 |

### Volume

| From | To | Factor | Notes |
|------|----|--------|-------|
| US gallon | m^3 | x 3.78541 x 10^-3 | NOT Imperial gallon |
| US gallon | liter (L) | x 3.78541 | |
| ft^3 | m^3 | x 0.02832 | |
| in^3 | m^3 | x 1.6387 x 10^-5 | |
| barrel (petroleum) | m^3 | x 0.15899 | 42 US gallons |

### Flow Rate

| From | To | Factor | Notes |
|------|----|--------|-------|
| GPM (US gal/min) | m^3/s | x 6.309 x 10^-5 | Most common US unit |
| GPM | L/s | x 0.06309 | |
| CFM (ft^3/min) | m^3/s | x 4.719 x 10^-4 | Airflow |
| CFM | L/s | x 0.4719 | |

### Mass

| From | To | Factor |
|------|----|--------|
| pound (lb) | kg | x 0.45359 |
| US short ton (2000 lb) | kg | x 907.185 |
| metric tonne | kg | x 1000 |
| ounce (oz) | kg | x 0.02835 |

### Force

| From | To | Factor |
|------|----|--------|
| pound-force (lbf) | Newton (N) | x 4.44822 |
| kip (1000 lbf) | kN | x 4.44822 |

### Pressure

| From | To | Factor | Notes |
|------|----|--------|-------|
| PSI (lbf/in^2) | Pa | x 6894.76 | |
| PSI | kPa | x 6.8948 | Most common conversion |
| bar | kPa | x 100 | Exact |
| atmosphere (atm) | kPa | x 101.325 | Exact |
| inH2O (60 deg F) | Pa | x 249.09 | HVAC duct pressure |
| mmHg (torr) | Pa | x 133.322 | |
| ft H2O | kPa | x 2.9890 | Pump head |

### Temperature

| From | To | Formula | Notes |
|------|----|---------|-------|
| deg F | deg C | (F - 32) / 1.8 | Affine, not linear |
| deg C | deg F | C x 1.8 + 32 | |
| deg C | K | C + 273.15 | |
| deg F | K | (F - 32) / 1.8 + 273.15 | |

**Critical distinction:** Temperature *differences* (delta_T) are the same in degrees C and K. But absolute temperature for radiation (Stefan-Boltzmann law) must use Kelvin.

### Energy

| From | To | Factor |
|------|----|--------|
| BTU | J | x 1055.06 |
| BTU | kJ | x 1.05506 |
| kWh | MJ | x 3.6 |
| therm | MJ | x 105.506 |
| ft*lbf | J | x 1.3558 |

### Power

| From | To | Factor | Notes |
|------|----|--------|-------|
| BTU/hr | W | x 0.29307 | US HVAC standard |
| BTU/hr | kW | x 2.931 x 10^-4 | |
| hp (mechanical) | kW | x 0.74570 | |
| ton of refrigeration | kW | x 3.5168 | 12,000 BTU/hr |

### Thermal Properties

| From | To | Factor |
|------|----|--------|
| BTU*in / (hr*ft^2*deg F) | W/(m*K) | x 0.14423 |
| BTU / (hr*ft*deg F) | W/(m*K) | x 1.7307 |
| BTU / (hr*ft^2*deg F) | W/(m^2*K) | x 5.6783 |
| BTU / (lb*deg F) | kJ/(kg*K) | x 4.1868 |

### Velocity

| From | To | Factor |
|------|----|--------|
| ft/s | m/s | x 0.3048 |
| mph | m/s | x 0.44704 |
| knot | m/s | x 0.51444 |

### Density

| From | To | Factor |
|------|----|--------|
| lb/ft^3 | kg/m^3 | x 16.0185 |
| lb/gal (US) | kg/m^3 | x 119.826 |

### Dynamic Viscosity

| From | To | Factor |
|------|----|--------|
| centipoise (cP) | Pa*s | x 0.001 |
| lbm/(ft*s) | Pa*s | x 1.4882 |
| lb*s/ft^2 | Pa*s | x 47.880 |

### Electrical -- Conductor Cross-Section (AWG to mm^2)

Electrical units (V, A, W, Ohm) are all SI. The main conversion needed is AWG wire gauge to cross-sectional area:

| AWG | mm^2 | Typical Use |
|-----|------|-------------|
| 14 | 2.08 | 15A branch circuits |
| 12 | 3.31 | 20A branch circuits |
| 10 | 5.26 | 30A circuits |
| 8 | 8.37 | 40-50A circuits |
| 6 | 13.30 | 55-65A circuits |
| 4 | 21.15 | Sub-panels, large loads |
| 2 | 33.62 | Service entrance |
| 1/0 | 53.49 | Large service |
| 2/0 | 67.43 | |
| 3/0 | 85.01 | |
| 4/0 | 107.22 | Main service, feeders |
| 250 kcmil | 126.68 | Large feeders |
| 500 kcmil | 253.35 | Paralleled feeders |

---

## Derived Unit Exponent Map Table

Complete reference of 25 common infrastructure quantities with full exponent maps in {m, kg, s, A, K} notation:

| Quantity | SI Unit | Exponent Map { m, kg, s, A, K } |
|----------|---------|--------------------------------|
| Velocity | m/s | { m:1, s:-1 } |
| Acceleration | m/s^2 | { m:1, s:-2 } |
| Force | N | { m:1, kg:1, s:-2 } |
| Pressure / Stress | Pa | { m:-1, kg:1, s:-2 } |
| Energy / Work | J | { m:2, kg:1, s:-2 } |
| Power | W | { m:2, kg:1, s:-3 } |
| Density | kg/m^3 | { m:-3, kg:1 } |
| Dynamic viscosity | Pa*s | { m:-1, kg:1, s:-1 } |
| Kinematic viscosity | m^2/s | { m:2, s:-1 } |
| Thermal conductivity | W/(m*K) | { m:1, kg:1, s:-3, K:-1 } |
| Heat transfer coefficient | W/(m^2*K) | { kg:1, s:-3, K:-1 } |
| Specific heat capacity | J/(kg*K) | { m:2, s:-2, K:-1 } |
| Thermal resistance | K/W | { m:-2, kg:-1, s:3, K:1 } |
| Thermal diffusivity | m^2/s | { m:2, s:-1 } |
| Surface tension | N/m | { kg:1, s:-2 } |
| Volumetric flow rate | m^3/s | { m:3, s:-1 } |
| Heat flux | W/m^2 | { kg:1, s:-3 } |
| Electric charge | C | { s:1, A:1 } |
| Voltage / EMF | V | { m:2, kg:1, s:-3, A:-1 } |
| Resistance | Ohm | { m:2, kg:1, s:-3, A:-2 } |
| Capacitance | F | { m:-2, kg:-1, s:4, A:2 } |
| Inductance | H | { m:2, kg:1, s:-2, A:-2 } |
| Magnetic flux | Wb | { m:2, kg:1, s:-2, A:-1 } |
| Luminous flux | lm | { cd:1 } |
| Moment / Torque | N*m | { m:2, kg:1, s:-2 } |

---

## Unit Consistency Patterns

Common unit error patterns encountered in infrastructure calculations:

### Error 1: kW vs W confusion
Mixing kilowatts and watts without conversion introduces a factor-of-1000 error. Always check: is the input in W or kW? Convert to base SI (W) immediately.

### Error 2: Celsius vs Kelvin in radiation
Temperature *differences* are identical in degrees C and K: delta_T of 10 deg C = delta_T of 10 K. But the Stefan-Boltzmann radiation law (q = epsilon * sigma * T^4) requires **absolute** temperature in Kelvin. Using Celsius here gives wildly wrong results.

### Error 3: Imperial density confusion
lb/ft^3 means per cubic foot. When used with areas in ft^2, volumes in ft^3, or velocities in ft/s, all length dimensions must be consistent. Mixing ft^3 and in^3 introduces a factor of 1728.

### Error 4: BTU/hr vs BTU/s
US HVAC practice uses BTU/hr. Physics textbooks sometimes use BTU/s. Confusing them introduces a factor of 3600. Always verify: is this per hour or per second?

### Error 5: Adding mixed units without conversion
Adding BTU/hr to kW is not dimensionally invalid (both are power), but adding the raw numbers without conversion gives a meaningless result. The PhysicalQuantity system catches this because BTU/hr and kW have different unit representations until converted.

---

## Unit Checking Algorithm

Pseudocode for automated unit verification in the Calculator agent context:

```
function verifyCalculation(steps: CalculationStep[]): UnitLedger {
  const ledger: UnitLedger = { entries: [], errors: [] };

  for (const step of steps) {
    // Record inputs as PhysicalQuantity
    const inputs = step.inputs.map(convertToPhysicalQuantity);

    // Compute result using unit algebra
    const result = applyOperation(step.operation, inputs);

    // Verify result.units matches expected
    if (!unitsMatch(result.units, step.expectedUnits)) {
      ledger.errors.push({
        step: step.id,
        expected: step.expectedUnits,
        actual: result.units,
        message: `Unit mismatch at step ${step.id}`
      });
    }

    // Record in ledger
    ledger.entries.push({
      step: step.id,
      inputs: inputs.map(i => formatUnits(i.units)),
      operation: step.operation,
      result: formatUnits(result.units),
      verified: unitsMatch(result.units, step.expectedUnits)
    });
  }

  return ledger;
  // Ledger is included in CalculationRecord for Safety Warden review
}
```

The unit ledger provides a complete audit trail of dimensional verification. The Safety Warden can review this ledger to confirm that every intermediate step maintains dimensional consistency.

---

*Unit Algebra Deep Reference v1.0.0 -- Physical Infrastructure Engineering Pack*
*Sources: BIPM SI Brochure 9th Edition (2019), NIST SP 811, ASME Y14.5-2018*
