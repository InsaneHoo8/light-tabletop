import fs from 'node:fs';

const path = 'game-lab/arena/game-data.js';
let src = fs.readFileSync(path, 'utf8');

function addAbilities(id, lines) {
  const at = src.indexOf(`id: '${id}'`);
  const abAt = src.indexOf('abilities: [', at);
  const close = src.indexOf('\n      ]', abAt);
  if (abAt < 0 || close < 0) throw new Error('нет массива у ' + id);
  src = src.slice(0, close) + ',\n' + lines.join(',\n') + src.slice(close);
  console.log(id + ': добавлено ' + lines.length);
}

addAbilities('mag', [
  "        { id: 'razryv', name: 'Разрыв реальности', cost: 3, desc: 'четыре урона всем остальным', effects: [{ damage: 4, target: 'allOthers' }] }",
  "        { id: 'mutaciya', name: 'Мутация', cost: 3, target: true, desc: 'семь урона цели и три себе', effects: [{ damage: 7, target: 'choose' }, { damage: 3, target: 'self' }] }",
  "        { id: 'proryv', name: 'Научный прорыв', cost: 2, desc: 'щит на три и две энергии себе', effects: [{ shield: 3 }, { gain: { mana: 2 }, target: 'self' }] }",
  "        { id: 'porcha', name: 'Порча', cost: 3, target: true, desc: 'цель теряет две способности', effects: [{ discardAbility: 2, target: 'choose' }] }"
]);

addAbilities('etkora', [
  "        { id: 'klinok_psi', name: 'Ментальный клинок', cost: 2, target: true, desc: 'пять урона здоровью цели', effects: [{ damage: 5, target: 'choose' }] }",
  "        { id: 'uzhas', name: 'Волна ужаса', cost: 3, desc: 'два урона всем остальным и минус одна энергия у каждого', effects: [{ damage: 2, target: 'allOthers' }, { damageResource: 'mana', amount: 1, target: 'allOthers' }] }",
  "        { id: 'vtorzhenie', name: 'Вторжение в разум', cost: 2, target: true, desc: 'цель пропускает ход', effects: [{ skip: 1, target: 'choose' }] }",
  "        { id: 'bronya_psi', name: 'Психическая броня', cost: 2, desc: 'щит на четыре урона', effects: [{ shield: 4 }] }",
  "        { id: 'pozhiranie', name: 'Пожирание мысли', cost: 3, target: true, desc: 'четыре урона цели и три здоровья себе', effects: [{ damage: 4, target: 'choose' }, { heal: 3, target: 'self' }] }"
]);

fs.writeFileSync(path, src, 'utf8');
