/* Достаёт полные списки артефактов по персонажам из markdown-отчётов
   и дополняет ими машинные слепки, чтобы в таблице были все карты. */

import fs from 'node:fs';
import path from 'node:path';

const MD_DIR = 'game-lab/docs/Симуляция игр ботяр';
const DATA_DIR = 'game-lab/sim-data';

const files = fs.readdirSync(MD_DIR).filter((f) => f.endsWith('.md'));

for (const file of files) {
  const stamp = file.replace(/^Симуляция\s+/, '').replace(/\.md$/, '');
  const dumpName = stamp.replace(/[.:]/g, '-') + '.json';
  const dumpPath = path.join(DATA_DIR, dumpName);
  if (!fs.existsSync(dumpPath)) {
    console.log('нет слепка для ' + file);
    continue;
  }

  const md = fs.readFileSync(path.join(MD_DIR, file), 'utf8');
  const lines = md.split(/\r?\n/);

  const per = new Map();
  let current = null;

  for (const raw of lines) {
    const line = raw.trim();

    let m = line.match(/^###\s+(.+)$/);
    if (m) {
      current = m[1].trim();
      if (!per.has(current)) per.set(current, new Map());
      continue;
    }
    m = line.match(/^\*\*(.+?)\.\*\*\s+Всего применений/);
    if (m) {
      current = m[1].trim();
      if (!per.has(current)) per.set(current, new Map());
      continue;
    }
    m = line.match(/^\*\*(.+?)\.\*\*\s+Артефакты не применял/);
    if (m) {
      current = m[1].trim();
      if (!per.has(current)) per.set(current, new Map());
      continue;
    }

    if (!current) continue;
    m = line.match(/^-\s+(.+?)\s+—\s+менталка:\s+\d+\.\s.*Применений:\s+(\d+)\.$/);
    if (m) {
      per.get(current).set(m[1].trim(), Number(m[2]));
    }
  }

  const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
  let total = 0;
  const leaders = [];
  for (const [name, m] of per) {
    const ch = dump.characters.find((c) => c.name === name);
    const top = Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
    const sum = top.reduce((acc, x) => acc + x[1], 0);
    total += sum;
    leaders.push({
      name: name,
      hp: ch ? ch.hp : 0,
      dmg: ch ? ch.dmg : 0,
      total: sum,
      top: top
    });
  }
  leaders.sort((a, b) => b.total - a.total);
  dump.artifactLeaders = leaders;
  fs.writeFileSync(dumpPath, JSON.stringify(dump, null, 2), 'utf8');
  console.log(file + ' -> карт по персонажам: ' + leaders.reduce((a, x) => a + x.top.length, 0));
}
