@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === Демо: движок
node tools\self-check.mjs
echo.
echo === Демо: разметка
node tools\markup-check.mjs
echo.
echo === Арена: правила
node arena\tools\self-check.mjs
echo.
echo === Арена: прогон 800 партий
node arena\tools\sim.mjs 800 4 1
echo.
echo === Скрытые проверки в браузере (нужен интернет не нужен, нужен Chrome)
node tools\ax-audit.mjs
node arena\tools\ax-audit.mjs
echo.
pause
