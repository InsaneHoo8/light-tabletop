import fs from 'node:fs';

const p = 'game-lab/arena/engine.js';
let src = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const old = `        var maxCards = actor.charId === 'heil' ? 2 : 1;
        var cards = actor.shieldCards;
        if (cards.length >= maxCards) {
          /* новый щит заменяет самый слабый */
          cards.sort(function (a, b) { return a.value - b.value; });
          var dropped = cards.shift();
          events.push('Щит заменён, прежний снят: ' + dropped.value + '.');
          actor.shield -= dropped.value;
        }
        cards.push({ value: shieldVal });`;

const neu = `        var maxCards = actor.charId === 'heil' ? 2 : 1;
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
        cards.push({ value: shieldVal });`;

if (!src.includes(old)) throw new Error('не найден блок щита');
src = src.replace(old, neu);
fs.writeFileSync(p, src, 'utf8');
console.log('щит: одиночный заменяется только на более крепкий');
