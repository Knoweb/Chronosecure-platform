# ChronoSecure API Documentation

## Base URL

```
http://localhost:8080/api/v1
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

For multi-tenant endpoints, also include:
```
X-Company-Id: <company-uuid>
```

## Endpoints

### Authentication

#### POST `/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "admin@company.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "admin@company.com",
  "userId": "uuid",
  "companyId": "uuid",
  "role": "COMPANY_ADMIN",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### POST `/auth/signup`
Create a new account and company.

**Request:**
```json
{
  "email": "admin@company.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Corp"
}
```

**Response:** Same as login response

#### POST `/auth/logout`
Logout (invalidate token).

**Headers:**
```
Authorization: Bearer <token>
```

---

### Employees

#### GET `/employees`
Get all employees for the authenticated company.

**Headers:**
```
Authorization: Bearer <token>
X-Company-Id: <company-uuid>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "employeeCode": "EMP001",
    "firstName": "Jane",
    "lastName": "Smith",
    "department": "Engineering",
    "email": "jane@company.com",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

#### POST `/employees`
Create a new employee.

**Headers:**
```
Authorization: Bearer <token>
X-Company-Id: <company-uuid>
```

**Request:**
```json
{
  "employeeCode": "EMP001",
  "firstName": "Jane",
  "lastName": "Smith",
  "department": "Engineering",
  "email": "jane@company.com",
  "pin": "1234",
  "fingerprintTemplateHash": "encrypted-hash",
  "grantBiometricConsent": true
}
```

**Response:** Employee object

#### PUT `/employees/{employeeId}`
Update an employee.

**Headers:**
```
Authorization: Bearer <token>
X-Company-Id: <company-uuid>
```

**Request:** Same as POST (all fields optional)

#### DELETE `/employees/{employeeId}`
Soft delete an employee (sets isActive to false).

**Headers:**
```
Authorization: Bearer <token>
X-Company-Id: <company-uuid>
```

---

### Biometric

#### POST `/biometric/enroll`
Enroll a fingerprint for an employee.

**Headers:**
```
Authorization: Bearer <token>
X-Company-Id: <company-uuid>
```

**Request:**
```json
{
  "employeeId": "uuid",
  "fingerprintTemplateHash": "encrypted-hash",
  "grantConsent": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Fingerprint enrolled successfully"
}
```

#### POST `/biometric/verify`
Verify a fingerprint (public endpoint for kiosk).

**Request:**
```json
{
  "employeeCode": "EMP001",
  "fingerprintTemplateHash": "hash-to-verify",
  "companyId": "uuid"
}
```

**Response:**
```json
{
  "verified": true,
  "employeeId": "uuid",
  "employeeCode": "EMP001",
  "firstName": "Jane",
  "lastName": "Smith",
  "confidenceScore": 0.95,
  "message": "Fingerprint verified successfully"
}
```

#### GET `/biometric/enrollment-status/{employeeId}`
Check if an employee has enrolled fingerprints.

**Headers:**
```
Authorization: Bearer <token>
X-Company-Id: <company-uuid>
```

**Response:**
```json
{
  "hasEnrolled": true,
  "employeeId": "uuid"
}
```

#### DELETE `/biometric/remove/{employeeId}`
Remove fingerprint data for an employee.

**Headers:**
```
Authorization: Bearer <token>
X-Company-Id: <company-uuid>
```

---

### Attendance

#### POST `/attendance/log`
Log an attendance event (Clock In/Out, Break Start/End).

**Request:**
```json
{
  "companyId": "uuid",
  "employeeId": "uuid",
  "eventType": "CLOCK_IN",
  "deviceId": "web-kiosk",
  "photoBase64": "base64-encoded-image",
  "confidenceScore": 0.95
}
```

**Event Types:**
- `CLOCK_IN`
- `BREAK_START`
- `BREAK_END`
- `CLOCK_OUT`

**Response:**
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "employee": {
    "id": "uuid",
    "employeeCode": "EMP001",
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "eventType": "CLOCK_IN",
  "eventTimestamp": "2025-01-01T09:00:00Z",
  "photoUrl": "https://storage.../photo.jpg",
  "deviceId": "web-kiosk",
  "confidenceScore": 0.95,
  "isOfflineSync": false
}
```

#### GET `/attendance/next-state/{companyId}/{employeeId}`
Get the next expected attendance event for an employee.

**Response:**
```
"CLOCK_IN" | "BREAK_START" | "BREAK_END" | "CLOCK_OUT"
```

---

### Reports

#### GET `/reports/generate`
Generate an attendance report.

**Headers:**
```
Authorization: Bearer <token>
X-Company-Id: <company-uuid>
```

**Query Parameters:**
- `startDate`: ISO date string
- `endDate`: ISO date string
- `employeeId`: Optional, filter by employee
- `format`: `xlsx` or `csv`

**Response:** File download (Excel or CSV)

---

### Compliance

#### POST `/compliance/export-data/{employeeId}`
Export employee data (GDPR Data Portability).

**Headers:**
```
Authorization: Bearer <token>
X-Company-Id: <company-uuid>
```

**Response:** JSON file download

#### DELETE `/compliance/delete-data/{employeeId}`
Hard delete employee data (GDPR Right to be Forgotten).

**Headers:**
```
Authorization: Bearer <token>
X-Company-Id: <company-uuid>
```

**Response:**
```json
{
  "success": true,
  "message": "Data deleted successfully"
}
```

#### GET `/compliance/audit-logs`
Get audit logs for compliance reporting.

**Headers:**
```
Authorization: Bearer <token>
X-Company-Id: <company-uuid>
```

**Query Parameters:**
- `startDate`: ISO date string
- `endDate`: ISO date string
- `action`: Filter by action type
- `resourceType`: Filter by resource type

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "companyId": "uuid",
    "action": "VIEW_EMPLOYEE_DATA",
    "resourceType": "EMPLOYEE",
    "resourceId": "uuid",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "details": {},
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

---

## Error Responses

All errors follow this format:

```json
{
  "timestamp": "2025-01-01T00:00:00Z",
  "status": 400,
  "message": "Error message here"
}
```

### Common Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Rate Limiting

API rate limits (if configured):
- Authentication endpoints: 5 requests/minute
- Other endpoints: 100 requests/minute

---

## WebSocket (Future)

Real-time updates via WebSocket:
- `ws://localhost:8080/ws/attendance`
- Subscribe to attendance events
- Receive real-time notifications

---

For interactive API testing, use Swagger UI:
`http://localhost:8080/swagger-ui/index.html`
