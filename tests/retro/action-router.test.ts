import { describe, it, expect } from 'vitest';
import {
  routeActionItem,
  routeActionItems,
  actionItemToLessonRecord,
} from '../../src/retro/action-router.js';
import type { ActionItem } from '../../src/retro/types.js';

function item(description: string, over: Partial<ActionItem> = {}): ActionItem {
  return { description, source: 'manual', priority: 'medium', ...over };
}

describe('action-router', () => {
  it('routes "Research Y" to the research verb with the topic as target', () => {
    const r = routeActionItem(item('Research retrieval-augmented planning'));
    expect(r.verb).toBe('research');
    expect(r.target).toBe('retrieval-augmented planning');
    expect(r.lesson).toBeUndefined();
  });

  it('routes "Create skill for X" to cartridge-distill', () => {
    const r = routeActionItem(item('Create skill for: auto-format-on-save'));
    expect(r.verb).toBe('cartridge-distill');
    expect(r.target).toBe('auto-format-on-save');
  });

  it('routes "Retire Z" to skill-retire', () => {
    const r = routeActionItem(item('Retire legacy-linter-skill'));
    expect(r.verb).toBe('skill-retire');
    expect(r.target).toBe('legacy-linter-skill');
  });

  it('routes free-form prose to a memory-lesson (NOT the quarantine)', () => {
    const it0 = item('Reduce estimate for wall_time_minutes: was 100, actual 180 (1.80x)', {
      source: 'calibration',
      priority: 'high',
    });
    const r = routeActionItem(it0);

    expect(r.verb).toBe('memory-lesson');
    expect(r.target).toBe(it0.description);
    // The lesson is a plain 'lesson' record — no original→corrected pair.
    expect(r.lesson).toBeDefined();
    expect(r.lesson!.type).toBe('lesson');
    expect(r.lesson!.provenance.visibility).toBe('internal');
    expect(r.lesson!.tags).toContain('retro-action');
    expect(r.lesson!.tags).toContain('source:calibration');
    // Never carries any correction/quarantine attribution.
    expect(JSON.stringify(r.lesson)).not.toContain('quarantine');
    expect(JSON.stringify(r.lesson)).not.toContain('corrected');
  });

  it('is case-insensitive and trims the captured target', () => {
    expect(routeActionItem(item('  research   Foo Bar ')).target).toBe('Foo Bar');
    expect(routeActionItem(item('RETIRE  old-skill')).verb).toBe('skill-retire');
  });

  it('builds a stable, idempotent id for the same description', () => {
    const a = actionItemToLessonRecord(item('Adopt subagent streaming: leverage now'));
    const b = actionItemToLessonRecord(item('Adopt subagent streaming: leverage now'));
    expect(a.id).toBe(b.id);
    // v5-shaped uuid
    expect(a.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('maps priority to confidence', () => {
    expect(actionItemToLessonRecord(item('note', { priority: 'high' })).confidence).toBe(0.9);
    expect(actionItemToLessonRecord(item('note', { priority: 'medium' })).confidence).toBe(0.6);
    expect(actionItemToLessonRecord(item('note', { priority: 'low' })).confidence).toBe(0.3);
  });

  it('routes a batch preserving order', () => {
    const routed = routeActionItems([
      item('Research a'),
      item('Create skill for: b'),
      item('Retire c'),
      item('some prose'),
    ]);
    expect(routed.map((r) => r.verb)).toEqual([
      'research',
      'cartridge-distill',
      'skill-retire',
      'memory-lesson',
    ]);
  });
});
