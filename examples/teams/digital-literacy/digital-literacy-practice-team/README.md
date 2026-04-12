---
name: digital-literacy-practice-team
type: team
category: digital-literacy
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/digital-literacy/digital-literacy-practice-team/README.md
description: Pipeline-shaped team that turns digital-literacy concepts into repeatable practice. Ito diagnoses where the learner is on the HOMAGO progression, Jenkins identifies the participatory community where the skill will actually get used, Kafai designs the constructionist activity that builds the skill, and Rheingold wraps the sequence with an explanation of what the learner should notice. Use when a learner wants to develop a literacy skill rather than just understand it.
superseded_by: null
---
# Digital Literacy Practice Team

Pipeline-shaped team that converts digital-literacy concepts into concrete practice. Unlike the analysis team (which explains) or the workshop team (which evaluates a specific artifact), the practice team designs a repeatable sequence that the learner can actually do.

## When to use this team

- **A learner wants to develop fluency, not just understanding.** "I know what lateral reading is. How do I actually do it without thinking about it?"
- **A parent or teacher wants a practice plan.** "How do I help my kid develop this habit?"
- **Self-directed learners want an activity they can run alone.** "Give me something I can do this weekend that will make me better at evaluating sources."
- **A team or class is building a habit together.** "Design a week of activities that move students from hearing about this to doing it."
- **A follow-up to an analysis or workshop.** The other teams explain; this team turns the explanation into practice.

## When NOT to use this team

- **Pure information questions.** Use the analysis team or individual specialists.
- **One-shot case evaluation.** Use the workshop team.
- **Foundational explanation requests.** Start with the analysis team; come back for practice after.
- **Technical troubleshooting.** Route to Rheingold for skill-level questions; the practice team is for literacy skills, not computer-operations skills.

## Composition

Four agents in a sequential pipeline with Rheingold coordinating:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Diagnostician** | `ito` | HOMAGO assessment, connected-learning framing | Sonnet |
| **Context finder** | `jenkins` | Participatory community that will hold the practice | Sonnet |
| **Activity designer** | `kafai` | Constructionist activity, level-appropriate | Sonnet |
| **Wrap-up narrator** | `rheingold` | User-facing explanation, next-step guidance | Opus |

Four specialists, three on Sonnet, one Opus wrap-up. The pipeline is cheap, fast, and focused.

## Orchestration flow

```
Input: skill to practice + learner context + optional timebox
        |
        v
+---------------------------+
| Rheingold (Opus, external)|  Phase 0: Classify
| Chair (router)            |          - identify the skill
+---------------------------+          - identify the learner
        |                              - dispatch to practice team
        v
+---------------------------+
| Ito (Sonnet)              |  Phase 1: Diagnose
| HOMAGO assessment         |          Where is the learner now?
+---------------------------+          What is already happening?
        |                              What interest can anchor practice?
        v
+---------------------------+
| Jenkins (Sonnet)          |  Phase 2: Locate
| Participatory community   |          In what community will this
+---------------------------+          skill actually get used?
        |                              What are the community's norms?
        v
+---------------------------+
| Kafai (Sonnet)            |  Phase 3: Design
| Constructionist activity  |          What will the learner make?
+---------------------------+          What is the feedback loop?
        |                              How do they know they improved?
        v
+---------------------------+
| Rheingold (Opus)          |  Phase 4: Narrate and record
| User-facing wrap-up       |          - explain the plan
+---------------------------+          - flag things to notice
        |                              - emit Grove record
        v
                  Practice plan + DigitalLiteracyExplanation Grove record
```

Unlike the analysis team's parallel model, the practice team is sequential by design. Each phase needs the previous phase's output: the activity depends on the community, which depends on the learner's current practice.

## Pipeline output

### Primary output: Practice plan

Structured as:

1. **Where you are** (Ito) -- honest assessment of current practice
2. **Where this skill gets used** (Jenkins) -- the community context
3. **What to do this week** (Kafai) -- the constructionist activity
4. **What to notice** (Rheingold) -- how to know you are improving

### Grove record: DigitalLiteracyExplanation

```yaml
type: DigitalLiteracyExplanation
subtype: practice_plan
skill: lateral_reading
learner_context:
  age: 14
  current_practice: "heavy Reddit and TikTok user, no formal evaluation habit"
homago_assessment:
  current_genre: messing_around
  observation: "Already encountering many sources daily, not treating them as evaluation opportunities."
community_anchor:
  community: "r/OutOfTheLoop and similar explainer subreddits"
  rationale: "Community values accurate summaries; checking sources is a contribution, not a chore."
activity:
  name: "Source check as contribution"
  duration: "one week"
  steps:
    - "Pick three viral posts per day from your normal feed."
    - "For each, spend 60 seconds doing the SIFT lateral move on the top claim."
    - "Write one sentence: 'This checks out / this is wrong / this is mixed -- here is why.'"
    - "Post one of those sentences per day to an OOTL-style subreddit or to a trusted friend."
  feedback_loop: "Community responses + self-review at end of week."
noticing_cues:
  - "Do you reach for the lateral move before reacting?"
  - "Can you name the source's credibility factors without looking them up?"
  - "Are you sharing corrections as confidently as you share agreements?"
next_step: "Repeat for a second week, then bring one case back to the workshop team for deep analysis."
concept_ids:
  - diglit-source-credibility
  - diglit-fact-checking
  - diglit-misinformation-tactics
```

## Input contract

1. **Skill** (required). The literacy skill to practice (e.g., "lateral reading," "evaluating privacy settings," "safe remix attribution").
2. **Learner context** (required). Age, current practice, interests, equipment.
3. **Timebox** (optional). How much time the learner has per day and over what period.

## Escalation paths

- **The learner needs foundational explanation first.** Escalate to the analysis team or individual specialist.
- **The learner needs a specific artifact evaluated.** Escalate to the workshop team.
- **The learner's situation raises safety or equity concerns.** Rheingold flags and routes to boyd/Palfrey for an overlay.
- **The skill is out of scope.** If the "skill" is actually a tool-specific how-to, Rheingold redirects to documentation or the computational-literacy skill.

## Synthesis rules

The practice team does not synthesize across competing framings -- it produces a single coherent plan. The rules instead govern plan quality:

### Rule 1 -- Respect the learner's current practice

Never recommend activities that ignore or override what the learner is already doing. Build on the base; do not bulldoze it.

### Rule 2 -- The activity must have a visible output

Constructionist principle: if there is nothing to make, the activity is weak. The output can be a post, a list, a wiki edit, a video, a spreadsheet -- but there must be something.

### Rule 3 -- The feedback loop must be real

"You will notice you are improving" is not a feedback loop. "You will post this in the community, and see how others respond" is a feedback loop. Kafai does not design activities without real feedback.

### Rule 4 -- One week is the default unit

Practice plans default to a one-week duration, with a re-assessment check. Longer plans happen, but the unit of iteration is small.

## Token / time cost

- **Ito** -- 1 Sonnet invocation, ~20K tokens
- **Jenkins** -- 1 Sonnet invocation, ~20K tokens
- **Kafai** -- 1 Sonnet invocation, ~25K tokens
- **Rheingold** -- 1 Opus wrap-up, ~20K tokens
- **Total** -- 75-100K tokens, 2-5 minutes wall-clock

The cheapest of the three teams. Use it frequently.

## Configuration

```yaml
name: digital-literacy-practice-team
chair: rheingold
pipeline:
  - diagnostician: ito
  - context_finder: jenkins
  - activity_designer: kafai
  - narrator: rheingold

parallel: false
sequential: true
timeout_minutes: 5
```

## Invocation

```
> digital-literacy-practice-team: I know what lateral reading is but I never actually do it. Give me a week-long practice plan. Level: intermediate.

> digital-literacy-practice-team: My 12-year-old wants to get better at spotting misinformation. She spends a lot of time on YouTube and Discord. Design a practice routine.

> digital-literacy-practice-team: (from previous session) Now that we understand algorithmic amplification, give me a practice plan for checking my own feed for bias. Level: advanced.
```

## Limitations

- The practice team produces a plan; the learner has to execute it. The team does not monitor adherence.
- Plans assume the learner has the motivation to actually try. For learners resisting the topic, a different approach (likely an Ito-led connected-learning analysis) is needed first.
- The pipeline does not support real-time adjustment once the plan is delivered. For that, the learner should come back after a week for a re-assessment.
- The output is a rehearsal scaffold, not a credential. Demonstrating fluency to a third party is a different kind of assessment.
