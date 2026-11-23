/* Автопрогон «Арены»: тысячи партий ботами и текстовый отчёт.
   Запуск: node game-lab/arena/tools/sim.mjs [число партий] [игроков] */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const E = require(path.join(here, '..', 'engine.js'));
const D = require(path.join(here, '..', 'game-data.js'));

const N = Number(process.argv[2] || 2000);
const COUNT = Number(process.argv[3] || 4);
const NOISE = process.argv[4] === undefined ? 1 : Number(process.argv[4]);
/* 'nocyber' | 'nospace' — контрольный прогон без набора; можно перечислить через запятую. */
const GROUPS = {
  nocyber: ['drones', 'energocell', 'freeze'],
  nospace: ['railgun', 'life', 'emp'],
  noearth: ['uvolnenie', 'autsors', 'sozvon']
};
const EXCLUDE = (process.argv[5] || '')
  .split(',')
  .reduce((acc, k) => acc.concat(GROUPS[k] || []), []);
const START_HAND = Number(process.argv[6] || 0);
const TAKE_COUNT = Number(process.argv[7] || 1);
const AUTO_DRAW = process.argv[8] === 'auto';
const START_MODE = process.argv[9] || 'position';
const EX = process.argv[10];
const EXCHANGE = EX === 'manax' ? 'mana' : EX === 'hpx' ? 'hp' : 'rule';

const winsByChar = new Map();
const playsByChar = new Map();
const winsBySeat = new Array(COUNT).fill(0);
const actionCount = new Map();
const abilityUse = new Map();
const abilitySeen = new Map();
const artifactUse = new Map();
const artifactTraded = new Map();
const rounds = [];
const leftoverHp = [];
const firstOut = new Map();
let stalls = 0;
let draws = 0;

for (let i = 0; i < N; i++) {
  const s = E.newGame({
    count: COUNT,
    seed: 500000 + i,
    exclude: EXCLUDE,
    startHand: START_HAND > 0 ? START_HAND : undefined,
    startHandMode: START_HAND ? undefined : START_MODE,
    takeCount: TAKE_COUNT,
    autoDraw: AUTO_DRAW,
    exchangeGives: EXCHANGE,
    draftStart: process.argv[11] || 'first',
    draft: process.argv[12] === 'draft'
  });
  if (process.argv[12] === 'draft') E.runBotsDraft(s, -1);
  E.runBotsPick(s, -1);
  let guard = 0;
  let turns = 0;
  while (!E.isOver(s) && guard++ < 3000) {
    const mv = E.botMove(s, NOISE);
    if (!mv) break;
    const p = E.me(s);
    actionCount.set(mv.action, (actionCount.get(mv.action) || 0) + 1);
    if (mv.action === 'ability') {
      const ab = p.abilities[mv.picks.ability];
      const key = ab.name;
      abilityUse.set(key, (abilityUse.get(key) || 0) + 1);
      abilitySeen.set(key, true);
    }
    if (mv.action === 'useArtifact') {
      const art = D.artifactById(p.hand[mv.picks.artifact]);
      artifactUse.set(art.name, (artifactUse.get(art.name) || 0) + 1);
    }
    if (mv.action === 'exchange') {
      const idx = mv.picks.artifact === undefined || mv.picks.artifact === null ? 0 : mv.picks.artifact;
      const art = D.artifactById(p.hand[idx]);
      if (art) artifactTraded.set(art.name, (artifactTraded.get(art.name) || 0) + 1);
    }
    if (!E.isOver(s)) turns++;
    E.apply(s, mv.action, mv.picks);
  }
  if (!E.isOver(s)) {
    stalls++;
    continue;
  }
  rounds.push(s.round);
  const w = s.players[s.winner];
  if (!w) { draws++; continue; }
  winsByChar.set(w.name, (winsByChar.get(w.name) || 0) + 1);
  winsBySeat[s.winner]++;
  leftoverHp.push(w.hp);
  firstOut.set(s.players[0].name, firstOut.get(s.players[0].name) || 0);
  for (const p of s.players) {
    playsByChar.set(p.name, (playsByChar.get(p.name) || 0) + 1);
  }
}

const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const sorted = (m) =>
  [...m.entries()].sort((a, b) => b[1] - a[1]);

console.log('Автопрогон: ' + N + ' партий, ' + COUNT + ' игрока за столом, шум политики ' + NOISE + '.');
console.log('Зависаний: ' + stalls + ', ничьих: ' + draws);
console.log('Длина партии: средняя ' + avg(rounds).toFixed(1) + ' кругов, медиана ' + (rounds.sort((a, b) => a - b)[Math.floor(rounds.length / 2)] || 0) + ', максимум ' + Math.max(0, ...rounds) + '.');
console.log('Здоровье победителя в конце: в среднем ' + avg(leftoverHp).toFixed(1) + '.');
console.log('');

console.log('Победы по персонажам (побед / участий, доля):');
for (const [name, wins] of sorted(winsByChar)) {
  const plays = playsByChar.get(name) || 1;
  console.log('  ' + name.padEnd(20) + String(wins).padStart(5) + ' / ' + String(plays).padStart(6) + '   ' + ((wins / plays) * 100).toFixed(1) + '%');
}
const never = [...playsByChar.keys()].filter((n) => !winsByChar.has(n));
if (never.length) console.log('  ни разу не побеждали: ' + never.join(', '));

console.log('');
console.log('Победы по месту за столом: ' + winsBySeat.map((v, i) => i + ': ' + v).join(', '));

console.log('');
console.log('Частота действий:');
for (const [k, v] of sorted(actionCount)) {
  const total = [...actionCount.values()].reduce((a, b) => a + b, 0);
  console.log('  ' + k.padEnd(14) + String(v).padStart(7) + '   ' + ((v / total) * 100).toFixed(1) + '%');
}

console.log('');
console.log('Использовано способностей:');
const allAbilities = D.POOL.map((a) => a.name);
for (const key of allAbilities) {
  const used = abilityUse.get(key) || 0;
  console.log('  ' + (used === 0 ? 'НЕ ИСПОЛЬЗОВАНА ' : '') + key.padEnd(46) + String(used).padStart(7));
}

console.log('');
console.log('Использовано артефактов (и сколько раз обменяно на ману):');
const tradedNames = new Set([...artifactUse.keys(), ...artifactTraded.keys()]);
for (const name of [...tradedNames].sort((a, b) => (artifactUse.get(b) || 0) - (artifactUse.get(a) || 0))) {
  const used = artifactUse.get(name) || 0;
  const traded = artifactTraded.get(name) || 0;
  console.log('  ' + name.padEnd(30) + 'играли ' + String(used).padStart(4) + ', сожгли ' + String(traded).padStart(5));
}

/* --- Насколько исход предсказуем простым произведением здоровья на урон --- */
const rows = D.CHARACTERS.map((ch) => {
  const plays = playsByChar.get(ch.name) || 0;
  const wins = winsByChar.get(ch.name) || 0;
  return { name: ch.name, power: ch.hp * ch.dmg, share: plays ? wins / plays : 0, plays };
}).filter((r) => r.plays > 0);

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const mx = mean(rows.map((r) => r.power));
const my = mean(rows.map((r) => r.share));
let num = 0;
let dx = 0;
let dy = 0;
for (const r of rows) {
  num += (r.power - mx) * (r.share - my);
  dx += (r.power - mx) ** 2;
  dy += (r.share - my) ** 2;
}
const corr = num / Math.sqrt(dx * dy);

console.log('');
console.log('Здоровье умножить на урон, против доли побед:');
for (const r of rows.sort((a, b) => b.power - a.power)) {
  console.log('  ' + r.name.padEnd(20) + String(r.power).padStart(4) + '   ' + (r.share * 100).toFixed(1) + '%');
}
console.log('  корреляция: ' + corr.toFixed(2) + ' (1 — исход полностью задан этими двумя числами)');
