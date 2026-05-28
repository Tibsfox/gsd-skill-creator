#!/usr/bin/env node
/**
 * tools/security/check-stale-known-unwired.mjs
 *
 * Cross-audit inverse-check for KNOWN_UNWIRED allowlists.
 *
 * Scans the ProcessContext and EgressContext audit-test files for
 * KNOWN_UNWIRED entries, then checks each entry against both stale-shape
 * patterns:
 *
 *   Shape A — wired-but-still-in-allowlist: file is in KNOWN_UNWIRED AND
 *     also calls `ensureProcessAllowed` / `ensureEgressAllowed`. First
 *     surfaced at v1.49.834 (`intelligence/analyzer/git.ts`); closed by
 *     the v1.49.838 inline inverse-checks inside each audit-test. This
 *     tool re-implements the same logic at the cross-audit layer so it
 *     can be invoked from pre-tag-gate or ad-hoc without booting vitest.
 *
 *   Shape B — import-without-use: file is in KNOWN_UNWIRED AND imports
 *     the chokepoint module AND does not use any imported names anywhere
 *     in the file body. First surfaced at v1.49.852 (`scan-arxiv/bridge.ts`
 *     imported `execFileSync` but never called it). Applies only to
 *     import-driven chokepoints (ProcessContext). EgressContext is
 *     signature-driven (`fetch(` as a global) so shape B does not apply
 *     — the existing `KNOWN_UNWIRED contains fetch()` check in
 *     `egress-context-audit.test.ts` is the shape-B equivalent.
 *
 * Codified at v1.49.857 as Lesson #10443. See
 * `docs/known-unwired-ledger-discipline.md` §"Inverse-audit: stale-entry
 * detection".
 *
 * Usage:
 *   node tools/security/check-stale-known-unwired.mjs           # human-readable
 *   node tools/security/check-stale-known-unwired.mjs --json    # JSON report
 *
 * Exit code: 0 if clean, 1 if any stale entries found.
 *
 * @module tools/security/check-stale-known-unwired
 */

import { readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const AUDITS = [
  {
    name: 'ProcessContext',
    auditFile: 'src/security/process-context-audit.test.ts',
    ensureName: 'ensureProcessAllowed',
    importPattern: /(?:node:)?child_process/,
    namedImportPattern:
      /import\s*(?:type\s+)?\{([^}]+)\}\s*from\s*['"](?:node:)?child_process['"]/g,
    detectImportWithoutUse: true,
  },
  {
    name: 'EgressContext',
    auditFile: 'src/security/egress-context-audit.test.ts',
    ensureName: 'ensureEgressAllowed',
    // Egress chokepoint is signature-driven (fetch as a global).
    // Existing `audit-test` "contains fetch()" check is the shape-B equivalent.
    importPattern: null,
    namedImportPattern: null,
    detectImportWithoutUse: false,
  },
];

/** Extract KNOWN_UNWIRED entries from an audit-test source file via regex. */
function extractKnownUnwired(auditPath) {
  const content = readFileSync(auditPath, 'utf8');
  // Hardened regex: require the closing `]);` to be at the start of a line
  // (after optional whitespace). Non-greedy match across `[]` substrings
  // inside comments (v867 surfaced this — "all errors return [])" inside a
  // comment used to trip the prior `]\s*\)` terminator).
  const setMatch = content.match(
    /const\s+KNOWN_UNWIRED\s*:\s*ReadonlySet<string>\s*=\s*new\s+Set\s*\(\s*\[([\s\S]*?)^\s*\]\s*\)/m,
  );
  if (!setMatch) return [];
  return [...setMatch[1].matchAll(/'([^']+\.ts)'/g)].map((m) => m[1]);
}

/** Shape A — file is in KNOWN_UNWIRED AND calls ensure*Allowed. */
function checkWiredButInAllowlist(content, ensureName) {
  const regex = new RegExp(`\\b${ensureName}\\s*\\(`);
  return regex.test(content);
}

/**
 * Shape B — file is in KNOWN_UNWIRED AND imports the chokepoint module
 * via named imports AND none of the imported names appears in the file
 * body outside the import line itself.
 *
 * Returns null when shape B doesn't apply (no import, or namespace/
 * require shape not handled here). Returns { unusedNames } when stale.
 */
function checkImportWithoutUse(content, namedImportPattern) {
  if (!namedImportPattern) return null;
  // Reset the regex's lastIndex for fresh global matching.
  const re = new RegExp(namedImportPattern.source, namedImportPattern.flags);
  const matches = [...content.matchAll(re)];
  if (matches.length === 0) return null;

  const namesByImport = matches.map((m) => ({
    fullMatch: m[0],
    names: m[1]
      .split(',')
      .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
      .filter((s) => s.length > 0 && /^[A-Za-z_$][\w$]*$/.test(s)),
  }));

  let body = content;
  for (const { fullMatch } of namesByImport) {
    body = body.replace(fullMatch, '');
  }

  const allNames = namesByImport.flatMap((n) => n.names);
  if (allNames.length === 0) return null;

  const unusedNames = allNames.filter((name) => {
    const safe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return !new RegExp(`\\b${safe}\\b`).test(body);
  });

  return unusedNames.length === allNames.length
    ? { unusedNames }
    : null;
}

/** Run both stale-shape checks against one audit configuration. */
function checkAudit(audit) {
  const auditAbs = resolve(ROOT, audit.auditFile);
  const entries = extractKnownUnwired(auditAbs);

  const findings = {
    shapeA: [],
    shapeB: [],
    missing: [],
  };

  for (const rel of entries) {
    const abs = resolve(ROOT, rel);
    let content;
    try {
      const st = statSync(abs);
      if (!st.isFile()) {
        findings.missing.push(rel);
        continue;
      }
      content = readFileSync(abs, 'utf8');
    } catch {
      findings.missing.push(rel);
      continue;
    }

    if (checkWiredButInAllowlist(content, audit.ensureName)) {
      findings.shapeA.push(rel);
    }

    if (audit.detectImportWithoutUse) {
      const shapeB = checkImportWithoutUse(content, audit.namedImportPattern);
      if (shapeB) {
        findings.shapeB.push({ path: rel, unusedNames: shapeB.unusedNames });
      }
    }
  }

  return { audit: audit.name, entryCount: entries.length, findings };
}

function main() {
  const args = process.argv.slice(2);
  const wantJson = args.includes('--json');

  const reports = AUDITS.map(checkAudit);
  const stale = reports.some(
    (r) =>
      r.findings.shapeA.length > 0 ||
      r.findings.shapeB.length > 0 ||
      r.findings.missing.length > 0,
  );

  if (wantJson) {
    process.stdout.write(JSON.stringify({ stale, reports }, null, 2) + '\n');
  } else {
    let out = '';
    for (const r of reports) {
      out += `\n${r.audit} (KNOWN_UNWIRED: ${r.entryCount})\n`;
      if (r.findings.shapeA.length === 0 && r.findings.shapeB.length === 0 && r.findings.missing.length === 0) {
        out += '  clean\n';
        continue;
      }
      if (r.findings.shapeA.length > 0) {
        out += `  Shape A (wired-but-still-in-allowlist): ${r.findings.shapeA.length}\n`;
        for (const p of r.findings.shapeA) out += `    - ${p}\n`;
      }
      if (r.findings.shapeB.length > 0) {
        out += `  Shape B (import-without-use): ${r.findings.shapeB.length}\n`;
        for (const { path, unusedNames } of r.findings.shapeB) {
          out += `    - ${path}  (unused: ${unusedNames.join(', ')})\n`;
        }
      }
      if (r.findings.missing.length > 0) {
        out += `  Missing files: ${r.findings.missing.length}\n`;
        for (const p of r.findings.missing) out += `    - ${p}\n`;
      }
    }
    process.stdout.write(out + (stale ? '\nstale entries detected\n' : '\nall allowlists clean\n'));
  }

  process.exit(stale ? 1 : 0);
}

main();
