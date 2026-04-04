# Study Guide: Radio Communications for Emergencies

## When the Towers Go Silent

Cell phones work because of infrastructure. Cell towers, fiber optic backbones, switching centers, power grids. Remove any link in that chain --- a downed tower, a severed fiber line, a failed generator --- and the phone in your pocket becomes an expensive flashlight. In a localized emergency, cell networks degrade. In a regional disaster, they fail.

The Cascadia scenario is instructive. A magnitude 9.0 earthquake on the Cascadia Subduction Zone would damage or destroy cell towers across western Washington, Oregon, and northern California. The towers that survive the shaking may lose grid power, and their backup generators (typically sized for 8-24 hours of operation) will exhaust their fuel within a day. The fiber optic lines that connect towers to the switching network run through the same highway corridors that will be severed by landslides, bridge collapses, and liquefaction. Within hours, cell service across the affected region will be spotty. Within a day, it will be largely absent. Landline telephone service, which depends on copper infrastructure and central office switching equipment, will fail similarly --- central offices need power, and the copper lines run through the same damaged corridors.

Radio works differently. A radio transmitter generates an electromagnetic wave that propagates through the atmosphere. No towers required. No fiber optic backbone. No power grid. As long as the radio has batteries (or a hand crank, or a solar charger), it transmits and receives. This is why, in every major disaster --- from Hurricane Katrina to the Tohoku earthquake to the Joplin tornado --- the people with radios were the people who could communicate. They could call for help. They could coordinate with neighbors. They could receive emergency information. They could be useful.

This study guide walks through the radio communications landscape from complete beginner to community emergency volunteer. Each level builds on the previous one, and each level is achievable with modest cost and effort.

---

## Level 0: NOAA Weather Radio --- Every PNW Household Should Have One

### What It Is

NOAA Weather Radio All Hazards (NWR) is a nationwide network of radio stations that broadcast continuous weather information, warnings, watches, and emergency alerts directly from the National Weather Service. The network covers 95% of the U.S. population from over 1,000 transmitter sites.

### Why It Matters

In an emergency, NOAA Weather Radio is the primary broadcast channel for life-safety information. It is how the National Weather Service disseminates tornado warnings, tsunami warnings, earthquake alerts, AMBER alerts, nuclear incident notifications, and other emergency messages. Unlike television or internet, which require functioning infrastructure, NOAA Weather Radio requires only a receiver with batteries.

The Specific Area Message Encoding (SAME) system allows weather radios to filter alerts for your specific county. A SAME-capable radio sits silent until an alert is issued for your area, then activates with an alarm tone followed by the alert message. This means you can leave it on your nightstand, and it will wake you at 3 AM if a tsunami warning is issued for your coastal county --- even if your phone is dead and the power is out.

### What to Buy ($20-30)

- **Midland WR120B** (~$25): The community standard. SAME capable, battery backup, desktop unit. Simple to program.
- **Midland ER310** (~$35): Includes hand crank, solar panel, flashlight, and USB charging port. Doubles as an emergency radio for your go bag.
- **Eton FRX3+** (~$40): Similar feature set to the Midland ER310. Good build quality, hand crank charging.
- Any NOAA-capable radio will work. The key feature is **SAME capability** --- the ability to program your county code so you only receive alerts relevant to your location.

### Setup (5 Minutes)

1. Insert batteries (backup for when power is out).
2. Plug in the radio (it runs on AC power normally, switches to battery during outages).
3. Program your SAME county code. Find your county code at weather.gov/nwr/counties. For example: King County, WA = 053033. Snohomish County, WA = 053061. Multnomah County, OR = 041051.
4. Set the radio to "alert" mode. It will sit silent until an alert is issued for your county, then activate.
5. Place it where you can hear the alert tone --- bedroom is ideal for nighttime alerts.

That is all. For $25 and 5 minutes of setup, you have a receiver that will broadcast emergency information to your home regardless of whether the power grid, cell network, or internet is functioning. If you do nothing else in this study guide, do this.

---

## Level 1: FRS/GMRS Walkie-Talkies --- Talking to Your Neighbors

### What They Are

Family Radio Service (FRS) and General Mobile Radio Service (GMRS) are two-way radio services that operate on frequencies in the 462 and 467 MHz UHF band. Modern consumer walkie-talkies typically operate on both FRS and GMRS frequencies.

**FRS:** No license required. Limited to 2 watts of power on most channels and 0.5 watts on shared channels. Range: 0.5 to 2 miles in realistic conditions (suburban/urban environments with buildings and terrain). The manufacturer claims of "35-mile range" are measured under idealized line-of-sight conditions that do not exist in the real world.

**GMRS:** Requires an FCC license ($35 for 10 years, covers the license holder and their immediate family, no exam required). Allows up to 5 watts of power on GMRS-only channels and access to GMRS repeaters (which extend range significantly). Range: 1-5 miles without a repeater, potentially 15-30 miles through a repeater.

### Why They Matter for Emergencies

When cell service is down, FRS/GMRS radios provide immediate, no-infrastructure communication within a neighborhood or community. Family members in different parts of the house, yard, or neighborhood can coordinate. Neighbors can share information ("the water main on 5th street is broken," "the fire department is staging at the school"). Search teams can communicate. The radius is small, but in the first hours and days of a disaster, most of your critical communication needs are local.

### What to Buy ($30-60 per pair)

- **Motorola T800** (~$50/pair): Bluetooth-capable, emergency alert feature, NOAA weather channels, IPX4 water resistance. A solid all-purpose option.
- **Midland GXT1000VP4** (~$55/pair): 50-channel, NOAA weather, SOS siren, splash-proof. Popular for outdoor use.
- **Baofeng BF-88ST** (~$25/pair): Budget option. FRS-only (2 watts). Basic but functional. Surprisingly capable for the price.

**Practical tip:** Buy at least two pairs (four radios). Keep one pair in your go bag, one pair at home. Assign a family channel and a community channel. Pre-program the channels before you need them. In an emergency, there is no time to read the manual.

### How to Use Them

1. **Turn on.** Select a channel. All radios in your group must be on the same channel.
2. **Press and hold the PTT (Push-To-Talk) button** to transmit. Release to listen. You cannot transmit and receive simultaneously.
3. **Speak clearly and concisely.** Radio communication is half-duplex (one person talks at a time). Say what you need to say, then release PTT and listen.
4. **Use plain language.** Say "this is Sarah at the house, is anyone at the school?" Not "breaker breaker one-niner."
5. **Say "over" when you are done transmitting and expect a response.** This signals the other party that it is their turn.
6. **Say "out" when the conversation is finished.** This tells everyone on the channel that the exchange is complete.

### Channel Plan

Agree on a channel plan with your family and immediate neighbors before a disaster:

| Channel | Assignment |
|---|---|
| 1 (FRS 1, 462.5625 MHz) | Community general communication |
| 3 (FRS 3, 462.6125 MHz) | Family A |
| 5 (FRS 5, 462.6625 MHz) | Family B |
| 7 (FRS 7, 462.7125 MHz) | Emergency/medical (reserved for urgent traffic) |

Pre-program these into every radio. Write the channel assignments on a card and include it in your go bag.

---

## Level 2: Ham Radio --- The Backbone of Disaster Communications

### What It Is

Amateur radio (ham radio) is a licensed radio service that grants operators access to a wide range of frequencies with relatively high power, enabling communications from across a neighborhood to around the world. It is the most capable, most versatile, and most organized form of civilian radio communication, and it is the backbone of volunteer disaster communications in the United States.

### Why Ham Radio Is the Gold Standard for Emergencies

1. **Range:** Depending on the band and conditions, ham radio operators can communicate from a few miles (VHF/UHF) to thousands of miles (HF). In a regional disaster, ham operators can relay messages out of the affected area to request resources and communicate with federal emergency management.
2. **Repeaters:** Ham radio repeaters are relay stations, usually on hilltops or tall buildings, that receive a signal on one frequency and retransmit it on another, dramatically extending the range of a handheld radio. A 5-watt handheld radio that can reach 3 miles on its own can reach 30-50 miles through a repeater. Most repeaters have backup power (batteries, generators, solar) specifically because they are designed to function during emergencies.
3. **Organization:** Amateur Radio Emergency Service (ARES) and Radio Amateur Civil Emergency Service (RACES) are organized volunteer groups that train specifically for disaster communications. They participate in regular exercises, maintain equipment caches, and have established relationships with local emergency management agencies. In a major disaster, ARES/RACES volunteers are often the first functioning communication link between isolated communities and the outside world.
4. **Self-sufficiency:** A ham radio setup can operate entirely off-grid: a handheld radio with rechargeable batteries, a small solar panel, and a wire antenna hung from a tree. No infrastructure required.

### Getting Licensed: The Technician Exam

The entry-level ham radio license is the Technician class. It grants access to all amateur radio frequencies above 30 MHz (VHF and UHF --- the bands used for local and regional communication, including repeater access) plus limited privileges on some HF bands.

**The exam:**
- 35 multiple-choice questions drawn from a published question pool of approximately 400 questions
- Passing score: 26 correct (74%)
- No Morse code requirement (eliminated in 2007)
- Study time: 1-2 weeks for most people, studying 30-60 minutes per day
- Cost: $15 exam fee (some testing sessions are free) plus a $35 FCC license fee (valid for 10 years)

**Free study resources:**
- **HamStudy.org** --- Free online practice exams and flashcards. The single best study resource. The site tracks your progress and focuses on the questions you are getting wrong.
- **ARRL Ham Radio License Manual** ($30, optional) --- The official study guide. Thorough but not required if you use HamStudy.org.
- **KB6NU's "No-Nonsense Technician Class License Study Guide"** (free PDF) --- A stripped-down study guide that covers exactly what you need to pass the exam and nothing more.
- **Ham Radio Crash Course** (YouTube) --- Video walkthroughs of the question pool. Good for visual learners.

**Finding an exam session:**
- Search at arrl.org/find-an-amateur-radio-license-exam-session
- Most exams are administered by local ham radio clubs on weekends
- Some sessions are online (remote proctored)
- Bring government-issued ID, exam fee, and a pencil

**The exam covers:** Basic electronics, radio wave propagation, FCC regulations, operating procedures, antenna fundamentals, and electrical safety. It is not difficult. The question pool is published --- every possible exam question and its correct answer is available at hamstudy.org. If you can spend two weeks studying flashcards, you can pass.

### Your First Ham Radio: The Baofeng UV-5R ($25-30)

The Baofeng UV-5R is a Chinese-manufactured VHF/UHF handheld transceiver that costs less than a family dinner and is surprisingly capable. It transmits on the 2-meter (VHF, 144-148 MHz) and 70-centimeter (UHF, 420-450 MHz) amateur bands --- the two most commonly used bands for local and repeater communications.

**Why the Baofeng:**
- $25-30 for a radio that is functionally equivalent to name-brand handhelds costing $150-300
- Includes battery, charger, antenna, belt clip, and earpiece
- Dual-band (VHF + UHF), dual-display, 5 watts of power
- Programmable with free software (CHIRP) for easy channel and repeater setup

**Caveats:**
- Build quality is lower than Yaesu, Icom, or Kenwood handhelds. The antenna is mediocre (upgrade to a Nagoya NA-771 whip antenna for $10 and double your effective range).
- The user interface is unintuitive. Program it with CHIRP software on a computer rather than trying to manually punch in frequencies on the keypad.
- Front-end filtering is poor, which can cause problems near strong transmitters (broadcast towers, paging systems). Not usually an issue in residential areas.

**For a first radio on a budget, the Baofeng UV-5R is hard to beat.** You can always upgrade to a Yaesu FT-65R ($80), Kenwood TH-D75A ($500), or Icom IC-705 ($1,300) later. The Baofeng gets you on the air for the cost of a book.

### Programming Your Radio: Local Repeaters

A handheld radio talking to another handheld radio (simplex communication) has a range of 1-5 miles in typical terrain. A handheld radio talking through a repeater has a range of 15-50 miles. Repeaters are the force multiplier.

**Find local repeaters:**
- **RepeaterBook.com** --- The comprehensive database of amateur radio repeaters in the United States and worldwide. Search by location, frequency, or band. Each listing includes the repeater's input frequency, output frequency, CTCSS/PL tone (required for access), offset, and location.

**PNW repeater examples:**

| Repeater | Frequency | Tone | Location | Coverage |
|---|---|---|---|---|
| WW7SEA | 146.960 MHz | 103.5 Hz | Seattle, Tiger Mountain | Seattle metro, Eastside, south to Tacoma |
| W7FLY | 146.740 MHz | 103.5 Hz | Paine Field, Everett | Snohomish County, north King County |
| K7RPT | 147.100 MHz | 103.5 Hz | Cougar Mountain | Eastside, Issaquah, Sammamish |
| N7OEP | 146.860 MHz | 114.8 Hz | Portland, Council Crest | Portland metro |

Program 10-20 local repeaters into your radio using CHIRP. In an emergency, scan through them to find active communications.

### The Phonetic Alphabet

When transmitting call signs, names, or critical information over radio, use the NATO phonetic alphabet to prevent misunderstanding. Letters that sound similar (B/D/E, M/N, S/F) are replaced by unambiguous words.

| Letter | Word | Letter | Word |
|---|---|---|---|
| A | Alpha | N | November |
| B | Bravo | O | Oscar |
| C | Charlie | P | Papa |
| D | Delta | Q | Quebec |
| E | Echo | R | Romeo |
| F | Foxtrot | S | Sierra |
| G | Golf | T | Tango |
| H | Hotel | U | Uniform |
| I | India | V | Victor |
| J | Juliet | W | Whiskey |
| K | Kilo | X | X-ray |
| L | Lima | Y | Yankee |
| M | Mike | Z | Zulu |

**Example:** The call sign KI7ABC would be spoken as: "Kilo India Seven Alpha Bravo Charlie."

### Making a Radio Call

The basic format for initiating a call on a repeater:

1. **Listen first.** Before transmitting, listen for 15-30 seconds to make sure the frequency is not in use. Transmitting over an ongoing conversation is poor practice and, in an emergency, could block critical traffic.
2. **Key up and identify:** Press PTT, wait half a second for the repeater to activate, then: "[Called station call sign], this is [your call sign]." Example: "KI7XYZ, this is KI7ABC."
3. **If calling anyone (not a specific station):** "This is KI7ABC, monitoring." or "KI7ABC, looking for a signal check."
4. **During the conversation:** Identify with your call sign every 10 minutes and at the end of the contact (FCC requirement).
5. **End the conversation:** "KI7ABC, clear." or "73" (which means "best regards" in ham shorthand --- one of the oldest codes in radio, dating to 1857).

**In an emergency:** The standard emergency call on amateur radio is: "BREAK BREAK BREAK, this is [call sign], I have emergency traffic." This clears the frequency for your transmission. Any station hearing this is expected to yield the frequency and assist.

---

## Level 3: ARES/RACES --- Organized Volunteer Emergency Communications

### What ARES Is

The Amateur Radio Emergency Service (ARES) is a program of the American Radio Relay League (ARRL) that organizes licensed amateur radio operators for emergency communications. ARES groups operate at the county or regional level, participate in regular training exercises (often in partnership with county emergency management), and deploy during actual emergencies.

### What RACES Is

The Radio Amateur Civil Emergency Service (RACES) is the civil defense component of amateur radio emergency communications, established under Part 97 of FCC rules. RACES operators serve under the direction of a local or state civil defense (emergency management) agency during a declared emergency.

In practice, most amateur emergency communicators are registered with both ARES and RACES, and the operational distinction between the two has blurred in many jurisdictions.

### Why You Should Join Before the Disaster

When a disaster strikes, emergency management agencies need communicators immediately. They do not have time to train you, verify your license, test your equipment, or teach you their procedures. If you are already a registered ARES/RACES member, you are:

- On the activation list (you receive the call-up)
- Familiar with the local communication plan (frequencies, repeaters, nets, reporting formats)
- Known to the emergency management staff (they have worked with you in exercises)
- Trained in ICS-compatible communication procedures (see [ICS study guide](incident-command-basics.md))
- Equipped and tested (your radio gear has been verified during exercises)

### PNW ARES Groups

| Group | Area | Website/Contact |
|---|---|---|
| King County ARES | King County, WA | kc-ares.org |
| Snohomish County ACS | Snohomish County, WA | scacs.org |
| Pierce County ARES | Pierce County, WA | w7apc.org |
| Multnomah County ARES | Portland, OR | mcarc.net |
| Clark County ARES | Clark County, WA | w7aia.org |
| Skagit County ACS | Skagit County, WA | Prior to field day activities, search ARRL for local info |
| Whatcom County ARES | Bellingham, WA | Prior to field day activities, search ARRL for local info |

### How to Join

1. Get your Technician license (see Level 2 above).
2. Contact your local ARES/RACES group (websites above, or search arrl.org for your section/county).
3. Attend a meeting. Most groups meet monthly. They are welcoming --- amateur radio culture is built on mentorship (called "Elmering" in ham tradition).
4. Register with the group and your local emergency management agency.
5. Participate in training exercises (usually quarterly or more frequently). Exercises range from tabletop communications scenarios to full-scale deployment exercises integrated with county emergency management.

---

## Equipment Summary by Level

| Level | Equipment | Cost | License | Range | Use Case |
|---|---|---|---|---|---|
| 0: NOAA | Weather radio receiver | $20-35 | None | Receive only | Emergency alerts, weather |
| 1: FRS/GMRS | Walkie-talkies | $25-60/pair | None (FRS) / $35 10-yr (GMRS) | 0.5-5 miles | Family, neighborhood |
| 2: Ham | Baofeng UV-5R or similar | $25-150 | Technician ($35 FCC + exam fee) | 3-50 miles (via repeater) | Community, county, region |
| 3: ARES/RACES | Same as Level 2 + training | $0 (volunteer) | Technician | Organized networks | Disaster response integration |

---

## The Lesson From Every Disaster

The lesson is the same from Katrina, Sandy, Joplin, the Tohoku earthquake, the Camp Fire, and every other major disaster: the people with radios are the people who can help. They can call for evacuation. They can report damage. They can request medical supplies. They can coordinate search and rescue. They can relay messages from isolated communities to the outside world. They can be useful when being useful matters most.

A NOAA weather radio costs $25 and takes 5 minutes to set up. A pair of walkie-talkies costs $30 and requires no license. A Technician ham radio license costs $50 total (exam + FCC fee), takes two weeks of study, and grants access to a communication capability that works when everything else has failed.

The infrastructure that modern life depends on is fragile. The electromagnetic spectrum is not. Learn to use it.

---

## Quiz: Test Your Understanding

1. **What is the primary advantage of radio communication over cell phones in a disaster?**
   *Radio does not depend on infrastructure (cell towers, fiber optic lines, power grid). As long as the radio has batteries, it works.*

2. **What is NOAA Weather Radio, and why should every PNW household have one?**
   *A network of radio stations broadcasting continuous weather and emergency information from the National Weather Service. SAME-capable radios alert only for your county. It works when power and cell service are down.*

3. **What is the difference between FRS and GMRS?**
   *FRS requires no license and is limited to 2 watts. GMRS requires a $35 license (valid 10 years, covers the family), allows up to 5 watts, and grants access to GMRS repeaters for extended range.*

4. **What is a repeater, and how does it extend range?**
   *A relay station (usually on a hilltop) that receives a signal on one frequency and retransmits it on another. It extends the range of a 5-watt handheld from 3 miles to 30-50 miles.*

5. **What license do you need to operate a ham radio, and how do you get it?**
   *The Technician license. Pass a 35-question multiple-choice exam (26 correct to pass). Study at hamstudy.org for 1-2 weeks. Exam fee ~$15, FCC license fee $35, valid 10 years.*

6. **Why should you join ARES or RACES before a disaster rather than during one?**
   *Emergency management agencies need communicators who are already trained, registered, equipped, and familiar with local procedures. There is no time to train volunteers during the event.*

7. **What does the NATO phonetic alphabet replace, and why?**
   *It replaces individual letters with unambiguous words (Alpha, Bravo, Charlie...) to prevent misunderstanding over noisy or degraded radio channels. Letters like B/D/E or M/N sound identical on radio.*

8. **What is the realistic range of consumer FRS walkie-talkies in a suburban environment?**
   *0.5 to 2 miles. Manufacturer claims of 35+ miles are measured under ideal line-of-sight conditions that do not exist in built environments.*

9. **Name two free resources for studying for the Technician license exam.**
   *HamStudy.org (practice exams and flashcards) and KB6NU's "No-Nonsense Technician Class License Study Guide" (free PDF).*

10. **In the Cascadia earthquake scenario, why will cell service fail within hours?**
    *Cell towers will be damaged by shaking, lose grid power, and exhaust backup generator fuel within 8-24 hours. The fiber optic lines connecting towers to switching networks run through highway corridors that will be severed by landslides and bridge collapses.*

---

## Sources and Further Reading

- ARRL (American Radio Relay League). "The ARRL Ham Radio License Manual." Latest edition. arrl.org.
- ARRL. "Amateur Radio Emergency Service (ARES)." arrl.org/ares.
- FCC. "Amateur Radio Service." fcc.gov/amateur-radio-service.
- HamStudy.org. Free practice exams and study resources. hamstudy.org.
- RepeaterBook.com. Amateur radio repeater database. repeaterbook.com.
- NOAA. "NOAA Weather Radio All Hazards." weather.gov/nwr.
- FCC. "General Mobile Radio Service (GMRS)." fcc.gov/general-mobile-radio-service-gmrs.
- FCC. "Family Radio Service (FRS)." fcc.gov/family-radio-service-frs.
- Oregon Resilience Plan. "Communication Infrastructure Vulnerability Assessment." 2013.
- Washington Emergency Management Division. "Cascadia Rising Exercise After-Action Report." 2016.
- KB6NU. "No-Nonsense Technician Class License Study Guide." Free PDF. kb6nu.com.

---

## College of Knowledge Connections

- **Science** --- [Electromagnetic Spectrum]: Radio communication operates on the electromagnetic spectrum --- the same physical phenomenon that produces light, microwaves, X-rays, and gamma rays. Understanding frequency, wavelength, propagation characteristics (line-of-sight for VHF/UHF, skywave for HF), antenna design (length as a function of wavelength), and modulation (AM, FM, SSB) connects practical radio use to physics.
- **Learning** --- [Communication Systems]: Radio communication is a system --- transmitter, propagation medium, receiver, encoding, decoding, protocols, and organizational structures (nets, ARES, ICS). Understanding how these components work together as a system, and how redundancy and graceful degradation are designed into the system, is systems thinking applied to communication.
- **Trades** --- [Electronics Basics]: Amateur radio is one of the most accessible entries into practical electronics. Building antennas from wire, soldering connectors, understanding impedance matching, reading schematics, and troubleshooting radio circuits are all hands-on electronics skills that develop naturally through ham radio participation.

---

*This document is part of the FSR (First Responders) research series within the PNW Research Project. Cross-references: [FSR case-study/cascadia-earthquake], [FSR study-guide/incident-command-basics], [FSR guide/citizen-preparedness], [FSR try-session/build-a-go-bag]. It is dedicated to those who answer the call --- and to those who carry the signal when the towers go dark.*
