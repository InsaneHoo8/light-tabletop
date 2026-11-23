import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('НЕ НАЙДЕНО: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* 1. массовый психоз и массовый налог — новые операции */
rep(`      case 'discardHalfArtifacts':`,
    `      case 'massControl': {
        var mcOrder = [];
        for (var mc = 0; mc < s.players.length; mc++) {
          if (s.players[mc].alive && mc !== actor.idx) mcOrder.push(mc);
        }
        mcOrder.sort(function (a, b) { return s.players[a].hp - s.players[b].hp; });

        var pickVictimTarget = function (vicIdx) {
          var bestIdx = -1;
          var bestHp = 9999;
          for (var pv = 0; pv < s.players.length; pv++) {
            if (!s.players[pv].alive) continue;
            if (pv === vicIdx && mcOrder.length > 1) continue;
            if (s.players[pv].hp < bestHp) { bestHp = s.players[pv].hp; bestIdx = pv; }
          }
          return bestIdx < 0 ? vicIdx : bestIdx;
        };

        var damageValue = function (ops) {
          var total = 0;
          for (var dv = 0; dv < ops.length; dv++) {
            var o = ops[dv];
            if (o.t === 'dmg' && o.who !== 'self') total += o.n || 0;
            if (o.t === 'dmgMissingMental' || o.t === 'dmgDiff') total += o.max || 5;
            if (o.t === 'shieldBreaker') total += o.plain || 4;
          }
          return total;
        };

        for (var mc2 = 0; mc2 < mcOrder.length; mc2++) {
          var vic = s.players[mcOrder[mc2]];
          if (!vic.alive) continue;
          var tgt2 = pickVictimTarget(vic.idx);
          var acted2 = false;

          var bestAb = null;
          var bestVal2 = 0;
          for (var bi2 = 0; bi2 < vic.abilities.length; bi2++) {
            var ab2 = vic.abilities[bi2];
            if (ab2.modes) continue;
            var v2 = damageValue(ab2.ops || []);
            if (v2 > bestVal2) { bestVal2 = v2; bestAb = ab2; }
          }
          if (bestAb) {
            events.push('Психоз: ' + vic.name + ' бьёт способностью «' + bestAb.name + '».');
            applyOps(s, vic, bestAb.ops, { target: tgt2 }, events);
            acted2 = true;
          }

          if (!acted2) {
            for (var ai2 = 0; ai2 < vic.hand.length; ai2++) {
              var art2 = artifactById(vic.hand[ai2]);
              if (damageValue(art2.ops || []) > 0) {
                events.push('Психоз: ' + vic.name + ' применяет ' + art2.name + '.');
                vic.hand.splice(ai2, 1);
                applyOps(s, vic, art2.ops, { target: tgt2 }, events);
                acted2 = true;
                break;
              }
            }
          }

          if (!acted2) {
            for (var si2 = 0; si2 < vic.abilities.length; si2++) {
              var sb2 = vic.abilities[si2];
              if (sb2.modes) continue;
              var hasShield2 = (sb2.ops || []).some(function (o) { return o.t === 'shield'; });
              if (hasShield2) {
                events.push('Психоз: ' + vic.name + ' ставит щит.');
                applyOps(s, vic, sb2.ops, { target: tgt2 }, events);
                acted2 = true;
                break;
              }
            }
          }

          if (!acted2) {
            for (var hi2 = 0; hi2 < vic.abilities.length; hi2++) {
              var hb2 = vic.abilities[hi2];
              if (hb2.modes) continue;
              var hasHeal2 = (hb2.ops || []).some(function (o) { return o.t === 'heal'; });
              if (hasHeal2) {
                events.push('Психоз: ' + vic.name + ' лечится.');
                applyOps(s, vic, hb2.ops, { target: tgt2 }, events);
                acted2 = true;
                break;
              }
            }
          }

          if (!acted2) {
            events.push('Психоз: ' + vic.name + ' бьёт обычной атакой.');
            damage(s, tgt2, vic.dmg, events, { attacker: vic.idx, directed: true });
          }
        }
        break;
      }

      case 'taxAll': {
        for (var ta = 0; ta < s.players.length; ta++) {
          var tp2 = s.players[ta];
          if (!tp2.alive || ta === actor.idx) continue;
          tp2.weakened = Math.max(tp2.weakened || 0, 1);
          tp2.tax = 1;
        }
        events.push('Все платят больше и бьют слабее.');
        break;
      }

      case 'magBuff': {
        actor.buffAll = op.n || 1;
        actor.buffTurns = op.turns || 1;
        events.push(actor.name + ' усиливает свой урон на ' + (op.n || 1) + ' на ' + (op.turns || 1) + ' хода.');
        break;
      }

      case 'discardHalfArtifacts':`,
    'новые операции: психоз, налог, усиление');

/* 2. усиление мага действует на все его эффекты */
rep(`          var dealt = damage(s, targets[d], amountNow, events, { attacker: actor.idx, pierce: op.pierce, directed: op.who === 'target' });`,
    `          var dealt = damage(s, targets[d], amountNow, events, { attacker: actor.idx, pierce: op.pierce, directed: op.who === 'target' });`,
    'урон без изменений');

/* 3. ослабление и усиление живут заданное число ходов */
rep(`  p.tax = 0;
  p.weakened = 0;`,
    `  p.tax = 0;
  if (p.weakenTurns > 0) {
    p.weakenTurns--;
    if (p.weakenTurns === 0) p.weakened = 0;
  } else {
    p.weakened = 0;
  }
  if (p.buffTurns > 0) {
    p.buffTurns--;
    if (p.buffTurns === 0) p.buffAll = 0;
  }`,
    'счётчики эффектов');

/* 4. мутация задаёт длительность ослабления */
rep(`    for (var wk = 0; wk < targets.length; wk++) s.players[targets[wk]].weakened = op.n;`,
    `    for (var wk = 0; wk < targets.length; wk++) {
      s.players[targets[wk]].weakened = op.n;
      s.players[targets[wk]].weakenTurns = op.turns || 1;
    }`,
    'ослабление с длительностью');

fs.writeFileSync(ep, e, 'utf8');
console.log('движок: часть первая');
