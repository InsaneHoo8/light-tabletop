import fs from 'node:fs';

/* 1. AGENTS.md: убрать упоминание классов и обновить список справочников */
const ap = 'AGENTS.md';
let a = fs.readFileSync(ap, 'utf8').replace(/\r\n/g, '\n');

const oldA = 'Три справочника не правятся руками: сводка персонажей, персонажи по классам, пул способностей. Они пересобираются из данных игры.';
const newA = 'Справочники не правятся руками: сводка персонажей, карточки персонажей по мирам, сводные файлы миров, документы в папке промтов. Они пересобираются из данных игры командой генератора.';

if (!a.includes(oldA)) throw new Error('не найдена строка про справочники');
a = a.replace(oldA, newA);

const oldSim = '- Симуляция: `node game-lab/arena/tools/sim.mjs 1500 4 1`. В скриптах всегда вызывать `E.runBotsPick(s, -1)` после `newGame`, иначе партия стоит на фазе выбора руки.';
const newSim = `- Симуляция: \`node game-lab/tools/sim-report.mjs 1500 4 <папка игры>\`. В скриптах всегда вызывать \`E.runBotsPick(s, -1)\` после \`newGame\`, иначе партия стоит на фазе выбора руки.
- Баланс: \`node game-lab/tools/balance-check.mjs\` — сверка с эталоном на фиксированных сидах.
- Документы против данных: \`node game-lab/tools/docs-consistency.mjs\`.`;

if (a.includes(oldSim)) {
  a = a.replace(oldSim, newSim);
} else {
  console.log('AGENTS: строка про симуляцию не найдена, добавлю после проверок');
}

fs.writeFileSync(ap, a, 'utf8');
console.log('AGENTS.md обновлён');

/* 2. Технический справочник: недостающие переменные */
const dp = 'game-lab/docs/Промты для нейронки/Технические правила работы.md';
let d = fs.readFileSync(dp, 'utf8').replace(/\r\n/g, '\n');

const anchor = '- `ESSENCE=текст` — своё начало имени файла отчёта.';
const extra = [
  '- `FREE_ART=1` — все артефакты бесплатны, цена за чужие миры отменена.',
  '- `COMBO=1` — поведение связки: бот держит в руке алтарь и нейростимулятор.',
  anchor
].join('\n');

if (d.includes(anchor) && !d.includes('FREE_ART')) {
  d = d.replace(anchor, extra);
  fs.writeFileSync(dp, d, 'utf8');
  console.log('справочник: добавлены недостающие переменные');
}

/* 3. Временные папки проверок — в игнор */
const gi = '.gitignore';
let g = fs.readFileSync(gi, 'utf8').replace(/\r\n/g, '\n');
if (!g.includes('docs/_verify')) {
  g = g.replace('# Временные файлы Word', 'game-lab/docs/_verify/\n\n# Временные файлы Word');
  fs.writeFileSync(gi, g, 'utf8');
  console.log('gitignore: временная папка проверки добавлена');
}
