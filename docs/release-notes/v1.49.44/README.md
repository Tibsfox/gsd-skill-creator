# v1.49.44 — "Skill Check"

**Released:** 2026-03-26
**Scope:** external PR contribution + self-reflective Research project — applies PR #28 (Tessl skill-review improvements to 5 skills), ships the `tesslio/skill-review` GitHub Actions workflow, and adds TSL as the 42nd project in the PNW Research Series to document the entire recursive-quality experience
**Branch:** dev → main
**Tag:** v1.49.44 (2026-03-26T01:00:55-07:00) — merge commit `640889d15`
**Commits:** v1.49.43..v1.49.44 (4 commits: skills `9023ad19f` + TSL `cd9a17f9a` + docs `75f1cbb4b` + merge `640889d15`)
**Files changed:** 26 (+4,275 / −77, net +4,198)
**Predecessor:** v1.49.43 — "Evergreen" (WYR, Weyerhaeuser & Sustainable Timber; 41st Research project)
**Successor:** v1.49.45 — next release in the v1.49.x Research cadence
**Classification:** hybrid — external PR application (skill improvements + CI workflow, touching live `skills/` + `.github/workflows/`) plus content (Research project TSL added to the multi-domain docroot that v1.49.38 built); first release in the series driven by an outside contributor
**Closes:** [#28](https://github.com/Tibsfox/gsd-skill-creator/pull/28) — Tessl skill-review improvements from `rohan-tessl`
**Author:** Tibsfox (`tibsfox@tibsfox.com`); external contributor credited: rohan-tessl @ Tessl (tesslio)
**Dedicated to:** external reviewers — the tools and people who find what internal review misses, and the recursive discipline of a skill creator submitting its own skills for audit
**Epigraph:** *"A skill creator whose skills can't pass a skill review has a credibility problem. A skill creator that fixes what the review finds has a learning system."*

---

## Summary

**v1.49.44 is the first release driven by an external pull request.** Every prior release in the v1.49.x line shipped work originated by Tibsfox on-project. v1.49.44 inverts that default: PR #28 arrived from `rohan-tessl` at Tessl with a measurable structural critique of five of the project's lowest-scoring skills and a concrete remediation diff. The release applies that diff — `dacp-interpreter`, `mfe-synthesis`, `mfe-unification`, `mfe-change`, and `mfe-emergence` all gained YAML frontmatter, a "Use when…" activation trigger, numbered workflow steps, and explicit error-handling sections — and then treats the whole interaction as source material for the 42nd Research project. The recursive framing is not decorative. The project's thesis since v1.0 is that the 6-step adaptive loop (Observe → Detect → Suggest → Apply → Learn → Compose) applies to the project itself; v1.49.44 is the first release where the Detect and Apply steps were performed by an outside party and the Learn step was performed by turning the audit into public research. The release is a proof-of-concept that adaptive learning can cross organizational boundaries without breaking.

**Five skills moved from F-tier to C/B-tier on the skill-review rubric.** The quantitative result of PR #28 is five skills whose scores rose by an average of +60 percentage points. `dacp-interpreter` went from 0% to 85% (+85) — the 0% score meant the skill was effectively invisible to any rubric-aware reviewer because it lacked YAML frontmatter entirely; adding the frontmatter, a structured six-step workflow, and an error-handling section took it straight to B-tier. `mfe-synthesis` went from 11% to 63% (+52), `mfe-unification` from 11% to 75% (+64), `mfe-change` from 22% to 68% (+46), and `mfe-emergence` from 22% to 75% (+53). The uniform pattern across all five skills is that the content was already good — the math, the domain framing, the pedagogical sequencing were all present — but the structure that makes a skill machine-discoverable and human-greppable was missing. This is the central lesson of Module 02 of the TSL project: a skill without a workflow is a wish; a skill without a trigger is invisible; a skill without error handling is dangerous. The PR fixed the structure, and the structure was the thing that was holding the content back.

**The GitHub Actions workflow makes the review recurring instead of one-shot.** Commit `9023ad19f` added `.github/workflows/skill-review.yml` (22 lines) which runs `tesslio/skill-review` on every pull request that touches a `**/SKILL.md` file. The workflow is non-blocking — it comments feedback on the PR rather than failing the build — uses only `GITHUB_TOKEN` (no external accounts, no third-party credentials), and updates a single comment per PR on subsequent pushes so review iteration doesn't pollute the timeline. The design choice to make the workflow non-blocking is deliberate: this is the first external review pipeline the project has wired in, and making it advisory rather than mandatory keeps the power-to-merge with the project maintainer while still surfacing the audit. If the workflow becomes trusted over time the gate can be tightened; starting soft is the correct posture for a new quality signal from an outside vendor.

**The TSL Research project makes the process auditable and teachable.** TSL ("Tessl Skill Review") is the 42nd Research project in the PNW Research Series and ships with the now-standard shape: a seven-module research tree (1,400 lines of markdown across the seven modules and a verification-matrix-equivalent score card), a mission-pack triad (HTML index, markdown narrative, LaTeX source, pre-rendered PDF), and a page shell (`index.html`, `page.html`, `mission.html`, `style.css`) slotted into the multi-domain docroot at `www/tibsfox/com/Research/TSL/`. Module 01 documents the Tessl platform and its founder Guy Podjarny. Module 02 names the skill-quality problem and its failure modes. Module 03 walks PR #28 commit-by-commit with before/after rubric scores. Module 04 explains the GitHub Actions automation. Module 05 studies the "good-OSS-citizen" contribution pattern — vendor employees opening improvement PRs against adjacent ecosystems without hiding the affiliation. Module 06 is the philosophical center: the recursive-quality thesis that a skill creator reviewing its own skills is the adaptive loop applied reflexively. Module 07 is the score card and 19-source verification matrix. The theme color pair is emerald `#00695C` with signal white `#ECEFF1` — "quality green" chosen to read as pass/fail instrumentation rather than the forest-green palette v1.49.43's WYR used.

**The release is hybrid, not pure content.** v1.49.43 shipped zero tooling touches — WYR was entirely new Research surface. v1.49.44 is different: it writes to `skills/` (live skill files the project uses during its own operation), to `.github/workflows/` (CI machinery that runs on every PR), and to `www/tibsfox/com/Research/TSL/` (the Research surface). The three touches are sequenced in commits to keep the intermediate state valid. Commit `9023ad19f` applies the skill improvements and adds the CI workflow — the smallest, most auditable piece, mergeable on its own. Commit `cd9a17f9a` ships the TSL research project — the documentation layer that depends on the PR having been applied but doesn't modify any previously-touched file. Commit `75f1cbb4b` adds the release-notes README stub. Commit `640889d15` merges dev into main. A bisect through v1.49.43..v1.49.44 finds four meaningful states: (a) skills at v1.49.43 structure + no CI, (b) improved skills + CI workflow, (c) improved skills + CI workflow + TSL research, (d) all of the above + release notes. Each boundary is a clean stopping point. The PR itself (commits `72240ece` and `eceb5e1a` in the original reference) lands as a single unit once merged.

The Research series integration is deliberate. TSL ships alongside the 41st project (WYR, which documented Weyerhaeuser and the question of sovereignty over corporate timberland) and extends the series' pattern of projects pairing well with their neighbors without forcing the linkage. WYR is about the quality of an industry's self-narration; TSL is about the quality of a skill author's self-narration. WYR asks "whose forest is this?" and TSL asks "whose skill is this, and can it prove it knows what it does?" The surface subjects are completely different — timber companies and LLM-oriented skill files — but the thesis rhymes. Both projects treat quality as a property that must be verified rather than declared, and both ship verification matrices as the load-bearing module. The Research series is now dense enough that adjacent projects reinforce each other even when they come from different ecosystems.

**The recursive framing is the thesis.** The project builds a tool that creates, reviews, and composes skills. External reviewers (Tessl) built a different tool that reviews skills using a different rubric. When the external rubric ran against the internal project, five skills scored between 0% and 22%. The options at that point were: dispute the rubric, ignore the findings, or fix what was flagged. The release chose to fix, then document the fix as research, then wire the rubric into the default CI surface so it runs again on every future PR. This is the adaptive learning loop doing its job across organizational boundaries. The project did not previously know that structure was invisible to outside readers of the affected skills; the signal arrived via an outsider; the fix is now part of the project and the measurement is now part of CI. A skill creator whose own skills can pass an external skill review has earned its own name. A skill creator that didn't notice the problem until someone else pointed it out has learned the more valuable lesson: external signal is part of the system, not a disruption to it.

**Honest disclosure is part of the story.** rohan-tessl works at Tessl. The author said so in the PR description, linked to Tessl's documentation for the review engine, and made no attempt to present the contribution as organic. The improvements are measurably better regardless of the affiliation — a +60-point average lift is real whether it came from a volunteer or a vendor employee — but the disclosure is what made the merge decision easy. The good-OSS-citizen pattern (Module 05) is that vendor employees can open improvement PRs against adjacent ecosystems so long as the affiliation is named up front, the improvements stand on their own, and no lock-in is introduced. PR #28 satisfies all three: the affiliation was declared, the improvements are structural (not vendor-specific markup), and the GitHub Actions workflow uses `tesslio/skill-review` as a published, versioned Action — the project could swap in a different reviewer or drop the workflow entirely without touching the skills themselves. Transparency is a feature here; stealth contributions would have raised more questions than they solved. This framing is now the template for how the project handles external tooling PRs going forward.

**The release is small by line count and large by precedent.** Measured by files changed (26), line count (+4,275 / −77, net +4,198), and commit count (4), v1.49.44 is a normal-sized Research release — smaller than several earlier content drops, larger than any pure-patch release. Measured by precedent, it is the first time the project merged an external PR into a release line, the first time external CI was added to the PR gate, the first time a Research project documented the project's own adaptive-learning behavior in public, and the first time five skill files were modified in a single commit without breaking the 3-corrections / 7-day-cooldown / 20%-change-per-refinement bounds set at v1.0. The bounds were respected because PR #28 was a structural fix, not a refinement of semantic content — the math in the MFE skills did not change, the dacp-interpreter's interpretive behavior did not change, and no skill's core description shifted by more than its one-time frontmatter-addition allowance. The release threads the bounded-learning needle cleanly.

**The reader can recover the work from the README alone.** What shipped: five improved skills, one GitHub Actions workflow, one full Research project (12 files, 1,400 research lines, 19 sources). Why it shipped: to apply PR #28's concrete improvements, to make Tessl's review automatic for future PRs, and to document the recursive-quality pattern the interaction revealed. How it was verified: skill files reviewed against the Tessl rubric with before/after scores reported; the GitHub Actions workflow runs on this commit and can be re-run on any PR; the TSL project's Module 07 enumerates 19 sources with confidence levels. What to read next: Module 06 of the TSL project carries the philosophical weight; Module 05 explains why the good-OSS-citizen pattern works; Module 01 names the engine (Tessl) and its author (Guy Podjarny) so the provenance is navigable. The rest of this README gives the structural surface; the TSL research modules give the depth.

---

## Key Features

| Area | What Shipped |
|------|--------------|
| dacp-interpreter skill uplift | `skills/dacp-interpreter/SKILL.md` — 0% → 85% (+85 pts): YAML frontmatter added, six-step structured workflow, explicit error-handling section; the largest single-skill rubric jump in the PR |
| mfe-synthesis skill uplift | `skills/mfe-domains/synthesis/SKILL.md` — 11% → 63% (+52 pts): "Use when…" activation trigger added, five-step workflow, redundant headers removed |
| mfe-unification skill uplift | `skills/mfe-domains/unification/SKILL.md` — 11% → 75% (+64 pts): expanded description (gauge theory, Lie groups, Noether's theorem), five-step workflow |
| mfe-change skill uplift | `skills/mfe-domains/change/SKILL.md` — 22% → 68% (+46 pts): expanded description (derivatives, integrals, ODEs), five-step workflow |
| mfe-emergence skill uplift | `skills/mfe-domains/emergence/SKILL.md` — 22% → 75% (+53 pts): expanded description (chaos, fractals, neural networks), five-step workflow |
| GitHub Actions skill-review workflow | `.github/workflows/skill-review.yml` (22 lines) — runs `tesslio/skill-review` on PRs touching `**/SKILL.md`; non-blocking, `GITHUB_TOKEN`-only, single comment per PR, updated on pushes |
| TSL Research project tree | New directory `www/tibsfox/com/Research/TSL/` with `index.html` (102), `page.html` (203), `mission.html` (57), `style.css` (72) wired into the multi-domain docroot |
| Research module 01 — The Skill Review Engine | `research/01-tessl-platform.md` (218 lines) — Tessl platform profile, Guy Podjarny as founder, provenance of the rubric |
| Research module 02 — What Makes a Good Skill? | `research/02-skill-quality-problem.md` (189 lines) — failure modes (missing frontmatter, no trigger, no workflow, no error handling) and why they make skills invisible |
| Research module 03 — Five Skills, Sixty Points | `research/03-pr28-improvements.md` (211 lines) — commit-by-commit walk of PR #28 with before/after rubric scores for each of the five skills |
| Research module 04 — Automated Quality Gates | `research/04-github-actions-workflow.md` (187 lines) — the `skill-review.yml` design, non-blocking rationale, GITHUB_TOKEN scope analysis |
| Research module 05 — The Good-OSS-Citizen Pattern | `research/05-open-source-contribution.md` (175 lines) — vendor-employee contributions, affiliation disclosure, "improvements stand on their own" test |
| Research module 06 — Recursive Quality | `research/06-recursive-quality.md` (242 lines) — philosophical center; the adaptive loop applied reflexively to the skill creator's own skills |
| Research module 07 — The Score Card | `research/07-verification-matrix.md` (178 lines) — 19-source audit + rubric recap for the TSL project itself |
| Mission-pack triad | `mission-pack/index.html` (296) + `mission-pack/mission.md` (510) + `mission-pack/mission.tex` (950) + pre-rendered `mission-pack/pr28-tessl-review-mission.pdf` (169,532 bytes) |
| Research sidecar | `docs/research/tessl-skill-review.md` (510 lines) — standalone markdown companion readable outside the www tree |
| Quality-green theme | `style.css` pairs `#00695C` (emerald) with `#ECEFF1` (signal white) — reads as pass/fail instrumentation rather than forest/nature |
| Research hub integration | `www/tibsfox/com/Research/index.html` (+10 lines) adds the TSL card to the grove-level index |
| Series navigation | `www/tibsfox/com/Research/series.js` (+1 line) wires TSL into Prev/Next flow; `www/tibsfox/com/index.html` (2 lines) updates hub project count to 42 |
| Four-commit release pattern | Skills commit `9023ad19f` → TSL commit `cd9a17f9a` → docs commit `75f1cbb4b` → merge `640889d15`; each boundary is a clean intermediate state, reviewable and bisect-friendly |

---

## Retrospective

### What Worked

- **PR-driven research is a reusable pattern.** PR #28 arrived as a concrete contribution with measurable results. Turning the PR into a Research project (TSL) captured not just the changes but the methodology, the contributor pattern, and the meta-lesson about recursive quality. The PR is the source material; the research is the second pass that makes the pattern teachable to the next external contributor who shows up.
- **Applying the diff before building the research project kept everything coherent.** The skill improvements landed in `9023ad19f` first (honoring the contributor's work and making the CI workflow immediately useful), then the TSL research project followed in `cd9a17f9a` (adding the documentation layer that depends on the PR having been applied). Clean separation of concerns; neither commit's integrity depends on the other's prose.
- **The recursive quality theme (Module 06) is the strongest insight in the series so far.** A skill creator whose own skills score 0–22% has a credibility problem. A skill creator that accepts external review and applies the findings has a learning system. This is the adaptive learning layer working exactly as designed, and it is now documented as a public pattern rather than an implicit behavior.
- **Non-blocking CI was the correct first-move posture.** Making `skill-review.yml` advisory rather than mandatory kept the merge authority local while still surfacing the audit. If Tessl's rubric becomes trusted over time the gate can be tightened later without reverting the original design decision. Starting soft scales up; starting hard doesn't scale down gracefully.
- **Honest disclosure from the contributor made the merge decision easy.** rohan-tessl said "I work at Tessl" in the PR description. The improvements stood on their own measurably (+60 pts average lift). The combination of transparency + quality meant the review could focus on whether the changes helped the project rather than whether the author had a hidden agenda.
- **The four-commit sequence kept the intermediate state valid.** A reviewer or bisect walker sees four clean boundaries, not a single opaque blob. The skills-and-CI commit is small enough to read; the TSL commit is big but isolated; the docs commit is tiny; the merge commit carries no code. This is how the release cadence is supposed to feel.

### What Could Be Better

- **Five skill files touched in one commit is at the edge of the bounded-learning envelope.** v1.0 set the rule: ≥3 corrections before refinement, ≥7-day cooldown, ≤20% change per refinement. PR #28 is structural (not semantic), so the spirit of the rule is preserved, but five concurrent skill edits in a single commit is still a denser change than the project has previously allowed. A future iteration of the policy should either explicitly exempt structural-only changes or split them into per-skill commits so the cooldown clock resets independently.
- **The release-notes README at release time was stub-quality.** The original v1.49.44 README shipped at 77 lines with only two retrospective bullets, two lessons, and no Cross-References, Engine Position, or Files sections. The chapter files (`00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md`) were parser output at confidence 0.90. The release was real work; the docs layer was a stub. This uplift pass is what closes that gap.
- **The CI workflow's non-blocking stance has no deprecation timeline.** `skill-review.yml` ships as advisory with no written plan for when or how to tighten it. If the rubric proves reliable over twenty PRs, should it become a blocking gate? The release did not commit to that decision, and the absence of a plan means the gate may drift into permanent advisory status by inertia. Module 04 names this risk but does not resolve it.
- **The TSL project's 19 sources is fewer than WYR's 32 and several other recent Research modules.** The subject matter is narrower (one PR, one vendor, one rubric) so the lower count is defensible, but the asymmetry is worth naming. Future meta/reflexive projects should still aim for ≥25 sources to keep parity with the ecology and bioregional modules that set the grain size.

---

## Lessons Learned

- **External review finds what internal review misses.** The project's own review agents audit content quality and semantic correctness. Tessl audits structural quality — frontmatter, triggers, numbered workflows, error handling. Different rubrics find different things. Wiring an external rubric into CI means the project keeps both lenses pointed at new work without having to remember to look through either one manually. This is the lowest-cost way to double the review surface area.
- **Honest disclosure from external contributors is a feature, not a risk.** rohan-tessl worked at Tessl and said so upfront. The improvements stood on their own (+60 pts average). Transparency about affiliation lets the reviewer focus on whether the changes help the project rather than whether the author has hidden motives. Vendor-employee PRs that name the affiliation are *easier* to evaluate than organic contributions where the reviewer has to infer provenance.
- **Structural defects look like content defects until a rubric separates them.** All five skills touched by PR #28 had good content and bad structure. Without a rubric that separately scores frontmatter, triggers, and workflows, the two failure modes blur together and the fix seems like a rewrite. With a rubric, "add a `use_when` field" is a surgical one-line change that moves the skill from 11% to 30%. Rubrics are how you see through the surface of a skill to its shape.
- **The adaptive learning loop works across organizational boundaries.** v1.0's 6-step loop (Observe → Detect → Suggest → Apply → Learn → Compose) does not require the observer and the detector to be inside the same organization. Tessl Observed and Detected; Tibsfox Applied and Learned; the project Composed a Research module out of the interaction. The loop's architecture is organization-agnostic. This is a stronger claim than v1.0 made, and v1.49.44 is the first release to prove it empirically.
- **Make new quality signals advisory first, mandatory later.** Wiring `tesslio/skill-review` into CI as non-blocking keeps the merge authority with the maintainer while still surfacing the new audit. A blocking gate for an unproven third-party rubric would have created merge pressure out of proportion to the signal's reliability. Start advisory, measure the rubric's track record over N PRs, then tighten to blocking if warranted. Reversibility is the property to optimize for at the introduction.
- **Recursive documentation is the endpoint of a learning system.** The project built a tool that creates skills. External reviewers built a tool that reviews skills. When the review tool pointed at the creator tool's own skills, the findings became a Research project about the experience. This is the pattern v1.0's Compose step was designed to enable: the system's self-observation becomes teachable artifacts. TSL is the first Research project that operates at this level of self-reference; every future external-tooling integration should ask whether it has a Research-project-shaped story waiting inside it.
- **A skill without a workflow is a wish; without a trigger, invisible; without error handling, dangerous.** Module 02 of the TSL project compresses the quality rubric into one sentence. Skills are executable prose; treating them as documentation-only files is why they drift. The three minimum structural elements (workflow, trigger, error handling) are the analog of a function signature, a call-site precondition, and a try/except block. A skill missing any of the three is not a skill — it is a note-to-self masquerading as a contract.
- **Verification matrices are now a transferable Research pattern.** WYR shipped the verification-matrix module (Module 08) at v1.49.43. TSL ships the score-card module (Module 07) at v1.49.44 as the equivalent audit artifact for a different subject. The pattern is stable: enumerate every factual claim, cite the source, record the confidence, keep the audit file adjacent to the research it audits. This is now the default module shape for any Research project that depends on external sources, regardless of subject domain.
- **Four-commit release sequencing is the right default for hybrid releases.** Skills/code commit, content commit, docs commit, merge commit — each is a clean intermediate state, each can be reverted independently, each is bisect-addressable. Pure-content releases can collapse to three commits (content + docs + merge); pure-code releases can collapse to two (code + merge). Hybrid releases should stay at four. v1.49.44 demonstrates the shape.
- **External PRs belong in the Research series, not just in the commit log.** The v1.49.22+ Research series is already where the project stores its durable lessons. Adding TSL as the 42nd project means the template for future external-PR releases is "ship the fix + ship a Research project about the fix." This costs one extra module of writing per significant external PR and pays back as a searchable public record of how the project learns from the outside world.

---

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.43](../v1.49.43/) | Predecessor — "Evergreen" (WYR, Weyerhaeuser & Sustainable Timber), the 41st Research project; sets the bark/evergreen two-color theme discipline that TSL inherits with quality-green |
| [v1.49.45](../v1.49.45/) | Successor — next release in the v1.49.x Research cadence |
| [v1.49.42](../v1.49.42/) | Earlier Research project — "The Mote in God's Eye" (TSL naming-space predecessor in the v1.49.x line) |
| [v1.49.38](../v1.49.38/) | Multi-Domain Docroot Refactor — the release that built the `www/tibsfox/com/Research/` slot TSL drops into; first demonstrable velocity payoff at Research project 42 |
| [v1.49.22](../v1.49.22/) | PNW Research Series origin — the release that began the series whose 42nd member ships here |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop; TSL is the first release to prove the loop works across organizational boundaries (external Observe/Detect → internal Apply/Learn/Compose) |
| [v1.1](../v1.1/) | Semantic Conflict Detection — first extension of the Apply step; TSL's recursive-quality framing extends the Learn step the same way |
| [v1.8](../v1.8/) | Capability-Aware Planning — extends the Compose step; TSL's Research-project-as-composed-output is the same Compose pattern applied to release retrospectives |
| [v1.10](../v1.10/) | Security Hardening — TSL's `GITHUB_TOKEN`-only CI workflow design descends from v1.10's credential-isolation stance |
| [v1.25](../v1.25/) | Ecosystem Integration — 20-node dependency DAG; TSL adds `tesslio/skill-review` as the first external CI-time integration and documents the good-OSS-citizen pattern for future additions |
| [PR #28](https://github.com/Tibsfox/gsd-skill-creator/pull/28) | The pull request itself — source of the five skill improvements and the CI workflow |
| `skills/dacp-interpreter/SKILL.md` | Skill file improved from 0% → 85%; the largest single-skill jump in PR #28 |
| `skills/mfe-domains/synthesis/SKILL.md` | Skill file improved from 11% → 63% |
| `skills/mfe-domains/unification/SKILL.md` | Skill file improved from 11% → 75% |
| `skills/mfe-domains/change/SKILL.md` | Skill file improved from 22% → 68% |
| `skills/mfe-domains/emergence/SKILL.md` | Skill file improved from 22% → 75% |
| `.github/workflows/skill-review.yml` | New CI workflow running `tesslio/skill-review` on PRs touching `**/SKILL.md` |
| `www/tibsfox/com/Research/TSL/` | New project tree — 16 new files totaling the TSL Research surface |
| `www/tibsfox/com/Research/TSL/research/` | Seven research modules totaling 1,400 lines — the core narrative of the project |
| `www/tibsfox/com/Research/TSL/mission-pack/` | Mission-pack triad — HTML + markdown + LaTeX + pre-rendered PDF |
| `www/tibsfox/com/Research/TSL/research/07-verification-matrix.md` | Score card + 19-source audit for the TSL project |
| `docs/research/tessl-skill-review.md` | 510-line markdown sidecar readable outside the www tree |
| `www/tibsfox/com/Research/index.html` | Research hub updated (+10 lines) to add the TSL card |
| `www/tibsfox/com/Research/series.js` | Prev/Next navigation updated (+1 line) to wire TSL into the series flow |
| `9023ad19f` | Skills commit — five SKILL.md files + the CI workflow landed atomically |
| `cd9a17f9a` | TSL content commit — 19 files, 4,111 insertions, the whole Research project in one diff |
| `75f1cbb4b` | Docs commit — release-notes stub for v1.49.44 |
| `640889d15` | Merge commit — dev → main for the v1.49.44 tag |

---

## Engine Position

v1.49.44 is the 42nd project in the PNW Research Series and the first release driven by an external pull request. The predecessor, v1.49.43 "Evergreen", shipped WYR as project 41. The successor, v1.49.45, continues the cadence. What makes v1.49.44 structurally novel is not its line count (normal for a Research release) or its commit count (normal for a hybrid release) but its origin: every prior release was initiated inside the project, and this one was initiated outside it. The adaptive-learning loop established at v1.0 explicitly allowed for this — Observe and Detect are not scoped to the project's own agents — but v1.49.44 is the first release that exercises that allowance. Looking backward, v1.49.44 depends on v1.49.38's multi-domain docroot refactor (so TSL can slot in at `www/tibsfox/com/Research/TSL/` without layout work) and on v1.0's skill schema (so PR #28's frontmatter additions have a correct target). Looking forward, v1.49.44 establishes the template for every future external-tooling or external-PR release: apply the diff in one commit, add the CI integration if applicable, ship a Research project documenting the interaction, merge as a four-commit sequence. The Research series is now mature enough that meta-releases about the project's own learning behaviors fit naturally alongside the bioregional and industrial-history modules — the series is a historical atlas of a codebase and its surrounding ecosystem, and TSL is the first module that turns the lens on the codebase's relationship with outsiders.

---

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.43..v1.49.44) | 4 (skills `9023ad19f` + TSL `cd9a17f9a` + docs `75f1cbb4b` + merge `640889d15`) |
| Files changed | 26 |
| Lines inserted / deleted | 4,275 / 77 (net +4,198) |
| Skill files improved | 5 (`dacp-interpreter`, `mfe-synthesis`, `mfe-unification`, `mfe-change`, `mfe-emergence`) |
| Average skill-score lift | +60 percentage points |
| Largest single-skill lift | `dacp-interpreter` 0% → 85% (+85 pts) |
| CI workflows added | 1 (`.github/workflows/skill-review.yml`, 22 lines) |
| Research modules (markdown) | 7 (1,400 lines total across `01`-`07`) |
| Mission-pack files | 4 (`index.html` 296 + `mission.md` 510 + `mission.tex` 950 + PDF 169,532 bytes) |
| Page-shell files | 3 (`index.html` 102 + `page.html` 203 + `mission.html` 57) |
| Stylesheet | 1 (`style.css` 72 lines) |
| Research sidecar (outside www) | 1 (`docs/research/tessl-skill-review.md`, 510 lines) |
| Release-notes README | 1 (77 lines at release time; rewritten by this uplift) |
| Navigation files touched | 3 (`Research/index.html`, `series.js`, hub `index.html`) |
| Sources audited in score card | 19 |
| Theme colors | 2 (`#00695C` emerald, `#ECEFF1` signal white) |
| Research project number in series | 42 |
| External contributor | rohan-tessl @ Tessl (tesslio) |
| Closes | PR #28 |

---

## Files

- `skills/dacp-interpreter/SKILL.md` — 57 lines changed; 0% → 85% on Tessl rubric (YAML frontmatter, six-step workflow, error handling added)
- `skills/mfe-domains/synthesis/SKILL.md` — 21 lines changed; 11% → 63% (trigger, five-step workflow)
- `skills/mfe-domains/unification/SKILL.md` — 21 lines changed; 11% → 75% (gauge theory / Lie groups / Noether description, five-step workflow)
- `skills/mfe-domains/change/SKILL.md` — 21 lines changed; 22% → 68% (derivatives / integrals / ODEs description, five-step workflow)
- `skills/mfe-domains/emergence/SKILL.md` — 21 lines changed; 22% → 75% (chaos / fractals / neural-networks description, five-step workflow)
- `.github/workflows/skill-review.yml` — 22 lines; new GitHub Actions workflow running `tesslio/skill-review` on PRs touching `**/SKILL.md`, non-blocking, `GITHUB_TOKEN`-only
- `www/tibsfox/com/Research/TSL/` — new project root containing `index.html` (102), `page.html` (203), `mission.html` (57), `style.css` (72), `research/`, and `mission-pack/`
- `www/tibsfox/com/Research/TSL/research/01-tessl-platform.md` — 218 lines; Tessl platform profile, Guy Podjarny, provenance
- `www/tibsfox/com/Research/TSL/research/02-skill-quality-problem.md` — 189 lines; failure modes (missing frontmatter / trigger / workflow / error handling)
- `www/tibsfox/com/Research/TSL/research/03-pr28-improvements.md` — 211 lines; commit-by-commit walk with before/after scores
- `www/tibsfox/com/Research/TSL/research/04-github-actions-workflow.md` — 187 lines; CI design, non-blocking rationale
- `www/tibsfox/com/Research/TSL/research/05-open-source-contribution.md` — 175 lines; good-OSS-citizen pattern
- `www/tibsfox/com/Research/TSL/research/06-recursive-quality.md` — 242 lines; the philosophical center of the project
- `www/tibsfox/com/Research/TSL/research/07-verification-matrix.md` — 178 lines; 19-source audit + score card
- `www/tibsfox/com/Research/TSL/mission-pack/index.html` — 296 lines; mission-pack landing page
- `www/tibsfox/com/Research/TSL/mission-pack/mission.md` — 510 lines; mission-pack markdown source
- `www/tibsfox/com/Research/TSL/mission-pack/mission.tex` — 950 lines; mission-pack LaTeX source
- `www/tibsfox/com/Research/TSL/mission-pack/pr28-tessl-review-mission.pdf` — 169,532 bytes; pre-rendered PDF
- `docs/research/tessl-skill-review.md` — 510 lines; standalone research sidecar outside the www tree
- `www/tibsfox/com/Research/index.html` — +10 lines; hub card added for TSL
- `www/tibsfox/com/Research/series.js` — +1 line; Prev/Next wiring
- `www/tibsfox/com/index.html` — 2 lines; top-level hub count update (41 → 42)

Aggregate: 26 files changed, +4,275 insertions, −77 deletions across 4 commits (skills `9023ad19f` + TSL `cd9a17f9a` + docs `75f1cbb4b` + merge `640889d15`), v1.49.43..v1.49.44 window.

---

**Prev:** [v1.49.43](../v1.49.43/) · **Next:** [v1.49.45](../v1.49.45/)

> *A skill creator whose skills can't pass a skill review has a credibility problem. A skill creator that fixes what the review finds has a learning system. Closes [#28](https://github.com/Tibsfox/gsd-skill-creator/pull/28). Thank you, rohan-tessl.*
