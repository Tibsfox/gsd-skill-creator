// Pipe Network Calculator — Claude Artifact Template
// Self-contained: no external imports required
// Uses Hardy-Cross iteration to solve pipe network flow distribution
//
// Deploy: copy this entire file into a Claude artifact panel
// Recharts components (LineChart, BarChart, etc.) are available in the artifact environment

function PipeNetworkCalculator() {
  // Default: simple 3-pipe loop system
  const [flowRate_LPM, setFlowRate] = React.useState(100);
  const [pipeDiameter_mm, setPipeDiameter] = React.useState(50);
  const [pipeLength_m, setPipeLength] = React.useState(20);
  const [results, setResults] = React.useState<any[] | null>(null);

  // Pipe resistance coefficient for Darcy-Weisbach
  // R = f * L / (D * 2g * A^2) where A = pi*D^2/4
  function calcResistance(length_m: number, diameter_m: number, friction_f = 0.02): number {
    const area = Math.PI * (diameter_m / 2) ** 2; // m^2
    const g = 9.81;
    return (friction_f * length_m) / (diameter_m * 2 * g * area * area);
  }

  // Hardy-Cross solver (simplified 3-pipe parallel network)
  // Pipe 1: main run, Pipe 2: branch (longer, smaller), Pipe 3: return
  function solveNetwork(Q_total_m3s: number, D_m: number, L_m: number) {
    const r1 = calcResistance(L_m, D_m);
    const r2 = calcResistance(L_m * 1.5, D_m * 0.75); // branch: longer, smaller
    const r3 = calcResistance(L_m, D_m);
    const pipes_r = [r1, r2, r3];

    // Initial guess: distribute evenly
    const Q = [Q_total_m3s / 3, Q_total_m3s / 3, Q_total_m3s / 3];

    // Hardy-Cross iteration (loop: pipes 0 and 1 form a loop)
    for (let iter = 0; iter < 100; iter++) {
      const loop = [0, 1];
      let num = 0;
      let den = 0;
      for (const i of loop) {
        const sign = i === 0 ? 1 : -1;
        const q = sign * Q[i];
        num += pipes_r[i] * q * Math.abs(q);
        den += 2 * pipes_r[i] * Math.abs(q);
      }
      const dQ = den > 0.0001 ? -num / den : 0;
      Q[0] += dQ;
      Q[1] -= dQ;
      if (Math.abs(dQ) < 1e-6) break;
    }

    return Q.map((q, i) => {
      const D = [D_m, D_m * 0.75, D_m][i];
      const A = Math.PI * (D / 2) ** 2;
      const v = Math.abs(q) / A;
      const Re = (v * D) / 1.004e-6; // water at 20C kinematic viscosity
      const deltaP = pipes_r[i] * q * Math.abs(q) * 998.2; // convert to Pa (* density)
      return {
        pipe: i + 1,
        label: ['Main', 'Branch', 'Return'][i],
        flow_LPM: (q * 60000).toFixed(1),
        velocity_ms: v.toFixed(2),
        Re: Math.round(Re),
        deltaP_kPa: (Math.abs(deltaP) / 1000).toFixed(2),
        status: v > 3.0 ? 'over-velocity' : v < 0.3 ? 'under-sized' : 'ok',
      };
    });
  }

  React.useEffect(() => {
    const Q_total = flowRate_LPM / 60000; // L/min -> m^3/s
    const D = pipeDiameter_mm / 1000;
    const L = pipeLength_m;
    setResults(solveNetwork(Q_total, D, L));
  }, [flowRate_LPM, pipeDiameter_mm, pipeLength_m]);

  const statusColor = (status: string) =>
    ({ ok: '#16a34a', 'over-velocity': '#dc2626', 'under-sized': '#ca8a04' }[status] || '#000');

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '16px', maxWidth: '640px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
        Pipe Network Calculator
      </h2>
      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
        Hardy-Cross method | Water at 20C | 3-pipe parallel network
      </p>

      {/* Parameter controls */}
      <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
        <label style={{ fontSize: '13px' }}>
          Total Flow Rate: <strong>{flowRate_LPM} L/min</strong>
          <input
            type="range"
            min="10"
            max="500"
            value={flowRate_LPM}
            onChange={(e) => setFlowRate(+e.target.value)}
            style={{ width: '100%' }}
          />
        </label>
        <label style={{ fontSize: '13px' }}>
          Main Pipe Diameter: <strong>{pipeDiameter_mm} mm</strong>
          <input
            type="range"
            min="25"
            max="200"
            step="5"
            value={pipeDiameter_mm}
            onChange={(e) => setPipeDiameter(+e.target.value)}
            style={{ width: '100%' }}
          />
        </label>
        <label style={{ fontSize: '13px' }}>
          Pipe Length (reference): <strong>{pipeLength_m} m</strong>
          <input
            type="range"
            min="5"
            max="100"
            value={pipeLength_m}
            onChange={(e) => setPipeLength(+e.target.value)}
            style={{ width: '100%' }}
          />
        </label>
      </div>

      {/* Results table */}
      {results && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid #d1d5db' }}>
                Pipe
              </th>
              <th
                style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #d1d5db' }}
              >
                Flow (L/min)
              </th>
              <th
                style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #d1d5db' }}
              >
                Velocity (m/s)
              </th>
              <th
                style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #d1d5db' }}
              >
                Re
              </th>
              <th
                style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #d1d5db' }}
              >
                dP (kPa)
              </th>
              <th
                style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #d1d5db' }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.pipe}>
                <td style={{ padding: '6px' }}>
                  {r.label} (Pipe {r.pipe})
                </td>
                <td style={{ padding: '6px', textAlign: 'right' }}>{r.flow_LPM}</td>
                <td style={{ padding: '6px', textAlign: 'right' }}>{r.velocity_ms}</td>
                <td style={{ padding: '6px', textAlign: 'right' }}>{r.Re.toLocaleString()}</td>
                <td style={{ padding: '6px', textAlign: 'right' }}>{r.deltaP_kPa}</td>
                <td
                  style={{
                    padding: '6px',
                    textAlign: 'center',
                    color: statusColor(r.status),
                    fontWeight: 'bold',
                  }}
                >
                  {r.status === 'ok' ? 'OK' : r.status === 'over-velocity' ? 'FAST' : 'SLOW'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '16px' }}>
        {'Engineering Disclaimer: All results are approximate. Verify with a licensed Professional Engineer before use in design or construction decisions.'}
      </p>
    </div>
  );
}

export default PipeNetworkCalculator;
