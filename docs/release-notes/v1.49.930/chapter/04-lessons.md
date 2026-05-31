# v1.49.930 — Lessons

No new manifest lesson. This ship is an instance of two already-codified disciplines:

- **#10436 (two-layer closure for procedure-rooted / silent drift)** — the
  `.college/`→`src/` cross-rootdir import is a new member of the class this discipline
  governs: a drift that one layer alone cannot close. The source-eliminator (CF1a, delete
  the dead file) + detector gate (CF1b, `tools/college-src-boundary-audit.mjs` + its live
  Case-6 drift-guard in the gate+CI tools suite) ship together. Prior instances:
  STATE.md v805→v806 (detector v807 + source v813) and publish.mjs file-overwrite
  preservation (v836). This is the first *cross-rootdir-import* instance.

- **#10435 (cross-rootdir wire pattern)** — the carried-forward "latent `.college/`→
  `src/` cross-import" observation in `docs/cross-rootdir-wire-discipline.md` is marked
  CLOSED v1.49.930, completing the boundary contract begun by the v929 "composition-root
  closure is architecturally N/A" corollary. Together they state: `src/`→`.college/` is
  tsc-enforced; `.college/`→`src/` is gate-enforced (this ship); and neither rootdir
  hosts a sound composition root.

## Reinforced (carried-forward, not yet promoted)

- **Gate-not-vigilance (from the counter-cadence discipline).** When a recon surfaces a
  rule that operators must "remember not to violate," convert it to a deterministic gate
  rather than restating the prose rule. The discipline doc had already named this gate as
  the right response; v930 built it. Asymptotic target: the live audit stays at 0
  violations forever, because the gate fails the build before a violation can land.

- **Model a new audit tool on the nearest proven sibling.** `college-src-boundary-audit`
  is the third tool in the `*-deps-audit` / `*-boundary-audit` family (after atlas-deps
  and tauri-boundary). Reusing the comment-stripper and the non-hermetic-live-Case-6
  drift-guard shape kept it consistent and inherited prior flake fixes. A fourth boundary
  audit would be the trigger to consider extracting the shared scaffold.

## Carried-forward observation candidate

- **Per-boundary import-audit family.** Three structurally-identical import-boundary
  audits now exist (atlas cross-tree, tauri boundary, college→src). If a fourth lands,
  the shared walk/strip/extract/live-Case-6 scaffold should be factored into a single
  parameterized helper (cross-ref the architecture-retrofit "extract at the SECOND
  instance" rule — here the family is already at three, so extraction is overdue if a
  fourth appears).
