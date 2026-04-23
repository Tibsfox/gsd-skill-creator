#!/usr/bin/env node
// Release History — Wave 1 ingester.
// Parses every docs/release-notes/v*/README.md and upserts into release_history.release.
// Idempotent: natural key = version. Re-runs update metadata, do not create duplicates.
//
// Usage:
//   node tools/release-history/ingest.mjs           # ingest all
//   node tools/release-history/ingest.mjs v1.49.39  # one version
//   node tools/release-history/ingest.mjs --dry-run # parse, print, no DB write
//
// Env: PG_HOST, PG_PORT, PG_USER, PGPASSWORD, PG_DB (loaded from .env by caller)

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, REPO_ROOT } from './config.mjs';
import { openDb } from './db.mjs';

const cfg = loadConfig();
const RELEASE_NOTES_DIR = cfg.source_dir_abs;
const REPORT_FILE = join(cfg.cache_dir_abs, '_ingest-report.json');
mkdirSync(cfg.cache_dir_abs, { recursive: true });

const VERSION_RE = /^v(\d+)\.(\d+)(?:\.(\d+))?(?:-(.+))?$/;

function parseVersion(v) {
  const m = VERSION_RE.exec(v);
  if (!m) return null;
  return {
    major: parseInt(m[1], 10),
    minor: parseInt(m[2], 10),
    patch: m[3] ? parseInt(m[3], 10) : 0,
    prerelease: m[4] || null,
  };
}

function compareVersions(a, b) {
  const pa = parseVersion(a), pb = parseVersion(b);
  if (!pa || !pb) return a.localeCompare(b);
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  if (pa.patch !== pb.patch) return pa.patch - pb.patch;
  return (pa.prerelease || '').localeCompare(pb.prerelease || '');
}

// Extractors — each returns {fields, confidence}. All run; results merged.
const extractors = [
  { name: 'header_name', weight: 0.15, fn: extractName },
  { name: 'shipped',     weight: 0.25, fn: extractShipped },
  { name: 'commits',     weight: 0.15, fn: extractCommits },
  { name: 'files_lines', weight: 0.15, fn: extractFilesAndLines },
  { name: 'branch_tag',  weight: 0.10, fn: extractBranchTag },
  { name: 'dedication',  weight: 0.05, fn: extractDedication },
  { name: 'phases_plans',weight: 0.05, fn: extractPhasesPlans },
  { name: 'retrospective', weight: 0.10, fn: extractRetrospectiveFlag },
];

function extractName(text) {
  // Try: "# v1.49.39 — name" / "# v1.49.39 -- name" / "# Release v1.X name" /
  //      `# v1.49.192 "Quoted Name"` (whitespace-only separator, quoted body)
  const patterns = [
    /^#\s*v[\d.]+\s*[—–-]{1,2}\s*"?([^"\n]+?)"?\s*$/m,
    /^#\s*v[\d.]+\s+"([^"\n]+)"\s*$/m,
    /^#\s*v[\d.]+\s*:\s*(.+?)\s*$/m,
    /^#\s*Release\s+v[\d.]+\s*[-—:]\s*(.+?)\s*$/m,
    /^#\s*(.+?)\s*\(v[\d.]+\)\s*$/m,
  ];
  for (const re of patterns) {
    const m = re.exec(text);
    if (m) return { name: m[1].trim().replace(/^"|"$/g, '') };
  }
  return null;
}

function extractShipped(text) {
  // **Shipped:** 2026-03-25 / **Released:** 2026-03-25 / **Date:** ... / Shipped: ...
  const re = /\*\*(?:Shipped|Released|Release Date|Date)\*?\*?:\*?\*?\s*(\d{4}-\d{2}-\d{2})/i;
  const m = re.exec(text);
  if (m) return { shipped_at: m[1] };
  // alt format: "Shipped 2026-03-25" in summary line
  const alt = /(?:Shipped|Released)\s+(?:on\s+)?(\d{4}-\d{2}-\d{2})/i.exec(text);
  if (alt) return { shipped_at: alt[1] };
  return null;
}

function extractCommits(text) {
  // Pattern A: **Commits:** <sha> (N)  — SHA followed by count in parens
  const reA = /\*\*Commits?\*?\*?:\*?\*?\s*`?[a-f0-9]{4,}`?\s*\((\d+)\)/i;
  const mA = reA.exec(text);
  if (mA) return { commits: parseInt(mA[1], 10) };
  // Pattern B: **Commits:** (N)  — just count in parens
  const reB = /\*\*Commits?\*?\*?:\*?\*?\s*\((\d+)\)/i;
  const mB = reB.exec(text);
  if (mB) return { commits: parseInt(mB[1], 10) };
  // Pattern C: **Commits:** N  — bare count, rejected if digits could be a SHA prefix
  const reC = /\*\*Commits?\*?\*?:\*?\*?\s*(\d+)(?![a-f\d])/i;
  const mC = reC.exec(text);
  if (mC) {
    const n = parseInt(mC[1], 10);
    // Sanity: commit counts between tags are at most a few thousand; reject obvious SHA mis-matches
    if (n < 100000) return { commits: n };
  }
  return null;
}

function extractFilesAndLines(text) {
  const out = {};
  const fm = /\*\*Files(?:\s+changed)?\*?\*?:\*?\*?\s*(\d+)/i.exec(text);
  if (fm) out.files_changed = parseInt(fm[1], 10);
  // "**Lines:** +75,996 / -1,557" or "+X / -Y"
  const lm = /\*\*Lines?\*?\*?:\*?\*?\s*\+?([\d,]+)\s*\/\s*-?([\d,]+)/i.exec(text);
  if (lm) {
    out.lines_added = parseInt(lm[1].replace(/,/g, ''), 10);
    out.lines_removed = parseInt(lm[2].replace(/,/g, ''), 10);
  }
  return Object.keys(out).length ? out : null;
}

function extractBranchTag(text) {
  const out = {};
  const bm = /\*\*Branch\*?\*?:\*?\*?\s*([^\n|]+?)(?:\s*\||\s*$)/im.exec(text);
  if (bm) out.branch = bm[1].trim();
  const tm = /\*\*Tag\*?\*?:\*?\*?\s*([^\n|]+?)(?:\s*\||\s*$)/im.exec(text);
  if (tm) out.tag = tm[1].trim();
  return Object.keys(out).length ? out : null;
}

function extractDedication(text) {
  const re = /\*\*Dedicated to\*?\*?:\*?\*?\s*([^\n]+)/i;
  const m = re.exec(text);
  return m ? { dedication: m[1].trim() } : null;
}

function extractPhasesPlans(text) {
  const out = {};

  // Strategy 1: prefer "(N phases[, ...])" parenthesized count — authoritative
  // when the author writes it. Tolerate trailing ", 4 waves" etc.
  // Matches: "(5 phases)", "(5 phases, 4 waves)", "(18 phases, two halves)".
  const pCount = /\*\*Phases?\*?\*?:\*?\*?\s*[^()\n]*?\((\d+)\s*phases?(?:[,)][^)]*)?\)/i.exec(text);
  if (pCount) {
    out.phases = parseInt(pCount[1], 10);
  } else {
    // Strategy 2: range "N-M" or "N–M" (ASCII hyphen OR unicode en/em dash) OR
    // "N → M" (arrow). Count = max - min + 1. Handles "**Phases:** 1-5",
    // "**Phases:** 679 → 683", "**Phases:** 685–700".
    const pRange =
      /\*\*Phases?\*?\*?:\*?\*?\s*(\d+(?:\.\d+)?)\s*(?:-|–|—|→)\s*(\d+(?:\.\d+)?)/i.exec(text);
    if (pRange) {
      const lo = parseFloat(pRange[1]);
      const hi = parseFloat(pRange[2]);
      if (hi >= lo) out.phases = Math.floor(hi) - Math.floor(lo) + 1;
    } else {
      // Strategy 3: enumerate comma-separated items like "684, 684.1, 685–700"
      // — count items (a range counts as `hi - lo + 1` of sub-items). Requires
      // either a comma OR a range to trigger; a bare single number like
      // "684" is ambiguous (1 phase vs phase-NUMBER 684) and falls through
      // to strategy 4's cap-at-99 heuristic.
      const pListMatch = /\*\*Phases?\*?\*?:\*?\*?\s*([^\n]+?)(?:\s*\(|\.\s*$|$)/i.exec(text);
      const listText = pListMatch?.[1] || '';
      const hasMultipleChunks = listText.includes(',') || /(?:-|–|—|→)/.test(listText);
      if (pListMatch && hasMultipleChunks) {
        let count = 0;
        for (const chunk of listText.split(/\s*,\s*/)) {
          const subRange = /(\d+(?:\.\d+)?)\s*(?:-|–|—|→)\s*(\d+(?:\.\d+)?)/.exec(chunk);
          if (subRange) {
            const lo = parseFloat(subRange[1]);
            const hi = parseFloat(subRange[2]);
            if (hi >= lo) count += Math.floor(hi) - Math.floor(lo) + 1;
          } else if (/^\s*\d+(?:\.\d+)?\s*$/.test(chunk)) {
            count += 1;
          }
        }
        if (count > 0) out.phases = count;
      }
      // Strategy 4: fallback to a single integer after "**Phases:**" — only
      // accept if the value is small enough to plausibly be a COUNT (not a
      // phase NUMBER). Absolute phase numbers in this project are >=100 as
      // of v1.49.x; a count of 100+ per release is implausible. We cap at 99
      // to avoid the historical bug where a phase number like 684 was
      // recorded as if it were a count of 684 phases.
      if (out.phases === undefined) {
        const pm = /\*\*Phases?\*?\*?:\*?\*?\s*(\d+)(?![\d-])/i.exec(text);
        if (pm) {
          const n = parseInt(pm[1], 10);
          if (n > 0 && n < 100) out.phases = n;
          // else: likely a phase NUMBER, not count — leave null.
        }
      }
    }
  }

  const plm = /\*\*Plans?\*?\*?:\*?\*?\s*(\d+)/i.exec(text);
  if (plm) out.plans = parseInt(plm[1], 10);
  return Object.keys(out).length ? out : null;
}

function extractRetrospectiveFlag(text) {
  const hasRetro =
    /##+\s*Retrospective/im.test(text) ||
    /##+\s*What Worked/im.test(text) ||
    /##+\s*Lessons Learned/im.test(text);
  return { has_retrospective: hasRetro, retrospective_status: hasRetro ? 'present' : 'missing' };
}

function parseRelease(version, text) {
  const parsed = parseVersion(version);
  if (!parsed) return null;
  const fields = {
    version,
    semver_major: parsed.major,
    semver_minor: parsed.minor,
    semver_patch: parsed.patch,
    semver_prerelease: parsed.prerelease,
    name: null,
    shipped_at: null,
    commits: null,
    files_changed: null,
    lines_added: null,
    lines_removed: null,
    branch: null,
    tag: null,
    dedication: null,
    phases: null,
    plans: null,
    source_readme: `docs/release-notes/${version}/README.md`,
    parse_confidence: 0,
    has_retrospective: false,
    retrospective_status: 'unknown',
  };
  const warnings = [];
  for (const ex of extractors) {
    try {
      const result = ex.fn(text);
      if (result) {
        Object.assign(fields, result);
        fields.parse_confidence += ex.weight;
      }
    } catch (e) {
      warnings.push(`${ex.name}: ${e.message}`);
    }
  }
  fields.parse_confidence = Math.round(fields.parse_confidence * 100) / 100;
  return { fields, warnings };
}

async function upsertRelease(client, r) {
  const cols = [
    'version', 'semver_major', 'semver_minor', 'semver_patch', 'semver_prerelease',
    'name', 'shipped_at', 'commits', 'files_changed', 'lines_added', 'lines_removed',
    'branch', 'tag', 'dedication', 'phases', 'plans',
    'source_readme', 'parse_confidence', 'has_retrospective', 'retrospective_status',
  ];
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
  const updates = cols.filter(c => c !== 'version').map(c => `${c} = EXCLUDED.${c}`).join(',\n    ');
  const sql = `
    INSERT INTO release_history.release (${cols.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT (version) DO UPDATE SET
    ${updates}
  `;
  const values = cols.map(c => r[c]);
  await client.query(sql, values);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const explicitVersion = args.find(a => !a.startsWith('--'));

  let client = null;
  if (!dryRun) {
    client = await openDb(cfg);
    // Readiness probe — both drivers can run this after setup (SQLite strips the schema prefix)
    const probe = await client.query(
      client.driver === 'postgres'
        ? `SELECT 1 FROM information_schema.tables WHERE table_schema = 'release_history' AND table_name = 'release'`
        : `SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'release'`
    );
    if (probe.rows.length === 0) {
      throw new Error(`release table not found — apply migrations/release-history/001-init.${client.driver}.sql first`);
    }
  }

  let versions;
  if (explicitVersion) {
    versions = [explicitVersion];
  } else {
    versions = readdirSync(RELEASE_NOTES_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory() && VERSION_RE.test(e.name))
      .map(e => e.name)
      .sort(compareVersions);
  }

  console.error(`[ingest] ${versions.length} releases to process${dryRun ? ' (dry-run)' : ''}`);

  const results = {
    started_at: new Date().toISOString(),
    total: versions.length,
    ingested: 0,
    skipped: 0,
    errors: 0,
    confidence_buckets: { high: 0, medium: 0, low: 0, zero: 0 },
    per_version: [],
  };

  let i = 0;
  for (const v of versions) {
    i++;
    const readmePath = join(RELEASE_NOTES_DIR, v, 'README.md');
    let text = '';
    if (existsSync(readmePath)) {
      text = readFileSync(readmePath, 'utf8');
    }
    // Flat-layout support — some releases (e.g. v1.49.568 Nonlinear Frontier,
    // v1.49.569 Drift in LLM Systems) ship a sibling RETROSPECTIVE.md /
    // LESSONS.md at the release-root instead of chaptered under chapter/.
    // Concatenate those into the parse text so extractRetrospectiveFlag and
    // the ingest-deep parser pick them up. Sentinel headers ensure the flag
    // regex triggers even if the sibling file lacks a `## Retrospective`
    // heading.
    const flatRetro = join(RELEASE_NOTES_DIR, v, 'RETROSPECTIVE.md');
    if (existsSync(flatRetro)) {
      text += '\n\n## Retrospective\n\n' + readFileSync(flatRetro, 'utf8');
    }
    const flatLessons = join(RELEASE_NOTES_DIR, v, 'LESSONS.md');
    if (existsSync(flatLessons)) {
      text += '\n\n## Lessons Learned\n\n' + readFileSync(flatLessons, 'utf8');
    }
    const parsed = parseRelease(v, text);
    if (!parsed) {
      results.errors++;
      results.per_version.push({ version: v, error: 'parseVersion failed' });
      continue;
    }
    const conf = parsed.fields.parse_confidence;
    if (conf >= 0.7) results.confidence_buckets.high++;
    else if (conf >= 0.4) results.confidence_buckets.medium++;
    else if (conf > 0) results.confidence_buckets.low++;
    else results.confidence_buckets.zero++;

    if (!dryRun) {
      try {
        await upsertRelease(client, parsed.fields);
        results.ingested++;
      } catch (e) {
        results.errors++;
        results.per_version.push({ version: v, error: e.message });
        console.error(`[ingest] FAIL ${v}: ${e.message}`);
        continue;
      }
    }
    results.per_version.push({
      version: v,
      confidence: parsed.fields.parse_confidence,
      has_retro: parsed.fields.has_retrospective,
      name: parsed.fields.name,
      shipped: parsed.fields.shipped_at,
    });
    if (i % 50 === 0) console.error(`[ingest] progress: ${i}/${versions.length}`);
  }

  if (client) await client.close();

  results.finished_at = new Date().toISOString();
  writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2));

  console.error(`[ingest] done — ingested ${results.ingested}, errors ${results.errors}`);
  console.log(JSON.stringify({
    total: results.total,
    ingested: results.ingested,
    errors: results.errors,
    confidence_buckets: results.confidence_buckets,
    report: REPORT_FILE.replace(REPO_ROOT + '/', ''),
  }, null, 2));

  process.exit(results.errors ? 1 : 0);
}

main().catch(e => {
  console.error('[ingest] fatal:', e.message);
  process.exit(2);
});
