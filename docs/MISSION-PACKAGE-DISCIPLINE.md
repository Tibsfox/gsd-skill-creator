# Mission-Package Discipline

**Created:** 2026-05-12
**Component:** C2 — Lesson #10199 closure-verification gate codification (v1.49.640 housekeeping cluster #7)
**Codifies:** Lesson #10199 from `docs/release-notes/v1.49.639/chapter/04-lessons.md` — multi-cluster carry-forward chains can encode framing errors
**See also:** `docs/SUBSTRATE-PROBE-DISCIPLINE.md` (sibling discipline at the substrate-probe level)

---

This doc collects mission-package-level disciplines — the rules that apply when authoring or executing a mission package consuming a carry-forward (CF) inventory from a predecessor milestone. It is a sibling to `SUBSTRATE-PROBE-DISCIPLINE.md`, which focuses on the substrate level (file shapes, exports, fixtures). Mission-package-level disciplines operate one layer higher: they apply at the moment a cluster's CF inventory is loaded into the next cluster's W0.

## 1. Closure-verification gate for multi-cluster CF chains

### 1.1 Pattern statement

When a carry-forward routes from cluster N to cluster N+1 to cluster N+2 to ... cluster N+k without closure, **the framing of the underlying problem may have an error that no single cluster's investigation catches**. The error compounds: each cluster inherits the predecessor's framing assumptions and routes forward with the same error embedded.

The mitigation is a mechanical W0 step: **before authoring component spec for any CF**, run a closure-verification probe specific to that CF. The probe asks: does the failing state described by this CF still exist?

If the probe reveals the CF is no longer real (upstream fix, environment change, previous closure missed in record-keeping), retire the CF at W0 *without manufacturing component work*. The gate inverts the historical workflow — "author spec, then verify during execution" becomes "verify, then author spec only for CFs that survive".

### 1.2 Source incident — v1.49.634 → .638 5-cluster framing error

The canonical example this discipline codifies:

v1.49.634 → v1.49.638 carried the "self-mod-guard CI install gap" carry-forward through 5 consecutive clusters. Each cluster's W0 inherited the framing **"the hook fails in CI"**; investigations focused on hook behavior, install pipeline, and runtime-environment substrate dimensions (env vars, $PATH, cwd, perms).

v1.49.639 C1 investigation produced a definitive null result: **zero TRACE output in CI despite full instrumentation** under `GITHUB_ACTIONS=true`. Investigation revealed the actual mechanism:

1. Tests at `tests/integration/v1-49-634-meta-test.test.ts:116/135` use `it.runIf(HOOK_AVAILABLE)` skip-guard pattern
2. In CI, the hook is gitignored at `.gitignore:9`; the install pipeline doesn't run in test workflows
3. `HOOK_AVAILABLE` is false in CI; tests gracefully skip
4. The "failing tests" had been *skip-guarded* since some prior commit; they were not actually failing in current CI runs

The framing error was structural: **"CI install gap"** framed the problem as installation / environment. The actual mechanism was **"test precondition gap with skip-guard resolution"** — a different category of issue with a different fix shape.

Conservative cost estimate: **10-20 hours of cumulative attention** across v1.49.634-638 spent on a problem that had already been closed via Lesson #10180's skip-guard pattern. The lesson is significant; the closure-verification gate proposed here exists to prevent recurrence.

Full source: `docs/release-notes/v1.49.639/chapter/04-lessons.md` §Lesson #10199.

### 1.3 Mechanical W0 step

Before authoring component spec for any CF routed from a predecessor cluster:

1. **Read** the CF's failure description from the predecessor's `chapter/05-carry-forward.md`.

2. **Identify** the SHAPE of the failing state:
   - **Test-marker shape** — specific failing test names + locations
   - **Tool-output shape** — specific tool invocation + expected failing output (e.g., `npm audit` flags advisories)
   - **Config-state shape** — specific config file + expected misconfiguration
   - **Upstream-spec shape** — specific upstream version + expected blocking dependency

3. **Run** the SHAPE-specific probe to verify the failing state still exists:
   - Test-marker: run the test locally; check CI logs for the test
   - Tool-output: run the tool with the same invocation
   - Config-state: read the config file + grep for the misconfiguration
   - Upstream-spec: check current upstream state (`npm view`, `cargo search`, vendor advisory feed)

   Concrete tool-output probe example (the canonical CF-7 application from v1.49.640):

   ```bash
   # Probe: are the catalogued advisories still surfaced?
   npm audit --audit-level=high --json > /tmp/cf-N-probe.json
   EXIT_CODE=$?
   echo "exit: $EXIT_CODE"
   # exit 0 = retired (advisories cleared upstream)
   # exit 1 + catalogued GHSAs in output = still real
   ```

   See `docs/test-discipline/cf-closure-verification-templates.md` for templates covering all four shape categories (test-marker, tool-output, config-state, upstream-spec) plus a hidden-transitive guard.

4. **Record** the probe output at `.planning/c0-cf{N}-closure-verification-record.md`. The record captures:
   - Probe command + exit code + output path
   - Status: `still-real` / `resolved-upstream` / `changed-shape` / `inconclusive`
   - Routing decision: `retire` / `proceed` / `escalate`
   - Routing rationale (1-paragraph)

5. **Route** based on outcome:
   - **Still real** → proceed with component-spec authoring as planned
   - **Resolved upstream** → retire CF at W0; no component-spec authored; verification record IS the deliverable
   - **Changed shape** → surface to operator; CF may need re-scoping rather than re-iteration
   - **Inconclusive** → treat as still-real; proceed but flag for ambiguity at G-gate

The probe should be runnable in **<10 minutes total per CF**, ideally **<2 minutes**. If a probe is expensive (e.g., requires a full CI run), that's a signal the CF's shape isn't well-defined; consider re-scoping at W0 rather than running the expensive probe.

### 1.4 Re-framing review for chains ≥4 clusters

At any mission-package W0 where a CF has been routed through **4 or more predecessor clusters** without closure, add an EXPLICIT W0 step:

> **"Could the framing be wrong?"**

Surface alternative framings:

- **precondition vs behavior** — is the failure about what's allowed to run, or about what actually happens?
- **install vs runtime** — is the failure in the setup pipeline, or in the running code?
- **environmental vs code-substrate** — is the failure caused by env vars / paths / perms, or by the code itself?
- **test substrate vs production substrate** — does the failure only surface in test scaffolding, or in real usage?
- **transitive vs direct dependency** — is the failure in a direct dep, or pulled in through someone else?
- **intermittent vs deterministic** — is the failure load-dependent, race-dependent, time-dependent — or always-fires?
- **shape category vs root mechanism** — has the framing locked onto a SHAPE that obscures the underlying ROOT?

One of the alternatives may be the actual mechanism. The 5-cluster CI-install-gap chain at v1.49.634-638 demonstrates the cost of not doing this review: 5 attempts at the wrong framing ate ~10-20h of attention before v1.49.639 surfaced the structural error.

If the re-framing review surfaces a new candidate framing, the CF should be **re-scoped** before authoring the next component spec. Re-scoping is not a 5th-defer escalation — it's an explicit acknowledgement that the prior framing was wrong.

### 1.5 Apply-to-self template

Every mission-package authoring session SHOULD apply the closure-verification gate at W0 even when CF count is small. Single-CF clusters benefit from the gate too: confirms the CF is still real before authoring an entire spec around it.

Template inclusion at the W0 component spec:

```markdown
## C0 W0 closure-verification probes

| CF | Probe | Pass-through outcome | Fail-through outcome |
|---|---|---|---|
| CF-N | <tool invocation> | <pattern indicating CF is closed> | <pattern indicating CF still real> |
| CF-N+1 | ... | ... | ... |
```

And in the W0 deliverable:

```markdown
# C0 — CF-N Closure-Verification Record

**Probed at:** <timestamp>
**Probed at commit:** <SHA>
**Probe command:** `<exact command>`
**Probe exit code:** <0 / 1 / etc.>
**Probe output:** `<artifact path>`

## CF status

**STATUS:** `still-real` | `resolved-upstream` | `changed-shape` | `inconclusive`

[1-paragraph interpretation]

## Routing decision

[rationale]
```

### 1.6 Bayesian discipline

When evidence keeps NOT supporting a hypothesis after multiple cycles, **the hypothesis itself may be wrong**. This is the underlying epistemic discipline.

Cluster N+k carry-forwards are evidence: the predecessor cluster's hypothesis didn't produce closure. The next cluster should consider **hypothesis-rejection** alongside hypothesis-refinement.

Practical heuristic: if the predecessor's W1 implementation produced a definitive *null result* (no signal where the hypothesis predicted signal), treat the null result as falsifying evidence rather than as "we didn't look hard enough" evidence. The v1.49.639 C1 trace instrumentation produced zero TRACE markers in CI; this null result was *the* diagnostic signal — not a failure of instrumentation.

### 1.7 Tooling support (codified at v1.49.641 C2)

`scripts/closure-verify-cf.mjs` codifies this discipline as an executable probe runner. Implemented at v1.49.641 C2 (closes CF-12).

Five probe types map to the four CF SHAPE categories from `docs/test-discipline/cf-closure-verification-templates.md` plus a built-in hidden-transitive guard:

| Probe | Use case | Maps to |
|---|---|---|
| `npm-audit <CF-id>` | Tool-output shape — supply-chain advisories | Template 1 |
| `file-snapshot <CF-id> <path>` | Config-state shape — file presence + first 20 lines | Template 3 |
| `upstream-version <CF-id> <package>` | Upstream-spec shape — version availability + deprecation | Template 4 |
| `test-marker <CF-id> <test-file>` | Test-marker shape — local vitest pass/fail | Template 2 |
| `hidden-transitive-guard <package>` | Pre-flight for path-d-style root-dep removal | Lesson #10204 |

Each probe writes a record to `.planning/c0-<CF-id>-closure-verification-record.md` (gitignored) with the standard frontmatter-like header + status + routing-decision sections.

Usage:

```bash
# Verify a CF is still real:
node scripts/closure-verify-cf.mjs npm-audit CF-7

# Pre-flight check before removing a phantom dep:
node scripts/closure-verify-cf.mjs hidden-transitive-guard <pkg-to-remove>
```

Forward improvement (out of scope; carry forward if useful): a probe-spec format (e.g., YAML at `.planning/cf-probes/<CF-id>.yaml`) so each CF carries its own probe spec rather than relying on the operator to know which probe type matches each CF.

---

## 2. Cross-references

- **Lesson source:** `docs/release-notes/v1.49.639/chapter/04-lessons.md` §Lesson #10199
- **Source incident artifacts:**
  - `docs/release-notes/v1.49.639/chapter/04-lessons.md` §Lesson #10197 update (disconfirmation)
  - `docs/release-notes/v1.49.634/` through `docs/release-notes/v1.49.638/` (the 5-cluster chain that demonstrated the cost)
  - `.gitignore:9` (the file-presence dimension that turned out to be load-bearing)
  - `tests/integration/v1-49-634-meta-test.test.ts:116/135` (the skip-guarded tests)
- **v1.49.640 W0 first application:**
  - `.planning/c0-cf7-closure-verification-record.md` (CF-7 npm audit — STATUS: still-real → C1 proceeded)
  - `.planning/c0-cf9-cartridge-status-record.md` (CF-9 cartridge — STATUS: unchanged → carry forward to Cluster #8)
- **Sibling discipline doc:** `docs/SUBSTRATE-PROBE-DISCIPLINE.md` (one layer down: substrate-shape verification)
- **Related Meta-Lesson:** #10180 (skip-guard pattern) — was the actual mechanism that closed the v1.49.634 abstract carry-forward; the framing error in #10199 was failing to recognize #10180 had already done its job
- **Companion template (optional):** `docs/test-discipline/cf-closure-verification-templates.md` — copy-paste probe templates for common CF shapes

---

*This doc itself was authored under the closure-verification discipline it codifies: v1.49.640 W0 ran probes against CF-7 + CF-9 BEFORE authoring C2 (this doc); the probes drove routing decisions; the `c0-cf*-record.md` files are cited as the canonical apply-to-self examples.*
