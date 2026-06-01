# v1.49.934 — Retrospective

## What went right

- **Recon-first beat the v931 wrong-shape trap.** The single biggest risk in writing
  integration tests for unfamiliar substrates is the fixture shape (v931 shipped red on
  a malformed `BranchManifest`). Here a parallel recon read each module's *actual*
  exported signatures and existing unit tests, then ran throwaway `tsx` probes against
  the real modules to confirm every fixture shape and every discriminating assertion
  value *before* a line of test was written. All three tests passed on first run — no
  shape-guessing, no red.

- **The mutation proof made "it passes" mean something.** A verify-axis test that
  passes regardless of the substrate's behaviour is worthless. Mutating the eligibility
  decay kernel (`τ → 2τ`) and watching exactly the three decay-dependent assertions go
  red — while the two structural ones stayed green — is the evidence the tests have
  teeth. The revert via `git checkout` (not a hand-undo) kept the working tree exactly
  at HEAD.

- **Real data paths, not mocks.** Each test drives the genuine boundary: a real
  `TemperatureApi` instance, the real `softmax`/`injectLangevinNoise` consumers, the
  real `applyLangevinUpdate` pipeline through MB-2 projection, and a real on-disk
  reinforcement JSONL written by the real emitter+writer. This is what makes them
  consume-axis closures rather than re-statements of the unit tests.

- **Batched cohesively.** Three cohesive, test-only, low-risk proofs shipped as one
  milestone rather than three — one CI run, one release-notes set, no risk-isolation lost
  (independent files in one commit). The right granularity for a homogeneous batch.

## What to watch

- **These substrates are still dormant.** The tests prove the boundary composes; they do
  not wire the substrates into production. The consumers (softmax, langevin bridge, MA-2)
  carry their own resolvers and are not fed by these schedules in a live path. A future
  consume ship that actually wires MD-4 → MA-3/MD-3, or MA-1 → MA-2, is separate work;
  these tests will then become the regression guard for that wiring.

- **One small cross-substrate overlap.** Both the temperature and langevin tests exercise
  the temperature→langevin composition, at different levels (the raw `injectLangevinNoise`
  primitive vs the full `applyLangevinUpdate` bridge). That is complementary coverage, not
  duplication — each substrate owns its boundary proof.

- **macOS is load-bearing (from v928).** The eligibility test writes to a real tmpdir;
  it asserts only on numeric activations (no path comparisons), so the v920/v921 macOS
  realpath lesson does not bite — but confirm CI green on the pushed v934 commits,
  including the macOS leg, before considering the ship complete.

## Process note

The harness intermittently garbled multi-line output this session; load-bearing facts
were confirmed with single-value probes and exit codes that survive the corruption.
