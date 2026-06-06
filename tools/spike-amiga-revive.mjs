#!/usr/bin/env -S npx tsx
/**
 * SPIKE: revive-in-place the dormant AMIGA substrate.
 *
 * Feeds a REAL skill-creator session transcript through the meta-mission
 * SkillCandidateDetector and the CE-1 attribution ledger -- the first live
 * execution path into src/amiga/meta-mission + src/amiga/ce1.
 *
 *   transcript -> SessionEventBridge -> EventEnvelope[] -> SkillCandidateDetector  (candidates)
 *                                    \-> InvocationRecorder -> AttributionLedger -> WeightingEngine  (attribution)
 *
 * Usage:
 *   npx tsx tools/spike-amiga-revive.mjs [<transcript.jsonl>] [--emit] [--patterns-dir <dir>]
 *
 *   --emit              Land the detected candidates in <dir>/suggestions.json via
 *                       SuggestionStore so they surface in `sc:suggest`. Dry-run by default.
 *   --patterns-dir <d>  Target patterns dir for --emit (default .planning/patterns).
 *
 * Exit 0 iff a candidate was detected AND CE-1 attribution was recorded.
 *
 * Imports and executes existing src/amiga code unchanged. Writes nothing unless
 * --emit is passed (then only an additive, atomic, deduped suggestions.json).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

import { SessionEventBridge } from '../src/amiga/spike/session-event-bridge.js';
import { toSuggestionCandidates } from '../src/amiga/spike/candidate-mapper.js';
import { SkillCandidateDetector } from '../src/amiga/meta-mission/skill-candidate-detector.js';
import { InvocationRecorder } from '../src/amiga/ce1/invocation-recorder.js';
import { AttributionLedger } from '../src/amiga/ce1/attribution-ledger.js';
import { WeightingEngine } from '../src/amiga/ce1/weighting-engine.js';
import { SuggestionStore } from '../src/detection/suggestion-store.js';

const PROJECTS_DIR = join(
  homedir(),
  '.claude/projects/-media-foxy-ai-GSD-dev-tools-gsd-skill-creator',
);

/** Choose the explicit transcript arg, else the largest transcript on disk. */
function pickTranscript(argPath) {
  if (argPath) return argPath;
  const files = readdirSync(PROJECTS_DIR)
    .filter((f) => f.endsWith('.jsonl'))
    .map((f) => join(PROJECTS_DIR, f));
  if (files.length === 0) throw new Error(`no transcripts found in ${PROJECTS_DIR}`);
  return files
    .map((f) => ({ f, size: statSync(f).size }))
    .sort((a, b) => b.size - a.size)[0].f;
}

/** Distil a transcript JSONL into an ordered tool-use stream. */
function readTranscript(path) {
  const lines = readFileSync(path, 'utf8').split('\n').filter(Boolean);
  const tools = [];
  let sessionId = 'unknown';
  let firstMs = null;
  let lastMs = null;

  for (const line of lines) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (typeof entry.sessionId === 'string') sessionId = entry.sessionId;
    if (typeof entry.timestamp === 'string') {
      const ms = Date.parse(entry.timestamp);
      if (!Number.isNaN(ms)) {
        if (firstMs === null) firstMs = ms;
        lastMs = ms;
      }
    }
    const content = entry.message?.content;
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block && block.type === 'tool_use' && typeof block.name === 'string') {
          tools.push({ tool: block.name, ts: entry.timestamp });
        }
      }
    }
  }

  const startMs = firstMs ?? Date.now();
  const endMs = lastMs ?? startMs;
  return { sessionId, startMs, endMs, tools };
}

function fmt(n, w = 0) {
  return String(n).padStart(w);
}

/** Parse argv into { transcript, emit, patternsDir }. */
function parseArgs(argv) {
  const args = argv.slice(2);
  let transcript;
  let emit = false;
  let patternsDir = '.planning/patterns';
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--emit') emit = true;
    else if (a === '--patterns-dir') patternsDir = args[++i];
    else if (!a.startsWith('--') && transcript === undefined) transcript = a;
  }
  return { transcript, emit, patternsDir };
}

async function main() {
  const { transcript, emit, patternsDir } = parseArgs(process.argv);
  const path = pickTranscript(transcript);
  const session = readTranscript(path);

  console.log('AMIGA REVIVE SPIKE -- real session data through the dormant substrate');
  console.log(`  transcript   : ${path.split('/').pop()}`);
  console.log(`  session id   : ${session.sessionId}`);
  console.log(`  tool-uses    : ${session.tools.length}`);

  if (session.tools.length < 2) {
    console.error('  ! transcript has < 2 tool-uses; pass a richer transcript path as arg 1');
    process.exit(1);
  }

  // Top tools, for context.
  const counts = new Map();
  for (const t of session.tools) counts.set(t.tool, (counts.get(t.tool) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  console.log(`  top tools    : ${top.map(([t, c]) => `${t}×${c}`).join('  ')}`);

  const bridge = new SessionEventBridge();
  const missionLog = bridge.toMissionLog(session, 1);
  const toolSeqLog = bridge.toToolSequenceLog(session, 1);
  const ledgerEnvelopes = missionLog.filter((e) => e.type === 'LEDGER_ENTRY');
  const missionId = String(ledgerEnvelopes[0].payload.mission_id);
  console.log(
    `  envelopes    : mission-log ${missionLog.length} ` +
      `(1 BRIEFING + ${ledgerEnvelopes.length} LEDGER_ENTRY + 1 COMPLETION), ` +
      `tool-seq ${toolSeqLog.length}`,
  );
  console.log(`  mission id   : ${missionId}`);

  // ---- Layer B1: detector over the mission/ledger log (lifecycle-aware) ----
  const detector = new SkillCandidateDetector();
  detector.enrichWithAttribution(SessionEventBridge.buildDraft(missionLog));
  const missionDetection = detector.analyze(missionLog);

  // ---- Layer B2: detector over the tool-sequence log (real workflows) ----
  const seqDetection = new SkillCandidateDetector().analyze(toolSeqLog);

  console.log('\n[Layer B] SkillCandidateDetector');
  console.log(
    `  mission-log : has_candidates=${missionDetection.has_candidates} ` +
      `candidates=${missionDetection.candidates.length} (events=${missionDetection.events_analyzed})`,
  );
  for (const c of missionDetection.candidates) {
    console.log(`     - ${c.name.padEnd(40)} ${c.detection_method.padEnd(20)} conf=${c.confidence.toFixed(2)} evidence=${c.evidence.length}`);
  }
  console.log(
    `  tool-seq    : has_candidates=${seqDetection.has_candidates} ` +
      `candidates=${seqDetection.candidates.length} (real tool-workflow cycles)`,
  );
  for (const c of [...seqDetection.candidates].sort((a, b) => b.confidence - a.confidence).slice(0, 8)) {
    console.log(`     - ${c.name.padEnd(40)} ${c.detection_method.padEnd(20)} conf=${c.confidence.toFixed(2)} evidence=${c.evidence.length}`);
  }

  // ---- Layer A: CE-1 attribution over the same ledger envelopes ----
  const ledger = new AttributionLedger();
  const recorder = new InvocationRecorder({ ledger });
  recorder.start();
  for (const envelope of missionLog) recorder.handleEvent(envelope);
  const stats = recorder.getStats();
  const weights = new WeightingEngine().calculateWeights(ledger.query({ mission_id: missionId }));

  console.log('\n[Layer A] CE-1 attribution');
  console.log(
    `  recorder    : received=${stats.totalEventsReceived} ` +
      `captured=${stats.ledgerEntriesCaptured} errors=${stats.errors}`,
  );
  console.log(`  ledger rows : ${ledger.count()}`);
  const sum = weights.weights.reduce((a, w) => a + w.weight, 0);
  console.log(`  weight vec  : ${weights.weights.length} contributors, sum=${sum.toFixed(3)}`);
  for (const w of weights.weights.slice(0, 8)) {
    console.log(
      `     - ${w.contributorId.padEnd(28)} weight=${w.weight.toFixed(3)} ` +
        `entries=${fmt(w.entryCount, 3)} ` +
        `[freq=${w.breakdown.frequency.toFixed(2)} cp=${w.breakdown.criticalPath.toFixed(2)} dd=${w.breakdown.depthDecay.toFixed(2)}]`,
    );
  }

  // ---- Sink: map AMIGA candidates onto SC suggestions and land them ----
  // Emit the meaningful candidates: structural ones from the mission log
  // (attribution_cluster / provisioning_workflow -- drop the degenerate
  // LEDGER_ENTRY->LEDGER_ENTRY sequence artifact) plus the real tool-workflow
  // cycles from the tool-sequence pass (top by confidence, >= 3 occurrences).
  const structural = missionDetection.candidates.filter((c) => c.detection_method !== 'sequence_repetition');
  const isSelfLoop = (c) => {
    const [a, b] = c.trigger_pattern.split('->');
    return a === b;
  };
  const workflows = [...seqDetection.candidates]
    .filter((c) => c.evidence.length >= 3 && !isSelfLoop(c)) // cross-tool transitions only
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);
  const emitSet = [...structural, ...workflows];
  const mapped = toSuggestionCandidates(emitSet, {
    sessionIds: [session.sessionId],
    firstSeen: session.startMs,
    lastSeen: session.endMs,
    coOccurringTools: top.map(([t]) => t),
  });

  console.log('\n[Sink] sc:suggest (SuggestionStore)');
  if (emit) {
    const store = new SuggestionStore(patternsDir);
    const added = await store.addCandidates(mapped);
    const counts = await store.getCounts();
    console.log(`  wrote       : ${join(patternsDir, 'suggestions.json')}`);
    console.log(`  candidates  : ${mapped.length} mapped, ${added.length} new (rest already present)`);
    console.log(`  store totals: pending=${counts.pending} accepted=${counts.accepted} deferred=${counts.deferred} dismissed=${counts.dismissed}`);
    console.log('  review with : skill-creator suggest   (or  /sc:suggest )');
  } else {
    console.log(`  ${mapped.length} candidates ready to emit (dry-run). Pass --emit to write ${join(patternsDir, 'suggestions.json')}.`);
    for (const c of mapped.slice(0, 6)) {
      console.log(`     - ${c.id.padEnd(36)} type=${c.type} conf=${c.confidence.toFixed(2)} occ=${c.occurrences}`);
    }
  }

  // ---- Verdict ----
  const ok = missionDetection.has_candidates && stats.ledgerEntriesCaptured > 0;
  console.log('');
  if (ok) {
    console.log('SEAM PROVEN: src/amiga/meta-mission + src/amiga/ce1 executed against real session data.');
    process.exit(0);
  } else {
    console.error('SEAM NOT PROVEN: no candidate and/or no attribution recorded.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
