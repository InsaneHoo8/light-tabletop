import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* бот не предлагает карты щита, пока щит активен */
rep(`      if (ab.needArtifacts && p.hand.length < ab.needArtifacts) continue;
      var needT = needsTarget(def);`,
    `      if (ab.needArtifacts && p.hand.length < ab.needArtifacts) continue;
      if (hasShieldOp(def) && shieldCardsFull(p)) continue;
      var needT = needsTarget(def);`,
    'бот: способности со щитом');

fs.writeFileSync(ep, e, 'utf8');
console.log('готово');
