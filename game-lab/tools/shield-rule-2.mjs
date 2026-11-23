import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* способность со щитом нельзя играть, пока щит активен */
rep(`    var needT = needsTarget(def);
    if (needT && (picks.target === undefined || picks.target === null)) return { ok: false, text: 'Нужна цель.' };
    p.mana -= totalCost;`,
    `    if (hasShieldOp(def) && shieldCardsFull(p)) return { ok: false, text: 'Щит уже активен, новую карту щита ставить нельзя.' };
    var needT = needsTarget(def);
    if (needT && (picks.target === undefined || picks.target === null)) return { ok: false, text: 'Нужна цель.' };
    p.mana -= totalCost;`,
    'способность: запрет при активном щите');

/* артефакт со щитом — то же */
rep(`    var needTA = needsTarget(art);
    if (needTA && (picks.target === undefined || picks.target === null)) return { ok: false, text: 'Нужна цель.' };
    p.mental -= payMental;`,
    `    if (hasShieldOp(art) && shieldCardsFull(p)) return { ok: false, text: 'Щит уже активен, новую карту щита ставить нельзя.' };
    var needTA = needsTarget(art);
    if (needTA && (picks.target === undefined || picks.target === null)) return { ok: false, text: 'Нужна цель.' };
    p.mental -= payMental;`,
    'артефакт: запрет при активном щите');

fs.writeFileSync(ep, e, 'utf8');
console.log('движок: запрет вторых карт щита');
