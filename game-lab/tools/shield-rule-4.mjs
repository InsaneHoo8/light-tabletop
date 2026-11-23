import fs from 'node:fs';

const p = 'game-lab/arena/engine.js';
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const old = `    if (p.noArtifacts > 0) continue;
    var needA = needsTarget(art);`;
const neu = `    if (p.noArtifacts > 0) continue;
    if (hasShieldOp(art) && shieldCardsFull(p)) continue;
    var needA = needsTarget(art);`;

if (!s.includes(old)) throw new Error('не найдено место у артефактов');
s = s.replace(old, neu);
fs.writeFileSync(p, s, 'utf8');
console.log('бот: артефакты со щитом отфильтрованы');
