# Setup Guide

This guide will walk you through setting up ChronoSecure on your local development environment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Database Configuration](#database-configuration)
5. [Environment Variables](#environment-variables)
6. [Running the Application](#running-the-application)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Java 17+**: [Download OpenJDK 17](https://adoptium.net/)
- **Node.js 18+**: [Download Node.js](https://nodejs.org/)
- **PostgreSQL 14+**: [Download PostgreSQL](https://www.postgresql.org/download/)
- **Maven 3.8+**: Included with Spring Boot wrapper
- **Redis** (Optional): [Download Redis](https://redis.io/download)

### Verify Installation

```bash
# Check Java version
java -version  # Should show 17 or higher

# Check Node.js version
node -v  # Should show 18 or higher

# Check PostgreSQL
psql --version  # Should show 14 or higher

# Check Maven (if installed separately)
mvn -v
```

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Configure Database

Edit `src/main/resources/application.properties`:

```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/chronosecure_db
spring.datasource.username=chronosecure_user
spring.datasource.password=your_secure_password

# JWT Secret (Generate a secure random string)
jwt.secret=your-jwt-secret-key-minimum-256-bits

# Encryption Password (For Jasypt)
jasypt.encryptor.password=your-encryption-password
```

### 3. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE chronosecure_db;
CREATE USER chronosecure_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE chronosecure_db TO chronosecure_user;
\q
```

### 4. Initialize Database Schema

The schema will be auto-created on first run, or you can manually run:

```bash
psql -U chronosecure_user -d chronosecure_db -f src/main/resources/schema.sql
```

### 5. Build and Run

```bash
# Using Maven Wrapper (Recommended)
./mvnw clean install
./mvnw spring-boot:run

# Or using installed Maven
mvn clean install
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### 6. Verify Backend

- API Health: http://localhost:8080/
- Swagger UI: http://localhost:8080/swagger-ui/index.html
- API Docs: http://localhost:8080/v3/api-docs

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure API Endpoint

Edit `src/lib/axios.ts` if your backend is not on `http://localhost:8080`:

```typescript
const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  // ...
});
```

### 4. Run Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## Database Configuration

### PostgreSQL Setup

1. **Install PostgreSQL** (if not already installed)

   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # macOS (using Homebrew)
   brew install postgresql
   brew services start postgresql

   # Windows: Download from postgresql.org
   ```

2. **Start PostgreSQL Service**

   ```bash
   # Linux
   sudo systemctl start postgresql
   sudo systemctl enable postgresql

   # macOS
   brew services start postgresql

   # Windows: Start from Services
   ```

3. **Create Database and User**

   ```sql
   -- Connect as postgres user
   sudo -u postgres psql

   -- Create database
   CREATE DATABASE chronosecure_db;

   -- Create user
   CREATE USER chronosecure_user WITH PASSWORD 'your_secure_password';

   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE chronosecure_db TO chronosecure_user;

   -- Connect to database and grant schema privileges
   \c chronosecure_db
   GRANT ALL ON SCHEMA public TO chronosecure_user;

   -- Exit
   \q
   ```

### Redis Setup (Optional)

Redis is used for caching and session management. It's optional for development.

```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis

# Windows: Download from redis.io
```

## Environment Variables

### Backend Environment Variables

Create `.env` file in `backend/` directory (or set system environment variables):

```bash
# Database
DB_URL=jdbc:postgresql://localhost:5432/chronosecure_db
DB_USERNAME=chronosecure_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your-jwt-secret-key-minimum-256-bits

# Encryption
JASYPT_PASSWORD=your-encryption-password

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# File Storage (S3 or Local)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=chronosecure-uploads
STORAGE_TYPE=local  # or 's3'
```

### Frontend Environment Variables

Create `.env` file in `frontend/` directory:

```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_APP_NAME=ChronoSecure
```

## Running the Application

### Development Mode

1. **Start Backend** (Terminal 1)
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

2. **Start Frontend** (Terminal 2)
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - Swagger UI: http://localhost:8080/swagger-ui/index.html

### Production Mode

1. **Build Backend**
   ```bash
   cd backend
   ./mvnw clean package
   java -jar target/backend-0.0.1-SNAPSHOT.jar
   ```

2. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   # Serve the dist/ folder with a web server (nginx, Apache, etc.)
   ```

## Troubleshooting

### Backend Issues

**Problem: Port 8080 already in use**
```bash
# Find process using port 8080
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Kill the process or change port in application.properties
server.port=8081
```

**Problem: Database connection failed**
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check credentials in `application.properties`
- Verify database exists: `psql -U chronosecure_user -d chronosecure_db -c "SELECT 1;"`

**Problem: JWT secret too short**
- Generate a secure secret: `openssl rand -base64 32`
- Update `jwt.secret` in `application.properties`

### Frontend Issues

**Problem: Cannot connect to API**
- Verify backend is running on port 8080
- Check CORS configuration in `SecurityConfig.java`
- Verify API base URL in `src/lib/axios.ts`

**Problem: Module not found errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Problem: Port 5173 already in use**
```bash
# Change port in vite.config.ts or use different port
npm run dev -- --port 3000
```

### Database Issues

**Problem: Schema not created**
- Check `spring.jpa.hibernate.ddl-auto=update` in `application.properties`
- Manually run `schema.sql` if needed
- Check database user has CREATE privileges

**Problem: Migration errors**
- Ensure PostgreSQL version is 14+
- Check for conflicting data
- Review error logs in backend console

## Next Steps

After successful setup:

1. Create your first company account via signup
2. Add employees through the Employees page
3. Enroll fingerprints for employees
4. Test attendance logging at the Kiosk page
5. Generate reports from the Reports page

For more information, see:
- [API Documentation](API.md)
- [User Guide](USER_GUIDE.md)
- [Architecture](ARCHITECTURE.md)

