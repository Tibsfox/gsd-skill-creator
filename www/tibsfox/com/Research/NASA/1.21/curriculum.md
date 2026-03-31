# Mission 1.21 -- Curriculum & Education

## Learning Pathways: Friendship 7 and the First American Orbit

**Mission:** Mercury-Atlas 6 / Friendship 7
**Date:** February 20, 1962
**Grade Levels:** K-12 + Adult Learners
**Cross-Curricular:** Physics, Biology, Mathematics, History, Engineering, Art
**Astronaut:** John Herschel Glenn Jr.
**Duration:** 3 orbits, 4 hours 55 minutes 23 seconds
**Organism:** Chinook Salmon (Oncorhynchus tshawytscha)
**Bird:** Swainson's Thrush (Catharus ustulatus)
**Dedication:** Ansel Adams (born February 20, 1902)

---

## TRY Sessions

### TRY Session 1: "Three Orbits" -- Orbital Mechanics for Everyone

**Duration:** 2-3 hours
**Difficulty:** Beginner-Intermediate
**Departments:** Physics, Mathematics, Aerospace Engineering
**What You Need:** A length of string (1-2 meters), a small ball or weight (tennis ball, bean bag, or even a sock filled with rice), a stopwatch or phone timer, a ruler or tape measure, a calculator, and optionally a computer with Scratch (scratch.mit.edu, free) or Python installed. Total cost: $0.

**What You'll Learn:**
Why things orbit instead of falling. Why John Glenn did not float away into space and did not crash back to Earth during his 4 hours and 55 minutes aloft. Why "zero gravity" is a misnomer that even NASA public affairs officers misuse. Why the speed of 28,000 km/h is not arbitrary but is the one speed at which an object at Glenn's altitude falls toward Earth at exactly the rate the Earth curves away beneath it.

**Entry Conditions:**
- [ ] Basic understanding of gravity (things fall down)
- [ ] Ability to use a calculator for multiplication and division
- [ ] A space where you can swing a ball on a string without breaking anything

**The Exercise:**

```
ORBITAL MECHANICS: THE STRING-AND-BALL DEMONSTRATION

Part 1: THE FUNDAMENTAL QUESTION

  Why does the Moon not fall?
  
  This is the question Newton asked. The answer is:
  the Moon IS falling. It is falling toward the Earth
  every second of every day. But the Earth's surface
  curves away from it at the same rate. So the Moon
  falls and falls and falls and never gets closer.
  That is an orbit.

  Glenn was doing the same thing at a much lower
  altitude: 261 km above the Earth at perigee (closest
  point), 265 km at apogee (farthest point). At that
  altitude, gravity is still 93% of what it is at the
  surface. Glenn weighed approximately 93% of his
  ground weight while in orbit. He was NOT in "zero
  gravity." He was in freefall -- falling toward the
  Earth at 9.2 m/s^2 while the Earth curved away
  beneath him at exactly the same rate.

  The sensation of weightlessness comes from freefall,
  not from the absence of gravity. The same sensation
  you feel at the top of a roller coaster hill, or
  in an elevator when the cable snaps (briefly, before
  more urgent sensations intervene). Glenn felt this
  for 4 hours and 55 minutes.

Part 2: THE STRING-AND-BALL EXPERIMENT

  Materials:
    - String: 1-2 meters long
    - Ball or weight: tennis ball, bean bag, sock
      with rice. Anything you can tie to string.
    - Open space: outdoors or large room

  Setup:
    Tie the ball to one end of the string. Hold the
    other end firmly.

  Experiment 1: TOO SLOW
    Swing the ball in a horizontal circle, slowly.
    What happens? The ball drops. The string goes
    slack at the top of the arc. The ball falls.
    
    This is a spacecraft that has lost velocity.
    Below orbital speed, the object falls to Earth.
    This is what happens during reentry -- the
    spacecraft slows down (using retrorockets or
    atmospheric drag) and gravity wins.

  Experiment 2: TOO FAST
    Swing the ball as fast as you can. What happens?
    The string pulls taut. Your hand is pulled outward.
    The ball wants to fly away in a straight line but
    the string holds it. If the string breaks, the ball
    flies off tangentially.

    This is a spacecraft at escape velocity. Above
    orbital speed, the object leaves Earth's gravity
    well. This is how we send probes to Mars, Jupiter,
    and beyond.

  Experiment 3: JUST RIGHT
    Find the speed where the ball orbits smoothly in
    a level circle. The string is taut but not
    straining. The ball maintains a constant altitude
    (stays at the same height relative to your hand).
    
    This is orbital velocity. The centripetal
    acceleration (provided by the string's tension,
    or in Glenn's case by gravity) exactly matches
    the object's tendency to fly away in a straight
    line (inertia).

  Measure:
    - Radius of your orbit (string length): R = ___ m
    - Time for 10 complete orbits: T_10 = ___ s
    - Period (time for 1 orbit): T = T_10 / 10 = ___ s
    - Velocity: v = 2 * pi * R / T = ___ m/s
    - Centripetal acceleration: a = v^2 / R = ___ m/s^2

    Compare your centripetal acceleration to gravity
    (9.8 m/s^2). Is it close? If you swung the ball
    in a perfectly level circle, the centripetal
    acceleration should equal gravity.

Part 3: CALCULATING GLENN'S SPEED

  Glenn orbited at approximately 261 km altitude.
  
  Earth's radius: R_earth = 6,371 km
  Glenn's orbital radius: R = R_earth + altitude
    = 6,371 + 261 = 6,632 km = 6,632,000 m
  
  For a circular orbit, the velocity is:
    v = sqrt(G * M / R)
  
  Where:
    G = 6.674 x 10^-11 N*m^2/kg^2 (gravitational constant)
    M = 5.972 x 10^24 kg (Earth's mass)
    R = 6,632,000 m
  
  v = sqrt(6.674e-11 * 5.972e24 / 6,632,000)
    = sqrt(3.986e14 / 6.632e6)
    = sqrt(6.011e7)
    = 7,753 m/s
    = 7.8 km/s
    = 28,000 km/h
    = 17,400 mph

  At this speed, Glenn crossed the continental
  United States in approximately 10 minutes. He
  saw a sunrise or sunset every 45 minutes. In
  his 3 orbits, he saw 3 sunrises and 3 sunsets
  in less than 5 hours.

  Verification:
    Period = 2 * pi * R / v
           = 2 * 3.14159 * 6,632,000 / 7,753
           = 41,667,000 / 7,753
           = 5,374 seconds
           = 89.6 minutes

    Glenn's actual orbital period was approximately
    88 minutes 29 seconds. The small difference is
    because his orbit was not perfectly circular
    (261 km x 265 km) and because we used simplified
    values. An error of 1.2% from a back-of-envelope
    calculation -- this is excellent.

Part 4: THE MICROGRAVITY CORRECTION

  "Zero gravity" is wrong. Here is why.
  
  Gravity at Glenn's altitude:
    g_orbit = G * M / R^2
            = 3.986e14 / (6.632e6)^2
            = 3.986e14 / 4.398e13
            = 9.06 m/s^2
  
  Gravity at Earth's surface:
    g_surface = 9.81 m/s^2
  
  Ratio: g_orbit / g_surface = 9.06 / 9.81 = 0.924
  
  Glenn experienced 92.4% of surface gravity while
  in orbit. The gravitational pull was almost as
  strong as standing on the ground. The difference
  is that Glenn was falling, and his capsule was
  falling with him, so there was nothing to push
  against. No floor pushing up on your feet means
  no sensation of weight, even though gravity is
  pulling just as hard.
  
  The correct term is "microgravity" -- not because
  gravity is small (it is not) but because the
  residual gravitational effects inside the
  spacecraft are very small (micro-level). Tidal
  forces, atmospheric drag, and spacecraft vibrations
  create tiny accelerations -- on the order of
  10^-6 g -- hence "micro" gravity.
  
  Discussion questions:
  - If you dropped a ball inside Glenn's capsule,
    would it fall? (No -- the ball, Glenn, and the
    capsule are all falling together.)
  - Could Glenn pour water from a cup? (No -- the
    water would form a floating blob.)
  - What happens to a flame in microgravity?
    (It forms a sphere instead of a teardrop shape
    because there is no convection without gravity-
    driven buoyancy.)

Part 5: EXTENSION -- BUILD AN ORBIT SIMULATOR

  Option A: Scratch (scratch.mit.edu, ages 8-14)
    Create a sprite for Earth (center of screen)
    and a sprite for Friendship 7 (small dot).
    
    Use these physics blocks:
      - Calculate gravitational force toward Earth
      - Update velocity based on force
      - Update position based on velocity
      - Repeat forever
    
    Start with the spacecraft moving sideways at
    different speeds. Watch what happens:
      - Too slow: it spirals into Earth
      - Too fast: it flies off the screen
      - Just right: it orbits

  Option B: Python (ages 14+)
    Use matplotlib for visualization. Implement
    Euler's method for numerical integration:
    
    dt = 1  # seconds
    x, y = R_orbit, 0  # start at 3 o'clock
    vx, vy = 0, v_orbital  # moving upward
    
    for step in range(6000):  # ~100 minutes
        r = sqrt(x**2 + y**2)
        a = -G * M / r**2
        ax = a * x / r
        ay = a * y / r
        vx += ax * dt
        vy += ay * dt
        x += vx * dt
        y += vy * dt
        plot(x, y)
    
    Experiment: change the initial velocity and
    watch the orbit become elliptical, escape,
    or decay.

CONNECT TO MA-6:
  Glenn's orbit was not an abstraction. It was a
  real man, in a real capsule, moving at a real
  7,753 m/s around the real Earth. He could look
  out his window and see the curvature. He could
  see the terminator (the line between day and
  night) sweeping across the surface below him.
  He reported seeing the "fireflies" -- luminous
  particles drifting past his window at sunrise,
  later identified as ice crystals from the
  spacecraft's cooling system catching sunlight.
  The physics is beautiful in equations. It is
  more beautiful from 261 km.
```

---

### TRY Session 2: "The Salmon's Return" -- Navigation and Homing

**Duration:** 2-3 hours
**Difficulty:** Beginner-Intermediate
**Departments:** Biology, Engineering, Earth Science
**What You Need:** A magnetic compass ($3-10, or use a phone compass app), a blindfold (bandana or scarf), 10-15 markers or flags (sticks, cones, paper plates -- anything visible), a notebook, optionally a bar magnet or neodymium magnet ($2-5). For the magnetometer extension: a sewing needle, a small piece of cork or foam, a bowl of water, and a magnet for magnetizing the needle. Total cost: $0-15.

**What You'll Learn:**
How animals navigate without instruments, how astronauts navigated with primitive instruments, and why both problems are fundamentally the same: determining your position and heading in a world that provides no obvious signposts. The Chinook salmon navigates thousands of kilometers of open ocean and returns to the exact stream where it was born. John Glenn navigated around the Earth three times and returned to within 65 km of the recovery ship. Both used a combination of external reference systems and internal dead reckoning. Both succeeded because their navigation methods were redundant -- multiple independent systems confirming the same answer.

**Entry Conditions:**
- [ ] Ability to read a compass (know that the needle points north)
- [ ] Access to an outdoor area at least 30 meters across
- [ ] A partner for the blindfolded exercise (safety)

**The Exercise:**

```
NAVIGATION AND HOMING: SALMON VS. SPACECRAFT

Part 1: THE NAVIGATION PROBLEM

  You are a Chinook salmon (Oncorhynchus tshawytscha),
  born in a gravel redd in a tributary of the Columbia
  River in Washington State. You are 15 cm long, you
  weigh 50 grams, and you have spent your first year
  in freshwater. Now you are migrating downstream to
  the Pacific Ocean, where you will spend 2-5 years
  growing to a length of 90-150 cm and a mass of
  10-50 kg. Then you will return. You will navigate
  1,500 to 3,000 km of open ocean. You will find the
  mouth of the Columbia River among thousands of
  kilometers of coastline. You will ascend the Columbia,
  choose the correct fork at every confluence, and
  arrive at the precise tributary, the precise stretch
  of gravel, where you were born. You will spawn and
  die within meters of where you hatched.

  How?

  You are John Glenn, 40 years old, a Marine Corps
  test pilot from Cambridge, Ohio. You are strapped
  into a capsule 1.8 meters wide, sitting on top of
  an Atlas missile that was originally designed to
  carry a nuclear warhead. In 5 minutes you will be
  in orbit at 28,000 km/h. You need to know where
  you are at every moment of the flight so that when
  you fire your retrorockets, you land in the Atlantic
  Ocean near the recovery ships, not in the Sahara
  Desert or the Himalayas. Your life depends on
  navigation accuracy.

  How?

Part 2: HOW SALMON NAVIGATE

  Chinook salmon use at least four independent
  navigation systems. No single system is sufficient
  alone. Together, they provide redundant positioning
  that works across thousands of kilometers.

  System 1: MAGNETIC NAVIGATION
    Salmon have magnetite crystals (Fe3O4) embedded
    in their nasal tissue. These crystals align with
    the Earth's magnetic field, giving the salmon a
    built-in compass. The Earth's magnetic field
    varies in both direction (declination) and
    intensity across the globe, creating a magnetic
    "map" that the salmon can read.
    
    Evidence: salmon exposed to altered magnetic
    fields in laboratory tanks show disoriented
    navigation behavior. Salmon from different
    rivers show different magnetic preferences that
    correlate with the magnetic field at their natal
    stream.

  System 2: OLFACTORY IMPRINTING
    During the smolt stage (when young salmon
    transition from freshwater to saltwater), they
    imprint on the chemical signature of their natal
    stream. Each stream has a unique chemical
    fingerprint created by the specific combination
    of minerals, organic compounds, and microbial
    communities in the watershed. Salmon can detect
    these chemicals at concentrations as low as parts
    per billion -- the equivalent of detecting one
    drop of water in an Olympic swimming pool.
    
    Evidence: salmon with blocked noses (olfactory
    nerve severed) cannot find their natal stream,
    even when they successfully navigate to the
    correct river mouth. The magnetic system gets
    them close; the olfactory system gets them home.

  System 3: CELESTIAL CUES
    Salmon can detect the angle of polarized light,
    which varies with the position of the sun even
    through cloud cover and water. This provides a
    sun compass that works during daytime and at
    shallow depths.
    
    Evidence: salmon under artificial light with
    altered polarization patterns shift their
    orientation correspondingly.

  System 4: OCEAN CURRENT SENSING
    Salmon detect water temperature, salinity, and
    current direction through their lateral line
    (a sensory organ that runs along each side of
    the body). Major ocean currents like the North
    Pacific Current, the Alaska Current, and the
    California Current create recognizable corridors
    of temperature and salinity that the salmon
    follow like highways.

Part 3: HOW GLENN NAVIGATED

  Glenn's Friendship 7 capsule used five independent
  navigation systems -- remarkably parallel to the
  salmon's four.

  System 1: GROUND TRACKING NETWORK
    Eighteen ground stations spread across the globe
    (Cape Canaveral, Bermuda, the Canary Islands,
    Kano in Nigeria, Zanzibar, the Indian Ocean ship,
    Muchea in Australia, Woomera, Canton Island,
    Hawaii, Guaymas in Mexico, and others) tracked
    the capsule by radar and radio. Each station
    computed the capsule's position and relayed it
    to Mercury Control in Cape Canaveral. This was
    the primary navigation system -- external
    observers computing the vehicle's trajectory.
    
    The salmon equivalent: there is none. No one
    tracks the salmon. It tracks itself.

  System 2: ONBOARD CLOCK + ORBITAL ELEMENTS
    Glenn carried a mission timer and knew his
    orbital parameters (period, altitude, inclination).
    By reading the elapsed time, he could estimate
    his approximate position along the ground track.
    This is dead reckoning -- the same method used by
    sailors for centuries.
    
    The salmon equivalent: the internal clock that
    regulates migration timing, tuned to photoperiod
    (day length) and water temperature.

  System 3: PERISCOPE + VISUAL LANDMARKS
    Glenn could look through his periscope or through
    the capsule's window and identify landmarks below:
    coastlines, islands, cloud patterns, the Sahara
    Desert, the Australian outback. He reported
    recognizing the west coast of Africa and the
    coast of Australia.
    
    The salmon equivalent: visual recognition of
    landmarks near the natal stream -- specific rocks,
    fallen trees, channel shapes.

  System 4: STAR TRACKER (ATTITUDE REFERENCE)
    The capsule carried an optical star tracker that
    locked onto a reference star and used it to
    maintain the correct attitude (orientation) for
    retrorocket firing. This provided heading
    information, not position -- but heading is
    essential for the retro burn.
    
    The salmon equivalent: celestial orientation
    using polarized sunlight.

  System 5: HORIZON SCANNER
    Infrared sensors detected the edge of Earth's
    atmosphere (the horizon) and used it to determine
    the capsule's attitude relative to the local
    vertical. This ensured the heat shield faced
    forward during reentry.
    
    The salmon equivalent: lateral line detection of
    water pressure gradients, which indicates
    orientation relative to depth and current.

Part 4: COMPARISON TABLE

  | Feature           | Chinook Salmon    | Friendship 7        |
  |-------------------|-------------------|----------------------|
  | Magnetic sense    | Magnetite crystals| Not used for nav     |
  | Chemical sense    | Olfactory imprint | N/A                  |
  | Celestial cues    | Polarized light   | Star tracker         |
  | External tracking | None              | 18 ground stations   |
  | Dead reckoning    | Internal clock    | Mission timer        |
  | Visual landmarks  | Stream features   | Periscope            |
  | Current sensing   | Lateral line      | Horizon scanner      |
  | Range             | 1,500-3,000 km    | 121,794 km (3 orbits)|
  | Accuracy          | Meters (natal redd)| 65 km (landing)      |
  | Redundancy        | 4 systems         | 5 systems            |
  | Power source      | Body fat          | Batteries            |
  | Weight            | 10-50 kg          | 1,360 kg             |

Part 5: BLINDFOLDED COMPASS NAVIGATION

  Setup:
    In an open outdoor area (park, field, parking lot),
    set up a course of 5 waypoints using markers:
    
    Waypoint 1: START (mark with a flag)
    Waypoint 2: 20 paces NORTH
    Waypoint 3: 15 paces EAST
    Waypoint 4: 25 paces SOUTH
    Waypoint 5: 15 paces WEST (should return to START)
    
    Mark each waypoint with a visible marker.

  Round 1: VISUAL NAVIGATION
    Walk the course with your eyes open, using the
    compass for heading. Count paces. How close do
    you return to the starting point?
    
    Error: measure the distance between your final
    position and the start marker. This is your
    circular error probable (CEP) -- the same
    metric NASA used to evaluate Glenn's landing
    accuracy.

  Round 2: COMPASS ONLY (BLINDFOLDED)
    Put on the blindfold. Your partner walks beside
    you for safety (steering you away from obstacles)
    but gives no directional guidance. Use ONLY the
    compass (held in your hand, read by touch or by
    briefly lifting the blindfold to check heading)
    and pace counting.
    
    Walk the same course. How close do you return?
    
    Your error will be larger. This is what it is
    like to navigate with a single instrument in
    degraded conditions -- similar to Glenn navigating
    by instruments alone when he could not see the
    ground through clouds.

  Round 3: DEAD RECKONING ONLY (NO COMPASS)
    Blindfolded, no compass. Walk what you THINK is
    the correct course based on your memory of the
    heading and distances. Count paces.
    
    Your error will be much larger. Dead reckoning
    without an external reference accumulates error
    at every step. This is why salmon need multiple
    navigation systems, and why Glenn needed multiple
    tracking methods.

  Measure and record your CEP for each round:
    Round 1 (visual): ___ meters
    Round 2 (compass): ___ meters
    Round 3 (dead reckoning): ___ meters

Part 6: EXTENSION -- BUILD A SIMPLE MAGNETOMETER

  Materials:
    - Sewing needle (steel, not stainless)
    - Small piece of cork or foam (1 cm thick)
    - Bowl of water
    - Bar magnet or neodymium magnet

  Procedure:
    1. Magnetize the needle: stroke it 50 times in
       one direction with the magnet (always the
       same direction, lift and return between strokes)
    2. Push the needle through the cork or foam so it
       floats horizontally
    3. Place the cork on the water surface in the bowl
    4. The needle should slowly rotate to align with
       Earth's magnetic field (north-south)
    5. Verify with a compass: does the needle point
       the same direction?

  This is the simplest magnetometer possible --
  the same principle (magnetite aligning with Earth's
  field) that the salmon uses for navigation. The
  salmon's magnetite crystals are microscopic, but
  the physics is identical.

CONNECT TO MA-6:
  The Chinook salmon and John Glenn both solved the
  same fundamental problem: how to navigate a vast,
  featureless space (ocean, orbital space) and arrive
  at a precise destination. Both used redundant
  systems. Both succeeded because no single navigation
  failure was catastrophic -- if one system degraded,
  the others compensated. Glenn's ground tracking
  network failed intermittently (some stations had
  communication dropouts). His periscope view was
  sometimes obscured by cloud cover. But the
  redundancy meant that the mission navigated
  successfully despite individual system failures.
  
  The salmon's navigation is more impressive by one
  measure: accuracy relative to body length. Glenn
  landed 65 km from the target -- about 36,000 body
  lengths. A salmon returning to its natal redd is
  accurate to within a few body lengths. But the
  salmon has been perfecting its navigation for
  millions of years of evolution. Glenn's species
  had been navigating in orbit for exactly zero years
  when he launched. Both are remarkable achievements
  in their respective timescales.
```

---

### TRY Session 3: "Heat Shield" -- Materials Science and Thermal Protection

**Duration:** 2-3 hours
**Difficulty:** Beginner-Intermediate
**Departments:** Physics, Materials Science, Engineering
**What You Need:** Aluminum foil, a ceramic tile (a broken floor tile works, or a terracotta pot shard), a piece of cork (wine cork or cork board), a hair dryer (highest heat setting), a kitchen or laboratory thermometer (infrared thermometer ideal, ~$15, or a meat thermometer, ~$5), a stopwatch, a ruler, and a calculator. For the extension: internet access for researching modern heat shield materials. Total cost: $0-20.

**What You'll Learn:**
Why reentry is hot. Not because of friction (the common misconception) but because of adiabatic compression -- the spacecraft compresses the air in front of it so violently that the air reaches temperatures above 1,600 degrees Celsius. How ablative heat shields work by sacrificing themselves, charring and vaporizing to carry heat away from the capsule. Why John Glenn's "is that a real problem?" moment -- when ground controllers suspected his heat shield was loose -- was the most terrifying 4 minutes and 22 seconds of the entire Mercury program.

**Entry Conditions:**
- [ ] Understanding that things get hot when you compress them (bicycle pump gets warm)
- [ ] Ability to use a thermometer
- [ ] Access to the listed materials

**The Exercise:**

```
HEAT SHIELD: MATERIALS SCIENCE AND THERMAL PROTECTION

Part 1: WHY DOES REENTRY GET HOT?

  The common explanation: friction. The spacecraft
  rubs against the air and generates heat, like
  rubbing your hands together.

  The correct explanation: adiabatic compression.
  The spacecraft is moving at 7,800 m/s (Mach 23).
  The air in front of the spacecraft cannot get out
  of the way fast enough, so it is compressed into
  a shock wave -- a thin layer of extremely hot,
  extremely dense gas. The compression heats the
  air, not the rubbing. The air temperature in the
  shock layer reaches 1,600-2,000 degrees Celsius
  for a Mercury reentry.

  Quick demonstration:
    Take a bicycle pump (or just cup your hands over
    the end of a syringe). Compress the air quickly.
    Feel the barrel -- it is warm. You just heated
    air by compression. Glenn's capsule did the same
    thing at 28,000 km/h.

  Now rub your hands together vigorously for 10
  seconds. Feel the warmth. That IS friction. But
  compare: the hand-rubbing generates perhaps 1-2
  degrees of temperature rise. The adiabatic
  compression of atmospheric reentry generates
  1,600 degrees. Friction contributes, but
  compression dominates.

Part 2: THE ENERGY CALCULATION

  Glenn's capsule:
    Mass: m = 1,360 kg
    Velocity: v = 7,800 m/s
    
  Kinetic energy:
    KE = (1/2) * m * v^2
       = 0.5 * 1,360 * (7,800)^2
       = 0.5 * 1,360 * 60,840,000
       = 0.5 * 82,742,400,000
       = 41,371,200,000 J
       = 41.4 GJ (gigajoules)

  For comparison:
    - 1 kg of TNT releases 4.2 MJ
    - 41.4 GJ = 9,857 kg of TNT equivalent
    - That is approximately 10 tons of TNT
    
  All of this kinetic energy must be converted to
  heat during reentry. The heat shield's job is to
  ensure that this energy goes into heating the air
  and the sacrificial shield material rather than
  heating the capsule and the astronaut inside it.

  If the heat shield failed, the capsule wall
  (nickel alloy, melting point ~1,400 C) would be
  exposed to gas temperatures of 1,600+ C. The wall
  would melt. The capsule would disintegrate. Glenn
  would not survive. This is why the heat shield
  segment (segment 51) in Glenn's telemetry readout
  was the most closely watched number in Mercury
  Control.

Part 3: THE HANDS-ON EXPERIMENT

  You will test three materials as heat shields
  and measure their thermal protection performance.

  Materials:
    A. Aluminum foil (folded to 4 layers)
    B. Ceramic tile (or terracotta shard)
    C. Cork (wine cork sliced flat, or cork board)

  Setup:
    1. Place each material on a flat, heat-resistant
       surface (a baking sheet or stone countertop)
    2. Place the thermometer probe against the back
       (unexposed) side of the material
    3. Record the starting temperature: T_start = ___
    4. Hold the hair dryer 10 cm from the FRONT side,
       highest heat setting
    5. Record the back-side temperature every 30
       seconds for 3 minutes

  Data table:

  | Time (s) | Aluminum (C) | Ceramic (C) | Cork (C) |
  |----------|-------------|-------------|----------|
  | 0        |             |             |          |
  | 30       |             |             |          |
  | 60       |             |             |          |
  | 90       |             |             |          |
  | 120      |             |             |          |
  | 150      |             |             |          |
  | 180      |             |             |          |

  Predictions (before you start):
    - Which material will heat up fastest? ___
    - Which will provide the best insulation? ___
    - Why?

  Expected results:
    - Aluminum heats up FASTEST (high thermal
      conductivity: 237 W/m*K). The foil transmits
      heat from front to back almost immediately.
      Aluminum is a terrible heat shield.
    - Ceramic heats up SLOWLY (low thermal
      conductivity: 1-2 W/m*K). The tile acts as
      an insulator, keeping the back side cool
      while the front absorbs heat. Ceramic tiles
      are used on the Space Shuttle.
    - Cork heats up SLOWLY and may CHAR on the front
      surface (thermal conductivity: 0.04 W/m*K).
      The charring is significant -- this is ablation.
      The cork sacrifices its front surface to protect
      its back surface. Cork was actually used as a
      thermal protection material on early rockets.

Part 4: HOW ABLATIVE SHIELDS WORK

  Glenn's heat shield was made of a fiberglass
  honeycomb filled with an ablative resin compound.
  During reentry, the process was:

  1. HEATING: The shock wave heats the shield surface
     to 1,100-1,600 C
  2. CHARRING: The resin decomposes (pyrolysis),
     forming a carbon char layer on the surface
  3. OUTGASSING: The decomposition releases gases
     that flow outward, creating a boundary layer
     that partially blocks convective heat transfer
  4. ABLATION: The char layer erodes away, carrying
     heat energy with it. Each gram of char that
     flies off takes energy away from the capsule.
  5. INSULATION: The remaining virgin (uncharred)
     material continues to insulate the capsule wall
     from the advancing heat front

  The shield is designed to be consumed. It is
  sacrificial by intent. The mass loss IS the
  thermal protection mechanism. The shield gets
  thinner during reentry, but it does not need to
  survive -- it only needs to last long enough
  (approximately 4 minutes 22 seconds for Glenn's
  reentry).

  The cork experiment above demonstrates the same
  principle at low temperature: the charred front
  surface of the cork is ablating. The gases
  released (the smell of burning cork) are the
  outgassing phase. The intact cork behind the char
  is the insulation phase.

Part 5: "IS THAT A REAL PROBLEM?" -- SEGMENT 51

  During Glenn's first orbit, a telemetry signal
  indicated that the heat shield landing bag deploy
  switch was in the wrong position. This switch
  (segment 51 in the telemetry format) could mean
  one of two things:

  Interpretation 1: The landing bag has deployed
    prematurely, and the heat shield is no longer
    locked against the capsule. If this were true,
    the heat shield would separate during reentry
    and Glenn would die.

  Interpretation 2: The switch is faulty, and the
    heat shield and landing bag are fine.

  Mercury Control chose not to tell Glenn about
  the signal for two orbits. They debated internally.
  They decided on a contingency: instead of
  jettisoning the retrorocket package (which was
  strapped over the heat shield), they would tell
  Glenn to keep the retro pack on during reentry.
  The metal straps holding the retro pack would
  act as a mechanical restraint, keeping the heat
  shield pressed against the capsule even if the
  locking mechanism had failed.

  The instruction was cryptic. Glenn was told to
  "leave the retro package on through the entire
  reentry." He was not told why. He asked. Mercury
  Control said they would "explain later."

  Glenn's response: "What is the reason for this?
  Do you have any reason? Over."

  And later, as the plasma sheath of reentry
  engulfed his capsule and communication blacked
  out: "Boy, that was a real fireball."

  The heat shield held. The landing bag deployed
  correctly on landing. Segment 51 had been a
  faulty sensor. But for 4 minutes and 22 seconds,
  no one in Mercury Control knew whether John Glenn
  was alive or dead behind the wall of superheated
  plasma.

  Discussion:
  - Should Mercury Control have told Glenn about the
    segment 51 reading? (Arguments both ways: pilot
    needs full information to make decisions vs.
    unactionable information creates stress without
    benefit)
  - Was keeping the retro pack on the correct
    contingency? (Yes -- it added mechanical
    restraint with minimal risk. The retro pack
    burned off during reentry as planned, but the
    straps held the shield in place during the
    critical initial heating.)

Part 6: EXTENSION -- MODERN HEAT SHIELDS

  Research these current thermal protection systems:

  PICA-X (SpaceX):
    Phenolic Impregnated Carbon Ablator, developed
    by NASA Ames. Used on Dragon capsules. Reusable
    for multiple missions -- a significant advance
    over the single-use Mercury shields.

  AVCOAT (NASA):
    The ablative material used on Apollo capsules
    and now on Orion. Applied by hand in a honeycomb
    pattern -- each cell filled individually.

  Space Shuttle Tiles (HRSI):
    Not ablative -- reusable ceramic tiles made of
    silica fiber. Could be heated to 1,260 C on one
    side and held by bare hand on the other side
    within seconds. 24,300 unique tiles per orbiter,
    each individually shaped and fitted.

  Starliner (Boeing):
    Boeing Lightweight Ablator (BLA-V), a modern
    variant of ablative technology.

  Compare:
  | Property        | Mercury  | Shuttle  | PICA-X    |
  |-----------------|----------|----------|-----------|
  | Type            | Ablative | Ceramic  | Ablative  |
  | Reusable        | No       | Yes      | Yes       |
  | Max temp (C)    | ~1,600   | ~1,260   | ~1,850    |
  | Mass (kg/m^2)   | ~25      | ~9       | ~8        |
  | First flight    | 1961     | 1981     | 2012      |

CONNECT TO MA-6:
  Glenn trusted his heat shield with his life. The
  shield was designed, tested, manufactured, and
  installed by engineers he had never met -- people
  at the Avco Corporation in Lowell, Massachusetts,
  who filled the fiberglass honeycomb with ablative
  resin and bonded it to the titanium capsule frame.
  The segment 51 scare tested that trust: for two
  orbits, the engineers in Mercury Control were not
  sure the shield was secure, and they chose not to
  tell Glenn until they had a mitigation plan.
  
  The shield worked. The sensor was wrong. Glenn
  came home. But the 4 minutes and 22 seconds of
  reentry blackout -- when plasma surrounded the
  capsule and no radio signal could get through --
  were the loneliest minutes of the mission. Glenn
  was alone with the physics: 41 gigajoules of
  kinetic energy converting to heat, an ablative
  shield of uncertain status, and a fireball visible
  from the recovery ships below. The math worked.
  The materials worked. The engineering worked.
  Glenn worked.
```

---

## DIY Projects

### DIY 1: "Friendship 7 Model" -- Build a Mercury Capsule

**Duration:** 3-5 hours
**Difficulty:** Beginner-Intermediate
**Departments:** Engineering, Physics, Art
**What You Need:** A clean 2-liter plastic soda bottle, modeling clay (approximately 200 grams -- any color, but dark colors are more accurate), aluminum foil (heavy duty preferred), cellophane or clear plastic wrap, a plastic grocery bag, string (lightweight, 4-6 pieces each about 40 cm long), scissors, a craft knife or box cutter (adult supervision for younger students), tape (masking or electrical), a permanent marker, a ruler, and optionally spray paint (flat black and silver). Total cost: $3-8.

**What You'll Build:**
A functional model of the Mercury spacecraft that demonstrates three engineering principles: aerodynamic shape (the capsule's conical body and blunt heat shield), center of gravity (the capsule must land heat-shield-down), and parachute deployment (the drogue-main sequence that slowed Glenn from 7,800 m/s to 9 m/s at splashdown). The model will be drop-tested from height to verify that it orients correctly and lands under parachute.

**Build Instructions:**

```
FRIENDSHIP 7 MODEL: BUILD AND TEST

UNDERSTANDING THE SHAPE:

  The Mercury capsule was a truncated cone (frustum)
  with a cylindrical neck at the narrow end. The
  dimensions:
  
  - Base diameter (heat shield): 1.89 m (74.5 inches)
  - Height: 2.92 m (115 inches) including escape tower
  - Capsule height (without tower): 2.06 m (81 inches)
  - Crew compartment diameter: 1.89 m at widest
  
  The 2-liter bottle approximates this shape inverted:
  the bottle bottom becomes the capsule's cylindrical
  neck, and the bottle shoulder becomes the conical
  section. The heat shield goes on the open (cut) end.

STEP 1: CUT THE BOTTLE

  Cut the 2-liter bottle approximately 20 cm from the
  bottom. You want the top section (with the cap) --
  discard or recycle the bottom cylinder.
  
  The bottle cap represents the antenna housing at the
  narrow end of the capsule. The cut edge (wide end)
  is where the heat shield goes.

STEP 2: BUILD THE HEAT SHIELD

  Take modeling clay and form a disk slightly larger
  than the cut opening of the bottle. The disk should
  be approximately 2 cm thick -- this represents the
  ablative heat shield.
  
  Press the clay firmly onto the cut end of the bottle,
  sealing the opening completely. Smooth the edges so
  the clay transitions smoothly into the bottle wall.
  
  The clay serves two purposes:
  1. It represents the heat shield
  2. It shifts the center of gravity TOWARD the heat
     shield end (the heavy end)
  
  This is critical: the Mercury capsule was designed
  so that its center of gravity was closer to the heat
  shield than to the top. This meant that during
  reentry, aerodynamic forces naturally oriented the
  capsule heat-shield-forward. If the center of gravity
  were at the top, the capsule would tumble. The clay
  ensures your model has the same property.

STEP 3: THE WINDOW

  Glenn's capsule had a main observation window --
  a trapezoidal double-pane glass window on the
  cylindrical wall, approximately 30 cm wide and
  20 cm tall.
  
  On your bottle, approximately 3-4 cm from the clay
  heat shield, mark a small rectangle (2 cm x 1.5 cm).
  Carefully cut three sides with a craft knife, leaving
  the top edge as a hinge. Fold the flap outward.
  Tape a piece of cellophane or clear plastic wrap
  over the opening from the inside. This is Glenn's
  window -- the window through which he saw the
  fireflies at sunrise and the Australian coast at
  night.

STEP 4: WRAP IN FOIL

  Cover the exterior of the capsule in aluminum foil.
  The Mercury capsule's outer skin was a corrugated
  nickel alloy (Rene 41) with a shingle-like surface.
  Aluminum foil approximates the metallic appearance.
  
  Leave the window uncovered (or cover it with the
  foil and then recut the window opening). Leave the
  clay heat shield uncovered -- on the real capsule,
  the heat shield was a different color and texture
  from the outer skin.
  
  If using spray paint: paint the foil-covered body
  flat black (the actual capsule color after reentry
  charring) and paint the heat shield area dark brown
  or burnt umber (representing the ablated resin).

STEP 5: BUILD THE PARACHUTE

  The Mercury landing system used a sequence:
  1. Drogue parachute (1.8 m diameter, deployed at
     ~6,700 m altitude to stabilize and slow)
  2. Main parachute (19.2 m diameter, deployed at
     ~3,000 m for final descent)
  3. Landing bag (deployed below the heat shield
     to cushion impact)
  
  For your model, build the main parachute:
  
  Cut a circle from the plastic bag, approximately
  40 cm in diameter. This is your canopy.
  
  Cut 6 pieces of string, each 40 cm long. Tape
  them evenly spaced around the edge of the canopy.
  
  Gather the free ends of all 6 strings and tape
  them to the bottle cap end (the narrow top) of
  the capsule. On the real Mercury, the parachutes
  deployed from a canister on the narrow end (the
  antenna section).

STEP 6: CENTER OF GRAVITY TEST

  Before testing the parachute, verify your center
  of gravity:
  
  Balance the capsule on your finger. Find the point
  where it balances horizontally. This is the center
  of gravity.
  
  The center of gravity should be closer to the clay
  (heat shield) end than to the bottle cap end. If
  not, add more clay to the heat shield.
  
  Why this matters: during reentry, the capsule
  experiences aerodynamic drag. The center of pressure
  (where drag forces act) is near the geometric center,
  but the center of gravity is near the heat shield.
  This offset creates a torque that rotates the capsule
  to heat-shield-forward orientation -- like a
  badminton shuttlecock always flying feathers-back.

STEP 7: DROP TEST

  Find a safe height for testing: a second-floor
  balcony, a playground structure, or a stairwell
  (with adult supervision). Minimum 3 meters.
  
  Test 1: DROP WITHOUT PARACHUTE
    Hold the capsule at the height, heat-shield UP
    (inverted from landing orientation). Release it.
    
    Does it rotate to heat-shield-down before impact?
    If your center of gravity is correct, it should
    flip during the fall. This is aerodynamic
    stability in action.
    
  Test 2: DROP WITH PARACHUTE
    Hold the capsule with the parachute neatly folded
    on top. Release everything.
    
    The parachute should deploy as the capsule falls.
    The capsule should descend slowly under the canopy.
    
    Does it land heat-shield-down? The parachute
    should pull from the top (narrow end), keeping
    the heavy end (heat shield) pointing down. This
    is exactly how Glenn landed.
    
  Test 3: MODIFY AND RETEST
    If the capsule does not orient correctly:
    - Add more clay to the heat shield (increase CG offset)
    - Make the parachute larger (increase drag)
    - Lengthen the strings (increase stability)

CONNECT TO MA-6:
  Glenn's capsule weighed 1,360 kg and landed under
  a 19.2-meter parachute at approximately 9 m/s
  (about 30 ft/s). Your model weighs perhaps 200
  grams and lands under a 40-cm parachute. The
  physics scales: the ratio of drag force to weight
  determines the descent rate, and the ratio of CG
  offset to aerodynamic center determines the
  stability. Both capsules -- Glenn's and yours --
  use the same principles. The engineering is scale-
  invariant.
```

---

### DIY 2: "Salmon Life Cycle Terrarium"

**Duration:** 2-4 hours to build, ongoing observation
**Difficulty:** Beginner
**Departments:** Biology, Ecology, Art
**What You Need:** A clear container (glass baking dish, large mason jar, or plastic storage container -- at least 30 cm long), aquarium gravel or natural river gravel (1-2 kg, ~$3 from a pet store or free from a stream), small smooth stones and pebbles, water (dechlorinated -- let tap water sit uncovered for 24 hours, or use spring water), small aquatic plants if available (elodea/anacharis from a pet store, ~$3, or use clippings from a pond), index cards and markers for labels, optionally small plastic or clay figures to represent salmon at each life stage. Total cost: $3-10.

**What You'll Build:**
A miniature stream bed that models the six stages of the Chinook salmon life cycle, from egg to spawning adult. The terrarium demonstrates why salmon need clean, cold, oxygenated water with specific gravel substrates for reproduction -- and why dam construction, logging, urbanization, and climate change threaten every stage of the life cycle. This connects to the mission through the Chinook's role as the PNW indicator species: where salmon thrive, the watershed is healthy; where salmon disappear, the ecosystem is in distress.

**Build Instructions:**

```
SALMON LIFE CYCLE TERRARIUM

THE SIX STAGES:

  The Chinook salmon (Oncorhynchus tshawytscha) has
  the most complex life cycle of any Pacific salmon
  species, spanning freshwater, estuarine, and ocean
  environments over 2-7 years.

  Stage 1: EGG (October-March)
    Female salmon excavate a redd (nest) in clean
    gravel by turning on their sides and beating their
    tails against the stream bed. The gravel must be
    the right size: 1-10 cm diameter. Too fine and
    the eggs suffocate (no water flow through the
    gravel). Too coarse and the eggs wash away. The
    female deposits 3,000-14,000 eggs in the redd,
    the male fertilizes them, and the female covers
    them with gravel.
    
    For your terrarium: create a gravel mound at one
    end of your container. Place small orange or red
    beads (or tiny balls of orange clay) in the gravel
    to represent eggs. Label: "EGGS -- buried in
    gravel, water must flow through for oxygen."

  Stage 2: ALEVIN (March-May)
    The eggs hatch into alevins -- tiny fish still
    attached to their yolk sac, which provides
    nutrition for the first 2-3 weeks. Alevins remain
    in the gravel, hidden from predators, absorbing
    their yolk sac.
    
    For your terrarium: place a small figure or
    drawing of a tiny fish with a round belly (yolk
    sac) half-hidden in the gravel near the eggs.
    Label: "ALEVIN -- lives in gravel, feeds from
    yolk sac, 2-3 cm long."

  Stage 3: FRY (May-July)
    Once the yolk sac is absorbed, the fish emerges
    from the gravel as a fry -- a free-swimming
    juvenile that must find its own food (aquatic
    insects, zooplankton). Fry develop vertical dark
    bars on their sides (parr marks) for camouflage.
    They stay in shallow, slow-moving water near the
    banks where predators are fewer and food is
    concentrated.
    
    For your terrarium: place a small figure in the
    shallow water area, near plants or overhanging
    structure. Label: "FRY -- free-swimming, feeds
    on insects, 3-7 cm long, parr marks visible."

  Stage 4: SMOLT (varies, age 1-2 years)
    The critical transition: the fry undergoes
    smoltification, a physiological transformation
    that prepares it for saltwater. The parr marks
    fade, the body becomes silvery (camouflage for
    open water), and the kidneys and gills restructure
    to excrete salt rather than retain it. The smolt
    migrates downstream to the estuary and then to
    the ocean.
    
    THIS is when olfactory imprinting occurs. The
    smolt memorizes the chemical signature of its
    natal stream during the downstream migration.
    Every fork in the river, every tributary junction,
    is recorded as a sequence of chemical waypoints
    that the adult salmon will follow in reverse
    during its spawning migration.
    
    For your terrarium: create a downstream section
    with a transition from gravel to sand or fine
    substrate (representing the estuary). Place a
    silvery figure here. Label: "SMOLT -- silvery,
    salt-adapted, migrating to ocean, IMPRINTING
    on stream chemistry."

  Stage 5: ADULT (ocean, 1-5 years)
    In the Pacific Ocean, Chinook salmon grow rapidly,
    feeding on herring, sand lance, squid, and
    crustaceans. They may travel 1,500-3,000 km from
    the river mouth, reaching as far as the Gulf of
    Alaska or the western Pacific. Adults weigh
    10-50 kg (the largest Chinook on record was
    57.3 kg / 126 lbs, caught in Alaska).
    
    For your terrarium: the ocean stage cannot be
    modeled in a stream terrarium. Place a card at
    one end showing a map of the North Pacific with
    an arrow indicating the salmon's ocean range.
    Label: "ADULT -- 1-5 years in Pacific Ocean,
    10-50 kg, travels 1,500-3,000 km."

  Stage 6: SPAWNING ADULT (return to natal stream)
    The adult salmon stops feeding, begins the
    upstream migration, and undergoes dramatic
    physical changes: the body darkens from silver
    to deep red or maroon, the male develops a
    hooked jaw (kype) and humped back, and the
    digestive system atrophies (the fish will never
    eat again). The salmon fights upstream against
    the current, leaps waterfalls, navigates fish
    ladders at dams, and arrives at the natal redd
    site. It spawns and dies within days to weeks.
    The carcass decomposes in the stream, returning
    ocean-derived nutrients (nitrogen, phosphorus,
    carbon) to the freshwater and riparian
    ecosystem. The salmon's body feeds the forest
    that shades the stream that cools the water
    that the next generation of eggs requires.
    
    For your terrarium: place a darkened figure at
    the gravel redd, completing the circle. Label:
    "SPAWNING ADULT -- dies after spawning, body
    feeds the ecosystem that sustains the next
    generation."

ECOLOGY LESSON:

  Why salmon need clean, cold water:
  
  TEMPERATURE: Chinook eggs require water between
    4-13 C (39-55 F). Above 13 C, mortality increases
    sharply. Above 18 C, most eggs die. Climate change
    is warming Pacific Northwest streams by 0.1-0.3 C
    per decade. Logging removes the tree canopy that
    shades streams, raising water temperature.
    
  DISSOLVED OXYGEN: Eggs require DO > 8 mg/L.
    Warm water holds less oxygen than cold water.
    Organic pollution (sewage, agricultural runoff)
    depletes oxygen through bacterial decomposition.
    
  GRAVEL: Eggs need clean gravel for oxygenated
    water flow. Sediment from logging roads,
    construction, and agriculture fills the spaces
    between gravel particles (embeddedness), reducing
    flow and suffocating eggs. This is the most
    immediate, most fixable threat to salmon habitat.
    
  PASSAGE: Dams block upstream migration. The
    Columbia River once had Chinook runs of 10-16
    million fish per year. Today the run is fewer
    than 1 million. Fourteen mainstem dams and
    hundreds of tributary dams, culverts, and
    diversions block access to 40-90% of historical
    spawning habitat, depending on the basin.
    
  Your terrarium should make the fragility visible:
  pour a tablespoon of fine dirt into the gravel redd
  area and observe how it fills the spaces between
  gravel particles. The eggs (beads) are now covered
  in sediment, cut off from flowing water. This is
  what a poorly maintained logging road does to a
  salmon stream.

CONNECT TO MA-6:
  The Chinook salmon and the Friendship 7 capsule
  both depend on systems designed for a specific
  environmental envelope. The salmon needs water
  between 4-13 C with DO > 8 mg/L and clean gravel.
  The capsule needs an atmosphere of 100% oxygen at
  5.5 psi, temperatures between 16-38 C, and an
  intact heat shield. Move outside those envelopes
  and both organisms -- biological and mechanical --
  fail. The salmon dies when the stream warms. The
  capsule burns when the shield cracks. Conservation
  engineering and aerospace engineering share the
  same discipline: understand the envelope, protect
  the envelope, and never assume the envelope will
  protect itself.
```

---

### DIY 3: "Ground Station Receiver" -- Build a Crystal Radio

**Duration:** 3-5 hours
**Difficulty:** Intermediate
**Departments:** Engineering, Physics, Communications
**What You Need:** One cardboard tube (toilet paper roll or paper towel roll cut to 10 cm), 30-gauge magnet wire (enamel-coated copper wire, approximately 15-20 meters, ~$5 from a hardware or electronics store), one germanium diode (1N34A, ~$1-3 from an electronics supplier or Amazon), one piezoelectric earpiece (also called a crystal earpiece, ~$3-5 -- NOT a standard headphone, which requires amplification), approximately 15-20 meters of antenna wire (any insulated or bare copper wire), a ground wire (connect to a cold water pipe, a metal stake in the ground, or the ground screw on an electrical outlet), tape, sandpaper (fine grit, for stripping enamel), and optionally a variable capacitor from an old AM radio (~$3-8 for proper tuning). Total cost: $10-20.

**What You'll Build:**
A working AM broadcast receiver that operates with no batteries, no power supply, and no amplification -- it runs entirely on the energy of the radio waves themselves. This continues the progressive radio series from earlier missions in the NASA curriculum, building toward an understanding of the electromagnetic spectrum that Glenn's capsule used to communicate with the ground tracking network. The crystal radio is the simplest possible receiver: an antenna captures radio frequency energy, a tuned circuit (inductor + capacitor) selects a single station, a diode (the "crystal" in crystal radio) extracts the audio signal, and a high-impedance earpiece converts the electrical signal to sound.

**Build Instructions:**

```
CRYSTAL RADIO: AM BROADCAST RECEIVER

THEORY: HOW RADIO WORKS

  Radio communication is the foundation of spaceflight.
  Without radio, Glenn would have been alone for
  4 hours and 55 minutes -- no voice contact with
  Mercury Control, no telemetry (heart rate, cabin
  pressure, oxygen levels), no tracking data, no
  retrorocket fire command. Radio is the umbilical
  cord of human spaceflight.

  Every radio system has five components:
    1. TRANSMITTER: converts audio to radio waves
    2. ANTENNA (transmit): radiates the radio waves
    3. MEDIUM: the space between transmitter and
       receiver (air, vacuum, ionosphere)
    4. ANTENNA (receive): captures the radio waves
    5. RECEIVER: converts radio waves back to audio

  Glenn's communication system used HF and UHF radio:
    - HF (high frequency, 3-30 MHz): long range,
      reflected by the ionosphere, used for voice
      when line-of-sight was not available
    - UHF (ultra-high frequency, 300-3000 MHz):
      short range, line-of-sight only, clearer audio

  Your crystal radio receives AM broadcast radio
  (530-1700 kHz), which is lower in frequency than
  Glenn's HF system but uses the same fundamental
  physics: electromagnetic waves carrying information.

STEP 1: WIND THE COIL (INDUCTOR)

  The coil is the tuning element -- it determines
  which frequency (station) you receive.

  1. Take the cardboard tube (10 cm length)
  2. Leave a 15 cm tail of magnet wire at one end
     (this will be a connection lead)
  3. Wind the magnet wire tightly around the tube,
     turn by turn, with each turn touching the
     previous one. No gaps, no overlaps.
  4. Wind approximately 80-100 turns
  5. Leave a 15 cm tail at the other end
  6. Tape both ends to secure the coil
  7. Use sandpaper to strip the enamel coating from
     the last 2 cm of each tail (expose bare copper)

  What you have built: an inductor. When radio waves
  pass through the coil, they induce an alternating
  current in the wire. The inductance (measured in
  microhenries) depends on the number of turns, the
  diameter, and the core material (air, in this case).

STEP 2: CONNECT THE DIODE (DETECTOR)

  The germanium diode is the "crystal" in crystal
  radio. Early crystal radios used a galena crystal
  (lead sulfide) with a thin wire ("cat's whisker")
  touching the crystal surface. The 1N34A germanium
  diode is the modern equivalent.

  The diode allows current to flow in only one
  direction. AM radio waves are symmetric -- they
  oscillate above and below zero equally. If you
  sent this directly to an earpiece, the positive
  and negative halves would cancel out and you
  would hear nothing. The diode removes the
  negative half (half-wave rectification), leaving
  only the positive half -- which IS the audio
  signal (the envelope of the AM wave).

  Connect:
    - One lead of the diode to one tail of the coil
    - The other lead of the diode to one terminal
      of the earpiece

STEP 3: CONNECT THE EARPIECE

  The piezoelectric earpiece is essential. Standard
  headphones have very low impedance (16-300 ohms)
  and require amplification. A piezoelectric earpiece
  has very high impedance (>10,000 ohms), which means
  it draws almost no current and can operate on the
  tiny amount of power captured by the antenna.

  Connect:
    - One terminal of the earpiece to the diode
      (already done in Step 2)
    - Other terminal of the earpiece to the other
      tail of the coil

STEP 4: CONNECT ANTENNA AND GROUND

  ANTENNA:
    Run 15-20 meters of wire as high and as long
    as possible. Outdoors: string it between trees,
    along a fence, from a window to a tree. Indoors:
    run it along the ceiling, around the room
    perimeter, or out a window.
    
    Connect one end of the antenna wire to the
    junction of the coil tail and the diode.
    
    The longer and higher the antenna, the more
    signal it captures, and the louder the stations.

  GROUND:
    Connect a wire from the other coil tail to a
    ground point:
    - Best: a metal cold water pipe (copper plumbing
      that goes into the earth)
    - Good: a metal stake driven 30 cm into the
      ground outside
    - Acceptable: the ground screw (green) on an
      electrical outlet (with adult supervision)
    
    The ground completes the circuit: radio waves
    induce a voltage between the antenna and the
    ground, and the coil/diode/earpiece convert
    that voltage to sound.

STEP 5: TUNE AND LISTEN

  Without a variable capacitor, you tune by
  sliding a contact point along the coil (tap
  different turns to change the inductance, which
  changes the resonant frequency).
  
  Alternative: scrape a bare patch at every 10th
  turn of the coil. Use an alligator clip to
  connect the antenna wire to different taps.
  Each tap selects a different frequency range.

  With a variable capacitor: connect the capacitor
  in parallel with the coil (across the two tails).
  Turning the capacitor knob changes the resonant
  frequency smoothly, allowing you to tune across
  the AM band just like turning a radio dial.

  Put the earpiece in your ear. Adjust the tuning.
  In most locations in the United States, you should
  hear at least one AM station -- often several.
  Stations are louder at night (the ionosphere
  reflects AM signals over greater distances after
  sunset, a phenomenon called skywave propagation).

CIRCUIT DIAGRAM:

  ANTENNA ---|
             |--- COIL (80-100 turns) ---|
  GROUND  ---|                           |
             |                     DIODE-|--- EARPIECE
             |                           |        |
             |--- (optional CAPACITOR) --|--------|

ENGINEERING LESSON: HOW RADIO CARRIES INFORMATION

  AM (Amplitude Modulation) encodes audio information
  in the AMPLITUDE (height) of the radio wave. When
  the announcer speaks loudly, the wave gets taller.
  When they speak softly, the wave gets shorter.
  The diode extracts this amplitude variation and
  sends it to the earpiece, which converts electrical
  amplitude variations into air pressure variations
  (sound).

  Glenn's voice was transmitted from his capsule
  using a similar principle (though FM and SSB
  modulation were also used). His words -- "Roger,
  zero-g and I feel fine" -- were encoded as
  variations in a radio wave, transmitted at the
  speed of light across hundreds or thousands of
  kilometers to a ground station, decoded, and
  sent by landline to Mercury Control in Cape
  Canaveral, where Chris Kraft and the flight
  controllers heard them through their headsets.

  The crystal radio you just built is the receiving
  end of that chain. It is the simplest possible
  decoder -- antenna, tuner, detector, transducer --
  with no amplification, no digital processing,
  no software. Pure physics. The same physics that
  let 18 ground stations hear John Glenn's voice
  from orbit.

CONNECT TO MA-6:
  Glenn's Mercury tracking network was the largest
  communication system ever built at that time --
  18 stations on 6 continents and 2 ships, connected
  by undersea cables, landlines, and radio relays.
  Each station had a receiver far more sensitive
  than your crystal radio, but the principle was
  identical: capture the electromagnetic wave,
  extract the information, deliver it to a human
  ear. The ground station at Muchea, Australia,
  was the first to confirm that Glenn's orbit was
  stable. The station at Point Arguello, California,
  relayed the reentry telemetry. Each station was
  a link in the communication chain, and the chain
  was only as reliable as its weakest link. Your
  crystal radio is one link. Glenn needed eighteen.
```

---

## Fox Companies Pathways

### FoxCompute Alignment

John Glenn's orbital trajectory was computed by hand before it was verified by machine. The trajectory calculation for MA-6 was performed by engineers at the Goddard Space Flight Center using IBM 7090 mainframe computers -- the most powerful general-purpose computers available in 1962, capable of approximately 229,000 floating-point operations per second. But Glenn did not fully trust the computer. He specifically requested that Katherine Johnson, a mathematician in the Langley Research Center's West Area Computing unit, verify the computer's orbital calculations by hand before he would agree to fly.

Johnson performed the verification using the same equations of orbital mechanics that students calculate in TRY Session 1: Keplerian orbital elements, gravitational parameters, and the equations of motion for a body in Earth's gravitational field. She worked the trajectory from launch through orbital insertion, through three complete orbits, through retrorocket firing, through reentry, to splashdown coordinates. Her numbers matched the IBM 7090's output. Glenn flew.

This moment -- a human mathematician verifying a computer's calculation because the stakes were too high to trust the machine alone -- is the founding principle of FoxCompute's verification architecture. Every critical computation should be verifiable by an independent method. The computer is fast but opaque: it produces answers without showing its reasoning. The mathematician is slow but transparent: every step is visible, every assumption explicit. The combination of machine speed and human verification is more reliable than either alone.

Modern orbital mechanics runs on GPUs, not mainframes. A single NVIDIA RTX 4060 Ti can perform approximately 22 trillion floating-point operations per second -- 96 billion times faster than the IBM 7090 that computed Glenn's trajectory. The equations are the same. The precision is higher. The speed is incomprehensible. But the verification principle remains: trust but verify, compute and confirm, run the calculation twice by independent methods before committing to a trajectory that puts a human in a fireball at Mach 23.

Career pathways: aerospace software engineer (writing trajectory computation code for missions), mission planner (designing orbital parameters for crew and cargo missions), GPU compute engineer (optimizing parallel algorithms for orbital mechanics on modern hardware), verification and validation engineer (the modern Katherine Johnson -- confirming that the software produces correct answers for the right reasons).

### FoxFiber Alignment

The Mercury tracking network that supported Glenn's flight was the first global real-time communication infrastructure built for a single purpose: keeping one human connected to the ground during three orbits. Eighteen stations spread across the globe -- Cape Canaveral (Florida), Grand Bahama Island, Bermuda, Atlantic Ship, Canary Islands, Kano (Nigeria), Zanzibar, Indian Ocean Ship, Muchea (Australia), Woomera (Australia), Canton Island, Hawaii, Point Arguello (California), Guaymas (Mexico), White Sands (New Mexico), Corpus Christi (Texas), Eglin (Florida), and Cape Canaveral again. Each station was connected to Mercury Control by a combination of submarine cables, landlines, high-frequency radio relays, and teletype circuits.

The network's architecture was dictated by orbital mechanics: Glenn's capsule moved at 7,800 m/s, crossing from one station's communication horizon to the next in approximately 7-10 minutes. Each station had a window of communication ranging from 4 to 10 minutes depending on the geometry. The handoff between stations had to be seamless -- when Bermuda lost the signal, the Canary Islands had to be ready to acquire it. Communication gaps were acceptable (and inevitable over the open ocean), but the gaps had to be predictable so that critical events (retrorocket firing, reentry) could be scheduled during coverage windows.

FoxFiber's network architecture faces the same handoff problem at a different scale: as users move between network segments, the session must transfer without interruption. The Mercury network solved this with pre-positioned stations at known locations along a known track. FoxFiber's equivalent is edge computing nodes positioned at known traffic concentration points with predictable handoff timing. The Mercury network had 18 nodes. A modern FoxFiber mesh network might have 18,000. But the principle is identical: know where the client will be, have the node ready, and make the handoff invisible.

The submarine cable links in 1962 carried approximately 36 voice circuits across the Atlantic (TAT-3 cable, laid in 1963, the first during the Mercury program era). Modern submarine cables carry 200+ terabits per second. The ratio of improvement -- roughly 5 trillion to one -- is among the largest technology scaling factors in human history. FoxFiber builds on this infrastructure, adding intelligence at the edge rather than in the core, distributing processing as close to the user as the Mercury tracking stations were close to the spacecraft's ground track.

Career pathways: network engineer (designing and maintaining fiber-optic and wireless infrastructure), satellite communications engineer (modern tracking networks use TDRS satellites instead of ground stations), edge computing architect (placing compute resources at network boundaries), submarine cable engineer (the physical layer of global communications).

### Fox CapComm Alignment

Mercury Control established the CAPCOM protocol during MA-6: only one person talks to the astronaut. In the chaos of a mission with dozens of flight controllers monitoring different systems (EECOM for electrical and environmental, FIDO for flight dynamics, RETRO for retrograde operations, SURGEON for medical telemetry), the potential for communication overload was obvious. If every controller could talk to Glenn simultaneously, the radio channel would be saturated with competing voices, instructions, and questions. Glenn would be unable to parse the information. Critical instructions would be lost in the noise.

The CAPCOM solution was simple and strict: one voice. The Capsule Communicator (CAPCOM) -- always another astronaut, because astronauts trust astronauts -- was the single interface between the flight control team and the spacecraft. Every instruction, every question, every piece of information had to flow through CAPCOM. The flight controllers talked to the Flight Director. The Flight Director talked to CAPCOM. CAPCOM talked to Glenn. The reverse path was identical: Glenn talked to CAPCOM, CAPCOM relayed to the Flight Director, the Flight Director distributed to the relevant controllers.

This is the single-point-of-contact pattern in communications architecture, and it is the foundation of Fox CapComm's agent communication model. In a multi-agent system with dozens of specialized agents (analogous to flight controllers), the temptation is to allow any agent to communicate with any other agent directly. This creates a fully connected communication graph with n*(n-1)/2 channels -- for 20 agents, that is 190 channels. The CAPCOM pattern reduces this to n channels: every agent communicates through a single coordinator, and the coordinator manages prioritization, conflict resolution, and message routing.

The segment 51 incident during MA-6 tested this protocol under stress. The flight controllers debated internally about the heat shield telemetry for two full orbits before communicating anything to Glenn. When they finally did communicate, the instruction was filtered through CAPCOM and was deliberately incomplete ("leave the retro package on through the entire reentry") -- giving Glenn an action without the alarming context. Whether this was the right communication decision is debatable (Glenn himself was frustrated by the lack of information), but the CAPCOM protocol ensured that the debate happened on the ground, not on the radio channel, and that Glenn received a single coherent instruction rather than a cacophony of conflicting opinions.

Career pathways: systems engineer (designing communication protocols for complex systems), flight controller (managing real-time operations in aerospace), communications protocol designer (developing structured information flow for high-stakes environments), AI agent coordinator (the modern CAPCOM -- a coordination layer between autonomous agents and human operators).

### FoxPower Alignment

The Atlas missile that launched Glenn into orbit was a remarkable and terrifying piece of engineering. It was originally designed as an intercontinental ballistic missile (ICBM) -- its purpose was to deliver a nuclear warhead to targets in the Soviet Union. Repurposing it as a crewed launch vehicle required trusting a weapon of mass destruction to carry the most valuable payload imaginable: a human being.

The Atlas LV-3B used RP-1 (a refined kerosene) and liquid oxygen (LOX) as propellants. The engine system was a stage-and-a-half design: two booster engines (LR-89) that dropped away during ascent and one sustainer engine (LR-105) that burned until orbital insertion. Total thrust at liftoff was approximately 1,600 kilonewtons (360,000 pounds-force). The engines burned for approximately 5 minutes, accelerating Glenn from 0 to 7,800 m/s -- from standing still on a launch pad in Florida to orbiting the Earth.

The Atlas was a "balloon tank" design: its stainless steel skin was so thin (0.25-1.27 mm) that the rocket would collapse under its own weight if not pressurized. The internal pressure (nitrogen gas in the unpressurized tanks, propellant vapor pressure in the fuel and oxidizer tanks) kept the structure rigid. This was elegant (light weight, high mass fraction) and terrifying (any loss of pressure during ground handling could cause the rocket to crumple like a soda can).

FoxPower's energy systems face the same trade-off between efficiency and margin. The Atlas was optimized for performance: every unnecessary gram of structure was eliminated. This made it efficient (high payload fraction) but fragile (low structural margin). FoxPower's energy grid must balance efficiency (delivering maximum power per unit of infrastructure) with resilience (surviving component failures without cascading collapse). The Atlas had no resilience -- a single engine failure was catastrophic. FoxPower must do better: redundant power paths, graceful degradation, automatic load balancing. The Atlas taught NASA that single-string systems (systems with no backup) are acceptable for expendable vehicles but not for systems that carry irreplaceable payloads. FoxPower carries data, which is replaceable. But the users' trust is not.

Career pathways: propulsion engineer (designing and testing rocket engines), energy systems engineer (power grid design, renewable integration, storage systems), launch vehicle engineer (structural and propulsion design for space access), nuclear engineer (the Atlas's original payload was nuclear -- the conversion from weapon to vehicle is a recurring pattern in technology history).

### FoxBio Alignment

The Chinook salmon is the largest Pacific salmon species and the most culturally, economically, and ecologically significant fish in the Pacific Northwest. The species is listed as threatened under the Endangered Species Act in multiple river systems -- the Puget Sound Chinook, the Snake River spring/summer Chinook, the Upper Columbia spring Chinook, and others. The decline from pre-development populations of 10-16 million to current runs of fewer than 1 million is one of the defining environmental stories of the American West.

FoxBio's mission aligns with salmon conservation on multiple axes. Hatcheries produce and release juvenile salmon to supplement wild populations -- approximately 40% of all Chinook returning to the Columbia River are hatchery-origin. Hatchery operations require precise environmental control: water temperature (10-14 C for rearing), dissolved oxygen (>8 mg/L), flow rates (adequate to prevent fin erosion but not so high as to exhaust juvenile fish), and disease monitoring (bacterial kidney disease, infectious hematopoietic necrosis, and others). These are environmental engineering problems with real-time monitoring requirements -- sensor networks, data logging, automated alerts when parameters drift outside tolerance.

Fish passage is the second axis: dam removal (the Elwha River dam removal in 2011-2014 was the largest in U.S. history), fish ladder design (the Bonneville Dam fish ladder passes 1-2 million fish annually), and culvert replacement (Washington State alone has identified over 4,000 fish-blocking culverts on state roads, each one a barrier that fragments salmon habitat). The engineering challenge is hydraulic: designing structures that allow salmon to pass upstream at the energy cost they can sustain, accounting for species-specific swimming performance (Chinook can leap approximately 3 meters vertically and sustain burst swimming at 4-6 m/s for 10-15 seconds).

Habitat restoration is the third axis: replanting riparian buffers (trees along stream banks that shade the water and reduce temperature), removing legacy logging roads (which contribute sediment to streams), reconnecting floodplains (allowing rivers to access their natural floodplain during high water, which provides off-channel rearing habitat for juvenile salmon), and managing water withdrawals (irrigation and municipal water use can reduce summer stream flows below the minimum needed for salmon survival).

The connection to Glenn's mission is structural: both the salmon and the astronaut depend on a precisely engineered life support system. Glenn's capsule maintained 100% oxygen at 5.5 psi, temperature between 16-38 C, and humidity below 70%. The salmon requires water at 4-13 C, dissolved oxygen above 8 mg/L, and clean gravel substrate. Both systems fail catastrophically when parameters leave the envelope. Both require continuous monitoring. Both represent the intersection of biology and engineering -- the discipline FoxBio is built to serve.

Career pathways: fisheries biologist (population monitoring, habitat assessment, spawning surveys), conservation engineer (fish passage design, dam removal planning, culvert replacement), hatchery manager (environmental control systems, broodstock management, disease monitoring), water resources engineer (stream flow management, irrigation efficiency, water rights administration), environmental data scientist (sensor network design, real-time monitoring, population modeling).

---

*"Ansel Adams was born on February 20, 1902, in San Francisco -- a city built on the edge of the Pacific, facing the ocean that the Chinook salmon crosses and recrosses in its ancient migration. Adams spent his life photographing the American West: Yosemite's granite walls, the Sierra Nevada's snowfields, the deserts of the Southwest, the coastline where the continent meets the sea. He saw the landscape as a system of light and form, where the angle of the sun, the humidity of the air, the altitude of the clouds, and the season of the year combined to produce moments of extraordinary clarity -- moments he called 'visualization,' the ability to see the final image before pressing the shutter. Glenn experienced visualization from orbit: looking down at the Earth through his capsule window, he saw the planet as Adams saw Half Dome -- as a subject of overwhelming beauty that demanded to be witnessed carefully, completely, without distraction. Glenn reported the colors of Earth's atmosphere at the terminator -- the thin blue line separating day from night, the gradients of orange and red at sunrise, the deep black of space above the atmosphere's edge. Adams would have understood. He spent decades learning to see those gradients in the Sierra light, the way dawn separates the ridge from the sky in tones so subtle that only a trained eye and a perfectly exposed negative can capture them. Both men practiced the discipline of seeing: Adams through the ground glass of his 8x10 view camera, Glenn through the trapezoidal window of Friendship 7. Both understood that the world reveals itself to those who look carefully. The salmon navigates by senses humans do not possess -- magnetite crystals sensing the Earth's field, olfactory neurons detecting parts per billion of stream chemistry, a lateral line reading pressure waves in the current. The salmon sees a world we cannot see, navigates a map we cannot read, follows a path we cannot trace. Adams photographed a world most people walked past without noticing -- the way granite catches light at a specific hour, the way a cloud's shadow defines the shape of a valley, the way moonlight turns the desert into silver. Glenn orbited a world that only twelve people had seen from above (counting the six orbital and six suborbital flights before him, Soviet and American). All three -- salmon, photographer, astronaut -- perceived the world at a depth and resolution that the casual observer cannot match. The curriculum exists to train that perception: to teach students to see the orbital mechanics in a ball on a string, the navigation system in a compass needle floating on cork, the materials science in a piece of charred cork, the ecology in a handful of stream gravel. The world is not hidden. It is waiting to be seen by anyone willing to learn how to look."*
