# Ada in Safety-Critical Systems, SPARK Formal Verification, and the GNAT Ecosystem

*PNW Research Series — ADA Deep Research, Thread B*
*Scope: safety-critical industries, SPARK, GNAT and other implementations, tooling*

---

## Table of Contents

1. [Why Ada in Safety-Critical Systems](#1-why-ada-in-safety-critical-systems)
2. [Aerospace and Avionics](#2-aerospace-and-avionics)
3. [Space Systems and the Ariane 5 Story](#3-space-systems-and-the-ariane-5-story)
4. [Railways and Signaling](#4-railways-and-signaling)
5. [Air Traffic Control](#5-air-traffic-control)
6. [Defense Systems](#6-defense-systems)
7. [Medical Devices](#7-medical-devices)
8. [Nuclear Instrumentation and Control](#8-nuclear-instrumentation-and-control)
9. [Automotive](#9-automotive)
10. [Financial Systems](#10-financial-systems)
11. [Certification Standards](#11-certification-standards)
12. [SPARK: Origin, Evolution, and Philosophy](#12-spark-origin-evolution-and-philosophy)
13. [What SPARK 2014 Restricts](#13-what-spark-2014-restricts)
14. [What SPARK 2014 Proves](#14-what-spark-2014-proves)
15. [How SPARK Proofs Work Under the Hood](#15-how-spark-proofs-work-under-the-hood)
16. [SPARK in Industry](#16-spark-in-industry)
17. [Worked SPARK Examples](#17-worked-spark-examples)
18. [The GNAT Story](#18-the-gnat-story)
19. [Other Ada Implementations](#19-other-ada-implementations)
20. [GNAT Tooling Ecosystem](#20-gnat-tooling-ecosystem)
21. [Language Server and Modern Tooling](#21-language-server-and-modern-tooling)
22. [Ada and Rust: The Modern Conversation](#22-ada-and-rust-the-modern-conversation)
23. [The Modern Ada Community](#23-the-modern-ada-community)
24. [Why Ada Is Having a Quiet Revival in the 2020s](#24-why-ada-is-having-a-quiet-revival-in-the-2020s)

---

## 1. Why Ada in Safety-Critical Systems

When an airliner rolls onto a runway in Toulouse, when a driverless metro train pulls out of a station at Paris Châtelet, when a reactor trip signal arms itself in a nuclear I&C cabinet, there is a very good chance that the software making real-time decisions was written in Ada. For four decades the language has accumulated a body of working, certified, fielded code in environments where a wrong bit can kill people. Ada did not win this position by accident, and it did not win it by being fashionable. It won it by matching — structurally and culturally — the requirements of regulated engineering.

### 1.1 Strong typing catches errors at compile time

The Ada type system is nominal: two distinct types with identical representations are not interchangeable. A value of type `Metres` cannot be silently added to a value of type `Feet`; a value of type `Valve_Open_Command` cannot be passed to a routine that expects a `Valve_Close_Command`. The canonical Mars Climate Orbiter loss (1999) — where a Lockheed Martin component produced pound-seconds of impulse while a NASA JPL component expected newton-seconds — is the textbook story of what nominal unit types exist to prevent. A strongly-typed Ada declaration of the interface would have made that software physically incapable of being linked in that configuration.

Beyond nominal distinctness, Ada supports **subtypes with constraints**. A subtype is a type whose values are a proper subset of a parent type, usually with a runtime-checked range:

```ada
type Altitude_Ft is range 0 .. 60_000;
subtype Descent_Altitude_Ft is Altitude_Ft range 0 .. 14_000;
```

Assigning a value outside the declared range raises `Constraint_Error` unless checks are suppressed. With SPARK this is lifted further: the proof tool is required to show the constraint is never violated, and the check becomes a compile-time obligation rather than a runtime surprise.

Ada also offers scalar **derived types** and **record types** with representation clauses that bind layout, bit order, and endianness to the declaration. For hardware interfaces and serialization formats this replaces the `#pragma pack` / `__attribute__((packed))` folklore of C with a precise, portable specification:

```ada
type Packet is record
   Version  : Natural  range 0 .. 15;
   Msg_Type : Natural  range 0 .. 255;
   Seq_Num  : Natural  range 0 .. 65_535;
end record;

for Packet use record
   Version  at 0 range 0 ..  3;
   Msg_Type at 0 range 4 .. 11;
   Seq_Num  at 0 range 12 .. 27;
end record;
```

This is not a comment, not a hint, and not an optimization opportunity. It is a binding description of how `Packet` exists in memory, and the compiler is obligated to produce object code consistent with it or reject the declaration.

### 1.2 Explicit semantics — bugs have nowhere to hide

Every operation in Ada has a named, specified meaning. Overloading resolution is strict; visibility rules are strict; elaboration order is specified; task creation is explicit; allocation is explicit. C and C++ inherited decades of implementation-defined, unspecified, and undefined behaviors. Ada inherited almost none. When two Ada compilers disagree about the meaning of a program, one of them is non-conforming — and in practice that happens far more rarely than the analogous C/C++ case because Ada validation was historically mandatory (see §1.6).

A practical corollary: when an Ada program goes wrong, the wrongness is almost always visible at the point it goes wrong. There is no equivalent of the signed-integer-overflow-is-UB story where a well-formed-looking program can silently delete an entire security check because the optimizer deduced a predicate was "impossible". Ada signed integer overflow, if checks are not suppressed, raises `Constraint_Error` at the exact expression that overflowed. SPARK goes a step further: the obligation is to prove the overflow cannot happen, ex ante, before the code runs.

### 1.3 No undefined behavior

C has roughly 200 undefined behaviors in the ISO standard. Ada has essentially none at the source level. The Ada Reference Manual speaks of *bounded errors* (the program may do one of several specified things), *erroneous execution* (limited to truly unavoidable situations, such as violating discriminant-dependent invariants via `Unchecked_Conversion`), and *implementation-defined* behavior — but it never says "anything can happen". This is the single largest semantic difference between Ada and C from a certification perspective: you can reason about an Ada program.

### 1.4 No implicit conversions

Ada refuses to convert between numeric types implicitly, even when the conversion would be lossless. An `Integer` is not an `Integer_16`, and you must write `Integer_16 (X)` to cross the boundary. This is tedious in the small, but in the large it surfaces exactly the places where a value crosses a type boundary — which is also where the units, semantics, and invariants change. In safety-critical reviews, these explicit conversion points are the places a reviewer looks first.

### 1.5 Runtime checks elided only with explicit pragmas

By default, Ada inserts runtime checks for range violations, array bounds, discriminant validity, null dereferences, and several more. These are the same checks that a bounds-checking tool would insert in C after the fact — except they are part of the language, not a debugging add-on. You can suppress them with `pragma Suppress`, and in SPARK you never suppress them; you prove them away. The contrast with C is sharp: in C the default is unchecked, and bounds checking is an aftermarket accessory you buy through valgrind, ASan, UBSan, or sanitizer instrumentation.

### 1.6 Mandatory validation — no compiler divergence

From 1983 through 1998 the US Department of Defense operated the Ada Compiler Validation Capability (ACVC), a mandatory test suite that every Ada compiler claiming conformance had to pass. The successor, the ACATS (Ada Conformity Assessment Test Suite), is still maintained by the Ada Conformity Assessment Authority (ACAA) and still operated as the official validation suite for Ada conformance. For most of Ada's history, if a compiler called itself an "Ada compiler" it had to have passed the test suite and been issued a certificate with an expiration date.

The practical consequence: Ada compilers did not drift. Code written for one validated compiler would compile and behave correctly on another validated compiler. This property is priceless in a safety-certification setting because the regulator needs to know that the object code has the semantics the source code implies. C and C++ have no analogous mandatory suite; GCC, Clang, MSVC, and the embedded compilers all differ in corners, and MISRA C exists partly to paper over this.

### 1.7 Cultural match

The final and hardest-to-quantify reason is cultural. Ada was designed for the US DoD's High Order Language Working Group by Jean Ichbiah's team at Honeywell-Bull under the Steelman requirements. The requirements document reads like the preamble to a regulatory regime: checkable interfaces, enforceable contracts, controlled access to low-level features, explicit concurrency. Ada came out of a culture where the cost of a bug was measured in lost lives and crashed spacecraft, not in lost CSS and restyled buttons. Industries with the same cost structure — avionics, nuclear, rail, defense, space — recognized Ada as "their kind of language" and built decades of practice, training, certification evidence, and institutional memory around it.

This matters because safety-critical software is not about writing code; it is about producing **certification evidence**. You must show the regulator that the code satisfies the requirements, that the tests exercise the code, that the compilers are qualified, that the targets are understood. Ada plus the standards built around it (DO-178C, EN 50128, IEC 61508 and friends) gives you a ready-made story the regulator has seen before.

---

## 2. Aerospace and Avionics

### 2.1 Boeing 777

The Boeing 777, which entered service in June 1995, is the aircraft most often cited as the Ada poster child in commercial aviation. The 777 was designed during the 1990-1994 Ada-Ascendant period at Boeing Commercial Airplanes, and a large portion of its onboard software was developed in Ada. Figures vary by source; the number most often cited is "about 70 percent" of the 777's onboard software, which included portions of:

- The **Primary Flight Computer (PFC)** — three triply-redundant channels built by GEC-Marconi Avionics (later BAE Systems) in Rochester, UK, using three different processor families (AMD 29050, Motorola 68040, Intel 80486) with three differently-compiled images of essentially the same Ada code. The dissimilar-hardware, dissimilar-compilation approach was adopted specifically to mitigate common-mode failures.
- The **Aircraft Information Management System (AIMS)** cabinets from Honeywell, which centralize Flight Management, displays, data acquisition, and maintenance into a partitioned architecture.
- The **Flight Management Computer (FMC)** — in Ada for the reasons that always apply to FMCs: the arithmetic is unforgiving, the units matter, and the lifecycle is measured in decades.

The 777's Ada story was a deliberate choice by Boeing based in part on the then-recent success of the A320 program at Airbus and the DoD's wider Ada mandate. The decision is documented in AdaLetters, the Ada Europe proceedings of the mid-1990s, and in NASA/ESA training material from the period.

### 2.2 Boeing 787 Dreamliner

The 787 marked a partial Boeing move away from Ada-only, toward a mixed-language architecture with Ada retained for the highest-criticality elements and C/C++ used elsewhere. The Common Core System (CCS) from GE Aviation's avionics business adopted the ARINC 653 partitioned operating environment — Integrity-178B from Green Hills Software in the 787 case — which can host Ada, C, or C++ modules in isolated partitions. The CCS approach, codified afterwards as IMA (Integrated Modular Avionics), made the Ada-vs-C choice a per-partition rather than per-aircraft decision. Flight-control-adjacent partitions remained disproportionately Ada; cabin, displays, and auxiliary systems migrated toward C/C++.

### 2.3 The Airbus fly-by-wire heritage

Airbus is the single biggest industrial consumer of Ada in the world. The A320 program, launched in 1984 and delivering the first revenue service in April 1988, introduced production fly-by-wire (FBW) to commercial aviation. The FBW flight control computers — ELAC, SEC, FAC — were all specified at the model level (SAO, then later SCADE) and implemented in Ada.

- **A320, A321, A319, A318** — first-generation FBW, Ada-based ELAC (ElevAtor and aileron Computer) and SEC (Spoiler and Elevator Computer) flight control code.
- **A330, A340** — a refined second-generation architecture, still Ada.
- **A380** — the double-decker "super-jumbo". Published figures cite approximately **2 million lines of Ada** in the A380 onboard software for the flight control computers, flight management, cabin pressurization, and related subsystems. The A380 has three primary flight control computers (PRIMs) and three secondary (SECs) from two different suppliers (Thales and GE Aviation) to provide dissimilar-redundancy, as on the 777 but with a different partitioning.
- **A350 XWB** — continues the Ada fly-by-wire tradition, with more of the non-critical logic migrated to model-based code generation via SCADE. The flight-control kernels are Ada.

Airbus's reliance on Ada is not an accident — it is a direct reflection of the French engineering tradition where Ada was enthusiastically adopted for defense and civil aerospace in the 1980s, backed by PROLOGIA, Alsys (Jean Ichbiah's own company, founded after the Ada design), and later AdaCore's French branch. Toulouse is arguably the world capital of industrial Ada.

### 2.4 Fighters and helicopters

- **Eurofighter Typhoon** (four-nation: UK, Germany, Italy, Spain) — flight control software, sensor fusion, and significant portions of the defensive aids sub-system are in Ada. First flight 1994, in service 2003.
- **Dassault Rafale** (France) — Ada in the Système de Navigation et d'Attaque, flight control, and mission computer.
- **Saab JAS 39 Gripen** (Sweden) — flight control, mission computer; Saab has been publicly enthusiastic about Ada for decades.
- **F-22 Raptor** — avionics in Ada (the program started in 1991 under the DoD mandate; the core avionics and radar signal processing are Ada-dominant).
- **F-35 Lightning II** — originally specified partly in Ada, but the program moved toward C++ under a 2005 Lockheed Martin decision, with Ada retained for specific partitions. The F-35 is the most-cited example of a US program that moved away from Ada; its delays and software difficulties are sometimes used in the opposite direction as an argument for having stayed with Ada.
- **NH Industries NH90** (Eurocopter/Airbus Helicopters) — medium transport helicopter, Ada used in core flight control.
- **Eurocopter Tiger / Tigre** — attack helicopter, mission computer and avionics in Ada.
- **AgustaWestland AW101 Merlin** — Ada used in mission computer.

### 2.5 Regional, business, and turboprop

- **Bombardier CRJ / Global Express** — Ada components in the flight management and display systems.
- **Embraer E-Jets** (E170/175/190/195) and **Phenom** business jets — Ada in flight control and FMS.
- **Dassault Falcon 7X** — digital FBW (a first for business jets) implemented with Ada.
- **ATR 42 / 72** — turboprops use Ada in avionics.

The cumulative picture is that a traveler in 2026 flying Boeing, Airbus, Embraer, Bombardier, or Dassault is, with very high probability, aboard an aircraft whose flight-critical loops are Ada. The Ada code in those fleets is older than most of the passengers.

---

## 3. Space Systems and the Ariane 5 Story

### 3.1 Ariane 4

Ariane 4 was ESA/Arianespace's workhorse launcher from 1988 to 2003. Its flight software was written in Ada (Ada 83). Over 116 flights, Ariane 4 achieved a success rate above 97 percent and became a commercial anchor for European space launch. The Inertial Reference System (SRI, *Système de Référence Inertielle*) was supplied by Aérospatiale and was the component at the heart of the famous Ariane 5 failure — but first, on Ariane 4, it simply worked.

### 3.2 The Ariane 5 Flight 501 failure — what actually happened

On 4 June 1996 at Kourou, French Guiana, Ariane 5's maiden flight (Flight 501) self-destructed 37 seconds after lift-off, destroying four Cluster science satellites and a half-billion dollars of hardware. It is probably the most famous software failure in history, and it is almost universally mis-reported. The actual sequence was:

1. The Inertial Reference System (SRI) was reused essentially unchanged from Ariane 4. Its software included an alignment function that continued to run for about 40 seconds after lift-off, even though on Ariane 5 it was not operationally needed after lift-off at all — a vestigial behavior from Ariane 4, where a last-minute hold could reuse the alignment data.
2. One of the SRI computations converted a 64-bit floating-point value — the horizontal bias (BH) — to a 16-bit signed integer. On Ariane 4, the numerical range of the trajectory made this conversion safe. On Ariane 5, the first-stage trajectory produced a much larger horizontal velocity, and the floating-point value exceeded the 32,767 limit of the 16-bit target.
3. The conversion was protected against overflow in four other places but **not** in this one; the protection had been removed because analysis of the Ariane 4 trajectory had shown the value stayed within range, and the team had decided to budget CPU on the 80C86 for other computations.
4. The conversion raised an Ada `Operand Error` exception at T+36.7 seconds. The exception was not caught locally. The SRI's run-time system handled it by **shutting down the processor** — which was the reasonable policy for a hardware fault but was catastrophic here because the fault was a software issue on correct hardware.
5. Both SRIs (primary and backup, with identical software) shut down within milliseconds of each other, sending diagnostic data on the data bus that the main computer interpreted as flight data. That "data" was garbage, showing a nose-down attitude of about 90 degrees, which caused the autopilot to command full nozzle deflection on the solid boosters.
6. The mechanical stresses caused the boosters to begin separating from the core. The range safety system destroyed the vehicle, as designed.

### 3.3 What the Lions inquiry report actually said

The inquiry was chaired by mathematician Jacques-Louis Lions (Collège de France) and issued its report on 19 July 1996. The report is short, technical, and devastatingly clear. Its main conclusions were:

- The failure was caused by **specification and validation errors**, not by a software implementation error.
- The Ariane 4 SRI code was reused on Ariane 5 without re-analyzing the trajectory envelope or re-running the validation suite with Ariane 5 flight data.
- The alignment function that produced the overflow was **not needed at all** after lift-off on Ariane 5 — it was vestigial code.
- The decision to not protect that particular conversion was made on Ariane 4 based on trajectory analysis that was never revisited for Ariane 5.
- The run-time exception policy of shutting down the processor on an unhandled Operand_Error was appropriate for a hardware-fault scenario but inappropriate for a software-cause scenario.
- The test bench used to validate the SRI did not include Ariane 5 flight data; there had been a management decision not to include it because the SRI was "qualified" by its Ariane 4 heritage.

The report did **not** say Ada was the cause. It did not criticize the language. It explicitly noted that the exception was correctly detected by the Ada runtime and the correct action was for the application code to catch and handle it. The report's recommendations focused on: testing with realistic flight data, re-examining reused code in its new environment, providing a backup capable of continuing in the presence of software faults, and improving the qualification process.

In the tech press, the failure was widely reported as "an Ada exception crashed the rocket". This reading is almost exactly backwards: the Ada runtime did its job by raising and propagating the exception; the failure was in requirements engineering, reuse analysis, and validation, all of which are activities that happen before any line of code is written.

### 3.4 Ariane 5 post-501

After the Flight 501 failure the SRI code was modified — the offending conversion was removed, the alignment function was disabled after lift-off as originally intended — and Ariane 5 went on to fly 117 successful missions over the next 27 years. The last Ariane 5 flight (VA261) launched on 5 July 2023, carrying two commercial communication satellites. Over its service life Ariane 5 became the most reliable heavy-lift launcher in commercial service. Not bad for a rocket whose maiden flight became the world's most-cited software horror story.

### 3.5 Other ESA launchers

- **Vega** (ESA/Avio) — small solid-fuel launcher, Ada-based flight software, first flight 2012.
- **Vega C** — upgraded variant, same Ada heritage.
- **Ariane 6** — successor to Ariane 5, first flight 9 July 2024. The flight software is Ada and SPARK, with increased use of SPARK for the most critical subsystems.

### 3.6 Robotic arms and rover missions

- **ISS Canadarm2** (Mobile Servicing System, Canadian Space Agency/MDA) — Ada in the control software for the Space Station Remote Manipulator System.
- **NASA Mars rovers** — Pathfinder's Sojourner (1997) used Ada tasking; Spirit/Opportunity (MER, 2004) used a mix with VxWorks/Wind River, with Ada components; Curiosity (MSL, 2012) and Perseverance (M2020, 2021) continued multi-language stacks with Ada in key subsystems and C for others.
- **NASA Cassini** — Saturn mission, launched 1997, used Ada for significant portions of the spacecraft software.
- **Galileo** — Jupiter mission, launched 1989, Ada in parts of the spacecraft CDS.
- **ESA Rosetta/Philae** — comet lander, Ada in flight software.
- **ESA ExoMars** (2016 Trace Gas Orbiter, 2028 Rosalind Franklin rover) — Ada in ExoMars spacecraft software, built by Thales Alenia Space.

### 3.7 Satellite ground control

The ground-segment software for ESA missions (ESA SCOS-2000, EGOS-MCS) contains substantial Ada in the command and telemetry processing, mission planning, and data-archival layers. Eumetsat's Meteosat ground segment, CNES mission operations at Toulouse, and the Italian ASI mission control systems all have Ada roots.

---

## 4. Railways and Signaling

Rail is the second industry where Ada is dominant, and in the EU it is probably the single most important driver of new Ada work today. The reason is EN 50128 (see §11) and the safety culture it encodes.

### 4.1 Paris Métro Line 14 — the first driverless line

Line 14 (Météor) opened in 1998 as the first fully automated driverless line on the Paris Métro. Its signaling and train control system, built by Matra Transport (later acquired by Siemens Mobility) under the name **SAET-METEOR**, was developed in Ada and in Atelier B (for the B-Method formal specification parts). The line has carried well over a billion passengers with no signaling-caused safety incident. It is the longest-running proof that formally developed, Ada-based transit control can run a major urban line for decades.

### 4.2 London Underground and DLR

- **Docklands Light Railway (DLR)** — driverless from its 1987 opening, the DLR's Automatic Train Control system has been renewed multiple times, and its ATC software is Ada-based (supplied historically by GEC/Alstom and Thales).
- **Jubilee Line Extension Stratford to Canary Wharf** — the JLE introduced automatic train operation on the London Underground, with the signaling system developed in Ada.
- **Central Line resignalling**, **Northern Line resignalling**, and later **Sub-Surface Railway** upgrades — Ada-based train control software from Westinghouse Rail Systems (now Siemens Mobility) and Invensys Rail.
- **Thameslink** — ETCS Level 2 overlay with ATO, Ada portions.

### 4.3 TGV, ICE, and ETCS

- **TGV Atlantique, TGV Réseau, TGV Duplex** — the TVM-430 automatic train protection system, which enables 300-320 km/h operation on the French LGV network, has Ada roots. Developed originally by Alsthom CSEE.
- **ICE** (Germany) — LZB and ETCS signaling portions are Ada-based in several tenders.
- **Eurotunnel** — the rolling stock control and signaling systems for the Channel Tunnel use Ada in safety-relevant portions.
- **ETCS (European Train Control System)** — the EU's unified signaling standard. Multiple ETCS implementations from Alstom, Siemens, Hitachi Rail (Ansaldo), Thales, and Bombardier (now Alstom) use Ada for the onboard and trackside safety logic. ETCS Level 2 and Level 3 are being rolled out across Europe, and a disproportionate share of that rollout is Ada work.

### 4.4 Shinkansen and Japanese rail

Parts of the Shinkansen digital ATC (D-ATC and DS-ATC) systems operated by JR East and JR West have Ada components, although Japanese rail is more heterogeneous linguistically than the European market.

### 4.5 Fully automated metros

The "driverless metro" is a category where Ada is almost a default:

- **Copenhagen Metro** (opened 2002, extended 2019) — Ansaldo STS (now Hitachi Rail STS), Ada-based.
- **Singapore MRT North East Line**, **Circle Line**, **Downtown Line**, **Thomson-East Coast Line** — driverless, Ada-based signaling from Alstom and Thales.
- **Barcelona L9/L10** — driverless, Ada-based Alstom system.
- **Rome Metro Line C**, **Milan M5** — driverless, Hitachi Rail STS, Ada.
- **Lyon Metro Line D**, **Toulouse Metro** — driverless, Siemens, Ada.
- **Dubai Metro** — driverless, Mitsubishi Heavy Industries/Thales system with Ada portions.
- **Vancouver SkyTrain** — Bombardier (now Alstom) CITYFLO, Ada in the ATC.

---

## 5. Air Traffic Control

### 5.1 NAV CANADA CAATS

The Canadian Automated Air Traffic System (CAATS) was a NAV CANADA program to replace aging ATC systems across Canada. It was developed primarily in Ada and deployed in stages from the late 1990s onward. CAATS is one of the most-cited examples of a large Ada air traffic control system in daily operational use.

### 5.2 iFACTS at NATS, UK

**iFACTS (Interim Future Area Control Tools Support)** is the tool support system developed by Altran Praxis (as was; now Capgemini Engineering) for National Air Traffic Services (NATS) in the UK. iFACTS provides medium-term conflict detection, trajectory prediction, and controller tools for Swanwick en-route control. It is heavily SPARK. The iFACTS program is one of the most influential SPARK industrial references — the widely-cited Praxis claim of significantly improved productivity and defect rates on iFACTS was a major driver of SPARK's credibility in the 2000s.

### 5.3 DFS P1 / VAFORIT

Deutsche Flugsicherung (German ATC) operates the **P1** centre system for upper airspace, and the **VAFORIT** ("Very Advanced FDP Operational Requirement Implementation") system at Karlsruhe Upper Area Control Centre. Significant Ada usage.

### 5.4 Eurocat and Thales ATM

The Thales Eurocat family (now TopSky-ATC) is the most widely deployed ATM platform in the world, used by many ANSPs. Its history includes significant Ada components, particularly in the flight data processing and radar data processing subsystems.

### 5.5 Italian SELEX-ES / Leonardo ATM

Leonardo's Selex-ES division (formerly Finmeccanica) supplies ATM systems to Italy's ENAV and to export customers. Ada is used in the safety-critical layers.

---

## 6. Defense

Ada was, historically, the DoD mandate language (Public Law 101-511 Section 8092, 1991), and even after the mandate was lifted in 1997 the mass of Ada code in the defense world is enormous. A partial list:

### 6.1 Naval combat management

- **UK Royal Navy Type 23 frigates** (SSCS) — Ada in combat management system.
- **Type 45 destroyers** (CMS-1, later combined with BAE's CMS) — Ada.
- **Queen Elizabeth-class aircraft carriers** — CMS is Ada-heavy.
- **Astute-class submarines** — Ada in the combat system and tactical processing.
- **Marine Nationale Horizon frigates** and **FREMM frigates** — DCNS/Naval Group combat management, Ada.
- **German F124 Sachsen-class frigates** — combat management system, Ada.
- **Italian Horizon-class destroyers** — same family, Ada.
- **Dutch De Zeven Provinciën-class frigates** — Thales Nederland, Ada.
- **Australian Hobart-class destroyers** — Ada via Lockheed Martin's Aegis-derived combat system.
- **US Navy Aegis Weapon System** — historically Ada (CMS-2 and Ada); ongoing modernization has mixed languages.

### 6.2 Missile defense and surface-to-air

- **Aster 15 / Aster 30** (MBDA, used by France, Italy, UK) — Ada in the missile fire-control.
- **MEADS** (Medium Extended Air Defense System, US-Germany-Italy consortium) — Ada.
- **SAMP/T** — Aster-30 ground-based system, Ada.
- **SCALP / Storm Shadow** cruise missile (MBDA) — Ada in the mission planning and flight control.
- **Exocet** (MBDA) — Ada in modern variants.
- **Patriot PAC-2 / PAC-3** (Raytheon) — Ada in significant portions; Patriot famously had a clock-drift software bug in 1991 (Dhahran incident) that killed 28 US soldiers. The bug was in the target track updating, not in Ada itself — it was an accumulated floating-point rounding error from an integer counter multiplied by an imprecise binary approximation of 0.1. The Patriot story is often (incorrectly) invoked as an Ada failure; it was a requirements and build-cycle failure, fixed by deploying a patch that had been shipped but not installed.

### 6.3 Radar and sensor fusion

- **GAP filler / Air surveillance** radars from Thales (Ground Master family) and Leonardo (Kronos family) — Ada in signal-processing orchestration and tracking.
- **E-3 Sentry AWACS** modernization programs — Ada in mission computer and display.
- **Saab Erieye** airborne early warning — Ada.

### 6.4 Command and control

- **NATO ACCS** (Air Command and Control System) — a multi-decade program with significant Ada.
- **MILSTAR, AEHF** ground segments — Ada.
- **US Army ATCCS family** (Advanced Field Artillery Tactical Data System, Maneuver Control System) — historical Ada, modernized.
- **French Marine Nationale SENIT** naval tactical data systems — Ada.
- **UK Bowman** tactical communications — Ada in parts.

### 6.5 Why the defense stack is "sticky"

Defense programs have lifetimes of 30-50 years. A fighter platform designed in the 1990s in Ada (Typhoon, Rafale, Gripen) is still being upgraded and fielded in new variants in the 2020s; those upgrades are overwhelmingly in Ada because re-certifying a different language across a flight-safety envelope is economically unattractive. The customers who lived through the Ada mandate era also internalized why the mandate existed, and they continued to specify Ada contractually even after the DoD dropped it as a blanket rule.

---

## 7. Medical Devices

Medical devices are the industry where Ada penetration is lower than it should be, and the reason is historical — the software was written in C before the regulatory framework caught up — but the post-Therac-25 culture shift created genuine niches where Ada appears.

### 7.1 The Therac-25 lesson

The Therac-25 radiation therapy machines (Atomic Energy of Canada Limited, 1983-1987) killed at least three patients and severely injured several more through massive overdoses. The software, written in PDP-11 assembly, had race conditions between the operator console and the machine control, combined with reused code from the earlier Therac-20 that had relied on hardware interlocks subsequently removed. Nancy Leveson's investigation (published 1993) is a canonical case study of software safety failure and is discussed in every graduate software engineering course.

The Therac-25 disaster drove a regulatory and cultural shift toward formal methods and safer languages in radiation oncology. Later radiation therapy systems from Varian, Elekta, and Siemens Healthineers have incorporated Ada in some control loops, alongside more rigorous requirements engineering.

### 7.2 Infusion pumps

The FDA's Infusion Pump Improvement Initiative (2010-) followed years of preventable injuries and deaths from infusion pump software defects. The FDA "Generic Infusion Pump" reference model, developed with the University of Pennsylvania, used formal methods to establish baseline safety properties. Several commercial infusion pump programs adopted SPARK or Ada+CodePeer workflows as a consequence.

### 7.3 Pacemakers and ICDs

A small but real fraction of pacemaker and ICD software is Ada — the reason, again, is auditability: cardiac rhythm management devices are FDA Class III devices with implantable lifetime risks, and the regulatory environment rewards languages where the static properties can be demonstrated.

### 7.4 Surgical robots

Intuitive Surgical's da Vinci system is famously closed, but publicly discussed surgical robot programs from other vendors (including research projects at Johns Hopkins, DLR, and King's College London) have used Ada or SPARK for the safety-kernel separation in the control architecture.

### 7.5 IEC 62304 and medical device software

IEC 62304 defines the software lifecycle for medical device software. It assigns software safety classes (Class A/B/C) and prescribes lifecycle activities proportional to the class. Class C software (death or serious injury possible) is the region where Ada and SPARK are most attractive because the evidence burden is highest.

---

## 8. Nuclear Instrumentation and Control

### 8.1 Reactor protection systems

Nuclear I&C is divided into "classified" (safety-related, subject to IEC 61513 and category A/B/C classifications) and "non-classified" (operational). Category A software — reactor trip, emergency core cooling activation, containment isolation — has the highest evidence burden and is where Ada and formal methods shine.

- **Westinghouse Common Q** platform — used in several reactor protection systems.
- **Framatome (now Framatome) TELEPERM XS (TXS)** — one of the most widely deployed category A nuclear I&C platforms in Europe and Asia; Ada in significant portions, plus extensive formal validation.
- **Areva / Framatome SPINLINE** — earlier French nuclear protection system.
- **Rolls-Royce Spinline** — same family for UK reactors.

### 8.2 CANDU reactor I&C

Canadian CANDU reactors (AECL, now Candu Energy Inc. under SNC-Lavalin) have I&C systems with significant Ada content, dating to the 1980s and updated through later refurbishments. The OPG (Ontario Power Generation) Darlington refurbishment in the 2010s was one of the largest I&C modernization projects in the world.

### 8.3 Why nuclear loves Ada's determinism

Nuclear I&C has three characteristic requirements that line up with Ada:

1. **Determinism** — trip logic must execute in a bounded, predictable time; no garbage collection, no demand paging, no non-deterministic scheduling.
2. **Auditability** — regulators must be able to read the source and follow the data and control flow from the requirements through to the code and back to the test cases.
3. **Simplicity** — the I&C systems deliberately use a restricted subset of the language (typically Ravenscar or equivalent, see §13.6) to make verification tractable.

Ada, especially in the SPARK and Ravenscar profiles, is an exact match.

---

## 9. Automotive

Automotive is the safety-critical industry where Ada lost the default. The reason is economic: automotive volumes are enormous, supplier cost pressure is brutal, and the dominant languages (C, then C++, with MISRA-C as the discipline veneer) have a much larger labor pool. AUTOSAR Classic and AUTOSAR Adaptive codified this: AUTOSAR Classic is C-based with a tightly constrained runtime; AUTOSAR Adaptive is C++14-based.

Ada nevertheless appears in automotive niches:

- **Bosch** has used Ada in some brake and stability control development.
- **Some European OEMs** (Volvo, historically BMW) have run Ada and SPARK evaluations for ABS, ESC, and powertrain control.
- **People-mover and monorail systems** (airport shuttles, PRT systems) derived from rail-signaling suppliers are Ada-based, which technically makes them "automotive-ish".
- **Autonomous driving research projects** — AdaCore has published on several autonomous vehicle proof-of-concepts using SPARK for the perception-to-actuation safety kernel, with the idea that a small, formally-verified SPARK kernel can act as a safety monitor around a larger C++/Rust stack.
- **Electric powertrain** — a few EV BMS (battery management) projects experimented with Ada; Vector Informatik has publications on the comparison.

### 9.1 ISO 26262 and SPARK

ISO 26262 is the automotive functional safety standard. Its ASIL D classification (the highest) invites formal methods in the same way DO-178C DAL A does. SPARK has been evaluated and used for ASIL D development, though the dominant ISO 26262 workflow is still MISRA-C or MISRA-C++ with static analysis.

---

## 10. Financial Systems

Ada in finance is rare but real, and the attraction is always the same: the fixed-point decimal type.

Ada has a native `delta` fixed-point type with controlled rounding and optional decimal semantics:

```ada
type Money is delta 0.01 digits 15;      -- USD cents, up to 15 significant digits
type Rate  is delta 0.000_001 digits 10; -- interest rate, 6 decimal places

Balance : Money := 1_234_567.89;
```

Decimal fixed-point is essential in currency computation because IEEE-754 binary floating-point cannot exactly represent 0.10, which leads to rounding errors that compound into audit disputes. C and C++ have no standard decimal type (C23 adds optional `_Decimal32/64/128`, but adoption is slow). Ada has had it since 1983.

Known financial-sector Ada uses include portions of the **London Stock Exchange TradElect** system (retired 2011, replaced by Linux-based Millennium Exchange), some **clearing and settlement systems** at European central counterparties, and a handful of **bank back-office** programs. This is a rumor-rich area because financial-industry software is rarely discussed in public.

---

## 11. Certification Standards Where Ada and SPARK Shine

Safety-critical software is sold against standards, not against taste. The relevant standards map directly to Ada's strengths.

### 11.1 DO-178C and DO-333

**DO-178C** (published 2011, replacing DO-178B from 1992) is the FAA/EASA standard for airborne software. It defines five Design Assurance Levels (DALs):

- **DAL A** — catastrophic failure possible (loss of aircraft). Highest evidence burden.
- **DAL B** — hazardous.
- **DAL C** — major.
- **DAL D** — minor.
- **DAL E** — no effect.

DAL A software must satisfy MC/DC (Modified Condition/Decision Coverage) plus every other objective in the standard. DO-178C came with four technology supplements, one of which — **DO-333, the Formal Methods Supplement** — explicitly authorizes the use of formal verification to satisfy objectives that would otherwise require test. SPARK's GNATprove is one of the few production formal-methods tools qualified against DO-333 in real aircraft programs. The combination **Ada + SPARK + DO-178C + DO-333** is the most mature formal-verification-for-certification stack that exists.

### 11.2 DO-254

The hardware counterpart, **DO-254**, covers complex electronic hardware (FPGAs, ASICs) in aircraft. Ada is not the primary language here (VHDL and SystemVerilog dominate) but the certification philosophy is the same — evidence, traceability, qualified tools.

### 11.3 IEC 61508

**IEC 61508** is the general-purpose functional safety standard from which most domain-specific standards are derived. It defines four Safety Integrity Levels (SIL 1-4). SPARK is explicitly recommended in IEC 61508-3 Annex F for SIL 3 and SIL 4 software.

### 11.4 EN 50128

**EN 50128** is the railway software standard, derived from IEC 61508. It defines Software Safety Integrity Levels (SSIL 0-4) and **explicitly lists SPARK** as a recommended technique for SSIL 3 and SSIL 4. This is one of the very few standards that calls out a specific tool or language family by name. It is why SPARK has such a strong foothold in European rail signaling.

### 11.5 IEC 61513

**IEC 61513** is the nuclear I&C standard (derived from IEC 61508). Category A software maps to SIL 3/4 and is subject to the full weight of formal-method-friendly techniques.

### 11.6 ISO 26262

**ISO 26262** is the automotive functional safety standard. ASIL A/B/C/D is the classification; ASIL D is the highest. SPARK is viable at ASIL D and has been used in several published proofs-of-concept, but the volume is much smaller than in aerospace or rail.

### 11.7 IEC 62304

**IEC 62304** is the medical device software standard. Class C software (death or serious injury) benefits from formal verification, and SPARK is in the tool kit.

### 11.8 Common Criteria

**Common Criteria** (ISO/IEC 15408) defines Evaluation Assurance Levels (EAL) from 1 to 7 for security. **EAL 5+ and EAL 6 require semi-formal specification and design; EAL 7 requires formal specification and verification.** At EAL 6-7 the list of viable technologies is short, and SPARK is on every version of that list. The **Tokeneer** project (see §16) is a reference EAL 5 SPARK deliverable.

### 11.9 MISRA parallels

**MISRA C** and **MISRA C++** are coding standard subsets for automotive C/C++ designed to ban the parts of the language that are undefined, implementation-defined, or easily mis-used. Ada needs very little of this: most MISRA rules have no Ada analogue because the underlying hazard does not exist in Ada (no implicit conversions, no undefined behavior, no arithmetic on pointers, explicit parameter modes, etc.). The *Ada Quality and Style Guide* (SPC-94093-CMC) and AdaCore's *GNAT Coding Style* serve the analogous role.

---

## 12. SPARK: Origin, Evolution, and Philosophy

### 12.1 What SPARK is

SPARK is a subset of Ada designed to be amenable to sound static analysis and formal verification. It is not a different language; SPARK programs are Ada programs that additionally obey certain rules (no aliasing via pointers, mandatory data and information flow annotations, stronger purity rules for functions) and that carry **contracts** — preconditions, postconditions, invariants, and loop invariants — rich enough for an automated prover to reason about them.

The point of SPARK is to move classes of defect from "find by testing" to "prove absent by analysis". The four canonical classes of defect SPARK addresses are:

1. **Data flow errors** — uninitialized variables, unused variables, dead code.
2. **Information flow errors** — hidden dependencies, e.g., an output of a procedure depending on a global it was never declared to read.
3. **Run-time errors** (AoRTE, Absence of Run-Time Errors) — overflow, range violations, array bounds, division by zero, null dereferences, stack exhaustion.
4. **Functional correctness** — the code meets its specification as expressed in contracts.

### 12.2 Origin — Bernard Carré and PVL

SPARK was invented in the mid-1980s by **Bernard Carré** and colleagues at the University of Southampton, UK. Carré's research group had been working on static analysis tools for imperative languages since the 1970s (the SPADE toolkit). When Ada 83 was published, the group recognized it as a far better foundation for static analysis than Pascal, Modula-2, or C — but still needed to restrict it and annotate it to make sound automated reasoning tractable. The first SPARK subset was defined in 1987, with annotations carried in Ada comments (`--# derives`, `--# pre`, `--# post`) so that SPARK programs remained compilable by any Ada compiler.

The name "SPARK" is often back-formed to "**S**oftware **P**rograms **A**dopted for **R**igorous **K**nowledge" or similar, but the origin is informal and not a meaningful acronym. Barnes's book comments that the name was chosen because it was short and evoked reliability, not because it abbreviated a phrase.

### 12.3 From PVL to Praxis to Altran to AdaCore

The tool was commercialized by **Program Validation Limited (PVL)**, a spinout from Southampton, in the late 1980s. PVL merged into **Praxis Critical Systems** (Bath, UK) in the early 1990s. Praxis became **Praxis High Integrity Systems** and then **Altran Praxis** after Altran acquired Praxis in 2007. In 2009-2010, AdaCore and Altran Praxis formed a **joint development** partnership for SPARK 2014, and in 2013 AdaCore took over SPARK development completely, later hiring key Altran Praxis staff including Rod Chapman and Yannick Moy. Altran Praxis itself was renamed Altran UK and then absorbed into Capgemini Engineering when Capgemini bought Altran in 2020.

This lineage matters because each version of SPARK reflected the priorities of its owners at the time, and SPARK 2014 is a bigger break from earlier SPARK than any of the intermediate revisions because it integrated with Ada 2012's native contract aspects and replaced the comment-based annotation syntax.

### 12.4 SPARK versions in chronological order

- **SPARK 83 (1987)** — subset of Ada 83. Annotations in comments. SPADE-style analysis.
- **SPARK 95 (1996-97)** — subset of Ada 95. Still comment annotations. Extended to handle child packages and hierarchical libraries.
- **SPARK 2005** — subset of Ada 2005. Comment annotations; added support for some Ada 2005 features but still conservative about inheritance and access types.
- **SPARK 2014** — the big rewrite. Adopted as the current version in 2014, tracks Ada 2012/2022.
  - Uses Ada 2012 contract aspects (`Pre`, `Post`, `Global`, `Depends`, `Contract_Cases`) — no more `--#` comments.
  - Backed by GNATprove, a new front-end-to-SMT-solver pipeline built on GNAT.
  - Allows more of Ada: some controlled objects, some access types (with restrictions), container libraries.
- **SPARK 2020+** — ongoing improvements to pointer and ownership support (inspired by Rust), parallelism support, better counterexample reporting, more Why3/SMT backend robustness. The AdaCore SPARK team releases yearly improvements aligned with GNAT Pro releases.

### 12.5 SPARK Pro vs SPARK Community vs SPARK in FSF GCC

- **SPARK Pro** — the commercial, supported product from AdaCore. Ships with qualified tooling for DO-178C and EN 50128 projects.
- **SPARK Community Edition** — free, self-supported release, historically available at libre.adacore.com and now via Alire. Identical to SPARK Pro in essential capability but without the qualification kits.
- **FSF GNAT with GNATprove** — SPARK is upstreamed partially into the FSF GCC source tree; some distributions ship a usable SPARK toolchain via `gnat` and `gnat-spark` packages.

### 12.6 Philosophy: correct by construction

The core philosophy is not "write code, then prove it correct" — that is unrealistic — but "write code in a style where proving it correct is possible, and where the proof discipline influences the shape of the code". In practice a SPARK developer:

1. Writes the package specification with public types and subprogram contracts.
2. Runs GNATprove in **flow analysis** mode early, even before the body is complete, to catch interface mistakes.
3. Writes the body, adding the contracts as they go.
4. Runs GNATprove in **proof** mode to discharge verification conditions.
5. For VCs that don't prove automatically, adds loop invariants, ghost variables, lemma procedures, or tightens the contracts.
6. Iterates until the code is fully proved at the chosen assurance level.

This workflow is fundamentally different from a TDD workflow: you are not writing tests that pass, you are writing contracts that the prover can discharge.

### 12.7 Assurance levels: Stone, Bronze, Silver, Gold, Platinum

AdaCore formalized the incremental-adoption story with five named levels (the names come from the SPARK User's Guide; Platinum was added later):

- **Stone** — valid SPARK code that simply compiles with the SPARK profile enabled. Buys you nothing except the guarantee that you're not using features SPARK can't analyze.
- **Bronze** — flow analysis passes. No uninitialized reads, no unused variables, no information flow leaks. This level catches a surprising share of real defects in real code.
- **Silver** — AoRTE proved. No run-time errors are possible. This is the level most SPARK projects aim at for broad adoption because it removes the entire class of "unexpected exception" failures.
- **Gold** — key functional properties proved via `Pre`/`Post` contracts. You pick the properties that matter (e.g., "the priority queue is always sorted", "the buffer is never modified while locked"), and GNATprove discharges them.
- **Platinum** — full functional correctness. Every contract in the specification is satisfied, and the specification captures the full intended behavior. Rare in practice because the cost is high, but achieved in projects like MULTOS, Tokeneer, and IRONSIDES.

The Stone-to-Platinum ladder is one of the most effective presentations of SPARK because it lets an organization start by paying pennies and get real safety value immediately, then climb the ladder only where the evidence burden justifies it.

---

## 13. What SPARK 2014 Restricts

SPARK is obtained from Ada by excluding features that would make sound automated analysis intractable, and by strengthening rules around features that are kept.

### 13.1 No unconstrained aliasing

SPARK originally banned access types (pointers) entirely. This was because aliasing — two names for the same memory — breaks the sort of local reasoning an SMT solver needs to do efficiently. If `X.all := 1;` could affect `Y.all` because `X` and `Y` might point to the same cell, then every assignment is potentially a global event.

Modern SPARK (2020+) re-introduces access types under an **ownership discipline** directly inspired by Rust's borrow checker: each pointer has a unique owner, and "borrows" are tracked to make sure the owner does not write through the original pointer while a borrow is outstanding. The rules are strict (no shared-mutable aliasing), but they enable heap-allocated linked lists, trees, and dynamically-sized buffers in SPARK code.

### 13.2 No (or limited) exceptions

Historical SPARK banned exceptions entirely. The logic was that the exception mechanism effectively adds an implicit control-flow edge from every possibly-raising operation to every active handler, and the prover would have to chase all of them. Since SPARK proves runtime errors absent anyway, the exception mechanism is largely unnecessary.

Modern SPARK allows a limited use of exceptions with contract annotations (`Exceptional_Cases`) that specify which exceptions a subprogram may propagate under which preconditions. This is used sparingly, and the discipline is to prove the exception *cannot* be raised unless the precondition explicitly allows it.

### 13.3 No side effects in functions

In Ada a function can have side effects, though it's discouraged. In SPARK, functions must be **pure**: no writes to out or in-out parameters, no writes to global state, no exceptions. Expressions containing function calls then behave as if they denote mathematical values, which is what the prover needs to substitute them into formulas.

Procedures can have side effects, but they must declare them via `Global` and `Depends` annotations.

### 13.4 Globals must be declared

Every procedure (and every function that reads globals) must declare its dependencies on non-local state:

```ada
procedure Step (Dt : Duration)
  with Global => (Input  => Sensor.Current_Value,
                  In_Out => (State, Log));
```

This buys the prover two things: (a) it knows exactly which globals a call might touch, which dramatically shrinks the reasoning cone, and (b) it catches the class of "I forgot to mention that this subprogram also updates the status register" bug that plagues large imperative codebases.

### 13.5 Contracts on anything you care about

```ada
procedure Pop (S : in out Stack; X : out Item)
  with Pre  => not Is_Empty (S),
       Post => Is_Empty (S) = (Count'Old = 1)
               and then Count = Count'Old - 1,
       Depends => (S => S, X => S);
```

The `'Old` attribute refers to the value of an expression on entry to the procedure, and is the usual way to state "the count decreased by one".

### 13.6 Concurrency — Ravenscar and Jorvik

SPARK requires a restricted tasking model because general tasking (task rendezvous, dynamic priorities, abort statements) is essentially unprovable. The restricted model is **Ravenscar** (named after the village near Whitby in North Yorkshire where the 1997 Ada Rapporteur Group meeting that defined it took place), formally `pragma Profile (Ravenscar)`.

Ravenscar forbids:
- Dynamic task creation after elaboration
- Multiple entries per task
- Requeue
- Abort
- Task entry parameters
- Select statements
- Dynamic priorities

and requires fixed-priority preemptive scheduling with a single-reader-single-writer protected object model. This is a model that can be analyzed for schedulability with classical real-time theory (RMS, DMS), and is the default profile for Ada in avionics and rail.

Ravenscar was extended in 2020 as the **Jorvik profile** (`pragma Profile (Jorvik)`, named after York's Viking-era name), which relaxes some restrictions while staying in a statically analyzable subset.

SPARK supports both Ravenscar and Jorvik for the concurrency parts of a program, and also supports sequential programs that never use tasking at all.

---

## 14. What SPARK 2014 Proves

### 14.1 Flow analysis

Flow analysis is cheap, fast, and 100 percent automatic. It catches:

- **Use of uninitialized variables** — any read of a variable that might not have been written is a flow error.
- **Dead code** — statements unreachable from the entry point of the subprogram.
- **Unused variables / parameters** — a value that is set and never read is flagged.
- **Aliasing** — if two `out` or `in out` parameters might refer to the same object, SPARK rejects the call.
- **Mismatched `Global` / `Depends`** — if the code reads a global not declared in `Global`, flow analysis catches it.
- **Information leaks** — if the code writes a secret into a public output, flow analysis catches it (given the appropriate annotations).

Flow analysis is what you get at the **Bronze** level of the ladder. Running it over legacy Ada code typically finds real bugs.

### 14.2 Absence of runtime errors (AoRTE)

AoRTE proof discharges verification conditions for every operation that could raise a predefined Ada exception:

- `Constraint_Error` from integer overflow, range checks, array bounds, discriminant checks, division by zero, tag checks.
- `Program_Error` from elaboration order, access-to-subprogram mismatches.
- `Storage_Error` from stack overflow, heap exhaustion.

A successful AoRTE proof means the program cannot raise any of these exceptions at runtime given any inputs satisfying the preconditions. This is a strong safety guarantee: entire classes of failure just disappear.

### 14.3 Contract satisfaction

The user writes `Pre` and `Post` contracts (and optionally `Contract_Cases`), and GNATprove shows that:

- Every call site satisfies the callee's precondition.
- Every exit point of a procedure satisfies its postcondition.
- Loop invariants are maintained across iterations.
- Type invariants and predicates are preserved.

### 14.4 Functional correctness

At the top of the ladder, the `Post` contracts are strong enough to describe the *entire* intended behavior of the subprogram, and GNATprove proves that the implementation matches. This requires writing the specification in a form the prover can reason about, which is where ghost code, theorems, and lemma procedures come in.

### 14.5 What SPARK does not prove

SPARK does not prove:

- **Termination** — by default. You can add `Subprogram_Variant` and `Loop_Variant` to ask the prover to show termination, but it's opt-in.
- **Real-time properties** — WCET (worst-case execution time) analysis is done separately, typically with tools like AbsInt aiT or Rapita Systems RVS.
- **Platform compliance** — if the compiler or runtime is buggy, SPARK cannot catch it. For that you qualify the toolchain (see DO-178C tool qualification).
- **Properties outside the contract** — the proof is only as strong as what you wrote in the `Post`.

---

## 15. How SPARK Proofs Work Under the Hood

### 15.1 The pipeline

```
  Ada/SPARK source
        |
        v
     GNAT front end (parsing, name resolution, semantic check)
        |
        v
  Frontend in SPARK mode (SPARK-legality checks, flow analysis)
        |
        v
     Why3 intermediate representation (WhyML)
        |
        v
  Verification condition generator
        |
        v
   SMT solvers: Alt-Ergo, CVC4/CVC5, Z3
        |
        v
        Discharge report (proved / unproved VCs)
```

GNATprove is implemented as a front end that reuses GNAT's parser and semantic analysis, translates SPARK code to **Why3** (a deductive verification platform developed at INRIA Saclay), generates verification conditions from the contracts and the code, and dispatches them to SMT (Satisfiability Modulo Theories) solvers.

### 15.2 Why3 as the intermediate language

Why3 is a research verification platform maintained by Jean-Christophe Filliâtre, Claude Marché, and colleagues at INRIA. It provides a logical language (WhyML) that can be translated to many backend solvers — SMT solvers, interactive theorem provers like Coq and Isabelle, and automated first-order provers. SPARK uses Why3 as its compilation target for the verification conditions, which is why SPARK can ride whatever new solvers come out of the SMT research community.

### 15.3 SMT solvers

The three solvers SPARK typically dispatches to are:

- **Alt-Ergo** — developed originally at INRIA, now maintained by OCamlPro. Designed for program verification; strong on linear arithmetic.
- **CVC4 / CVC5** — from Stanford/NYU/Iowa. General-purpose SMT solver; strong on theories of arrays, strings, bitvectors.
- **Z3** — from Microsoft Research. General-purpose, very fast, strong on bitvectors and nonlinear arithmetic.

GNATprove runs multiple solvers in parallel and accepts the first proof. Different solvers succeed on different VCs, which is why the portfolio approach works.

### 15.4 The levels switch

`gnatprove --level=N` controls how hard the prover tries. Higher levels give the solvers more time, try more tactics, and apply more rewrites. A typical workflow starts at `--level=0` for a quick pass and escalates to `--level=4` for the final push. Levels are about tactic selection and timeout, not soundness.

### 15.5 Counterexamples

When a VC fails, SPARK returns the failing conditions and, if the solver supports it, a counterexample — concrete values of the inputs that violate the contract. This is one of the most practically useful features: instead of being told "property not proved", you get "the property fails when `X = 2_147_483_647` and `Y = 1`, causing `X + Y` to overflow".

### 15.6 Ghost code and lemma procedures

When automatic proof cannot close a VC, the developer adds **ghost code**: variables, subprograms, and annotations that exist only for verification. Ghost entities are compiled out of the release build (the GNAT back end elides them), so they cost nothing at runtime, but they give the prover the hint it needs.

A **lemma procedure** is a ghost procedure whose only purpose is to make an implication visible to the prover. For example:

```ada
procedure Lemma_Sum_Is_Monotonic (A : Vector; B : Vector)
  with Ghost,
       Pre  => Length (A) = Length (B) and then All_Less (A, B),
       Post => Sum (A) <= Sum (B);
```

You write a proof of the lemma once (by induction via a loop invariant), then call the lemma at every point in the real code where you need that fact.

---

## 16. SPARK in Industry

### 16.1 iFACTS (NATS, UK)

The flagship SPARK industrial reference. iFACTS is the medium-term conflict detection and trajectory-prediction system that sits under the controllers' radar screens at Swanwick en-route control in Hampshire, covering the upper airspace over England and Wales. It was developed by Altran Praxis (née Praxis High Integrity Systems) using SPARK for the safety-critical core. The claim, documented in several Altran Praxis papers from 2005-2010, was a defect rate of roughly 0.04 defects per thousand lines of code (KLOC) post-delivery, compared with industry norms of 1-10 defects per KLOC for non-SPARK safety-critical software — roughly 30-250x reduction. Productivity claims were similarly favorable. iFACTS has been operational since 2011.

### 16.2 C130J Hercules mission computer

Lockheed Martin's C130J, the updated Hercules transport with glass cockpit and modernized avionics, had its **mission computer** portions developed in SPARK by Aerosystems International (AeI) in the 1990s. The project is well-documented in the SPARK literature as one of the earliest DO-178B Level A uses of SPARK at scale. Entered service 1999.

### 16.3 EADS / Airbus Defence and Space

Various avionics sub-systems on Airbus Defence aircraft, guided weapons, and space platforms. Public details are limited for obvious reasons.

### 16.4 Rolls-Royce jet engine control

Rolls-Royce has used SPARK in FADEC (Full Authority Digital Engine Control) development for its civil engine families, supported by AdaCore's qualification kits for DO-178C.

### 16.5 MULTOS smart card operating system

MULTOS is a multi-application smart card operating system, originally developed in the mid-1990s for financial applications. Its security kernel was formally specified and implemented with significant use of SPARK in the early versions. MULTOS cards carry EMV payment applications, e-passports, and national ID applications in several countries.

### 16.6 Tokeneer

**Tokeneer** is the NSA-commissioned demonstration project for formal methods. The NSA asked Altran Praxis in 2003 to build a complete, realistic, security-critical system using SPARK to show that high-assurance software could be delivered at reasonable cost. The result was the **Tokeneer ID Station** — a biometric access control system for a (simulated) secure facility, delivered to Common Criteria EAL 5 using SPARK throughout.

The full Tokeneer deliverable — requirements, specifications, SPARK source, proofs, test reports, and all artifacts — was later released publicly and is available from AdaCore as an open-source reference. It remains the most accessible full-scale SPARK case study anyone can download and read. Metrics from Tokeneer:

- ~10,000 lines of SPARK code.
- Zero post-delivery defects in initial rigorous test.
- Two defects discovered later, both in areas of the code that were **not** in the SPARK subset (Ada-level glue code to the biometric hardware).
- Productivity on the SPARK portions: approximately 38 lines per day per engineer, including all activities — comparable to non-formal equivalent projects.

### 16.7 muen separation kernel

**muen** is a separation kernel for the x86-64 platform, developed at the University of Applied Sciences Rapperswil (HSR) in Switzerland and later at secunet. It is written entirely in SPARK and provides hardware-assisted virtualization (Intel VT-x, VT-d) with a very small trusted computing base. The design goal is a formally-verified hypervisor suitable for MILS (Multiple Independent Levels of Security) architectures. First public release 2013; ongoing development.

### 16.8 IRONSIDES

**IRONSIDES** is a DNS server written in SPARK by Martin Carlisle and Barry Fagin at the US Air Force Academy, released around 2012. Its design goal was "zero buffer overflows and zero remote code execution vulnerabilities" through formal verification. IRONSIDES demonstrated that you could write a performant, standards-compliant DNS server (it was competitive with BIND on query throughput) and prove it free of the memory-safety vulnerabilities that had plagued BIND for decades.

### 16.9 Other published SPARK projects

- **FreeRTOS kernel re-implementation in SPARK** — a research project porting FreeRTOS to SPARK to demonstrate that a small RTOS kernel can be formally verified without losing footprint.
- **SPARKNaCl** — a SPARK port of TweetNaCl, the compact crypto library, with all operations proved free of runtime errors and memory-safe.
- **Hi-Lite / Project P** — EU-funded research projects that used SPARK for high-integrity embedded software.
- **CubeSat flight software** — several university CubeSat programs have used SPARK Community Edition.
- **Nvidia security work** — Nvidia has published on using SPARK and formal methods for small pieces of security-critical firmware, though the bulk of their firmware is not SPARK.

### 16.10 Why the SPARK reference list is short but deep

Formal methods projects are expensive to start but cheap to maintain. A SPARK project tends to be one of a small number of deeply-verified deliverables rather than a mass of ordinary ones. The ratio is roughly: Ada code is measured in tens of millions of lines across the industry; SPARK code is measured in millions. That is small relative to C or Java — but every line of SPARK is carrying evidence of a theorem, and the evidence is durable.

---

## 17. Worked SPARK Examples

The examples in this section are runnable with GNATprove. They use SPARK 2014 syntax (Ada 2012 aspects rather than comment annotations).

### 17.1 A saturation add, proved free of overflow

```ada
package Saturation
  with SPARK_Mode => On
is
   type Int32 is range -2**31 .. 2**31 - 1;

   function Sat_Add (X, Y : Int32) return Int32
     with Post =>
       Sat_Add'Result =
         (if    Integer (X) + Integer (Y) > Integer (Int32'Last)  then Int32'Last
          elsif Integer (X) + Integer (Y) < Integer (Int32'First) then Int32'First
          else  Int32 (Integer (X) + Integer (Y)));
end Saturation;
```

```ada
package body Saturation
  with SPARK_Mode => On
is
   function Sat_Add (X, Y : Int32) return Int32 is
   begin
      if Y > 0 and then X > Int32'Last - Y then
         return Int32'Last;
      elsif Y < 0 and then X < Int32'First - Y then
         return Int32'First;
      else
         return X + Y;
      end if;
   end Sat_Add;
end Saturation;
```

Running `gnatprove -P sat.gpr --level=2` on this package proves:
- No overflow in the expression `Int32'Last - Y` (the precondition of the if-branch guarantees `Y > 0`, so `Int32'Last - Y` is in range).
- No overflow in `X + Y` in the final branch (the preceding guards ensure the sum is representable).
- The postcondition holds under all inputs.

The final branch `X + Y` does not overflow because the prover knows from the guards that the sum fits in `Int32`. Without the guards, the prover would raise a VC on that line and refuse to discharge it.

### 17.2 Binary search with a proved loop invariant

```ada
package Binary_Search
  with SPARK_Mode => On
is
   type Index is range 1 .. 1_000_000;
   type Arr   is array (Index range <>) of Integer;

   function Sorted (A : Arr) return Boolean is
      (for all I in A'First .. Index'Pred (A'Last) =>
         A (I) <= A (Index'Succ (I)))
     with Ghost;

   function Find (A : Arr; X : Integer) return Natural
     with Pre  => Sorted (A),
          Post =>
            (if Find'Result = 0
             then (for all I in A'Range => A (I) /= X)
             else Find'Result in Natural (Index'First) .. Natural (A'Last)
                  and then A (Index (Find'Result)) = X);
end Binary_Search;
```

```ada
package body Binary_Search
  with SPARK_Mode => On
is
   function Find (A : Arr; X : Integer) return Natural is
      Lo, Hi, Mid : Index;
   begin
      if A'Length = 0 then
         return 0;
      end if;
      Lo := A'First;
      Hi := A'Last;
      while Lo <= Hi loop
         pragma Loop_Invariant
           (Lo in A'Range and then Hi in A'Range
            and then (for all I in A'First .. Index'Pred (Lo) => A (I) /= X)
            and then (for all I in Index'Succ (Hi) .. A'Last  => A (I) /= X));
         pragma Loop_Variant (Decreases => Hi - Lo);
         Mid := Lo + (Hi - Lo) / 2;
         if A (Mid) = X then
            return Natural (Mid);
         elsif A (Mid) < X then
            exit when Mid = Index'Last;
            Lo := Mid + 1;
         else
            exit when Mid = Index'First;
            Hi := Mid - 1;
         end if;
      end loop;
      return 0;
   end Find;
end Binary_Search;
```

The loop invariant says: "Lo and Hi are in range, and the target X is not in any slot outside the current search window." This, combined with the `Sorted` precondition, is strong enough for the prover to show that on exit from the loop (either via `return` or by falling through), the postcondition holds.

The loop variant `Hi - Lo` proves termination.

### 17.3 A priority queue with invariants

```ada
package Priority_Queue
  with SPARK_Mode => On
is
   Capacity : constant := 256;

   type Index is range 0 .. Capacity;
   subtype Extent is Index range 0 .. Capacity;

   type Item is record
      Key  : Integer;
      Data : Natural;
   end record;

   type Item_Array is array (Index range 1 .. Capacity) of Item;

   type Queue is record
      Data : Item_Array;
      Size : Extent := 0;
   end record
     with Type_Invariant =>
       (for all I in 1 .. Queue.Size =>
          (for all J in 1 .. Queue.Size =>
             (if I < J then Queue.Data (I).Key <= Queue.Data (J).Key)));

   function Is_Full  (Q : Queue) return Boolean is (Q.Size = Capacity);
   function Is_Empty (Q : Queue) return Boolean is (Q.Size = 0);

   procedure Insert (Q : in out Queue; X : Item)
     with Pre  => not Is_Full (Q),
          Post => Q.Size = Q.Size'Old + 1;

   procedure Pop_Min (Q : in out Queue; X : out Item)
     with Pre  => not Is_Empty (Q),
          Post => Q.Size = Q.Size'Old - 1;
end Priority_Queue;
```

The type invariant says the queue is sorted by key. Any operation that modifies a `Queue` must re-establish this invariant on exit, and GNATprove will reject any procedure body that might leave the queue unsorted on any code path.

### 17.4 Ghost-variable-assisted proof of a loop

```ada
package Sum
  with SPARK_Mode => On
is
   type Nat_Array is array (Positive range <>) of Natural;

   function Array_Sum (A : Nat_Array) return Natural
     with Pre  => A'Length < 1000,          -- keep the sum well inside Natural'Last
          Post => Array_Sum'Result =
                    (if A'Length = 0 then 0
                     else Array_Sum (A (A'First .. A'Last - 1)) + A (A'Last));
end Sum;

package body Sum
  with SPARK_Mode => On
is
   function Array_Sum (A : Nat_Array) return Natural is
      Total : Natural := 0;
      Seen  : Natural := 0 with Ghost;
   begin
      for K in A'Range loop
         Total := Total + A (K);
         Seen  := Seen + 1;
         pragma Loop_Invariant (Seen = K - A'First + 1);
         pragma Loop_Invariant (Total = Array_Sum (A (A'First .. K)));
      end loop;
      return Total;
   end Array_Sum;
end Sum;
```

The ghost variable `Seen` exists only for the proof (`with Ghost`). At runtime the back end removes it; in the proof, it makes the loop's progress explicit so the prover can relate the iteration count to the slice `A (A'First .. K)`.

### 17.5 Running GNATprove

```
$ alr init --bin demo
$ cd demo
$ cp <files> src/
$ cat > demo.gpr <<EOF
project Demo is
   for Source_Dirs use ("src");
   for Object_Dir use "obj";
   for Main use ("main.adb");
end Demo;
EOF
$ gnatprove -P demo.gpr --mode=prove --level=2 --report=all
```

Output (excerpted):

```
Phase 1 of 2: generation of Global contracts ...
Phase 2 of 2: flow analysis and proof ...
saturation.adb:6:21: info: range check proved
saturation.adb:7:20: info: overflow check proved
saturation.adb:10:18: info: overflow check proved
saturation.adb:13:18: info: overflow check proved
Summary: Total Proved Unproved Justified Unreachable
Data Dependencies      4         4        0         0           0
Flow Dependencies      3         3        0         0           0
Initialization         8         8        0         0           0
Runtime Checks        14        14        0         0           0
Assertions             2         2        0         0           0
Functional Contracts   2         2        0         0           0
Total                 33        33        0         0           0
```

A "Total Proved == Total" line is the SPARK equivalent of a green test suite.

---

## 18. The GNAT Story

### 18.1 The Ada 9X Project and the birth of GNAT

By 1990, Ada 83 was eight years old, and the Ada community was preparing the Ada 9X revision (which became Ada 95). The US DoD decided to fund a reference public-domain compiler for the new standard, something that had never been done for Ada 83. The contract was awarded to a team at the **New York University Courant Institute of Mathematical Sciences** led by three professors:

- **Robert Dewar** — prolific compiler researcher, co-author of the SETL language, a force of nature in the Ada community and in compiler education.
- **Edmond Schonberg** — compiler designer, also a SETL veteran.
- **Richard Kenner** — GCC expert (Kenner is the K in the GCC history; he was one of the core GCC developers in the early 1990s and contributed the register allocator and many back-end improvements).

The project was called **GNAT — GNU NYU Ada Translator**, later re-expanded to **GNAT New-York-university Ada Translator** and eventually simply "GNAT" as a standalone name. The key technical decision was to build GNAT on top of **GCC's RTL back end**, reusing the existing code generator, optimizer, and target support. This meant GNAT inherited every processor GCC supported — which, by 1994, was most of them.

The first GNAT release targeted Ada 83, then tracked the Ada 9X draft specs as they evolved. The first production Ada 95 GNAT release came in 1995, shortly after the Ada 95 standard was ratified as ISO/IEC 8652:1995. GNAT was the **first validated Ada 95 compiler** — it passed ACVC 2.1 ahead of any commercial Ada 95 product. That was a headline result because it turned a research compiler into a legitimate industrial tool overnight.

### 18.2 Ada Core Technologies / AdaCore

In 1994, the NYU team spun out a company to commercialize GNAT: **Ada Core Technologies** (later renamed **AdaCore**). The founders were Dewar, Schonberg, Kenner, and Bernard Banner. The model they chose was unusual: GNAT would remain **free and open source** under GPL-with-runtime-exception (later restated to allow linking proprietary applications against the runtime library without GPL contamination), and AdaCore would sell **support, qualified versions, and custom engineering**. This "dual model" predates the modern open-source-company playbook by more than a decade and was controversial in the 1990s Ada world, where the expectation was proprietary commercial compilers.

The AdaCore model worked because safety-critical customers need support contracts regardless, and a compiler that has the backing of a professional support organization is more valuable to them than a compiler they own forever with no one to call. Today AdaCore has offices in New York, Paris, Toulouse, Gières, Boston, and elsewhere, and is the dominant Ada vendor worldwide.

### 18.3 Why GNAT was essential for Ada's survival

The 1990s were a dangerous decade for Ada. The DoD lifted the mandate in 1997, Java was exploding, and most commercial Ada vendors were struggling or disappearing. Without GNAT, Ada would have survived only as an expensive boutique language usable only by customers who could pay six-figure-per-seat commercial compilers.

GNAT changed the economics:

- **Free at the point of use** — students, researchers, hobbyists could learn Ada.
- **Universal target support** — GCC's back end meant Ada ran on Linux, macOS, Windows, ARM, PowerPC, SPARC, MIPS, SH, AVR, and specialized targets like ERC32 (the Sparc V7 used on ESA spacecraft), Leon (the open-source Sparc variant used on ESA spacecraft), ERC32, and embedded RTOS targets like VxWorks, QNX, INTEGRITY, LynxOS.
- **Portable** — the same Ada source compiles on every supported target without changes.

Without GNAT, Ada would have become a memory of the 1980s. With GNAT, Ada became a modern, cross-platform, competitive systems language that happens to also satisfy the most stringent safety standards.

### 18.4 GNAT Pro, GNAT CE, and FSF GNAT

Three distinct distributions evolved:

- **GNAT Pro** — AdaCore's commercial, supported product. Shipped with qualified tools for DO-178C and EN 50128. Targeted at paying customers.
- **GNAT Community Edition (GNAT CE)** — free, self-supported releases made annually from 2018 through 2021. Available from libre.adacore.com. Discontinued in 2022 in favor of the Alire-based distribution.
- **GNAT FSF** — the upstream GCC version. Shipped as part of GCC's source and binary distributions. Usually lags the commercial release by six to twelve months because the commercial release includes not-yet-upstreamed features. Available via `apt install gnat`, `brew install gnat`, `dnf install gcc-gnat`, etc.

### 18.5 The death of Robert Dewar

Robert Dewar died on 30 June 2015, aged 70, of a pulmonary condition. His death was a turning point for AdaCore and for the Ada community. Dewar had been the public face of Ada for two decades — the teacher, the evangelist, the compiler writer, the curmudgeon who would argue for the language at any conference that would have him. His ACM SIGAda keynotes and the Ada Letters pieces he wrote are a running commentary on the language's life through the 1990s and 2000s.

After his death, AdaCore's leadership passed to a newer generation, with Cyrille Comar and Arnaud Charlet among the long-time technical leaders, and the company continued to grow. The transition was handled cleanly. But Ada's cultural center of gravity shifted — Dewar was the language's most effective advocate, and the Ada community has looked since then for a voice that occupies the same role.

---

## 19. Other Ada Implementations

For the historical record, and because many of these compilers still compile code running on critical systems.

### 19.1 AdaCore GNAT Pro

See §18. The dominant implementation by every measure: market share, active development, target support, customer count. If you start a new Ada project in 2026, you are most likely going to use GNAT.

### 19.2 Green Hills AdaMULTI

Green Hills Software (Santa Barbara, CA) is a major vendor of embedded compilers and RTOS. Their Ada offering, **AdaMULTI**, targets **VxWorks** (Wind River) and **INTEGRITY** (Green Hills's own RTOS, used in F-35, 787, and many defense platforms). Green Hills has emphasized absolutely certified tool chains — INTEGRITY-178 is DO-178C DAL A certified, and AdaMULTI has the matching compiler qualification. AdaMULTI is a smaller player than GNAT but its customers — typically defense primes and avionics suppliers — are willing to pay for the certification story.

### 19.3 IBM Rational Ada / IBM Rational Apex

**Rational Software** (Santa Clara, CA) was one of the early Ada powers. Founded in 1981 by Paul Levy and Mike Devlin, Rational built the **Rational Environment**, a turn-key Ada development system that bundled compiler, IDE, configuration management, and a specialized Ada workstation (the R1000, a tagged-architecture machine purpose-built for Ada program representation). The Rational Environment was extravagant — you bought a dedicated workstation — but it pioneered many ideas later popularized by IDEs: incremental compilation, semantic navigation, integrated version control.

In the 1990s Rational retreated from Ada hardware and released **Rational Apex**, a host-based Ada compiler for Unix workstations. Rational Apex remained in use into the 2000s at Boeing, Lockheed, and other defense primes. IBM acquired Rational in 2003, renamed it IBM Rational, and the Ada products were gradually de-emphasized and discontinued through the 2010s. Some customers continued to use IBM Rational Apex on legacy programs as of the mid-2010s; it is now essentially end-of-life.

Rational also produced the classic **Booch** software architecture methodology (Grady Booch was a Rational vice president), which became one of the three ancestors of UML. Ada's influence on object-oriented design notation ran through Rational.

### 19.4 DEC Ada / Compaq Ada / HP Ada

Digital Equipment Corporation's **DEC Ada** was a first-class compiler for VAX/VMS and Alpha/OpenVMS, notable for deep integration with the VMS runtime and debugger. It was one of the most polished Ada 83 compilers. DEC Ada became Compaq Ada after Compaq acquired DEC in 1998, then HP Ada after HP acquired Compaq in 2002. Development essentially ceased by the mid-2000s, though the compiler continues to be maintained by a small VMS community for the OpenVMS migration to Itanium and x86-64. If you are doing anything Ada-related on OpenVMS today, you are using either HP Ada (legacy) or GNAT Pro for VMS.

### 19.5 Alsys Ada

**Alsys** was Jean Ichbiah's own company. Ichbiah, the lead designer of Ada 83 at Honeywell-Bull, founded Alsys in 1980 specifically to build Ada compilers. Alsys produced compilers for workstations, embedded targets, and mainframes, and was one of the dominant Ada vendors in Europe in the 1980s and early 1990s. It was acquired by **Thomson Software Products** in 1991, then by **Aonix** (formed 1996 from the merger of Alsys and ISE Software), and the Ada line was continued as **Aonix ObjectAda**. Aonix was acquired in 2010 by **Parametric Technology Corporation (PTC)** and became PTC ObjectAda, which continues to exist as a commercial product with a small but loyal customer base. Ichbiah himself left Alsys in 1996 and spent his later career on predictive text input (T9, which became ubiquitous on early mobile phones). He died in 2007.

### 19.6 Aonix ObjectAda / PTC ObjectAda

Continuation of Alsys. ObjectAda targets VxWorks, INTEGRITY, Windows, Linux, Solaris. Known for tight integration with ARINC 653 partitioning. PTC positions it as a legacy-continuity product for customers who started with Alsys or Aonix in the 1990s.

### 19.7 TeleSoft TeleGen2

**TeleSoft** (San Diego, CA) was another early US Ada vendor. TeleGen2 was their Ada 83 compiler, popular in the late 1980s for embedded and real-time work. TeleSoft was absorbed into Alsys in 1992. The name is a historical footnote, but TeleGen2 object code is still running in the guts of various legacy systems somewhere.

### 19.8 Meridian Software / Open Ada

**Meridian Software Systems** produced **Meridian Ada** for DOS and Unix in the 1980s. It was one of the first affordable Ada compilers (list price around $2000 vs tens of thousands for the Rational or DEC offerings) and was used for a lot of university teaching in the late 1980s. Meridian was acquired by Alsys in 1991. Meridian's "Open Ada" brand lived briefly as an educational product.

### 19.9 Janus/Ada (RR Software)

**RR Software** (Madison, WI), run by Randall Brukardt, produces **Janus/Ada**, a compact compiler targeting DOS, Windows, OS/2, Linux, and some embedded systems. Janus/Ada has an unusually small footprint — the compiler itself runs in tight memory and produces compact code — which made it popular for some embedded projects. It supports Ada 83, Ada 95, and a subset of Ada 2005/2012. Randall Brukardt is also the editor of the Ada Reference Manual (since Ada 95) and is an important institutional figure in Ada standardization. Janus/Ada is still maintained and sold today, albeit as a niche product.

### 19.10 MapuSoft AppCOE

**MapuSoft Technologies** produces **AppCOE** (Application Common Operating Environment), a legacy-translation and porting platform that includes Ada-to-C source-to-source translation. The idea is that legacy Ada code can be mechanically translated to C and re-hosted on platforms that don't have an Ada compiler. This is a niche but real business: some customers have Ada code that needs to run on new platforms where Ada tooling is unavailable or the procurement friction is too high.

### 19.11 SofCheck AdaMagic

**SofCheck** (acquired by AdaCore in 2009) produced **AdaMagic**, an Ada front-end technology used inside several other compilers as the parser/semantic-analyzer. Tucker Taft was the technical lead at SofCheck; after the acquisition Taft became a Distinguished Engineer at AdaCore. Taft is also the lead designer of **Ada 2012** and **Ada 2022** and the author of the **ParaSail** experimental language.

### 19.12 Irvine Compiler Corp (ICC) Ada

**Irvine Compiler Corporation** (Irvine, CA) produced Ada 95 compilers for embedded targets including specialized defense platforms. ICC was acquired by **LDRA** around 2010 and the Ada products are maintained for legacy support.

### 19.13 Historical footnotes

Many other Ada compilers existed in the 1980s. A partial list: **Verdix VADS** (later Rational Verdix), **Active Ada**, **TLD Ada**, **Aetech Ada**, **GenSym G2**, **Tartan Ada**, **ADT Ada**, **CTA/Vista Ada**, and a dozen university research compilers. Most are extinct; some still have code in production somewhere.

---

## 20. GNAT Tooling Ecosystem

Ada tooling is unusually integrated because AdaCore's business model rewards investment in tools, and because certification customers demand traceability from requirements to bits.

### 20.1 GNATstudio (formerly GPS)

**GNATstudio**, formerly **GPS (GNAT Programming Studio)**, is AdaCore's flagship IDE. Built on Python bindings and the GTK toolkit (it was GTK-based from the beginning, which let it run cross-platform), GNATstudio provides project management, syntax highlighting, code navigation, debugger integration, build automation, version control integration, and direct hooks into the entire GNAT suite (GNATprove, CodePeer, GNATcoverage, GNATcheck).

GNATstudio is written mostly in Ada itself — a characteristic AdaCore flourish — with Python used for user-facing scripting. As of the mid-2020s, AdaCore's strategy has shifted toward supporting VS Code as the primary editing environment for new users (via ada_language_server), while keeping GNATstudio for users who prefer the integrated experience or depend on the deep tool integration.

### 20.2 GNATprove

The SPARK proof tool. See §15 for the pipeline. GNATprove ships as part of SPARK Pro (commercial) and as part of the GNAT community / Alire distribution (free). The key command-line flags:

- `--mode=flow` — only run flow analysis (fast, pre-proof check)
- `--mode=prove` — run the full proof pipeline
- `--mode=all` — flow + proof
- `--level=0..4` — effort level for the solver
- `--prover=cvc5,z3,alt-ergo` — which solvers to use
- `--counterexamples=on` — attempt to produce counterexamples on failed VCs
- `--report=statistics` — produce detailed proof statistics

### 20.3 CodePeer

**CodePeer** is AdaCore's static analysis tool for Ada, distinct from SPARK. Where SPARK demands contracts and proves from them, CodePeer is a **bug-finding** tool that runs over ordinary Ada code with no annotations and reports suspicious patterns: possible overflows, possible uninitialized reads, possible null dereferences, dead branches, redundant conditions. It is analogous to Coverity, Polyspace, or Clang Static Analyzer for C/C++.

CodePeer is implemented as an abstract interpretation analyzer; it computes over-approximations of reachable states and flags any possibility of failure. False-positive rate is bounded but non-zero. CodePeer is qualified for use in DO-178C projects.

The typical workflow is: run CodePeer on legacy Ada code to get a first pass of safety findings, fix the ones that matter, then transition the highest-criticality modules to SPARK for full proof.

### 20.4 GNATtest

**GNATtest** is a unit test framework generator for Ada. Given a package spec, it generates a test harness with stub procedures for each visible subprogram, which the developer fills in with test bodies. It integrates with `gprbuild` so `gprbuild -P test.gpr test` runs the generated harness.

GNATtest doesn't compete with Ahven or AUnit (two community Ada test frameworks) on expressiveness, but it emphasizes traceability — it produces structured reports suitable for certification evidence.

### 20.5 GNATcheck

**GNATcheck** enforces coding standards. Rules are drawn from:

- The **Ada Quality and Style Guide (SPC-94093-CMC)** — the SEI Ada style guide, still the canonical reference.
- Custom project-local rules (AdaCore has published rule packs for various aerospace customers).
- **MISRA-like Ada rules** for customers who want a MISRA equivalent.
- **HIS (Hersteller Initiative Software)** metrics for automotive.

GNATcheck is used as a commit-time gate in many defense projects.

### 20.6 GNATcoverage

**GNATcoverage** measures structural code coverage — statement coverage, decision coverage, and MC/DC — which are the three coverage criteria referenced by DO-178C for DAL C, B, and A respectively. GNATcoverage is implemented as an emulator-based trace analyzer: it runs the program under an instruction-set simulator (for cross-compiled embedded targets) or natively with instrumentation, records the execution traces, and computes coverage against the original Ada source.

The simulator-based approach is a big deal for embedded avionics because it means you can measure MC/DC on the actual object code that will fly, without instrumenting the production binary. AdaCore has published the tool qualification packages for DO-178C customers.

### 20.7 GNATcoll

**GNATcoll** is AdaCore's foundational library: Ada bindings to SQLite, PostgreSQL, JSON, XML, traces, filesystem operations, process management, project handling, and various helpers. It's the practical "stdlib++" for Ada that fills in what the Ada standard library does not provide (the standard library is deliberately minimal in the Ada tradition).

### 20.8 GPRbuild

**GPRbuild** is the project build tool, reading `.gpr` (GNAT Project) files. It handles the dependency graph, incremental compilation, cross-compilation toolchain selection, and library construction. The `.gpr` format is Ada-syntax-like, declarative, and composable (projects can extend or import other projects).

A typical `.gpr` file:

```ada
project Hello is
   for Languages use ("Ada");
   for Source_Dirs use ("src");
   for Object_Dir use "obj";
   for Main use ("main.adb");

   package Compiler is
      for Default_Switches ("Ada") use
        ("-O2", "-gnatwa", "-gnatVa", "-gnato", "-fstack-check");
   end Compiler;

   package Builder is
      for Default_Switches ("Ada") use ("-j0", "-k");
   end Builder;
end Hello;
```

The flags shown are characteristic Ada paranoia: `-gnatwa` = all warnings, `-gnatVa` = all validity checks, `-gnato` = overflow checks, `-fstack-check` = stack overflow checks.

### 20.9 Alire (ALR)

**Alire** is the modern Ada package manager, first released in 2018 and maturing rapidly. It does for Ada what Cargo does for Rust and npm does for JavaScript: dependency resolution, binary and source distribution of libraries, project scaffolding, toolchain management. Alire is the single most important change to the Ada developer experience in a decade.

Representative workflow:

```
$ alr init --bin my_project
$ cd my_project
$ alr with aws          # add Ada Web Server dependency
$ alr with gnatcoll     # add GNATcoll
$ alr build
$ alr run
```

Alire ships its own copy of a compatible GNAT toolchain (via `alr toolchain`), which means a new user can install `alr`, run `alr init`, and have a working Ada build without ever manually installing a compiler. This is the first time in Ada's history that the onboarding experience approached the low friction of modern language package managers.

The Alire community index (https://alire.ada.dev) at the time of writing has around a thousand crates (Ada packages), including bindings to SDL, OpenGL, Postgres, SQLite, HTTP, WebSocket, JSON, YAML, and cryptography, plus native Ada libraries for numerics, testing, containers, and more.

### 20.10 learn.adacore.com

**learn.adacore.com** is AdaCore's free online learning platform. It has interactive Ada and SPARK courses, runnable in the browser via a remote GNAT back end, with exercises graded against GNAT and GNATprove. The courses include:

- *Introduction to Ada* — a full textbook-style course for programmers from other languages.
- *Introduction to SPARK* — parallel course for SPARK specifically.
- *Ada for the Embedded C Developer* — the classic "I know C, how do I switch?" track.
- *Introduction to Embedded Systems Programming* — Ada on STM32 (Cortex-M4) via the Ada Drivers Library.

learn.adacore.com is, in the author's opinion, the single best onboarding resource the Ada community has ever had. It is what the Rust community built from scratch; Ada already had it.

### 20.11 Ada Drivers Library

The **Ada Drivers Library** is an open-source collection of embedded hardware abstractions and peripheral drivers for Cortex-M and some RISC-V boards. It targets STM32F4/F7, STM32L4, nRF52, Microbit, Arduino Nano, and others, with clean Ada APIs over GPIO, SPI, I2C, UART, DMA, Timers, ADC, USB, and display drivers. It's the base on which a lot of Ada embedded demos and CubeSat work rests.

### 20.12 AUnit and Ahven

Community test frameworks. **AUnit** (AdaCore, open source) is the xUnit-style framework; **Ahven** (Tero Koskinen) is an alternative with somewhat different ergonomics. Both work well with Alire.

---

## 21. Language Server and Modern Tooling

### 21.1 ada_language_server

AdaCore implements the **Language Server Protocol** for Ada in the **ada_language_server** project (open source, on GitHub under AdaCore's organization). It provides:

- Hover for symbols
- Go-to-definition and find-references
- Completion
- Diagnostics from the compiler in real time
- Refactoring (rename, extract)
- Call hierarchy
- Type hierarchy

This was a transformative change for Ada's developer experience. Before ada_language_server, serious Ada development meant using GNATstudio or GNATbench (the Eclipse plugin), both of which were competent but felt unlike modern editor experiences. After ada_language_server, any editor that speaks LSP — VS Code, Emacs with lsp-mode or eglot, Vim/Neovim with built-in LSP or coc-nvim, Sublime with LSP, Helix, Zed, JetBrains via plugin — can host a first-class Ada editing experience.

### 21.2 VS Code extension

AdaCore ships an official VS Code extension (`AdaCore.ada`) that bundles ada_language_server, a GNAT debugger integration, syntax highlighting, and Alire workflow support. It is as of 2024-2025 the recommended default for new Ada users on all platforms.

### 21.3 Emacs ada-mode

**ada-mode** for Emacs is long-established and has been updated multiple times. The current generation (Stephe Leake's) is sophisticated, with its own incremental parser (wisi), semantic indentation, and navigation. It predates ada_language_server and remains popular with Emacs users.

### 21.4 GitHub Actions

AdaCore and the Alire community publish GitHub Actions for setting up Ada toolchains in CI:

```yaml
- uses: alire-project/setup-alire@v2
- run: alr build
- run: alr exec gnatprove -- -P my.gpr --level=2
```

This is a boring, modern, works-like-everyone-else-expects setup. For a long time Ada CI meant homegrown Docker images with hand-installed GNAT. Alire fixed that.

### 21.5 Debuggers

GNAT integrates with GDB via the GNAT-patched GDB (GDB with Ada language support; upstream GDB also has Ada mode). GNATstudio and VS Code both wrap GDB for graphical debugging. For embedded, GDB over OpenOCD, ST-Link, or JLink is standard.

---

## 22. Ada and Rust — The Modern Conversation

### 22.1 What Rust legitimized

Rust's rise in the 2015-2025 period did something no amount of Ada evangelism had done: it made "memory-safe systems language" a first-class category in mainstream engineering. Linux kernel Rust support, Android's Rust push, Microsoft rewriting portions of Windows in Rust, and the White House ONCD memory-safety memo (2024) all framed the problem in terms Ada people had been using since 1983 but the mainstream had been dismissing as academic.

The Ada community watched Rust's success with complicated feelings. On the one hand: vindication. The entire argument — "strong typing, no undefined behavior, controlled aliasing, memory safety without garbage collection" — was Ada's argument. On the other hand: envy. Rust got the attention, the mindshare, the cool factor, the hires, the books, the tutorials. Ada had been saying "we already have this" for forty years.

### 22.2 What Rust has that Ada does not

- **Mindshare** — the single biggest difference.
- **Modern build tooling from day one** — Cargo was there from 1.0. Ada needed Alire to catch up, forty years in.
- **Ownership checking in the base language** — Rust's borrow checker is built into the compiler and is the default model. SPARK has equivalent strength for the subset that uses access types, but it's opt-in.
- **Open ecosystem culture** — Rust assumes open source by default. Ada culture leans toward commercial support contracts.
- **LLVM code generation** — Rust rides LLVM, which is the most modern code generator. GNAT rides GCC, which is also modern but less so on some targets.

### 22.3 What Ada has that Rust does not

- **Native tasking with protected objects and ARM-level Ravenscar** — Rust has async/await but nothing comparable to Ada's built-in real-time tasking model. For hard real-time systems Rust typically adopts RTIC or Embassy, both of which are younger than Ravenscar.
- **SPARK's functional-correctness proof** — Rust has no standard formal-proof tool at the Rust source level comparable to SPARK's tight integration. There are research projects (Prusti, Creusot, RustHorn) but none has iFACTS-style production use.
- **Mature safety-certification story** — DO-178C, EN 50128, IEC 61508 Ada qualification is decades old. Rust is just starting — see Ferrocene below.
- **Decimal fixed-point, numeric types with controlled precision and rounding, hardware-bit-level records with explicit representation** — all Ada primitives; Rust reaches them via crates with less rigor.
- **Decades of fielded code** — the inertia effect. Customers do not rewrite working code.

### 22.4 SPARK vs Rust from a safety perspective

A useful way to say this: **Rust prevents a specific set of bugs statically; SPARK proves that the code meets its specification**. These are different levels of assurance.

- Rust's guarantee: no data races, no use-after-free, no buffer overflow (in safe code). If your Rust program compiles, it won't have those bugs.
- SPARK's guarantee at Silver level: no runtime errors. If your SPARK program proves, it can't raise any runtime exception.
- SPARK's guarantee at Gold/Platinum: the code satisfies the contracts. If the contracts capture the spec, the code meets the spec.

Rust's guarantee is "memory and threading primitives won't betray you". SPARK's guarantee is "the program does what you said it does". Those are complementary, not competing.

### 22.5 The "SPARK for the kernel, Rust for the bulk" pattern

Several recent projects combine the two: the majority of the system is in Rust (using Cargo, the Rust ecosystem, Rust libraries), and a small, high-assurance safety kernel is in SPARK. The SPARK kernel is the "monitor" that enforces safety invariants on the Rust bulk. This is the same pattern that was classic for Ada + C (the Ada kernel monitoring the C bulk), updated to the Rust era.

It is possible this pattern becomes the dominant architecture for new high-integrity systems in the 2030s: Rust wherever the ergonomics and ecosystem matter, SPARK for the kernel that the regulator signs off on.

### 22.6 Ferrocene — Rust in safety certification, inspired by Ada

**Ferrocene** is a project by **Ferrous Systems** (Berlin, with input from AdaCore and others) to bring Rust into the safety-certification space that Ada has occupied for decades. Ferrocene is a qualified Rust toolchain — the Rust compiler with the qualification evidence required for ISO 26262, IEC 61508, and eventually DO-178C. The first Ferrocene 1.68-based qualified release shipped in 2023, and updates are ongoing.

Crucially, Ferrocene was explicitly modeled on the Ada-with-qualified-GNAT model. The Ferrocene founders spoke publicly at Embedded World and FOSDEM about how they were looking at AdaCore's business model, their qualification process, their customer relationships, their tooling philosophy. In a real sense, Ferrocene is Ada's gift to Rust.

### 22.7 AdaCore's Rust play

AdaCore itself has a Rust team now (acquired via the purchase of relevant expertise and via ongoing investment). AdaCore's strategy is to offer **one toolchain vendor for both Ada/SPARK and Rust**, so customers building new systems with a mix of languages can buy support from one place. AdaCore + Ferrous Systems have had a commercial relationship around this since 2021.

### 22.8 Why this matters for Ada's future

Rust's existence has been the best thing to happen to Ada's visibility in twenty years, for two reasons:

1. It made the conversation about safe systems languages mainstream. Ada benefits when that conversation happens at all.
2. It created an exit for ambitious safety customers who want modern tooling but don't want to throw away the certification story — they can pick Ada (mature) or Rust (new, via Ferrocene). Either way the alternative is no longer "C and pray".

---

## 23. The Modern Ada Community

### 23.1 Ada-Europe

The **Ada-Europe conference** (officially the International Conference on Reliable Software Technologies) has been held annually since 1980. Venues rotate through European cities: Toulouse, Paris, Vienna, Madrid, Ghent, Santander, Lisbon, Prague, Edinburgh, and many others. Proceedings are published by Springer as LNCS volumes. Ada-Europe is the academic-industrial crossover venue for Ada research and experience reports.

### 23.2 SIGAda

**ACM SIGAda** was the Ada special interest group under the Association for Computing Machinery. It ran the US-side Ada conference (HILT — High Integrity Language Technology — and earlier SIGAda conferences) for decades, published Ada Letters, and was the institutional home of Ada in US academia. SIGAda has been dormant since the mid-2010s, with activity migrating to Ada-Europe (for academia) and AdaCore's customer conferences (for industry). Ada Letters, the SIGAda newsletter, published its last issue around 2018.

### 23.3 Ada User Journal

The **Ada User Journal** is the quarterly publication of **Ada-Europe**. It publishes experience reports, book reviews, conference announcements, and commentary. It is one of the few places where people still write about Ada in the small: a new package, a new tutorial, a new experience. Dirk Craeynest (KU Leuven, long-time Ada-Europe conference chair) has been one of its mainstays.

### 23.4 Reddit r/ada

The **r/ada subreddit** is the active online community. It's small (~10,000 subscribers as of writing) but unusually high signal: AdaCore engineers show up, Alire maintainers show up, experienced Ada people answer questions, and new Ada users get welcoming help. For a language stereotyped as unapproachable, r/ada is notably friendly.

### 23.5 GitHub

Ada on GitHub has grown enormously with Alire. As of the mid-2020s:

- AdaCore's organization has dozens of repositories: GNAT, SPARK, GNATstudio, CodePeer, ada_language_server, learn.adacore.com, Alire, and many libraries.
- The Alire community index has around a thousand crates, all on GitHub.
- Community projects like the Ada Drivers Library, SPARKNaCl, Hi-Lite, Ironsides, muen, and many others.
- Personal repositories from notable Adaists — Jacob Sparre Andersen, Simon Wright, Fabien Chouteau, Per Sandberg, and many more.

### 23.6 AdaCore's blog and training

AdaCore operates **blog.adacore.com** with substantive technical posts (many from Yannick Moy on SPARK, Fabien Chouteau on embedded, and others). AdaCore also runs commercial training — onsite or online — for customers who want to get their teams up to speed on Ada, SPARK, or a specific tool.

### 23.7 Ada Resource Association (adaic.org)

The **Ada Resource Association** runs **adaic.org**, which is the informal clearinghouse for Ada materials. It hosts the Ada Reference Manual, lists of compilers, standards references, and the history of Ada. Clyde Roby maintains much of it. adaic.org is not flashy but it is **durable**.

### 23.8 Standards work

Ada standardization continues under **ISO/IEC JTC1/SC22/WG9**, the ISO working group for Ada. The ARG (Ada Rapporteur Group) produces ARs (Ada Issues) that accumulate into language revisions. Ada 2022 was published as ISO/IEC 8652:2023, and work is ongoing toward the next revision. Tucker Taft has been the technical force behind Ada 2012 and Ada 2022; Randall Brukardt has been the ARM editor; Pascal Leroy chaired the ARG for years. The standardization cadence is slow (a decade between revisions) and deliberate, which is exactly what the language's customer base wants.

---

## 24. Why Ada Is Having a Quiet Revival in the 2020s

### 24.1 The security moment

Memory-safety bugs are, according to the White House ONCD and multiple government cybersecurity reports, responsible for roughly 70 percent of security vulnerabilities in widely-deployed C/C++ code. The policy response in 2023-2024 was direct: agencies and critical-infrastructure vendors were told to move toward memory-safe languages for new development. Ada is on the approved list alongside Rust, Go, Swift, Java, C#, and a few others. For the first time since the 1990s, the US federal government is actively recommending Ada again — just as one option among several, but it's on the list.

### 24.2 Rust's success legitimized the category

See §22.1. The Rust conversation created space for Ada to re-enter the mainstream conversation without having to fight the "why would I use that?" reflex every time.

### 24.3 Regulatory pressure

- **EU Cyber Resilience Act (2024)** — places liability on software vendors for security defects in products with "digital elements". This is a massive shift in the European regulatory landscape, and it makes languages with stronger static guarantees — Ada, SPARK, Rust — significantly more attractive for long-lifetime embedded devices.
- **US secure-by-design mandates** — CISA's secure-by-design pledge, EO 14028, and follow-on directives for federal agencies.
- **PRA DMS/DSS** — financial sector operational resilience requirements in the EU that drive better software quality in critical financial infrastructure.

All of these are rewards to languages that make auditable, defensible claims about what the code does.

### 24.4 SPARK's maturity makes formal verification practical

Ten years ago, running GNATprove on non-trivial code was a research project. Today, with SPARK 2014+, modern SMT solvers (CVC5, Z3 v4.x), proof-by-default patterns, and ghost-code idioms that engineers can learn, the Bronze and Silver levels of the SPARK ladder are achievable in weeks of part-time effort for a small module and in months for a substantial codebase. The productivity numbers from iFACTS and Tokeneer were once curiosities; now they are reproducible.

### 24.5 Forty years of fielded code doesn't go away

The A320 has flown since 1988. Paris Métro Line 14 has been driverless since 1998. The C130J has been in service since 1999. iFACTS went live in 2011. Canadarm2 is still on the ISS. That code is going to keep running for decades; its maintainers are not going to rewrite it; and every time a new variant ships — a new 777X, a new A321XLR, a new Airbus A330neo, a new Eurofighter tranche, a new Metro line — the Ada content goes up, not down.

### 24.6 The cohort of Ada experts is thinning

The risk counterargument is real: the Ada expert cohort is aging. Many of the engineers who learned Ada in the late 1980s and early 1990s during the DoD mandate era are now in their sixties. The community has been worried about the succession problem for a decade. The answer — Alire, learn.adacore.com, the VS Code extension, the ada_language_server, the r/ada community — is a deliberate investment in making Ada approachable for the next generation. It appears to be working, slowly; Alire's crate count, its download numbers, and the rate of new r/ada posts are all trending upward.

### 24.7 What to watch

- Ferrocene stabilizing and certifying Rust for DO-178C. If that succeeds, expect a wave of mixed Ada/Rust avionics projects in the 2030s.
- SPARK's ownership model maturing to full parity with Rust's borrow checker. AdaCore has been explicit about this goal; early 2020s progress has been steady.
- Alire growing toward the 5,000-crate mark that would make it feel like a "full" ecosystem.
- New Ada-in-safety reference projects entering production — expect SPARK in EU rail signaling to remain dominant, expect new SPARK content in EU space (Ariane 6 and beyond), expect quiet SPARK growth in medical devices and nuclear I&C.
- A possible return of Ada to the US defense mainstream as the security argument bites.

### 24.8 The final thought

Ada was designed in the late 1970s by a small team working under a demanding requirements document, for customers who could not tolerate the kinds of defects that the C and C++ communities treated as normal. That design has aged well because the original requirements have not changed: software that controls physical systems where the cost of a bug is measured in lives and money must be auditable, provable, deterministic, and portable across the decades the system will operate. Every piece of technology built on the "fast, loose, move-on" model has had to claw back toward those requirements in the years since. Ada started there and has simply stayed there.

The Ada community's slogan for the 2020s revival ought to be: *we were right all along, and we will still be right in 2050*. That is not a fashionable position. It is, however, the position held by the people whose code keeps the planes in the air and the reactors under control.

---

## Appendix A: Ada and SPARK Reference Texts

- **Barnes, John.** *Programming in Ada 2012 with a Preview of Ada 2022.* Cambridge University Press, 2014. The canonical textbook on modern Ada. Barnes was on the original Ada 83 design team and has been the authoritative language writer since.
- **Barnes, John.** *High Integrity Software: The SPARK Approach to Safety and Security.* Addison-Wesley, 2003. The foundational SPARK book; slightly dated (pre-SPARK 2014) but the conceptual content is still accurate.
- **McCormick, John W., Frank Singhoff, and Jérôme Hugues.** *Building Parallel, Embedded, and Real-Time Applications with Ada.* Cambridge University Press, 2011. The Ravenscar and real-time book.
- **AdaCore.** *SPARK User's Guide* and *SPARK Reference Manual*. Online at docs.adacore.com. Updated with every SPARK release.
- **AdaCore.** *GNAT Pro User's Guide, GNATprove User's Guide, GNATstudio User's Guide, CodePeer User's Guide, GNATcoverage User's Guide.* All at docs.adacore.com.
- **Ada Reference Manual, ISO/IEC 8652:2023.** The official language standard. Available in annotated form from adaic.org.
- **Lions, Jacques-Louis (chair).** *Ariane 5 Flight 501 Failure Report.* ESA/CNES joint inquiry board report, 19 July 1996. Publicly available.
- **Leveson, Nancy and Clark S. Turner.** "An Investigation of the Therac-25 Accidents." *IEEE Computer*, July 1993. The canonical Therac-25 case study.
- **Taft, S. Tucker, Robert A. Duff, Randall L. Brukardt, Erhard Ploedereder, and Pascal Leroy (eds.).** *Consolidated Ada 2012 Reference Manual.* Springer LNCS 8339, 2013. The readable annotated ARM.
- **Ada User Journal** — quarterly, back issues at ada-europe.org/auj.
- **Altran Praxis / Capgemini Engineering** publications on iFACTS and SPARK case studies — multiple papers available through ACM SIGAda proceedings and Ada-Europe LNCS volumes.
- **Chapman, Rod and Peter Amey.** Several seminal SPARK papers from the Praxis era. Chapman's "Correctness by construction" talks are on YouTube.

## Appendix B: Acronyms Used in This Document

| Acronym | Expansion |
|---|---|
| ACAA | Ada Conformity Assessment Authority |
| ACATS | Ada Conformity Assessment Test Suite |
| ACVC | Ada Compiler Validation Capability |
| ADA | Ada (the language; named after Ada Lovelace, not an acronym) |
| AIMS | Aircraft Information Management System |
| AoRTE | Absence of Run-Time Errors |
| ARG | Ada Rapporteur Group |
| ARM | Ada Reference Manual |
| ASIL | Automotive Safety Integrity Level |
| ATC | Air Traffic Control |
| ATCCS | Army Tactical Command and Control System |
| ATM | Air Traffic Management |
| ATP | Automatic Train Protection |
| AUTOSAR | AUTomotive Open System ARchitecture |
| CCS | Common Core System |
| CMS | Combat Management System |
| CNES | Centre National d'Études Spatiales (French space agency) |
| DAL | Design Assurance Level (DO-178C) |
| DFS | Deutsche Flugsicherung (German ATC) |
| DLR | Docklands Light Railway |
| DO-178C | RTCA/EUROCAE Software Considerations in Airborne Systems |
| DO-254 | RTCA/EUROCAE Design Assurance Guidance for Airborne Electronic Hardware |
| DO-333 | Formal Methods Supplement to DO-178C |
| EAL | Evaluation Assurance Level (Common Criteria) |
| EASA | European Union Aviation Safety Agency |
| EMV | Europay Mastercard Visa (payment card standard) |
| ESA | European Space Agency |
| ETCS | European Train Control System |
| FAA | Federal Aviation Administration |
| FADEC | Full Authority Digital Engine Control |
| FBW | Fly-By-Wire |
| FMC | Flight Management Computer |
| GCC | GNU Compiler Collection |
| GNAT | GNU NYU Ada Translator |
| HIS | Hersteller Initiative Software |
| I&C | Instrumentation and Control |
| ICD | Implantable Cardioverter-Defibrillator |
| IEC | International Electrotechnical Commission |
| iFACTS | Interim Future Area Control Tools Support |
| IMA | Integrated Modular Avionics |
| INRIA | Institut national de recherche en informatique et en automatique |
| ISO | International Organization for Standardization |
| ITC | Iowa Test Center (historical, unrelated) |
| JPL | Jet Propulsion Laboratory |
| KLOC | Thousand Lines of Code |
| LNCS | Lecture Notes in Computer Science (Springer) |
| LSP | Language Server Protocol |
| MC/DC | Modified Condition/Decision Coverage |
| MILS | Multiple Independent Levels of Security |
| MISRA | Motor Industry Software Reliability Association |
| MSL | Mars Science Laboratory |
| NATS | National Air Traffic Services (UK) |
| NAV CANADA | Navigation Canada (Canadian ATC) |
| NYU | New York University |
| ONCD | Office of the National Cyber Director (US) |
| PRISM | Probabilistic Symbolic Model Checker (referenced for contrast) |
| PRT | Personal Rapid Transit |
| PVL | Program Validation Limited |
| RMS | Rate Monotonic Scheduling |
| RTCA | Radio Technical Commission for Aeronautics |
| SAET | Système d'Automatisation de l'Exploitation des Trains |
| SCADE | Safety-Critical Application Development Environment (Esterel Technologies) |
| SIL | Safety Integrity Level (IEC 61508) |
| SMT | Satisfiability Modulo Theories |
| SPARK | (informal, no official expansion) |
| SRI | Système de Référence Inertielle (Ariane inertial reference) |
| SSIL | Software Safety Integrity Level (EN 50128) |
| UML | Unified Modeling Language |
| VC | Verification Condition |
| VMS | Virtual Memory System (DEC operating system) |
| WCET | Worst-Case Execution Time |
| WG9 | Working Group 9 (ISO/IEC JTC1/SC22 — Ada) |

---

*End of Thread B: Safety-Critical Applications, SPARK Formal Verification, and the GNAT Ecosystem.*

---

## Study Guide

This is the thread to read when you want to understand *why* Ada
exists in the form it does, and how SPARK takes the Ada subset and
elevates it to provable correctness.

### Prerequisites

- Finish `language-core.md` first. You need contracts (Section 13) and
  packages (Section 8) in your head before SPARK makes sense.
- Install GNAT + SPARK. On Debian/Ubuntu: `sudo apt install gnat
  gnatprove`. On other platforms, the GNAT FSF or GNAT Pro installer
  bundles both. Verify with `gnatprove --version`.
- Read one case study of a failure — the Ariane 5 Flight 501 report,
  the Therac-25 paper, or the Mars Climate Orbiter MIB report. Pick
  one. Read the whole thing. These are the accidents that created the
  demand for the tools in this document.

### Recommended reading order

1. **The problem.** Read the history portion first: the D&D process,
   the catastrophic failures that motivated DO-178, IEC 61508, and
   EN 50128. Understand that the tools you are about to learn were
   built in response to specific disasters.
2. **The Ada subset.** Ada's features that are safe and those that are
   not — the "Ravenscar profile" for concurrency, the No_Allocators
   and No_Recursion restrictions, bounded strings, elaboration
   control.
3. **SPARK's model.** SPARK is Ada minus side effects minus aliasing
   minus dynamic dispatch, plus information-flow analysis. It is a
   *subset* enforced by tooling, not a separate language.
4. **The verification condition pipeline.** How `gnatprove` translates
   contracts into VCs, hands them to SMT solvers (Alt-Ergo, CVC5,
   Z3), and reports back.
5. **The certification story.** DO-178C Levels A-E, the objectives
   each level demands, how formal methods discharge some of those
   objectives, and how an audit actually works.
6. **The GNAT ecosystem.** The implementation, runtime library,
   cross-compilers, and tooling. This is the "how do I build my
   project" layer.

### Key concepts

1. **Safety is a property of the whole system, not the code.** SPARK
   can prove the code matches its contracts, but *the contracts* are
   the requirements, and if the requirements are wrong, proof buys
   you nothing. Ariane 5 Flight 501 had correct Ada code for the
   Ariane 4 envelope; the envelope changed. Read the MIB report.
2. **DO-178C Level A is the highest civil aviation rating.** It
   requires 71 objectives, including MC/DC structural coverage,
   requirement-based testing, and traceability through every level of
   the development lifecycle. SPARK discharges many objectives
   automatically via proof.
3. **SPARK has four analysis levels.** `--level=0` flow only;
   `--level=1` basic; `--level=2` default (proves absence of runtime
   errors); `--level=3` full (proves all contracts). Each level
   takes more time and more annotations. Plan from level 0 upward,
   not the other way around.
4. **Information flow is orthogonal to correctness.** `Global` and
   `Depends` contracts tell the prover which variables each
   subprogram reads and writes. This is its own analysis, and it
   catches bugs that functional correctness proofs miss (e.g.
   accidentally mutating a variable you claimed to only read).
5. **Bounded stacks, no heap, no recursion.** High-integrity Ada
   doesn't use dynamic allocation. Everything has a compile-time
   known bound. This sounds restrictive; in practice, it forces you
   to size the problem, which is also a requirement for certification
   anyway.

### 1-week plan

- Day 1: Read the Ariane 5 MIB report. Understand the *exact* failure
  mode. Come back when you can explain it in three sentences.
- Day 2: Install `gnatprove`. Write a tiny SPARK program (a factorial
  with a contract). Prove it at level 2.
- Day 3: Add a `Global => null` annotation. Prove that your function
  is pure. Then accidentally introduce a global read and watch the
  proof fail.
- Day 4: Read Ada RM Annex D (Real-Time Systems) Section H
  (Safety-Critical Systems). Short, dense, essential.
- Day 5: Port the generic stack from `language-core.md` Example 2 into
  SPARK. Add the `Type_Invariant`. Run `gnatprove` at level 2 and
  then level 3. Fix what breaks.
- Day 6: Read the DO-178C overview at AdaCore's learn site. Just the
  overview, not the full supplements.
- Day 7: Write up, in your own words, why SPARK makes flight code
  cheaper to certify than equivalent C code. Share the write-up with
  someone who will push back.

---

## Programming Examples

### Example 1: A SPARK factorial

```ada
-- File: fact.ads
package Fact with SPARK_Mode is
   function Factorial (N : Natural) return Natural
     with Pre  => N <= 12,
          Post => Factorial'Result >= 1;
end Fact;
```

```ada
-- File: fact.adb
package body Fact with SPARK_Mode is
   function Factorial (N : Natural) return Natural is
      Result : Natural := 1;
   begin
      for K in 1 .. N loop
         pragma Loop_Invariant (Result >= 1);
         Result := Result * K;
      end loop;
      return Result;
   end Factorial;
end Fact;
```

Build with `gnatprove --level=2 fact.ads`. The precondition bound of
12 is there because 13! overflows `Natural` on a 32-bit system; the
prover will flag the overflow risk without the bound.

### Example 2: A flow contract

```ada
package Counter with SPARK_Mode is
   Total : Natural := 0;

   procedure Increment
     with Global  => (In_Out => Total),
          Depends => (Total => Total);
end Counter;
```

The `Global` says `Increment` reads and writes `Total`. The `Depends`
says the new `Total` depends only on the old `Total`. If you
accidentally read some other variable inside the body, the prover
rejects it. This is information-flow analysis; it is catches bugs
tests cannot.

---

## DIY & TRY

### DIY 1 — Prove the absence of runtime errors in a real subroutine

Take the `Ceiling` example from `concurrency.md` Example 5. Add
`SPARK_Mode` and run `gnatprove --level=2`. Watch every VC get
discharged or flagged. Fix the flagged ones.

### DIY 2 — Write a buffer with a proven invariant

Define a ring buffer in SPARK with a `Type_Invariant` that the head,
tail, and count are consistent. Prove `Put` and `Get` preserve it.
This is a canonical SPARK exercise and there are public write-ups of
it you can compare against.

### DIY 3 — Read the Tokeneer case study

AdaCore published the full Tokeneer project as open source — a
biometric access-control system proved in SPARK. Clone it, read it,
prove it. It is the single best end-to-end example of an industrial
SPARK codebase.

### TRY — Port one component of a personal project to SPARK

Pick a single module — a parser, a scheduler, a state machine — from
something you already wrote. Extract it into a SPARK package. Add
contracts. Prove what you can; leave assume statements where you
cannot. Document what you learned about your own code in the process.

---

## Related College Departments (safety & SPARK)

- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
  — safety-critical engineering, requirements traceability,
  certification standards (DO-178C, IEC 61508, EN 50128).
- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)
  — Hoare logic, SMT solving, formal verification. The
  `mathematical-foundations-enrichment.md` file in `rca-deep` is a
  cross-reference.
- [**history**](../../../.college/departments/history/DEPARTMENT.md) —
  the Ariane 5, Therac-25, and Mars Climate Orbiter cases are the
  historical record that defines this discipline.
