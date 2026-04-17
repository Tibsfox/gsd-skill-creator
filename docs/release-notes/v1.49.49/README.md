# v1.49.49 — "Shields Up"

**Released:** 2026-03-26
**Scope:** PNW Research Series — SAN (SANS Institute), the 47th project in the Research line and the first dedicated cybersecurity entry; an eight-module atlas covering 36 years of the world's premier cybersecurity training organization from Alan Paller's 1989 founding, through the GIAC certification ecosystem, NetWars competitions, the Reading Room's open library, the DShield collective-sensor network, and the 4.8-million-person global cyber workforce gap that still defines the mission
**Branch:** dev → main
**Tag:** v1.49.49 (2026-03-26T03:54:54-07:00) — merge commit `b529ff5bf`
**Commits:** v1.49.48..v1.49.49 (3 commits: content `84db2e598` + docs `95e7cbfca` + merge `b529ff5bf`)
**Files changed:** 21 (+3,952 / −2, net +3,950) — 18 new SAN tree files, 1 new research sidecar (`docs/research/sans-institute.md`), 1 new release-notes README, 2 modified hub/nav files (`Research/index.html`, `series.js`), 1 minor top-hub touch (`www/tibsfox/com/index.html`)
**Predecessor:** v1.49.48 — "Secret Masters of Fandom" (SMF, the capstone of the conventions sub-cluster)
**Successor:** v1.49.50 — next Research project in the PNW cadence
**Classification:** content — Research project addition; zero tooling change, zero schema change, zero build-system change; pure new-surface module slotting into the multi-domain docroot `www/tibsfox/com/Research/` that v1.49.38 reserved
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Dedicated to:** Alan Paller (1945–2021) — who saw that the people defending networks had nowhere to learn, and spent 32 years fixing that
**Epigraph:** *"One man saw that the people defending networks had nowhere to learn. Thirty-six years later, SANS is where the world's defenders are trained."*

---

## Summary

**SAN opens the defensive half of the infrastructure layer.** The Research series had already documented how to build and run infrastructure through SYS (Systems Administration, v1.49.33) — nineteen files, 10,550 lines, the canonical statement of daemons-services-uptime as a body of knowledge. What SYS did not answer was who defends the thing once it exists. v1.49.49 answers that with SAN, the first dedicated cybersecurity project in the 47-entry catalog. SYS documents build-and-operate; SAN documents defend-and-verify. The pair is architecturally necessary — you cannot operate what you cannot secure, and you cannot secure what you do not understand operationally — and the practitioner-first principle connects them: SYS requires administrators to understand the systems they manage, and SANS requires instructors to actively work in the field they teach. The same rule, now repeated across two releases at two layers. The Research series is mature enough to ship that rule as a thesis rather than as a coincidence.

**Alan Paller's 1989 founding insight is the load-bearing historical claim.** In 1989 there was no cybersecurity profession. "Information security" meant locked filing cabinets and firewall-vendor pamphlets. Network defenders existed, but they had no formal place to learn — no curriculum, no credentialing body, no shared threat corpus, and no peer community outside proprietary vendor conferences. Paller's founding insight was that the defenders needed the same rigor as the systems they were trying to protect, and that rigor had to come from practitioners who had done the work, not from academics who had read about it. Thirty-six years later SANS has trained the majority of the people who actually raise the shields at banks, utilities, hospitals, and governments. Module 01 "Foundation & History" sits with that origin story and refuses to treat it as trivia — the founding is the argument, and the argument still holds.

**GIAC credentials invert the academic-credential pattern.** The Global Information Assurance Certification ecosystem is documented across Module 02 with 40-plus specializations, every one of which requires the instructor to be actively practicing the discipline they certify. This inverts the default academic pattern (where credentials can accumulate after practice ends) and re-centers certification on demonstrated current competence. The v1.49.49 module makes the inversion explicit rather than burying it: a GIAC certification is not a diploma; it is a claim that the holder could, last month, do the thing the certification names. Paired with the module's treatment of NetWars (Module 03), the credentialing story becomes pedagogically coherent — you learn by practicing offense against a live target, and you certify by proving you can still defend one.

**DShield is a federation design in the wild.** Module 05 "Community & Free Resources" documents the DShield network — individual defenders voluntarily contributing firewall log data into a collective intelligence sensor grid. Nobody pays for access; everyone benefits from aggregation. The architectural pattern is identical to the DoltHub-style federation the Research series itself uses for knowledge transfer, and to the BRC federation the project is designing for its own mesh infrastructure. DShield proves the pattern scales in hostile environments under adversarial pressure. A cybersecurity sensor grid that works because sovereign participants opt in, share partial data, and get amplification in return is a model for a lot of other federations we care about, and naming the parallel inside Module 05 lets future releases build on it rather than rediscover it. The Research series is explicit that this is not an analogy but a structural match.

**The 4.8-million-person workforce gap keeps the mission unfinished.** Module 06 "Workforce & Careers" confronts the figure most cybersecurity surveys converge on: roughly 4.8 million unfilled global cybersecurity positions, with about 3 million of those classified as immediately-hirable vacancies. The pipeline cannot close the gap at its current throughput, and the gap has widened every year since it was first measured. Reading that number inside a Research project about a 36-year-old training organization changes its meaning. SANS is not a school; it is infrastructure, and the 4.8-million-person gap means SANS's pipeline capacity is a national-security concern rather than an educational statistic. The module refuses the feel-good framing and keeps the subject where it belongs — at the layer where governance, workforce development, and critical-infrastructure protection intersect.

SAN ships inside the multi-domain docroot that v1.49.38 built (`www/tibsfox/com/Research/SAN/`) with the now-standard per-project structure: `index.html` (card landing, 108 lines), `page.html` (full-site read, 205 lines), `mission.html` (mission-pack bridge, 56 lines), `style.css` (tactical navy `#0D47A1` paired with alert amber `#FF6F00`, 73 lines), a `research/` subtree of eight module markdown files totaling 1,549 lines, and a `mission-pack/` triad of HTML (230 lines), markdown (285 lines), LaTeX (1,117 lines), and a pre-rendered PDF (181,575 bytes). The Research hub index gained ten lines to add the SAN card; `series.js` gained one entry to wire SAN into the Prev/Next flow. The only touch outside the SAN tree is a two-line hub update at `www/tibsfox/com/index.html` that bumps the project count to 47. The structural affordances of the domain-rooted docroot continue to pay dividends — adding the 47th project is a mechanical operation because the shape of a Research project is stable by this point in the series.

The commit pattern is also stable. Content commit `84db2e598` lands the SAN tree in a single atomic diff (20 files, +3,919 / −2). Documentation commit `95e7cbfca` lands the release-notes stub (+33). Merge commit `b529ff5bf` pulls dev into main. Three commits, 21 files, no intermediate broken state. A bisect through the v1.49.48..v1.49.49 window finds exactly one meaningful commit where the project existed or did not exist. The release-notes README and the four chapter files (`00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md`) were originally auto-generated by the release-history parser at parse confidence 0.95; this uplift rewrites the README to A-grade depth while the chapter files remain as parser output for DB-driven navigation.

Module 01 "Foundation & History" introduces Alan Paller and the 1989 context in which "information security" had no profession attached to it. Module 02 "Training & Certification" documents the GIAC credentialing ecosystem and the practitioner-instructor rule that underwrites its credibility. Module 03 "Conferences & Competitions" covers NetWars and the capture-the-flag pedagogy that turned offensive practice into defensive learning. Module 04 "Programs & Resources" maps the Reading Room's position as the largest free cybersecurity research library, built on Paller's conviction that paywalled knowledge creates worse defenders. Module 05 "Community & Free Resources" traces DShield from firewall log donations to a distributed sensor grid and names the federation pattern explicitly. Module 06 "Workforce & Careers" confronts the 4.8-million-person global gap as a structural problem rather than a headline. Module 07 "Connections & Rosetta" maps SAN into the Rosetta Stone cluster relations — what SAN shares with SYS, how SAN differs from BCM, and where the cybersecurity and industrial clusters touch. Module 08 "Verification Matrix" closes with the source audit: 26 sources at 80% Gold-tier plus 18 cross-links to other Research projects.

The tactical-navy and alert-amber palette (`#0D47A1` and `#FF6F00`) is deliberately the color scheme of a night-shift security operations center. SAN is the project about the people who stay awake when the shift changes, and the theme picks the colors those people look at for hours — navy dashboards, amber alert pills, dark chrome. The choice is editorial, not decorative; a different palette would signal the wrong profession. Research-project themes at this depth of the series carry editorial weight, and two colors are enough when the colors are specific.

The reader can recover the work from this README alone. What shipped: eight research modules totaling 1,549 lines plus the mission-pack triad (HTML, markdown, LaTeX, pre-rendered PDF) and the page shell. Why it shipped: to open the defensive half of the infrastructure layer with the Research series' first cybersecurity project and to name Alan Paller's practitioner-first principle as a cross-domain invariant. How it was verified: the verification matrix in Module 08 documents every factual claim against 26 sources (80% Gold-tier) with 18 cross-links to prior Research projects. What to read next: Module 01 for the founding context, Module 05 for the federation pattern, Module 06 for the workforce gap, and Module 07 for the Rosetta cluster mapping. The rest of this README gives the structural surface; the research gives the depth.

---

## Key Features

| Area | What Shipped |
|------|--------------|
| SAN project tree | New directory `www/tibsfox/com/Research/SAN/` with `index.html` (108 lines), `page.html` (205 lines), `mission.html` (56 lines), and `style.css` (73 lines) wired into the multi-domain docroot |
| Research module 01 — Foundation & History | `www/tibsfox/com/Research/SAN/research/01-foundation-history.md` (171 lines) — Alan Paller's 1989 founding, pre-profession cybersecurity context, the practitioner-first ethos |
| Research module 02 — Training & Certification | `research/02-training-certification.md` (226 lines) — GIAC's 40+ certifications, the active-practitioner instructor rule, credentialing as current-competence claim |
| Research module 03 — Conferences & Competitions | `research/03-conferences-competitions.md` (190 lines) — NetWars, capture-the-flag pedagogy, offense-teaches-defense cohort scaling |
| Research module 04 — Programs & Resources | `research/04-programs-resources.md` (182 lines) — Reading Room as the largest free cybersecurity research library, open-knowledge thesis |
| Research module 05 — Community & Free Resources | `research/05-community-free.md` (174 lines) — DShield sensor-grid federation, defenders-as-distributed-sensors pattern, structural match to DoltHub-style federation |
| Research module 06 — Workforce & Careers | `research/06-workforce-careers.md` (220 lines) — 4.8-million-person global cyber workforce gap, pipeline-as-infrastructure framing |
| Research module 07 — Connections & Rosetta | `research/07-connections-rosetta.md` (218 lines) — Rosetta cluster mapping of SAN into SYS / BCM / industrial-cluster relations |
| Research module 08 — Verification Matrix | `research/08-verification-matrix.md` (168 lines) — 26-source audit (80% Gold-tier) with 18 cross-links to other Research projects |
| Mission-pack triad | `mission-pack/index.html` (230 lines) + `mission-pack/mission.md` (285 lines) + `mission-pack/sans-mission.tex` (1,117 lines) + pre-rendered `mission-pack/sans-mission.pdf` (181,575 bytes) |
| Research sidecar | `docs/research/sans-institute.md` (285 lines) — standalone markdown companion readable outside the www tree |
| Tactical navy + alert amber theme | `style.css` pairs `#0D47A1` (deep navy, SOC-dashboard base) with `#FF6F00` (alert amber, SIEM-alert pill) — 73 lines total |
| Research hub integration | `www/tibsfox/com/Research/index.html` updated (+10 lines) to add the SAN card to the grove-level index |
| Series navigation | `www/tibsfox/com/Research/series.js` updated (+1 line) to extend the Prev/Next flow to 47 entries; `www/tibsfox/com/index.html` updated (2 lines) to bump the hub count |
| Atomic content commit | `84db2e598` lands all 18 SAN tree files, the sidecar, and the navigation updates in a single diff (20 files, +3,919 / −2); bisect through v1.49.48..v1.49.49 finds one meaningful state transition |
| Release-notes chapter artifacts | `00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md` parser-generated at confidence 0.95, kept for DB-driven navigation after this README uplift rewrites the narrative surface |

---

## Retrospective

### What Worked

- **The practitioner-first principle is universal and portable.** SANS requires instructors to work in the field. The Research series requires evidence from practice. SYS (v1.49.33) required operators to document from their own shifts. Three separate domains enforcing the same rule is not a coincidence — it is the single most reliable quality signal available to any knowledge-transfer system. Naming the principle inside SAN and citing its prior appearances turns it into a named invariant rather than a recurring observation. Every future Research project can now use "practitioner-first" as a one-word shorthand, because v1.49.49 did the work of defining it across the catalog.
- **Security completes the infrastructure cluster.** SYS alone documented the build-and-operate half of infrastructure; it assumed, without ever saying so, that someone else would defend what it taught you to run. SAN supplies the defensive half explicitly and names the pairing. The Research series is now complete at the infrastructure layer rather than half-complete, and subsequent infrastructure projects can cite SAN + SYS as a canonical two-project baseline rather than having to repeat the defensive context each time.
- **The 80% Gold source ratio holds the line in a noisy field.** Cybersecurity is unusually plagued by vendor marketing masquerading as research — conference decks, webinars, "threat reports" that are really sales funnels. Of SAN's 26 audited sources, 80% are Gold-tier (primary SANS publications, GIAC specifications, official NIST/CISA documents, peer-reviewed papers). That ratio survived the editing pass; it did not get diluted by available-but-secondary sources. Future cybersecurity-adjacent projects should inherit the same 80% Gold floor as a norm rather than a stretch target.
- **Eight-module structure absorbed the extra subject matter cleanly.** Most Research projects ship at seven modules. SAN needed eight because the Rosetta cluster mapping (Module 07) is genuinely new work that would have overloaded any of the existing modules had it been folded in. Expanding the standard structure by one module rather than compressing an existing one preserved each module's focus and gave the verification matrix its own clean frame. The eight-module pattern is now available for future projects that legitimately carry extra architectural load.
- **The tactical-navy + alert-amber theme reads as the subject at a glance.** `#0D47A1` and `#FF6F00` are the colors a SOC analyst stares at for an eight-hour shift. The theme does editorial work before the reader arrives at the first module heading. Research-project palettes at this depth are communicating genre, and SAN's pair communicates "cybersecurity operations" without caption text. Two colors were sufficient; a third would have diluted signal.

### What Could Be Better

- **Cross-reference density at 18 is strong but below WYR's 24.** SAN's 18 cross-links to other Research projects is a solid count for the series' first cybersecurity project and for a topic whose closest neighbors are still being mapped. That said, WYR (Weyerhaeuser, v1.49.43) hit 24 cross-links against the industrial-layer neighborhood it was anchoring, and future cybersecurity projects should close that gap as the security cluster fills out — particularly toward BCM, BPS, and the emerging workforce-development layer.
- **Module 08 "Verification Matrix" is 168 lines — shorter than SMF's 153 but well below WYR's 193.** The 26-source audit is adequate and the 80% Gold ratio is the strongest part, but the format could stretch into comparative verification patterns (where two sources disagree, which to believe and why) that WYR demonstrated. The next cybersecurity project should adopt the disagreement-adjudication pattern explicitly.
- **The workforce gap treatment in Module 06 is analytical but not yet actionable.** Module 06 names the 4.8-million-person figure and frames it as national-security infrastructure concern, but it stops short of mapping what policy instruments actually close that gap. A follow-on project on workforce pipelines, apprenticeship models, or state-level cybersecurity workforce initiatives could pick up where Module 06 leaves off. The current module chose depth on diagnosis over breadth on remedy, which is the right editorial call for the first-pass project but leaves a genuine follow-on available.

---

## Lessons Learned

- **Training organizations are infrastructure, not schools.** SANS Institute is closer to a utility than to a university. The 4.8-million-person global gap in cybersecurity talent (Module 06) means SANS's training pipeline capacity is a national-security variable rather than an educational statistic. Documenting SANS as infrastructure — with throughput, failure modes, uptime, and dependency relationships — changes how every module reads, and changes what follow-on projects are able to say. Any future Research project about a training organization (academic, trade, professional) can borrow the infrastructure frame as default.
- **The DShield model maps to federation exactly.** Individual defenders contributing partial firewall-log data into a collective intelligence sensor grid is the same architectural pattern as DoltHub-style dataset federation and as the BRC mesh federation design this project is building. Module 05 names it as a structural match rather than an analogy, which matters because the architectural claim is falsifiable: if the pattern is the same, the failure modes should be the same, and the scaling properties should transfer. Future federation work in the project can cite DShield as a live case study of the pattern under adversarial conditions.
- **Practitioner-first is a cross-domain invariant, not a coincidence.** The same rule — credibility through demonstrated current practice — shows up in SANS's instructor policy, in the Research series' source-hierarchy, in SYS's operator-first documentation, and in Weird Al Yankovic's deep-understanding-of-the-original requirement for parody. Four separate domains enforcing the same rule is strong evidence the rule is load-bearing, not culturally specific. Naming the invariant inside v1.49.49 lets later projects treat it as primitive vocabulary rather than rediscovering it.
- **Open knowledge produces better defenders than paywalled knowledge.** Paller's Reading Room thesis (Module 04) is an empirical claim with 36 years of data: a free library of cybersecurity research has outperformed paywalled vendor research in producing competent defenders. The Research series itself is a bet on the same thesis at smaller scale. Citing the Reading Room inside v1.49.49 lets the series name its own theory-of-change without claiming to have invented it.
- **Credentials mean "can do it now", not "did it once".** GIAC's active-practitioner rule for instructors encodes a theory about what credentials are for: they are competency claims about the present, not achievements in the past. Module 02 argues this explicitly. The rule has policy consequences — recertification schedules, audit requirements, instructor turnover — and naming the theory makes those consequences visible. Any future project about credentialing, licensing, or certification can start from the GIAC invariant.
- **Verification rigor is load-bearing in adversarial fields.** Cybersecurity, like nutrition and political science, is a domain where the low-quality source corpus is large, well-funded, and actively hostile to careful research. SAN's 80% Gold-tier ratio is the minimum viable source floor for a field like this — anything lower and the project becomes indistinguishable from vendor marketing. Module 08 argues for the 80% floor as a norm rather than an aspiration; future cybersecurity-adjacent projects should inherit it without negotiation.
- **Eight modules is permissible when the work is genuinely there.** The standard seven-module Research-project shape is a default, not a cap. When a project legitimately carries an extra architectural load (as SAN does with the Rosetta cluster mapping) the right move is to add a module rather than compress an existing one. Expanding the structure preserves per-module focus at the cost of one more file. Future projects with similar load (cross-cluster work, large verification matrices, dedicated policy or workforce modules) should feel free to expand to eight or nine modules without apology.
- **The atomic content commit pattern is worth protecting across the series.** Landing all 18 SAN tree files, the sidecar, and the navigation updates in one diff (`84db2e598`) keeps the intermediate state valid. A reviewer or bisect walker sees the project either present or absent, never half-built. The pattern is cheap to maintain (one `git add` of the whole tree, one commit message) and expensive to restore if broken (unpicking mixed-state commits costs hours). Every Research release so far has honored it; the discipline should continue as the series approaches 50 projects and beyond.
- **Dedication-as-thesis compounds when the dedicatee embodies the argument.** Alan Paller spent 32 years saying that defenders needed somewhere to learn. The dedication to Paller is therefore not ornamental; it is the one-sentence compression of the entire module arc. When a Research project can dedicate to a person whose life work embodies the project's thesis, the dedication carries editorial weight. SMF's dedication to convention volunteers did the same work at a different scale. Future projects should pick dedicatees who embody the thesis rather than dedicatees who are merely relevant.

---

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.48](../v1.49.48/) | Predecessor — "Secret Masters of Fandom"; SMF closed the three-convention sub-cluster; SAN opens the cybersecurity thread, reusing SMF's dedication-as-thesis register |
| [v1.49.47](../v1.49.47/) | WCN (Westercon) — convention-layer federation; SAN's DShield federation framing in Module 05 rhymes with WCN's packet-layer framing |
| [v1.49.46](../v1.49.46/) | NWC (Norwescon) — anchor-node pattern; SAN's SOC-centric posture contrasts with NWC's anchored-hotel pattern as two models of bounded community |
| [v1.49.43](../v1.49.43/) | WYR (Weyerhaeuser) — the verification-matrix reference project; SAN's Module 08 inherits WYR's audit-matrix shape and sets the next cybersecurity project's floor |
| [v1.49.38](../v1.49.38/) | Multi-Domain Docroot Refactor — the release that built the `www/tibsfox/com/Research/` slot; v1.49.49 is the 9th consecutive Research project to demonstrate the refactor's velocity payoff |
| [v1.49.37](../v1.49.37/) | Thermal & Hydrogen Energy Systems — another infrastructure project whose community-of-practice framing SAN extends to the defensive layer |
| [v1.49.33](../v1.49.33/) | SYS (Systems Administration) — the build-and-operate half of the infrastructure pair SAN completes with defend-and-verify |
| [v1.49.31](../v1.49.31/) | TIBS Animal Speak & Sacred Landscapes — oral-tradition precedent for knowledge-transfer framing; Module 04's Reading Room builds on TIBS's framing of unwritten-to-written knowledge |
| [v1.49.27](../v1.49.27/) | Spatial Awareness — PNW atlas that the Research-series infrastructure cluster anchors geographically |
| [v1.49.26](../v1.49.26/) | BPS Bio-Physics Sensing Systems — the sensor-grid precedent the DShield federation pattern rhymes with |
| [v1.49.25](../v1.49.25/) | AVI+MAM compendiums — volunteer-ecology and community-of-practice precedents relevant to Module 07's cluster mapping |
| [v1.49.22](../v1.49.22/) | PNW Research Series origin — the release that began the series whose 47th member ships here |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop; SAN is an Observe→Compose cycle applied to the cybersecurity training / workforce layer |
| `www/tibsfox/com/Research/SAN/` | New project tree — 18 new files totaling the SAN surface |
| `www/tibsfox/com/Research/SAN/research/` | Eight research modules totaling 1,549 lines — the core narrative of the project |
| `www/tibsfox/com/Research/SAN/mission-pack/` | Mission-pack triad — HTML + markdown + LaTeX + pre-rendered PDF |
| `www/tibsfox/com/Research/SAN/research/08-verification-matrix.md` | Source-audit matrix documenting 26 citations (80% Gold-tier) and 18 cross-links |
| `docs/research/sans-institute.md` | 285-line markdown sidecar readable outside the www tree — the project's portable companion |
| `www/tibsfox/com/Research/index.html` | Research hub updated (+10 lines) to add the SAN card |
| `www/tibsfox/com/Research/series.js` | Prev/Next navigation updated (+1 line) to 47 entries |
| `www/tibsfox/com/index.html` | Top-level hub updated (2 lines) for the project-47 count |
| `84db2e598` | Content commit — 20 SAN tree + sidecar + nav files landed atomically |
| `95e7cbfca` | Docs commit — release-notes stub for v1.49.49 |
| `b529ff5bf` | Merge commit — dev → main for the v1.49.49 tag |

---

## Engine Position

v1.49.49 is the 47th project in the PNW Research Series and the first dedicated cybersecurity entry. The predecessor v1.49.48 "Secret Masters of Fandom" closed the three-convention sub-cluster (NWC + WCN + SMF); v1.49.49 opens a new thread that pairs architecturally with SYS (v1.49.33) to complete the infrastructure cluster's build-and-defend axis. The v1.49.x line at this depth continues its cadence of one Research project per calendar release, each with its own dedication, epigraph, seven-to-eight-module structure, and two-color theme pair. Looking backward, v1.49.49 is the 9th consecutive Research project to demonstrably benefit from the structural investment made in v1.49.38 (the multi-domain docroot refactor). Looking forward, every subsequent Research project inherits three new affordances SAN established: the practitioner-first principle named explicitly as a cross-domain invariant rather than restated per project, the eight-module structure available when cluster-mapping work genuinely warrants it, and the 80% Gold source floor as a norm for cybersecurity-adjacent projects. The Research series is now dense enough and structurally mature enough that each addition compounds: SAN ships as one project, opens a cluster, raises the audit floor, and cements a cross-domain invariant that subsequent projects can cite by name.

---

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.48..v1.49.49) | 3 (content `84db2e598` + docs `95e7cbfca` + merge `b529ff5bf`) |
| Files changed | 21 |
| Lines inserted / deleted | 3,952 / 2 |
| Content-commit files / lines | 20 files, +3,919 / −2 (`84db2e598`) |
| Docs-commit files / lines | 1 file, +33 (`95e7cbfca`) |
| New files in SAN tree | 18 |
| Research modules (markdown) | 8 (1,549 lines total) |
| Mission-pack files | 4 (`mission-pack/index.html` 230 + `mission.md` 285 + `sans-mission.tex` 1,117 + `sans-mission.pdf` 181,575 bytes) |
| Page-shell files | 3 (`index.html` 108 + `page.html` 205 + `mission.html` 56) |
| Stylesheet | 1 (`style.css` 73 lines) |
| Research sidecar (outside www) | 1 (`docs/research/sans-institute.md`, 285 lines) |
| Release-notes README | 1 (rewritten by this uplift from a 33-line stub) |
| Navigation files touched | 3 (`Research/index.html`, `series.js`, hub `index.html`) |
| Cross-references to other Research projects | 18 |
| Sources audited in verification matrix | 26 (80% Gold-tier) |
| Theme colors | 2 (`#0D47A1` tactical navy, `#FF6F00` alert amber) |
| Research project number in series | 47 |
| Infrastructure pair position | 2 of 2 (SYS → SAN, build-and-defend) |
| Cumulative series weight | ~199,000 research lines across 47 projects, 438 modules |

---

## Taxonomic State

After v1.49.49 the PNW Research Series taxonomy stands at 47 published projects across the core clusters. The infrastructure cluster (SYS, CMH, BCM, SHE, OCN, BPS, THE, HGE, NND, SAN) is now 10 projects deep and opens its defensive axis for the first time. The ecology cluster (COL, CAS, ECO, AVI, MAM, SAL, TIBS, FFA) remains the densest neighborhood for cross-references. The conventions sub-cluster (NWC, WCN, SMF) closed at v1.49.48. The industrial layer (WYR) remains anchored by its flagship. SAN formally opens the cybersecurity / defensive-infrastructure neighborhood and sets the floor for subsequent projects in that layer. Taxonomic state: 47 projects, 8 clusters, 1 closed sub-cluster (conventions), 1 newly-opened thread (cybersecurity), ~199,000 cumulative research lines across 438 research modules.

---

## Files

- `www/tibsfox/com/Research/SAN/` — new project root containing `index.html`, `page.html`, `mission.html`, `style.css`, `research/`, and `mission-pack/`
- `www/tibsfox/com/Research/SAN/research/01-foundation-history.md` — 171 lines; Alan Paller, 1989 founding, practitioner-first ethos
- `www/tibsfox/com/Research/SAN/research/02-training-certification.md` — 226 lines; GIAC ecosystem, active-practitioner instructor rule
- `www/tibsfox/com/Research/SAN/research/03-conferences-competitions.md` — 190 lines; NetWars, capture-the-flag as pedagogy
- `www/tibsfox/com/Research/SAN/research/04-programs-resources.md` — 182 lines; Reading Room, open-knowledge thesis
- `www/tibsfox/com/Research/SAN/research/05-community-free.md` — 174 lines; DShield sensor-grid federation
- `www/tibsfox/com/Research/SAN/research/06-workforce-careers.md` — 220 lines; 4.8-million-person workforce gap as infrastructure concern
- `www/tibsfox/com/Research/SAN/research/07-connections-rosetta.md` — 218 lines; Rosetta cluster mapping (SAN × SYS × BCM × industrial)
- `www/tibsfox/com/Research/SAN/research/08-verification-matrix.md` — 168 lines; 26-source audit (80% Gold), 18 cross-links
- `www/tibsfox/com/Research/SAN/mission-pack/index.html` — 230 lines; mission-pack landing page
- `www/tibsfox/com/Research/SAN/mission-pack/mission.md` — 285 lines; mission-pack markdown source
- `www/tibsfox/com/Research/SAN/mission-pack/sans-mission.tex` — 1,117 lines; mission-pack LaTeX source
- `www/tibsfox/com/Research/SAN/mission-pack/sans-mission.pdf` — 181,575 bytes; pre-rendered PDF
- `www/tibsfox/com/Research/SAN/index.html` — 108 lines; card landing page
- `www/tibsfox/com/Research/SAN/page.html` — 205 lines; full-site read page
- `www/tibsfox/com/Research/SAN/mission.html` — 56 lines; mission-pack bridge
- `www/tibsfox/com/Research/SAN/style.css` — 73 lines; tactical navy + alert amber theme
- `docs/research/sans-institute.md` — 285 lines; standalone research sidecar outside the www tree
- `www/tibsfox/com/Research/index.html` — +10 lines; hub card added for SAN
- `www/tibsfox/com/Research/series.js` — +1 line; Prev/Next wiring to 47 entries
- `www/tibsfox/com/index.html` — 2 lines; top-level hub count update

Aggregate: 21 files changed, +3,952 insertions, −2 deletions across 3 commits (content `84db2e598` + docs `95e7cbfca` + merge `b529ff5bf`), v1.49.48..v1.49.49 window. The only deletions (2 lines) are from hub/index replacements that preserve byte-equivalent rendering.

---

**Prev:** [v1.49.48](../v1.49.48/) · **Next:** [v1.49.50](../v1.49.50/)

> *Trust in cybersecurity is earned through demonstrated competence, not claimed credentials.*
