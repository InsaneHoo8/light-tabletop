@echo off
setlocal EnableExtensions
chcp 866 >nul
title DeepSeek Harness

rem =====================================================================
rem  DeepSeek Harness - запуск в один клик (двойной щелчок по файлу)
rem
rem  Что делает:
rem    1) переходит в рабочую папку (по умолчанию - папка этого файла);
rem    2) проверяет, что установлены Node.js и команда dsh;
rem    3) запускает профиль web и открывает браузер с веб-интерфейсом.
rem
rem  Мелочи:
rem    - киньте папку проекта на этот .bat - DSH запустится в ней;
rem    - остановить: Ctrl+C или закрыть это окно.
rem
rem  ВАЖНО: файл сохранён в кодировке OEM 866 (cp866) - так cmd.exe
rem  правильно читает русский текст. При правке сохраняйте cp866.
rem =====================================================================

rem --- настройки -------------------------------------------------------
rem  Профиль: web (браузер), tui (терминал), headless (один запрос и выход)
if not defined DSH_PROFILE set "DSH_PROFILE=web"
rem  Дополнительные параметры профиля, например: --port 8080 --no-open
if not defined DSH_ARGS set "DSH_ARGS="
rem  Рабочая папка: папка этого файла; первый аргумент переопределяет её
set "WORKDIR=%~dp0"
if not "%~1"=="" set "WORKDIR=%~1"
rem ---------------------------------------------------------------------

cd /d "%WORKDIR%" 2>nul
if errorlevel 1 (
    echo [ОШИБКА] Не удалось перейти в папку: %WORKDIR%
    goto :fail
)

where node >nul 2>&1
if errorlevel 1 (
    echo [ОШИБКА] Node.js не найден в PATH.
    echo          Установите Node.js 24.9 или новее: https://nodejs.org/
    goto :fail
)

where dsh >nul 2>&1
if errorlevel 1 (
    echo [ОШИБКА] Команда dsh не найдена в PATH.
    echo          Установите DeepSeek Harness: npm install -g @deepseek-ai/dsh
    goto :fail
)

echo Рабочая папка : %CD%
echo Профиль       : %DSH_PROFILE%
echo.
echo Запускаю DeepSeek Harness...
echo Остановить: Ctrl+C или закрыть это окно.
echo.

call dsh %DSH_PROFILE% %DSH_ARGS%
set "EXITCODE=%ERRORLEVEL%"

echo.
if not "%EXITCODE%"=="0" (
    echo [ОШИБКА] DSH завершился с кодом %EXITCODE%.
    echo Подсказка: если порт уже занят другим окном DSH,
    echo задайте в DSH_ARGS параметр --port 8080 и запустите снова.
    echo.
    pause
    exit /b %EXITCODE%
)

echo DSH завершил работу.
pause
exit /b 0

:fail
echo.
pause
exit /b 1
