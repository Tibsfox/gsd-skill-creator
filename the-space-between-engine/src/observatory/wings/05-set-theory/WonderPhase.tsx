// Wing 5 — Wonder Phase: "The Boundary of You"
// ZERO math notation. Story-driven only.
// HIGHEST EMOTIONAL LOAD — existential center. "What makes you YOU?"
// The compass fox resurfaces: the fox is a pattern that persists — a boundary condition.
// River identity is the scientific anchor; human-as-pattern is the philosophical invitation.
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
  const story = getStory('set-theory');
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Completion: 60s OR scrolled to end OR interacted
  useEffect(() => {
    if (completed) return;
    if (timeSpent >= 60 || hasScrolledToEnd || hasInteracted) {
      setCompleted(true);
    }
  }, [timeSpent, hasScrolledToEnd, hasInteracted, completed]);

  // Scroll detection
  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    if (nearBottom) {
      setHasScrolledToEnd(true);
    }
  }, []);

  // River boundary animation — atoms flowing through a persistent shape
  // The river IS you: the water changes, the banks persist, the identity is the boundary
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      age: number;
      maxAge: number;
      inside: boolean;
    }

    const particles: Particle[] = [];
    let time = 0;

    // The boundary shape — a body outline that breathes
    const getBodyBoundary = (t: number, px: number, py: number): boolean => {
      const cx = 300;
      const cy = 150;
      const breathScale = 1 + Math.sin(t * 0.5) * 0.03;
      const dx = (px - cx) / (80 * breathScale);
      const dy = (py - cy) / (120 * breathScale);
      return dx * dx + dy * dy < 1;
    };

    const spawnParticle = (): Particle => {
      const side = Math.random();
      let x: number, y: number;
      if (side < 0.5) {
        x = -10;
        y = 50 + Math.random() * 200;
      } else {
        x = 610;
        y = 50 + Math.random() * 200;
      }
      return {
        x,
        y,
        vx: (side < 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.5),
        vy: (Math.random() - 0.5) * 0.3,
        age: 0,
        maxAge: 400 + Math.random() * 200,
        inside: false,
      };
    };

    // Seed initial particles
    for (let i = 0; i < 60; i++) {
      const p = spawnParticle();
      p.x = Math.random() * 600;
      p.y = 50 + Math.random() * 200;
      p.age = Math.random() * p.maxAge;
      particles.push(p);
    }

    const draw = () => {
      time += 0.016;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Deep background
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, w, h);

      // Draw the boundary — a soft glow showing the persistent shape
      const breathScale = 1 + Math.sin(time * 0.5) * 0.03;
      const cx = 300;
      const cy = 150;

      // Outer glow
      const glow = ctx.createRadialGradient(
        cx, cy, 60 * breathScale,
        cx, cy, 130 * breathScale
      );
      glow.addColorStop(0, 'rgba(30, 92, 46, 0.15)');
      glow.addColorStop(0.7, 'rgba(30, 92, 46, 0.05)');
      glow.addColorStop(1, 'rgba(30, 92, 46, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 130 * breathScale, 160 * breathScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // The boundary line itself — dashed, breathing
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.lineDashOffset = -time * 10;
      ctx.strokeStyle = 'rgba(30, 92, 46, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 80 * breathScale, 120 * breathScale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Spawn new particles
      if (particles.length < 100 && Math.random() < 0.1) {
        particles.push(spawnParticle());
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!;
        p.age++;

        // Gentle drift with slight attraction toward center when inside
        p.inside = getBodyBoundary(time, p.x, p.y);
        if (p.inside) {
          // Slow down inside — become part of the pattern
          p.vx *= 0.995;
          p.vy *= 0.995;
          p.vy += (Math.random() - 0.5) * 0.05;
          p.vx += (Math.random() - 0.5) * 0.05;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Remove dead particles
        if (p.age > p.maxAge || p.x < -20 || p.x > 620 || p.y < -20 || p.y > 320) {
          particles.splice(i, 1);
          continue;
        }

        // Draw
        const lifeRatio = p.age / p.maxAge;
        const alpha = lifeRatio < 0.1 ? lifeRatio * 10 : (lifeRatio > 0.8 ? (1 - lifeRatio) * 5 : 1);
        const radius = p.inside ? 3 : 2;

        if (p.inside) {
          // Inside the boundary: warm, alive
          ctx.fillStyle = `rgba(100, 200, 120, ${alpha * 0.7})`;
        } else {
          // Outside: cool, passing through
          ctx.fillStyle = `rgba(100, 140, 180, ${alpha * 0.4})`;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Label — no math, just a quiet observation
      ctx.font = '11px Georgia, serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.textAlign = 'center';
      ctx.fillText('The atoms change. The pattern persists.', cx, h - 12);

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
          aria-label="Particles flowing through a persistent boundary shape — atoms change but the pattern endures"
        />
        <p className="wonder__simulation-caption">
          The boundary breathes. The particles pass through. The shape remains.
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
          <button
            className="phase__continue-btn"
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
