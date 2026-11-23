import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { toWords } from './numbers-ru.mjs';
import { describe } from './desc-from-ops.mjs';

const require = createRequire(import.meta.url);
const D = require('../arena/game-data.js');

const DOCS = 'game-lab/docs';

const WORLD_DIR = { fantasy: 'Классическое фентези', cyber: 'Киберпанк', space: 'Космическое фентези', earth404: 'Земля 404' };

/* имена файлов сохранены прежние, чтобы не плодить дубликаты */
const CARD_FILE = {
  borya: 'Алкаш-колдун Боря Заливной',
  lyusya: 'Инфлюенсер Апокалипсиса',
  grigori: 'Президент сверхгуманности',
  mirai: 'Корпорат манипулятор',
  hrom: 'Наёмник киборг',
  glyuk: 'Нетраннер',
  mag: 'Безумный колдун',
  grog: 'Варвар-войн',
  zhulien: 'Вор-аристократ',
  omnis: 'Древний искусственный разум',
  heil: 'Командор Дредноута',
  etkora: 'Ксенос псионик'
};

const WORLD_DOC = {
  fantasy: 'Вся информация о персонажах фентези мира',
  cyber: 'Вся информация о персонажах Киберпанка',
  space: 'Вся информация о персонажах космического фентези',
  earth404: 'Вся информация о персонажах Земля 404'
};
const WORLD_ART = { fantasy: 'Артефакты фентези', cyber: 'Артефакты киберпанк', space: 'Артефакты космического фентези', earth404: 'Артефакты Земля 404' };

const f = (n) => toWords(n, 'f');
const m = (n) => toWords(n, 'm');

function plural(n, one, few, many) {
  const a = Math.abs(n) % 100;
  const b = Math.abs(n) % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}

const ED = (n) => m(n) + ' ' + plural(n, 'единица', 'единицы', 'единиц');
const ABIL = (n) => m(n) + ' ' + plural(n, 'способность', 'способности', 'способностей');

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function statsLine(c) {
  return `Здоровье ${ED(c.hp)}, урон обычной атаки ${ED(c.dmg)}, менталка ${ED(c.mental)}, энергия ${ED(c.mana)}. Лимит руки ${ABIL(c.handLimit)}. Ёмкость щита ${ED(c.shieldCap || 5)}.`;
}

function abilityLine(a, index, ordinal) {
  const costWord = a.cost === 1 ? 'единица' : (a.cost >= 2 && a.cost <= 4 ? 'единицы' : 'единиц');
  const cost = a.cost === 0 ? 'бесплатно' : `${f(a.cost)} ${costWord} энергии`;
  const target = a.target || (a.ops && a.ops.some((o) => o.who === 'target')) ? ' Нужна цель.' : '';
  if (a.modes) {
    return `Пункт ${ordinal}. ${a.name} — ${cost}. ${cap(describe(a))}.${target}`;
  }
  return `Пункт ${ordinal}. ${a.name} — ${cost}. ${cap(describe(a))}.${target}`;
}

const ORDINALS = ['один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'];

/* ---------- карточки персонажей ---------- */

function characterBlocks(c) {
  const lines = [];
  lines.push(`## Персонаж: ${c.full}`);
  lines.push('');
  lines.push(c.text);
  lines.push('');
  lines.push(`**${statsLine(c)}**`);
  lines.push('');
  if (c.passive) {
    lines.push(`**Пассивка. ${c.passive}**`);
    lines.push('');
  }
  lines.push('## Способности');
  lines.push('');
  c.abilities.forEach((a, i) => {
    lines.push(`**${abilityLine(a, i + 1, ORDINALS[i] || String(i + 1))}**`);
    lines.push('');
  });
  return lines;
}

for (const world of Object.keys(WORLD_DIR)) {
  const chars = D.CHARACTERS.filter((c) => c.world === world);
  if (!chars.length) continue;
  const dir = path.join(DOCS, 'Персонажи', WORLD_DIR[world]);
  fs.mkdirSync(dir, { recursive: true });

  /* по одному файлу на персонажа */
  for (const c of chars) {
    const lines = [`# ${c.full}`, '', c.text, '', `**${statsLine(c)}**`, '', c.passive ? `**Пассивка. ${c.passive}**` : '', '', '## Способности', ''];
    c.abilities.forEach((a, i) => {
      lines.push(`**${abilityLine(a, i + 1, ORDINALS[i] || String(i + 1))}**`);
      lines.push('');
    });
    fs.writeFileSync(path.join(dir, `${CARD_FILE[c.id] || c.id}.md`), lines.join('\n'), 'utf8');
  }

  /* сводный файл по миру */
  const combined = [`# ${D.WORLDS[world]}`, '', `Персонажи мира ${D.WORLDS[world]} — ${m(chars.length)} штуки. Пул у каждого восемь способностей, на руке лимит из карточки.`, ''];
  for (const c of chars) combined.push(...characterBlocks(c));
  fs.writeFileSync(path.join(DOCS, 'Персонажи', `${WORLD_DOC[world]}.md`), combined.join('\n'), 'utf8');
}

/* ---------- артефакты по мирам ---------- */

const ART_ORDINALS = ['первая', 'вторая', 'третья', 'четвёртая', 'пятая', 'шестая'];

for (const world of Object.keys(WORLD_ART)) {
  const arts = D.ARTIFACTS.filter((a) => a.world === world);
  if (!arts.length) continue;
  const lines = [`# Артефакты: ${D.WORLDS[world]}`, ''];
  lines.push(`Карт этого мира — ${f(arts.length)}. Цена и обмен указаны в описании каждой карты.`);
  lines.push('');
  arts.forEach((a, i) => {
    const target = a.target ? ' Нужна цель.' : '';
    lines.push(`## Карта ${ART_ORDINALS[i] || i + 1}. ${a.name}`);
    lines.push('');
    lines.push(`Цена ${f(a.cost)}, обмен ${f(a.trade)}. ${a.desc}.${target}`);
    lines.push('');
  });
  fs.writeFileSync(path.join(DOCS, 'Артефакты', `${WORLD_ART[world]}.md`), lines.join('\n'), 'utf8');
}

/* ---------- три документа для нейронки ---------- */

const OUT = path.join(DOCS, 'Промты для нейронки');
fs.mkdirSync(OUT, { recursive: true });

/* 1. артефакты */
const aLines = ['# Артефакты: полный справочник', ''];
aLines.push('Этот документ описывает все артефакты игры «Война за Сосиску» и правила обращения с ними. Он самодостаточен: по нему можно судить о карте, не имея перед глазами остальных материалов.');
aLines.push('');
aLines.push('## Что такое артефакт');
aLines.push('');
aLines.push('Артефакт — карта, которую берут из общей колоды и применяют в свой ход отдельным действием. Применение артефакта не заменяет обычную атаку и не считается применением способности.');
aLines.push('');
aLines.push(`Колода состоит из двадцати четырёх карт: по ${f(6)} на каждый из четырёх миров. Когда колода заканчивается, сброс перемешивается и образует новую.`);
aLines.push('');
aLines.push('## Свой и чужой мир');
aLines.push('');
aLines.push('Артефакт своего мира бесплатен. Артефакт чужого мира требует оплаты менталкой по своей цене.');
aLines.push('');
aLines.push('## Обмен');
aLines.push('');
aLines.push('Обычную карту можно сбросить ради энергии в размере обмена. Это быстрое действие: оно не тратит ход, и сразу после него игрок делает своё основное действие.');
aLines.push('');
aLines.push('Карту, которая сама восстанавливает энергию или здоровье, обменивают на здоровье. Такой обмен остаётся полноценным действием и тратит ход.');
aLines.push('');
aLines.push('Сброс двух артефактов позволяет пополнить руку способностей: взять карту из своего сброса способностей или верхнюю карту личного пула, соблюдая лимит руки.');
aLines.push('');
aLines.push('## Все артефакты по мирам');
aLines.push('');
for (const world of Object.keys(WORLD_ART)) {
  const arts = D.ARTIFACTS.filter((a) => a.world === world);
  if (!arts.length) continue;
  aLines.push(`## ${D.WORLDS[world]}`);
  aLines.push('');
  arts.forEach((a, i) => {
    const target = a.target ? ' Нужна цель.' : '';
    aLines.push(`**Карта ${ART_ORDINALS[i] || i + 1}. ${a.name} — цена ${f(a.cost)}, обмен ${f(a.trade)}.** ${a.desc}.${target}`);
    aLines.push('');
  });
}
fs.writeFileSync(path.join(OUT, 'Артефакты — всё.md'), aLines.join('\n'), 'utf8');

/* 2. персонажи */
const cLines = ['# Персонажи: полный справочник', ''];
cLines.push('Этот документ описывает всех персонажей игры «Война за Сосиску», их характеристики и способности. Он самодостаточен: по нему можно судить о персонаже, не имея перед глазами остальных материалов.');
cLines.push('');
cLines.push('## Устройство персонажа');
cLines.push('');
cLines.push('У каждого персонажа четыре постоянные характеристики: здоровье, урон обычной атаки, менталка и энергия. Менталка тратится на артефакты чужих миров, энергия — на способности.');
cLines.push('');
cLines.push('У каждого персонажа восемь способностей в личном пуле. Перед партией игрок собирает из пула руку по лимиту, указанному в карточке. Применённая карта уходит в сброс и в этой партии не возвращается.');
cLines.push('');
cLines.push('Мир персонажа определяет, какие артефакты ему бесплатны.');
cLines.push('');
cLines.push('## Персонажи по мирам');
cLines.push('');
for (const world of Object.keys(WORLD_DIR)) {
  const chars = D.CHARACTERS.filter((c) => c.world === world);
  if (!chars.length) continue;
  cLines.push(`## ${D.WORLDS[world]}`);
  cLines.push('');
  for (const c of chars) cLines.push(...characterBlocks(c));
}
fs.writeFileSync(path.join(OUT, 'Персонажи и способности — всё.md'), cLines.join('\n'), 'utf8');

/* 3. правила — отдельный генератор: gen-rules-doc.mjs */
/* здесь не пишем, чтобы не перетирать актуальную версию */



/* ---------- сводка и классы ---------- */

const sumLines = ['# Персонажи: сводка', ''];
sumLines.push('Все двенадцать персонажей с характеристиками и способностями в одном списке. Подробности — в документах по мирам.');
sumLines.push('');
for (const c of D.CHARACTERS) {
  sumLines.push(`## ${c.full}`);
  sumLines.push('');
  sumLines.push(`**${statsLine(c)}**`);
  sumLines.push('');
  c.abilities.forEach((a, i) => {
    sumLines.push(`**${abilityLine(a, i + 1, ORDINALS[i] || String(i + 1))}**`);
    sumLines.push('');
  });
}
fs.writeFileSync(path.join(DOCS, 'Персонажи', 'Персонажи — сводка.md'), sumLines.join('\n'), 'utf8');



const statLines = ['# Персонажи: только характеристики', ''];
statLines.push('Здесь перечислены все персонажи и их числовые характеристики, без истории и без способностей. Документ нужен, когда важны только цифры.');
statLines.push('');
for (const world of Object.keys(WORLD_DIR)) {
  const chars = D.CHARACTERS.filter((c) => c.world === world);
  if (!chars.length) continue;
  statLines.push(`## ${D.WORLDS[world]}`);
  statLines.push('');
  for (const c of chars) {
    statLines.push(`**${c.full}.** Мир — ${D.WORLDS[world]}. ${statsLine(c)}`);
    statLines.push('');
  }
}
fs.writeFileSync(path.join(OUT, 'Персонажи — только статы.md'), statLines.join('\n'), 'utf8');
console.log('документы пересобраны');
