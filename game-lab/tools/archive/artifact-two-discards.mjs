import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* два сброса артефактов */
rep(`    deck: [],
    discard: [],`,
    `    deck: [],
    oldDiscard: [],
    newDiscard: [],
    recycling: false,`,
    'два сброса в состоянии');

/* куда уходит сыгранный артефакт */
rep(`function reshuffleDeck(s, events) {
  if (!s.discard.length) return;
  s.deck = shuffle(s, s.discard);
  s.discard = [];
  events.push('Сброс артефактов перемешан в колоду.');
}`,
    `function pileArtifact(s, id) {
  if (s.recycling) s.newDiscard.push(id);
  else s.oldDiscard.push(id);
}

/* Колода добирается сначала из старого сброса, потом из нового. */
function reshuffleDeck(s, events) {
  if (s.oldDiscard.length) {
    s.deck = shuffle(s, s.oldDiscard);
    s.oldDiscard = [];
    s.recycling = true;
    events.push('Старый сброс артефактов перемешан в колоду.');
    return;
  }
  if (s.newDiscard.length) {
    s.deck = shuffle(s, s.newDiscard);
    s.newDiscard = [];
    s.recycling = false;
    events.push('Новый сброс артефактов перемешан в колоду.');
    return;
  }
  events.push('Артефактов больше нет.');
}`,
    'сбросы артефактов');

/* все места, где карта уходила в единый сброс */
const pushes = [
  ['    p.hand.splice(picks.artifact, 1);\n    s.discard.push(cardId);', '    p.hand.splice(picks.artifact, 1);\n    pileArtifact(s, cardId);'],
  ['      p.hand.splice(idx, 1);\n      s.discard.push(exId);\n      var bestIdx', '      p.hand.splice(idx, 1);\n      pileArtifact(s, exId);\n      var bestIdx'],
  ['      p.hand.splice(idx, 1);\n      s.discard.push(exId);\n      var back2', '      p.hand.splice(idx, 1);\n      pileArtifact(s, exId);\n      var back2'],
  ['      p.hand.splice(idx, 1);\n      s.discard.push(exId);\n      p.mana', '      p.hand.splice(idx, 1);\n      pileArtifact(s, exId);\n      p.mana'],
  ['          var dropped = tdc.hand.splice(Math.floor(rand(s) * tdc.hand.length), 1)[0];\n          s.discard.push(dropped);', '          var dropped = tdc.hand.splice(Math.floor(rand(s) * tdc.hand.length), 1)[0];\n          pileArtifact(s, dropped);'],
  ['          while (tdla.hand.length) s.discard.push(tdla.hand.pop());', '          while (tdla.hand.length) pileArtifact(s, tdla.hand.pop());'],
  ['            var cardD = tdod.hand.splice(Math.floor(rand(s) * tdod.hand.length), 1)[0];\n            s.discard.push(cardD);', '            var cardD = tdod.hand.splice(Math.floor(rand(s) * tdod.hand.length), 1)[0];\n            pileArtifact(s, cardD);']
];

let done = 0;
for (const [oldS, newS] of pushes) {
  if (e.includes(oldS)) {
    e = e.split(oldS).join(newS);
    done++;
  }
}
console.log('мест переведено на новый сброс: ' + done);

/* остатки единого сброса */
const left = (e.match(/s\.discard/g) || []).length;
console.log('осталось упоминаний s.discard: ' + left);

fs.writeFileSync(ep, e, 'utf8');
console.log('движок: два сброса артефактов');
