import fs from 'node:fs';

const p = 'game-lab/arena/engine.js';
let src = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const old = `            var taken = tsa2.abilities.splice(Math.floor(rand(s) * tsa2.abilities.length), 1)[0];
            taken.stolen = true;`;
const neu = `            var taken = tsa2.abilities.splice(Math.floor(rand(s) * tsa2.abilities.length), 1)[0];
            /* копия, чтобы метка «сворована» не оставалась на общей карте между партиями */
            taken = Object.assign({}, taken);
            taken.stolen = true;`;

if (!src.includes(old)) throw new Error('не найден блок кражи');
src = src.replace(old, neu);
fs.writeFileSync(p, src, 'utf8');
console.log('кража: карта копируется');
