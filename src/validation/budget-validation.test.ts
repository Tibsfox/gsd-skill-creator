import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  BudgetValidator,
  BudgetSeverity,
  BudgetCheckResult,
  SkillBudgetInfo,
  CumulativeBudgetResult,
  formatProgressBar,
  formatBudgetDisplay,
  generateSuggestions,
} from './budget-validation.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testDir = join(__dirname, '..', '..', 'test-fixtures', 'budget-validation');

// ============================================================================
// BudgetValidator.load() tests
// ============================================================================

describe('BudgetValidator.load()', () => {
  const originalEnv = process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET;

  afterEach(() => {
    // Restore original env
    if (originalEnv === undefined) {
      delete process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET;
    } else {
      process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET = originalEnv;
    }
  });

  it('should load with default 15000 budget when env var not set', () => {
    delete process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET;
    const validator = BudgetValidator.load();
    expect(validator.getBudget()).toBe(15000);
  });

  it('should respect SLASH_COMMAND_TOOL_CHAR_BUDGET env var', () => {
    process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET = '20000';
    const validator = BudgetValidator.load();
    expect(validator.getBudget()).toBe(20000);
  });

  it('should use default for invalid env var value (non-numeric)', () => {
    process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET = 'invalid';
    const validator = BudgetValidator.load();
    expect(validator.getBudget()).toBe(15000);
  });

  it('should use default for invalid env var value (zero)', () => {
    process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET = '0';
    const validator = BudgetValidator.load();
    expect(validator.getBudget()).toBe(15000);
  });

  it('should use default for invalid env var value (negative)', () => {
    process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET = '-1000';
    const validator = BudgetValidator.load();
    expect(validator.getBudget()).toBe(15000);
  });

  it('should use default for empty env var', () => {
    process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET = '';
    const validator = BudgetValidator.load();
    expect(validator.getBudget()).toBe(15000);
  });
});

// ============================================================================
// getSeverity() tests
// ============================================================================

describe('BudgetValidator.getSeverity()', () => {
  let validator: BudgetValidator;

  beforeAll(() => {
    validator = BudgetValidator.load();
  });

  it('should return "ok" for usage < 60%', () => {
    expect(validator.getSeverity(0)).toBe('ok');
    expect(validator.getSeverity(30)).toBe('ok');
    expect(validator.getSeverity(59)).toBe('ok');
    expect(validator.getSeverity(59.9)).toBe('ok');
  });

  it('should return "info" for usage 60-79%', () => {
    expect(validator.getSeverity(60)).toBe('info');
    expect(validator.getSeverity(70)).toBe('info');
    expect(validator.getSeverity(79)).toBe('info');
    expect(validator.getSeverity(79.9)).toBe('info');
  });

  it('should return "warning" for usage 80-99%', () => {
    expect(validator.getSeverity(80)).toBe('warning');
    expect(validator.getSeverity(90)).toBe('warning');
    expect(validator.getSeverity(99)).toBe('warning');
    expect(validator.getSeverity(99.9)).toBe('warning');
  });

  it('should return "error" for usage >= 100%', () => {
    expect(validator.getSeverity(100)).toBe('error');
    expect(validator.getSeverity(110)).toBe('error');
    expect(validator.getSeverity(150)).toBe('error');
  });

  it('should handle edge case exactly at 60%', () => {
    expect(validator.getSeverity(60)).toBe('info');
  });

  it('should handle edge case exactly at 80%', () => {
    expect(validator.getSeverity(80)).toBe('warning');
  });

  it('should handle edge case exactly at 100%', () => {
    expect(validator.getSeverity(100)).toBe('error');
  });
});

// ============================================================================
// checkSingleSkill() tests
// ============================================================================

describe('BudgetValidator.checkSingleSkill()', () => {
  let validator: BudgetValidator;
  const budget = 15000;

  beforeAll(() => {
    delete process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET;
    validator = BudgetValidator.load();
  });

  it('should return ok severity for small skill', () => {
    const result = validator.checkSingleSkill(5000); // 33%
    expect(result.valid).toBe(true);
    expect(result.severity).toBe('ok');
    expect(result.charCount).toBe(5000);
    expect(result.budget).toBe(budget);
    expect(result.message).toBeUndefined();
    expect(result.suggestions).toBeUndefined();
  });

  it('should return info severity for medium skill', () => {
    const result = validator.checkSingleSkill(10000); // 67%
    expect(result.valid).toBe(true);
    expect(result.severity).toBe('info');
    expect(result.message).toContain('67%');
  });

  it('should return warning severity for large skill', () => {
    const result = validator.checkSingleSkill(13000); // 87%
    expect(result.valid).toBe(true);
    expect(result.severity).toBe('warning');
    expect(result.message).toContain('Approaching');
    expect(result.message).toContain('87%');
  });

  it('should return error severity for over-budget skill', () => {
    const result = validator.checkSingleSkill(16000); // 107%
    expect(result.valid).toBe(false);
    expect(result.severity).toBe('error');
    expect(result.message).toContain('Exceeds');
    expect(result.message).toContain('1,000'); // excess
  });

  it('should include suggestions for error severity', () => {
    const result = validator.checkSingleSkill(16000);
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions!.length).toBeGreaterThan(0);
    expect(result.suggestions!.some(s => s.includes('--force'))).toBe(true);
  });

  it('should not include suggestions for warning severity', () => {
    const result = validator.checkSingleSkill(13000);
    expect(result.suggestions).toBeUndefined();
  });

  it('should include warning message for warning severity', () => {
    const result = validator.checkSingleSkill(12000);
    expect(result.message).toContain('Approaching');
  });

  it('should calculate usage percent correctly', () => {
    const result = validator.checkSingleSkill(7500); // 50%
    expect(result.usagePercent).toBe(50);
  });

  it('should handle zero chars', () => {
    const result = validator.checkSingleSkill(0);
    expect(result.valid).toBe(true);
    expect(result.severity).toBe('ok');
    expect(result.usagePercent).toBe(0);
  });

  it('should handle exactly at budget', () => {
    const result = validator.checkSingleSkill(15000);
    expect(result.valid).toBe(false);
    expect(result.severity).toBe('error');
    expect(result.usagePercent).toBe(100);
  });
});

// ============================================================================
// countSkillChars() tests (with temp files)
// ============================================================================

describe('BudgetValidator.countSkillChars()', () => {
  let validator: BudgetValidator;
  const skillDir = join(testDir, 'count-skill');
  const skillPath = join(skillDir, 'SKILL.md');

  beforeAll(async () => {
    validator = BudgetValidator.load();
    await mkdir(skillDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  afterEach(async () => {
    try {
      await rm(skillPath, { force: true });
    } catch {
      // File may not exist
    }
  });

  it('should count frontmatter + body correctly', async () => {
    const content = `---
name: test-skill
description: A test skill description
---
This is the body content.`;
    await writeFile(skillPath, content, 'utf-8');

    const result = await validator.countSkillChars(skillPath);

    expect(result.name).toBe('test-skill');
    expect(result.descriptionChars).toBe('A test skill description'.length);
    expect(result.bodyChars).toBe('This is the body content.'.length);
    expect(result.totalChars).toBe(content.length);
    expect(result.path).toBe(skillPath);
  });

  it('should handle empty body', async () => {
    const content = `---
name: empty-body
description: Has no body
---
`;
    await writeFile(skillPath, content, 'utf-8');

    const result = await validator.countSkillChars(skillPath);

    expect(result.name).toBe('empty-body');
    expect(result.bodyChars).toBe(0);
    expect(result.totalChars).toBe(content.length);
  });

  it('should handle minimal frontmatter', async () => {
    const content = `---
name: minimal
description: Min
---
Body here`;
    await writeFile(skillPath, content, 'utf-8');

    const result = await validator.countSkillChars(skillPath);

    expect(result.name).toBe('minimal');
    expect(result.descriptionChars).toBe(3); // "Min"
    expect(result.bodyChars).toBe('Body here'.length);
  });

  it('should have total equal to file content length', async () => {
    const content = `---
name: total-check
description: Testing total calculation
metadata:
  extensions:
    gsd-skill-creator:
      enabled: true
---
This is the body with some content.
Multiple lines too.`;
    await writeFile(skillPath, content, 'utf-8');

    const result = await validator.countSkillChars(skillPath);

    expect(result.totalChars).toBe(content.length);
  });

  it('should handle missing description gracefully', async () => {
    const content = `---
name: no-desc
---
Just body`;
    await writeFile(skillPath, content, 'utf-8');

    const result = await validator.countSkillChars(skillPath);

    expect(result.name).toBe('no-desc');
    expect(result.descriptionChars).toBe(0);
  });

  it('should handle missing name gracefully', async () => {
    const content = `---
description: No name field
---
Body`;
    await writeFile(skillPath, content, 'utf-8');

    const result = await validator.countSkillChars(skillPath);

    expect(result.name).toBe('');
    expect(result.descriptionChars).toBe('No name field'.length);
  });
});

// ============================================================================
// checkCumulative() tests (with temp directory)
// ============================================================================

describe('BudgetValidator.checkCumulative()', () => {
  let validator: BudgetValidator;
  const cumulativeDir = join(testDir, 'cumulative');

  beforeAll(async () => {
    validator = BudgetValidator.load();
  });

  beforeEach(async () => {
    await mkdir(cumulativeDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(cumulativeDir, { recursive: true, force: true });
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should return zero totals for empty directory', async () => {
    const result = await validator.checkCumulative(cumulativeDir);

    expect(result.totalChars).toBe(0);
    expect(result.skills).toHaveLength(0);
    expect(result.severity).toBe('ok');
    expect(result.hiddenCount).toBe(0);
  });

  it('should count single skill correctly', async () => {
    const skillDir = join(cumulativeDir, 'single-skill');
    await mkdir(skillDir, { recursive: true });
    const content = `---
name: single-skill
description: Single skill
---
Content`;
    await writeFile(join(skillDir, 'SKILL.md'), content, 'utf-8');

    const result = await validator.checkCumulative(cumulativeDir);

    expect(result.skills).toHaveLength(1);
    expect(result.totalChars).toBe(content.length);
    expect(result.skills[0].name).toBe('single-skill');
  });

  it('should sum multiple skills correctly', async () => {
    const skill1Content = `---
name: skill-one
description: First skill
---
First body`;
    const skill2Content = `---
name: skill-two
description: Second skill
---
Second body`;

    await mkdir(join(cumulativeDir, 'skill-one'), { recursive: true });
    await mkdir(join(cumulativeDir, 'skill-two'), { recursive: true });
    await writeFile(join(cumulativeDir, 'skill-one', 'SKILL.md'), skill1Content, 'utf-8');
    await writeFile(join(cumulativeDir, 'skill-two', 'SKILL.md'), skill2Content, 'utf-8');

    const result = await validator.checkCumulative(cumulativeDir);

    expect(result.skills).toHaveLength(2);
    expect(result.totalChars).toBe(skill1Content.length + skill2Content.length);
  });

  it('should sort skills by size descending', async () => {
    const smallContent = `---
name: small
description: S
---
A`;
    const largeContent = `---
name: large
description: This is a much longer description for the larger skill
---
This has a lot more body content that makes it significantly larger than the small skill.`;

    await mkdir(join(cumulativeDir, 'small'), { recursive: true });
    await mkdir(join(cumulativeDir, 'large'), { recursive: true });
    // Write small first to ensure sorting is by size, not order
    await writeFile(join(cumulativeDir, 'small', 'SKILL.md'), smallContent, 'utf-8');
    await writeFile(join(cumulativeDir, 'large', 'SKILL.md'), largeContent, 'utf-8');

    const result = await validator.checkCumulative(cumulativeDir);

    expect(result.skills).toHaveLength(2);
    expect(result.skills[0].name).toBe('large');
    expect(result.skills[1].name).toBe('small');
  });

  it('should calculate hiddenCount when over budget', async () => {
    // Create multiple skills that together exceed 15500 chars
    const largeBody = 'x'.repeat(6000);

    for (let i = 1; i <= 4; i++) {
      const skillName = `skill-${i}`;
      const content = `---
name: ${skillName}
description: Skill ${i}
---
${largeBody}`;
      await mkdir(join(cumulativeDir, skillName), { recursive: true });
      await writeFile(join(cumulativeDir, skillName, 'SKILL.md'), content, 'utf-8');
    }

    const result = await validator.checkCumulative(cumulativeDir);

    expect(result.skills).toHaveLength(4);
    expect(result.totalChars).toBeGreaterThan(15500);
    expect(result.severity).toBe('error');
    expect(result.hiddenCount).toBeGreaterThan(0);
  });

  it('should skip directories without SKILL.md', async () => {
    await mkdir(join(cumulativeDir, 'valid-skill'), { recursive: true });
    await mkdir(join(cumulativeDir, 'empty-dir'), { recursive: true });
    await writeFile(join(cumulativeDir, 'valid-skill', 'SKILL.md'), `---
name: valid
description: Valid
---
Body`, 'utf-8');
    await writeFile(join(cumulativeDir, 'empty-dir', 'other.txt'), 'not a skill', 'utf-8');

    const result = await validator.checkCumulative(cumulativeDir);

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].name).toBe('valid');
  });

  it('should skip hidden directories', async () => {
    await mkdir(join(cumulativeDir, 'visible-skill'), { recursive: true });
    await mkdir(join(cumulativeDir, '.hidden-skill'), { recursive: true });
    await writeFile(join(cumulativeDir, 'visible-skill', 'SKILL.md'), `---
name: visible
description: Visible
---
Body`, 'utf-8');
    await writeFile(join(cumulativeDir, '.hidden-skill', 'SKILL.md'), `---
name: hidden
description: Hidden
---
Body`, 'utf-8');

    const result = await validator.checkCumulative(cumulativeDir);

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].name).toBe('visible');
  });

  it('should handle non-existent directory gracefully', async () => {
    const result = await validator.checkCumulative('/nonexistent/path');

    expect(result.totalChars).toBe(0);
    expect(result.skills).toHaveLength(0);
    expect(result.severity).toBe('ok');
  });
});

// ============================================================================
// formatProgressBar() tests
// ============================================================================

describe('formatProgressBar()', () => {
  it('should show empty bar at 0%', () => {
    const bar = formatProgressBar(0, 100);
    expect(bar).toBe('[....................]');
  });

  it('should show half-filled bar at 50%', () => {
    const bar = formatProgressBar(50, 100);
    expect(bar).toBe('[##########..........]');
  });

  it('should show full bar at 100%', () => {
    const bar = formatProgressBar(100, 100);
    expect(bar).toBe('[####################]');
  });

  it('should respect custom width parameter', () => {
    const bar = formatProgressBar(50, 100, 10);
    expect(bar).toBe('[#####.....]');
    expect(bar.length).toBe(12); // 10 + 2 brackets
  });

  it('should cap at 100% for overflow', () => {
    const bar = formatProgressBar(150, 100);
    expect(bar).toBe('[####################]');
  });

  it('should handle 0 max gracefully', () => {
    // This edge case should be handled - returns full bar
    const bar = formatProgressBar(10, 0);
    expect(bar).toBe('[####################]');
  });

  it('should handle negative values gracefully', () => {
    const bar = formatProgressBar(-10, 100);
    expect(bar).toBe('[....................]');
  });

  it('should handle various percentages correctly', () => {
    expect(formatProgressBar(25, 100, 20)).toBe('[#####...............]');
    expect(formatProgressBar(75, 100, 20)).toBe('[###############.....]');
    expect(formatProgressBar(10, 100, 10)).toBe('[#.........]');
  });
});

// ============================================================================
// formatBudgetDisplay() tests
// ============================================================================

describe('formatBudgetDisplay()', () => {
  it('should include header with percentage and counts', () => {
    const result: CumulativeBudgetResult = {
      totalChars: 7750,
      budget: 15500,
      usagePercent: 50,
      severity: 'ok',
      skills: [],
      hiddenCount: 0,
    };

    const display = formatBudgetDisplay(result);

    expect(display).toContain('Budget:');
    expect(display).toContain('50%');
    expect(display).toContain('7,750');
    expect(display).toContain('15,500');
  });

  it('should show skills sorted by size descending', () => {
    const result: CumulativeBudgetResult = {
      totalChars: 3000,
      budget: 15500,
      usagePercent: 19,
      severity: 'ok',
      skills: [
        { name: 'large', descriptionChars: 50, bodyChars: 1950, totalChars: 2000, path: '/a' },
        { name: 'small', descriptionChars: 50, bodyChars: 950, totalChars: 1000, path: '/b' },
      ],
      hiddenCount: 0,
    };

    const display = formatBudgetDisplay(result);
    const lines = display.split('\n');

    // Find lines with skill names
    const largeIndex = lines.findIndex(l => l.includes('large'));
    const smallIndex = lines.findIndex(l => l.includes('small'));

    expect(largeIndex).toBeLessThan(smallIndex);
  });

  it('should show warning when hiddenCount > 0', () => {
    const result: CumulativeBudgetResult = {
      totalChars: 20000,
      budget: 15500,
      usagePercent: 129,
      severity: 'error',
      skills: [
        { name: 'a', descriptionChars: 10, bodyChars: 10000, totalChars: 10000, path: '/a' },
        { name: 'b', descriptionChars: 10, bodyChars: 10000, totalChars: 10000, path: '/b' },
      ],
      hiddenCount: 1,
    };

    const display = formatBudgetDisplay(result);

    expect(display).toContain('Warning:');
    expect(display).toContain('1 skill(s) would be hidden');
  });

  it('should show no skills found message for empty skills array', () => {
    const result: CumulativeBudgetResult = {
      totalChars: 0,
      budget: 15500,
      usagePercent: 0,
      severity: 'ok',
      skills: [],
      hiddenCount: 0,
    };

    const display = formatBudgetDisplay(result);

    expect(display).toContain('No skills found');
  });

  it('should include progress bar in output', () => {
    const result: CumulativeBudgetResult = {
      totalChars: 12400,
      budget: 15500,
      usagePercent: 80,
      severity: 'warning',
      skills: [],
      hiddenCount: 0,
    };

    const display = formatBudgetDisplay(result);

    expect(display).toContain('[');
    expect(display).toContain('#');
    expect(display).toContain(']');
  });
});

// ============================================================================
// generateSuggestions() tests
// ============================================================================

describe('generateSuggestions()', () => {
  const budget = 15000;

  it('should suggest shortening description when > 200 chars', () => {
    const skill: SkillBudgetInfo = {
      name: 'long-desc',
      descriptionChars: 500,
      bodyChars: 14600,
      totalChars: 15500, // Over budget
      path: '/test',
    };

    const suggestions = generateSuggestions(skill, budget);

    expect(suggestions.some(s => s.toLowerCase().includes('description'))).toBe(true);
    expect(suggestions.some(s => s.includes('chars'))).toBe(true);
  });

  it('should suggest reference files when body > 10000 chars', () => {
    const skill: SkillBudgetInfo = {
      name: 'large-body',
      descriptionChars: 100,
      bodyChars: 11000,
      totalChars: 11500,
      path: '/test',
    };

    const suggestions = generateSuggestions(skill, budget);

    expect(suggestions.some(s => s.toLowerCase().includes('reference'))).toBe(true);
  });

  it('should return multiple suggestions for multiple issues', () => {
    const skill: SkillBudgetInfo = {
      name: 'many-issues',
      descriptionChars: 400,
      bodyChars: 15000,
      totalChars: 16000,
      path: '/test',
    };

    const suggestions = generateSuggestions(skill, budget);

    expect(suggestions.length).toBeGreaterThan(1);
  });

  it('should return empty array for small skill', () => {
    const skill: SkillBudgetInfo = {
      name: 'small',
      descriptionChars: 50,
      bodyChars: 500,
      totalChars: 600,
      path: '/test',
    };

    const suggestions = generateSuggestions(skill, budget);

    expect(suggestions).toHaveLength(0);
  });

  it('should return empty array for skill under 60%', () => {
    const skill: SkillBudgetInfo = {
      name: 'under-threshold',
      descriptionChars: 100,
      bodyChars: 8000,
      totalChars: 8500, // 57%
      path: '/test',
    };

    const suggestions = generateSuggestions(skill, budget);

    expect(suggestions).toHaveLength(0);
  });

  it('should suggest splitting for very large body', () => {
    const skill: SkillBudgetInfo = {
      name: 'huge-body',
      descriptionChars: 100,
      bodyChars: 12000,
      totalChars: 12500,
      path: '/test',
    };

    const suggestions = generateSuggestions(skill, budget);

    expect(suggestions.some(s => s.toLowerCase().includes('split'))).toBe(true);
  });

  it('should provide generic reduction target when no specific issues', () => {
    const skill: SkillBudgetInfo = {
      name: 'generic-over',
      descriptionChars: 150, // Not over 200
      bodyChars: 4000, // Not over 5000 (so no reference file suggestion)
      totalChars: 16000, // Over budget
      path: '/test',
    };

    const suggestions = generateSuggestions(skill, budget);

    expect(suggestions.length).toBeGreaterThan(0);
    // When no specific issues (description OK, body not too large), gives generic reduction target
    expect(suggestions.some(s => s.includes('Reduce') || s.includes('1,000'))).toBe(true);
  });
});

// ============================================================================
// Integration tests
// ============================================================================

describe('BudgetValidator integration', () => {
  let validator: BudgetValidator;
  const integrationDir = join(testDir, 'integration');

  beforeAll(async () => {
    delete process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET;
    validator = BudgetValidator.load();
    await mkdir(integrationDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should provide end-to-end workflow for budget checking', async () => {
    // Create a skill
    const skillDir = join(integrationDir, 'workflow-skill');
    await mkdir(skillDir, { recursive: true });
    const content = `---
name: workflow-skill
description: A skill for testing the complete workflow
---
# Workflow Skill

This is a complete skill with some body content.
It should pass budget checks with ok severity.`;
    await writeFile(join(skillDir, 'SKILL.md'), content, 'utf-8');

    // Count chars
    const info = await validator.countSkillChars(join(skillDir, 'SKILL.md'));
    expect(info.name).toBe('workflow-skill');
    expect(info.totalChars).toBe(content.length);

    // Check single skill budget
    const singleResult = validator.checkSingleSkill(info.totalChars);
    expect(singleResult.valid).toBe(true);
    expect(singleResult.severity).toBe('ok');

    // Check cumulative budget
    const cumulativeResult = await validator.checkCumulative(integrationDir);
    expect(cumulativeResult.skills).toHaveLength(1);
    expect(cumulativeResult.severity).toBe('ok');

    // Format display
    const display = formatBudgetDisplay(cumulativeResult);
    expect(display).toContain('workflow-skill');
    expect(display).toContain('Budget:');
  });

  it('should correctly identify problematic skills', async () => {
    // Create an over-budget skill
    const skillDir = join(integrationDir, 'problem-skill');
    await mkdir(skillDir, { recursive: true });
    const largeBody = 'x'.repeat(15500);
    const content = `---
name: problem-skill
description: This skill is too large
---
${largeBody}`;
    await writeFile(join(skillDir, 'SKILL.md'), content, 'utf-8');

    const info = await validator.countSkillChars(join(skillDir, 'SKILL.md'));
    const singleResult = validator.checkSingleSkill(info.totalChars);

    expect(singleResult.valid).toBe(false);
    expect(singleResult.severity).toBe('error');
    expect(singleResult.suggestions).toBeDefined();

    const suggestions = generateSuggestions(info, validator.getBudget());
    expect(suggestions.length).toBeGreaterThan(0);
  });
});
