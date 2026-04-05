# Mission 1.23 -- Mercury-Atlas 7 / Aurora 7: College of Knowledge Curriculum

## Track 4: Department Mappings, TRY Sessions, DIY Projects, Fox Companies Pathways

**Mission:** Mercury-Atlas 7 / Aurora 7 (May 24, 1962) — SEQUENCE BREAKER
**Primary Departments:** Aerospace Engineering, Ethnobotany, Control Theory
**Secondary Departments:** Ornithology, Indigenous Studies, Communications, Mathematics
**Organism:** Oplopanax horridus (Devil's Club)
**Bird (SPS):** Colaptes auratus cafer (Red-shafted Flicker — Drumming)
**Dedication:** Booker T. Washington (April 5, 1856)

---

## Department Deposits

### Aerospace Engineering (Primary)

**Wing:** Human Spaceflight Operations — The Fuel Management Problem
**Concept:** Resource-constrained mission execution — how competing demands on a finite budget (fuel, time, bandwidth) force trade-offs between mission objectives

**Deposit:** Mercury-Atlas 7 is the definitive case study in resource-constrained decision-making under operational pressure. Carpenter's fuel consumption during scientific observations left insufficient margin for the retrofire sequence. The 75% manual fuel depletion by end of orbit two forced every subsequent decision into a degraded-margin context. The engineering lesson: a system designed with 55% reserve for the critical phase cannot function when 30% of that reserve has been consumed by non-critical activities. The operations lesson: the definition of "critical" and "non-critical" depends on who is defining it. Kraft defined criticality by mission safety. Carpenter defined it by mission purpose. Both definitions are valid. The fuel did not care which definition was correct.

### Ethnobotany (Primary)

**Wing:** Pacific Northwest Indigenous Plant Medicine
**Concept:** Oplopanax horridus as the paradigmatic example of a plant whose medicinal value is proportional to its defensive armament — the relationship between access cost and knowledge value

**Deposit:** Devil's Club is among the most extensively documented plants in Pacific Northwest ethnobotany. The ethnobotanical record spans at least 38 Indigenous nations, with documented uses including anti-diabetic, antimicrobial, anti-inflammatory, respiratory, and spiritual/ceremonial applications. The plant's spiny defense system creates a natural access barrier that ensures only knowledgeable harvesters interact with it — casual contact is punished, careful contact is rewarded. This is a natural information security system: the thorns are the authentication layer, and the medicine is the protected resource. Traditional ecological knowledge (TEK) about devil's club harvesting — when to harvest, which part, how to prepare, what spiritual protocols to observe — represents centuries of accumulated empirical pharmacology transmitted through oral tradition. This knowledge is increasingly validated by modern phytochemical analysis.

### Control Theory (Primary)

**Wing:** Dynamical Systems and Error Propagation
**Concept:** How small perturbations in a controlled system propagate into large deviations when the system operates near a sensitivity boundary

**Deposit:** Aurora 7's retrofire sequence is a control theory case study. The spacecraft was a controlled system with: state variables (position, velocity, attitude), control inputs (thruster firings), disturbances (horizon scanner malfunction, fuel depletion), and a target state (planned splashdown coordinates). The 25-degree yaw error during retrofire was a perturbation to the control input. The reentry dynamics amplified this perturbation because the system was operating near a sensitivity boundary — shallow entry angles, where range scales inversely with sin(γ). In control theory terms, the system's gain (∂output/∂input) was very high at the operating point, making it sensitive to small input errors.

---

## TRY Sessions

### TRY 1: The Overshoot Calculator

**Duration:** 30 minutes
**Difficulty:** Beginner
**Department:** Mathematics / Aerospace Engineering

```python
import numpy as np

def overshoot(yaw_deg, delay_sec, dv_planned=152.0, v_orbital=7840.0,
              sens_dv=25.0, sens_timing_km_s=7.84):
    """Calculate splashdown overshoot from retrofire errors."""
    yaw_rad = np.radians(yaw_deg)
    dv_retro = dv_planned * np.cos(yaw_rad)
    dv_deficit = dv_planned - dv_retro
    dx_dv = sens_dv * dv_deficit
    dx_timing = sens_timing_km_s * delay_sec
    return dx_dv + dx_timing

# Carpenter's actual errors
yaw = 25.0   # degrees
delay = 3.0  # seconds
result = overshoot(yaw, delay)
print(f"Aurora 7 overshoot: {result:.0f} km (actual: 402 km)")

# What if he had perfect attitude but was still 3s late?
print(f"Perfect attitude, 3s late: {overshoot(0, 3):.0f} km")

# What if timing was perfect but yaw was 25°?
print(f"Perfect timing, 25° yaw: {overshoot(25, 0):.0f} km")
```

### TRY 2: Identify Devil's Club on a PNW Trail

**Duration:** 1-2 hours (hiking)
**Difficulty:** Beginner (identification), Expert (not touching it)
**Department:** Ethnobotany / Ecology
**Cost:** $0

**What to look for:**
- Wet ravines, stream margins, avalanche chutes below 1,500 m
- Stems 1-3 m tall, covered in yellowish spines
- Massive maple-shaped leaves (20-35 cm across)
- Bright red berry clusters (late summer)
- DO NOT TOUCH — observe and photograph from a safe distance
- The spines break off in skin and cause persistent inflammation

**PNW trail suggestions:**
- Hoh River Trail (Olympic NP) — abundant devil's club in the first 5 km
- Twin Falls Trail (North Bend, WA) — look in wet ravines
- Boulder River Trail (Darrington, WA) — thick streamside stands

### TRY 3: Build a Fuel Budget Spreadsheet

**Duration:** 30 minutes
**Difficulty:** Beginner
**Department:** Aerospace Engineering / Mathematics

Create a spreadsheet that models Aurora 7's fuel budget. Start with 100% fuel. Each "activity" costs a percentage. Track remaining fuel after each activity. Add Carpenter's science observations as additional line items. Watch the reserve shrink. Feel the tension.

---

## DIY Projects

### DIY 1: Arduino Fuel Gauge with Overshoot Warning ($20)

**Materials:** Arduino Nano ($8), potentiometer ($1), 8-LED bar graph ($3), piezo buzzer ($1), OLED display ($8)

Build a physical fuel gauge that simulates Aurora 7's fuel depletion. Turn the potentiometer to "spend" fuel on different activities. The LED bar drops. When fuel reaches 25% (retrofire minimum), the buzzer warns. When it reaches 15%, the display shows "MARGIN CRITICAL." At 5%, it shows "OVERSHOOT PROBABLE." The student physically depletes the resource and feels the consequence.

### DIY 2: Devil's Club Spine Study with Magnifying Glass ($5)

**Materials:** Magnifying glass (10x), tweezers, fallen devil's club stem section (DO NOT harvest from living plant without knowledge and permission)

Examine devil's club spines under magnification. Document: spine length, base diameter, tip morphology (barbed vs. smooth), density per cm², and distribution pattern. Compare to cactus spines and rose thorns. The student discovers that devil's club spines are specifically designed to break off in tissue — they are brittle at the base and barbed at the tip. This is not random; it is evolved anti-herbivore engineering.

### DIY 3: Drumming Resonance Experiment ($0)

**Materials:** Your hand, various surfaces (wood table, metal pot lid, hollow log, cardboard box)

Tap each surface with consistent force. Rank them by volume. The flicker drums on the loudest surface. Measure: which material produces the longest-duration sound? Which has the highest peak amplitude? The student discovers that the flicker's preference for metal chimney caps and hollow snags is acoustic optimization — the bird selects the resonator that amplifies its signal most effectively.

---

## Fox Companies Pathways

**From this mission to community enterprise:**

- **Ethnobotanical education:** Teaching devil's club identification, traditional uses (with appropriate cultural sensitivity and collaboration with Indigenous knowledge holders), and modern pharmacological validation → ethnobotany consulting, educational workshops
- **Control systems thinking:** Teaching error propagation and sensitivity analysis → quality assurance consulting, process optimization for local businesses
- **Resource management:** Teaching fuel budget modeling applied to business budgets, project timelines, inventory management → small business financial planning services
- **Acoustic engineering:** Teaching the flicker's resonance selection principle → acoustic consulting for local businesses (noise control, sound system optimization, building acoustics)

---

*"The fuel was 100% at launch. By orbit two, it was 25% and falling. The question was never whether the science was worth doing. The question was whether the science was worth doing NOW, with THIS fuel, on THIS flight. The answer depends on whether you are the scientist in the capsule or the engineer at the console. Both are right. The fuel does not arbitrate. It only depletes."*
