$ErrorActionPreference = "Stop"

# 1. app.js: add setDraft hook
$a = "game-lab/arena/app.js"
$ta = [System.IO.File]::ReadAllText($a, [System.Text.Encoding]::UTF8)
$hook = @'
    setDraft: function (v) {
      settings.draft = !!v;
      el.optDraft.checked = settings.draft;
      saveSettings();
      newGame();
    },
    autoDraft: function () {
'@
$ta = $ta.Replace("    autoDraft: function () {", $hook)
[System.IO.File]::WriteAllText($a, $ta, (New-Object System.Text.UTF8Encoding($false)))

# 2. ax-audit.mjs: draft is now optional, test both modes
$p = "game-lab/arena/tools/ax-audit.mjs"
$t = [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)

$startMark = "/* Сначала драфт"
$a1 = $t.IndexOf($startMark)
if ($a1 -lt 0) { throw "start marker not found" }
$b1 = $t.IndexOf("const activeId = ", $a1)
if ($b1 -lt 0) { throw "end marker not found" }

$block = @'
/* По умолчанию способности личные: раздела драфта нет. */
  check('раздел драфта скрыт', (await evalJS('document.getElementById("draft-section").hidden')) === true);
  const personal = await evalJS('JSON.stringify(window.__arena.state().players.map(function(p){return p.abilities.length;}))');
  check('у каждого свои способности', personal !== '[0,0,0,0]' && personal.indexOf('[0') !== 0, personal);

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

  '
$t = $t.Substring(0, $a1) + $block + $t.Substring($b1)
[System.IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))
Write-Output "patched"
