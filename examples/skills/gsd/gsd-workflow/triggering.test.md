## Naive Prompt
What should I work on next in my project?

## Expected Baseline Failure
Agent responds with generic advice about project management without consulting
.planning/STATE.md or ROADMAP.md, and without routing to a GSD command.

## Expected Skill Activation
gsd-workflow activates on "What should I work on" and routes to /gsd:progress.

## Rationalization Table
| Rationalization | Counter |
|----------------|---------|
| "This is a general question, not a GSD command" | "What should I work on" is the canonical use-case listed in gsd-workflow's routing table |
| "The user didn't mention GSD or .planning/" | gsd-workflow activates on project-management natural language, not explicit GSD vocabulary |
| "I can answer from context without a skill" | Without skill activation, the agent cannot read .planning/STATE.md to know the actual current phase |
