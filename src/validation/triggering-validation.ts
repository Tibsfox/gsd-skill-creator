import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

export const REQUIRED_SECTIONS = [
  'Naive Prompt',
  'Expected Baseline Failure',
  'Expected Skill Activation',
  'Rationalization Table',
] as const;

export const MIN_RATIONALIZATION_ROWS = 3;

export interface TriggeringTestResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sectionsFound: string[];
  rationalizationRowCount: number;
}

/**
 * Parse a triggering.test.md content string and validate its structure.
 * Pure function — no filesystem access. All unit tests use this.
 */
export function validateTriggeringTestFile(content: string): TriggeringTestResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sectionsFound: string[] = [];

  // Split content by level-2 headings (## ) — preserve heading line with body
  // Match only ## headings at line start (not ### or deeper)
  const sectionRegex = /^##\s+(.+?)\s*$/gm;
  const sections = new Map<string, string>();
  let lastIndex = 0;
  let lastName: string | null = null;
  let match: RegExpExecArray | null;

  while ((match = sectionRegex.exec(content)) !== null) {
    if (lastName !== null) {
      sections.set(lastName, content.slice(lastIndex, match.index).trim());
    }
    lastName = match[1].trim();
    lastIndex = match.index + match[0].length;
  }
  if (lastName !== null) {
    sections.set(lastName, content.slice(lastIndex).trim());
  }

  // Check each required section exists AND has non-whitespace content
  for (const required of REQUIRED_SECTIONS) {
    if (!sections.has(required)) {
      errors.push(`Missing section: ${required}`);
    } else {
      sectionsFound.push(required);
      const body = sections.get(required) ?? '';
      if (body.length === 0) {
        errors.push(`Section "${required}" is present but empty`);
      }
    }
  }

  // Count data rows in Rationalization Table
  let rationalizationRowCount = 0;
  const tableBody = sections.get('Rationalization Table') ?? '';
  if (tableBody.length > 0) {
    const lines = tableBody.split('\n').map(l => l.trim()).filter(Boolean);
    // Identify pipe rows
    const pipeRows = lines.filter(l => l.startsWith('|') && l.endsWith('|'));
    // Separator rows: |---|---| or |:-:|:-:|
    const separatorRows = pipeRows.filter(l => /^\|[-:|\s]+\|$/.test(l));
    // Header row = first non-separator pipe row
    const dataRows = pipeRows.filter(l => !separatorRows.includes(l));
    // Subtract header (1 row)
    rationalizationRowCount = Math.max(0, dataRows.length - 1);
    if (rationalizationRowCount < MIN_RATIONALIZATION_ROWS) {
      errors.push(
        `Rationalization Table has ${rationalizationRowCount} data row(s); minimum is ${MIN_RATIONALIZATION_ROWS}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sectionsFound,
    rationalizationRowCount,
  };
}

/**
 * IO wrapper — reads triggering.test.md from skillDir and delegates to
 * validateTriggeringTestFile. Used by the publish gate in Wave 3.
 */
export async function validateTriggeringTestExists(
  skillDir: string,
): Promise<TriggeringTestResult> {
  const path = join(skillDir, 'triggering.test.md');
  try {
    await access(path);
  } catch {
    return {
      valid: false,
      errors: ['triggering.test.md is required'],
      warnings: [],
      sectionsFound: [],
      rationalizationRowCount: 0,
    };
  }
  const content = await readFile(path, 'utf8');
  return validateTriggeringTestFile(content);
}
