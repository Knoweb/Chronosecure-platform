# ChronoSecure - Quick Start Guide

## ✅ Backend Status

The backend is **currently running** on port 8080!

- **Backend API**: http://localhost:8080/api/v1
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **API Docs**: http://localhost:8080/v3/api-docs

## 🚀 Start the Frontend

Open a new terminal and run:

```bash
cd /home/sahan/Documents/chronosecure/frontend
npm install
npm run dev
```

The frontend will start on **http://localhost:5173**

## 📝 First Steps

1. **Access the Application**: Open http://localhost:5173 in your browser
2. **Sign Up**: Create a new account (this will create a company)
3. **Login**: Use your credentials to log in
4. **Add Employees**: Go to the Employees page and add your first employee
5. **Test Kiosk**: Visit the Kiosk page to test attendance logging

## 🔧 Backend Management

### Stop the Backend
```bash
# Find the process
ps aux | grep BackendApplication

# Kill it (replace PID with actual process ID)
kill <PID>
```

### Restart the Backend
```bash
cd /home/sahan/Documents/chronosecure/backend
./mvnw spring-boot:run
```

### View Backend Logs
```bash
tail -f /tmp/spring-boot.log
```

## 🗄️ Database

- **Database**: chronosecure_db
- **Host**: localhost:5432
- **User**: postgres
- **Password**: securepassword123

The database tables are automatically created by Hibernate on first run.

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/signup` - Sign up
- `POST /api/v1/auth/logout` - Logout

### Employees
- `GET /api/v1/employees` - List employees
- `POST /api/v1/employees` - Create employee
- `GET /api/v1/employees/{id}` - Get employee
- `PUT /api/v1/employees/{id}` - Update employee
- `DELETE /api/v1/employees/{id}` - Delete employee

### Attendance
- `POST /api/v1/attendance/log` - Log attendance event
- `GET /api/v1/attendance/next-state/{companyId}/{employeeId}` - Get next expected state

### Reports
- `GET /api/v1/reports/company?startDate=...&endDate=...` - Download company report
- `GET /api/v1/reports/employee/{employeeId}?startDate=...&endDate=...` - Download employee report

### Compliance
- `GET /api/v1/compliance/export/{employeeId}` - Export employee data (GDPR)
- `DELETE /api/v1/compliance/delete/{employeeId}` - Hard delete employee data (GDPR)
- `POST /api/v1/compliance/consent/{employeeId}/grant` - Grant biometric consent (BIPA)
- `GET /api/v1/compliance/audit-logs` - Get audit logs (APPI)

## 🐛 Troubleshooting

### Frontend can't connect to backend
- Check backend is running: `curl http://localhost:8080/swagger-ui.html`
- Check CORS settings in `backend/src/main/java/com/chronosecure/backend/config/SecurityConfig.java`

### Database connection errors
- Verify PostgreSQL is running: `pg_isready -h localhost -p 5432`
- Check database exists: `psql -h localhost -U postgres -l | grep chronosecure_db`

### Port already in use
- Find process using port 8080: `lsof -i :8080` or `netstat -tlnp | grep 8080`
- Kill the process or change port in `application.properties`

## 📖 Documentation

- See `SETUP_INSTRUCTIONS.md` for detailed setup
- API documentation available at http://localhost:8080/swagger-ui.html

