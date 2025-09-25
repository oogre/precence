



call waitForDevices.bat

tasklist /FI "IMAGENAME eq obs64.exe" 2>NUL | find /I /N "obs64.exe">NUL

IF NOT "%ERRORLEVEL%" == "0"  (
    start "" \  obs64.exe.lnk
    timeout /t 10 /nobreak
)

tasklist /FI "IMAGENAME eq player.exe" 2>NUL | find /I /N "player.exe">NUL

IF NOT "%ERRORLEVEL%" == "0"  (
    start "" player.exe.lnk
    timeout /t 10 /nobreak
)

cd ../


node --trace-warnings ./release/main.js
