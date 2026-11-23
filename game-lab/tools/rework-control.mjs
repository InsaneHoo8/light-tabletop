import fs from 'node:fs';

const path = 'game-lab/arena/game-data.js';
let src = fs.readFileSync(path, 'utf8');

function setMana(id, value) {
  const at = src.indexOf(`id: '${id}'`);
  const mAt = src.indexOf('mana: ', at);
  const colon = mAt + 'mana: '.length;
  const end = src.indexOf(',', colon);
  const old = src.slice(colon, end).trim();
  src = src.slice(0, colon) + String(value) + src.slice(end);
  console.log(id + ': энергия ' + old + ' -> ' + value);
}

setMana('grigori', 4);
setMana('glyuk', 4);

// Цифровой паразит: майнд-контроль, две цели. Заменяем объект целиком.
const at = src.indexOf("id: 'parazit'");
if (at < 0) throw new Error('не найден Цифровой паразит');
const start = src.lastIndexOf('{', at);
const marker = src.indexOf("damageResource: 'mental', amount: 2", at);
if (marker < 0) throw new Error('не найдено тело паразита');
const end = src.indexOf('}', marker) + 1;
const newParazit =
  "{ id: 'parazit', name: 'Цифровой паразит', cost: 3, target: true, secondTarget: true, puppetQuestion: 'Кем управлять?', secondQuestion: 'Кого он ударит?', desc: 'выбранный игрок бьёт того, кого укажете', effects: [{ puppet: true }] }";
src = src.slice(0, start) + newParazit + src.slice(end);
console.log('Паразит: майнд-контроль за 3 энергии');

function addAbilities(id, lines) {
  const at2 = src.indexOf(`id: '${id}'`);
  const abAt = src.indexOf('abilities: [', at2);
  const close = src.indexOf('\n      ]', abAt);
  if (abAt < 0 || close < 0) throw new Error('нет массива способностей у ' + id);
  src = src.slice(0, close) + ',\n' + lines.join(',\n') + src.slice(close);
  console.log(id + ': добавлено ' + lines.length);
}

addAbilities('grigori', [
  "        { id: 'vybory', name: 'Единый день голосования', cost: 3, desc: 'все остальные пропускают ход, но вы теряете два здоровья', effects: [{ skip: 1, target: 'allOthers' }, { damage: 2, target: 'self' }] }",
  "        { id: 'lyubov', name: 'Народная любовь', cost: 2, desc: 'три здоровья и две менталки себе, все остальные получают один урон', effects: [{ heal: 3, target: 'self' }, { gain: { mental: 2 }, target: 'self' }, { damage: 1, target: 'allOthers' }] }"
]);

addAbilities('glyuk', [
  "        { id: 'vzlom', name: 'Взлом', cost: 2, target: true, desc: 'крадёт у цели две менталки и две энергии', effects: [{ stealResource: 'mental', amount: 2, target: 'choose' }, { stealResource: 'mana', amount: 2, target: 'choose' }] }",
  "        { id: 'rekursiya', name: 'Рекурсия', cost: 2, target: true, desc: 'три урона цели и минус две энергии у неё', effects: [{ damage: 3, target: 'choose' }, { damageResource: 'mana', amount: 2, target: 'choose' }] }"
]);

fs.writeFileSync(path, src, 'utf8');
console.log('записано');
