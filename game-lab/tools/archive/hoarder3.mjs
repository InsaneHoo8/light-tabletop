import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

const old = `  if (p.style === 'hoarder' && p.hand.length < p.artifactLimit) {`;
const neu = `  if ((p.style === 'hoarder' && p.hand.length < p.artifactLimit) ||
      (p.style === 'hoarder3' && p.hand.length < 3)) {`;

if (!e.includes(old)) throw new Error('не найден блок копящего');
e = e.replace(old, neu);
fs.writeFileSync(ep, e, 'utf8');
console.log('движок: копящий до трёх');
