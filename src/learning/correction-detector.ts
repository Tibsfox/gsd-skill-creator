/**
 * CorrectionDetector — item-7 automatic correction detection.
 *
 * Pure transcript → correction-candidate function. It reads ONLY the nested
 * `assistant.message.content[]` tool_use blocks (the real shape Write/Edit take
 * in Claude Code transcripts) — never the synthetic top-level `type:'tool_use'`
 * entry, which does not occur for file edits and would make the detector inert.
 *
 * IMPORTANT (chokepoint): this module imports NO `fs` and NO `child_process`,
 * and its basename does not match the loader-context name pattern
 * (loader|reader|scanner|walker|store) — so it carries no LoaderContext /
 * ProcessContext obligation. Keep it that way: keep it pure.
 *
 * It NEVER attributes a skill. Auto-attribution from the transcript is both
 * near-inert and biased toward ambient guardian skills (security-hygiene loads
 * exactly when editing skill files — the highest correction-density context),
 * so `skillName` is always null and the candidate carries ranked, provenance-
 * labelled HINTS for a human to adjudicate at promotion time.
 */

import { TranscriptParser } from '../observation/transcript-parser.js';
import { FeedbackDetector } from './feedback-detector.js';
import { extractTextContent } from '../types/observation.js';
import type { TranscriptEntry, ContentBlock } from '../types/observation.js';
import type {
  CorrectionCandidateInput,
  RevertedCommitSignal,
  SkillHint,
} from '../types/learning.js';

export interface CorrectionDetectorConfig {
  /** Hard cap per session (most-recent kept). */
  maxCandidatesPerSession: number;
  /** Require a real, multi-word human turn to count as an interposition. */
  requireSubstantiveUserTurn: boolean;
  /**
   * Path segments that mark NON-deliverable files. An edit to a file under any
   * of these is dropped: they are project-management / vendored / generated
   * artifacts (handoffs, state), not skill-guided deliverables, so "corrections"
   * to them are not skill-refinement signal. Empirically the dominant benign
   * false-positive class (session-end smoke over real transcripts).
   */
  ignorePathSegments: string[];
}

const DEFAULT_CONFIG: CorrectionDetectorConfig = {
  maxCandidatesPerSession: 15,
  requireSubstantiveUserTurn: true,
  ignorePathSegments: ['.planning', 'node_modules', '.git'],
};

/** True if any path segment of `fp` matches an ignored segment (exact match). */
function isIgnoredPath(fp: string, ignored: string[]): boolean {
  if (ignored.length === 0) return false;
  const segments = fp.split(/[\\/]/);
  return ignored.some((seg) => segments.includes(seg));
}

/** Ambient context-guardian skills — retained as hints but de-ranked. */
const AMBIENT_SKILLS: ReadonlySet<string> = new Set(['security-hygiene', 'session-awareness']);

/** Non-skill wrappers that must never appear as an attribution hint. */
function isWrapper(skill: string): boolean {
  const s = skill.toLowerCase();
  return s === 'loop' || TranscriptParser.COMMAND_NAME_DENYLIST.has(s);
}

/** Bare acknowledgements that do not constitute a substantive correction turn. */
const NON_SUBSTANTIVE_RE = /^(continue|next|go|ok|okay|yes|y|yep|proceed|thanks|thank you)\b/i;

interface ProducingTurn {
  uuid: string | null;
  attributionSkill?: string;
  explicitSkills: string[];
}

export class CorrectionDetector {
  private cfg: CorrectionDetectorConfig;

  constructor(cfg?: Partial<CorrectionDetectorConfig>) {
    this.cfg = { ...DEFAULT_CONFIG, ...cfg };
  }

  /**
   * Detect correction candidates. PURE and total: never throws (the whole body
   * is guarded), so a malformed transcript degrades to zero candidates.
   *
   * `reverts` are INJECTED git-revert facts (resolved by a git-aware caller) —
   * the detector never touches git itself, preserving its pure/total contract.
   */
  detect(
    entries: TranscriptEntry[],
    sessionId: string,
    transcriptPath: string,
    reverts: RevertedCommitSignal[] = [],
  ): CorrectionCandidateInput[] {
    try {
      return this.detectInner(entries ?? [], sessionId, transcriptPath, reverts ?? []);
    } catch {
      return [];
    }
  }

  private detectInner(
    entries: TranscriptEntry[],
    sessionId: string,
    transcriptPath: string,
    reverts: RevertedCommitSignal[],
  ): CorrectionCandidateInput[] {
    const sessionSkills = new TranscriptParser().extractActiveSkills(entries);
    const feedback = new FeedbackDetector();

    const candidates: CorrectionCandidateInput[] = [];
    const lastTurn = new Map<string, ProducingTurn>(); // filePath -> producing turn
    const userSince = new Map<string, boolean>(); // filePath -> substantive user turn since last edit
    const seen = new Set<string>();
    let lastUserText = '';

    for (const entry of entries) {
      if (this.isSubstantiveUserTurn(entry)) {
        lastUserText = extractTextContent(entry.message?.content).trim();
        for (const fp of userSince.keys()) userSince.set(fp, true);
        continue;
      }

      const content = entry.message?.content;
      if (entry.type !== 'assistant' || !Array.isArray(content)) continue;

      const explicitSkillsThisTurn = explicitSkillsIn(content);

      for (const block of content) {
        if (!block || block.type !== 'tool_use') continue;
        const name = block.name;
        if (name !== 'Write' && name !== 'Edit') continue;

        const input = (block.input ?? {}) as Record<string, unknown>;
        const fp = typeof input.file_path === 'string' ? input.file_path : undefined;
        if (!fp) continue;

        if (
          name === 'Edit' &&
          userSince.get(fp) === true &&
          !isIgnoredPath(fp, this.cfg.ignorePathSegments)
        ) {
          const original = typeof input.old_string === 'string' ? input.old_string : '';
          const corrected = typeof input.new_string === 'string' ? input.new_string : '';
          const detection = feedback.detect(original, corrected, '_');
          const key = `${fp}\x00${original}\x00${corrected}`;
          if (detection && !seen.has(key)) {
            seen.add(key);
            const mistake = lastTurn.get(fp);
            candidates.push({
              kind: 'correction-candidate',
              schemaVersion: 1,
              sessionId,
              transcriptPath,
              signal: 'user-interposed-edit',
              filePath: fp,
              mistakeAssistantUuid: mistake?.uuid ?? null,
              fixerAssistantUuid: entry.uuid ?? null,
              skillName: null,
              skillHints: buildHints(mistake, sessionSkills),
              interposingUserText: lastUserText,
              original,
              corrected,
              diff: detection.analysis.changes,
              preSimilarity: detection.analysis.similarity,
            });
          }
        }

        // Record this turn as the producing turn for the file, and reset the
        // interposition flag — a subsequent edit is self-iteration until the
        // next human turn.
        lastTurn.set(fp, {
          uuid: entry.uuid ?? null,
          attributionSkill: entry.attributionSkill,
          explicitSkills: explicitSkillsThisTurn,
        });
        userSince.set(fp, false);
      }
    }

    // Reverted-commit signal: injected git facts, gated by the same
    // FeedbackDetector significance check and non-deliverable-path filter.
    for (const rev of reverts) {
      if (!rev || typeof rev.filePath !== 'string' || !rev.filePath) continue;
      if (isIgnoredPath(rev.filePath, this.cfg.ignorePathSegments)) continue;

      const original = typeof rev.original === 'string' ? rev.original : '';
      const corrected = typeof rev.corrected === 'string' ? rev.corrected : '';
      const detection = feedback.detect(original, corrected, '_');
      if (!detection) continue;

      const key = `revert ${rev.revertCommitHash} ${rev.filePath}`;
      if (seen.has(key)) continue;
      seen.add(key);

      candidates.push({
        kind: 'correction-candidate',
        schemaVersion: 1,
        sessionId,
        transcriptPath,
        signal: 'reverted-commit',
        filePath: rev.filePath,
        mistakeAssistantUuid: null,
        fixerAssistantUuid: null,
        skillName: null,
        skillHints: buildHints(undefined, sessionSkills),
        interposingUserText: rev.revertMessage ?? '',
        original,
        corrected,
        diff: detection.analysis.changes,
        preSimilarity: detection.analysis.similarity,
        revertedCommitHash: rev.revertedCommitHash,
        revertCommitHash: rev.revertCommitHash,
        ...(rev.informal ? { informal: true } : {}),
      });
    }

    if (candidates.length > this.cfg.maxCandidatesPerSession) {
      return candidates.slice(candidates.length - this.cfg.maxCandidatesPerSession);
    }
    return candidates;
  }

  private isSubstantiveUserTurn(entry: TranscriptEntry): boolean {
    if (!entry || entry.type !== 'user') return false;
    if (entry.message?.role !== 'user') return false;
    if (entry.userType !== 'external') return false;
    if (entry.isMeta) return false;
    if (entry.toolUseResult) return false; // tool_result carrier, not human input

    const text = extractTextContent(entry.message?.content).trim();
    if (!text) return false;
    if (!this.cfg.requireSubstantiveUserTurn) return true;

    if (text.startsWith('<')) return false; // command / system-reminder wrapper
    if (text.split(/\s+/).length < 2) return false;
    if (NON_SUBSTANTIVE_RE.test(text)) return false;
    return true;
  }
}

/** Collect explicit `Skill` tool_use activations in an assistant content array. */
function explicitSkillsIn(content: ContentBlock[]): string[] {
  const out: string[] = [];
  for (const block of content) {
    if (!block || block.type !== 'tool_use' || block.name !== 'Skill') continue;
    const skill = (block.input ?? {})['skill'];
    if (typeof skill === 'string' && skill.trim()) out.push(skill.trim());
  }
  return out;
}

/**
 * Build a ranked hint shortlist from the MISTAKE turn (the producer of the
 * original output), then session-active skills. Wrappers stripped; ambient
 * skills retained but ranked last. Never returns an authoritative attribution.
 */
function buildHints(
  mistake: ProducingTurn | undefined,
  sessionSkills: string[],
): SkillHint[] {
  const hints: SkillHint[] = [];
  const added = new Set<string>();

  const push = (skill: string | undefined, source: SkillHint['source']): void => {
    if (!skill) return;
    const s = skill.trim();
    if (!s || isWrapper(s) || added.has(s)) return;
    added.add(s);
    hints.push({ skill: s, source, ambient: AMBIENT_SKILLS.has(s) });
  };

  push(mistake?.attributionSkill, 'attribution-skill-mistake-turn');
  for (const s of mistake?.explicitSkills ?? []) push(s, 'explicit-skill-mistake-turn');
  for (const s of sessionSkills) push(s, 'session-active-skill');

  // Stable partition: non-ambient first, ambient last.
  return [...hints.filter((h) => !h.ambient), ...hints.filter((h) => h.ambient)];
}
