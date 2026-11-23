import fs from 'node:fs';

/* 1. Мирай: обмен артефактами теперь тратит действие */
const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

const old = `    p.passiveUsed.trade = true;
    s.events = events;
    return { ok: true, text: events.join(' ') };`;
const neu = `    p.passiveUsed.trade = true;
    s.events = events;
    checkWinner(s);
    if (s.phase !== 'over') endTurn(s, events);
    return { ok: true, text: events.join(' ') };`;

if (!e.includes(old)) throw new Error('не найден блок обмена Мирай');
e = e.replace(old, neu);
fs.writeFileSync(ep, e, 'utf8');
console.log('Мирай: обмен тратит действие');

/* 2. Жюльен: урон обычной атаки 3 */
const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');
const at = c.indexOf("id: 'zhulien'");
if (at < 0) throw new Error('нет Жюльена');
const end = c.indexOf('abilities: [', at);
let block = c.slice(at, end);
const before = block.match(/dmg: (\d+)/)[1];
block = block.replace(/dmg: \d+/, 'dmg: 3');
block = block.replace(/Обычной атакой может украсть артефакт вместо удара\./, 'Обычной атакой может украсть артефакт вместо удара.');
c = c.slice(0, at) + block + c.slice(end);
fs.writeFileSync(cp, c, 'utf8');
console.log('Жюльен: урон ' + before + ' -> 3');

/* 3. Текст пассивки Мирай */
let c2 = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');
c2 = c2.replace(
  "Обмен активами: раз за ход меняется артефактом с любым игроком, не тратя действие. Сначала забирает артефакты киберпанка.",
  "Обмен активами: раз за ход меняется артефактом с любым игроком. Это тратит действие. Сначала забирает артефакты киберпанка."
);
fs.writeFileSync(cp, c2, 'utf8');
console.log('текст пассивки Мирай обновлён');
