// PNW Research Series — WebGL constellation navigator
// Replaces flat link bar with interactive cluster nav + optional WebGL graph
(function() {
  var projects = [
    { id: 'AAR', name: 'Architecture Alignment', path: 'AAR/index.html' },
    { id: 'ACC', name: 'Accounting', path: 'ACC/index.html' },
    { id: 'ACE', name: 'Compute Engine', path: 'ACE/index.html' },
    { id: 'ANM', name: '90s Animation', path: 'ANM/index.html' },
    { id: 'AGR', name: 'PNW Agriculture', path: 'AGR/index.html' },
    { id: 'AIH', name: 'AI Horizon', path: 'AIH/index.html' },
    { id: 'ARC', name: 'Shapes & Colors', path: 'ARC/index.html' },
    { id: 'ATC', name: 'Aries-Taurus Cusp', path: 'ATC/index.html' },
    { id: 'AVI', name: 'Birds', path: 'AVI/index.html' },
    { id: 'B52', name: 'The B-52s', path: 'B52/index.html' },
    { id: 'AWF', name: 'Air Water Food', path: 'AWF/index.html' },
    { id: 'ABL', name: 'Ableton Live', path: 'ABL/index.html' },
    { id: 'ABM', name: 'A Beautiful Mind', path: 'ABM/index.html' },
    { id: 'ALV', name: 'Almost Live!', path: 'ALV/index.html' },
    { id: 'AMR', name: 'AM Radio', path: 'AMR/index.html' },
    { id: 'APR', name: 'Artist Practice', path: 'APR/index.html' },
    { id: 'BCM', name: 'Building', path: 'BCM/index.html' },
    { id: 'BPS', name: 'Bio-Physics', path: 'BPS/index.html' },
    { id: 'BHK', name: 'Black Holes', path: 'BHK/index.html' },
    { id: 'BHC', name: 'Black Hole Catalog', path: 'BHC/index.html' },
    { id: 'BHM', name: 'Bellingham Market', path: 'BHM/index.html' },
    { id: 'BLA', name: 'Business Law', path: 'BLA/index.html' },
    { id: 'BMR', name: 'Bob Marley', path: 'BMR/index.html' },
    { id: 'BNY', name: 'Bill Nye', path: 'BNY/index.html' },
    { id: 'BRC', name: 'Black Rock City', path: 'BRC/index.html' },
    { id: 'C89', name: 'C89.5 FM', path: 'C89/index.html' },
    { id: 'CAS', name: 'Cascade Range', path: 'CAS/index.html' },
    { id: 'CMH', name: 'Comp. Mesh', path: 'CMH/index.html' },
    { id: 'CAR', name: 'The Cars', path: 'CAR/index.html' },
    { id: 'CBC', name: 'CBC/Radio-Canada', path: 'CBC/index.html' },
    { id: 'CCT', name: 'Comedy Central', path: 'CCT/index.html' },
    { id: 'CFU', name: 'ComfyUI', path: 'CFU/index.html' },
    { id: 'CGI', name: 'Caliber Integration', path: 'CGI/index.html' },
    { id: 'CDL', name: 'College Deep Linking', path: 'CDL/index.html' },
    { id: 'CDS', name: 'Central District', path: 'CDS/index.html' },
    { id: 'CDP', name: 'Coldplay', path: 'CDP/index.html' },
    { id: 'CHS', name: 'Chaos Sense', path: 'CHS/index.html' },
    { id: 'CNA', name: 'CN & Adult Swim', path: 'CNA/index.html' },
    { id: 'COI', name: 'Coil', path: 'COI/index.html' },
    { id: 'COK', name: 'College of Knowledge', path: 'COK/index.html' },
    { id: 'COL', name: 'Columbia Valley', path: 'COL/index.html' },
    { id: 'CRV', name: 'Corvid PNW', path: 'CRV/index.html' },
    { id: 'CRY', name: "Curren$y", path: 'CRY/index.html' },
    { id: 'CWC', name: 'Cooking with Claude', path: 'CWC/index.html' },
    { id: 'CYG', name: 'Cygnus X-3', path: 'CYG/index.html' },
    { id: 'DAA', name: 'Deep Audio', path: 'DAA/index.html' },
    { id: 'DFQ', name: 'Dead Frequencies', path: 'DFQ/index.html' },
    { id: 'DHP', name: 'DHCP Protocol', path: 'DHP/index.html' },
    { id: 'DNS', name: 'DNS Protocol', path: 'DNS/index.html' },
    { id: 'DPM', name: 'Depeche Mode', path: 'DPM/index.html' },
    { id: 'DRN', name: 'Duran Duran', path: 'DRN/index.html' },
    { id: 'DDA', name: 'dada', path: 'DDA/index.html' },
    { id: 'EAZ', name: 'East Asian Zodiac', path: 'EAZ/index.html' },
    { id: 'ECO', name: 'Living Systems', path: 'ECO/index.html' },
    { id: 'EMG', name: 'Electric Motors', path: 'EMG/index.html' },
    { id: 'ENB', name: 'Eskimo North BBS', path: 'ENB/index.html' },
    { id: 'FCC', name: 'FCC Catalog', path: 'FCC/index.html' },
    { id: 'FDR', name: 'Fire Dragon', path: 'FDR/index.html' },
    { id: 'FEC', name: 'Error Correction', path: 'FEC/index.html' },
    { id: 'FEG', name: 'FoxEdu Gap-Fill', path: 'FEG/index.html' },
    { id: 'FFA', name: 'Fur & Feathers', path: 'FFA/index.html' },
    { id: 'FLS', name: 'FL Studio', path: 'FLS/index.html' },
    { id: 'FQC', name: 'Freq. Continuum', path: 'FQC/index.html' },
    { id: 'GDN', name: 'Gardening', path: 'GDN/index.html' },
    { id: 'GGT', name: 'Geggy Tah', path: 'GGT/index.html' },
    { id: 'GTP', name: 'Geggy Tah Prod.', path: 'GTP/index.html' },
    { id: 'GRB', name: 'GRB 230906A', path: 'GRB/index.html' },
    { id: 'GRD', name: 'Gradient Engine', path: 'GRD/index.html' },
    { id: 'GSA', name: 'GSD Alignment', path: 'GSA/index.html' },
    { id: 'GPG', name: 'GPU Ecosystem', path: 'GPG/index.html' },
    { id: 'GPO', name: 'GPU Orchestration', path: 'GPO/index.html' },
    { id: 'GRG', name: 'Gorge Amphitheatre', path: 'GRG/index.html' },
    { id: 'GRV', name: 'Green River', path: 'GRV/index.html' },
    { id: 'GSD2', name: 'GSD-2 Arch.', path: 'GSD2/index.html' },
    { id: 'HFE', name: 'Audio Engineering', path: 'HFE/index.html' },
    { id: 'HFR', name: 'Hi-Fi Audio', path: 'HFR/index.html' },
    { id: 'HEN', name: 'Jim Henson', path: 'HEN/index.html' },
    { id: 'HGE', name: 'Hydro-Geothermal', path: 'HGE/index.html' },
    { id: 'HJX', name: 'Hendrix & Joplin', path: 'HJX/index.html' },
    { id: 'IBC', name: 'Indigenous Broadcasting', path: 'IBC/index.html' },
    { id: 'ICS', name: 'Construction Set', path: 'ICS/index.html' },
    { id: 'INP', name: 'Ink & Paint', path: 'INP/index.html' },
    { id: 'JNS', name: 'JanSport', path: 'JNS/index.html' },
    { id: 'K8S', name: 'Kubernetes', path: 'K8S/index.html' },
    { id: 'KFU', name: 'Mind-Body Practice', path: 'KFU/index.html' },
    { id: 'KGX', name: "King's X", path: 'KGX/index.html' },
    { id: 'KSM', name: 'KISM 92.9', path: 'KSM/index.html' },
    { id: 'KPZ', name: 'KPLZ Seattle', path: 'KPZ/index.html' },
    { id: 'KUB', name: 'KUBE 93.3', path: 'KUB/index.html' },
    { id: 'LED', name: 'LED & Controllers', path: 'LED/index.html' },
    { id: 'LFR', name: 'Living Forest', path: 'LFR/index.html' },
    { id: 'LKR', name: 'Lion King Roots', path: 'LKR/index.html' },
    { id: 'LGW', name: 'LIGO Waves', path: 'LGW/index.html' },
    { id: 'LLM', name: 'Local LLM', path: 'LLM/index.html' },
    { id: 'LNT', name: 'Late Night TV', path: 'LNT/index.html' },
    { id: 'LNV', name: 'Larry Niven', path: 'LNV/index.html' },
    { id: 'LTS', name: 'Listening to Space', path: 'LTS/index.html' },
    { id: 'M05', name: 'Module Split', path: 'M05/index.html' },
    { id: 'MAM', name: 'Mammals', path: 'MAM/index.html' },
    { id: 'MCM', name: 'Maritime Compute', path: 'MCM/index.html' },
    { id: 'MCF', name: 'Multi-Cluster Fed.', path: 'MCF/index.html' },
    { id: 'MCS', name: 'Maritime Costs', path: 'MCS/index.html' },
    { id: 'MCR', name: 'Minecraft RAG', path: 'MCR/index.html' },
    { id: 'MDS', name: 'Markup & Data', path: 'MDS/index.html' },
    { id: 'MGU', name: 'Module Governance', path: 'MGU/index.html' },
    { id: 'MRW', name: 'MC Weather', path: 'MRW/index.html' },
    { id: 'MST', name: 'Mesh Telescope', path: 'MST/index.html' },
    { id: 'MTB', name: 'Moontribe', path: 'MTB/index.html' },
    { id: 'MWC', name: 'Millwork Co-op', path: 'MWC/index.html' },
    { id: 'MIX', name: 'Sir Mix-A-Lot', path: 'MIX/index.html' },
    { id: 'MPC', name: 'Math Co-Proc.', path: 'MPC/index.html' },
    { id: 'NND', name: 'New New Deal', path: 'NND/index.html' },
    { id: 'NEH', name: 'NeHe OpenGL', path: 'NEH/index.html' },
    { id: 'NWC', name: 'Norwescon', path: 'NWC/index.html' },
    { id: 'NWZ', name: 'Non-Western Zodiac', path: 'NWZ/index.html' },
    { id: 'OCN', name: 'Open Compute', path: 'OCN/index.html' },
    { id: 'OCT', name: 'OctaMED & Trackers', path: 'OCT/index.html' },
    { id: 'OPS', name: 'OpenStack Cloud', path: 'OPS/index.html' },
    { id: 'OSC', name: 'Orson Scott Card', path: 'OSC/index.html' },
    { id: 'OTM', name: 'Odyssey of the Mind', path: 'OTM/index.html' },
    { id: 'PGP', name: 'Garbage Patch', path: 'PGP/index.html' },
    { id: 'PKD', name: 'Philip K. Dick', path: 'PKD/index.html' },
    { id: 'PJM', name: 'Pearl Jam', path: 'PJM/index.html' },
    { id: 'PLT', name: 'PNW Planting', path: 'PLT/index.html' },
    { id: 'PTG', name: 'Paper That Grows', path: 'PTG/index.html' },
    { id: 'PIN', name: 'Post-Industrial', path: 'PIN/index.html' },
    { id: 'PMG', name: 'Pi-Mono + GSD', path: 'PMG/index.html' },
    { id: 'PNP', name: 'Ports & Pipes', path: 'PNP/index.html' },
    { id: 'PPM', name: 'Pike Place Market', path: 'PPM/index.html' },
    { id: 'PRS', name: 'Polyrhythm Standard', path: 'PRS/index.html' },
    { id: 'PSG', name: 'Pacific Spine', path: 'PSG/index.html' },
    { id: 'PSS', name: 'PNW Signal Stack', path: 'PSS/index.html' },
    { id: 'RBH', name: 'Radio History', path: 'RBH/index.html' },
    { id: 'RFC', name: 'RFC Archive', path: 'RFC/index.html' },
    { id: 'RLS', name: 'Resonant Lands', path: 'RLS/index.html' },
    { id: 'ROF', name: 'Ring of Fire', path: 'ROF/index.html' },
    { id: 'SAL', name: 'Salmon Heritage', path: 'SAL/index.html' },
    { id: 'SCR', name: 'Source Code Review', path: 'SCR/index.html' },
    { id: 'SET', name: 'SETI', path: 'SET/index.html' },
    { id: 'SFC', name: 'Silicon Forest', path: 'SFC/index.html' },
    { id: 'SFH', name: 'SF House Music', path: 'SFH/index.html' },
    { id: 'SGL', name: 'Signal & Light', path: 'SGL/index.html' },
    { id: 'SGM', name: 'Sacred Geometry', path: 'SGM/index.html' },
    { id: 'SAN', name: 'SANS Institute', path: 'SAN/index.html' },
    { id: 'SMB', name: 'SMBH Growth', path: 'SMB/index.html' },
    { id: 'SNX', name: 'Saturday Night Live', path: 'SNX/index.html' },
    { id: 'SRD', name: 'SSH & RDP', path: 'SRD/index.html' },
    { id: 'SRG', name: 'Susan Rogers', path: 'SRG/index.html' },
    { id: 'SSM', name: 'Street Music', path: 'SSM/index.html' },
    { id: 'SST', name: 'States & Tape', path: 'SST/index.html' },
    { id: 'STE', name: 'Storage Forensics', path: 'STE/index.html' },
    { id: 'SVB', name: 'Student Voice', path: 'SVB/index.html' },
    { id: 'SHE', name: 'Smart Home', path: 'SHE/index.html' },
    { id: 'SMF', name: 'SMOFcon', path: 'SMF/index.html' },
    { id: 'SMP', name: 'Smashing Pumpkins', path: 'SMP/index.html' },
    { id: 'SNL', name: 'Sensing Layer', path: 'SNL/index.html' },
    { id: 'SNY', name: 'Sonic Youth', path: 'SNY/index.html' },
    { id: 'SOC', name: 'Strait Out of Compton', path: 'SOC/index.html' },
    { id: 'SYN', name: 'Synsor Corp', path: 'SYN/index.html' },
    { id: 'SPA', name: 'Spatial Awareness', path: 'SPA/index.html' },
    { id: 'STA', name: 'Steve Allen', path: 'STA/index.html' },
    { id: 'SYS', name: 'Systems Admin', path: 'SYS/index.html' },
    { id: 'T55', name: '555 Timer', path: 'T55/index.html' },
    { id: 'TCP', name: 'TCP/IP Protocol', path: 'TCP/index.html' },
    { id: 'THE', name: 'Thermal Energy', path: 'THE/index.html' },
    { id: 'TSL', name: 'Tessl Review', path: 'TSL/index.html' },
    { id: 'TIBS', name: 'Animal Speak', path: 'TIBS/index.html' },
    { id: 'TKH', name: 'Talking Heads', path: 'TKH/index.html' },
    { id: 'TVH', name: 'Television Era', path: 'TVH/index.html' },
    { id: 'VAV', name: 'Voxel as Vessel', path: 'VAV/index.html' },
    { id: 'VKD', name: 'Vulkan Desktop', path: 'VKD/index.html' },
    { id: 'VKS', name: 'Vulkan Screensaver', path: 'VKS/index.html' },
    { id: 'WAL', name: 'Weird Al', path: 'WAL/index.html' },
    { id: 'WCN', name: 'Westercon', path: 'WCN/index.html' },
    { id: 'WPH', name: 'Weekly Phone', path: 'WPH/index.html' },
    { id: 'WLF', name: 'The Wolf', path: 'WLF/index.html' },
    { id: 'WYR', name: 'Weyerhaeuser', path: 'WYR/index.html' },
    { id: 'WSB', name: 'Small Business', path: 'WSB/index.html' },
    { id: 'YNT', name: "Yuri's Night", path: 'YNT/index.html' }
  ];

  var clusters = [
    { name: 'Ecology', color: '#4CAF50', ids: ['COL','CAS','ECO','GDN','AVI','MAM','AWF','SAL','CRV','PLT','AGR','LFR','PPM','BHM','SSM','CDS','SFC','MWC'] },
    { name: 'Electronics', color: '#FFB300', ids: ['SHE','LED','T55','EMG','BPS','PSS','SNL','HFR','HFE','FEC'] },
    { name: 'Infrastructure', color: '#78909C', ids: ['SYS','CMH','GSD2','MPC','VAV','OCN','K8S','MCM','PMG','ACE','MCF','MCS','STE','WPH','MRW','GPO','GPG','PIN','SRD','MDS','SCR','DHP','DNS','TCP','PNP','RFC','ENB'] },
    { name: 'Energy', color: '#FF7043', ids: ['THE','HGE','NND'] },
    { name: 'Creative', color: '#EC407A', ids: ['FFA','ARC','TIBS','STA','BRC','DAA','HEN','ANM','INP','MTB','APR','EAZ','NWZ','KFU','CWC'] },
    { name: 'Business', color: '#42A5F5', ids: ['ACC','WSB','BCM','BLA','FCC'] },
    { name: 'Vision', color: '#AB47BC', ids: ['ROF','SPA','NWC','SMF','WCN','OTM'] },
    { name: 'Broadcasting', color: '#26A69A', ids: ['RBH','KPZ','KSM','KUB','WLF','C89','MIX','SGL','CBC','IBC','SVB','DFQ','AMR','TVH','ALV','SNX','LNT','CCT','CNA'] },
    { name: 'Science', color: '#5C6BC0', ids: ['BHK','LGW','SET','SGM','BNY','ABM','CHS'] },
    { name: 'Music', color: '#EF5350', ids: ['WAL','DDA','GRV','PJM','SNY','COI','GGT','GTP','CDP','KGX','HJX','B52','CAR','TKH','DPM','DRN','SMP','BMR','SOC','CRY','SRG','PRS','ABL','FLS','OCT','SFH','GRG'] },
    { name: 'Space', color: '#1E88E5', ids: ['CYG','SMB','GRB','BHC','LTS','YNT','MST'] },
    { name: 'AI', color: '#7E57C2', ids: ['SST','CFU','LLM','AIH','AAR'] },
    { name: 'Graphics', color: '#8E24AA', ids: ['NEH','VKD','VKS'] }
  ];

  // Unclustered projects get assigned
  var clustered = {};
  clusters.forEach(function(c) { c.ids.forEach(function(id) { clustered[id] = c; }); });
  var unclustered = projects.filter(function(p) { return !clustered[p.id]; });
  if (unclustered.length) {
    // Assign stragglers to nearest match or create misc
    unclustered.forEach(function(p) { clustered[p.id] = clusters[0]; clusters[0].ids.push(p.id); });
  }

  // Detect current project
  var loc = window.location.pathname;
  var current = '';
  projects.forEach(function(p) { if (loc.indexOf('/' + p.id + '/') !== -1) current = p.id; });
  var currentCluster = current ? clustered[current] : null;

  // Project map
  var pm = {};
  projects.forEach(function(p) { pm[p.id] = p; });

  // --- Build DOM ---
  var el = document.createElement('div');
  el.className = 'sn';
  var h = '';

  // Row 1: brand + search
  h += '<div class="sn-bar">';
  h += '<a href="../index.html" class="sn-brand">PNW Research Series</a>';
  h += '<div class="sn-pills">';
  clusters.forEach(function(c,i) {
    var act = currentCluster && c.name === currentCluster.name ? ' sn-on' : '';
    h += '<button class="sn-p' + act + '" data-i="' + i + '" style="--c:' + c.color + '">' + c.name + '</button>';
  });
  h += '</div>';
  h += '<input type="text" class="sn-q" placeholder="Search ' + projects.length + ' projects...">';
  h += '</div>';

  // Dropdown
  h += '<div class="sn-drop"></div>';

  el.innerHTML = h;

  // Styles
  var css = document.createElement('style');
  css.textContent = [
    '.sn{font-family:system-ui,sans-serif;background:#111827;position:relative;z-index:9999;font-size:13px}',
    '.sn-bar{display:flex;align-items:center;padding:6px 16px;gap:8px;flex-wrap:wrap}',
    '.sn-brand{color:#fff;font-weight:700;text-decoration:none;font-size:14px;white-space:nowrap;flex-shrink:0}',
    '.sn-brand:hover{color:#93C5FD}',
    '.sn-pills{display:flex;gap:4px;flex-wrap:wrap;flex:1;min-width:0}',
    '.sn-p{all:unset;cursor:pointer;padding:2px 8px;border-radius:3px;font-size:11px;color:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.08);transition:all .15s;white-space:nowrap}',
    '.sn-p:hover{color:#fff;border-color:var(--c);background:rgba(255,255,255,.05)}',
    '.sn-p.sn-on{color:#fff;background:var(--c);border-color:var(--c)}',
    '.sn-q{all:unset;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:4px;padding:3px 10px;color:#fff;font-size:12px;width:160px;transition:all .2s;flex-shrink:0}',
    '.sn-q:focus{border-color:rgba(255,255,255,.3);width:220px;background:rgba(255,255,255,.1)}',
    '.sn-q::placeholder{color:rgba(255,255,255,.25)}',
    '.sn-drop{display:none;background:#1F2937;border-top:1px solid rgba(255,255,255,.06);padding:6px 16px;max-height:200px;overflow-y:auto}',
    '.sn-drop.sn-open{display:flex;flex-wrap:wrap;gap:4px;align-items:center}',
    '.sn-drop .sn-tag{color:var(--c);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:3px 0;width:100%}',
    '.sn-drop a{color:rgba(255,255,255,.65);text-decoration:none;padding:2px 8px;border-radius:3px;font-size:12px;transition:all .12s}',
    '.sn-drop a:hover{color:#fff;background:rgba(255,255,255,.08)}',
    '.sn-drop a.sn-cur{color:#fff;background:rgba(255,255,255,.12);font-weight:600}',
    '.sn-drop .sn-empty{color:rgba(255,255,255,.25);font-style:italic;padding:8px 0}',
    '@media(max-width:640px){.sn-q{width:100%;order:10}.sn-pills{order:9}}'
  ].join('\n');

  document.head.appendChild(css);
  document.body.insertBefore(el, document.body.firstChild);

  // --- Interactions ---
  var drop = el.querySelector('.sn-drop');
  var pills = el.querySelectorAll('.sn-p');
  var qInput = el.querySelector('.sn-q');
  var openIdx = currentCluster ? clusters.indexOf(currentCluster) : -1;

  function renderCluster(idx) {
    var c = clusters[idx];
    var out = '<div class="sn-tag" style="--c:' + c.color + '">' + c.name + ' \u2014 ' + c.ids.length + ' projects</div>';
    c.ids.forEach(function(id) {
      var p = pm[id]; if (!p) return;
      var href = current ? '../' + p.path : p.path;
      out += '<a href="' + href + '"' + (id === current ? ' class="sn-cur"' : '') + '>' + p.name + '</a>';
    });
    drop.innerHTML = out;
    drop.classList.add('sn-open');
  }

  function renderSearch(q) {
    var matches = projects.filter(function(p) {
      return p.name.toLowerCase().indexOf(q) !== -1 || p.id.toLowerCase().indexOf(q) !== -1;
    });
    if (!matches.length) {
      drop.innerHTML = '<div class="sn-empty">No match for \u201c' + q.replace(/</g,'&lt;') + '\u201d</div>';
    } else {
      drop.innerHTML = matches.slice(0, 24).map(function(p) {
        var href = current ? '../' + p.path : p.path;
        var c = clustered[p.id];
        return '<a href="' + href + '" style="--c:' + (c ? c.color : '#999') + '">' + p.name + '</a>';
      }).join('');
    }
    drop.classList.add('sn-open');
  }

  if (openIdx >= 0) renderCluster(openIdx);

  pills.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var i = parseInt(this.dataset.i);
      qInput.value = '';
      if (openIdx === i) { drop.classList.remove('sn-open'); openIdx = -1; pills.forEach(function(b){b.classList.remove('sn-on');}); return; }
      openIdx = i;
      pills.forEach(function(b){b.classList.remove('sn-on');});
      this.classList.add('sn-on');
      renderCluster(i);
    });
  });

  qInput.addEventListener('input', function() {
    var q = this.value.toLowerCase().trim();
    if (!q) { drop.classList.remove('sn-open'); if (openIdx >= 0) renderCluster(openIdx); return; }
    pills.forEach(function(b){b.classList.remove('sn-on');});
    openIdx = -1;
    renderSearch(q);
  });

  qInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { this.value = ''; drop.classList.remove('sn-open'); }
  });
})();
