# Philosophy Dissolved — Test Plan

**Total Tests:** 42 | **Safety-Critical:** 0 | **Target Coverage:** 90%+

## Test Categories

| Category | Count | Priority | Failure Action |
|----------|-------|----------|---------------|
| Structural integrity | 14 | Required | BLOCK |
| Mathematical rigor | 10 | Required | BLOCK |
| Cross-reference completeness | 6 | Required | BLOCK |
| Narrative quality | 8 | Best-effort | LOG |
| Source text connections | 4 | Required | BLOCK |

## Structural Integrity Tests

Every paradox document must follow the four-beat structure exactly.

| Test ID | Verifies | Expected Behavior | Component |
|---------|----------|-------------------|-----------|
| SI-01 | All 14 paradox docs exist | 14 .md files in correct room directories | All rooms |
| SI-02 | Four-beat structure: Paradox section | Each doc has "## The Paradox" with ≥2 paragraphs presenting strongest philosophical form | All rooms |
| SI-03 | Four-beat structure: Foundation section | Each doc has "## The Foundation" naming specific foundation(s) from 8-layer progression | All rooms |
| SI-04 | Four-beat structure: Resolution section | Each doc has "## The Resolution" with mathematical content, not hand-waving | All rooms |
| SI-05 | Four-beat structure: Architecture section | Each doc has "## The Architecture" connecting to ≥1 GSD component by canonical name | All rooms |
| SI-06 | Self-containment: Raven | hempel-raven.md readable without any other document | Room 1 |
| SI-07 | Self-containment: Theseus | ship-of-theseus.md readable without any other document | Room 2 |
| SI-08 | Self-containment: Chinese Room | chinese-room.md readable without any other document | Room 5 |
| SI-09 | Self-containment: spot check 3 non-flagships | 3 randomly selected non-flagship docs readable without other docs | Rooms 1-5 |
| SI-10 | Room 1 complete | 3 documents in rooms/01-evidence-confirmation/ | Room 1 |
| SI-11 | Room 2 complete | 3 documents in rooms/02-identity-persistence/ | Room 2 |
| SI-12 | Room 3 complete | 3 documents in rooms/03-infinity-motion/ | Room 3 |
| SI-13 | Room 4 complete | 3 documents in rooms/04-decision-prediction/ | Room 4 |
| SI-14 | Room 5 complete | 3 documents in rooms/05-self-reference-emergence/ | Room 5 |

## Mathematical Rigor Tests

Resolutions must use actual mathematics, not philosophical re-argument.

| Test ID | Verifies | Expected Behavior | Component |
|---------|----------|-------------------|-----------|
| MR-01 | Raven: Bayesian calculation | Good's weight-of-evidence formula present with variables defined; Bayes factor for black raven ≈ 2; Bayes factor for white shoe ≈ 1 + N_r/N_nb | Room 1 |
| MR-02 | Raven: Mutual information | I(X;Y) expression present; explanation of why it's ≈ 0 for non-black non-ravens | Room 1 |
| MR-03 | Raven: Amiga Principle theorem | Formally stated with premises and conclusion; Raven Paradox cited as proof | Room 1 |
| MR-04 | Grue: Kolmogorov complexity | Minimum description length argument present; "green" vs "grue" complexity comparison | Room 1 |
| MR-05 | Sorites: Fuzzy membership | Membership function μ(x) ∈ [0,1] present; gradient boundary explained | Room 2 |
| MR-06 | Zeno Dichotomy: Convergent series | Sum 1/2 + 1/4 + 1/8 + ... = 1 explicitly shown | Room 3 |
| MR-07 | Zeno Achilles: Vector intersection | Two trajectory equations; crossing point solved | Room 3 |
| MR-08 | Newcomb: Mutual information | Decision algorithm ↔ predictor model mutual information formalized | Room 4 |
| MR-09 | Surprise Exam: Bayesian updating | Backward induction shown; self-defeating prophecy as fixed-point problem | Room 4 |
| MR-10 | Liar: L-system formalization | Production rule A → ¬A; oscillating sequence shown; Gödel connection stated | Room 5 |

## Cross-Reference Completeness Tests

| Test ID | Verifies | Expected Behavior | Component |
|---------|----------|-------------------|-----------|
| CR-01 | Foundations map: all 8 present | Each of the 8 mathematical foundations appears as resolving framework for ≥1 paradox | foundations-map.md |
| CR-02 | Foundations map: all 14 mapped | Every paradox has ≥1 foundation assigned | foundations-map.md |
| CR-03 | Architecture map: ≥8 connections | At least 8 of 14 resolutions mapped to specific GSD components | architecture-connections.md |
| CR-04 | Architecture map: canonical names | GSD components referenced by their canonical names from existing vision docs | architecture-connections.md |
| CR-05 | No orphan foundations | No foundation appears in foundations-map.md that isn't used in an actual room document | foundations-map.md + rooms |
| CR-06 | No orphan connections | No GSD component appears in architecture-connections.md that isn't referenced in an actual room document | architecture-connections.md + rooms |

## Narrative Quality Tests (Best-Effort)

| Test ID | Verifies | Expected Behavior | Component |
|---------|----------|-------------------|-----------|
| NQ-01 | Steelman quality: Raven | Paradox section presents the strongest version; a philosopher would recognize their own argument | Room 1 |
| NQ-02 | Steelman quality: Chinese Room | Searle's argument presented with full force; not a straw man | Room 5 |
| NQ-03 | Resolution clarity: Raven | A reader with high school math can follow the resolution | Room 1 |
| NQ-04 | Resolution clarity: Zeno | Convergent series argument is intuitively satisfying, not just formally correct | Room 3 |
| NQ-05 | Room coherence: Room 1 | Three documents in Room 1 read as a thematic unit about evidence | Room 1 |
| NQ-06 | Room coherence: Room 2 | Three documents in Room 2 read as a thematic unit about identity | Room 2 |
| NQ-07 | Pack coherence | Reading rooms 1-5 in order tells a story about philosophy → mathematics | All rooms |
| NQ-08 | Through-line present | Amiga Principle thread visible across rooms; not just in Raven | All rooms |

## Source Text Connection Tests

| Test ID | Verifies | Expected Behavior | Component |
|---------|----------|-------------------|-----------|
| ST-01 | Space Between: identity | Ship of Theseus resolution explicitly references "boundary condition" and "standing wave" from the essay | Room 2 |
| ST-02 | Space Between: Spring Terminal | At least one paradox resolution references the Spring Terminal Principle as an information-theoretic argument | Any room |
| ST-03 | Hundred Voices: functorial understanding | Chinese Room resolution references the "system that processes language" argument from the proof | Room 5 |
| ST-04 | Hundred Voices: emergence | At least one Room 5 resolution references emergence as "the thing that could not have been predicted from the rules that produced it" | Room 5 |

## Verification Matrix

| Success Criterion (from Vision) | Test ID(s) | Status |
|--------------------------------|------------|--------|
| 1. All 14 paradoxes have complete four-beat treatment | SI-01 through SI-14 | |
| 2. Every resolution names its mathematical foundation | CR-01, CR-02 | |
| 3. Raven includes Bayesian weight-of-evidence formula | MR-01, MR-02 | |
| 4. Ship of Theseus connects to Space Between identity framework | ST-01, MR-05 | |
| 5. Chinese Room connects to Hundred Voices functorial argument | ST-03, ST-04 | |
| 6. All 8 foundations appear at least once | CR-01 | |
| 7. ≥8 of 14 resolutions mapped to GSD components | CR-03, CR-04 | |
| 8. Amiga Principle formally stated as theorem | MR-03 | |
| 9. No paradox dismissed or trivialized | NQ-01, NQ-02 | |
| 10. Pack reads as coherent narrative | NQ-05 through NQ-08 | |
