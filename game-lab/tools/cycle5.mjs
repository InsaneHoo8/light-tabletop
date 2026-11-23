import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

const old = `  if ((p.style === 'hoarder' && p.hand.length < p.artifactLimit) ||
      (p.style === 'hoarder3' && p.hand.length < 3)) {
    var hoardList = candidates(s, p);
    var takes = hoardList.filter(function (c) { return c.action === 'take'; });
    if (takes.length) return pickBest(takes);
  }`;

const neu = `  if ((p.style === 'hoarder' && p.hand.length < p.artifactLimit) ||
      (p.style === 'hoarder3' && p.hand.length < 3)) {
    var hoardList = candidates(s, p);
    var takes = hoardList.filter(function (c) { return c.action === 'take'; });
    if (takes.length) return pickBest(takes);
  }

  /* цикл: копит до пяти, играет обычным стилем, пока не останется одна карта */
  if (p.style === 'cycle5') {
    if (p.hoardMode === undefined) p.hoardMode = true;
    if (p.hoardMode && p.hand.length >= 5) p.hoardMode = false;
    if (!p.hoardMode && p.hand.length <= 1) p.hoardMode = true;
    if (p.hoardMode) {
      var c5list = candidates(s, p);
      var c5takes = c5list.filter(function (c) { return c.action === 'take'; });
      if (c5takes.length) return pickBest(c5takes);
    }
  }`;

if (!e.includes(old)) throw new Error('не найден блок копящего');
e = e.replace(old, neu);
fs.writeFileSync(ep, e, 'utf8');
console.log('движок: цикл копит-играет');
