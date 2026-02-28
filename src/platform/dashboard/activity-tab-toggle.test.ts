import { describe, it, expect } from 'vitest';
import {
  translateSessionEvent,
  renderActivityTabPanel,
  renderActivityTabScript,
  renderActivityTabStyles,
} from './activity-tab-toggle.js';
import type { SessionEvent } from './activity-tab-toggle.js';
import { renderActivityFeed } from './activity-feed.js';
import type { FeedEntry } from './activity-feed.js';

// ---------------------------------------------------------------------------
// Helper: create a minimal SessionEvent
// ---------------------------------------------------------------------------

function makeEvent(overrides?: Partial<SessionEvent>): SessionEvent {
  return {
    type: 'agent-start',
    entityId: 'F-1',
    entityName: 'Frontend Agent',
    domain: 'frontend',
    timestamp: '2026-02-14T10:00:00Z',
    ...overrides,
  };
}

// ===========================================================================
// translateSessionEvent
// ===========================================================================

describe('translateSessionEvent', () => {
  // -------------------------------------------------------------------------
  // Entity type mapping
  // -------------------------------------------------------------------------

  it('maps agent-start to entityType=agent', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'agent-start' }));
    expect(entry.entityType).toBe('agent');
  });

  it('maps agent-stop to entityType=agent', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'agent-stop' }));
    expect(entry.entityType).toBe('agent');
  });

  it('maps skill-activate to entityType=skill', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'skill-activate' }));
    expect(entry.entityType).toBe('skill');
  });

  it('maps skill-deactivate to entityType=skill', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'skill-deactivate' }));
    expect(entry.entityType).toBe('skill');
  });

  it('maps phase-start to entityType=phase', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'phase-start' }));
    expect(entry.entityType).toBe('phase');
  });

  it('maps phase-complete to entityType=phase', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'phase-complete' }));
    expect(entry.entityType).toBe('phase');
  });

  it('maps plan-start to entityType=plan', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'plan-start' }));
    expect(entry.entityType).toBe('plan');
  });

  it('maps plan-complete to entityType=plan', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'plan-complete' }));
    expect(entry.entityType).toBe('plan');
  });

  it('maps team-dispatch to entityType=team', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'team-dispatch' }));
    expect(entry.entityType).toBe('team');
  });

  it('maps adapter-load to entityType=adapter', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'adapter-load' }));
    expect(entry.entityType).toBe('adapter');
  });

  // -------------------------------------------------------------------------
  // Field copying
  // -------------------------------------------------------------------------

  it('copies domain from event to entry', () => {
    const entry = translateSessionEvent(makeEvent({ domain: 'testing' }));
    expect(entry.domain).toBe('testing');
  });

  it('copies entityId to identifier', () => {
    const entry = translateSessionEvent(makeEvent({ entityId: 'B-1.api' }));
    expect(entry.identifier).toBe('B-1.api');
  });

  it('copies timestamp to occurredAt', () => {
    const entry = translateSessionEvent(makeEvent({ timestamp: '2026-02-14T12:30:00Z' }));
    expect(entry.occurredAt).toBe('2026-02-14T12:30:00Z');
  });

  // -------------------------------------------------------------------------
  // Description generation
  // -------------------------------------------------------------------------

  it('agent-start: "{entityName} started"', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'agent-start', entityName: 'MyAgent' }));
    expect(entry.description).toBe('MyAgent started');
  });

  it('agent-stop: "{entityName} stopped"', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'agent-stop', entityName: 'MyAgent' }));
    expect(entry.description).toBe('MyAgent stopped');
  });

  it('skill-activate: "{entityName} activated"', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'skill-activate', entityName: 'Recipe Skill' }));
    expect(entry.description).toBe('Recipe Skill activated');
  });

  it('skill-deactivate: "{entityName} deactivated"', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'skill-deactivate', entityName: 'Recipe Skill' }));
    expect(entry.description).toBe('Recipe Skill deactivated');
  });

  it('phase-start: "Phase {entityName} started"', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'phase-start', entityName: '42 - Design' }));
    expect(entry.description).toBe('Phase 42 - Design started');
  });

  it('phase-complete: "Phase {entityName} complete"', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'phase-complete', entityName: '42 - Design' }));
    expect(entry.description).toBe('Phase 42 - Design complete');
  });

  it('plan-start: "Plan {entityName} started"', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'plan-start', entityName: 'Build UI' }));
    expect(entry.description).toBe('Plan Build UI started');
  });

  it('plan-complete: "Plan {entityName} complete"', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'plan-complete', entityName: 'Build UI' }));
    expect(entry.description).toBe('Plan Build UI complete');
  });

  it('team-dispatch: "Team {entityName} dispatched"', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'team-dispatch', entityName: 'Alpha Team' }));
    expect(entry.description).toBe('Team Alpha Team dispatched');
  });

  it('adapter-load: "Adapter {entityName} loaded"', () => {
    const entry = translateSessionEvent(makeEvent({ type: 'adapter-load', entityName: 'GitHub Adapter' }));
    expect(entry.description).toBe('Adapter GitHub Adapter loaded');
  });
});

// ===========================================================================
// renderActivityTabPanel
// ===========================================================================

describe('renderActivityTabPanel', () => {
  const sampleEntries: FeedEntry[] = [
    {
      entityType: 'agent',
      domain: 'frontend',
      identifier: 'F-1',
      description: 'Frontend Agent started',
      occurredAt: '2026-02-14T10:00:00Z',
    },
  ];
  const terminalHtml = '<div class="terminal-panel">mock terminal</div>';

  it('returns container with .activity-tab-panel class', () => {
    const html = renderActivityTabPanel(sampleEntries, terminalHtml);
    expect(html).toContain('class="activity-tab-panel"');
  });

  it('contains activity tab button with data-tab="activity"', () => {
    const html = renderActivityTabPanel(sampleEntries, terminalHtml);
    expect(html).toContain('data-tab="activity"');
  });

  it('contains terminal tab button with data-tab="terminal"', () => {
    const html = renderActivityTabPanel(sampleEntries, terminalHtml);
    expect(html).toContain('data-tab="terminal"');
  });

  it('activity tab has text "Activity"', () => {
    const html = renderActivityTabPanel(sampleEntries, terminalHtml);
    // Find the activity tab button and check its text
    const activityMatch = html.match(/data-tab="activity"[^>]*>([^<]+)/);
    expect(activityMatch).not.toBeNull();
    expect(activityMatch![1]).toContain('Activity');
  });

  it('terminal tab has text "Terminal"', () => {
    const html = renderActivityTabPanel(sampleEntries, terminalHtml);
    const terminalMatch = html.match(/data-tab="terminal"[^>]*>([^<]+)/);
    expect(terminalMatch).not.toBeNull();
    expect(terminalMatch![1]).toContain('Terminal');
  });

  it('activity tab has .at-tab-active class by default', () => {
    const html = renderActivityTabPanel(sampleEntries, terminalHtml);
    // The activity tab button should have at-tab-active
    const activityBtn = html.match(/<button[^>]*data-tab="activity"[^>]*/);
    expect(activityBtn).not.toBeNull();
    expect(activityBtn![0]).toContain('at-tab-active');
  });

  it('contains .at-content-activity div with activity feed HTML', () => {
    const html = renderActivityTabPanel(sampleEntries, terminalHtml);
    expect(html).toContain('at-content-activity');
    expect(html).toContain('activity-feed'); // from renderActivityFeed
  });

  it('contains .at-content-terminal div with terminal HTML', () => {
    const html = renderActivityTabPanel(sampleEntries, terminalHtml);
    expect(html).toContain('at-content-terminal');
    expect(html).toContain('mock terminal');
  });

  it('activity content visible by default (no display:none)', () => {
    const html = renderActivityTabPanel(sampleEntries, terminalHtml);
    // Extract the at-content-activity div opening tag
    const activityContent = html.match(/<div[^>]*at-content-activity[^>]*/);
    expect(activityContent).not.toBeNull();
    expect(activityContent![0]).not.toContain('display:none');
    expect(activityContent![0]).not.toContain('display: none');
  });

  it('terminal content hidden by default (display:none)', () => {
    const html = renderActivityTabPanel(sampleEntries, terminalHtml);
    const terminalContent = html.match(/<div[^>]*at-content-terminal[^>]*/);
    expect(terminalContent).not.toBeNull();
    expect(terminalContent![0]).toContain('display:none');
  });
});

// ===========================================================================
// renderActivityTabScript
// ===========================================================================

describe('renderActivityTabScript', () => {
  it('returns a <script> tag', () => {
    const script = renderActivityTabScript();
    expect(script).toContain('<script>');
    expect(script).toContain('</script>');
  });

  it('contains click handler for .at-tab elements', () => {
    const script = renderActivityTabScript();
    expect(script).toContain('.at-tab');
    expect(script).toContain('click');
  });

  it('toggles .at-tab-active class between tabs', () => {
    const script = renderActivityTabScript();
    expect(script).toContain('at-tab-active');
  });

  it('toggles display of .at-content-activity and .at-content-terminal', () => {
    const script = renderActivityTabScript();
    expect(script).toContain('at-content-activity');
    expect(script).toContain('at-content-terminal');
  });
});

// ===========================================================================
// renderActivityTabStyles
// ===========================================================================

describe('renderActivityTabStyles', () => {
  it('returns non-empty CSS string', () => {
    const css = renderActivityTabStyles();
    expect(css.length).toBeGreaterThan(0);
  });

  it('contains .activity-tab-panel rule', () => {
    const css = renderActivityTabStyles();
    expect(css).toContain('.activity-tab-panel');
  });

  it('contains .at-tab styling', () => {
    const css = renderActivityTabStyles();
    expect(css).toContain('.at-tab');
  });

  it('contains .at-tab-active styling with underline/highlight', () => {
    const css = renderActivityTabStyles();
    expect(css).toContain('.at-tab-active');
    expect(css).toContain('border-bottom');
  });

  it('contains .at-content-activity and .at-content-terminal rules', () => {
    const css = renderActivityTabStyles();
    expect(css).toContain('.at-content-activity');
    expect(css).toContain('.at-content-terminal');
  });

  it('uses dashboard CSS custom properties', () => {
    const css = renderActivityTabStyles();
    expect(css).toContain('var(--surface');
    expect(css).toContain('var(--border');
  });
});

// ===========================================================================
// Integration tests
// ===========================================================================

describe('integration', () => {
  it('translateSessionEvent output renders correctly in renderActivityFeed', () => {
    const events: SessionEvent[] = [
      makeEvent({ type: 'agent-start', entityId: 'F-1', entityName: 'Frontend Agent', domain: 'frontend', timestamp: '2026-02-14T10:00:00Z' }),
      makeEvent({ type: 'skill-activate', entityId: 'F-1.rcp', entityName: 'Recipe Skill', domain: 'frontend', timestamp: '2026-02-14T10:01:00Z' }),
      makeEvent({ type: 'phase-start', entityId: 'P-42', entityName: '42 - Design', domain: 'infrastructure', timestamp: '2026-02-14T10:02:00Z' }),
    ];

    const feedEntries = events.map(translateSessionEvent);
    const html = renderActivityFeed(feedEntries);

    // Verify entries rendered with correct shapes and identifiers
    expect(html).toContain('af-entry');
    expect(html).toContain('data-entity-type="agent"');
    expect(html).toContain('data-entity-type="skill"');
    expect(html).toContain('data-entity-type="phase"');
    expect(html).toContain('F-1');
    expect(html).toContain('F-1.rcp');
    expect(html).toContain('Frontend Agent started');
    expect(html).toContain('Recipe Skill activated');
    // No timestamps visible
    expect(html).not.toContain('ago');
    expect(html).not.toContain('<time');
  });

  it('renderActivityTabPanel contains both activity feed and terminal content', () => {
    const feedEntries: FeedEntry[] = [
      { entityType: 'agent', domain: 'frontend', identifier: 'F-1',
        description: 'Frontend Agent started', occurredAt: '2026-02-14T10:00:00Z' },
    ];
    const terminalHtml = '<div class="terminal-panel">mock terminal</div>';

    const html = renderActivityTabPanel(feedEntries, terminalHtml);

    expect(html).toContain('activity-tab-panel');
    expect(html).toContain('data-tab="activity"');
    expect(html).toContain('data-tab="terminal"');
    expect(html).toContain('af-entry');          // activity feed rendered
    expect(html).toContain('mock terminal');      // terminal passed through
  });
});
