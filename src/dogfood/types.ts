/**
 * Shared type definitions for the dogfood extraction pipeline.
 * Used across extraction, chunking, and downstream learning phases.
 */

export interface ExtractionConfig {
  sourcePath: string;
  outputDir: string;
  chunkStrategy: 'chapter' | 'section' | 'adaptive';
  maxChunkTokens: number;       // default: 8000
  preserveLatex: boolean;
  catalogDiagrams: boolean;
}

export interface TextChunk {
  id: string;                   // e.g., "part-01-ch-03-sec-02"
  part: number;                 // 1-10
  partTitle: string;
  chapter: number;              // 1-33
  chapterTitle: string;
  section?: string;
  contentType: 'prose' | 'math' | 'exercise' | 'buildlab' | 'appendix';
  text: string;
  mathExpressions: MathExpr[];
  diagrams: DiagramRef[];
  wordCount: number;
  estimatedTokens: number;
  mathDensity: number;          // 0.0-1.0
  crossRefs: string[];
  sequenceIndex: number;
}

export interface MathExpr {
  latex: string;
  readable: string;
  type: 'inline' | 'display' | 'theorem' | 'definition' | 'proof';
  label?: string;
}

export interface DiagramRef {
  position: number;
  description: string;
  type: 'tikz' | 'musictex' | 'table' | 'other';
  caption?: string;
}
