// PNW Research Series — shared navigation bar
// Injected into all sub-project HTML files
(function() {
  var projects = [
    { id: 'ACC', name: 'Accounting', path: 'ACC/index.html' },
    { id: 'ARC', name: 'Shapes & Colors', path: 'ARC/index.html' },
    { id: 'AVI', name: 'Birds', path: 'AVI/index.html' },
    { id: 'AWF', name: 'Air Water Food', path: 'AWF/index.html' },
    { id: 'BCM', name: 'Building', path: 'BCM/index.html' },
    { id: 'BPS', name: 'Bio-Physics', path: 'BPS/index.html' },
    { id: 'BRC', name: 'Black Rock City', path: 'BRC/index.html' },
    { id: 'CAS', name: 'Cascade Range', path: 'CAS/index.html' },
    { id: 'CMH', name: 'Comp. Mesh', path: 'CMH/index.html' },
    { id: 'COL', name: 'Columbia Valley', path: 'COL/index.html' },
    { id: 'DAA', name: 'Deep Audio', path: 'DAA/index.html' },
    { id: 'DDA', name: 'dada', path: 'DDA/index.html' },
    { id: 'ECO', name: 'Living Systems', path: 'ECO/index.html' },
    { id: 'EMG', name: 'Electric Motors', path: 'EMG/index.html' },
    { id: 'FFA', name: 'Fur & Feathers', path: 'FFA/index.html' },
    { id: 'GDN', name: 'Gardening', path: 'GDN/index.html' },
    { id: 'GRD', name: 'Gradient Engine', path: 'GRD/index.html' },
    { id: 'GRV', name: 'Green River', path: 'GRV/index.html' },
    { id: 'GSD2', name: 'GSD-2 Arch.', path: 'GSD2/index.html' },
    { id: 'HGE', name: 'Hydro-Geothermal', path: 'HGE/index.html' },
    { id: 'LED', name: 'LED & Controllers', path: 'LED/index.html' },
    { id: 'MAM', name: 'Mammals', path: 'MAM/index.html' },
    { id: 'MCR', name: 'Minecraft RAG', path: 'MCR/index.html' },
    { id: 'MPC', name: 'Math Co-Proc.', path: 'MPC/index.html' },
    { id: 'NND', name: 'New New Deal', path: 'NND/index.html' },
    { id: 'OCN', name: 'Open Compute', path: 'OCN/index.html' },
    { id: 'ROF', name: 'Ring of Fire', path: 'ROF/index.html' },
    { id: 'SAL', name: 'Salmon Heritage', path: 'SAL/index.html' },
    { id: 'SHE', name: 'Smart Home', path: 'SHE/index.html' },
    { id: 'SPA', name: 'Spatial Awareness', path: 'SPA/index.html' },
    { id: 'STA', name: 'Steve Allen', path: 'STA/index.html' },
    { id: 'SYS', name: 'Systems Admin', path: 'SYS/index.html' },
    { id: 'T55', name: '555 Timer', path: 'T55/index.html' },
    { id: 'THE', name: 'Thermal Energy', path: 'THE/index.html' },
    { id: 'TIBS', name: 'Animal Speak', path: 'TIBS/index.html' },
    { id: 'VAV', name: 'Voxel as Vessel', path: 'VAV/index.html' },
    { id: 'WAL', name: 'Weird Al', path: 'WAL/index.html' },
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
})();
