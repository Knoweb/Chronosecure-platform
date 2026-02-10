# ChronoSecure Deployment Guide

## Overview

This guide covers deploying ChronoSecure to production environments, including cloud platforms, containerization, and infrastructure setup.

## Prerequisites

- Java 17+ installed
- Node.js 18+ and npm
- PostgreSQL 14+ database
- Redis (optional, for caching)
- SSL/TLS certificate
- Domain name configured

## Environment Setup

### Backend Environment Variables

Create `backend/.env` or configure in your deployment platform:

```bash
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/chronosecure_db
SPRING_DATASOURCE_USERNAME=chronosecure_user
SPRING_DATASOURCE_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_jwt_secret_key_min_256_bits
JWT_EXPIRATION=86400000

# Encryption (Jasypt)
JASYPT_ENCRYPTOR_PASSWORD=your_encryption_password

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=chronosecure-uploads
AWS_REGION=us-east-1

# Redis (Optional)
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379
SPRING_REDIS_PASSWORD=your_redis_password

# Server
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=production

# Logging
LOGGING_LEVEL_ROOT=INFO
LOGGING_LEVEL_COM_CHRONOSECURE=DEBUG
```

### Frontend Environment Variables

Create `frontend/.env.production`:

```bash
VITE_API_BASE_URL=https://api.chronosecure.com/api/v1
VITE_APP_NAME=ChronoSecure
VITE_ENABLE_ANALYTICS=true
```

## Database Setup

### 1. Create Production Database

```sql
CREATE DATABASE chronosecure_db_prod;
CREATE USER chronosecure_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE chronosecure_db_prod TO chronosecure_user;
```

### 2. Run Schema

```bash
psql -U chronosecure_user -d chronosecure_db_prod -f backend/src/main/resources/schema.sql
```

### 3. Database Migrations

If using Flyway or Liquibase:

```bash
cd backend
./mvnw flyway:migrate
```

## Backend Deployment

### Option 1: JAR File Deployment

#### Build JAR

```bash
cd backend
./mvnw clean package -DskipTests
```

JAR file will be in `backend/target/backend-0.0.1-SNAPSHOT.jar`

#### Run JAR

```bash
java -jar backend/target/backend-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=production \
  --spring.datasource.url=jdbc:postgresql://localhost:5432/chronosecure_db_prod \
  --spring.datasource.username=chronosecure_user \
  --spring.datasource.password=secure_password
```

#### Systemd Service

Create `/etc/systemd/system/chronosecure-backend.service`:

```ini
[Unit]
Description=ChronoSecure Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=chronosecure
WorkingDirectory=/opt/chronosecure/backend
ExecStart=/usr/bin/java -jar /opt/chronosecure/backend/backend-0.0.1-SNAPSHOT.jar
Environment="SPRING_PROFILES_ACTIVE=production"
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable chronosecure-backend
sudo systemctl start chronosecure-backend
```

### Option 2: Docker Deployment

#### Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### Build and Run

```bash
cd backend
docker build -t chronosecure-backend .
docker run -d \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=production \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/chronosecure_db_prod \
  --name chronosecure-backend \
  chronosecure-backend
```

### Option 3: Cloud Platform Deployment

#### AWS Elastic Beanstalk

1. Install EB CLI:
```bash
pip install awsebcli
```

2. Initialize:
```bash
cd backend
eb init -p java-17 chronosecure-backend
```

3. Create environment:
```bash
eb create chronosecure-prod
```

4. Deploy:
```bash
eb deploy
```

#### Heroku

1. Install Heroku CLI
2. Login:
```bash
heroku login
```

3. Create app:
```bash
cd backend
heroku create chronosecure-backend
```

4. Set environment variables:
```bash
heroku config:set SPRING_DATASOURCE_URL=jdbc:postgresql://...
heroku config:set JWT_SECRET=...
```

5. Deploy:
```bash
git push heroku main
```

## Frontend Deployment

### Option 1: Static Hosting

#### Build

```bash
cd frontend
npm run build
```

Output in `frontend/dist/`

#### Deploy to Nginx

1. Copy files:
```bash
sudo cp -r frontend/dist/* /var/www/chronosecure/
```

2. Nginx configuration (`/etc/nginx/sites-available/chronosecure`):

```nginx
server {
    listen 80;
    server_name chronosecure.com www.chronosecure.com;
    
    root /var/www/chronosecure;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/chronosecure /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Option 2: Docker Deployment

#### Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Build and Run

```bash
cd frontend
docker build -t chronosecure-frontend .
docker run -d -p 80:80 --name chronosecure-frontend chronosecure-frontend
```

### Option 3: Cloud Platform Deployment

#### Vercel

```bash
cd frontend
npm install -g vercel
vercel --prod
```

#### Netlify

```bash
cd frontend
npm install -g netlify-cli
netlify deploy --prod
```

#### AWS S3 + CloudFront

1. Build:
```bash
npm run build
```

2. Upload to S3:
```bash
aws s3 sync dist/ s3://chronosecure-frontend --delete
```

3. Configure CloudFront distribution

## SSL/TLS Configuration

### Let's Encrypt (Certbot)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d chronosecure.com -d www.chronosecure.com
```

### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name chronosecure.com;

    ssl_certificate /etc/letsencrypt/live/chronosecure.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chronosecure.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... rest of configuration
}

server {
    listen 80;
    server_name chronosecure.com;
    return 301 https://$server_name$request_uri;
}
```

## Docker Compose (Full Stack)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: chronosecure_db_prod
      POSTGRES_USER: chronosecure_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/chronosecure_db_prod
      SPRING_DATASOURCE_USERNAME: chronosecure_user
      SPRING_DATASOURCE_PASSWORD: secure_password
      SPRING_REDIS_HOST: redis
      SPRING_REDIS_PORT: 6379
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

Run:

```bash
docker-compose up -d
```

## Monitoring and Logging

### Application Logs

Backend logs location:
- Development: Console
- Production: `/var/log/chronosecure/backend.log`

Log rotation configuration:
```bash
# /etc/logrotate.d/chronosecure
/var/log/chronosecure/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 chronosecure chronosecure
}
```

### Health Checks

Backend health endpoint:
```http
GET /actuator/health
```

### Monitoring Tools

- **Application**: Spring Boot Actuator
- **Infrastructure**: Prometheus + Grafana
- **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **APM**: New Relic or Datadog

## Backup Strategy

### Database Backups

Daily automated backup:

```bash
#!/bin/bash
# /usr/local/bin/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/chronosecure"
DB_NAME="chronosecure_db_prod"

pg_dump -U chronosecure_user -d $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete
```

Cron job:
```bash
0 2 * * * /usr/local/bin/backup-db.sh
```

### File Storage Backups

- S3: Enable versioning and lifecycle policies
- Local: Regular rsync to backup server

## Security Hardening

### Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Database Security

- Change default PostgreSQL port (optional)
- Use strong passwords
- Limit database access to application server only
- Enable SSL connections

### Application Security

- Keep dependencies updated
- Regular security patches
- Enable security headers
- Rate limiting
- WAF (Web Application Firewall)

## Scaling

### Horizontal Scaling

- Load balancer (Nginx, HAProxy, AWS ALB)
- Multiple backend instances
- Session stickiness (if using sessions)
- Database connection pooling

### Vertical Scaling

- Increase server resources
- Database optimization
- Caching (Redis)

## Disaster Recovery

### Backup Restoration

```bash
# Restore database
gunzip < backup.sql.gz | psql -U chronosecure_user -d chronosecure_db_prod
```

### Recovery Procedures

1. Identify failure point
2. Restore from backup
3. Verify data integrity
4. Resume operations
5. Post-incident review

## Performance Optimization

### Backend

- Enable JVM optimizations
- Database query optimization
- Caching strategies
- Connection pooling

### Frontend

- CDN for static assets
- Code splitting
- Image optimization
- Lazy loading

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database is running
   - Verify credentials
   - Check network connectivity

2. **JWT Token Expired**
   - Check token expiration settings
   - Implement token refresh

3. **CORS Errors**
   - Verify CORS configuration
   - Check allowed origins

4. **File Upload Fails**
   - Check S3 credentials
   - Verify bucket permissions
   - Check file size limits

## Support

For deployment issues:
- Check logs: `/var/log/chronosecure/`
- Review documentation
- Contact support team

---

For production deployment assistance, contact the DevOps team.

