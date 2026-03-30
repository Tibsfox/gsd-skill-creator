# DIY Analog Circuit: Radiation Counter Simulator

## The Circuit

A purely analog audio circuit that simulates a Geiger counter detecting radiation at different altitudes along Pioneer 1's trajectory. The click rate is controlled by a potentiometer representing altitude -- rotate the knob from Earth's surface to 113,854 km and hear the radiation environment change in real time.

**What it does:**
- Turn the altitude potentiometer slowly from left (0 km) to right (113,854 km)
- Low altitude: slow, occasional clicks (background radiation)
- Inner belt (~3,000 km): rapid, intense clicking
- Slot region (~8,000 km): clicks slow down noticeably
- Outer belt (~18,000 km): rapid clicking resumes (different tone)
- Deep space: occasional faint clicks
- Audio output through speaker or headphones

**Total cost: ~$18-22**

---

## Block Diagram

```
[Noise Source] --> [Comparator] --> [Pulse Shaper] --> [Tone Generator] --> [LM386 Amp] --> [Speaker]
      |                                                                          |
      |                                                                    [Headphone Jack]
      |
[Altitude Pot] --> [Threshold Shaper] --> controls comparator threshold
                         |
                   [Profile Network] --> encodes Van Allen belt radiation curve
```

## Operating Principle

A Geiger counter clicks when a radiation particle ionizes gas inside the tube, creating a brief electrical pulse. The rate of clicks is proportional to the radiation intensity. This circuit simulates that behavior by:

1. Generating white noise (random voltage fluctuations)
2. Comparing the noise against a threshold voltage
3. Each time the noise exceeds the threshold, generating a sharp click
4. The threshold is controlled by a potentiometer through a resistor network that shapes the threshold to match Pioneer 1's radiation profile

Lower threshold = more clicks (high radiation). Higher threshold = fewer clicks (low radiation).

## Noise Source (Reverse-Biased Transistor Junction)

```
+9V
 |
 R1 (100K)
 |
 +---[base]---+
 |     2N3904  |
 | [collector]-+---> Noise Out (AC coupled via 0.1uF to C1)
 |             |
 +--[emitter]--+
 |
GND

The base-emitter junction in reverse breakdown produces
broadband avalanche noise. Cheaper than a zener diode
and produces excellent white noise in the audio range.
Amplitude: ~50-200mV RMS (varies by transistor -- select
for adequate noise level or add a second transistor as
amplifier stage).
```

## Radiation Profile Shaping Network

The altitude potentiometer (10K linear) drives a resistor-diode network that maps the pot position to a threshold voltage matching the Van Allen belt profile:

```
+9V
 |
 [10K Linear Pot] --- wiper is "altitude"
 |
GND

Wiper --> Profile shaping network:

                     D1        R3 (22K)
Wiper ---+---[>|]---+---[===]---+---> Threshold Out
         |          |            |
         |    D2    R4 (10K)     |
         +---[>|]---+---[===]---+
         |          |            |
         |    D3    R5 (47K)     |
         +---[>|]---+---[===]---+
         |                       |
         R2 (100K)               C2 (1uF)
         |                       |
        GND                     GND

The diodes (1N4148) create voltage breakpoints:
- D1 conducts at ~0.6V (inner belt onset, ~pot 10%)
- D2 conducts at ~1.2V (outer belt onset, ~pot 40%)
- D3 conducts at ~1.8V (deep space transition, ~pot 70%)

The resistors (R3, R4, R5) set the depth of each dip
in the threshold curve. R3 creates the inner belt's
sharp threshold drop (more clicks). R5 creates the
gentler outer belt threshold drop.

Between D1 and D2 (pot ~25-35%), the threshold rises
back up -- this is the slot region where radiation drops.

C2 smooths the threshold to prevent abrupt transitions.
```

## Comparator and Pulse Generator

```
            +9V
             |
        +----+----+
        |  LM393  |  (or one half of LM358 as comparator)
        | (comp)  |
Noise ->|+ IN     |
        |      OUT|---> Click Pulse
Thresh->|- IN     |
        +----+----+
             |
            GND

When noise voltage exceeds threshold: output goes HIGH
Each HIGH pulse = one "click" = one simulated particle detection

The noise is random, so the click timing is naturally random
(Poisson-distributed, same as real radiation detection).
```

## Click Sound Shaper

The comparator's raw output is a variable-width digital pulse. To sound like a Geiger counter, we need a sharp, short click:

```
Comparator OUT --[0.001uF]--+--[10K]--+---> to audio mixer
                             |         |
                            GND      +9V
                              (differentiated pulse)

The small capacitor differentiates the square wave into
sharp spikes. The 10K resistor provides DC bias.

Each click sounds like: "tick" -- a 1-2ms impulse.
At low rates: tick..........tick.......tick
At high rates: tickticktickticktickticktick
At saturation: continuous buzz (like real Geiger in high flux)
```

## Altitude-Dependent Tone Variation

The inner belt and outer belt have different radiation character (protons vs electrons). Optionally add a pitch shift:

```
Click Pulse --+--> [RC filter, f=2kHz] --> Inner belt click tone
              |
              +--> [RC filter, f=800Hz] --> Outer belt click tone

Altitude pot wiper also controls a DPDT relay or analog switch
(CD4066) that selects between the two filters based on altitude.

Inner belt range (pot 10-30%): higher-pitched clicks
Outer belt range (pot 40-65%): lower-pitched clicks
Background/deep space: unfiltered clicks (full spectrum)
```

## Output Amplifier (LM386)

```
Mixed Audio --[10uF]--> pin 3 (non-inverting input)
                        |
                     [LM386]
                        |
              pin 5 --> [220uF] --> 8 ohm Speaker
                        |
                       GND

Volume pot (10K log) between click output and LM386 input.

Optional: 3.5mm headphone jack wired in parallel with speaker.
Insert headphone plug disconnects speaker (switched jack).

Gain: 20 (default, pins 1+8 open)
For louder output: 10uF cap between pins 1 and 8 for gain of 200
```

## Parts List

| Part | Value | Qty | Cost |
|------|-------|-----|------|
| LM386 audio amplifier IC | - | 1 | $1.00 |
| LM393 comparator (or LM358 op-amp) | - | 1 | $0.50 |
| 2N3904 NPN transistor | - | 1 | $0.10 |
| 1N4148 signal diode | - | 3 | $0.15 |
| Potentiometer 10K linear (altitude) | - | 1 | $0.80 |
| Potentiometer 10K log (volume) | - | 1 | $0.80 |
| Resistor 10K | 1/4W | 2 | $0.10 |
| Resistor 22K | 1/4W | 1 | $0.05 |
| Resistor 47K | 1/4W | 1 | $0.05 |
| Resistor 100K | 1/4W | 2 | $0.10 |
| Capacitor 0.001uF ceramic | - | 1 | $0.05 |
| Capacitor 0.01uF ceramic | - | 1 | $0.05 |
| Capacitor 0.1uF ceramic | - | 1 | $0.05 |
| Capacitor 1uF electrolytic | 16V | 1 | $0.05 |
| Capacitor 10uF electrolytic | 16V | 2 | $0.10 |
| Capacitor 220uF electrolytic | 16V | 1 | $0.15 |
| 8 ohm small speaker | 2-3 inch | 1 | $2.00 |
| 3.5mm switched headphone jack | - | 1 | $0.50 |
| Knob for altitude pot | - | 1 | $0.40 |
| Knob for volume pot | - | 1 | $0.40 |
| 9V battery snap | - | 1 | $0.20 |
| 9V battery | - | 1 | $3.00 |
| Breadboard (full-size) | - | 1 | $5.00 |
| Jumper wires | - | 1 set | $2.50 |
| **Total** | | | **~$18** |

## Build Instructions

1. **Build the noise source.** Wire the reverse-biased transistor junction. Connect it to the speaker through the LM386 amp. You should hear white noise -- a steady hiss. This is the raw randomness that drives the clicks.

2. **Build the comparator click generator.** Connect the noise to the LM393 positive input. Connect a voltage divider (two 10K resistors) to the negative input as a fixed threshold. Listen for clicks. Adjust the voltage divider to change the click rate -- this verifies the basic mechanism works.

3. **Add the altitude potentiometer.** Replace the fixed voltage divider with the 10K pot. Sweep the pot slowly. At one extreme: rapid clicking. At the other: occasional clicks. You now have rate control.

4. **Add the profile shaping network.** Wire the diode-resistor network between the pot wiper and the comparator threshold input. Now when you sweep the pot from left to right, the click rate should:
   - Start slow (surface)
   - Speed up (inner belt)
   - Slow down (slot)
   - Speed up again (outer belt)
   - Slow down and stay slow (deep space)

5. **Calibrate.** The exact pot positions where the transitions occur depend on your specific components. Mark the pot knob positions with altitude labels: 0 km, 3,000 km (inner peak), 8,000 km (slot), 18,000 km (outer peak), 50,000 km, 113,854 km (apogee).

6. **Label the enclosure.** If you box this up, print an altitude scale next to the pot knob. The knob position IS the spacecraft's altitude. Rotating it slowly over 90 seconds (Pioneer 1's profile compressed) gives you the auditory experience of flying through the Van Allen belts.

## What You Learn

- **Noise as signal source** -- the same avalanche noise physics that makes transistors imperfect is what makes Geiger counters work. Random quantum events, detected and counted.
- **Comparator-based pulse generation** -- how analog randomness becomes digital events. This is the foundation of every analog-to-digital converter.
- **Threshold shaping with diode networks** -- how to encode a complex function (radiation profile vs altitude) into passive components. No lookup table, no microcontroller, just resistors and diodes shaped by physics.
- **The sound of the belts** -- after ten minutes of slowly sweeping the altitude knob, you will know the Van Allen belt structure by ear. The sudden acceleration of clicks entering the inner belt. The eerie quiet of the slot. The different texture of the outer belt. The vast silence of cislunar space. You will hear what Pioneer 1 measured.
- **Poisson statistics** -- the random timing of clicks is a physical Poisson process, the same statistics used to model radioactive decay, photon detection, and network packet arrival. You hear probability theory.

## Fox Companies Connection

Third audio circuit in the NASA kit series. Pairs with Pioneer 0's launch sound generator (v1.1). Together they form an audio education package: the launch sound teaches VCF/VCO/VCA (the building blocks of synthesizers), the radiation counter teaches noise sources, comparators, and threshold shaping (the building blocks of sensor interfaces). Combined workshop: "From Launch to Detection" -- build the sound of the rocket, then build the sound of what the rocket measured. Each subsequent NASA mission adds a new audio circuit design. By mission 20, participants can build a complete analog lab bench from the accumulated circuits.
