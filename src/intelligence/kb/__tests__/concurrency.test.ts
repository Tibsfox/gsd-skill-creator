/**
 * C04 T7 — Dual-writer concurrency test (I12 safety-critical).
 *
 * Two worker processes write findings to the same SQLite WAL DB concurrently.
 * After both complete: total count must equal the sum of both writes.
 * No SQLITE_CORRUPT or constraint violation errors.
 *
 * Uses child_process.spawn with tsx for TS-aware execution.
 */
import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KBStore } from '../store.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, '../../db/migrations');
const REPO_ROOT = resolve(here, '../../../..');

// Child process worker script (TypeScript) written to a temp file
function makeWorkerScript(
  registryPath: string,
  projectId: string,
  snapshotId: string,
  findingCount: number,
  workerIndex: number,
): string {
  const storeTs = resolve(here, '../store.ts').replace(/\\/g, '/');
  const migrDir = MIGRATIONS_DIR.replace(/\\/g, '/');
  const regPath = registryPath.replace(/\\/g, '/');
  return `
import { KBStore } from '${storeTs}';

const store = new KBStore({
  registryPath: '${regPath}',
  migrationsDir: '${migrDir}',
  busyTimeoutMs: 10000,
});

async function run() {
  await store.ensureRegistry();
  await store.ensureProjectDB('${projectId}');

  const findings = Array.from({ length: ${findingCount} }, (_, i) => ({
    id: 'F-w${workerIndex}-' + String(i).padStart(5, '0'),
    project_id: '${projectId}',
    kind: 'dead_code' as const,
    severity: 'low' as const,
    confidence: 0.5,
    title: 'Finding ' + i,
    rationale: 'Worker ${workerIndex}',
    produced_by: 'analyzer' as const,
    produced_at: new Date().toISOString(),
    snapshot_id: '${snapshotId}',
    status: 'open' as const,
  }));

  const batchSize = 50;
  for (let i = 0; i < findings.length; i += batchSize) {
    await store.writeFindings('${snapshotId}', '${projectId}', findings.slice(i, i + batchSize));
    await new Promise(r => setTimeout(r, 0));
  }

  store.close();
  process.stdout.write(JSON.stringify({ ok: true, count: ${findingCount} }) + '\\n');
}

run().catch(err => {
  process.stdout.write(JSON.stringify({ ok: false, error: String(err) }) + '\\n');
  process.exit(1);
});
`;
}

async function spawnWorker(scriptPath: string): Promise<{ ok: boolean; count?: number; error?: string }> {
  return new Promise((resolve, reject) => {
    const tsxPath = join(REPO_ROOT, 'node_modules', '.bin', 'tsx');
    // On Windows the .bin/tsx entry is a shell shim (no .exe); spawn() can only
    // launch the .cmd variant directly, otherwise it throws ENOENT.
    const tsxBin = process.platform === 'win32' ? `${tsxPath}.cmd` : tsxPath;
    const child = spawn(
      tsxBin,
      [scriptPath],
      {
        cwd: REPO_ROOT,
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

    child.on('close', (code) => {
      try {
        const lastLine = stdout.trim().split('\n').pop() ?? '';
        if (lastLine) {
          resolve(JSON.parse(lastLine));
        } else {
          reject(new Error(`Worker exited with code ${code}. stderr: ${stderr}`));
        }
      } catch {
        reject(new Error(`Could not parse worker output: ${stdout}. stderr: ${stderr}`));
      }
    });

    child.on('error', reject);
  });
}

describe('intelligence/kb — dual-writer concurrency (I12)', () => {
  it(
    'two concurrent writers on same WAL DB produce correct total count (no corruption)',
    async () => {
      const tmpDir = join(
        tmpdir(),
        `gsd-concurrency-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      );
      mkdirSync(tmpDir, { recursive: true });

      // Set up the registry and project first (single-threaded setup)
      const projectId = 'conc-test-project';
      const store = new KBStore({
        registryPath: join(tmpDir, 'registry.db'),
        migrationsDir: MIGRATIONS_DIR,
        busyTimeoutMs: 10000,
      });
      await store.ensureRegistry();
      await store.registerProject({
        id: projectId,
        name: 'Concurrency Test',
        path: join(tmpDir, 'conc-project'),
        kind: 'code',
        priority: 'med',
        last_activity_at: new Date().toISOString(),
      });
      await store.ensureProjectDB(projectId);
      const snap = await store.writeSnapshot({
        project_id: projectId,
        taken_at: new Date().toISOString(),
        files_scanned: 0,
        loc_total: 0,
      });
      const snapshotId = snap.id;
      store.close();

      const findingsPerWorker = 500;
      const registryPath = join(tmpDir, 'registry.db');

      // Write worker scripts
      const w1Script = join(tmpDir, 'worker1.ts');
      const w2Script = join(tmpDir, 'worker2.ts');
      writeFileSync(w1Script, makeWorkerScript(registryPath, projectId, snapshotId, findingsPerWorker, 1));
      writeFileSync(w2Script, makeWorkerScript(registryPath, projectId, snapshotId, findingsPerWorker, 2));

      // Launch both workers concurrently
      const [r1, r2] = await Promise.all([
        spawnWorker(w1Script),
        spawnWorker(w2Script),
      ]);

      expect(r1.ok, `Worker 1 failed: ${r1.error}`).toBe(true);
      expect(r2.ok, `Worker 2 failed: ${r2.error}`).toBe(true);

      // Verify total count after both workers finish
      const verifyStore = new KBStore({
        registryPath,
        migrationsDir: MIGRATIONS_DIR,
      });
      await verifyStore.ensureRegistry();
      await verifyStore.ensureProjectDB(projectId);
      const findings = await verifyStore.listOpenFindings(projectId);
      verifyStore.close();

      expect(findings.length).toBe(findingsPerWorker * 2);

      rmSync(tmpDir, { recursive: true, force: true });
    },
    90000, // 90s timeout for this test
  );
});
