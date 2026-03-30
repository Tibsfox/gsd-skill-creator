# Mission 1.6 -- Explorer 6: College of Knowledge Curriculum

## Track 4: Department Mappings, TRY Sessions, DIY Projects, Fox Companies Pathways

**Mission:** Explorer 6 (August 7, 1959) -- First Photograph of Earth from Orbit
**Primary Departments:** Electronics, Photography/Imaging, Earth Science
**Secondary Departments:** Mycology, Mathematics, Communications
**Organism:** Trametes versicolor (turkey tail fungus)
**Bird:** Empidonax difficilis (Pacific Slope Flycatcher, degree 6)
**Dedication:** Vincent van Gogh (March 30, 1853)

---

## Department Deposits

### Electronics (Primary)

**Wing:** Photocell Technology and Spin-Scan Instrumentation
**Concept:** Using a single photoelectric sensor on a spinning platform to build an image -- the engineering of Explorer 6's television scanner

**Deposit:** Explorer 6's "camera" was not a camera in any modern sense. It was a photocell -- a single light-sensitive element that measured the total brightness falling on its aperture at each instant. The spacecraft's spin at 2.8 rpm swept the photocell across the scene, and the brightness-versus-angle signal during each spin revolution became one scan line. The electronics department lesson is in the signal chain:
- Photocell: a photoconductive or photovoltaic element with a narrow field-of-view slit (~0.1 degrees). Sensitivity in the visible spectrum. Quantum efficiency approximately 1% (1959 silicon photocells were primitive)
- Amplifier: the photocell signal (nanoamps to microamps) was amplified by a transistor amplifier with approximately 60 dB gain. The amplifier bandwidth was intentionally narrow (~10 Hz) to maximize signal-to-noise ratio
- Analog-to-digital conversion: the amplified brightness was quantized to approximately 6 bits (64 gray levels) for telemetry transmission. The quantization noise was negligible compared to the photon noise and amplifier noise
- Telemetry modulation: the quantized brightness was frequency-modulated onto the 108.06 MHz carrier. FM was chosen for noise immunity -- the same choice Armstrong made for commercial broadcasting
- Spin synchronization: a sun sensor provided a once-per-revolution timing pulse, synchronizing the brightness data to the spacecraft's angular position. Without this synchronization, the image could not be reconstructed -- each brightness sample would be unlocatable in angle
- Reconstruction on the ground: the telemetry was received, demodulated, and the brightness data was plotted on a CRT as the electron beam swept in synchronization with the spacecraft's spin rate. The image built up on photographic film exposed to the CRT

This signal chain -- photocell, amplifier, ADC, modulator, transmitter, receiver, demodulator, display -- is the complete imaging pipeline. Every digital camera, medical imager, and Earth observation satellite uses a descendant of this chain. Explorer 6's version was crude in every element but correct in architecture. The 85-km-per-pixel resolution was limited by the photocell's dwell time (6 ms per pixel at spin rate), the narrow amplifier bandwidth (10 Hz), and the low telemetry rate (1 bps for imaging). Each limitation was a 1959 technology constraint, not an architecture flaw.

### Photography / Imaging (Primary)

**Wing:** Image Formation from Angular Sampling
**Concept:** Constructing a two-dimensional image from a series of one-dimensional brightness profiles swept by spacecraft rotation -- the birth of spin-scan imaging

**Deposit:** The first photograph of Earth from orbit was not a photograph in the conventional sense. It was a reconstruction from angular brightness data, assembled over approximately 40 minutes (112 spin revolutions). The imaging department lesson covers the mathematics and practice of this reconstruction:
- The photocell sweeps a great circle on the celestial sphere during each spin revolution. The portion of that circle intersecting Earth's disk produces a brightness profile B(theta) for one scan line
- Between successive revolutions, the spacecraft's orbital motion and attitude changes shift the scan circle slightly, producing the next line at a different angle across Earth's disk
- The reconstructed image is a polar-to-Cartesian transform: from (spin angle theta, line number n) to (pixel row, pixel column)
- Geometric distortion arises because the scan circles are not parallel -- they are great circles on a sphere, and the angular offset between lines varies with spacecraft attitude. This distortion was partially correctable on the ground
- The resulting image, transmitted on August 14, 1959, showed a sunlit crescent of Earth over the central Pacific Ocean. Cloud patterns were visible as brightness variations. The coastline of the Americas was at the limb. The image was approximately 100 lines by 150 pixels, at 6-bit depth
- The image was crude by any standard. But it demonstrated that Earth could be imaged from orbit using a spinning spacecraft with a single detector -- a concept that the GOES weather satellite program would use for the next 44 years (1975-2003)

The connection to Van Gogh is structural: Van Gogh built images from discrete brushstrokes, each carrying color and direction information. Explorer 6 built an image from discrete brightness samples, each carrying intensity and angle information. In both cases, the individual samples are meaningless. The image emerges from their assembly. Pointillism and spin-scan imaging are the same idea, executed in paint and in photocells.

### Earth Science (Primary)

**Wing:** Planetary Observation from Space
**Concept:** What the first photograph of Earth from orbit revealed about our planet, and what it meant for the discipline of Earth science

**Deposit:** Before Explorer 6, every image of Earth was taken from within the atmosphere or from high-altitude balloons and sounding rockets that could see only limited areas. Explorer 6's photograph -- crude as it was -- showed the full disk of Earth as a celestial body. The Earth Science deposit records what this changed:
- Cloud patterns visible at continental scale: the image showed cloud formations spanning thousands of kilometers, confirming that weather systems have structure visible from orbit. This was the foundational observation for satellite meteorology
- The day-night terminator: the crescent shape of the illuminated Earth was clearly visible, demonstrating that Earth is a sphere (self-evident, but never photographed from this perspective)
- Albedo variation: even in the crude image, the brightness varied across the disk -- brighter where clouds were present, darker over ocean. This brightness variation is the raw data for remote sensing
- The limb: the edge of Earth against space was sharp and curved, with a thin bright line indicating the atmosphere. This limb observation would become critical for atmospheric composition studies using limb-scanning instruments on later missions
- The central Pacific: the image was taken during an apogee pass over the Pacific, showing one of the most featureless regions of Earth's surface. Yet even this "boring" view contained information -- the cloud patterns over the Pacific would later be recognized as part of the Intertropical Convergence Zone and the Pacific high-pressure cell
- Explorer 6 also carried trapped radiation detectors, a magnetometer, and micrometeorite detectors. The combination of imaging and in-situ measurement established the template for Earth system science: observe the planet from outside while measuring the space environment it inhabits

### Mycology (Secondary)

**Wing:** Trametes versicolor -- The Decomposer
**Concept:** Turkey tail fungus as the organism that breaks complexity into components, mirroring the way Explorer 6's photocell decomposed the image of Earth into angular brightness samples

**Deposit:** Trametes versicolor (turkey tail) is one of the most common polypore fungi in temperate forests worldwide, and one of the most important wood decomposers. The organism paired with Explorer 6 operates through structural decomposition:
- T. versicolor is a white-rot fungus -- it produces enzymes (laccases, peroxidases) that break down lignin, the structural polymer that gives wood its rigidity. By decomposing lignin, turkey tail releases the cellulose locked within it, making the carbon available for further decomposition
- The fruiting body displays concentric color bands (brown, tan, cream, gray, blue-green) that superficially resemble a topographic map or -- if you squint -- the scan lines of Explorer 6's image. This visual similarity is not the connection. The connection is functional
- Turkey tail colonizes dead wood via a network of hyphae that extend through the substrate, sampling nutrient availability and moisture at each point. The mycelial network is a spatial mapping system: it builds a three-dimensional model of the resource landscape by growing through it, measuring at each point, and allocating resources to the most productive fronts
- This is functionally equivalent to Explorer 6's imaging: the photocell swept across Earth's surface, sampling brightness at each angular position. The mycelium sweeps through the log, sampling nutrients at each spatial position. Both systems build a map through sequential sampling
- T. versicolor is found on fallen Douglas-fir logs throughout the Pacific Northwest -- the same forests where mission 1.5's organism (Douglas-fir) grows. The pairing is ecological: the Douglas-fir grows; the turkey tail decomposes the fallen tree; the nutrients return to the soil; the next Douglas-fir seedling feeds on those nutrients. The cycle is carbon in, carbon out, mediated by fungal chemistry
- In traditional medicine, turkey tail extracts (particularly polysaccharide-K, PSK) have been used as adjunct cancer therapy in Japan since the 1980s. The compound stimulates immune system response. The fungus that decomposes dead wood also stimulates the decomposition of abnormal cells. Pattern recognition at the molecular level
- The Carboniferous connection: before fungi evolved the ability to decompose lignin (approximately 300 million years ago), dead trees accumulated as coal deposits. Turkey tail's ancestors closed the carbon cycle. Without fungal decomposition, there would be no old-growth forests -- just layers of undecomposed wood. Explorer 6 photographed a planet whose living forests exist because fungi learned to eat wood

### Mathematics (Secondary)

**Wing:** Trigonometric Image Reconstruction
**Concept:** The mathematics of converting angular brightness data from a spinning photocell into a rectangular image -- coordinate transformation as the foundation of imaging science

**Deposit:** Explorer 6's image reconstruction is fundamentally a coordinate transformation problem:
- Raw data: brightness B as a function of spin angle theta and line number n: B(theta, n)
- Desired output: brightness I as a function of image coordinates (x, y): I(x, y)
- The transformation requires knowing the spacecraft attitude (spin axis orientation) and orbital position (distance and direction to Earth) for each line
- In polar coordinates (spin angle, line number), the image is distorted -- scan lines are arcs of great circles, not straight parallel lines. The transformation to Cartesian corrects this distortion
- The mathematics is trigonometric: the photocell position at time t is parameterized by (cos theta, sin theta), and the mapping from photocell direction to Earth-surface coordinates involves rotation matrices and spherical geometry
- This same mathematics underlies CT scanning (reconstructing a 3D volume from angular projections -- the Radon transform), synthetic aperture radar (SAR), and radio interferometry. Explorer 6's spin-scan technique is the ancestor of all angular-projection imaging systems
- The Radon transform connection: the brightness profile B(theta) for one scan line is a line integral of the Earth's radiance field along the photocell's line of sight. The collection of all such profiles at different angles constitutes a Radon transform of the scene. Image reconstruction is inversion of the Radon transform. In 1959, this was done by direct CRT display. In modern medical imaging, it is done by filtered back-projection or iterative algorithms. The mathematical framework is identical
- Rosetta connection: the trigonometry of spin-scan imaging connects to radar (angular resolution), sonar (beam sweeping), medical imaging (CT), and radio astronomy (aperture synthesis). All are angular sampling problems. Explorer 6 was the first to apply this mathematics from orbit

### Communications (Secondary)

**Wing:** Low-Rate Telemetry and the Challenge of Bandwidth
**Concept:** Transmitting an image at 1 bit per second -- how Explorer 6's communication system constrained what could be seen

**Deposit:** Explorer 6 transmitted imaging data at approximately 1 bit per second. This was not the spacecraft's full telemetry rate -- the imaging channel was allocated a fraction of the available bandwidth because the magnetometer, radiation detectors, and housekeeping data also needed to be transmitted:
- Total telemetry rate: ~64 bps on the primary link
- Imaging allocation: ~1 bps (shared with other experiments)
- Bits per image: ~90,000 (100 lines x 150 pixels x 6 bits)
- Time per image transmission: ~25 hours (at 1 bps)
- In practice, images were transmitted in segments during favorable ground station passes, with data stored onboard on a magnetic tape recorder and played back during contact periods
- The 108.06 MHz carrier frequency was in the VHF band -- relatively low, with broad beamwidth from the ground station antenna. This limited the achievable link margin
- Signal strength varied enormously across the orbit: strong at perigee (6,608 km), weak at apogee (48,771 km). Imaging data was typically transmitted during the perigee-to-apogee coast phase when signal strength was adequate and the spacecraft was at imaging altitude
- The 2-watt transmitter degraded over the mission as radiation damage accumulated on the solar cells. Power management became increasingly critical, forcing trade-offs between science data and spacecraft housekeeping
- The fundamental lesson: an imaging system is only as good as its communication link. Explorer 6 could scan a 100-line image in 40 minutes but needed 25 hours to transmit it. The bottleneck was not the sensor but the channel. This constraint drove the development of higher-frequency links, larger ground antennas, and eventually the Deep Space Network's high-data-rate capabilities

---

## TRY Sessions

### TRY 1: Build a Spin-Scan Camera with a Photoresistor

**Duration:** 45 minutes
**Difficulty:** Beginner-Intermediate
**Department:** Electronics / Photography
**What You Need:** Arduino Uno ($15-25), photoresistor ($1), 10K resistor ($0.10), small DC motor with turntable ($5-10), LED or flashlight ($0.50), breadboard + wires ($5). Total: ~$30.

**What You'll Learn:**
How to construct an image from angular brightness samples -- the same technique Explorer 6 used to take the first photograph of Earth from orbit. You will spin a photoresistor, record brightness versus angle, and reconstruct a crude "image" on your computer.

**Entry Conditions:**
- [ ] Arduino IDE installed
- [ ] Arduino Uno, photoresistor, resistor, motor, breadboard on hand
- [ ] Python 3.8+ installed (for image reconstruction)

**The Exercise:**

**Step 1: Build the spinning sensor**

```
Wiring:
  Photoresistor → A0 (voltage divider with 10K to GND)
  Other leg of photoresistor → 5V
  Motor power from external 5V supply (don't power from Arduino)

Mechanical setup:
  Attach photoresistor to the edge of a small turntable or disk
  mounted on the motor shaft. The photoresistor faces outward.
  When the motor spins, the photoresistor sweeps a circle,
  measuring brightness in all directions.

  Add a small piece of tape on the disk that breaks an IR sensor
  or triggers a hall effect sensor — this is your sync pulse,
  marking 0 degrees on each revolution.
```

**Step 2: Upload the scanning sketch**

```arduino
// explorer6_spin_scan.ino
// Spin-scan camera: records brightness vs angle during each revolution
// Sync pulse marks 0 degrees

const int PHOTO_PIN = A0;
const int SYNC_PIN = 2;  // Hall effect or IR break sensor

volatile bool sync_pulse = false;
int scan_data[360];  // one sample per degree
int angle_index = 0;
unsigned long rev_start_time = 0;
unsigned long rev_period = 0;  // measured revolution period

void syncISR() {
  sync_pulse = true;
}

void setup() {
  Serial.begin(115200);
  pinMode(SYNC_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(SYNC_PIN), syncISR, FALLING);
  Serial.println("EXPLORER 6 SPIN-SCAN CAMERA");
  Serial.println("Place objects around the sensor. Start the motor.");
  Serial.println("Data format: LINE,angle,brightness");
}

int line_number = 0;

void loop() {
  if (sync_pulse) {
    sync_pulse = false;
    unsigned long now = micros();
    if (rev_start_time > 0) {
      rev_period = now - rev_start_time;
    }
    rev_start_time = now;

    // Print previous revolution's data
    if (rev_period > 0 && line_number > 0) {
      for (int i = 0; i < 360; i++) {
        Serial.print(line_number);
        Serial.print(",");
        Serial.print(i);
        Serial.print(",");
        Serial.println(scan_data[i]);
      }
    }
    line_number++;
    angle_index = 0;
  }

  if (rev_period > 0) {
    unsigned long elapsed = micros() - rev_start_time;
    int current_angle = (elapsed * 360) / rev_period;
    if (current_angle >= 0 && current_angle < 360 && current_angle != angle_index) {
      scan_data[current_angle] = analogRead(PHOTO_PIN);
      angle_index = current_angle;
    }
  }
}
```

**Step 3: Set up a scene**

Place bright and dark objects around the spinning sensor at various angles:
- A bright lamp at one position (this is "Earth" -- bright, sunlit)
- A dark wall behind (this is "space" -- dark)
- A moderate-brightness object at another angle (this is "cloud")

**Step 4: Record and reconstruct**

```python
# reconstruct.py — build an image from spin-scan data
import numpy as np
import matplotlib.pyplot as plt

# Read CSV: line,angle,brightness
data = np.loadtxt("scan_data.csv", delimiter=",")
n_lines = int(data[:, 0].max())
image = np.zeros((n_lines, 360))

for row in data:
    line = int(row[0]) - 1
    angle = int(row[1])
    brightness = row[2]
    if line < n_lines and angle < 360:
        image[line, angle] = brightness

plt.figure(figsize=(12, 6))
plt.imshow(image, cmap='gray', aspect='auto')
plt.xlabel("Angle (degrees)")
plt.ylabel("Scan line")
plt.title("Explorer 6 Spin-Scan Image Reconstruction")
plt.colorbar(label="Brightness (ADC counts)")
plt.savefig("spin_scan_image.png", dpi=150)
plt.show()

print(f"Image: {n_lines} lines x 360 samples")
print(f"Total pixels: {n_lines * 360:,}")
print(f"Explorer 6 had ~100 lines x ~150 pixels = 15,000 pixels")
print(f"Your image has {n_lines * 360:,} samples — {'more' if n_lines*360 > 15000 else 'fewer'} than Explorer 6")
```

**What Just Happened:**
You built a spin-scan camera. The photoresistor swept a circle, measuring brightness at every angle. Each revolution produced one line of data. The accumulated lines formed an image -- a map of brightness versus angle versus time. This is exactly how Explorer 6 photographed Earth: a single photocell, spinning at 2.8 rpm, recording brightness during each transit of Earth's disk. Your scene was a room with lamps and walls. Explorer 6's scene was the sunlit face of Earth at 42,000 km.

**The NASA Connection:**
The spin-scan technique was used by GOES weather satellites for 44 years (1975-2003). Your Arduino version demonstrates the same physics at tabletop scale: a single detector, mechanical scanning, and image reconstruction from sequential angular samples. Modern weather satellites use 2D detector arrays and staring instruments -- they don't need to spin. But the mathematics of image formation from angular samples is the same.

---

### TRY 2: Identify Turkey Tail Fungus in Your Local Forest

**Duration:** 30 minutes to 1 hour (walking time)
**Difficulty:** Beginner
**Department:** Mycology / Ecology
**What You Need:** Your eyes, a phone camera. Cost: $0.

**What You'll Learn:**
How to identify Trametes versicolor (turkey tail) -- one of the most common and ecologically important wood-decomposing fungi in temperate forests worldwide. If you live near any woodland, park, or trail with fallen logs, you will find turkey tail.

**Entry Conditions:**
- [ ] Willingness to go outside
- [ ] Phone for photos (optional)
- [ ] A park, trail, or wooded area with fallen logs nearby

**The Exercise:**

**Step 1: Know what you're looking for**

```
Turkey tail identification features:

FRUITING BODY:
  - Shelf-like (bracket/conk) growing on dead wood
  - Semi-circular, fan-shaped, often overlapping in rosettes
  - Thin: 1-3 mm thick (flexible, not woody)
  - Width: 2-8 cm per individual bracket
  - Often in dense clusters of dozens of brackets

UPPER SURFACE (diagnostic):
  - Concentric color bands (the "turkey tail" pattern)
  - Colors vary: brown, tan, cream, gray, blue-green, dark brown
  - Bands are velvety to touch (fine hairs = tomentum)
  - Color pattern varies with age, season, and local conditions
  - The concentric banding is the key feature — no other common
    shelf fungus has this combination of thin flexible brackets
    with multi-colored concentric zones

LOWER SURFACE (critical for ID):
  - White to cream colored
  - Covered in tiny pores (not gills, not smooth)
  - Pores are 3-5 per millimeter (use a hand lens to see)
  - The pore surface is the spore-bearing surface

HABITAT:
  - Dead hardwood logs and stumps (preferred)
  - Also on dead conifer wood (including Douglas-fir)
  - Common on fallen branches, fence posts, lumber
  - Year-round (perennial fruiting body)
  - Worldwide distribution in temperate zones

LOOK-ALIKES (what it's NOT):
  - Stereum ostrea (false turkey tail): similar bands BUT
    smooth underside (no pores). Flip the bracket over.
    Pores = turkey tail. Smooth = false turkey tail.
  - Trichaptum biforme (violet-toothed polypore): similar
    shape but underside has violet/purple tint when fresh
  - Artist's conk (Ganoderma applanatum): much larger,
    woody, hard, brown underside
```

**Step 2: Go find some**

Walk to the nearest park or wooded area with fallen logs or stumps. Turkey tail is one of the most abundant fungi in temperate forests -- it colonizes dead wood within months of the tree's death. Look on:
1. Fallen logs (especially hardwoods: oak, maple, alder, birch)
2. Dead stumps (especially recently cut)
3. Fallen branches on the ground
4. Dead standing trees (snags) at eye level

In the Pacific Northwest, look on fallen red alder (Alnus rubra) or bigleaf maple (Acer macrophyllum) first -- these are preferred substrates. Turkey tail also grows on fallen Douglas-fir, connecting back to mission 1.5's organism.

**Step 3: Photograph and verify**

Take photos of:
1. The cluster in context (showing the log or stump it grows on)
2. The upper surface close-up (showing concentric color bands)
3. The lower surface close-up (MUST show pores -- this confirms ID)
4. The bracket in cross-section (thin and flexible, not hard)

**Step 4: The decomposition check**

```
If you've found turkey tail on a log, observe the wood:

  - Is the wood soft and spongy near the brackets?
    → White rot is active. The fungus is decomposing lignin.

  - Can you peel layers of wood away with your fingers?
    → Advanced decay. The cellulose skeleton is exposed.

  - Is the log interior lighter in color than fresh wood?
    → White rot characteristic: lignin removed, cellulose remains.

  - Are there mycelial fans (white sheets of fungal tissue)
    under the bark near the brackets?
    → Active colonization front. The fungus is expanding.

  Turkey tail can decompose a hardwood log to powder in 5-10 years.
  A softwood (Douglas-fir) log takes 10-30 years.
  In either case, the carbon returns to the soil.
```

**What Just Happened:**
You identified the organism that closes the carbon cycle in temperate forests. Trametes versicolor breaks down dead wood, releasing the carbon that living trees captured from the atmosphere. Without this fungus (and its relatives), dead trees would accumulate indefinitely -- as they did during the Carboniferous period, 300 million years ago, before fungi evolved the enzymatic machinery to decompose lignin. The PNW old-growth forests photographed by Explorer 6's successors exist because fungi like turkey tail recycle the fallen trees.

**The NASA Connection:**
Explorer 6's spin-scan camera decomposed the image of Earth into angular brightness samples. Turkey tail decomposes wood into molecular components. Both are decomposition processes -- one temporal (scan line by scan line over 40 minutes), one chemical (enzyme by enzyme over years). The concentric color bands on the turkey tail fruiting body even resemble scan lines: concentric arcs of varying brightness, encoding information about the growth conditions at each stage. Explorer 6 scanned Earth. Turkey tail scans a log. Both build understanding through incremental sampling.

---

### TRY 3: Calculate How Long Explorer 6 Spends Near Apogee

**Duration:** 20 minutes
**Difficulty:** Beginner
**Department:** Mathematics / Earth Science
**What You Need:** Python 3.8+, or a scientific calculator

**What You'll Learn:**
How Kepler's second law (equal areas in equal times) causes a highly eccentric orbit to spend most of its time near apogee. You will calculate the fraction of Explorer 6's orbit spent at various altitudes and understand why the spacecraft could image Earth's full disk for hours but only grazed perigee for minutes.

**Entry Conditions:**
- [ ] Python 3.8+ installed (or a scientific calculator)
- [ ] Know what an orbit is

**The Exercise:**

**Step 1: The orbital parameters**

```python
import numpy as np

# Explorer 6 orbital elements
R_E = 6371       # Earth radius (km)
h_p = 237        # perigee altitude (km)
h_a = 42400      # apogee altitude (km)
r_p = R_E + h_p  # perigee radius (km)
r_a = R_E + h_a  # apogee radius (km)
a = (r_p + r_a) / 2  # semi-major axis
e = (r_a - r_p) / (r_a + r_p)  # eccentricity
T = 12.8 * 3600  # orbital period (seconds)

print(f"Explorer 6 Orbit:")
print(f"  Perigee: {h_p} km alt ({r_p:,} km geocentric)")
print(f"  Apogee:  {h_a:,} km alt ({r_a:,} km geocentric)")
print(f"  Semi-major axis: {a:,.0f} km")
print(f"  Eccentricity: {e:.4f}")
print(f"  Period: {T/3600:.1f} hours")
```

**Step 2: Time above various altitudes**

```python
print(f"\nTime above various altitudes:")
print(f"{'Altitude':>12} | {'Fraction':>8} | {'Time (hr)':>10} | {'Meaning':>30}")
print(f"{'-'*70}")

for h in [500, 2000, 5000, 10000, 20000, 30000, 40000]:
    r = R_E + h
    if r >= r_a:
        print(f"{h:>10,} km | {'  ---':>8} | {'  ---':>10} | Never reaches this altitude")
        continue
    if r <= r_p:
        pct = 100.0
    else:
        cos_E = (a - r) / (a * e)
        cos_E = np.clip(cos_E, -1, 1)
        E_val = np.arccos(cos_E)
        M_val = E_val - e * np.sin(E_val)
        pct = (1 - M_val / np.pi) * 100
    t_hr = pct / 100 * T / 3600
    note = ""
    if h == 500:
        note = "Above ISS orbit"
    elif h == 20000:
        note = "GPS altitude"
    elif h == 40000:
        note = "Near apogee — imaging zone"
    print(f"{h:>10,} km | {pct:>7.1f}% | {t_hr:>9.1f}h | {note:>30}")

print(f"\nExplorer 6 spent more time above 20,000 km than below.")
print(f"Kepler's second law: it moves slowly when far away.")
print(f"This is why the orbit was chosen — hours of imaging")
print(f"near apogee, minutes of atmospheric drag at perigee.")
```

**What Just Happened:**
You proved that Kepler's second law turns a highly elliptical orbit into a natural observation platform. Explorer 6 spends ~76% of its time above 20,000 km and only ~3% below 1,000 km. At apogee, it drifts at 1.4 km/s -- practically hovering compared to the 10.3 km/s at perigee. This asymmetry was the whole point: spend hours with the full Earth disk visible, take the imaging data, then race through perigee and come back up again.

---

## DIY Projects

### DIY 1: Arduino Slow-Scan TV (SSTV) Transmitter and Receiver

**Duration:** 6-8 hours
**Difficulty:** Intermediate
**Department:** Electronics / Communications / Photography
**Cost:** ~$40

**Materials:**
- Arduino Nano or Uno ($8-25)
- Si5351 frequency synthesizer module ($8) -- generates audio tones
- Small speaker or audio output jack ($2)
- Photoresistor + 10K resistor ($1.10) -- the "camera"
- SSD1306 OLED display 128x64 ($8) -- shows received image
- Breadboard and wires ($5)
- FM handheld radio (for transmission, optional) ($15-25)

**What You Build:**
A slow-scan television system that converts brightness readings from a photoresistor into audio tones (bright = high frequency, dark = low frequency), transmits them as sound (or optionally over radio), and reconstructs the image on the OLED display at the receiver. This is the same principle used by amateur radio operators worldwide since the 1960s, and it is the direct descendant of Explorer 6's imaging telemetry.

```
SYSTEM ARCHITECTURE:

TRANSMITTER (Arduino #1 or transmit mode):
  Photoresistor → A0 → brightness value (0-1023)
  brightness → frequency mapping (1500 Hz = black, 2300 Hz = white)
  Si5351 → generates the audio tone at mapped frequency
  Audio output → speaker or radio mic input

  Transmission format (Martin M1 compatible):
    - Sync pulse: 1200 Hz for 4.862 ms (marks line start)
    - Scan line: 146.432 ms of frequency-modulated brightness
    - 256 lines per image
    - Total time per image: ~114 seconds

RECEIVER (Arduino #2 or receive mode):
  Audio input → analog comparator or ADC
  Frequency measurement → brightness value
  brightness → pixel on OLED display
  Build image line by line as audio is received

  The OLED shows the image building up in real time,
  exactly as Explorer 6's ground station CRT showed
  the Earth photograph assembling scan line by scan line.

DISPLAY:
  ┌──────────────────────────┐
  │ SSTV RECEIVER            │
  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░ │
  │ ▓▓▓▓▓▓▓▓░░▓▓▓▓░░░░░░░░░ │
  │ ▓▓▓▓▓░░░░░░░▓░░░░░░░░░░ │
  │ ░░░░░░░░░░░░░░░░░░░░░░░ │  ← image builds here
  │ Line: 42/256  SNR: 18 dB │
  │ Mode: Martin M1  114s    │
  └──────────────────────────┘
```

**The Explorer 6 connection:**
Explorer 6 transmitted brightness as a modulated signal: photocell brightness modulated the telemetry signal's frequency. Your SSTV system does the same: photoresistor brightness modulates audio frequency. Explorer 6 transmitted at ~1 bps over radio across 48,000 km. Your SSTV transmits at ~100 bps over audio across a room. The data rate is different. The principle is identical. Both convert light to frequency to signal, transmit, and reconstruct the image at the receiver.

**Key learning moment:** The student watches the image build up on the OLED display, line by line, over 2 minutes. Each line arrives as a sequence of tones -- high for bright, low for dark. The student HEARS the image before SEEING it. This audio-to-visual translation is the essence of telemetry: information encoded in one medium (sound frequency), decoded into another (pixel brightness). Explorer 6's ground station operators experienced this same translation -- listening to the signal quality while watching the CRT trace the image.

### DIY 2: Van Gogh Pixel Art Generator

**Duration:** 3-4 hours
**Difficulty:** Beginner-Intermediate
**Department:** Photography / Mathematics / Art
**Cost:** $0 (software only)

**Materials:**
- Python 3.8+ with PIL/Pillow and numpy
- Any digital image (start with a Van Gogh painting)
- Computer with display

**What You Build:**
A program that reduces any image to Explorer 6 resolution (~100x150 pixels, 64 gray levels) and reconstructs it using visible "scan lines" -- showing what Van Gogh's Starry Night would have looked like if Explorer 6 had painted it. The program demonstrates that even at extreme low resolution, the essential composition of a great painting survives -- the same insight that made Explorer 6's crude photograph meaningful.

```python
# van_gogh_explorer6.py
# Reduce any image to Explorer 6 resolution and reconstruct
# with visible scan-line artifacts

from PIL import Image
import numpy as np

def explorer6_filter(input_path, output_path):
    """Process an image through Explorer 6's imaging system."""
    img = Image.open(input_path).convert('L')  # grayscale

    # Downsample to Explorer 6 resolution
    e6_width = 150
    e6_height = 100
    img_small = img.resize((e6_width, e6_height), Image.BILINEAR)

    # Quantize to 6 bits (64 gray levels)
    arr = np.array(img_small, dtype=float)
    arr = np.round(arr / 4) * 4  # quantize to 64 levels
    arr = np.clip(arr, 0, 255)

    # Add scan line artifacts (brightness variation between lines)
    for line in range(e6_height):
        noise = np.random.normal(0, 8)  # line-to-line noise
        arr[line, :] += noise

    # Add photocell noise (per-pixel)
    pixel_noise = np.random.normal(0, 12, arr.shape)
    arr += pixel_noise
    arr = np.clip(arr, 0, 255).astype(np.uint8)

    # Upscale for display with visible scan lines
    scale = 6
    output = np.zeros((e6_height * scale, e6_width * scale), dtype=np.uint8)
    for y in range(e6_height):
        for x in range(e6_width):
            # Fill block
            output[y*scale:(y+1)*scale-1, x*scale:(x+1)*scale] = arr[y, x]
            # Scan line gap (dark line between scan lines)
            output[(y+1)*scale-1, x*scale:(x+1)*scale] = max(0, arr[y, x] - 40)

    result = Image.fromarray(output)
    result.save(output_path)
    print(f"Explorer 6 filter applied: {input_path} -> {output_path}")
    print(f"Resolution: {e6_width}x{e6_height} ({e6_width*e6_height:,} pixels)")
    print(f"Bit depth: 6 bits (64 gray levels)")
    print(f"Total data: {e6_width * e6_height * 6:,} bits")
    print(f"At 1 bps: {e6_width * e6_height * 6 / 3600:.1f} hours to transmit")

# Usage: explorer6_filter("starry_night.jpg", "starry_night_e6.png")
```

**Key learning moment:** The student runs their favorite photograph through the Explorer 6 filter and sees it reduced to a grainy, scan-lined, barely recognizable version. Then they run Van Gogh's Starry Night through the same filter -- and discover that the swirling composition is still visible even at 100x150 pixels. Van Gogh's paintings survive extreme downsampling because their composition is low-frequency: large swirling forms, broad color blocks, bold contrast. Explorer 6's photograph survived extreme downsampling for the same reason: Earth's disk against space is a fundamentally low-frequency image -- bright crescent against dark void. Resolution does not matter when the signal has large-scale structure.

### DIY 3: Mushroom Spore Print Art

**Duration:** 2-3 hours (setup) + 12 hours (overnight print) + 1 hour (fixation)
**Difficulty:** Beginner
**Department:** Mycology / Art
**Cost:** ~$5

**Materials:**
- Fresh turkey tail brackets (collected, not purchased)
- White paper and black paper (one sheet each)
- Glass or bowl to cover the mushroom
- Clear fixative spray (hairspray works, or artist fixative, $5)
- Phone camera

**What You Build:**
A spore print from a turkey tail bracket -- an impression of the spore-bearing surface created by allowing the mushroom to drop its spores onto paper overnight. Turkey tail spore prints are white (hence needing dark paper to see them), and the pattern reveals the pore structure of the fruiting body: a regular array of tiny holes, each producing a ring of spores on the paper. This is biological printing -- the fungus reproducing its own image in microscopic detail.

```
SPORE PRINT PROCEDURE:

1. Collect fresh turkey tail brackets (flexible, not dried)
   - Look for brackets with white, clean pore surface
   - Avoid old, dry, or insect-damaged specimens
   - Collect 3-5 brackets of different sizes

2. Prepare surfaces:
   - Black paper for white-spored species (turkey tail = white spores)
   - Place paper on a flat, vibration-free surface
   - Have glass or bowl ready to cover each specimen

3. Place brackets pore-side-down on paper:
   - Handle gently (spore release is mechanical)
   - Space brackets 5 cm apart
   - Cover each with glass/bowl (prevents air currents)

4. Wait 8-12 hours (overnight is ideal):
   - Spores fall by gravity from pores onto paper
   - Each pore produces a small ring of spores
   - The accumulated pattern maps the pore geometry

5. Remove brackets carefully (lift straight up)

6. Observe the print:
   - A white pattern of tiny dots/rings on dark paper
   - The dots correspond to individual pores
   - 3-5 pores per millimeter = visible pattern

7. Fix the print:
   - Light coat of clear fixative from 30 cm distance
   - Let dry 10 minutes
   - The print is now permanent art

CONNECTION TO EXPLORER 6:
  The spore print is an image created by biological sampling.
  Each pore is a "pixel" that deposits spores proportional
  to the maturity and health of that region of the bracket.
  The print is a 1:1 resolution map of the fruiting body.
  Explorer 6's photocell scanned Earth and recorded brightness.
  The turkey tail's pores release spores and record fertility.
  Both create spatial maps through sampling.
```

**Key learning moment:** The student holds up a spore print and a printout of Explorer 6's first photograph side by side. Both are low-resolution images created by physical sampling processes. The spore print has higher spatial resolution (3-5 points per millimeter) but no gray scale (spores are either present or absent). Explorer 6's image has lower spatial resolution (85 km per pixel) but 6-bit gray depth. Both encode information about their source through physical deposition: spores falling from pores, photons falling on a photocell.

---

## Fox Companies Pathways

### FoxFiber: Imaging and Remote Sensing Data Infrastructure

Explorer 6 demonstrated that imaging from orbit produces data that must be transmitted, stored, processed, and distributed. FoxFiber's fiber optic infrastructure enables the high-bandwidth data pipelines that modern Earth observation systems require:
- **Satellite downlink bandwidth:** GOES-R generates 2.8 Gbps of imaging data. This data flows through ground stations to data centers via fiber -- the same fiber that FoxFiber would deploy
- **Edge processing:** Reducing raw satellite data to useful products (cloud detection, vegetation indices, thermal anomalies) at the edge, near the ground station, reduces backbone bandwidth requirements
- **Data distribution:** Making Earth observation data available to researchers, farmers, emergency responders, and the public requires fiber to the last mile. Explorer 6's image was available to a handful of engineers. Modern EO data should be available to everyone

### SolarFox: Radiation-Hardened Power Systems

Explorer 6 was powered by 8,000 silicon solar cells generating approximately 18 watts -- and those cells degraded steadily as the spacecraft transited the Van Allen radiation belts twice per orbit. SolarFox's relevance:
- **Radiation-hard solar cell design:** Explorer 6's power degradation is the founding case study for radiation effects on photovoltaics. SolarFox designs would incorporate shielding, radiation-tolerant cell architectures, and graceful degradation planning
- **Environmental monitoring integration:** Solar installations on Earth face degradation from UV, thermal cycling, and soiling -- less dramatic than radiation but analogous in requiring long-term performance modeling. Explorer 6's power curve is the prototype degradation model
- **Forest canopy monitoring:** Turkey tail fungus decomposes dead wood, releasing carbon. SolarFox installations in forested areas would need to coexist with forest ecology -- panels above the canopy, monitoring equipment in the understory, with awareness of the decomposition cycle beneath

### Fox CapComm: Mission Communication Protocols

Explorer 6 transmitted imaging data at 1 bit per second through a channel operating at 5% of Shannon capacity. Fox CapComm's communication coordination relevance:
- **Low-bandwidth protocol design:** Many IoT and remote sensing applications operate at Explorer 6 data rates -- LoRa, Sigfox, and satellite IoT systems transmit at 1-1000 bps. Designing efficient protocols for these channels is a direct descendant of Explorer 6's telemetry design
- **Image compression for constrained channels:** Explorer 6 transmitted raw, uncompressed brightness data. Modern systems use JPEG, JPEG2000, and learned compression to reduce image data by 10-100x before transmission. The mathematics of this compression is information theory -- the same Shannon framework that defined Explorer 6's channel capacity

---

## Rosetta Connections

### Cross-Department Synthesis

Explorer 6's curriculum deposits connect across departments through the theme of **decomposition and reconstruction**:

1. **Electronics → Photography:** The photocell signal chain decomposes light into electrical signal. The image reconstruction chain reassembles those signals into a picture. The complete pipeline is decomposition followed by reconstruction -- analysis and synthesis
2. **Photography → Mathematics:** Image reconstruction from angular samples is a coordinate transformation (polar to Cartesian). The mathematics of this transformation is trigonometry -- the same mathematics that describes the photocell's position on the unit circle
3. **Mathematics → Mycology:** The Radon transform used in image reconstruction is a line integral. The mycelial network in a decomposing log is a three-dimensional sampling system. Both build spatial maps through linear traversal
4. **Mycology → Earth Science:** Turkey tail decomposes dead wood, closing the carbon cycle in forests. Earth observation from orbit monitors forests at planetary scale. The fungus works at the molecular level; the satellite works at the continental level. Both measure the same ecosystem
5. **Earth Science → Communications:** Earth observation data must be transmitted from orbit to ground. The communication link budget determines what can be observed -- resolution, revisit time, spectral coverage. The science is limited by the channel
6. **Communications → Electronics:** The communication link is the ultimate constraint on the electronics: there is no point building a higher-resolution sensor if the channel cannot transmit the data. Explorer 6's photocell was not the limiting factor -- the 1 bps imaging channel was

This circular dependency -- each department constraining and enabling the next -- is the architecture of any imaging mission. Explorer 6 demonstrated all six links in 1959, with 1959 technology, producing an image that proved the concept and launched the era of Earth observation from space.

---

*"Explorer 6 decomposed Earth into angular brightness samples and reassembled them into the first photograph from orbit. Turkey tail decomposes Douglas-fir logs into molecular components and reassembles them into fungal biomass and soil nutrients. Van Gogh decomposed landscapes into brushstrokes and reassembled them into paintings that still move people 136 years later. Decomposition is not destruction. It is the first step of understanding: break the complex into components, measure each component, then reconstruct from measurements. The photocell on the spinning spacecraft was not a camera. It was an analyst -- sweeping the scene, recording one datum at a time, building understanding through accumulation. The turkey tail in the forest is the same kind of analyst -- extending hyphae, sampling nutrients, mapping the resource landscape one point at a time. Both are slow. Both are thorough. Both produce maps from measurements. The first photograph of Earth and the first spore print of a turkey tail are the same act: making the invisible visible through patient, incremental observation."*
