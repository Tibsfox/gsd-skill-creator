# How It Works

The system operates in a six-step workflow:

## Step 1: Session Observation

When you use Claude Code, the system observes:
- **Commands executed** - Build, test, deploy commands
- **Files touched** - File types, paths, access patterns
- **Decisions made** - Choices, preferences, corrections
- **Skills activated** - Which skills loaded and when

Observations are stored as compact summaries in `.planning/patterns/sessions.jsonl`.

## Step 2: Pattern Detection

The pattern analyzer scans observations for:
- **Command sequences** - Recurring command patterns (e.g., always running tests after changes)
- **File patterns** - Frequently accessed file types or paths (e.g., `*.test.ts` files)
- **Workflow patterns** - Common task structures (e.g., create PR -> review -> merge)

When a pattern appears **3+ times**, it becomes a skill candidate.

## Step 3: Skill Suggestion

Run `skill-creator suggest` to review candidates:
1. See the detected pattern and evidence (occurrences, dates, files)
2. Preview the generated skill content before accepting
3. **Accept** - Create the skill immediately
4. **Defer** - Ask again in 7 days
5. **Dismiss** - Never suggest this pattern again

## Step 4: Skill Application

When you work in Claude Code:
1. The **relevance scorer** matches skills to your current context
2. Skills with matching triggers are ranked by specificity
3. Skills load automatically within the **token budget** (2-5% of context)
4. **Conflicts** are resolved by specificity and recency
5. You can see active skills with `skill-creator status`

## Step 5: Feedback Learning

The system learns from your corrections:
1. **Detects** when you override or correct skill output
2. **Accumulates** feedback over time in `.planning/patterns/feedback.jsonl`
3. After **3+ corrections**, suggests bounded refinements
4. Refinements are **limited to 20%** content change
5. **7-day cooldown** between refinements
6. **User confirmation** always required

## Step 6: Agent Composition

For skills that frequently activate together:
1. **Co-activation tracker** detects stable skill pairs (5+ co-activations)
2. **Cluster detector** groups related skills (2-5 skills per cluster)
3. **Stability check** ensures pattern persists (7+ days)
4. **Agent generator** creates `.claude/agents/` files
5. Generated agents combine expertise from multiple skills
