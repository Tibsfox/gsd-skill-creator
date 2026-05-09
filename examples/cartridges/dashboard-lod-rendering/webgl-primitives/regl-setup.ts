// =============================================================================
// dashboard-lod-rendering / webgl-primitives / regl-setup.ts
// -----------------------------------------------------------------------------
// regl declarative wrapper showing how to bind instanced-nodes.glsl and
// edge-batch.glsl to per-instance attribute buffers (doc 02 §9).
//
// Adopting regl is OPTIONAL — the dashboard's floor demo uses direct WebGL.
// This file documents the regl shape for users who prefer the declarative API.
//
// Install:  npm install regl
// =============================================================================

import REGL from 'regl';
// Read the GLSL via a build-tool macro, e.g. esbuild's --loader:.glsl=text.
// For the cartridge ship without a build step, paste the GLSL inline.
import nodesGLSL from './instanced-nodes.glsl';
import edgesGLSL from './edge-batch.glsl';

export interface NodeInstance {
  position: [number, number];
  radius: number;
  colorIndex: number;
}

export interface EdgeInstance {
  src: [number, number];
  dst: [number, number];
  thickness: number;
  colorIndex: number;
}

export interface DashboardWebGL {
  drawNodes: (nodes: NodeInstance[], camera: number[], paletteTexture: any) => void;
  drawEdges: (edges: EdgeInstance[], camera: number[], pixelToWorld: number, paletteTexture: any) => void;
  destroy: () => void;
}

export function setupDashboardWebGL(canvas: HTMLCanvasElement): DashboardWebGL {
  const regl = REGL({ canvas, attributes: { antialias: false, premultipliedAlpha: true } });

  // Per-vertex quad (6 vertices forming two triangles).
  const QUAD = [-1, -1,  1, -1,  -1, 1,    -1, 1,  1, -1,  1, 1];

  const drawNodesCmd = regl({
    vert: extract(nodesGLSL, 'VERTEX_SHADER'),
    frag: extract(nodesGLSL, 'FRAGMENT_SHADER'),
    attributes: {
      a_quadVert: regl.buffer({ data: QUAD, usage: 'static' }),
      a_position: regl.prop<any, 'positionBuffer'>('positionBuffer'),
      a_radius: regl.prop<any, 'radiusBuffer'>('radiusBuffer'),
      a_colorIndex: regl.prop<any, 'colorIndexBuffer'>('colorIndexBuffer'),
    },
    // The `divisor` property is the per-instance flag.
    instances: regl.prop<any, 'instanceCount'>('instanceCount'),
    uniforms: {
      u_camera: regl.prop<any, 'camera'>('camera'),
      u_palette: regl.prop<any, 'palette'>('palette'),
    },
    count: 6,
    primitive: 'triangles',
    blend: { enable: true, func: { srcRGB: 'src alpha', dstRGB: 'one minus src alpha' } },
  });

  const drawEdgesCmd = regl({
    vert: extract(edgesGLSL, 'VERTEX_SHADER'),
    frag: extract(edgesGLSL, 'FRAGMENT_SHADER'),
    attributes: {
      a_quadVert: regl.buffer({ data: [0,-1, 1,-1, 0,1,  0,1, 1,-1, 1,1], usage: 'static' }),
      a_src: regl.prop<any, 'srcBuffer'>('srcBuffer'),
      a_dst: regl.prop<any, 'dstBuffer'>('dstBuffer'),
      a_thickness: regl.prop<any, 'thicknessBuffer'>('thicknessBuffer'),
      a_colorIndex: regl.prop<any, 'colorIndexBuffer'>('colorIndexBuffer'),
    },
    instances: regl.prop<any, 'instanceCount'>('instanceCount'),
    uniforms: {
      u_camera: regl.prop<any, 'camera'>('camera'),
      u_pixelToWorld: regl.prop<any, 'pixelToWorld'>('pixelToWorld'),
      u_palette: regl.prop<any, 'palette'>('palette'),
    },
    count: 6,
    primitive: 'triangles',
    blend: { enable: true, func: { srcRGB: 'src alpha', dstRGB: 'one minus src alpha' } },
  });

  // Persistent buffers — reused across frames; updated via subdata when changed.
  let positionBuffer: any, radiusBuffer: any, colorIndexBuffer: any;
  let edgeSrcBuffer: any, edgeDstBuffer: any, edgeThicknessBuffer: any, edgeColorIndexBuffer: any;

  function ensureNodeBuffers(n: number) {
    if (positionBuffer && positionBuffer.length >= n) return;
    if (positionBuffer) positionBuffer.destroy();
    positionBuffer = regl.buffer({ length: n * 8, usage: 'dynamic', divisor: 1 });
    radiusBuffer = regl.buffer({ length: n * 4, usage: 'dynamic', divisor: 1 });
    colorIndexBuffer = regl.buffer({ length: n, usage: 'dynamic', divisor: 1, type: 'uint8' });
    positionBuffer.length = n;
  }

  return {
    drawNodes(nodes, camera, palette) {
      ensureNodeBuffers(nodes.length);
      // Pack into typed arrays once per frame
      const pos = new Float32Array(nodes.length * 2);
      const rad = new Float32Array(nodes.length);
      const col = new Uint8Array(nodes.length);
      for (let i = 0; i < nodes.length; i++) {
        pos[2*i] = nodes[i].position[0]; pos[2*i+1] = nodes[i].position[1];
        rad[i] = nodes[i].radius;
        col[i] = nodes[i].colorIndex;
      }
      positionBuffer.subdata(pos);
      radiusBuffer.subdata(rad);
      colorIndexBuffer.subdata(col);
      drawNodesCmd({
        positionBuffer, radiusBuffer, colorIndexBuffer,
        camera, palette, instanceCount: nodes.length,
      });
    },
    drawEdges(edges, camera, pixelToWorld, palette) {
      // Symmetric to drawNodes — elided for brevity in the cartridge.
      // See doc 02 §4 + §8.
    },
    destroy() { regl.destroy(); },
  };
}

// Helper to extract one #ifdef section from a combined GLSL file.
function extract(src: string, kind: string): string {
  return `#define ${kind}\n${src}`;
}

// =============================================================================
// USAGE
// -----------------------------------------------------------------------------
// const wgl = setupDashboardWebGL(canvas);
// const palette = regl.texture({ /* 256x1 RGBA */ });
// const camera = [/* 3x3 mat3 */];
//
// // Per frame, when dirty:
// wgl.drawNodes(myNodes, camera, palette);
// wgl.drawEdges(myEdges, camera, 1 / cameraZoom, palette);
// =============================================================================
