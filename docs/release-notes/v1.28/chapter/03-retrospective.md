# Retrospective — v1.28

## What Worked

- **10 named staff positions across 4 divisions.** Coordinator, Relay, Planner, Configurator, Monitor, Executor, Verifier, Sentinel, Chronicler -- each with a distinct responsibility. The division structure (Command, Planning, Execution, Safety & Operations) mirrors real organizational hierarchies, making roles intuitive.
- **4 topology profiles with scaling.** Scout (3), Patrol (5), Squadron (7), Fleet (10) -- the topology scales agent count to task complexity. This avoids the "one size fits all" problem where small tasks waste coordination overhead and large tasks starve for agents.
- **Priority 0 HALT/CLEAR protocol and 9-type recovery decision matrix.** The Sentinel's recovery system handles failures with graduated responses rather than a single "abort and restart." The HALT protocol is the nuclear option, used only when the situation requires it.

## What Could Be Better

- **675 tests for a 7-phase coordination system is solid, but the integration exercise (Phase 261) does heavy lifting.** The end-to-end lifecycle flow with 4 topology profiles and 7 recovery scenarios is where most integration bugs would surface. More isolated fault injection tests for each division would strengthen confidence.
- **ISA compact encoding for the message bus is mentioned but not detailed.** The 8 priority levels and dispatcher routing are clear, but the encoding format itself -- how messages are serialized and discriminated -- isn't specified in the release notes.

## Lessons Learned

1. **Overhead verification (<1% of context) is a critical metric.** Multi-agent coordination systems can easily consume more context on coordination than on actual work. Proving the overhead stays below 1% means the agents spend their budget on execution, not bureaucracy.
2. **Deterministic YAML parsing with reproducibility proof for chipsets builds trust.** If the same chipset YAML produces different results on different runs, the system is unreliable. The reproducibility proof in Phase 260 ensures that chipset configuration is deterministic.
3. **Go/no-go readiness checks and atomic phase transitions prevent partial execution.** The Coordinator's readiness checks mean work doesn't start until preconditions are met. Atomic transitions mean phases either complete fully or don't advance -- no half-done states.

---
