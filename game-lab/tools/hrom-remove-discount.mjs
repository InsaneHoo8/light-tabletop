import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* скидка на способности убрана */
rep(`  if (p.charId === 'hrom' && p.shield > 0) totalCost = Math.max(0, totalCost - 1);\n`, '', 'Хром: скидка на способности убрана');

/* скидка на артефакты убрана */
rep(`  if (p.charId === 'hrom' && p.shield > 0 && payMental > 0) payMental = Math.max(0, payMental - 1);\n`, '', 'Хром: скидка на артефакты убрана');

fs.writeFileSync(ep, e, 'utf8');

const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');
const at = c.indexOf("id: 'hrom'");
const end = c.indexOf('abilities: [', at);
let block = c.slice(at, end);
block = block.replace(/passive: '[^']*'/,
  "passive: 'Любой получаемый щит даёт на две единицы больше.'");
c = c.slice(0, at) + block + c.slice(end);
fs.writeFileSync(cp, c, 'utf8');
console.log('текст пассивки Хрома обновлён');
