import fs from 'node:fs';

/* ---------- данные ---------- */
const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

function setStat(id, key, value) {
  const at = c.indexOf(`id: '${id}'`);
  if (at < 0) throw new Error('нет персонажа ' + id);
  const end = c.indexOf('abilities: [', at);
  let block = c.slice(at, end);
  block = block.replace(new RegExp(key + ': \\d+'), key + ': ' + value);
  c = c.slice(0, at) + block + c.slice(end);
}

setStat('mirai', 'hp', 25);
setStat('mirai', 'dmg', 2);
setStat('grog', 'hp', 25);

const PASSIVES = {
  mirai: 'Раз за ход меняется одним артефактом с любым игроком, не тратя действие. Сначала забирает артефакты киберпанка.',
  hrom: 'Пока у него есть хотя бы одна единица щита, способности и артефакты стоят на одну единицу меньше.',
  glyuk: 'Если рука способностей пуста, возвращает две карты без действия.',
  borya: 'За каждые две недостающие единицы энергии прибавляет единицу к своему урону и получает на единицу больше.',
  lyusya: 'Нанеся за одно действие урон по двум и более целям, получает по одной единице менталки, энергии и здоровья.',
  grigori: 'С одним артефактом в руке прибавляет единицу к урону атаки, с двумя усиливает лечение на единицу, с тремя получает на единицу меньше урона.',
  mag: 'Обмен артефакта даёт и энергию, и способность, причём карту маг выбирает сам.',
  grog: 'При шестнадцати здоровья и меньше способности дешевле на одну энергию, при одиннадцати и меньше лечение больше на две единицы, при семи и меньше урон больше на две единицы.',
  zhulien: 'Обычной атакой может украсть один артефакт вместо удара.',
  omnis: 'Артефакты чужих миров стоят на одну менталку меньше.',
  heil: 'Складывает до двух карт щита, в сумме до десяти единиц.',
  etkora: 'Держит до шести ворованных способностей сверх лимита руки.'
};

for (const [id, text] of Object.entries(PASSIVES)) {
  const at = c.indexOf(`id: '${id}'`);
  const end = c.indexOf('abilities: [', at);
  let block = c.slice(at, end);
  block = block.replace(/passive: '[^']*'/, `passive: '${text}'`);
  c = c.slice(0, at) + block + c.slice(end);
}

fs.writeFileSync(cp, c, 'utf8');
console.log('данные и тексты пассивок обновлены');

/* ---------- движок: пороги Грога ---------- */
const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

rep(`    if (p.charId === 'grog' && p.hp <= 18) totalCost = Math.max(0, totalCost - 1);`,
    `    if (p.charId === 'grog' && p.hp <= 16) totalCost = Math.max(0, totalCost - 1);`,
    'Грог: скидка с шестнадцати');

rep(`          if (th.charId === 'grog' && th.hp <= 14) healAmount += 1;`,
    `          if (th.charId === 'grog' && th.hp <= 11) healAmount += 2;`,
    'Грог: лечение с одиннадцати');

rep(`    if (p.charId === 'grog' && p.hp <= 8) dmgVal += 1;`,
    `    if (p.charId === 'grog' && p.hp <= 7) dmgVal += 2;`,
    'Грог: урон атаки с семи');

rep(`  if (t.charId === 'grog' && t.hp <= 8) {
    dmg = dmg + 1;
  }`,
    `  if (t.charId === 'grog' && t.hp <= 7) {
    dmg = dmg + 2;
  }`,
    'Грог: урон ото всех источников с семи');

fs.writeFileSync(ep, e, 'utf8');
console.log('движок: пороги Грога');
