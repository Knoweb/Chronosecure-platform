# Architecture Documentation

## System Overview

ChronoSecure follows a **microservices-ready, API-first architecture** with clear separation between frontend and backend. The system is designed for scalability, security, and compliance with international privacy regulations.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pages   │  │Components│  │  Store   │  │   API    │   │
│  │          │  │          │  │ (Zustand)│  │ (Axios)  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS/REST API
                            │ JWT Authentication
┌───────────────────────────▼─────────────────────────────────┐
│                   Backend (Spring Boot)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Controllers  │→ │   Services   │→ │ Repositories │    │
│  │  (REST API)  │  │  (Business)  │  │   (Data)     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │                │                    │           │
│         └────────────────┴────────────────────┘           │
│                            │                              │
└────────────────────────────┼──────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼──────┐    ┌────────▼────────┐  ┌──────▼──────┐
│  PostgreSQL  │    │      Redis      │  │  S3/Local   │
│  (Primary)   │    │    (Cache)      │  │  (Storage)  │
└──────────────┘    └─────────────────┘  └─────────────┘
```

## Backend Architecture

### Layered Architecture

The backend follows a strict layered architecture:

```
Controller Layer (REST API)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
Database (PostgreSQL)
```

### Package Structure

```
com.chronosecure.backend/
├── config/              # Configuration classes
│   ├── SecurityConfig.java
│   └── ...
├── controller/          # REST controllers
│   ├── AuthController.java
│   ├── EmployeeController.java
│   ├── AttendanceController.java
│   ├── BiometricController.java
│   └── ...
├── service/            # Business logic interfaces
│   ├── AuthService.java
│   ├── EmployeeService.java
│   └── ...
├── service/impl/       # Service implementations
│   ├── AuthServiceImpl.java
│   ├── EmployeeServiceImpl.java
│   └── ...
├── repository/         # Data access layer
│   ├── UserRepository.java
│   ├── EmployeeRepository.java
│   └── ...
├── model/              # Entity classes
│   ├── User.java
│   ├── Employee.java
│   ├── AttendanceLog.java
│   └── ...
├── dto/                # Data Transfer Objects
│   ├── LoginRequest.java
│   ├── EmployeeCreateRequest.java
│   └── ...
├── security/           # Security components
│   ├── JwtAuthenticationFilter.java
│   └── JwtUtil.java
└── exception/          # Exception handling
    └── GlobalExceptionHandler.java
```

### Key Components

#### 1. Controllers
- Handle HTTP requests/responses
- Validate input using Jakarta Validation
- Delegate business logic to services
- Return appropriate HTTP status codes

#### 2. Services
- Contain business logic
- Handle transactions
- Coordinate between repositories
- Implement compliance requirements

#### 3. Repositories
- Extend Spring Data JPA repositories
- Provide type-safe database queries
- Handle multi-tenant data isolation

#### 4. Models (Entities)
- Represent database tables
- Use JPA annotations
- Include Lombok for boilerplate reduction

## Frontend Architecture

### Component Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/            # Shadcn UI components
│   ├── auth/          # Authentication components
│   ├── biometric/     # Biometric components
│   ├── employees/     # Employee management
│   └── layout/        # Layout components
├── pages/              # Page components
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Employees.tsx
│   ├── Kiosk.tsx
│   └── ...
├── lib/                # Utilities and configurations
│   ├── axios.ts       # API client
│   ├── biometric.ts   # Biometric utilities
│   └── utils.ts       # Helper functions
├── store/              # State management
│   └── authStore.ts   # Zustand store
└── App.tsx            # Main app component
```

### State Management

- **TanStack Query**: Server state (API data, caching)
- **Zustand**: Client state (auth, UI state)
- **React State**: Component-local state

### Routing

React Router DOM handles client-side routing:
- `/` - Landing page
- `/login` - Login page
- `/signup` - Signup page
- `/dashboard` - Dashboard (protected)
- `/employees` - Employee management (protected)
- `/kiosk` - Attendance kiosk
- `/reports` - Reports (protected)

## Multi-Tenancy

### Tenant Isolation Strategy

ChronoSecure uses **Row-Level Security** with `company_id` foreign keys:

1. **Database Level**: All tables include `company_id`
2. **Application Level**: All queries filter by `company_id`
3. **API Level**: `X-Company-Id` header required for authenticated requests

### Tenant Identification

- **Signup**: Creates new company with unique subdomain
- **Login**: JWT token includes `companyId`
- **Requests**: `X-Company-Id` header validates tenant

## Security Architecture

### Authentication Flow

```
1. User submits credentials
   ↓
2. Backend validates credentials
   ↓
3. Backend generates JWT token (includes userId, companyId, role)
   ↓
4. Frontend stores token
   ↓
5. Frontend includes token in Authorization header
   ↓
6. Backend validates token on each request
   ↓
7. Backend extracts companyId and enforces tenant isolation
```

### Authorization

**Role-Based Access Control (RBAC):**

- **SUPER_ADMIN**: Full system access
- **COMPANY_ADMIN**: Full company access
- **EMPLOYEE**: Limited access (own data)

### Data Encryption

1. **At Rest**: Jasypt encryption for sensitive fields
2. **In Transit**: HTTPS/TLS
3. **Biometric Data**: AES-256 encrypted hashes only

## Database Schema

### Core Tables

1. **companies**: Tenant information
2. **users**: System users (admins, employees)
3. **employees**: Employee records
4. **attendance_logs**: Attendance events
5. **calculated_hours**: Daily hour summaries
6. **consent_records**: BIPA consent tracking
7. **audit_logs**: APPI compliance logging

See [DATABASE.md](DATABASE.md) for detailed schema.

## API Design

### RESTful Principles

- **Resources**: Nouns (employees, attendance)
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Status Codes**: Standard HTTP codes
- **JSON**: Request/response format

### API Versioning

- Current version: `/api/v1`
- Future versions: `/api/v2`, etc.

## Scalability Considerations

### Horizontal Scaling

- **Stateless Backend**: JWT allows load balancing
- **Database**: Read replicas for reporting
- **Caching**: Redis for frequently accessed data
- **File Storage**: S3 for photo storage

### Performance Optimization

- **Database Indexing**: On `company_id`, `employee_id`, `event_timestamp`
- **Query Optimization**: Eager loading where appropriate
- **Caching Strategy**: Redis for user sessions, company configs
- **CDN**: For static frontend assets

## Compliance Architecture

### GDPR Compliance

- **Right to Erasure**: Hard delete endpoints
- **Data Portability**: Export endpoints
- **Consent Management**: Explicit consent tracking

### BIPA Compliance

- **Biometric Storage**: Encrypted hashes only
- **Consent Records**: Explicit consent before enrollment
- **Revocation**: Consent can be revoked

### APPI Compliance

- **Audit Logging**: All data access logged
- **Access Control**: Strict RBAC
- **Data Leakage Prevention**: Multi-tenant isolation

## Deployment Architecture

### Development

```
Frontend (Vite Dev Server) → Backend (Spring Boot) → PostgreSQL (Local)
```

### Production

```
CDN → Frontend (Static) → Load Balancer → Backend (Multiple Instances)
                                      ↓
                              PostgreSQL (Primary + Replicas)
                                      ↓
                              Redis (Cache Cluster)
                                      ↓
                              S3 (File Storage)
```

## Technology Choices

### Backend

- **Spring Boot**: Rapid development, production-ready
- **PostgreSQL**: ACID compliance, JSON support
- **JWT**: Stateless authentication
- **Jasypt**: Field-level encryption

### Frontend

- **React**: Component-based, large ecosystem
- **TypeScript**: Type safety
- **TanStack Query**: Efficient server state management
- **Shadcn/UI**: Accessible, customizable components

## Future Enhancements

1. **Microservices**: Split into separate services
2. **Event Sourcing**: For audit trail
3. **GraphQL**: Alternative API layer
4. **WebSocket**: Real-time updates
5. **Mobile Apps**: React Native integration

