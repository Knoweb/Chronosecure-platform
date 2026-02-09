# ChronoSecure - SaaS Employee Attendance System

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)

A secure, compliant, and automated attendance tracking system using biometric (fingerprint hash) and photographic verification to provide workforce analytics.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Compliance](#compliance)
- [Security](#security)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

ChronoSecure is a cloud-native, multi-tenant SaaS application designed for secure employee attendance tracking. It combines biometric fingerprint verification with photo capture to eliminate time theft and ensure compliance with international privacy regulations.

### Core Philosophy

- **API-First**: Backend serves as a set of independent REST APIs. Frontend is decoupled.
- **Security First**: Zero-trust architecture. Biometric and personal data protection is the highest priority.
- **Scalability**: Design must handle growth from small businesses to enterprise chains.

## ✨ Features

### Authentication & Authorization
- Role-Based Access Control (RBAC): Super Admin, Company Admin, Employee
- JWT-based stateless authentication
- Multi-tenant data isolation
- Secure password hashing (BCrypt)

### Biometric Authentication
- WebAuthn-based fingerprint enrollment
- Support for Touch ID, Face ID, Windows Hello, USB fingerprint readers
- Encrypted fingerprint template storage (BIPA compliant)
- Explicit consent management

### Attendance Tracking
- Clock In/Out functionality
- Break management (Start/End Break)
- Photo capture with liveness detection
- Automatic next event state detection
- Multi-device support (Kiosk mode)

### Analytics & Reporting
- Real-time attendance dashboards
- Automated hours calculation (Net Hours, Overtime)
- Weekday/Weekend/Public Holiday differentiation
- Excel report generation (.xlsx)
- Payroll-ready data export

### Compliance Features
- **GDPR**: Right to be Forgotten, Data Portability
- **BIPA**: Encrypted biometric storage, explicit consent
- **APPI**: Comprehensive audit logging
- **Privacy Act/APPs**: Transparent data management

## 🛠 Technology Stack

### Backend
- **Framework**: Java Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: PostgreSQL (Primary), Redis (Caching)
- **Security**: Spring Security, JWT (JJWT 0.12.3)
- **Documentation**: OpenAPI/Swagger
- **Encryption**: Jasypt (AES-256)
- **File Storage**: AWS S3 SDK (optional, local storage supported)
- **Reports**: Apache POI (Excel generation)

### Frontend
- **Framework**: React 19.2.0 with TypeScript 5.9.3
- **Build Tool**: Vite 7.2.4
- **UI Components**: Shadcn/UI (Radix UI primitives)
- **Styling**: Tailwind CSS 3.4.13
- **State Management**: 
  - TanStack Query (React Query) for server state
  - Zustand for client state
- **Routing**: React Router DOM 6.28.0
- **HTTP Client**: Axios 1.13.2

## 🏗 Architecture

### System Architecture

```
┌─────────────────┐
│   React Frontend │  (Port 5173)
│   (Vite + TS)   │
└────────┬────────┘
         │ HTTPS/REST API
         │
┌────────▼────────┐
│  Spring Boot    │  (Port 8080)
│   Backend API   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│PostgreSQL│ │ Redis │
│Database │ │ Cache │
└────────┘ └───────┘
```

### Layered Architecture (Backend)

```
Controller Layer (REST APIs)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
Database (PostgreSQL)
```

### Multi-Tenancy

All primary tables include `company_id` for strict data isolation:
- `employees` table: `company_id` foreign key
- `attendance_logs` table: `company_id` foreign key
- `users` table: `company_id` for tenant association

## 🚀 Quick Start

### Prerequisites

- Java 17 or higher
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis (optional, for caching)
- Maven 3.8+

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd chronosecure
```

2. **Configure PostgreSQL**
```bash
# Create database
createdb chronosecure_db

# Or using psql
psql -U postgres
CREATE DATABASE chronosecure_db;
CREATE USER chronosecure_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE chronosecure_db TO chronosecure_user;
```

3. **Configure Backend**
Edit `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/chronosecure_db
spring.datasource.username=chronosecure_user
spring.datasource.password=your_password
```

4. **Run Backend**
```bash
cd backend
./mvnw spring-boot:run
```

Backend will be available at `http://localhost:8080`
Swagger UI: `http://localhost:8080/swagger-ui/index.html`

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Run Development Server**
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

### Initial Setup

1. **Create Super Admin Account**
   - Navigate to `/signup`
   - Create a new company account (automatically becomes Company Admin)
   - First user becomes the Super Admin

2. **Access Dashboard**
   - Login at `/login`
   - Access dashboard at `/dashboard`

## 📚 Documentation

- [API Documentation](./docs/API.md) - Complete REST API reference
- [Database Schema](./docs/DATABASE.md) - Database structure and relationships
- [Frontend Components](./docs/FRONTEND.md) - React components and pages
- [Security Guide](./docs/SECURITY.md) - Security features and best practices
- [Compliance Guide](./docs/COMPLIANCE.md) - GDPR, BIPA, APPI compliance details
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment instructions
- [Fingerprint Integration](./FINGERPRINT_INTEGRATION.md) - Biometric authentication guide

## 🔒 Compliance

ChronoSecure is designed to comply with:

- **GDPR (EU & UK)**: Right to be Forgotten, Data Portability
- **BIPA (Illinois, US)**: Encrypted biometric storage, explicit consent
- **APPI (Japan)**: Comprehensive audit logging
- **Privacy Act / APPs (Australia)**: Transparent data management

See [Compliance Guide](./docs/COMPLIANCE.md) for details.

## 🔐 Security

- Zero-trust architecture
- JWT-based stateless authentication
- AES-256 encryption for sensitive data
- Multi-tenant data isolation
- Audit logging for all data access
- Liveness detection to prevent photo spoofing

See [Security Guide](./docs/SECURITY.md) for details.

## 📖 API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

See [API Documentation](./docs/API.md) for complete reference.

## 💻 Development

### Backend Development

```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Running Tests

**Backend Tests:**
```bash
cd backend
./mvnw test
```

**Frontend Tests:**
```bash
cd frontend
npm test
```

### Code Style

- Backend: Follow Spring Boot conventions
- Frontend: ESLint + Prettier configuration
- TypeScript: Strict mode enabled

## 🚢 Deployment

See [Deployment Guide](./docs/DEPLOYMENT.md) for:
- Production environment setup
- Docker containerization
- AWS deployment
- Environment variables configuration
- SSL/TLS setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Contact the development team
- Check the [Documentation](./docs/) directory

## 🙏 Acknowledgments

- Spring Boot team for the excellent framework
- React team for the UI library
- Shadcn/UI for the component library
- All contributors and users

---

**ChronoSecure** - Secure attendance tracking for modern businesses
