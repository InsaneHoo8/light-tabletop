import fs from 'node:fs';

const sp = 'game-lab/tools/sim-report.mjs';
let s = fs.readFileSync(sp, 'utf8').replace(/\r\n/g, '\n');

/* смешанный режим */
if (!s.includes('MIXED')) {
  s = s.replace(
    "aggression: process.env.AGGRO === '1' ? 1 : 0, caution: process.env.CAUTION === '1' ? 1 : 0",
    "aggression: process.env.AGGRO === '1' ? 1 : 0, caution: process.env.CAUTION === '1' ? 1 : 0, mixed: process.env.MIXED === '1'"
  );
  console.log('отчёт: смешанный режим передан');
}

/* счётчик побед по стилю */
if (!s.includes('styleWins')) {
  s = s.replace(
    "const wins = new Map();",
    "const wins = new Map();\nconst styleWins = new Map();\nconst stylePlays = new Map();"
  );

  s = s.replace(
    "  wins.set(s.players[s.winner].name, (wins.get(s.players[s.winner].name) || 0) + 1);",
    `  wins.set(s.players[s.winner].name, (wins.get(s.players[s.winner].name) || 0) + 1);
  var winStyle = s.players[s.winner].style || 'normal';
  styleWins.set(winStyle, (styleWins.get(winStyle) || 0) + 1);
  for (var sti = 0; sti < s.players.length; sti++) {
    var stl = s.players[sti].style || 'normal';
    stylePlays.set(stl, (stylePlays.get(stl) || 0) + 1);
  }`
  );

  /* раздел в отчёт */
  const anchor = "lines.push('## Победы по персонажам');";
  const section = `lines.push('## Победы по стилю игры');
lines.push('');
if ([...stylePlays.keys()].some((k) => k !== 'normal')) {
  const styleNames = { aggro: 'агрессивный', caution: 'осторожный', normal: 'обычный' };
  const rowsStyle = Array.from(stylePlays.entries()).sort((a, b) => (styleWins.get(b[0]) || 0) / b[1] - (styleWins.get(a[0]) || 0) / a[1]);
  for (const [st, cnt] of rowsStyle) {
    const w = styleWins.get(st) || 0;
    lines.push('- ' + (styleNames[st] || st) + ' — ' + ((w / Math.max(1, cnt)) * 100).toFixed(1).replace('.', ',') + '% (' + w + ' из ' + cnt + ').');
  }
} else {
  lines.push('Все боты играли одинаково.');
}
lines.push('');

`;
  s = s.replace(anchor, section + anchor);
}

fs.writeFileSync(sp, s, 'utf8');
console.log('отчёт: раздел по стилям');
