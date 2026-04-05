# Mission 1.25 -- Mercury-Atlas 9 / Faith 7: College of Knowledge Curriculum

## Track 4: Department Mappings, TRY Sessions, DIY Projects, Fox Companies Pathways

**Mission:** Mercury-Atlas 9 / Faith 7 (May 15--16, 1963) -- Final Mercury, 22 Orbits, 34 Hours, Manual Reentry
**Primary Departments:** Human Factors, Aerospace Engineering, Ecology
**Secondary Departments:** Mathematics, History, Music
**Organism:** Arbutus menziesii (Pacific Madrone)
**Bird:** Piranga ludoviciana (Western Tanager, degree 24, Ron Artis II)
**Dedication:** L. Frank Baum (May 15, 1856)

---

## Department Deposits

### Human Factors (Primary)

**Wing:** Spaceflight Endurance and Human Performance
**Concept:** How a single human sustains cognitive and physical performance over 34 hours in a 1.7 cubic meter capsule, including the first American sleep in space

**Deposit:** Cooper's 34-hour flight was a human factors experiment wrapped in a spaceflight mission:
- Sleep in microgravity: planned 7.5-hour rest period, approximately 4.5 hours of actual sleep confirmed by biomedical telemetry (heart rate drop from 72 to 58 BPM)
- Cognitive endurance: no measurable degradation in reaction time or decision quality over 34 hours, despite rising CO2 levels and accumulating fatigue
- Consumable management: the pilot as system manager, monitoring five independent consumable timelines (battery, O2, LiOH, H2O2, cooling water) and adjusting behavior to extend margins
- Manual control under stress: Cooper's heart rate during manual retrofire was 116 BPM -- elevated but controlled. Glenn's had been 134 during his automatic retrofire on MA-6. Cooper was calmer flying by hand than Glenn was watching the automation work
- Visual acuity: Cooper reported seeing individual buildings, roads, and truck tracks from 160 km altitude -- observations that exceeded theoretical predictions and prompted revisions to visual perception models for the orbital environment
- The pilot as the ultimate backup system: when the ASCS, gyros, and inverters failed, Cooper's training was the system that did not fail

### Aerospace Engineering (Primary)

**Wing:** Spacecraft Endurance Design
**Concept:** The Mercury capsule pushed 42% beyond its 24-hour design envelope, and the progressive systems failures that resulted teach the engineering of graceful degradation

**Deposit:** MA-9 is a case study in how engineered systems fail under endurance:
- The Mercury capsule was designed for approximately 24 hours of orbital operation with 50% margins on most consumables
- Cooper's 34.3-hour flight exceeded the design point by 42%
- Failures began on orbit 19 (~28 hours): false 0.05g indication → gyro drift → inverter intermittent → CO2 rising
- The failure sequence was not random -- it followed the bathtub curve of component reliability, with the weakest components failing first
- Each failure was individually manageable through workarounds (manual attitude control, reduced power draw, accepted CO2 increase)
- The mission demonstrated graceful degradation: the spacecraft lost capability progressively rather than catastrophically
- The redundancy architecture (automatic primary, manual backup) worked exactly as designed -- when primary failed, backup was ready

### Ecology (Primary)

**Wing:** Edge Habitat and Disturbance Recovery
**Concept:** Pacific Madrone's ecology of edge habitats, drought endurance, bark self-renewal, and fire resprouting as biological analogs of spacecraft endurance and recovery

**Deposit:** Arbutus menziesii -- the tree at the edge, the singular broadleaf evergreen, the biological model for endurance:
- Edge habitat specialist: Madrone grows where other PNW trees cannot -- rocky bluffs, thin soil, south-facing exposure
- Bark exfoliation as self-renewal: the continuous shedding of old bark reveals photosynthetic green tissue beneath
- Root crown resprouting: 89% resprouting rate after fire top-kill, averaging 4.7 resprouts per root crown
- Drought tolerance via deep root penetration into fractured bedrock
- Berry production: autumn berries feed migrating Western Tanagers and other frugivorous birds
- The only native broadleaf evergreen tree in the PNW -- a singular ecological strategy

---

## TRY Sessions

### TRY 1: Calculate Your Own Consumable Budget for a 34-Hour Capsule Stay

**Duration:** 30 minutes
**Difficulty:** Beginner
**Department:** Human Factors / Mathematics
**What You Need:** Python 3.8+ or a calculator

**What You'll Learn:**
How to budget the life support consumables for a Mercury-class spaceflight, and why the LiOH CO2 scrubber was the limiting factor.

**Entry Conditions:**
- [ ] Know what multiplication and division are
- [ ] Basic understanding of what humans need to survive (air, water, temperature)

**The Exercise:**

**Step 1: Your body's consumption rates**

```
Human metabolic requirements (resting/light activity):
  Oxygen consumption:     ~0.84 kg/day = 0.035 kg/hr
  CO2 production:         ~1.0 kg/day = 0.042 kg/hr
  Water consumption:      ~2.5 L/day = 0.104 L/hr
  Heat production:        ~80 W (resting) to ~150 W (light activity)
  Caloric requirement:    ~2000 kcal/day

Mercury capsule supplies (for comparison):
  Oxygen:                 5.9 kg (168 hours at rest)
  LiOH CO2 absorbent:    4.5 kg CO2 capacity (107 hours at rest)
  Battery power:          36,000 Wh (80 hours at 450 W)
  Cooling water:          16.3 kg
  Food:                   ~2 kg (concentrated, dehydrated)
```

**Step 2: Calculate your survival time**

```python
# How long would YOU last in a Mercury capsule?

o2_supply = 5.9        # kg
o2_rate = 0.035        # kg/hr at rest
o2_time = o2_supply / o2_rate

co2_capacity = 4.5     # kg CO2 the LiOH can absorb
co2_rate = 0.042       # kg/hr CO2 produced
co2_time = co2_capacity / co2_rate

battery = 36000        # Wh
power_draw = 450       # W nominal
battery_time = battery / power_draw

print(f"Oxygen lasts:      {o2_time:.0f} hours ({o2_time/24:.1f} days)")
print(f"CO2 scrubber lasts: {co2_time:.0f} hours ({co2_time/24:.1f} days)")
print(f"Battery lasts:     {battery_time:.0f} hours ({battery_time/24:.1f} days)")
print(f"\nLimiting factor:   CO2 scrubber ({co2_time:.0f} hours)")
print(f"Cooper's mission:  34.3 hours")
print(f"Margin:            {(1 - 34.3/co2_time)*100:.0f}%")
print(f"\nYou'd run out of CO2 scrubbing before anything else.")
print(f"The air would still have oxygen. You'd still have power.")
print(f"But the CO2 would make you dizzy, then unconscious.")
```

**What Just Happened:**
You discovered that the most dangerous consumable in a spacecraft is not the one you'd expect. Oxygen is abundant (168 hours). Battery power is generous (80 hours). The limiting factor is CO2 removal -- the LiOH canisters that absorb your exhaled carbon dioxide. Cooper's rising CO2 on orbit 21 was exactly this limit approaching. The math predicted it. The spacecraft confirmed it.

---

### TRY 2: Identify Pacific Madrone by Bark and Berries

**Duration:** 30 minutes to 1 hour (walking time)
**Difficulty:** Beginner
**Department:** Ecology
**What You Need:** Your eyes, a phone camera. Cost: $0.

**What You'll Learn:**
How to identify Arbutus menziesii -- the most visually distinctive tree in the Pacific Northwest -- by its unmistakable bark.

**Entry Conditions:**
- [ ] Willingness to go outside
- [ ] Live in or visit the Pacific Northwest (BC to California)

**The Exercise:**

**Step 1: Know what you're looking for**

```
Pacific Madrone identification features:

BARK (the giveaway):
  - Smooth, terracotta to red-brown on young wood
  - Peels in thin papery curling sheets
  - Reveals pale green to yellow-green new bark beneath
  - Old bark is gray-brown, rough, scaly at base of mature trees
  - The peeling bark pattern is UNIQUE among PNW trees
  - No conifer has this bark. No other broadleaf has this bark.
  - If the bark is peeling red-to-green, it's Madrone.

LEAVES:
  - Thick, leathery, evergreen (present year-round)
  - 7-12 cm long, oval, glossy dark green above
  - Pale gray-green beneath
  - Not shed in autumn (unlike all other PNW broadleaves)

BERRIES (autumn):
  - Bright red-orange, round, ~1 cm diameter
  - In drooping clusters
  - Mealy texture (edible but bland)
  - Birds love them (watch for tanagers, waxwings, robins)

HABITAT:
  - Forest edges, rocky bluffs, south-facing slopes
  - Often leaning toward light, multi-stemmed
  - Common on Puget Sound shoreline bluffs
```

**Step 2: Go find one**

If you're in the Puget Sound area, walk to any shoreline bluff, park with south-facing slopes, or rocky outcrop. Madrone is common from Mukilteo to the San Juans. Look for the red peeling bark -- it's visible from 50 meters.

**What Just Happened:**
You identified the most singular tree in the Pacific Northwest. The only native broadleaf evergreen. The tree that stands at the edge where the forest ends and the sky begins. Cooper's capsule was at the edge of its design envelope. Madrone is at the edge of the forest. Both thrive in the margin.

---

### TRY 3: Manual Attitude Control Simulation

**Duration:** 30 minutes
**Difficulty:** Beginner-Intermediate
**Department:** Aerospace Engineering
**What You Need:** Python 3.8+

**What You'll Learn:**
Why Cooper's manual attitude control during reentry was a remarkable piloting achievement.

```python
import random

# Simple manual attitude control simulation
# You are Cooper. Keep the capsule within 5 degrees of target.
# Each turn, the capsule drifts randomly. You choose a correction.

target_pitch = -34.0  # degrees (retrofire attitude)
current_pitch = -34.0
fuel = 100  # arbitrary units
turns = 20  # time steps until retrofire

print("MANUAL ATTITUDE CONTROL SIMULATOR")
print("Keep pitch within 5° of -34° for retrofire.")
print(f"Target: {target_pitch}°. Fuel: {fuel} units.\n")

for t in range(turns):
    # Random perturbation
    drift = random.gauss(0, 2.0)  # degrees per step
    current_pitch += drift

    error = current_pitch - target_pitch
    print(f"T-{turns-t:>2}: Pitch={current_pitch:>+6.1f}° Error={error:>+5.1f}° Fuel={fuel}")

    # Auto-correct (simulate Cooper's manual input)
    if abs(error) > 1.0 and fuel > 0:
        correction = -error * 0.5  # proportional control
        fuel_cost = abs(correction) * 0.5
        if fuel >= fuel_cost:
            current_pitch += correction
            fuel -= fuel_cost

final_error = abs(current_pitch - target_pitch)
print(f"\nRetrofire! Final error: {final_error:.1f}°")
print(f"Fuel remaining: {fuel:.0f} units")
if final_error < 5:
    print("SUCCESS: Within reentry corridor. Cooper would be proud.")
else:
    print("MISS: Outside corridor. Skip-out or excessive g-load.")
```

---

## DIY Projects

### DIY 1: Build a Consumable Countdown Timer with Arduino

**Duration:** 3-4 hours
**Difficulty:** Intermediate
**Department:** Human Factors / Engineering
**Cost:** ~$25

**Materials:**
- Arduino Nano or Uno ($8-25)
- SSD1306 OLED display 128x64 ($8)
- 5x LEDs (different colors) + resistors ($3)
- Potentiometer ($1) -- controls time acceleration
- Push button ($0.50) -- starts the mission

**What You Build:**
A real-time countdown display showing all five MA-9 consumable levels depleting over the 34-hour mission timeline (time-accelerated). Each LED represents one consumable, dimming as it depletes. The OLED shows numerical values, mission elapsed time, and current orbit number. When the first consumable hits critical (CO2 scrubber at ~hour 33), the corresponding LED flashes red.

### DIY 2: Madrone Bark Art -- Peeling Layers Reveal Hidden Messages

**Duration:** 2-3 hours
**Difficulty:** Beginner
**Department:** Ecology / Creative Arts
**Cost:** ~$10

**Materials:**
- Heavy cardstock or watercolor paper ($5)
- Acrylic paint: terracotta, green, cream ($5)
- Thin tissue paper (for bark texture)

**What You Build:**
A layered art piece mimicking Madrone bark exfoliation. Paint green "photosynthetic" bark on the base layer. Add cream middle layer. Add terracotta outer layer using tissue paper that can be peeled away. Write mission facts on the green layer -- they are revealed as the "bark" is peeled. The peeling reveals knowledge, the way Cooper's failed automation revealed the pilot beneath.

### DIY 3: Plant a Pacific Madrone Seedling

**Duration:** 1 hour (planting) + years (growing)
**Difficulty:** Beginner (planting), Intermediate (keeping it alive)
**Department:** Ecology
**Cost:** ~$10-15 for a seedling

**Materials:**
- One Arbutus menziesii seedling (native plant nurseries in the PNW)
- Well-drained site with full sun to partial shade
- Sandy or rocky soil (Madrone does NOT like wet feet)

**Important notes:**
- Madrone is notoriously difficult to transplant -- the root system is sensitive to disturbance
- Buy the smallest seedling available (1-gallon or smaller) for best survival
- Plant in autumn when rains begin
- Do NOT overwater -- Madrone is drought-adapted and rots in wet soil
- Be patient: growth is slow for the first 3-5 years, then accelerates

---

*"Cooper orbited 22 times in 34 hours, managed five consumables, slept for the first time in American spaceflight, and hand-flew the reentry when everything else failed. The Madrone stands at the edge, peeling its bark to reveal green wood beneath, resprouting from root crowns after fire, feeding the tanagers that migrate on faith. Ron Artis II sustains two-hour soul sets on a Motown root system, performing at the edge of physical capacity the way Cooper flew at the edge of Mercury's design envelope. Baum wrote about a girl who discovered she could go home all along. Cooper discovered he could fly the spacecraft home all along. The curriculum of Faith 7 is the curriculum of endurance: know your consumables, trust your training, and when the automation fails, fly it yourself."*
