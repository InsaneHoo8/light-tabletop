import fs from 'node:fs';

const p = 'game-lab/tools/gen-prompt-docs.mjs';
let src = fs.readFileSync(p, 'utf8');

if (!src.includes('desc-from-ops')) {
  src = src.replace(
    "import { toWords } from './numbers-ru.mjs';",
    "import { toWords } from './numbers-ru.mjs';\nimport { describe } from './desc-from-ops.mjs';"
  );
}

/* в описании способности — текст, собранный из операций, чтобы числа были всегда */
const oldLine = "  return `Пункт ${ordinal}. ${a.name} — ${cost}. ${cap(a.desc)}.${target}`;";
const newLine = "  return `Пункт ${ordinal}. ${a.name} — ${cost}. ${cap(describe(a))}.${target}`;";
if (!src.includes(oldLine)) throw new Error('не найдена строка описания');
src = src.replace(oldLine, newLine);

const oldModes = "    const variants = a.modes.map((mm) => `${mm.label} (${mm.cost === 0 ? 'бесплатно' : f(mm.cost) + ' энергии'})`).join('; ');\n    return `Пункт ${ordinal}. ${a.name} — ${cost}. На выбор: ${variants}.${target}`;";
const newModes = "    return `Пункт ${ordinal}. ${a.name} — ${cost}. ${cap(describe(a))}.${target}`;";
if (src.includes(oldModes)) {
  src = src.replace(oldModes, newModes);
  console.log('варианты тоже через описание из операций');
}

fs.writeFileSync(p, src, 'utf8');
console.log('генератор переведён на описания из операций');
