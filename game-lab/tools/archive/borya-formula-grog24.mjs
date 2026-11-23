import fs from 'node:fs';

/* ---------- движок ---------- */
const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* Грог: убираем скидку на способности */
rep(`    if (p.charId === 'grog' && p.hp <= 16) totalCost = Math.max(0, totalCost - 1);\n`, '', 'Грог: скидка убрана');

/* Боря: возвращаем штраф, считаем от максимума энергии */
rep(`  /* Боря: штраф по получаемому урону убран */`,
    `  /* Боря: за каждые две недостающие от максимума энергии получает на единицу больше */
  if (t.charId === 'borya') {
    var missB = Math.max(0, t.maxMana - t.mana);
    dmg = dmg + Math.floor(missB / 2);
  }`,
    'Боря: штраф возвращён');

fs.writeFileSync(ep, e, 'utf8');

/* ---------- данные ---------- */
const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

const gAt = c.indexOf("id: 'grog'");
const gEnd = c.indexOf('abilities: [', gAt);
let gBlock = c.slice(gAt, gEnd);
const oldHp = gBlock.match(/hp: (\d+)/)[1];
gBlock = gBlock.replace(/hp: \d+/, 'hp: 24');
gBlock = gBlock.replace(
  /passive: '[^']*'/,
  "passive: 'При одиннадцати здоровья и меньше получает на одну единицу больше лечения, при семи и меньше наносит на одну единицу больше урона.'"
);
c = c.slice(0, gAt) + gBlock + c.slice(gEnd);
console.log('Грог: здоровье ' + oldHp + ' -> 24, пассивка без скидки');

const bAt = c.indexOf("id: 'borya'");
const bEnd = c.indexOf('abilities: [', bAt);
let bBlock = c.slice(bAt, bEnd);
bBlock = bBlock.replace(
  /passive: '[^']*'/,
  "passive: 'За каждые две недостающие от максимума единицы энергии прибавляет единицу к своему урону, но и получает на единицу больше.'"
);
c = c.slice(0, bAt) + bBlock + c.slice(bEnd);
fs.writeFileSync(cp, c, 'utf8');
console.log('Боря: пассивка снова со штрафом, без привязки к числу');
