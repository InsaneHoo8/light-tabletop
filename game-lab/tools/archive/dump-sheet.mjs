import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const XLSX = process.argv[2];
const tmp = 'game-lab/tmp-check3';
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
execFileSync('powershell.exe', [
  '-NoProfile', '-Command',
  `Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${XLSX}', '${path.resolve(tmp)}')`
], { stdio: 'pipe' });

const xml = fs.readFileSync(path.join(tmp, 'xl', 'worksheets', 'sheet1.xml'), 'utf8');
const cells = new Map();
const re = /<c r="([A-Z]+)(\d+)"[^>]*>([\s\S]*?)<\/c>/g;
let m;
while ((m = re.exec(xml))) {
  const inner = m[3];
  const t = inner.match(/<t[^>]*>([\s\S]*?)<\/t>/);
  const v = inner.match(/<v>([\s\S]*?)<\/v>/);
  cells.set(m[2] + ':' + m[1], (t ? t[1] : v ? v[1] : ''));
}

const cols = ['A', 'B', 'C', 'D'];
for (let r = 1; r <= 5; r++) {
  const row = cols.map((c) => (cells.get(r + ':' + c) || '').slice(0, 34));
  console.log('строка ' + r + ': ' + row.join(' | '));
}
fs.rmSync(tmp, { recursive: true, force: true });
