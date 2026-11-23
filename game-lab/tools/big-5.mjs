import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

const old = `        var pickVictimTarget = function (vicIdx) {
          var bestIdx = -1;
          var bestHp = 9999;
          for (var pv = 0; pv < s.players.length; pv++) {
            if (!s.players[pv].alive) continue;
            if (pv === vicIdx && mcOrder.length > 1) continue;
            if (s.players[pv].hp < bestHp) { bestHp = s.players[pv].hp; bestIdx = pv; }
          }
          return bestIdx < 0 ? vicIdx : bestIdx;
        };`;

const neu = `        /* подчинённые бьют друг друга, а не Эт’Кору */
        var pickVictimTarget = function (vicIdx) {
          var bestIdx = -1;
          var bestHp = 9999;
          for (var pv = 0; pv < s.players.length; pv++) {
            if (!s.players[pv].alive) continue;
            if (pv === vicIdx) continue;
            if (pv === actor.idx) continue;
            if (s.players[pv].hp < bestHp) { bestHp = s.players[pv].hp; bestIdx = pv; }
          }
          if (bestIdx < 0) {
            for (var pv2 = 0; pv2 < s.players.length; pv2++) {
              if (s.players[pv2].alive && pv2 !== vicIdx) { bestIdx = pv2; break; }
            }
          }
          return bestIdx < 0 ? vicIdx : bestIdx;
        };`;

if (!e.includes(old)) throw new Error('не найден выбор цели психоза');
e = e.replace(old, neu);
fs.writeFileSync(ep, e, 'utf8');
console.log('психоз: цели не Эт’Кора');
