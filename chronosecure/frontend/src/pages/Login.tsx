import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.02fr,0.98fr] bg-white text-foreground">
      {/* Left hero panel */}
      {/* Left hero panel */}
      <div className="hidden lg:flex flex-col justify-between relative bg-slate-900 text-white px-14 py-14 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-biometric.jpg"
            alt="Security Background"
            className="h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40" />
        </div>

        {/* Content (z-10 to stay on top) */}
        <div className="relative z-10 w-fit">
          <Link to="/" className="flex items-center gap-3 mb-10 hover:opacity-90 transition-opacity">
            <div className="relative bg-black/40 backdrop-blur-sm p-2 rounded-lg shadow-md ring-1 ring-white/20">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">AttendWatch</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl md:text-[48px] font-bold leading-tight drop-shadow-lg">
            Secure attendance tracking
            <span className="block text-emerald-400">for modern businesses</span>
          </h1>
          <p className="text-lg text-slate-200 max-w-xl leading-relaxed drop-shadow-md">
            Biometric verification, automated payroll, and comprehensive reporting in one powerful platform.
          </p>
          <div className="space-y-4 text-sm font-medium">
            <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm p-3 rounded-lg border border-white/10 w-fit">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>GDPR &amp; BIPA compliant</span>
            </div>
            <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm p-3 rounded-lg border border-white/10 w-fit">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>Biometric &amp; photo verification</span>
            </div>
            <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm p-3 rounded-lg border border-white/10 w-fit">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>Automated payroll-ready exports</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400 mt-10">
          © 2025 AttendWatch. All rights reserved.
        </div>
      </div>

      {/* Right form panel - Security Vault Light Theme */}
      <div className="relative flex items-center justify-center p-6 md:p-14 lg:px-20 bg-gradient-to-b from-slate-50 to-white lg:bg-none min-h-screen lg:min-h-0">

        <div className="w-full max-w-sm md:max-w-md space-y-8">

          {/* Mobile-only Security Header */}
          <div className="lg:hidden flex flex-col items-center text-center space-y-6">
            <Link to="/" className="inline-flex flex-col items-center gap-4 hover:opacity-90 transition-opacity">
              <div className="relative">
                {/* Dark Badge Container for Contrast */}
                <div className="relative bg-slate-900 p-4 rounded-2xl shadow-xl shadow-slate-200 ring-4 ring-white">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full animate-pulse"></div>
                  <CheckCircle2 className="relative h-10 w-10 text-emerald-500" strokeWidth={2.5} />

                  {/* Check Indicator */}
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1.5 border-2 border-white shadow-sm">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <span className="block font-extrabold text-3xl tracking-tighter text-slate-900">AttendWatch</span>
                <span className="block text-xs font-mono text-emerald-600 uppercase tracking-widest font-bold">Security Gateway</span>
              </div>
            </Link>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Authentication</h2>
            <p className="text-sm md:text-base text-muted-foreground">Enter credentials to access vault</p>
          </div>

          {/* Clean White Card */}
          <div className="bg-white border rounded-2xl shadow-xl p-6 md:p-10 space-y-6">
            <LoginForm />
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold text-primary hover:underline">
                Create new account
              </Link>
            </p>
          </div>

          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Secure Connection Established
            </p>
            <button
              onClick={() => {
                import('@/store/authStore').then(({ useAuthStore }) => {
                  useAuthStore.getState().setAuth({
                    id: 'demo-user',
                    email: 'demo@chronosecure.com',
                    role: 'COMPANY_ADMIN',
                    firstName: 'Demo',
                    lastName: 'Admin',
                    companyName: 'Demo Corp'
                  }, 'demo-token', 'demo-company-id');
                  window.location.href = '/dashboard';
                });
              }}
              className="text-xs text-slate-400 hover:text-slate-600 underline decoration-dotted transition-colors"
            >
              Preview Dashboard (Demo Mode)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
