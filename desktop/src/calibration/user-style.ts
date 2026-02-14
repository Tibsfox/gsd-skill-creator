/**
 * UserStyle data model -- Zod schema, YAML serialization, localStorage persistence.
 *
 * Stub file: all exports throw to satisfy RED phase (tests must fail).
 */
import type { CRTConfig } from '../engine/crt-config.js';
import type { PalettePreset } from '../engine/palette.js';
import { z } from 'zod';

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

// Stub schema -- will fail validation
export const UserStyleSchema = z.object({}) as any;

export const DEFAULT_USER_STYLE: UserStyle = undefined as any;

export function serializeUserStyle(_style: UserStyle): string {
  throw new Error('Not implemented');
}

export function deserializeUserStyle(_yaml: string): UserStyle {
  throw new Error('Not implemented');
}

export function loadUserStyle(): UserStyle {
  throw new Error('Not implemented');
}

export function saveUserStyle(_style: UserStyle): void {
  throw new Error('Not implemented');
}
