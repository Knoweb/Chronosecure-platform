import { Link } from 'react-router-dom'
import { Clock, CheckCircle2 } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.02fr,0.98fr] bg-white text-foreground">
      {/* Left hero panel */}
      <div className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground px-14 py-14">
        <Link to="/" className="flex items-center gap-2 mb-10 hover:opacity-90 transition-opacity w-fit">
          <Clock className="h-6 w-6 text-primary-foreground" />
          <span className="font-bold text-xl">ChronoSecure</span>
        </Link>

        <div className="space-y-6">
          <h1 className="text-4xl md:text-[48px] font-bold leading-tight">
            Secure attendance tracking
            <span className="block">for modern businesses</span>
          </h1>
          <p className="text-lg text-primary-foreground/90 max-w-xl leading-relaxed">
            Biometric verification, automated payroll, and comprehensive reporting in one powerful platform.
          </p>
          <div className="space-y-2 text-sm font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
              <span>GDPR &amp; BIPA compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
              <span>Biometric &amp; photo verification</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
              <span>Automated payroll-ready exports</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-primary-foreground/80 mt-10">
          © 2025 TimeVault Secure. All rights reserved.
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
                <div className="relative bg-slate-900 p-4 rounded-2xl shadow-xl shadow-slate-200">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full animate-pulse"></div>
                  <CheckCircle2 className="relative h-10 w-10 text-emerald-500" strokeWidth={2.5} />

                  {/* Lock Indicator */}
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 border border-slate-100 shadow-sm">
                    <Clock className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <span className="block font-bold text-2xl tracking-tight text-slate-900">ChronoSecure</span>
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

          <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Secure Connection Established
          </p>
        </div>
      </div>
    </div>
  )
}
