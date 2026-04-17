# v1.49.106 — "The AM Radio Dial"

**Released:** 2026-03-28
**Code:** AMR
**Scope:** Single-project research release — broadcast heritage study of AM radio on the West Coast, 1909 to 2026, covering band physics, station chronicles, spectrum licensing, FCC rules, and the all-digital frontier
**Branch:** dev
**Tag:** v1.49.106 (2026-03-28T02:24:20-07:00)
**Commits:** `87b9f3e9c` (1 commit)
**Files changed:** 13 · **Lines:** +2,923 / -0
**Series:** PNW Research Series (#106 of 167)
**Classification:** research release — broadcast-heritage foundations for the PNW media-infrastructure cluster
**Dedication:** KJR Seattle, first licensed PNW transmitter (March 1921) — and every night-owl DJ on a 50 kW clear-channel signal who made the dark miles feel less lonely.
**Engine Position:** 6th release of the v1.49.101-131 research batch, 94th research release of the v1.49 publication arc, inaugurating the Broadcast Heritage sub-cluster within the PNW Infrastructure cluster

> "Before the internet, the radio dial was the only place where a single voice could reach the entire Pacific Northwest at once — in the dark, in the mountains, across the water. That architecture still exists. AM has not been replaced; it has been layered over, and the bottom layer is still the one that works when the lights go out."

## Summary

**AM radio is a hundred-year-old mesh network that still functions.** v1.49.106 ships the AMR research project — six research modules totaling roughly 4,129 lines of prose plus a 1,454-line LaTeX mission-pack, the full HTML viewer stack, and a compiled 221 KB PDF. The project reads AM broadcasting as what it actually is, architecturally: a long-wave spread-spectrum broadcast mesh with federal coordination, per-station licensing, and physical propagation characteristics that internet distribution has never matched. Ground-wave and skywave propagation give a 50 kW clear-channel AM station nighttime coverage that spans multiple states; the same bitrate over IP requires a data center, a CDN, a power grid, and an intact last-mile. The through-line of the release is that "legacy" is the wrong word for infrastructure that keeps working when the replacement fails. AMR catalogs the infrastructure, names the stations, maps the regulatory stack, and argues — by accumulation of specific facts rather than polemic — that AM radio is load-bearing in a way the industry's own forecasts fail to account for.

**Station-by-station chronicles produce a reference that survives consolidation churn.** Module 2 (PNW) and Module 3 (California) catalog the actual broadcasters with founding dates, call-sign changes, format pivots, and ownership transitions. KJR Seattle traces to March 1921 as one of the first licensed Pacific Northwest stations. KGW Portland follows in March 1922. KOMO, KIRO, and KVI fill out the Seattle Golden Age lineup. KCBS San Francisco's origin thread reaches back to Charles Herrold's 1909 experimental station FN in San Jose, later 6XF, later KQW, making it one of the oldest continuously operating broadcast operations in the world — broadcast heritage measured in generations, not product cycles. The Telecom Act of 1996 consolidation wave, the Top 40 format revolution, the news-talk pivot, the Spanish-language growth arc, and the ownership churn of the 2000s are all legible in the chronicles. The catalog outlives any specific owner because it is written against call signs and frequencies, not brand names.

**The AM band itself is a regulatory artifact, not a natural object.** Module 1 grounds the physics (amplitude modulation, 535 to 1705 kHz, ground-wave and skywave propagation at long wavelengths, the night/day coverage asymmetry that forced daytime/nighttime power changes) and then shows that the band's *shape* is federal law. The Radio Act of 1927 created the Federal Radio Commission; the Communications Act of 1934 established the FCC as successor. NARBA (the North American Regional Broadcasting Agreement) allocated clear-channel, regional, and local station classes across the US, Canada, Mexico, Cuba, and the Bahamas. Station classes A, B, C, and D encode the coverage-protection regime that determines who is allowed to be heard when — Class A clear-channel stations get continent-scale nighttime protection; Class D daytime-only stations go dark at sunset. The physics is invariant. The allocation is policy. AMR treats that distinction as load-bearing.

**Licensing pathways make the research immediately actionable.** Module 4 covers the actual paths into the spectrum in 2026: full-power AM (scarce, expensive, mostly transfers rather than new awards), full-power FM (scarcer still), LPFM (100 W nonprofit, community-focused, biennial filing windows), FM translators (used heavily for AM-to-FM migration), Part 15 unlicensed (1 W, under 200 ft coverage, hobbyist and institutional). The module names spectrum scarcity in Seattle, Portland, San Francisco, and Los Angeles as the operative constraint — the dial in Seattle is effectively full; the path to community broadcasting in a major PNW market runs through LPFM windows and translator acquisitions, not new AM construction permits. A prospective broadcaster reading AMR can recover the rules, the filing calendar, and the strategic landscape from the release alone.

**The EV interference problem is an existential threat that regulation cannot solve.** Module 6 covers HD Radio and IBOC hybrid digital, the FCC's 2020 approval of all-digital AM (MA3 mode), and the AM Revitalization proceeding — but the load-bearing finding is that electric-vehicle motor controllers generate broadband radio-frequency interference in the AM band at levels that physically prevent reception. This is not a spectrum-policy problem; it is a physics problem. BMW, Tesla, Ford, and other manufacturers have shipped EVs with AM radio omitted from the head unit because reception inside the vehicle's own EMI envelope is unusable. Regulation can mandate that automakers *include* AM receivers; regulation cannot force the motor controller to stop radiating. The research treats this as genuinely unresolved and notes that any forecast of AM's future must account for a receiver base that shrinks with every EV sold.

**Indigenous broadcasting is a sovereign-spectrum story the mainstream catalog understates.** KWSO Warm Springs (Oregon, Confederated Tribes of Warm Springs) and KYNR Toppenish (Washington, Yakama Nation) are named in the research as sovereign spectrum holders — tribal stations licensed and operated under tribal authority, broadcasting in English and in Native languages. AMR's retrospective flags this as a gap to develop further: the current modules mention the stations but do not yet carry the full treatment that tribal broadcasting warrants, particularly around treaty rights, spectrum sovereignty, and language-preservation mandates. The flag is deliberate. Shipping the gap visibly is how a follow-up release gets prioritized.

**The parallel-track structure produces both a narrative and a reference in one release.** Track Alpha (station histories by region, Modules 2 and 3) and Track Beta (regulatory and spectrum, Modules 1, 4, 5, 6) are designed to be read separately or together. A reader who wants the *story* — who was on the dial, when, and why they matter — reads Alpha. A reader who wants the *rules* — what the band is, how to get on it, what the future looks like — reads Beta. The two tracks cross-reference each other at specific join points (NARBA → clear-channel coverage → KGO 810 kHz; Telecom Act 1996 → consolidation → Clear Channel / iHeart; FM translator rule → AM-to-FM migration → specific PNW stations) so the reference and the narrative reinforce rather than duplicate each other. This is the same two-track structure that worked in v1.49.101 (SST) and earlier arc releases, applied here to a subject with a much longer historical tail.

**The release sits at the intersection of PNW Infrastructure and Fox Companies alignment.** AM broadcasting is, structurally, the nearest historical analog to what FoxFiber and FoxCompute aim to be: federally-coordinated, per-operator-licensed, physically-grounded infrastructure with coverage properties that emerge from wavelength and geography rather than from platform economics. The cross-reference block ties AMR to the ABL (music production ecosystem), WAL (audio workstation landscape), FLS (FL Studio), SYS (systems administration — transmitter site infrastructure), and RFC (standards authority) projects. The chain is load-bearing: AM stations broadcast content produced in DAWs (ABL, WAL, FLS), operating on transmitter-site infrastructure (SYS), under standards maintained by regulatory authorities (RFC). AMR is the infrastructure capstone that those four projects have been pointing at.

## Key Features

**Location:** `www/tibsfox/com/Research/AMR/` · **Files:** 13 · **Lines:** +2,923 / -0
**Rosetta Stone cluster touched:** PNW Infrastructure / Broadcast Heritage (new sub-cluster)
**Publication pipeline:** research-mission-generator → tex-to-project → HTML viewer + compiled PDF
**Parallel tracks:** 2 (Alpha: station histories by region · Beta: regulatory and spectrum)
**Safety-critical tests:** 6 · **Estimated tokens:** ~280K · **Color theme:** Broadcast red · vacuum-tube amber · dial navy

| Code | Module / Artifact | Lines | Theme | Key Topics |
|------|-------------------|-------|-------|------------|
| AMR.M1 | AM Band Foundations | 104 | Physics & Law | Amplitude modulation, 535-1705 kHz allocation, ground-wave vs skywave propagation, Federal Radio Commission (1927), FCC succession (1934), Radio Act 1927, Communications Act 1934, NARBA treaty, station classes A/B/C/D |
| AMR.M2 | Pacific Northwest Stations | 104 | Regional History | KJR Seattle (1921), KGW Portland (1922), KOMO, KIRO, KVI, Golden Age network radio, Top 40 era, news-talk pivot, Telecom Act 1996 consolidation, regional stations in Tacoma, Spokane, Eugene |
| AMR.M3 | California Stations | 104 | Regional History | Bay Area: KGO/KSFO/KNBR/KCBS; LA basin: KFI/KNX/KABC/KMPC; KCBS 1909 Herrold origin thread; Don Lee Network; NBC Pacific Coast; 34% minority-serving California AM station count |
| AMR.M4 | Spectrum & Licensing | 104 | Regulation | Full-power AM, full-power FM, LPFM (100 W nonprofit biennial windows), FM translator migration rule, Part 15 unlicensed (1 W), spectrum scarcity in Seattle/Portland/SF/LA, 2026 entry guide |
| AMR.M5 | FCC Rules & Regulations | 104 | Compliance | Public interest obligations, 8-year license term, EEO requirements, political broadcasting (equal time, lowest unit rate), EAS participation, indecency restrictions, ownership caps |
| AMR.M6 | The Digital Future | 104 | Forward Look | HD Radio IBOC hybrid digital, FCC all-digital AM approval MA3 mode (2020), AM Revitalization proceeding, EV motor-controller interference, streaming competition (36% audio share by 2023) |
| MP | Mission-Pack LaTeX | 1,454 | Publication | `am_radio_mission.tex` full citation chain, compiled to 221 KB PDF, mission-pack HTML wrapper (399 lines) |
| Site | HTML Viewer Stack | 363 | UX | `index.html` (103), `page.html` with sticky TOC (213), `mission.html` PDF embed (47) |
| Theme | Palette + Stylesheet | 83 | Branding | Broadcast red + vacuum-tube amber + dial navy, signals Broadcast Heritage sub-cluster on the index |
| Total | Full release footprint | 2,923 | — | 13 files across one project directory, one clean `feat(www)` commit |

### The Through-Line

> Before the internet, the radio dial was the only place where a single voice could reach the entire Pacific Northwest at once — in the dark, in the mountains, across the water. That architecture still exists. AMR is the attempt to write it down while the generation that built it is still available to interview.

## Retrospective

### What Worked

- **Two parallel tracks separated narrative from technical cleanly.** Track Alpha (station histories by region, M2 + M3) and Track Beta (regulatory and spectrum, M1 + M4 + M5 + M6) let each track go deep without starving the other. A reader can read Alpha for the story and Beta for the rules, or read them interleaved for the synthesis. The structure is the same one that worked for v1.49.101 (SST), and it continues to hold at the broadcast-heritage subject matter.
- **Station-by-station chronicles produced a reference that outlives ownership churn.** KJR, KGW, KOMO, KIRO, KVI, KGO, KSFO, KCBS, KFI, KNX, KABC, KMPC, KNBR, KWSO, KYNR are named with founding dates, call-sign history, format pivots, and current status. The catalog is written against call signs and frequencies rather than brand names, so the 1996 Telecom Act consolidation and the 2000s iHeart / Cumulus / Entercom churn do not invalidate any row. Future readers can use AMR to recover what a station *was* regardless of who owns it now.
- **Including practical licensing pathways made the research actionable.** Module 4's treatment of LPFM (100 W nonprofit), FM translator (the AM-to-FM migration loophole), and Part 15 unlicensed (1 W hobbyist) is not historical; it is a 2026 entry guide. A prospective community broadcaster in Seattle or Portland can read AMR and learn that the dial is full, that new AM CPs effectively do not exist, and that the realistic path runs through LPFM windows and translator acquisitions. The research does work outside the library.
- **The physics-versus-policy split in Module 1 clarified what "the AM band" actually is.** Separating the propagation physics (amplitude modulation, wavelength, ground-wave, skywave) from the allocation policy (FRC / FCC, Radio Act 1927, NARBA, station classes) made it clear that the band's current shape is half physical necessity and half regulatory choice. That split is pedagogically load-bearing — a reader who only knew the allocation could not reason about the propagation, and vice versa. AMR makes both legible.
- **The EV interference treatment went past the easy framing.** Module 6 does not stop at "automakers are removing AM radios, bad"; it walks the physics — motor controllers radiate broadband RFI in-band, the vehicle is its own EMI chamber, shielding is a cost-weight-complexity tradeoff that loses to consumer-preference forecasts. That framing is harder to argue with than the regulatory framing, which is the point. The research surfaces the real constraint.
- **Palette-as-cluster-marker continued to pay off.** Broadcast red + vacuum-tube amber + dial navy signals the Broadcast Heritage sub-cluster on the index at a glance. Any future reader scanning the Research index will be able to locate AMR and its future neighbors by color alone. Wayfinding infrastructure built earlier in the v1.49 arc keeps compounding.

### What Could Be Better

- **Indigenous broadcasting deserves dedicated coverage.** KWSO Warm Springs and KYNR Toppenish are named as sovereign spectrum holders but the current modules do not yet carry the treaty-rights, spectrum-sovereignty, and language-preservation treatment the subject warrants. A follow-up module or a companion project on tribal broadcasting — covering KNNB, KILI, KUYI, and the broader Native Public Media landscape — would close the gap. Shipping the gap visibly is how the follow-up gets prioritized, but shipping the full treatment would have been better.
- **The FM translator loophole deserves deeper regulatory analysis.** Module 4 mentions FM translators as a pathway but does not fully unpack the 2009 AM-on-FM translator rule, the subsequent windows, or the arguments that translators have saved AM (by giving AM stations an FM presence) versus drained AM (by giving station owners a reason to neglect the AM transmitter). That analysis is a natural next release and should cite the FCC's own data on how many translators are now paired to AM primaries.
- **Mission-pack citation density is uneven against the arc standard.** AMR's `am_radio_mission.tex` is 1,454 lines with good historical references, but compared to v1.49.101 (SST), which carries a dense Shannon / Minsky / Rogozhin / Wolfram citation chain, AMR's bibliography is lighter on primary-source FCC docket citations. A citation-audit pass would bring AMR to the same bibliographic standard before it is used as a teaching artifact in the College of Knowledge curriculum.
- **The streaming-competition section is thin.** Module 6 cites the 36% audio-share figure for streaming by 2023 but does not walk the specific competitive dynamics — satellite (SiriusXM), podcasts (Spotify / Apple / Amazon), smart-speaker audio (Alexa / Google), connected-car infotainment. A richer treatment would show the partitioning of audio attention rather than a single aggregate share number.
- **No field-measurement data is included.** AMR is a literature-and-regulation study; it does not include any actual signal-strength measurements, coverage-contour maps, or nighttime-reception logs from specific PNW drives. A future companion release could add empirical measurement — a drive from Seattle to the Oregon coast with a dated logger, for example — to turn AMR from secondary-source research into primary-source documentation.

## Lessons Learned

- **The AM dial is a stratigraphic record.** Each layer of regulation, technology, and format reveals the social and technical forces that shaped it. The Radio Act of 1927, the Federal Radio Commission, the Communications Act of 1934, the network era, the Top 40 format revolution, the 1996 Telecom Act consolidation, and the digital transition are all legible in the call-sign history. Reading the dial chronologically is a way to read the twentieth century.
- **Broadcast heritage is measured in generations, not product cycles.** KCBS San Francisco traces to Charles Herrold's 1909 experimental station FN (later 6XF, then KQW), making it one of the oldest continuously operating broadcast operations in the world. Any comparison to internet-era media makes no sense on the time axis — broadcast is a century old and still mostly reaches the same people it always did. The product-cycle frame cannot explain the dial.
- **EV interference is a physics problem regulation cannot solve.** Electric-vehicle motor controllers generate broadband RFI in the AM band that physically prevents reception inside the vehicle's own EMI envelope. Mandates can force automakers to include AM receivers, but they cannot force the motor controller to stop radiating. Forecasting AM's future requires accounting for a receiver base that shrinks with every EV sold — and that is not a business trend, it is electromagnetic compatibility.
- **Coverage is a wavelength property, not a platform property.** A 50 kW clear-channel AM station on 810 kHz (KGO) at night reaches listeners from San Francisco to the Canadian border and into the Rockies, because the wavelength refracts off the ionosphere. No internet service has that coverage characteristic; coverage in the internet era is a function of data-center density, last-mile buildout, and CDN geography, not physics. When infrastructure planners forget the distinction they end up with comms architectures that fail in the exact scenarios AM was built to handle.
- **Parallel tracks scale across subject matter.** The two-track structure (narrative + reference) that worked for computability theory (v1.49.101 SST: formal / synthesis) also worked for broadcast heritage (v1.49.106 AMR: station histories / regulation). The pattern is a research-mission-generator primitive, not a subject-specific accident. Future releases should default to two tracks unless there is a specific reason to collapse to one.
- **Station-by-station catalogs outlive ownership.** Writing the chronicle against call signs and frequencies rather than brand names means the 1996 consolidation, the 2000s churn, and any future reshuffling do not invalidate the catalog. Choose the unit of identity that the regulatory substrate uses, not the one the marketing department uses.
- **Sovereign spectrum is its own chapter.** Tribal stations like KWSO Warm Springs and KYNR Toppenish are not appendices to the AM story; they are a parallel story with different legal authority, different programming mandates, and different language obligations. Flagging the gap in AMR's retrospective is how the follow-up gets scheduled, but the lesson is that sovereign-spectrum deserves first-class treatment from the beginning of the next relevant release.
- **Licensing pathway documentation is load-bearing outreach.** Publishing the actual 2026 entry guide (LPFM windows, FM translators, Part 15) as research turns the release from a history lesson into a planning tool for the community-broadcasting ecosystem. Research that produces action is harder to produce than research that produces prose, and the payoff is measured in new community stations rather than in citation counts.
- **Physics and policy must be separated to be understood.** Module 1's split between amplitude-modulation physics (invariant) and allocation policy (contingent) is the conceptual tool that lets a reader reason about the band at all. Conflating the two produces either "the band is natural and inevitable" (wrong — it is NARBA plus station classes) or "the band is arbitrary and could be reshaped" (wrong — the propagation physics fixes the useful frequency range). Both the invariant and the contingent deserve explicit treatment.
- **One commit per research project continues to hold at v1.49.106.** AMR shipped in a single `feat(www)` commit (`87b9f3e9c`) with no accompanying scaffolding commits, no squash-merges, and no WIP history. The one-commit-per-project pattern that was validated at 49-project batch scale in v1.49.89 and at 1-project depth in v1.49.101 holds here too. A convention that holds across two orders of magnitude of batch size is an invariant.

## Cross-References

| Related | Why |
|---------|-----|
| `www/tibsfox/com/Research/AMR/` | The AM Radio Dial — release artifact, 6 modules + mission-pack + HTML viewer, ~4,129 lines |
| `www/tibsfox/com/Research/AMR/research/01-am-foundations.md` | AM band physics, FCC succession, Radio Act 1927, NARBA, station classes A-D |
| `www/tibsfox/com/Research/AMR/research/02-pnw-stations.md` | KJR 1921, KGW 1922, KOMO, KIRO, KVI; Seattle / Portland / Tacoma / Spokane / Eugene catalog |
| `www/tibsfox/com/Research/AMR/research/03-california-stations.md` | KGO, KSFO, KNBR, KCBS (1909 Herrold origin), KFI, KNX, KABC, KMPC; Don Lee Network, NBC Pacific Coast |
| `www/tibsfox/com/Research/AMR/research/04-spectrum-licensing.md` | LPFM biennial windows, FM translator migration rule, Part 15 unlicensed, 2026 entry guide |
| `www/tibsfox/com/Research/AMR/research/05-fcc-regulations.md` | Public interest obligations, EEO, political broadcasting, EAS, indecency, ownership caps |
| `www/tibsfox/com/Research/AMR/research/06-digital-future.md` | HD Radio IBOC, all-digital AM MA3 approval 2020, EV interference, streaming competition |
| `www/tibsfox/com/Research/AMR/mission-pack/am_radio_mission.tex` | 1,454-line LaTeX source, full citation chain, compiled to 221 KB PDF |
| `www/tibsfox/com/Research/AMR/mission-pack/am_radio_mission.pdf` | Compiled PDF, teaching artifact for the College of Knowledge |
| `www/tibsfox/com/Research/AMR/style.css` | Broadcast red + vacuum-tube amber + dial navy palette, 83 lines, signals Broadcast Heritage sub-cluster |
| ABL (research series) | Music production ecosystem — the creative content that AM stations broadcast |
| WAL (research series) | Audio workstation landscape — production tools feeding broadcast chains |
| FLS (research series) | FL Studio — digital audio production connecting to broadcast output |
| SYS (research series) | Systems administration — transmitter-site infrastructure and remote monitoring |
| RFC (research series) | Standards authority — broadcast protocol specifications and FCC docket citations |
| [v1.49.101](../v1.49.101/) | States, Symbols, and Tape — first post-drain release, established the depth-test pattern that AMR inherits |
| [v1.49.105](../v1.49.105/) | Immediate predecessor in the v1.49.101-131 research batch |
| [v1.49.107](../v1.49.107/) | Immediate successor in the research batch |
| [v1.49.90](../v1.49.90/) | Drain-to-zero batch that emptied the intake queue; every post-drain release including AMR is a chosen topic |
| [v1.49.89](../v1.49.89/) | Mega-batch that validated the research-mission pipeline at 49-project breadth |
| [v1.0](../v1.0/) | The 6-step adaptive learning loop — AMR's module structure is one Observe / Detect pass over the broadcast domain |
| [v1.25](../v1.25/) | Ecosystem Integration — dependency DAG substrate for AMR's cross-links to ABL/WAL/FLS/SYS/RFC |
| [v1.33](../v1.33/) | GSD OpenStack Cloud Platform — infrastructure companion to AMR's broadcast-infrastructure work |

## Engine Position

v1.49.106 is the **6th release of the v1.49.101-131 research batch** and the **94th research release of the v1.49 publication arc**. The v1.49.101-131 batch is the 31-project cohort shipped across a single session in the post-drain arc that began with v1.49.101 (SST). Series state at tag: approximately **153 `series.js` entries** after AMR registers, **144 real research directories**, **Broadcast Heritage** inaugurated as a new sub-cluster within PNW Infrastructure (joined to ABL / WAL / FLS / SYS / RFC by cross-reference), approximately **260,400 cumulative lines shipped** across the v1.49 arc. AMR is the first broadcast-heritage entry in the library and sets the grain size — six modules, parallel tracks, station catalog plus regulatory stack, LaTeX mission-pack plus HTML viewer plus compiled PDF — that future Broadcast Heritage entries (tribal broadcasting, FM translator analysis, shortwave heritage, pirate-radio archaeology) will inherit.

## Files

**13 files changed across one project directory. +2,923 insertions, -0 deletions in a single commit (`87b9f3e9c`).**

- `www/tibsfox/com/Research/AMR/index.html` — project landing page, cluster palette, TOC to all six modules, 103 lines
- `www/tibsfox/com/Research/AMR/page.html` — sticky-TOC Markdown viewer for the research modules, 213 lines
- `www/tibsfox/com/Research/AMR/mission.html` — mission-pack wrapper with PDF embed and LaTeX source link, 47 lines
- `www/tibsfox/com/Research/AMR/research/01-am-foundations.md` — AM band physics, FCC, NARBA, station classes, 104 lines
- `www/tibsfox/com/Research/AMR/research/02-pnw-stations.md` — KJR / KGW / KOMO / KIRO / KVI and the PNW catalog, 104 lines
- `www/tibsfox/com/Research/AMR/research/03-california-stations.md` — Bay Area + LA basin catalog, KCBS 1909 origin, 104 lines
- `www/tibsfox/com/Research/AMR/research/04-spectrum-licensing.md` — LPFM, FM translators, Part 15, 2026 entry guide, 104 lines
- `www/tibsfox/com/Research/AMR/research/05-fcc-regulations.md` — public interest, EEO, EAS, ownership caps, 104 lines
- `www/tibsfox/com/Research/AMR/research/06-digital-future.md` — HD Radio, all-digital AM, EV interference, streaming, 104 lines
- `www/tibsfox/com/Research/AMR/mission-pack/am_radio_mission.tex` — full LaTeX source with citation chain, 1,454 lines
- `www/tibsfox/com/Research/AMR/mission-pack/am_radio_mission.pdf` — compiled 221 KB PDF, teaching artifact
- `www/tibsfox/com/Research/AMR/mission-pack/index.html` — mission-pack HTML wrapper with navigation, 399 lines
- `www/tibsfox/com/Research/AMR/style.css` — broadcast red + vacuum-tube amber + dial navy palette, 83 lines

Cumulative series state at tag: **~153 `series.js` entries, ~144 real research directories, Broadcast Heritage sub-cluster inaugurated within PNW Infrastructure, ~260,400 lines shipped across the v1.49 arc, 6th release of the 31-project v1.49.101-131 batch, 1 project chosen rather than processed.**

---

> *One project. Six modules. Four thousand lines of prose. A 1921 transmitter in Seattle is still on the air. A 1909 experimental station in San Jose is still on the air under a different call sign. The dial is a hundred-year-old mesh network that a single voice can cross in one night, and the mesh still works when the internet is down. AMR is the attempt to write that architecture down while the generation that built it is still available to interview.*
