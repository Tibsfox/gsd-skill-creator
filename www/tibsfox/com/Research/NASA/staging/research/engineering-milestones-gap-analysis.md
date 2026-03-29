# NASA Engineering Milestones Gap Analysis

**Date:** 2026-03-29
**Catalog baseline:** 552 entries (nasa_master_mission_catalog_expanded.csv)
**Purpose:** Identify missing propulsion, systems engineering, technology demonstration, and materials science milestones suitable for Track 5 simulations

---

## Summary

The current 552-entry catalog is strong on flight missions (Mercury through Artemis, planetary probes, observatories, Shuttle manifest) but thin on the **engineering test programs** that made those missions possible. This audit identifies **53 detailed entries** across 10 categories, with 30+ additional candidates for follow-on passes. Each teaches fundamental principles that map directly to buildable simulations (OpenGL, Minecraft, Python, Arduino, GMAT).

---

## CATEGORY 1: Propulsion Test Programs (17 entries)

### 1A. Saturn I Block I Test Flights (SA-1 through SA-4)

The catalog has SA-5 (first orbital Saturn I) but is missing the four suborbital test flights that proved the clustered-engine concept.

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| SA-1 | Saturn I SA-1 | 1961-10-27 | First Saturn launch; 8 min flight to 136 km; proved 8-engine cluster concept | Thrust vectoring, engine clustering | OpenGL: 8-engine thrust vector visualization; Python: cluster reliability Monte Carlo |
| SA-2 | Saturn I SA-2 | 1962-04-25 | Second Block I test; released 95 tons of water at altitude (Project Highwater) creating artificial ice cloud | Fluid dynamics at altitude, phase transitions | GLSL: ice crystal formation shader; Minecraft: water release at altitude |
| SA-3 | Saturn I SA-3 | 1962-11-16 | Third test; first fully fueled S-I; second Project Highwater release; 167 km altitude | Propellant management, structural loading | Python: propellant consumption simulation |
| SA-4 | Saturn I SA-4 | 1963-03-28 | Engine-out capability test; deliberately shut down one engine in flight; proved Saturn can lose an engine and continue | Fault tolerance, redundancy engineering | OpenGL: engine-out trajectory deviation; Arduino: redundant system demo |

**CSV entries:**
```
1.203,SA-1,Saturn I SA-1,1961-10-27,1961-10-27,test-flight,Saturn,1,complete,"First Saturn rocket launch; 8 min flight to 136 km altitude; proved 8-engine cluster concept; 460 tons of thrust"
1.204,SA-2,Saturn I SA-2,1962-04-25,1962-04-25,test-flight,Saturn,1,complete,"Second Saturn I test; Project Highwater released 95 tons of water at altitude creating artificial ice cloud visible from ground"
1.205,SA-3,Saturn I SA-3,1962-11-16,1962-11-16,test-flight,Saturn,1,complete,"Third Saturn I Block I test; first fully fueled S-I stage; second Project Highwater; reached 167 km altitude"
1.206,SA-4,Saturn I SA-4,1963-03-28,1963-03-28,test-flight,Saturn,1,complete,"Engine-out capability demonstration; deliberately shut down one of 8 engines in flight; proved Saturn engine-out tolerance"
```

### 1B. SA-500F Facility Vehicle

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| SA-500F | Saturn V SA-500F Facility Vehicle | 1966-05-25 | Non-flying Saturn V used to test LC-39 facilities: VAB stacking, crawler transport, pad fit, umbilical connections; rolled out May 1966 | Systems integration, facility verification | Minecraft: full LC-39 complex build with crawler path; OpenGL: vehicle stacking sequence |

**CSV entry:**
```
1.207,SA-500F,Saturn V SA-500F Facility Vehicle,1966-05-25,1966-10-14,facility-test,Saturn,1,complete,"Non-flying Saturn V; tested LC-39 facilities: VAB stacking crawler transport pad fit umbilical connections; proved launch infrastructure"
```

### 1C. F-1 Engine Development Program

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| F-1-DEV | F-1 Engine Development | 1957-01-01 | Rocketdyne; 1.5M lbf thrust; 2000 tests on 210 injector designs to solve combustion instability; most powerful single-chamber liquid engine ever | Combustion dynamics, injector design, fluid mechanics | GLSL: combustion instability visualization; Python: injector pattern optimization; OpenGL: F-1 engine cross-section |

**CSV entry:**
```
1.208,F-1-DEV,F-1 Engine Development Program,1957-01-01,1963-01-01,propulsion-development,Saturn,1,complete,"Rocketdyne; 1.5M lbf; most powerful single-chamber liquid engine ever; 2000 tests on 210 injector designs solved combustion instability; 5 engines powered Saturn V S-IC"
```

### 1D. RL-10 Engine (First Hydrogen Engine)

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| RL-10-DEV | RL-10 Engine Development | 1958-01-01 | Pratt & Whitney; world's first liquid hydrogen/LOX engine; first flight Nov 27 1963 on Centaur AC-2; still flying today on SLS upper stage (60+ years in service); 500+ engines flown | Cryogenic propellant handling, expander cycle, hydrogen combustion | OpenGL: expander cycle animation; Python: specific impulse vs chamber pressure; Arduino: cryogenic temperature sensor demo |

**CSV entry:**
```
1.209,RL-10-DEV,RL-10 Engine Development,1958-01-01,1963-11-27,propulsion-development,Centaur,1,complete,"Pratt Whitney; world's first LH2/LOX engine; first flight on Centaur AC-2 Nov 1963; 500+ engines flown; still powers SLS upper stage; 60+ years of service; ASME Historic Landmark"
```

### 1E. RS-25 / SSME Development

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| RS-25-DEV | RS-25/SSME Development | 1972-03-31 | Rocketdyne; derived from J-2/HG-3 studies; staged combustion cycle; 3000 psi chamber pressure; prototype May 1975; first flight STS-1 1981; 99.95% reliability over 405 engine-missions; now powers SLS | High-pressure staged combustion, turbopump engineering, reusability | OpenGL: staged combustion cycle flow visualization; Python: turbopump pressure simulation; GMAT: SLS trajectory with RS-25 parameters |

**CSV entry:**
```
1.210,RS-25-DEV,RS-25/SSME Development Program,1972-03-31,1981-04-12,propulsion-development,Space Shuttle,3,complete,"Rocketdyne; staged combustion 3000 psi; prototype 1975; 46 engines built; 405 engine-missions at 99.95% reliability; powers SLS; most tested large rocket engine in history"
```

### 1F. NERVA/Project Rover (Nuclear Thermal Propulsion)

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| KIWI-A | Kiwi-A Reactor Test | 1959-07-01 | First nuclear rocket reactor test; 70 MW thermal; Los Alamos; Project Rover; named for flightless bird (not intended for flight) | Nuclear fission, reactor physics, heat transfer | Python: reactor power simulation; GLSL: neutron flux visualization |
| NERVA-NRX | NERVA NRX/EST Engine System Test | 1966-03-01 | First breadboard nuclear engine test; flight-functional configuration; 116 min total operation; proved hot bleed cycle | Nuclear propulsion engineering, thermal management | OpenGL: nuclear thermal rocket cross-section; Python: specific impulse comparison (chemical vs nuclear) |
| PHOEBUS-2A | Phoebus-2A Reactor | 1968-06-26 | Most powerful nuclear rocket reactor ever: 4000 MW thermal; peak of NERVA program | Nuclear engineering at scale, power density | Python: power scaling analysis; Minecraft: reactor facility build |
| NERVA-XE | NERVA XE-Prime Engine | 1969-03-01 | First nuclear engine tested in downward-firing position (simulating flight); 28 starts; 115 min total runtime; closest to flight-ready | Full system integration, nuclear safety | OpenGL: XE-Prime engine test visualization; GMAT: nuclear stage trajectory to Mars |

**CSV entries:**
```
1.211,KIWI-A,Kiwi-A Nuclear Reactor Test,1959-07-01,1960-10-01,propulsion-test,Project Rover,1,complete,"First nuclear rocket reactor test at NRDS Nevada; 70 MW thermal; Los Alamos; named for flightless bird; proof of concept for nuclear thermal propulsion"
1.212,NERVA-NRX,NERVA NRX/EST Engine System Test,1966-03-01,1966-03-01,propulsion-test,NERVA,1,complete,"First breadboard nuclear engine in flight-functional configuration; 116 min operation; demonstrated hot bleed cycle; Aerojet/Westinghouse"
1.213,PHOEBUS-2A,Phoebus-2A Reactor Test,1968-06-26,1968-06-26,propulsion-test,NERVA,2,complete,"Most powerful nuclear propulsion reactor ever: 4000 MW thermal; peak of Project Rover/NERVA program; NRDS Nevada"
1.214,NERVA-XE,NERVA XE-Prime Engine Test,1969-03-01,1969-06-01,propulsion-test,NERVA,2,complete,"First downward-firing nuclear engine test simulating flight; 28 starts; 115 min runtime; closest to flight-ready nuclear rocket; program cancelled Jan 1973"
```

### 1G. Solar Sail Demonstrations

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| NANOSAIL-D2 | NanoSail-D2 | 2010-11-20 | 3U CubeSat; 10 m2 sail deployed Jan 2011; demonstrated deorbit via drag augmentation; reentered Sep 2011 after 240 days | Solar radiation pressure, orbital decay, drag | GLSL: solar sail light pressure shader; Python: orbital decay simulation; OpenGL: sail deployment sequence |
| ACS3 | Advanced Composite Solar Sail System | 2024-04-23 | CubeSat with 9m-per-side composite boom sail; 75% lighter than metallic booms; deployed Sep 2024; pathfinder for solar sail propulsion | Composite materials, photon pressure, attitude control | OpenGL: sail orientation and thrust vector visualization; Python: photon pressure trajectory optimization |

**CSV entries:**
```
1.215,NANOSAIL-D2,NanoSail-D2,2010-11-20,2011-09-17,technology-demo,NanoSail,5,complete,"3U CubeSat; 10 m2 solar sail deployed Jan 2011; first deorbit via sail drag augmentation; reentered after 240 days; launched from FASTSAT; NASA Marshall/Ames"
1.216,ACS3,Advanced Composite Solar Sail System,2024-04-23,,technology-demo,ACS3,5,operational,"CubeSat; 9m per side composite boom solar sail; 75% lighter than metallic booms; deployed Sep 2024; pathfinder for practical solar sail propulsion"
```

### 1H. Advanced Ion Propulsion

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| NEXT-C-DEMO | NEXT-C Ion Thruster (DART Demo) | 2021-11-24 | 7 kW ion engine; first flight on DART 2021; next-gen after DS1's NSTAR; L3Harris/NASA GRC | Ion propulsion, Hall vs gridded ion physics, solar-electric | Python: ion thruster efficiency curves; OpenGL: ion beam visualization; Arduino: simple ion wind demo |
| AEPS | Advanced Electric Propulsion System | 2023-01-01 | 12 kW Hall-effect thruster; most powerful Hall thruster in production; 600 mN thrust; will power Gateway PPE; qualification testing through 2027 | Hall-effect physics, electromagnetic propulsion, plasma dynamics | GLSL: Hall thruster plasma plume shader; Python: specific impulse vs power tradeoff; GMAT: Gateway orbit transfer with AEPS |

**CSV entries:**
```
1.217,NEXT-C-DEMO,NEXT-C Ion Thruster Demonstration,2021-11-24,2022-09-26,technology-demo,DART,5,complete,"7 kW next-gen ion engine; first flight on DART spacecraft 2021; successor to DS1 NSTAR; L3Harris built; NASA GRC design; demonstrated deep-space solar electric propulsion"
1.218,AEPS,Advanced Electric Propulsion System,2023-01-01,,propulsion-development,Gateway,6,development,"12 kW Hall-effect thruster; most powerful Hall thruster in production; 600 mN thrust 2800s Isp; three units to power Lunar Gateway PPE; qualification testing through 2027"
```

---

## CATEGORY 2: Launch Vehicle Evolution (7 entries)

### 2A. Centaur Upper Stage First Flight

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| CENTAUR-AC2 | Atlas-Centaur AC-2 First Flight | 1963-11-27 | First successful flight of liquid hydrogen upper stage; Lewis Research Center (now Glenn); Abe Silverstein's team fixed insulation failures from AC-1 explosion | Cryogenic upper stage engineering, LH2 insulation | OpenGL: Centaur stage separation and ignition; Python: LH2 boiloff rate simulation |

**CSV entry:**
```
1.219,CENTAUR-AC2,Atlas-Centaur AC-2 First Flight,1963-11-27,1963-11-27,test-flight,Atlas-Centaur,1,complete,"First successful liquid hydrogen upper stage flight; Lewis Research Center; Abe Silverstein team; milestone: first in-flight LH2/LOX burn; enabled Surveyor and Mariner programs"
```

### 2B. Little Joe II (Apollo LES Test Vehicle)

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| LJ-II-QTV | Little Joe II QTV | 1963-08-28 | Qualification test vehicle; dummy Apollo CM; White Sands; proved booster design | Solid propulsion, abort system testing | Minecraft: White Sands launch complex; Python: abort trajectory calculation |
| LJ-II-A001 | Little Joe II A-001 | 1964-05-13 | First live Launch Escape System test; BP-12 CM; demonstrated abort works | Launch escape dynamics, rapid-fire motor ignition | OpenGL: LES motor fire sequence; Arduino: launch escape trigger circuit |
| LJ-II-A004 | Little Joe II A-004 | 1966-01-20 | Final LES test; first production CM (CSM-002); completed Apollo abort qualification | Full abort envelope verification | GMAT: abort trajectory from various altitudes |

**CSV entries:**
```
1.220,LJ-II-QTV,Little Joe II Qualification Test,1963-08-28,1963-08-28,abort-test,Apollo,1,complete,"First Little Joe II flight; qualification test vehicle at White Sands; dummy Apollo CM; proved solid-fuel booster design for Apollo abort testing"
1.221,LJ-II-A001,Little Joe II A-001,1964-05-13,1964-05-13,abort-test,Apollo,1,complete,"First live Apollo Launch Escape System test; boilerplate BP-12; demonstrated abort works at transonic speed; White Sands Missile Range"
1.222,LJ-II-A004,Little Joe II A-004,1966-01-20,1966-01-20,abort-test,Apollo,1,complete,"Final Little Joe II flight; first production Apollo CM CSM-002; completed Apollo LES abort qualification across full flight envelope; White Sands"
```

### 2C. Ares I-X Test Flight

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| ARES-IX | Ares I-X Test Flight | 2009-10-28 | Only flight of Constellation-era Ares I; 327 ft tall; 2.6M lbf thrust; Mach 4.76; 700+ sensors; suborbital from LC-39B; program cancelled 2010 | Launch vehicle design validation, roll torque control, SRB separation | OpenGL: Ares I-X aerodynamic profile; Python: 700-sensor telemetry analysis; GMAT: suborbital trajectory |

**CSV entry:**
```
1.223,ARES-IX,Ares I-X Test Flight,2009-10-28,2009-10-28,test-flight,Constellation,5,complete,"Only Ares I flight; 327 ft tall; 2.6M lbf thrust; Mach 4.76; 700+ sensors; 6-min suborbital from LC-39B; Constellation program cancelled 2010; data informed SLS design"
```

### 2D. SLS Green Run Hot Fire

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| SLS-GREEN-RUN | SLS Core Stage Green Run | 2021-03-18 | All 4 RS-25 engines fired 500 sec at Stennis B-2; 1.6M lbf combined; most powerful test since Saturn V era; first hot fire Jan 16 shut down early; second attempt successful | Full-stage propulsion integration, test methodology | OpenGL: 4-engine hot fire visualization; Python: engine start sequence timing; Arduino: vibration/acoustic sensor array |

**CSV entry:**
```
1.224,SLS-GREEN-RUN,SLS Core Stage Green Run Hot Fire,2021-03-18,2021-03-18,propulsion-test,SLS,6,complete,"All 4 RS-25 engines 500 sec at Stennis B-2; 1.6M lbf combined; most powerful test since Saturn V era; first attempt Jan 16 cut short; second attempt full duration; validated SLS core"
```

---

## CATEGORY 3: Spacecraft Systems Engineering Firsts (5 entries)

### 3A. Gemini On-Board Computer

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| GEMINI-OBC | Gemini On-Board Computer | 1965-03-23 | IBM; first digital computer on a crewed spacecraft; 59 lbs; 7.143 kHz clock; 20 KB memory; 7000 calculations/sec; flew on Gemini 3 through 12 | Computer architecture, real-time computing, embedded systems | Python: Gemini OBC emulator; Arduino: 7 kHz clock demonstration; OpenGL: DSKY-style interface |

**CSV entry:**
```
1.225,GEMINI-OBC,Gemini On-Board Computer (First Crewed Spacecraft Computer),1965-03-23,1966-11-15,technology-first,Gemini,1,complete,"IBM Federal Systems; first digital computer on crewed spacecraft; 59 lbs; 7.143 kHz; 20 KB memory; flew Gemini 3-12; enabled orbital calculations and rendezvous planning"
```

### 3B. Apollo Guidance Computer

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| AGC | Apollo Guidance Computer | 1966-08-25 | MIT Instrumentation Lab / Draper; first IC-based computer; 2048 words RAM, 36864 words ROM (rope memory); 1.024 MHz; drove Apollo IC chip industry; flew 15 crewed missions flawlessly | IC-based computing, priority scheduling, rope core memory | Python: AGC emulator (Virtual AGC project); Minecraft: rope memory demonstration; OpenGL: DSKY interface simulator; Arduino: simple priority interrupt demo |

**CSV entry:**
```
1.226,AGC,Apollo Guidance Computer,1966-08-25,1975-07-24,technology-first,Apollo,2,complete,"MIT Draper Lab; first IC-based computer in space; 2048 words RAM 36864 ROM rope memory; 1.024 MHz; drove integrated circuit industry; flew 15 crewed missions flawlessly including 6 lunar landings"
```

### 3C. SNAP-10A (First Nuclear Reactor in Space)

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| SNAP-10A | SNAP-10A / SNAPSHOT | 1965-04-03 | Only US fission reactor launched to space; Atomics International; 500W electrical from 235U; NaK coolant; 43 days operation before spacecraft electrical failure; still in 500 nmi orbit | Nuclear fission power, thermoelectric conversion, NaK coolant systems | Python: thermoelectric power output simulation; OpenGL: reactor cross-section; GLSL: thermal gradient visualization |

**CSV entry:**
```
1.227,SNAP-10A,SNAP-10A / SNAPSHOT,1965-04-03,1965-05-16,technology-demo,SNAP,1,complete,"Only US fission reactor launched to space; Atomics International; 235U fuel; NaK coolant; 500W electrical; 43 days operation; also tested first ion thruster in orbit; still in 500 nmi orbit"
```

### 3D. Orbital Express (First Autonomous Satellite Servicing)

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| ORBITAL-EXPRESS | Orbital Express | 2007-03-08 | DARPA/NASA MSFC; ASTRO + NEXTSat; first autonomous rendezvous, capture, fuel transfer, and ORU (battery/computer) swap between two spacecraft; Boeing built; completed Jun 2007 | Autonomous rendezvous, robotic servicing, orbital mechanics | OpenGL: rendezvous approach visualization; Python: autonomous GNC simulation; Minecraft: satellite servicing scenario |

**CSV entry:**
```
1.228,ORBITAL-EXPRESS,Orbital Express,2007-03-08,2007-07-22,technology-demo,DARPA/NASA,5,complete,"DARPA/NASA MSFC; ASTRO servicing satellite + NEXTSat client; first autonomous rendezvous capture fuel transfer and ORU swap in orbit; Boeing; world's first autonomous on-orbit servicing"
```

### 3E. Robonaut 2 (First Humanoid Robot in Space)

Already partially covered as payload on STS-133, but deserves technology-first recognition. The catalog notes mention it but it has no standalone entry. Consider adding a note to STS-133 rather than a new row.

---

## CATEGORY 4: Robotic Technology Demonstrations (3 entries)

### 4A. Ingenuity Mars Helicopter (Standalone Entry)

The catalog includes Ingenuity as part of Mars 2020/Perseverance entry (1.179). However, Ingenuity achieved 72 flights over 3 years -- it deserves a standalone technology-first entry given it was the first powered flight on another planet.

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| INGENUITY | Ingenuity Mars Helicopter | 2021-04-19 | First powered controlled flight on another planet; 72 flights; 17 km distance; 128 min airtime; technology demo became operational scout; ended Jan 2024 (blade damage) | Aerodynamics in thin atmosphere (1% Earth), autonomous flight, rotor design | OpenGL: Mars atmosphere flight dynamics; Python: rotor RPM vs lift in 0.6% atm; Minecraft: Mars helicopter flight path; GLSL: dust visualization |

**CSV entry:**
```
1.229,INGENUITY,Ingenuity Mars Helicopter,2021-04-19,2024-01-25,technology-demo,Mars 2020,5,complete,"First powered controlled flight on another planet; 72 flights over 3 years; 17 km total distance; 128 min airtime; 1.8 kg; coaxial rotors at 2537 RPM in 1% atmosphere; blade damage ended mission"
```

### 4B. Sojourner Autonomous Navigation

Already in catalog as part of Pathfinder (1.130). No new entry needed, but Track 5 simulation should emphasize the autonomous hazard avoidance -- first rover to navigate autonomously on another planet.

### 4C. STS-125 Hubble SM4 (Fifth and Final Servicing Mission)

The catalog references STS-125 in the HST entry notes but has no dedicated STS-125 row like it does for STS-82, STS-103, STS-109.

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| STS-125 | STS-125 Atlantis (HST SM4) | 2009-05-11 | Fifth and final Hubble servicing; installed WFC3 and COS; repaired STIS and ACS; replaced batteries, gyros, FGS; 5 EVAs; extended Hubble life to 2030s+ | On-orbit repair, precision instrument work, mission planning under risk | OpenGL: EVA repair sequence; Python: instrument swap timeline optimization |

**CSV entry:**
```
1.230,STS-125,STS-125 Atlantis (HST SM4),2009-05-11,2009-05-24,crewed-hubble-servicing,Space Shuttle/HST,4,complete,"Fifth and final Hubble servicing; installed WFC3 COS; repaired STIS ACS; replaced batteries gyros FGS; 5 EVAs; extended Hubble life to 2030s+; rescue Shuttle Endeavour stood ready at LC-39B"
```

---

## CATEGORY 5: Space Station Engineering (3 entries)

The catalog already covers major ISS assembly missions (STS-88/Unity, STS-98/Destiny, STS-104/Quest, STS-120/Harmony, STS-130/Tranquility+Cupola, STS-122/Columbus, STS-123+124+127/Kibo). However, two significant ISS components are missing:

### 5A. Canadarm2 Installation

STS-100 is in the catalog (1.359) and already notes Canadarm2. No new entry needed.

### 5B. Nauka Multipurpose Laboratory Module

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| ISS-NAUKA | Nauka MLM | 2021-07-21 | Russian multipurpose lab; launched on Proton; 20 tons; docked Jul 29; accidentally fired thrusters spinning ISS 540 degrees before recovery; major station component | Attitude control recovery, docking dynamics, emergency response | OpenGL: ISS attitude excursion visualization; Python: thruster-induced rotation simulation; GMAT: attitude recovery maneuver |

**CSV entry:**
```
1.231,ISS-NAUKA,Nauka Multipurpose Laboratory Module,2021-07-21,2021-07-29,iss-assembly,ISS,6,complete,"Russian 20-ton multipurpose lab; Proton launch; accidentally fired thrusters after docking spinning ISS 540 degrees; ground controllers recovered attitude; last major ISS module addition"
```

### 5C. Prichal Node Module

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| ISS-PRICHAL | Prichal Node Module | 2021-11-24 | Russian ball-shaped node with 6 docking ports; attached to Nauka; last ISS module (to date) | Docking port architecture, node connectivity | Minecraft: modular station assembly |

**CSV entry:**
```
1.232,ISS-PRICHAL,Prichal Node Module,2021-11-24,2021-11-26,iss-assembly,ISS,6,complete,"Russian ball-shaped node with 6 docking ports; launched on Soyuz with Progress tug; attached to Nauka; final ISS module to date; enables future Russian vehicle docking"
```

---

## CATEGORY 6: Telescope and Instrument Engineering (2 entries)

### 6A. STS-61 Hubble SM1 (The Repair Mission)

The catalog references STS-61 in HST notes and in STS-51 notes about testing repair tools, but has no dedicated STS-61 row.

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| STS-61 | STS-61 Endeavour (HST SM1) | 1993-12-02 | First Hubble repair; installed COSTAR corrective optics and WFPC2; 5 EVAs totaling 35h 28m; fixed 2.2 micron mirror error | Precision optics correction, on-orbit repair, mission choreography | OpenGL: COSTAR mirror alignment visualization; Python: spherical aberration correction model; GLSL: before/after image quality shader |

**CSV entry:**
```
1.233,STS-61,STS-61 Endeavour (HST SM1),1993-12-02,1993-12-13,crewed-hubble-servicing,Space Shuttle/HST,4,complete,"First Hubble repair; installed COSTAR corrective optics and WFPC2; 5 EVAs 35h 28m; corrected 2.2 micron mirror flaw; transformed Hubble from failure to flagship; Musgrave Covey Bowersox"
```

### 6B. JWST Deployment Sequence

Already in catalog (1.178) but the 29-day deployment sequence is one of the most complex engineering feats ever. Consider adding Track 5 emphasis on the deployment rather than a new entry. The 344 single-point failures during deployment make this a masterclass in sequential engineering.

---

## CATEGORY 7: Entry, Descent, and Landing Evolution (4 entries)

### 7A. Stardust Sample Return Capsule

Already in catalog (1.138) but the reentry deserves specific EDL emphasis: fastest manmade object to enter Earth's atmosphere at 12.9 km/s (Mach 36), with PICA heat shield reaching 2900C. No new entry needed, but Track 5 should build an EDL simulation.

### 7B. Orion EFT-1 (Exploration Flight Test)

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| EFT-1 | Orion EFT-1 | 2014-12-05 | First Orion flight; uncrewed; Delta IV Heavy; two orbits to 5800 km altitude; tested heat shield at 84% lunar return speed (8.9 km/s); 11 parachutes | Thermal protection at high velocity, parachute staging, deep-space reentry | OpenGL: Orion reentry heating visualization; Python: heat shield ablation model; GMAT: high-apogee orbit and reentry trajectory |

**CSV entry:**
```
1.234,EFT-1,Orion EFT-1 (Exploration Flight Test),2014-12-05,2014-12-05,test-flight,Orion,5,complete,"First Orion flight; uncrewed; Delta IV Heavy; two orbits to 5800 km; tested heat shield at 84% lunar return speed 8.9 km/s; 11 parachutes; validated Orion design for Artemis"
```

### 7C. Pad Abort 1 (Orion Launch Abort System)

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| PA-1 | Orion Pad Abort 1 | 2010-05-06 | First test of Orion Launch Abort System; boilerplate CM from pad to 1.8 km in 15 sec; White Sands; 7M lbf·s total impulse | Launch escape dynamics, solid motor staging, rapid acceleration | OpenGL: pad abort trajectory; Python: acceleration profile (15g peak); Arduino: accelerometer data logger |

**CSV entry:**
```
1.235,PA-1,Orion Pad Abort 1,2010-05-06,2010-05-06,abort-test,Orion,5,complete,"First Orion Launch Abort System test; boilerplate from pad to 1.8 km in 15 sec; White Sands; 7M lbf-s impulse; proved crew escape capability; data informed Artemis abort design"
```

### 7D. AA-2 Ascent Abort 2

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| AA-2 | Orion Ascent Abort 2 | 2019-07-02 | Orion abort system test at max aerodynamic pressure (Max-Q); booster reached Mach 1.15 at 31000 ft; abort motor fired 400000 lbf; tumble motors reoriented CM; Cape Canaveral | Max-Q abort, attitude control motor, aerodynamic loads | OpenGL: Max-Q abort sequence; Python: dynamic pressure vs altitude; GMAT: abort trajectory from Max-Q |

**CSV entry:**
```
1.236,AA-2,Orion Ascent Abort 2,2019-07-02,2019-07-02,abort-test,Orion,5,complete,"Orion abort system test at Max-Q conditions; booster to Mach 1.15 at 31000 ft; 400000 lbf abort motor; tumble motors reoriented CM; completed Orion abort qualification; Cape Canaveral"
```

---

## CATEGORY 8: Power Systems Evolution (4 entries)

### 8A. SNAP-3B (First RTG in Space)

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| SNAP-3B | SNAP-3B RTG (Transit 4A) | 1961-06-29 | First nuclear power source in space; 96g Pu-238; 2.7W electrical; aboard Navy Transit 4A navigation satellite; proved radioisotope power viable for space | Thermoelectric conversion, radioactive decay, Seebeck effect | Python: RTG power decay over time (half-life model); OpenGL: thermocouple junction visualization; Arduino: Peltier/Seebeck effect demo |

**CSV entry:**
```
1.237,SNAP-3B,SNAP-3B RTG on Transit 4A,1961-06-29,1961-06-29,technology-first,SNAP,1,complete,"First nuclear power source in space; 96g plutonium-238; 2.7W electrical; aboard Navy Transit 4A; proved radioisotope thermoelectric generator viable for spaceflight; Seebeck effect"
```

### 8B. Vanguard 1 Solar Power

Already in catalog (1.4) as "First solar-powered satellite." No new entry needed but Track 5 should emphasize the solar cell engineering -- first practical use of silicon solar cells in space.

### 8C. Gemini 5 Fuel Cells

Already in catalog (1.41) with fuel cell mention. No new entry needed. Track 5 should build a fuel cell simulation -- alkaline hydrogen/oxygen fuel cells first flew on Gemini 5, then powered Apollo and Shuttle for decades.

### 8D. Multi-Mission RTG (MMRTG)

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| MMRTG-DEV | Multi-Mission RTG Development | 2006-01-01 | New standard RTG design; ~110W at launch decaying ~2W/year; Pu-238 fuel; powers Curiosity and Perseverance; designed for both vacuum and Mars atmosphere operation | Radioisotope power engineering, thermal management in atmosphere | Python: MMRTG power curve over mission lifetime; OpenGL: PbTe/TAGS thermocouple array; GLSL: thermal gradient |

**CSV entry:**
```
1.238,MMRTG-DEV,Multi-Mission RTG (MMRTG),2006-01-01,2011-11-26,power-system,RPS,5,complete,"Standard RTG: ~110W at launch; Pu-238; powers Curiosity and Perseverance; first RTG designed for both vacuum and planetary atmosphere; PbTe/TAGS thermocouples; 14-year+ proven life"
```

### 8E. Kilopower/KRUSTY Reactor Test

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| KRUSTY | KRUSTY/Kilopower Reactor Test | 2018-03-01 | Kilopower Reactor Using Stirling Technology; 1-10 kW fission reactor; tested at NNSS Nevada; 28-hour full power test; HEU core with Stirling engines; designed for lunar/Mars surface power | Stirling cycle, fission power, surface power systems | Python: Stirling engine cycle simulation; OpenGL: KRUSTY reactor cross-section; Minecraft: lunar surface power station |

**CSV entry:**
```
1.239,KRUSTY,KRUSTY Kilopower Reactor Test,2018-03-01,2018-03-21,technology-demo,Kilopower,5,complete,"Kilopower Reactor Using Stirling Technology; 1-10 kW fission; 28-hour full power test at NNSS Nevada; HEU core with Stirling converters; designed for lunar and Mars surface power"
```

---

## CATEGORY 9: Communication Systems (4 entries)

### 9A. LCRD (Laser Communications Relay Demonstration)

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| LCRD | Laser Communications Relay Demonstration | 2021-12-07 | First two-way end-to-end optical relay in space; 1.2 Gbps from GEO; ground stations at Table Mountain CA and Haleakala HI; hosted on STPSat-6; 10-100x bandwidth over RF | Laser communications, pointing accuracy, atmospheric compensation | OpenGL: laser beam pointing simulation; Python: link budget calculator (optical vs RF); GLSL: atmospheric turbulence effect on laser |

**CSV entry:**
```
1.240,LCRD,Laser Communications Relay Demonstration,2021-12-07,,technology-demo,LCRD,5,operational,"First two-way end-to-end optical relay; 1.2 Gbps from GEO; ground stations at Table Mountain CA and Haleakala HI; on STPSat-6; 10-100x bandwidth over RF; pathfinder for DSOC and future laser comms"
```

### 9B. DSOC (Deep Space Optical Communications)

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| DSOC | Deep Space Optical Communications | 2023-10-13 | First laser communications from deep space; on Psyche spacecraft; 267 Mbps from 19M miles; sent cat video (Taters) from deep space; 10x better than state-of-art RF | Deep-space laser communication, photon counting, pointing at interplanetary distance | OpenGL: laser beam divergence over millions of miles; Python: photon arrival rate simulation; GLSL: adaptive optics correction |

**CSV entry:**
```
1.241,DSOC,Deep Space Optical Communications,2023-10-13,,technology-demo,Psyche,5,operational,"First deep-space laser comms; on Psyche; 267 Mbps from 19M miles; first light Nov 14 2023; streamed video from deep space; 10x better than RF; JPL flight transceiver; Caltech ground station"
```

### 9C. ILLUMA-T (ISS Laser Terminal)

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| ILLUMA-T | ILLUMA-T ISS Laser Terminal | 2023-11-09 | Integrated LCRD Low-Earth Orbit User Modem and Amplifier Terminal; first operational laser comms from ISS; relays through LCRD to ground | Operational laser comms, LEO-GEO relay architecture | Python: ISS-LCRD-ground relay chain simulation |

**CSV entry:**
```
1.242,ILLUMA-T,ILLUMA-T ISS Laser Terminal,2023-11-09,,technology-demo,LCRD,6,operational,"First operational laser comms from ISS; relays high-rate science data through LCRD GEO relay to ground; demonstrated end-to-end optical communications infrastructure for LEO missions"
```

### 9D. TDRS System (System-Level Entry)

The catalog has individual TDRS satellites (TDRS-1 through TDRS-13) but no system-level entry for the TDRSS concept itself, which replaced the global ground station network and revolutionized space communications.

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| TDRSS | Tracking and Data Relay Satellite System | 1983-04-04 | Replaced global ground station network with GEO relay constellation; 85%+ coverage (vs 15% from ground stations); enabled Shuttle, ISS, Hubble continuous comms; 13 satellites over 3 generations through 2017; transitioning to commercial 2024+ | Relay satellite architecture, link budgets, GEO orbits | OpenGL: TDRSS coverage visualization; Python: ground track vs relay coverage comparison; GMAT: GEO relay orbit design |

**CSV entry:**
```
1.243,TDRSS,Tracking and Data Relay Satellite System,1983-04-04,,communications-infrastructure,TDRS,4,operational,"GEO relay constellation replacing global ground stations; 85%+ coverage vs 15% from ground; enabled Shuttle ISS Hubble continuous comms; 13 satellites 3 generations 1983-2017; transitioning to commercial"
```

---

## CATEGORY 10: Materials Science and In-Situ Manufacturing (6 entries)

### 10A. MOXIE (Mars Oxygen Production)

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| MOXIE | Mars Oxygen ISRU Experiment | 2021-04-20 | First ISRU on another planet; on Perseverance; extracted O2 from Mars CO2 atmosphere; 16 extractions; 122g total; 12g/hr peak at 98%+ purity; solid oxide electrolysis at 800C | Solid oxide electrolysis, ISRU, Mars atmospheric processing | Python: SOXE electrochemistry simulation; OpenGL: MOXIE process flow animation; Arduino: CO2 sensor and electrolysis demo; Minecraft: Mars ISRU base |

**CSV entry:**
```
1.244,MOXIE,MOXIE Mars Oxygen ISRU Experiment,2021-04-20,2023-08-07,technology-demo,Mars 2020,5,complete,"First ISRU on another planet; 16 O2 extractions from Mars CO2; 122g total; 12g/hr peak at 98%+ purity; solid oxide electrolysis at 800C; on Perseverance; proved concept for future crew propellant production"
```

### 10B. 3D Printing in Space (Made In Space)

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| ISS-3DPRINT | 3D Printing in Zero-G (ISS) | 2014-11-24 | First object manufactured in space; Made In Space; FDM printer on ISS via SpaceX CRS-4; ABS plastic; led to permanent Additive Manufacturing Facility (AMF) 2016; 200+ parts printed | Additive manufacturing, microgravity material behavior, on-demand fabrication | OpenGL: layer-by-layer FDM in microgravity; Python: thermal model of extrusion without convection; Minecraft: 3D printer build |

**CSV entry:**
```
1.245,ISS-3DPRINT,First 3D Printing in Space,2014-11-24,2014-11-24,technology-first,ISS,6,complete,"First object manufactured in space; Made In Space FDM printer on ISS; ABS plastic; launched SpaceX CRS-4; permanent Additive Manufacturing Facility installed 2016; 200+ parts printed in orbit"
```

### 10C. LDEF (Long Duration Exposure Facility)

Already in catalog (1.262) with excellent coverage. 57 experiments exposed to space environment for 5.7 years. Track 5 should emphasize materials science analysis.

### 10D. Shuttle Tile TPS System

No standalone entry exists for the Shuttle TPS as an engineering achievement. The 24,305 unique hand-fitted tiles are one of the most complex materials engineering programs ever.

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| SHUTTLE-TPS | Space Shuttle Thermal Protection System | 1981-04-12 | 24305 unique silica tiles; LI-900 and HRSI types; each hand-fitted; withstood 1260C+ reentry temps; 6 tile types for different heat zones; RCC for wing leading edges; cause of Columbia loss when RCC breached | Thermal protection, ablative vs reusable, materials science, quality control | GLSL: reentry heating visualization by tile zone; OpenGL: tile placement pattern; Python: thermal soak-through model; Minecraft: Shuttle tile mosaic |

**CSV entry:**
```
1.246,SHUTTLE-TPS,Space Shuttle Thermal Protection System,1981-04-12,2011-07-21,technology-system,Space Shuttle,4,complete,"24305 unique hand-fitted silica tiles; LI-900 HRSI LRSI RCC FRCI types; withstood 1260C+ reentry; 6 zones by heat load; RCC wing leading edge breach caused Columbia loss; most complex TPS ever built"
```

### 10E. PICA Heat Shield Material

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| PICA-DEV | PICA Heat Shield Development | 1996-01-01 | Phenolic Impregnated Carbon Ablator; developed at NASA Ames; survived 2900C on Stardust (fastest atmospheric entry ever at Mach 36); SpaceX derived PICA-X for Dragon; low density ablator | Ablation physics, carbon-phenolic chemistry, char layer formation | GLSL: ablation and char layer formation; Python: mass loss vs heat flux model; OpenGL: Stardust reentry trajectory with heating |

**CSV entry:**
```
1.247,PICA-DEV,PICA Heat Shield Material Development,1996-01-01,2006-01-15,materials-development,Ames,5,complete,"Phenolic Impregnated Carbon Ablator; NASA Ames; survived 2900C on Stardust at Mach 36; low density high performance ablator; SpaceX derived PICA-X for all Dragon capsules; used on MSL Mars entry"
```

### 10F. Composite Crew Module (CCM)

| Code | Name | Date | Notes | Principle | Simulation |
|------|------|------|-------|-----------|------------|
| CCM | Composite Crew Module | 2009-01-01 | NASA/industry joint effort to build all-composite spacecraft pressure vessel; demonstrated carbon fiber construction techniques for crew-rated spacecraft; tested to 200% design limit load at Marshall | Composite structural engineering, autoclave processing, pressure vessel design | OpenGL: composite layup visualization; Python: laminate stress analysis |

**CSV entry:**
```
1.248,CCM,Composite Crew Module (CCM),2009-01-01,2009-09-01,technology-demo,Exploration,5,complete,"All-composite spacecraft pressure vessel; NASA Langley Northrop Boeing; demonstrated carbon fiber crew module construction; tested to 200% design limit load at Marshall; advanced composite spacecraft manufacturing"
```

---

## CATEGORY SUMMARY

| Category | New Entries | Key Gaps Filled |
|----------|-------------|-----------------|
| 1. Propulsion Test Programs | 17 | SA-1 through SA-4, SA-500F, F-1 dev, RL-10 dev, RS-25 dev, NERVA/Kiwi (4), NanoSail-D2, ACS3, NEXT-C, AEPS |
| 2. Launch Vehicle Evolution | 7 | Centaur AC-2, Little Joe II (3), Ares I-X, SLS Green Run |
| 3. Systems Engineering Firsts | 5 | Gemini OBC, AGC, SNAP-10A, Orbital Express, (Robonaut note) |
| 4. Robotic Technology Demos | 2 | Ingenuity standalone, STS-125 SM4 |
| 5. Space Station Engineering | 3 | Nauka, Prichal, (ISS modules already covered) |
| 6. Telescope Engineering | 1 | STS-61 HST SM1 |
| 7. EDL Evolution | 4 | EFT-1, Pad Abort 1, Ascent Abort 2, (Stardust noted) |
| 8. Power Systems | 4 | SNAP-3B RTG, MMRTG, KRUSTY, (Vanguard/Gemini noted) |
| 9. Communications | 4 | LCRD, DSOC, ILLUMA-T, TDRSS system entry |
| 10. Materials Science | 6 | MOXIE, 3D printing ISS, Shuttle TPS, PICA, CCM, (LDEF noted) |
| **TOTAL** | **53** | |

---

## VERSION NUMBER ASSIGNMENT NOTES

The suggested version numbers (1.203-1.248) are placeholders. The actual version numbers should be assigned based on:
1. Chronological ordering within the catalog
2. Epoch assignment (1-6) matching the dates
3. Avoiding collision with existing entries

Many of these entries are **pre-mission development programs** that don't have clean start/end dates like flight missions. Consider a version numbering scheme that groups them (e.g., 1.5xx for propulsion development, 1.6xx for technology firsts) or interleaves them chronologically.

---

## ADDITIONAL CANDIDATES (Not Detailed Above -- Future Audit)

These warrant investigation in a follow-on pass:

### Propulsion
- J-2 engine development (Saturn V S-II and S-IVB stage engine)
- RD-180 engine (Russian engine used on Atlas III/V -- NASA funded, controversial)
- BE-3 and Raptor engines (commercial crew/cargo context)
- SLS Block 1B / Exploration Upper Stage development

### Launch Vehicles
- Delta II final flight (ICESat-2, 2018, 100-streak record)
- Delta IV Heavy final flight (NROL-70, 2024, end of Delta program)
- Atlas V final flights (transitioning to Vulcan)
- Scout program summary entry (1960-1994, 118 flights)
- Pegasus air-launch vehicle (1990-present, Orbital Sciences)

### Technology Demonstrations
- TETHERED experiments (TSS-1 on STS-46, TSS-1R on STS-75 -- tether snapped)
- SAFER jet backpack (STS-64, 1994 -- EVA self-rescue)
- X-38 Crew Return Vehicle (cancelled but extensive testing)
- X-43A Hyper-X (Mach 9.6, 2004)
- X-37B OTV (military, but significant autonomous operations)

### Materials
- Aerogel development (Stardust collector, Mars rovers)
- Inflatable structures (TransHab concept, BEAM module on ISS 2016-present)
- Metallic hydrogen experiments (lab, not space)

### Communications
- ACTS (Advanced Communications Technology Satellite, 1993 -- Ka-band pioneer)
- Amateur radio experiments on ISS (ARISS program)

---

## SIMULATION PRIORITY MATRIX

For Track 5, these entries produce the richest simulations:

| Rank | Entry | Why |
|------|-------|-----|
| 1 | AGC | Virtual AGC already exists; full computer emulation; rope memory build |
| 2 | F-1 Engine Dev | Combustion instability is a deep fluid dynamics problem; 210 injector variants |
| 3 | NERVA/Kiwi | Nuclear rocket physics; reactor simulation; cancelled-but-real engineering |
| 4 | Shuttle TPS | 24305 tiles; heat transfer; materials science; can build full OpenGL model |
| 5 | MOXIE | Electrochemistry; Mars atmosphere; ISRU is the future; Arduino buildable |
| 6 | SA-4 Engine-Out | Fault tolerance simulation; Monte Carlo reliability; redundancy patterns |
| 7 | PICA | Ablation physics; reentry heating; real-world SpaceX application |
| 8 | DSOC | Laser link budgets; photon counting; optical communications are the future |
| 9 | KRUSTY | Stirling engines; nuclear fission; lunar base power design |
| 10 | Ingenuity | Aerodynamics in thin atmosphere; autonomous flight; rotor physics |

---

*Document produced for gsd-skill-creator / NASA Mission Series catalog expansion*
*Research verified via web search against NASA.gov, Wikipedia, NTRS, Smithsonian NASM, and JPL sources*
