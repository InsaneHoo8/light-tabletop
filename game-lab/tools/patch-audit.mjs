import fs from 'node:fs';

const appPath = 'game-lab/arena/app.js';
const auditPath = 'game-lab/arena/tools/ax-audit.mjs';

let app = fs.readFileSync(appPath, 'utf8');
const hook = `    setDraft: function (v) {
      settings.draft = !!v;
      el.optDraft.checked = settings.draft;
      saveSettings();
      newGame();
    },
    autoDraft: function () {`;
if (!app.includes('setDraft: function')) {
  app = app.replace('    autoDraft: function () {', hook);
  fs.writeFileSync(appPath, app, 'utf8');
  console.log('app.js: setDraft добавлен');
} else {
  console.log('app.js: уже есть');
}

let t = fs.readFileSync(auditPath, 'utf8');
const startMark = '/* Сначала драфт';
const endMark = '  const activeId = ';
const a = t.indexOf(startMark);
const b = t.indexOf(endMark, a);
if (a < 0 || b < 0) {
  console.log('маркеры не найдены: a=' + a + ' b=' + b);
  process.exit(1);
}
const block = `/* По умолчанию способности личные: раздела драфта нет. */
  check('раздел драфта скрыт', (await evalJS('document.getElementById("draft-section").hidden')) === true);
  const personal = await evalJS('JSON.stringify(window.__arena.state().players.map(function(p){return p.abilities.length;}))');
  check('у каждого свои способности', personal !== '[0,0,0,0]', personal);

  /* Драфт включается отдельно. */
  await evalJS('window.__arena.setDraft(true)');
  await sleep(250);
  check('раздел драфта виден', (await evalJS('!document.getElementById("draft-section").hidden')) === true);
  const poolCount = await evalJS('document.querySelectorAll("#draft-list button").length');
  check('в драфте весь пул', poolCount === 27, String(poolCount));
  const firstDraft = await evalJS('document.activeElement && document.activeElement.getAttribute("data-id")');
  check('фокус на первой карте драфта', !!firstDraft && firstDraft !== 'attack', String(firstDraft));

  await evalJS('document.activeElement && document.activeElement.click()');
  await sleep(200);
  const hands = await evalJS('JSON.stringify(window.__arena.state().players.map(function(p){return p.abilities.length;}))');
  check('после первого круга у вас одна карта, у ботов по две', hands === '[1,2,2,2]', hands);

  await evalJS('window.__arena.autoDraft()');
  await sleep(250);
  check('после драфта партия началась', (await evalJS('window.__arena.state().phase')) === 'main');

  await evalJS('window.__arena.setDraft(false)');
  await sleep(200);

`;
t = t.slice(0, a) + block + t.slice(b);
fs.writeFileSync(auditPath, t, 'utf8');
console.log('ax-audit.mjs: блок заменён');
