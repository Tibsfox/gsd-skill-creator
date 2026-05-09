#!/usr/bin/env node
// session-to-prov.mjs — Reference extractor:
//   Read .planning/sessions/<archive>.jsonl + .meta.json + .tokens.jsonl
//   Read git log between started_commit..ended_commit
//   Emit SQL transcript that populates prov_node + prov_edge
//
// This is the cartridge's reference implementation. It demonstrates the
// session→PROV-O mapping from doc 06 §4.1 of the source-of-truth track.
//
// Usage:
//   node session-to-prov.mjs --archive .planning/sessions/2026-04-25-...jsonl \
//                            --repo-root /media/foxy/ai/GSD/dev-tools/gsd-skill-creator \
//                            > out.sql
//
// Output: idempotent INSERT ... ON CONFLICT DO UPDATE statements; safe to
// apply repeatedly.

import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, basename } from 'node:path';

// --------- args ---------
const args = parseArgs(process.argv.slice(2));
if (!args.archive) usage();
const REPO = args['repo-root'] ?? process.cwd();
const ARCHIVE = args.archive;
const META_FILE = ARCHIVE.replace(/\.jsonl$/, '.meta.json');
const TOKENS_FILE = ARCHIVE.replace(/\.jsonl$/, '.tokens.jsonl');

// --------- load session ---------
if (!existsSync(ARCHIVE) || !existsSync(META_FILE)) {
  console.error(`Missing archive or meta: ${ARCHIVE} / ${META_FILE}`);
  process.exit(1);
}
const meta = JSON.parse(readFileSync(META_FILE, 'utf8'));
const events = readFileSync(ARCHIVE, 'utf8')
  .split('\n').filter(Boolean).map(l => JSON.parse(l));
const tokenEntries = existsSync(TOKENS_FILE)
  ? readFileSync(TOKENS_FILE, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l))
  : [];
const totalTokens = tokenEntries.reduce(
  (acc, t) => ({ in: acc.in + t.in_tokens, out: acc.out + t.out_tokens, total: acc.total + t.total }),
  { in: 0, out: 0, total: 0 }
);

const sessionId = `session:${basename(ARCHIVE).replace(/\.jsonl$/, '')}`;
const sessionPayload = {
  mission: meta.mission,
  started_commit: meta.started_commit,
  ended_commit: meta.ended_commit,
  event_count: events.length,
  archive: meta.archive ?? basename(ARCHIVE),
  tokens: totalTokens,
};
const byKind = events.reduce((acc, e) => ((acc[e.kind] = (acc[e.kind] ?? 0) + 1), acc), {});
sessionPayload.event_count_by_kind = byKind;

// --------- load git commits in range ---------
let commits = [];
if (meta.started_commit && meta.ended_commit) {
  try {
    const out = execSync(
      `git -C "${REPO}" log --pretty=format:'%H|%aI|%an|%s' ${meta.started_commit}..${meta.ended_commit}`,
      { encoding: 'utf8' }
    );
    commits = out.split('\n').filter(Boolean).map(line => {
      const [sha, authoredAt, author, ...subjParts] = line.split('|');
      const subject = subjParts.join('|');
      let body = '';
      try {
        body = execSync(
          `git -C "${REPO}" log -1 --format=%b ${sha}`,
          { encoding: 'utf8' }
        ).trim();
      } catch {}
      return { sha, authoredAt, author, subject, body };
    });
  } catch (e) {
    console.error(`# WARN: git log failed: ${e.message}`);
  }
}

// --------- emit SQL ---------
console.log(`-- session-to-prov.mjs output for ${ARCHIVE}`);
console.log(`-- generated ${new Date().toISOString()}`);
console.log();
console.log(`SET search_path TO scribe, public;`);
console.log();

// 1. Session activity
emitNode(sessionId, 'Activity', 'session', meta.mission, sessionPayload, {
  started_at: meta.started_at,
  ended_at: meta.ended_at,
});

// 2. Commits as Entities + wasGeneratedBy session
for (const c of commits) {
  const nodeId = `commit:${c.sha}`;
  const icMatch = (c.subject + ' ' + c.body).match(/IC-\d+-\d+(?:\.\d+)?/g) ?? [];
  emitNode(nodeId, 'Entity', 'commit', c.subject, {
    sha: c.sha,
    subject: c.subject,
    body: c.body,
    author: c.author,
    authored_at: c.authoredAt,
    ic_identifiers: icMatch,
  });
  emitEdge(nodeId, sessionId, 'wasGeneratedBy');

  // For each IC-* identifier referenced, create a task node + used edge
  for (const ic of icMatch) {
    const taskId = `task:${ic}`;
    emitNode(taskId, 'Entity', 'task', ic, { identifier: ic });
    emitEdge(nodeId, taskId, 'used');
  }
}

// 3. Decision events as Plan entities + alternatives
for (const e of events) {
  if (e.kind !== 'decision') continue;
  const decisionId = `decision:${sha8(`${sessionId}|${e.t}|${e.label}`)}`;
  emitNode(decisionId, 'Plan', 'decision', e.label, {
    reason: e.payload?.reason ?? null,
    alternatives: e.payload?.alternatives ?? [],
    decided_at: e.t,
  });
  emitEdge(decisionId, sessionId, 'wasGeneratedBy');

  // Each alternative becomes its own Entity influenced by the decision
  for (const [i, alt] of (e.payload?.alternatives ?? []).entries()) {
    const altLabel = typeof alt === 'string' ? alt : (alt.label ?? JSON.stringify(alt));
    const altId = `alternative:${sha8(`${decisionId}|${i}|${altLabel}`)}`;
    emitNode(altId, 'Entity', 'alternative', altLabel, {
      decision_id: decisionId,
      rejection_reason: typeof alt === 'object' ? (alt.reason ?? null) : null,
    });
    emitEdge(altId, decisionId, 'wasInfluencedBy');
  }
}

// 4. Friction / win / correction / gap events as Entities (lightweight)
for (const e of events) {
  if (!['friction', 'win', 'correction', 'gap', 'tool-use'].includes(e.kind)) continue;
  const evId = `${e.kind}:${sha8(`${sessionId}|${e.t}|${e.label}`)}`;
  emitNode(evId, 'Entity', e.kind, e.label, e.payload ?? {});
  emitEdge(evId, sessionId, 'wasInformedBy');
}

// --------- helpers ---------
function emitNode(nodeId, type, subType, label, payload, ts = {}) {
  const json = JSON.stringify(payload).replace(/'/g, "''");
  const lbl = (label ?? '').replace(/'/g, "''");
  const startedAt = ts.started_at ? `'${ts.started_at}'` : 'NULL';
  const endedAt = ts.ended_at ? `'${ts.ended_at}'` : 'NULL';
  console.log(
`INSERT INTO prov_node (node_id, node_type, sub_type, label, payload, started_at, ended_at)
VALUES ('${nodeId}', '${type}', '${subType}', '${lbl}', '${json}'::jsonb, ${startedAt}, ${endedAt})
ON CONFLICT (node_id) DO UPDATE SET
  label = EXCLUDED.label, payload = EXCLUDED.payload,
  started_at = COALESCE(EXCLUDED.started_at, prov_node.started_at),
  ended_at   = COALESCE(EXCLUDED.ended_at, prov_node.ended_at);`);
}

function emitEdge(srcId, dstId, relation, payload = {}) {
  const edgeId = sha8(`${srcId}|${relation}|${dstId}`);
  const json = JSON.stringify(payload).replace(/'/g, "''");
  console.log(
`INSERT INTO prov_edge (edge_id, src_id, dst_id, relation, payload)
VALUES ('${edgeId}', '${srcId}', '${dstId}', '${relation}', '${json}'::jsonb)
ON CONFLICT (edge_id) DO NOTHING;`);
}

function sha8(s) { return createHash('sha256').update(s).digest('hex').slice(0, 16); }

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const k = argv[i].slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      out[k] = v;
    }
  }
  return out;
}

function usage() {
  console.error('Usage: session-to-prov.mjs --archive <path.jsonl> [--repo-root <path>]');
  process.exit(2);
}
