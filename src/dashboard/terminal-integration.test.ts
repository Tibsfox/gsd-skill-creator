/**
 * Tests for terminal integration wiring.
 *
 * Verifies that buildTerminalHtml reads terminal config via the integration
 * config reader and delegates to the terminal panel renderer, and that
 * getTerminalConfig extracts just the terminal section from the full config.
 *
 * @module dashboard/terminal-integration.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IntegrationConfig } from '../integration/config/types.js';
import type { TerminalConfig } from '../integration/config/terminal-types.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../integration/config/reader.js', () => ({
  readIntegrationConfig: vi.fn(),
}));

vi.mock('./terminal-panel.js', () => ({
  renderTerminalPanel: vi.fn(() => '<div class="terminal-panel">mock-panel</div>'),
  renderTerminalStyles: vi.fn(() => '.terminal-panel { }'),
}));

import { readIntegrationConfig } from '../integration/config/reader.js';
import { renderTerminalPanel, renderTerminalStyles } from './terminal-panel.js';
import { buildTerminalHtml, getTerminalConfig } from './terminal-integration.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const defaultTerminal: TerminalConfig = {
  port: 11338,
  base_path: '/terminal',
  auth_mode: 'none',
  theme: 'dark',
  session_name: 'dev',
};

const fullConfig: IntegrationConfig = {
  integration: {
    auto_load_skills: true,
    observe_sessions: true,
    phase_transition_hooks: true,
    suggest_on_session_start: true,
    install_git_hooks: true,
    wrapper_commands: true,
  },
  token_budget: { max_percent: 5, warn_at_percent: 4 },
  observation: { retention_days: 90, max_entries: 1000, capture_corrections: true },
  suggestions: { min_occurrences: 3, cooldown_days: 7, auto_dismiss_after_days: 30 },
  terminal: defaultTerminal,
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const mockedReadConfig = vi.mocked(readIntegrationConfig);
const mockedRenderPanel = vi.mocked(renderTerminalPanel);
const mockedRenderStyles = vi.mocked(renderTerminalStyles);

beforeEach(() => {
  vi.clearAllMocks();
  mockedReadConfig.mockResolvedValue(fullConfig);
});

// ---------------------------------------------------------------------------
// getTerminalConfig
// ---------------------------------------------------------------------------

describe('getTerminalConfig', () => {
  it('returns terminal config from integration config', async () => {
    const result = await getTerminalConfig();
    expect(result).toEqual(defaultTerminal);
  });

  it('uses default config path when not specified', async () => {
    await getTerminalConfig();
    expect(mockedReadConfig).toHaveBeenCalledWith(undefined);
  });

  it('passes custom config path through', async () => {
    await getTerminalConfig('/custom/path');
    expect(mockedReadConfig).toHaveBeenCalledWith('/custom/path');
  });

  it('returns default terminal config when file missing', async () => {
    const defaultsConfig: IntegrationConfig = {
      ...fullConfig,
      terminal: { port: 11338, base_path: '/terminal', auth_mode: 'none', theme: 'dark', session_name: 'dev' },
    };
    mockedReadConfig.mockResolvedValue(defaultsConfig);

    const result = await getTerminalConfig();
    expect(result.port).toBe(11338);
    expect(result.base_path).toBe('/terminal');
  });
});

// ---------------------------------------------------------------------------
// buildTerminalHtml
// ---------------------------------------------------------------------------

describe('buildTerminalHtml', () => {
  it('calls renderTerminalPanel with terminal config', async () => {
    await buildTerminalHtml();
    expect(mockedRenderPanel).toHaveBeenCalledWith(defaultTerminal);
  });

  it('calls renderTerminalStyles', async () => {
    await buildTerminalHtml();
    expect(mockedRenderStyles).toHaveBeenCalled();
  });

  it('returns object with html and styles properties', async () => {
    const result = await buildTerminalHtml();
    expect(result).toHaveProperty('html');
    expect(result).toHaveProperty('styles');
  });

  it('html property contains panel output', async () => {
    const result = await buildTerminalHtml();
    expect(result.html).toContain('mock-panel');
  });

  it('styles property contains styles output', async () => {
    const result = await buildTerminalHtml();
    expect(result.styles).toContain('.terminal-panel');
  });

  it('uses custom config path when provided', async () => {
    await buildTerminalHtml('/custom/path');
    expect(mockedReadConfig).toHaveBeenCalledWith('/custom/path');
  });
});

// ---------------------------------------------------------------------------
// TerminalHtmlResult structural checks
// ---------------------------------------------------------------------------

describe('TerminalHtmlResult structure', () => {
  it('result has html as string', async () => {
    const result = await buildTerminalHtml();
    expect(typeof result.html).toBe('string');
  });

  it('result has styles as string', async () => {
    const result = await buildTerminalHtml();
    expect(typeof result.styles).toBe('string');
  });
});
