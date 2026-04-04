---
name: decision-framework
description: Provides structured thinking frameworks for decision-making and problem analysis. Use when evaluating options, finding root causes, prioritizing work, or when user mentions 'decision', 'trade-off', 'prioritize', 'root cause', 'first principles', 'why'.
---

# Decision Framework

Structured thinking tools for making better decisions, finding root causes, and prioritizing effectively. Select the right framework for the situation, apply it systematically, and produce clear, actionable output.

## Framework Selector

Start here. Match your situation to the right framework.

| Situation | Framework | Why |
|-----------|-----------|-----|
| "Should we build or buy?" | First Principles | Strip assumptions, reason from fundamentals |
| "Why does this keep happening?" | 5 Whys | Trace symptoms to root cause |
| "What should I work on first?" | Eisenhower Matrix | Separate urgent from important |
| "Where should we focus effort?" | Pareto (80/20) | Find the vital few that drive most results |
| "What could go wrong?" | Inversion | Identify failure modes by working backwards |
| "What happens if we choose X?" | Second-Order Thinking | Map consequences of consequences |
| "We have 3 options, which is best?" | Decision Matrix | Score options against weighted criteria |

**Multiple frameworks can combine.** Use First Principles to define the problem, Inversion to identify risks, then Eisenhower to prioritize the mitigations.

---

## First Principles Thinking

**When to use:** Facing a complex decision where conventional wisdom may be wrong. Designing something new. Challenging "we've always done it this way."

### Process

1. **State the problem clearly** -- Write one sentence describing what you need to decide or solve.
2. **List current assumptions** -- What do you believe to be true? What does everyone assume?
3. **Challenge each assumption** -- For each one, ask: "Is this actually true? What evidence supports it? Could the opposite be true?"
4. **Identify fundamental truths** -- What remains after stripping assumptions? These are your first principles.
5. **Reason upward** -- Build your solution from these fundamentals, ignoring conventional approaches.

### Output Format

```markdown
## First Principles Analysis: [Problem]

### Problem Statement
[One sentence]

### Assumptions Identified
1. [Assumption] -- Status: [True/False/Uncertain] -- Evidence: [Why]
2. ...

### Fundamental Truths
- [What remains after challenging assumptions]

### Solution from Principles
[Approach built from fundamentals, not convention]

### Why This Differs from Convention
[What conventional wisdom gets wrong and why]
```

### Example

**Problem:** "We need a microservices architecture for our new app."

| Assumption | Challenge | Verdict |
|------------|-----------|---------|
| Microservices scale better | Only at team/org scale; monoliths scale computationally fine | False for small teams |
| We need independent deployments | Team is 3 people, single repo | Not yet needed |
| Everyone uses microservices | Survivorship bias; many successful monoliths | Irrelevant |

**Fundamental truth:** We need code that is maintainable, deployable, and handles our load.

**From principles:** Start with a well-structured monolith. Extract services only when specific scaling or team boundaries demand it.

---

## 5 Whys Analysis

**When to use:** Something went wrong and you need the root cause, not just the symptom. Recurring problems. Post-incident analysis.

### Process

1. **State the problem** -- What happened? Be specific and observable.
2. **Ask "Why?" and answer** -- The answer must be factual, not speculative.
3. **Repeat** -- Ask "Why?" of the previous answer. Continue until you reach something you can act on.
4. **Verify the chain** -- Read it backwards: "Therefore..." Each link should logically cause the next.
5. **Identify the actionable root** -- The deepest "why" that you can actually change.

### Rules

- Each answer must be a **fact**, not an opinion
- If a "why" has multiple answers, **branch** -- explore each path
- Stop when you reach something **within your control** to change
- 5 is a guideline, not a rule -- you may need 3 or 7

### Output Format

```markdown
## 5 Whys: [Problem Statement]

### Chain
1. Why did [problem]? -- Because [cause 1]
2. Why [cause 1]? -- Because [cause 2]
3. Why [cause 2]? -- Because [cause 3]
4. Why [cause 3]? -- Because [cause 4]
5. Why [cause 4]? -- Because [root cause]

### Verification (read backwards)
[Root cause] therefore [cause 4] therefore ... therefore [problem] -- Valid: Yes/No

### Root Cause
[The actionable root]

### Corrective Actions
- [Immediate fix]
- [Systemic prevention]
```

### Example

**Problem:** Production deployment failed Friday at 5pm.

1. Why? -- The database migration timed out.
2. Why? -- The migration locked a table with 50M rows for an ALTER.
3. Why? -- The migration was not reviewed for performance impact.
4. Why? -- There is no migration review step in the deployment process.
5. Why? -- The deployment checklist was created before we had large tables.

**Root cause:** Deployment checklist does not include migration performance review.

**Fix:** Add migration review step; require EXPLAIN on migrations touching tables over 1M rows.

---

## Eisenhower Matrix

**When to use:** Overwhelmed with tasks. Need to decide what to do now, schedule, delegate, or drop. Sprint planning. Personal productivity.

### The Matrix

|  | **Urgent** | **Not Urgent** |
|--|-----------|----------------|
| **Important** | **DO FIRST** -- Crisis, deadlines, critical bugs | **SCHEDULE** -- Planning, prevention, learning, relationships |
| **Not Important** | **DELEGATE** -- Most emails, some meetings, interruptions | **ELIMINATE** -- Time wasters, busywork, perfectionism |

### Classification Rules

**Important** = Contributes to your mission, goals, or values. Consequences of NOT doing it are significant.

**Urgent** = Demands immediate attention. Has a near-term deadline. Someone is waiting.

### Process

1. **Dump all tasks** -- List everything competing for attention.
2. **Classify each** -- Place in one quadrant. If unsure, default to "Not Urgent."
3. **Act on Q1** -- Do these now. They are both important and time-sensitive.
4. **Schedule Q2** -- Block time for these. This quadrant is where real progress lives.
5. **Delegate Q3** -- Hand off or batch. Protect your focus from urgency that is not important.
6. **Eliminate Q4** -- Drop these. Be honest about what is actually busywork.

### Output Format

```markdown
## Eisenhower Matrix: [Context]

### Q1: Do First (Urgent + Important)
- [ ] [Task] -- Deadline: [when]

### Q2: Schedule (Not Urgent + Important)
- [ ] [Task] -- Schedule for: [when]

### Q3: Delegate (Urgent + Not Important)
- [ ] [Task] -- Delegate to: [who/what]

### Q4: Eliminate
- [Task] -- Reason for dropping: [why]

### Key Insight
[What pattern do you see? Are you spending too much time in Q1/Q3?]
```

### Common Trap

Most people spend all their time in Q1 (firefighting) and Q3 (reacting to others). The highest-leverage quadrant is **Q2** -- proactive work that prevents Q1 crises from happening.

---

## Pareto Analysis (80/20)

**When to use:** Need to focus limited resources. Performance optimization. Bug triage. Customer feedback analysis. Any situation where effort and impact are unevenly distributed.

### Process

1. **List all items** -- Features, bugs, customers, tasks, causes.
2. **Measure impact** -- Quantify each item's contribution (revenue, time lost, frequency, severity).
3. **Sort by impact** -- Descending order.
4. **Calculate cumulative percentage** -- Running total of impact.
5. **Draw the line** -- Find where ~20% of items account for ~80% of impact.
6. **Focus on the vital few** -- Prioritize items above the line.

### Output Format

```markdown
## Pareto Analysis: [What you're analyzing]

### Data

| Item | Impact | Cumulative % | Category |
|------|--------|-------------|----------|
| [Item 1] | [value] | [X]% | Vital Few |
| [Item 2] | [value] | [X]% | Vital Few |
| [Item 3] | [value] | [X]% | Vital Few |
| --- 80% line --- | | | |
| [Item 4] | [value] | [X]% | Useful Many |
| ... | | | |

### Vital Few (focus here)
[The ~20% of items driving ~80% of results]

### Recommendation
[Where to focus effort based on the analysis]
```

### Example

**Bug triage for sprint planning:**

| Bug Category | User Reports | Cumulative | Focus |
|-------------|-------------|------------|-------|
| Login failures | 847 | 42% | Vital |
| Slow page loads | 512 | 67% | Vital |
| Payment errors | 289 | 82% | Vital |
| --- 80% line --- | | | |
| UI glitches | 134 | 88% | Defer |
| Email formatting | 98 | 93% | Defer |
| Dark mode bugs | 71 | 97% | Defer |
| Other | 63 | 100% | Defer |

**Decision:** Fix login, performance, and payments first. Three categories cover 82% of all reports.

---

## Inversion

**When to use:** Planning a project and want to identify risks. Making a major decision. Setting goals. Whenever you want to avoid failure rather than just chase success.

### Process

1. **State your goal** -- What does success look like?
2. **Invert it** -- Ask: "What would guarantee failure?"
3. **List failure causes** -- Be thorough. Think about people, process, technology, external factors.
4. **Invert each cause** -- Turn each failure mode into a prevention strategy.
5. **Prioritize preventions** -- Which failure modes are most likely or most damaging?

### Output Format

```markdown
## Inversion Analysis: [Goal]

### Success State
[What good looks like]

### What Guarantees Failure?

| Failure Mode | Likelihood | Impact | Prevention |
|-------------|-----------|--------|------------|
| [How it fails] | High/Med/Low | High/Med/Low | [What to do instead] |

### Top 3 Risks to Mitigate
1. [Most critical failure mode] -- Prevention: [action]
2. ...
3. ...

### Revised Plan
[Original plan adjusted to avoid top failure modes]
```

### Example

**Goal:** Successfully launch v2.0 of the product.

| Failure Mode | Likelihood | Impact | Prevention |
|-------------|-----------|--------|------------|
| Ship with critical bugs | High | High | Feature freeze 2 weeks before launch; dedicated QA pass |
| Users can't migrate from v1 | Medium | High | Build migration tool; test with real v1 data |
| Team burns out before launch | Medium | High | Set realistic scope; cut features not people |
| No one knows it launched | Low | High | Start marketing 4 weeks before, not after |
| Infrastructure can't handle load | Medium | Medium | Load test at 3x expected traffic |

**Key insight:** The biggest risk is shipping bugs, not missing features. Adjust plan to prioritize stability over scope.

---

## Second-Order Thinking

**When to use:** Making a decision with long-term consequences. Policy changes. Architecture decisions. Hiring. Pricing. Any decision where the obvious answer might create hidden problems.

### Process

1. **State the decision** -- What are you considering?
2. **Map first-order effects** -- What happens immediately?
3. **Map second-order effects** -- For each first-order effect, what does THAT cause?
4. **Map third-order effects** -- (Optional) Continue one more level for critical decisions.
5. **Identify hidden costs** -- What second/third-order effects are negative?
6. **Decide with full picture** -- Does the decision still make sense?

### Output Format

```markdown
## Second-Order Thinking: [Decision]

### First-Order Effects (immediate)
- [Effect 1]
- [Effect 2]

### Second-Order Effects (consequences of consequences)
- [Effect 1] leads to [Effect 1a], [Effect 1b]
- [Effect 2] leads to [Effect 2a], [Effect 2b]

### Third-Order Effects (if applicable)
- [Effect 1a] leads to [Effect 1a-i]

### Hidden Costs / Unintended Consequences
- [Negative second/third order effect and why it matters]

### Revised Assessment
[Does the decision still make sense given the full picture?]
```

### Example

**Decision:** "Let's add a free tier to grow our user base."

| Order | Effect | Positive/Negative |
|-------|--------|-------------------|
| 1st | More signups | Positive |
| 1st | Support costs increase | Negative |
| 2nd | Free users request features | Negative |
| 2nd | Free users become advocates | Positive |
| 2nd | Paid users question value | Negative |
| 3rd | Engineering time shifts to free-tier features | Negative |
| 3rd | Conversion funnel needs constant optimization | Negative |
| 3rd | Market awareness grows organically | Positive |

**Hidden cost:** Engineering effort shifts toward free-tier needs, slowing paid-tier improvements, which increases churn risk among paying customers.

**Revised assessment:** Free tier makes sense ONLY if strictly limited (no feature requests from free users, self-serve only, clear upgrade path). Otherwise the second-order costs outweigh the first-order benefit.

---

## Decision Matrix

**When to use:** Comparing 3+ options with multiple criteria. Technology selection. Vendor evaluation. Architecture trade-offs. Any decision where "it depends" keeps coming up.

### Process

1. **List options** -- What are you choosing between?
2. **Define criteria** -- What matters? (Max 7 criteria to stay manageable.)
3. **Weight criteria** -- Not all criteria matter equally. Assign weights (1-5 or percentages).
4. **Score each option** -- Rate each option against each criterion (1-5).
5. **Calculate weighted scores** -- Score x Weight for each cell. Sum per option.
6. **Sanity check** -- Does the winner feel right? If not, your criteria or weights are off.

### Output Format

```markdown
## Decision Matrix: [What you're choosing]

### Options
1. [Option A]
2. [Option B]
3. [Option C]

### Weighted Scoring

| Criterion | Weight | Option A | Option B | Option C |
|-----------|--------|----------|----------|----------|
| [Criterion 1] | [W] | [score] ([WxS]) | [score] ([WxS]) | [score] ([WxS]) |
| [Criterion 2] | [W] | [score] ([WxS]) | [score] ([WxS]) | [score] ([WxS]) |
| **Total** | | **[sum]** | **[sum]** | **[sum]** |

### Recommendation
[Winner] with score [X] vs [runner-up] at [Y].

### Caveats
[Any qualitative factors the numbers don't capture]
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Analysis paralysis | Spending more time deciding than the decision is worth | Set a time box. Use the 70% rule: decide when you have 70% of the information. |
| Anchoring on the first option | First idea gets unfair weight | Generate at least 3 options before evaluating any |
| Confirmation bias | Seeking evidence that supports your preference | Assign someone to argue the opposing case |
| Sunk cost fallacy | Continuing because of past investment | Ask "if I were starting fresh, would I choose this?" |
| False dichotomy | Treating it as A vs B when C exists | Always ask "what other options exist?" |
| Groupthink | Team converges too quickly | Have people write opinions independently before discussion |
| Overthinking reversible decisions | Treating two-way doors as one-way doors | Classify: is this reversible? If yes, decide fast, adjust later. |

## Quick Decision Checklist

Before finalizing any significant decision:

- [ ] Problem is clearly stated (one sentence)
- [ ] At least 3 options considered
- [ ] Assumptions identified and challenged
- [ ] Second-order effects mapped
- [ ] Failure modes identified (inversion)
- [ ] Decision is documented with rationale
- [ ] Rollback plan exists (for reversible decisions)
- [ ] Success criteria defined (how will you know it worked?)
