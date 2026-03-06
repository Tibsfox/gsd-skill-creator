// Wing 7 — See Phase: "Surprise and Entropy"
// Watch information flow through a channel. See surprise accumulate into entropy.
// Common symbols carry little surprise. Rare ones carry lots.
// Completion: interact with visualization OR >= 90s.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';

interface SeePhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

type DistributionType = 'uniform' | 'biased' | 'extreme';

interface SymbolEvent {
  symbol: string;
  x: number;
  y: number;
  surprise: number;
  age: number;
}

function getDistribution(type: DistributionType): { symbols: string[]; probs: number[] } {
  switch (type) {
    case 'uniform':
      return { symbols: ['A', 'B', 'C', 'D'], probs: [0.25, 0.25, 0.25, 0.25] };
    case 'biased':
      return { symbols: ['A', 'B', 'C', 'D'], probs: [0.7, 0.15, 0.1, 0.05] };
    case 'extreme':
      return { symbols: ['A', 'B', 'C', 'D'], probs: [0.97, 0.01, 0.01, 0.01] };
  }
}

function computeEntropy(probs: number[]): number {
  return -probs
    .filter(p => p > 0)
    .reduce((sum, p) => sum + p * Math.log2(p), 0);
}

function sampleSymbol(probs: number[]): number {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < probs.length; i++) {
    cum += probs[i]!;
    if (r < cum) return i;
  }
  return probs.length - 1;
}

export function SeePhase({
  onComplete,
}: SeePhaseProps): React.JSX.Element {
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [distType, setDistType] = useState<DistributionType>('uniform');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const eventsRef = useRef<SymbolEvent[]>([]);
  const countsRef = useRef<number[]>([0, 0, 0, 0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (completed) return;
    if (timeSpent >= 90 || hasInteracted) {
      setCompleted(true);
    }
  }, [timeSpent, hasInteracted, completed]);

  // Reset counts when distribution changes
  useEffect(() => {
    countsRef.current = [0, 0, 0, 0];
    eventsRef.current = [];
  }, [distType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const { symbols, probs } = getDistribution(distType);
    const entropy = computeEntropy(probs);
    const symbolColors = ['#4fc3f7', '#81c784', '#f06292', '#ffcc80'];

    const draw = () => {
      frameCount++;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      // Spawn new symbol event periodically
      if (frameCount % 30 === 0) {
        const idx = sampleSymbol(probs);
        const prob = probs[idx]!;
        const surprise = -Math.log2(prob);
        countsRef.current[idx]!++;

        eventsRef.current.push({
          symbol: symbols[idx]!,
          x: 50 + Math.random() * (w - 100),
          y: h * 0.35,
          surprise,
          age: 0,
        });
      }

      // Draw probability bars on the left
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('Probability:', 10, 20);

      for (let i = 0; i < symbols.length; i++) {
        const barY = 30 + i * 24;
        const barW = probs[i]! * 200;

        ctx.fillStyle = symbolColors[i]!;
        ctx.fillRect(10, barY, barW, 16);

        ctx.fillStyle = '#fff';
        ctx.font = '11px monospace';
        ctx.fillText(`${symbols[i]!}: ${(probs[i]! * 100).toFixed(0)}%`, barW + 16, barY + 12);
      }

      // Draw entropy gauge
      ctx.font = '12px monospace';
      ctx.fillStyle = 'rgba(255, 200, 100, 0.7)';
      ctx.textAlign = 'right';
      ctx.fillText(`Average surprise: ${entropy.toFixed(3)} bits  (H)`, w - 10, 20);

      // Draw symbol events falling and fading
      for (let i = eventsRef.current.length - 1; i >= 0; i--) {
        const evt = eventsRef.current[i]!;
        evt.age++;
        evt.y += 0.5;

        if (evt.age > 200) {
          eventsRef.current.splice(i, 1);
          continue;
        }

        const alpha = Math.max(0, 1 - evt.age / 200);
        // Size proportional to surprise
        const radius = 8 + evt.surprise * 4;

        const symIdx = symbols.indexOf(evt.symbol);
        ctx.fillStyle = symbolColors[symIdx >= 0 ? symIdx : 0]!;
        ctx.globalAlpha = alpha * 0.7;
        ctx.beginPath();
        ctx.arc(evt.x, evt.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.globalAlpha = alpha;
        ctx.font = `${10 + evt.surprise * 2}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(evt.symbol, evt.x, evt.y + 4);

        // Surprise label
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(255, 200, 100, 0.6)';
        ctx.fillText(`${evt.surprise.toFixed(1)} bits`, evt.x, evt.y + radius + 12);
        ctx.globalAlpha = 1;
      }

      // Observed counts
      const totalCount = countsRef.current.reduce((a, b) => a + b, 0);
      if (totalCount > 0) {
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('Observed:', 10, h - 40);
        for (let i = 0; i < symbols.length; i++) {
          const pct = ((countsRef.current[i]! / totalCount) * 100).toFixed(0);
          ctx.fillText(`${symbols[i]!}: ${countsRef.current[i]!} (${pct}%)`, 10 + i * 110, h - 24);
        }
      }

      // Hint
      ctx.font = '11px Georgia, serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.textAlign = 'center';
      ctx.fillText('Bigger circles = more surprise. Rare symbols carry more information.', w / 2, h - 6);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [distType]);

  const handleDistChange = useCallback((d: DistributionType) => {
    setDistType(d);
    setHasInteracted(true);
  }, []);

  const handleContinue = useCallback(() => {
    onComplete('see');
  }, [onComplete]);

  return (
    <div className="phase phase--see">
      <div className="see__intro">
        <h2 className="see__title">Surprise and Entropy</h2>
        <p className="see__description">
          Watch symbols appear. Common symbols are small — they carry little surprise.
          Rare symbols are large — they carry lots. The average surprise across all
          symbols is called entropy.
        </p>
      </div>

      <div className="see__visualization">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="see__canvas"
          aria-label="Symbols appearing with size proportional to their information content — rare symbols appear larger"
        />
        <div className="see__controls">
          <button
            className={`see__op-btn ${distType === 'uniform' ? 'see__op-btn--active' : ''}`}
            onClick={() => handleDistChange('uniform')}
          >Equal chances</button>
          <button
            className={`see__op-btn ${distType === 'biased' ? 'see__op-btn--active' : ''}`}
            onClick={() => handleDistChange('biased')}
          >One is common</button>
          <button
            className={`see__op-btn ${distType === 'extreme' ? 'see__op-btn--active' : ''}`}
            onClick={() => handleDistChange('extreme')}
          >Almost always the same</button>
        </div>
      </div>

      {completed && (
        <div className="see__continue">
          <button className="phase__continue-btn" onClick={handleContinue}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
