# Mission 1.18 -- Mercury-Atlas 5: The Mathematics of Orbiting

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Mercury-Atlas 5 (November 29, 1961) -- Enos Orbital Flight
**Primary TSPB Layer:** 4 (Vector Calculus -- Orbital Mechanics, Circular Velocity, Orbital Period)
**Secondary Layers:** 1 (Unit Circle -- Orbital Elements, True Anomaly), 7 (Information Theory -- Decision-Making Under Faulty Feedback), 3 (Trigonometry -- Reentry Corridor, Skip-Out vs Burn-Up)
**Format:** McNeese-Hoag Reference Standard (1959)

---

## Deposit 1: Orbital Velocity and Period (Layer 4, Section 4.18)

### Table

| Parameter | Symbol | Units | MA-5 Value |
|-----------|--------|-------|------------|
| Launch date | -- | -- | November 29, 1961, 15:08 UTC |
| Launch vehicle | -- | -- | Atlas D (No. 93-D) |
| Operating agency | -- | -- | NASA / Space Task Group, Langley |
| Spacecraft | -- | -- | Mercury capsule #9A (biological payload) |
| Passenger | -- | -- | Enos (chimpanzee, Cameroon-born, ~17 kg) |
| Engine (sustainer) | -- | -- | Rocketdyne MA-3 sustainer + 2 boosters |
| Sustainer thrust | F_sus | kN | ~253 (56,000 lbf) |
| Booster thrust (each) | F_boost | kN | ~668 (150,000 lbf each) |
| Total liftoff thrust | F_total | kN | ~1,589 (357,000 lbf) |
| Vehicle mass at ignition | m_0 | kg | ~117,000 (258,000 lb) |
| Planned orbits | -- | -- | 3 |
| Actual orbits | -- | -- | 2 (mission cut short) |
| Perigee altitude | h_p | km | ~161 (100 statute miles) |
| Apogee altitude | h_a | km | ~237 (147 statute miles) |
| Orbital period | T | min | ~88.5 |
| Orbital velocity (perigee) | v_p | km/s | ~7.82 |
| Orbital velocity (apogee) | v_a | km/s | ~7.68 |
| Orbital inclination | i | deg | ~32.5 |
| Reentry peak g-load | g_max | g | ~7.6 |
| Flight duration | t_flight | hr:min | 3:20:59 |
| Max velocity | v_max | km/s | ~7.84 (at perigee) |
| Splashdown coordinates | -- | -- | 21.5 N, 68.0 W (Atlantic, near Bermuda) |
| Recovery ship | -- | -- | USS Stormes (DD-780) |
| Result | -- | -- | SUCCESS -- biological payload recovered alive, qualified Mercury for human orbital |
| Significance | -- | -- | Last flight before Glenn's MA-6 (Feb 20, 1962) |

### Formulas

**The Threshold of Orbiting: Circular Velocity**

Mercury-Atlas 5 was the first Mercury flight to achieve orbit with a biological payload. The transition from suborbital (MR-2, mission 1.17) to orbital is not gradual -- it is a sharp threshold defined by one number: the circular velocity at a given altitude. Below circular velocity, what goes up comes down on a ballistic arc. At circular velocity, what goes up stays up, circling the Earth indefinitely. Above circular velocity, the orbit becomes an ellipse with increasing apogee. At escape velocity (sqrt(2) times circular velocity), the object leaves Earth entirely.

The circular velocity at altitude h above Earth's surface:

```
CIRCULAR VELOCITY:

  v_c = sqrt(GM / r)

  where:
    G   = gravitational constant (6.674 x 10^-11 m^3 kg^-1 s^-2)
    M   = mass of Earth (5.972 x 10^24 kg)
    GM  = standard gravitational parameter = 3.986 x 10^14 m^3/s^2
    r   = distance from Earth's center = R_earth + h
    R_earth = 6,371 km

  At h = 161 km (MA-5 perigee):
    r = 6,371 + 161 = 6,532 km = 6,532,000 m
    v_c = sqrt(3.986 x 10^14 / 6,532,000)
        = sqrt(6.103 x 10^7)
        = 7,812 m/s
        = 7.81 km/s
        = 28,123 km/h

  At h = 237 km (MA-5 apogee):
    r = 6,371 + 237 = 6,608 km = 6,608,000 m
    v_c = sqrt(3.986 x 10^14 / 6,608,000)
        = sqrt(6.032 x 10^7)
        = 7,767 m/s
        = 7.77 km/s

  At h = 200 km (typical LEO reference):
    r = 6,571 km
    v_c = sqrt(3.986 x 10^14 / 6,571,000)
        = 7,788 m/s
        ≈ 7.79 km/s
```

This number -- approximately 7.8 km/s at low Earth orbit altitude -- is the velocity that divides suborbital from orbital. Ham's MR-2 reached a maximum velocity of approximately 2.3 km/s: fast enough to arc to 253 km altitude, but nowhere close to orbital. Enos's MA-5 reached 7.82 km/s at perigee: orbital velocity. The difference is a factor of 3.4 in velocity, but because kinetic energy scales as v^2, it is a factor of 11.6 in energy. The Atlas D booster, with its stage-and-a-half design (two booster engines jettisoned during ascent, one sustainer engine burning to orbit), delivered that energy.

**Comparison: Redstone vs Atlas Delta-V**

```
DELTA-V COMPARISON:

  Mercury-Redstone (MR-2):
    Total impulse: Rocketdyne A-7, single engine
    Burn time: ~144 s
    Burnout velocity: ~2,292 m/s
    Result: suborbital, apogee 253 km

  Mercury-Atlas (MA-5):
    Total impulse: MA-3 engine package
      - 2 x booster engines: ~135 s burn each
      - 1 x sustainer engine: ~300 s burn
      - Staging: boosters jettison at ~130 s (BECO)
      - Sustainer continues to SECO at ~300 s
    Burnout velocity: ~7,820 m/s
    Result: orbit, 161 x 237 km

  The velocity ratio: 7,820 / 2,292 = 3.41
  The energy ratio: (7,820)^2 / (2,292)^2 = 11.6
  The mass ratio: 117,000 / 30,000 = 3.9

  The Atlas is 3.9x more massive than the Redstone
  but delivers 11.6x more kinetic energy to the payload.
  This is the tyranny of the rocket equation:

  TSIOLKOVSKY ROCKET EQUATION:
    delta_v = v_e * ln(m_0 / m_f)

  where:
    v_e  = effective exhaust velocity (m/s)
    m_0  = initial mass (fueled)
    m_f  = final mass (empty + payload)
    ln   = natural logarithm

  The logarithm means that each additional km/s of
  delta-v requires exponentially more fuel. Going from
  2.3 km/s (suborbital) to 7.8 km/s (orbital) requires
  not 3.4x more fuel, but:

    m_0/m_f = exp(7800/3000) / exp(2300/3000)
            = exp(2.6) / exp(0.767)
            = 13.46 / 2.15
            = 6.26

  The mass ratio increases by 6.26x to achieve 3.4x
  more velocity. This is why the Atlas was so much
  larger than the Redstone, and why orbital flight
  was so much harder than suborbital. The rocket
  equation is exponential tyranny: the cost of speed
  grows faster than the speed itself.
```

**Orbital Period:**

```
ORBITAL PERIOD (KEPLER'S THIRD LAW):

  T = 2 * pi * sqrt(a^3 / GM)

  where:
    a = semi-major axis of the orbit
      = (r_perigee + r_apogee) / 2
      = (6,532 + 6,608) / 2
      = 6,570 km = 6,570,000 m

  T = 2 * pi * sqrt((6,570,000)^3 / (3.986 x 10^14))
    = 2 * pi * sqrt(2.832 x 10^20 / 3.986 x 10^14)
    = 2 * pi * sqrt(7.106 x 10^5)
    = 2 * pi * 843.0
    = 5,296 seconds
    = 88.3 minutes

  This means Enos circled the Earth once every
  88.3 minutes. In his 3 hours and 21 minutes of
  flight, he completed approximately 2.25 orbits.
  The mission was planned for 3 orbits but was
  terminated after 2 due to a spacecraft
  malfunction (a thruster control problem that
  was consuming excess fuel and causing the
  capsule to oscillate in yaw).

  Enos experienced approximately 2.25 sunrises
  and sunsets during his flight. Each orbit took
  him from Cape Canaveral's latitude (~28.5 N)
  to a maximum latitude of ~32.5 N (the orbital
  inclination) and back, crossing the Atlantic,
  Africa, the Indian Ocean, Australia, the Pacific,
  and back to the Atlantic. He saw more of the
  Earth in 3 hours than most organisms see in a
  lifetime.
```

### Debate Questions (Layer 4)

1. **The Atlas vs. Redstone choice was a risk-capability tradeoff.** The Atlas D was more powerful but less reliable -- it had a launch failure rate of approximately 30% through 1961 (multiple Atlas vehicles exploded on the pad or during ascent). The Redstone was far more reliable (~95% success rate) but could only reach suborbital speeds. NASA needed orbital flight data before John Glenn could fly, which meant accepting the Atlas's risk. If you were managing the Mercury program, would you have flown more Redstone suborbital tests first, accepting the delay, or moved to Atlas orbital tests despite the higher failure rate? What is the value function that determines when increased risk is justified by increased capability?

2. **Enos's orbit was not circular but elliptical: 161 km x 237 km.** A perfectly circular orbit at 200 km would have been simpler operationally (constant altitude, constant velocity, constant atmospheric drag). Why did NASA choose an elliptical orbit for MA-5? The answer involves the Atlas injection accuracy: the booster could not reliably achieve exact circular velocity at a precise altitude. The elliptical orbit was what the hardware could deliver. How does engineering constraint shape mathematical ideals? The textbook says "circular orbit"; the rocket says "ellipse."

3. **The Tufted Puffin (Fratercula cirrhata, degree 18) dives to depths of 60 meters or more, propelling itself underwater using its wings -- the same wings it uses to fly in air.** At depth, the puffin is subject to hydrostatic pressure (approximately 7 atmospheres at 60 m), and its air sacs compress proportionally. The puffin must manage its buoyancy throughout the dive, expending energy differently at every depth. Is the puffin's dive-and-return profile analogous to an elliptical orbit? The puffin descends from surface (perigee of zero depth) to maximum depth (apogee), then returns, with velocity and energy changing continuously along the path. What are the "orbital elements" of a puffin dive?

---

## Deposit 2: The Reentry Corridor (Layer 3, Section 3.18)

### Formulas

**The Geometry of Safe Return**

Orbital reentry is the most dangerous phase of spaceflight. The capsule must decelerate from 7.8 km/s to zero -- losing approximately 30 megajoules of kinetic energy per kilogram of spacecraft mass. This energy is converted to heat by atmospheric friction. The reentry corridor is the narrow range of entry angles that produce survivable deceleration: too shallow, and the capsule skips off the atmosphere like a stone off water (skip-out); too steep, and the deceleration is so rapid that the heat and g-forces destroy the vehicle and its occupant (burn-up).

```
REENTRY CORRIDOR GEOMETRY:

  The entry angle gamma_e is measured from the
  local horizontal at the entry interface
  (typically defined as 120 km altitude for
  Earth reentry).

  SKIP-OUT BOUNDARY (gamma too shallow):
    If gamma_e < gamma_skip, the capsule enters
    the atmosphere, decelerates slightly, but its
    remaining velocity is sufficient to climb back
    above the atmosphere. The capsule "skips" off
    the atmosphere and reenters space -- now on a
    trajectory that may not return to Earth, or may
    return at an unpredictable location.

    For Mercury capsule (L/D ≈ 0.05, ballistic):
      gamma_skip ≈ -1.0 degrees
      (Entry angles shallower than 1 degree below
      horizontal risk skip-out)

  BURN-UP BOUNDARY (gamma too steep):
    If gamma_e > gamma_burnup, the deceleration is
    so rapid that:
    1. Peak g-force exceeds structural/biological limits
    2. Peak heat rate exceeds heat shield capacity
    3. Both of the above simultaneously

    For Mercury capsule:
      gamma_burnup ≈ -7.5 degrees
      (Entry angles steeper than 7.5 degrees produce
      g-forces above 20g and heat rates above the
      heat shield's ablative capacity)

  THE CORRIDOR:
    gamma_skip < gamma_e < gamma_burnup
    -1.0 < gamma_e < -7.5 degrees

    Width of corridor: approximately 6.5 degrees

    This is narrow. For comparison, the Mercury
    capsule approaches the entry interface at
    approximately 7,800 m/s. At this speed, a
    1-degree change in entry angle corresponds
    to a change in the vertical component of
    velocity of:

      delta_v_vertical = v * sin(1 degree) - v * sin(0)
                       = 7,800 * 0.01745
                       = 136 m/s

    So the difference between skip-out and burn-up
    is approximately 6.5 * 136 = 884 m/s of vertical
    velocity component. The retrorocket system must
    control the reentry trajectory to within this
    884 m/s window.

  MA-5 ACTUAL ENTRY:
    gamma_e ≈ -1.5 degrees (nominal, near the
    shallow end of the corridor)
    Peak g-force: ~7.6 g
    Peak heating: within heat shield design limits
    Entry was nominal -- well within the corridor.
```

**Why Cutting from 3 to 2 Orbits Required Immediate Action:**

```
RETROFIRE TIMING:

  MA-5 was planned for 3 orbits (approximately
  265 minutes of flight). The retrofire sequence
  was planned for the end of the third orbit,
  over the Pacific, to produce a splashdown in
  the Atlantic recovery zone.

  During the second orbit, mission control detected:
  1. A malfunctioning thruster (roll-right) that was
     causing the capsule to oscillate in yaw
  2. Excessive fuel consumption from the Automatic
     Stabilization and Control System (ASCS) trying
     to correct the oscillation
  3. The projected fuel remaining at end of orbit 3
     was below the minimum required for retrofire
     attitude control

  The decision: retrofire at the end of orbit 2,
  approximately 88 minutes early.

  The retrofire calculation:

    Retrofire delta-v required: ~150 m/s
    (from three solid-fuel retrorockets, each
    producing ~50 m/s)

    This delta-v reduces the orbital velocity from
    ~7,800 m/s to ~7,650 m/s -- a 2% reduction.
    But this 2% reduction changes the perigee of
    the resulting orbit from 161 km to approximately
    -50 km (below Earth's surface), which means
    the capsule intersects the atmosphere on a
    trajectory that ends at the surface instead
    of continuing in orbit.

    Timing is critical: retrofire must occur at the
    correct point in the orbit so that the capsule
    descends into the planned recovery zone. If
    retrofire occurs 1 minute too early or late:

    At 7,800 m/s orbital velocity:
      position_error = v * delta_t
                     = 7,800 * 60
                     = 468,000 m
                     = 468 km

    A 1-minute timing error in retrofire moves the
    splashdown point by 468 km. The recovery fleet
    (ships and helicopters) had a search radius of
    approximately 200 km. A 2-minute error could
    put the capsule outside the recovery zone.

  MA-5's early retrofire was executed at the end of
  orbit 2, over the Pacific, at the same orbital
  position where the orbit-3 retrofire would have
  occurred -- just one orbit earlier. This put the
  splashdown in the planned recovery zone. The
  timing worked because orbital mechanics is
  periodic: the same orbital position occurs once
  per orbit, so firing one orbit early produces the
  same splashdown location (approximately -- Earth
  has rotated ~23 degrees in the intervening 88
  minutes, which shifts the ground track westward).

  Actual splashdown was approximately 330 km short
  of the primary recovery zone -- close enough for
  the destroyer USS Stormes to reach Enos within
  75 minutes of splashdown.
```

### Debate Questions (Layer 3)

1. **The reentry corridor width of 6.5 degrees for Mercury seems narrow, but it is actually generous compared to skip-glide vehicles.** The Space Shuttle's corridor was approximately 2 degrees wide (the Shuttle used aerodynamic lift during reentry, which demanded more precise entry control). Modern crew vehicles (Orion, Dragon) have corridors of approximately 4-5 degrees. Is a wider corridor better? The wider corridor of Mercury came at the cost of higher g-forces (no lift modulation -- the capsule fell through the atmosphere ballistically). The narrower corridor of the Shuttle came with lower g-forces (lift allowed a longer, gentler deceleration path) but required much more precise guidance. What is the optimal tradeoff between corridor width and g-force profile?

2. **Bull kelp (Nereocystis luetkeana, this mission's organism) anchors to the seafloor at depths of 20-30 meters and extends to the surface, where its pneumatocyst (gas-filled float) holds the blade canopy at the air-water interface.** The kelp stipe (stem) must be strong enough to resist wave forces and current drag but flexible enough to bend without breaking. The kelp operates in a "corridor" of its own: if the stipe is too rigid, wave forces snap it (burn-up). If the stipe is too flexible, the canopy cannot maintain its position at the surface and gets dragged underwater (skip-out). What is the structural reentry corridor for a kelp stipe?

---

## Deposit 3: Decision Under Faulty Feedback (Layer 7, Section 7.18)

### Formulas

**Enos's Lever Task with Reversed Rewards**

Enos was trained on the same conditioned avoidance task as Ham: stimulus light, two levers, correct response rewarded with banana pellet, incorrect response punished with mild electric shock. But during the second orbit, the reward mechanism malfunctioned. The system reversed: correct responses were punished (shock), and incorrect responses were rewarded (pellet). Enos received electric shocks for pulling the correct lever.

Enos continued to pull the correct lever.

This is one of the most remarkable behavioral data points in the history of spaceflight. It reveals something profound about the relationship between prior training and current feedback, and it can be analyzed using Bayesian decision theory.

```
BAYESIAN ANALYSIS OF ENOS'S DECISION:

  The decision problem:
    Enos must choose between two actions:
      A1: Pull the lever that training says is correct
      A2: Pull the lever that current feedback says is correct

  Prior belief (from 18 months of ground training):
    P(correct | trained_lever) ≈ 0.95
    This is Enos's learned model of the world:
    "the lever I was trained on is the right one
    with 95% probability."

  New evidence (from the malfunction):
    The trained lever now produces punishment.
    If Enos updates his belief using Bayes' theorem:

    P(correct | shock) = P(shock | correct) * P(correct)
                         / P(shock)

    Before the malfunction:
      P(shock | correct) ≈ 0.0 (correct lever never shocks)
      P(shock | incorrect) ≈ 1.0 (wrong lever always shocks)

    After the malfunction:
      P(shock | correct) = 1.0 (correct lever now shocks)
      P(shock | incorrect) = 0.0 (wrong lever now rewards)

    A Bayesian agent that updates fully on the new
    evidence should reverse its behavior: switch to
    the other lever, because the feedback has reversed.

    But Enos did NOT reverse. He continued pulling
    the trained lever. Why?

  EXPLANATION 1: Strong Prior Overwhelms Weak Evidence
    If Enos's prior is extremely strong (18 months of
    consistent reinforcement = thousands of trials),
    a few minutes of contradictory evidence may be
    insufficient to overcome the prior:

    P(trained_is_correct | N_shocks) =
      P(trained_is_correct)^(N_training_trials) /
      (P(trained_is_correct)^(N_training_trials) +
       P(trained_is_wrong)^(N_shock_trials))

    With N_training ≈ 10,000 and N_shock ≈ 20:
      The prior dominates overwhelmingly.
      Enos would need hundreds of reversed trials
      before the posterior shifted enough to change
      his behavior.

  EXPLANATION 2: Task vs. Feedback Dissociation
    Enos may have learned the TASK (which lever to
    pull in response to which light) independently
    of the FEEDBACK (pellet or shock). The task is
    a stimulus-response mapping stored in procedural
    memory. The feedback is an outcome evaluation
    stored in associative memory. Under stress (orbital
    flight, 0g, unfamiliar environment), procedural
    memory is more robust than associative learning.
    Enos fell back on what he knew how to DO, not on
    what was currently being REWARDED.

  EXPLANATION 3: Extinction Resistance
    Variable-ratio reinforcement schedules (which were
    used in Enos's later training stages) produce
    behavior that is extremely resistant to extinction.
    A pigeon trained on a variable-ratio schedule will
    peck a key thousands of times after reinforcement
    has stopped entirely. Enos's training had built a
    response pattern that was essentially extinction-
    proof in the short term. The malfunction during
    orbit was, from Enos's perspective, just a temporary
    absence of expected reward -- not a signal to change
    behavior.

  THE MATH OF ROBUST DECISION-MAKING:

    Shannon channel capacity under faulty feedback:

    Before malfunction:
      The feedback channel has zero error rate:
      correct -> pellet (always), incorrect -> shock (always)
      Channel capacity = 1 bit per trial
      (feedback perfectly disambiguates correct from incorrect)

    During malfunction:
      The feedback channel is INVERTED:
      correct -> shock, incorrect -> pellet
      Channel capacity = 1 bit per trial
      (feedback still perfectly disambiguates -- but the
      mapping is reversed)

    The information content of the feedback is unchanged.
    What changed is the mapping. An agent that tracks
    the mapping (meta-learning) could detect the reversal
    and adapt. An agent that has hard-coded the mapping
    (procedural learning) continues with the original
    mapping regardless of the feedback.

    Enos was the second type. His behavior under the
    malfunction was CORRECT in the absolute sense
    (he pulled the right lever) but PUNISHED by the
    system. He chose accuracy over reward.

    This is the robust decision: when the feedback
    channel is unreliable, trust the prior. When the
    environment has changed but you are not sure how,
    do what you know works rather than what the current
    signals suggest. This is the mathematical basis
    of conservative decision-making under uncertainty.
```

**Python: Computing the Bayesian Update**

```python
# enos_bayesian.py
# Bayesian analysis of Enos's behavior under reversed feedback
#
# Models how many reversed trials would be needed to overcome
# Enos's training prior, assuming different prior strengths.

import numpy as np
import matplotlib.pyplot as plt

def bayesian_update(prior_strength, n_reversed_trials):
    """
    Compute posterior probability that the trained lever is correct,
    given prior_strength training trials (all confirming) and
    n_reversed_trials where the feedback is reversed.

    Uses log-odds for numerical stability.
    """
    # Log odds of trained lever being correct
    # Each training trial adds log(0.95/0.05) to log-odds
    # Each reversed trial subtracts log(0.95/0.05) from log-odds
    log_odds_per_trial = np.log(0.95 / 0.05)  # ≈ 2.944

    log_odds = prior_strength * log_odds_per_trial - n_reversed_trials * log_odds_per_trial

    # Convert back to probability
    posterior = 1 / (1 + np.exp(-log_odds))
    return posterior

# Enos's situation: ~10,000 training trials, ~20 reversed trials
prior_strengths = [100, 1000, 5000, 10000]
n_reversed = np.arange(0, 200)

plt.figure(figsize=(10, 6))
for ps in prior_strengths:
    posteriors = [bayesian_update(ps, n) for n in n_reversed]
    plt.plot(n_reversed, posteriors, label=f'{ps} training trials')

plt.axhline(y=0.5, color='red', linestyle='--', label='Decision boundary')
plt.axvline(x=20, color='gray', linestyle=':', label="Enos's ~20 reversed trials")
plt.xlabel('Number of Reversed Feedback Trials')
plt.ylabel('P(trained lever is correct)')
plt.title("Enos's Bayesian Belief Under Reversed Feedback")
plt.legend()
plt.grid(True, alpha=0.3)
plt.ylim(-0.05, 1.05)
plt.tight_layout()
plt.savefig('enos_bayesian_update.png', dpi=150)
plt.show()

# Result: With 10,000 training trials, Enos would need
# approximately 10,000 reversed trials before his posterior
# crossed 0.5. Twenty reversed trials during orbit barely
# dent the prior. His behavior was not irrational -- it was
# the Bayes-optimal response given his training history.
```

### Debate Questions (Layer 7)

1. **Should Enos have switched levers?** From a pure reward-maximization standpoint, switching would have earned pellets instead of shocks during the malfunction. But Enos did not know the malfunction was permanent -- it might have reverted at any time. An agent that switches on the first contradictory signal is fragile: easily manipulated by noise. An agent that maintains its trained behavior despite contradictory signals is robust: resistant to transient errors. Enos's strategy (maintain prior behavior) is optimal under what assumptions about the environment? Under what assumptions is it suboptimal?

2. **Bull kelp (Nereocystis luetkeana) grows toward the surface -- toward light -- using a phototropic response encoded in its growth cells.** If you artificially illuminate a kelp holdfast from below (reversing the light gradient), the kelp does not grow downward. It continues growing upward. The kelp's "prior" (grow toward the surface) overwhelms the "evidence" (light is coming from below). Is the kelp's phototropism a biological Bayesian prior? What would it take to reverse it -- how many generations of downward-light selection before the growth response changed?

3. **The Tufted Puffin (Fratercula cirrhata, degree 18) returns to the same nesting burrow year after year, navigating across thousands of kilometers of open ocean using a combination of magnetic sense, solar cues, and olfactory landmarks.** If a researcher experimentally displaces a puffin's nest entrance by moving rocks, the puffin searches for the original location before accepting the altered entrance. The puffin trusts its prior (where the burrow WAS) over current evidence (where the burrow IS). How many displaced returns before the puffin updates its search pattern? Is this the same Bayesian conservatism that Enos demonstrated?

---

### Rosetta Table: Orbital Mechanics

| Concept | MA-5 Application | Prior Mission Reference |
|---------|-------------------|------------------------|
| Circular velocity | v_c = sqrt(GM/r) = 7.81 km/s at 161 km | MR-2 (1.17): v_max = 2.29 km/s, suborbital |
| Orbital period | T = 2*pi*sqrt(a^3/GM) = 88.3 min | -- (first orbital mission in series) |
| Vis-viva equation | v^2 = GM*(2/r - 1/a) for elliptical orbit | MR-2 (1.17): same equation, suborbital ellipse |
| Tsiolkovsky equation | delta_v = v_e * ln(m_0/m_f) | MR-2 (1.17): Redstone single stage |
| Reentry corridor | -1 to -7.5 deg entry angle | MR-2 (1.17): ballistic reentry, no corridor constraint (suborbital) |
| Retrofire timing | 468 km position error per minute of timing error | MR-2 (1.17): no retrofire (ballistic return) |
| Bayesian prior | P(correct) maintained despite reversed feedback | MR-2 (1.17): Ham's lever task, consistent feedback |

---

*"Bull kelp grows from the seafloor to the surface in a single season -- up to 36 meters of growth in approximately 180 days, one of the fastest-growing organisms on Earth. The growth rate peaks at 10-15 centimeters per day during summer, driven by the same sunlight that Enos saw streaming through his capsule window every 88 minutes as he crossed from the night side to the day side of his orbit. The kelp does not orbit, but it does circle: its blades trace a daily arc in the current, streaming with the tide, curving back as the tide reverses, tracing an ellipse on the water's surface that repeats with each tidal cycle. The puffin nests above the kelp forest, on the cliff face, and dives through the canopy to hunt the fish that shelter in the kelp's understory. The puffin's orbit is smaller than Enos's -- 60 meters of depth instead of 237 kilometers of altitude -- but the mathematics is the same: velocity determines trajectory, gravity determines the return, and the organism must manage its energy budget across the entire cycle or it does not come home. Enos came home after 2 orbits instead of 3 because his spacecraft was burning through its fuel reserves trying to correct an oscillation it could not fix. The kelp comes home to the surface every day because its pneumatocyst -- a gas-filled float at the top of the stipe -- provides the buoyancy that gravity cannot. The puffin comes home to the surface after every dive because the air trapped in its feathers provides buoyancy that increases as the compressed air re-expands during ascent. Three organisms in three media -- space, water, air -- each managing the same fundamental problem: how to go out and come back, trading energy for distance, trusting the mathematics of return. C.S. Lewis, born on this day in 1898, wrote about a voyage to another world in Out of the Silent Planet, and his character Ransom discovered that space was not empty darkness but a sea of light -- that the voyager's fear of the void was misplaced, that the medium was richer than the traveler imagined. Enos could not read Lewis, but he flew through the same medium, circling a planet that Lewis saw as the Silent Planet, and he came back with the data that proved a primate could work in that sea of light, even when the instruments that were supposed to help him lied. He pulled the correct lever. The kelp grows toward the correct light. The puffin returns to the correct burrow. Prior knowledge, honestly acquired through long experience, is more reliable than any single measurement, especially when the measurement apparatus has malfunctioned. Lewis would have appreciated the parable. Enos lived it."*
