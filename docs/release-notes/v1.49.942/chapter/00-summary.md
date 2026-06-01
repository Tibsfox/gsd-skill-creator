# v1.49.942 — Summary

## The ship

A counter-cadence test-hardening sweep (#21). Two boundary tests are added to `tools/ci/__tests__/macos-flip-readiness.test.mjs` to pin the GREEN/BREAKING Set boundaries of the macOS matrix-leg flip-readiness gate. The diff is **27 insertions, test-only** — the gate source is unchanged.

## The gap

`tools/ci/macos-flip-readiness.mjs` classifies a leg conclusion through `GREEN = {'success'}` (only `success` advances the streak) and `BREAKING = {'failure','timed_out','cancelled','action_required'}` (the leg ran and was not green, so it resets the streak); everything else is transparent. This encodes a **defer-bias** — a misclassification may only defer the flip, never advance it. The code pinned those Sets correctly, but the test suite only exercised `success`, `failure`, and `skipped`. The non-failure BREAKING members and the non-success GREEN boundary were unpinned: shrinking `BREAKING` to `['failure']` or expanding `GREEN` to `['success','neutral']` would have passed the entire existing suite while silently breaking the defer-bias.

## The fix

Two tests in the `computeReadiness` block, mirroring the v1.49.938 cargo-sibling hardening:

- **timed_out / cancelled / action_required (organic) ALSO break** the streak — pins `BREAKING`.
- **neutral (organic) is transparent** — neither counts nor breaks — pins `GREEN`.

Both are **mutation-proven**: reverting the gate's `BREAKING` reds the first test and only it; expanding `GREEN` reds the second and only it. The gate was restored from git after each mutation, so the committed working tree is test-only.

## Why this, why now

The v1.49.938 adversarial review found this exact defer-bias hole in the **cargo** flip-readiness gate and closed it there; the v938/v939 handoffs named "the same gap may exist in `macos-flip-readiness.test.mjs`" as a carried-forward item. The cargo lane's flip track is complete (v938 gate → v939 load-bearing flip); this counter-cadence ship closes the matching macOS-sibling test debt, leaving the two gates boundary-test-symmetric.

## Engine state

NASA 1.178 (unchanged), counter-cadence **#21** (prior #20 = v1.49.925, which built the gate this ship hardens), manifest 150 (second observation of the defer-bias Set-boundary pattern; promotion candidate).
