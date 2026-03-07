/**
 * Translation Engine — Code Targets.
 *
 * Maps ExtractedParameters to runnable code in supported target media:
 * HTML Canvas, React/JSX, Three.js, and CSS. Each translator takes the
 * same parameters and produces functionally equivalent output.
 *
 * Generated code is self-contained — copy, paste, open in browser.
 */

import type { ExtractedParameters, TargetMedium } from './types.js';

// ============================================================================
// Translation Dictionaries
// ============================================================================

/** Maps arrangement patterns to Canvas drawing code. */
const CANVAS_ARRANGEMENT: Record<string, string> = {
  spiral: 'const angle = i * params.goldenAngle; const r = Math.sqrt(i) * spacing;',
  grid: 'const col = i % cols; const row = Math.floor(i / cols);',
  radial: 'const angle = i * (Math.PI * 2 / count);',
  organic: 'const angle = i * params.goldenAngle; const r = Math.sqrt(i) * spacing + (Math.random() - 0.5) * jitter;',
  linear: 'const x = i * spacing;',
};

/** Maps blend modes to Canvas globalCompositeOperation values. */
const CANVAS_BLEND: Record<string, string> = {
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
};

/** Maps blend modes to CSS mix-blend-mode values. */
const CSS_BLEND: Record<string, string> = {
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
};

/** Maps blend modes to Three.js blending constants. */
const THREE_BLEND: Record<string, string> = {
  multiply: 'THREE.MultiplyBlending',
  screen: 'THREE.AdditiveBlending',
  overlay: 'THREE.NormalBlending',
};

// ============================================================================
// Shared Helpers
// ============================================================================

/** Generates the palette as a JS array literal. */
function paletteToJS(params: ExtractedParameters): string {
  return `[${params.color.palette.map(c =>
    `{ name: '${c.name}', hex: '${c.hex}', role: '${c.role}' }`,
  ).join(', ')}]`;
}

/** Generates element positioning logic for Canvas/React. */
function arrangementCode(params: ExtractedParameters): string {
  const arr = params.geometry.arrangement;
  const count = params.geometry.proportions.elementCount ?? 40;
  const goldenAngle = params.geometry.constants.goldenAngle ?? 2.399963;
  const handmade = params.feel.handmade;

  const jitter = handmade > 0.3 ? `\n    const jitter = (Math.random() - 0.5) * ${(handmade * 0.05).toFixed(3)} * spacing;` : '';

  if (arr === 'spiral' || arr === 'organic') {
    return `  const count = ${count};
  const goldenAngle = ${goldenAngle};
  const spacing = Math.min(w, h) / 8;
  for (let i = 0; i < count; i++) {
    const angle = i * goldenAngle;
    const r = Math.sqrt(i) * spacing / 3;${jitter}
    const x = cx + r * Math.cos(angle)${jitter ? ' + jitter' : ''};
    const y = cy + r * Math.sin(angle)${jitter ? ' + jitter' : ''};`;
  }
  if (arr === 'grid') {
    const cols = Math.ceil(Math.sqrt(count));
    return `  const count = ${count};
  const cols = ${cols};
  const spacing = Math.min(w, h) / (${cols} + 1);
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = spacing + col * spacing;
    const y = spacing + row * spacing;`;
  }
  if (arr === 'radial') {
    return `  const count = ${count};
  const radius = Math.min(w, h) / 3;
  for (let i = 0; i < count; i++) {
    const angle = i * (Math.PI * 2 / count);
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);`;
  }
  // linear
  return `  const count = ${count};
  const spacing = w / (count + 1);
  for (let i = 0; i < count; i++) {
    const x = spacing + i * spacing;
    const y = cy;`;
}

/** Generates blend mode setup for Canvas. */
function blendModeCode(params: ExtractedParameters): string {
  if (params.material.blendModes.length === 0) return '';
  const mode = CANVAS_BLEND[params.material.blendModes[0]] ?? 'source-over';
  return `\n    ctx.globalCompositeOperation = '${mode}';`;
}

// ============================================================================
// Translators
// ============================================================================

/**
 * Translates parameters to a self-contained HTML Canvas file.
 */
export function translateToCanvas(params: ExtractedParameters): string {
  const primary = params.color.palette[0]?.hex ?? '#808080';
  const bg = params.color.palette.find(c => c.role === 'background')?.hex ?? '#FFFFFF';
  const energy = params.feel.energy;
  const hasAnimation = energy > 0.2;
  const shape = params.geometry.primaryShape;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Generated — ${shape}</title>
<style>body{margin:0;background:${bg};display:flex;justify-content:center;align-items:center;min-height:100vh}</style>
</head><body>
<canvas id="c"></canvas>
<script>
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const palette = ${paletteToJS(params)};
const w = canvas.width = 800;
const h = canvas.height = 800;
const cx = w / 2, cy = h / 2;

function draw(t) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '${bg}';
  ctx.fillRect(0, 0, w, h);
${arrangementCode(params)}${blendModeCode(params)}
    const size = ${params.geometry.proportions.heightDecay ? `(1 - i / count * ${params.geometry.proportions.heightDecay}) * 20` : '12'};
    ctx.fillStyle = palette[i % palette.length].hex;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
${hasAnimation ? `  requestAnimationFrame(draw);` : ''}
}
draw(0);
</script>
</body></html>`;
}

/**
 * Translates parameters to a React/JSX functional component.
 */
export function translateToReact(params: ExtractedParameters): string {
  const primary = params.color.palette[0]?.hex ?? '#808080';
  const bg = params.color.palette.find(c => c.role === 'background')?.hex ?? '#FFFFFF';
  const energy = params.feel.energy;
  const shape = params.geometry.primaryShape;

  return `import { useRef, useEffect } from 'react';

const palette = ${paletteToJS(params)};

export default function ${capitalize(shape)}Visualization({ width = 800, height = 800 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = width, h = height;
    const cx = w / 2, cy = h / 2;

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '${bg}';
      ctx.fillRect(0, 0, w, h);
  ${arrangementCode(params)}${blendModeCode(params)}
      const size = ${params.geometry.proportions.heightDecay ? `(1 - i / count * ${params.geometry.proportions.heightDecay}) * 20` : '12'};
      ctx.fillStyle = palette[i % palette.length].hex;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
${energy > 0.2 ? `      requestAnimationFrame(draw);` : ''}
    }
    draw(0);
  }, [width, height]);

  return <canvas ref={canvasRef} width={width} height={height} />;
}`;
}

/**
 * Translates parameters to a self-contained Three.js HTML file.
 */
export function translateToThreeJS(params: ExtractedParameters): string {
  const primary = params.color.palette[0]?.hex ?? '#808080';
  const bg = params.color.palette.find(c => c.role === 'background')?.hex ?? '#FFFFFF';
  const count = params.geometry.proportions.elementCount ?? 40;
  const goldenAngle = params.geometry.constants.goldenAngle ?? 2.399963;
  const arr = params.geometry.arrangement;
  const blending = params.material.blendModes.length > 0
    ? THREE_BLEND[params.material.blendModes[0]] ?? 'THREE.NormalBlending'
    : 'THREE.NormalBlending';

  const positionCode = (arr === 'spiral' || arr === 'organic')
    ? `const angle = i * ${goldenAngle};
      const r = Math.sqrt(i) * 0.5;
      mesh.position.set(r * Math.cos(angle), 0, r * Math.sin(angle));`
    : arr === 'grid'
      ? `const cols = Math.ceil(Math.sqrt(${count}));
      mesh.position.set((i % cols - cols/2) * 1.2, 0, (Math.floor(i/cols) - cols/2) * 1.2);`
      : `const angle = i * (Math.PI * 2 / ${count});
      mesh.position.set(Math.cos(angle) * 5, 0, Math.sin(angle) * 5);`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Generated 3D — ${params.geometry.primaryShape}</title>
<style>body{margin:0;overflow:hidden}</style>
</head><body>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
const scene = new THREE.Scene();
scene.background = new THREE.Color('${bg}');
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0, 10, 15);
camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const palette = ${paletteToJS(params)};
const geo = new THREE.SphereGeometry(${params.geometry.proportions.heightDecay ? 0.3 : 0.4}, 16, 16);

for (let i = 0; i < ${count}; i++) {
  const mat = new THREE.MeshStandardMaterial({
    color: palette[i % palette.length].hex,
    roughness: ${params.material.surfaces[0]?.roughness ?? 0.5},
    metalness: ${(1 - (params.material.surfaces[0]?.roughness ?? 0.5)).toFixed(2)},
  });
  const mesh = new THREE.Mesh(geo, mat);
  ${positionCode}
  scene.add(mesh);
}

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

let angle = 0;
function animate() {
  requestAnimationFrame(animate);
  angle += ${(0.002 + params.feel.energy * 0.008).toFixed(4)};
  camera.position.x = 15 * Math.sin(angle);
  camera.position.z = 15 * Math.cos(angle);
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
}
animate();
</script>
</body></html>`;
}

/**
 * Translates parameters to an HTML+CSS file using pure CSS techniques.
 * Flags when parameters exceed CSS capabilities.
 */
export function translateToCSS(params: ExtractedParameters): string {
  const palette = params.color.palette;
  const count = Math.min(params.geometry.proportions.elementCount ?? 40, 100);
  const arr = params.geometry.arrangement;
  const energy = params.feel.energy;
  const blendMode = params.material.blendModes.length > 0
    ? CSS_BLEND[params.material.blendModes[0]] ?? 'normal' : 'normal';

  const customProps = palette.map((c, i) =>
    `  --color-${c.role.replace(/[^a-z0-9]/g, '-')}: ${c.hex};`,
  ).join('\n');

  const gridCSS = arr === 'grid'
    ? `display: grid; grid-template-columns: repeat(auto-fill, 24px); gap: 8px; justify-content: center;`
    : `display: flex; flex-wrap: wrap; justify-content: center; gap: 4px;`;

  const items = Array.from({ length: count }, (_, i) => {
    const color = palette[i % palette.length].hex;
    const size = 8 + Math.random() * 16;
    return `    <div class="el" style="background:${color};width:${size}px;height:${size}px"></div>`;
  }).join('\n');

  const cssLimitWarning = (arr === 'spiral' || arr === 'organic')
    ? '\n/* NOTE: Spiral/organic arrangements are approximate in pure CSS. For precise golden-angle placement, use Canvas or Three.js target. */'
    : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Generated CSS — ${params.geometry.primaryShape}</title>
<style>
:root {
${customProps}
}${cssLimitWarning}
body { margin: 0; background: var(--color-background, #fff); display: flex; justify-content: center; align-items: center; min-height: 100vh; }
.container { ${gridCSS} max-width: 600px; padding: 2rem; }
.el { border-radius: 50%; mix-blend-mode: ${blendMode}; transition: transform 0.3s ease; }
.el:hover { transform: scale(1.3); }
${energy > 0.3 ? `.el { animation: pulse ${(2 - energy * 1.5).toFixed(1)}s ease-in-out infinite alternate; }
@keyframes pulse { to { transform: scale(1.1); opacity: 0.8; } }` : ''}
</style>
</head><body>
<div class="container">
${items}
</div>
</body></html>`;
}

/**
 * Routes to the appropriate translator based on target medium.
 * Returns null for design-spec and build-plan targets (use translation-design).
 */
export function translateCode(params: ExtractedParameters, target: TargetMedium): string | null {
  switch (target) {
    case 'canvas': return translateToCanvas(params);
    case 'react': return translateToReact(params);
    case 'threejs': return translateToThreeJS(params);
    case 'css': return translateToCSS(params);
    default: return null;
  }
}

// ============================================================================
// Internal Helpers
// ============================================================================

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/[^a-zA-Z0-9]/g, '');
}
