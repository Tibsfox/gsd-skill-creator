/** Engineering constants registry stub -- implementation in Task 2 */
export const NPS_PIPE_SIZES: Record<string, unknown> = {};
export const NEC_310_16_AMPACITY: Record<string, unknown> = {};
export const FLUID_PROPERTIES: Record<string, unknown> = {};
export const MATERIAL_PROPERTIES: Record<string, unknown> = {};
export function getPipeSize(_nps: string, _schedule: string): unknown { return undefined; }
export function getAmpacity(_awg: string, _tempRating: number): number { return 0; }
export function getFluidProperty(_fluid: string, _property: string): unknown { return undefined; }
