/**
 * TDD tests for the submit flow HTML renderer.
 *
 * Covers renderSubmitFlow() and renderSubmitFlowStyles():
 * - HTML composition of upload zone, config form, and submit button
 * - Submit button disabled by default
 * - Client-side JavaScript for two-stage submit (config write + message write)
 * - Error handling and status display
 * - CSS styles for submit flow components
 *
 * @module dashboard/submit-flow.test
 */

import { describe, it, expect } from 'vitest';
import { renderSubmitFlow, renderSubmitFlowStyles } from './submit-flow.js';

// ============================================================================
// renderSubmitFlow -- HTML composition
// ============================================================================

describe('renderSubmitFlow HTML composition', () => {
  it('returns HTML containing the upload zone (renderUploadZone output)', () => {
    const html = renderSubmitFlow();
    // Upload zone renders a div with class="upload-zone" and id="upload-zone"
    expect(html).toContain('class="upload-zone"');
    expect(html).toContain('id="upload-zone"');
  });

  it('returns HTML containing the config form (renderConfigForm output)', () => {
    const html = renderSubmitFlow();
    // Config form renders a form with id="config-form"
    expect(html).toContain('id="config-form"');
    expect(html).toContain('class="config-form"');
  });

  it('contains a submit button with id submit-milestone', () => {
    const html = renderSubmitFlow();
    expect(html).toContain('id="submit-milestone"');
    expect(html).toContain('Submit Milestone');
  });

  it('submit button has disabled attribute by default', () => {
    const html = renderSubmitFlow();
    // The button should contain disabled
    expect(html).toMatch(/<button[^>]*id="submit-milestone"[^>]*disabled/);
  });

  it('contains JavaScript that enables submit when file uploaded and milestone name filled', () => {
    const html = renderSubmitFlow();
    expect(html).toContain('<script');
    // Should reference upload zone data for file content check
    expect(html).toContain('fileContent');
    // Should reference milestone name input
    expect(html).toContain('milestone.name');
    // Should toggle disabled state
    expect(html).toContain('.disabled');
  });

  it('contains JavaScript that POSTs config to helper endpoint on submit', () => {
    const html = renderSubmitFlow();
    // Should fetch to helper URL
    expect(html).toContain('fetch');
    // Should reference config-json-output for collecting config
    expect(html).toContain('config-json-output');
    // Should send config to config subdirectory
    expect(html).toContain('milestone-config.json');
    expect(html).toContain("'config'");
  });

  it('contains JavaScript that POSTs milestone-submit message after config write', () => {
    const html = renderSubmitFlow();
    // Should create a milestone-submit message
    expect(html).toContain('milestone-submit');
    // Should send to inbox/pending
    expect(html).toContain('inbox/pending');
    // Should include config_path in payload
    expect(html).toContain('config_path');
    expect(html).toContain('config/milestone-config.json');
  });

  it('contains a status display area with class submit-status', () => {
    const html = renderSubmitFlow();
    expect(html).toContain('class="submit-status"');
    // Initially hidden
    expect(html).toMatch(/submit-status[^"]*"[^>]*display:\s*none/);
  });

  it('contains error handling that shows errors in the status area', () => {
    const html = renderSubmitFlow();
    // Should have catch block that writes to status
    expect(html).toContain('submit-status-error');
    expect(html).toContain('catch');
  });

  it('wraps everything in a container with class submit-flow', () => {
    const html = renderSubmitFlow();
    expect(html).toContain('class="submit-flow"');
    // Should start with the container
    expect(html.trim()).toMatch(/^<div class="submit-flow"/);
  });

  it('contains JavaScript referencing the helper URL passed as parameter', () => {
    const customUrl = '/custom/api/endpoint';
    const html = renderSubmitFlow(customUrl);
    expect(html).toContain(customUrl);
  });
});

// ============================================================================
// renderSubmitFlow -- default helper URL
// ============================================================================

describe('renderSubmitFlow default helper URL', () => {
  it('defaults helper URL to /api/console/message', () => {
    const html = renderSubmitFlow();
    expect(html).toContain('/api/console/message');
  });
});

// ============================================================================
// renderSubmitFlowStyles
// ============================================================================

describe('renderSubmitFlowStyles', () => {
  it('returns CSS string containing .submit-flow styles', () => {
    const css = renderSubmitFlowStyles();
    expect(typeof css).toBe('string');
    expect(css).toContain('.submit-flow');
  });

  it('CSS includes submit button styles including disabled and loading states', () => {
    const css = renderSubmitFlowStyles();
    expect(css).toContain('.submit-button');
    expect(css).toContain('.submit-button:disabled');
  });

  it('CSS includes status message styles with success and error variants', () => {
    const css = renderSubmitFlowStyles();
    expect(css).toContain('.submit-status');
    expect(css).toContain('.submit-status-success');
    expect(css).toContain('.submit-status-error');
  });

  it('uses only design system tokens for colors (no bare hex)', () => {
    const css = renderSubmitFlowStyles();
    // Strip var() fallback values -- var(--name, #hex) is acceptable
    const stripped = css.replace(/var\([^)]+\)/g, 'VAR_REPLACED');
    // After stripping var() patterns, no bare #hex should remain in color/background/border rules
    const hexInRules = stripped.match(/(?:color|background|border-\w+-color):\s*#[0-9a-fA-F]{3,8}/g);
    expect(hexInRules).toBeNull();
  });
});
