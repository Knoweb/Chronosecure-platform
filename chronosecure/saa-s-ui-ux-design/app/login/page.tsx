import { LoginForm } from "@/components/auth/login-form"
import { Clock } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-8 w-8" />
          <span className="font-bold text-2xl">ChronoSecure</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-balance leading-tight">
            Secure attendance tracking for modern businesses
          </h1>
          <p className="text-lg text-primary-foreground/90 text-pretty leading-relaxed">
            Biometric verification, automated payroll, and comprehensive reporting in one powerful platform.
          </p>
        </div>
        <div className="text-sm text-primary-foreground/80">&copy; 2025 ChronoSecure. All rights reserved.</div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <Clock className="h-8 w-8 text-primary" />
              <span className="font-bold text-2xl">ChronoSecure</span>
            </div>
            <h2 className="text-3xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>
          <LoginForm />
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
