// transcript-patterns.mjs — Pattern-matching decision-tree extraction (v1).
//
// Apply to a Claude Code session transcript to surface candidate
// `decision`, `friction`, and `evidence` events that the operator may
// not have manually captured via observe.mjs. Output is JSON suitable
// for piping into the session JSONL stream OR direct ingestion to
// prov_node via session-to-prov.mjs.
//
// This is intentionally simple and tunable: the v1 pattern set is a
// starting point; high-value patterns specific to your workflow should
// be added per-corpus. See doc 06 §5.1 for design rationale.

export const PATTERNS_V1 = {
  decision: [
    /\b(I'll use|Let me use|going with|choosing) ([A-Z][\w-]+)\b/g,
    /\b(decided to|opted for|picking) ([A-Z][\w-]+)\b/g,
    /\bbecause it (\w+)\b/g,
    /\b(?:two|three|several) (?:approaches|options|alternatives)\b/g,
  ],
  friction: [
    /\b(actually|wait|hmm|let me try) /g,
    /\b(that won't work|that doesn't|failed|errored) /g,
    /\b(unable to|cannot|can't) /g,
  ],
  evidence: [
    /\b(per the spec|according to|the docs say|see RFC \d+)/g,
    /\b(grep|searched|found in)\b/g,
    /\b(test|tests)\s+(pass|passed|passing)\b/g,
  ],
  alternative_rejected: [
    /\b(rejected|not using|avoiding|chose against) ([\w-]+)\b/g,
    /\bwould (?:be|have been) ([\w-]+) but\b/g,
  ],
};

/**
 * extractEvents(transcript: string, patterns = PATTERNS_V1)
 *   → Array<{kind, label, position, match}>
 */
export function extractEvents(transcript, patterns = PATTERNS_V1) {
  const events = [];
  for (const [kind, regexes] of Object.entries(patterns)) {
    for (const re of regexes) {
      const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      let m;
      while ((m = r.exec(transcript)) !== null) {
        events.push({
          kind,
          label: m[0].trim().slice(0, 80),
          position: m.index,
          match: m[0],
        });
      }
    }
  }
  // Sort by position; deduplicate identical (kind, label) within 200 chars
  events.sort((a, b) => a.position - b.position);
  const dedup = [];
  for (const e of events) {
    const last = dedup[dedup.length - 1];
    if (last && last.kind === e.kind && last.label === e.label && (e.position - last.position) < 200) continue;
    dedup.push(e);
  }
  return dedup;
}

/**
 * Convert extracted events to the JSONL line format observe.mjs accepts.
 */
export function toJsonlLines(events, baseTimestamp = new Date().toISOString()) {
  return events.map((e, i) => JSON.stringify({
    t: baseTimestamp,
    kind: e.kind,
    label: e.label,
    payload: { extracted_from: 'transcript-patterns-v1', position: e.position },
  }));
}

// CLI: read transcript from stdin, emit JSONL events to stdout
if (import.meta.url === `file://${process.argv[1]}`) {
  let buf = '';
  process.stdin.on('data', d => buf += d);
  process.stdin.on('end', () => {
    const events = extractEvents(buf);
    const baseT = new Date().toISOString();
    for (const line of toJsonlLines(events, baseT)) console.log(line);
  });
}
