import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { PhotonEmitter } from './photon-emitter.js';
import { PhotonEchoSchema, PhotonBatchSchema } from '../../core/types/photon.js';

describe('PhotonEmitter', () => {
  let tmpDir: string;
  let emitter: PhotonEmitter;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'photon-test-'));
    emitter = new PhotonEmitter();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('file path', () => {
    it('returns same when content matches expected hash', async () => {
      const filePath = join(tmpDir, 'test.txt');
      await writeFile(filePath, 'hello world');

      // First fire to get the hash (baseline)
      const baseline = await emitter.fire({ type: 'file', target: filePath, expectedHash: null });
      expect(baseline.signal).toBe('same');
      expect(baseline.hash).toBeTruthy();
      PhotonEchoSchema.parse(baseline);

      // Second fire with known hash
      const echo = await emitter.fire({ type: 'file', target: filePath, expectedHash: baseline.hash });
      expect(echo.signal).toBe('same');
      expect(echo.hash).toBe(baseline.hash);
    });

    it('returns different when content changes', async () => {
      const filePath = join(tmpDir, 'test.txt');
      await writeFile(filePath, 'original');

      const baseline = await emitter.fire({ type: 'file', target: filePath, expectedHash: null });

      await writeFile(filePath, 'modified');
      const echo = await emitter.fire({ type: 'file', target: filePath, expectedHash: baseline.hash });
      expect(echo.signal).toBe('different');
      expect(echo.hash).not.toBe(baseline.hash);
    });

    it('returns different with null hash for missing file', async () => {
      const echo = await emitter.fire({ type: 'file', target: join(tmpDir, 'nonexistent.txt'), expectedHash: 'abc123' });
      expect(echo.signal).toBe('different');
      expect(echo.hash).toBeNull();
    });
  });

  describe('tree path', () => {
    it('returns same when tree is unchanged', async () => {
      const subDir = join(tmpDir, 'sub');
      await mkdir(subDir);
      await writeFile(join(subDir, 'a.txt'), 'aaa');
      await writeFile(join(subDir, 'b.txt'), 'bbb');

      const baseline = await emitter.fire({ type: 'tree', target: subDir, expectedHash: null });
      expect(baseline.signal).toBe('same');

      const echo = await emitter.fire({ type: 'tree', target: subDir, expectedHash: baseline.hash });
      expect(echo.signal).toBe('same');
    });

    it('returns different when file added to tree', async () => {
      const subDir = join(tmpDir, 'sub');
      await mkdir(subDir);
      await writeFile(join(subDir, 'a.txt'), 'aaa');

      const baseline = await emitter.fire({ type: 'tree', target: subDir, expectedHash: null });

      await writeFile(join(subDir, 'b.txt'), 'bbb');
      const echo = await emitter.fire({ type: 'tree', target: subDir, expectedHash: baseline.hash });
      expect(echo.signal).toBe('different');
    });
  });

  describe('batch', () => {
    it('fires batch with mixed results and correct differenceCount', async () => {
      const file1 = join(tmpDir, 'same.txt');
      const file2 = join(tmpDir, 'diff.txt');
      await writeFile(file1, 'stable');
      await writeFile(file2, 'original');

      const b1 = await emitter.fire({ type: 'file', target: file1, expectedHash: null });
      const b2 = await emitter.fire({ type: 'file', target: file2, expectedHash: null });

      await writeFile(file2, 'changed');

      const batch = await emitter.fireBatch('test-batch', [
        { type: 'file', target: file1, expectedHash: b1.hash },
        { type: 'file', target: file2, expectedHash: b2.hash },
      ]);

      PhotonBatchSchema.parse(batch);
      expect(batch.differenceCount).toBe(1);
      expect(batch.echoes[0].signal).toBe('same');
      expect(batch.echoes[1].signal).toBe('different');
      expect(batch.batchId).toBe('test-batch');
    });
  });

  describe('zod validation', () => {
    it('all echoes pass Zod schema validation', async () => {
      const filePath = join(tmpDir, 'zod-test.txt');
      await writeFile(filePath, 'test');

      const echo = await emitter.fire({ type: 'file', target: filePath, expectedHash: null });
      expect(() => PhotonEchoSchema.parse(echo)).not.toThrow();
      expect(echo.pathType).toBe('file');
      expect(echo.target).toBe(filePath);
      expect(echo.timestamp).toBeTruthy();
    });
  });
});
