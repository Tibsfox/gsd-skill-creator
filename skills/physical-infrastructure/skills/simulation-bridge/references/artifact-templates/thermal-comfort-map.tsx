// Thermal Comfort Map — Claude Artifact Template
// Self-contained: no external imports required
// Renders a 2D color-coded temperature map of a data center floor plan
//
// Deploy: copy this entire file into a Claude artifact panel
// Uses SVG for grid visualization with ASHRAE-based color scale

interface HeatSource {
  id: number;
  x: number;
  y: number;
  kW: number;
  type: 'rack' | 'crac';
}

function ThermalComfortMap() {
  const [gridWidth, setGridWidth] = React.useState(10);
  const [gridHeight, setGridHeight] = React.useState(8);
  const [ambientTemp_C, setAmbientTemp] = React.useState(22);
  const [sources, setSources] = React.useState<HeatSource[]>([
    { id: 1, x: 2, y: 2, kW: 10, type: 'rack' },
    { id: 2, x: 2, y: 5, kW: 10, type: 'rack' },
    { id: 3, x: 5, y: 2, kW: 15, type: 'rack' },
    { id: 4, x: 5, y: 5, kW: 15, type: 'rack' },
    { id: 5, x: 8, y: 3, kW: -20, type: 'crac' },
    { id: 6, x: 8, y: 6, kW: -20, type: 'crac' },
  ]);
  const [nextId, setNextId] = React.useState(7);
  const [selectedCell, setSelectedCell] = React.useState<{ x: number; y: number } | null>(null);

  // Compute temperature at a grid point using simplified point-source model
  // T(x,y) = T_ambient + Sum_sources[ Q_source / (4*pi*k * max(dist, minDist)) ]
  // k = effective thermal conductivity of air (scale factor for visualization)
  function computeTemp(px: number, py: number): number {
    const k_eff = 0.5; // effective scale factor for visualization
    const minDist = 0.5; // prevent singularity
    let tempDelta = 0;
    for (const s of sources) {
      const dx = px - s.x;
      const dy = py - s.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), minDist);
      tempDelta += s.kW / (4 * Math.PI * k_eff * dist);
    }
    return ambientTemp_C + tempDelta;
  }

  // ASHRAE-based color scale
  // < 18C: blue, 18-22C: green (recommended inlet), 22-27C: yellow (A1 max),
  // 27-35C: orange (warning), > 35C: red (hot spot)
  function tempColor(temp: number): string {
    if (temp < 18) return '#1d4ed8';
    if (temp < 22) return '#16a34a';
    if (temp < 27) return '#ca8a04';
    if (temp < 35) return '#ea580c';
    return '#dc2626';
  }

  // Generate temperature grid
  const cellSize = 36;
  const grid: { x: number; y: number; temp: number }[] = [];
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      grid.push({ x, y, temp: computeTemp(x + 0.5, y + 0.5) });
    }
  }

  const selectedTemp =
    selectedCell !== null ? computeTemp(selectedCell.x + 0.5, selectedCell.y + 0.5) : null;

  function addSource(type: 'rack' | 'crac') {
    const kW = type === 'rack' ? 10 : -20;
    setSources((prev) => [...prev, { id: nextId, x: 0, y: 0, kW, type }]);
    setNextId((n) => n + 1);
  }

  function removeSource(id: number) {
    setSources((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '16px', maxWidth: '700px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
        Thermal Comfort Map
      </h2>
      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
        2D Temperature Distribution | ASHRAE Color Scale | Click cell for reading
      </p>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '13px' }}>
        <label>
          Ambient: {ambientTemp_C}C
          <input
            type="range"
            min="15"
            max="30"
            value={ambientTemp_C}
            onChange={(e) => setAmbientTemp(+e.target.value)}
            style={{ width: '80px', marginLeft: '4px' }}
          />
        </label>
        <button
          onClick={() => addSource('rack')}
          style={{
            padding: '2px 8px',
            fontSize: '12px',
            cursor: 'pointer',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            background: '#fff',
          }}
        >
          + Rack
        </button>
        <button
          onClick={() => addSource('crac')}
          style={{
            padding: '2px 8px',
            fontSize: '12px',
            cursor: 'pointer',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            background: '#fff',
          }}
        >
          + CRAC
        </button>
      </div>

      {/* SVG Temperature Grid */}
      <svg
        width={gridWidth * cellSize + 2}
        height={gridHeight * cellSize + 2}
        style={{ border: '1px solid #d1d5db', borderRadius: '4px' }}
      >
        {grid.map((cell) => (
          <rect
            key={`${cell.x}-${cell.y}`}
            x={cell.x * cellSize + 1}
            y={cell.y * cellSize + 1}
            width={cellSize - 1}
            height={cellSize - 1}
            fill={tempColor(cell.temp)}
            opacity={0.7}
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedCell({ x: cell.x, y: cell.y })}
          />
        ))}

        {/* Source markers */}
        {sources.map((s) => (
          <g key={s.id}>
            <rect
              x={s.x * cellSize + 4}
              y={s.y * cellSize + 4}
              width={cellSize - 8}
              height={cellSize - 8}
              fill="none"
              stroke={s.type === 'rack' ? '#ef4444' : '#3b82f6'}
              strokeWidth="2"
              rx="2"
            />
            <text
              x={s.x * cellSize + cellSize / 2}
              y={s.y * cellSize + cellSize / 2 + 4}
              textAnchor="middle"
              fontSize="9"
              fill="#1f2937"
              fontWeight="bold"
            >
              {s.type === 'rack' ? 'R' : 'C'}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div
        style={{ display: 'flex', gap: '8px', marginTop: '8px', fontSize: '11px', color: '#6b7280' }}
      >
        <span>
          <span style={{ color: '#1d4ed8' }}>Blue</span> &lt;18C
        </span>
        <span>
          <span style={{ color: '#16a34a' }}>Green</span> 18-22C
        </span>
        <span>
          <span style={{ color: '#ca8a04' }}>Yellow</span> 22-27C
        </span>
        <span>
          <span style={{ color: '#ea580c' }}>Orange</span> 27-35C
        </span>
        <span>
          <span style={{ color: '#dc2626' }}>Red</span> &gt;35C
        </span>
      </div>

      {/* Selected cell readout */}
      {selectedTemp !== null && selectedCell && (
        <div
          style={{
            marginTop: '8px',
            padding: '6px 12px',
            background: '#f3f4f6',
            borderRadius: '4px',
            fontSize: '13px',
          }}
        >
          Cell ({selectedCell.x}, {selectedCell.y}): <strong>{selectedTemp.toFixed(1)}C</strong>
        </div>
      )}

      {/* Sources table */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '11px',
          marginTop: '12px',
        }}
      >
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ padding: '3px 6px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              Type
            </th>
            <th style={{ padding: '3px 6px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
              X
            </th>
            <th style={{ padding: '3px 6px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
              Y
            </th>
            <th style={{ padding: '3px 6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
              kW
            </th>
            <th style={{ padding: '3px 6px', borderBottom: '1px solid #e5e7eb' }}></th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.id}>
              <td style={{ padding: '3px 6px', color: s.type === 'rack' ? '#ef4444' : '#3b82f6' }}>
                {s.type === 'rack' ? 'Rack (heat)' : 'CRAC (cool)'}
              </td>
              <td style={{ padding: '3px 6px', textAlign: 'center' }}>
                <input
                  type="number"
                  min="0"
                  max={gridWidth - 1}
                  value={s.x}
                  onChange={(e) =>
                    setSources((prev) =>
                      prev.map((src) => (src.id === s.id ? { ...src, x: +e.target.value } : src))
                    )
                  }
                  style={{ width: '40px', fontSize: '11px', textAlign: 'center' }}
                />
              </td>
              <td style={{ padding: '3px 6px', textAlign: 'center' }}>
                <input
                  type="number"
                  min="0"
                  max={gridHeight - 1}
                  value={s.y}
                  onChange={(e) =>
                    setSources((prev) =>
                      prev.map((src) => (src.id === s.id ? { ...src, y: +e.target.value } : src))
                    )
                  }
                  style={{ width: '40px', fontSize: '11px', textAlign: 'center' }}
                />
              </td>
              <td style={{ padding: '3px 6px', textAlign: 'right' }}>
                <input
                  type="number"
                  value={s.kW}
                  onChange={(e) =>
                    setSources((prev) =>
                      prev.map((src) =>
                        src.id === s.id ? { ...src, kW: +e.target.value } : src
                      )
                    )
                  }
                  style={{ width: '50px', fontSize: '11px', textAlign: 'right' }}
                />
              </td>
              <td style={{ padding: '3px 6px' }}>
                <button
                  onClick={() => removeSource(s.id)}
                  style={{
                    fontSize: '10px',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    border: 'none',
                    background: 'none',
                  }}
                >
                  x
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '16px' }}>
        Engineering Disclaimer: Simplified point-source thermal model for visualization only.
        Verify with a licensed Professional Engineer and CFD analysis before use in design decisions.
      </p>
    </div>
  );
}

export default ThermalComfortMap;
