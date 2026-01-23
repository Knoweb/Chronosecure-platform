# ChronoSecure Quick Start Guide

## 5-Minute Setup

### Step 1: Prerequisites

Ensure you have:
- Java 17+
- Node.js 18+
- PostgreSQL 14+
- Maven 3.8+

### Step 2: Database Setup

```bash
# Create database
createdb chronosecure_db

# Or using psql
psql -U postgres
CREATE DATABASE chronosecure_db;
```

### Step 3: Backend Configuration

Edit `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/chronosecure_db
spring.datasource.username=postgres
spring.datasource.password=your_password
```

### Step 4: Start Backend

```bash
cd backend
./mvnw spring-boot:run
```

Wait for: `Started BackendApplication in X seconds`

### Step 5: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### Step 6: Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui/index.html

### Step 7: Create Account

1. Go to http://localhost:5173/signup
2. Fill in company and user details
3. Click "Sign Up"
4. You'll be automatically logged in as Company Admin

### Step 8: Add Employee

1. Go to Employees page
2. Click "Add Employee"
3. Fill in employee details
4. Click "Enroll Fingerprint" (optional)

### Step 9: Test Kiosk

1. Go to Kiosk page
2. Enter employee code
3. Verify fingerprint or capture photo
4. Click "Clock In"

## Common Tasks

### Adding Employees

1. Navigate to `/employees`
2. Click "Add Employee"
3. Enter employee code, name, department
4. Save

### Enrolling Fingerprints

1. Go to Employees page
2. Click "Enroll Fingerprint" next to employee
3. Click "Check Biometric Support"
4. Click "Enroll Fingerprint"
5. Use device biometric (Touch ID, Face ID, etc.)

### Logging Attendance

**Method 1: Fingerprint**
1. Go to Kiosk page
2. Enter employee code
3. Check "Use Fingerprint Authentication"
4. Click "Verify Fingerprint"
5. Use device biometric
6. Capture photo (required)
7. Click action button (Clock In/Out, etc.)

**Method 2: Photo Only**
1. Go to Kiosk page
2. Enter employee code
3. Click "Start Camera"
4. Capture photo
5. Click action button

### Generating Reports

1. Go to Reports page
2. Select date range
3. Optionally filter by employee
4. Click "Generate Report"
5. Download Excel file

## Troubleshooting

### Backend Won't Start

**Issue**: Port 8080 already in use
```bash
# Find process
lsof -i :8080
# Kill process
kill -9 <PID>
```

**Issue**: Database connection failed
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify credentials in `application.properties`
- Check database exists: `psql -l | grep chronosecure_db`

### Frontend Won't Start

**Issue**: Port 5173 already in use
```bash
# Find process
lsof -i :5173
# Kill process
kill -9 <PID>
```

**Issue**: npm install fails
```bash
# Clear cache
npm cache clean --force
# Delete node_modules
rm -rf node_modules
# Reinstall
npm install
```

### Can't Login

- Verify email and password
- Check backend is running
- Check browser console for errors
- Verify JWT secret is set

### Fingerprint Not Working

- Check browser supports WebAuthn (Chrome 67+, Firefox 60+, Safari 13+)
- Verify device has biometric capability
- Check HTTPS is enabled (required for WebAuthn)
- Try fallback method (photo only)

## Next Steps

1. **Read Full Documentation**
   - [API Documentation](./API.md)
   - [Database Schema](./DATABASE.md)
   - [Security Guide](./SECURITY.md)
   - [Compliance Guide](./COMPLIANCE.md)

2. **Configure Production**
   - [Deployment Guide](./DEPLOYMENT.md)
   - Set up SSL/TLS
   - Configure backups
   - Set up monitoring

3. **Customize**
   - Update company branding
   - Configure email templates
   - Set up integrations

## Getting Help

- **Documentation**: See `/docs` directory
- **API Docs**: http://localhost:8080/swagger-ui/index.html
- **Issues**: Check GitHub issues
- **Support**: Contact support team

---

Happy tracking! 🎉

