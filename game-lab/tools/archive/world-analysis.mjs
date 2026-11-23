/* Считает винрейты персонажей по мирам на нескольких прогонах. */

import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const D = require('../arena/game-data.js');

const files = fs.readdirSync('game-lab/sim-data')
  .filter((f) => f.startsWith('0-0-5'))
  .sort()
  .slice(-6)
  .map((f) => 'game-lab/sim-data/' + f);

const agg = new Map();
for (const file of files) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const c of d.characters || []) {
    const cur = agg.get(c.name) || { wins: 0, plays: 0 };
    cur.wins += c.wins;
    cur.plays += c.played;
    agg.set(c.name, cur);
  }
}

const rows = [];
for (const ch of D.CHARACTERS) {
  const a = agg.get(ch.name);
  if (!a || !a.plays) continue;
  rows.push({
    name: ch.name,
    world: D.WORLDS[ch.world],
    rate: (a.wins / a.plays) * 100,
    plays: a.plays
  });
}

rows.sort((a, b) => b.rate - a.rate);
console.log('файлов: ' + files.length);
console.log('\nпо персонажам:');
for (const r of rows) {
  console.log('  ' + r.name.padEnd(16) + r.world.padEnd(24) + r.rate.toFixed(1) + '%  (' + r.plays + ' партий)');
}

const byWorld = new Map();
for (const r of rows) {
  const cur = byWorld.get(r.world) || { sum: 0, n: 0, plays: 0 };
  cur.sum += r.rate;
  cur.n++;
  cur.plays += r.plays;
  byWorld.set(r.world, cur);
}

console.log('\nпо мирам:');
for (const [world, v] of [...byWorld.entries()].sort((a, b) => b[1].sum / b[1].n - a[1].sum / a[1].n)) {
  console.log('  ' + world.padEnd(24) + (v.sum / v.n).toFixed(1) + '%');
}
