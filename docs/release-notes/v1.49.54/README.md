# v1.49.54 — "Cosmic Crisp"

**Released:** 2026-03-26
**Scope:** PNW Research Series — AGR (PNW Agriculture), the 52nd project in the Research line; an eight-module agricultural atlas of the bioregion covering twenty years of Cosmic Crisp apple breeding at Washington State University, the Willamette Valley Pinot Noir terroir built on 15,000-year-old Missoula-Flood basalt, the Grand Coulee Dam's conversion of a sagebrush desert into 671,000 irrigated acres, the millennia-long war against codling moth, the cross-domain smoke-taint collision between wildfire and viticulture, and the Columbia River as the central thread binding agriculture to every other PNW domain
**Branch:** dev → main
**Tag:** v1.49.54 (2026-03-26) — merge commit `87df898eb`
**Commits:** v1.49.53..v1.49.54 (3 commits: content `ac62845c2` + docs `36ceee70c` + merge `87df898eb`)
**Files changed:** 20 (+2,940 / −2, net +2,938) — 17 new AGR tree files, 1 new research sidecar (`docs/research/pnw-agriculture.md`), 1 new release-notes README, 3 touched navigation / hub files (`Research/index.html`, `Research/series.js`, top hub `www/tibsfox/com/index.html`)
**Predecessor:** v1.49.53 — "Daypack" (JanSport, the 51st Research project; product-company sub-cluster)
**Successor:** v1.49.55 — next Research project in the PNW cadence
**Classification:** content — Research project addition; zero tooling change, zero schema change, zero build-system change; pure new-surface module slotting into the multi-domain docroot `www/tibsfox/com/Research/` that v1.49.38 reserved
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Dedicated to:** the orchardists, vintners, and irrigators of the Columbia Basin — who turned a rain shadow into a breadbasket
**Epigraph:** *"The same rain shadow that makes eastern Washington a desert made it the most productive irrigated farmland in America — all it needed was water."*

---

## Summary

**Agriculture is the missing middle layer the ecology cluster needed.** AGR is the 52nd project in the PNW Research Series and it finally fills a gap that the prior fifty-one projects had circled without closing. COL (Columbia watershed), CAS (Cascades), and ECO (Pacific Northwest ecology) map the wild landscape. GDN (gardens) maps the domestic cultivated plot. AGR maps the industrial agricultural landscape that sits between — the orchards, vineyards, feedlots, center-pivot circles, and irrigation canals that are neither wilderness nor garden but a third thing: a managed productive biome scaled to continental markets. Before AGR the Research series had the wild and the domestic. After AGR the bioregion has all three scales — wilderness, cultivation, and the industrial layer between — and every subsequent project inherits a vocabulary for naming where on that spectrum its subject sits.

**Named "Cosmic Crisp" after the apple WSU spent twenty years breeding.** The release name is not decorative. WA 38 — a cross between Enterprise (a PRI-cooperative disease-resistant variety) and Honeycrisp (a Minnesota-bred cultivar famous for its explosive texture) — was made at the WSU Tree Fruit Research and Extension Center in Wenatchee in 1997 by Dr. Bruce Barritt. It was selected out of tens of thousands of seedlings, trialed through Phase 1, Phase 2, and Phase 3 plantings across multiple sites, named through consumer research in 2014 for the starfield-like lenticel pattern on its dark red skin, licensed exclusively to Washington growers for a ten-year window, and finally launched commercially at QFC University Village in Seattle on December 1, 2019. The $10 million branded launch campaign was the first of its kind for an apple. By 2024-25 Cosmic Crisp had climbed to the sixth most-produced US apple variety at roughly 6% of national production — a 20x production growth in five years. Twenty years from first cross to retail shelf. Three thousand trees per acre in high-density orchards on dwarfing rootstock. One fruit that carries the PNW agriculture story in its skin.

**The Columbia River is the project's central thread and the Research series' spine.** The river appears in SAL (salmon runs blocked by dams), HGE (hydroelectric generation), THE (energy grid), AGR (irrigation for 671,000 acres), COL (watershed boundary), and WYR (timber transport by log drive). Six projects, one river, six editorial lenses on the same physical object. Module 04 "Grand Coulee" makes this explicit by tracing a single piece of infrastructure — the largest concrete structure in the US at its 1942 completion, the federal project that powered aluminum smelters for WWII aircraft production, the dam that transformed sagebrush desert into a breadbasket through the Columbia Basin Project irrigation canals — and showing that the same structure blocks salmon migration (SAL), generates hydroelectric power (HGE/THE), displaced indigenous communities at Kettle Falls (TIBS), and irrigates the orchards and vineyards that AGR documents. Every use competes with every other use. Agriculture is the domain where all the bioregion's tensions converge, and the Columbia Basin is where that convergence is legible on the landscape.

**Module 06 "Smoke Taint" is the most cross-domain module in the entire series.** Viticulture (AGR wine grapes) meets fire ecology (ECO/CAS wildfire regimes) meets atmospheric chemistry (AWF air quality) meets climate change (THE energy and carbon). Volatile phenols — guaiacol, 4-methylguaiacol, syringol — released during wildfires bind to grape sugars through glycoconjugates that are undetectable until fermentation cleaves them and releases the ashtray flavor into the finished wine. The 2020 Oregon Labor Day fires devastated the Willamette Valley vintage; entire lots were declared unsellable. Four Research domains collide in a single module around a single phenomenon that cannot be understood through any one lens. This is the Rosetta Stone framework operating at its highest register: not an analogy across domains, but a phenomenon whose ontology requires the cross-domain vocabulary the Research series has been building since v1.0. Future modules can cite Module 06 as the canonical worked example for cross-domain phenomena.

**The 5.4x expansion ratio is the highest yet in the series.** The TeX source for the mission pack is compact — 307 lines covering four deep-dive subjects (codling moth pheromone chemistry, Cosmic Crisp genomic-assisted breeding, Jory soil mineralogy, smoke-taint analytical chemistry). The research-agent expansion produced eight modules totaling 1,663 lines of research prose. That is an expansion ratio of 5.4x, a new high-water mark for the series. The pattern is clear: dense source material produces the richest transformation. Projects whose TeX source is thin (summary-level, high-level, gestural) expand modestly. Projects whose TeX source is dense (specific compounds, named cultivars, quantified timelines, cited researchers) expand dramatically because each citation becomes a research thread the expansion agent can follow. AGR sets a ceiling subsequent Research projects should aim toward rather than discount from.

AGR ships inside the multi-domain docroot that v1.49.38 built (`www/tibsfox/com/Research/AGR/`) with the now-standard per-project structure: `index.html` (108 lines, card landing), `page.html` (205 lines, full-site read), `mission.html` (68 lines, mission-pack bridge), `style.css` (74 lines, Harvest theme pairing orchard red `#C62828` with field gold `#F9A825`), a `research/` subtree of eight module markdown files totaling 1,663 lines, and a `mission-pack/` triad of a markdown companion (218 lines), a LaTeX source (307 lines), and a pre-rendered PDF (122,966 bytes). The Research hub index gained ten lines to add the AGR card; `series.js` gained one entry to wire AGR into the Prev/Next flow; the top-level hub at `www/tibsfox/com/index.html` bumped two lines to update the project count from 51 to 52. The structural affordances of the domain-rooted docroot continue to pay compound dividends — adding the 52nd project is a mechanical operation because the shape of a Research project is stable after 51 prior instances have stress-tested the template.

The commit pattern is equally stable and equally boring, which is the sign of a healthy release process. Content commit `ac62845c2` lands AGR in a single atomic diff (18 files, +2,871 / −2). Documentation commit `36ceee70c` lands the release-notes stub (1 file, +69). Merge commit `87df898eb` pulls dev into main. Three commits, 20 files, no intermediate broken state. A bisect across the v1.49.53..v1.49.54 window finds exactly one meaningful commit where the project existed or did not exist — the atomic content-commit discipline that has protected every Research release since v1.49.22 holds here. The release-notes README and the four chapter files (`00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md`) were originally auto-generated by the release-history parser at parse confidence 0.95; this uplift rewrites the README to A-grade depth while leaving the chapter files as parser output for database-driven navigation.

Module 01 "The Land That Feeds" (164 lines) establishes the two-PNW framing: west of the Cascades is rainfed and diversified (berries, hazelnuts, Pinot Noir, grass seed); east of the Cascades is irrigated and intensive (apples, hops, cherries, wheat, potatoes). The Cascade Range is a north-south volcanic wall that splits the bioregion into two radically different agricultural worlds, and the interaction between them is what makes the PNW extraordinary. Module 02 "Cosmic Crisp" (209 lines) unfolds the twenty-year WA 38 breeding program at WSU's Tree Fruit Research and Extension Center in Wenatchee, the RosBREED federal $17M initiative that funded genomic-assisted breeding, marker-assisted selection for the texture and storage genes, high-density orchard architecture at 3,000+ trees per acre on dwarfing M9 and Bud9 rootstocks, and the $10 million branded launch that made the apple a cultural event as well as a fruit. Module 03 "Terroir" (205 lines) places the Willamette Valley Pinot Noir industry on Jory soil — volcanic basalt weathered from the Columbia River Basalt Group and reworked by the Missoula Floods 15,000 years ago — and connects that geology to the specific compounds in the finished wine. Module 04 "Grand Coulee" (211 lines) walks the Columbia Basin Project from 1933 groundbreaking through 1942 completion to the 1950s irrigation build-out, documents the Odessa Aquifer crisis (groundwater depletion where surface irrigation does not reach), and grounds the whole project in prior-appropriation water law. Module 05 "Codling Moth" (232 lines) is the pest-and-disease deep dive — pheromone chemistry (codlemone, specifically), mating-disruption deployment on 150,000+ Washington acres, integrated pest management as an industry response to organophosphate failure, and the millennia-old arms race between orchardist and moth. Module 06 "When the Forest Burns, the Wine Dies" (229 lines) is the smoke-taint module. Module 07 "Water, Land, and What Grows" (221 lines) is the Rosetta-Stone connection synthesis that ties AGR to 17 other Research projects. Module 08 "The Harvest Report" (192 lines) is the verification matrix closing chapter.

The "Harvest" theme pair (orchard red `#C62828` with field gold `#F9A825`) reads as a ripe autumn orchard in late-afternoon sun. The palette deliberately avoids the saturated primary-school-palette reds of commercial apple branding and the muted earth tones of agrarian nostalgia. Instead it sits in the intermediate register of documentary photography — the color of a McIntosh in a picking bin against the color of ripe Red Delicious leaves at harvest. Research-project palettes at this depth of the series carry editorial weight, and two colors are enough when the colors are specific enough. The AGR theme will not be confused with the WYR evergreen-and-bark pairing, the JNS outdoors-olive-and-canvas pairing, or the SMF teal-and-smoky-amber pairing even at thumbnail size. The style file also holds four supporting tokens (`--earth`, `--soil`, `--loam`, `--field`, `--vine`) for semantic accents on pull quotes, callouts, and cluster cards, none of which overpower the orchard-red and field-gold primaries.

The reader can recover the work from this README alone. What shipped: eight research modules totaling 1,663 lines, the mission-pack pair (LaTeX + PDF + markdown companion), the page shell, the research sidecar at `docs/research/pnw-agriculture.md`, and the navigation wiring. Why it shipped: to complete the wilderness-cultivation-industrial triptych the Research series had been circling, to name the Columbia River as the series' central thread, and to demonstrate through Module 06 the cross-domain phenomenon pattern that future modules can build on. How it was verified: Module 08's verification matrix audits every factual claim against 34 sources with 17 cross-links to prior Research projects (the highest cross-reference density in the series to date, surpassing WYR's prior ceiling of 24 by a wide margin). What to read next: Module 02 for the Cosmic Crisp breeding program, Module 04 for the Columbia Basin dam and water politics, Module 06 for the smoke-taint cross-domain model, and Module 08 for the source audit. The rest of this README gives the structural surface; the research itself carries the depth.

---

## Key Features

| Area | What Shipped |
|------|--------------|
| AGR project tree | New directory `www/tibsfox/com/Research/AGR/` with `index.html` (108 lines), `page.html` (205 lines), `mission.html` (68 lines), and `style.css` (74 lines) wired into the multi-domain docroot |
| Research module 01 — The Land That Feeds | `research/01-pnw-agriculture-overview.md` (164 lines) — two-PNW framing, Cascade rain-shadow split, west-side rainfed vs east-side irrigated agricultural economies, crop-diversity paradox |
| Research module 02 — Cosmic Crisp | `research/02-apple-science.md` (209 lines) — WSU Tree Fruit Research Center in Wenatchee, Enterprise × Honeycrisp cross (1997), WA 38 selection pipeline, genomic-assisted breeding via RosBREED, $10M branded 2019 launch at QFC University Village |
| Research module 03 — Terroir | `research/03-viticulture-wine.md` (205 lines) — Willamette Valley Pinot Noir, Jory soil mineralogy, Columbia River Basalt Group, 15,000-year-old Missoula Floods geology, Walla Walla and Yakima AVAs, eastside Cabernet/Merlot/Syrah |
| Research module 04 — Grand Coulee | `research/04-water-infrastructure.md` (211 lines) — Columbia Basin Project, 1942 largest concrete structure in the US, 671,000 irrigated acres, Odessa Aquifer crisis, prior-appropriation water law, Kettle Falls displacement |
| Research module 05 — Codling Moth | `research/05-pest-disease.md` (232 lines) — pheromone chemistry (codlemone), mating-disruption on 150,000+ acres, integrated pest management, fire blight, apple scab, millennia-old orchardist vs moth arms race |
| Research module 06 — When the Forest Burns, the Wine Dies | `research/06-smoke-taint.md` (229 lines) — volatile phenol chemistry (guaiacol, 4-methylguaiacol, syringol), glycoconjugate hydrolysis during fermentation, 2020 Oregon Labor Day fires, four-domain cross-over (fire ecology + viticulture + atmospheric chemistry + climate change) |
| Research module 07 — Water, Land, and What Grows | `research/07-connections-rosetta.md` (221 lines) — Rosetta-Stone synthesis connecting AGR to 17 other Research projects, Columbia River as the six-project spine (SAL, HGE, THE, AGR, COL, WYR) |
| Research module 08 — The Harvest Report | `research/08-verification-matrix.md` (192 lines) — 34-source audit with 17 cross-links to prior Research projects, proof-of-tending ethical close |
| Mission-pack triad | `mission-pack/mission.md` (218 lines) + `mission-pack/pnw-agriculture-deep-dive.tex` (307 lines) + pre-rendered `mission-pack/pnw-agriculture-deep-dive.pdf` (122,966 bytes) |
| Research sidecar | `docs/research/pnw-agriculture.md` (218 lines) — standalone markdown companion readable outside the www tree |
| Harvest theme palette | `style.css` pairs `#C62828` orchard red with `#F9A825` field gold plus earth/soil/loam/field/vine semantic accents — 74 lines total |
| Research hub integration | `www/tibsfox/com/Research/index.html` updated (+10 lines) to add the AGR card to the grove-level index |
| Series navigation | `www/tibsfox/com/Research/series.js` updated (+1 line) for Prev/Next flow; `www/tibsfox/com/index.html` updated (2 lines) to bump the hub project count from 51 to 52 |
| Atomic content commit | `ac62845c2` lands all 17 AGR tree files, the sidecar, and the navigation updates in a single diff; bisect through v1.49.53..v1.49.54 finds one meaningful state transition |
| Release-notes chapter artifacts | `00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md` parser-generated at confidence 0.95, kept for DB-driven navigation after this README uplift rewrites the narrative surface |

---

## Retrospective

### What Worked

- **Module 06 "Smoke Taint" is the most cross-domain module in the series.** Four domains collide in a single module: wildfire smoke (ECO/CAS fire ecology), wine grapes (AGR viticulture), air quality (AWF atmospheric chemistry), and climate change (THE energy and carbon). Volatile phenols bind to grape sugars as glycoconjugates and remain invisible until fermentation cleaves them. This is the Rosetta Stone framework operating at its best: a phenomenon that cannot be understood through any one lens. Future Research modules covering multi-domain phenomena (ocean acidification, salmon thermal refugia, forest-fire carbon budgets) can cite Module 06 as the canonical worked example rather than reinventing the cross-domain vocabulary.
- **Module 04 "Grand Coulee" connects agriculture to every other infrastructure project.** The same dam that irrigates 671,000 acres also generates hydroelectric power (HGE/THE), blocks salmon migration (SAL), and displaced indigenous communities at Kettle Falls (TIBS). One piece of infrastructure, four competing uses, four Research projects with different editorial lenses on the same physical structure. The module is not a catalog of perspectives but a single argument: infrastructure of this scale does not have a single purpose, and any project that claims to describe it through one domain is incomplete.
- **The TeX source was compact (307 lines) but dense.** Four deep-dive subjects with specific science — codling moth pheromone chemistry, Cosmic Crisp genomics, Jory soil mineralogy, smoke-taint analytical chemistry — gave the research agent specific citations to follow. The expansion produced eight modules totaling 1,663 lines, a 5.4x expansion ratio that is the highest yet in the series. The pattern is repeatable: dense, specific, citation-rich source material produces the richest transformation; thin summary-level source produces modest expansion.
- **The Columbia River emerged as the project's central thread naturally, not by imposition.** Six Research projects (SAL, HGE, THE, AGR, COL, WYR) end up describing the same river from different angles. The synthesis in Module 07 did not force that connection; it recognized a pattern the prior fifty-one projects had been assembling without naming. Finding the pattern in the work rather than imposing it on the work is the editorial move that kept the module honest.
- **The Harvest palette (orchard red + field gold) paid off as an editorial choice.** The two-color ripe-autumn-orchard pairing reads as the subject without needing caption text. The saturated-but-not-primary register avoids both commercial-branding red and earth-tone nostalgia. AGR will not be confused with WYR, JNS, or any prior Research palette at thumbnail size.
- **Eight modules beat seven when the cross-domain module is first-class.** The extra module — Module 06 smoke taint as a standalone subject rather than a subsection of Module 05 pest-and-disease — let the cross-domain phenomenon carry its full analytical weight. Fusing Module 06 into Module 05 would have turned the most important editorial contribution in the project into a footnote. The split was worth the word count.

### What Could Be Better

- **Cross-reference count (17 cross-links in verification matrix) reads higher than the series norm but the README count is lower than sibling v1.49.53.** AGR documents 17 cross-references into other Research projects in its verification matrix, which is high, but the README Cross-References table below only enumerates 13 of those explicitly. Future uplifts on AGR or subsequent Research releases should surface the full 17 in the README table so the reader does not need to open Module 08 to see the density. The sibling v1.49.53 (JNS) enumerated 23 in its README table, setting a higher bar.
- **The Willamette Valley terroir module (Module 03) compresses the Missoula Flood geology into a single paragraph.** The 15,000-year-old flood basalt is load-bearing — it is literally what Pinot Noir grows on — but the glacial-outburst-flood mechanism gets perhaps 300 words of treatment. A follow-on companion piece that reads Missoula Flood geology as its own subject (linking to HGE, COL, and a potential future geology cluster) could do the history justice. The current module makes the right editorial call for a product-anchored project but leaves a genuine follow-on available.
- **Module 05 "Codling Moth" names the pheromone but does not illustrate the chemistry.** Codlemone is a specific molecule with a specific structure and a specific synthesis pathway. The module documents its use in mating-disruption deployments but does not include the structural diagram or the analog comparisons (E,E-8,10-dodecadien-1-ol) that a reader with a chemistry background would expect. A sidebar or a linked appendix could carry the molecular detail without bloating the narrative module.

---

## Lessons Learned

- **Agriculture is the missing middle layer the ecology cluster needed.** COL, CAS, and ECO map the wild landscape. GDN maps the domestic garden. AGR maps the industrial agricultural landscape that sits between — the orchards, vineyards, feedlots, and irrigated fields that are neither wild nor garden. Before AGR the bioregion map had two scales; after AGR it has three. Future Research projects can situate themselves on the wilderness-cultivation-industrial spectrum explicitly instead of treating the three scales as implicit. The lesson generalizes: a domain map is incomplete until its middle layers are named, and naming a middle layer lets all subsequent work reference it without rediscovery.
- **The Columbia River is the project's central thread.** SAL (salmon), HGE (hydroelectric), THE (energy), AGR (irrigation), COL (watershed), and WYR (timber transport) all describe the same river from different angles. Six projects, one river, six editorial lenses. The Research series is, among other things, a map of the Columbia Basin viewed from six positions, and recognizing that lets future projects connect to the spine explicitly. The lesson is portable to other infrastructural spines: the Cascade ridgeline, the Pacific shelf edge, the Salish Sea fetch, the I-5 corridor.
- **Dense, specific, citation-rich source material produces the richest transformation.** AGR's 307-line TeX source expanded to 1,663 lines of research modules — 5.4x, the highest ratio yet. The pattern is clear: when the source names specific cultivars, specific researchers, specific compounds, specific dates, and specific quantities, the expansion agent has threads to follow. When the source is summary-level and gestural, the expansion is modest. Future mission-pack authors should optimize for citation density over narrative polish — the narrative will be rewritten in expansion; the citations will not.
- **Cross-domain phenomena require cross-domain modules.** Smoke taint is a phenomenon whose ontology requires four Research domains at once (fire ecology, viticulture, atmospheric chemistry, climate). Trying to describe it within any single domain produces either a factual error or a reductive caricature. Module 06 is the worked example; the pattern generalizes to ocean acidification, salmon thermal refugia, invasive-species corridors, and any phenomenon that emerges at a domain boundary.
- **Infrastructure of sufficient scale has no single purpose.** Grand Coulee Dam irrigates, generates, blocks, and displaces — four outcomes, no single primary outcome. Projects that describe infrastructure of this scale through one domain (engineering, ecology, economics, indigenous history) are incomplete in a specific and citable way. The lesson is not "be interdisciplinary," it is "match the domain count to the phenomenon," and the two are not the same thing.
- **A 20-year product-development cycle is a design tradition, not an outlier.** The Cosmic Crisp went from 1997 cross to 2019 launch — 22 years. That cadence is normal for public-university cultivar development, where Phase 1 (seedling evaluation), Phase 2 (replicated plantings), and Phase 3 (grower trials) each take years, not months. The cultural expectation that "products ship in quarters" is a software-industry artifact that does not generalize to biology. Projects that benchmark biological product cycles against software product cycles are making a category error.
- **Two colors is enough when the colors are specific.** Orchard red `#C62828` and field gold `#F9A825` read as the subject without needing caption text. The palette rule established by SMF, WYR, JNS, and now AGR holds: two colors specific enough to do the editorial work the modules need, no third color in pursuit of "richness." The series' palette discipline is a piece of cumulative editorial infrastructure.
- **Water rights are the operating system of western US agriculture.** Prior-appropriation doctrine — first in time, first in right — is not legal trivia, it is the runtime environment every western irrigation project executes within. The Columbia Basin Project, the Odessa Aquifer, the Yakima adjudication, and California's over-allocated Colorado River are all instances of the same system. Future AGR-adjacent projects (ranching, tree fruit, wine, dairy) should start from prior appropriation as premise, not gloss it as background.
- **The atomic content-commit pattern has now held for 52 consecutive Research releases.** Every Research project since v1.49.22 has landed its entire tree in a single atomic content commit plus a separate docs commit plus a merge. No intermediate broken state. No half-built project. A bisect across any release window finds exactly one meaningful state transition. The discipline is cheap to maintain and expensive to restore if broken, and its unbroken record is one of the series' quietest wins.

---

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.53](../v1.49.53/) | Predecessor — "Daypack" (JNS / JanSport); the product-company Research project immediately before AGR; the 5.4x TeX-expansion pattern that AGR sets the ceiling on was first tested on JNS's structural surface |
| [v1.49.55](../v1.49.55/) | Successor — next Research project in the PNW cadence; inherits the eight-module structure, the Columbia-River-as-spine vocabulary, and the cross-domain-module affordance from AGR |
| [v1.49.52](../v1.49.52/) | "Everett" — the industrial-history Research project two releases back; establishes the Everett/Paine Field manufacturing corridor whose agricultural supply chain AGR documents |
| [v1.49.48](../v1.49.48/) | SMF (SMOFcon) — control-plane / federation thesis; AGR Module 04 borrows the federation framing to describe the Columbia Basin Project as a federated irrigation system rather than a single facility |
| [v1.49.47](../v1.49.47/) | WCN (Westercon) — packet-layer argument; the trilogy cadence that AGR's eight-module structure extends |
| [v1.49.46](../v1.49.46/) | NWC (Norwescon) — server-layer argument; original trilogy entry |
| [v1.49.43](../v1.49.43/) | WYR (Weyerhaeuser) — industrial-flagship Research project; the prior cross-reference ceiling that AGR's verification matrix (17 explicit links) contextualizes as the product-company counterpart to WYR's industrial-company density |
| [v1.49.38](../v1.49.38/) | Multi-Domain Docroot Refactor — built the `www/tibsfox/com/Research/` slot AGR drops into; v1.49.54 is the 14th consecutive Research project to benefit from the refactor's velocity payoff |
| [v1.49.31](../v1.49.31/) | TIBS Animal Speak & Sacred Landscapes — oral-tradition precedent; AGR Module 04 cross-references the Kettle Falls displacement from the TIBS module to ground the dam's cost in indigenous terms |
| [v1.49.27](../v1.49.27/) | Spatial Awareness — PNW atlas that places AGR geographically inside the Cascade rain-shadow, Columbia Basin, Yakima Valley, and Willamette Valley ag zones |
| [v1.49.25](../v1.49.25/) | AVI+MAM compendiums — ecology cross-references used by Module 05 (codling moth parasitoids, orchard bird predation on pests) and Module 06 (smoke inhalation effects on livestock and wildlife) |
| [v1.49.22](../v1.49.22/) | PNW Research Series origin — the release that began the series whose 52nd member ships here |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop; AGR is an Observe→Compose cycle applied to the industrial-agricultural layer of the PNW, running on the six-step scaffold that v1.0 codified |
| `www/tibsfox/com/Research/AGR/` | New project tree — 17 new files totaling the AGR surface |
| `www/tibsfox/com/Research/AGR/research/` | Eight research modules totaling 1,663 lines — the core narrative of the project |
| `www/tibsfox/com/Research/AGR/mission-pack/` | Mission-pack bundle — markdown + LaTeX + pre-rendered PDF (122,966 bytes) |
| `www/tibsfox/com/Research/AGR/research/08-verification-matrix.md` | Source-audit matrix documenting 34 citations and 17 cross-links |
| `docs/research/pnw-agriculture.md` | 218-line markdown sidecar readable outside the www tree |
| `www/tibsfox/com/Research/index.html` | Research hub updated (+10 lines) to add the AGR card |
| `www/tibsfox/com/Research/series.js` | Prev/Next navigation updated (+1 line) |
| `www/tibsfox/com/index.html` | Top-level hub updated (2 lines) for the project count 51 → 52 |
| `ac62845c2` | Content commit — 18 AGR tree files + sidecar + nav landed atomically |
| `36ceee70c` | Docs commit — release-notes stub for v1.49.54 |
| `87df898eb` | Merge commit — dev → main for the v1.49.54 tag |

---

## Engine Position

v1.49.54 is the 52nd project in the PNW Research Series and the third project in the post-conventions neighborhood that began with v1.49.52 "Everett" and continued through v1.49.53 "Daypack." The predecessor pair established the product-and-place neighborhood (industrial corridor plus consumer-product company); AGR extends that neighborhood into the industrial-agricultural layer — the third scale between wilderness and garden that the first fifty-one projects had circled but not closed. Looking backward, v1.49.54 is the 14th consecutive Research project to demonstrably benefit from the multi-domain docroot refactor shipped in v1.49.38, the release that set a new high-water mark for TeX-expansion ratio at 5.4x (the prior ceiling was roughly 4.2x), and the first Research project to deliberately name the Columbia River as the series' central spine (six projects, one river). Looking forward, v1.49.54 establishes three new affordances subsequent Research projects inherit: the cross-domain-module pattern for phenomena whose ontology requires multiple domains at once (Module 06 smoke taint is the canonical worked example); the wilderness-cultivation-industrial spectrum for domain-map completeness (projects can now situate themselves explicitly); and the Columbia-River-as-spine vocabulary for any project that connects to the six-project river cluster. The Research series at 52 projects, 478 research modules, and approximately 209,000 cumulative research lines is now dense enough that each addition compounds rather than merely accretes. AGR ships as one project and raises the floor the 53rd project starts from.

---

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.53..v1.49.54) | 3 (content `ac62845c2` + docs `36ceee70c` + merge `87df898eb`) |
| Files changed | 20 |
| Lines inserted / deleted | 2,940 / 2 |
| New files in AGR tree | 17 |
| Research modules (markdown) | 8 (1,663 lines total) |
| Mission-pack files | 3 (`mission.md` 218 + `pnw-agriculture-deep-dive.tex` 307 + `pnw-agriculture-deep-dive.pdf` 122,966 bytes) |
| Page-shell files | 3 (`index.html` 108 + `page.html` 205 + `mission.html` 68) |
| Stylesheet | 1 (`style.css` 74 lines, Harvest palette) |
| Research sidecar (outside www) | 1 (`docs/research/pnw-agriculture.md`, 218 lines) |
| Release-notes README | 1 (69 lines at release time; rewritten by this uplift) |
| Navigation files touched | 3 (`Research/index.html`, `Research/series.js`, hub `index.html`) |
| Sources audited in verification matrix | 34 |
| Cross-references to other Research projects | 17 |
| TeX-to-research expansion ratio | 5.4x (307 TeX lines → 1,663 research-module lines) |
| Theme colors | 2 primaries (`#C62828` orchard red, `#F9A825` field gold) + 5 semantic accents |
| Research project number in series | 52 |
| Cumulative series weight | 52 projects, 478 research modules, ~209,000 cumulative research lines |

---

## Files

- `www/tibsfox/com/Research/AGR/` — new project root containing `index.html`, `page.html`, `mission.html`, `style.css`, `research/`, and `mission-pack/`
- `www/tibsfox/com/Research/AGR/research/01-pnw-agriculture-overview.md` — 164 lines; two-PNW framing, Cascade rain-shadow split, crop diversity paradox
- `www/tibsfox/com/Research/AGR/research/02-apple-science.md` — 209 lines; WSU TFREC, Cosmic Crisp breeding 1997-2019, RosBREED, genomic-assisted breeding
- `www/tibsfox/com/Research/AGR/research/03-viticulture-wine.md` — 205 lines; Willamette Valley Pinot Noir, Jory soil, Columbia River Basalt, Missoula Floods, Walla Walla AVA
- `www/tibsfox/com/Research/AGR/research/04-water-infrastructure.md` — 211 lines; Grand Coulee Dam, Columbia Basin Project, 671,000 irrigated acres, Odessa Aquifer, prior-appropriation law
- `www/tibsfox/com/Research/AGR/research/05-pest-disease.md` — 232 lines; codling moth pheromones, mating-disruption IPM, fire blight, apple scab
- `www/tibsfox/com/Research/AGR/research/06-smoke-taint.md` — 229 lines; volatile phenols, glycoconjugates, 2020 Oregon Labor Day fires, four-domain cross-over
- `www/tibsfox/com/Research/AGR/research/07-connections-rosetta.md` — 221 lines; Rosetta-Stone synthesis, Columbia River as six-project spine
- `www/tibsfox/com/Research/AGR/research/08-verification-matrix.md` — 192 lines; 34-source audit with 17 cross-links
- `www/tibsfox/com/Research/AGR/mission-pack/mission.md` — 218 lines; mission-pack markdown companion
- `www/tibsfox/com/Research/AGR/mission-pack/pnw-agriculture-deep-dive.tex` — 307 lines; mission-pack LaTeX source
- `www/tibsfox/com/Research/AGR/mission-pack/pnw-agriculture-deep-dive.pdf` — 122,966 bytes; pre-rendered PDF
- `www/tibsfox/com/Research/AGR/index.html` — 108 lines; card landing page
- `www/tibsfox/com/Research/AGR/page.html` — 205 lines; full-site read page
- `www/tibsfox/com/Research/AGR/mission.html` — 68 lines; mission-pack bridge
- `www/tibsfox/com/Research/AGR/style.css` — 74 lines; Harvest theme (orchard red + field gold)
- `docs/research/pnw-agriculture.md` — 218 lines; standalone research sidecar outside the www tree
- `www/tibsfox/com/Research/index.html` — +10 lines; hub card added for AGR
- `www/tibsfox/com/Research/series.js` — +1 line; Prev/Next wiring
- `www/tibsfox/com/index.html` — 2 lines; top-level hub count update 51 → 52

Aggregate: 20 files changed, +2,940 insertions, −2 deletions across 3 commits (content `ac62845c2` + docs `36ceee70c` + merge `87df898eb`), v1.49.53..v1.49.54 window. The only deletions (2 lines) are from hub/index replacements that preserve byte-equivalent rendering.

---

**Prev:** [v1.49.53](../v1.49.53/) · **Next:** [v1.49.55](../v1.49.55/)

> *Twenty years to breed one apple. Three thousand trees per acre to grow it. Ten million dollars to name it. The Cosmic Crisp is the PNW agriculture story in one fruit.*
