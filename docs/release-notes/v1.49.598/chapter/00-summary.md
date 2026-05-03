# v1.49.598 — Structural Firsts + Engine State

## Structural firsts at v1.49.598 close

1. **First wheeled vehicle on the Moon — Modular Equipment Transporter (MET) on Apollo 14 EVA-2.** Two-wheeled hand-pulled cart designed by Boeing for Apollo 14; aluminum-tube frame, two pneumatic tires (~40 cm diameter, 4 psi nominal); ~3.4 km cumulative traverse during EVA-2; ~75 kg loaded mass with sample-return containers + geological hammers + Apollo Lunar Surface Drill + close-up stereoscopic camera + Lunar Portable Magnetometer. **Distinct primitive from Lunokhod 1** (Soviet unmanned remote-controlled rover, November 1970) per three canonical-criteria checks. **§6.6 GEOM (GEOLOGICAL-MOBILITY) 1-ex origination admitted at G2 lock.**

2. **First Apollo Guidance Computer in-flight software patch — Don Eyles' abort-bit-mask DSKY uplink.** Authored at MIT Instrumentation Lab in ~2 hours under operational pressure; addressed spurious abort-discrete signal from a faulty switch in the LM cabin (small piece of solder shorting); patch masked the abort discrete bit during powered descent; uplinked to LM-8 Antares via voice channel; entered by Mitchell via approximately 60 DSKY (Display & Keyboard) keystrokes encoding AGEN memory addresses to be modified. Canonical PROCEDURAL-RECOVERY exemplar at §6.6 register; **3rd reproducibly-stable instance promoting PREC to ESTABLISHED**.

3. **First successful sample-return from the lunar highlands.** Apollo 11 (Mare Tranquillitatis) and Apollo 12 (Oceanus Procellarum) sampled basaltic mare. Apollo 14 was first to sample anorthositic highland material (~4.0–4.5 Gyr old; predates mare basalts by ~500 Myr). Total sample mass returned: 42.80 kg (94.35 lb). Most scientifically significant: sample 14321 ("Big Bertha"; 8.998 kg) with potential ~4.0 Gyr terrestrial-zircon clast per Bellucci et al. 2019 actively-debated hypothesis.

4. **First terrestrial seeds returned from lunar orbit + first long-arc PERSISTENT-PROGRAM-CYCLE.** Roosa's PPK ~500 seeds (loblolly pine, sycamore, sweetgum, redwood, Douglas fir) provided by USFS through Roosa's prior smokejumper connection; orbited the Moon 34 times in CSM Kitty Hawk; 84% post-flight germination; 1975-76 Bicentennial planting → 80 surviving originals catalogued NASA Goddard NSSDC 2026 → 2022 Artemis I second-generation seed flight → 2023+ NFF distribution. **§6.6 PERSISTENT-PROGRAM-CYCLE (PPC) 1-ex origination admitted at G2 lock.** 55-year continuous program lineage demonstrated.

5. **First documented late-1970 / early-1971 lunar-surface mobility moment with two parallel mobility lineages.** Lunokhod 1 (1970-11-17, unmanned remote-controlled, Mare Imbrium) + MET (1971-02-06, crewed-pulled, Fra Mauro highlands) emerged from the same 10-week window. Two lineages: MET → Apollo 15+ LRV → Mars rover crewed-design heritage; Lunokhod 1 → Lunokhod 2 → Mars Sojourner → Spirit/Opportunity/Curiosity/Perseverance unmanned-remote-controlled. The 10-week separation is structurally important.

6. **First substrate-coherence three-track cross-pair anchored on a single shared physical artifact.** Roosa's PPK Douglas fir + redwood seeds (NASA 1.78) → Moon Trees Douglas fir + redwood survivors (ELC 1.78) → Marbled Murrelet canopy nesting in Douglas fir + redwood (SPS #75). Three substrates locked onto the same physical conifer species. **Forward-lesson #10236 emitted: cross-track structural pairs are discovered, not constructed — the frame recognizes itself in the substrate, after the fact.**

7. **First INSIDE-window MUS pick soak observation #2 with substantive structural-primitive coherence.** *Tapestry* (1971-02-10, Ode 77009) released INSIDE Apollo 14 mission window (Jan 31 – Feb 9), one day after splashdown. Both *Tapestry* + Apollo 14 instantiate the same structural primitive (second-attempt-after-modest-precedent canonical re-establishment) within the same 10-day window. **#10232 INSIDE-window soak observation #2: PASS.** v1.49.596 *McCartney* observation #1 + v1.49.598 *Tapestry* observation #2 = two consecutive INSIDE-window picks with substantive structural-pair coherence.

8. **First Tier 2 inline-Opus build as primary build path** (not as Sonnet-dispatch fallback). v589 + v595 used Tier 2 as fallback after Sonnet sub-agent dispatch interrupted; v598 used Tier 2 because Sonnet sub-agent dispatch was unavailable in flight-ops' tool surface. **Forward-lesson #10233 emitted: Tier 2 inline-Opus as primary build path soak observation #1.** v599-v601 may sustain or revert.

9. **First TRS M1 Foundation Wave 0–1 deliverables.** M1 substrate begun at v598 after M0 closed at v1.49.596. Three Wave 0–1 schema documents authored at `.planning/missions/v1-49-598-apollo-14-fra-mauro/work/research/trs-m1-foundation/`: m1-page-template.md (per-paper page schema) + m1-pairing-map-skeleton.md (cross-reference graph schema with 8 edge types + 12-edge seed dataset) + m1-schemas.md (3 JSON Schemas: paper-page-frontmatter + pairing-map + coverage-report-v2).

10. **First v598 W3 verification new gates.** Playwright smoke for intelligence.html (#10222 closes v597 manual-smoke gap) + dashboard-generator non-empty test (#10223 closes v597 manual-smoke gap; surfaced spec-vs-implementation drift on first authoring per "phase-card" → "timeline-item" reconciliation) + investigated-then-fixed root-project testTimeout bump (15000 → 20000 for execFileSync subprocess setup-cost integration tests).

## Engine state at v1.49.598 close

| Surface | Value | Change from v1.49.597 |
|---|---|---|
| NASA degree | **1.78** (Apollo 14 Fra Mauro Highlands) | +0.01 (advance from 1.77) |
| MUS degree | **1.78** (*Tapestry* / Carole King) | +0.01 (advance from 1.77) |
| ELC degree | **1.78** (Moon Trees lineage 1971-2026) | +0.01 (advance from 1.77) |
| SPS series | **#75** (Marbled Murrelet) | +1 (advance from #74) |
| §6.6 register | **23 exemplars** | +2 (GEOM admit + PPC admit; PREC promote no-count-change) |
| TRS substrate | **M1 Foundation Wave 0–1 begun** | +1 wave (M1 begun; M0 closed at v596) |
| Three-track cadence | **11th instance ESTABLISHED** | +1 instance (v597 was counter-cadence) |
| Build path | Tier 2 inline-Opus (v598 primary; soak #1) | NEW (Tier-2-as-primary-build first observation) |
| Lesson #10221 (dev/main sync) | ESTABLISHED at v596; held cleanly at v598 | (canonical) |
| Lesson #10231 (iconic-mission depth-recovery soak) | observation #2 LOCKED at v598 (NASA PASS 99% lines / 115% bytes) | +1 observation |
| Lesson #10232 (INSIDE-window MUS pick soak) | observation #2 LOCKED at v598 (Tapestry INSIDE Apollo 14 window) | +1 observation |
| Pre-tag-gate | 7-step composite still active | unchanged |
| vitest test count | ~29,500 (v597 baseline) → ~29,512 (v598; +12 new tests across 4 dashboard + 8 c12 reverified) | +12 new tests minimum |

## Cross-track Tapestry/Moon-Trees/Marbled-Murrelet weave (six anchor points)

The substrate-coherence three-track pair lands explicitly across six places in the v598 build:

1. NASA 1.78 index.html — Three Parallel Threads card + Resonance Axes table + Cross-Track Pair card
2. NASA 1.78 research.html — Big Bertha + Moon Trees subsection + closing cross-track sentence
3. NASA 1.78 organism.html — Cross-track structural pair card (MAMU + NSO + Moon Trees)
4. NASA 1.78 mathematics.html — Thread 5 LRRR continuity bridges Apollo 14's lunar-laser-ranging to broader 1969→2026 multi-mission scientific-instrument continuity
5. NASA 1.78 curriculum.html — Module 4 Silviculture/Forest Ecology + capstone cross-track integration session
6. NASA 1.78 artifacts/story/cone-crater-thirty-meters-short.html — full braided narrative; substantive Tapestry braid weight

Plus MUS 1.78 index.html Cross-Track Pair card + ELC 1.78 index.html Cross-Track Pair card + SPS #75 pass2-refinement.md Section 4 ("Cross-Track Substrate: NASA + ELC + SPS Canopy Pair").
