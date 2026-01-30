import { readFile, appendFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import { FeedbackEvent, FeedbackType } from '../types/learning.js';

export class FeedbackStore {
  private feedbackPath: string;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(patternsDir: string = '.planning/patterns') {
    this.feedbackPath = join(patternsDir, 'feedback.jsonl');
  }

  /**
   * Record a feedback event
   */
  async record(
    event: Omit<FeedbackEvent, 'id' | 'timestamp'>
  ): Promise<FeedbackEvent> {
    const fullEvent: FeedbackEvent = {
      ...event,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    await this.appendLine(fullEvent);
    return fullEvent;
  }

  /**
   * Get all feedback events for a specific skill
   */
  async getBySkill(skillName: string): Promise<FeedbackEvent[]> {
    const all = await this.readAll();
    return all.filter(e => e.skillName === skillName);
  }

  /**
   * Get all feedback events
   */
  async getAll(): Promise<FeedbackEvent[]> {
    return this.readAll();
  }

  /**
   * Get only correction events for a skill
   */
  async getCorrections(skillName: string): Promise<FeedbackEvent[]> {
    const events = await this.getBySkill(skillName);
    return events.filter(e => e.type === 'correction');
  }

  /**
   * Get events since a timestamp, optionally filtered by skill
   */
  async getSince(timestamp: string, skillName?: string): Promise<FeedbackEvent[]> {
    let events = await this.readAll();

    // Filter by timestamp
    events = events.filter(e => e.timestamp >= timestamp);

    // Optionally filter by skill
    if (skillName) {
      events = events.filter(e => e.skillName === skillName);
    }

    return events;
  }

  /**
   * Get count of feedback events, optionally filtered by skill
   */
  async count(skillName?: string): Promise<number> {
    if (skillName) {
      return (await this.getBySkill(skillName)).length;
    }
    return (await this.readAll()).length;
  }

  /**
   * Ensure the directory exists
   */
  private async ensureDir(): Promise<void> {
    await mkdir(dirname(this.feedbackPath), { recursive: true });
  }

  /**
   * Read all events from JSONL file
   */
  private async readAll(): Promise<FeedbackEvent[]> {
    try {
      const content = await readFile(this.feedbackPath, 'utf-8');
      const events: FeedbackEvent[] = [];

      for (const line of content.split('\n')) {
        if (!line.trim()) continue;
        try {
          events.push(JSON.parse(line) as FeedbackEvent);
        } catch {
          // Skip corrupted lines but warn
          console.warn(`Skipping corrupted line in feedback.jsonl`);
        }
      }

      return events;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  /**
   * Append a single event to the JSONL file with write serialization
   */
  private async appendLine(event: FeedbackEvent): Promise<void> {
    await this.ensureDir();

    // Serialize writes to prevent interleaving
    this.writeQueue = this.writeQueue.then(async () => {
      const line = JSON.stringify(event) + '\n';
      await appendFile(this.feedbackPath, line, 'utf-8');
    });

    await this.writeQueue;
  }
}
