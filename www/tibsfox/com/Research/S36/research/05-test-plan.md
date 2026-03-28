# Seattle 360 — Test Plan

**Total Tests:** 148 | **Safety-Critical (BLOCK):** 22 | **Target Coverage:** 90%+
**Test density target:** 2–4 tests per success criterion (12 criteria × 3 avg = 36 core)
**Note:** Safety-critical tests must ALL pass before any release. Failure = BLOCK + CAPCOM.

---

## Test Categories

| Category | Count | Priority | Failure Action |
|----------|-------|----------|----------------|
| Safety-critical (attribution + cultural) | 22 | Mandatory | BLOCK release |
| Core functionality (per-component) | 64 | Required | BLOCK release |
| Integration (cross-component) | 32 | Required | BLOCK release |
| Edge cases (unusual artists/genres) | 18 | Best-effort | LOG + continue |
| Performance (token/time budget) | 12 | Best-effort | WARN + log |

---

## Safety-Critical Tests (Mandatory Pass — BLOCK on Failure)

| Test ID | Verifies | Expected Behavior | Component |
|---------|----------|-------------------|-----------|
| SC-01 | All biographical claims have professional citation | Zero uncited claims in PDF Stage 2 | 03-fleet-research-gen |
| SC-02 | Indigenous attribution uses nation-specific language | No instances of "Native American" as monolith; Duwamish/Muckleshoot/Suquamish named where relevant | 08-safety-warden |
| SC-03 | Black American musical attribution is explicit | Central District jazz credited to Black American authorship, not "roots" | 08-safety-warden |
| SC-04 | Living artist privacy respected | No unverified claims about living artists; public record only | 08-safety-warden |
| SC-05 | Deceased artist past-tense protocol | All deceased artists (Gary Peacock, Ernestine Anderson, etc.) use past tense consistently | 03-fleet-research-gen |
| SC-06 | Mia Zapata (The Gits) dignity protocol | Her murder (1993) mentioned with factual accuracy and dignity; no sensationalism | 08-safety-warden |
| SC-07 | Minor-era work treated age-appropriately | Any documented minor-years content uses appropriate framing | 08-safety-warden |
| SC-08 | No speculative Indigenous heritage claims | Indigenous heritage only stated when documented; otherwise omitted | 08-safety-warden |
| SC-09 | LaTeX compiles without errors | XeLaTeX three-pass produces PDF without errors for every artist | 03-fleet-research-gen |
| SC-10 | Safety Warden BLOCK prevents publication | If BLOCK signal emitted, release artifacts are NOT written to publish path | 05-release-pipeline |
| SC-11 | Atomic release writes (no partial artifacts) | Interrupted write leaves no partial files; rollback confirmed | 05-release-pipeline |
| SC-12 | CAPCOM escalation on BLOCK | BLOCK findings write `BLOCKED-[slug].md` and halt pipeline | 08-safety-warden |
| SC-13 | KnowledgeState atomic write | `knowledge-state.json` is never left in partial state | 07-carry-forward |
| SC-14 | Unverified carry items excluded from state | Only CONFIRMED carry items written to KnowledgeState | 07-carry-forward |
| SC-15 | No duplicate College node creation | `college-node-index.json` checked before CREATE; enrichment preferred | 04-college-linker |
| SC-16 | Riot grrrl feminist context explicit | Bikini Kill, Sleater-Kinney, Seven Year Bitch carry feminist/political framing | 08-safety-warden |
| SC-17 | Theory claims have audible evidence | Every TheoryNode includes track/structural reference; no abstract assertions only | 02-theory-mapper |
| SC-18 | Grunge artist Sub Pop attribution accurate | Sub Pop label relationship correctly stated per discographic record | 03-fleet-research-gen |
| SC-19 | Progress ledger updated before next loop | `progress.json` shows N=COMPLETE before Wave 0[N+1] starts | 05-release-pipeline |
| SC-20 | Engine resumability tested | Simulated interrupt at artist 50; resume picks up at 50 without data loss | 05-release-pipeline |
| SC-21 | Opus used for Safety Warden (not Sonnet/Haiku) | Model assignment verified in execution log | 08-safety-warden |
| SC-22 | OCAP® compliance for any Indigenous knowledge content | If OCAP® applies, four-level classification present; sacred content excluded | 08-safety-warden |

---

## Core Functionality Tests

### Component 01: CSV Intake Engine

| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-01-01 | All 360 rows parsed | Full CSV | ArtistProfile[360] array, no missing entries |
| CF-01-02 | Degree field as integer 0–359 | CSV rows | degree=0 → Quincy Jones; degree=359 → Unwound |
| CF-01-03 | Energy field as integer 1–10 | CSV rows | No energy value outside 1–10 range |
| CF-01-04 | Lat/lon parsed as floats | CSV rows | 47.608,-122.2976 (Central District) correct |
| CF-01-05 | Multi-word names preserved | "Death Cab for Cutie" | Name field = "Death Cab for Cutie" |
| CF-01-06 | Artist slug generated correctly | "Quincy Jones" → "quincy-jones" | slug = lowercase, spaces → hyphens, parens removed |

### Component 02: Music Theory Mapper

| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-02-01 | Jazz genre → harmony theory nodes | degree=0 (Quincy Jones, Jazz) | TheoryNodeList includes ii-V-I, chord extensions |
| CF-02-02 | Energy 1–3 → foundational curriculum | energy=1 (Gary Peacock) | CurriculumDepth = foundational |
| CF-02-03 | Energy 7–10 → advanced curriculum | energy=9 (Nirvana) | CurriculumDepth = advanced |
| CF-02-04 | Grunge genre → drop-D, power chord nodes | degree=311 (Nirvana, Grunge) | TheoryNodeList includes drop-D tuning, power chord |
| CF-02-05 | Blues genre → 12-bar form, blues scale | degree=35 (Robert Cray, Blues) | TheoryNodeList includes 12-bar blues, blues scale |
| CF-02-06 | Cross-era genealogy links populated | Any repeat concept | GenealgyLinks references prior artist |
| CF-02-07 | Minimum 3 theory nodes per artist | All artists | TheoryNodeList.length >= 3 |
| CF-02-08 | Lydian mode for Hendrix specifically | degree=36 (Jimi Hendrix) | TheoryNodeList includes Lydian mode node |
| CF-02-09 | Mathcore / odd time signatures for Botch | degree=289 or 332 (Botch) | TheoryNodeList includes metric modulation, odd meters |
| CF-02-10 | Riot grrrl deconstruction node for Bikini Kill | degree=276 (Bikini Kill) | TheoryNodeList includes "riot grrrl deconstruction" |

### Component 03: Fleet Research Generator

| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-03-01 | PDF contains all 3 stages | Any artist | Stage 1 + Stage 2 + Stage 3 sections in PDF |
| CF-03-02 | Stage 2 has biography with citations | Any artist | Minimum 3 professional source citations |
| CF-03-03 | Stage 2 has theory section | Any artist | Theory concepts from TheoryNodeList present |
| CF-03-04 | Stage 3 has College integration plan | Any artist | CollegeLinkList entries in Stage 3 |
| CF-03-05 | Color scheme is music-domain appropriate | Any artist | Primary = navy/jazz blue, secondary = cranberry/Sub Pop |
| CF-03-06 | Title page has correct artist name and degree | degree=53 (Fleet Foxes) | Title contains "Fleet Foxes" and "Degree 53" |
| CF-03-07 | .tex source compiles reproducibly | Any artist | Second compilation of .tex = same PDF binary (near) |
| CF-03-08 | index.html contains download links | Any artist | `<a href="research-mission.pdf" download>` present |
| CF-03-09 | knowledge-nodes.json matches CollegeLinkList | Any artist | JSON entries = CollegeLinkList from component 04 |
| CF-03-10 | Carry-forward section present in Stage 3 | Any artist | "Carry-Forward" section in Stage 3 Mission Package |

### Component 04: College Knowledge Linker

| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-04-01 | Minimum 3 College links per artist | Any artist | CollegeLinkList.length >= 3 |
| CF-04-02 | Mathematics bridge for harmonic theory | Any jazz/folk artist | `.college/mathematics/` link present |
| CF-04-03 | No duplicate node creation | Artist 50 (same genre as artist 5) | ENRICH not CREATE for already-existing nodes |
| CF-04-04 | CREATE vs ENRICH correctly distinguished | First blues artist | CREATE `12-bar-blues.md`; subsequent blues → ENRICH |
| CF-04-05 | Unit circle connection for harmonic artists | Any artist with modal theory | Link to `.college/mathematics/trigonometry/unit-circle/` |
| CF-04-06 | Mind-body link for performance-heavy artists | energy >= 7 | `.college/mind-body/performance/` link present |

### Component 05: Release Pipeline

| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-05-01 | Output path naming convention | degree=0 (Quincy Jones) | Path = `releases/seattle-360/000-quincy-jones/` |
| CF-05-02 | progress.json updated after completion | Any artist | `{degree: N, status: "COMPLETE", timestamp: ...}` |
| CF-05-03 | write-protect applied to published artifacts | After 3b.1 | Files are read-only; write attempt fails |
| CF-05-04 | release-ledger.md append is non-destructive | Multiple runs | Ledger grows; prior entries unchanged |
| CF-05-05 | Roll-back on partial write | Simulated interrupt during 3b.1 | No partial artifacts in publish path |

### Component 06: Retrospective Engine

| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-06-01 | retrospective.md follows NASA SE format | Any release | situation/root-cause/recommendation/carry-item structure |
| CF-06-02 | Minimum 1 IMMEDIATE carry item | Any release | carry_items contains ≥1 IMMEDIATE-tagged item |
| CF-06-03 | Surprise register populated | Any release | surprises[] field present; may be empty for unsurprising releases |
| CF-06-04 | Promotion candidate triggered at 5+ occurrences | After 5 artists use same concept | retrospective notes "PROMOTION CANDIDATE" |
| CF-06-05 | Tier classification (IMMEDIATE/PATTERN/ARCH) | Any carry item | Every carry item has one of the three tier tags |

### Component 07: Carry-Forward Controller

| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-07-01 | theory-genealogy grows by exactly 1 entry per artist | degree=5, then degree=6 | genealogy.length increments by 1 |
| CF-07-02 | Active context summary stays ≤2K tokens | After artist 100 | active_context token count ≤ 2048 |
| CF-07-03 | INFERRED carry items excluded from state | Carry item tagged INFERRED | Not written to knowledge-state.json |
| CF-07-04 | Loop terminates at degree 359 | degree=359 | CYCLE-COMPLETE signal; no Wave 0[360] attempted |

### Component 08: Safety Warden

| Test ID | Verifies | Input | Expected Output |
|---------|----------|-------|-----------------|
| CF-08-01 | PASS signal for clean release | Well-sourced, correctly attributed release | `{signal: "PASS", findings: []}` |
| CF-08-02 | BLOCK signal on missing citation | Release with uncited biographical claim | `{signal: "BLOCK", finding: "SC-01: uncited claim"}` |
| CF-08-03 | GATE signal on uncertain living status | Artist with ambiguous living/deceased status | `{signal: "GATE", finding: "verify living/deceased status"}` |
| CF-08-04 | ANNOTATE for complex cultural context | Central District artist needing careful framing | `{signal: "PASS", annotations: ["review CD framing"]}` |
| CF-08-05 | Warden runs on Opus (model log check) | Any release | execution log shows model=claude-opus-* for warden task |
| CF-08-06 | All 4 audit types run per release | Any release | audit_log contains attribution + cultural + protocol + accuracy entries |

---

## Integration Tests

| Test ID | Interface Between | Scenario | Expected Behavior |
|---------|------------------|----------|-------------------|
| IT-01 | 01→02 (CSV → Theory Mapper) | ArtistProfile for degree=0 | TheoryNodeList contains jazz-specific concepts, not grunge |
| IT-02 | 01→04 (CSV → College Linker) | ArtistProfile for degree=30 (Ray Charles) | Central District → `.college/music/history/seattle/` link |
| IT-03 | 02+04→03 (Both Wave 1 outputs → Research Gen) | TheoryNodeList + CollegeLinkList for degree=53 (Fleet Foxes) | Research PDF contains both counterpoint theory and college links |
| IT-04 | 03→08 (PDF → Safety Warden) | Release with potential attribution issue | Warden reads full PDF; identifies specific page/claim |
| IT-05 | 08→05 (BLOCK → Release Pipeline) | Safety Warden emits BLOCK | Release Pipeline does NOT write artifacts; writes BLOCKED file |
| IT-06 | 05→06 (Release → Retrospective) | Completed release record | Retrospective reads all 5 artifacts; generates carry items |
| IT-07 | 06→07 (Retro → Carry Forward) | RetrospectiveRecord with 2 IMMEDIATE items | Both items appear in KnowledgeState[N+1]; INFERRED excluded |
| IT-08 | 07→0[N+1] (State → Next Wave 0) | KnowledgeState for artist N | Wave 0[N+1] reads updated state; theory genealogy incremented |
| IT-09 | Genealogy accumulation (artists 0→5) | 6 sequential releases | After degree=5, genealogy contains 6 entries; no duplicates |
| IT-10 | College index duplication prevention | Two folk artists (degrees 52, 53) | Both enrich `diatonic-harmony.md`; neither creates duplicate |
| IT-11 | Resumability after simulated interrupt | Interrupt after degree=50 write | Resume at 51; degree=50 artifacts intact; no re-processing |
| IT-12 | Progress ledger integrity across 10 releases | degrees 0–9 | Ledger has 10 entries; all COMPLETE; timestamps sequential |
| IT-13 | Token budget within 20% estimate | Any 10 consecutive artists | Per-artist tokens 49K–74K (±20% of 61.5K estimate) |
| IT-14 | Olympia geo-cluster consistency | degrees 49, 50, 276, 277 (Olympia artists) | All carry `.college/music/history/olympia-krecords/` link |
| IT-15 | Grunge lineage cross-reference | degree=310 (Mudhoney, references Green River) | Theory genealogy links Mudhoney ← Green River (degree=294) |
| IT-16 | Energy-level curriculum depth consistency | energy=10 artists (degrees 344, 348, 352, etc.) | All have CurriculumDepth = advanced; no foundational nodes |

---

## Edge Case Tests

| Test ID | Scenario | Expected Behavior |
|---------|----------|-------------------|
| EC-01 | Artist appearing at multiple degrees (Death Cab for Cutie at 58 and 82) | Distinct releases with different context angles; cross-reference each other |
| EC-02 | Artist with "(context)" qualifier in name (Jimi Hendrix blues context, degree=36) | Name cleaned for slug; context preserved in release |
| EC-03 | Artist with no label listed (several "local" entries) | label field = "local" or "independent"; not null error |
| EC-04 | Geo coordinates pointing to non-Seattle location (Olympia, Aberdeen) | Neighborhood/region noted; music history context preserved |
| EC-05 | Very early era artist (1940s-present for Don Lanphere, degree=12) | Era range handled; past-tense for early career, appropriate for legacy |
| EC-06 | Artist at energy=1 (Gary Peacock, degree=8) | Minimal, reflective tone; foundational curriculum; no intensity mismatch |
| EC-07 | Artist at energy=10 (multiple, degrees 344–359) | Maximum curriculum depth; advanced theory; appropriate intensity |
| EC-08 | Non-Seattle origin artist with Seattle connection (Sam Beam, degree=68) | Connection nature accurately described; not claimed as Seattle native |
| EC-09 | KnowledgeState at degree=359 (maximum accumulation) | Active summary still ≤2K; compression working; theory genealogy complete |
| EC-10 | Compilation failure mid-run (XeLaTeX error) | Error logged; BLOCK signal emitted; retry attempted; CAPCOM if 2nd fail |
| EC-11 | CAPCOM human intervention required | BLOCK finding → pipeline halts and remains halted until CAPCOM resolves |
| EC-12 | Artist "Dead Kennedys (Seattle shows/influence)" (degree=286) | Non-Seattle origin noted; treated as influence, not Seattle artist |

---

## Verification Matrix

*Maps each success criterion from the vision doc to the tests that verify it.*

| Success Criterion | Test IDs | Status |
|-------------------|----------|--------|
| 1. All 360 produce complete artifact set | CF-01-01, CF-05-01, CF-05-02, IT-12 | Pending |
| 2. PDF has biography + ≥3 theory + ≥3 college links + carry-forward | CF-03-01, CF-03-02, CF-03-03, CF-03-04, CF-03-10 | Pending |
| 3. Safety Warden passes every release | SC-01–SC-22, CF-08-01–CF-08-06 | Pending |
| 4. KnowledgeState atomic + engine resumable | SC-13, CF-07-01, IT-11, EC-09 | Pending |
| 5. Theory concepts have audible evidence | SC-17, CF-02-01, CF-02-08 | Pending |
| 6. Central District attribution explicit | SC-03, IT-02, CF-08-04 | Pending |
| 7. Indigenous language nation-specific | SC-02, SC-08, SC-22 | Pending |
| 8. No duplicate College node creation | SC-15, CF-04-03, CF-04-04, IT-10 | Pending |
| 9. Theory genealogy complete at degree=359 | CF-07-01, IT-09, IT-15, EC-09 | Pending |
| 10. Carry-forward demonstrably enriches later missions | CF-07-01, IT-07, IT-08, IT-09 | Pending |
| 11. Retrospective has ≥1 IMMEDIATE carry item | CF-06-02, IT-06, IT-07 | Pending |
| 12. Token budget within ±20% | IT-13, CF-07-02 | Pending |
