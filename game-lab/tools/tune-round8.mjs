import fs from 'node:fs';

const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

function repC(old, neu, label) {
  if (!c.includes(old)) throw new Error('не найдено: ' + label);
  c = c.replace(old, neu);
  console.log('ok: ' + label);
}

/* Стрим на миллион: по одной энергии и менталке */
repC("ops: [{ t: 'energy', who: 'others', n: -2 }, { t: 'mental', who: 'others', n: -2 }]",
  "ops: [{ t: 'energy', who: 'others', n: -1 }, { t: 'mental', who: 'others', n: -1 }]",
  'Стрим на миллион');

/* Охота за лайками: один урон */
repC("ops: [{ t: 'dmg', who: 'others', n: 2, leechPerTarget: 1 }]",
  "ops: [{ t: 'dmg', who: 'others', n: 1, leechPerTarget: 1 }]",
  'Охота за лайками');

/* Донатный щит: шесть при двух артефактах, иначе три */
repC("desc: 'шесть единиц щита до разрушения', ops: [{ t: 'shield', n: 6 }]",
  "desc: 'шесть щита при двух артефактах в руке, иначе три', ops: [{ t: 'shield', n: 3, nRich: 6, richAt: 2 }]",
  'Донатный щит');

/* Хром: ёмкость щита семь */
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

/* условный щит и бонус Хрома */
const oldShield = `      case 'shield':
        if (actor.hp <= 0) break;
        var shieldVal = op.n || 0;`;
const newShield = `      case 'shield':
        if (actor.hp <= 0) break;
        var shieldVal = op.n || 0;
        if (op.richAt !== undefined) {
          shieldVal = actor.hand.length >= op.richAt ? (op.nRich || shieldVal) : shieldVal;
        }
        if (actor.charId === 'hrom') shieldVal += 2;`;

if (!e.includes(oldShield)) throw new Error('не найден блок щита');
e = e.replace(oldShield, newShield);
fs.writeFileSync(ep, e, 'utf8');
console.log('ok: движок — условный щит и бонус Хрома');
