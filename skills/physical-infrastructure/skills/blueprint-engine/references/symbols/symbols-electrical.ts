/** IEEE Standard Electrical Symbol Library stub -- implementation in Task 2 */
export type ElecSymbolCategory =
  | 'source' | 'protection' | 'distribution' | 'load' | 'instrument';

export interface ElecSymbol {
  id: string;
  name: string;
  category: ElecSymbolCategory;
  standard: string;
  voltageClass?: string;
  viewBox: string;
  svgContent: string;
  connectionPoints: { id: string; x: number; y: number; phase?: string }[];
  tags: string[];
}

export interface ElecLineType {
  id: string;
  name: string;
  svgStroke: string;
  svgStrokeWidth: number;
  svgStrokeDasharray?: string;
  color?: string;
  standard: string;
}

export const ELEC_SYMBOLS: Record<string, ElecSymbol> = {};  // stub -- empty
export const ELEC_LINE_TYPES: Record<string, ElecLineType> = {};  // stub -- empty
