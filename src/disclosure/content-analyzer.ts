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

// Git commands to detect in code blocks
const GIT_PATTERNS = /\b(git\s+(init|clone|add|commit|push|pull|remote|checkout|branch|merge|rebase|fetch|stash|log|diff|tag|reset))\b/;

// File manipulation commands
const FILE_OPS_PATTERNS = /\b(mkdir|cp|mv|rm|chmod|ln|touch)\b/;

// Build/package manager commands
const BUILD_PATTERNS = /\b(npm|yarn|pnpm|make|cargo|go\s+build|gradle)\b/;

export class ContentAnalyzer {
  /**
   * Count words in a text string.
   * Splits on whitespace, filters empty strings.
   */
  countWords(text: string): number {
    if (!text) return 0;
    return text.split(/\s+/).filter((w) => w.length > 0).length;
  }

  /**
   * Analyze skill body content: parse sections, count words, detect ops.
   */
  analyzeContent(body: string): AnalysisResult {
    const wordCount = this.countWords(body);
    const sections = this.parseSections(body);
    const deterministicOps = this.detectDeterministicOps(body);

    return {
      wordCount,
      sections,
      deterministicOps,
      exceedsDecompose: wordCount >= WORD_THRESHOLD_DECOMPOSE,
      exceedsWarning: wordCount >= WORD_THRESHOLD_WARNING,
    };
  }

  /**
   * Detect deterministic operations in fenced code blocks.
   * Only matches ```bash, ```sh, ```shell fenced blocks.
   */
  detectDeterministicOps(body: string): DeterministicOp[] {
    const ops: DeterministicOp[] = [];
    const lines = body.split('\n');

    let inBlock = false;
    let blockLang = '';
    let blockStart = -1;
    let blockContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (!inBlock) {
        // Check for opening fence with bash/sh/shell language
        const openMatch = line.match(/^```(bash|sh|shell)\s*$/);
        if (openMatch) {
          inBlock = true;
          blockLang = openMatch[1];
          blockStart = i;
          blockContent = [];
        }
      } else {
        // Check for closing fence
        if (line.match(/^```\s*$/)) {
          // Analyze the block content
          const content = blockContent.join('\n');
          const op = this.classifyBlock(content, blockStart, i);
          if (op) {
            ops.push(op);
          }
          inBlock = false;
          blockLang = '';
          blockStart = -1;
          blockContent = [];
        } else {
          blockContent.push(line);
        }
      }
    }

    return ops;
  }

  /**
   * Parse markdown body into sections delimited by ## headings.
   * Content before first ## heading is treated as 'intro' section.
   */
  private parseSections(body: string): Section[] {
    const lines = body.split('\n');
    const sections: Section[] = [];

    let currentHeading = '';
    let currentContent: string[] = [];
    let currentStart = 0;
    let hasIntro = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const h2Match = line.match(/^## (.+)$/);

      if (h2Match) {
        // Save previous section if it has content
        if (currentContent.length > 0 || currentHeading) {
          const content = currentContent.join('\n').trim();
          if (content || currentHeading) {
            sections.push({
              heading: currentHeading || 'intro',
              content,
              wordCount: this.countWords(content),
              startLine: currentStart,
              endLine: i - 1,
            });
          }
        }

        // Start new section
        currentHeading = h2Match[1];
        currentContent = [];
        currentStart = i;
      } else {
        // First line and no heading seen yet means intro
        if (sections.length === 0 && !currentHeading && i === 0) {
          hasIntro = true;
        }
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentContent.length > 0 || currentHeading) {
      const content = currentContent.join('\n').trim();
      if (content || currentHeading) {
        sections.push({
          heading: currentHeading || 'intro',
          content,
          wordCount: this.countWords(content),
          startLine: currentStart,
          endLine: lines.length - 1,
        });
      }
    }

    return sections;
  }

  /**
   * Classify a code block's content into a deterministic operation type.
   * Returns null if no deterministic pattern is detected.
   */
  private classifyBlock(
    content: string,
    lineStart: number,
    lineEnd: number,
  ): DeterministicOp | null {
    const hasGit = GIT_PATTERNS.test(content);
    const hasFileOps = FILE_OPS_PATTERNS.test(content);
    const hasBuild = BUILD_PATTERNS.test(content);

    if (!hasGit && !hasFileOps && !hasBuild) {
      return null;
    }

    // Determine primary pattern (priority: git > file-ops > build)
    let pattern: string;
    let suggestedFilename: string;

    if (hasGit && hasFileOps) {
      // Mixed git + file ops -> setup script
      pattern = 'git';
      suggestedFilename = 'setup.sh';
    } else if (hasGit) {
      pattern = 'git';
      suggestedFilename = 'setup.sh';
    } else if (hasFileOps) {
      pattern = 'file-ops';
      suggestedFilename = 'scaffold.sh';
    } else {
      pattern = 'build';
      suggestedFilename = 'build.sh';
    }

    return {
      pattern,
      lineStart,
      lineEnd,
      content,
      suggestedFilename,
    };
  }
}
