#!/usr/bin/env node
// Enumerate NASA mission pages with TODO sub-agent markers.
// Output: .planning/nasa-pending-content-tracker.json
//
// Per page record:
//   degree, slug, path, title, summary, story_paths[], artifacts_count, todo_count, status

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const NASA_ROOT = 'www/tibsfox/com/Research/NASA';
const TRACKER = '.planning/nasa-pending-content-tracker.json';

function decode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '—')
    .replace(/&middot;/g, '·')
    .replace(/&ndash;/g, '–')
    .replace(/&rarr;/g, '→')
    .replace(/&larr;/g, '←')
    .replace(/&hellip;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extract(html) {
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const title = titleMatch ? decode(titleMatch[1].replace(/<[^>]+>/g, '').trim()) : null;

  // Mission Summary card — first paragraph
  const summaryMatch = html.match(/Mission Summary[\s\S]{0,8000}?<p>([\s\S]*?)<\/p>/);
  const summary = summaryMatch ? decode(summaryMatch[1].replace(/<[^>]+>/g, '').trim()) : null;

  // Story artifact paths
  const storyMatches = [...html.matchAll(/href="(artifacts\/story[^"]+\.html)"/g)];
  const story_paths = storyMatches.map(m => m[1]);

  // Artifacts list count
  const artifactsCount = (html.match(/href="artifacts\//g) || []).length;

  // TODO count
  const todoCount = (html.match(/<!-- TODO: sub-agent/g) || []).length;

  // Which TODO types remain
  const todos = {
    WhatToBuild: html.includes('TODO: sub-agent to generate WhatToBuild'),
    TRY: html.includes('TODO: sub-agent to generate TRY'),
    DIY: html.includes('TODO: sub-agent to generate DIY'),
  };

  return { title, summary, story_paths, artifacts_count: artifactsCount, todo_count: todoCount, todos };
}

const dirs = readdirSync(NASA_ROOT)
  .filter(d => /^1\.\d+$/.test(d) && statSync(join(NASA_ROOT, d)).isDirectory())
  .sort((a, b) => {
    const [, an] = a.split('.');
    const [, bn] = b.split('.');
    return Number(an) - Number(bn);
  });

const records = [];
for (const dir of dirs) {
  const path = join(NASA_ROOT, dir, 'index.html');
  let html;
  try { html = readFileSync(path, 'utf-8'); }
  catch { continue; }
  if (!html.includes('TODO: sub-agent')) continue;

  const info = extract(html);
  records.push({
    degree: dir,
    path,
    status: 'pending',
    ...info,
  });
}

const out = {
  generated_at: new Date().toISOString(),
  total: records.length,
  pending: records.filter(r => r.status === 'pending').length,
  records,
};

writeFileSync(TRACKER, JSON.stringify(out, null, 2));
console.log(`Wrote ${TRACKER}: ${records.length} pending pages`);

// Summary
const titleSamples = records.slice(0, 3).concat(records.slice(-3));
for (const r of titleSamples) {
  console.log(`  ${r.degree}: ${r.title?.slice(0, 80)}  (${r.todo_count} todos, ${r.artifacts_count} artifacts)`);
}
