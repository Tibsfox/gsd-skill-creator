// Wing 3 — Touch Phase: "Frequency, Amplitude, Phase"
// Animate unit circle → sine wave. Layer frequencies. HEAR the waves (Tone.js).
// Labels: plain-language FIRST, then notation.
// Completion: >= 3 parameter changes OR >= 2min.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';

interface TouchPhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

export function TouchPhase({
  onComplete,
}: TouchPhaseProps): React.JSX.Element {
  const [timeSpent, setTimeSpent] = useState(0);
  const [interactionCount, setInteractionCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [frequency, setFrequency] = useState(2);
  const [amplitude, setAmplitude] = useState(0.7);
  const [phaseShift, setPhaseShift] = useState(0);
  const [secondFreq, setSecondFreq] = useState(0);
  const [audioStarted, setAudioStarted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const oscRef = useRef<Tone.Oscillator | null>(null);
  const gainRef = useRef<Tone.Gain | null>(null);

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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      oscRef.current?.stop();
      oscRef.current?.dispose();
      gainRef.current?.dispose();
    };
  }, []);

  // Update audio when frequency/amplitude change
  useEffect(() => {
    if (!audioStarted || !oscRef.current || !gainRef.current) return;
    // Map visual frequency (1-8) to audible frequency (110-880 Hz)
    oscRef.current.frequency.value = frequency * 110;
    gainRef.current.gain.value = amplitude * 0.15;
  }, [frequency, amplitude, audioStarted]);

  const handleStartAudio = useCallback(async () => {
    await Tone.start();
    const gain = new Tone.Gain(amplitude * 0.15).toDestination();
    const osc = new Tone.Oscillator(frequency * 110, 'sine').connect(gain);
    osc.start();
    oscRef.current = osc;
    gainRef.current = gain;
    setAudioStarted(true);
    setInteractionCount((prev) => prev + 1);
  }, [frequency, amplitude]);

  const handleStopAudio = useCallback(() => {
    oscRef.current?.stop();
    oscRef.current?.dispose();
    gainRef.current?.dispose();
    oscRef.current = null;
    gainRef.current = null;
    setAudioStarted(false);
  }, []);

  // Canvas rendering
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

      const centerY = h * 0.5;
      const waveAmp = h * 0.3 * amplitude;

      // Center line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();

      // Primary wave
      ctx.strokeStyle = '#f06292';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const t = (x / w) * Math.PI * 2 * 4;
        const y = centerY - Math.sin(t * frequency + phaseShift + time * frequency) * waveAmp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Second wave (if enabled)
      if (secondFreq > 0) {
        ctx.strokeStyle = 'rgba(79, 195, 247, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const t = (x / w) * Math.PI * 2 * 4;
          const y = centerY - Math.sin(t * secondFreq + time * secondFreq) * waveAmp * 0.6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Combined wave
        ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const t = (x / w) * Math.PI * 2 * 4;
          const y1 = Math.sin(t * frequency + phaseShift + time * frequency) * waveAmp;
          const y2 = Math.sin(t * secondFreq + time * secondFreq) * waveAmp * 0.6;
          const y = centerY - (y1 + y2);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [frequency, amplitude, phaseShift, secondFreq]);

  const handleFreqChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFrequency(Number(e.target.value));
    setInteractionCount((prev) => prev + 1);
  }, []);

  const handleAmpChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAmplitude(Number(e.target.value));
    setInteractionCount((prev) => prev + 1);
  }, []);

  const handlePhaseChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPhaseShift(Number(e.target.value));
    setInteractionCount((prev) => prev + 1);
  }, []);

  const handleSecondFreqChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSecondFreq(Number(e.target.value));
    setInteractionCount((prev) => prev + 1);
  }, []);

  const handleContinue = useCallback(() => {
    handleStopAudio();
    onComplete('touch');
  }, [onComplete, handleStopAudio]);

  return (
    <div className="phase phase--touch">
      <div className="touch__intro">
        <h2>Frequency, Amplitude, Phase</h2>
        <p>
          Change the speed of the wave. Change its height. Shift it forward or
          backward. Layer a second wave on top and watch them combine. And if
          you want — listen. Sine waves are the building blocks of sound.
        </p>
      </div>

      <div className="touch__workspace">
        <canvas
          ref={canvasRef}
          width={700}
          height={300}
          className="touch__canvas"
          aria-label="Interactive sine waves — adjust frequency, amplitude, and phase"
        />

        <div className="touch__readout" aria-live="polite">
          <div className="touch__readout-item">
            <span className="touch__label">
              Speed of oscillation: {frequency.toFixed(1)}
            </span>
            <span className="touch__notation">(frequency f)</span>
          </div>
          <div className="touch__readout-item">
            <span className="touch__label">
              Wave height: {amplitude.toFixed(2)}
            </span>
            <span className="touch__notation">(amplitude A)</span>
          </div>
          <div className="touch__readout-item">
            <span className="touch__label">
              Wave shift: {phaseShift.toFixed(2)} rad
            </span>
            <span className="touch__notation">(phase \u03C6)</span>
          </div>
          {secondFreq > 0 && (
            <div className="touch__readout-item">
              <span className="touch__label">
                Second wave speed: {secondFreq.toFixed(1)}
              </span>
              <span className="touch__notation">(f\u2082)</span>
            </div>
          )}
        </div>

        <div className="touch__controls">
          <label className="touch__slider">
            <span>Speed (frequency)</span>
            <input
              type="range"
              min={0.5}
              max={8}
              step={0.1}
              value={frequency}
              onChange={handleFreqChange}
            />
          </label>
          <label className="touch__slider">
            <span>Height (amplitude)</span>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={amplitude}
              onChange={handleAmpChange}
            />
          </label>
          <label className="touch__slider">
            <span>Shift (phase)</span>
            <input
              type="range"
              min={0}
              max={6.283}
              step={0.05}
              value={phaseShift}
              onChange={handlePhaseChange}
            />
          </label>
          <label className="touch__slider">
            <span>Layer a second wave</span>
            <input
              type="range"
              min={0}
              max={8}
              step={0.1}
              value={secondFreq}
              onChange={handleSecondFreqChange}
            />
          </label>
          <div className="touch__audio-controls">
            {!audioStarted ? (
              <button className="touch__toggle-btn" onClick={handleStartAudio}>
                Hear the wave
              </button>
            ) : (
              <button className="touch__toggle-btn" onClick={handleStopAudio}>
                Stop sound
              </button>
            )}
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
