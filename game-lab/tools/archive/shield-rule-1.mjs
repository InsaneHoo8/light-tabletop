import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* 1. Щит больше не вытесняет прежний: пока карта щита активна, новую ставить нельзя */
rep(`        var maxCards = actor.charId === 'heil' ? 2 : 1;
        var cards = actor.shieldCards;

        if (maxCards === 1) {
          /* один щит: новый встаёт, только если он крепче прежнего */
          if (shieldVal <= actor.shield) {
            events.push('Щит не обновился: прежний крепче (' + actor.shield + ').');
            break;
          }
          actor.shield = 0;
          cards.length = 0;
        } else if (cards.length >= 2) {
          /* Хейл: две карты, новая вытесняет слабейшую */
          cards.sort(function (a, b) { return a.value - b.value; });
          var dropped = cards.shift();
          actor.shield -= dropped.value;
          events.push('Слабейший щит снят: ' + dropped.value + '.');
        }
        cards.push({ value: shieldVal });`,
    `        var maxCards = actor.charId === 'heil' ? 2 : 1;
        var cards = actor.shieldCards;

        /* пока активные карты щита не сброшены, новые ставить нельзя */
        if (cards.length >= maxCards) {
          events.push('Активная карта щита уже есть.');
          break;
        }
        cards.push({ value: shieldVal });`,
    'щит: не стакается и не заменяется');

/* 2. Запрет играть карту со щитом, пока щит активен */
rep(`function pileAfterUse(s, p, ab) {`,
    `function shieldCardsFull(p) {
  var maxCards = p.charId === 'heil' ? 2 : 1;
  return p.shieldCards.length >= maxCards;
}

function hasShieldOp(card) {
  var lists = [];
  if (card && card.ops) lists.push(card.ops);
  if (card && card.modes) for (var mi = 0; mi < card.modes.length; mi++) lists.push(card.modes[mi].ops || []);
  for (var li = 0; li < lists.length; li++) {
    for (var oi = 0; oi < lists[li].length; oi++) {
      if (lists[li][oi].t === 'shield') return true;
    }
  }
  return false;
}

function pileAfterUse(s, p, ab) {`,
    'вспомогательные проверки щита');

fs.writeFileSync(ep, e, 'utf8');
console.log('движок: базовые правила щита');
