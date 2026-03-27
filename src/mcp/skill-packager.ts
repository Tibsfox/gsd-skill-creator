/**
 * Skill packager -- creates distributable .tar.gz archives from skill directories.
 *
 * Each archive contains a manifest.json with format version envelope and
 * portable skill content (extension fields stripped via stripToPortable).
 */

import { packTar, type TarSource } from 'modern-tar/fs';
import { createWriteStream } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import matter from 'gray-matter';
import { exportPortableContent } from '../portability/index.js';
import type { SkillMetadata, Skill } from '../types/skill.js';
import { safeParseFrontmatter } from '../validation/yaml-safety.js';
import { SkillMetadataSchema } from '../validation/skill-validation.js';

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
 * Recursively enumerate all files in a directory, returning paths relative to the directory.
 * Excludes dot files (e.g., .skill-index.json).
 */
async function enumerateFiles(dir: string, baseDir?: string): Promise<string[]> {
  const base = baseDir ?? dir;
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    // Skip dot files and directories
    if (entry.name.startsWith('.')) continue;

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      const subFiles = await enumerateFiles(fullPath, base);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      files.push(relative(base, fullPath));
    }
  }

  return files.sort();
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
  // 1. Read skill metadata from SKILL.md (safe parsing + Zod validation)
  const skillMdPath = join(skillDir, 'SKILL.md');
  const rawContent = await readFile(skillMdPath, 'utf-8');
  const parseResult = safeParseFrontmatter(rawContent);
  if (!parseResult.success) {
    throw new Error(`Invalid skill file "${skillName}": ${parseResult.error}`);
  }
  const metadata = SkillMetadataSchema.parse(parseResult.data) as SkillMetadata;
  const body = parseResult.body;

  // 2. Convert SKILL.md to portable format (strips extension fields, converts allowed-tools)
  const skill: Skill = {
    metadata,
    body: body.trim(),
    path: skillMdPath,
  };
  const portableContent = exportPortableContent(skill);

  // 3. Enumerate all files in the skill directory (excluding dot files)
  const allFiles = await enumerateFiles(skillDir);

  // 4. Build file list for manifest: manifest.json + all skill files prefixed with skillName
  const archiveFileList = [
    'manifest.json',
    ...allFiles.map(f => `${skillName}/${f}`),
  ];

  // 5. Build manifest
  const manifest: SkillPackageManifest = {
    formatVersion: 1,
    name: skillName,
    description: metadata.description ?? '',
    createdAt: new Date().toISOString(),
    files: archiveFileList,
  };

  // 6. Build TarSource array for modern-tar
  const sources: TarSource[] = [
    // Manifest at archive root
    {
      type: 'content',
      content: JSON.stringify(manifest, null, 2),
      target: 'manifest.json',
    },
    // SKILL.md in portable format
    {
      type: 'content',
      content: portableContent,
      target: `${skillName}/SKILL.md`,
    },
  ];

  // Add subdirectory files (references/, scripts/, etc.) -- everything except SKILL.md
  for (const filePath of allFiles) {
    if (filePath === 'SKILL.md') continue; // Already added as portable content

    const fullPath = join(skillDir, filePath);
    const fileContent = await readFile(fullPath, 'utf-8');

    sources.push({
      type: 'content',
      content: fileContent,
      target: `${skillName}/${filePath}`,
    });
  }

  // 7. Create tar.gz archive
  // packTar from modern-tar/fs returns a Node.js Readable stream
  const tarStream = packTar(sources);

  // Pipe through Node.js zlib gzip (avoids web/node stream conversion)
  await pipeline(tarStream, createGzip(), createWriteStream(outputPath));

  // 8. Return manifest
  return manifest;
}
