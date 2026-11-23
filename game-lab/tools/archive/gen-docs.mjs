import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const E = require('../arena/engine.js');
const D = require('../arena/game-data.js');

const N = Number(process.argv[2] || 1500);
const COUNT = 4;

// --- замер
const wins = new Map();
const plays = new Map();
const use = new Map();
let rounds = 0;
let done = 0;
let maxR = 0;

for (let i = 0; i < N; i++) {
  const s = E.newGame({ count: COUNT, seed: 900000 + i });
  E.runBotsPick(s, -1);
  let g = 0;
  while (!E.isOver(s) && g++ < 5000) {
    const mv = E.botMove(s, 1);
    if (!mv) break;
    if (mv.action === 'ability') {
      const ab = E.me(s).abilities[mv.picks.ability];
      if (ab) use.set(ab.name, (use.get(ab.name) || 0) + 1);
    }
    E.apply(s, mv.action, mv.picks);
  }
  if (!E.isOver(s) || s.winner === null) continue;
  done++;
  rounds += s.round;
  maxR = Math.max(maxR, s.round);
  wins.set(s.players[s.winner].name, (wins.get(s.players[s.winner].name) || 0) + 1);
  for (const p of s.players) plays.set(p.name, (plays.get(p.name) || 0) + 1);
}

const rate = (name) => (wins.get(name) || 0) / (plays.get(name) || 1);
const pct = (x) => (x * 100).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
const avgLen = (rounds / done).toFixed(1);

const byArch = new Map();
for (const c of D.CHARACTERS) {
  const a = byArch.get(c.archetype) || { sum: 0, n: 0, names: [] };
  a.sum += rate(c.name);
  a.n++;
  a.names.push(c.name);
  byArch.set(c.archetype, a);
}
const archAvg = (k) => byArch.get(k).sum / byArch.get(k).n;

const chars = D.CHARACTERS.slice().sort((a, b) => rate(b.name) - rate(a.name));
const spread = (rate(chars[0].name) - rate(chars[chars.length - 1].name)) * 100;

// --- personazhi.md
let person = `# Персонажи: все двенадцать

Числа взяты из данных игры и замера на ${N} партиях по ${COUNT} игрока. По классам — в [arhetipy.md](arhetipy.md).

Порядок в блоке: здоровье, урон, менталка, энергия. Ресурс на способности называется энергией у всех.

## По мирам

`;
for (const w of Object.keys(D.WORLDS)) {
  person += `### ${D.WORLDS[w]}\n\n`;
  for (const c of D.CHARACTERS.filter((x) => x.world === w)) {
    person += `**${c.name}** — ${D.ARCHETYPES[c.archetype]}. Здоровье ${c.hp}, урон ${c.dmg}, менталка ${c.mental}, энергия ${c.mana}. Побед ${pct(rate(c.name))}.\n`;
    for (const a of c.abilities) {
      person += `- ${a.name}, ${a.cost} — ${a.desc}${a.neighborsOnly ? ' Только сосед.' : ''}\n`;
    }
    person += '\n';
  }
}

person += `## Сводка

| Персонаж | Класс | Здоровье | Урон | Энергия | Побед |
| --- | --- | --- | --- | --- | --- |
`;
for (const c of chars) {
  person += `| ${c.name} | ${D.ARCHETYPES[c.archetype]} | ${c.hp} | ${c.dmg} | ${c.mana} | ${pct(rate(c.name))} |\n`;
}

person += `
## Что видно по цифрам

Разброс между лучшим и худшим — ${spread.toFixed(0)} процентных пунктов при норме ${(100 / COUNT).toFixed(0)}%.
Средняя партия — ${avgLen} круга, самая длинная ${maxR}.

Числа способностей, не указанные в набросках, проставлены по единице. Менталка и энергия части персонажей назначены мной.
`;

fs.writeFileSync('game-lab/docs/Персонажи/Персонажи — сводка.md', person, 'utf8');

// --- arhetipy.md
let arch = `# Персонажи по классам

Пять классов. Замер на ${N} партиях, норма ${(100 / COUNT).toFixed(0)}%.

`;
for (const k of Object.keys(D.ARCHETYPES)) {
  const list = D.CHARACTERS.filter((c) => c.archetype === k).sort((a, b) => rate(b.name) - rate(a.name));
  if (!list.length) continue;
  arch += `## ${D.ARCHETYPES[k]} — ${list.length === 1 ? 'один' : list.length === 2 ? 'двое' : 'трое'}\n\n`;
  arch += `Средняя доля класса — ${pct(archAvg(k))}.\n\n`;
  for (const c of list) {
    arch += `- **${c.name}** (${c.hp}, ${c.dmg}, ${c.mana}, ${c.mental}), ${D.WORLDS[c.world]}. ${c.abilities.map((a) => a.name).join(', ')}. Побед ${pct(rate(c.name))}.\n`;
  }
  arch += '\n';
}

arch += `## Что это показывает

Классы неравны: ${Object.keys(D.ARCHETYPES)
  .filter((k) => byArch.has(k))
  .map((k) => D.ARCHETYPES[k] + ' ' + pct(archAvg(k)))
  .join(', ')}.

Разброс между персонажами — ${spread.toFixed(0)} процентных пунктов.

Главный рычаг сейчас — произведение здоровья на урон. Ниже таблица по персонажам.

| Персонаж | Класс | Здоровье × урон |
| --- | --- | --- |
`;
for (const c of D.CHARACTERS.slice().sort((a, b) => b.hp * b.dmg - a.hp * a.dmg)) {
  arch += `| ${c.name} | ${D.ARCHETYPES[c.archetype]} | ${c.hp * c.dmg} |\n`;
}
fs.writeFileSync('game-lab/docs/Персонажи/Персонажи по классам.md', arch, 'utf8');

// --- sposobnosti.md
let pool = `# Пул способностей\n\nВсего ${D.POOL.length} карт. В основном правиле способности личные; пул используется в экспериментальном режиме драфта.\n\n`;
for (const w of Object.keys(D.WORLDS)) {
  pool += `## ${D.WORLDS[w]}\n\n`;
  for (const a of D.POOL.filter((x) => x.world === w)) {
    pool += `- **${a.name}** — ${a.cost} энергии, сыграна ${use.get(a.name) || 0} раз — ${a.desc}\n`;
  }
  pool += '\n';
}
fs.writeFileSync('game-lab/docs/Игровой процесс/Способности — пул.md', pool, 'utf8');

console.log('готово: Персонажи — сводка.md, Персонажи по классам.md, Способности — пул.md');
console.log('партий: ' + done + ', средняя длина: ' + avgLen + ', разброс: ' + spread.toFixed(0) + ' п.п.');
for (const k of Object.keys(D.ARCHETYPES)) if (byArch.has(k)) console.log('  ' + D.ARCHETYPES[k].padEnd(13) + pct(archAvg(k)));
