# Calibration Loops & Quality Metrics

> **Domain:** Feedback Systems and Continuous Improvement
> **Module:** 4 -- Score-Refine-Rescore Cycles, Taxonomy Enrichment, ROI Tracking
> **Through-line:** *Calibration is the art of making measurement meaningful. A thermometer that reads 72 degrees doesn't become useful until you know whether it's measuring Fahrenheit or Celsius, whether it was calibrated recently, and whether the thing it's measuring actually matters to your decision.* Skill quality scoring becomes a calibration instrument when it feeds back into the system that creates and refines skills -- when measurement drives improvement, not just reporting.

---

## Table of Contents

1. [The Calibration Concept](#1-the-calibration-concept)
2. [Score-Refine-Rescore Cycle](#2-score-refine-rescore-cycle)
3. [Feedback Category Classification](#3-feedback-category-classification)
4. [Category Inference from Context](#4-category-inference-from-context)
5. [The Correction Pipeline](#5-the-correction-pipeline)
6. [Gotcha vs Correction Distinction](#6-gotcha-vs-correction-distinction)
7. [Pattern Recognition in Feedback](#7-pattern-recognition-in-feedback)
8. [Convention Injection](#8-convention-injection)
9. [Skill Metrics Schema](#9-skill-metrics-schema)
10. [Activation Rate Tracking](#10-activation-rate-tracking)
11. [Correction Rate Analysis](#11-correction-rate-analysis)
12. [Token ROI Calculation](#12-token-roi-calculation)
13. [Trend Analysis and Arrows](#13-trend-analysis-and-arrows)
14. [The Insights Command](#14-the-insights-command)
15. [Score History Correlation](#15-score-history-correlation)
16. [Refinement Decision Matrix](#16-refinement-decision-matrix)
17. [The Self-Improving Ecosystem](#17-the-self-improving-ecosystem)
18. [Cross-References](#18-cross-references)
19. [Sources](#19-sources)

---

## 1. The Calibration Concept

In metrology -- the science of measurement -- calibration is the process of comparing a measurement instrument's output against a known standard, then adjusting the instrument until its readings align with the standard. The standard itself must be traceable to a reference of known accuracy [1].

Skill quality scoring becomes a calibration loop when three conditions hold:

1. **The measurement is quantitative.** The 100-point score produces a number, not a vague assessment
2. **The measurement is repeatable.** Given the same filesystem state, the score is identical
3. **The measurement feeds back.** Low scores trigger refinement; refinement is re-measured

Without condition 3, scoring is passive reporting. With condition 3, scoring becomes an active improvement mechanism. The integration between Caliber's scoring infrastructure and gsd-skill-creator's refinement engine closes this loop [2].

```
THE CALIBRATION LOOP
================================================================

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │    SCORE     │ ──> │   ANALYZE    │ ──> │    REFINE    │
  │ (determine.  │     │ (identify    │     │ (apply       │
  │  100-pt LLM- │     │  failing     │     │  bounded     │
  │  free score) │     │  checks,     │     │  changes)    │
  └──────┬───────┘     │  fix data)   │     └──────┬───────┘
         |             └──────────────┘            |
         |                                         |
         |             ┌──────────────┐            |
         +─────────────│   RE-SCORE   │ <──────────+
                       │ (verify      │
                       │  improvement │
                       │  or revert)  │
                       └──────────────┘

  INVARIANT: post_score >= pre_score (or revert)
  This invariant guarantees monotonic quality improvement.
  No refinement can make a skill worse by measured quality.
```

> **Related:** [Caliber Architecture](01-caliber-architecture-analysis.md) Section 9 for the score regression guard, [GSD Architecture](02-gsd-skill-creator-architecture.md) Section 9 for bounded refinement

---

## 2. Score-Refine-Rescore Cycle

The full cycle integrates Caliber's scoring with gsd-skill-creator's refinement:

| Phase | System | Input | Output |
|-------|--------|-------|--------|
| Score | score-engine.ts | SKILL.md on disk | SkillScore object |
| Analyze | score-engine.ts | SkillScore | FailedChecks + FixData |
| Accumulate | feedback-store.ts | User corrections | FeedbackEntry[] |
| Gate | refinement-engine.ts | Entry count + constraints | Refinement proposal |
| Pre-score | score-engine.ts | Current SKILL.md | pre_score |
| Refine | refinement-engine.ts | FixData + corrections | Proposed SKILL.md |
| Post-score | score-engine.ts | Proposed SKILL.md | post_score |
| Decide | refinement-engine.ts | post >= pre? | Apply or revert |
| Record | pattern-store.ts | Score + operational metrics | skill-metrics.jsonl |

The cycle is self-regulating through three feedback mechanisms:

**Positive feedback:** High-quality refinements increase scores, which pass the regression guard, which get applied, which improve operational metrics, which feed back as positive signal to the pattern detector [3].

**Negative feedback:** Low-quality refinements decrease scores, which fail the regression guard, which get auto-reverted, which generates a log entry, which informs the developer that the correction pattern may need reconsideration [3].

**Neutral damping:** Refinements that produce equal scores (neither improvement nor regression) are still presented to the user because they may improve operational quality without changing structural quality. A trigger refinement from `*.ts` to `src/**/*.ts` might score identically but activate more precisely [3].

---

## 3. Feedback Category Classification

When a user correction is captured by the session observer, it must be classified into one of six categories. Classification determines how the correction flows through the system [4].

| Category | Refinement Trigger? | Correction Count? | Special Handling |
|----------|:---:|:---:|---|
| `correction` | Yes | Yes | Standard refinement pipeline |
| `gotcha` | No | No | Stored for session context injection |
| `fix` | Yes | Yes | Tagged for error-message matching |
| `pattern` | No | No | Feeds pattern detector, not refinement |
| `env` | No | No | Stored for environment-specific context |
| `convention` | No | No | Injected into generation prompts |

The distinction matters operationally. A `gotcha` entry ("this skill doesn't work in WSL because file watchers behave differently") should not trigger refinement -- the skill is correct, the environment is unusual. A `correction` entry ("this skill suggested the wrong import path") should trigger refinement -- the skill is wrong and needs updating [4].

---

## 4. Category Inference from Context

The feedback detector (`src/learning/feedback-detector.ts`) infers category from the correction context using structural heuristics:

```
CATEGORY INFERENCE -- DECISION TREE
================================================================

  User correction captured:
       |
       v
  Contains error message or stack trace?
    YES → category: FIX
    NO  ↓

  References environment (OS, shell, WSL, Docker, CI)?
    YES → category: ENV
    NO  ↓

  References project convention (naming, style, structure)?
    YES → category: CONVENTION
    NO  ↓

  Describes unexpected behavior (not wrong, just surprising)?
    YES → category: GOTCHA
    NO  ↓

  Describes a reusable solution pattern?
    YES → category: PATTERN
    NO  ↓

  Default → category: CORRECTION
```

The heuristics use keyword matching and structural analysis, not LLM inference, for the initial classification. The developer can override the inferred category during review. Over time, override patterns themselves become training data for improving the heuristic accuracy [5].

The default to `CORRECTION` is deliberate -- it's the most conservative category (triggers refinement). If the heuristic is wrong, the refinement pipeline's other gates (3-correction minimum, 20% cap, 7-day cooldown, score regression) prevent bad outcomes. Misclassifying a `gotcha` as a `correction` wastes one correction count slot but doesn't produce a harmful refinement [5].

---

## 5. The Correction Pipeline

When a correction-category feedback entry is recorded:

```
CORRECTION PIPELINE
================================================================

  User makes correction
       |
       v
  feedback-detector.ts classifies entry
       |
       v
  feedback-store.ts records entry with category
       |
       v
  correction_count = feedback-store.countByCategory(
    skillName, FeedbackCategory.CORRECTION
  ) + feedback-store.countByCategory(
    skillName, FeedbackCategory.FIX
  )
       |
       v
  correction_count >= 3?
    NO  → Wait for more corrections
    YES → Check cooldown
       |
       v
  cooldown_elapsed?
    NO  → Wait for cooldown
    YES → Generate refinement proposal
       |
       v
  proposed_change_percent <= 20%?
    NO  → Scale down or suggest regeneration
    YES → Score regression check
       |
       v
  post_score >= pre_score?
    NO  → Auto-revert, log regression
    YES → Present to user with delta
       |
       v
  User confirms?
    NO  → Discard refinement
    YES → Apply, backup, record metrics
```

Only `correction` and `fix` categories count toward the 3-correction minimum. `gotcha`, `pattern`, `env`, and `convention` entries are stored and used for other purposes but do not accumulate toward refinement triggers [6].

---

## 6. Gotcha vs Correction Distinction

The distinction between `gotcha` and `correction` is the most important classification decision. Getting it wrong in either direction has consequences [7]:

**False positive (gotcha classified as correction):** The refinement engine accumulates an entry toward the 3-correction threshold for a skill that is actually correct. If three environment-specific issues are all misclassified as corrections, the engine proposes a refinement to a correct skill. The score regression guard may catch this (environment-specific changes unlikely to improve structural score), but it's wasted work.

**False negative (correction classified as gotcha):** A genuine skill deficiency is filed away as an environment quirk. The correction count doesn't increment. The skill remains broken until enough correctly-classified corrections accumulate. The developer experiences repeated failures without improvement.

The conservative default (classify as `correction`) biases toward false positives, which are caught by downstream gates. False negatives are harder to catch because they prevent the pipeline from activating at all [7].

```
GOTCHA vs CORRECTION -- OPERATIONAL DISTINCTION
================================================================

  GOTCHA example:
    Skill: "typescript-patterns"
    Observation: "Skill suggested Array.flat() but project
                  targets ES2015 which doesn't support it"
    Why GOTCHA: The skill is correct in general; the issue is
    the project's ES target constraint, which is environment-
    specific. Other projects using this skill won't hit this.

  CORRECTION example:
    Skill: "typescript-patterns"
    Observation: "Skill suggested interface keyword but this
                  project uses type aliases exclusively per
                  team convention"
    Why CORRECTION: The skill is giving wrong advice for its
    target context. The trigger matched correctly (this IS a
    TypeScript project), but the advice doesn't match the
    project's actual patterns.
```

---

## 7. Pattern Recognition in Feedback

`pattern` entries are feedback that describes a reusable solution rather than a skill deficiency. They feed the pattern detector rather than the refinement engine:

| Source | Destination | Purpose |
|--------|-------------|---------|
| `pattern` entry in feedback-store | Pattern analyzer | New skill candidate |
| `correction` entry in feedback-store | Refinement engine | Existing skill improvement |

A pattern entry like "I always run `git stash` before `npm run build` to avoid build artifacts" doesn't indicate a skill problem -- it indicates a *missing* skill. The pattern detector should recognize this as a candidate for a new "build-preparation" skill [8].

---

## 8. Convention Injection

`convention` entries are injected into LLM prompts during skill generation and refinement:

```
CONVENTION INJECTION -- PROMPT ENRICHMENT
================================================================

  Base generation prompt:
    "Generate a TypeScript patterns skill for this project."

  With convention injection:
    "Generate a TypeScript patterns skill for this project.

     PROJECT CONVENTIONS (from session learnings):
     - Use type aliases, not interfaces (convention)
     - Prefer named exports over default exports (convention)
     - File names use kebab-case, not camelCase (convention)
     - Test files colocated with source files (convention)

     These conventions override generic TypeScript best practices
     where they conflict."
```

Convention entries are never removed during retention cleanup. They represent deliberate team decisions that remain valid indefinitely unless explicitly revoked [9].

---

## 9. Skill Metrics Schema

The `skill-metrics.jsonl` file captures both structural quality (score) and operational quality (activation, correction, ROI) per skill per session:

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | ISO 8601 | When the entry was recorded |
| `skill` | string | Skill name (directory name) |
| `score.total` | number | 0-100 composite score |
| `score.grade` | A/B/C/F | Grade derived from total |
| `score.existence` | number | Existence category score |
| `score.quality` | number | Quality category score |
| `score.grounding` | number | Grounding category score |
| `score.accuracy` | number | Accuracy category score |
| `score.freshness` | number | Freshness category score |
| `operational.activation_rate` | float | Sessions activated / total sessions |
| `operational.correction_rate` | float | Corrections / activations |
| `operational.token_roi` | float | Tokens saved / tokens consumed |
| `trigger` | string | What triggered the recording |
| `git_ref` | string | Git commit hash at time of recording |

---

## 10. Activation Rate Tracking

Activation rate measures how often a skill triggers relative to total sessions:

```
ACTIVATION RATE -- CALCULATION
================================================================

  activation_rate = sessions_skill_activated / total_sessions

  For skill "typescript-patterns" over last 30 days:
    Total sessions: 45
    Sessions where skill activated: 33
    Activation rate: 33/45 = 0.733 (73.3%)

  INTERPRETATION:
    > 80%:  Very active. This skill is core to the workflow.
    50-80%: Moderately active. Triggers in the right contexts.
    20-50%: Low activity. Triggers may be too narrow.
    < 20%:  Rarely used. Consider retirement or trigger broadening.

  NOTE: A low activation rate is not inherently bad. A skill for
  "database migration" should only activate during migration work.
  Context matters.
```

Activation rate is tracked per skill per rolling 30-day window. The window smooths out natural variation (developer might not do TypeScript work every session) while remaining responsive to trend changes [10].

---

## 11. Correction Rate Analysis

Correction rate measures how often an activated skill needs human override:

```
CORRECTION RATE -- CALCULATION
================================================================

  correction_rate = corrections / activations

  For skill "typescript-patterns" over last 30 days:
    Activations: 33
    Corrections: 3
    Correction rate: 3/33 = 0.091 (9.1%)

  INTERPRETATION:
    < 5%:   Excellent. Skill rarely gives wrong advice.
    5-15%:  Acceptable. Normal for evolving codebases.
    15-30%: Needs attention. Consider refinement or review.
    > 30%:  Critical. Skill may be actively harmful. Consider
            immediate review or temporary disabling.

  REFINEMENT TRIGGER:
    When correction_rate > 15% AND correction_count >= 3,
    the skill is automatically flagged for refinement review.
```

A high correction rate with a high activation rate is the worst combination -- it means the skill triggers often and is frequently wrong. This combination should escalate to immediate human review regardless of whether the 3-correction minimum has been reached [11].

---

## 12. Token ROI Calculation

Token ROI measures the cost-effectiveness of a skill:

```
TOKEN ROI -- CALCULATION
================================================================

  token_roi = tokens_saved / tokens_consumed

  tokens_saved:   Estimated tokens the developer would have spent
                  typing/thinking without the skill. Approximated
                  from skill output length * activation count.

  tokens_consumed: Actual API tokens spent on skill activation,
                   context injection, and processing.

  For skill "typescript-patterns" over last 30 days:
    Tokens saved (estimated): 15,000
    Tokens consumed: 4,200
    Token ROI: 15,000 / 4,200 = 3.57

  INTERPRETATION:
    > 3.0:  Excellent ROI. Skill saves much more than it costs.
    1.0-3.0: Positive ROI. Skill is net beneficial.
    0.5-1.0: Marginal. Skill barely breaks even.
    < 0.5:  Negative ROI. Skill costs more than it saves.
            Consider retirement unless non-token value justifies.

  NOTE: Token ROI is an approximation. "Tokens saved" is estimated
  from average human typing speed and task complexity, not measured
  directly. The metric is directionally useful, not precisely accurate.
```

Skills with negative token ROI (consuming more tokens than they save) are flagged for retirement review. However, ROI is not the only value metric -- a skill that prevents errors (zero corrections, high activation) provides value that token counting alone cannot capture [12].

---

## 13. Trend Analysis and Arrows

The insights command computes trend direction from the last 5 metric entries per skill:

| Trend | Arrow | Condition |
|-------|-------|-----------|
| Improving | Up | Last 3 entries show increasing score or decreasing correction rate |
| Degrading | Down | Last 3 entries show decreasing score or increasing correction rate |
| Stable | Right | Score and correction rate within +/-5% of mean |

```
TREND CALCULATION -- MOVING AVERAGE
================================================================

  scores = [68, 72, 75, 78, 82]  (last 5 entries)

  moving_avg = mean(scores[-3:]) = (75 + 78 + 82) / 3 = 78.3
  previous_avg = mean(scores[:3]) = (68 + 72 + 75) / 3 = 71.7

  delta = moving_avg - previous_avg = +6.6
  delta_percent = 6.6 / 71.7 = +9.2%

  delta_percent > +5%  → IMPROVING (up arrow)
  delta_percent < -5%  → DEGRADING (down arrow)
  otherwise            → STABLE (right arrow)
```

---

## 14. The Insights Command

`skill-creator insights` produces a dashboard view of skill health:

```
INSIGHTS COMMAND -- OUTPUT FORMAT
================================================================

  $ skill-creator insights

  SKILL HEALTH DASHBOARD
  ══════════════════════════════════════════════════════════════

  Skill                   Score  Act.Rate  Corr.Rate  ROI   Trend
  ────────────────────────────────────────────────────────────────
  typescript-patterns     82 B   73%       9.1%       3.57   ↑
  react-components        73 B   68%       12.3%      2.81   →
  jest-testing            90 A   45%       2.2%       5.12   ↑
  git-workflow            78 B   85%       7.8%       4.23   ↑
  database-migration      65 C   12%       18.5%      1.04   ↓
  ────────────────────────────────────────────────────────────────

  ALERTS:
    ⚠ database-migration: correction rate 18.5% (threshold: 15%)
    ⚠ database-migration: degrading trend (3 consecutive score drops)

  RECOMMENDATIONS:
    → database-migration: 4 corrections accumulated, refinement eligible
    → react-components: stable but correction rate approaching threshold

  Skills: 5 total  |  Healthy: 3  |  Warning: 1  |  Critical: 1
```

The insights command is gated behind user intent -- it does not run automatically on session start. This prevents unnecessary computation and context consumption for sessions where the developer doesn't need health metrics [13].

---

## 15. Score History Correlation

When both structural score and operational metrics are available, the insights command computes correlation between them:

| Correlation | Meaning | Action |
|-------------|---------|--------|
| High score + high activation + low correction | Well-calibrated skill | No action needed |
| High score + low activation | Well-formed but narrow | Consider broadening triggers |
| Low score + high activation + low correction | Operationally effective despite poor structure | Score rubric may need recalibration |
| Low score + high correction | Broken skill | Prioritize refinement or regeneration |
| Any score + very low ROI | Cost-ineffective | Consider retirement |

The "low score + high activation + low correction" case is particularly important -- it suggests the scoring rubric is penalizing something that doesn't actually affect operational quality. This case triggers a rubric review recommendation [14].

---

## 16. Refinement Decision Matrix

The complete decision matrix for skill action, considering both structural and operational metrics:

| Score | Act. Rate | Corr. Rate | ROI | Action |
|-------|-----------|-----------|-----|--------|
| A (90+) | > 50% | < 5% | > 3.0 | No action. Ideal skill. |
| B (70-89) | > 50% | 5-15% | 1.0-3.0 | Monitor. Refine if corrections accumulate. |
| C (40-69) | > 20% | > 15% | > 0.5 | Refine. Score improvement needed. |
| F (< 40) | Any | Any | Any | Regenerate or retire. Too far gone for refinement. |
| Any | < 10% | Any | < 0.5 | Retire. Not providing value. |
| B+ | > 80% | < 5% | > 5.0 | Candidate for agent cluster seed. |

---

## 17. The Self-Improving Ecosystem

When all components are connected -- scoring, feedback classification, bounded refinement, score gates, metric tracking, and trend analysis -- the result is a self-improving skill ecosystem:

```
THE SELF-IMPROVING CYCLE
================================================================

  Developer works → skills activate → some corrections happen
       |
       v
  Corrections classified → correction/gotcha/fix/pattern/env/convention
       |
       v
  Corrections accumulate → 3+ corrections → refinement eligible
       |
       v
  Refinement generated → scored → regression check → user confirms
       |
       v
  Metrics recorded → trends computed → insights available
       |
       v
  Insights inform → which skills need attention → developer reviews
       |
       v
  Loop repeats with better skills each cycle

  NET EFFECT: Each cycle through the loop improves the system's
  operational quality. The improvement is bounded (can't get worse
  by construction), directed (fix data tells the refiner what's
  wrong), and measurable (scores track progress).
```

The system converges toward a state where all skills have high scores, high activation rates, low correction rates, and positive token ROI. It can never reach this state perfectly (codebases evolve, workflows change), but the calibration loop ensures it continuously moves toward it [15].

---

## 18. Cross-References

> **Related:** [Caliber Architecture](01-caliber-architecture-analysis.md) -- scoring engine that powers the calibration loop
> **Related:** [GSD Architecture](02-gsd-skill-creator-architecture.md) -- bounded learning that receives score feedback
> **Related:** [Integration Mapping](03-integration-mapping.md) -- how scoring ports into the refinement pipeline
> **Related:** [Risk & Bridge](05-risk-compatibility-bridge.md) -- risks in the feedback classification system

Cross-project references:

| Project | Connection |
|---------|-----------|
| GSD2 | Orchestration layer provides the session context for metric recording |
| GSA | Alignment framework defines the quality thresholds for skill actions |
| ACE | Compute Engine runs score-engine.ts in the calibration loop |
| CMH | Mesh networking distributes metric data across federated instances |
| MCF | Multi-cluster federation aggregates trends across clusters |
| PMG | Pi-Mono deployment validates lightweight metric recording |
| K8S | Container orchestration provides isolated environments for score comparison |
| MGU | Module governance consumes trend data for promotion decisions |

---

## 19. Sources

1. BIPM. *International Vocabulary of Metrology* (VIM). 3rd Edition. JCGM 200:2012.
2. Deming, W.E. *Out of the Crisis.* MIT Press, 1986. Ch. 3: "Diseases and Obstacles."
3. Tibsfox. "Caliber x GSD Integration Vision: Score-Refine Cycle." Internal document, 2026.
4. caliber-ai-org. "CALIBER_LEARNINGS.md: Taxonomy Categories." GitHub, 2026.
5. Tibsfox. "src/learning/feedback-detector.ts: Category Inference." gsd-skill-creator, 2026.
6. Tibsfox. "src/learning/refinement-engine.ts: Correction Pipeline." gsd-skill-creator, 2026.
7. Tibsfox. "Session Learning Analysis: Gotcha vs Correction Classification." Internal analysis, 2026.
8. Tibsfox. "src/detection/pattern-analyzer.ts: Pattern Entry Processing." gsd-skill-creator, 2026.
9. caliber-ai-org. "CALIBER_LEARNINGS.md: Convention Persistence." GitHub, 2026.
10. Tibsfox. "src/observation/session-observer.ts: Activation Tracking." gsd-skill-creator, 2026.
11. Tibsfox. "src/learning/feedback-store.ts: Correction Rate." gsd-skill-creator, 2026.
12. Anthropic. "Claude Code: Token Usage and Cost Analysis." docs.anthropic.com, 2025.
13. Tibsfox. "Caliber x GSD Integration Vision: Insights Command." Internal document, 2026.
14. Tibsfox. "Score-Operational Correlation Analysis." Internal analysis, 2026.
15. Shewhart, W.A. *Statistical Method from the Viewpoint of Quality Control.* Dover, 1939.
16. caliber-ai-org. "src/scoring/history.ts: Trend Analysis." GitHub, 2026.
17. Tibsfox. "gsd-skill-creator: Refinement Decision Matrix." Internal analysis, 2026.
