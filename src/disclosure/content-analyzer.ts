export const WORD_THRESHOLD_DECOMPOSE = 2000;
export const WORD_THRESHOLD_WARNING = 5000;

export interface Section {
  heading: string;
  content: string;
  wordCount: number;
  startLine: number;
  endLine: number;
}

export interface DeterministicOp {
  pattern: string; // 'git' | 'file-ops' | 'build'
  lineStart: number;
  lineEnd: number;
  content: string; // The code block content
  suggestedFilename: string; // e.g., 'setup.sh', 'build.sh'
}

export interface AnalysisResult {
  wordCount: number;
  sections: Section[];
  deterministicOps: DeterministicOp[];
  exceedsDecompose: boolean; // >2000 words
  exceedsWarning: boolean; // >5000 words
}

export class ContentAnalyzer {
  countWords(_text: string): number {
    throw new Error('not implemented');
  }

  analyzeContent(_body: string): AnalysisResult {
    throw new Error('not implemented');
  }

  detectDeterministicOps(_body: string): DeterministicOp[] {
    throw new Error('not implemented');
  }
}
