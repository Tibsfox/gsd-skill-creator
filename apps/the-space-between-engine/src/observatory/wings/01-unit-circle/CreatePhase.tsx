/**
 * Wing 1: Unit Circle — Create Phase
 *
 * "Design Your Day" — set latitude and date, see how the unit circle
 * determines sunrise/sunset. Save as creation.
 */

import React, { useEffect, useRef, useState } from 'react';

export interface CreatePhaseProps {
  onComplete: () => void;
  onSaveCreation?: (creation: { title: string; data: string }) => void;
}

export const CreatePhase: React.FC<CreatePhaseProps> = ({ onComplete, onSaveCreation }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [latitude, setLatitude] = useState(45);
  const [dayOfYear, setDayOfYear] = useState(172); // Summer solstice
  const [saved, setSaved] = useState(false);

  // Approximate sunrise/sunset calculation using solar declination
  const solarDeclination = 23.45 * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));
  const latRad = (latitude * Math.PI) / 180;
  const declRad = (solarDeclination * Math.PI) / 180;

  // Hour angle at sunrise/sunset
  const cosHourAngle = -Math.tan(latRad) * Math.tan(declRad);
  const clampedCos = Math.max(-1, Math.min(1, cosHourAngle));
  const hourAngle = Math.acos(clampedCos);
  const daylightHours = (2 * hourAngle * 12) / Math.PI;
  const sunriseHour = 12 - daylightHours / 2;
  const sunsetHour = 12 + daylightHours / 2;

  const isPolarDay = cosHourAngle < -1;
  const isPolarNight = cosHourAngle > 1;

  const formatTime = (hour: number): string => {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Canvas visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.35;

    ctx.clearRect(0, 0, w, h);

    // Sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#0a0a2a');
    skyGrad.addColorStop(0.5, '#1a2a4a');
    skyGrad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw the daily circle (24 hours mapped to 2*pi)
    ctx.strokeStyle = '#2a4a7a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Hour marks
    for (let hr = 0; hr < 24; hr++) {
      const angle = ((hr / 24) * Math.PI * 2) - Math.PI / 2;
      const innerR = radius - 8;
      const outerR = radius + 8;
      ctx.strokeStyle = hr % 6 === 0 ? '#4a6a9a' : '#2a3a5a';
      ctx.lineWidth = hr % 6 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
      ctx.stroke();

      if (hr % 6 === 0) {
        ctx.fillStyle = '#6a8aba';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelR = radius + 22;
        ctx.fillText(
          `${hr}:00`,
          cx + Math.cos(angle) * labelR,
          cy + Math.sin(angle) * labelR,
        );
      }
    }

    if (!isPolarDay && !isPolarNight) {
      // Daylight arc
      const sunriseAngle = ((sunriseHour / 24) * Math.PI * 2) - Math.PI / 2;
      const sunsetAngle = ((sunsetHour / 24) * Math.PI * 2) - Math.PI / 2;

      ctx.strokeStyle = '#ffdd57';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, sunriseAngle, sunsetAngle);
      ctx.stroke();

      // Night arc
      ctx.strokeStyle = '#1a1a3a';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, sunsetAngle, sunriseAngle);
      ctx.stroke();

      // Sunrise marker
      const srx = cx + Math.cos(sunriseAngle) * radius;
      const sry = cy + Math.sin(sunriseAngle) * radius;
      ctx.fillStyle = '#ff9a6a';
      ctx.beginPath();
      ctx.arc(srx, sry, 6, 0, Math.PI * 2);
      ctx.fill();

      // Sunset marker
      const ssx = cx + Math.cos(sunsetAngle) * radius;
      const ssy = cy + Math.sin(sunsetAngle) * radius;
      ctx.fillStyle = '#ff6a6a';
      ctx.beginPath();
      ctx.arc(ssx, ssy, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (isPolarDay) {
      ctx.strokeStyle = '#ffdd57';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#1a1a3a';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Center info
    ctx.fillStyle = '#ccc';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Latitude: ${latitude}deg`, cx, cy - 20);
    ctx.fillText(`Day: ${dayOfYear}/365`, cx, cy);
    if (isPolarDay) {
      ctx.fillStyle = '#ffdd57';
      ctx.fillText('Midnight sun', cx, cy + 20);
    } else if (isPolarNight) {
      ctx.fillStyle = '#6a6aaa';
      ctx.fillText('Polar night', cx, cy + 20);
    } else {
      ctx.fillText(`${daylightHours.toFixed(1)} hours of light`, cx, cy + 20);
    }
  }, [latitude, dayOfYear, sunriseHour, sunsetHour, daylightHours, isPolarDay, isPolarNight]);

  const handleSave = () => {
    const data = JSON.stringify({
      latitude,
      dayOfYear,
      sunriseHour: isPolarDay ? 0 : isPolarNight ? null : sunriseHour,
      sunsetHour: isPolarDay ? 24 : isPolarNight ? null : sunsetHour,
      daylightHours: isPolarDay ? 24 : isPolarNight ? 0 : daylightHours,
      solarDeclination,
    });

    onSaveCreation?.({
      title: `Day Design: Lat ${latitude}, Day ${dayOfYear}`,
      data,
    });
    setSaved(true);
  };

  return (
    <div className="phase create-phase">
      <h2>Design Your Day</h2>

      <p className="narrative-intro">
        The unit circle does not just describe abstract angles — it governs your actual day.
        The tilt of the Earth, your latitude, and the day of the year combine through the
        unit circle to determine exactly when the sun rises and sets. Set a latitude and a
        date, and watch the circle draw your day.
      </p>

      <canvas
        ref={canvasRef}
        className="wing-canvas"
        style={{ width: '100%', height: '350px', borderRadius: '8px' }}
      />

      <div className="creation-controls" style={{ margin: '16px 0' }}>
        <div style={{ margin: '8px 0' }}>
          <label>
            Latitude: {latitude} degrees
            <input
              type="range"
              min={-90}
              max={90}
              step={1}
              value={latitude}
              onChange={(e) => setLatitude(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </label>
        </div>
        <div style={{ margin: '8px 0' }}>
          <label>
            Day of Year: {dayOfYear}
            <input
              type="range"
              min={1}
              max={365}
              step={1}
              value={dayOfYear}
              onChange={(e) => setDayOfYear(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </label>
        </div>
      </div>

      <div className="results" style={{ fontFamily: 'monospace', margin: '12px 0' }}>
        {isPolarDay && <div style={{ color: '#ffdd57' }}>The sun never sets at this latitude on this day.</div>}
        {isPolarNight && <div style={{ color: '#6a6aaa' }}>The sun never rises at this latitude on this day.</div>}
        {!isPolarDay && !isPolarNight && (
          <>
            <div>Sunrise: {formatTime(sunriseHour)}</div>
            <div>Sunset: {formatTime(sunsetHour)}</div>
            <div>Daylight: {daylightHours.toFixed(1)} hours</div>
            <div>Solar declination: {solarDeclination.toFixed(2)} degrees</div>
          </>
        )}
      </div>

      <button
        className="save-creation"
        onClick={handleSave}
        disabled={saved}
        style={{ margin: '8px 0' }}
      >
        {saved ? 'Saved!' : 'Save this day design'}
      </button>

      <button
        className="phase-advance"
        disabled={!saved}
        onClick={onComplete}
        style={{ margin: '8px 0' }}
      >
        {saved ? 'Complete Wing 1' : 'Save your creation first...'}
      </button>
    </div>
  );
};

export const createMeta = {
  containsMath: true,
  interactiveElements: 2,
  interactiveElementIds: ['uc-create-latitude', 'uc-create-day'],
  creationType: 'visualization',
};
