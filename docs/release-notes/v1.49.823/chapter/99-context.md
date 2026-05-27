# v1.49.823 — Context

## Provenance

- **Source:** v815 handoff "Highest-ROI next ship candidates" item #9 (T1.3 Ship 2 = Option B). Recon at `.planning/T1.3-RECON-2026-05-27.md`.
- **Trigger:** Operator selected the v816-822 chain at session-start; this ship is the final item (#7 of 7).
- **Predecessor ship:** v1.49.822 (T2.2 Part 2: Discipline-coverage Gate Default-BLOCK Flip); shipped 2026-05-27 ~12:01 UTC.
- **Session boundary:** Chain-mode (final ship of the v816-822 chain).

## The rootdir boundary

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "rootDir": "src",
    ...
  },
  "include": ["src/**/*"]
}
```

This means:
- `src/` files cannot `import from '../.college/...'` (rootDir constraint).
- `.college/` is not part of the main TypeScript build (only test runner sees it via vitest config).
- The dist/ output only contains src/ compiled files; .college/ is build-time test-only and source-of-truth-only.

## Why the wire is split

Three options were considered for v823:

| Option | Approach | Trade-off |
|---|---|---|
| **Change tsconfig** | Add .college/ to rootDir or expand include | Cross-cutting change; risk of breaking other parts of the build |
| **src/ shim layer** | New `src/integration/college-bridge.ts` that re-exports from .college/ | Requires build-time injection; .college/ source still not in src/ |
| **Interface + impl + structural satisfaction** (chosen) | Declare interface in src/; implement in .college/; verify via test | Respects boundary; clean separation; pattern reusable |

Chose Option 3 per #10416 lightest-wire. The runtime wire is deferred to the application boundary.

## The 3-piece structure

### Piece 1: Interface in src/

```ts
// src/dashboard/activity-tab-toggle.ts
export interface SkillActivationObserver {
  onSkillActivate(skillName: string, sessionId: string): void;
}

export function translateSessionEvent(
  event: SessionEvent,
  observer?: SkillActivationObserver,
): FeedEntry {
  if (observer && event.type === 'skill-activate') {
    observer.onSkillActivate(event.entityName, event.entityId);
  }
  return { ... };
}
```

### Piece 2: Implementation in .college/

```ts
// .college/integration/observation-bridge.ts
export class ObservationBridge {
  onSkillActivate(skillName: string, sessionId: string): CollegeObservationEvent {
    const event: CollegeObservationEvent = {
      id: this.nextId(),
      type: 'skill-activation',
      conceptId: skillName,
      sessionId,
      timestamp: Date.now(),
    };
    this.buffer.push(event);
    this.notify(event);
    return event;
  }
}
```

### Piece 3: Structural-satisfaction test (in .college/)

```ts
// .college/integration/observation-bridge.test.ts
it('ObservationBridge satisfies the SkillActivationObserver structural contract', () => {
  const bridge = new ObservationBridge(makeConfig());
  const observer: { onSkillActivate(name: string, sessionId: string): unknown } = bridge;
  const result = observer.onSkillActivate('test-skill', 'sess-x');
  expect(result).toBeDefined();
});
```

The inline-typed `observer` variable describes the SkillActivationObserver shape WITHOUT importing it from src/. The assignment `= bridge` succeeds iff ObservationBridge structurally satisfies the interface. The test passes when the contract holds; fails when the bridge's shape drifts away from the interface.

## The deferred runtime wire

v823 doesn't wire the bridge into production runtime. To complete the wire at the application boundary, a future ship would need to:

1. Create an ObservationBridge instance at the application's entry point (e.g., dashboard renderer, Tauri main, integration test).
2. Pass it to every `translateSessionEvent(event, bridge)` call.
3. Decide how to flush() the bridge's accumulated events (timer-based, threshold-based, end-of-session).

This is operator-discretion future work. The wire's SHAPE is established; the wire's RUNTIME is deferred.

## Why the FeedEntry shape is preserved

The wire is observability-only — observer.onSkillActivate is called BEFORE FeedEntry construction, but the FeedEntry itself is unchanged. Existing dashboard rendering continues to work; the bridge gets a heads-up about skill-activate events without affecting the rendering flow. This is consistent with #10422 (verdict-pattern surface separation): the wire surface is separate from the render-decision surface.

## The CollegeObservationEvent type extension

Pre-v823:
```ts
type: 'exploration' | 'translation';
```

Post-v823:
```ts
type: 'exploration' | 'translation' | 'skill-activation';
sessionId?: string;  // NEW optional field
```

The type union grew; the sessionId field is new and optional. Existing consumers (event listeners, toSessionObservation, flush) handle the new shape:
- Listeners: receive 'skill-activation' events too.
- toSessionObservation: 'skill-activation' adds 'skill-activate' to topTools.
- flush: unchanged.

Backward compat preserved: existing exploration/translation events don't populate sessionId; consumers that read it should handle `sessionId === undefined`.

## Engine state crossover

NASA degree sustains at **1.178** for the 41st consecutive ship. Counter-cadence count UNCHANGED at 6.

The codify ⟂ consume ⟂ calibrate ⟂ observe quadrant:
- **Consume:** consume-axis (close a T1.3-style wire wedge).
- **Codify:** N/A directly.
- **Calibrate:** N/A.
- **Observe:** the wire IS observability surface (records skill-activate events for downstream consumption).

## Predecessor handoff reference

See `.planning/HANDOFF-2026-05-27-v1.49.815-t2.3-high-01-pmtiles-refcount-shipped.md` for the v816-822 chain plan.

## Forward path post-v823

Chain CLOSED at v823. Total: 8 ships, ~3.5 hours wall-clock.

A new handoff doc (separate ship) will summarize:
- v816-822 chain results
- Audit T2.x status (T2.2 closed, T2.3 closed, T2.1 still operator-bounded)
- T1.3 status (Option B wire pattern established; Options A and C deferred)
- KNOWN_UNWIRED Process trajectory (37 → 31; -6 across chain)
- Codify candidates accumulated across the chain
- Forward-cadence options for next session

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + Lesson #10184 + Lesson #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- v823 used the v816-fixed `state-md-set-shipped` tool for STATE.md reset.
- Eighth consecutive post-v816 ship with clean colon-handling.
- This is the chain's closing ship; next session starts fresh.
