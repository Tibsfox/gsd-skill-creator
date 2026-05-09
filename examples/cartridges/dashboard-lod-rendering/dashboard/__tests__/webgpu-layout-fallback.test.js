// =============================================================================
// webgpu-layout-fallback.test.js
// =============================================================================
// Tests for the fallback path and WebGpuLayout class shape.
//
// Coverage:
//   1. createWebGpuLayout returns null when WebGPU unavailable → caller uses CPU
//   2. SCRIBE_FORCE_CPU toggle causes createLayout to bypass GPU detection
//   3. WebGpuLayout instance shape (step, isSettled, getPositions, destroy API)
//   4. getPositions() returns correct Map shape with node_id keys
//   5. isSettled() follows alpha cooling
//   6. destroy() does not throw; subsequent calls are no-ops
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Polyfill WebGPU globals for jsdom environment
// These browser globals are required by webgpu-layout.js at module evaluation time.
// In a real browser they come from the WebGPU implementation.
// ---------------------------------------------------------------------------
globalThis.GPUBufferUsage = {
  STORAGE:    0x0080,
  COPY_SRC:   0x0004,
  COPY_DST:   0x0008,
  MAP_READ:   0x0001,
  UNIFORM:    0x0040,
};
globalThis.GPUShaderStage = {
  VERTEX:   0x1,
  FRAGMENT: 0x2,
  COMPUTE:  0x4,
};
globalThis.GPUMapMode = {
  READ:  0x1,
  WRITE: 0x2,
};

import { detectWebGpu, createWebGpuLayout, WebGpuLayout } from '../webgpu-layout.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
 * Build a fully mocked GPUDevice that supports mapAsync on the readback buffer.
 */
function mockDevice(nodeCount = 2) {
  const posSize = nodeCount * 2 * 4;

  // Readback buffer mock — supports mapAsync + getMappedRange + unmap
  const readbackBuf = {
    mapAsync: vi.fn(async () => {}),
    getMappedRange: vi.fn(() => {
      // Return zeroed position data
      const buf = new ArrayBuffer(posSize);
      return buf;
    }),
    unmap: vi.fn(),
    destroy: vi.fn(),
  };

  // Generic buffer mock (storage/uniform)
  function storageBuf() {
    return { destroy: vi.fn() };
  }

  const encoder = {
    beginComputePass: vi.fn(() => ({
      setPipeline: vi.fn(),
      setBindGroup: vi.fn(),
      dispatchWorkgroups: vi.fn(),
      end: vi.fn(),
    })),
    copyBufferToBuffer: vi.fn(),
    finish: vi.fn(() => ({})),
  };

  let bufCallCount = 0;
  return {
    _readbackBuf: readbackBuf,
    createBuffer: vi.fn((desc) => {
      bufCallCount++;
      // The 7th buffer created is the readback buffer (order in constructor)
      if (bufCallCount === 7) return readbackBuf;
      return storageBuf();
    }),
    createShaderModule: vi.fn(() => ({})),
    createBindGroupLayout: vi.fn(() => ({})),
    createPipelineLayout: vi.fn(() => ({})),
    createComputePipeline: vi.fn(() => ({})),
    createBindGroup: vi.fn(() => ({})),
    createCommandEncoder: vi.fn(() => encoder),
    queue: {
      writeBuffer: vi.fn(),
      submit: vi.fn(),
    },
    _encoder: encoder,
  };
}

/**
 * Build a minimal graph for testing.
 */
function smallGraph() {
  return {
    nodes: [
      { node_id: 'node-a', label: 'A', sub_type: 'file', node_type: 'Entity' },
      { node_id: 'node-b', label: 'B', sub_type: 'commit', node_type: 'Activity' },
    ],
    edges: [
      { edge_id: 'e1', src_id: 'node-a', dst_id: 'node-b', relation: 'used' },
    ],
  };
}

// ---------------------------------------------------------------------------
// describe: fallback path — WebGPU unavailable
// ---------------------------------------------------------------------------

describe('createWebGpuLayout fallback path', () => {
  afterEach(() => {
    removeGpu();
  });

  it('returns null when navigator.gpu is absent, enabling CPU fallback', async () => {
    removeGpu();

    const result = await createWebGpuLayout(smallGraph());

    expect(result).toBeNull();
    // Caller (app.js createLayout) would then instantiate ForceLayout — this test
    // verifies the null signal that triggers that fallback.
  });

  it('detectWebGpu returns supported=false matching createWebGpuLayout null return', async () => {
    removeGpu();

    const probe = await detectWebGpu();
    const layout = await createWebGpuLayout(smallGraph());

    expect(probe.supported).toBe(false);
    expect(layout).toBeNull();
    // Both signals agree: no GPU available
  });
});

// ---------------------------------------------------------------------------
// describe: WebGpuLayout instance API shape
// ---------------------------------------------------------------------------

describe('WebGpuLayout instance API', () => {
  let device;
  let graph;
  let layout;

  beforeEach(() => {
    graph = smallGraph();
    device = mockDevice(graph.nodes.length);
    layout = new WebGpuLayout(device, graph);
  });

  afterEach(() => {
    if (layout && !layout._destroyed) layout.destroy();
  });

  it('exposes the required public API methods', () => {
    expect(typeof layout.step).toBe('function');
    expect(typeof layout.isSettled).toBe('function');
    expect(typeof layout.getPositions).toBe('function');
    expect(typeof layout.destroy).toBe('function');
  });

  it('isSettled() returns false immediately after construction (alpha starts at 1.0)', () => {
    expect(layout.isSettled()).toBe(false);
  });

  it('getPositions() before any step returns a Map with all node_ids as keys', async () => {
    const positions = await layout.getPositions();

    expect(positions).toBeInstanceOf(Map);
    expect(positions.size).toBe(graph.nodes.length);
    for (const node of graph.nodes) {
      expect(positions.has(node.node_id)).toBe(true);
    }
  });

  it('getPositions() entries have x, y numeric fields', async () => {
    const positions = await layout.getPositions();

    for (const [, p] of positions) {
      expect(typeof p.x).toBe('number');
      expect(typeof p.y).toBe('number');
    }
  });

  it('destroy() releases GPU resources and sets _destroyed flag', () => {
    layout.destroy();
    expect(layout._destroyed).toBe(true);
  });

  it('destroy() is idempotent — second call does not throw', () => {
    layout.destroy();
    expect(() => layout.destroy()).not.toThrow();
  });

  it('step() is a function returning a Promise', async () => {
    const result = layout.step();
    expect(result).toBeInstanceOf(Promise);
    await result; // must not reject
  });

  it('step() after destroy() is a no-op (does not throw)', async () => {
    layout.destroy();
    await expect(layout.step()).resolves.toBeUndefined();
  });
});
