/**
 * Skill packager -- creates distributable .tar.gz archives from skill directories.
 *
 * Each archive contains a manifest.json with format version envelope and
 * portable skill content (extension fields stripped via stripToPortable).
 */

/**
 * Format version envelope for skill packages.
 * Enables future format evolution with backward-compatible version checking.
 */
export interface SkillPackageManifest {
  formatVersion: 1;
  name: string;
  description: string;
  createdAt: string;
  files: string[];
}

/**
 * Package a skill directory into a distributable .tar.gz archive.
 *
 * The archive contains:
 * - manifest.json (format version envelope at archive root)
 * - {skillName}/SKILL.md (portable format, extension fields stripped)
 * - {skillName}/references/* (if progressive disclosure skill)
 * - {skillName}/scripts/* (if progressive disclosure skill)
 *
 * @param skillDir - Path to the skill directory containing SKILL.md
 * @param skillName - Name of the skill (used as archive prefix)
 * @param outputPath - Path where .tar.gz archive will be written
 * @returns The manifest describing the package contents
 */
export async function packSkill(
  skillDir: string,
  skillName: string,
  outputPath: string,
): Promise<SkillPackageManifest> {
  throw new Error('Not implemented');
}
