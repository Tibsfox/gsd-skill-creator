# Mission 1.7 -- Explorer 1: College of Knowledge Curriculum

## Track 4: Department Mappings, TRY Sessions, DIY Projects, Fox Companies Pathways

**Mission:** Explorer 1 (January 31, 1958) -- First US Satellite, Van Allen Belt Discovery
**Primary Departments:** Physics, Electronics, Space Science
**Secondary Departments:** Mycology/Lichenology, Mathematics, Engineering
**Organism:** Lobaria pulmonaria (lungwort lichen)
**Bird:** Ixoreus naevius (Varied Thrush, degree 7)
**Dedication:** Robert Bunsen (March 30, 1811)

---

## Department Deposits

### Physics (Primary)

**Wing:** Radiation Physics and Particle Detection
**Concept:** The physics of charged particle detection using gas-filled tubes -- how a single Geiger counter discovered the most intense radiation environment near Earth

**Deposit:** Explorer 1's scientific instrument was a single Anton 314 Geiger-Muller tube, designed and built by James Van Allen's group at the University of Iowa. The physics department lesson covers the cascade of physical processes that transforms a single cosmic ray into a detectable electrical pulse:
- A charged particle (proton or electron) enters the tube through the thin metal wall, ionizing the fill gas (neon + halogen quench gas) along its path. A single 30 MeV proton creates approximately 30,000 ion-electron pairs per centimeter of path length
- The applied voltage (~900V) accelerates the freed electrons toward the central wire anode. As electrons accelerate, they gain enough energy to ionize additional gas molecules, triggering a Townsend avalanche -- each primary electron generates approximately 10^6 secondary electrons
- The avalanche produces a measurable current pulse (~1 mA for ~1 microsecond) on the anode wire. This pulse is the "count" -- one particle detected
- The halogen quench gas absorbs UV photons generated in the avalanche, preventing the discharge from becoming self-sustaining. Without the quench gas, a single particle would trigger continuous discharge and the tube would count exactly once, then stop
- After the avalanche, the tube enters its dead time (~100 microseconds) during which the positive ion sheath around the anode wire suppresses the electric field below the threshold for further avalanches. During this time, incoming particles are not detected
- The dead time creates the saturation problem: at high flux, successive particles arrive before the tube recovers, and the tube enters paralysis -- continuous low-level discharge that the counting electronics interpret as silence

The physics lesson is in the failure mode. Explorer 1's Geiger counter worked perfectly at low flux and failed predictably at high flux. The failure was not a malfunction -- it was a physical consequence of gas discharge kinetics. Van Allen understood this because he understood the physics of his instrument at the molecular level. The discovery of the radiation belts required not just flying the instrument, but understanding its failure modes deeply enough to recognize that silence meant abundance.

### Electronics (Primary)

**Wing:** Cosmic Ray Instrumentation and Telemetry Electronics
**Concept:** The electronic signal chain from Geiger tube to ground station -- how Explorer 1 converted particle counts into telemetry bits

**Deposit:** Explorer 1's electronics were designed under extreme constraints: 8.3 kg total payload mass, approximately 60 milliwatts average power from mercury batteries, and the requirement to survive launch vibration (20g), vacuum, temperature extremes (-50 to +70 C), and radiation exposure. The electronics chain:
- High-voltage supply: a transistor oscillator and voltage multiplier (Cockcroft-Walton type) generating 900V for the Geiger tube from a 6V battery. Efficiency approximately 50%. Total power for HV supply: ~30 mW
- Pulse amplifier and discriminator: the Geiger tube output pulse (~1 mA, ~100 ns rise time) was amplified and shaped into a logic-level pulse for the counting circuit. The discriminator threshold was set above electronic noise but below the minimum Geiger pulse height
- Scaler circuit: a binary counter that divided the pulse count by predetermined factors (1x, 8x, 64x, 512x) to reduce the telemetry rate requirements. At low count rates, the 1x output was used. At high count rates (before saturation), the 512x output compressed the data. The scaler was the 1958 equivalent of data compression
- Telemetry encoder: the count data was encoded into the telemetry format -- a continuous signal transmitted at 108.00 MHz (Channel 1) and 108.03 MHz (Channel 2). The real-time data rate was approximately 8.75 bits per second. Count rate, temperature, and battery voltage were multiplexed into the telemetry frame
- Tape recorder (Explorer 3 only): Explorer 1 transmitted only real-time data -- if the spacecraft was not over a ground station, the data was lost. Explorer 3 added a miniature tape recorder that stored data during the entire orbit and played it back during ground station passes, providing complete orbital coverage that confirmed the radiation belt discovery
- Transmitter: two transmitters -- a 10 mW unit on 108.00 MHz and a 60 mW unit on 108.03 MHz. The 60 mW transmitter used four transistors in parallel. Total RF output: 70 mW. This was enough to be received by the Minitrack ground station network across distances up to ~2,000 km

The electronics lesson: Explorer 1's signal chain had fewer than 100 transistors total. The entire instrument -- Geiger tube, HV supply, amplifier, scaler, encoder, transmitter -- consumed less power than a modern LED flashlight. It operated for 111 days (until battery exhaustion on May 23, 1958). The engineering was elegant because it had to be: there was no margin for complexity. Every component served a function. No redundancy. No backup. If the HV supply failed, the experiment was over. If one transmitter died, the other continued at reduced capability. This was minimum-viable instrumentation -- and it discovered a fundamental feature of Earth's space environment.

### Space Science (Primary)

**Wing:** Discovery of the Van Allen Radiation Belts
**Concept:** How a single measurement -- counting charged particles versus altitude -- revealed that Earth is surrounded by zones of trapped high-energy radiation

**Deposit:** Before Explorer 1, the space above Earth's atmosphere was assumed to be empty except for cosmic rays -- a sparse rain of particles from distant astrophysical sources, arriving at a rate of approximately 2 particles per square centimeter per second at spacecraft altitudes. Explorer 1 showed that this assumption was spectacularly wrong at certain altitudes:
- At 358 km (perigee): count rate approximately 30 counts/second, consistent with the expected cosmic ray background. The space environment appeared benign
- At 500-1000 km: count rate rose above cosmic ray background, reaching hundreds of counts per second. Something was there beyond cosmic rays, but the excess was modest
- At 1000-1500 km: count rate rose steeply, reaching thousands of counts per second. The instrument was entering a region of intense radiation
- Above 1500 km: count rate dropped to ZERO. The instrument appeared to fail at exactly the altitudes where the radiation was most interesting
- The zero-count readings persisted at all high-altitude passes. The instrument functioned normally at low altitude. This pattern was consistent across multiple orbits
- Van Allen's interpretation: the Geiger counter was saturating due to radiation flux exceeding its dead time limit. The zero readings corresponded to the highest, not lowest, radiation intensity. Estimated true flux: >35,000 particles/cm^2/s
- Explorer 3 (March 26, 1958) confirmed this with shielded Geiger counters and a tape recorder providing full orbital coverage. The radiation belt was real, it was intense, and it was trapped by Earth's magnetic field

The radiation belt structure discovered by Explorer 1 consists of:
- Inner belt (L = 1.1-3.0 R_E): dominated by energetic protons (10-100 MeV), produced by cosmic ray albedo neutron decay (CRAND). Stable on timescales of years. Explorer 1 sampled the inner edge
- Outer belt (L = 3.5-7.0 R_E): dominated by energetic electrons (0.1-10 MeV), injected by solar wind processes and substorm activity. Highly dynamic, varying on timescales of hours to days. Explorer 1's orbit was too low to reach it
- Slot region (L = 2.0-3.5 R_E): reduced flux between the two belts, maintained by wave-particle interactions that scatter particles into the loss cone

This structure was the first major scientific discovery of the Space Age. It immediately affected spacecraft design (radiation shielding requirements), mission planning (avoiding belt transits for crewed missions), and our understanding of planetary magnetospheres (other planets with magnetic fields also have radiation belts, confirmed later by Pioneer and Voyager missions).

### Mycology / Lichenology (Secondary)

**Wing:** Lobaria pulmonaria -- The Indicator
**Concept:** Lungwort lichen as a biological detector of environmental quality, mirroring the Geiger counter's role as a radiation detector -- both are threshold instruments that signal the presence or absence of something invisible

**Deposit:** Lobaria pulmonaria (lungwort lichen) is a large foliose lichen found on the bark of old-growth trees in humid temperate forests. It is the mission 1.7 paired organism because it shares a fundamental characteristic with Explorer 1's Geiger counter: it is an indicator instrument.
- L. pulmonaria is a tripartite lichen -- a symbiosis of three organisms: an ascomycete fungus (the structural body), a green alga (Dictyochloropsis reticulata, the primary photosynthetic partner), and a cyanobacterium (Nostoc, the nitrogen-fixing partner). The three-way partnership is unusual and fragile
- The lichen requires old-growth forest conditions to thrive: clean air (SO2 below ~10 ppb), high humidity (frequent fog or rainfall), long forest continuity (decades to centuries of unbroken canopy), and stable microclimate (sheltered from wind and extreme temperature)
- In the Pacific Northwest, L. pulmonaria grows on bigleaf maple (Acer macrophyllum), red alder (Alnus rubra), Oregon ash (Fraxinus latifolia), and occasionally on old-growth conifers. Its presence on a tree is a reliable indicator that the forest has been ecologically stable for decades
- The lichen is sensitive to atmospheric pollutants, particularly sulfur dioxide and nitrogen compounds. At elevated nitrogen deposition (>2.5 kg N/ha/yr), the Nostoc cyanobiont becomes saturated with nitrogen, its nitrogen-fixation rate drops, and the lichen's growth pattern changes -- the thallus color shifts from characteristic grey-green with brown reproductive patches to a sickly yellow-green
- This response is a threshold detector: below the critical load, the lichen is healthy and indicates clean air. Above the critical load, the lichen degrades and eventually disappears from the forest. The presence/absence of L. pulmonaria is a binary signal -- the biological equivalent of a Geiger counter that reads either "normal" or "saturated"
- The connection to Explorer 1 is functional: the Geiger counter detected radiation by counting particle events. Lobaria pulmonaria detects air quality by metabolizing atmospheric nitrogen. Both instruments have a threshold beyond which they cannot function. The Geiger counter reads zero when overwhelmed by radiation. The lichen disappears when overwhelmed by pollution. Both absences are informative -- they signal that the environment has exceeded the instrument's range

In the Pacific Northwest, the presence of Lobaria pulmonaria on a tree is the lichenologist's equivalent of a clean air certificate. Its absence near urban areas and highways is the biological equivalent of Explorer 1's zero counts -- not a sign that nothing is there, but a sign that too much is.

### Mathematics (Secondary)

**Wing:** Counting Statistics and Dead Time Correction
**Concept:** The mathematics of particle counting -- how statistical fluctuations, dead time losses, and saturation effects combine to make high-flux measurements unreliable, and how correction formulas can recover true count rates from degraded measurements

**Deposit:** Explorer 1's Geiger counter measurement is fundamentally a counting problem, and counting follows Poisson statistics:
- For a random process with average rate lambda (particles per second), the probability of measuring k particles in time interval t is: P(k) = (lambda*t)^k * exp(-lambda*t) / k!
- The variance of a Poisson process equals its mean: sigma^2 = lambda*t. Therefore the standard deviation of a count is sqrt(N), and the fractional uncertainty is 1/sqrt(N). For Explorer 1's background rate (~30 counts/s in 1-second intervals): sigma = sqrt(30) = 5.5, fractional uncertainty = 18%
- The dead time correction links the Poisson arrival process to the detector response. The key formula: N_true = N_measured / (1 - N_measured * tau). This correction is exact for a "non-paralyzable" detector (one that recovers on a fixed schedule regardless of incoming particles). The Anton 314 approximated a "paralyzable" detector, where each arriving particle during the dead time resets the recovery clock. For a paralyzable detector: N_measured = N_true * exp(-N_true * tau). This equation has no closed-form inverse -- you must solve it numerically or graphically
- The paralyzable model explains Explorer 1's zero readings: as N_true increases, N_measured rises to a maximum of 1/(e*tau) = 3,679 counts/s, then DECREASES as the arrival rate grows. Eventually, the measured rate drops below the electronics' counting threshold and reads zero. The detector is not dead -- it is in continuous discharge -- but the output is indistinguishable from silence
- Rosetta connection: the dead time correction appears in nuclear physics (reactor monitoring), medical physics (PET scanners), and communications engineering (collision detection in network protocols). The mathematics is identical: a detector with a recovery time, events arriving at random, and the question of how many events are missed. Explorer 1 flew the first application of this mathematics in space

### Engineering (Secondary)

**Wing:** Juno I Launch Vehicle and Spin-Stabilized Upper Stages
**Concept:** How a military missile was adapted for scientific exploration -- the engineering of converting the Army's Redstone rocket into a satellite launcher

**Deposit:** The Juno I launch vehicle was an improvisation. The Army Ballistic Missile Agency (ABMA) at Redstone Arsenal, under Wernher von Braun, had proposed satellite launches as early as 1954 (Project Orbiter). The proposal was rejected in favor of the Navy's Vanguard program. When Vanguard TV-3 exploded on the launch pad on December 6, 1957, ABMA was given 90 days to launch a satellite. They were ready because they had been preparing in defiance of orders:
- Stage 1 was the Redstone missile, lengthened by 8 feet to carry additional propellant. Ethanol and liquid oxygen, 83,000 pounds of thrust, 155-second burn. The Redstone was combat-proven, the most reliable large rocket in the US arsenal
- Stages 2-4 were clusters of JPL-developed Sergeant solid rocket motors, mounted in a spinning "tub" atop the Redstone. Before Stage 1 burnout, electric motors spun the tub to approximately 750 rpm. The spin provided gyroscopic stabilization -- no guidance system, no gimbaled nozzles, no attitude control. The upper stages were pointed in the right direction, spun up, and fired on schedule
- Stage 2 fired 11 Sergeants simultaneously. Stage 3 fired 3. Stage 4 fired 1 (with Explorer 1 attached). Each stage burned for approximately 6.5 seconds. The total upper-stage burn time was about 20 seconds. In those 20 seconds, Explorer 1 went from ~2.5 km/s (Stage 1 burnout) to ~8 km/s (orbital velocity)
- The spin stabilization was the key innovation: solid rockets cannot be throttled or gimbaled. If one motor produces slightly more thrust than its neighbors, the cluster veers off course. Spinning the cluster averages out thrust asymmetries over each revolution. The transverse thrust components integrate to zero on the unit circle. This is the same trick a rifle uses: spin the bullet so that asymmetries average out
- Weight budget: the entire payload above Stage 1 was approximately 600 kg. Explorer 1 (including fourth stage casing) was 30.8 kg. The spacecraft itself (instruments, batteries, transmitters, structure) was 13.97 kg. The mass efficiency was ruthless: the instrument package weighed less than a large house cat

---

## TRY Sessions

### TRY 1: Build a Geiger Counter

**Duration:** 2-3 hours
**Difficulty:** Intermediate
**Department:** Electronics / Physics
**What You Need:** Arduino Uno ($15-25), SBM-20 Geiger-Muller tube (~$15 on surplus sites), high-voltage boost converter module (400V, ~$8), 10M-ohm resistor ($0.10), 100pF capacitor ($0.10), piezo buzzer ($1), breadboard + wires ($5). Total: ~$45.

**What You'll Learn:**
How a Geiger counter works at every level -- from the ionization cascade inside the tube to the counting circuit that records each event. You will build a working radiation detector, measure background radiation, and directly experience the dead time limitation that led to Explorer 1's discovery.

**Entry Conditions:**
- [ ] Arduino IDE installed
- [ ] All components on hand (SBM-20 is the critical part -- order in advance)
- [ ] Basic understanding of high voltage safety (400V can cause painful shock)
- [ ] Python 3.8+ installed (for analysis)

**The Exercise:**

**Step 1: Build the high-voltage supply and tube circuit**

```
CIRCUIT (CRITICAL — OBSERVE HV SAFETY):

High-voltage module:
  VIN (5V from Arduino VIN) → HV boost module → 400V output
  The SBM-20 operates at 400V (lower than the Anton 314's 900V)

Geiger tube circuit:
  HV (+400V) → 10M-ohm resistor → SBM-20 anode (thin wire end)
  SBM-20 cathode (body) → GND through 100pF coupling capacitor
  Signal tap: junction of 100pF cap and tube cathode → Arduino pin D2

  The 10M-ohm resistor limits the current through the tube
  during each avalanche event. Without it, the tube would
  draw excessive current and damage the HV supply.
  The 100pF capacitor couples the fast pulse (~1 microsecond)
  to the Arduino while blocking the DC high voltage.

SAFETY:
  - 400V will not kill you but will hurt
  - Never touch the tube or HV connections while powered
  - Use insulated wire for all HV connections
  - Discharge the capacitor before handling the circuit
  - The SBM-20 tube is glass — handle gently
```

**Step 2: Upload the counting sketch**

```arduino
// geiger_counter.ino
// Geiger counter with dead time measurement
// Explorer 1 tribute build

const int GEIGER_PIN = 2;     // interrupt-capable pin
const int BUZZER_PIN = 8;     // piezo click
volatile unsigned long count = 0;
volatile unsigned long last_pulse_time = 0;
volatile unsigned long min_interval = 999999; // track shortest interval

void pulseISR() {
  unsigned long now = micros();
  unsigned long interval = now - last_pulse_time;
  if (interval < min_interval && interval > 0) {
    min_interval = interval;
  }
  last_pulse_time = now;
  count++;
  // Brief click (non-blocking)
  digitalWrite(BUZZER_PIN, HIGH);
}

void setup() {
  Serial.begin(115200);
  pinMode(GEIGER_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  attachInterrupt(digitalPinToInterrupt(GEIGER_PIN), pulseISR, FALLING);
  Serial.println("EXPLORER 1 GEIGER COUNTER");
  Serial.println("========================");
  Serial.println("time_s,counts,cpm,min_interval_us,dead_time_est_us");
}

unsigned long last_report = 0;
unsigned long last_count = 0;

void loop() {
  // Turn off buzzer after brief click
  delayMicroseconds(50);
  digitalWrite(BUZZER_PIN, LOW);

  // Report every second
  if (millis() - last_report >= 1000) {
    unsigned long elapsed = millis() / 1000;
    unsigned long current_count = count;
    unsigned long interval_count = current_count - last_count;
    float cpm = interval_count * 60.0;

    Serial.print(elapsed);
    Serial.print(",");
    Serial.print(current_count);
    Serial.print(",");
    Serial.print(cpm, 1);
    Serial.print(",");
    Serial.print(min_interval);
    Serial.print(",");
    // Estimated dead time: minimum observed interval between pulses
    Serial.println(min_interval);

    last_count = current_count;
    last_report = millis();
    min_interval = 999999;
  }
}
```

**Step 3: Measure background radiation**

Power up the circuit. You should hear clicks at irregular intervals -- each click is one particle (cosmic ray, terrestrial gamma, or beta from natural radioactivity) passing through the SBM-20 tube. Typical background: 20-40 CPM (counts per minute) depending on your altitude, building materials, and local geology.

```python
# analyze_background.py
import numpy as np

# Record 5 minutes of data, then analyze
# Paste your 1-second count data here (or read from serial log)
counts_per_second = []  # fill with your data

total = sum(counts_per_second)
duration = len(counts_per_second)
mean_rate = total / duration
cpm = mean_rate * 60

print(f"BACKGROUND RADIATION MEASUREMENT")
print(f"================================")
print(f"Duration: {duration} seconds")
print(f"Total counts: {total}")
print(f"Mean rate: {mean_rate:.2f} counts/s ({cpm:.0f} CPM)")
print(f"Expected Poisson sigma: {np.sqrt(mean_rate):.2f} counts/s")
print(f"Observed std dev: {np.std(counts_per_second):.2f} counts/s")
print(f"")
print(f"EXPLORER 1 COMPARISON:")
print(f"  Your background: {cpm:.0f} CPM")
print(f"  Explorer 1 background (space): ~1800 CPM")
print(f"  Explorer 1 saturation (belt): ~0 CPM (saturated at >2M CPM)")
print(f"  Your tube dead time: ~190 microseconds (SBM-20)")
print(f"  Anton 314 dead time: ~100 microseconds")
```

**Step 4: Test the dead time**

Place a radioactive source near the tube (a smoke detector contains Am-241, a camping lantern mantle contains thorium, or use a calibration source if available). As the source gets closer, the count rate increases. At some point, you may observe the count rate plateau or decrease -- this is the onset of dead time effects.

**What Just Happened:**
You built the same type of instrument that discovered the Van Allen radiation belts. Your SBM-20 tube is a modern version of the Anton 314 that flew on Explorer 1. The physics is identical: gas ionization, Townsend avalanche, quench gas, dead time, pulse counting. At background radiation levels, the dead time is irrelevant -- events are separated by tens of milliseconds, and the dead time is 190 microseconds. But at high count rates (near a strong source), you can directly observe the dead time limitation that caused Explorer 1's most important readings to be zero.

**The NASA Connection:**
Van Allen built his first Geiger counter as a graduate student. You just built one as a TRY session. The instrument is the same. The physics is the same. The difference: you know about the radiation belts. Van Allen did not. He discovered them by understanding his instrument well enough to recognize that zero counts meant maximum flux. Building the instrument yourself gives you that same understanding.

---

### TRY 2: Find Lobaria pulmonaria in Your Local Forest

**Duration:** 1-3 hours (hiking time varies)
**Difficulty:** Beginner
**Department:** Mycology / Lichenology / Ecology
**What You Need:** Your eyes, a phone camera. A hand lens (10x, $5) is helpful but not required. Cost: $0-5.

**What You'll Learn:**
How to identify Lobaria pulmonaria (lungwort lichen) in the wild -- one of the most distinctive and ecologically important lichens in temperate forests. If you live in the Pacific Northwest, northern California, Appalachian Mountains, or northern Europe, L. pulmonaria may be in your nearest old-growth forest.

**Entry Conditions:**
- [ ] Willingness to go into the forest
- [ ] Phone for photos
- [ ] Access to a forest with old-growth or mature second-growth trees (not a young plantation)

**The Exercise:**

**Step 1: Know what you're looking for**

```
Lobaria pulmonaria identification features:

THALLUS (body):
  - Large foliose (leafy) lichen, 10-50 cm across
  - Green to grey-green when moist, grey-brown when dry
  - Surface deeply ridged and pitted, resembling lung tissue
    (hence "pulmonaria" — Latin for lung)
  - Lobes broad (1-3 cm wide), edges wavy
  - Lower surface with pale tomentum (fuzzy hairs)

KEY FEATURES:
  - Ridges and depressions on upper surface (the "lung" texture)
  - Soredia (powdery reproductive granules) on ridge edges
  - Brown apothecia (cup-shaped reproductive structures) on upper
    surface — less common than soredia
  - When wet: bright green (algal photobiont active)
  - When dry: grey-brown and papery (dormant)

HABITAT:
  - On bark of mature/old-growth hardwoods
  - Pacific Northwest: bigleaf maple (Acer macrophyllum) is primary host
  - Also on red alder, Oregon ash, occasionally conifers
  - Prefers humid, shaded sites with clean air
  - Often on north-facing aspects of trees
  - Found at low to mid elevations (0-1500 m in PNW)
  - Requires forest continuity — rare in young stands (<50 years)

LOOK-ALIKES:
  - Lobaria oregana: smoother surface, less deeply ridged,
    lacks the pitted "lung" texture. Common in PNW, often
    on the same trees. If the surface is smooth and lettuce-like,
    it's probably L. oregana.
  - Lobaria scrobiculata: blue-grey color (cyanobiont only,
    no green alga), smaller thallus, deeper pits
  - Peltigera spp.: ground-dwelling, veined underside,
    no ridged upper surface
```

**Step 2: Go find it**

If you are in the Pacific Northwest, visit any old-growth or mature second-growth forest with bigleaf maple trees. Particularly productive sites include:
1. Forest edges and riparian corridors (high humidity)
2. Valley bottoms with frequent fog
3. Old bigleaf maples with spreading canopies
4. Trails through old-growth western red cedar / Douglas-fir forest (look on the maples mixed in)

Look for large, green, lettuce-like lichens on tree trunks and branches. L. pulmonaria is typically at chest to overhead height on the trunk, or on major branches.

**Step 3: The indicator test**

```
If you found Lobaria pulmonaria, note:

WHAT IT TELLS YOU:
  - Air quality is good (SO2 < 10 ppb)
  - Nitrogen deposition is below critical load (~2.5 kg N/ha/yr)
  - The forest has been ecologically stable for decades
  - Humidity is high enough for the lichen's cyanobiont
  - The tree has been standing long enough for colonization (~20+ years)

WHAT IF YOU CAN'T FIND IT:
  - You're too close to an urban area or highway (air pollution)
  - The forest is too young (second growth < 40 years)
  - The forest is too dry (L. pulmonaria needs maritime climate)
  - You're above the elevation limit (~1500 m in PNW)
  - You're looking on the wrong tree species (check maples first)

CONNECTION TO EXPLORER 1:
  L. pulmonaria is a biological Geiger counter.
  It detects air quality the way the Anton 314 detected radiation:
    - Normal environment: lichen is present, healthy, green
      (Geiger counter reads normal background ~30 counts/s)
    - Degraded environment: lichen declines, turns yellow
      (Geiger counter shows elevated counts)
    - Severely polluted: lichen is absent
      (Geiger counter reads ZERO — saturated)

  The absence of the lichen, like the zero-count readings,
  signals that the environment has exceeded a threshold.
  Both absences are data. Both absences are informative.
```

**What Just Happened:**
You used a biological indicator species to assess the environmental quality of a forest. Lobaria pulmonaria has been used as an air quality biomonitor since the 1970s, when ecologists noticed its disappearance from forests near industrial areas. The lichen is a passive detector -- it requires no power, no electronics, no calibration. It grows where the air is clean and disappears where it is not. Explorer 1's Geiger counter was an electronic detector. Lobaria pulmonaria is a biochemical detector. Both respond to their respective environments with a threshold behavior that makes presence or absence a meaningful signal.

---

### TRY 3: Calculate Explorer 1's Orbital Parameters

**Duration:** 20 minutes
**Difficulty:** Beginner
**Department:** Mathematics / Space Science
**What You Need:** Python 3.8+, or a scientific calculator

**What You'll Learn:**
How to compute the essential orbital characteristics of Explorer 1 from its perigee and apogee altitudes, and understand why this particular orbit passed through the inner edge of the Van Allen radiation belt.

**Entry Conditions:**
- [ ] Python 3.8+ installed (or a scientific calculator)
- [ ] Completed Deposit 3 (Orbital Insertion) or willing to use provided values

**The Exercise:**

```python
import numpy as np

# Explorer 1 orbital elements
R_E = 6371       # Earth radius (km)
h_p = 358        # perigee altitude (km)
h_a = 2550       # apogee altitude (km)
r_p = R_E + h_p  # perigee radius (km)
r_a = R_E + h_a  # apogee radius (km)
mu = 3.986e5     # GM of Earth (km^3/s^2)

# Derived quantities
a = (r_p + r_a) / 2  # semi-major axis
e = (r_a - r_p) / (r_a + r_p)  # eccentricity
T = 2 * np.pi * np.sqrt(a**3 / mu)  # orbital period (s)

print(f"EXPLORER 1 ORBITAL PARAMETERS")
print(f"=============================")
print(f"  Perigee: {h_p} km alt ({r_p:,} km geocentric)")
print(f"  Apogee:  {h_a:,} km alt ({r_a:,} km geocentric)")
print(f"  Semi-major axis: {a:,.0f} km")
print(f"  Eccentricity: {e:.4f}")
print(f"  Period: {T/60:.1f} minutes ({T/3600:.2f} hours)")
print(f"  Inclination: 33.24 degrees")

# Velocity at perigee and apogee
v_p = np.sqrt(mu * (2/r_p - 1/a))  # km/s
v_a = np.sqrt(mu * (2/r_a - 1/a))  # km/s
print(f"\n  Velocity at perigee: {v_p:.3f} km/s")
print(f"  Velocity at apogee:  {v_a:.3f} km/s")
print(f"  Velocity ratio: {v_p/v_a:.2f}")

# L-shell at apogee (equatorial approximation)
L_apogee = r_a / R_E
print(f"\n  L-shell at apogee: {L_apogee:.2f}")
print(f"  Inner belt peak: L ≈ 1.5")
print(f"  Explorer 1 reached: L = {L_apogee:.2f}")
print(f"  → Just at the inner edge of the proton belt")

# Time above various altitudes
print(f"\nTIME ABOVE ALTITUDE THRESHOLDS:")
print(f"{'Altitude':>10} | {'Fraction':>8} | {'Minutes/orbit':>14}")
print(f"{'-'*40}")
for h in [500, 1000, 1500, 2000, 2500]:
    r = R_E + h
    if r >= r_a:
        continue
    cos_E = (a - r) / (a * e)
    cos_E = np.clip(cos_E, -1, 1)
    E_val = np.arccos(cos_E)
    M_val = E_val - e * np.sin(E_val)
    pct = (1 - M_val / np.pi) * 100
    t_min = pct / 100 * T / 60
    print(f"{h:>8,} km | {pct:>7.1f}% | {t_min:>12.1f}")

print(f"\nExplorer 1 spent most of its time between 500-2500 km —")
print(f"right in the zone where radiation increases with altitude.")
print(f"The Geiger counter was exposed to the belt on every orbit.")
```

**What Just Happened:**
You computed that Explorer 1's orbit placed the spacecraft in the inner edge of the Van Allen radiation belt for a significant fraction of each orbit. The apogee altitude of 2,550 km corresponds to L = 1.40 -- right at the onset of trapped proton flux. This was not by design; the orbit was determined by the Juno I launch vehicle's capability, not by scientific targeting. The discovery of the radiation belts was serendipitous -- the orbit happened to pass through the radiation environment at altitudes where the Geiger counter saturated, producing the anomalous zero readings that Van Allen correctly interpreted.

---

## DIY Projects

### DIY 1: Radiation Badge Dosimeter

**Duration:** 4-6 hours (build) + days to weeks (exposure)
**Difficulty:** Beginner-Intermediate
**Department:** Physics / Health Physics
**Cost:** ~$20

**Materials:**
- Dental X-ray film (unexposed, 2-4 packets, ~$8 from dental supply)
- Small squares of aluminum foil, copper sheet (thin), and lead sheet (1mm, from fishing sinkers)
- Black electrical tape
- Small plastic badge holder or card sleeve ($2)
- Film developer and fixer ($8-10, or use a local darkroom)

**What You Build:**
A film-badge radiation dosimeter -- the same type of personal radiation monitor worn by nuclear workers since the 1940s. The badge contains a strip of photographic film behind different thicknesses of metal shielding. After weeks of wearing, the film is developed. The degree of darkening indicates the radiation dose received. The different shielding filters discriminate between beta particles (stopped by aluminum), X-rays/gamma (partially attenuated by copper), and high-energy gamma (partially attenuated by lead).

```
BADGE CONSTRUCTION:

  ┌────────────────────────────┐
  │  RADIATION DOSIMETER       │
  │  ┌──────────────────────┐  │
  │  │  Open window (no     │  │ ← beta + gamma + X-ray
  │  │  shielding)          │  │
  │  ├──────────────────────┤  │
  │  │  Aluminum (0.1mm)    │  │ ← gamma + X-ray (beta stopped)
  │  ├──────────────────────┤  │
  │  │  Copper (0.5mm)      │  │ ← hard gamma (soft X-ray stopped)
  │  ├──────────────────────┤  │
  │  │  Lead (1mm)          │  │ ← hardest gamma only
  │  └──────────────────────┘  │
  │        ↑ dental film        │
  │        behind all windows   │
  └────────────────────────────┘

  1. Cut dental film to fit inside badge holder
  2. Cut metal strips to cover different zones of the film
  3. Tape metals in place: open/Al/Cu/Pb strips side by side
  4. Insert film behind the metal strips
  5. Seal in light-tight badge holder with black tape
  6. Wear for 2-4 weeks

  After exposure, develop the film:
  - The open window zone will be darkest (most exposure)
  - The lead-shielded zone will be lightest (most protection)
  - The gradient across zones tells you the radiation type:
    all zones equally dark = high-energy gamma
    only open zone dark = low-energy beta
```

**The Explorer 1 connection:** Explorer 1's Geiger counter measured radiation in real time but could not distinguish particle types or energies. A film badge integrates exposure over time and provides crude energy discrimination through the shielding filters. Both are radiation detection methods from the 1950s. Explorer 1's counter went to space; film badges stayed on Earth. Both use the same physics: ionizing radiation interacts with matter (gas in the Geiger tube, silver halide crystals in the film) to produce a detectable change. Your film badge records background radiation over weeks. Explorer 1's counter recorded space radiation over seconds. The time scale differs. The physics is identical.

### DIY 2: Explorer 1 Scale Model with Functioning Transmitter

**Duration:** 8-12 hours
**Difficulty:** Intermediate
**Department:** Engineering / Electronics
**Cost:** ~$30

**Materials:**
- Cardboard tube, ~6 inches long, ~6 inches diameter (oatmeal container works)
- Smaller cardboard tube, ~4 inches long, ~3 inches diameter (for nose cone instrument section)
- Arduino Nano ($8)
- 433 MHz transmitter module ($3)
- Temperature sensor (TMP36 or similar, $2)
- LED ($0.10) -- represents the Geiger counter signal
- 3 AA batteries + holder ($5)
- Spray paint: white and dark green/olive (Explorer 1 colors)
- Wire for antennas (4 pieces, ~30 cm each)

**What You Build:**
A 1:3 scale model of Explorer 1 that transmits real telemetry (temperature data) on 433 MHz, replicating the basic function of the spacecraft. The four wire antennas extend from the body like the real Explorer 1's turnstile antenna. An LED blinks at a rate representing the Geiger counter detection rate (randomized Poisson process at background rates).

```
CONSTRUCTION:

1. Body tube (Redstone 4th stage casing):
   - Large cardboard tube, painted dark olive/green
   - This represents the burned-out Sergeant motor casing
   - Explorer 1's 4th stage casing remained attached to
     the instrument section throughout the mission

2. Instrument section (nose cone):
   - Smaller tube, painted white with dark stripes
   - Contains: Arduino, transmitter, battery, temp sensor
   - LED visible through small window (Geiger counter indicator)

3. Antennas:
   - Four wire antennas at 90-degree intervals around the body
   - Angled ~45 degrees from the long axis
   - These form a turnstile antenna pattern, matching Explorer 1

4. Spin simulation:
   - Mount on a lazy susan or turntable
   - Spin slowly (~1 revolution per 5 seconds for visibility)
   - Explorer 1 actually spun at 750 rpm — impractical for a model

ARDUINO SKETCH (simplified):
  - Read temperature sensor every second
  - Encode as 8-bit value
  - Transmit on 433 MHz using simple ASK modulation
  - Blink LED at random Poisson intervals (~30 blinks/minute)
    representing background cosmic ray rate
  - When a button is pressed, increase LED blink rate dramatically
    then suddenly stop (simulating belt entry and saturation)
```

**Key learning moment:** Watching the LED blink steadily at "background" rate, then accelerate as you press the button (simulating belt entry), then go completely dark (simulating saturation) -- this is Explorer 1's story in LEDs. The darkness is the discovery.

---

## Fox Companies Pathways

### FoxCompute: Radiation Environment Monitoring Service

Explorer 1's Geiger counter measurement maps directly to a modern radiation monitoring service:
- Deploy networks of radiation sensors (modern SiPM-based detectors, not Geiger tubes) across critical infrastructure: nuclear facilities, hospitals, research labs, border crossings
- Real-time data aggregation and anomaly detection using the same dead time correction mathematics Van Allen used
- Alert system: when measured counts deviate from baseline (in either direction -- too high means contamination, too low could mean detector saturation or shielding), flag for investigation
- Integration with space weather forecasts for facilities sensitive to solar particle events (airlines, power grids, satellite operators)

### FoxFiber: Environmental Sensor Networks

The Lobaria pulmonaria indicator concept maps to distributed environmental monitoring:
- Network of air quality sensors along fiber routes, measuring SO2, NOx, particulates
- Each sensor node is a digital "lichen" -- reporting environmental quality as a simple index
- Threshold alerts when readings cross critical loads (2.5 kg N/ha/yr for forest health)
- Long-term trend monitoring for environmental impact assessment
- The fiber infrastructure provides both communication and power for remote sensor nodes

### SolarFox: Radiation-Hardened Power Systems

Explorer 1's batteries lasted 111 days. Modern spacecraft use solar panels that degrade in the radiation belts (as Explorer 6 demonstrated):
- Develop radiation-hardened solar cell technologies for satellites in Van Allen belt orbits
- Testing protocols based on the radiation environment Explorer 1 measured
- Power system lifetime prediction using the trapped particle flux models descending from Van Allen's discovery
- Radiation shielding optimization (mass vs. protection trade-off)

---

## Rosetta Connections

**From Explorer 1 to the Research Series:**

| Explorer 1 Concept | Rosetta Cluster | Research Connection |
|---|---|---|
| Geiger counter dead time | Electronics | Signal processing, detector physics (ELB, RAD, HAM clusters) |
| Radiation belt discovery | Space & Astrophysics | Magnetosphere physics, trapped particles (MAG, RAD clusters) |
| Juno I launch vehicle | Engineering | Rocket propulsion, multi-stage design (RKT, THR clusters) |
| Spin stabilization | Mathematics | Gyroscopic stability, unit circle dynamics (ROT, STA clusters) |
| Lobaria pulmonaria biomonitoring | Ecology | Indicator species, air quality assessment (ECO, AVI, LCN clusters) |
| Van Allen's instrument expertise | Science | Measurement science, calibration, systematic error (CAL, MSR clusters) |

**The Dead Time Pattern across domains:**
- Electronics: amplifier recovery time (same mathematics)
- Networking: collision backoff in Ethernet (same saturation behavior)
- Ecology: carrying capacity — population growth rate drops to zero when resources are saturated
- Medicine: PET scanner dead time correction (same formula, different detector)
- Broadcasting: audio compressor attack/release time (same time-constant structure)
- The dead time is universal: any system that must recover between events has a maximum sustainable rate, and exceeding that rate degrades performance non-monotonically

---

*"Robert Bunsen was born on March 30, 1811. He invented the spectroscope with Kirchhoff in 1860 — the instrument that revealed the chemical composition of stars by analyzing the specific wavelengths of light they emit. Before Bunsen and Kirchhoff, the composition of the Sun was a mystery. After their spectral analysis, it was chemistry. Bunsen also invented the Bunsen burner — but the burner was a means, not an end. He needed a clean, colorless flame so that the colors of burning elements would not be masked by the flame's own color. The burner served the spectroscope. The tool served the measurement. One hundred years after Bunsen, James Van Allen needed a clean, simple detector so that the signal of cosmic rays would not be masked by instrument noise. The Geiger counter served the same role as Bunsen's flame: a transparent medium through which the phenomenon could be observed. Bunsen's spectroscope found elements in stars. Van Allen's Geiger counter found protons in Earth's magnetic field. Both discovered invisible things by building instruments that made them visible. Both made the discovery because they understood their instruments completely — Bunsen knew his flame, Van Allen knew his tube. The Geiger counter is the spectroscope of the radiation belt. March 30: Bunsen's birthday, and the day we write about the man who used Bunsen's legacy to find a belt of fire around Earth."*
