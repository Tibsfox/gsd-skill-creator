#!/usr/bin/env node
/**
 * atlas-perf-bench.mjs — symbol-indexing throughput benchmark (v1.49.607 W4)
 *
 * Exercises the tokenize + coarseAst pipeline across all 9 supported languages
 * and reports median + p95 LOC/sec. Performance criterion: ≥ 10K LOC/sec median
 * (mission spec #14: "Symbol indexing 100K LOC < 3 min").
 *
 * Exit codes:
 *   0 = all PASS (or --strict not given)
 *   1 = one or more languages below 10K LOC/sec median (only when --strict)
 *
 * Usage:
 *   node tools/atlas-perf-bench.mjs                # bench all 9 languages at 10K LOC
 *   node tools/atlas-perf-bench.mjs --lines=5000   # custom line count
 *   node tools/atlas-perf-bench.mjs --language=ts  # single language
 *   node tools/atlas-perf-bench.mjs --json         # machine-readable JSON
 *   node tools/atlas-perf-bench.mjs --strict        # exit 1 if any lang < 10K LOC/sec
 */

import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..');
const DIST_ATLAS = join(REPO_ROOT, 'dist', 'atlas', 'syntax', 'index.js');

// ── argument parsing ─────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const MODE_JSON   = argv.includes('--json');
const MODE_STRICT = argv.includes('--strict');

function getFlag(flag) {
  const i = argv.indexOf(flag);
  return (i >= 0 && argv[i + 1]) ? argv[i + 1] : null;
}
function getFlagEq(prefix) {
  const a = argv.find(a => a.startsWith(prefix + '='));
  return a ? a.slice(prefix.length + 1) : null;
}

const TARGET_LINES   = parseInt(getFlagEq('--lines')    ?? getFlag('--lines')    ?? '10000', 10);
const ONLY_LANGUAGE  = getFlagEq('--language') ?? getFlag('--language') ?? null;
// Threshold (LOC/sec) below which --strict fails. Exposed as flag for test overrides.
const STRICT_THRESHOLD = parseInt(getFlagEq('--threshold') ?? '10000', 10);

const WARMUP_RUNS  = 5;
const TIMED_RUNS   = 20;

// ── language → fixture template ──────────────────────────────────────────────
// Each template is a small representative snippet; it is repeated until we
// reach the target line count. Repetition is intentional — we measure parse
// throughput, not codebase coverage.

const LANG_FIXTURES = {
  ts: (i) => `
// Function ${i}
export async function processItem${i}(input: string, count: number): Promise<string> {
  const result: string[] = [];
  for (let k = 0; k < count; k++) {
    result.push(input.repeat(k));
  }
  return result.join('\\n');
}

// Class ${i}
export class Handler${i} {
  private readonly name: string;
  constructor(name: string) { this.name = name; }
  handle(event: { type: string; payload: unknown }): boolean {
    if (event.type === 'ping') return true;
    return false;
  }
}

export type Config${i} = { id: number; label: string; enabled: boolean };
export const DEFAULT_CONFIG${i}: Config${i} = { id: ${i}, label: 'item${i}', enabled: true };
`,

  js: (i) => `
// Function ${i}
async function processItem${i}(input, count) {
  const result = [];
  for (let k = 0; k < count; k++) {
    result.push(input.repeat(k));
  }
  return result.join('\\n');
}

class Handler${i} {
  constructor(name) { this.name = name; }
  handle(event) {
    if (event.type === 'ping') return true;
    return false;
  }
}

const DEFAULT_CONFIG${i} = { id: ${i}, label: 'item${i}', enabled: true };
module.exports = { processItem${i}, Handler${i}, DEFAULT_CONFIG${i} };
`,

  rust: (i) => `
// Module ${i}
use std::collections::HashMap;

pub struct Handler${i} {
    name: String,
    count: usize,
}

impl Handler${i} {
    pub fn new(name: &str) -> Self {
        Self { name: name.to_string(), count: 0 }
    }

    pub fn process(&mut self, input: &str) -> Vec<String> {
        self.count += 1;
        input.split_whitespace().map(|s| s.to_string()).collect()
    }
}

pub fn run_pipeline${i}(items: &[String]) -> HashMap<String, usize> {
    let mut result = HashMap::new();
    for item in items {
        *result.entry(item.clone()).or_insert(0) += 1;
    }
    result
}
`,

  python: (i) => `
# Module ${i}
from typing import List, Dict, Optional

class Handler${i}:
    def __init__(self, name: str, count: int = 0):
        self.name = name
        self.count = count

    def process(self, input_str: str) -> List[str]:
        self.count += 1
        return input_str.split()

    def summarize(self) -> Dict[str, int]:
        return {'name': len(self.name), 'count': self.count}

def run_pipeline${i}(items: List[str]) -> Optional[Dict[str, int]]:
    if not items:
        return None
    result: Dict[str, int] = {}
    for item in items:
        result[item] = result.get(item, 0) + 1
    return result
`,

  go: (i) => `
// Package bench${i}
package bench

import (
    "fmt"
    "strings"
)

// Handler${i} processes items.
type Handler${i} struct {
    Name  string
    Count int
}

func NewHandler${i}(name string) *Handler${i} {
    return &Handler${i}{Name: name}
}

func (h *Handler${i}) Process(input string) []string {
    h.Count++
    return strings.Fields(input)
}

func RunPipeline${i}(items []string) map[string]int {
    result := make(map[string]int)
    for _, item := range items {
        result[item]++
    }
    fmt.Printf("processed %d items\\n", len(items))
    return result
}
`,

  java: (i) => `
// Class ${i}
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Arrays;

public class Handler${i} {
    private final String name;
    private int count;

    public Handler${i}(String name) {
        this.name = name;
        this.count = 0;
    }

    public List<String> process(String input) {
        this.count++;
        return Arrays.asList(input.split("\\\\s+"));
    }

    public Map<String, Integer> summarize() {
        Map<String, Integer> result = new HashMap<>();
        result.put("nameLen", this.name.length());
        result.put("count", this.count);
        return result;
    }

    public static Map<String, Integer> runPipeline${i}(List<String> items) {
        Map<String, Integer> result = new HashMap<>();
        for (String item : items) {
            result.merge(item, 1, Integer::sum);
        }
        return result;
    }
}
`,

  cpp: (i) => `
// Module ${i}
#include <string>
#include <vector>
#include <unordered_map>
#include <sstream>

namespace bench${i} {

class Handler${i} {
public:
    Handler${i}(const std::string& name) : name_(name), count_(0) {}

    std::vector<std::string> process(const std::string& input) {
        ++count_;
        std::vector<std::string> result;
        std::istringstream iss(input);
        std::string token;
        while (iss >> token) result.push_back(token);
        return result;
    }

    std::unordered_map<std::string, int> summarize() const {
        return {{"nameLen", static_cast<int>(name_.length())}, {"count", count_}};
    }

private:
    std::string name_;
    int count_;
};

std::unordered_map<std::string, int> runPipeline${i}(const std::vector<std::string>& items) {
    std::unordered_map<std::string, int> result;
    for (const auto& item : items) ++result[item];
    return result;
}

} // namespace bench${i}
`,

  bash: (i) => `
#!/usr/bin/env bash
# Script ${i}

HANDLER_NAME${i}="handler_${i}"
HANDLER_COUNT${i}=0

function process_items${i}() {
    local input="$1"
    local count="$2"
    local result=()
    for word in $input; do
        result+=("$word")
    done
    echo "$\{result[@]}"
}

function run_pipeline${i}() {
    local -a items=("$@")
    declare -A result
    for item in "$\{items[@]}"; do
        result["$item"]=$(( $\{result["$item"]:-0} + 1 ))
    done
    for key in "$\{!result[@]}"; do
        echo "$key: $\{result[$key]}"
    done
}

# Main ${i}
if [[ "$\{BASH_SOURCE[0]}" == "$\{0}" ]]; then
    process_items${i} "hello world foo bar" 4
fi
`,

  glsl: (i) => `
// Shader ${i}
precision highp float;

uniform sampler2D u_texture${i};
uniform float u_time${i};
uniform vec2 u_resolution${i};

varying vec2 v_uv${i};

vec3 computeColor${i}(vec2 uv, float t) {
    float r = 0.5 + 0.5 * sin(uv.x * 3.14159 + t);
    float g = 0.5 + 0.5 * cos(uv.y * 3.14159 + t * 0.7);
    float b = 0.5 + 0.5 * sin((uv.x + uv.y) * 2.0 + t * 1.3);
    return vec3(r, g, b);
}

void main${i}() {
    vec2 uv = v_uv${i};
    vec3 color = computeColor${i}(uv, u_time${i});
    vec4 texColor = texture2D(u_texture${i}, uv);
    gl_FragColor = vec4(mix(color, texColor.rgb, 0.5), 1.0);
}
`,
};

// Language display names and LanguageId mapping
const LANGUAGES = [
  { key: 'ts',     langId: 'typescript', label: 'ts'   },
  { key: 'js',     langId: 'javascript', label: 'js'   },
  { key: 'rust',   langId: 'rust',       label: 'rust' },
  { key: 'python', langId: 'python',     label: 'py'   },
  { key: 'go',     langId: 'go',         label: 'go'   },
  { key: 'java',   langId: 'java',       label: 'java' },
  { key: 'cpp',    langId: 'cpp',        label: 'cpp'  },
  { key: 'bash',   langId: 'bash',       label: 'bash' },
  { key: 'glsl',   langId: 'glsl',       label: 'glsl' },
];

// ── fixture generation ────────────────────────────────────────────────────────
function buildFixture(key, targetLines) {
  const templateFn = LANG_FIXTURES[key];
  if (!templateFn) throw new Error(`No fixture template for language: ${key}`);
  let source = '';
  let i = 0;
  while (source.split('\n').length < targetLines) {
    source += templateFn(i++);
  }
  return source;
}

// ── timing helpers ────────────────────────────────────────────────────────────
function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function p95(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, idx)];
}

// ── benchmark one language ────────────────────────────────────────────────────
async function benchLanguage(langEntry, targetLines, api) {
  const { key, langId, label } = langEntry;
  const source = buildFixture(key, targetLines);
  const lineCount = source.split('\n').length;

  const { tokenize, parse } = api;

  // Warm-up runs (not timed)
  for (let w = 0; w < WARMUP_RUNS; w++) {
    parse(source, langId);
  }

  // Timed runs
  const locsPerSec = [];
  for (let r = 0; r < TIMED_RUNS; r++) {
    const t0 = performance.now();
    parse(source, langId);
    const elapsed = performance.now() - t0; // ms
    const lps = (lineCount / elapsed) * 1000;
    locsPerSec.push(lps);
  }

  const p50 = Math.round(median(locsPerSec));
  const p95v = Math.round(p95(locsPerSec));

  return { key, langId, label, lineCount, p50, p95: p95v };
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Dynamically import the compiled atlas syntax API
  let api;
  try {
    // pathToFileURL: a raw native absolute path is not a valid ESM specifier on
    // Windows (D:\a\...\index.js throws ERR_UNSUPPORTED_ESM_URL_SCHEME) — must
    // be a file:// URL. No-op semantics on POSIX. (rung-2 cross-platform CI.)
    api = await import(pathToFileURL(DIST_ATLAS).href);
  } catch (err) {
    process.stderr.write(`atlas-perf-bench: ERROR — could not load ${DIST_ATLAS}\n`);
    process.stderr.write(`  ${err.message}\n`);
    process.stderr.write(`  Run 'npm run build' first.\n`);
    process.exit(1);
  }

  const targetLangs = ONLY_LANGUAGE
    ? LANGUAGES.filter(l => l.key === ONLY_LANGUAGE || l.langId === ONLY_LANGUAGE || l.label === ONLY_LANGUAGE)
    : LANGUAGES;

  if (targetLangs.length === 0) {
    process.stderr.write(`atlas-perf-bench: unknown language '${ONLY_LANGUAGE}'. Valid: ${LANGUAGES.map(l => l.key).join(', ')}\n`);
    process.exit(1);
  }

  const results = [];
  for (const langEntry of targetLangs) {
    const r = await benchLanguage(langEntry, TARGET_LINES, api);
    results.push(r);
  }

  // Aggregate (harmonic mean of p50 values weighted by line count)
  const aggP50 = Math.round(results.reduce((s, r) => s + r.p50, 0) / results.length);
  const aggP95 = Math.round(results.reduce((s, r) => s + r.p95, 0) / results.length);
  const anyFail = results.some(r => r.p50 < STRICT_THRESHOLD);

  if (MODE_JSON) {
    const out = {
      version: '1.0.0',
      threshold: STRICT_THRESHOLD,
      targetLines: TARGET_LINES,
      languages: results.map(r => ({
        key: r.key,
        langId: r.langId,
        label: r.label,
        lineCount: r.lineCount,
        p50LocPerSec: r.p50,
        p95LocPerSec: r.p95,
        pass: r.p50 >= STRICT_THRESHOLD,
        status: r.p50 >= STRICT_THRESHOLD ? 'PASS' : 'FAIL',
      })),
      aggregate: {
        p50LocPerSec: aggP50,
        p95LocPerSec: aggP95,
        pass: !anyFail,
        status: anyFail ? 'FAIL' : 'PASS',
      },
    };
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  } else {
    // Human-readable table
    const COL = { lang: 10, p50: 16, p95: 16, status: 8 };
    const fmt = (n) => n.toLocaleString('en-US');
    const pad = (s, w) => String(s).padEnd(w);
    const header = pad('Language', COL.lang) + pad('P50 LOC/sec', COL.p50) + pad('P95 LOC/sec', COL.p95) + 'Status';
    const sep    = '-'.repeat(header.length);

    process.stdout.write('\natlas-perf-bench\n');
    process.stdout.write(`Lines per language: ${TARGET_LINES.toLocaleString('en-US')}  |  Timed runs: ${TIMED_RUNS}  |  Threshold: ${STRICT_THRESHOLD.toLocaleString('en-US')} LOC/sec\n\n`);
    process.stdout.write(header + '\n');
    process.stdout.write(sep + '\n');

    for (const r of results) {
      const status = r.p50 >= STRICT_THRESHOLD ? 'PASS' : 'FAIL';
      process.stdout.write(
        pad(r.label, COL.lang) +
        pad(fmt(r.p50), COL.p50) +
        pad(fmt(r.p95), COL.p95) +
        status + '\n'
      );
    }

    if (results.length > 1) {
      process.stdout.write(sep + '\n');
      const aggStatus = anyFail ? 'FAIL' : 'PASS';
      process.stdout.write(
        pad('Aggregate', COL.lang) +
        pad(fmt(aggP50), COL.p50) +
        pad(fmt(aggP95), COL.p95) +
        aggStatus + '\n'
      );
    }
    process.stdout.write('\n');
  }

  if (MODE_STRICT && anyFail) {
    if (!MODE_JSON) {
      const failLangs = results.filter(r => r.p50 < STRICT_THRESHOLD).map(r => r.label).join(', ');
      process.stderr.write(`atlas-perf-bench: STRICT FAIL — languages below ${STRICT_THRESHOLD.toLocaleString('en-US')} LOC/sec: ${failLangs}\n`);
    }
    process.exit(1);
  }
}

main().catch(err => {
  process.stderr.write(`atlas-perf-bench: unhandled error: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
