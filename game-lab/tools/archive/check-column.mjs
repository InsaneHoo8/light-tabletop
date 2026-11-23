import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const XLSX = process.argv[2];

const tmp = 'game-lab/tmp-check';
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
execFileSync('powershell.exe', [
  '-NoProfile', '-Command',
  `Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${path.resolve(XLSX)}', '${path.resolve(tmp)}')`
], { stdio: 'pipe' });

const xml = fs.readFileSync(path.join(tmp, 'xl', 'worksheets', 'sheet1.xml'), 'utf8');

const cells = [];
const re = /<c r="([A-Z]+)(\d+)"[^>]*>(?:<is><t[^>]*>([\s\S]*?)<\/t><\/is>)?<\/c>/g;
let m;
while ((m = re.exec(xml))) {
  cells.push({ col: m[1], row: Number(m[2]), text: m[3] || '' });
}

const etkora = cells.find((c) => c.text.includes('Эт’Кора') && c.row === 1);
if (!etkora) {
  console.log('шапка Эт’Коры не найдена');
  process.exit(1);
}

const column = etkora.col;
console.log('столбец способностей Эт’Коры: ' + column);
const mine = cells.filter((c) => c.col === column).sort((a, b) => a.row - b.row);
for (const c of mine) {
  if (!c.text) continue;
  console.log('  ' + c.row + ': ' + c.text.slice(0, 80));
}

fs.rmSync(tmp, { recursive: true, force: true });
