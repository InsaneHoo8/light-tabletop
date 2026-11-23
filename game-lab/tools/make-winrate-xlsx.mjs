/* Таблица винрейтов: один персонаж — один столбец, четыре строки:
   имя, ниже проценты по трём стилям игры. */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const D = require('../arena/game-data.js');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('нужно: node make-winrate-xlsx.mjs <куда.xlsx> <слепок.json> [ещё...]');
  process.exit(1);
}
const outPath = args[0];
const files = args.slice(1);
const dumps = files.map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));

const agg = new Map();
for (const d of dumps) {
  for (const row of d.styleMatrix || []) {
    const key = row.name + '|' + row.style;
    if (!agg.has(key)) agg.set(key, { name: row.name, style: row.style, wins: 0, plays: 0 });
    const a = agg.get(key);
    a.wins += row.wins;
    a.plays += row.plays;
  }
}

const overall = new Map();
for (const d of dumps) {
  for (const c of d.characters || []) {
    const cur = overall.get(c.name) || { wins: 0, plays: 0 };
    cur.wins += c.wins;
    cur.plays += c.played;
    overall.set(c.name, cur);
  }
}

const STYLES = [
  { id: 'aggro', label: 'агрессивный' },
  { id: 'caution', label: 'пассивный' },
  { id: 'normal', label: 'обычный' }
];

const chars = D.CHARACTERS.slice();

function rate(name, style) {
  const a = agg.get(name + '|' + style);
  if (!a || !a.plays) return null;
  return (a.wins / a.plays) * 100;
}

function esc(v) {
  return String(v === undefined || v === null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function colName(n) {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

const cells = [];
function put(r, c, v, bold) {
  cells.push({ r, c, v, b: !!bold });
}

/* шапка: имена персонажей */
chars.forEach((ch, i) => {
  put(1, i + 2, ch.name, true);
});

/* строки стилей */
STYLES.forEach((st, i) => {
  const r = 2 + i;
  put(r, 1, st.label, true);
  chars.forEach((ch, j) => {
    const v = rate(ch.name, st.id);
    let value = v;
    /* обычный без стилей: все прогоны шли обычным ботом */
    if (value === null && st.id === 'normal') {
      const ov0 = overall.get(ch.name);
      if (ov0 && ov0.plays) value = (ov0.wins / ov0.plays) * 100;
    }
    put(r, j + 2, value === null ? '—' : Number(value.toFixed(1)));
  });
});

/* нижняя строка: общий винрейт персонажа */
const rTotal = 2 + STYLES.length;
put(rTotal, 1, 'всего', true);
chars.forEach((ch, j) => {
  let wins = 0;
  let plays = 0;
  for (const st of STYLES) {
    const a = agg.get(ch.name + '|' + st.id);
    if (a) { wins += a.wins; plays += a.plays; }
  }
  const ov = overall.get(ch.name);
  const finalWins = plays || (ov ? ov.wins : 0);
  const finalPlays = plays || (ov ? ov.plays : 0);
  put(rTotal, j + 2, finalPlays ? Number(((finalWins / finalPlays) * 100).toFixed(1)) : '—', true);
});
put(1, 1, '', true);

/* лист */
const maxRow = rTotal;
const maxCol = chars.length + 1;
const byKey = new Map();
for (const c of cells) byKey.set(c.r + ':' + c.c, c);

let sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
sheet += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
sheet += '<cols>';
sheet += '<col min="1" max="1" width="18" customWidth="1"/>';
for (let i = 2; i <= maxCol; i++) sheet += `<col min="${i}" max="${i}" width="16" customWidth="1"/>`;
sheet += '</cols><sheetData>';

for (let r = 1; r <= maxRow; r++) {
  sheet += `<row r="${r}">`;
  for (let c = 1; c <= maxCol; c++) {
    const cell = byKey.get(r + ':' + c);
    if (!cell || cell.v === '' || cell.v === undefined) continue;
    const ref = colName(c) + r;
    const style = cell.b ? ' s="1"' : '';
    if (typeof cell.v === 'number') sheet += `<c r="${ref}"${style}><v>${cell.v}</v></c>`;
    else sheet += `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${esc(cell.v)}</t></is></c>`;
  }
  sheet += '</row>';
}
sheet += '</sheetData></worksheet>';

const tmp = 'game-lab/tmp-xlsx';
if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(path.join(tmp, '_rels'), { recursive: true });
fs.mkdirSync(path.join(tmp, 'xl', '_rels'), { recursive: true });
fs.mkdirSync(path.join(tmp, 'xl', 'worksheets'), { recursive: true });

fs.writeFileSync(path.join(tmp, '[Content_Types].xml'),
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
  '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
  '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
  '</Types>', 'utf8');

fs.writeFileSync(path.join(tmp, '_rels', '.rels'),
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
  '</Relationships>', 'utf8');

fs.writeFileSync(path.join(tmp, 'xl', 'workbook.xml'),
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
  '<sheets><sheet name="Винрейты" sheetId="1" r:id="rId1"/></sheets></workbook>', 'utf8');

fs.writeFileSync(path.join(tmp, 'xl', '_rels', 'workbook.xml.rels'),
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
  '</Relationships>', 'utf8');

fs.writeFileSync(path.join(tmp, 'xl', 'styles.xml'),
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="2"><font><sz val="11"/><name val="Times New Roman"/></font><font><b/><sz val="11"/><name val="Times New Roman"/></font></fonts>' +
  '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>' +
  '<borders count="1"><border/></borders>' +
  '<cellStyleXfs count="1"><xf/></cellStyleXfs>' +
  '<cellXfs count="2"><xf fontId="0"/><xf fontId="1" applyFont="1"/></cellXfs>' +
  '</styleSheet>', 'utf8');

fs.writeFileSync(path.join(tmp, 'xl', 'worksheets', 'sheet1.xml'), sheet, 'utf8');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
execFileSync('powershell.exe', [
  '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', path.resolve('game-lab/tools/zip-folder.ps1'),
  '-Folder', path.resolve(tmp),
  '-Out', path.resolve(outPath)
], { stdio: 'pipe' });

fs.rmSync(tmp, { recursive: true, force: true });
console.log('таблица винрейтов: ' + outPath);
