# ChronoSecure Setup Instructions

## Prerequisites

The backend requires PostgreSQL to be running. Here's how to set it up:

### 1. Install PostgreSQL (if not already installed)

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
```

### 2. Start PostgreSQL Service

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Enable auto-start on boot
```

### 3. Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE DATABASE chronosecure_db;
ALTER USER postgres WITH PASSWORD 'securepassword123';
\q
```

### 4. Verify PostgreSQL is Running

```bash
sudo systemctl status postgresql
# Should show "active (running)"
```

### 5. Start the Backend

```bash
cd backend
./mvnw spring-boot:run
```

The backend will automatically create the database tables on first run (using `spring.jpa.hibernate.ddl-auto=update`).

### 6. Start the Frontend (in a new terminal)

```bash
cd frontend
npm install
npm run dev
```

## Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api/v1
- **Swagger UI**: http://localhost:8080/swagger-ui.html

## Troubleshooting

### If PostgreSQL connection fails:
1. Check if PostgreSQL is running: `sudo systemctl status postgresql`
2. Check if port 5432 is listening: `sudo netstat -tlnp | grep 5432`
3. Verify database exists: `sudo -u postgres psql -l | grep chronosecure_db`

### If backend fails to start:
1. Check Java version: `java -version` (should be 17+)
2. Check Maven: `./mvnw --version`
3. Check logs: Look at the console output for specific errors

### Database Configuration

The database configuration is in `backend/src/main/resources/application.properties`:
- Database: `chronosecure_db`
- Username: `postgres`
- Password: `securepassword123`
- Host: `localhost:5432`

You can modify these values if needed.

