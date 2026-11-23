import fs from 'node:fs';

const path = 'game-lab/arena/engine.js';
let src = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!src.includes(old)) throw new Error('не найдено: ' + label);
  src = src.replace(old, neu);
  console.log('ok: ' + label);
}

/* поля */
rep(
  `    forceAttack: 0,`,
  `    forceAttack: 0,
    restrictTarget: null,
    restrictArmed: false,`,
  'поля ограничения'
);

/* операция: запрет самому себе бить выбранную цель на следующем ходу */
rep(
  `      case 'noAttackSelf':`,
  `      case 'mirrorRestrict':
        actor.restrictTarget = targets[0];
        actor.restrictArmed = false;
        events.push(actor.name + ' на следующем ходу не сможет бить ' + s.players[targets[0]].acc + '.');
        break;

      case 'noAttackSelf':`,
  'операция зеркального запрета'
);

/* проверка в атаке */
rep(
  `  if (actionId === 'attack') {
    if (p.noAttack > 0) return { ok: false, text: 'Обычная атака запрещена.' };`,
  `  if (actionId === 'attack') {
    if (p.noAttack > 0) return { ok: false, text: 'Обычная атака запрещена.' };
    if (p.restrictArmed && p.restrictTarget !== null && picks.target === p.restrictTarget) {
      return { ok: false, text: 'Мирный договор: эту цель бить нельзя до конца хода.' };
    }`,
  'запрет в атаке'
);

/* взвод и снятие ограничения по кругу */
rep(
  `  var nextP = s.players[s.turn];`,
  `  if (p.restrictArmed) {
    p.restrictArmed = false;
    p.restrictTarget = null;
  }

  var nextP = s.players[s.turn];
  if (nextP.restrictTarget !== null) nextP.restrictArmed = true;`,
  'взвод ограничения'
);

fs.writeFileSync(path, src, 'utf8');

/* карта */
const cpath = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cpath, 'utf8').replace(/\r\n/g, '\n');
const oldCard = "{ id: 'mirny', name: 'Мирный договор', cost: 1, target: true, desc: 'цель не может атаковать вас на своём ходу, а вы не можете бить её на следующем своём', ops: [{ t: 'noAttack', who: 'target' }] }";
const newCard = "{ id: 'mirny', name: 'Мирный договор', cost: 1, target: true, desc: 'цель не может атаковать вас на своём ходу, а вы не можете бить её на следующем своём', ops: [{ t: 'noAttack', who: 'target' }, { t: 'mirrorRestrict' }] }";
if (!c.includes(oldCard)) throw new Error('не найдена карта Мирный договор');
c = c.replace(oldCard, newCard);
fs.writeFileSync(cpath, c, 'utf8');
console.log('карта обновлена');
