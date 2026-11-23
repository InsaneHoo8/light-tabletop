import fs from 'node:fs';

const path = 'game-lab/arena/engine.js';
let e = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* Безумный Маг: обмен даёт и энергию, и способность, и он выбирает какую */
rep(
  `      var taken = null;
      var fromWhere = '';
      if (p.pool.length > 0) {
        taken = p.pool.pop();
        fromWhere = 'из свежего пула';
      } else if (p.oldDiscard.length > 0) {
        taken = p.oldDiscard.pop();
        fromWhere = 'сверху старого сброса';
      }`,
  `      var taken = null;
      var fromWhere = '';
      if (p.charId === 'mag') {
        /* маг выбирает лучшую карту из свежего пула, а когда пул пуст — любую из старого сброса */
        var poolBest = null;
        var poolIdx = -1;
        for (var pi = 0; pi < p.pool.length; pi++) {
          var pv = scoreOps(p.pool[pi].ops || [], s, p, pickWeakest(s, p.idx, -1)) / Math.max(1, p.pool[pi].cost);
          if (poolBest === null || pv > poolBest) { poolBest = pv; poolIdx = pi; }
        }
        if (poolIdx >= 0) {
          taken = p.pool.splice(poolIdx, 1)[0];
          fromWhere = 'из свежего пула по выбору';
        } else if (p.oldDiscard.length > 0) {
          var oldBest = -1;
          var oldIdx = 0;
          for (var oi = 0; oi < p.oldDiscard.length; oi++) {
            var ov = scoreOps(p.oldDiscard[oi].ops || [], s, p, pickWeakest(s, p.idx, -1)) / Math.max(1, p.oldDiscard[oi].cost);
            if (ov > oldBest) { oldBest = ov; oldIdx = oi; }
          }
          taken = p.oldDiscard.splice(oldIdx, 1)[0];
          fromWhere = 'из старого сброса по выбору';
        }
      } else if (p.pool.length > 0) {
        taken = p.pool.pop();
        fromWhere = 'из свежего пула';
      } else if (p.oldDiscard.length > 0) {
        taken = p.oldDiscard.pop();
        fromWhere = 'сверху старого сброса';
      }`,
  'Маг: выбор карты при обмене'
);

rep(
  `      p.abilities.push(taken);
      events.push(p.name + ' обменивает ' + ex.name + ' и берёт «' + taken.name + '» ' + fromWhere + '.');
      freeAction = true;`,
  `      p.abilities.push(taken);
      if (p.charId === 'mag') {
        p.mana = Math.min(p.maxMana, p.mana + ex.trade);
        events.push(p.name + ' обменивает ' + ex.name + ' и получает «' + taken.name + '» ' + fromWhere + ', а также ' + ex.trade + ' энергии.');
      } else {
        events.push(p.name + ' обменивает ' + ex.name + ' и берёт «' + taken.name + '» ' + fromWhere + '.');
      }
      freeAction = true;`,
  'Маг: обмен даёт и энергию'
);

/* Мирай: обмен артефактами с любым игроком без действия, раз за ход */
rep(
  `  } else if (actionId === 'restore') {`,
  `  } else if (actionId === 'trade') {
    if (p.charId !== 'mirai') return { ok: false, text: 'Только Мирай умеет меняться.' };
    if (p.passiveUsed.trade) return { ok: false, text: 'Раз за ход.' };
    var tp = picks.target === undefined || picks.target === null ? null : s.players[picks.target];
    if (!tp || !tp.alive || tp.idx === p.idx) return { ok: false, text: 'Нужен другой игрок.' };
    if (!tp.hand.length) return { ok: false, text: 'У цели нет артефактов.' };
    var cyberIdx = -1;
    for (var ci = 0; ci < tp.hand.length; ci++) {
      if (artifactById(tp.hand[ci]).world === 'cyber') { cyberIdx = ci; break; }
    }
    var pickIdx = cyberIdx >= 0 ? cyberIdx : Math.floor(rand(s) * tp.hand.length);
    var gotCard = tp.hand.splice(pickIdx, 1)[0];
    p.hand.push(gotCard);
    if (p.hand.length > 1) {
      var giveIdx = 0;
      for (var gi = 0; gi < p.hand.length; gi++) {
        if (p.hand[gi] !== gotCard) { giveIdx = gi; break; }
      }
      var giveCard = p.hand.splice(giveIdx, 1)[0];
      tp.hand.push(giveCard);
      events.push(p.name + ' меняется: отдаёт ' + artifactById(giveCard).name + ' и берёт ' + artifactById(gotCard).name + '.');
    } else {
      events.push(p.name + ' забирает ' + artifactById(gotCard).name + '.');
    }
    p.passiveUsed.trade = true;
    s.events = events;
    return { ok: true, text: events.join(' ') };
  } else if (actionId === 'restore') {`,
  'Мирай: обмен артефактами'
);

/* Бот: новые варианты */
rep(
  `  if (s.deck.length || s.discard.length) out.push({ action: 'take', picks: {}, score: 1.2 });`,
  `  if (p.charId === 'zhulien' && p.noAttack === 0) {
    var nbS = neighbors(s, p.idx);
    for (var si2 = 0; si2 < nbS.length; si2++) {
      if (s.players[nbS[si2]].hand.length) {
        out.push({ action: 'attack', picks: { target: nbS[si2], steal: true }, score: 3.0 });
      }
    }
  }
  if (p.charId === 'mirai' && !p.passiveUsed.trade) {
    for (var mi = 0; mi < s.players.length; mi++) {
      if (mi === p.idx || !s.players[mi].alive || !s.players[mi].hand.length) continue;
      out.push({ action: 'trade', picks: { target: mi }, score: 2.2 });
    }
  }
  if (p.charId === 'glyuk' && !p.abilities.length && !p.passiveUsed.restore) {
    out.push({ action: 'restore', picks: {}, score: 3.5 });
  }
  if (s.deck.length || s.discard.length) out.push({ action: 'take', picks: {}, score: 1.2 });`,
  'бот: новые варианты пассивок'
);

fs.writeFileSync(path, e, 'utf8');
console.log('движок: Маг, Мирай и бот');
