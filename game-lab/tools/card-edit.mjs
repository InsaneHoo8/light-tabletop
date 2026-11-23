/* Правка карточек и правил по описанию в JSON, с проверкой каждого шага.

   node game-lab/tools/card-edit.mjs правки.json
   node game-lab/tools/card-edit.mjs правки.json --dry

   Формат файла правок:
   {
     "character": [
       { "id": "grog", "hp": 25, "dmg": 2, "passive": "текст" }
     ],
     "ability": [
       { "id": "porcha", "cost": 3, "name": "Порча", "ops": [ { "t": "dmg", "who": "target", "n": 4 } ] }
     ],
     "artifact": [
       { "id": "altar", "cost": 4, "trade": 4 }
     ]
   }

   Поля, которых не указано, не меняются. Скрипт печатает «было → стало»
   и падает, если карточка не найдена или поле отсутствует.
*/

import fs from 'node:fs';

const CARDS = 'game-lab/arena/cards.js';

const file = process.argv[2];
const dry = process.argv.includes('--dry');

if (!file) {
  console.log('нужно: node game-lab/tools/card-edit.mjs правки.json');
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
let src = fs.readFileSync(CARDS, 'utf8').replace(/\r\n/g, '\n');
const changes = [];


function replaceInCard(id, transform, label) {
  const at = src.indexOf("id: '" + id + "'");
  if (at < 0) throw new Error('карточка не найдена: ' + id);

  /* границы карточки: от её id до следующего id на том же уровне */
  const nextId = src.indexOf("{ id: '", at + 5);
  const end = nextId < 0 ? src.length : nextId;
  const block = src.slice(at, end);
  const changed = transform(block, id);
  if (changed === block) {
    throw new Error('ничего не изменилось: ' + id + ' (' + label + ')');
  }
  src = src.slice(0, at) + changed + src.slice(end);
}

function setNumber(block, field, value, id) {
  const re = new RegExp(field + ': (\\d+)');
  const m = block.match(re);
  if (!m) throw new Error('нет поля ' + field + ' у ' + id);
  const was = Number(m[1]);
  if (was === value) throw new Error(field + ' у ' + id + ' уже ' + value);
  changes.push(id + '.' + field + ': ' + was + ' → ' + value);
  return block.replace(re, field + ': ' + value);
}

function setString(block, field, value, id) {
  const re = new RegExp(field + ": '[^']*'");
  const m = block.match(re);
  if (!m) throw new Error('нет поля ' + field + ' у ' + id);
  changes.push(id + '.' + field + ': обновлён текст');
  return block.replace(re, field + ": '" + value + "'");
}

function setJson(block, field, value, id) {
  const re = new RegExp(field + ': (\\[[\\s\\S]*?\\])(?=,| )');
  const m = block.match(re);
  if (!m) throw new Error('нет поля ' + field + ' у ' + id);
  changes.push(id + '.' + field + ': переписано');
  return block.replace(re, field + ': ' + JSON.stringify(value));
}

for (const item of spec.character || []) {
  replaceInCard(item.id, (block) => {
    let b = block;
    for (const [k, v] of Object.entries(item)) {
      if (k === 'id') continue;
      if (typeof v === 'number') b = setNumber(b, k, v, item.id);
      else b = setString(b, k, v, item.id);
    }
    return b;
  }, 'character');
}

for (const item of spec.ability || []) {
  replaceInCard(item.id, (block) => {
    let b = block;
    for (const [k, v] of Object.entries(item)) {
      if (k === 'id') continue;
      if (k === 'ops') b = setJson(b, 'ops', v, item.id);
      else if (typeof v === 'number') b = setNumber(b, k, v, item.id);
      else b = setString(b, k, v, item.id);
    }
    return b;
  }, 'ability');
}

for (const item of spec.artifact || []) {
  replaceInCard(item.id, (block) => {
    let b = block;
    for (const [k, v] of Object.entries(item)) {
      if (k === 'id') continue;
      if (k === 'ops') b = setJson(b, 'ops', v, item.id);
      else if (typeof v === 'number') b = setNumber(b, k, v, item.id);
      else b = setString(b, k, v, item.id);
    }
    return b;
  }, 'artifact');
}

console.log('правок: ' + changes.length);
for (const c of changes) console.log('  ' + c);

if (dry) {
  console.log('режим проверки: файл не записан');
  process.exit(0);
}

fs.writeFileSync(CARDS, src, 'utf8');
console.log('записано в ' + CARDS);
