# 04 — Lessons Learned: v1.49.587 Forward Lessons

## 4 forward lessons emitted (#10179–#10182)

These lessons are added to the cumulative lessons-learned database for application by future milestones.

### #10179 — SCIENCE-MAXIMIZED FINAL-OF-SERIES as a structural primitive distinct from CWO/SAF/PCL/FAMC

**Source:** v1.49.587 W1a research dossier + G0 user adjudication; ratified at single-exemplar via the Surveyor 7 + Lady Soul + Northern Spotted Owl (Forsman 1984) triad.

**Observation:** Without explicit declaration, the SCIENCE-MAXIMIZED FINAL-OF-SERIES primitive (engineering-qualified series produces terminal mission whose payload is dominated by science output) could be conflated with CATALOG-WINDOW-OPENING (single-platform single-output that opens a band and produces sustained reference dataset; v1.67 OAO-2) or simple last-of-series numbering. SMFS is more specific: it requires (a) explicit qualification arc through prior series instances, (b) maximally demanding scientific/artistic target — i.e., the target the series qualified the platform to attempt — and (c) terminal output exceeds predecessors per kg-of-payload / per-track / per-page-of-monograph. All three criteria must hold; presence of any one alone is insufficient.

**Application:** v1.49.587 NASA 1.68 + MUS 1.68 + ELC 1.68 + SPS #65 cards 5 + 9 + 12 + the differentiation_note in each subject-spec.json explicitly declare SMFS's 3-criterion rubric. The triad's structural commonality (SMFS at three substrates: Surveyor 7 mission catalog + Lady Soul album-portfolio peak + Forsman 1984 conservation-monograph) is made explicit at the cross-track-card level. CATALOG-WINDOW-OPENING carry-forward at single-exemplar (NOT advanced) — Surveyor 7 is qualification-spend, not band-opening.

**Forward application:** all forthcoming forward-cadence degrees with terminal-mission-of-engineering-qualified-series pattern can advance SCIENCE-MAXIMIZED FINAL-OF-SERIES toward 2-exemplar / 3-exemplar threshold. Watchlist 2nd-exemplar candidates: Apollo 17 (final Apollo, science-maximized lunar surface), Mariner 9 (final Mariner-class, Mars orbiter), Cassini end-of-mission Saturn dives, Voyager 2 extended Uranus+Neptune phase (post-Voyager 1 SMFS-extension variant). Archive threshold ~v1.88.

### #10180 — ALPHA-SCATTERING thread closure criterion (architecture stability + terrain diversity + data discrimination capability)

**Source:** v1.49.587 W1a research dossier + ALPHA-SCATTERING thread closure decision at single milestone (Surveyor 5 v1.62 → Surveyor 6 v1.63 → Surveyor 7 v1.68 = 3-exemplar).

**Observation:** Closure of an instrument-lineage §6.6 thread requires more than reaching 3-exemplar count. The closure criterion is a tripartite test: (a) architecture stability — same instrument architecture deployed across all exemplars (Surveyor alpha-scattering CSP signal chain unchanged across S5/S6/S7); (b) terrain diversity — exemplars deployed in compositionally-distinct or otherwise-distinguished targets (Mare Tranquillitatis basalt + Sinus Medii basalt + Tycho highland anorthosite); (c) data discrimination capability — exemplar returns must produce demonstrably distinct results that validate the instrument's discrimination capability (highland Al+Ca-rich vs maria Fe+Mg-rich elemental signatures). Without all three, a thread reaching 3-exemplar count via repetition (same architecture in same conditions returning same data) is "exhausted" not "closed" — it does not advance the science.

**Application:** v1.49.587 NASA 1.68 + ELC 1.68 cards explicitly declare the closure-criterion satisfaction at v1.68: architecture stability (discrete-BJT CSP + 0.5 pF C_F + 100 MΩ R_F + CR-RC + 256-PHA unchanged across S5/S6/S7); terrain diversity (3 compositionally-distinct lunar terrains); data discrimination capability (the Tycho anorthositic Al+Ca-rich, Fe+Mg-depleted signature is qualitatively distinct from prior maria-basaltic returns and confirms the CSP signal chain's discrimination capability across compositionally-orthogonal targets). The thread closes; future alpha-scattering deployments (Mars Pathfinder APXS 1997, MER 2003) reference the closed lineage as inheritor architecture, not as continuation.

**Forward application:** all forthcoming §6.6 thread closure decisions must satisfy the 3-criterion test. Threads at 3-exemplar count with insufficient terrain-diversity or data-discrimination should remain "extending" rather than "closed". The 3-exemplar count alone is necessary-but-insufficient.

### #10181 — NASA CSV reconciliation pattern (Path Y backfill)

**Source:** v1.49.587 catalog-divergence discovery (live NASA index 1.66/1.67 vs canonical CSV mismatch); user direction 2026-04-29 ("missions in chronological order, one per release; expand CSV for gaps; every mission gets a release").

**Observation:** When forward-cadence ship reality (live NASA index, GitHub release tags, immutable git history) diverges from the canonical ordering CSV, the reconciliation has two basic shapes: (Path X) rebuild ship reality to match CSV, requiring file-renaming + URL-redirects + GitHub release-body amendments + reader-link breakage; or (Path Y) expand the CSV to match ship reality, requiring CSV row rewrites + insertion of missed-block backfills + downstream row shifts. v1.49.587 chose Path Y because (a) GitHub release tags v1.49.582 + v1.49.586 are immutable on GitHub and would still mention "NASA 1.66 = Pioneer 9" in their release-body even after renames (partial divergence remains regardless), (b) shipped reality has 9 months of accumulated cross-references, (c) CSV is gitignored data that can be rewritten without git-history pollution, (d) backfilling missed-block missions (Surveyor 7, Apollo 5, 6, 7) preserves the user's "every mission gets a release" discipline.

**Application:** v1.49.587 reconciled the CSV via `tools/nasa-csv-path-y-reconciliation.py` — idempotent atomic Python script. Rewrites 1.66 = PIONEER-9 + 1.67 = OAO-2 (matches shipped reality); inserts SURVEYOR-7 at 1.68; renumbers APOLLO-5/6/7 to 1.69/1.70/1.71; shifts all old 1.71+ rows +1. Strict version=chronology resumes from 1.72 forward; one-time inversion at 1.66/1.67 (Pioneer 9 Nov-1968 + OAO-2 Dec-1968 sit at version 1.66/1.67 although chronologically they belong at version 1.71/post-Apollo-7) is documented and contained.

**Forward application:** all future CSV-reality divergences in any forward-cadence track (NASA, MUS, ELC, SPS) follow Path Y by default. Path X is reserved for emergency cases where the divergence is so structurally damaging that the cost of file-renaming + redirects is justified. Document one-time inversions in the CSV header / front-matter so future readers understand the historical anomaly.

### #10182 — Three-track-plus-TRS milestone pattern: NASA cadence dominates; failed TRS unit doesn't block NASA ship; soft cycles bounded per Part of book

**Source:** v1.49.587 user direction 2026-04-29 ("balanced out to have the work done along side the nasa missions as we go forward not all done at once"); TRS-EXECUTION-MAP.md authored at G0.

**Observation:** Multi-track programs collapse into either monolithic ship-everything-at-once (overruns context window, fails midway) or unbounded cadence drift (one track starves another). The TRS program at full scope (~5.6M tokens, 6 missions, ~35 atomic units) cannot run in a single milestone window. The user direction is to slice it into NASA-cadence atomic units that ship one-per-milestone alongside NASA work. Three discipline rules emerge: (a) NASA cadence dominates — failed TRS unit doesn't block NASA ship; (b) atomic-unit-per-milestone, not multiple parallel TRS waves per milestone; (c) soft cycles (M3 discovers issue → M4 ticket → M2 absorbs) bounded per Part of book — the cycle averages out without stalling cadence.

**Application:** v1.49.587 ships TRS M0 Wave 0 (164-claim topic-map.json from PDF extract) as ONE atomic unit alongside the NASA + MUS + ELC + SPS forward quartet. TRS-EXECUTION-MAP.md aligns the full 6-mission program to v1.49.587 - v1.49.620+ across ~35 milestones: M0 (10 milestones) → M1 (3 milestones) → M2/M3/M4/M5 (rolling Part-by-Part across ~22 milestones). Per-milestone TRS allocation averages ~160K tokens — sub-unit relative to NASA work which is typically 200K+ per milestone for the build wave alone. Map updates allowed at any milestone close.

**Forward application:** all forthcoming v1.49.588-v1.49.620+ milestones ship one TRS atomic unit per milestone per the execution map. v1.49.588 ships TRS M0 Wave 1a (4 packs in parallel via fleet dispatch). If a TRS unit fails, NASA still ships and the TRS unit is retried at next milestone. The map is the *current best understanding*; refinements ship as part of normal mission close. Refinement triggers: pack proves significantly larger/smaller than estimated; M4 ticket flow exceeds M2 absorption rate; M3 render-twin scope per Part exceeds the per-milestone unit; user adjusts cadence priorities.
