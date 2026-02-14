/**
 * TDD tests for the configuration form HTML renderer.
 *
 * Covers renderConfigForm() and renderConfigFormStyles():
 * - Form structure and id
 * - All 7 configuration sections rendered with appropriate controls
 * - Default values match DEFAULT_MILESTONE_CONFIG
 * - Custom defaults override form values
 * - Client-side JavaScript for JSON collection
 * - CSS styles for form components
 *
 * @module dashboard/config-form.test
 */

import { describe, it, expect } from 'vitest';
import { renderConfigForm, renderConfigFormStyles } from './config-form.js';
import { DEFAULT_MILESTONE_CONFIG } from '../console/milestone-config.js';

// ============================================================================
// renderConfigForm -- form structure
// ============================================================================

describe('renderConfigForm form structure', () => {
  it('returns HTML containing a form element with id config-form', () => {
    const html = renderConfigForm();
    expect(html).toContain('<form');
    expect(html).toContain('id="config-form"');
  });

  it('contains milestone name input field', () => {
    const html = renderConfigForm();
    expect(html).toContain('name="milestone.name"');
    expect(html).toMatch(/type="text"/);
  });
});

// ============================================================================
// renderConfigForm -- execution section
// ============================================================================

describe('renderConfigForm execution section', () => {
  it('contains execution mode radio buttons for hitl, supervised, yolo', () => {
    const html = renderConfigForm();
    expect(html).toContain('value="hitl"');
    expect(html).toContain('value="supervised"');
    expect(html).toContain('value="yolo"');
    // Radio buttons for mode
    expect(html).toMatch(/type="radio".*name="execution\.mode"/s);
  });
});

// ============================================================================
// renderConfigForm -- research section
// ============================================================================

describe('renderConfigForm research section', () => {
  it('contains research toggle switches', () => {
    const html = renderConfigForm();
    expect(html).toContain('name="research.enabled"');
    expect(html).toContain('name="research.web_search"');
    expect(html).toContain('name="research.skip_if_vision_sufficient"');
  });

  it('contains research time input', () => {
    const html = renderConfigForm();
    expect(html).toContain('name="research.max_research_time_minutes"');
  });
});

// ============================================================================
// renderConfigForm -- planning section
// ============================================================================

describe('renderConfigForm planning section', () => {
  it('contains review_granularity select', () => {
    const html = renderConfigForm();
    expect(html).toContain('name="planning.review_granularity"');
    expect(html).toContain('<select');
    expect(html).toContain('value="phase"');
    expect(html).toContain('value="plan"');
    expect(html).toContain('value="task"');
  });

  it('contains require_tdd checkbox', () => {
    const html = renderConfigForm();
    expect(html).toContain('name="planning.require_tdd"');
  });
});

// ============================================================================
// renderConfigForm -- verification section
// ============================================================================

describe('renderConfigForm verification section', () => {
  it('contains verification checkboxes', () => {
    const html = renderConfigForm();
    expect(html).toContain('name="verification.run_tests"');
    expect(html).toContain('name="verification.type_check"');
    expect(html).toContain('name="verification.lint"');
    expect(html).toContain('name="verification.block_on_failure"');
  });

  it('contains coverage_threshold number input', () => {
    const html = renderConfigForm();
    expect(html).toContain('name="verification.coverage_threshold"');
  });
});

// ============================================================================
// renderConfigForm -- resources section
// ============================================================================

describe('renderConfigForm resources section', () => {
  it('contains resource inputs', () => {
    const html = renderConfigForm();
    expect(html).toContain('name="resources.token_budget_pct"');
    expect(html).toContain('name="resources.max_phases"');
    expect(html).toContain('name="resources.max_wall_time_minutes"');
  });

  it('contains model_preference radio buttons', () => {
    const html = renderConfigForm();
    expect(html).toContain('value="quality"');
    expect(html).toContain('value="balanced"');
    expect(html).toContain('value="speed"');
  });
});

// ============================================================================
// renderConfigForm -- notifications section
// ============================================================================

describe('renderConfigForm notifications section', () => {
  it('contains notification checkboxes', () => {
    const html = renderConfigForm();
    expect(html).toContain('name="notifications.on_phase_complete"');
    expect(html).toContain('name="notifications.on_question"');
    expect(html).toContain('name="notifications.on_error"');
    expect(html).toContain('name="notifications.on_milestone_complete"');
  });
});

// ============================================================================
// renderConfigForm -- default values
// ============================================================================

describe('renderConfigForm default values', () => {
  it('default execution mode is supervised (checked)', () => {
    const html = renderConfigForm();
    // The supervised radio button should be checked by default
    expect(html).toMatch(/value="supervised"[^>]*checked/);
  });

  it('default coverage threshold matches DEFAULT_MILESTONE_CONFIG', () => {
    const html = renderConfigForm();
    expect(html).toContain(
      `value="${DEFAULT_MILESTONE_CONFIG.verification.coverage_threshold}"`,
    );
  });

  it('default milestone name matches DEFAULT_MILESTONE_CONFIG', () => {
    const html = renderConfigForm();
    expect(html).toContain(
      `value="${DEFAULT_MILESTONE_CONFIG.milestone.name}"`,
    );
  });
});

// ============================================================================
// renderConfigForm -- custom defaults
// ============================================================================

describe('renderConfigForm custom defaults', () => {
  it('custom defaults override form values', () => {
    const html = renderConfigForm({
      execution: {
        mode: 'yolo',
        yolo: true,
        pause_points: {
          after_planning: false,
          after_each_phase: false,
          after_verification: false,
        },
      },
    });
    // yolo should be checked, not supervised
    expect(html).toMatch(/value="yolo"[^>]*checked/);
  });

  it('custom milestone name appears in form', () => {
    const html = renderConfigForm({
      milestone: {
        name: 'Custom Milestone',
        submitted_at: '2026-02-13T00:00:00Z',
        submitted_by: 'cli',
      },
    });
    expect(html).toContain('value="Custom Milestone"');
  });
});

// ============================================================================
// renderConfigForm -- client-side JavaScript
// ============================================================================

describe('renderConfigForm client-side JavaScript', () => {
  it('form contains JavaScript that collects values into JSON', () => {
    const html = renderConfigForm();
    expect(html).toContain('<script');
    expect(html).toContain('config-json-output');
  });

  it('contains a hidden element to store collected JSON', () => {
    const html = renderConfigForm();
    expect(html).toContain('id="config-json-output"');
  });
});

// ============================================================================
// renderConfigFormStyles
// ============================================================================

describe('renderConfigFormStyles', () => {
  it('returns CSS string containing .config-form styles', () => {
    const css = renderConfigFormStyles();
    expect(typeof css).toBe('string');
    expect(css).toContain('.config-form');
  });

  it('CSS includes section grouping styles', () => {
    const css = renderConfigFormStyles();
    expect(css).toContain('.config-section');
  });
});
