import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

const old = `function botMove(s, noise) {
  if (s.phase !== 'main') return null;
  var p = me(s);
  if (s.priority) return priorityMove(s, p);
  var list = candidates(s, p);`;

const neu = `function botMove(s, noise) {
  if (s.phase !== 'main') return null;
  var p = me(s);

  /* копящий стиль: сначала набивает руку артефактами, потом играет как обычно */
  if (p.style === 'hoarder' && p.hand.length < p.artifactLimit) {
    var hoardList = candidates(s, p);
    var takes = hoardList.filter(function (c) { return c.action === 'take'; });
    if (takes.length) return pickBest(takes);
  }

  if (s.priority) return priorityMove(s, p);
  var list = candidates(s, p);`;

if (!e.includes(old)) throw new Error('не найден botMove');
e = e.replace(old, neu);
fs.writeFileSync(ep, e, 'utf8');
console.log('движок: копящий стиль');
