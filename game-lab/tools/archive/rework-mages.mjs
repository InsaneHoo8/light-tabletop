import fs from 'node:fs';

const path = 'game-lab/arena/game-data.js';
let src = fs.readFileSync(path, 'utf8');

function replaceEntry(id, newLine) {
  const at = src.indexOf(`id: '${id}'`);
  if (at < 0) throw new Error('нет способности ' + id);
  const start = src.lastIndexOf('{', at);
  let depth = 0;
  let end = start;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  src = src.slice(0, start) + newLine + src.slice(end);
  console.log(id + ': заменена');
}

// Безумный Маг: дорогие и сильные карты под запас в семь энергии.
replaceEntry(
  'vspyshka',
  "{ id: 'vspyshka', name: 'Вспышка Бездны', cost: 2, target: true, desc: 'шесть урона цели и два себе', effects: [{ damage: 6, target: 'choose' }, { damage: 2, target: 'self' }] }"
);

replaceEntry(
  'haos',
  "{ id: 'haos', name: 'Хаотическое заклинание', cost: 2, modes: [{ label: 'три урона всем остальным', cost: 2, effects: [{ damage: 3, target: 'allOthers' }] }, { label: 'пять здоровья себе', cost: 2, effects: [{ heal: 5, target: 'self' }] }, { label: 'три энергии себе', cost: 2, effects: [{ gain: { mana: 3 }, target: 'self' }] }] }"
);

replaceEntry(
  'illyuzii',
  "{ id: 'illyuzii', name: 'Призыв Иллюзий', cost: 1, desc: 'щит на три урона', effects: [{ shield: 3 }] }"
);

// Эт’Кора: урон по менталке перестаёт быть пустым, пропуск хода бьёт.
replaceEntry(
  'psi',
  "{ id: 'psi', name: 'Психический всплеск', cost: 2, target: true, desc: 'три урона менталке цели и два урона здоровью', effects: [{ damageResource: 'mental', amount: 3, target: 'choose' }, { damage: 2, target: 'choose' }] }"
);

replaceEntry(
  'boli',
  "{ id: 'boli', name: 'Иллюзия боли', cost: 3, target: true, desc: 'цель пропускает ход и получает два урона', effects: [{ skip: 1, target: 'choose' }, { damage: 2, target: 'choose' }] }"
);

fs.writeFileSync(path, src, 'utf8');
