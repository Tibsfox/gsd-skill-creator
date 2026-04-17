# Retrospective — v1.17

## What Worked

- **5-state filesystem pipeline is a clean mental model.** inbox → checking → attention → ready → aside maps directly to human decision-making. State-named subdirectories make the pipeline physically visible -- `ls .planning/staging/` tells you everything.
- **Trust-aware reporting with decay.** The 4 familiarity tiers (Home/Neighborhood/Town/Stranger) with trust decay over time is a sophisticated security model that avoids binary trust. Critical pattern lockout for untrusted content is the right hard boundary.
- **Derived knowledge checking catches phantom content.** Provenance chain tracking and phantom content detection (claims without evidence) address a real risk in AI-assisted systems -- generated content that looks authoritative but has no backing.
- **699 tests across 35 files.** More than double the previous release's test count, proportional to the 8-phase scope and the security-critical nature of the hygiene engine.

## What Could Be Better

- **Two state machines in one release.** The staging pipeline (5 states) and the queue (7 states) are both introduced here. The interaction between them -- when does a staged item enter the queue? -- could be clearer in the release notes.
- **11 hygiene patterns is a starting set.** The pattern categories (injection, obfuscation, unsafe config) cover the obvious cases, but the real test is how easily new patterns can be added as novel attack vectors emerge.

## Lessons Learned

1. **Three-path clarity routing reduces decision fatigue.** clear/gaps/confused as intake routing means the system self-selects its processing depth. Clear items fast-track, confused items get research. No single path handles everything.
2. **Append-only audit logs are non-negotiable for staging systems.** The queue's append-only audit log means every state transition is traceable. When something goes wrong in a 7-state machine, you need the full history.
3. **Crash recovery with resumable state is essential for multi-step intake.** The smart intake flow's crash recovery means a browser crash or session timeout doesn't lose partially-completed intake work. This is especially important for the resource analysis step which does real computation.

---
