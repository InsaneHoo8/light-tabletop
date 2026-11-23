import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* убираем снижение получаемого урона */
rep(`  /* Боря: за каждые две недостающие от максимума энергии получает на единицу меньше, но не меньше одной */
  if (t.charId === 'borya') {
    var missB = Math.max(0, t.maxMana - t.mana);
    dmg = Math.max(1, dmg - Math.floor(missB / 2));
  }
`, '', 'Боря: снижение урона убрано');

/* возвращаем прибавку к обычной атаке */
rep(`    var dmgVal = p.dmg + p.buff;`,
    `    var dmgVal = p.dmg + p.buff;
    if (p.charId === 'borya') {
      var missBA = Math.max(0, p.maxMana - p.mana);
      dmgVal += Math.floor(missBA / 2);
    }`,
    'Боря: прибавка к атаке');

fs.writeFileSync(ep, e, 'utf8');

const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');
const at = c.indexOf("id: 'borya'");
const end = c.indexOf('abilities: [', at);
let block = c.slice(at, end);
block = block.replace(/passive: '[^']*'/,
  "passive: 'За каждые две недостающие от максимума единицы энергии прибавляет единицу к урону обычной атаки.'");
c = c.slice(0, at) + block + c.slice(end);
fs.writeFileSync(cp, c, 'utf8');
console.log('текст пассивки обновлён');
