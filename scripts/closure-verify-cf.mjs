#!/usr/bin/env node
/**
 * closure-verify-cf.mjs — CF closure-verification probe runner.
 *
 * Codifies Lesson #10199's W0 closure-verification gate as an executable tool.
 * Implements the four probe SHAPE categories from
 * `docs/test-discipline/cf-closure-verification-templates.md` plus the
 * hidden-transitive guard pattern from v1.49.640 C1 experience.
 *
 * Output convention: each probe writes to
 *   `.planning/c0-<CF-id>-closure-verification-record.md`
 *
 * Created: v1.49.641 C2 (CF-12 closure)
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

const REPO_ROOT = process.cwd();

// On Windows, `npm`/`npx` are `.cmd` shims. Two problems compound:
//   1. spawnSync with the bare name can't resolve the shim via PATH (ENOENT).
//   2. Since Node's CVE-2024-27980 fix, spawnSync of a `.cmd`/`.bat` file
//      WITHOUT `shell: true` throws EINVAL — so appending `.cmd` alone is not
//      enough; the call must also run through the shell.
// Running the shim through `shell: true` resolves both: cmd.exe finds `npm`/`npx`
// on PATH and is permitted to execute the batch shim. On POSIX both the `.cmd`
// suffix and the shell wrapper are skipped (bare name, no shell) — a no-op.
const isWin = process.platform === 'win32';
const bin = (name) => (isWin ? `${name}.cmd` : name);
// Spawn options that make `.cmd` shims runnable on win32 (shell: true) while
// staying a plain exec on POSIX. Merge into per-call spawnSync option objects.
const winShellOpts = isWin ? { shell: true } : {};

const PROBES = {
  'npm-audit': probeNpmAudit,
  'file-snapshot': probeFileSnapshot,
  'upstream-version': probeUpstreamVersion,
  'test-marker': probeTestMarker,
  'hidden-transitive-guard': probeHiddenTransitiveGuard,
  'auto': probeAuto,
};

function usage(exitCode = 0) {
  const out = exitCode === 0 ? process.stdout : process.stderr;
  out.write(`Usage:
  node scripts/closure-verify-cf.mjs <probe-type> <CF-id> [args...]

Probe types:
  npm-audit                <CF-id> [severity]         Run \`npm audit --audit-level=<severity> --json\` (default: high) and record advisories
  file-snapshot            <CF-id> <path>             Snapshot a config/state file (line count + first 20 lines)
  upstream-version         <CF-id> <package>          Check current upstream versions of a package
  test-marker              <CF-id> <test-file>        Run a specific test file and capture pass/fail state
  hidden-transitive-guard  <package>                  Pre-flight check for path-d-style root-dep removal
                                                       (lists src/ imports satisfied by <package>'s subtree)
  auto                     <CF-id>                    Read .planning/cf-probes/<CF-id>.yaml and dispatch
                                                       to the configured probe automatically (v1.49.642 C1)

Examples:
  node scripts/closure-verify-cf.mjs npm-audit CF-7
  node scripts/closure-verify-cf.mjs npm-audit CF-16 moderate
  node scripts/closure-verify-cf.mjs file-snapshot CF-9 .planning/cartridge-migration-phase2.md
  node scripts/closure-verify-cf.mjs upstream-version CF-7 gsd-pi
  node scripts/closure-verify-cf.mjs hidden-transitive-guard gsd-pi
  node scripts/closure-verify-cf.mjs auto CF-13

Probe spec YAML schema (.planning/cf-probes/<CF-id>.yaml):
  cf_id: CF-N                  # required; case-insensitive match
  probe_type: <type>           # required; one of the non-auto probe types above
  probe_args:                  # required; type-specific args (see below)
    path: '<path>'             #   file-snapshot
    package: '<pkg>'           #   upstream-version | hidden-transitive-guard
    test_file: '<file>'        #   test-marker
    severity: '<low|moderate|high|critical>'  # npm-audit (optional; defaults to 'high')
  routing_rules:               # required; map probe outcomes to operator actions
    resolved-upstream: retire
    still-real: proceed
  notes: |                     # optional; free-form context
    (any operator notes)

Records: written to .planning/c0-<CF-id>-closure-verification-record.md (gitignored).
Discipline: docs/MISSION-PACKAGE-DISCIPLINE.md \xa71 (Lesson #10199 codified).
`);
  process.exit(exitCode);
}

function ensureRecordDir() {
  const dir = resolve(REPO_ROOT, '.planning');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function recordPath(cfId) {
  return resolve(REPO_ROOT, '.planning', `c0-${cfId.toLowerCase()}-closure-verification-record.md`);
}

function writeRecord(cfId, body) {
  ensureRecordDir();
  const path = recordPath(cfId);
  writeFileSync(path, body, 'utf-8');
  return path;
}

const VALID_AUDIT_SEVERITIES = ['low', 'moderate', 'high', 'critical'];

function probeNpmAudit(args) {
  const [cfId, severityArg] = args;
  if (!cfId) usage(1);

  const severity = severityArg || 'high';
  if (!VALID_AUDIT_SEVERITIES.includes(severity)) {
    process.stderr.write(`[closure-verify] invalid severity "${severity}" — must be one of: ${VALID_AUDIT_SEVERITIES.join(', ')}\n`);
    return 1;
  }

  console.log(`[closure-verify] npm-audit probe for ${cfId} (severity=${severity})...`);
  const res = spawnSync(bin('npm'), ['audit', `--audit-level=${severity}`, '--json'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    ...winShellOpts,
  });

  let parsed = null;
  try { parsed = JSON.parse(res.stdout); } catch { /* leave null */ }

  const vulns = parsed?.metadata?.vulnerabilities ?? null;
  // Count vulns at or above the configured severity threshold (mirrors npm's own behavior)
  const thresholdIdx = VALID_AUDIT_SEVERITIES.indexOf(severity);
  const atOrAboveThreshold = vulns
    ? VALID_AUDIT_SEVERITIES.slice(thresholdIdx).reduce((sum, s) => sum + (vulns[s] ?? 0), 0)
    : null;
  const status = res.status === 0 ? 'resolved-upstream' : 'still-real';

  const advisories = [];
  for (const [pkg, info] of Object.entries(parsed?.vulnerabilities ?? {})) {
    advisories.push({
      package: pkg,
      severity: info.severity ?? '?',
      range: info.range ?? '?',
      ids: (info.via ?? [])
        .filter(v => typeof v === 'object' && v.source)
        .map(v => v.url ?? v.source)
        .slice(0, 3),
    });
  }

  const body = `# C0 — ${cfId} Closure-Verification Record (npm-audit probe)

**Probed at:** ${new Date().toISOString()}
**Probe command:** \`npm audit --audit-level=${severity} --json\`
**Severity threshold:** \`${severity}\`
**Exit code:** ${res.status}

## Status

**STATUS:** \`${status}\`

${vulns ? `\`\`\`
metadata.vulnerabilities:
  info:     ${vulns.info ?? 0}
  low:      ${vulns.low ?? 0}
  moderate: ${vulns.moderate ?? 0}
  high:     ${vulns.high ?? 0}
  critical: ${vulns.critical ?? 0}
  total:    ${vulns.total ?? 0}
\`\`\`` : 'JSON parse failed; see raw output below.'}

## Advisories

${advisories.length === 0
  ? `_None at ${severity}+ level._`
  : '| Package | Severity | Range | Advisory ID(s) |\n|---|---|---|---|\n' +
    advisories.map(a => `| \`${a.package}\` | ${a.severity} | \`${a.range}\` | ${a.ids.join('<br>') || '—'} |`).join('\n')}

## Routing decision

${status === 'resolved-upstream'
  ? `CF is RESOLVED at the \`${severity}\` threshold. Retire from carry-forward; no component-spec needed.`
  : `CF is STILL REAL. Total advisories at or above \`${severity}\`: ${atOrAboveThreshold}. Proceed with closure path (b/c/d/e per MISSION-PACKAGE-DISCIPLINE.md \xa71.3).`}

## See also

- \`docs/MISSION-PACKAGE-DISCIPLINE.md\` \xa71.3 — gate discipline
- \`docs/test-discipline/cf-closure-verification-templates.md\` — Template 1 (tool-output)

---

_Auto-generated by \`scripts/closure-verify-cf.mjs npm-audit ${cfId}${severityArg ? ` ${severity}` : ''}\`._
`;

  const written = writeRecord(cfId, body);
  console.log(`[closure-verify] STATUS: ${status} (${severity}+: ${atOrAboveThreshold ?? '?'})`);
  console.log(`[closure-verify] wrote: ${written}`);
  return status === 'resolved-upstream' ? 0 : 1;
}

function probeFileSnapshot(args) {
  const [cfId, filePath] = args;
  if (!cfId || !filePath) usage(1);

  console.log(`[closure-verify] file-snapshot probe for ${cfId}: ${filePath}...`);
  const abs = resolve(REPO_ROOT, filePath);

  let status = 'inconclusive';
  let body;

  if (!existsSync(abs)) {
    status = 'resolved-upstream';
    body = `# C0 — ${cfId} Closure-Verification Record (file-snapshot probe)

**Probed at:** ${new Date().toISOString()}
**Probe target:** \`${filePath}\`
**File present:** NO

## Status

**STATUS:** \`${status}\`

The target file is absent — CF may be moot.

## Routing decision

Retire CF if file absence indicates resolution. Operator confirms.

---

_Auto-generated by \`scripts/closure-verify-cf.mjs file-snapshot ${cfId} ${filePath}\`._
`;
  } else {
    const content = readFileSync(abs, 'utf-8');
    const lines = content.split('\n');
    const sample = lines.slice(0, 20).join('\n');
    const sizeBytes = statSync(abs).size;

    body = `# C0 — ${cfId} Closure-Verification Record (file-snapshot probe)

**Probed at:** ${new Date().toISOString()}
**Probe target:** \`${filePath}\`
**File present:** YES (${lines.length} lines, ${sizeBytes} bytes)

## Status

**STATUS:** \`inconclusive\` (snapshot only; operator interprets vs predecessor state)

## First 20 lines (snapshot)

\`\`\`
${sample}
\`\`\`

## Routing decision

Operator compares against predecessor state. If identical: route forward unchanged. If changed: investigate.

---

_Auto-generated by \`scripts/closure-verify-cf.mjs file-snapshot ${cfId} ${filePath}\`._
`;
    status = 'inconclusive';
  }

  const written = writeRecord(cfId, body);
  console.log(`[closure-verify] STATUS: ${status}`);
  console.log(`[closure-verify] wrote: ${written}`);
  return 0;
}

function probeUpstreamVersion(args) {
  const [cfId, pkgName] = args;
  if (!cfId || !pkgName) usage(1);

  console.log(`[closure-verify] upstream-version probe for ${cfId}: ${pkgName}...`);
  const versions = spawnSync(bin('npm'), ['view', pkgName, 'versions', '--json'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    ...winShellOpts,
  });
  const deprecated = spawnSync(bin('npm'), ['view', pkgName, 'deprecated'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    ...winShellOpts,
  });

  let parsedVersions = [];
  try { parsedVersions = JSON.parse(versions.stdout) ?? []; } catch { /* leave empty */ }
  const last5 = parsedVersions.slice(-5);
  const deprecatedMsg = (deprecated.stdout ?? '').trim();

  const body = `# C0 — ${cfId} Closure-Verification Record (upstream-version probe)

**Probed at:** ${new Date().toISOString()}
**Probe target:** \`${pkgName}\`

## Status

**STATUS:** \`inconclusive\` (operator interprets vs CF spec version range)

## Versions

- Total published versions: ${parsedVersions.length}
- Latest 5: \`${last5.join('\`, \`')}\`

## Deprecation status

${deprecatedMsg ? `\`\`\`\n${deprecatedMsg}\n\`\`\`` : '_No deprecation message._'}

## Routing decision

If a non-vulnerable version is available outside the CF's flagged range: candidate for closure via upgrade.
If the package itself is deprecated: candidate for closure via replacement.
Otherwise: still real; proceed with closure path.

---

_Auto-generated by \`scripts/closure-verify-cf.mjs upstream-version ${cfId} ${pkgName}\`._
`;

  const written = writeRecord(cfId, body);
  console.log(`[closure-verify] latest 5 versions: ${last5.join(', ')}`);
  console.log(`[closure-verify] wrote: ${written}`);
  return 0;
}

function probeTestMarker(args) {
  const [cfId, testFile] = args;
  if (!cfId || !testFile) usage(1);

  console.log(`[closure-verify] test-marker probe for ${cfId}: ${testFile}...`);
  const res = spawnSync(bin('npx'), ['vitest', 'run', testFile, '--reporter=dot'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    ...winShellOpts,
  });
  const status = res.status === 0 ? 'resolved-upstream' : 'still-real';
  const stdoutTail = (res.stdout ?? '').split('\n').slice(-15).join('\n');

  const body = `# C0 — ${cfId} Closure-Verification Record (test-marker probe)

**Probed at:** ${new Date().toISOString()}
**Probe command:** \`npx vitest run ${testFile} --reporter=dot\`
**Exit code:** ${res.status}

## Status

**STATUS:** \`${status}\`

## Probe output (tail)

\`\`\`
${stdoutTail}
\`\`\`

## Routing decision

${status === 'resolved-upstream'
  ? 'Test passes locally — CF may be closed. Verify CI also passes for full confidence.'
  : 'Test fails locally — CF is still real. Proceed with closure work.'}

**Hidden trap:** check whether the test uses \`it.runIf(...)\` skip-guards. A "passing" test may be silently skipped. Inspect the test file source to confirm it actually runs.

---

_Auto-generated by \`scripts/closure-verify-cf.mjs test-marker ${cfId} ${testFile}\`._
`;

  const written = writeRecord(cfId, body);
  console.log(`[closure-verify] STATUS: ${status}`);
  console.log(`[closure-verify] wrote: ${written}`);
  return res.status === 0 ? 0 : 1;
}

function probeHiddenTransitiveGuard(args) {
  const [pkgName] = args;
  if (!pkgName) usage(1);

  console.log(`[closure-verify] hidden-transitive-guard probe for ${pkgName}...`);
  console.log(`[closure-verify]   listing transitive subtree of ${pkgName}...`);
  const lsResult = spawnSync(bin('npm'), ['ls', pkgName, '--depth=Infinity', '--json'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    ...winShellOpts,
  });

  let tree = null;
  try { tree = JSON.parse(lsResult.stdout); } catch { /* leave null */ }

  const subtreePkgs = new Set();
  function collect(node) {
    if (!node || typeof node !== 'object') return;
    if (node.dependencies) {
      for (const [name, child] of Object.entries(node.dependencies)) {
        subtreePkgs.add(name);
        collect(child);
      }
    }
  }
  collect(tree);
  subtreePkgs.delete(pkgName);  // exclude root

  console.log(`[closure-verify]   subtree size: ${subtreePkgs.size} packages`);
  console.log(`[closure-verify]   grepping src/ for direct imports of any subtree package...`);

  const hits = [];
  for (const pkg of subtreePkgs) {
    const grep = spawnSync('grep', ['-rl', `from '${pkg}'`, 'src/'], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
    });
    if (grep.status === 0 && grep.stdout.trim().length > 0) {
      hits.push({ pkg, files: grep.stdout.trim().split('\n') });
    }
  }

  const hasHits = hits.length > 0;
  const body = `# Hidden-Transitive Guard Report (${pkgName})

**Probed at:** ${new Date().toISOString()}
**Root dep:** \`${pkgName}\`
**Subtree size:** ${subtreePkgs.size} packages

## ${hasHits ? '⚠️  Hidden transitives detected' : '✓ No hidden transitives detected'}

${hasHits
  ? `Before removing \`${pkgName}\` from \`package.json\`, declare these packages as direct deps to avoid breaking src/ imports:

| Package | src/ files importing it |
|---|---|
${hits.map(h => `| \`${h.pkg}\` | ${h.files.map(f => `\`${f}\``).join('<br>')} |`).join('\n')}

**Recommended sequence:**
\`\`\`bash
${hits.map(h => `npm install ${h.pkg} --save`).join('\n')}
# THEN remove the root dep:
# (edit package.json to remove "${pkgName}")
npm install
\`\`\``
  : `Removing \`${pkgName}\` from \`package.json\` is safe with respect to direct src/ imports. (No transitive in its subtree is imported by source code.)

Verify also: \`tools/\`, \`tests/\`, and \`desktop/\` for any imports the guard didn't check.`}

---

_Auto-generated by \`scripts/closure-verify-cf.mjs hidden-transitive-guard ${pkgName}\`._
_Source: Lesson #10204 (v1.49.640 C1 experience)._
`;

  const written = writeRecord(`htg-${pkgName.replace(/[^a-z0-9-]/gi, '-')}`, body);
  console.log(`[closure-verify] HIDDEN TRANSITIVES: ${hasHits ? hits.length : 0}`);
  console.log(`[closure-verify] wrote: ${written}`);
  return hasHits ? 1 : 0;
}

// ─── Auto-dispatch via probe spec YAML (v1.49.642 C1) ─────────────────

/**
 * @typedef {Object} CfProbeSpec
 * @property {string} cf_id
 * @property {'npm-audit'|'file-snapshot'|'upstream-version'|'test-marker'|'hidden-transitive-guard'} probe_type
 * @property {Record<string, string>} probe_args   - type-specific args
 * @property {Record<string, string>} routing_rules - outcome -> action
 * @property {string=} notes                        - optional free-form context
 */

function buildArgsForProbe(probeType, cfId, probeArgs) {
  switch (probeType) {
    case 'npm-audit':
      return probeArgs.severity ? [cfId, probeArgs.severity] : [cfId];
    case 'file-snapshot':
      return [cfId, probeArgs.path];
    case 'upstream-version':
      return [cfId, probeArgs.package];
    case 'test-marker':
      return [cfId, probeArgs.test_file];
    case 'hidden-transitive-guard':
      return [probeArgs.package];
    default:
      throw new Error(`unknown probe_type: ${probeType}`);
  }
}

function probeAuto(args) {
  const [cfId] = args;
  if (!cfId) usage(1);

  const specPath = resolve(REPO_ROOT, '.planning', 'cf-probes', `${cfId.toLowerCase()}.yaml`);
  if (!existsSync(specPath)) {
    process.stderr.write(`[closure-verify auto] probe spec not found: ${specPath}\n`);
    process.stderr.write(`[closure-verify auto] create one with:\n`);
    process.stderr.write(`  cf_id: ${cfId}\n  probe_type: <type>\n  probe_args: {<key>: <value>}\n  routing_rules: {resolved-upstream: retire, still-real: proceed}\n`);
    return 1;
  }

  let spec;
  try {
    spec = parseYaml(readFileSync(specPath, 'utf-8'));
  } catch (e) {
    process.stderr.write(`[closure-verify auto] failed to parse YAML at ${specPath}: ${e.message}\n`);
    return 1;
  }

  if (!spec || typeof spec !== 'object') {
    process.stderr.write(`[closure-verify auto] YAML at ${specPath} did not parse to an object\n`);
    return 1;
  }

  const requiredFields = ['cf_id', 'probe_type', 'probe_args', 'routing_rules'];
  for (const f of requiredFields) {
    if (!(f in spec)) {
      process.stderr.write(`[closure-verify auto] missing required field "${f}" in ${specPath}\n`);
      return 1;
    }
  }

  if (spec.probe_type === 'auto' || !(spec.probe_type in PROBES)) {
    const allowed = Object.keys(PROBES).filter(k => k !== 'auto').join(', ');
    process.stderr.write(`[closure-verify auto] invalid probe_type "${spec.probe_type}" — must be one of: ${allowed}\n`);
    return 1;
  }

  const reconstructedArgs = buildArgsForProbe(spec.probe_type, spec.cf_id, spec.probe_args ?? {});
  console.log(`[closure-verify auto] CF=${spec.cf_id} probe_type=${spec.probe_type}`);
  if (spec.notes) {
    console.log(`[closure-verify auto] notes: ${String(spec.notes).split('\n')[0]}`);
  }

  const probeFn = PROBES[spec.probe_type];
  const result = probeFn(reconstructedArgs);

  // Read the actual STATUS from the record file the probe just wrote (more
  // accurate than mapping exit codes — file-snapshot has 3 possible statuses
  // but all currently exit 0).
  const recordRelKey = spec.probe_type === 'hidden-transitive-guard'
    ? `htg-${spec.probe_args.package.replace(/[^a-z0-9-]/gi, '-')}`
    : spec.cf_id.toLowerCase();
  const recordPath = resolve(REPO_ROOT, '.planning', `c0-${recordRelKey}-closure-verification-record.md`);
  let outcome = result === 0 ? 'resolved-upstream' : 'still-real';
  if (existsSync(recordPath)) {
    const statusMatch = readFileSync(recordPath, 'utf-8').match(/\*\*STATUS:\*\*\s*`([^`]+)`/);
    if (statusMatch) outcome = statusMatch[1];
  }
  const action = spec.routing_rules?.[outcome] ?? '(no routing rule for this outcome)';
  console.log(`[closure-verify auto] routing_rules[${outcome}] => ${action}`);

  return result;
}

// ─── Entry point ───────────────────────────────────────────────────────

const [probeType, ...probeArgs] = process.argv.slice(2);

if (!probeType || probeType === '--help' || probeType === '-h') usage(0);
if (!(probeType in PROBES)) {
  process.stderr.write(`closure-verify-cf: unknown probe type "${probeType}"\n`);
  usage(1);
}

const result = PROBES[probeType](probeArgs);
process.exit(result ?? 0);
