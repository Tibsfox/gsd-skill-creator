# Mission 1.3 -- Pioneer 2: College of Knowledge Curriculum

## Track 4: Department Mappings, TRY Sessions, DIY Projects, Fox Companies Pathways

**Mission:** Pioneer 2 (Able 3)
**Primary Departments:** Engineering, Physics, Electronics
**Secondary Departments:** Chemistry, Mathematics, Art
**Organism:** Gaultheria shallon (Salal)

---

## Department Deposits

### Engineering (Primary)

**Wing:** Staging and Propulsion Systems
**Concept:** Multi-stage rocket design, ignition systems, and the consequences of a single-point failure in the propulsion chain

**Deposit:** Pioneer 2 flew on a three-stage Thor-Able vehicle. The first two stages performed nominally — the Thor booster lofted the vehicle through the atmosphere, and the AJ10-40 second stage accelerated it into a suborbital trajectory. The ABL X-248 third stage, a solid rocket motor, failed to ignite:
- Multi-stage rocket architecture: why stages exist (the Tsiolkovsky equation demands mass shedding)
- Thor booster: LR79-NA-9 engine, kerosene/LOX, 667 kN thrust, the workhorse of early American rocketry
- AJ10-40 second stage: pressure-fed, hypergolic, 35 kN thrust, the Able stage that also flew on Vanguard
- ABL X-248 Altair third stage: solid composite propellant, polyurethane binder, internal-burning star grain
- Ignition chain analysis: electrical timer, pyrotechnic squib, propellant surface ignition, chamber pressurization
- Failure mode: the ignition signal never reached the motor — first-link failure in a six-link chain
- Single point of failure: no redundant ignition path existed in 1958 solid motor designs
- Delta-v budget: Stage 3 was responsible for approximately one-third of the total velocity; its loss reduced Pioneer 2 from a lunar probe to a sounding rocket reaching 1,550 km
- Design heritage: the X-248 motor ignited successfully on Pioneer 1 (27 days earlier), Pioneer 3, and Pioneer 4 — three out of four flights

This deposit feeds forward into every mission that uses staged propulsion, every reliability analysis of ignition chains, and every discussion of single-point failure tolerance in critical systems.

### Physics (Primary)

**Wing:** Near-Earth Radiation Environment
**Concept:** The radiation field between 200 and 1,550 km altitude — the low-altitude inner Van Allen belt and the transition from atmosphere to trapped particle regime

**Deposit:** Pioneer 2's 45-minute flight returned near-Earth radiation data that complemented the higher-altitude measurements from Pioneer 1 and the low-orbit data from Explorer satellites:
- The inner Van Allen belt: protons trapped by Earth's magnetic dipole field, concentrated at ~1,000-6,000 km altitude
- Pioneer 2 sampled the bottom edge of the inner belt — the transition zone where atmospheric absorption competes with magnetic trapping
- Geiger-Mueller counter measurements: count rate as a function of altitude from surface to 1,550 km
- Comparison with Explorer 1 (apogee 2,550 km, discovered the belts) and Explorer 4 (dedicated radiation survey)
- The South Atlantic Anomaly: where the inner belt dips to its lowest altitude due to the offset between Earth's geographic and magnetic axes
- Radiation dose rates in the near-Earth environment: relevant to low Earth orbit spacecraft (ISS orbits at ~420 km, within the SAA influence zone)
- The cosmic ray background: at altitudes below the inner belt, the primary radiation source is galactic cosmic rays, not trapped belt particles
- Altitude-dependent transition: cosmic ray regime (surface to ~500 km) → inner belt regime (500-6,000 km) → slot region (6,000-10,000 km)

Pioneer 2 provided the closest thing to a ground-truth calibration of the very lowest belt boundary — a region that Pioneer 1 raced through too quickly to measure in detail and that the Explorer satellites could only sample from within their orbital inclinations.

### Electronics (Primary)

**Wing:** TV Camera Systems and Scanning Technology
**Concept:** Image dissector operation, raster scanning, and the first attempt to fly a camera beyond low Earth orbit on a Pioneer spacecraft

**Deposit:** Pioneer 2 carried a Farnsworth image dissector tube — the first TV camera assigned to a Pioneer mission:
- Image dissector principle: an electron image of the scene is formed on a photocathode, then a deflection system steers individual pixel positions onto an aperture, reading the image point by point
- Raster scanning: the deflection coils sweep the sampling aperture across the electron image in a systematic line-by-line pattern, converting 2D spatial information to a 1D time-series signal
- Resolution: approximately 150 scan lines, 150 pixels per line — roughly 22,500 total pixels per frame
- Frame rate: at the available telemetry bandwidth (~200 bits/s), each frame required approximately 9-10 minutes to transmit
- Grayscale depth: approximately 4-6 bits per pixel (16-64 gray levels)
- The Farnsworth connection: Philo Farnsworth demonstrated the first all-electronic television in 1927; the image dissector was his invention. Pioneer 2's camera was a direct descendant, adapted for spaceflight
- Signal-to-noise: the image dissector has no storage — each pixel is measured only during the instant the aperture passes over it, making it inherently noisier than storage-type cameras (vidicon, CCD) that integrate photons over the full frame time
- The camera never operated: Pioneer 2's 45-minute flight and 1,550 km maximum altitude did not provide conditions for useful imaging. The camera mass (~2 kg estimated) was carried without returning a single frame
- Technology lineage: image dissector (Pioneer 2) → vidicon tubes (Ranger, Mariner) → CCD arrays (Galileo, Hubble) → CMOS sensors (Mars rovers, JWST)

### Chemistry (Secondary)

**Wing:** Solid Propellant Chemistry
**Concept:** Composite solid propellant formulation — the chemistry inside the ABL X-248 motor that never burned

**Deposit:** The X-248 motor contained a polyurethane composite solid propellant — a precisely engineered mixture:
- Oxidizer: ammonium perchlorate (NH4ClO4), crystalline particles providing the oxygen for combustion
- Fuel: aluminum powder, typically 15-18% by mass, increasing specific impulse and flame temperature
- Binder: polyurethane, the structural matrix that holds the oxidizer and fuel particles together, also contributing as fuel
- Curing agents and catalysts: cross-linking agents that harden the binder into a solid rubber-like grain
- The grain geometry (internal-burning star pattern) determines thrust profile: the star's points create a large initial surface area that regresses toward a cylindrical bore, providing approximately neutral (constant thrust) or slightly regressive burn
- Combustion chemistry: NH4ClO4 decomposes exothermically; aluminum burns in the oxidizer gas, producing Al2O3 (alumina) particles at ~3,500K; the hot exhaust gas accelerates through the nozzle
- Specific impulse: ~235 seconds, limited by the molecular weight of the exhaust products and the combustion temperature
- Connection to Bunsen: Robert Bunsen's spectroscopic work identified elements by their flame emission spectra. The X-248's combustion flame contains emission lines from aluminum, chlorine, sodium (from impurities), and other elements — each identifiable by the spectroscopic methods Bunsen pioneered

### Mathematics (Secondary)

**Wing:** Delta-v Budgets and Staging Optimization
**Concept:** The mathematics of dividing a mission's velocity requirement among multiple stages, and the optimization problem of choosing stage mass ratios

**Deposit:** Pioneer 2's three-stage delta-v budget as a mathematical optimization problem:
- Total delta-v = sum of stage contributions: Delta_v = Delta_v_1 + Delta_v_2 + Delta_v_3
- Each term: Delta_v_i = v_e_i * ln(m_0_i / m_f_i) (Tsiolkovsky equation per stage)
- The staging optimization: given a total vehicle mass and a required delta-v, how should you divide the mass among stages?
- Equal-delta-v staging: if all stages have the same specific impulse, the optimal strategy is to give each stage the same delta-v contribution, which means each stage has the same mass ratio
- Unequal-Isp staging: when stages have different propellants (like Thor's kerosene/LOX vs. X-248's solid composite), the optimization shifts mass toward the higher-Isp stages
- The Pioneer 2 case: three stages with Isp values of 248, 270, and 235 seconds — the third stage had the lowest Isp but the best mass ratio (smallest structural fraction), making it efficient despite its lower exhaust velocity
- The zero-term catastrophe: when Delta_v_3 = 0, the total becomes Delta_v_1 + Delta_v_2 ≈ 7.7 km/s, which is 70% of the escape velocity — enough for a 1,550 km suborbital arc but nowhere close to the Moon

### Art (Secondary)

**Wing:** Early Space Imaging and Visual Record
**Concept:** The first attempt to photograph space from a Pioneer — the aesthetic and documentary ambition of attaching a camera to a spacecraft

**Deposit:** Pioneer 2's camera represents the moment when space exploration acquired the intent to see, not just to measure:
- The decision to include a TV camera: Pioneer 0 and Pioneer 1 carried only particle detectors, magnetometers, and micrometeorite sensors. Pioneer 2 added a camera — the first attempt to return visual imagery from beyond low Earth orbit on a Pioneer
- What the camera would have seen from 1,550 km: Earth filling most of the field of view, the curvature of the horizon, the thin blue line of the atmosphere, cloud patterns over the Pacific
- What the camera would have seen from lunar distance (had it arrived): the whole Earth disk, approximately 2 degrees across — the perspective that would later define the "Blue Marble" image (Apollo 17, 1972)
- The image dissector aesthetic: low resolution (150x150), slow scan, noisy — the images would have been grainy, ghostly, and historically priceless
- The Ranger precedent: when cameras finally reached the Moon on Ranger 7 (1964), the images were immediately iconic. Pioneer 2's camera was the unfired first shot in that campaign
- Data visualization of the radiation profile: without images, Pioneer 2's science is presented as graphs — count rate vs. altitude, intensity profiles, time series. These visualizations are the art of the mission — the translation of invisible radiation into visible understanding
- The salal connection: Gaultheria shallon (salal) grows as an understory shrub throughout the PNW, producing small dark berries and leathery evergreen leaves. Like Pioneer 2's camera — present, functional, but overshadowed by the canopy above — salal does its work in the shade. It never produces the spectacular bloom that draws attention, but it holds the forest floor together. Pioneer 2's contribution to the imaging lineage is the same kind of work: structural, foundational, invisible in the final product

---

## TRY Sessions

### TRY 1: Calculate Your Rocket's Delta-v Budget with Staging

**Duration:** 30 minutes
**Difficulty:** Beginner
**Department:** Mathematics / Engineering
**What You Need:** Python 3.8+, or a scientific calculator

**What You'll Learn:**
How to split a velocity budget across multiple stages and feel the exponential tyranny of the Tsiolkovsky equation — why throwing away hardware mid-flight is the only way to reach orbit.

**Entry Conditions:**
- [ ] Python 3.8+ installed (or a scientific calculator)
- [ ] Know what a logarithm is (or willingness to let Python calculate it)

**The Exercise:**

**Step 1: Define the Tsiolkovsky equation**

```
Delta_v = v_e * ln(m_0 / m_f)

v_e = Isp * 9.80665
```

This is the entire equation. Everything in rocketry flows from it.

**Step 2: Calculate delta-v for a single-stage rocket**

```python
import math

# Constants
g_0 = 9.80665  # m/s^2

# === SINGLE-STAGE ROCKET ===
# Total mass: 10,000 kg
# Propellant: 8,000 kg (mass fraction 0.80)
# Structure + payload: 2,000 kg
# Engine Isp: 300 s (good liquid engine)

m_0 = 10000    # initial mass (kg)
m_f = 2000     # final mass after burn (kg)
Isp = 300      # specific impulse (s)
v_e = Isp * g_0

dv = v_e * math.log(m_0 / m_f)
print(f"SINGLE STAGE:")
print(f"  v_e = {Isp} * {g_0} = {v_e:.0f} m/s")
print(f"  mass ratio = {m_0}/{m_f} = {m_0/m_f:.1f}")
print(f"  Delta-v = {v_e:.0f} * ln({m_0/m_f:.1f}) = {dv:.0f} m/s")
print(f"  = {dv/1000:.2f} km/s")
print(f"  Orbital velocity needed: ~7.8 km/s")
print(f"  Escape velocity needed: ~11.0 km/s")
print(f"  This rocket {'can' if dv > 7800 else 'cannot'} reach orbit.")
print(f"  This rocket {'can' if dv > 11000 else 'cannot'} escape Earth.")
```

**Step 3: Add staging — split into two stages**

```python
# === TWO-STAGE ROCKET (same total mass) ===
# Stage 1: 8,000 kg total, 6,400 kg propellant, 1,600 kg structure
# Stage 2: 2,000 kg total, 1,600 kg propellant, 400 kg structure
# (The 400 kg structure includes the payload)

# Stage 1
m_0_1 = 10000   # entire vehicle
m_f_1 = 10000 - 6400  # after Stage 1 burn
# But we drop Stage 1 structure (1,600 kg) before Stage 2 ignites
dv_1 = v_e * math.log(m_0_1 / m_f_1)

# Stage 2 ignites with only (m_f_1 - 1600) kg
m_0_2 = m_f_1 - 1600  # 2,000 kg
m_f_2 = 2000 - 1600   # 400 kg
dv_2 = v_e * math.log(m_0_2 / m_f_2)

dv_total = dv_1 + dv_2

print(f"\nTWO STAGES:")
print(f"  Stage 1: {dv_1:.0f} m/s ({dv_1/1000:.2f} km/s)")
print(f"  Stage 2: {dv_2:.0f} m/s ({dv_2/1000:.2f} km/s)")
print(f"  Total:   {dv_total:.0f} m/s ({dv_total/1000:.2f} km/s)")
print(f"  Gain from staging: {dv_total - dv:.0f} m/s")
print(f"  This rocket {'can' if dv_total > 7800 else 'cannot'} reach orbit.")
```

**Step 4: Add a third stage (Pioneer 2 configuration)**

```python
# === THREE STAGES ===
# Stage 1: 7,500 kg total, 6,000 kg prop, 1,500 kg struct
# Stage 2: 2,100 kg total, 1,680 kg prop, 420 kg struct
# Stage 3: 400 kg total, 320 kg prop, 80 kg struct (payload)

m_0_s1 = 10000
m_f_s1 = 10000 - 6000
dv_s1 = v_e * math.log(m_0_s1 / m_f_s1)

m_0_s2 = m_f_s1 - 1500  # drop Stage 1 structure
m_f_s2 = m_0_s2 - 1680
dv_s2 = v_e * math.log(m_0_s2 / m_f_s2)

m_0_s3 = m_f_s2 - 420  # drop Stage 2 structure
m_f_s3 = m_0_s3 - 320
dv_s3 = v_e * math.log(m_0_s3 / m_f_s3)

dv_3stage = dv_s1 + dv_s2 + dv_s3
dv_no_s3 = dv_s1 + dv_s2  # Pioneer 2 scenario

print(f"\nTHREE STAGES:")
print(f"  Stage 1: {dv_s1:.0f} m/s")
print(f"  Stage 2: {dv_s2:.0f} m/s")
print(f"  Stage 3: {dv_s3:.0f} m/s")
print(f"  Total:   {dv_3stage:.0f} m/s ({dv_3stage/1000:.2f} km/s)")
print(f"")
print(f"  WITHOUT STAGE 3 (Pioneer 2 scenario):")
print(f"  Total:   {dv_no_s3:.0f} m/s ({dv_no_s3/1000:.2f} km/s)")
print(f"  Lost:    {dv_s3:.0f} m/s ({dv_s3/dv_3stage*100:.0f}% of budget)")
```

**What Just Happened:**
You proved that staging works by throwing away dead weight. A single-stage rocket with 80% propellant fraction achieves ~4.7 km/s. The same mass split into two stages achieves more. Three stages achieves even more — but if any stage fails to fire, that entire contribution is lost. Pioneer 2 lost its third stage and fell from a lunar trajectory to a 1,550 km arc. The math is addition with a zero term.

**The NASA Connection:**
Every launch vehicle ever built uses staging. Saturn V: three stages to the Moon. Shuttle: two SRBs plus an external tank plus orbiter engines. Falcon 9: two stages. The principle is always the same — burn, discard, burn, discard. Pioneer 2 is the cautionary tale: your budget depends on every term in the sum being nonzero.

---

### TRY 2: Build a Simple Scanning Camera with Arduino

**Duration:** 45 minutes
**Difficulty:** Beginner-Intermediate
**Department:** Electronics / Art
**What You Need:** Arduino Uno ($25), micro servo ($5), photoresistor ($1), 10K resistor ($0.10), breadboard + wires ($5)

**What You'll Learn:**
How Pioneer 2's camera would have built up an image line by line by physically scanning across a scene — and why this is fundamentally the same operation as reading a book or mowing a lawn.

**Entry Conditions:**
- [ ] Arduino IDE installed
- [ ] Arduino Uno, micro servo, photoresistor, and 10K resistor on hand
- [ ] Basic understanding of analog input (or willingness to learn now)

**The Exercise:**

**Step 1: Build the scanner**

The photoresistor on a servo is your "image dissector" — it reads light intensity at one point, then the servo moves it to the next point.

```
Wiring:
  Servo signal → Pin 9
  Servo VCC → 5V
  Servo GND → GND

  Photoresistor → A0 (voltage divider with 10K to GND)
  Other leg of photoresistor → 5V
```

**Step 2: Upload the scanning sketch**

```arduino
// pioneer2_scanner.ino
// Single-axis scanning camera inspired by Pioneer 2's image dissector
#include <Servo.h>

Servo scanServo;
const int PHOTO_PIN = A0;
const int SERVO_PIN = 9;
const int NUM_PIXELS = 50;     // 50 points per scan line
const int SCAN_DELAY = 100;    // ms between readings

int scanData[NUM_PIXELS];

void setup() {
  Serial.begin(115200);
  scanServo.attach(SERVO_PIN);
  Serial.println("PIONEER 2 SCANNING CAMERA");
  Serial.println("Single-axis image dissector");
  Serial.println("Place a light/dark pattern in front of the sensor.");
  Serial.println("Starting scan...");
}

void loop() {
  // Sweep from 10 to 170 degrees
  for (int i = 0; i < NUM_PIXELS; i++) {
    int angle = map(i, 0, NUM_PIXELS - 1, 10, 170);
    scanServo.write(angle);
    delay(SCAN_DELAY);  // let servo settle

    // Read light level (0-1023)
    int reading = analogRead(PHOTO_PIN);
    scanData[i] = reading;

    // Print real-time reading
    Serial.print(i); Serial.print(",");
    Serial.print(angle); Serial.print(",");
    Serial.println(reading);
  }

  // Print the scan line as ASCII art
  Serial.println("\n--- SCAN LINE ---");
  for (int i = 0; i < NUM_PIXELS; i++) {
    // Map 0-1023 to a character
    int level = map(scanData[i], 0, 1023, 0, 9);
    char c = " .:-=+*#%@"[level];
    Serial.print(c);
  }
  Serial.println("\n--- END LINE ---\n");

  delay(2000);  // pause between scans
}
```

**Step 3: Create a test target**

Print or draw alternating black and white stripes on paper. Place it 10-20 cm in front of the servo+photoresistor. Run the sketch. Watch the ASCII art in the Serial Monitor — the stripes will appear as alternating light and dark regions in the scan data.

**Step 4: Understand the resolution limit**

- The servo moves in roughly 1-degree steps → 160 steps across the scan
- The photoresistor has a detection cone of roughly 20-30 degrees → each "pixel" overlaps its neighbors
- The effective resolution is limited by the wider of these two factors
- Pioneer 2's camera had the same constraint: the image dissector's aperture size determined the smallest resolvable feature

**What Just Happened:**
You built a one-dimensional scanning camera from $7 in parts. It converts a spatial scene (light pattern in front of the sensor) into a time series (voltage readings as the servo sweeps). This is exactly what Pioneer 2's image dissector would have done, with one additional axis of scanning (vertical sweep) and much higher sensitivity (photocathode instead of photoresistor). The principle is identical: move a single-point detector across a scene to build up an image.

**The NASA Connection:**
Pioneer 2's camera was assigned to image the Moon from close range or the Earth from high altitude. From 1,550 km, it would have seen the curvature of Earth, cloud patterns, and the day-night terminator. Your scanning camera, pointed at a striped target, is the same operation at tabletop scale. The engineering challenge is the same: scan speed, pixel dwell time, and signal-to-noise ratio all trade against each other.

---

### TRY 3: Design a Solid Rocket Motor Grain Geometry

**Duration:** 45 minutes
**Difficulty:** Intermediate
**Department:** Engineering / Mathematics
**What You Need:** Paper, pencil, compass, ruler, and a calculator (or Python)

**The Exercise:**

**Step 1: Understand why grain geometry matters**

A solid rocket motor's thrust profile depends on the surface area of burning propellant. As the grain burns, the surface changes shape. The geometry of the initial grain cross-section determines whether thrust increases, decreases, or stays constant during the burn.

```
Grain types:
  Cylindrical bore:  surface area INCREASES as bore grows → progressive thrust
  End-burning:       surface area CONSTANT (flat face) → neutral thrust
  Star pattern:      surface area roughly CONSTANT as star burns out → neutral
  Wagon wheel:       surface area INCREASES then DECREASES → boost-sustain
```

**Step 2: Draw a star grain cross-section (like the X-248)**

On paper, draw a circle (the motor case, say 10 cm diameter). Inside it, draw a 5-pointed star bore pattern:

1. Draw a circle of radius 5 cm (the motor case outer wall)
2. Draw a smaller circle of radius 2 cm (the star's inscribed circle)
3. Mark 5 evenly spaced points on the small circle (72 degrees apart)
4. From each point, draw a spike reaching to radius 3.5 cm (the star tips)
5. Connect the bases of adjacent spikes with concave arcs

The propellant is the area between the star bore and the outer circle. Fire burns inward from the star surface outward toward the case.

**Step 3: Calculate the initial burning surface area**

```python
import math

# Motor case
R_case = 0.20    # outer radius (m) — 20 cm for the X-248
L_grain = 0.60   # grain length (m)

# Star geometry (5-pointed)
n_points = 5
r_inner = 0.06   # inscribed circle radius (m)
r_tips = 0.12    # star tip radius (m)
tip_width = 0.01 # angular width at base of each spike (m)

# Approximate the star perimeter
# Each point: two sides of a triangle (tip to base) + arc between points
# Simplified: perimeter ≈ 2 * n_points * (r_tips - r_inner) + 2*pi*r_inner
# (This underestimates but gives the right order of magnitude)

# Side length of each spike
spike_height = r_tips - r_inner
spike_side = math.sqrt(spike_height**2 + (tip_width/2)**2)
perimeter_spikes = 2 * n_points * spike_side

# Arc between spikes (roughly the inscribed circle between spike bases)
arc_per_gap = 2 * math.pi * r_inner / n_points * 0.7  # ~70% of circle
perimeter_arcs = n_points * arc_per_gap

perimeter_total = perimeter_spikes + perimeter_arcs

# Burning surface area = perimeter * grain length (plus end faces)
A_burn = perimeter_total * L_grain
A_ends = 0  # end-inhibited (insulated, don't burn)

print(f"STAR GRAIN GEOMETRY (5-point, X-248 style)")
print(f"  Case radius: {R_case*100:.0f} cm")
print(f"  Star inscribed radius: {r_inner*100:.0f} cm")
print(f"  Star tip radius: {r_tips*100:.0f} cm")
print(f"  Number of points: {n_points}")
print(f"  Grain length: {L_grain*100:.0f} cm")
print(f"")
print(f"  Estimated perimeter: {perimeter_total*100:.0f} cm")
print(f"  Burning surface area: {A_burn:.4f} m^2 = {A_burn*1e4:.0f} cm^2")
print(f"")

# Thrust from burning surface
burn_rate = 0.008  # regression rate (m/s) at design pressure
rho_prop = 1750    # propellant density (kg/m^3)
v_e = 235 * 9.81   # exhaust velocity (m/s)

mass_flow = rho_prop * burn_rate * A_burn
thrust = mass_flow * v_e

print(f"  Burn rate: {burn_rate*1000:.1f} mm/s")
print(f"  Propellant density: {rho_prop} kg/m^3")
print(f"  Mass flow rate: {mass_flow:.2f} kg/s")
print(f"  Estimated thrust: {thrust:.0f} N = {thrust/1000:.1f} kN")
print(f"  X-248 actual thrust: ~12.5 kN")
```

**Step 4: Sketch the burn progression**

Draw three cross-sections showing the grain at:
1. **T=0** (ignition): sharp star pattern, maximum surface area
2. **T=15s** (mid-burn): star points have rounded, bore is larger, surface area roughly the same (the tips shrinking compensates for the bore growing)
3. **T=35s** (near burnout): nearly cylindrical bore approaching the case wall, surface area decreasing as the remaining propellant thins

The fact that a star grain maintains approximately constant surface area during most of the burn is the key design insight. It gives approximately constant thrust — a "neutral" burn profile.

**What Just Happened:**
You designed a solid rocket motor grain and calculated its performance from first principles. The star geometry is what made the X-248 produce steady thrust: as each spike burns away, the bore expands, and the total surface area stays roughly constant. Pioneer 2's motor had exactly this geometry, waiting to burn with precisely this profile. It never did. But the design is the same one used in modern solid motors — including the SLS boosters — scaled up by a factor of a thousand.

---

## DIY Projects

### DIY 1: Arduino Scanning Camera That Builds an Image

**Department:** Electronics / Art
**Difficulty:** Intermediate
**Estimated Cost:** $25
**Duration:** Weekend project (4-6 hours)

**What You Build:**
A two-axis scanning camera that builds up a grayscale image pixel by pixel, displayed on an OLED screen — Pioneer 2's image dissector rebuilt from servos and a photoresistor.

**Materials:**
- Arduino Nano ($8) or Uno ($25)
- Two micro servos ($10 for a pair)
- Photoresistor + 10K resistor ($1)
- SSD1306 OLED display 128x64 ($8)
- Small cardboard or 3D-printed bracket to mount servos orthogonally ($0-$3)
- Breadboard + jumper wires ($5)

**Steps:**
1. Mount two servos orthogonally: one sweeps horizontally (pan), the other sweeps vertically (tilt). Attach the photoresistor to the tilt servo's arm. This is your 2D scanning mechanism.
2. Wire both servos and the photoresistor to the Arduino. Wire the OLED via I2C.
3. Write firmware that performs a raster scan: for each row (tilt angle), sweep across all columns (pan angle). At each position, read the photoresistor value and store it.
4. After completing a full frame (e.g., 32x32 pixels), display the image on the OLED using grayscale dithering (map analog values 0-1023 to black/white threshold patterns).
5. Point the scanner at a high-contrast scene (a lamp next to a dark wall, a printed pattern). Start the scan and watch the image appear on the OLED, line by line, over several minutes.
6. Add a "frame counter" — display how many complete frames have been captured since power-on.
7. Compare scan times: at 100ms per pixel, a 32x32 image takes 102 seconds. At 50ms, 51 seconds. This is the fundamental tradeoff Pioneer 2's camera faced: faster scans mean lower signal-to-noise per pixel.

**OLED Display Layout:**
```
+----------------------------+
| PIONEER-2 CAM   Frame: 003 |
| 32x32 @ 100ms/px          |
| ....::==##@@##==::....     |
| ..::==##@@@@@@##==::..     |
| ::==##@@      @@##==::     |
| ==##@@          @@##==     |
| ##@@              @@##     |
| Time: 01:42 / Est: 01:47  |
+----------------------------+
```

**The Fox Companies Connection:**
A low-cost environmental monitoring camera for construction sites, wildlife observation, or agricultural field monitoring. The scanning camera architecture uses minimal components and extremely low data rates — ideal for remote locations with limited connectivity. Revenue: assembled units ($60-80), time-lapse monitoring service ($30/month), data analysis dashboards. Knowledge base: imaging fundamentals from this mission, telemetry from Mission 1.2, data visualization from the Art deposit.

---

### DIY 2: Model Rocket with Staged Ignition

**Department:** Engineering / Physics
**Difficulty:** Intermediate
**Estimated Cost:** $40
**Duration:** Weekend project (build day + launch day)

**What You Build:**
A two-stage model rocket using commercially available Estes motors, demonstrating the same staging principle that Pioneer 2 used — the first stage burns, separates, and ignites the second stage in flight.

**Materials:**
- Estes tandem-staged rocket kit (e.g., Mongoose or similar, $25-35)
- Estes B6-0 booster motor ($5, zero-delay for staging)
- Estes C6-7 sustainer motor ($5, 7-second delay for ejection)
- Recovery wadding, launch pad, launch controller (included in starter set or $15)
- Notebook for recording observations

**Steps:**
1. Build the two-stage rocket per kit instructions. Pay careful attention to the interstage coupler — this is where staging happens, and it is the equivalent of Pioneer 2's Stage 2/Stage 3 interface.
2. Install motors: B6-0 (booster, zero-delay — the hot exhaust gas from the booster ignites the sustainer motor directly). C6-7 (sustainer, 7-second delay before parachute ejection charge).
3. Pre-launch: record the motor specifications. Calculate expected altitude using the motor manufacturer's data:
   - B6-0: total impulse 5.0 N*s, thrust duration 0.85 s
   - C6-7: total impulse 8.8 N*s, thrust duration 1.85 s
4. Launch. Observe:
   - Booster burn (bright flame, ~1 second)
   - Staging event (brief pause, then sustainer ignites — you'll hear the pop and see the second flame)
   - Sustainer burn (higher altitude, smaller flame)
   - Coast phase + recovery
5. Record: did staging work? How smooth was the transition? Any visible wobble at staging?
6. Second launch: install the sustainer motor backwards (SIMULATING A STAGE 3 FAILURE). The booster ignites, burns, and... the sustainer doesn't light. The rocket coasts on booster velocity alone, reaching a much lower altitude. This is your Pioneer 2 simulation.
   - **SAFETY:** Do NOT actually install a motor backwards. Instead, simply don't install a sustainer motor at all (leave the upper stage empty). The booster burns, the hot gas vents harmlessly, and the rocket coasts on booster-only velocity. Record the altitude difference.

**Key Observations:**
```
Flight 1 (staging works):    Estimated altitude: ~250-350 meters
Flight 2 (no sustainer):     Estimated altitude: ~80-120 meters
Ratio: roughly 3:1 — staging provides dramatically more altitude
```

**The Fox Companies Connection:**
A model rocketry education program for schools and youth groups. Revenue: workshop fees ($30-40 per student, 15-student groups = $450-600/session), kit markup ($5-10/kit), launch event coordination ($200-400 per event). Partner with existing model rocket clubs (National Association of Rocketry sections). Knowledge base: staging, propulsion, recovery systems — each NASA mission adds curriculum material. Scale: franchise model, each region trains its own instructors.

---

### DIY 3: Bunsen Burner Flame Spectroscopy with a Diffraction Grating

**Department:** Chemistry / Physics
**Difficulty:** Beginner
**Estimated Cost:** $15
**Duration:** 1 hour

**What You Build:**
A simple spectroscope using a diffraction grating to observe the characteristic emission lines of different elements when introduced to a flame — the exact experiment Robert Bunsen (March 31, 1811) pioneered in the 1850s, connecting chemistry to light.

**Materials:**
- Diffraction grating sheet or slide ($5, 500-1000 lines/mm, available from science suppliers or old CD/DVD)
- Candle or butane lighter ($2, or a Bunsen burner if available)
- Table salt (NaCl, $0 — from kitchen)
- Salt substitute (KCl, "No Salt" brand, $3)
- Copper sulfate crystals ($5, available from garden supply as root killer)
- Small wire loop or wooden splints for holding samples ($0)
- Dark room

**Steps:**

1. **Set up:** Light the candle or burner in a dark room. Hold the diffraction grating up to one eye and look at the flame from about 30 cm away. You'll see the continuous spectrum of the flame — a rainbow spread horizontally.

2. **Sodium (yellow):** Dip a wooden splint or wire loop into table salt, then hold it in the flame. Watch through the diffraction grating: a bright yellow doublet appears at ~589 nm. This is the sodium D-line — the same emission Bunsen and Kirchhoff used to identify sodium in 1859. The yellow is unmistakable.

3. **Potassium (violet):** Dip a clean splint into the KCl salt substitute. Hold in the flame. Watch through the grating: a faint violet/lilac line appears at ~766 nm (deep red) and ~404 nm (violet). The violet is subtle — potassium emission is weaker than sodium. You may need to shield the flame from drafts.

4. **Copper (green-blue):** Dissolve a small amount of copper sulfate in a few drops of water. Dip a splint. Hold in flame. Watch: brilliant green-blue emission dominates the spectrum, with lines at ~510 nm (green) and ~515 nm (green). The copper flame is one of the most vivid in spectroscopy.

5. **Compare:** Look at each element's spectrum side by side (reload the splints). Notice:
   - Each element produces a DIFFERENT set of spectral lines
   - The lines are at FIXED wavelengths, regardless of flame temperature
   - The pattern is the element's fingerprint — unique and reproducible
   - This is how Bunsen identified new elements (cesium and rubidium) by finding spectral lines that didn't match any known element

6. **Connect to Pioneer 2:** The X-248 motor's combustion flame would have contained emission lines from aluminum (~394, ~396 nm — near ultraviolet), sodium (impurities), and chlorine molecular bands. If you could point Bunsen's spectroscope at a solid rocket motor exhaust plume, you would see the chemical identity of the propellant written in light. Modern LIBS (Laser-Induced Breakdown Spectroscopy) does exactly this for propellant quality control.

**What Just Happened:**
You performed the same experiment Robert Bunsen demonstrated in the 1850s. Each element has a unique set of emission wavelengths — a spectral fingerprint — because each element's electrons occupy unique energy levels. When an electron falls from a high energy level to a lower one, it emits a photon at a precise wavelength. Bunsen showed that this principle could identify elements in unknown samples. Kirchhoff extended it to identify elements in the Sun's atmosphere. The same principle identifies elements in rocket exhaust, stellar atmospheres, and interstellar gas clouds. Pioneer 2's propellant contained aluminum, ammonium perchlorate, and polyurethane — each with a spectral signature that Bunsen's method would reveal.

---

## Rosetta Stone Connections

### Cross-Department Translations

| From | To | Connection |
|------|-----|-----------|
| Engineering (staging) | Mathematics (summation) | Multi-stage rocketry is the hardware implementation of addition. Each stage contributes a delta-v term. The total is their sum. When a term is zero, the sum is reduced. This is the simplest possible operation — addition — applied to the hardest possible problem — escaping a gravity well. The Tsiolkovsky equation makes each term a logarithm of a mass ratio, but the combination rule is still addition |
| Physics (radiation) | Electronics (TV camera) | Pioneer 2's Geiger counter measured radiation — electromagnetic energy deposited in a gas tube. Pioneer 2's TV camera (had it operated) would have measured light — electromagnetic energy focused on a photocathode. Same physics, different wavelengths: the Geiger counter detects gamma rays and energetic particles; the camera detects visible photons. Both convert electromagnetic energy into electrical signals. The radiation environment and the visual scene are two views of the same electromagnetic spectrum |
| Chemistry (solid propellant) | Art (spectroscopy) | Bunsen's spectroscopy identifies elements by the light they emit when heated. A solid rocket motor heats its propellant to 3,500K during combustion. The exhaust plume is a spectroscopic laboratory: every element in the propellant announces itself in light. The chemistry of combustion becomes the art of color — the copper-green, sodium-yellow, and aluminum-blue of flame spectroscopy. The X-248's exhaust plume, had it burned, would have painted a spectrum across the rocket's wake |
| Electronics (scanning) | Mathematics (sampling) | The image dissector converts a 2D scene to a 1D time series by sampling points sequentially. Shannon's sampling theorem governs how many samples are needed to faithfully represent the original scene. Scan too slowly and you miss temporal changes; scan too sparsely and you miss spatial detail. The Nyquist limit — twice the highest spatial frequency — determines the minimum number of pixels. Pioneer 2's 150x150 resolution set a spatial Nyquist limit; its telemetry bandwidth set a temporal one |
| Engineering (ignition chain) | Physics (particle cascades) | The solid motor ignition chain (signal → squib → charge → surface → flame → pressure) is a cascade where each stage triggers the next. A Geiger-Mueller tube works the same way: one ionizing particle enters the gas, creates a few ion pairs, which accelerate and create more ion pairs, which create more — an avalanche that produces a detectable pulse from a single particle. Both are cascade amplifiers where a small initial input produces a large final output, and both fail completely if any link in the chain fails to trigger the next |

### GSD-OS Integration Points

**Screensaver contribution:** Staging Delta-v Visualizer
- Installs as XScreenSaver module
- Shows a multi-stage rocket ascending vertically
- Each stage ignites, burns (shrinking propellant bar), separates, and falls away
- Remaining stages continue upward with updated velocity
- Altitude counter ticks upward; velocity bar shows running delta-v total
- Color shifts from atmospheric blue to orbital black to deep space
- Third stage fails to ignite on a random percentage of runs (configurable) — rocket arcs back and reenters
- Configuration: number of stages (2-5), failure probability, trail particles, Earth curvature

**Desktop environment contribution:** Ignition Chain Monitor
- Desktop widget showing a 6-link chain (the solid motor ignition sequence)
- Each link lights up green when a monitored build step succeeds
- Red link = build failure, with the broken link identified
- Maps Pioneer 2's ignition failure to software build pipelines: compile → test → lint → bundle → deploy → verify
- Click any link for details on the corresponding build step
- Right-click: open research.md, simulation.md, or organism.md

**Control surface contribution:** Delta-v Budget Tracker
- Template for tracking cumulative progress toward a milestone
- Each "stage" is a phase of work; delta-v is progress percentage
- Shows cumulative total with color-coded margin (green if ahead, red if behind)
- If a stage completes at 0% (phase skipped or failed), shows the impact on the total
- Pioneer 2 lesson: losing one-third of your budget from a single failure can reduce your reach from the Moon to 1,550 km

---

## Community Business Pathways (Fox Companies)

### Pathway 1: Model Rocketry Education

**From this mission:**
- TRY Session 1 (delta-v budget) → staging mathematics curriculum
- TRY Session 3 (grain design) → propulsion engineering workshop
- DIY 2 (staged model rocket) → hands-on demonstration hardware

**Business model:**
- Model rocket workshop series: "How Rockets Stage" (4 sessions, progressive)
- Target: middle school and high school students, homeschool co-ops, scout troops
- Materials: Estes kits ($25-35/student), classroom supplies ($5/student)
- Venue: parks with open field for launches, school gymnasiums for build sessions
- Revenue: $35-50/student, 12-20 students per session, monthly = $5,040-12,000/year
- Certification: National Association of Rocketry (NAR) level 1 certification as a program outcome
- Knowledge base: staging and propulsion from this mission + trajectory math from Mission 1.2 + reliability from Mission 1.1

### Pathway 2: Environmental Camera Networks

**From this mission:**
- TRY Session 2 (scanning camera) → imaging fundamentals
- DIY 1 (2D scanning camera) → low-cost camera hardware
- Electronics deposit (TV camera systems) → data acquisition and transmission

**Business model:**
- Low-cost camera installations for wildlife monitoring, construction timelapse, garden monitoring
- Hardware: Arduino-based camera units ($40-60 assembled), weatherproof enclosure ($20)
- Service: installation ($100), monthly image retrieval and time-lapse compilation ($25/month)
- Target: nature centers, garden clubs, construction companies wanting progress documentation
- Revenue: 15 clients at $25/month + 3 installations/month at $100 = $8,100/year
- Knowledge base: imaging from this mission + telemetry from Mission 1.2 + sensor networks from Mission 1.1

### Pathway 3: Science Demonstration Services

**From this mission:**
- TRY Session 3 (grain design) → engineering visualization
- DIY 3 (flame spectroscopy) → chemistry demonstration
- Chemistry deposit (propellant chemistry) → science communication

**Business model:**
- Traveling science demonstrations for schools, libraries, and community events
- Signature demo: flame spectroscopy (safe, visually stunning, connects to Space Age history)
- Additional demos: rocket staging models, radiation detection (from Mission 1.2)
- Revenue: $200-400 per event, 2-4 events per month = $4,800-19,200/year
- Partner with school science departments for recurring visits
- Equipment: portable spectroscopy kit ($50), flame test chemicals ($20), model rockets ($100)
- Knowledge base: every mission adds a new demonstration to the catalog
