# Mission 1.12 -- Explorer 7: College of Knowledge Curriculum

## Track 4: Department Mappings, TRY Sessions, DIY Projects, Fox Companies Pathways

**Mission:** Explorer 7 (October 13, 1959) -- First Earth Radiation Budget Measurement
**Primary Departments:** Climate Science, Thermal Physics, Instrumentation
**Secondary Departments:** Lichenology, Mathematics, Public Health
**Organism:** Usnea longissima (Methuselah's beard lichen)
**Bird:** Cinclus mexicanus (American Dipper, degree 12)
**Dedication:** Rudolf Virchow (October 13, 1821)

---

## Department Deposits

### Climate Science (Primary)

**Wing:** Earth Energy Budget and Radiative Forcing
**Concept:** The planetary energy balance that determines Earth's temperature -- how incoming solar radiation, albedo, greenhouse gases, and thermal emission interact to set the climate state

**Deposit:** Explorer 7 carried the first instrument designed to measure both sides of Earth's energy budget from orbit. Before Suomi's bolometers, the energy balance was a theoretical construct: physicists knew the equation (S*(1-alpha)/4 = sigma*T^4) but had no space-based data to verify it. Ground-based measurements could estimate incoming solar radiation at the surface, but they could not measure the outgoing radiation at the top of the atmosphere -- the number that closes the budget. Explorer 7 demonstrated that the budget could be measured, and the data confirmed the theoretical picture to within the instrument's accuracy:

- Incoming solar radiation intercepted by Earth: approximately 1361 W/m^2 at 1 AU, distributed over the cross-sectional area pi*R^2 and averaged over the sphere to give approximately 340 W/m^2 as the global mean insolation at the top of the atmosphere
- Reflected solar radiation (shortwave albedo): approximately 30% of the incoming, or about 100 W/m^2 reflected back to space. This fraction is dominated by clouds (which reflect 60-70% of incident sunlight), ice and snow (80-90% reflectivity), and bright deserts (35-45%). The ocean and vegetated land reflect only 5-15%
- Absorbed solar radiation: approximately 240 W/m^2, which must be balanced by outgoing thermal radiation in equilibrium
- Outgoing longwave radiation: approximately 240 W/m^2, emitted by the surface, atmosphere, and cloud tops at thermal infrared wavelengths peaked near 10 microns. The effective emitting temperature is approximately 255 K -- the temperature at which the Stefan-Boltzmann law gives 240 W/m^2
- The energy imbalance: the difference between absorbed solar and emitted thermal. In 1959, the imbalance was close to zero -- within the measurement uncertainty of Suomi's instruments. In 2025, the imbalance is approximately 1.0-1.4 W/m^2, measured by CERES (the direct descendant of Suomi's bolometers). This imbalance drives global warming

The climate science deposit from Explorer 7 is not a discovery of a new phenomenon. It is the establishment of a measurement method -- a way to quantify a known equation using orbital data. The equation was known. The data were not. Explorer 7 provided the first data. Every climate model, every IPCC assessment, every discussion of global warming ultimately depends on the measurement concept Suomi proved on a 41.5 kg satellite.

### Thermal Physics (Primary)

**Wing:** Stefan-Boltzmann Law and Blackbody Radiation
**Concept:** The physics of thermal emission -- how every object radiates electromagnetic energy proportional to the fourth power of its absolute temperature, and how this law governs energy exchange between the Sun, Earth, and space

**Deposit:** The Stefan-Boltzmann law (P = epsilon * sigma * T^4 * A) is the foundation of Explorer 7's science. Every surface with a temperature above absolute zero emits thermal radiation. The power emitted per unit area increases as the fourth power of the temperature. This means:

- The Sun (T ~ 5778 K) emits approximately 63 million W/m^2 from its surface
- Earth's surface (T ~ 288 K) emits approximately 390 W/m^2
- Earth's effective radiating temperature (T ~ 255 K) corresponds to approximately 240 W/m^2 of outgoing radiation at the top of the atmosphere
- The difference between 390 W/m^2 (surface emission) and 240 W/m^2 (top-of-atmosphere emission) is the greenhouse effect: 150 W/m^2 of surface radiation is absorbed by the atmosphere and re-emitted, with about 150 W/m^2 radiated back downward toward the surface (the "back-radiation" that warms the surface above the radiative equilibrium temperature)

Suomi's bolometers operated on this law directly. The black bolometer plate absorbed radiation and warmed up. Its equilibrium temperature was set by the balance between absorbed radiation (from the Sun and Earth) and emitted radiation (from the plate itself, governed by T^4). The thermistor measured the plate temperature. The Stefan-Boltzmann law converted that temperature into a radiation flux. The physics is elegant in its directness: temperature is radiation, radiation is temperature, and the fourth-power law connects them.

The American Dipper (Cinclus mexicanus, degree 12) experiences the Stefan-Boltzmann law at a visceral scale. The dipper is the only aquatic songbird in North America -- it walks underwater along the beds of fast, cold mountain streams, feeding on aquatic insects and fish eggs. It maintains a body temperature of approximately 40 C (313 K) while immersed in water at 2-8 C (275-281 K). The thermal radiation from the bird's body to the surrounding water follows the same T^4 law: the bird radiates at 313^4 and absorbs at approximately 278^4, losing heat at a rate proportional to (313^4 - 278^4). The dipper compensates with dense plumage, a low surface-area-to-volume ratio, high metabolic rate, and a preen gland ten times larger than other songbirds of its size (producing the oil that waterproofs the feathers). The energy balance of the dipper -- metabolic heat generation versus thermal loss to cold water -- is governed by the same physics that governs Earth's energy balance. Scale differs. The equation does not.

### Instrumentation (Primary)

**Wing:** Bolometers, Thermistors, and Radiation Measurement
**Concept:** The design and calibration of instruments that measure electromagnetic radiation by detecting the heat it deposits -- the engineering that converts photons into numbers

**Deposit:** A bolometer is the simplest possible radiation detector: a material that absorbs radiation, warms up, and has its temperature measured. The Suomi-Parent bolometers on Explorer 7 were flat aluminum plates (approximately 10 cm^2) with thermistors bonded to their backs. The thermistors were semiconductor devices whose electrical resistance changed with temperature -- approximately 4% per degree Kelvin at room temperature. The resistance was measured by the spacecraft's telemetry system and transmitted to ground stations.

The elegance of the design was in its simplicity and in the deliberate choice of surface coatings:
- The black bolometer was coated with lampblack (carbon black), giving it an absorptivity of approximately 0.95 across all wavelengths from ultraviolet through far infrared. It absorbed essentially everything that hit it -- solar photons, reflected Earthshine, thermal emission from clouds, spacecraft radiation. It was a nearly perfect absorber
- The white bolometer was coated with magnesium oxide (MgO), which reflects approximately 85% of visible and near-infrared radiation (wavelengths below approximately 3 microns) but absorbs approximately 90% of thermal infrared radiation (wavelengths above approximately 5 microns). It was spectrally selective: transparent to sunlight, opaque to heat
- The two plates, mounted side by side, saw the same radiation field but absorbed different fractions of it. The temperature difference between them encoded the ratio of shortwave to longwave radiation. The absolute temperatures encoded the total flux

Calibration was performed before launch in the University of Wisconsin laboratory using a calibrated blackbody cavity (a heated enclosure with a small aperture that approximates a perfect emitter) and a solar simulator (a xenon arc lamp filtered to match the solar spectrum). The calibration coefficients -- the mapping from thermistor resistance to radiation flux -- were stored in the ground processing software. In flight, the calibration was checked during orbital eclipse: with no solar input, the bolometer temperatures should match the predicted values for thermal-only illumination. Any drift in the calibration was tracked over the mission lifetime.

The instrumentation lesson: the measurement is only as good as the calibration. Suomi spent more time calibrating his bolometers than building them. The calibration determined the accuracy. The instrument determined the precision. Explorer 7 had adequate precision (the thermistors could resolve 0.1 K temperature differences) but limited accuracy (the absolute calibration was uncertain to approximately 5-10 W/m^2 because the paint properties changed in the space environment). Modern CERES instruments maintain calibration to approximately 1% by carrying internal calibration sources and by using redundant instruments that can be cross-compared. The principle is the same: measure, calibrate, verify. The rigor has increased by orders of magnitude.

### Lichenology (Secondary)

**Wing:** Usnea longissima -- Methuselah's Beard Lichen
**Concept:** The longest lichen in the Pacific Northwest as a living sensor of atmospheric quality and forest health

**Deposit:** Usnea longissima (old man's beard, Methuselah's beard lichen) is a fruticose lichen -- a branching, filamentous organism that hangs from tree branches in long, pendulous strands. Individual thalli can exceed 3 meters in the PNW old-growth forests where it reaches its greatest abundance: coastal Sitka spruce forests, the western hemlock zone of the Cascades, and the Douglas-fir/western red cedar forests of the Olympic Peninsula. It is not a plant. It is a symbiosis: a fungal partner (the mycobiont, an ascomycete in the family Parmeliaceae) and an algal partner (the photobiont, a green alga in the genus Trebouxia). The fungus provides structure, mineral absorption, and protection from desiccation. The alga provides photosynthetic sugars. The balance between them determines the lichen's health.

U. longissima is an indicator species for three conditions:
- **Air quality:** It is extremely sensitive to sulfur dioxide and nitrogen compounds. Where atmospheric nitrogen deposition exceeds approximately 3-5 kg/ha/yr, U. longissima declines. It has disappeared from forests near major urban areas throughout the PNW, including the Puget Sound lowlands and the Willamette Valley floor. Its presence at a site indicates clean air; its absence may indicate chronic pollution
- **Forest age:** It grows slowly (2-5 cm/yr) and disperses poorly (it reproduces primarily by fragmentation -- pieces break off and are carried by wind to new branches). Establishing on a new tree requires decades. A forest with abundant U. longissima is typically old-growth or late-successional -- at least 150-200 years since major disturbance
- **Moisture regime:** It requires frequent fog or light rain for hydration. It thrives in the fog belt of the Oregon and Washington coasts and in the cloud forests of the western Cascades. Interior forests east of the Cascade crest are too dry for it

The connection to Explorer 7 is structural: both the lichen and the bolometer are passive sensors that integrate atmospheric conditions over time. The bolometer integrates photon flux; the lichen integrates nitrogen deposition, moisture, and air quality. Both respond to imbalance. Both record the state of the atmosphere. The bolometer records it as temperature. The lichen records it as growth rate, biomass, and presence or absence.

### Mathematics (Secondary)

**Wing:** Linear Algebra and the Two-Equation System
**Concept:** How Suomi's paired bolometers create a system of two linear equations in two unknowns -- the fundamental technique of separating mixed signals

**Deposit:** The two-bolometer measurement is a 2x2 linear system: Ax = b, where A is the absorptivity matrix, x is the flux vector [F_solar, F_thermal], and b is the measured power vector [P_black, P_white]. The system is solvable because det(A) is non-zero -- the rows of A are linearly independent, meaning the two bolometers respond differently to the two radiation components. Suomi's paint selection maximized this independence. The condition number of A (the ratio of its largest to smallest singular value) determines the sensitivity of the solution to measurement errors. A well-conditioned system (low condition number) is robust; an ill-conditioned system (high condition number) amplifies errors. For Suomi's bolometer pair, the condition number was approximately 2.5 -- well-conditioned, meaning a 1% error in measured temperature produced approximately 2.5% error in derived flux. This is the mathematical reason the measurement worked.

### Public Health (Secondary)

**Wing:** Rudolf Virchow and Medicine as Applied Physics
**Concept:** The father of cellular pathology and social medicine, whose understanding of systemic balance anticipates the planetary energy balance

**Deposit:** Rudolf Virchow was born on October 13, 1821 -- exactly 138 years before Explorer 7's launch. He is one of the most consequential physicians in history. Virchow established cellular pathology -- the principle that disease originates in cells, not in humors or miasmas. He demonstrated that every cell arises from a pre-existing cell (omnis cellula e cellula), overturning the spontaneous generation hypothesis for cellular life. He investigated the typhus epidemic in Upper Silesia in 1848 and concluded that the cause was not biological but social: poverty, malnutrition, overcrowding, and political neglect. His prescription was not medicine but democracy, education, and public health infrastructure. "Medicine is a social science," Virchow wrote, "and politics is nothing but medicine on a large scale."

The connection to Explorer 7 is through the concept of systemic balance. Virchow understood the human body as a system in dynamic equilibrium -- health is balance, disease is imbalance. Cells divide and die in balance. Nutrients are consumed and replenished in balance. The immune system attacks pathogens and tolerates self-tissue in balance. When any of these balances is perturbed -- by infection, by malnutrition, by environmental stress -- disease results. The physician's task is to diagnose the imbalance and restore it.

Suomi understood Earth as a system in dynamic equilibrium -- climate is balance, warming is imbalance. Energy arrives from the Sun and departs as thermal radiation in balance. When that balance is perturbed -- by greenhouse gases, by changes in albedo, by volcanic aerosols -- the temperature changes. The climate scientist's task is to measure the imbalance and understand its causes.

Virchow would have recognized the structure immediately. The scale is different. The method is the same: measure the inputs and outputs, identify the imbalance, trace it to its source, intervene. Virchow intervened with public health policy. Suomi intervened with measurement -- because you cannot fix what you have not measured, and you cannot convince policymakers of an imbalance they cannot see. Explorer 7 made the imbalance visible.

---

## TRY Sessions

### TRY 1: Build a Radiation Balance Sensor

**Duration:** 3-4 hours
**Difficulty:** Beginner-Intermediate
**Department:** Thermal Physics / Instrumentation
**What You Need:** Two small metal plates (aluminum flashing or tin can lids, ~5x5 cm, ~$2), flat black spray paint (~$5), white spray paint (~$5), two thermistors or digital temperature sensors (DHT22 or DS18B20, ~$3-8 each), Arduino or Raspberry Pi Pico (~$5-15), breadboard and jumper wires (~$5-10), a desk lamp (100W incandescent or equivalent halogen -- the "Sun"), a warm object (a bowl of hot water, a heated surface -- "Earth's thermal emission"). Total: ~$25-50.

**What You'll Learn:**
How Suomi's paired-bolometer technique separates mixed radiation fields. You will build two bolometers (black and white painted plates with temperature sensors), expose them to the same mixed radiation field (visible light from the lamp + thermal radiation from the warm object), and use the two temperature readings to separate the two sources -- exactly as Explorer 7 did.

**Entry Conditions:**
- [ ] Materials assembled (two metal plates, paints, temperature sensors)
- [ ] Arduino/Pico programmed to read two temperature sensors
- [ ] Serial output or display showing both temperatures

**The Exercise:**

```
RADIATION BALANCE SENSOR:

1. PREPARE THE BOLOMETERS:
   Paint one metal plate flat black (matte, not glossy).
   Paint the other plate flat white.
   Let both dry completely (24 hours for best results).

   Attach a temperature sensor to the BACK of each plate
   with thermal paste or a dab of epoxy. The sensor must
   be in good thermal contact with the plate. Insulate the
   back of each sensor with a small piece of foam to prevent
   air currents from affecting the reading.

2. CALIBRATE:
   Place both plates in a dark, enclosed box (no light, no
   heat sources). Wait 5 minutes for thermal equilibrium.
   Record the temperature of each plate. They should be
   equal (room temperature). Any offset is your zero-point
   calibration.

3. TEST 1 — Visible light only (the "Sun"):
   Place the desk lamp 30 cm above both plates.
   Turn on the lamp. Wait 2-3 minutes for equilibrium.

   Record T_black and T_white.

   The black plate absorbs most of the lamp's radiation
   (visible + infrared from the hot filament).
   The white plate reflects most of the visible light
   but absorbs some infrared.

   Expected: T_black > T_white by several degrees.

4. TEST 2 — Thermal radiation only ("Earth's emission"):
   Turn OFF the lamp. Place a bowl of hot water (~60 C)
   10 cm below both plates (plates face downward toward
   the water).

   The hot water emits thermal infrared radiation (peaked
   around 10 microns at 60 C). Both plates absorb thermal
   infrared with similar efficiency (both paints are opaque
   in the thermal IR).

   Expected: T_black ~ T_white (both absorb thermal IR
   similarly). The white plate's advantage (reflecting
   visible) does not help here — there is no visible light.

5. TEST 3 — Mixed field (the real measurement):
   Turn ON the lamp (from above) AND place the hot water
   (from below). Both plates now receive visible light
   (from above) and thermal radiation (from below).

   Record T_black and T_white.

   Now solve the two-equation system:
     P_black = alpha_b * F_lamp + alpha_b * F_thermal
     P_white = alpha_w * F_lamp + alpha_w_IR * F_thermal

   Where:
     alpha_b ~ 0.95 (black absorbs everything)
     alpha_w ~ 0.15 (white reflects visible)
     alpha_w_IR ~ 0.85 (white absorbs thermal IR)

   The temperature difference between the plates is
   proportional to (alpha_b - alpha_w) * F_lamp.
   The temperature average is proportional to
   (alpha_b + alpha_w_IR)/2 * F_thermal + ...

   You are doing what Explorer 7 did:
   separating two radiation sources with two different
   sensors.

6. VARY THE MIX:
   Move the lamp farther away (reduces F_lamp).
   The T_black - T_white difference should decrease.

   Add more hot water or increase water temperature
   (increases F_thermal).
   Both plates should warm up approximately equally.

   Plot: T_black and T_white vs lamp distance.
   The curves diverge more when the lamp is close
   (more visible light to separate) and converge
   when the lamp is far (thermal dominates).

ANALYSIS:
   Suomi saw the same pattern from orbit:
   Over sunlit ocean (low albedo), the black bolometer
   was much warmer than the white (lots of absorbed sunlight).
   Over clouds (high albedo), the difference was smaller
   (more light reflected before reaching the bolometer).
   During eclipse (no sun), the temperatures converged
   (thermal-only, both plates respond similarly).

   Your desk lamp is the Sun. Your hot water is Earth.
   Your painted plates are Suomi's bolometers.
   The physics is identical.
```

### TRY 2: Lichen Survey Walk

**Duration:** 2-3 hours (outdoor)
**Difficulty:** Beginner
**Department:** Lichenology / Ecology
**What You Need:** A camera (phone), a magnifying glass or hand lens (~$5, optional), access to a forested area with mature conifers (public park, national forest trail, campus). A lichen field guide (free online: Oregon State University's "Macrolichens of the Pacific Northwest" or equivalent). No cost beyond transportation.

**What You'll Learn:**
How to identify common lichen growth forms (crustose, foliose, fruticose) and look for Usnea species on tree branches. You will conduct a simplified biomonitoring survey: counting lichen species richness and Usnea abundance at a site and comparing your results to expected values for different air quality zones.

**The Exercise:**

```
LICHEN SURVEY PROTOCOL:

1. SELECT YOUR SITE:
   Choose a trail or forested area with trees at least
   30 cm diameter (older trees have more lichen).
   Conifers (fir, spruce, hemlock, pine) are best.
   Deciduous trees (maple, oak, alder) also host lichen.

2. SURVEY 10 TREES:
   For each tree:
   a. Identify the tree species (or note "unknown conifer")
   b. Estimate diameter at breast height (DBH, arm-span method)
   c. Examine the trunk and lower branches (below 3 m)
   d. Count the number of visually distinct lichen types:
      - CRUSTOSE: flat, paint-like, adhered to bark
      - FOLIOSE: leafy, lobed, can be peeled from bark
      - FRUTICOSE: branching, bushy, hanging
   e. Look specifically for USNEA (hanging strands, pale green,
      round cross-section, pull gently — if the outer sheath
      peels and reveals a white inner cord, it is Usnea)
   f. Estimate Usnea abundance:
      0 = absent
      1 = rare (1-5 small thalli)
      2 = common (many thalli on multiple branches)
      3 = abundant (draping, thalli > 30 cm)

3. RECORD:
   Tree#  |  Species  |  DBH  |  Crustose  |  Foliose  |  Fruticose  |  Usnea (0-3)
   -------+-----------+-------+------------+-----------+-------------+-------------
     1    |           |       |            |           |             |
     ...  |           |       |            |           |             |

4. INTERPRET:
   Total lichen types across all 10 trees = species richness
   Average Usnea score = Usnea abundance index

   Guidelines (PNW):
     Richness > 15, Usnea > 2.0: Excellent air quality,
       likely old-growth or mature forest far from cities
     Richness 8-15, Usnea 1.0-2.0: Good air quality,
       second-growth forest or moderate distance from sources
     Richness < 8, Usnea < 1.0: Impaired air quality,
       urban-proximate or heavily managed forest
     Usnea = 0 on all trees: Possible nitrogen deposition
       impact or young forest without dispersal sources

   Compare your results to Explorer 7's mission:
   Your lichen survey is measuring the atmospheric balance
   at your site — the balance between clean air and
   nitrogen deposition. Explorer 7 measured the radiation
   balance from orbit. Both are measurements of imbalance.
   Both use passive sensors (lichen / bolometers) that
   integrate environmental conditions over time.
```

---

## DIY Project: Earth Energy Budget Poster

**Duration:** 3-5 hours
**Difficulty:** Beginner-Intermediate
**Department:** Climate Science / Mathematics
**What You Need:** Poster board (22x28 inches, ~$3), colored markers or pencils (~$5-10), ruler, calculator (phone), access to the internet for current data. Total: ~$8-15.

**What You'll Build:**
A visual representation of Earth's global energy budget -- a Sankey-style flow diagram showing the incoming solar radiation, reflected solar, absorbed solar, atmospheric absorption, surface emission, back-radiation, and outgoing thermal radiation. Every number on the poster comes from the balance equation that Explorer 7 first measured. The poster makes the invisible flows visible.

```
EARTH ENERGY BUDGET POSTER:

Layout: landscape orientation, flows from left to right

LEFT SIDE: THE SUN
  Draw the Sun. Label: "Solar radiation: 1361 W/m^2"
  Arrow flowing right, labeled "Intercepted by Earth disk"
  Wide arrow: "341 W/m^2 (averaged over sphere)"
  (This is 1361/4, the factor of 4 from disk vs sphere)

CENTER: THE ATMOSPHERE AND SURFACE
  The wide arrow splits into three:

  Arrow 1 (upward, light blue): "Reflected by atmosphere: 79 W/m^2"
    (clouds, aerosols, Rayleigh scattering)

  Arrow 2 (upward, white): "Reflected by surface: 23 W/m^2"
    (ice, snow, deserts, ocean glint)

  Arrow 3 (downward, yellow): "Absorbed by atmosphere: 79 W/m^2"
    (ozone UV absorption, water vapor near-IR, clouds)

  Arrow 4 (downward, orange): "Absorbed by surface: 160 W/m^2"
    (land, ocean, vegetation)

  TOTAL REFLECTED: 79 + 23 = 102 W/m^2 (albedo ~ 0.30)
  TOTAL ABSORBED: 79 + 160 = 239 W/m^2

  THE SURFACE:
  The surface emits upward:
  Arrow (red): "Surface emission: 398 W/m^2"
    (Stefan-Boltzmann at 288 K)

  But most is absorbed by the atmosphere:
  Arrow (dark red): "Absorbed by atmosphere: 358 W/m^2"
  Arrow (red, escaping): "Through atmospheric window: 40 W/m^2"
    (wavelengths 8-12 microns pass through clear atmosphere)

  THE ATMOSPHERE:
  The atmosphere emits in both directions:
  Arrow (downward, orange-red): "Back-radiation: 340 W/m^2"
    (greenhouse effect — atmosphere radiates toward surface)
  Arrow (upward, dark red): "Outgoing longwave: 199 W/m^2"
    (atmosphere radiates to space)

RIGHT SIDE: SPACE
  Total outgoing:
    Reflected solar: 102 W/m^2
    Surface through window: 40 W/m^2
    Atmospheric emission: 199 W/m^2
    TOTAL OUT: 341 W/m^2

  BALANCE CHECK: IN (341) = OUT (341) in equilibrium
  CURRENT IMBALANCE: ~1.0-1.4 W/m^2 (P_in > P_out)
  This is what Explorer 7 first measured.

BOTTOM ANNOTATION:
  "First measured from space: Explorer 7, October 13, 1959
   Suomi-Parent flat-plate bolometers
   Accuracy then: ~5-10 W/m^2
   Accuracy now (CERES): ~0.3 W/m^2
   The equation has not changed. The precision has."
```

---

## Ethics Module: The Responsibility of Measurement

**Duration:** 1-2 hours (discussion/essay)
**Department:** Public Health / Climate Science
**Format:** Structured discussion or written analysis

**The Scenario:**

It is 1959. Verner Suomi has published his first results from Explorer 7's bolometers. The data show that Earth absorbs approximately 240 W/m^2 of solar radiation and emits approximately 240 W/m^2 of thermal radiation. The balance is close. But Suomi suspects -- and subsequent decades will confirm -- that increasing CO2 concentrations from fossil fuel combustion will shift the balance by trapping more outgoing radiation. The imbalance is currently undetectable with 1959 instruments. But the physics is clear: more CO2 means less outgoing radiation, means more heat retained, means warming.

**Questions for Discussion:**

1. **The measurement imperative:** Suomi demonstrated that the radiation balance could be measured from orbit. He could not yet detect the imbalance. Should he advocate for more precise instruments and follow-on missions, even though the policy implications (reducing fossil fuel use) are politically explosive? Or should he limit his advocacy to the science and let others draw the policy conclusions? Virchow faced the same dilemma in 1848: his typhus investigation showed that poverty caused disease, but the remedy was political reform. He chose to advocate. What is the scientist's responsibility when measurement reveals an uncomfortable truth?

2. **The time lag:** The energy imbalance that causes warming is small (approximately 1 W/m^2 today) relative to the total flux (341 W/m^2). The warming it causes unfolds over decades to centuries. The measurement precision needed to detect it was not achieved until the 1990s (ERBE) and not confirmed until the 2000s (CERES). By the time the measurement was precise enough to be convincing, the imbalance had been growing for decades. How do you make policy based on a signal you can predict but not yet measure precisely? This is the Virchow problem again: the physician can see that conditions will produce disease before the disease manifests. Should intervention begin before the diagnosis is confirmed?

3. **The lichen parallel:** Usnea longissima is declining in PNW forests near urban areas. The decline has been documented over 30 years. The cause (nitrogen deposition) is understood. The remedy (reduce nitrogen emissions) is known. Yet the decline continues because the political and economic costs of emission reduction are borne by current stakeholders while the benefits accrue to future forests. Explorer 7's radiation balance data told the same story at planetary scale: the imbalance was growing, the cause was known, the remedy was clear, but the costs of action were immediate while the costs of inaction were deferred. How does the time horizon of consequences affect the political willingness to act on scientific measurement?

4. **Virchow's dictum:** "Medicine is a social science, and politics is nothing but medicine on a large scale." Replace "medicine" with "climate science." Is climate science a social science? Does the radiation balance measurement -- a number in watts per square meter -- have social content? Virchow argued that measuring disease without addressing its social causes was incomplete medicine. Is measuring the energy imbalance without addressing its social causes incomplete science?

---

## Fox Companies Pathways

**SolarFox:** Explorer 7 measured the solar irradiance that every solar energy system depends on. The solar constant (approximately 1361 W/m^2) sets the upper bound on solar energy collection at Earth's surface. After atmospheric absorption and scattering, approximately 1000 W/m^2 reaches the surface under clear skies at noon. SolarFox solar panel design must account for the same factors Suomi measured: atmospheric absorption, cloud cover (albedo), and time-averaged insolation. The CERES data products -- gridded maps of incoming solar radiation at the surface -- are the direct descendants of Explorer 7's measurements and are used by the solar energy industry for site assessment. SolarFox benefits from the measurement pipeline Suomi started.

**FoxFiber:** The bolometer-to-ground telemetry link on Explorer 7 transmitted data via radio during ground station passes. Data accumulated onboard between passes was stored in a limited buffer. Modern Earth observation satellites generate terabytes of data per day and downlink via laser communication (free-space optical links). FoxFiber's fiber optic infrastructure connects ground stations, data centers, and distribution networks that process and distribute the data stream that began with Explorer 7's thermistor readings telemetered to a single ground station at a few hundred bits per second. The data rate has increased by a factor of approximately 10 billion. The principle is the same: measure, transmit, process, distribute.

**Fox CapComm:** The coordination between Suomi at the University of Wisconsin and the Explorer 7 operations team at NASA Goddard required clear communication of what the instrument was measuring, what the calibration state was, and what the data meant. This is the classic principal investigator-to-mission operations communication pattern. Fox CapComm coordination protocols must handle exactly this interface: the instrument builder (who understands the physics) communicating with the operations team (who controls the satellite) and the data users (who interpret the results). Explorer 7 was one of the first satellites where the principal investigator was at a university remote from the operations center -- a distributed team architecture that Fox CapComm is designed to support.

---

*"The American Dipper walks into a mountain stream in January. The water is 3 degrees above freezing. The air is below it. The bird's body is 40 C -- a furnace wrapped in oiled feathers, submerged in a thermal sink. The energy budget of the dipper is Explorer 7's energy budget in miniature: energy in (metabolic heat from burning fat and insects), energy out (thermal radiation and conduction to cold water), balance (maintained by feather insulation, oil waterproofing, and a metabolic rate that can double in cold water). If the balance shifts -- if the stream warms and the aquatic insects decline, or if the bird's feather condition degrades, or if food availability drops -- the dipper cannot compensate. It leaves, or it dies. The planet has the same constraint, scaled up. If the energy balance shifts -- if more heat comes in than goes out -- the planet warms. It cannot leave. Suomi measured the planetary energy budget because the equation told him the balance mattered. Virchow measured the social determinants of disease because observation told him the balance mattered. The dipper does not measure anything. It lives the balance. When Usnea longissima disappears from a forest, it is because the atmospheric balance shifted beyond what the lichen could tolerate. When the dipper disappears from a stream, it is because the thermal and ecological balance shifted beyond what the bird could compensate. When the planet's temperature rises beyond what the ice sheets can absorb, it is because the energy balance shifted beyond what the climate system can buffer. Suomi gave us the instrument to measure the shift. Virchow gave us the framework to understand that measurement without action is incomplete. The dipper and the lichen cannot act. They can only respond. The action belongs to the species that built the instrument and read the data."*
