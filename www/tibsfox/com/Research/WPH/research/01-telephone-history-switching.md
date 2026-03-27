# Telephone History & Switching Systems

> **Domain:** Telecommunications Engineering
> **Module:** 1 -- Wireline Foundations and Electromechanical Switching
> **Through-line:** *The telephone network is the longest-running continuously operated machine in human history. Every architectural decision made since 1876 -- from carbon granule microphones to SS7 signaling -- still echoes in the protocol stacks running on your smartphone today. Understanding the wireline foundation is not nostalgia. It is reading the source code of modern telecommunications.*

---

## Table of Contents

1. [The Invention and Its Context](#1-the-invention-and-its-context)
2. [Transducer Engineering](#2-transducer-engineering)
3. [Manual Switchboards and the Operator Era](#3-manual-switchboards-and-the-operator-era)
4. [Strowger Step-by-Step Switching](#4-strowger-step-by-step-switching)
5. [Crossbar Switching](#5-crossbar-switching)
6. [Electronic Switching Systems](#6-electronic-switching-systems)
7. [Signaling System 7](#7-signaling-system-7)
8. [The PSTN Architecture](#8-the-pstn-architecture)
9. [Transmission Engineering](#9-transmission-engineering)
10. [The Local Loop and Last Mile](#10-the-local-loop-and-last-mile)
11. [Numbering Plans and Routing](#11-numbering-plans-and-routing)
12. [Legacy and Modern Relevance](#12-legacy-and-modern-relevance)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. The Invention and Its Context

Alexander Graham Bell received US Patent #174,465 on March 7, 1876, for "the method of, and apparatus for, transmitting vocal or other sounds telegraphically" [1]. The first intelligible telephone transmission occurred three days later, on March 10, 1876, when Bell spoke the words "Mr. Watson, come here -- I want to see you" to his assistant Thomas Watson in their Boston laboratory [2].

The telephone did not emerge in isolation. The electromagnetic telegraph had been commercially operational since the 1840s, and Bell's work built directly on the existing understanding of electromagnetic transduction. What distinguished the telephone from the telegraph was the requirement for *continuous* signal representation rather than discrete on-off keying. The telegraph was digital; the telephone was analog from its first breath.

### The Patent Race

Bell's patent was filed mere hours before Elisha Gray's caveat for a similar device. The controversy over priority remains one of the most examined episodes in patent history [3]. Antonio Meucci had demonstrated a voice-communicating device as early as 1860, and the US House of Representatives passed a resolution in 2002 acknowledging his contributions [4]. Regardless of priority disputes, it was Bell's patent and the Bell Telephone Company (founded 1877) that built the commercial network.

```
TELEPHONE TIMELINE -- FOUNDATIONAL EVENTS
================================================================

1837  Morse telegraph demonstrated
1860  Meucci demonstrates voice communication device
1876  Bell patent #174,465; first telephone call
1877  Bell Telephone Company founded
1878  First telephone exchange (New Haven, CT)
1879  First intercity line (Lowell to Boston, MA)
1884  First long-distance line (Boston to New York)
1889  Strowger automatic exchange patented
1891  First Strowger exchange operational (La Porte, IN)
1915  First transcontinental call (Bell, NY to Watson, SF)
1927  First transatlantic telephone cable (TAT-1)
1935  First telephone call around the world
1956  TAT-1 submarine cable operational
1962  Telstar 1 -- first satellite telephone relay
1965  #1ESS electronic switch deployed
1976  #4ESS toll switch deployed
1980  SS7 standardized by CCITT (now ITU-T)
1984  Bell System divestiture (AT&T breakup)
```

### The Bell System

The Bell System grew from a single patent into the largest corporation in the world. At its peak, AT&T and its subsidiaries (the Bell Operating Companies) owned virtually every telephone in the United States, every local exchange, every long-distance trunk, and Western Electric manufactured every piece of equipment [5]. This vertical integration -- from the carbon in the microphone to the switching fabric in the central office -- produced extraordinary engineering consistency but also extraordinary monopoly power.

The 1984 divestiture, mandated by the Modified Final Judgment in the *United States v. AT&T* antitrust case, broke the Bell System into AT&T (long distance and Bell Labs) and seven Regional Bell Operating Companies (RBOCs): Ameritech, Bell Atlantic, BellSouth, NYNEX, Pacific Telesis, Southwestern Bell, and US West [6]. Pacific Northwest Bell, which served Oregon, Washington, and northern Idaho, became part of US West.

> **Related:** [PNW Telecom Heritage](05-pnw-telecom-heritage.md) for detailed coverage of Pacific Northwest Bell and US West.

---

## 2. Transducer Engineering

The telephone is fundamentally a pair of transducers connected by a transmission medium. The transmitter (microphone) converts acoustic pressure waves to electrical signals; the receiver (earpiece) converts electrical signals back to acoustic pressure waves. The quality of these transducers defined the quality of telephone service for over a century.

### Carbon Granule Microphone

Thomas Edison's carbon granule microphone (1877-1878) became the standard telephone transmitter and remained in service for over 100 years [7]. The operating principle: loose carbon granules are packed between two electrodes. Sound pressure waves compress the granules, reducing their electrical resistance and modulating a DC bias current. The device is self-amplifying -- the modulated current can be much larger than what an electromagnetic transducer alone could produce.

```
CARBON MICROPHONE -- OPERATING PRINCIPLE
================================================================

  Sound wave ──> Diaphragm ──> Compresses carbon granules
                                      |
                    ┌─────────────────┘
                    v
           Resistance decreases ──> Current increases
                    |
                    v
           DC bias modulated ──> Audio signal on line
                    |
                    v
           Signal power >> acoustic input power
           (inherent amplification, no external gain needed)

  Key parameters:
    Frequency response: ~300 Hz to ~3,400 Hz (telephone band)
    Dynamic range: ~30 dB
    Distortion: significant (nonlinear compression)
    Lifetime: decades (granules degrade slowly)
```

The carbon microphone's frequency response naturally limited the telephone band to approximately 300-3,400 Hz -- a range sufficient for speech intelligibility but not for music or high-fidelity audio. This bandwidth became codified in the G.711 codec standard (1972) and persists as the baseline for voice telephony today [8].

### Electromagnetic Receiver

The telephone earpiece uses an electromagnetic driver: a permanent magnet with a coil wound around it, driving a thin metal diaphragm. The audio signal in the coil modulates the magnetic field, causing the diaphragm to vibrate and reproduce sound. The receiver's impedance (typically 600 ohms) became a standard reference impedance for the entire telephone network [9].

> **SAFETY WARNING:** Early telephone systems carried ring voltage at 90V AC, 20 Hz, superimposed on a -48V DC battery feed. Contact with telephone line voltage during ringing can cause painful shock and, in rare cases, cardiac events. Modern POTS lines still carry these voltages [10].

---

## 3. Manual Switchboards and the Operator Era

The first telephone exchange opened in New Haven, Connecticut, in January 1878, serving 21 subscribers [11]. The switchboard was a simple affair: each subscriber had a line terminating at a jack on the board, and an operator connected calls by inserting patch cords between jacks.

### Cord Board Architecture

The manual cordboard remained the dominant switching technology from 1878 through the 1920s in urban areas (and much later in rural areas). At peak scale, the Bell System employed over 350,000 operators, predominantly young women, handling millions of calls daily [12].

Each operator position consisted of:
- A set of cord pairs (typically 6-10 pairs per position)
- Jack fields representing subscriber lines
- A key set for talking and signaling
- Supervisory lamps indicating call status (off-hook, ringing, connected)

The operator's job was cognitively demanding: routing required memorization of exchange boundaries, toll routes, and special services. A skilled operator could complete a local call setup in approximately 10 seconds [13].

### The Scaling Problem

Manual switching could not scale. Each new subscriber required a physical jack on every switchboard they might need to reach. For N subscribers, the number of possible connections grows as N(N-1)/2 -- quadratic scaling. By 1900, major cities had thousands of subscribers, and the operator workforce required to handle traffic was growing faster than the population [14].

This scaling crisis drove the search for automatic switching.

---

## 4. Strowger Step-by-Step Switching

Almon Brown Strowger, a Kansas City undertaker, patented the automatic telephone exchange in 1889 (US Patent #447,918). Legend holds that Strowger was motivated by a competitor whose wife worked as a telephone operator and allegedly redirected calls intended for Strowger's funeral parlor [15]. Whether apocryphal or not, the result was revolutionary.

### Operating Principle

The Strowger switch (also called step-by-step or SxS) is an electromechanical device that translates rotary dial pulses directly into physical switch positions. Each digit dialed causes the switch to step through positions:

```
STROWGER STEP-BY-STEP -- SWITCHING MECHANISM
================================================================

  Subscriber dials digit "5":
    Dial interrupts loop current 5 times
         |
         v
    Stepping relay advances 5 positions vertically
         |
         v
  Subscriber dials digit "3":
    Dial interrupts loop current 3 times
         |
         v
    Rotary relay advances 3 positions horizontally
         |
         v
  Wiper arm now contacts row 5, column 3 = line 53

  Physical structure:
    10 levels (rows) x 10 positions (columns) = 100 lines per switch
    Cascaded stages: first selector, second selector, connector
    4-digit number requires 4 switching stages

  Timing:
    Dial pulse rate: 10 pulses/sec (nominal)
    Make/break ratio: 60% break, 40% make
    Interdigit pause: 200-800 ms
```

The first Strowger exchange was installed in La Porte, Indiana, in 1892, serving approximately 75 subscribers [16]. The technology proved remarkably durable: Strowger exchanges remained in service worldwide into the 1990s, with some installations operating for over 60 years.

### Engineering Characteristics

- **Reliability:** Electromechanical components wear. Strowger switches required regular maintenance -- cleaning contacts, adjusting spring tensions, replacing worn wipers. A well-maintained exchange achieved approximately 99.9% availability [17].
- **Power consumption:** Each call in progress required continuous current through relay coils. Idle power was near zero (no electronics).
- **Noise:** Electromechanical switching produced audible clicks during call setup -- the characteristic sound of a rotary dial telephone connecting.
- **Capacity:** Limited by physical space. Each 10x10 switch handled 100 lines; large exchanges required rooms full of switch banks.

---

## 5. Crossbar Switching

Crossbar switching, developed at Bell Labs by G.A. Betulander (Swedish design, 1919) and refined by AT&T in the 1930s-1940s, represented a major architectural advance [18]. Unlike Strowger's step-by-step approach, crossbar switches separated the control function from the switching fabric.

### Architecture

A crossbar switch consists of a matrix of horizontal and vertical bars. At each intersection, a set of contacts can be closed by energizing both the horizontal select magnet and the vertical hold magnet simultaneously. The key innovation: a common control unit (the "marker") computed the path through the switch matrix and set all crosspoints simultaneously, rather than stepping through them one digit at a time.

```
CROSSBAR SWITCH MATRIX -- SIMPLIFIED
================================================================

         Col 1    Col 2    Col 3    Col 4    Col 5
        ──●──────●──────●──────●──────●──── Row 1
          |      |      |      |      |
        ──●──────●──────●──────●──────●──── Row 2
          |      |      |      |      |
        ──●──────●──────●──────●──────●──── Row 3
          |      |      |      |      |
        ──●──────●──────●──────●──────●──── Row 4
          |      |      |      |      |
        ──●──────●──────●──────●──────●──── Row 5

  ● = crosspoint (contacts closed when both row and column selected)

  Common control (Marker):
    1. Receives all digits from originating line
    2. Computes route through switching fabric
    3. Sets crosspoints simultaneously
    4. Releases control -- crosspoints hold via latching magnets
    5. Marker free to handle next call (shared resource)
```

### AT&T Crossbar Systems

- **No. 1 Crossbar (1938):** First AT&T crossbar for local service. Served up to 14,400 lines [19].
- **No. 4A Crossbar (1943):** Toll (long-distance) switching. Handled inter-exchange routing.
- **No. 5 Crossbar (1948):** The workhorse of the Bell System. Over 2,800 installations worldwide. Served up to 35,000 lines per office. Many remained in service into the 1990s [20].

### Advantages Over Step-by-Step

- **Common control:** The marker was a shared resource, serving many calls. Step-by-step required dedicated switch stages per call.
- **Non-blocking:** Properly dimensioned crossbar switches could find alternate paths if the primary path was busy.
- **Speed:** Call setup was faster because all switching happened after complete number reception, not digit-by-digit.
- **Maintenance:** Fewer moving parts per call; crosspoints lasted longer than Strowger wiper contacts.

---

## 6. Electronic Switching Systems

The transition from electromechanical to electronic switching began with Bell Labs' development of the #1ESS (Electronic Switching System), first deployed in Succasunna, New Jersey, on May 30, 1965 [21]. This was the first large-scale stored-program control telephone switch -- a real-time computer controlling a switching network.

### #1ESS Architecture

The #1ESS used a ferreed (ferrite/reed relay) switching network controlled by a duplicated stored-program computer. The control computer ran a purpose-built operating system that processed call setup instructions from memory -- the first time telephone switching logic was implemented in software rather than hard-wired relay circuits [22].

```
#1ESS ARCHITECTURE
================================================================

  Subscriber Lines ──> Line Scanner ──> Central Control
                                              |
                        ┌─────────────────────┘
                        v
                  Stored Program
                  (call processing logic in memory)
                        |
                        v
                  Network Controller
                        |
                        v
                  Ferreed Switching Network
                  (8-stage space-division matrix)
                        |
                        v
                  Trunk circuits ──> Other exchanges

  Key specifications:
    Capacity: 10,000-65,000 lines
    Call processing: 200,000+ calls/busy hour
    Computer: duplicated processors (hot standby)
    Memory: twistor memory (permanent), ferrite core (temporary)
    Software: ~100,000 words of program + call store
    Reliability target: 2 hours downtime in 40 years
```

### ESS Family Evolution

- **#1ESS (1965):** Local exchange. Ferreed network. First stored-program switch [21].
- **#2ESS (1969):** Smaller community offices. 1,000-10,000 lines [23].
- **#3ESS (1976):** Small rural offices. 600-4,500 lines. First ESS with semiconductor memory.
- **#4ESS (1976):** Toll switch. The backbone of AT&T's long-distance network. Capacity: 107,000 trunks, 550,000 calls per busy hour [24].
- **#5ESS (1982):** The last and most capable. Digital time-division switching. Up to 100,000 lines. Modular distributed architecture. Became the most widely deployed large switch in the world [25].

### The #5ESS and Digital Switching

The #5ESS introduced true digital switching using time-slot interchange (TSI). Voice was digitized at the line interface using pulse-code modulation (PCM) at 8,000 samples/second, 8 bits/sample = 64 kbps per voice channel (DS-0). Switching was performed by rearranging time slots in a TDM (time-division multiplexed) frame rather than physically connecting circuits [25].

This was the convergence point: once voice was digital, switching became a memory operation. The #5ESS processed calls by reading digitized voice samples from one time slot and writing them to another -- no physical crosspoints, no reed relays, no contact wear.

> **Related:** [Cellular Evolution](02-cellular-evolution-1g-5g.md) for how digital switching enabled the Mobile Telephone Switching Office (MTSO).

---

## 7. Signaling System 7

Signaling System 7 (SS7), standardized by the CCITT (now ITU-T) beginning in 1980, is the out-of-band signaling protocol that controls the global telephone network [26]. Before SS7, signaling traveled in-band -- the same circuit that carried voice also carried control tones (multi-frequency signaling). This created both engineering limitations and security vulnerabilities (phone phreaking).

### SS7 Architecture

SS7 separates signaling from voice onto a dedicated packet-switched data network. The signaling network carries messages between switching nodes to set up, manage, and tear down calls.

```
SS7 PROTOCOL STACK
================================================================

  Layer 4:  TCAP (Transaction Capabilities Application Part)
            -- database queries, supplementary services

  Layer 3:  ISUP  (ISDN User Part) -- call setup/teardown
            SCCP  (Signaling Connection Control Part) -- routing
            MAP   (Mobile Application Part) -- cellular roaming

  Layer 2:  MTP Level 3 (Message Transfer Part) -- network routing
            MTP Level 2 -- link-level error correction

  Layer 1:  MTP Level 1 -- 56/64 kbps signaling links (DS-0)

  Node types:
    SSP (Service Switching Point) -- telephone exchange
    STP (Signal Transfer Point) -- signaling router
    SCP (Service Control Point) -- database (800 number lookup, LNP)
```

### Key SS7 Capabilities

- **Call setup before circuit allocation:** SS7 verifies the destination is available before connecting the voice path, eliminating wasted circuit time [27].
- **Global title translation:** Enables number portability -- your phone number is no longer tied to a physical switch.
- **Intelligent Network services:** 800/888 numbers, calling card validation, caller ID, call waiting, call forwarding -- all implemented via SS7 database queries [28].
- **Mobile support:** The MAP (Mobile Application Part) enables cellular roaming, handoff signaling, and SMS delivery.

### SS7 and Security

SS7 was designed in an era of trusted carriers. The protocol has no authentication mechanism -- any node on the SS7 network can send messages claiming to be any other node. This architectural trust has been exploited for surveillance and fraud, as documented by security researchers [29].

> **SAFETY WARNING:** SS7 vulnerabilities enable call interception, SMS interception, and location tracking. Two-factor authentication via SMS is considered insecure by NIST (SP 800-63B) partly due to SS7 weaknesses. These are known, documented vulnerabilities in active production networks [29].

---

## 8. The PSTN Architecture

The Public Switched Telephone Network (PSTN) is a hierarchical network organized into switching levels. At its peak, the North American PSTN operated as a five-level hierarchy [30].

### Switching Hierarchy

```
PSTN SWITCHING HIERARCHY (NORTH AMERICA, PRE-1991)
================================================================

  Class 1: Regional Center (RC)
            -- 10 centers in North America
            -- interconnected in full mesh
            |
  Class 2: Sectional Center (SC)
            -- ~70 centers
            |
  Class 3: Primary Center (PC)
            -- ~230 centers
            |
  Class 4: Toll Center (TC)
            -- ~1,300 centers (4ESS switches)
            |
  Class 5: End Office (EO)
            -- ~19,000 offices (5ESS, DMS-100 switches)
            -- connects directly to subscriber lines
            |
  Subscriber (POTS line)

  Routing rule: calls route down to lowest common point
  Final route: if all direct trunks busy, route up hierarchy
  Maximum hops: 9 (worst case, Class 5 to Class 1 to Class 5)
```

After the 1984 divestiture, the hierarchy was simplified. Dynamic routing algorithms (DNHR, RTNR) replaced the rigid hierarchical rules, allowing switches to compute routes based on real-time trunk availability [31].

### Traffic Engineering

Telephone traffic is measured in Erlangs, where 1 Erlang equals one circuit occupied continuously for one hour. The Erlang B formula calculates the probability that a call will be blocked (all circuits busy) given the offered traffic load and number of circuits [32]:

```
ERLANG B FORMULA
================================================================

  B(N, A) = (A^N / N!) / sum(k=0 to N)(A^k / k!)

  Where:
    N = number of circuits (trunks)
    A = offered traffic in Erlangs
    B = blocking probability (Grade of Service)

  Design target: B = 0.01 (1% blocking) for business lines
                 B = 0.02 (2% blocking) for residential lines

  Example:
    100 Erlangs offered, target B = 0.01
    Requires approximately 117 trunks
```

This mathematical foundation, developed by A.K. Erlang at the Copenhagen Telephone Company in 1917, remains the basis for capacity planning in both wireline and wireless networks [32].

---

## 9. Transmission Engineering

Transmitting voice over copper wire required solving the problem of signal attenuation over distance. Key developments:

### Loading Coils

Michael Pupin and George Campbell independently developed loading coil technology (1899-1900), which added inductance to telephone lines at regular intervals to reduce attenuation at voice frequencies [33]. Loading coils extended the reach of copper pairs from a few miles to 15-20 miles. The H88 loading scheme (88 mH coils spaced at 6,000-foot intervals) became the North American standard.

### Repeaters and Amplifiers

Lee de Forest's audion tube (1906) and its successors enabled electronic amplification, making transcontinental telephony possible. The first transcontinental call (New York to San Francisco, January 25, 1915) used vacuum tube repeaters [34].

### Digital Transmission: T-Carrier

Bell Labs introduced the T1 carrier system in 1962, the first commercial digital transmission system. T1 multiplexed 24 voice channels (each sampled at 8 kHz, 8-bit mu-law PCM = 64 kbps) into a 1.544 Mbps data stream [35].

```
T-CARRIER HIERARCHY (NORTH AMERICA)
================================================================

  DS-0:    64 kbps       -- 1 voice channel
  DS-1:    1.544 Mbps    -- 24 DS-0 channels (T1)
  DS-2:    6.312 Mbps    -- 96 DS-0 channels (T2)
  DS-3:    44.736 Mbps   -- 672 DS-0 channels (T3)
  DS-4:    274.176 Mbps  -- 4,032 DS-0 channels (T4)

  European hierarchy (E-carrier):
  E-1:     2.048 Mbps    -- 30 voice + 2 signaling channels
  E-3:     34.368 Mbps   -- 480 voice channels
```

The T1 system launched the digital revolution in telecommunications. Every subsequent technology -- ISDN, DSL, SONET, cellular backhaul -- builds on the PCM foundation established by T-carrier [35].

---

## 10. The Local Loop and Last Mile

The local loop is the copper pair connecting the subscriber's premises to the central office (end office). This "last mile" has been the most persistent element of the telephone network -- many of the copper pairs in service today were installed decades ago [36].

### Plain Old Telephone Service (POTS)

A POTS line provides:
- **-48V DC battery feed** from the central office (powers the telephone, no local electricity needed)
- **90V AC ring signal** at 20 Hz (alerts the subscriber)
- **Loop current:** 20-100 mA when off-hook (signals the exchange that the line is in use)
- **Bandwidth:** 300-3,400 Hz (voice band)
- **Power:** Self-powered from central office battery; survives local power outages

This design -- telephone powered by the central office -- was a deliberate reliability decision. During power outages, POTS lines continue to function as long as the central office has backup generators and battery reserves, which by regulation must provide at minimum 8 hours of service [37].

### DSL: Data Over the Loop

Digital Subscriber Line (DSL) technology exploited the fact that copper pairs have usable bandwidth far beyond the 3.4 kHz voice band. ADSL (Asymmetric DSL) uses frequencies from approximately 25 kHz to 1.1 MHz for data while preserving the 0-4 kHz band for voice [38]. This dual use -- voice and data on the same copper pair -- extended the economic life of the local loop infrastructure by decades.

---

## 11. Numbering Plans and Routing

The North American Numbering Plan (NANP), established in 1947 by AT&T and Bell Labs, created the area code system still in use today [39]. The original NANP assigned three-digit area codes in the format NXX, where N is 2-9 and X is 0-1 (the middle digit restriction). This design enabled Strowger switches to distinguish area codes from exchange codes by the second digit.

### Numbering Plan Structure

```
NANP NUMBER FORMAT
================================================================

  +1 (NPA) NXX-XXXX

  Country code: 1 (North America)
  NPA: Numbering Plan Area (area code) -- 3 digits
  NXX: Central office code (exchange) -- 3 digits
  XXXX: Subscriber number -- 4 digits

  Total: 10 digits (7 for local, 10 for long distance)

  Special codes:
    N11: service codes (911, 411, 611, etc.)
    NXX=555: fictional/information
    800/888/877/866: toll-free (INWATS)
    900: premium rate

  Capacity:
    ~800 NPAs x ~800 NXXs x 10,000 subscribers
    = ~6.4 billion possible numbers
    (actual usable significantly less due to reserved codes)
```

Local Number Portability (LNP), mandated by the Telecommunications Act of 1996, broke the fixed association between phone number and physical switch. LNP uses SS7 database queries to determine the current serving switch for any ported number [40].

---

## 12. Legacy and Modern Relevance

The wireline telephone network's engineering decisions persist in modern telecommunications:

- **64 kbps voice channel:** Still the fundamental unit of voice bandwidth (DS-0), carried through VoIP as G.711 codec [8].
- **600-ohm impedance:** Remains the reference impedance for audio engineering.
- **300-3,400 Hz voice band:** Defines narrowband voice codec design; wideband (AMR-WB, 50-7,000 Hz) is a deliberate expansion of this baseline.
- **SS7 protocol structure:** Evolved into Diameter protocol for 4G/5G networks but retains the concept of out-of-band signaling [26].
- **Erlang traffic model:** Applied to cellular capacity planning, web server sizing, and call center staffing [32].
- **Hierarchical routing:** The internet's BGP autonomous system hierarchy echoes the PSTN's switching hierarchy.
- **Reliability engineering:** The "five nines" (99.999%) availability target originated in telephone switch design and became the standard for all critical infrastructure [21].

The PSTN is being decommissioned. AT&T received FCC authorization to begin retiring copper POTS infrastructure in 2022, with fiber and wireless replacement [41]. But the protocols, the traffic engineering mathematics, the reliability standards, and the numbering plans will outlive the copper.

> **Related:** [VoIP & SIP Convergence](03-voip-sip-convergence.md) for how packet networks replaced circuit switching. [Cellular Evolution](02-cellular-evolution-1g-5g.md) for how wireless inherited the PSTN's architecture.

---

## 13. Cross-References

- **SHE (Smart Home):** POTS-powered devices, home telephone wiring, DECT cordless protocols
- **SYS (Systems Admin):** Central office as data center precedent, reliability engineering, five-nines target
- **CMH (Computational Mesh):** SS7 as precursor to mesh signaling protocols, distributed routing
- **LED (LED & Controllers):** Indicator lamps on switchboards, panel displays in ESS equipment
- **RBH (Radio History):** Shared spectrum management lineage, regulatory history
- **PSS (PNW Signal Stack):** SS7 as regional signaling infrastructure, PNW trunk routing
- **BRC (Black Rock City):** Temporary telephone infrastructure at events, POTS resilience model

---

## 14. Sources

1. Bell, A.G. "Improvement in Telegraphy." US Patent 174,465, March 7, 1876.
2. Casson, H.N. *The History of the Telephone.* A.C. McClurg & Co., 1910.
3. Shulman, S. *The Telephone Gambit: Chasing Alexander Graham Bell's Secret.* W.W. Norton, 2008.
4. US House Resolution 269, 107th Congress, June 11, 2002. "Expressing the sense of the House regarding Antonio Meucci."
5. Brooks, J. *Telephone: The First Hundred Years.* Harper & Row, 1975.
6. United States v. AT&T, Modification of Final Judgment, August 24, 1982. 552 F. Supp. 131 (D.D.C. 1982).
7. Edison, T.A. "Carbon Telephone Transmitter." US Patent 474,230, 1892. Referenced in Hounshell, D.A. *From the American System to Mass Production.* Johns Hopkins, 1984.
8. ITU-T Recommendation G.711, "Pulse Code Modulation (PCM) of Voice Frequencies," 1972 (revised 1988).
9. Talley, D. *Basic Telephone Switching Systems.* Hayden, 1969.
10. Bigelow, S.J. *Understanding Telephone Electronics.* Newnes, 2001. Chapter 2: "The Telephone Set."
11. Fischer, C.S. *America Calling: A Social History of the Telephone to 1940.* University of California Press, 1992.
12. Lipartito, K. "When Women Were Switches: Technology, Work, and Gender in the Telephone Industry, 1890-1920." *American Historical Review* 99.4 (1994): 1075-1111.
13. AT&T Archives. "Telephone Switching -- A Brief History." AT&T Technical Journal, 1979.
14. Mueller, M.L. *Universal Service: Competition, Interconnection, and Monopoly in the Making of the American Telephone System.* MIT Press, 1997.
15. Strowger, A.B. "Automatic Telephone Exchange." US Patent 447,918, March 10, 1891.
16. Chapuis, R.J. and Joel, A.E. *100 Years of Telephone Switching (1878-1978).* North-Holland, 1982.
17. Joel, A.E. *A History of Engineering and Science in the Bell System: Switching Technology (1925-1975).* Bell Telephone Laboratories, 1982.
18. Betulander, G.A. "Crossbar Switching System." Ericsson Review, 1919. Cited in Chapuis & Joel, 1982.
19. Craft, E.B. et al. "Machine Switching Telephone System for Large Metropolitan Areas." *Bell System Technical Journal* 9.3 (1930): 443-492.
20. Keister, W. et al. *The Design of Switching Circuits.* Van Nostrand, 1951.
21. Keister, W. et al. "No. 1 Electronic Switching System." *Bell System Technical Journal* 43.5 (1964): 1831-1882.
22. Ritchie, D.M. "The Evolution of the Unix Time-sharing System." *Bell System Technical Journal* 63.6 (1984): 1577-1593. (Unix originated on hardware procured for ESS development.)
23. Joel, A.E. "An Experimental Switching System Using New Electronic Techniques." *Bell System Technical Journal* 37.5 (1958): 1091-1124.
24. Nyman, F.H. "No. 4 ESS -- A New Toll Switching System." *Bell System Technical Journal* 56.7 (1977): 1015-1041.
25. Carney, D.L. et al. "The 5ESS Switching System." *AT&T Technical Journal* 64.6 (1985): 1339-1356.
26. ITU-T Recommendation Q.700, "Introduction to CCITT Signalling System No. 7," 1993.
27. Modarressi, A.R. and Skoog, R.A. "Signaling System No. 7: A Tutorial." *IEEE Communications Magazine* 28.7 (1990): 19-35.
28. Berman, R.D. and Brewster, R.L. "Intelligent Network Services." *AT&T Technical Journal* 72.5 (1993): 2-12.
29. Engel, T. "Locating Mobile Phones using Signalling System #7." Presented at 25th Chaos Communication Congress (25C3), 2008.
30. Bellcore. *BOC Notes on the LEC Networks -- 1994.* Special Report SR-2275, Issue 2.
31. Ash, G.R. *Dynamic Routing in Telecommunications Networks.* McGraw-Hill, 1997.
32. Erlang, A.K. "Solution of Some Problems in the Theory of Probabilities of Significance in Automatic Telephone Exchanges." *Elektroteknikeren* 13 (1917). English translation in *The Life and Works of A.K. Erlang,* Copenhagen Telephone Company, 1948.
33. Pupin, M.I. "Propagation of Long Electrical Waves." *Transactions of the AIEE* 17 (1900): 245-272.
34. Rhodes, F.L. *Beginnings of Telephony.* Harper & Brothers, 1929.
35. Fultz, K.E. and Penick, D.B. "The T1 Carrier System." *Bell System Technical Journal* 44.7 (1965): 1405-1451.
36. Starr, T. et al. *Understanding Digital Subscriber Line Technology.* Prentice Hall, 1999.
37. FCC Rules 47 CFR 12.4, "Network Reliability and Resiliency."
38. ITU-T Recommendation G.992.1, "Asymmetric Digital Subscriber Line (ADSL) Transceivers," 1999.
39. AT&T. "Notes on Distance Dialing -- 1955." AT&T Long Lines, Section 2: "The Nationwide Numbering Plan."
40. FCC Report and Order 96-286, "Telephone Number Portability," July 2, 1996.
41. FCC WC Docket No. 20-311, "Modernizing Telecommunications Regulations Regarding Retirement of Copper Networks," 2022.
