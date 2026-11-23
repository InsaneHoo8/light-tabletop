import fs from 'node:fs';

const p = 'game-lab/tools/make-winrate-xlsx.mjs';
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

/* общий винрейт персонажа берём из самих отчётов */
if (!s.includes('overall')) {
  s = s.replace(
    "const STYLES = [",
    `const overall = new Map();
for (const d of dumps) {
  for (const c of d.characters || []) {
    const cur = overall.get(c.name) || { wins: 0, plays: 0 };
    cur.wins += c.wins;
    cur.plays += c.played;
    overall.set(c.name, cur);
  }
}

const STYLES = [`
  );

  s = s.replace(
    `  put(rTotal, j + 2, plays ? Number(((wins / plays) * 100).toFixed(1)) : '—', true);`,
    `  const ov = overall.get(ch.name);
  const finalWins = plays || (ov ? ov.wins : 0);
  const finalPlays = plays || (ov ? ov.plays : 0);
  put(rTotal, j + 2, finalPlays ? Number(((finalWins / finalPlays) * 100).toFixed(1)) : '—', true);`
  );

  fs.writeFileSync(p, s, 'utf8');
  console.log('винрейты: общая строка из отчётов');
}
