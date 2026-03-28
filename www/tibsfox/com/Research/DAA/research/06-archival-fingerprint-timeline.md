# Broadcast Heritage Engine

> **Domain:** Archival Audio Intelligence & Cultural Listening
> **Module:** 6 -- Broadcast Heritage Engine
> **Through-line:** *The frogs didn't start calling because the analysis got better. They started calling because the fox sat still long enough.* There is another kind of listening the DAA has not yet learned: the kind where the archive itself is the soundscape. The collector who pressed "record" on a Tuesday in 1972 because they heard something worth keeping -- a station's last hour in a format it had inhabited for a decade -- was practicing the same discipline as the field biologist who sets up a hydrophone before dawn. The equipment was different. The impulse was the same: *this moment will not come again.*

---

## Table of Contents

1. [Origin and Purpose](#1-origin-and-purpose)
2. [The Problem Space](#2-the-problem-space)
3. [Module Architecture](#3-module-architecture)
4. [M6-A: Archival Ingestion Layer](#4-m6-a-archival-ingestion-layer)
5. [M6-B: Acoustic Fingerprinting Layer](#5-m6-b-acoustic-fingerprinting-layer)
6. [M6-C: Timeline Navigation Layer](#6-m6-c-timeline-navigation-layer)
7. [Research Gaps and Open Questions](#7-research-gaps-and-open-questions)
8. [Relationship to DAA v1.0](#8-relationship-to-daa-v10)
9. [Projected Execution Shape](#9-projected-execution-shape)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. Origin and Purpose

This module is a formal scope extension to the Deep Audio Analyzer (DAA) mission. It captures a planning gap identified after DAA v1.0 was finalized: the cultural-historical dimension of audio -- broadcast heritage, format archaeology, and the collector archive layer -- was deliberately deferred from the original scope. This note formalizes that deferral, characterizes the gap, and specifies the shape of the work required to address it.

The Deep Audio Analyzer, as specified in its v1.0 mission, operates in four primary domains: acoustic signal analysis (M1), biological source identification (M2), spatial geometry (M3), and temporal narrative (M4), coordinated by an iterative refinement loop (M5). The underlying research subjects are natural soundscapes -- frog choruses, wind-through-cedar, the acoustic grammar of a PNW evening.

The gap is this: human-made audio archives exist on a parallel plane. Tens of thousands of hours of broadcast recordings -- radio airchecks capturing the exact moment a station shifted format, jingle production reels from the PAMS and TM Productions catalogs, call-letter transition recordings, the last hour of a format that would never return -- are documented in collector databases, referenced in broadcast history scholarship, and held in scattered personal and institutional archives. They are catalogued but not *connected*. The names exist; the audio does not follow. A research module that could navigate this territory would extend the DAA from ecological listening into cultural listening, making broadcast history as traversable as a waveform.

| Field | Value |
|-------|-------|
| Parent mission | Deep Audio Analyzer v1.0 (March 8, 2026) |
| Extension type | New primary research module |
| Proposed module ID | M6 |
| Module name | Broadcast Heritage Engine |
| Depends on | M1 (acoustic analysis), M4 (temporal narrative) |
| Target release | DAA v2.0 (unscheduled) |
| Blocking issue | Rights landscape requires legal review before execution |
| Status | Scope note -- not queued for GSD orchestrator |

---

## 2. The Problem Space

### 2.1 What Exists

Broadcast history is one of the most thoroughly *described* and least *accessible* archives in American cultural memory. The collector community has done extraordinary preservation work:

- **Aircheck archives** -- Recordings made by listeners or station engineers of actual on-air broadcasts. The Aircheck Library, Old Time Radio Researchers Group (OTRR), and Internet Archive's radio collection hold tens of thousands of hours spanning the 1930s to present. Individual collectors maintain private holdings that dwarf institutional collections.

- **Jingle production catalogs** -- PAMS Productions (Dallas, 1951-1978) produced jingle packages for hundreds of stations. TM Productions, JAM Creative Productions, and Pepper-Tanner similarly documented the sonic identity of American radio across decades. Original multi-track production reels and finished packages have been partially digitized and catalogued by enthusiasts.

- **Format-change recordings** -- When a station changes format, the final minutes of the old format and the first minutes of the new are often captured by listeners who knew in advance. These recordings document the acoustic archaeology of format transitions: the last country song on KABL before it became KFRC, the final hour of Album Rock before the switch to All-News.

- **Broadcast museum holdings** -- The Museum of Broadcast Communications (Chicago), the Paley Center for Media (New York/Los Angeles), and various university radio archives hold curated collections with metadata but limited public audio access.

The metadata layer is rich. The *audio* does not follow.

### 2.2 The Linking Gap

The gap is not preservation -- it is **navigability**. Three disconnections compound each other:

1. **Catalogue without content** -- Collector databases list recordings with station call letters, dates, formats, and sometimes duration. The recordings themselves are held separately, often in personal archives, with no stable URL or machine-readable access path.

2. **Content without analysis** -- Where audio *is* accessible (Internet Archive hosts thousands of uploads), it exists as flat files with minimal metadata. There is no acoustic fingerprinting, no format-signature classification, no cross-linking between recordings of the same station at different eras.

3. **Analysis without context** -- Academic broadcast history scholarship (e.g., Hilliard and Keith's *The Broadcast Century*, Douglas's *Listening In*) provides rich narrative context but without computational grounding. The claim that Top 40 radio had a characteristic "hot clock" compression signature is historically supported but not acoustically verified or machine-readable.

An M6 module capable of addressing all three layers would be the most complex component in the DAA ecosystem -- and the most culturally resonant.

### 2.3 Rights: The Blocking Variable

Most airchecks occupy legal grey territory. They were captured via personal time-shifting (recording off-air) and circulated among collectors under informal norms that predate digital distribution. The recordings are not commercially licensed. The underlying musical content they contain often is. This creates a layered rights problem:

- Station jingles produced by PAMS et al. may have retained publishing rights with the original producers, their successors, or nowhere (rights lapse, company dissolution)
- Musical content within airchecks triggers standard sound recording and composition rights -- the station's original broadcast license does not transfer to archive reproduction
- Spoken-word content (DJ patter, news, weather) is generally uncopyrightable as to facts, but recordings of that content may be protected as sound recordings
- Internet Archive hosts much of this material under a de-facto tolerance policy that could change

This means M6 cannot be executed against arbitrary archive content without legal clearance. The module specification assumes a **rights-cleared corpus** as a precondition, and flags legal review as a Wave 0 gate.

---

## 3. Module Architecture

M6 decomposes into three sub-modules that can be developed in parallel once the rights-cleared corpus is confirmed:

```
M6: Broadcast Heritage Engine
|
+-- M6-A: Archival Ingestion Layer
|   Normalize metadata from distributed collector archives
|   (OTRR, Internet Archive, institutional holdings)
|   into a unified schema: call letters, dates, format,
|   duration, source, rights status, access path.
|   Output: machine-readable corpus index.
|
+-- M6-B: Acoustic Fingerprinting Layer
|   Apply M1's FFT/spectral pipeline to each catalogued
|   recording. Annotate: jingle key signatures, compression
|   profiles, format-signature acoustic palettes
|   (Top 40 hot clock, AM talk era, FM album rock), DJ
|   vocal cadence, production style markers.
|   Output: acoustic feature vectors per recording.
|
+-- M6-C: Timeline Navigation Layer
    Map acoustic feature vectors onto broadcast history
    timeline. Format-change moments become navigable
    waypoints. User can traverse radio history aurally:
    same call letters, three decades apart, different
    acoustic DNA.
    Output: navigable broadcast history graph.

Shared dependency: M4 Temporal Narrative Engine
  (chorus recruitment dynamics) provides the event-
  detection framework that M6-C adapts for format
  transitions -- a station format change is an acoustic
  event the same way a frog chorus peak is an acoustic
  event. The math is the same; the subject is human.
```

| Field | Value |
|-------|-------|
| Module ID | M6 |
| Name | Broadcast Heritage Engine |
| Chipset role | Copper (timeline sequencer / DMA coordinator) |
| Primary model | Opus (cultural judgment, cross-era synthesis) |
| Secondary model | Sonnet (corpus ingestion, metadata normalization) |
| Depends on | M1 (FFT/spectral), M4 (temporal narrative) |
| Integration point | Shared audio analysis pipeline from M1 |
| New capability | Archival ingestion, acoustic fingerprinting, cultural timeline navigation |

---

## 4. M6-A: Archival Ingestion Layer

### 4.1 Objective

Produce a unified, machine-readable index of rights-cleared broadcast recordings, normalized from heterogeneous source archives into a common schema.

### 4.2 Key Source Archives

| Archive | Holdings Focus | Access Notes |
|---------|---------------|-------------|
| Old Time Radio Researchers Group (OTRR) | Pre-1960 radio drama, variety, news | Catalogued; digital files distributed via membership |
| Internet Archive (archive.org) | Broad; Top 40 airchecks, PAMS jingles, format samples | Public URLs; rights status variable per item |
| Museum of Broadcast Communications | Chicago-area stations; format history documentation | Institutional access; limited remote |
| Paley Center for Media | Network radio and TV heritage | On-site access only for most holdings |
| REELRADIO.com | Top 40 aircheck focus, 1960s-1990s | Streaming only; no download; well-catalogued |
| PAMS Productions Archive (partial) | Jingle production reels, client packages | Partially held by collectors; some at UT Austin |
| University of Texas Dolph Briscoe Center | PAMS business records and audio | Archival access; digitization ongoing |

### 4.3 Unified Record Schema

```json
{
  "recording_id": "string (UUID)",
  "call_letters": "string",
  "market": "string (city, state)",
  "format_at_recording": "string (Top 40 / AOR / Country / ...)",
  "recording_date": "date (YYYY-MM-DD or YYYY-MM or YYYY)",
  "duration_seconds": "integer",
  "recording_type": "enum [aircheck, jingle_package, format_transition, demo, promo]",
  "source_archive": "string",
  "access_path": "URL or null",
  "rights_status": "enum [cleared, unknown, restricted, public_domain]",
  "notes": "string",
  "acoustic_features": "M6-B output (nullable until processed)"
}
```

The schema accommodates imprecise dates (common in collector archives where only the year or month is known), nullable access paths (recordings known to exist but not digitally available), and explicit rights status tracking. The `acoustic_features` field is populated by M6-B after ingestion.

---

## 5. M6-B: Acoustic Fingerprinting Layer

### 5.1 Objective

Apply the M1 Foundation Analysis Engine's FFT and spectral density pipeline to each catalogued recording, producing acoustic feature vectors that characterize the production style, era, and format identity of each recording.

### 5.2 Format Signature Vocabulary

Research into broadcast production history suggests the following acoustic signatures are consistently distinguishable across format eras. These represent the initial classification vocabulary; empirical validation against the rights-cleared corpus is required.

| Format / Era | Acoustic Signature | Notes |
|-------------|-------------------|-------|
| AM Top 40 (1955-1975) | Heavy dynamic compression, boosted upper-mids, mono; jingles in 4-8 bar sung IDs | PAMS package; station vocal sound |
| AM Talk / News (1970s-1990s) | Narrow dynamic range; male vocal dominance; high SNR; minimal music bed | Format ID by spectral flatness |
| FM Album Rock (1971-1985) | Wide dynamic range; stereo field; minimal jingle; DJ patter with long music sets | Identifiable by DR and low compression |
| Contemporary Hit Radio (1983-1995) | Heavy limiting; bright high-end; fast rotations; imaging jingles | RCS/selector era |
| Adult Contemporary (1980s-2000s) | Mid-range warmth; smooth compression; frequent weather/news breaks | Broadest format; least acoustically distinct |
| Jingle package (PAMS, 1960s) | Live orchestra + vocal group; specific reverb (RCA 44-BX era) | Multi-track archaeology |

### 5.3 Feature Extraction Pipeline

The pipeline extends M1's existing FFT infrastructure with broadcast-specific feature extractors:

```
INPUT: rights-cleared .mp3 or .wav (normalized to -23 LUFS)
  |
  +-- M1 Foundation Analysis Engine
  |     FFT: 4096-point Hann window
  |     Spectral centroid, spread, rolloff
  |     Dynamic range (DR) measurement (ITU-R BS.1770)
  |     RMS / peak / crest factor
  |
  +-- M6-B Extended Features
  |     Stereo field width (L/R correlation coefficient)
  |     Jingle detection (onset + 4-8 bar pattern + harmonic structure)
  |     Vocal cadence estimation (syllable rate via envelope)
  |     Music bed presence (harmonic vs. noise floor ratio)
  |     Era probability vector (softmax over format signatures)
  |
OUTPUT: acoustic_features JSON blob -> M6-A record schema
```

### 5.4 Chromaprint and Dejavu Integration

Two established acoustic fingerprinting systems provide complementary capabilities:

**Chromaprint** (AcoustID foundation) generates compact 32-bit fingerprints from chroma features -- the pitch class profile of audio over time. For M6, Chromaprint enables:

- Duplicate detection across collector archives (same recording, different sources)
- Cross-linking recordings that share jingle packages (same PAMS package, different stations)
- Version identification (same jingle, different production era)

**Dejavu** is a Python-based audio fingerprinting system that stores spectral peak constellations in a database for rapid matching. For M6, Dejavu enables:

- Query-by-example: "find all recordings containing this specific jingle"
- Fragment matching: identify a partial recording within a longer aircheck
- Temporal alignment: synchronize overlapping recordings of the same broadcast from different sources

Both systems operate on the spectral features already extracted by M1, requiring minimal additional computation. The integration point is the M6-B feature extraction pipeline, where Chromaprint and Dejavu fingerprints are computed alongside the format-signature features and stored in the acoustic_features blob.

### 5.5 Cassette Corpus Considerations

A significant fraction of the aircheck archive was recorded on consumer-grade cassette decks -- Realistic CTR-68 units, Sony Walkman Professional WM-D6C, and countless no-name portables. The acoustic consequences are consistent and well-characterized:

- **High-frequency rolloff** above 10-12 kHz due to tape head alignment, tape formulation (Type I ferric vs. Type II chrome), and playback speed (1 7/8 ips standard cassette)
- **Wow and flutter** introducing pitch modulation at 0.1-0.3% (good decks) to 0.5%+ (consumer portables)
- **Azimuth error** causing stereo image collapse on recordings made on one deck and played back on another
- **Dolby NR artifacts** when recordings made with Dolby B noise reduction are played back without the matching decoder, producing a characteristic "bright and hissy" quality

The M6-B feature extraction pipeline must accommodate these degradations. Features that rely on high-frequency content (spectral rolloff, brightness measures) need a "cassette mode" that adjusts thresholds. Features that rely on stereo field (L/R correlation) must handle mono-collapsed recordings gracefully. The era probability vector classifier should treat cassette artifacts as informative rather than corrupting -- a recording with cassette wow is likely pre-1990, which is itself a dating feature.

---

## 6. M6-C: Timeline Navigation Layer

### 6.1 Objective

Map the acoustic corpus onto a navigable broadcast history graph. Format-change moments become waypoints that users can traverse aurally, hearing the acoustic DNA of a station shift in real time.

### 6.2 The Format-Change Waypoint

A format change is the broadcast equivalent of a frog chorus peak: a concentrated acoustic event at a specific temporal coordinate. The M4 Temporal Narrative Engine's event detection framework applies directly. The adaptation:

- **In ecology:** Event = onset of chorus recruitment (energy arc, sudden species density shift)
- **In broadcast heritage:** Event = format transition (spectral centroid shift, compression profile change, jingle vocabulary change, DJ vocal cadence change)

The mathematics of onset detection, energy arc analysis, and temporal segmentation are identical. Only the feature domain changes.

### 6.3 Navigation Graph Structure

```
BROADCAST HISTORY GRAPH
Nodes:  Individual recordings (call letters + date + format)
Edges:  Temporal (same station, adjacent recordings)
        Format (same format across different markets)
        Acoustic (cosine similarity in feature space)
        Transition (format-change waypoints)

Example traversal:
  KABL San Francisco, 1972 (Beautiful Music)
    |-- temporal --> KABL SF, 1981 (Adult Contemporary)
    |-- transition --> [FINAL BEAUTIFUL MUSIC HOUR, 1981]
    |-- acoustic --> KYA SF, 1972 (same era acoustic profile)
    |-- format --> WSB Atlanta, 1972 (Beautiful Music, SE market)

A user browsing the KABL node can:
  - Hear the 1972 acoustic signature
  - Navigate to the 1981 format-change recording
  - Compare acoustic DNA across the decade
  - Find other Beautiful Music stations with similar signatures
  - Hear what changed (DR, jingle vocabulary, compression) vs.
    what stayed the same (market, call letters, listener base)
```

### 6.4 Edge Types and Weights

| Edge Type | Connects | Weight Function | Interpretation |
|-----------|----------|----------------|----------------|
| Temporal | Same station, different dates | 1 / years_apart | Closer dates = stronger link |
| Format | Same format, different markets | 1 / market_distance | Same-region stations cluster |
| Acoustic | Feature space proximity | Cosine similarity | Acoustically similar recordings regardless of metadata |
| Transition | Pre/post format change | Binary (1 if transition exists) | Format-change waypoints |

The acoustic edge type is the most powerful for discovery: it connects recordings that *sound alike* regardless of station, market, or date. A 1968 PAMS jingle package on WABC New York and a 1972 PAMS package on KHJ Los Angeles will cluster by acoustic similarity, revealing the shared sonic vocabulary of an era.

---

## 7. Research Gaps and Open Questions

Before M6 can be queued for execution, the following questions require resolution. These become the Wave 0 research tasks for a future DAA v2.0 mission package.

### 7.1 Legal and Access

1. **Rights-cleared corpus baseline:** Which recordings in Internet Archive's radio collection carry explicit rights-cleared status (e.g., CC licenses, explicit collector grants)? A preliminary survey of the `oldtimeradio` and `airchecks` collections at archive.org would establish a working corpus size and rights profile before committing to M6-B engineering work.

2. **PAMS archive access:** The Dolph Briscoe Center for American History at the University of Texas holds PAMS Productions business records. What is the digitization status of the audio holdings, and do they allow computational analysis under a research use agreement?

3. **REELRADIO licensing posture:** REELRADIO.com maintains one of the best-curated Top 40 aircheck collections. They currently allow streaming but not download. Would they consider a research API or batch access arrangement for acoustic analysis?

### 7.2 Technical

1. **Corpus quality floor:** Many airchecks were recorded on consumer cassette decks. High-frequency rolloff above 10-12 kHz is common. Acoustic fingerprinting that relies on spectral features above this range will fail. Feature extraction must be validated against low-quality source material, and the M1 pipeline may need a "cassette corpus" operating mode.

2. **Mono vs. stereo handling:** Pre-FM AM airchecks are mono. The M6-B stereo field feature is undefined for mono recordings and must be masked or replaced in the feature vector.

3. **Format signature ground truth:** The format signature vocabulary in Section 5.2 is based on historical and qualitative sources. It requires validation against a labeled corpus before the era probability vector classifier can be trained. Minimum viable labeled set: 50 recordings per format class, 6 classes = 300 labeled examples.

### 7.3 Cultural

1. **Market representativeness:** Collector archives skew toward major markets (New York, Los Angeles, Chicago, San Francisco) and the Top 40/AOR eras. Small-market stations, country/Spanish-language/Black radio formats, and the pre-1955 era are underrepresented. An M6 corpus that reflects only the collector canon will reproduce its biases.

2. **Community of knowledge:** Broadcast history collectors hold contextual knowledge that no acoustic analysis can recover: why a station changed format, who the program director was, what the competitive landscape looked like. M6's design should include structured space for collector annotation, not just machine-derived features.

---

## 8. Relationship to DAA v1.0

| DAA v1.0 Module | M6 Relationship | Notes |
|-----------------|-----------------|-------|
| M1: Foundation Analysis | Direct dependency | M6-B uses M1's FFT and spectral pipeline without modification |
| M2: Source Identification | Conceptual parallel | Both classify audio by source type; M2 = biological, M6 = cultural |
| M3: Spatial Reasoning | No dependency | Spatial geometry is not meaningful for broadcast mono/stereo |
| M4: Temporal Narrative | Direct dependency | M6-C adapts M4's event detection for format-transition waypoints |
| M5: Refinement Controller | Inherited | M6 uses the same iterative refinement loop; user can annotate acoustic fingerprints across passes |

The Amiga Principle applies here in a specific form: M6 adds a new study domain without requiring changes to the M1-M5 pipeline. The acoustic analysis engine is format-agnostic. A frog chorus and a 1967 PAMS jingle package enter the same FFT pipeline; what differs is the interpretation layer. Architectural leverage: one engine, two worlds.

---

## 9. Projected Execution Shape

When M6 is ready to be queued -- after legal review, corpus confirmation, and ground-truth labeling -- the execution shape is projected as follows.

### 9.1 Wave Plan

| Wave | Name | Key Tasks |
|------|------|-----------|
| Wave 0 | Legal & Corpus | Rights landscape survey; corpus access agreements; shared schema; quality floor measurement |
| Wave 1 | Parallel Ingestion | M6-A (metadata normalization) and ground-truth labeling run in parallel |
| Wave 2 | Fingerprinting | M6-B acoustic feature extraction across corpus; classifier training |
| Wave 3 | Navigation | M6-C graph construction; timeline UI prototype |
| Wave 4 | Integration & Verify | M1-M6 integration; DAA v2.0 publication |

### 9.2 Resource Estimates

| Metric | Projected Value |
|--------|----------------|
| Activation profile | Squadron |
| Context windows | 8-12 |
| Sessions | 2-3 |
| Opus / Sonnet / Haiku | 35% / 55% / 10% |
| Blocking gate | Legal review (Wave 0) |
| Minimum corpus size | 300 labeled recordings (ground truth) + rights-cleared working set |

---

## 10. Cross-References

- **[Module 01: Foundation Analysis](01-foundation-analysis.md)** -- M1 FFT and spectral pipeline reused by M6-B without modification
- **[Module 02: Source Identification](02-source-identification.md)** -- Conceptual parallel; biological source classification vs. cultural source classification
- **[Module 03: Spatial Reasoning](03-spatial-reasoning.md)** -- No direct dependency; spatial geometry not applicable to broadcast archive
- **[Module 04: Temporal Narrative](04-temporal-narrative.md)** -- Direct dependency; M6-C adapts M4 event detection for format transitions
- **[Module 05: Verification Matrix](05-verification-matrix.md)** -- M6 verification extends the existing DAA test framework
- **[GTP: Geggy Tah Production](../GTP/index.html)** -- Sibling production mission; shared audio analysis methodology
- **[SGL: Signal and Light](../SGL/index.html)** -- Signal processing foundations
- **[LED: LED Strip Protocols](../LED/index.html)** -- Signal chain architecture patterns

---

## 11. Sources

1. Hilliard, Robert L. and Michael C. Keith. *The Broadcast Century and Beyond: A Biography of American Broadcasting.* 5th ed. Focal Press, 2010.
2. Douglas, Susan J. *Listening In: Radio and the American Imagination.* University of Minnesota Press, 2004.
3. Chromaprint / AcoustID -- acoustic fingerprinting. [acoustid.org](https://acoustid.org/)
4. Dejavu -- audio fingerprinting and recognition. [github.com/worldveil/dejavu](https://github.com/worldveil/dejavu)
5. Internet Archive Radio Collection. [archive.org/details/radio](https://archive.org/details/radio)
6. Old Time Radio Researchers Group (OTRR). [otrr.org](https://www.otrr.org/)
7. REELRADIO. [reelradio.com](https://www.reelradio.com/)
8. Museum of Broadcast Communications, Chicago. [museum.tv](https://www.museum.tv/)
9. Paley Center for Media. [paleycenter.org](https://paleycenter.org/)
10. Dolph Briscoe Center for American History, University of Texas at Austin. [cah.utexas.edu](https://www.cah.utexas.edu/)
11. ITU-R BS.1770 -- Algorithms to measure audio programme loudness and true-peak audio level. International Telecommunication Union, 2015.
12. PAMS Productions historical documentation. Various collector archives and UT Austin holdings.

---

> *"M6 is the module that honors that impulse. It does not analyze the frog chorus of the airwaves as a metaphor. It applies the literal tools of acoustic ecology to the literal recordings that collectors preserved, and it asks the same question the entire DAA asks: what is this sound, where did it come from, and what does its shape tell us about the world that made it? The answer, in broadcast terms, is the same as in ecological terms: more than you expected."*
> -- DAA Extension Note, March 2026
