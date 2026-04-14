---
name: genre-team
type: team
category: writing
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/writing/genre-team/README.md
description: Creative genre team for fiction, poetry, and creative nonfiction composition. Le Guin leads fiction and worldbuilding, Angelou leads poetry and memoir, Woolf provides literary analysis and synthesis, and Calkins provides pedagogical scaffolding. Use for creative writing projects, genre-specific composition, form exploration, creative workshops, and genre analysis. Not for argument construction, expository editing, or pure mechanics.
superseded_by: null
---
# Genre Team

A focused four-agent team for creative writing across fiction, poetry, and creative nonfiction. Le Guin leads fiction and worldbuilding; Angelou leads poetry and memoir; Woolf synthesizes and provides literary perspective; Calkins ensures the creative process is supported at the writer's level. This team mirrors the math department's `discovery-team` pattern: a creative pipeline for composition and genre exploration.

## When to use this team

- **Creative writing projects** -- composing fiction, poetry, or creative nonfiction where multiple genre perspectives strengthen the work.
- **Genre-specific composition** -- writing a short story that incorporates poetic compression, or a poem that tells a story.
- **Form exploration** -- "Should this be a poem or an essay? A short story or a lyric essay?" The genre team can help the writer find the right form.
- **Creative workshops** -- workshop sessions focused on imaginative writing, with genre-specific feedback.
- **Genre analysis** -- analyzing how published works use genre conventions and where they subvert them.
- **Hybrid forms** -- prose poetry, verse novel, lyric essay, flash nonfiction. Work that lives between genres.

## When NOT to use this team

- **Argument construction** or expository writing -- use `editing-team` or Orwell directly.
- **Pure editing / mechanics** -- use `strunk` or `editing-team`.
- **Research writing** -- use Orwell + Strunk.
- **Full multi-form workshop** including both creative and editorial perspectives -- use `writers-workshop-team`.

## Composition

Four agents with Le Guin and Angelou as domain leads:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Fiction / Worldbuilding lead** | `le-guin` | Narrative structure, speculative construction, form-content relationship | Sonnet |
| **Poetry / Memoir lead** | `angelou` | Poetic form, sound, rhythm, embodied voice, memoir craft | Sonnet |
| **Literary synthesis** | `woolf` | Cross-genre analysis, synthesis, literary-critical perspective | Opus |
| **Pedagogy / Process** | `calkins` | Creative workshop structure, scaffolding, process support | Sonnet |

One Opus agent (Woolf) for synthesis and literary judgment. Three Sonnet agents for domain-specific composition, analysis, and pedagogy.

## Orchestration flow

```
Input: creative writing query + optional form + optional writer level
        |
        v
+---------------------------+
| Woolf (Opus)              |  Phase 1: Classify
| Determine genre domain    |          - fiction vs. poetry vs. hybrid
+---------------------------+          - composition vs. analysis vs. workshop
        |
        +-------------------+
        |                   |
        v                   v
  Le Guin (Sonnet)    Angelou (Sonnet)
  Fiction craft       Poetry craft          Phase 2: Domain-specific
  - structure         - form & sound            work (parallel when
  - worldbuilding     - rhythm & voice          both domains relevant)
  - character         - imagery
        |                   |
        +-------------------+
                |
                v
+---------------------------+
| Woolf (Opus)              |  Phase 3: Synthesize
| Merge genre perspectives  |          - cross-genre insights
+---------------------------+          - form recommendation
                |
                v
+---------------------------+
| Calkins (Sonnet)          |  Phase 4: Process support
| Level-appropriate framing |          - next steps
+---------------------------+          - exercises
                |                      - workshop plan
                v
          Final creative response
          + WritingSession Grove record
```

## Synthesis rules

### Rule 1 -- The form the piece wants to be

When Le Guin and Angelou both engage with a piece, their perspectives may reveal that the piece is trying to be a form the writer did not intend. A story with compressed, image-heavy prose may want to be a prose poem. A poem with extended narrative may want to be flash fiction. Woolf's synthesis identifies these signals and presents them to the writer as possibilities, not prescriptions.

### Rule 2 -- Sound and structure are not separate

Le Guin attends to narrative structure; Angelou attends to sound and rhythm. In the best creative writing, these are inseparable -- the sound of a sentence enacts its meaning. Woolf's synthesis looks for moments where structure and sound reinforce each other and moments where they work at cross-purposes.

### Rule 3 -- Creativity is not formlessness

Both Le Guin and Angelou insist that creative freedom is enabled by craft, not opposed to it. "Free verse" does not mean "no form" -- it means the form is invented for the piece. "Experimental fiction" does not mean "anything goes" -- it means the experiment is rigorous. Woolf enforces this standard in synthesis.

### Rule 4 -- Meet the creative writer's courage

Creative writing requires vulnerability. Calkins ensures that feedback honors the writer's risk-taking. A developing poet who writes their first villanelle imperfectly has accomplished something harder than a proficient poet who writes their twentieth.

## Input contract

1. **Query** (required). A creative writing prompt, draft, form question, or analysis request.
2. **Form** (optional). Fiction, poetry, memoir, prose poem, flash, hybrid, or unspecified.
3. **Writer level** (optional). `emerging`, `developing`, `proficient`, `advanced`.

## Output contract

### Primary output: Creative response

- Genre-specific craft feedback or composition (Le Guin and/or Angelou)
- Cross-genre synthesis and literary perspective (Woolf)
- Process support and next steps (Calkins)

### Grove record: WritingSession

```yaml
type: WritingSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original request>
classification:
  domain: fiction | poetry | multi-form
  purpose: create | analyze | explore
  complexity: intermediate
  user_level: developing
agents_invoked:
  - woolf
  - le-guin
  - angelou
  - calkins
work_products:
  - <grove hash of WritingDraft>
  - <grove hash of WritingAnalysis>
  - <grove hash of WritingExplanation>
concept_ids:
  - writ-character-development
  - writ-poetry-forms
  - writ-voice-development
user_level: developing
```

## Escalation paths

- **Creative piece needs argument work:** Escalate to `editing-team` for Orwell's argument analysis.
- **Creative piece needs sentence-level tightening:** Escalate to `editing-team` for Strunk's mechanics.
- **Piece spans creative and expository forms:** Escalate to `writers-workshop-team` for full department coverage.

## Configuration

```yaml
name: genre-team
fiction_lead: le-guin
poetry_lead: angelou
synthesis: woolf
pedagogy: calkins

parallel: [le-guin, angelou]  # Domain leads work in parallel when both relevant
timeout_minutes: 10
```

## Invocation

```
# Fiction composition
> genre-team: Write a flash fiction piece about a lighthouse keeper who
  discovers the light has been signaling in a language. Form: flash-fiction.

# Poetry workshop
> genre-team: Here's my draft sonnet. Is the volta working? Level: proficient.

# Form exploration
> genre-team: I have this piece that's part memoir, part poem. I don't know
  what it is. Help me figure out the right form.

# Genre analysis
> genre-team: How does Ocean Vuong blend poetry and memoir in On Earth We're
  Briefly Gorgeous?

# Creative workshop design
> genre-team: Design a workshop session on writing dialogue in fiction.
  Level: developing.
```

## Limitations

- The genre team does not cover expository argument, research writing, or editorial mechanics. Those require the editing team or individual specialists.
- Le Guin and Angelou do not communicate during Phase 2 -- their genre perspectives are synthesized by Woolf afterward.
- Specialized creative forms (screenwriting, playwriting, libretto) are handled at the closest available level of generality.
- The team is strongest for literary fiction and poetry. Commercial genre fiction (thriller, romance) is supported but not specialized.
