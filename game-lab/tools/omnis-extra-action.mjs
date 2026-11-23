import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('НЕ НАЙДЕНО: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* поле-флаг */
rep(`    extraActions: 0,`, `    extraActions: 0,
    artExtraUsed: false,`, 'поле флага');

/* после применения артефакта Омнис получает одно дополнительное действие */
rep(`    if (art.freeAction) freeAction = true;`,
    `    if (p.charId === 'omnis' && !p.artExtraUsed) {
      p.artExtraUsed = true;
      p.extraActions += 1;
      events.push('Омнис получает дополнительное действие за артефакт.');
    }
    if (art.freeAction) freeAction = true;`,
    'Омнис: действие за артефакт');

/* сброс флага, когда ход реально переходит дальше */
rep(`  p.noAttack = 0;
  p.noAbilities = 0;
  p.noArtifacts = 0;
  p.tax = 0;`,
    `  p.noAttack = 0;
  p.noAbilities = 0;
  p.noArtifacts = 0;
  p.tax = 0;
  p.artExtraUsed = false;`,
    'сброс флага');

fs.writeFileSync(ep, e, 'utf8');
console.log('движок обновлён');
