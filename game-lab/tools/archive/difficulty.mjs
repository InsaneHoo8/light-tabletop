/* Насколько результат персонажа зависит от стиля игры. */

import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const D = require('../arena/game-data.js');

const files = fs.readdirSync('game-lab/sim-data').filter((f) => f.endsWith('.json'));
const agg = new Map();

for (const f of files) {
  const d = JSON.parse(fs.readFileSync('game-lab/sim-data/' + f, 'utf8'));
  for (const row of d.styleMatrix || []) {
    const key = row.name + '|' + row.style;
    const cur = agg.get(key) || { wins: 0, plays: 0 };
    cur.wins += row.wins;
    cur.plays += row.plays;
    agg.set(key, cur);
  }
}

const STYLES = ['aggro', 'caution', 'normal'];
const rows = [];

for (const ch of D.CHARACTERS) {
  const values = [];
  for (const st of STYLES) {
    const a = agg.get(ch.name + '|' + st);
    if (a && a.plays >= 100) values.push((a.wins / a.plays) * 100);
  }
  if (values.length < 2) continue;
  const best = Math.max(...values);
  const worst = Math.min(...values);
  rows.push({ name: ch.name, best, worst, spread: best - worst, avg: values.reduce((s, x) => s + x, 0) / values.length });
}

rows.sort((a, b) => b.spread - a.spread);
console.log('персонаж | лучший стиль | худший | разница | средний');
for (const r of rows) {
  console.log(
    '  ' + r.name.padEnd(16) +
    r.best.toFixed(1).padStart(6) +
    r.worst.toFixed(1).padStart(8) +
    r.spread.toFixed(1).padStart(8) +
    r.avg.toFixed(1).padStart(8)
  );
}
