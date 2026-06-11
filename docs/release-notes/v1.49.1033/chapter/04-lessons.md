# v1.49.1033 — Forward lessons

1. **Doubled anchor-inventory sections remain in 24 release-note files**
   (v604–v628 `99-context.md`, byte-identical duplicate sections from the
   enrichment injector's non-idempotent strip-and-append). Left in place
   deliberately — the duplication may be load-bearing for the completeness
   scorer's bullet-density dimension. Dedupe only with a before/after
   score check across the cohort.
2. **`open_scribe_dashboard` KEEP rationale is comment-pinned** in
   `build.rs` and the module header. The ~06-19 5.1c ACL re-audit must
   honor in-roster KEEP comments; if the re-audit tooling gains a
   structured allow-list, migrate the comment into it.
3. **Lean proof-fill next increments** (cheapest first, per
   `docs/proof-obligations.md`): P-RENDER-1/2 and P-PARSE-1 definitional
   stubs (~1–3 days) unblock everything else; 16 sorries remain. Re-add
   the pinned Mathlib directive only when a proof needs it.
4. **SCRIBE provenance schema now lives in the canonical PG.** Future
   sessions can run `PG_TEST=1` round-trip tests directly; undo is
   `DROP SCHEMA scribe CASCADE`. The dashboard-service live mode
   (`SCRIBE_DB_MODE=live`) now has a real backend to point at.
5. **Yosys evidence recipe:**
   `PATH="$PWD/.yosys-shim:$PWD/node_modules/.bin:$PATH" YOSYS_TEST=1
   npx vitest run src/scribe/netlist-renderer` (requires the untracked
   `.yosys-shim/` + `--no-save` installs of `netlistsvg` and
   `@yowasp/yosys`; documented in project memory).
6. **Remaining v621 deferral ledger:** CAP-046 (chip-as-document silicon,
   full deferral), CAP-024 native-wgpu rung, CAP-047 proof-fill, and the
   operator archive-or-delete decision on local branch
   `backup-pre-coauthor-strip-1778343383`.
