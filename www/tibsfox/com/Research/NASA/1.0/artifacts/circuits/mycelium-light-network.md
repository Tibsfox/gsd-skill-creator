# DIY LED Circuit: Mycelial Network Light Display

## The Circuit

A network of LEDs connected by thin wire "rhizomorphs" on a dark backing board, with a 555 timer generating traveling pulse patterns that simulate nutrient flow through the Armillaria network. The pulses originate from a central point and travel outward through the branching LED network.

**Total cost: ~$18**

---

## Concept

Build a physical representation of the Armillaria network:
- 20-30 warm-white or golden LEDs are the "nodes" (colonized trees)
- Thin enameled copper wire connects them in a branching pattern (rhizomorphs)
- A 555 timer generates clock pulses
- A CD4017 decade counter sequences the pulses outward from center
- The result: a glowing network that pulses from center to edge, like nutrient flow

## Construction

```
1. Start with a dark board (12"x12" painted plywood or black foam core)

2. Plan the network: sketch a branching pattern with a central node
   and branches radiating outward. Use the space colonization algorithm
   from the generative art spec as a guide.

3. Drill small holes for LEDs at each node point (20-30 LEDs)

4. Insert LEDs from the back, bend leads flat

5. Wire LEDs in groups of 10 (matching CD4017 outputs):
   - Group 0: center LED (the seed, the oldest growth)
   - Group 1: 2-3 LEDs adjacent to center
   - Group 2: 3-4 LEDs one branch away
   - ...
   - Group 9: 3-4 LEDs at the outermost edges

6. Each group's anodes connect to one CD4017 output through 470Ω resistor

7. All cathodes connect to ground

8. 555 timer in astable mode: ~2 Hz (one pulse traveling outward every 5 seconds)
```

## Parts List

| Part | Value | Qty | Cost |
|------|-------|-----|------|
| Warm-white LEDs (3mm) | - | 25 | $2.50 |
| 555 Timer IC | - | 1 | $0.25 |
| CD4017 Decade Counter | - | 1 | $0.60 |
| Enameled copper wire (30 AWG) | 10m | 1 | $3.00 |
| Resistors 470Ω | 1/4W | 10 | $0.50 |
| Resistors 10KΩ, 100KΩ | 1/4W | 2 | $0.10 |
| Capacitor 10µF | 16V | 1 | $0.10 |
| Black foam core board 12"x12" | - | 1 | $3.00 |
| 9V battery + snap | - | 1 | $3.20 |
| Wire, solder, hot glue | - | - | $3.00 |
| **Total** | | | **~$18** |

## What You Learn

- **Network topology** — you physically build a branching network and see how pulses propagate through it. The same topology appears in computer networks, neural networks, river systems, and mycelial mats.
- **Sequential logic** — the CD4017 steps through 10 outputs in sequence, creating the traveling pulse effect. This is the simplest form of sequential digital logic.
- **The hidden network made visible** — when you hang this on a wall and watch the pulses travel, you're seeing what Armillaria does underground. The light IS the nutrient. The wire IS the rhizomorph. The LED IS the colonized tree.

## Fox Companies Connection

Decorative electronics / art installation. Sell as kits ($30) or assembled wall art ($80-120). Custom sizes and patterns. The mycelial network becomes a lamp. Each subsequent NASA mission adds a new pattern: fireweed (1.1), radiation belt (1.3), satellite orbit (1.4). A collection on the wall tells the story of space exploration through light.
