// Wing 7 — Wonder Phase: "The Weight of a Message"
// ZERO math notation. Story-driven only.
// "You share a photo of your dog. The joy crosses the wire."
// DNA as message. Birdsong resurfaces from Wing 3. Compass fox returns as RECEIVER.
// Completion: scroll to end OR >= 60s OR interact with simulation.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';
import { getStory } from '@/narrative/index';

interface WonderPhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

export function WonderPhase({
  foundationId,
  onComplete,
}: WonderPhaseProps): React.JSX.Element {
  const story = getStory('information-theory');
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (completed) return;
    if (timeSpent >= 60 || hasScrolledToEnd || hasInteracted) {
      setCompleted(true);
    }
  }, [timeSpent, hasScrolledToEnd, hasInteracted, completed]);

  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      setHasScrolledToEnd(true);
    }
  }, []);

  // Message transmission animation — bits flowing through a channel with noise
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    interface Bit {
      x: number;
      y: number;
      value: 0 | 1;
      corrupted: boolean;
      speed: number;
    }

    const bits: Bit[] = [];
    let time = 0;

    const spawnBit = () => {
      const value = Math.random() > 0.5 ? 1 as const : 0 as const;
      bits.push({
        x: 50,
        y: 150 + (Math.random() - 0.5) * 20,
        value,
        corrupted: false,
        speed: 1.5 + Math.random() * 0.5,
      });
    };

    const draw = () => {
      time += 0.02;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      // Channel boundaries
      ctx.strokeStyle = 'rgba(52, 73, 94, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(100, 100);
      ctx.lineTo(500, 100);
      ctx.moveTo(100, 200);
      ctx.lineTo(500, 200);
      ctx.stroke();
      ctx.setLineDash([]);

      // Noise zone — visible static in the middle of the channel
      const noiseZoneStart = 200;
      const noiseZoneEnd = 400;
      for (let x = noiseZoneStart; x < noiseZoneEnd; x += 8) {
        for (let y = 100; y < 200; y += 8) {
          const noise = Math.random();
          if (noise > 0.85) {
            ctx.fillStyle = `rgba(255, 100, 100, ${noise * 0.3})`;
            ctx.fillRect(x, y, 4, 4);
          }
        }
      }

      // Labels
      ctx.font = '11px Georgia, serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'center';
      ctx.fillText('sender', 50, 90);
      ctx.fillText('noise', 300, 90);
      ctx.fillText('receiver', 550, 90);

      // Spawn bits periodically
      if (Math.random() < 0.04) {
        spawnBit();
      }

      // Update and draw bits
      for (let i = bits.length - 1; i >= 0; i--) {
        const bit = bits[i]!;
        bit.x += bit.speed;

        // Apply noise in the noise zone
        if (bit.x > noiseZoneStart && bit.x < noiseZoneEnd && !bit.corrupted) {
          if (Math.random() < 0.003) {
            bit.corrupted = true;
            bit.y += (Math.random() - 0.5) * 30;
          }
        }

        // Remove off-screen bits
        if (bit.x > w + 10) {
          bits.splice(i, 1);
          continue;
        }

        // Draw bit
        const radius = 5;
        if (bit.corrupted) {
          ctx.fillStyle = 'rgba(255, 80, 80, 0.8)';
        } else {
          ctx.fillStyle = bit.value === 1 ? 'rgba(79, 195, 247, 0.8)' : 'rgba(255, 200, 100, 0.8)';
        }
        ctx.beginPath();
        ctx.arc(bit.x, bit.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Bit label
        ctx.fillStyle = '#000';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(bit.corrupted ? '?' : String(bit.value), bit.x, bit.y + 3);
      }

      // Bird on a wire — birdsong reference
      const birdX = 50 + Math.sin(time * 0.3) * 5;
      const birdY = 60 + Math.sin(time * 2) * 2;
      ctx.fillStyle = 'rgba(255, 200, 100, 0.5)';
      ctx.beginPath();
      ctx.ellipse(birdX, birdY, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Beak
      ctx.beginPath();
      ctx.moveTo(birdX + 6, birdY - 1);
      ctx.lineTo(birdX + 10, birdY);
      ctx.lineTo(birdX + 6, birdY + 1);
      ctx.fill();

      // Sound waves from bird (signal)
      for (let ring = 0; ring < 3; ring++) {
        const ringPhase = (time * 3 + ring * 1.5) % 6;
        if (ringPhase < 3) {
          ctx.strokeStyle = `rgba(255, 200, 100, ${0.3 - ringPhase * 0.1})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(birdX + 10, birdY, ringPhase * 8, -0.5, 0.5);
          ctx.stroke();
        }
      }

      // Fox silhouette — compass fox as receiver
      const foxX = 545;
      const foxY = 230;
      ctx.fillStyle = 'rgba(200, 120, 60, 0.4)';
      // Simple fox shape: body
      ctx.beginPath();
      ctx.ellipse(foxX, foxY, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.beginPath();
      ctx.ellipse(foxX + 14, foxY - 4, 6, 5, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Ears
      ctx.beginPath();
      ctx.moveTo(foxX + 16, foxY - 9);
      ctx.lineTo(foxX + 18, foxY - 16);
      ctx.lineTo(foxX + 20, foxY - 9);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(foxX + 12, foxY - 8);
      ctx.lineTo(foxX + 13, foxY - 15);
      ctx.lineTo(foxX + 15, foxY - 8);
      ctx.fill();

      ctx.font = '9px Georgia, serif';
      ctx.fillStyle = 'rgba(200, 120, 60, 0.4)';
      ctx.textAlign = 'center';
      ctx.fillText('receiving', foxX + 10, foxY + 18);

      // Caption
      ctx.font = '11px Georgia, serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.textAlign = 'center';
      ctx.fillText('The message enters the channel. The noise tries to garble it. The receiver tries to understand.', w / 2, h - 12);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const handleCanvasClick = useCallback(() => {
    setHasInteracted(true);
  }, []);

  const handleContinue = useCallback(() => {
    onComplete('wonder');
  }, [onComplete]);

  const paragraphs = story.body.split('\n\n');

  return (
    <div className="phase phase--wonder">
      <div className="wonder__simulation">
        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          className="wonder__canvas"
          onClick={handleCanvasClick}
          aria-label="Bits flowing through a noisy channel — some arrive intact, some are corrupted. A bird sings, a fox listens."
        />
        <p className="wonder__simulation-caption">
          The bird sings. The noise garbles. The fox listens. The message arrives — or does it?
        </p>
      </div>

      <div
        className="wonder__story"
        ref={contentRef}
        onScroll={handleScroll}
      >
        <h2 className="wonder__title">{story.title}</h2>
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="wonder__paragraph">
            {paragraph}
          </p>
        ))}
      </div>

      {completed && (
        <div className="wonder__continue">
          <button className="phase__continue-btn" onClick={handleContinue}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
