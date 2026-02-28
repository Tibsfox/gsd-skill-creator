import { basename, dirname } from 'path';

// ============================================================================
// Directory Validation Types
// ============================================================================

/**
 * Result of validating a skill's directory structure.
 */
export interface DirectoryValidationResult {
  /** Whether the path follows the valid subdirectory pattern */
  valid: boolean;
  /** Validation errors (empty if valid) */
  errors: string[];
  /** Whether this is a legacy flat-file skill (.claude/skills/name.md) */
  isLegacyFlatFile: boolean;
  /** Suggested migration path for legacy flat files */
  suggestedPath?: string;
  /** Directory name extracted from path (for name matching validation) */
  directoryName?: string;
}

/**
 * Result of validating directory name against frontmatter name.
 */
export interface NameMatchResult {
  /** Whether directory name matches frontmatter name */
  valid: boolean;
  /** Error message if mismatch */
  error?: string;
}

// ============================================================================
// Directory Validation Functions
// ============================================================================

/**
 * Check if a path represents a legacy flat-file skill.
 *
 * Legacy flat files are .md files directly in .claude/skills/ without a subdirectory,
 * e.g., `.claude/skills/my-skill.md` instead of `.claude/skills/my-skill/SKILL.md`.
 *
 * @param path - The skill file path to check
 * @returns true if this is a legacy flat-file skill
 */
export function isLegacyFlatFile(path: string): boolean {
  if (!path) return false;

  // Normalize path separators for cross-platform
  const normalizedPath = path.replace(/\\/g, '/');

  // Must end with .md but not /SKILL.md
  if (!normalizedPath.endsWith('.md')) return false;
  if (normalizedPath.endsWith('/SKILL.md')) return false;

  // Check if it's in .claude/skills/ directory (not a subdirectory)
  const parts = normalizedPath.split('/');
  const mdIndex = parts.length - 1;
  const filename = parts[mdIndex];

  // Find .claude/skills in the path
  for (let i = 0; i < parts.length - 2; i++) {
    if (parts[i] === '.claude' && parts[i + 1] === 'skills') {
      // Check if the .md file is directly after skills (no subdirectory)
      // e.g., .claude/skills/my-skill.md (mdIndex = i+2)
      if (mdIndex === i + 2 && filename.endsWith('.md')) {
        return true;
      }
      break;
    }
  }

  return false;
}

/**
 * Validate a skill's directory structure.
 *
 * Valid structure: `.claude/skills/{name}/SKILL.md`
 * Legacy structure: `.claude/skills/{name}.md` (flat file)
 *
 * @param path - The skill file path to validate
 * @returns Validation result with errors and migration suggestion for legacy files
 */
export function validateSkillDirectory(path: string): DirectoryValidationResult {
  const errors: string[] = [];

  if (!path) {
    return {
      valid: false,
      errors: ['Path is required'],
      isLegacyFlatFile: false,
    };
  }

  // Normalize path separators for cross-platform
  const normalizedPath = path.replace(/\\/g, '/');

  // Check if it's a legacy flat file
  if (isLegacyFlatFile(normalizedPath)) {
    const parts = normalizedPath.split('/');
    const filename = parts[parts.length - 1];
    const name = filename.replace(/\.md$/, '');
    const parentPath = parts.slice(0, -1).join('/');
    const suggestedPath = `${parentPath}/${name}/SKILL.md`;

    return {
      valid: false,
      errors: ['Legacy flat-file format detected. Skills should be in subdirectories.'],
      isLegacyFlatFile: true,
      suggestedPath,
      directoryName: name,
    };
  }

  // Check if path ends with SKILL.md
  if (!normalizedPath.endsWith('/SKILL.md') && !normalizedPath.endsWith('SKILL.md')) {
    errors.push('Skill file must be named SKILL.md');
  }

  // Extract directory name for valid paths
  let directoryName: string | undefined;
  if (normalizedPath.endsWith('/SKILL.md')) {
    const pathWithoutFile = dirname(normalizedPath);
    directoryName = basename(pathWithoutFile);

    // Check that there is actually a subdirectory (not just .claude/skills/SKILL.md)
    if (!directoryName || directoryName === 'skills') {
      errors.push('SKILL.md must be in a named subdirectory (e.g., .claude/skills/my-skill/SKILL.md)');
      directoryName = undefined;
    }
  } else if (normalizedPath === 'SKILL.md') {
    // Just SKILL.md without any directory
    errors.push('SKILL.md must be in a named subdirectory (e.g., .claude/skills/my-skill/SKILL.md)');
  }

  // Check if path contains .claude/skills pattern
  if (!normalizedPath.includes('.claude/skills/') && !normalizedPath.includes('.claude/skills')) {
    // This might be a relative path or wrong location
    // We don't strictly require .claude/skills for all cases, but warn if it looks wrong
    if (normalizedPath.includes('.claude/commands/')) {
      errors.push('Skills should be in .claude/skills/, not .claude/commands/');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    isLegacyFlatFile: false,
    directoryName,
  };
}

/**
 * Validate that the directory name matches the frontmatter name field.
 *
 * Per official spec, if a name is provided in frontmatter, it must match
 * the containing directory name.
 *
 * @param path - The skill file path
 * @param frontmatterName - The name from the skill's frontmatter
 * @returns Validation result
 */
export function validateDirectoryNameMatch(
  path: string,
  frontmatterName: string
): NameMatchResult {
  if (!path || !frontmatterName) {
    return { valid: true }; // Can't validate without both values
  }

  // Normalize path separators
  const normalizedPath = path.replace(/\\/g, '/');

  // Extract directory name
  let directoryName: string;

  if (normalizedPath.endsWith('/SKILL.md')) {
    const pathWithoutFile = dirname(normalizedPath);
    directoryName = basename(pathWithoutFile);
  } else if (normalizedPath.endsWith('.md') && !normalizedPath.endsWith('/SKILL.md')) {
    // Legacy flat file - extract name from filename
    const filename = basename(normalizedPath);
    directoryName = filename.replace(/\.md$/, '');
  } else {
    // Can't extract directory name
    return { valid: true };
  }

  // Compare names
  if (directoryName !== frontmatterName) {
    return {
      valid: false,
      error: `Directory name "${directoryName}" does not match frontmatter name "${frontmatterName}". These must be identical.`,
    };
  }

  return { valid: true };
}
