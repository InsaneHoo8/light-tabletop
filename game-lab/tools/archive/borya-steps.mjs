import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* атака: ступени */
rep(`    if (p.charId === 'borya') {
      var missBA = Math.max(0, p.maxMana - p.mana);
      dmgVal += Math.floor(missBA / 2);
    }`,
    `    if (p.charId === 'borya') {
      var missBA = Math.max(0, p.maxMana - p.mana);
      if (missBA >= 4) dmgVal += 2;
      else if (missBA >= 2) dmgVal += 1;
    }`,
    'Боря: ступени урона');

/* получаемый урон: при недостаче четырёх и больше — плюс один */
rep(`  /* реакция защищающегося */`,
    `  /* Боря: при недостаче четырёх энергии получает на единицу больше */
  if (t.charId === 'borya') {
    var missBD = Math.max(0, t.maxMana - t.mana);
    if (missBD >= 4) dmg = dmg + 1;
  }

  /* реакция защищающегося */`,
    'Боря: штраф на недостаче четырёх');

fs.writeFileSync(ep, e, 'utf8');

const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');
const at = c.indexOf("id: 'borya'");
const end = c.indexOf('abilities: [', at);
let block = c.slice(at, end);
block = block.replace(/passive: '[^']*'/,
  "passive: 'Когда не хватает двух энергии, прибавляет единицу к урону обычной атаки. Когда не хватает четырёх — прибавляет две единицы, но и сам получает на единицу больше урона от любых источников.'");
c = c.slice(0, at) + block + c.slice(end);
fs.writeFileSync(cp, c, 'utf8');
console.log('текст пассивки обновлён');
