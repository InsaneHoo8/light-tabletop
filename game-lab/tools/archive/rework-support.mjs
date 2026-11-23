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

function addAbilities(id, lines) {
  const at = src.indexOf(`id: '${id}'`);
  const abAt = src.indexOf('abilities: [', at);
  const close = src.indexOf('\n      ]', abAt);
  if (abAt < 0 || close < 0) throw new Error('не найден массив способностей у ' + id);
  const block = ',\n' + lines.join(',\n');
  src = src.slice(0, close) + block + src.slice(close);
  console.log(id + ': добавлено ' + lines.length + ' способностей');
}

setMana('borya', 5);
setMana('lyusya', 5);
setMana('omnis', 5);

addAbilities('borya', [
  "        { id: 'shafll', name: 'Пьяный шаффл', cost: 2, target: true, desc: 'случайно одно из четырёх: шесть урона цели, пять здоровья себе, два урона всем, три энергии себе', effects: [{ randomOne: [{ damage: 6, target: 'choose' }, { heal: 5, target: 'self' }, { damage: 2, target: 'allOthers' }, { gain: { mana: 3 }, target: 'self' }] }] }",
  "        { id: 'opohmel', name: 'Опохмел', cost: 1, desc: 'три здоровья и одна энергия себе', effects: [{ heal: 3, target: 'self' }, { gain: { mana: 1 }, target: 'self' }] }",
  "        { id: 'butylka', name: 'Бутылка в голову', cost: 3, target: true, desc: 'шесть урона цели и два себе', effects: [{ damage: 6, target: 'choose' }, { damage: 2, target: 'self' }] }"
]);

addAbilities('lyusya', [
  "        { id: 'layk', name: 'Лайк за кровь', cost: 2, desc: 'один урон всем остальным и три здоровья себе', effects: [{ damage: 1, target: 'allOthers' }, { heal: 3, target: 'self' }] }",
  "        { id: 'sniper', name: 'Стрим-снайпер', cost: 3, target: true, desc: 'четыре урона цели и минус две менталки у неё', effects: [{ damage: 4, target: 'choose' }, { damageResource: 'mental', amount: 2, target: 'choose' }] }",
  "        { id: 'hayp', name: 'Хайп-волна', cost: 2, desc: 'случайно одно из трёх: три урона всем, четыре здоровья себе, две энергии себе', effects: [{ randomOne: [{ damage: 3, target: 'allOthers' }, { heal: 4, target: 'self' }, { gain: { mana: 2 }, target: 'self' }] }] }"
]);

addAbilities('omnis', [
  "        { id: 'backup', name: 'Резервная копия', cost: 2, desc: 'щит на пять урона', effects: [{ shield: 5 }] }",
  "        { id: 'analyze', name: 'Анализ слабости', cost: 3, target: true, desc: 'пять урона цели, пробивает щит', effects: [{ damage: 5, target: 'choose', pierce: true }] }",
  "        { id: 'overload', name: 'Перегрузка сети', cost: 2, desc: 'все остальные теряют две энергии', effects: [{ damageResource: 'mana', amount: 2, target: 'allOthers' }] }"
]);

fs.writeFileSync(path, src, 'utf8');
