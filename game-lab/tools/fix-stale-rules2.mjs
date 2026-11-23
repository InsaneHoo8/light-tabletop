import fs from 'node:fs';

/* Ход игроков: актуальная формулировка про щиты */
const cp = 'game-lab/tools/gen-core-docs.mjs';
let c = fs.readFileSync(cp, 'utf8').replace(/\r\n/g, '\n');

const old = "Щиты не стакаются: действует одна карта щита, новая встаёт, только если она крепче.";
const neu = "Щиты не стакаются: у персонажа одна активная карта щита, и пока щит держится, новую карту щита ставить нельзя.";

if (!c.includes(old)) throw new Error('не найдена строка про щиты в генераторе хода');
c = c.replace(old, neu);
fs.writeFileSync(cp, c, 'utf8');
console.log('ход игроков: правка внесена');

/* Справочник: лимит артефактов больше не ограничивает руку */
const dp = 'game-lab/docs/Промты для нейронки/Технические правила работы.md';
let d = fs.readFileSync(dp, 'utf8').replace(/\r\n/g, '\n');
const oldD = 'лимит руки способностей, лимит руки артефактов, ёмкость щита';
const newD = 'лимит руки способностей, ёмкость щита';
if (d.includes(oldD)) {
  d = d.replace(oldD, newD);
  fs.writeFileSync(dp, d, 'utf8');
  console.log('справочник обновлён');
} else {
  console.log('справочник: строка уже изменена');
}
