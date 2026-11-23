import fs from 'node:fs';

const sp = 'game-lab/tools/sim-report.mjs';
let s = fs.readFileSync(sp, 'utf8').replace(/\r\n/g, '\n');

/* 1. Учёт побед по персонажу и стилю */
if (!s.includes('charStyle')) {
  s = s.replace(
    "const stylePlays = new Map();",
    "const stylePlays = new Map();\nconst charStyleWins = new Map();\nconst charStylePlays = new Map();"
  );

  s = s.replace(
    `  var winStyle = s.players[s.winner].style || 'normal';`,
    `  for (var csi = 0; csi < s.players.length; csi++) {
    var csp = s.players[csi];
    var keyCS = csp.name + '|' + (csp.style || 'normal');
    charStylePlays.set(keyCS, (charStylePlays.get(keyCS) || 0) + 1);
    if (csi === s.winner) charStyleWins.set(keyCS, (charStyleWins.get(keyCS) || 0) + 1);
  }
  var winStyle = s.players[s.winner].style || 'normal';`
  );

  s = s.replace(
    "  stolen: Array.from(stolenBy.entries()).map(([k, v]) => ({ key: k, count: v })),",
    `  stolen: Array.from(stolenBy.entries()).map(([k, v]) => ({ key: k, count: v })),
  styleMatrix: Array.from(charStylePlays.entries()).map(([k, plays]) => {
    const parts = k.split('|');
    return { name: parts[0], style: parts[1], wins: charStyleWins.get(k) || 0, plays: plays };
  }),`
  );

  fs.writeFileSync(sp, s, 'utf8');
  console.log('отчёт: матрица персонаж-стиль');
}
