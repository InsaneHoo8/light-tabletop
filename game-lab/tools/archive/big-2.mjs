import fs from 'node:fs';

const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

function rep(old, neu, label) {
  if (!c.includes(old)) throw new Error('НЕ НАЙДЕНО: ' + label);
  c = c.replace(old, neu);
  console.log('ok: ' + label);
}

/* Жюльен: парирование за одну энергию */
rep("{ id: 'parry', name: 'Парирование рапирой', cost: 2,", "{ id: 'parry', name: 'Парирование рапирой', cost: 1,", 'Жюльен: парирование за одну');

/* Эт’Кора: психическая броня за одну */
rep("{ id: 'psihbronya', name: 'Психическая броня', cost: 2,", "{ id: 'psihbronya', name: 'Психическая броня', cost: 1,", 'Эт’Кора: броня за одну');

/* Эт’Кора: новый массовый психоз вместо астрального разрыва */
rep("{ id: 'astral', name: 'Астральный разрыв', cost: 3, target: true, desc: 'урон равен недостающей менталке плюс три, не больше семи', ops: [{ t: 'dmgMissingMental', who: 'target', bonus: 3, max: 7 }] }",
  "{ id: 'psihkoz', name: 'Массовый психоз', cost: 5, desc: 'подчиняет всех: каждый игрок делает одно действие на выбор Эт’Коры, не тратя ресурсов', ops: [{ t: 'massControl' }] }",
  'Эт’Кора: массовый психоз');

/* Маг: вспышка шесть, порча четыре, прорыв бесплатно */
rep("desc: 'пять урона цели и два себе', ops: [{ t: 'dmg', who: 'target', n: 5 }, { t: 'dmg', who: 'self', n: 2, pierce: true }]",
  "desc: 'шесть урона цели и два себе', ops: [{ t: 'dmg', who: 'target', n: 6 }, { t: 'dmg', who: 'self', n: 2, pierce: true }]",
  'Маг: вспышка шесть');

rep("desc: 'три урона и цель сбрасывает две способности', ops: [{ t: 'dmg', who: 'target', n: 3 }, { t: 'discardAbility', who: 'target', n: 2 }]",
  "desc: 'четыре урона и цель сбрасывает две способности', ops: [{ t: 'dmg', who: 'target', n: 4 }, { t: 'discardAbility', who: 'target', n: 2 }]",
  'Маг: порча четыре');

rep("{ id: 'proryv', name: 'Научный прорыв', cost: 1,", "{ id: 'proryv', name: 'Научный прорыв', cost: 0,", 'Маг: прорыв бесплатно');

/* Маг: мутация с двумя эффектами на два хода */
rep("modes: [{ label: 'ослабить цель', cost: 2, target: true, ops: [{ t: 'weaken', who: 'target', n: 3 }] }, { label: 'усилить себя', cost: 2, ops: [{ t: 'gainMaxHp', n: 7 }] }]",
  "modes: [{ label: 'ослабить цель', cost: 2, target: true, ops: [{ t: 'weaken', who: 'target', n: 2, turns: 2 }] }, { label: 'усилить себя', cost: 2, ops: [{ t: 'magBuff', n: 1, turns: 2 }] }]",
  'Маг: мутация');

/* Григорий: санкции с уроном, налог массовый, распил лечит два, ад пять */
rep("desc: 'минус две менталки и две энергии, запрет артефактов', ops: [{ t: 'mental', who: 'target', n: -2 }, { t: 'energy', who: 'target', n: -2 }, { t: 'noArtifacts', who: 'target' }]",
  "desc: 'один урон, минус две менталки и две энергии, запрет артефактов', ops: [{ t: 'dmg', who: 'target', n: 1 }, { t: 'mental', who: 'target', n: -2 }, { t: 'energy', who: 'target', n: -2 }, { t: 'noArtifacts', who: 'target' }]",
  'Григорий: пакет санкций');

rep("{ id: 'nalog', name: 'Налог на агрессию', cost: 2, target: true, desc: 'цель платит на единицу больше и бьёт слабее', ops: [{ t: 'tax', who: 'target' }, { t: 'weaken', who: 'target', n: 1 }] }",
  "{ id: 'nalog', name: 'Налог на агрессию', cost: 2, desc: 'все до следующего хода бьют слабее на единицу и платят на единицу больше', ops: [{ t: 'taxAll' }] }",
  'Григорий: налог массовый');

rep("desc: 'сбрасывает артефакт, даёт четыре энергии, две менталки и одно здоровье', ops: [{ t: 'discardArtifact', who: 'self' }, { t: 'energy', who: 'self', n: 4 }, { t: 'mental', who: 'self', n: 2 }, { t: 'heal', who: 'self', n: 1 }]",
  "desc: 'сбрасывает артефакт, даёт четыре энергии, две менталки и два здоровья', ops: [{ t: 'discardArtifact', who: 'self' }, { t: 'energy', who: 'self', n: 4 }, { t: 'mental', who: 'self', n: 2 }, { t: 'heal', who: 'self', n: 2 }]",
  'Григорий: распил лечит два');

rep("desc: 'цель сбрасывает способность и артефакт, иначе четыре урона', ops: [{ t: 'discardOrDamage', who: 'target', n: 4 }]",
  "desc: 'цель сбрасывает способность и артефакт, иначе пять урона', ops: [{ t: 'discardOrDamage', who: 'target', n: 5 }]",
  'Григорий: бюрократический ад');

fs.writeFileSync(cp, c, 'utf8');
console.log('часть вторая записана');
