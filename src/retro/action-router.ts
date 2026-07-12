/**
 * Self-Improvement Lifecycle -- action router.
 *
 * `generateActionItems` produces prose action items; this module routes each
 * to a concrete downstream verb so the retro engine can dispatch real work:
 *
 *   "Research Y"        → research      (research gap radar / arxiv scan)
 *   "Create skill for X"→ cartridge-distill (mint a cartridge from the topic)
 *   "Retire Z"          → skill-retire  (retire the named skill)
 *   <anything else>     → memory-lesson (Knowledge Spine 'lesson' record)
 *
 * CRITICAL: free-form prose action items route to the Knowledge Spine as
 * memory 'lesson' records, NEVER into the correction quarantine. They lack an
 * original→corrected pair and carry no skill attribution, so the quarantine's
 * significance gate would (correctly) reject them. A lesson record is the right
 * home: a durable, recallable note with no auto-attribution.
 *
 * Pure module: classification and record construction only. Executing a routed
 * verb (running the research scan, distilling the cartridge, retiring the
 * skill, storing the lesson) is the caller's job.
 *
 * @module retro/action-router
 */

import { createHash } from 'node:crypto';
import type { ActionItem } from './types.js';
import type { MemoryRecord } from '../memory/types.js';

// ============================================================================
// Verbs
// ============================================================================

/**
 * Concrete downstream action a routed item maps to.
 */
export type ActionVerb =
  | 'research' // research gap radar / arxiv scan for the target topic
  | 'cartridge-distill' // distill a cartridge/skill for the target topic
  | 'skill-retire' // retire the named skill
  | 'memory-lesson'; // persist as a Knowledge Spine 'lesson' record

/**
 * A single action item mapped to a concrete verb + extracted target.
 */
export interface RoutedAction {
  /** The original action item. */
  item: ActionItem;

  /** The concrete downstream verb. */
  verb: ActionVerb;

  /**
   * The subject the verb operates on. For the three concrete verbs this is the
   * captured topic/skill name; for `memory-lesson` it is the full description.
   */
  target: string;

  /**
   * For `memory-lesson` routes only: the lesson record to persist. Never a
   * correction-quarantine entry.
   */
  lesson?: MemoryRecord;
}

// ============================================================================
// Classification
// ============================================================================

const RESEARCH_RE = /^research\s+(.+)$/i;
const CREATE_SKILL_RE = /^create\s+skill\s+for:?\s+(.+)$/i;
const RETIRE_RE = /^retire\s+(.+)$/i;

/**
 * Namespace UUID for deriving stable lesson-memory IDs from action-item text.
 * Distinct from the MemorySink namespace so the two write paths never collide.
 */
const ACTION_LESSON_NAMESPACE = 'a5f3c2e1-0000-5000-8000-72657472616f';

const PRIORITY_CONFIDENCE: Record<ActionItem['priority'], number> = {
  high: 0.9,
  medium: 0.6,
  low: 0.3,
};

/**
 * Derive a stable, valid v5-shaped UUID from a key so re-routing the same
 * action item overwrites its lesson rather than duplicating it (idempotent).
 */
function deterministicId(key: string): string {
  const h = createHash('sha1').update(ACTION_LESSON_NAMESPACE).update(key).digest('hex');
  const variant = ((parseInt(h.slice(16, 17), 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/**
 * Build a durable 'lesson' memory record from a free-form action item.
 *
 * Pure: given the same item it yields the same record (stable id). The record
 * is scoped to the project, internal-visibility, and carries no skill
 * attribution — it is a note, not a correction.
 */
export function actionItemToLessonRecord(item: ActionItem): MemoryRecord {
  const now = new Date();
  const name = item.description.length > 80 ? `${item.description.slice(0, 77)}...` : item.description;

  const content = [
    item.description,
    '',
    `Source: ${item.source}`,
    `Priority: ${item.priority}`,
    ...(item.owner ? [`Owner: ${item.owner}`] : []),
    '',
    'Routed from a milestone retrospective action item; a recallable note, not a skill correction.',
  ].join('\n');

  return {
    id: deterministicId(item.description),
    type: 'lesson',
    name,
    description: item.description,
    content,
    lodCurrent: 300,
    tags: ['retro-action', `source:${item.source}`, `priority:${item.priority}`],
    confidence: PRIORITY_CONFIDENCE[item.priority],
    validFrom: now,
    validTo: null,
    createdAt: now,
    updatedAt: now,
    lastAccessed: now,
    accessCount: 0,
    provenance: {
      scope: 'project',
      visibility: 'internal',
      domains: [],
    },
    temporalClass: 'durable',
    relatedTo: [],
  };
}

/**
 * Route a single action item to a concrete verb.
 *
 * First matching pattern wins: research → cartridge-distill → skill-retire.
 * Anything else falls through to `memory-lesson` with a lesson record attached.
 */
export function routeActionItem(item: ActionItem): RoutedAction {
  const desc = item.description.trim();

  const research = RESEARCH_RE.exec(desc);
  if (research) {
    return { item, verb: 'research', target: research[1]!.trim() };
  }

  const create = CREATE_SKILL_RE.exec(desc);
  if (create) {
    return { item, verb: 'cartridge-distill', target: create[1]!.trim() };
  }

  const retire = RETIRE_RE.exec(desc);
  if (retire) {
    return { item, verb: 'skill-retire', target: retire[1]!.trim() };
  }

  return {
    item,
    verb: 'memory-lesson',
    target: item.description,
    lesson: actionItemToLessonRecord(item),
  };
}

/**
 * Route a batch of action items, preserving input order.
 */
export function routeActionItems(items: ActionItem[]): RoutedAction[] {
  return items.map(routeActionItem);
}
