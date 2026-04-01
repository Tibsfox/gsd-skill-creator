# Killer App Strategy -- Gaps Update

**Date:** 2026-04-01
**Previous:** 02-killer-app-strategy.md (2026-03-31)
**Status:** Progress assessment + revised gap analysis

---

## Updated Numbers

The original gap analysis was written 2026-03-31. One day later, the project state has shifted:

| Metric | At Gap Analysis (3/31) | Current (4/1) | Delta |
|--------|----------------------|---------------|-------|
| **Skills** | 34 | 69 installed, 43 skill definitions | +35 installed |
| **Commands** | 57 | 57 | -- |
| **Agents** | ~20 | 39 | +19 |
| **Tests** | 21,298 | 21,298 | -- |
| **Research projects** | 190+ | 189 indexed + BLN | +1 (BLN is the largest single project) |
| **360 engine degrees** | 57 | 64 | +7 degrees |
| **SPS releases** | 57 | 64 | +7 releases |
| **Published files** | 2,439+ | 3,213 | +774 files |
| **Docs files** | 435+ | 506 | +71 |
| **Rosetta clusters** | 13 | 14 | +1 (Graphics cluster now has BLN) |
| **Live URLs verified** | tibsfox.com/Research/ | + BLN, OOPS, HEL, constellation all 200 OK | All live |
| **Releases on main** | v1.49.195 | v1.49.203 | +8 releases |

### New Asset: BLN -- Thicc Splines Save Lives

The single largest research project in the series was produced in one session:

- 329-page XeLaTeX textbook PDF
- 106,828 words across 10 research documents
- 132-term glossary across 14 categories
- Furry arts as first-class chapter (14,154 words dedicated)
- History of 3D modeling woven throughout all chapters (18,326-word standalone reference)
- Live at tibsfox.com/Research/BLN/
- Produced via parallel fleet: 5 research agents + 6 chapter expansion agents

This is relevant to every gap.

---

## Gap 1: Discoverability

**Original diagnosis:** "The gap is not content -- it is framing."

### What Changed

| Item | Status | Notes |
|------|--------|-------|
| "Start here" narrative page | NOT STARTED | Still the #1 gap |
| "Journey" page mapping 50 milestones | NOT STARTED | |
| Link milestones to release notes | PARTIALLY DONE | Release notes exist for all milestones, not yet linked in a navigable timeline |
| Highlight top 5 demonstrations | NOT STARTED | But candidates now stronger: BLN textbook joins the list |
| Chain scores published | NOT STARTED | Available in MEMORY.md but not public |
| OOPS research published on tibsfox.com | DONE | 10 docs, HTML/PDF, live and verified 200 OK |
| HEL research published | DONE | 28 docs, HTML/PDF, live |

### Revised Assessment

**Still the biggest gap.** We now have even MORE content (BLN adds 107K words, OOPS adds 53K) but still no entry point. The irony deepens: the project that most needs a "start here" page keeps producing more content that makes the lack of a "start here" page more glaring.

**The top 5 demonstrations are now:**
1. **BLN Thicc Splines Save Lives** -- 329-page textbook produced in one session via 11 parallel agents (NEW)
2. **360 engine** -- 64 autonomous releases and counting
3. **HEL research** -- 28 documents, 91K words, publication quality
4. **OOPS architecture analysis** -- 53K words mapping Claude Code internals
5. **Gastown orchestration** -- 50+ project convoy model

**Revised priority: HIGH. This is the leverage point.** Everything else we build is invisible until this is solved.

### Revised Action Items

1. Build a "start here" landing page at tibsfox.com/Research/ that is NOT the current project index -- it should be a narrative with five "wow" links
2. The BLN textbook is the most shareable artifact we have. A 329-page PDF with a title like "Thicc Splines Save Lives" has natural virality in the furry and Blender communities. Use it as the discoverability wedge.
3. Write a single-page project summary: what this is, what it produced, why it matters. Target: someone can read it in 3 minutes and understand the scope.

---

## Gap 2: Reproducibility

**Original diagnosis:** "The gap is the on-ramp."

### What Changed

| Item | Status | Notes |
|------|--------|-------|
| Quick Start guide | NOT STARTED | |
| 5-skill starter kit | NOT STARTED | But the skill count grew from 34 to 69, making curation more important |
| Skill dependency graph | NOT STARTED | |
| Skill catalog page | NOT STARTED | |
| On-ramp testing with external users | NOT STARTED | |
| GSD upstream v1.30.0 documented | PARTIALLY | Ecosystem alignment doc tracks upstream, no user-facing guide |
| research-engine skill | EXISTS | The research-engine skill was used to produce BLN -- it works |

### Revised Assessment

**Still a critical gap, but the research-engine skill is now a proven on-ramp.** The BLN session demonstrated the complete pipeline: mission pack in, 329-page textbook out. If we can package that as a reproducible workflow ("give Claude Code this mission pack and get a textbook"), we have the most compelling on-ramp possible.

The skill count growing from 34 to 69 actually makes this gap WORSE -- more skills means more surface area to explain. The dependency graph is now essential, not optional.

**New insight:** The on-ramp should not be "install all 69 skills." It should be "install the research-engine skill and produce your first document." One skill, one output, one success. Then expand.

### Revised Action Items

1. Package the BLN mission pack pipeline as a reproducible tutorial: "From mission pack to textbook in one session"
2. Create a 3-tier on-ramp:
   - Tier 1: research-engine skill only (produce a research document)
   - Tier 2: + beautiful-commits + code-review (development workflow)
   - Tier 3: + gsd-workflow + fleet-mission (full orchestration)
3. The Quick Start guide should be a single markdown file, not a multi-page site. Keep it tight.

---

## Gap 3: Engineering Story

**Original diagnosis:** "The gap is navigability."

### What Changed

| Item | Status | Notes |
|------|--------|-------|
| Timeline visualization | NOT STARTED | |
| Top 10 architectural decisions extracted | NOT STARTED | |
| "By the numbers" dashboard | NOT STARTED | But numbers are growing (506 docs, 3213 files, 64 degrees) |
| Decision-to-outcome cross-references | NOT STARTED | |
| Release notes for all milestones | DONE | v1.0 through v1.49.203, all with README.md |

### Revised Assessment

**Unchanged. Still a gap, but lower priority than Gap 1 and Gap 2.** The engineering story is for the second visit -- someone who already knows what the project does and wants to understand how it got here. Gap 1 (discoverability) gets them to the first visit. Gap 2 (reproducibility) gets them to try it. Gap 3 is for retention.

The growing doc count (506 files) makes this gap worse over time. But it's a luxury problem -- the content exists, it just needs navigation.

**One acceleration opportunity:** The OOPS research series IS the engineering story for the Claude Code architecture. If we frame the OOPS docs as "here's what we learned by building the most complex project on this platform," the engineering story tells itself.

### Revised Action Items

1. Deprioritize standalone timeline build. Instead, add a "Project Timeline" section to the "start here" page (Gap 1) with the 10 most important milestones.
2. The chain scores (4.44 to 4.75 over 8 milestones) are the most compelling narrative device. Visualize them.
3. Cross-reference OOPS findings with our architecture decisions: "OOPS doc 03 identified 5 hook improvements -> we implemented X of them in v1.49.Y"

---

## Gap 4: Community

**Original diagnosis:** "The gap is participation structure."

### What Changed

| Item | Status | Notes |
|------|--------|-------|
| Skills-and-Agents GitHub project | EXISTS | Community on-ramp for skill development |
| OPEN research problems | PUBLISHED | 12 unsolved problems on tibsfox.com |
| Contribution guidelines | NOT STARTED | |
| Monthly AI exploration sessions | NOT STARTED | |
| Progress tracking per OPEN problem | NOT STARTED | |
| GSD Discord | EXISTS | /gsd:join-discord command available |
| External contributors | 0 | No external contributions yet |

### Revised Assessment

**The BLN textbook creates a new community vector.** The furry arts community is large, active, creative, and hungry for good Blender resources. A 329-page free textbook with dedicated furry arts coverage, written by someone embedded in the community (Foxy is an active fursuiter and performance artist), has natural distribution potential through:

- FurAffinity, Weasyl, DeviantArt (art communities)
- Furry Blender Discord servers
- VRChat avatar creation communities
- Convention circles (fursuit makers, animators)
- Twitter/X via @TibsDreams

**Distribution channels already in place:**
- **GitHub** — Tibsfox/gsd-skill-creator (open source, release tags, release notes)
- **Twitter/X** — @TibsDreams (309+ posts, Chromatic Threshold)
- **Bluesky** — established presence
- **tibsfox.com** — live research site, BLN project page, PDF download
- **Discord** — GSD community server (/gsd:join-discord)
- **tibsfox.com** links out to all socials — serves as the hub connecting all channels

This is a different community than the Claude Code developer community targeted by the original gap analysis. But it may be a BETTER initial community:

1. They have an immediate need (learn Blender for furry art)
2. The resource is genuinely useful (329 pages, practically focused)
3. The community is tight-knit and shares resources actively
4. Success is visible (someone makes a better avatar or animation)

**New insight:** Community might come from the OUTPUT (the textbook, the research) rather than from the TOOLING (the skills, the orchestration). People don't adopt tools -- they adopt solutions to their problems. The textbook solves a real problem.

### Revised Action Items

1. Share BLN textbook in furry Blender communities. Let the work speak.
2. Add a "How This Was Made" section to the BLN project page explaining the parallel agent pipeline. This connects the output (textbook) to the tooling (research-engine skill) for technically curious visitors.
3. Defer the developer community push until Gap 1 (discoverability) and Gap 2 (reproducibility) are solved. You can't build community around tools people can't find or use.

---

## The Five Moves: Progress Check

| Move | Status | Next Step |
|------|--------|-----------|
| **Move 1: Ship Research Pipeline** | PARTIALLY DONE -- research-engine skill proven on BLN (11 agents, 107K words) | Package as reproducible tutorial |
| **Move 2: Multi-Agent Benchmark** | NOT STARTED | Define benchmark spec |
| **Move 3: Fox Companies Integration** | NOT STARTED | Pilot one domain |
| **Move 4: Open the OPEN Problems** | PUBLISHED, no contributions yet | Create contribution model per problem |
| **Move 5: Document Collaboration Model** | NOT STARTED but BLN session is a perfect case study | Write up the BLN session as case study #1 |

---

## Revised 30-Day Targets (April 2026)

The original 30-day targets were set on 3/31. Revised for current state:

| Action | Original Target | Status | Revised Target |
|--------|----------------|--------|----------------|
| 5 hook improvements from OOPS doc 03 | Session quality 2h -> 4h | NOT STARTED | Keep -- high-value technical work |
| Quick Start guide | 30 min setup for new users | NOT STARTED | Reframe as "mission pack to textbook" tutorial |
| OOPS published on tibsfox.com | Browsable by technical audience | DONE | Complete |
| Ship v1.50 (April 21) | THE milestone | IN PROGRESS | Keep -- 20 days remaining |
| **NEW: Share BLN in furry community** | -- | -- | Natural distribution of the textbook |
| **NEW: "Start here" landing page** | -- | -- | Single most leveraged action for Gap 1 |
| **NEW: BLN session case study** | -- | -- | Documents Move 5 using real evidence |

---

## Priority Stack (Revised)

1. **Ship v1.50** -- April 21 deadline, non-negotiable, deeply personal
2. **Gap 1: "Start here" page** -- Most leveraged single action for discoverability
3. **Gap 4: Share BLN** -- Free distribution through furry community, low effort high impact
4. **Gap 2: Mission-pack-to-textbook tutorial** -- Reproducibility via the most compelling demo
5. **Move 5: BLN case study** -- Documents the collaboration model with hard evidence
6. **OOPS hook improvements** -- Technical debt that compounds session quality
7. **Gap 3: Timeline** -- Fold into "start here" page rather than building standalone
8. **Move 2: Benchmark** -- Defer to post-v1.50

---

## The Insight

The original gap analysis focused on the developer community: people who build on Claude Code. That audience matters, but it is small, hard to reach, and skeptical.

The BLN textbook opened a different door. The furry creative community is large (~2M active members globally), fiercely supportive of free resources, and connected by social bonds rather than professional ones. A free 329-page Blender textbook with dedicated furry arts coverage, produced by an active community member, has organic distribution potential that no amount of developer marketing can match.

The killer app might not be the orchestration layer. It might be what the orchestration layer produces. People don't care about the factory -- they care about the car.

**The textbook is the car.**
