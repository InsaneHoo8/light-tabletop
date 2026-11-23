import fs from 'node:fs';

const path = 'game-lab/arena/game-data.js';
let src = fs.readFileSync(path, 'utf8');

const ids = ['varvar', 'vor', 'mag', 'borya', 'hrom', 'mirai', 'glyuk', 'omnis', 'etkora', 'heil', 'grigori', 'lyusya'];
const target = {};
for (const id of ids) {
  const at = src.indexOf(`id: '${id}'`);
  if (at < 0) throw new Error('нет персонажа ' + id);
  const hpAt = src.indexOf('hp: ', at);
  if (hpAt < 0) throw new Error('нет hp у ' + id);
  const colon = hpAt + 'hp: '.length;
  const end = src.indexOf(',', colon);
  const old = Number(src.slice(colon, end).trim());
  const next = 54 - old;
  src = src.slice(0, colon) + String(next) + src.slice(end);
  target[id] = { old, next };
  console.log(id + ': ' + old + ' -> ' + next);
}
fs.writeFileSync(path, src, 'utf8');
console.log('готово, персонажей: ' + Object.keys(target).length);
