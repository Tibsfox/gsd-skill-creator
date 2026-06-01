# v1.49.941 — Lessons

No new manifest lesson (manifest stays **150**). One existing lesson applied; one carried-forward observation candidate recorded.

- **#10208 (npm-audit probe + severity threshold) — applied.** The `closure-verify-cf.mjs npm-audit` probe, running `npm audit --audit-level=high`, fired on a freshly-published critical advisory and blocked the pre-tag-gate. That is the probe's designed behavior: convert "remember to check advisories" into a deterministic gate. The `--audit-level=high` threshold (the v1.49.644 C3 severity parameter) correctly let the moderate qs advisory pass while blocking on the critical vitest one. The probe's time-dependence (it queries the live advisory DB) is the source of its value, not a defect.

## Carried-forward observation candidate

- **After `npm audit fix`, verify the manifest floor AND the peer graph — the lockfile fix is necessary but not sufficient.** `npm audit fix` re-resolves `package-lock.json` to a patched version but, when the fix is within the existing `package.json` range, it leaves the manifest range unchanged — so `^4.0.18` still *admits* the vulnerable `4.0.18` (a future `npm install` re-resolution could, in principle, reintroduce it), and it may bump one family member (`vitest`) without its sibling (`@vitest/coverage-v8`), producing an `invalid peer`. Closing both: raise the affected `package.json` ranges past the vulnerable floor (`^4.0.18` → `^4.1.8`) and bump the lagging peer to the same line, then confirm with `npm ls <pkg>` (no `invalid`) and `npm audit --audit-level=high` (exit 0). First instance: this ship (vitest family + the critical vitest-UI advisory). Promote to a manifest lesson on a second instance. Lives near the dependency-audit discipline; sibling of #10208 (npm-audit probe).
