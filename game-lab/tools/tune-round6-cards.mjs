import fs from 'node:fs';

/* ---------- данные ---------- */
const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

function repCard(old, neu, label) {
  if (!c.includes(old)) throw new Error('не найдено: ' + label);
  c = c.replace(old, neu);
  console.log('ok: ' + label);
}

/* Люся: токсичный коммент 1 урон, минус 1 менталка, минус 1 энергия */
repCard("ops: [{ t: 'dmg', who: 'target', n: 2 }, { t: 'mental', who: 'target', n: -2 }, { t: 'energy', who: 'target', n: -1 }]",
  "ops: [{ t: 'dmg', who: 'target', n: 1 }, { t: 'mental', who: 'target', n: -1 }, { t: 'energy', who: 'target', n: -1 }]",
  'Люся: токсичный коммент');

/* Люся: отмена — 4 урона, вся менталка, половина артефактов с округлением вверх */
repCard("ops: [{ t: 'dmg', who: 'target', n: 5 }, { t: 'mental', who: 'target', n: -99 }, { t: 'discardAllArtifacts', who: 'target' }]",
  "ops: [{ t: 'dmg', who: 'target', n: 4 }, { t: 'mental', who: 'target', n: -99 }, { t: 'discardHalfArtifacts', who: 'target' }]",
  'Люся: отмена в прямом эфире');

/* Хром: хладагент 1 урон */
repCard("ops: [{ t: 'purge' }, { t: 'dmg', who: 'neighbors', n: 2 }]",
  "ops: [{ t: 'purge' }, { t: 'dmg', who: 'neighbors', n: 1 }]",
  'Хром: выброс хладагента');

/* Хром: стена за 2 энергии */
repCard("{ id: 'stena', name: 'Защитный протокол «Стена»', cost: 1,",
  "{ id: 'stena', name: 'Защитный протокол «Стена»', cost: 2,",
  'Хром: стена за две энергии');

/* Боря: новая пассивка */
const bAt = c.indexOf("id: 'borya'");
const bEnd = c.indexOf('abilities: [', bAt);
let bBlock = c.slice(bAt, bEnd);
bBlock = bBlock.replace(/passive: '[^']*'/,
  "passive: 'За каждые две недостающие от максимума единицы энергии получает на единицу меньше урона от любых источников, но не меньше одной единицы.'");
c = c.slice(0, bAt) + bBlock + c.slice(bEnd);
console.log('ok: Боря: пассивка на снижение урона');

/* Омнис: новая пассивка */
const oAt = c.indexOf("id: 'omnis'");
const oEnd = c.indexOf('abilities: [', oAt);
let oBlock = c.slice(oAt, oEnd);
oBlock = oBlock.replace(/passive: '[^']*'/,
  "passive: 'Артефакты чужих миров стоят на одну менталку меньше, а берёт он за одно действие два артефакта вместо одного.'");
c = c.slice(0, oAt) + oBlock + c.slice(oEnd);
console.log('ok: Омнис: пассивка на два артефакта');

fs.writeFileSync(cp, c, 'utf8');
