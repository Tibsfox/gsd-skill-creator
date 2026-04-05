# Mission 1.31 -- Mariner 1: College of Knowledge Curriculum

## Track 4: Department Mappings, TRY Sessions, DIY Projects

**Mission:** Mariner 1 (July 22, 1962) -- Venus Flyby Attempt, Destroyed T+293s
**Primary Departments:** Software Engineering, Aerospace Safety, Orbital Mechanics
**Secondary Departments:** Ornithology, Music Theory, Computing History
**Organism:** Hirundo rustica (Barn Swallow)
**Bird:** Barn Swallow (degree 30, Ray Charles)
**Dedication:** Grace Hopper (December 9, 1906 -- January 1, 1992)

---

## Department Deposits

### Software Engineering (Primary)

**Wing:** Software Verification and Formal Methods
**Concept:** The gap between specification and implementation -- how hand-transcription of mathematical notation into code can introduce fatal errors

**Deposit:** Mariner 1 was destroyed by a software error: a missing overbar (vinculum) in hand-transcribed guidance equations. The specification said "smooth this value." The code did not smooth. The result was feedback instability, erratic steering, and range safety destruct at T+293 seconds. This is the foundational case study in software verification -- the event that demonstrated software errors could be as catastrophic as hardware failures.

### Aerospace Safety (Primary)

**Wing:** Range Safety and Flight Termination
**Concept:** The decision framework for destroying a vehicle that threatens populated areas -- expected cost analysis under uncertainty with a human-reaction-time deadline

**Deposit:** Range Safety Officer Jack Broadbent sent the destruct command at T+293 seconds. The vehicle was heading toward shipping lanes and potentially populated areas. The decision was correct: the expected cost of allowing the vehicle to continue (population risk) exceeded the certain cost of destruction ($18.5M). This is decision theory under extreme time pressure.

### Orbital Mechanics (Primary)

**Wing:** Interplanetary Transfer Orbits
**Concept:** The Hohmann transfer from Earth to Venus, launch windows, and the cost of missing a window

**Deposit:** Mariner 1 was targeted for a Venus Hohmann transfer: departure velocity ~32.3 km/s heliocentric, trip time ~146 days, arrival at Venus orbit 0.723 AU. The 1962 Venus window opened in late July and closed in early September. Mariner 1 launched at the window opening. Mariner 2 launched 36 days later, near the window's end. The next window was 19 months away.

### Ornithology (Secondary)

**Wing:** Aerial Insectivory and Flight Mechanics
**Concept:** Barn Swallow forked-tail aerodynamics as a biological guidance system

### Music Theory (Secondary)

**Wing:** Genre Fusion and Category Dissolution
**Concept:** Ray Charles's fusion of gospel and blues as a structural innovation -- combining "incompatible" systems into a new whole

### Computing History (Secondary)

**Wing:** Grace Hopper and the Compiler Revolution
**Concept:** The development of compilers as tools for eliminating hand-transcription errors between human notation and machine code

---

## TRY Sessions

### TRY 1: Write Code with a Deliberate Bug, Then Find It

**Duration:** 30 minutes
**Difficulty:** Beginner
**Department:** Software Engineering

**The Exercise:** Write a simple Python program that smooths data, then deliberately remove the smoothing (simulating the missing overbar). Run both versions and observe the output difference.

```python
import numpy as np

# "Radar data" with noise
np.random.seed(42)
true_signal = np.linspace(0, 10, 100)
noisy_data = true_signal + np.random.normal(0, 2, 100)

# WITH smoothing (correct code)
def smooth(data, window=5):
    return np.convolve(data, np.ones(window)/window, mode='same')

smoothed = smooth(noisy_data)

# WITHOUT smoothing (the "bug" -- missing overbar)
unsmoothed = noisy_data  # raw data used directly

# Guidance corrections (proportional control)
K = 0.5
corrections_good = K * (smoothed - true_signal)
corrections_bad = K * (unsmoothed - true_signal)

print(f"With smoothing:    max correction = {np.max(np.abs(corrections_good)):.2f}")
print(f"Without smoothing: max correction = {np.max(np.abs(corrections_bad)):.2f}")
print(f"Ratio: {np.max(np.abs(corrections_bad))/np.max(np.abs(corrections_good)):.1f}x worse")
print(f"\nThe overbar reduces the worst-case correction by a factor of {np.max(np.abs(corrections_bad))/np.max(np.abs(corrections_good)):.0f}.")
print("Mariner 1 had no smoothing. The corrections went wild.")
```

**What Just Happened:** You experienced the exact failure mode that destroyed Mariner 1. The smoothing function reduces worst-case corrections by a factor of 3-5x. Without it, the guidance system overcorrects wildly.

### TRY 2: Observe Barn Swallows Building (Spring/Summer Only)

**Duration:** 30-60 minutes
**Difficulty:** Beginner
**Department:** Ornithology
**What You Need:** A barn, bridge, or covered structure where Barn Swallows nest. Binoculars optional.

Find a Barn Swallow nest site (ask at local farms, check under bridges). Watch the construction process: birds arriving with mud pellets in their beaks, pressing them against the wall, returning to the mud source. Count the trips per hour. Estimate total pellets (typical: 800-1,200). Look for failed nests — fallen clumps of mud below active sites.

### TRY 3: Calculate the Venus Launch Window

**Duration:** 30 minutes
**Difficulty:** Intermediate
**Department:** Orbital Mechanics

```python
import numpy as np

# Synodic period of Venus (time between identical Earth-Venus alignments)
T_earth = 365.25  # days
T_venus = 224.7   # days
T_synodic = 1 / (1/T_venus - 1/T_earth)
print(f"Venus synodic period: {T_synodic:.0f} days ({T_synodic/30.44:.0f} months)")
print(f"Launch windows to Venus occur every {T_synodic:.0f} days (~{T_synodic/365.25:.1f} years)")
print(f"\nMariner 1 launched July 22, 1962.")
print(f"Next window: ~{T_synodic:.0f} days later = early February 1964")
print(f"Mariner 2 had to launch by early September 1962 or wait 19 months.")
print(f"It launched August 27, 1962 -- 36 days after Mariner 1's destruction.")
```

---

## DIY Projects

### DIY 1: Arduino Bug Detector ($20)

Build a circuit that demonstrates how a missing filter affects a control system. Use a potentiometer as "radar input," an Arduino as the "guidance computer," and an LED bar as the "trajectory display." Toggle a switch to enable/disable software smoothing and watch the LED bar oscillate wildly when smoothing is off.

### DIY 2: Mud Nest Construction Test ($5)

Collect mud from a stream bank. Mix with dried grass clippings at different ratios (0%, 10%, 30%, 50% grass by volume). Form pellets. Attach to a piece of rough lumber. Wait 24 hours. Test adhesion strength by hanging weights. Find the optimal mud-to-grass ratio. Compare to Barn Swallow nests (approximately 15-20% fiber content).

### DIY 3: Paper Venus Transfer Orbit ($0)

On a large sheet of paper, draw Earth's orbit (circle, radius 10 cm) and Venus's orbit (circle, radius 7.2 cm, same center). Draw the Hohmann transfer ellipse (tangent to both circles). Mark the launch point, the arrival point, and calculate where Venus must be at launch for the spacecraft to arrive when Venus is at the arrival point. This is the launch window geometry.

---

*"Mariner 1 lasted 293 seconds. Mariner 2 lasted 129 days and reached Venus. The difference was one symbol in the code and 36 days on the calendar. Grace Hopper built compilers to eliminate exactly this kind of transcription error. The Barn Swallow rebuilds its nest when it falls. Both responses are the same: the failure is information, and the next attempt is better."*
