@echo off
cd /d "%~dp0"
echo Launching Fingerprint Scanner...
echo Arguments: %*
py -3-32 fingerprintnormal.py %*
if errorlevel 1 (
    echo Error launching scanner!
    pause
)
pause
