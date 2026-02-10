import { Link } from 'react-router-dom'
import { Clock, CheckCircle2 } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.02fr,0.98fr] bg-white text-foreground">
      {/* Left hero panel */}
      <div className="bg-primary text-primary-foreground flex flex-col justify-between px-14 py-14">
        <Link to="/" className="flex items-center gap-2 mb-10 hover:opacity-90 transition-opacity w-fit">
          <Clock className="h-6 w-6 text-primary-foreground" />
          <span className="font-bold text-xl">ChronoSecure</span>
        </Link>

        <div className="space-y-6">
          <h1 className="text-4xl md:text-[48px] font-bold leading-tight">
            Secure attendance tracking
            <span className="block">for modern businesses</span>
          </h1>
          <p className="text-base md:text-lg text-primary-foreground/90 max-w-xl leading-relaxed">
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

      {/* Right form panel */}
      <div className="flex items-center justify-center px-8 py-14 lg:px-20">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>
          <div className="bg-card border rounded-2xl shadow-lg p-11 space-y-6">
            <LoginForm />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
