// Wing 1 — Create Phase: "Design Your Own Day"
// Set latitude + date, see unit circle determine sunrise/sunset.
// Produces a saveable Creation object. Completion: produce creation OR skip.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState, Creation } from '@/types/index';

interface CreatePhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onCreationSave: (creation: Creation) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

export function CreatePhase({
  onComplete,
  onCreationSave,
}: CreatePhaseProps): React.JSX.Element {
  const [latitude, setLatitude] = useState(45);
  const [dayOfYear, setDayOfYear] = useState(172); // summer solstice
  const [title, setTitle] = useState('');
  const [saved, setSaved] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Compute daylight based on latitude and day of year using unit circle math
  // Earth's axial tilt: 23.44 degrees
  const tiltRad = 23.44 * (Math.PI / 180);
  const declination = tiltRad * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));
  const latRad = latitude * (Math.PI / 180);

  // Hour angle at sunrise/sunset: cos(H) = -tan(lat) * tan(dec)
  const cosH = -Math.tan(latRad) * Math.tan(declination);
  const clampedCosH = Math.max(-1, Math.min(1, cosH));
  const hourAngle = Math.acos(clampedCosH);
  const daylightHours = (2 * hourAngle * 12) / Math.PI;
  const sunriseHour = 12 - daylightHours / 2;
  const sunsetHour = 12 + daylightHours / 2;

  const isPolarDay = cosH < -1;
  const isPolarNight = cosH > 1;

  // Visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const draw = () => {
      time += 0.01;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.35;

      // 24-hour clock circle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Hour markers
      for (let hr = 0; hr < 24; hr++) {
        const hrAngle = ((hr / 24) * Math.PI * 2) - Math.PI / 2;
        const innerR = radius * 0.92;
        const outerR = hr % 6 === 0 ? radius * 1.08 : radius * 1.02;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = hr % 6 === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(hrAngle) * innerR, cy + Math.sin(hrAngle) * innerR);
        ctx.lineTo(cx + Math.cos(hrAngle) * outerR, cy + Math.sin(hrAngle) * outerR);
        ctx.stroke();

        if (hr % 6 === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            `${hr}:00`,
            cx + Math.cos(hrAngle) * (radius * 1.16),
            cy + Math.sin(hrAngle) * (radius * 1.16)
          );
        }
      }

      // Daylight arc
      if (!isPolarNight) {
        const startAngle = ((sunriseHour / 24) * Math.PI * 2) - Math.PI / 2;
        const endAngle = ((sunsetHour / 24) * Math.PI * 2) - Math.PI / 2;

        ctx.fillStyle = 'rgba(255, 230, 100, 0.15)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        if (isPolarDay) {
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        } else {
          ctx.arc(cx, cy, radius, startAngle, endAngle);
        }
        ctx.closePath();
        ctx.fill();

        // Sunrise/sunset markers
        if (!isPolarDay) {
          const srX = cx + Math.cos(startAngle) * radius;
          const srY = cy + Math.sin(startAngle) * radius;
          const ssX = cx + Math.cos(endAngle) * radius;
          const ssY = cy + Math.sin(endAngle) * radius;

          ctx.fillStyle = '#ffcc80';
          ctx.beginPath();
          ctx.arc(srX, srY, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ssX, ssY, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Animated current-time indicator
      const currentHour = (time * 2) % 24;
      const currentAngle = ((currentHour / 24) * Math.PI * 2) - Math.PI / 2;
      const handLen = radius * 0.8;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx + Math.cos(currentAngle) * handLen,
        cy + Math.sin(currentAngle) * handLen
      );
      ctx.stroke();

      // Center dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      // Declination display (small unit circle in corner)
      const miniR = 30;
      const miniCx = w - 50;
      const miniCy = 50;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(miniCx, miniCy, miniR, 0, Math.PI * 2);
      ctx.stroke();

      // Show declination as angle
      const decAngle = declination;
      ctx.strokeStyle = '#ffcc80';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(miniCx, miniCy);
      ctx.lineTo(
        miniCx + Math.cos(decAngle) * miniR,
        miniCy - Math.sin(decAngle) * miniR
      );
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 200, 100, 0.6)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('tilt', miniCx, miniCy + miniR + 14);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [latitude, dayOfYear, sunriseHour, sunsetHour, isPolarDay, isPolarNight, declination]);

  const formatTime = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleSave = useCallback(() => {
    const creation: Creation = {
      id: `uc-create-${Date.now()}`,
      foundationId: 'unit-circle',
      type: 'visualization',
      title: title || `Day at ${latitude}\u00B0, day ${dayOfYear}`,
      data: JSON.stringify({
        latitude,
        dayOfYear,
        daylightHours: isPolarDay ? 24 : isPolarNight ? 0 : daylightHours,
        sunrise: isPolarDay ? 'polar day' : isPolarNight ? 'polar night' : formatTime(sunriseHour),
        sunset: isPolarDay ? 'polar day' : isPolarNight ? 'polar night' : formatTime(sunsetHour),
        declination: (declination * 180 / Math.PI).toFixed(2),
      }),
      createdAt: new Date().toISOString(),
      shared: false,
    };
    onCreationSave(creation);
    setSaved(true);
  }, [title, latitude, dayOfYear, daylightHours, sunriseHour, sunsetHour, isPolarDay, isPolarNight, declination, onCreationSave]);

  const handleSkip = useCallback(() => {
    onComplete('create');
  }, [onComplete]);

  const handleContinue = useCallback(() => {
    onComplete('create');
  }, [onComplete]);

  return (
    <div className="phase phase--create">
      <div className="create__intro">
        <h2>Design Your Own Day</h2>
        <p>
          Set a latitude and a date. The unit circle determines when the sun
          rises and sets — because daylight is a function of the angle between
          the Earth's tilt and your position on the planet. One circle,
          governing every sunrise you have ever seen.
        </p>
      </div>

      <div className="create__workspace">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="create__canvas"
          aria-label="24-hour daylight circle showing sunrise and sunset determined by unit circle geometry"
        />

        <div className="create__controls">
          <label className="create__control">
            <span className="create__control-label">
              Latitude: {latitude}\u00B0
            </span>
            <input
              type="range"
              min={-90}
              max={90}
              step={1}
              value={latitude}
              onChange={(e) => setLatitude(Number(e.target.value))}
            />
            <span className="create__control-hint">
              {latitude > 0 ? 'Northern hemisphere' : latitude < 0 ? 'Southern hemisphere' : 'Equator'}
            </span>
          </label>

          <label className="create__control">
            <span className="create__control-label">
              Day of year: {dayOfYear}
            </span>
            <input
              type="range"
              min={1}
              max={365}
              step={1}
              value={dayOfYear}
              onChange={(e) => setDayOfYear(Number(e.target.value))}
            />
          </label>

          <div className="create__results" aria-live="polite">
            {isPolarDay && (
              <p className="create__result">
                Polar day — the sun does not set. 24 hours of light.
              </p>
            )}
            {isPolarNight && (
              <p className="create__result">
                Polar night — the sun does not rise. Continuous darkness.
              </p>
            )}
            {!isPolarDay && !isPolarNight && (
              <>
                <p className="create__result">
                  Sunrise: {formatTime(sunriseHour)}
                </p>
                <p className="create__result">
                  Sunset: {formatTime(sunsetHour)}
                </p>
                <p className="create__result">
                  Daylight: {daylightHours.toFixed(1)} hours
                </p>
              </>
            )}
          </div>

          <label className="create__control">
            <span className="create__control-label">Name your day</span>
            <input
              type="text"
              className="create__title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midsummer in Oslo"
            />
          </label>

          <div className="create__actions">
            <button
              className="create__save-btn"
              onClick={handleSave}
              disabled={saved}
            >
              {saved ? 'Saved' : 'Save this day'}
            </button>
          </div>
        </div>
      </div>

      <div className="create__continue">
        {saved ? (
          <button className="phase__continue-btn" onClick={handleContinue}>
            Complete Wing
          </button>
        ) : (
          <button className="phase__skip-btn" onClick={handleSkip}>
            Skip creation
          </button>
        )}
      </div>
    </div>
  );
}
