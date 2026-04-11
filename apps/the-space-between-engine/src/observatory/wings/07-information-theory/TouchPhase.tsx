/**
 * Wing 7: Information Theory — Touch Phase
 * "The Channel"
 *
 * Build a communication system. Choose encoding. Add noise.
 * Watch error rate. Add error correction. See Shannon's limit.
 * At least 2 interactive elements.
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { FoundationPhase } from '../../../types/index.js';

export interface TouchPhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
}

// ─── Simple channel simulation ──────────────────────────

function encodeMessage(message: string, encoding: 'ascii' | 'huffman' | 'repeat3'): string[] {
  const chars = message.split('');
  switch (encoding) {
    case 'ascii':
      return chars.map(c => c.charCodeAt(0).toString(2).padStart(8, '0'));
    case 'huffman':
      // Simplified Huffman-like: common chars get shorter codes
      const commonChars: Record<string, string> = {
        'e': '00', 't': '010', 'a': '011', 'o': '100', 'i': '101',
        'n': '1100', 's': '1101', 'h': '1110', 'r': '1111',
        ' ': '01',
      };
      return chars.map(c => commonChars[c.toLowerCase()] || c.charCodeAt(0).toString(2).padStart(8, '0'));
    case 'repeat3':
      // Triple repetition for error correction
      return chars.map(c => {
        const bits = c.charCodeAt(0).toString(2).padStart(8, '0');
        return bits.split('').map(b => b + b + b).join('');
      });
  }
}

function addNoise(encoded: string[], noiseLevel: number): { corrupted: string[]; flippedBits: number } {
  let flipped = 0;
  const corrupted = encoded.map(codeword => {
    return codeword.split('').map(bit => {
      if (Math.random() < noiseLevel) {
        flipped++;
        return bit === '0' ? '1' : '0';
      }
      return bit;
    }).join('');
  });
  return { corrupted, flippedBits: flipped };
}

function decodeBits(bits: string, encoding: 'ascii' | 'huffman' | 'repeat3'): string {
  if (encoding === 'repeat3') {
    // Majority vote on each triple
    const corrected: string[] = [];
    for (let i = 0; i < bits.length; i += 3) {
      const triple = bits.slice(i, i + 3);
      const ones = triple.split('').filter(b => b === '1').length;
      corrected.push(ones >= 2 ? '1' : '0');
    }
    const byte = corrected.join('');
    const charCode = parseInt(byte.slice(0, 8), 2);
    return charCode > 0 && charCode < 128 ? String.fromCharCode(charCode) : '?';
  }
  // For ascii, just decode directly
  const charCode = parseInt(bits.slice(0, 8), 2);
  return charCode > 0 && charCode < 128 ? String.fromCharCode(charCode) : '?';
}

export const TouchPhase: React.FC<TouchPhaseProps> = ({ phase, onComplete }) => {
  // ─── Interactive Element 1: Message + encoding selector ──
  const [message, setMessage] = useState('hello world');
  const [encoding, setEncoding] = useState<'ascii' | 'huffman' | 'repeat3'>('ascii');

  // ─── Interactive Element 2: Noise level slider ───────────
  const [noiseLevel, setNoiseLevel] = useState(0.05);

  const [interactionCount, setInteractionCount] = useState(0);
  const [transmissionResult, setTransmissionResult] = useState<{
    encoded: string[];
    corrupted: string[];
    flippedBits: number;
    decoded: string;
    totalBits: number;
  } | null>(null);

  const handleInteraction = useCallback(() => {
    setInteractionCount(prev => prev + 1);
  }, []);

  const transmit = useCallback(() => {
    const encoded = encodeMessage(message, encoding);
    const totalBits = encoded.reduce((sum, cw) => sum + cw.length, 0);
    const { corrupted, flippedBits } = addNoise(encoded, noiseLevel);
    const decoded = corrupted.map(bits => decodeBits(bits, encoding)).join('');

    setTransmissionResult({ encoded, corrupted, flippedBits, decoded, totalBits });
    handleInteraction();
  }, [message, encoding, noiseLevel, handleInteraction]);

  const errorRate = transmissionResult
    ? transmissionResult.flippedBits / transmissionResult.totalBits
    : 0;

  const compressionRatio = useMemo(() => {
    if (!transmissionResult) return null;
    const rawBits = message.length * 8;
    const encodedBits = transmissionResult.totalBits;
    return (encodedBits / rawBits).toFixed(2);
  }, [message, transmissionResult]);

  return (
    <div className="wing-phase touch-phase information-theory-touch">
      <h2>{phase.title}</h2>

      <div className="touch-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="touch-interactive-area">
        {/* ─── Interactive Element 1: Message & Encoding ─────── */}
        <div className="interactive-element message-encoder" data-interactive="message-encoder">
          <h3>Your Message</h3>

          <div className="form-field">
            <label htmlFor="channel-message">Type a message to transmit:</label>
            <input
              id="channel-message"
              type="text"
              value={message}
              onChange={e => { setMessage(e.target.value); handleInteraction(); }}
              placeholder="hello world"
              maxLength={40}
            />
          </div>

          <div className="encoding-selector">
            <label>Choose encoding:</label>
            <div className="encoding-options">
              <label>
                <input
                  type="radio"
                  name="encoding"
                  value="ascii"
                  checked={encoding === 'ascii'}
                  onChange={() => { setEncoding('ascii'); handleInteraction(); }}
                />
                ASCII (8 bits per character, no compression)
              </label>
              <label>
                <input
                  type="radio"
                  name="encoding"
                  value="huffman"
                  checked={encoding === 'huffman'}
                  onChange={() => { setEncoding('huffman'); handleInteraction(); }}
                />
                Huffman-like (common letters get shorter codes)
              </label>
              <label>
                <input
                  type="radio"
                  name="encoding"
                  value="repeat3"
                  checked={encoding === 'repeat3'}
                  onChange={() => { setEncoding('repeat3'); handleInteraction(); }}
                />
                Triple repetition (error correction, 3x overhead)
              </label>
            </div>
          </div>
        </div>

        {/* ─── Interactive Element 2: Noise Level ────────────── */}
        <div className="interactive-element noise-control" data-interactive="noise-level">
          <h3>Channel Noise</h3>
          <p>How noisy is the channel? Higher noise = more bit flips.</p>

          <div className="noise-slider">
            <label>
              Noise level: {(noiseLevel * 100).toFixed(1)}%
              <input
                type="range"
                min={0}
                max={0.3}
                step={0.005}
                value={noiseLevel}
                onChange={e => { setNoiseLevel(Number(e.target.value)); handleInteraction(); }}
              />
            </label>
            <div className="noise-labels">
              <span>Clean</span>
              <span>Noisy</span>
              <span>Severe</span>
            </div>
          </div>
        </div>

        {/* ─── Transmit Button ───────────────────────────────── */}
        <div className="transmit-control">
          <button className="transmit-button" onClick={transmit}>
            Transmit Through Channel
          </button>
        </div>

        {/* ─── Results ───────────────────────────────────────── */}
        {transmissionResult && (
          <div className="transmission-results">
            <h3>Transmission Result</h3>

            <div className="result-row">
              <strong>Original:</strong>
              <span className="message-text">{message}</span>
            </div>

            <div className="result-row">
              <strong>Received:</strong>
              <span className={`message-text ${transmissionResult.decoded !== message ? 'corrupted' : 'clean'}`}>
                {transmissionResult.decoded}
              </span>
            </div>

            <div className="result-stats">
              <div className="stat">
                <span className="stat-label">Total bits:</span>
                <span className="stat-value">{transmissionResult.totalBits}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Bits flipped:</span>
                <span className="stat-value">{transmissionResult.flippedBits}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Error rate:</span>
                <span className="stat-value">{(errorRate * 100).toFixed(2)}%</span>
              </div>
              {compressionRatio && (
                <div className="stat">
                  <span className="stat-label">Size ratio:</span>
                  <span className="stat-value">{compressionRatio}x</span>
                </div>
              )}
              <div className="stat">
                <span className="stat-label">Message survived?</span>
                <span className={`stat-value ${transmissionResult.decoded === message ? 'success' : 'failure'}`}>
                  {transmissionResult.decoded === message ? 'Yes!' : 'Corrupted'}
                </span>
              </div>
            </div>

            <div className="shannon-insight">
              <p>
                <strong>Shannon's insight:</strong> There is a maximum rate at which
                information can be sent through a noisy channel with arbitrarily
                low error probability. That rate is the channel capacity. You cannot
                beat it, but with clever encoding (like the triple-repetition code),
                you can approach it. Try different noise levels and encodings to see
                the tradeoff between compression and reliability.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="touch-content">
        <p>{phase.content.text}</p>
      </div>

      <div className="interaction-progress">
        <p>Interactions: {interactionCount}</p>
      </div>

      <button
        className="phase-continue"
        onClick={onComplete}
        disabled={interactionCount < 3}
      >
        I feel the channel's limits...
      </button>
    </div>
  );
};

export default TouchPhase;
