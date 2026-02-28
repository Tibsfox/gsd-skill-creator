import { describe, it, expect } from 'vitest';
import {
  renderConsolePage,
  renderConsolePageStyles,
} from './console-page.js';
import type { SessionStatus } from '../console/status-writer.js';
import type { Question } from '../console/question-schema.js';

// ---------------------------------------------------------------------------
// Helper: create a minimal SessionStatus
// ---------------------------------------------------------------------------

function makeStatus(overrides?: Partial<SessionStatus>): SessionStatus {
  return {
    phase: '132-console-panel-settings',
    plan: '01',
    status: 'executing',
    progress: 0.65,
    updated_at: '2026-02-13T12:00:00Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helper: create a minimal pending Question
// ---------------------------------------------------------------------------

function makeQuestion(
  overrides: Partial<Question> & Pick<Question, 'question_id' | 'text' | 'type'>,
): Question {
  return {
    status: 'pending',
    urgency: 'medium',
    ...overrides,
  } as Question;
}

// ---------------------------------------------------------------------------
// renderConsolePage -- status section
// ---------------------------------------------------------------------------

describe('renderConsolePage -- status section', () => {
  it('returns HTML containing a status section with class "console-status"', () => {
    const html = renderConsolePage({
      status: makeStatus(),
      questions: [],
      helperUrl: '/api/console/message',
      config: null,
      activityEntries: [],
    });
    expect(html).toContain('class="console-status"');
  });

  it('renders phase name, plan name, status text, and progress percentage from SessionStatus', () => {
    const html = renderConsolePage({
      status: makeStatus({
        phase: '132-console-panel-settings',
        plan: '01',
        status: 'executing',
        progress: 0.65,
      }),
      questions: [],
      helperUrl: '/api/console/message',
      config: null,
      activityEntries: [],
    });
    expect(html).toContain('132-console-panel-settings');
    expect(html).toContain('01');
    expect(html).toContain('executing');
    expect(html).toContain('65%');
  });

  it('renders an empty state message when status is null', () => {
    const html = renderConsolePage({
      status: null,
      questions: [],
      helperUrl: '/api/console/message',
      config: null,
      activityEntries: [],
    });
    expect(html).toContain('console-status');
    expect(html).toMatch(/offline|no status/i);
  });

  it('includes a data-refresh attribute for the poller to target updates', () => {
    const html = renderConsolePage({
      status: makeStatus(),
      questions: [],
      helperUrl: '/api/console/message',
      config: null,
      activityEntries: [],
    });
    expect(html).toContain('data-refresh="console-status"');
  });
});

// ---------------------------------------------------------------------------
// renderConsolePage -- questions section
// ---------------------------------------------------------------------------

describe('renderConsolePage -- questions section', () => {
  it('contains a questions section with class "console-questions"', () => {
    const html = renderConsolePage({
      status: null,
      questions: [],
      helperUrl: '/api/console/message',
      config: null,
      activityEntries: [],
    });
    expect(html).toContain('class="console-questions"');
  });

  it('renders question cards for each pending question', () => {
    const questions: Question[] = [
      makeQuestion({ question_id: 'q-1', text: 'Continue?', type: 'binary' }),
      makeQuestion({ question_id: 'q-2', text: 'Pick one', type: 'choice', options: ['A', 'B'] }),
    ];
    const html = renderConsolePage({
      status: null,
      questions,
      helperUrl: '/api/console/message',
      config: null,
      activityEntries: [],
    });
    expect(html).toContain('data-question-id="q-1"');
    expect(html).toContain('data-question-id="q-2"');
    expect(html).toContain('Continue?');
    expect(html).toContain('Pick one');
  });

  it('shows empty state when no questions pending', () => {
    const html = renderConsolePage({
      status: null,
      questions: [],
      helperUrl: '/api/console/message',
      config: null,
      activityEntries: [],
    });
    expect(html).toMatch(/no pending questions/i);
  });

  it('includes renderQuestionResponseScript output', () => {
    const html = renderConsolePage({
      status: null,
      questions: [],
      helperUrl: '/api/console/message',
      config: null,
      activityEntries: [],
    });
    expect(html).toContain('<script>');
    expect(html).toContain('submitQuestionResponse');
  });
});

// ---------------------------------------------------------------------------
// renderConsolePage -- placeholder sections
// ---------------------------------------------------------------------------

describe('renderConsolePage -- placeholder sections', () => {
  it('contains settings section with class "console-settings"', () => {
    const html = renderConsolePage({
      status: null,
      questions: [],
      helperUrl: '/api/console/message',
      config: null,
      activityEntries: [],
    });
    expect(html).toContain('class="console-settings"');
  });

  it('contains activity section with class "console-activity"', () => {
    const html = renderConsolePage({
      status: null,
      questions: [],
      helperUrl: '/api/console/message',
      config: null,
      activityEntries: [],
    });
    expect(html).toContain('class="console-activity"');
  });
});

// ---------------------------------------------------------------------------
// renderConsolePageStyles
// ---------------------------------------------------------------------------

describe('renderConsolePageStyles', () => {
  it('returns CSS containing .console-status, .console-questions, .console-settings, .console-activity', () => {
    const css = renderConsolePageStyles();
    expect(typeof css).toBe('string');
    expect(css).toContain('.console-status');
    expect(css).toContain('.console-questions');
    expect(css).toContain('.console-settings');
    expect(css).toContain('.console-activity');
  });

  it('uses CSS custom properties consistent with dashboard theme', () => {
    const css = renderConsolePageStyles();
    expect(css).toContain('--surface');
    expect(css).toContain('--border');
    expect(css).toContain('--accent');
    expect(css).toContain('--text-primary');
    expect(css).toContain('--text-muted');
  });
});
