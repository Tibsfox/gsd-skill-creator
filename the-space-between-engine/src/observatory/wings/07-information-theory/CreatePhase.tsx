// Wing 7 — Create Phase: "Encode a Message"
// Compress an image, see what lossy compression keeps/discards.
// Then compress a message from someone you care about.
// Must produce a saveable Creation object.
// Completion: produce any creation OR skip with acknowledgment.

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { FoundationId, PhaseType, LearnerState, Creation } from '@/types/index';

interface CreatePhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onCreationSave: (creation: Creation) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

function compressMessage(message: string, level: number): { compressed: string; kept: number; lost: number } {
  if (level <= 0) return { compressed: message, kept: message.length, lost: 0 };

  const words = message.split(/\s+/);
  const totalWords = words.length;

  // Lossy compression: remove words in order of "importance" (shorter = less important)
  // At high compression, only the longest/rarest words survive
  const scored = words.map((word, i) => ({
    word,
    index: i,
    score: word.length + (i === 0 || i === totalWords - 1 ? 5 : 0), // keep first/last
  }));

  scored.sort((a, b) => b.score - a.score);

  const keepCount = Math.max(1, Math.round(totalWords * (1 - level * 0.8)));
  const kept = scored.slice(0, keepCount);
  kept.sort((a, b) => a.index - b.index);

  const compressed = kept.map(w => w.word).join(' ');
  return { compressed, kept: keepCount, lost: totalWords - keepCount };
}

export function CreatePhase({
  onComplete,
  onCreationSave,
}: CreatePhaseProps): React.JSX.Element {
  const [personalMessage, setPersonalMessage] = useState('');
  const [compressionLevel, setCompressionLevel] = useState(0);
  const [compressedResult, setCompressedResult] = useState({ compressed: '', kept: 0, lost: 0 });
  const [reflection, setReflection] = useState('');
  const [completed, setCompleted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update compression when message or level changes
  useEffect(() => {
    if (personalMessage.trim()) {
      setCompressedResult(compressMessage(personalMessage, compressionLevel));
    }
  }, [personalMessage, compressionLevel]);

  // Draw pixel grid compression visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    // Generate a simple "image" — gradient with detail
    const gridSize = 20;
    const cellW = (w / 2 - 20) / gridSize;
    const cellH = (h - 40) / gridSize;
    const blockSize = Math.max(1, Math.round(1 + compressionLevel * 8));

    // Original
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('Original', w * 0.25, 16);

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const hue = (x / gridSize) * 240 + (y / gridSize) * 60;
        const light = 30 + (Math.sin(x * 0.5) * Math.cos(y * 0.7)) * 20;
        ctx.fillStyle = `hsl(${hue}, 60%, ${light + 30}%)`;
        ctx.fillRect(10 + x * cellW, 24 + y * cellH, cellW - 1, cellH - 1);
      }
    }

    // Compressed
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`Compressed (block=${blockSize})`, w * 0.75, 16);

    for (let y = 0; y < gridSize; y += blockSize) {
      for (let x = 0; x < gridSize; x += blockSize) {
        // Average the block
        const hue = ((x + blockSize / 2) / gridSize) * 240 + ((y + blockSize / 2) / gridSize) * 60;
        const light = 30 + (Math.sin((x + blockSize / 2) * 0.5) * Math.cos((y + blockSize / 2) * 0.7)) * 20;
        ctx.fillStyle = `hsl(${hue}, 60%, ${light + 30}%)`;

        const bw = Math.min(blockSize, gridSize - x) * cellW;
        const bh = Math.min(blockSize, gridSize - y) * cellH;
        ctx.fillRect(w / 2 + 10 + x * cellW, 24 + y * cellH, bw - 1, bh - 1);
      }
    }

    // Info
    const originalPixels = gridSize * gridSize;
    const compressedBlocks = Math.ceil(gridSize / blockSize) ** 2;
    const ratio = (compressedBlocks / originalPixels * 100).toFixed(0);
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(255, 200, 100, 0.5)';
    ctx.textAlign = 'center';
    ctx.fillText(`Detail kept: ${ratio}%`, w * 0.75, h - 6);
  }, [compressionLevel]);

  const handleSave = useCallback(() => {
    const creation: Creation = {
      id: `information-theory-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      foundationId: 'information-theory',
      type: 'journal',
      title: 'Message Compression',
      data: JSON.stringify({
        originalMessage: personalMessage,
        compressionLevel,
        compressedMessage: compressedResult.compressed,
        wordsKept: compressedResult.kept,
        wordsLost: compressedResult.lost,
        reflection,
      }),
      createdAt: new Date().toISOString(),
      shared: false,
    };
    onCreationSave(creation);
    setCompleted(true);
  }, [personalMessage, compressionLevel, compressedResult, reflection, onCreationSave]);

  const handleSkip = useCallback(() => {
    setCompleted(true);
  }, []);

  const handleContinue = useCallback(() => {
    onComplete('create');
  }, [onComplete]);

  return (
    <div className="phase phase--create">
      <h2 className="create__title">Encode a Message</h2>

      <div className="create__image-section">
        <p className="create__prompt">
          First, watch what lossy compression does to an image. Drag the slider and
          see what detail the compression keeps and what it discards.
        </p>
        <canvas
          ref={canvasRef}
          width={600}
          height={280}
          className="create__canvas"
          aria-label="Side-by-side comparison of original and compressed pixel grid"
        />
        <label className="create__compression-slider">
          Compression level:
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={compressionLevel}
            onChange={(e) => setCompressionLevel(parseFloat(e.target.value))}
          />
          <span>{(compressionLevel * 100).toFixed(0)}%</span>
        </label>
      </div>

      <div className="create__message-section">
        <p className="create__prompt">
          Now write a message from someone you care about — or to someone you care
          about. Watch what the compression keeps.
        </p>
        <textarea
          className="create__textarea"
          value={personalMessage}
          onChange={(e) => setPersonalMessage(e.target.value)}
          placeholder="Write a message that matters to you..."
          rows={4}
          aria-label="Write a personal message to compress"
        />

        {personalMessage.trim() && (
          <div className="create__compression-result">
            <p className="create__result-label">
              At {(compressionLevel * 100).toFixed(0)}% compression
              ({compressedResult.kept} words kept, {compressedResult.lost} lost):
            </p>
            <blockquote className="create__compressed-message">
              {compressedResult.compressed || '(nothing survives)'}
            </blockquote>
            <p className="create__question">
              Is the meaning still there? What was lost — decoration or substance?
            </p>
          </div>
        )}

        <textarea
          className="create__textarea"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="What survives compression? What cannot be compressed?"
          rows={3}
          aria-label="Reflection on compression"
        />
      </div>

      {!completed && (
        <div className="create__save-area">
          <div className="create__save-buttons">
            <button
              className="create__save-btn"
              onClick={handleSave}
              disabled={!personalMessage.trim()}
            >
              Save to journal
            </button>
            <button className="create__skip-btn" onClick={handleSkip}>
              Continue without saving
            </button>
          </div>
        </div>
      )}

      {completed && (
        <div className="create__continue">
          <button className="phase__continue-btn" onClick={handleContinue}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
