import fs from 'node:fs';

/* 1. Слепки: сохраняем сворованные */
const sp = 'game-lab/tools/sim-report.mjs';
let s = fs.readFileSync(sp, 'utf8').replace(/\r\n/g, '\n');
if (!s.includes('stolen: Array.from')) {
  s = s.replace(
    "  damageByChar: Array.from(damageDealt.entries()).map(([k, v]) => ({ name: k, value: v })),",
    "  stolen: Array.from(stolenBy.entries()).map(([k, v]) => ({ key: k, count: v })),\n  damageByChar: Array.from(damageDealt.entries()).map(([k, v]) => ({ name: k, value: v })),"
  );
  fs.writeFileSync(sp, s, 'utf8');
  console.log('слепки: сворованные сохраняются');
}

/* 2. Дозаполняем старые слепки из markdown-отчётов */
const MD_DIR = 'game-lab/docs/Симуляция игр ботяр';
const DATA_DIR = 'game-lab/sim-data';

for (const file of fs.readdirSync(MD_DIR).filter((x) => x.endsWith('.md'))) {
  const stamp = file.replace(/^Симуляция\s+/, '').replace(/\.md$/, '');
  const dumpPath = DATA_DIR + '/' + stamp.replace(/[.:]/g, '-') + '.json';
  if (!fs.existsSync(dumpPath)) continue;

  const md = fs.readFileSync(MD_DIR + '/' + file, 'utf8');
  const lines = md.split(/\r?\n/);
  const stolen = [];
  const start = lines.findIndex((l) => l.trim() === '## Сворованные способности');
  if (start >= 0) {
    for (let i = start + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('## ')) break;
      const m = line.match(/^- (.+?) применил сворованную «(.+?)» (\d+) раз\.$/);
      if (m) stolen.push({ key: m[1] + '::' + m[2], count: Number(m[3]) });
    }
  }

  const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
  dump.stolen = stolen;
  fs.writeFileSync(dumpPath, JSON.stringify(dump, null, 2), 'utf8');
}
console.log('слепки: сворованные дозаполнены из отчётов');
