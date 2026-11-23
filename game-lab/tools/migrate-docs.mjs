import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const SRC = process.argv[2];
const MD_ROOT = 'game-lab/docs';

if (!SRC) {
  console.error('нужен путь к папке игры');
  process.exit(1);
}

fs.mkdirSync(MD_ROOT, { recursive: true });

const skipped = [];
const done = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!entry.name.toLowerCase().endsWith('.docx')) continue;
    if (/до правки/i.test(entry.name) || entry.name.startsWith('~$')) {
      skipped.push(path.relative(SRC, full));
      continue;
    }
    const rel = path.relative(SRC, full).replace(/\.docx$/i, '.md');
    const mdPath = path.join(MD_ROOT, rel);
    fs.mkdirSync(path.dirname(mdPath), { recursive: true });
    try {
      execFileSync('powershell.exe', [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        path.resolve('game-lab/tools/docx2md.ps1'),
        '-Src',
        full,
        '-Out',
        path.resolve(mdPath)
      ], { stdio: 'pipe' });
      done.push(rel);
    } catch (e) {
      console.error('ошибка: ' + rel + ' — ' + (e.stdout ? e.stdout.toString() : e.message));
    }
  }
}

walk(SRC);
console.log('переведено в md: ' + done.length);
for (const d of done) console.log('  ' + d);
if (skipped.length) {
  console.log('пропущено (резервные копии): ' + skipped.length);
  for (const s of skipped) console.log('  ' + s);
}
