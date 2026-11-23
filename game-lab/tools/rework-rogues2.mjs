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

// Вор
replaceEntry(
  'yad',
  "{ id: 'yad', name: 'Ядовитый удар', cost: 2, target: true, desc: 'пять урона выбранной цели', effects: [{ damage: 5, target: 'choose' }] }"
);
replaceEntry(
  'lovushka',
  "{ id: 'lovushka', name: 'Ловушка-аура', cost: 2, desc: 'до вашего следующего хода первый, кто нанесёт вам урон, получает столько же и сам не ранит вас', effects: [{ reflect: 1 }] }"
);
replaceEntry(
  'vypad',
  "{ id: 'vypad', name: 'Театральный выпад', cost: 2, target: true, desc: 'четыре урона цели и сброс одной её способности', effects: [{ damage: 4, target: 'choose' }, { discardAbility: 1, target: 'choose' }] }"
);
replaceEntry(
  'karmannik',
  "{ id: 'karmannik', name: 'Карманник', cost: 1, target: true, desc: 'крадёт у цели два артефакта и две менталки', effects: [{ stealArtifact: 2, target: 'choose' }, { stealResource: 'mental', amount: 2, target: 'choose' }] }"
);

// Мирай
replaceEntry(
  'invest',
  "{ id: 'invest', name: 'Инвестиция', cost: 0, desc: 'обменивает артефакт на 3 здоровья, 4 энергии и 3 менталки', effects: [{ tradeArtifact: { hp: 3, mana: 4, mental: 3 } }] }"
);
replaceEntry(
  'schet',
  "{ id: 'schet', name: 'Подставной счёт', cost: 2, desc: 'крадёт по одному артефакту у всех игроков и наносит всем по одному урону', effects: [{ stealArtifactAll: 1 }, { damage: 1, target: 'allOthers' }] }"
);
replaceEntry(
  'skupka',
  "{ id: 'skupka', name: 'Скупка долгов', cost: 2, target: true, desc: 'ворует у цели три здоровья и три энергии', effects: [{ damage: 3, target: 'choose' }, { heal: 3, target: 'self' }, { stealResource: 'mana', amount: 3, target: 'choose' }] }"
);

fs.writeFileSync(path, src, 'utf8');
