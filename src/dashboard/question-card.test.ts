import { describe, it, expect } from 'vitest';
import {
  renderQuestionCard,
  renderQuestionCardStyles,
} from './question-card.js';
import type { Question } from '../console/question-schema.js';

// ---------------------------------------------------------------------------
// Helper: create a minimal question with sensible defaults
// ---------------------------------------------------------------------------

function makeQuestion(overrides: Partial<Question> & Pick<Question, 'question_id' | 'text' | 'type'>): Question {
  return {
    status: 'pending',
    urgency: 'medium',
    ...overrides,
  } as Question;
}

// ---------------------------------------------------------------------------
// Binary question card
// ---------------------------------------------------------------------------

describe('renderQuestionCard — binary', () => {
  const q = makeQuestion({
    question_id: 'q-001',
    text: 'Continue with TDD?',
    type: 'binary',
  });

  it('wraps in a div with class question-card', () => {
    const html = renderQuestionCard(q);
    expect(html).toContain('class="question-card');
  });

  it('displays the question text', () => {
    const html = renderQuestionCard(q);
    expect(html).toContain('Continue with TDD?');
  });

  it('renders Yes and No buttons', () => {
    const html = renderQuestionCard(q);
    expect(html).toContain('>Yes</button>');
    expect(html).toContain('>No</button>');
  });

  it('includes data-question-id attribute', () => {
    const html = renderQuestionCard(q);
    expect(html).toContain('data-question-id="q-001"');
  });

  it('includes data-type attribute', () => {
    const html = renderQuestionCard(q);
    expect(html).toContain('data-type="binary"');
  });
});

// ---------------------------------------------------------------------------
// Choice question card
// ---------------------------------------------------------------------------

describe('renderQuestionCard — choice', () => {
  const q = makeQuestion({
    question_id: 'q-002',
    text: 'Pick a framework',
    type: 'choice',
    options: ['React', 'Vue', 'Svelte'],
  });

  it('renders three label elements with radio inputs', () => {
    const html = renderQuestionCard(q);
    const radioMatches = html.match(/type="radio"/g);
    expect(radioMatches).toHaveLength(3);
  });

  it('each radio shares the same name attribute', () => {
    const html = renderQuestionCard(q);
    const nameMatches = html.match(/name="q-002"/g);
    expect(nameMatches).toHaveLength(3);
  });

  it('each option text appears inside a label', () => {
    const html = renderQuestionCard(q);
    expect(html).toContain('React</label>');
    expect(html).toContain('Vue</label>');
    expect(html).toContain('Svelte</label>');
  });

  it('includes data-type choice', () => {
    const html = renderQuestionCard(q);
    expect(html).toContain('data-type="choice"');
  });
});

// ---------------------------------------------------------------------------
// Multi-select question card
// ---------------------------------------------------------------------------

describe('renderQuestionCard — multi-select', () => {
  const q = makeQuestion({
    question_id: 'q-003',
    text: 'Select features',
    type: 'multi-select',
    options: ['Auth', 'API', 'UI'],
  });

  it('renders three checkbox inputs', () => {
    const html = renderQuestionCard(q);
    const checkboxMatches = html.match(/type="checkbox"/g);
    expect(checkboxMatches).toHaveLength(3);
  });

  it('each option text appears inside a label', () => {
    const html = renderQuestionCard(q);
    expect(html).toContain('Auth</label>');
    expect(html).toContain('API</label>');
    expect(html).toContain('UI</label>');
  });

  it('includes data-type multi-select', () => {
    const html = renderQuestionCard(q);
    expect(html).toContain('data-type="multi-select"');
  });
});

// ---------------------------------------------------------------------------
// Text question card
// ---------------------------------------------------------------------------

describe('renderQuestionCard — text', () => {
  const q = makeQuestion({
    question_id: 'q-004',
    text: 'Enter the entry point',
    type: 'text',
    default_value: 'src/index.ts',
  });

  it('renders a textarea element', () => {
    const html = renderQuestionCard(q);
    expect(html).toContain('<textarea');
  });

  it('pre-fills the textarea with the default value', () => {
    const html = renderQuestionCard(q);
    expect(html).toContain('>src/index.ts</textarea>');
  });

  it('includes data-type text', () => {
    const html = renderQuestionCard(q);
    expect(html).toContain('data-type="text"');
  });
});

// ---------------------------------------------------------------------------
// Confirmation question card
// ---------------------------------------------------------------------------

describe('renderQuestionCard — confirmation', () => {
  const q = makeQuestion({
    question_id: 'q-005',
    text: 'Ready to deploy?',
    type: 'confirmation',
  });

  it('renders a single Confirm button', () => {
    const html = renderQuestionCard(q);
    expect(html).toContain('>Confirm</button>');
  });

  it('includes data-type confirmation', () => {
    const html = renderQuestionCard(q);
    expect(html).toContain('data-type="confirmation"');
  });
});

// ---------------------------------------------------------------------------
// Urgency styling
// ---------------------------------------------------------------------------

describe('renderQuestionCard — urgency', () => {
  it('applies urgency-low class for low urgency', () => {
    const q = makeQuestion({ question_id: 'u-1', text: 'Low?', type: 'binary', urgency: 'low' });
    expect(renderQuestionCard(q)).toContain('question-card-urgency-low');
  });

  it('applies urgency-high class for high urgency', () => {
    const q = makeQuestion({ question_id: 'u-2', text: 'High?', type: 'binary', urgency: 'high' });
    expect(renderQuestionCard(q)).toContain('question-card-urgency-high');
  });

  it('applies urgency-critical class for critical urgency', () => {
    const q = makeQuestion({ question_id: 'u-3', text: 'Critical?', type: 'binary', urgency: 'critical' });
    expect(renderQuestionCard(q)).toContain('question-card-urgency-critical');
  });

  it('defaults to urgency-medium class when no urgency specified', () => {
    const q = makeQuestion({ question_id: 'u-4', text: 'Default?', type: 'binary' });
    expect(renderQuestionCard(q)).toContain('question-card-urgency-medium');
  });
});

// ---------------------------------------------------------------------------
// Timeout display
// ---------------------------------------------------------------------------

describe('renderQuestionCard — timeout', () => {
  it('displays formatted timeout and fallback action', () => {
    const q = makeQuestion({
      question_id: 't-1',
      text: 'Timeout?',
      type: 'binary',
      timeout: { seconds: 300, fallback: 'use_default' },
    });
    const html = renderQuestionCard(q);
    expect(html).toContain('question-card-timeout');
    // 300s = 5m 0s or "5m"
    expect(html).toMatch(/5m/);
    expect(html).toContain('use_default');
  });

  it('formats seconds < 60 as Xs', () => {
    const q = makeQuestion({
      question_id: 't-2',
      text: 'Short?',
      type: 'binary',
      timeout: { seconds: 45, fallback: 'skip' },
    });
    const html = renderQuestionCard(q);
    expect(html).toContain('45s');
    expect(html).toContain('skip');
  });

  it('formats seconds >= 60 with minutes and remaining seconds', () => {
    const q = makeQuestion({
      question_id: 't-3',
      text: 'Mixed?',
      type: 'binary',
      timeout: { seconds: 90, fallback: 'block' },
    });
    const html = renderQuestionCard(q);
    expect(html).toMatch(/1m\s*30s/);
  });
});

// ---------------------------------------------------------------------------
// Answered status
// ---------------------------------------------------------------------------

describe('renderQuestionCard — answered status', () => {
  it('adds question-card-answered class for answered questions', () => {
    const q = makeQuestion({
      question_id: 'a-1',
      text: 'Done?',
      type: 'binary',
      status: 'answered',
    });
    const html = renderQuestionCard(q);
    expect(html).toContain('question-card-answered');
  });

  it('does not add question-card-answered class for pending questions', () => {
    const q = makeQuestion({
      question_id: 'a-2',
      text: 'Pending?',
      type: 'binary',
      status: 'pending',
    });
    const html = renderQuestionCard(q);
    expect(html).not.toContain('question-card-answered');
  });
});

// ---------------------------------------------------------------------------
// renderQuestionCardStyles
// ---------------------------------------------------------------------------

describe('renderQuestionCardStyles', () => {
  it('returns a CSS string containing .question-card rule', () => {
    const css = renderQuestionCardStyles();
    expect(typeof css).toBe('string');
    expect(css).toContain('.question-card');
  });

  it('includes urgency-level classes', () => {
    const css = renderQuestionCardStyles();
    expect(css).toContain('.question-card-urgency-low');
    expect(css).toContain('.question-card-urgency-medium');
    expect(css).toContain('.question-card-urgency-high');
    expect(css).toContain('.question-card-urgency-critical');
  });

  it('includes answered state styles', () => {
    const css = renderQuestionCardStyles();
    expect(css).toContain('.question-card-answered');
  });

  it('includes textarea styles', () => {
    const css = renderQuestionCardStyles();
    expect(css).toContain('.question-card-textarea');
  });

  it('includes submit and confirm button styles', () => {
    const css = renderQuestionCardStyles();
    expect(css).toContain('.question-card-submit');
    expect(css).toContain('.question-card-confirm');
  });

  it('uses only design system tokens for colors (no bare hex)', () => {
    const css = renderQuestionCardStyles();
    // Strip var() fallback values -- var(--name, #hex) is acceptable
    const stripped = css.replace(/var\([^)]+\)/g, 'VAR_REPLACED');
    // After stripping var() patterns, no bare #hex should remain in color/background/border rules
    const hexInRules = stripped.match(/(?:color|background|border-\w+-color):\s*#[0-9a-fA-F]{3,8}/g);
    expect(hexInRules).toBeNull();
  });
});
