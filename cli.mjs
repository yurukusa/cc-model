#!/usr/bin/env node
/**
 * cc-model — Which Claude AI models power your sessions?
 * Shows the distribution of model usage across your Claude Code sessions.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const timelineMode = args.includes('--timeline');
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`cc-model — Which Claude AI models power your sessions?

Usage:
  npx cc-model               # Model distribution
  npx cc-model --timeline    # Week-by-week model usage
  npx cc-model --json        # JSON output
`);
  process.exit(0);
}

const claudeDir = join(homedir(), '.claude', 'projects');

/**
 * Normalize model ID to a short human-readable name.
 * "claude-opus-4-6" -> "Opus 4.6"
 * "claude-opus-4-5-20251101" -> "Opus 4.5"
 * "claude-haiku-4-5-20251001" -> "Haiku 4.5"
 */
function normalizeModel(raw) {
  // Strip date suffix
  const base = raw.replace(/-20\d{6}$/, '');
  // "claude-opus-4-6" -> split by "-"
  const parts = base.replace(/^claude-/, '').split('-');
  // parts = ["opus", "4", "6"] or ["sonnet", "4", "5"]
  if (parts.length >= 3) {
    const tier = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const major = parts[1];
    const minor = parts[2];
    return `${tier} ${major}.${minor}`;
  }
  return base;
}

function scanProjects(dir) {
  const sessions = [];
  let projectDirs;
  try {
    projectDirs = readdirSync(dir);
  } catch {
    return sessions;
  }

  for (const projDir of projectDirs) {
    const projPath = join(dir, projDir);
    let entries;
    try {
      const stat = statSync(projPath);
      if (!stat.isDirectory()) continue;
      entries = readdirSync(projPath);
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.endsWith('.jsonl')) continue;
      const filePath = join(projPath, entry);
      try {
        const stat = statSync(filePath);
        if (!stat.isFile()) continue;
      } catch {
        continue;
      }

      let content;
      try {
        content = readFileSync(filePath, 'utf8');
      } catch {
        continue;
      }

      // Extract all model references and find the dominant one
      const modelMatches = content.match(/"model":"claude-[^"]+"/g);
      if (!modelMatches || modelMatches.length === 0) continue;

      // Count each model
      const modelCount = {};
      for (const m of modelMatches) {
        const rawModel = m.replace('"model":"', '').replace('"', '');
        const normalized = normalizeModel(rawModel);
        modelCount[normalized] = (modelCount[normalized] || 0) + 1;
      }

      // Primary model for this session = most frequent
      const primaryModel = Object.entries(modelCount).sort((a, b) => b[1] - a[1])[0][0];

      // Get first timestamp for timeline
      let firstTs = null;
      const tsMatch = content.match(/"timestamp":"([^"]+)"/);
      if (tsMatch) firstTs = new Date(tsMatch[1]);

      sessions.push({ model: primaryModel, date: firstTs, modelCount });
    }
  }

  return sessions;
}

const sessions = scanProjects(claudeDir);

if (sessions.length === 0) {
  console.error('No session files with model data found.');
  process.exit(1);
}

// Aggregate by model
const modelTotals = {};
for (const s of sessions) {
  modelTotals[s.model] = (modelTotals[s.model] || 0) + 1;
}

const sortedModels = Object.entries(modelTotals).sort((a, b) => b[1] - a[1]);
const total = sessions.length;

// Most recent session's model = "current"
const sortedByDate = sessions.filter(s => s.date).sort((a, b) => b.date - a.date);
const currentModel = sortedByDate.length > 0 ? sortedByDate[0].model : null;

if (jsonMode) {
  console.log(JSON.stringify({
    total_sessions: total,
    current_model: currentModel,
    primary_model: sortedModels[0]?.[0],
    distribution: sortedModels.map(([model, count]) => ({
      model,
      sessions: count,
      pct: Math.round(count / total * 100),
    })),
  }, null, 2));
  process.exit(0);
}

// Timeline mode
if (timelineMode) {
  function getISOWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }

  // Group by week, track model usage
  const weekData = {};
  for (const s of sessions) {
    if (!s.date) continue;
    const wk = getISOWeek(s.date);
    if (!weekData[wk]) weekData[wk] = {};
    weekData[wk][s.model] = (weekData[wk][s.model] || 0) + 1;
  }

  const weeks = Object.keys(weekData).sort();
  if (weeks.length === 0) {
    console.log('No timeline data available.');
    process.exit(0);
  }

  // Only show last 12 weeks
  const recentWeeks = weeks.slice(-12);
  const allModels = [...new Set(sessions.map(s => s.model))].sort();
  const modelColors = ['Opus', 'Sonnet', 'Haiku'];

  console.log('cc-model — Week-by-week model usage\n');
  for (const wk of recentWeeks) {
    const data = weekData[wk];
    const wkTotal = Object.values(data).reduce((a, b) => a + b, 0);
    const dominant = Object.entries(data).sort((a, b) => b[1] - a[1])[0][0];
    const models = Object.entries(data).sort((a, b) => b[1] - a[1])
      .map(([m, c]) => `${m}×${c}`)
      .join('  ');
    console.log(`  ${wk}  ${String(wkTotal).padStart(3)}  ${models}`);
  }
  process.exit(0);
}

// Default: distribution chart
const BAR_WIDTH = 28;
const maxCount = sortedModels[0]?.[1] || 1;

function bar(count) {
  const filled = Math.round((count / maxCount) * BAR_WIDTH);
  return '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
}

function rpad(str, len) {
  return str + ' '.repeat(Math.max(0, len - str.length));
}

// Find max label length
const maxLabel = Math.max(...sortedModels.map(([m]) => m.length));

console.log('cc-model — Which Claude models power your sessions\n');

for (const [model, count] of sortedModels) {
  const label = rpad(model, maxLabel);
  const countStr = String(count).padStart(4);
  const pct = (count / total * 100).toFixed(0).padStart(3);
  console.log(`  ${label}  ${bar(count)}  ${countStr}  (${pct}%)`);
}

console.log('\n' + '─'.repeat(55));
console.log(`  Total sessions: ${total}`);
if (currentModel) console.log(`  Current model:  ${currentModel}`);
console.log(`  Primary model:  ${sortedModels[0]?.[0]} (${sortedModels[0]?.[1]} sessions)`);
console.log(`\n  Run with --timeline to see week-by-week model history`);
