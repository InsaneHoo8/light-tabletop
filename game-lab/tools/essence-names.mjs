import fs from 'node:fs';

const sp = 'game-lab/tools/sim-report.mjs';
let s = fs.readFileSync(sp, 'utf8').replace(/\r\n/g, '\n');

if (!s.includes('function essenceOf')) {
  const anchor = "const now = new Date();";
  const block = `/* суть прогона — попадает в начало имени файла */
function essenceOf() {
  if (process.env.ESSENCE) return process.env.ESSENCE;
  if (process.env.STYLES) return 'Стили ботов ' + process.env.STYLES.split(',').join(', ');
  if (process.env.AGGRO === '1') return 'Стили ботов все агрессивные';
  if (process.env.CAUTION === '1') return 'Стили ботов все осторожные';
  if (process.env.MIXED === '1') return 'Стили ботов смешанный стол';
  if (process.env.PRIORITY === '1') return 'Поведение строгий порядок';
  if (process.env.PREFER_EXTRA === '1') return 'Поведение приоритет дополнительному действию';
  if (process.env.PREFER_SHIELD === '1') return 'Поведение приоритет щиту';
  if (process.env.COUNTERS === '1') return 'Поведение контр-оценка';
  if (process.env.NO_ART_LIMIT === '1') return 'Без лимита руки артефактов';
  return 'Патч ' + PATCH;
}

const ESSENCE = essenceOf().replace(/[:*?"<>|]/g, ' ').replace(/\\s+/g, ' ').trim();

`;
  if (!s.includes(anchor)) throw new Error('не найдена точка вставки');
  s = s.replace(anchor, block + anchor);
}

s = s.replace("const mdPath = path.join(MD_DIR, `Симуляция ${PATCH} ${safeStamp}.md`);",
  "const mdPath = path.join(MD_DIR, `${ESSENCE} — Симуляция ${PATCH} ${safeStamp}.md`);");
s = s.replace("const docxPath = path.join(docxDir, `Симуляция ${PATCH} ${safeStamp}.docx`);",
  "const docxPath = path.join(docxDir, `${ESSENCE} — Симуляция ${PATCH} ${safeStamp}.docx`);");

fs.writeFileSync(sp, s, 'utf8');
console.log('имена отчётов: суть в начале');
