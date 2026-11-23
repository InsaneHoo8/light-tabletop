import fs from 'node:fs';

const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

/* Хайповый взрыв: 3 урона */
const oldHype = "desc: 'четыре урона цели и запрет обычной атаки на её ходу', ops: [{ t: 'dmg', who: 'target', n: 4 }, { t: 'noAttack', who: 'target' }]";
const newHype = "desc: 'три урона цели и запрет обычной атаки на её ходу', ops: [{ t: 'dmg', who: 'target', n: 3 }, { t: 'noAttack', who: 'target' }]";
if (!c.includes(oldHype)) throw new Error('не найден хайповый взрыв');
c = c.replace(oldHype, newHype);
console.log('ok: хайповый взрыв три урона');

/* Боря: штраф плюс два в тексте */
const oldPassive = "passive: 'Когда не хватает двух энергии, прибавляет единицу к урону обычной атаки. Когда не хватает четырёх — прибавляет две единицы, но и сам получает на единицу больше урона от любых источников.'";
const newPassive = "passive: 'Когда не хватает двух энергии, прибавляет единицу к урону обычной атаки. Когда не хватает четырёх — прибавляет две единицы, но и сам получает на две единицы больше урона от любых источников.'";
if (!c.includes(oldPassive)) throw new Error('не найдена пассивка Бори');
c = c.replace(oldPassive, newPassive);
console.log('ok: текст пассивки Бори');

fs.writeFileSync(cp, c, 'utf8');

/* движок: штраф плюс два */
const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');
const oldD = "if (missBD >= 4) dmg = dmg + 1;";
const newD = "if (missBD >= 4) dmg = dmg + 2;";
if (!e.includes(oldD)) throw new Error('не найден штраф Бори');
e = e.replace(oldD, newD);
fs.writeFileSync(ep, e, 'utf8');
console.log('ok: движок, штраф Бори плюс два');
