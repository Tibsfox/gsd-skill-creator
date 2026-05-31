# v1.49.922 — Retrospective

## What went well

- **The v921 retro's prediction held — and pointed straight at the fix.** v921 explicitly
  flagged `perf-assertion-audit.mjs` as the BSD-incompatible `git grep` site and called the
  cleanup "layered." That forward-note made this milestone a targeted close, not a hunt:
  the sweep confirmed exactly one live lazy-quantifier site, fixed it, and moved on.

- **The fix closed a latent Linux bug as a side effect.** De-lazying the pattern and fixing
  the `[\d…]`→`[[0-9]…]` mistranslation didn't just unblock BSD — it surfaced 15 genuine
  `relative-ratio` sites the GNU-mangled ERE had been silently missing (75 → 90 findings).
  Every new finding agrees with the JS-authoritative `detectShape`; zero false positives,
  zero removals. A portability fix that also improved correctness on the platform it already
  ran on.

- **Creating the ambiguity made the ci-gate fix verifiable.** Dispatching the macOS lane on
  `dev` for the #3 proof put two workflows at the same dev-tip — exactly the ci-gate's latent
  failure condition. That let the fix be proven against live data: old `.[0]` picked
  `CI (macOS)`, new `--workflow ci.yml` picks `CI`. The proof and the bug shared a setup.

- **The macOS lane is now green end-to-end.** The re-dispatch (run `26697886385`) didn't just
  re-pass the tmpdir tests — it progressed past the previously-failing tools-suite step all
  the way through the node:test step, which had never executed on macOS. No "layer 3"
  surfaced, confirming the broad GNU-vs-BSD sweep (grep -P, sed -i, readlink/date/stat flags)
  came back clean.

## What was tricky

- **Distinguishing JS-side regexes from POSIX-ERE-bound ones.** Most `+?`/`*?` patterns in
  the tools-suite run in V8 via `.match()`/`.replace()` and are fine on macOS. Only regexes
  whose `.source` is fed to `git grep`/`grep`/`sed`/`awk` break on BSD. The sweep had to
  separate the dangerous minority (one site) from the benign majority, rather than flagging
  every lazy quantifier in the repo.

- **The under-count was invisible because the tool isn't gated on a count.** The GNU-mangled
  ERE produced *fewer* findings, not an error — so on Linux it looked fine for the life of
  the tool. Only running the same pattern through a stricter (BSD) engine forced the latent
  defect into the open.

## Forward

- **Two lesson candidates noted, deferred to codify cadence:** (1) the reusable cross-platform
  test-discipline rule from v921 (realpath the `mkdtemp` root) — now joined by (2) "JS-regex
  `.source` bound to a POSIX-ERE consumer must be lazy-quantifier-free and shorthand-free;
  centralize the translation in one tested helper." Home: test-discipline / static-analysis.
- **macOS promotion path unchanged:** once the nightly is green-stable for N runs, fold
  `macos-latest` into the `ci.yml` matrix and retire the separate workflow. The
  `SC_CI_GATE_WORKFLOW` knob added here eases that transition.
- **Open follow-ons (unchanged):** Rust-in-CI; a real `coprocessor:` skill consumer.
