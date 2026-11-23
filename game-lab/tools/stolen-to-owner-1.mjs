import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* запоминаем, у кого украдена карта */
rep(`            taken = Object.assign({}, taken);
            taken.stolen = true;`,
    `            taken = Object.assign({}, taken);
            taken.stolen = true;
            taken.stolenFrom = tsa2.name;`,
    'запоминаем владельца');

/* применённая сворованная карта уходит в сброс прежнего владельца */
rep(`function pileAfterUse(p, ab) {
  if (p.pool.length > 0) p.oldDiscard.push(ab);
  else p.newDiscard.push(ab);
}`,
    `function pileAfterUse(p, ab) {
  if (ab && ab.stolenFrom) {
    for (var i = 0; i < p.players ? p.players.length : 0; i++) { /* заглушка */ }
  }
  if (p.pool.length > 0) p.oldDiscard.push(ab);
  else p.newDiscard.push(ab);
}`,
    'заготовка');

fs.writeFileSync(ep, e, 'utf8');
console.log('черновик записан');
