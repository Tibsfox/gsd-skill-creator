# v1.16 — Dashboard Console & Milestone Ingestion

**Shipped:** 2026-02-13
**Phases:** 128-133 (6 phases) | **Plans:** 18 | **Requirements:** 27

Transform the read-only dashboard into a bidirectional control surface where users upload vision documents, configure milestone execution settings, answer structured planning questions, and adjust live settings — all via filesystem message bus.

### Key Features

**Filesystem Message Bus (Phase 128):**
- `.planning/console/` directory with inbox/outbox structure
- Zod-validated JSON envelopes with message type discrimination
- Directional routing: browser writes to inbox, GSD reads from inbox/writes to outbox
- Message lifecycle: pending → acknowledged with timestamps

**HTTP Helper Endpoint (Phase 129):**
- Browser→filesystem write bridge for dashboard forms
- Path traversal prevention with subdirectory allowlist
- JSONL audit logging of all write operations

**Upload Zone & Configuration (Phase 130):**
- Drag-and-drop markdown document ingestion
- Document metadata extraction (title, sections, word count)
- 7-section milestone configuration form (name, goal, constraints, priorities, etc.)

**Inbox Checking (Phase 131):**
- GSD skill checking inbox at session-start, phase-boundary, and post-verification
- Message type dispatch routing to appropriate handlers

**Question Cards (Phase 132):**
- 5 interactive question types: binary, choice, multi-select, text, confirmation
- Timeout fallback with sensible defaults
- Urgency escalation for time-sensitive decisions

**Console Dashboard Page (Phase 133):**
- Live session status display
- Hot-configurable settings panel (modify settings without restart)
- Activity timeline showing recent operations
- Clipboard fallback mode for environments without HTTP endpoint

### Test Coverage

- 275 tests across 18 test files

## Retrospective

### What Worked
- **Filesystem message bus as the integration primitive.** Using `.planning/console/` with inbox/outbox and Zod-validated JSON envelopes gave a clean, debuggable, testable boundary between browser and GSD. No WebSocket complexity, no server state -- just files.
- **Question cards with timeout fallback.** The 5 interactive question types with sensible defaults on timeout mean the system never blocks on missing human input. Urgency escalation adds the right pressure signal without hard-blocking execution.
- **Clipboard fallback mode for the console.** Acknowledging that the HTTP endpoint won't always be available and providing a clipboard-based alternative shows practical portability thinking.

### What Could Be Better
- **275 tests across 18 files is lean for 6 phases.** Given the security surface (path traversal prevention, write bridge), the HTTP helper endpoint especially could use deeper adversarial testing.
- **Bidirectional control surface adds operational complexity.** The dashboard was read-only before; now it writes to the filesystem. The security boundary (path traversal prevention, subdirectory allowlist) is correct, but the attack surface expanded significantly in one release.

## Lessons Learned

1. **Message bus over direct coupling.** The inbox/outbox filesystem pattern decouples the browser dashboard from GSD execution completely. Either side can be replaced without touching the other -- a design that pays dividends in later releases.
2. **Audit logging should be default for write operations.** JSONL audit logging of all writes through the HTTP helper is low-cost insurance. This becomes the pattern for every subsequent write path in the system.
3. **Configuration forms need structured schemas.** The 7-section milestone configuration form with Zod validation means malformed input is caught at the boundary, not downstream in execution.

---
