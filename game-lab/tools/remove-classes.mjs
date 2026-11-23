import fs from 'node:fs';

/* 1. Данные: убираем класс у персонажей и словарь классов */
const cp = 'game-lab/arena/cards.js';
let c = fs.readFileSync(cp, 'utf8');

c = c.replace(/ archetype: '[a-z0-9]+',/g, '');
c = c.replace(/var ARCHETYPES = \{[\s\S]*?\};\n\n/, '');
c = c.replace(/var HAND_LIMIT = \{[^}]*\};\n\n/, '');
c = c.replace(/  ARCHETYPES: ARCHETYPES,\n/, '');
c = c.replace(/  HAND_LIMIT: HAND_LIMIT,\n/, '');
fs.writeFileSync(cp, c, 'utf8');
console.log('данные: классы убраны');

/* 2. Движок: поле archetype не нужно */
const ep = 'game-lab/arena/engine.js';
let e = fs.readFileSync(ep, 'utf8');
e = e.replace(/\n    archetype: ch\.archetype,/, '');
e = e.replace(/, ARCHETYPE_LIST: D\.ARCHETYPES/, '');
fs.writeFileSync(ep, e, 'utf8');
console.log('движок: класс убран');

/* 3. game-data: не отдаём словарь классов */
const gp = 'game-lab/arena/game-data.js';
let g = fs.readFileSync(gp, 'utf8');
g = g.replace(/  ARCHETYPES: C\.ARCHETYPES,\n/, '');
g = g.replace(/  HAND_LIMIT: C\.HAND_LIMIT,\n/, '');
fs.writeFileSync(gp, g, 'utf8');
console.log('game-data: классы убраны');

/* 4. Генератор документов: класс не упоминаем */
const pp = 'game-lab/tools/gen-prompt-docs.mjs';
let p = fs.readFileSync(pp, 'utf8');
p = p.replace(/\. Мир — \$\{D\.WORLDS\[world\]\}, класс — \$\{\(D\.ARCHETYPES\[c\.archetype\] \|\| c\.archetype\)\.toLowerCase\(\)\}\./, '. Мир — ${D.WORLDS[world]}.');
p = p.replace(/classLines[\s\S]*?fs\.writeFileSync\(path\.join\(DOCS, 'Персонажи', 'Персонажи по классам\.md'\), classLines\.join\('\\n'\), 'utf8'\);\n/, '');
p = p.replace(/^.*Персонажи по классам.*$/gm, '');
fs.writeFileSync(pp, p, 'utf8');
console.log('генератор: классы убраны');
