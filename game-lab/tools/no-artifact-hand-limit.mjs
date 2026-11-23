import fs from 'node:fs';

/* лимит руки артефактов снят у всех */
const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');
const before = (c.match(/artifactLimit: \d+/g) || []).length;
c = c.replace(/artifactLimit: \d+/g, 'artifactLimit: 999');
fs.writeFileSync(cp, c, 'utf8');
console.log('карты: лимит снят, полей было ' + before);

/* если поле где-то отсутствует — движок подставит сто */
const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');
e = e.replace('artifactLimit: ch.artifactLimit || 5,', 'artifactLimit: ch.artifactLimit || 999,');
fs.writeFileSync(ep, e, 'utf8');
console.log('движок: значение по умолчанию сто');
