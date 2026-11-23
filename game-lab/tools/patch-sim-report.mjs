import fs from 'node:fs';

const p = 'game-lab/tools/sim-report.mjs';
let src = fs.readFileSync(p, 'utf8');

const dumpBlock = `
/* машинный слепок для таблиц */
const DATA_DIR = 'game-lab/sim-data';
fs.mkdirSync(DATA_DIR, { recursive: true });
const dumpName = (PATCH + ' ' + safeStamp).replace(/[.:]/g, '-') + '.json';

const dump = {
  patch: PATCH,
  experiment: EXPERIMENT,
  games: N,
  players: COUNT,
  finished: done,
  draws: draws,
  avgRounds: Number((rounds / Math.max(1, done)).toFixed(1)),
  maxRounds: maxRounds,
  emptyHand: emptyHand,
  firstSeatWin: firstWin,
  firstSeatPlays: firstPlays,
  characters: D.CHARACTERS.map((c) => ({
    id: c.id,
    name: c.name,
    full: c.full,
    hp: c.hp,
    dmg: c.dmg,
    mental: c.mental,
    mana: c.mana,
    handLimit: c.handLimit,
    wins: wins.get(c.name) || 0,
    played: plays.get(c.name) || 0
  })),
  abilities: [],
  artifacts: [],
  actions: Array.from(actions.entries()).map(([k, v]) => ({ action: k, count: v })),
  actionsByChar: Array.from(actionByChar.entries()).map(([name, m]) => ({
    name: name,
    actions: Array.from(m.entries()).map(([k, v]) => ({ action: k, count: v }))
  })),
  artifactLeaders: artByChar.map((row) => ({
    name: row.c.name,
    hp: row.c.hp,
    dmg: row.c.dmg,
    total: row.total,
    top: Array.from(row.per ? row.per.entries() : []).sort((a, b) => b[1] - a[1]).slice(0, 5)
  })),
  damageByChar: Array.from(damageDealt.entries()).map(([k, v]) => ({ name: k, value: v })),
  healByChar: Array.from(healing.entries()).map(([k, v]) => ({ name: k, value: v }))
};

for (const c of D.CHARACTERS) {
  for (const a of c.abilities) {
    dump.abilities.push({
      owner: c.name,
      name: a.name,
      cost: a.cost,
      desc: a.desc || '',
      uses: abilityUse.get(a.name) || 0,
      picked: abilityPicked.get(a.name) || 0
    });
  }
}
for (const a of D.ARTIFACTS) {
  dump.artifacts.push({
    name: a.name,
    world: a.world,
    cost: a.cost,
    desc: a.desc,
    uses: artifactUse.get(a.name) || 0,
    exchanges: artifactExchange.get(a.name) || 0
  });
}
fs.writeFileSync(path.join(DATA_DIR, dumpName), JSON.stringify(dump, null, 2), 'utf8');
console.log('слепок: ' + path.join(DATA_DIR, dumpName));

`;

if (!src.includes('машинный слепок для таблиц')) {
  src = src.replace('/* сборка docx в папку игры */', dumpBlock + '/* сборка docx в папку игры */');
}

fs.writeFileSync(p, src, 'utf8');
console.log('слепок добавлен в отчёт');
