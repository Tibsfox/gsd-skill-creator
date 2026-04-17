# Retrospective — v1.49.21

## What Worked

- **TDD approach** -- Writing type schemas first (14 Zod schemas) then building engines against them kept the pipeline well-structured from the start
- **Modular engine design** -- Each engine is independently testable with clear input/output contracts, making the 253-test suite straightforward to write
- **Bridge pattern** -- Connecting ITM to the existing VTM pipeline via a scored bridge avoids duplicating mission generation logic

## What Could Be Better

- **No real image input yet** -- The pipeline processes structured observation data, not raw images. Actual image analysis requires multimodal model integration
- **Complexity scoring is heuristic** -- The 0-12 scale works for routing decisions but isn't calibrated against real project outcomes

## Lessons Learned

1. **Schema-first pipeline design** -- Defining all 14 interface schemas before writing any engine code eliminated the usual back-and-forth of integration. Each engine had an exact contract to implement against.
2. **Dual translation is the right split** -- Code and design translations have fundamentally different output shapes. Trying to unify them would have created an awkward abstraction. Two engines with shared input is simpler.
3. **Bridge scoring enables incremental complexity** -- Simple creative tasks (score < 4) get direct output. Complex ones (score >= 8) get routed to the full VTM pipeline. The bridge pattern avoids building a monolithic system.
