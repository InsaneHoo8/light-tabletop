import fs from 'node:fs';

/* Грог: здоровье 23 */
const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

const gAt = c.indexOf("id: 'grog'");
const gEnd = c.indexOf('abilities: [', gAt);
let gBlock = c.slice(gAt, gEnd);
const oldHp = gBlock.match(/hp: (\d+)/)[1];
gBlock = gBlock.replace(/hp: \d+/, 'hp: 23');
c = c.slice(0, gAt) + gBlock + c.slice(gEnd);
console.log('Грог: здоровье ' + oldHp + ' -> 23');

/* Боря: пассивка без штрафа */
const bAt = c.indexOf("id: 'borya'");
const bEnd = c.indexOf('abilities: [', bAt);
let bBlock = c.slice(bAt, bEnd);
bBlock = bBlock.replace(
  /passive: '[^']*'/,
  "passive: 'За каждые две недостающие единицы энергии прибавляет единицу к своему урону.'"
);
c = c.slice(0, bAt) + bBlock + c.slice(bEnd);
fs.writeFileSync(cp, c, 'utf8');
console.log('Боря: текст пассивки без штрафа');

/* Движок: убираем штраф по получаемому урону */
const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');
const old = `  /* Боря: за каждые две недостающие энергии получает на единицу больше */
  if (t.charId === 'borya') {
    var missE = Math.max(0, t.maxMana - t.mana);
    dmg = dmg + Math.floor(missE / 2);
  }`;
if (!e.includes(old)) throw new Error('не найден штраф Бори');
e = e.replace(old, `  /* Боря: штраф по получаемому урону убран */`);
fs.writeFileSync(ep, e, 'utf8');
console.log('движок: штраф Бори снят');
