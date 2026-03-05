# Chain Link: v1.16 Dashboard Console & Milestone Ingestion

**Chain position:** 17 of 50
**Milestone:** v1.50.30
**Type:** REVIEW — v1.16
**Score:** 4.25/5.0

---

## Score Trend

```
Pos  Ver    Score  Δ      Commits  Files
 11  v1.10  4.375  +0.025      —    —
 12  v1.11  4.06   -0.315      —    —
 13  v1.12  3.94   -0.12       —    —
 14  v1.13  4.11   +0.17       —    —
 15  v1.14  4.19   +0.08       —    —
 16  v1.15  4.38   +0.19       —    —
 17  v1.16  4.25   -0.13       —    —
rolling: 4.186 | chain: 4.278 | floor: 3.94 | ceiling: 4.75
```

## What Was Built

v1.16 transforms the read-only planning docs dashboard into a bidirectional control surface. 6 phases (128-133), 18 plans, 27 requirements. Core innovation: filesystem message bus using `.planning/console/inbox` and `.planning/console/outbox` directories.

**Filesystem message bus:**
- Inbox/outbox directory pair at `.planning/console/`.
- Zod-validated JSON envelopes for typed message passing.
- Partition enforced by convention: inbox for commands in, outbox for results out.

**HTTP helper:**
- Path traversal prevention with subdirectory allowlist — v1.10 security practices propagating to HTTP layer.
- JSONL audit log for all HTTP operations (append-only).
- Error handling with typed responses.

**Interactive features:**
- Drag-and-drop document ingestion (milestone docs, phase plans).
- 5 interactive question types: text, single-select, multi-select, confirmation, file-path.
- Timeout fallback: unanswered questions resolve to safe defaults.
- Clipboard fallback mode when drag-and-drop unavailable.

**Configuration:** Hot-configurable settings via JSON (no dashboard restart required). Settings validated with Zod.

**Testing:** 275 tests / 27 requirements = 10.2 tests/requirement. Timing-dependent filesystem behavior undertested.

## Scoring

| Dimension | Score | Notes |
|-----------|-------|-------|
| Code Quality | 4.25 | Zod validation on all message envelopes and config. Path traversal prevention wired into HTTP helper. Timeout fallback on all interactive questions. |
| Architecture | 4.5 | Information flow reversal (v1.12 read-only → v1.16 read-write) via filesystem message bus is architecturally clean. Set-theoretic boundary: inbox/outbox partition. |
| Testing | 4.0 | 10.2 tests/req adequate. Timing-dependent filesystem behavior (inbox poll interval, message delivery latency) undertested — known gap. |
| Documentation | 4.0 | Message envelope schema documented via Zod types. Inbox/outbox convention enforced by documentation, not access control — partition is semantic not structural. |
| Integration | 4.5 | Dashboard console integrates with v1.12 (dashboard base), v1.15 (terminal for command execution), v1.10 (security patterns). Hot-configurable settings reduce restart overhead. |
| Patterns | 4.25 | Selective Audit Propagation observed: v1.10 security (path traversal prevention) propagated to HTTP helper but NOT to filesystem bus — partial propagation is the defining instance. |
| Security | 4.25 | Path traversal prevention with allowlist (v1.10 propagation). JSONL audit log provides tamper-evident record. Timeout fallback prevents indefinite blocking. Inbox/outbox partition by convention only — weaker than access control. |
| Connections | 4.25 | Spiral Development: v1.12 static → v1.12.1 live → v1.16 interactive. HTTP security from v1.10. Foundation for v1.18 design system integration. |

**Overall: 4.25/5.0** | Δ: -0.13 from position 16

## Pattern Assessment

| Pattern | Status | Evidence |
|---------|--------|----------|
| P1: CSS/style | STABLE | Hot-configurable CSS theme settings |
| P2: Import patterns | STABLE | Clean imports in console and HTTP helper modules |
| P3: safe* wrappers | STABLE | HTTP helper wraps requests with path traversal prevention |
| P4: Copy-paste | STABLE | 5 question types share response envelope structure |
| P5: Never-throw | IMPROVED | Timeout fallback ensures interactive questions always resolve |
| P6: Composition | STABLE | Console composes dashboard, HTTP helper, question system, drag-and-drop |
| P7: Docs-transcribe | STABLE | Message schemas from first principles |
| P8: Unit-only | STABLE | Tests target message validation and question types directly |
| P9: Scoring duplication | N/A | No scoring formulas in console |
| P10: Template-driven | STABLE | 5 question types follow consistent envelope template |
| P11: Forward-only | STABLE | 27 requirements delivered without fix iterations |
| P12: Pipeline gaps | STABLE | Clipboard fallback closes gap when drag-and-drop unavailable |
| P13: State-adaptive | STABLE | Hot-configurable settings adapt console behavior at runtime |
| P14: ICD | STABLE | Message envelope schema and HTTP helper API documented |

## Feed-Forward

- **Filesystem bus partition by convention is a weakness.** The inbox/outbox partition is enforced by documentation, not file permissions or access control. A process that writes to outbox directly (bypassing the protocol) cannot be detected. For a control surface, this is a meaningful gap. v1.17+ should consider at minimum a validation pass when reading from outbox.
- **Selective Audit Propagation (P-005) is the key pattern finding.** v1.10's path traversal prevention propagated to the HTTP helper but NOT to the filesystem bus. This inconsistency is the clearest evidence that security hardening propagates selectively — to the most recent code (HTTP helper, new in v1.16) but not to the filesystem abstraction that was inherited. Future security reviews should explicitly check all file operation paths.
- **Timing-dependent filesystem behavior needs testing strategy.** Inbox polling, message delivery latency, and timeout fallback all depend on timing. Test infrastructure for deterministic timing (fake clocks, event injection) would close this gap without flaky integration tests.
- The interactive question types (5 types, timeout fallback) are a UX pattern worth generalizing. Any system that needs human confirmation during automation should use the same pattern.

## Key Observations

**Information flow reversal is the architectural milestone.** v1.12 built a read-only dashboard; v1.16 makes it read-write via a filesystem message bus. The choice of filesystem (not HTTP, not WebSocket) for the message bus is deliberate: files are persistent, inspectable, and survive process restarts. The `.planning/console/inbox` directory is a mailbox — a concept with decades of precedent in Unix systems.

**Selective Audit Propagation (P-005) is observed here definitively.** Security practices from v1.10 propagated to the HTTP helper (which receives the most scrutiny as a network-facing component) but not to the filesystem bus (which was designed as "just directories"). This is the exact behavior the pattern predicts: security hardening propagates to the most visible code paths, not uniformly to all code paths. Three observations confirm this as a promotable pattern.

**The -0.13 delta from v1.15 reflects the integration seam cost.** v1.16 adds 27 requirements of interactive features on top of the v1.12 dashboard foundation. Integration seams — between the console and the dashboard, between the HTTP helper and the filesystem bus, between question types and their renderers — each introduce subtle gaps. The score reflects correct individual components with gaps at their connections.

## Reflection

v1.16 completes the three-iteration dashboard spiral: static (v1.12) → live (v1.12.1) → interactive (v1.16). Each iteration added a new dimension without replacing the previous: the interactive console sits on top of the live metrics dashboard. The architecture is genuinely layered.

At chain position 17, the recovery from the dashboard floor is complete but the ceiling (4.75) remains distant. The rolling average (4.186) includes the trough positions; the chain average (4.278) reflects the project's sustained quality level.

The partial security propagation finding (P-005) is this position's most significant contribution to the chain narrative. Security practices established in v1.10 are spreading — but selectively, not uniformly. This is the expected behavior of a large codebase: hardening radiates from the code that gets reviewed most carefully, not from a central enforcement point. Understanding this dynamic helps predict where future vulnerabilities will concentrate.
