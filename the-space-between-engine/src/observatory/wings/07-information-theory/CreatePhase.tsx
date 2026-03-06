/**
 * Wing 7: Information Theory — Create Phase
 * "The Channel"
 *
 * "Encode a Message" — compress text, see what stays and what goes.
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { FoundationPhase } from '../../../types/index.js';
import { nowISO } from '../../../types/index.js';

export interface CreatePhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
  onSaveCreation?: (creation: {
    foundationId: 'information-theory';
    type: 'journal';
    title: string;
    data: string;
    shared: boolean;
  }) => void;
}

// ─── Simple compression simulation ──────────────────────

function computeCharFrequencies(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  for (const c of text) {
    freq.set(c, (freq.get(c) || 0) + 1);
  }
  return freq;
}

function computeEntropy(text: string): number {
  if (text.length === 0) return 0;
  const freq = computeCharFrequencies(text);
  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / text.length;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

function compressLossy(text: string, level: number): string {
  if (level <= 0) return text;

  let result = text;

  // Level 1: Remove double spaces and extra whitespace
  if (level >= 1) {
    result = result.replace(/\s+/g, ' ').trim();
  }

  // Level 2: Remove vowels from non-first positions of words
  if (level >= 2) {
    result = result.split(' ').map(word => {
      if (word.length <= 2) return word;
      return word[0] + word.slice(1).replace(/[aeiouAEIOU]/g, '');
    }).join(' ');
  }

  // Level 3: Truncate long words
  if (level >= 3) {
    result = result.split(' ').map(word => {
      return word.length > 4 ? word.slice(0, 4) : word;
    }).join(' ');
  }

  // Level 4: Remove articles and prepositions
  if (level >= 4) {
    const stopWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'it', 'by']);
    result = result.split(' ').filter(w => !stopWords.has(w.toLowerCase())).join(' ');
  }

  return result;
}

export const CreatePhase: React.FC<CreatePhaseProps> = ({ phase, onComplete, onSaveCreation }) => {
  const [originalText, setOriginalText] = useState(
    'The quick brown fox jumps over the lazy dog sleeping in the warm afternoon sun'
  );
  const [compressionLevel, setCompressionLevel] = useState(0);
  const [reflection, setReflection] = useState('');
  const [saved, setSaved] = useState(false);

  const compressed = useMemo(() => compressLossy(originalText, compressionLevel), [originalText, compressionLevel]);

  const originalEntropy = useMemo(() => computeEntropy(originalText), [originalText]);
  const compressedEntropy = useMemo(() => computeEntropy(compressed), [compressed]);
  const originalBits = originalText.length * 8;
  const compressedBits = compressed.length * 8;
  const ratio = originalBits > 0 ? (compressedBits / originalBits * 100).toFixed(1) : '0';

  const canSave = originalText.trim().length > 0 && compressionLevel > 0;

  const handleSave = useCallback(() => {
    if (!canSave) return;

    const creationData = JSON.stringify({
      original: originalText,
      compressed,
      compressionLevel,
      originalEntropy: originalEntropy.toFixed(3),
      compressedEntropy: compressedEntropy.toFixed(3),
      compressionRatio: ratio,
      lostInformation: originalText.length - compressed.length,
      reflection: reflection.trim(),
      createdAt: nowISO(),
    });

    onSaveCreation?.({
      foundationId: 'information-theory',
      type: 'journal',
      title: `Compression Study: "${originalText.slice(0, 30)}..."`,
      data: creationData,
      shared: false,
    });

    setSaved(true);
  }, [canSave, originalText, compressed, compressionLevel, originalEntropy, compressedEntropy, ratio, reflection, onSaveCreation]);

  return (
    <div className="wing-phase create-phase information-theory-create">
      <h2>{phase.title}</h2>

      <div className="create-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="create-workspace">
        <div className="creation-form">
          <h3>Encode a Message</h3>
          <p>
            Type a message. Then compress it. Watch what stays and what goes.
            What is essential? What is noise?
          </p>

          <div className="form-field">
            <label htmlFor="original-message">Your message:</label>
            <textarea
              id="original-message"
              value={originalText}
              onChange={e => setOriginalText(e.target.value)}
              rows={3}
              placeholder="Type something meaningful to you..."
            />
          </div>

          <div className="form-field">
            <label>
              Compression level: {compressionLevel}
              <input
                type="range"
                min={0}
                max={4}
                step={1}
                value={compressionLevel}
                onChange={e => setCompressionLevel(Number(e.target.value))}
              />
            </label>
            <div className="compression-labels">
              <span>None</span>
              <span>Whitespace</span>
              <span>Vowels</span>
              <span>Truncate</span>
              <span>Strip words</span>
            </div>
          </div>
        </div>

        <div className="compression-result">
          <h3>After Compression</h3>
          <div className="result-comparison">
            <div className="original-display">
              <h4>Original ({originalText.length} chars, {originalBits} bits)</h4>
              <p className="message-text">{originalText}</p>
              <p className="entropy-display">Entropy: {originalEntropy.toFixed(3)} bits/char</p>
            </div>
            <div className="compressed-display">
              <h4>Compressed ({compressed.length} chars, {compressedBits} bits)</h4>
              <p className="message-text compressed">{compressed}</p>
              <p className="entropy-display">Entropy: {compressedEntropy.toFixed(3)} bits/char</p>
            </div>
          </div>

          <div className="compression-stats">
            <div className="stat">
              <span className="stat-label">Size:</span>
              <span className="stat-value">{ratio}% of original</span>
            </div>
            <div className="stat">
              <span className="stat-label">Characters lost:</span>
              <span className="stat-value">{originalText.length - compressed.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Still readable?</span>
              <span className="stat-value">{compressionLevel <= 2 ? 'Probably' : 'Barely'}</span>
            </div>
          </div>

          <div className="key-question">
            <p>
              <strong>The key question:</strong> Can you still understand the compressed message?
              At what point does the meaning break? That breaking point is where
              the essential information lives — everything you can remove without
              losing it was redundancy. Everything that remains is signal.
            </p>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="compression-reflection">
            What stayed? What was lost? What does that tell you about your message?
          </label>
          <textarea
            id="compression-reflection"
            value={reflection}
            onChange={e => setReflection(e.target.value)}
            rows={4}
            placeholder="What is essential about your message?"
          />
        </div>

        {phase.content.mathNotation && (
          <div className="formal-reference">
            <h4>Formal Reference</h4>
            <pre className="math-display">{phase.content.mathNotation}</pre>
          </div>
        )}
      </div>

      <div className="create-actions">
        {!saved ? (
          <button
            className="save-creation"
            onClick={handleSave}
            disabled={!canSave}
          >
            Save My Compression Study
          </button>
        ) : (
          <div className="save-confirmation">
            <p>Your message has been encoded. The essential survives.</p>
            <button className="phase-continue" onClick={onComplete}>
              Continue to the final wing...
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePhase;
