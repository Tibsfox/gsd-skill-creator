# Retrospective — v1.2

## What Worked

- **Activation simulation with synthetic sessions closes the testing gap.** You can't wait for real sessions to validate skill triggers -- synthetic sessions let you test the observe-detect loop without human interaction.
- **F1/MCC optimization for threshold calibration is statistically rigorous.** MCC in particular handles class imbalance well, which matters when most sessions should NOT activate most skills.

## What Could Be Better

- **18 requirements across 14 plans for a test infrastructure release is heavy.** Test infrastructure should be lean enough to not need its own extensive test suite -- though the complexity here reflects the non-trivial activation logic being tested.

## Lessons Learned

1. **Automated test case generation from observation patterns creates a flywheel.** Real usage produces observations, observations become test cases, test cases validate the system that produces observations.
2. **Benchmarking infrastructure at v1.2 sets a performance baseline early.** Without it, performance regressions from v1.3+ would be invisible until they became painful.

---
