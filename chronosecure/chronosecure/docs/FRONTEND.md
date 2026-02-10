# ChronoSecure Frontend Documentation

## Overview

The ChronoSecure frontend is built with React 19.2.0, TypeScript, and Vite. It uses Shadcn/UI components styled with Tailwind CSS.

## Project Structure

```
frontend/
├── public/                 # Static assets
│   ├── hero-biometric.jpg
│   └── security-shield.jpg
├── src/
│   ├── components/         # Reusable components
│   │   ├── auth/          # Authentication components
│   │   ├── biometric/     # Biometric components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── employees/     # Employee management
│   │   ├── layout/         # Layout components
│   │   └── ui/             # Shadcn UI components
│   ├── lib/                # Utilities
│   │   ├── axios.ts        # API client
│   │   ├── biometric.ts   # Biometric utilities
│   │   └── utils.ts        # General utilities
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Employees.tsx
│   │   ├── Kiosk.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Landing.tsx
│   │   └── ForgotPassword.tsx
│   ├── store/              # State management
│   │   └── authStore.ts    # Zustand auth store
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Key Technologies

- **React 19.2.0**: UI library
- **TypeScript 5.9.3**: Type safety
- **Vite 7.2.4**: Build tool and dev server
- **TanStack Query 5.90.12**: Server state management
- **Zustand 5.0.1**: Client state management
- **React Router DOM 6.28.0**: Routing
- **Axios 1.13.2**: HTTP client
- **Tailwind CSS 3.4.13**: Styling
- **Shadcn/UI**: Component library (Radix UI)

## Pages

### Landing Page (`/`)
Public landing page with:
- Hero section
- Features grid
- Product details
- Security section
- Pricing cards
- CTA banner

### Login Page (`/login`)
Authentication page with:
- Email/password login
- "Forgot password" link
- Link to signup
- V0 design layout

### Signup Page (`/signup`)
Registration page with:
- Company creation
- User registration
- Automatic Company Admin role
- V0 design layout

### Dashboard (`/dashboard`)
Protected dashboard showing:
- Statistics cards
- Recent attendance
- Today's overview
- Quick actions

### Employees (`/employees`)
Employee management with:
- Employee list
- Add employee form
- Fingerprint enrollment
- Edit/delete actions

### Kiosk (`/kiosk`)
Public kiosk mode for attendance:
- Employee code input
- Fingerprint verification
- Photo capture
- Liveness detection
- Next event state detection
- Support for all event types (Clock In/Out, Break Start/End)

### Reports (`/reports`)
Attendance reporting:
- Date range selection
- Employee filtering
- Excel export
- Analytics charts

## Components

### Authentication Components

#### `LoginForm`
- Email/password input
- Error handling
- Loading states
- Link to forgot password

#### `SignupForm`
- Company name input
- User details form
- Error handling
- Success feedback

### Biometric Components

#### `FingerprintEnrollment`
- WebAuthn integration
- Biometric capability detection
- Consent management
- Enrollment flow

### Layout Components

#### `Sidebar`
- Navigation menu
- Role-based menu items
- Active route highlighting

#### `Header`
- User profile
- Logout button
- Notifications (future)

### Dashboard Components

#### `StatsCard`
- Display statistics
- Icons and labels
- Trend indicators

#### `RecentAttendance`
- Recent attendance list
- Event type badges
- Timestamps

#### `TodayOverview`
- Today's activity summary
- Quick stats

## State Management

### TanStack Query (Server State)

Used for:
- API data fetching
- Caching
- Background refetching
- Optimistic updates

Example:
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['employees', companyId],
  queryFn: async () => {
    const response = await api.get('/employees')
    return response.data
  },
  enabled: !!companyId,
})
```

### Zustand (Client State)

Used for:
- Authentication state
- User preferences
- UI state

Example:
```typescript
const token = useAuthStore((state) => state.token)
const setToken = useAuthStore((state) => state.setToken)
```

## API Integration

### Axios Instance (`lib/axios.ts`)

Configured with:
- Base URL: `http://localhost:8080/api/v1`
- Request interceptor: Adds JWT token and `X-Company-Id` header
- Response interceptor: Handles 401 errors (logout)

### API Calls

All API calls use the configured axios instance:

```typescript
import { api } from '@/lib/axios'

// GET request
const response = await api.get('/employees')

// POST request
const response = await api.post('/attendance/log', data)
```

## Biometric Integration

### WebAuthn Support

The frontend uses WebAuthn API for biometric authentication:
- Touch ID (macOS/iOS)
- Face ID (iOS)
- Windows Hello
- USB fingerprint readers

### Biometric Utilities (`lib/biometric.ts`)

Functions:
- `isWebAuthnSupported()`: Check browser support
- `hasBiometricCapability()`: Check device capability
- `enrollFingerprint()`: Enroll fingerprint
- `verifyFingerprint()`: Verify fingerprint
- `generateFingerprintHashFallback()`: Fallback for testing

## Routing

Routes defined in `App.tsx`:

```typescript
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
  <Route path="/kiosk" element={<KioskPage />} />
  <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
</Routes>
```

## Styling

### Tailwind CSS

Global styles in `index.css`:
- Tailwind directives
- Custom CSS variables
- Inter font import

### Shadcn/UI Components

Components in `components/ui/`:
- Button
- Input
- Card
- Alert
- Badge
- Table
- Avatar
- DropdownMenu
- Select

All styled with Tailwind and customizable via CSS variables.

## Environment Variables

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_APP_NAME=ChronoSecure
```

## Development

### Start Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## TypeScript

Strict mode enabled in `tsconfig.json`:
- No implicit any
- Strict null checks
- Strict function types

## Path Aliases

Configured in `vite.config.ts` and `tsconfig.json`:
- `@/` → `src/`

Usage:
```typescript
import { api } from '@/lib/axios'
import { Button } from '@/components/ui/button'
```

## Best Practices

1. **Component Structure**: Functional components with TypeScript
2. **State Management**: TanStack Query for server state, Zustand for client state
3. **Error Handling**: Try-catch blocks and error boundaries
4. **Loading States**: Loading indicators for async operations
5. **Type Safety**: Strict TypeScript typing
6. **Code Splitting**: Lazy loading for routes (future)
7. **Accessibility**: ARIA labels and keyboard navigation

## Testing (Future)

- Unit tests with Vitest
- Component tests with React Testing Library
- E2E tests with Playwright

## Performance Optimization

- Code splitting
- Lazy loading
- Image optimization
- Bundle size optimization
- Memoization for expensive computations

---

For component-specific documentation, see individual component files.

