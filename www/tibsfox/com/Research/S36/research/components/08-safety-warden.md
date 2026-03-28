
# Retrospective Engine — Component Specification

**Milestone:** Seattle 360 Continuous Artist Release Engine
**Wave:** 3c | **Track:** Sequential (after release published)
**Model Assignment:** Opus
**Estimated Tokens:** ~8K per artist
**Dependencies:** Published release record (all 4 artifacts from Wave 3b) + `TheoryNodeList[N]` + `CollegeLinkList[N]` + `TheoryGenealogy[N]`
**Produces:** `releases/seattle-360/NNN-[slug]/retrospective.md` + `RetrospectiveRecord` in memory


## Objective

After each artist release, extract structured lessons learned in NASA SE format. Identify
what was surprising, what theory connections were stronger/weaker than predicted, which
College nodes are approaching promotion threshold, and what carry items should seed the
next artist's mission. "Done" = `retrospective.md` written to release directory with at
least 1 IMMEDIATE carry item.


## Context

**NASA SE Lessons Learned format (per NPR 7123.1):**
Each lesson has four fields:
1. **Situation** — what was observed (factual, specific)
2. **Root Cause** — why it happened (analytical)
3. **Recommendation** — what should change (actionable)
4. **Carry Item** — how this affects the next N missions (tiered: IMMEDIATE/PATTERN/ARCH)

**Retrospective tiers:**
- **IMMEDIATE** — affects next 1–5 artists (e.g., "The next 3 artists in this genre cluster will benefit from pre-loading the blues scale genealogy context")
- **PATTERN** — affects all artists in a genre quadrant (e.g., "All grunge artists benefit from the drop-D tuning node established at degree 294")
- **ARCHITECTURAL** — affects the engine design itself (e.g., "The theory genealogy compression needs to handle 50+ entries without exceeding 2K summary")

**Promotion candidate trigger:**
When a `conceptId` appears in 5 or more artist releases, it is ready to be promoted from
an individual node to a full College lesson module. The retrospective should note this.


## Technical Specification

### Behavioral Requirements

**MUST:**
- Read all 4 published artifacts from the release directory
- Read `TheoryNodeList[N]` and `CollegeLinkList[N]` for comparison against predictions
- Identify "surprises" — concepts that were stronger/weaker than genre prediction
- Count occurrences of each conceptId in `TheoryGenealogy` → flag promotion candidates
- Generate at least 1 IMMEDIATE carry item per release
- Write `retrospective.md` in NASA SE format with all 4 fields per lesson
- Tag every carry item: CONFIRMED (clearly supported) or INFERRED (probable but uncertain)

**MUST NOT:**
- Generate speculative claims about living artists
- Mark INFERRED items as CONFIRMED
- Write carry items that repeat without new evidence


## Implementation Steps

1. Read all 4 artifacts from `releases/seattle-360/NNN-[slug]/`
2. Load `TheoryNodeList[N]`, `CollegeLinkList[N]`, `TheoryGenealogy[N]`
3. Identify surprises by comparing expected genre-theory mapping vs. actual nodes
4. Check each conceptId in `TheoryGenealogy` for occurrence count ≥5 → promotion candidates
5. Draft NASA SE lessons (minimum 3 lessons for significant releases; 1 for simple)
6. Classify carry items by tier (IMMEDIATE/PATTERN/ARCHITECTURAL)
7. Tag carry items CONFIRMED or INFERRED
8. Write `retrospective.md`
9. Return `RetrospectiveRecord` in memory for component 07

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| RE-01 | Any completed release | retrospective.md present | File exists in release dir |
| RE-02 | Any release | ≥1 IMMEDIATE carry item | carryItems has ≥1 IMMEDIATE |
| RE-03 | Any release | All carry items have 4 NASA SE fields | situation+rootCause+recommendation+carryItem present |
| RE-04 | Artist whose concept appears 5 times | Promotion candidate flagged | promotionCandidates[] non-empty |
| RE-05 | Release with unexpected cross-genre link | Surprise registered | surprises[] non-empty |

## Verification Gate
- [ ] RE-01 through RE-05 pass
- [ ] Every lesson has all 4 NASA SE fields
- [ ] All carry items tagged CONFIRMED or INFERRED
- [ ] retrospective.md validates against RetrospectiveRecord schema

## Safety Boundaries
| Constraint | Boundary Type |
|-----------|---------------|
| No speculative claims about living artists | BLOCK |
| INFERRED items must not be promoted to CONFIRMED without evidence | GATE |


# Carry-Forward Controller — Component Specification

**Milestone:** Seattle 360 Continuous Artist Release Engine
**Wave:** 3d | **Track:** Sequential (final step in loop)
**Model Assignment:** Sonnet
**Estimated Tokens:** ~4K per artist
**Dependencies:** `RetrospectiveRecord` from component 06 + `KnowledgeState[N]` + `TheoryNodeList[N]`
**Produces:**
  - Updated `releases/seattle-360/knowledge-state.json` (full)
  - Updated `releases/seattle-360/theory-genealogy.json`
  - Loop signal: if degree < 359 → trigger Wave 0[N+1]; if 359 → CYCLE-COMPLETE


## Objective

Transform the `RetrospectiveRecord` into the `KnowledgeState[N+1]` that seeds the next
artist's Wave 0. Maintain the theory genealogy, compress the active context summary to
≤2K tokens, write all state files atomically, and trigger the loop. "Done" = all three
state files updated atomically, loop signal emitted, no partial writes.


## Context

The KnowledgeState is the engine's memory across 360 artists. It grows with each release.
Two challenges:
1. **Size management:** At degree 359, the state will reference 360 artists × ~5 concepts
   each = ~1,800 genealogy entries. The full JSON may be 200–300KB. The active summary
   must stay ≤2K tokens to be usable in Wave 0 context.
2. **Carry item fidelity:** Only CONFIRMED carry items from the retrospective enter the
   state. INFERRED items are logged but not carried.

**Active context summary compression:**
The 2K summary should contain:
- Last 5 artists processed (names, degrees, key concepts)
- Top 5 theory concepts by occurrence count
- Current promotion candidates
- IMMEDIATE carry items from last 3 retrospectives
- Total releases complete / remaining

**Atomicity protocol for state files:**
1. Write to temp files: `knowledge-state.json.tmp`, `theory-genealogy.json.tmp`
2. Verify both temp files are valid JSON
3. Rename both atomically (rename, not copy)
4. Verify the renamed files are readable
5. Only then emit loop signal


## Technical Specification

### Behavioral Requirements

**MUST:**
- Filter retrospective carry items: include only CONFIRMED ones in state
- Increment `TheoryGenealogy` entries for every concept in `TheoryNodeList[N]`
- Update `collegeNodeIndex` array with all paths from `CollegeLinkList[N]`
- Compress active summary to ≤2K tokens
- Write state files atomically (temp + rename)
- Emit loop signal with next degree number
- At degree=359: emit CYCLE-COMPLETE, write final summary report

**MUST NOT:**
- Write INFERRED carry items to persistent state
- Allow KnowledgeState to become invalid JSON
- Emit loop signal before atomic write confirmed


## Implementation Steps

1. Load `KnowledgeState[N]`, `RetrospectiveRecord`, `TheoryNodeList[N]`
2. Filter: extract only `CONFIRMED` carry items from RetrospectiveRecord
3. Update `TheoryGenealogy`: for each conceptId in TheoryNodeList, increment occurrence count
4. Update `collegeNodeIndex`: merge all paths from `CollegeLinkList[N]`
5. Update `surpriseRegister`: add new surprises from retrospective
6. Update `tokenLedger`: append this artist's token count
7. Increment `lastCompletedDegree` and `totalReleasesComplete`
8. Generate new `activeSummary` (≤2K tokens)
9. Write temp files → validate JSON → atomic rename
10. If degree < 359: emit `{signal: 'NEXT', degree: N+1}`
11. If degree = 359: emit `{signal: 'CYCLE-COMPLETE'}`; write `final-summary-report.md`

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| CF-01 | RetrospectiveRecord with 2 CONFIRMED + 1 INFERRED | KnowledgeState has 2 carry items | INFERRED excluded |
| CF-02 | degree=359 | CYCLE-COMPLETE signal | signal field = 'CYCLE-COMPLETE' |
| CF-03 | degree=50 | signal={signal:'NEXT', degree:51} | Next degree correct |
| CF-04 | After 100 artists | activeSummary.length ≤ 2000 chars | Compression working |
| CF-05 | Simulated JSON write failure | Temp files cleaned up; error logged | No corrupt state |

## Verification Gate
- [ ] CF-01 through CF-05 pass
- [ ] `knowledge-state.json` validates against schema
- [ ] `theory-genealogy.json` has exactly N+1 entries after N+1 releases
- [ ] `activeSummary` ≤2K tokens always

## Safety Boundaries
| Constraint | Boundary Type |
|-----------|---------------|
| INFERRED carry items must never enter persistent state | ABSOLUTE |
| State files must be valid JSON before rename | ABSOLUTE |


# Safety Warden — Component Specification

**Milestone:** Seattle 360 Continuous Artist Release Engine
**Wave:** 3a | **Track:** Sequential, Critical Path (cannot be bypassed)
**Model Assignment:** Opus (Sonnet/Haiku forbidden for this component)
**Estimated Tokens:** ~6.5K per artist
**Dependencies:** All 4 Wave 2 artifacts + `ArtistProfile[N]`
**Produces:** `SafetySignal` (PASS/GATE/BLOCK) + safety audit log per release


## Objective

Audit all Wave 2 artifacts for attribution accuracy, cultural sensitivity, and protocol
compliance before any publication. Cannot be bypassed. BLOCK findings halt the pipeline
and require human (CAPCOM) review before the engine continues. "Done" = a `SafetySignal`
emitted with full findings list; if PASS, pipeline proceeds; if GATE or BLOCK, pipeline halts.


## Context

The Safety Warden implements four audit types. ALL four run on every release.

**Audit 1: Attribution Audit (SC-01)**
Every biographical claim in Stage 2 of the PDF must have a citation. The warden reads the
source bibliography and cross-checks that every claim in the biography section has a
corresponding citation. Uncited biographical claims = BLOCK.

**Audit 2: Cultural Sensitivity Review (SC-02, SC-03, SC-06, SC-07, SC-08, SC-16)**
- Indigenous attribution: no "Native American" as monolith; nation-specific language required
  where applicable. Duwamish, Muckleshoot, Suquamish are the primary relevant nations.
- Black American attribution: Central District jazz described with explicit Black American
  authorship; no "folk roots" or "blues origins" language without attribution.
- Mia Zapata (The Gits): her 1993 murder treated factually, with dignity.
- Riot grrrl: feminist/political context explicit.
- Living artist privacy: no unverified claims.

**Audit 3: Protocol Compliance (SC-04, SC-05)**
- Living artists: present tense, public record only
- Deceased artists: past tense consistently

**Audit 4: Factual Spot-Check (SC-09)**
Select 3 specific factual claims (year, label, chart position, recording session) and verify
they are internally consistent (e.g., if biography says "released in 1991 on Epic" and
ArtistProfile says "Pearl Jam, Epic, 1990-present" — consistent).

**Signal emission rules:**
- Any BLOCK-level finding → `signal: 'BLOCK'` (even if only one finding is BLOCK)
- Any GATE-level finding but no BLOCK → `signal: 'GATE'`
- All findings ANNOTATE or none → `signal: 'PASS'`
- ANNOTATE findings are included in findings[] but do NOT change PASS to GATE

**CAPCOM escalation:**
When BLOCK is emitted:
1. Write `releases/seattle-360/BLOCKED-[slug].md` with all findings
2. Write to `releases/seattle-360/capcom-queue.json` (CAPCOM review queue)
3. Halt pipeline (do not proceed to Wave 3b)
4. Log: "CAPCOM required for degree N [artist name]. Reason: [finding]"


## Technical Specification

### Behavioral Requirements

**MUST:**
- Run on Opus exclusively (model log must show Opus)
- Run all 4 audit types regardless of findings (no early exit)
- Check every Central District artist for Black American attribution
- Check every Olympia artist for K Records / feminist context
- Check stage 2 biography for citation-per-claim completeness
- Emit SafetySignal with complete findings list
- Write audit log to `releases/seattle-360/safety-audit-log.jsonl`

**MUST NOT:**
- Pass a release with a BLOCK-level finding
- Skip any of the 4 audit types
- Run on Sonnet or Haiku
- Be invoked with a "skip" or "bypass" parameter

**Living vs. deceased determination:**
The Warden uses `ArtistProfile` plus its own knowledge to determine if an artist is living
or deceased. For uncertain cases, emit GATE (not PASS or BLOCK).


## Implementation Steps

1. Load all 4 Wave 2 artifacts: PDF text (extracted), .tex source, index.html, knowledge-nodes.json
2. Load `ArtistProfile[N]`
3. **Audit 1:** Extract bibliography from PDF; cross-check biography section for uncited claims
4. **Audit 2:** Scan for cultural sensitivity issues (Indigenous, Black American, gender/feminist)
5. **Audit 3:** Determine living/deceased status; verify tense usage
6. **Audit 4:** Select 3 factual claims; verify consistency against ArtistProfile
7. Compile findings list with severity (BLOCK/GATE/ANNOTATE) and location
8. Determine signal (BLOCK > GATE > PASS)
9. If BLOCK: write BLOCKED file, update capcom-queue.json
10. Write to safety-audit-log.jsonl
11. Emit SafetySignal


## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| SW-01 | Clean, well-cited release | SafetySignal.signal = 'PASS' | PASS emitted |
| SW-02 | Release with "Native American" language | BLOCK finding SC-02 | BLOCK emitted |
| SW-03 | Release with uncited biographical claim | BLOCK finding SC-01 | BLOCK emitted |
| SW-04 | Release where living status is unclear | GATE finding | GATE emitted |
| SW-05 | Central District artist without Black American attribution | BLOCK finding SC-03 | BLOCK emitted |
| SW-06 | Warden run on Sonnet (test misconfiguration) | Error thrown | Refuses to run; logs model error |
| SW-07 | BLOCK emitted | BLOCKED-[slug].md written | File exists in releases root |
| SW-08 | BLOCK emitted | capcom-queue.json updated | Queue has new entry |
| SW-09 | All 4 audits run | audit_log has 4 entries | 4 audit types in log |

## Verification Gate
- [ ] SW-01 through SW-09 pass
- [ ] Model is Opus in execution log
- [ ] safety-audit-log.jsonl has entry for every release
- [ ] BLOCK never produces published artifacts
- [ ] All 4 audit types confirmed in every log entry

## Safety Boundaries

| Constraint | Boundary Type |
|-----------|---------------|
| BLOCK finding must halt publication | ABSOLUTE |
| Must run on Opus (not Sonnet/Haiku) | ABSOLUTE |
| All 4 audits must run per release | ABSOLUTE |
| Indigenous attribution: nation-specific always | ABSOLUTE |
| CAPCOM escalation on every BLOCK | ABSOLUTE |
| No "bypass" parameter accepted | ABSOLUTE |
