@echo off
setlocal EnableDelayedExpansion

REM Setup Script for Fingerprint Protocol Handler
REM This script registers the custom 'fingerprint://' protocol on the client machine to launch the application.

REM Get current directory
set "CURRENT_DIR=%~dp0"
REM Remove trailing backslash
if "%CURRENT_DIR:~-1%"=="\" set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"

REM Escape backslashes for .reg file format (replace \ with \\)
set "ESCAPED_DIR=%CURRENT_DIR:\=\\%"

echo.
echo ========================================================
echo   Setting up Fingerprint Handler Protocol
echo   Location: %CURRENT_DIR%
echo ========================================================
echo.

REM Create temporary .reg file
set "REG_FILE=%TEMP%\fingerprint_deploy.reg"

echo Windows Registry Editor Version 5.00 > "%REG_FILE%"
echo. >> "%REG_FILE%"
echo [HKEY_CLASSES_ROOT\fingerprint] >> "%REG_FILE%"
echo @="URL:Fingerprint Protocol" >> "%REG_FILE%"
echo "URL Protocol"="" >> "%REG_FILE%"
echo. >> "%REG_FILE%"
echo [HKEY_CLASSES_ROOT\fingerprint\DefaultIcon] >> "%REG_FILE%"
echo @="C:\\Windows\\System32\\shell32.dll,21" >> "%REG_FILE%"
echo. >> "%REG_FILE%"
echo [HKEY_CLASSES_ROOT\fingerprint\shell] >> "%REG_FILE%"
echo. >> "%REG_FILE%"
echo [HKEY_CLASSES_ROOT\fingerprint\shell\open] >> "%REG_FILE%"
echo. >> "%REG_FILE%"
echo [HKEY_CLASSES_ROOT\fingerprint\shell\open\command] >> "%REG_FILE%"
echo @="\"%ESCAPED_DIR%\\launch_fingerprint.bat\" \"%%1\"" >> "%REG_FILE%"

REM Import the .reg file
reg import "%REG_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Protocol handler registered successfully!
    echo Your browser can now launch the fingerprint application using 'fingerprint://' links.
) else (
    echo.
    echo [ERROR] Failed to register protocol handler. Check permissions (Run as Administrator).
)

REM Cleanup
del "%REG_FILE%"

echo.
pause
