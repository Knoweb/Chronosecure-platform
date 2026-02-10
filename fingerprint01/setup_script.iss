[Setup]
; Basic Information
AppName=ChronoSecure Fingerprint
AppVersion=1.0
AppPublisher=ChronoSecure
AppPublisherURL=https://chronosecure.com
AppSupportURL=https://chronosecure.com/support
AppUpdatesURL=https://chronosecure.com/download

; Install Location
DefaultDirName={autopf}\ChronoSecure Fingerprint
DefaultGroupName=ChronoSecure
DisableProgramGroupPage=yes
; Request Admin privileges to write to Registry
PrivilegesRequired=admin

; Output
OutputBaseFilename=ChronoSecureSetup
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; IMPORTANT: You must run 'build_executable.bat' first to generate these files!
; We are packaging the executable created by PyInstaller
Source: "dist\ChronoFingerprint\ChronoFingerprint.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\ChronoFingerprint\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; Copy the Database and DLLs (PyInstaller usually handles this if configured, but safe to verify)

[Icons]
Name: "{group}\ChronoSecure Fingerprint"; Filename: "{app}\ChronoFingerprint.exe"
Name: "{autodesktop}\ChronoSecure Fingerprint"; Filename: "{app}\ChronoFingerprint.exe"; Tasks: desktopicon

[Registry]
; Register the custom protocol handler (The Magic Part) [fingerprint://]
Root: HKCR; Subkey: "fingerprint"; ValueType: string; ValueName: ""; ValueData: "URL:Fingerprint Protocol"; Flags: uninsdeletekey
Root: HKCR; Subkey: "fingerprint"; ValueType: string; ValueName: "URL Protocol"; ValueData: ""; Flags: uninsdeletekey
Root: HKCR; Subkey: "fingerprint\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\ChronoFingerprint.exe,0"
Root: HKCR; Subkey: "fingerprint\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\ChronoFingerprint.exe"" ""%1"""

[Run]
Filename: "{app}\ChronoFingerprint.exe"; Description: "{cm:LaunchProgram,ChronoSecure Fingerprint}"; Flags: nowait postinstall skipifsilent
