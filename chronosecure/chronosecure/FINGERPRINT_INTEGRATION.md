# Fingerprint Integration Guide

## Overview
ChronoSecure now supports biometric fingerprint authentication using WebAuthn API. This enables secure, BIPA-compliant fingerprint enrollment and verification for employee attendance tracking.

## Features

### Backend
- **BiometricService**: Handles fingerprint enrollment and verification
- **BiometricController**: REST API endpoints for biometric operations
- **BIPA Compliance**: Encrypted storage of fingerprint template hashes (never raw images)
- **Consent Management**: Tracks explicit biometric consent per employee

### Frontend
- **WebAuthn Integration**: Browser-based biometric authentication
- **Fingerprint Enrollment Component**: UI for enrolling employee fingerprints
- **Kiosk Integration**: Fingerprint verification for clock-in/out
- **Employee Management**: Fingerprint enrollment from employee list

## Supported Devices

The fingerprint integration works with:
- **USB Fingerprint Readers**: Compatible with WebAuthn/FIDO2
- **Touch ID**: macOS and iOS devices
- **Face ID**: iOS devices
- **Windows Hello**: Windows 10/11 devices
- **Android Biometric**: Android devices with fingerprint/face unlock

## API Endpoints

### 1. Enroll Fingerprint
```
POST /api/v1/biometric/enroll
Headers:
  - Authorization: Bearer <token>
  - X-Company-Id: <company-id>
Body:
{
  "employeeId": "uuid",
  "fingerprintTemplateHash": "encrypted-hash",
  "grantConsent": true
}
```

### 2. Verify Fingerprint
```
POST /api/v1/biometric/verify
Body:
{
  "employeeCode": "EMP001",
  "fingerprintTemplateHash": "hash-to-verify",
  "companyId": "uuid" (optional)
}
Response:
{
  "verified": true,
  "employeeId": "uuid",
  "employeeCode": "EMP001",
  "firstName": "John",
  "lastName": "Doe",
  "confidenceScore": 0.95,
  "message": "Fingerprint verified successfully"
}
```

### 3. Check Enrollment Status
```
GET /api/v1/biometric/enrollment-status/{employeeId}
Headers:
  - Authorization: Bearer <token>
  - X-Company-Id: <company-id>
```

### 4. Remove Fingerprint
```
DELETE /api/v1/biometric/remove/{employeeId}
Headers:
  - Authorization: Bearer <token>
  - X-Company-Id: <company-id>
```

## Usage

### For Administrators: Enrolling Employee Fingerprints

1. Navigate to **Employees** page
2. Click **"Enroll Fingerprint"** button next to an employee
3. Click **"Check Biometric Support"** to verify device compatibility
4. Click **"Enroll Fingerprint"**
5. Follow the browser prompt to use your device's biometric (Touch ID, Face ID, Windows Hello, etc.)
6. The fingerprint template will be encrypted and stored securely

### For Employees: Using Fingerprint at Kiosk

1. Navigate to **Kiosk** page
2. Enter your **Employee Code**
3. Check **"Use Fingerprint Authentication"**
4. Click **"Verify Fingerprint"**
5. Use your device's biometric authentication
6. Once verified, click **"Clock In"**

## Security & Compliance

### BIPA Compliance
- ✅ Only encrypted fingerprint template hashes are stored (never raw images)
- ✅ Explicit consent is required before enrollment
- ✅ Consent can be revoked at any time
- ✅ Biometric data is deleted when consent is revoked

### Data Protection
- ✅ AES-256 encryption at rest
- ✅ Secure transmission over HTTPS
- ✅ Multi-tenant data isolation
- ✅ Audit logging of all biometric operations

## Technical Details

### Fingerprint Hash Generation
The system uses WebAuthn API to generate secure credential IDs, which are then hashed using SHA-256 to create fingerprint template hashes. In production, you can integrate with dedicated fingerprint scanner SDKs for more accurate matching.

### Matching Algorithm
The current implementation uses a simplified similarity algorithm. For production use, consider integrating with:
- **Minutiae-based matching** (industry standard)
- **Commercial fingerprint SDKs** (e.g., Neurotechnology, Innovatrics)
- **Hardware-specific APIs** for USB fingerprint readers

### Fallback Mode
If biometric hardware is not available, the system uses a fallback hash generation method for testing purposes. **This should NOT be used in production.**

## Troubleshooting

### "WebAuthn is not supported"
- Ensure you're using a modern browser (Chrome 67+, Firefox 60+, Safari 13+, Edge 18+)
- Check that HTTPS is enabled (required for WebAuthn)

### "Biometric authentication failed"
- Verify the device has biometric capabilities enabled
- Check that the employee has enrolled their fingerprint
- Ensure consent has been granted and not revoked

### "Fingerprint verification failed"
- The fingerprint template may not match
- Try re-enrolling the fingerprint
- Check that the employee code is correct

## Next Steps

For production deployment:
1. Integrate with dedicated fingerprint scanner SDKs
2. Implement proper minutiae-based matching algorithms
3. Add support for multiple fingerprint templates per employee
4. Configure hardware-specific fingerprint readers
5. Set up proper certificate management for WebAuthn

## Support

For issues or questions, please refer to the API documentation at `/swagger-ui/index.html` or contact the development team.

