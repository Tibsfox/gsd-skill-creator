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

// =============================================================================
// 2026 GOLD STANDARD BUILDS — April 2026 new retail pricing
// Research date: April 3, 2026
// Market context: DRAM shortage, GPU supply constrained, DDR5 prices 2-4x above 2024
// =============================================================================

// === Gold Standard 2026 Tier Builds ===
var GOLD_STANDARD_2026 = [
  {
    id: 'gs-2026-t1',
    tier: 1,
    label: 'Budget Build',
    cost: 1439,
    cpu: 'AMD Ryzen 5 9600X',
    cpuSpec: '6C/12T, 3.8-5.4 GHz Zen 5, 65W',
    cores: 6,
    threads: 12,
    ram: 32,
    ramSpec: '32GB (2x16GB) DDR5-6000 CL30',
    gpu: 'AMD RX 9060 XT 8GB',
    vram: 8,
    tflops: 17,
    costPerCore: 240,
    costPerTflop: 85,
    gb6sc: 3284,
    gb6mc: 14594,
    gb6mcPerK: 10135,
    wattage: 400,
    motherboard: 'ASRock B650M Pro RS WiFi',
    storage: '1TB Samsung 990 EVO NVMe',
    psu: 'Corsair RM750x 750W Gold',
    chassis: 'NZXT H5 Flow',
    cooler: 'Stock / Thermalright PA120'
  },
  {
    id: 'gs-2026-t2',
    tier: 2,
    label: 'Gaming / Workstation',
    cost: 4712,
    cpu: 'AMD Ryzen 9 9950X',
    cpuSpec: '16C/32T, 4.3-5.7 GHz Zen 5, 170W',
    cores: 16,
    threads: 32,
    ram: 64,
    ramSpec: '64GB (2x32GB) DDR5-6000 CL30',
    gpu: 'NVIDIA RTX 5080',
    vram: 16,
    tflops: 56.3,
    costPerCore: 295,
    costPerTflop: 84,
    gb6sc: 3359,
    gb6mc: 20550,
    gb6mcPerK: 4362,
    wattage: 800,
    motherboard: 'MSI MAG X870 TOMAHAWK WiFi',
    storage: '6TB (2TB + 4TB) Samsung 990 Pro NVMe',
    psu: 'Corsair HX1500i 1500W Platinum',
    chassis: 'Fractal Design Torrent',
    cooler: 'Noctua NH-D15 G2'
  },
  {
    id: 'gs-2026-t3a',
    tier: 3,
    label: 'Scientific Workstation (3A: EPYC)',
    cost: 24400,
    cpu: 'AMD EPYC 9755',
    cpuSpec: '128C/256T, 2.7-4.1 GHz Zen 5, 500W',
    cores: 128,
    threads: 256,
    ram: 768,
    ramSpec: '768GB (12x64GB) DDR5-4800 ECC RDIMM',
    gpu: 'NVIDIA RTX 5090',
    vram: 32,
    tflops: 104.8,
    costPerCore: 191,
    costPerTflop: 233,
    gb6sc: 2200,
    gb6mc: 18850,
    gb6mcPerK: null,
    wattage: 1200,
    motherboard: 'Supermicro H13SSL-NT',
    storage: '8TB (2x 4TB) Samsung 990 Pro NVMe',
    psu: '2x 1600W Platinum (redundant)',
    chassis: 'Supermicro CSE-747BTS 4U Tower',
    cooler: 'Industrial tower cooler + case fans'
  },
  {
    id: 'gs-2026-t3b',
    tier: 3,
    label: 'Scientific Workstation (3B: TR PRO 7-GPU)',
    cost: 114000,
    cpu: 'AMD TR PRO 9995WX',
    cpuSpec: '96C/192T, 2.5-5.4 GHz Zen 5, 350W',
    cores: 96,
    threads: 192,
    ram: 2048,
    ramSpec: '2TB (8x256GB) DDR5-5600 ECC RDIMM',
    gpu: '7x NVIDIA RTX PRO 6000 Blackwell',
    vram: 672,
    tflops: 875,
    costPerCore: 1188,
    costPerTflop: 130,
    gb6sc: 3100,
    gb6mc: 30170,
    gb6mcPerK: null,
    wattage: 5500,
    motherboard: 'ASUS Pro WS WRX90E-SAGE SE',
    storage: '24TB (2x4TB + 2x8TB) NVMe',
    psu: '2x 2000W Titanium (redundant)',
    chassis: 'Full tower workstation (EEB)',
    cooler: 'Custom loop / Noctua industrial'
  },
  {
    id: 'gs-2026-t4',
    tier: 4,
    label: 'Rack-Optimized (4U)',
    cost: 105116,
    cpu: '2x AMD EPYC 9654',
    cpuSpec: '96C/192T each = 192C/384T, 2.4 GHz, 360W ea',
    cores: 192,
    threads: 384,
    ram: 1536,
    ramSpec: '1.5TB (24x64GB) DDR5-4800 ECC RDIMM',
    gpu: '4x NVIDIA RTX PRO 6000 Blackwell',
    vram: 384,
    tflops: 500,
    costPerCore: 547,
    costPerTflop: 210,
    gb6sc: 2400,
    gb6mc: 36000,
    gb6mcPerK: null,
    wattage: 4500,
    motherboard: 'Supermicro AS-4125GS-TNRT2 (barebone)',
    storage: '15.36TB (4x 3.84TB NVMe U.2)',
    psu: '2x 2000W Titanium (included)',
    chassis: 'Supermicro 4U (integrated)',
    cooler: 'Enterprise cooling (integrated)',
    perfPerKPerU: 1.19
  },
  {
    id: 'gs-2026-t5',
    tier: 5,
    label: 'Cutting Edge (40U Rack)',
    cost: 971044,
    cpu: '18x AMD EPYC 9654',
    cpuSpec: '9x dual-socket, 1728C/3456T total',
    cores: 1728,
    threads: 3456,
    ram: 13824,
    ramSpec: '13.5TB (216x64GB) DDR5-4800 ECC RDIMM',
    gpu: '36x NVIDIA RTX PRO 6000 Blackwell',
    vram: 3456,
    tflops: 4500,
    costPerCore: 562,
    costPerTflop: 216,
    gb6sc: 2400,
    gb6mc: null,
    gb6mcPerK: null,
    wattage: 40000,
    motherboard: '9x Supermicro AS-4125GS-TNRT2',
    storage: '138.24TB (36x 3.84TB NVMe U.2)',
    psu: '18x 2000W Titanium',
    chassis: '42U rack enclosure',
    cooler: 'Enterprise per-node cooling',
    perfPerKPerU: null,
    tflopsPerU: 107,
    note: '4.5 PFLOPS FP32 in a single rack'
  }
];

// === GPU Landscape — April 2026 ===
var GPU_LANDSCAPE = [
  { gpu: 'RX 9060 XT 8GB',      arch: 'RDNA 4',    cuda: null,   vram: 8,   vramType: 'GDDR6',     tflops: 17,    msrp: 299,   street: 310,   costPerTflop: 18 },
  { gpu: 'RX 9060 XT 16GB',     arch: 'RDNA 4',    cuda: null,   vram: 16,  vramType: 'GDDR6',     tflops: 17,    msrp: 349,   street: 459,   costPerTflop: 27 },
  { gpu: 'RTX 5070 Ti',         arch: 'Blackwell',  cuda: 8960,   vram: 16,  vramType: 'GDDR7',     tflops: 43.9,  msrp: 749,   street: 1069,  costPerTflop: 24 },
  { gpu: 'RTX 5080',            arch: 'Blackwell',  cuda: 10752,  vram: 16,  vramType: 'GDDR7',     tflops: 56.3,  msrp: 999,   street: 1249,  costPerTflop: 22 },
  { gpu: 'RTX 5090',            arch: 'Blackwell',  cuda: 21760,  vram: 32,  vramType: 'GDDR7',     tflops: 104.8, msrp: 1999,  street: 3699,  costPerTflop: 35 },
  { gpu: 'RTX PRO 6000',        arch: 'Blackwell',  cuda: 24064,  vram: 96,  vramType: 'GDDR7 ECC', tflops: 125,   msrp: 8000,  street: 8000,  costPerTflop: 64 },
  { gpu: 'NVIDIA H100 SXM',     arch: 'Hopper',     cuda: 16896,  vram: 80,  vramType: 'HBM3',      tflops: 67,    msrp: null,  street: 30000, costPerTflop: 448 },
  { gpu: 'NVIDIA H200',         arch: 'Hopper',     cuda: 16896,  vram: 141, vramType: 'HBM3e',     tflops: 67,    msrp: null,  street: 35000, costPerTflop: 522 },
  { gpu: 'NVIDIA B200',         arch: 'Blackwell',  cuda: 18000,  vram: 192, vramType: 'HBM3e',     tflops: 180,   msrp: null,  street: 50000, costPerTflop: 278 }
];

// === CPU Landscape — April 2026 ===
var CPU_LANDSCAPE = [
  { cpu: 'Ryzen 5 9600X',   cores: 6,   threads: 12,  boost: '5.4 GHz', tdp: 65,  price: 229,   costPerCore: 38,  gb6mc: 14594 },
  { cpu: 'Ryzen 7 9700X',   cores: 8,   threads: 16,  boost: '5.5 GHz', tdp: 65,  price: 298,   costPerCore: 37,  gb6mc: 17000 },
  { cpu: 'Ryzen 9 9950X',   cores: 16,  threads: 32,  boost: '5.7 GHz', tdp: 170, price: 529,   costPerCore: 33,  gb6mc: 20550 },
  { cpu: 'TR PRO 7995WX',   cores: 96,  threads: 192, boost: '5.1 GHz', tdp: 350, price: 10000, costPerCore: 104, gb6mc: 25000 },
  { cpu: 'TR PRO 9995WX',   cores: 96,  threads: 192, boost: '5.4 GHz', tdp: 350, price: 11699, costPerCore: 122, gb6mc: 30170 },
  { cpu: 'EPYC 9654',       cores: 96,  threads: 192, boost: '3.7 GHz', tdp: 360, price: 6650,  costPerCore: 69,  gb6mc: 22000 },
  { cpu: 'EPYC 9755',       cores: 128, threads: 256, boost: '4.1 GHz', tdp: 500, price: 4711,  costPerCore: 37,  gb6mc: 18850 }
];

// === Historical Reference Points per Tier (for trend charts) ===
var TIER_HISTORY = {
  1: [
    { year: 2008, cpu: 'AMD Phenom X4 9950', gpu: 'Radeon HD 4870', ramPerGB: 8,  systemCost: 800,   costPerCore: 200, gpuTflops: 1.2 },
    { year: 2011, cpu: 'AMD Phenom II X6 1100T', gpu: 'Radeon HD 6870', ramPerGB: 5,  systemCost: 700,   costPerCore: 117, gpuTflops: 2.0 },
    { year: 2014, cpu: 'AMD FX-8350', gpu: 'GTX 970', ramPerGB: 8,  systemCost: 850,   costPerCore: 106, gpuTflops: 3.9 },
    { year: 2018, cpu: 'Ryzen 5 2600', gpu: 'GTX 1060 6GB', ramPerGB: 10, systemCost: 800,   costPerCore: 133, gpuTflops: 4.4 },
    { year: 2022, cpu: 'Ryzen 5 5600', gpu: 'RX 6650 XT', ramPerGB: 3,  systemCost: 750,   costPerCore: 125, gpuTflops: 10.8 },
    { year: 2024, cpu: 'Ryzen 5 7600', gpu: 'RTX 4060', ramPerGB: 2.5, systemCost: 800,   costPerCore: 133, gpuTflops: 15.1 },
    { year: 2026, cpu: 'Ryzen 5 9600X', gpu: 'RX 9060 XT', ramPerGB: 12.8, systemCost: 1439, costPerCore: 240, gpuTflops: 17 }
  ],
  2: [
    { year: 2008, cpu: 'Core 2 Quad Q9650', gpu: 'GTX 280', ramPerGB: 8,  systemCost: 2000,  costPerCore: 500, gpuTflops: 0.93 },
    { year: 2011, cpu: 'i7-2600K', gpu: 'GTX 580', ramPerGB: 5,  systemCost: 1500,  costPerCore: 375, gpuTflops: 1.6 },
    { year: 2014, cpu: 'i7-4790K', gpu: 'GTX 980', ramPerGB: 8,  systemCost: 1700,  costPerCore: 425, gpuTflops: 4.6 },
    { year: 2018, cpu: 'Ryzen 7 2700X', gpu: 'RTX 2080 Ti', ramPerGB: 10, systemCost: 2500,  costPerCore: 313, gpuTflops: 13.4 },
    { year: 2022, cpu: 'Ryzen 9 5950X', gpu: 'RTX 3090', ramPerGB: 3,  systemCost: 3000,  costPerCore: 188, gpuTflops: 35.6 },
    { year: 2024, cpu: 'Ryzen 9 7950X', gpu: 'RTX 4090', ramPerGB: 2.5, systemCost: 3200,  costPerCore: 200, gpuTflops: 82.6 },
    { year: 2026, cpu: 'Ryzen 9 9950X', gpu: 'RTX 5080', ramPerGB: 12.8, systemCost: 4712, costPerCore: 295, gpuTflops: 56.3 }
  ],
  3: [
    { year: 2008, cpu: '2x Opteron 2356 (8C)', gpu: 'Tesla C1060', ramPerGB: null, systemCost: 15000,  costPerCore: 1875, gpuTflops: 0.93 },
    { year: 2011, cpu: '2x Opteron 6176 (24C)', gpu: 'Tesla M2090', ramPerGB: null, systemCost: 14000,  costPerCore: 583,  gpuTflops: 1.33 },
    { year: 2014, cpu: '2x Xeon E5-2697 v3 (28C)', gpu: 'Tesla K80', ramPerGB: null, systemCost: 18000, costPerCore: 643,  gpuTflops: 8.7 },
    { year: 2018, cpu: 'TR 2990WX (32C)', gpu: 'Tesla V100', ramPerGB: null, systemCost: 14000,  costPerCore: 438,  gpuTflops: 15.7 },
    { year: 2022, cpu: 'TR PRO 5995WX (64C)', gpu: 'A100 80GB', ramPerGB: null, systemCost: 30000, costPerCore: 469,  gpuTflops: 19.5 },
    { year: 2024, cpu: 'TR PRO 7995WX (96C)', gpu: 'RTX 6000 Ada', ramPerGB: null, systemCost: 40000, costPerCore: 417,  gpuTflops: 91.1 },
    { year: 2026, cpu: 'EPYC 9755 (128C)', gpu: 'RTX PRO 6000', ramPerGB: null, systemCost: 28000, costPerCore: 219, gpuTflops: 125 }
  ]
};

// === TOP500 Reference Data (Rmax in TFLOPS, FP64 Linpack) ===
var TOP500_DATA = [
  { year: 2008, month: 11, rank1Name: 'Roadrunner (LANL)',       rank1Tflops: 1026,      rank500Tflops: 12.64,  sumTflops: 16000,   note: 'First petaflop system' },
  { year: 2011, month: 6,  rank1Name: 'K computer (RIKEN)',      rank1Tflops: 8160,      rank500Tflops: 40,     sumTflops: 58000,   note: '' },
  { year: 2014, month: 6,  rank1Name: 'Tianhe-2 (NUDT)',         rank1Tflops: 33860,     rank500Tflops: 133.7,  sumTflops: 274000,  note: '' },
  { year: 2018, month: 11, rank1Name: 'Summit (ORNL)',           rank1Tflops: 143500,    rank500Tflops: 1000,   sumTflops: 1130000, note: '#500 approaches petascale' },
  { year: 2022, month: 11, rank1Name: 'Frontier (ORNL)',         rank1Tflops: 1102000,   rank500Tflops: 1700,   sumTflops: 4860000, note: 'First exascale system' },
  { year: 2024, month: 11, rank1Name: 'El Capitan (LLNL)',       rank1Tflops: 1742000,   rank500Tflops: 2310,   sumTflops: 8300000, note: '' }
];

// === DRAM Crisis Data ($/GB DDR5 desktop) ===
var DRAM_CRISIS = {
  pricePerGB: {
    '2024-Q1': 2.50,
    '2024-Q4': 3.00,
    '2025-Q2': 2.50,
    '2025-Q4': 8.00,
    '2026-Q2': 12.80
  },
  impactByTier: [
    { tier: 1, ramPctOfBuild2024: 8,  ramPctOfBuild2026: 28 },
    { tier: 2, ramPctOfBuild2024: 4,  ramPctOfBuild2026: 17 },
    { tier: 3, ramPctOfBuild2024: 15, ramPctOfBuild2026: 34 },
    { tier: 4, ramPctOfBuild2024: 12, ramPctOfBuild2026: 22 },
    { tier: 5, ramPctOfBuild2024: 12, ramPctOfBuild2026: 22 }
  ],
  rootCause: 'AI datacenter buildout consuming all available DRAM fab capacity',
  samsung60PctHike: true,
  forecast: 'Prices expected to remain elevated through 2026, potential relief in 2027'
};

// === Reference Platform ===
var REFERENCE_PLATFORM = {
  motherboard: 'Gigabyte MZ72-HB0 Rev 3.x',
  cpu: '2x AMD EPYC 7T83',
  cpuSpec: '64C/128T each = 128C/256T total',
  ram: '1TB DDR4-3200 ECC (16x 64GB)',
  totalCost: 10600,
  generation: 'SP3 (Milan) — two generations behind SP5 (Turin)',
  pcie: '4.0',
  ddr: 'DDR4',
  verdict: 'Closeout value — do not use for new system design basis'
};

// === Value Analysis Summary ===
var VALUE_ANALYSIS = [
  { metric: 'Lowest $/Core',       bestTier: '3A', value: '$191/core',          detail: 'EPYC 9755' },
  { metric: 'Lowest $/TFLOP',      bestTier: '1-2', value: '$84-85/TFLOP',     detail: 'Consumer GPU sweet spot' },
  { metric: 'Best GB6 SC',         bestTier: '2',  value: '3,359',              detail: 'Ryzen 9 9950X' },
  { metric: 'Best GB6 MC per $1K', bestTier: '1',  value: '10,135',             detail: 'Best multi-thread value' },
  { metric: 'Best Perf/$/U',       bestTier: '4',  value: '1.50 TFLOPS/$K/U',  detail: 'RTX 5090 config' },
  { metric: 'Most VRAM',           bestTier: '5',  value: '3,456GB (3.375TB)',  detail: '36x RTX PRO 6000' },
  { metric: 'Most Total Compute',  bestTier: '5',  value: '4.5 PFLOPS',         detail: 'Single rack' }
];

// === White-Box vs TOP500 Floor ===
var WHITEBOX_VS_TOP500 = [
  { year: 2008, top500Floor: 12.64,  tierToMatch: 'T2', costToMatch: 4000,   note: 'Single high-end GPU today' },
  { year: 2011, top500Floor: 40,     tierToMatch: 'T2', costToMatch: 5000,   note: 'Single RTX 5080 = 56 TFLOPS' },
  { year: 2014, top500Floor: 133.7,  tierToMatch: 'T2-3', costToMatch: 12000, note: '2x RTX 5090' },
  { year: 2018, top500Floor: 1000,   tierToMatch: 'T4', costToMatch: 140000, note: '2x 4U servers w/ 8 GPUs' },
  { year: 2022, top500Floor: 1700,   tierToMatch: 'T4', costToMatch: 280000, note: '4x 4U servers' },
  { year: 2024, top500Floor: 2310,   tierToMatch: 'T5', costToMatch: 500000, note: 'Half rack' }
];
