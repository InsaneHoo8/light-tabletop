import fs from 'node:fs';

const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

let done = 0;
function rep(old, neu, label) {
  if (!c.includes(old)) throw new Error('НЕ НАЙДЕНО: ' + label);
  c = c.replace(old, neu);
  done++;
  console.log('ok: ' + label);
}

rep("{ id: 'parirovanie', name: 'Парирование рапирой', cost: 2,",
  "{ id: 'parirovanie', name: 'Парирование рапирой', cost: 1,",
  'парирование за одну');

rep("{ id: 'bronya', name: 'Психическая броня', cost: 2,",
  "{ id: 'bronya', name: 'Психическая броня', cost: 1,",
  'психическая броня за одну');

rep("{ id: 'astral', name: 'Астральный разрыв', cost: 3, target: true, desc: 'урон равен недостающей менталке плюс три, не больше семи', ops: [{ t: 'dmgMissingMental', who: 'target', bonus: 3, max: 7 }] }",
  "{ id: 'psihkoz', name: 'Массовый психоз', cost: 5, desc: 'подчиняет всех: каждый игрок делает одно действие на выбор Эт’Коры, не тратя ресурсов', ops: [{ t: 'massControl' }] }",
  'массовый психоз');

rep("{ id: 'proryv', name: 'Научный прорыв', cost: 1,",
  "{ id: 'proryv', name: 'Научный прорыв', cost: 0,",
  'прорыв бесплатно');

rep("modes: [{ label: 'ослабить цель', cost: 2, target: true, ops: [{ t: 'weaken', who: 'target', n: 3 }] }, { label: 'усилить себя', cost: 2, ops: [{ t: 'gainMaxHp', n: 7 }] }]",
  "modes: [{ label: 'ослабить цель', cost: 2, target: true, ops: [{ t: 'weaken', who: 'target', n: 2, turns: 2 }] }, { label: 'усилить себя', cost: 2, ops: [{ t: 'magBuff', n: 1, turns: 2 }] }]",
  'мутация');

rep("{ id: 'sankcii', name: 'Пакет санкций', cost: 2, target: true, desc: 'цель теряет две менталки, две энергии и не может применять артефакты', ops: [{ t: 'mental', who: 'target', n: -2 }, { t: 'energy', who: 'target', n: -2 }, { t: 'noArtifacts', who: 'target' }] }",
  "{ id: 'sankcii', name: 'Пакет санкций', cost: 2, target: true, desc: 'один урон, цель теряет две менталки, две энергии и не может применять артефакты', ops: [{ t: 'dmg', who: 'target', n: 1 }, { t: 'mental', who: 'target', n: -2 }, { t: 'energy', who: 'target', n: -2 }, { t: 'noArtifacts', who: 'target' }] }",
  'пакет санкций');

rep("{ id: 'nalog', name: 'Налог на агрессию', cost: 2, target: true, desc: 'до вашего следующего хода цель платит больше, а её обычная атака слабее на единицу', ops: [{ t: 'tax', who: 'target' }, { t: 'weaken', who: 'target', n: 1 }] }",
  "{ id: 'nalog', name: 'Налог на агрессию', cost: 2, desc: 'все до следующего хода бьют слабее на единицу и платят на единицу больше', ops: [{ t: 'taxAll' }] }",
  'налог массовый');

rep("desc: 'сбрасывает артефакт, даёт четыре энергии, две менталки и одно здоровье', ops: [{ t: 'discardArtifact', who: 'self' }, { t: 'energy', who: 'self', n: 4 }, { t: 'mental', who: 'self', n: 2 }, { t: 'heal', who: 'self', n: 1 }]",
  "desc: 'сбрасывает артефакт, даёт четыре энергии, две менталки и два здоровья', ops: [{ t: 'discardArtifact', who: 'self' }, { t: 'energy', who: 'self', n: 4 }, { t: 'mental', who: 'self', n: 2 }, { t: 'heal', who: 'self', n: 2 }]",
  'распил лечит два');

rep("desc: 'цель сбрасывает способность и артефакт, а если у неё их нет — получает четыре урона', ops: [{ t: 'discardOrDamage', who: 'target', n: 4 }]",
  "desc: 'цель сбрасывает способность и артефакт, а если у неё их нет — получает пять урона', ops: [{ t: 'discardOrDamage', who: 'target', n: 5 }]",
  'бюрократический ад пять');

fs.writeFileSync(cp, c, 'utf8');
console.log('записано изменений: ' + done);
