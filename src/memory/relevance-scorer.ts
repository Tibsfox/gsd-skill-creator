export type MemorySection = 'hot' | 'warm' | 'cold';

export interface MemoryEntry {
  id: string;
  section: MemorySection;
  keywords: string[];
  content: string;
  tokenCount: number;
  alwaysLoad?: boolean;
}

export interface TaskContext {
  files: string[];
  topics: string[];
  commands: string[];
}

export interface RelevanceScore {
  entryId: string;
  score: number;
  reason: string;
}

const STANDING_RULE_IDS: ReadonlySet<string> = new Set([
  'standing-rules',
  'standing-rule',
]);

const SPLIT_RE = /[\/\-_.\s]+/;

export function tokenizeContext(ctx: TaskContext): Set<string> {
  const out = new Set<string>();
  const push = (s: string) => {
    for (const raw of s.split(SPLIT_RE)) {
      const t = raw.toLowerCase().trim();
      if (t.length >= 2) out.add(t);
    }
  };
  for (const f of ctx.files) push(f);
  for (const t of ctx.topics) push(t);
  for (const c of ctx.commands) push(c);
  return out;
}

function isStandingRule(entry: MemoryEntry): boolean {
  if (entry.alwaysLoad) return true;
  const id = entry.id.toLowerCase();
  if (STANDING_RULE_IDS.has(id)) return true;
  for (const kw of entry.keywords) {
    if (kw.toLowerCase() === 'standing-rule') return true;
  }
  return false;
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function scoreMemoryRelevance(
  entries: MemoryEntry[],
  ctx: TaskContext,
): RelevanceScore[] {
  const ctxWords = tokenizeContext(ctx);
  const out: RelevanceScore[] = [];

  for (const entry of entries) {
    if (isStandingRule(entry)) {
      out.push({ entryId: entry.id, score: 1.0, reason: 'always-load: standing rule' });
      continue;
    }

    let score = 0;
    const reasons: string[] = [];

    let overlap = 0;
    for (const kw of entry.keywords) {
      if (ctxWords.has(kw.toLowerCase())) overlap++;
    }
    if (overlap > 0) {
      const contrib = Math.min(overlap / 3, 1) * 0.3;
      score += contrib;
      reasons.push(`overlap=${overlap} +${contrib.toFixed(3)}`);
    }

    if (entry.section === 'hot') {
      score += 0.2;
      reasons.push('hot +0.200');
    }

    out.push({
      entryId: entry.id,
      score: clamp01(score),
      reason: reasons.length ? reasons.join(', ') : 'no signals',
    });
  }

  return out;
}
