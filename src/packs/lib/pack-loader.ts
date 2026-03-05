/**
 * Pack Loader — Load and initialize packs
 */

import * as fs from 'fs';
import * as path from 'path';
import { PackDocumentSchema, PackProgressSchema, type PackDocument, type PackProgress } from './pack-types';

export class PackLoader {
  private packsDir: string;

  constructor(packsDir: string = path.join(process.cwd(), 'src/packs')) {
    this.packsDir = packsDir;
  }

  /**
   * Load a pack by ID (expects pack-{id}/PACK.md or PACK.json)
   */
  async loadPack(packId: string): Promise<PackDocument> {
    const packDir = path.join(this.packsDir, `pack-${packId}`);

    // Try JSON first (structured), then markdown
    const jsonPath = path.join(packDir, 'PACK.json');
    const mdPath = path.join(packDir, 'PACK.md');

    let content: string;
    if (fs.existsSync(jsonPath)) {
      content = fs.readFileSync(jsonPath, 'utf-8');
    } else if (fs.existsSync(mdPath)) {
      // Parse markdown to JSON (basic frontmatter extraction)
      content = this.parseMmarkdownPack(fs.readFileSync(mdPath, 'utf-8'));
    } else {
      throw new Error(`Pack not found: ${packId}`);
    }

    const pack = JSON.parse(content);
    const validated = PackDocumentSchema.parse(pack);
    return validated;
  }

  /**
   * List available packs
   */
  listPacks(): string[] {
    if (!fs.existsSync(this.packsDir)) return [];

    return fs
      .readdirSync(this.packsDir)
      .filter(name => name.startsWith('pack-'))
      .map(name => name.replace(/^pack-/, ''));
  }

  /**
   * Load pack progress for a learner
   */
  async loadProgress(packId: string, learnerHandle: string): Promise<PackProgress | null> {
    const packDir = path.join(this.packsDir, `pack-${packId}`);
    const logsDir = path.join(packDir, 'LOGS');
    const progressPath = path.join(logsDir, `${learnerHandle}.json`);

    if (!fs.existsSync(progressPath)) return null;

    const content = fs.readFileSync(progressPath, 'utf-8');
    const progress = JSON.parse(content);
    const validated = PackProgressSchema.parse(progress);
    return validated;
  }

  /**
   * Save pack progress
   */
  async saveProgress(packId: string, progress: PackProgress): Promise<void> {
    const packDir = path.join(this.packsDir, `pack-${packId}`);
    const logsDir = path.join(packDir, 'LOGS');

    fs.mkdirSync(logsDir, { recursive: true });

    const progressPath = path.join(logsDir, `${progress.learner_handle}.json`);
    fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
  }

  /**
   * Basic markdown frontmatter parser for PACK.md files
   */
  private parseMmarkdownPack(markdown: string): string {
    // Extract frontmatter (YAML between --- markers)
    const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
    if (!match) {
      throw new Error('Pack markdown must start with --- YAML frontmatter ---');
    }

    // Convert YAML-like structure to JSON
    // This is a simplified parser; for production, use proper YAML library
    const yaml = match[1];
    const json: any = {};

    for (const line of yaml.split('\n')) {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        json[key.trim()] = valueParts.join(':').trim();
      }
    }

    return JSON.stringify(json);
  }
}
