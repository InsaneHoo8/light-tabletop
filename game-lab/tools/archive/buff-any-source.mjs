import fs from 'node:fs';

const path = 'game-lab/arena/engine.js';
let src = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const old = `      case 'dmg':
        for (var d = 0; d < targets.length; d++) {
          var dealt = damage(s, targets[d], amount, events, { attacker: actor.idx, pierce: op.pierce, directed: op.who === 'target' });`;

const neu = `      case 'dmg':
        /* прибавка к урону работает от любого источника: атака, способность, артефакт */
        var opBonus = 0;
        if (actor.buff > 0 && op.who !== 'self') {
          opBonus = actor.buff;
          actor.buff = 0;
          events.push('Прибавка к урону: +' + opBonus + '.');
        }
        for (var d = 0; d < targets.length; d++) {
          var amountNow = d === 0 ? amount + opBonus : amount;
          var dealt = damage(s, targets[d], amountNow, events, { attacker: actor.idx, pierce: op.pierce, directed: op.who === 'target' });`;

if (!src.includes(old)) throw new Error('не найден блок урона');
src = src.replace(old, neu);
fs.writeFileSync(path, src, 'utf8');
console.log('прибавка к урону работает от способностей и артефактов');
