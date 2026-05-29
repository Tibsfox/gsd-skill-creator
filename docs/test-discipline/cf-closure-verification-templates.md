# CF Closure-Verification Probe Templates

**Created:** 2026-05-12
**Component:** C2 Stage 3 — companion artifact for `docs/MISSION-PACKAGE-DISCIPLINE.md` §1
**Audience:** mission-package authors at W0; team-lead during W0 dispatch

Copy-paste probe snippets keyed to the four common CF shapes from `MISSION-PACKAGE-DISCIPLINE.md` §1.3.

---

## Template 1: Tool-output shape (e.g., CF-7 npm audit)

The CF is shaped as "tool X reports problem Y". The probe re-runs tool X and looks for problem Y in the output.

```bash
# Probe: are the catalogued advisories still surfaced?
npm audit --audit-level=high --json > /tmp/cf-N-probe.json 2>/tmp/cf-N-probe.stderr
EXIT_CODE=$?
echo "exit: $EXIT_CODE"

# Pattern: exit 0 = retired (no high+critical surfaced)
# Pattern: exit 1 + matches catalogued advisory IDs = still real
python3 -c "
import json
d = json.load(open('/tmp/cf-N-probe.json'))
print('high:', d['metadata']['vulnerabilities']['high'])
print('critical:', d['metadata']['vulnerabilities']['critical'])
for k, v in d.get('vulnerabilities', {}).items():
    print(f'{k} | sev={v[\"severity\"]} | range={v.get(\"range\",\"?\")}')
"
```

**Variants:**
- `cargo audit` — same shape with Rust deps
- `pip audit` — Python deps
- `gh api /repos/<owner>/<repo>/vulnerability-alerts` — GitHub's view of advisories
- `safety check --json` — Python with explicit JSON output

**v1.49.640 example:** `.planning/c0-cf7-closure-verification-record.md` + `.planning/c0-cf7-probe.json` are the canonical artifacts of this template's application.

---

## Template 2: Test-marker shape (e.g., the superseded CF-1)

The CF is shaped as "test T fails at file:line F". The probe re-runs the test in both local + CI and checks current pass/fail state.

```bash
# Probe: does the failing test still fail locally + in CI?
LOCAL_OUT=$(npx vitest run tests/integration/v1-49-N-meta-test.test.ts 2>&1)
LOCAL_EXIT=$?
echo "local exit: $LOCAL_EXIT"
echo "$LOCAL_OUT" | tail -5

CI_LATEST=$(gh run list --repo Tibsfox/gsd-skill-creator --branch dev --workflow=ci.yml --limit 1 --json conclusion,databaseId,headSha 2>/dev/null)
echo "ci latest: $CI_LATEST"

# Pattern: local PASS + CI PASS = retired (likely skip-guarded since the report)
# Pattern: local PASS + CI FAIL = still real but local-CI divergence (further investigation)
# Pattern: local FAIL = still real (with reproducible local repro)
```

**Hidden trap:** before concluding "still real", check whether the test uses `it.runIf(...)` or similar skip-guards. A "passing" test may be silently skipped. Always inspect the test file source — confirm it actually runs.

**v1.49.639 example:** Lesson #10199's source incident — the v1.49.634 abstract carry-forward chain was actually closed because `it.runIf(HOOK_AVAILABLE)` skipped the test in CI; 5 clusters of probes missed this because they framed it as "hook failing in CI" rather than "test gracefully skipped in CI".

---

## Template 3: Config-state shape

The CF is shaped as "config file F has misconfiguration M". The probe reads F and greps for M.

```bash
# Probe: is the misconfiguration still present?
CONFIG_FILE='<path>'

if [ ! -f "$CONFIG_FILE" ]; then
    echo "STATUS: config file missing — CF may be moot"
    exit 0
fi

# Look for specific misconfiguration pattern
if grep -qE '<misconfiguration-regex>' "$CONFIG_FILE"; then
    echo "STATUS: still-real (misconfiguration found)"
    grep -nE '<misconfiguration-regex>' "$CONFIG_FILE"
else
    echo "STATUS: resolved (misconfiguration absent)"
fi

# Variant: check VALUE not just presence
DESIRED_VALUE='<expected>'
ACTUAL_VALUE=$(yq '.<key>' "$CONFIG_FILE" 2>/dev/null || grep '<key>' "$CONFIG_FILE")
if [ "$ACTUAL_VALUE" = "$DESIRED_VALUE" ]; then
    echo "STATUS: resolved (value matches expected)"
else
    echo "STATUS: still-real (actual=$ACTUAL_VALUE; expected=$DESIRED_VALUE)"
fi
```

**v1.49.640 example:** CF-9 (Phase-2 cartridge shape families) — the probe was `wc -l .planning/cartridge-migration-phase2.md` + content snapshot diff vs predecessor. Outcome: `unchanged` → carry forward.

---

## Template 4: Upstream-spec shape

The CF is shaped as "upstream package P at version range V has issue I". The probe checks current upstream state and whether a fix is now available.

```bash
# Probe: has upstream updated?
PKG_NAME='<name>'
CURRENT_RANGE='<range>'  # e.g., '>=2.10.11' or '0.79.0 - 0.91.0'

# Latest 5 versions:
npm view "$PKG_NAME" versions --json 2>/dev/null | jq '.[-5:]'

# Latest deprecation info:
npm view "$PKG_NAME" deprecated --json 2>/dev/null

# GitHub advisory check:
gh api "/repos/<owner>/<repo>/security-advisories" --paginate 2>/dev/null \
  | jq ".[] | select(.cve_id == '<CVE>')" \
  | head -50

# Pattern: new version available outside vulnerable range = retire
# Pattern: deprecation message mentions resolution = retire
# Pattern: advisory withdrawn = retire
# Pattern: none of the above = still real
```

**Cargo equivalent:**

```bash
cargo search "$PKG_NAME" --limit 5
cargo info "$PKG_NAME"  # if cargo-info installed
```

**Pip equivalent:**

```bash
pip index versions "$PKG_NAME" --pre  # show all available
pip show "$PKG_NAME"
```

---

## Hidden-transitive guard (NEW from v1.49.640 C1 experience)

When a CF closure path involves removing a root-of-tree dependency (path-d-style), add this pre-flight check:

```bash
# Probe: what hidden transitives might break if I remove <DEP>?

# 1. List packages currently installed only because of <DEP>:
DEP='<dep-to-remove>'
npm ls --depth=Infinity 2>&1 | grep -B1 "$DEP" | head -50

# 2. Grep src/ for any imports that satisfy via the transitive tree:
#    Look for imports of any subtree package the user might not declare
SUBTREE=$(npm ls "$DEP" --depth=Infinity --json 2>/dev/null | jq -r '.. | objects | .name?' | sort -u)
for pkg in $SUBTREE; do
    # If a src/ file imports pkg directly, it's a hidden transitive that needs declaring
    if grep -rl "from ['\"]$pkg['\"]" src/ 2>/dev/null | head -1; then
        echo "HIDDEN TRANSITIVE in src/: $pkg (currently satisfied via $DEP)"
    fi
done
```

**v1.49.640 C1 example:** removing gsd-pi broke 14 → 10 test files because `fast-xml-parser` + `yaml` were hidden transitives used directly in src/. The hidden-transitive guard would have caught both at W1A pre-flight rather than at vitest verify time.

**Forward improvement:** consider adding this guard to `scripts/closure-verify-cf.mjs` (per `MISSION-PACKAGE-DISCIPLINE.md` §1.7 tooling support).

---

## Template 5: Audit-record-count assertion for chokepoint-gated reads (Lesson #10456)

When a chokepoint-gated method has derived methods that transitively call it, the integration test MUST assert exactly N audit records under N invocations. This is the load-bearing regression detector against silent fidelity reductions — a future caching refactor (e.g., memoizing `readAll`) would silently reduce audit emissions, breaking observability without breaking unit tests.

### When this applies

- A class has a single gated fs-op method (e.g., `readAll`, `load`).
- Multiple public methods on the same class call the gated method transitively (e.g., `getRunEntries` → `readAll`, `addExclude` → `load + save`).
- Test must prove the gate fires per derived-method call, not per overall test execution.

### Test pattern

```ts
it('derived methods (X / Y / Z) emit one audit record per call via transitive M', async () => {
  const sink = new CapturingAuditSink();
  const ctx = defaultLoaderContext(sink);
  const store = new MyStore(path, ctx);
  // Each derived method calls M() exactly once → N audit records total.
  await store.X();
  await store.Y();
  await store.Z();
  expect(sink.records).toHaveLength(3);
  expect(sink.records.every(r => r.op === 'read-file')).toBe(true);
  expect(sink.records.every(r => r.target === path)).toBe(true);
});
```

### Variants

- **Two-site outer-loop** (v892 `dacp/bus/scanner.ts`): assert 9 records (1 outer + 8 inner-loop transitive calls).
- **Derived-method ripple** (v896 `workflow-run-store.ts`): assert 3 records under 3 derived-method invocations (`getRunEntries`/`getLatestRun`/`getCompletedSteps`).
- **Mixed read/write derived methods** (v897 `scan-state-store.ts`): assert 2 records under 2 derived methods (`addExclude`/`removeExclude`) that each call `load + save`; the explicit `save()` between them MUST emit 0 (cross-ref #10457 read-side-only design).

### Evidence (3 instances)

| Ship | File | Assertion | Cross-ref |
|---|---|---|---|
| v1.49.892 | `dacp/bus/scanner.ts` | 9 records under outer invocation (1 outer + 8 inner-loop) | #10448 two-site hoisted-check |
| v1.49.896 | `skill-workflows/workflow-run-store.ts` | 3 records under 3 derived-method calls | #10455 class-stored hoist-at-top + derived-method ripple |
| v1.49.897 | `discovery/scan-state-store.ts` | 2 records under 2 derived methods (each calls load+save); save between them emits 0 | #10455 + #10457 read-side-only |

### Anti-patterns

- ❌ **Test asserts count = "at least 1" instead of exact N.** Silent fidelity reductions pass under the loose assertion. The whole point of the count test is the exact-N invariant.
- ❌ **Test skips the write-emits-zero assertion when the class has write methods.** Without it, accidental future gating of writes (per #10457 anti-pattern) goes unnoticed.
- ❌ **Assertion conflates emitted-count with invocation-count when invocations are async-fire-and-forget.** The substrate→calibration end-to-end test pattern (#10453) emits async-fire-and-forget records whose order is undefined; count-based + net-polarity-based assertions are correct, sequence-based assertions are NOT (cross-ref the v898 retrospective).

### Cross-references

- **#10455** — Class-stored hoist-at-top sub-variant of #10448; the typical wire shape that produces derived-method ripple.
- **#10457** — Read-side-only chokepoint at write-bearing classes; the test pattern explicitly asserts write emits 0.
- **#10453** — Substrate→calibration end-to-end test pattern; sibling test discipline for the calibration-loop axis.

---

## Template 6: Fake-fixture wire test (Lesson #10458)

When a wire test exercises a chokepoint check (ProcessContext / EgressContext / LoaderContext spawn / exec / read gate) but doesn't need real data, use a minimal fake-bytes fixture with the correct extension and magic-byte signature. The chokepoint gate fires synchronously before the side-effecting operation — the fact that the operation would fail on the fake data never matters because the security throw happens first.

### When this applies

- The test exercises a chokepoint wire (ProcessContext / EgressContext / LoaderContext).
- The gated code path requires a file argument with a specific extension or magic-byte signature (to bypass early-return checks or to dispatch to the right branch).
- Constructing a "real" fixture (valid PNG / valid ZIP / valid PDF / valid archive) is wasteful when the chokepoint gate fires before any decoding.

### Test pattern

```ts
beforeAll(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'wire-test-'));
  fakePath = join(tmpRoot, 'fake.png');
  // Minimal magic-byte signature — 4 bytes is enough for type detection.
  // The wire check fires synchronously before any actual decoding.
  writeFileSync(fakePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
});

it('throws *ContextDenied when ctx denies the spawn', async () => {
  const ctx: ProcessContext = {
    allowList: [], // deny all
    audit: NULL_PROCESS_AUDIT_SINK,
  };
  await expect(processFile(fakePath, ctx)).rejects.toBeInstanceOf(ProcessContextDenied);
});

it('records audit event when ctx is threaded and target is allowed', async () => {
  const events: AuditRecord[] = [];
  const ctx: ProcessContext = {
    allowList: ['python3'],
    audit: { record: (e) => events.push(e) },
  };
  // May throw at spawn (fake PNG can't be decoded) but the wire records
  // the audit event BEFORE the spawn fires.
  await processFile(fakePath, ctx).catch(() => {
    // Spawn-time error from python3 (PIL can't decode fake PNG) is expected.
    // The wire test only cares that the audit event was recorded.
  });
  expect(events.length).toBeGreaterThan(0);
});
```

### Magic-byte signature catalog

| Extension | First 4 bytes | Use case |
|---|---|---|
| `.png` | `0x89 0x50 0x4e 0x47` | Image processing wires (pic2html, etc.) |
| `.zip` | `0x50 0x4b 0x03 0x04` | Archive extraction wires (acquirer `.zip` path) |
| `.docx` | `0x50 0x4b 0x03 0x04` | ZIP-based document wires (acquirer `.docx` path; same as `.zip`) |
| `.pdf` | `0x25 0x50 0x44 0x46` (`%PDF`) | PDF processing wires |
| `.gz` | `0x1f 0x8b 0x08 0x00` | Gzip-archive wires |

Add new entries when a chip surfaces a new extension.

### Evidence (3 instances)

| Ship | File | Fake fixture | Wire under test |
|---|---|---|---|
| v1.49.872 | `cli/commands/pic2html.test.ts` | `fake.png` (4 bytes PNG magic) | ProcessContext spawn of `sh`/`python3` via PIL |
| v1.49.874 | `learn/acquirer.test.ts` | `fake.zip` (4 bytes ZIP magic) | ProcessContext exec of `unzip` for archive extraction |
| v1.49.874 | `learn/acquirer.test.ts` | `fake.docx` (4 bytes ZIP magic — docx is ZIP-format) | ProcessContext exec of `unzip` via docx-extraction path |

### Anti-patterns

- ❌ **Constructing a real valid file (e.g., generating a real PNG with `sharp`) for chokepoint wire tests.** Wastes ~10-100x the LOC and adds dependency surface. The chokepoint gate fires before any decoding; the fixture's validity beyond magic-byte signature is irrelevant.
- ❌ **Asserting on processing-result success in a permissive-mode wire test.** The fake fixture WILL fail processing (python3 / unzip cannot handle 4-byte invalid bytes). Tests must assert on the audit-record emission, not the processing outcome. Wrap the call in `.catch(() => {})` and comment that spawn-time errors are expected.
- ❌ **Skipping the magic-byte signature when the gated code path uses file-type detection.** A zero-byte file or wrong-extension file will trigger a different code branch (early-return on bad type), bypassing the chokepoint entirely. The 4-byte signature is the minimum to route through the right branch.
- ❌ **Real-file fixtures committed to the repo.** Even when the test "works," real fixtures bloat the repo and create maintenance debt. Generate fake fixtures in `beforeAll` and clean up in `afterAll`.

### Cross-references

- **#10456** — Audit-record-count assertion (Template 5); often paired with the fake-fixture pattern when the wire test asserts multiple audit emissions.
- **#10442** — Hoist gates ABOVE swallow-catches; the chokepoint must fire before the try/catch that would absorb the fake-file processing failure.
- **#10448** — Shared-helper hoist sub-variant catalog; wire shape determines where in the entry function the chokepoint sits, which determines whether a fake fixture suffices.
- **#10427** — Failure-mode contracts; the fake-fixture pattern depends on the chokepoint being load-bearing (failures propagate) rather than accessory (failures swallowed).

---

## How to use this catalogue

1. At W0, identify which template matches the CF's shape (read CF source description).
2. Copy the template into the W0 design-doc draft.
3. Customize the variables (probe command, advisory IDs, file paths).
4. Run the probe; capture output at `.planning/c0-cf{N}-closure-verification-record.md`.
5. Route per outcome.

**Tooling shortcut (v1.49.641 C2):** for the four standard shapes plus the hidden-transitive guard, use `scripts/closure-verify-cf.mjs` instead of copy-pasting:

```bash
node scripts/closure-verify-cf.mjs npm-audit CF-N            # Template 1
node scripts/closure-verify-cf.mjs test-marker CF-N <file>   # Template 2
node scripts/closure-verify-cf.mjs file-snapshot CF-N <path> # Template 3
node scripts/closure-verify-cf.mjs upstream-version CF-N <pkg> # Template 4
node scripts/closure-verify-cf.mjs hidden-transitive-guard <pkg> # Hidden-transitive guard
```

The tool writes the record file automatically and prints a status summary.

**Per-CF probe spec auto-dispatch (v1.49.642 C1):** for CFs with stable probe definitions, declare a YAML spec at `.planning/cf-probes/<CF-id>.yaml` and run the auto dispatcher:

```bash
node scripts/closure-verify-cf.mjs auto CF-13
```

Example specs live at `.planning/cf-probes/cf-13.yaml` and `.planning/cf-probes/cf-14.yaml`. The auto subcommand:

1. Reads the YAML spec at the path keyed by the CF-id (lowercase)
2. Validates required fields (`cf_id`, `probe_type`, `probe_args`, `routing_rules`)
3. Dispatches to the configured probe with reconstructed args
4. After the probe runs, reads the actual STATUS from the generated record file
5. Looks up `routing_rules[<status>]` to suggest the operator's next action

YAML schema:

```yaml
cf_id: CF-N
probe_type: file-snapshot   # one of: npm-audit / file-snapshot / upstream-version / test-marker / hidden-transitive-guard
probe_args:
  path: '<path>'            # type-specific
routing_rules:
  resolved-upstream: retire
  still-real: proceed
  inconclusive: proceed     # file-snapshot specifically
notes: |
  Operator-readable context for interpreting routing_rules.
```

See `docs/MISSION-PACKAGE-DISCIPLINE.md` §1.7 for full schema documentation including routing-semantics inversion notes (some CFs may map "file present" to `retire` rather than `proceed`).

If a CF's shape doesn't match any template, **author a new template here** as part of the W0 work. The catalogue grows as the codebase encounters more CF shapes.

## Vitest reporter note (v1.49.640 retro item)

For Template 2 (test-marker shape) background runs, **avoid the `| tail -N` pipe** — it buffers all output until vitest exits, hiding progress for 5-10 minute suites. Better alternatives:

- **`--reporter=tap-flat`** or `--reporter=tap` — emits per-test results progressively; doesn't buffer on pipe
- **`--outputFile=<path>`** with `--reporter=json` — writes structured output directly to a file (no pipe needed)
- Drop the `tail` filter entirely and write full output via `> file 2>&1`

Surfaced from v1.49.640 C1 experience where the buffered `tail -10` pipe hid 10+ minutes of in-progress state, costing ~5min of operator-clock-time uncertainty per cycle.

---

## See also

- `docs/MISSION-PACKAGE-DISCIPLINE.md` §1 — the discipline this catalogue serves
- `docs/SUBSTRATE-PROBE-DISCIPLINE.md` §3 — substrate-evidence template (sibling pattern at the substrate level)
- `.planning/c0-cf7-closure-verification-record.md` — Template 1 (tool-output) application
- `.planning/c0-cf9-cartridge-status-record.md` — Template 3 (config-state) application
- `.planning/c1-cf7-fix-record.md` §Lessons emitted (candidate) — hidden-transitive guard origin
