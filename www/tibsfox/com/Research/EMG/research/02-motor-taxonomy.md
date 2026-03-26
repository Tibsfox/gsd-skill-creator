# Motor Taxonomy and Engineering

> **Domain:** Electrical Engineering
> **Module:** 2 -- Motor Taxonomy and Engineering
> **Through-line:** *Every motor type is a different answer to the same question: how do you create, shape, and switch a magnetic field to produce continuous mechanical rotation?* The taxonomy emerges from the physics.

---

## Table of Contents

1. [The Classification Framework](#1-the-classification-framework)
2. [DC Brushed Motors](#2-dc-brushed-motors)
3. [Brushless DC Motors (BLDC)](#3-brushless-dc-motors-bldc)
4. [AC Induction Motors](#4-ac-induction-motors)
5. [Permanent Magnet Synchronous Motors (PMSM)](#5-permanent-magnet-synchronous-motors-pmsm)
6. [Switched Reluctance Motors](#6-switched-reluctance-motors)
7. [Stepper Motors](#7-stepper-motors)
8. [Linear Motors](#8-linear-motors)
9. [Efficiency Comparison](#9-efficiency-comparison)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. The Classification Framework

Electric motors divide along two primary axes: the type of power supply (DC vs. AC) and the method of creating the magnetic field (permanent magnets, wound coils, or shaped iron). Every motor type makes specific trade-offs among efficiency, cost, controllability, ruggedness, and power density [1][2].

```
ELECTRIC MOTORS
├── DC
│   ├── Brushed (series, shunt, compound)
│   ├── Brushless (BLDC / electronically commutated)
│   └── Linear DC
├── AC
│   ├── Induction (squirrel-cage, wound-rotor)
│   ├── Synchronous
│   │   ├── Permanent Magnet (PMSM/IPMSM)
│   │   ├── Wound-Rotor (WRSM/EESM)
│   │   └── Synchronous Reluctance (SynRM)
│   ├── Switched Reluctance (SRM)
│   ├── Stepper
│   └── Linear AC
└── Special
    └── Homopolar
```

---

## 2. DC Brushed Motors

DC brushed motors use mechanical commutation via carbon brushes and a commutator to reverse current direction in the rotor windings as the rotor turns. The commutator is a segmented copper ring; the brushes are spring-loaded carbon contacts that slide against it [1][2].

### 2.1 Subtypes

| Subtype | Winding Configuration | Torque-Speed Characteristic | Application |
|---------|----------------------|---------------------------|-------------|
| Series | Field and armature in series | High starting torque, speed varies with load | Starter motors, power tools, traction |
| Shunt | Field and armature in parallel | Relatively constant speed under load | Fans, pumps, conveyors |
| Compound | Both series and shunt windings | Blend of both characteristics | Elevators, rolling mills |

### 2.2 Characteristics

- **Efficiency:** 75-85%
- **Service life:** 1,000-3,000 hours (brush wear is the limiting factor)
- **Control:** Simple voltage variation; direction reversal by swapping polarity
- **Limitations:** Brush wear, sparking (fire hazard in explosive atmospheres), electromagnetic interference, speed-dependent maintenance

### 2.3 Applications

Automotive windows, small appliances, toys, power tools, starter motors. DC brushed motors remain dominant where simplicity and low cost outweigh efficiency and longevity requirements [1][2].

---

## 3. Brushless DC Motors (BLDC)

BLDC motors replace mechanical commutation with electronic controllers and Hall-effect position sensors. The permanent magnets move to the rotor; the electromagnets sit on the stator. An electronic controller sequences current through the stator windings based on rotor position feedback [1][3].

### 3.1 Operating Principle

The controller energizes stator phases in sequence, creating a rotating magnetic field that the permanent magnet rotor follows. This is "electronic commutation" -- the switching that brushes and commutator perform mechanically in a DC brushed motor is instead performed by power transistors (MOSFETs or IGBTs) controlled by the position sensor feedback [3].

### 3.2 Characteristics

- **Efficiency:** 80-95%
- **Service life:** ~20,000 hours (approximately 7x longer than brushed motors)
- **Speed:** Up to 6x faster than equivalent brushed motors
- **Cost:** Higher due to electronic controller complexity
- **Advantages:** No sparking, no brush noise, precise speed/position control, regenerative braking capability

### 3.3 Applications

Industrial automation, robotics, CNC machines, EV traction, drones, HVAC fans, hard disk drive spindle motors, medical devices, aerospace actuators [1][3].

---

## 4. AC Induction Motors

The most common motor type worldwide. A rotating magnetic field in the stator induces current in the rotor through electromagnetic induction -- no physical electrical connection to the rotor exists [1][4].

### 4.1 The Rotating Field

When three-phase AC power is applied to three sets of stator windings spaced 120 degrees apart, the resulting magnetic field rotates at synchronous speed. The rotor always turns slightly slower than this field -- the difference is called "slip" and is inherent to torque production. Without slip, no current would be induced in the rotor, and no torque would be produced [4].

### 4.2 Squirrel-Cage vs. Wound-Rotor

| Feature | Squirrel-Cage | Wound-Rotor |
|---------|--------------|-------------|
| Rotor construction | Cast aluminum bars in iron core | Copper wire windings |
| Starting torque | Moderate | High (external resistance) |
| Speed control | VFD (external) | Resistance + VFD |
| Ruggedness | Excellent | Good |
| Cost | Low | Higher |
| Maintenance | Minimal | Brush/slip ring service |

### 4.3 Characteristics

- **Efficiency:** 75-90% (varies significantly with size and load)
- **Ruggedness:** No brushes, no commutator -- the simplest, most rugged motor construction
- **Power range:** Fractional HP to tens of thousands of HP
- **Speed:** Fixed by supply frequency unless VFD is used

### 4.4 Applications

Pumps, fans, compressors, conveyors, HVAC, elevators -- virtually all continuous-duty industrial applications. Induction motors consume more electricity than any other single technology: over 40% of global power use [4][5].

---

## 5. Permanent Magnet Synchronous Motors (PMSM)

PMSM motors rotate at exactly the synchronous speed set by the supply frequency. The rotor field is provided by permanent magnets (typically neodymium-iron-boron), eliminating rotor copper losses and achieving the highest efficiency and power density of any motor type [6][7].

### 5.1 Interior vs. Surface Mount

- **Interior Permanent Magnet (IPM/IPMSM):** Magnets embedded within the rotor iron. Uses both magnet torque and reluctance torque. Dominant in EV traction. Better field weakening capability for high-speed operation
- **Surface Permanent Magnet (SPM):** Magnets on rotor surface. Simpler construction, lower reluctance torque contribution. Common in servo applications

### 5.2 Characteristics

- **Efficiency:** 90-97% -- the highest of any motor type
- **Power density:** Highest available (compact, lightweight)
- **Control:** Requires inverter with field-oriented control (FOC)
- **Cost:** Highest, due to rare-earth magnets and complex control electronics
- **Limitation:** Rare-earth dependency (neodymium, dysprosium, terbium)

### 5.3 The Rare-Earth Problem

In 2022, 82% of the global electric car market used rare-earth PM motors. These require approximately 1.2 kg of NdFeB per 100 kW of peak motor power. The rare-earth supply chain is concentrated in a single country, creating a critical vulnerability in the global electrification transition [7][8].

---

## 6. Switched Reluctance Motors

SRMs have no magnets or windings on the rotor -- just shaped iron poles. Torque is produced by the rotor's tendency to align with energized stator poles (reluctance torque) [9].

### 6.1 Characteristics

- **Efficiency:** 80-90%
- **Ruggedness:** Extremely high -- no magnets to demagnetize, no rotor windings to fail
- **Temperature tolerance:** Excellent (no magnets to degrade)
- **Material cost:** Lowest of any motor type
- **Challenges:** Higher noise and vibration (torque ripple), requires precise rotor position sensing, complex controller algorithms
- **Applications:** DOE identifies SRM as a viable rare-earth-free EV traction alternative

---

## 7. Stepper Motors

Stepper motors divide a full rotation into discrete steps, enabling precise open-loop position control without feedback sensors. Each electrical pulse advances the rotor by one step (typically 1.8 degrees for a 200-step motor) [1].

### 7.1 Applications

3D printers, CNC machines, camera platforms, laboratory automation, textile machinery. Steppers excel where precise positioning at low-to-moderate speeds is required and the simplicity of open-loop control is advantageous [1].

---

## 8. Linear Motors

Linear motors "unroll" the rotary motor into a flat configuration. Instead of producing rotational torque, they produce linear force. The stator becomes a track; the mover (equivalent of the rotor) travels along it [1].

### 8.1 Applications

- **Maglev trains:** Linear synchronous motors for propulsion; electromagnetic or electrodynamic levitation
- **Semiconductor manufacturing:** Precision linear stages for wafer positioning
- **Roller coasters:** Linear induction motor launch systems
- **Conveyor systems:** Contactless material transport

---

## 9. Efficiency Comparison

| Motor Type | Efficiency | Control Complexity | Power Density | Material Cost | Key Advantage |
|-----------|-----------|-------------------|--------------|--------------|--------------|
| Brushed DC | 75-85% | Simple voltage | Low | Lowest | Easy control, low cost |
| BLDC | 80-95% | Electronic | High | Medium | Long life, precision |
| AC Induction | 75-90% | VFD or direct | Medium | Low | Rugged, low maintenance |
| PMSM | 90-97% | Inverter + FOC | Highest | Highest | Best efficiency, density |
| Switched Reluctance | 80-90% | Complex DSP | Medium | Low | No magnets, rugged |
| Stepper | 50-70% | Step/direction | Low | Low | Precise positioning |

Sources: Tyto Robotics; DOE Vehicle Technologies Office; IEEE Spectrum [2][9][10].

---

## 10. Cross-References

| Project | Connection |
|---------|------------|
| [THE](../THE/index.html) | Thermal management of high-power motors; cooling system design for EV traction motors |
| [SHE](../SHE/index.html) | Motor control circuits in residential applications; HVAC fan motors, garage door openers, smart home automation |
| [T55](../T55/index.html) | 555 timer-based PWM circuits for brushed DC motor speed control; the simplest motor controller |
| [LED](../LED/index.html) | Shared PWM and MOSFET driver techniques between LED dimming and motor speed control |
| [BCM](../BCM/index.html) | NEC motor circuit requirements; branch circuit sizing, motor disconnects, nameplate ratings |
| [BPS](../BPS/index.html) | Hall effect sensors for BLDC commutation; current sensing for motor protection |

---

## 11. Sources

1. [Electric Motor Types | Renesas Electronics](https://www.renesas.com/us/en/support/engineer-school/brushless-dc-motor-01-overview)
2. [Motor Efficiency Comparison | Tyto Robotics](https://www.tytorobotics.com/)
3. [BLDC Motor Technology | NIDEC / MPS AN047](https://www.monolithicpower.com/)
4. [AC Induction Motor | Parvalux / Oriental Motor](https://www.orientalmotor.com/)
5. [ABB/DOE -- Motor Energy Consumption Statistics](https://www.energy.gov/)
6. [PMSM Technology | Fiveable / Charged EVs](https://www.chargedevs.com/)
7. [EV Traction Motor Market | Assembly Magazine](https://www.assemblymag.com/)
8. [Rare-Earth Motor Dependency | electengmaterials.com](https://electengmaterials.com/)
9. [Switched Reluctance Motors | DOE Vehicle Technologies Office](https://www.energy.gov/eere/vehicles/)
10. [IEEE Spectrum -- Electric Motor Technology](https://spectrum.ieee.org/)
