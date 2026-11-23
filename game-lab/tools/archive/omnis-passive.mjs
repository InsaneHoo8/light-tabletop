import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('НЕ НАЙДЕНО: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* берёт один артефакт, как все */
rep("    var takeCount = p.charId === 'omnis' ? 2 : 1;", '    var takeCount = 1;', 'Омнис: один артефакт');

/* скидка на чужие артефакты — две единицы */
rep("    if (p.charId === 'omnis' && payMental > 0) payMental = Math.max(0, payMental - 1);",
    "    if (p.charId === 'omnis' && payMental > 0) payMental = Math.max(0, payMental - 2);",
    'Омнис: скидка две единицы');

fs.writeFileSync(ep, e, 'utf8');

const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');
const at = c.indexOf("id: 'omnis'");
const end = c.indexOf('abilities: [', at);
let block = c.slice(at, end);
block = block.replace(/passive: '[^']*'/,
  "passive: 'Артефакты чужих миров стоят на две менталки меньше.'");
c = c.slice(0, at) + block + c.slice(end);
fs.writeFileSync(cp, c, 'utf8');
console.log('карта: текст пассивки заменён');
