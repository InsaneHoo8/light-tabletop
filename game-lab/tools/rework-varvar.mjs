import fs from 'node:fs';

const path = 'game-lab/arena/game-data.js';
let src = fs.readFileSync(path, 'utf8');

// 1. Реворк Варвара: провокация вместо трёх слабых карт.
const oldAbilities = `        { id: 'yarost', name: 'Яростный удар', cost: 1, inventedCost: true, desc: 'плюс два к урону следующей атаки', effects: [{ buff: 2 }] },
        { id: 'shchit', name: 'Щит Ярости', cost: 1, inventedCost: true, desc: 'снижает получаемый урон на один', effects: [{ shield: 1 }] },
        { id: 'krik', name: 'Боевой крик', cost: 1, inventedCost: true, desc: 'восстанавливает одно здоровье', effects: [{ heal: 1, target: 'self' }] }`;
const newAbilities = `        { id: 'krik', name: 'Боевой крик', cost: 2, target: true, neighborsOnly: true, desc: 'провоцирует соседа: тот получает обычный удар, бьёт в ответ на две меньше и пропускает ход', effects: [{ taunt: true, target: 'choose' }] },
        { id: 'yarost', name: 'Яростный удар', cost: 2, desc: 'три урона всем остальным и два себе', effects: [{ damage: 3, target: 'allOthers' }, { damage: 2, target: 'self' }] }`;
if (!src.includes(oldAbilities)) throw new Error('не найдены способности Варвара');
src = src.replace(oldAbilities, newAbilities);
console.log('Варвар: набор заменён');

// 2. Энергия Хрому и Хейлу.
for (const id of ['hrom', 'heil']) {
  const at = src.indexOf(`id: '${id}'`);
  const mAt = src.indexOf('mana: ', at);
  const colon = mAt + 'mana: '.length;
  const end = src.indexOf(',', colon);
  const old = src.slice(colon, end).trim();
  src = src.slice(0, colon) + '3' + src.slice(end);
  console.log(id + ': энергия ' + old + ' -> 3');
}

// 3. Здоровье записываем прямо в данные и убираем переопределение по классу.
const hp = { varvar: 30, vor: 27, mag: 25, borya: 28, hrom: 30, mirai: 27, glyuk: 29, omnis: 28, etkora: 25, heil: 30, grigori: 29, lyusya: 28 };
for (const [id, value] of Object.entries(hp)) {
  const at = src.indexOf(`id: '${id}'`);
  const hAt = src.indexOf('hp: ', at);
  const colon = hAt + 'hp: '.length;
  const end = src.indexOf(',', colon);
  const old = src.slice(colon, end).trim();
  src = src.slice(0, colon) + String(value) + src.slice(end);
  if (Number(old) !== value) console.log(id + ': ХП ' + old + ' -> ' + value);
}

src = src.replace('    CHARACTERS[ci0].hp = CLASS_HP[CHARACTERS[ci0].archetype] || CHARACTERS[ci0].hp;\n', '');
src = src.replace('  /* Здоровье задаётся классом: танк крепче, маг хрупче. */\n  var CLASS_HP = { tank: 30, control: 29, support: 28, rogue: 27, mage: 25 };\n\n', '');
console.log('переопределение здоровья убрано: ' + !src.includes('CLASS_HP'));

fs.writeFileSync(path, src, 'utf8');
