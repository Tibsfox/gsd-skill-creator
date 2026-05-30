# v1.49.918 — Retrospective

## What went well

- **Reading the code before building paid off three times.** Each slice began with recon that overturned the roadmap's stale framing: M13's `KernelHandle` was described as "ready for launch" but the launch path was already built; the "M9 benchmark slice" already existed in `arena_bench.rs`; the `CgroupEnforcer` was complete but unconsumed; the live migration proof already passed. Authoring against the roadmap blind would have re-built existing capability. The genuine work surfaced only after reading: runtime kernel compilation (M14), consuming the enforcer (M15), hardening the proof (M16).

- **The audit aged well.** T3.2's framing — "observation-bounded, not architecturally blocking" — was exactly right. The campaign was generalize/consume/verify, not greenfield.

- **Every slice landed green on the first compile.** M14's 8 cuda tests, M15's 4 cgroup tests, all passed first run; the NVRTC-vs-hand-PTX parity test confirmed runtime compilation is byte-identical to the baseline.

- **Opt-in-by-presence kept M15 safe.** The cgroup enforcer writes a real control file when it grows; wiring it as a default-off `Option<CgroupEnforcer>` (enforcement only when attached) means an unconfigured `ArenaSet` never touches a cgroup file, and the tests exercise the full grow/reject path against mock cgroup dirs — never the real process cgroup.

## What was tricky

- **The cuda feature is local-machine-only.** M14/M15 Rust tests are verified locally (CI runs no `cargo test` for src-tauri, and the cuda path needs the RTX 4060 Ti) — the established pattern for this subsystem since the artemis-ii era, but worth stating plainly so the verification surface is honest.

- **A gitignored 107 MB runtime artifact in a gated test.** M16's proof depends on `.grove/arena.json`, which isn't committed; the test's first block hard-asserted its existence with no skip-guard while its own second block and both siblings already guarded. The skip-guard brought the outlier into line, proven by temporarily moving the corpus aside (present → 17 pass, absent → 17 skip).

## Forward

- The arena's remaining non-goals are down to one (datatypes plugin pattern; Grove handles serialization). cgroup enforcement is delivered (M15).
- Noted follow-on (M16 baseline): the sibling corpus tests (`multi-hop-retrieval`, `memory-eval-suite`) use the weaker `return`-in-`beforeAll` guard; converting them to the same `describe.skipIf` idiom would close the class uniformly.
- Optional D3.5: expose `verify_against_host` as a Tauri IPC command so the app can trigger GPU integrity verification (kept out of M14 to avoid `lib.rs`/commands churn).
