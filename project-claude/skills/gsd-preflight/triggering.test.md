## Naive Prompt
The GSD execute-phase command keeps failing. Something seems wrong.

## Expected Baseline Failure
Agent attempts to debug the workflow directly without first checking .planning/ artifact
consistency — misses cross-artifact validation (STATE.md phase vs ROADMAP.md phase mismatch).

## Expected Skill Activation
gsd-preflight activates on GSD failure reports and runs artifact consistency checks before
any execution attempt.

## Rationalization Table
| Rationalization | Counter |
|----------------|---------|
| "This is a debugging problem, not a preflight situation" | GSD failures are the primary trigger for preflight — validate artifacts before debugging workflow logic |
| "The user didn't say 'preflight' or 'validate'" | The skill activates on GSD failure reports; the word 'preflight' is not required |
| "I can inspect the files myself without a skill" | Cross-artifact checks (ROADMAP phase ↔ STATE phase, orphaned SUMMARY files) require structured multi-file inspection that the skill provides |
