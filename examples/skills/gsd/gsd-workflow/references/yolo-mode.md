# YOLO Mode -- Autonomous Operation

Detection, protocol, and example recognition for GSD autonomous operation mode.

## Detection

Read `.planning/config.json`. Check the `"mode"` field:

- `"mode": "yolo"` -- Autonomous operation is active. Execute without waiting for user confirmation.
- `"mode": "interactive"` -- Standard operation. Wait for user confirmation at decision points.

## 6-Step Autonomous Protocol

When YOLO mode is active:

1. **Read GSD command output carefully** -- it contains your next instruction
2. **Execute the suggested command** -- don't wait for user confirmation
3. **Handle `/clear` requirements** -- inform user when context reset is needed
4. **Continue the workflow** -- GSD is a pipeline, keep it moving
5. **Load relevant skills** -- even in YOLO mode, check for applicable skills before phases
6. **Record observations** -- YOLO sessions generate high-value pattern data

## Example Recognition

GSD output often contains structured next-step instructions:

```
## > Next Up

**Phase 1: Foundation** -- Storage infrastructure

/gsd:plan-phase 1 -- create detailed execution plan

<sub>/clear first -> fresh context window</sub>
```

**Claude should understand:**
- Next action is `/gsd:plan-phase 1`
- User should `/clear` first for fresh context
- Claude should either: (a) tell user to `/clear` and run the command, or (b) run the command if context is acceptable
- Before executing, check for skills relevant to "planning" and "storage infrastructure"

## Skill Loading in YOLO Mode

Even in autonomous mode, always check for applicable skills before executing GSD phases. Clean context means free of stale conversation history -- not free of learned knowledge. A subagent that can't access learned skills is throwing away everything skill-creator has captured.
