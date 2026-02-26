import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CheckpointManager } from '../../../src/dogfood/harness/checkpoint-manager.js';
import type { Checkpoint } from '../../../src/dogfood/harness/types.js';

function createCheckpoint(overrides: Partial<Checkpoint> = {}): Checkpoint {
  return {
    waveId: 'wave-0',
    componentId: 'extraction',
    lastCompletedItem: 'chapter-01',
    timestamp: new Date().toISOString(),
    stateHash: '',  // CheckpointManager should compute this
    resumeInstructions: 'Resume extraction from chapter 2',
    ...overrides,
  };
}

describe('CheckpointManager', () => {
  let tempDir: string;
  let manager: CheckpointManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'checkpoint-test-'));
    manager = new CheckpointManager(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('writes checkpoint file atomically', async () => {
    const checkpoint = createCheckpoint();
    await manager.write(checkpoint);

    const filePath = path.join(tempDir, 'extraction-checkpoint.json');
    expect(fs.existsSync(filePath)).toBe(true);

    const contents = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(contents.componentId).toBe('extraction');
    expect(contents.lastCompletedItem).toBe('chapter-01');

    // No temp file should remain
    const tmpPath = path.join(tempDir, 'extraction-checkpoint.tmp');
    expect(fs.existsSync(tmpPath)).toBe(false);
  });

  it('read returns written checkpoint', async () => {
    const checkpoint = createCheckpoint({ lastCompletedItem: 'chapter-05' });
    await manager.write(checkpoint);

    const read = await manager.read('extraction');
    expect(read).not.toBeNull();
    expect(read!.componentId).toBe('extraction');
    expect(read!.lastCompletedItem).toBe('chapter-05');
    expect(read!.waveId).toBe('wave-0');
    expect(read!.resumeInstructions).toBe('Resume extraction from chapter 2');
  });

  it('read returns null for missing checkpoint', async () => {
    const result = await manager.read('nonexistent');
    expect(result).toBeNull();
  });

  it('rejects corrupted checkpoint on read', async () => {
    const checkpoint = createCheckpoint();
    await manager.write(checkpoint);

    // Manually corrupt the file by altering lastCompletedItem
    const filePath = path.join(tempDir, 'extraction-checkpoint.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    data.lastCompletedItem = 'chapter-99-tampered';
    fs.writeFileSync(filePath, JSON.stringify(data));

    await expect(manager.read('extraction')).rejects.toThrow(/integrity|corrupt/i);
  });

  it('validates stateHash on read (HARNESS-05)', async () => {
    const checkpoint = createCheckpoint();
    await manager.write(checkpoint);

    // Manually set a wrong stateHash
    const filePath = path.join(tempDir, 'extraction-checkpoint.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    data.stateHash = 'deadbeef0000000000000000000000000000000000000000000000000000dead';
    fs.writeFileSync(filePath, JSON.stringify(data));

    await expect(manager.read('extraction')).rejects.toThrow(/integrity|corrupt/i);
  });

  it('atomic write survives: no partial files on disk', async () => {
    const checkpoint = createCheckpoint();
    await manager.write(checkpoint);

    const files = fs.readdirSync(tempDir);
    const tmpFiles = files.filter(f => f.endsWith('.tmp'));
    expect(tmpFiles).toHaveLength(0);

    const jsonFiles = files.filter(f => f.endsWith('.json'));
    expect(jsonFiles).toHaveLength(1);
    expect(jsonFiles[0]).toBe('extraction-checkpoint.json');
  });

  it('getResumePoint returns lastCompletedItem', async () => {
    const checkpoint = createCheckpoint({ lastCompletedItem: 'chapter-05' });
    await manager.write(checkpoint);

    const resumePoint = await manager.getResumePoint('extraction');
    expect(resumePoint).toBe('chapter-05');
  });

  it('getResumePoint returns null when no checkpoint', async () => {
    const resumePoint = await manager.getResumePoint('nonexistent');
    expect(resumePoint).toBeNull();
  });
});
