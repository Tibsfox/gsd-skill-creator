/**
 * Blitter promoter: detects promotable operations from skill metadata
 * extensions and extracts them as BlitterOperation objects.
 *
 * Skills declare deterministic operations as promotable via:
 *   metadata.extensions['gsd-skill-creator'].blitter.promotions
 *
 * The promoter reads these declarations, validates them against
 * PromotionDeclarationSchema, and constructs BlitterOperation objects
 * with deterministic IDs (`{skillName}:{promotionName}`).
 */

import type { SkillMetadata } from '../../types/skill.js';
import { PromotionDeclarationSchema, BlitterOperationSchema } from './types.js';
import type { BlitterOperation } from './types.js';

/** Shape of the blitter extension block in skill metadata. */
interface BlitterExtension {
  promotions?: unknown[];
}

/**
 * Extract the blitter extension from skill metadata.
 *
 * Follows the project pattern: extension data is namespaced under
 * `metadata.extensions['gsd-skill-creator']`.
 *
 * @internal
 */
function getBlitterExtension(metadata: SkillMetadata): BlitterExtension | undefined {
  const ext = metadata.metadata?.extensions?.['gsd-skill-creator'] as
    | (Record<string, unknown> & { blitter?: BlitterExtension })
    | undefined;

  if (!ext || !ext.blitter) {
    return undefined;
  }

  return ext.blitter;
}

/**
 * Detect whether a skill has promotable operations.
 *
 * Returns true only when the skill's metadata contains a non-empty
 * `blitter.promotions` array under the gsd-skill-creator extension.
 *
 * @param metadata - Skill metadata to inspect
 * @returns true if promotable operations exist
 */
export function detectPromotable(metadata: SkillMetadata): boolean {
  const blitter = getBlitterExtension(metadata);
  if (!blitter?.promotions) {
    return false;
  }
  return blitter.promotions.length > 0;
}

/**
 * Extract BlitterOperation objects from skill metadata promotion declarations.
 *
 * For each valid promotion declaration, constructs a BlitterOperation with:
 * - `id`: `{skillName}:{promotionName}` (deterministic)
 * - `script`: the declaration's scriptContent
 * - `scriptType`: propagated from declaration
 * - `workingDir`: from declaration or default '.'
 * - `timeout`: from declaration or default 30000
 * - `env`: from declaration or default {}
 * - `label`: the promotion name
 *
 * Invalid declarations are skipped with a stderr warning.
 *
 * @param metadata - Skill metadata to extract from
 * @returns Array of validated BlitterOperation objects
 */
export function extractBlitterOps(metadata: SkillMetadata): BlitterOperation[] {
  const blitter = getBlitterExtension(metadata);
  if (!blitter?.promotions || blitter.promotions.length === 0) {
    return [];
  }

  const operations: BlitterOperation[] = [];

  for (const raw of blitter.promotions) {
    const parsed = PromotionDeclarationSchema.safeParse(raw);
    if (!parsed.success) {
      process.stderr.write(
        `[blitter] skipping invalid promotion declaration in skill "${metadata.name}": ${parsed.error.message}\n`,
      );
      continue;
    }

    const declaration = parsed.data;

    const operation = BlitterOperationSchema.parse({
      id: `${metadata.name}:${declaration.name}`,
      script: declaration.scriptContent,
      scriptType: declaration.scriptType,
      workingDir: declaration.workingDir ?? '.',
      timeout: declaration.timeout ?? 30000,
      env: declaration.env ?? {},
      label: declaration.name,
    });

    operations.push(operation);
  }

  return operations;
}
