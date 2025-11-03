@echo off



REM call waitForDevices.bat

REM tasklist /FI "IMAGENAME eq obs64.exe" 2>NUL | find /I /N "obs64.exe">NUL

REM IF NOT "%ERRORLEVEL%" == "0"  (
REM     start "" \  obs64.exe.lnk
REM     timeout /t 10 /nobreak
REM )

REM tasklist /FI "IMAGENAME eq player.exe" 2>NUL | find /I /N "player.exe">NUL

REM IF NOT "%ERRORLEVEL%" == "0"  (
REM     start "" player.exe.lnk
REM     timeout /t 10 /nobreak
REM )

cd ../


node --trace-warnings ./release/main.js

timeout /t 5 /nobreak

CALL :watchdogLoop

shutdown /r /t 0

:watchdogLoop
<nul set /p=watchdogloop started for node.exe...
:Loop
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
IF NOT "%ERRORLEVEL%" == "1"  (
    <nul set /p=.
    timeout /t 3 >nul
    goto Loop
)
EXIT /B