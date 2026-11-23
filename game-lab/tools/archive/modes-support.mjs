import fs from 'node:fs';

const path = 'game-lab/arena/game-data.js';
let src = fs.readFileSync(path, 'utf8');

const changes = [
  {
    old: "{ id: 'overload', name: 'Перегрузка сети', cost: 2, desc: 'все остальные теряют две энергии', effects: [{ damageResource: 'mana', amount: 2, target: 'allOthers' }] }",
    new:
      "{ id: 'overload', name: 'Перегрузка системы', cost: 3, desc: 'всем остальным: один урон, минус три энергии и минус две менталки', effects: [{ damage: 1, target: 'allOthers' }, { damageResource: 'mana', amount: 3, target: 'allOthers' }, { damageResource: 'mental', amount: 2, target: 'allOthers' }] }"
  },
  {
    old:
      "{ id: 'shafll', name: 'Пьяный шаффл', cost: 2, target: true, desc: 'случайно одно из четырёх: шесть урона цели, пять здоровья себе, два урона всем, три энергии себе', effects: [{ randomOne: [{ damage: 6, target: 'choose' }, { heal: 5, target: 'self' }, { damage: 2, target: 'allOthers' }, { gain: { mana: 3 }, target: 'self' }] }] }",
    new:
      "{ id: 'shafll', name: 'Пьяный шаффл', cost: 2, modes: [{ label: 'пять урона цели', cost: 2, target: true, effects: [{ damage: 5, target: 'choose' }] }, { label: 'четыре здоровья себе', cost: 2, effects: [{ heal: 4, target: 'self' }] }, { label: 'два урона всем остальным', cost: 2, effects: [{ damage: 2, target: 'allOthers' }] }, { label: 'три энергии себе', cost: 0, effects: [{ gain: { mana: 3 }, target: 'self' }] }] }"
  },
  {
    old:
      "{ id: 'opohmel', name: 'Опохмел', cost: 1, desc: 'три здоровья и одна энергия себе', effects: [{ heal: 3, target: 'self' }, { gain: { mana: 1 }, target: 'self' }] }",
    new:
      "{ id: 'opohmel', name: 'Опохмел', cost: 1, desc: 'три здоровья и две менталки себе', effects: [{ heal: 3, target: 'self' }, { gain: { mental: 2 }, target: 'self' }] }"
  },
  {
    old:
      "{ id: 'layk', name: 'Лайк за кровь', cost: 2, desc: 'один урон всем остальным и три здоровья себе', effects: [{ damage: 1, target: 'allOthers' }, { heal: 3, target: 'self' }] }",
    new:
      "{ id: 'layk', name: 'Лайк за кровь', cost: 2, desc: 'один урон всем остальным и лечение по одному за каждого', effects: [{ damage: 1, target: 'allOthers' }, { healPerOpponent: 1, target: 'self' }] }"
  },
  {
    old:
      "{ id: 'hayp', name: 'Хайп-волна', cost: 2, desc: 'случайно одно из трёх: три урона всем, четыре здоровья себе, две энергии себе', effects: [{ randomOne: [{ damage: 3, target: 'allOthers' }, { heal: 4, target: 'self' }, { gain: { mana: 2 }, target: 'self' }] }] }",
    new:
      "{ id: 'hayp', name: 'Хайп-волна', cost: 2, modes: [{ label: 'три урона всем остальным', cost: 2, effects: [{ damage: 3, target: 'allOthers' }] }, { label: 'шесть здоровья себе и три всем остальным', cost: 2, effects: [{ heal: 3, target: 'allOthers' }, { heal: 6, target: 'self' }] }, { label: 'все остальные теряют три энергии', cost: 2, effects: [{ damageResource: 'mana', amount: 3, target: 'allOthers' }] }] }"
  }
];

for (const c of changes) {
  if (!src.includes(c.old)) throw new Error('не найдено: ' + c.old.slice(0, 40));
  src = src.replace(c.old, c.new);
}
fs.writeFileSync(path, src, 'utf8');
console.log('способности обновлены: ' + changes.length);
