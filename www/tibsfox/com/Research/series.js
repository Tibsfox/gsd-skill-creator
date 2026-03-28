// PNW Research Series — shared navigation bar
// Injected into all sub-project HTML files
(function() {
  var projects = [
    { id: 'ACC', name: 'Accounting', path: 'ACC/index.html' },
    { id: 'AGR', name: 'PNW Agriculture', path: 'AGR/index.html' },
    { id: 'ARC', name: 'Shapes & Colors', path: 'ARC/index.html' },
    { id: 'ATC', name: 'Aries-Taurus Cusp', path: 'ATC/index.html' },
    { id: 'AVI', name: 'Birds', path: 'AVI/index.html' },
    { id: 'AWF', name: 'Air Water Food', path: 'AWF/index.html' },
    { id: 'BCM', name: 'Building', path: 'BCM/index.html' },
    { id: 'BPS', name: 'Bio-Physics', path: 'BPS/index.html' },
    { id: 'BLA', name: 'Business Law', path: 'BLA/index.html' },
    { id: 'BRC', name: 'Black Rock City', path: 'BRC/index.html' },
    { id: 'C89', name: 'C89.5 FM', path: 'C89/index.html' },
    { id: 'CAS', name: 'Cascade Range', path: 'CAS/index.html' },
    { id: 'CMH', name: 'Comp. Mesh', path: 'CMH/index.html' },
    { id: 'CDP', name: 'Coldplay', path: 'CDP/index.html' },
    { id: 'COI', name: 'Coil', path: 'COI/index.html' },
    { id: 'COL', name: 'Columbia Valley', path: 'COL/index.html' },
    { id: 'CRV', name: 'Corvid PNW', path: 'CRV/index.html' },
    { id: 'DAA', name: 'Deep Audio', path: 'DAA/index.html' },
    { id: 'DDA', name: 'dada', path: 'DDA/index.html' },
    { id: 'ECO', name: 'Living Systems', path: 'ECO/index.html' },
    { id: 'EMG', name: 'Electric Motors', path: 'EMG/index.html' },
    { id: 'FDR', name: 'Fire Dragon', path: 'FDR/index.html' },
    { id: 'FFA', name: 'Fur & Feathers', path: 'FFA/index.html' },
    { id: 'FQC', name: 'Freq. Continuum', path: 'FQC/index.html' },
    { id: 'GDN', name: 'Gardening', path: 'GDN/index.html' },
    { id: 'GGT', name: 'Geggy Tah', path: 'GGT/index.html' },
    { id: 'GTP', name: 'Geggy Tah Prod.', path: 'GTP/index.html' },
    { id: 'GRD', name: 'Gradient Engine', path: 'GRD/index.html' },
    { id: 'GRV', name: 'Green River', path: 'GRV/index.html' },
    { id: 'GSD2', name: 'GSD-2 Arch.', path: 'GSD2/index.html' },
    { id: 'HGE', name: 'Hydro-Geothermal', path: 'HGE/index.html' },
    { id: 'JNS', name: 'JanSport', path: 'JNS/index.html' },
    { id: 'K8S', name: 'Kubernetes', path: 'K8S/index.html' },
    { id: 'KGX', name: "King's X", path: 'KGX/index.html' },
    { id: 'KSM', name: 'KISM 92.9', path: 'KSM/index.html' },
    { id: 'KPZ', name: 'KPLZ Seattle', path: 'KPZ/index.html' },
    { id: 'KUB', name: 'KUBE 93.3', path: 'KUB/index.html' },
    { id: 'LED', name: 'LED & Controllers', path: 'LED/index.html' },
    { id: 'LFR', name: 'Living Forest', path: 'LFR/index.html' },
    { id: 'LKR', name: 'Lion King Roots', path: 'LKR/index.html' },
    { id: 'LNV', name: 'Larry Niven', path: 'LNV/index.html' },
    { id: 'MAM', name: 'Mammals', path: 'MAM/index.html' },
    { id: 'MCM', name: 'Maritime Compute', path: 'MCM/index.html' },
    { id: 'MCR', name: 'Minecraft RAG', path: 'MCR/index.html' },
    { id: 'MIX', name: 'Sir Mix-A-Lot', path: 'MIX/index.html' },
    { id: 'MPC', name: 'Math Co-Proc.', path: 'MPC/index.html' },
    { id: 'NND', name: 'New New Deal', path: 'NND/index.html' },
    { id: 'NWC', name: 'Norwescon', path: 'NWC/index.html' },
    { id: 'OCN', name: 'Open Compute', path: 'OCN/index.html' },
    { id: 'OTM', name: 'Odyssey of the Mind', path: 'OTM/index.html' },
    { id: 'PGP', name: 'Garbage Patch', path: 'PGP/index.html' },
    { id: 'PJM', name: 'Pearl Jam', path: 'PJM/index.html' },
    { id: 'PMG', name: 'Pi-Mono + GSD', path: 'PMG/index.html' },
    { id: 'PSG', name: 'Pacific Spine', path: 'PSG/index.html' },
    { id: 'RBH', name: 'Radio History', path: 'RBH/index.html' },
    { id: 'ROF', name: 'Ring of Fire', path: 'ROF/index.html' },
    { id: 'SAL', name: 'Salmon Heritage', path: 'SAL/index.html' },
    { id: 'SAN', name: 'SANS Institute', path: 'SAN/index.html' },
    { id: 'SHE', name: 'Smart Home', path: 'SHE/index.html' },
    { id: 'SMF', name: 'SMOFcon', path: 'SMF/index.html' },
    { id: 'SNY', name: 'Sonic Youth', path: 'SNY/index.html' },
    { id: 'SYN', name: 'Synsor Corp', path: 'SYN/index.html' },
    { id: 'SPA', name: 'Spatial Awareness', path: 'SPA/index.html' },
    { id: 'STA', name: 'Steve Allen', path: 'STA/index.html' },
    { id: 'SYS', name: 'Systems Admin', path: 'SYS/index.html' },
    { id: 'T55', name: '555 Timer', path: 'T55/index.html' },
    { id: 'THE', name: 'Thermal Energy', path: 'THE/index.html' },
    { id: 'TSL', name: 'Tessl Review', path: 'TSL/index.html' },
    { id: 'TIBS', name: 'Animal Speak', path: 'TIBS/index.html' },
    { id: 'VAV', name: 'Voxel as Vessel', path: 'VAV/index.html' },
    { id: 'WAL', name: 'Weird Al', path: 'WAL/index.html' },
    { id: 'WCN', name: 'Westercon', path: 'WCN/index.html' },
    { id: 'WLF', name: 'The Wolf', path: 'WLF/index.html' },
    { id: 'WYR', name: 'Weyerhaeuser', path: 'WYR/index.html' },
    { id: 'WSB', name: 'Small Business', path: 'WSB/index.html' }
  ];

  // Detect current project from URL path
  var path = window.location.pathname;
  var current = '';
  projects.forEach(function(p) {
    if (path.indexOf('/' + p.id + '/') !== -1) current = p.id;
  });

  // Build series bar
  var bar = document.createElement('div');
  bar.className = 'series-bar';
  bar.innerHTML = '<a href="../index.html" class="series-home">PNW Research Series</a>' +
    projects.map(function(p) {
      var cls = p.id === current ? ' class="series-active"' : '';
      var href = current ? '../' + p.path : p.path;
      return '<a href="' + href + '"' + cls + '>' + p.name + '</a>';
    }).join('');

  // Inject styles
  var style = document.createElement('style');
  style.textContent = '.series-bar{background:var(--ink, #2a2a2a);padding:0.4rem 1.5rem;display:flex;flex-wrap:wrap;gap:0.3rem;align-items:center;font-family:system-ui,sans-serif;font-size:0.78rem}' +
    '.series-bar a{color:rgba(255,255,255,0.7);text-decoration:none;padding:0.2rem 0.6rem;border-radius:2px;transition:color 0.2s}' +
    '.series-bar a:hover{color:white;text-decoration:none}' +
    '.series-bar .series-home{color:rgba(255,255,255,0.9);font-weight:600;margin-right:0.5rem;border-right:1px solid rgba(255,255,255,0.2);padding-right:1rem}' +
    '.series-bar .series-active{color:white;background:rgba(255,255,255,0.15)}';

  document.head.appendChild(style);
  document.body.insertBefore(bar, document.body.firstChild);

  // Load fractal details script (self-similar structure at every scale)
  var fractal = document.createElement('script');
  fractal.src = (current ? '../' : '') + 'fractal.js';
  fractal.defer = true;
  document.head.appendChild(fractal);
})();
