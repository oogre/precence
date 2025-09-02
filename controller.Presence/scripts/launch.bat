
tasklist /FI "IMAGENAME eq obs64.exe" 2>NUL | find /I /N "obs64.exe">NUL

IF NOT "%ERRORLEVEL%" == "0"  (
	cd /D "C:\Program Files\obs-studio\bin\64bit"
	start "" "obs64.exe"
	sleep(3000)
)

cd /D %~dp0
cd /D ../
node ./release/main.js