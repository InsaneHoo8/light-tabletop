import fs from 'node:fs';

const p = 'game-lab/tools/sim-report.mjs';
let src = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const oldA = `    let card = null;
    if (mv.action === 'ability') {
      const ab = p.abilities[mv.picks.ability];
      if (ab) card = ab.name;`;
const newA = `    let card = null;
    let stolenFlag = false;
    if (mv.action === 'ability') {
      const ab = p.abilities[mv.picks.ability];
      if (ab) {
        card = ab.name;
        stolenFlag = !!ab.stolen;
      }`;
if (!src.includes(oldA)) throw new Error('A не найден');
src = src.replace(oldA, newA);

const oldB = `    if (mv.action === 'ability' && card) {
      abilityUse.set(card, (abilityUse.get(card) || 0) + 1);`;
const newB = `    if (mv.action === 'ability' && card) {
      abilityUse.set(card, (abilityUse.get(card) || 0) + 1);
      if (stolenFlag) {
        stolenUse.set(card, (stolenUse.get(card) || 0) + 1);
        const keySt = p.name + '::' + card;
        stolenBy.set(keySt, (stolenBy.get(keySt) || 0) + 1);
      }`;
if (!src.includes(oldB)) throw new Error('B не найден');
src = src.replace(oldB, newB);

const anchor = "tail.push('## Артефакты: применение и обмен');";
if (!src.includes(anchor)) throw new Error('нет раздела артефактов');
const section = `tail.push('## Сворованные способности');
tail.push('');
if (!stolenUse.size) {
  tail.push('Сворованных способностей в этой партии не применяли.');
} else {
  const rowsStolen = Array.from(stolenBy.entries()).sort((a, b) => b[1] - a[1]);
  for (const [key, count] of rowsStolen) {
    const parts = key.split('::');
    tail.push('- ' + parts[0] + ' применил сворованную «' + parts[1] + '» ' + count + ' раз.');
  }
}
tail.push('');

`;
src = src.replace(anchor, section + anchor);

fs.writeFileSync(p, src, 'utf8');
console.log('учёт сворованных подключён');
