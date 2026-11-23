/* Сравнение стартовой раздачи. Главный вопрос: снимает ли она преимущество первого хода.
   Запуск: node game-lab/arena/tools/variants.mjs [партий] */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const E = require(path.join(here, '..', 'engine.js'));
const D = require(path.join(here, '..', 'game-data.js'));

const N = Number(process.argv[2] || 800);

const VARIANTS = [
  { name: 'без стартовых карт', mode: 'none' },
  { name: 'всем по одной', mode: 'equal' },
  { name: 'по месту: первый 0, последний 2', mode: 'position' }
];

function run(mode, count) {
  const actions = new Map();
  const wins = new Map();
  const plays = new Map();
  const seatWins = new Array(count).fill(0);
  const seatPlays = new Array(count).fill(0);
  let rounds = 0;
  let finished = 0;

  for (let i = 0; i < N; i++) {
    const s = E.newGame({ count, seed: 500000 + i, startHandMode: mode });
    E.runBotsPick(s, -1);
    let guard = 0;
    while (!E.isOver(s) && guard++ < 3000) {
      const mv = E.botMove(s, 1);
      if (!mv) break;
      actions.set(mv.action, (actions.get(mv.action) || 0) + 1);
      E.apply(s, mv.action, mv.picks);
    }
    if (!E.isOver(s)) continue;
    finished++;
    rounds += s.round;
    seatWins[s.winner]++;
    const w = s.players[s.winner];
    wins.set(w.name, (wins.get(w.name) || 0) + 1);
    for (const p of s.players) {
      plays.set(p.name, (plays.get(p.name) || 0) + 1);
      seatPlays[p.idx]++;
    }
  }

  const total = [...actions.values()].reduce((a, b) => a + b, 0) || 1;
  const pct = (k) => (((actions.get(k) || 0) / total) * 100).toFixed(1);

  const rows = D.CHARACTERS.map((ch) => {
    const p = plays.get(ch.name) || 0;
    const w = wins.get(ch.name) || 0;
    return { power: ch.hp * ch.dmg, share: p ? w / p : 0, plays: p };
  }).filter((r) => r.plays > 0);
  const shares = rows.map((r) => r.share);
  const spread = (Math.max(...shares) - Math.min(...shares)) * 100;

  return {
    seat0: ((seatWins[0] / (seatPlays[0] || 1)) * 100).toFixed(1),
    seats: seatWins.map((w, i) => ((w / (seatPlays[i] || 1)) * 100).toFixed(1)).join(', '),
    attack: pct('attack'),
    ability: pct('ability'),
    artifact: pct('useArtifact'),
    take: pct('take'),
    avgRound: (rounds / (finished || 1)).toFixed(1),
    spread: spread.toFixed(0)
  };
}

for (const count of (process.argv[3] || '4,6').split(',').map(Number)) {
  console.log('=== ' + count + ' игрока, ' + N + ' партий на вариант. Норма для первого места: ' + (100 / count).toFixed(1) + '%.');
  console.log('');
  for (const v of VARIANTS) {
    const r = run(v.mode, count);
    console.log(v.name);
    console.log('  побед первого места: ' + r.seat0 + '%. По местам: ' + r.seats + '%.');
    console.log('  действия: атака ' + r.attack + '%, способности ' + r.ability + '%, артефакты ' + r.artifact + '%, добор ' + r.take + '%.');
    console.log('  длина партии: ' + r.avgRound + ' кругов. Разброс персонажей: ' + r.spread + ' п.п.');
    console.log('');
  }
}
