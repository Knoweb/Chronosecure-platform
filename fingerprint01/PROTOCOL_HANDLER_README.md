# Fingerprint Protocol Handler Setup

This allows the web application to launch the fingerprint enrollment application directly from the browser.

## Installation Steps

1. **Register the Protocol Handler**
   - Run `setup_protocol.bat` (Double-click it)
   - This script will automatically detect your installation path and register the protocol.
   - Click "Yes" if Windows asks for permission to modify the registry.

2. **Test the Integration**
   - Open the ChronoSecure web application
   - Go to the Employees page
   - Click "Enroll Fingerprint" on any employee
   - The Python fingerprint application should launch automatically with the employee's information pre-filled

## How It Works

1. When you click "Enroll Fingerprint" in the web app, it opens a URL like:
   `fingerprint://enroll?employeeCode=001&name=John%20Doe`

2. Windows recognizes the `fingerprint://` protocol and calls `launch_fingerprint.bat`

3. The batch file launches the Python application with the URL parameters

4. The Python app parses the parameters and pre-fills the Employee ID and Name fields

## Uninstalling

To remove the protocol handler:
1. Press Win+R
2. Type `regedit` and press Enter
3. Navigate to `HKEY_CLASSES_ROOT\fingerprint`
4. Right-click and select "Delete"

## Troubleshooting

**Problem**: Clicking "Enroll Fingerprint" does nothing
- Make sure you ran `register_protocol.reg` as administrator
- Check that the path in the .reg file matches your actual installation path

**Problem**: Application launches but fields are empty
- Check the browser console for any URL encoding issues
- Verify the Python application is receiving the parameters (check the log)
