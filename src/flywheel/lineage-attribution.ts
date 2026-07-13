/**
 * Flywheel lineage attribution — derive the skill back-links the flywheel chain
 * needs for its upstream `precedent` and `citation` source stages.
 *
 * Neither a `DecisionTrace` nor a citation `ProvenanceEntry` carries an explicit
 * `skills` field, so both joins render honest-empty until attribution is derived
 * here:
 *   - PRECEDENTS: a decision trace is attributed to its `actor` (activation
 *     traces — the actor IS the skill that fired) plus any skills listed in a
 *     `selected-skills: a, b, c` constraint (composition traces, written by
 *     {@link ../traces/activation-writer.ts}). Read via the trace reader.
 *   - CITATIONS: the provenance chain's `by-source.jsonl` links each citation to
 *     the artifacts it was cited in; when an artifact IS a skill (its
 *     `artifact_name` / path segment matches the skill) the citation is
 *     attributed to that skill.
 *
 * Both loaders are best-effort and read-only: a missing/unreadable store yields
 * `[]` and never throws. The basename is deliberately not a LoaderContext
 * trigger (`loader|reader|scanner|walker|store`); the one direct fs read is a
 * bounded read of a known provenance file.
 *
 * @module flywheel/lineage-attribution
 */

import { promises as fs } from 'node:fs';
import { join, basename } from 'node:path';
import type { DecisionTrace } from '../types/memory.js';
import { readTraces } from '../traces/reader.js';
import { normalizeSkillName, type PrecedentLike, type CitationProvenanceLike } from './lineage.js';

const SELECTED_SKILLS_PREFIX = 'selected-skills:';

/**
 * The skills a decision trace is attributed to: its `actor`, plus any skills in
 * a `selected-skills:` constraint. De-duplicated, order-preserving.
 */
export function skillsForTrace(trace: DecisionTrace): string[] {
  const skills = new Set<string>();
  if (trace.actor) skills.add(trace.actor);
  for (const c of trace.constraints) {
    const idx = c.toLowerCase().indexOf(SELECTED_SKILLS_PREFIX);
    if (idx < 0) continue;
    for (const s of c.slice(idx + SELECTED_SKILLS_PREFIX.length).split(',')) {
      const trimmed = s.trim();
      if (trimmed) skills.add(trimmed);
    }
  }
  return [...skills];
}

/** Map a decision trace to a PrecedentLike with its derived `skills` back-link. */
export function traceToPrecedent(trace: DecisionTrace): PrecedentLike {
  return {
    id: trace.id,
    intent: trace.intent,
    skills: skillsForTrace(trace),
    actor: trace.actor,
  };
}

/**
 * Load decision-trace precedents from `logPath`, each enriched with a derived
 * `skills` back-link. Returns every precedent (the assembler filters to the
 * target skill via `precedentMatchesSkill`). Best-effort: `[]` on any read error.
 */
export async function loadPrecedents(logPath: string): Promise<PrecedentLike[]> {
  let traces: DecisionTrace[];
  try {
    traces = await readTraces(logPath);
  } catch {
    return [];
  }
  return traces.map(traceToPrecedent);
}

/** One line of the provenance `by-source.jsonl` index. */
interface SourceRecordLine {
  citation_id: string;
  entries: Array<{ artifact_path?: string; artifact_name?: string }>;
}

/**
 * True when a provenance artifact IS the given (normalized) skill — an exact
 * `artifact_name` match, or a path segment / basename of `artifact_path` that
 * normalizes to the skill (e.g. `.claude/skills/<skill>/SKILL.md`).
 */
function artifactIsSkill(
  entry: { artifact_path?: string; artifact_name?: string },
  normalizedSkill: string,
): boolean {
  if (entry.artifact_name && normalizeSkillName(entry.artifact_name) === normalizedSkill) {
    return true;
  }
  if (!entry.artifact_path) return false;
  const base = basename(entry.artifact_path).replace(/\.[^.]+$/, '');
  if (normalizeSkillName(base) === normalizedSkill) return true;
  return entry.artifact_path
    .split(/[\\/]/)
    .some((seg) => seg && normalizeSkillName(seg) === normalizedSkill);
}

/**
 * Load citation provenance attributed to `skill` from the provenance chain's
 * `by-source.jsonl` under `provenanceBaseDir`. A citation is attributed to the
 * skill when one of its artifacts IS that skill. Best-effort: `[]` on any error.
 */
export async function loadCitations(
  provenanceBaseDir: string,
  skill: string,
): Promise<CitationProvenanceLike[]> {
  let content: string;
  try {
    content = await fs.readFile(join(provenanceBaseDir, 'by-source.jsonl'), 'utf-8');
  } catch {
    return [];
  }
  const normalizedSkill = normalizeSkillName(skill);
  const out: CitationProvenanceLike[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let record: SourceRecordLine;
    try {
      record = JSON.parse(trimmed) as SourceRecordLine;
    } catch {
      continue;
    }
    const match = (record.entries ?? []).find((e) => artifactIsSkill(e, normalizedSkill));
    if (!match) continue;
    out.push({
      citationId: record.citation_id,
      skills: [skill],
      ...(match.artifact_name ? { title: match.artifact_name } : {}),
      ...(match.artifact_path ? { artifactPath: match.artifact_path } : {}),
    });
  }
  return out;
}
