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

## D/E wave retrospective

**D1–D5 closed known deferred items:**
D1 (extractor surgeries: TS imports, Rust impl blocks, C++ classes), D2 (listSymbolsInSnapshot
IPC + symbol-graph wire + linker idempotency), D3 (a11y: announcer + splitter keyboard + ARIA
roles), D4 (perf bench harness for 9 languages × 10K LOC), D5 (sticky-regex engine fixing
the O(n²) source.slice pattern D4 surfaced).  All were flagged deferrals in their originating
commit messages; the D-wave pass cleared them systematically.

**E1–E4 closed newly-surfaced items:**
E2 (C++ operator overloads + nested-class methods — both D1-deferred sub-items),
E3 (TS re-exports + Rust nested-fn — both D1-deferred sub-items),
E4 (real Rust SQLite delegate — **critical**, surfaced during work review; see below).

**#10254 CANDIDATE — post-W4 work-review pass before tag is required, not optional:**
The W4a meta-test net verified build, vitest, completeness, and CI green.  It did NOT include
a live desktop UI smoke-test.  That gap allowed the `StubAtlasKbDelegate` to survive to
near-tag: it compiled cleanly, all unit tests passed (the stub tests verify that stubs *return*
a deferred error, not that the production path works), and the IPC surface appeared complete.
Only the work-review pass through the Rust source caught that `AtlasState::default()` still
wired the stub.  Fix (E4): `SqliteAtlasKbDelegate` implemented and wired; `AtlasState::default()`
changed from `new_with_stub()` to `new_with_sqlite()`.  The lesson: post-W4 work-review pass
before tag is a required gate, not an optional nice-to-have.

**D5 commit message precision note:**
The D4 bench headline listed GLSL at 5,400 LOC/sec and flagged it as the engine's O(n²) floor.
D5 fixed the engine (sticky regex), but GLSL's bench number barely moved (5.4K → 5.6K).
D5's commit message correctly identified the residual bottleneck: the coarse-AST extractor
pipeline's speculative `skipBalanced` calls at high token-density, not the lexer.  The D4
framing ("root cause is engine-wide") was overstated; D5 corrected it.  Lesson: when a perf
claim looks suspiciously bad, re-measure after the fix at the actual target scale before
attributing root cause.
## Process observation and Drift

- **Wave dispatch cadence:** W0 main-context + W1 research subagent + W2 build subagents (NASA serial-first then MUS+ELC+SPS parallel) — pattern held at v1.49.607
- **Recovery hierarchy:** Tier-2 inline-Edit recovery applied if depth-audit FAIL — engine-cadence resilience pattern
- **Cross-track read-discipline:** all sibling W1 drafts read before W2 build authoring — zero fabrication maintained at v1.49.607
- **Pre-tag-gate composite:** 8/8 PASS gate held at v1.49.607 (build + vitest + completeness + CI-on-dev + www-bundles + depth-audit + CLAUDE.md + catalog-index)
- **Drift detection:** post-ship RH refresh emitted advisory drift signal at v1.49.607 (active soak per FA-621 disposition)

