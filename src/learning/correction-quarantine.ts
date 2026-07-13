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
import { randomUUID, createHash } from 'node:crypto';
import { WriteQueue } from '../safety/write-queue.js';
import { FileLock } from '../safety/file-lock.js';
import type { CorrectionCandidate, CorrectionCandidateInput } from '../types/learning.js';

type StatusPatch = Partial<
  Pick<CorrectionCandidate, 'status' | 'reviewedAt' | 'promotedFeedbackId' | 'dismissedReason'>
>;

export class CorrectionQuarantineStore {
  private filePath: string;
  private lockPath: string;
  private writeQueue = new WriteQueue();

  constructor(patternsDir: string = '.planning/patterns') {
    this.filePath = join(patternsDir, 'correction-quarantine.jsonl');
    this.lockPath = join(patternsDir, '.correction-quarantine.lock');
  }

  /**
   * Cross-process mutual exclusion for every mutating op on the ledger (append +
   * rewrite), mirroring promoteCandidate's 30×100ms retry. Lock ordering:
   * promoteCandidate holds `.feedback-promotion.lock` THEN calls updateStatus
   * (which takes this lock) — promotion→quarantine. Nothing acquires them in the
   * reverse order, so the nesting is acyclic (no deadlock). Fails loud on
   * retry exhaustion rather than silently skipping a write.
   */
  private async withLock<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const lock = new FileLock(this.lockPath);
    let acq = await lock.acquire(operation);
    for (let attempt = 0; attempt < 30 && !acq.acquired; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      acq = await lock.acquire(operation);
    }
    if (!acq.acquired) {
      throw new Error(`Could not acquire correction-quarantine lock — ${acq.message}`);
    }
    try {
      return await fn();
    } finally {
      await acq.release();
    }
  }

  /**
   * Stable, content-derived dedup key for cross-run idempotency. Reverts key on
   * (session, revert-commit, file); transcript signals key on (signal, session,
   * file, original, corrected) — matching the detector's in-run `seen` semantics.
   */
  private computeDedupKey(c: CorrectionCandidateInput): string {
    const parts =
      c.signal === 'reverted-commit'
        ? ['reverted-commit', c.sessionId, c.revertCommitHash ?? '', c.filePath]
        : [c.signal, c.sessionId, c.filePath, c.original, c.corrected];
    return createHash('sha256').update(parts.join('\x00')).digest('hex');
  }

  /**
   * Append a single candidate (id/detectedAt/status/dedupKey stamped).
   * Idempotent: re-adding a candidate whose dedupKey already exists returns the
   * existing record without appending.
   */
  async add(input: CorrectionCandidateInput): Promise<CorrectionCandidate> {
    return (await this.addMany([input]))[0]!;
  }

  /**
   * Append many candidates, deduped by content key against BOTH the existing
   * ledger and the incoming batch. The read → dedup → append runs as one
   * critical section under the write queue (in-process) + a cross-process
   * FileLock, so a concurrent detect-run cannot double-append or lose a write.
   */
  async addMany(inputs: CorrectionCandidateInput[]): Promise<CorrectionCandidate[]> {
    if (inputs.length === 0) return [];
    return this.writeQueue.serialize(() =>
      this.withLock('add', async () => {
        const existing = await this.readAll();
        const byKey = new Map<string, CorrectionCandidate>();
        for (const c of existing) byKey.set(c.dedupKey ?? this.computeDedupKey(c), c);

        const out: CorrectionCandidate[] = [];
        const toAppend: CorrectionCandidate[] = [];
        for (const input of inputs) {
          const dedupKey = this.computeDedupKey(input);
          const prior = byKey.get(dedupKey);
          if (prior) {
            out.push(prior);
            continue;
          }
          const record: CorrectionCandidate = {
            ...input,
            dedupKey,
            id: randomUUID(),
            detectedAt: new Date().toISOString(),
            status: 'pending',
          };
          byKey.set(dedupKey, record);
          toAppend.push(record);
          out.push(record);
        }

        if (toAppend.length > 0) {
          await this.ensureDir();
          await appendFile(
            this.filePath,
            toAppend.map((c) => JSON.stringify(c)).join('\n') + '\n',
            'utf-8',
          );
        }
        return out;
      }),
    );
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
    return this.writeQueue.serialize(() =>
      this.withLock(`update:${id}`, async () => {
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
      }),
    );
  }

  private async ensureDir(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
  }
}
