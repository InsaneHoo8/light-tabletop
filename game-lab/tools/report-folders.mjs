import fs from 'node:fs';

const p = 'game-lab/tools/sim-report.mjs';
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const oldMd = "const mdPath = path.join(MD_DIR, `${ESSENCE} — Симуляция ${PATCH} ${safeStamp}.md`);";
const newMd = "const patchFolder = 'Патч ' + PATCH;\nfs.mkdirSync(path.join(MD_DIR, patchFolder), { recursive: true });\nconst mdPath = path.join(MD_DIR, patchFolder, `${ESSENCE} — Симуляция ${PATCH} ${safeStamp}.md`);";

const oldDocx = "const docxPath = path.join(docxDir, `${ESSENCE} — Симуляция ${PATCH} ${safeStamp}.docx`);";
const newDocx = "fs.mkdirSync(path.join(docxDir, patchFolder), { recursive: true });\nconst docxPath = path.join(docxDir, patchFolder, `${ESSENCE} — Симуляция ${PATCH} ${safeStamp}.docx`);";

if (!s.includes(oldMd)) throw new Error('не найден путь markdown');
if (!s.includes(oldDocx)) throw new Error('не найден путь документа');
s = s.replace(oldMd, newMd).replace(oldDocx, newDocx);
fs.writeFileSync(p, s, 'utf8');
console.log('генератор отчётов: кладёт в папку патча');
