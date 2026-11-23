import fs from 'node:fs';

const path = 'game-lab/arena/engine.js';
let src = fs.readFileSync(path, 'utf8');

function replaceOnce(old, neu, label) {
  if (!src.includes(old)) throw new Error('не найдено: ' + label);
  src = src.replace(old, neu);
  console.log('ok: ' + label);
}

/* 1. Шаги обмена: выбор карты и выбор, на что менять */
replaceOnce(
  `  if (actionId === 'attack') {
    if (picks.target === undefined || picks.target === null) {
      var nb = neighbors(s, p.idx);`,
  `  if (actionId === 'exchange') {
    if (!p.hand.length) return null;
    if (picks.artifact === undefined || picks.artifact === null) {
      return {
        kind: 'artifact',
        question: 'Какой артефакт обменять?',
        options: p.hand.map(function (id, i) {
          var a = artifactById(id);
          return { index: i, label: a.name + ' — обмен ' + a.trade };
        })
      };
    }
    var canRestore = p.discardAb.length > 0 && p.abilities.length < p.handLimit;
    if (canRestore && (picks.mode === undefined || picks.mode === null)) {
      return {
        kind: 'mode',
        question: 'На что обменять?',
        options: [
          { index: 0, label: 'на энергию' },
          { index: 1, label: 'на возврат сброшенной способности' }
        ]
      };
    }
    return null;
  }
  if (actionId === 'attack') {
    if (picks.target === undefined || picks.target === null) {
      var nb = neighbors(s, p.idx);`,
  'шаги обмена'
);

/* 2. Исполнение */
replaceOnce(
  `  } else if (actionId === 'exchange') {
    if (!p.hand.length) return { ok: false, text: 'Нечего обменивать.' };
    var idx = picks.artifact === undefined || picks.artifact === null ? 0 : picks.artifact;
    var exId = p.hand[idx];
    if (!exId) return { ok: false, text: 'Нет такого артефакта.' };
    var ex = artifactById(exId);
    p.hand.splice(idx, 1);
    s.discard.push(exId);
    var healsEnergyCard = ex.ops.some(function (o) { return o.t === 'energy' && o.who === 'self'; });
    if (healsEnergyCard) {
      p.hp = Math.min(p.maxHp, p.hp + ex.trade);
      events.push(p.name + ' обменивает ' + ex.name + ' на здоровье.');
    } else {
      p.mana = Math.min(p.maxMana, p.mana + ex.trade);
      events.push(p.name + ' обменивает ' + ex.name + ' на энергию.');
      freeAction = true;
    }
  }`,
  `  } else if (actionId === 'exchange') {
    if (!p.hand.length) return { ok: false, text: 'Нечего обменивать.' };
    var idx = picks.artifact === undefined || picks.artifact === null ? 0 : picks.artifact;
    var exId = p.hand[idx];
    if (!exId) return { ok: false, text: 'Нет такого артефакта.' };
    var ex = artifactById(exId);
    var wantAbility = picks.mode === 1;

    if (wantAbility) {
      if (!p.discardAb.length) return { ok: false, text: 'Сброшенных способностей нет.' };
      if (p.abilities.length >= p.handLimit) return { ok: false, text: 'Рука заполнена.' };
      p.hand.splice(idx, 1);
      s.discard.push(exId);
      var bestIdx = 0;
      var bestVal = -Infinity;
      for (var di = 0; di < p.discardAb.length; di++) {
        var cand = p.discardAb[di];
        var v = scoreOps(cand.ops || [], s, p, pickWeakest(s, p.idx, -1)) / Math.max(1, cand.cost);
        if (v > bestVal) { bestVal = v; bestIdx = di; }
      }
      var back2 = p.discardAb.splice(bestIdx, 1)[0];
      p.abilities.push(back2);
      events.push(p.name + ' обменивает ' + ex.name + ' и возвращает способность «' + back2.name + '».');
      freeAction = true;
    } else {
      p.hand.splice(idx, 1);
      s.discard.push(exId);
      p.mana = Math.min(p.maxMana, p.mana + ex.trade);
      events.push(p.name + ' обменивает ' + ex.name + ' на энергию.');
      freeAction = true;
    }
  }`,
  'обмен: энергия или способность'
);

/* 3. Бот */
replaceOnce(
  `    out.push({
      action: 'useArtifact',
      picks: { artifact: k, target: needA ? weak : null },
      score: scA / Math.max(1, pay + 1)
    });
  }`,
  `    out.push({
      action: 'useArtifact',
      picks: { artifact: k, target: needA ? weak : null },
      score: scA / Math.max(1, pay + 1)
    });

    var manaGap = p.maxMana - p.mana;
    if (manaGap > 0) {
      out.push({
        action: 'exchange',
        picks: { artifact: k, mode: 0 },
        score: Math.min(art.trade, manaGap) * 0.9
      });
    }
    if (p.discardAb.length && p.abilities.length < p.handLimit) {
      var bestBack = 0;
      for (var db = 0; db < p.discardAb.length; db++) {
        var cAb = p.discardAb[db];
        var cv = scoreOps(cAb.ops || [], s, p, weak) / Math.max(1, cAb.cost);
        if (cv > bestBack) bestBack = cv;
      }
      out.push({ action: 'exchange', picks: { artifact: k, mode: 1 }, score: bestBack * 0.85 });
    }
  }`,
  'бот: варианты обмена'
);

fs.writeFileSync(path, src, 'utf8');
