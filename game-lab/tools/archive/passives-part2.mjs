import fs from 'node:fs';

const path = 'game-lab/arena/cards.js';
let src = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const CAPS = {
  mirai: 5, hrom: 5, glyuk: 5, borya: 5, lyusya: 6, grigori: 5,
  mag: 5, grog: 5, zhulien: 5, omnis: 6, heil: 10, etkora: 5
};

for (const [id, cap] of Object.entries(CAPS)) {
  const at = src.indexOf(`id: '${id}'`);
  if (at < 0) throw new Error('нет персонажа ' + id);
  const end = src.indexOf('abilities: [', at);
  let block = src.slice(at, end);
  if (/shieldCap: \d+/.test(block)) {
    block = block.replace(/shieldCap: \d+/, 'shieldCap: ' + cap);
  } else {
    block = block.replace(/(handLimit: \d+,)/, `$1 shieldCap: ${cap},`);
  }
  src = src.slice(0, at) + block + src.slice(end);
}
fs.writeFileSync(path, src, 'utf8');
console.log('ёмкость щита проставлена');

/* ---------- движок: остальные пассивки ---------- */
const epath = 'game-lab/arena/engine.js';
let e = fs.readFileSync(epath, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* Эт’Кора: ворованные можно держать сверх лимита, но не больше шести */
rep(
  `      case 'stealAbility':
        for (var sab = 0; sab < targets.length; sab++) {
          var tsa2 = s.players[targets[sab]];
          for (var q3 = 0; q3 < op.n; q3++) {
            if (!tsa2.abilities.length) break;
            var taken = tsa2.abilities.splice(Math.floor(rand(s) * tsa2.abilities.length), 1)[0];
            actor.abilities.push(taken);
            events.push(actor.name + ' забирает способность «' + taken.name + '».');
          }
        }
        break;`,
  `      case 'stealAbility':
        for (var sab = 0; sab < targets.length; sab++) {
          var tsa2 = s.players[targets[sab]];
          for (var q3 = 0; q3 < op.n; q3++) {
            if (!tsa2.abilities.length) break;
            var taken = tsa2.abilities.splice(Math.floor(rand(s) * tsa2.abilities.length), 1)[0];
            taken.stolen = true;
            var ownCount = actor.abilities.filter(function (x) { return !x.stolen; }).length;
            var stolenCount = actor.abilities.filter(function (x) { return x.stolen; }).length;
            if (ownCount >= actor.handLimit && stolenCount < 6) {
              actor.abilities.push(taken);
              events.push(actor.name + ' забирает способность «' + taken.name + '» сверх лимита руки.');
            } else if (ownCount < actor.handLimit) {
              actor.abilities.push(taken);
              events.push(actor.name + ' забирает способность «' + taken.name + '».');
            } else {
              tsa2.abilities.push(taken);
              events.push('Ворованных уже шесть, карта остаётся у цели.');
              break;
            }
          }
        }
        break;`,
  'Эт’Кора: ворованные сверх лимита'
);

/* Жюльен: атака может украсть артефакт вместо урона */
rep(
  `  if (actionId === 'attack') {
    if (p.noAttack > 0) return { ok: false, text: 'Обычная атака запрещена.' };`,
  `  if (actionId === 'attack') {
    if (p.noAttack > 0) return { ok: false, text: 'Обычная атака запрещена.' };
    if (picks.steal) {
      if (p.charId !== 'zhulien') return { ok: false, text: 'Только Жюльен умеет красть вместо удара.' };
      var st = picks.target === undefined || picks.target === null ? null : s.players[picks.target];
      if (!st || !st.alive) return { ok: false, text: 'Нужна цель.' };
      if (!st.hand.length) return { ok: false, text: 'У цели нет артефактов.' };
      if (neighbors(s, p.idx).indexOf(picks.target) === -1) return { ok: false, text: 'Бить можно только соседа.' };
      var stolenCard = st.hand.splice(Math.floor(rand(s) * st.hand.length), 1)[0];
      p.hand.push(stolenCard);
      events.push(p.name + ' крадёт ' + artifactById(stolenCard).name + ' вместо удара.');
      s.events = events;
      endTurn(s, events);
      return { ok: true, text: events.join(' ') };
    }`,
  'Жюльен: кража вместо удара'
);

/* Глюк: пустая рука — вернуть две карты без действия */
rep(
  `  } else if (actionId === 'take') {`,
  `  } else if (actionId === 'restore') {
    if (p.charId !== 'glyuk') return { ok: false, text: 'Только Глюк умеет это.' };
    if (p.abilities.length) return { ok: false, text: 'Рука не пуста.' };
    if (p.passiveUsed.restore) return { ok: false, text: 'Раз за ход.' };
    var got2 = 0;
    for (var r2 = 0; r2 < 2; r2++) {
      var card2 = null;
      if (p.pool.length) card2 = p.pool.pop();
      else if (p.oldDiscard.length) card2 = p.oldDiscard.pop();
      if (!card2) break;
      p.abilities.push(card2);
      got2++;
    }
    if (!got2) return { ok: false, text: 'Брать нечего.' };
    p.passiveUsed.restore = true;
    events.push(p.name + ' восстанавливает ' + got2 + ' способности без действия.');
    s.events = events;
    return { ok: true, text: events.join(' ') };
  } else if (actionId === 'take') {`,
  'Глюк: восстановление без действия'
);

/* Сброс флагов пассивок в начале своего хода */
rep(
  `  var nextP = s.players[s.turn];`,
  `  var nextP = s.players[s.turn];
  nextP.passiveUsed = {};`,
  'сброс флагов пассивок'
);

fs.writeFileSync(epath, e, 'utf8');
console.log('движок: остальные пассивки');
