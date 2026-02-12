import type { SkillMetadata, Skill } from '../types/skill.js';
import { stripToPortable, exportPortableContent } from './portable-exporter.js';
import { normalizePaths } from './path-normalizer.js';
import matter from 'gray-matter';
import { readdir, copyFile, mkdir, readFile, writeFile, stat } from 'fs/promises';
import { join } from 'path';

export interface PlatformConfig {
  name: string;
  userSkillsDir: string;
  projectSkillsDir: string;
  supportsAllowedTools: boolean;
}

export const PLATFORMS: Record<string, PlatformConfig> = {};

export function getSupportedPlatforms(): string[] {
  throw new Error('Not implemented');
}

export function exportForPlatform(skill: Skill, platformId: string): string {
  throw new Error('Not implemented');
}

export async function exportSkillDirectory(
  sourceDir: string,
  targetDir: string,
  platformId: string,
): Promise<string[]> {
  throw new Error('Not implemented');
}
