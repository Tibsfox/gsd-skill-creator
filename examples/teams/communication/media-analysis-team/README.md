---
name: media-analysis-team
type: team
category: communication
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/communication/media-analysis-team/README.md
description: Focused media analysis team for understanding how media technologies, platforms, and messages interact to shape communication. McLuhan provides media ecology and platform analysis, Tannen analyzes conversational dynamics within media environments, Aristotle-C applies rhetorical analysis to media messages, and Freire examines power dynamics and critical media literacy. Use for platform analysis, media comparison, propaganda detection, digital communication analysis, or any task where the primary goal is understanding how media shapes communication.
superseded_by: null
---
# Media Analysis Team

Focused media analysis team for understanding the intersection of technology, platforms, and human communication. Combines media ecology (McLuhan), linguistic analysis (Tannen), rhetorical analysis (Aristotle-C), and critical pedagogy (Freire) to produce multi-layered media analyses.

## When to use this team

- **Platform analysis** -- understanding how a specific media technology (TikTok, email, Slack, podcasts) shapes the communication that flows through it.
- **Media comparison** -- evaluating how the same message changes meaning across different media.
- **Propaganda and disinformation analysis** -- detecting persuasive techniques, algorithmic amplification, and structural manipulation in media messages.
- **Digital communication dynamics** -- understanding how online environments create conversational norms, power dynamics, and community formation.
- **Media literacy education** -- designing curricula or workshops that teach critical analysis of media messages.
- **Organizational media strategy** -- advising on which media channels to use for different communication goals.

## When NOT to use this team

- **Pure public speaking** with no media dimension -- use `douglass` directly.
- **Pure argument construction** -- use `debate-team`.
- **Interpersonal communication** that is face-to-face with no media mediation -- use `tannen` directly.
- **Full multi-domain analysis** spanning all six communication domains -- use `communication-workshop-team`.

## Composition

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Media ecologist** | `mcluhan` | Tetrad analysis, hot/cool media, platform effects | Sonnet |
| **Conversational analyst** | `tannen` | Conversational norms within media, style adaptation, cross-cultural dynamics | Sonnet |
| **Rhetorical analyst** | `aristotle-c` | Ethos/pathos/logos in media messages, rhetorical situation analysis | Opus |
| **Critical analyst** | `freire` | Power dynamics, media literacy pedagogy, who benefits and who is silenced | Sonnet |

One Opus agent (Aristotle-C) handles the synthesis and deepest rhetorical analysis. Three Sonnet agents handle the systematic analytical tasks.

## Orchestration flow

```
Input: media/platform/message + user level + optional context
        |
        v
+---------------------------+
| Aristotle-C (Opus)        |  Phase 0: Classification
| Chair / Rhetorical analyst|
+---------------------------+
        |
        +--------+--------+--------+
        |        |        |        |
        v        v        v        v
    McLuhan    Tannen   Aristotle-C Freire
    (ecology)  (convo)  (rhetoric)  (power)
        |        |        |        |
    Phase 1: Parallel analysis
    - McLuhan: tetrad, medium effects, platform affordances
    - Tannen: conversational norms, style effects, community dynamics
    - Aristotle-C: rhetorical techniques, persuasive strategies, ethos/pathos/logos
    - Freire: power dynamics, whose voice is amplified/silenced, structural effects
        |        |        |        |
        +--------+--------+--------+
                     |
                     v
          +---------------------------+
          | Aristotle-C (Opus)        |  Phase 2: Synthesis
          | Merge into unified        |  - Medium effects (McLuhan)
          | media analysis            |  - Communication norms (Tannen)
          +---------------------------+  - Rhetorical strategies (Aristotle-C)
                     |                   - Power dynamics (Freire)
                     v
              +---------------------------+
              | Freire (Sonnet)           |  Phase 3: Critical framing
              | Ensure power analysis     |  - Who benefits?
              | is integrated             |  - Who is silenced?
              +---------------------------+  - What is invisible?
                     |
                     v
              Final media analysis
              + CommunicationSession Grove record
```

## Synthesis rules

### Rule 1 -- Medium first, message second

McLuhan's analysis of the medium's structural effects anchors the synthesis. The rhetorical and conversational analyses are understood within the constraints and affordances the medium creates. A TikTok video's persuasive techniques cannot be analyzed without understanding what TikTok's 60-second format, algorithm, and audience participation structure make possible and impossible.

### Rule 2 -- Conversational norms are medium-specific

Tannen's analysis of conversational dynamics is contextualized to the specific medium. Interruption means something different on a Zoom call than in a meeting room. Silence means something different in a text thread than in a face-to-face conversation. The team does not apply face-to-face norms to mediated communication without adjustment.

### Rule 3 -- Power analysis is always present

Freire's analysis is never optional. Every medium and platform embeds power structures: who can speak, who is heard, whose content is amplified, whose is suppressed, who owns the platform, who profits from the attention. These structural facts are part of the analysis.

### Rule 4 -- Historical context enriches analysis

McLuhan's tetrad includes "retrieves" -- what previously obsolesced form does this medium bring back? Historical context (how did the telegraph change politics? how did radio enable both FDR's fireside chats and fascist propaganda?) enriches analysis of contemporary media by revealing recurring patterns.

## Output contract

### Primary output: Media analysis

A structured analysis containing:

1. **Medium analysis.** Tetrad (enhances, obsolesces, retrieves, reverses). Hot/cool classification. Structural effects on communication.
2. **Conversational dynamics.** How the medium shapes turn-taking, style norms, community formation, and miscommunication patterns.
3. **Rhetorical analysis.** How persuasive techniques operate within and are shaped by the medium. Ethos/pathos/logos as mediated by platform affordances.
4. **Power analysis.** Who benefits from the medium's structure? Whose voice is amplified? Whose is suppressed? Who controls the platform?
5. **Recommendations.** Based on the analysis, what should the user understand, do differently, or investigate further?

### Grove records

- **CommunicationAnalysis** from McLuhan, Tannen, and Aristotle-C
- **CommunicationExplanation** from Freire (for pedagogical framing)
- **CommunicationSession** linking all work products

## Configuration

```yaml
name: media-analysis-team
members:
  - ecology: mcluhan
  - conversational: tannen
  - rhetoric: aristotle-c
  - critical: freire

parallel: true
timeout_minutes: 10
```

## Invocation

```
# Platform analysis
> media-analysis-team: Analyze how Twitter/X's design shapes political
  discourse. Level: graduate.

# Media comparison
> media-analysis-team: Compare how the same news story is communicated via
  newspaper, television, and TikTok. What changes?

# Propaganda detection
> media-analysis-team: Analyze the propaganda techniques in this collection
  of social media posts about a political candidate. [attached].

# Organizational media strategy
> media-analysis-team: Our company communicates via email, Slack, and quarterly
  all-hands meetings. Analyze the strengths and blind spots of this media mix.

# Media literacy curriculum
> media-analysis-team: Design a media literacy unit for high school students
  focused on evaluating health information online.
```

## Limitations

- The team analyzes media *communication effects*, not technical infrastructure (algorithms, recommendation systems, ad auction mechanics). For technical analysis, consult engineering or data science resources.
- Platform-specific analysis is limited to publicly known affordances and documented effects. The team does not have access to proprietary algorithm details.
- Historical media analysis relies on published scholarship. For periods or media with thin scholarly coverage, the team extrapolates from established frameworks.
