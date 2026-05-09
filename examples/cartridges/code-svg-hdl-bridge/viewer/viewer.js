/* SCRIBE Round-Trip Viewer
 *
 * In-browser, no dependencies. Toy-scope TypeScript subset per Doc 04 §4.2.
 *
 * Pipeline:
 *   TS source -> tokenize -> parse -> AST -> render-as-SVG (kind="ast")
 *                                       \-> emit-Verilog -> render-netlist-SVG
 *   SVG -> parse-scribe-metadata -> rebuild AST -> regenerate TS source
 *
 * The metadata namespace is the load-bearing surface: the round-trip is
 * lossless within the toy subset because every accepted construct has
 * exactly one canonical AST shape and one canonical Verilog emission.
 *
 * License: Apache-2.0.
 */
'use strict';

const SCRIBE_NS = 'https://tibsfox.com/Research/SCRIBE/ns#';

// -------- Examples (inline mirror of examples.json so file:// works) -------
const EXAMPLES = [
  { id: 'add', label: '32-bit adder',
    source: 'function add(a, b) { return a + b }' },
  { id: 'xor', label: '1-bit XOR',
    source: 'function xor1(a, b) { return a ^ b }' },
  { id: 'mux', label: '2:1 multiplexer',
    source: 'function mux(c, a, b) { return c ? a : b }' }
];

// -------- Tiny SHA-1 (good-enough fingerprint; SHA-256 not in toy scope) ---
// Deterministic 40-hex digest from a string. Used as the source-fingerprint
// in <scribe:source sha=...> for round-trip identity claims. Per Doc 06
// I-CROSS-1, the value just needs to be stable across rounds, not
// cryptographically secure for this toy demo.
function sha1Hex(str) {
  function rotl(n, b) { return (n << b) | (n >>> (32 - b)); }
  function toHex(n) { return ('00000000' + (n >>> 0).toString(16)).slice(-8); }
  // Convert string to bytes
  const bytes = new TextEncoder().encode(str);
  const len = bytes.length;
  const bitLen = len * 8;
  // Pad: 0x80 then zeros, then 64-bit length
  const padLen = (((len + 9 + 63) >>> 6) << 6);
  const padded = new Uint8Array(padLen);
  padded.set(bytes);
  padded[len] = 0x80;
  // 64-bit length, big-endian (high 32 bits zero for our small inputs)
  const dv = new DataView(padded.buffer);
  dv.setUint32(padLen - 4, bitLen >>> 0, false);
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  const w = new Uint32Array(80);
  for (let i = 0; i < padLen; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4, false);
    for (let t = 16; t < 80; t++) w[t] = rotl(w[t-3] ^ w[t-8] ^ w[t-14] ^ w[t-16], 1);
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let t = 0; t < 80; t++) {
      let f, k;
      if (t < 20)      { f = (b & c) | ((~b) & d); k = 0x5a827999; }
      else if (t < 40) { f = b ^ c ^ d;             k = 0x6ed9eba1; }
      else if (t < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else             { f = b ^ c ^ d;             k = 0xca62c1d6; }
      const tmp = (rotl(a, 5) + f + e + k + w[t]) | 0;
      e = d; d = c; c = rotl(b, 30); b = a; a = tmp;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0; h4 = (h4 + e) | 0;
  }
  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4);
}

// -------- Tokenizer --------------------------------------------------------
// Toy subset: identifiers, function/return keywords, parens, braces, comma,
// semicolon, operators (+ - * & | ^ << >> ? :), integer literals, true/false.
const KEYWORDS = new Set(['function', 'return', 'true', 'false']);
function tokenize(src) {
  const toks = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    // Multi-char operators first
    if (src.startsWith('<<', i)) { toks.push({ t: 'op', v: '<<', s: i, e: i+2 }); i += 2; continue; }
    if (src.startsWith('>>', i)) { toks.push({ t: 'op', v: '>>', s: i, e: i+2 }); i += 2; continue; }
    // Single-char ops & punctuation
    if ('+-*/&|^?:,;(){}'.includes(c)) {
      toks.push({ t: 'op', v: c, s: i, e: i+1 });
      i++;
      continue;
    }
    // Identifier or keyword
    if (/[A-Za-z_]/.test(c)) {
      const m = src.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      const v = m[0];
      toks.push({ t: KEYWORDS.has(v) ? 'kw' : 'id', v, s: i, e: i + v.length });
      i += v.length;
      continue;
    }
    // Integer literal
    if (/[0-9]/.test(c)) {
      const m = src.slice(i).match(/^[0-9]+/);
      const v = m[0];
      toks.push({ t: 'num', v, s: i, e: i + v.length });
      i += v.length;
      continue;
    }
    throw new Error('Unexpected character at offset ' + i + ': ' + JSON.stringify(c));
  }
  return toks;
}

// -------- Parser -----------------------------------------------------------
// Toy grammar:
//   FunctionDecl := 'function' Id '(' ParamList ')' '{' 'return' Expr '}'
//   ParamList    := Id (',' Id)*
//   Expr         := Cond
//   Cond         := BitOr ('?' Expr ':' Expr)?
//   BitOr        := BitXor ('|' BitXor)*
//   BitXor       := BitAnd ('^' BitAnd)*
//   BitAnd       := Shift ('&' Shift)*
//   Shift        := Add (('<<'|'>>') Add)*
//   Add          := Mul (('+'|'-') Mul)*
//   Mul          := Atom ('*' Atom)*
//   Atom         := Id | num | 'true' | 'false' | '(' Expr ')'
//
// Each AST node carries: kind, sub_type, label, span (start..end), children[].
// Node IDs are assigned during a post-order walk after parsing.
function parse(src) {
  const toks = tokenize(src);
  let pos = 0;
  function peek(k) { return toks[pos + (k||0)]; }
  function eat(expected) {
    const t = toks[pos];
    if (!t) throw new Error('Unexpected end of input');
    if (expected && t.v !== expected) throw new Error(
      'Expected ' + JSON.stringify(expected) + ' at offset ' + t.s + ', got ' + JSON.stringify(t.v));
    pos++;
    return t;
  }
  function mkNode(sub_type, label, span, children) {
    return { kind: 'ast', sub_type, label: label || '', span, children: children || [] };
  }
  function parseFunctionDecl() {
    const fnTok = eat('function');
    const nameTok = eat();
    if (nameTok.t !== 'id') throw new Error('Expected function name at offset ' + nameTok.s);
    eat('(');
    const params = [];
    if (peek().v !== ')') {
      params.push(parseParam());
      while (peek().v === ',') { eat(','); params.push(parseParam()); }
    }
    const closeParen = eat(')');
    eat('{');
    eat('return');
    const expr = parseExpr();
    // optional trailing semicolon
    if (peek() && peek().v === ';') eat(';');
    const closeBrace = eat('}');
    const span = [fnTok.s, closeBrace.e];
    const nameNode = mkNode('Identifier', nameTok.v, [nameTok.s, nameTok.e], []);
    const returnSpan = [expr.span[0], expr.span[1]];
    const returnNode = mkNode('ReturnStatement', '', returnSpan, [expr]);
    return mkNode('FunctionDeclaration', nameTok.v, span, [nameNode, ...params, returnNode]);
  }
  function parseParam() {
    const t = eat();
    if (t.t !== 'id') throw new Error('Expected parameter name at offset ' + t.s);
    return mkNode('Parameter', t.v, [t.s, t.e], []);
  }
  function parseExpr() { return parseCond(); }
  function parseCond() {
    const left = parseBitOr();
    if (peek() && peek().v === '?') {
      eat('?');
      const consequent = parseExpr();
      eat(':');
      const alternate = parseExpr();
      return mkNode('ConditionalExpression', '?:', [left.span[0], alternate.span[1]],
                    [left, consequent, alternate]);
    }
    return left;
  }
  function parseLeftAssoc(parseChild, ops) {
    let left = parseChild();
    while (peek() && ops.includes(peek().v)) {
      const op = eat();
      const right = parseChild();
      left = mkNode('BinaryExpression', op.v, [left.span[0], right.span[1]], [left, right]);
    }
    return left;
  }
  function parseBitOr()  { return parseLeftAssoc(parseBitXor, ['|']); }
  function parseBitXor() { return parseLeftAssoc(parseBitAnd, ['^']); }
  function parseBitAnd() { return parseLeftAssoc(parseShift,  ['&']); }
  function parseShift()  { return parseLeftAssoc(parseAdd,    ['<<', '>>']); }
  function parseAdd()    { return parseLeftAssoc(parseMul,    ['+', '-']); }
  function parseMul()    { return parseLeftAssoc(parseAtom,   ['*']); }
  function parseAtom() {
    const t = peek();
    if (!t) throw new Error('Unexpected end of input in expression');
    if (t.t === 'id')                       { eat(); return mkNode('Identifier', t.v, [t.s, t.e]); }
    if (t.t === 'num')                      { eat(); return mkNode('NumericLiteral', t.v, [t.s, t.e]); }
    if (t.t === 'kw' && (t.v === 'true' || t.v === 'false')) {
      eat(); return mkNode('BooleanLiteral', t.v, [t.s, t.e]);
    }
    if (t.v === '(') { eat('('); const e = parseExpr(); eat(')'); return e; }
    throw new Error('Unexpected token at offset ' + t.s + ': ' + JSON.stringify(t.v));
  }
  const root = parseFunctionDecl();
  if (pos < toks.length) throw new Error('Unexpected trailing tokens at offset ' + toks[pos].s);
  // Assign post-order IDs n1, n2, ...
  let nextId = 0;
  function assignIds(node) {
    node.children.forEach(assignIds);
    node.id = 'n' + (++nextId);
  }
  assignIds(root);
  return root;
}

// -------- Layout: Reingold-Tilford-ish for hierarchical AST ----------------
// Simple implementation: post-order assigns x by sibling layout, y by depth.
function layoutTree(root, opts) {
  opts = opts || {};
  const xGap = opts.xGap || 110;
  const yGap = opts.yGap || 60;
  let nextX = 0;
  function walk(node, depth) {
    node.depth = depth;
    if (node.children.length === 0) {
      node.x = nextX * xGap + 60;
      nextX++;
    } else {
      node.children.forEach(c => walk(c, depth + 1));
      const first = node.children[0];
      const last = node.children[node.children.length - 1];
      node.x = (first.x + last.x) / 2;
    }
    node.y = depth * yGap + 40;
  }
  walk(root, 0);
}

// -------- Render: AST -> SVG (kind="ast") with full SCRIBE metadata --------
function renderAstSvg(ast, sourceMeta) {
  layoutTree(ast);
  // Find bounding box
  let maxX = 0, maxY = 0;
  function visit(n) {
    if (n.x > maxX) maxX = n.x;
    if (n.y > maxY) maxY = n.y;
    n.children.forEach(visit);
  }
  visit(ast);
  const W = maxX + 100, H = maxY + 60;

  // Collect nodes + edges
  const nodes = [];
  const edges = [];
  function collect(n, parent, order) {
    nodes.push(n);
    if (parent) edges.push({ id: 'e' + edges.length, src: parent.id, dst: n.id, rel: 'child', order });
    n.children.forEach((c, i) => collect(c, n, i));
  }
  collect(ast, null, 0);

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function nodeWidth(n) { return Math.max(60, (n.label || n.sub_type).length * 7 + 16); }

  // Build the metadata block FIRST -- this is the load-bearing artifact
  const metaNodes = nodes.map(n =>
    `      <scribe:node id="${n.id}" sub_type="${esc(n.sub_type)}" label="${esc(n.label)}" span="${n.span[0]}..${n.span[1]}"/>`
  ).join('\n');
  const metaEdges = edges.map(e =>
    `      <scribe:edge id="${e.id}" rel="${e.rel}" src="${e.src}" dst="${e.dst}" payload='{"order":${e.order}}'/>`
  ).join('\n');

  const metadata = [
    '  <metadata>',
    `    <scribe:graph version="1" kind="ast" language="typescript">`,
    `      <scribe:source path="${esc(sourceMeta.path)}" sha="${sourceMeta.sha}" bytes="${sourceMeta.bytes}" generator="scribe-roundtrip-viewer/1.0"/>`,
    '      <scribe:nodes>',
    metaNodes,
    '      </scribe:nodes>',
    '      <scribe:edges>',
    metaEdges,
    '      </scribe:edges>',
    '    </scribe:graph>',
    '  </metadata>'
  ].join('\n');

  // Visual elements
  const edgeEls = edges.map(e => {
    const src = nodes.find(n => n.id === e.src);
    const dst = nodes.find(n => n.id === e.dst);
    const x1 = src.x, y1 = src.y + 16;
    const x2 = dst.x, y2 = dst.y - 16;
    const cy = (y1 + y2) / 2;
    return `    <path class="edge" data-rel="child" data-src="${e.src}" data-dst="${e.dst}" d="M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}"/>`;
  }).join('\n');

  const nodeEls = nodes.map(n => {
    const w = nodeWidth(n);
    const x = n.x - w/2, y = n.y - 16;
    const subTitle = `${n.label || '(' + n.sub_type + ')'} (${n.sub_type}, ${n.span[0]}..${n.span[1]})`;
    return [
      `    <g class="node" id="${n.id}" data-node-id="${n.id}" data-sub_type="${esc(n.sub_type)}" data-span="${n.span[0]}..${n.span[1]}">`,
      `      <rect x="${x.toFixed(1)}" y="${y}" width="${w}" height="32" rx="4"/>`,
      `      <text x="${n.x.toFixed(1)}" y="${(n.y + 4).toFixed(1)}" text-anchor="middle">${esc(n.label || n.sub_type)}</text>`,
      `      <title>${esc(subTitle)}</title>`,
      `      <desc>${esc(n.sub_type)} node spanning bytes ${n.span[0]}..${n.span[1]}</desc>`,
      `    </g>`
    ].join('\n');
  }).join('\n');

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:scribe="${SCRIBE_NS}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="graphics-document" aria-labelledby="t">`,
    `  <title id="t">${esc(sourceMeta.path)} AST</title>`,
    `  <desc>SCRIBE round-trip artifact: ${esc(sourceMeta.path)} (${sourceMeta.bytes} bytes) parsed to AST. SHA ${sourceMeta.sha.slice(0, 16)}…</desc>`,
    metadata,
    `  <g class="layer edges">`,
    edgeEls,
    `  </g>`,
    `  <g class="layer nodes">`,
    nodeEls,
    `  </g>`,
    `</svg>`
  ].join('\n');
  return svg;
}

// -------- Emit: AST -> Verilog (toy subset) --------------------------------
// Each function becomes a module. Parameters become input ports. The return
// expression becomes a single continuous `assign` statement. Default 32-bit
// width for numeric params; 1-bit for boolean params (BooleanLiteral usage
// in the body suggests boolean -- otherwise default 32).
function emitVerilog(ast) {
  if (ast.sub_type !== 'FunctionDeclaration') throw new Error('Expected FunctionDeclaration root');
  const funcName = ast.label;
  const params = ast.children.filter(c => c.sub_type === 'Parameter');
  const returnNode = ast.children.find(c => c.sub_type === 'ReturnStatement');
  if (!returnNode) throw new Error('Function lacks return statement');
  const expr = returnNode.children[0];

  // Width inference: if expression contains BooleanLiteral OR ternary with
  // boolean-style condition, treat the condition param as 1-bit. Default 32.
  function inferWidths() {
    const w = new Map();
    params.forEach(p => w.set(p.label, 32));
    // Heuristic: if function name starts with xor1/and1/or1/not1 OR contains
    // BooleanLiteral, mark all params as 1-bit.
    function hasBool(n) {
      if (n.sub_type === 'BooleanLiteral') return true;
      return n.children.some(hasBool);
    }
    if (/^(xor1|and1|or1|not1|nand1|nor1|xnor1)$/.test(funcName) || hasBool(ast)) {
      params.forEach(p => w.set(p.label, 1));
    }
    // Heuristic: ternary's condition is 1-bit by convention
    if (expr.sub_type === 'ConditionalExpression') {
      const cond = expr.children[0];
      if (cond.sub_type === 'Identifier') w.set(cond.label, 1);
    }
    return w;
  }
  const widths = inferWidths();

  // Output width: same as max param width unless ternary -> uses branch width
  function outWidth() {
    if (expr.sub_type === 'ConditionalExpression') {
      const t = expr.children[1], f = expr.children[2];
      if (t.sub_type === 'Identifier') return widths.get(t.label) || 32;
    }
    let max = 1;
    widths.forEach(v => { if (v > max) max = v; });
    return max;
  }
  const outW = outWidth();

  function widthSpec(w) { return w > 1 ? `[${w-1}:0] ` : ''; }
  function emitExpr(n) {
    switch (n.sub_type) {
      case 'Identifier':       return n.label;
      case 'NumericLiteral':   return n.label;
      case 'BooleanLiteral':   return n.label === 'true' ? "1'b1" : "1'b0";
      case 'BinaryExpression': return `${emitExpr(n.children[0])} ${n.label} ${emitExpr(n.children[1])}`;
      case 'ConditionalExpression':
        return `${emitExpr(n.children[0])} ? ${emitExpr(n.children[1])} : ${emitExpr(n.children[2])}`;
      default: throw new Error('Cannot emit Verilog for sub_type ' + n.sub_type);
    }
  }
  const portLines = params.map(p =>
    `  input  wire ${widthSpec(widths.get(p.label) || 32)}${p.label}`
  );
  portLines.push(`  output wire ${widthSpec(outW)}out`);
  const body = `  assign out = ${emitExpr(expr)};`;
  return [
    `// SCRIBE round-trip Verilog emission for function ${funcName}`,
    `// Toy-scope: synthesizable subset, single continuous assign.`,
    `module ${funcName}(`,
    portLines.join(',\n'),
    `);`,
    body,
    `endmodule`
  ].join('\n');
}

// -------- Render: Verilog netlist as SVG (simple block diagram) ------------
// Show input ports on the left, the operator(s) in the middle, output port
// on the right. This is a structural-but-simplified view appropriate for the
// toy scope; full Yosys-driven rendering is documented in Doc 05.
function renderNetlistSvg(ast, sourceMeta) {
  const params = ast.children.filter(c => c.sub_type === 'Parameter');
  const expr = ast.children.find(c => c.sub_type === 'ReturnStatement').children[0];
  // Collect operator nodes (everything that's not an Identifier/Literal)
  const ops = [];
  function walkOps(n) {
    if (['BinaryExpression', 'ConditionalExpression'].includes(n.sub_type)) {
      ops.push(n);
      n.children.forEach(walkOps);
    }
  }
  walkOps(expr);

  const W = 540, rowH = 50;
  const H = Math.max(params.length, ops.length, 1) * rowH + 80;

  const portRadius = 6;
  const opW = 80, opH = 36;
  const inX = 40, opX = 240, outX = 460;

  // Layout: stack input ports vertically at inX; place ops in column at opX
  const inputs = params.map((p, i) => ({
    id: p.id, label: p.label, x: inX, y: 60 + i * rowH
  }));
  const opNodes = ops.map((o, i) => ({
    id: o.id, label: o.label || o.sub_type[0], sub_type: o.sub_type,
    x: opX, y: 60 + i * rowH
  }));
  const output = { id: 'out', label: 'out', x: outX, y: 60 + Math.floor(opNodes.length / 2) * rowH };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  const allNodes = [...inputs.map(i => ({...i, sub_type: 'port', dir: 'input'})),
                    ...opNodes,
                    {...output, sub_type: 'port', dir: 'output'}];

  // Build wires: each operator's children that are Identifiers wire to the
  // corresponding input port. For the root expression, wire its result to
  // the output port.
  const wires = [];
  ops.forEach((op, opIdx) => {
    op.children.forEach(child => {
      if (child.sub_type === 'Identifier') {
        const inp = inputs.find(p => p.label === child.label);
        if (inp) wires.push({ src: inp, dst: opNodes[opIdx] });
      } else if (child.sub_type === 'BinaryExpression' || child.sub_type === 'ConditionalExpression') {
        const childOp = opNodes.find(o => o.id === child.id);
        if (childOp) wires.push({ src: childOp, dst: opNodes[opIdx] });
      }
    });
  });
  // Final wire from root operator to output
  if (opNodes.length > 0) wires.push({ src: opNodes[0], dst: output });
  else if (inputs.length > 0) wires.push({ src: inputs[0], dst: output });

  // Build SCRIBE metadata for the netlist
  const metaNodes = allNodes.map(n => {
    let payload = '';
    if (n.dir) payload = ` payload='{"direction":"${n.dir}"}'`;
    return `      <scribe:node id="${n.id}" sub_type="${esc(n.sub_type)}" label="${esc(n.label)}"${payload}/>`;
  }).join('\n');
  const wireEdges = wires.map((w, i) =>
    `      <scribe:edge id="w${i}" rel="wire" src="${w.src.id}" dst="${w.dst.id}"/>`
  ).join('\n');
  const metadata = [
    '  <metadata>',
    `    <scribe:graph version="1" kind="netlist" language="verilog">`,
    `      <scribe:source path="${esc(sourceMeta.path)}" sha="${sourceMeta.sha}" generator="scribe-roundtrip-viewer/1.0"/>`,
    '      <scribe:nodes>',
    metaNodes,
    '      </scribe:nodes>',
    '      <scribe:edges>',
    wireEdges,
    '      </scribe:edges>',
    '    </scribe:graph>',
    '  </metadata>'
  ].join('\n');

  const portEls = inputs.concat([output]).map(p => {
    const isOut = p === output;
    return [
      `    <g class="port" data-node-id="${p.id}" data-direction="${isOut ? 'output' : 'input'}">`,
      `      <circle cx="${p.x}" cy="${p.y}" r="${portRadius}"/>`,
      `      <text x="${p.x + (isOut ? 10 : -10)}" y="${p.y + 4}" text-anchor="${isOut ? 'start' : 'end'}">${esc(p.label)}</text>`,
      `      <title>${esc(p.label)} (${isOut ? 'output' : 'input'} port)</title>`,
      `    </g>`
    ].join('\n');
  }).join('\n');

  const opEls = opNodes.map(o => {
    return [
      `    <g class="op" data-node-id="${o.id}" data-sub_type="${esc(o.sub_type)}">`,
      `      <rect x="${o.x - opW/2}" y="${o.y - opH/2}" width="${opW}" height="${opH}" rx="3"/>`,
      `      <text x="${o.x}" y="${o.y + 5}" text-anchor="middle">${esc(o.label)}</text>`,
      `      <title>${esc(o.sub_type)}: ${esc(o.label)}</title>`,
      `    </g>`
    ].join('\n');
  }).join('\n');

  const wireEls = wires.map(w => {
    const x1 = w.src.x + (w.src.sub_type === 'port' ? portRadius : opW/2);
    const x2 = w.dst.x - (w.dst.sub_type === 'port' ? portRadius : opW/2);
    const y1 = w.src.y, y2 = w.dst.y;
    const mx = (x1 + x2) / 2;
    return `    <path class="wire" data-src="${w.src.id}" data-dst="${w.dst.id}" d="M ${x1} ${y1} L ${mx} ${y1} L ${mx} ${y2} L ${x2} ${y2}"/>`;
  }).join('\n');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:scribe="${SCRIBE_NS}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="graphics-document" aria-labelledby="nt">`,
    `  <title id="nt">${esc(ast.label)} netlist</title>`,
    `  <desc>SCRIBE structural netlist for module ${esc(ast.label)}</desc>`,
    metadata,
    `  <g class="layer wires">`,
    wireEls,
    `  </g>`,
    `  <g class="layer ports">`,
    portEls,
    `  </g>`,
    `  <g class="layer ops">`,
    opEls,
    `  </g>`,
    `</svg>`
  ].join('\n');
}

// -------- Reverse: SVG metadata -> AST --------------------------------------
function parseSvgToAst(svgText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const err = doc.getElementsByTagName('parsererror');
  if (err.length) throw new Error('SVG is not well-formed XML');
  // Use getElementsByTagNameNS for SCRIBE namespace lookup
  const graphs = doc.getElementsByTagNameNS(SCRIBE_NS, 'graph');
  if (graphs.length === 0) throw new Error('SVG lacks <scribe:graph> metadata; structural-fallback not implemented in this toy demo');
  const graph = graphs[0];
  const kind = graph.getAttribute('kind');
  if (kind !== 'ast') throw new Error('Expected kind="ast"; got ' + JSON.stringify(kind));
  const sourceEl = graph.getElementsByTagNameNS(SCRIBE_NS, 'source')[0];
  const sourcePath = sourceEl ? sourceEl.getAttribute('path') : '(unknown)';
  const sourceSha = sourceEl ? sourceEl.getAttribute('sha') : '';
  const nodeEls = graph.getElementsByTagNameNS(SCRIBE_NS, 'node');
  const edgeEls = graph.getElementsByTagNameNS(SCRIBE_NS, 'edge');
  const nodeMap = new Map();
  for (const ne of nodeEls) {
    const span = (ne.getAttribute('span') || '0..0').split('..').map(Number);
    nodeMap.set(ne.getAttribute('id'), {
      id: ne.getAttribute('id'),
      sub_type: ne.getAttribute('sub_type'),
      label: ne.getAttribute('label') || '',
      span,
      children: []
    });
  }
  // Build child links from edges
  const incomingChild = new Set();
  for (const ee of edgeEls) {
    if (ee.getAttribute('rel') !== 'child') continue;
    const src = nodeMap.get(ee.getAttribute('src'));
    const dst = nodeMap.get(ee.getAttribute('dst'));
    if (!src || !dst) continue;
    let order = 0;
    const payload = ee.getAttribute('payload');
    if (payload) { try { order = JSON.parse(payload).order || 0; } catch {} }
    dst._order = order;
    src.children.push(dst);
    incomingChild.add(dst.id);
  }
  // Sort children by order
  for (const n of nodeMap.values()) n.children.sort((a, b) => (a._order||0) - (b._order||0));
  // Find root: node with no incoming child edge
  let root = null;
  for (const n of nodeMap.values()) if (!incomingChild.has(n.id)) { root = n; break; }
  if (!root) throw new Error('No root node found in SCRIBE metadata');
  return { ast: root, source: { path: sourcePath, sha: sourceSha } };
}

// -------- Reverse: AST -> TypeScript source ---------------------------------
function astToSource(ast) {
  function emit(n) {
    switch (n.sub_type) {
      case 'FunctionDeclaration': {
        const nameNode = n.children.find(c => c.sub_type === 'Identifier');
        const params = n.children.filter(c => c.sub_type === 'Parameter');
        const ret = n.children.find(c => c.sub_type === 'ReturnStatement');
        const name = nameNode ? nameNode.label : (n.label || 'anonymous');
        const paramStr = params.map(p => p.label).join(', ');
        return `function ${name}(${paramStr}) { ${emit(ret)} }`;
      }
      case 'ReturnStatement':
        return `return ${emit(n.children[0])}`;
      case 'BinaryExpression':
        return `${emit(n.children[0])} ${n.label} ${emit(n.children[1])}`;
      case 'ConditionalExpression':
        return `${emit(n.children[0])} ? ${emit(n.children[1])} : ${emit(n.children[2])}`;
      case 'Identifier':
      case 'NumericLiteral':
        return n.label;
      case 'BooleanLiteral':
        return n.label;
      case 'Parameter':
        return n.label;
      default:
        return `/* unsupported sub_type: ${n.sub_type} */`;
    }
  }
  return emit(ast);
}

// -------- Validation --------------------------------------------------------
// Run the round-trip checks per Doc 06 §7.
function validateScribeSvg(svgText) {
  const report = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  if (doc.getElementsByTagName('parsererror').length) {
    return ['FAIL: SVG is not well-formed XML'];
  }
  const root = doc.documentElement;
  // a11y checks
  if (!root.getAttribute('role')) report.push('WARN: root <svg> missing role attribute');
  else report.push('OK: root role = ' + root.getAttribute('role'));
  const titleEls = root.getElementsByTagName('title');
  if (titleEls.length === 0) report.push('FAIL: root <svg> missing <title>');
  else report.push('OK: root <title> present: ' + (titleEls[0].textContent || '').slice(0, 60));
  const descEls = root.getElementsByTagName('desc');
  if (descEls.length === 0) report.push('WARN: root <svg> missing <desc>');
  else report.push('OK: root <desc> present');
  // SCRIBE namespace check
  if (!root.getAttribute('xmlns:scribe')) report.push('FAIL: missing xmlns:scribe declaration');
  else report.push('OK: xmlns:scribe declared');
  // <scribe:graph>
  const graphs = doc.getElementsByTagNameNS(SCRIBE_NS, 'graph');
  if (graphs.length === 0) report.push('FAIL: no <scribe:graph> element');
  else {
    const g = graphs[0];
    report.push('OK: <scribe:graph kind="' + g.getAttribute('kind') + '" version="' + g.getAttribute('version') + '">');
    const src = g.getElementsByTagNameNS(SCRIBE_NS, 'source')[0];
    if (!src) report.push('FAIL: <scribe:source> missing');
    else {
      if (!src.getAttribute('path')) report.push('FAIL: <scribe:source> missing path');
      if (!src.getAttribute('sha'))  report.push('FAIL: <scribe:source> missing sha');
      report.push('OK: source path=' + src.getAttribute('path') + ' sha=' + (src.getAttribute('sha') || '').slice(0, 12) + '…');
    }
    const nodes = g.getElementsByTagNameNS(SCRIBE_NS, 'node');
    const edges = g.getElementsByTagNameNS(SCRIBE_NS, 'edge');
    report.push('OK: ' + nodes.length + ' <scribe:node>, ' + edges.length + ' <scribe:edge>');
    // Visual cross-check: every <scribe:node> should have a <g class="node" id=…>
    const visualGroups = root.querySelectorAll('g.node, g.port, g.op');
    const visualIds = new Set(Array.from(visualGroups).map(g => g.getAttribute('id') || g.getAttribute('data-node-id')));
    let missing = 0;
    for (const n of nodes) if (!visualIds.has(n.getAttribute('id'))) missing++;
    if (missing) report.push('WARN: ' + missing + ' <scribe:node>(s) lack matching visual <g>');
    else report.push('OK: every <scribe:node> has matching visual element');
  }
  return report;
}

// -------- UI wiring ---------------------------------------------------------
const $ = (id) => document.getElementById(id);

function setStatus(el, text, cls) {
  el.textContent = text;
  el.className = 'status ' + (cls || '');
}

function loadExample(id) {
  const ex = EXAMPLES.find(e => e.id === id) || EXAMPLES[0];
  $('source-input').value = ex.source;
  setStatus($('source-status'), 'Loaded example: ' + ex.label, 'ok');
}

// ─── Round-trip persistence hook (Component 05) ───────────────────────────
//
// Fire-and-forget POST to /api/roundtrip/event when the dashboard-service is
// running alongside this viewer (PERSISTENCE_CONFIG.enabled = true).
//
// When enabled=false (the default for file:// deployments), this function
// returns immediately and makes ZERO network requests.
//
// PERSISTENCE_CONFIG is injected by persistence-config.js which is loaded
// before viewer.js in index.html.  Operators may also set:
//   window.SCRIBE_PERSISTENCE_OVERRIDE = { enabled: true }
// before the scripts load to enable persistence at runtime.
//
// SHAs come from sha1Hex() which is already defined at line 35 (synchronous).
//
// Failure to persist is a console.warn, NOT a viewer error.
//
function emitRoundtripEvent(payload) {
  /* global PERSISTENCE_CONFIG */
  const cfg = (typeof PERSISTENCE_CONFIG !== 'undefined')
    ? PERSISTENCE_CONFIG
    : { enabled: false, endpoint: '/api/roundtrip/event' };
  if (!cfg.enabled) return;
  // Non-blocking — intentionally NOT awaited; viewer must not stall on this.
  fetch(cfg.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(function(err) {
    console.warn('[roundtrip-persistence] non-blocking POST failed:', err && err.message);
  });
}

function runRoundTrip() {
  const src = $('source-input').value;
  // Stage 1: parse
  let ast;
  try {
    ast = parse(src);
    setStatus($('source-status'), 'Parsed OK: ' + countNodes(ast) + ' AST nodes', 'ok');
  } catch (e) {
    setStatus($('source-status'), 'Parse error: ' + e.message, 'err');
    return;
  }
  // Stage 2: render AST as SVG
  const sourceMeta = { path: 'paste.ts', sha: sha1Hex(src), bytes: src.length };
  let astSvg;
  try {
    astSvg = renderAstSvg(ast, sourceMeta);
    $('ast-svg-text').value = astSvg;
    $('ast-svg-container').innerHTML = astSvg;
  } catch (e) {
    setStatus($('source-status'), 'Render error: ' + e.message, 'err');
    return;
  }
  // Stage 3: emit Verilog
  let verilog;
  try {
    verilog = emitVerilog(ast);
    $('verilog-output').value = verilog;
    setStatus($('verilog-status'), 'Emitted ' + verilog.split('\n').length + ' lines of Verilog', 'ok');
  } catch (e) {
    setStatus($('verilog-status'), 'Emit error: ' + e.message, 'err');
    verilog = '// Emission failed: ' + e.message;
    $('verilog-output').value = verilog;
  }
  // Stage 4: render netlist SVG
  let netSvg;
  try {
    netSvg = renderNetlistSvg(ast, sourceMeta);
    $('netlist-svg-text').value = netSvg;
    $('netlist-svg-container').innerHTML = netSvg;
  } catch (e) {
    $('netlist-svg-container').textContent = 'Netlist render error: ' + e.message;
  }
  // Stage 5: parse the AST-SVG back and regenerate source
  try {
    const { ast: ast2 } = parseSvgToAst(astSvg);
    const regen = astToSource(ast2);
    $('roundtrip-output').value = regen;
    // Compare round-tripped source against canonicalized original
    const normalize = s => s.replace(/\s+/g, ' ').trim();
    const ok = normalize(regen) === normalize(src);
    setStatus($('roundtrip-status'),
      ok ? 'PASS: round-tripped source matches original (modulo whitespace)'
         : 'WARN: round-tripped source differs. Original: ' + normalize(src) + ' / Regen: ' + normalize(regen),
      ok ? 'ok' : 'warn');
    // ── Component 05: Round-Trip Persistence hook ─────────────────────────
    // Emit a non-blocking prov_node insert on PASS only.
    // sha1Hex is synchronous (defined at line 35 of this file).
    // Failure is a console.warn; the UI is unaffected.
    if (ok) {
      emitRoundtripEvent({
        direction: 'forward',
        sourceLanguage: 'typescript',
        targetLanguage: 'verilog',
        sourceSha: sha1Hex(src),
        targetSha: sha1Hex(verilog || ''),
        svgSha: sha1Hex(astSvg),
        emittedAt: new Date().toISOString(),
        extras: { exampleId: $('example-select').value },
      });
    }
    // ─────────────────────────────────────────────────────────────────────
  } catch (e) {
    setStatus($('roundtrip-status'), 'Round-trip parse error: ' + e.message, 'err');
  }
  // Stage 6: validation
  try {
    const report = validateScribeSvg(astSvg);
    $('validation-report').textContent = report.join('\n');
  } catch (e) {
    $('validation-report').textContent = 'Validator error: ' + e.message;
  }
}

function countNodes(ast) {
  let n = 1;
  ast.children.forEach(c => { n += countNodes(c); });
  return n;
}

function init() {
  // Wire controls
  $('btn-load-example').addEventListener('click', () => loadExample($('example-select').value));
  $('btn-run-roundtrip').addEventListener('click', runRoundTrip);
  $('btn-validate').addEventListener('click', () => {
    try {
      const report = validateScribeSvg($('ast-svg-text').value || '<svg/>');
      $('validation-report').textContent = report.join('\n');
    } catch (e) {
      $('validation-report').textContent = 'Validator error: ' + e.message;
    }
  });
  // Default: load first example and run
  loadExample('add');
  runRoundTrip();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Expose for debugging from devtools
window.SCRIBE = { parse, emitVerilog, renderAstSvg, renderNetlistSvg, parseSvgToAst, astToSource, validateScribeSvg, sha1Hex, EXAMPLES };
