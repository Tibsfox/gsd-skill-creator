// Sample-mission forest module -- smoke-test fixture.
// Satisfies the forest-module-api.md contract without requiring a running
// forest sim; enable() / disable() are idempotent and record their calls
// into a tracking object the Playwright spec inspects.

const tracker = { enableCalls: 0, disableCalls: 0, tickCalls: 0 };

const module = {
  id: 'smoke-sample-mission-1.0',
  missionVersion: '1.0',
  title: 'Smoke Sample Module',
  description:
    'A no-op forest module used by the NASA harness smoke test. Verifies ' +
    'that register() validates the shape and that enable/disable are ' +
    'callable without a real forest instance.',
  couplings: [
    { subsystem: 'audio',    type: 'layer',     gain: -24 },
    { subsystem: 'kuramoto', type: 'beat-lock', strength: 0.1 },
  ],
  enable(forest, ctx) {
    tracker.enableCalls += 1;
  },
  tick(forest, ctx, dt) {
    tracker.tickCalls += 1;
  },
  disable(forest, ctx) {
    tracker.disableCalls += 1;
  },
};

// Expose tracker for the spec to assert against.
if (typeof window !== 'undefined') {
  window.__SAMPLE_FOREST_MODULE__ = module;
  window.__SAMPLE_FOREST_TRACKER__ = tracker;
}

export default module;
