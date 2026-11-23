/* Сравнение порога менталки: 0 (как в черновиках), 3 и 4 у всех.
   Запуск: node game-lab/arena/tools/mental-check.mjs [партий] */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const E = require(path.join(here, '..', 'engine.js'));
const D = require(path.join(here, '..', 'game-data.js'));

const N = Number(process.argv[2] || 1500);

function run(floor) {
  const actions = new Map();
  const wins = new Map();
  const plays = new Map();
  let rounds = 0;
  let done = 0;
  let artifacts = 0;

  for (let i = 0; i < N; i++) {
    const s = E.newGame({ legacyAbilities: true, count: 4, seed: 500000 + i, mentalFloor: floor });
    let guard = 0;
    while (!E.isOver(s) && guard++ < 3000) {
      const mv = E.botMove(s, 1);
      if (!mv) break;
      actions.set(mv.action, (actions.get(mv.action) || 0) + 1);
      if (mv.action === 'useArtifact') artifacts++;
      E.apply(s, mv.action, mv.picks);
    }
    if (!E.isOver(s)) continue;
    done++;
    rounds += s.round;
    const w = s.players[s.winner];
    wins.set(w.name, (wins.get(w.name) || 0) + 1);
    for (const p of s.players) plays.set(p.name, (plays.get(p.name) || 0) + 1);
  }

  const total = [...actions.values()].reduce((a, b) => a + b, 0) || 1;
  const pct = (k) => (((actions.get(k) || 0) / total) * 100).toFixed(1);

  const rows = D.CHARACTERS.map((ch) => {
    const p = plays.get(ch.name) || 0;
    const w = wins.get(ch.name) || 0;
    return { name: ch.name, power: ch.hp * ch.dmg, share: p ? w / p : 0, plays: p };
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
  const shares = rows.map((r) => r.share);
  return {
    artifact: pct('useArtifact'),
    ability: pct('ability'),
    attack: pct('attack'),
    take: pct('take'),
    length: (rounds / (done || 1)).toFixed(1),
    spread: ((Math.max(...shares) - Math.min(...shares)) * 100).toFixed(0),
    corr: (num / Math.sqrt(dx * dy)).toFixed(2),
    artifacts,
    rows: rows.sort((a, b) => b.share - a.share)
  };
}

console.log('Порог менталки: ' + N + ' партий на каждый вариант, четверо за столом, норма 25%.');
console.log('');
for (const floor of [0, 3, 4]) {
  const r = run(floor);
  const title = floor === 0 ? 'как в черновиках (у восьми ноль)' : 'минимум ' + floor + ' каждому';
  console.log('=== ' + title);
  console.log('  действия: атака ' + r.attack + '%, способность ' + r.ability + '%, артефакт ' + r.artifact + '%, добор ' + r.take + '%.');
  console.log('  артефактов применено: ' + r.artifacts + '. Длина партии: ' + r.length + ' кругов.');
  console.log('  разброс побед: ' + r.spread + ' п.п. Связь с «здоровье × урон»: ' + r.corr + '.');
  console.log('  верх: ' + r.rows.slice(0, 3).map((x) => x.name + ' ' + (x.share * 100).toFixed(0) + '%').join(', '));
  console.log('  низ: ' + r.rows.slice(-3).map((x) => x.name + ' ' + (x.share * 100).toFixed(0) + '%').join(', '));
  console.log('');
}
