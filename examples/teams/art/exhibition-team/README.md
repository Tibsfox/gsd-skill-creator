---
name: exhibition-team
type: team
category: art
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/art/exhibition-team/README.md
description: Exhibition planning and curatorial team for designing art exhibitions, installations, and presentations. Ai Weiwei leads with conceptual framing and site-responsiveness, Leonardo provides integrative vision and project coordination, Albers handles visual design and color strategy for exhibition spaces, and Lowenfeld ensures the exhibition serves its audience through interpretive materials and educational programming. Use for exhibition design, installation planning, curatorial statements, gallery layout, educational programming for exhibitions, and portfolio presentation design. Not for studio art-making, single-artwork analysis, or routine technique instruction.
superseded_by: null
---
# Exhibition Team

A focused four-agent team for exhibition planning, curatorial practice, and art presentation design. Ai Weiwei leads conceptual framing and site-responsive thinking, Leonardo provides integrative vision and coordination, Albers handles visual design for the exhibition environment, and Lowenfeld ensures the exhibition communicates effectively to its intended audience.

## When to use this team

- **Exhibition design** -- planning a gallery show, selecting and sequencing artworks, designing the viewer's path through the space.
- **Installation planning** -- designing site-specific installations, determining how a work interacts with its environment.
- **Curatorial statements** -- writing exhibition concepts, wall text, catalog essays, and press materials.
- **Gallery layout** -- determining hanging height, spacing, lighting, grouping logic, and traffic flow.
- **Educational programming** -- designing docent tours, gallery guides, interactive elements, and educational handouts.
- **Portfolio presentation** -- designing how a body of work is presented, whether physically or digitally.

## When NOT to use this team

- **Studio art-making** -- use `studio-team`.
- **Single-artwork deep analysis** -- use `art-critique-team` or a single specialist.
- **Routine technique instruction** -- use the appropriate specialist directly.
- **Art-historical research** with no exhibition application -- use Kahlo or Ai Weiwei directly.

## Composition

| Role | Agent | Focus | Model |
|------|-------|-------|-------|
| **Conceptual lead** | `ai-weiwei` | Curatorial concept, site-responsiveness, conceptual framing | Sonnet |
| **Integrator** | `leonardo` | Cross-domain coordination, synthesis, project coherence | Opus |
| **Visual design** | `albers` | Color strategy, spatial design, visual hierarchy in the exhibition environment | Sonnet |
| **Audience specialist** | `lowenfeld` | Interpretive materials, educational programming, accessibility | Sonnet |

One Opus agent (Leonardo) handles integration and synthesis. Three Sonnet agents (Ai Weiwei, Albers, Lowenfeld) handle their focused domains.

## Orchestration flow

```
Input: exhibition brief or curatorial question + context + user level
        |
        v
+---------------------------+
| Ai Weiwei (Sonnet)        |  Phase 1: Conceptual frame
| What is this exhibition   |          - curatorial thesis
|   about?                  |          - site analysis
+---------------------------+          - conceptual narrative
        |
        +--------+--------+
        |        |        |
        v        v        v
    Leonardo   Albers   Lowenfeld
    (integrate)(design)  (audience)
        |        |        |
    Phase 2: Specialists work in parallel
             Leonardo: artwork selection and sequencing
             Albers: color, lighting, and spatial design
             Lowenfeld: interpretive strategy and accessibility
        |        |        |
        +--------+--------+
                 |
                 v
        +---------------------------+
        | Leonardo (Opus)           |  Phase 3: Synthesize
        | Merge into exhibition plan|
        +---------------------------+
                 |
                 v
          Exhibition plan output
          + ArtSession Grove record
```

## Exhibition Design Framework

### 1. Conceptual thesis

Every exhibition needs a thesis -- a one-sentence statement of what the exhibition argues or reveals. "This exhibition traces the influence of Japanese woodblock prints on French Impressionism through 30 paired works" is a thesis. "A collection of nice paintings" is not.

Ai Weiwei leads this phase because curatorial practice is a conceptual discipline: the curator makes an argument through the selection and arrangement of artworks, just as an author makes an argument through the selection and arrangement of words.

### 2. Site analysis

How does the exhibition space shape the possible experience? Key factors:

- **Architecture:** Ceiling height, wall length, natural light, floor surface, adjacency of rooms.
- **Traffic flow:** How do visitors enter, move through, and exit? Linear (one path), radial (central hub with branches), or free-flow (open plan)?
- **Context:** What institution houses the exhibition? What expectations does the audience bring?
- **Constraints:** Budget, timeline, installation crew, security requirements, accessibility standards.

### 3. Artwork selection and sequencing

Leonardo coordinates the selection process:

- **Selection criteria:** Does this work support the curatorial thesis? Does it add something the other selected works do not? Does it work at the available scale (wall size, pedestal space)?
- **Sequencing logic:** Chronological, thematic, formal (color, scale, medium), dialogic (pairs that speak to each other), or narrative (building toward a climax).
- **Pacing:** Vary scale, intensity, and density. A room of 50 small drawings has a different rhythm than a room with one monumental painting. Both can work; the choice must serve the thesis.

### 4. Spatial and visual design

Albers handles the visual environment:

- **Wall color:** Most galleries default to white, but wall color is a curatorial decision. A warm gray wall changes how every painting reads. A dark wall creates intimacy. Color choices should serve the art, not compete with it.
- **Lighting:** Direction, intensity, and color temperature of light transform the viewing experience. Daylight-balanced LED at 2700-3000K for paintings; dramatic spots for sculpture; ambient washes for installations.
- **Hanging strategy:** Standard museum height (center at 57-60 inches), salon-style (floor to ceiling), or site-responsive (determined by the specific work and space).
- **Spacing:** Works need breathing room. Crowded hanging diminishes individual pieces; over-spacing wastes the narrative flow.

### 5. Interpretive materials

Lowenfeld designs the educational layer:

- **Wall text:** Title cards (artwork identification), extended labels (150-200 words per key work), and introductory panels (200-300 words per room or section).
- **Gallery guide:** A printed or digital handout that provides the curatorial thesis, highlights key works, and offers discussion questions.
- **Educational programming:** Docent tour scripts, family activity guides, school group lesson plans.
- **Accessibility:** Large-print labels, audio description, tactile elements for visually impaired visitors, seating for elderly visitors, and plain-language alternatives to art-critical jargon.

## Input contract

The team accepts:

1. **Exhibition brief or question** (required). A description of the exhibition to plan, or a curatorial question to address.
2. **Context** (required). Space description, available artworks, audience, budget, timeline.
3. **User level** (required). One of: `beginner`, `intermediate`, `advanced`, `professional`.

## Output contract

### Primary output: Exhibition plan

A structured response that includes:

- Curatorial thesis
- Site analysis and space utilization plan
- Artwork selection and sequencing logic
- Visual design recommendations (wall color, lighting, hanging strategy)
- Interpretive materials outline
- Educational programming suggestions

### Grove record: ArtSession

Leonardo produces an ArtSession record linking the exhibition plan to the college concept graph.

## Configuration

```yaml
name: exhibition-team
lead: ai-weiwei
integrator: leonardo
specialists:
  - visual_design: albers
pedagogy: lowenfeld

parallel: true
timeout_minutes: 15
auto_skip: false
min_specialists: 2
```

## Invocation

```
# Exhibition design
> exhibition-team: Design a small gallery exhibition (3 rooms, 20 works) on
  the theme of "Water in Art" spanning Japanese prints, Impressionism, and
  contemporary photography. Context: university gallery, general public audience.
  Level: professional.

# Installation planning
> exhibition-team: Plan the installation of a 10-foot sculpture in a lobby
  space with two glass walls and one solid wall. The sculpture is organic
  bronze. Level: advanced.

# Curatorial statement
> exhibition-team: Write a curatorial statement for a student exhibition of
  self-portraits in mixed media. 15 works by intermediate students.
  Level: intermediate.

# Portfolio presentation
> exhibition-team: Help me design the layout for my graduate portfolio
  presentation — 12 paintings, 8 drawings, and a sketchbook. Level: advanced.
```

## Limitations

- The team does not include studio-making agents (O'Keeffe, Kahlo's studio practice). If the exhibition requires new artwork creation, escalate to studio-team.
- Architectural design beyond basic spatial planning is outside the team's scope. Complex installations may require architectural consultation.
- Budget estimation and logistics (shipping, insurance, framing) are practical matters the team can outline but not execute.
