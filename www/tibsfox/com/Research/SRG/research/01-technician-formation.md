# The Technician Formation (1978--1983)

> **Domain:** Audio Engineering History
> **Module:** 1 -- Self-Taught Electronics, Console Repair, and the Professional Grapevine
> **Through-line:** *Susan Rogers did not train to become an engineer. She trained to understand how the machines worked, and the engineering followed.* The technician's instinct -- know the mechanism before operating it -- would define every phase of her career, from Paisley Park to the psychoacoustics laboratory. The woman who could trace a signal through an MCI 500-series console at component level would eventually trace a signal through the human auditory cortex with the same methodical precision.

---

## Table of Contents

1. [Southern California and the Listening Identity](#1-southern-california-and-the-listening-identity)
2. [Self-Directed Education](#2-self-directed-education)
3. [Audio Industries Corporation](#3-audio-industries-corporation)
4. [Console and Tape Machine Fundamentals](#4-console-and-tape-machine-fundamentals)
5. [Rudy Records: Crosby and Nash](#5-rudy-records-crosby-and-nash)
6. [The Professional Grapevine](#6-the-professional-grapevine)
7. [The Technician Advantage](#7-the-technician-advantage)
8. [Women in Audio Engineering: The 1970s--1980s Landscape](#8-women-in-audio-engineering-the-1970s-1980s-landscape)
9. [The Los Angeles Recording Studio Ecosystem](#9-the-los-angeles-recording-studio-ecosystem-1978-1983)
10. [Technical Foundations That Persisted](#10-technical-foundations-that-persisted)
11. [Through-Lines to Later Phases](#11-through-lines-to-later-phases)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Southern California and the Listening Identity

Susan Rogers was born August 3, 1956, and grew up in Southern California. She dropped out of high school -- a biographical detail she has discussed openly in interviews spanning decades, never with apology, always as context for what came next. Her early musical influences diverged from the Beatles-centric mainstream of her peers: she was drawn to Sly Stone and James Brown, to funk and soul rather than the British Invasion [1][2].

This divergence in listening identity is not incidental to her later career. Rogers would eventually develop a formal model of listener profiles at Berklee -- the seven-dimension framework published in *This Is What It Sounds Like* (2022) -- and she has cited her own youthful listening preferences as a data point in that model. The teenager who preferred Sly over the Beatles was already demonstrating what Rogers the scientist would later describe as a distinct cortical signature: the listener's brain is literally shaped by what it prefers to hear [3].

Her path into professional audio was not through formal education, music performance, or family connections. It was through proximity and curiosity. Working as a receptionist at the University of Sound Arts in Los Angeles, she overheard conversations about maintenance technician training and began studying electronics on her own [1][4].

---

## 2. Self-Directed Education

Rogers' autodidactic method was systematic. She sourced materials from the Los Angeles Opamp technical bookstore, a specialist supplier of audio and electronics texts. She studied US Army electronics manuals -- the same comprehensive, procedure-oriented documentation that had trained military radio technicians since World War II. She learned acoustics, magnetism, and circuit theory from first principles [1][5].

The Opamp bookstore (later Opamp Technical Books, located on Burbank Boulevard in North Hollywood) was a known resource for Los Angeles audio professionals in the late 1970s and 1980s. It stocked technical manuals, AES publications, and specialized texts that were not available through mainstream bookstores. For someone building an engineering education outside the institutional pipeline, it was the library [5].

### The US Army Electronics Manuals

The Army's technical manuals (particularly the "Electronics Fundamentals" series, TM 11-681 and related publications) covered:

- DC and AC circuit theory
- Vacuum tube and transistor fundamentals
- Power supply design
- Signal processing basics
- Test equipment operation and calibration

These manuals were written for readers with no assumed prior knowledge, using a building-block approach that started with electron flow and ended with complete system analysis. For a self-directed learner with no high school diploma, this pedagogical structure was effectively a complete undergraduate electronics curriculum [5][6].

### Acoustics and Magnetism

Rogers' self-study in acoustics covered the physics of sound propagation, microphone transducer principles (dynamic, condenser, ribbon), and room acoustics fundamentals. Her study of magnetism was directly practical: analog recording technology depends entirely on the magnetic properties of iron oxide particles on tape, and understanding bias, equalization, and head alignment requires a working knowledge of magnetic hysteresis curves and Barkhausen noise [6][7].

---

## 3. Audio Industries Corporation

In 1978, Rogers was hired by Audio Industries Corporation in Los Angeles as a trainee technician specializing in MCI console and tape machine repair. MCI (Music Center Incorporated, later acquired by Sony) was one of the dominant professional recording console manufacturers of the era, alongside Neve, SSL, and API [1][8].

### MCI Console Architecture

The MCI 500-series consoles that Rogers learned to repair were inline designs: each channel strip contained both the recording path and the monitoring path in a single physical module. This architecture was more space-efficient than split designs but more complex to troubleshoot because signal paths overlapped within the same circuit board.

Key technical systems Rogers learned to service:

| System | Function | Failure Modes |
|--------|----------|---------------|
| Summing amplifier | Combines channel outputs to mix bus | Op-amp drift, capacitor aging, thermal noise |
| VCA automation | Voltage-controlled channel fading | DC offset, control voltage noise, calibration drift |
| Meter bridge | Signal level monitoring | Ballistic calibration, lamp failure, rectifier drift |
| Patch bay | Signal routing between modules | Contact oxidation, normalling failures, ground loops |
| Power supply | DC rail generation | Ripple, regulation failure, capacitor ESR increase |

### Tape Machine Maintenance

MCI JH-24 multitrack tape machines required regular alignment and calibration:

- **Head alignment:** Azimuth, zenith, wrap angle, and height adjustment using alignment tapes (typically MRL or STL test tapes at operating speed)
- **Bias optimization:** Setting the high-frequency bias current for minimum distortion at the chosen tape formulation (Ampex 456, 3M 250, Agfa PEM 468)
- **Reproduce equalization:** Calibrating playback response to match NAB or IEC curves
- **Transport servo:** Speed stability, tension servo calibration, shuttle and locate accuracy

This maintenance discipline -- measuring, adjusting, verifying, documenting -- would prove directly transferable to Rogers' later scientific methodology. The protocols she learned for calibrating a tape machine are structurally identical to the protocols she would later use for calibrating psychoacoustic measurement equipment at McGill and Berklee [1][6][7].

---

## 4. Console and Tape Machine Fundamentals

Rogers' training at Audio Industries gave her component-level understanding of the analog recording signal chain. This depth of knowledge distinguished her from engineers who understood how to operate consoles but not how to repair them.

### The Analog Signal Chain

```
SIGNAL CHAIN -- 1980s ANALOG MULTITRACK STUDIO
=====================================================================

  Microphone --> Preamp --> EQ --> Dynamics --> Fader --> Bus
       |           |        |        |          |        |
       v           v        v        v          v        v
  Transducer   Gain stage  Filter  Compressor  VCA     Summing
  impedance    noise floor  Q/freq  ratio/knee  auto    amplifier
  matching     headroom    slope   attack/rel   noise   crosstalk

       --> Tape Machine --> Monitoring
              |                |
              v                v
         Record head      Playback
         bias current     equalization
         tape speed       head alignment
         track width      noise reduction
```

Understanding each stage at component level meant Rogers could diagnose problems that purely operational engineers would attribute to "the console sounds wrong." She could identify whether a muddy low end was caused by a failing coupling capacitor in the channel strip, a bias current drift on the tape machine, or an acoustic mode in the room -- three completely different problems with superficially identical symptoms [1][8].

> **Related:** [HFE: History of Audio Engineering](../HFE/) | [DAA: Deep Audio Analyzer](../DAA/) | [SGL: Signal & Light](../SGL/)

### Soldering and Circuit Diagnosis

A dimension of Rogers' training that is often overlooked in biographical accounts is the physical craft of electronics repair. MCI console maintenance required:

- **Through-hole soldering:** Removing and replacing discrete components (resistors, capacitors, transistors, op-amps) on circuit boards using soldering irons, desoldering braid, and solder suckers
- **Wire harness repair:** Tracing and repairing signal wiring between modules, patch bays, and rack-mounted processors
- **Connector maintenance:** Cleaning and replacing XLR, TRS, and DB-25 connectors subjected to daily plugging and unplugging
- **Oscilloscope diagnosis:** Using oscilloscopes to trace signal distortion, identify noise sources, and verify power supply ripple

These skills require a combination of fine motor control, systematic reasoning, and patience that translates directly to the discipline required for scientific laboratory work. The technician who can trace a 20-millivolt DC offset through a twelve-stage signal chain has the diagnostic patience to trace a 2-millisecond auditory brainstem response through a twenty-electrode array [1][6][8].

### The Relationship Between Repair and Understanding

Rogers has articulated a key insight about the relationship between repair and understanding: when you can fix something, you understand it in a way that operating it alone cannot provide. The operator sees inputs and outputs; the repair technician sees the mechanism that connects them. This distinction -- between surface-level competence and mechanistic understanding -- is the foundation of Rogers' approach to every domain she subsequently entered [1][2].

---

## 5. Rudy Records: Crosby and Nash

By 1981, Rogers had advanced to a maintenance technician role at Rudy Records, the recording studio operated by Graham Nash and David Crosby in Los Angeles. This was her first professional studio environment beyond the repair bench, and her first exposure to the recording process from inside the control room [1][2].

At Rudy Records, Rogers transitioned from pure maintenance into occasional assistant engineering duties. The studio catered to the soft rock and singer-songwriter aesthetic of its owners, but the technical fundamentals were universal: microphone selection and placement, gain staging, signal routing, and the discipline of keeping a complex analog system calibrated and operational [2].

### The Assistant Engineer Role

In 1980s Los Angeles studios, the assistant engineer's responsibilities included:

- Setting up microphones and headphone mixes before sessions
- Maintaining tape machine alignment and patch bay documentation
- Managing tape stock, labeling, and archival
- Executing punch-ins on the multitrack under the lead engineer's direction
- General maintenance and troubleshooting during sessions

For Rogers, the assistant role was the bridge between the repair bench and the engineer's chair. She could already fix the equipment; now she was learning how the equipment was used to make records [1][9].

---

## 6. The Professional Grapevine

Rogers learned through the Los Angeles professional audio technician network that Prince was seeking a maintenance technician after the 1999 tour (1982-1983). The position was not publicly advertised in the conventional sense; it traveled through the professional grapevine of studio technicians and equipment suppliers who knew which artists were hiring [1][2].

Rogers pursued the posting with characteristic directness. By her own account, she told colleagues that the search was over -- she was going to get the job. She was hired sight-unseen by Prince's management, initially as a maintenance technician, not an engineer. The distinction matters: Prince did not know he was hiring a future recording engineer. He was hiring someone to keep his equipment running [1][10].

The grapevine network that connected Rogers to Prince was a feature of the pre-internet music industry. Equipment technicians, studio managers, and gear suppliers formed an informal hiring network. Competence traveled by word of mouth. Rogers' reputation at Audio Industries and Rudy Records -- someone who could fix MCI consoles and was reliable under session pressure -- was exactly the profile Prince needed [2][10].

---

## 7. The Technician Advantage

Rogers has noted in multiple interviews that being hired as a technician rather than an engineer conferred a specific and lasting advantage: Prince had no preconceptions about her capabilities. When she sat in the engineer's chair for the first time to help finish overdubs for "Darling Nikki," the role simply expanded into place. There was no audition, no formal promotion. The work presented itself and she was competent to do it [1][2][10].

### The Mechanism-First Mindset

The technician's training instills a specific cognitive approach: understand the mechanism before operating it. This is fundamentally different from the operator's approach, which starts with the desired outcome and works backward to the controls.

```
TECHNICIAN vs. OPERATOR -- COGNITIVE APPROACHES
=====================================================================

  TECHNICIAN (Rogers' Formation)        OPERATOR (Standard Engineering Path)
  ----------------------------------    ----------------------------------
  Starts at: Component behavior         Starts at: Desired sound
  Moves to:  Circuit function           Moves to:  Control adjustment
  Arrives at: System capability          Arrives at: Acceptable result
  Advantage:  Can diagnose failures     Advantage:  Faster initial workflow
  Limitation: Slower initial workflow    Limitation: Opaque failure modes
```

Rogers would later apply the same mechanism-first approach to psychoacoustics research. Her McGill dissertation does not start with "why does this music sound good?" -- it starts with "what does the auditory system physically do when it processes a consonant interval versus a dissonant one?" The technician's question, translated to neuroscience [2][11].

> **Related:** [DPM: Design Pattern Methods](../DPM/) | [CAR: Career Arc Research](../CAR/)

---

## 8. Women in Audio Engineering: The 1970s--1980s Landscape

Rogers has noted that being hired as a technician rather than an engineer conferred a specific and lasting advantage: Prince had no preconceptions about her capabilities because he was not evaluating her against engineer criteria. He was evaluating her against technician criteria -- can she keep the equipment running? -- and she could. Everything else followed from proximity and competence [1][2][10].

The mechanism-first mindset persists as the most durable legacy of the technician formation. When Rogers later encountered the auditory system as a research subject at McGill, she approached it exactly as she had approached an MCI console: what are the components? How are they connected? What does each stage do to the signal? Where are the failure modes? This is the technician's question, and it never changes regardless of the domain [1][3][11].

---

## 8. Women in Audio Engineering: The 1970s--1980s Landscape

Rogers entered professional audio engineering at a time when women in the field were extraordinarily rare. She has been consistently described in professional literature as among "the world's few women" working as recording engineers at the major-label level during the 1980s [1][3][12].

The barriers were structural, not merely attitudinal. The apprenticeship pathway into recording engineering in the 1970s and 1980s ran through studio maintenance and assistant engineering -- both roles that required long hours, physical labor (moving equipment, wiring studios), and immersion in a male-dominated professional culture. The pipeline produced very few women at the top level not because women lacked capability but because the entry points were gatekept by social networks that were overwhelmingly male [12][13].

Rogers has addressed this topic with characteristic directness: she does not overframe her gender as the defining feature of her career, but she does not minimize the structural reality. She has noted that being a woman in the control room with Prince was less of an issue than it might have been elsewhere, because Prince's working method was so singular that conventional studio hierarchy did not apply. There was no "boys' club" dynamic in a studio where one person was the artist, producer, songwriter, and performer, and one other person was the engineer [1][2][12].

### Industry Context: 1980s Statistics

Precise statistics on women in recording engineering in the 1980s are difficult to establish because the field had no formal census. However, the Audio Engineering Society's membership data, Grammy nomination records, and industry surveys from the period consistently show women comprising less than 5% of credited recording engineers on major-label releases [12][13].

### Legacy for Subsequent Generations

Rogers' career -- from technician to engineer to producer to scientist -- has become a reference point for women entering audio engineering. Organizations like the Women's Audio Mission (WAM, founded 2003 in San Francisco) and the Audio Engineering Society's diversity initiatives cite engineers like Rogers as evidence that the barriers are structural, not aptitude-based. When a high-school dropout from Orange County can engineer Prince's most celebrated albums and then earn a PhD in cognitive psychology from McGill, the argument that women "aren't suited" for technical audio work loses whatever remaining credibility it may have had [12][13].

Rogers' own approach to this legacy is characteristically practical rather than political. She teaches, she researches, she publishes, and she lets the work speak for itself. The career IS the argument [1][3].

### The Invisible Infrastructure

Rogers' entry into the audio profession through the technician path illuminates an invisible infrastructure that supports all recorded music. Listeners hear records; they do not hear the maintenance logs, calibration procedures, or component replacements that kept the recording equipment functioning. The technician's work is, by definition, invisible when it is done correctly -- equipment works, sessions happen, records get made. The technician becomes visible only when something fails [1][7][8].

This invisibility has a direct parallel in neuroscience: the auditory system's signal processing is invisible to the listener. We hear music; we do not hear the cochlear mechanical filtering, the auditory nerve rate coding, or the cortical frequency mapping that produces our perception. Rogers' career arc can be read as a movement from maintaining one invisible infrastructure (recording equipment) to studying another (the auditory system) [3][6].

---

## 9. The Los Angeles Recording Studio Ecosystem (1978--1983)

Rogers' formation period coincided with a specific moment in the Los Angeles recording industry. The late 1970s and early 1980s represented the peak of the analog recording era -- before digital recording technology (introduced commercially with the Sony PCM-1600 in 1978 and the Mitsubishi X-80 in 1980) began displacing tape-based workflows [7][8].

### The Studio Hierarchy

Los Angeles studios in this period operated with a clearly defined professional hierarchy:

| Role | Function | Typical Path |
|------|----------|-------------|
| Studio owner/manager | Business operations, client relationships | Industry connections, capital investment |
| Chief engineer | Primary recording and mixing | 5-10 years assistant experience |
| Staff engineer | Session recording | 2-5 years assistant experience |
| Assistant engineer | Setup, tape ops, maintenance assist | Entry level, often unpaid initially |
| Maintenance technician | Equipment repair and calibration | Electronics training, separate path |

Rogers entered through the maintenance technician path -- a parallel track that did not normally lead to the engineer's chair. The maintenance path produced people who understood equipment at the deepest level but were not typically considered for creative roles. Rogers' crossing from the maintenance track to the engineering track was unusual and would not have happened without Prince's unconventional hiring approach [1][2].

### Key Los Angeles Studios of the Era

The studios where Rogers trained and worked were part of a concentrated geographic cluster:

- **Sunset Sound** (Sunset Boulevard, Hollywood) -- later the site of Rogers' most technically sophisticated Prince sessions
- **Record Plant** (Third Street, Los Angeles) -- major rock and pop facility
- **A&M Studios** (La Brea Avenue) -- Charlie Chaplin's former lot, later Henson Recording
- **Rudy Records** (Graham Nash/David Crosby's facility) -- Rogers' first studio experience beyond the repair bench
- **Cherokee Studios** (Fairfax Avenue) -- active analog room through the 1980s

These facilities shared equipment suppliers, technicians, and professional networks. A repair technician working in this ecosystem would encounter the full range of professional recording equipment within a single city [7][8].

### The MCI Market Position

MCI's market position in the late 1970s is relevant to Rogers' training. MCI consoles (the JH-500 and JH-600 series) and tape machines (the JH-16 16-track and JH-24 24-track) were the workhorses of American recording studios. They were less expensive than Neve and SSL consoles, more widely installed, and more commonly serviced by independent technicians. Rogers' MCI specialization gave her access to the broadest possible range of studios [7][8].

When Sony acquired MCI in 1982, the company's focus shifted toward digital products. The MCI analog console and tape machine lines were effectively end-of-lifed, making experienced MCI technicians even more valuable to studios maintaining their existing analog infrastructure [8].

### Analog vs. Digital: The Transition Rogers Would Witness

Rogers' formation period coincided with the very beginning of the analog-to-digital transition in professional recording. The Sony PCM-1600 (1978) and the Mitsubishi X-80 (1980) represented the first commercially viable digital recording systems, but adoption was slow. Most professional studios remained fully analog through the early 1980s, and the debates about analog warmth vs. digital clarity were just beginning [7][8].

This historical timing is significant: Rogers learned her craft on equipment that was, within a decade, being replaced by an entirely different technology. The skills she developed -- tape machine alignment, analog console maintenance, transformer-coupled signal path optimization -- were deeply specific to analog technology. When she later encountered digital recording (which had become dominant by the time of her production arc in the 1990s), she brought an understanding of analog signal theory that informed her use of digital tools. The technician who understood Barkhausen noise in magnetic tape could evaluate the quantization noise in digital converters with the same analytical framework [7][8].

---

## 10. Technical Foundations That Persisted

Several specific technical competencies from Rogers' formation period persisted across her entire career:

| Competency | Formation Source | Application at Paisley Park | Application in Science |
|------------|-----------------|---------------------------|----------------------|
| Signal flow tracing | MCI console repair | Diagnosing routing issues under session pressure | Tracing auditory signal from cochlea to cortex |
| Calibration discipline | Tape machine alignment | Maintaining consistent sonic standards across sessions | Psychoacoustic measurement equipment calibration |
| Component-level diagnosis | Audio Industries training | Identifying equipment failures by symptom | Identifying perceptual phenomena by behavioral data |
| Documentation habit | Maintenance logs | Vault cataloguing system for Prince | Research data management at McGill and Berklee |
| Self-directed learning | Opamp bookstore, Army manuals | Learning Prince's preferences from scratch | Earning GED, BA, and PhD without formal prior education |

The continuity between these phases is not metaphorical. Rogers has explicitly drawn the connection between her technician training and her scientific methodology in multiple public presentations, including her 2019 AES Convention panel on engineering Prince's records and her CIRMMT Distinguished Lecture at McGill [2][11][14].

---

### The Calibration Mindset

The most persistent technical foundation from Rogers' formation is what might be called the calibration mindset: the habit of measuring a system's actual state against its intended state, identifying the deviation, and applying a correction. This is what tape machine alignment is. It is also what experimental psychology is. The parallel is structural, not metaphorical [1][6][7].

In tape machine alignment, the technician:
1. Plays a reference tape with known signal levels and frequencies
2. Measures the machine's playback response
3. Adjusts the playback equalization to match the reference standard (NAB or IEC curve)
4. Verifies the adjustment by re-measuring

In psychoacoustic experimentation, the researcher:
1. Presents a stimulus with known acoustic properties
2. Measures the listener's perceptual response
3. Compares the response against theoretical predictions
4. Adjusts the experimental model to account for observed deviations

Rogers has drawn this parallel explicitly in her teaching. The technician's discipline of calibration -- never trust the system, always measure -- became the scientist's discipline of experimental verification [1][11][14].

---

## 11. Through-Lines to Later Phases

### To Module 2 (Prince Studio)

Rogers arrived in Minneapolis in 1983 with a specific skill set: she could maintain and repair professional recording equipment, she had basic assistant engineering experience, and she understood the analog signal chain at component level. What she did not have was experience as a lead recording engineer. The Prince chapter would provide that experience under the most demanding possible conditions.

### To Module 4 (Academic Pivot)

The self-directed learning methodology that Rogers used to build her initial technical education -- sourcing materials independently, studying systematically from fundamentals, and applying knowledge practically as it was acquired -- is the same methodology she would use two decades later when she earned her GED at 44 and enrolled as a university freshman. The autodidact's pattern does not change; only the subject matter evolves.

### To Module 5 (Berklee Laboratory)

Rogers has noted that her Berklee courses in psychoacoustics and music cognition are designed for students who are already practitioners -- musicians, producers, and engineers. The technician's insight that you must understand the mechanism before you can control the outcome is embedded in her curriculum design [3][11].

---

## 12. Cross-References

| Topic | SRG Modules | Related Projects |
|-------|-------------|------------------|
| Analog console architecture | M1, M2 | HFE, DAA, SGL |
| Tape machine technology | M1, M2 | HFE, DAA |
| Self-directed learning | M1, M4 | CAR, DPM |
| Women in audio engineering | M1, M3 | HFR, PRS |
| Signal chain analysis | M1, M2, M5 | SGL, DAA, FQC |
| Psychoacoustic measurement | M1, M5 | DAA, SGL |
| Professional networks | M1, M3 | CAR |
| LA studio ecosystem | M1, M2 | HFE, HFR |
| MCI console/tape technology | M1, M2 | SGL, DAA |

---

## 13. The Significance of the Formation Period

The technician formation period (1978-1983) is approximately five years in duration -- roughly the same length as Rogers' Prince tenure, and roughly the same length as her undergraduate education at the University of Minnesota. This temporal symmetry suggests that Rogers' learning curve in any new domain follows a consistent pattern: approximately five years to achieve mastery from a standing start [1][2].

The formation period is also the only phase of Rogers' career where she had no mentor. At Audio Industries, she learned from the equipment itself and from technical manuals. At Rudy Records, she learned from observation. The self-directed nature of this learning is significant: it established the autodidactic pattern that would characterize her entire career, even when she later had access to world-class mentors at McGill [1][5][6].

### What the Formation Gave the Arc

Each subsequent phase of Rogers' career can be mapped back to a specific competency developed during the formation:

```
FORMATION COMPETENCY --> CAREER APPLICATION
=====================================================================

  Electronics repair       --> Console engineering (Prince)
  Calibration discipline   --> Vault cataloguing (Prince)
  Self-directed learning   --> GED + undergraduate (Minnesota)
  Signal chain analysis    --> Auditory pathway research (McGill)
  Documentation habit      --> Research data management (Berklee)
  Physical craft patience  --> Laboratory methodology (Berklee)
  Component-level thinking --> Mechanism-first science (McGill)
  MCI console mastery      --> Studio teaching (Berklee)
```

The formation period is not a prelude to the "real" career. It IS the real career. Everything that followed was an application of what Rogers learned between 1978 and 1983, in progressively more complex domains [1][3].

---

## 14. Sources

1. Tape Op Magazine, Issue 117. "Susan Rogers: Prince's Engineer on Studio Psychology."
2. Grammy.com Producers & Engineers Wing. "Producer & Engineer Susan Rogers Worked With Prince and Barenaked Ladies."
3. Rogers, S.E. & Ogas, O. (2022). *This Is What It Sounds Like: What the Music You Love Says About You*. W.W. Norton & Company.
4. Designing Sound. "Music Cognition and Psychoacoustic Research: An Interview with Dr. Susan Rogers." May 2016.
5. Historical context: Opamp Technical Books, North Hollywood, CA. (Professional audio specialty bookstore, operational 1970s--2000s.)
6. US Army Technical Manuals, Electronics Fundamentals series. TM 11-681 and related publications.
7. Huber, D.M. & Runstein, R.E. *Modern Recording Techniques* (multiple editions). Focal Press.
8. MCI Professional Division technical documentation. JH-500 series console service manuals; JH-24 tape machine alignment procedures.
9. PRN Alumni Foundation. "Spotlight: Susan Rogers." prnalumni.org, October 2019.
10. Red Bull Music Academy Daily (June 2017). "Susan Rogers on Working with Prince."
11. AES 147th Convention (2019), New York. Panel: "Engineering Prince's Records." (Rogers as panelist.)
12. Audio Media International. "In the Studio with Prince: Susan Rogers."
13. Audio Engineering Society historical membership data; Women's Audio Mission (WAM) research archives.
14. CIRMMT Distinguished Lecture, McGill University. "Music Psychology for Record Makers."
15. McGill University Reporter Archive (2006). "Susan Rogers: The grad student formerly known as..."

---

*The Susan Rogers Arc -- Module 1: The Technician Formation. The repair bench is where she learned to listen, and the listening never stopped.*
