import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

const fixes = [
  ['            s.discard.push(dropped);', '            pileArtifact(s, dropped);'],
  ['    s.discard.push(exId);', '    pileArtifact(s, exId);'],
  ['  if ((s.deck.length || s.discard.length) && p.hand.length < p.artifactLimit)',
   '  if ((s.deck.length || s.oldDiscard.length || s.newDiscard.length) && p.hand.length < p.artifactLimit)']
];

for (const [oldS, newS] of fixes) {
  if (!e.includes(oldS)) {
    console.log('не найдено: ' + oldS.trim().slice(0, 40));
    continue;
  }
  e = e.split(oldS).join(newS);
  console.log('ok: ' + oldS.trim().slice(0, 40));
}

fs.writeFileSync(ep, e, 'utf8');
const left = (e.match(/s\.discard/g) || []).length;
console.log('осталось s.discard: ' + left);
