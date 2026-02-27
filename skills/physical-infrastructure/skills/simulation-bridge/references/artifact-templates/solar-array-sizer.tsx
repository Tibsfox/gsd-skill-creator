// Solar Array Sizer — Claude Artifact Template
// Self-contained: no external imports required
// Calculates annual PV production from panel count, orientation, and latitude-adjusted irradiance
//
// Deploy: copy this entire file into a Claude artifact panel
// Recharts components (BarChart, Bar, etc.) are available in the artifact environment

function SolarArraySizer() {
  const [panelCount, setPanelCount] = React.useState(20);
  const [panelArea_m2, setPanelArea] = React.useState(1.7); // standard 60-cell module
  const [efficiency, setEfficiency] = React.useState(0.20); // 20% modern mono-Si
  const [tilt_deg, setTilt] = React.useState(30);
  const [latitude, setLatitude] = React.useState(37); // mid-latitude US
  const [systemLosses, setSystemLosses] = React.useState(0.14); // 14% total BOS losses

  // Monthly average irradiance (kWh/m^2/day) for mid-latitude US (~37N)
  // Adjusted by a simple latitude factor for other latitudes
  const baseIrradiance = [2.9, 3.5, 4.5, 5.2, 5.8, 6.2, 6.1, 5.7, 5.0, 4.1, 3.1, 2.7];
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Tilt correction factor (simplified)
  // Optimal tilt ~ latitude; deviations reduce annual yield
  function tiltFactor(tilt: number, lat: number): number {
    const optimalTilt = lat;
    const deviation = Math.abs(tilt - optimalTilt);
    // Approximate: 1% loss per degree of deviation from optimal, max 30% loss
    return Math.max(0.7, 1 - deviation * 0.01);
  }

  // Latitude adjustment (simplified)
  // Higher latitudes get less irradiance; lower latitudes get more
  function latitudeFactor(lat: number): number {
    // Base data is for 37N; scale roughly +-2% per degree
    return 1 + (37 - lat) * 0.015;
  }

  // Calculate monthly production
  function calculateProduction() {
    const totalArea = panelCount * panelArea_m2;
    const tFactor = tiltFactor(tilt_deg, latitude);
    const lFactor = latitudeFactor(latitude);
    const systemEff = 1 - systemLosses;

    return baseIrradiance.map((irr, i) => {
      const adjustedIrr = irr * lFactor * tFactor;
      const dailyKWh = adjustedIrr * totalArea * efficiency * systemEff;
      const monthlyKWh = dailyKWh * daysPerMonth[i];
      return {
        month: monthNames[i],
        kWh: Math.round(monthlyKWh),
        irradiance: adjustedIrr,
      };
    });
  }

  const production = calculateProduction();
  const annualKWh = production.reduce((sum, m) => sum + m.kWh, 0);
  const systemKWp = panelCount * panelArea_m2 * efficiency;
  const capacityFactor =
    systemKWp > 0 ? annualKWh / (systemKWp * 8760) : 0;

  // Find max for bar scaling
  const maxMonthKWh = Math.max(...production.map((m) => m.kWh), 1);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '16px', maxWidth: '640px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
        Solar Array Sizer
      </h2>
      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
        PV Production Estimator | Latitude-adjusted irradiance | Tilt correction
      </p>

      {/* Controls */}
      <div style={{ display: 'grid', gap: '6px', marginBottom: '16px', fontSize: '13px' }}>
        <label>
          Panel Count: <strong>{panelCount}</strong>
          <input
            type="range"
            min="1"
            max="200"
            value={panelCount}
            onChange={(e) => setPanelCount(+e.target.value)}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          Latitude: <strong>{latitude}N</strong>
          <input
            type="range"
            min="20"
            max="55"
            value={latitude}
            onChange={(e) => setLatitude(+e.target.value)}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          Tilt Angle: <strong>{tilt_deg} deg</strong>
          <input
            type="range"
            min="0"
            max="60"
            value={tilt_deg}
            onChange={(e) => setTilt(+e.target.value)}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          Panel Efficiency: <strong>{(efficiency * 100).toFixed(0)}%</strong>
          <input
            type="range"
            min="15"
            max="23"
            value={efficiency * 100}
            onChange={(e) => setEfficiency(+e.target.value / 100)}
            style={{ width: '100%' }}
          />
        </label>
      </div>

      {/* Summary metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            padding: '8px',
            background: '#f3f4f6',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '11px', color: '#6b7280' }}>Annual Production</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
            {(annualKWh / 1000).toFixed(1)} MWh
          </div>
        </div>
        <div
          style={{
            padding: '8px',
            background: '#f3f4f6',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '11px', color: '#6b7280' }}>System Size</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
            {systemKWp.toFixed(1)} kWp
          </div>
        </div>
        <div
          style={{
            padding: '8px',
            background: '#f3f4f6',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '11px', color: '#6b7280' }}>Capacity Factor</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
            {(capacityFactor * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Monthly production chart (SVG bar chart) */}
      <svg width="100%" height="160" viewBox="0 0 480 160">
        {production.map((m, i) => {
          const barHeight = (m.kWh / maxMonthKWh) * 120;
          const x = i * 38 + 12;
          return (
            <g key={m.month}>
              <rect
                x={x}
                y={130 - barHeight}
                width="28"
                height={barHeight}
                fill="#f59e0b"
                rx="2"
              />
              <text x={x + 14} y={145} textAnchor="middle" fontSize="9" fill="#6b7280">
                {m.month}
              </text>
              <text x={x + 14} y={125 - barHeight} textAnchor="middle" fontSize="8" fill="#374151">
                {m.kWh}
              </text>
            </g>
          );
        })}
        <text x="0" y="155" fontSize="9" fill="#9ca3af">
          Monthly Production (kWh)
        </text>
      </svg>

      {/* Details table */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '11px',
          marginTop: '8px',
        }}
      >
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ padding: '3px 6px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              Parameter
            </th>
            <th
              style={{ padding: '3px 6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}
            >
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '3px 6px' }}>Total Panel Area</td>
            <td style={{ padding: '3px 6px', textAlign: 'right' }}>
              {(panelCount * panelArea_m2).toFixed(1)} m2
            </td>
          </tr>
          <tr>
            <td style={{ padding: '3px 6px' }}>System Losses (BOS)</td>
            <td style={{ padding: '3px 6px', textAlign: 'right' }}>
              {(systemLosses * 100).toFixed(0)}%
            </td>
          </tr>
          <tr>
            <td style={{ padding: '3px 6px' }}>Tilt Factor</td>
            <td style={{ padding: '3px 6px', textAlign: 'right' }}>
              {tiltFactor(tilt_deg, latitude).toFixed(3)}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '3px 6px' }}>Latitude Factor</td>
            <td style={{ padding: '3px 6px', textAlign: 'right' }}>
              {latitudeFactor(latitude).toFixed(3)}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '3px 6px' }}>Best Month</td>
            <td style={{ padding: '3px 6px', textAlign: 'right' }}>
              {production.reduce((best, m) => (m.kWh > best.kWh ? m : best)).month} (
              {production.reduce((best, m) => (m.kWh > best.kWh ? m : best)).kWh} kWh)
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '16px' }}>
        {'Engineering Disclaimer: Simplified irradiance model. Verify with a licensed Professional Engineer, PVGIS or PVWatts for accurate site-specific production estimates.'}
      </p>
    </div>
  );
}

export default SolarArraySizer;
