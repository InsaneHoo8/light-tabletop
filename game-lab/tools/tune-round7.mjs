import fs from 'node:fs';

/* Хайповый взрыв: 3 урона */
const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');
const at = c.indexOf("id: 'lyusya'");
const end = c.indexOf('abilities: [', at);
let block = c.slice(at, end);
const old = "ops: [{ t: 'dmg', who: 'target', n: 4 }, { t: 'noAttack', who: 'target' }]";
if (!block.includes(old)) throw new Error('не найден хайповый взрыв');
block = block.replace(old, "ops: [{ t: 'dmg', who: 'target', n: 3 }, { t: 'noAttack', who: 'target' }]");
c = c.slice(0, at) + block + c.slice(end);

/* Боря: штраф плюс два */
const bAt = c.indexOf("id: 'borya'");
const bEnd = c.indexOf('abilities: [', bAt);
let bBlock = c.slice(bAt, bEnd);
bBlock = bBlock.replace(/passive: '[^']*'/,
  "passive: 'Когда не хватает двух энергии, прибавляет единицу к урону обычной атаки. Когда не хватает четырёх — прибавляет две единицы, но и сам получает на две единицы больше урона от любых источников.'");
c = c.slice(0, bAt) + bBlock + c.slice(bEnd);
fs.writeFileSync(cp, c, 'utf8');
console.log('карты: хайповый взрыв 3 урона, текст Бори');

/* движок: штраф Бори плюс два */
const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');
const oldD = `  /* Боря: при недостаче четырёх энергии получает на единицу больше */
  if (t.charId === 'borya') {
    var missBD = Math.max(0, t.maxMana - t.mana);
    if (missBD >= 4) dmg = dmg + 1;
  }`;
const newD = `  /* Боря: при недостаче четырёх энергии получает на две единицы больше */
  if (t.charId === 'borya') {
    var missBD = Math.max(0, t.maxMana - t.mana);
    if (missBD >= 4) dmg = dmg + 2;
  }`;
if (!e.includes(oldD)) throw new Error('не найден штраф Бори');
e = e.replace(oldD, newD);
fs.writeFileSync(ep, e, 'utf8');
console.log('движок: штраф Бори плюс два');
