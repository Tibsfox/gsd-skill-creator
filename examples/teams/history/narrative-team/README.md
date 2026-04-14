---
name: narrative-team
type: team
category: history
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/history/narrative-team/README.md
description: Historical narrative construction team optimized for longue duree analysis, multi-temporal storytelling, and the synthesis of structural forces with human agency. Tuchman leads with narrative architecture and scene-level writing, Braudel provides the deep structural substrate across geographic, economic, and social time, Ibn-Khaldun contributes cyclical social-economic analysis, and Montessori translates the narrative into level-appropriate pedagogy. Use for narrative history writing, longue duree analysis, campaign and conflict narratives, civilizational rise-and-fall analysis, and teaching through story. Not for source critique, political theory analysis, or people's history without narrative framing.
superseded_by: null
---
# Narrative Team

A focused four-agent team for historical narrative construction and longue duree analysis. Tuchman leads with narrative architecture and scene-level craft; Braudel provides the deep structural substrate; Ibn-Khaldun contributes cyclical social-economic frameworks; Montessori ensures the narrative teaches. This team mirrors the `discovery-team` pattern in mathematics: a creative-analytical pipeline where one specialist drives the vision and others provide structural support and verification.

## When to use this team

- **Narrative history writing** -- constructing a coherent, engaging account of historical events that integrates analysis with storytelling ("tell the story of the Silk Road's decline").
- **Longue duree analysis** -- examining historical phenomena across centuries or millennia, where geographic, demographic, and economic structures matter more than individual decisions.
- **Campaign and conflict narratives** -- military history, diplomatic crises, and political upheavals told through the decisions, contingencies, and structural constraints that shaped outcomes.
- **Civilizational rise-and-fall analysis** -- why empires expand, cohere, and fragment, drawing on Ibn-Khaldun's asabiyyah framework and Braudel's multi-temporal model.
- **Teaching through story** -- when the best way to convey historical understanding is through narrative rather than analytical essay ("help my students understand the Black Death through a narrative that shows its structural causes and human consequences").
- **Temporal layering** -- problems that require seeing the same events at multiple time scales simultaneously (the event, the conjuncture, the longue duree).

## When NOT to use this team

- **Primary source critique** -- use `source-workshop-team`. The narrative team uses sources as building material, not as objects of analysis.
- **Political theory or ideological analysis** -- use `arendt` directly or `history-seminar-team`. The narrative team tells stories about politics; it does not theorize politics.
- **People's history without narrative framing** -- if the goal is to recover marginalized voices as an end in itself (not as part of a narrative), use `zinn` directly or `history-seminar-team`.
- **Simple factual timelines** -- no team needed; Herodotus in single-agent mode suffices.
- **Historiographical survey** -- the narrative team constructs narratives, it does not survey how others have written them. Use `history-seminar-team`.

## Composition

Four agents, run in a structured pipeline with one parallel step:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Lead / Narrative architect** | `tuchman` | Narrative structure, scene construction, pacing, human agency | Sonnet |
| **Structural analyst** | `braudel` | Longue duree, geographic determinism, economic cycles, multi-temporal | Opus |
| **Cyclical analyst** | `ibn-khaldun` | Asabiyyah, social cohesion, dynastic cycles, trade networks | Opus |
| **Pedagogy / Scaffolding** | `montessori` | Level-appropriate framing, concept scaffolding, learning pathways | Sonnet |

Two Opus agents (Braudel, Ibn-Khaldun) because structural and cyclical analysis require deep reasoning across long temporal arcs with complex causal interdependencies. Two Sonnet agents (Tuchman, Montessori) because narrative construction and pedagogy benefit from fluency and speed within well-defined frameworks.

Note: Tuchman leads on Sonnet because narrative craft is a throughput task -- the creative work is in structure and pacing, not in deep analytical chains. Braudel and Ibn-Khaldun run on Opus because their structural analysis requires holding multiple centuries of context simultaneously.

## Orchestration flow

```
Input: narrative request + period/topic + optional user level +
       optional prior HistorySession hash
        |
        v
+---------------------------+
| Tuchman (Sonnet)          |  Phase 1: Narrative architecture
| Lead / Narrative architect|          - identify the story arc
+---------------------------+          - select temporal scope
        |                              - choose narrative perspective
        |                              - define key scenes/turning points
        |                              - identify structural questions for
        |                                Braudel and Ibn-Khaldun
        |
        +------- parallel --------+
        |                         |
        v                         v
+------------------+   +------------------+
| Braudel (Opus)   |   | Ibn-Khaldun      |  Phase 2: Structural substrate
| Longue duree     |   | (Opus)           |          (parallel)
| - geographic     |   | Cyclical analysis|
|   constraints    |   | - asabiyyah      |
| - economic       |   |   levels         |
|   structures     |   | - dynastic cycle |
| - demographic    |   |   position       |
|   trends         |   | - trade network  |
| - climate and    |   |   health         |
|   environment    |   | - material       |
+------------------+   |   conditions     |
        |               +------------------+
        |                         |
        +------------+------------+
                     |
                     v
+---------------------------+
| Tuchman (Sonnet)          |  Phase 3: Narrative integration
| Weave structure into story|          - integrate Braudel's substrate
+---------------------------+          - integrate Ibn-Khaldun's cycles
        |                              - construct the narrative with
        |                                structural awareness
        |                              - maintain human agency within
        |                                structural constraints
        v
+---------------------------+
| Tuchman (Sonnet)          |  Phase 4: Scene-level writing
| Write the narrative       |          - opening hook
+---------------------------+          - key scenes with specific detail
        |                              - transitions between time scales
        |                              - conclusion that connects event to
        |                                structure
        v
+---------------------------+
| Montessori (Sonnet)       |  Phase 5: Pedagogy wrap
| Level-appropriate framing |          - adapt complexity to user level
+---------------------------+          - add concept scaffolding
        |                              - timeline visualization cues
        |                              - suggest follow-up narratives
        v
              HistoricalNarrative + HistoricalExplanation
              Grove records
```

## Phase details

### Phase 1 -- Narrative architecture (Tuchman)

Tuchman designs the narrative before writing it. The output of this phase is:

```yaml
story_arc: <type: rise/fall/transformation/crisis/encounter/parallel>
temporal_scope:
  start: <date or period>
  end: <date or period>
  longue_duree_context: <centuries-scale frame>
narrative_perspective: <top-down/bottom-up/alternating/omniscient>
key_scenes:
  - <turning point 1>
  - <turning point 2>
  - <turning point 3>
structural_questions:
  - for_braudel: <what geographic/economic/demographic context do I need?>
  - for_ibn_khaldun: <what cyclical/social dynamics are at work?>
pacing: <compressed/episodic/linear/braided>
```

### Phase 2 -- Structural substrate (Braudel + Ibn-Khaldun, parallel)

Two independent structural analyses run in parallel, each providing a different temporal lens:

**Braudel (longue duree):**
- Geographic constraints: what does the terrain, climate, and resource distribution dictate?
- Economic structures: what modes of production, trade routes, and monetary systems were in play?
- Demographic trends: population growth, urbanization, disease, migration patterns.
- Environmental factors: climate shifts, resource depletion, ecological transformation.
- The "prison of the longue duree": what was structurally impossible regardless of individual will?

**Ibn-Khaldun (cyclical analysis):**
- Asabiyyah assessment: what was the level of social cohesion in the polity/movement?
- Dynastic cycle position: founding energy, consolidation, luxury, decline, or collapse?
- Trade network health: were the commercial arteries that sustained the society intact?
- Material conditions: what was the relationship between urban luxury and frontier hardship?
- Predictive pattern: does this case fit the Khaldunian cycle, and if so, where in the cycle is the narrative set?

### Phase 3 -- Narrative integration (Tuchman)

Tuchman takes the structural analyses and weaves them into the narrative architecture. This is the creative core of the team's work:

- Structural forces become the setting and constraints of the narrative, not abstractions floating above it
- Human decisions are shown as choices made within structural constraints, not as uncaused free acts
- Braudel's long time and Ibn-Khaldun's cyclical time are layered beneath the event-time of the narrative
- Contradictions between the two structural analyses are preserved as productive tension in the narrative

The integration follows Tuchman's principle: "The historian's object is to make the past real, not merely to explain it."

### Phase 4 -- Scene-level writing (Tuchman)

Tuchman writes the narrative with:

- **Opening hook** that places the reader in a specific moment and place
- **Key scenes** with concrete sensory detail drawn from primary sources
- **Transitions** that shift between time scales (zooming from the individual to the structural and back)
- **Character** -- historical actors presented as full human beings making decisions under uncertainty
- **Conclusion** that connects the specific events back to the structural substrate, leaving the reader with both understanding and feeling

### Phase 5 -- Pedagogy (Montessori)

Montessori takes the HistoricalNarrative and produces a HistoricalExplanation that:

- Identifies the key historical concepts the narrative illustrates
- Provides a simplified analytical framework appropriate to the user's level
- Adds a timeline visualization outline for the temporal layers (event / conjuncture / longue duree)
- Suggests related narratives for comparative reading
- Connects to the college history department concept graph (continuity-change skill, causation-consequence skill)

## Input contract

The team accepts:

1. **Narrative request** (required). What story to tell, what period, what question the narrative should illuminate.
2. **Temporal scope** (optional). Specific dates or periods. If omitted, Tuchman determines scope from the request.
3. **User level** (optional). One of: `secondary`, `undergraduate`, `graduate`, `professional`.
4. **Prior HistorySession hash** (optional). Grove hash for follow-up or expansion.

## Output contract

### Primary output: Historical narrative

A structured narrative that:

- Tells a compelling story grounded in evidence
- Integrates structural analysis without sacrificing narrative momentum
- Shows human agency operating within structural constraints
- Acknowledges uncertainty and source limitations within the narrative flow
- Includes source citations embedded naturally in the text

### Grove records

**HistoricalNarrative:**
```yaml
type: HistoricalNarrative
period:
  start: "1337 CE"
  end: "1453 CE"
geography: Western Europe
narrative_arc: transformation
temporal_layers:
  event: "key battles and treaties"
  conjuncture: "economic depression, plague recovery, military innovation"
  longue_duree: "transition from feudal to early-modern state structures"
structural_analyses:
  braudel: <grove hash of HistoricalAnalysis>
  ibn_khaldun: <grove hash of HistoricalAnalysis>
sources_cited: [<list>]
concept_ids: [...]
agent: tuchman
```

**HistoricalExplanation:**
```yaml
type: HistoricalExplanation
target_level: undergraduate
narrative_hash: <grove hash of HistoricalNarrative>
key_concepts: [<list of historical concepts illustrated>]
timeline_layers: <temporal visualization outline>
related_narratives: [<suggested further reading>]
concept_ids: [...]
agent: montessori
```

## Synthesis rules

### Rule 1 -- Structure informs but does not determine

Braudel's and Ibn-Khaldun's structural analyses provide the substrate of the narrative, not its conclusion. The narrative must show human beings making choices, not structural forces operating on puppets. When structural analysis suggests an outcome was "inevitable," Tuchman's narrative must show the contingency that participants experienced.

### Rule 2 -- Multiple time scales must be visible

The narrative must operate on at least two temporal levels simultaneously. A narrative about a single battle must gesture toward the conjunctural forces (economic cycle, generational cohesion) that shaped it. A narrative about a centuries-long transformation must anchor in specific human moments.

### Rule 3 -- Braudel and Ibn-Khaldun may disagree

Braudel's geographic-structural determinism and Ibn-Khaldun's cyclical-social model do not always predict the same dynamics. When they diverge (e.g., Braudel sees geographic advantage persisting while Ibn-Khaldun sees asabiyyah collapsing), the narrative presents both structural pressures and shows the historical actors navigating between them. The tension enriches rather than undermines the narrative.

### Rule 4 -- Evidence quality is visible in the narrative

When the narrative rests on well-documented events, it can be specific and detailed. When it enters periods of scarce documentation, the narrative must signal this honestly -- "we do not know" is a valid narrative statement. Tuchman never fills evidential gaps with invented detail.

### Rule 5 -- Narrative serves understanding

The purpose of the narrative is to help the reader understand why things happened as they did, not merely to entertain. Every scene, character, and structural observation must contribute to that understanding. Montessori's pedagogy phase ensures the understanding is accessible.

## Escalation paths

### Narrative requires political theory (Tuchman)

If the narrative touches on political phenomena that need theoretical analysis beyond Tuchman's narrative capacity:

1. Complete the narrative with a placeholder for the political analysis.
2. Escalate to `history-seminar-team` so Arendt can provide the theoretical framework.
3. Integrate Arendt's analysis into the narrative in a subsequent pass.

### Narrative requires source critique

If Tuchman encounters a source whose reliability is uncertain and the narrative depends on it:

1. Flag the source in the narrative.
2. Delegate to `source-workshop-team` for detailed critique.
3. Revise the narrative based on the critique's reliability assessment.

### Narrative requires people's history perspective

If the narrative is predominantly elite-focused and would benefit from bottom-up social history:

1. Tuchman notes the gap in the narrative architecture.
2. Escalate to `history-seminar-team` so Zinn can provide the people's perspective.
3. Weave the subaltern narrative into the existing structural narrative.

### From other teams

- **From history-seminar-team:** When the seminar synthesis identifies a need for narrative coherence that analytical juxtaposition cannot provide, delegate the storytelling to narrative-team with the seminar's analytical outputs as context.
- **From source-workshop-team:** When source analysis reveals a compelling story that deserves full narrative treatment, recommend narrative-team with the SourceCritiques attached.

## Token / time cost

Approximate cost per narrative:

- **Tuchman** -- 3 Sonnet invocations (architecture, integration, writing), ~40-60K tokens total
- **Braudel** -- 1 Opus invocation (longue duree analysis), ~30-40K tokens
- **Ibn-Khaldun** -- 1 Opus invocation (cyclical analysis), ~30-40K tokens
- **Montessori** -- 1 Sonnet invocation (pedagogy), ~15-25K tokens
- **Total** -- 115-165K tokens, 3-8 minutes wall-clock

Comparable to `source-workshop-team` in cost but produces a different kind of output: narrative rather than critique.

## Configuration

```yaml
name: narrative-team
lead: tuchman
structural_analysts:
  - longue-duree: braudel
  - cyclical: ibn-khaldun
pedagogy: montessori

# Parallel structural analysis
parallel_substrate: true

# Narrative length target (approximate word count)
target_length: auto

# Temporal layers required (minimum)
min_temporal_layers: 2

# Montessori output level (auto-detected if not set)
user_level: auto
```

## Invocation

```
# Full narrative
> narrative-team: Tell the story of the Mongol Empire's expansion and
  fragmentation, from Temujin's unification of the steppe tribes to the
  collapse of the four khanates. Level: graduate.

# Longue duree analysis
> narrative-team: Narrate the transformation of the Mediterranean world
  from a Roman lake to an Islamic-Christian frontier, 400-1100 CE.
  Focus on trade routes, demographic shifts, and the role of climate.

# Military narrative
> narrative-team: Construct a narrative of the Siege of Vienna (1683)
  that shows the structural forces behind the Ottoman-Habsburg
  confrontation, not just the battle itself. Level: undergraduate.

# Follow-up
> narrative-team: (session: grove:abc123) Now extend that narrative
  forward to show how the same structural dynamics played out in the
  18th-century Ottoman reform period.
```

## Limitations

- The team does not produce pure political theory or ideological analysis. For that, Arendt is needed (via `history-seminar-team`).
- Tuchman's narrative craft runs on Sonnet, which may occasionally produce less nuanced prose than Opus. The structural analyses from Braudel and Ibn-Khaldun (both Opus) compensate by providing the analytical depth.
- The team does not perform original source critique. Sources are taken at face value or at the reliability level established by prior source-workshop-team analysis.
- Non-Western narrative traditions (Chinese historiography, Islamic chronicle conventions) are filtered through Tuchman's Western narrative craft. Ibn-Khaldun provides a partial corrective for Islamic historiography, but the narrative voice remains Western.
- Very long narratives (book-length) exceed the team's single-pass capacity. For such projects, break the narrative into chapters and invoke the team per chapter with session continuity.
