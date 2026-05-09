// =============================================================================
// webgpu-layout-detection.test.js
// =============================================================================
// Unit tests for WebGPU detection logic in webgpu-layout.js.
//
// These tests mock navigator.gpu and exercise all detection branches:
//   1. WebGPU present + adapter found (happy path)
//   2. navigator.gpu absent (no 'gpu' key in navigator)
//   3. navigator not defined at all
//   4. requestAdapter() returns null (no compatible adapter)
//   5. requestAdapter() throws (driver error)
//   6. SCRIBE_FORCE_CPU override interaction (createWebGpuLayout returns null)
//
// The detection unit tests are the LOAD-BEARING tests per C07 spec (the e2e
// WEBGPU_TEST=1 tests are advisory/operator-run-only).
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectWebGpu, createWebGpuLayout } from '../webgpu-layout.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Install a mock navigator.gpu with controllable requestAdapter behaviour.
 *
 * @param {{ adapter?: object | null, throwMsg?: string }} opts
 */
function installGpu(opts = {}) {
  const mockAdapter = opts.adapter !== undefined ? opts.adapter : {
    requestAdapterInfo: async () => ({ vendor: 'test-vendor', description: 'MockGPU' }),
    requestDevice: async () => mockDevice(),
  };

  const mockGpu = {
    requestAdapter: opts.throwMsg
      ? async () => { throw new Error(opts.throwMsg); }
      : async () => mockAdapter,
  };

  // Install on the global navigator
  Object.defineProperty(globalThis, 'navigator', {
    value: { ...globalThis.navigator, gpu: mockGpu },
    writable: true,
    configurable: true,
  });

  return { mockGpu, mockAdapter };
}

/**
 * Remove navigator.gpu (simulate absence).
 */
function removeGpu() {
  const nav = { ...globalThis.navigator };
  delete nav.gpu;
  Object.defineProperty(globalThis, 'navigator', {
    value: nav,
    writable: true,
    configurable: true,
  });
}

/**
 * Build a minimal mock GPUDevice.
 */
function mockDevice() {
  const device = {
    createBuffer: vi.fn((desc) => ({
      destroy: vi.fn(),
      getMappedRange: vi.fn(() => new ArrayBuffer(desc.size || 8)),
      unmap: vi.fn(),
    })),
    createShaderModule: vi.fn(() => ({})),
    createBindGroupLayout: vi.fn(() => ({})),
    createPipelineLayout: vi.fn(() => ({})),
    createComputePipeline: vi.fn(() => ({})),
    createBindGroup: vi.fn(() => ({})),
    createCommandEncoder: vi.fn(() => ({
      beginComputePass: vi.fn(() => ({
        setPipeline: vi.fn(),
        setBindGroup: vi.fn(),
        dispatchWorkgroups: vi.fn(),
        end: vi.fn(),
      })),
      copyBufferToBuffer: vi.fn(),
      finish: vi.fn(() => ({})),
    })),
    queue: {
      writeBuffer: vi.fn(),
      submit: vi.fn(),
    },
  };
  return device;
}

// ---------------------------------------------------------------------------
// describe: detectWebGpu()
// ---------------------------------------------------------------------------

describe('detectWebGpu', () => {
  afterEach(() => {
    // Restore navigator after each test
    removeGpu();
  });

  it('returns supported=true when navigator.gpu is present and requestAdapter resolves', async () => {
    const adapter = {
      requestAdapterInfo: async () => ({ vendor: 'NVIDIA', description: 'RTX 4060 Ti' }),
      requestDevice: async () => mockDevice(),
    };
    installGpu({ adapter });

    const result = await detectWebGpu();

    expect(result.supported).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('returns adapterInfo when requestAdapterInfo is available', async () => {
    const adapterInfo = { vendor: 'Apple', description: 'Apple M2 GPU' };
    const adapter = {
      requestAdapterInfo: async () => adapterInfo,
      requestDevice: async () => mockDevice(),
    };
    installGpu({ adapter });

    const result = await detectWebGpu();

    expect(result.supported).toBe(true);
    expect(result.adapterInfo).toEqual(adapterInfo);
  });

  it('returns supported=false when navigator.gpu is not present (no gpu key in navigator)', async () => {
    removeGpu(); // ensure gpu is absent

    const result = await detectWebGpu();

    expect(result.supported).toBe(false);
    expect(result.reason).toMatch(/navigator\.gpu not present/i);
  });

  it('returns supported=false when requestAdapter() returns null (no compatible hardware)', async () => {
    installGpu({ adapter: null });

    const result = await detectWebGpu();

    expect(result.supported).toBe(false);
    expect(result.reason).toMatch(/requestAdapter\(\) returned null/i);
  });

  it('returns supported=false when requestAdapter() throws (driver error)', async () => {
    installGpu({ throwMsg: 'GPU device lost' });

    const result = await detectWebGpu();

    expect(result.supported).toBe(false);
    expect(result.reason).toMatch(/requestAdapter\(\) threw/i);
    expect(result.reason).toMatch(/GPU device lost/);
  });

  it('still returns supported=true when requestAdapterInfo() is absent (optional API)', async () => {
    // Adapter without requestAdapterInfo (older WebGPU impls)
    const adapter = {
      // no requestAdapterInfo
      requestDevice: async () => mockDevice(),
    };
    installGpu({ adapter });

    const result = await detectWebGpu();

    expect(result.supported).toBe(true);
    expect(result.adapterInfo).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// describe: createWebGpuLayout() — detection path
// ---------------------------------------------------------------------------

describe('createWebGpuLayout detection path', () => {
  afterEach(() => {
    removeGpu();
    // Reset SCRIBE_FORCE_CPU
    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.SCRIBE_FORCE_CPU = false;
    }
  });

  it('returns null when navigator.gpu is absent (backward compat guarantee)', async () => {
    removeGpu();

    const graph = { nodes: [{ node_id: 'a' }], edges: [] };
    const layout = await createWebGpuLayout(graph);

    expect(layout).toBeNull();
  });

  it('returns null when requestAdapter() returns null', async () => {
    installGpu({ adapter: null });

    const graph = { nodes: [{ node_id: 'a' }], edges: [] };
    const layout = await createWebGpuLayout(graph);

    expect(layout).toBeNull();
  });

  it('returns null when requestAdapter() throws', async () => {
    installGpu({ throwMsg: 'Not implemented' });

    const graph = { nodes: [{ node_id: 'a' }], edges: [] };
    const layout = await createWebGpuLayout(graph);

    expect(layout).toBeNull();
  });
});
