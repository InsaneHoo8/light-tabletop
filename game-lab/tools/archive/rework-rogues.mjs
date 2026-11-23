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

function addAbilities(id, lines) {
  const at = src.indexOf(`id: '${id}'`);
  const abAt = src.indexOf('abilities: [', at);
  const close = src.indexOf('\n      ]', abAt);
  if (abAt < 0 || close < 0) throw new Error('нет массива у ' + id);
  src = src.slice(0, close) + ',\n' + lines.join(',\n') + src.slice(close);
  console.log(id + ': добавлено ' + lines.length);
}

setMana('vor', 4);
setMana('mirai', 5);

replaceEntry(
  'kontrakt',
  "{ id: 'kontrakt', name: 'Контракт', cost: 2, target: true, desc: 'крадёт у цели два артефакта и сбрасывает одну её способность', effects: [{ stealArtifact: 2, target: 'choose' }, { discardAbility: 1, target: 'choose' }] }"
);

addAbilities('vor', [
  "        { id: 'karmannik', name: 'Карманник', cost: 1, target: true, desc: 'крадёт у цели один артефакт и одну менталку', effects: [{ stealArtifact: 1, target: 'choose' }, { stealResource: 'mental', amount: 1, target: 'choose' }] }"
]);

addAbilities('mirai', [
  "        { id: 'schet', name: 'Подставной счёт', cost: 2, target: true, desc: 'три урона цели и две энергии себе', effects: [{ damage: 3, target: 'choose' }, { gain: { mana: 2 }, target: 'self' }] }",
  "        { id: 'skupka', name: 'Скупка долгов', cost: 1, target: true, desc: 'крадёт у цели одну менталку и одну энергию', effects: [{ stealResource: 'mental', amount: 1, target: 'choose' }, { stealResource: 'mana', amount: 1, target: 'choose' }] }",
  "        { id: 'aukcion', name: 'Цифровой аукцион', cost: 3, target: true, desc: 'четыре урона цели и кража одного артефакта', effects: [{ damage: 4, target: 'choose' }, { stealArtifact: 1, target: 'choose' }] }"
]);

fs.writeFileSync(path, src, 'utf8');
