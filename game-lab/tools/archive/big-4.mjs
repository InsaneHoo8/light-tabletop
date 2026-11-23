import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('НЕ НАЙДЕНО: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* усиление мага на все его эффекты */
rep(`  /* реакция защищающегося */`,
    `  /* Маг: усиление всех своих эффектов на два хода */
  if (opts && opts.attacker !== undefined && opts.attacker !== null) {
    var atkP = s.players[opts.attacker];
    if (atkP && atkP.buffAll) dmg = dmg + atkP.buffAll;
  }

  /* реакция защищающегося */`,
    'усиление мага');

/* ворованные способности Эт’Коры дешевле */
rep(`    if (p.charId === 'hrom' && p.shield > 0) totalCost = Math.max(0, totalCost - 1);`,
    `    if (p.charId === 'hrom' && p.shield > 0) totalCost = Math.max(0, totalCost - 1);
    if (p.charId === 'etkora' && ab.stolen) totalCost = Math.max(0, totalCost - 1);`,
    'Эт’Кора: скидка на ворованное');

/* поля для новых эффектов */
rep(`    weakened: 0,`,
    `    weakened: 0,
    weakenTurns: 0,
    buffAll: 0,
    buffTurns: 0,`,
    'поля эффектов');

fs.writeFileSync(ep, e, 'utf8');
console.log('движок: часть вторая');
