// ═══════════════════════════════════════════════════════════════
// FRACTAL DETAILS — self-similar structure at every scale
// ═══════════════════════════════════════════════════════════════
//
// Inject this script into any Research project page to add:
//   1. Compass position badge (theta, r, cluster, nearest muse)
//   2. Connected trails (neighbor projects by proximity & cluster)
//   3. Rosetta thread (how key concepts translate across domains)
//   4. Navigation links back to Center Camp & Compass
//
// Usage: <script src="../fractal.js" defer></script>
// Detects project ID from URL path automatically.
//
// Author: The Muses — Cedar (data), Raven (connections), Foxy (cartography)
// ═══════════════════════════════════════════════════════════════

(function() {
  'use strict';

  // ── Muse Positions (from muse-ecosystem.chipset.yaml) ──
  var MUSES = [
    { id: 'cedar',      name: 'Cedar',      role: 'the record',       theta: 0,  r: 0.95, sig: 'the record shows' },
    { id: 'lex',        name: 'Lex',        role: 'the specification', theta: 5,  r: 0.90, sig: 'measure twice' },
    { id: 'moss',       name: 'Moss',       role: 'the carpet',       theta: 6,  r: 0.58, sig: 'I ask nothing but moisture and time' },
    { id: 'lichen',     name: 'Lichen',     role: 'the breath',       theta: 8,  r: 0.60, sig: 'I am three, and we breathe for you' },
    { id: 'sturgeon',   name: 'Sturgeon',   role: 'the ancient',      theta: 9,  r: 0.68, sig: 'I keep the river\'s deepest memory' },
    { id: 'fern',       name: 'Fern',       role: 'the foundation',   theta: 10, r: 0.65, sig: 'I was here before the trees' },
    { id: 'chanterelle',name: 'Chanterelle', role: 'the network',     theta: 12, r: 0.72, sig: 'what you can\'t see is doing the most work' },
    { id: 'star',       name: 'Star',       role: 'the keystone',     theta: 14, r: 0.64, sig: 'remove me and the whole world changes' },
    { id: 'crab',       name: 'Crab',       role: 'the harvest',      theta: 15, r: 0.62, sig: 'the ocean feeds those who tend it' },
    { id: 'beaver',     name: 'Beaver',     role: 'the maker',        theta: 16, r: 0.78, sig: 'let me show you how it works' },
    { id: 'salamander', name: 'Salamander', role: 'the headwater',    theta: 18, r: 0.66, sig: 'I live where nothing else can reach' },
    { id: 'hemlock',    name: 'Hemlock',    role: 'the standard',     theta: 20, r: 0.85, sig: 'the standard holds' },
    { id: 'fire',       name: 'Fire',       role: 'the renewal',      theta: 22, r: 0.72, sig: 'the forest still calls my name' },
    { id: 'cougar',     name: 'Cougar',     role: 'the ghost',        theta: 23, r: 0.76, sig: 'you know I am here because the deer are afraid' },
    { id: 'wolf',       name: 'Wolf',       role: 'the return',       theta: 24, r: 0.80, sig: 'I teach the patience of reestablishment' },
    { id: 'rain',       name: 'Rain',       role: 'the cycle',        theta: 25, r: 0.64, sig: 'nine months of me made everything you see' },
    { id: 'fog',        name: 'Fog',        role: 'the invisible',    theta: 26, r: 0.62, sig: 'I am the rain between the rains' },
    { id: 'bear',       name: 'Bear',       role: 'the season',       theta: 28, r: 0.78, sig: 'I walk between ice and forest, between seasons' },
    { id: 'waterfall',  name: 'Waterfall',  role: 'the descent',      theta: 29, r: 0.66, sig: 'I create worlds in my mist' },
    { id: 'foxy',       name: 'Foxy',       role: 'the map',          theta: 30, r: 0.75, sig: 'maps and stories' },
    { id: 'sitka',      name: 'Sitka',      role: 'the root',         theta: 32, r: 0.82, sig: 'stay — the place will speak through you' },
    { id: 'eulachon',   name: 'Eulachon',   role: 'the first gift',   theta: 34, r: 0.68, sig: 'I arrive before everything else' },
    { id: 'steelhead',  name: 'Steelhead',  role: 'the twice-born',   theta: 33, r: 0.66, sig: 'I spawn and survive to spawn again' },
    { id: 'dipper',     name: 'Dipper',     role: 'the water-walker', theta: 34, r: 0.65, sig: 'I dive into currents and read what flows beneath' },
    { id: 'chinook',    name: 'Chinook',    role: 'the current',      theta: 35, r: 0.70, sig: 'follow the water' },
    { id: 'orca',       name: 'Orca',       role: 'the elder',        theta: 38, r: 0.85, sig: 'I have been listening longer than you have been speaking' },
    { id: 'sam',        name: 'Sam',        role: 'the question',     theta: 40, r: 0.60, sig: 'what if we tried' },
    { id: 'coyote',     name: 'Coyote',     role: 'the trickster',    theta: 42, r: 0.68, sig: 'the garbage becomes the feast' },
    { id: 'dragonfly',  name: 'Dragonfly',  role: 'the iridescent',   theta: 43, r: 0.62, sig: 'I hunt in air and water both' },
    { id: 'octopus',    name: 'Octopus',    role: 'the reinventor',   theta: 44, r: 0.74, sig: 'I think with eight arms' },
    { id: 'willow',     name: 'Willow',     role: 'the welcome',      theta: 45, r: 1.00, sig: 'come as you are' },
    { id: 'bee',        name: 'Bee',        role: 'the pollinator',   theta: 47, r: 0.66, sig: 'I carry the pollen between worlds' },
    { id: 'otter',      name: 'Otter',      role: 'the play',         theta: 48, r: 0.72, sig: 'play is work and work is play' },
    { id: 'hawk',       name: 'Hawk',       role: 'the formation',    theta: 50, r: 0.80, sig: 'I see where everyone is' },
    { id: 'eagle',      name: 'Eagle',      role: 'the guardian',     theta: 52, r: 0.82, sig: 'I hold the heights and read the wind' },
    { id: 'madrone',    name: 'Madrone',     role: 'the hearth',      theta: 53, r: 0.65, sig: 'the fire was already here' },
    { id: 'owl',        name: 'Owl',        role: 'the clock',        theta: 55, r: 0.80, sig: 'there is time' },
    { id: 'marten',     name: 'Marten',     role: 'the signal',       theta: 56, r: 0.68, sig: 'the signal is still here' },
    { id: 'bat',        name: 'Bat',        role: 'the echolocator',  theta: 57, r: 0.66, sig: 'I see with sound what eyes cannot find' },
    { id: 'raven',      name: 'Raven',      role: 'the pattern',      theta: 60, r: 0.70, sig: 'I have seen this before' },
    { id: 'thrush',     name: 'Thrush',     role: 'the tone',         theta: 62, r: 0.66, sig: 'one sustained note holds the whole forest still' },
    { id: 'nutcracker', name: 'Nutcracker', role: 'the cache',        theta: 64, r: 0.68, sig: 'my forgotten stores become forests' },
    { id: 'wren',       name: 'Wren',       role: 'the song',         theta: 65, r: 0.68, sig: 'I don\'t need to be loud — I need to be precise' },
    { id: 'kelp',       name: 'Kelp',       role: 'the tide forest',  theta: 68, r: 0.72, sig: 'I grow two feet a day and die in a season' },
    { id: 'alder',      name: 'Alder',      role: 'the resonance',    theta: 70, r: 0.75, sig: 'the wood remembers the forest' },
    { id: 'osprey',     name: 'Osprey',     role: 'the horizon',      theta: 78, r: 0.80, sig: 'I can see it from here' },
    { id: 'pika',       name: 'Pika',       role: 'the sentinel',     theta: 80, r: 0.55, sig: 'the world is warming and I am the first to know' },
    { id: 'glacier',    name: 'Glacier',    role: 'the archive',      theta: 82, r: 0.70, sig: 'I remember what rain forgets' }
  ];

  // ── Cluster Definitions ──
  var CLUSTERS = {
    ecology:        { name: 'PNW Ecology',           color: '#4a7c3f' },
    electronics:    { name: 'Electronics',            color: '#d4881a' },
    infrastructure: { name: 'Infrastructure',         color: '#2a8a96' },
    energy:         { name: 'Energy & Environment',   color: '#c75b3a' },
    creative:       { name: 'Creative & Cultural',    color: '#9b59b6' },
    business:       { name: 'Business & Regulatory',  color: '#7a8a8a' },
    vision:         { name: 'Infrastructure Vision',  color: '#d4a017' },
    music:          { name: 'Music & Sound',          color: '#e074a8' },
    radio:          { name: 'Radio & Broadcast',      color: '#a07ae0' },
    community:      { name: 'Community & Convention', color: '#e0a07a' },
    science:        { name: 'Science & Fiction',      color: '#5eb8c4' }
  };

  // ── All 75 Projects (compact: id, name, theta, r, cluster) ──
  var PROJECTS = [
    // Ecology
    ['COL','Columbia Valley Rainforest',34,0.88,'ecology'],
    ['CAS','Cascade Range',26,0.82,'ecology'],
    ['ECO','Living Systems',30,0.88,'ecology'],
    ['GDN','Gardening',38,0.78,'ecology'],
    ['AVI','Wings of the PNW',36,0.90,'ecology'],
    ['MAM','Fur, Fin & Fang',33,0.85,'ecology'],
    ['SAL','Salmon Heritage',35,0.78,'ecology'],
    ['CRV','Corvid Intelligence',42,0.76,'ecology'],
    ['AGR','PNW Agriculture',32,0.72,'ecology'],
    ['LFR','The Living Forest',28,0.82,'ecology'],
    ['WYR','Weyerhaeuser',25,0.74,'ecology'],
    ['AWF','Clean Air, Water & Food',30,0.72,'ecology'],
    ['PGP','Pacific Garbage Patch',28,0.68,'ecology'],
    // Electronics
    ['LED','LED & Controllers',16,0.82,'electronics'],
    ['SHE','Smart Home & DIY Electronics',20,0.82,'electronics'],
    ['T55','555 Timer',12,0.66,'electronics'],
    ['EMG','Electric Motors & Generators',18,0.68,'electronics'],
    ['BPS','Bio-Physics Sensing',24,0.88,'electronics'],
    // Infrastructure
    ['SYS','Systems Administration',4,0.86,'infrastructure'],
    ['K8S','Kubernetes Ecosystem',6,0.74,'infrastructure'],
    ['CMH','Computational Mesh',15,0.72,'infrastructure'],
    ['GSD2','GSD-2 Architecture',8,0.72,'infrastructure'],
    ['MPC','Math Co-Processor',3,0.80,'infrastructure'],
    ['OCN','Open Compute',10,0.72,'infrastructure'],
    ['VAV','Voxel as Vessel',14,0.86,'infrastructure'],
    ['PMG','Pi-Mono + GSD',8,0.66,'infrastructure'],
    ['SAN','SANS Institute',7,0.76,'infrastructure'],
    ['SYN','Synsor Corp',12,0.72,'infrastructure'],
    ['TSL','Tessl Review',10,0.62,'infrastructure'],
    ['MCM','Maritime Compute',18,0.76,'infrastructure'],
    // Energy
    ['THE','Thermal & Hydrogen Energy',20,0.78,'energy'],
    ['HGE','Hydro-Geothermal Energy',22,0.72,'energy'],
    ['ROF','Ring of Fire',25,0.72,'energy'],
    // Creative
    ['FFA','Fur, Feathers & Animation',48,0.82,'creative'],
    ['TIBS','Animal Speak',56,0.82,'creative'],
    ['ARC','Shapes & Colors',46,0.66,'creative'],
    ['BRC','Black Rock City',54,0.88,'creative'],
    ['DAA','Deep Audio Analysis',44,0.72,'creative'],
    ['SPA','Spatial Awareness',42,0.72,'creative'],
    ['FDR','Year of the Fire Dragon',62,0.72,'creative'],
    ['ATC','Aries-Taurus Cusp',64,0.66,'creative'],
    ['LKR','Lion King Roots',58,0.74,'creative'],
    ['WAL','Weird Al Yankovic',52,0.82,'creative'],
    ['STA','Steve Allen',50,0.76,'creative'],
    ['MCR','Minecraft RAG',40,0.72,'creative'],
    ['GRD','Gradient Engine',18,0.72,'creative'],
    // Business
    ['BCM','Building Construction',22,0.82,'business'],
    ['ACC','Accounting',6,0.58,'business'],
    ['WSB','Small Business',38,0.58,'business'],
    ['BLA','Business Law',10,0.58,'business'],
    // Vision
    ['NND','New New Deal',28,0.76,'vision'],
    ['PSG','Pacific Spine',24,0.78,'vision'],
    // Music
    ['GRV','Green River & the Seattle Sound',62,0.78,'music'],
    ['PJM','Pearl Jam',64,0.82,'music'],
    ['SNY','Sonic Youth',68,0.78,'music'],
    ['MIX','Sir Mix-A-Lot',60,0.72,'music'],
    ['GGT','Geggy Tah',66,0.72,'music'],
    ['GTP','Geggy Tah Production',65,0.66,'music'],
    ['KGX',"King's X",68,0.72,'music'],
    ['CDP','Coldplay',58,0.72,'music'],
    ['COI','Coil',72,0.74,'music'],
    ['DDA','dada',66,0.68,'music'],
    ['FQC','Frequency Continuum',50,0.78,'music'],
    // Radio
    ['C89','C89.5 FM',54,0.68,'radio'],
    ['KUB','KUBE 93.3',58,0.68,'radio'],
    ['KSM','KISM 92.9',55,0.62,'radio'],
    ['KPZ','KPLZ Seattle',56,0.62,'radio'],
    ['WLF','100.7 The Wolf',56,0.62,'radio'],
    ['RBH','Radio Broadcast History',52,0.74,'radio'],
    // Community
    ['NWC','Norwescon',54,0.72,'community'],
    ['WCN','Westercon',52,0.68,'community'],
    ['SMF','SMOFcon',56,0.66,'community'],
    ['OTM','Odyssey of the Mind',48,0.68,'community'],
    ['JNS','JanSport',44,0.66,'community'],
    // Science
    ['LNV','Larry Niven',46,0.78,'science']
  ];

  // ── Rosetta Concepts — one representative translation per cluster ──
  var ROSETTA = {
    Signal:   ['Bird song, pheromone trail','Voltage waveform, PWM','Network packet, heartbeat','Thermal gradient','Color wavelength, audio freq','Financial indicator','Trade flow volume'],
    Trust:    ['Symbiosis, co-evolution','Signal integrity, ECC','TLS, firewall, ACL','Safety interlock','Web of trust, reputation','Audit trail, insurance','Treaty, federation'],
    Gradient: ['Elevation bands, moisture','Voltage divider, thermal','Load balancing, shaping','Thermal head, fuel cell','Color gradient, narrative arc','Risk gradient, market','Economic gradient, corridor'],
    Network:  ['Mycorrhizal web, food chain','Circuit topology, bus','TCP/IP, mesh, federation','Power grid, pipeline','Community, artistic influence','Supply chain, relationships','Trade corridor, transport'],
    Feedback: ['Predator-prey, fire succession','Op-amp, PID control','Monitoring, auto-scaling','Thermostat, governor','Audience response, remix','Market feedback, regulatory','Policy adjustment, democracy'],
    Boundary: ['Ecotone, riparian, treeline','Input impedance, shielding','Firewall, DMZ, container','Heat exchanger surface','Genre boundary, medium','Jurisdiction, licensing','State line, trade zone'],
    Sampling: ['Population survey, transect','Nyquist, ADC, oscilloscope','Log aggregation, metrics','Sensor polling, SCADA','Frame rate, sample rate','Audit sampling, spot check','Satellite imagery cadence'],
    Noise:    ['Habitat fragmentation','EMI, ground loops, aliasing','Congestion, log spam','Heat loss, friction','Visual clutter, compression','Regulatory ambiguity','Political interference']
  };

  // Cluster order for Rosetta columns
  var CLUSTER_ORDER = ['ecology','electronics','infrastructure','energy','creative','business','vision'];
  var CLUSTER_SHORT = ['Ecology','Electronics','Infra','Energy','Creative','Business','Vision'];

  // ── Ecological threads (for ecology cluster cross-links) ──
  var ECO_THREADS = {
    salmon:     { name: 'Salmon Thread', color: '#c75b3a', members: ['COL','CAS','ECO','SAL','MAM'] },
    mycorrhizal:{ name: 'Mycorrhizal Web', color: '#7a9a5a', members: ['COL','CAS','ECO','GDN','LFR'] },
    gradient:   { name: 'Vertical Gradient', color: '#4a7c3f', members: ['CAS','ECO','AVI','MAM','LFR'] },
    fire:       { name: 'Fire Succession', color: '#d4881a', members: ['ECO','CAS','WYR','LFR'] },
    pollinator: { name: 'Pollinator Web', color: '#e0a07a', members: ['GDN','AVI','ECO','AGR','CRV'] },
    water:      { name: 'Water Thread', color: '#2a8a96', members: ['COL','AWF','SAL','PGP','ECO'] },
    heritage:   { name: 'Heritage Thread', color: '#9b59b6', members: ['CRV','SAL','ECO','AGR','LFR'] }
  };

  // ── Detect current project from URL ──
  var path = window.location.pathname;
  var currentId = '';
  PROJECTS.forEach(function(p) {
    if (path.indexOf('/' + p[0] + '/') !== -1) currentId = p[0];
  });
  if (!currentId) return; // Not on a project page

  var current = null;
  PROJECTS.forEach(function(p) {
    if (p[0] === currentId) current = { id: p[0], name: p[1], theta: p[2], r: p[3], cluster: p[4] };
  });
  if (!current) return;

  // ── Find nearest muse ──
  function dist(t1, r1, t2, r2) {
    var a1 = t1 * Math.PI / 180, a2 = t2 * Math.PI / 180;
    var x1 = r1 * Math.cos(a1), y1 = r1 * Math.sin(a1);
    var x2 = r2 * Math.cos(a2), y2 = r2 * Math.sin(a2);
    return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
  }

  var nearestMuse = null, nearestDist = Infinity;
  MUSES.forEach(function(m) {
    var d = dist(current.theta, current.r, m.theta, m.r);
    if (d < nearestDist) { nearestDist = d; nearestMuse = m; }
  });

  // ── Find nearest neighbors (top 5 by compass proximity, excluding self) ──
  var neighbors = [];
  PROJECTS.forEach(function(p) {
    if (p[0] === currentId) return;
    neighbors.push({ id: p[0], name: p[1], theta: p[2], r: p[3], cluster: p[4],
                      dist: dist(current.theta, current.r, p[2], p[3]) });
  });
  neighbors.sort(function(a, b) { return a.dist - b.dist; });
  var nearest5 = neighbors.slice(0, 5);

  // ── Find same-cluster siblings ──
  var siblings = [];
  PROJECTS.forEach(function(p) {
    if (p[0] !== currentId && p[4] === current.cluster) {
      siblings.push({ id: p[0], name: p[1], theta: p[2], r: p[3] });
    }
  });

  // ── Find ecological threads this project belongs to ──
  var myThreads = [];
  if (current.cluster === 'ecology') {
    Object.keys(ECO_THREADS).forEach(function(key) {
      var t = ECO_THREADS[key];
      if (t.members.indexOf(currentId) !== -1) {
        myThreads.push(t);
      }
    });
  }

  // ── Pick a Rosetta concept relevant to this cluster ──
  var clusterIdx = CLUSTER_ORDER.indexOf(current.cluster);
  // For clusters not in the 7 main Rosetta columns, map to nearest
  var rosettaIdx = clusterIdx >= 0 ? clusterIdx : -1;
  if (current.cluster === 'music' || current.cluster === 'radio') rosettaIdx = 4; // creative
  if (current.cluster === 'community') rosettaIdx = 4;
  if (current.cluster === 'science') rosettaIdx = 4;

  // ── Build the fractal panel ──
  var cluster = CLUSTERS[current.cluster];

  var html = '';
  html += '<div class="fractal-details">';
  html += '<div class="fractal-header">';
  html += '<span class="fractal-title">Fractal Details</span>';
  html += '<span class="fractal-sub">Self-similar structure at every scale</span>';
  html += '</div>';

  // ── Compass Position ──
  html += '<div class="fractal-section">';
  html += '<div class="fractal-compass">';
  html += '<canvas id="fractal-mini-compass" width="120" height="120"></canvas>';
  html += '</div>';
  html += '<div class="fractal-position">';
  html += '<div class="fractal-cluster" style="color:' + cluster.color + '">' + cluster.name + '</div>';
  html += '<div class="fractal-coords">&theta; = ' + current.theta + '&deg; &nbsp;&middot;&nbsp; r = ' + current.r.toFixed(2) + '</div>';
  html += '<div class="fractal-muse">Nearest muse: <strong>' + nearestMuse.name + '</strong> <span class="fractal-muse-role">(' + nearestMuse.role + ')</span></div>';
  html += '<div class="fractal-voice">&ldquo;' + nearestMuse.sig + '&rdquo;</div>';
  html += '</div>';
  html += '</div>';

  // ── Connected Trails (nearest 5 on compass) ──
  html += '<div class="fractal-trails">';
  html += '<h4>Connected Trails</h4>';
  html += '<div class="fractal-trail-list">';
  nearest5.forEach(function(n) {
    var nc = CLUSTERS[n.cluster];
    html += '<a href="../' + n.id + '/index.html" class="fractal-trail-link">';
    html += '<span class="fractal-trail-dot" style="background:' + nc.color + '"></span>';
    html += '<span class="fractal-trail-name">' + n.name + '</span>';
    html += '<span class="fractal-trail-meta">&theta;=' + n.theta + '&deg;</span>';
    html += '</a>';
  });
  html += '</div>';

  // Same-cluster siblings (if more than shown above)
  if (siblings.length > 0) {
    html += '<div class="fractal-siblings">';
    html += '<span class="fractal-siblings-label">Same cluster:</span> ';
    siblings.slice(0, 8).forEach(function(s, i) {
      if (i > 0) html += '<span class="fractal-sep">&middot;</span>';
      html += '<a href="../' + s.id + '/index.html" class="fractal-sib-link">' + s.id + '</a>';
    });
    if (siblings.length > 8) html += '<span class="fractal-sep">&middot;</span><span class="fractal-more">+' + (siblings.length - 8) + '</span>';
    html += '</div>';
  }
  html += '</div>';

  // ── Ecological Threads (ecology cluster only) ──
  if (myThreads.length > 0) {
    html += '<div class="fractal-threads">';
    html += '<h4>Ecological Threads Through This Project</h4>';
    myThreads.forEach(function(t) {
      html += '<div class="fractal-thread">';
      html += '<span class="fractal-thread-line" style="background:' + t.color + '"></span>';
      html += '<span class="fractal-thread-name">' + t.name + '</span>';
      html += '<span class="fractal-thread-members">';
      t.members.forEach(function(m, i) {
        if (i > 0) html += ' &rarr; ';
        if (m === currentId) {
          html += '<strong>' + m + '</strong>';
        } else {
          html += '<a href="../' + m + '/index.html">' + m + '</a>';
        }
      });
      html += '</span>';
      html += '</div>';
    });
    html += '</div>';
  }

  // ── Rosetta Translation (one concept row) ──
  if (rosettaIdx >= 0) {
    // Pick the concept where this cluster's translation is most distinctive
    var concepts = Object.keys(ROSETTA);
    var concept = concepts[Math.abs(currentId.charCodeAt(0) + currentId.charCodeAt(1)) % concepts.length];

    html += '<div class="fractal-rosetta">';
    html += '<h4>Rosetta Translation: ' + concept + '</h4>';
    html += '<div class="fractal-rosetta-row">';
    CLUSTER_SHORT.forEach(function(label, i) {
      var isMe = (i === rosettaIdx);
      html += '<div class="fractal-rosetta-cell' + (isMe ? ' fractal-rosetta-active' : '') + '">';
      html += '<div class="fractal-rosetta-label" style="color:' + CLUSTERS[CLUSTER_ORDER[i]].color + '">' + label + '</div>';
      html += '<div class="fractal-rosetta-text">' + ROSETTA[concept][i] + '</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '<a href="../center-camp/rosetta-table.html" class="fractal-rosetta-link">Full Rosetta Table &rarr;</a>';
    html += '</div>';
  }

  // ── Navigation ──
  html += '<div class="fractal-nav">';
  html += '<a href="../center-camp/index.html">Center Camp</a>';
  html += '<a href="../compass.html">The Compass</a>';
  html += '<a href="../center-camp/frequency-dial.html">Frequency Dial</a>';
  html += '<a href="../center-camp/living-web.html">Living Web</a>';
  html += '<a href="../center-camp/rosetta-table.html">Rosetta Table</a>';
  html += '<a href="../center-camp/terrain.html">The Terrain</a>';
  html += '</div>';

  html += '</div>'; // .fractal-details

  // ── Inject Styles ──
  var style = document.createElement('style');
  style.textContent = [
    '.fractal-details{',
    '  margin:2.5rem 0 1rem;padding:0;',
    '  border-top:1px solid rgba(122,154,90,0.15);',
    '}',
    '.fractal-header{',
    '  display:flex;align-items:baseline;gap:1rem;',
    '  padding:1.5rem 0 0.8rem;flex-wrap:wrap;',
    '}',
    '.fractal-title{',
    '  font-family:Georgia,serif;font-size:1rem;',
    '  color:rgba(200,184,144,0.7);letter-spacing:0.06em;',
    '}',
    '.fractal-sub{',
    '  font-size:0.72rem;color:rgba(200,184,144,0.3);font-style:italic;',
    '}',
    '.fractal-section{',
    '  display:flex;gap:1.2rem;align-items:center;',
    '  padding:0.8rem 0;flex-wrap:wrap;',
    '}',
    '#fractal-mini-compass{',
    '  width:120px;height:120px;flex-shrink:0;',
    '  border-radius:50%;',
    '  box-shadow:0 0 15px rgba(122,154,90,0.1);',
    '}',
    '.fractal-position{line-height:1.8;}',
    '.fractal-cluster{font-size:0.95rem;font-weight:600;}',
    '.fractal-coords{',
    '  font-family:"Courier New",monospace;font-size:0.78rem;',
    '  color:rgba(122,154,90,0.7);',
    '}',
    '.fractal-muse{font-size:0.82rem;color:rgba(232,220,200,0.6);}',
    '.fractal-muse-role{font-size:0.75rem;color:rgba(232,220,200,0.35);}',
    '.fractal-voice{',
    '  font-style:italic;font-size:0.8rem;',
    '  color:rgba(200,184,144,0.4);margin-top:0.2rem;',
    '}',
    '.fractal-trails{padding:0.8rem 0;}',
    '.fractal-trails h4,.fractal-threads h4,.fractal-rosetta h4{',
    '  font-size:0.82rem;font-weight:400;',
    '  color:rgba(200,184,144,0.5);margin-bottom:0.5rem;',
    '  letter-spacing:0.04em;',
    '}',
    '.fractal-trail-list{',
    '  display:flex;flex-wrap:wrap;gap:0.4rem;',
    '}',
    '.fractal-trail-link{',
    '  display:inline-flex;align-items:center;gap:0.35rem;',
    '  padding:0.25rem 0.7rem;',
    '  background:rgba(26,42,32,0.5);',
    '  border:1px solid rgba(122,154,90,0.12);',
    '  border-radius:4px;text-decoration:none;',
    '  font-size:0.78rem;color:rgba(232,220,200,0.65);',
    '  transition:all 0.2s;',
    '}',
    '.fractal-trail-link:hover{',
    '  border-color:rgba(122,154,90,0.35);',
    '  color:#e8dcc8;background:rgba(26,42,32,0.8);',
    '}',
    '.fractal-trail-dot{',
    '  width:6px;height:6px;border-radius:50%;flex-shrink:0;',
    '}',
    '.fractal-trail-name{white-space:nowrap;}',
    '.fractal-trail-meta{',
    '  font-family:"Courier New",monospace;font-size:0.68rem;',
    '  color:rgba(122,154,90,0.4);',
    '}',
    '.fractal-siblings{',
    '  margin-top:0.5rem;font-size:0.75rem;',
    '  color:rgba(232,220,200,0.35);',
    '}',
    '.fractal-siblings-label{color:rgba(200,184,144,0.4);}',
    '.fractal-sib-link{color:rgba(122,154,90,0.5);text-decoration:none;}',
    '.fractal-sib-link:hover{color:#7a9a5a;}',
    '.fractal-sep{margin:0 0.3rem;color:rgba(122,154,90,0.2);}',
    '.fractal-more{color:rgba(122,154,90,0.3);}',
    '.fractal-threads{padding:0.8rem 0;}',
    '.fractal-thread{',
    '  display:flex;align-items:center;gap:0.6rem;',
    '  padding:0.3rem 0;font-size:0.8rem;flex-wrap:wrap;',
    '}',
    '.fractal-thread-line{',
    '  width:20px;height:3px;border-radius:2px;flex-shrink:0;',
    '}',
    '.fractal-thread-name{',
    '  color:rgba(232,220,200,0.6);font-weight:600;',
    '  min-width:8rem;',
    '}',
    '.fractal-thread-members{',
    '  font-size:0.75rem;color:rgba(232,220,200,0.4);',
    '}',
    '.fractal-thread-members a{',
    '  color:rgba(122,154,90,0.6);text-decoration:none;',
    '}',
    '.fractal-thread-members a:hover{color:#7a9a5a;}',
    '.fractal-thread-members strong{color:rgba(232,220,200,0.8);}',
    '.fractal-rosetta{padding:0.8rem 0;}',
    '.fractal-rosetta-row{',
    '  display:grid;',
    '  grid-template-columns:repeat(7,1fr);',
    '  gap:0.4rem;',
    '}',
    '@media(max-width:700px){',
    '  .fractal-rosetta-row{grid-template-columns:repeat(2,1fr);}',
    '}',
    '.fractal-rosetta-cell{',
    '  padding:0.5rem;',
    '  background:rgba(26,42,32,0.4);',
    '  border:1px solid rgba(122,154,90,0.08);',
    '  border-radius:4px;font-size:0.72rem;',
    '  color:rgba(232,220,200,0.5);line-height:1.5;',
    '}',
    '.fractal-rosetta-active{',
    '  background:rgba(26,42,32,0.7);',
    '  border-color:rgba(200,184,144,0.25);',
    '  color:rgba(232,220,200,0.8);',
    '}',
    '.fractal-rosetta-label{',
    '  font-size:0.65rem;text-transform:uppercase;',
    '  letter-spacing:0.05em;margin-bottom:0.2rem;',
    '}',
    '.fractal-rosetta-link{',
    '  display:inline-block;margin-top:0.5rem;',
    '  font-size:0.78rem;color:rgba(122,154,90,0.5);',
    '  text-decoration:none;',
    '}',
    '.fractal-rosetta-link:hover{color:#7a9a5a;}',
    '.fractal-nav{',
    '  display:flex;flex-wrap:wrap;gap:0.6rem;',
    '  padding:1rem 0 0.5rem;',
    '  border-top:1px solid rgba(122,154,90,0.08);',
    '  margin-top:1rem;',
    '}',
    '.fractal-nav a{',
    '  font-size:0.75rem;color:rgba(122,154,90,0.45);',
    '  text-decoration:none;padding:0.2rem 0.5rem;',
    '  border:1px solid rgba(122,154,90,0.1);border-radius:3px;',
    '  transition:all 0.2s;',
    '}',
    '.fractal-nav a:hover{',
    '  color:#7a9a5a;border-color:rgba(122,154,90,0.3);',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  // ── Inject into page ──
  var main = document.querySelector('main');
  if (main) {
    var container = document.createElement('div');
    container.innerHTML = html;
    main.appendChild(container);
  }

  // ── Draw mini compass ──
  setTimeout(function() {
    var canvas = document.getElementById('fractal-mini-compass');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W = 120, H = 120, CX = W/2, CY = H/2, R = 48;

    // Background
    var bg = ctx.createRadialGradient(CX, CY, 0, CX, CY, R*1.2);
    bg.addColorStop(0, '#0d1a12');
    bg.addColorStop(1, '#081210');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Rings
    for (var i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(CX, CY, (i/4)*R, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(122,154,90,0.08)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Radial lines 0-90
    for (var deg = 0; deg <= 90; deg += 30) {
      var rad = deg * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(CX + R*1.05*Math.cos(rad), CY - R*1.05*Math.sin(rad));
      ctx.strokeStyle = 'rgba(122,154,90,0.06)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Neighbor dots (faint)
    nearest5.forEach(function(n) {
      var nc = CLUSTERS[n.cluster];
      var rad = n.theta * Math.PI / 180;
      var px = CX + n.r * R * Math.cos(rad);
      var py = CY - n.r * R * Math.sin(rad);
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI*2);
      ctx.fillStyle = nc.color + '55';
      ctx.fill();
    });

    // Nearest muse (diamond, faint)
    var mRad = nearestMuse.theta * Math.PI / 180;
    var mx = CX + nearestMuse.r * R * Math.cos(mRad);
    var my = CY - nearestMuse.r * R * Math.sin(mRad);
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(Math.PI/4);
    ctx.fillStyle = 'rgba(200,184,144,0.4)';
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();

    // Current project (bright, larger)
    var cRad = current.theta * Math.PI / 180;
    var cx = CX + current.r * R * Math.cos(cRad);
    var cy = CY - current.r * R * Math.sin(cRad);

    // Glow
    var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 10);
    glow.addColorStop(0, cluster.color + '66');
    glow.addColorStop(1, cluster.color + '00');
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI*2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Dot
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI*2);
    ctx.fillStyle = cluster.color;
    ctx.fill();

    // Fire at center
    ctx.beginPath();
    ctx.arc(CX, CY, 2, 0, Math.PI*2);
    ctx.fillStyle = '#c75b3a';
    ctx.fill();

  }, 100);

})();
