import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { orchestratorCommand } from './orchestrator.js';
import { CorrectionQuarantineStore } from '../../learning/correction-quarantine.js';

// A transcript with one redo-pair: Write -> substantive human turn -> Edit.
function redoTranscript(): string {
  const ts = new Date(0).toISOString();
  const lines = [
    { type: 'assistant', uuid: 'w1', parentUuid: null, isSidechain: false, sessionId: 's', timestamp: ts,
      message: { role: 'assistant', content: [{ type: 'tool_use', name: 'Write',
        input: { file_path: '/f.ts', content: 'alpha beta gamma delta epsilon' } }] } },
    { type: 'user', uuid: 'u1', parentUuid: null, isSidechain: false, userType: 'external', timestamp: ts,
      message: { role: 'user', content: 'please redo this properly, it is wrong' } },
    { type: 'assistant', uuid: 'e2', parentUuid: null, isSidechain: false, sessionId: 's', timestamp: ts,
      message: { role: 'assistant', content: [{ type: 'tool_use', name: 'Edit',
        input: { file_path: '/f.ts', old_string: 'alpha beta gamma delta epsilon', new_string: 'one two three four five six seven' } }] } },
  ];
  return lines.map((l) => JSON.stringify(l)).join('\n') + '\n';
}

describe('orchestrator snapshot correction detection', () => {
  let root: string;
  let planningDir: string;
  let patternsDir: string;
  let transcriptPath: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'orch-detect-'));
    planningDir = join(root, '.planning');
    patternsDir = join(planningDir, 'patterns');
    transcriptPath = join(root, 'transcript.jsonl');
    delete process.env.SC_DISABLE_CORRECTION_DETECT;
  });

  afterEach(async () => {
    delete process.env.SC_DISABLE_CORRECTION_DETECT;
    await rm(root, { recursive: true, force: true });
  });

  const qCount = () => new CorrectionQuarantineStore(patternsDir).countPending();
  const feedbackFile = () => join(patternsDir, 'feedback.jsonl');

  it('detect-corrections writes a candidate to quarantine, never the feedback ledger', async () => {
    await writeFile(transcriptPath, redoTranscript(), 'utf-8');
    const code = await orchestratorCommand([
      'snapshot', 'detect-corrections',
      '--session-id=s', `--transcript-path=${transcriptPath}`, `--planning-dir=${planningDir}`,
    ]);
    expect(code).toBe(0);
    expect(await qCount()).toBe(1);
    expect(existsSync(feedbackFile())).toBe(false);
  });

  it('snapshot generate stores a snapshot AND populates quarantine, feedback ledger untouched', async () => {
    await writeFile(transcriptPath, redoTranscript(), 'utf-8');
    const code = await orchestratorCommand([
      'snapshot', 'generate',
      '--session-id=s', `--transcript-path=${transcriptPath}`, `--planning-dir=${planningDir}`,
    ]);
    expect(code).toBe(0);
    expect(existsSync(join(patternsDir, 'snapshots.jsonl'))).toBe(true);
    expect(await qCount()).toBe(1);
    expect(existsSync(feedbackFile())).toBe(false);
  });

  it('kill switch SC_DISABLE_CORRECTION_DETECT=1 writes nothing', async () => {
    await writeFile(transcriptPath, redoTranscript(), 'utf-8');
    process.env.SC_DISABLE_CORRECTION_DETECT = '1';
    const code = await orchestratorCommand([
      'snapshot', 'detect-corrections',
      '--session-id=s', `--transcript-path=${transcriptPath}`, `--planning-dir=${planningDir}`,
    ]);
    expect(code).toBe(0);
    expect(existsSync(join(patternsDir, 'correction-quarantine.jsonl'))).toBe(false);
  });

  it('does not throw on a malformed transcript', async () => {
    await writeFile(transcriptPath, 'not-json\n{"partial":\n', 'utf-8');
    const code = await orchestratorCommand([
      'snapshot', 'detect-corrections',
      '--session-id=s', `--transcript-path=${transcriptPath}`, `--planning-dir=${planningDir}`,
    ]);
    expect(code).toBe(0);
  });

  it('rejects a missing --transcript-path', async () => {
    const code = await orchestratorCommand(['snapshot', 'detect-corrections', '--session-id=s']);
    expect(code).toBe(1);
  });
});
