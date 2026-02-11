[Setup]
; Basic Information
AppName=AttendWatch Fingerprint
AppVersion=1.0
AppPublisher=AttendWatch
AppPublisherURL=https://attendwatch.com
AppSupportURL=https://attendwatch.com/support
AppUpdatesURL=https://attendwatch.com/download

; Install Location
DefaultDirName={autopf}\AttendWatch Fingerprint
DefaultGroupName=AttendWatch
DisableProgramGroupPage=yes
; Request Admin privileges to write to Registry
PrivilegesRequired=admin

; Output
OutputBaseFilename=AttendWatchSetup
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
Source: "dist\AttendWatchFingerprint\AttendWatchFingerprint.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\AttendWatchFingerprint\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; Copy the Database and DLLs (PyInstaller usually handles this if configured, but safe to verify)

[Icons]
Name: "{group}\AttendWatch Fingerprint"; Filename: "{app}\AttendWatchFingerprint.exe"
Name: "{autodesktop}\AttendWatch Fingerprint"; Filename: "{app}\AttendWatchFingerprint.exe"; Tasks: desktopicon

[Registry]
; Register the custom protocol handler (The Magic Part) [fingerprint://]
Root: HKCR; Subkey: "fingerprint"; ValueType: string; ValueName: ""; ValueData: "URL:Fingerprint Protocol"; Flags: uninsdeletekey
Root: HKCR; Subkey: "fingerprint"; ValueType: string; ValueName: "URL Protocol"; ValueData: ""; Flags: uninsdeletekey
Root: HKCR; Subkey: "fingerprint\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\AttendWatchFingerprint.exe,0"
Root: HKCR; Subkey: "fingerprint\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\AttendWatchFingerprint.exe"" ""%1"""

[Run]
Filename: "{app}\AttendWatchFingerprint.exe"; Description: "{cm:LaunchProgram,AttendWatch Fingerprint}"; Flags: nowait postinstall skipifsilent
