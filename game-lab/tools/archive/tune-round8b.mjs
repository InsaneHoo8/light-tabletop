import fs from 'node:fs';

/* карты */
const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

function repC(old, neu, label) {
  if (!c.includes(old)) throw new Error('не найдено: ' + label);
  c = c.replace(old, neu);
  console.log('ok: ' + label);
}

repC("ops: [{ t: 'energy', who: 'others', n: -2 }, { t: 'mental', who: 'others', n: -2 }]",
  "ops: [{ t: 'energy', who: 'others', n: -1 }, { t: 'mental', who: 'others', n: -1 }]",
  'Стрим на миллион');

repC("ops: [{ t: 'dmg', who: 'others', n: 2, leechPerTarget: 1 }]",
  "ops: [{ t: 'dmg', who: 'others', n: 1, leechPerTarget: 1 }]",
  'Охота за лайками');

repC("desc: 'шесть щита, если в руке есть артефакт, иначе три', ops: [{ t: 'shield', n: 6, lessIfNoArtifact: 3 }]",
  "desc: 'шесть щита при двух артефактах в руке, иначе три', ops: [{ t: 'shield', n: 6, lessIfFewArtifacts: 3, richAt: 2 }]",
  'Донатный щит');

const hAt = c.indexOf("id: 'hrom'");
const hEnd = c.indexOf('abilities: [', hAt);
let hBlock = c.slice(hAt, hEnd);
hBlock = hBlock.replace(/shieldCap: \d+/, 'shieldCap: 7');
hBlock = hBlock.replace(/passive: '[^']*'/,
  "passive: 'Пока у него есть хотя бы одна единица щита, способности и артефакты стоят на одну единицу меньше. Любой получаемый щит даёт на две единицы больше.'");
c = c.slice(0, hAt) + hBlock + c.slice(hEnd);
console.log('ok: Хром — ёмкость семь и пассивка');

fs.writeFileSync(cp, c, 'utf8');

/* движок */
const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

const oldLine = "        if (op.lessIfNoArtifact !== undefined && !actor.hand.length) shieldVal = op.lessIfNoArtifact;";
const newLine = `        if (op.lessIfNoArtifact !== undefined && !actor.hand.length) shieldVal = op.lessIfNoArtifact;
        if (op.lessIfFewArtifacts !== undefined && actor.hand.length < (op.richAt || 1)) shieldVal = op.lessIfFewArtifacts;
        if (actor.charId === 'hrom') shieldVal += 2;`;

if (!e.includes(oldLine)) throw new Error('не найдена строка щита');
e = e.replace(oldLine, newLine);
fs.writeFileSync(ep, e, 'utf8');
console.log('ok: движок — порог артефактов и бонус Хрома');
