# v1.49.932 — Lessons

No new manifest lesson. This ship is an instance of two already-codified disciplines:

- **#10461 (gate-enforce-every-runnable-surface + drift-guard pairing)** — the
  integration project was a runnable surface CI executed (`ci.yml:69`) but the
  local gate did not. Unenforced ⇒ silent escape, and the escape was silent
  precisely because the surface's whole job (catching integration regressions) ran
  only after the tag. Step 2.8 wires the surface into the gate so it runs every
  ship, byte-identical to the CI command.

- **#10436 (two-layer closure)** — source eliminator (correct the malformed
  fixture) + detector (gate the integration project). Either alone is incomplete:
  the fixture fix unbreaks one test; the gate prevents the *class* (any future red
  integration test escaping to CI).

## Reinforced (carried-forward, not yet promoted)

- **A red test is a blocker, full stop.** The v931 escape happened because a
  "2 failed" result was not acted on. The durable fix is structural (the gate now
  runs the surface), not a resolution to be vigilant — gate-not-vigilance.

- **Use the explicit bump target; assert it landed.** `npm run version` runs
  `bump-version --from-npm`, which reads package.json's *current* version as the
  target — a no-op (and non-zero exit) when nothing pre-bumped it, which is why
  v930/v931 shipped with stale version files. The correct command is `node
  scripts/bump-version.mjs <explicit-target>`, followed by asserting `bump-version
  --check` reports the target and `check-version-sequence` exits 0 before tagging.

- **Wait for the gate; read its exit code.** A backgrounded pre-tag-gate must run to
  completion and exit 0 before tagging. "No FAIL lines yet" on a still-running gate
  is not a pass.

- **WARN-only checks don't block — so don't rely on them to stop you.** The
  version-sequence check (step 1.5) only hard-fails under
  `SC_REQUIRE_SEQUENTIAL_VERSION=1`; otherwise its drift output is advisory. A
  silent warning is easy to miss in a long gate log.

## Carried-forward observation candidate

- **Local-gate / CI parity is a recurring drift class.** Three gate steps now exist
  solely to make the local gate match what CI runs (tools-suite 2.5, tools-node-test
  2.7, integration 2.8). A fourth CI-only surface appearing would be the trigger to
  factor a single "mirror every CI test command" gate generator rather than adding
  steps one at a time.
