/* Проверка баланса на фиксированных сидах.
   Сравнивает винрейты с эталоном из game-lab/arena/expected-balance.json.

   node game-lab/tools/balance-check.mjs            — сравнить с эталоном
   node game-lab/tools/balance-check.mjs --update   — записать новый эталон
*/

import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const E = require('../arena/engine.js');
const D = require('../arena/game-data.js');

const BASE = 'game-lab/arena/expected-balance.json';
const GAMES = Number(process.env.GAMES || 1500);
const SEED = Number(process.env.SEED || 910000);
const TOLERANCE = Number(process.env.TOLERANCE || 2);

const update = process.argv.includes('--update');

const wins = new Map();
const plays = new Map();
let done = 0;
let rounds = 0;

for (let i = 0; i < GAMES; i++) {
  const s = E.newGame({ count: 4, seed: SEED + i });
  E.runBotsPick(s, -1);
  let guard = 0;
  while (!E.isOver(s) && guard++ < 3000) {
    const mv = E.botMove(s, 1);
    if (!mv) break;
    const res = E.apply(s, mv.action, mv.picks);
    if (!res.ok) break;
  }
  for (const p of s.players) plays.set(p.name, (plays.get(p.name) || 0) + 1);
  if (!E.isOver(s) || s.winner === null) continue;
  done++;
  rounds += s.round;
  const winner = s.players[s.winner].name;
  wins.set(winner, (wins.get(winner) || 0) + 1);
}

const current = {};
for (const ch of D.CHARACTERS) {
  const w = wins.get(ch.name) || 0;
  const p = plays.get(ch.name) || 0;
  current[ch.name] = p ? Number(((w / p) * 100).toFixed(1)) : 0;
}

const avgRounds = done ? Number((rounds / done).toFixed(1)) : 0;
const values = Object.values(current);
const spread = Number((Math.max(...values) - Math.min(...values)).toFixed(1));

if (update || !fs.existsSync(BASE)) {
  fs.writeFileSync(BASE, JSON.stringify({ games: GAMES, seed: SEED, avgRounds, spread, rates: current }, null, 2) + '\n', 'utf8');
  console.log('эталон записан: партий ' + done + ', длина ' + avgRounds + ', разброс ' + spread);
  process.exit(0);
}

const ref = JSON.parse(fs.readFileSync(BASE, 'utf8'));
const problems = [];

for (const ch of D.CHARACTERS) {
  const now = current[ch.name];
  const was = ref.rates[ch.name];
  if (was === undefined) {
    problems.push(ch.name + ': нет в эталоне');
    continue;
  }
  const diff = Math.abs(now - was);
  if (diff > TOLERANCE) {
    problems.push(ch.name + ': было ' + was + '%, стало ' + now + '%');
  }
}

if (Math.abs(spread - ref.spread) > TOLERANCE * 2) {
  problems.push('разброс: было ' + ref.spread + ', стало ' + spread);
}
if (Math.abs(avgRounds - ref.avgRounds) > 2) {
  problems.push('длина партии: было ' + ref.avgRounds + ', стало ' + avgRounds);
}

console.log('партий ' + done + ', длина ' + avgRounds + ', разброс ' + spread);

if (problems.length) {
  console.log('БАЛАНС ИЗМЕНИЛСЯ:');
  for (const p of problems) console.log('  ' + p);
  console.log('если так и задумано — обновите эталон: node game-lab/tools/balance-check.mjs --update');
  process.exit(1);
}

console.log('баланс совпадает с эталоном');
