/**
 * Body skeletons for the interactive skill-create wizard, so an author starts
 * from a structured Markdown scaffold rather than a blank prompt. Pure and
 * testable; the wizard seeds the content prompt's initialValue with one of these.
 */
export type SkillPreset = 'workflow-guide' | 'reference' | 'checklist' | 'blank';

export const SKILL_PRESETS: Array<{ value: SkillPreset; label: string; hint: string }> = [
  { value: 'workflow-guide', label: 'Workflow guide', hint: 'a step-by-step procedure' },
  { value: 'reference', label: 'Reference', hint: 'facts / patterns to recall' },
  { value: 'checklist', label: 'Checklist', hint: 'a list of checks to run' },
  { value: 'blank', label: 'Blank', hint: 'start from scratch' },
];

/** Title-case a lowercase-hyphen skill name for the H1 heading. */
export function titleFromName(name: string): string {
  const words = name.split(/[-_\s]+/).filter(Boolean);
  if (words.length === 0) return 'Skill';
  return words.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

/** Build a Markdown body skeleton for the given preset. */
export function buildSkillSkeleton(preset: SkillPreset, name: string, description: string): string {
  const title = titleFromName(name);
  const intro = description || 'Describe what this skill does.';
  switch (preset) {
    case 'workflow-guide':
      return [
        `# ${title}`,
        '',
        intro,
        '',
        '## When to use',
        '',
        '- ...',
        '',
        '## Steps',
        '',
        '1. ...',
        '2. ...',
        '3. ...',
        '',
        '## Notes',
        '',
        '- ...',
        '',
      ].join('\n');
    case 'reference':
      return [
        `# ${title}`,
        '',
        intro,
        '',
        '## Key facts',
        '',
        '- ...',
        '',
        '## Patterns',
        '',
        '```',
        '# example',
        '```',
        '',
        '## Gotchas',
        '',
        '- ...',
        '',
      ].join('\n');
    case 'checklist':
      return [
        `# ${title}`,
        '',
        intro,
        '',
        '## Checklist',
        '',
        '- [ ] ...',
        '- [ ] ...',
        '- [ ] ...',
        '',
        '## Notes',
        '',
        '- ...',
        '',
      ].join('\n');
    case 'blank':
    default:
      return [`# ${title}`, '', intro, '', ''].join('\n');
  }
}
