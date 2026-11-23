import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

rep(`          if (th.charId === 'grog' && th.hp <= 11) healAmount += 2;`,
    `          if (th.charId === 'grog' && th.hp <= 11) healAmount += 1;`,
    'Грог: лечение плюс один');

rep(`    if (p.charId === 'grog' && p.hp <= 7) dmgVal += 2;`,
    `    if (p.charId === 'grog' && p.hp <= 7) dmgVal += 1;`,
    'Грог: урон атаки плюс один');

rep(`  if (t.charId === 'grog' && t.hp <= 7) {
    dmg = dmg + 2;
  }`,
    `  if (t.charId === 'grog' && t.hp <= 7) {
    dmg = dmg + 1;
  }`,
    'Грог: входящий урон плюс один');

fs.writeFileSync(ep, e, 'utf8');

const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');
const at = c.indexOf("id: 'grog'");
const end = c.indexOf('abilities: [', at);
let block = c.slice(at, end);
block = block.replace(
  /passive: '[^']*'/,
  "passive: 'При шестнадцати здоровья и меньше способности дешевле на одну энергию, при одиннадцати и меньше лечение больше на одну единицу, при семи и меньше урон больше на одну единицу.'"
);
c = c.slice(0, at) + block + c.slice(end);
fs.writeFileSync(cp, c, 'utf8');
console.log('текст пассивки Грога обновлён');
