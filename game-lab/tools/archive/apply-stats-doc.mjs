/* Читает «Персонажи — только статы.docx» и приводит данные игры к этим числам. */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const D = require('../arena/game-data.js');

const DOCX = process.argv[2] || 'C:\\Users\\InsaneHoo8\\Desktop\\Лайтовая настолка\\Промты для нейронки\\Персонажи — только статы.docx';
const TMP = 'game-lab/docs/_stats.txt';

execFileSync('powershell.exe', [
  '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', path.resolve('game-lab/tools/docx2md.ps1'),
  '-Src', DOCX,
  '-Out', path.resolve(TMP)
], { stdio: 'pipe' });

const text = fs.readFileSync(TMP, 'utf8');
fs.unlinkSync(TMP);

const UNITS = {
  'ноль': 0, 'один': 1, 'одна': 1, 'два': 2, 'две': 2, 'три': 3, 'четыре': 4, 'пять': 5,
  'шесть': 6, 'семь': 7, 'восемь': 8, 'девять': 9, 'десять': 10, 'одиннадцать': 11,
  'двенадцать': 12, 'тринадцать': 13, 'четырнадцать': 14, 'пятнадцать': 15, 'шестнадцать': 16,
  'семнадцать': 17, 'восемнадцать': 18, 'девятнадцать': 19
};
const TENS = {
  'двадцать': 20, 'тридцать': 30, 'сорок': 40, 'пятьдесят': 50, 'шестьдесят': 60,
  'семьдесят': 70, 'восемьдесят': 80, 'девяносто': 90
};

function wordsToNumber(str) {
  const words = str.toLowerCase().split(/[^а-яё]+/).filter(Boolean);
  let total = 0;
  for (const w of words) {
    if (w in TENS) total += TENS[w];
    else if (w in UNITS) total += UNITS[w];
  }
  return total;
}

const norm = (s) => s.replace(/[’'`]/g, '').replace(/\s+/g, ' ').trim();

function findId(name) {
  const target = norm(name);
  let best = null;
  let bestLen = 0;
  for (const c of D.CHARACTERS) {
    const cn = norm(c.name);
    if (target.includes(cn) && cn.length > bestLen) {
      best = c.id;
      bestLen = cn.length;
    }
  }
  return best;
}

const parsed = {};
for (const rawLine of text.split(/\r?\n/)) {
  const clean = rawLine.replace(/\*\*/g, '').replace(/^#+\s*/, '').trim();
  if (!clean) continue;
  const head = clean.match(/^(.+?)\.\s+(.+)$/);
  if (!head) continue;
  const name = head[1].replace(/[«»"]/g, ' ').replace(/\s+/g, ' ').trim();
  const body = head[2];

  const hp = body.match(/Здоровье\s+([а-яё\s]+?)\s+единиц/);
  const dmg = body.match(/урон обычной атаки\s+([а-яё\s]+?)\s+единиц/);
  const mental = body.match(/менталка\s+([а-яё\s]+?)\s+единиц/);
  const mana = body.match(/энергия\s+([а-яё\s]+?)\s+единиц/);
  const hand = body.match(/Лимит руки\s+([а-яё\s]+?)\s+способност/);

  const id = findId(name);
  if (!id) {
    console.log('не опознан персонаж: ' + name);
    continue;
  }
  if (!hp || !dmg || !mental || !mana || !hand) {
    console.log('не разобраны числа у ' + name);
    continue;
  }
  parsed[id] = {
    name: name,
    hp: wordsToNumber(hp[1]),
    dmg: wordsToNumber(dmg[1]),
    mental: wordsToNumber(mental[1]),
    mana: wordsToNumber(mana[1]),
    handLimit: wordsToNumber(hand[1])
  };
}

const ids = Object.keys(parsed);
console.log('разобрано персонажей: ' + ids.length);
for (const [id, st] of Object.entries(parsed)) {
  const c = D.charById(id);
  console.log('  ' + c.name.padEnd(16) + ' хп ' + st.hp + ' (было ' + c.hp + '), урон ' + st.dmg + ' (было ' + c.dmg + '), менталка ' + st.mental + ', энергия ' + st.mana + ', рука ' + st.handLimit);
}

if (ids.length !== 12) {
  console.log('не все персонажи разобраны, данные не меняю');
  process.exit(1);
}

const cardsPath = 'game-lab/arena/cards.js';
let src = fs.readFileSync(cardsPath, 'utf8');
let changed = 0;

for (const [id, stats] of Object.entries(parsed)) {
  const at = src.indexOf(`id: '${id}'`);
  if (at < 0) throw new Error('нет персонажа ' + id);
  const blockEnd = src.indexOf('abilities: [', at);
  let block = src.slice(at, blockEnd);
  for (const key of ['hp', 'dmg', 'mental', 'mana', 'handLimit']) {
    const value = stats[key];
    const re = new RegExp('\\b' + key + ': \\d+');
    const m = block.match(re);
    if (!m) continue;
    const old = Number(m[0].split(':')[1].trim());
    if (old !== value) {
      block = block.replace(re, key + ': ' + value);
      console.log('  правка ' + id + '.' + key + ': ' + old + ' -> ' + value);
      changed++;
    }
  }
  src = src.slice(0, at) + block + src.slice(blockEnd);
}

if (changed) {
  fs.writeFileSync(cardsPath, src, 'utf8');
  console.log('изменений: ' + changed);
} else {
  console.log('данные уже совпадают с документом');
}
