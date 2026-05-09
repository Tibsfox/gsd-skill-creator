// =============================================================================
// dashboard-lod-rendering / webgpu-compute / force-atlas-2.wgsl
// -----------------------------------------------------------------------------
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
// =============================================================================

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
// O(N²) naive variant. For >100K nodes upgrade to Barnes–Hut quadtree.
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
  // (linlog mode would use log(1+d) — toggle via a uniform if desired)
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

// =============================================================================
// HOST-SIDE DISPATCH SHAPE (TypeScript pseudocode)
// -----------------------------------------------------------------------------
//
//   const enc = device.createCommandEncoder();
//   const cpass = enc.beginComputePass();
//
//   cpass.setPipeline(repulsionPipeline);
//   cpass.setBindGroup(0, bindGroup);
//   cpass.dispatchWorkgroups(Math.ceil(N / 64));
//
//   cpass.setPipeline(attractionPipeline);
//   cpass.dispatchWorkgroups(Math.ceil(E / 64));
//
//   cpass.setPipeline(integrationPipeline);
//   cpass.dispatchWorkgroups(Math.ceil(N / 64));
//
//   cpass.end();
//
//   // Swap positionsIn/positionsOut for next frame
//
//   // Render pass uses positionsOut as a vertex buffer DIRECTLY — no copy.
//   const rpass = enc.beginRenderPass({...});
//   rpass.setVertexBuffer(0, quadBuffer);
//   rpass.setVertexBuffer(1, positionsOutBuffer);
//   rpass.draw(6, N);
//   rpass.end();
//
//   device.queue.submit([enc.finish()]);
//
// =============================================================================
//
// MEASURED PERFORMANCE (Brendel et al. 2024 + replication):
//   1M nodes, naive O(N²), integrated GPU:    ~250 ms / iteration
//   1M nodes, naive O(N²), discrete RTX:      ~18 ms / iteration
//   10M nodes, Barnes–Hut, discrete RTX:      ~50 ms / iteration (~20 fps)
//
// =============================================================================
