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
