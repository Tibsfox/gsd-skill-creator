/**
 * Offload promoter: detects promotable operations from skill metadata
 * extensions and extracts them as OffloadOperation objects.
 *
 * Skills declare deterministic operations as promotable via:
 *   metadata.extensions['gsd-skill-creator'].offload.promotions
 *
 * The promoter reads these declarations, validates them against
 * PromotionDeclarationSchema, and constructs OffloadOperation objects
 * with deterministic IDs (`{skillName}:{promotionName}`).
 */

import type { SkillMetadata } from '../../types/skill.js';
import { PromotionDeclarationSchema, OffloadOperationSchema } from './types.js';
import type { OffloadOperation } from './types.js';

/** Shape of the offload extension block in skill metadata. */
interface OffloadExtension {
  promotions?: unknown[];
}

/**
 * Extract the offload extension from skill metadata.
 *
 * Follows the project pattern: extension data is namespaced under
 * `metadata.extensions['gsd-skill-creator']`.
 *
 * @internal
 */
function getOffloadExtension(metadata: SkillMetadata): OffloadExtension | undefined {
  const ext = metadata.metadata?.extensions?.['gsd-skill-creator'] as
    | (Record<string, unknown> & { offload?: OffloadExtension })
    | undefined;

  if (!ext || !ext.offload) {
    return undefined;
  }

  return ext.offload;
}

/**
 * Detect whether a skill has promotable operations.
 *
 * Returns true only when the skill's metadata contains a non-empty
 * `offload.promotions` array under the gsd-skill-creator extension.
 *
 * @param metadata - Skill metadata to inspect
 * @returns true if promotable operations exist
 */
export function detectPromotable(metadata: SkillMetadata): boolean {
  const offload = getOffloadExtension(metadata);
  if (!offload?.promotions) {
    return false;
  }
  return offload.promotions.length > 0;
}

/**
 * Extract OffloadOperation objects from skill metadata promotion declarations.
 *
 * For each valid promotion declaration, constructs an OffloadOperation with:
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
 * @returns Array of validated OffloadOperation objects
 */
export function extractOffloadOps(metadata: SkillMetadata): OffloadOperation[] {
  const offload = getOffloadExtension(metadata);
  if (!offload?.promotions || offload.promotions.length === 0) {
    return [];
  }

  const operations: OffloadOperation[] = [];

  for (const raw of offload.promotions) {
    const parsed = PromotionDeclarationSchema.safeParse(raw);
    if (!parsed.success) {
      process.stderr.write(
        `[offload] skipping invalid promotion declaration in skill "${metadata.name}": ${parsed.error.message}\n`,
      );
      continue;
    }

    const declaration = parsed.data;

    const operation = OffloadOperationSchema.parse({
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
