import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const E = require('../arena/engine.js');
const D = require('../arena/game-data.js');

const N = 1200;
const wins = new Map();
const plays = new Map();
for (let i = 0; i < N; i++) {
  const s = E.newGame({ count: 4, seed: 900000 + i });
  let g = 0;
  while (!E.isOver(s) && g++ < 5000) {
    const mv = E.botMove(s, 1);
    if (!mv) break;
    E.apply(s, mv.action, mv.picks);
  }
  if (!E.isOver(s) || s.winner === null) continue;
  wins.set(s.players[s.winner].name, (wins.get(s.players[s.winner].name) || 0) + 1);
  for (const p of s.players) plays.set(p.name, (plays.get(p.name) || 0) + 1);
}
const rate = (n) => (wins.get(n) || 0) / (plays.get(n) || 1);
const pct = (x) => (x * 100).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';

const byArch = new Map();
for (const c of D.CHARACTERS) {
  const a = byArch.get(c.archetype) || { sum: 0, n: 0 };
  a.sum += rate(c.name);
  a.n++;
  byArch.set(c.archetype, a);
}

// --- документ по классам
const classes = {
  title: 'Персонажи по классам',
  blocks: [
    { kind: 'p', text: 'Двенадцать персонажей сведены в пять классов. Замер на ' + N + ' партиях по четыре игрока, норма для каждого — 25%.' },
    { kind: 'p', text: 'Класс ставился по телу и по смыслу способностей. Мир остаётся вторым признаком: он определяет, какие артефакты персонажу бесплатны.' }
  ]
};
for (const k of Object.keys(D.ARCHETYPES)) {
  const list = D.CHARACTERS.filter((c) => c.archetype === k).sort((a, b) => rate(b.name) - rate(a.name));
  if (!list.length) continue;
  const a = byArch.get(k);
  classes.blocks.push({ kind: 'h', text: D.ARCHETYPES[k] + ' — средняя доля ' + pct(a.sum / a.n) });
  for (const c of list) {
    classes.blocks.push({
      kind: 'b',
      bold: c.name + ' (' + c.hp + ', ' + c.dmg + ', ' + c.mana + ', ' + c.mental + ').',
      text: ' ' + D.WORLDS[c.world] + '. ' + c.abilities.map((x) => x.name).join(', ') + '. Побед ' + pct(rate(c.name)) + '.'
    });
  }
}
classes.blocks.push({ kind: 'h', text: 'Что это показывает' });
classes.blocks.push({
  kind: 'p',
  text: 'Классы неравны: ' + Object.keys(D.ARCHETYPES).filter((k) => byArch.has(k)).map((k) => D.ARCHETYPES[k] + ' ' + pct(byArch.get(k).sum / byArch.get(k).n)).join(', ') + ' при норме 25%.'
});
classes.blocks.push({
  kind: 'p',
  text: 'Главный рычаг — произведение здоровья на урон. У танков оно выше всех, у магов и ловкачей ниже, и доля побед повторяет этот порядок.'
});
fs.writeFileSync('game-lab/rules/classes-doc.json', JSON.stringify(classes, null, 2), 'utf8');

// --- документ по пулу
const pool = {
  title: 'Способности: общий пул',
  blocks: [
    { kind: 'p', text: 'Всего ' + D.POOL.length + ' карт. В основном правиле способности личные и записаны в карточке персонажа. Этот пул — библиотека, из которой наборы собраны и будут расширяться.' },
    { kind: 'p', text: 'Отдельно существует экспериментальный режим драфта: перед партией игрок набирает три карты из пула. По умолчанию он выключен, потому что даёт преимущество первому месту.' }
  ]
};
for (const w of Object.keys(D.WORLDS)) {
  pool.blocks.push({ kind: 'h', text: D.WORLDS[w] });
  for (const a of D.POOL.filter((x) => x.world === w)) {
    pool.blocks.push({ kind: 'b', bold: a.name + ' — ' + a.cost + ' энергии.', text: ' ' + a.desc + (a.neighborsOnly ? ' Только сосед.' : '') });
  }
}
fs.writeFileSync('game-lab/rules/pool-doc.json', JSON.stringify(pool, null, 2), 'utf8');

console.log('JSON для документов готов');
