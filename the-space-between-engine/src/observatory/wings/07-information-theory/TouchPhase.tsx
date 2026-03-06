// Wing 7 — Touch Phase: "Encode and Transmit"
// Build a communication channel. Choose encoding. Add noise with slider.
// Watch message degrade. Find threshold where meaning survives/dies.
// Shannon's limit as a cliff you can feel.
// Every numeric readout: plain-language label FIRST, then notation in parentheses.
// Completion: >= 3 parameter changes OR >= 2min.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';

interface TouchPhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

const MESSAGES = [
  'HELLO WORLD',
  'THE FOX LISTENS',
  'BIRDSONG CARRIES',
  'MEANING SURVIVES',
];

function addNoise(message: string, noiseLevel: number): string {
  const chars = message.split('');
  return chars.map((ch) => {
    if (ch === ' ') return ' ';
    if (Math.random() < noiseLevel) {
      // Corrupt the character
      const offset = Math.floor(Math.random() * 26);
      return String.fromCharCode(65 + offset);
    }
    return ch;
  }).join('');
}

function applyRedundancy(message: string, redundancy: number): string {
  if (redundancy <= 0) return message;
  const reps = Math.max(1, Math.round(1 + redundancy * 4));
  return Array(reps).fill(message).join('|');
}

function decodeWithRedundancy(encoded: string, redundancy: number): string {
  if (redundancy <= 0) return encoded;
  const parts = encoded.split('|');
  if (parts.length <= 1) return encoded;

  // Majority vote per character position
  const maxLen = Math.max(...parts.map(p => p.length));
  let result = '';
  for (let i = 0; i < maxLen; i++) {
    const votes = new Map<string, number>();
    for (const part of parts) {
      const ch = part[i] ?? '';
      votes.set(ch, (votes.get(ch) ?? 0) + 1);
    }
    let best = '';
    let bestCount = 0;
    for (const [ch, count] of Array.from(votes.entries())) {
      if (count > bestCount) {
        bestCount = count;
        best = ch;
      }
    }
    result += best;
  }
  return result;
}

function computeAccuracy(original: string, received: string): number {
  let correct = 0;
  const len = Math.max(original.length, received.length);
  if (len === 0) return 1;
  for (let i = 0; i < len; i++) {
    if (original[i] === received[i]) correct++;
  }
  return correct / len;
}

export function TouchPhase({
  onComplete,
}: TouchPhaseProps): React.JSX.Element {
  const [timeSpent, setTimeSpent] = useState(0);
  const [interactionCount, setInteractionCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0.1);
  const [redundancy, setRedundancy] = useState(0);
  const [messageIdx, setMessageIdx] = useState(0);
  const [transmittedMessage, setTransmittedMessage] = useState('');
  const [decodedMessage, setDecodedMessage] = useState('');
  const [accuracy, setAccuracy] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const originalMessage = MESSAGES[messageIdx % MESSAGES.length]!;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (completed) return;
    if (interactionCount >= 3 || timeSpent >= 120) {
      setCompleted(true);
    }
  }, [interactionCount, timeSpent, completed]);

  // Transmit when parameters change
  useEffect(() => {
    const encoded = applyRedundancy(originalMessage, redundancy);
    const noisy = addNoise(encoded, noiseLevel);
    const decoded = decodeWithRedundancy(noisy, redundancy);
    setTransmittedMessage(noisy);
    setDecodedMessage(decoded);
    setAccuracy(computeAccuracy(originalMessage, decoded));
  }, [noiseLevel, redundancy, originalMessage]);

  // Canvas animation — channel visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const draw = () => {
      time += 0.02;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      // Channel visualization
      const channelY = h * 0.4;
      const channelH = 60;

      // Channel zone with noise particles
      ctx.fillStyle = `rgba(255, 50, 50, ${noiseLevel * 0.15})`;
      ctx.fillRect(w * 0.25, channelY - channelH / 2, w * 0.5, channelH);

      // Noise particles
      for (let i = 0; i < Math.floor(noiseLevel * 100); i++) {
        const nx = w * 0.25 + Math.random() * w * 0.5;
        const ny = channelY - channelH / 2 + Math.random() * channelH;
        ctx.fillStyle = `rgba(255, 80, 80, ${0.3 + Math.random() * 0.3})`;
        ctx.fillRect(nx, ny, 2, 2);
      }

      // Labels
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';

      // Original message
      ctx.fillStyle = 'rgba(79, 195, 247, 0.8)';
      ctx.fillText('Original:', w * 0.12, channelY - 30);
      ctx.font = '14px monospace';
      ctx.fillText(originalMessage, w * 0.12, channelY);

      // Received message
      ctx.fillStyle = accuracy > 0.8 ? 'rgba(100, 200, 100, 0.8)' : 'rgba(255, 100, 100, 0.8)';
      ctx.font = '12px monospace';
      ctx.fillText('Received:', w * 0.88, channelY - 30);
      ctx.font = '14px monospace';
      // Color each character based on correctness
      const recChars = decodedMessage.split('');
      let xPos = w * 0.88 - (recChars.length * 4);
      for (let i = 0; i < recChars.length; i++) {
        const isCorrect = originalMessage[i] === recChars[i];
        ctx.fillStyle = isCorrect ? 'rgba(100, 200, 100, 0.9)' : 'rgba(255, 80, 80, 0.9)';
        ctx.textAlign = 'left';
        ctx.fillText(recChars[i]!, xPos, channelY);
        xPos += 9;
      }

      // Accuracy bar
      const barX = w * 0.15;
      const barY = h * 0.72;
      const barW = w * 0.7;
      const barH = 20;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = accuracy > 0.8 ? 'rgba(100, 200, 100, 0.6)' : 'rgba(255, 100, 100, 0.6)';
      ctx.fillRect(barX, barY, barW * accuracy, barH);

      // Shannon limit indicator
      const shannonLimit = noiseLevel < 0.01 ? 1 : 1 / (1 + noiseLevel * 10);
      ctx.strokeStyle = 'rgba(255, 200, 100, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(barX + barW * shannonLimit, barY - 5);
      ctx.lineTo(barX + barW * shannonLimit, barY + barH + 5);
      ctx.stroke();
      ctx.setLineDash([]);

      // Readouts — plain language FIRST
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(`Message accuracy: ${(accuracy * 100).toFixed(0)}%`, barX, barY - 8);
      ctx.fillStyle = 'rgba(255, 200, 100, 0.5)';
      ctx.textAlign = 'right';
      ctx.fillText(`Noise level: ${(noiseLevel * 100).toFixed(0)}%  (p_error)`, barX + barW, barY - 8);

      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 200, 100, 0.5)';
      ctx.fillText('Shannon limit', barX + barW * shannonLimit, barY + barH + 16);

      // Cliff warning
      if (accuracy < 0.5) {
        ctx.font = '13px Georgia, serif';
        ctx.fillStyle = 'rgba(255, 100, 100, 0.7)';
        ctx.textAlign = 'center';
        ctx.fillText('The meaning is dying. You have crossed the cliff.', w / 2, h - 10);
      } else if (accuracy < 0.8) {
        ctx.font = '13px Georgia, serif';
        ctx.fillStyle = 'rgba(255, 200, 100, 0.5)';
        ctx.textAlign = 'center';
        ctx.fillText('The message is degrading. Can you feel the edge?', w / 2, h - 10);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [noiseLevel, redundancy, originalMessage, decodedMessage, accuracy]);

  const handleContinue = useCallback(() => {
    onComplete('touch');
  }, [onComplete]);

  return (
    <div className="phase phase--touch">
      <div className="touch__intro">
        <h2 className="touch__title">Encode and Transmit</h2>
        <p className="touch__description">
          Send a message through a noisy channel. Increase the noise and watch the
          message degrade. Add redundancy (error correction) and watch it survive
          longer. Find the cliff — the point where meaning dies.
        </p>
      </div>

      <div className="touch__visualization">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="touch__canvas"
          aria-label="Communication channel with noise and error correction — message accuracy visualized as a progress bar"
        />
        <div className="touch__controls">
          <label className="touch__control-label">
            Noise level:
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.02}
              value={noiseLevel}
              onChange={(e) => {
                setNoiseLevel(parseFloat(e.target.value));
                setInteractionCount((prev) => prev + 1);
              }}
            />
            <span>{(noiseLevel * 100).toFixed(0)}%</span>
          </label>
          <label className="touch__control-label">
            Error correction:
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={redundancy}
              onChange={(e) => {
                setRedundancy(parseFloat(e.target.value));
                setInteractionCount((prev) => prev + 1);
              }}
            />
            <span>{(redundancy * 100).toFixed(0)}%</span>
          </label>
          <div className="touch__message-buttons">
            {MESSAGES.map((msg, i) => (
              <button
                key={i}
                className={`touch__op-btn ${messageIdx === i ? 'touch__op-btn--active' : ''}`}
                onClick={() => {
                  setMessageIdx(i);
                  setInteractionCount((prev) => prev + 1);
                }}
              >
                {msg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {completed && (
        <div className="touch__continue">
          <button className="phase__continue-btn" onClick={handleContinue}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
