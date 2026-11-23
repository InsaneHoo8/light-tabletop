import fs from 'node:fs';

const path = 'game-lab/arena/engine.js';
let src = fs.readFileSync(path, 'utf8');

function rep(old, neu, label) {
  if (!src.includes(old)) throw new Error('не найдено: ' + label);
  src = src.replace(old, neu);
  console.log('ok: ' + label);
}

/* 1. Поля игрока: пул, старый сброс, новый сброс */
rep(
  `    pool: ch.abilities.slice(),
    discardAb: [],`,
  `    pool: ch.abilities.slice(),
    oldDiscard: [],
    newDiscard: [],`,
  'поля сбросов'
);

/* 2. Куда уходит применённая карта */
rep(
  `    var usedAt = p.abilities.indexOf(ab);
    if (usedAt >= 0) {
      p.abilities.splice(usedAt, 1);
      p.discardAb.push(ab);
    }`,
  `    var usedAt = p.abilities.indexOf(ab);
    if (usedAt >= 0) {
      p.abilities.splice(usedAt, 1);
      pileAfterUse(p, ab);
    }`,
  'сброс после применения'
);

/* 3. То же для реакций */
rep(
  `    v.mana -= ab.cost;
    v.abilities.splice(i, 1);
    v.discardAb.push(ab);`,
  `    v.mana -= ab.cost;
    v.abilities.splice(i, 1);
    pileAfterUse(v, ab);`,
  'сброс после реакции'
);

/* 4. Функция распределения по сбросам */
rep(
  `function reshuffleDeck(s, events) {`,
  `/* Пока свежий пул не пуст, сыгранное идёт в старый сброс.
   Когда пул опустел, сыгранное идёт в новый сброс, из которого брать нельзя. */
function pileAfterUse(p, ab) {
  if (p.pool.length > 0) p.oldDiscard.push(ab);
  else p.newDiscard.push(ab);
}

function reshuffleDeck(s, events) {`,
  'функция сбросов'
);

/* 5. Обмен на способность: берём из свежего пула, потом сверху старого сброса */
rep(
  `    if (wantAbility) {
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
    } else {`,
  `    if (wantAbility) {
      if (p.abilities.length >= p.handLimit) return { ok: false, text: 'Рука заполнена.' };
      var taken = null;
      var fromWhere = '';
      if (p.pool.length > 0) {
        taken = p.pool.pop();
        fromWhere = 'из свежего пула';
      } else if (p.oldDiscard.length > 0) {
        taken = p.oldDiscard.pop();
        fromWhere = 'сверху старого сброса';
      }
      if (!taken) return { ok: false, text: 'Брать нечего: пул и старый сброс пусты.' };
      p.hand.splice(idx, 1);
      s.discard.push(exId);
      p.abilities.push(taken);
      events.push(p.name + ' обменивает ' + ex.name + ' и берёт «' + taken.name + '» ' + fromWhere + '.');
      freeAction = true;
    } else {`,
  'обмен на способность'
);

/* 6. Что можно взять следующим */
rep(
  `function pickOptions(s) {`,
  `/* Карта, которую даст обмен на способность прямо сейчас. */
function nextExchangeCard(p) {
  if (p.pool.length > 0) return p.pool[p.pool.length - 1];
  if (p.oldDiscard.length > 0) return p.oldDiscard[p.oldDiscard.length - 1];
  return null;
}

function pickOptions(s) {`,
  'карта следующего обмена'
);

/* 7. Условие показа выбора режима */
rep(
  `    var canRestore = p.discardAb.length > 0 && p.abilities.length < p.handLimit;`,
  `    var canRestore = nextExchangeCard(p) !== null && p.abilities.length < p.handLimit;`,
  'условие возврата'
);

/* 8. Бот: вариант возврата */
rep(
  `    if (p.discardAb.length && p.abilities.length < p.handLimit) {
      var bestBack = 0;
      for (var db = 0; db < p.discardAb.length; db++) {
        var cAb = p.discardAb[db];
        var cv = scoreOps(cAb.ops || [], s, p, weak) / Math.max(1, cAb.cost);
        if (cv > bestBack) bestBack = cv;
      }
      out.push({ action: 'exchange', picks: { artifact: k, mode: 1 }, score: bestBack * 0.85 });
    }`,
  `    var nextCard = nextExchangeCard(p);
    if (nextCard && p.abilities.length < p.handLimit) {
      var cv = scoreOps(nextCard.ops || [], s, p, weak) / Math.max(1, nextCard.cost);
      out.push({ action: 'exchange', picks: { artifact: k, mode: 1 }, score: cv * 0.85 });
    }`,
  'бот: возврат из пула'
);

fs.writeFileSync(path, src, 'utf8');
console.log('движок: два сброса для способностей');
