# Mission 1.34 -- Ranger 7: College of Knowledge Curriculum

## Track 4: Department Mappings, TRY Sessions, DIY Projects

**Mission:** Ranger 7 (July 28-31, 1964) -- First US Close-Up Photos of Moon, 4,308 Images
**Primary Departments:** Planetary Science, Imaging Science, Engineering
**Secondary Departments:** Ornithology, Mathematics, History
**Organism:** Haemorhous cassinii (Cassin's Finch)
**Bird:** Cassin's Finch (degree 33, Larry English)
**Dedication:** John Cassin (September 6, 1813 -- January 10, 1869)

---

## Department Deposits

### Planetary Science (Primary)

**Wing:** Lunar Surface Geology
**Concept:** The first close-up photographs of the lunar surface and what they revealed about crater formation, mare geology, and surface roughness at scales below telescopic resolution

**Deposit:** Ranger 7 delivered the first US close-up photographs of the lunar surface, resolving features from 2 km down to 0.5 m. The 4,308 images revealed that Mare Cognitum's surface was cratered at every scale -- confirming Shoemaker's prediction and refuting Gold's deep-dust hypothesis. The crater size-frequency distribution followed a power law: N(>D) ~ D^(-2), extending across four orders of magnitude in crater diameter. The surface was rough but solid -- a finding critical for Apollo landing site selection. Mare Cognitum proved to be 3.5-3.8 billion year old basalt, cratered by billions of years of meteorite bombardment.

### Imaging Science (Primary)

**Wing:** Television Reconnaissance from Space
**Concept:** The design, operation, and optimization of vidicon camera systems for planetary imaging from rapidly moving platforms

**Deposit:** Ranger 7's six-camera system (two F-channel wide-angle, four P-channel telephoto) was the first successful planetary imaging system. Key engineering decisions: dual redundant camera chains (response to Ranger 6's total camera failure), mixed resolution approach (wide context + narrow detail), continuous transmission during descent (no storage, direct-to-Earth video). The vidicon tubes required precise calibration: electron beam scanning converts optical images to electrical signals, with resolution determined by the number of scan lines (1150 for F-channel, 300 for P-channel) and the focal length (25mm wide, 76mm telephoto). Ground resolution scaled linearly with altitude: GSD = h * d_pixel / f.

### Engineering (Primary)

**Wing:** Reliability Through Iteration
**Concept:** How the Ranger program's six consecutive failures led to systematic quality assurance reforms that produced success on the seventh attempt

**Deposit:** The Ranger program's failure sequence (Rangers 1-6) exposed six independent failure modes: Agena restart failure (twice), guidance error, computer failure, power system failure, camera electrical damage. Each failure triggered specific corrections. The critical reforms before Ranger 7: dedicated project office, expanded testing protocols, electromagnetic compatibility testing for the camera system (addressing the Ranger 6 arc-over), and redundant camera chains. The transformation of JPL's quality assurance process, driven by Congressional pressure and internal review, became the template for subsequent JPL missions.

---

## TRY Sessions

### TRY 1: Calculate Image Resolution at Different Altitudes

**Duration:** 30 minutes
**Difficulty:** Beginner
**Department:** Imaging Science / Mathematics

```python
# ranger7_resolution.py
# Calculate ground resolution for Ranger 7's cameras at different altitudes

def ground_resolution(altitude_m, focal_length_m, pixel_size_m):
    """Calculate ground sample distance (GSD) in meters."""
    return altitude_m * pixel_size_m / focal_length_m

# Ranger 7 P-channel telephoto camera
f_tele = 0.076  # 76mm focal length
vidicon_size = 0.011  # 11mm vidicon
n_lines = 300  # scan lines
pixel_size = vidicon_size / n_lines

print("RANGER 7 TELEPHOTO CAMERA RESOLUTION")
print("=" * 50)
altitudes = [2110, 1000, 500, 100, 50, 10, 1, 0.48]
for h_km in altitudes:
    gsd = ground_resolution(h_km * 1000, f_tele, pixel_size)
    print(f"  {h_km:>8} km altitude → {gsd:>8.1f} m resolution")
print(f"\nThe last frame resolved {ground_resolution(480, f_tele, pixel_size):.1f}m features.")
print("That is roughly the size of a car.")
```

### TRY 2: Count Craters in a Ranger 7 Image

**Duration:** 45 minutes
**Difficulty:** Beginner
**Department:** Planetary Science

Download a Ranger 7 image from the Planetary Data System (https://pds-imaging.jpl.nasa.gov/volumes/ranger.html). Print it or display it on screen. Count all visible craters larger than 5mm on the printout. Measure their diameters. Plot the cumulative count N(>D) vs D on log-log axes. Verify that the points fall along a straight line with slope ≈ -2.

### TRY 3: Identify Cassin's Finch by Song

**Duration:** 30 minutes
**Difficulty:** Beginner
**Department:** Ornithology

Listen to recordings of all three Haemorhous finches on eBird or Xeno-canto. Cassin's Finch: longest, most complex warble with mimicry. Purple Finch: fast, rolling warble. House Finch: buzzy, repetitive. Play them side by side. The differences become clear — like Ranger 7's images resolving the Moon, your ear resolves three species from what initially sounds like one.

---

## DIY Projects

### DIY 1: Arduino Crater Counter with Photoresistor Array

**Duration:** 4-6 hours
**Difficulty:** Intermediate
**Cost:** ~$30

Build a simple optical system that scans across a printed lunar image and detects brightness changes (crater rims appear as bright/dark transitions). An LED illuminates the image, a photoresistor reads reflected light, and a servo motor scans the sensor across the image. The Arduino counts brightness transitions above a threshold — each transition pair (bright→dark→bright) represents a crater rim crossing.

### DIY 2: Pinhole Camera Demonstrating Resolution vs. Distance

**Duration:** 2-3 hours
**Difficulty:** Beginner
**Cost:** ~$5

Build a pinhole camera from a shoebox. Photograph the same object from 1m, 2m, 5m, and 10m. Measure how resolution degrades with distance. This is Ranger 7's imaging equation in reverse: Ranger's resolution improved as it got closer. Your pinhole camera's resolution degrades as you move away. Same physics, opposite direction.

### DIY 3: Plant a Ponderosa Pine Seedling (Cassin's Finch Habitat)

**Duration:** 1 hour + decades
**Difficulty:** Beginner
**Cost:** ~$5

Plant a ponderosa pine seedling — the primary habitat tree for Cassin's Finch. In 50-100 years, it will be tall enough for a Cassin's Finch to sing from its crown. This is the longest DIY project: building habitat for a bird you may never see use it.

---

*"Ranger 7 saw the Moon in seventeen minutes. The cameras activated at 2,110 km and stopped at impact. In that window, resolution improved by a factor of 4,000 — from blurry telescope views to sharp geological photographs. Larry English played R&B in the Central District with the same resolution principle: start with the groove (the wide view, the context) and add detail (the fills, the accents, the embellishments) as the performance develops. Cassin's Finch adds detail to its song the same way — starting with a simple phrase and building complexity with each repetition. Resolution is a function of proximity, patience, and attention."*
