# v1.16 — Dashboard Console & Milestone Ingestion

**Released:** 2026-02-13
**Scope:** feature — bidirectional dashboard control surface via filesystem message bus, HTTP helper endpoint, upload zone, milestone configuration, question cards, hot-configurable settings, and activity timeline
**Branch:** dev → main
**Tag:** v1.16 (2026-02-13T09:11:25-08:00) — "Dashboard Console & Milestone Ingestion"
**Predecessor:** v1.15 — Live Dashboard Terminal
**Successor:** v1.17 — Staging Layer
**Classification:** feature release — flips the v1.12 dashboard from read-only to read/write, closing the loop started by v1.15's embedded terminal
**Phases:** 128–133 (6 phases) · **Plans:** 18 · **Requirements:** 27
**Stats:** 48 commits across v1.15..v1.16 (25 feat/fix/refactor, 20 test, 3 docs) · 77 files changed · 13,946 insertions / 122 deletions · 275 tests across 18 test files
**Verification:** Zod round-trip on `MessageEnvelopeSchema`, `QuestionSchema`, `MilestoneConfigSchema` · path-traversal 403 path exercised in helper integration tests · inbox lifecycle (pending → acknowledged) covered by `MessageReader`/`MessageWriter` · clipboard fallback toast + offline banner rendered in `console-activity.test.ts` · `serve-dashboard.integration.test.ts` asserts helper router coexistence with SSE and `/api/check`

## Summary

**v1.16 completes the bidirectional loop the v1.12→v1.15 arc was pointing at.** v1.12 gave the dashboard a body (static generation + file watch). v1.13 gave it a session pulse. v1.14 gave it a promotion pipeline. v1.15 gave it an embedded terminal. Through v1.15 the dashboard could show everything the GSD workflow knew, but it could not *receive* anything — the only way to drive GSD from the browser was to alt-tab into the newly embedded terminal and type. v1.16 closes that gap. It turns the dashboard surface into a control surface: a user can now drag a vision document onto the browser, fill out a seven-section milestone configuration form, answer structured question cards, adjust live settings, and watch an activity timeline populate in real time — without ever leaving the tab and without the dashboard growing a server-side state store. Six phases (128 through 133), eighteen plans, forty-eight commits, twenty-seven requirements, and two hundred and seventy-five tests later, the dashboard is a read/write console. The design constraint throughout was that *the dashboard must not become a server*; every interaction has to survive page refresh, process restart, and tool failures without inventing shared state beyond what the filesystem already provides.

**The filesystem message bus is the single load-bearing design decision of v1.16, and every later release inherits it.** Phase 128 landed `.planning/console/` with `inbox/`, `outbox/`, and `logs/` subdirectories, each governed by `MessageEnvelopeSchema` — a Zod schema that discriminates on message `type` and enforces `pending → acknowledged` lifecycle semantics with ISO timestamps on every transition. The browser writes into `inbox/`, GSD reads from `inbox/` and writes acknowledgements and outbound prompts into `outbox/`. There is no WebSocket, no server state beyond process-local file handles, no shared mutable memory between the two sides. Every debuggable property (atomic rename semantics, plaintext inspection, `ls` as your queue viewer, `rm` as your purge tool, `cat` as your stack trace) is a direct consequence of choosing files over in-process channels. The discipline paid off in phase 129 when the helper endpoint had to be built: the helper only needed to know how to `write` safely; it did not need to understand message routing, message types, or session state, because all of that lives in the schema, not in the transport. `src/console/writer.ts` and `src/console/reader.ts` are both under 150 lines each.

**The HTTP helper endpoint is deliberately minimal and deliberately dangerous, so every safeguard must be paranoid.** Phase 129 shipped `src/console/helper.ts` — a browser→filesystem write bridge whose entire purpose is to let untrusted browser-origin POSTs land as files on disk. That is a small endpoint that opens a large attack surface, so the implementation treats path traversal, subdirectory scope, content validation, and audit logging as non-negotiable preconditions. The `createHelperRouter` factory accepts only a root path and a subdirectory allowlist; every write is rebased, canonicalized via `path.resolve`, and rejected with HTTP 403 if the resolved path escapes the allowlist. Every write emits a JSONL line to `.planning/console/logs/bridge.jsonl` with request timestamp, method, resolved path, byte count, and response code. The endpoint does exactly one thing (write a validated envelope under an allowed subdirectory) and logs every single time it does it. Phase 133-01 then wired the router into `serve-dashboard.mjs` with graceful degradation — if `dist/console/helper.js` is not compiled, the server still starts and serves the static dashboard, it just does not accept writes. Failure isolation was a hard requirement: the helper can be broken without breaking the dashboard.

**Upload zone and milestone configuration form turn "I have a plan" into a first-class GSD input.** Phase 129-03 landed `src/console/upload-zone.ts` (drag-and-drop markdown ingestion with title extraction, H1/H2 section enumeration, and word count) and phase 129-04 landed `src/console/milestone-config.ts` with `MilestoneConfigSchema` — a Zod schema covering milestone name, goal, constraints, priorities, target versions, test strategy, and rollout expectations across seven structured sections. The form renderer in `src/console/config-form.ts` emits HTML controls per schema field, which means adding a new milestone configuration dimension is a one-line schema change plus an automatic renderer update — not a dozen files touched across the dashboard. The submit flow lands in `src/console/submit.ts`; it bundles the validated config into a `milestone_config` message envelope and POSTs through the helper. A malformed form round-trips through the schema before it ever touches the inbox, so downstream consumers can trust the shape they read. This is the v1.10 safe-deserialization discipline applied to human input rather than to disk artifacts.

**Question cards and timeout responders give GSD a way to ask the user structured questions without blocking.** Phase 131-02 landed `src/console/question-card.ts` with five input types — binary (yes/no), choice (single-select from enumerable options), multi-select (subset of options with optional minimum/maximum counts), text (free-form with regex validation), and confirmation (destructive-action double-prompt with a required typed phrase) — each covered by `QuestionSchema` in phase 131-01. Phase 131-03 landed `src/console/question-responder.ts`, a poller that watches `inbox/` for responses on a question id and falls back to a `default_on_timeout` value if the user does not reply within the question's `timeout_seconds` window. Urgency escalation is a schema field: `normal`, `elevated`, `critical`. Critical questions refuse a timeout default and block execution until answered, which is how destructive operations (unwind plans, branch deletions, production promotions) get a reversible boundary. The key insight is that timeouts are not failures — they are a *legitimate response pattern* that a well-designed question encodes up-front, and only dangerous questions reject them.

**The console dashboard page is the first dashboard surface that is hot-configurable end-to-end.** Phase 132-01 landed `src/dashboard/console-page.ts` as a new panel in the dashboard generator pipeline. Phase 132-02 added a settings panel with a hot/non-hot split — hot settings (verbosity, toast duration, polling cadence, activity filter) apply on next render with no restart; non-hot settings (base path, helper port, allowed subdirectories) require a server restart and say so explicitly in the UI. The dashboard re-reads `bridge.jsonl` on every watched change and the hot controls mutate render-only state, so a user can tune the experience in real time and never lose activity. Phase 132-03 added the activity timeline — reverse-chronological rendering of bridge log entries with five color-coded badges (config, response, submit, upload, error), relative timestamps with full ISO in `title` tooltips, a fifty-entry ceiling, and an empty-state message when nothing has happened yet. The clipboard fallback wraps `fetch` so that when the helper endpoint is not reachable, the form `copy`s the would-be POST body to the clipboard and shows a persistent offline banner. That two-mode behavior (endpoint or clipboard) is what makes the console portable to environments without server privileges — a Cloud Shell, a corporate VDI, a remote SSH tunnel — without demanding one.

**Test-first discipline was uniform across every plan.** The git log between v1.15 and v1.16 reads `test(N-M) → feat(N-M)` for every one of the eighteen plans: twenty test-first commits landed before the twenty-five matching feat/fix/refactor commits, with three docs commits tracking plan completion. Two hundred and seventy-five tests across eighteen test files is an average of fifteen tests per plan and slightly over ten tests per requirement — enough to exercise happy path, schema rejection, path-traversal rejection, timeout fallback, and the five-input-type matrix on question cards. The integration test file `src/serve-dashboard.integration.test.ts` explicitly asserts that the helper router coexists with the SSE stream and the `/api/check` route without swallowing unmatched requests, which caught one regression during implementation when the router order was wrong. Every test file is colocated with its source — `src/console/helper.test.ts` next to `src/console/helper.ts` — extending the v1.15 convention.

**v1.16 is the release where the dashboard stops being a display and starts being a workstation.** Every subsequent release in the v1.1x/v1.2x/v1.3x lines consumes the message bus: v1.17's staging pipeline reads approvals from `inbox/`, v1.18's information design writes its preferences through the helper, v1.19's budget display uses the activity timeline pattern, v1.20's dashboard assembly normalizes the settings panel, and v1.39's GSD-OS bootstrap reuses the whole console as its first-user-experience front end. The filesystem message bus survived the transition into v1.22's cartridge system and v1.48's native Tauri shell unchanged, because files remain the lingua franca even after the transport sugar changes. v1.16's six phases look small on the surface — twenty-seven requirements, seventy-seven files, 13,946 insertions — but they define the interaction protocol that the next thirty-three releases assume without restating.

## Key Features

| Area | What Shipped |
|------|--------------|
| Message bus foundation (Phase 128) | `.planning/console/` directory layout with `inbox/`, `outbox/`, `logs/` — created by `src/console/directory.ts` |
| Message bus foundation (Phase 128) | `MessageEnvelopeSchema` — Zod schema with type discrimination + `pending → acknowledged` lifecycle in `src/console/schema.ts` |
| Message bus foundation (Phase 128) | `MessageWriter` + `MessageReader` atomic rename envelope I/O in `src/console/writer.ts` + `src/console/reader.ts` |
| Message bus foundation (Phase 128) | `check-inbox.sh` session-side polling shell helper for session-start / phase-boundary / post-verification hooks |
| HTTP helper endpoint (Phase 129) | `createHelperRouter` with root + subdirectory allowlist, path canonicalization, HTTP 403 on traversal in `src/console/helper.ts` |
| HTTP helper endpoint (Phase 129) | `bridgeLogger` JSONL append to `.planning/console/logs/bridge.jsonl` — every write audited with timestamp, path, bytes, status |
| Upload + configuration (Phase 129) | Upload zone with drag-and-drop + title/H1/H2/word-count extraction in `src/console/upload-zone.ts` |
| Upload + configuration (Phase 129) | `MilestoneConfigSchema` — 7-section Zod schema (name, goal, constraints, priorities, versions, tests, rollout) in `src/console/milestone-config.ts` |
| Upload + configuration (Phase 129) | Config-form HTML renderer emitting controls per schema field in `src/console/config-form.ts`; submit flow in `src/console/submit.ts` |
| Inbox handler (Phase 130) | `gsd-dashboard-console` skill for lifecycle inbox checks at session-start, phase-boundary, post-verification |
| Inbox handler (Phase 130) | Message handler, status writer, write-question / write-status / validate-config scripts under `src/console/` |
| Question cards (Phase 131) | `QuestionSchema` — Zod schema covering 5 input types + urgency tiers in `src/console/question-schema.ts` |
| Question cards (Phase 131) | 5-input renderer (binary, choice, multi-select, text, confirmation) in `src/console/question-card.ts` |
| Question cards (Phase 131) | Question poller + timeout responder with per-urgency timeout semantics in `src/console/question-responder.ts` |
| Console page (Phase 132) | Console dashboard page renderer wired into dashboard generator pipeline in `src/dashboard/console-page.ts` |
| Console page (Phase 132) | Settings panel with hot (render-time) vs non-hot (restart-required) split, clearly labelled in the UI |
| Console page (Phase 132) | Activity timeline — reverse-chronological `bridge.jsonl` entries, 5 color-coded badges, relative timestamps, 50-entry ceiling in `src/dashboard/console-activity.ts` |
| Console page (Phase 132) | Clipboard fallback mode — `fetch` wrapper with toast notification + persistent offline banner when helper is unreachable |
| Server wiring (Phase 133) | Helper router wired into `serve-dashboard.mjs` via dynamic `loadHelperRouter()` with graceful degradation when `dist/` not compiled |
| Server wiring (Phase 133) | Startup banner advertises helper endpoint URL; SSE + `/api/check` preserved, unmatched routes still fall through to 404 |
| Test coverage | 275 tests across 18 test files · uniform test-first rhythm (`test(N-M)` before `feat(N-M)`) across all 18 plans |

## Retrospective

### What Worked

- **Filesystem message bus as the integration primitive.** Using `.planning/console/` with inbox/outbox and Zod-validated JSON envelopes gave a clean, debuggable, testable boundary between browser and GSD. No WebSocket complexity, no server state — just files, `ls`, `cat`, and atomic rename. Survives page refresh, process restart, and partial crashes without inventing shared state.
- **Question cards with timeout fallback and urgency escalation.** Five interactive question types with typed schemas mean the system never blocks on missing human input at normal/elevated urgency, but `critical` questions explicitly refuse a timeout default so destructive operations stay reversible. Timeouts become a modelled response pattern, not a failure mode.
- **Clipboard fallback mode for the console.** Acknowledging that the HTTP endpoint will not always be available (Cloud Shell, VDI, SSH-only environments) and providing a clipboard-based alternative shows practical portability. The two-mode UI (endpoint active → direct POST, endpoint absent → copy-to-clipboard + offline banner) degrades without silently losing input.
- **JSONL audit logging as a default for every write operation.** `bridge.jsonl` with timestamp, method, path, bytes, and response code on every helper write is low-cost insurance that paid off immediately — the activity timeline in phase 132-03 is literally just a renderer over the audit log. Logging produced the UI for free.
- **Hot vs non-hot settings split with honest labels.** Rather than pretending every setting is live-editable, the UI explicitly labels the ones that require a restart. The user learns the actual shape of the system instead of debugging why a setting "did not take".

### What Could Be Better

- **275 tests across 18 files is lean for the security surface.** Path-traversal prevention, write bridge, inbox polling, timeout responder, and multi-type question validation are each high-value targets. Adversarial testing (fuzzing helper POSTs, oversized envelopes, pathological JSON, simultaneous write races) is still pending; the v1.16 tests cover the happy path and a few representative rejections but not the attacker model.
- **Bidirectional control surface expanded the attack surface significantly in one release.** The dashboard went from a pure reader to a writer with filesystem privileges. The subdirectory allowlist + path canonicalization + HTTP 403 are the correct controls, but the review was single-author — a second pair of eyes or a threat-model document should have predated the merge to main.
- **No rate limiting or backpressure on the helper endpoint.** The current helper writes on every POST without throttling; a buggy or hostile client can fill `inbox/` with an unbounded number of envelopes. A max-in-flight ceiling plus a retry-after response should land in a follow-up patch before v1.20.
- **Skill for lifecycle inbox polling is a thin contract.** `gsd-dashboard-console` checks at session-start, phase-boundary, and post-verification but has no adjustable cadence or batch size; for long-running phases the polling rhythm may be too sparse. A configurable interval should follow with v1.17's staging pipeline pressure-testing the current defaults.

## Lessons Learned

1. **The filesystem is the cheapest message bus you can buy.** Before reaching for WebSocket, Redis, or a custom socket protocol, ask whether `mkdir -p inbox/ outbox/` plus an atomic-rename writer and a directory-poll reader solves the problem. For browser↔GSD it did, with all the debuggability of POSIX files and none of the session-state complexity of a stateful transport.
2. **Schema-discriminated envelopes make a transport self-describing.** `MessageEnvelopeSchema` carries a `type` field that Zod uses as a discriminator; every reader can dispatch on `type` without needing a separate routing layer. A new message type is one schema addition and one handler — not a new endpoint, not a new queue, not a new contract.
3. **Audit logging should be a precondition for any write endpoint, not an afterthought.** `bridge.jsonl` costs one append per request and buys a complete activity history. The phase 132-03 activity timeline is a direct derivative of the log; adding observability to the write path first made the read path a render-over-logs, not a separate data source.
4. **Path canonicalization plus an explicit allowlist beats string-matching every time.** `path.resolve(root, submitted)` followed by a `startsWith(root)` check on the resolved result rejects `../../../etc/passwd`, `/etc/passwd`, and Unicode-normalized tricks that a naïve `replace('../','')` filter would miss. Canonicalize, then compare.
5. **Timeouts should be a first-class response pattern, not a failure.** Question cards modelled `timeout_seconds` + `default_on_timeout` + urgency tiers explicitly. At `normal` urgency a silent user is a modelled response ("proceed with default"); at `critical` urgency it is explicitly *not* ("block"). Making the policy part of the question removed a whole class of "what happens if the user walks away" bugs.
6. **Graceful degradation around the transport is a shippable feature, not just hygiene.** The helper endpoint loads dynamically; if `dist/console/helper.js` is missing, `serve-dashboard.mjs` still starts and logs a warning. The clipboard fallback kicks in when the helper is unreachable. Two separate degradation paths, each shippable — and each makes the whole system work in environments the happy path does not reach.
7. **Hot-configurable settings need honest labels.** Not every knob is live-editable without a restart; pretending otherwise teaches users to distrust the UI. The console's hot/non-hot split puts the truth in the interface; users form a correct model of what costs a restart and what does not.
8. **Colocated test files + red-green TDD scale cleanly to ~18 plans.** Eighteen plans, twenty test-first commits, twenty-five feat/fix/refactor commits, three docs commits — every plan legible as a sequence of `test(N-M) → feat(N-M)` pairs in `git log --oneline`. Archaeology stays easy; a future reader can `git show <test-sha>` to see the requirement encoded as tests before implementation existed.
9. **Build the inbox skill at the same time as the inbox.** Phase 130 shipped both the data (message handler, status writer, validate-config scripts) and the lifecycle hook (`gsd-dashboard-console` skill that polls at session-start / phase-boundary / post-verification). Shipping the consumer with the producer avoided the integration gap where a message bus exists but nothing in the agent flow knows to read it.
10. **Graceful degradation and startup diagnostics close the integration gap.** Phase 133-01 was the smallest phase by LOC (one file wired, 240 integration tests) but it was the piece that made the whole release *work* for users. Wiring the helper into `serve-dashboard.mjs` with a startup banner and a graceful-degradation fallback turned six phases of isolated modules into one cohesive console.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.10](../v1.10/) | Safe-deserialization discipline — `MessageEnvelopeSchema`, `QuestionSchema`, `MilestoneConfigSchema` inherit the Zod schema-first parsing pattern v1.10 normalized |
| [v1.11](../v1.11/) | GSD Integration Layer — composite `IntegrationConfig` that v1.16's console + helper settings extend |
| [v1.12](../v1.12/) | GSD Planning Docs Dashboard — the read-only body that v1.16 flips to read/write |
| [v1.12.1](../v1.12.1/) | Live Metrics Dashboard — dashboard-generation pipeline that v1.16's console page renderer joins |
| [v1.13](../v1.13/) | Session Lifecycle & Workflow Coprocessor — session phase boundaries are where `check-inbox.sh` hooks fire |
| [v1.14](../v1.14/) | Promotion Pipeline — workflow surface that v1.16's question cards gate at `critical` urgency |
| [v1.15](../v1.15/) | Live Dashboard Terminal — immediate predecessor; v1.15 added the terminal, v1.16 adds the control surface that obsoletes most reasons to open it |
| [v1.17](../v1.17/) | Staging Layer — immediate successor; reads milestone-config envelopes from `.planning/console/inbox/` as its primary input |
| [v1.18](../v1.18/) | Information Design System — uses the helper endpoint to persist dashboard preferences |
| [v1.19](../v1.19/) | Budget Display Overhaul — reuses the activity-timeline rendering pattern for cost events |
| [v1.20](../v1.20/) | Dashboard Assembly — normalizes the settings panel layout across all dashboard surfaces |
| [v1.21](../v1.21/) | GSD-OS Desktop Foundation — Tauri shell that eventually hosts the console natively, but the filesystem bus survives unchanged |
| [v1.39](../v1.39/) | GSD-OS Bootstrap & READY Prompt — the 7-service launcher that presents v1.16's console as its first-user-experience front end |
| `.planning/console/` | Runtime inbox/outbox/logs directory — atomic-rename message lifecycle, JSONL audit trail |
| `src/console/` | Helper endpoint + schemas + writer/reader + question card + milestone config (21 source files + 13 test files) |
| `src/dashboard/console-page.ts` + `src/dashboard/console-activity.ts` | Console dashboard page renderer + activity timeline |
| `serve-dashboard.mjs` | Dashboard server with dynamically-loaded helper router + graceful degradation |
| `src/serve-dashboard.integration.test.ts` | End-to-end helper-router coexistence with SSE + `/api/check` |
| `.planning/MILESTONES.md` | Canonical phases 128–133 detail (18 plans, 27 requirements) |

## Engine Position

v1.16 is the pivot release of the "dashboard becomes a workstation" arc started at v1.12. v1.12 shipped the static dashboard; v1.13 added session lifecycle; v1.14 added the promotion pipeline; v1.15 embedded the terminal; v1.16 flips the dashboard from read-only to read/write and defines the filesystem message-bus contract that every subsequent release assumes. The specific primitives that start here and stay load-bearing — `MessageEnvelopeSchema`, the `inbox/outbox/logs` directory shape, `bridgeLogger`'s JSONL audit pattern, the subdirectory-allowlist + path-canonicalization helper-endpoint contract, the five-input-type `QuestionSchema`, and the hot/non-hot settings split — recur unchanged through v1.17's staging pipeline, v1.18's information design preferences, v1.19's budget events, v1.20's dashboard assembly, v1.21's Tauri host, v1.22's cartridge ingestion, v1.39's GSD-OS bootstrap, and v1.48's native shell. The release is small on the surface (six phases, 27 requirements, 77 files) but it is the release the next thirty-three versions take for granted. Every later README that says "the dashboard receives X" or "a question card asks Y" is consuming v1.16's contract without restating it.

## Files

- `src/console/schema.ts` + `src/console/schema.test.ts` — `MessageEnvelopeSchema` with type discrimination + lifecycle
- `src/console/writer.ts` + `src/console/writer.test.ts` — `MessageWriter` atomic-rename envelope I/O
- `src/console/reader.ts` + `src/console/reader.test.ts` — `MessageReader` directory-poll inbox consumer
- `src/console/directory.ts` + `src/console/directory.test.ts` — `.planning/console/{inbox,outbox,logs}/` creation and validation
- `src/console/helper.ts` + `src/console/helper.test.ts` — `createHelperRouter` with subdirectory allowlist + path canonicalization + HTTP 403 on traversal
- `src/console/bridge-logger.ts` + `src/console/bridge-logger.test.ts` — JSONL audit append to `.planning/console/logs/bridge.jsonl`
- `src/console/milestone-config.ts` + `src/console/milestone-config.test.ts` — `MilestoneConfigSchema` (7-section Zod schema) + defaults
- `src/console/question-schema.ts` + `src/console/question-schema.test.ts` — `QuestionSchema` covering 5 input types + urgency tiers
- `src/console/question-responder.ts` + `src/console/question-responder.test.ts` — poller + timeout fallback + urgency escalation
- `src/console/message-handler.ts` + `src/console/message-handler.test.ts` — inbox dispatch by message `type`
- `src/console/status-writer.ts` + `src/console/status-writer.test.ts` — GSD→browser status envelope writer
- `src/console/validate-config.ts` + `src/console/validate-config.test.ts` — milestone config validator script
- `src/console/write-question.ts` + `src/console/write-status.ts` — GSD-side outbound writers with matching test files
- `src/console/check-inbox.test.ts` — integration tests for `check-inbox.sh` lifecycle hook
- `src/console/skill.test.ts` — `gsd-dashboard-console` skill contract tests
- `src/dashboard/console-page.ts` + `src/dashboard/console-page.test.ts` — console panel renderer wired into dashboard generator
- `src/dashboard/console-activity.ts` + `src/dashboard/console-activity.test.ts` — activity-timeline renderer + clipboard-fallback wrapper (385 src lines, 188 test lines)
- `serve-dashboard.mjs` — helper router wired via `loadHelperRouter()` with graceful degradation when `dist/` not compiled
- `src/serve-dashboard.integration.test.ts` — 240-line integration test: SSE + `/api/check` + helper router coexistence, path-traversal 403, 404 fallthrough
- `examples/skills/gsd-dashboard-console/` + `project-claude/skills/gsd-dashboard-console/` — lifecycle inbox-checking skill
- `.planning/console/` — runtime inbox/outbox/logs directories (created at first run)
- `.planning/MILESTONES.md` — canonical phases 128–133 detail (18 plans, 27 requirements)

## Version History (preserved from original release notes)

The v1.16 tag is part of the v1.x line that extends the v1.0 adaptive learning loop. The table below is the line as it stood at v1.16 release time; it is retained here for archival continuity.

| Version | Summary |
|---------|---------|
| **v1.16** | Dashboard Console & Milestone Ingestion — filesystem message bus, helper endpoint, upload zone, question cards, activity timeline (this release) |
| **v1.15** | Live Dashboard Terminal |
| **v1.14** | Promotion Pipeline |
| **v1.13** | Session Lifecycle & Workflow Coprocessor |
| **v1.12.1** | Live Metrics Dashboard |
| **v1.12** | GSD Planning Docs Dashboard |
| **v1.11** | GSD Integration Layer |
| **v1.10** | Security Hardening |
| **v1.9** | Ecosystem Alignment & Advanced Orchestration |
| **v1.8.1** | Audit Remediation (Patch) |
| **v1.8** | Capability-Aware Planning + Token Efficiency |
| **v1.7** | GSD Master Orchestration Agent |
| **v1.6** | Cross-Domain Examples |
| **v1.5** | Pattern Discovery |
| **v1.4** | Agent Teams |
| **v1.3** | Documentation Overhaul |
| **v1.2** | Test Infrastructure |
| **v1.1** | Semantic Conflict Detection |
| **v1.0** | Core Skill Management |
