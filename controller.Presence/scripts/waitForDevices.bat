@echo off
REM Main script

CALL :readEnvKey "../.env" "ROBT_X_HOST" ROBT_X_IP
CALL :readEnvKey "../.env" "ROBT_Y_HOST" ROBT_Y_IP
CALL :readEnvKey "../.env" "CAME_HOST" CAME_IP

echo %ROBT_X_IP%
echo %ROBT_Y_IP%
echo %CAME_IP%

CALL :pingLoop %ROBT_X_IP%
CALL :pingLoop %ROBT_Y_IP%
CALL :pingLoop %CAME_IP%

EXIT /B

:pingLoop
<nul set /p=Waiting for %~1 to respond...
:Loop
ping -n 1 %~1 >nul
if errorlevel 1 (
    <nul set /p=.
    timeout /t 1 >nul
    goto Loop
)
echo :
echo Host %~1 is connected!
EXIT /B


setlocal enabledelayedexpansion
:readEnvKey
REM Access parameters using %1, %2, etc.
set "filePath=%~1"
set "key=%~2"
set "result=%~3"
if not exist "%filePath%" (
    echo Le fichier %filePath% n'existe pas.
    exit /b 1
)
:: Parcourt le fichier ligne par ligne
for /f "usebackq tokens=1,* delims==" %%A in ("%filePath%") do (
    if /i "%%A"=="%key%" (
        set "value=%%B"
        goto :endLoop
    )
)
:endLoop
for /f "tokens=1 delims=:" %%A in ("%value%") do set "value=%%A"
set %result%=%value%
EXIT /B
