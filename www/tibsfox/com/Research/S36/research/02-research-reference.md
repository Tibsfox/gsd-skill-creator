# Seattle 360 — Research Reference
## Music History, Theory Pedagogy & College of Knowledge Mapping

**Date:** 2026-03-28
**Status:** Research Compilation
**Source Document:** `01-vision-doc.md`
**Purpose:** Provides the sourced factual foundation for agent execution. Where the vision
says "Central District jazz lineage," this document provides verifiable history, specific
artists, dates, and institutions. Where the vision says "theory mapping," this document
provides the genre → curriculum mapping tables agents will implement.

---

## How to Use This Document

- **Component 02 (Music Theory Mapper)** should read §3 (Genre Theory Maps) and §4 (Era
  Vocabulary) before generating any TheoryNodeList.
- **Component 03 (Fleet Research Generator)** should read all sections; §2 (Seattle Music
  History) provides the biographical and cultural sourcing framework.
- **Component 04 (College Knowledge Linker)** should read §5 (College Department Mapping)
  and §6 (Cross-Department Mathematics).
- **Component 08 (Safety Warden)** should read §7 (Cultural Attribution Standards) and §8
  (Sensitivity Considerations) as its primary operating ruleset.

**Key source organizations:**
- **Seattle Civil Rights & Labor History Project (UW)** — Authoritative source for Central
  District jazz history, Black American cultural institutions, Jackson Street corridor
- **KEXP (90.3 FM)** — Seattle's primary music archive; programming records, artist interviews
- **Sub Pop Records** — Discographic source for grunge, indie, and alt-country releases
- **K Records** — Source for Olympia-area artists (riot grrrl, lo-fi, indie folk)
- **Grove Music Online / Oxford Music Online** — Peer-reviewed music theory and biography
- **Black Music Research Journal (Columbia College Chicago)** — Scholarly Black music studies
- **Journal of the Society for American Music** — Peer-reviewed American music history

---

## §1: Seattle Music Geography

### Central District (Jackson Street Corridor)
The Jackson Street corridor, running through Seattle's Central District, functioned as
a self-contained music ecosystem from the 1930s through the 1960s. The Black Elks Club,
Washington Social Club, and Rocking Chair were primary venues. Key institutions:

- **Garfield High School** — Produced Quincy Jones, Ernestine Anderson, and others; music
  program under Ike Dotson was pedagogically rigorous, emphasizing theory alongside
  performance. (Source: Seattle Civil Rights & Labor History Project, UW)
- **The Black Community** — Central District sustained a music economy independent of
  mainstream venues due to segregation-era restrictions on Black performers in downtown clubs.

CSV artists with Central District coordinates (47.608, -122.2976): degrees 0, 3–6, 11,
25, 27, 30, 33–34, 36, 38, 280, 282, 310, etc.

### Capitol Hill (45°–90° cluster and 270°–359° cluster in CSV)
Capitol Hill became Seattle's primary indie/alternative hub from the 1980s onward.
Key venues: The Central Tavern, RKCNDY, Moe's Mo' Blues, Neumos. Sub Pop Records'
cultural gravitational center. Artists at lat 47.623, lon -122.3155.

### Olympia (K Records ecosystem)
K Records (est. 1982 by Calvin Johnson) produced a distinct aesthetic: lo-fi recording,
DIY ethics, feminist punk. Artists at lat 47.0379, lon -122.9007. Key nexus for riot grrrl
(Bikini Kill, Sleater-Kinney), indie folk (Mirah, Kimya Dawson), lo-fi (Beat Happening).

### Aberdeen / Grays Harbor (Grunge origin point)
Aberdeen produced Nirvana and The Melvins — the two bands most directly responsible for
defining grunge's heavy aesthetic. Working-class geography that shaped the music's
emotional register. Lat ~47.0, lon ~-123.8.

---

## §2: Seattle Music History (Sourced Timeline)

| Era | Key Development | Artists (CSV degrees) | Source |
|-----|----------------|----------------------|--------|
| 1930s–1940s | Jackson Street jazz corridor establishes | Don Lanphere (12) | UW SCRLHP |
| 1950s | Garfield H.S. cohort emerges; national labels notice | Quincy Jones (0), Ernestine Anderson (3), Patti Brown (6) | Grove Music Online |
| 1960s | Soul/R&B displaces jazz as primary genre; Civil Rights context | Ray Charles (30), The Tempos (34), The Dynamics (27) | Black Music Research Journal |
| 1970s | Post-Seattle Act; punk arrives from NYC/London; folk revives | Luther Rabb (32), Brenda Lee Eager (31) | KEXP Archive |
| 1982–1988 | Sub Pop founded (1986); proto-grunge coalesces | Green River (294), Mudhoney (310), Skin Yard (297) | Sub Pop Records |
| 1988–1992 | Grunge explosion; major label attention | Nirvana (311), Soundgarden (312), Alice in Chains (313), Pearl Jam (314) | AllMusic |
| 1990–1998 | Riot grrrl in Olympia; indie folk emerges | Bikini Kill (276), Sleater-Kinney (277), Fleet Foxes (53) | K Records |
| 2000–present | Post-grunge diversification; neo-soul, electronic, indie | Death Cab (58), The Postal Service (86), Chong the Nomad (44) | KEXP |

---

## §3: Genre → Music Theory Curriculum Maps

### 3.1 Jazz (degrees 0–22)

| Concept | Specificity | Example Artists (CSV°) | Curriculum Level |
|---------|------------|----------------------|-----------------|
| ii–V–I progression | Diatonic function harmony | Quincy Jones (0), Aaron Parks (14) | Intermediate |
| Tritone substitution | Chromatic harmony; bII7 for V7 | Bill Frisell (1), Wayne Horvitz (2) | Advanced |
| Modal jazz | Dorian, Mixolydian, Lydian scales | Marc Seales (13), Julian Priester (7) | Intermediate |
| Chord extensions (9, 11, 13) | Tertian harmony beyond the 7th | Thomas Marriott (15), Gary Peacock (8) | Intermediate |
| Swing rhythm / triplet feel | Compound subdivision of beats | Floyd Standifer (4), Hadley Caliman (9) | Foundational |
| Call-and-response | African musical retention; antiphony | Ernestine Anderson (3), Patti Brown (6) | Foundational |
| Blue notes (♭3, ♭5, ♭7) | Micro-tonal inflection; expressive pitch | Overton Berry (5), Don Lanphere (12) | Foundational |
| Jazz fusion: metric modulation | Tempo within tempo | Jeff Lorber (16), Polyrhythmics (21) | Advanced |

**College node targets:** `.college/music/theory/harmony/`, `.college/music/theory/rhythm/`,
`.college/mathematics/number-theory/` (interval ratios)

### 3.2 Blues (degrees 35–39)

| Concept | Specificity | Example Artists (CSV°) | Curriculum Level |
|---------|------------|----------------------|-----------------|
| 12-bar blues form | Tonic-subdominant-dominant cycle | Robert Cray (35), Jimi Hendrix (36) | Foundational |
| Blues scale (pentatonic + ♭5) | Minor pentatonic with "blue" tritone | Ayron Jones (37), Ron Artis Jr (39) | Foundational |
| Bent notes / vibrato | Expressive micro-tonality | Jimi Hendrix (36) | Intermediate |
| Shuffle rhythm | Dotted-note swing feel | All blues artists | Foundational |
| Dominant 7th as tonic color | Non-resolving dominant | Robert Cray (35) | Intermediate |
| Lydian mode (Hendrix context) | Bright #4 scale; "Bold as Love" | Jimi Hendrix (36) | Advanced |

**College node targets:** `.college/music/theory/form/12-bar-blues.md`, `.college/music/theory/scales/`

### 3.3 Soul / R&B (degrees 23–34, 40–44)

| Concept | Specificity | Example Artists (CSV°) | Curriculum Level |
|---------|------------|----------------------|-----------------|
| Gospel harmony (IV–I plagal) | Church cadences in secular context | Erica Campbell (42), Allen Stone (23) | Foundational |
| Pentatonic major scale | "Happy" pentatonic | Shaina Shepherd (26), Ron Artis II (24) | Foundational |
| Syncopation | Off-beat rhythmic emphasis | Black Stax (25), Fly Moon Royale (19) | Intermediate |
| Ornamentation / melisma | Pitch decoration; vocal runs | Ann Wilson (43), Shawn Smith (41) | Intermediate |
| Call-and-response | From gospel to soul | Whitney Menge (20) | Foundational |

**College node targets:** `.college/music/theory/harmony/gospel.md`, `.college/music/history/soul-gospel-connection.md`

### 3.4 Folk / Singer-Songwriter (degrees 45–79)

| Concept | Specificity | Example Artists (CSV°) | Curriculum Level |
|---------|------------|----------------------|-----------------|
| Diatonic harmony (I–IV–V–vi) | Major scale chord progression | Brandi Carlile (52), Damien Jurado (45) | Foundational |
| Fingerpicking patterns (Travis, DADGAD) | Right-hand independence | Sera Cahoone (48), Rocky Votolato (46) | Intermediate |
| Voice leading | Smooth melodic connection between chords | Fleet Foxes (53), Phil Elverum (71) | Intermediate |
| Modal scales (Dorian, Mixolydian) | Folk modal color | Mirah (50), LAKE (73) | Intermediate |
| Open tunings | DADGAD, Drop-D, Open G | Pedro the Lion (47), Kimya Dawson (49) | Intermediate |
| Counterpoint | Two or more independent melodic lines | Fleet Foxes (53) | Advanced |

**College node targets:** `.college/music/theory/harmony/diatonic.md`, `.college/music/performance/guitar/`

### 3.5 Indie / Electronic (degrees 86–105)

| Concept | Specificity | Example Artists (CSV°) | Curriculum Level |
|---------|------------|----------------------|-----------------|
| Synthesis (subtractive) | Oscillator, filter, envelope | Chong the Nomad (44), The Postal Service (86) | Intermediate |
| Sequencer / arpeggiator | Programmatic note patterns | Sky Cries Mary (90), Hovercraft (91) | Advanced |
| Four-on-the-floor | Electronic dance rhythm foundation | Various electronic acts | Foundational |
| Sampling theory | Nyquist theorem; sample rate | Reggie Watts (17) | Advanced |
| Dynamic compression | Threshold, ratio, attack/release | Electronic production generally | Intermediate |

**College node targets:** `.college/music/technology/synthesis.md`, `.college/mathematics/signals/` (Fourier/Nyquist)

### 3.6 Punk / Hardcore (degrees 268–295)

| Concept | Specificity | Example Artists (CSV°) | Curriculum Level |
|---------|------------|----------------------|-----------------|
| Power chord (5th dyad) | Root + 5th; no 3rd — modal ambiguity | The Sonics (268), Bikini Kill (276) | Foundational |
| Minimalism as theory | Deliberate reduction; energy through restraint | Beat Happening (275), Solger (271) | Intermediate |
| Rhythmic drive / tempo | BPM as emotional intensity carrier | The Fartz (270), The Refuzors (273) | Foundational |
| Riot grrrl deconstruction | Using "wrong" theory as statement | Bikini Kill (276), Sleater-Kinney (277) | Advanced |

**College node targets:** `.college/music/theory/harmony/power-chords.md`, `.college/music/history/punk/`

### 3.7 Grunge / Metal (degrees 296–359)

| Concept | Specificity | Example Artists (CSV°) | Curriculum Level |
|---------|------------|----------------------|-----------------|
| Drop-D tuning | Lowered 6th string; power chords +1 fret | Nirvana (311), Soundgarden (312) | Foundational |
| Lydian mode (heavy context) | Raised 4th for tension | Soundgarden (346 era) | Advanced |
| Phrygian dominant | Spanish/heavy sound; ♭2 scale | Alice in Chains (347) | Advanced |
| Metric modulation | Tempo feel shift without BPM change | Botch (344, 352), Melvins (308) | Advanced |
| Riff construction | Motivic development in rock | Pearl Jam (314), Mudhoney (310) | Intermediate |
| Sludge/drone | Sustained tones; Helmholtz resonance | Melvins (308, 334, 345) | Advanced |
| Mathcore rhythms | Odd time signatures; polyrhythm | Botch (289, 332, 352) | Advanced |

**College node targets:** `.college/music/theory/modal/`, `.college/mathematics/physics/acoustics.md`

---

## §4: Era → Theory Vocabulary

Each era uses a different harmonic vocabulary. Agents must apply era-appropriate theory:

| Era (CSV field) | Dominant Vocabulary | Avoid Projecting |
|----------------|--------------------|-----------------| 
| 1940s–1950s | Bebop extensions, Tin Pan Alley | Post-modal, electronic, grunge |
| 1960s | Modal jazz, soul/gospel inflection, British Invasion | Post-punk, grunge |
| 1970s | Fusion, funk syncopation, progressive rock | Grunge, electronic |
| 1980s | New Wave synthesis, hair metal harmony, punk simplicity | Post-grunge maturity |
| 1990s | Grunge power, riot grrrl deconstruction, alt-country | Pre-grunge styles as current |
| 2000s–present | Post-rock dynamics, neo-soul complexity, indie folk layers | Treat as fully contemporary |

---

## §5: College Department Mapping

### Primary Music Departments

| `.college/` Path | Content Type | Relevant CSV Degrees |
|----------------|-------------|---------------------|
| `music/theory/harmony/` | Chord construction, progressions, functional harmony | All (foundational) |
| `music/theory/rhythm/` | Meter, subdivision, syncopation, polyrhythm | All (foundational) |
| `music/theory/scales/` | Major, minor, modal, pentatonic, blues, exotic | All genres |
| `music/theory/form/` | 12-bar blues, AABA, verse-chorus, through-composed | Genre-specific |
| `music/theory/counterpoint/` | Voice leading, independent lines | Fleet Foxes (53), Jazz (0–22) |
| `music/history/jazz/` | Jazz history and evolution | Degrees 0–22 |
| `music/history/seattle/` | Seattle-specific music history | All |
| `music/history/punk-grunge/` | Punk → grunge evolution | Degrees 268–359 |
| `music/performance/guitar/` | Technique cross-references | Folk, blues, grunge |
| `music/technology/synthesis/` | Electronic production | Degrees 86–120 |

### Mathematics Bridge (from *The Space Between*)

| `.college/` Path | Connection | Example Theory Concept |
|----------------|-----------|----------------------|
| `mathematics/number-theory/ratios/` | Interval ratios (3:2 = perfect 5th) | Any harmonic theory node |
| `mathematics/trigonometry/unit-circle/` | Pitch cycles as circular functions | Modal theory, key relationships |
| `mathematics/calculus/fourier/` | Timbre = sum of sine waves | Synthesis, overtones |
| `mathematics/sequences/` | Rhythm as integer sequences | Polyrhythm, Botch's mathcore |
| `mathematics/l-systems/` | Musical phrase generation | Repetition/variation structure |

The unit circle is not a metaphor here — the 360° CSV structure IS the unit circle from
*The Space Between*. Every degree is a radian position. Music theory IS mathematics.
This bridge must be explicit in every release that touches harmonic theory.

### Mind-Body Department

| `.college/` Path | Relevant Content |
|----------------|-----------------|
| `mind-body/listening/` | Active listening practices; how to hear theory in recordings |
| `mind-body/performance/` | Stage presence, practice psychology, flow state |
| `mind-body/music-therapy/` | Emotional processing through music; Seattle scene trauma/resilience |

---

## §6: Cross-Department Mathematics

### Frequency Ratios and Intervals
The just-intonation ratios for musical intervals are exact mathematical relationships:
- Perfect 5th: 3:2 ratio
- Perfect 4th: 4:3
- Major 3rd: 5:4
- Minor 3rd: 6:5
- Octave: 2:1

These ratios connect directly to *The Space Between*'s number-theory chapters and should
be explicitly linked in every harmony-focused College node.

### Fourier Analysis and Timbre
Every musical timbre is a sum of sinusoidal partials (Fourier series). The fundamental
frequency determines pitch; the amplitude envelope of partials determines timbre. This
connects directly to `.college/mathematics/signals/` and is particularly relevant for:
- Electronic artists (synthesis = manual Fourier construction)
- Grunge distortion (harmonic saturation = added partials)
- Vocal timbre analysis (comparing Ernestine Anderson's tone to Ann Wilson's)

### Rhythm as Integer Mathematics
Time signatures, polyrhythm, and metric modulation are integer-ratio operations:
- 4/4 : 3/4 = 4:3 polyrhythm (same as a musical fourth, inverted)
- Botch's mathcore uses signatures like 7/8, 11/8 — prime-number meters
- Jazz swing = triplet subdivision = 3:2 within a beat

This connects to `.college/mathematics/number-theory/` and `.college/mathematics/sequences/`.

---

## §7: Cultural Attribution Standards

### Black American Musical Foundations
The Central District's jazz/R&B heritage is the direct foundation of Seattle's music
scene. Attribution standards:

| Situation | Required Language | Forbidden Language |
|-----------|------------------|-------------------|
| Describing jazz origins | "Black American musical tradition rooted in..." | "origins in African music" (too vague) |
| Describing blues in rock | "Blues tradition created by Black American musicians" | "roots music," "folk influences" |
| Garfield High School | "Historically Black institution; produced..." | "diverse school" |
| Central District gentrification | Acknowledge displacement explicitly if relevant | Omit context |

**Source requirement:** Black Music Research Journal, Seattle Civil Rights & Labor History
Project (UW), and journal articles for all Central District historical claims.

### Indigenous Territory Acknowledgment
All Seattle-area artists exist on the unceded territories of the Duwamish, Muckleshoot,
Suquamish, Snohomish, and other Coast Salish peoples. Per OCAP®/CARE/UNDRIP principles:

- Use nation-specific names always (never "local tribes," "Native Americans" as monolith)
- If an artist has documented Indigenous heritage, contact the nation's cultural office
  if possible; otherwise omit rather than speculate
- The Duwamish Tribe is specifically relevant to Seattle; they are not federally recognized
  but this does not diminish their cultural authority or the validity of acknowledgment
- Territorial acknowledgment is ANNOTATE level (not BLOCK); omission of uncited Indigenous
  heritage is not a BLOCK (to avoid speculative claims)

### Riot Grrrl and Feminist History
Bikini Kill, Sleater-Kinney, Seven Year Bitch, The Gits, and related artists require:
- Gender and feminist context acknowledged explicitly
- The Gits' Mia Zapata: her 1993 murder is documented history; handle with dignity
- Riot grrrl as a political movement, not just a genre label
- Source: Gerri Hirshey's "Nowhere to Run," Perfect Sound Forever archives

### Living vs. Deceased Artists
| Status | Protocol |
|--------|----------|
| Deceased | Past tense; biographical accuracy; legacy framing |
| Living | Present tense; respect privacy; cite only public record |
| Status unclear | Research first; default to cautious present tense |

---

## §8: Sensitivity Considerations

| Condition | Handling | Boundary Type |
|-----------|----------|--------------|
| Artist with documented substance abuse history | Cite if widely documented; no sensationalism | ANNOTATE |
| Artist whose commercial work differs from critical reputation | Present both; no advocacy | ANNOTATE |
| Artist associated with genre they disowned | Acknowledge the disavowal | GATE |
| Central District displacement narratives | Acknowledge gentrification context | ANNOTATE |
| Indigenous cultural music (if any artist has documented connections) | OCAP® protocol; nation-specific | BLOCK if speculative |
| Minors (any artist with documented minor-years work) | Age-appropriate framing only | ABSOLUTE |

---

## Source Bibliography

**Authoritative Music Sources:**
- Grove Music Online / Oxford Music Online — peer-reviewed music encyclopedia
- AllMusic database — discographic data, genre classifications
- Discogs — label and release attribution
- Black Music Research Journal — Black American musical scholarship
- Journal of the Society for American Music — peer-reviewed US music history

**Seattle-Specific:**
- Seattle Civil Rights & Labor History Project (University of Washington): depts.washington.edu/civilr/
- KEXP programming archives: kexp.org
- Sub Pop Records discography: subpop.com
- K Records catalog: krecs.com
- Seattle Music Commission reports (City of Seattle)

**Cultural Attribution:**
- OCAP® Principles (First Nations Information Governance Centre): fnigc.ca
- CARE Principles for Indigenous Data Governance: gida-global.org
- UN Declaration on the Rights of Indigenous Peoples (UNDRIP): un.org
- Duwamish Tribe: duwamishtribe.org

**Music Theory:**
- Music Theory Online (journal): mtosmt.org
- Journal of Music Theory (Yale University Press)
- *The Space Between* (Miles Tiberius Foxglove) — mathematical foundations
- Grove Music: "Modal Jazz," "Bebop," "Blues," "Punk rock" entries
