import { describe, it, expect } from 'vitest';
import {
  renderConsoleSettings,
  renderConsoleSettingsStyles,
  renderSettingsScript,
} from './console-settings.js';
import {
  DEFAULT_MILESTONE_CONFIG,
} from '../console/milestone-config.js';
import type { MilestoneConfig } from '../console/milestone-config.js';

// ---------------------------------------------------------------------------
// Helper: create a test config with overrides
// ---------------------------------------------------------------------------

function makeConfig(overrides?: Partial<MilestoneConfig>): MilestoneConfig {
  return {
    ...DEFAULT_MILESTONE_CONFIG,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// renderConsoleSettings
// ---------------------------------------------------------------------------

describe('renderConsoleSettings', () => {
  it('returns HTML containing a .console-settings-panel container', () => {
    const html = renderConsoleSettings(makeConfig());
    expect(html).toContain('class="console-settings-panel"');
  });

  it('renders hot settings as enabled toggles with no disabled attribute', () => {
    const html = renderConsoleSettings(makeConfig());
    // execution.pause_points.after_planning is a hot boolean toggle
    const afterPlanningMatch = html.match(
      /data-setting="execution\.pause_points\.after_planning"[^>]*/,
    );
    expect(afterPlanningMatch).not.toBeNull();
    expect(afterPlanningMatch![0]).not.toContain('disabled');
  });

  it('gives each hot toggle a data-setting attribute with dotted path', () => {
    const html = renderConsoleSettings(makeConfig());
    expect(html).toContain('data-setting="execution.pause_points.after_planning"');
    expect(html).toContain('data-setting="execution.pause_points.after_each_phase"');
    expect(html).toContain('data-setting="execution.pause_points.after_verification"');
    expect(html).toContain('data-setting="research.enabled"');
    expect(html).toContain('data-setting="research.web_search"');
    expect(html).toContain('data-setting="planning.auto_approve"');
    expect(html).toContain('data-setting="planning.require_tdd"');
    expect(html).toContain('data-setting="verification.run_tests"');
    expect(html).toContain('data-setting="verification.type_check"');
    expect(html).toContain('data-setting="verification.lint"');
    expect(html).toContain('data-setting="verification.block_on_failure"');
  });

  it('gives each hot toggle a data-hot="true" attribute', () => {
    const html = renderConsoleSettings(makeConfig());
    // All hot toggles should have data-hot="true"
    const hotMatches = html.match(/data-hot="true"/g);
    // At least 14 hot settings (mode select + pause toggles + research + planning + verification + notifications)
    expect(hotMatches).not.toBeNull();
    expect(hotMatches!.length).toBeGreaterThanOrEqual(14);
  });

  it('renders non-hot settings with disabled attribute', () => {
    const html = renderConsoleSettings(makeConfig());
    // resources.model_preference is a non-hot select
    const modelPrefMatch = html.match(
      /data-setting="resources\.model_preference"[^>]*/,
    );
    expect(modelPrefMatch).not.toBeNull();
    expect(modelPrefMatch![0]).toContain('disabled');
  });

  it('adds tooltip on non-hot settings containing "requires session restart"', () => {
    const html = renderConsoleSettings(makeConfig());
    // Non-hot settings should have a title with restart message
    const modelPrefMatch = html.match(
      /data-setting="resources\.model_preference"[^>]*/,
    );
    expect(modelPrefMatch).not.toBeNull();
    expect(modelPrefMatch![0].toLowerCase()).toContain('title=');
    // Check the title content
    expect(html).toContain('Requires session restart');
  });

  it('groups settings by section with section headings', () => {
    const html = renderConsoleSettings(makeConfig());
    expect(html).toContain('setting-group');
    // Check for section headings
    expect(html).toMatch(/<h4[^>]*>.*Execution.*<\/h4>/i);
    expect(html).toMatch(/<h4[^>]*>.*Research.*<\/h4>/i);
    expect(html).toMatch(/<h4[^>]*>.*Planning.*<\/h4>/i);
    expect(html).toMatch(/<h4[^>]*>.*Verification.*<\/h4>/i);
    expect(html).toMatch(/<h4[^>]*>.*Resources.*<\/h4>/i);
    expect(html).toMatch(/<h4[^>]*>.*Notifications.*<\/h4>/i);
  });

  it('renders execution.mode select with 3 options (hitl, supervised, yolo)', () => {
    const html = renderConsoleSettings(makeConfig());
    const modeMatch = html.match(
      /<select[^>]*data-setting="execution\.mode"[^>]*>[\s\S]*?<\/select>/,
    );
    expect(modeMatch).not.toBeNull();
    const selectHtml = modeMatch![0];
    expect(selectHtml).toContain('value="hitl"');
    expect(selectHtml).toContain('value="supervised"');
    expect(selectHtml).toContain('value="yolo"');
  });

  it('reflects current config values in rendered controls', () => {
    const config = makeConfig({
      execution: {
        mode: 'yolo',
        yolo: true,
        pause_points: {
          after_planning: false,
          after_each_phase: false,
          after_verification: true,
        },
      },
      planning: {
        auto_approve: true,
        review_granularity: 'phase',
        max_plans_per_phase: 10,
        require_tdd: false,
      },
    });
    const html = renderConsoleSettings(config);

    // mode select should have yolo selected
    expect(html).toMatch(/value="yolo"[^>]*selected/);

    // after_planning should NOT be checked
    const afterPlanning = html.match(
      /data-setting="execution\.pause_points\.after_planning"[^>]*/,
    );
    expect(afterPlanning).not.toBeNull();
    expect(afterPlanning![0]).not.toContain('checked');

    // require_tdd should NOT be checked
    const tdd = html.match(
      /data-setting="planning\.require_tdd"[^>]*/,
    );
    expect(tdd).not.toBeNull();
    expect(tdd![0]).not.toContain('checked');
  });

  it('renders notification toggles as hot settings', () => {
    const html = renderConsoleSettings(makeConfig());
    expect(html).toContain('data-setting="notifications.on_phase_complete"');
    expect(html).toContain('data-setting="notifications.on_question"');
    expect(html).toContain('data-setting="notifications.on_error"');
    expect(html).toContain('data-setting="notifications.on_milestone_complete"');
    // All notification settings should be hot
    const notifMatches = html.match(/data-setting="notifications\.[^"]*"[^>]*data-hot="true"/g);
    expect(notifMatches).not.toBeNull();
    expect(notifMatches!.length).toBe(4);
  });

  it('renders non-hot number inputs for resource settings', () => {
    const html = renderConsoleSettings(makeConfig());
    // token_budget_pct is a non-hot number -- match the full input tag
    const tokenBudget = html.match(
      /<input[^>]*data-setting="resources\.token_budget_pct"[^>]*/,
    );
    expect(tokenBudget).not.toBeNull();
    expect(tokenBudget![0]).toContain('type="number"');
    expect(tokenBudget![0]).toContain('disabled');
  });
});

// ---------------------------------------------------------------------------
// renderConsoleSettingsStyles
// ---------------------------------------------------------------------------

describe('renderConsoleSettingsStyles', () => {
  it('returns CSS containing .console-settings-panel, .setting-toggle, .setting-group selectors', () => {
    const css = renderConsoleSettingsStyles();
    expect(css).toContain('.console-settings-panel');
    expect(css).toContain('.setting-toggle');
    expect(css).toContain('.setting-group');
  });

  it('contains .setting-pending class for the pending-sync indicator styling', () => {
    const css = renderConsoleSettingsStyles();
    expect(css).toContain('.setting-pending');
  });

  it('contains .setting-disabled class with reduced opacity', () => {
    const css = renderConsoleSettingsStyles();
    expect(css).toContain('.setting-disabled');
    expect(css).toContain('opacity');
  });
});

// ---------------------------------------------------------------------------
// renderSettingsScript
// ---------------------------------------------------------------------------

describe('renderSettingsScript', () => {
  it('returns a script tag string', () => {
    const script = renderSettingsScript('/api/console/message');
    expect(script).toContain('<script>');
    expect(script).toContain('</script>');
  });

  it('contains event listeners for toggle changes', () => {
    const script = renderSettingsScript('/api/console/message');
    expect(script).toContain('change');
    expect(script).toContain('addEventListener');
  });

  it('constructs a config-update message envelope with source: dashboard and hot: true', () => {
    const script = renderSettingsScript('/api/console/message');
    expect(script).toContain('config-update');
    expect(script).toContain("source");
    expect(script).toContain("dashboard");
    expect(script).toContain('hot');
  });

  it('POSTs to the helperUrl via fetch', () => {
    const script = renderSettingsScript('/api/console/message');
    expect(script).toContain('fetch');
    expect(script).toContain('/api/console/message');
  });

  it('adds .setting-pending class to the changed control after toggling', () => {
    const script = renderSettingsScript('/api/console/message');
    expect(script).toContain('setting-pending');
  });
});
