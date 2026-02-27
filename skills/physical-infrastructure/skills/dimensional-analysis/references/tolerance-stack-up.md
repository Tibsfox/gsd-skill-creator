# Tolerance Stack-Up Analysis -- Deep Reference

*Dimensional Analysis Skill -- Statistical methods, GD&T basics, Monte Carlo, worked examples*

---

## Statistical Foundations

### Why RSS Works: The Central Limit Theorem

The RSS (Root Sum of Squares) method is grounded in the Central Limit Theorem: the sum of independent random variables approaches a normal distribution regardless of the individual distributions, provided the number of variables is sufficiently large.

For tolerance stack-up, each component tolerance is a random variable with its own distribution. If each tolerance is specified at +/- 3 sigma (meaning 99.73% of manufactured parts fall within the stated tolerance), the RSS total is also a +/- 3 sigma estimate of the assembly distribution.

**Key probability insight:** The probability that all tolerances simultaneously reach their worst values is (0.0027)^n, where n is the number of independent tolerances:

| Components (n) | P(all worst) | Practical Meaning |
|----------------|-------------|-------------------|
| 2 | 7.3 x 10^-6 | 7 in a million assemblies |
| 3 | 2.0 x 10^-8 | Essentially zero |
| 5 | 1.4 x 10^-13 | Zero for all practical purposes |
| 10 | 2.1 x 10^-26 | Less than atoms in the universe |

This is why worst-case analysis is extremely conservative for large assemblies -- it protects against an event that will never occur in practice.

**Contrast:** Worst-case always provides 100% confidence. RSS provides approximately 99.73% confidence (at 3-sigma). For safety-critical assemblies where any failure is unacceptable, worst-case is the correct choice despite its conservatism.

### Distribution Assumptions

RSS assumes each tolerance is:
1. **Independent** -- the dimension of one component does not influence another
2. **Normally distributed** -- manufacturing variation follows a bell curve
3. **Centered on nominal** -- the mean of the distribution equals the design nominal

When these assumptions are violated:
- Correlated tolerances (shared tooling): RSS underestimates the stack-up
- Skewed distributions (wear processes): RSS may over- or underestimate
- Shifted mean (systematic bias): add the mean shift to the RSS result

---

## Comparison: Worst-Case vs RSS vs Monte Carlo

| Property | Worst-Case | RSS | Monte Carlo |
|----------|-----------|-----|-------------|
| Formula | T = sum of t_i | T = sqrt(sum of t_i^2) | Numerical simulation |
| Assumption | All at worst simultaneously | Independent, normal, centered | Any distribution; any correlation |
| Confidence | 100% | ~99.73% (3-sigma) | User-specified (e.g., 99.9%) |
| Handles non-normal? | Yes (always conservative) | No (assumes normal) | Yes |
| Handles correlations? | Yes (always conservative) | No (assumes independent) | Yes |
| Handles non-linear? | No (linear stack only) | No (linear stack only) | Yes (any geometry) |
| Typical result (10 parts) | 10 x t (if equal) | 3.16 x t (if equal) | Depends on inputs |
| Cost implication | Tightest tolerances, most expensive | Moderate savings | Best optimization, highest analysis cost |
| Tool required | Calculator | Calculator | Software (Excel, Python, 3DCS, Sigmetrix) |

### When to Use Each Method

**Worst-case:** Safety-critical applications (pressure vessels, seismic connections), regulatory requirements specifying worst-case, assemblies with fewer than 5 components.

**RSS:** Standard engineering practice for assemblies with 5+ independent components, moderate consequence of occasional interference, and normally distributed manufacturing processes.

**Monte Carlo:** Complex assemblies with non-linear geometry (e.g., GD&T position tolerances creating cylindrical tolerance zones), non-normal tolerance distributions (e.g., tool wear causing skew), correlated tolerances (shared fixtures), or when the cost of over-design justifies the analysis effort.

### Monte Carlo Procedure

1. Define each input tolerance as a probability distribution (normal, uniform, triangular, etc.)
2. Randomly sample one value from each distribution
3. Compute the assembly dimension from the sampled values
4. Repeat N times (typically N = 10,000 to 100,000)
5. Analyze the output distribution: mean, standard deviation, min, max, percentiles
6. Report: "99.9% of assemblies will have total stack-up less than X"

**Python example:**
```python
import numpy as np

# Define tolerances as normal distributions (mean=0, std=tolerance/3 for 3-sigma)
n_simulations = 100_000
chase_width = np.random.normal(8.000, 0.250 / 3, n_simulations)
pipe_od = np.random.normal(2.375, 0.010 / 3, n_simulations)
insulation_l = np.random.normal(1.000, 0.125 / 3, n_simulations)
insulation_r = np.random.normal(1.000, 0.125 / 3, n_simulations)

assembly = pipe_od + insulation_l + insulation_r + 2 * 0.500  # clearances are exact
gap = chase_width - assembly

# Results
print(f"Mean gap: {np.mean(gap):.3f} in")
print(f"Min gap (worst case): {np.min(gap):.3f} in")
print(f"0.1 percentile: {np.percentile(gap, 0.1):.3f} in")
print(f"P(interference): {100 * np.mean(gap < 0):.4f}%")
```

---

## GD&T Basics for Infrastructure

### Geometric Dimensioning and Tolerancing (ASME Y14.5)

GD&T goes beyond simple +/- tolerances to control the geometric form and position of features. Key concepts relevant to infrastructure engineering:

**Flatness:** Controls how flat a surface is. Relevant for: equipment mounting surfaces, flange faces, base plates. A flatness tolerance of 0.005" means the entire surface must lie between two parallel planes 0.005" apart.

**Straightness:** Controls how straight a line element is. Relevant for: pipe runs, conduit runs, structural members. A straightness tolerance of 0.010" over 10 ft means the centerline must stay within a 0.010" diameter cylinder.

**Position (True Position):** Controls the location of a feature (typically a hole or pin) relative to a datum reference frame. Relevant for: bolt hole patterns, anchor bolt locations, pipe support bracket holes.

**Concentricity:** Controls how well the center of one feature aligns with the center of another. Relevant for: shaft alignment (pumps, motors), pipe-in-pipe assemblies.

### How GD&T Tolerances Enter Stack-Up

True position tolerance zones are cylindrical (for holes) or rectangular (for slots), not linear +/-. A position tolerance of 0.020" diameter means the center can be anywhere within a circle of 0.020" diameter -- not +/- 0.010" in each axis independently.

For stack-up analysis, convert GD&T position tolerance to linear tolerance:
- **In one direction:** Linear tolerance = position tolerance / 2 (worst case along any one axis)
- **RSS contribution:** Use position_tolerance / (2 x sqrt(2)) for the contribution along a single axis

This conversion is necessary when GD&T-toleranced features participate in a linear stack-up chain.

---

## Piping System Worked Example

### CDU Connection Assembly Stack-Up

**Problem:** Verify that flexible hoses can accommodate dimensional variation in a CDU-to-rack coolant connection.

**Assembly chain (linear stack from CDU port to cold plate port):**

| Component | Nominal (inches) | Tolerance | Source |
|-----------|-----------------|-----------|--------|
| CDU enclosure port position | 0.000 (datum) | +/- 0.125 | Sheet metal fabrication |
| Manifold bracket position | 12.000 | +/- 0.062 | CNC bracket |
| Supply header position on bracket | 0.000 | +/- 0.031 | Weld tolerance |
| Flexible hose nominal length | 36.000 | +/- 0.500 | Hose assembly tolerance |
| Rack-side manifold position | 48.000 | +/- 0.125 | Rack mounting tolerance |
| Cold plate fitting engagement | -0.750 | +/- 0.020 | Fitting depth |

**Worst-case stack-up:**
T_total = 0.125 + 0.062 + 0.031 + 0.500 + 0.125 + 0.020 = 0.863"

**RSS stack-up:**
T_RSS = sqrt(0.125^2 + 0.062^2 + 0.031^2 + 0.500^2 + 0.125^2 + 0.020^2)
      = sqrt(0.01563 + 0.00384 + 0.00096 + 0.25000 + 0.01563 + 0.00040)
      = sqrt(0.28646)
      = 0.535"

**Minimum hose extension needed:**
- Worst-case: hose must accommodate 0.863" variation beyond nominal --> specify hose rated for +/- 1.0" extension
- RSS: hose must accommodate 0.535" variation --> specify hose rated for +/- 0.75" extension (with margin)

**Recommendation:** Use worst-case for this application because flexible hose failure causes coolant leak in a data center -- safety-critical scenario.

---

## Cable Tray Assembly Example

### Seismic Trapeze Mounting Stack-Up

**Problem:** Verify that a cable tray mounted to seismic trapezes remains level within 1/8" per 10 ft.

**Stack-up chain (vertical position at each support point):**

| Component | Tolerance | Notes |
|-----------|-----------|-------|
| Trapeze attachment rod hole position | +/- 0.062" | Beam clamp drilling |
| Threaded rod length | +/- 0.125" | Cut tolerance |
| Leveling nut adjustment range | -0.000" / +0.250" | Adjustable (absorbs stack) |
| Tray mounting ear slot | +/- 0.031" | Punched slot in tray side rail |
| Tray cross-member flatness | +/- 0.062" | Roll forming tolerance |

**Key insight:** The leveling nut is an adjustable element. It absorbs the tolerance stack-up during installation. This is a DFT (Design for Tolerance) principle -- using an adjustable component to break the stack-up chain.

**Without leveling nut adjustment:**
T_worst = 0.062 + 0.125 + 0.031 + 0.062 = 0.280" per support

**With leveling nut adjustment:**
Only the tray-level tolerances matter (mounting ear + flatness): T = 0.031 + 0.062 = 0.093" per support. Level within 1/8" (0.125") --> **PASSES**.

**NFPA 13 seismic bracing interaction:**
- Longitudinal brace every 40 ft maximum
- Lateral brace every 40 ft maximum
- 4-way brace within 24" of direction changes
- Bracing rod holes add +/- 0.125" positional tolerance to the stack
- Design must verify that brace forces do not displace tray beyond clearance limits

---

## Design for Tolerance (DFT) Guidelines

### Principle 1: Minimize Stack Length

Fewer components in the tolerance chain means fewer tolerances to accumulate. If a 10-component stack can be redesigned as a 5-component stack, worst-case tolerance drops by 50% and RSS by ~30%.

### Principle 2: Specify Tight Tolerances Only Where Critical

Manufacturing cost increases dramatically as tolerances tighten:

| Tolerance Class | Typical Range | Relative Cost |
|-----------------|--------------|---------------|
| Standard machining | +/- 0.010" | 1x |
| Precision machining | +/- 0.005" | 2-3x |
| High precision | +/- 0.001" | 5-10x |
| Grinding/lapping | +/- 0.0005" | 10-20x |

Apply tight tolerances only to the critical dimensions that control the stack-up. Non-critical dimensions can use standard tolerances.

### Principle 3: Use Adjustable Elements

Slotted holes, union fittings, leveling nuts, and shim packs absorb tolerance stack-up at assembly. Strategically placed adjustable elements break long tolerance chains into shorter, independent segments.

### Principle 4: Use Datum Hierarchy Consistently

All dimensions in an assembly should reference a consistent datum structure. Mixed datums introduce hidden tolerance paths that make stack-up analysis unreliable.

### Principle 5: Consider Assembly Sequence

Some tolerances do not stack if parts are adjusted during assembly. For example, if a pipe support is positioned and then welded in place relative to the pipe (rather than pre-positioned by layout), the support position tolerance is eliminated from the stack.

Document the required assembly sequence as part of the tolerance analysis -- it is a design constraint, not just a construction detail.

---

*Tolerance Stack-Up Deep Reference v1.0.0 -- Physical Infrastructure Engineering Pack*
*Sources: ASME Y14.5-2018, Fischer "Mechanical Tolerance Stackup and Analysis" (2nd ed.), Creveling "Tolerance Design" (1997)*
