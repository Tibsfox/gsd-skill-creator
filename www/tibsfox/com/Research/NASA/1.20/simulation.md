# Mission 1.20 -- Mercury-Redstone 4: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Mercury-Redstone 4 / Liberty Bell 7 (July 21, 1961) -- Gus Grissom Suborbital Flight
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Enteroctopus dofleini (Giant Pacific Octopus)
**Bird:** Histrionicus histrionicus (Harlequin Duck, degree 20)
**Dedication:** Ernest Hemingway (July 21, 1899 -- July 2, 1961)

---

## A. Simulations -- What to Build Locally

### A1. Python: Capsule Flooding and Sinking Rate Calculator

**What it is:** A Python tool that models the complete post-hatch-failure sequence of Liberty Bell 7: water ingress through the open hatch, rising capsule mass, helicopter load limit comparison, the moment the capsule becomes unliftable, release, and terminal sinking velocity through 4,900 meters of ocean. The student adjusts parameters (hatch diameter, sea state, helicopter payload capacity, initial water mass) and watches the capsule's fate unfold as a time-series plot.

**Why it matters:** The hatch failure is often described narratively -- "the capsule flooded and sank." This simulation makes it quantitative: the student sees the EXACT moment the capsule crosses the helicopter's lift capacity, the EXACT flooding rate, and the EXACT time it takes to reach the ocean floor. The numbers reveal why no human intervention could have saved the capsule once the hatch blew: the timeline was measured in seconds, and the helicopter needed minutes.

**Specification:**

```python
# mr4_flooding_simulator.py
# Liberty Bell 7 capsule flooding and sinking rate calculator
#
# Process:
#   1. Model water ingress through the open hatch
#   2. Track capsule mass over time (dry mass + water)
#   3. Compare to helicopter lift capacity (time-varying)
#   4. Identify the "point of no return" (capsule unliftable)
#   5. Model the sinking trajectory after release
#   6. Compute time to reach 4,900 m ocean floor
#
# Parameters (user-adjustable):
#   hatch_diameter_m: 0.3-1.0 (default 0.58, MR-4 actual)
#   sea_state_m: 0.1-2.0 (default 0.5, wave height)
#   discharge_coeff: 0.4-0.8 (default 0.6, sharp-edged orifice)
#   capsule_dry_mass_kg: 800-1500 (default 1100, MR-4 actual)
#   capsule_volume_m3: 1.0-2.0 (default 1.3, external volume)
#   free_volume_m3: 0.8-1.5 (default 1.0, internal flood volume)
#   heli_max_lift_kg: 1500-4000 (default 2000, hot-day hover)
#   ocean_depth_m: 100-6000 (default 4900, MR-4 actual)
#   water_temp_C: 0-30 (default 25, tropical Atlantic surface)
#   drag_coeff_sinking: 0.5-1.5 (default 0.8, blunt cone)
#
# Preset scenarios:
#   "Liberty Bell 7 (actual)": all defaults
#   "Calm seas": sea_state=0.1 (minimal wave action)
#   "Pre-hooked": helicopter attached before hatch blows
#   "Larger helicopter": heli_max_lift=3500
#   "Sealed oxygen inlet": reduced flooding rate
#   "Custom": user-set parameters
#
# Visualization:
#   - Plot 1: Capsule mass vs time (main drama plot)
#     X-axis: time (0-300 seconds)
#     Y-axis: total capsule mass (1000-3000 kg)
#     Green line: capsule dry mass (horizontal, 1100 kg)
#     Blue area: water mass (increasing from zero)
#     Red dashed line: helicopter max lift capacity
#     The blue area crosses the red line at t = ~9 seconds
#     Annotation at crossing:
#       "Point of no return: capsule unliftable"
#       "Time from hatch blow: X seconds"
#       "Water mass at crossing: X kg"
#     Vertical dashed line at t=60: "Helicopter hook attached
#       (actual timeline)" -- far to the right of the crossing
#
#   - Plot 2: Depth vs time (sinking trajectory)
#     X-axis: time (0-2000 seconds, from release)
#     Y-axis: depth (0-5000 m, inverted so deeper is lower)
#     Blue curve: capsule depth over time
#     Red horizontal line at 4,900 m (ocean floor)
#     Depth markers: 1000, 2000, 3000, 4000, 4900 m
#     Pressure annotations at each depth marker:
#       1000 m: ~100 atm
#       2000 m: ~200 atm
#       3000 m: ~300 atm
#       4000 m: ~400 atm
#       4900 m: ~493 atm
#     Giant Pacific Octopus range: shaded band 0-1500 m
#       "E. dofleini comfort zone: 0-1500 m"
#     Harlequin Duck diving range: shaded band 0-20 m
#       "H. histrionicus diving range: 0-20 m"
#     Annotation at 4900 m:
#       "Liberty Bell 7 rests here for 38 years"
#       "Recovered July 20, 1999"
#
#   - Plot 3: Velocity vs depth (terminal sinking)
#     X-axis: depth (0-5000 m)
#     Y-axis: sinking velocity (0-5 m/s)
#     Blue curve: velocity profile
#     Initially accelerating (from release, v=0)
#     Rapidly approaching terminal velocity (~3.5 m/s)
#     Slight increase in terminal velocity with depth
#       (seawater density increases ~0.5% per 1000 m)
#     Annotation:
#       "Terminal velocity reached within first 100 m"
#       "v_terminal ≈ 3.5 m/s (12.6 km/h)"
#       "Walking speed. The capsule sank at walking speed."
#
#   - Plot 4: Pressure vs depth (comparison)
#     X-axis: depth (0-5000 m)
#     Y-axis: pressure (0-500 atm)
#     Blue line: hydrostatic pressure (linear, P = rho*g*d)
#     Markers:
#       "Capsule design pressure: 1 atm (sea level)"
#       "Octopus range: 0-150 atm (1500 m)"
#       "Capsule resting pressure: 493 atm (4900 m)"
#       "Mariana Trench: ~1100 atm (11000 m)"
#     The linear simplicity of the pressure plot is the
#     point: pressure increases uniformly with depth,
#     there are no surprises, and the capsule was never
#     designed for ANY of it.
#
# Libraries: numpy, matplotlib
# Difficulty: Beginner-Intermediate
# Duration: 2-3 hours
```

**Key learning moments:**
1. Plot 1 reveals the timeline impossibility: the helicopter needed 60+ seconds to hook up, and the capsule became unliftable in ~9 seconds. The gap between 9 and 60 is the mathematical proof that Liberty Bell 7 was lost the moment the hatch blew.
2. Plot 2 shows the Giant Pacific Octopus range as a shaded band occupying only the top 30% of the water column. The capsule sank through and past the octopus's entire habitat in approximately 7 minutes. The remaining 16 minutes were through water too deep for any air-breathing predator.

---

### A2. Python: Explosive Bolt Failure Probability Analysis (Monte Carlo)

**What it is:** A Monte Carlo simulation that models the probability of premature hatch detonation under varying environmental conditions. The student defines probability distributions for temperature, vibration amplitude, electrical noise, and detonator sensitivity, then runs thousands of simulated post-splashdown scenarios. The output is a probability distribution for premature detonation -- revealing how likely the failure was given the environmental conditions on July 21, 1961.

**Why it matters:** The debate about whether Grissom caused the hatch failure is ultimately a probabilistic question: given the physical evidence, which candidate mechanism has the highest probability? Monte Carlo simulation allows the student to formalize this question quantitatively, assigning distributions to uncertain parameters and letting the simulation reveal the aggregate probability.

**Specification:**

```python
# mr4_hatch_monte_carlo.py
# Explosive bolt failure probability analysis
#
# Process:
#   1. Define probability distributions for environmental
#      parameters (temperature, vibration, electrical noise)
#   2. Define the detonator activation threshold model
#      (threshold decreases with temperature, has a
#      probability of electrical triggering)
#   3. Run N simulated post-splashdown scenarios
#   4. In each scenario: draw random values for all
#      parameters, check if any combination triggers
#      the detonator
#   5. Compute the fraction of scenarios where the
#      hatch fires prematurely
#   6. Decompose: what fraction of premature firings
#      are thermal vs electrical vs vibrational vs pilot?
#
# Parameters (user-adjustable):
#   n_simulations: 1000-1000000 (default 100000)
#   temp_surface_C: 15-40 (default 30, tropical Atlantic)
#   temp_internal_offset_C: 0-20 (default 15, solar heating)
#   vibration_amplitude_g: 0-2 (default 0.5, wave action)
#   electrical_noise_mA: 0-100 (default 20, stray currents)
#   detonator_threshold_N: 10-30 (default 24.5, rated)
#   threshold_temp_coeff: 0-0.5 (default 0.2, N per degree C
#     reduction in threshold with temperature)
#   electrical_trigger_threshold_mA: 10-200 (default 50,
#     minimum current to fire electrical initiator)
#   pilot_strike_probability: 0-1 (default 0.05,
#     prior probability that Grissom struck the plunger)
#
# Detonator activation model:
#   The detonator fires if ANY of the following occur:
#   1. Mechanical: random force > threshold * temp_factor
#      where temp_factor = 1 - temp_coeff * (T - T_rated)
#      and T_rated = 20 C
#   2. Electrical: stray current > electrical_trigger
#   3. Pilot: drawn from Bernoulli(pilot_strike_prob)
#
# Visualization:
#   - Plot 1: Pie chart of failure causes
#     For each premature detonation, record which
#     mechanism triggered it. Display as pie chart:
#     "Thermal/vibrational: X%"
#     "Electrical: X%"
#     "Pilot mechanical: X%"
#     "Multiple concurrent: X%"
#
#   - Plot 2: Probability of premature detonation vs temperature
#     X-axis: internal temperature (20-60 C)
#     Y-axis: probability of premature detonation
#     Shows how rapidly the probability increases with
#     temperature. The student sees that at the estimated
#     conditions on July 21, the probability of environmental
#     triggering was significant.
#
#   - Plot 3: Histogram of simulated threshold at failure
#     X-axis: effective activation force (N)
#     Y-axis: count of simulations
#     Shows the distribution of thresholds at the moment
#     of failure -- revealing how much margin erosion
#     occurred due to environmental factors
#
#   - Plot 4: Cumulative probability over time
#     X-axis: time after splashdown (0-600 seconds)
#     Y-axis: cumulative P(premature detonation)
#     Shows the probability increasing with time as
#     the capsule heats in the sun and wave action
#     accumulates. At t=300 seconds (approximately when
#     the hatch actually blew), the cumulative probability
#     should be substantial.
#
# Libraries: numpy, matplotlib
# Difficulty: Intermediate
# Duration: 3-4 hours
```

**Key learning moments:**
1. Plot 1 shows the breakdown: the Monte Carlo consistently attributes the majority of premature detonations to thermal + electrical mechanisms, with pilot error as a minority cause. The student sees that the "pilot error" hypothesis is not just unsupported by the physical evidence -- it is a statistically unlikely explanation given the environmental conditions.
2. Plot 2 reveals the temperature sensitivity: the probability of premature detonation rises sharply above 40 degrees C internal temperature. In a capsule sitting in the tropical Atlantic sun for several minutes, 40 C is conservative.

---

### A3. Web: "Save Liberty Bell 7" -- Helicopter Recovery Game

**What it is:** A browser-based helicopter recovery game where the player must hook Liberty Bell 7's recovery sling and lift the capsule out of the water before it floods and sinks. The game is physically accurate: the capsule floods at ~100 L/s, the helicopter has limited payload capacity, the wind affects positioning, and the sling must be lowered precisely. The game is unwinnable under the actual conditions -- the point is to demonstrate viscerally that no pilot could have saved the capsule given the timeline.

**Specification:**

```
WEB APPLICATION: "Save Liberty Bell 7"
=======================================

Technology: HTML5 Canvas + JavaScript (no frameworks)
Target: Modern browser, 1920x1080

GAME CONCEPT:
  The player is Lieutenant Jim Lewis, piloting the
  recovery helicopter. The explosive hatch has just
  blown. Liberty Bell 7 is floating in the Atlantic
  with a gaping hole in its side, taking on water.
  The player must:
  1. Position the helicopter over the capsule
  2. Lower the recovery hook
  3. Attach the hook to the capsule's sling
  4. Lift the capsule before it sinks

  The catch: the physics are real. The capsule floods
  at ~100 L/s and becomes unliftable in ~9 seconds.
  The helicopter needs ~30 seconds to position, lower
  the hook, and begin lifting. The game is designed
  to be NEARLY IMPOSSIBLE -- but the player keeps
  trying, adjusting their approach, trying to shave
  seconds off the timeline.

CONTROLS:
  Arrow keys or WASD: move helicopter (2D, top-down view)
  SPACE: lower/raise recovery hook
  SHIFT: increase rotor speed (more lift but more
    downwash on the water, which makes waves worse
    and pushes the capsule away)

PHYSICS:
  Helicopter:
    Max speed: 30 knots (positioning)
    Hook lowering rate: 1 m/s
    Hook attachment: requires 3-second stable hover
      within 2 meters of the capsule sling
    Max lift capacity: 2000 kg (hot-day, sea-level hover)
    Rotor downwash: pushes capsule ~0.5 m/s at hover
      height of 15 meters

  Capsule:
    Dry mass: 1100 kg
    Flooding rate: dependent on sea state and hatch
      submersion. Base rate: 100 L/s when hatch is
      at waterline. Higher when waves push hatch under.
    Capsule sits lower in water as it floods
      (waterline rises with added mass)
    Sinking point: when total mass > buoyancy
      (dry mass + water > displaced water volume)
      = approximately 1100 + 200 = 1300 kg for
      submersion of the hatch completely

  Sea state:
    Waves: sinusoidal, 0.5 m amplitude, 6 s period
    The capsule bobs with the waves
    The helicopter rotor downwash creates additional
      wave action near the capsule

GAME PHASES:

  Phase 1: APPROACH (0-15 seconds)
    Player sees the capsule from above, bobbing in
    blue-green water. A red timer counts from 0.
    The capsule outline changes color as it floods:
      Green: <500 kg water (liftable with margin)
      Yellow: 500-800 kg water (barely liftable)
      Red: >800 kg water (over helicopter limit)
      Gray: sinking (below waterline)
    The player must fly to the capsule and position
    over it.

  Phase 2: HOOK (15-45 seconds)
    Player lowers the hook. Must hold position within
    2 meters for 3 seconds while the hook descends.
    Wind gusts randomly push the helicopter off position.
    The helicopter's own downwash pushes the capsule,
    requiring constant correction.

  Phase 3: LIFT (when hooked)
    Player must lift the capsule. The lift force is
    displayed as a gauge. If capsule mass > helicopter
    capacity, the lift gauge goes red and the engine
    chip warning light illuminates (blinking amber).
    If the player holds max lift for >5 seconds with
    the capsule over capacity, the engine fails and
    both the helicopter and capsule are lost.
    The player must choose: cut the capsule loose
    (press C) or keep trying.

  Phase 4: RESCUE GRISSOM (alternate priority)
    If the player focuses on Grissom instead of the
    capsule (press G to switch to personnel rescue
    mode), the helicopter can pick up Grissom in ~30
    seconds (lower rescue sling, Grissom grabs it,
    hoist). But during this time, the capsule sinks.
    The game forces the player to choose: save the
    capsule (impossible) or save the pilot (achievable).

SCORING:
  - Capsule saved AND pilot saved: "Miracle Recovery"
    (mathematically nearly impossible -- the timer
    doesn't allow it under realistic conditions)
  - Pilot saved, capsule lost: "Lewis's Choice"
    (historically accurate -- this is the correct outcome)
  - Capsule saved, pilot not recovered: "Wrong Priority"
    (the game rebukes this choice)
  - Both lost: "Total Loss"

POST-GAME:
  "On July 21, 1961, Lieutenant Jim Lewis faced this
  exact scenario. The hatch blew at T+0. The capsule
  was flooding at approximately 100 liters per second.
  Lewis attempted to hook and lift the capsule, but the
  waterlogged spacecraft exceeded the helicopter's
  lifting capacity within seconds. The engine chip
  warning light illuminated. Lewis had to choose:
  keep trying to save the capsule and risk losing the
  helicopter, or cut the capsule loose and save Grissom.

  He cut the capsule loose. Grissom was rescued by the
  second helicopter. Liberty Bell 7 sank to 4,900 meters.

  Lewis made the right call. The mathematics proves it:
  at 100 L/s flooding rate, the capsule exceeded the
  helicopter's 2,000 kg payload limit within 9 seconds
  of the hatch opening. The hook attachment process
  takes a minimum of 30 seconds. There was no timeline
  in which both the capsule and the pilot could be saved.

  Lewis chose the pilot. History judged the capsule.
  The math vindicates the pilot."

  STATISTICS:
    Your fastest hook time: ___ seconds
    Capsule mass when hooked: ___ kg
    Outcome: ___
    Attempts: ___
    "Players who achieve hook attachment in under 15
    seconds can SOMETIMES lift the capsule in calm seas.
    Under the actual conditions (0.5 m waves, tropical
    air density), no player has saved the capsule
    in 100+ play-throughs." (Track this statistic.)

Deliverables:
  - Single HTML file, self-contained
  - < 1200 lines total
  - 60 fps animation
  - Accurate flooding and lift physics
  - Sound: helicopter rotor, water splashing, engine warning
  - Responsive layout (desktop)
```

**Key learning moment:** The moment the player hooks the capsule and sees the lift gauge go deep red -- the engine chip light flashing, the capsule pulling the helicopter down, the realization that this is not a skill problem but a MATH problem. The capsule was too heavy before the helicopter could have reached it. The game is unwinnable by design, and the student understands why Lewis had to let go.

---

### A4. Web: Harlequin Duck Turbulence Navigator

**What it is:** An interactive fluid dynamics simulation where the player controls a Harlequin Duck navigating a PNW mountain stream. The stream has rocks, rapids, eddies, and varying current velocities. The player must steer the duck through turbulent sections to reach foraging sites (caddisfly larvae on cobble), diving to the stream bottom and returning to the surface while managing energy expenditure and avoiding being swept downstream by the current.

**Specification:**

```
WEB APPLICATION: Harlequin Duck Turbulence Navigator
=====================================================

Technology: HTML5 Canvas + JavaScript (no frameworks)
Target: Modern browser, 1920x1080

GAME CONCEPT:
  The player is a Harlequin Duck on a PNW mountain
  stream during breeding season. The stream flows from
  top to bottom of the screen (or left to right). Rocks
  and boulders create eddies, rapids, and calm pools.
  The player must navigate to foraging sites, dive to
  the stream bottom, grab invertebrate prey from the
  cobble, and return to the surface -- all while
  managing energy and avoiding being swept away.

CONTROLS:
  Arrow keys: swim direction
    Up: swim against current (costs more energy)
    Down: go with current (costs less energy)
    Left/Right: lateral movement
  SPACE: dive (hold to descend, release to surface)
  SHIFT: sprint swim (2x speed, 3x energy cost)

PHYSICS:
  Stream flow:
    Base velocity: 1.5 m/s (moderate whitewater)
    Velocity varies spatially:
      - Behind boulders: 0.2 m/s (eddies, calm pockets)
      - Over shallow cobble: 2.0-2.5 m/s (rapids)
      - Deep pools: 0.5-1.0 m/s (slower)
    Visualized as flow lines (particle trails) showing
      current direction and speed

  Duck:
    Max swimming speed: 1.0 m/s (against current)
    Energy: starts at 100%, decreases with activity
      Swimming against current: -2% per second
      Swimming with current: -0.5% per second
      Diving: -3% per second (fighting buoyancy)
      Resting in eddy: +1% per second (recovery)
      Eating prey: +5% per prey item
    Buoyancy: near-neutral when submerged (~1000 kg/m^3)
      The duck descends slowly without paddling
      Must paddle to stay on the bottom (current pushes)

  Prey:
    Caddisfly larvae: attached to cobble on stream
      bottom, visible as small gold dots
    Stonefly nymphs: clinging to boulder surfaces,
      visible as brown dots (harder to reach)
    Must dive to prey location and hold position
      for 0.5 seconds to "grab" (the duck's beak
      picks the invertebrate from the cobble)

  Hazards:
    Being swept over rapids: lose 10% energy + pushed
      downstream 20 meters (must swim back)
    Exhaustion: if energy reaches 0%, the duck is swept
      downstream to the river mouth (game over)

MAIN VIEW:
  TOP-DOWN STREAM VIEW (80% of screen):
    Blue-green water with flow visualization
    (particle trails showing current direction and speed)
    Gray boulders (eddy shelter behind them)
    Brown cobble substrate (visible on stream bottom
      when the duck dives)
    The duck: blue-gray bird silhouette (surface) or
      underwater profile (when diving)
    Prey items: gold and brown dots on the bottom
    Current speed indicators: subtle arrows in the flow

  DUCK HUD (right panel, 20% of screen):
    Energy bar: 0-100% (green > yellow > red)
    Depth: surface / 0.1 m / 0.2 m / ... / 0.8 m
    Current speed at position: X.X m/s
    Prey collected: X / 20
    Swimming speed: X.X m/s
    Reynolds number: displayed in real time!
      Re = rho * v * L / mu
      Updated as the duck's speed and the surrounding
      water velocity change. The student watches the
      Reynolds number fluctuate between ~300,000 and
      ~600,000 -- always turbulent.

  PHYSICS PANEL (bottom, 10% of screen):
    Real-time force balance on the duck:
      Drag: ___ N (opposing motion)
      Propulsion: ___ N (from paddling)
      Current force: ___ N (pushing downstream)
      Buoyancy: ___ N (pushing up when submerged)
      Net force: ___ N (resultant)

OBJECTIVES:
  Collect 20 prey items before energy runs out.
  Use eddies behind boulders to rest and recover energy.
  Plan dive routes: swim to eddy → rest → dive from
    eddy to cobble → grab prey → surface in eddy → rest.

SCORING:
  - "Whitewater Expert": 20 prey, >40% energy remaining
  - "Stream Resident": 20 prey, 10-40% energy
  - "Fledgling": 10-19 prey
  - "Swept Away": <10 prey or exhaustion

POST-GAME:
  HARLEQUIN DUCK FACTS:
    "Harlequin Ducks (Histrionicus histrionicus) are
    the only North American duck species that routinely
    breeds on fast-flowing mountain streams. They forage
    by diving to the stream bottom in water that would
    wash away most other ducks. Their body is optimized
    for this environment: low profile, dense bones, legs
    positioned far aft for powerful underwater propulsion.

    Your duck swam in water with a Reynolds number of
    approximately 461,000 -- fully turbulent flow.
    Liberty Bell 7 sank through the Atlantic with a
    Reynolds number of approximately 3,989,000 -- also
    turbulent, but the capsule had no control authority.
    Your duck navigated the turbulence. The capsule
    was carried by it."

Deliverables:
  - Single HTML file, self-contained
  - < 1000 lines total
  - 60 fps animation with flow particle visualization
  - Accurate stream hydraulics (velocity field around boulders)
  - Sound: water flowing, splashing, underwater ambient
  - Responsive layout (desktop)
```

**Key learning moment:** The first time the player rests in the eddy behind a boulder and watches the flow particles stream past, then ventures out into the main current and is immediately swept downstream. The eddy is sanctuary; the main flow is a conveyor belt. The Harlequin Duck's entire survival strategy is reading the turbulence to find the eddies -- the calm pockets behind obstacles where the flow reverses and the duck can rest, forage, and recover. Liberty Bell 7 had no eddies. The Atlantic is uniform. Once the capsule started sinking, there was no calm pocket to rest in.

---

### A5. SPICE: Explosive Bolt Firing Circuit

**What it is:** A SPICE netlist modeling the electrical initiation circuit for the Mercury capsule's explosive hatch. The circuit includes the detonator cap (modeled as a resistive heating element with a temperature-dependent resistance), the MDF initiation path, the plunger-activated firing switch, and the backup electrical firing path. The simulation shows the energy delivery to the detonator under normal activation (plunger strike) and under fault conditions (stray current from salt water intrusion).

```
* MR-4 Explosive Bolt Firing Circuit
* ===================================
*
* Mercury capsule explosive hatch initiation circuit.
* The hatch uses a Mild Detonating Fuse (MDF) routed
* through 70 titanium bolts. The MDF is initiated by
* a detonator cap that can be triggered by:
*   1. Mechanical plunger (5.5 lbf / 24.5 N on firing pin)
*   2. Electrical backup (current through a bridgewire)
*
* This circuit models the ELECTRICAL path only, because
* the mechanical path (plunger → firing pin → primer)
* is not an electrical circuit. The electrical backup
* was intended for remote-commanded detonation (ground
* command in emergency). The question for Liberty Bell 7
* is whether stray electrical energy could have
* inadvertently triggered this backup path.
*
* Circuit: Bridgewire detonator with firing circuit
*
*        V_bus (+28 VDC spacecraft bus)
*          |
*        R_series (2.2 ohm, current limiting)
*          |
*        SW1 (firing relay, normally open)
*          |
*          +-------> Bridgewire (detonator)
*          |         R_bridge = 1.0 ohm
*          |         (heats to ignition temperature
*          |          of ~300 C in ~2 ms at rated current)
*          |
*         GND (spacecraft ground)
*
* Normal operation:
*   SW1 closes on ground command. Current flows:
*   I = V_bus / (R_series + R_bridge)
*     = 28 / (2.2 + 1.0)
*     = 8.75 A
*
*   Power dissipated in bridgewire:
*   P = I^2 * R = 8.75^2 * 1.0 = 76.6 W
*
*   Energy to fire: approximately 0.05 J (50 mJ)
*   Time to fire: E / P = 0.05 / 76.6 = 0.65 ms
*
*   The bridgewire heats from ambient to 300 C in
*   less than 1 millisecond, igniting the primary
*   explosive charge, which initiates the MDF.
*
* Fault condition (salt water intrusion):
*   Salt water has a resistivity of approximately
*   0.2 ohm*m. If salt water bridges the firing
*   relay contacts (even with the relay open),
*   a leakage current flows through the water:
*
*   R_salt = rho * L / A
*   For a relay gap of ~5 mm and contact area ~10 mm^2:
*   R_salt = 0.2 * 0.005 / 0.00001
*          = 100 ohm
*
*   Leakage current:
*   I_leak = V_bus / (R_series + R_salt + R_bridge)
*          = 28 / (2.2 + 100 + 1.0)
*          = 28 / 103.2
*          = 0.271 A
*
*   Power in bridgewire from leakage:
*   P_leak = 0.271^2 * 1.0 = 0.0735 W
*
*   Time to accumulate 50 mJ firing energy:
*   t_fire = 0.05 / 0.0735 = 0.68 seconds
*
*   This means: if salt water bridges the firing relay
*   for approximately 0.7 seconds continuously, the
*   bridgewire can accumulate enough thermal energy
*   to fire the detonator -- even without the relay
*   closing. The capsule was partially submerged in
*   salt water for several minutes.
*
* This analysis shows that the electrical fault pathway
* was PLAUSIBLE. Salt water intrusion into the firing
* circuit could provide sufficient energy to trigger
* the detonator without the pilot's involvement.
*
* SPICE netlist:
*
.title MR4_Explosive_Bolt_Firing_Circuit
*
* Power supply (spacecraft 28V DC bus)
Vbus VCC 0 DC 28
*
* Current-limiting resistor
R_series VCC SW_OUT 2.2
*
* --- Normal operation: firing relay closes ---
* Model the relay as a switch (0 = open, 1 = closed)
* For normal firing (uncomment to simulate):
* SW1 SW_OUT BRIDGE_TOP SMOD ON
* .model SMOD SW(RON=0.01 ROFF=1MEG VT=0.5 VH=0.1)
* Vcontrol SW_CTRL 0 PULSE(0 1 0.01 0.001 0.001 0.1 1)
*
* --- Fault condition: salt water bridging relay ---
* Model salt water as a resistor across the open relay
R_salt SW_OUT BRIDGE_TOP 100
*
* Bridgewire (detonator heater element)
R_bridge BRIDGE_TOP 0 1.0
*
* --- Thermal model of bridgewire ---
* The bridgewire is modeled as a thermal mass:
*   C_thermal * dT/dt = P_electrical - P_loss
* At the circuit level, we measure the power dissipated
* in R_bridge and integrate to get energy.
*
* Energy accumulation in bridgewire
* (Using a capacitor to integrate power is a modeling trick)
* V_energy represents accumulated energy (1V = 1J)
R_power BRIDGE_TOP ENERGY_NODE 1
C_energy ENERGY_NODE 0 1 IC=0
*
* Analysis
* Transient analysis: watch energy accumulate in bridgewire
.tran 0.01 5 UIC
*
.control
  run
  * Plot current through bridgewire
  plot I(R_bridge) title "Bridgewire Current (Salt Water Fault)"
  * Plot voltage across bridgewire (= power since R=1)
  plot V(BRIDGE_TOP) title "Bridgewire Voltage"
  * Plot energy accumulation
  plot V(ENERGY_NODE) title "Accumulated Energy in Bridgewire (J)"
  * Mark the firing threshold
  * When V(ENERGY_NODE) reaches 0.05 (50 mJ), the detonator fires
  echo "Firing threshold: 0.05 J (50 mJ)"
  echo "Check if V(ENERGY_NODE) reaches 0.05 within 5 seconds"
  wrdata mr4_bolt_firing.dat V(BRIDGE_TOP) I(R_bridge) V(ENERGY_NODE)
.endc
*
* NOTE: This is a simplified model. The actual detonator
* has a more complex thermal profile (the bridgewire loses
* heat to the explosive charge, so the net energy accumulation
* is slower than this model predicts). But the fundamental
* conclusion holds: salt water leakage current can deliver
* firing energy to the bridgewire over a timescale of seconds,
* and the capsule was in salt water for minutes.
*
.end
```

---

### A6. SPICE: Squelch Circuit -- Progressive Radio Circuit #20

**What it is:** A SPICE netlist for a carrier-operated squelch circuit. This is the twentieth circuit in the progressive radio series. The squelch circuit mutes the audio output when no signal is present, eliminating the loud hiss of amplified noise that occurs between transmissions on AM/FM/CW receivers. When a signal appears (carrier detected), the squelch opens and passes the audio. When the signal disappears, the squelch closes and mutes the output. This is the circuit that makes a radio pleasant to listen to during extended monitoring -- without squelch, the operator hears full-volume noise during every gap between transmissions.

```
* Carrier-Operated Squelch — Progressive Radio Circuit #20
* =========================================================
*
* Progressive Radio Series Circuit #20
*
* The squelch circuit monitors the receiver's noise level
* (or signal level) and mutes the audio output when no
* signal is present. This eliminates the fatiguing hiss
* between transmissions that would otherwise be amplified
* by the audio chain (v1.7) and drive the speaker at
* full noise volume.
*
* Radio Series Progress:
*   v1.2  — Transmitter (oscillator to antenna)
*   v1.3  — Receiver (antenna to detector to audio)
*   v1.4  — Mixer (RF + LO to IF)
*   v1.5  — IF Amplifier (IF to amplified, filtered IF)
*   v1.6  — AM Detector/Demodulator
*   v1.7  — Audio Amplifier + Speaker Driver
*   v1.8  — Noise Blanker / Impulse Filter
*   v1.9  — AGC (Automatic Gain Control)
*   v1.10 — S-Meter (signal strength indicator)
*   v1.11 — BFO (Beat Frequency Oscillator for CW/SSB)
*   v1.12 — Antenna Tuner (L-network impedance matching)
*   v1.13 — RF Preamplifier (low-noise front end)
*   v1.14 — Bandpass Filter (LC tuned selectivity)
*   v1.15 — Crystal Filter (quartz extreme selectivity)
*   v1.16 — AGC Time Constant (attack/release control)
*   v1.17 — Noise Blanker (pulse noise suppression)
*   v1.18 — Product Detector (SSB/CW synchronous demod)
*   v1.19 — Audio CW Filter (active bandpass for Morse)
*   v1.20 — Squelch (carrier-operated audio muting) ← THIS CIRCUIT
*
* The squelch sits between the audio chain and the speaker,
* acting as a gate:
*
*   Audio Amp → SQUELCH GATE → Speaker
*     (v1.7)    (this circuit)
*
* Principle:
*   When a signal is present, the AGC voltage (from v1.9)
*   is high (strong signal = high AGC). The squelch uses
*   this AGC voltage to control a switch: AGC above
*   threshold → audio passes. AGC below threshold → audio
*   muted.
*
*   The threshold is adjustable via a potentiometer
*   ("squelch knob" on the front panel). Turning the
*   squelch up requires a stronger signal to open the
*   gate. Turning it down opens the gate for weaker signals.
*
* Circuit: Comparator-driven JFET audio switch
*
*         AGC voltage (from v1.9 AGC circuit)
*             |
*         R_threshold (pot, 0-100k)
*             |
*             +----> Comparator (+)
*             |
*         V_ref -----> Comparator (-)
*         (adjustable threshold)
*             |
*         Comparator output: HIGH if AGC > threshold
*                            LOW if AGC < threshold
*             |
*             +----> JFET gate (Q1)
*             |
*   Audio In ----> JFET drain (Q1) ----> Audio Out
*                  JFET source → GND (through R_load)
*
*   When comparator output is HIGH: JFET conducts,
*     audio passes to speaker
*   When comparator output is LOW: JFET is off,
*     audio is muted
*
* SPICE netlist:
*
.title Squelch_Circuit_Progressive_Radio_20
*
* Power supply
Vcc VCC 0 DC 12
Vee VEE 0 DC -12
*
* === Simulated signals ===
*
* AGC voltage (simulating signal presence/absence)
* 0V = no signal (noise only), 5V = strong signal
* Pattern: no signal for 0.5s, signal for 1s, no signal for 0.5s
Vagc AGC_IN 0 PWL(0 0 0.5 0 0.501 5 1.5 5 1.501 0 2 0)
*
* Audio input (simulating audio chain output)
* 1 kHz tone mixed with broadband noise
Vsig AUDIO_SRC 0 SIN(0 0.5 1000 0 0 0)
Vnoise NOISE_SRC 0 SIN(0 0.2 7500 0 0 0)
R_mix1 AUDIO_SRC AUDIO_IN 10k
R_mix2 NOISE_SRC AUDIO_IN 10k
R_mix_gnd AUDIO_IN 0 5k
*
* === Squelch threshold ===
*
* Adjustable threshold (potentiometer)
* Set to 2.5V: signals above 2.5V AGC will open squelch
R_thresh1 VCC THRESH 47k
R_thresh2 THRESH 0 47k
* (Equal division = 6V. Adjust R_thresh2 for different thresholds)
* For 2.5V threshold with 12V supply:
* R1/(R1+R2) * 12 = 2.5 → R1=39.6k, R2=100k approximately
* Using simpler values that approximate:
* Actually: 47k/(47k+47k)*12 = 6V. Let's use proper values:
R_th_adj THRESH 0 22k
* Now threshold = 12 * 22k/(47k+22k) = 12 * 0.319 = 3.8V
* Adjusted: use R_thresh1=82k, R_thresh2=22k for ~2.5V
*
* === Comparator ===
*
* Op-amp as comparator (open-loop)
.subckt COMP INP INM OUT VCC VEE
  Rin INP INM 10MEG
  Egain MID 0 INP INM 100000
  Rout MID OUT 100
  * Clamp output to rail
  D1 OUT VCC DCLAMP
  D2 VEE OUT DCLAMP
  .model DCLAMP D(IS=1e-14 N=1)
.ends
*
* AGC input to non-inverting (+), threshold to inverting (-)
X_comp AGC_IN THRESH COMP_OUT VCC VEE COMP
*
* === JFET Audio Switch ===
*
* N-channel JFET as audio gate
* When COMP_OUT is high (>0V): JFET conducts (audio passes)
* When COMP_OUT is low (<0V): JFET is off (audio muted)
*
* Gate drive with voltage divider to match JFET Vgs requirements
R_gate COMP_OUT GATE_DRIVE 10k
R_gate_bias GATE_DRIVE 0 10k
*
J1 AUDIO_IN GATE_DRIVE SQUELCH_OUT NJF_SWITCH
.model NJF_SWITCH NJF(VTO=-3.0 BETA=2m LAMBDA=0.01 IS=1e-14)
*
* Output load (to speaker/audio amp)
R_out SQUELCH_OUT 0 10k
*
* === Analysis ===
*
.tran 0.01m 2 UIC
.control
  run
  * Plot AGC input (signal presence)
  plot V(AGC_IN) title "AGC Voltage (Signal Presence)"
  * Plot audio input (always present: signal + noise)
  plot V(AUDIO_IN) title "Audio Input (Signal + Noise)"
  * Plot squelch output (muted when no signal)
  plot V(SQUELCH_OUT) title "Squelch Output (Muted/Open)"
  * Plot comparator output (gate control)
  plot V(COMP_OUT) title "Comparator Output (Squelch Control)"
  *
  * The key observation:
  * V(AUDIO_IN) shows signal+noise at all times
  * V(SQUELCH_OUT) shows signal ONLY during t=0.5-1.5s
  *   (when AGC indicates signal present)
  * During t=0-0.5s and t=1.5-2.0s: output is muted
  *   (JFET off, no audio passes)
  *
  wrdata squelch_output.dat V(AGC_IN) V(AUDIO_IN) V(SQUELCH_OUT)
.endc
*
* Mercury telemetry context:
* The Mercury ground stations used squelch circuits on
* their tracking receivers. During each Mercury mission,
* the capsule's radio signal was received by a chain of
* ground stations around the world. Between stations,
* or during signal fade, the receivers would output pure
* noise at full volume through the headsets of the CAPCOM
* operators. Without squelch, the noise was deafening and
* fatiguing over a 15-minute (suborbital) or multi-hour
* (orbital) mission. The squelch circuit -- identical in
* principle to this one -- muted the headsets during
* signal loss and opened them when the capsule's signal
* was reacquired.
*
* On MR-4, the ground stations maintained contact with
* Liberty Bell 7 throughout the flight. After splashdown,
* the capsule's antenna went underwater as the capsule
* sank, and the ground stations lost signal. The squelch
* closed. The last telemetry from Liberty Bell 7 was
* silence -- the squelch muting a signal that was no
* longer there because the antenna was 4,900 meters
* below the surface.
*
.end
```

---

## B. Machine Learning -- What to Train

### B1. Fault Classification from Sensor Telemetry

**What it is:** Train a classifier to distinguish between "normal operation," "thermal anomaly," "electrical fault," and "mechanical impact" from simulated capsule telemetry data. The model learns the signatures of each failure mode: thermal anomalies produce slowly drifting temperature readings, electrical faults produce spike patterns in current measurements, and mechanical impacts produce sharp transients in accelerometer data.

```
Model: Multi-class classifier (CNN or Random Forest)

Input:
  - Time series of capsule sensor readings
  - Window size: 10 seconds at 100 Hz = 1000 samples
  - Features per sample:
    - temperature_hatch_frame: continuous (C)
    - temperature_detonator: continuous (C)
    - current_firing_circuit: continuous (mA)
    - accelerometer_x: continuous (g)
    - accelerometer_y: continuous (g)
    - accelerometer_z: continuous (g)
    - voltage_bus: continuous (V)
    - humidity_internal: continuous (%)

Output:
  - P(normal): nominal post-splashdown operation
  - P(thermal): thermal anomaly (rising temperatures)
  - P(electrical): electrical fault (current spikes)
  - P(mechanical): mechanical impact (accel transient)
  - Confidence: max(probabilities)

Training data:
  - Simulated 10-second windows from:
    - Normal: capsule floating, gentle wave motion,
      temperatures stable, no electrical anomalies
    - Thermal: gradual temperature rise in hatch frame
      and detonator, consistent with solar heating
    - Electrical: random current spikes in the firing
      circuit, consistent with salt water intrusion
    - Mechanical: sharp acceleration transient consistent
      with a 24.5 N impact on the plunger area
    - Combined: thermal + electrical (realistic scenario)
  - 5,000 windows per class

Architecture:
  - 1D CNN: Conv1D(16, k=7) -> Conv1D(32, k=5) ->
    Conv1D(64, k=3) -> GlobalAvgPool -> FC(32) -> FC(4)
  - Or: Random Forest on engineered features:
    temp_slope, current_max, accel_peak, voltage_variance,
    humidity_mean (5 features from each window)

Expected results:
  - Classification accuracy >90% for clean cases
  - Thermal vs electrical confusion ~15% (both produce
    slowly evolving signatures that overlap)
  - Mechanical impact is the EASIEST to classify
    (sharp, distinctive transient) -- which means
    the ABSENCE of a mechanical signature in the
    actual data is significant evidence against
    the "pilot struck the plunger" hypothesis

Libraries: scikit-learn or torch, numpy, matplotlib
GPU: Optional (small model)
Difficulty: Intermediate
Duration: 3-4 hours
```

---

## C. Computer Science -- Failure Mode and Effects Analysis

### C1. FMEA for Recovery Systems

The loss of Liberty Bell 7 was a failure of recovery system design, not flight system design. A Failure Mode and Effects Analysis (FMEA) systematically identifies every component that can fail, how it can fail, what happens when it fails, and how severe the consequence is. Applied to the MR-4 recovery sequence, FMEA reveals the explosive hatch as a high-severity, under-mitigated single point of failure.

```
CONCEPT: FMEA Applied to Mercury Recovery

THE MERCURY RECOVERY CHAIN:
  1. Splashdown → capsule intact and floating
  2. Antenna deployment → helicopter can locate capsule
  3. Dye marker release → visual identification
  4. Helicopter approach → positions over capsule
  5. Swimmer deployment → attaches collar and sling
  6. Hook attachment → helicopter connected to capsule
  7. Hatch detonation → astronaut exits
  8. Helicopter lift → capsule recovered

FMEA TABLE:

| Step | Component | Failure Mode | Effect | Severity | Detection | Mitigation (1961) |
|------|-----------|-------------|--------|----------|-----------|-------------------|
| 1 | Heat shield | Burn-through | Capsule destroyed | 10 | Pre-flight inspection | Ablative design, ground test |
| 1 | Structure | Hull breach | Flooding | 8 | Post-splashdown visual | Structural margins |
| 2 | Antenna | Fails to deploy | Delayed location | 4 | Radio check | Backup visual search |
| 3 | Dye marker | Fails to release | Harder to spot | 3 | Visual check | Multiple markers |
| 4 | Helicopter | Engine failure | Delayed recovery | 6 | Engine instruments | Backup helicopter |
| 5 | Swimmer | Injury/fatigue | Delayed attachment | 4 | Visual monitoring | Backup swimmer |
| 6 | Sling | Attachment failure | Cannot lift | 7 | Visual confirmation | Redundant sling |
| 7 | Explosive hatch | PREMATURE DETONATION | CAPSULE FLOODS AND SINKS | 10 | NONE | NONE |
| 7 | Explosive hatch | Fails to fire | Astronaut trapped | 9 | Pilot reports | Backup mechanical release |
| 8 | Helicopter | Overload | Must release capsule | 8 | Engine instruments | Larger helicopter |

The FMEA reveals the explosive hatch as the highest-risk
component in the recovery chain:
  - Severity: 10 (maximum -- total loss of capsule)
  - Detection: NONE (no sensor or indicator warned of
    impending premature detonation)
  - Mitigation: NONE (no backup sealing mechanism, no
    way to close the hatch once opened, no bilge pump,
    no secondary flotation for an open capsule)

The Risk Priority Number (RPN) for premature hatch
detonation:
  RPN = Severity * Occurrence * Detection
  
  Severity: 10 (capsule lost)
  Occurrence: 3 (unlikely but not impossible -- thermal
    and electrical vulnerabilities existed)
  Detection: 10 (no warning before the event)
  
  RPN = 10 * 3 * 10 = 300

Any RPN above 100 typically requires immediate design
action. The hatch system had an RPN of 300 -- well
above the action threshold. If this FMEA had been
performed before MR-4 with accurate occurrence
estimates, the hatch system would have been flagged
for redesign before the flight.

EXERCISE:
  Perform an FMEA on a software system you use or
  maintain. Identify the top-5 highest-RPN failure
  modes. For each:
  1. What is the severity? (1-10)
  2. How likely is it? (1-10)
  3. Can you detect it before it causes damage? (1-10)
  4. What mitigation exists?
  5. What mitigation SHOULD exist?

  The Liberty Bell 7 lesson: the component with the
  highest RPN is the component most likely to destroy
  the mission. Find it before it finds you.
```

---

## D. Creative Arts -- What to Compose, Write, and Render

### D1. GLSL Shader: "4,900 Meters"

A fragment shader that renders the view from Liberty Bell 7's perspective as it sinks through the Atlantic -- from the bright, sunlit surface waters through the twilight zone and into the abyssal darkness. The ocean depth is represented as diminishing light: bright blue-green at the surface, fading to dark blue at 200 meters (the end of the photic zone), to midnight blue at 1000 meters, to pure black at 4,900 meters. The capsule's shape is visible only as long as light penetrates -- by 1,000 meters, only the faintest bioluminescent flickers illuminate the frame. At 4,900 meters, the screen is black except for the pressure reading.

```
SHADER SPECIFICATION: "4,900 Meters"

Resolution: 1920x1080
Palette: Ocean depth gradient — sunlit surface to abyssal black

Layers:
  1. Water column:
     - The background is a vertical gradient representing
       depth (mapped to time):
       0 m (t=0): bright turquoise-blue, sun rays visible
         from above, dancing caustics on the capsule surface
       50 m (t=14s): darker blue, sun still visible but dimmer
       200 m (t=57s): deep blue, no direct sunlight, diffuse
         blue glow from above. This is the bottom of the
         photic zone — the deepest light penetrates
       500 m (t=143s): near-black blue, barely any light.
         Occasional bioluminescent flicker (random bright dots
         that appear and fade in 0.5 seconds)
       1000 m (t=286s): black with rare bioluminescence.
         The capsule shape is now only visible as a dark
         silhouette against the faintest background glow
       2000 m (t=571s): absolute black. No bioluminescence.
         Only the depth counter illuminates the screen.
       4900 m (t=1400s): the ocean floor. A faint gray
         texture appears below — sediment, the abyssal
         plain. The capsule settles into the mud.

  2. Capsule silhouette:
     - The Mercury capsule shape (cone with heat shield base)
       rendered as a dark outline against the water
     - Visible in the upper depths (0-500 m) as a solid shape
     - Fading into the darkness below 500 m
     - Small air bubbles trail upward from the open hatch
       (decreasing in number with depth as trapped air
       is compressed)

  3. Depth counter:
     - Lower right corner: white text on dark background
       "DEPTH: XXXX m"
       "PRESSURE: XXX atm"
       Updates continuously as the capsule sinks
     - At 4,900 m: the counter stops and holds

  4. Particle effects:
     - Marine snow: tiny white particles drifting upward
       relative to the sinking capsule (actually the
       particles are stationary; the capsule is sinking
       past them). Density increases with depth (more
       detritus in the water column below the photic zone).
     - Bioluminescence: random brief flashes (200-800 ms)
       of blue-green light in the 300-1000 m range.
       These are real organisms: dinoflagellates, jellyfish,
       lanternfish, all disturbed by the passing capsule.

  5. Animation:
     - Total duration: maps to ~23 minutes of real sinking
       time, compressed to 2-3 minutes of shader time
     - The pace is slow, relentless, hypnotic
     - The emotional arc: bright → dim → dark → black
     - At the end: the capsule hits bottom with a soft
       impact (slight vibration of the screen), sediment
       billows up (brown-gray particles), and then
       settles. The depth counter reads "4,900 m / 493 atm."
       Then: "July 21, 1961 — July 20, 1999"
       (the dates of sinking and recovery, 38 years apart)

  6. Sound (if implemented as web shader):
     - Deep ambient drone, decreasing in frequency with depth
     - The sound of pressure: a sub-bass hum that grows
       as depth increases, felt more than heard
     - At the surface: water rushing through the hatch
     - At depth: silence except the drone
     - At impact: a low, muffled thud
```

---

### D2. Short Story: "The Bell"

A creative nonfiction account of the Liberty Bell 7 hatch failure and its aftermath, from Grissom's perspective. The story covers the moment the hatch blew through the five minutes in the water, focusing on Grissom's sensory experience and decision-making under drowning stress.

```
STORY SPECIFICATION: "The Bell"

Perspective: First person, Grissom's voice. Present tense
  during the water sequence. Past tense for reflection.
  The voice is an engineer's voice: precise, observational,
  understated. Grissom was not a poet. He was a man who
  described things in terms of what they were, not what
  they symbolized.

Tone: Calm, technical, with undercurrents of controlled fear.
  Grissom was famously laconic. His descriptions are short
  sentences, concrete observations, engineering assessments
  even while drowning.

Structure:
  Each section is keyed to an event and elapsed time
  from hatch detonation:

  1. T+0:00 — THE BANG
     The hatch goes. No warning. One instant the capsule
     is sealed and I am going through the post-landing
     checklist, the next instant there is a hole where
     the hatch was and the Atlantic Ocean is coming
     through it. The bang is sharp — not the rumble of
     the engine, not the roar of reentry. A crack. Like
     a rifle. And then water.

  2. T+0:03 — ASSESSMENT
     Water on my boots. Rising fast. I can see the sky
     through the hatch opening — blue sky, helicopter
     rotor. The water is warm. This is the tropics.
     The water is warm and it is filling my spacecraft
     and I need to leave.

  3. T+0:08 — EGRESS
     Harness release. Both hands. The buckle opens clean.
     I push myself up from the couch. The water is at
     my waist. Through the hatch. The opening is just
     wide enough in the suit. My helmet clips the frame.
     Then I am outside, in the ocean, and the capsule
     is behind me, settling lower in the water with
     every second.

  4. T+0:15 — THE SUIT
     The suit is not a swimsuit. It weighs — I can feel
     it pulling me down. The neck dam is open. I left
     the oxygen inlet unsealed. Water is coming into the
     suit through the inlet. Every second the suit gets
     heavier. I need to inflate the vest.

  5. T+0:30 — THE VEST
     The life vest inflation tube is under the suit's
     outer layer. I find it. I pull it. Partial inflation.
     The vest is holding some air but it is not enough.
     The suit is still taking on water. I am treading
     water in a suit that is trying to drown me.

  6. T+1:00 — THE HELICOPTER
     The helicopter is not coming for me. It is going
     for the capsule. I can see the hook swinging down
     toward Liberty Bell 7, which is barely floating now
     — the hatch is underwater, the dye marker is a
     green ring spreading around the sinking cone.
     The helicopter hooks the capsule. I hear the engine
     pitch change — straining. The chip light must be on.
     They are going to lose that helicopter if they do
     not let go of my spacecraft.

  7. T+2:00 — SWIMMING
     Treading water. The rotor wash is making waves.
     Each wave pushes water into my face. The suit is
     heavy. My arms are tired. This is not how test
     pilots are supposed to die — not in the water,
     not after a successful flight, not because a
     hatch blew that I did not touch.

  8. T+3:00 — THE CUT
     The helicopter lets go of the capsule. I watch it
     sink. The green dye swirls around the place where
     it was. The helicopter pulls up, engine screaming,
     and banks away. A second helicopter is coming in.
     I wave. I am still here. The capsule is gone.

  9. T+5:00 — THE SLING
     The second helicopter lowers a rescue sling. I grab
     it. They hoist me up. I am dripping salt water from
     a suit that weighs twice what it should. My hands
     are not bruised. I did not touch the plunger. The
     hatch blew itself.

  10. AFTER
     They will ask me for years whether I panicked and
     hit the plunger. The answer will always be the same:
     no. My hands are clean. The physics is on my side.
     The engineering is on my side. The institution is not.

     I named the capsule Liberty Bell. I painted a crack
     on the side — an homage to the original, which
     cracked during its first public ringing. I thought
     the crack was honest. A bell that announces its
     own imperfection. A spacecraft that does the same.

     The bell sank. I did not.

     Hemingway wrote: "A man can be destroyed but not
     defeated." He was born today, 62 years before my
     flight, and he died 19 days before it. I did not
     know that when I launched. I know it now. He would
     have understood the water. He would have understood
     the sharks — the reporters, the officials, the
     people who needed someone to blame besides the
     machine. Santiago lost the marlin to the sharks
     and sailed home with a skeleton. I lost the capsule
     to the ocean and flew home with my reputation
     stripped to bone.

     But I will fly again. Gemini. Apollo. The Moon,
     if they let me. A man can be destroyed but not
     defeated. The bell sank. The man swam.

Length: 2,500-3,500 words

Provide as: HTML + LaTeX

HTML version:
  Self-contained HTML file with styled prose.
  Font: serif (Georgia or system serif)
  Max width: 700px, centered
  Title page with mission name (CSS-drawn cracked bell
    shape with "Liberty Bell 7" and date)
  Each section as a chapter with elapsed time
  Print-friendly CSS

LaTeX version:
  article class, 12pt
  Title: "The Bell"
  Subtitle: "Mercury-Redstone 4 / Liberty Bell 7 — July 21, 1961"
  Author: "NASA Mission Series v1.20"
  Sections numbered by elapsed time
  Typeset for A4 or letter paper
```

---

### D3. FAUST Synth: Liberty Bell 7 Splashdown

A FAUST DSP program that synthesizes the sound of Liberty Bell 7's splashdown and hatch failure: the impact with the Atlantic, the slosh of waves against the hull, the CRACK of the explosive bolts (a sharp, metallic detonation), the rush of water through the open hatch, and the slow, deep descent into the ocean as the capsule sinks. The synthesis transitions from chaotic surface sounds to the deep, pressurized silence of the abyss.

```
FAUST SPECIFICATION: "Liberty Bell Splashdown"

Output: Stereo audio, 48 kHz, 180 seconds duration
Tempo: Real-time (1 second = 1 second of event)

Synthesis chain:
  1. Splashdown impact (T+0:00):
     - Broadband noise burst (white noise, shaped by
       a 50 ms exponential envelope)
     - Low-frequency thud: sine wave at 40 Hz, 100 ms
       duration, shaped by an exponential decay
     - The combined sound: WHUMP-SPLASH -- heavy,
       metallic impact followed by water displacement
     - Amplitude: high (the loudest moment)

  2. Surface floating (T+0:01 to T+0:30):
     - Wave sounds: filtered noise at 100-500 Hz,
       modulated by a slow LFO at 0.15 Hz (wave period
       ~6 seconds)
     - Hull sounds: metallic pings and creaks as the
       capsule cools and adjusts to the water
       (random impulses through a resonant bandpass
       at 200-400 Hz, rate ~2 per second)
     - Communication chatter: filtered noise simulating
       radio squelch (a brief burst of broadband hiss
       followed by silence, repeated every 5-10 seconds)

  3. Hatch detonation (T+0:30):
     - THE CRACK: sharp transient, extremely fast attack
       (< 1 ms rise time), filtered through a high-pass
       at 2 kHz (the detonation sound is metallic and
       bright, not bass-heavy like an explosion)
     - Echo: the crack reverberates off the water surface
       and the helicopter above (short reverb, ~200 ms
       decay)
     - Immediately followed by:

  4. Flooding (T+0:31 to T+1:30):
     - Water rush: broadband noise filtered through a
       resonant lowpass at 300-800 Hz, with amplitude
       proportional to the flow rate (~100 L/s)
     - The sound of water pouring into an enclosed
       metal space: hollow, echoey, increasingly muffled
       as the interior fills
     - Bubbling: random impulse train through a
       bandpass at 500-2000 Hz (air escaping from the
       capsule as water displaces it)
     - Amplitude decreases as the hatch submerges:
       when the opening goes underwater, the pouring
       sound becomes a gurgle, then silence

  5. Sinking (T+1:30 to T+3:00):
     - Deep ambient: low-frequency drone at 20-30 Hz,
       slowly decreasing in frequency as the capsule
       descends (representing increasing pressure and
       the deepening water column)
     - Hull compression: occasional metallic groans
       (sine waves at 100-200 Hz with slow pitch bend
       downward, representing structural stress under
       increasing pressure)
     - Marine sounds: faint clicks and pops (random
       impulses at very low amplitude) representing
       biological sounds in the water column -- shrimp
       snapping, distant whale calls (filtered noise
       bursts at 50-500 Hz, rate decreasing with depth)
     - The overall arc: from loud, chaotic surface
       sounds to deep, quiet, pressurized silence

  6. Impact with ocean floor (T+3:00):
     - Deep thud: sine wave at 15 Hz, 500 ms duration,
       slow exponential decay (the capsule hitting soft
       sediment 4,900 m below the surface)
     - Muffled settling sounds: very quiet noise bursts
       (sediment displacement)
     - Then: silence. The drone fades to nothing.
       The capsule is at rest.

Parameters:
  - splash_amplitude: 0-1 (default 0.8)
  - wave_period_s: 4-10 (default 6)
  - crack_frequency_hz: 1000-5000 (default 3000)
  - flood_rate: 0-1 (default 0.8, proportional to 100 L/s)
  - depth_drone_hz: 15-40 (default 25, decreasing with time)
  - duration_s: 120-300 (default 180)
```

---

### D4. FAUST Synth: Harlequin Duck Whitewater

A FAUST DSP program that synthesizes the soundscape of a Harlequin Duck's habitat: a PNW mountain stream in breeding season. Fast-flowing water over cobble, the duck's soft calls, the ambient forest sounds around the stream, and the distinctive underwater perspective when the duck dives -- the low-frequency rumble of current against rocks, the muffled quality of submerged hearing.

```
FAUST SPECIFICATION: "Whitewater Harlequin"

Output: Stereo audio, 48 kHz, 60 seconds duration
Tempo: Real-time

Synthesis chain:
  1. Stream flow (continuous):
     - Broadband noise (white noise into pink filter)
       representing water flowing over cobble
     - Center frequency: 800-2000 Hz (determined by
       flow velocity and cobble size)
     - Amplitude modulated by a slow random LFO
       (0.1-0.5 Hz) representing turbulent fluctuations
     - Stereo panning: left channel slightly louder
       (stream flows left to right in the stereo field)
     - Higher flow velocity sections: higher center
       frequency, higher amplitude (rapids)
     - Eddy sections: lower frequency, lower amplitude,
       more reverberant (calm pockets behind boulders)

  2. Rock splash (periodic):
     - Water hitting exposed rocks: short noise bursts
       (50-200 ms) through a bandpass at 1-3 kHz
     - Rate: 3-8 per second (irregular, random timing)
     - Each splash is slightly different (random
       filter center frequency and amplitude)
     - Creates the characteristic "chattering" sound
       of a PNW mountain stream

  3. Harlequin Duck calls (periodic):
     - The Harlequin Duck's call is a high-pitched,
       squeaky whistle: "wee-wee-wee" or a nasal
       "eek" sound
     - Modeled as: narrow-band filtered noise at
       2-4 kHz, with an amplitude envelope of 200 ms
       repeated 2-3 times per call
     - Call rate: one call every 8-15 seconds
     - Stereo position: moves slightly (the duck is
       swimming in the stream)

  4. Forest ambient (continuous):
     - Low-amplitude broadband noise (300-5000 Hz)
       representing wind in conifer canopy
     - Occasional bird calls in the 3-6 kHz range
       (other species: Winter Wren, Pacific-slope
       Flycatcher -- common PNW riparian birds)
     - Very quiet rain-on-leaves texture (filtered
       impulse train at 10-30 Hz)

  5. Dive sequence (T+30 to T+40):
     - At T+30: transition to underwater perspective
     - The stream sound becomes muffled: lowpass filter
       sweeps from 4 kHz down to 500 Hz over 0.5 seconds
       (representing the duck submerging)
     - Underwater sounds: deep rumble (water flowing
       over cobble heard from below, 50-200 Hz),
       rock clicks (cobble shifting, brief impulses),
       muffled flow noise
     - The duck's paddling: rhythmic low-frequency
       pulses at ~4 Hz (foot strokes)
     - At T+40: transition back to surface
     - The lowpass filter sweeps back up from 500 Hz
       to 4 kHz (the duck surfaces)
     - Splash sound: short broadband burst

Timeline:
  0-10s:   Stream ambient, forest sounds, calm section
  10-20s:  Rapids section (louder, higher frequency flow)
  20-30s:  Eddy section (quieter, duck call)
  30-40s:  Dive sequence (underwater perspective)
  40-50s:  Surface, rapids section
  50-60s:  Eddy, duck call, fade to ambient
```

---

### D5. Circuit: Underwater Pressure Sensor

A hardware circuit using a BMP280 barometric pressure sensor and an Arduino Nano to measure and display simulated ocean depth. The syringe-and-tubing interface allows the student to manually vary pressure and watch the depth reading change. The display shows equivalent ocean depth, pressure in atmospheres, and a comparison to Liberty Bell 7's resting depth.

(Full specification in curriculum.md, DIY Projects section.)

---

### D6. Circuit: Analog Depth Indicator (LED Bar)

A hardware circuit that drives a bar of 12 LEDs to indicate simulated ocean depth, driven by an analog input (potentiometer simulating a depth sensor). Each LED represents approximately 400 meters of depth, with color coding representing ocean zones: blue (0-200 m, sunlit), dark blue (200-1000 m, twilight), purple (1000-4000 m, midnight), red (4000-4900 m, abyss). The circuit uses an LM3914 dot/bar display driver with a custom reference to map 0-5V input to 0-4900 m depth.

```
CIRCUIT: Analog Depth Indicator (LED Bar)

Components:
  1x LM3914 dot/bar display driver IC (~$3)
  12x LEDs: 3 blue, 3 dark blue (or blue with resistor
    for dimming), 4 purple (or blue+red), 2 red (~$2)
  1x 10k potentiometer (depth input simulation, ~$0.50)
  1x 1k resistor (LED current set)
  1x 10k resistor (reference divider)
  9V battery or USB power supply

The LM3914 drives 10 LEDs internally. For 12 LEDs,
cascade a second LM3914 or use 10 LEDs representing:
  LED 1:  0-490 m (blue, sunlit zone)
  LED 2:  490-980 m (blue, twilight zone)
  LED 3:  980-1470 m (dark blue, below photic zone)
  LED 4:  1470-1960 m (dark blue, bathypelagic)
  LED 5:  1960-2450 m (purple, abyssal transition)
  LED 6:  2450-2940 m (purple, abyssal)
  LED 7:  2940-3430 m (purple, abyssal)
  LED 8:  3430-3920 m (purple, deep abyssal)
  LED 9:  3920-4410 m (red, near-hadal)
  LED 10: 4410-4900 m (red, Liberty Bell 7 depth)

Wiring:
  Pin 5 (signal input): from potentiometer wiper
  Pin 3 (V+): to 9V
  Pin 2 (V-): to ground
  Pin 6 (reference low): to ground
  Pin 7 (reference high): to 4.9V (set by divider,
    so full scale = 4900 m)
  Pin 9 (mode): to V+ for bar mode
  Pins 1, 10-18: to LED anodes

The potentiometer simulates a depth sensor:
  Full CCW (0V): surface (0 m)
  Half turn: ~2450 m (LEDs 1-5 lit, blue to purple)
  Full CW: ~4900 m (all 10 LEDs lit, including
    the two red LEDs at the bottom of the bar)

Demonstration:
  1. Start at surface: no LEDs lit (0 m)
  2. Slowly rotate CW: LEDs light sequentially
     from top (blue) to bottom (red)
  3. At LED 3 (~1470 m): "Giant Pacific Octopus
     maximum depth — approximately here"
  4. At LED 10 (~4900 m): "Liberty Bell 7 rests here"
     All 10 LEDs lit — the full depth column illuminated

Mercury connection:
  Liberty Bell 7 experienced the entire depth column
  in approximately 23 minutes of sinking. This LED bar
  represents that descent: from the sunlit surface
  where Grissom swam for his life, through the twilight
  where bioluminescent organisms flickered past the
  falling capsule, into the absolute darkness where
  no light has ever penetrated, to the abyssal sediment
  where the capsule rested for 38 years.

Total cost: ~$8
Difficulty: Beginner
Build time: 1-2 hours
```

---

## E. Problem-Solving Methodology -- Designing for Failure

### E1. The Failure-Mode-First Design Approach

Liberty Bell 7 was lost because the explosive hatch was designed for nominal operation (astronaut triggers hatch after helicopter hooks up) without adequate analysis of off-nominal scenarios (hatch triggers itself due to environmental factors). A failure-mode-first design approach inverts the process: start with the ways the system can fail, then design the system to prevent or mitigate those failures.

```
METHODOLOGY: Failure-Mode-First Design

THE INVERSION:
  Traditional design: "How do we make it work?"
  Failure-mode-first: "How can it break?"

  Traditional design starts with the success path:
  design the hatch to open when the astronaut presses
  the plunger. Test that it opens. Ship it.

  Failure-mode-first starts with the failure modes:
  What can cause the hatch to open when it shouldn't?
  - Temperature changes
  - Vibration
  - Electrical faults
  - Accidental pilot contact
  - Corrosion
  - Manufacturing defect
  For each failure mode: how do we prevent it? How do
  we detect it? How do we mitigate it if it occurs?

THE LIBERTY BELL 7 DESIGN, REDESIGNED:

  PREVENTION:
  - Thermally insulate the MDF from the hatch frame
    (reduces temperature sensitivity)
  - Add a second, independent safety interlock between
    the plunger and the initiator (requires TWO
    deliberate actions to fire)
  - Shield the electrical firing path from salt water
    (conformal coating, sealed connectors)
  - Add a mechanical lock that physically prevents
    the plunger from moving until released by the pilot

  DETECTION:
  - Temperature sensor on the hatch frame, alarming if
    T > 35 C (threshold for reduced margin)
  - Current monitor on the firing circuit, alarming if
    any leakage current is detected
  - Plunger position sensor, reporting to telemetry
    whether the plunger has been disturbed

  MITIGATION:
  - If the hatch blows prematurely: automatic
    inflation of a secondary flotation collar around
    the hatch opening (seals the opening, prevents
    flooding)
  - If the capsule floods: bilge pump activated
    automatically when water sensor triggers
  - If the capsule is unliftable: pre-positioned
    inflatable pontoon that deploys from the capsule
    exterior (adds buoyancy independent of hull
    integrity)

  Each mitigation layer reduces the severity of the
  failure. Prevention is best (stop the failure).
  Detection is second (warn before the failure).
  Mitigation is last (survive the failure).

APPLICATION TO SOFTWARE:

  Replace "explosive hatch" with "database delete
  operation" or "authentication bypass" or "payment
  processing" -- any operation where failure has
  severe consequences.

  For each critical operation:
  1. List every way it can be triggered incorrectly
  2. For each incorrect trigger: add a prevention
     (input validation, confirmation step, rate limit)
  3. For each prevention: add detection (logging,
     monitoring, alerting)
  4. For each detection: add mitigation (rollback,
     backup, circuit breaker)

  The goal is not to prevent all failures (impossible).
  The goal is to ensure that no single failure
  propagates to total system loss -- which is exactly
  what happened to Liberty Bell 7 when a single hatch
  failure cascaded to capsule loss because there was
  no prevention, no detection, and no mitigation.
```

---

## F. GSD Improvements -- What to Build for gsd-skill-creator

### F1. Failure Mode Analysis Chipset

The Liberty Bell 7 loss demonstrates the cost of not analyzing failure modes before deployment. A failure mode analysis chipset for gsd-skill-creator would systematically identify how each agent, each workflow, and each data path can fail -- before the failure occurs.

```
CHIPSET: Failure Mode Analysis

Purpose: Systematically identify and mitigate failure
  modes in agent workflows BEFORE they execute.

Chips:
  1. fmea-scanner: Before a workflow executes, scan
     its steps for potential failure modes. For each
     step: what inputs could be invalid? What outputs
     could be incorrect? What dependencies could be
     unavailable? What side effects could be harmful?
     Generate an FMEA table with Severity, Occurrence,
     and Detection ratings for each failure mode.

  2. cascade-analyzer: For each failure mode identified
     by fmea-scanner, trace the cascade: if this step
     fails, what downstream steps are affected? Which
     outputs become invalid? Can the workflow recover,
     or is it a total loss (like Liberty Bell 7)?
     Generate a cascade graph showing which failures
     propagate and which are contained.

  3. mitigation-planner: For each high-RPN failure mode,
     propose a mitigation: retry logic, fallback path,
     checkpoint/rollback, or human escalation. The
     mitigation should reduce either the Severity
     (make the failure less damaging), the Occurrence
     (make the failure less likely), or the Detection
     (make the failure detectable earlier).

  4. pre-flight-check: Before ANY agent executes a
     critical workflow, run the fmea-scanner on the
     planned execution path and abort if any failure
     mode exceeds the RPN threshold. This is the
     pre-flight review that Liberty Bell 7 needed for
     its explosive hatch: a systematic check that asks
     "what can go wrong?" before the answer becomes
     "everything."

Application:
  - Liberty Bell 7's lesson: the system that does not
    analyze its failure modes before execution will
    discover them during execution, at the worst
    possible time, with the least possible preparation.
  - The cost of pre-flight analysis: minutes of
    computation. The cost of in-flight failure: a
    capsule at the bottom of the ocean.
```

### F2. Adaptive Response Pattern (Octopus Architecture)

The Giant Pacific Octopus's distributed neural architecture -- semi-autonomous arms coordinated by a central brain -- is a proven biological pattern for distributed problem-solving. An adaptive response pattern for gsd-skill-creator agents would distribute decision-making authority to the agents closest to the problem, with central coordination for strategy.

```
CHIPSET: Octopus Architecture (Distributed Adaptive Response)

Purpose: Distribute decision-making authority to the
  agents closest to the problem, with central coordination
  for strategy and conflict resolution.

Chips:
  1. arm-autonomy: Each agent (arm) has authority to
     make local decisions without central approval.
     If an agent encounters a problem within its scope
     (a build error, a test failure, a missing file),
     it handles it autonomously: retry, fix, work around.
     It reports the decision to the coordinator after
     the fact, not before. This mirrors the octopus
     arm's ability to grasp, release, and manipulate
     without consulting the central brain.

  2. brain-strategy: The coordinator (brain) sets
     high-level goals and monitors aggregate progress.
     It does not micromanage arm-level decisions. It
     intervenes only when: (a) two arms conflict
     (two agents trying to modify the same file),
     (b) an arm reports a problem beyond its scope,
     or (c) the aggregate progress is behind schedule.
     This mirrors the octopus brain's role: strategic
     direction, not tactical control.

  3. severed-arm-protocol: If an agent loses contact
     with the coordinator (network failure, timeout,
     coordinator crash), the agent continues its
     current task autonomously, buffers its results
     locally, and attempts to reconnect periodically.
     It does not stop working. This mirrors the
     severed octopus arm that continues to grasp
     and respond to stimuli for several minutes
     after separation from the body.

  4. chemoreception: Each agent continuously samples
     its local environment (file system state, test
     results, resource availability) and builds a
     model of what it can "taste" -- what is near,
     what is accessible, what has changed. This
     environmental awareness allows the agent to
     make informed local decisions without asking the
     coordinator to survey the environment for it.
     The octopus arm's suckers taste what they touch;
     the agent's sensors taste what they can read.

Application:
  - The octopus achieves complex coordinated behavior
    (maze navigation, jar opening, tank escape) through
    distributed intelligence: each arm contributes
    local solutions to a global problem.
  - gsd-skill-creator agents can achieve complex
    coordinated work (multi-file refactors, parallel
    test execution, distributed documentation) through
    the same pattern: autonomous arms, strategic brain,
    graceful degradation when connections fail.
```

---

*"Hemingway wrote the old man and the sea because he understood that the ocean does not negotiate. Santiago's marlin was magnificent -- the biggest fish of his life, the fish that proved he was still a fisherman, the fish that validated 84 days of empty nets. And the sharks took it anyway. Not because Santiago was weak, not because he fought poorly, not because the universe was punishing him for hubris. The sharks came because blood in the water attracts sharks. That is the physics. The marlin bled because Santiago's harpoon was sharp. The sharpness that killed the fish invited the sharks. The success created the conditions for the loss. Grissom's flight was successful -- nominal trajectory, clean reentry, perfect splashdown. The success validated the explosive hatch: it had worked on MR-3 (Shepard never needed it, but it was there, ready). The confidence bred by success reduced the urgency of analyzing the hatch's failure modes. If it worked on MR-3, it will work on MR-4. It did not work on MR-4. The sun heated the capsule. The salt water crept into the wiring. The MDF system, designed with insufficient margin against environmental activation, fired itself. The marlin bled and the sharks came. The hatch blew and the ocean came. Neither Santiago nor Grissom caused the thing that destroyed their prize. Both fought with everything available. Both lost. Both survived. The Giant Pacific Octopus in its PNW den understands something about the ocean that Santiago learned and Grissom lived: the ocean is not an opponent. It is an environment. You do not defeat an environment. You accommodate it, or it accommodates you -- into the sediment, into the dark, into the 4,900 meters of black water where no light reaches and no sound carries and the pressure is 493 times the weight of the atmosphere you breathed when you were alive. The octopus accommodates. It has no rigid structure to break, no sealed cavity to crush, no mechanism to trigger. It flows. It adapts. It escapes from the jar by becoming smaller than the opening. The capsule could not become smaller than the ocean. Grissom could. He squeezed through the hatch, shed the capsule like the octopus sheds a spent spermatophore, and swam for his life in a suit that was trying to drown him. The Harlequin Duck on its whitewater stream navigates the same turbulence that carried the capsule to the bottom -- different scale, same physics, same Reynolds number regime. The duck reads the eddies, finds the calm water behind the boulder, rests, dives, forages, surfaces. It lives in the chaos because it evolved for chaos. Grissom lived in the chaos because he was trained for chaos. The capsule was not trained for chaos. It was trained for the nominal scenario: hatch sealed, helicopter hooked, pilot exits on command. When the nominal scenario evaporated in 0.22 milliseconds of MDF detonation, the capsule had no plan B. Grissom had a plan B: swim. The octopus always has a plan B: ink cloud, jet propulsion, color change, den retreat, arm autotomy. The organism with more options survives. The rigid system with one plan does not. Liberty Bell 7 had one plan. The plan was good. The ocean did not care about the plan. The bell sank. The man swam. The octopus, 4,900 meters below and 1,000 miles northwest, reached one arm out of its den and tasted the cold Pacific water and did not know that a capsule was falling through the Atlantic at 3.5 meters per second, settling toward the floor of an ocean that takes what it takes and does not negotiate the terms."*
