import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let src = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

/* 1. Полностью переписываем pileAfterUse: нужен доступ к состоянию */
const start = src.indexOf('function pileAfterUse(');
if (start < 0) throw new Error('нет функции pileAfterUse');
let depth = 0;
let end = start;
for (let i = start; i < src.length; i++) {
  if (src[i] === '{') depth++;
  else if (src[i] === '}') {
    depth--;
    if (depth === 0) { end = i + 1; break; }
  }
}

const neu = `function pileAfterUse(s, p, ab) {
  /* сворованная карта уходит в сброс тому, у кого её взяли */
  if (ab && ab.stolenFrom) {
    for (var i = 0; i < s.players.length; i++) {
      if (s.players[i].name === ab.stolenFrom) {
        var owner = s.players[i];
        var clean = Object.assign({}, ab);
        delete clean.stolen;
        delete clean.stolenFrom;
        if (owner.pool.length > 0) owner.oldDiscard.push(clean);
        else owner.newDiscard.push(clean);
        return;
      }
    }
  }
  if (p.pool.length > 0) p.oldDiscard.push(ab);
  else p.newDiscard.push(ab);
}`;

src = src.slice(0, start) + neu + src.slice(end);

/* 2. Обновляем вызовы */
src = src.split('pileAfterUse(p, ab);').join('pileAfterUse(s, p, ab);');
src = src.split('pileAfterUse(v, ab);').join('pileAfterUse(s, v, ab);');
src = src.split('pileAfterUse(tdod, lostD);').join('pileAfterUse(s, tdod, lostD);');

fs.writeFileSync(ep, src, 'utf8');
console.log('сворованная карта уходит в сброс владельца');
