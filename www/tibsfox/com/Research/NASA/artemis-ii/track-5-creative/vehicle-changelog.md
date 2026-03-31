# vehicle.js — Evolution Log

Tracks how the forest simulation evolves during the Artemis II mission.
Each entry documents what changed, what data or research drove it, and the connection to the mission.

---

## v1.0.0 — Pre-Launch (2026-03-30)

**Baseline:** 49,968 bytes, p5.js 0.7.2, deployed to tibsfox.com/Research/forest/

### Sky
- 200 twinkling stars (warm/cool/white color mix, cross-spikes on brightest)
- Shooting stars with fading trails (~0.2%/frame chance, max 2)
- Moon with 3-layer atmospheric halo, moonlight ground wash
- Night sky gradient (deep indigo zenith → lighter horizon)
- Aurora borealis from live NOAA Kp index (green curtains when Kp >= 4)

### Species (from S36 Seattle 360 Engine)
- Fox Sparrow (deg 49, E=3) — diurnal ground forager, dawn boost 1.3x
- Violet-green Swallow (deg 27, E=4) — aerial insectivore, colonial
- Spotted Owl (deg 4, E=2) — nocturnal apex, hunts when others sleep
- Varied Thrush (deg 2, E=2) — crepuscular, peaks at twilight
- Anna's Hummingbird (deg 36, E=5) — fastest agent, territorial, solitary
- Brown Creeper (deg 51, E=2) — bark gleaner, camouflaged
- Mycelia (NASA v1.0 Armillaria) — always active, bioluminescent at night

### Plants (from NASA Organism Pairings)
- Fern (v1.2 Sword Fern) — shade tolerant, understory
- Cedar (Thuja plicata) — hub tree, shade tolerant
- Moss — shade tolerant, ground cover
- Alder — nitrogen fixer, pioneer
- **Fireweed** (v1.1 Chamerion angustifolium) — pioneer, progressive magenta bloom, seed burst

### Behaviors
- Circadian rhythms from real sun altitude (dawn chorus, nocturnal inversion, crepuscular peaks)
- Barometric pressure prediction (falling → increased foraging, rising → calm)
- Fog from real KPAE dewpoint spread (perception radius reduction)
- Firefly Kuramoto coupled oscillator synchronization
- Energy levels E=1-5 from S36 modulate agent amplitude
- Wind-driven seed dispersal from real KPAE wind data

### Data Sources
- NOAA KPAE: temp, wind, humidity, pressure, dewpoint, visibility, precip, cloud layers
- NOAA Space Weather: Kp index for aurora
- Astronomical: sun/moon position computed for 47.9°N 122.3°W
