import fs from 'node:fs';

const p = 'game-lab/tools/make-winrate-xlsx.mjs';
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

/* если стилевых данных нет, строка «обычный» берёт общий винрейт */
if (!s.includes('/* обычный без стилей */')) {
  s = s.replace(
    `  chars.forEach((ch, j) => {
    const v = rate(ch.name, st.id);
    put(r, j + 2, v === null ? '—' : Number(v.toFixed(1)));
  });`,
    `  chars.forEach((ch, j) => {
    const v = rate(ch.name, st.id);
    let value = v;
    /* обычный без стилей: все прогоны шли обычным ботом */
    if (value === null && st.id === 'normal') {
      const ov0 = overall.get(ch.name);
      if (ov0 && ov0.plays) value = (ov0.wins / ov0.plays) * 100;
    }
    put(r, j + 2, value === null ? '—' : Number(value.toFixed(1)));
  });`
  );

  s = s.replace(
    `put(rTotal, 1, 'всего', true);`,
    `put(rTotal, 1, 'всего', true);`
  );

  if (!s.includes("put(rTotal, 1, 'всего', true);")) {
    s = s.replace(
      `const rTotal = 2 + STYLES.length;`,
      `const rTotal = 2 + STYLES.length;\nput(rTotal, 1, 'всего', true);`
    );
  }

  fs.writeFileSync(p, s, 'utf8');
  console.log('винрейты: строка «обычный» заполняется общим винрейтом, подпись «всего»');
}
