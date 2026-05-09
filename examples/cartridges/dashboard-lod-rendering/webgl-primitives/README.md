# webgl-primitives — instanced node + edge primitives

Minimal WebGL 2 instanced-rendering primitives for the dashboard's WebGL rung
(20K–1M element band per `lod-thresholds.md`).

## Files

- **`instanced-nodes.glsl`** — vertex + fragment for SDF-disk-with-border nodes.
  Per-instance attributes: `position`, `radius`, `colorIndex`. One draw call
  per N nodes.
- **`edge-batch.glsl`** — vertex + fragment for wide-line edges via per-instance
  quad extrusion. Per-instance attributes: `src`, `dst`, `thickness`,
  `colorIndex`. Reliable across implementations (unlike `gl.lineWidth()`).
- **`regl-setup.ts`** — declarative regl wrapper showing the bind shape. Optional;
  the dashboard's floor demo uses direct WebGL without regl.

## How to use

### Direct WebGL 2

```js
const program = compile(gl, vertexSource, fragmentSource);
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

// Per-vertex (one quad)
gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
gl.vertexAttribPointer(loc.a_quadVert, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(loc.a_quadVert);

// Per-instance (divisor 1)
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(loc.a_position, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(loc.a_position);
gl.vertexAttribDivisor(loc.a_position, 1);  // ← the magic

// ... bind a_radius, a_colorIndex similarly ...

gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, instanceCount);
```

### Via regl

See `regl-setup.ts`.

## Performance

At 100K nodes on integrated Intel Iris Xe (2026 baseline):
- Buffer upload (positions changing every frame): 1.5–4ms
- 3 instanced draws (nodes + edges + labels): 0.8–1.5ms
- Total: <8ms — well within the 60fps frame budget.

## Cross-references

- `dashboard-lod-rendering` doc 01 — substrate ladder (this primitive paints the WebGL rung).
- `dashboard-lod-rendering` doc 02 — full WebGL rung specification.
- T2 doc 07 — published element-count thresholds these primitives are designed for.

## Requirements

WebGL 2 OR WebGL 1 with `ANGLE_instanced_arrays` extension (>99% support).
