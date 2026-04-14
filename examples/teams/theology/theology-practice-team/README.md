---
name: theology-practice-team
type: team
category: theology
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/theology/theology-practice-team/README.md
description: Pipeline-oriented contemplative-reading team for iterative work with contemplative primary sources across traditions. Pairs the chair with the three contemplative specialists — Rumi for Sufi tradition, Hildegard for Western Christian mysticism, Zhuangzi for Daoist material — plus Huston Smith for comparative framing. Designed for reading one or more contemplative texts closely, noting tradition-specific features, and producing a sober descriptive account of what the text is doing. Not for devotional practice, not for philosophical-theology argument.
superseded_by: null
---
# Theology Practice Team

Pipeline-oriented team for reading contemplative primary sources with attention to what the texts claim about practice, what they require of the practitioner, and how they relate across traditions. Analogous to the `business-practice-team`: diagnose, read, situate, embed in comparative frame.

## When to use this team

- **Contemplative primary-source reading.** When the user wants a careful reading of a specific contemplative text — a Sufi poem, a passage from Hildegard's *Scivias*, a chapter of the *Zhuangzi*, a section of Teresa of Avila's *Interior Castle*.
- **Cross-tradition contemplative comparison.** When the user wants to understand how different contemplative traditions frame a similar concept — apophatic negation, stages of the path, the relation of practice to transformation, the role of imagery.
- **Mapping a contemplative path.** When the user wants to understand the stages or structure of a specific contemplative tradition's account of practice.
- **Iterative reading programs.** When the user is working through a contemplative text over multiple sessions and wants a team that can maintain context.
- **Visionary literature as genre.** When the question involves reading visionary or experiential primary sources with attention to the genre conventions and interpretive layers.

## When NOT to use this team

- **Devotional practice guidance.** The team describes contemplative texts and traditions; it does not provide spiritual direction. Users seeking devotional guidance should work with a living teacher in a specific tradition, not with this team.
- **Doctrinal or philosophical-theology argument.** Use `theology-workshop-team` for that work.
- **Broad multi-tradition doctrinal survey.** Use `theology-analysis-team`.
- **Introductory presentations of contemplative traditions.** Use Huston Smith directly.
- **Psychological or clinical questions about meditation and mental health.** Outside the team's scholarly scope — these questions benefit from a mental-health specialist in collaboration with a tradition-appropriate teacher.

## Composition

Five agents form the practice team:

| Role | Agent | Method | Model |
|---|---|---|---|
| **Chair / Router** | `augustine` | Classification, orchestration, synthesis | Opus |
| **Sufi specialist** | `rumi` | Qur'anic ta'wil, Sufi poetic and prose sources, stages and states | Sonnet |
| **Western Christian mystic specialist** | `hildegard` | Visionary literature, classical three-stage map, Western contemplative primary sources | Sonnet |
| **Daoist specialist** | `zhuangzi` | *Zhuangzi*, *Daodejing*, classical Chinese contemplative register | Sonnet |
| **Comparative pedagogue** | `huston-smith` | Cross-tradition framing, audience adaptation | Sonnet |

The team is four Sonnet agents plus the Opus chair. This reflects the nature of the work — contemplative-text reading is well-defined per-tradition and benefits from faster turnaround; the integrative judgment lives at the chair level.

This team intentionally omits Aquinas and Maimonides (whose strengths are doctrinal-philosophical argument rather than contemplative-text reading). The workshop team is the right destination for scholastic and Jewish philosophical contemplative-theology questions such as Aquinas on the beatific vision or Maimonides on the perfection of the intellect.

## Orchestration flow

```
Input: text(s) or contemplative question + optional prior TheologySession hash
        |
        v
+---------------------------+
| Augustine (Opus)          |  Phase 1: Classify and route
| Chair / Router            |          - which contemplative tradition(s)?
+---------------------------+          - which mode: read / map / compare?
        |
        v
+---------------------------+
| Augustine (Opus)          |  Phase 2: Frame the reading
| Initial frame             |          - what is the text genre?
+---------------------------+          - what is the reading question?
        |
        +--------+--------+--------+
        |        |        |        |
        v        v        v        v
     Rumi    Hildegard  Zhuangzi  (Huston
     (Sufi)  (Western   (Daoist)  Smith
             Christian)            waits)
        |        |        |
    Phase 3: Contemplative specialists work on the
             text(s) or question. Each produces a
             TheologyReading or TheologyExplanation
             Grove record. Augustine activates only
             the relevant subset — typically 1-3.
        |        |        |
        +--------+--------+
                 |
                 v
      +---------------------------+
      | Huston Smith (Sonnet)     |  Phase 4: Comparative frame
      | Frame and adapt           |          - note family resemblances
      +---------------------------+          - note genuine divergences
                 |                           - adapt to user level
                 v
      +---------------------------+
      | Augustine (Opus)          |  Phase 5: Synthesize and record
      | Integrate reading         |          - produce unified reading
      +---------------------------+          - emit TheologySession
                 |
                 v
        Final response + TheologySession Grove record
```

## Practice-team behaviors

### Single-text reading

When the user presents a single contemplative text from one tradition, the team activates the relevant specialist and Huston Smith waits or provides only light framing. The output is a close reading of the text with attention to genre, tradition, stage-map location, and the text's own claims.

### Single-text cross-tradition reading

When the user wants a single text read with an eye on how adjacent traditions treat similar material, the relevant specialist leads and Huston Smith supplies a comparative frame. The output is a reading with the comparative dimension.

### Multi-text comparative reading

When the user wants to compare two or more texts across traditions (e.g., a passage from John of the Cross and a passage from Rumi), two or three specialists work in parallel and Huston Smith integrates. The output preserves each tradition's reading and notes convergences and divergences.

### Stage-map mapping

When the user wants to understand the stages of a specific contemplative path, the tradition specialist produces a map (typically a TheologyExplanation) and Huston Smith notes how this map relates to the other traditions' maps. The output is the specific map plus comparative context.

### Iterative reading program

When a user is working through a contemplative text over multiple sessions, the team maintains continuity via the TheologySession Grove record. Each session builds on the prior one, with the chair providing the continuity and the specialists providing fresh engagement with the next passage.

## Synthesis rules

### Rule 1 — Descriptive posture, firmly held

The team reports what contemplative texts say and how they have been received. It does not prescribe practice. A reader asking "how should I meditate?" receives an account of how different traditions have answered the question, not a recommendation.

### Rule 2 — Genre awareness is load-bearing

Visionary reports, Sufi poetry, scholastic treatments of contemplation, and Daoist parables are different genres. The team reads each in its own genre and refuses to read one as another. Rumi's poetry is not a treatise; Hildegard's visions are not free allegory; the *Zhuangzi* is not a systematic catechism.

### Rule 3 — Tradition-specific vocabulary preserved

Technical terms are kept in their original language with glosses. *Fana* is not "ecstasy." *Ta'wil* is not "interpretation" in the ordinary sense. *Wu wei* is not "passivity." The team resists forced translation.

### Rule 4 — The Katz debate is acknowledged

When the team crosses traditions, the Katz debate on the constructedness of mystical experience is acknowledged (briefly, not belabored). The team does not pretend that cross-tradition convergences prove a common mystical core, and it does not pretend that differences prove the convergences are illusory. It reports both.

### Rule 5 — Integrated vocation is honored

For Hildegard especially, but also for the other traditions' figures, the team resists reducing contemplation to an isolated experience. Hildegard's visions are inseparable from her music, medicine, and preaching. Rumi's poetry is inseparable from his teaching practice and his relationship with Shams. The team notes this integration when relevant.

## Input contract

The team accepts:

1. **Text or question** (required). A contemplative text (with tradition identified if known) or a contemplative-reading question.
2. **Mode hint** (optional). One of: `read`, `map`, `compare`, `iterate`. If omitted, Augustine infers.
3. **User level** (optional). Default: `intermediate`.
4. **Prior TheologySession hash** (optional). Essential for iterative reading programs.

## Output contract

### Primary output: Contemplative reading

A response that:

- Reads the text(s) with tradition-specific care
- Notes genre conventions and interpretive layers
- Places the text in its stage-map or structural context
- Notes convergences and divergences with neighboring traditions
- Adapts to user level without diluting the content
- Remains descriptive throughout

### Grove record: TheologySession

```yaml
type: TheologySession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <user query or text reference>
classification:
  tradition: <tradition(s)>
  domain: mysticism
  complexity: <complexity>
  type: read
  user_level: intermediate
agents_invoked:
  - augustine
  - rumi
  - hildegard
  - huston-smith
work_products:
  - <grove hash of TheologyReading from rumi>
  - <grove hash of TheologyReading from hildegard>
  - <grove hash of TheologyExplanation from huston-smith>
concept_ids:
  - theology-mysticism
  - theology-hermeneutics
user_level: intermediate
posture: descriptive-comparative
```

## Token / time cost

Approximate cost per practice session:

- **Augustine** — 2 Opus invocations (classify + synthesize), ~35K tokens
- **Contemplative specialists** — 1-3 Sonnet invocations, ~25-40K tokens each
- **Huston Smith** — 1 Sonnet invocation, ~15-25K tokens
- **Total** — 100-250K tokens, 5-10 minutes wall-clock

This team is deliberately lighter than the analysis and workshop teams because the work is more focused (one or a small number of contemplative texts) and the specialists are Sonnet-based. This makes it practical for iterative reading programs over multiple sessions.

## Configuration

```yaml
name: theology-practice-team
chair: augustine
specialists:
  - sufi: rumi
  - western-christian: hildegard
  - daoist: zhuangzi
pedagogue: huston-smith

parallel: true
timeout_minutes: 10

# Augustine routes to the relevant subset
auto_skip: true

# Minimum 1 specialist, since single-tradition reading is common
min_specialists: 1
```

## Invocation

```
# Single-text reading (Sufi)
> theology-practice-team: Read the first 35 lines of the Masnavi (the reed flute
  passage) with attention to Islamic and Sufi context. Level: intermediate.

# Cross-tradition reading
> theology-practice-team: Read the "dark night of the spirit" passage from John
  of the Cross alongside Rumi's poetry on the anguish of separation. What do they
  share, where do they genuinely differ?

# Stage-map mapping
> theology-practice-team: Map the classical Sufi stages (maqamat) and compare
  them to the three-stage map of Western Christian contemplation.

# Iterative reading program
> theology-practice-team: (session: grove:abc123) Continue our reading of
  Scivias. Today, the second vision of book one.

# Daoist-focused reading
> theology-practice-team: Read the chapter on the "fasting of the mind" from
  Zhuangzi chapter 4 with attention to the Confucian-Daoist interplay.
```

## Limitations

- **Limited tradition coverage.** The team has three contemplative-tradition specialists (Sufi, Western Christian, Daoist). Eastern Christian hesychasm, Jewish Kabbalah, Theravada and Mahayana Buddhist meditation, Hindu contemplative schools, and indigenous contemplative practices are covered only at the comparative framing level Huston Smith can provide. For specialist-depth work in those traditions, external resources are needed.
- **Not a practical teacher.** The team reads and describes; it does not instruct. Practical contemplative training belongs with a living teacher in a specific tradition.
- **Iterative programs require session continuity.** The TheologySession Grove hash must be provided on follow-up queries or the team starts fresh.
- **The honesty of the descriptive posture has a cost.** Users who want to be told that contemplation "works" or "doesn't work," or that one tradition is better than another, will not be served. The team presents what the traditions claim and how scholars have evaluated those claims.
