/**
 * UserStyle data model -- single source of visual truth.
 *
 * Defines the UserStyle type, Zod schema with graceful default fallback,
 * simple YAML-like serialization, and localStorage persistence.
 *
 * user-style.yaml drives both WebGL shader uniforms and DOM CSS custom
 * properties. This module handles the data layer; css-bridge.ts handles
 * the DOM projection.
 */
import { z } from 'zod';
import { CRT_DEFAULTS } from '../engine/crt-config.js';
import { getPaletteColors } from '../engine/palette.js';
import type { CRTConfig } from '../engine/crt-config.js';
import type { PalettePreset } from '../engine/palette.js';

/** The single source of visual truth for the desktop shell. */
export interface UserStyle {
  palette: {
    preset: PalettePreset;
    colors: string[];
    anchors: string[];
  };
  crt: CRTConfig;
  mode: 'light' | 'dark';
  boot: {
    skip: boolean;
    background: 'gradient' | 'flat' | 'disabled';
  };
  calibrated: boolean;
}

// ---------------------------------------------------------------------------
// Zod Schema
// ---------------------------------------------------------------------------

const DEFAULT_COLORS = getPaletteColors('amiga-3.1');

/**
 * Colors schema: must be exactly 32 hex strings. If validation fails
 * (wrong length, non-string entries), falls back to default palette.
 */
const ColorsSchema = z
  .array(z.string())
  .refine((arr) => arr.length === 32, { message: 'Must have exactly 32 colors' })
  .catch([...DEFAULT_COLORS]);

const PaletteInnerSchema = z.object({
  preset: z
    .enum(['amiga-1.3', 'amiga-2.0', 'amiga-3.1', 'c64', 'custom'])
    .default('amiga-3.1'),
  colors: ColorsSchema.default([...DEFAULT_COLORS]),
  anchors: z.array(z.string()).default([]),
});

/**
 * Palette uses .default() then .transform() to ensure nested defaults
 * cascade through the inner schema even when given an empty object.
 *
 * Zod v4 requires .default() values to match the full output type, so we
 * supply a factory function and let the inner schema fill in field defaults.
 */
const PaletteSchema = PaletteInnerSchema.default(() => PaletteInnerSchema.parse({})).transform(
  (val) => PaletteInnerSchema.parse(val),
);

const CrtInnerSchema = z.object({
  enabled: z.boolean().default(CRT_DEFAULTS.enabled),
  scanlineIntensity: z.number().default(CRT_DEFAULTS.scanlineIntensity),
  barrelDistortion: z.number().default(CRT_DEFAULTS.barrelDistortion),
  phosphorGlow: z.number().default(CRT_DEFAULTS.phosphorGlow),
  chromaticAberration: z.number().default(CRT_DEFAULTS.chromaticAberration),
  vignette: z.number().default(CRT_DEFAULTS.vignette),
});

const CrtSchema = CrtInnerSchema.default(() => CrtInnerSchema.parse({})).transform((val) =>
  CrtInnerSchema.parse(val),
);

const BootInnerSchema = z.object({
  skip: z.boolean().default(false),
  background: z.enum(['gradient', 'flat', 'disabled']).default('gradient'),
});

const BootSchema = BootInnerSchema.default(() => BootInnerSchema.parse({})).transform((val) =>
  BootInnerSchema.parse(val),
);

export const UserStyleSchema = z.object({
  palette: PaletteSchema,
  crt: CrtSchema,
  mode: z.enum(['light', 'dark']).default('dark'),
  boot: BootSchema,
  calibrated: z.boolean().default(false),
});

/** Default UserStyle -- result of parsing an empty object through the schema. */
export const DEFAULT_USER_STYLE: UserStyle = UserStyleSchema.parse({});

// ---------------------------------------------------------------------------
// YAML-like Serialization (manual, no library needed)
// ---------------------------------------------------------------------------

const INDENT = '  ';

/**
 * Serialize a UserStyle to a readable YAML-like string.
 * The structure is flat enough that a manual approach is cleaner than
 * pulling in a full YAML library.
 */
export function serializeUserStyle(style: UserStyle): string {
  const lines: string[] = [];

  // Palette section
  lines.push('palette:');
  lines.push(`${INDENT}preset: ${style.palette.preset}`);
  lines.push(`${INDENT}colors:`);
  for (const color of style.palette.colors) {
    lines.push(`${INDENT}${INDENT}- ${color}`);
  }
  lines.push(`${INDENT}anchors:`);
  if (style.palette.anchors.length === 0) {
    lines.push(`${INDENT}${INDENT}[]`);
  } else {
    for (const anchor of style.palette.anchors) {
      lines.push(`${INDENT}${INDENT}- ${anchor}`);
    }
  }

  // CRT section
  lines.push('crt:');
  lines.push(`${INDENT}enabled: ${style.crt.enabled}`);
  lines.push(`${INDENT}scanlineIntensity: ${style.crt.scanlineIntensity}`);
  lines.push(`${INDENT}barrelDistortion: ${style.crt.barrelDistortion}`);
  lines.push(`${INDENT}phosphorGlow: ${style.crt.phosphorGlow}`);
  lines.push(`${INDENT}chromaticAberration: ${style.crt.chromaticAberration}`);
  lines.push(`${INDENT}vignette: ${style.crt.vignette}`);

  // Mode
  lines.push(`mode: ${style.mode}`);

  // Boot section
  lines.push('boot:');
  lines.push(`${INDENT}skip: ${style.boot.skip}`);
  lines.push(`${INDENT}background: ${style.boot.background}`);

  // Calibrated
  lines.push(`calibrated: ${style.calibrated}`);

  return lines.join('\n');
}

/**
 * Deserialize a YAML-like string back to UserStyle.
 * Uses line-by-line parsing for the known flat structure, then runs
 * through Zod for validation with defaults.
 */
export function deserializeUserStyle(yaml: string): UserStyle {
  const lines = yaml.split('\n');
  const raw: Record<string, unknown> = {};
  const palette: Record<string, unknown> = {};
  const crt: Record<string, unknown> = {};
  const boot: Record<string, unknown> = {};
  const colors: string[] = [];
  const anchors: string[] = [];

  let section = '';
  let subField = '';

  for (const line of lines) {
    const trimmed = line.trimEnd();

    // Top-level sections
    if (trimmed === 'palette:') {
      section = 'palette';
      continue;
    }
    if (trimmed === 'crt:') {
      section = 'crt';
      continue;
    }
    if (trimmed === 'boot:') {
      section = 'boot';
      continue;
    }

    // Top-level scalars
    if (trimmed.startsWith('mode:')) {
      raw['mode'] = trimmed.split(':')[1].trim();
      section = '';
      continue;
    }
    if (trimmed.startsWith('calibrated:')) {
      raw['calibrated'] = trimmed.split(':')[1].trim() === 'true';
      section = '';
      continue;
    }

    // Section fields
    if (section === 'palette') {
      const indented = trimmed.replace(/^ {2}/, '');
      if (indented.startsWith('preset:')) {
        palette['preset'] = indented.split(':')[1].trim();
      } else if (indented === 'colors:') {
        subField = 'colors';
      } else if (indented === 'anchors:') {
        subField = 'anchors';
      } else if (indented.trim() === '[]') {
        // empty array marker
      } else if (indented.trim().startsWith('- ')) {
        const value = indented.trim().slice(2);
        if (subField === 'colors') {
          colors.push(value);
        } else if (subField === 'anchors') {
          anchors.push(value);
        }
      }
    }

    if (section === 'crt') {
      const indented = trimmed.replace(/^ {2}/, '');
      if (indented.startsWith('enabled:')) {
        crt['enabled'] = indented.split(':')[1].trim() === 'true';
      } else if (indented.startsWith('scanlineIntensity:')) {
        crt['scanlineIntensity'] = parseFloat(indented.split(':')[1].trim());
      } else if (indented.startsWith('barrelDistortion:')) {
        crt['barrelDistortion'] = parseFloat(indented.split(':')[1].trim());
      } else if (indented.startsWith('phosphorGlow:')) {
        crt['phosphorGlow'] = parseFloat(indented.split(':')[1].trim());
      } else if (indented.startsWith('chromaticAberration:')) {
        crt['chromaticAberration'] = parseFloat(indented.split(':')[1].trim());
      } else if (indented.startsWith('vignette:')) {
        crt['vignette'] = parseFloat(indented.split(':')[1].trim());
      }
    }

    if (section === 'boot') {
      const indented = trimmed.replace(/^ {2}/, '');
      if (indented.startsWith('skip:')) {
        boot['skip'] = indented.split(':')[1].trim() === 'true';
      } else if (indented.startsWith('background:')) {
        boot['background'] = indented.split(':')[1].trim();
      }
    }
  }

  palette['colors'] = colors.length > 0 ? colors : undefined;
  palette['anchors'] = anchors.length > 0 ? anchors : undefined;

  const obj = {
    ...raw,
    palette: Object.keys(palette).length > 0 ? palette : undefined,
    crt: Object.keys(crt).length > 0 ? crt : undefined,
    boot: Object.keys(boot).length > 0 ? boot : undefined,
  };

  return UserStyleSchema.parse(obj);
}

// ---------------------------------------------------------------------------
// localStorage Persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'gsd-os-user-style';

/**
 * Load UserStyle from localStorage.
 * Returns DEFAULT_USER_STYLE if missing, unparseable, or invalid.
 */
export function loadUserStyle(): UserStyle {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_USER_STYLE;
    return deserializeUserStyle(stored);
  } catch {
    return DEFAULT_USER_STYLE;
  }
}

/**
 * Save UserStyle to localStorage as a YAML-like string.
 */
export function saveUserStyle(style: UserStyle): void {
  localStorage.setItem(STORAGE_KEY, serializeUserStyle(style));
}
