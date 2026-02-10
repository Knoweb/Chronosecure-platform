@echo off
REM Fingerprint Protocol Handler Launcher
REM This script is called by Windows when fingerprint:// URLs are opened

REM Get the full URL passed as argument
set "URL=%~1"

REM Extract parameters from URL (fingerprint://enroll?employeeCode=XXX&name=YYY)
REM For now, just launch the application - we'll parse params in Python

REM Change to the fingerprint application directory
cd /d "%~dp0"

REM Launch the Python application with 32-bit Python
start "" py -3-32 fingerprintnormal.py "%URL%"
