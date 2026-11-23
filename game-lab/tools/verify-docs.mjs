import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const SRC = process.argv[2];
const TMP = 'game-lab/docs/_verify';
if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });

const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walk(full); continue; }
    if (!e.name.toLowerCase().endsWith('.docx')) continue;
    if (e.name.includes('до правки') || e.name.startsWith('~$')) continue;
    files.push(full);
  }
}
walk(SRC);

const PROTECT = ['Земля 404', 'Арк’Риона', '05.11.2026', '06.11.2026', '07.11.2026', '08.11.2026'];
let digitIssues = 0;
let fontIssues = 0;
const report = [];

for (const f of files) {
  const out = path.join(TMP, path.basename(f) + '.txt');
  execFileSync('powershell.exe', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass',
    '-File', path.resolve('game-lab/tools/docx2md.ps1'),
    '-Src', f, '-Out', path.resolve(out)
  ], { stdio: 'pipe' });
  let text = fs.readFileSync(out, 'utf8');
  for (const p of PROTECT) text = text.split(p).join('');
  const digits = text.match(/.{0,30}\d+.{0,30}/g);
  if (digits) {
    digitIssues++;
    report.push(path.relative(SRC, f) + ' -> ' + digits.slice(0, 3).join(' || '));
  }
}

console.log('проверено документов: ' + files.length);
if (digitIssues === 0) console.log('цифр не осталось ни в одном документе');
else {
  console.log('документов с цифрами: ' + digitIssues);
  for (const r of report) console.log('  ' + r);
}
