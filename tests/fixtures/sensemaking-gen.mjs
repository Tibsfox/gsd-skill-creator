// Deterministic generator for sensemaking-200.jsonl and sensemaking-1000.jsonl.
// Not used at test time — output is committed as fixture data. Run with:
//   node tests/fixtures/sensemaking-gen.mjs
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// A tiny deterministic PRNG (Mulberry32).
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// Skill / file / outcome vocabulary that produces recognizable clusters.
const SKILLS = [
  'gsd-plan-phase',
  'gsd-execute-phase',
  'gsd-verify-work',
  'git-commit',
  'test-generator',
  'code-review',
  'typescript-patterns',
  'beautiful-commits',
  'release-management',
  'publish-pipeline',
  'research-engine',
  'session-awareness',
  'security-hygiene',
  'vision-to-mission',
  'sc-dev-team',
];

// Clusters = (skills that tend to fire together in one session).
// The ingest test uses these to measure precision.
const CLUSTERS = [
  ['gsd-plan-phase', 'gsd-execute-phase', 'gsd-verify-work'],
  ['git-commit', 'beautiful-commits', 'code-review'],
  ['test-generator', 'typescript-patterns', 'code-review'],
  ['release-management', 'publish-pipeline', 'git-commit'],
  ['research-engine', 'vision-to-mission', 'session-awareness'],
  ['security-hygiene', 'code-review', 'git-commit'],
  ['sc-dev-team', 'gsd-plan-phase', 'gsd-execute-phase'],
];

const COMMANDS = [
  'Read',
  'Edit',
  'Write',
  'Bash',
  'Grep',
  'Glob',
];

const FILES = [
  'src/memory/grove-format.ts',
  'src/memory/triple-store.ts',
  'src/mesh/event-log.ts',
  'src/cli.ts',
  'src/types/memory.ts',
  'package.json',
  'docs/GROVE-FORMAT.md',
  '.planning/ROADMAP.md',
  'src/graph/schema.ts',
  'tests/fixtures/sensemaking-200.jsonl',
  'src/memory/service.ts',
  'src/orchestration/retrieval-loop.ts',
  'src/branches/fork.ts',
  'docs/release-notes/v1.49.560.md',
];

const OUTCOMES = ['ok', 'ok', 'ok', 'ok', 'fail', 'partial']; // biased toward ok

function genLines(nSessions, seed) {
  const rand = mulberry32(seed);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const lines = [];
  let tsBase = 1_774_000_000_000; // Apr 2026 range

  for (let s = 0; s < nSessions; s++) {
    const sessionId = `sess-${String(s).padStart(4, '0')}`;
    const cluster = pick(CLUSTERS);
    const sessionLen = 3 + Math.floor(rand() * 8); // 3..10 events
    let ts = tsBase + s * 60_000 + Math.floor(rand() * 30_000);

    for (let i = 0; i < sessionLen; i++) {
      // 80% of events draw from the session cluster, 20% draw from any skill
      const fromCluster = rand() < 0.8;
      const skill = fromCluster ? pick(cluster) : pick(SKILLS);
      const command = pick(COMMANDS);
      const file = pick(FILES);
      const outcome = pick(OUTCOMES);
      ts += 1000 + Math.floor(rand() * 4000);
      lines.push(JSON.stringify({ ts, skill, command, file, sessionId, outcome }));
    }
  }

  return lines.join('\n') + '\n';
}

const out200 = resolve(process.argv[2] ?? 'tests/fixtures/sensemaking-200.jsonl');
const out1000 = resolve(process.argv[3] ?? 'tests/fixtures/sensemaking-1000.jsonl');

writeFileSync(out200, genLines(200, 0xcafebabe));
// For CF-M1-04/06 we need ~1000 distinct entities. 1000 sessions × avg 6 events
// yields ~6000 observations but most skills/files repeat. We pad entity count
// by using a wider FILES pool and more sessions (~1000) — the fixture
// generator will produce enough entity diversity because each session also
// creates its own entity, and outcomes + commands + files all contribute.
writeFileSync(out1000, genLines(1000, 0xdeadbeef));

console.log(`wrote ${out200}`);
console.log(`wrote ${out1000}`);
