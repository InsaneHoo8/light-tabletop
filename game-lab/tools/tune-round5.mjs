import fs from 'node:fs';

/* ---------- движок ---------- */
const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* Грог: пороги 18 и 14 */
rep(`    if (p.charId === 'grog' && p.hp <= 20) totalCost = Math.max(0, totalCost - 1);`,
    `    if (p.charId === 'grog' && p.hp <= 18) totalCost = Math.max(0, totalCost - 1);`,
    'Грог: скидка с восемнадцати');
rep(`          if (th.charId === 'grog' && th.hp <= 16) healAmount += 1;`,
    `          if (th.charId === 'grog' && th.hp <= 14) healAmount += 1;`,
    'Грог: лечение с четырнадцати');

/* Мирай: обмен снова без действия */
rep(`    p.passiveUsed.trade = true;
    s.events = events;
    checkWinner(s);
    if (s.phase !== 'over') endTurn(s, events);
    return { ok: true, text: events.join(' ') };`,
    `    p.passiveUsed.trade = true;
    s.events = events;
    return { ok: true, text: events.join(' ') };`,
    'Мирай: обмен без действия');

/* Люся: лечение по единице за каждую задетую цель */
rep(`          if (op.leech && dealt > 0) {`,
    `          if (op.leechPerTarget && dealt > 0) {
            actor.hp = Math.min(actor.maxHp, actor.hp + op.leechPerTarget);
            events.push(actor.name + ' восстанавливает ' + op.leechPerTarget + ' за задетую цель.');
          }
          if (op.leech && dealt > 0) {`,
    'лечение за каждую цель');

fs.writeFileSync(ep, e, 'utf8');

/* ---------- карты ---------- */
const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

const oldHunt = "ops: [{ t: 'dmg', who: 'others', n: 2, leech: true }] }";
const newHunt = "ops: [{ t: 'dmg', who: 'others', n: 2, leechPerTarget: 1 }] }";
if (!c.includes(oldHunt)) throw new Error('не найдена охота за лайками');
c = c.replace(oldHunt, newHunt);
console.log('Люся: лечение по единице за цель');

const oldOver = "{ id: 'singulyarnost', name: 'Перегрузка сингулярности', cost: 4, target: true, desc: 'восемь урона цели, по два всем остальным, четыре себе', ops: [{ t: 'dmg', who: 'target', n: 8 }, { t: 'dmg', who: 'others', n: 2 }, { t: 'dmg', who: 'self', n: 4, pierce: true }] }";
const newOver = "{ id: 'singulyarnost', name: 'Перегрузка сингулярности', cost: 4, target: true, desc: 'восемь урона цели, по два всем остальным, два себе', ops: [{ t: 'dmg', who: 'target', n: 8 }, { t: 'dmg', who: 'others', n: 2 }, { t: 'dmg', who: 'self', n: 2, pierce: true }] }";
if (!c.includes(oldOver)) throw new Error('не найдена перегрузка сингулярности');
c = c.replace(oldOver, newOver);
console.log('Маг: себе два вместо четырёх');

c = c.replace(
  "При двадцати здоровья способности дешевле, при шестнадцати лечение сильнее, при восьми урон больше.",
  "При восемнадцати здоровья способности дешевле, при четырнадцати лечение сильнее, при восьми урон больше."
);
c = c.replace(
  "Обмен активами: раз за ход меняется артефактом с любым игроком. Это тратит действие. Сначала забирает артефакты киберпанка.",
  "Обмен активами: раз за ход меняется одним артефактом с любым игроком, не тратя действие. Сначала забирает артефакты киберпанка."
);
fs.writeFileSync(cp, c, 'utf8');
console.log('тексты пассивок поправлены');
