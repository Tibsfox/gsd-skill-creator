# Tutorial: Calibrating Activation Thresholds

[Back to Getting Started](../GETTING-STARTED.md) | [Previous: Conflict Detection](conflict-detection.md) | [Next: CI Integration](ci-integration.md)

**Time:** 10 minutes
**Prerequisites:** Skills created with test cases ([Skill Creation Tutorial](skill-creation.md))

---

## Introduction

Calibration optimizes when your skills activate. By analyzing real activation data, you can tune the threshold that determines whether a skill should trigger for a given prompt.

The default activation threshold is **0.75** (75% similarity). When you find that:

- Skills activate for unrelated prompts (threshold too low)
- Skills fail to activate when they should (threshold too high)

Calibration helps you find the optimal value based on actual usage patterns.

### What You Will Learn

1. Understand how activation thresholds work
2. Gather calibration data from test results
3. Run calibration to find the optimal threshold
4. Apply and verify threshold changes
5. Iterate on calibration over time

---

## Step 1: Understand Activation Thresholds

Skill activation uses embedding-based similarity scoring. When you send a prompt, skill-creator computes the semantic similarity between your prompt and each skill's description. If the similarity exceeds the threshold, the skill activates.

### Default Thresholds

| Threshold | Default | Purpose |
|-----------|---------|---------|
| Activation | 0.75 | Minimum similarity for a skill to activate |
| Conflict | 0.85 | Minimum similarity to flag skills as conflicting |

### When Calibration Helps

**Threshold too low (frequent false positives):**
- Unrelated prompts trigger skills
- Multiple skills compete for the same prompt
- User corrections increase

**Threshold too high (frequent false negatives):**
- Skills don't activate when expected
- Users must manually invoke skills
- Activation feels unreliable

> **Checkpoint:** Review your current test results. Run `skill-creator test run --all --verbose` and note the false positive rate and false negative rate. If either exceeds 10%, calibration may help.

---

## Step 2: Gather Calibration Data

Calibration requires labeled examples of correct and incorrect activations. The test system provides this data.

### Sources of Calibration Data

1. **Test case results** - Your positive and negative test cases provide ground truth
2. **Usage feedback** - Corrections during normal usage (automatic collection)

### Generate Calibration Data from Tests

Run your test suite and save results for calibration:

```bash
skill-creator test run --all --verbose
```

This runs all test cases and records activation results. The system automatically collects:

- True positives (skill activated when it should)
- True negatives (skill did not activate when it should not)
- False positives (skill activated incorrectly)
- False negatives (skill failed to activate when it should)

> **Checkpoint:** After running tests, check the accuracy summary. You should see output like:
> ```
> Results: 45/50 passed (90% accuracy)
> False positives: 2
> False negatives: 3
> ```
>
> Note these numbers for comparison after calibration.

For detailed test options, see [CLI: test run](../CLI.md#test-run).

---

## Step 3: Run Calibration

Once you have test data, run calibration to find the optimal threshold.

```bash
skill-creator calibrate --preview
```

The `--preview` flag shows the proposed changes without applying them.

### Understanding Calibration Output

```
Calibration Analysis

Current threshold: 0.75 (F1: 82.3%)
Optimal threshold: 0.72 (F1: 87.1%)
Improvement: +4.8%

Based on 156 calibration events
```

**Key metrics:**

| Metric | Meaning |
|--------|---------|
| F1 Score | Balance between precision and recall (higher is better) |
| Current threshold | Your existing activation threshold |
| Optimal threshold | Calculated best threshold for your data |
| Improvement | Expected F1 score increase |
| Events | Number of data points used |

### Minimum Data Requirements

Calibration requires at least 75 events with known outcomes. If you see "insufficient data", continue using skills and running tests to accumulate more events.

> **Checkpoint:** Run `skill-creator calibrate --preview` and note the recommended threshold. Compare the current and optimal F1 scores.

For all calibration options, see [CLI: calibrate](../CLI.md#calibrate).

---

## Step 4: Apply New Threshold

After reviewing the preview, apply the calibration:

```bash
skill-creator calibrate
```

The system prompts for confirmation before making changes:

```
? Apply new threshold 0.72? (Y/n)
```

### Per-Skill vs Global Thresholds

Calibration adjusts the global threshold by default. For individual skills with unique activation patterns, you can adjust thresholds per-skill in the skill's frontmatter:

```yaml
---
name: specialized-skill
description: ...
threshold: 0.80  # Higher threshold for this skill
---
```

> **Checkpoint:** Apply the recommended threshold to your skills. Run `skill-creator calibrate` and confirm the change.

---

## Step 5: Benchmark the Change

After applying calibration, verify the improvement with benchmarking:

```bash
skill-creator benchmark
```

### Understanding Benchmark Output

```
Benchmark Report

Correlation (MCC): 87%
Agreement rate: 91%

Confusion Matrix:
  True Positives:  142
  True Negatives:   89
  False Positives:  12
  False Negatives:  13

JSON written to: .planning/calibration/benchmark.json
```

**Key metrics:**

| Metric | Target | Meaning |
|--------|--------|---------|
| Correlation (MCC) | >= 85% | Matthews Correlation Coefficient |
| Agreement rate | >= 90% | Percentage of correct predictions |
| False positives | < 10% | Incorrect activations |
| False negatives | < 10% | Missed activations |

### Before/After Comparison

Compare your benchmark results to the pre-calibration values you noted in Step 2:

- False positive rate should decrease
- False negative rate should decrease
- Overall accuracy should increase

> **Checkpoint:** Run `skill-creator benchmark` after applying calibration. The false positive rate should be lower than before calibration.

For benchmark details, see [CLI: benchmark](../CLI.md#benchmark).

---

## Step 6: Iterate as Needed

Calibration is an iterative process. As you create new skills and accumulate more usage data, periodic recalibration helps maintain accuracy.

### The Calibration Cycle

1. **Use skills** - Work normally, let activation events accumulate
2. **Run tests** - Periodically run `skill-creator test run --all`
3. **Preview calibration** - Check `skill-creator calibrate --preview`
4. **Apply if beneficial** - Apply when improvement exceeds 2-3%
5. **Benchmark** - Verify improvement with `skill-creator benchmark`

### When to Stop

Calibration has diminishing returns. Stop when:

- F1 score improvement is less than 1%
- False positive and negative rates are both below 5%
- Benchmark correlation is above 90%

### Rollback if Needed

If calibration makes activation worse, roll back to the previous threshold:

```bash
skill-creator calibrate rollback
```

View threshold history:

```bash
skill-creator calibrate history
```

> **Checkpoint:** Review the calibration workflow steps above. Plan to recalibrate after adding 5+ new skills or accumulating 50+ new usage events.

For information on how thresholds affect the embedding system, see [Architecture: Extension Points](../architecture/extending.md).

---

## Summary

In this tutorial, you learned to:

1. **Understand thresholds** - How activation scoring determines when skills trigger
2. **Gather data** - Use test results as calibration input
3. **Run calibration** - Find the optimal threshold with `skill-creator calibrate --preview`
4. **Apply changes** - Update the global threshold
5. **Verify improvement** - Use benchmarking to confirm better accuracy
6. **Iterate** - Maintain accuracy through periodic recalibration

### Key Takeaways

- **Data-driven tuning:** Calibration uses real activation data, not guesswork
- **F1 optimization:** The algorithm balances precision and recall
- **Reversible changes:** Threshold history enables rollback
- **Diminishing returns:** Stop when improvement is less than 1%

### Next Steps

- [CI Integration Tutorial](ci-integration.md) - Add calibration and benchmarking to your CI pipeline
- [Architecture Documentation](../architecture/README.md) - Understand how calibration affects the system

---

[Back to Getting Started](../GETTING-STARTED.md) | [Previous: Conflict Detection](conflict-detection.md) | [Next: CI Integration](ci-integration.md)
