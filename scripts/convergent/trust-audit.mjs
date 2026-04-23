#!/usr/bin/env node
// scripts/convergent/trust-audit.mjs
// Permanent repo utility shipped by Phase 720 (v1.49.570 Convergent Substrate).
//
// Thin CLI wrapper over src/trust-tiers auditCartridges(). Reads a cartridge
// metadata JSON (default .grove/arena.json if present; overridable) and emits
// a trust-tier report in markdown or JSON. Used by `skill-creator convergent
// trust-audit` subcommand (see src/convergent/cli.ts).
//
// Satisfies CONV-14 of v1.49.570 Convergent Substrate.
//
// CLI:
//   node scripts/convergent/trust-audit.mjs [--input <json>] [--format markdown|json]
//
// Exit codes:
//   0 — health score >= 0.5 (acceptable)
//   1 — health score < 0.5 (warnings present)
//   2 — input file missing or malformed

import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const args = { format: 'markdown' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--input') args.input = argv[++i];
    else if (a === '--format') args.format = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function usage() {
  console.log(`Usage: trust-audit.mjs [--input <path-to-cartridge-list.json>] [--format markdown|json]

Produces a trust-tier audit over a cartridge list. Each cartridge record must have
shape { cartridgeId: string, tier: 'T1'|'T2'|'T3'|'T4', signals: {...} }.

Default --input: .grove/cartridges.json (fallback to emit an empty-audit report).
Reports are consumed by 'skill-creator convergent trust-audit'.`);
}

export function loadCartridges(inputPath) {
  if (!inputPath || !fs.existsSync(inputPath)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    if (!Array.isArray(raw.cartridges)) return [];
    return raw.cartridges;
  } catch {
    return null; // malformed
  }
}

export function formatMarkdown(report) {
  const lines = [];
  lines.push('# Trust-Tier Audit');
  lines.push('');
  lines.push(`Total cartridges: **${report.totalCartridges}**`);
  lines.push(`Health score: **${report.healthScore.toFixed(3)}**`);
  lines.push(`Jiang 2026 vulnerability baseline: **${report.vulnerabilityBaseline}%**`);
  lines.push('');
  lines.push('## Distribution by tier');
  lines.push('');
  lines.push('| Tier | Count |');
  lines.push('|------|-------|');
  lines.push(`| T1 | ${report.byTier.T1} |`);
  lines.push(`| T2 | ${report.byTier.T2} |`);
  lines.push(`| T3 | ${report.byTier.T3} |`);
  lines.push(`| T4 | ${report.byTier.T4} |`);
  lines.push('');
  if (report.t4Cartridges.length) {
    lines.push('## T4 (sandbox-only) cartridges');
    for (const id of report.t4Cartridges) lines.push(`- ${id}`);
    lines.push('');
  }
  if (report.warnings.length) {
    lines.push('## Warnings');
    for (const w of report.warnings) lines.push(`- ${w}`);
    lines.push('');
  }
  return lines.join('\n');
}

export async function main(argv = process.argv) {
  const args = parseArgs(argv);
  if (args.help) {
    usage();
    process.exit(0);
  }

  // Dynamic import so we can pick up the compiled src/trust-tiers
  let auditCartridges;
  try {
    const mod = await import(path.join(process.cwd(), 'dist', 'trust-tiers', 'index.js'));
    auditCartridges = mod.auditCartridges;
  } catch {
    try {
      const mod = await import(path.join(process.cwd(), 'src', 'trust-tiers', 'index.ts'));
      auditCartridges = mod.auditCartridges;
    } catch (e) {
      console.error('trust-audit: failed to load auditCartridges from src/trust-tiers');
      console.error(String(e));
      process.exit(2);
    }
  }

  const inputPath = args.input ?? path.join(process.cwd(), '.grove', 'cartridges.json');
  const cartridges = loadCartridges(inputPath);
  if (cartridges === null) {
    console.error(`trust-audit: malformed input at ${inputPath}`);
    process.exit(2);
  }

  const report = auditCartridges(cartridges);

  if (args.format === 'json') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatMarkdown(report));
  }

  if (report.healthScore < 0.5 || report.warnings.length > 0) {
    process.exit(1);
  }
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
