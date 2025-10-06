



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
