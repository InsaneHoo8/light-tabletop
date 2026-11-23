import fs from 'node:fs';

const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

/* Хром: ёмкость пять и старая пассивка */
const hAt = c.indexOf("id: 'hrom'");
if (hAt < 0) throw new Error('нет Хрома');
const hEnd = c.indexOf('abilities: [', hAt);
let hBlock = c.slice(hAt, hEnd);
if (!/shieldCap: \d+/.test(hBlock)) throw new Error('нет строки щита');
hBlock = hBlock.replace(/shieldCap: \d+/, 'shieldCap: 5');
hBlock = hBlock.replace(/passive: '[^']*'/,
  "passive: 'Пока у него есть хотя бы одна единица щита, способности и артефакты стоят на одну единицу меньше.'");
c = c.slice(0, hAt) + hBlock + c.slice(hEnd);
console.log('ok: Хром — щит пять и старая пассивка');

/* шокер: минус одна энергия */
const oldShock = "desc: 'два урона цели и минус две энергии у неё', ops: [{ t: 'dmg', who: 'target', n: 2 }, { t: 'energy', who: 'target', n: -2 }]";
const newShock = "desc: 'два урона цели и минус одна энергия у неё', ops: [{ t: 'dmg', who: 'target', n: 2 }, { t: 'energy', who: 'target', n: -1 }]";
if (!c.includes(oldShock)) throw new Error('не найден шокер');
c = c.replace(oldShock, newShock);
console.log('ok: шокер минус одна энергия');

fs.writeFileSync(cp, c, 'utf8');
