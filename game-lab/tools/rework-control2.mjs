import fs from 'node:fs';

const path = 'game-lab/arena/game-data.js';
let src = fs.readFileSync(path, 'utf8');

function replaceEntry(id, newLine) {
  const at = src.indexOf(`id: '${id}'`);
  if (at < 0) throw new Error('нет способности ' + id);
  const start = src.lastIndexOf('{', at);
  // конец объекта: ищем закрывающую скобку, балансируя вложенность
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

replaceEntry(
  'ukaz',
  "{ id: 'ukaz', name: 'Указ №∞', cost: 2, desc: 'вы получаете ещё один ход: можно ударить дважды или ударить и применить способность', effects: [{ extraTurn: 1 }] }"
);

replaceEntry(
  'vybory',
  "{ id: 'vybory', name: 'Единый день голосования', cost: 3, desc: 'все игроки не могут наносить урон обычной атакой на своём ходу', effects: [{ noAttackAll: 1 }] }"
);

replaceEntry(
  'pereproshivka',
  "{ id: 'pereproshivka', name: 'Перепрошивка', cost: 2, target: true, desc: 'цель пропускает ход и теряет один артефакт и одну способность', effects: [{ skip: 1, target: 'choose' }, { discardTarget: 1, target: 'choose' }] }"
);

replaceEntry(
  'rekursiya',
  "{ id: 'rekursiya', name: 'Рекурсия', cost: 3, target: true, desc: 'пять урона цели', effects: [{ damage: 5, target: 'choose' }] }"
);

fs.writeFileSync(path, src, 'utf8');
