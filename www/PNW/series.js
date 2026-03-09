// PNW Research Series — shared navigation bar
// Injected into all sub-project HTML files
(function() {
  var projects = [
    { id: 'COL', name: 'Columbia Valley', path: 'COL/index.html' },
    { id: 'CAS', name: 'Cascade Range', path: 'CAS/index.html' },
    { id: 'ECO', name: 'Living Systems', path: 'ECO/index.html' },
    { id: 'GDN', name: 'Gardening', path: 'GDN/index.html' },
    { id: 'BCM', name: 'Building', path: 'BCM/index.html' },
    { id: 'SHE', name: 'Smart Home', path: 'SHE/index.html' },
    { id: 'AVI', name: 'Birds', path: 'AVI/index.html' },
    { id: 'MAM', name: 'Mammals', path: 'MAM/index.html' },
    { id: 'BPS', name: 'Bio-Physics', path: 'BPS/index.html' },
    { id: 'FFA', name: 'Fur & Feathers', path: 'FFA/index.html' }
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
  style.textContent = '.series-bar{background:#1a2a1f;padding:0.4rem 1.5rem;display:flex;flex-wrap:wrap;gap:0.3rem;align-items:center;font-family:system-ui,sans-serif;font-size:0.78rem}' +
    '.series-bar a{color:rgba(255,255,255,0.7);text-decoration:none;padding:0.2rem 0.6rem;border-radius:2px;transition:color 0.2s}' +
    '.series-bar a:hover{color:white;text-decoration:none}' +
    '.series-bar .series-home{color:rgba(255,255,255,0.9);font-weight:600;margin-right:0.5rem;border-right:1px solid rgba(255,255,255,0.2);padding-right:1rem}' +
    '.series-bar .series-active{color:white;background:rgba(255,255,255,0.15)}';

  document.head.appendChild(style);
  document.body.insertBefore(bar, document.body.firstChild);
})();
