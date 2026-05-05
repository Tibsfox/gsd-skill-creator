/**
 * WebGL2 renderer using instanced-circle (nodes) + instanced-line (edges).
 *
 * Uses ANGLE_instanced_arrays-equivalent core WebGL2 instancing. One draw call
 * per primitive type per frame; per-node attributes (position, radius, color)
 * are streamed via a single dynamically-updated VBO. Pan/zoom is encoded in a
 * 4×4 view-projection uniform.
 *
 * No DOM/WebGL2 globals are referenced at module load — types only — so this
 * module imports cleanly under node/jsdom for tests; runtime callers must pass
 * a live WebGL2RenderingContext.
 *
 * @module atlas/graph-renderer/renderer-webgl2
 */

import { type ViewportState, viewProjectionMatrix } from './viewport.js';

// Type-only reference to the browser global; no runtime dependency.
type GL = WebGL2RenderingContext;

export interface NodeVertex {
  x: number;
  y: number;
  radius: number;
  /** Packed 0xRRGGBBAA. */
  color: number;
}

export interface EdgeVertex {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Packed 0xRRGGBBAA. */
  color: number;
}

export interface RendererHandle {
  readonly gl: GL;
  readonly nodeProgram: WebGLProgram;
  readonly edgeProgram: WebGLProgram;
  readonly nodeVAO: WebGLVertexArrayObject;
  readonly edgeVAO: WebGLVertexArrayObject;
  readonly nodeInstanceBuffer: WebGLBuffer;
  readonly edgeInstanceBuffer: WebGLBuffer;
  readonly quadBuffer: WebGLBuffer;
  readonly nodeUniformVP: WebGLUniformLocation;
  readonly edgeUniformVP: WebGLUniformLocation;
  capacity: { nodes: number; edges: number };
}

const NODE_VS = /* glsl */ `#version 300 es
layout(location=0) in vec2 a_corner;       // unit quad corner in [-1, 1]
layout(location=1) in vec2 a_center;       // per-instance world position
layout(location=2) in float a_radius;      // per-instance radius
layout(location=3) in vec4 a_color;        // per-instance color
uniform mat4 u_vp;
out vec2 v_corner;
out vec4 v_color;
void main() {
  v_corner = a_corner;
  v_color = a_color;
  vec2 world = a_center + a_corner * a_radius;
  gl_Position = u_vp * vec4(world, 0.0, 1.0);
}
`;

const NODE_FS = /* glsl */ `#version 300 es
precision mediump float;
in vec2 v_corner;
in vec4 v_color;
out vec4 outColor;
void main() {
  // Soft circle with 1-pixel-ish AA edge (in unit-quad space).
  float r = length(v_corner);
  float aa = fwidth(r);
  float a = 1.0 - smoothstep(1.0 - aa, 1.0, r);
  if (a <= 0.0) discard;
  outColor = vec4(v_color.rgb, v_color.a * a);
}
`;

const EDGE_VS = /* glsl */ `#version 300 es
layout(location=0) in float a_t;           // 0 or 1 along the segment
layout(location=1) in vec2 a_p0;           // per-instance segment start
layout(location=2) in vec2 a_p1;           // per-instance segment end
layout(location=3) in vec4 a_color;
uniform mat4 u_vp;
out vec4 v_color;
void main() {
  v_color = a_color;
  vec2 world = mix(a_p0, a_p1, a_t);
  gl_Position = u_vp * vec4(world, 0.0, 1.0);
}
`;

const EDGE_FS = /* glsl */ `#version 300 es
precision mediump float;
in vec4 v_color;
out vec4 outColor;
void main() { outColor = v_color; }
`;

export function createRenderer(gl: GL, initialCapacity = { nodes: 4096, edges: 8192 }): RendererHandle {
  const nodeProgram = mustLinkProgram(gl, NODE_VS, NODE_FS);
  const edgeProgram = mustLinkProgram(gl, EDGE_VS, EDGE_FS);

  // Unit quad shared by all node instances.
  const quadBuffer = mustCreateBuffer(gl);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );

  // Per-instance node buffer (center.xy, radius, color.rgba) → 7 floats.
  const nodeInstanceBuffer = mustCreateBuffer(gl);
  gl.bindBuffer(gl.ARRAY_BUFFER, nodeInstanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, initialCapacity.nodes * 7 * 4, gl.DYNAMIC_DRAW);

  const nodeVAO = mustCreateVAO(gl);
  gl.bindVertexArray(nodeVAO);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, nodeInstanceBuffer);
  // a_center
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 7 * 4, 0);
  gl.vertexAttribDivisor(1, 1);
  // a_radius
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 7 * 4, 2 * 4);
  gl.vertexAttribDivisor(2, 1);
  // a_color
  gl.enableVertexAttribArray(3);
  gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 7 * 4, 3 * 4);
  gl.vertexAttribDivisor(3, 1);
  gl.bindVertexArray(null);

  // Edge: 2-vertex line list shared (a_t = 0 or 1) + per-instance p0, p1, color.
  const edgeQuadBuffer = mustCreateBuffer(gl);
  gl.bindBuffer(gl.ARRAY_BUFFER, edgeQuadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1]), gl.STATIC_DRAW);

  const edgeInstanceBuffer = mustCreateBuffer(gl);
  gl.bindBuffer(gl.ARRAY_BUFFER, edgeInstanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, initialCapacity.edges * 8 * 4, gl.DYNAMIC_DRAW);

  const edgeVAO = mustCreateVAO(gl);
  gl.bindVertexArray(edgeVAO);
  gl.bindBuffer(gl.ARRAY_BUFFER, edgeQuadBuffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, edgeInstanceBuffer);
  gl.enableVertexAttribArray(1); // a_p0
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 8 * 4, 0);
  gl.vertexAttribDivisor(1, 1);
  gl.enableVertexAttribArray(2); // a_p1
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 8 * 4, 2 * 4);
  gl.vertexAttribDivisor(2, 1);
  gl.enableVertexAttribArray(3); // a_color
  gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 8 * 4, 4 * 4);
  gl.vertexAttribDivisor(3, 1);
  gl.bindVertexArray(null);

  const nodeUniformVP = mustGetUniform(gl, nodeProgram, 'u_vp');
  const edgeUniformVP = mustGetUniform(gl, edgeProgram, 'u_vp');

  return {
    gl,
    nodeProgram,
    edgeProgram,
    nodeVAO,
    edgeVAO,
    nodeInstanceBuffer,
    edgeInstanceBuffer,
    quadBuffer,
    nodeUniformVP,
    edgeUniformVP,
    capacity: { ...initialCapacity },
  };
}

export function uploadNodes(handle: RendererHandle, nodes: readonly NodeVertex[]): void {
  const { gl } = handle;
  const buf = new Float32Array(nodes.length * 7);
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]!;
    const o = i * 7;
    buf[o] = n.x;
    buf[o + 1] = n.y;
    buf[o + 2] = n.radius;
    buf[o + 3] = ((n.color >>> 24) & 0xff) / 255;
    buf[o + 4] = ((n.color >>> 16) & 0xff) / 255;
    buf[o + 5] = ((n.color >>> 8) & 0xff) / 255;
    buf[o + 6] = (n.color & 0xff) / 255;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, handle.nodeInstanceBuffer);
  if (nodes.length > handle.capacity.nodes) {
    gl.bufferData(gl.ARRAY_BUFFER, buf, gl.DYNAMIC_DRAW);
    handle.capacity.nodes = nodes.length;
  } else {
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, buf);
  }
}

export function uploadEdges(handle: RendererHandle, edges: readonly EdgeVertex[]): void {
  const { gl } = handle;
  const buf = new Float32Array(edges.length * 8);
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i]!;
    const o = i * 8;
    buf[o] = e.x0;
    buf[o + 1] = e.y0;
    buf[o + 2] = e.x1;
    buf[o + 3] = e.y1;
    buf[o + 4] = ((e.color >>> 24) & 0xff) / 255;
    buf[o + 5] = ((e.color >>> 16) & 0xff) / 255;
    buf[o + 6] = ((e.color >>> 8) & 0xff) / 255;
    buf[o + 7] = (e.color & 0xff) / 255;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, handle.edgeInstanceBuffer);
  if (edges.length > handle.capacity.edges) {
    gl.bufferData(gl.ARRAY_BUFFER, buf, gl.DYNAMIC_DRAW);
    handle.capacity.edges = edges.length;
  } else {
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, buf);
  }
}

export interface DrawFrame {
  nodeCount: number;
  edgeCount: number;
  viewport: ViewportState;
  /** Optional flags from ./lod.ts to skip primitives. */
  drawNodes?: boolean;
  drawEdges?: boolean;
}

export function drawFrame(handle: RendererHandle, frame: DrawFrame): void {
  const { gl } = handle;
  const vp = viewProjectionMatrix(frame.viewport);
  gl.viewport(0, 0, frame.viewport.width, frame.viewport.height);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  if ((frame.drawEdges ?? true) && frame.edgeCount > 0) {
    gl.useProgram(handle.edgeProgram);
    gl.uniformMatrix4fv(handle.edgeUniformVP, false, vp);
    gl.bindVertexArray(handle.edgeVAO);
    gl.drawArraysInstanced(gl.LINES, 0, 2, frame.edgeCount);
  }
  if ((frame.drawNodes ?? true) && frame.nodeCount > 0) {
    gl.useProgram(handle.nodeProgram);
    gl.uniformMatrix4fv(handle.nodeUniformVP, false, vp);
    gl.bindVertexArray(handle.nodeVAO);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, frame.nodeCount);
  }
  gl.bindVertexArray(null);
}

export function disposeRenderer(handle: RendererHandle): void {
  const { gl } = handle;
  gl.deleteProgram(handle.nodeProgram);
  gl.deleteProgram(handle.edgeProgram);
  gl.deleteBuffer(handle.nodeInstanceBuffer);
  gl.deleteBuffer(handle.edgeInstanceBuffer);
  gl.deleteBuffer(handle.quadBuffer);
  gl.deleteVertexArray(handle.nodeVAO);
  gl.deleteVertexArray(handle.edgeVAO);
}

// ─── helpers ────────────────────────────────────────────────────────────────

function mustLinkProgram(gl: GL, vsSrc: string, fsSrc: string): WebGLProgram {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  const prog = gl.createProgram();
  if (!prog) throw new Error('createProgram failed');
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog) ?? 'unknown';
    throw new Error(`program link failed: ${log}`);
  }
  return prog;
}

function compile(gl: GL, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new Error('createShader failed');
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) ?? 'unknown';
    throw new Error(`shader compile failed: ${log}`);
  }
  return sh;
}

function mustCreateBuffer(gl: GL): WebGLBuffer {
  const b = gl.createBuffer();
  if (!b) throw new Error('createBuffer failed');
  return b;
}

function mustCreateVAO(gl: GL): WebGLVertexArrayObject {
  const v = gl.createVertexArray();
  if (!v) throw new Error('createVertexArray failed');
  return v;
}

function mustGetUniform(gl: GL, prog: WebGLProgram, name: string): WebGLUniformLocation {
  const u = gl.getUniformLocation(prog, name);
  if (u === null) throw new Error(`uniform ${name} not found`);
  return u;
}
