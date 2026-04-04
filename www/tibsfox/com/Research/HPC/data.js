/**
 * HPC Research Archive — Chart.js Datasets
 * Source: tiggerfox.livejournal.com (2004-2026)
 * 13 system designs spanning 20 years
 */

// === Tier definitions ===
var HPC_TIERS = {
  1: { name: 'Budget Build', color: '#10b981', question: 'Lowest possible cost, highest possible performance — what can you make on ~$1K?' },
  2: { name: 'Gaming / Workstation', color: '#f59e0b', question: 'High-end gaming desktop — best prosumer build?' },
  3: { name: 'Scientific Workstation', color: '#3b82f6', question: 'Very high performance for real scientific workloads — no compromise on compute' },
  4: { name: 'Rack-Optimized (4U)', color: '#8b5cf6', question: 'Lowest cost, highest performance in a standard 4U rack space — perf/$/U' },
  5: { name: 'Cutting Edge (40U)', color: '#ef4444', question: 'Best performance per 40U rack — price no object' }
};

// === System catalog ===
var HPC_SYSTEMS = [
  { id: 'fractal-cluster',    year: 2006, month: 11, label: 'Fractal Cluster',       cost: 2500,     cores: 6,     ram: 8,     vram: null,   tflops: null,     costPerCore: 417,   postId: '9847',  file: '2006-fractal-cluster.html',    tier: 1 },
  { id: 'budget-workstation', year: 2008, month: 3,  label: '$1,121 Workstation',     cost: 1121,     cores: 8,     ram: 8,     vram: null,   tflops: null,     costPerCore: 140,   postId: '45597', file: '2008-budget-workstation.html',  tier: 1 },
  { id: 'midrange-server',    year: 2008, month: 3,  label: '$4,655 Mid-Range',       cost: 4655,     cores: 16,    ram: 16,    vram: null,   tflops: null,     costPerCore: 291,   postId: '46408', file: '2008-midrange-server.html',     tier: 3 },
  { id: 'gaming-extreme',     year: 2008, month: 3,  label: '$5,169 Gaming Extreme',  cost: 5169,     cores: 8,     ram: 8,     vram: 1.5,    tflops: null,     costPerCore: 646,   postId: '45973', file: '2008-gaming-extreme.html',      tier: 2 },
  { id: 'first-32-core',      year: 2008, month: 3,  label: '$8,761 First 32-Core',   cost: 8761,     cores: 32,    ram: 32,    vram: null,   tflops: null,     costPerCore: 274,   postId: '46901', file: '2008-first-32-core.html',       tier: 3 },
  { id: 'high-memory',        year: 2008, month: 3,  label: '$43,361 High Memory',    cost: 43361,    cores: 32,    ram: 128,   vram: null,   tflops: null,     costPerCore: 1355,  postId: '47232', file: '2008-high-memory.html',         tier: 3 },
  { id: 'benchmark-analysis', year: 2009, month: 1,  label: 'CPU Benchmark Analysis', cost: null,     cores: null,  ram: null,  vram: null,   tflops: null,     costPerCore: null,  postId: '67441', file: '2009-benchmark-analysis.html',  tier: null },
  { id: 'budget-king',        year: 2009, month: 5,  label: '$291 Budget King',       cost: 291,      cores: 4,     ram: 4,     vram: null,   tflops: null,     costPerCore: 73,    postId: '76970', file: '2009-budget-king.html',         tier: 1 },
  { id: '3way-sli',           year: 2009, month: 5,  label: '$3,630 3-Way SLI',       cost: 3630,     cores: 4,     ram: 12,    vram: 3,      tflops: null,     costPerCore: 908,   postId: '76703', file: '2009-3way-sli.html',            tier: 2 },
  { id: 'storage-monster',    year: 2011, month: 3,  label: '$244,155 Storage Monster',cost: 244155,  cores: 48,    ram: 512,   vram: null,   tflops: null,     costPerCore: 5087,  postId: '89835', file: '2011-storage-monster.html',     tier: 3 },
  { id: 'render-farm',        year: 2011, month: 7,  label: '$10.5M Render Farm',     cost: 10500000, cores: null,   ram: 60000, vram: null,   tflops: 9139,     costPerCore: null,  postId: '90516', file: '2011-render-farm.html',         tier: 4 },
  { id: 'vm-economics',       year: 2018, month: 4,  label: '$622K VM Economics',     cost: 622000,   cores: 224,   ram: 12288, vram: 256,    tflops: 15.5,     costPerCore: 2776,  postId: '94260', file: '2018-vm-economics.html',        tier: 4 },
  { id: 'ai-workstation',     year: 2026, month: 1,  label: '$125K AI Workstation',   cost: 125087,   cores: 96,    ram: 2048,  vram: 672,    tflops: 637.7,    costPerCore: 1303,  postId: '94570', file: '2026-ai-workstation.html',      tier: 3 }
];

// === $/Core Over Time (excludes analysis-only and render farm) ===
var HPC_COST_PER_CORE_LABELS = ['2006', '2008\nWorkstation', '2008\nMid-Range', '2008\nGaming', '2008\n32-Core', '2008\nHigh Mem', '2009\nBudget', '2009\nSLI', '2011\nStorage', '2018\nVM', '2026\nAI'];
var HPC_COST_PER_CORE_DATA = [417, 140, 291, 646, 274, 1355, 73, 908, 5087, 2776, 1303];
var HPC_COST_PER_CORE_COLORS = [
  '#10b981cc',   // T1: Fractal Cluster (Budget)
  '#10b981cc',   // T1: Budget Workstation
  '#3b82f6cc',   // T3: Mid-Range (Scientific)
  '#f59e0bcc',   // T2: Gaming Extreme
  '#3b82f6cc',   // T3: First 32-Core (Scientific)
  '#3b82f6cc',   // T3: High Memory (Scientific)
  '#10b981cc',   // T1: Budget King
  '#f59e0bcc',   // T2: 3-Way SLI (Gaming)
  '#3b82f6cc',   // T3: Storage Monster (Scientific)
  '#8b5cf6cc',   // T4: VM Economics (Rack)
  '#3b82f6cc'    // T3: AI Workstation (Scientific)
];

// === Total System Cost Over Time (log scale) ===
var HPC_TOTAL_COST_LABELS = ['2006', 'Mar 2008', 'Mar 2008', 'Mar 2008', 'Mar 2008', 'Mar 2008', 'May 2009', 'May 2009', 'Mar 2011', 'Jul 2011', 'Apr 2018', 'Jan 2026'];
var HPC_TOTAL_COST_DATA = [2500, 1121, 4655, 5169, 8761, 43361, 291, 3630, 244155, 10500000, 622000, 125087];
var HPC_TOTAL_COST_NAMES = ['Fractal Cluster', 'Budget Workstation', 'Mid-Range Server', 'Gaming Extreme', 'First 32-Core', 'High Memory', 'Budget King', '3-Way SLI', 'Storage Monster', 'Render Farm', 'VM Economics', 'AI Workstation'];

// === Cores Over Time (log scale) ===
var HPC_CORES_LABELS = ['2006', '2008\nWorkstation', '2008\nMid-Range', '2008\nGaming', '2008\n32-Core', '2008\nHigh Mem', '2009\nBudget', '2009\nSLI', '2011\nStorage', '2018\nVM', '2026\nAI'];
var HPC_CORES_DATA = [6, 8, 16, 8, 32, 32, 4, 4, 48, 224, 96];

// === RAM Over Time (log scale, GB) ===
var HPC_RAM_LABELS = ['2006', '2008\nWS', '2008\nMid', '2008\nGame', '2008\n32C', '2008\nHiMem', '2009\nBudget', '2009\nSLI', '2011\nStorage', '2011\nFarm', '2018\nVM', '2026\nAI'];
var HPC_RAM_DATA = [8, 8, 16, 8, 32, 128, 4, 12, 512, 60000, 12288, 2048];

// === VRAM Over Time (where applicable, GB) ===
var HPC_VRAM_LABELS = ['2008\nGaming', '2009\n3-Way SLI', '2018\nVM Economics', '2026\nAI Workstation'];
var HPC_VRAM_DATA = [1.5, 3, 256, 672];

// === TFLOPS Over Time (where calculable) ===
var HPC_TFLOPS_LABELS = ['2011\nRender Farm', '2018\nVM Economics', '2026\nAI Workstation'];
var HPC_TFLOPS_DATA = [9139, 15.5, 637.7];

// === $/TFLOP Over Time ===
var HPC_COST_PER_TFLOP_LABELS = ['2011\nRender Farm', '2018\nVM Economics', '2026\nAI Workstation'];
var HPC_COST_PER_TFLOP_DATA = [1149, 40129, 196];

// === Combined timeline dataset for the main chart ===
var HPC_TIMELINE_YEARS = [2006, 2008, 2009, 2011, 2018, 2026];
var HPC_TIMELINE_COST_MIN = [2500, 1121, 291, 244155, 622000, 125087];
var HPC_TIMELINE_COST_MAX = [2500, 43361, 3630, 10500000, 622000, 125087];
var HPC_TIMELINE_CORES_MAX = [6, 32, 4, 48, 224, 96];

// === Benchmark Analysis Data (Jan 2009, Post #67441) ===
var HPC_BENCHMARK_DATA = [
  { cpu: 'AMD X4 9600', mhz: 2300, cores: 4, whet: 29782, price: 161.98, whetPerDollar: 183.86 },
  { cpu: 'AMD X3 8750', mhz: 2400, cores: 3, whet: 22344, price: 129.99, whetPerDollar: 171.89 },
  { cpu: 'AMD X4 9750', mhz: 2400, cores: 4, whet: 31203, price: 182.02, whetPerDollar: 171.42 },
  { cpu: 'AMD X4 9950', mhz: 2600, cores: 4, whet: 33904, price: 223.98, whetPerDollar: 151.37 },
  { cpu: 'AMD X3 8450', mhz: 2100, cores: 3, whet: 19541, price: 131.24, whetPerDollar: 148.90 },
  { cpu: 'AMD X2 7750', mhz: 2700, cores: 2, whet: 15903, price: 112.98, whetPerDollar: 140.76 },
  { cpu: 'AMD X4 9150e', mhz: 1800, cores: 4, whet: 22344, price: 161.98, whetPerDollar: 137.94 },
  { cpu: 'AMD X2 6400+', mhz: 3200, cores: 2, whet: 16625, price: 123.98, whetPerDollar: 134.09 },
  { cpu: 'AMD X2 5400+', mhz: 2800, cores: 2, whet: 14546, price: 109.23, whetPerDollar: 133.17 },
  { cpu: 'Intel Q9550', mhz: 2830, cores: 4, whet: 33093, price: 269.99, whetPerDollar: 122.57 },
  { cpu: 'AMD X2 5000+', mhz: 2600, cores: 2, whet: 13500, price: 110.49, whetPerDollar: 122.18 },
  { cpu: 'Intel Q9400', mhz: 2660, cores: 4, whet: 27488, price: 225.99, whetPerDollar: 121.63 },
  { cpu: 'Intel Q8200', mhz: 2330, cores: 4, whet: 21571, price: 179.99, whetPerDollar: 119.84 },
  { cpu: 'AMD X2 4850e', mhz: 2500, cores: 2, whet: 13824, price: 118.98, whetPerDollar: 116.19 },
  { cpu: 'Intel E8500', mhz: 3160, cores: 2, whet: 22091, price: 194.99, whetPerDollar: 113.29 },
  { cpu: 'Intel E8400', mhz: 3000, cores: 2, whet: 21022, price: 189.99, whetPerDollar: 110.65 },
  { cpu: 'Intel Q6700', mhz: 2660, cores: 4, whet: 25965, price: 268.99, whetPerDollar: 96.53 },
  { cpu: 'Intel E7400', mhz: 2800, cores: 2, whet: 15428, price: 162.24, whetPerDollar: 95.10 },
  { cpu: 'Intel Q6600', mhz: 2400, cores: 4, whet: 22005, price: 237.99, whetPerDollar: 92.46 },
  { cpu: 'Intel E7300', mhz: 2660, cores: 2, whet: 12614, price: 136.24, whetPerDollar: 92.59 },
  { cpu: 'Intel E7200', mhz: 2530, cores: 2, whet: 11993, price: 133.99, whetPerDollar: 89.51 },
  { cpu: 'AMD X2 4450e', mhz: 2300, cores: 2, whet: 9216, price: 107.47, whetPerDollar: 85.75 },
  { cpu: 'Intel Q9650', mhz: 3000, cores: 4, whet: 31082, price: 368.99, whetPerDollar: 84.24 },
  { cpu: 'Intel E5300', mhz: 2600, cores: 2, whet: 10713, price: 132.99, whetPerDollar: 80.56 },
  { cpu: 'Intel E5200', mhz: 2500, cores: 2, whet: 8654, price: 117.49, whetPerDollar: 73.66 },
  { cpu: 'AMD Opt 2382', mhz: 2600, cores: 4, whet: 18547, price: 277.99, whetPerDollar: 66.72 },
  { cpu: 'AMD Opt 2384', mhz: 2700, cores: 4, whet: 19254, price: 392.99, whetPerDollar: 48.99 },
  { cpu: 'Intel QX9770', mhz: 3200, cores: 4, whet: 33094, price: 569.49, whetPerDollar: 58.11 },
  { cpu: 'Intel i7 920', mhz: 2660, cores: 4, whet: 21654, price: 339.99, whetPerDollar: 63.69 },
  { cpu: 'Intel i7 940', mhz: 2930, cores: 4, whet: 24375, price: 569.49, whetPerDollar: 42.80 },
  { cpu: 'Intel i7 965', mhz: 3200, cores: 4, whet: 70098, price: 1223.99, whetPerDollar: 57.27 }
];

// === Tier-colored $/Core bar chart data ===
var HPC_COST_PER_CORE_TIER_COLORS = HPC_SYSTEMS.filter(function(s) { return s.costPerCore !== null; }).map(function(s) {
  var t = HPC_TIERS[s.tier];
  return t ? t.color + 'cc' : 'rgba(128,128,128,0.6)';
});

// === Tier-based $/Core line datasets (for multi-line chart) ===
function hpcBuildTierLineDatasets(metric) {
  var tierData = {};
  HPC_SYSTEMS.forEach(function(s) {
    if (!s.tier || s[metric] === null) return;
    if (!tierData[s.tier]) tierData[s.tier] = [];
    tierData[s.tier].push({ x: s.year + (s.month - 1) / 12, y: s[metric], label: s.label });
  });
  var datasets = [];
  [1, 2, 3, 4, 5].forEach(function(t) {
    if (!tierData[t]) return;
    var info = HPC_TIERS[t];
    var sorted = tierData[t].sort(function(a, b) { return a.x - b.x; });
    datasets.push({
      label: 'T' + t + ': ' + info.name,
      data: sorted.map(function(d) { return d.y; }),
      labels: sorted.map(function(d) { return d.label; }),
      xValues: sorted.map(function(d) { return d.x; }),
      borderColor: info.color,
      backgroundColor: info.color + '20',
      pointBackgroundColor: info.color,
      pointBorderColor: '#0a1628',
      pointBorderWidth: 2,
      pointRadius: 6,
      fill: false,
      tension: 0.2,
      borderWidth: 2
    });
  });
  return datasets;
}

// === Tier Gap data (ratio between max-tier and min-tier cost) ===
var HPC_TIER_GAP_YEARS = [2008, 2009];
var HPC_TIER_GAP_RATIO = [
  43361 / 1121,   // 2008: High Memory / Budget Workstation = 38.7x
  3630 / 291      // 2009: 3-Way SLI / Budget King = 12.5x
];

// === Chart rendering helpers ===
function hpcFormatCost(v) {
  if (v >= 1000000) return '$' + (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return '$' + (v / 1000).toFixed(0) + 'K';
  return '$' + v;
}

function hpcGetTierBadge(tier) {
  if (!tier) return '';
  var t = HPC_TIERS[tier];
  return '<span style="display:inline-block;padding:0.12rem 0.4rem;border-radius:0.2rem;font-size:0.65rem;font-weight:600;background:' + t.color + '22;color:' + t.color + ';font-family:\'IBM Plex Mono\',monospace;">T' + tier + ': ' + t.name + '</span>';
}

function hpcRenderBenchmarkTable(containerId) {
  var sorted = HPC_BENCHMARK_DATA.slice().sort(function(a, b) { return b.whetPerDollar - a.whetPerDollar; });
  var html = '<table><thead><tr>';
  html += '<th>#</th><th>CPU</th><th>MHz</th><th>Cores</th><th>Whetstone</th><th>Price</th><th>W/T$</th>';
  html += '</tr></thead><tbody>';
  sorted.forEach(function(row, i) {
    var cls = i === 0 ? ' style="background:rgba(0,255,65,0.08)"' : '';
    html += '<tr' + cls + '>';
    html += '<td>' + (i + 1) + '</td>';
    html += '<td><strong>' + row.cpu + '</strong></td>';
    html += '<td>' + row.mhz + '</td>';
    html += '<td>' + row.cores + '</td>';
    html += '<td>' + row.whet.toLocaleString() + '</td>';
    html += '<td class="cost-cell">$' + row.price.toFixed(2) + '</td>';
    html += '<td class="metric-cell">' + row.whetPerDollar.toFixed(2) + '</td>';
    html += '</tr>';
  });
  html += '</tbody></table>';
  document.getElementById(containerId).innerHTML = html;
}
