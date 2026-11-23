import fs from 'node:fs';

const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!c.includes(old)) throw new Error('НЕ НАЙДЕНО: ' + label);
  c = c.replace(old, neu);
  console.log('ok: ' + label);
}

/* ---------- Жюльен ---------- */
rep("{ t: 'shieldBreaker', who: 'target', through: 2, toShield: 3, plain: 5 }",
  "{ t: 'shieldBreaker', who: 'target', through: 4, toShield: 2, plain: 6 }",
  'Жюльен: удар исподтишка');

/* ---------- Эт’Кора: данные ---------- */
const eAt = c.indexOf("id: 'etkora'");
const eEnd = c.indexOf('abilities: [', eAt);
let eBlock = c.slice(eAt, eEnd);
eBlock = eBlock.replace(/mana: \d+/, 'mana: 10');
eBlock = eBlock.replace(/passive: '[^']*'/,
  "passive: 'Ворованные способности стоят на одну энергию меньше.'");
c = c.slice(0, eAt) + eBlock + c.slice(eEnd);
console.log('ok: Эт’Кора — энергия десять и пассивка');

/* ---------- Маг: менталка ---------- */
const mAt = c.indexOf("id: 'mag'");
const mEnd = c.indexOf('abilities: [', mAt);
let mBlock = c.slice(mAt, mEnd);
mBlock = mBlock.replace(/mental: \d+/, 'mental: 5');
c = c.slice(0, mAt) + mBlock + c.slice(mEnd);
console.log('ok: Маг — менталка пять');

/* ---------- Грог: здоровье ---------- */
const gAt = c.indexOf("id: 'grog'");
const gEnd = c.indexOf('abilities: [', gAt);
let gBlock = c.slice(gAt, gEnd);
gBlock = gBlock.replace(/hp: \d+/, 'hp: 25');
c = c.slice(0, gAt) + gBlock + c.slice(gEnd);
console.log('ok: Грог — здоровье двадцать пять');

fs.writeFileSync(cp, c, 'utf8');
console.log('часть первая записана');
