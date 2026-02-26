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

---
