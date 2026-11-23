import fs from 'node:fs';

/* движок: Люся вместо ресурсов берёт артефакт */
const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

const old = `        if (actor.charId === 'lyusya' && targets.length > 1 && dealt > 0) {
          actor.mental = Math.min(actor.maxMental, actor.mental + 1);
          actor.mana = Math.min(actor.maxMana, actor.mana + 1);
          actor.hp = Math.min(actor.maxHp, actor.hp + 1);
          events.push('Хайп: Люся получает по единице ресурсов.');
        }`;

const neu = `        if (actor.charId === 'lyusya' && targets.length > 1 && dealt > 0) {
          if (actor.hand.length < actor.artifactLimit) {
            if (!s.deck.length) reshuffleDeck(s, events);
            if (s.deck.length) {
              actor.hand.push(s.deck.shift());
              events.push('Хайп: Люся берёт артефакт.');
            }
          } else {
            events.push('Хайп: рука артефактов полна.');
          }
        }`;

if (!e.includes(old)) throw new Error('не найдена пассивка Люси');
e = e.replace(old, neu);
fs.writeFileSync(ep, e, 'utf8');
console.log('движок: пассивка Люси берёт артефакт');

/* текст пассивки */
const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');
const at = c.indexOf("id: 'lyusya'");
const end = c.indexOf('abilities: [', at);
let block = c.slice(at, end);
block = block.replace(/passive: '[^']*'/,
  "passive: 'Нанеся за одно действие урон по двум и более целям, берёт один артефакт.'");
c = c.slice(0, at) + block + c.slice(end);
fs.writeFileSync(cp, c, 'utf8');
console.log('карта: текст пассивки обновлён');
