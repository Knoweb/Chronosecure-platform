import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { SignupForm } from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 text-foreground">
      {/* Top navigation */}
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative bg-slate-900 p-2 rounded-lg shadow-md">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl">ChronoSecure</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link to="/login" className="text-primary hover:underline flex items-center gap-1">
              Sign in <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-12 items-center">
          {/* Hero copy + image */}
          {/* Hero copy + image */}
          <div className="hidden lg:block space-y-8">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-primary">Trusted by 500+ companies worldwide</p>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Attendance tracking
                <span className="block text-primary">reimagined</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Secure biometric time tracking with automated payroll calculations. ChronoSecure combines
                fingerprint verification and photo capture to eliminate time theft and ensure compliance.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
              <img
                src="/hero-biometric.jpg"
                alt="ChronoSecure attendance dashboard"
                className="w-full h-[340px] object-cover"
              />
            </div>
            <div className="text-sm text-muted-foreground flex flex-wrap gap-4">
              <span>No credit card required</span>
              <span className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" /> GDPR & BIPA compliant
              </span>
            </div>
          </div>

          {/* Auth card */}
          <div className="w-full">
            <div className="bg-card border rounded-2xl shadow-lg p-8 space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-3xl font-bold">Create your account</h2>
                <p className="text-muted-foreground">Start your 14-day free trial today</p>
              </div>
              <SignupForm />
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
