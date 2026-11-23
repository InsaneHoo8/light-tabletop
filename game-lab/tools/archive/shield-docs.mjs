import fs from 'node:fs';

/* 1. В статы добавляем ёмкость щита */
const p = 'game-lab/tools/gen-prompt-docs.mjs';
let src = fs.readFileSync(p, 'utf8');

const oldStats = "return `Здоровье ${ED(c.hp)}, урон обычной атаки ${ED(c.dmg)}, менталка ${ED(c.mental)}, энергия ${ED(c.mana)}. Лимит руки ${ABIL(c.handLimit)}.`;";
const newStats = "return `Здоровье ${ED(c.hp)}, урон обычной атаки ${ED(c.dmg)}, менталка ${ED(c.mental)}, энергия ${ED(c.mana)}. Лимит руки ${ABIL(c.handLimit)}. Ёмкость щита ${ED(c.shieldCap || 5)}.`;";

if (!src.includes(oldStats)) throw new Error('не найдена строка статов');
src = src.replace(oldStats, newStats);
fs.writeFileSync(p, src, 'utf8');
console.log('статы: добавлена ёмкость щита');

/* 2. В правила — про щиты в начале игры */
const r = 'game-lab/tools/gen-rules-doc.mjs';
let rules = fs.readFileSync(r, 'utf8');

const anchor = "add('Щит держится до тех пор, пока его не разрушат. Временем он не ограничен.');";
if (!rules.includes(anchor)) throw new Error('не найден блок щитов в правилах');

const add = `add('Щит держится до тех пор, пока его не разрушат. Временем он не ограничен.');
add('');
add('**В начале игры у всех ноль щита.** Щит появляется только от карт и артефактов и не восстанавливается сам.');
add('');
add('## Ёмкость щита');
add('');
add('У каждого персонажа свой потолок щита. Он записан в характеристиках персонажа и не меняется по ходу игры.');
add('');
add('У Хейла ёмкость десять: он складывает две карты щита, и вторая прибавляется к первой.');
add('У Люси и Омниса ёмкость шесть, у остальных пять. У них действует одна карта щита: новая встаёт, только если она крепче прежней.');
add('');
add('Лишний щит сверх ёмкости срезается, в запас он не уходит.`;`;

rules = rules.replace(anchor, add);
fs.writeFileSync(r, rules, 'utf8');
console.log('правила: щиты и ёмкость');
