// =============================================================================
// dashboard / webgpu-layout.js
// -----------------------------------------------------------------------------
// WebGPU-accelerated ForceAtlas2 graph layout engine for the SCRIBE dashboard.
//
// CAP ref: CAP-023 runtime (WGSL compute kernels live in dashboard).
// Component 07 — Wave 2 of v1.49.621 SCRIBE build-out.
//
// Architecture:
//   - detectWebGpu()       — probe navigator.gpu without initialising anything
//   - createWebGpuLayout() — initialise adapter/device/buffers/pipelines
//   - WebGpuLayout class   — drop-in surrogate for the CPU ForceLayout in app.js
//
// Backward compat guarantee:
//   In browsers without WebGPU (Firefox stable, old Safari), detectWebGpu()
//   returns { supported: false } and createWebGpuLayout() returns null.
//   app.js falls back to the existing CPU ForceLayout unchanged.
//
// Zero-dep ESM rule:
//   No npm imports. The WGSL source is INLINED as a JS string constant rather
//   than fetched from ../webgpu-compute/ because serve.mjs serves files ONLY
//   from DASHBOARD_DIR (the ../dashboard/ subtree).
//
// WGSL source cross-reference:
//   Canonical source: examples/cartridges/dashboard-lod-rendering/webgpu-compute/force-atlas-2.wgsl
//   Inlined below at WGSL_FORCE_ATLAS_2 (lines ~80–245).
//   The canonical file MUST remain byte-identical to the kernel bodies here.
//   DO NOT modify the kernels — they are T4 substrate (frozen per Wave 2 rules).
// =============================================================================

// ---------------------------------------------------------------------------
// WGSL source — inlined from:
//   examples/cartridges/dashboard-lod-rendering/webgpu-compute/force-atlas-2.wgsl
//
// BEGIN WGSL_FORCE_ATLAS_2
// ---------------------------------------------------------------------------
const WGSL_FORCE_ATLAS_2 = /* wgsl */`
// ForceAtlas2 layout on the GPU, three compute kernels (doc 03 §4, doc 07 §2.3).
//
// References:
//   - Jacomy, Venturini, Heymann, Bastian — "ForceAtlas2, a Continuous Graph
//     Layout Algorithm for Handy Network Visualization", PLOS ONE 2014,
//     doi:10.1371/journal.pone.0098679 (the canonical FA2 paper).
//   - Brendel et al. — "WebGPU for Graphs", IEEE VIS 2024 (the WebGPU
//     adaptation).
//
// Buffer shape:
//   positionsIn:  array<vec2<f32>>  — one per node
//   positionsOut: array<vec2<f32>>  — one per node (next iteration)
//   forces:       array<atomic<i32>> — 2N entries (x,y interleaved); fixed-point
//                                       (multiply by 1024) because WebGPU 1.0
//                                       does not yet have atomic<f32>.
//   degrees:      array<u32>        — one per node (FA2 attraction scaling)
//   edges:        array<vec2<u32>>  — (src, dst) per edge
//
// Workgroup size 64 is the WebGPU sweet spot (doc 03 §4.1).

struct Params {
  nodeCount: u32,
  edgeCount: u32,
  scaling: f32,        // FA2 'scaling ratio'; default 2.0
  gravity: f32,        // FA2 'gravity'; default 1.0
  speed: f32,          // integration step; default 1.0
  speedEfficiency: f32, // FA2 adaptive speed; ramp-down on instability
  pad0: f32, pad1: f32,
};

@group(0) @binding(0) var<storage, read>        positionsIn:  array<vec2<f32>>;
@group(0) @binding(1) var<storage, read_write>  positionsOut: array<vec2<f32>>;
@group(0) @binding(2) var<storage, read_write>  forces:       array<atomic<i32>>;
@group(0) @binding(3) var<storage, read>        degrees:      array<u32>;
@group(0) @binding(4) var<storage, read>        edges:        array<vec2<u32>>;
@group(0) @binding(5) var<uniform>              params:       Params;

const FIXED_POINT_SCALE: f32 = 1024.0;

// -- KERNEL 1: REPULSION ------------------------------------------------------
// O(N²) naive variant. For >100K nodes upgrade to Barnes-Hut quadtree.
// One thread per source node; loops over all destination nodes.

@compute @workgroup_size(64)
fn repulsionStep(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= params.nodeCount) { return; }

  let pi = positionsIn[i];
  let degI = f32(degrees[i] + 1u);

  var fx: f32 = 0.0;
  var fy: f32 = 0.0;

  for (var j: u32 = 0u; j < params.nodeCount; j = j + 1u) {
    if (j == i) { continue; }
    let pj = positionsIn[j];
    let degJ = f32(degrees[j] + 1u);
    let dx = pi.x - pj.x;
    let dy = pi.y - pj.y;
    let d2 = dx*dx + dy*dy + 0.0001;
    let d = sqrt(d2);
    // FA2 repulsion: F_r = k_r * (deg_i + 1) * (deg_j + 1) / d
    let f = params.scaling * degI * degJ / d2;
    fx = fx + dx * f;
    fy = fy + dy * f;
  }

  // Gravity toward origin (FA2 'gravity' parameter)
  fx = fx - pi.x * params.gravity * degI;
  fy = fy - pi.y * params.gravity * degI;

  // Accumulate into forces buffer (fixed-point atomic)
  atomicAdd(&forces[2u * i + 0u], i32(fx * FIXED_POINT_SCALE));
  atomicAdd(&forces[2u * i + 1u], i32(fy * FIXED_POINT_SCALE));
}

// -- KERNEL 2: ATTRACTION -----------------------------------------------------
// One thread per edge. Atomic-add forces to both endpoints.

@compute @workgroup_size(64)
fn attractionStep(@builtin(global_invocation_id) gid: vec3<u32>) {
  let e = gid.x;
  if (e >= params.edgeCount) { return; }

  let edge = edges[e];
  let src = edge.x;
  let dst = edge.y;

  let pa = positionsIn[src];
  let pb = positionsIn[dst];
  let dx = pb.x - pa.x;
  let dy = pb.y - pa.y;

  // FA2 attraction: F_a = d (linear in distance)
  let fx = dx;
  let fy = dy;

  // Add to source (positive direction)
  atomicAdd(&forces[2u * src + 0u], i32(fx * FIXED_POINT_SCALE));
  atomicAdd(&forces[2u * src + 1u], i32(fy * FIXED_POINT_SCALE));
  // Subtract from destination (Newton's third law)
  atomicSub(&forces[2u * dst + 0u], i32(fx * FIXED_POINT_SCALE));
  atomicSub(&forces[2u * dst + 1u], i32(fy * FIXED_POINT_SCALE));
}

// -- KERNEL 3: INTEGRATION ----------------------------------------------------
// One thread per node. Read accumulated force; integrate; write new position.
// Then RESET the force atomic to 0 for the next iteration.

@compute @workgroup_size(64)
fn integrationStep(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= params.nodeCount) { return; }

  let fx_fixed = atomicLoad(&forces[2u * i + 0u]);
  let fy_fixed = atomicLoad(&forces[2u * i + 1u]);
  let fx = f32(fx_fixed) / FIXED_POINT_SCALE;
  let fy = f32(fy_fixed) / FIXED_POINT_SCALE;

  // Reset for next iteration
  atomicStore(&forces[2u * i + 0u], 0i);
  atomicStore(&forces[2u * i + 1u], 0i);

  let p = positionsIn[i];
  let speed = params.speed * params.speedEfficiency;
  let degI = f32(degrees[i] + 1u);
  let stepX = fx * speed / degI;
  let stepY = fy * speed / degI;

  // Clamp the per-step displacement (FA2's 'tolerance' / 'jitter' guard)
  let stepLen = sqrt(stepX*stepX + stepY*stepY);
  let maxStep: f32 = 10.0;
  let scale = min(1.0, maxStep / max(stepLen, 0.0001));

  positionsOut[i] = vec2<f32>(p.x + stepX * scale, p.y + stepY * scale);
}
`;
// ---------------------------------------------------------------------------
// END WGSL_FORCE_ATLAS_2 (inlined from webgpu-compute/force-atlas-2.wgsl)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Alpha threshold below which layout is considered settled (matches CPU ForceLayout). */
const SETTLED_ALPHA = 0.08;

/** Initial alpha (cooling factor). */
const INITIAL_ALPHA = 1.0;

/** Alpha decay per step (matches app.js `state.layoutAlpha * 0.985`). */
const ALPHA_DECAY = 0.985;

/** FA2 params defaults. */
const DEFAULT_SCALING = 2.0;
const DEFAULT_GRAVITY = 1.0;
const DEFAULT_SPEED = 1.0;
const DEFAULT_SPEED_EFFICIENCY = 1.0;

// ---------------------------------------------------------------------------
// detectWebGpu()
// ---------------------------------------------------------------------------

/**
 * Detect WebGPU support without initialising anything.
 *
 * @returns {Promise<{ supported: boolean; reason?: string; adapterInfo?: object }>}
 */
export async function detectWebGpu() {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
    return { supported: false, reason: 'navigator.gpu not present' };
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return { supported: false, reason: 'requestAdapter() returned null (no compatible GPU adapter found)' };
    }
    // Collect adapter info for logging. requestAdapterInfo() is optional in the spec.
    let adapterInfo = null;
    try {
      if (typeof adapter.requestAdapterInfo === 'function') {
        adapterInfo = await adapter.requestAdapterInfo();
      }
    } catch (_) {
      // requestAdapterInfo is optional — ignore errors
    }
    return { supported: true, adapterInfo };
  } catch (err) {
    return { supported: false, reason: `requestAdapter() threw: ${err.message}` };
  }
}

// ---------------------------------------------------------------------------
// createWebGpuLayout()
// ---------------------------------------------------------------------------

/**
 * Initialise a WebGPU layout engine for the given graph.
 *
 * Returns null if WebGPU is unavailable (caller falls back to CPU ForceLayout).
 *
 * @param {{ nodes: Array<{ node_id: string }>, edges: Array<{ src_id: string, dst_id: string, edge_id: string }>, params?: object }} graph
 * @returns {Promise<WebGpuLayout | null>}
 */
export async function createWebGpuLayout(graph) {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
    return null;
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return null;
    const device = await adapter.requestDevice();

    // Log adapter info to console for DevTools verification.
    try {
      if (typeof adapter.requestAdapterInfo === 'function') {
        const info = await adapter.requestAdapterInfo();
        console.info('[SCRIBE WebGPU] Adapter:', info.description || info.vendor || 'unknown');
      }
    } catch (_) {}
    console.info('[SCRIBE WebGPU] Device acquired; initialising ForceAtlas2 compute pipeline');

    return new WebGpuLayout(device, graph);
  } catch (err) {
    console.warn('[SCRIBE WebGPU] Initialisation failed, falling back to CPU layout:', err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// WebGpuLayout class
// ---------------------------------------------------------------------------

/**
 * GPU-accelerated ForceAtlas2 layout engine.
 *
 * Mirrors the CPU ForceLayout interface in app.js:
 *   - step()        — run one compute pass (repulsion + attraction + integration)
 *   - isSettled()   — convergence check (alpha < SETTLED_ALPHA)
 *   - getPositions() — readback GPU buffer → Map<node_id, {x, y}>
 *   - destroy()     — release GPU resources
 */
export class WebGpuLayout {
  /**
   * @param {GPUDevice} device
   * @param {{ nodes: Array, edges: Array, params?: object }} graph
   */
  constructor(device, graph) {
    this._device = device;
    this._nodes = graph.nodes;
    this._edges = graph.edges;
    this._alpha = INITIAL_ALPHA;
    this._iterations = 0;
    this._destroyed = false;

    const N = this._nodes.length;
    const E = this._edges.length;

    // Build node_id → index mapping
    this._nodeIndex = new Map();
    this._nodes.forEach((n, i) => this._nodeIndex.set(n.node_id, i));

    // Compute per-node degrees
    const degrees = new Uint32Array(N);
    for (const e of this._edges) {
      const si = this._nodeIndex.get(e.src_id);
      const di = this._nodeIndex.get(e.dst_id);
      if (si !== undefined) degrees[si]++;
      if (di !== undefined) degrees[di]++;
    }

    // --------------- Initial circular positions (matches CPU ForceLayout) ----
    const initialPositions = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      initialPositions[i * 2]     = Math.cos(a) * 220;
      initialPositions[i * 2 + 1] = Math.sin(a) * 220;
    }

    // Edge buffer: vec2<u32> per edge
    const edgeData = new Uint32Array(E * 2);
    for (let e = 0; e < E; e++) {
      const edge = this._edges[e];
      const si = this._nodeIndex.get(edge.src_id) ?? 0;
      const di = this._nodeIndex.get(edge.dst_id) ?? 0;
      edgeData[e * 2]     = si;
      edgeData[e * 2 + 1] = di;
    }

    // --------------- GPU buffers ---------------------------------------------
    const posSize   = N * 2 * 4;  // N * vec2<f32>
    const forceSize = N * 2 * 4;  // N * 2 * i32 (fixed-point)
    const degSize   = N * 4;      // N * u32
    const edgeSize  = Math.max(E * 2 * 4, 8); // min 8 bytes for zero-edge graphs

    // Params uniform (8 × f32/u32 = 32 bytes)
    const PARAMS_SIZE = 32;

    this._positionsABuf = device.createBuffer({
      size: posSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    this._positionsBBuf = device.createBuffer({
      size: posSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    this._forcesBuf = device.createBuffer({
      size: forceSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this._degreesBuf = device.createBuffer({
      size: degSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this._edgesBuf = device.createBuffer({
      size: edgeSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this._paramsBuf = device.createBuffer({
      size: PARAMS_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this._readbackBuf = device.createBuffer({
      size: posSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    // Upload initial data
    device.queue.writeBuffer(this._positionsABuf, 0, initialPositions);
    device.queue.writeBuffer(this._positionsBBuf, 0, initialPositions);
    device.queue.writeBuffer(this._degreesBuf, 0, degrees);
    if (E > 0) {
      device.queue.writeBuffer(this._edgesBuf, 0, edgeData);
    }
    // Forces buffer starts zeroed (WebGPU guarantees zeroed allocation)

    // Params — write initial values
    this._nodeCount = N;
    this._edgeCount = E;
    this._writeParams(DEFAULT_SPEED, DEFAULT_SPEED_EFFICIENCY);

    // --------------- Shader module -------------------------------------------
    const shaderModule = device.createShaderModule({ code: WGSL_FORCE_ATLAS_2 });

    // --------------- Bind group layout (shared by all 3 pipelines) -----------
    const bgl = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 5, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    });
    this._bgl = bgl;

    const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [bgl] });

    // --------------- Compute pipelines (one per kernel entry point) ----------
    this._repulsionPipeline = device.createComputePipeline({
      layout: pipelineLayout,
      compute: { module: shaderModule, entryPoint: 'repulsionStep' },
    });
    this._attractionPipeline = device.createComputePipeline({
      layout: pipelineLayout,
      compute: { module: shaderModule, entryPoint: 'attractionStep' },
    });
    this._integrationPipeline = device.createComputePipeline({
      layout: pipelineLayout,
      compute: { module: shaderModule, entryPoint: 'integrationStep' },
    });

    // --------------- Bind groups (A→B and B→A for double-buffering) ----------
    this._bindGroupAtoB = this._createBindGroup(bgl, this._positionsABuf, this._positionsBBuf);
    this._bindGroupBtoA = this._createBindGroup(bgl, this._positionsBBuf, this._positionsABuf);

    // Track which buffer holds the latest positions (starts with A)
    this._currentPosIsA = true;

    // Store initial positions in JS for getPositions() before first GPU step
    this._cachedPositions = null;
    this._initialPositions = initialPositions;
  }

  // ---------------------------------------------------------------------------
  // Private: create a bind group
  // ---------------------------------------------------------------------------
  _createBindGroup(bgl, posIn, posOut) {
    return this._device.createBindGroup({
      layout: bgl,
      entries: [
        { binding: 0, resource: { buffer: posIn } },
        { binding: 1, resource: { buffer: posOut } },
        { binding: 2, resource: { buffer: this._forcesBuf } },
        { binding: 3, resource: { buffer: this._degreesBuf } },
        { binding: 4, resource: { buffer: this._edgesBuf } },
        { binding: 5, resource: { buffer: this._paramsBuf } },
      ],
    });
  }

  // ---------------------------------------------------------------------------
  // Private: write params uniform
  // ---------------------------------------------------------------------------
  _writeParams(speed, speedEfficiency) {
    // struct Params { nodeCount: u32, edgeCount: u32, scaling: f32, gravity: f32,
    //                 speed: f32, speedEfficiency: f32, pad0: f32, pad1: f32 }
    const paramsData = new ArrayBuffer(32);
    const u32 = new Uint32Array(paramsData);
    const f32 = new Float32Array(paramsData);
    u32[0] = this._nodeCount;
    u32[1] = this._edgeCount;
    f32[2] = DEFAULT_SCALING;
    f32[3] = DEFAULT_GRAVITY;
    f32[4] = speed;
    f32[5] = speedEfficiency;
    f32[6] = 0;
    f32[7] = 0;
    this._device.queue.writeBuffer(this._paramsBuf, 0, paramsData);
  }

  // ---------------------------------------------------------------------------
  // Public API (mirrors CPU ForceLayout)
  // ---------------------------------------------------------------------------

  /**
   * Run one layout iteration (GPU compute pass: repulsion + attraction + integration).
   * Fire-and-forget; does NOT wait for GPU completion. Call getPositions() to readback.
   *
   * @returns {Promise<void>}
   */
  async step() {
    if (this._destroyed) return;

    // Update params with current alpha-derived speed
    const speed = DEFAULT_SPEED * this._alpha;
    this._writeParams(speed, DEFAULT_SPEED_EFFICIENCY);

    const N = this._nodeCount;
    const E = this._edgeCount;
    const wgN = Math.ceil(N / 64);
    const wgE = Math.max(Math.ceil(E / 64), 1);

    const bindGroup = this._currentPosIsA ? this._bindGroupAtoB : this._bindGroupBtoA;

    const encoder = this._device.createCommandEncoder();
    const pass = encoder.beginComputePass();

    // Kernel 1: Repulsion (one dispatch per node)
    pass.setPipeline(this._repulsionPipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(wgN);

    // Kernel 2: Attraction (one dispatch per edge)
    pass.setPipeline(this._attractionPipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(wgE);

    // Kernel 3: Integration (one dispatch per node)
    pass.setPipeline(this._integrationPipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(wgN);

    pass.end();
    this._device.queue.submit([encoder.finish()]);

    // Swap buffers for next iteration (double-buffering)
    this._currentPosIsA = !this._currentPosIsA;

    // Cool down
    this._alpha = Math.max(SETTLED_ALPHA * 0.9, this._alpha * ALPHA_DECAY);
    this._iterations++;
    this._cachedPositions = null; // invalidate cache
  }

  /**
   * Returns true when the layout has converged (alpha < SETTLED_ALPHA).
   * Matches the CPU ForceLayout.isSettled() contract.
   *
   * @returns {boolean}
   */
  isSettled() {
    return this._alpha < SETTLED_ALPHA;
  }

  /**
   * Read back the current node positions from the GPU.
   * Returns a Map<node_id, { x: number, y: number }> matching app.js state.positions format.
   *
   * @returns {Promise<Map<string, { x: number, y: number }>>}
   */
  async getPositions() {
    if (this._destroyed) return new Map();

    // If no step has run yet, return the initial circular positions
    if (this._iterations === 0) {
      return this._buildPositionMap(this._initialPositions);
    }

    // Return cached result if still valid
    if (this._cachedPositions) return this._cachedPositions;

    // The "current" output buffer (the one written by the most recent step)
    // After a step, currentPosIsA has been flipped: if it's now A, the output was B.
    const outputBuf = this._currentPosIsA ? this._positionsBBuf : this._positionsABuf;
    const posSize = this._nodeCount * 2 * 4;

    const encoder = this._device.createCommandEncoder();
    encoder.copyBufferToBuffer(outputBuf, 0, this._readbackBuf, 0, posSize);
    this._device.queue.submit([encoder.finish()]);

    await this._readbackBuf.mapAsync(GPUMapMode.READ, 0, posSize);
    const mapped = this._readbackBuf.getMappedRange(0, posSize);
    const positions = new Float32Array(mapped.slice(0));
    this._readbackBuf.unmap();

    this._cachedPositions = this._buildPositionMap(positions);
    return this._cachedPositions;
  }

  /**
   * Build a Map<node_id, {x, y}> from a Float32Array (interleaved x, y per node).
   * @param {Float32Array} arr
   * @returns {Map<string, {x: number, y: number}>}
   */
  _buildPositionMap(arr) {
    const map = new Map();
    for (let i = 0; i < this._nodes.length; i++) {
      map.set(this._nodes[i].node_id, {
        x: arr[i * 2],
        y: arr[i * 2 + 1],
        vx: 0,
        vy: 0,
      });
    }
    return map;
  }

  /**
   * Release all GPU resources. After calling destroy(), this instance is unusable.
   */
  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._cachedPositions = null;

    // Destroy all buffers
    const bufs = [
      this._positionsABuf, this._positionsBBuf,
      this._forcesBuf, this._degreesBuf,
      this._edgesBuf, this._paramsBuf,
      this._readbackBuf,
    ];
    for (const buf of bufs) {
      try { buf.destroy(); } catch (_) {}
    }
    console.info('[SCRIBE WebGPU] Layout engine destroyed; GPU resources released');
  }
}
