import { describe, it, expect } from 'vitest';
import type { TerminalConfig } from '../integration/config/terminal-types.js';
import { renderTerminalPanel, renderTerminalStyles } from './terminal-panel.js';

const defaultConfig: TerminalConfig = {
  port: 11338,
  base_path: '/terminal',
  auth_mode: 'none',
  theme: 'dark',
  session_name: 'dev',
};

// ---------------------------------------------------------------------------
// renderTerminalPanel
// ---------------------------------------------------------------------------

describe('renderTerminalPanel', () => {
  it('returns HTML containing an iframe element', () => {
    const html = renderTerminalPanel(defaultConfig);
    expect(html).toContain('<iframe');
  });

  it('iframe src uses config port and base_path', () => {
    const html = renderTerminalPanel(defaultConfig);
    expect(html).toContain('http://localhost:11338/terminal');
  });

  it('iframe src reflects custom port', () => {
    const html = renderTerminalPanel({ ...defaultConfig, port: 8080 });
    expect(html).toContain('http://localhost:8080/terminal');
  });

  it('iframe src reflects custom base_path', () => {
    const html = renderTerminalPanel({ ...defaultConfig, base_path: '/wetty' });
    expect(html).toContain('http://localhost:11338/wetty');
  });

  it('includes fallback container element', () => {
    const html = renderTerminalPanel(defaultConfig);
    expect(html).toContain('terminal-fallback');
  });

  it('fallback contains informative message text', () => {
    const html = renderTerminalPanel(defaultConfig);
    expect(html).toMatch(/terminal service is not available/i);
  });

  it('includes JavaScript for availability check', () => {
    const html = renderTerminalPanel(defaultConfig);
    expect(html).toContain('<script');
    expect(html).toContain('fetch');
  });

  it('fallback script references correct Wetty URL', () => {
    const html = renderTerminalPanel(defaultConfig);
    const url = 'http://localhost:11338/terminal';
    // Script should contain the same URL used for the iframe
    const scriptMatch = html.match(/<script[\s\S]*?<\/script>/);
    expect(scriptMatch).toBeDefined();
    expect(scriptMatch![0]).toContain(url);
  });

  it('iframe has data-terminal-url attribute', () => {
    const html = renderTerminalPanel(defaultConfig);
    expect(html).toContain('data-terminal-url="http://localhost:11338/terminal"');
  });

  it('wraps content in terminal-panel container', () => {
    const html = renderTerminalPanel(defaultConfig);
    expect(html).toContain('<div class="terminal-panel">');
  });
});

// ---------------------------------------------------------------------------
// renderTerminalStyles
// ---------------------------------------------------------------------------

describe('renderTerminalStyles', () => {
  it('returns CSS string', () => {
    const css = renderTerminalStyles();
    expect(typeof css).toBe('string');
    expect(css.length).toBeGreaterThan(0);
  });

  it('includes terminal-panel class', () => {
    const css = renderTerminalStyles();
    expect(css).toContain('.terminal-panel');
  });

  it('uses dashboard dark theme background', () => {
    const css = renderTerminalStyles();
    expect(css).toContain('var(--bg)');
  });

  it('uses monospace font family', () => {
    const css = renderTerminalStyles();
    expect(css).toContain('var(--font-mono)');
  });

  it('iframe has no border', () => {
    const css = renderTerminalStyles();
    expect(css).toMatch(/border:\s*none/);
  });

  it('terminal-fallback has styling', () => {
    const css = renderTerminalStyles();
    expect(css).toContain('.terminal-fallback');
  });

  it('fallback uses muted text color', () => {
    const css = renderTerminalStyles();
    expect(css).toContain('var(--text-muted)');
  });
});
