import fs from 'node:fs';

/* 1. Статы: ёмкость щита */
const p = 'game-lab/tools/gen-prompt-docs.mjs';
let src = fs.readFileSync(p, 'utf8');

const marker = 'Лимит руки ${ABIL(c.handLimit)}.`;';
if (!src.includes(marker)) throw new Error('не найдена строка статов');
src = src.replace(marker, 'Лимит руки ${ABIL(c.handLimit)}. Ёмкость щита ${ED(c.shieldCap || 5)}.`;');
fs.writeFileSync(p, src, 'utf8');
console.log('статы: ёмкость щита добавлена');

/* 2. Правила: ноль щита в начале и раздел про ёмкость */
const r = 'game-lab/tools/gen-rules-doc.mjs';
let rules = fs.readFileSync(r, 'utf8');

const anchor = "add('Щит держится до тех пор, пока его не разрушат. Временем он не ограничен.');";
if (!rules.includes(anchor)) throw new Error('не найден блок щитов');

const extra = [
  "add('Щит держится до тех пор, пока его не разрушат. Временем он не ограничен.');",
  "add('');",
  "add('**В начале игры у всех ноль щита.** Щит появляется только от карт и артефактов и сам не восстанавливается.');",
  "add('');",
  "add('## Ёмкость щита');",
  "add('');",
  "add('У каждого персонажа свой потолок щита. Он записан в характеристиках персонажа и по ходу игры не меняется.');",
  "add('');",
  "add('У Хейла ёмкость десять: он складывает две карты щита, и вторая прибавляется к первой.');",
  "add('У Люси и Омниса ёмкость шесть, у остальных пять. У них действует одна карта щита: новая встаёт, только если она крепче прежней.');",
  "add('');",
  "add('Лишний щит сверх ёмкости срезается, в запас он не уходит.');"
].join('\n');

rules = rules.replace(anchor, extra);
fs.writeFileSync(r, rules, 'utf8');
console.log('правила: про щиты добавлено');
