import fs from 'node:fs';

const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!e.includes(old)) throw new Error('не найдено: ' + label);
  e = e.replace(old, neu);
  console.log('ok: ' + label);
}

/* Боря: снижение получаемого урона, минимум единица */
rep(`  /* Боря: за каждые две недостающие от максимума энергии получает на единицу больше */
  if (t.charId === 'borya') {
    var missB = Math.max(0, t.maxMana - t.mana);
    dmg = dmg + Math.floor(missB / 2);
  }`,
    `  /* Боря: за каждые две недостающие от максимума энергии получает на единицу меньше, но не меньше одной */
  if (t.charId === 'borya') {
    var missB = Math.max(0, t.maxMana - t.mana);
    dmg = Math.max(1, dmg - Math.floor(missB / 2));
  }`,
    'Боря: снижение урона');

/* Боря: прибавка к своей атаке больше не действует */
rep(`    var dmgVal = p.dmg + p.buff;
    if (p.charId === 'borya') {
      var missB = Math.max(0, p.maxMana - p.mana);
      dmgVal += Math.floor(missB / 2);
    }`,
    `    var dmgVal = p.dmg + p.buff;`,
    'Боря: прибавка к атаке убрана');

/* Омнис берёт два артефакта за одно действие */
rep(`  } else if (actionId === 'take') {
    if (p.hand.length >= p.artifactLimit) return { ok: false, text: 'Рука артефактов полна: ' + p.artifactLimit + '.' };
    if (!s.deck.length) reshuffleDeck(s, events);
    if (!s.deck.length) return { ok: false, text: 'Колода артефактов пуста.' };`,
    `  } else if (actionId === 'take') {
    if (p.hand.length >= p.artifactLimit) return { ok: false, text: 'Рука артефактов полна: ' + p.artifactLimit + '.' };
    if (!s.deck.length) reshuffleDeck(s, events);
    if (!s.deck.length) return { ok: false, text: 'Колода артефактов пуста.' };
    var takeCount = p.charId === 'omnis' ? 2 : 1;`,
    'Омнис: подготовка второго взятия');

fs.writeFileSync(ep, e, 'utf8');
console.log('черновик движка');
