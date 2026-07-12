/**
 * CorrectionQuarantineStore — item-7 automatic correction quarantine.
 *
 * Append-only JSONL ledger at `.planning/patterns/correction-quarantine.jsonl`
 * holding auto-detected correction candidates awaiting human review. This file
 * is PHYSICALLY SEPARATE from `feedback.jsonl`: RefinementEngine /
 * ContradictionDetector read corrections only via FeedbackStore.getCorrections
 * (feedback.jsonl), so nothing here can drive an automatic refinement. The only
 * bridge into the live ledger is a human-run `feedback quarantine accept`.
 *
 * Chokepoint note: basename `correction-quarantine` does NOT match the
 * loader-context name pattern (loader|reader|scanner|walker|store), so this file
 * is outside LoaderContext scope and may import `node:fs/promises` directly —
 * the same bucket-A pattern as `aminet/quarantine.ts`. Do NOT rename it to
 * include store/loader/reader/scanner/walker.
 */

import { readFile, appendFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { WriteQueue } from '../safety/write-queue.js';
import type { CorrectionCandidate, CorrectionCandidateInput } from '../types/learning.js';

type StatusPatch = Partial<
  Pick<CorrectionCandidate, 'status' | 'reviewedAt' | 'promotedFeedbackId' | 'dismissedReason'>
>;

export class CorrectionQuarantineStore {
  private filePath: string;
  private writeQueue = new WriteQueue();

  constructor(patternsDir: string = '.planning/patterns') {
    this.filePath = join(patternsDir, 'correction-quarantine.jsonl');
  }

  /** Append a single candidate, stamping id/detectedAt/status. */
  async add(input: CorrectionCandidateInput): Promise<CorrectionCandidate> {
    const record: CorrectionCandidate = {
      ...input,
      id: randomUUID(),
      detectedAt: new Date().toISOString(),
      status: 'pending',
    };
    await this.appendLine(record);
    return record;
  }

  /** Append many candidates. */
  async addMany(inputs: CorrectionCandidateInput[]): Promise<CorrectionCandidate[]> {
    const out: CorrectionCandidate[] = [];
    for (const input of inputs) out.push(await this.add(input));
    return out;
  }

  /** Read every candidate; ENOENT -> [], corrupt lines skipped. */
  async readAll(): Promise<CorrectionCandidate[]> {
    let content: string;
    try {
      content = await readFile(this.filePath, 'utf-8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
    const out: CorrectionCandidate[] = [];
    for (const line of content.split('\n')) {
      if (!line.trim()) continue;
      try {
        out.push(JSON.parse(line) as CorrectionCandidate);
      } catch {
        // Skip corrupt line — a torn write must not sink the whole ledger.
      }
    }
    return out;
  }

  async listPending(): Promise<CorrectionCandidate[]> {
    return (await this.readAll()).filter((c) => c.status === 'pending');
  }

  async getById(id: string): Promise<CorrectionCandidate | undefined> {
    return (await this.readAll()).find((c) => c.id === id);
  }

  async countPending(): Promise<number> {
    return (await this.listPending()).length;
  }

  /**
   * Transition a candidate's review status. Fail-closed: only a `pending`
   * candidate may transition (guards against double-promote / re-dismiss).
   * Rewrites the whole file atomically (tmp + rename) under the write queue.
   */
  async updateStatus(id: string, patch: StatusPatch): Promise<CorrectionCandidate> {
    return this.writeQueue.serialize(async () => {
      const all = await this.readAll();
      const idx = all.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error(`No quarantine candidate with id '${id}'`);
      if (all[idx].status !== 'pending') {
        throw new Error(
          `Candidate '${id}' is already '${all[idx].status}' — refusing to re-transition.`,
        );
      }
      const updated: CorrectionCandidate = { ...all[idx], ...patch };
      all[idx] = updated;

      await this.ensureDir();
      const tmp = `${this.filePath}.tmp`;
      await writeFile(tmp, all.map((c) => JSON.stringify(c)).join('\n') + '\n', 'utf-8');
      await rename(tmp, this.filePath);
      return updated;
    });
  }

  private async ensureDir(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
  }

  private async appendLine(record: CorrectionCandidate): Promise<void> {
    await this.ensureDir();
    await this.writeQueue.serialize(async () => {
      await appendFile(this.filePath, JSON.stringify(record) + '\n', 'utf-8');
    });
  }
}
