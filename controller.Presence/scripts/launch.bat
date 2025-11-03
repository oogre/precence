call waitForDevices.bat

nircmd.exe win hide title "TeamViewer"

tasklist /FI "IMAGENAME eq obs64.exe" 2>NUL | find /I /N "obs64.exe">NUL
IF NOT "%ERRORLEVEL%" == "0"  (
	start "" obs64.exe.lnk --disable-shutdown-check
	timeout /t 10 /nobreak
)


tasklist /FI "IMAGENAME eq javaw.exe" 2>NUL | find /I /N "javaw.exe">NUL

IF NOT "%ERRORLEVEL%" == "0"  (
	start "" player.exe.lnk
	timeout /t 10 /nobreak
)

cd ../
@echo off
echo. >> ./data/logs/logfile.log
echo. >> ./data/logs/logfile.log
echo. >> ./data/logs/logfile.log
echo #################################### >> ./data/logs/logfile.log
echo #################################### >> ./data/logs/logfile.log
echo #################################### >> ./data/logs/logfile.log
echo RUN LAUNCH AT %date% %time%>> ./data/logs/logfile.log
echo #################################### >> ./data/logs/logfile.log
echo #################################### >> ./data/logs/logfile.log
echo #################################### >> ./data/logs/logfile.log

start node --trace-warnings ./release/main.js >> ./data/logs/logfile.log 2>>&1

timeout /t 5 /nobreak

nircmd.exe win focus title "Presence"

@echo off

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