import { describe, it, expect, vi } from 'vitest';
import {
  deploy,
  dryRun,
  verifyDeployment,
} from '../../../src/site/deploy';
import type { DeployAdapter } from '../../../src/site/deploy';
import type { DeployConfig } from '../../../src/site/types';

const config: DeployConfig = {
  method: 'ftp',
  host: 'ftp.example.com',
  user: 'deployer',
  path: '/public_html',
  exclude: ['*.map', '.DS_Store'],
};

function mockAdapter(): DeployAdapter {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    upload: vi.fn().mockResolvedValue(undefined),
    listRemote: vi.fn().mockResolvedValue([]),
    disconnect: vi.fn().mockResolvedValue(undefined),
  };
}

describe('dryRun', () => {
  it('lists files without uploading', async () => {
    const walkFn = vi.fn().mockResolvedValue([
      'index.html',
      'about/index.html',
      'style.css',
    ]);

    const result = await dryRun('/build', config, walkFn);
    expect(result.files).toHaveLength(3);
    expect(result.files).toContain('index.html');
    expect(result.totalSize).toBeGreaterThanOrEqual(0);
  });
});

describe('deploy', () => {
  it('calls adapter for each file', async () => {
    const adapter = mockAdapter();
    const walkFn = vi.fn().mockResolvedValue([
      'index.html',
      'about/index.html',
    ]);

    const result = await deploy('/build', config, adapter, { walkFn });
    expect(adapter.connect).toHaveBeenCalledOnce();
    expect(adapter.upload).toHaveBeenCalledTimes(2);
    expect(adapter.disconnect).toHaveBeenCalledOnce();
    expect(result.filesUploaded).toBe(2);
  });

  it('filters files matching exclude patterns', async () => {
    const adapter = mockAdapter();
    const walkFn = vi.fn().mockResolvedValue([
      'index.html',
      'app.js.map',
      '.DS_Store',
    ]);

    const result = await deploy('/build', config, adapter, { walkFn });
    expect(result.filesUploaded).toBe(1);
    expect(adapter.upload).toHaveBeenCalledTimes(1);
  });

  it('includes upload count in result', async () => {
    const adapter = mockAdapter();
    const walkFn = vi.fn().mockResolvedValue([
      'index.html',
      'style.css',
      'script.js',
    ]);

    const result = await deploy('/build', config, adapter, { walkFn });
    expect(result.filesUploaded).toBe(3);
    expect(result.errors).toEqual([]);
  });
});

describe('verifyDeployment', () => {
  it('checks index and llms.txt', async () => {
    const fetchFn = vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      status: 200,
    }));

    const result = await verifyDeployment('https://example.com', fetchFn);
    expect(result.indexOk).toBe(true);
    expect(result.llmsTxtOk).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('reports errors on missing files', async () => {
    const fetchFn = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('llms.txt')) {
        return { ok: false, status: 404 };
      }
      return { ok: true, status: 200 };
    });

    const result = await verifyDeployment('https://example.com', fetchFn);
    expect(result.indexOk).toBe(true);
    expect(result.llmsTxtOk).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
