# Research-to-Room Mapping

## Table of Contents

- [Overview](#overview)
- [Mapping Architecture](#mapping-architecture)
- [Room 1: The Workshop (Origins)](#room-1-the-workshop-origins)
- [Room 2: The Sound (Discography)](#room-2-the-sound-discography)
- [Room 3: The Network (Creative Connections)](#room-3-the-network-creative-connections)
- [Room 4: The Ripple (Post-Geggy Tah Trajectories)](#room-4-the-ripple-post-geggy-tah-trajectories)
- [Room 5: The Label (Luaka Bop and Curatorial Practice)](#room-5-the-label-luaka-bop-and-curatorial-practice)
- [Thread System Architecture](#thread-system-architecture)
- [Try Session Integration Map](#try-session-integration-map)
- [Progressive Disclosure Model](#progressive-disclosure-model)
- [Content Flow Diagram](#content-flow-diagram)
- [Module Architecture Summary](#module-architecture-summary)

---

## Overview

The Inclusionary Wave Educational Module transforms five Phase 1 research modules into five explorable rooms, each containing panels (focused explorations), a Try Session (hands-on exercise), and thread connections (cross-room navigation). This document specifies the exact mapping between source research content and module architecture.

> "The first mission asked: *who were Geggy Tah?* This mission asks: *what can Geggy Tah teach?*"

The mapping follows the GSD College structure: **rooms** (thematic spaces), **panels** (focused explorations within a room), and **Try Sessions** (hands-on experiential moments). The through-line is the *inclusionary wave* -- the deliberate practice of absorbing disparate influences without hierarchy.

---

## Mapping Architecture

### Module Map

```
THE INCLUSIONARY WAVE -- MODULE MAP
=====================================

ENTRY POINT: "What happens when you absorb everything?"
      |
      v
+------------------------------------------------------------------+
| LOBBY: The Inclusionary Wave                                      |
| One-page overview. Byrne quote. Timeline ribbon. Entry to rooms. |
+------------------------------------------------------------------+
      |
 +----+----+--------+---------+--------+
 |         |        |         |        |
 v         v        v         v        v
[R1]     [R2]     [R3]      [R4]     [R5]
The      The      The       The      The
Workshop Sound    Network   Ripple   Label
(Origins)(Albums) (People)  (Legacy) (Context)
 |         |        |         |        |
 +-- 3P    +-- 4P   +-- 4P    +-- 3P   +-- 2P
 |         |        |         |        |
 +-- TS    +-- TS   +-- TS    +-- TS   +-- TS

P = Panel (focused exploration)
TS = Try Session (hands-on experience per panel)
```

### Research-to-Room Mapping Table

| Room | Source Module | Key Content Pulled | Panels | Try Session |
|------|-------------|-------------------|--------|-------------|
| R1: Workshop | M1 (Origins) | CoCu formation, duo evolution, signing story, Byrne quotes | 3 | Workshop Exercise |
| R2: Sound | M2 (Discography) | All 3 album catalogs, personnel, production details, critical reception | 4 | Found Sound Session |
| R3: Network | M3 (Creative Network) | Rogers, Byrne, Pamelia, Gadson biographical profiles | 4 | Constellation Exercise |
| R4: Ripple | M4 (Trajectories) | Kurstin career timeline, Jordan post-band, Pamelia path | 3 | The Two Charts |
| R5: Label | M5 (Cultural Context) | Luaka Bop founding, curatorial philosophy, 90s landscape | 2 | Label Exercise |
| **Total** | **5 modules** | **Full Phase 1 corpus** | **16** | **5** |

---

## Room 1: The Workshop (Origins)

### Premise

> "Every creative ecosystem starts with a space where the rules haven't been written yet."

### Source: Module 1 (Origins and Formation)

Room 1 draws from the Phase 1 Origins module to tell the story of how Geggy Tah emerged from the CoCu collective -- a space that deliberately included non-musicians, erased the boundary between performer and audience, and created the conditions for radical creative inclusion.

### Panel Mapping

#### Panel 1: CoCu -- The Anti-Band

| Element | Source Content | Source Location |
|---------|--------------|-----------------|
| **Narrative** | CoCu formation in 1987 LA; ten people, five non-musicians; audience-as-participant | M1, Section 1 |
| **Pull Quote** | "We weren't trying to be a band. We were just trying to make noise together." -- Tommy Jordan | M1, Interviews |
| **Data Points** | Formation year (1987), member count (~10), non-musician count (~5) | M1, verified data |
| **Deep Dive** | How unstructured collaboration creates the conditions for radical inclusion. Bono buying studio time for a band he'll never sign. | M1, Sections 1-2 |
| **Thread Connections** | Influence thread to R3-P3 (Byrne's curatorial philosophy also rejects rigid categories) | Cross-module |

#### Panel 2: Baby Sisters and Demo Tapes

| Element | Source Content | Source Location |
|---------|--------------|-----------------|
| **Narrative** | The naming story: Jordan's baby sisters couldn't pronounce "Greg." The demo tape journey from Pomona to Bono to Byrne. | M1, Section 2 |
| **Pull Quote** | Byrne on the demo: "truly like nothing else" | M1, Signing narrative |
| **Data Points** | Signing year (~1993), label (Luaka Bop/Warner Bros), duo members (Jordan, Kurstin) | M1, verified data |
| **Deep Dive** | The paradox of an American band on a world-music label. What Byrne heard that existing labels didn't. | M1, Section 3 + M5 cross-ref |
| **Thread Connections** | Timeline thread to R2-P1 (Grand Opening follows signing); Concept thread to R5-P2 (American Exception) | Cross-module |

#### Panel 3: The Jazz Root

| Element | Source Content | Source Location |
|---------|--------------|-----------------|
| **Narrative** | Kurstin at The New School under Jaki Byard. Playing the Village Vanguard with Bobby Hutcherson. | M1, Section 3 |
| **Pull Quote** | Context on Byard: "Mingus's pianist" as lineage marker | M1, Training section |
| **Data Points** | Institution (The New School), teacher (Jaki Byard), venue (Village Vanguard), collaborator (Bobby Hutcherson) | M1, verified data |
| **Deep Dive** | How rigorous training in one tradition creates the confidence to break every tradition simultaneously. The Mingus-Byard-Kurstin lineage. | M1, Section 3 |
| **Thread Connections** | Influence thread to R4-P1 (Kurstin's jazz foundation enables pop production mastery) | Cross-module |

### Try Session: The Workshop Exercise

| Element | Detail |
|---------|--------|
| **Title** | The Workshop Exercise |
| **Description** | User is given 5 unrelated sound sources and prompted to combine them into a 60-second arrangement |
| **Sources Provided** | A field recording, a jazz piano phrase, a spoken word clip, a percussion loop, a synth pad |
| **Tool Integration** | GSD-Tracker (sample loading, 16-row pattern editor) |
| **Constraint** | Inclusion -- every element must appear. No genre label. No rules. |
| **Estimated Time** | 15-20 minutes |
| **Fallback** | Text-only instructions if GSD-Tracker unavailable |
| **Lesson** | The inclusionary principle in practice: creative freedom within the constraint of including everything |

---

## Room 2: The Sound (Discography)

### Premise

> "Three albums are three experiments in how far inclusion can stretch before it becomes something new."

### Source: Module 2 (Discography)

Room 2 draws from the Phase 1 Discography module to provide album-level analysis of all three Geggy Tah recordings, focusing on production methodology, sonic experimentation, and the evolution of the inclusionary aesthetic across eight years.

### Panel Mapping

#### Panel 1: Grand Opening -- The Aural Planet

| Element | Source Content | Source Location |
|---------|--------------|-----------------|
| **Narrative** | Susan Rogers' production approach. Home recording on a Stephens 16-track tape machine. The creative constraints of limited technology. | M2, Grand Opening section |
| **Pull Quote** | Rolling Stone: "creates its own aural planet" | M2, Critical reception |
| **Data Points** | Release year (1994), label (Luaka Bop/Warner Bros), producer (Susan Rogers + band), recording format (Stephens 16-track) | M2, verified data |
| **Deep Dive** | How recording on a 16-track tape machine imposes creative constraints that force innovation. The home recording philosophy as deliberate artistic choice, not budget limitation. | M2, Production analysis |
| **Thread Connections** | Influence thread to R3-P1 (Rogers' transformation during this session) | Cross-module |

#### Panel 2: Sacred Cow -- The Hit Nobody Expected

| Element | Source Content | Source Location |
|---------|--------------|-----------------|
| **Narrative** | "Whoever You Are" journey: from 8-year-old's traffic courtesy song to Billboard #16 Modern Rock to Mercedes-Benz commercial. | M2, Sacred Cow section |
| **Pull Quote** | Entertainment Weekly: "silliness tempered by keen musicianship" | M2, Critical reception |
| **Data Points** | Release year (1996), chart position (#16 Modern Rock), commercial use (Mercedes-Benz), guest vocals (Glen Phillips) | M2, verified data |
| **Deep Dive** | How a song can mean different things across decades. The Mercedes-Benz revival five years later. What commercial success means for an inclusionary practice. | M2, Sacred Cow analysis |
| **Thread Connections** | Timeline thread to R4-P3 (chart data for "The Chart That Lies" exercise) | Cross-module |

#### Panel 3: Into the Oh -- The Expanded Palette

| Element | Source Content | Source Location |
|---------|--------------|-----------------|
| **Narrative** | Theremin, Moog synths, clavinets, Wurlitzers. Laurie Anderson's "postcard from a strange cloud." James Gadson bringing Aretha's groove. | M2, Into the Oh section |
| **Pull Quote** | Laurie Anderson: "postcard from a strange cloud" | M2, Guest commentary |
| **Data Points** | Release year (2001), new instruments (theremin, Moog, clavinet, Wurlitzer), guests (Anderson, Gadson, Stickney, Millstein) | M2, verified data |
| **Deep Dive** | How adding voices to an inclusive practice doesn't dilute it -- it deepens. The expanded roster as validation of the inclusionary principle. | M2, Into the Oh analysis |
| **Thread Connections** | Influence thread to R3-P2 (Pamelia's theremin introduction happens here) | Cross-module |

#### Panel 4: The Unconventional Toolkit

| Element | Source Content | Source Location |
|---------|--------------|-----------------|
| **Narrative** | Dog claw scratches, garage door squeals, submerged drums, found sounds as legitimate sonic material. | M2, Production techniques |
| **Pull Quote** | Jordan: music is "an expression of life -- beautiful, ugly, simple, complicated" | M2, Jordan interview |
| **Data Points** | Sound sources documented across 3 albums: found sounds, environmental recordings, unconventional percussion | M2, verified data |
| **Deep Dive** | The Amiga Principle applied to instrumentation: specialized tools for specialized moments. Why every sound is a potential instrument when the practice is inclusion. | M2, Techniques + cross-ref |
| **Thread Connections** | Concept thread to R1-P1 (CoCu's inclusionary ethos applied to sound); Influence thread to R4-P1 (Kurstin carries multi-instrumental approach to pop) | Cross-module |

### Try Session: The Found Sound Session

| Element | Detail |
|---------|--------|
| **Title** | The Found Sound Session |
| **Description** | User records 3 sounds from their immediate environment and builds a 16-row pattern |
| **Instructions** | 1. Record 3 sounds (door, glass, chair, voice, anything). 2. GSD-Tracker loads them as samples. 3. Build a 16-row pattern using only these sounds plus one pitched instrument. |
| **Tool Integration** | GSD-Tracker (sample recording, sample loading, pattern editor) |
| **Constraint** | Only found sounds + one pitched instrument. The lesson: every sound is a potential instrument. |
| **Estimated Time** | 20-25 minutes |
| **Fallback** | Text description of exercise; user can use any DAW or even describe the arrangement in writing |
| **Connection** | Direct application of Panel 4's unconventional toolkit philosophy |

---

## Room 3: The Network (Creative Connections)

### Premise

> "Creative DNA doesn't flow through institutions. It flows through people who change each other."

### Source: Module 3 (Creative Network)

Room 3 draws from the Phase 1 Creative Network module to profile the individuals who orbited the Geggy Tah creative field and maps the transformative moments that redirected their trajectories. The room's centerpiece is the interactive constellation map (SVG/D3.js) visualizing the full network.

### Panel Mapping

#### Panel 1: Susan Rogers -- When Prince's Engineer Learned Something New

| Element | Source Content | Source Location |
|---------|--------------|-----------------|
| **Narrative** | Rogers' arc from Prince (1983-1988) through Geggy Tah to Berklee and psychoacoustics | M3, Rogers profile |
| **Pull Quote** | "Tommy taught me that music is an expression of life." -- Susan Rogers, Tape Op | M3, Key quotes |
| **Data Points** | Prince tenure (1983-88), GT co-production credits, Berklee appointment, McGill PhD | M3, verified data |
| **Deep Dive** | The specific moment: the most technically accomplished engineer in pop music was transformed by two unknowns in a home studio. What Rogers learned that Prince's studio couldn't teach. | M3, Rogers analysis |
| **Thread Connections** | Influence thread from R2-P1 (Grand Opening production); Timeline thread to R4 (Rogers' post-GT path) | Cross-module |

#### Panel 2: Pamelia and the Theremin

| Element | Source Content | Source Location |
|---------|--------------|-----------------|
| **Narrative** | Handing someone an instrument they've never touched and changing an instrument's modern history. | M3, Stickney profile |
| **Pull Quote** | Bob Moog: "true modern-day maestro" | M3, Moog endorsement |
| **Data Points** | Instrument (theremin), technique (walking bass from jazz upright), performances (SNL, TED, Vienna) | M3, verified data |
| **Deep Dive** | The walking bass technique that came from jazz upright training. How expertise in one instrument transfers to another when the creative environment permits. | M3, Stickney analysis |
| **Thread Connections** | Influence thread from R2-P3 (Into the Oh is where the introduction happens); Timeline thread to R4 (Pamelia's subsequent career) | Cross-module |

#### Panel 3: David Byrne -- The Curator's Bet

| Element | Source Content | Source Location |
|---------|--------------|-----------------|
| **Narrative** | What it means to sign an act that doesn't fit your label's identity because the music demands it. | M3, Byrne profile + M5 cross-ref |
| **Pull Quote** | Byrne: "strange, but musical" as Luaka Bop philosophy | M3/M5, Curatorial quotes |
| **Data Points** | Label (Luaka Bop), founded (1988), parent (Warner Bros), GT signing (~1993) | M3/M5, verified data |
| **Deep Dive** | The Luaka Bop philosophy: curatorial courage enables inclusionary practice. How design, naming, and positioning are creative acts that determine how music is heard. | M3, Byrne analysis + M5 |
| **Thread Connections** | Concept thread from R1-P2 (Byrne's reaction to demo); Influence thread to R5-P1 (label founding story) | Cross-module |

#### Panel 4: The Constellation Map

| Element | Source Content | Source Location |
|---------|--------------|-----------------|
| **Narrative** | Interactive visualization of every person who passed through the GT creative field | M3, Full network data |
| **Pull Quote** | N/A -- this is a visualization panel, not a narrative panel | |
| **Data Points** | 11+ nodes: Jordan, Kurstin, Rogers, Byrne, Pamelia, Gadson, Hahn, Anderson, Phillips, Millstein, Byard | M3, Complete roster |
| **Deep Dive** | Where they came from. Where they went. What they carried with them. Edge labels describe specific creative exchanges. | M3, Full profiles |
| **Tool Integration** | SVG/D3.js constellation map -- node size reflects outbound influence, edge labels describe creative exchange | D3 scaffold |
| **Thread Connections** | Hub panel -- all threads pass through the constellation map | Cross-module |

### Try Session: The Constellation Exercise

| Element | Detail |
|---------|--------|
| **Title** | The Constellation Exercise |
| **Description** | User maps their own creative network -- the people who changed their practice |
| **Instructions** | Identify 5-10 people who taught you something that changed your creative practice. Not formal mentors. The person who handed you a book, an instrument, an idea that rerouted everything. |
| **Tool Integration** | SVG constellation map template (same D3 scaffold as Panel 4) |
| **Constraint** | Focus on *transformative moments*, not institutional relationships |
| **Estimated Time** | 15-20 minutes |
| **Fallback** | Paper/text exercise: list people and draw connections |
| **Connection** | Direct application of Panel 4's network mapping methodology |

---

## Room 4: The Ripple (Post-Geggy Tah Trajectories)

### Premise

> "The measure of a creative ecosystem isn't what it produced. It's what it made possible."

### Source: Module 4 (Post-Geggy Tah Trajectories)

Room 4 draws from the Phase 1 Trajectories module to trace where the creative DNA went after Geggy Tah became inactive around 2001. The room's pedagogical centerpiece is the two-chart visualization exercise that demonstrates why network analysis reveals what market analysis hides.

### Panel Mapping

#### Panel 1: From Pomona to "Hello"

| Element | Source Content | Source Location |
|---------|--------------|-----------------|
| **Narrative** | Kurstin's trajectory: jazz pianist to indie band keyboardist to nine-time Grammy winner. The decision point. The bridge. | M4, Kurstin section |
| **Pull Quote** | Kurstin: "I learned how to produce and record music. Everything happened." | M4, Kurstin interviews |
| **Data Points** | Grammy count (9), notable productions (Adele "Hello," Foo Fighters "Run," Sia, Beck, Pink), Bird & the Bee formation (2006) | M4, verified data |
| **Deep Dive** | The specific production DNA: multi-instrumental fluency, genre-agnostic arrangement, willingness to play everything yourself. How Geggy Tah's inclusionary practice became the foundation for modern pop production. | M4, Kurstin analysis |
| **Thread Connections** | Influence thread from R1-P3 (jazz training as foundation); from R2-P4 (multi-instrumental toolkit); Timeline thread through full arc | Cross-module |

#### Panel 2: The Quiet Craftsman

| Element | Source Content | Source Location |
|---------|--------------|-----------------|
| **Narrative** | Tommy Jordan's less visible but artistically consistent post-band path. | M4, Jordan section |
| **Pull Quote** | T Bone Burnett's praise; Ben Harper's endorsement | M4, Jordan testimonials |
| **Data Points** | Steel drums on Jack Johnson's "Flake," continued LA music scene presence | M4, verified data |
| **Deep Dive** | The question posed without answering: what does success look like when measured by creative integrity rather than commercial visibility? The module lets the user decide. | M4, Jordan analysis |
| **Thread Connections** | Influence thread from R1-P1 (CoCu founder); Concept thread to R4-P3 (visibility vs. influence) | Cross-module |

#### Panel 3: The Chart That Lies

| Element | Source Content | Source Location |
|---------|--------------|-----------------|
| **Narrative** | A data visualization exercise demonstrating why network analysis reveals what market analysis hides. | M4, Visualization concept |
| **Pull Quote** | N/A -- this is an exercise panel | |
| **Data Points** | Market data (chart positions) + Network data (Grammys via Kurstin, Moog program via Pamelia, Berklee via Rogers, Jack Johnson via Jordan) | M4, Full trajectory data |
| **Tool Integration** | D3.js two-chart toggle scaffold | D3 scaffold |
| **Deep Dive** | Same band. Same data. Radically different story. The toggle between views is the lesson. | M4, Visualization spec |
| **Thread Connections** | Concept thread -- the culminating demonstration of the inclusionary wave's ripple effect | Cross-module |

### Try Session: The Two Charts

| Element | Detail |
|---------|--------|
| **Title** | The Two Charts |
| **Description** | User produces two visualizations of a band of their choosing: market chart and network chart |
| **Instructions** | 1. Choose a band or artist. 2. Plot their "success" by commercial metrics (chart positions, sales). 3. Plot their "success" by network influence (where did members go? what did they catalyze?). 4. Compare the two stories. |
| **Tool Integration** | D3.js visualization scaffold with sample GT data pre-loaded |
| **Constraint** | Must produce both views. The comparison IS the exercise. |
| **Estimated Time** | 20-30 minutes |
| **Fallback** | Paper/spreadsheet exercise with provided data template |
| **Connection** | Direct application of Panel 3's two-chart methodology |

---

## Room 5: The Label (Luaka Bop and Curatorial Practice)

### Premise

> "The space an artist lands in shapes what they can become. Curatorial decisions are creative decisions."

### Source: Module 5 (Cultural Context)

Room 5 draws from the Phase 1 Cultural Context module to examine Luaka Bop Records as a case study in curatorial practice and to situate Geggy Tah within the broader landscape of 1990s alternative music.

### Panel Mapping

#### Panel 1: The Sri Lankan Tea and the Masonic Eye

| Element | Source Content | Source Location |
|---------|--------------|-----------------|
| **Narrative** | Luaka Bop's founding: named after tea packaging, designed by Tibor Kalman, explicit rejection of "world music" as category | M5, Luaka Bop section |
| **Pull Quote** | Byrne on the label philosophy: surfacing music that is "strange, but musical" | M5, Byrne quotes |
| **Data Points** | Founded (1988), founder (David Byrne), design (Tibor Kalman/M&Co), parent label (Warner Bros) | M5, verified data |
| **Deep Dive** | How design, naming, and positioning are creative acts that determine how music is heard. The Masonic eye logo. The Sri Lankan tea connection. | M5, Founding analysis |
| **Thread Connections** | Influence thread from R3-P3 (Byrne's curatorial vision); Concept thread to R5-P2 (curatorial identity) | Cross-module |

#### Panel 2: The American Exception

| Element | Source Content | Source Location |
|---------|--------------|-----------------|
| **Narrative** | Why GT on Luaka Bop is the most interesting thing about their career from a music industry perspective | M5, American Exception analysis |
| **Pull Quote** | Context on the paradox: American rock band on an international voices label | M5, Industry analysis |
| **Data Points** | Luaka Bop roster analysis, GT as exception to curatorial pattern | M5, verified data |
| **Deep Dive** | What Byrne's decision to sign them says about the limits and possibilities of curatorial identity. The exceptions define the rule. | M5, American Exception |
| **Thread Connections** | Concept thread from R1-P2 (the signing story); Influence thread to R3-P3 (Byrne's bet) | Cross-module |

### Try Session: The Label Exercise

| Element | Detail |
|---------|--------|
| **Title** | The Label Exercise |
| **Description** | User designs a hypothetical record label with a coherent identity AND an identity-breaking exception |
| **Instructions** | 1. Name your label. 2. Define its visual identity. 3. Articulate its curatorial philosophy in one sentence. 4. Choose your first three signings. 5. Include at least one act that breaks your stated identity. 6. Explain why the exception strengthens the rule. |
| **Tool Integration** | None required -- this is a design/thought exercise |
| **Constraint** | Must include the identity-breaking act. The exception is the point. |
| **Estimated Time** | 15-20 minutes |
| **Fallback** | N/A -- exercise is text-native |
| **Connection** | Direct application of Panel 2's lesson about curatorial identity |

---

## Thread System Architecture

### Thread Types

The module uses three navigation threads that cross-cut the room structure, allowing users to follow thematic paths across rooms rather than proceeding linearly.

| Thread | Description | Panels Connected |
|--------|-------------|-----------------|
| **Influence** | Traces creative DNA across rooms -- who learned what from whom | R1-P1 to R3-P3, R2-P1 to R3-P1, R2-P3 to R3-P2, R3-P1 to R4-P1, R3-P2 to R4-P1, R1-P3 to R4-P1 |
| **Timeline** | Chronological navigation layer -- events in order | R1-P2 (signing) to R2-P1 (Grand Opening) to R2-P2 (Sacred Cow) to R2-P3 (Into the Oh) to R4 (post-2001) |
| **Concept** | Tracks the "inclusionary aesthetics" principle across contexts | R1-P1 (CoCu inclusion) to R2-P4 (sonic inclusion) to R3-P3 (curatorial inclusion) to R5-P2 (label identity) |

### Thread Connection Count

| Room | Incoming Threads | Outgoing Threads | Total Connections |
|------|-----------------|-----------------|-------------------|
| R1: Workshop | 2 | 5 | 7 |
| R2: Sound | 3 | 6 | 9 |
| R3: Network | 5 | 4 | 9 |
| R4: Ripple | 4 | 2 | 6 |
| R5: Label | 3 | 1 | 4 |

---

## Try Session Integration Map

### Tool Requirements

| Try Session | Room | Primary Tool | Fallback | Estimated Time |
|-------------|------|-------------|----------|----------------|
| Workshop Exercise | R1 | GSD-Tracker | Text-only instructions | 15-20 min |
| Found Sound Session | R2 | GSD-Tracker | Any DAW / written description | 20-25 min |
| Constellation Exercise | R3 | SVG/D3.js template | Paper/text mapping | 15-20 min |
| The Two Charts | R4 | D3.js scaffold | Spreadsheet / paper | 20-30 min |
| Label Exercise | R5 | None (text-native) | N/A | 15-20 min |

### Pedagogical Sequence

Each Try Session reinforces the panel content through hands-on practice:

1. **R1: Workshop** -- Experience the inclusionary constraint directly (combine everything)
2. **R2: Found Sound** -- Apply unconventional toolkit philosophy (every sound is an instrument)
3. **R3: Constellation** -- Map your own creative network (make influence visible)
4. **R4: Two Charts** -- Produce competing narratives from the same data (see the hidden story)
5. **R5: Label** -- Design a curatorial identity with deliberate exceptions (the exception proves the rule)

---

## Progressive Disclosure Model

### Disclosure Levels

| Level | What User Sees | When |
|-------|---------------|------|
| **Lobby** | Overview paragraph, Byrne quote, timeline ribbon, room entry points | Initial page load |
| **Room** | Room premise, panel titles with one-line summaries, Try Session preview | Click into room |
| **Panel** | First paragraph of narrative, pull quote, data table | Click into panel |
| **Deep Dive** | Full narrative, extended analysis, source references | Click "Read more" |
| **Try Session** | Instructions, tool integration, estimated time | Click "Try it" |

### Navigation Paths

A user can reach any content through three paths:

1. **Sequential** -- Lobby to R1 to R2 to R3 to R4 to R5 (linear progression)
2. **Thread** -- Follow Influence, Timeline, or Concept threads across rooms
3. **Direct** -- Jump to any room/panel from the lobby or navigation bar

---

## Content Flow Diagram

### Source to Output Pipeline

```
Phase 1 Research     Phase 2 Architecture     Phase 2 Output
================     ====================     ==============

M1: Origins    ──>   R1: Workshop (3P + TS)   ──>  Panel content
M2: Discography──>   R2: Sound (4P + TS)      ──>  Panel content + Tracker hooks
M3: Network    ──>   R3: Network (4P + TS)    ──>  Panel content + constellation SVG
M4: Trajectories──>  R4: Ripple (3P + TS)     ──>  Panel content + two-chart D3
M5: Context    ──>   R5: Label (2P + TS)      ──>  Panel content

                     Thread System             ──>  Cross-room navigation
                     Creative DNA Pattern      ──>  Reusable template
                     College Directory         ──>  .college/ integration
```

### Build Wave Assignment

| Wave | Components | Dependencies |
|------|-----------|-------------|
| **W0: Foundation** | TypeScript interfaces, Phase 1 content index, room templates | None |
| **W1A: Content Core** | R1 (Workshop), R2 (Sound), Try Sessions (R1+R2), Tracker hooks | W0 |
| **W1B: Network/Viz** | R3 (Network), constellation map, R4 (Ripple), two-chart D3, R5 (Label) | W0 |
| **W2: Integration** | Thread system, Creative DNA Study template, cross-room consistency | W1A + W1B |
| **W3: Publication** | College directory, verification pass, index + packaging | W2 |

---

## Module Architecture Summary

### Statistics

| Metric | Value |
|--------|-------|
| Rooms | 5 |
| Panels | 16 (3 + 4 + 4 + 3 + 2) |
| Try Sessions | 5 |
| Thread types | 3 (Influence, Timeline, Concept) |
| Thread connections | 35+ |
| Interactive visualizations | 2 (constellation map, two-chart toggle) |
| Tool integrations | 3 (GSD-Tracker, D3.js, SVG constellation) |
| Progressive disclosure levels | 5 (lobby, room, panel, deep dive, try session) |
| Source modules consumed | 5 (full Phase 1 corpus) |
| Navigation paths | 3 (sequential, thread, direct) |

### Cross-Project References

- [GGT -- Geggy Tah Deep Research](../GGT/index.html) -- Primary source material
- [DAA -- Deep Audio Analysis](../DAA/index.html) -- Sonic analysis vocabulary and methodology
- [ARC -- Shapes and Colors](../ARC/index.html) -- Visual pattern language for constellation rendering
- [SPA -- Spatial Awareness](../SPA/index.html) -- Room-based spatial metaphor architecture
- [GRD -- Gradient Engine](../GRD/index.html) -- Color gradient specification for visualizations
- [MCR -- Minecraft RAG](../MCR/index.html) -- Room-building pedagogy, construction-as-learning
- [VAV -- Voxel as Vessel](../VAV/index.html) -- Data container architecture for TypeScript interfaces

---

*Research-to-room mapping for the Inclusionary Wave Educational Module. Every panel traces to a specific Phase 1 research module. Every thread connection is documented. The architecture serves the pedagogy: make invisible creative pathways visible and navigable.*
