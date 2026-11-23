import fs from 'node:fs';

const path = 'game-lab/arena/game-data.js';
let src = fs.readFileSync(path, 'utf8');

function setMana(id, value) {
  const at = src.indexOf(`id: '${id}'`);
  if (at < 0) throw new Error('нет персонажа ' + id);
  const mAt = src.indexOf('mana: ', at);
  const colon = mAt + 'mana: '.length;
  const end = src.indexOf(',', colon);
  const old = src.slice(colon, end).trim();
  src = src.slice(0, colon) + String(value) + src.slice(end);
  console.log(id + ': энергия ' + old + ' -> ' + value);
}

setMana('mag', 8);
setMana('etkora', 8);

fs.writeFileSync(path, src, 'utf8');
