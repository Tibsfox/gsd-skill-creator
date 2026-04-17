# v1.49.30 — Fur, Feathers & Animation Arts (Rabs Edition)

**Released:** 2026-03-09
**Scope:** Fur, Feathers & Animation Arts (FFA) research atlas — tenth project in the PNW Research Series, first cross-disciplinary craft atlas bridging animal biology, digital rendering, textile construction, fursuit fabrication, animation arts, and plush construction
**Branch:** dev → main
**Tag:** v1.49.30 (commit `3b8c53abd`)
**Commits:** v1.49.29..v1.49.30 (1 commit, head `3b8c53abd`)
**Files changed:** 19 (+7,744 / −9)
**Predecessor:** v1.49.29 — Retrospective-Driven Process Hardening
**Successor:** v1.49.31 — Release Integrity & publish-release.sh
**Classification:** feature — tenth research project in the PNW series, first craft-domain atlas organized by The Texture Stack
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Verification:** 12/12 success criteria PASS · 5/5 safety-critical tests PASS (SC-SRC, SC-NUM, SC-ADV, SC-IP, SC-SAF) · 20/20 core functionality PASS · 8/8 integration PASS · 124+ sources across Gold / Silver / Bronze tiers · LaTeX mission pack compiled to 195,919-byte (≈191 KB) PDF (31 pages) · series.js and PNW index.html refreshed for 10-project grid
**Dedication:** Rabs Edition — dedicated to the fursuiting, plushmaking, and stop-motion craft communities whose practitioner literature carries the weight of this atlas

## Summary

**The Texture Stack organized a six-domain craft atlas into a single legible collection.** FFA is the tenth project in the PNW Research Series and the first to bridge biology into craft, fabrication, and animation. Six research modules — biological foundations, digital rendering, textile craft, fursuit fabrication, animation arts, and plush construction — are stacked along a single through-line: nanoscale (keratin, melanosomes, Turing patterns) to material (faux fur, foam, clay, fabric) to assembly (suit, puppet, plush, animation rig). The stack is not decorative; it predicts where cross-domain bridges will exist before the bridges themselves are written. The release landed as a single atomic commit (`3b8c53abd`) spanning 19 files, 5,742 lines of research prose under `www/PNW/FFA/`, a 1,068-line LaTeX mission pack compiled to a 31-page PDF, a shared browser architecture inherited from the COL-through-BPS pattern, and a two-line update to `www/PNW/series.js` that registers FFA in the PNW navigation — all shipped in one Monday-morning session on 2026-03-09.

**Six modules carried 5,001 lines of domain research each grounded in peer-reviewed or practitioner-canonical sources.** `01-biological-foundations.md` (730 lines) covers fur and feather anatomy, melanin and pheomelanin pigment chemistry, structural color mechanisms (thin-film interference, photonic crystals), and Turing-pattern morphogens as the substrate that every other module references. `02-digital-rendering.md` (635 lines) documents PBR workflows with seven map types (base color, roughness, metallic, normal, height, ambient occlusion, emission), Blender's Hair BSDF with its melanin-driven color model, and Unreal Engine's Groom hair system. `03-textile-craft.md` (835 lines) catalogs faux fur fabric types, cutting and sewing techniques, and pile-extraction methods. `04-fursuit-fabrication.md` (1,196 lines) is the longest module and documents six head base types, foam carving geometry, tape-patterning as a 3D-to-2D unwrap, and body construction with attention to heat regulation, adhesion failure modes, and skin contact safety. `05-animation-arts.md` (832 lines) covers stop-motion in six sub-types, claymation material physics, traditional cel animation pipeline, and the modern smartphone workflow that has collapsed the barrier to entry. `06-plush-construction.md` (773 lines) covers pattern geometry, gussets and darts, jointing hardware, and the ASTM F963 / EN 71 safety standards for consumer plush.

**Cross-domain integration in `07-integration-synthesis.md` (327 lines) wired ten bridges that turned six modules into one atlas.** Cuticle condition maps directly to PBR roughness parameter values, so a groomed-fur render and a molted-pelt render differ by a measurable shader delta rather than an artistic judgment. Melanosome eumelanin-to-pheomelanin ratios feed the Hair BSDF melanin color source, giving a biological rather than colorist derivation for realistic fur color. Guard hair and underfur layers map onto faux fur pile selection at the material level. Structural color (as documented in the biology module) maps onto thin-film shader parameters in the render module. Pile direction — the same concept in biology as in fabric — maps onto fur flow maps in real-time rendering. Animal anatomy proportions inform foam sculpture. Armature engineering is shared between stop-motion puppets and plush skeletons. Tape patterning is the universal 3D-to-2D method that fursuit, plush, and costume all depend on. Color pattern biology informs multi-domain color placement across every craft domain. Locomotion biology drives animation motion reference. The bridges emerged from reading all six modules into a single context window before writing the synthesis, not from checking pairs after the fact.

**The 124+ source bibliography under a three-tier quality system proved every craft domain has substantial professional literature.** `08-bibliography.md` (198 lines) assigns every citation a Gold, Silver, or Bronze tier at citation time rather than reconciling tiers post-hoc. Gold sources include peer-reviewed journals covering keratin structure, melanosome biology, structural color physics, and Turing pattern morphogenesis; ASTM F963 and EN 71 toy safety standards for plush; and the Blender Manual plus Epic Games' Unreal Engine Groom documentation for digital rendering. Silver sources include professional organizations like The Furry Protocol and vendor technical documentation from faux fur mills. Bronze sources are practitioner references — Matrices fursuit tutorials, Dollmaker's Guide plush tutorials, stop-motion community guides — cited for technique lineage where no peer-reviewed equivalent exists. The point the tier system makes is that community-authored craft literature is legitimate evidence when it is attributed and tier-tagged, not when it is laundered as authority.

**The 33-test verification matrix closed the atomic commit with five safety-critical entries binary-pass.** `09-verification-matrix.md` (130 lines) ran 33 tests across three categories: 5 safety-critical (SC-SRC source quality, SC-NUM numerical attribution, SC-ADV no policy advocacy, SC-IP no copyrighted patterns reproduced, SC-SAF safety notices flagged for thermal, chemical, electrical hazards), 20 core functionality (per-module content depth, terminology reconciliation, source tier distribution, cross-reference density), and 8 integration (bridge count, module-to-module consistency, browser rendering, mission pack compilability, series.js registration, PNW index.html update, verification matrix completeness, bibliography coverage). Every test is binary (PASS or FAIL); none are weighted. All 33 passed before the commit was authored, so the atomic commit that shipped the atlas is also the commit that shipped the verification.

**The 1,068-line LaTeX mission pack compiled to a 31-page PDF and shipped alongside its source.** `www/PNW/FFA/mission-pack/mission.tex` (1,068 lines) is the LaTeX source for the FFA mission pack, `mission.pdf` (195,919 bytes, ≈191 KB) is the compiled artifact, and `mission-pack/index.html` (343 lines) is the browser-facing landing page. Shipping source alongside the compiled PDF means a downstream consumer can regenerate the artifact against a different LaTeX engine or port the content into a different typesetting system without reverse-engineering the compiled output. The mission pack is FFA's entry point for readers who want a condensed tour rather than the full atlas, and the LaTeX source is the durable artifact. The retrospective flagged that the PDF-as-binary pattern deserves a deterministic build recipe (engine version, font path manifest, compile flags) to make regeneration verifiable across environments — the same lesson BPS flagged one release earlier but that FFA did not yet pay down.

**Browser architecture inherited zero engineering changes from the COL-through-BPS pattern.** `www/PNW/FFA/index.html` (122 lines), `page.html` (207 lines), `mission.html` (34 lines), and `style.css` (203 lines) share the static HTML plus client-side markdown pattern already shipping in the nine earlier PNW projects. `www/PNW/series.js` picked up a 3-line diff to register FFA in the project navigation. `www/PNW/index.html` got a 31-line diff updating the project grid to ten cards and adding FFA's tag colors (chosen for the texture motif). The architectural footprint of shipping a tenth project into a pattern that scales is small — the diffable surface is 34 lines across two files, which is the whole integration cost.

**Single-session execution from Wave 2 forward confirmed the P-20 pattern for the fourth time.** Wave 0 (browser infrastructure: style.css, page.html, mission.html, glossary) and Wave 1 (six research modules: bio, render, textile, fursuit, anim, plush) had been staged via parallel agent dispatch in the prior session; Wave 2 (integration synthesis with the ten cross-domain bridges) and Wave 3 (bibliography with 124+ sources, verification matrix, index updates, mission pack compilation) completed in one session from synthesis through commit. The single-session practicality — that a full cross-disciplinary PNW project can complete from synthesis to commit in one context window when the module content and browser pattern are already staged — is the operational finding of this release. It is also the finding that v1.49.31's publish-release.sh script would operationalize: the release went out without release notes written first, and the subsequent release closed that gap.

**FFA marks the PNW series crossing from single-domain to cross-disciplinary.** The first nine PNW projects (COL through BPS) each organized a single subject — a habitat, a species group, a sensing modality — into a research module. FFA is the first to deliberately span disciplines that most readers would treat as unrelated: animal biology, shader programming, textile arts, foam carving, stop-motion cinematography, and soft-goods engineering. The Texture Stack is the organizing device that makes the span tractable. Future PNW projects that want to cross similarly broad domains now have a template: pick a single organizing stack, assign each rung to a self-contained module, and wire bridges only once all modules are readable in a single context.

## Key Features

| Area | What Shipped |
|------|--------------|
| Glossary | `www/PNW/FFA/research/00-glossary.md` (86 lines) — cross-domain terminology reconciliation (biology, rendering, textile, fursuit, animation, plush) |
| Biological foundations | `www/PNW/FFA/research/01-biological-foundations.md` (730 lines) — fur and feather anatomy, eumelanin and pheomelanin pigments, structural color, Turing-pattern morphogenesis |
| Digital rendering | `www/PNW/FFA/research/02-digital-rendering.md` (635 lines) — PBR workflows, 7 map types, Blender Hair BSDF, Unreal Engine Groom |
| Textile craft | `www/PNW/FFA/research/03-textile-craft.md` (835 lines) — faux fur fabric types, cutting and sewing, pile extraction |
| Fursuit fabrication | `www/PNW/FFA/research/04-fursuit-fabrication.md` (1,196 lines) — 6 head base types, foam carving, tape patterning, body construction |
| Animation arts | `www/PNW/FFA/research/05-animation-arts.md` (832 lines) — stop motion (6 sub-types), claymation, cel pipeline, smartphone workflow |
| Plush construction | `www/PNW/FFA/research/06-plush-construction.md` (773 lines) — pattern geometry, gussets, darts, jointing, ASTM F963 / EN 71 safety |
| Integration synthesis | `www/PNW/FFA/research/07-integration-synthesis.md` (327 lines) — 10 cross-domain bridges plus The Texture Stack through-line narrative |
| Bibliography | `www/PNW/FFA/research/08-bibliography.md` (198 lines) — 124+ sources across Gold / Silver / Bronze tiers |
| Verification matrix | `www/PNW/FFA/research/09-verification-matrix.md` (130 lines) — 33/33 tests PASS (5 SC + 20 core + 8 integration) |
| Browser pages | `www/PNW/FFA/index.html` (122) + `page.html` (207) + `mission.html` (34) + `style.css` (203) — static HTML + client-side markdown pattern shared with COL through BPS |
| Mission pack (LaTeX) | `www/PNW/FFA/mission-pack/mission.tex` (1,068 lines) — LaTeX source |
| Mission pack (PDF) | `www/PNW/FFA/mission-pack/mission.pdf` (195,919 bytes ≈ 191 KB, 31 pages) — compiled artifact |
| Mission pack index | `www/PNW/FFA/mission-pack/index.html` (343 lines) — browser-facing landing page |
| PNW series registration | `www/PNW/series.js` (+3 lines) — FFA registered in series navigation |
| PNW master index | `www/PNW/index.html` (+22 / −9) — FFA card added, project grid grows 9 → 10 |

## Retrospective

### What Worked

- **Reading all six modules into context before writing synthesis produced genuinely cross-referential integration.** The ten bridges in `07-integration-synthesis.md` emerged from understanding all six domains simultaneously, not from checking pairs after the fact. Single-context synthesis is the reason the bridges feel like observations rather than engineering.
- **Wave structure (0-1-2-3) with clear dependency gates prevented premature assembly.** Biology had to be complete before rendering could reference melanosomes, rendering had to be complete before textile could reference pile direction, and so on. The dependency gating forced the stack to build bottom-up rather than collapsing into a circular set of partial references.
- **The mission pack PDF (31 pages) provided precise test criteria that made the verification matrix straightforward to write.** The PDF's table of contents, figure list, and cross-reference index became the source-of-truth for what the verification matrix had to cover. Writing tests against a compiled artifact is tighter than writing tests against a loose collection of markdown files.
- **Single-session execution from Wave 2 through Wave 3 maintained full context continuity.** No handoff loss between synthesis and verification, no re-reading of modules to refresh memory, no reconciliation pass to catch contradictions. The P-20 pattern (single-session full-mission execution) held for the fourth consecutive PNW release.
- **The three-tier source system (Gold / Silver / Bronze) made the 124-source bibliography auditable at a glance.** Every citation carries its tier at citation time, so a reader can trace any quantitative claim to a declared-reliability source without reverse-engineering citation trust.
- **The Texture Stack as an organizing device predicted bridges before they were written.** Nanoscale → material → assembly is a stack every craft domain participates in, so cross-domain bridges appear at the rungs rather than at arbitrary intersections. The stack is a search index for bridges.

### What Could Be Better

- **Wave 1 was executed in a prior session with agent dispatch.** Handoff state in STATE.md was sufficient to resume, but could have included more detail on per-module content quality for the synthesizer. The synthesizer had to validate module depth before writing the bridges, which adds a reconciliation pass that better handoff metadata would have avoided.
- **The PNW index.html update was manual.** A script to regenerate project-grid stats (project count, total research files, total content size) from the filesystem would prevent drift between the master index and the actual project directories. This is the same debt the BPS retrospective flagged one release earlier, and that FFA did not yet pay down.
- **Release notes were not written before the GitHub release was created.** The release went out with a partial body. This is the gap that produced the `publish-release.sh` script in v1.49.31, which gates release publication on a complete release notes README. The scorer regression caught by this uplift is a downstream symptom of the same gap.
- **The mission pack PDF shipped as a 195,919-byte binary without a deterministic build recipe.** Any regeneration against a future LaTeX engine produces a new binary without semantic-diff visibility. Pairing the PDF with a pinned LaTeX engine version, font path manifest, and compile flags would make regeneration verifiable. BPS flagged this same debt in its retrospective; FFA inherited and reproduced it.
- **Some lessons entered the tracker as `⚙ rule-based` and were reclassified later by the LLM tiebreaker (`applied` in v1.49.32).** A landing-time tiebreaker pass would have reduced follow-up churn and kept the `needs review` flag count lower.

## Lessons Learned

- **The Texture Stack is a genuinely useful organizing principle.** Nanoscale (keratin structure, melanosomes, Turing patterns) → material (faux fur, foam, clay, fabric) → assembly (suit, puppet, plush, animation rig) predicted where cross-domain bridges would exist before looking for them. The structure revealed the connections; the bridges were not invented, they were observed. Future cross-disciplinary PNW projects should adopt this pattern: pick a single organizing stack, assign each rung to a self-contained module, and wire bridges only once all modules are legible in a single context window.
- **Each craft domain has substantial professional literature.** 124+ sources across six domains confirms fursuiting, plushmaking, and stop-motion have peer-reviewed research and canonical practitioner references — not just community wikis and forum posts. The three-tier source quality system (Gold / Silver / Bronze) made the literature visible and auditable; without the tier system, community authority and peer-reviewed authority collapse into the same citation and legitimacy gets laundered.
- **Physical fabrication documentation is more complex than digital.** Fursuit fabrication (1,196 lines) was the largest module because physical materials have more failure modes than shader parameters: heat regulation, adhesive bond strength, structural integrity under movement, skin contact safety, allergen exposure, fire rating. A render that fails produces an ugly image; a fursuit that fails produces a hospital visit. The documentation has to account for the consequence surface.
- **Cross-domain synthesis requires whole-context reading, not pairwise checking.** The ten bridges in `07-integration-synthesis.md` were not found by cross-referencing two modules at a time; they were found by reading all six modules into a single context window and then scanning for repeated patterns across rungs of The Texture Stack. Pairwise synthesis finds obvious bridges; whole-context synthesis finds the non-obvious ones (tape patterning as a universal 3D-to-2D method appears in fursuit, plush, and costume — a pairwise check of any two misses the universality).
- **Master index updates belong in the atomic commit that ships the project.** The commit that added FFA also updated `www/PNW/series.js` (+3 lines) and `www/PNW/index.html` (+22/−9). Shipping the index updates in the same atomic commit prevents the cross-reference debt that compounded through v1.49.25 → v1.49.26. BPS identified this lesson; FFA validated it in practice.
- **Wave dependency gates prevent premature assembly.** Wave 0 (browser infra) → Wave 1 (six research modules) → Wave 2 (integration synthesis) → Wave 3 (bibliography + verification + index) enforces a bottom-up build. A module that references structural color cannot land before the biology module that defines it; a synthesis chapter cannot land before the modules it synthesizes. The dependency structure is the schedule; the schedule is not imposed on it.
- **Three-tier source classification reduces citation anxiety.** Gold (peer-reviewed or standards-body), Silver (professional organizations, vendor technical docs), Bronze (practitioner references, community canonical sources) lets the author cite community literature honestly without laundering it as peer-reviewed authority. The tier label is the honesty surface. Future missions with mixed source quality should adopt this pattern verbatim.
- **Single-session full-mission execution confirms the P-20 pattern for the fourth consecutive PNW release.** BRC, AVI+MAM, BPS, and now FFA all landed their final waves in a single session. The practicality finding is that a full PNW project, staged to Wave 2, can complete Wave 2 through Wave 3 plus commit in one context window. The limit of the pattern has not been tested yet — FFA's 5,742 research lines is larger than BPS's 16,655 prose lines in the atlas sense, but both fit. The v1.49.31+ window will eventually find the scale where single-session execution fails; it has not failed yet.
- **Release notes deserve a publish gate, not a post-hoc fix.** FFA's release went out with a partial README body because the GitHub release was created before the release notes were written. This is what produced `publish-release.sh` in v1.49.31 as a gate. The lesson generalizes: any artifact that ships externally before its README is written is a release-notes debt, and the debt compounds because the reader's first impression is formed by the partial body. Gate externally-visible publication on README completeness.
- **Binary artifacts deserve a deterministic build recipe.** `mission.pdf` shipped as 195,919 bytes alongside its 1,068-line `mission.tex` source. The source is diffable; the PDF is not. Pairing the source with a pinned LaTeX engine version, font path manifest, and compile flags would make regeneration verifiable. Without the recipe, "compiled on my machine" is the ceiling. BPS flagged this one release earlier; FFA reproduced the debt; the fix stays open.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.29](../v1.49.29/README.md) | Predecessor — Retrospective-Driven Process Hardening; fed the retrospective-discipline pattern FFA inherited |
| [v1.49.31](../v1.49.31/README.md) | Successor — Release Integrity; produced `publish-release.sh` to close the "release went out before README" gap FFA surfaced |
| [v1.49.32](../v1.49.32/README.md) | Applied two FFA lessons (handoff visibility, release notes timing) per the LLM tiebreaker reclassification |
| [v1.49.26](../v1.49.26/README.md) | Sibling PNW atlas (BPS, Bio-Physics Sensing Systems) — same single-atomic-commit + verification-matrix shape; BPS flagged the PDF-deterministic-build debt FFA inherited |
| [v1.49.25](../v1.49.25/README.md) | Prior PNW release (AVI + MAM) — introduced the master-index catch-up debt BPS paid down and FFA avoided repeating |
| [v1.49.21](../v1.49.21/README.md) | Sibling uplift exemplar — same v1.49.x feature-release shape; ITM pipeline's types-first discipline parallels FFA's stack-first discipline |
| [v1.49.17](../v1.49.17/README.md) | Types-first landing pattern antecedent — contracts-before-content applied to cartridge format, same shape as FFA's stack-before-modules |
| [v1.49.12](../v1.49.12/README.md) | Heritage-skills-pack pattern — pack-shape content analogous to FFA's mission pack LaTeX + PDF + browser-index triad |
| [v1.49.10](../v1.49.10/README.md) | Flat-atoms architecture — upstream pattern for FFA's one-module-per-domain layout |
| [v1.49.0](../v1.49.0/README.md) | Parent mega-release — v1.49.x line and GSD-OS desktop surface where FFA lives |
| [v1.27](../v1.27/README.md) | Foundational Knowledge Packs — pack template FFA's mission pack inherits |
| [v1.0](../v1.0/README.md) | Foundation — 6-step adaptive loop; FFA extends the Observe step with cross-disciplinary craft research |
| `www/PNW/FFA/research/07-integration-synthesis.md` | 10 cross-domain bridges wiring biology, rendering, textile, fursuit, animation, and plush into one atlas |
| `www/PNW/FFA/research/08-bibliography.md` | 124+ sources organized by Gold / Silver / Bronze tiers |
| `www/PNW/FFA/research/09-verification-matrix.md` | 33/33 tests PASS (5 safety-critical + 20 core + 8 integration) |
| `www/PNW/FFA/mission-pack/mission.tex` | 1,068-line LaTeX source for the FFA mission pack |
| `www/PNW/FFA/mission-pack/mission.pdf` | 195,919-byte (≈191 KB) compiled mission pack (31 pages) |
| `docs/release-notes/v1.49.30/chapter/03-retrospective.md` | Retrospective chapter — What Worked / What Could Be Better |
| `docs/release-notes/v1.49.30/chapter/04-lessons.md` | 6 lessons extracted with tracker status (applied / investigate / needs review) |
| ASTM F963 / EN 71 | International toy safety standards cited by `06-plush-construction.md` for jointing and materials safety |
| Blender Hair BSDF (Blender Manual) | Cited by `02-digital-rendering.md` as Gold-tier source for PBR hair rendering |
| Unreal Engine Groom (Epic Games) | Cited by `02-digital-rendering.md` as Gold-tier source for real-time hair rendering |

## Engine Position

v1.49.30 is the tenth project in the PNW Research Series and the first craft-domain atlas in that series. It sits between v1.49.29 (Retrospective-Driven Process Hardening) and v1.49.31 (Release Integrity), both of which are process releases — v1.49.30 is the content release they flank. In the PNW series arc, FFA is the crossover from single-domain research (COL through BPS) to cross-disciplinary synthesis. ECO established the taxonomy, AVI and MAM populated the species rosters, BPS mapped the sensing physics, and FFA is the first project to bridge biology out of pure research into craft, fabrication, and animation — the human-made counterparts to the biological systems the earlier projects documented. In the broader v1.49.x line, FFA is a mid-size feature release: 19 files and 7,744 insertions place it smaller by volume than BPS (29 files / 18,371 insertions) but wider by discipline span, because every line lands under `www/PNW/FFA/` but crosses six craft domains instead of one physics-first atlas. Looking forward, FFA becomes the reference implementation for stack-organized cross-disciplinary research atlases: any future PNW or adjacent project that wants to bridge disparate domains inherits The Texture Stack pattern (single organizing stack, self-contained rung modules, whole-context synthesis), the Gold / Silver / Bronze source tier system, and the 5 safety-critical plus 20 core plus 8 integration test grid that FFA put into practice.

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.29..v1.49.30) | 1 (`3b8c53abd`) |
| Files changed | 19 |
| Lines inserted / deleted | 7,744 / 9 |
| Research files | 10 (glossary + 9 numbered modules) |
| Research prose lines | 5,742 |
| Craft domains documented | 6 (biology, rendering, textile, fursuit, animation, plush) |
| Cross-domain bridges | 10 |
| Sources cited | 124+ across Gold / Silver / Bronze tiers |
| Verification tests | 33/33 PASS (5 SC + 20 core + 8 integration) |
| Safety-critical tests | 5/5 PASS (SC-SRC, SC-NUM, SC-ADV, SC-IP, SC-SAF) |
| Success criteria | 12/12 PASS |
| Mission pack | 1 (LaTeX 1,068 lines + PDF 195,919 bytes / 31 pages + browser index 343 lines) |
| PNW series projects (before → after) | 9 → 10 |
| Series registration diff | `series.js` +3 lines; `index.html` +22/−9 |
| Single atomic commit? | Yes (`3b8c53abd`) |
| Session count | Wave 0-1 prior session (agent dispatch) + Waves 2-3 single-session |

## Files

- `www/PNW/FFA/research/` — 10 research files totalling 5,742 lines: `00-glossary.md` (86), `01-biological-foundations.md` (730), `02-digital-rendering.md` (635), `03-textile-craft.md` (835), `04-fursuit-fabrication.md` (1,196), `05-animation-arts.md` (832), `06-plush-construction.md` (773), `07-integration-synthesis.md` (327), `08-bibliography.md` (198), `09-verification-matrix.md` (130)
- `www/PNW/FFA/index.html` (122 lines) + `page.html` (207) + `mission.html` (34) + `style.css` (203) — static HTML + client-side markdown pattern shared with COL through BPS
- `www/PNW/FFA/mission-pack/mission.tex` (1,068 lines) — LaTeX source for the mission pack
- `www/PNW/FFA/mission-pack/mission.pdf` (195,919 bytes ≈ 191 KB, 31 pages) — compiled mission pack binary
- `www/PNW/FFA/mission-pack/index.html` (343 lines) — browser-facing mission pack landing page
- `www/PNW/series.js` (+3 lines) — FFA registered in PNW navigation
- `www/PNW/index.html` (+22 / −9) — FFA card added to the 10-project grid
- `docs/release-notes/v1.49.30/chapter/00-summary.md` — auto-generated parse of this README (Prev/Next navigation to v1.49.29 / v1.49.31)
- `docs/release-notes/v1.49.30/chapter/03-retrospective.md` — retrospective chapter with What Worked / What Could Be Better
- `docs/release-notes/v1.49.30/chapter/04-lessons.md` — 6 lessons extracted with tracker status (applied / investigate / needs review)
- `docs/release-notes/v1.49.30/chapter/99-context.md` — release context chapter

Aggregate: 19 files changed, 7,744 insertions, 9 deletions, 1 commit (`3b8c53abd`), v1.49.29..v1.49.30 window.
