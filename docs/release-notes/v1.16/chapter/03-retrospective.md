# Retrospective — v1.16

## What Worked

- **Filesystem message bus as the integration primitive.** Using `.planning/console/` with inbox/outbox and Zod-validated JSON envelopes gave a clean, debuggable, testable boundary between browser and GSD. No WebSocket complexity, no server state -- just files.
- **Question cards with timeout fallback.** The 5 interactive question types with sensible defaults on timeout mean the system never blocks on missing human input. Urgency escalation adds the right pressure signal without hard-blocking execution.
- **Clipboard fallback mode for the console.** Acknowledging that the HTTP endpoint won't always be available and providing a clipboard-based alternative shows practical portability thinking.

## What Could Be Better

- **275 tests across 18 files is lean for 6 phases.** Given the security surface (path traversal prevention, write bridge), the HTTP helper endpoint especially could use deeper adversarial testing.
- **Bidirectional control surface adds operational complexity.** The dashboard was read-only before; now it writes to the filesystem. The security boundary (path traversal prevention, subdirectory allowlist) is correct, but the attack surface expanded significantly in one release.

## Lessons Learned

1. **Message bus over direct coupling.** The inbox/outbox filesystem pattern decouples the browser dashboard from GSD execution completely. Either side can be replaced without touching the other -- a design that pays dividends in later releases.
2. **Audit logging should be default for write operations.** JSONL audit logging of all writes through the HTTP helper is low-cost insurance. This becomes the pattern for every subsequent write path in the system.
3. **Configuration forms need structured schemas.** The 7-section milestone configuration form with Zod validation means malformed input is caught at the boundary, not downstream in execution.

---
