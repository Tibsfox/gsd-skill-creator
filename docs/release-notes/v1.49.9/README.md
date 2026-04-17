# v1.49.9 — Learn Kung Fu

**Released:** 2026-03-01
**Scope:** second College Structure department — mind-body practice pack across 8 disciplines
**Branch:** dev → main
**Tag:** v1.49.9 (2026-03-01T14:44:54-08:00) — "Learn Kung Fu"
**Commits:** v1.49.8..v1.49.9 (1 commit: `fdfeda9fa`)
**Files changed:** 136 (+16,165 / −6)
**Predecessor:** v1.49.8 — Cooking With Claude
**Successor:** v1.49.10 — flat-atoms architecture
**Classification:** feature — domain-agnostic College Structure proof on a second subject
**Tests:** 751 new (20,604 total passing) · 2 safety-critical, 1 integration, 1 regression, 1 content-accuracy suite
**Verification:** cultural-framework attribution checks · partner-technique boundary enforcement · 10 medical-condition gates · try-session novice path end-to-end

## Summary

**The second College Structure department shipped with zero framework changes and proved the architecture is domain-agnostic.** v1.49.8 built the College Structure on a culinary-arts department — Kitchen, Try Dishes, Recipe Builder, Cooking Journal, Food Safety Warden. v1.49.9 reused the exact same structural pieces on an entirely different subject — Training Hall instead of Kitchen, Try Sessions instead of Try Dishes, Practice Builder instead of Recipe Builder, Practice Journal instead of Cooking Journal, Physical Safety Warden instead of Food Safety Warden — and all 751 new tests passed on the first run of the integration suite because the pattern is structural, not semantic. The College Structure is a chassis; mind-body is a body fitted to the chassis. The zero-framework-change replication is the validation the pattern designers were waiting for.

**Cultural sensitivity is encoded as a safety domain, not a style guideline.** The mind-body department borrows from traditions that have been trivialized, appropriated, and mystified in English-language instructional material for decades — yoga stripped of its philosophical context, tai chi reduced to slow aerobics, zen as a marketing adjective, metta as "loving-kindness meditation" with the Pali word stripped out. The cultural-framework.ts module (269 lines) treats attribution as architecturally enforced: every concept module names its tradition with the original terminology (vipassana, samatha, zazen, kinhin, shoshin, bushido, wude, balasana, savasana, tadasana), cites primary sources where they exist (Patanjali's Yoga Sutras, Tao Te Ching, Zen philosophy canon), and explicitly rejects both mystification (treating practices as magical) and trivialization (treating them as workout routines). This is the same architectural category as physical safety: warden-enforced, non-overridable, checked at content-accuracy test time.

**The Physical Safety Warden extends the Food Safety Warden pattern with an absolute partner-technique boundary.** Food safety has temperature floors, cross-contamination gates, and allergen flags — concrete, enumerable rules. Mind-body safety adds a new category the culinary department did not need: the solo-practice-only boundary. Martial arts, tai chi push hands, self-defense applications, and sparring sequences are all redirected to in-person instruction with a qualified teacher, never taught through generated text. The 3-mode enforcement (annotate, gate, redirect) is the same primitive v1.49.8 introduced, but mode 3 (redirect) carries a new absolute rule: no partner techniques ever, no exceptions, no "but this is just a drill" loophole. Paired with 10 medical-condition modifications (pregnancy, hypertension, joint replacement, herniated disc, glaucoma, vertigo, eating-disorder history, pacemaker, recent surgery, anticoagulant therapy), the safety warden enforces the specific shape of risk that mind-body practice carries — which is not the same shape as food safety, even though the enforcement primitive is identical.

**Parallel content modules eliminated coordination overhead and confirmed the eight disciplines are genuinely independent.** Breath, Meditation, Yoga, Pilates, Martial Arts, Tai Chi, Relaxation, and Philosophy ran as four paired streams: Breath/Meditation (internal practice), Yoga/Pilates (movement practice), Martial Arts/Tai Chi (form-based practice), Relaxation/Philosophy (rest and framing practice). The four streams had zero merge conflicts, zero shared-state bugs, and zero cross-module dependencies that had to be resolved after the fact. This is a strong signal that the eight-wing shape was the right granularity — larger modules (say, merging breath with meditation) would have hidden the different pacing of each practice; smaller modules would have fragmented the content without adding structural clarity. The independence also means later additions (dance, qigong, somatics, Feldenkrais, Alexander technique) slot in as new wings without restructuring the existing eight.

**Try Sessions are the antidote to analysis-paralysis in a library this size.** A department with 8 disciplines and 16,131 lines of teaching content is overwhelming to a novice who just wants to start. The Try Sessions layer — 8 sessions, one per discipline, designed for immediate practice within minutes with no equipment and no prerequisites — is the on-ramp. Horse Stance, Tea Meditation, Yoga Five Poses, Pilates Breath, Tai Chi Commencement, Meditation One Minute, Three Minute Reset, First Five Minutes: each is a complete, bounded, safe first experience that a user can complete before deciding whether to commit to deeper study. The Try Sessions are not watered-down versions of the "real" content; they are deliberately the minimum viable entry point for each discipline, calibrated to produce a felt experience in under five minutes. The try-session-novice test suite verifies the on-ramp actually works: all 8 sessions can be completed by a novice without reading any other module, and none of them requires equipment beyond a chair and a clear patch of floor.

**Practice Journal uses filesystem-as-data with no-guilt UX, no shame mechanics, and 5-pattern calibration integration.** Streak tracking in fitness software is a well-documented anti-pattern: it rewards brittle consistency and punishes legitimate rest days, which in mind-body practice is backwards — rest is part of the practice, not a failure of it. The Practice Journal treats the log as data for understanding, not a scorecard for judgment. The 5 calibration patterns — consistency, preference, avoidance, energy, growth — read the same filesystem records to produce insight: which practices does the user return to, which do they skip, how does energy shift across a session, how does capacity grow over weeks. The streak tracker exists, but it is informational rather than gamified. The Practice Builder uses the calibration output to adapt 9-week progressive structures to the practitioner's actual pattern rather than a generic curriculum.

**"Text builds proprioception" is a deliberate philosophical claim, not a technology limitation.** The obvious objection to a text-only mind-body teaching package is that movement cannot be taught without visual reference. The department takes the opposite position: text forces the practitioner to feel rather than imitate, which is the point of proprioceptive development. Watching a video of a yoga pose and copying the shape produces the same shape without the internal sensation that the shape is supposed to cultivate; reading the instruction and trying to feel one's way into the posture produces the sensation. This is a strong claim and it is not universally true — certain precision movements genuinely benefit from visual reference — but the Try Sessions mitigate that limitation by starting from positions the body already knows (standing, sitting, lying down) and adding one new element at a time. The limitation is acknowledged in the retrospective, not papered over.

**The chipset configuration consolidates 10 skills and 3 agents that map directly to practitioner roles.** The three agents — sensei (authoritative teacher), instructor (session-guide), builder (progression-planner) — correspond to three distinct conversational modes a practitioner actually uses: "explain this tradition to me," "walk me through a session right now," "plan my next eight weeks." The 10 skills cover browsing disciplines, running try sessions, building practices, logging journal entries, surfacing cultural context, enforcing safety gates, tracking streaks, mapping cross-discipline connections, generating progressive structures, and navigating the connection map. The agent/skill split avoids the v1.48.x problem of too-large agents that tried to do everything; each agent loads only the skills it needs and hands off to sibling agents when the conversational mode shifts.

**Connection map surfaces the real cross-discipline relationships instead of treating each wing as an island.** Breath appears in every wing: yoga breath-movement linking, pilates powerhouse breath, martial breath, tai chi ujjayi, meditation counted breath, relaxation diaphragmatic breath, philosophy as pranayama context. The connection-map module (208 lines) names these relationships explicitly rather than leaving them for the practitioner to discover. The discipline-navigator uses the map to suggest "if you liked box breathing, try tai chi zhan zhuang" — cross-discipline recommendations that respect the traditions rather than mashing them together. The map is curated, not algorithmic: every connection in it was named by a practitioner who has practiced both sides, not generated by embedding similarity.

**The department file count is honest about the cost of domain-complete content.** 136 files, 16,131 lines of TypeScript, 751 tests for a single department is a lot — combined with v1.49.8's culinary department, `.college/` is now 34,000+ LOC across two departments. The v1.49.10 flat-atoms architecture will address this scaling problem by promoting atomic content into a shared substrate; for v1.49.9 the file count is the cost of proving the College Structure works at production-ish scale on a genuinely complex domain. The alternative — shipping a toy department to prove the pattern — would not have exercised the pattern against real complexity. Safety rules, cultural attribution, evidence citations, medical-condition modifications, cross-discipline connections, progressive structures, and no-guilt journal UX are all tested against real content rather than fixtures.

## Key Features

| Area | What Shipped |
|------|--------------|
| Mind-Body Department | New `.college/departments/mind-body/` with 8 discipline wings (breath, meditation, yoga, pilates, martial arts, tai chi, relaxation, philosophy) in `concepts/` |
| Training Hall | `training-hall.ts` (136 lines) — 5 navigation paths for discovery, entry-point routing across all 8 wings, cultural sensitivity framework woven into every interaction |
| Try Sessions | 8 immediate-practice sessions in `try-sessions/` — Horse Stance, Tea Meditation, Yoga Five Poses, Pilates Breath, Tai Chi Commencement, Meditation One Minute, Three Minute Reset, First Five Minutes |
| Practice Builder | `practice-builder/` — session generator, 4 time templates (5/10/20/30 min), 9-week progressive structure, cross-discipline combinations |
| Practice Journal | `journal/practice-journal.ts` + `journal-display.ts` + `streak-tracker.ts` — filesystem-as-data, no-guilt UX, 5-pattern calibration integration |
| Physical Safety Warden | `safety/physical-safety-warden.ts` (346 lines) — 3-mode enforcement (annotate/gate/redirect), partner-technique absolute boundary, 10 medical conditions in `medical-conditions.ts` (532 lines) |
| Evidence Citations | `safety/evidence-citations.ts` (331 lines) — primary-source citations for every safety claim, auditable attribution chain |
| Cultural Framework | `cultural-framework.ts` (269 lines) — original-terminology attribution, rejection of mystification and trivialization, tradition-credit enforcement |
| Calibration Integration | `calibration/mind-body-calibration.ts` + `pattern-detector.ts` — 5 pattern types (consistency, preference, avoidance, energy, growth) |
| Connection Map | `map/connection-map.ts` (208 lines) + `discipline-navigator.ts` — curated cross-discipline relationships |
| Discipline Browser | `browse/discipline-browser.ts` (365 lines) — navigation across all 8 wings with cultural context surfacing |
| Chipset Configuration | `chipset/chipset-config.ts` + `agent-definitions.ts` — 10 skills, 3 agents (sensei, instructor, builder) |
| Philosophy Content | 7 philosophy modules — Taoism/Tao Te Ching, Yoga Sutras/Patanjali, Zen, Bushido/Wude, Shoshin (beginner's mind), mindfulness in daily life, martial virtues |
| Test Coverage | 751 new tests across 15 test files — content-accuracy (313 lines), integration-suite (429 lines), regression (158 lines), safety-critical (371 lines), try-session-novice (362 lines) |
| Documentation | `DEPARTMENT.md`, `docs/FEATURES.md` update, `docs/RELEASE-HISTORY.md` entry, `CLAUDE.md` + `project-claude/CLAUDE.md` + top-level `README.md` refs |

## Retrospective

### What Worked

- **College Structure scales to a second domain with zero framework changes.** 8 wings, Try Sessions, Practice Builder, Practice Journal, Safety Warden — all follow identical patterns from v1.49.8 with no modifications to the underlying architecture. 751 new tests confirm the structure is domain-agnostic and the pattern is structural rather than semantic.
- **Cultural sensitivity framework as first-class architecture.** Credit traditions with original terminology (vipassana, zazen, bushido, wude, tadasana), no mystification or trivialization — this is a design constraint enforced by the cultural-framework module and content-accuracy test suite, not a style guideline. The solo practice boundary (redirect partner/sparring to in-person instruction) is the safety warden enforcing cultural respect as a safety domain.
- **Parallel content modules eliminated coordination overhead.** Breath/Meditation, Yoga/Pilates, Martial Arts/Tai Chi, Relaxation/Philosophy ran in parallel because they are genuinely independent. Zero merge conflicts, zero shared-state bugs, zero cross-module dependencies resolved after the fact.
- **No-guilt Practice Journal UX.** Filesystem-as-data with streak tracking but no shame mechanics. The 5-pattern calibration integration (consistency, preference, avoidance, energy, growth) treats the journal as data for improvement, not a scorecard. Rest is part of the practice, not a failure of it.
- **Try Sessions are the right on-ramp for a 16,131-line library.** Eight bounded, safe, minutes-long first experiences — one per discipline — let a novice feel the practice before committing to deeper study. The try-session-novice test suite verifies the on-ramp actually works without any other module loaded.
- **Safety Warden extension caught the partner-technique boundary as a structural rule.** Mind-body safety has a shape that food safety does not — solo-only practice with qualified-teacher redirects — and the 3-mode enforcement primitive (annotate/gate/redirect) absorbed the new rule without schema changes.

### What Could Be Better

- **16,131 LOC for a single department is substantial.** Combined with v1.49.8's 17,964 LOC culinary department, `.college/` is now 34,000+ LOC across two departments. The flat-atoms architecture slated for v1.49.10 addresses the scaling problem by promoting atomic content into a shared substrate, but the per-department size is worth monitoring.
- **"Text builds proprioception" is a bold philosophical claim and a real limitation.** While it's a deliberate design choice, movement instruction without visual reference is genuinely harder for certain precision work. The Try Sessions mitigate this with minimal-equipment, no-prerequisite entry points from positions the body already knows, but the limitation is real and acknowledged.
- **Evidence citations are manually curated rather than programmatically verified.** The 331-line evidence-citations module names primary sources for every safety claim, but the link between claim and source is human-authored. A future version should add machine-checkable citation verification — at minimum a dead-link check, ideally a retrieval-based match against the claim text.
- **Cultural framework enforcement is test-time, not author-time.** A content author can write a module with trivialized language and only discover the failure when the content-accuracy test runs. An editor-integrated linter that flags mystification and trivialization patterns at write time would shorten the feedback loop.
- **No integration with v1.49.8's culinary department yet.** Both departments exist but they don't talk to each other — there's no cross-department pattern for "I practiced tai chi this morning and I'm hungry now, what should I eat?" The College Structure supports cross-department composition in principle, but this release didn't ship the first example.

## Lessons Learned

- **Domain-agnostic frameworks prove themselves on the second domain, not the first.** v1.49.8 built the College Structure with a single department and it was plausibly correct; v1.49.9 replicated it on a subject with entirely different content and it still fit. The zero-framework-change replication is the real validation — a framework that fits exactly one domain is not a framework, it's a program with generic names.
- **Safety wardens must handle domain-specific boundaries using domain-agnostic primitives.** Food safety has temperature floors; mind-body has partner-technique restrictions. The 3-mode enforcement pattern (annotate/gate/redirect) is flexible enough to express both without requiring a new enforcement primitive per domain. The primitive is mode-agnostic; the rule is domain-specific.
- **Cultural sensitivity is a safety domain, not a style choice.** Treating cultural respect with the same architectural rigor as physical safety — warden-enforced, non-overridable, checked at test time — is the correct design decision. Style guidelines are advisory; safety wardens are structural. If a rule must not be broken, it belongs in the warden.
- **Parallel content modules validate independence.** Four content streams running in parallel with zero merge conflicts, zero shared-state bugs, and zero post-hoc dependency resolution is evidence that the partition was correct. If modules cannot be built in parallel, they are probably coupled in ways that weren't modeled.
- **No-guilt UX is the honest default for practice-tracking software.** Streak mechanics reward brittle consistency and punish legitimate rest, which is backwards in mind-body work. Filesystem-as-data with informational streak display lets the practitioner see the pattern without being judged by it.
- **Try Sessions are the universal on-ramp.** Any library over 10,000 lines needs a bounded, safe, minutes-long first-contact experience per major component, or users will bounce off the depth before seeing the value. Try Sessions are not dumbed-down content; they are deliberately the minimum viable first experience.
- **Curated cross-references beat algorithmic ones.** The connection-map module names cross-discipline relationships authored by practitioners who have done both sides, rather than generating them from embedding similarity. The curation cost is small (a few hundred lines); the quality difference is large.
- **File count honesty beats file count minimization.** 136 files and 16,131 LOC is the real cost of a domain-complete pack with safety warden, cultural framework, evidence citations, medical modifications, and 751 tests. Shrinking the file count by collapsing modules would have hidden the cost without reducing it. Honest file counts make the v1.49.10 flat-atoms refactor a legible win.
- **Agent granularity follows conversational mode, not technical capability.** Three agents (sensei, instructor, builder) map to three distinct practitioner needs (explain, guide, plan) rather than three technical capabilities. The v1.48.x problem of too-large agents trying to do everything is avoided by letting conversational mode drive the split.
- **Ship the second example before claiming the pattern is general.** v1.49.8 was "a department." v1.49.9 is "the pattern." One is a program; two is a framework. Claims about generality need a second example to be credible.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.8](../v1.49.8/) | Predecessor — Cooking With Claude, the first College Structure department (culinary arts) this release replicates the pattern of |
| [v1.49.10](../v1.49.10/) | Successor — flat-atoms architecture that addresses the 34,000+ LOC scaling issue flagged in this retrospective |
| [v1.49.7](../v1.49.7/) | Earlier v1.49.x polish release (optional tmux + graceful degradation) — sibling release from the same sprint week |
| [v1.49.6](../v1.49.6/) | macOS compatibility & dependency hardening — thematic sibling on the cross-platform discipline track |
| [v1.49.0](../v1.49.0/) | Parent mega-release where GSD-OS first shipped and the College Structure was first contemplated |
| [v1.49](../v1.49/) | Consolidated v1.49 line release notes |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — 35 packs across 3 tiers, the early precursor to department-style content organization |
| [v1.29](../v1.29/) | Electronics Educational Pack — 15 modules, 77 labs, earlier domain-specific educational content design |
| [v1.35](../v1.35/) | Mathematical Foundations Engine — 451 primitives across 10 domains, another domain-agnostic framework test |
| [v1.10](../v1.10/) | Security Hardening — the safety warden pattern lineage that physical-safety-warden extends |
| [v1.0](../v1.0/) | Foundation — the 6-step adaptive loop and bounded-parameter philosophy that department architecture inherits from |
| `.college/departments/mind-body/` | Department root — all 136 files of this release |
| `.college/departments/mind-body/cultural-framework.ts` | Cultural sensitivity as architecture — 269 lines of tradition-credit enforcement |
| `.college/departments/mind-body/safety/physical-safety-warden.ts` | 3-mode enforcement with partner-technique absolute boundary |
| `.college/departments/mind-body/try-sessions/` | On-ramp — 8 bounded first-contact practice sessions |
| `docs/RELEASE-HISTORY.md` | Project-wide release chronology with this release's entry |
| `docs/FEATURES.md` | Feature-level documentation updated with mind-body department |

## Engine Position

v1.49.9 is the release that changes the College Structure from a hypothesis into a pattern. v1.49.8 shipped the first department and proved the structure could hold real content; v1.49.9 shipped the second department and proved the structure was domain-agnostic. Everything after v1.49.9 that touches `.college/` inherits this demonstrated generality — the culinary department and the mind-body department are the two anchors the later flat-atoms refactor (v1.49.10) pivots on, because the atoms it promotes have to work for both. Looking forward, the six-plus additional departments contemplated in the roadmap (electronics, mathematics, field biology, music theory, language learning, civic literacy) all ride this release's demonstration: the Training Hall / Try Sessions / Practice Builder / Practice Journal / Safety Warden shape is the reusable chassis, not a one-off. Looking back, v1.49.9 closes the loop the v1.27 Foundational Knowledge Packs opened — packs were the bags of content; departments are the structured buildings; the College Structure is the campus plan. The specific additions this release makes to the pattern — partner-technique absolute boundary, cultural-sensitivity-as-safety-domain, curated cross-discipline connection map, no-guilt filesystem-as-data journaling — are each load-bearing for subsequent departments where similar concerns arise (electronics has its own "do not attempt in person" boundary around mains voltage; field biology has cultural-sensitivity concerns around indigenous knowledge; civic literacy has its own partner-technique analog around organizing work that must happen in person). The pattern is now general; the remaining work is instantiation.

## Files

- `.college/departments/mind-body/DEPARTMENT.md` — department manifest (+20 lines)
- `.college/departments/mind-body/index.ts` — department entry point (+41 lines)
- `.college/departments/mind-body/types.ts` — shared type definitions (+254 lines)
- `.college/departments/mind-body/mind-body-department.ts` — department class (+144 lines)
- `.college/departments/mind-body/mind-body.test.ts` — department-level tests (+400 lines)
- `.college/departments/mind-body/integration.test.ts` — cross-module integration (+346 lines)
- `.college/departments/mind-body/training-hall.ts` — Training Hall entry point (+136 lines)
- `.college/departments/mind-body/cultural-framework.ts` — cultural sensitivity as architecture (+269 lines)
- `.college/departments/mind-body/browse/discipline-browser.ts` — 8-wing navigation (+365 lines)
- `.college/departments/mind-body/calibration/mind-body-calibration.ts` — 5-pattern calibration (+189 lines)
- `.college/departments/mind-body/calibration/pattern-detector.ts` — pattern detection (+300 lines)
- `.college/departments/mind-body/chipset/chipset-config.ts` — 10 skills + 3 agents (+137 lines)
- `.college/departments/mind-body/chipset/agent-definitions.ts` — sensei/instructor/builder agents (+95 lines)
- `.college/departments/mind-body/concepts/breath/` — 6 breath modules + tests
- `.college/departments/mind-body/concepts/meditation/` — 7 meditation modules + tests
- `.college/departments/mind-body/concepts/yoga/` — 12 yoga modules + tests
- `.college/departments/mind-body/concepts/pilates/` — 12 pilates modules + tests
- `.college/departments/mind-body/concepts/martial-arts/` — 13 martial-arts modules + tests
- `.college/departments/mind-body/concepts/tai-chi/` — 8 tai chi modules + tests
- `.college/departments/mind-body/concepts/relaxation/` — 8 relaxation modules + tests
- `.college/departments/mind-body/concepts/philosophy/` — 7 philosophy modules + tests
- `.college/departments/mind-body/try-sessions/` — 10 files (8 try sessions + index + test)
- `.college/departments/mind-body/practice-builder/` — session generator, progressive structure, session templates (+964 lines across 5 files)
- `.college/departments/mind-body/journal/` — Practice Journal + display + streak tracker + tests (+860 lines across 5 files)
- `.college/departments/mind-body/map/connection-map.ts` — curated cross-discipline relationships (+208 lines)
- `.college/departments/mind-body/map/discipline-navigator.ts` — recommendation surface (+127 lines)
- `.college/departments/mind-body/safety/physical-safety-warden.ts` — 3-mode enforcement (+346 lines)
- `.college/departments/mind-body/safety/medical-conditions.ts` — 10 medical-condition modifications (+532 lines)
- `.college/departments/mind-body/safety/partner-boundary.ts` — solo-only rule (+188 lines)
- `.college/departments/mind-body/safety/evidence-citations.ts` — primary-source attribution (+331 lines)
- `.college/departments/mind-body/tests/content-accuracy.test.ts` — cultural & factual accuracy (+313 lines)
- `.college/departments/mind-body/tests/integration-suite.test.ts` — end-to-end integration (+429 lines)
- `.college/departments/mind-body/tests/safety-critical.test.ts` — warden enforcement tests (+371 lines)
- `.college/departments/mind-body/tests/try-session-novice.test.ts` — novice on-ramp (+362 lines)
- `.college/departments/mind-body/tests/regression.test.ts` — regression guard (+158 lines)
- `CLAUDE.md` + `project-claude/CLAUDE.md` + `README.md` — top-level doc updates
- `docs/FEATURES.md` + `docs/RELEASE-HISTORY.md` — feature + release chronology entries

Aggregate: 136 files changed, 16,165 insertions, 6 deletions, single commit `fdfeda9fa`.
