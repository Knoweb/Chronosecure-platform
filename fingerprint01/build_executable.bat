@echo off
echo ========================================================
echo   ChronoSecure Fingerprint - Build Tool (32-BIT MODE)
echo ========================================================
echo.
echo Step 1: Installing PyInstaller for 32-bit Python...
py -3-32 -m pip install --upgrade pip
echo Installing PyInstaller...
py -3-32 -m pip install pyinstaller --user --no-cache-dir --force-reinstall

echo Step 1.5: Installing Dependencies for 32-bit Python...
py -3-32 -m pip install opencv-python numpy pillow firebase-admin --user --no-cache-dir

echo.
echo Step 2: Cleaning up previous builds...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist
if exist *.spec del *.spec

echo.
echo Step 3: Compiling Python to 32-bit Executable...
echo This may take a minute...
echo.

REM Uses 32-bit Python to ensure compatibility with 32-bit DLLs
py -3-32 -m PyInstaller --noconfirm --onedir --windowed --name "ChronoFingerprint" ^
    --add-data "ID_FprCap.dll;." ^
    --add-data "ZhiAngCamera.dll;." ^
    --add-data "serviceAccountKey.json;." ^
    --add-data "fp_local.db;." ^
    --icon "NONE" ^
    fingerprintnormal.py

echo.
echo ========================================================
echo   Build Complete!
echo ========================================================
echo.
echo You can find your executable in: dist\ChronoFingerprint\ChronoFingerprint.exe
echo.
echo NEXT STEP:
echo 1. Install 'Inno Setup' (if not installed).
echo 2. Open 'setup_script.iss'.
echo 3. Click 'Compile'.
echo 4. You will get 'ChronoSecureSetup.exe' - Give THIS to your client!
echo.
pause
