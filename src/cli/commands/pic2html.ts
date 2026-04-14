/**
 * pic2html — Convert images to HTML table art
 *
 * Modern TypeScript recreation of foxglove's 2007 Pic2Html.exe (VB.NET).
 * Takes an input image and obfuscates it into an HTML table where each
 * pixel (or block of pixels) becomes a colored <td> with bgcolor.
 *
 * Originally built at home on the D: drive, tested with foxglove@philips.com
 * rendered as a 16-level grayscale HTML table — anti-scraping before anyone
 * called it that. June 3, 2007.
 *
 * @example
 *   npx gsd-skill-creator pic2html image.png
 *   npx gsd-skill-creator pic2html image.png --size 24
 *   npx gsd-skill-creator pic2html image.png --grayscale --levels 16
 *   npx gsd-skill-creator pic2html image.png --max-width 80 --quantize 8
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { basename, extname } from 'path';

// ── Types ──

interface Pic2HtmlOptions {
  size: number;
  output?: string;
  grayscale: boolean;
  levels: number;
  maxWidth?: number;
  quantize?: number;
  bg: string;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

// ── Color math ──

function quantizeColor(r: number, g: number, b: number, levels: number): RGB {
  const step = Math.floor(256 / levels);
  return {
    r: Math.min(Math.floor(r / step) * step + Math.floor(step / 2), 255),
    g: Math.min(Math.floor(g / step) * step + Math.floor(step / 2), 255),
    b: Math.min(Math.floor(b / step) * step + Math.floor(step / 2), 255),
  };
}

function toGrayscaleHex(r: number, g: number, b: number, levels: number): string {
  const gray = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
  const step = Math.floor(256 / levels);
  let val: number;

  if (levels <= 16) {
    // Match original Pic2Html pattern: 00, 11, 22, ... ff
    const nibble = Math.min(Math.floor(gray / step), 15);
    val = nibble * 17;
  } else {
    val = Math.min(Math.floor(gray / step) * step, 255);
  }

  const hex = val.toString(16).padStart(2, '0');
  return `${hex}${hex}${hex}`;
}

function toHex(n: number): string {
  return n.toString(16).padStart(2, '0');
}

// ── PNG decoder (minimal, no external deps) ──

interface ImageData {
  width: number;
  height: number;
  getPixel: (x: number, y: number) => RGB;
}

async function loadImage(path: string): Promise<ImageData> {
  // Use the canvas-less approach: decode PNG/BMP/PPM via raw parsing
  // For broad format support, shell out to ImageMagick or Python
  const ext = extname(path).toLowerCase();

  if (ext === '.ppm' || ext === '.pgm') {
    return loadPPM(path);
  }

  // For PNG/JPG/BMP/GIF — use Python+Pillow as the image decoder
  // This avoids pulling in sharp/canvas native deps
  const { execSync } = await import('child_process');
  const tmpPath = `/tmp/pic2html_pixels_${process.pid}.bin`;

  try {
    execSync(`python3 -c "
from PIL import Image
import struct, sys
img = Image.open('${path.replace(/'/g, "\\'")}').convert('RGB')
w, h = img.size
pixels = img.load()
with open('${tmpPath}', 'wb') as f:
    f.write(struct.pack('<II', w, h))
    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            f.write(bytes([r, g, b]))
"`, { stdio: 'pipe' });

    const buf = await readFile(tmpPath);
    const width = buf.readUInt32LE(0);
    const height = buf.readUInt32LE(4);
    const pixelData = buf.subarray(8);

    return {
      width,
      height,
      getPixel: (x: number, y: number): RGB => {
        const offset = (y * width + x) * 3;
        return {
          r: pixelData[offset],
          g: pixelData[offset + 1],
          b: pixelData[offset + 2],
        };
      },
    };
  } finally {
    try {
      const { unlinkSync } = await import('fs');
      unlinkSync(tmpPath);
    } catch {
      // ignore cleanup errors
    }
  }
}

async function loadPPM(path: string): Promise<ImageData> {
  const buf = await readFile(path);
  const text = buf.toString('ascii');

  // Parse PPM P6 header
  const lines = text.split('\n');
  let headerEnd = 0;
  let magic = '';
  let width = 0;
  let height = 0;
  let lineIdx = 0;

  // Skip comments, read magic, dimensions, maxval
  for (const line of lines) {
    lineIdx++;
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) continue;
    if (!magic) { magic = trimmed; continue; }
    if (!width) {
      const parts = trimmed.split(/\s+/);
      width = parseInt(parts[0]);
      height = parseInt(parts[1]);
      continue;
    }
    // maxval line — skip it, then binary data follows
    headerEnd = buf.indexOf('\n', buf.indexOf(trimmed)) + 1;
    break;
  }

  const pixelData = buf.subarray(headerEnd);

  return {
    width,
    height,
    getPixel: (x: number, y: number): RGB => {
      const offset = (y * width + x) * 3;
      return {
        r: pixelData[offset],
        g: pixelData[offset + 1],
        b: pixelData[offset + 2],
      };
    },
  };
}

// ── Scaling ──

function scaleImage(img: ImageData, maxWidth: number): ImageData {
  if (img.width <= maxWidth) return img;

  const ratio = maxWidth / img.width;
  const newW = maxWidth;
  const newH = Math.floor(img.height * ratio);

  return {
    width: newW,
    height: newH,
    getPixel: (x: number, y: number): RGB => {
      const srcX = Math.floor(x / ratio);
      const srcY = Math.floor(y / ratio);
      return img.getPixel(
        Math.min(srcX, img.width - 1),
        Math.min(srcY, img.height - 1),
      );
    },
  };
}

// ── HTML generation ──

function generateHTML(img: ImageData, opts: Pic2HtmlOptions): string {
  const { size, grayscale, levels, quantize, bg } = opts;
  const lines: string[] = [];

  lines.push('<html>');
  lines.push(`<body bgcolor=${bg}>`);
  lines.push('<table border=0 cellpadding=0 cellspacing=0>');

  for (let y = 0; y < img.height; y++) {
    // Preserve the original typo at 1px — that's the fingerprint
    if (size === 1) {
      lines.push(`<tr hight=${size}>`);
    } else {
      lines.push(`<tr height=${size}>`);
    }

    for (let x = 0; x < img.width; x++) {
      const { r, g, b } = img.getPixel(x, y);
      let hex: string;

      if (grayscale) {
        hex = toGrayscaleHex(r, g, b, levels);
      } else if (quantize) {
        const q = quantizeColor(r, g, b, quantize);
        hex = `${toHex(q.r)}${toHex(q.g)}${toHex(q.b)}`;
      } else {
        hex = `${toHex(r)}${toHex(g)}${toHex(b)}`;
      }

      lines.push(`<td width=${size} bgcolor="${hex}"></td>`);
    }

    lines.push('</tr>');
  }

  lines.push('</table>');
  lines.push('</body>');
  lines.push('</html>');

  return lines.join('\n');
}

// ── Main command ──

export async function pic2html(imagePath: string, opts: Pic2HtmlOptions): Promise<void> {
  p.intro(pc.cyan('pic2html') + pc.dim(' — image to HTML table art'));

  if (!existsSync(imagePath)) {
    p.cancel(`File not found: ${imagePath}`);
    process.exit(1);
  }

  const spinner = p.spinner();
  spinner.start('Loading image...');

  let img = await loadImage(imagePath);

  if (opts.maxWidth) {
    img = scaleImage(img, opts.maxWidth);
  }

  spinner.message(`Generating ${img.width}x${img.height} HTML table...`);

  const html = generateHTML(img, opts);

  const outputPath = opts.output ||
    basename(imagePath, extname(imagePath)) + '.html';

  await writeFile(outputPath, html, 'utf-8');

  spinner.stop('Done');

  // Count unique colors
  const colors = new Set<string>();
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const { r, g, b } = img.getPixel(x, y);
      if (opts.grayscale) {
        colors.add(toGrayscaleHex(r, g, b, opts.levels));
      } else if (opts.quantize) {
        const q = quantizeColor(r, g, b, opts.quantize);
        colors.add(`${toHex(q.r)}${toHex(q.g)}${toHex(q.b)}`);
      } else {
        colors.add(`${toHex(r)}${toHex(g)}${toHex(b)}`);
      }
    }
  }

  const cells = img.width * img.height;
  const fileSize = Buffer.byteLength(html, 'utf-8');
  const mode = opts.grayscale ? 'grayscale' : opts.quantize ? 'quantized' : 'full color';

  p.note([
    `${pc.dim('Grid:')}       ${img.width} × ${img.height} (${cells.toLocaleString()} cells)`,
    `${pc.dim('Cell size:')}  ${opts.size}px`,
    `${pc.dim('Render:')}     ${img.width * opts.size} × ${img.height * opts.size}px`,
    `${pc.dim('Colors:')}     ${colors.size}`,
    `${pc.dim('Mode:')}       ${mode}`,
    `${pc.dim('Output:')}     ${outputPath} (${fileSize.toLocaleString()} bytes)`,
  ].join('\n'), 'pic2html');

  p.outro(pc.green(`✓ ${outputPath}`));
}
