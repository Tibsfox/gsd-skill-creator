# 02 — Walkthrough: v1.49.642 Housekeeping Cluster #9

Per-component walkthrough with commit anchors, files touched, and invariants.

## C0 — W0 §1.3 design validation

**Wave:** W0
**Output:** `.planning/c0-cf14-design-review.md` (gitignored design-intent validation)

### What happened

CF-14 is a NEW carry-forward from v1.49.641 (single-cluster; §1.4 re-framing review does NOT apply). The §1.3 mechanical W0 step was light:

| Question | Answer | Evidence |
|---|---|---|
| Is the per-CF probe spec format still useful? | YES | Cluster #9 carry-forward is at 2 items; both could have probe specs |
| Does design intent match tool surface? | YES | 5 probe types already implemented; auto extends them |
| Is the `yaml` dep available? | YES | `package.json:113` `"yaml": "^2.9.0"` from v1.49.640 C1 |
| Obvious blockers? | NO | `.planning/cf-probes/` inherits gitignore |
| Workflow uses this? | YES | Cluster #9 W0 author benefits from per-CF spec dispatch |

Routing: **PROCEED to C1.**

## C1 — CF-14 auto subcommand

**Wave:** W1A (single track)
**Commit:** `57f99a5b1` (`feat(scripts): closure-verify-cf auto subcommand + per-CF probe specs`)
**Files touched:**
- `scripts/closure-verify-cf.mjs` (EDIT — +90 LOC; added `auto` probe + `probeAuto` + `buildArgsForProbe` helper + usage updates)
- `tests/__tests__/closure-verify-cf.test.ts` (EDIT — +130 LOC; 5 new auto-probe tests)
- `docs/MISSION-PACKAGE-DISCIPLINE.md` (EDIT — §1.7 documents auto + YAML schema + routing-semantics inversion note)
- `docs/test-discipline/cf-closure-verification-templates.md` (EDIT — auto-dispatch section + YAML schema example)
- `.planning/cf-probes/cf-13.yaml` (NEW — example spec for forward-cadence decision audit)
- `.planning/cf-probes/cf-14.yaml` (NEW — self-referential example spec)

### Tool surface (post-C1)

6 probe types:

```bash
node scripts/closure-verify-cf.mjs npm-audit CF-N
node scripts/closure-verify-cf.mjs file-snapshot CF-N <path>
node scripts/closure-verify-cf.mjs upstream-version CF-N <pkg>
node scripts/closure-verify-cf.mjs test-marker CF-N <test-file>
node scripts/closure-verify-cf.mjs hidden-transitive-guard <pkg>
node scripts/closure-verify-cf.mjs auto CF-N  # NEW — reads .planning/cf-probes/<CF-N>.yaml
```

### probeAuto implementation

```js
function probeAuto(args) {
  const [cfId] = args;
  if (!cfId) usage(1);

  // Resolve + read spec
  const specPath = resolve(REPO_ROOT, '.planning', 'cf-probes', `${cfId.toLowerCase()}.yaml`);
  if (!existsSync(specPath)) {
    // Print helpful template + exit 1
  }
  const spec = parseYaml(readFileSync(specPath, 'utf-8'));

  // Validate required fields
  for (const f of ['cf_id', 'probe_type', 'probe_args', 'routing_rules']) {
    if (!(f in spec)) { /* error */ }
  }

  // Reject auto-as-probe-type (recursion prevention)
  if (spec.probe_type === 'auto' || !(spec.probe_type in PROBES)) { /* error */ }

  // Dispatch
  const reconstructedArgs = buildArgsForProbe(spec.probe_type, spec.cf_id, spec.probe_args);
  const result = PROBES[spec.probe_type](reconstructedArgs);

  // Read actual STATUS from the record file (not just exit code)
  const recordPath = resolve(REPO_ROOT, '.planning', `c0-${spec.cf_id.toLowerCase()}-closure-verification-record.md`);
  let outcome = result === 0 ? 'resolved-upstream' : 'still-real';
  if (existsSync(recordPath)) {
    const m = readFileSync(recordPath, 'utf-8').match(/\*\*STATUS:\*\*\s*`([^`]+)`/);
    if (m) outcome = m[1];
  }

  // Apply routing_rules
  const action = spec.routing_rules?.[outcome] ?? '(no routing rule for this outcome)';
  console.log(`[closure-verify auto] routing_rules[${outcome}] => ${action}`);
  return result;
}
```

### Mid-execution refinement: STATUS read from record

Initial probeAuto mapped exit code 0/1 to outcomes (`resolved-upstream` / `still-real`). Testing CF-14's self-referential spec revealed file-snapshot has 3 statuses but always exits 0 → routing rule lookup was wrong.

Fix: probeAuto reads the actual STATUS from the record file the probe just wrote. Now routing_rules dispatch is accurate for any probe regardless of exit-code semantics.

### Tests (5 new, 9 → 14 total)

```
describe('auto probe (v1.49.642 C1 — CF-14)', () => {
  it('reports missing spec file with helpful template')
  it('validates required fields in spec')
  it('dispatches to file-snapshot probe via spec')
  it('rejects invalid probe_type in spec')
  it('rejects auto as probe_type (prevents recursion)')
});
```

All 14 pass in 4.25s.

### Example probe specs

**`.planning/cf-probes/cf-13.yaml`:**

```yaml
cf_id: CF-13
probe_type: file-snapshot
probe_args:
  path: .planning/c0-cf13-routing-decision.md
routing_rules:
  resolved-upstream: proceed   # absent → CF still pending
  inconclusive: retire         # present → decision recorded
notes: |
  CF-13 = forward-cadence engine resumption (STS-7).
  Routing semantics inverted from default: file ABSENCE = CF still active.
```

**`.planning/cf-probes/cf-14.yaml`:** self-referential (probes `scripts/closure-verify-cf.mjs`'s existence as the feature-presence check).

Both files document the routing-semantics inversion that operators need to understand when authoring probe specs.

### Invariants asserted in meta-test

1-5 mapped to: yaml import / auto in PROBES / usage text / test count / design review record presence.

## C3 — Integration + ship pipeline

**Wave:** W3
**Commits:**
- `1c754b4c6` — Stage 0 post-ship refresh absorption (v1.49.641 RH + dashboard)
- `f2a58aa51` — Stage 2 meta-test
- (T14) — Stage 6 ship commit

8 meta-test invariants cover all closures + counter-cadence state. Skip-guard pattern for `.planning/` paths.

T14 atomic per Lesson #10191. STORY-gate auto-fires (5th consecutive ship validation).

## Mission package vs actual work mapping

| Mission spec | Actual outcome |
|---|---|
| C0 W0 §1.3 design validation | DONE — `c0-cf14-design-review.md` |
| C1 auto subcommand | DONE — `57f99a5b1` |
| C1 mid-execution STATUS-read fix | DONE in-cluster (added at the same commit) |
| C1 tests | DONE — 5 new tests; suite 9 → 14 |
| Example probe specs | DONE — cf-13.yaml + cf-14.yaml |
| Doc updates | DONE — §1.7 + companion |
| W3 Stage 0 absorb post-ship refresh | DONE — `1c754b4c6` |
| W3 Stage 2 meta-test | DONE — `f2a58aa51` |
| W3 Stage 3 release-notes | DONE (this chapter set) |
| W3 Stage 6 T14 ship | (pending operator G3) |

Tightest cluster yet — 3 pre-tag commits, ~1h wall-clock.
