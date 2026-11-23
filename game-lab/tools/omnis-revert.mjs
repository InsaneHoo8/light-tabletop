import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('НЕ НАЙДЕНО: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* откат эксперимента с дополнительным действием */
rep(`    if (p.charId === 'omnis' && !p.artExtraUsed) {
      p.artExtraUsed = true;
      p.extraActions += 1;
      events.push('Омнис получает дополнительное действие за артефакт.');
    }
`, '', 'дополнительное действие убрано');

rep(`    extraActions: 0,
    artExtraUsed: false,`, `    extraActions: 0,`, 'флаг убран из игрока');

rep(`  p.tax = 0;
  p.artExtraUsed = false;`, `  p.tax = 0;`, 'сброс флага убран');

fs.writeFileSync(ep, e, 'utf8');
console.log('движок: эксперимент отменён');
