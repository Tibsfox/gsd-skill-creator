// === sc:learn Sanitization Pipeline ===
//
// Enforces STRANGER-tier hygiene for internet-sourced content and quick
// pattern scanning for local (HOME) files. Detects prompt injection,
// hidden characters, embedded code, external resources, path traversal,
// and content type mismatch. Produces a structured HygieneReport consumed
// by the HITL gate.

import type { AcquisitionResult, AcquisitionSource, StagedContent, SourceFamiliarity } from './acquirer.js';

// === Types ===

export type HygieneSeverity = 'critical' | 'warning' | 'info';

export type HygieneCategory =
  | 'prompt-injection'
  | 'hidden-characters'
  | 'embedded-code'
  | 'external-resources'
  | 'path-traversal'
  | 'content-type-mismatch';

export interface HygieneFinding {
  category: HygieneCategory;
  severity: HygieneSeverity;
  description: string;
  location: string;
  evidence: string;
  recommendation: string;
}

export interface HygieneReport {
  findings: HygieneFinding[];
  tier: 'HOME' | 'STRANGER';
  passed: boolean;
  summary: string;
  checkedAt: string;
}

export interface SanitizationResult {
  source: AcquisitionSource;
  staged: StagedContent[];
  report: HygieneReport;
  autoApproved: boolean;
}

// === Main Entry Point ===

export async function sanitizeContent(
  acquisitionResult: AcquisitionResult,
): Promise<SanitizationResult> {
  const tier = acquisitionResult.source.familiarity;
  const allFindings: HygieneFinding[] = [];

  for (const staged of acquisitionResult.staged) {
    const findings = tier === 'STRANGER'
      ? runStrangerChecks(staged.content, staged.filename)
      : runHomeChecks(staged.content, staged.filename);
    allFindings.push(...findings);
  }

  const report = buildReport(allFindings, tier);
  const autoApproved = tier === 'HOME' && allFindings.length === 0;

  return {
    source: acquisitionResult.source,
    staged: acquisitionResult.staged,
    report,
    autoApproved,
  };
}

// === Tier Routing ===

function runStrangerChecks(content: string, filename: string): HygieneFinding[] {
  return [
    ...checkPromptInjection(content, filename, 'STRANGER'),
    ...checkHiddenCharacters(content, filename),
    ...checkEmbeddedCode(content, filename),
    ...checkExternalResources(content, filename),
    ...checkPathTraversal(filename),
    ...checkContentTypeMismatch(content, filename),
  ];
}

function runHomeChecks(content: string, filename: string): HygieneFinding[] {
  return [
    ...checkPromptInjection(content, filename, 'HOME'),
    ...checkEmbeddedCode(content, filename),
    ...checkPathTraversal(filename),
    ...checkContentTypeMismatch(content, filename),
  ];
}

// === Check Functions ===

function checkPromptInjection(
  content: string,
  filename: string,
  tier: SourceFamiliarity,
): HygieneFinding[] {
  const findings: HygieneFinding[] = [];

  // Critical patterns checked for all tiers
  const criticalPatterns: Array<{ regex: RegExp; description: string }> = [
    { regex: /<system>[\s\S]*?<\/system>/gi, description: 'XML system tag injection detected' },
    { regex: /<\|im_start\|>/gi, description: 'Chat template injection marker detected (im_start)' },
    { regex: /<\|im_end\|>/gi, description: 'Chat template injection marker detected (im_end)' },
    { regex: /\[INST\]/gi, description: 'Llama template injection marker detected ([INST])' },
    { regex: /\[\/INST\]/gi, description: 'Llama template injection marker detected ([/INST])' },
  ];

  // Soft patterns only checked for STRANGER tier
  const strangerPatterns: Array<{ regex: RegExp; description: string }> = [
    { regex: /ignore\s+(all\s+)?previous\s+instructions/gi, description: 'Instruction override attempt detected' },
    { regex: /you\s+are\s+now/gi, description: 'Role override attempt detected' },
    { regex: /^system:\s/gim, description: 'System prefix injection detected' },
    { regex: /IMPORTANT:\s*(disregard|ignore|override|forget)/gi, description: 'Instruction override via IMPORTANT prefix' },
    { regex: /^Human:\s/gim, description: 'Role injection detected (Human:)' },
    { regex: /^Assistant:\s/gim, description: 'Role injection detected (Assistant:)' },
  ];

  const patterns = tier === 'STRANGER'
    ? [...criticalPatterns, ...strangerPatterns]
    : criticalPatterns;

  for (const { regex, description } of patterns) {
    const match = regex.exec(content);
    if (match) {
      const start = Math.max(0, match.index - 20);
      const end = Math.min(content.length, match.index + match[0].length + 20);
      const evidence = content.slice(start, end);

      findings.push({
        category: 'prompt-injection',
        severity: 'critical',
        description,
        location: `${filename}:offset ${match.index}`,
        evidence: truncate(evidence, 200),
        recommendation: 'Review content for injection attempts. Remove or neutralize suspicious patterns.',
      });
    }
    // Reset regex lastIndex for stateful regexes
    regex.lastIndex = 0;
  }

  return findings;
}

function checkHiddenCharacters(content: string, filename: string): HygieneFinding[] {
  const findings: HygieneFinding[] = [];

  // Zero-width characters
  const zeroWidthChars = [
    { char: '\u200B', name: 'zero-width space' },
    { char: '\u200C', name: 'zero-width non-joiner' },
    { char: '\u200D', name: 'zero-width joiner' },
    { char: '\uFEFF', name: 'byte order mark (in content)' },
  ];

  for (const { char, name } of zeroWidthChars) {
    const idx = content.indexOf(char);
    if (idx !== -1) {
      findings.push({
        category: 'hidden-characters',
        severity: 'warning',
        description: `Hidden ${name} (U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}) found`,
        location: `${filename}:offset ${idx}`,
        evidence: truncate(content.slice(Math.max(0, idx - 10), idx + 10), 200),
        recommendation: 'Remove zero-width characters that could be used to hide content.',
      });
    }
  }

  // Directional overrides (critical severity)
  const dirOverrides = /[\u202A-\u202E\u2066-\u2069]/g;
  let dirMatch: RegExpExecArray | null;
  while ((dirMatch = dirOverrides.exec(content)) !== null) {
    const code = dirMatch[0].charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
    findings.push({
      category: 'hidden-characters',
      severity: 'critical',
      description: `Directional override character (U+${code}) found — can reverse text display`,
      location: `${filename}:offset ${dirMatch.index}`,
      evidence: truncate(content.slice(Math.max(0, dirMatch.index - 10), dirMatch.index + 10), 200),
      recommendation: 'Remove directional override characters. These can disguise malicious content.',
    });
  }

  // Invisible formatting characters
  const invisibleChars = [
    { char: '\u00AD', name: 'soft hyphen' },
    { char: '\u034F', name: 'combining grapheme joiner' },
  ];

  for (const { char, name } of invisibleChars) {
    const idx = content.indexOf(char);
    if (idx !== -1) {
      findings.push({
        category: 'hidden-characters',
        severity: 'warning',
        description: `Invisible formatting character: ${name}`,
        location: `${filename}:offset ${idx}`,
        evidence: truncate(content.slice(Math.max(0, idx - 10), idx + 10), 200),
        recommendation: 'Review invisible formatting characters for hidden content.',
      });
    }
  }

  // Homoglyphs: Cyrillic characters mixed with Latin text
  const hasCyrillic = /[\u0400-\u04FF]/.test(content);
  const hasLatin = /[a-zA-Z]/.test(content);
  if (hasCyrillic && hasLatin) {
    const cyrMatch = content.match(/[\u0400-\u04FF]/);
    const idx = cyrMatch ? content.indexOf(cyrMatch[0]) : 0;
    findings.push({
      category: 'hidden-characters',
      severity: 'warning',
      description: 'Cyrillic characters mixed with Latin text — possible homoglyph attack',
      location: `${filename}:offset ${idx}`,
      evidence: truncate(content.slice(Math.max(0, idx - 20), idx + 20), 200),
      recommendation: 'Check for lookalike character substitutions (e.g., Cyrillic "a" for Latin "a").',
    });
  }

  return findings;
}

function checkEmbeddedCode(content: string, filename: string): HygieneFinding[] {
  const findings: HygieneFinding[] = [];

  const patterns: Array<{ regex: RegExp; description: string; severity: HygieneSeverity }> = [
    { regex: /<script[\s>]/gi, description: 'Script tag detected', severity: 'critical' },
    { regex: /<\/script>/gi, description: 'Script closing tag detected', severity: 'critical' },
    { regex: /data:[^,]+;base64,/gi, description: 'Data URI with base64 encoding detected', severity: 'critical' },
    { regex: /javascript:/gi, description: 'JavaScript URI scheme detected', severity: 'critical' },
    { regex: /on\w+=["']/gi, description: 'Inline event handler detected', severity: 'warning' },
  ];

  for (const { regex, description, severity } of patterns) {
    const match = regex.exec(content);
    if (match) {
      const start = Math.max(0, match.index - 20);
      const end = Math.min(content.length, match.index + match[0].length + 20);
      findings.push({
        category: 'embedded-code',
        severity,
        description,
        location: `${filename}:offset ${match.index}`,
        evidence: truncate(content.slice(start, end), 200),
        recommendation: 'Remove embedded executable code from content.',
      });
    }
    regex.lastIndex = 0;
  }

  // Long base64 blocks (>100 chars on a single line)
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length >= 100 && /^[A-Za-z0-9+/=]{100,}$/.test(line)) {
      findings.push({
        category: 'embedded-code',
        severity: 'warning',
        description: `Suspicious base64 block (${line.length} chars) detected`,
        location: `${filename}:line ${i + 1}`,
        evidence: truncate(line, 200),
        recommendation: 'Inspect base64 content for embedded payloads.',
      });
    }
  }

  return findings;
}

function checkExternalResources(content: string, filename: string): HygieneFinding[] {
  const findings: HygieneFinding[] = [];

  // Critical: iframe, embed, object tags, src= with http
  const criticalPatterns: Array<{ regex: RegExp; description: string }> = [
    { regex: /<iframe/gi, description: 'Iframe tag detected — potential content injection' },
    { regex: /src=["']https?:\/\//gi, description: 'Remote resource reference in src attribute' },
  ];

  for (const { regex, description } of criticalPatterns) {
    const match = regex.exec(content);
    if (match) {
      const start = Math.max(0, match.index - 20);
      const end = Math.min(content.length, match.index + match[0].length + 40);
      findings.push({
        category: 'external-resources',
        severity: 'critical',
        description,
        location: `${filename}:offset ${match.index}`,
        evidence: truncate(content.slice(start, end), 200),
        recommendation: 'Remove external resource references. Content should be self-contained.',
      });
    }
    regex.lastIndex = 0;
  }

  // Warning: URLs in content, object/embed tags, CSS url()
  const warningPatterns: Array<{ regex: RegExp; description: string }> = [
    { regex: /<object/gi, description: 'Object tag detected' },
    { regex: /<embed/gi, description: 'Embed tag detected' },
    { regex: /url\(["']?https?:\/\//gi, description: 'CSS url() with remote resource' },
  ];

  for (const { regex, description } of warningPatterns) {
    const match = regex.exec(content);
    if (match) {
      const start = Math.max(0, match.index - 20);
      const end = Math.min(content.length, match.index + match[0].length + 40);
      findings.push({
        category: 'external-resources',
        severity: 'warning',
        description,
        location: `${filename}:offset ${match.index}`,
        evidence: truncate(content.slice(start, end), 200),
        recommendation: 'Review external resource references.',
      });
    }
    regex.lastIndex = 0;
  }

  // URLs in content (warning) — but NOT relative references
  const urlRegex = /https?:\/\/[^\s)>"']+/g;
  let urlMatch: RegExpExecArray | null;
  // Only flag if we haven't already flagged via critical patterns
  const alreadyFlaggedOffsets = new Set(
    findings.map(f => {
      const offsetMatch = f.location.match(/offset (\d+)/);
      return offsetMatch ? parseInt(offsetMatch[1]) : -1;
    })
  );

  while ((urlMatch = urlRegex.exec(content)) !== null) {
    if (!alreadyFlaggedOffsets.has(urlMatch.index)) {
      findings.push({
        category: 'external-resources',
        severity: 'warning',
        description: 'External URL reference found in content',
        location: `${filename}:offset ${urlMatch.index}`,
        evidence: truncate(urlMatch[0], 200),
        recommendation: 'Verify URL is benign or remove external reference.',
      });
      break; // Only report first URL to avoid noise
    }
  }

  return findings;
}

function checkPathTraversal(filename: string): HygieneFinding[] {
  const findings: HygieneFinding[] = [];

  // ../ or ..\ sequences
  if (/\.\.[\\/]/.test(filename)) {
    findings.push({
      category: 'path-traversal',
      severity: 'critical',
      description: 'Path traversal sequence (../) detected in filename',
      location: filename,
      evidence: truncate(filename, 200),
      recommendation: 'Reject archive entries with path traversal sequences.',
    });
  }

  // Absolute paths
  if (/^\//.test(filename) || /^[A-Za-z]:\\/.test(filename)) {
    findings.push({
      category: 'path-traversal',
      severity: 'critical',
      description: 'Absolute path detected in filename',
      location: filename,
      evidence: truncate(filename, 200),
      recommendation: 'Reject archive entries with absolute paths.',
    });
  }

  // Null bytes
  if (filename.includes('\x00')) {
    findings.push({
      category: 'path-traversal',
      severity: 'critical',
      description: 'Null byte detected in filename',
      location: filename,
      evidence: truncate(filename.replace(/\x00/g, '\\x00'), 200),
      recommendation: 'Reject filenames containing null bytes.',
    });
  }

  return findings;
}

function checkContentTypeMismatch(content: string, filename: string): HygieneFinding[] {
  const findings: HygieneFinding[] = [];

  // Count null bytes — if > 5% of content, flag as binary
  let nullCount = 0;
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 0) {
      nullCount++;
    }
  }

  if (content.length > 0 && nullCount / content.length > 0.05) {
    findings.push({
      category: 'content-type-mismatch',
      severity: 'warning',
      description: `Binary content detected in text file (${Math.round(nullCount / content.length * 100)}% null bytes)`,
      location: filename,
      evidence: '(binary content)',
      recommendation: 'Verify file is actually a text document, not a binary masquerading as text.',
    });
  }

  return findings;
}

// === Report Builder ===

function buildReport(findings: HygieneFinding[], tier: 'HOME' | 'STRANGER'): HygieneReport {
  const hasCritical = findings.some(f => f.severity === 'critical');

  return {
    findings,
    tier,
    passed: !hasCritical,
    summary: `${findings.length} finding(s) \u2014 ${hasCritical ? 'review required' : 'clean'}`,
    checkedAt: new Date().toISOString(),
  };
}

// === Utilities ===

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}
