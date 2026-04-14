---
name: book-club-team
type: team
category: reading
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/reading/book-club-team/README.md
description: Interpretive discussion team for deep reading of literary and complex texts. Morrison leads literary analysis (voice, craft, representation), Borges traces intertextual connections and genre relationships, Achebe provides critical and postcolonial perspective, and Clay ensures accessibility across reader levels. Use for book discussions, close reading sessions, cross-text comparison, critical interpretation of literature from diverse traditions, and guided reading experiences for groups or individuals. Not for foundational skill instruction, pure decoding, or information literacy.
superseded_by: null
---
# Book Club Team

An interpretive discussion team for deep reading of literary and complex texts. Four agents bring four distinct critical perspectives to a text, then their readings are synthesized into a rich, multi-layered interpretation. Designed for book discussions, close reading sessions, and guided exploration of literature.

## When to use this team

- **Book discussions** -- close reading of a novel, story, poem, or essay from multiple critical angles.
- **Cross-text comparison** -- how do two or more texts relate, respond to, or revise each other?
- **Critical interpretation** -- applying multiple lenses (formal, postcolonial, intertextual) to the same text.
- **World literature** -- reading texts from diverse traditions with attention to both their own literary context and their cross-cultural connections.
- **Guided reading experiences** -- leading a reader through a complex text with scaffolding and multiple entry points.
- **Text selection** -- recommending texts for a reading group based on thematic connections and diverse perspectives.

## When NOT to use this team

- **Foundational skill instruction** -- phonics, decoding, fluency. Use `literacy-team`.
- **Pure comprehension strategy instruction** -- use `rosenblatt` via `austen`.
- **Source evaluation and research** -- use `achebe` directly or `reading-analysis-team`.
- **Linguistic analysis** without literary interpretation -- use `chomsky-r` directly.

## Composition

Four agents offering four critical perspectives:

| Role | Agent | Perspective | Model |
|------|-------|-------------|-------|
| **Literary analysis lead** | `morrison` | Narrative voice, craft, race, representation | Opus |
| **Intertextuality** | `borges` | Allusion, influence, metafiction, genre | Sonnet |
| **Critical perspective** | `achebe` | Postcolonial, bias, world literature, whose story | Opus |
| **Accessibility & scaffolding** | `clay` | Reader level adaptation, guided reading, scaffolding | Sonnet |

Two Opus agents (Morrison, Achebe) because deep literary and critical analysis requires extended reasoning. Two Sonnet agents (Borges, Clay) because their tasks are well-bounded within the discussion context.

Note: Austen does not participate as a specialist in this team but still serves as CAPCOM for user communication. In practice, Austen classifies, dispatches to the book-club-team, receives the synthesis, and presents it to the user.

## Orchestration flow

```
Input: text + discussion question or "discuss this text"
        |
        v
+---------------------------+
| Morrison (Opus)           |  Phase 1: Set the table
| Literary analysis lead    |          - identify the text's key formal features
+---------------------------+          - name the discussion-worthy elements
        |                              - propose discussion threads
        |
        +------- parallel --------+
        |                         |
        v                         v
+------------------+   +------------------+
| Borges (Sonnet)  |   | Achebe (Opus)    |  Phase 2: Multiple readings
| Intertextual     |   | Critical         |  (parallel)
| connections:     |   | perspective:     |
| - allusions      |   | - whose story?   |
| - genre          |   | - whose silence? |
| - predecessors   |   | - what assumed?  |
| - metafiction    |   | - representation |
+------------------+   +------------------+
        |                         |
        +------------+------------+
                     |
                     v
+---------------------------+
| Morrison (Opus)           |  Phase 3: Synthesize discussion
| Weave readings together   |          - convergences and tensions
+---------------------------+          - what the text looks like from
                     |                   multiple angles simultaneously
                     v
+---------------------------+
| Clay (Sonnet)             |  Phase 4: Adapt for audience
| Level-appropriate output  |          - scaffold for reader level
+---------------------------+          - suggest guided reading approach
                     |                 - discussion questions for groups
                     v
              Discussion synthesis
              + ReadingSession Grove record
```

## Discussion protocols

### The Morrison Opening

Morrison opens every discussion by identifying what makes this text worth discussing. Not a summary -- a provocation. "What is this text doing that demands our attention?" This sets the agenda for the specialist analyses.

### The Three-Lens Reading

Borges and Achebe read the text simultaneously from their respective positions:

**Borges asks:** What other texts does this echo, revise, or refuse? What genre conventions does it honor or subvert? Does the text comment on its own nature as a text?

**Achebe asks:** Whose story is this? Whose is absent? What does the text assume about its reader? How would this text read differently from another cultural position?

These two readings are deliberately independent. They may converge (both identify the same allusion as culturally loaded) or diverge (Borges admires a structural innovation that Achebe identifies as reproducing colonial patterns). Both outcomes are productive.

### The Morrison Synthesis

Morrison weaves the three readings (her own, Borges's, Achebe's) into a conversation, not a conclusion. The synthesis:

- Identifies where the readings converge and what that convergence reveals
- Preserves productive tensions without resolving them
- Names what remains open -- what the text does not answer and should not be forced to
- Offers the reader multiple entry points for further exploration

### The Clay Adaptation

Clay takes the synthesis and adapts it for the target reader level:

- **Emergent/Developing:** Focus on one discussion thread; use concrete examples; provide guided questions that lead toward the key insights.
- **Proficient:** Present 2-3 discussion threads; balance accessibility with analytical depth; provide both guided and open-ended questions.
- **Advanced:** Present the full synthesis with its tensions intact; reference critical frameworks by name; expect the reader to contribute their own readings.

## Input contract

The team accepts:

1. **Text** (required). The literary work, passage, or set of texts to discuss.
2. **Discussion focus** (optional). A specific question or theme to guide the discussion. If omitted, Morrison sets the agenda.
3. **Reader level** (optional). One of: `emergent`, `developing`, `proficient`, `advanced`.
4. **Group context** (optional). Is this for an individual reader, a class, a reading group? Affects the discussion question format.

## Output contract

### Primary output: Discussion synthesis

A multi-perspective discussion of the text that:

- Opens with a provocation (what makes this text worth reading closely)
- Presents formal, intertextual, and critical readings
- Identifies convergences and tensions among the readings
- Offers discussion questions at the appropriate level
- Suggests related texts for further exploration

### Grove records

- **LiteraryInterpretation** from Morrison (formal analysis)
- **LiteraryInterpretation** or **TextAnnotation** from Borges (intertextual connections)
- **ReadingAnalysis** from Achebe (critical perspective)
- **ReadingExplanation** from Clay (adapted discussion guide)
- **ReadingSession** linking all products

## Example discussion structure

For a book club reading Achebe's *Things Fall Apart*:

**Morrison (opening):** The novel opens with a description of Okonkwo's physical power, but it is structured around absences -- his father's absence of achievement, his emotional absence from his own children, and ultimately the absence of the world he knew. What does the novel do with absence?

**Borges (intertextual):** The novel's structure echoes the oral storytelling traditions of Igbo culture -- episodic, proverbial, communal. It also responds to and inverts the colonial adventure novel (Conrad, Kipling): where those novels used Africa as backdrop, Achebe uses it as ground. The title, from Yeats's "The Second Coming," places the novel at the intersection of Western and Igbo literary traditions.

**Achebe (critical):** The novel was written to answer the colonial novel -- to show that African societies before colonialism were complex, internally debated, and fully human. The text does not romanticize Umuofia; it shows a society with its own injustices (the treatment of twins, the caste system of osu). This honesty is its power: it refuses to counter stereotype with idealization.

**Clay (adapted):** For a developing reader: "What do we learn about Okonkwo's world in the first three chapters? What surprises you?" For an advanced reader: "How does the novel's dual audience (African and European) shape its narrative strategies? What does Achebe explain that a Igbo reader would already know?"

## Escalation paths

- **Text requires linguistic analysis:** If the text's difficulty is partly linguistic (archaic language, complex syntax, non-English phrases), request Chomsky-R support via Austen.
- **Reader needs foundational skills:** If the reader's level makes the text inaccessible even with scaffolding, recommend the `literacy-team` for skill-building alongside the book club discussion.
- **Text is outside the team's expertise:** If the text requires domain-specific knowledge (scientific content, mathematical reasoning), acknowledge the boundary and suggest appropriate resources.

## Configuration

```yaml
name: book-club-team
literary_lead: morrison
intertextuality: borges
critical_perspective: achebe
accessibility: clay

parallel_phase: true
timeout_minutes: 12
```

## Invocation

```
# Full discussion
> book-club-team: Discuss the opening chapter of Beloved. Level: advanced.

# Focused discussion
> book-club-team: How does the narrative structure of One Hundred Years of
  Solitude relate to oral storytelling traditions? Level: proficient.

# Cross-text comparison
> book-club-team: Compare the treatment of colonialism in Things Fall Apart
  and Heart of Darkness.

# Reading group guide
> book-club-team: Create a 4-session reading group guide for The Bluest Eye.
  Group: high school juniors, developing to proficient readers.
```

## Limitations

- The team focuses on literary and complex texts. Informational texts and research sources are better served by `achebe` directly or by `reading-analysis-team`.
- The team does not teach foundational reading skills. Readers must be able to decode the text (or have the text read to them) to participate in the discussion.
- Three critical perspectives (formal, intertextual, postcolonial) do not exhaust the possibilities. Feminist, psychoanalytic, Marxist, and other lenses are available through the reading-analysis-team's full roster.
- The team's knowledge is bounded by the agents' training. Highly specialized texts (medieval Japanese poetry, ancient Sumerian literature) are handled at the closest available level of generality.
