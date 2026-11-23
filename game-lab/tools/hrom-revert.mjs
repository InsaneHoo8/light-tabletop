import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* бонус к щиту убран */
rep(`        if (actor.charId === 'hrom') shieldVal += 2;\n`, '', 'Хром: бонус щита убран');

/* скидка на способности возвращена */
rep(`    var totalCost = cost + (p.tax || 0);`,
    `    var totalCost = cost + (p.tax || 0);
    if (p.charId === 'hrom' && p.shield > 0) totalCost = Math.max(0, totalCost - 1);`,
    'Хром: скидка на способности');

/* скидка на артефакты возвращена */
rep(`    if (p.charId === 'omnis' && payMental > 0) payMental = Math.max(0, payMental - 1);`,
    `    if (p.charId === 'omnis' && payMental > 0) payMental = Math.max(0, payMental - 1);
    if (p.charId === 'hrom' && p.shield > 0 && payMental > 0) payMental = Math.max(0, payMental - 1);`,
    'Хром: скидка на артефакты');

fs.writeFileSync(ep, e, 'utf8');

const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

const hAt = c.indexOf("id: 'hrom'");
const hEnd = c.indexOf('abilities: [', hAt);
let hBlock = c.slice(hAt, hEnd);
hBlock = hBlock.replace(/shieldCap: \d+/, 'shieldCap: 5');
hBlock = hBlock.replace(/passive: '[^']*'/,
  "passive: 'Пока у него есть хотя бы одна единица щита, способности и артефакты стоят на одну единицу меньше.'");
c = c.slice(0, hAt) + hBlock + c.slice(hEnd);
console.log('карта: Хром — щит пять и старая пассивка');

/* Встроенный шокер: минус одна энергия */
const oldShock = "desc: 'два урона и минус две энергии', ops: [{ t: 'dmg', who: 'target', n: 2 }, { t: 'energy', who: 'target', n: -2 }]";
const newShock = "desc: 'два урона и минус одна энергия', ops: [{ t: 'dmg', who: 'target', n: 2 }, { t: 'energy', who: 'target', n: -1 }]";
if (!c.includes(oldShock)) throw new Error('не найден шокер');
c = c.replace(oldShock, newShock);
console.log('карта: шокер минус одна энергия');

fs.writeFileSync(cp, c, 'utf8');
