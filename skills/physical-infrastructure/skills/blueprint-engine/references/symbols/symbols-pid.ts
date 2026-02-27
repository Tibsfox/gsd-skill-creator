/** ISA-5.1 P&ID Symbol Library stub -- implementation in Task 2 */
export type PidSymbolCategory =
  | 'valve' | 'pump' | 'heat-exchanger' | 'vessel'
  | 'instrument' | 'pipe-fitting' | 'line-type';

export interface PidSymbol {
  id: string;
  name: string;
  category: PidSymbolCategory;
  standard: 'ISA-5.1';
  viewBox: string;
  svgContent: string;
  connectionPoints: { id: string; x: number; y: number }[];
  tags: string[];
}

export interface PidLineType {
  id: string;
  name: string;
  svgStroke: string;
  svgStrokeWidth: number;
  svgStrokeDasharray?: string;
  standard: string;
}

export const PID_SYMBOLS: Record<string, PidSymbol> = {};  // stub -- empty
export const PID_LINE_TYPES: Record<string, PidLineType> = {};  // stub -- empty
