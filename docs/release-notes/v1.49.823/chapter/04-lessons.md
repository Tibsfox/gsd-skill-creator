# v1.49.823 — Lessons

## New lesson candidates (0)

No new candidates this ship. Backlog: 0 candidates + ~10-12 tentative observations (UNCHANGED from v822).

## Lessons applied (existing)

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read T1.3-RECON-2026-05-27.md + 4 source files + tsconfig.json. Surfaced the rootdir boundary as a real constraint BEFORE writing code. |
| #10414 | Optional `ctx?`-style parameter | translateSessionEvent's optional `observer?` parameter is byte-equivalent for existing callers. Same zero-churn shape as ProcessContext wiring. |
| #10416 | Tolerant-generator / lightest wire | Resisted tsconfig changes, src/ shim modules, runtime application-boundary wires. Chose: interface + impl + structural satisfaction. |
| #10422 | Verdict-pattern surface separation | Interface (decision-surface) separated from implementation (observability-surface). Clean. |
| #10426 | Cross-class registry extraction at 2nd instance | N/A this ship — 1-instance cross-rootdir wire. Future ships with similar shape could extract a pattern doc. |
| #10427 | Failure-mode contracts | observer.onSkillActivate is called synchronously BEFORE FeedEntry; failures propagate to caller. Load-bearing per the discipline. |
| #10431 | Two-layer closure | Layer 1: interface declaration (v823 lands). Layer 2: application-boundary runtime wire (future ship). |
| #10432 | KNOWN_UNWIRED-style ledger | The wire-pattern is itself a debt-ledger entry until runtime wiring exists. |

## Tentative observations carried forward (~10-12 — UNCHANGED from v822)

All v810-v822 tentative observations carry forward.

## New observations flagged this ship (not promoted; not in count)

**Cross-rootdir wire pattern: interface-in-src + impl-elsewhere + structural satisfaction.** When tsconfig boundaries prevent direct imports, the wire pattern is: declare the interface in the rootdir that's the dependency source (here: src/, which is the dashboard's home); implement the interface in the rootdir that's the implementation source (here: .college/, which is the bridge's home); verify structural satisfaction via a test that doesn't import the dependency. The runtime wire happens at the application boundary (e.g., src-tauri/). Tentative; 1 strong instance. Generalization candidate if 2-3 more cross-rootdir wires emerge.

**TypeScript's bare-function-map gotcha at signature changes.** When a function's signature gains an optional parameter (e.g., `(event)` → `(event, observer?)`), bare-function map callsites like `events.map(translateSessionEvent)` become incorrect: `.map` passes index as 2nd arg, which TypeScript may or may not catch depending on the optional parameter's type. Here, `SkillActivationObserver` vs `number` caught it. Pattern: any optional-2nd-param addition to a function should be paired with a grep for bare-function map callsites. Tentative; 1 instance.

**Structural satisfaction tests verify cross-rootdir wires without imports.** The bridge's structural-satisfaction test uses an inline-typed local variable `{ onSkillActivate(name, sessionId): unknown }` to describe the expected shape WITHOUT importing the interface from src/. The test verifies the bridge fits the shape; the actual interface declaration in src/ is the canonical contract. Pattern: when verifying cross-rootdir contracts, use inline-typed locals on the impl side; the type-check confirms the shape; no import needed. Tentative; 1 instance.

## Cross-references

- #10412 + #10416 → recon-first surfaced the rootdir constraint; lightest-wire respected it (no tsconfig change).
- #10414 + #10422 → optional parameter + verdict-pattern separation: the optional shape lets existing callers ignore the new decision surface.
- #10426 + #10431 → cross-rootdir wire pattern is at 1 instance; if a 2nd emerges, extraction is on the table per #10426; #10431 (two-layer closure) applies because the wire itself has interface + runtime layers.

## What this ship illustrates about T1.3 closure

T1.3 GAP-2 (substrate built, consumer engine not wired) was the audit's framing. The recon doc explicitly identified 3 options (A: gnn-predictor; B: ObservationBridge; C: RosettaEngine confidence-bound). v823 implements Option B — the recon's "Ship 2" choice.

After v823:
- The substrate-to-consumer wire SHAPE is established for the ObservationBridge → dashboard channel.
- The runtime wire is deferred to a future ship at the application boundary.
- Options A and C remain available for future ships if the operator wants deeper T1.3 closure.

T1.3 GAP-2 status: **NARROWED, not fully CLOSED.** The recon's "minimum credible closure" framing supports a future ship marking the GAP-2 ledger entry as CLOSED if a runtime wire at the application boundary lands.

## What this ship illustrates about the v816-822 chain

The chain executed 8 ships in ~3.5 hours, applying the full discipline portfolio: T2.3 wedge closure (3 ships), batch chips (2 ships), gate-flip infrastructure (2 ships), substrate-consumer wire (1 ship). Each ship was independently shippable; chain-mode let them share session-retro continuity without operational tax.

The chain's discipline-application accumulation:
- 0 new lesson candidates promoted (consistent with the v810-814 codify-ship pattern of "codify then forward")
- ~3-5 new tentative observations across the chain (cross-rootdir wire, fork-budget math, ceiling-as-ledger, etc.)
- 1 audit T2.2 wedge closed
- 3 audit T2.3 wedges closed (full T2.3 backlog exhausted)
- 1 T1.3 wire pattern established

Future codify ship will likely promote 2-3 of the accumulated tentative observations to lessons.
