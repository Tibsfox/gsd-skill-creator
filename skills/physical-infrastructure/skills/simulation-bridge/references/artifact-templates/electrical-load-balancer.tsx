// Electrical Load Balancer — Claude Artifact Template
// Self-contained: no external imports required
// Calculates 3-phase panel load distribution and highlights imbalances
//
// Deploy: copy this entire file into a Claude artifact panel
// Recharts components (BarChart, Bar, etc.) are available in the artifact environment

interface Circuit {
  id: number;
  name: string;
  phase: 'A' | 'B' | 'C';
  load_W: number;
  breaker_A: number;
}

function ElectricalLoadBalancer() {
  const [voltage_LN, setVoltageLN] = React.useState(120); // line-to-neutral
  const [powerFactor, setPowerFactor] = React.useState(0.95);
  const [circuits, setCircuits] = React.useState<Circuit[]>([
    { id: 1, name: 'Server Rack 1', phase: 'A', load_W: 5000, breaker_A: 20 },
    { id: 2, name: 'Server Rack 2', phase: 'B', load_W: 4800, breaker_A: 20 },
    { id: 3, name: 'Server Rack 3', phase: 'C', load_W: 5200, breaker_A: 20 },
    { id: 4, name: 'Cooling Unit 1', phase: 'A', load_W: 3000, breaker_A: 30 },
    { id: 5, name: 'Cooling Unit 2', phase: 'B', load_W: 3000, breaker_A: 30 },
    { id: 6, name: 'Lighting Panel', phase: 'C', load_W: 1500, breaker_A: 20 },
    { id: 7, name: 'UPS Feed', phase: 'A', load_W: 2000, breaker_A: 20 },
    { id: 8, name: 'Network Equip', phase: 'B', load_W: 1200, breaker_A: 20 },
    { id: 9, name: 'Monitoring', phase: 'C', load_W: 800, breaker_A: 15 },
  ]);
  const [nextId, setNextId] = React.useState(10);

  // Calculate phase loads
  function calculatePhaseLoads() {
    const phases: Record<string, number> = { A: 0, B: 0, C: 0 };
    for (const c of circuits) {
      phases[c.phase] += c.load_W;
    }
    return phases;
  }

  // Calculate imbalance percentage
  function calculateImbalance(phases: Record<string, number>) {
    const values = Object.values(phases);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = values.reduce((a, b) => a + b, 0) / 3;
    if (avg === 0) return 0;
    return ((max - min) / avg) * 100;
  }

  // Calculate current per phase
  function phaseCurrent(load_W: number): number {
    return load_W / (voltage_LN * powerFactor);
  }

  // Check if a circuit is overloaded
  function isOverloaded(c: Circuit): boolean {
    const current = c.load_W / (voltage_LN * powerFactor);
    return current > c.breaker_A * 0.8; // 80% NEC continuous load limit
  }

  // Change circuit phase
  function changePhase(id: number, newPhase: 'A' | 'B' | 'C') {
    setCircuits((prev) => prev.map((c) => (c.id === id ? { ...c, phase: newPhase } : c)));
  }

  // Add a new circuit
  function addCircuit() {
    setCircuits((prev) => [
      ...prev,
      { id: nextId, name: `Circuit ${nextId}`, phase: 'A', load_W: 1000, breaker_A: 20 },
    ]);
    setNextId((n) => n + 1);
  }

  // Remove a circuit
  function removeCircuit(id: number) {
    setCircuits((prev) => prev.filter((c) => c.id !== id));
  }

  const phaseLoads = calculatePhaseLoads();
  const imbalance = calculateImbalance(phaseLoads);
  const totalLoad_W = Object.values(phaseLoads).reduce((a, b) => a + b, 0);

  const phaseData = [
    { phase: 'Phase A', load_kW: phaseLoads.A / 1000, current_A: phaseCurrent(phaseLoads.A) },
    { phase: 'Phase B', load_kW: phaseLoads.B / 1000, current_A: phaseCurrent(phaseLoads.B) },
    { phase: 'Phase C', load_kW: phaseLoads.C / 1000, current_A: phaseCurrent(phaseLoads.C) },
  ];

  const imbalanceColor = imbalance > 10 ? '#dc2626' : imbalance > 5 ? '#ca8a04' : '#16a34a';

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '16px', maxWidth: '720px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
        Electrical Load Balancer
      </h2>
      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
        3-Phase Panel Schedule | {voltage_LN}V L-N | PF {powerFactor}
      </p>

      {/* Summary bar */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '16px',
          padding: '8px',
          background: '#f3f4f6',
          borderRadius: '4px',
          fontSize: '13px',
        }}
      >
        <div>
          Total: <strong>{(totalLoad_W / 1000).toFixed(1)} kW</strong>
        </div>
        <div>
          Imbalance:{' '}
          <strong style={{ color: imbalanceColor }}>{imbalance.toFixed(1)}%</strong>
          {imbalance > 5 && (
            <span style={{ color: '#dc2626', marginLeft: '4px' }}>(NEMA limit: 5%)</span>
          )}
        </div>
      </div>

      {/* Phase load visualization using SVG bars */}
      <svg width="100%" height="80" viewBox="0 0 400 80">
        {phaseData.map((p, i) => {
          const maxLoad = Math.max(...phaseData.map((d) => d.load_kW), 1);
          const barWidth = (p.load_kW / maxLoad) * 300;
          const barColor = ['#3b82f6', '#f59e0b', '#10b981'][i];
          return (
            <g key={p.phase} transform={`translate(0, ${i * 25})`}>
              <text x="0" y="15" fontSize="12" fill="#374151">
                {p.phase}
              </text>
              <rect x="70" y="2" width={barWidth} height="18" fill={barColor} rx="2" />
              <text x={75 + barWidth} y="15" fontSize="11" fill="#6b7280">
                {p.load_kW.toFixed(1)} kW / {p.current_A.toFixed(1)} A
              </text>
            </g>
          );
        })}
      </svg>

      {/* Circuit table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '8px' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ padding: '4px 6px', textAlign: 'left', borderBottom: '1px solid #d1d5db' }}>
              Circuit
            </th>
            <th style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #d1d5db' }}>
              Phase
            </th>
            <th style={{ padding: '4px 6px', textAlign: 'right', borderBottom: '1px solid #d1d5db' }}>
              Load (W)
            </th>
            <th style={{ padding: '4px 6px', textAlign: 'right', borderBottom: '1px solid #d1d5db' }}>
              Breaker (A)
            </th>
            <th style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #d1d5db' }}>
              Status
            </th>
            <th style={{ padding: '4px 6px', borderBottom: '1px solid #d1d5db' }}></th>
          </tr>
        </thead>
        <tbody>
          {circuits.map((c) => (
            <tr
              key={c.id}
              style={{ background: isOverloaded(c) ? '#fef2f2' : 'transparent' }}
            >
              <td style={{ padding: '4px 6px' }}>{c.name}</td>
              <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                <select
                  value={c.phase}
                  onChange={(e) => changePhase(c.id, e.target.value as 'A' | 'B' | 'C')}
                  style={{ fontSize: '12px', padding: '2px' }}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </td>
              <td style={{ padding: '4px 6px', textAlign: 'right' }}>{c.load_W.toLocaleString()}</td>
              <td style={{ padding: '4px 6px', textAlign: 'right' }}>{c.breaker_A}</td>
              <td
                style={{
                  padding: '4px 6px',
                  textAlign: 'center',
                  color: isOverloaded(c) ? '#dc2626' : '#16a34a',
                  fontWeight: 'bold',
                }}
              >
                {isOverloaded(c) ? 'OVER' : 'OK'}
              </td>
              <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                <button
                  onClick={() => removeCircuit(c.id)}
                  style={{ fontSize: '11px', color: '#9ca3af', cursor: 'pointer', border: 'none', background: 'none' }}
                >
                  x
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={addCircuit}
        style={{
          marginTop: '8px',
          padding: '4px 12px',
          fontSize: '12px',
          cursor: 'pointer',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          background: '#fff',
        }}
      >
        + Add Circuit
      </button>

      <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '16px' }}>
        {'Engineering Disclaimer: All results are approximate. Verify with a licensed Professional Engineer and licensed Electrician before use in design or construction decisions.'}
      </p>
    </div>
  );
}

export default ElectricalLoadBalancer;
