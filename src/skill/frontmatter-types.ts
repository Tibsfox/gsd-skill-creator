import { z } from 'zod';

export const SKILL_FORMAT_DATE = '2025-10-02';

export const SkillStatusSchema = z.enum(['active', 'deprecated', 'retired', 'draft']);
export type SkillStatus = z.infer<typeof SkillStatusSchema>;

export const SkillFrontmatterSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1).max(500),
    format: z.string().optional(),
    version: z.string().optional(),
    status: SkillStatusSchema.optional(),
    updated: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'updated must be YYYY-MM-DD')
      .optional(),
    deprecated_by: z.string().nullable().optional(),
  })
  .passthrough();

export type SkillFrontmatter = z.infer<typeof SkillFrontmatterSchema>;

export function normalizeSkillFrontmatter(fm: SkillFrontmatter): Required<
  Pick<SkillFrontmatter, 'name' | 'description'>
> &
  Omit<SkillFrontmatter, 'name' | 'description'> & {
    status: SkillStatus;
    format: string;
  } {
  return {
    ...fm,
    name: fm.name,
    description: fm.description,
    status: fm.status ?? 'active',
    format: fm.format ?? SKILL_FORMAT_DATE,
  };
}

export function isDeprecated(fm: SkillFrontmatter): boolean {
  return fm.status === 'deprecated';
}

export function isRetired(fm: SkillFrontmatter): boolean {
  return fm.status === 'retired';
}

export function isLoadable(fm: SkillFrontmatter): boolean {
  const status = fm.status ?? 'active';
  return status !== 'retired';
}
