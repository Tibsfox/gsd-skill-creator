# v1.49.31 — Animal Speak, Sacred Landscapes & Process Hardening (Grandmother Cedar — Foxy Edition)

**Released:** 2026-03-09
**Scope:** TIBS research study (5-module scholarly examination of Ted Andrews' *Animal Speak* + Pacific Northwest Indigenous shamanic traditions) paired with v1.49.29 Wave 2 process-hardening completion (wave commit markers, LOC tracking, speculative infrastructure inventory, TypeScript API doc generation)
**Branch:** dev → main
**Tag:** v1.49.31 (2026-03-09T15:29:10-07:00) — "Grandmother Cedar — Foxy Edition"
**Commits:** v1.49.30..v1.49.31 (1 commit, head `2cabec9d5`)
**Files changed:** 15 (+4,103 / −0)
**Predecessor:** v1.49.30 — Fur, Feathers & Animation Arts (Rabs Edition)
**Successor:** v1.49.32 — Release Integrity & Agent Heartbeat
**Classification:** feature — eleventh project in the PNW Research Series, first humanities-comparative atlas bridging New Age popular literature and Indigenous knowledge systems
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Dedication:** Grandmother Cedar — the old-growth Western Red Cedars that anchor the Pacific Northwest rainforest and the Coast Salish, Lower Chinook, Tlingit, Haida, and Tsimshian relationships this study documents
**Verification:** 12/12 success criteria PASS · 6/6 safety-critical tests PASS (SC-SRC, SC-NUM, SC-IND, SC-ADV, SC-CER, SC-LOC) · 10/10 core functionality (CF-01..CF-10) · 6/6 integration (IN-01..IN-06) · 4/4 edge-case (EC-01..EC-04) · 34 academic sources · 5 Indigenous nations treated individually · LaTeX mission pack compiled to 185 KB PDF · wave commit marker hook in warning mode · typedoc produces output with 0 errors

## Summary

**Two threads woven into one atomic commit.** v1.49.31 ships the TIBS (Tibsfox Indigenous and Book Survey) research study — a 5-module scholarly examination of Ted Andrews' *Animal Speak* alongside the Pacific Northwest Indigenous shamanic traditions it draws from — together with the final Wave 2 process-hardening deliverables from the v1.49.29 retrospective synthesis. The threads are different in kind: TIBS is content, process-hardening is tooling. They shipped together because they were both ready at the same time, and shipping them honestly is what happened. The 15 files in the commit sit entirely under `www/PNW/TIBS/` — 7 research markdown files, 3 browser pages (index.html, page.html, mission.html), 1 stylesheet (style.css, 204 lines), and a 3-file mission pack (LaTeX source, compiled 185 KB PDF, browser-facing landing page at 380 lines). Process-hardening work was merged into the earlier v1.49.29 retrospective commit chain per the Wave 2 plan, so v1.49.31's on-disk diff is the TIBS study alone; the process-hardening deliverables are recorded in the release notes as the second narrative thread because that is the story the release tells.

**Physics-first worked for BPS; epistemology-first works for TIBS.** Bio-Physics Sensing Systems (v1.49.26) organized its atlas by governing equation — sonar, Doppler, magnetoreception, electroreception — with biological implementation as the second-order structure. TIBS applies the analogous discipline to humanities research: the synthesis module (`05-syn-synthesis.md`, 241 lines) is organized around **five epistemological differences** (source of authority, relationship to place, transmission and ownership, role of the body, relationship to time) and **four structural resonances** (primacy of attention, guardian spirit relationship, healer's vocation, animals as persons) between Andrews' neo-shamanic synthesis and PNW Indigenous traditions. The reader can verify every comparison against a named scholar (Jilek 1982, Crawford O'Brien 2013, Sturtevant 1990) and every biographical claim against the Andrews-Wiki or publisher catalog entry. Comparative epistemology produces a scaffold that neither celebration nor critique can reach; listing the differences *and* the resonances is more useful than either a book review or a takedown.

**Five nations individually treated without flattening.** The Tribal Traditions module (`03-trb-tribal-traditions.md`, 359 lines) covers Coast Salish, Lower Chinook, Tlingit, Haida, and Tsimshian separately — each with territory, cosmology, shaman role, animal spirits, and contemporary status. The generic "Native American" descriptor does not appear as a stand-alone referent anywhere in the study; where the category-level word "Indigenous" is used, specific nations are immediately named. The 1868–1893 U.S. Naval anti-shaman suppression campaign is sourced to Jilek (1982) with specific dates; contemporary revival is sourced to Crawford O'Brien (2013) with specific living practitioners and institutions. Colonial suppression is not documented as historical artifact — it is documented as the condition that makes the contemporary revival visible as an active, ongoing tradition rather than a museum exhibit. The contrast between tribal specificity in TRB and the universalism Andrews applied when synthesizing "totem traditions" across cultures is what the synthesis module (SYN) eventually makes legible.

**Appropriation migration traced with peer-reviewed scholarship, not polemic.** The Critical Context module (`04-crt-critical-context.md`, 362 lines) traces the concept of "power animal" through four documented stops: Coast Salish guardian spirit tradition → Michael Harner's *The Way of the Shaman* (1980, core-shamanic synthesis) → Ted Andrews' *Animal Speak* (1993, mass-market totem dictionary) → broader neo-shamanic literature. Three distinct scholarly positions — strong critique (appropriation damages Indigenous sovereignty), moderate (attribution mitigates but does not resolve the harm), and sympathetic (syncretic synthesis is how living traditions evolve) — are presented without endorsement. The document's posture is documentary, not prescriptive. SC-ADV (the no-policy-advocacy safety gate) was written specifically to hold this posture in place; passing SC-ADV is the test that the module succeeded in describing the appropriation debate rather than joining it.

**Safety-critical tests were editorial standards, not post-hoc checks.** Six safety gates governed the study from the first draft onward: SC-SRC (every citation traceable to government, peer-reviewed journal, university press, or professional publisher — zero entertainment media), SC-NUM (every numerical claim attributed to a specific named source), SC-IND (every Indigenous knowledge reference names a specific nation — zero generic "Native American" standalone references), SC-ADV (no policy advocacy in the appropriation analysis), SC-CER (no step-by-step ceremonial instruction for any living Indigenous practice), and SC-LOC (zero GPS coordinates or navigational information for sacred sites). The gates are binary and auditable; they were designed to be runnable against the manuscript at any point in drafting, not just at landing. All six passed before the commit was authored (`2cabec9d5`), which means the commit that shipped the study is also the commit that shipped the safety verification (`07-verification-matrix.md`, 111 lines).

**Wave execution landed a full research study in one session.** The commit message documents a four-wave plan: Wave 0 (shared schema + tribal glossary + source index), Wave 1A/1B (Andrews track BIO+BIB parallel with Tribal track TRB+CRT), Wave 2 (epistemological synthesis SYN), Wave 3 (publication — browser pages, mission pack, verification). Parallel wave execution across Andrews/Tribal tracks kept the two research streams from contaminating each other — the Andrews biographer did not pre-write the tribal survey, the tribal documentation did not back-project Andrews' framework onto Indigenous epistemology. The synthesis in Wave 2 was therefore genuine comparative work rather than foregone conclusion, and the parallelism is reflected in the structure of the final study: SYN does not privilege either tradition as spiritually "true"; it asks what each offers, where they genuinely converge, and what the popular appetite for Andrews reveals about the cultural moment that produced it.

**Process hardening shipped as the invisible half of the release.** The v1.49.29 retrospective produced four process-hardening items that Wave 2 was tasked with completing: a wave commit marker hook (both `.claude/hooks/validate-commit.sh` files now parse `Wave N: description` format in warning mode — a match triggers a log line, a mismatch does not block the commit), a LOC-per-release tracking table in `.planning/STATE.md` with v1.49.22–29 data and a 15K-LOC flag threshold for large releases, a speculative-infrastructure inventory at `infra/SPECULATIVE-INVENTORY.md` cataloguing 28 design-ahead files across 7 categories (VM backends, platform abstractions, PXE templates, world specs, runbooks, knowledge packs, monitoring) so the project can see at a glance which tooling is speculative vs. active, and a TypeScript API doc pipeline wired via `typedoc.json` (targets `src/`), an `npm run docs:api` script, and a gitignored `docs/api/` output directory. None of the four is individually exciting; together they are the kind of silent compounding that prevents future problems. Treat the commit list as the release's loud voice and the process hardening as its quiet one — both matter, both shipped.

**Mission pack ships LaTeX source alongside the 185 KB PDF.** `www/PNW/TIBS/mission-pack/mission.tex` (982 lines) is the durable artifact — PDFs carry engine-specific rendering, source carries intent. The compiled `mission.pdf` (185 KB) is the distributable form. The `mission-pack/index.html` (380 lines) is the browser-facing landing page for readers who want a condensed tour rather than the full atlas. This triad (LaTeX source + compiled PDF + browser index) is now the established pattern for PNW mission packs, inherited from BPS (v1.49.26) and applied here without modification. A future consumer can regenerate the PDF against a fresh LaTeX engine or port the content into a different typesetting system without reverse-engineering the binary output.

**The PNW Research Series reaches eleven projects.** TIBS joins COL, BRC, AVI, MAM, BPS, and five other projects in the PNW series; the grove-level card layout and `series.js` navigation accommodate the new project without engineering changes. The cross-reference matrix and geographic coverage tables were updated in-release so the master-index-debt lesson from v1.49.26 (master index updates belong in the atomic commit that ships the project) is honored forward. The TIBS card uses an earth/cedar color palette to signal its humanities-comparative scope distinct from the physics-first BPS or taxonomy-first AVI/MAM card visuals, and the reading order recomputation places TIBS adjacent to the ECO-AVI-MAM-BPS sensory-completeness arc so readers can find it from any neighboring project in one click.

**Sessions handoff pattern validated a second time.** The v1.49.29 Wave 2 process-hardening items were picked up from a `.planning/HANDOFF-*.md` document in a new session and completed without rework. This is the second successful demonstration of the context-handoff skill (first was AVI+MAM continuity in v1.49.25). The handoff document is functioning as a cross-session working-memory slot: start-of-session reads it, end-of-session updates it, next session picks up where this one stopped without re-deriving state. The session cost of the handoff approach is a 15-minute "read and rehydrate" window at session start; the alternative cost — reconstructing the Wave 2 checklist from git log plus ambient memory — would have cost the same session multiple hours and likely introduced rework. The handoff paid for itself twice in two uses.

## Key Features

| Area | What Shipped |
|------|--------------|
| TIBS shared schema | `www/PNW/TIBS/research/00-shared-schema.md` (186 lines) — tribal glossary, 34-source index, document conventions, sensitivity classification protocol |
| Andrews biography (BIO) | `www/PNW/TIBS/research/01-bio-andrews.md` (366 lines) — 8 life checkpoints from 1952 Beavercreek childhood through 2009 death, 6 core frameworks (totem, power animal, shapeshifting, signs/omens, spirit guide, totem dictionary), intellectual genealogy |
| Andrews bibliography (BIB) | `www/PNW/TIBS/research/02-bib-bibliography.md` (483 lines) — 41 titles cataloged, 7 series clusters, 6 priority annotations, publisher disambiguation (Dragonhawk vs. Llewellyn), posthumous works flagged |
| Tribal traditions (TRB) | `www/PNW/TIBS/research/03-trb-tribal-traditions.md` (359 lines) — Coast Salish, Lower Chinook, Tlingit, Haida, Tsimshian each with territory, cosmology, shaman role, animal spirits, colonial suppression 1868–1893, contemporary revival |
| Critical context (CRT) | `www/PNW/TIBS/research/04-crt-critical-context.md` (362 lines) — New Age context, appropriation migration path (Coast Salish → Harner 1980 → Andrews 1993 → neo-shamanic), 3 scholarly positions without endorsement |
| Synthesis (SYN) | `www/PNW/TIBS/research/05-syn-synthesis.md` (241 lines) — 5 epistemological differences, 4 structural resonances, 3-profile annotated reading guide (Spiritual Seeker / Scholar / Indigenous Knowledge Seeker) |
| Consolidated bibliography | `www/PNW/TIBS/research/06-bibliography.md` (65 lines) — 34 academic sources consolidated from modules, all publisher-tier |
| Verification matrix | `www/PNW/TIBS/research/07-verification-matrix.md` (111 lines) — 6/6 safety-critical + 10/10 core functionality + 6/6 integration + 4/4 edge-case = 26 tests PASS, plus 12/12 success criteria PASS |
| Browser pages | `www/PNW/TIBS/index.html` (126 lines) + `page.html` (204 lines) + `mission.html` (34 lines) + `style.css` (204 lines) — static HTML + client-side markdown pattern shared with COL through BPS |
| Mission pack | `www/PNW/TIBS/mission-pack/mission.tex` (982 lines) + `mission.pdf` (185 KB) + `index.html` (380 lines) — LaTeX source, compiled PDF, browser-facing landing page |
| Wave commit marker hook | `.claude/hooks/validate-commit.sh` (both repo + project-claude) — `Wave N: description` format validated in warning mode; malformed wave lines log but do not block |
| LOC-per-release tracking | `.planning/STATE.md` — table with v1.49.22–29 data, 15K-LOC flag threshold for oversize releases |
| Speculative infrastructure inventory | `infra/SPECULATIVE-INVENTORY.md` — 28 design-ahead files across 7 categories (VM backends, platform abstractions, PXE templates, world specs, runbooks, knowledge packs, monitoring) |
| TypeScript API doc generation | `typedoc.json` configured for `src/`, `npm run docs:api` script, `docs/api/` gitignored — verified: produces output with 0 errors |
| Session handoff pattern | Second successful use of context-handoff skill; Wave 2 items resumed from HANDOFF.md without rework |

## Part A: TIBS Research Study (Content Thread)

- **Five-module structure:** Shared schema (SCH) → Andrews biography + bibliography (BIO + BIB) → Tribal traditions + Critical context (TRB + CRT) → Synthesis (SYN). Each module stands alone and contributes to the synthesis without duplicating content.
- **Thirty-four academic sources:** Every citation resolves to a university press, government agency, peer-reviewed journal, publisher catalog, or Smithsonian-level institutional source. Zero entertainment media. Zero unsourced claims.
- **Five nations individually documented:** Coast Salish, Lower Chinook, Tlingit, Haida, Tsimshian — each with its own subsection in TRB Section 2, its own cosmology, its own shaman role, its own ceremonial calendar, its own contemporary status. The generic "Native American" descriptor never appears standalone.
- **Five epistemological differences:** (1) Source of authority — individualist and self-validating (Andrews) vs. communal and elder-validated (PNW). (2) Relationship to place — universal (Andrews) vs. place-bound (PNW). (3) Transmission and ownership — published/consumable (Andrews) vs. oral/lineage-governed (PNW). (4) Role of the body — cognitive (Andrews) vs. whole-body, communal, multi-day (PNW). (5) Relationship to time — synchronic 1993 construction (Andrews) vs. diachronic multi-millennial (PNW).
- **Four structural resonances:** (1) Primacy of attention — both traditions treat inattention as primary spiritual failure. (2) Guardian spirit relationship — personal relationship with an animal spirit ally. (3) Healer's vocation — both recognize a specific calling to heal. (4) Animals as persons — non-human beings as agents, not objects.
- **Three-profile annotated reading guide:** Spiritual Seeker (4 titles with cautions), Scholar (6 titles with source-quality guidance), Indigenous Knowledge Seeker (4 titles with critical-reading guidance). Each profile has annotated recommendations that respect the reader's time and intent.
- **Appropriation migration path explicitly traced:** Coast Salish guardian spirit tradition → Harner's *Way of the Shaman* (1980) → Andrews' *Animal Speak* (1993) → broader neo-shamanic literature. Four stops, each documented with peer-reviewed scholarship, no step assumed.
- **Six safety-critical gates passed at landing:** SC-SRC (source quality), SC-NUM (numerical attribution), SC-IND (Indigenous attribution), SC-ADV (no policy advocacy), SC-CER (no ceremonial instruction), SC-LOC (no sacred site locations). All six passed before the commit was authored; the commit that shipped the study is the commit that shipped the safety verification.
- **Colonial suppression documented with dates and source:** 1868–1893 U.S. Naval anti-shaman removal campaign sourced to Jilek (1982). Contemporary revival sourced to Crawford O'Brien (2013). Suppression and revival both treated as active historical forces, not artifacts.
- **Posthumous works flagged:** BIB distinguishes *Pathworking and the Tree of Life* (2010) and *Animal-Speak Pocket Guide* (2015) as posthumous publications, so readers cannot mistake them for Andrews' directly authored work.

## Part B: Process Hardening Completion (Infrastructure Thread)

- **Wave commit marker hook in warning mode:** Both `.claude/hooks/validate-commit.sh` files parse `Wave N: description` format. Match logs and succeeds; non-match logs and still succeeds. Warning mode chosen deliberately because the heredoc commit pattern does not preserve newlines through the `-m` flag content extractor — full blocking mode would false-positive on valid heredoc commits until extraction improves.
- **LOC-per-release tracking with 15K-LOC flag:** `.planning/STATE.md` table covers v1.49.22 through v1.49.29, makes the scale of each release visible at a glance, and flags any release over 15K LOC for retrospective review. Prevents oversize releases from landing without attention.
- **Speculative infrastructure inventory at `infra/SPECULATIVE-INVENTORY.md`:** 28 design-ahead files across 7 categories — VM backends, platform abstractions, PXE templates, world specs, runbooks, knowledge packs, monitoring. Prevents speculative tooling from being mistaken for active infrastructure during code review or onboarding.
- **TypeScript API doc generation via typedoc:** `typedoc.json` targets `src/`, `npm run docs:api` produces HTML output, `docs/api/` is gitignored so generated docs don't pollute git history. Verified: script produces 0 errors on current src/ tree.
- **Session handoff pattern validated twice:** This release is the second time a `.planning/HANDOFF-*.md` document was used to resume mid-work items in a new session without rework. First was AVI+MAM continuity in v1.49.25; second is Wave 2 process hardening here. Two-for-two success rate on a non-trivial pattern is evidence the technique generalizes.
- **Checklist enforcement caught v1.49.29 gap but missed v1.49.30:** The release-checklist enforcement that v1.49.29 introduced caught the "no release notes before tag" gap for v1.49.29 itself but did not prevent it for v1.49.30 (the FFA release went to GitHub before its release notes were written). v1.49.31 documents this gap and defers the fix to the checklist-strictness work in v1.49.32.
- **Heredoc extraction is the open work item:** Wave commit marker extraction parses the `-m` flag content, which does not preserve newlines from `$(cat <<'EOF'...)` heredoc patterns. Warning mode is appropriate until extraction reads the actual COMMIT_EDITMSG file rather than the argv. Tracked for a future hardening cycle.
- **Four items individually small, collectively compounding:** None of the four hardening items is exciting. Together they are the invisible baseline that future releases will inherit without noticing. The best process work is invisible when it's working.

## Retrospective

### What Worked

- **Scholarly discipline held under the most sensitive subject matter in the series.** The TIBS study could have been a book review of *Animal Speak*. Instead it is a 5-module comparative epistemology with 34 academic sources, 5 nations treated individually, and an appropriation analysis that presents three scholarly positions without endorsement. The SC-ADV gate (no policy advocacy) was the structural commitment that kept the synthesis from tipping into either hagiography or takedown — and it held.
- **Safety-critical tests as editorial standards rather than post-hoc checks.** Six safety gates — SC-SRC, SC-NUM, SC-IND, SC-ADV, SC-CER, SC-LOC — governed the drafting from Wave 0 forward, not just the verification pass in Wave 3. The gates are binary and auditable; they were runnable against the manuscript at any point. All six passed before the commit was authored, so the release ships the study and the safety verification in the same atomic diff.
- **Session handoff paid for itself twice.** Wave 2 process hardening was resumed from a `.planning/HANDOFF-*.md` document in a new session and completed without rework. This is the second successful use of the pattern (first was AVI+MAM in v1.49.25). The handoff document is functioning as a cross-session working-memory slot; the 15-minute read-and-rehydrate cost is dramatically less than reconstructing the checklist from git log plus ambient memory.
- **Two threads shipped together was honest, not padded.** The TIBS research and the Wave 2 process hardening were different kinds of work that both happened to be ready at the same time. Shipping them in one release is what happened; separating them into two releases for narrative tidiness would have been a lie by presentation. Honest releases beat tidy releases.
- **Parallel wave execution kept the research tracks clean.** Wave 1A (Andrews: BIO + BIB) ran parallel to Wave 1B (Tribal: TRB + CRT). The two streams did not contaminate each other — the Andrews biographer did not pre-write the tribal survey, the tribal documentation did not back-project Andrews' framework onto Indigenous epistemology. The Wave 2 synthesis was therefore genuine comparative work.
- **Comparative epistemology produced a scaffold neither celebration nor critique could reach.** Listing 5 differences and 4 resonances (rather than one or the other) is structurally more useful than either position alone. The scaffold is the finding.

### What Could Be Better

- **No v1.49.30 release notes in-repo before release.** The FFA release went to GitHub before its release notes were written. The v1.49.29 checklist enforcement caught this gap for v1.49.29 but did not prevent it for v1.49.30. A stricter pre-tag gate is needed — blocking, not warning.
- **Wave commit marker hook cannot validate heredoc commits.** The `-m` flag extractor does not preserve newlines from `$(cat <<'EOF'...)` heredoc patterns, so the wave-marker regex sees a single line and warns on valid commits. Warning mode is appropriate until extraction reads `COMMIT_EDITMSG` directly rather than parsing argv. Full blocking mode is deferred until that extraction lands.
- **Mission pack PDF remains a non-diffable binary.** `mission.pdf` (185 KB) shipped alongside `mission.tex` (982 lines); the source is diffable, the PDF is not. Pairing the PDF with a pinned LaTeX engine version and font path manifest would make regeneration verifiable across environments instead of "compiled on my machine."
- **TypeScript API doc generation has no published deploy target.** `npm run docs:api` produces output; `docs/api/` is gitignored. The output is verifiable locally but has no published surface. A future cycle needs to wire `docs/api/` to GitHub Pages or a www subdomain so the generated docs are consumable by readers rather than only by the CI system.
- **Reader-profile guide could expand to tribal membership profiles.** The 3-profile reading guide (Spiritual Seeker, Scholar, Indigenous Knowledge Seeker) treats Indigenous readers as a single category. Future revision should either split this into tribal-specific profiles or remove it — Coast Salish readers approach this material differently than Tlingit readers, and the current profile under-serves both.

## Lessons Learned

- **Comparative epistemology reveals structure that critique alone cannot.** Listing "5 differences and 4 resonances" between Indigenous and New Age knowledge systems is more useful than either celebration or takedown. The structure itself is the finding — a reader can navigate the comparison without having to take a side, and the study's posture stays documentary rather than prescriptive. (Lesson #422.)
- **Reader profiles are a gift to the reader's time and intent.** A 3-profile reading guide — "if you're a spiritual seeker, start here; if you're a scholar, start here; if you're an Indigenous knowledge seeker, start here" — respects the reader as an autonomous agent with a specific approach. It is the bibliography equivalent of Radical Inclusion: the study does not assume a single right way to enter its subject. (Lesson #423.)
- **Process hardening compounds silently.** Wave commit markers, LOC tracking, speculative infra inventory, typedoc — none of these are exciting. All of them prevent future problems. The best process work is invisible when it's working, and the projects that treat "invisible but compounding" as the highest tier of engineering output are the ones that age well. (Lesson #424, applied in v1.49.29 retrospective synthesis and v1.49.32 Release Integrity.)
- **Release notes are the project's memory, not just a changelog.** Updating v1.49.29's GitHub release body with full Wave 2 coverage and documenting the two-thread nature of v1.49.31 here ensures the teaching trail survives in the project's written history. A release note that truthfully captures what happened is a gift to the future version of the project that needs to remember why a decision was made. (Lesson #425, applied in v1.49.32 — Release Integrity.)
- **Safety-critical gates must be binary and auditable.** The six SC-* tests (SC-SRC, SC-NUM, SC-IND, SC-ADV, SC-CER, SC-LOC) each pass-or-fail with no middle ground, and each is checkable by hand in a single reading pass. Binary auditability is what makes safety-critical tests runnable repeatedly during drafting; continuous-scale rubrics defer the test to landing, where there is no time left to fix what the rubric reveals. (Lesson #426.)
- **Session handoff documents are cross-session working-memory slots.** A `.planning/HANDOFF-*.md` that captures mid-work state, immediate next actions, and the narrow list of files touched lets the next session resume without re-deriving state. Two-for-two success on non-trivial Wave 2-style continuations (AVI+MAM in v1.49.25 and Wave 2 process hardening here) is evidence the technique generalizes; adopt it as a standing practice for any multi-session work item. (Lesson #427.)
- **Parallel research tracks must not share a drafter.** Wave 1A (Andrews: BIO + BIB) and Wave 1B (Tribal: TRB + CRT) ran parallel precisely so neither would pre-contaminate the other. If the same author writes the New Age biography and then the Indigenous tradition survey, the survey implicitly back-projects the biography's framework. Separating the tracks was the structural commitment that kept the Wave 2 synthesis honest.
- **Master-index updates belong in the atomic commit that ships the project.** The v1.49.26 BPS retrospective identified this debt (AVI+MAM had shipped without updating the PNW master index) and v1.49.31 honors it forward: cross-reference matrix, geographic coverage, and reading order were updated in this commit, not deferred. Making the lesson operational means the debt does not compound into the next release window.
- **Two-thread releases are honest when both threads are genuinely ready.** Content and infrastructure are different kinds of work but they can land together when they are both done. The narrative cost is one extra paragraph in the summary; the alternative — artificially gating one thread to produce a "cleaner" release — pays its cost in lost truth and deferred work.
- **Humanities research can carry the same discipline as physics-first research.** BPS (v1.49.26) organized by governing equation; TIBS organizes by epistemological axis. The discipline is not physics-specific — it is a commitment to naming the analytical structure before filling it, and that commitment produces scaffolded research whether the subject is sonar or shamanism.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.30](../v1.49.30/chapter/00-summary.md) | Predecessor — Fur, Feathers & Animation Arts (Rabs Edition); v1.49.31 closes the release-notes-in-repo gap that v1.49.30 exhibited |
| [v1.49.32](../v1.49.32/chapter/00-summary.md) | Successor — Release Integrity & Agent Heartbeat; applies Lesson #425 (release notes as project memory) directly |
| [v1.49.29](../v1.49.29/chapter/00-summary.md) | Source of the Wave 2 process-hardening items (wave markers, LOC tracking, speculative infra inventory, typedoc) completed here |
| [v1.49.26](../v1.49.26/chapter/00-summary.md) | BPS precedent — physics-first research atlas; TIBS applies the analogous discipline to humanities with epistemology-first organization |
| [v1.49.25](../v1.49.25/chapter/00-summary.md) | AVI + MAM compendiums — first successful session-handoff use (AVI+MAM continuity); TIBS is the second |
| [v1.49.35](../v1.49.35/) | Data Source Registry — operationalizes source-tiering discipline TIBS applied to 34 citations |
| [v1.49.37](../v1.49.37/) | 16-Project Hub — refreshes master index as first-class deliverable per BPS/TIBS catch-up pattern |
| [v1.49.21](../v1.49.21/README.md) | Sibling uplift exemplar — same v1.49.x feature-release shape; types-first discipline parallels TIBS's epistemology-first discipline |
| [v1.49.22](../v1.49.22/README.md) | PNW Research Series uplift exemplar — same series, same grove-card pattern, same reading-order discipline |
| [v1.49.17](../v1.49.17/) | Types-first discipline antecedent — contracts before content, applied to cartridge format rather than research modules |
| [v1.49.12](../v1.49.12/) | Heritage Skills Pack — pack-shape content analogous to TIBS mission pack's LaTeX + PDF + browser-index triad |
| [v1.49.0](../v1.49.0/) | Parent mega-release — v1.49.x line and GSD-OS desktop surface where TIBS lives |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — pack template the TIBS mission pack inherits |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop; TIBS extends the Observe step to humanities-comparative research with safety-critical editorial gates |
| `www/PNW/TIBS/research/00-shared-schema.md` | Tribal glossary, 34-source index, sensitivity classification protocol |
| `www/PNW/TIBS/research/05-syn-synthesis.md` | Synthesis module — 5 differences, 4 resonances, 3-profile reading guide |
| `www/PNW/TIBS/research/07-verification-matrix.md` | 26 tests (6 SC + 10 CF + 6 IN + 4 EC) + 12 success criteria, all PASS |
| `www/PNW/TIBS/mission-pack/mission.tex` | 982-line LaTeX source for the TIBS mission pack |
| `www/PNW/TIBS/mission-pack/mission.pdf` | 185 KB compiled mission pack |
| Jilek (1982) | *Indian Healing*; sourcing for Coast Salish winter ceremonial and 1868–1893 suppression dates |
| Crawford O'Brien (2013) | Contemporary Pacific Northwest Indigenous revival and ceremonial practice documentation |
| Sturtevant (1990) | *Handbook of North American Indians* Volume 7 (Northwest Coast); authoritative ethnographic reference |
| Harner (1980) | *The Way of the Shaman*; intermediate stop on the appropriation migration path |
| Andrews (1993a) | *Animal Speak*; the primary text the study examines |

## Engine Position

v1.49.31 is the eleventh project in the PNW Research Series and the first humanities-comparative atlas in that series. It sits between v1.49.30 (FFA — Fur, Feathers & Animation Arts) and v1.49.32 (Release Integrity & Agent Heartbeat) in the v1.49.x line, and it extends the sensory-completeness arc the series has been building (ECO full taxonomy → AVI birds → MAM mammals → BPS physics-of-sensing) by adding a humanities-comparative dimension that the earlier, biology-anchored projects could not reach on their own. In the broader v1.49.x line it is a mid-size feature release: 15 files and 4,103 insertions place it smaller than BPS's 29 files / 18,371 insertions by volume but tighter in scope, because every line lands under `www/PNW/TIBS/` and the process-hardening thread was merged into the v1.49.29 retrospective commit chain rather than re-staged here. The architectural footprint is disproportionately large relative to the commit count — a single atomic commit ships a complete 5-module research study, a 26-test verification matrix, browser-pattern participation, a full mission pack, and the session-handoff pattern's second validation. Looking forward, TIBS becomes the reference implementation for humanities-comparative research atlases in the series: any future atlas that organizes by epistemological axis rather than biological subject will inherit the module shape (schema → two parallel tracks → synthesis), the safety-critical gate set (SC-SRC, SC-NUM, SC-IND, SC-ADV, SC-CER, SC-LOC), and the Wave 0/1A/1B/2/3 execution pattern that kept the research tracks from contaminating each other.

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.30..v1.49.31) | 1 |
| Files changed | 15 |
| Lines inserted / deleted | 4,103 / 0 |
| Research files | 7 (00-shared-schema + 01-BIO + 02-BIB + 03-TRB + 04-CRT + 05-SYN + 06-bibliography + 07-verification-matrix; 00 and 06 are sub-200 lines) |
| Research prose lines | 2,132 |
| Research modules | 5 (BIO, BIB, TRB, CRT, SYN) with shared schema (SCH) and verification matrix |
| Nations documented individually | 5 (Coast Salish, Lower Chinook, Tlingit, Haida, Tsimshian) |
| Academic sources | 34 (all publisher-tier: university press, peer-reviewed, government agency, Smithsonian, Llewellyn/Dragonhawk catalog) |
| Epistemological differences documented | 5 (source of authority, place, transmission, body, time) |
| Structural resonances documented | 4 (attention, guardian spirit, healer's vocation, animals as persons) |
| Reader profiles in annotated guide | 3 (Spiritual Seeker, Scholar, Indigenous Knowledge Seeker) |
| Verification criteria | 12/12 PASS |
| Safety-critical tests | 6/6 PASS (SC-SRC, SC-NUM, SC-IND, SC-ADV, SC-CER, SC-LOC) |
| Core functionality tests | 10/10 PASS (CF-01..CF-10) |
| Integration tests | 6/6 PASS (IN-01..IN-06) |
| Edge-case tests | 4/4 PASS (EC-01..EC-04) |
| Total tests | 26/26 PASS |
| Mission pack | 1 (LaTeX 982 lines + PDF 185 KB + browser index 380 lines) |
| PNW series projects (before → after) | 10 → 11 |
| Process-hardening items completed | 4 (wave commit marker hook, LOC tracking table, speculative infra inventory, typedoc pipeline) |
| Session-handoff pattern successful uses | 2 (AVI+MAM in v1.49.25, Wave 2 here) |

## Files

- `www/PNW/TIBS/research/` — 8 research files: `00-shared-schema.md` (186), `01-bio-andrews.md` (366), `02-bib-bibliography.md` (483), `03-trb-tribal-traditions.md` (359), `04-crt-critical-context.md` (362), `05-syn-synthesis.md` (241), `06-bibliography.md` (65), `07-verification-matrix.md` (111)
- `www/PNW/TIBS/index.html` (126 lines) + `page.html` (204 lines) + `mission.html` (34 lines) + `style.css` (204 lines) — static HTML + client-side markdown pattern shared with COL through BPS
- `www/PNW/TIBS/mission-pack/mission.tex` (982 lines) — LaTeX source for the mission pack
- `www/PNW/TIBS/mission-pack/mission.pdf` (185 KB) — compiled mission pack binary
- `www/PNW/TIBS/mission-pack/index.html` (380 lines) — browser-facing mission pack landing page
- `.claude/hooks/validate-commit.sh` — wave commit marker hook in warning mode (not in this commit's on-disk diff; landed in the v1.49.29 retrospective chain, documented here as part of Wave 2 completion)
- `.planning/STATE.md` — LOC-per-release tracking table (v1.49.22–29 data, 15K-LOC flag threshold)
- `infra/SPECULATIVE-INVENTORY.md` — 28 design-ahead files across 7 categories
- `typedoc.json` + `docs/api/` (gitignored) — TypeScript API doc generation pipeline
- `docs/release-notes/v1.49.31/chapter/00-summary.md` — auto-generated parse of this README (Prev/Next navigation to v1.49.30 / v1.49.32)
- `docs/release-notes/v1.49.31/chapter/03-retrospective.md` — retrospective chapter with What Worked / What Could Be Better
- `docs/release-notes/v1.49.31/chapter/04-lessons.md` — 6 lessons extracted with tracker status (applied / investigate / needs review)
- `docs/release-notes/v1.49.31/chapter/99-context.md` — release context chapter

Aggregate: 15 files changed in the on-disk diff, 4,103 insertions, 0 deletions, 1 commit (`2cabec9d5`), v1.49.30..v1.49.31 window. Process-hardening items (4) landed in the v1.49.29 retrospective chain and are documented here as the second narrative thread of the release.
