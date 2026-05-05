# v1.49.607 — Retrospective

## Carryover lessons applied

**From v1.49.606 (Apollo 17 / ship-discipline):**

- **#10231 ESTABLISHED (obs #7)** — Nominal-iconic direction applied: the atlas milestone adopted
  a nominal mission-package structure (W0 types → W0.5 primitives → W1 substrate → W2 views →
  W3 coordinator → W4 audit/release) rather than an exploratory free-form build.
- **#10244 ESTABLISHED (obs #5)** — Counter-cadence boundary discipline respected: W4a does not
  advance any engine track; all NASA/MUS/ELC/SPS/TRS state is explicitly HELD in all five
  release-note files.

**From v1.49.585 (concerns-cleanup / gates-as-enforcement):**

- The ADR 0003 audit tool follows the same "convert prose rule to deterministic gate" pattern
  established in v585 for self-mod-guard, git-add-blocker, and the citation-invariants test.
  ADR 0003 now has a mechanical enforcement path, not just prose.

**From v1.49.589 (version-consistency invariant):**

- W4a respects the four-manifest version-consistency rule: all manifests were bumped to 1.49.607
  atomically via `scripts/bump-version.mjs` before the wave began.

## New lessons emitted

**#10248 CANDIDATE — clean-room rebuild cost multiplier:**
The atlas clean-room primitive set (5 algorithm families, ~12,500 new lines across W0.5–W1) took
roughly 2.5× the estimate based on comparable prior builds.  The multiplier is explained by:
(a) each algorithm required a test suite proving correctness before the next algorithm could
depend on it; (b) the state-machine syntax lexers required per-language grammar state tables that
are inherently verbose; (c) the Sankey rename-chaining (transitive alias resolution) was not
in the original spec but emerged as necessary during W2 archeology view construction.
Forward guidance: add 2× buffer to any "clean-room reimplement" estimate.

**#10249 CANDIDATE — ADR-as-supply-chain-policy as template:**
ADR 0003 (clean-room dep policy) combined with `atlas-deps-audit.mjs` is a repeatable template:
write the policy as an ADR, write a mechanical audit tool that enforces it, register the tool
in vitest.tools.config.mjs so it runs in CI.  The pattern is applicable to any future
architectural constraint that needs enforcement beyond prose review.

**#10250 CANDIDATE — W3 source-guard / coordinator pattern:**
The coordinator (single-writer for cross-view focus state; all four panes subscribe, none
write directly to another) eliminated the event-loop cycle problem seen in ad-hoc multi-pane
dashboards.  Pattern: one coordinator per shared-state surface; all consumers subscribe to it
via a typed FocusSubscriber interface; no direct pane-to-pane calls.
