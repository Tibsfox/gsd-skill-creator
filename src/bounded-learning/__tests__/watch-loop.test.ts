import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { runWatchLoop } from '../watch-loop.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('runWatchLoop — debounced file-system watcher (v1.49.800)', () => {
  let workDir: string;
  let path1: string;
  let path2: string;

  beforeEach(() => {
    workDir = join(tmpdir(), `bl-watch-loop-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(workDir, { recursive: true });
    path1 = join(workDir, 'file-a.json');
    path2 = join(workDir, 'file-b.json');
    writeFileSync(path1, '{}', 'utf8');
    writeFileSync(path2, '{}', 'utf8');
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it('fires the callback after a single file change (debounced)', async () => {
    let calls = 0;
    const controller = new AbortController();
    const handle = runWatchLoop(
      [path1],
      () => {
        calls += 1;
      },
      { debounceMs: 50, signal: controller.signal },
    );
    await sleep(20);
    appendFileSync(path1, '{"v":1}\n', 'utf8');
    await sleep(150);
    controller.abort();
    await handle.done;
    expect(calls).toBeGreaterThanOrEqual(1);
  });

  it('coalesces rapid bursts into a single callback', async () => {
    let calls = 0;
    const controller = new AbortController();
    const handle = runWatchLoop(
      [path1],
      () => {
        calls += 1;
      },
      { debounceMs: 100, signal: controller.signal },
    );
    await sleep(20);
    // Five rapid writes within the debounce window.
    for (let i = 0; i < 5; i++) {
      appendFileSync(path1, `{"v":${i}}\n`, 'utf8');
      await sleep(5);
    }
    await sleep(200);
    controller.abort();
    await handle.done;
    // 5 writes within 100ms debounce → expect 1 callback.
    expect(calls).toBe(1);
  });

  it('fires once for each of two separate debounce windows', async () => {
    let calls = 0;
    const controller = new AbortController();
    const handle = runWatchLoop(
      [path1],
      () => {
        calls += 1;
      },
      { debounceMs: 50, signal: controller.signal },
    );
    await sleep(20);
    appendFileSync(path1, '{"v":1}\n', 'utf8');
    await sleep(150);
    appendFileSync(path1, '{"v":2}\n', 'utf8');
    await sleep(150);
    controller.abort();
    await handle.done;
    expect(calls).toBeGreaterThanOrEqual(2);
  });

  it('watches multiple paths and fires on change to any of them', async () => {
    let calls = 0;
    const controller = new AbortController();
    const handle = runWatchLoop(
      [path1, path2],
      () => {
        calls += 1;
      },
      { debounceMs: 50, signal: controller.signal },
    );
    await sleep(20);
    appendFileSync(path2, '{"v":1}\n', 'utf8');
    await sleep(150);
    controller.abort();
    await handle.done;
    expect(calls).toBeGreaterThanOrEqual(1);
  });

  it('fires immediately when fireImmediately:true', async () => {
    let calls = 0;
    const controller = new AbortController();
    const handle = runWatchLoop(
      [path1],
      () => {
        calls += 1;
      },
      { debounceMs: 50, signal: controller.signal, fireImmediately: true },
    );
    await sleep(50);
    controller.abort();
    await handle.done;
    expect(calls).toBeGreaterThanOrEqual(1);
  });

  it('stops cleanly when the abort signal fires', async () => {
    const controller = new AbortController();
    const handle = runWatchLoop([path1], () => {}, { signal: controller.signal });
    controller.abort();
    await handle.done;
    // `done` resolved within the abort handler — no hang.
    expect(true).toBe(true);
  });

  it('stops cleanly when stop() is called directly', async () => {
    const handle = runWatchLoop([path1], () => {});
    handle.stop();
    await handle.done;
    expect(true).toBe(true);
  });

  it('starts watching a path that does not yet exist (poller picks it up)', async () => {
    const missingPath = join(workDir, 'not-yet.json');
    let calls = 0;
    const controller = new AbortController();
    const handle = runWatchLoop(
      [missingPath],
      () => {
        calls += 1;
      },
      { debounceMs: 50, pollMs: 50, signal: controller.signal },
    );
    await sleep(100);
    writeFileSync(missingPath, '{}', 'utf8');
    await sleep(150);
    appendFileSync(missingPath, '{"v":1}\n', 'utf8');
    await sleep(200);
    controller.abort();
    await handle.done;
    expect(calls).toBeGreaterThanOrEqual(1);
  });
});
