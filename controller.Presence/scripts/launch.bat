call waitForDevices.bat

nircmd.exe win hide title "TeamViewer"

tasklist /FI "IMAGENAME eq obs64.exe" 2>NUL | find /I /N "obs64.exe">NUL
IF NOT "%ERRORLEVEL%" == "0"  (
	start "" obs64.exe.lnk
	timeout /t 10 /nobreak
)


tasklist /FI "IMAGENAME eq player.exe" 2>NUL | find /I /N "player.exe">NUL

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
